import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBlueDotTimingPriceReadback,
  createSyntheticBlueDotTimingPriceEvidence,
  loadProtocol,
  validateBlueDotTimingPriceEvidence,
} from "./bluedot-timing-price-test-context.mjs";

test("routes complete controlled usable evidence to an owner pricing decision, never an automatic amount", async () => {
  const { contract } = await loadProtocol();
  const evidence = createSyntheticBlueDotTimingPriceEvidence({ controlled: true });
  const result = buildBlueDotTimingPriceReadback(contract, evidence);
  assert.equal(result.status, "pass", result.errors.join("\n"));
  assert.equal(
    result.readiness_state,
    "evidence_ready_for_owner_pricing_decision",
  );
  assert.equal(
    result.public_readback.price_evidence_boundary.automatic_amount_selection,
    false,
  );
  assert.equal(
    result.public_readback.price_evidence_boundary.owner_decision_required,
    true,
  );
  assert.equal(
    result.public_readback.authorization.grant_submission_authorized,
    false,
  );
});

test("routes a post-task fixed-honorarium decline to redesign rather than pricing", async () => {
  const { contract } = await loadProtocol();
  const evidence = createSyntheticBlueDotTimingPriceEvidence({ controlled: true });
  Object.assign(evidence.price_records[0], {
    response_status: "declines_fixed_honorarium_model",
    minimum_acceptable_fixed_honorarium_usd: null,
    preferred_fixed_honorarium_usd: null,
  });
  const result = buildBlueDotTimingPriceReadback(contract, evidence);
  assert.equal(result.status, "pass", result.errors.join("\n"));
  assert.equal(
    result.readiness_state,
    "evidence_ready_for_owner_redesign_decision",
  );
});

test("an unresolved serious defect blocks pricing despite otherwise complete records", async () => {
  const { contract } = await loadProtocol();
  const evidence = createSyntheticBlueDotTimingPriceEvidence({ controlled: true });
  evidence.defects.push({
    defect_id: "DEFECT_P1_001",
    severity: "P1",
    resolved: false,
  });
  const result = buildBlueDotTimingPriceReadback(contract, evidence);
  assert.equal(result.status, "pass", result.errors.join("\n"));
  assert.equal(
    result.readiness_state,
    "blocked_by_unresolved_serious_defect",
  );
  assert.equal(
    result.public_readback.counts.unresolved_p0_or_p1_defects,
    1,
  );
});

test("controlled evidence fails without separate current approvals", async () => {
  const { contract } = await loadProtocol();
  const evidence = createSyntheticBlueDotTimingPriceEvidence({ controlled: true });
  evidence.authorization.owner_authorization_recorded = false;
  evidence.authorization.approval_record_ids = [];
  const validation = validateBlueDotTimingPriceEvidence(contract, evidence);
  assert.equal(validation.status, "fail");
  assert.ok(
    validation.errors.some((error) => error.includes("owner_authorization_recorded")),
  );
  assert.ok(
    validation.errors.some((error) => error.includes("versioned approvals")),
  );
});

test("evidence can never authorize research, payment, grant submission, deployment, or data mutation", async () => {
  const { contract } = await loadProtocol();
  for (const key of [
    "research_ratings_authorized",
    "research_start_authorized",
    "payment_authorized",
    "grant_submission_authorized",
    "deployment_authorized",
    "production_or_staging_mutation_authorized",
  ]) {
    const evidence = createSyntheticBlueDotTimingPriceEvidence();
    evidence[key] = true;
    const validation = validateBlueDotTimingPriceEvidence(contract, evidence);
    assert.equal(validation.status, "fail", `did not reject ${key}`);
    assert.ok(validation.errors.some((error) => error.includes(key)));
  }
});
