import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const REQUIRED_RATING_DIMENSIONS = Object.freeze([
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "overall",
]);

export const REQUIRED_AUXILIARY_FIELDS = Object.freeze([
  "overall_rationale",
  "confidence",
  "time_spent_seconds",
  "insufficient_context",
  "verification_status",
  "item_integrity_flags",
]);

export const LMCA_LOW_CLARITY_WEIGHTS = Object.freeze({
  overall_absolute_difference: 0.5,
  clarity_absolute_difference: 0.5,
});

export const LMCA_ORDINARY_WEIGHTS = Object.freeze({
  overall_absolute_difference: 0.5,
  strength_times_centrality_absolute_difference: 0.2,
  clarity_absolute_difference: 0.1,
  correctness_absolute_difference: 0.1,
  dead_weight_absolute_difference: 0.05,
  single_issue_absolute_difference: 0.05,
});

const AUTHORIZATION_FIELDS = Object.freeze([
  "authorizes_q_006a",
  "authorizes_recipient_research",
  "authorizes_outreach",
  "authorizes_item_screening",
  "authorizes_calibration_or_rating",
  "authorizes_payment",
  "authorizes_funding_submission",
  "authorizes_phase_2",
]);

export function validatePilotRatingAnalysisContract(value) {
  const errors = [];
  const sourceBasis = objectOrEmpty(value?.source_basis);
  const sourceRules = objectOrEmpty(sourceBasis.source_derived_rules);
  const lowClarity = objectOrEmpty(sourceRules.low_clarity_custom_loss_branch);
  const ordinary = objectOrEmpty(sourceRules.ordinary_custom_loss_branch);
  const ratingContract = objectOrEmpty(value?.rating_record_contract);
  const structure = objectOrEmpty(ratingContract.production_structure_proposal);
  const outputs = objectOrEmpty(value?.analysis_outputs);
  const thresholds = objectOrEmpty(value?.threshold_governance);
  const privacy = objectOrEmpty(value?.privacy_and_exposure);
  const authorization = objectOrEmpty(value?.authorization_boundary);

  if (value?.contract_id !== "pilot-rating-analysis-contract-v1-2026-07-30") {
    errors.push("contract_id must identify the 2026-07-30 pilot rating-analysis contract.");
  }
  if (value?.contract_version !== 1) errors.push("contract_version must equal 1.");
  if (value?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the active 48-critique pilot.");
  }
  if (value?.status !== "implementation_template_non_binding_no_rating_data") {
    errors.push("status must preserve the non-binding, no-rating-data implementation boundary.");
  }

  if (sourceBasis.primary_reference !== "A dataset of rated conceptual arguments") {
    errors.push("source_basis.primary_reference must identify the supplied LMCA paper.");
  }
  if (!sameOrderedStrings(sourceRules.dimensions, REQUIRED_RATING_DIMENSIONS)) {
    errors.push("source-derived dimensions must preserve the seven-dimension rubric order.");
  }
  if (sourceRules.score_interval?.minimum !== 0 || sourceRules.score_interval?.maximum !== 1) {
    errors.push("The source-derived score interval must remain [0, 1].");
  }
  if (sourceRules.substantive_impact_quantity !== "strength_times_centrality") {
    errors.push("The substantive-impact quantity must remain strength_times_centrality.");
  }
  if (lowClarity.reference_clarity_below !== 0.5) {
    errors.push("The source-derived low-clarity branch must use reference clarity below 0.5.");
  }
  validateExactWeights(lowClarity.weights, LMCA_LOW_CLARITY_WEIGHTS, "low-clarity", errors);
  validateExactWeights(ordinary.weights, LMCA_ORDINARY_WEIGHTS, "ordinary", errors);
  const pairwiseDescription = String(sourceRules.weighted_pairwise_ranking_error ?? "").toLowerCase();
  for (const required of ["within each position", "half the reference score gap", "full reference score gap", "average within position"]) {
    if (!pairwiseDescription.includes(required)) errors.push(`Weighted pairwise description must include: ${required}.`);
  }
  if (sourceRules.original_rating_preservation_required !== true) {
    errors.push("Original-rating preservation must be required.");
  }

  if (ratingContract.record_model !== "append_only_versioned") {
    errors.push("rating_record_contract.record_model must be append_only_versioned.");
  }
  if (ratingContract.rubric_version !== "rubric-v2-seven-dimensional") {
    errors.push("rating_record_contract.rubric_version must identify Rubric v2.");
  }
  if (!sameOrderedStrings(ratingContract.required_score_dimensions, REQUIRED_RATING_DIMENSIONS)) {
    errors.push("rating_record_contract must require all seven dimensions in order.");
  }
  if (!sameStringSet(ratingContract.required_auxiliary_fields, REQUIRED_AUXILIARY_FIELDS)) {
    errors.push("rating_record_contract must require all auxiliary fields.");
  }
  if (!sameStringSet(ratingContract.stages, ["initial", "rerating"])) {
    errors.push("rating stages must contain only initial and rerating.");
  }
  if (ratingContract.initial_rating_version !== 1) errors.push("Initial ratings must use version 1.");
  if (
    ratingContract.rerating_requires_predecessor !== true ||
    ratingContract.rerating_requires_object_level_reason !== true ||
    ratingContract.overwrite_or_delete_prior_rating_prohibited !== true
  ) {
    errors.push("Re-ratings must be append-only, predecessor-linked, and justified by an object-level reason.");
  }

  const expectedStructure = {
    positions: 12,
    critiques_per_position: 4,
    initial_raters_per_critique: 2,
    accepted_initial_ratings: 96,
    core_raters: 6,
    accepted_initial_ratings_per_core_rater: 16,
  };
  for (const [field, expected] of Object.entries(expectedStructure)) {
    if (structure[field] !== expected) errors.push(`production_structure_proposal.${field} must equal ${expected}.`);
  }
  if (!String(structure.status ?? "").includes("pending_q_006a")) {
    errors.push("The production structure must remain pending Q-006A and final readiness approval.");
  }

  for (const output of ["lmca_custom_weighted_loss", "lmca_weighted_pairwise_ranking_error"]) {
    if (!normalizeStrings(outputs.source_derived).includes(output)) errors.push(`Missing source-derived output: ${output}.`);
  }
  for (const output of [
    "symmetric_weighted_within_position_ordering_agreement",
    "mean_absolute_initial_rater_difference_by_dimension",
    "interval_krippendorff_alpha_specialized_to_two_ratings_per_critique",
    "position_level_results",
    "leave_one_position_out_ranges",
  ]) {
    if (!normalizeStrings(outputs.pilot_diagnostics).includes(output)) errors.push(`Missing pilot diagnostic output: ${output}.`);
  }
  for (const claim of ["causal_source_effect", "public_individual_rater_ranking", "automatic_phase_2_readiness"]) {
    if (!normalizeStrings(outputs.not_implemented_as_a_claim).includes(claim)) errors.push(`Missing prohibited claim boundary: ${claim}.`);
  }

  for (const field of [
    "numeric_adjudication_thresholds_binding",
    "numeric_scale_readiness_thresholds_binding",
    "calibration_pass_threshold_binding",
  ]) {
    if (thresholds[field] !== false) errors.push(`threshold_governance.${field} must be false.`);
  }
  for (const field of [
    "runtime_policy_must_explicitly_name_approved_routes",
    "no_adjudication_route_is_operative_by_default",
    "diagnostic_threshold_results_do_not_authorize_outreach_or_phase_2",
    "later_threshold_changes_must_be_versioned_and_non_retroactive",
  ]) {
    if (thresholds[field] !== true) errors.push(`threshold_governance.${field} must be true.`);
  }

  for (const field of [
    "contract_contains_rating_records",
    "contract_contains_protected_item_ids_or_text",
    "contract_contains_participant_names_or_email_addresses",
    "contract_contains_identity_payment_or_tax_data",
  ]) {
    if (privacy[field] !== false) errors.push(`privacy_and_exposure.${field} must be false.`);
  }
  if (privacy.controlled_pseudonymous_rater_ids_required !== true) {
    errors.push("Controlled pseudonymous rater IDs must be required.");
  }
  if (privacy.protected_data_storage !== "private_controlled_record_only") {
    errors.push("Protected data storage must remain private_controlled_record_only.");
  }

  for (const field of AUTHORIZATION_FIELDS) {
    if (authorization[field] !== false) errors.push(`authorization_boundary.${field} must remain false.`);
  }

  const serialized = JSON.stringify(value);
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(serialized)) {
    errors.push("The public contract must not contain an email address.");
  }
  for (const forbidden of ["ratings", "position_ids", "critique_ids", "participant_names", "protected_item_text"]) {
    if (Object.hasOwn(value, forbidden)) errors.push(`The public contract must not contain top-level ${forbidden}.`);
  }

  return {
    status: errors.length ? "fail" : "pass",
    contract_id: value?.contract_id ?? null,
    programme_id: value?.programme_id ?? null,
    numeric_thresholds_binding: false,
    contains_rating_data: privacy.contract_contains_rating_records ?? null,
    errors,
  };
}

export async function readAndValidatePilotRatingAnalysisContract(path) {
  return validatePilotRatingAnalysisContract(JSON.parse(await readFile(path, "utf8")));
}

function validateExactWeights(observedValue, expectedValue, label, errors) {
  const observed = objectOrEmpty(observedValue);
  if (stableJson(observed) !== stableJson(expectedValue)) {
    errors.push(`${label} custom-loss weights must match the source-derived policy exactly.`);
    return;
  }
  const total = Object.values(observed).reduce((sum, value) => sum + Number(value), 0);
  if (Math.abs(total - 1) > 1e-12) errors.push(`${label} custom-loss weights must sum to 1.`);
}

function stableJson(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))));
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeStrings(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean) : [];
}

function sameStringSet(left, right) {
  const leftValues = normalizeStrings(left);
  const rightValues = normalizeStrings(right);
  return leftValues.length === rightValues.length && rightValues.every((entry) => leftValues.includes(entry));
}

function sameOrderedStrings(left, right) {
  const leftValues = normalizeStrings(left);
  const rightValues = normalizeStrings(right);
  return leftValues.length === rightValues.length && leftValues.every((entry, index) => entry === rightValues[index]);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const path = resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/pilot-rating-analysis-contract.json`);
  const report = await readAndValidatePilotRatingAnalysisContract(path);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
