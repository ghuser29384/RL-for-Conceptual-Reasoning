import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { verifyPilotEndpointImplementation } from "../scripts/verify-pilot-endpoint-implementation.mjs";

const root = resolve(import.meta.dirname, "..");

test("pins the approved D1 and D2 implementation boundaries", async () => {
  const report = await verifyPilotEndpointImplementation(root);
  assert.equal(report.status, "pass");
  assert.equal(report.approved_endpoint_contract_id, "mp-pilot-endpoint-design-amendment-v1");
  assert.equal(report.self_check_records, 24);
  assert.equal(report.interpretation_pairs, 48);
  assert.equal(report.interpretation_initial_codes, 96);
  assert.equal(report.position_first, true);
  assert.equal(report.authorization_false, true);
  assert.ok(report.files_checked >= 10);
});
