import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const contractPath = resolve(root, "ops/next-steps-2026-07-23/release-contract.json");
const decisionsPath = resolve(root, "ops/next-steps-2026-07-23/decision-register.json");
const closedPagePath = resolve(root, "reviewers/closed.html");
const vercelPath = resolve(root, "vercel.json");

const [contract, register, closedPage, vercel] = await Promise.all([
  readJson(contractPath),
  readJson(decisionsPath),
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

assert.match(closedPage, /The July 2026 intake window has closed\./);
assert.match(closedPage, /No deadline or paid assignment is currently being offered/);
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
