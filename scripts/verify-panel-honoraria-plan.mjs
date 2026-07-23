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

export function validatePanelHonorariaPlan(value) {
  const errors = [];
  const panel = value?.panel && typeof value.panel === "object" ? value.panel : {};
  const workload = value?.minimum_workload && typeof value.minimum_workload === "object" ? value.minimum_workload : {};
  const delivery = value?.delivery_window && typeof value.delivery_window === "object" ? value.delivery_window : {};
  const budget = value?.budget && typeof value.budget === "object" ? value.budget : {};
  const allocation = budget?.allocation && typeof budget.allocation === "object" ? budget.allocation : {};
  const corePool =
    allocation?.core_rater_completion_pool && typeof allocation.core_rater_completion_pool === "object"
      ? allocation.core_rater_completion_pool
      : {};
  const adjudicationReserve =
    allocation?.adjudication_reserve && typeof allocation.adjudication_reserve === "object"
      ? allocation.adjudication_reserve
      : {};

  for (const [field, expected] of Object.entries(APPROVED_PANEL)) {
    if (panel[field] !== expected) errors.push(`panel.${field} must equal ${expected}; found ${String(panel[field])}.`);
  }
  if (panel.core_raters + panel.dedicated_adjudicators !== panel.total_people) {
    errors.push("panel.total_people must equal core_raters + dedicated_adjudicators.");
  }
  if (panel.role_separation !== true) errors.push("panel.role_separation must be true.");

  if (workload.positions !== 100) errors.push("minimum_workload.positions must equal 100.");
  if (workload.critiques !== 400) errors.push("minimum_workload.critiques must equal 400.");
  if (workload.independent_initial_ratings_per_critique !== 2) {
    errors.push("minimum_workload.independent_initial_ratings_per_critique must equal 2.");
  }
  if (workload.initial_ratings !== 800) errors.push("minimum_workload.initial_ratings must equal 800.");
  if (workload.initial_ratings !== workload.critiques * workload.independent_initial_ratings_per_critique) {
    errors.push("minimum_workload.initial_ratings must cover every critique twice.");
  }
  if (workload.nominal_initial_ratings_per_core_rater?.minimum !== 133) {
    errors.push("nominal_initial_ratings_per_core_rater.minimum must equal 133.");
  }
  if (workload.nominal_initial_ratings_per_core_rater?.maximum !== 134) {
    errors.push("nominal_initial_ratings_per_core_rater.maximum must equal 134.");
  }
  if (workload.source_estimate_minutes_per_short_rating?.minimum !== 5) {
    errors.push("source_estimate_minutes_per_short_rating.minimum must equal 5.");
  }
  if (workload.source_estimate_minutes_per_short_rating?.maximum !== 15) {
    errors.push("source_estimate_minutes_per_short_rating.maximum must equal 15.");
  }

  if (delivery.model !== "relative_to_readiness_gate") {
    errors.push("delivery_window.model must equal relative_to_readiness_gate.");
  }
  for (const [field, expected] of Object.entries(APPROVED_DELIVERY_WINDOW)) {
    if (delivery[field] !== expected) errors.push(`delivery_window.${field} must equal ${expected}.`);
  }
  if (delivery.calendar_start !== null || delivery.calendar_end !== null) {
    errors.push("Calendar dates must remain null until the readiness gate passes and an owner approves an absolute start date.");
  }
  if (delivery.start_condition !== "readiness_gate_passed") {
    errors.push("delivery_window.start_condition must equal readiness_gate_passed.");
  }
  if (delivery.end_condition !== "completion_gate_passed") {
    errors.push("delivery_window.end_condition must equal completion_gate_passed.");
  }
  if (!Array.isArray(delivery.readiness_gate) || delivery.readiness_gate.length < 5) {
    errors.push("delivery_window.readiness_gate must contain the five minimum readiness conditions.");
  }
  if (!Array.isArray(delivery.completion_gate) || delivery.completion_gate.length < 4) {
    errors.push("delivery_window.completion_gate must contain the four minimum completion conditions.");
  }
  if (delivery.nominal_pace?.initial_ratings_total_per_week !== 200) {
    errors.push("delivery_window.nominal_pace.initial_ratings_total_per_week must equal 200.");
  }
  if (delivery.nominal_pace?.initial_ratings_per_core_rater_per_week?.minimum !== 33) {
    errors.push("delivery_window.nominal_pace initial per-rater minimum must equal 33.");
  }
  if (delivery.nominal_pace?.initial_ratings_per_core_rater_per_week?.maximum !== 34) {
    errors.push("delivery_window.nominal_pace initial per-rater maximum must equal 34.");
  }
  if (delivery.nominal_pace?.status !== "planning_average_not_honorarium_eligibility_threshold") {
    errors.push("Nominal pace must not be represented as an honorarium eligibility threshold.");
  }
  if (delivery.rolling_adjudication !== true) errors.push("delivery_window.rolling_adjudication must be true.");
  if (delivery.automatic_extension !== false) errors.push("delivery_window.automatic_extension must be false.");
  if (delivery.extension_requires !== "project_owner_approval") {
    errors.push("delivery_window.extension_requires must equal project_owner_approval.");
  }

  if (budget.currency !== APPROVED_BUDGET.currency) errors.push("budget.currency must equal USD.");
  if (budget.ceiling !== APPROVED_BUDGET.ceiling) errors.push("budget.ceiling must equal 500.");
  if (budget.model !== "limited_honoraria_for_volunteer_expert_work") {
    errors.push("budget.model must preserve the owner-approved limited-honoraria model.");
  }
  if (budget.rate_based_compensation !== false) errors.push("budget.rate_based_compensation must be false.");
  if (budget.full_labour_cost_coverage_claim !== false) errors.push("budget.full_labour_cost_coverage_claim must be false.");
  if (budget.external_funding?.committed !== false) errors.push("Unawarded external funding must not be represented as committed.");
  if (budget.external_funding?.amount !== null) errors.push("Unawarded external funding amount must remain null.");
  if (budget.legal_classification !== "not_determined_by_this_plan") {
    errors.push("The plan must not silently determine legal classification.");
  }

  if (allocation.status !== "approved_pool_envelopes_contribution_unit_formula_pending") {
    errors.push("budget.allocation.status must preserve that contribution-unit formulas remain pending.");
  }
  if (corePool.amount !== APPROVED_HONORARIA_ENVELOPES.core_rater_completion_pool) {
    errors.push("core_rater_completion_pool.amount must equal 400.");
  }
  if (adjudicationReserve.amount !== APPROVED_HONORARIA_ENVELOPES.adjudication_reserve) {
    errors.push("adjudication_reserve.amount must equal 100.");
  }
  if (allocation.total !== APPROVED_HONORARIA_ENVELOPES.total) {
    errors.push("budget.allocation.total must equal 500.");
  }
  if (corePool.amount + adjudicationReserve.amount !== allocation.total || allocation.total !== budget.ceiling) {
    errors.push("The two honoraria envelopes must sum exactly to the USD 500 ceiling.");
  }
  if (corePool.eligible_role !== "core_rater" || corePool.allocation_method !== "contribution_weighted") {
    errors.push("The USD 400 pool must remain contribution-weighted and restricted to core raters.");
  }
  if (
    adjudicationReserve.eligible_role !== "dedicated_adjudicator" ||
    adjudicationReserve.allocation_method !== "contribution_weighted"
  ) {
    errors.push("The USD 100 reserve must remain contribution-weighted and restricted to dedicated adjudicators.");
  }
  for (const [label, field] of [
    ["core_rater_completion_pool.contribution_unit_definition", corePool.contribution_unit_definition],
    ["core_rater_completion_pool.minimum_eligibility_threshold", corePool.minimum_eligibility_threshold],
    ["core_rater_completion_pool.payment_timing", corePool.payment_timing],
    ["adjudication_reserve.contribution_unit_definition", adjudicationReserve.contribution_unit_definition],
    ["adjudication_reserve.minimum_eligibility_threshold", adjudicationReserve.minimum_eligibility_threshold],
    ["adjudication_reserve.unused_balance_rule", adjudicationReserve.unused_balance_rule],
    ["adjudication_reserve.payment_timing", adjudicationReserve.payment_timing],
  ]) {
    if (field !== null) errors.push(`${label} must remain null until the owner approves the individual allocation rules.`);
  }

  if (value?.decision_status !== "approved_structure_budget_window_and_pool_envelopes_contribution_formula_pending") {
    errors.push("decision_status must preserve that individual contribution formulas remain pending.");
  }
  if (!Array.isArray(value?.controls) || value.controls.length < 7) errors.push("controls must remain explicit.");
  if (!Array.isArray(value?.unresolved_parameters) || value.unresolved_parameters.length < 6) {
    errors.push("unresolved_parameters must remain explicit.");
  }
  const unresolvedText = (value?.unresolved_parameters ?? []).join(" ").toLowerCase();
  for (const required of [
    "contribution-unit",
    "eligibility",
    "unused",
    "operations owner",
    "replacement",
    "legal review",
    "external-funding",
  ]) {
    if (!unresolvedText.includes(required)) errors.push(`unresolved_parameters must include ${required}.`);
  }
  if (value?.next_decision?.id !== "Q-004" || value?.next_decision?.status !== "user_decision_required") {
    errors.push("next_decision must remain Q-004 with user_decision_required status.");
  }

  return {
    status: errors.length ? "fail" : "pass",
    plan_id: value?.plan_id ?? null,
    panel: {
      core_raters: panel.core_raters ?? null,
      dedicated_adjudicators: panel.dedicated_adjudicators ?? null,
      total_people: panel.total_people ?? null,
    },
    delivery_window: {
      duration_weeks: delivery.duration_weeks ?? null,
      duration_days: delivery.duration_days ?? null,
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

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const path = resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/panel-honoraria-plan.json`);
  const report = await readAndValidatePanelHonorariaPlan(path);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
