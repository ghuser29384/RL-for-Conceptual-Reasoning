import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  analyzePublicPilotRatingSnapshots,
  assertPublicPilotAnalysisSnapshots,
} from "./pilot-analysis-public-report.mjs";
import { validatePilotAnalysisPolicy } from "./pilot-analysis-policy.mjs";

const root = resolve(import.meta.dirname, "..");
const fixturePath = resolve(root, "test/fixtures/pilot-rating-analysis-synthetic.json");
const policyPath = resolve(root, "ops/next-steps-2026-07-23/pilot-analysis-policy-template.json");

const [dataset, policy] = await Promise.all([
  readJson(fixturePath),
  readJson(policyPath),
]);

const policyReport = validatePilotAnalysisPolicy(policy);
assert.equal(policyReport.status, "pass", policyReport.errors.join("\n"));
assert.equal(policyReport.normalized_policy.operational_authorization, false);
assert.deepEqual(policyReport.normalized_policy.approved_routes, []);

const report = analyzePublicPilotRatingSnapshots(dataset, { policy });
assert.equal(assertPublicPilotAnalysisSnapshots(report), true);
assert.equal(report.report_view, "public_sanitized");
assert.equal(report.initial.snapshot, "accepted_initial_ratings");
assert.equal(report.latest_accepted.snapshot, "latest_accepted_ratings");
assert.equal(report.initial.aggregate.critiques_with_operative_routes, 0);
assert.equal(report.latest_accepted.aggregate.critiques_with_operative_routes, 0);
assert.equal(report.phase_2_authorized, false);
assert.equal(report.diagnostic_only, true);

const serialized = JSON.stringify(report);
for (const forbiddenKey of [
  '"dataset_id":',
  '"position_id":',
  '"critique_id":',
  '"rating_id":',
  '"rater_id":',
  '"rater_ids":',
  '"route_results":',
]) {
  assert.equal(serialized.includes(forbiddenKey), false, `public analysis leaked ${forbiddenKey}`);
}

for (const malformedPolicy of [
  {
    approved_routes: ["unknown_route"],
  },
  {
    approved_routes: ["overall_gap"],
    numeric_thresholds: { overall_gap: -0.3 },
  },
  {
    status: "diagnostic_only_no_routes_approved",
    approved_routes: ["low_clarity"],
    low_clarity_below: 0.5,
  },
]) {
  const malformed = validatePilotAnalysisPolicy(malformedPolicy);
  assert.equal(malformed.status, "fail");
}

console.log("Metaphilosophy public pilot analysis verified.");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
