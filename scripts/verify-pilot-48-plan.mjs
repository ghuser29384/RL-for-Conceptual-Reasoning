import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PILOT_SCOPE = Object.freeze({
  positions: 12,
  critiques_per_position: 4,
  critiques: 48,
  independent_initial_ratings_per_critique: 2,
  initial_ratings: 96,
  core_raters: 6,
  dedicated_adjudicators: 2,
  nominal_positions_per_core_rater: 4,
  nominal_initial_ratings_per_core_rater: 16,
  duration_days: 28,
});

export const REQUIRED_RATING_DIMENSIONS = Object.freeze([
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "overall",
]);

export const REQUIRED_TOPIC_FAMILIES = Object.freeze([
  "normative_ethics",
  "political_philosophy",
  "epistemology_and_philosophy_of_science",
  "philosophy_of_mind_and_ai_consciousness",
  "decision_theory_and_social_choice",
  "metaphilosophy_and_ai_governance",
]);

export const ELIGIBLE_SOURCE_CLASSES = Object.freeze([
  "public_synthetic_with_new_expert_ratings",
  "protected_public_domain_derived",
]);

export function validatePilot48Plan(value) {
  const errors = [];
  const governance = objectOrEmpty(value?.governance);
  const scope = objectOrEmpty(value?.scope);
  const topicMatrix = objectOrEmpty(value?.topic_matrix);
  const sourcePolicy = objectOrEmpty(value?.source_policy);
  const candidateSelection = objectOrEmpty(value?.candidate_selection);
  const ratingProtocol = objectOrEmpty(value?.rating_protocol);
  const assignmentDesign = objectOrEmpty(value?.assignment_design);
  const adjudication = objectOrEmpty(value?.adjudication_protocol);
  const adviserProtocol = objectOrEmpty(value?.methodological_adviser_protocol);
  const analysisPlan = objectOrEmpty(value?.analysis_plan);
  const expansionGate = objectOrEmpty(value?.expansion_gate);
  const fullTarget = objectOrEmpty(expansionGate.full_target);

  if (value?.pilot_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("pilot_id must identify the 2026-07-30 48-critique pilot.");
  }
  if (value?.pilot_version !== 2) errors.push("pilot_version must equal 2.");
  if (
    value?.decision_status !==
    "approved_core_scope_recommended_methodology_exact_items_participants_payment_advisers_and_numeric_thresholds_pending"
  ) {
    errors.push("decision_status must preserve the approved-core versus pending-methodology boundary.");
  }

  const ownerApproved = normalizeStrings(governance.owner_approved_core).join(" ").toLowerCase();
  for (const required of ["48-critique pilot", "early-career", "bounded methodological", "long-term future fund", "400-critique"]) {
    if (!ownerApproved.includes(required)) errors.push(`governance.owner_approved_core must include ${required}.`);
  }
  if (!String(governance.decision_rule ?? "").includes("0.90")) {
    errors.push("governance.decision_rule must enforce the 0.90 decision threshold.");
  }

  for (const [field, expected] of Object.entries(PILOT_SCOPE)) {
    if (scope[field] !== expected) errors.push(`scope.${field} must equal ${expected}; found ${String(scope[field])}.`);
  }
  if (scope.critiques !== scope.positions * scope.critiques_per_position) {
    errors.push("scope.critiques must equal positions multiplied by critiques_per_position.");
  }
  if (scope.initial_ratings !== scope.critiques * scope.independent_initial_ratings_per_critique) {
    errors.push("scope.initial_ratings must cover every critique twice.");
  }
  if (scope.nominal_positions_per_core_rater * scope.core_raters !== scope.positions * 2) {
    errors.push("scope.nominal_positions_per_core_rater must allocate both position assignments across six raters.");
  }
  if (scope.nominal_initial_ratings_per_core_rater * scope.core_raters !== scope.initial_ratings) {
    errors.push("scope.nominal_initial_ratings_per_core_rater must allocate all 96 initial ratings.");
  }
  if (!String(scope.structure_status ?? "").includes("pending")) {
    errors.push("scope.structure_status must preserve final readiness approval as pending.");
  }

  const families = Array.isArray(topicMatrix.families) ? topicMatrix.families : [];
  if (!String(topicMatrix.status ?? "").includes("review_required")) {
    errors.push("topic_matrix.status must require owner and methodological-adviser review.");
  }
  if (families.length !== REQUIRED_TOPIC_FAMILIES.length) {
    errors.push(`topic_matrix.families must contain ${REQUIRED_TOPIC_FAMILIES.length} entries.`);
  }
  const observedFamilies = families.map((row) => String(row?.topic_family ?? ""));
  for (const family of REQUIRED_TOPIC_FAMILIES) {
    if (!observedFamilies.includes(family)) errors.push(`topic_matrix is missing ${family}.`);
  }
  if (new Set(observedFamilies).size !== observedFamilies.length) errors.push("topic_matrix topic families must be unique.");
  const topicPositions = families.reduce((total, row) => total + integerOrZero(row?.positions), 0);
  const topicCritiques = families.reduce((total, row) => total + integerOrZero(row?.critiques), 0);
  if (topicPositions !== PILOT_SCOPE.positions) errors.push("topic_matrix positions must sum to 12.");
  if (topicCritiques !== PILOT_SCOPE.critiques) errors.push("topic_matrix critiques must sum to 48.");

  const eligibleSources = normalizeStrings(sourcePolicy.eligible_source_classes);
  if (!sameStringSet(eligibleSources, ELIGIBLE_SOURCE_CLASSES)) {
    errors.push("source_policy.eligible_source_classes must contain only the two approved pilot source classes.");
  }
  if (eligibleSources.some((sourceClass) => sourceClass.includes("lmca"))) {
    errors.push("LMCA rows cannot be an eligible pilot source before the canonical data and license are approved.");
  }
  if (!String(sourcePolicy.status ?? "").includes("exact_mix") || !String(sourcePolicy.status ?? "").includes("pending")) {
    errors.push("source_policy.status must preserve exact source-mix approval as pending.");
  }
  const sourceMinimums = objectOrEmpty(sourcePolicy.recommended_minimum_positions_by_source_class);
  const recommendedMinimumTotal = ELIGIBLE_SOURCE_CLASSES.reduce(
    (total, sourceClass) => total + integerOrZero(sourceMinimums[sourceClass]),
    0,
  );
  if (recommendedMinimumTotal + integerOrZero(sourcePolicy.recommended_flexible_positions) !== PILOT_SCOPE.positions) {
    errors.push("Recommended source minimums plus flexible positions must sum to 12.");
  }

  if (!String(candidateSelection.status ?? "").includes("pending")) {
    errors.push("candidate_selection.status must remain pending controlled-manifest approval.");
  }
  if (integerOrZero(candidateSelection.selected_critiques_per_position) !== PILOT_SCOPE.critiques_per_position) {
    errors.push("candidate_selection.selected_critiques_per_position must equal 4.");
  }
  if (integerOrZero(candidateSelection.recommended_minimum_candidate_critiques_per_position) < 4) {
    errors.push("The recommended candidate pool cannot be smaller than the four selected critiques.");
  }
  const hiddenFields = normalizeStrings(candidateSelection.hidden_from_raters).join(" ").toLowerCase();
  for (const required of ["source", "model identity", "model-judge", "other raters", "adjudication status"]) {
    if (!hiddenFields.includes(required)) errors.push(`candidate_selection.hidden_from_raters must include ${required}.`);
  }

  if (ratingProtocol.rubric_version !== "rubric-v2-seven-dimensional") {
    errors.push("rating_protocol.rubric_version must equal rubric-v2-seven-dimensional.");
  }
  if (!sameOrderedStrings(ratingProtocol.dimensions, REQUIRED_RATING_DIMENSIONS)) {
    errors.push("rating_protocol.dimensions must preserve the seven-dimensional rubric order.");
  }
  if (ratingProtocol.score_minimum !== 0 || ratingProtocol.score_maximum !== 1) {
    errors.push("rating protocol scores must remain on the zero-to-one interval.");
  }
  if (!String(ratingProtocol.analysis_rule ?? "").toLowerCase().includes("strength multiplied by centrality")) {
    errors.push("rating_protocol.analysis_rule must use strength multiplied by centrality.");
  }
  if (!String(ratingProtocol.revision_policy ?? "").toLowerCase().includes("preserve every original rating")) {
    errors.push("rating_protocol.revision_policy must preserve original ratings.");
  }

  if (assignmentDesign.split_unit !== "position") errors.push("assignment_design.split_unit must equal position.");
  if (assignmentDesign.sibling_critiques_cross_rater_split !== false) {
    errors.push("Sibling critiques cannot cross the assigned rater pair.");
  }
  if (assignmentDesign.initial_raters_per_position !== 2) errors.push("Each position must have exactly two initial raters.");
  if (assignmentDesign.positions_per_core_rater !== 4 || assignmentDesign.critiques_per_core_rater !== 16) {
    errors.push("Recommended assignments must allocate four positions and sixteen critiques per core rater.");
  }
  if (!String(assignmentDesign.status ?? "").includes("pending")) {
    errors.push("assignment_design.status must preserve final readiness approval as pending.");
  }

  if (!String(adjudication.numeric_threshold_status ?? "").includes("provisional_candidates_not_binding")) {
    errors.push("Numerical adjudication thresholds must be explicitly provisional and non-binding.");
  }
  if (Object.hasOwn(adjudication, "trigger_rules")) {
    errors.push("Binding adjudication trigger_rules must not exist before Q-006 is resolved.");
  }
  const numericTriggers = Array.isArray(adjudication.provisional_numeric_trigger_candidates)
    ? adjudication.provisional_numeric_trigger_candidates
    : [];
  if (numericTriggers.length < 4) errors.push("At least four provisional numerical trigger candidates must be documented.");
  for (const trigger of numericTriggers) {
    const threshold = Number(trigger?.absolute_difference_at_least);
    if (!(threshold > 0 && threshold <= 1)) errors.push("Provisional numerical trigger thresholds must lie in (0, 1].");
  }
  const nonNumericTriggers = normalizeStrings(
    (Array.isArray(adjudication.required_non_numeric_triggers) ? adjudication.required_non_numeric_triggers : []).map(
      (row) => `${row?.field ?? ""} ${row?.condition ?? ""}`,
    ),
  ).join(" ").toLowerCase();
  for (const required of ["insufficient_context", "item_integrity"]) {
    if (!nonNumericTriggers.includes(required)) errors.push(`Required non-numeric adjudication trigger missing: ${required}.`);
  }

  if (!String(adviserProtocol.status ?? "").includes("pending_owner_approval")) {
    errors.push("The exact methodological-adviser outreach envelope must remain pending owner approval.");
  }
  const prohibitedAsks = normalizeStrings(adviserProtocol.prohibited_asks).join(" ").toLowerCase();
  if (!prohibitedAsks.includes("rate the 48 critiques")) errors.push("Senior advisers must not be asked to rate the 48 critiques.");

  const completionRequirements = normalizeStrings(analysisPlan.binding_completion_requirements).join(" ").toLowerCase();
  for (const required of ["96", "adjudication", "sign-off", "audit trails"]) {
    if (!completionRequirements.includes(required)) errors.push(`analysis_plan binding completion requirements must include ${required}.`);
  }
  if (!String(analysisPlan.numeric_scale_readiness_status ?? "").includes("provisional_candidates_not_binding")) {
    errors.push("Numerical scale-readiness thresholds must be explicitly provisional and non-binding.");
  }
  if (!Array.isArray(analysisPlan.provisional_numeric_scale_readiness_candidates) || analysisPlan.provisional_numeric_scale_readiness_candidates.length < 4) {
    errors.push("At least four provisional numerical scale-readiness candidates must be documented.");
  }
  const thresholdGovernance = String(analysisPlan.threshold_governance ?? "").toLowerCase();
  for (const required of ["before the first protected rating", "methodological-adviser", "explicit project-owner approval", "not be applied retroactively"]) {
    if (!thresholdGovernance.includes(required)) errors.push(`analysis_plan.threshold_governance must include ${required}.`);
  }

  if (fullTarget.positions !== 100 || fullTarget.critiques !== 400 || fullTarget.initial_ratings !== 800) {
    errors.push("expansion_gate.full_target must preserve the deferred 100/400/800 target.");
  }
  if (expansionGate.status !== "blocked_before_pilot_results_and_capacity") {
    errors.push("The 400-critique expansion must remain blocked before pilot results and capacity.");
  }
  if (expansionGate.no_automatic_rollover !== true) errors.push("Expansion must have no automatic rollover.");
  const expansionRequirements = normalizeStrings(expansionGate.required_before_activation).join(" ").toLowerCase();
  for (const required of ["pilot", "methodological", "external funding", "volunteer", "project owner"]) {
    if (!expansionRequirements.includes(required)) errors.push(`Expansion requirements must include ${required}.`);
  }

  const unresolved = normalizeStrings(value?.unresolved_parameters).join(" ").toLowerCase();
  for (const required of ["structure", "topic", "position ids", "numerical", "core-rater", "payment", "adviser", "model-baseline", "external-funding"]) {
    if (!unresolved.includes(required)) errors.push(`unresolved_parameters must include ${required}.`);
  }
  if (value?.next_decision?.id !== "Q-006" || value?.next_decision?.status !== "user_decision_required") {
    errors.push("next_decision must remain Q-006 with user_decision_required status.");
  }

  return {
    status: errors.length ? "fail" : "pass",
    pilot_id: value?.pilot_id ?? null,
    scope: Object.fromEntries(Object.keys(PILOT_SCOPE).map((field) => [field, scope[field] ?? null])),
    numeric_thresholds_binding: false,
    phase_2_status: expansionGate.status ?? null,
    errors,
  };
}

export async function readAndValidatePilot48Plan(path) {
  return validatePilot48Plan(JSON.parse(await readFile(path, "utf8")));
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function integerOrZero(value) {
  return Number.isInteger(value) ? value : 0;
}

function normalizeStrings(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean) : [];
}

function sameStringSet(left, right) {
  const normalizedLeft = [...normalizeStrings(left)].sort();
  const normalizedRight = [...normalizeStrings(right)].sort();
  return sameOrderedStrings(normalizedLeft, normalizedRight);
}

function sameOrderedStrings(left, right) {
  const normalizedLeft = normalizeStrings(left);
  const normalizedRight = normalizeStrings(right);
  return normalizedLeft.length === normalizedRight.length && normalizedLeft.every((entry, index) => entry === normalizedRight[index]);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const path = resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/pilot-48-plan.json`);
  const report = await readAndValidatePilot48Plan(path);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
