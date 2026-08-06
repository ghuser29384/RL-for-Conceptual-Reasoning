-- Metaphilosophy controlled staging schema v4
-- Retains non-secret hosted-verification reports and provides one isolated append-only restore-drill ledger.

begin;

create table if not exists public.metaphilosophy_staging_verification_reports (
  id uuid primary key default gen_random_uuid(),
  report_kind text not null,
  exact_release_sha text not null check (exact_release_sha ~ '^[a-f0-9]{40}$'),
  status text not null check (status in ('pass', 'fail')),
  report jsonb not null default '{}'::jsonb check (jsonb_typeof(report) = 'object'),
  backup_events jsonb check (backup_events is null or jsonb_typeof(backup_events) = 'array'),
  backup_sha256 text check (backup_sha256 is null or backup_sha256 ~ '^[a-f0-9]{64}$'),
  chain_head_hash text check (chain_head_hash is null or chain_head_hash ~ '^[a-f0-9]{64}$'),
  event_count bigint check (event_count is null or event_count >= 0),
  research_ratings_authorized boolean not null default false check (research_ratings_authorized = false),
  created_at timestamptz not null default now()
);

comment on table public.metaphilosophy_staging_verification_reports is
  'Append-only, non-secret evidence from controlled synthetic hosted-staging verification. Never stores plaintext invitation or session tokens.';

create table if not exists public.metaphilosophy_staging_restore_drill_events (
  sequence bigint primary key,
  event_id uuid not null unique,
  event_type text not null check (length(event_type) between 3 and 120),
  aggregate_id text,
  actor_id text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null,
  prev_hash text not null check (prev_hash ~ '^[a-f0-9]{64}$'),
  event_hash text not null unique check (event_hash ~ '^[a-f0-9]{64}$'),
  restored_at timestamptz not null default now()
);

comment on table public.metaphilosophy_staging_restore_drill_events is
  'Isolated append-only restore target for one synthetic hosted backup/restore acceptance drill.';

create or replace function public.metaphilosophy_staging_reject_report_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  raise exception 'metaphilosophy staging verification evidence is append-only';
end;
$$;

revoke all on function public.metaphilosophy_staging_reject_report_mutation() from public;

drop trigger if exists metaphilosophy_staging_verification_reports_reject_mutation
  on public.metaphilosophy_staging_verification_reports;
create trigger metaphilosophy_staging_verification_reports_reject_mutation
before update or delete on public.metaphilosophy_staging_verification_reports
for each row execute function public.metaphilosophy_staging_reject_report_mutation();

create or replace function public.metaphilosophy_restore_drill_enforce_append_only()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  prior_sequence bigint;
  prior_hash text;
begin
  if tg_op <> 'INSERT' then
    raise exception 'metaphilosophy staging restore drill is append-only';
  end if;

  select sequence, event_hash
    into prior_sequence, prior_hash
    from public.metaphilosophy_staging_restore_drill_events
    order by sequence desc
    limit 1;

  if prior_sequence is null then
    if new.sequence <> 1 or new.prev_hash <> repeat('0', 64) then
      raise exception 'restore drill must begin at the genesis event';
    end if;
  else
    if new.sequence <> prior_sequence + 1 or new.prev_hash <> prior_hash then
      raise exception 'restore drill sequence or previous hash does not match its chain head';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.metaphilosophy_restore_drill_enforce_append_only() from public;

drop trigger if exists metaphilosophy_restore_drill_append_only_insert
  on public.metaphilosophy_staging_restore_drill_events;
create trigger metaphilosophy_restore_drill_append_only_insert
before insert on public.metaphilosophy_staging_restore_drill_events
for each row execute function public.metaphilosophy_restore_drill_enforce_append_only();

drop trigger if exists metaphilosophy_restore_drill_reject_mutation
  on public.metaphilosophy_staging_restore_drill_events;
create trigger metaphilosophy_restore_drill_reject_mutation
before update or delete on public.metaphilosophy_staging_restore_drill_events
for each row execute function public.metaphilosophy_restore_drill_enforce_append_only();

create or replace function public.metaphilosophy_staging_restore_drill_load(p_events jsonb)
returns table (restored_count bigint, head_hash text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  item jsonb;
  current_sequence bigint := 0;
  current_head_hash text := repeat('0', 64);
  restored bigint := 0;
begin
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) = 0 then
    raise exception 'restore drill requires a non-empty event array';
  end if;
  if exists (select 1 from public.metaphilosophy_staging_restore_drill_events) then
    raise exception 'restore drill target is not empty';
  end if;

  perform pg_advisory_xact_lock(hashtext('metaphilosophy-staging-restore-drill'));

  for item in select value from jsonb_array_elements(p_events)
  loop
    if (item ->> 'sequence')::bigint <> current_sequence + 1 then
      raise exception 'restore drill event sequence is not contiguous';
    end if;
    if item ->> 'prevHash' <> current_head_hash then
      raise exception 'restore drill event previous hash does not match';
    end if;
    if coalesce(item ->> 'eventHash', '') !~ '^[a-f0-9]{64}$' then
      raise exception 'restore drill event hash is malformed';
    end if;

    insert into public.metaphilosophy_staging_restore_drill_events
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
    restored := restored + 1;
  end loop;

  return query select restored, current_head_hash;
end;
$$;

create or replace function public.metaphilosophy_staging_restore_drill_readback()
returns table (
  event_count bigint,
  minimum_sequence bigint,
  maximum_sequence bigint,
  sequence_gap_count bigint,
  previous_hash_mismatch_count bigint,
  duplicate_event_id_count bigint,
  duplicate_event_hash_count bigint,
  head_hash text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with ordered as (
    select sequence, event_id, event_hash, prev_hash,
           lag(event_hash) over (order by sequence) as expected_prev_hash
    from public.metaphilosophy_staging_restore_drill_events
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
    (select count(*) - count(distinct event_id) from public.metaphilosophy_staging_restore_drill_events)::bigint,
    (select count(*) - count(distinct event_hash) from public.metaphilosophy_staging_restore_drill_events)::bigint,
    coalesce((select event_hash from public.metaphilosophy_staging_restore_drill_events order by sequence desc limit 1), repeat('0', 64))
  from ordered;
$$;

revoke all on function public.metaphilosophy_staging_restore_drill_load(jsonb) from public;
revoke all on function public.metaphilosophy_staging_restore_drill_readback() from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.metaphilosophy_staging_verification_reports from anon';
    execute 'revoke all on table public.metaphilosophy_staging_restore_drill_events from anon';
    execute 'revoke all on function public.metaphilosophy_staging_restore_drill_load(jsonb) from anon';
    execute 'revoke all on function public.metaphilosophy_staging_restore_drill_readback() from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.metaphilosophy_staging_verification_reports from authenticated';
    execute 'revoke all on table public.metaphilosophy_staging_restore_drill_events from authenticated';
    execute 'revoke all on function public.metaphilosophy_staging_restore_drill_load(jsonb) from authenticated';
    execute 'revoke all on function public.metaphilosophy_staging_restore_drill_readback() from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, insert on table public.metaphilosophy_staging_verification_reports to service_role';
    execute 'grant select, insert on table public.metaphilosophy_staging_restore_drill_events to service_role';
    execute 'grant execute on function public.metaphilosophy_staging_restore_drill_load(jsonb) to service_role';
    execute 'grant execute on function public.metaphilosophy_staging_restore_drill_readback() to service_role';
  end if;
end
$$;

alter table public.metaphilosophy_staging_verification_reports enable row level security;
alter table public.metaphilosophy_staging_restore_drill_events enable row level security;
revoke all on table public.metaphilosophy_staging_verification_reports from public;
revoke all on table public.metaphilosophy_staging_restore_drill_events from public;

update public.metaphilosophy_staging_schema_metadata
set schema_version = 4,
    purpose = 'synthetic_rehearsal_only',
    research_ratings_authorized = false,
    updated_at = now()
where singleton = true;

commit;
