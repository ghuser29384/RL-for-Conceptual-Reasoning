import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { validatePanelHonorariaPlan } from "../scripts/verify-panel-honoraria-plan.mjs";

const planPath = resolve(import.meta.dirname, "../ops/next-steps-2026-07-23/panel-honoraria-plan.json");

async function loadPlan() {
  return JSON.parse(await readFile(planPath, "utf8"));
}

test("accepts the owner-approved six-plus-two panel and USD 500 honoraria ceiling", async () => {
  const report = validatePanelHonorariaPlan(await loadPlan());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.deepEqual(report.panel, { core_raters: 6, dedicated_adjudicators: 2, total_people: 8 });
  assert.deepEqual(report.budget, {
    currency: "USD",
    ceiling: 500,
    model: "limited_honoraria_for_volunteer_expert_work",
  });
});

test("rejects quota or budget drift", async () => {
  const plan = await loadPlan();
  plan.panel.core_raters = 5;
  plan.budget.ceiling = 750;
  const report = validatePanelHonorariaPlan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("panel.core_raters")));
  assert.ok(report.errors.some((error) => error.includes("budget.ceiling")));
});

test("rejects a silent payment allocation or legal classification claim", async () => {
  const plan = await loadPlan();
  plan.decision_status = "fully_approved";
  plan.budget.legal_classification = "volunteer";
  plan.next_decision.status = "resolved";
  const report = validatePanelHonorariaPlan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("decision_status")));
  assert.ok(report.errors.some((error) => error.includes("legal classification")));
  assert.ok(report.errors.some((error) => error.includes("Q-003")));
});
