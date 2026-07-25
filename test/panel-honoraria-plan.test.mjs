import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { validatePanelHonorariaPlan } from "../scripts/verify-panel-honoraria-plan.mjs";

const planPath = resolve(import.meta.dirname, "../ops/next-steps-2026-07-23/panel-honoraria-plan.json");

async function loadPlan() {
  return JSON.parse(await readFile(planPath, "utf8"));
}

test("accepts the approved panel, operations owner, contribution units, and payout rules", async () => {
  const report = validatePanelHonorariaPlan(await loadPlan());
  assert.equal(report.status, "pass", report.errors.join("\n"));
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

test("rejects panel, schedule, owner, or pool-envelope drift", async () => {
  const plan = await loadPlan();
  plan.panel.core_raters = 5;
  plan.delivery_window.duration_days = 35;
  plan.operations.owner.name = "Someone Else";
  plan.budget.allocation.core_rater_completion_pool.amount = 350;
  plan.budget.allocation.adjudication_reserve.amount = 150;
  const report = validatePanelHonorariaPlan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("panel.core_raters")));
  assert.ok(report.errors.some((error) => error.includes("duration_days")));
  assert.ok(report.errors.some((error) => error.includes("Ellen Sun")));
  assert.ok(report.errors.some((error) => error.includes("core_rater_completion_pool.amount")));
  assert.ok(report.errors.some((error) => error.includes("adjudication_reserve.amount")));
});

test("rejects percentage eligibility, reserve transfer, or premature dates", async () => {
  const plan = await loadPlan();
  plan.delivery_window.calendar_start = "2026-08-01T00:00:00Z";
  plan.budget.allocation.core_rater_completion_pool.minimum_eligibility_threshold.minimum_assignment_completion_percentage = 80;
  plan.budget.allocation.adjudication_reserve.unused_balance_rule = "transfer_to_core_pool";
  const report = validatePanelHonorariaPlan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("Calendar dates")));
  assert.ok(report.errors.some((error) => error.includes("percentage-completion")));
  assert.ok(report.errors.some((error) => error.includes("Unused adjudication")));
});

test("rejects unit inflation, retroactive forfeiture, and silent legal classification", async () => {
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
  assert.ok(report.errors.some((error) => error.includes("Q-005")));
});
