import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const RATING_DIMENSIONS = Object.freeze([
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "overall",
]);

export const VERIFICATION_STATUSES = Object.freeze([
  "not_applicable",
  "verified",
  "unresolved_verifiable",
  "not_practically_verifiable",
]);

export const ITEM_INTEGRITY_FLAGS = Object.freeze([
  "source_fidelity",
  "ambiguity",
  "scope",
  "leakage",
  "other_documented",
]);

export const PILOT_COMPLETE_COUNTS = Object.freeze({
  positions: 12,
  critiques: 48,
  accepted_initial_ratings: 96,
  core_raters: 6,
  accepted_initial_ratings_per_core_rater: 16,
});

const EPSILON = 1e-12;

export function validatePilotRatingDataset(value, options = {}) {
  const requireComplete = options.requireComplete === true;
  const errors = [];
  const positions = Array.isArray(value?.positions) ? value.positions : [];
  const ratings = Array.isArray(value?.ratings) ? value.ratings : [];
  const positionById = new Map();
  const critiqueToPosition = new Map();

  if (!nonEmptyString(value?.dataset_id)) errors.push("dataset_id is required.");
  if (value?.dataset_version !== 1) errors.push("dataset_version must equal 1.");
  if (value?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (!new Set(["synthetic_test_fixture", "private_controlled_pilot_record"]).has(value?.data_class)) {
    errors.push("data_class must be synthetic_test_fixture or private_controlled_pilot_record.");
  }
  if (value?.rubric_version !== "rubric-v2-seven-dimensional") {
    errors.push("rubric_version must equal rubric-v2-seven-dimensional.");
  }
  if (positions.length === 0) errors.push("positions must contain at least one position.");

  for (const [index, position] of positions.entries()) {
    const positionId = cleanId(position?.position_id);
    if (!positionId) {
      errors.push(`positions[${index}].position_id is required.`);
      continue;
    }
    if (positionById.has(positionId)) errors.push(`Duplicate position_id: ${positionId}.`);
    positionById.set(positionId, position);
    const critiqueIds = normalizeIds(position?.critique_ids);
    if (critiqueIds.length !== 4) errors.push(`${positionId} must contain exactly four critique_ids.`);
    if (new Set(critiqueIds).size !== critiqueIds.length) errors.push(`${positionId} critique_ids must be unique.`);
    for (const critiqueId of critiqueIds) {
      if (critiqueToPosition.has(critiqueId)) {
        errors.push(`critique_id ${critiqueId} appears under more than one position.`);
      } else {
        critiqueToPosition.set(critiqueId, positionId);
      }
    }
  }

  const ratingById = new Map();
  const ratingKeySet = new Set();
  const normalizedRatings = [];

  for (const [index, rating] of ratings.entries()) {
    const prefix = `ratings[${index}]`;
    if (!rating || typeof rating !== "object" || Array.isArray(rating)) {
      errors.push(`${prefix} must be an object.`);
      continue;
    }
    const ratingId = cleanId(rating.rating_id);
    const positionId = cleanId(rating.position_id);
    const critiqueId = cleanId(rating.critique_id);
    const raterId = cleanId(rating.rater_id);
    const stage = String(rating.stage ?? "");
    const version = rating.version;

    if (!ratingId) errors.push(`${prefix}.rating_id is required.`);
    if (ratingId && ratingById.has(ratingId)) errors.push(`Duplicate rating_id: ${ratingId}.`);
    if (!positionId || !positionById.has(positionId)) errors.push(`${prefix}.position_id must reference a known position.`);
    if (!critiqueId || critiqueToPosition.get(critiqueId) !== positionId) {
      errors.push(`${prefix}.critique_id must belong to its position_id.`);
    }
    if (!raterId) errors.push(`${prefix}.rater_id is required.`);
    if (raterId && (/\s/.test(raterId) || raterId.includes("@"))) {
      errors.push(`${prefix}.rater_id must be a controlled pseudonymous identifier.`);
    }
    if (!new Set(["initial", "rerating"]).has(stage)) errors.push(`${prefix}.stage must be initial or rerating.`);
    if (!Number.isInteger(version) || version < 1) errors.push(`${prefix}.version must be a positive integer.`);
    if (rating.rubric_version !== "rubric-v2-seven-dimensional") {
      errors.push(`${prefix}.rubric_version must equal rubric-v2-seven-dimensional.`);
    }

    validateScoreVector(rating.scores, `${prefix}.scores`, errors);
    if (!nonEmptyString(rating.overall_rationale)) errors.push(`${prefix}.overall_rationale is required.`);
    if (!unitIntervalNumber(rating.confidence)) errors.push(`${prefix}.confidence must lie in [0, 1].`);
    if (!Number.isInteger(rating.time_spent_seconds) || rating.time_spent_seconds <= 0) {
      errors.push(`${prefix}.time_spent_seconds must be a positive integer.`);
    }
    if (typeof rating.insufficient_context !== "boolean") errors.push(`${prefix}.insufficient_context must be boolean.`);
    if (!VERIFICATION_STATUSES.includes(rating.verification_status)) {
      errors.push(`${prefix}.verification_status is not recognized.`);
    }
    const integrityFlags = normalizeIds(rating.item_integrity_flags);
    if (!Array.isArray(rating.item_integrity_flags)) errors.push(`${prefix}.item_integrity_flags must be an array.`);
    if (new Set(integrityFlags).size !== integrityFlags.length) errors.push(`${prefix}.item_integrity_flags must be unique.`);
    for (const flag of integrityFlags) {
      if (!ITEM_INTEGRITY_FLAGS.includes(flag)) errors.push(`${prefix}.item_integrity_flags contains unsupported value ${flag}.`);
    }
    if (typeof rating.accepted !== "boolean") errors.push(`${prefix}.accepted must be boolean.`);
    if (!validIsoTimestamp(rating.locked_at)) errors.push(`${prefix}.locked_at must be a valid ISO-8601 timestamp.`);
    if (typeof rating.operator_assigned !== "boolean") errors.push(`${prefix}.operator_assigned must be boolean.`);

    if (stage === "initial") {
      if (version !== 1) errors.push(`${prefix} initial rating must use version 1.`);
      if (rating.predecessor_rating_id !== null) errors.push(`${prefix} initial rating predecessor_rating_id must be null.`);
      if (rating.object_level_revision_reason !== null) {
        errors.push(`${prefix} initial rating object_level_revision_reason must be null.`);
      }
      if (rating.operator_assigned !== false) errors.push(`${prefix} initial rating operator_assigned must be false.`);
    }
    if (stage === "rerating") {
      if (version < 2) errors.push(`${prefix} rerating version must be at least 2.`);
      if (!cleanId(rating.predecessor_rating_id)) errors.push(`${prefix} rerating requires predecessor_rating_id.`);
      if (!nonEmptyString(rating.object_level_revision_reason)) {
        errors.push(`${prefix} rerating requires an object-level revision reason.`);
      }
      if (rating.operator_assigned !== true) errors.push(`${prefix} rerating must be operator-assigned.`);
    }

    const ratingKey = [positionId, critiqueId, raterId, version].join("|");
    if (positionId && critiqueId && raterId && Number.isInteger(version)) {
      if (ratingKeySet.has(ratingKey)) errors.push(`Duplicate rating version key: ${ratingKey}.`);
      ratingKeySet.add(ratingKey);
    }

    const normalized = {
      ...rating,
      rating_id: ratingId,
      position_id: positionId,
      critique_id: critiqueId,
      rater_id: raterId,
      item_integrity_flags: integrityFlags,
    };
    normalizedRatings.push(normalized);
    if (ratingId) ratingById.set(ratingId, normalized);
  }

  for (const rating of normalizedRatings) {
    if (rating.stage !== "rerating") continue;
    const predecessor = ratingById.get(cleanId(rating.predecessor_rating_id));
    if (!predecessor) {
      errors.push(`${rating.rating_id} predecessor_rating_id does not exist.`);
      continue;
    }
    for (const field of ["position_id", "critique_id", "rater_id"]) {
      if (predecessor[field] !== rating[field]) errors.push(`${rating.rating_id} predecessor must match ${field}.`);
    }
    if (predecessor.version !== rating.version - 1) {
      errors.push(`${rating.rating_id} predecessor version must equal current version minus one.`);
    }
    if (!predecessor.accepted) errors.push(`${rating.rating_id} predecessor must be accepted.`);
    if (Date.parse(predecessor.locked_at) >= Date.parse(rating.locked_at)) {
      errors.push(`${rating.rating_id} must lock after its predecessor.`);
    }
  }

  const versionsByRaterCritique = groupBy(normalizedRatings, (rating) => `${rating.position_id}|${rating.critique_id}|${rating.rater_id}`);
  for (const [key, rows] of versionsByRaterCritique) {
    const versions = rows.map((row) => row.version).filter(Number.isInteger).sort((left, right) => left - right);
    if (versions.length === 0) continue;
    for (let index = 0; index < versions.length; index += 1) {
      if (versions[index] !== index + 1) errors.push(`${key} rating versions must be contiguous from 1.`);
    }
    const initialCount = rows.filter((row) => row.stage === "initial").length;
    if (initialCount !== 1) errors.push(`${key} must contain exactly one initial rating record.`);
  }

  const acceptedInitial = normalizedRatings.filter((rating) => rating.stage === "initial" && rating.accepted === true);
  const acceptedInitialByCritique = groupBy(acceptedInitial, (rating) => rating.critique_id);
  for (const [critiqueId, rows] of acceptedInitialByCritique) {
    if (rows.length > 2) errors.push(`${critiqueId} cannot have more than two accepted initial ratings.`);
    if (new Set(rows.map((row) => row.rater_id)).size !== rows.length) {
      errors.push(`${critiqueId} accepted initial ratings must come from distinct raters.`);
    }
  }

  if (requireComplete) validateCompletePilot(positionById, critiqueToPosition, acceptedInitial, errors);

  return {
    status: errors.length ? "fail" : "pass",
    dataset_id: value?.dataset_id ?? null,
    data_class: value?.data_class ?? null,
    positions: positionById.size,
    critiques: critiqueToPosition.size,
    ratings: normalizedRatings.length,
    accepted_initial_ratings: acceptedInitial.length,
    complete_pilot_required: requireComplete,
    errors,
  };
}

export function selectRatingSnapshot(dataset, mode = "initial") {
  const ratings = Array.isArray(dataset?.ratings) ? dataset.ratings : [];
  if (mode === "initial") return ratings.filter((rating) => rating.stage === "initial" && rating.accepted === true);
  if (mode !== "latest_accepted") throw new Error("snapshot mode must be initial or latest_accepted");
  const latest = new Map();
  for (const rating of ratings.filter((row) => row.accepted === true)) {
    const key = `${rating.position_id}|${rating.critique_id}|${rating.rater_id}`;
    const previous = latest.get(key);
    if (!previous || rating.version > previous.version) latest.set(key, rating);
  }
  return [...latest.values()];
}

export function strengthTimesCentrality(value) {
  const scores = scoreVector(value);
  return scores.strength * scores.centrality;
}

export function lmcaCustomWeightedLoss(referenceValue, candidateValue) {
  const reference = scoreVector(referenceValue);
  const candidate = scoreVector(candidateValue);
  assertValidScoreVector(reference, "reference");
  assertValidScoreVector(candidate, "candidate");
  if (reference.clarity < 0.5) {
    return 0.5 * Math.abs(reference.overall - candidate.overall) + 0.5 * Math.abs(reference.clarity - candidate.clarity);
  }
  return (
    0.5 * Math.abs(reference.overall - candidate.overall) +
    0.2 * Math.abs(reference.strength * reference.centrality - candidate.strength * candidate.centrality) +
    0.1 * Math.abs(reference.clarity - candidate.clarity) +
    0.1 * Math.abs(reference.correctness - candidate.correctness) +
    0.05 * Math.abs(reference.dead_weight - candidate.dead_weight) +
    0.05 * Math.abs(reference.single_issue - candidate.single_issue)
  );
}

export function lmcaWeightedPairwiseRankingError(referenceRows, candidateRows) {
  const pairs = matchedCritiquePairs(referenceRows, candidateRows);
  let weightedLoss = 0;
  let referenceGapSum = 0;
  let pairCount = 0;
  for (let left = 0; left < pairs.length; left += 1) {
    for (let right = left + 1; right < pairs.length; right += 1) {
      const referenceDelta = pairs[left].reference.scores.overall - pairs[right].reference.scores.overall;
      const referenceGap = Math.abs(referenceDelta);
      if (referenceGap <= EPSILON) continue;
      const candidateDelta = pairs[left].candidate.scores.overall - pairs[right].candidate.scores.overall;
      const agreement = direction(referenceDelta) === direction(candidateDelta) ? 1 : direction(candidateDelta) === 0 ? 0.5 : 0;
      weightedLoss += referenceGap * (1 - agreement);
      referenceGapSum += referenceGap;
      pairCount += 1;
    }
  }
  return {
    pair_count: pairCount,
    weighted_loss_sum: weightedLoss,
    average_weighted_pairwise_error: pairCount ? weightedLoss / pairCount : null,
    reference_gap_sum: referenceGapSum,
  };
}

export function symmetricWeightedOrderingAgreement(rowsA, rowsB, options = {}) {
  const minimumMeanOverallGap = finiteNonNegative(options.minimumMeanOverallGap ?? 0, "minimumMeanOverallGap");
  const pairs = matchedCritiquePairs(rowsA, rowsB, "a", "b");
  let weightSum = 0;
  let weightedAgreement = 0;
  let eligiblePairCount = 0;
  for (let left = 0; left < pairs.length; left += 1) {
    for (let right = left + 1; right < pairs.length; right += 1) {
      const meanLeft = (pairs[left].a.scores.overall + pairs[left].b.scores.overall) / 2;
      const meanRight = (pairs[right].a.scores.overall + pairs[right].b.scores.overall) / 2;
      const weight = Math.abs(meanLeft - meanRight);
      if (weight + EPSILON < minimumMeanOverallGap || weight <= EPSILON) continue;
      const deltaA = pairs[left].a.scores.overall - pairs[right].a.scores.overall;
      const deltaB = pairs[left].b.scores.overall - pairs[right].b.scores.overall;
      const agreement = direction(deltaA) === direction(deltaB) ? 1 : direction(deltaA) === 0 || direction(deltaB) === 0 ? 0.5 : 0;
      weightSum += weight;
      weightedAgreement += weight * agreement;
      eligiblePairCount += 1;
    }
  }
  return {
    eligible_pair_count: eligiblePairCount,
    weight_sum: weightSum,
    agreement: weightSum > 0 ? weightedAgreement / weightSum : null,
    minimum_mean_overall_gap: minimumMeanOverallGap,
  };
}

export function meanAbsoluteDifferences(rowsA, rowsB) {
  const pairs = matchedCritiquePairs(rowsA, rowsB, "a", "b");
  const sums = Object.fromEntries([...RATING_DIMENSIONS, "strength_times_centrality"].map((field) => [field, 0]));
  for (const pair of pairs) {
    for (const dimension of RATING_DIMENSIONS) sums[dimension] += Math.abs(pair.a.scores[dimension] - pair.b.scores[dimension]);
    sums.strength_times_centrality += Math.abs(strengthTimesCentrality(pair.a) - strengthTimesCentrality(pair.b));
  }
  return {
    critique_count: pairs.length,
    by_dimension: Object.fromEntries(
      Object.entries(sums).map(([field, sum]) => [field, pairs.length ? sum / pairs.length : null]),
    ),
  };
}

export function krippendorffAlphaInterval(units) {
  const normalizedUnits = (Array.isArray(units) ? units : [])
    .map((unit) => (Array.isArray(unit) ? unit.filter((value) => Number.isFinite(value)) : []))
    .filter((unit) => unit.length >= 2);
  let observedSum = 0;
  let observedPairs = 0;
  for (const unit of normalizedUnits) {
    for (let left = 0; left < unit.length; left += 1) {
      for (let right = left + 1; right < unit.length; right += 1) {
        observedSum += (unit[left] - unit[right]) ** 2;
        observedPairs += 1;
      }
    }
  }
  const pooled = normalizedUnits.flat();
  let expectedSum = 0;
  let expectedPairs = 0;
  for (let left = 0; left < pooled.length; left += 1) {
    for (let right = left + 1; right < pooled.length; right += 1) {
      expectedSum += (pooled[left] - pooled[right]) ** 2;
      expectedPairs += 1;
    }
  }
  if (!observedPairs || !expectedPairs) return null;
  const observedDisagreement = observedSum / observedPairs;
  const expectedDisagreement = expectedSum / expectedPairs;
  return {
    alpha: expectedDisagreement <= EPSILON ? (observedDisagreement <= EPSILON ? 1 : null) : 1 - observedDisagreement / expectedDisagreement,
    observed_disagreement: observedDisagreement,
    expected_disagreement: expectedDisagreement,
    unit_count: normalizedUnits.length,
    rating_count: pooled.length,
    specialization: "interval_distance_two_ratings_per_critique_pilot_diagnostic",
  };
}

export function evaluateAdjudicationRoutes(ratingA, ratingB, policy = {}) {
  const candidateRoutes = [];
  const approvedRoutes = new Set(normalizeIds(policy.approved_routes));
  const thresholds = objectOrEmpty(policy.numeric_thresholds);
  const lowClarityBelow = Number.isFinite(policy.low_clarity_below) ? policy.low_clarity_below : null;

  const add = (route, details = {}) => candidateRoutes.push({ route, ...details });
  if (ratingA.insufficient_context || ratingB.insufficient_context) add("insufficient_context");
  const integrityFlags = [...new Set([...normalizeIds(ratingA.item_integrity_flags), ...normalizeIds(ratingB.item_integrity_flags)])];
  if (integrityFlags.length) add("item_integrity", { flags: integrityFlags });
  if (ratingA.verification_status === "unresolved_verifiable" || ratingB.verification_status === "unresolved_verifiable") {
    add("unresolved_verification");
  }
  if (lowClarityBelow !== null && (ratingA.scores.clarity < lowClarityBelow || ratingB.scores.clarity < lowClarityBelow)) {
    add("low_clarity", { threshold: lowClarityBelow });
  }

  for (const [route, field] of [
    ["overall_gap", "overall"],
    ["correctness_gap", "correctness"],
    ["clarity_gap", "clarity"],
  ]) {
    const threshold = thresholds[route];
    if (!Number.isFinite(threshold)) continue;
    const gap = Math.abs(ratingA.scores[field] - ratingB.scores[field]);
    if (gap + EPSILON >= threshold) add(route, { threshold, observed_gap: gap });
  }
  if (Number.isFinite(thresholds.strength_times_centrality_gap)) {
    const gap = Math.abs(strengthTimesCentrality(ratingA) - strengthTimesCentrality(ratingB));
    if (gap + EPSILON >= thresholds.strength_times_centrality_gap) {
      add("strength_times_centrality_gap", {
        threshold: thresholds.strength_times_centrality_gap,
        observed_gap: gap,
      });
    }
  }

  const deduplicated = deduplicateRoutes(candidateRoutes);
  return {
    candidate_routes: deduplicated,
    operative_routes: deduplicated.filter((entry) => approvedRoutes.has(entry.route)),
    approved_routes: [...approvedRoutes].sort(),
    fail_closed_default: approvedRoutes.size === 0,
  };
}

export function analyzePilotRatingDataset(dataset, options = {}) {
  const validation = validatePilotRatingDataset(dataset, { requireComplete: options.requireComplete === true });
  if (validation.status !== "pass") throw new Error(`Pilot rating dataset is invalid:\n${validation.errors.join("\n")}`);
  const policy = objectOrEmpty(options.policy);
  const initialRatings = selectRatingSnapshot(dataset, "initial");
  const positionDefinitions = new Map(dataset.positions.map((position) => [position.position_id, position]));
  const ratingsByPosition = groupBy(initialRatings, (rating) => rating.position_id);
  const positionResults = [];
  const allRouteResults = [];

  for (const [positionId, position] of positionDefinitions) {
    const rows = ratingsByPosition.get(positionId) ?? [];
    const byRater = groupBy(rows, (rating) => rating.rater_id);
    const raterIds = [...byRater.keys()].sort();
    if (raterIds.length !== 2) {
      positionResults.push({
        position_id: positionId,
        complete_pair: false,
        critique_count: normalizeIds(position.critique_ids).length,
        rater_count: raterIds.length,
      });
      continue;
    }
    const rowsA = byRater.get(raterIds[0]);
    const rowsB = byRater.get(raterIds[1]);
    const ordering = symmetricWeightedOrderingAgreement(rowsA, rowsB, {
      minimumMeanOverallGap: policy.diagnostic_minimum_mean_overall_gap ?? 0,
    });
    const absoluteDifferences = meanAbsoluteDifferences(rowsA, rowsB);
    const matched = matchedCritiquePairs(rowsA, rowsB, "a", "b");
    const consensusOverall = matched.map((pair) => (pair.a.scores.overall + pair.b.scores.overall) / 2);
    const routeResults = matched.map((pair) => ({
      critique_id: pair.a.critique_id,
      ...evaluateAdjudicationRoutes(pair.a, pair.b, policy),
    }));
    allRouteResults.push(...routeResults.map((result) => ({ position_id: positionId, ...result })));
    positionResults.push({
      position_id: positionId,
      complete_pair: true,
      critique_count: matched.length,
      rater_ids: raterIds,
      weighted_ordering: ordering,
      mean_absolute_differences: absoluteDifferences.by_dimension,
      consensus_overall_spread: consensusOverall.length ? Math.max(...consensusOverall) - Math.min(...consensusOverall) : null,
      critiques_with_candidate_routes: routeResults.filter((result) => result.candidate_routes.length > 0).length,
      critiques_with_operative_routes: routeResults.filter((result) => result.operative_routes.length > 0).length,
    });
  }

  const completePositions = positionResults.filter((result) => result.complete_pair);
  const timeValues = initialRatings.filter((rating) => rating.accepted).map((rating) => rating.time_spent_seconds);
  const critiqueUnits = buildCritiqueUnits(initialRatings);
  const alphaByDimension = {};
  for (const dimension of RATING_DIMENSIONS) {
    alphaByDimension[dimension] = krippendorffAlphaInterval(
      [...critiqueUnits.values()].map((rows) => rows.map((rating) => rating.scores[dimension])),
    );
  }
  alphaByDimension.strength_times_centrality = krippendorffAlphaInterval(
    [...critiqueUnits.values()].map((rows) => rows.map((rating) => strengthTimesCentrality(rating))),
  );

  const aggregate = {
    positions_with_complete_pairs: completePositions.length,
    accepted_initial_ratings: initialRatings.length,
    accepted_rating_time_seconds: distributionSummary(timeValues),
    mean_position_weighted_ordering_agreement: mean(
      completePositions.map((result) => result.weighted_ordering.agreement).filter(Number.isFinite),
    ),
    mean_absolute_initial_rater_difference_by_dimension: aggregateDimensionMeans(completePositions),
    interval_krippendorff_alpha_by_dimension: alphaByDimension,
    critiques_with_candidate_routes: allRouteResults.filter((result) => result.candidate_routes.length > 0).length,
    critiques_with_operative_routes: allRouteResults.filter((result) => result.operative_routes.length > 0).length,
    total_critiques_with_two_initial_ratings: critiqueUnits.size,
  };

  return {
    report_version: "pilot-rating-analysis-v1",
    programme_id: dataset.programme_id,
    data_class: dataset.data_class,
    snapshot: "accepted_initial_ratings",
    diagnostic_only: true,
    numeric_thresholds_binding: false,
    phase_2_authorized: false,
    validation,
    policy: {
      approved_routes: normalizeIds(policy.approved_routes).sort(),
      fail_closed_default: normalizeIds(policy.approved_routes).length === 0,
      diagnostic_minimum_mean_overall_gap: policy.diagnostic_minimum_mean_overall_gap ?? 0,
    },
    aggregate,
    leave_one_position_out_ranges: computeLeaveOnePositionOutRanges(completePositions),
    position_results: positionResults,
    route_results: allRouteResults,
  };
}

function validateCompletePilot(positionById, critiqueToPosition, acceptedInitial, errors) {
  if (positionById.size !== PILOT_COMPLETE_COUNTS.positions) {
    errors.push(`Complete pilot must contain ${PILOT_COMPLETE_COUNTS.positions} positions.`);
  }
  if (critiqueToPosition.size !== PILOT_COMPLETE_COUNTS.critiques) {
    errors.push(`Complete pilot must contain ${PILOT_COMPLETE_COUNTS.critiques} critiques.`);
  }
  if (acceptedInitial.length !== PILOT_COMPLETE_COUNTS.accepted_initial_ratings) {
    errors.push(`Complete pilot must contain ${PILOT_COMPLETE_COUNTS.accepted_initial_ratings} accepted initial ratings.`);
  }

  const byCritique = groupBy(acceptedInitial, (rating) => rating.critique_id);
  for (const critiqueId of critiqueToPosition.keys()) {
    const rows = byCritique.get(critiqueId) ?? [];
    if (rows.length !== 2) errors.push(`${critiqueId} must have exactly two accepted initial ratings in complete mode.`);
  }

  const byPosition = groupBy(acceptedInitial, (rating) => rating.position_id);
  for (const [positionId, position] of positionById) {
    const expectedCritiques = normalizeIds(position.critique_ids);
    const rows = byPosition.get(positionId) ?? [];
    const raterIds = [...new Set(rows.map((rating) => rating.rater_id))].sort();
    if (raterIds.length !== 2) {
      errors.push(`${positionId} must have exactly two initial raters across all sibling critiques.`);
      continue;
    }
    for (const raterId of raterIds) {
      const ratedCritiques = new Set(rows.filter((rating) => rating.rater_id === raterId).map((rating) => rating.critique_id));
      if (ratedCritiques.size !== expectedCritiques.length || expectedCritiques.some((critiqueId) => !ratedCritiques.has(critiqueId))) {
        errors.push(`${positionId} must keep all four sibling critiques with the same rater pair.`);
      }
    }
  }

  const byRater = groupBy(acceptedInitial, (rating) => rating.rater_id);
  if (byRater.size !== PILOT_COMPLETE_COUNTS.core_raters) {
    errors.push(`Complete pilot must contain ${PILOT_COMPLETE_COUNTS.core_raters} core raters.`);
  }
  for (const [raterId, rows] of byRater) {
    if (rows.length !== PILOT_COMPLETE_COUNTS.accepted_initial_ratings_per_core_rater) {
      errors.push(`${raterId} must have ${PILOT_COMPLETE_COUNTS.accepted_initial_ratings_per_core_rater} accepted initial ratings.`);
    }
  }
}

function validateScoreVector(value, prefix, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${prefix} must be an object.`);
    return;
  }
  for (const dimension of RATING_DIMENSIONS) {
    if (!unitIntervalNumber(value[dimension])) errors.push(`${prefix}.${dimension} must lie in [0, 1].`);
  }
}

function assertValidScoreVector(value, label) {
  const errors = [];
  validateScoreVector(value, label, errors);
  if (errors.length) throw new Error(errors.join(" "));
}

function scoreVector(value) {
  return value?.scores && typeof value.scores === "object" ? value.scores : value;
}

function matchedCritiquePairs(leftRows, rightRows, leftLabel = "reference", rightLabel = "candidate") {
  const left = new Map((Array.isArray(leftRows) ? leftRows : []).map((row) => [row.critique_id, normalizeRatingForMetric(row)]));
  const right = new Map((Array.isArray(rightRows) ? rightRows : []).map((row) => [row.critique_id, normalizeRatingForMetric(row)]));
  const ids = [...left.keys()].filter((id) => right.has(id)).sort();
  if (ids.length !== left.size || ids.length !== right.size) throw new Error("Rating sets must contain identical critique IDs.");
  return ids.map((id) => ({ critique_id: id, [leftLabel]: left.get(id), [rightLabel]: right.get(id) }));
}

function normalizeRatingForMetric(value) {
  const scores = scoreVector(value);
  assertValidScoreVector(scores, "metric rating");
  return { ...value, scores };
}

function buildCritiqueUnits(ratings) {
  const units = groupBy(ratings.filter((rating) => rating.accepted), (rating) => `${rating.position_id}|${rating.critique_id}`);
  return new Map([...units.entries()].filter(([, rows]) => rows.length >= 2));
}

function aggregateDimensionMeans(positionResults) {
  const fields = [...RATING_DIMENSIONS, "strength_times_centrality"];
  return Object.fromEntries(
    fields.map((field) => [
      field,
      mean(positionResults.map((result) => result.mean_absolute_differences?.[field]).filter(Number.isFinite)),
    ]),
  );
}

function computeLeaveOnePositionOutRanges(positionResults) {
  if (positionResults.length < 3) return null;
  const summaries = [];
  for (const omitted of positionResults) {
    const retained = positionResults.filter((result) => result.position_id !== omitted.position_id);
    const totalCritiques = retained.reduce((sum, result) => sum + result.critique_count, 0);
    summaries.push({
      omitted_position_id: omitted.position_id,
      mean_weighted_ordering_agreement: mean(retained.map((result) => result.weighted_ordering.agreement).filter(Number.isFinite)),
      mean_absolute_overall_difference: mean(
        retained.map((result) => result.mean_absolute_differences.overall).filter(Number.isFinite),
      ),
      candidate_route_rate: totalCritiques
        ? retained.reduce((sum, result) => sum + result.critiques_with_candidate_routes, 0) / totalCritiques
        : null,
    });
  }
  return {
    unit: "position",
    summaries,
    ranges: {
      mean_weighted_ordering_agreement: numericRange(summaries.map((row) => row.mean_weighted_ordering_agreement)),
      mean_absolute_overall_difference: numericRange(summaries.map((row) => row.mean_absolute_overall_difference)),
      candidate_route_rate: numericRange(summaries.map((row) => row.candidate_route_rate)),
    },
  };
}

function deduplicateRoutes(routes) {
  const byRoute = new Map();
  for (const route of routes) if (!byRoute.has(route.route)) byRoute.set(route.route, route);
  return [...byRoute.values()].sort((left, right) => left.route.localeCompare(right.route));
}

function distributionSummary(values) {
  const normalized = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (!normalized.length) return null;
  return {
    count: normalized.length,
    minimum: normalized[0],
    p25: quantile(normalized, 0.25),
    median: quantile(normalized, 0.5),
    p75: quantile(normalized, 0.75),
    maximum: normalized.at(-1),
    mean: mean(normalized),
  };
}

function quantile(sortedValues, probability) {
  if (!sortedValues.length) return null;
  const index = (sortedValues.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const fraction = index - lower;
  return sortedValues[lower] * (1 - fraction) + sortedValues[upper] * fraction;
}

function numericRange(values) {
  const normalized = values.filter(Number.isFinite);
  return normalized.length ? { minimum: Math.min(...normalized), maximum: Math.max(...normalized) } : null;
}

function mean(values) {
  const normalized = values.filter(Number.isFinite);
  return normalized.length ? normalized.reduce((sum, value) => sum + value, 0) / normalized.length : null;
}

function direction(value) {
  if (Math.abs(value) <= EPSILON) return 0;
  return value > 0 ? 1 : -1;
}

function finiteNonNegative(value, label) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a finite non-negative number`);
  return value;
}

function unitIntervalNumber(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function validIsoTimestamp(value) {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeIds(value) {
  return Array.isArray(value) ? value.map(cleanId).filter(Boolean) : [];
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function groupBy(values, keyFunction) {
  const groups = new Map();
  for (const value of values) {
    const key = keyFunction(value);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(value);
  }
  return groups;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help") || process.argv.length < 3) {
    console.log("Usage: node scripts/pilot-rating-analysis.mjs <rating-dataset.json> [analysis-policy.json]");
    console.log("No adjudication route is operative unless analysis-policy.json explicitly lists it in approved_routes.");
  } else {
    const dataset = JSON.parse(await readFile(resolve(process.argv[2]), "utf8"));
    const policy = process.argv[3] ? JSON.parse(await readFile(resolve(process.argv[3]), "utf8")) : {};
    console.log(JSON.stringify(analyzePilotRatingDataset(dataset, { policy }), null, 2));
  }
}
