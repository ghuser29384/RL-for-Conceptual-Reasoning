import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { validatePanelHonorariaPlan } from "../scripts/verify-panel-honoraria-plan.mjs";

const planPath = resolve(import.meta.dirname, "../ops/next-steps-2026-07-23/panel-honoraria-plan.json");

async function loadPlan() {
  return JSON.parse(await readFile(planPath, "utf8"));
}

test("accepts the approved panel, four-week window, and USD 400/USD 100 honoraria envelopes", async () => {
  const report = validatePanelHonorariaPlan(await loadPlan());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.deepEqual(report.panel, { core_raters: 6, dedicated_adjudicators: 2, total_people: 8 });
  assert.deepEqual(report.delivery_window, {
    duration_weeks: 4,
    duration_days: 28,
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

test("rejects panel, schedule, or pool-envelope drift", async () => {
  const plan = await loadPlan();
  plan.panel.core_raters = 5;
  plan.delivery_window.duration_days = 35;
  plan.budget.allocation.core_rater_completion_pool.amount = 350;
  plan.budget.allocation.adjudication_reserve.amount = 150;
  const report = validatePanelHonorariaPlan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("panel.core_raters")));
  assert.ok(report.errors.some((error) => error.includes("duration_days")));
  assert.ok(report.errors.some((error) => error.includes("core_rater_completion_pool.amount")));
  assert.ok(report.errors.some((error) => error.includes("adjudication_reserve.amount")));
});

test("rejects silently freezing dates, individual formulas, or legal classification", async () => {
  const plan = await loadPlan();
  plan.delivery_window.calendar_start = "2026-08-01";
  plan.budget.allocation.core_rater_completion_pool.contribution_unit_definition = "one accepted rating equals one unit";
  plan.budget.legal_classification = "volunteer";
  plan.next_decision.status = "resolved";
  const report = validatePanelHonorariaPlan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("Calendar dates")));
  assert.ok(report.errors.some((error) => error.includes("contribution_unit_definition")));
  assert.ok(report.errors.some((error) => error.includes("legal classification")));
  assert.ok(report.errors.some((error) => error.includes("Q-004")));
});
