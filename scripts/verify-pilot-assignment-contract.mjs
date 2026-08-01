import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import {
  ANONYMOUS_RATER_SLOTS,
  generatePilotAssignments,
  sanitizePilotAssignmentReport,
  validatePilotAssignmentInput,
} from "./pilot-assignment-generator.mjs";

export function validatePilotAssignmentContract(contract, methodology, fixture) {
  const errors = [];
  const source = objectOrEmpty(contract?.source_boundary);
  const inputs = objectOrEmpty(contract?.canonical_inputs);
  const invariants = objectOrEmpty(contract?.balanced_invariants);
  const constraints = objectOrEmpty(contract?.constraint_policy);
  const algorithm = objectOrEmpty(contract?.deterministic_algorithm);
  const authorization = objectOrEmpty(contract?.authorization);
  const simulation = objectOrEmpty(authorization.simulation);
  const controlled = objectOrEmpty(authorization.controlled_generation);
  const privacy = objectOrEmpty(contract?.privacy);
  const governance = objectOrEmpty(contract?.governance);

  if (contract?.contract_id !== "metaphilosophy-pilot-assignment-v1-2026-08-01") {
    errors.push("contract_id must identify the 2026-08-01 pilot assignment contract.");
  }
  if (contract?.contract_version !== 1) errors.push("contract_version must equal 1.");
  if (contract?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the active 48-critique pilot.");
  }
  if (contract?.status !== "implementation_template_non_binding_q006b_q006c_pending") {
    errors.push("status must preserve the non-binding Q-006B/Q-006C boundary.");
  }

  if (source.primary_reference !== "A dataset of rated conceptual arguments") {
    errors.push("source_boundary must identify A dataset of rated conceptual arguments.");
  }
  if (source.reference_role !== "methodological_prior_art_and_external_benchmark") {
    errors.push("The LMCA reference must remain prior art and an external benchmark.");
  }
  if (source.metaphilosophy_specific_extension !== true || source.direct_row_reuse !== false) {
    errors.push("Assignment generation must remain a Metaphilosophy-specific extension with no LMCA row reuse.");
  }
  const observations = normalizeStrings(source.reference_observations).join(" ").toLowerCase();
  for (const required of ["primary rater", "source", "writing style", "original ratings"]) {
    if (!observations.includes(required)) errors.push(`source_boundary.reference_observations must include ${required}.`);
  }

  if (!String(inputs.methodology_path ?? "").endsWith("pilot-methodology-recommendations.json")) {
    errors.push("canonical_inputs.methodology_path must reference pilot-methodology-recommendations.json.");
  }
  if (!sameStringSet(inputs.anonymous_rater_slots, ANONYMOUS_RATER_SLOTS)) {
    errors.push("canonical_inputs.anonymous_rater_slots must contain R1 through R6 exactly.");
  }
  if (inputs.participant_records_required !== 6 || inputs.position_records_required !== 12 || inputs.critiques_per_position !== 4) {
    errors.push("canonical input counts must preserve six participants, twelve positions, and four critiques per position.");
  }
  const requiredFields = normalizeStrings(inputs.participant_required_fields).join(" ").toLowerCase();
  for (const required of ["qualification", "consent", "availability", "calibration", "topic", "conflict", "exposure"]) {
    if (!requiredFields.includes(required)) errors.push(`participant_required_fields must include ${required}.`);
  }

  for (const [field, expected] of Object.entries({
    positions: 12,
    critiques: 48,
    initial_raters_per_position: 2,
    core_raters: 6,
    positions_per_core_rater: 4,
    critiques_per_core_rater: 16,
    unique_rater_pairs: 12,
    distinct_partners_per_core_rater: 4,
    distinct_topic_families_per_core_rater: 4,
  })) {
    if (invariants[field] !== expected) errors.push(`balanced_invariants.${field} must equal ${expected}.`);
  }
  const sourceLoad = objectOrEmpty(invariants.preferred_source_positions_per_core_rater);
  for (const sourceClass of ["public_synthetic_with_new_expert_ratings", "protected_public_domain_derived"]) {
    if (sourceLoad[sourceClass] !== 2) errors.push(`preferred source load for ${sourceClass} must equal 2.`);
  }

  if (constraints.no_relaxation_fallback !== true) errors.push("constraint_policy.no_relaxation_fallback must equal true.");
  const constraintText = [constraints.topic_competence, constraints.conflicts, constraints.prior_exposure, constraints.infeasible_result, constraints.graph_change_boundary]
    .join(" ")
    .toLowerCase();
  for (const required of ["approved topic", "conflict", "prior-exposure", "stop with no assignment", "q-006b"]) {
    if (!constraintText.includes(required)) errors.push(`constraint policy must include ${required}.`);
  }

  if (algorithm.input_order_independent !== true) errors.push("deterministic_algorithm.input_order_independent must equal true.");
  const algorithmText = [algorithm.participant_order, algorithm.candidate_mappings, algorithm.feasibility_filter, algorithm.selection, algorithm.seed_publication]
    .join(" ")
    .toLowerCase();
  for (const required of ["sort", "6!", "competence", "conflict", "exposure", "hash", "raw controlled seed"]) {
    if (!algorithmText.includes(required)) errors.push(`deterministic algorithm must include ${required}.`);
  }
  const commitments = normalizeStrings(algorithm.commitments).join(" ").toLowerCase();
  for (const required of ["methodology", "seed", "input", "mapping"]) {
    if (!commitments.includes(required)) errors.push(`deterministic commitments must include ${required}.`);
  }

  if (simulation.allowed !== true || simulation.data_class_required !== "synthetic_test_fixture") {
    errors.push("Simulation must be allowed only for synthetic_test_fixture data.");
  }
  if (simulation.approval_flags_must_remain_false !== true || simulation.rating_work_authorized !== false) {
    errors.push("Simulation must keep approval flags and rating-work authorization false.");
  }
  if (controlled.currently_authorized !== false || controlled.data_class_required !== "private_controlled_assignment_input") {
    errors.push("Controlled generation must remain unauthorized and require private controlled input.");
  }
  if (controlled.minimum_versioned_approval_records !== 3 || controlled.approval_timestamp_required !== true) {
    errors.push("Controlled generation must require three versioned approval records and a timestamp.");
  }
  if (controlled.full_output_must_be_outside_repository !== true || controlled.full_output_file_mode !== "0600") {
    errors.push("Controlled output must remain outside the repository with file mode 0600.");
  }
  if (controlled.rating_work_authorized_by_assignment !== false) {
    errors.push("Assignment generation must not authorize rating work.");
  }

  if (privacy.full_assignment_classification !== "private_controlled_record_only") {
    errors.push("The full assignment must be classified private_controlled_record_only.");
  }
  const publicExclusions = normalizeStrings(privacy.public_summary_must_exclude).join(" ").toLowerCase();
  for (const required of ["participant", "position", "critique", "anonymous-slot", "rater pairs", "conflict", "exposure", "feasible-mapping count"]) {
    if (!publicExclusions.includes(required)) errors.push(`privacy.public_summary_must_exclude must include ${required}.`);
  }

  for (const field of [
    "binding_effect",
    "q_006a_approved",
    "q_006b_approved",
    "q_006c_approved",
    "assignment_generation_authorized",
    "rating_work_authorized",
    "public_recruitment_authorized",
    "outreach_authorized",
    "protected_items_frozen",
    "payment_commitment_authorized",
    "funding_submission_authorized",
    "phase_2_authorized",
  ]) {
    if (governance[field] !== false) errors.push(`governance.${field} must remain false.`);
  }

  const inputReport = validatePilotAssignmentInput(methodology, fixture);
  if (inputReport.status !== "pass") errors.push(...inputReport.errors.map((error) => `synthetic fixture: ${error}`));
  let generated = null;
  let publicSummary = null;
  if (inputReport.status === "pass") {
    try {
      generated = generatePilotAssignments(methodology, fixture);
      publicSummary = sanitizePilotAssignmentReport(generated);
    } catch (error) {
      errors.push(`synthetic fixture generation failed: ${error.message}`);
    }
  }
  if (generated) {
    if (generated.invariants.positions !== 12 || generated.invariants.critiques !== 48 || generated.invariants.unique_rater_pairs !== 12) {
      errors.push("Synthetic assignment output must preserve 12 positions, 48 critiques, and 12 unique pairs.");
    }
    if (generated.rating_work_authorized !== false || generated.phase_2_authorized !== false) {
      errors.push("Synthetic assignment output cannot authorize rating work or Phase 2.");
    }
  }
  if (publicSummary) {
    const serialized = JSON.stringify(publicSummary);
    for (const token of ["\"participant_id\":", "\"position_id\":", "\"critique_id\":", "\"anonymous_slot_mapping\":", "\"position_assignments\":"]) {
      if (serialized.includes(token)) errors.push(`Public synthetic summary contains forbidden token ${token}.`);
    }
  }

  return {
    status: errors.length ? "fail" : "pass",
    contract_id: contract?.contract_id ?? null,
    synthetic_feasible_mapping_count: generated?.feasible_mapping_count ?? null,
    synthetic_selected_mapping_hash: generated?.selected_mapping_hash ?? null,
    controlled_generation_authorized: controlled.currently_authorized ?? null,
    rating_work_authorized: governance.rating_work_authorized ?? null,
    phase_2_authorized: governance.phase_2_authorized ?? null,
    errors,
  };
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeStrings(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean) : [];
}

function sameStringSet(left, right) {
  const leftSet = new Set(normalizeStrings(left));
  const rightSet = new Set(normalizeStrings(right));
  return leftSet.size === rightSet.size && [...leftSet].every((entry) => rightSet.has(entry));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const contractPath = resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/pilot-assignment-contract.json`);
  const methodologyPath = resolve(process.argv[3] ?? `${root}/ops/next-steps-2026-07-23/pilot-methodology-recommendations.json`);
  const fixturePath = resolve(process.argv[4] ?? `${root}/test/fixtures/pilot-assignment-synthetic.json`);
  const [contract, methodology, fixture] = await Promise.all(
    [contractPath, methodologyPath, fixturePath].map(async (path) => JSON.parse(await readFile(path, "utf8"))),
  );
  const report = validatePilotAssignmentContract(contract, methodology, fixture);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
