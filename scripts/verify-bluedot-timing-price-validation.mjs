import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const BLUEDOT_TIMING_PRICE_CONTRACT_PATH = "ops/next-steps-2026-07-23/bluedot-timing-price-validation-v1.json";
export const BLUEDOT_TIMING_PRICE_DOCUMENT_PATH = "docs/bluedot-timing-price-validation-protocol-v1.md";
export const PANEL_HONORARIA_PLAN_PATH = "ops/next-steps-2026-07-23/panel-honoraria-plan.json";

const REQUIRED_STAGES = Object.freeze([
  "orientation", "calibration", "position_conclusion", "critique_interpretation",
  "initial_scoring", "blind_self_check", "initial_cause_code",
  "reconciliation_rehearsal", "administration",
]);
const REQUIRED_STATES = Object.freeze([
  "not_ready_to_price", "synthetic_instrumentation_ready_not_price_evidence",
  "blocked_by_unresolved_serious_defect", "evidence_ready_for_owner_redesign_decision",
  "evidence_ready_for_owner_pricing_decision",
]);
const REQUIRED_FALSE_AUTH = Object.freeze([
  "authorizes_external_outreach", "authorizes_participant_selection",
  "authorizes_participant_access", "authorizes_human_timing_collection",
  "authorizes_price_acceptance_collection", "authorizes_research_ratings",
  "authorizes_research_start", "authorizes_payment", "authorizes_grant_submission",
  "authorizes_grant_amount_selection", "authorizes_publication_of_private_evidence",
  "authorizes_merge", "authorizes_deployment",
  "authorizes_production_or_staging_data_mutation",
]);
const DOCUMENT_MARKERS = Object.freeze([
  "Owner decision:** B", "request amount remains **unset**",
  "2 synthetic positions", "16 blind initial rating records",
  "4 blind self-check records", "16 initial cause-code records",
  "T0 — synthetic instrumentation rehearsal",
  "T1 — qualified role-specific timing and price evidence",
  "post-task, nonbinding price expectations", "does not authorize T1",
  "No state automatically selects a grant amount",
]);

export function validateBlueDotTimingPriceProtocol({ contract, document, panelPlan }) {
  const errors = [];
  const c = object(contract);
  const panel = object(panelPlan);
  const decision = object(c.owner_decision);
  const deps = object(c.dependencies);
  const design = object(c.measurement_design);
  const timing = object(c.timing_policy);
  const qualified = object(c.qualified_evidence_requirements);
  const prices = object(c.price_evidence_policy);
  const readiness = object(c.readiness_states);
  const privacy = object(c.privacy_and_publication);
  const auth = object(c.authorization_boundary);

  expect(c.contract_id === "mp-bluedot-timing-price-validation-v1", "contract id must remain mp-bluedot-timing-price-validation-v1", errors);
  expect(c.contract_version === 1, "contract version must equal 1", errors);
  expect(c.status === "owner_approved_protocol_design_only_evidence_not_collected", "status must remain protocol-design-only with evidence uncollected", errors);
  expect(c.approved_at === "2026-08-22" && c.approved_by === "Ellen Sun", "owner and approval date must remain frozen", errors);
  expect(decision.decision === "B", "owner decision must remain B", errors);
  expect(decision.bluedot_request_amount_usd === null, "BlueDot request amount must remain unset", errors);
  expect(decision.individual_role_allocations_usd === null, "individual allocations must remain unset", errors);
  expect(decision.automatic_amount_selection === false && decision.later_owner_pricing_decision_required === true, "amount selection must remain owner-gated", errors);

  expect(deps.research_positioning_contract_id === "mp-research-positioning-v1", "research positioning dependency is wrong", errors);
  expect(deps.pilot_endpoint_contract_id === "mp-pilot-endpoint-design-amendment-v1", "endpoint dependency is wrong", errors);
  expect(deps.pilot_endpoint_implementation_head === "6a579c957b22719d52dc7c681a4107f517bb70eb", "endpoint implementation head must remain exact", errors);
  expect(deps.current_pilot_honoraria_plan_path === PANEL_HONORARIA_PLAN_PATH, "panel-plan path is wrong", errors);
  expect(deps.current_pilot_honoraria_plan_id === panel.plan_id && deps.current_pilot_honoraria_plan_version === panel.plan_version, "panel-plan identity/version mismatch", errors);
  expect(deps.current_pilot_honoraria_ceiling_usd === panel.budget?.ceiling && deps.current_pilot_honoraria_ceiling_usd === 500, "current pilot ceiling must be read through as USD 500", errors);
  expect(deps.current_adjudication_reserve_usd === panel.budget?.allocation?.adjudication_reserve?.amount && deps.current_adjudication_reserve_usd === 100, "current adjudication reserve must be USD 100", errors);
  expect(deps.amends_current_pilot_honoraria_plan === false, "protocol must not amend the pilot honoraria plan", errors);
  expect(deps.equates_current_pilot_ceiling_with_bluedot_request === false, "pilot ceiling must not become the BlueDot request", errors);

  const exactGeometry = {
    positions: 2, critiques_per_position: 4, paired_critique_units: 8, rater_roles: 2,
    position_conclusion_records: 4, critique_interpretation_records: 16,
    initial_rating_records: 16, blind_self_check_records: 4, cause_coder_roles: 2,
    initial_cause_code_records: 16, reconciliation_rehearsal_cases: 2,
    reconciliation_person_records: 4, minimum_distinct_people_for_qualified_evidence: 4,
  };
  for (const [key, value] of Object.entries(exactGeometry)) expect(design[key] === value, `measurement_design.${key} must equal ${value}`, errors);
  expect(design.same_people_may_fill_rater_and_cause_coder_roles === false, "rater and cause-coder roles must remain separate", errors);
  expect(String(design.self_check_selection_rule ?? "").includes("Before any timed work"), "self-check selection must be frozen before timing", errors);

  const t0 = object(c.stages?.T0_synthetic_instrumentation_rehearsal);
  const t1 = object(c.stages?.T1_qualified_role_specific_timing_and_price_evidence);
  for (const key of ["counts_as_expert_usability_evidence", "counts_as_scientific_evidence", "counts_as_price_evidence", "may_set_bluedot_request_amount"]) {
    expect(t0[key] === false, `T0.${key} must remain false`, errors);
  }
  expect(t0.external_outreach_required === false, "T0 must require no outreach", errors);
  for (const key of ["requires_separate_owner_authorization_before_contact_or_access", "requires_current_participant_information_and_consent", "requires_private_controlled_storage"]) {
    expect(t1[key] === true, `T1.${key} must remain true`, errors);
  }
  expect(t1.counts_as_full_pilot_or_research_start === false && t1.may_set_bluedot_request_amount_automatically === false, "T1 must not start research or choose an amount", errors);

  expect(timing.unit === "seconds" && timing.timing_method === "monotonic_active_timer_v1", "timing method must remain monotonic active seconds", errors);
  expect(sameSet(timing.required_stage_types, REQUIRED_STAGES), "required stage set changed", errors);
  const counts = object(timing.core_stage_expected_counts);
  for (const [key, value] of Object.entries({ position_conclusion: 4, critique_interpretation: 16, initial_scoring: 16, blind_self_check: 4, initial_cause_code: 16, reconciliation_rehearsal: 4 })) {
    expect(counts[key] === value, `timing count ${key} must equal ${value}`, errors);
  }
  for (const key of ["orientation_calibration_and_administration_reported_separately", "no_imputation", "incomplete_or_excluded_records_reported_not_replaced_silently", "wall_clock_and_active_time_both_recorded", "interruption_count_recorded"]) {
    expect(timing[key] === true, `timing_policy.${key} must remain true`, errors);
  }

  expect(qualified.people_by_role?.rater === 2 && qualified.people_by_role?.cause_coder === 2, "qualified evidence requires two raters and two cause coders", errors);
  expect(qualified.role_separation_required === true && qualified.unresolved_p0_or_p1_defects_allowed === false && qualified.withdrawal_or_incomplete_role_allows_pricing_readiness === false, "qualified-evidence fail-closed rules changed", errors);
  expect(Array.isArray(qualified.for_each_person) && qualified.for_each_person.length >= 7, "per-person evidence requirements are incomplete", errors);

  expect(prices.currency === "USD" && prices.nonbinding === true && prices.collected_after_timed_scope_completion === true, "price evidence must remain post-task, nonbinding, and in USD", errors);
  expect(prices.required_records === 4, "exactly four price records are required", errors);
  expect(sameSet(prices.allowed_response_statuses, ["usable_amount_evidence", "declines_fixed_honorarium_model", "needs_scope_revision"]), "price response status set changed", errors);
  expect(prices.individual_amounts_public === false && prices.small_cell_role_amount_ranges_public === false && prices.payment_promise_created === false && prices.grant_request_created === false, "price privacy or noncommitment boundary changed", errors);

  expect(sameSet(readiness.allowed, REQUIRED_STATES), "readiness state set changed", errors);
  expect(readiness.initial === "not_ready_to_price", "initial readiness must be not_ready_to_price", errors);
  expect(readiness.synthetic_complete_state === "synthetic_instrumentation_ready_not_price_evidence", "T0 readiness state changed", errors);
  expect(readiness.controlled_complete_usable_price_state === "evidence_ready_for_owner_pricing_decision", "usable-evidence state changed", errors);
  expect(readiness.controlled_complete_decline_or_scope_revision_state === "evidence_ready_for_owner_redesign_decision", "redesign state changed", errors);
  for (const key of ["automatic_grant_amount_selection", "automatic_honorarium_allocation", "automatic_outreach_authorization"]) expect(readiness[key] === false, `readiness_states.${key} must remain false`, errors);
  expect(readiness.owner_decision_required_after_evidence === true, "owner decision must remain required after evidence", errors);

  expect(privacy.private_evidence_contains_pseudonymous_ids_only === true && privacy.legal_names_and_payment_details_stored_separately === true, "private identity boundary changed", errors);
  expect(privacy.minimum_public_cell_size === 4 && privacy.public_output_is_not_participant_level_data === true, "public small-cell boundary changed", errors);
  for (const marker of ["person identifiers", "individual timing records", "individual price amounts or ranges", "qualification documents"]) {
    expect(privacy.public_readback_omits?.includes(marker), `public readback must omit ${marker}`, errors);
  }

  for (const key of REQUIRED_FALSE_AUTH) expect(auth[key] === false, `authorization_boundary.${key} must remain false`, errors);
  for (const [key, value] of Object.entries(auth)) expect(value === false, `authorization_boundary.${key} must be false`, errors);
  for (const marker of DOCUMENT_MARKERS) expect(String(document ?? "").includes(marker), `protocol document must preserve marker: ${marker}`, errors);

  return {
    status: errors.length ? "fail" : "pass",
    contract_id: c.contract_id ?? null,
    owner_decision: decision.decision ?? null,
    bluedot_request_amount_usd: decision.bluedot_request_amount_usd ?? null,
    individual_role_allocations_usd: decision.individual_role_allocations_usd ?? null,
    endpoint_implementation_head: deps.pilot_endpoint_implementation_head ?? null,
    required_stages: timing.required_stage_types?.length ?? 0,
    authorization_false_count: REQUIRED_FALSE_AUTH.filter((key) => auth[key] === false).length,
    errors,
  };
}

export async function readAndValidateBlueDotTimingPriceProtocol(root = resolve(import.meta.dirname, "..")) {
  const [contractText, document, panelText] = await Promise.all([
    readFile(resolve(root, BLUEDOT_TIMING_PRICE_CONTRACT_PATH), "utf8"),
    readFile(resolve(root, BLUEDOT_TIMING_PRICE_DOCUMENT_PATH), "utf8"),
    readFile(resolve(root, PANEL_HONORARIA_PLAN_PATH), "utf8"),
  ]);
  return validateBlueDotTimingPriceProtocol({ contract: JSON.parse(contractText), document, panelPlan: JSON.parse(panelText) });
}

function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function sameSet(actual, expected) { return JSON.stringify([...new Set(actual ?? [])].sort()) === JSON.stringify([...new Set(expected)].sort()); }
function expect(condition, message, errors) { if (!condition) errors.push(message); }

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await readAndValidateBlueDotTimingPriceProtocol();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
