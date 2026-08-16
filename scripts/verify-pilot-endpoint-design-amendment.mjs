import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const PILOT_ENDPOINT_CONTRACT_PATH = "ops/pilot-endpoint-design-amendment-v1.json";
export const PILOT_ENDPOINT_DOCUMENT_PATH = "docs/pilot-endpoint-design-amendment-v1.md";

const REQUIRED_PRIMARY_ENDPOINTS = Object.freeze([
  "P1_blind_initial_disagreement_profile",
  "P2_interpretation_linkage",
  "P3_operational_feasibility_and_burden",
]);

const REQUIRED_DOCUMENT_MARKERS = Object.freeze([
  "Owner decision D1 = B",
  "24 blind self-check records",
  "Owner decision D2 = A",
  "Two dedicated adjudicators will independently code **all 48 paired interpretation fingerprints**.",
  "Position is the primary aggregation and sensitivity unit.",
  "There is no scientific numerical pass/fail threshold",
  "does not authorize participant access",
]);

const REQUIRED_AUTHORIZATION_KEYS = Object.freeze([
  "changes_current_pilot_workflow",
  "changes_public_copy",
  "approves_q_006b",
  "freezes_protected_items",
  "freezes_operational_thresholds",
  "authorizes_participant_access",
  "authorizes_recruitment",
  "authorizes_research_start",
  "authorizes_payment",
  "authorizes_merge",
  "authorizes_deployment",
]);

export function validatePilotEndpointDesign({ contract, document }) {
  const errors = [];
  const normalized = contract && typeof contract === "object" ? contract : {};
  const normalizedDocument = String(document ?? "");

  if (normalized.contract_id !== "mp-pilot-endpoint-design-amendment-v1") {
    errors.push("The pilot endpoint contract id must remain mp-pilot-endpoint-design-amendment-v1.");
  }
  if (normalized.status !== "approved_for_implementation_design_only") {
    errors.push("The pilot endpoint contract must remain approved for implementation design only.");
  }
  if (normalized.approved_at !== "2026-08-16") {
    errors.push("The pilot endpoint approval date must remain 2026-08-16.");
  }
  if (normalized.approved_by !== "Ellen Sun") {
    errors.push("The pilot endpoint contract must preserve Ellen Sun as approving owner.");
  }
  if (normalized.strategy_contract_id !== "mp-research-positioning-v1") {
    errors.push("The pilot endpoint contract must remain subordinate to mp-research-positioning-v1.");
  }

  validateGeometry(normalized.study_geometry, errors);
  validatePrimaryEndpoints(normalized.primary_endpoints, errors);
  validateOwnerDecisions(normalized.owner_decisions, errors);
  validateInferenceBoundaries(normalized, errors);
  validateAuthorization(normalized.authorization, errors);

  if (!normalizedDocument.trim()) {
    errors.push("The approved human-readable pilot endpoint document is missing or empty.");
  }
  for (const marker of REQUIRED_DOCUMENT_MARKERS) {
    if (!normalizedDocument.includes(marker)) {
      errors.push(`The approved pilot endpoint document must preserve marker: ${marker}.`);
    }
  }

  return {
    status: errors.length ? "fail" : "pass",
    contract_id: normalized.contract_id ?? null,
    primary_endpoint_count: Array.isArray(normalized.primary_endpoints) ? normalized.primary_endpoints.length : 0,
    d1_selected_option: normalized.owner_decisions?.D1_blind_self_check_scope?.selected_option ?? null,
    d2_selected_option: normalized.owner_decisions?.D2_interpretation_cause_coding_coverage?.selected_option ?? null,
    authorization_keys: normalized.authorization && typeof normalized.authorization === "object"
      ? Object.keys(normalized.authorization).sort()
      : [],
    errors,
  };
}

function validateGeometry(geometry, errors) {
  if (!geometry || typeof geometry !== "object") {
    errors.push("The approved study geometry is missing.");
    return;
  }
  const expected = {
    positions: 12,
    critiques_per_position: 4,
    paired_critique_units: 48,
    blind_initial_ratings_per_critique: 2,
    planned_blind_initial_ratings: 96,
    core_raters: 6,
    positions_per_rater: 4,
    ratings_per_rater: 16,
    unique_rater_pairs: 12,
    within_position_critique_comparisons: 72,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (geometry[key] !== value) errors.push(`Study geometry must preserve ${key}=${value}.`);
  }
  if (geometry.primary_aggregation_unit !== "position") {
    errors.push("Position must remain the primary aggregation unit.");
  }
  if (geometry.pair_specific_interaction_confounded_with_position !== true) {
    errors.push("The design must preserve the pair-by-position confounding limitation.");
  }
  if (geometry.critique_units_are_independent_top_level_observations !== false) {
    errors.push("Critique units must not be treated as independent top-level observations.");
  }
  if (geometry.pairwise_comparisons_are_independent_top_level_observations !== false) {
    errors.push("Within-position pairwise comparisons must not be treated as independent top-level observations.");
  }
}

function validatePrimaryEndpoints(endpoints, errors) {
  const normalized = Array.isArray(endpoints) ? endpoints : [];
  const ids = new Set(normalized.map((endpoint) => endpoint?.id));
  for (const id of REQUIRED_PRIMARY_ENDPOINTS) {
    if (!ids.has(id)) errors.push(`The approved primary endpoint set must preserve ${id}.`);
  }
  const p1 = normalized.find((endpoint) => endpoint?.id === "P1_blind_initial_disagreement_profile");
  if (p1?.single_scalar_success_rule !== false) {
    errors.push("The blind-initial disagreement profile must not acquire a single scalar success rule.");
  }
  const p2 = normalized.find((endpoint) => endpoint?.id === "P2_interpretation_linkage");
  if (p2?.requires_pre_peer_fingerprint !== true) {
    errors.push("Interpretation fingerprints must remain locked before peer exposure.");
  }
  if (p2?.coding_coverage !== "all_48_pairs_dual_independent_blind") {
    errors.push("Interpretation-cause coding must cover all 48 pairs with dual independent blind coding.");
  }
}

function validateOwnerDecisions(decisions, errors) {
  const d1 = decisions?.D1_blind_self_check_scope;
  if (!d1 || typeof d1 !== "object") {
    errors.push("Owner decision D1 is missing.");
  } else {
    if (d1.selected_option !== "B") errors.push("D1 must remain option B: balanced 24-rating blind self-check subsample.");
    if (d1.status !== "approved") errors.push("D1 must remain approved.");
    const expected = {
      self_check_records: 24,
      selected_positions: 6,
      topic_families_represented: 6,
      positions_per_topic_family: 1,
      approved_source_classes: 2,
      positions_per_source_class: 3,
      selected_critiques_per_position: 2,
      self_checks_per_core_rater: 4,
      selected_positions_per_core_rater: 2,
    };
    for (const [key, value] of Object.entries(expected)) {
      if (d1[key] !== value) errors.push(`D1 must preserve ${key}=${value}.`);
    }
    for (const key of [
      "both_original_raters_self_check_each_selected_critique",
      "selection_frozen_before_any_pilot_rating",
      "selection_independent_of_observed_human_scores",
      "selection_independent_of_human_disagreement",
      "selection_independent_of_post_rating_model_outputs",
      "exact_ids_and_seed_frozen_at_controlled_manifest_stage",
      "occurs_after_corresponding_initial_lock",
      "occurs_before_peer_model_aggregate_cause_code_discussion_or_adjudication_exposure",
      "initial_record_preserved",
      "separate_predecessor_linked_record",
      "object_level_reason_required_for_score_change",
    ]) {
      if (d1[key] !== true) errors.push(`D1 must preserve ${key}=true.`);
    }
    if (d1.stage !== "blind_self_check") errors.push("D1 records must use the blind_self_check stage.");
    if (d1.population_level_causal_checking_claim_authorized !== false) {
      errors.push("D1 must not authorize a population-level causal checking claim.");
    }
  }

  const d2 = decisions?.D2_interpretation_cause_coding_coverage;
  if (!d2 || typeof d2 !== "object") {
    errors.push("Owner decision D2 is missing.");
  } else {
    if (d2.selected_option !== "A") errors.push("D2 must remain option A: two adjudicators independently code all 48 pairs.");
    if (d2.status !== "approved") errors.push("D2 must remain approved.");
    if (d2.paired_fingerprints !== 48) errors.push("D2 must preserve all 48 paired fingerprints.");
    if (d2.independent_adjudicators_per_pair !== 2) errors.push("D2 must preserve two independent adjudicators per pair.");
    for (const key of [
      "all_pairs_dual_coded",
      "role_masked_rater_fingerprints",
      "numeric_scores_and_gaps_hidden_until_both_initial_codes_lock",
      "other_adjudicator_code_hidden_until_both_initial_codes_lock",
      "model_judgments_and_acquisition_strata_hidden",
      "aggregate_pilot_results_hidden",
      "adjudication_outcomes_hidden",
      "initial_codes_immutable",
      "later_reconciliation_may_not_overwrite_initial_codes",
      "report_all_48_denominator",
      "report_raw_dual_code_agreement_and_disagreement",
      "report_cause_counts_and_unresolved_cases",
      "workload_and_honorarium_reestimate_required_before_named_commitments",
    ]) {
      if (d2[key] !== true) errors.push(`D2 must preserve ${key}=true.`);
    }
    if (d2.changes_current_adjudication_reserve !== false) {
      errors.push("D2 approval must not silently change the current adjudication reserve.");
    }
    if (d2.authorizes_payment !== false) errors.push("D2 approval must not authorize payment.");
  }
}

function validateInferenceBoundaries(contract, errors) {
  if (contract.uncertainty_policy?.headline_population_confidence_interval !== false) {
    errors.push("The pilot must not acquire a population-valid headline confidence interval.");
  }
  if (contract.uncertainty_policy?.null_hypothesis_p_values_for_primary_endpoints !== false) {
    errors.push("Primary pilot endpoints must not acquire null-hypothesis p-values.");
  }
  if (contract.missing_data_policy?.imputation !== false) {
    errors.push("The pilot must not impute missing score or interpretation fields.");
  }
  if (contract.missing_data_policy?.self_check_or_revision_may_replace_missing_initial !== false) {
    errors.push("A self-check or revision must not replace a missing blind initial rating.");
  }
  if (contract.decision_rules?.scientific_numerical_pass_fail_threshold !== null) {
    errors.push("The pilot must not acquire a scientific numerical pass/fail threshold.");
  }
  if (contract.decision_rules?.automatic_phase_2_authorization !== false) {
    errors.push("The endpoint contract must not authorize Phase 2 automatically.");
  }
  if (contract.decision_rules?.automatic_public_benchmark_authorization !== false) {
    errors.push("The endpoint contract must not authorize a public benchmark automatically.");
  }
  if (contract.model_evaluation?.headline_or_primary !== false) {
    errors.push("Model evaluation cannot become a headline or primary pilot result.");
  }
  const secondary = Array.isArray(contract.secondary_endpoints) ? contract.secondary_endpoints : [];
  const sensitivity = secondary.find((endpoint) => endpoint?.id === "S4_composition_and_aggregation_sensitivity");
  if (sensitivity?.reliability_weighting !== false) {
    errors.push("The pilot must not estimate or apply reliability weights.");
  }
}

function validateAuthorization(authorization, errors) {
  if (!authorization || typeof authorization !== "object") {
    errors.push("The endpoint contract must contain an explicit authorization boundary.");
    return;
  }
  for (const key of REQUIRED_AUTHORIZATION_KEYS) {
    if (!(key in authorization)) errors.push(`Authorization boundary is missing ${key}.`);
    else if (authorization[key] !== false) errors.push(`Endpoint approval must not authorize ${key}.`);
  }
  for (const [key, value] of Object.entries(authorization)) {
    if (value !== false) errors.push(`Endpoint approval must remain fail-closed for ${key}.`);
  }
}

export async function readAndValidatePilotEndpointDesign(root = resolve(import.meta.dirname, "..")) {
  const [contractText, document] = await Promise.all([
    readFile(resolve(root, PILOT_ENDPOINT_CONTRACT_PATH), "utf8"),
    readFile(resolve(root, PILOT_ENDPOINT_DOCUMENT_PATH), "utf8"),
  ]);
  return validatePilotEndpointDesign({ contract: JSON.parse(contractText), document });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await readAndValidatePilotEndpointDesign();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
