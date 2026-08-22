export const ROLES = Object.freeze(["rater", "cause_coder"]);

export const STAGES = Object.freeze([
  "orientation",
  "calibration",
  "position_conclusion",
  "critique_interpretation",
  "initial_scoring",
  "blind_self_check",
  "initial_cause_code",
  "reconciliation_rehearsal",
  "administration",
]);

export const PRICE_STATUSES = Object.freeze([
  "usable_amount_evidence",
  "declines_fixed_honorarium_model",
  "needs_scope_revision",
]);

export const CONTROLLED_AUTH = Object.freeze([
  "human_timing_collection_approved",
  "price_acceptance_collection_approved",
  "participant_information_approved",
  "consent_materials_approved",
  "private_storage_confirmed",
  "task_packet_frozen",
  "owner_authorization_recorded",
]);

export const ALWAYS_FALSE = Object.freeze([
  "research_ratings_authorized",
  "research_start_authorized",
  "payment_authorized",
  "grant_submission_authorized",
  "deployment_authorized",
  "production_or_staging_mutation_authorized",
]);

export const PERSON_READY = Object.freeze([
  "qualification_documented_privately",
  "participant_information_received",
  "consent_recorded",
  "conflict_and_prior_exposure_check_complete",
  "calibration_complete",
  "scope_and_price_question_understood",
  "post_task_price_record_complete",
]);

export const EXPECTED = Object.freeze({
  rater: Object.freeze({
    orientation: 2,
    calibration: 2,
    position_conclusion: 4,
    critique_interpretation: 16,
    initial_scoring: 16,
    blind_self_check: 4,
    administration: 2,
  }),
  cause_coder: Object.freeze({
    orientation: 2,
    calibration: 2,
    initial_cause_code: 16,
    reconciliation_rehearsal: 4,
    administration: 2,
  }),
});

export const FORBIDDEN_PUBLIC_KEYS = new Set([
  "evidence_person_id",
  "people",
  "work_units",
  "price_records",
  "started_at",
  "completed_at",
  "recorded_at",
  "minimum_acceptable_fixed_honorarium_usd",
  "preferred_fixed_honorarium_usd",
  "maximum_acceptable_workload_hours",
  "jurisdiction",
  "payment_details",
  "qualification_document",
  "position_text",
  "critique_text",
  "item_text",
  "rationale",
  "notes",
]);
