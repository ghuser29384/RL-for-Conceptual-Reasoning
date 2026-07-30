import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateHardSetSourceAllocation } from "./verify-hard-set-source-allocation.mjs";
import { validatePanelHonorariaPlan } from "./verify-panel-honoraria-plan.mjs";
import { validatePilot48Plan } from "./verify-pilot-48-plan.mjs";

const root = resolve(import.meta.dirname, "..");
const contractPath = resolve(root, "ops/next-steps-2026-07-23/release-contract.json");
const decisionsPath = resolve(root, "ops/next-steps-2026-07-23/decision-register.json");
const pilotPath = resolve(root, "ops/next-steps-2026-07-23/pilot-48-plan.json");
const allocationPath = resolve(root, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");
const panelPlanPath = resolve(root, "ops/next-steps-2026-07-23/panel-honoraria-plan.json");
const calculatorPath = resolve(root, "scripts/calculate-honoraria.mjs");
const closedPagePath = resolve(root, "reviewers/closed.html");
const vercelPath = resolve(root, "vercel.json");

const [contract, register, pilot, allocation, panelPlan, calculator, closedPage, vercel] = await Promise.all([
  readJson(contractPath),
  readJson(decisionsPath),
  readJson(pilotPath),
  readJson(allocationPath),
  readJson(panelPlanPath),
  readFile(calculatorPath, "utf8"),
  readFile(closedPagePath, "utf8"),
  readJson(vercelPath),
]);

assert.equal(contract.contract_version, 1);
assert.equal(contract.artifact_classes.synthetic_unrated.release_id, "synthetic-1000-v1");
assert.equal(contract.artifact_classes.synthetic_unrated.expected.records, 1000);
assert.equal(contract.artifact_classes.synthetic_unrated.expected.positions, 250);
assert.equal(contract.artifact_classes.synthetic_unrated.expected.critiques, 1000);
assert.equal(contract.artifact_classes.synthetic_unrated.expected.critiques_per_position, 4);
assert.equal(contract.artifact_classes.synthetic_unrated.expected.domains, 25);
assert.match(contract.artifact_classes.synthetic_unrated.expected.source_sha256, /^[a-f0-9]{64}$/);

for (const [name, file] of Object.entries(contract.artifact_classes.synthetic_unrated.expected.files)) {
  assert.ok(name.endsWith(".json"));
  assert.ok(Number.isInteger(file.bytes) && file.bytes > 0);
  assert.match(file.sha256, /^[a-f0-9]{64}$/);
}

assert.ok(register.decisions.length > 0);
for (const decision of register.decisions) {
  assert.ok(decision.credence >= 0.9 && decision.credence <= 1, `${decision.id} violates the 90% decision threshold`);
}
assert.equal(register.pending_decision.status, "user_decision_required");
assert.equal(register.pending_decision.id, "Q-006");
assert.equal(register.decisions.find((decision) => decision.id === "D-006")?.contract_path, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");
for (const decisionId of ["D-007", "D-008", "D-009", "D-010", "D-011", "D-012", "D-013", "D-014", "D-015", "D-016", "D-017", "D-025"]) {
  assert.equal(
    register.decisions.find((decision) => decision.id === decisionId)?.contract_path,
    "ops/next-steps-2026-07-23/panel-honoraria-plan.json",
  );
}
for (const decisionId of ["D-018", "D-019", "D-020", "D-021", "D-022", "D-023", "D-024"]) {
  assert.equal(
    register.decisions.find((decision) => decision.id === decisionId)?.contract_path,
    "ops/next-steps-2026-07-23/pilot-48-plan.json",
  );
}
assert.equal(register.decisions.find((decision) => decision.id === "D-026")?.contract_path, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");

const pilotReport = validatePilot48Plan(pilot);
assert.equal(pilotReport.status, "pass", pilotReport.errors.join("\n"));
assert.deepEqual(pilotReport.scope, {
  positions: 12,
  critiques_per_position: 4,
  critiques: 48,
  independent_initial_ratings_per_critique: 2,
  initial_ratings: 96,
  core_raters: 6,
  dedicated_adjudicators: 2,
  nominal_positions_per_core_rater: 4,
  nominal_initial_ratings_per_core_rater: 16,
  duration_days: 28,
});
assert.equal(pilotReport.numeric_thresholds_binding, false);
assert.equal(pilotReport.phase_2_status, "blocked_before_pilot_results_and_capacity");

const allocationReport = validateHardSetSourceAllocation(allocation);
assert.equal(allocationReport.status, "pass", allocationReport.errors.join("\n"));
assert.equal(allocationReport.execution_phase, "deferred_phase_2");
assert.equal(allocationReport.activation_status, "blocked");
assert.deepEqual(allocationReport.position_quotas, {
  lmca_expert_rated: 50,
  public_synthetic: 20,
  newly_hidden_public_domain: 30,
});

const panelReport = validatePanelHonorariaPlan(panelPlan);
assert.equal(panelReport.status, "pass", panelReport.errors.join("\n"));
assert.equal(panelReport.active_programme, "metaphilosophy-48-critique-pilot-v1-2026-07-30");
assert.deepEqual(panelReport.workload, {
  positions: 12,
  critiques_per_position: 4,
  critiques: 48,
  independent_initial_ratings_per_critique: 2,
  initial_ratings: 96,
  nominal_positions_per_core_rater: 4,
  nominal_initial_ratings_per_core_rater: 16,
});
assert.deepEqual(panelReport.panel, { core_raters: 6, dedicated_adjudicators: 2, total_people: 8 });
assert.deepEqual(panelReport.operations_owner, { name: "Ellen Sun", role: "project_owner" });
assert.deepEqual(panelReport.delivery_window, {
  duration_weeks: 4,
  duration_days: 28,
  start_rule: "first_monday_at_0000_utc_at_least_72_hours_after_readiness_signoff",
  calendar_start: null,
  calendar_end: null,
});
assert.deepEqual(panelReport.budget, {
  currency: "USD",
  ceiling: 500,
  model: "limited_honoraria_for_volunteer_expert_work",
  core_rater_completion_pool: 400,
  adjudication_reserve: 100,
});
assert.match(calculator, /REQUIRED_INITIAL_RATINGS = 96/);
assert.match(calculator, /pilot-honoraria-ledger-v1/);
assert.match(calculator, /owner_approved_early_closure/);
assert.doesNotMatch(calculator, /REQUIRED_INITIAL_RATINGS = 800/);

assert.match(closedPage, /The July 2026 intake window has closed\./);
assert.match(closedPage, /No deadline or paid assignment is currently being offered/);
assert.doesNotMatch(closedPage, /Submit calibration/);

const expectedClosedSources = ["/contribute", "/contribute/", "/reviewers", "/reviewers/", "/reviewers/index.html"];
for (const source of expectedClosedSources) {
  const rewrite = vercel.rewrites.find((candidate) => candidate.source === source);
  assert.equal(rewrite?.destination, "/reviewers/closed.html", `missing closed-intake rewrite for ${source}`);
}

console.log("Metaphilosophy pilot-first programme contracts verified.");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
