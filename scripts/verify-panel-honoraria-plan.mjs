import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const APPROVED_PANEL = Object.freeze({ core_raters: 6, dedicated_adjudicators: 2, total_people: 8 });
export const APPROVED_BUDGET = Object.freeze({ currency: "USD", ceiling: 500 });
export const APPROVED_DELIVERY_WINDOW = Object.freeze({ duration_weeks: 4, duration_days: 28 });
export const APPROVED_HONORARIA_ENVELOPES = Object.freeze({
  core_rater_completion_pool: 400,
  adjudication_reserve: 100,
  total: 500,
});
export const APPROVED_OPERATIONS_OWNER = Object.freeze({ name: "Ellen Sun", role: "project_owner" });
export const PILOT_WORKLOAD = Object.freeze({
  positions: 12,
  critiques_per_position: 4,
  critiques: 48,
  independent_initial_ratings_per_critique: 2,
  initial_ratings: 96,
  nominal_positions_per_core_rater: 4,
  nominal_initial_ratings_per_core_rater: 16,
});

export function validatePanelHonorariaPlan(value) {
  const errors = [];
  const programmeScope = objectOrEmpty(value?.programme_scope);
  const panel = objectOrEmpty(value?.panel);
  const workload = objectOrEmpty(value?.minimum_workload);
  const delivery = objectOrEmpty(value?.delivery_window);
  const startRule = objectOrEmpty(delivery.start_rule);
  const operations = objectOrEmpty(value?.operations);
  const owner = objectOrEmpty(operations.owner);
  const attrition = objectOrEmpty(operations.assignment_and_attrition);
  const payment = objectOrEmpty(operations.payment);
  const budget = objectOrEmpty(value?.budget);
  const allocation = objectOrEmpty(budget.allocation);
  const corePool = objectOrEmpty(allocation.core_rater_completion_pool);
  const coreUnits = objectOrEmpty(corePool.contribution_unit_definition);
  const coreEligibility = objectOrEmpty(corePool.minimum_eligibility_threshold);
  const coreDistribution = objectOrEmpty(corePool.distribution_rule);
  const adjudicationReserve = objectOrEmpty(allocation.adjudication_reserve);
  const adjudicationUnits = objectOrEmpty(adjudicationReserve.contribution_unit_definition);
  const adjudicationEligibility = objectOrEmpty(adjudicationReserve.minimum_eligibility_threshold);
  const adjudicationDistribution = objectOrEmpty(adjudicationReserve.distribution_rule);

  if (value?.plan_id !== "pilot-panel-honoraria-v1-2026-07-23") {
    errors.push("plan_id must identify the pilot panel and honoraria plan.");
  }
  if (programmeScope.active_programme !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_scope.active_programme must identify the 48-critique pilot.");
  }
  if (programmeScope.full_400_critique_programme_status !== "deferred_phase_2") {
    errors.push("The full 400-critique programme must remain deferred Phase 2.");
  }

  for (const [field, expected] of Object.entries(APPROVED_PANEL)) {
    if (panel[field] !== expected) errors.push(`panel.${field} must equal ${expected}; found ${String(panel[field])}.`);
  }
  if (panel.core_raters + panel.dedicated_adjudicators !== panel.total_people) {
    errors.push("panel.total_people must equal core_raters + dedicated_adjudicators.");
  }
  if (panel.role_separation !== true) errors.push("panel.role_separation must be true.");
  if (panel.core_rater_seniority !== "early_career_expert") {
    errors.push("panel.core_rater_seniority must preserve early-career experts for bulk work.");
  }

  for (const [field, expected] of Object.entries(PILOT_WORKLOAD)) {
    if (workload[field] !== expected) errors.push(`minimum_workload.${field} must equal ${expected}; found ${String(workload[field])}.`);
  }
  if (!String(workload.structure_status ?? "").includes("pending")) {
    errors.push("minimum_workload.structure_status must preserve final readiness approval as pending.");
  }
  if (workload.critiques !== workload.positions * workload.critiques_per_position) {
    errors.push("minimum_workload.critiques must equal positions multiplied by critiques_per_position.");
  }
  if (workload.initial_ratings !== workload.critiques * workload.independent_initial_ratings_per_critique) {
    errors.push("minimum_workload.initial_ratings must cover every critique twice.");
  }
  if (workload.nominal_positions_per_core_rater * panel.core_raters !== workload.positions * 2) {
    errors.push("nominal positions per core rater must allocate both position assignments across the panel.");
  }
  if (workload.nominal_initial_ratings_per_core_rater * panel.core_raters !== workload.initial_ratings) {
    errors.push("nominal initial ratings per core rater must allocate all 96 initial ratings.");
  }
  if (workload.source_estimate_minutes_per_short_rating?.minimum !== 5) {
    errors.push("source_estimate_minutes_per_short_rating.minimum must equal 5.");
  }
  if (workload.source_estimate_minutes_per_short_rating?.maximum !== 15) {
    errors.push("source_estimate_minutes_per_short_rating.maximum must equal 15.");
  }
  if (workload.estimated_initial_rating_hours?.minimum !== 8 || workload.estimated_initial_rating_hours?.maximum !== 24) {
    errors.push("estimated_initial_rating_hours must equal 8 to 24 hours for 96 ratings at 5 to 15 minutes each.");
  }

  if (delivery.model !== "relative_to_readiness_gate") errors.push("delivery_window.model must equal relative_to_readiness_gate.");
  for (const [field, expected] of Object.entries(APPROVED_DELIVERY_WINDOW)) {
    if (delivery[field] !== expected) errors.push(`delivery_window.${field} must equal ${expected}.`);
  }
  if (delivery.calendar_start !== null || delivery.calendar_end !== null) {
    errors.push("Calendar dates must remain null until the readiness gate passes and the start rule is applied.");
  }
  if (delivery.start_condition !== "pilot_readiness_gate_passed_and_start_rule_applied") {
    errors.push("delivery_window.start_condition must bind pilot readiness and the approved start rule.");
  }
  if (startRule.model !== "first_monday_at_0000_utc_at_least_72_hours_after_readiness_signoff") {
    errors.push("delivery_window.start_rule.model does not match the approved rule.");
  }
  if (startRule.timezone !== "UTC" || startRule.minimum_notice_hours !== 72 || startRule.readiness_signed_at !== null) {
    errors.push("The start rule must use UTC, 72 hours of notice, and no premature readiness timestamp.");
  }
  if (delivery.end_condition !== "pilot_completion_gate_passed") {
    errors.push("delivery_window.end_condition must equal pilot_completion_gate_passed.");
  }
  const readinessGate = Array.isArray(delivery.readiness_gate) ? delivery.readiness_gate : [];
  if (readinessGate.length < 5) errors.push("delivery_window.readiness_gate must contain the five minimum readiness conditions.");
  const readinessText = readinessGate.join(" ").toLowerCase();
  for (const required of ["project owner approves", "numerical disagreement", "methodological-adviser", "early-career", "two independent", "legal, tax"]) {
    if (!readinessText.includes(required)) errors.push(`delivery_window.readiness_gate must include ${required}.`);
  }
  const completionGate = Array.isArray(delivery.completion_gate) ? delivery.completion_gate : [];
  if (completionGate.length < 4) errors.push("delivery_window.completion_gate must contain the four minimum completion conditions.");
  const completionText = completionGate.join(" ").toLowerCase();
  for (const required of ["96", "adjudication", "sign-off", "audit records"]) {
    if (!completionText.includes(required)) errors.push(`delivery_window.completion_gate must include ${required}.`);
  }
  if (delivery.nominal_pace?.initial_ratings_total_per_week !== 24) {
    errors.push("delivery_window.nominal_pace.initial_ratings_total_per_week must equal 24.");
  }
  if (delivery.nominal_pace?.initial_ratings_per_core_rater_per_week !== 4) {
    errors.push("delivery_window.nominal_pace.initial_ratings_per_core_rater_per_week must equal 4.");
  }
  if (delivery.nominal_pace?.status !== "planning_average_not_honorarium_eligibility_threshold") {
    errors.push("Nominal pace must not be represented as an honorarium eligibility threshold.");
  }
  if (delivery.rolling_adjudication !== true) errors.push("delivery_window.rolling_adjudication must be true.");
  if (delivery.automatic_extension !== false) errors.push("delivery_window.automatic_extension must be false.");
  if (delivery.extension_requires !== "project_owner_approval") {
    errors.push("delivery_window.extension_requires must equal project_owner_approval.");
  }

  if (owner.name !== APPROVED_OPERATIONS_OWNER.name || owner.role !== APPROVED_OPERATIONS_OWNER.role) {
    errors.push("operations.owner must identify Ellen Sun as project_owner.");
  }
  if (owner.authority !== "human_operations_owner") errors.push("operations.owner.authority must equal human_operations_owner.");
  if (attrition.accepted_units_preserved_after_withdrawal_or_replacement !== true) {
    errors.push("Accepted units must be preserved after withdrawal or replacement.");
  }
  if (attrition.retroactive_forfeiture_of_accepted_units !== false) {
    errors.push("Retroactive forfeiture of accepted units must be false.");
  }
  const missedSequence = Array.isArray(attrition.missed_checkpoint_sequence) ? attrition.missed_checkpoint_sequence : [];
  if (!missedSequence.some((step) => step?.elapsed_hours === 48 && String(step?.action).includes("reassign"))) {
    errors.push("The attrition policy must allow reassignment after 48 hours without an approved recovery plan.");
  }
  if (!Array.isArray(attrition.replacement_requirements) || attrition.replacement_requirements.length < 4) {
    errors.push("Replacement requirements must preserve qualification, consent/conflict, calibration, and exposure checks.");
  }
  if (payment.final_ledger_freeze_target_business_days_after_completion_gate !== 5) {
    errors.push("The ledger-freeze target must be five business days after completion.");
  }
  if (payment.disbursement_target_calendar_days_after_final_ledger_freeze !== 14) {
    errors.push("The disbursement target must be fourteen calendar days after ledger freeze.");
  }
  if (!Array.isArray(payment.targets_are_contingent_on) || payment.targets_are_contingent_on.length < 3) {
    errors.push("Payment targets must remain contingent on onboarding and legal/tax readiness.");
  }

  if (budget.currency !== APPROVED_BUDGET.currency) errors.push("budget.currency must equal USD.");
  if (budget.ceiling !== APPROVED_BUDGET.ceiling) errors.push("budget.ceiling must equal 500.");
  if (budget.model !== "limited_honoraria_for_volunteer_expert_work") {
    errors.push("budget.model must preserve the owner-approved limited-honoraria model.");
  }
  if (budget.rate_based_compensation !== false) errors.push("budget.rate_based_compensation must be false.");
  if (budget.full_labour_cost_coverage_claim !== false) errors.push("budget.full_labour_cost_coverage_claim must be false.");
  if (budget.external_funding?.committed !== false || budget.external_funding?.amount !== null) {
    errors.push("Unawarded external funding must not be represented as committed.");
  }
  const fundingTargets = Array.isArray(budget.external_funding?.candidate_targets) ? budget.external_funding.candidate_targets : [];
  for (const target of ["Long-Term Future Fund", "Emergent Ventures"]) {
    if (!fundingTargets.includes(target)) errors.push(`budget.external_funding.candidate_targets must include ${target}.`);
  }
  if (budget.external_funding?.application_owner !== null) {
    errors.push("The external-funding application owner must remain null until Q-006 is resolved.");
  }
  if (budget.legal_classification !== "not_determined_by_this_plan") {
    errors.push("The plan must not silently determine legal classification.");
  }

  if (allocation.status !== "approved_contribution_units_eligibility_distribution_and_unused_balance_rules") {
    errors.push("budget.allocation.status must reflect the approved contribution rules.");
  }
  if (allocation.rounding_method !== "largest_remainder_to_whole_cents_with_stable_contributor_id_tiebreak") {
    errors.push("The approved largest-remainder cent-rounding rule is missing.");
  }
  if (corePool.amount !== APPROVED_HONORARIA_ENVELOPES.core_rater_completion_pool) {
    errors.push("core_rater_completion_pool.amount must equal 400.");
  }
  if (adjudicationReserve.amount !== APPROVED_HONORARIA_ENVELOPES.adjudication_reserve) {
    errors.push("adjudication_reserve.amount must equal 100.");
  }
  if (allocation.total !== APPROVED_HONORARIA_ENVELOPES.total) errors.push("budget.allocation.total must equal 500.");
  if (corePool.amount + adjudicationReserve.amount !== allocation.total || allocation.total !== budget.ceiling) {
    errors.push("The two honoraria envelopes must sum exactly to the USD 500 ceiling.");
  }
  if (corePool.eligible_role !== "core_rater" || corePool.allocation_method !== "contribution_weighted") {
    errors.push("The USD 400 pool must remain contribution-weighted and restricted to core raters.");
  }
  if (adjudicationReserve.eligible_role !== "dedicated_adjudicator" || adjudicationReserve.allocation_method !== "contribution_weighted") {
    errors.push("The USD 100 reserve must remain contribution-weighted and restricted to dedicated adjudicators.");
  }

  validateUnitDefinition(coreUnits, ["accepted_blind_initial_rating", "accepted_operator_assigned_substantive_rerating"], "core", errors);
  validateUnitDefinition(
    adjudicationUnits,
    ["accepted_adjudication_record_closing_an_operator_assigned_required_case", "accepted_required_final_label_snapshot_signoff"],
    "adjudication",
    errors,
  );
  validateEligibility(coreEligibility, "core", errors);
  validateEligibility(adjudicationEligibility, "adjudication", errors);
  if (coreDistribution.normal_completion_distributable_fraction !== 1) errors.push("Core normal-completion release fraction must equal 1.");
  if (!String(coreDistribution.owner_approved_early_closure_distributable_fraction ?? "").includes("96")) {
    errors.push("Core early-closure release must be scaled by accepted initial ratings divided by 96.");
  }
  if (coreDistribution.zero_eligible_units_rule !== "remain_unspent") errors.push("Core zero-unit funds must remain unspent.");
  if (adjudicationDistribution.normal_completion_distributable_fraction !== 1) {
    errors.push("Adjudication normal-completion release fraction must equal 1.");
  }
  if (!String(adjudicationDistribution.owner_approved_early_closure_distributable_fraction ?? "").includes("obligation")) {
    errors.push("Adjudication early-closure release must be scaled by accepted versus obligated units.");
  }
  if (adjudicationDistribution.zero_eligible_units_rule !== "remain_unspent") {
    errors.push("Adjudication zero-unit funds must remain unspent.");
  }
  if (adjudicationReserve.unused_balance_rule !== "remain_unspent_and_do_not_transfer_to_the_core_rater_pool") {
    errors.push("Unused adjudication funds must remain unspent and non-transferable.");
  }

  if (
    value?.decision_status !==
    "approved_panel_budget_window_distribution_operations_and_attrition_applied_to_pilot_exact_structure_thresholds_participants_payment_and_legal_pending"
  ) {
    errors.push("decision_status must preserve the remaining pilot-readiness dependencies.");
  }
  if (!Array.isArray(value?.controls) || value.controls.length < 11) errors.push("controls must remain explicit.");
  if (!Array.isArray(value?.unresolved_parameters) || value.unresolved_parameters.length < 6) {
    errors.push("unresolved_parameters must remain explicit.");
  }
  const unresolvedText = (value?.unresolved_parameters ?? []).join(" ").toLowerCase();
  for (const required of ["approval", "numerical", "identities", "payment method", "jurisdiction", "readiness-signoff", "external-funding"]) {
    if (!unresolvedText.includes(required)) errors.push(`unresolved_parameters must include ${required}.`);
  }
  if (value?.next_decision?.id !== "Q-006" || value?.next_decision?.status !== "user_decision_required") {
    errors.push("next_decision must remain Q-006 with user_decision_required status.");
  }

  return {
    status: errors.length ? "fail" : "pass",
    plan_id: value?.plan_id ?? null,
    active_programme: programmeScope.active_programme ?? null,
    workload: Object.fromEntries(Object.keys(PILOT_WORKLOAD).map((field) => [field, workload[field] ?? null])),
    panel: {
      core_raters: panel.core_raters ?? null,
      dedicated_adjudicators: panel.dedicated_adjudicators ?? null,
      total_people: panel.total_people ?? null,
    },
    operations_owner: { name: owner.name ?? null, role: owner.role ?? null },
    delivery_window: {
      duration_weeks: delivery.duration_weeks ?? null,
      duration_days: delivery.duration_days ?? null,
      start_rule: startRule.model ?? null,
      calendar_start: delivery.calendar_start ?? null,
      calendar_end: delivery.calendar_end ?? null,
    },
    budget: {
      currency: budget.currency ?? null,
      ceiling: budget.ceiling ?? null,
      model: budget.model ?? null,
      core_rater_completion_pool: corePool.amount ?? null,
      adjudication_reserve: adjudicationReserve.amount ?? null,
    },
    errors,
  };
}

export async function readAndValidatePanelHonorariaPlan(path) {
  return validatePanelHonorariaPlan(JSON.parse(await readFile(path, "utf8")));
}

function validateUnitDefinition(definition, requiredEvents, label, errors) {
  const events = Array.isArray(definition.earning_events) ? definition.earning_events : [];
  for (const requiredEvent of requiredEvents) {
    const event = events.find((candidate) => candidate?.event === requiredEvent);
    if (!event || event.units !== 1) errors.push(`${label} unit definition must award exactly one unit for ${requiredEvent}.`);
  }
  if (!Array.isArray(definition.zero_unit_events) || definition.zero_unit_events.length < 4) {
    errors.push(`${label} unit definition must enumerate zero-unit events.`);
  }
}

function validateEligibility(eligibility, label, errors) {
  if (eligibility.model !== "every_accepted_unit_participates_after_required_qualification") {
    errors.push(`${label} eligibility must allow every accepted unit after qualification.`);
  }
  if (eligibility.minimum_accepted_units !== 1) errors.push(`${label} minimum accepted units must equal 1.`);
  if (eligibility.minimum_assignment_completion_percentage !== null) {
    errors.push(`${label} eligibility must not impose a percentage-completion threshold.`);
  }
  if (!Array.isArray(eligibility.required_conditions) || eligibility.required_conditions.length < 4) {
    errors.push(`${label} eligibility conditions must include qualification, conflict/exposure, calibration, and quality acceptance.`);
  }
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const path = resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/panel-honoraria-plan.json`);
  const report = await readAndValidatePanelHonorariaPlan(path);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
