import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";

import { validatePilotRatingDataset } from "./pilot-rating-analysis.mjs";
import { validatePilotTaskSubmission } from "./pilot-task-bundle-generator.mjs";

export const INGESTION_DISPOSITIONS = Object.freeze([
  "accepted_materialize",
  "rejected_no_materialization",
  "already_materialized_noop",
]);

const CONTROLLED_AUTHORIZATION_FIELDS = Object.freeze([
  "q_006b_approved",
  "q_006c_approved",
  "protected_manifest_frozen",
  "controlled_assignment_generated",
  "task_bundles_generated",
  "final_readiness_signed",
  "task_bundle_distribution_authorized",
  "rating_work_authorized",
  "quality_control_complete",
  "rating_ingestion_authorized",
  "private_controlled_storage_confirmed",
]);

const FORBIDDEN_RATING_DATASET_KEYS = new Set([
  "task_position_token",
  "task_critique_token",
  "task_token_secret",
  "secret_task_token_key",
  "operator_index",
  "position_mappings",
  "critique_mappings",
  "submission_template",
]);

const FORBIDDEN_PUBLIC_SUMMARY_KEYS = new Set([
  "participant_id",
  "participant_ids",
  "rater_id",
  "rater_ids",
  "position_id",
  "position_ids",
  "critique_id",
  "critique_ids",
  "rating_id",
  "rating_ids",
  "bundle_id",
  "bundle_ids",
  "task_bundle_sha256",
  "task_position_token",
  "task_critique_token",
  "submission_sha256",
  "submission_sha256s",
  "decision_id",
  "decision_ids",
  "operator_id",
  "operator_ids",
  "quality_control_decisions",
  "materialized_rating_ids",
  "operator_index",
  "participant_bundles",
  "position_mappings",
  "critique_mappings",
  "dataset",
  "receipt",
]);

export class PilotRatingIngestionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PilotRatingIngestionError";
    this.details = details;
  }
}

export function hashPilotOperatorIndex(operatorIndex) {
  return sha256(canonicalStringify(canonicalOperatorIndex(operatorIndex)));
}

export function hashPilotTaskSubmission(submission) {
  return sha256(canonicalStringify(canonicalSubmission(submission)));
}

export function hashPilotRatingDataset(dataset) {
  return sha256(canonicalStringify(canonicalDataset(dataset)));
}

export function validatePilotRatingIngestionControl(operatorIndex, bundles, submissions, control) {
  const errors = [];
  const bundleRows = arrayValue(bundles);
  const submissionRows = arrayValue(submissions);
  const decisions = Array.isArray(control?.quality_control_decisions) ? control.quality_control_decisions : [];
  const authorization = objectOrEmpty(control?.authorization);

  if (operatorIndex?.index_version !== "pilot-task-bundle-operator-index-v1") {
    errors.push("operator index must use pilot-task-bundle-operator-index-v1.");
  }
  if (operatorIndex?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("operator index must identify the 48-critique pilot.");
  }
  if (!sha256Hex(operatorIndex?.bundle_commitment_sha256)) {
    errors.push("operator index bundle_commitment_sha256 must be a lowercase SHA-256 digest.");
  }
  if (!Array.isArray(operatorIndex?.participant_bundles) || operatorIndex.participant_bundles.length !== 6) {
    errors.push("operator index must contain exactly six participant-bundle entries.");
  }
  if (operatorIndex?.phase_2_authorized !== false) errors.push("operator index phase_2_authorized must remain false.");

  if (!nonEmptyString(control?.ingestion_request_id)) errors.push("ingestion_request_id is required.");
  if (control?.input_version !== 1) errors.push("input_version must equal 1.");
  if (control?.programme_id !== operatorIndex?.programme_id) {
    errors.push("control programme_id must match the operator index.");
  }
  if (!new Set(["synthetic_test_fixture", "private_controlled_rating_ingestion"]).has(control?.data_class)) {
    errors.push("data_class must be synthetic_test_fixture or private_controlled_rating_ingestion.");
  }
  if (!new Set(["simulation", "controlled_ingestion"]).has(control?.mode)) {
    errors.push("mode must be simulation or controlled_ingestion.");
  }
  if (!controlledId(control?.target_dataset_id)) errors.push("target_dataset_id must be a controlled identifier.");
  if (!new Set(["synthetic_test_fixture", "private_controlled_pilot_record"]).has(control?.target_data_class)) {
    errors.push("target_data_class must be synthetic_test_fixture or private_controlled_pilot_record.");
  }
  if (control?.rubric_version !== "rubric-v2-seven-dimensional") {
    errors.push("rubric_version must equal rubric-v2-seven-dimensional.");
  }
  if (!validIsoTimestamp(control?.ingested_at)) errors.push("ingested_at must be a valid ISO-8601 timestamp.");
  if (!sha256Hex(control?.operator_index_sha256)) errors.push("operator_index_sha256 must be a lowercase SHA-256 digest.");
  if (control?.operator_index_sha256 !== hashPilotOperatorIndex(operatorIndex)) {
    errors.push("operator_index_sha256 does not match the supplied operator index.");
  }
  if (control?.bundle_commitment_sha256 !== operatorIndex?.bundle_commitment_sha256) {
    errors.push("bundle_commitment_sha256 must match the operator index.");
  }
  if (control?.funding_submission_authorized !== false || control?.phase_2_authorized !== false) {
    errors.push("ingestion control must not authorize funding submission or Phase 2.");
  }

  if (control?.mode === "simulation") {
    if (control?.data_class !== "synthetic_test_fixture" || control?.target_data_class !== "synthetic_test_fixture") {
      errors.push("simulation requires synthetic control and target data classes.");
    }
    if (operatorIndex?.mode !== "simulation" || operatorIndex?.data_class !== "synthetic_test_fixture") {
      errors.push("simulation requires a synthetic simulation operator index.");
    }
    if (control?.synthetic_acceptance_only !== true) {
      errors.push("simulation must declare synthetic_acceptance_only=true.");
    }
    for (const field of CONTROLLED_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== false) errors.push(`simulation authorization.${field} must remain false.`);
    }
    if (!emptyArray(authorization.approval_record_ids) || authorization.approved_at !== null) {
      errors.push("simulation must not contain approval records or an approval timestamp.");
    }
  }

  if (control?.mode === "controlled_ingestion") {
    if (control?.data_class !== "private_controlled_rating_ingestion") {
      errors.push("controlled_ingestion requires private_controlled_rating_ingestion data.");
    }
    if (control?.target_data_class !== "private_controlled_pilot_record") {
      errors.push("controlled_ingestion requires private_controlled_pilot_record target data.");
    }
    if (operatorIndex?.mode !== "controlled_generation" || operatorIndex?.data_class !== "private_controlled_task_content") {
      errors.push("controlled_ingestion requires a controlled-generation operator index.");
    }
    if (control?.synthetic_acceptance_only !== false) {
      errors.push("controlled_ingestion must declare synthetic_acceptance_only=false.");
    }
    for (const field of CONTROLLED_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== true) errors.push(`controlled authorization.${field} must equal true.`);
    }
    if (!Array.isArray(authorization.approval_record_ids) || authorization.approval_record_ids.length < 4) {
      errors.push("controlled ingestion requires at least four versioned approval record IDs.");
    }
    if (!validIsoTimestamp(authorization.approved_at)) {
      errors.push("controlled ingestion requires a valid authorization.approved_at timestamp.");
    }
  }

  if (bundleRows.length === 0 || bundleRows.length > 6) errors.push("bundles must contain between one and six task bundles.");
  if (submissionRows.length !== bundleRows.length) errors.push("submissions must contain exactly one submission per supplied bundle.");

  const indexEntries = new Map();
  const indexBundleHashes = [];
  for (const [index, entry] of (operatorIndex?.participant_bundles ?? []).entries()) {
    const participantId = cleanId(entry?.participant_id);
    const bundleId = cleanId(entry?.bundle_id);
    const prefix = `operator_index.participant_bundles[${index}]`;
    if (!controlledId(participantId)) errors.push(`${prefix}.participant_id must be a controlled identifier.`);
    if (!controlledId(bundleId)) errors.push(`${prefix}.bundle_id must be a controlled identifier.`);
    if (!sha256Hex(entry?.task_bundle_sha256)) errors.push(`${prefix}.task_bundle_sha256 must be a SHA-256 digest.`);
    if (indexEntries.has(bundleId)) errors.push(`Duplicate operator-index bundle_id: ${bundleId}.`);
    indexEntries.set(bundleId, entry);
    indexBundleHashes.push(entry?.task_bundle_sha256);
  }
  if (indexBundleHashes.length === 6 && sha256([...indexBundleHashes].sort().join("\n")) !== operatorIndex.bundle_commitment_sha256) {
    errors.push("operator index bundle commitment does not match its six task-bundle hashes.");
  }

  const bundleById = new Map();
  const bundleParticipants = new Set();
  for (const [index, bundle] of bundleRows.entries()) {
    const prefix = `bundles[${index}]`;
    const bundleId = cleanId(bundle?.bundle_id);
    const participantId = cleanId(bundle?.participant_id);
    const indexEntry = indexEntries.get(bundleId);
    if (!indexEntry) errors.push(`${prefix}.bundle_id is not present in the operator index.`);
    if (indexEntry && indexEntry.participant_id !== participantId) errors.push(`${prefix}.participant_id does not match the operator index.`);
    if (indexEntry && indexEntry.task_bundle_sha256 !== bundle?.task_bundle_sha256) {
      errors.push(`${prefix}.task_bundle_sha256 does not match the operator index.`);
    }
    if (bundle?.task_bundle_sha256 !== hashTaskBundleBody(bundle)) {
      errors.push(`${prefix}.task_bundle_sha256 does not match the supplied bundle body.`);
    }
    if (bundleById.has(bundleId)) errors.push(`Duplicate supplied bundle_id: ${bundleId}.`);
    if (bundleParticipants.has(participantId)) errors.push(`More than one supplied bundle belongs to participant ${participantId}.`);
    bundleById.set(bundleId, bundle);
    bundleParticipants.add(participantId);
    if (bundle?.programme_id !== operatorIndex?.programme_id) errors.push(`${prefix}.programme_id must match the operator index.`);
    if (bundle?.rubric_version !== operatorIndex?.rubric_version) errors.push(`${prefix}.rubric_version must match the operator index.`);
    if (bundle?.phase_2_authorized !== false) errors.push(`${prefix}.phase_2_authorized must remain false.`);
  }

  const submissionHashes = new Set();
  const submissionParticipants = new Set();
  const expectedDecisionKeys = new Set();
  const submissionByHash = new Map();
  for (const [index, submission] of submissionRows.entries()) {
    const prefix = `submissions[${index}]`;
    const bundle = bundleById.get(cleanId(submission?.bundle_id));
    if (!bundle) {
      errors.push(`${prefix}.bundle_id must reference a supplied task bundle.`);
      continue;
    }
    const validation = validatePilotTaskSubmission(bundle, submission);
    if (validation.status !== "pass") errors.push(...validation.errors.map((error) => `${prefix}: ${error}`));
    const submissionHash = hashPilotTaskSubmission(submission);
    if (submissionHashes.has(submissionHash)) errors.push(`${prefix} duplicates an earlier canonical submission.`);
    submissionHashes.add(submissionHash);
    submissionByHash.set(submissionHash, submission);
    const participantId = cleanId(submission?.participant_id);
    if (submissionParticipants.has(participantId)) errors.push(`More than one submission belongs to participant ${participantId}.`);
    submissionParticipants.add(participantId);
    for (const response of Array.isArray(submission?.responses) ? submission.responses : []) {
      expectedDecisionKeys.add(`${submissionHash}|${cleanId(response?.task_critique_token)}`);
    }
  }

  if (decisions.length !== expectedDecisionKeys.size) {
    errors.push("quality_control_decisions must contain exactly one decision per submitted response.");
  }
  const observedDecisionKeys = new Set();
  const decisionIds = new Set();
  for (const [index, decision] of decisions.entries()) {
    const prefix = `quality_control_decisions[${index}]`;
    const decisionId = cleanId(decision?.decision_id);
    const submissionHash = cleanId(decision?.submission_sha256);
    const critiqueToken = cleanId(decision?.task_critique_token);
    const key = `${submissionHash}|${critiqueToken}`;
    const submission = submissionByHash.get(submissionHash);
    if (!controlledId(decisionId)) errors.push(`${prefix}.decision_id must be a controlled identifier.`);
    if (decisionIds.has(decisionId)) errors.push(`${prefix}.decision_id duplicates an earlier decision.`);
    decisionIds.add(decisionId);
    if (!submission) errors.push(`${prefix}.submission_sha256 must reference a supplied submission.`);
    if (!expectedDecisionKeys.has(key)) errors.push(`${prefix}.task_critique_token must reference a response in that submission.`);
    if (observedDecisionKeys.has(key)) errors.push(`${prefix} duplicates a submission-response decision.`);
    observedDecisionKeys.add(key);
    if (!INGESTION_DISPOSITIONS.includes(decision?.disposition)) {
      errors.push(`${prefix}.disposition is not recognized.`);
    }
    if (!nonEmptyString(decision?.decision_reason)) errors.push(`${prefix}.decision_reason is required.`);
    if (!controlledId(decision?.operator_id)) errors.push(`${prefix}.operator_id must be a controlled pseudonymous identifier.`);
    if (!validIsoTimestamp(decision?.decided_at)) errors.push(`${prefix}.decided_at must be a valid ISO-8601 timestamp.`);
    if (submission && validIsoTimestamp(decision?.decided_at) && Date.parse(decision.decided_at) < Date.parse(submission.submitted_at)) {
      errors.push(`${prefix}.decided_at must not precede the submission timestamp.`);
    }
    if (validIsoTimestamp(control?.ingested_at) && validIsoTimestamp(decision?.decided_at) && Date.parse(control.ingested_at) < Date.parse(decision.decided_at)) {
      errors.push(`${prefix}.decided_at must not follow the ingestion timestamp.`);
    }
    if (control?.mode === "simulation") {
      if (!decisionId.startsWith("SIM_") || !String(decision?.operator_id ?? "").startsWith("SIM_")) {
        errors.push(`${prefix} identifiers must start with SIM_ in simulation mode.`);
      }
    }
  }
  for (const key of expectedDecisionKeys) {
    if (!observedDecisionKeys.has(key)) errors.push("A submitted response is missing its quality-control decision.");
  }

  return {
    status: errors.length ? "fail" : "pass",
    mode: control?.mode ?? null,
    data_class: control?.data_class ?? null,
    bundles: bundleRows.length,
    submissions: submissionRows.length,
    responses: expectedDecisionKeys.size,
    decisions: decisions.length,
    errors,
  };
}

export function ingestPilotInitialRatings(operatorIndex, bundles, submissions, control, existingDataset = null) {
  const bundleRows = arrayValue(bundles);
  const submissionRows = arrayValue(submissions);
  const controlValidation = validatePilotRatingIngestionControl(operatorIndex, bundleRows, submissionRows, control);
  if (controlValidation.status !== "pass") {
    throw new PilotRatingIngestionError(`Pilot rating ingestion control is invalid:\n${controlValidation.errors.join("\n")}`, {
      validation: controlValidation,
    });
  }

  const positions = positionsFromOperatorIndex(operatorIndex);
  const dataset = existingDataset
    ? structuredClone(existingDataset)
    : {
        dataset_id: control.target_dataset_id,
        dataset_version: 1,
        programme_id: control.programme_id,
        data_class: control.target_data_class,
        rubric_version: control.rubric_version,
        positions,
        ratings: [],
        ingestion_events: [],
      };

  validateTargetDataset(dataset, positions, control);
  const beforeDatasetSha256 = hashPilotRatingDataset(dataset);
  const existingRatings = Array.isArray(dataset.ratings) ? dataset.ratings : [];
  const existingInitialByKey = new Map();
  const existingRatingIds = new Set();
  const previouslyIngestedSubmissionHashes = new Set();
  for (const rating of existingRatings) {
    existingRatingIds.add(cleanId(rating?.rating_id));
    if (rating?.stage === "initial") {
      existingInitialByKey.set(initialRatingKey(rating?.rater_id, rating?.position_id, rating?.critique_id), rating);
    }
    if (sha256Hex(rating?.source_submission_sha256)) previouslyIngestedSubmissionHashes.add(rating.source_submission_sha256);
  }
  for (const event of Array.isArray(dataset.ingestion_events) ? dataset.ingestion_events : []) {
    for (const hash of Array.isArray(event?.submission_sha256s) ? event.submission_sha256s : []) {
      if (sha256Hex(hash)) previouslyIngestedSubmissionHashes.add(hash);
    }
  }

  const bundleById = new Map(bundleRows.map((bundle) => [cleanId(bundle.bundle_id), bundle]));
  const indexByBundleId = new Map(operatorIndex.participant_bundles.map((entry) => [cleanId(entry.bundle_id), entry]));
  const decisionsByKey = new Map(
    control.quality_control_decisions.map((decision) => [
      `${cleanId(decision.submission_sha256)}|${cleanId(decision.task_critique_token)}`,
      decision,
    ]),
  );

  const materializationCandidates = [];
  const submissionReceipts = [];
  for (const submission of [...submissionRows].sort((left, right) => cleanId(left.participant_id).localeCompare(cleanId(right.participant_id)))) {
    const bundle = bundleById.get(cleanId(submission.bundle_id));
    const indexEntry = indexByBundleId.get(cleanId(submission.bundle_id));
    const submissionSha256 = hashPilotTaskSubmission(submission);
    if (previouslyIngestedSubmissionHashes.has(submissionSha256)) {
      throw new PilotRatingIngestionError(`Submission replay rejected: ${submissionSha256}.`, {
        submission_sha256: submissionSha256,
      });
    }
    const tokenMappings = tokenMappingsForIndexEntry(indexEntry);
    const dispositionCounts = Object.fromEntries(INGESTION_DISPOSITIONS.map((value) => [value, 0]));
    const decisionIds = [];

    for (const response of [...submission.responses].sort((left, right) => cleanId(left.task_critique_token).localeCompare(cleanId(right.task_critique_token)))) {
      const critiqueToken = cleanId(response.task_critique_token);
      const positionToken = cleanId(response.task_position_token);
      const decision = decisionsByKey.get(`${submissionSha256}|${critiqueToken}`);
      const mapping = tokenMappings.get(critiqueToken);
      if (!mapping || mapping.task_position_token !== positionToken) {
        throw new PilotRatingIngestionError("Operator-index token mapping does not match the validated submission.");
      }
      const key = initialRatingKey(submission.participant_id, mapping.position_id, mapping.critique_id);
      const existing = existingInitialByKey.get(key);
      dispositionCounts[decision.disposition] += 1;
      decisionIds.push(decision.decision_id);

      if (decision.disposition === "already_materialized_noop") {
        if (!existing || existing.accepted !== true) {
          throw new PilotRatingIngestionError("already_materialized_noop requires an existing accepted initial rating.", {
            participant_id: submission.participant_id,
            position_id: mapping.position_id,
            critique_id: mapping.critique_id,
          });
        }
        continue;
      }
      if (decision.disposition === "rejected_no_materialization") {
        if (existing) {
          throw new PilotRatingIngestionError("A response with an existing initial rating must use already_materialized_noop.");
        }
        continue;
      }
      if (existing) {
        throw new PilotRatingIngestionError("accepted_materialize would duplicate an existing initial rating.", {
          participant_id: submission.participant_id,
          position_id: mapping.position_id,
          critique_id: mapping.critique_id,
        });
      }

      const ratingId = deterministicRatingId({
        programme_id: control.programme_id,
        dataset_id: control.target_dataset_id,
        participant_id: submission.participant_id,
        position_id: mapping.position_id,
        critique_id: mapping.critique_id,
        submission_sha256: submissionSha256,
      });
      if (existingRatingIds.has(ratingId)) throw new PilotRatingIngestionError(`Deterministic rating_id collision: ${ratingId}.`);
      existingRatingIds.add(ratingId);
      existingInitialByKey.set(key, { accepted: true });
      materializationCandidates.push({
        rating_id: ratingId,
        position_id: mapping.position_id,
        critique_id: mapping.critique_id,
        rater_id: submission.participant_id,
        stage: "initial",
        version: 1,
        predecessor_rating_id: null,
        rubric_version: submission.rubric_version,
        scores: structuredClone(response.scores),
        overall_rationale: response.overall_rationale,
        confidence: response.confidence,
        time_spent_seconds: response.time_spent_seconds,
        insufficient_context: response.insufficient_context,
        verification_status: response.verification_status,
        item_integrity_flags: [...response.item_integrity_flags],
        accepted: true,
        locked_at: submission.submitted_at,
        operator_assigned: false,
        object_level_revision_reason: null,
        source_record_kind: "blind_task_submission_v1",
        source_submission_sha256: submissionSha256,
        source_bundle_id: submission.bundle_id,
        source_task_bundle_sha256: submission.task_bundle_sha256,
        source_operator_index_sha256: control.operator_index_sha256,
        quality_control_decision_id: decision.decision_id,
        quality_control_operator_id: decision.operator_id,
        quality_control_decided_at: decision.decided_at,
        quality_control_decision_reason: decision.decision_reason,
      });
    }

    submissionReceipts.push({
      participant_id: submission.participant_id,
      bundle_id: submission.bundle_id,
      submission_sha256: submissionSha256,
      decision_ids: decisionIds.sort(),
      dispositions: dispositionCounts,
    });
  }

  const eventBody = {
    event_version: "pilot-rating-ingestion-event-v1",
    programme_id: control.programme_id,
    ingestion_request_id: control.ingestion_request_id,
    mode: control.mode,
    target_dataset_id: control.target_dataset_id,
    target_dataset_sha256_before: beforeDatasetSha256,
    operator_index_sha256: control.operator_index_sha256,
    bundle_commitment_sha256: control.bundle_commitment_sha256,
    submission_sha256s: submissionReceipts.map((entry) => entry.submission_sha256).sort(),
    quality_control_decision_sha256s: control.quality_control_decisions
      .map((decision) => sha256(canonicalStringify(decision)))
      .sort(),
    materialized_rating_ids: materializationCandidates.map((rating) => rating.rating_id).sort(),
    disposition_counts: sumDispositions(submissionReceipts),
    authorization_record_ids: [...(control.authorization.approval_record_ids ?? [])].sort(),
    ingested_at: control.ingested_at,
    funding_submission_authorized: false,
    phase_2_authorized: false,
  };
  const ingestionEventSha256 = sha256(canonicalStringify(eventBody));
  const ingestionEventId = `ING_${ingestionEventSha256.slice(0, 24)}`;

  const materializedRatings = materializationCandidates
    .map((rating) => ({
      ...rating,
      ingestion_event_id: ingestionEventId,
      ingestion_event_sha256: ingestionEventSha256,
    }))
    .sort((left, right) => left.rating_id.localeCompare(right.rating_id));

  dataset.ratings = [...existingRatings, ...materializedRatings];
  dataset.ingestion_events = [
    ...(Array.isArray(dataset.ingestion_events) ? dataset.ingestion_events : []),
    {
      ingestion_event_id: ingestionEventId,
      ingestion_event_sha256: ingestionEventSha256,
      ingested_at: control.ingested_at,
      submission_sha256s: eventBody.submission_sha256s,
      materialized_rating_count: materializedRatings.length,
      disposition_counts: eventBody.disposition_counts,
    },
  ];

  assertRatingDatasetContainsNoTaskTokens(dataset);
  const requireComplete = dataset.ratings.filter((rating) => rating.stage === "initial" && rating.accepted === true).length === 96;
  const datasetValidation = validatePilotRatingDataset(dataset, { requireComplete });
  if (datasetValidation.status !== "pass") {
    throw new PilotRatingIngestionError(`Materialized rating dataset is invalid:\n${datasetValidation.errors.join("\n")}`, {
      validation: datasetValidation,
    });
  }

  const afterDatasetSha256 = hashPilotRatingDataset(dataset);
  const receipt = {
    receipt_version: "pilot-rating-ingestion-receipt-v1",
    programme_id: control.programme_id,
    data_class: control.data_class,
    mode: control.mode,
    ingestion_event_id: ingestionEventId,
    ingestion_event_sha256: ingestionEventSha256,
    ingestion_request_id: control.ingestion_request_id,
    operator_index_sha256: control.operator_index_sha256,
    bundle_commitment_sha256: control.bundle_commitment_sha256,
    target_dataset_id: control.target_dataset_id,
    target_dataset_sha256_before: beforeDatasetSha256,
    target_dataset_sha256_after: afterDatasetSha256,
    submissions: submissionReceipts,
    materialized_rating_ids: materializedRatings.map((rating) => rating.rating_id),
    disposition_counts: eventBody.disposition_counts,
    authorization_record_ids: [...(control.authorization.approval_record_ids ?? [])],
    ingested_at: control.ingested_at,
    raw_submissions_retained_separately: true,
    rejected_responses_materialized_as_ratings: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
  };

  return {
    report_version: "pilot-rating-ingestion-v1",
    programme_id: control.programme_id,
    data_class: control.data_class,
    mode: control.mode,
    controlled_ingestion_completed: control.mode === "controlled_ingestion",
    funding_submission_authorized: false,
    phase_2_authorized: false,
    operator_index_sha256: control.operator_index_sha256,
    bundle_commitment_sha256: control.bundle_commitment_sha256,
    target_dataset_sha256_before: beforeDatasetSha256,
    target_dataset_sha256_after: afterDatasetSha256,
    ingestion_event_id: ingestionEventId,
    ingestion_event_sha256: ingestionEventSha256,
    dataset,
    receipt,
  };
}

export function sanitizePilotRatingIngestionSummary(report) {
  const simulation = report.mode === "simulation";
  const counts = report.receipt.disposition_counts;
  const summary = {
    report_version: "pilot-rating-ingestion-public-summary-v1",
    programme_id: report.programme_id,
    data_class: report.data_class,
    mode: report.mode,
    controlled_ingestion_completed: report.controlled_ingestion_completed === true,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    operator_index_sha256: report.operator_index_sha256,
    bundle_commitment_sha256: report.bundle_commitment_sha256,
    target_dataset_sha256_before: report.target_dataset_sha256_before,
    target_dataset_sha256_after: report.target_dataset_sha256_after,
    ingestion_event_sha256: report.ingestion_event_sha256,
    counts: simulation
      ? {
          submissions_processed: report.receipt.submissions.length,
          responses_reviewed: Object.values(counts).reduce((sum, value) => sum + value, 0),
          ratings_materialized: report.receipt.materialized_rating_ids.length,
          accepted_materialize: counts.accepted_materialize,
          rejected_no_materialization: counts.rejected_no_materialization,
          already_materialized_noop: counts.already_materialized_noop,
          exact_counts_withheld: false,
        }
      : {
          at_least_one_submission_processed: report.receipt.submissions.length > 0,
          at_least_one_response_reviewed: Object.values(counts).some((value) => value > 0),
          exact_counts_withheld: true,
        },
    governance: {
      raw_submissions_retained_separately: true,
      rejected_responses_materialized_as_ratings: false,
      exact_bundle_binding_required: true,
      quality_control_decision_required_per_response: true,
      exact_submission_replay_rejected: true,
      existing_initial_rating_requires_noop: true,
      append_only_initial_rating_records: true,
      ingestion_does_not_authorize_funding_submission_or_phase_2: true,
    },
    privacy: {
      contains_participant_or_rater_ids: false,
      contains_position_or_critique_ids: false,
      contains_rating_ids: false,
      contains_bundle_ids_or_individual_bundle_hashes: false,
      contains_task_tokens: false,
      contains_individual_submission_hashes: false,
      contains_quality_control_decision_or_operator_ids: false,
      contains_rating_content: false,
      controlled_dataset_and_receipt_withheld: true,
    },
  };
  assertPublicPilotRatingIngestionSummary(summary);
  return summary;
}

export function assertRatingDatasetContainsNoTaskTokens(dataset) {
  const forbidden = findKeys(dataset, FORBIDDEN_RATING_DATASET_KEYS);
  if (forbidden.length) {
    throw new PilotRatingIngestionError(`Rating dataset exposes task-delivery fields: ${forbidden.join(", ")}`);
  }
  return true;
}

export function assertPublicPilotRatingIngestionSummary(summary) {
  const forbidden = findKeys(summary, FORBIDDEN_PUBLIC_SUMMARY_KEYS);
  if (forbidden.length) {
    throw new PilotRatingIngestionError(`Public ingestion summary exposes controlled fields: ${forbidden.join(", ")}`);
  }
  if (summary?.funding_submission_authorized !== false || summary?.phase_2_authorized !== false) {
    throw new PilotRatingIngestionError("Public ingestion summary must not authorize funding submission or Phase 2.");
  }
  for (const field of [
    "contains_participant_or_rater_ids",
    "contains_position_or_critique_ids",
    "contains_rating_ids",
    "contains_bundle_ids_or_individual_bundle_hashes",
    "contains_task_tokens",
    "contains_individual_submission_hashes",
    "contains_quality_control_decision_or_operator_ids",
    "contains_rating_content",
  ]) {
    if (summary?.privacy?.[field] !== false) throw new PilotRatingIngestionError(`privacy.${field} must equal false.`);
  }
  return true;
}

function validateTargetDataset(dataset, expectedPositions, control) {
  if (dataset?.dataset_id !== control.target_dataset_id) {
    throw new PilotRatingIngestionError("Existing dataset_id must match target_dataset_id.");
  }
  if (dataset?.dataset_version !== 1) throw new PilotRatingIngestionError("Existing dataset_version must equal 1.");
  if (dataset?.programme_id !== control.programme_id) throw new PilotRatingIngestionError("Existing dataset programme_id must match control.");
  if (dataset?.data_class !== control.target_data_class) throw new PilotRatingIngestionError("Existing dataset data_class must match control.");
  if (dataset?.rubric_version !== control.rubric_version) throw new PilotRatingIngestionError("Existing dataset rubric_version must match control.");
  if (canonicalStringify(canonicalPositions(dataset?.positions)) !== canonicalStringify(canonicalPositions(expectedPositions))) {
    throw new PilotRatingIngestionError("Existing dataset positions must match the operator-index item manifest exactly.");
  }
  const validation = validatePilotRatingDataset(dataset, { requireComplete: false });
  if (validation.status !== "pass") {
    throw new PilotRatingIngestionError(`Existing rating dataset is invalid:\n${validation.errors.join("\n")}`, {
      validation,
    });
  }
}

function positionsFromOperatorIndex(operatorIndex) {
  const byPositionId = new Map();
  for (const participant of operatorIndex.participant_bundles) {
    for (const position of participant.position_mappings ?? []) {
      const positionId = cleanId(position?.position_id);
      const critiqueMappings = Array.isArray(position?.critique_mappings) ? position.critique_mappings : [];
      const candidate = {
        position_id: positionId,
        position_version: position?.position_version,
        critique_ids: critiqueMappings.map((critique) => cleanId(critique?.critique_id)).sort(),
        critique_versions: Object.fromEntries(
          critiqueMappings
            .map((critique) => [cleanId(critique?.critique_id), critique?.critique_version])
            .sort((left, right) => left[0].localeCompare(right[0])),
        ),
      };
      const previous = byPositionId.get(positionId);
      if (previous && canonicalStringify(previous) !== canonicalStringify(candidate)) {
        throw new PilotRatingIngestionError(`Operator index contains inconsistent mappings for ${positionId}.`);
      }
      byPositionId.set(positionId, candidate);
    }
  }
  const positions = [...byPositionId.values()].sort((left, right) => left.position_id.localeCompare(right.position_id));
  const critiqueIds = positions.flatMap((position) => position.critique_ids);
  if (positions.length !== 12 || critiqueIds.length !== 48 || new Set(critiqueIds).size !== 48) {
    throw new PilotRatingIngestionError("Operator index must resolve to exactly 12 positions and 48 unique critiques.");
  }
  return positions;
}

function tokenMappingsForIndexEntry(entry) {
  const mappings = new Map();
  for (const position of entry?.position_mappings ?? []) {
    for (const critique of position?.critique_mappings ?? []) {
      const token = cleanId(critique?.task_critique_token);
      if (mappings.has(token)) throw new PilotRatingIngestionError(`Duplicate task critique token in operator index: ${token}.`);
      mappings.set(token, {
        task_position_token: cleanId(position?.task_position_token),
        position_id: cleanId(position?.position_id),
        position_version: position?.position_version,
        critique_id: cleanId(critique?.critique_id),
        critique_version: critique?.critique_version,
      });
    }
  }
  return mappings;
}

function deterministicRatingId(value) {
  return `RT_${sha256(canonicalStringify(value)).slice(0, 24)}`;
}

function initialRatingKey(raterId, positionId, critiqueId) {
  return `${cleanId(raterId)}|${cleanId(positionId)}|${cleanId(critiqueId)}|initial`;
}

function hashTaskBundleBody(bundle) {
  const body = structuredClone(bundle);
  delete body.bundle_id;
  delete body.task_bundle_sha256;
  delete body.submission_template;
  return sha256(canonicalStringify(body));
}

function canonicalOperatorIndex(value) {
  const clone = structuredClone(value);
  clone.participant_bundles = arrayValue(clone.participant_bundles)
    .map((participant) => ({
      ...participant,
      position_mappings: arrayValue(participant?.position_mappings)
        .map((position) => ({
          ...position,
          critique_mappings: arrayValue(position?.critique_mappings).sort((left, right) =>
            cleanId(left?.task_critique_token).localeCompare(cleanId(right?.task_critique_token)),
          ),
        }))
        .sort((left, right) => cleanId(left?.task_position_token).localeCompare(cleanId(right?.task_position_token))),
    }))
    .sort((left, right) => cleanId(left?.bundle_id).localeCompare(cleanId(right?.bundle_id)));
  return clone;
}

function canonicalSubmission(value) {
  const clone = structuredClone(value);
  clone.responses = arrayValue(clone.responses)
    .map((response) => ({
      ...response,
      item_integrity_flags: arrayValue(response?.item_integrity_flags).map(cleanId).sort(),
    }))
    .sort((left, right) => cleanId(left?.task_critique_token).localeCompare(cleanId(right?.task_critique_token)));
  return clone;
}

function canonicalDataset(value) {
  const clone = structuredClone(value);
  clone.positions = canonicalPositions(clone.positions);
  clone.ratings = arrayValue(clone.ratings).sort((left, right) => cleanId(left?.rating_id).localeCompare(cleanId(right?.rating_id)));
  clone.ingestion_events = arrayValue(clone.ingestion_events).sort((left, right) =>
    cleanId(left?.ingestion_event_id).localeCompare(cleanId(right?.ingestion_event_id)),
  );
  return clone;
}

function canonicalPositions(value) {
  return arrayValue(value)
    .map((position) => ({
      ...position,
      critique_ids: arrayValue(position?.critique_ids).map(cleanId).sort(),
      critique_versions: Object.fromEntries(
        Object.entries(objectOrEmpty(position?.critique_versions)).sort(([left], [right]) => left.localeCompare(right)),
      ),
    }))
    .sort((left, right) => cleanId(left?.position_id).localeCompare(cleanId(right?.position_id)));
}

function sumDispositions(submissionReceipts) {
  const result = Object.fromEntries(INGESTION_DISPOSITIONS.map((value) => [value, 0]));
  for (const receipt of submissionReceipts) {
    for (const disposition of INGESTION_DISPOSITIONS) result[disposition] += receipt.dispositions[disposition] ?? 0;
  }
  return result;
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

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
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

function arrayValue(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.participant_bundles)) return value.participant_bundles;
  if (Array.isArray(value?.submissions)) return value.submissions;
  return [];
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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

function pathInside(root, candidate) {
  const normalizedRoot = resolve(root);
  const normalizedCandidate = resolve(candidate);
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}${sep}`);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help") || process.argv.length < 6) {
    console.log(
      "Usage: node scripts/pilot-rating-ingestion.mjs <operator-index.json> <bundles.json> <submissions.json> <ingestion-control.json> [existing-dataset.json] [--controlled-output <private-path>]",
    );
    console.log("Simulation prints only a privacy-safe summary. Controlled ingestion writes the private dataset and receipt outside the repository with mode 0600.");
    console.log("Rejected responses are retained in the raw submission and QC records but are not materialized as accepted ratings.");
  } else {
    const root = resolve(import.meta.dirname, "..");
    const [operatorIndex, bundles, submissions, control] = await Promise.all(
      process.argv.slice(2, 6).map(async (path) => JSON.parse(await readFile(resolve(path), "utf8"))),
    );
    const controlOutputIndex = process.argv.indexOf("--controlled-output");
    const controlledOutput = controlOutputIndex >= 0 ? process.argv[controlOutputIndex + 1] : null;
    const positionalExisting = process.argv[6] && process.argv[6] !== "--controlled-output" ? process.argv[6] : null;
    const existingDataset = positionalExisting ? JSON.parse(await readFile(resolve(positionalExisting), "utf8")) : null;
    const report = ingestPilotInitialRatings(operatorIndex, bundles, submissions, control, existingDataset);

    if (report.mode === "controlled_ingestion") {
      if (!controlledOutput) throw new PilotRatingIngestionError("Controlled ingestion requires --controlled-output.");
      const outputPath = resolve(controlledOutput);
      if (pathInside(root, outputPath)) throw new PilotRatingIngestionError("Controlled ingestion output must be outside the repository.");
      await writeFile(outputPath, `${JSON.stringify({ dataset: report.dataset, receipt: report.receipt }, null, 2)}\n`, { mode: 0o600 });
      await chmod(outputPath, 0o600);
    } else if (controlledOutput) {
      throw new PilotRatingIngestionError("Simulation mode does not write controlled ingestion output.");
    }

    console.log(JSON.stringify(sanitizePilotRatingIngestionSummary(report), null, 2));
  }
}
