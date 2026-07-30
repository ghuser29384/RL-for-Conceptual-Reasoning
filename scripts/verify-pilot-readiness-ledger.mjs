import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const EXPECTED_READINESS_GATES = Object.freeze(["R-01", "R-02", "R-03", "R-04", "R-05", "R-06"]);
export const EXECUTION_AUTHORIZATION_FIELDS = Object.freeze([
  "methodological_adviser_recipient_research_authorized",
  "methodological_adviser_outreach_authorized",
  "public_recruitment_authorized",
  "participant_outreach_authorized",
  "nonfinal_item_screening_authorized",
  "protected_manifest_freeze_authorized",
  "participant_selection_authorized",
  "calibration_or_rating_work_authorized",
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
  "position_ids",
  "critique_ids",
  "item_text",
  "protected_item_text",
  "protected_critiques",
  "labels",
  "assignments",
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
  const overall = objectOrEmpty(value?.overall_readiness);

  if (value?.ledger_id !== "metaphilosophy-pilot-readiness-v1-2026-07-30") {
    errors.push("ledger_id must identify the 2026-07-30 pilot readiness ledger.");
  }
  if (value?.ledger_version !== 1) errors.push("ledger_version must equal 1.");
  if (value?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the active 48-critique pilot.");
  }
  if (value?.status !== "blocked_pending_q006a_and_later_readiness_gates") {
    errors.push("The public readiness ledger must remain blocked while Q-006A and later gates are pending.");
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

  if (q006a.status !== "pending_project_owner_decision" || q006a.approved_at !== null) {
    errors.push("Q-006A must remain pending with no approval timestamp until the project owner explicitly approves it.");
  }
  if (!String(q006a.approval_record ?? "").endsWith("q-006a-owner-approval.md")) {
    errors.push("Q-006A must reference the owner-approval record template.");
  }
  for (const field of EXECUTION_AUTHORIZATION_FIELDS) {
    if (authorization[field] !== false) errors.push(`authorization_state.${field} must remain false.`);
  }

  if (feedback.status !== "template_only_no_adviser_contact_authorized") {
    errors.push("Methodological feedback must remain a template with no adviser contact authorized.");
  }
  if (feedback.target_advisers?.minimum !== 2 || feedback.target_advisers?.maximum !== 4) {
    errors.push("The feedback template must preserve the proposed two-to-four adviser envelope.");
  }
  if (!emptyArray(feedback.public_entries)) errors.push("No public methodological-adviser entries may exist before authorized outreach and permission.");
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

  if (itemScreening.status !== "template_only_screening_not_authorized") {
    errors.push("Item screening must remain an unauthorized template until Q-006A is approved.");
  }
  if (itemScreening.controlled_private_manifest_required !== true || itemScreening.exact_ids_and_text_must_remain_private !== true) {
    errors.push("Item screening must require a private controlled manifest and keep exact IDs and text private.");
  }
  for (const field of [
    "positions_screened",
    "positions_provisionally_included",
    "positions_excluded",
    "candidate_critiques_screened",
    "candidate_critiques_provisionally_selected",
  ]) {
    if (itemSummary[field] !== 0) errors.push(`item_screening_template.public_summary.${field} must remain zero before screening authorization.`);
  }
  for (const field of ["controlled_manifest_sha256", "exclusion_ledger_sha256"]) {
    if (itemSummary[field] !== null) errors.push(`item_screening_template.public_summary.${field} must remain null before a controlled freeze.`);
  }
  if (itemScreening.minimum_candidate_critiques_per_position_proposal !== 8) {
    errors.push("The non-binding candidate-pool proposal must remain eight critiques per position.");
  }
  if (itemScreening.selected_critiques_per_position_proposal !== 4) {
    errors.push("The non-binding selected-critique proposal must remain four per position.");
  }

  if (calibration.status !== "template_only_materials_and_pass_rule_pending") {
    errors.push("Calibration must remain a template with materials and qualification rule pending.");
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
    errors.push("Calibration qualification and material hash must remain unset before later approval.");
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

  const gates = Array.isArray(value?.readiness_gates) ? value.readiness_gates : [];
  if (gates.length !== EXPECTED_READINESS_GATES.length) errors.push("The readiness ledger must contain exactly six gates.");
  const observedGateIds = gates.map((gate) => String(gate?.id ?? ""));
  if (!sameStringSet(observedGateIds, EXPECTED_READINESS_GATES)) errors.push("Readiness gate IDs must remain R-01 through R-06.");
  for (const gate of gates) {
    if (gate?.status !== "blocked" || gate?.evidence !== null) {
      errors.push(`${gate?.id ?? "unknown gate"} must remain blocked with null evidence.`);
    }
  }

  if (overall.status !== "blocked" || overall.ready_to_start !== false) {
    errors.push("Overall readiness must remain blocked and not ready to start.");
  }
  for (const field of ["readiness_signed_at", "derived_calendar_start", "derived_calendar_end"]) {
    if (overall[field] !== null) errors.push(`overall_readiness.${field} must remain null.`);
  }

  if (!Array.isArray(value?.invariants) || value.invariants.length < 6) errors.push("At least six public-readiness invariants must remain explicit.");
  if (value?.next_action?.id !== "Q-006A" || value?.next_action?.status !== "project_owner_decision_required") {
    errors.push("The next action must remain Q-006A with a project-owner decision required.");
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
    readiness_gate_count: gates.length,
    blocked_gate_count: gates.filter((gate) => gate?.status === "blocked").length,
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

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const path = resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/pilot-readiness-ledger.json`);
  const report = await readAndValidatePilotReadinessLedger(path);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
