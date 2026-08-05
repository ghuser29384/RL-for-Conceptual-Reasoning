-- Metaphilosophy controlled staging schema v2
-- Adds private integrity readbacks. Apply after v1 in the same dedicated staging database.

begin;

create or replace function public.metaphilosophy_staging_chain_readback()
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
security invoker
set search_path = public, pg_temp
as $$
  with ordered as (
    select
      sequence,
      event_id,
      event_hash,
      prev_hash,
      lag(event_hash) over (order by sequence) as expected_prev_hash
    from public.metaphilosophy_staging_events
  ),
  sequence_stats as (
    select
      count(*)::bigint as event_count,
      min(sequence)::bigint as minimum_sequence,
      max(sequence)::bigint as maximum_sequence,
      greatest(coalesce(max(sequence), 0) - count(*), 0)::bigint as sequence_gap_count
    from public.metaphilosophy_staging_events
  ),
  mismatch_stats as (
    select count(*) filter (
      where (sequence = 1 and prev_hash <> repeat('0', 64))
         or (sequence > 1 and prev_hash is distinct from expected_prev_hash)
    )::bigint as previous_hash_mismatch_count
    from ordered
  ),
  duplicate_stats as (
    select
      (select count(*) - count(distinct event_id) from public.metaphilosophy_staging_events)::bigint as duplicate_event_id_count,
      (select count(*) - count(distinct event_hash) from public.metaphilosophy_staging_events)::bigint as duplicate_event_hash_count
  ),
  head as (
    select event_hash as head_hash
    from public.metaphilosophy_staging_events
    order by sequence desc
    limit 1
  )
  select
    sequence_stats.event_count,
    sequence_stats.minimum_sequence,
    sequence_stats.maximum_sequence,
    sequence_stats.sequence_gap_count,
    mismatch_stats.previous_hash_mismatch_count,
    duplicate_stats.duplicate_event_id_count,
    duplicate_stats.duplicate_event_hash_count,
    coalesce(head.head_hash, repeat('0', 64)) as head_hash,
    metadata.research_ratings_authorized
  from sequence_stats
  cross join mismatch_stats
  cross join duplicate_stats
  cross join public.metaphilosophy_staging_schema_metadata metadata
  left join head on true
  where metadata.singleton = true;
$$;

comment on function public.metaphilosophy_staging_chain_readback() is
  'Private readback for contiguous sequence and previous-hash linkage. Application code separately verifies every event content hash.';

revoke all on function public.metaphilosophy_staging_chain_readback() from public;

create or replace function public.metaphilosophy_staging_assert_synthetic_only()
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  authorization_state boolean;
  non_synthetic_count bigint;
begin
  select research_ratings_authorized
    into authorization_state
    from public.metaphilosophy_staging_schema_metadata
    where singleton = true;

  if coalesce(authorization_state, false) then
    raise exception 'staging schema must not authorize research ratings';
  end if;

  select count(*)
    into non_synthetic_count
    from public.metaphilosophy_staging_events
    where event_type in ('position.created', 'critique.created')
      and coalesce(payload ->> 'status', '') <> 'synthetic_rehearsal_only';

  if non_synthetic_count > 0 then
    raise exception 'non-synthetic content exists in the staging event ledger';
  end if;
end;
$$;

revoke all on function public.metaphilosophy_staging_assert_synthetic_only() from public;

update public.metaphilosophy_staging_schema_metadata
set schema_version = 2,
    purpose = 'synthetic_rehearsal_only',
    research_ratings_authorized = false,
    updated_at = now()
where singleton = true;

commit;
