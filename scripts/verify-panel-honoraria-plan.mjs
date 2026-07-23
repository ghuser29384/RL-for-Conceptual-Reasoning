import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const APPROVED_PANEL = Object.freeze({ core_raters: 6, dedicated_adjudicators: 2, total_people: 8 });
export const APPROVED_BUDGET = Object.freeze({ currency: "USD", ceiling: 500 });

export function validatePanelHonorariaPlan(value) {
  const errors = [];
  const panel = value?.panel && typeof value.panel === "object" ? value.panel : {};
  const workload = value?.minimum_workload && typeof value.minimum_workload === "object" ? value.minimum_workload : {};
  const budget = value?.budget && typeof value.budget === "object" ? value.budget : {};

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

  if (value?.decision_status !== "approved_structure_and_budget_model_schedule_and_distribution_pending") {
    errors.push("decision_status must preserve that schedule and distribution remain pending.");
  }
  if (!Array.isArray(value?.controls) || value.controls.length < 4) errors.push("controls must remain explicit.");
  if (!Array.isArray(value?.unresolved_parameters) || value.unresolved_parameters.length < 4) {
    errors.push("unresolved_parameters must remain explicit.");
  }
  const unresolvedText = (value?.unresolved_parameters ?? []).join(" ").toLowerCase();
  for (const required of ["delivery window", "allocation rule", "legal review", "external-funding"]) {
    if (!unresolvedText.includes(required)) errors.push(`unresolved_parameters must include ${required}.`);
  }
  if (value?.next_decision?.id !== "Q-003" || value?.next_decision?.status !== "user_decision_required") {
    errors.push("next_decision must remain Q-003 with user_decision_required status.");
  }

  return {
    status: errors.length ? "fail" : "pass",
    plan_id: value?.plan_id ?? null,
    panel: {
      core_raters: panel.core_raters ?? null,
      dedicated_adjudicators: panel.dedicated_adjudicators ?? null,
      total_people: panel.total_people ?? null,
    },
    budget: {
      currency: budget.currency ?? null,
      ceiling: budget.ceiling ?? null,
      model: budget.model ?? null,
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
