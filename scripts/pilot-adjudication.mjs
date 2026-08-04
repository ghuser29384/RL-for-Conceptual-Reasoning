import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";

import { requireValidPilotAnalysisPolicy } from "./pilot-analysis-policy.mjs";
import {
  analyzePilotRatingDataset,
  selectRatingSnapshot,
  validatePilotRatingDataset,
} from "./pilot-rating-analysis.mjs";
import { hashPilotRatingDataset } from "./pilot-rating-ingestion.mjs";

export const ADJUDICATION_RESOLUTION_DISPOSITIONS = Object.freeze([
  "closed_without_rerating",
  "closed_after_rerating",
  "closed_unresolved",
]);

export const ADJUDICATION_ROUTE_DISPOSITIONS = Object.freeze([
  "resolved",
  "unresolved_preserved",
]);

export const ADJUDICATION_RESOLUTION_QC_DECISIONS = Object.freeze([
  "accepted_closure",
  "rejected_record",
]);

export const FINAL_SNAPSHOT_SIGNOFF_QC_DECISIONS = Object.freeze([
  "accepted_signoff",
  "rejected_signoff",
]);

const CONTROLLED_CASE_AUTHORIZATION_FIELDS = Object.freeze([
  "q_006b_approved",
  "q_006c_approved",
  "analysis_policy_frozen",
  "accepted_initial_rating_snapshot_frozen",
  "final_readiness_signed",
  "adjudication_case_generation_authorized",
  "private_controlled_storage_confirmed",
]);

const CONTROLLED_RESOLUTION_AUTHORIZATION_FIELDS = Object.freeze([
  "q_006b_approved",
  "q_006c_approved",
  "analysis_policy_frozen",
  "adjudication_cases_distributed",
  "adjudication_work_authorized",
  "resolution_quality_control_complete",
  "adjudication_resolution_acceptance_authorized",
  "private_controlled_storage_confirmed",
]);

const CONTROLLED_SNAPSHOT_AUTHORIZATION_FIELDS = Object.freeze([
  "q_006b_approved",
  "q_006c_approved",
  "all_required_cases_closed_or_documented_unresolved",
  "final_snapshot_generation_authorized",
  "final_snapshot_signoff_authorized",
  "private_controlled_storage_confirmed",
]);

const NUMERIC_ROUTE_IDS = new Set([
  "overall_gap",
  "strength_times_centrality_gap",
  "correctness_gap",
  "clarity_gap",
]);

const ITEM_ROUTE_IDS = new Set([
  "insufficient_context",
  "item_integrity",
  "low_clarity",
]);

const EVIDENCE_ROUTE_IDS = new Set(["unresolved_verification"]);

const FORBIDDEN_RESOLUTION_KEYS = new Set([
  "final_scores",
  "consensus_scores",
  "replacement_scores",
  "imposed_score",
  "imposed_scores",
  "winning_rater",
  "majority_vote",
  "majority_vote_result",
  "forced_convergence",
]);

const FORBIDDEN_PUBLIC_KEYS = new Set([
  "adjudicator_id",
  "adjudicator_ids",
  "rater_id",
  "rater_ids",
  "participant_id",
  "participant_ids",
  "position_id",
  "position_ids",
  "critique_id",
  "critique_ids",
  "rating_id",
  "rating_ids",
  "initial_rating_ids",
  "latest_accepted_rating_ids",
  "case_id",
  "case_ids",
  "resolution_id",
  "resolution_ids",
  "signoff_id",
  "signoff_ids",
  "operator_id",
  "operator_ids",
  "initial_ratings",
  "cases",
  "resolutions",
  "signoffs",
  "critique_records",
  "object_level_considerations",
  "residual_disagreement_summary",
  "route_dispositions",
  "case_packet_sha256",
  "individual_case_packet_hashes",
]);

export class PilotAdjudicationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PilotAdjudicationError";
    this.details = details;
  }
}

export function hashPilotInitialRatingSnapshot(dataset) {
  const initialRatings = selectRatingSnapshot(dataset, "initial");
  return sha256(
    canonicalStringify({
      programme_id: dataset?.programme_id ?? null,
      rubric_version: dataset?.rubric_version ?? null,
      positions: canonicalPositions(dataset?.positions),
      ratings: canonicalRatings(initialRatings),
    }),
  );
}

export function hashPilotAdjudicationPolicy(policy) {
  return sha256(canonicalStringify(canonicalPolicy(policy)));
}

export function validatePilotAdjudicationControl(dataset, policy, control) {
  const errors = [];
  const datasetValidation = validatePilotRatingDataset(dataset);
  if (datasetValidation.status !== "pass") {
    errors.push(...datasetValidation.errors.map((error) => `Dataset: ${error}`));
  }

  let normalizedPolicy = null;
  try {
    normalizedPolicy = requireValidPilotAnalysisPolicy(policy);
  } catch (error) {
    errors.push(error.message);
  }
  if (normalizedPolicy && normalizedPolicy.approved_routes.length === 0) {
    errors.push("Adjudication case generation requires at least one explicitly approved operative route.");
  }

  const authorization = objectOrEmpty(control?.authorization);
  const adjudicators = Array.isArray(control?.adjudicators) ? control.adjudicators : [];
  const topicRows = Array.isArray(control?.position_topic_families) ? control.position_topic_families : [];
  const raterIds = new Set((dataset?.ratings ?? []).map((rating) => cleanId(rating?.rater_id)).filter(Boolean));

  if (!nonEmptyString(control?.adjudication_request_id)) errors.push("adjudication_request_id is required.");
  if (control?.input_version !== 1) errors.push("input_version must equal 1.");
  if (control?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (control?.programme_id !== dataset?.programme_id) {
    errors.push("control programme_id must match the rating dataset.");
  }
  if (!new Set(["synthetic_test_fixture", "private_controlled_pilot_adjudication"]).has(control?.data_class)) {
    errors.push("data_class must be synthetic_test_fixture or private_controlled_pilot_adjudication.");
  }
  if (!new Set(["simulation", "controlled_case_generation"]).has(control?.mode)) {
    errors.push("mode must be simulation or controlled_case_generation.");
  }
  if (!nonEmptyString(control?.case_assignment_seed) || control.case_assignment_seed.length < 16) {
    errors.push("case_assignment_seed must be a controlled secret of at least 16 characters.");
  }
  if (!validIsoTimestamp(control?.opened_at)) errors.push("opened_at must be a valid ISO-8601 timestamp.");
  if (control?.analysis_policy_id !== policy?.policy_id || control?.analysis_policy_version !== policy?.policy_version) {
    errors.push("control analysis policy identity must match the supplied policy.");
  }
  if (control?.funding_submission_authorized !== false || control?.phase_2_authorized !== false) {
    errors.push("Adjudication control must not authorize funding submission or Phase 2.");
  }
  for (const field of [
    "adjudication_case_distribution_authorized",
    "adjudication_work_authorized",
    "rerating_work_authorized",
    "payment_authorized",
  ]) {
    if (control?.[field] !== false) errors.push(`${field} must remain false during case generation.`);
  }

  if (adjudicators.length !== 2) errors.push("The pilot adjudication roster must contain exactly two dedicated adjudicators.");
  const adjudicatorIds = new Set();
  for (const [index, adjudicator] of adjudicators.entries()) {
    const prefix = `adjudicators[${index}]`;
    const adjudicatorId = cleanId(adjudicator?.adjudicator_id);
    if (!controlledId(adjudicatorId)) errors.push(`${prefix}.adjudicator_id must be a controlled identifier.`);
    if (adjudicatorIds.has(adjudicatorId)) errors.push(`Duplicate adjudicator_id: ${adjudicatorId}.`);
    adjudicatorIds.add(adjudicatorId);
    if (raterIds.has(adjudicatorId)) errors.push(`${prefix}.adjudicator_id must not be an initial or rerating rater ID.`);
    for (const field of ["qualified", "consented", "calibrated", "available"]) {
      if (adjudicator?.[field] !== true) errors.push(`${prefix}.${field} must equal true before case assignment.`);
    }
    if (normalizeIds(adjudicator?.approved_topic_families).length === 0) {
      errors.push(`${prefix}.approved_topic_families must contain at least one topic family.`);
    }
    for (const field of ["conflict_position_ids", "conflict_critique_ids", "prior_label_exposure_position_ids"]) {
      if (!Array.isArray(adjudicator?.[field])) errors.push(`${prefix}.${field} must be an array.`);
    }
  }

  const knownPositionIds = new Set((dataset?.positions ?? []).map((position) => cleanId(position?.position_id)).filter(Boolean));
  const topicByPosition = new Map();
  for (const [index, row] of topicRows.entries()) {
    const positionId = cleanId(row?.position_id);
    const topicFamily = cleanId(row?.topic_family);
    if (!knownPositionIds.has(positionId)) errors.push(`position_topic_families[${index}].position_id is not in the dataset.`);
    if (!topicFamily) errors.push(`position_topic_families[${index}].topic_family is required.`);
    if (topicByPosition.has(positionId)) errors.push(`Duplicate topic mapping for ${positionId}.`);
    topicByPosition.set(positionId, topicFamily);
  }
  for (const positionId of knownPositionIds) {
    if (!topicByPosition.has(positionId)) errors.push(`Missing topic-family mapping for ${positionId}.`);
  }

  const acceptedInitial = selectRatingSnapshot(dataset, "initial");
  const latestInitialLock = maximumTimestamp(acceptedInitial.map((rating) => rating.locked_at));
  if (validIsoTimestamp(control?.opened_at) && latestInitialLock && Date.parse(control.opened_at) < latestInitialLock) {
    errors.push("opened_at must not precede the latest accepted initial rating in the supplied snapshot.");
  }

  const expectedInitialSnapshotSha256 = hashPilotInitialRatingSnapshot(dataset);
  if (control?.initial_snapshot_sha256 !== null && control?.initial_snapshot_sha256 !== undefined) {
    if (!sha256Hex(control.initial_snapshot_sha256)) errors.push("initial_snapshot_sha256 must be null or a SHA-256 digest.");
    if (control.initial_snapshot_sha256 !== expectedInitialSnapshotSha256) {
      errors.push("initial_snapshot_sha256 does not match the supplied accepted-initial snapshot.");
    }
  }
  const expectedPolicySha256 = hashPilotAdjudicationPolicy(policy);
  if (control?.analysis_policy_sha256 !== null && control?.analysis_policy_sha256 !== undefined) {
    if (!sha256Hex(control.analysis_policy_sha256)) errors.push("analysis_policy_sha256 must be null or a SHA-256 digest.");
    if (control.analysis_policy_sha256 !== expectedPolicySha256) {
      errors.push("analysis_policy_sha256 does not match the supplied policy.");
    }
  }

  if (control?.mode === "simulation") {
    if (control?.data_class !== "synthetic_test_fixture" || dataset?.data_class !== "synthetic_test_fixture") {
      errors.push("Simulation requires synthetic control and dataset classes.");
    }
    if (control?.synthetic_only !== true) errors.push("Simulation must declare synthetic_only=true.");
    for (const field of CONTROLLED_CASE_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== false) errors.push(`simulation authorization.${field} must remain false.`);
    }
    if (!emptyArray(authorization.approval_record_ids) || authorization.approved_at !== null) {
      errors.push("Simulation must not contain approval records or an approval timestamp.");
    }
    for (const adjudicatorId of adjudicatorIds) {
      if (!adjudicatorId.startsWith("ADJ_SYN_")) errors.push("Simulation adjudicator IDs must start with ADJ_SYN_.");
    }
  }

  if (control?.mode === "controlled_case_generation") {
    if (control?.data_class !== "private_controlled_pilot_adjudication") {
      errors.push("Controlled case generation requires private_controlled_pilot_adjudication data.");
    }
    if (dataset?.data_class !== "private_controlled_pilot_record") {
      errors.push("Controlled case generation requires a private_controlled_pilot_record dataset.");
    }
    if (control?.synthetic_only !== false) errors.push("Controlled case generation must declare synthetic_only=false.");
    for (const field of CONTROLLED_CASE_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== true) errors.push(`controlled authorization.${field} must equal true.`);
    }
    if (!Array.isArray(authorization.approval_record_ids) || authorization.approval_record_ids.length < 4) {
      errors.push("Controlled case generation requires at least four versioned approval record IDs.");
    }
    if (!validIsoTimestamp(authorization.approved_at)) {
      errors.push("Controlled case generation requires a valid authorization.approved_at timestamp.");
    }
    if (!sha256Hex(control?.initial_snapshot_sha256)) {
      errors.push("Controlled case generation requires the exact initial_snapshot_sha256.");
    }
    if (!sha256Hex(control?.analysis_policy_sha256)) {
      errors.push("Controlled case generation requires the exact analysis_policy_sha256.");
    }
  }

  return {
    status: errors.length ? "fail" : "pass",
    mode: control?.mode ?? null,
    data_class: control?.data_class ?? null,
    operational_route_count: normalizedPolicy?.approved_routes?.length ?? 0,
    adjudicator_count: adjudicators.length,
    initial_snapshot_sha256: expectedInitialSnapshotSha256,
    analysis_policy_sha256: expectedPolicySha256,
    errors,
  };
}

export function generatePilotAdjudicationCases(dataset, policy, control) {
  const validation = validatePilotAdjudicationControl(dataset, policy, control);
  if (validation.status !== "pass") {
    throw new PilotAdjudicationError(`Pilot adjudication control is invalid:\n${validation.errors.join("\n")}`, {
      validation,
    });
  }

  const normalizedPolicy = requireValidPilotAnalysisPolicy(policy);
  const analysis = analyzePilotRatingDataset(dataset, { policy: normalizedPolicy });
  const initialRatings = selectRatingSnapshot(dataset, "initial");
  const initialByCritique = groupBy(initialRatings, (rating) => `${rating.position_id}|${rating.critique_id}`);
  const topicByPosition = new Map(
    control.position_topic_families.map((row) => [cleanId(row.position_id), cleanId(row.topic_family)]),
  );
  const initialSnapshotSha256 = validation.initial_snapshot_sha256;
  const policySha256 = validation.analysis_policy_sha256;

  const skeletons = analysis.route_results
    .filter((result) => result.operative_routes.length > 0)
    .map((result) => {
      const key = `${result.position_id}|${result.critique_id}`;
      const ratings = [...(initialByCritique.get(key) ?? [])].sort(compareRatings);
      if (ratings.length !== 2) {
        throw new PilotAdjudicationError(`${key} must have exactly two accepted initial ratings before a case can open.`);
      }
      const operativeRoutes = canonicalRoutes(result.operative_routes);
      const caseId = `PAC_${sha256(
        canonicalStringify({
          programme_id: dataset.programme_id,
          initial_snapshot_sha256: initialSnapshotSha256,
          analysis_policy_sha256: policySha256,
          position_id: result.position_id,
          critique_id: result.critique_id,
          operative_routes: operativeRoutes,
        }),
      ).slice(0, 24)}`;
      return {
        case_id: caseId,
        position_id: result.position_id,
        critique_id: result.critique_id,
        topic_family: topicByPosition.get(result.position_id),
        case_kind: classifyCaseKind(operativeRoutes.map((route) => route.route)),
        operative_routes: operativeRoutes,
        initial_ratings: ratings,
        initial_rating_ids: ratings.map((rating) => rating.rating_id).sort(),
        initial_rater_ids: ratings.map((rating) => rating.rater_id).sort(),
      };
    })
    .sort((left, right) => left.case_id.localeCompare(right.case_id));

  const assignments = assignAdjudicationCases(skeletons, control.adjudicators, control.case_assignment_seed);
  const cases = skeletons.map((skeleton) => {
    const body = {
      case_version: 1,
      programme_id: dataset.programme_id,
      data_class: control.data_class,
      mode: control.mode,
      case_id: skeleton.case_id,
      initial_snapshot_sha256: initialSnapshotSha256,
      analysis_policy_id: policy.policy_id,
      analysis_policy_version: policy.policy_version,
      analysis_policy_sha256: policySha256,
      position_id: skeleton.position_id,
      critique_id: skeleton.critique_id,
      topic_family: skeleton.topic_family,
      case_kind: skeleton.case_kind,
      operative_routes: skeleton.operative_routes,
      initial_rating_ids: skeleton.initial_rating_ids,
      initial_rater_ids: skeleton.initial_rater_ids,
      initial_ratings: skeleton.initial_ratings,
      assigned_adjudicator_id: assignments.get(skeleton.case_id),
      opened_at: control.opened_at,
      status: "open",
      distribution_authorized: false,
      adjudication_work_authorized: false,
      rerating_work_authorized: false,
      payment_authorized: false,
      funding_submission_authorized: false,
      phase_2_authorized: false,
    };
    return {
      ...body,
      case_packet_sha256: sha256(canonicalStringify(body)),
    };
  });

  const caseSetCommitmentSha256 = sha256(cases.map((entry) => entry.case_packet_sha256).sort().join("\n"));
  const assignmentCounts = countBy(cases, (entry) => entry.assigned_adjudicator_id);
  const result = {
    case_set_version: "pilot-adjudication-case-set-v1",
    programme_id: dataset.programme_id,
    data_class: control.data_class,
    mode: control.mode,
    initial_snapshot_sha256: initialSnapshotSha256,
    analysis_policy_id: policy.policy_id,
    analysis_policy_version: policy.policy_version,
    analysis_policy_sha256: policySha256,
    case_set_commitment_sha256: caseSetCommitmentSha256,
    case_count: cases.length,
    assignment_counts: assignmentCounts,
    cases,
    distribution_authorized: false,
    adjudication_work_authorized: false,
    rerating_work_authorized: false,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
  };
  verifyCaseSet(result, control.adjudicators);
  return result;
}

export function validatePilotAdjudicationResolutions(caseSet, dataset, resolutionInput) {
  const errors = [];
  const records = Array.isArray(resolutionInput?.records) ? resolutionInput.records : [];
  const authorization = objectOrEmpty(resolutionInput?.authorization);
  const cases = Array.isArray(caseSet?.cases) ? caseSet.cases : [];
  const caseById = new Map(cases.map((entry) => [cleanId(entry?.case_id), entry]));
  const datasetValidation = validatePilotRatingDataset(dataset);
  if (datasetValidation.status !== "pass") errors.push(...datasetValidation.errors.map((error) => `Dataset: ${error}`));

  if (caseSet?.case_set_version !== "pilot-adjudication-case-set-v1") {
    errors.push("caseSet must use pilot-adjudication-case-set-v1.");
  }
  if (caseSet?.programme_id !== dataset?.programme_id || resolutionInput?.programme_id !== dataset?.programme_id) {
    errors.push("Case set, resolution input, and dataset must use the same programme_id.");
  }
  if (resolutionInput?.input_version !== 1) errors.push("resolution input_version must equal 1.");
  if (!nonEmptyString(resolutionInput?.resolution_batch_id)) errors.push("resolution_batch_id is required.");
  if (!new Set(["synthetic_test_fixture", "private_controlled_adjudication_resolution"]).has(resolutionInput?.data_class)) {
    errors.push("resolution data_class is not recognized.");
  }
  if (!new Set(["simulation", "controlled_resolution"]).has(resolutionInput?.mode)) {
    errors.push("resolution mode must be simulation or controlled_resolution.");
  }
  if (!validIsoTimestamp(resolutionInput?.resolved_at)) errors.push("resolved_at must be a valid ISO-8601 timestamp.");
  if (resolutionInput?.case_set_commitment_sha256 !== caseSet?.case_set_commitment_sha256) {
    errors.push("resolution case_set_commitment_sha256 must match the supplied case set.");
  }
  if (resolutionInput?.dataset_sha256 !== hashPilotRatingDataset(dataset)) {
    errors.push("resolution dataset_sha256 must match the supplied rating dataset.");
  }
  if (resolutionInput?.payment_authorized !== false || resolutionInput?.funding_submission_authorized !== false || resolutionInput?.phase_2_authorized !== false) {
    errors.push("Resolution input must not authorize payment, funding submission, or Phase 2.");
  }

  const approvedQcOperators = new Set(normalizeIds(resolutionInput?.approved_quality_control_operator_ids));
  if (approvedQcOperators.size === 0) errors.push("At least one approved quality-control operator ID is required.");

  if (resolutionInput?.mode === "simulation") {
    if (resolutionInput?.data_class !== "synthetic_test_fixture" || dataset?.data_class !== "synthetic_test_fixture") {
      errors.push("Resolution simulation requires synthetic data classes.");
    }
    if (resolutionInput?.synthetic_only !== true) errors.push("Resolution simulation must declare synthetic_only=true.");
    for (const field of CONTROLLED_RESOLUTION_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== false) errors.push(`simulation authorization.${field} must remain false.`);
    }
    if (!emptyArray(authorization.approval_record_ids) || authorization.approved_at !== null) {
      errors.push("Resolution simulation must not contain approval records or an approval timestamp.");
    }
  }

  if (resolutionInput?.mode === "controlled_resolution") {
    if (resolutionInput?.data_class !== "private_controlled_adjudication_resolution") {
      errors.push("Controlled resolution requires private_controlled_adjudication_resolution data.");
    }
    if (dataset?.data_class !== "private_controlled_pilot_record") {
      errors.push("Controlled resolution requires a private controlled rating dataset.");
    }
    if (resolutionInput?.synthetic_only !== false) errors.push("Controlled resolution must declare synthetic_only=false.");
    for (const field of CONTROLLED_RESOLUTION_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== true) errors.push(`controlled authorization.${field} must equal true.`);
    }
    if (!Array.isArray(authorization.approval_record_ids) || authorization.approval_record_ids.length < 4) {
      errors.push("Controlled resolution requires at least four versioned approval record IDs.");
    }
    if (!validIsoTimestamp(authorization.approved_at)) {
      errors.push("Controlled resolution requires a valid authorization.approved_at timestamp.");
    }
  }

  const recordById = new Map();
  const recordsByCase = new Map();
  for (const [index, record] of records.entries()) {
    const prefix = `records[${index}]`;
    const recordErrors = validateResolutionRecord(record, prefix, caseById, dataset, approvedQcOperators);
    errors.push(...recordErrors);
    const resolutionId = cleanId(record?.resolution_id);
    if (recordById.has(resolutionId)) errors.push(`Duplicate resolution_id: ${resolutionId}.`);
    recordById.set(resolutionId, record);
    const caseId = cleanId(record?.case_id);
    if (!recordsByCase.has(caseId)) recordsByCase.set(caseId, []);
    recordsByCase.get(caseId).push(record);
  }

  const acceptedClosures = [];
  const rejectedRecords = [];
  const openCases = [];
  for (const caseEntry of cases) {
    const chain = [...(recordsByCase.get(caseEntry.case_id) ?? [])].sort(
      (left, right) => Number(left?.resolution_version ?? 0) - Number(right?.resolution_version ?? 0),
    );
    validateResolutionChain(caseEntry, chain, errors);
    const accepted = chain.find((record) => record?.quality_control?.decision === "accepted_closure");
    if (accepted) acceptedClosures.push(accepted);
    else openCases.push(caseEntry);
    rejectedRecords.push(...chain.filter((record) => record?.quality_control?.decision === "rejected_record"));
  }

  for (const caseId of recordsByCase.keys()) {
    if (!caseById.has(caseId)) errors.push(`Resolution records reference unknown case ${caseId}.`);
  }

  if (resolutionInput?.require_all_cases_closed === true && openCases.length > 0) {
    errors.push("All required adjudication cases must have an accepted closure record.");
  }

  const resolutionSetCommitmentSha256 = sha256(
    records.map((record) => sha256(canonicalStringify(canonicalResolution(record)))).sort().join("\n"),
  );
  const acceptedAdjudicationUnitEvents = acceptedClosures.map((record) => ({
    event_version: "adjudication-unit-candidate-v1",
    event: "accepted_adjudication_record_closing_an_operator_assigned_required_case",
    units: 1,
    adjudicator_id: record.adjudicator_id,
    case_id: record.case_id,
    resolution_id: record.resolution_id,
    payment_authorized: false,
  }));

  return {
    status: errors.length ? "fail" : "pass",
    resolution_batch_id: resolutionInput?.resolution_batch_id ?? null,
    case_set_commitment_sha256: caseSet?.case_set_commitment_sha256 ?? null,
    dataset_sha256: hashPilotRatingDataset(dataset),
    resolution_set_commitment_sha256: resolutionSetCommitmentSha256,
    required_case_count: cases.length,
    accepted_closure_count: acceptedClosures.length,
    rejected_record_count: rejectedRecords.length,
    open_case_count: openCases.length,
    unresolved_case_count: acceptedClosures.filter((record) => record.disposition === "closed_unresolved").length,
    accepted_closures: acceptedClosures,
    open_cases: openCases,
    accepted_adjudication_unit_events: acceptedAdjudicationUnitEvents,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    errors,
  };
}

export function buildPilotFinalLabelSnapshot(caseSet, dataset, resolutionReport, snapshotInput) {
  const errors = [];
  const authorization = objectOrEmpty(snapshotInput?.authorization);
  const signoffs = Array.isArray(snapshotInput?.signoffs) ? snapshotInput.signoffs : [];
  const datasetValidation = validatePilotRatingDataset(dataset);
  if (datasetValidation.status !== "pass") errors.push(...datasetValidation.errors.map((error) => `Dataset: ${error}`));
  if (resolutionReport?.status !== "pass") errors.push("Resolution report must pass before final snapshot construction.");
  if (resolutionReport?.open_case_count !== 0) errors.push("Every required case must be closed or explicitly documented unresolved before snapshot sign-off.");

  if (!nonEmptyString(snapshotInput?.snapshot_request_id)) errors.push("snapshot_request_id is required.");
  if (snapshotInput?.input_version !== 1) errors.push("snapshot input_version must equal 1.");
  if (snapshotInput?.programme_id !== dataset?.programme_id || caseSet?.programme_id !== dataset?.programme_id) {
    errors.push("Snapshot, case set, and dataset must use the same programme_id.");
  }
  if (!new Set(["synthetic_test_fixture", "private_controlled_final_label_snapshot"]).has(snapshotInput?.data_class)) {
    errors.push("snapshot data_class is not recognized.");
  }
  if (!new Set(["simulation", "controlled_snapshot"]).has(snapshotInput?.mode)) {
    errors.push("snapshot mode must be simulation or controlled_snapshot.");
  }
  if (!validIsoTimestamp(snapshotInput?.created_at)) errors.push("snapshot created_at must be a valid ISO-8601 timestamp.");
  if (snapshotInput?.case_set_commitment_sha256 !== caseSet?.case_set_commitment_sha256) {
    errors.push("snapshot case_set_commitment_sha256 must match the case set.");
  }
  if (snapshotInput?.resolution_set_commitment_sha256 !== resolutionReport?.resolution_set_commitment_sha256) {
    errors.push("snapshot resolution_set_commitment_sha256 must match the resolution report.");
  }
  if (snapshotInput?.dataset_sha256 !== hashPilotRatingDataset(dataset)) {
    errors.push("snapshot dataset_sha256 must match the rating dataset.");
  }
  if (snapshotInput?.publication_authorized !== false || snapshotInput?.payment_authorized !== false || snapshotInput?.funding_submission_authorized !== false || snapshotInput?.phase_2_authorized !== false) {
    errors.push("Snapshot input must not authorize publication, payment, funding submission, or Phase 2.");
  }

  const approvedQcOperators = new Set(normalizeIds(snapshotInput?.approved_quality_control_operator_ids));
  if (approvedQcOperators.size === 0) errors.push("Snapshot requires at least one approved quality-control operator ID.");

  if (snapshotInput?.mode === "simulation") {
    if (snapshotInput?.data_class !== "synthetic_test_fixture" || dataset?.data_class !== "synthetic_test_fixture") {
      errors.push("Snapshot simulation requires synthetic data classes.");
    }
    if (snapshotInput?.synthetic_only !== true) errors.push("Snapshot simulation must declare synthetic_only=true.");
    for (const field of CONTROLLED_SNAPSHOT_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== false) errors.push(`simulation authorization.${field} must remain false.`);
    }
    if (!emptyArray(authorization.approval_record_ids) || authorization.approved_at !== null) {
      errors.push("Snapshot simulation must not contain approval records or an approval timestamp.");
    }
  }

  if (snapshotInput?.mode === "controlled_snapshot") {
    if (snapshotInput?.data_class !== "private_controlled_final_label_snapshot") {
      errors.push("Controlled snapshot requires private_controlled_final_label_snapshot data.");
    }
    if (dataset?.data_class !== "private_controlled_pilot_record") {
      errors.push("Controlled snapshot requires a private controlled rating dataset.");
    }
    if (snapshotInput?.synthetic_only !== false) errors.push("Controlled snapshot must declare synthetic_only=false.");
    for (const field of CONTROLLED_SNAPSHOT_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== true) errors.push(`controlled authorization.${field} must equal true.`);
    }
    if (!Array.isArray(authorization.approval_record_ids) || authorization.approval_record_ids.length < 4) {
      errors.push("Controlled snapshot requires at least four versioned approval record IDs.");
    }
    if (!validIsoTimestamp(authorization.approved_at)) {
      errors.push("Controlled snapshot requires a valid authorization.approved_at timestamp.");
    }
  }

  const acceptedClosures = new Map(
    (resolutionReport?.accepted_closures ?? []).map((record) => [cleanId(record.case_id), record]),
  );
  const caseByCritique = new Map(
    (caseSet?.cases ?? []).map((entry) => [`${entry.position_id}|${entry.critique_id}`, entry]),
  );
  const initial = selectRatingSnapshot(dataset, "initial");
  const latest = selectRatingSnapshot(dataset, "latest_accepted");
  const initialByCritique = groupBy(initial, (rating) => `${rating.position_id}|${rating.critique_id}`);
  const latestByCritique = groupBy(latest, (rating) => `${rating.position_id}|${rating.critique_id}`);

  const critiqueRecords = [];
  for (const position of canonicalPositions(dataset?.positions)) {
    for (const critiqueId of position.critique_ids) {
      const key = `${position.position_id}|${critiqueId}`;
      const initialRows = [...(initialByCritique.get(key) ?? [])].sort(compareRatings);
      const latestRows = [...(latestByCritique.get(key) ?? [])].sort(compareRatings);
      const caseEntry = caseByCritique.get(key) ?? null;
      const closure = caseEntry ? acceptedClosures.get(caseEntry.case_id) ?? null : null;
      critiqueRecords.push({
        position_id: position.position_id,
        critique_id: critiqueId,
        initial_rating_ids: initialRows.map((rating) => rating.rating_id),
        latest_accepted_rating_ids: latestRows.map((rating) => rating.rating_id),
        initial_ratings_sha256: sha256(canonicalStringify(canonicalRatings(initialRows))),
        latest_accepted_ratings_sha256: sha256(canonicalStringify(canonicalRatings(latestRows))),
        adjudication_case_id: caseEntry?.case_id ?? null,
        adjudication_resolution_id: closure?.resolution_id ?? null,
        adjudication_disposition: closure?.disposition ?? null,
        unresolved_disagreement_preserved: closure?.disposition === "closed_unresolved",
      });
    }
  }

  const body = {
    snapshot_version: "pilot-final-label-snapshot-v1",
    programme_id: dataset.programme_id,
    data_class: snapshotInput.data_class,
    mode: snapshotInput.mode,
    created_at: snapshotInput.created_at,
    label_semantics: "distribution_preserving_initial_and_latest_accepted_ratings_no_imposed_consensus_score",
    dataset_sha256: hashPilotRatingDataset(dataset),
    initial_snapshot_sha256: caseSet.initial_snapshot_sha256,
    analysis_policy_sha256: caseSet.analysis_policy_sha256,
    case_set_commitment_sha256: caseSet.case_set_commitment_sha256,
    resolution_set_commitment_sha256: resolutionReport.resolution_set_commitment_sha256,
    positions: datasetValidation.positions,
    critiques: datasetValidation.critiques,
    accepted_initial_ratings: initial.length,
    latest_accepted_ratings: latest.length,
    accepted_reratings: dataset.ratings.filter((rating) => rating.accepted === true && rating.stage === "rerating").length,
    required_cases: resolutionReport.required_case_count,
    accepted_case_closures: resolutionReport.accepted_closure_count,
    unresolved_cases: resolutionReport.unresolved_case_count,
    critique_records: critiqueRecords,
    consensus_score_created: false,
    original_initial_ratings_preserved: true,
    publication_authorized: false,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
  };
  const snapshotBodySha256 = sha256(canonicalStringify(body));

  const roster = new Set((caseSet?.cases ?? []).map((entry) => cleanId(entry.assigned_adjudicator_id)).filter(Boolean));
  const signoffIds = new Set();
  const signedAdjudicators = new Set();
  for (const [index, signoff] of signoffs.entries()) {
    const prefix = `signoffs[${index}]`;
    const signoffId = cleanId(signoff?.signoff_id);
    const adjudicatorId = cleanId(signoff?.adjudicator_id);
    if (!controlledId(signoffId)) errors.push(`${prefix}.signoff_id must be a controlled identifier.`);
    if (signoffIds.has(signoffId)) errors.push(`Duplicate signoff_id: ${signoffId}.`);
    signoffIds.add(signoffId);
    if (!roster.has(adjudicatorId)) errors.push(`${prefix}.adjudicator_id must be one of the two dedicated adjudicators.`);
    if (signedAdjudicators.has(adjudicatorId)) errors.push(`Duplicate adjudicator snapshot sign-off: ${adjudicatorId}.`);
    signedAdjudicators.add(adjudicatorId);
    if (signoff?.snapshot_body_sha256 !== snapshotBodySha256) {
      errors.push(`${prefix}.snapshot_body_sha256 must match the generated snapshot body.`);
    }
    if (!validIsoTimestamp(signoff?.signed_at) || Date.parse(signoff.signed_at) < Date.parse(snapshotInput.created_at)) {
      errors.push(`${prefix}.signed_at must be a valid timestamp at or after snapshot creation.`);
    }
    for (const field of [
      "completeness_confirmed",
      "original_initial_ratings_preserved_confirmed",
      "residual_disagreement_preserved_confirmed",
      "no_consensus_score_imposed_confirmed",
      "participation_is_not_substantive_endorsement_confirmed",
    ]) {
      if (signoff?.[field] !== true) errors.push(`${prefix}.${field} must equal true.`);
    }
    const qc = objectOrEmpty(signoff?.quality_control);
    if (!FINAL_SNAPSHOT_SIGNOFF_QC_DECISIONS.includes(qc.decision)) {
      errors.push(`${prefix}.quality_control.decision is not recognized.`);
    }
    if (qc.decision !== "accepted_signoff") errors.push(`${prefix} must have an accepted_signoff quality-control decision.`);
    if (!approvedQcOperators.has(cleanId(qc.operator_id))) {
      errors.push(`${prefix}.quality_control.operator_id is not approved for snapshot sign-off review.`);
    }
    if (cleanId(qc.operator_id) === adjudicatorId) {
      errors.push(`${prefix}.quality_control operator must be distinct from the adjudicator.`);
    }
    if (!nonEmptyString(qc.reason)) errors.push(`${prefix}.quality_control.reason is required.`);
    if (!validIsoTimestamp(qc.decided_at) || Date.parse(qc.decided_at) < Date.parse(signoff?.signed_at ?? "")) {
      errors.push(`${prefix}.quality_control.decided_at must be at or after signed_at.`);
    }
  }
  if (signoffs.length !== 2 || signedAdjudicators.size !== 2 || roster.size !== 2) {
    errors.push("Final label snapshot requires accepted sign-offs from both dedicated adjudicators exactly once.");
  }

  const signoffCommitmentSha256 = sha256(
    signoffs.map((signoff) => sha256(canonicalStringify(canonicalSignoff(signoff)))).sort().join("\n"),
  );
  const finalSnapshotSha256 = sha256(
    canonicalStringify({ snapshot_body_sha256: snapshotBodySha256, signoff_commitment_sha256: signoffCommitmentSha256 }),
  );
  const acceptedSignoffUnitEvents = signoffs.map((signoff) => ({
    event_version: "adjudication-unit-candidate-v1",
    event: "accepted_required_final_label_snapshot_signoff",
    units: 1,
    adjudicator_id: signoff.adjudicator_id,
    signoff_id: signoff.signoff_id,
    snapshot_body_sha256: snapshotBodySha256,
    payment_authorized: false,
  }));

  const result = {
    status: errors.length ? "fail" : "pass",
    snapshot_body_sha256: snapshotBodySha256,
    signoff_commitment_sha256: signoffCommitmentSha256,
    final_snapshot_sha256: finalSnapshotSha256,
    body,
    signoffs,
    accepted_signoff_unit_events: acceptedSignoffUnitEvents,
    publication_authorized: false,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    errors,
  };
  return result;
}

export function sanitizePilotAdjudicationCaseSummary(caseSet) {
  const summary = {
    report_version: "pilot-adjudication-case-public-summary-v1",
    programme_id: caseSet.programme_id,
    data_class: caseSet.data_class,
    mode: caseSet.mode,
    initial_snapshot_sha256: caseSet.initial_snapshot_sha256,
    analysis_policy_sha256: caseSet.analysis_policy_sha256,
    case_set_commitment_sha256: caseSet.case_set_commitment_sha256,
    counts: {
      cases: caseSet.case_count,
      assigned_to_two_dedicated_adjudicators: Object.keys(caseSet.assignment_counts ?? {}).length === 2,
      maximum_assignment_imbalance: assignmentImbalance(caseSet.assignment_counts),
    },
    case_kinds: countBy(caseSet.cases ?? [], (entry) => entry.case_kind),
    distribution_authorized: false,
    adjudication_work_authorized: false,
    rerating_work_authorized: false,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    privacy: {
      contains_adjudicator_or_rater_ids: false,
      contains_position_or_critique_ids: false,
      contains_rating_ids_or_content: false,
      contains_case_ids_or_packet_hashes: false,
      controlled_case_packets_withheld: true,
    },
  };
  assertPublicAdjudicationSummary(summary);
  return summary;
}

export function sanitizePilotAdjudicationResolutionSummary(report) {
  const summary = {
    report_version: "pilot-adjudication-resolution-public-summary-v1",
    case_set_commitment_sha256: report.case_set_commitment_sha256,
    dataset_sha256: report.dataset_sha256,
    resolution_set_commitment_sha256: report.resolution_set_commitment_sha256,
    counts: {
      required_cases: report.required_case_count,
      accepted_closures: report.accepted_closure_count,
      rejected_records: report.rejected_record_count,
      open_cases: report.open_case_count,
      unresolved_cases: report.unresolved_case_count,
      candidate_adjudication_units: report.accepted_adjudication_unit_events?.length ?? 0,
    },
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    privacy: {
      contains_case_or_resolution_ids: false,
      contains_adjudicator_or_operator_ids: false,
      contains_item_or_rating_ids: false,
      contains_object_level_notes: false,
      controlled_resolution_records_withheld: true,
    },
  };
  assertPublicAdjudicationSummary(summary);
  return summary;
}

export function sanitizePilotFinalLabelSnapshotSummary(snapshot) {
  const summary = {
    report_version: "pilot-final-label-snapshot-public-summary-v1",
    snapshot_body_sha256: snapshot.snapshot_body_sha256,
    signoff_commitment_sha256: snapshot.signoff_commitment_sha256,
    final_snapshot_sha256: snapshot.final_snapshot_sha256,
    dataset_sha256: snapshot.body?.dataset_sha256 ?? null,
    initial_snapshot_sha256: snapshot.body?.initial_snapshot_sha256 ?? null,
    case_set_commitment_sha256: snapshot.body?.case_set_commitment_sha256 ?? null,
    resolution_set_commitment_sha256: snapshot.body?.resolution_set_commitment_sha256 ?? null,
    counts: {
      positions: snapshot.body?.positions ?? 0,
      critiques: snapshot.body?.critiques ?? 0,
      accepted_initial_ratings: snapshot.body?.accepted_initial_ratings ?? 0,
      latest_accepted_ratings: snapshot.body?.latest_accepted_ratings ?? 0,
      accepted_reratings: snapshot.body?.accepted_reratings ?? 0,
      required_cases: snapshot.body?.required_cases ?? 0,
      accepted_case_closures: snapshot.body?.accepted_case_closures ?? 0,
      unresolved_cases: snapshot.body?.unresolved_cases ?? 0,
      accepted_adjudicator_signoffs: snapshot.signoffs?.length ?? 0,
      candidate_signoff_units: snapshot.accepted_signoff_unit_events?.length ?? 0,
    },
    label_semantics: snapshot.body?.label_semantics ?? null,
    consensus_score_created: false,
    original_initial_ratings_preserved: true,
    publication_authorized: false,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    privacy: {
      contains_adjudicator_rater_or_operator_ids: false,
      contains_item_rating_case_resolution_or_signoff_ids: false,
      contains_scores_rationales_or_object_level_notes: false,
      controlled_snapshot_and_signoffs_withheld: true,
    },
  };
  assertPublicAdjudicationSummary(summary);
  return summary;
}

export function assertPublicAdjudicationSummary(summary) {
  const forbidden = findKeys(summary, FORBIDDEN_PUBLIC_KEYS);
  if (forbidden.length) {
    throw new PilotAdjudicationError(`Public adjudication output exposes controlled fields: ${forbidden.join(", ")}`);
  }
  for (const field of ["payment_authorized", "funding_submission_authorized", "phase_2_authorized"]) {
    if (summary?.[field] !== false) throw new PilotAdjudicationError(`${field} must remain false in public adjudication output.`);
  }
  return true;
}

function validateResolutionRecord(record, prefix, caseById, dataset, approvedQcOperators) {
  const errors = [];
  if (!record || typeof record !== "object" || Array.isArray(record)) return [`${prefix} must be an object.`];
  const caseId = cleanId(record.case_id);
  const caseEntry = caseById.get(caseId);
  const resolutionId = cleanId(record.resolution_id);
  const adjudicatorId = cleanId(record.adjudicator_id);
  const qc = objectOrEmpty(record.quality_control);

  if (!controlledId(resolutionId)) errors.push(`${prefix}.resolution_id must be a controlled identifier.`);
  if (!caseEntry) errors.push(`${prefix}.case_id must reference a known adjudication case.`);
  if (caseEntry && record.case_packet_sha256 !== caseEntry.case_packet_sha256) {
    errors.push(`${prefix}.case_packet_sha256 must match the assigned case packet.`);
  }
  if (!Number.isInteger(record.resolution_version) || record.resolution_version < 1) {
    errors.push(`${prefix}.resolution_version must be a positive integer.`);
  }
  if (record.resolution_version === 1) {
    if (record.predecessor_resolution_id !== null) errors.push(`${prefix} version 1 predecessor_resolution_id must be null.`);
    if (record.correction_reason !== null) errors.push(`${prefix} version 1 correction_reason must be null.`);
  } else {
    if (!controlledId(record.predecessor_resolution_id)) errors.push(`${prefix} later version requires predecessor_resolution_id.`);
    if (!nonEmptyString(record.correction_reason)) errors.push(`${prefix} later version requires correction_reason.`);
  }
  if (caseEntry && adjudicatorId !== caseEntry.assigned_adjudicator_id) {
    errors.push(`${prefix}.adjudicator_id must match the case assignment.`);
  }
  if (!ADJUDICATION_RESOLUTION_DISPOSITIONS.includes(record.disposition)) {
    errors.push(`${prefix}.disposition is not recognized.`);
  }
  if (!validIsoTimestamp(record.reviewed_at)) errors.push(`${prefix}.reviewed_at must be a valid timestamp.`);
  if (caseEntry && validIsoTimestamp(record.reviewed_at) && Date.parse(record.reviewed_at) < Date.parse(caseEntry.opened_at)) {
    errors.push(`${prefix}.reviewed_at must not precede case opening.`);
  }
  if (!Array.isArray(record.object_level_considerations) || record.object_level_considerations.length === 0) {
    errors.push(`${prefix}.object_level_considerations must contain at least one consideration.`);
  } else if (record.object_level_considerations.some((entry) => !nonEmptyString(entry))) {
    errors.push(`${prefix}.object_level_considerations must contain non-empty strings.`);
  }
  for (const field of [
    "minority_or_alternative_interpretations_preserved",
    "no_score_imposition_acknowledged",
    "no_convergence_pressure_acknowledged",
  ]) {
    if (record[field] !== true) errors.push(`${prefix}.${field} must equal true.`);
  }

  const caseRoutes = new Set((caseEntry?.operative_routes ?? []).map((route) => route.route));
  const routeDispositions = Array.isArray(record.route_dispositions) ? record.route_dispositions : [];
  const routeIds = routeDispositions.map((entry) => cleanId(entry?.route));
  if (routeIds.length !== caseRoutes.size || new Set(routeIds).size !== routeIds.length) {
    errors.push(`${prefix}.route_dispositions must contain each operative route exactly once.`);
  }
  for (const route of caseRoutes) {
    if (!routeIds.includes(route)) errors.push(`${prefix}.route_dispositions is missing ${route}.`);
  }
  for (const [index, routeDisposition] of routeDispositions.entries()) {
    if (!caseRoutes.has(cleanId(routeDisposition?.route))) {
      errors.push(`${prefix}.route_dispositions[${index}] references a non-operative route.`);
    }
    if (!ADJUDICATION_ROUTE_DISPOSITIONS.includes(routeDisposition?.status)) {
      errors.push(`${prefix}.route_dispositions[${index}].status is not recognized.`);
    }
    if (!nonEmptyString(routeDisposition?.rationale)) {
      errors.push(`${prefix}.route_dispositions[${index}].rationale is required.`);
    }
  }

  const reratingIds = normalizeIds(record.rerating_rating_ids);
  if (!Array.isArray(record.rerating_rating_ids)) errors.push(`${prefix}.rerating_rating_ids must be an array.`);
  if (new Set(reratingIds).size !== reratingIds.length) errors.push(`${prefix}.rerating_rating_ids must be unique.`);
  const reratingValidation = validateCaseReratings(caseEntry, dataset, reratingIds, record.reviewed_at);
  errors.push(...reratingValidation.errors.map((error) => `${prefix}: ${error}`));

  const unresolvedRoutes = routeDispositions.filter((entry) => entry.status === "unresolved_preserved");
  if (record.disposition === "closed_after_rerating") {
    if (reratingIds.length === 0) errors.push(`${prefix} closed_after_rerating requires at least one accepted rerating.`);
    if (unresolvedRoutes.length > 0) errors.push(`${prefix} closed_after_rerating cannot leave operative routes unresolved.`);
    if (record.residual_disagreement_summary !== null) {
      errors.push(`${prefix} closed_after_rerating residual_disagreement_summary must be null.`);
    }
  }
  if (record.disposition === "closed_without_rerating") {
    if (reratingIds.length !== 0) errors.push(`${prefix} closed_without_rerating cannot reference reratings.`);
    if (unresolvedRoutes.length > 0) errors.push(`${prefix} closed_without_rerating cannot leave operative routes unresolved.`);
    if (record.residual_disagreement_summary !== null) {
      errors.push(`${prefix} closed_without_rerating residual_disagreement_summary must be null.`);
    }
  }
  if (record.disposition === "closed_unresolved") {
    if (unresolvedRoutes.length === 0) errors.push(`${prefix} closed_unresolved requires at least one unresolved_preserved route.`);
    if (!nonEmptyString(record.residual_disagreement_summary)) {
      errors.push(`${prefix} closed_unresolved requires residual_disagreement_summary.`);
    }
  }

  if (!ADJUDICATION_RESOLUTION_QC_DECISIONS.includes(qc.decision)) {
    errors.push(`${prefix}.quality_control.decision is not recognized.`);
  }
  if (!approvedQcOperators.has(cleanId(qc.operator_id))) {
    errors.push(`${prefix}.quality_control.operator_id is not approved.`);
  }
  if (cleanId(qc.operator_id) === adjudicatorId) {
    errors.push(`${prefix}.quality_control operator must be distinct from the adjudicator.`);
  }
  if (!nonEmptyString(qc.reason)) errors.push(`${prefix}.quality_control.reason is required.`);
  if (!validIsoTimestamp(qc.decided_at) || Date.parse(qc.decided_at) < Date.parse(record.reviewed_at ?? "")) {
    errors.push(`${prefix}.quality_control.decided_at must be at or after reviewed_at.`);
  }

  const forbidden = findKeys(record, FORBIDDEN_RESOLUTION_KEYS);
  for (const path of forbidden) errors.push(`${prefix} contains prohibited score-imposition field ${path}.`);
  if (record.payment_authorized !== false || record.phase_2_authorized !== false) {
    errors.push(`${prefix} must not authorize payment or Phase 2.`);
  }
  return errors;
}

function validateResolutionChain(caseEntry, chain, errors) {
  if (chain.length === 0) return;
  let acceptedSeen = false;
  for (let index = 0; index < chain.length; index += 1) {
    const record = chain[index];
    const expectedVersion = index + 1;
    if (record.resolution_version !== expectedVersion) {
      errors.push(`${caseEntry.case_id} resolution versions must be contiguous from 1.`);
    }
    if (index > 0) {
      const predecessor = chain[index - 1];
      if (record.predecessor_resolution_id !== predecessor.resolution_id) {
        errors.push(`${record.resolution_id} predecessor_resolution_id must reference the immediately previous record.`);
      }
      if (Date.parse(record.reviewed_at) <= Date.parse(predecessor.reviewed_at)) {
        errors.push(`${record.resolution_id} must be reviewed after its predecessor.`);
      }
      if (predecessor.quality_control?.decision !== "rejected_record") {
        errors.push(`${record.resolution_id} may correct only a quality-control-rejected predecessor.`);
      }
    }
    if (acceptedSeen) errors.push(`${caseEntry.case_id} cannot contain records after an accepted closure.`);
    if (record.quality_control?.decision === "accepted_closure") acceptedSeen = true;
  }
}

function validateCaseReratings(caseEntry, dataset, reratingIds, reviewedAt) {
  const errors = [];
  if (!caseEntry) return { errors: ["Cannot validate reratings for an unknown case."] };
  const ratingById = new Map((dataset?.ratings ?? []).map((rating) => [cleanId(rating.rating_id), rating]));
  const acceptedReratingsForCase = (dataset?.ratings ?? []).filter(
    (rating) =>
      rating.accepted === true &&
      rating.stage === "rerating" &&
      rating.position_id === caseEntry.position_id &&
      rating.critique_id === caseEntry.critique_id &&
      (!validIsoTimestamp(reviewedAt) || Date.parse(rating.locked_at) <= Date.parse(reviewedAt)),
  );
  const expectedIds = acceptedReratingsForCase.map((rating) => rating.rating_id).sort();
  const suppliedIds = [...reratingIds].sort();
  if (expectedIds.length !== suppliedIds.length || expectedIds.some((id, index) => id !== suppliedIds[index])) {
    errors.push("rerating_rating_ids must name every accepted rerating for the case up to reviewed_at, and no others.");
  }

  for (const reratingId of reratingIds) {
    const rating = ratingById.get(reratingId);
    if (!rating) {
      errors.push(`Referenced rerating ${reratingId} does not exist.`);
      continue;
    }
    if (rating.stage !== "rerating" || rating.accepted !== true || rating.operator_assigned !== true) {
      errors.push(`${reratingId} must be an accepted operator-assigned rerating.`);
    }
    if (rating.position_id !== caseEntry.position_id || rating.critique_id !== caseEntry.critique_id) {
      errors.push(`${reratingId} must address the adjudication case critique.`);
    }
    if (!caseEntry.initial_rater_ids.includes(rating.rater_id)) {
      errors.push(`${reratingId} must come from one of the two original case raters.`);
    }
    if (Date.parse(rating.locked_at) <= Date.parse(caseEntry.opened_at)) {
      errors.push(`${reratingId} must lock after the case opened.`);
    }
    if (validIsoTimestamp(reviewedAt) && Date.parse(rating.locked_at) > Date.parse(reviewedAt)) {
      errors.push(`${reratingId} cannot lock after the resolution was reviewed.`);
    }
    if (!chainStartsFromInitial(rating, ratingById, new Set(caseEntry.initial_rating_ids))) {
      errors.push(`${reratingId} predecessor chain must terminate at one of the preserved initial case ratings.`);
    }
  }
  return { errors };
}

function chainStartsFromInitial(rating, ratingById, initialIds) {
  let current = rating;
  const visited = new Set();
  while (current?.stage === "rerating") {
    if (visited.has(current.rating_id)) return false;
    visited.add(current.rating_id);
    current = ratingById.get(cleanId(current.predecessor_rating_id));
  }
  return Boolean(current && current.stage === "initial" && initialIds.has(current.rating_id));
}

function assignAdjudicationCases(cases, adjudicators, seed) {
  const counts = new Map(adjudicators.map((entry) => [entry.adjudicator_id, 0]));
  const assignments = new Map();
  for (const caseEntry of cases) {
    const eligible = adjudicators.filter((adjudicator) => isAdjudicatorEligible(caseEntry, adjudicator));
    if (eligible.length === 0) {
      throw new PilotAdjudicationError(`No eligible adjudicator exists for case ${caseEntry.case_id}.`);
    }
    const minimumCount = Math.min(...eligible.map((adjudicator) => counts.get(adjudicator.adjudicator_id) ?? 0));
    const leastLoaded = eligible.filter((adjudicator) => (counts.get(adjudicator.adjudicator_id) ?? 0) === minimumCount);
    leastLoaded.sort((left, right) =>
      sha256(`${seed}|${caseEntry.case_id}|${left.adjudicator_id}`).localeCompare(
        sha256(`${seed}|${caseEntry.case_id}|${right.adjudicator_id}`),
      ),
    );
    const selected = leastLoaded[0].adjudicator_id;
    assignments.set(caseEntry.case_id, selected);
    counts.set(selected, (counts.get(selected) ?? 0) + 1);
  }
  return assignments;
}

function isAdjudicatorEligible(caseEntry, adjudicator) {
  const approvedTopics = new Set(normalizeIds(adjudicator.approved_topic_families));
  const conflicts = new Set(normalizeIds(adjudicator.conflict_position_ids));
  const critiqueConflicts = new Set(normalizeIds(adjudicator.conflict_critique_ids));
  const priorExposure = new Set(normalizeIds(adjudicator.prior_label_exposure_position_ids));
  return (
    adjudicator.qualified === true &&
    adjudicator.consented === true &&
    adjudicator.calibrated === true &&
    adjudicator.available === true &&
    approvedTopics.has(caseEntry.topic_family) &&
    !conflicts.has(caseEntry.position_id) &&
    !critiqueConflicts.has(caseEntry.critique_id) &&
    !priorExposure.has(caseEntry.position_id) &&
    !caseEntry.initial_rater_ids.includes(adjudicator.adjudicator_id)
  );
}

function verifyCaseSet(caseSet, adjudicators) {
  const hashes = caseSet.cases.map((entry) => entry.case_packet_sha256).sort();
  if (sha256(hashes.join("\n")) !== caseSet.case_set_commitment_sha256) {
    throw new PilotAdjudicationError("Case-set commitment does not match its case packets.");
  }
  for (const caseEntry of caseSet.cases) {
    const { case_packet_sha256: supplied, ...body } = caseEntry;
    if (sha256(canonicalStringify(body)) !== supplied) {
      throw new PilotAdjudicationError(`${caseEntry.case_id} case_packet_sha256 does not match its body.`);
    }
    if (caseEntry.initial_ratings.length !== 2 || caseEntry.initial_rating_ids.length !== 2 || caseEntry.initial_rater_ids.length !== 2) {
      throw new PilotAdjudicationError(`${caseEntry.case_id} must preserve exactly two initial ratings.`);
    }
  }
  const counts = Object.values(caseSet.assignment_counts ?? {});
  if (caseSet.cases.length >= 2 && Object.keys(caseSet.assignment_counts ?? {}).length !== adjudicators.length) {
    throw new PilotAdjudicationError("At least two cases must use both dedicated adjudicators.");
  }
  if (counts.length && Math.max(...counts) - Math.min(...counts) > 1) {
    throw new PilotAdjudicationError("Adjudication case assignments must differ by at most one case.");
  }
}

function classifyCaseKind(routes) {
  const kinds = new Set();
  for (const route of routes) {
    if (NUMERIC_ROUTE_IDS.has(route)) kinds.add("rating_disagreement");
    if (ITEM_ROUTE_IDS.has(route)) kinds.add("item_or_context_review");
    if (EVIDENCE_ROUTE_IDS.has(route)) kinds.add("evidence_review");
  }
  if (kinds.size === 1) return [...kinds][0];
  return "mixed_review";
}

function canonicalPolicy(policy) {
  return {
    policy_id: policy?.policy_id ?? null,
    policy_version: policy?.policy_version ?? null,
    programme_id: policy?.programme_id ?? null,
    status: policy?.status ?? null,
    approved_routes: normalizeIds(policy?.approved_routes).sort(),
    diagnostic_minimum_mean_overall_gap: policy?.diagnostic_minimum_mean_overall_gap ?? null,
    low_clarity_below: policy?.low_clarity_below ?? null,
    numeric_thresholds: Object.fromEntries(
      Object.entries(objectOrEmpty(policy?.numeric_thresholds)).sort(([left], [right]) => left.localeCompare(right)),
    ),
    governance: canonicalObject(policy?.governance),
  };
}

function canonicalPositions(positions) {
  return (Array.isArray(positions) ? positions : [])
    .map((position) => ({
      position_id: cleanId(position?.position_id),
      critique_ids: normalizeIds(position?.critique_ids).sort(),
    }))
    .sort((left, right) => left.position_id.localeCompare(right.position_id));
}

function canonicalRatings(ratings) {
  return (Array.isArray(ratings) ? ratings : []).map((rating) => canonicalObject(rating)).sort(compareRatings);
}

function canonicalRoutes(routes) {
  return (Array.isArray(routes) ? routes : []).map((route) => canonicalObject(route)).sort((left, right) => left.route.localeCompare(right.route));
}

function canonicalResolution(record) {
  return canonicalObject(record);
}

function canonicalSignoff(signoff) {
  return canonicalObject(signoff);
}

function canonicalObject(value) {
  if (Array.isArray(value)) return value.map(canonicalObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalObject(value[key])]),
  );
}

function canonicalStringify(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function compareRatings(left, right) {
  return [left?.position_id, left?.critique_id, left?.rater_id, left?.version, left?.rating_id]
    .map((value) => String(value ?? ""))
    .join("|")
    .localeCompare(
      [right?.position_id, right?.critique_id, right?.rater_id, right?.version, right?.rating_id]
        .map((value) => String(value ?? ""))
        .join("|"),
    );
}

function maximumTimestamp(values) {
  const timestamps = values.filter(validIsoTimestamp).map((value) => Date.parse(value));
  return timestamps.length ? Math.max(...timestamps) : null;
}

function assignmentImbalance(counts) {
  const values = Object.values(counts ?? {});
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
}

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows ?? []) {
    const key = String(keyFn(row) ?? "unknown");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function groupBy(rows, keyFn) {
  const groups = new Map();
  for (const row of rows ?? []) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
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

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeIds(value) {
  return Array.isArray(value) ? value.map(cleanId).filter(Boolean) : [];
}

function cleanId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function controlledId(value) {
  return nonEmptyString(value) && !/\s/.test(value) && !value.includes("@");
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function emptyArray(value) {
  return Array.isArray(value) && value.length === 0;
}

function validIsoTimestamp(value) {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function sha256Hex(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function pathInside(root, candidate) {
  const normalizedRoot = resolve(root);
  const normalizedCandidate = resolve(candidate);
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}${sep}`);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help") || process.argv.length < 5) {
    console.log(
      "Usage: node scripts/pilot-adjudication.mjs <rating-dataset.json> <analysis-policy.json> <adjudication-control.json> [--controlled-output <private-path>]",
    );
    console.log("Simulation prints only a privacy-safe case summary. Controlled case generation writes the full private case set outside the repository with mode 0600.");
    console.log("Case generation never authorizes case distribution, adjudication work, rerating, payment, funding submission, or Phase 2.");
  } else {
    const root = resolve(import.meta.dirname, "..");
    const [dataset, policy, control] = await Promise.all([
      readJson(resolve(process.argv[2])),
      readJson(resolve(process.argv[3])),
      readJson(resolve(process.argv[4])),
    ]);
    const flagIndex = process.argv.indexOf("--controlled-output");
    const outputPath = flagIndex >= 0 ? process.argv[flagIndex + 1] : null;
    const caseSet = generatePilotAdjudicationCases(dataset, policy, control);
    if (caseSet.mode === "controlled_case_generation") {
      if (!outputPath) throw new PilotAdjudicationError("Controlled case generation requires --controlled-output.");
      const resolvedOutput = resolve(outputPath);
      if (pathInside(root, resolvedOutput)) {
        throw new PilotAdjudicationError("Controlled adjudication case output must be outside the repository.");
      }
      await writeFile(resolvedOutput, `${JSON.stringify(caseSet, null, 2)}\n`, { mode: 0o600 });
      await chmod(resolvedOutput, 0o600);
    } else if (outputPath) {
      throw new PilotAdjudicationError("Simulation mode does not write controlled adjudication case files.");
    }
    console.log(JSON.stringify(sanitizePilotAdjudicationCaseSummary(caseSet), null, 2));
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
