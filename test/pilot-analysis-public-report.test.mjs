import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  analyzeControlledPilotRatingSnapshots,
  analyzePublicPilotRatingSnapshots,
  assertPublicPilotAnalysisSnapshots,
  deriveLatestAcceptedAnalysisDataset,
} from "../scripts/pilot-analysis-public-report.mjs";

const root = resolve(import.meta.dirname, "..");
const fixturePath = resolve(root, "test/fixtures/pilot-rating-analysis-synthetic.json");
const policyPath = resolve(root, "ops/next-steps-2026-07-23/pilot-analysis-policy-template.json");

async function loadFixture() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}

async function loadPolicy() {
  return JSON.parse(await readFile(policyPath, "utf8"));
}

test("public snapshot reports omit dataset, item, rating, and pseudonymous rater identifiers", async () => {
  const report = analyzePublicPilotRatingSnapshots(await loadFixture(), { policy: await loadPolicy() });
  assert.equal(report.report_view, "public_sanitized");
  assert.equal(report.diagnostic_only, true);
  assert.equal(report.phase_2_authorized, false);
  assert.equal(report.initial.report_view, "public_sanitized");
  assert.equal(report.latest_accepted.report_view, "public_sanitized");
  assert.equal(report.initial.position_results[0].position_block, "position_01");
  assert.equal(report.initial.route_summary.item_level_records_withheld, true);
  assert.equal(assertPublicPilotAnalysisSnapshots(report), true);

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
    assert.equal(serialized.includes(forbiddenKey), false, `public report leaked ${forbiddenKey}`);
  }
});

test("controlled reports retain identifiers only when explicitly requested", async () => {
  const report = analyzeControlledPilotRatingSnapshots(await loadFixture(), { policy: await loadPolicy() });
  assert.equal(report.report_view, "controlled");
  assert.ok(report.initial.validation.dataset_id);
  assert.ok(report.initial.position_results[0].position_id);
  assert.equal(report.initial.position_results[0].rater_ids.length, 2);
  assert.ok(report.initial.route_results.some((row) => row.critique_id));
});

test("initial and latest-accepted snapshots remain separate after an append-only rerating", async () => {
  const dataset = await loadFixture();
  const initial = dataset.ratings[0];
  dataset.ratings.push({
    ...structuredClone(initial),
    rating_id: `${initial.rating_id}-revision`,
    stage: "rerating",
    version: 2,
    predecessor_rating_id: initial.rating_id,
    scores: { ...initial.scores, overall: 0.55, strength: 0.55 },
    locked_at: "2026-08-10T00:00:00.000Z",
    operator_assigned: true,
    object_level_revision_reason: "A previously overlooked interpretation materially weakened the critique.",
  });

  const report = analyzePublicPilotRatingSnapshots(dataset, { policy: await loadPolicy() });
  assert.equal(report.revision_summary.accepted_rerating_records, 1);
  assert.equal(report.revision_summary.revised_rater_critique_chains, 1);
  assert.equal(report.revision_summary.original_ratings_preserved, true);
  assert.equal(report.initial.snapshot, "accepted_initial_ratings");
  assert.equal(report.latest_accepted.snapshot, "latest_accepted_ratings");
  assert.notEqual(
    report.initial.aggregate.mean_position_weighted_ordering_agreement,
    report.latest_accepted.aggregate.mean_position_weighted_ordering_agreement,
  );

  const derived = deriveLatestAcceptedAnalysisDataset(dataset);
  assert.equal(derived.ratings.length, 8);
  assert.ok(derived.ratings.every((rating) => rating.stage === "initial" && rating.version === 1));
  assert.equal(dataset.ratings.find((rating) => rating.rating_id === initial.rating_id).scores.overall, 0.9);
});

test("public analysis rejects malformed or prematurely operative policy before reading results", async () => {
  const dataset = await loadFixture();
  assert.throws(
    () =>
      analyzePublicPilotRatingSnapshots(dataset, {
        policy: {
          approved_routes: ["overall_gap"],
          numeric_thresholds: { overall_gap: -0.3 },
        },
      }),
    /Pilot analysis policy is invalid/,
  );

  assert.throws(
    () =>
      analyzePublicPilotRatingSnapshots(dataset, {
        policy: {
          status: "diagnostic_only_no_routes_approved",
          approved_routes: ["low_clarity"],
          low_clarity_below: 0.5,
        },
      }),
    /Diagnostic-only policy cannot approve operative routes/,
  );
});
