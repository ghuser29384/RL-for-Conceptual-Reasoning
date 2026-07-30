import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzePilotRatingDataset,
  evaluateAdjudicationRoutes,
  krippendorffAlphaInterval,
  lmcaCustomWeightedLoss,
  lmcaWeightedPairwiseRankingError,
  meanAbsoluteDifferences,
  selectRatingSnapshot,
  symmetricWeightedOrderingAgreement,
  validatePilotRatingDataset,
} from "../scripts/pilot-rating-analysis.mjs";

const SLOT_PAIRS = [
  ["R1", "R3"],
  ["R2", "R4"],
  ["R1", "R4"],
  ["R2", "R3"],
  ["R3", "R6"],
  ["R1", "R5"],
  ["R4", "R5"],
  ["R1", "R6"],
  ["R2", "R5"],
  ["R4", "R6"],
  ["R2", "R6"],
  ["R3", "R5"],
];

function makeCompleteDataset() {
  const positions = [];
  const ratings = [];
  const baseOverall = [0.1, 0.35, 0.65, 0.9];
  for (let positionIndex = 0; positionIndex < 12; positionIndex += 1) {
    const positionId = `P${String(positionIndex + 1).padStart(2, "0")}`;
    const critiqueIds = Array.from({ length: 4 }, (_, index) => `${positionId}-C${index + 1}`);
    positions.push({ position_id: positionId, critique_ids: critiqueIds });
    for (let critiqueIndex = 0; critiqueIndex < critiqueIds.length; critiqueIndex += 1) {
      for (let pairIndex = 0; pairIndex < 2; pairIndex += 1) {
        const raterId = SLOT_PAIRS[positionIndex][pairIndex];
        const offset = pairIndex === 0 ? ((positionIndex + critiqueIndex) % 3 - 1) * 0.025 : ((positionIndex * 2 + critiqueIndex) % 3 - 1) * 0.02;
        const overall = clamp(baseOverall[critiqueIndex] + offset);
        ratings.push({
          rating_id: `${positionId}-${critiqueIds[critiqueIndex]}-${raterId}-v1`,
          position_id: positionId,
          critique_id: critiqueIds[critiqueIndex],
          rater_id: raterId,
          stage: "initial",
          version: 1,
          predecessor_rating_id: null,
          rubric_version: "rubric-v2-seven-dimensional",
          scores: {
            centrality: clamp(0.35 + baseOverall[critiqueIndex] * 0.65),
            strength: clamp(0.2 + baseOverall[critiqueIndex] * 0.75 + offset / 2),
            correctness: clamp(0.75 + offset),
            clarity: positionIndex === 0 && critiqueIndex === 0 && pairIndex === 0 ? 0.45 : clamp(0.86 + offset),
            dead_weight: clamp(0.18 - baseOverall[critiqueIndex] * 0.12),
            single_issue: clamp(0.82 + baseOverall[critiqueIndex] * 0.12),
            overall,
          },
          overall_rationale: "Synthetic fixture rationale for deterministic analysis tests.",
          confidence: 0.8,
          time_spent_seconds: 360 + positionIndex * 7 + critiqueIndex * 23 + pairIndex * 11,
          insufficient_context: false,
          verification_status:
            positionIndex === 1 && critiqueIndex === 2 && pairIndex === 1 ? "unresolved_verifiable" : "not_applicable",
          item_integrity_flags: positionIndex === 2 && critiqueIndex === 1 && pairIndex === 0 ? ["ambiguity"] : [],
          accepted: true,
          locked_at: new Date(Date.UTC(2026, 7, 3, positionIndex, critiqueIndex * 2 + pairIndex)).toISOString(),
          operator_assigned: false,
          object_level_revision_reason: null,
        });
      }
    }
  }
  return {
    dataset_id: "synthetic-pilot-analysis-fixture-v1",
    dataset_version: 1,
    programme_id: "metaphilosophy-48-critique-pilot-v1-2026-07-30",
    data_class: "synthetic_test_fixture",
    rubric_version: "rubric-v2-seven-dimensional",
    positions,
    ratings,
  };
}

function ratingForMetric(critiqueId, overall, overrides = {}) {
  return {
    critique_id: critiqueId,
    insufficient_context: false,
    verification_status: "not_applicable",
    item_integrity_flags: [],
    ...overrides,
    scores: {
      centrality: 0.8,
      strength: 0.7,
      correctness: 0.9,
      clarity: 0.9,
      dead_weight: 0.1,
      single_issue: 0.9,
      overall,
      ...(overrides.scores ?? {}),
    },
  };
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

test("accepts a complete 12-position, 96-rating synthetic fixture", () => {
  const report = validatePilotRatingDataset(makeCompleteDataset(), { requireComplete: true });
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.positions, 12);
  assert.equal(report.critiques, 48);
  assert.equal(report.accepted_initial_ratings, 96);
});

test("rejects sibling split drift and incomplete rater allocation", () => {
  const dataset = makeCompleteDataset();
  dataset.ratings.find((rating) => rating.position_id === "P01" && rating.critique_id === "P01-C1").rater_id = "R9";
  const report = validatePilotRatingDataset(dataset, { requireComplete: true });
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("exactly two initial raters")));
  assert.ok(report.errors.some((error) => error.includes("six core raters") || error.includes("Complete pilot must contain 6 core raters")));
});

test("preserves initial ratings and accepts a predecessor-linked object-level rerating", () => {
  const dataset = makeCompleteDataset();
  const initial = dataset.ratings[0];
  dataset.ratings.push({
    ...structuredClone(initial),
    rating_id: `${initial.rating_id}-revision`,
    stage: "rerating",
    version: 2,
    predecessor_rating_id: initial.rating_id,
    scores: { ...initial.scores, overall: clamp(initial.scores.overall + 0.1) },
    locked_at: "2026-08-10T00:00:00.000Z",
    operator_assigned: true,
    object_level_revision_reason: "Reconsidered the critique after identifying a previously overlooked interpretation.",
  });
  const report = validatePilotRatingDataset(dataset, { requireComplete: true });
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(selectRatingSnapshot(dataset, "initial").find((rating) => rating.rating_id === initial.rating_id).version, 1);
  const latest = selectRatingSnapshot(dataset, "latest_accepted").find(
    (rating) => rating.position_id === initial.position_id && rating.critique_id === initial.critique_id && rating.rater_id === initial.rater_id,
  );
  assert.equal(latest.version, 2);
});

test("rejects overwrite-like or unlinked rerating records", () => {
  const dataset = makeCompleteDataset();
  const initial = dataset.ratings[0];
  dataset.ratings.push({
    ...structuredClone(initial),
    rating_id: `${initial.rating_id}-bad-revision`,
    stage: "rerating",
    version: 3,
    predecessor_rating_id: "missing-rating",
    locked_at: "2026-08-10T00:00:00.000Z",
    operator_assigned: false,
    object_level_revision_reason: "",
  });
  const report = validatePilotRatingDataset(dataset);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("object-level revision reason")));
  assert.ok(report.errors.some((error) => error.includes("operator-assigned")));
  assert.ok(report.errors.some((error) => error.includes("does not exist")));
  assert.ok(report.errors.some((error) => error.includes("contiguous")));
});

test("implements both branches of the source-derived LMCA custom loss", () => {
  const reference = ratingForMetric("c1", 0.8, {
    scores: { centrality: 0.5, strength: 0.8, correctness: 0.9, clarity: 0.8, dead_weight: 0.1, single_issue: 0.9, overall: 0.8 },
  });
  const candidate = ratingForMetric("c1", 0.5, {
    scores: { centrality: 0.4, strength: 0.5, correctness: 0.7, clarity: 0.6, dead_weight: 0.3, single_issue: 0.7, overall: 0.5 },
  });
  const expectedOrdinary =
    0.5 * 0.3 +
    0.2 * Math.abs(0.5 * 0.8 - 0.4 * 0.5) +
    0.1 * 0.2 +
    0.1 * 0.2 +
    0.05 * 0.2 +
    0.05 * 0.2;
  assert.ok(Math.abs(lmcaCustomWeightedLoss(reference, candidate) - expectedOrdinary) < 1e-12);

  const unclearReference = ratingForMetric("c1", 0.8, { scores: { clarity: 0.4, overall: 0.8 } });
  const unclearCandidate = ratingForMetric("c1", 0.5, { scores: { clarity: 0.1, overall: 0.5 } });
  assert.ok(Math.abs(lmcaCustomWeightedLoss(unclearReference, unclearCandidate) - 0.3) < 1e-12);
});

test("implements the source-derived weighted pairwise ranking error", () => {
  const reference = [ratingForMetric("c1", 0.9), ratingForMetric("c2", 0.5), ratingForMetric("c3", 0.1)];
  const candidate = [ratingForMetric("c1", 0.2), ratingForMetric("c2", 0.5), ratingForMetric("c3", 0.1)];
  const result = lmcaWeightedPairwiseRankingError(reference, candidate);
  assert.equal(result.pair_count, 3);
  assert.ok(Math.abs(result.weighted_loss_sum - 0.4) < 1e-12);
  assert.ok(Math.abs(result.average_weighted_pairwise_error - 0.4 / 3) < 1e-12);
});

test("computes symmetric ordering agreement and dimension gaps", () => {
  const left = [ratingForMetric("c1", 0.9), ratingForMetric("c2", 0.5), ratingForMetric("c3", 0.1)];
  const right = [ratingForMetric("c1", 0.8), ratingForMetric("c2", 0.6), ratingForMetric("c3", 0.2)];
  const ordering = symmetricWeightedOrderingAgreement(left, right, { minimumMeanOverallGap: 0.2 });
  assert.equal(ordering.agreement, 1);
  assert.equal(ordering.eligible_pair_count, 3);
  const differences = meanAbsoluteDifferences(left, right);
  assert.equal(differences.critique_count, 3);
  assert.ok(differences.by_dimension.overall > 0);
  assert.ok(Number.isFinite(differences.by_dimension.strength_times_centrality));
});

test("computes an interval-distance alpha diagnostic", () => {
  const identical = krippendorffAlphaInterval([
    [0.1, 0.1],
    [0.5, 0.5],
    [0.9, 0.9],
  ]);
  assert.equal(identical.alpha, 1);
  assert.equal(identical.unit_count, 3);
  const noisy = krippendorffAlphaInterval([
    [0.1, 0.9],
    [0.5, 0.4],
    [0.9, 0.2],
  ]);
  assert.ok(Number.isFinite(noisy.alpha));
  assert.ok(noisy.alpha < 1);
});

test("keeps candidate adjudication routes inoperative unless explicitly approved", () => {
  const left = ratingForMetric("c1", 0.9, {
    insufficient_context: true,
    verification_status: "unresolved_verifiable",
    item_integrity_flags: ["scope"],
    scores: { clarity: 0.4, overall: 0.9 },
  });
  const right = ratingForMetric("c1", 0.3, { scores: { clarity: 0.8, overall: 0.3 } });
  const policy = {
    approved_routes: [],
    low_clarity_below: 0.5,
    numeric_thresholds: { overall_gap: 0.3, clarity_gap: 0.35 },
  };
  const diagnostic = evaluateAdjudicationRoutes(left, right, policy);
  assert.ok(diagnostic.candidate_routes.some((entry) => entry.route === "low_clarity"));
  assert.ok(diagnostic.candidate_routes.some((entry) => entry.route === "overall_gap"));
  assert.ok(diagnostic.candidate_routes.some((entry) => entry.route === "insufficient_context"));
  assert.equal(diagnostic.operative_routes.length, 0);
  assert.equal(diagnostic.fail_closed_default, true);

  const approved = evaluateAdjudicationRoutes(left, right, { ...policy, approved_routes: ["low_clarity", "overall_gap"] });
  assert.deepEqual(
    approved.operative_routes.map((entry) => entry.route),
    ["low_clarity", "overall_gap"],
  );
});

test("produces position-level and leave-one-position-out diagnostics without authorizing Phase 2", () => {
  const report = analyzePilotRatingDataset(makeCompleteDataset(), {
    requireComplete: true,
    policy: {
      approved_routes: [],
      diagnostic_minimum_mean_overall_gap: 0.2,
      low_clarity_below: 0.5,
      numeric_thresholds: {
        overall_gap: 0.3,
        strength_times_centrality_gap: 0.3,
        correctness_gap: 0.35,
        clarity_gap: 0.35,
      },
    },
  });
  assert.equal(report.diagnostic_only, true);
  assert.equal(report.numeric_thresholds_binding, false);
  assert.equal(report.phase_2_authorized, false);
  assert.equal(report.aggregate.positions_with_complete_pairs, 12);
  assert.equal(report.aggregate.accepted_initial_ratings, 96);
  assert.equal(report.position_results.length, 12);
  assert.equal(report.leave_one_position_out_ranges.unit, "position");
  assert.equal(report.leave_one_position_out_ranges.summaries.length, 12);
  assert.equal(report.aggregate.critiques_with_operative_routes, 0);
  assert.ok(report.aggregate.critiques_with_candidate_routes >= 2);
  assert.ok(report.aggregate.interval_krippendorff_alpha_by_dimension.overall);
});
