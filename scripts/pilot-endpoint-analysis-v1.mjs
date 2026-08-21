import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import {
  lmcaCustomWeightedLoss,
  strengthTimesCentrality,
} from "./pilot-rating-analysis.mjs";

export const ENDPOINT_RATING_DIMENSIONS = Object.freeze([
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "overall",
]);
export const ENDPOINT_STAGES = Object.freeze([
  "initial",
  "blind_self_check",
  "rerating",
]);
export const PRICED_IN_ASSESSMENTS = Object.freeze(["no", "partly", "yes", "uncertain"]);
export const INTERPRETATION_CONFIDENCE_OPTIONS = Object.freeze(["high", "medium", "low"]);
export const SELF_CHECK_EXPOSURE_FIELDS = Object.freeze([
  "peer_scores_visible",
  "peer_rationales_visible",
  "model_judgments_visible",
  "aggregate_results_visible",
  "cause_codes_visible",
  "discussion_visible",
  "adjudication_state_visible",
]);

const COMPLETE = Object.freeze({
  positions: 12,
  critiques: 48,
  initialRatings: 96,
  coreRaters: 6,
  initialRatingsPerRater: 16,
  selfChecks: 24,
  selectedPositions: 6,
  selectedCritiques: 12,
  selfChecksPerRater: 4,
  selectedPositionsPerRater: 2,
});
const EPSILON = 1e-12;
const FORBIDDEN_PUBLIC_KEYS = new Set([
  "dataset_id",
  "position_id",
  "position_ids",
  "critique_id",
  "critique_ids",
  "rating_id",
  "rating_ids",
  "rater_id",
  "rater_ids",
  "predecessor_rating_id",
  "self_check_selection_record_id",
  "position_conclusion_summary",
  "critique_target_summary",
  "background_assumptions",
  "overall_rationale",
  "object_level_revision_reason",
]);

export class PilotEndpointAnalysisError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PilotEndpointAnalysisError";
    this.details = details;
  }
}

export function validatePilotEndpointDataset(dataset, options = {}) {
  const requireComplete = options.requireComplete === true;
  const requireEndpointV1 = options.requireEndpointV1 !== false;
  const errors = [];
  const positions = Array.isArray(dataset?.positions) ? dataset.positions : [];
  const ratings = Array.isArray(dataset?.ratings) ? dataset.ratings : [];
  const positionById = new Map();
  const critiqueToPosition = new Map();

  if (!nonEmptyString(dataset?.dataset_id)) errors.push("dataset_id is required.");
  if (dataset?.dataset_version !== 1) errors.push("dataset_version must equal 1.");
  if (dataset?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (!new Set(["synthetic_test_fixture", "private_controlled_pilot_record"]).has(dataset?.data_class)) {
    errors.push("data_class must be synthetic_test_fixture or private_controlled_pilot_record.");
  }
  if (dataset?.rubric_version !== "rubric-v2-seven-dimensional") {
    errors.push("rubric_version must equal rubric-v2-seven-dimensional.");
  }
  if (positions.length === 0) errors.push("positions must contain at least one position.");

  positions.forEach((position, index) => {
    const prefix = `positions[${index}]`;
    const positionId = cleanId(position?.position_id);
    const critiqueIds = normalizeIds(position?.critique_ids);
    if (!controlledId(positionId)) errors.push(`${prefix}.position_id must be a controlled identifier.`);
    if (positionById.has(positionId)) errors.push(`${prefix}.position_id must be unique.`);
    positionById.set(positionId, position);
    if (critiqueIds.length !== 4 || new Set(critiqueIds).size !== 4) {
      errors.push(`${prefix}.critique_ids must contain exactly four unique IDs.`);
    }
    for (const critiqueId of critiqueIds) {
      if (!controlledId(critiqueId)) errors.push(`${prefix}.critique_ids contains an invalid ID.`);
      if (critiqueToPosition.has(critiqueId)) errors.push(`${critiqueId} appears under more than one position.`);
      critiqueToPosition.set(critiqueId, positionId);
    }
  });

  const ratingById = new Map();
  const normalizedRatings = [];
  ratings.forEach((rating, index) => {
    const prefix = `ratings[${index}]`;
    if (!rating || typeof rating !== "object" || Array.isArray(rating)) {
      errors.push(`${prefix} must be an object.`);
      return;
    }
    const normalized = {
      ...rating,
      rating_id: cleanId(rating.rating_id),
      position_id: cleanId(rating.position_id),
      critique_id: cleanId(rating.critique_id),
      rater_id: cleanId(rating.rater_id),
      stage: String(rating.stage ?? ""),
    };
    if (!controlledId(normalized.rating_id)) errors.push(`${prefix}.rating_id must be a controlled identifier.`);
    if (ratingById.has(normalized.rating_id)) errors.push(`${prefix}.rating_id must be unique.`);
    if (!positionById.has(normalized.position_id)) errors.push(`${prefix}.position_id must reference a known position.`);
    if (critiqueToPosition.get(normalized.critique_id) !== normalized.position_id) {
      errors.push(`${prefix}.critique_id must belong to its position.`);
    }
    if (!controlledId(normalized.rater_id)) errors.push(`${prefix}.rater_id must be a controlled pseudonymous identifier.`);
    if (!ENDPOINT_STAGES.includes(normalized.stage)) errors.push(`${prefix}.stage is unsupported.`);
    if (!Number.isInteger(normalized.version) || normalized.version < 1) errors.push(`${prefix}.version must be a positive integer.`);
    if (normalized.rubric_version !== "rubric-v2-seven-dimensional") {
      errors.push(`${prefix}.rubric_version must equal rubric-v2-seven-dimensional.`);
    }
    validateScores(normalized.scores, `${prefix}.scores`, errors);
    if (!nonEmptyString(normalized.overall_rationale)) errors.push(`${prefix}.overall_rationale is required.`);
    if (!unitInterval(normalized.confidence)) errors.push(`${prefix}.confidence must lie in [0,1].`);
    if (!Number.isInteger(normalized.time_spent_seconds) || normalized.time_spent_seconds <= 0) {
      errors.push(`${prefix}.time_spent_seconds must be a positive integer.`);
    }
    if (normalized.accepted !== true && normalized.accepted !== false) errors.push(`${prefix}.accepted must be boolean.`);
    if (!validIsoTimestamp(normalized.locked_at)) errors.push(`${prefix}.locked_at must be a valid ISO timestamp.`);

    if (normalized.stage === "initial") validateInitialRecord(normalized, prefix, requireEndpointV1, errors);
    if (normalized.stage === "blind_self_check") validateSelfCheckShape(normalized, prefix, errors);
    if (normalized.stage === "rerating") validateReratingShape(normalized, prefix, errors);

    normalizedRatings.push(normalized);
    if (normalized.rating_id) ratingById.set(normalized.rating_id, normalized);
  });

  for (const rating of normalizedRatings) {
    if (rating.stage === "initial") continue;
    const predecessor = ratingById.get(cleanId(rating.predecessor_rating_id));
    if (!predecessor) {
      errors.push(`${rating.rating_id} predecessor_rating_id does not exist.`);
      continue;
    }
    for (const field of ["position_id", "critique_id", "rater_id"]) {
      if (predecessor[field] !== rating[field]) errors.push(`${rating.rating_id} predecessor must match ${field}.`);
    }
    if (!predecessor.accepted) errors.push(`${rating.rating_id} predecessor must be accepted.`);
    if (Date.parse(predecessor.locked_at) >= Date.parse(rating.locked_at)) {
      errors.push(`${rating.rating_id} must lock after its predecessor.`);
    }
    if (rating.stage === "blind_self_check") {
      if (predecessor.stage !== "initial" || predecessor.version !== 1 || rating.version !== 2) {
        errors.push(`${rating.rating_id} blind self-check must be version 2 directly linked to an initial version 1 record.`);
      }
      const changed = scoresDiffer(predecessor.scores, rating.scores);
      if (rating.scores_changed !== changed) errors.push(`${rating.rating_id}.scores_changed must match the stored score vectors.`);
      if (changed && !nonEmptyString(rating.object_level_revision_reason)) {
        errors.push(`${rating.rating_id} changed self-check requires an object-level revision reason.`);
      }
      if (!changed && rating.object_level_revision_reason !== null && String(rating.object_level_revision_reason ?? "").trim() !== "") {
        errors.push(`${rating.rating_id} unchanged self-check must not fabricate a revision reason.`);
      }
    }
  }

  validateOneInitialPerRaterCritique(normalizedRatings, errors);
  validateFingerprintConsistency(normalizedRatings, requireEndpointV1, errors);
  const initialRatings = normalizedRatings.filter((row) => row.stage === "initial" && row.accepted === true);
  const selfChecks = normalizedRatings.filter((row) => row.stage === "blind_self_check" && row.accepted === true);
  if (requireComplete) validateCompleteEndpoint(positionById, critiqueToPosition, initialRatings, selfChecks, errors);

  return {
    status: errors.length ? "fail" : "pass",
    dataset_id: dataset?.dataset_id ?? null,
    data_class: dataset?.data_class ?? null,
    positions: positionById.size,
    critiques: critiqueToPosition.size,
    ratings: normalizedRatings.length,
    accepted_initial_ratings: initialRatings.length,
    accepted_blind_self_checks: selfChecks.length,
    complete_endpoint_required: requireComplete,
    endpoint_v1_fields_required: requireEndpointV1,
    errors,
  };
}

export function correctedWithinPositionOrderingAgreement(rowsA, rowsB, options = {}) {
  const minimumPairWeight = finiteNonNegative(options.minimumPairWeight ?? 0, "minimumPairWeight");
  const pairs = matchCritiques(rowsA, rowsB, "a", "b");
  let unweightedSum = 0;
  let unweightedCount = 0;
  let weightedSum = 0;
  let weightSum = 0;
  const pairResults = [];

  for (let left = 0; left < pairs.length; left += 1) {
    for (let right = left + 1; right < pairs.length; right += 1) {
      const deltaA = pairs[left].a.scores.overall - pairs[right].a.scores.overall;
      const deltaB = pairs[left].b.scores.overall - pairs[right].b.scores.overall;
      const directionA = direction(deltaA);
      const directionB = direction(deltaB);
      const agreement = directionA === directionB ? 1 : directionA === 0 || directionB === 0 ? 0.5 : 0;
      const weight = (Math.abs(deltaA) + Math.abs(deltaB)) / 2;
      unweightedSum += agreement;
      unweightedCount += 1;
      if (weight + EPSILON >= minimumPairWeight && weight > EPSILON) {
        weightedSum += weight * agreement;
        weightSum += weight;
      }
      pairResults.push({
        left_critique_id: pairs[left].critique_id,
        right_critique_id: pairs[right].critique_id,
        delta_rater_a: deltaA,
        delta_rater_b: deltaB,
        agreement,
        weight,
        strong_reversal_preserved: directionA !== 0 && directionB !== 0 && directionA !== directionB && weight > 0,
      });
    }
  }

  return {
    comparison_count: unweightedCount,
    unweighted_agreement: unweightedCount ? unweightedSum / unweightedCount : null,
    weighted_eligible_pair_count: pairResults.filter((row) => row.weight + EPSILON >= minimumPairWeight && row.weight > EPSILON).length,
    weight_sum: weightSum,
    weighted_agreement: weightSum > 0 ? weightedSum / weightSum : null,
    minimum_pair_weight: minimumPairWeight,
    weight_definition: "average_absolute_within_rater_overall_gap",
    mean_score_gap_weight_forbidden: true,
    pair_results: pairResults,
  };
}

export function symmetricLmcaHumanDiscrepancy(ratingA, ratingB) {
  const forward = lmcaCustomWeightedLoss(ratingA, ratingB);
  const reverse = lmcaCustomWeightedLoss(ratingB, ratingA);
  return {
    discrepancy: (forward + reverse) / 2,
    forward,
    reverse,
    mixed_clarity_branch: (ratingA.scores.clarity < 0.5) !== (ratingB.scores.clarity < 0.5),
    classification: "Metaphilosophy symmetric extension of the directional LMCA custom loss",
  };
}

export function analyzePilotEndpointDataset(dataset, options = {}) {
  const validation = validatePilotEndpointDataset(dataset, {
    requireComplete: options.requireComplete === true,
    requireEndpointV1: options.requireEndpointV1 !== false,
  });
  if (validation.status !== "pass") {
    throw new PilotEndpointAnalysisError(`Pilot endpoint dataset is invalid:\n${validation.errors.join("\n")}`, { validation });
  }

  const policy = objectOrEmpty(options.policy);
  const initial = dataset.ratings.filter((row) => row.stage === "initial" && row.accepted === true);
  const selfChecks = dataset.ratings.filter((row) => row.stage === "blind_self_check" && row.accepted === true);
  const reratings = dataset.ratings.filter((row) => row.stage === "rerating" && row.accepted === true);
  const initialByPosition = groupBy(initial, (row) => row.position_id);
  const positionResults = [];

  for (const position of dataset.positions) {
    const rows = initialByPosition.get(position.position_id) ?? [];
    const byRater = groupBy(rows, (row) => row.rater_id);
    const raterIds = [...byRater.keys()].sort();
    if (raterIds.length !== 2) {
      positionResults.push({
        position_id: position.position_id,
        complete_pair: false,
        critique_count: normalizeIds(position.critique_ids).length,
        rater_count: raterIds.length,
      });
      continue;
    }
    const matched = matchCritiques(byRater.get(raterIds[0]), byRater.get(raterIds[1]), "a", "b");
    const critiqueResults = matched.map((pair) => {
      const symmetric = symmetricLmcaHumanDiscrepancy(pair.a, pair.b);
      return {
        critique_id: pair.critique_id,
        overall_gap: Math.abs(pair.a.scores.overall - pair.b.scores.overall),
        impact_gap: Math.abs(strengthTimesCentrality(pair.a) - strengthTimesCentrality(pair.b)),
        clarity_gap: Math.abs(pair.a.scores.clarity - pair.b.scores.clarity),
        correctness_gap: Math.abs(pair.a.scores.correctness - pair.b.scores.correctness),
        symmetric_lmca_style_discrepancy: symmetric.discrepancy,
        mixed_clarity_branch: symmetric.mixed_clarity_branch,
        item_integrity_flagged: Boolean(
          pair.a.insufficient_context
          || pair.b.insufficient_context
          || normalizeIds(pair.a.item_integrity_flags).length
          || normalizeIds(pair.b.item_integrity_flags).length
        ),
      };
    });
    const ordering = correctedWithinPositionOrderingAgreement(byRater.get(raterIds[0]), byRater.get(raterIds[1]), {
      minimumPairWeight: policy.diagnostic_minimum_pair_weight ?? 0,
    });
    positionResults.push({
      position_id: position.position_id,
      complete_pair: matched.length === 4,
      critique_count: matched.length,
      rater_ids: raterIds,
      mean_overall_gap: mean(critiqueResults.map((row) => row.overall_gap)),
      mean_impact_gap: mean(critiqueResults.map((row) => row.impact_gap)),
      mean_symmetric_lmca_style_discrepancy: mean(critiqueResults.map((row) => row.symmetric_lmca_style_discrepancy)),
      mixed_clarity_critique_count: critiqueResults.filter((row) => row.mixed_clarity_branch).length,
      item_integrity_flagged_critique_count: critiqueResults.filter((row) => row.item_integrity_flagged).length,
      unweighted_ordering_agreement: ordering.unweighted_agreement,
      weighted_ordering_agreement: ordering.weighted_agreement,
      ordering_weight_sum: ordering.weight_sum,
      ordering_comparison_count: ordering.comparison_count,
      critique_results: critiqueResults,
    });
  }

  const completePositions = positionResults.filter((row) => row.complete_pair);
  const overallValues = completePositions.map((row) => row.mean_overall_gap);
  const impactValues = completePositions.map((row) => row.mean_impact_gap);
  const symmetricValues = completePositions.map((row) => row.mean_symmetric_lmca_style_discrepancy);
  const unweightedOrderingValues = completePositions.map((row) => row.unweighted_ordering_agreement).filter(Number.isFinite);
  const weightedOrderingValues = completePositions.map((row) => row.weighted_ordering_agreement).filter(Number.isFinite);
  const initialTimes = initial.map((row) => row.time_spent_seconds);
  const selfCheckTimes = selfChecks.map((row) => row.time_spent_seconds);
  const stageChange = analyzeSelfCheckChanges(initial, selfChecks);

  return {
    report_version: "pilot-endpoint-analysis-v1",
    programme_id: dataset.programme_id,
    data_class: dataset.data_class,
    endpoint_contract_id: "mp-pilot-endpoint-design-amendment-v1",
    snapshot: "accepted_blind_initial",
    diagnostic_only: true,
    primary_model_result: false,
    population_inference_authorized: false,
    population_confidence_interval_authorized: false,
    null_hypothesis_primary_tests_authorized: false,
    scientific_numerical_pass_threshold: null,
    automatic_phase_2_authorized: false,
    public_benchmark_authorized: false,
    reliability_weighting_used: false,
    imputation_used: false,
    validation,
    primary: {
      P1_blind_initial_disagreement_profile: {
        position_is_primary_aggregation_unit: true,
        position_count: completePositions.length,
        overall_gap: distributionAndPositionSummary(overallValues),
        impact_gap: distributionAndPositionSummary(impactValues),
        position_mean_values: completePositions.map((row) => ({
          position_id: row.position_id,
          mean_overall_gap: row.mean_overall_gap,
          mean_impact_gap: row.mean_impact_gap,
        })),
      },
      P2_interpretation_linkage: options.interpretationCauseAnalysis?.analysis ?? null,
      P3_operational_feasibility_and_burden: {
        accepted_initial_ratings: initial.length,
        planned_initial_ratings: 96,
        accepted_blind_self_checks: selfChecks.length,
        planned_blind_self_checks: 24,
        accepted_reratings: reratings.length,
        complete_paired_critiques: countCompleteCritiques(initial),
        planned_paired_critiques: 48,
        complete_position_blocks: completePositions.length,
        planned_position_blocks: 12,
        initial_rating_time_seconds: distributionSummary(initialTimes),
        blind_self_check_time_seconds: distributionSummary(selfCheckTimes),
        total_initial_active_time_seconds: sum(initialTimes),
        total_self_check_active_time_seconds: sum(selfCheckTimes),
        self_check_change: stageChange,
        item_integrity_flagged_critiques: completePositions.reduce((total, row) => total + row.item_integrity_flagged_critique_count, 0),
        mixed_clarity_critiques: completePositions.reduce((total, row) => total + row.mixed_clarity_critique_count, 0),
        lmca_five_to_fifteen_minute_range_is_a_pass_threshold: false,
      },
    },
    secondary: {
      S1_symmetric_lmca_style_discrepancy: {
        classification: "Metaphilosophy extension, not LMCA ground-truth error",
        distribution: distributionAndPositionSummary(symmetricValues),
        mixed_clarity_pairs_reported_separately: true,
      },
      S2_within_position_ordering_robustness: {
        unweighted_reported_first: true,
        position_unweighted_agreement: distributionAndPositionSummary(unweightedOrderingValues),
        position_weighted_agreement: distributionAndPositionSummary(weightedOrderingValues),
        weight_definition: "average_absolute_within_rater_overall_gap",
        mean_score_gap_weight_forbidden: true,
      },
      S3_stage_separated_change: {
        stages: ["blind_initial", "blind_self_check", "post_peer_or_post_evidence_revision", "adjudicated_latest_accepted", "unresolved"],
        self_check: stageChange,
        accepted_post_peer_or_post_evidence_reratings: reratings.length,
        causal_checking_claim_authorized: false,
        causal_discussion_claim_authorized: false,
      },
      S4_composition_and_aggregation_sensitivity: {
        leave_one_position_out: leaveOnePositionOut(completePositions),
        leave_one_rater_out: leaveOneRaterOut(completePositions),
        mean_vs_median: {
          overall_gap: { mean: mean(overallValues), median: median(overallValues) },
          impact_gap: { mean: mean(impactValues), median: median(impactValues) },
          symmetric_discrepancy: { mean: mean(symmetricValues), median: median(symmetricValues) },
        },
        reliability_weighting: false,
      },
    },
    position_results: positionResults,
    workload_readback: {
      initial_rating_records: initial.length,
      blind_self_check_records: selfChecks.length,
      interpretation_cause_code_records: options.interpretationCauseAnalysis?.analysis?.initial_code_count ?? null,
      current_adjudication_reserve_usd: 100,
      current_adjudication_reserve_changed: false,
      current_adjudication_reserve_shown_sufficient: false,
      workload_and_honorarium_reestimate_required_before_named_commitments: true,
    },
  };
}

export function sanitizePilotEndpointAnalysis(report) {
  const positions = [...(report.position_results ?? [])].sort((left, right) => String(left.position_id).localeCompare(String(right.position_id)));
  const blockByPosition = new Map(positions.map((row, index) => [row.position_id, `position_${String(index + 1).padStart(2, "0")}`]));
  const raterIds = [...new Set(positions.flatMap((row) => row.rater_ids ?? []))].sort();
  const raterBlockById = new Map(raterIds.map((id, index) => [id, `rater_${String(index + 1).padStart(2, "0")}`]));
  const publicReport = {
    report_version: "pilot-endpoint-analysis-public-v1",
    programme_id: report.programme_id,
    data_class: report.data_class,
    endpoint_contract_id: report.endpoint_contract_id,
    snapshot: report.snapshot,
    diagnostic_only: true,
    primary_model_result: false,
    population_inference_authorized: false,
    population_confidence_interval_authorized: false,
    null_hypothesis_primary_tests_authorized: false,
    scientific_numerical_pass_threshold: null,
    automatic_phase_2_authorized: false,
    public_benchmark_authorized: false,
    reliability_weighting_used: false,
    imputation_used: false,
    validation: sanitizeValidation(report.validation),
    primary: {
      ...structuredClone(report.primary),
      P1_blind_initial_disagreement_profile: {
        ...structuredClone(report.primary.P1_blind_initial_disagreement_profile),
        position_mean_values: report.primary.P1_blind_initial_disagreement_profile.position_mean_values.map((row) => ({
          position_block: blockByPosition.get(row.position_id),
          mean_overall_gap: row.mean_overall_gap,
          mean_impact_gap: row.mean_impact_gap,
        })),
      },
    },
    secondary: {
      ...structuredClone(report.secondary),
      S4_composition_and_aggregation_sensitivity: {
        ...structuredClone(report.secondary.S4_composition_and_aggregation_sensitivity),
        leave_one_position_out: sanitizePositionDeletion(report.secondary.S4_composition_and_aggregation_sensitivity.leave_one_position_out, blockByPosition),
        leave_one_rater_out: sanitizeRaterDeletion(report.secondary.S4_composition_and_aggregation_sensitivity.leave_one_rater_out, raterBlockById),
      },
    },
    position_results: positions.map((row) => ({
      position_block: blockByPosition.get(row.position_id),
      complete_pair: row.complete_pair,
      critique_count: row.critique_count,
      rater_count: Array.isArray(row.rater_ids) ? row.rater_ids.length : row.rater_count,
      mean_overall_gap: row.mean_overall_gap,
      mean_impact_gap: row.mean_impact_gap,
      mean_symmetric_lmca_style_discrepancy: row.mean_symmetric_lmca_style_discrepancy,
      mixed_clarity_critique_count: row.mixed_clarity_critique_count,
      item_integrity_flagged_critique_count: row.item_integrity_flagged_critique_count,
      unweighted_ordering_agreement: row.unweighted_ordering_agreement,
      weighted_ordering_agreement: row.weighted_ordering_agreement,
      ordering_weight_sum: row.ordering_weight_sum,
      ordering_comparison_count: row.ordering_comparison_count,
    })),
    workload_readback: report.workload_readback,
    privacy: {
      contains_dataset_id: false,
      contains_item_ids: false,
      contains_rater_ids: false,
      contains_rating_ids: false,
      contains_fingerprint_text: false,
      contains_rationales: false,
    },
  };
  assertPublicPilotEndpointAnalysis(publicReport);
  return publicReport;
}

export function assertPublicPilotEndpointAnalysis(report) {
  const forbidden = findKeys(report, FORBIDDEN_PUBLIC_KEYS);
  if (forbidden.length) throw new PilotEndpointAnalysisError(`Public endpoint report exposes controlled fields: ${forbidden.join(", ")}`);
  for (const key of [
    "population_inference_authorized",
    "population_confidence_interval_authorized",
    "null_hypothesis_primary_tests_authorized",
    "automatic_phase_2_authorized",
    "public_benchmark_authorized",
    "reliability_weighting_used",
    "imputation_used",
  ]) {
    if (report?.[key] !== false) throw new PilotEndpointAnalysisError(`Public endpoint report ${key} must remain false.`);
  }
  if (report?.primary_model_result !== false || report?.scientific_numerical_pass_threshold !== null) {
    throw new PilotEndpointAnalysisError("Public endpoint report must not contain a primary model result or scientific pass threshold.");
  }
  return true;
}

function validateInitialRecord(row, prefix, requireEndpointV1, errors) {
  if (row.version !== 1) errors.push(`${prefix} initial rating must use version 1.`);
  if (row.predecessor_rating_id !== null) errors.push(`${prefix} initial predecessor_rating_id must be null.`);
  if (row.object_level_revision_reason !== null) errors.push(`${prefix} initial object_level_revision_reason must be null.`);
  if (requireEndpointV1) {
    if (!textWithin(row.position_conclusion_summary, 10, 2000)) {
      errors.push(`${prefix}.position_conclusion_summary must contain 10-2000 characters.`);
    }
    if (!textWithin(row.critique_target_summary, 10, 2000)) {
      errors.push(`${prefix}.critique_target_summary must contain 10-2000 characters.`);
    }
    if (!PRICED_IN_ASSESSMENTS.includes(row.priced_in_assessment)) errors.push(`${prefix}.priced_in_assessment is unsupported.`);
    if (!INTERPRETATION_CONFIDENCE_OPTIONS.includes(row.interpretation_confidence)) {
      errors.push(`${prefix}.interpretation_confidence is unsupported.`);
    }
    const background = String(row.background_assumptions ?? "").trim();
    if (background.length > 4000) errors.push(`${prefix}.background_assumptions exceeds 4000 characters.`);
    if ((row.interpretation_confidence === "low" || row.priced_in_assessment === "uncertain") && background.length < 10) {
      errors.push(`${prefix}.background_assumptions is required for low confidence or uncertain priced-in status.`);
    }
    for (const field of ["position_ambiguity", "critique_ambiguity", "insufficient_context"]) {
      if (typeof row[field] !== "boolean") errors.push(`${prefix}.${field} must be boolean.`);
    }
    if (row.interpretation_fingerprint_locked_before_peer_exposure !== true) {
      errors.push(`${prefix}.interpretation_fingerprint_locked_before_peer_exposure must equal true.`);
    }
  }
}

function validateSelfCheckShape(row, prefix, errors) {
  if (row.version !== 2) errors.push(`${prefix} blind self-check must use version 2.`);
  if (!controlledId(row.predecessor_rating_id)) errors.push(`${prefix} blind self-check requires predecessor_rating_id.`);
  if (!controlledId(row.self_check_selection_record_id)) errors.push(`${prefix}.self_check_selection_record_id is required.`);
  if (typeof row.scores_changed !== "boolean") errors.push(`${prefix}.scores_changed must be boolean.`);
  if (row.initial_rating_preserved !== true) errors.push(`${prefix}.initial_rating_preserved must equal true.`);
  for (const field of SELF_CHECK_EXPOSURE_FIELDS) {
    if (row.exposure_attestation?.[field] !== false) errors.push(`${prefix}.exposure_attestation.${field} must equal false.`);
  }
}

function validateReratingShape(row, prefix, errors) {
  if (row.version < 2) errors.push(`${prefix} rerating version must be at least 2.`);
  if (!controlledId(row.predecessor_rating_id)) errors.push(`${prefix} rerating requires predecessor_rating_id.`);
  if (!nonEmptyString(row.object_level_revision_reason)) errors.push(`${prefix} rerating requires an object-level revision reason.`);
}

function validateOneInitialPerRaterCritique(ratings, errors) {
  const byChain = groupBy(ratings, (row) => `${row.position_id}|${row.critique_id}|${row.rater_id}`);
  for (const [key, rows] of byChain) {
    const initials = rows.filter((row) => row.stage === "initial");
    if (initials.length !== 1) errors.push(`${key} must contain exactly one initial rating record.`);
    const versions = rows.map((row) => row.version).filter(Number.isInteger).sort((left, right) => left - right);
    if (new Set(versions).size !== versions.length) errors.push(`${key} rating versions must be unique.`);
  }
}

function validateFingerprintConsistency(ratings, requireEndpointV1, errors) {
  if (!requireEndpointV1) return;
  const initials = ratings.filter((row) => row.stage === "initial" && row.accepted === true);
  const byRaterPosition = groupBy(initials, (row) => `${row.rater_id}|${row.position_id}`);
  for (const [key, rows] of byRaterPosition) {
    const summaries = new Set(rows.map((row) => String(row.position_conclusion_summary ?? "").trim()));
    if (summaries.size !== 1) errors.push(`${key} must preserve one position_conclusion_summary across all sibling critiques.`);
    const lockTimes = rows.map((row) => Date.parse(row.locked_at)).filter(Number.isFinite);
    if (lockTimes.length === rows.length) {
      const earliest = Math.min(...lockTimes);
      for (const row of rows) {
        if (!validIsoTimestamp(row.position_conclusion_locked_at)) {
          errors.push(`${row.rating_id}.position_conclusion_locked_at must be a valid ISO timestamp.`);
        } else if (Date.parse(row.position_conclusion_locked_at) > earliest) {
          errors.push(`${key} position conclusion must be locked before the first sibling initial rating.`);
        }
      }
    }
  }
}

function validateCompleteEndpoint(positionById, critiqueToPosition, initial, selfChecks, errors) {
  if (positionById.size !== COMPLETE.positions) errors.push(`Complete endpoint pilot must contain ${COMPLETE.positions} positions.`);
  if (critiqueToPosition.size !== COMPLETE.critiques) errors.push(`Complete endpoint pilot must contain ${COMPLETE.critiques} critiques.`);
  if (initial.length !== COMPLETE.initialRatings) errors.push(`Complete endpoint pilot must contain ${COMPLETE.initialRatings} accepted blind initial ratings.`);
  if (selfChecks.length !== COMPLETE.selfChecks) errors.push(`Complete endpoint pilot must contain ${COMPLETE.selfChecks} accepted blind self-check records.`);

  const initialByCritique = groupBy(initial, (row) => row.critique_id);
  for (const critiqueId of critiqueToPosition.keys()) {
    const rows = initialByCritique.get(critiqueId) ?? [];
    if (rows.length !== 2 || new Set(rows.map((row) => row.rater_id)).size !== 2) {
      errors.push(`${critiqueId} must have exactly two distinct accepted blind initial raters.`);
    }
  }
  const initialByPosition = groupBy(initial, (row) => row.position_id);
  for (const [positionId, position] of positionById) {
    const rows = initialByPosition.get(positionId) ?? [];
    const raters = [...new Set(rows.map((row) => row.rater_id))];
    if (raters.length !== 2) errors.push(`${positionId} must have exactly two initial raters across all sibling critiques.`);
    for (const raterId of raters) {
      const rated = new Set(rows.filter((row) => row.rater_id === raterId).map((row) => row.critique_id));
      if (normalizeIds(position.critique_ids).some((critiqueId) => !rated.has(critiqueId))) {
        errors.push(`${positionId} must keep all four sibling critiques with the same rater pair.`);
      }
    }
  }
  const initialByRater = groupBy(initial, (row) => row.rater_id);
  if (initialByRater.size !== COMPLETE.coreRaters) errors.push(`Complete endpoint pilot must contain ${COMPLETE.coreRaters} core raters.`);
  for (const [raterId, rows] of initialByRater) {
    if (rows.length !== COMPLETE.initialRatingsPerRater) errors.push(`${raterId} must have ${COMPLETE.initialRatingsPerRater} accepted initial ratings.`);
  }
  validateCompleteSelfCheckBalance(selfChecks, initialByCritique, errors);
}

function validateCompleteSelfCheckBalance(selfChecks, initialByCritique, errors) {
  const byCritique = groupBy(selfChecks, (row) => row.critique_id);
  const selectedPositions = new Set(selfChecks.map((row) => row.position_id));
  const selectedCritiques = new Set(selfChecks.map((row) => `${row.position_id}|${row.critique_id}`));
  const byRater = groupBy(selfChecks, (row) => row.rater_id);
  const positionsByRater = new Map();

  if (selectedPositions.size !== COMPLETE.selectedPositions) errors.push("Blind self-checks must cover exactly six positions.");
  if (selectedCritiques.size !== COMPLETE.selectedCritiques) errors.push("Blind self-checks must cover exactly twelve selected critiques.");
  for (const [critiqueId, rows] of byCritique) {
    if (rows.length !== 2 || new Set(rows.map((row) => row.rater_id)).size !== 2) {
      errors.push(`${critiqueId} selected self-check critique must be checked by both original raters.`);
    }
    const originalRaters = new Set((initialByCritique.get(critiqueId) ?? []).map((row) => row.rater_id));
    if (rows.some((row) => !originalRaters.has(row.rater_id))) errors.push(`${critiqueId} self-check contains a non-original rater.`);
  }
  const critiquesByPosition = groupBy([...selectedCritiques], (key) => key.split("|")[0]);
  for (const [positionId, keys] of critiquesByPosition) {
    if (keys.length !== 2) errors.push(`${positionId} must contain exactly two selected self-check critiques.`);
  }
  if (byRater.size !== 6) errors.push("Blind self-checks must involve all six core raters.");
  for (const [raterId, rows] of byRater) {
    if (rows.length !== 4) errors.push(`${raterId} must have exactly four blind self-check records.`);
    if (!positionsByRater.has(raterId)) positionsByRater.set(raterId, new Set());
    rows.forEach((row) => positionsByRater.get(raterId).add(row.position_id));
    if (positionsByRater.get(raterId).size !== 2) errors.push(`${raterId} must appear in exactly two selected self-check positions.`);
  }
}

function analyzeSelfCheckChanges(initialRatings, selfChecks) {
  const initialById = new Map(initialRatings.map((row) => [row.rating_id, row]));
  const changes = [];
  for (const selfCheck of selfChecks) {
    const predecessor = initialById.get(selfCheck.predecessor_rating_id);
    if (!predecessor) continue;
    changes.push({
      overall_change: selfCheck.scores.overall - predecessor.scores.overall,
      absolute_overall_change: Math.abs(selfCheck.scores.overall - predecessor.scores.overall),
      impact_change: strengthTimesCentrality(selfCheck) - strengthTimesCentrality(predecessor),
      absolute_impact_change: Math.abs(strengthTimesCentrality(selfCheck) - strengthTimesCentrality(predecessor)),
      changed: scoresDiffer(predecessor.scores, selfCheck.scores),
      time_spent_seconds: selfCheck.time_spent_seconds,
    });
  }
  return {
    record_count: changes.length,
    changed_record_count: changes.filter((row) => row.changed).length,
    unchanged_record_count: changes.filter((row) => !row.changed).length,
    absolute_overall_change: distributionSummary(changes.map((row) => row.absolute_overall_change)),
    absolute_impact_change: distributionSummary(changes.map((row) => row.absolute_impact_change)),
    signed_overall_change_mean: mean(changes.map((row) => row.overall_change)),
    signed_impact_change_mean: mean(changes.map((row) => row.impact_change)),
    time_spent_seconds: distributionSummary(changes.map((row) => row.time_spent_seconds)),
    population_level_causal_checking_claim_authorized: false,
  };
}

function leaveOnePositionOut(positionResults) {
  const rows = positionResults.map((omitted) => {
    const retained = positionResults.filter((row) => row.position_id !== omitted.position_id);
    return {
      omitted_position_id: omitted.position_id,
      retained_position_count: retained.length,
      mean_overall_gap: mean(retained.map((row) => row.mean_overall_gap)),
      mean_impact_gap: mean(retained.map((row) => row.mean_impact_gap)),
      mean_symmetric_discrepancy: mean(retained.map((row) => row.mean_symmetric_lmca_style_discrepancy)),
      mean_unweighted_ordering_agreement: mean(retained.map((row) => row.unweighted_ordering_agreement)),
    };
  });
  return {
    unit: "position",
    summaries: rows,
    ranges: summarizeDeletionRanges(rows),
  };
}

function leaveOneRaterOut(positionResults) {
  const raters = [...new Set(positionResults.flatMap((row) => row.rater_ids ?? []))].sort();
  const rows = raters.map((raterId) => {
    const retained = positionResults.filter((row) => !row.rater_ids.includes(raterId));
    return {
      omitted_rater_id: raterId,
      retained_position_count: retained.length,
      expected_retained_position_count: 8,
      mean_overall_gap: mean(retained.map((row) => row.mean_overall_gap)),
      mean_impact_gap: mean(retained.map((row) => row.mean_impact_gap)),
      mean_symmetric_discrepancy: mean(retained.map((row) => row.mean_symmetric_lmca_style_discrepancy)),
      mean_unweighted_ordering_agreement: mean(retained.map((row) => row.unweighted_ordering_agreement)),
    };
  });
  return {
    unit: "rater",
    summaries: rows,
    ranges: summarizeDeletionRanges(rows),
  };
}

function summarizeDeletionRanges(rows) {
  return {
    retained_position_count: numericRange(rows.map((row) => row.retained_position_count)),
    mean_overall_gap: numericRange(rows.map((row) => row.mean_overall_gap)),
    mean_impact_gap: numericRange(rows.map((row) => row.mean_impact_gap)),
    mean_symmetric_discrepancy: numericRange(rows.map((row) => row.mean_symmetric_discrepancy)),
    mean_unweighted_ordering_agreement: numericRange(rows.map((row) => row.mean_unweighted_ordering_agreement)),
  };
}

function distributionAndPositionSummary(values) {
  return {
    ...distributionSummary(values),
    full_range: numericRange(values),
    headline_population_confidence_interval: null,
    interpretation: "finite-pilot descriptive and deletion-sensitivity evidence",
  };
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

function sanitizeValidation(validation) {
  return {
    status: validation.status,
    data_class: validation.data_class,
    positions: validation.positions,
    critiques: validation.critiques,
    ratings: validation.ratings,
    accepted_initial_ratings: validation.accepted_initial_ratings,
    accepted_blind_self_checks: validation.accepted_blind_self_checks,
    complete_endpoint_required: validation.complete_endpoint_required,
    endpoint_v1_fields_required: validation.endpoint_v1_fields_required,
    errors: validation.errors,
  };
}

function sanitizePositionDeletion(value, blockByPosition) {
  return {
    unit: value.unit,
    summaries: value.summaries.map((row) => ({
      omitted_position_block: blockByPosition.get(row.omitted_position_id),
      retained_position_count: row.retained_position_count,
      mean_overall_gap: row.mean_overall_gap,
      mean_impact_gap: row.mean_impact_gap,
      mean_symmetric_discrepancy: row.mean_symmetric_discrepancy,
      mean_unweighted_ordering_agreement: row.mean_unweighted_ordering_agreement,
    })),
    ranges: value.ranges,
  };
}

function sanitizeRaterDeletion(value, raterBlockById) {
  return {
    unit: value.unit,
    summaries: value.summaries.map((row) => ({
      omitted_rater_block: raterBlockById.get(row.omitted_rater_id),
      retained_position_count: row.retained_position_count,
      expected_retained_position_count: row.expected_retained_position_count,
      mean_overall_gap: row.mean_overall_gap,
      mean_impact_gap: row.mean_impact_gap,
      mean_symmetric_discrepancy: row.mean_symmetric_discrepancy,
      mean_unweighted_ordering_agreement: row.mean_unweighted_ordering_agreement,
    })),
    ranges: value.ranges,
  };
}

function countCompleteCritiques(initial) {
  return [...groupBy(initial, (row) => `${row.position_id}|${row.critique_id}`).values()]
    .filter((rows) => rows.length === 2 && new Set(rows.map((row) => row.rater_id)).size === 2)
    .length;
}

function matchCritiques(rowsA, rowsB, labelA, labelB) {
  const left = new Map((rowsA ?? []).map((row) => [row.critique_id, row]));
  const right = new Map((rowsB ?? []).map((row) => [row.critique_id, row]));
  const ids = [...left.keys()].filter((id) => right.has(id)).sort();
  if (ids.length !== left.size || ids.length !== right.size) throw new PilotEndpointAnalysisError("Rating sets must contain identical critique IDs.");
  return ids.map((id) => ({ critique_id: id, [labelA]: left.get(id), [labelB]: right.get(id) }));
}

function validateScores(scores, prefix, errors) {
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) {
    errors.push(`${prefix} must be an object.`);
    return;
  }
  for (const dimension of ENDPOINT_RATING_DIMENSIONS) {
    if (!unitInterval(scores[dimension])) errors.push(`${prefix}.${dimension} must lie in [0,1].`);
  }
}

function scoresDiffer(left, right) {
  return ENDPOINT_RATING_DIMENSIONS.some((dimension) => Math.abs(Number(left?.[dimension]) - Number(right?.[dimension])) > EPSILON);
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

function median(values) {
  const normalized = values.filter(Number.isFinite).sort((left, right) => left - right);
  return normalized.length ? quantile(normalized, 0.5) : null;
}

function numericRange(values) {
  const normalized = values.filter(Number.isFinite);
  return normalized.length ? { minimum: Math.min(...normalized), maximum: Math.max(...normalized) } : null;
}

function mean(values) {
  const normalized = values.filter(Number.isFinite);
  return normalized.length ? sum(normalized) / normalized.length : null;
}

function sum(values) {
  return values.filter(Number.isFinite).reduce((total, value) => total + value, 0);
}

function direction(value) {
  if (Math.abs(value) <= EPSILON) return 0;
  return value > 0 ? 1 : -1;
}

function finiteNonNegative(value, label) {
  if (!Number.isFinite(value) || value < 0) throw new PilotEndpointAnalysisError(`${label} must be a finite non-negative number.`);
  return value;
}

function textWithin(value, minimum, maximum) {
  return typeof value === "string" && value.trim().length >= minimum && value.trim().length <= maximum;
}

function controlledId(value) {
  return nonEmptyString(value) && !/\s|@/.test(value);
}

function unitInterval(value) {
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

function findKeys(value, forbiddenKeys, path = "$") {
  const found = [];
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => found.push(...findKeys(entry, forbiddenKeys, `${path}[${index}]`)));
    return found;
  }
  for (const [key, entry] of Object.entries(value)) {
    const keyPath = `${path}.${key}`;
    if (forbiddenKeys.has(key)) found.push(keyPath);
    found.push(...findKeys(entry, forbiddenKeys, keyPath));
  }
  return found;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help") || process.argv.length < 3) {
    console.log("Usage: node scripts/pilot-endpoint-analysis-v1.mjs <rating-dataset.json> [interpretation-cause-analysis.json]");
  } else {
    const dataset = JSON.parse(await readFile(resolve(process.argv[2]), "utf8"));
    const causeAnalysis = process.argv[3] ? JSON.parse(await readFile(resolve(process.argv[3]), "utf8")) : null;
    const report = analyzePilotEndpointDataset(dataset, {
      requireComplete: true,
      requireEndpointV1: true,
      interpretationCauseAnalysis: causeAnalysis,
    });
    console.log(JSON.stringify(sanitizePilotEndpointAnalysis(report), null, 2));
  }
}
