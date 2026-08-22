import assert from "node:assert/strict";
import test from "node:test";

import {
  loadProtocol,
  readAndValidateBlueDotTimingPriceProtocol,
  root,
  validateBlueDotTimingPriceProtocol,
} from "./bluedot-timing-price-test-context.mjs";

test("accepts owner decision B while leaving the grant amount and allocations unset", async () => {
  const report = await readAndValidateBlueDotTimingPriceProtocol(root);
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.owner_decision, "B");
  assert.equal(report.bluedot_request_amount_usd, null);
  assert.equal(report.individual_role_allocations_usd, null);
  assert.equal(
    report.endpoint_implementation_head,
    "6a579c957b22719d52dc7c681a4107f517bb70eb",
  );
  assert.equal(report.required_stages, 9);
});

test("rejects choosing a BlueDot amount or individual allocation before evidence", async () => {
  const protocol = await loadProtocol();
  protocol.contract.owner_decision.bluedot_request_amount_usd = 500;
  protocol.contract.owner_decision.individual_role_allocations_usd = {
    rater: 200,
    cause_coder: 50,
  };
  const report = validateBlueDotTimingPriceProtocol(protocol);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("request amount must remain unset")));
  assert.ok(report.errors.some((error) => error.includes("individual allocations must remain unset")));
});

test("rejects converting the existing USD 500 pilot ceiling into the grant request", async () => {
  const protocol = await loadProtocol();
  protocol.contract.dependencies.equates_current_pilot_ceiling_with_bluedot_request = true;
  protocol.contract.dependencies.amends_current_pilot_honoraria_plan = true;
  const report = validateBlueDotTimingPriceProtocol(protocol);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("must not become the BlueDot request")));
  assert.ok(report.errors.some((error) => error.includes("must not amend")));
});
