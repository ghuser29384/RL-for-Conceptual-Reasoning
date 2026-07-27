import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateHardSetSourceAllocation } from "./verify-hard-set-source-allocation.mjs";
import { validatePanelHonorariaPlan } from "./verify-panel-honoraria-plan.mjs";
import { validatePilot01 } from "./verify-pilot-01.mjs";

const root = resolve(import.meta.dirname, "..");

const [
  contract,
  register,
  allocation,
  panelPlan,
  pilotContract,
  pilotItems,
  expansionGate,
  pilotPage,
  buildScript,
  vercel,
  evDraft,
  ltffDraft,
  calculator,
  pilotCalculator,
  closedPage,
] = await Promise.all([
  readJson("ops/next-steps-2026-07-23/release-contract.json"),
  readJson("ops/next-steps-2026-07-23/decision-register.json"),
  readJson("ops/next-steps-2026-07-23/hard-set-source-allocation.json"),
  readJson("ops/next-steps-2026-07-23/panel-honoraria-plan.json"),
  readJson("ops/pilot-01/pilot-contract.json"),
  readJson("ops/pilot-01/pilot-items-public.json"),
  readJson("ops/pilot-01/full-hard-set-expansion-gate.json"),
  readFile(resolve(root, "pilot-raters/index.html"), "utf8"),
  readFile(resolve(root, "scripts/build-static.mjs"), "utf8"),
  readJson("vercel.json"),
  readFile(resolve(root, "funding/emergent-ventures-pilot-evidence-draft.md"), "utf8"),
  readFile(resolve(root, "funding/ltff-pilot-evidence-draft.md"), "utf8"),
  readFile(resolve(root, "scripts/calculate-honoraria.mjs"), "utf8"),
  readFile(resolve(root, "scripts/calculate-pilot-honoraria.mjs"), "utf8"),
  readFile(resolve(root, "reviewers/closed.html"), "utf8"),
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

assert.ok(register.decisions.length >= 22);
for (const decision of register.decisions) {
  assert.ok(decision.credence >= 0.9 && decision.credence <= 1, `${decision.id} violates the 90% decision threshold`);
}
assert.equal(register.pending_decision.id, "Q-006");
assert.equal(register.pending_decision.status, "external_response_and_evidence_required");
assert.equal(register.decisions.find((decision) => decision.id === "D-006")?.contract_path, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");
for (const decisionId of ["D-007", "D-008", "D-009", "D-010", "D-011", "D-012", "D-013", "D-014", "D-015", "D-016", "D-017"]) {
  assert.equal(register.decisions.find((decision) => decision.id === decisionId)?.contract_path, "ops/next-steps-2026-07-23/panel-honoraria-plan.json");
}
for (const decisionId of ["D-018", "D-019", "D-020", "D-021"]) {
  assert.equal(register.decisions.find((decision) => decision.id === decisionId)?.contract_path, "ops/pilot-01/pilot-contract.json");
}
assert.equal(register.decisions.find((decision) => decision.id === "D-022")?.contract_path, "ops/pilot-01/full-hard-set-expansion-gate.json");

const allocationReport = validateHardSetSourceAllocation(allocation);
assert.equal(allocationReport.status, "pass", allocationReport.errors.join("\n"));
assert.deepEqual(allocationReport.position_quotas, {
  lmca_expert_rated: 50,
  public_synthetic: 20,
  newly_hidden_public_domain: 30,
});

const panelReport = validatePanelHonorariaPlan(panelPlan);
assert.equal(panelReport.status, "pass", panelReport.errors.join("\n"));
assert.deepEqual(panelReport.operations_owner, { name: "Ellen Sun", role: "project_owner" });
assert.equal(panelReport.budget.ceiling, 500);
assert.match(calculator, /remainderOrder/);
assert.match(calculator, /owner_approved_early_closure/);
assert.match(pilotCalculator, /PILOT_REQUIRED_INITIAL_RATINGS = 96/);

const pilotReport = validatePilot01({
  contract: pilotContract,
  items: pilotItems,
  expansionGate,
  pageHtml: pilotPage,
  buildScript,
  vercel,
  fundingDrafts: { emergentVentures: evDraft, ltff: ltffDraft },
});
assert.equal(pilotReport.status, "pass", pilotReport.errors.join("\n"));
assert.deepEqual(
  { positions: pilotReport.positions, critiques: pilotReport.critiques, ratings: pilotReport.required_initial_ratings },
  { positions: 12, critiques: 48, ratings: 96 },
);

assert.match(closedPage, /The July 2026 intake window has closed\./);
assert.match(closedPage, /No deadline or paid assignment is currently being offered/);
assert.doesNotMatch(closedPage, /Submit calibration/);
for (const source of ["/contribute", "/contribute/", "/reviewers", "/reviewers/", "/reviewers/index.html"]) {
  const rewrite = vercel.rewrites.find((candidate) => candidate.source === source);
  assert.equal(rewrite?.destination, "/reviewers/closed.html", `missing closed-intake rewrite for ${source}`);
}

console.log("Metaphilosophy programme contracts verified.");

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
}
