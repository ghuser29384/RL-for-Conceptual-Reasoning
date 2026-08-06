-- Metaphilosophy controlled staging schema v3
-- Adds the transactional insertion RPC used only by the OIDC-authenticated hosted staging gateway.

begin;

create or replace function public.metaphilosophy_staging_gateway_insert_events(
  p_expected_sequence bigint,
  p_expected_head_hash text,
  p_events jsonb
)
returns table (inserted_count bigint, head_hash text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_sequence bigint;
  current_head_hash text;
  item jsonb;
  inserted bigint := 0;
begin
  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'gateway events payload must be an array';
  end if;
  if jsonb_array_length(p_events) > 250 then
    raise exception 'gateway events payload exceeds the 250-event limit';
  end if;

  perform pg_advisory_xact_lock(hashtext('metaphilosophy-staging-event-chain'));

  select sequence, event_hash
    into current_sequence, current_head_hash
    from public.metaphilosophy_staging_events
    order by sequence desc
    limit 1;

  current_sequence := coalesce(current_sequence, 0);
  current_head_hash := coalesce(current_head_hash, repeat('0', 64));

  if coalesce(p_expected_sequence, -1) <> current_sequence
     or coalesce(p_expected_head_hash, '') <> current_head_hash then
    raise exception 'staging chain changed before gateway append'
      using errcode = '40001';
  end if;

  for item in select value from jsonb_array_elements(p_events)
  loop
    if jsonb_typeof(item) <> 'object' then
      raise exception 'each gateway event must be an object';
    end if;
    if (item ->> 'sequence')::bigint <> current_sequence + 1 then
      raise exception 'gateway event sequence is not contiguous';
    end if;
    if item ->> 'prevHash' <> current_head_hash then
      raise exception 'gateway event previous hash does not match chain head';
    end if;
    if coalesce(item ->> 'eventHash', '') !~ '^[a-f0-9]{64}$' then
      raise exception 'gateway event hash is malformed';
    end if;
    if coalesce(item ->> 'type', '') = '' then
      raise exception 'gateway event type is required';
    end if;
    if jsonb_typeof(coalesce(item -> 'payload', '{}'::jsonb)) <> 'object' then
      raise exception 'gateway event payload must be an object';
    end if;

    insert into public.metaphilosophy_staging_events
      (sequence, event_id, event_type, aggregate_id, actor_id, payload, created_at, prev_hash, event_hash)
    values
      (
        (item ->> 'sequence')::bigint,
        (item ->> 'eventId')::uuid,
        item ->> 'type',
        nullif(item ->> 'aggregateId', ''),
        nullif(item ->> 'actorId', ''),
        coalesce(item -> 'payload', '{}'::jsonb),
        (item ->> 'createdAt')::timestamptz,
        item ->> 'prevHash',
        item ->> 'eventHash'
      );

    current_sequence := current_sequence + 1;
    current_head_hash := item ->> 'eventHash';
    inserted := inserted + 1;
  end loop;

  perform public.metaphilosophy_staging_assert_synthetic_only();

  return query select inserted, current_head_hash;
end;
$$;

comment on function public.metaphilosophy_staging_gateway_insert_events(bigint, text, jsonb) is
  'Transactional append endpoint for the OIDC-authenticated synthetic-only staging gateway. It never authorizes research ratings.';

revoke all on function public.metaphilosophy_staging_gateway_insert_events(bigint, text, jsonb) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function public.metaphilosophy_staging_gateway_insert_events(bigint, text, jsonb) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on function public.metaphilosophy_staging_gateway_insert_events(bigint, text, jsonb) from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.metaphilosophy_staging_gateway_insert_events(bigint, text, jsonb) to service_role';
  end if;
end
$$;

update public.metaphilosophy_staging_schema_metadata
set schema_version = 3,
    purpose = 'synthetic_rehearsal_only',
    research_ratings_authorized = false,
    updated_at = now()
where singleton = true;

commit;
