import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateHardSetSourceAllocation } from "../scripts/verify-hard-set-source-allocation.mjs";

const root = resolve(import.meta.dirname, "..");
const allocationPath = resolve(root, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");
const allocation = JSON.parse(await readFile(allocationPath, "utf8"));

test("approved 50/20/30 allocation passes", () => {
  const report = validateHardSetSourceAllocation(allocation);
  assert.equal(report.status, "pass");
  assert.deepEqual(report.position_quotas, {
    lmca_expert_rated: 50,
    public_synthetic: 20,
    newly_hidden_public_domain: 30,
  });
  assert.equal(report.positions, 100);
  assert.equal(report.critiques, 400);
});

test("quota drift fails", () => {
  const changed = structuredClone(allocation);
  changed.components.find((component) => component.source_class === "lmca_expert_rated").positions = 49;
  const report = validateHardSetSourceAllocation(changed);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("approved quota 50")));
});

test("public manifest cannot expose protected item ids", () => {
  const changed = structuredClone(allocation);
  changed.components.find((component) => component.source_class === "newly_hidden_public_domain").source_artifact.position_ids = ["hidden"];
  const report = validateHardSetSourceAllocation(changed);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("forbidden public fields")));
});
