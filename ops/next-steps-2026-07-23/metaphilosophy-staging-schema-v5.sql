-- Metaphilosophy controlled staging schema v5
-- Adds release-scoped, repeatable restore drills while preserving every prior drill append-only.

begin;

create table if not exists public.metaphilosophy_staging_restore_runs (
  id uuid primary key,
  exact_release_sha text not null check (exact_release_sha ~ '^[a-f0-9]{40}$'),
  backup_sha256 text not null check (backup_sha256 ~ '^[a-f0-9]{64}$'),
  event_count bigint not null check (event_count > 0),
  head_hash text not null check (head_hash ~ '^[a-f0-9]{64}$'),
  research_ratings_authorized boolean not null default false check (research_ratings_authorized = false),
  created_at timestamptz not null default now(),
  unique (exact_release_sha, backup_sha256)
);

comment on table public.metaphilosophy_staging_restore_runs is
  'Append-only headers for independent synthetic restore drills. One exact release may replay the same backup, but different backups receive different run IDs.';

create table if not exists public.metaphilosophy_staging_restore_run_events (
  restore_run_id uuid not null references public.metaphilosophy_staging_restore_runs(id),
  sequence bigint not null,
  event_id uuid not null,
  event_type text not null check (length(event_type) between 3 and 120),
  aggregate_id text,
  actor_id text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null,
  prev_hash text not null check (prev_hash ~ '^[a-f0-9]{64}$'),
  event_hash text not null check (event_hash ~ '^[a-f0-9]{64}$'),
  restored_at timestamptz not null default now(),
  primary key (restore_run_id, sequence),
  unique (restore_run_id, event_id),
  unique (restore_run_id, event_hash)
);

comment on table public.metaphilosophy_staging_restore_run_events is
  'Append-only event copies for independent release-scoped restore drills. Existing drills are never cleared or overwritten.';

create or replace function public.metaphilosophy_staging_reject_restore_run_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  raise exception 'metaphilosophy staging restore-run evidence is append-only';
end;
$$;

revoke all on function public.metaphilosophy_staging_reject_restore_run_mutation() from public;

drop trigger if exists metaphilosophy_staging_restore_runs_reject_mutation
  on public.metaphilosophy_staging_restore_runs;
create trigger metaphilosophy_staging_restore_runs_reject_mutation
before update or delete on public.metaphilosophy_staging_restore_runs
for each row execute function public.metaphilosophy_staging_reject_restore_run_mutation();

drop trigger if exists metaphilosophy_staging_restore_run_events_reject_mutation
  on public.metaphilosophy_staging_restore_run_events;
create trigger metaphilosophy_staging_restore_run_events_reject_mutation
before update or delete on public.metaphilosophy_staging_restore_run_events
for each row execute function public.metaphilosophy_staging_reject_restore_run_mutation();

create or replace function public.metaphilosophy_staging_restore_run_enforce_chain()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  prior_sequence bigint;
  prior_hash text;
begin
  select sequence, event_hash
    into prior_sequence, prior_hash
    from public.metaphilosophy_staging_restore_run_events
    where restore_run_id = new.restore_run_id
    order by sequence desc
    limit 1;

  if prior_sequence is null then
    if new.sequence <> 1 or new.prev_hash <> repeat('0', 64) then
      raise exception 'restore run must begin at the genesis event';
    end if;
  elsif new.sequence <> prior_sequence + 1 or new.prev_hash <> prior_hash then
    raise exception 'restore run sequence or previous hash does not match its chain head';
  end if;

  return new;
end;
$$;

revoke all on function public.metaphilosophy_staging_restore_run_enforce_chain() from public;

drop trigger if exists metaphilosophy_staging_restore_run_events_chain
  on public.metaphilosophy_staging_restore_run_events;
create trigger metaphilosophy_staging_restore_run_events_chain
before insert on public.metaphilosophy_staging_restore_run_events
for each row execute function public.metaphilosophy_staging_restore_run_enforce_chain();

create or replace function public.metaphilosophy_staging_restore_run_load(
  p_restore_run_id uuid,
  p_exact_release_sha text,
  p_backup_sha256 text,
  p_expected_event_count bigint,
  p_expected_head_hash text,
  p_events jsonb
)
returns table (restore_run_id uuid, restored_count bigint, head_hash text, replay boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  item jsonb;
  current_sequence bigint := 0;
  current_head_hash text := repeat('0', 64);
  restored bigint := 0;
  prior public.metaphilosophy_staging_restore_runs%rowtype;
begin
  if p_restore_run_id is null then
    raise exception 'restore run ID is required';
  end if;
  if coalesce(p_exact_release_sha, '') !~ '^[a-f0-9]{40}$' then
    raise exception 'exact release SHA is malformed';
  end if;
  if coalesce(p_backup_sha256, '') !~ '^[a-f0-9]{64}$' then
    raise exception 'backup SHA-256 is malformed';
  end if;
  if coalesce(p_expected_head_hash, '') !~ '^[a-f0-9]{64}$' then
    raise exception 'expected head hash is malformed';
  end if;
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) = 0 then
    raise exception 'restore run requires a non-empty event array';
  end if;
  if p_expected_event_count <> jsonb_array_length(p_events) then
    raise exception 'expected event count does not match the supplied array';
  end if;

  perform pg_advisory_xact_lock(hashtext('metaphilosophy-staging-restore-run:' || p_restore_run_id::text));

  select * into prior
  from public.metaphilosophy_staging_restore_runs
  where id = p_restore_run_id;

  if found then
    if prior.exact_release_sha <> p_exact_release_sha
       or prior.backup_sha256 <> p_backup_sha256
       or prior.event_count <> p_expected_event_count
       or prior.head_hash <> p_expected_head_hash
       or prior.research_ratings_authorized <> false then
      raise exception 'existing restore run header differs from the requested backup';
    end if;

    select count(*)::bigint,
           coalesce((select event_hash
                     from public.metaphilosophy_staging_restore_run_events
                     where restore_run_id = p_restore_run_id
                     order by sequence desc limit 1), repeat('0', 64))
      into restored, current_head_hash
      from public.metaphilosophy_staging_restore_run_events
      where restore_run_id = p_restore_run_id;

    if restored <> p_expected_event_count or current_head_hash <> p_expected_head_hash then
      raise exception 'existing restore run is incomplete or has the wrong head';
    end if;

    return query select p_restore_run_id, restored, current_head_hash, true;
    return;
  end if;

  insert into public.metaphilosophy_staging_restore_runs
    (id, exact_release_sha, backup_sha256, event_count, head_hash, research_ratings_authorized)
  values
    (p_restore_run_id, p_exact_release_sha, p_backup_sha256, p_expected_event_count, p_expected_head_hash, false);

  for item in select value from jsonb_array_elements(p_events)
  loop
    if (item ->> 'sequence')::bigint <> current_sequence + 1 then
      raise exception 'restore run event sequence is not contiguous';
    end if;
    if item ->> 'prevHash' <> current_head_hash then
      raise exception 'restore run event previous hash does not match';
    end if;
    if coalesce(item ->> 'eventHash', '') !~ '^[a-f0-9]{64}$' then
      raise exception 'restore run event hash is malformed';
    end if;

    insert into public.metaphilosophy_staging_restore_run_events
      (restore_run_id, sequence, event_id, event_type, aggregate_id, actor_id, payload, created_at, prev_hash, event_hash)
    values
      (
        p_restore_run_id,
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
    restored := restored + 1;
  end loop;

  if restored <> p_expected_event_count or current_head_hash <> p_expected_head_hash then
    raise exception 'restored chain does not match the expected count or head';
  end if;

  return query select p_restore_run_id, restored, current_head_hash, false;
end;
$$;

create or replace function public.metaphilosophy_staging_restore_run_readback(p_restore_run_id uuid)
returns table (
  event_count bigint,
  minimum_sequence bigint,
  maximum_sequence bigint,
  sequence_gap_count bigint,
  previous_hash_mismatch_count bigint,
  duplicate_event_id_count bigint,
  duplicate_event_hash_count bigint,
  head_hash text,
  research_ratings_authorized boolean
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with ordered as (
    select sequence, event_id, event_hash, prev_hash,
           lag(event_hash) over (order by sequence) as expected_prev_hash
    from public.metaphilosophy_staging_restore_run_events
    where restore_run_id = p_restore_run_id
  )
  select
    count(*)::bigint,
    min(sequence)::bigint,
    max(sequence)::bigint,
    greatest(coalesce(max(sequence), 0) - count(*), 0)::bigint,
    count(*) filter (
      where (sequence = 1 and prev_hash <> repeat('0', 64))
         or (sequence > 1 and prev_hash is distinct from expected_prev_hash)
    )::bigint,
    (select count(*) - count(distinct event_id)
     from public.metaphilosophy_staging_restore_run_events
     where restore_run_id = p_restore_run_id)::bigint,
    (select count(*) - count(distinct event_hash)
     from public.metaphilosophy_staging_restore_run_events
     where restore_run_id = p_restore_run_id)::bigint,
    coalesce((select event_hash
              from public.metaphilosophy_staging_restore_run_events
              where restore_run_id = p_restore_run_id
              order by sequence desc limit 1), repeat('0', 64)),
    false
  from ordered;
$$;

revoke all on function public.metaphilosophy_staging_restore_run_load(uuid,text,text,bigint,text,jsonb) from public;
revoke all on function public.metaphilosophy_staging_restore_run_readback(uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.metaphilosophy_staging_restore_runs from anon';
    execute 'revoke all on table public.metaphilosophy_staging_restore_run_events from anon';
    execute 'revoke all on function public.metaphilosophy_staging_restore_run_load(uuid,text,text,bigint,text,jsonb) from anon';
    execute 'revoke all on function public.metaphilosophy_staging_restore_run_readback(uuid) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.metaphilosophy_staging_restore_runs from authenticated';
    execute 'revoke all on table public.metaphilosophy_staging_restore_run_events from authenticated';
    execute 'revoke all on function public.metaphilosophy_staging_restore_run_load(uuid,text,text,bigint,text,jsonb) from authenticated';
    execute 'revoke all on function public.metaphilosophy_staging_restore_run_readback(uuid) from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, insert on table public.metaphilosophy_staging_restore_runs to service_role';
    execute 'grant select, insert on table public.metaphilosophy_staging_restore_run_events to service_role';
    execute 'grant execute on function public.metaphilosophy_staging_restore_run_load(uuid,text,text,bigint,text,jsonb) to service_role';
    execute 'grant execute on function public.metaphilosophy_staging_restore_run_readback(uuid) to service_role';
  end if;
end
$$;

alter table public.metaphilosophy_staging_restore_runs enable row level security;
alter table public.metaphilosophy_staging_restore_run_events enable row level security;
revoke all on table public.metaphilosophy_staging_restore_runs from public;
revoke all on table public.metaphilosophy_staging_restore_run_events from public;

update public.metaphilosophy_staging_schema_metadata
set schema_version = 5,
    purpose = 'synthetic_rehearsal_only',
    research_ratings_authorized = false,
    updated_at = now()
where singleton = true;

commit;
