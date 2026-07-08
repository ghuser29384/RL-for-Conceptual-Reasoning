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
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists position_text_versions (
  id text primary key,
  position_id text not null references positions(id),
  canonical_hash text not null,
  rater_visible_hash text not null,
  model_visible_hash text,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists critiques (
  id text primary key,
  position_id text not null references positions(id),
  split text not null,
  authorship_type text not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists critique_text_versions (
  id text primary key,
  critique_id text not null references critiques(id),
  canonical_hash text not null,
  rater_visible_hash text not null,
  model_visible_hash text,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists assignments (
  id text primary key,
  position_id text not null references positions(id),
  critique_id text not null references critiques(id),
  rater_id uuid references users(id),
  rater_external_id text,
  queue_type text not null,
  status text not null,
  workflow_profile_id text,
  rating_context_snapshot_id text,
  blind_state text,
  source_tag_visibility_state text,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists rating_context_snapshots (
  id text primary key,
  position_id text not null references positions(id),
  target_critique_id text,
  context_json jsonb not null,
  canonical_hash text not null,
  model_visible_context_hash text,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists label_snapshots (
  id text primary key,
  release_id text not null,
  target_label_version text not null,
  input_hash text not null,
  snapshot_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists release_reports (
  id text primary key,
  release_id text not null,
  input_hash text not null,
  report_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists release_versions (
  id text primary key,
  release_id text,
  resource_key text not null,
  release_version text,
  release_gate_profile_id text,
  phase_gate_bundle_id text,
  phase_gate_bundle_hash text,
  release_config_manifest_id text,
  governed_bundle_id text,
  governed_bundle_family text,
  canonicalization_profile_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists release_freezes (
  id text primary key,
  release_id text,
  resource_key text not null,
  release_version text,
  release_gate_profile_id text,
  phase_gate_bundle_id text,
  phase_gate_bundle_hash text,
  release_config_manifest_id text,
  governed_bundle_id text,
  governed_bundle_family text,
  canonicalization_profile_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists release_gate_profiles (
  id text primary key,
  release_id text,
  resource_key text not null,
  release_version text,
  release_gate_profile_id text,
  phase_gate_bundle_id text,
  phase_gate_bundle_hash text,
  release_config_manifest_id text,
  governed_bundle_id text,
  governed_bundle_family text,
  canonicalization_profile_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists governed_bundle_canonicalization_profiles (
  id text primary key,
  release_id text,
  resource_key text not null,
  release_version text,
  release_gate_profile_id text,
  phase_gate_bundle_id text,
  phase_gate_bundle_hash text,
  release_config_manifest_id text,
  governed_bundle_id text,
  governed_bundle_family text,
  canonicalization_profile_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists governed_bundle_records (
  id text primary key,
  release_id text,
  resource_key text not null,
  release_version text,
  release_gate_profile_id text,
  phase_gate_bundle_id text,
  phase_gate_bundle_hash text,
  release_config_manifest_id text,
  governed_bundle_id text,
  governed_bundle_family text,
  canonicalization_profile_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists governed_bundle_verifications (
  id text primary key,
  release_id text,
  resource_key text not null,
  release_version text,
  release_gate_profile_id text,
  phase_gate_bundle_id text,
  phase_gate_bundle_hash text,
  release_config_manifest_id text,
  governed_bundle_id text,
  governed_bundle_family text,
  canonicalization_profile_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists release_config_manifests (
  id text primary key,
  release_id text,
  resource_key text not null,
  release_version text,
  release_gate_profile_id text,
  phase_gate_bundle_id text,
  phase_gate_bundle_hash text,
  release_config_manifest_id text,
  governed_bundle_id text,
  governed_bundle_family text,
  canonicalization_profile_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists release_config_manifest_verifications (
  id text primary key,
  release_id text,
  resource_key text not null,
  release_version text,
  release_gate_profile_id text,
  phase_gate_bundle_id text,
  phase_gate_bundle_hash text,
  release_config_manifest_id text,
  governed_bundle_id text,
  governed_bundle_family text,
  canonicalization_profile_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists metaphilosophy_architecture_layers (
  id text primary key,
  release_id text,
  resource_key text not null,
  architecture_layer_id text,
  track_id text,
  lmca_relationship text,
  experiment_type text,
  release_gate_status text,
  release_claim_role text,
  boundary_rule text,
  direct_requirement boolean,
  pilot_evidence_requirement text,
  promotion_governance text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists metaphilosophy_task_tracks (
  id text primary key,
  release_id text,
  resource_key text not null,
  architecture_layer_id text,
  track_id text,
  lmca_relationship text,
  experiment_type text,
  release_gate_status text,
  release_claim_role text,
  boundary_rule text,
  direct_requirement boolean,
  pilot_evidence_requirement text,
  promotion_governance text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists metaphilosophy_research_backlog_items (
  id text primary key,
  release_id text,
  resource_key text not null,
  architecture_layer_id text,
  track_id text,
  lmca_relationship text,
  experiment_type text,
  release_gate_status text,
  release_claim_role text,
  boundary_rule text,
  direct_requirement boolean,
  pilot_evidence_requirement text,
  promotion_governance text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists corpus_manifests (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists training_exports (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists export_manifests (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists model_improvement_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists model_improvement_runs (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists evaluation_runs (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists model_evaluation_predictions (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists calibration_runs (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists leaderboards (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists model_failure_audits (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists artifact_probe_runs (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sycophancy_probe_runs (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists obfuscation_stress_runs (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sanity_baseline_runs (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists model_run_reproducibility_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists model_inference_configs (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists model_run_environments (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists model_provider_data_handling_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists prompt_templates (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists parser_configs (
  id text primary key,
  release_id text,
  resource_key text not null,
  related_release_artifact_id text,
  related_evaluation_run_id text,
  target_label_snapshot_id text,
  artifact_status text not null,
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists certification_threshold_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists certification_records (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists gold_items (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists benchmark_split_members (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists benchmark_freeze_reports (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists rights_clearance_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists rights_records (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists benchmark_refresh_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists validation_tranche_evidence (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists human_ceiling_runs (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists comparability_tier_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists comparability_claims (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists release_erratum_disclosure_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists release_errata (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists benchmark_submission_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists benchmark_submissions (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  target_label_snapshot_id text,
  split_name text,
  release_gate_profile_id text,
  evaluation_run_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists discussions (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  discussion_thread_id text,
  adjudication_id text,
  workflow_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists discussion_threads (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  discussion_thread_id text,
  adjudication_id text,
  workflow_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists discussion_comments (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  discussion_thread_id text,
  adjudication_id text,
  workflow_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists discussion_revision_proposals (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  discussion_thread_id text,
  adjudication_id text,
  workflow_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists post_lock_discussion_sessions (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  discussion_thread_id text,
  adjudication_id text,
  workflow_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists adjudications (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  discussion_thread_id text,
  adjudication_id text,
  workflow_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists adjudication_review_sessions (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  discussion_thread_id text,
  adjudication_id text,
  workflow_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists adjudication_memos (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  discussion_thread_id text,
  adjudication_id text,
  workflow_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists adjudication_finalizations (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  discussion_thread_id text,
  adjudication_id text,
  workflow_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists verification_records (
  id text primary key,
  release_id text,
  resource_key text not null,
  item_id text,
  position_id text,
  critique_id text,
  rating_id text,
  rater_id text,
  policy_id text,
  verification_record_id text,
  verification_workspace_id text,
  interpretation_target_map_id text,
  adjudication_id text,
  discussion_thread_id text,
  adjudication_memo_id text,
  workflow_status text not null,
  visibility_class text not null check (visibility_class in ('expert_admin_audit_only', 'admin_audit_only')),
  source_exposure_status text,
  protected_content_status text,
  model_assistance_status text,
  nonblind_evidence_flag boolean not null default false,
  source_assisted_flag boolean not null default false,
  artifact_status text not null,
  input_hash text not null check (input_hash like 'sha256:%'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists verification_evidence_artifacts (
  like verification_records including all
);

create table if not exists adjudicator_pre_read_requiredness_policies (
  like verification_records including all
);

create table if not exists adjudicator_pre_reads (
  like verification_records including all
);

create table if not exists adjudication_cockpit_signoff_policies (
  like verification_records including all
);

create table if not exists interpretation_target_map_requiredness_policies (
  like verification_records including all
);

create table if not exists interpretation_target_maps (
  like verification_records including all
);

create table if not exists verification_claim_granularity_policies (
  like verification_records including all
);

create table if not exists verification_workspace_sessions (
  like verification_records including all
);

create table if not exists calibration_feedback_events (
  like verification_records including all
);

create table if not exists source_recognition_events (
  id text primary key,
  release_id text,
  resource_key text not null,
  assignment_id text,
  rating_id text,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  artifact_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists external_assistance_contamination_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  assignment_id text,
  rating_id text,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists external_assistance_declarations (
  id text primary key,
  release_id text,
  resource_key text not null,
  assignment_id text,
  rating_id text,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  artifact_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists spot_check_sampling_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  assignment_id text,
  rating_id text,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists spot_check_qa_items (
  id text primary key,
  release_id text,
  resource_key text not null,
  assignment_id text,
  rating_id text,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  artifact_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists adjudication_triage_queue_items (
  id text primary key,
  release_id text,
  resource_key text not null,
  assignment_id text,
  rating_id text,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  artifact_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists diagnostic_deferral_visibility_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  assignment_id text,
  rating_id text,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  artifact_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists diagnostic_deferral_records (
  id text primary key,
  release_id text,
  resource_key text not null,
  assignment_id text,
  rating_id text,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  artifact_status text not null,
  visibility_class text not null default 'expert_admin_audit_only'
    check (visibility_class = 'expert_admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ratings (
  id text primary key,
  assignment_id text not null,
  position_id text not null,
  critique_id text not null,
  rater_id text not null,
  rater_tier text,
  kind text not null check (kind in ('blind_initial', 'revision')),
  parent_rating_id text,
  rubric_version text not null,
  score_input_policy_id text not null,
  workflow_profile_id text,
  score_explanation_policy_id text not null,
  position_text_version_id text not null,
  critique_text_version_id text not null,
  rating_context_snapshot_id text not null,
  scores_json jsonb not null,
  raw_scores_json jsonb not null,
  displayed_scores_json jsonb not null default '{}'::jsonb,
  score_quantization_policy text not null,
  score_confidence_judgment text not null check (score_confidence_judgment in ('low', 'medium', 'high')),
  general_rating_note text,
  score_explanation text,
  score_explanation_required boolean not null,
  score_explanation_required_reasons jsonb not null default '[]'::jsonb,
  score_explanation_triggers jsonb not null default '[]'::jsonb,
  score_explanation_prompt_visibility text,
  score_explanation_prompt_shown boolean not null,
  score_explanation_completion_status text not null,
  overall_vs_centrality_strength_diagnostic jsonb not null,
  score_entry_explicitness_status text not null,
  score_missing_field_validation_status text not null,
  provisional_dimensions jsonb not null default '[]'::jsonb,
  rationale text,
  rationale_evidence_span_ids jsonb not null default '[]'::jsonb,
  locked_before_peer_exposure boolean check (locked_before_peer_exposure is null or locked_before_peer_exposure = true),
  source_tag_visibility_state text,
  active_seconds numeric not null check (active_seconds > 0),
  idle_gap_seconds numeric not null check (idle_gap_seconds >= 0),
  interruption_count integer not null check (interruption_count >= 0),
  submitted_at timestamptz not null,
  locked_at timestamptz not null,
  policy_action_kind text,
  policy_decision_id text,
  policy_decision_consumption_id text,
  policy_decision_idempotency_key text,
  event_id text,
  payload_hash text check (payload_hash is null or payload_hash like 'sha256:%'),
  actor_hash text check (actor_hash is null or actor_hash like 'sha256:%'),
  received_at timestamptz,
  record_json jsonb not null default '{}'::jsonb,
  check (
    (kind = 'blind_initial' and parent_rating_id is null)
    or (kind = 'revision' and parent_rating_id is not null)
  )
);

create table if not exists rating_score_values (
  rating_id text not null references ratings(id) on delete cascade,
  dimension text not null check (
    dimension in ('centrality', 'strength', 'correctness', 'clarity', 'dead_weight', 'single_issue', 'overall')
  ),
  score_value numeric check (score_value is null or (score_value >= 0 and score_value <= 1)),
  raw_score_value numeric check (raw_score_value is null or (raw_score_value >= 0 and raw_score_value <= 1)),
  displayed_score_value numeric check (displayed_score_value is null or (displayed_score_value >= 0 and displayed_score_value <= 1)),
  low_clarity_provisional boolean not null default false,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  primary key (rating_id, dimension)
);

create table if not exists rater_instruction_compatibility_policies (
  id text primary key,
  release_id text,
  resource_key text not null check (resource_key = 'raterInstructionCompatibilityPolicy'),
  policy_version text not null,
  covered_workflow_split_classes text[] not null default '{}'::text[],
  compatible_render_classes text[] not null default '{}'::text[],
  required_shared_policy_fields text[] not null default '{}'::text[],
  thresholds_json jsonb not null default '{}'::jsonb,
  compatibility_rules_json jsonb not null default '{}'::jsonb,
  protected_split_merge_policy text not null,
  sensitivity_snapshot_policy text not null,
  lmca_source_boundary text not null,
  artifact_status text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  frozen_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists rater_instruction_render_versions (
  id text primary key,
  release_id text,
  resource_key text not null check (resource_key = 'raterInstructionRenderVersion'),
  rubric_version text not null,
  workflow_profile_id text not null,
  rendered_rubric_anchor_checksum text not null check (rendered_rubric_anchor_checksum like 'sha256:%'),
  score_input_policy_id text not null,
  ux_simplification_policy_id text not null,
  score_control_mode text not null,
  score_default_policy text not null check (score_default_policy = 'unset_required'),
  workflow_banner_text_version text not null,
  issue_panel_copy_version text not null,
  pre_submit_assist_policy_id text not null,
  rubric_lint_config_id text not null,
  accessibility_visual_variant text not null,
  ui_experiment_policy_id text not null,
  rater_instruction_compatibility_policy_id text not null,
  render_compatibility_class text not null,
  compatibility_evidence_status text not null check (compatibility_evidence_status = 'compatible_review_passed'),
  protected_split_eligibility_policy text not null,
  sensitivity_snapshot_policy text not null,
  artifact_status text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  frozen_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists rubric_copy_traceability_maps (
  id text primary key,
  release_id text,
  resource_key text not null check (resource_key = 'rubricCopyTraceabilityMap'),
  map_version text not null,
  rubric_version text not null,
  copy_bundle_id text not null,
  covered_screen_ids text[] not null default '{}'::text[],
  simplified_copy_entry_ids text[] not null default '{}'::text[],
  mapped_rubric_clause_ids text[] not null default '{}'::text[],
  semantic_drift_test_ids text[] not null default '{}'::text[],
  clause_map_json jsonb not null default '{}'::jsonb,
  semantic_drift_test_status text not null check (semantic_drift_test_status = 'passed'),
  appendix_f_anchor_access text not null,
  hidden_field_leakage_check text not null check (hidden_field_leakage_check = 'passed'),
  release_critical_use_status text not null check (release_critical_use_status = 'frozen_for_release_critical_screens'),
  release_config_manifest_id text not null,
  reviewer_id text not null,
  reviewed_at timestamptz not null,
  frozen_at timestamptz not null,
  artifact_status text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists rater_instruction_comprehension_audits (
  id text primary key,
  release_id text,
  resource_key text not null check (resource_key = 'raterInstructionComprehensionAudit'),
  audit_version text not null,
  rater_instruction_render_version_id text not null,
  rater_instruction_compatibility_policy_id text not null,
  rubric_copy_traceability_map_id text not null,
  covered_screen_ids text[] not null default '{}'::text[],
  comprehension_methods text[] not null default '{}'::text[],
  comprehension_check_ids text[] not null default '{}'::text[],
  glossary_term_ids text[] not null default '{}'::text[],
  disclosure_depths text[] not null default '{}'::text[],
  clause_traceability_review_status text not null check (clause_traceability_review_status = 'passed'),
  screen_copy_mapping_review_status text not null check (screen_copy_mapping_review_status = 'passed'),
  comprehension_test_status text not null check (comprehension_test_status = 'passed'),
  semantic_drift_blocker boolean not null check (semantic_drift_blocker = true),
  no_feature_loss_blocker boolean not null check (no_feature_loss_blocker = true),
  protected_leakage_review_passed boolean not null check (protected_leakage_review_passed = true),
  excluded_from_score_computation boolean not null check (excluded_from_score_computation = true),
  excluded_from_independent_blind_denominator boolean not null check (excluded_from_independent_blind_denominator = true),
  source_boundary text not null,
  reviewer_id text not null,
  frozen_at timestamptz not null,
  artifact_status text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists session_pacing_policies (
  id text primary key,
  release_id text,
  resource_key text not null,
  assignment_id text,
  rating_id text,
  rater_id text,
  item_id text,
  position_id text,
  critique_id text,
  policy_id text,
  screen_id text,
  issue_id text,
  practice_session_id text,
  action_kind text,
  workflow_status text not null,
  visibility_class text not null check (visibility_class in ('admin_audit_only', 'expert_admin_audit_only')),
  protected_label_visibility_state text,
  hidden_metadata_leakage_check text,
  artifact_status text not null,
  input_hash text not null check (input_hash like 'sha256:%'),
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists rater_sessions (like session_pacing_policies including all);
create table if not exists public_example_practice_sessions (like session_pacing_policies including all);
create table if not exists practice_sandbox_policies (like session_pacing_policies including all);
create table if not exists rater_dashboard_policies (like session_pacing_policies including all);
create table if not exists rater_learning_plans (like session_pacing_policies including all);
create table if not exists source_anchor_examples (like session_pacing_policies including all);
create table if not exists ux_simplification_policies (like session_pacing_policies including all);
create table if not exists ux_simplification_reviews (like session_pacing_policies including all);
create table if not exists item_issue_quarantine_policies (like session_pacing_policies including all);
create table if not exists item_issue_reports (like session_pacing_policies including all);
create table if not exists item_issue_actions (like session_pacing_policies including all);
create table if not exists screen_feature_parity_checks (like session_pacing_policies including all);
create table if not exists simplified_copy_previews (like session_pacing_policies including all);

create table if not exists metric_configs (
  id text primary key,
  release_id text,
  resource_key text not null,
  target_label_snapshot_id text,
  metric_config_id text,
  derived_utility_formula_id text,
  pairwise_comparison_snapshot_id text,
  release_config_manifest_id text,
  protected_artifact_id text,
  metric_family text,
  metric_version text,
  formula_name text,
  formula_version text,
  action_kind text,
  policy_action_kind text,
  policy_decision_id text,
  policy_decision_consumption_id text,
  affected_artifact_ids text[] not null default '{}'::text[],
  approval_status text,
  workflow_status text not null,
  visibility_class text not null default 'admin_audit_only'
    check (visibility_class = 'admin_audit_only'),
  input_hash text not null,
  artifact_json jsonb not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists derived_utility_formulas (like metric_configs including all);
create table if not exists pairwise_comparison_snapshots (like metric_configs including all);
create table if not exists governance_approval_records (like metric_configs including all);
create table if not exists protected_artifact_revalidations (like metric_configs including all);

create table if not exists workflow_state_transition_logs (
  id text primary key,
  entity_type text not null check (
    entity_type in (
      'assignment',
      'rating',
      'discussion_thread',
      'post_lock_discussion_session',
      'adjudication_memo',
      'verification_record',
      'label_snapshot',
      'pairwise_comparison_snapshot',
      'evaluation_run',
      'training_export',
      'release_version'
    )
  ),
  entity_id text not null,
  assignment_id text,
  prior_state text not null,
  requested_next_state text not null,
  accepted_next_state text not null,
  actor_id text not null,
  actor_role text not null,
  guard_checks jsonb not null default '[]'::jsonb,
  failed_guard_reasons jsonb not null default '[]'::jsonb,
  lock_freeze_artifact_ids jsonb not null default '[]'::jsonb,
  source_tag_protected_visibility_state text not null,
  transition_status text not null check (transition_status in ('accepted_guarded_transition', 'rejected_guarded_transition')),
  timestamp timestamptz not null,
  event_type text not null,
  event_id text,
  payload_hash text check (payload_hash is null or payload_hash like 'sha256:%'),
  actor_hash text check (actor_hash is null or actor_hash like 'sha256:%'),
  received_at timestamptz,
  record_json jsonb not null default '{}'::jsonb,
  check (
    (transition_status = 'accepted_guarded_transition' and requested_next_state = accepted_next_state)
    or (transition_status = 'rejected_guarded_transition' and prior_state = accepted_next_state)
  )
);

create table if not exists source_cards (
  id text primary key,
  title text not null,
  source_author text not null,
  source_work text not null,
  source_publisher_or_site text not null,
  publication_year text not null,
  uploaded_file_id text,
  source_type text not null check (
    source_type in ('book', 'article', 'paper', 'blog_forum_magazine', 'dataset', 'coursework', 'other')
  ),
  source_locator text not null,
  source_provenance_summary text not null,
  rights_status text not null,
  source_language text not null,
  translation_status text not null check (
    translation_status in ('original_language', 'human_translated', 'machine_translated', 'mixed_or_unknown')
  ),
  translation_route text not null,
  task_format text not null check (
    task_format in ('position_source', 'critique_source', 'mixed_position_and_critique_source', 'background_context_source')
  ),
  source_dataset_name text not null,
  source_subsource text not null,
  source_domain_suitability text not null check (
    source_domain_suitability in (
      'suitable_conceptual',
      'mixed_conceptual_empirical',
      'argumentative_debate_material_not_ordinary_conceptual_position_by_default',
      'translation_and_topic_concentration_must_be_disclosed_before_comparability_claims',
      'usually_not_suitable_domains_unless_explicitly_labeled',
      'unknown_review_required'
    )
  ),
  source_domain_concentration text not null,
  lsat_derived boolean not null default false,
  admin_notes text not null,
  source_access_policy text not null check (
    source_access_policy in ('admin_review_only', 'internal_review_allowed', 'rights_cleared_for_preparation', 'metadata_only_until_rights_review')
  ),
  release_policy text not null check (
    release_policy in ('not_releasable_raw_source', 'prepared_text_only_after_review', 'metadata_only_public_reference', 'rights_cleared_excerpt_after_review')
  ),
  source_visibility text not null check (source_visibility = 'admin_only_not_rater_visible'),
  created_by text not null,
  created_at timestamptz not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists source_spans (
  id text primary key,
  source_card_id text not null references source_cards(id),
  span_locator text not null,
  bounded_locator text not null,
  span_kind text not null check (
    span_kind in ('argumentative_claim', 'argument_context', 'objection_target', 'definition', 'example', 'other')
  ),
  text_hash text not null check (text_hash like 'sha256:%'),
  admin_excerpt text,
  excerpt_storage_policy text not null,
  segmentation_status text not null check (
    segmentation_status in ('manually_selected', 'imported_locator', 'needs_respan', 'superseded')
  ),
  extraction_status text not null check (
    extraction_status in ('not_extracted', 'selected_for_extraction', 'extraction_imported', 'reviewed', 'superseded')
  ),
  admin_selection_notes text not null,
  source_visibility text not null check (source_visibility = 'admin_only_not_rater_visible'),
  created_by text not null,
  created_at timestamptz not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists extraction_batches (
  id text primary key,
  source_card_id text not null references source_cards(id),
  import_format text not null check (import_format = 'jsonl'),
  imported_by text not null,
  imported_at timestamptz not null,
  extraction_count integer not null check (extraction_count >= 0),
  parser_version text not null,
  import_route text not null,
  extraction_execution_mode text not null,
  downstream_integration_status text not null check (downstream_integration_status = 'not_integrated_phase_1'),
  creates_prepared_draft boolean not null default false check (creates_prepared_draft = false),
  creates_candidate_item boolean not null default false check (creates_candidate_item = false),
  creates_candidate_batch boolean not null default false check (creates_candidate_batch = false),
  live_queue_integration boolean not null default false check (live_queue_integration = false),
  ai_extraction_executed boolean not null default false check (ai_extraction_executed = false),
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists argument_extractions (
  id text primary key,
  extraction_batch_id text not null references extraction_batches(id),
  source_card_id text not null references source_cards(id),
  source_span_ids text[] not null check (coalesce(array_length(source_span_ids, 1), 0) > 0),
  argument_role text not null check (argument_role in ('position_argument', 'critique_argument', 'mixed_position_and_critique')),
  intended_conclusion text not null,
  key_premises text[] not null check (coalesce(array_length(key_premises, 1), 0) > 0),
  argument_summary text not null,
  implicit_assumptions text[] not null default '{}'::text[],
  critique_target text,
  context_needed text not null,
  conceptual_scope_notes text not null,
  suitability_notes text not null,
  possible_prepared_position_text text,
  possible_prepared_critique_text text,
  model_prompt_provenance jsonb not null default '{}'::jsonb,
  extracted_position_text text not null default '',
  extraction_rationale text not null,
  extraction_method text not null check (
    extraction_method in (
      'manual_jsonl_import',
      'operator_entered_jsonl_import',
      'external_jsonl_import_no_platform_ai_execution',
      'external_ai_assisted_jsonl_import_no_platform_ai_execution'
    )
  ),
  review_status text not null check (review_status in ('pending_admin_review', 'accepted_for_position_intake', 'accepted_for_critique_intake', 'accepted_for_source_preparation', 'needs_revision', 'rejected', 'deferred')),
  review_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  downstream_integration_status text not null check (downstream_integration_status = 'not_integrated_phase_1'),
  source_visibility text not null check (source_visibility = 'admin_only_not_rater_visible'),
  imported_at timestamptz not null,
  creates_prepared_draft boolean not null default false check (creates_prepared_draft = false),
  creates_candidate_item boolean not null default false check (creates_candidate_item = false),
  creates_candidate_batch boolean not null default false check (creates_candidate_batch = false),
  live_queue_integration boolean not null default false check (live_queue_integration = false),
  ai_extraction_executed boolean not null default false check (ai_extraction_executed = false),
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists argument_extraction_source_spans (
  argument_extraction_id text not null references argument_extractions(id) on delete cascade,
  source_span_id text not null references source_spans(id),
  source_card_id text not null references source_cards(id),
  position_index integer not null check (position_index >= 0),
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  primary key (argument_extraction_id, source_span_id)
);

create table if not exists prepared_drafts (
  id text primary key,
  source_contribution_part_id text,
  source_submission_id text,
  source_argument_extraction_id text references argument_extractions(id),
  source_extraction_batch_id text,
  source_card_id text,
  source_span_ids text[] not null default '{}'::text[],
  draft_type text not null check (draft_type in ('prepared_position_draft', 'prepared_critique_draft', 'prepared_source_card_draft')),
  prepared_text text,
  prepared_source_card_content jsonb,
  candidate_rater_visible_text text,
  blinding_review_status text not null,
  source_leakage_review_status text not null,
  gate_readiness_status text not null,
  candidate_item_readiness text not null,
  prepared_draft_status text not null check (
    prepared_draft_status in (
      'drafting',
      'needs_clarification',
      'blocked_by_required_gate',
      'ready_for_candidate_item_creation',
      'promoted_to_candidate_item',
      'rejected',
      'closed'
    )
  ),
  target_prepared_draft_id text,
  target_candidate_item_id text,
  target_position_id text,
  source_preparation_phase text,
  source_preparation_review_status text,
  audit_trail jsonb not null default '{}'::jsonb,
  visibility_classes jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz,
  updated_at timestamptz,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  check (
    source_argument_extraction_id is not null
    or source_contribution_part_id is not null
    or source_submission_id is not null
  )
);

create table if not exists review_signals (
  id text primary key,
  signal_type text not null,
  source text not null check (source in ('automated_prescreen', 'deterministic_rule', 'human_reviewer', 'admin')),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  explanation text not null,
  affected_object_type text not null check (
    affected_object_type in (
      'ContributionSubmission',
      'ContributionPart',
      'OriginDisclosure',
      'PreparedDraft',
      'SourceCard',
      'SourceSpan',
      'ExtractionBatch',
      'ArgumentExtraction',
      'CandidateItem',
      'CandidateBatch'
    )
  ),
  affected_object_id text not null,
  reviewer_id text,
  related_gate_ids text[] not null default '{}'::text[],
  visibility_class text not null check (visibility_class in ('admin_only', 'reviewer_visible', 'never_rater_visible')),
  created_at timestamptz,
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists gate_decisions (
  id text primary key,
  gate_id text not null,
  workflow_policy_id text not null,
  object_type text,
  object_id text not null,
  gate_status text not null check (
    gate_status in ('not_started', 'not_applicable', 'pending', 'passed', 'failed', 'waived_with_reason')
  ),
  decision_source text not null,
  cited_review_signal_ids text[] not null default '{}'::text[],
  decision_note text not null default '',
  waiver_reason text,
  reviewer_id text,
  visibility_class text not null check (visibility_class = 'admin_only'),
  timestamp timestamptz,
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  check (gate_status <> 'waived_with_reason' or waiver_reason is not null)
);

create table if not exists candidate_items (
  id text primary key,
  item_type text not null check (item_type in ('candidate_position', 'candidate_critique', 'source_card')),
  source_prepared_draft_id text not null references prepared_drafts(id),
  source_contribution_part_id text,
  source_argument_extraction_id text,
  source_extraction_batch_id text,
  source_card_id text,
  source_span_ids text[] not null default '{}'::text[],
  target_prepared_draft_id text,
  target_candidate_item_id text,
  target_position_id text,
  candidate_rater_visible_text text,
  candidate_source_card_content jsonb,
  candidate_item_status text not null,
  downstream_promotion_status text not null check (downstream_promotion_status = 'not_promoted_to_live'),
  public_release_eligibility_status text not null,
  model_training_export_eligibility_status text not null,
  validation_use_eligibility_status text not null,
  hidden_benchmark_eligibility_status text not null,
  assignment_exclusion_required boolean not null check (assignment_exclusion_required = true),
  visibility_classes jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz,
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists promotion_records (
  id text primary key,
  source_prepared_draft_id text not null references prepared_drafts(id),
  target_candidate_item_id text not null references candidate_items(id),
  target_type text not null check (target_type in ('candidate_position', 'candidate_critique', 'source_card')),
  promoted_by text,
  promoted_at timestamptz,
  created_live_record boolean not null default false check (created_live_record = false),
  created_candidate_batch boolean not null default false check (created_candidate_batch = false),
  audit_trail jsonb not null default '{}'::jsonb,
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists policy_action_kinds (
  id text primary key,
  action_kind text not null unique,
  requires_current_decision boolean not null check (requires_current_decision = true),
  requires_manifest_binding boolean not null check (requires_manifest_binding = true),
  requires_actor_binding boolean not null check (requires_actor_binding = true),
  requires_output_schema_binding boolean not null check (requires_output_schema_binding = true),
  requires_phase_gate_binding boolean not null check (requires_phase_gate_binding = true),
  requires_idempotency_binding boolean not null check (requires_idempotency_binding = true),
  replay_protection text not null check (replay_protection in ('single_use', 'idempotency_bound')),
  wrong_scope_behavior text not null check (wrong_scope_behavior = 'fail_closed'),
  activated_at timestamptz not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists policy_decisions (
  id text primary key,
  action_kind_id text not null,
  action_kind text not null,
  decision_status text not null check (decision_status = 'allow'),
  actor_id text not null,
  actor_role text,
  manifest_id text not null,
  manifest_hash text not null check (manifest_hash like 'sha256:%'),
  phase_gate_bundle_id text not null,
  phase_gate_bundle_hash text not null check (phase_gate_bundle_hash like 'sha256:%'),
  release_id text not null,
  output_schema_version text not null,
  output_schema_hash text not null check (output_schema_hash like 'sha256:%'),
  target_artifact_ids jsonb not null default '[]'::jsonb,
  idempotency_key text,
  single_use boolean,
  replay_status text not null check (replay_status = 'unused'),
  manifest_binding_status text not null check (manifest_binding_status = 'matched'),
  output_schema_binding_status text not null check (output_schema_binding_status = 'matched'),
  phase_gate_binding_status text not null check (phase_gate_binding_status = 'matched'),
  idempotency_binding_status text not null check (idempotency_binding_status = 'matched'),
  expires_at timestamptz not null,
  decided_at timestamptz not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists policy_decision_consumptions (
  id text primary key,
  decision_id text not null,
  action_kind text not null,
  manifest_id text not null,
  manifest_hash text not null check (manifest_hash like 'sha256:%'),
  phase_gate_bundle_id text not null,
  phase_gate_bundle_hash text not null check (phase_gate_bundle_hash like 'sha256:%'),
  output_schema_version text not null,
  output_schema_hash text not null check (output_schema_hash like 'sha256:%'),
  idempotency_key text not null,
  replay_rejected boolean not null check (replay_rejected = false),
  scope_matched boolean not null check (scope_matched = true),
  consumed_at timestamptz not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists implementation_phase_gate_bundles (
  id text primary key,
  release_id text not null,
  manifest_id text not null,
  version text not null,
  future_phase_default text not null check (future_phase_default = 'blocked'),
  broadening_requires_manifest_activation boolean not null check (broadening_requires_manifest_activation = true),
  frozen_at timestamptz not null,
  event_id text,
  record_json jsonb not null default '{}'::jsonb
);

create table if not exists implementation_phase_gate_lanes (
  bundle_id text not null references implementation_phase_gate_bundles(id) on delete cascade,
  lane_kind text not null check (
    lane_kind in (
      'route',
      'worker',
      'queue',
      'ui_panel',
      'export_path',
      'evaluation_lane',
      'hidden_benchmark_submission_lane',
      'governance_action'
    )
  ),
  phase_state text not null check (phase_state in ('enabled', 'staff_only', 'shadow', 'disabled_stub', 'blocked')),
  allowed_action_kinds jsonb not null default '[]'::jsonb,
  required_feature_flags jsonb not null default '[]'::jsonb,
  unavailable_response_class text,
  rollout_owner text,
  fail_closed boolean not null check (fail_closed = true),
  no_side_effects_when_disabled boolean not null check (no_side_effects_when_disabled = true),
  labels_exposed_when_disabled boolean not null check (labels_exposed_when_disabled = false),
  supports_release_claims_when_disabled boolean not null check (supports_release_claims_when_disabled = false),
  position_index integer not null check (position_index >= 0),
  event_id text,
  record_json jsonb not null default '{}'::jsonb,
  primary key (bundle_id, lane_kind)
);

alter table positions add column if not exists event_id text;
alter table positions add column if not exists record_json jsonb not null default '{}'::jsonb;
alter table position_text_versions add column if not exists model_visible_hash text;
alter table position_text_versions add column if not exists event_id text;
alter table position_text_versions add column if not exists record_json jsonb not null default '{}'::jsonb;
alter table critiques add column if not exists event_id text;
alter table critiques add column if not exists record_json jsonb not null default '{}'::jsonb;
alter table critique_text_versions add column if not exists model_visible_hash text;
alter table critique_text_versions add column if not exists event_id text;
alter table critique_text_versions add column if not exists record_json jsonb not null default '{}'::jsonb;
alter table assignments add column if not exists rater_external_id text;
alter table assignments add column if not exists workflow_profile_id text;
alter table assignments add column if not exists rating_context_snapshot_id text;
alter table assignments add column if not exists blind_state text;
alter table assignments add column if not exists source_tag_visibility_state text;
alter table assignments add column if not exists event_id text;
alter table assignments add column if not exists record_json jsonb not null default '{}'::jsonb;
alter table rating_context_snapshots add column if not exists target_critique_id text;
alter table rating_context_snapshots add column if not exists model_visible_context_hash text;
alter table rating_context_snapshots add column if not exists event_id text;
alter table rating_context_snapshots add column if not exists record_json jsonb not null default '{}'::jsonb;
alter table label_snapshots add column if not exists event_id text;
alter table label_snapshots add column if not exists record_json jsonb not null default '{}'::jsonb;
alter table release_reports add column if not exists event_id text;
alter table release_reports add column if not exists record_json jsonb not null default '{}'::jsonb;
alter table source_cards add column if not exists source_author text not null default '';
alter table source_cards add column if not exists source_work text not null default '';
alter table source_cards add column if not exists source_publisher_or_site text not null default '';
alter table source_cards add column if not exists publication_year text not null default 'unknown';
alter table source_cards add column if not exists uploaded_file_id text;
alter table source_cards add column if not exists translation_status text not null default 'original_language'
  check (translation_status in ('original_language', 'human_translated', 'machine_translated', 'mixed_or_unknown'));
alter table source_cards add column if not exists translation_route text not null default 'unknown_or_review_required';
alter table source_cards add column if not exists task_format text not null default 'position_source'
  check (task_format in ('position_source', 'critique_source', 'mixed_position_and_critique_source', 'background_context_source'));
alter table source_cards add column if not exists source_dataset_name text not null default 'unknown_or_review_required';
alter table source_cards add column if not exists source_subsource text not null default 'unknown_or_review_required';
alter table source_cards add column if not exists source_domain_suitability text not null default 'unknown_review_required';
alter table source_cards drop constraint if exists source_cards_source_domain_suitability_check;
alter table source_cards add constraint source_cards_source_domain_suitability_check check (
  source_domain_suitability in (
    'suitable_conceptual',
    'mixed_conceptual_empirical',
    'argumentative_debate_material_not_ordinary_conceptual_position_by_default',
    'translation_and_topic_concentration_must_be_disclosed_before_comparability_claims',
    'usually_not_suitable_domains_unless_explicitly_labeled',
    'unknown_review_required'
  )
);
alter table source_cards add column if not exists source_domain_concentration text not null default 'unknown_or_review_required';
alter table source_cards add column if not exists lsat_derived boolean not null default false;
alter table source_cards add column if not exists admin_notes text not null default '';
alter table source_cards add column if not exists source_access_policy text not null default 'admin_review_only'
  check (source_access_policy in ('admin_review_only', 'internal_review_allowed', 'rights_cleared_for_preparation', 'metadata_only_until_rights_review'));
alter table source_cards add column if not exists release_policy text not null default 'prepared_text_only_after_review'
  check (release_policy in ('not_releasable_raw_source', 'prepared_text_only_after_review', 'metadata_only_public_reference', 'rights_cleared_excerpt_after_review'));
alter table source_spans add column if not exists bounded_locator text not null default '';
alter table source_spans add column if not exists admin_excerpt text;
alter table source_spans add column if not exists segmentation_status text not null default 'manually_selected'
  check (segmentation_status in ('manually_selected', 'imported_locator', 'needs_respan', 'superseded'));
alter table source_spans add column if not exists extraction_status text not null default 'selected_for_extraction'
  check (extraction_status in ('not_extracted', 'selected_for_extraction', 'extraction_imported', 'reviewed', 'superseded'));
alter table source_spans add column if not exists admin_selection_notes text not null default '';
alter table argument_extractions add column if not exists argument_role text not null default 'position_argument'
  check (argument_role in ('position_argument', 'critique_argument', 'mixed_position_and_critique'));
alter table argument_extractions add column if not exists intended_conclusion text not null default '';
alter table argument_extractions add column if not exists key_premises text[] not null default '{}'::text[];
alter table argument_extractions add column if not exists argument_summary text not null default '';
alter table argument_extractions add column if not exists implicit_assumptions text[] not null default '{}'::text[];
alter table argument_extractions add column if not exists critique_target text;
alter table argument_extractions add column if not exists context_needed text not null default '';
alter table argument_extractions add column if not exists conceptual_scope_notes text not null default '';
alter table argument_extractions add column if not exists suitability_notes text not null default '';
alter table argument_extractions add column if not exists possible_prepared_position_text text;
alter table argument_extractions add column if not exists possible_prepared_critique_text text;
alter table argument_extractions add column if not exists model_prompt_provenance jsonb not null default '{}'::jsonb;
alter table argument_extractions drop constraint if exists argument_extractions_extraction_method_check;
alter table argument_extractions add constraint argument_extractions_extraction_method_check
  check (
    extraction_method in (
      'manual_jsonl_import',
      'operator_entered_jsonl_import',
      'external_jsonl_import_no_platform_ai_execution',
      'external_ai_assisted_jsonl_import_no_platform_ai_execution'
    )
  );
alter table metaphilosophy_task_tracks add column if not exists architecture_layer_id text;
alter table metaphilosophy_task_tracks add column if not exists release_claim_role text;
alter table metaphilosophy_task_tracks add column if not exists boundary_rule text;
alter table metaphilosophy_research_backlog_items add column if not exists architecture_layer_id text;
alter table metaphilosophy_research_backlog_items add column if not exists release_claim_role text;
alter table metaphilosophy_research_backlog_items add column if not exists boundary_rule text;

create index if not exists position_text_versions_position_idx
  on position_text_versions (position_id);

create index if not exists critique_text_versions_critique_idx
  on critique_text_versions (critique_id);

create index if not exists assignments_rater_external_idx
  on assignments (rater_external_id);

create index if not exists assignments_rating_context_snapshot_idx
  on assignments (rating_context_snapshot_id);

create index if not exists rating_context_snapshots_position_idx
  on rating_context_snapshots (position_id);

create index if not exists label_snapshots_release_idx
  on label_snapshots (release_id);

create index if not exists release_reports_release_idx
  on release_reports (release_id);

create index if not exists release_versions_release_idx
  on release_versions (release_id);

create index if not exists release_versions_config_manifest_idx
  on release_versions (release_config_manifest_id);

create index if not exists release_versions_phase_gate_bundle_idx
  on release_versions (phase_gate_bundle_id);

create index if not exists release_freezes_release_idx
  on release_freezes (release_id);

create index if not exists release_freezes_config_manifest_idx
  on release_freezes (release_config_manifest_id);

create index if not exists release_gate_profiles_release_idx
  on release_gate_profiles (release_id);

create index if not exists governed_bundle_canonicalization_profiles_release_idx
  on governed_bundle_canonicalization_profiles (release_id);

create index if not exists governed_bundle_records_release_idx
  on governed_bundle_records (release_id);

create index if not exists governed_bundle_records_family_idx
  on governed_bundle_records (governed_bundle_family);

create index if not exists governed_bundle_verifications_release_idx
  on governed_bundle_verifications (release_id);

create index if not exists governed_bundle_verifications_bundle_idx
  on governed_bundle_verifications (governed_bundle_id);

create index if not exists release_config_manifests_release_idx
  on release_config_manifests (release_id);

create index if not exists release_config_manifests_release_gate_profile_idx
  on release_config_manifests (release_gate_profile_id);

create index if not exists release_config_manifest_verifications_release_idx
  on release_config_manifest_verifications (release_id);

create index if not exists release_config_manifest_verifications_manifest_idx
  on release_config_manifest_verifications (release_config_manifest_id);

create index if not exists metaphilosophy_architecture_layers_release_idx
  on metaphilosophy_architecture_layers (release_id);

create index if not exists metaphilosophy_architecture_layers_layer_idx
  on metaphilosophy_architecture_layers (architecture_layer_id);

create index if not exists metaphilosophy_architecture_layers_release_claim_role_idx
  on metaphilosophy_architecture_layers (release_claim_role);

create index if not exists metaphilosophy_task_tracks_release_idx
  on metaphilosophy_task_tracks (release_id);

create index if not exists metaphilosophy_task_tracks_track_idx
  on metaphilosophy_task_tracks (track_id);

create index if not exists metaphilosophy_task_tracks_lmca_relationship_idx
  on metaphilosophy_task_tracks (lmca_relationship);

create index if not exists metaphilosophy_research_backlog_items_release_idx
  on metaphilosophy_research_backlog_items (release_id);

create index if not exists metaphilosophy_research_backlog_items_experiment_idx
  on metaphilosophy_research_backlog_items (experiment_type);

create index if not exists metaphilosophy_research_backlog_items_release_gate_idx
  on metaphilosophy_research_backlog_items (release_gate_status);

create index if not exists corpus_manifests_release_idx
  on corpus_manifests (release_id);

create index if not exists training_exports_release_idx
  on training_exports (release_id);

create index if not exists export_manifests_release_idx
  on export_manifests (release_id);

create index if not exists model_improvement_policies_release_idx
  on model_improvement_policies (release_id);

create index if not exists model_improvement_runs_release_idx
  on model_improvement_runs (release_id);

create index if not exists evaluation_runs_release_idx
  on evaluation_runs (release_id);

create index if not exists model_evaluation_predictions_release_idx
  on model_evaluation_predictions (release_id);

create index if not exists model_evaluation_predictions_evaluation_idx
  on model_evaluation_predictions (related_evaluation_run_id);

create index if not exists calibration_runs_release_idx
  on calibration_runs (release_id);

create index if not exists calibration_runs_evaluation_idx
  on calibration_runs (related_evaluation_run_id);

create index if not exists leaderboards_release_idx
  on leaderboards (release_id);

create index if not exists model_failure_audits_release_idx
  on model_failure_audits (release_id);

create index if not exists model_failure_audits_evaluation_idx
  on model_failure_audits (related_evaluation_run_id);

create index if not exists artifact_probe_runs_release_idx
  on artifact_probe_runs (release_id);

create index if not exists sycophancy_probe_runs_release_idx
  on sycophancy_probe_runs (release_id);

create index if not exists obfuscation_stress_runs_release_idx
  on obfuscation_stress_runs (release_id);

create index if not exists sanity_baseline_runs_release_idx
  on sanity_baseline_runs (release_id);

create index if not exists model_run_reproducibility_policies_release_idx
  on model_run_reproducibility_policies (release_id);

create index if not exists model_inference_configs_release_idx
  on model_inference_configs (release_id);

create index if not exists model_run_environments_release_idx
  on model_run_environments (release_id);

create index if not exists model_provider_data_handling_policies_release_idx
  on model_provider_data_handling_policies (release_id);

create index if not exists prompt_templates_release_idx
  on prompt_templates (release_id);

create index if not exists parser_configs_release_idx
  on parser_configs (release_id);

create index if not exists certification_threshold_policies_release_idx
  on certification_threshold_policies (release_id);

create index if not exists certification_threshold_policies_status_idx
  on certification_threshold_policies (artifact_status);

create index if not exists certification_records_release_idx
  on certification_records (release_id);

create index if not exists certification_records_policy_idx
  on certification_records (policy_id);

create index if not exists gold_items_release_idx
  on gold_items (release_id);

create index if not exists gold_items_item_idx
  on gold_items (position_id, critique_id);

create index if not exists benchmark_split_members_release_idx
  on benchmark_split_members (release_id);

create index if not exists benchmark_split_members_split_idx
  on benchmark_split_members (split_name);

create index if not exists benchmark_freeze_reports_release_idx
  on benchmark_freeze_reports (release_id);

create index if not exists benchmark_freeze_reports_status_idx
  on benchmark_freeze_reports (artifact_status);

create index if not exists rights_clearance_policies_release_idx
  on rights_clearance_policies (release_id);

create index if not exists rights_clearance_policies_status_idx
  on rights_clearance_policies (artifact_status);

create index if not exists rights_records_release_idx
  on rights_records (release_id);

create index if not exists rights_records_policy_idx
  on rights_records (policy_id);

create index if not exists rights_records_status_idx
  on rights_records (artifact_status);

create index if not exists benchmark_refresh_policies_release_idx
  on benchmark_refresh_policies (release_id);

create index if not exists benchmark_refresh_policies_status_idx
  on benchmark_refresh_policies (artifact_status);

create index if not exists validation_tranche_evidence_release_idx
  on validation_tranche_evidence (release_id);

create index if not exists validation_tranche_evidence_target_label_snapshot_idx
  on validation_tranche_evidence (target_label_snapshot_id);

create index if not exists human_ceiling_runs_release_idx
  on human_ceiling_runs (release_id);

create index if not exists human_ceiling_runs_target_label_snapshot_idx
  on human_ceiling_runs (target_label_snapshot_id);

create index if not exists human_ceiling_runs_evaluation_run_idx
  on human_ceiling_runs (evaluation_run_id);

create index if not exists comparability_tier_policies_release_idx
  on comparability_tier_policies (release_id);

create index if not exists comparability_tier_policies_status_idx
  on comparability_tier_policies (artifact_status);

create index if not exists comparability_claims_release_idx
  on comparability_claims (release_id);

create index if not exists comparability_claims_release_gate_profile_idx
  on comparability_claims (release_gate_profile_id);

create index if not exists release_erratum_disclosure_policies_release_idx
  on release_erratum_disclosure_policies (release_id);

create index if not exists release_erratum_disclosure_policies_status_idx
  on release_erratum_disclosure_policies (artifact_status);

create index if not exists release_errata_release_idx
  on release_errata (release_id);

create index if not exists release_errata_policy_idx
  on release_errata (policy_id);

create index if not exists benchmark_submission_policies_release_idx
  on benchmark_submission_policies (release_id);

create index if not exists benchmark_submission_policies_status_idx
  on benchmark_submission_policies (artifact_status);

create index if not exists benchmark_submissions_release_idx
  on benchmark_submissions (release_id);

create index if not exists benchmark_submissions_policy_idx
  on benchmark_submissions (policy_id);

create index if not exists discussions_thread_idx
  on discussions (discussion_thread_id);

create index if not exists discussions_item_idx
  on discussions (position_id, critique_id);

create index if not exists discussion_threads_item_idx
  on discussion_threads (position_id, critique_id);

create index if not exists discussion_threads_status_idx
  on discussion_threads (workflow_status);

create index if not exists discussion_comments_thread_idx
  on discussion_comments (discussion_thread_id);

create index if not exists discussion_revision_proposals_thread_idx
  on discussion_revision_proposals (discussion_thread_id);

create index if not exists post_lock_discussion_sessions_thread_idx
  on post_lock_discussion_sessions (discussion_thread_id);

create index if not exists adjudications_thread_idx
  on adjudications (discussion_thread_id);

create index if not exists adjudications_item_idx
  on adjudications (position_id, critique_id);

create index if not exists adjudication_review_sessions_thread_idx
  on adjudication_review_sessions (discussion_thread_id);

create index if not exists adjudication_review_sessions_adjudication_idx
  on adjudication_review_sessions (adjudication_id);

create index if not exists adjudication_memos_thread_idx
  on adjudication_memos (discussion_thread_id);

create index if not exists adjudication_memos_item_idx
  on adjudication_memos (position_id, critique_id);

create index if not exists adjudication_finalizations_adjudication_idx
  on adjudication_finalizations (adjudication_id);

create index if not exists adjudication_finalizations_thread_idx
  on adjudication_finalizations (discussion_thread_id);

create index if not exists verification_records_item_idx
  on verification_records (position_id, critique_id);

create index if not exists verification_records_status_idx
  on verification_records (workflow_status);

create index if not exists verification_evidence_artifacts_record_idx
  on verification_evidence_artifacts (verification_record_id);

create index if not exists verification_evidence_artifacts_workspace_idx
  on verification_evidence_artifacts (verification_workspace_id);

create index if not exists interpretation_target_maps_policy_idx
  on interpretation_target_maps (policy_id);

create index if not exists interpretation_target_maps_item_idx
  on interpretation_target_maps (position_id, critique_id);

create index if not exists verification_workspace_sessions_policy_idx
  on verification_workspace_sessions (policy_id);

create index if not exists verification_workspace_sessions_item_idx
  on verification_workspace_sessions (position_id, critique_id);

create index if not exists adjudicator_pre_reads_policy_idx
  on adjudicator_pre_reads (policy_id);

create index if not exists adjudicator_pre_reads_memo_idx
  on adjudicator_pre_reads (adjudication_memo_id);

create index if not exists calibration_feedback_events_rater_idx
  on calibration_feedback_events (rater_id);

create index if not exists calibration_feedback_events_rating_idx
  on calibration_feedback_events (rating_id);

create index if not exists source_recognition_events_assignment_idx
  on source_recognition_events (assignment_id);

create index if not exists source_recognition_events_item_idx
  on source_recognition_events (position_id, critique_id);

create index if not exists external_assistance_contamination_policies_policy_idx
  on external_assistance_contamination_policies (policy_id);

create index if not exists external_assistance_declarations_assignment_idx
  on external_assistance_declarations (assignment_id);

create index if not exists external_assistance_declarations_policy_idx
  on external_assistance_declarations (policy_id);

create index if not exists spot_check_sampling_policies_policy_idx
  on spot_check_sampling_policies (policy_id);

create index if not exists spot_check_qa_items_policy_idx
  on spot_check_qa_items (policy_id);

create index if not exists spot_check_qa_items_assignment_idx
  on spot_check_qa_items (assignment_id);

create index if not exists adjudication_triage_queue_items_item_idx
  on adjudication_triage_queue_items (position_id, critique_id);

create index if not exists diagnostic_deferral_visibility_policies_policy_idx
  on diagnostic_deferral_visibility_policies (policy_id);

create index if not exists diagnostic_deferral_records_policy_idx
  on diagnostic_deferral_records (policy_id);

create index if not exists diagnostic_deferral_records_item_idx
  on diagnostic_deferral_records (position_id, critique_id);

create index if not exists source_spans_source_card_idx
  on source_spans (source_card_id);

create index if not exists extraction_batches_source_card_idx
  on extraction_batches (source_card_id);

create index if not exists argument_extractions_batch_idx
  on argument_extractions (extraction_batch_id);

create index if not exists argument_extractions_source_card_idx
  on argument_extractions (source_card_id);

create index if not exists argument_extraction_source_spans_span_idx
  on argument_extraction_source_spans (source_span_id);

create index if not exists argument_extraction_source_spans_source_card_idx
  on argument_extraction_source_spans (source_card_id);

create index if not exists prepared_drafts_source_extraction_idx
  on prepared_drafts (source_argument_extraction_id);

create index if not exists prepared_drafts_status_idx
  on prepared_drafts (prepared_draft_status);

create index if not exists review_signals_affected_object_idx
  on review_signals (affected_object_type, affected_object_id);

create index if not exists gate_decisions_object_idx
  on gate_decisions (workflow_policy_id, object_id);

create index if not exists candidate_items_source_prepared_draft_idx
  on candidate_items (source_prepared_draft_id);

create index if not exists candidate_items_status_idx
  on candidate_items (candidate_item_status);

create index if not exists promotion_records_source_prepared_draft_idx
  on promotion_records (source_prepared_draft_id);

create index if not exists promotion_records_target_candidate_item_idx
  on promotion_records (target_candidate_item_id);

create index if not exists policy_decisions_action_kind_idx
  on policy_decisions (action_kind);

create index if not exists policy_decisions_phase_gate_bundle_idx
  on policy_decisions (phase_gate_bundle_id);

create index if not exists policy_decision_consumptions_decision_idx
  on policy_decision_consumptions (decision_id);

create index if not exists implementation_phase_gate_lanes_state_idx
  on implementation_phase_gate_lanes (phase_state);

create index if not exists ratings_assignment_idx
  on ratings (assignment_id);

create index if not exists ratings_position_critique_idx
  on ratings (position_id, critique_id);

create index if not exists ratings_rater_idx
  on ratings (rater_id);

create index if not exists ratings_kind_idx
  on ratings (kind);

create index if not exists rater_instruction_compatibility_policies_release_idx
  on rater_instruction_compatibility_policies (release_id);

create index if not exists rater_instruction_compatibility_policies_status_idx
  on rater_instruction_compatibility_policies (artifact_status);

create index if not exists rater_instruction_render_versions_release_idx
  on rater_instruction_render_versions (release_id);

create index if not exists rater_instruction_render_versions_compatibility_idx
  on rater_instruction_render_versions (rater_instruction_compatibility_policy_id);

create index if not exists rater_instruction_render_versions_workflow_profile_idx
  on rater_instruction_render_versions (workflow_profile_id);

create index if not exists rubric_copy_traceability_maps_release_idx
  on rubric_copy_traceability_maps (release_id);

create index if not exists rubric_copy_traceability_maps_copy_bundle_idx
  on rubric_copy_traceability_maps (copy_bundle_id);

create index if not exists rubric_copy_traceability_maps_release_config_idx
  on rubric_copy_traceability_maps (release_config_manifest_id);

create index if not exists rater_instruction_comprehension_audits_render_idx
  on rater_instruction_comprehension_audits (rater_instruction_render_version_id);

create index if not exists rater_instruction_comprehension_audits_compatibility_idx
  on rater_instruction_comprehension_audits (rater_instruction_compatibility_policy_id);

create index if not exists rater_instruction_comprehension_audits_traceability_idx
  on rater_instruction_comprehension_audits (rubric_copy_traceability_map_id);

create index if not exists session_pacing_policies_policy_idx
  on session_pacing_policies (policy_id);

create index if not exists rater_sessions_rater_idx
  on rater_sessions (rater_id);

create index if not exists rater_sessions_assignment_idx
  on rater_sessions (assignment_id);

create index if not exists public_example_practice_sessions_rater_idx
  on public_example_practice_sessions (rater_id);

create index if not exists public_example_practice_sessions_policy_idx
  on public_example_practice_sessions (policy_id);

create index if not exists rater_learning_plans_rater_idx
  on rater_learning_plans (rater_id);

create index if not exists rater_learning_plans_policy_idx
  on rater_learning_plans (policy_id);

create index if not exists source_anchor_examples_release_idx
  on source_anchor_examples (release_id);

create index if not exists ux_simplification_reviews_policy_idx
  on ux_simplification_reviews (policy_id);

create index if not exists item_issue_reports_policy_idx
  on item_issue_reports (policy_id);

create index if not exists item_issue_reports_item_idx
  on item_issue_reports (item_id);

create index if not exists item_issue_actions_issue_idx
  on item_issue_actions (issue_id);

create index if not exists screen_feature_parity_checks_screen_idx
  on screen_feature_parity_checks (screen_id);

create index if not exists simplified_copy_previews_screen_idx
  on simplified_copy_previews (screen_id);

create index if not exists metric_configs_family_idx
  on metric_configs (metric_family);

create index if not exists metric_configs_formula_idx
  on metric_configs (derived_utility_formula_id);

create index if not exists derived_utility_formulas_name_idx
  on derived_utility_formulas (formula_name);

create index if not exists pairwise_comparison_snapshots_target_label_idx
  on pairwise_comparison_snapshots (target_label_snapshot_id);

create index if not exists governance_approval_records_action_idx
  on governance_approval_records (action_kind);

create index if not exists governance_approval_records_policy_decision_idx
  on governance_approval_records (policy_decision_id);

create index if not exists protected_artifact_revalidations_artifact_idx
  on protected_artifact_revalidations (protected_artifact_id);

create index if not exists protected_artifact_revalidations_manifest_idx
  on protected_artifact_revalidations (release_config_manifest_id);

create index if not exists workflow_state_transition_logs_entity_idx
  on workflow_state_transition_logs (entity_type, entity_id);

create index if not exists workflow_state_transition_logs_status_idx
  on workflow_state_transition_logs (transition_status);

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
        and (
          assignments.rater_id = app_auth.current_user_id()
          or assignments.rater_external_id = app_auth.current_external_auth_id()
        )
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
        and (
          assignments.rater_id = app_auth.current_user_id()
          or assignments.rater_external_id = app_auth.current_external_auth_id()
        )
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
alter table release_versions enable row level security;
alter table release_freezes enable row level security;
alter table release_gate_profiles enable row level security;
alter table governed_bundle_canonicalization_profiles enable row level security;
alter table governed_bundle_records enable row level security;
alter table governed_bundle_verifications enable row level security;
alter table release_config_manifests enable row level security;
alter table release_config_manifest_verifications enable row level security;
alter table metaphilosophy_architecture_layers enable row level security;
alter table metaphilosophy_task_tracks enable row level security;
alter table metaphilosophy_research_backlog_items enable row level security;
alter table corpus_manifests enable row level security;
alter table training_exports enable row level security;
alter table export_manifests enable row level security;
alter table model_improvement_policies enable row level security;
alter table model_improvement_runs enable row level security;
alter table evaluation_runs enable row level security;
alter table model_evaluation_predictions enable row level security;
alter table calibration_runs enable row level security;
alter table leaderboards enable row level security;
alter table model_failure_audits enable row level security;
alter table artifact_probe_runs enable row level security;
alter table sycophancy_probe_runs enable row level security;
alter table obfuscation_stress_runs enable row level security;
alter table sanity_baseline_runs enable row level security;
alter table model_run_reproducibility_policies enable row level security;
alter table model_inference_configs enable row level security;
alter table model_run_environments enable row level security;
alter table model_provider_data_handling_policies enable row level security;
alter table prompt_templates enable row level security;
alter table parser_configs enable row level security;
alter table certification_threshold_policies enable row level security;
alter table certification_records enable row level security;
alter table gold_items enable row level security;
alter table benchmark_split_members enable row level security;
alter table benchmark_freeze_reports enable row level security;
alter table rights_clearance_policies enable row level security;
alter table rights_records enable row level security;
alter table benchmark_refresh_policies enable row level security;
alter table validation_tranche_evidence enable row level security;
alter table human_ceiling_runs enable row level security;
alter table comparability_tier_policies enable row level security;
alter table comparability_claims enable row level security;
alter table release_erratum_disclosure_policies enable row level security;
alter table release_errata enable row level security;
alter table benchmark_submission_policies enable row level security;
alter table benchmark_submissions enable row level security;
alter table discussions enable row level security;
alter table discussion_threads enable row level security;
alter table discussion_comments enable row level security;
alter table discussion_revision_proposals enable row level security;
alter table post_lock_discussion_sessions enable row level security;
alter table adjudications enable row level security;
alter table adjudication_review_sessions enable row level security;
alter table adjudication_memos enable row level security;
alter table adjudication_finalizations enable row level security;
alter table verification_records enable row level security;
alter table verification_evidence_artifacts enable row level security;
alter table adjudicator_pre_read_requiredness_policies enable row level security;
alter table adjudicator_pre_reads enable row level security;
alter table adjudication_cockpit_signoff_policies enable row level security;
alter table interpretation_target_map_requiredness_policies enable row level security;
alter table interpretation_target_maps enable row level security;
alter table verification_claim_granularity_policies enable row level security;
alter table verification_workspace_sessions enable row level security;
alter table calibration_feedback_events enable row level security;
alter table source_recognition_events enable row level security;
alter table external_assistance_contamination_policies enable row level security;
alter table external_assistance_declarations enable row level security;
alter table spot_check_sampling_policies enable row level security;
alter table spot_check_qa_items enable row level security;
alter table adjudication_triage_queue_items enable row level security;
alter table diagnostic_deferral_visibility_policies enable row level security;
alter table diagnostic_deferral_records enable row level security;
alter table ratings enable row level security;
alter table rating_score_values enable row level security;
alter table rater_instruction_compatibility_policies enable row level security;
alter table rater_instruction_render_versions enable row level security;
alter table rubric_copy_traceability_maps enable row level security;
alter table rater_instruction_comprehension_audits enable row level security;
alter table session_pacing_policies enable row level security;
alter table rater_sessions enable row level security;
alter table public_example_practice_sessions enable row level security;
alter table practice_sandbox_policies enable row level security;
alter table rater_dashboard_policies enable row level security;
alter table rater_learning_plans enable row level security;
alter table source_anchor_examples enable row level security;
alter table ux_simplification_policies enable row level security;
alter table ux_simplification_reviews enable row level security;
alter table item_issue_quarantine_policies enable row level security;
alter table item_issue_reports enable row level security;
alter table item_issue_actions enable row level security;
alter table screen_feature_parity_checks enable row level security;
alter table simplified_copy_previews enable row level security;
alter table metric_configs enable row level security;
alter table derived_utility_formulas enable row level security;
alter table pairwise_comparison_snapshots enable row level security;
alter table governance_approval_records enable row level security;
alter table protected_artifact_revalidations enable row level security;
alter table workflow_state_transition_logs enable row level security;
alter table source_cards enable row level security;
alter table source_spans enable row level security;
alter table extraction_batches enable row level security;
alter table argument_extractions enable row level security;
alter table argument_extraction_source_spans enable row level security;
alter table prepared_drafts enable row level security;
alter table review_signals enable row level security;
alter table gate_decisions enable row level security;
alter table candidate_items enable row level security;
alter table promotion_records enable row level security;
alter table policy_action_kinds enable row level security;
alter table policy_decisions enable row level security;
alter table policy_decision_consumptions enable row level security;
alter table implementation_phase_gate_bundles enable row level security;
alter table implementation_phase_gate_lanes enable row level security;

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
drop policy if exists positions_write_admin_or_service on positions;
create policy positions_write_admin_or_service on positions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists position_text_versions_read_assigned on position_text_versions;
create policy position_text_versions_read_assigned on position_text_versions
  for select
  using (app_auth.assigned_to_position(position_id));

drop policy if exists position_text_versions_write_admin on position_text_versions;
drop policy if exists position_text_versions_write_admin_or_service on position_text_versions;
create policy position_text_versions_write_admin_or_service on position_text_versions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists critiques_read_assigned on critiques;
create policy critiques_read_assigned on critiques
  for select
  using (app_auth.assigned_to_critique(id));

drop policy if exists critiques_write_admin on critiques;
drop policy if exists critiques_write_admin_or_service on critiques;
create policy critiques_write_admin_or_service on critiques
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists critique_text_versions_read_assigned on critique_text_versions;
create policy critique_text_versions_read_assigned on critique_text_versions
  for select
  using (app_auth.assigned_to_critique(critique_id));

drop policy if exists critique_text_versions_write_admin on critique_text_versions;
drop policy if exists critique_text_versions_write_admin_or_service on critique_text_versions;
create policy critique_text_versions_write_admin_or_service on critique_text_versions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists assignments_read_self_or_auditors on assignments;
create policy assignments_read_self_or_auditors on assignments
  for select
  using (
    app_auth.has_role('admin', 'auditor', 'expert')
    or rater_id = app_auth.current_user_id()
    or rater_external_id = app_auth.current_external_auth_id()
  );

drop policy if exists assignments_write_admin on assignments;
drop policy if exists assignments_write_admin_or_service on assignments;
create policy assignments_write_admin_or_service on assignments
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rating_context_snapshots_read_assigned on rating_context_snapshots;
create policy rating_context_snapshots_read_assigned on rating_context_snapshots
  for select
  using (app_auth.assigned_to_position(position_id));

drop policy if exists rating_context_snapshots_write_admin on rating_context_snapshots;
drop policy if exists rating_context_snapshots_write_admin_or_service on rating_context_snapshots;
create policy rating_context_snapshots_write_admin_or_service on rating_context_snapshots
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists label_snapshots_read_auditors on label_snapshots;
create policy label_snapshots_read_auditors on label_snapshots
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists label_snapshots_write_admin on label_snapshots;
drop policy if exists label_snapshots_write_admin_or_service on label_snapshots;
create policy label_snapshots_write_admin_or_service on label_snapshots
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists release_reports_read_auditors on release_reports;
create policy release_reports_read_auditors on release_reports
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists release_reports_write_admin on release_reports;
drop policy if exists release_reports_write_admin_or_service on release_reports;
create policy release_reports_write_admin_or_service on release_reports
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists release_versions_read_auditors on release_versions;
create policy release_versions_read_auditors on release_versions
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists release_versions_write_admin_or_service on release_versions;
create policy release_versions_write_admin_or_service on release_versions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists release_freezes_read_auditors on release_freezes;
create policy release_freezes_read_auditors on release_freezes
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists release_freezes_write_admin_or_service on release_freezes;
create policy release_freezes_write_admin_or_service on release_freezes
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists release_gate_profiles_read_auditors on release_gate_profiles;
create policy release_gate_profiles_read_auditors on release_gate_profiles
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists release_gate_profiles_write_admin_or_service on release_gate_profiles;
create policy release_gate_profiles_write_admin_or_service on release_gate_profiles
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists governed_bundle_canonicalization_profiles_read_auditors on governed_bundle_canonicalization_profiles;
create policy governed_bundle_canonicalization_profiles_read_auditors on governed_bundle_canonicalization_profiles
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists governed_bundle_canonicalization_profiles_write_admin_or_service on governed_bundle_canonicalization_profiles;
create policy governed_bundle_canonicalization_profiles_write_admin_or_service on governed_bundle_canonicalization_profiles
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists governed_bundle_records_read_auditors on governed_bundle_records;
create policy governed_bundle_records_read_auditors on governed_bundle_records
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists governed_bundle_records_write_admin_or_service on governed_bundle_records;
create policy governed_bundle_records_write_admin_or_service on governed_bundle_records
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists governed_bundle_verifications_read_auditors on governed_bundle_verifications;
create policy governed_bundle_verifications_read_auditors on governed_bundle_verifications
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists governed_bundle_verifications_write_admin_or_service on governed_bundle_verifications;
create policy governed_bundle_verifications_write_admin_or_service on governed_bundle_verifications
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists release_config_manifests_read_auditors on release_config_manifests;
create policy release_config_manifests_read_auditors on release_config_manifests
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists release_config_manifests_write_admin_or_service on release_config_manifests;
create policy release_config_manifests_write_admin_or_service on release_config_manifests
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists release_config_manifest_verifications_read_auditors on release_config_manifest_verifications;
create policy release_config_manifest_verifications_read_auditors on release_config_manifest_verifications
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists release_config_manifest_verifications_write_admin_or_service on release_config_manifest_verifications;
create policy release_config_manifest_verifications_write_admin_or_service on release_config_manifest_verifications
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists metaphilosophy_architecture_layers_read_auditors on metaphilosophy_architecture_layers;
create policy metaphilosophy_architecture_layers_read_auditors on metaphilosophy_architecture_layers
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists metaphilosophy_architecture_layers_write_admin_or_service on metaphilosophy_architecture_layers;
create policy metaphilosophy_architecture_layers_write_admin_or_service on metaphilosophy_architecture_layers
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists metaphilosophy_task_tracks_read_auditors on metaphilosophy_task_tracks;
create policy metaphilosophy_task_tracks_read_auditors on metaphilosophy_task_tracks
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists metaphilosophy_task_tracks_write_admin_or_service on metaphilosophy_task_tracks;
create policy metaphilosophy_task_tracks_write_admin_or_service on metaphilosophy_task_tracks
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists metaphilosophy_research_backlog_items_read_auditors on metaphilosophy_research_backlog_items;
create policy metaphilosophy_research_backlog_items_read_auditors on metaphilosophy_research_backlog_items
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists metaphilosophy_research_backlog_items_write_admin_or_service on metaphilosophy_research_backlog_items;
create policy metaphilosophy_research_backlog_items_write_admin_or_service on metaphilosophy_research_backlog_items
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists corpus_manifests_read_auditors on corpus_manifests;
create policy corpus_manifests_read_auditors on corpus_manifests
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists corpus_manifests_write_admin_or_service on corpus_manifests;
create policy corpus_manifests_write_admin_or_service on corpus_manifests
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists training_exports_read_auditors on training_exports;
create policy training_exports_read_auditors on training_exports
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists training_exports_write_admin_or_service on training_exports;
create policy training_exports_write_admin_or_service on training_exports
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists export_manifests_read_auditors on export_manifests;
create policy export_manifests_read_auditors on export_manifests
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists export_manifests_write_admin_or_service on export_manifests;
create policy export_manifests_write_admin_or_service on export_manifests
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists model_improvement_policies_read_auditors on model_improvement_policies;
create policy model_improvement_policies_read_auditors on model_improvement_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists model_improvement_policies_write_admin_or_service on model_improvement_policies;
create policy model_improvement_policies_write_admin_or_service on model_improvement_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists model_improvement_runs_read_auditors on model_improvement_runs;
create policy model_improvement_runs_read_auditors on model_improvement_runs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists model_improvement_runs_write_admin_or_service on model_improvement_runs;
create policy model_improvement_runs_write_admin_or_service on model_improvement_runs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists evaluation_runs_read_auditors on evaluation_runs;
create policy evaluation_runs_read_auditors on evaluation_runs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists evaluation_runs_write_admin_or_service on evaluation_runs;
create policy evaluation_runs_write_admin_or_service on evaluation_runs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists model_evaluation_predictions_read_auditors on model_evaluation_predictions;
create policy model_evaluation_predictions_read_auditors on model_evaluation_predictions
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists model_evaluation_predictions_write_admin_or_service on model_evaluation_predictions;
create policy model_evaluation_predictions_write_admin_or_service on model_evaluation_predictions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists calibration_runs_read_auditors on calibration_runs;
create policy calibration_runs_read_auditors on calibration_runs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists calibration_runs_write_admin_or_service on calibration_runs;
create policy calibration_runs_write_admin_or_service on calibration_runs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists leaderboards_read_auditors on leaderboards;
create policy leaderboards_read_auditors on leaderboards
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists leaderboards_write_admin_or_service on leaderboards;
create policy leaderboards_write_admin_or_service on leaderboards
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists model_failure_audits_read_auditors on model_failure_audits;
create policy model_failure_audits_read_auditors on model_failure_audits
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists model_failure_audits_write_admin_or_service on model_failure_audits;
create policy model_failure_audits_write_admin_or_service on model_failure_audits
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists artifact_probe_runs_read_auditors on artifact_probe_runs;
create policy artifact_probe_runs_read_auditors on artifact_probe_runs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists artifact_probe_runs_write_admin_or_service on artifact_probe_runs;
create policy artifact_probe_runs_write_admin_or_service on artifact_probe_runs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists sycophancy_probe_runs_read_auditors on sycophancy_probe_runs;
create policy sycophancy_probe_runs_read_auditors on sycophancy_probe_runs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists sycophancy_probe_runs_write_admin_or_service on sycophancy_probe_runs;
create policy sycophancy_probe_runs_write_admin_or_service on sycophancy_probe_runs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists obfuscation_stress_runs_read_auditors on obfuscation_stress_runs;
create policy obfuscation_stress_runs_read_auditors on obfuscation_stress_runs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists obfuscation_stress_runs_write_admin_or_service on obfuscation_stress_runs;
create policy obfuscation_stress_runs_write_admin_or_service on obfuscation_stress_runs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists sanity_baseline_runs_read_auditors on sanity_baseline_runs;
create policy sanity_baseline_runs_read_auditors on sanity_baseline_runs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists sanity_baseline_runs_write_admin_or_service on sanity_baseline_runs;
create policy sanity_baseline_runs_write_admin_or_service on sanity_baseline_runs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists model_run_reproducibility_policies_read_auditors on model_run_reproducibility_policies;
create policy model_run_reproducibility_policies_read_auditors on model_run_reproducibility_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists model_run_reproducibility_policies_write_admin_or_service on model_run_reproducibility_policies;
create policy model_run_reproducibility_policies_write_admin_or_service on model_run_reproducibility_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists model_inference_configs_read_auditors on model_inference_configs;
create policy model_inference_configs_read_auditors on model_inference_configs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists model_inference_configs_write_admin_or_service on model_inference_configs;
create policy model_inference_configs_write_admin_or_service on model_inference_configs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists model_run_environments_read_auditors on model_run_environments;
create policy model_run_environments_read_auditors on model_run_environments
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists model_run_environments_write_admin_or_service on model_run_environments;
create policy model_run_environments_write_admin_or_service on model_run_environments
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists model_provider_data_handling_policies_read_auditors on model_provider_data_handling_policies;
create policy model_provider_data_handling_policies_read_auditors on model_provider_data_handling_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists model_provider_data_handling_policies_write_admin_or_service on model_provider_data_handling_policies;
create policy model_provider_data_handling_policies_write_admin_or_service on model_provider_data_handling_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists prompt_templates_read_auditors on prompt_templates;
create policy prompt_templates_read_auditors on prompt_templates
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists prompt_templates_write_admin_or_service on prompt_templates;
create policy prompt_templates_write_admin_or_service on prompt_templates
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists parser_configs_read_auditors on parser_configs;
create policy parser_configs_read_auditors on parser_configs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists parser_configs_write_admin_or_service on parser_configs;
create policy parser_configs_write_admin_or_service on parser_configs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists certification_threshold_policies_read_auditors on certification_threshold_policies;
create policy certification_threshold_policies_read_auditors on certification_threshold_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists certification_threshold_policies_write_admin_or_service on certification_threshold_policies;
create policy certification_threshold_policies_write_admin_or_service on certification_threshold_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists certification_records_read_auditors on certification_records;
create policy certification_records_read_auditors on certification_records
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists certification_records_write_admin_or_service on certification_records;
create policy certification_records_write_admin_or_service on certification_records
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists gold_items_read_auditors on gold_items;
create policy gold_items_read_auditors on gold_items
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists gold_items_write_admin_or_service on gold_items;
create policy gold_items_write_admin_or_service on gold_items
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists benchmark_split_members_read_auditors on benchmark_split_members;
create policy benchmark_split_members_read_auditors on benchmark_split_members
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists benchmark_split_members_write_admin_or_service on benchmark_split_members;
create policy benchmark_split_members_write_admin_or_service on benchmark_split_members
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists benchmark_freeze_reports_read_auditors on benchmark_freeze_reports;
create policy benchmark_freeze_reports_read_auditors on benchmark_freeze_reports
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists benchmark_freeze_reports_write_admin_or_service on benchmark_freeze_reports;
create policy benchmark_freeze_reports_write_admin_or_service on benchmark_freeze_reports
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rights_clearance_policies_read_auditors on rights_clearance_policies;
create policy rights_clearance_policies_read_auditors on rights_clearance_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists rights_clearance_policies_write_admin_or_service on rights_clearance_policies;
create policy rights_clearance_policies_write_admin_or_service on rights_clearance_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rights_records_read_auditors on rights_records;
create policy rights_records_read_auditors on rights_records
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists rights_records_write_admin_or_service on rights_records;
create policy rights_records_write_admin_or_service on rights_records
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists benchmark_refresh_policies_read_auditors on benchmark_refresh_policies;
create policy benchmark_refresh_policies_read_auditors on benchmark_refresh_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists benchmark_refresh_policies_write_admin_or_service on benchmark_refresh_policies;
create policy benchmark_refresh_policies_write_admin_or_service on benchmark_refresh_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists validation_tranche_evidence_read_auditors on validation_tranche_evidence;
create policy validation_tranche_evidence_read_auditors on validation_tranche_evidence
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists validation_tranche_evidence_write_admin_or_service on validation_tranche_evidence;
create policy validation_tranche_evidence_write_admin_or_service on validation_tranche_evidence
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists human_ceiling_runs_read_auditors on human_ceiling_runs;
create policy human_ceiling_runs_read_auditors on human_ceiling_runs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists human_ceiling_runs_write_admin_or_service on human_ceiling_runs;
create policy human_ceiling_runs_write_admin_or_service on human_ceiling_runs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists comparability_tier_policies_read_auditors on comparability_tier_policies;
create policy comparability_tier_policies_read_auditors on comparability_tier_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists comparability_tier_policies_write_admin_or_service on comparability_tier_policies;
create policy comparability_tier_policies_write_admin_or_service on comparability_tier_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists comparability_claims_read_auditors on comparability_claims;
create policy comparability_claims_read_auditors on comparability_claims
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists comparability_claims_write_admin_or_service on comparability_claims;
create policy comparability_claims_write_admin_or_service on comparability_claims
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists release_erratum_disclosure_policies_read_auditors on release_erratum_disclosure_policies;
create policy release_erratum_disclosure_policies_read_auditors on release_erratum_disclosure_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists release_erratum_disclosure_policies_write_admin_or_service on release_erratum_disclosure_policies;
create policy release_erratum_disclosure_policies_write_admin_or_service on release_erratum_disclosure_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists release_errata_read_auditors on release_errata;
create policy release_errata_read_auditors on release_errata
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists release_errata_write_admin_or_service on release_errata;
create policy release_errata_write_admin_or_service on release_errata
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists benchmark_submission_policies_read_auditors on benchmark_submission_policies;
create policy benchmark_submission_policies_read_auditors on benchmark_submission_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists benchmark_submission_policies_write_admin_or_service on benchmark_submission_policies;
create policy benchmark_submission_policies_write_admin_or_service on benchmark_submission_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists benchmark_submissions_read_auditors on benchmark_submissions;
create policy benchmark_submissions_read_auditors on benchmark_submissions
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists benchmark_submissions_write_admin_or_service on benchmark_submissions;
create policy benchmark_submissions_write_admin_or_service on benchmark_submissions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists discussions_read_experts_and_auditors on discussions;
create policy discussions_read_experts_and_auditors on discussions
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists discussions_write_expert_admin_or_service on discussions;
create policy discussions_write_expert_admin_or_service on discussions
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists discussion_threads_read_experts_and_auditors on discussion_threads;
create policy discussion_threads_read_experts_and_auditors on discussion_threads
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists discussion_threads_write_expert_admin_or_service on discussion_threads;
create policy discussion_threads_write_expert_admin_or_service on discussion_threads
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists discussion_comments_read_experts_and_auditors on discussion_comments;
create policy discussion_comments_read_experts_and_auditors on discussion_comments
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists discussion_comments_write_expert_admin_or_service on discussion_comments;
create policy discussion_comments_write_expert_admin_or_service on discussion_comments
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists discussion_revision_proposals_read_experts_and_auditors on discussion_revision_proposals;
create policy discussion_revision_proposals_read_experts_and_auditors on discussion_revision_proposals
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists discussion_revision_proposals_write_expert_admin_or_service on discussion_revision_proposals;
create policy discussion_revision_proposals_write_expert_admin_or_service on discussion_revision_proposals
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists post_lock_discussion_sessions_read_experts_and_auditors on post_lock_discussion_sessions;
create policy post_lock_discussion_sessions_read_experts_and_auditors on post_lock_discussion_sessions
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists post_lock_discussion_sessions_write_expert_admin_or_service on post_lock_discussion_sessions;
create policy post_lock_discussion_sessions_write_expert_admin_or_service on post_lock_discussion_sessions
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists adjudications_read_experts_and_auditors on adjudications;
create policy adjudications_read_experts_and_auditors on adjudications
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists adjudications_write_expert_admin_or_service on adjudications;
create policy adjudications_write_expert_admin_or_service on adjudications
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists adjudication_review_sessions_read_experts_and_auditors on adjudication_review_sessions;
create policy adjudication_review_sessions_read_experts_and_auditors on adjudication_review_sessions
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists adjudication_review_sessions_write_expert_admin_or_service on adjudication_review_sessions;
create policy adjudication_review_sessions_write_expert_admin_or_service on adjudication_review_sessions
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists adjudication_memos_read_experts_and_auditors on adjudication_memos;
create policy adjudication_memos_read_experts_and_auditors on adjudication_memos
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists adjudication_memos_write_expert_admin_or_service on adjudication_memos;
create policy adjudication_memos_write_expert_admin_or_service on adjudication_memos
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists adjudication_finalizations_read_experts_and_auditors on adjudication_finalizations;
create policy adjudication_finalizations_read_experts_and_auditors on adjudication_finalizations
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists adjudication_finalizations_write_expert_admin_or_service on adjudication_finalizations;
create policy adjudication_finalizations_write_expert_admin_or_service on adjudication_finalizations
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists verification_records_read_experts_and_auditors on verification_records;
create policy verification_records_read_experts_and_auditors on verification_records
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists verification_records_write_expert_admin_or_service on verification_records;
create policy verification_records_write_expert_admin_or_service on verification_records
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists verification_evidence_artifacts_read_experts_and_auditors on verification_evidence_artifacts;
create policy verification_evidence_artifacts_read_experts_and_auditors on verification_evidence_artifacts
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists verification_evidence_artifacts_write_expert_admin_or_service on verification_evidence_artifacts;
create policy verification_evidence_artifacts_write_expert_admin_or_service on verification_evidence_artifacts
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists adjudicator_pre_read_requiredness_policies_read_auditors on adjudicator_pre_read_requiredness_policies;
create policy adjudicator_pre_read_requiredness_policies_read_auditors on adjudicator_pre_read_requiredness_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists adjudicator_pre_read_requiredness_policies_write_admin_or_service on adjudicator_pre_read_requiredness_policies;
create policy adjudicator_pre_read_requiredness_policies_write_admin_or_service on adjudicator_pre_read_requiredness_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists adjudicator_pre_reads_read_experts_and_auditors on adjudicator_pre_reads;
create policy adjudicator_pre_reads_read_experts_and_auditors on adjudicator_pre_reads
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists adjudicator_pre_reads_write_expert_admin_or_service on adjudicator_pre_reads;
create policy adjudicator_pre_reads_write_expert_admin_or_service on adjudicator_pre_reads
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists adjudication_cockpit_signoff_policies_read_auditors on adjudication_cockpit_signoff_policies;
create policy adjudication_cockpit_signoff_policies_read_auditors on adjudication_cockpit_signoff_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists adjudication_cockpit_signoff_policies_write_admin_or_service on adjudication_cockpit_signoff_policies;
create policy adjudication_cockpit_signoff_policies_write_admin_or_service on adjudication_cockpit_signoff_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists interpretation_target_map_requiredness_policies_read_auditors on interpretation_target_map_requiredness_policies;
create policy interpretation_target_map_requiredness_policies_read_auditors on interpretation_target_map_requiredness_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists interpretation_target_map_requiredness_policies_write_admin_or_service on interpretation_target_map_requiredness_policies;
create policy interpretation_target_map_requiredness_policies_write_admin_or_service on interpretation_target_map_requiredness_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists interpretation_target_maps_read_experts_and_auditors on interpretation_target_maps;
create policy interpretation_target_maps_read_experts_and_auditors on interpretation_target_maps
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists interpretation_target_maps_write_expert_admin_or_service on interpretation_target_maps;
create policy interpretation_target_maps_write_expert_admin_or_service on interpretation_target_maps
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists verification_claim_granularity_policies_read_auditors on verification_claim_granularity_policies;
create policy verification_claim_granularity_policies_read_auditors on verification_claim_granularity_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists verification_claim_granularity_policies_write_admin_or_service on verification_claim_granularity_policies;
create policy verification_claim_granularity_policies_write_admin_or_service on verification_claim_granularity_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists verification_workspace_sessions_read_experts_and_auditors on verification_workspace_sessions;
create policy verification_workspace_sessions_read_experts_and_auditors on verification_workspace_sessions
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists verification_workspace_sessions_write_expert_admin_or_service on verification_workspace_sessions;
create policy verification_workspace_sessions_write_expert_admin_or_service on verification_workspace_sessions
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists calibration_feedback_events_read_experts_and_auditors on calibration_feedback_events;
create policy calibration_feedback_events_read_experts_and_auditors on calibration_feedback_events
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists calibration_feedback_events_write_expert_admin_or_service on calibration_feedback_events;
create policy calibration_feedback_events_write_expert_admin_or_service on calibration_feedback_events
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists source_recognition_events_read_experts_and_auditors on source_recognition_events;
create policy source_recognition_events_read_experts_and_auditors on source_recognition_events
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists source_recognition_events_write_expert_admin_or_service on source_recognition_events;
create policy source_recognition_events_write_expert_admin_or_service on source_recognition_events
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists external_assistance_contamination_policies_read_auditors on external_assistance_contamination_policies;
create policy external_assistance_contamination_policies_read_auditors on external_assistance_contamination_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists external_assistance_contamination_policies_write_admin_or_service on external_assistance_contamination_policies;
create policy external_assistance_contamination_policies_write_admin_or_service on external_assistance_contamination_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists external_assistance_declarations_read_experts_and_auditors on external_assistance_declarations;
create policy external_assistance_declarations_read_experts_and_auditors on external_assistance_declarations
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists external_assistance_declarations_write_expert_admin_or_service on external_assistance_declarations;
create policy external_assistance_declarations_write_expert_admin_or_service on external_assistance_declarations
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists spot_check_sampling_policies_read_auditors on spot_check_sampling_policies;
create policy spot_check_sampling_policies_read_auditors on spot_check_sampling_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists spot_check_sampling_policies_write_admin_or_service on spot_check_sampling_policies;
create policy spot_check_sampling_policies_write_admin_or_service on spot_check_sampling_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists spot_check_qa_items_read_experts_and_auditors on spot_check_qa_items;
create policy spot_check_qa_items_read_experts_and_auditors on spot_check_qa_items
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists spot_check_qa_items_write_expert_admin_or_service on spot_check_qa_items;
create policy spot_check_qa_items_write_expert_admin_or_service on spot_check_qa_items
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists adjudication_triage_queue_items_read_experts_and_auditors on adjudication_triage_queue_items;
create policy adjudication_triage_queue_items_read_experts_and_auditors on adjudication_triage_queue_items
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists adjudication_triage_queue_items_write_expert_admin_or_service on adjudication_triage_queue_items;
create policy adjudication_triage_queue_items_write_expert_admin_or_service on adjudication_triage_queue_items
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists diagnostic_deferral_visibility_policies_read_auditors on diagnostic_deferral_visibility_policies;
create policy diagnostic_deferral_visibility_policies_read_auditors on diagnostic_deferral_visibility_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists diagnostic_deferral_visibility_policies_write_admin_or_service on diagnostic_deferral_visibility_policies;
create policy diagnostic_deferral_visibility_policies_write_admin_or_service on diagnostic_deferral_visibility_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists diagnostic_deferral_records_read_experts_and_auditors on diagnostic_deferral_records;
create policy diagnostic_deferral_records_read_experts_and_auditors on diagnostic_deferral_records
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists diagnostic_deferral_records_write_expert_admin_or_service on diagnostic_deferral_records;
create policy diagnostic_deferral_records_write_expert_admin_or_service on diagnostic_deferral_records
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists ratings_read_auditors on ratings;
create policy ratings_read_auditors on ratings
  for select
  using (app_auth.has_role('admin', 'auditor', 'service'));

drop policy if exists ratings_write_admin_or_service on ratings;
create policy ratings_write_admin_or_service on ratings
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rating_score_values_read_auditors on rating_score_values;
create policy rating_score_values_read_auditors on rating_score_values
  for select
  using (app_auth.has_role('admin', 'auditor', 'service'));

drop policy if exists rating_score_values_write_admin_or_service on rating_score_values;
create policy rating_score_values_write_admin_or_service on rating_score_values
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rater_instruction_compatibility_policies_read_auditors on rater_instruction_compatibility_policies;
create policy rater_instruction_compatibility_policies_read_auditors on rater_instruction_compatibility_policies
  for select
  using (app_auth.has_role('admin', 'auditor', 'service'));

drop policy if exists rater_instruction_compatibility_policies_write_admin_or_service on rater_instruction_compatibility_policies;
create policy rater_instruction_compatibility_policies_write_admin_or_service on rater_instruction_compatibility_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rater_instruction_render_versions_read_auditors on rater_instruction_render_versions;
create policy rater_instruction_render_versions_read_auditors on rater_instruction_render_versions
  for select
  using (app_auth.has_role('admin', 'auditor', 'service'));

drop policy if exists rater_instruction_render_versions_write_admin_or_service on rater_instruction_render_versions;
create policy rater_instruction_render_versions_write_admin_or_service on rater_instruction_render_versions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rubric_copy_traceability_maps_read_auditors on rubric_copy_traceability_maps;
create policy rubric_copy_traceability_maps_read_auditors on rubric_copy_traceability_maps
  for select
  using (app_auth.has_role('admin', 'auditor', 'service'));

drop policy if exists rubric_copy_traceability_maps_write_admin_or_service on rubric_copy_traceability_maps;
create policy rubric_copy_traceability_maps_write_admin_or_service on rubric_copy_traceability_maps
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rater_instruction_comprehension_audits_read_auditors on rater_instruction_comprehension_audits;
create policy rater_instruction_comprehension_audits_read_auditors on rater_instruction_comprehension_audits
  for select
  using (app_auth.has_role('admin', 'auditor', 'service'));

drop policy if exists rater_instruction_comprehension_audits_write_admin_or_service on rater_instruction_comprehension_audits;
create policy rater_instruction_comprehension_audits_write_admin_or_service on rater_instruction_comprehension_audits
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists session_pacing_policies_read_auditors on session_pacing_policies;
create policy session_pacing_policies_read_auditors on session_pacing_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists session_pacing_policies_write_admin_or_service on session_pacing_policies;
create policy session_pacing_policies_write_admin_or_service on session_pacing_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rater_sessions_read_auditors on rater_sessions;
create policy rater_sessions_read_auditors on rater_sessions
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists rater_sessions_write_admin_or_service on rater_sessions;
create policy rater_sessions_write_admin_or_service on rater_sessions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists public_example_practice_sessions_read_auditors on public_example_practice_sessions;
create policy public_example_practice_sessions_read_auditors on public_example_practice_sessions
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists public_example_practice_sessions_write_admin_or_service on public_example_practice_sessions;
create policy public_example_practice_sessions_write_admin_or_service on public_example_practice_sessions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists practice_sandbox_policies_read_auditors on practice_sandbox_policies;
create policy practice_sandbox_policies_read_auditors on practice_sandbox_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists practice_sandbox_policies_write_admin_or_service on practice_sandbox_policies;
create policy practice_sandbox_policies_write_admin_or_service on practice_sandbox_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rater_dashboard_policies_read_auditors on rater_dashboard_policies;
create policy rater_dashboard_policies_read_auditors on rater_dashboard_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists rater_dashboard_policies_write_admin_or_service on rater_dashboard_policies;
create policy rater_dashboard_policies_write_admin_or_service on rater_dashboard_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists rater_learning_plans_read_auditors on rater_learning_plans;
create policy rater_learning_plans_read_auditors on rater_learning_plans
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists rater_learning_plans_write_admin_or_service on rater_learning_plans;
create policy rater_learning_plans_write_admin_or_service on rater_learning_plans
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists source_anchor_examples_read_auditors on source_anchor_examples;
create policy source_anchor_examples_read_auditors on source_anchor_examples
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists source_anchor_examples_write_admin_or_service on source_anchor_examples;
create policy source_anchor_examples_write_admin_or_service on source_anchor_examples
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists ux_simplification_policies_read_auditors on ux_simplification_policies;
create policy ux_simplification_policies_read_auditors on ux_simplification_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists ux_simplification_policies_write_admin_or_service on ux_simplification_policies;
create policy ux_simplification_policies_write_admin_or_service on ux_simplification_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists ux_simplification_reviews_read_auditors on ux_simplification_reviews;
create policy ux_simplification_reviews_read_auditors on ux_simplification_reviews
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists ux_simplification_reviews_write_admin_or_service on ux_simplification_reviews;
create policy ux_simplification_reviews_write_admin_or_service on ux_simplification_reviews
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists item_issue_quarantine_policies_read_auditors on item_issue_quarantine_policies;
create policy item_issue_quarantine_policies_read_auditors on item_issue_quarantine_policies
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists item_issue_quarantine_policies_write_admin_or_service on item_issue_quarantine_policies;
create policy item_issue_quarantine_policies_write_admin_or_service on item_issue_quarantine_policies
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists item_issue_reports_read_experts_and_auditors on item_issue_reports;
create policy item_issue_reports_read_experts_and_auditors on item_issue_reports
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists item_issue_reports_write_expert_admin_or_service on item_issue_reports;
create policy item_issue_reports_write_expert_admin_or_service on item_issue_reports
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists item_issue_actions_read_experts_and_auditors on item_issue_actions;
create policy item_issue_actions_read_experts_and_auditors on item_issue_actions
  for select
  using (app_auth.has_role('expert', 'admin', 'auditor'));

drop policy if exists item_issue_actions_write_expert_admin_or_service on item_issue_actions;
create policy item_issue_actions_write_expert_admin_or_service on item_issue_actions
  for all
  using (app_auth.has_role('expert', 'admin', 'service'))
  with check (app_auth.has_role('expert', 'admin', 'service'));

drop policy if exists screen_feature_parity_checks_read_auditors on screen_feature_parity_checks;
create policy screen_feature_parity_checks_read_auditors on screen_feature_parity_checks
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists screen_feature_parity_checks_write_admin_or_service on screen_feature_parity_checks;
create policy screen_feature_parity_checks_write_admin_or_service on screen_feature_parity_checks
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists simplified_copy_previews_read_auditors on simplified_copy_previews;
create policy simplified_copy_previews_read_auditors on simplified_copy_previews
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists simplified_copy_previews_write_admin_or_service on simplified_copy_previews;
create policy simplified_copy_previews_write_admin_or_service on simplified_copy_previews
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists metric_configs_read_auditors on metric_configs;
create policy metric_configs_read_auditors on metric_configs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists metric_configs_write_admin_or_service on metric_configs;
create policy metric_configs_write_admin_or_service on metric_configs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists derived_utility_formulas_read_auditors on derived_utility_formulas;
create policy derived_utility_formulas_read_auditors on derived_utility_formulas
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists derived_utility_formulas_write_admin_or_service on derived_utility_formulas;
create policy derived_utility_formulas_write_admin_or_service on derived_utility_formulas
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists pairwise_comparison_snapshots_read_auditors on pairwise_comparison_snapshots;
create policy pairwise_comparison_snapshots_read_auditors on pairwise_comparison_snapshots
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists pairwise_comparison_snapshots_write_admin_or_service on pairwise_comparison_snapshots;
create policy pairwise_comparison_snapshots_write_admin_or_service on pairwise_comparison_snapshots
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists governance_approval_records_read_auditors on governance_approval_records;
create policy governance_approval_records_read_auditors on governance_approval_records
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists governance_approval_records_write_admin_or_service on governance_approval_records;
create policy governance_approval_records_write_admin_or_service on governance_approval_records
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists protected_artifact_revalidations_read_auditors on protected_artifact_revalidations;
create policy protected_artifact_revalidations_read_auditors on protected_artifact_revalidations
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists protected_artifact_revalidations_write_admin_or_service on protected_artifact_revalidations;
create policy protected_artifact_revalidations_write_admin_or_service on protected_artifact_revalidations
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists workflow_state_transition_logs_read_auditors on workflow_state_transition_logs;
create policy workflow_state_transition_logs_read_auditors on workflow_state_transition_logs
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists workflow_state_transition_logs_write_admin_or_service on workflow_state_transition_logs;
create policy workflow_state_transition_logs_write_admin_or_service on workflow_state_transition_logs
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists source_cards_read_auditors on source_cards;
create policy source_cards_read_auditors on source_cards
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists source_cards_write_admin on source_cards;
drop policy if exists source_cards_write_admin_or_service on source_cards;
create policy source_cards_write_admin_or_service on source_cards
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists source_spans_read_auditors on source_spans;
create policy source_spans_read_auditors on source_spans
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists source_spans_write_admin on source_spans;
drop policy if exists source_spans_write_admin_or_service on source_spans;
create policy source_spans_write_admin_or_service on source_spans
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists extraction_batches_read_auditors on extraction_batches;
create policy extraction_batches_read_auditors on extraction_batches
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists extraction_batches_write_admin on extraction_batches;
drop policy if exists extraction_batches_write_admin_or_service on extraction_batches;
create policy extraction_batches_write_admin_or_service on extraction_batches
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists argument_extractions_read_auditors on argument_extractions;
create policy argument_extractions_read_auditors on argument_extractions
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists argument_extractions_write_admin on argument_extractions;
drop policy if exists argument_extractions_write_admin_or_service on argument_extractions;
create policy argument_extractions_write_admin_or_service on argument_extractions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists argument_extraction_source_spans_read_auditors on argument_extraction_source_spans;
create policy argument_extraction_source_spans_read_auditors on argument_extraction_source_spans
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists argument_extraction_source_spans_write_admin on argument_extraction_source_spans;
drop policy if exists argument_extraction_source_spans_write_admin_or_service on argument_extraction_source_spans;
create policy argument_extraction_source_spans_write_admin_or_service on argument_extraction_source_spans
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists prepared_drafts_read_auditors on prepared_drafts;
create policy prepared_drafts_read_auditors on prepared_drafts
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists prepared_drafts_write_admin_or_service on prepared_drafts;
create policy prepared_drafts_write_admin_or_service on prepared_drafts
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists review_signals_read_auditors on review_signals;
create policy review_signals_read_auditors on review_signals
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists review_signals_write_admin_or_service on review_signals;
create policy review_signals_write_admin_or_service on review_signals
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists gate_decisions_read_auditors on gate_decisions;
create policy gate_decisions_read_auditors on gate_decisions
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists gate_decisions_write_admin_or_service on gate_decisions;
create policy gate_decisions_write_admin_or_service on gate_decisions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists candidate_items_read_auditors on candidate_items;
create policy candidate_items_read_auditors on candidate_items
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists candidate_items_write_admin_or_service on candidate_items;
create policy candidate_items_write_admin_or_service on candidate_items
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists promotion_records_read_auditors on promotion_records;
create policy promotion_records_read_auditors on promotion_records
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists promotion_records_write_admin_or_service on promotion_records;
create policy promotion_records_write_admin_or_service on promotion_records
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists policy_action_kinds_read_auditors on policy_action_kinds;
create policy policy_action_kinds_read_auditors on policy_action_kinds
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists policy_action_kinds_write_admin_or_service on policy_action_kinds;
create policy policy_action_kinds_write_admin_or_service on policy_action_kinds
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists policy_decisions_read_auditors on policy_decisions;
create policy policy_decisions_read_auditors on policy_decisions
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists policy_decisions_write_admin_or_service on policy_decisions;
create policy policy_decisions_write_admin_or_service on policy_decisions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists policy_decision_consumptions_read_auditors on policy_decision_consumptions;
create policy policy_decision_consumptions_read_auditors on policy_decision_consumptions
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists policy_decision_consumptions_write_admin_or_service on policy_decision_consumptions;
create policy policy_decision_consumptions_write_admin_or_service on policy_decision_consumptions
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists implementation_phase_gate_bundles_read_auditors on implementation_phase_gate_bundles;
create policy implementation_phase_gate_bundles_read_auditors on implementation_phase_gate_bundles
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists implementation_phase_gate_bundles_write_admin_or_service on implementation_phase_gate_bundles;
create policy implementation_phase_gate_bundles_write_admin_or_service on implementation_phase_gate_bundles
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));

drop policy if exists implementation_phase_gate_lanes_read_auditors on implementation_phase_gate_lanes;
create policy implementation_phase_gate_lanes_read_auditors on implementation_phase_gate_lanes
  for select
  using (app_auth.has_role('admin', 'auditor'));

drop policy if exists implementation_phase_gate_lanes_write_admin_or_service on implementation_phase_gate_lanes;
create policy implementation_phase_gate_lanes_write_admin_or_service on implementation_phase_gate_lanes
  for all
  using (app_auth.has_role('admin', 'service'))
  with check (app_auth.has_role('admin', 'service'));
