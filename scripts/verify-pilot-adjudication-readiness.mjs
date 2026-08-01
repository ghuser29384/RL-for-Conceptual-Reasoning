import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const EXPECTED_ADJUDICATION_CLOSURE_GATES = Object.freeze([
  "A-01",
  "A-02",
  "A-03",
  "A-04",
  "A-05",
  "A-06",
  "A-07",
]);

export const ADJUDICATION_AUTHORIZATION_FIELDS = Object.freeze([
  "q_006a_approved",
  "q_006b_approved",
  "q_006c_approved",
  "operative_adjudication_policy_approved",
  "dedicated_adjudicators_selected",
  "accepted_initial_snapshot_frozen",
  "controlled_case_generation_authorized",
  "case_distribution_authorized",
  "adjudication_work_authorized",
  "rater_discussion_authorized",
  "rerating_work_authorized",
  "resolution_quality_control_authorized",
  "resolution_acceptance_authorized",
  "final_snapshot_generation_authorized",
  "final_snapshot_signoff_authorized",
  "adjudication_unit_ledger_freeze_authorized",
  "honoraria_payment_authorized",
  "analysis_authorized",
  "publication_authorized",
  "funding_submission_authorized",
  "phase_2_authorized",
]);

const FORBIDDEN_PUBLIC_KEYS = new Set([
  "email",
  "email_address",
  "professional_email",
  "participant_id",
  "rater_id",
  "adjudicator_id",
  "operator_id",
  "position_id",
  "critique_id",
  "rating_id",
  "case_id",
  "resolution_id",
  "signoff_id",
  "scores",
  "rationale",
  "object_level_considerations",
  "tax_id",
  "bank_account",
  "government_id",
]);

export function validatePilotAdjudicationReadiness(value) {
  const errors = [];
  const publicPolicy = objectOrEmpty(value?.public_record_policy);
  const authorization = objectOrEmpty(value?.authorization_state);
  const templates = objectOrEmpty(value?.controlled_evidence_templates);
  const gates = Array.isArray(value?.post_rating_closure_gates)
    ? value.post_rating_closure_gates
    : [];
  const overall = objectOrEmpty(value?.overall_post_rating_state);

  if (
    value?.addendum_id !==
    "metaphilosophy-pilot-adjudication-readiness-v1-2026-08-01"
  ) {
    errors.push("addendum_id must identify the 2026-08-01 adjudication readiness addendum.");
  }
  if (value?.addendum_version !== 1) errors.push("addendum_version must equal 1.");
  if (
    value?.programme_id !==
    "metaphilosophy-48-critique-pilot-v1-2026-07-30"
  ) {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (
    value?.status !==
    "blocked_template_only_parent_prestart_readiness_unchanged"
  ) {
    errors.push("status must keep the addendum blocked and the parent readiness ledger unchanged.");
  }
  if (!String(value?.parent_readiness_ledger ?? "").endsWith("pilot-readiness-ledger.json")) {
    errors.push("parent_readiness_ledger must reference pilot-readiness-ledger.json.");
  }
  if (!String(value?.contract_path ?? "").endsWith("pilot-adjudication-contract.json")) {
    errors.push("contract_path must reference pilot-adjudication-contract.json.");
  }

  for (const field of [
    "contains_adjudicator_names_or_contacts",
    "contains_rater_or_operator_identifiers",
    "contains_protected_item_ids_or_text",
    "contains_rating_ids_scores_or_rationales",
    "contains_case_resolution_or_signoff_ids",
    "contains_case_packets_or_object_level_notes",
    "contains_payment_tax_or_identity_data",
  ]) {
    if (publicPolicy[field] !== false) {
      errors.push(`public_record_policy.${field} must remain false.`);
    }
  }
  if (publicPolicy.private_controlled_records_required !== true) {
    errors.push("Sensitive adjudication records must remain private controlled records.");
  }

  for (const field of ADJUDICATION_AUTHORIZATION_FIELDS) {
    if (authorization[field] !== false) {
      errors.push(`authorization_state.${field} must remain false.`);
    }
  }

  for (const templateName of [
    "operative_policy",
    "adjudicator_roster",
    "accepted_initial_snapshot",
    "case_generation",
    "distribution_and_work",
    "resolution",
    "final_snapshot",
    "adjudication_honoraria",
  ]) {
    if (templates[templateName]?.status !== "template_only") {
      errors.push(`controlled_evidence_templates.${templateName}.status must remain template_only.`);
    }
    if (!Array.isArray(templates[templateName]?.required_fields) || templates[templateName].required_fields.length < 4) {
      errors.push(`controlled_evidence_templates.${templateName}.required_fields is incomplete.`);
    }
  }
  if (templates.adjudicator_roster?.required_count !== 2) {
    errors.push("The adjudicator roster template must require exactly two adjudicators.");
  }
  if (templates.adjudication_honoraria?.reserve_usd !== 100) {
    errors.push("The adjudication honoraria template must preserve the USD 100 reserve.");
  }
  if (templates.adjudication_honoraria?.candidate_events_authorize_payment !== false) {
    errors.push("Candidate adjudication events must not authorize payment.");
  }
  if (templates.adjudication_honoraria?.unused_balance_remains_unspent !== true) {
    errors.push("Unused adjudication reserve must remain unspent.");
  }

  if (gates.length !== EXPECTED_ADJUDICATION_CLOSURE_GATES.length) {
    errors.push("The addendum must contain exactly seven post-rating closure gates.");
  }
  const gateIds = gates.map((gate) => String(gate?.id ?? ""));
  if (!sameStringSet(gateIds, EXPECTED_ADJUDICATION_CLOSURE_GATES)) {
    errors.push("Post-rating closure gates must remain A-01 through A-07.");
  }
  for (const gate of gates) {
    if (gate?.status !== "blocked" || gate?.evidence !== null) {
      errors.push(`${gate?.id ?? "unknown gate"} must remain blocked with null evidence.`);
    }
  }
  const gateText = gates.map((gate) => String(gate?.name ?? "")).join(" ").toLowerCase();
  for (const phrase of [
    "operative policy",
    "case set generated",
    "distribution and adjudication work separately authorized",
    "append-only rerating",
    "explicit unresolved closure",
    "signed by both dedicated adjudicators",
    "without authorizing payment",
  ]) {
    if (!gateText.includes(phrase)) errors.push(`Closure gate names must include ${phrase}.`);
  }

  if (overall.status !== "blocked") errors.push("overall_post_rating_state.status must remain blocked.");
  for (const field of [
    "all_required_cases_closed",
    "final_snapshot_complete",
    "adjudication_unit_ledger_frozen",
  ]) {
    if (overall[field] !== false) errors.push(`overall_post_rating_state.${field} must remain false.`);
  }
  if (overall.closed_at !== null) errors.push("overall_post_rating_state.closed_at must remain null.");

  if (!Array.isArray(value?.invariants) || value.invariants.length < 9) {
    errors.push("At least nine adjudication readiness invariants must remain explicit.");
  }
  const invariantText = normalizeStrings(value?.invariants).join(" ").toLowerCase();
  for (const phrase of [
    "does not alter or pass any parent pre-start readiness gate",
    "diagnostic routes do not create cases",
    "separate controls",
    "initial ratings are immutable",
    "reratings are append-only",
    "explicit unresolved closure",
    "does not impose a consensus score",
    "do not authorize payment",
    "no adjudication artifact authorizes analysis",
  ]) {
    if (!invariantText.includes(phrase)) errors.push(`Readiness invariants must include ${phrase}.`);
  }

  if (value?.next_action?.id !== "Q-006A" || value?.next_action?.status !== "project_owner_decision_required") {
    errors.push("The next action must remain Q-006A with project-owner decision required.");
  }

  const serialized = JSON.stringify(value);
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(serialized)) {
    errors.push("The public addendum must not contain an email address.");
  }
  for (const path of findForbiddenPopulatedKeys(value)) {
    errors.push(`Forbidden public field populated: ${path}.`);
  }

  return {
    status: errors.length ? "fail" : "pass",
    addendum_id: value?.addendum_id ?? null,
    closure_gate_count: gates.length,
    blocked_gate_count: gates.filter((gate) => gate?.status === "blocked").length,
    operative_policy_approved:
      authorization.operative_adjudication_policy_approved ?? null,
    case_generation_authorized:
      authorization.controlled_case_generation_authorized ?? null,
    adjudication_work_authorized:
      authorization.adjudication_work_authorized ?? null,
    final_snapshot_signoff_authorized:
      authorization.final_snapshot_signoff_authorized ?? null,
    payment_authorized: authorization.honoraria_payment_authorized ?? null,
    phase_2_authorized: authorization.phase_2_authorized ?? null,
    errors,
  };
}

export async function readAndValidatePilotAdjudicationReadiness(path) {
  return validatePilotAdjudicationReadiness(
    JSON.parse(await readFile(path, "utf8")),
  );
}

function findForbiddenPopulatedKeys(value, path = "$") {
  const found = [];
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      found.push(...findForbiddenPopulatedKeys(entry, `${path}[${index}]`));
    });
    return found;
  }
  for (const [key, entry] of Object.entries(value)) {
    const keyPath = `${path}.${key}`;
    if (
      FORBIDDEN_PUBLIC_KEYS.has(key) &&
      entry !== null &&
      entry !== "" &&
      (!Array.isArray(entry) || entry.length > 0)
    ) {
      found.push(keyPath);
    }
    found.push(...findForbiddenPopulatedKeys(entry, keyPath));
  }
  return found;
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function normalizeStrings(value) {
  return Array.isArray(value)
    ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean)
    : [];
}

function sameStringSet(left, right) {
  const leftSet = new Set(normalizeStrings(left));
  const rightSet = new Set(normalizeStrings(right));
  return (
    leftSet.size === rightSet.size &&
    [...leftSet].every((entry) => rightSet.has(entry))
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const path = resolve(
    process.argv[2] ??
      `${root}/ops/next-steps-2026-07-23/pilot-adjudication-readiness-addendum.json`,
  );
  const report = await readAndValidatePilotAdjudicationReadiness(path);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
