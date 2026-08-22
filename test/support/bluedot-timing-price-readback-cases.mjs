import assert from "node:assert/strict";
import test from "node:test";

import {
  allKeys,
  buildBlueDotTimingPriceReadback,
  createSyntheticBlueDotTimingPriceEvidence,
  loadProtocol,
  validateBlueDotTimingPriceEvidence,
} from "./bluedot-timing-price-test-context.mjs";

test("accepts the complete T0 fixture only as synthetic instrumentation evidence", async () => {
  const { contract } = await loadProtocol();
  const evidence = createSyntheticBlueDotTimingPriceEvidence();
  const validation = validateBlueDotTimingPriceEvidence(contract, evidence);
  assert.equal(validation.status, "pass", validation.errors.join("\n"));
  assert.equal(validation.people.rows.length, 4);
  assert.equal(validation.work.rows.length, 72);

  const result = buildBlueDotTimingPriceReadback(contract, evidence);
  assert.equal(result.status, "pass");
  assert.equal(
    result.readiness_state,
    "synthetic_instrumentation_ready_not_price_evidence",
  );
  assert.equal(result.public_readback.claim_boundary.expert_usability_validation, false);
  assert.equal(
    result.public_readback.claim_boundary.metaphilosophy_research_ratings_created,
    false,
  );
});

test("public readback suppresses person-level timing and all price amounts", async () => {
  const { contract } = await loadProtocol();
  const result = buildBlueDotTimingPriceReadback(
    contract,
    createSyntheticBlueDotTimingPriceEvidence(),
  );
  const keys = new Set(allKeys(result.public_readback));
  for (const forbidden of [
    "evidence_person_id",
    "people",
    "work_units",
    "price_records",
    "started_at",
    "completed_at",
    "minimum_acceptable_fixed_honorarium_usd",
    "preferred_fixed_honorarium_usd",
    "maximum_acceptable_workload_hours",
  ]) {
    assert.equal(keys.has(forbidden), false, `public leak: ${forbidden}`);
  }
  assert.equal(
    result.public_readback.price_evidence_boundary.bluedot_request_amount_usd,
    null,
  );
  assert.equal(
    result.public_readback.price_evidence_boundary.individual_role_allocations_usd,
    null,
  );
  assert.ok(
    result.public_readback.timing_summaries.some(
      (row) => row.suppressed_small_cell === true,
    ),
  );
});

test("fails closed when a required timing record is missing", async () => {
  const { contract } = await loadProtocol();
  const evidence = createSyntheticBlueDotTimingPriceEvidence();
  evidence.work_units.pop();
  const result = buildBlueDotTimingPriceReadback(contract, evidence);
  assert.equal(result.status, "fail");
  assert.equal(result.readiness_state, "not_ready_to_price");
  assert.ok(result.errors.some((error) => error.includes("72 timing records")));
});

test("rejects collapsing the rater and cause-coder roles", async () => {
  const { contract } = await loadProtocol();
  const evidence = createSyntheticBlueDotTimingPriceEvidence();
  evidence.people[2].role = "rater";
  const validation = validateBlueDotTimingPriceEvidence(contract, evidence);
  assert.equal(validation.status, "fail");
  assert.ok(validation.errors.some((error) => error.includes("exactly two rater")));
  assert.ok(validation.errors.some((error) => error.includes("exactly two cause_coder")));
});
