import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateHardSetSourceAllocation } from "./verify-hard-set-source-allocation.mjs";
import { validatePanelHonorariaPlan } from "./verify-panel-honoraria-plan.mjs";

const root = resolve(import.meta.dirname, "..");
const contractPath = resolve(root, "ops/next-steps-2026-07-23/release-contract.json");
const decisionsPath = resolve(root, "ops/next-steps-2026-07-23/decision-register.json");
const allocationPath = resolve(root, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");
const panelPlanPath = resolve(root, "ops/next-steps-2026-07-23/panel-honoraria-plan.json");
const calculatorPath = resolve(root, "scripts/calculate-honoraria.mjs");
const closedPagePath = resolve(root, "reviewers/closed.html");
const vercelPath = resolve(root, "vercel.json");

const [contract, register, allocation, panelPlan, calculator, closedPage, vercel] = await Promise.all([
  readJson(contractPath),
  readJson(decisionsPath),
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
assert.equal(register.pending_decision.id, "Q-005");
assert.equal(register.decisions.find((decision) => decision.id === "D-006")?.contract_path, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");
for (const decisionId of ["D-007", "D-008", "D-009", "D-010", "D-011", "D-012", "D-013", "D-014", "D-015", "D-016", "D-017"]) {
  assert.equal(
    register.decisions.find((decision) => decision.id === decisionId)?.contract_path,
    "ops/next-steps-2026-07-23/panel-honoraria-plan.json",
  );
}

const allocationReport = validateHardSetSourceAllocation(allocation);
assert.equal(allocationReport.status, "pass", allocationReport.errors.join("\n"));
assert.deepEqual(allocationReport.position_quotas, {
  lmca_expert_rated: 50,
  public_synthetic: 20,
  newly_hidden_public_domain: 30,
});

const panelReport = validatePanelHonorariaPlan(panelPlan);
assert.equal(panelReport.status, "pass", panelReport.errors.join("\n"));
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
assert.match(calculator, /remainderOrder/);
assert.match(calculator, /owner_approved_early_closure/);

assert.match(closedPage, /Research rating applications are closed\./);
assert.match(closedPage, /There is no assignment to claim\./);
assert.match(closedPage, /The first Metaphilosophy study has not begun\./);
assert.doesNotMatch(closedPage, /Submit calibration/);

const expectedClosedSources = ["/contribute", "/contribute/", "/reviewers", "/reviewers/", "/reviewers/index.html"];
for (const source of expectedClosedSources) {
  const rewrite = vercel.rewrites.find((candidate) => candidate.source === source);
  assert.equal(rewrite?.destination, "/reviewers/closed.html", `missing closed-intake rewrite for ${source}`);
}

console.log("Metaphilosophy programme contracts verified.");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
