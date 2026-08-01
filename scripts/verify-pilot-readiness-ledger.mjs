import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const EXPECTED_READINESS_GATES = Object.freeze(["R-01", "R-02", "R-03", "R-04", "R-05", "R-06"]);

export const Q006A_PREPARATION_AUTHORIZATION_FIELDS = Object.freeze([
  "methodological_consultation_packet_preparation_authorized",
  "methodological_adviser_recipient_research_authorized",
  "public_calibration_screening_authorized",
  "nonfinal_item_screening_authorized",
]);

export const EXECUTION_AUTHORIZATION_FIELDS = Object.freeze([
  "methodological_adviser_outreach_authorized",
  "public_recruitment_authorized",
  "participant_outreach_authorized",
  "protected_manifest_freeze_authorized",
  "participant_selection_authorized",
  "controlled_assignment_generation_authorized",
  "controlled_task_bundle_generation_authorized",
  "task_bundle_distribution_authorized",
  "calibration_or_rating_work_authorized",
  "quality_control_acceptance_authorized",
  "controlled_rating_ingestion_authorized",
  "adjudication_case_generation_authorized",
  "adjudication_case_distribution_authorized",
  "adjudication_work_authorized",
  "rerating_work_authorized",
  "adjudication_resolution_acceptance_authorized",
  "final_snapshot_generation_authorized",
  "final_snapshot_signoff_authorized",
  "adjudication_unit_ledger_freeze_authorized",
  "payment_commitment_authorized",
  "funding_submission_authorized",
  "phase_2_activation_authorized",
]);

const REQUIRED_BASELINE_FIELDS = Object.freeze([
  "provider",
  "model_identity",
  "exact_model_version",
  "prompt_version",
  "rubric_version",
  "reasoning_or_effort_setting",
  "temperature_and_sampling_parameters",
  "retry_policy",
  "output_parser_version",
  "invalid_output_rule",
  "request_date",
  "api_environment",
  "raw_response_retention_policy",
  "raw_response_hash_policy",
]);

const REQUIRED_ASSIGNMENT_PRIVATE_FIELDS = Object.freeze([
  "q006b_approval_record",
  "q006c_approval_record",
  "assignment_authorization_record",
  "controlled_manifest_sha256",
  "methodology_assignment_sha256",
  "approved_topic_family_records",
  "conflict_and_prior_exposure_records",
  "calibration_completion_records",
  "secret_assignment_seed",
  "assignment_seed_sha256",
  "selected_mapping_sha256",
  "controlled_assignment_output_path",
]);

const REQUIRED_TASK_BUNDLE_PRIVATE_FIELDS = Object.freeze([
  "q006b_approval_record",
  "q006c_approval_record",
  "task_bundle_generation_authorization_record",
  "controlled_assignment_output_hash",
  "protected_manifest_sha256",
  "rubric_sha256",
  "redacted_task_content_sha256",
  "secret_task_token_key",
  "task_token_key_sha256",
  "individual_bundle_sha256_records",
  "combined_bundle_commitment_sha256",
  "operator_index_output_path",
  "controlled_bundle_output_directory",
]);

const FORBIDDEN_PUBLIC_KEYS = new Set([
  "email",
  "email_address",
  "professional_email",
  "personal_email",
  "bank_account",
  "bank_account_number",
  "tax_id",
  "tax_identifier",
  "passport_number",
  "government_id",
  "participant_ids",
  "position_ids",
  "critique_ids",
  "item_text",
  "protected_item_text",
  "protected_critiques",
  "labels",
  "assignments",
  "position_assignments",
  "anonymous_slot_mapping",
  "rater_ids",
  "conflict_position_ids",
  "prior_exposure_position_ids",
  "secret_assignment_seed",
  "task_position_token",
  "task_critique_token",
  "task_token_secret",
  "secret_task_token_key",
  "participant_bundles",
  "operator_index",
  "position_mappings",
  "critique_mappings",
]);

export function validatePilotReadinessLedger(value) {
  const errors = [];
  const publicPolicy = objectOrEmpty(value?.public_record_policy);
  const authorization = objectOrEmpty(value?.authorization_state);
  const q006a = objectOrEmpty(authorization.q006a);
  const feedback = objectOrEmpty(value?.methodological_feedback_template);
  const itemScreening = objectOrEmpty(value?.item_screening_template);
  const itemSummary = objectOrEmpty(itemScreening.public_summary);
  const calibration = objectOrEmpty(value?.calibration_template);
  const baseline = objectOrEmpty(value?.model_baseline_template);
  const people = objectOrEmpty(value?.people_payment_template);
  const requiredCounts = objectOrEmpty(people.required_counts);
  const assignment = objectOrEmpty(value?.assignment_template);
  const taskBundle = objectOrEmpty(value?.task_bundle_template);
  const overall = objectOrEmpty(value?.overall_readiness);

  if (value?.ledger_id !== "metaphilosophy-pilot-readiness-v1-2026-07-30") {
    errors.push("ledger_id must identify the 2026-07-30 pilot readiness ledger.");
  }
  if (value?.ledger_version !== 1) errors.push("ledger_version must equal 1.");
  if (value?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the active 48-critique pilot.");
  }
  if (value?.status !== "blocked_pending_methodological_feedback_and_later_readiness_gates") {
    errors.push("The readiness ledger must remain blocked after Q-006A while methodological feedback and later gates are pending.");
  }

  for (const field of [
    "contains_personal_or_professional_email_addresses",
    "contains_identity_documents",
    "contains_payment_or_tax_data",
    "contains_protected_item_ids",
    "contains_protected_item_text",
    "contains_protected_critiques",
    "contains_labels_or_assignments",
  ]) {
    if (publicPolicy[field] !== false) errors.push(`public_record_policy.${field} must be false.`);
  }
  if (publicPolicy.private_controlled_records_required_for_sensitive_data !== true) {
    errors.push("Sensitive data must be restricted to private controlled records.");
  }

  if (q006a.status !== "approved_nonbinding_consultation_and_screening_only") {
    errors.push("Q-006A must be recorded as approved for non-binding consultation and screening only.");
  }
  if (!validIsoTimestamp(q006a.approved_at)) errors.push("Q-006A requires a valid approval timestamp.");
  if (q006a.approval_record_id !== "Q006A-APPROVAL-2026-08-01T113432Z") {
    errors.push("Q-006A approval_record_id must match the recorded owner approval.");
  }
  if (q006a.decision_id !== "D-027") errors.push("Q-006A must reference decision D-027.");
  if (q006a.owner_instruction !== "Do the next step.") {
    errors.push("Q-006A must preserve the project owner's exact approval instruction.");
  }
  if (!String(q006a.approval_record ?? "").endsWith("q-006a-owner-approval.md")) {
    errors.push("Q-006A must reference the owner-approval record.");
  }
  for (const field of Q006A_PREPARATION_AUTHORIZATION_FIELDS) {
    if (authorization[field] !== true) errors.push(`authorization_state.${field} must equal true after Q-006A approval.`);
  }
  for (const field of EXECUTION_AUTHORIZATION_FIELDS) {
    if (authorization[field] !== false) errors.push(`authorization_state.${field} must remain false after Q-006A approval.`);
  }

  if (feedback.status !== "preparation_authorized_no_contact_or_outreach") {
    errors.push("Methodological feedback preparation must be authorized while adviser contact and outreach remain unauthorized.");
  }
  if (feedback.target_advisers?.minimum !== 2 || feedback.target_advisers?.maximum !== 4) {
    errors.push("The feedback template must preserve the proposed two-to-four adviser envelope.");
  }
  if (!emptyArray(feedback.public_entries)) errors.push("No public methodological-adviser entries may exist before contact and attribution permission.");
  const allowedDispositions = normalizeStrings(feedback.allowed_dispositions);
  for (const disposition of [
    "adopted_before_launch",
    "adopted_with_modification",
    "not_adopted_with_rationale",
    "unresolved_and_disclosed",
  ]) {
    if (!allowedDispositions.includes(disposition)) errors.push(`Missing feedback disposition: ${disposition}.`);
  }
  if (feedback.attribution_requires_separate_permission !== true || feedback.endorsement_may_not_be_inferred !== true) {
    errors.push("Feedback attribution and endorsement boundaries must remain explicit.");
  }

  if (itemScreening.status !== "nonfinal_screening_authorized_no_records_yet") {
    errors.push("Item screening must be recorded as non-final, authorized, and not yet populated.");
  }
  if (itemScreening.controlled_private_manifest_required !== true || itemScreening.exact_ids_and_text_must_remain_private !== true) {
    errors.push("Item screening must require a private controlled manifest and keep exact IDs and text private.");
  }
  if (itemScreening.protected_manifest_freeze_authorized !== false || itemScreening.participant_assignment_authorized !== false) {
    errors.push("Non-final item screening must not authorize a protected-manifest freeze or participant assignment.");
  }
  for (const field of [
    "positions_screened",
    "positions_provisionally_included",
    "positions_excluded",
    "candidate_critiques_screened",
    "candidate_critiques_provisionally_selected",
  ]) {
    if (itemSummary[field] !== 0) errors.push(`item_screening_template.public_summary.${field} must remain zero before screening records exist.`);
  }
  for (const field of ["controlled_manifest_sha256", "exclusion_ledger_sha256"]) {
    if (itemSummary[field] !== null) errors.push(`item_screening_template.public_summary.${field} must remain null before a controlled screening ledger exists.`);
  }
  if (itemScreening.minimum_candidate_critiques_per_position_proposal !== 8) {
    errors.push("The non-binding candidate-pool proposal must remain eight critiques per position.");
  }
  if (itemScreening.selected_critiques_per_position_proposal !== 4) {
    errors.push("The non-binding selected-critique proposal must remain four per position.");
  }

  if (calibration.status !== "public_nonprotected_screening_authorized_no_materials_selected") {
    errors.push("Public non-protected calibration screening must be authorized without selecting materials.");
  }
  if (calibration.proposed_public_nonprotected_positions !== 2 || calibration.proposed_critiques !== 8) {
    errors.push("The non-binding calibration proposal must remain two public positions and eight critiques.");
  }
  if (!sameStringSet(calibration.participant_roles, ["core_rater", "dedicated_adjudicator"])) {
    errors.push("Calibration must cover both core-rater and dedicated-adjudicator roles.");
  }
  if (calibration.production_metric_exclusion_required !== true || calibration.honorarium_units_per_calibration_rating !== 0) {
    errors.push("Calibration must remain excluded from production metrics and worth zero honorarium units under the current plan.");
  }
  if (calibration.qualification_rule !== null || calibration.selected_materials_sha256 !== null) {
    errors.push("Calibration qualification and selected-material hash must remain unset before Q-006B.");
  }
  if (calibration.calibration_work_authorized !== false) {
    errors.push("Screening public calibration candidates must not authorize calibration work.");
  }

  if (baseline.status !== "template_only_lineup_pending") errors.push("Model-baseline lineup must remain pending.");
  if (baseline.may_serve_as_human_label !== false || baseline.may_serve_as_adjudicator !== false) {
    errors.push("Model baselines may not serve as human labels or adjudicators.");
  }
  if (!emptyArray(baseline.entries)) errors.push("No model-baseline entries may be represented as frozen before Q-006B.");
  const baselineFields = normalizeStrings(baseline.required_fields);
  for (const field of REQUIRED_BASELINE_FIELDS) {
    if (!baselineFields.includes(field)) errors.push(`model_baseline_template.required_fields must include ${field}.`);
  }

  if (people.status !== "template_only_no_people_selected") errors.push("People and payment records must remain a template with no selections.");
  if (requiredCounts.core_raters !== 6 || requiredCounts.dedicated_adjudicators !== 2) {
    errors.push("People template must preserve six core raters and two dedicated adjudicators.");
  }
  if (requiredCounts.recommended_prequalified_replacements_minimum !== 2) {
    errors.push("People template must preserve the recommendation for at least two replacements.");
  }
  if (!emptyArray(people.public_named_people)) errors.push("The public readiness ledger must not name participants.");
  if (people.sensitive_data_storage !== "private_controlled_record_only") {
    errors.push("Sensitive people and payment data must remain in private controlled storage only.");
  }
  const peopleFields = normalizeStrings(people.private_required_fields);
  if (!peopleFields.includes("approved_topic_families")) {
    errors.push("people_payment_template.private_required_fields must include approved_topic_families.");
  }

  if (assignment.status !== "template_only_controlled_generation_not_authorized") {
    errors.push("Assignment template must remain unauthorized until the later controlled assignment gate.");
  }
  if (!String(assignment.contract_path ?? "").endsWith("pilot-assignment-contract.json")) {
    errors.push("Assignment template must reference pilot-assignment-contract.json.");
  }
  if (assignment.public_summary !== null) {
    errors.push("assignment_template.public_summary must remain null before controlled assignment authorization and generation.");
  }
  if (assignment.full_output_storage !== "private_controlled_record_outside_repository") {
    errors.push("Assignment full output must remain a private controlled record outside the repository.");
  }
  if (assignment.rating_work_authorized_by_assignment !== false) {
    errors.push("Assignment generation must not authorize rating work.");
  }
  const assignmentFields = normalizeStrings(assignment.private_required_fields);
  for (const field of REQUIRED_ASSIGNMENT_PRIVATE_FIELDS) {
    if (!assignmentFields.includes(field)) errors.push(`assignment_template.private_required_fields must include ${field}.`);
  }

  if (taskBundle.status !== "template_only_controlled_generation_and_distribution_not_authorized") {
    errors.push("Task-bundle template must remain unauthorized for controlled generation and distribution.");
  }
  if (!String(taskBundle.contract_path ?? "").endsWith("pilot-task-bundle-contract.json")) {
    errors.push("Task-bundle template must reference pilot-task-bundle-contract.json.");
  }
  if (taskBundle.public_summary !== null) {
    errors.push("task_bundle_template.public_summary must remain null before controlled task-bundle generation.");
  }
  if (taskBundle.controlled_output_storage !== "private_controlled_directory_outside_repository") {
    errors.push("Controlled task bundles must remain in a private directory outside the repository.");
  }
  if (taskBundle.distribution_authorized_by_generation !== false) {
    errors.push("Task-bundle generation must not authorize distribution.");
  }
  if (taskBundle.rating_work_authorized_by_bundle !== false) {
    errors.push("Task bundles must not authorize rating work.");
  }
  const taskBundleFields = normalizeStrings(taskBundle.private_required_fields);
  for (const field of REQUIRED_TASK_BUNDLE_PRIVATE_FIELDS) {
    if (!taskBundleFields.includes(field)) errors.push(`task_bundle_template.private_required_fields must include ${field}.`);
  }

  const gates = Array.isArray(value?.readiness_gates) ? value.readiness_gates : [];
  if (gates.length !== EXPECTED_READINESS_GATES.length) errors.push("The readiness ledger must contain exactly six gates.");
  const observedGateIds = gates.map((gate) => String(gate?.id ?? ""));
  if (!sameStringSet(observedGateIds, EXPECTED_READINESS_GATES)) errors.push("Readiness gate IDs must remain R-01 through R-06.");

  const q006aGate = gates.find((gate) => gate?.id === "R-01");
  if (q006aGate?.status !== "passed") errors.push("R-01 must be passed after Q-006A approval.");
  const q006aEvidence = objectOrEmpty(q006aGate?.evidence);
  if (
    q006aEvidence.decision_id !== q006a.decision_id ||
    q006aEvidence.approval_record_id !== q006a.approval_record_id ||
    q006aEvidence.approval_record !== q006a.approval_record ||
    q006aEvidence.approved_at !== q006a.approved_at
  ) {
    errors.push("R-01 evidence must exactly match the Q-006A approval record.");
  }
  for (const gate of gates.filter((entry) => entry?.id !== "R-01")) {
    if (gate?.status !== "blocked" || gate?.evidence !== null) {
      errors.push(`${gate?.id ?? "unknown gate"} must remain blocked with null evidence.`);
    }
  }

  const methodologyGate = gates.find((gate) => gate?.id === "R-03");
  const methodologyGateName = String(methodologyGate?.name ?? "").toLowerCase();
  for (const required of ["ingestion", "adjudication", "snapshot", "controlled item manifest"]) {
    if (!methodologyGateName.includes(required)) errors.push(`R-03 name must include ${required}.`);
  }
  const assignmentGate = gates.find((gate) => gate?.id === "R-05");
  const assignmentGateName = String(assignmentGate?.name ?? "").toLowerCase();
  for (const required of ["separately authorized", "task-bundle", "topic-coverage", "balance", "blindness", "commitment"]) {
    if (!assignmentGateName.includes(required)) errors.push(`R-05 name must include ${required}.`);
  }

  if (overall.status !== "blocked" || overall.ready_to_start !== false) {
    errors.push("Overall readiness must remain blocked and not ready to start.");
  }
  for (const field of ["readiness_signed_at", "derived_calendar_start", "derived_calendar_end"]) {
    if (overall[field] !== null) errors.push(`overall_readiness.${field} must remain null.`);
  }

  if (!Array.isArray(value?.invariants) || value.invariants.length < 10) errors.push("At least ten public-readiness invariants must remain explicit.");
  const invariantText = normalizeStrings(value?.invariants).join(" ").toLowerCase();
  for (const required of [
    "q-006a authorizes only",
    "no email",
    "controlled assignment generation",
    "controlled task-bundle generation or distribution",
    "assignment generation is separate",
    "task-bundle generation is separate from distribution",
    "task-bundle distribution is separate from final readiness",
    "does not authorize rating work",
    "every remaining gate stays blocked",
  ]) {
    if (!invariantText.includes(required)) errors.push(`Readiness invariants must include ${required}.`);
  }

  if (value?.next_action?.id !== "Q-006A-PREP" || value?.next_action?.status !== "authorized_preparation_required") {
    errors.push("The next action must be the Q-006A-authorized preparation and screening work.");
  }
  const nextActionText = String(value?.next_action?.question ?? "").toLowerCase();
  for (const required of ["without sending", "public non-protected calibration", "non-final pilot-item screening", "without freezing", "selecting participants"]) {
    if (!nextActionText.includes(required)) errors.push(`next_action.question must include ${required}.`);
  }

  const serialized = JSON.stringify(value);
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(serialized)) {
    errors.push("The public readiness ledger must not contain an email address.");
  }
  for (const path of findForbiddenPopulatedKeys(value)) errors.push(`Forbidden public field populated: ${path}.`);

  return {
    status: errors.length ? "fail" : "pass",
    ledger_id: value?.ledger_id ?? null,
    programme_id: value?.programme_id ?? null,
    q006a_status: q006a.status ?? null,
    q006a_approved_at: q006a.approved_at ?? null,
    readiness_gate_count: gates.length,
    passed_gate_count: gates.filter((gate) => gate?.status === "passed").length,
    blocked_gate_count: gates.filter((gate) => gate?.status === "blocked").length,
    consultation_packet_preparation_authorized:
      authorization.methodological_consultation_packet_preparation_authorized ?? null,
    adviser_recipient_research_authorized:
      authorization.methodological_adviser_recipient_research_authorized ?? null,
    public_calibration_screening_authorized:
      authorization.public_calibration_screening_authorized ?? null,
    nonfinal_item_screening_authorized:
      authorization.nonfinal_item_screening_authorized ?? null,
    methodological_adviser_outreach_authorized:
      authorization.methodological_adviser_outreach_authorized ?? null,
    controlled_assignment_generation_authorized:
      authorization.controlled_assignment_generation_authorized ?? null,
    controlled_task_bundle_generation_authorized:
      authorization.controlled_task_bundle_generation_authorized ?? null,
    task_bundle_distribution_authorized:
      authorization.task_bundle_distribution_authorized ?? null,
    ready_to_start: overall.ready_to_start ?? null,
    errors,
  };
}

export async function readAndValidatePilotReadinessLedger(path) {
  return validatePilotReadinessLedger(JSON.parse(await readFile(path, "utf8")));
}

function findForbiddenPopulatedKeys(value, path = "$") {
  const found = [];
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => found.push(...findForbiddenPopulatedKeys(entry, `${path}[${index}]`)));
    return found;
  }
  for (const [key, entry] of Object.entries(value)) {
    const keyPath = `${path}.${key}`;
    if (FORBIDDEN_PUBLIC_KEYS.has(key) && entry !== null && entry !== "" && (!Array.isArray(entry) || entry.length > 0)) found.push(keyPath);
    found.push(...findForbiddenPopulatedKeys(entry, keyPath));
  }
  return found;
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

function emptyArray(value) {
  return Array.isArray(value) && value.length === 0;
}

function validIsoTimestamp(value) {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const path = resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/pilot-readiness-ledger.json`);
  const report = await readAndValidatePilotReadinessLedger(path);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
