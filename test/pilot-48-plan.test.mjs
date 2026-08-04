import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { PILOT_SCOPE, validatePilot48Plan } from "../scripts/verify-pilot-48-plan.mjs";

const planPath = resolve(import.meta.dirname, "../ops/next-steps-2026-07-23/pilot-48-plan.json");

async function loadPlan() {
  return JSON.parse(await readFile(planPath, "utf8"));
}

test("accepts the pilot-first scope while keeping numerical thresholds non-binding", async () => {
  const report = validatePilot48Plan(await loadPlan());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.deepEqual(report.scope, PILOT_SCOPE);
  assert.equal(report.numeric_thresholds_binding, false);
  assert.equal(report.phase_2_status, "blocked_before_pilot_results_and_capacity");
});

test("rejects pilot workload or assignment arithmetic drift", async () => {
  const plan = await loadPlan();
  plan.scope.critiques = 47;
  plan.assignment_design.critiques_per_core_rater = 15;
  const report = validatePilot48Plan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("scope.critiques")));
  assert.ok(report.errors.some((error) => error.includes("sixteen critiques")));
});

test("rejects silently binding the proposed numerical thresholds", async () => {
  const plan = await loadPlan();
  plan.adjudication_protocol.numeric_threshold_status = "approved";
  plan.adjudication_protocol.trigger_rules = plan.adjudication_protocol.provisional_numeric_trigger_candidates;
  plan.analysis_plan.numeric_scale_readiness_status = "approved";
  const report = validatePilot48Plan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("provisional and non-binding")));
  assert.ok(report.errors.some((error) => error.includes("trigger_rules")));
});

test("rejects uncleared LMCA reuse or automatic Phase 2 activation", async () => {
  const plan = await loadPlan();
  plan.source_policy.eligible_source_classes.push("lmca_expert_rated");
  plan.expansion_gate.status = "active";
  plan.expansion_gate.no_automatic_rollover = false;
  const report = validatePilot48Plan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("source classes")));
  assert.ok(report.errors.some((error) => error.includes("LMCA rows")));
  assert.ok(report.errors.some((error) => error.includes("must remain blocked")));
  assert.ok(report.errors.some((error) => error.includes("no automatic rollover")));
});

test("rejects removal of required blind metadata protections", async () => {
  const plan = await loadPlan();
  plan.candidate_selection.hidden_from_raters = ["source"];
  plan.rating_protocol.revision_policy = "Overwrite the original rating.";
  const report = validatePilot48Plan(plan);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("model identity")));
  assert.ok(report.errors.some((error) => error.includes("preserve original ratings")));
});
