-- Metaphilosophy controlled staging schema v1
-- Apply only to a dedicated non-production Metaphilosophy staging database.
-- Do not apply to Moral Trade, Normativity, or any database containing unrelated user data.

begin;

create extension if not exists pgcrypto;

create table if not exists public.metaphilosophy_staging_events (
  sequence bigint primary key,
  event_id uuid not null unique,
  event_type text not null check (length(event_type) between 3 and 120),
  aggregate_id text,
  actor_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  prev_hash text not null check (prev_hash ~ '^[a-f0-9]{64}$'),
  event_hash text not null unique check (event_hash ~ '^[a-f0-9]{64}$'),
  inserted_at timestamptz not null default now(),
  constraint metaphilosophy_staging_events_payload_object check (jsonb_typeof(payload) = 'object')
);

comment on table public.metaphilosophy_staging_events is
  'Append-only, hash-chained event ledger for the Metaphilosophy synthetic human-workflow rehearsal. Contains controlled participant and rating records; never expose directly to browsers.';

create index if not exists metaphilosophy_staging_events_aggregate_idx
  on public.metaphilosophy_staging_events (aggregate_id, sequence);
create index if not exists metaphilosophy_staging_events_actor_idx
  on public.metaphilosophy_staging_events (actor_id, sequence);
create index if not exists metaphilosophy_staging_events_type_idx
  on public.metaphilosophy_staging_events (event_type, sequence);
create index if not exists metaphilosophy_staging_events_created_idx
  on public.metaphilosophy_staging_events (created_at, sequence);

create or replace function public.metaphilosophy_staging_enforce_append_only()
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
    raise exception 'metaphilosophy_staging_events is append-only';
  end if;

  select sequence, event_hash
    into prior_sequence, prior_hash
    from public.metaphilosophy_staging_events
    order by sequence desc
    limit 1;

  if prior_sequence is null then
    if new.sequence <> 1 then
      raise exception 'first staging event must have sequence 1';
    end if;
    if new.prev_hash <> repeat('0', 64) then
      raise exception 'first staging event must use the genesis previous hash';
    end if;
  else
    if new.sequence <> prior_sequence + 1 then
      raise exception 'staging event sequence must be contiguous';
    end if;
    if new.prev_hash <> prior_hash then
      raise exception 'staging event previous hash does not match chain head';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.metaphilosophy_staging_enforce_append_only() from public;

drop trigger if exists metaphilosophy_staging_append_only_insert on public.metaphilosophy_staging_events;
create trigger metaphilosophy_staging_append_only_insert
before insert on public.metaphilosophy_staging_events
for each row execute function public.metaphilosophy_staging_enforce_append_only();

drop trigger if exists metaphilosophy_staging_reject_update on public.metaphilosophy_staging_events;
create trigger metaphilosophy_staging_reject_update
before update or delete on public.metaphilosophy_staging_events
for each row execute function public.metaphilosophy_staging_enforce_append_only();

alter table public.metaphilosophy_staging_events enable row level security;
revoke all on table public.metaphilosophy_staging_events from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.metaphilosophy_staging_events from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.metaphilosophy_staging_events from authenticated';
  end if;
end
$$;

create table if not exists public.metaphilosophy_staging_schema_metadata (
  singleton boolean primary key default true check (singleton),
  schema_version integer not null,
  purpose text not null,
  research_ratings_authorized boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.metaphilosophy_staging_schema_metadata
  (singleton, schema_version, purpose, research_ratings_authorized)
values
  (true, 1, 'synthetic_rehearsal_only', false)
on conflict (singleton) do update
set schema_version = excluded.schema_version,
    purpose = excluded.purpose,
    research_ratings_authorized = false,
    updated_at = now();

alter table public.metaphilosophy_staging_schema_metadata enable row level security;
revoke all on table public.metaphilosophy_staging_schema_metadata from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.metaphilosophy_staging_schema_metadata from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.metaphilosophy_staging_schema_metadata from authenticated';
  end if;
end
$$;

commit;
