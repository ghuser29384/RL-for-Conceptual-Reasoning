import {
  analyzePilotRatingDataset,
  selectRatingSnapshot,
  validatePilotRatingDataset,
} from "./pilot-rating-analysis.mjs";
import { requireValidPilotAnalysisPolicy } from "./pilot-analysis-policy.mjs";

const FORBIDDEN_PUBLIC_KEYS = new Set([
  "dataset_id",
  "position_id",
  "critique_id",
  "rating_id",
  "rater_id",
  "rater_ids",
  "route_results",
]);

export function analyzePublicPilotRatingSnapshots(dataset, options = {}) {
  return analyzePilotRatingSnapshots(dataset, { ...options, audience: "public" });
}

export function analyzeControlledPilotRatingSnapshots(dataset, options = {}) {
  return analyzePilotRatingSnapshots(dataset, { ...options, audience: "controlled" });
}

export function analyzePilotRatingSnapshots(dataset, options = {}) {
  const audience = options.audience ?? "public";
  if (!new Set(["public", "controlled"]).has(audience)) throw new Error("audience must be public or controlled");

  const validation = validatePilotRatingDataset(dataset, { requireComplete: options.requireComplete === true });
  if (validation.status !== "pass") throw new Error(`Pilot rating dataset is invalid:\n${validation.errors.join("\n")}`);

  const policy = requireValidPilotAnalysisPolicy(options.policy ?? {});
  const initialControlled = normalizeControlledSnapshot(
    analyzePilotRatingDataset(dataset, { requireComplete: options.requireComplete === true, policy }),
    "accepted_initial_ratings",
  );
  const latestDataset = deriveLatestAcceptedAnalysisDataset(dataset);
  const latestControlled = normalizeControlledSnapshot(
    analyzePilotRatingDataset(latestDataset, { requireComplete: options.requireComplete === true, policy }),
    "latest_accepted_ratings",
  );

  const report = {
    report_version: "pilot-rating-analysis-snapshots-v1",
    programme_id: dataset.programme_id,
    data_class: dataset.data_class,
    report_view: audience === "public" ? "public_sanitized" : "controlled",
    diagnostic_only: true,
    numeric_thresholds_binding: false,
    phase_2_authorized: false,
    revision_summary: summarizeRevisionHistory(dataset),
    initial: audience === "public" ? sanitizePilotAnalysisReport(initialControlled) : initialControlled,
    latest_accepted: audience === "public" ? sanitizePilotAnalysisReport(latestControlled) : latestControlled,
  };

  if (audience === "public") assertPublicPilotAnalysisSnapshots(report);
  return report;
}

export function deriveLatestAcceptedAnalysisDataset(dataset) {
  const latest = selectRatingSnapshot(dataset, "latest_accepted");
  return {
    ...structuredClone(dataset),
    dataset_id: `${dataset.dataset_id}--derived-latest-accepted-snapshot`,
    ratings: latest.map((rating) => ({
      ...structuredClone(rating),
      stage: "initial",
      version: 1,
      predecessor_rating_id: null,
      operator_assigned: false,
      object_level_revision_reason: null,
    })),
  };
}

export function sanitizePilotAnalysisReport(report) {
  const controlledPositions = Array.isArray(report?.position_results) ? [...report.position_results] : [];
  controlledPositions.sort((left, right) => String(left.position_id).localeCompare(String(right.position_id)));
  const blockByPositionId = new Map(
    controlledPositions.map((position, index) => [position.position_id, `position_${String(index + 1).padStart(2, "0")}`]),
  );

  const positionResults = controlledPositions.map((position) => ({
    position_block: blockByPositionId.get(position.position_id),
    complete_pair: position.complete_pair,
    critique_count: position.critique_count,
    rater_count: Array.isArray(position.rater_ids) ? position.rater_ids.length : position.rater_count,
    weighted_ordering: position.weighted_ordering,
    mean_absolute_differences: position.mean_absolute_differences,
    consensus_overall_spread: position.consensus_overall_spread,
    critiques_with_candidate_routes: position.critiques_with_candidate_routes,
    critiques_with_operative_routes: position.critiques_with_operative_routes,
  }));

  const publicReport = {
    report_version: "pilot-rating-analysis-public-v1",
    programme_id: report.programme_id,
    data_class: report.data_class,
    report_view: "public_sanitized",
    snapshot: report.snapshot,
    diagnostic_only: true,
    numeric_thresholds_binding: false,
    phase_2_authorized: false,
    privacy: {
      contains_dataset_id: false,
      contains_controlled_position_or_critique_ids: false,
      contains_pseudonymous_rater_ids: false,
      contains_item_level_route_records: false,
    },
    validation: sanitizeValidation(report.validation),
    policy: report.policy,
    aggregate: normalizeAggregate(report.aggregate, report.snapshot),
    leave_one_position_out_ranges: sanitizeLeaveOnePositionOut(report.leave_one_position_out_ranges, blockByPositionId),
    position_results: positionResults,
    route_summary: summarizeRouteResults(report.route_results),
  };

  assertPublicPilotAnalysisReport(publicReport);
  return publicReport;
}

export function assertPublicPilotAnalysisReport(report) {
  const found = findKeys(report, FORBIDDEN_PUBLIC_KEYS);
  if (found.length) throw new Error(`Public pilot analysis report exposes controlled identifiers: ${found.join(", ")}`);
  if (report?.privacy?.contains_controlled_position_or_critique_ids !== false) {
    throw new Error("Public report must declare controlled item identifiers absent.");
  }
  if (report?.privacy?.contains_pseudonymous_rater_ids !== false) {
    throw new Error("Public report must declare pseudonymous rater identifiers absent.");
  }
  if (report?.privacy?.contains_item_level_route_records !== false) {
    throw new Error("Public report must declare item-level route records absent.");
  }
  return true;
}

export function assertPublicPilotAnalysisSnapshots(report) {
  assertPublicPilotAnalysisReport(report.initial);
  assertPublicPilotAnalysisReport(report.latest_accepted);
  const found = findKeys(report, FORBIDDEN_PUBLIC_KEYS);
  if (found.length) throw new Error(`Public snapshot package exposes controlled identifiers: ${found.join(", ")}`);
  if (report.phase_2_authorized !== false || report.diagnostic_only !== true) {
    throw new Error("Public snapshot package must remain diagnostic-only and unable to authorize Phase 2.");
  }
  return true;
}

function normalizeControlledSnapshot(report, snapshot) {
  return {
    ...report,
    report_view: "controlled",
    snapshot,
    aggregate: normalizeAggregate(report.aggregate, snapshot),
    privacy: {
      contains_dataset_id: true,
      contains_controlled_position_or_critique_ids: true,
      contains_pseudonymous_rater_ids: true,
      contains_item_level_route_records: true,
    },
  };
}

function normalizeAggregate(aggregate, snapshot) {
  const source = aggregate && typeof aggregate === "object" ? aggregate : {};
  const acceptedSnapshotRatings = source.accepted_snapshot_ratings ?? source.accepted_initial_ratings ?? 0;
  const acceptedSnapshotRatingTime =
    source.accepted_snapshot_rating_time_seconds ?? source.accepted_rating_time_seconds ?? null;
  const meanAbsoluteRaterDifference =
    source.mean_absolute_rater_difference_by_dimension ??
    source.mean_absolute_initial_rater_difference_by_dimension ??
    null;
  const totalCritiquesWithTwoSnapshotRatings =
    source.total_critiques_with_two_snapshot_ratings ??
    source.total_critiques_with_two_initial_ratings ??
    0;

  return {
    positions_with_complete_pairs: source.positions_with_complete_pairs ?? 0,
    accepted_snapshot_ratings: acceptedSnapshotRatings,
    accepted_snapshot_rating_time_seconds: acceptedSnapshotRatingTime,
    mean_position_weighted_ordering_agreement: source.mean_position_weighted_ordering_agreement ?? null,
    mean_absolute_rater_difference_by_dimension: meanAbsoluteRaterDifference,
    ...(snapshot === "accepted_initial_ratings"
      ? {
          accepted_initial_ratings: source.accepted_initial_ratings ?? acceptedSnapshotRatings,
          mean_absolute_initial_rater_difference_by_dimension:
            source.mean_absolute_initial_rater_difference_by_dimension ?? meanAbsoluteRaterDifference,
        }
      : {}),
    interval_krippendorff_alpha_by_dimension: source.interval_krippendorff_alpha_by_dimension ?? {},
    critiques_with_candidate_routes: source.critiques_with_candidate_routes ?? 0,
    critiques_with_operative_routes: source.critiques_with_operative_routes ?? 0,
    total_critiques_with_two_snapshot_ratings: totalCritiquesWithTwoSnapshotRatings,
  };
}

function sanitizeValidation(validation) {
  if (!validation) return null;
  return {
    status: validation.status,
    data_class: validation.data_class,
    positions: validation.positions,
    critiques: validation.critiques,
    ratings: validation.ratings,
    accepted_initial_ratings: validation.accepted_initial_ratings,
    complete_pilot_required: validation.complete_pilot_required,
    errors: validation.errors,
  };
}

function sanitizeLeaveOnePositionOut(value, blockByPositionId) {
  if (!value) return null;
  return {
    unit: value.unit,
    summaries: (Array.isArray(value.summaries) ? value.summaries : []).map((summary) => ({
      omitted_position_block: blockByPositionId.get(summary.omitted_position_id) ?? null,
      mean_weighted_ordering_agreement: summary.mean_weighted_ordering_agreement,
      mean_absolute_overall_difference: summary.mean_absolute_overall_difference,
      candidate_route_rate: summary.candidate_route_rate,
    })),
    ranges: value.ranges,
  };
}

function summarizeRouteResults(routeResults) {
  const rows = Array.isArray(routeResults) ? routeResults : [];
  const candidateCounts = {};
  const operativeCounts = {};
  for (const row of rows) {
    for (const entry of Array.isArray(row.candidate_routes) ? row.candidate_routes : []) {
      candidateCounts[entry.route] = (candidateCounts[entry.route] ?? 0) + 1;
    }
    for (const entry of Array.isArray(row.operative_routes) ? row.operative_routes : []) {
      operativeCounts[entry.route] = (operativeCounts[entry.route] ?? 0) + 1;
    }
  }
  return {
    item_level_records_withheld: true,
    critiques_evaluated: rows.length,
    critiques_with_candidate_routes: rows.filter((row) => row.candidate_routes?.length > 0).length,
    critiques_with_operative_routes: rows.filter((row) => row.operative_routes?.length > 0).length,
    candidate_route_counts: sortObject(candidateCounts),
    operative_route_counts: sortObject(operativeCounts),
  };
}

function summarizeRevisionHistory(dataset) {
  const ratings = Array.isArray(dataset?.ratings) ? dataset.ratings : [];
  const acceptedInitial = ratings.filter((rating) => rating.stage === "initial" && rating.accepted === true);
  const acceptedReratings = ratings.filter((rating) => rating.stage === "rerating" && rating.accepted === true);
  const revisedChains = new Set(acceptedReratings.map((rating) => `${rating.position_id}|${rating.critique_id}|${rating.rater_id}`));
  const revisedCritiques = new Set(acceptedReratings.map((rating) => `${rating.position_id}|${rating.critique_id}`));
  return {
    accepted_initial_ratings: acceptedInitial.length,
    accepted_rerating_records: acceptedReratings.length,
    revised_rater_critique_chains: revisedChains.size,
    revised_critiques: revisedCritiques.size,
    original_ratings_preserved: true,
  };
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
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
