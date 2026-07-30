import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateHardSetSourceAllocation } from "../scripts/verify-hard-set-source-allocation.mjs";

const root = resolve(import.meta.dirname, "..");
const allocationPath = resolve(root, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");
const allocation = JSON.parse(await readFile(allocationPath, "utf8"));

test("approved 50/20/30 allocation passes as deferred Phase 2", () => {
  const report = validateHardSetSourceAllocation(allocation);
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.deepEqual(report.position_quotas, {
    lmca_expert_rated: 50,
    public_synthetic: 20,
    newly_hidden_public_domain: 30,
  });
  assert.equal(report.positions, 100);
  assert.equal(report.critiques, 400);
  assert.equal(report.execution_phase, "deferred_phase_2");
  assert.equal(report.activation_status, "blocked");
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

test("cannot silently activate item acquisition, bulk rating, or automatic rollover", () => {
  const changed = structuredClone(allocation);
  changed.execution_phase = "active";
  changed.current_operational_commitment.item_acquisition_active = true;
  changed.current_operational_commitment.bulk_rating_active = true;
  changed.phase_2_activation_gate.status = "passed";
  changed.phase_2_activation_gate.no_automatic_rollover = false;
  const report = validateHardSetSourceAllocation(changed);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("deferred_phase_2")));
  assert.ok(report.errors.some((error) => error.includes("item_acquisition_active")));
  assert.ok(report.errors.some((error) => error.includes("bulk_rating_active")));
  assert.ok(report.errors.some((error) => error.includes("must equal blocked")));
  assert.ok(report.errors.some((error) => error.includes("no automatic rollover")));
});

test("every component promotion remains gated on explicit Phase 2 activation", () => {
  const changed = structuredClone(allocation);
  changed.components[0].promotion_gates = changed.components[0].promotion_gates.filter(
    (gate) => !gate.includes("Phase 2 activation"),
  );
  const report = validateHardSetSourceAllocation(changed);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("require Phase 2 activation first")));
});
