import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { PILOT_WORKLOAD, validatePanelHonorariaPlan } from "../scripts/verify-panel-honoraria-plan.mjs";

const planPath = resolve(import.meta.dirname, "../ops/next-steps-2026-07-23/panel-honoraria-plan.json");

async function loadPlan() {
  return JSON.parse(await readFile(planPath, "utf8"));
}

test("accepts the pilot panel, workload, operations owner, contribution units, and payout rules", async () => {
  const report = validatePanelHonorariaPlan(await loadPlan());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.active_programme, "metaphilosophy-48-critique-pilot-v1-2026-07-30");
  assert.deepEqual(report.workload, PILOT_WORKLOAD);
  assert.deepEqual(report.panel, { core_raters: 6, dedicated_adjudicators: 2, total_people: 8 });
  assert.deepEqual(report.operations_owner, { name: "Ellen Sun", role: "project_owner" });
  assert.deepEqual(report.delivery_window, {
    duration_weeks: 4,
    duration_days: 28,
    start_rule: "first_monday_at_0000_utc_at_least_72_hours_after_readiness_signoff",
    calendar_start: null,
    calendar_end: null,
  });
  assert.deepEqual(report.budget, {
    currency: "USD",
    ceiling: 500,
    model: "limited_honoraria_for_volunteer_expert_work",
    core_rater_completion_pool: 400,
    adjudication_reserve: 100,
  });
});

test("rejects panel, pilot workload, schedule, owner, or pool-envelope drift", async () => {
  const plan = await loadPlan();
  plan.panel.core_raters = 5;
  plan.minimum_workload.initial_ratings = 800;
  plan.delivery_window.duration_days = 35;
  plan.operations.owner.name = "Someone Else";
  plan.budget.allocation.core_rater_completion_pool.amount = 350;
  plan.budget.allocation.adjudication_reserve.amount = 150;
  const report = validatePanelHonorariaPlan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("panel.core_raters")));
  assert.ok(report.errors.some((error) => error.includes("minimum_workload.initial_ratings")));
  assert.ok(report.errors.some((error) => error.includes("duration_days")));
  assert.ok(report.errors.some((error) => error.includes("Ellen Sun")));
  assert.ok(report.errors.some((error) => error.includes("core_rater_completion_pool.amount")));
  assert.ok(report.errors.some((error) => error.includes("adjudication_reserve.amount")));
});

test("rejects percentage eligibility, reserve transfer, premature dates, or the old 800-rating denominator", async () => {
  const plan = await loadPlan();
  plan.delivery_window.calendar_start = "2026-08-01T00:00:00Z";
  plan.budget.allocation.core_rater_completion_pool.minimum_eligibility_threshold.minimum_assignment_completion_percentage = 80;
  plan.budget.allocation.core_rater_completion_pool.distribution_rule.owner_approved_early_closure_distributable_fraction =
    "accepted_blind_initial_ratings_divided_by_800";
  plan.budget.allocation.adjudication_reserve.unused_balance_rule = "transfer_to_core_pool";
  const report = validatePanelHonorariaPlan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("Calendar dates")));
  assert.ok(report.errors.some((error) => error.includes("percentage-completion")));
  assert.ok(report.errors.some((error) => error.includes("divided by 96")));
  assert.ok(report.errors.some((error) => error.includes("Unused adjudication")));
});

test("rejects unit inflation, retroactive forfeiture, silent legal classification, or resolved Q-006", async () => {
  const plan = await loadPlan();
  plan.budget.allocation.core_rater_completion_pool.contribution_unit_definition.earning_events[0].units = 2;
  plan.operations.assignment_and_attrition.retroactive_forfeiture_of_accepted_units = true;
  plan.budget.legal_classification = "volunteer";
  plan.next_decision.status = "resolved";
  const report = validatePanelHonorariaPlan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("exactly one unit")));
  assert.ok(report.errors.some((error) => error.includes("Retroactive forfeiture")));
  assert.ok(report.errors.some((error) => error.includes("legal classification")));
  assert.ok(report.errors.some((error) => error.includes("Q-006")));
});

test("rejects representing Phase 2 or external funding as active", async () => {
  const plan = await loadPlan();
  plan.programme_scope.full_400_critique_programme_status = "active";
  plan.budget.external_funding.committed = true;
  plan.budget.external_funding.amount = 100000;
  const report = validatePanelHonorariaPlan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("deferred Phase 2")));
  assert.ok(report.errors.some((error) => error.includes("Unawarded external funding")));
});
