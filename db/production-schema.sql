create extension if not exists pgcrypto;

create table if not exists audit_events (
  sequence_id bigserial primary key,
  stream text not null check (
    stream in (
      'rating',
      'certification',
      'benchmark_exposure',
      'source_style_audit',
      'workflow'
    )
  ),
  event_id text,
  event_type text,
  actor_hash text,
  payload_hash text,
  event_json jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists audit_events_stream_sequence_idx
  on audit_events (stream, sequence_id);

create index if not exists audit_events_payload_hash_idx
  on audit_events (payload_hash);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  external_auth_id text unique,
  display_name text not null,
  role text not null check (role in ('rater', 'graduate', 'phd', 'expert', 'admin', 'auditor')),
  created_at timestamptz not null default now()
);

create table if not exists positions (
  id text primary key,
  split text not null,
  topic_family text not null,
  conceptual_scope text not null,
  ground_truth_availability text not null,
  created_at timestamptz not null default now()
);

create table if not exists position_text_versions (
  id text primary key,
  position_id text not null references positions(id),
  canonical_hash text not null,
  rater_visible_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists critiques (
  id text primary key,
  position_id text not null references positions(id),
  split text not null,
  authorship_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists critique_text_versions (
  id text primary key,
  critique_id text not null references critiques(id),
  canonical_hash text not null,
  rater_visible_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists assignments (
  id text primary key,
  position_id text not null references positions(id),
  critique_id text not null references critiques(id),
  rater_id uuid references users(id),
  queue_type text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists rating_context_snapshots (
  id text primary key,
  position_id text not null references positions(id),
  context_json jsonb not null,
  canonical_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists label_snapshots (
  id text primary key,
  release_id text not null,
  target_label_version text not null,
  input_hash text not null,
  snapshot_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists release_reports (
  id text primary key,
  release_id text not null,
  input_hash text not null,
  report_json jsonb not null,
  created_at timestamptz not null default now()
);

create schema if not exists app_auth;

create or replace function app_auth.current_external_auth_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.current_external_auth_id', true), '')
$$;

create or replace function app_auth.current_role()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.current_role', true), '')
$$;

create or replace function app_auth.has_role(variadic allowed_roles text[])
returns boolean
language sql
stable
as $$
  select app_auth.current_role() = any(allowed_roles)
$$;

create or replace function app_auth.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, app_auth
as $$
  select users.id
  from users
  where users.external_auth_id = app_auth.current_external_auth_id()
$$;

create or replace function app_auth.assigned_to_position(target_position_id text)
returns boolean
language sql
stable
security definer
set search_path = public, app_auth
as $$
  select app_auth.has_role('admin', 'auditor', 'expert')
    or exists (
      select 1
      from assignments
      where assignments.position_id = target_position_id
        and assignments.rater_id = app_auth.current_user_id()
    )
$$;

create or replace function app_auth.assigned_to_critique(target_critique_id text)
returns boolean
language sql
stable
security definer
set search_path = public, app_auth
as $$
  select app_auth.has_role('admin', 'auditor', 'expert')
    or exists (
      select 1
      from assignments
      where assignments.critique_id = target_critique_id
        and assignments.rater_id = app_auth.current_user_id()
    )
$$;

comment on schema app_auth is
  'RLS helper schema. Trusted API connections must SET LOCAL app.current_role and app.current_external_auth_id before querying protected tables.';
comment on function app_auth.current_role() is
  'Reads the trusted request role from app.current_role for row-level security policies.';
comment on function app_auth.current_external_auth_id() is
  'Reads the trusted external identity subject from app.current_external_auth_id for row-level security policies.';

alter table audit_events enable row level security;
alter table users enable row level security;
alter table positions enable row level security;
alter table position_text_versions enable row level security;
alter table critiques enable row level security;
alter table critique_text_versions enable row level security;
alter table assignments enable row level security;
alter table rating_context_snapshots enable row level security;
alter table label_snapshots enable row level security;
alter table release_reports enable row level security;

drop policy if exists audit_events_append_authenticated on audit_events;
create policy audit_events_append_authenticated on audit_events
  for insert
  with check (app_auth.has_role('rater', 'graduate', 'phd', 'expert', 'admin', 'auditor', 'service'));

drop policy if exists audit_events_read_auditors on audit_events;
create policy audit_events_read_auditors on audit_events
  for select
  using (app_auth.has_role('admin', 'auditor', 'service'));

drop policy if exists users_read_self_or_auditors on users;
create policy users_read_self_or_auditors on users
  for select
  using (
    app_auth.has_role('admin', 'auditor')
    or external_auth_id = app_auth.current_external_auth_id()
  );

drop policy if exists users_write_admin on users;
create policy users_write_admin on users
  for all
  using (app_auth.has_role('admin'))
  with check (app_auth.has_role('admin'));

drop policy if exists positions_read_assigned on positions;
create policy positions_read_assigned on positions
  for select
  using (app_auth.assigned_to_position(id));

drop policy if exists positions_write_admin on positions;
create policy positions_write_admin on positions
  for all
  using (app_auth.has_role('admin'))
  with check (app_auth.has_role('admin'));

drop policy if exists position_text_versions_read_assigned on position_text_versions;
create policy position_text_versions_read_assigned on position_text_versions
  for select
  using (app_auth.assigned_to_position(position_id));

drop policy if exists position_text_versions_write_admin on position_text_versions;
create policy position_text_versions_write_admin on position_text_versions
  for all
  using (app_auth.has_role('admin'))
  with check (app_auth.has_role('admin'));

drop policy if exists critiques_read_assigned on critiques;
create policy critiques_read_assigned on critiques
  for select
  using (app_auth.assigned_to_critique(id));

drop policy if exists critiques_write_admin on critiques;
create policy critiques_write_admin on critiques
  for all
  using (app_auth.has_role('admin'))
  with check (app_auth.has_role('admin'));

drop policy if exists critique_text_versions_read_assigned on critique_text_versions;
create policy critique_text_versions_read_assigned on critique_text_versions
  for select
  using (app_auth.assigned_to_critique(critique_id));

drop policy if exists critique_text_versions_write_admin on critique_text_versions;
create policy critique_text_versions_write_admin on critique_text_versions
  for all
  using (app_auth.has_role('admin'))
  with check (app_auth.has_role('admin'));

drop policy if exists assignments_read_self_or_auditors on assignments;
create policy assignments_read_self_or_auditors on assignments
  for select
  using (
    app_auth.has_role('admin', 'auditor', 'expert')
    or rater_id = app_auth.current_user_id()
  );

drop policy if exists assignments_write_admin on assignments;
create policy assignments_write_admin on assignments
  for all
  using (app_auth.has_role('admin'))
  with check (app_auth.has_role('admin'));

drop policy if exists rating_context_snapshots_read_assigned on rating_context_snapshots;
create policy rating_context_snapshots_read_assigned on rating_context_snapshots
  for select
  using (app_auth.assigned_to_position(position_id));

drop policy if exists rating_context_snapshots_write_admin on rating_context_snapshots;
create policy rating_context_snapshots_write_admin on rating_context_snapshots
  for all
  using (app_auth.has_role('admin'))
  with check (app_auth.has_role('admin'));

drop policy if exists label_snapshots_read_auditors on label_snapshots;
create policy label_snapshots_read_auditors on label_snapshots
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists label_snapshots_write_admin on label_snapshots;
create policy label_snapshots_write_admin on label_snapshots
  for all
  using (app_auth.has_role('admin'))
  with check (app_auth.has_role('admin'));

drop policy if exists release_reports_read_auditors on release_reports;
create policy release_reports_read_auditors on release_reports
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists release_reports_write_admin on release_reports;
create policy release_reports_write_admin on release_reports
  for all
  using (app_auth.has_role('admin'))
  with check (app_auth.has_role('admin'));
