import { createHash, createHmac } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";

import {
  generatePilotAssignments,
  sanitizePilotAssignmentReport,
} from "./pilot-assignment-generator.mjs";

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

const CONTROLLED_TASK_AUTHORIZATION_FIELDS = Object.freeze([
  "q_006b_approved",
  "q_006c_approved",
  "protected_manifest_frozen",
  "task_bundle_generation_authorized",
]);

const FORBIDDEN_RATER_BUNDLE_KEYS = new Set([
  "slot_id",
  "position_id",
  "critique_id",
  "source_class",
  "topic_family",
  "source_identity",
  "author_or_model_identity",
  "acquisition_judge_record",
  "acquisition_judge_scores",
  "provisional_quality_stratum",
  "paired_rater_id",
  "paired_rater_identity",
  "aggregate_ratings",
  "labels",
  "adjudication_status",
  "controlled_metadata",
]);

const FORBIDDEN_PUBLIC_SUMMARY_KEYS = new Set([
  "participant_id",
  "participant_ids",
  "slot_id",
  "position_id",
  "position_ids",
  "critique_id",
  "critique_ids",
  "task_position_token",
  "task_critique_token",
  "task_token_secret",
  "bundle_id",
  "task_bundle_sha256",
  "participant_bundles",
  "operator_index",
  "position_mappings",
  "critique_mappings",
  "rater_ids",
]);

const FORBIDDEN_SUBMISSION_KEYS = new Set([
  "position_id",
  "critique_id",
  "source_class",
  "topic_family",
  "source_identity",
  "author_or_model_identity",
  "acquisition_judge_record",
  "acquisition_judge_scores",
  "provisional_quality_stratum",
  "paired_rater_id",
  "paired_rater_identity",
  "aggregate_ratings",
  "labels",
  "adjudication_status",
  "controlled_metadata",
]);

export class PilotTaskBundleError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PilotTaskBundleError";
    this.details = details;
  }
}

export function validatePilotTaskContentInput(assignmentInput, taskContent) {
  const errors = [];
  const assignmentPositions = Array.isArray(assignmentInput?.positions) ? assignmentInput.positions : [];
  const positions = Array.isArray(taskContent?.positions) ? taskContent.positions : [];
  const authorization = objectOrEmpty(taskContent?.authorization);

  if (!nonEmptyString(taskContent?.task_content_id)) errors.push("task_content_id is required.");
  if (taskContent?.input_version !== 1) errors.push("input_version must equal 1.");
  if (taskContent?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (taskContent?.programme_id !== assignmentInput?.programme_id) {
    errors.push("task content and assignment input must use the same programme_id.");
  }
  if (!new Set(["synthetic_test_fixture", "private_controlled_task_content"]).has(taskContent?.data_class)) {
    errors.push("data_class must be synthetic_test_fixture or private_controlled_task_content.");
  }
  if (!new Set(["simulation", "controlled_generation"]).has(taskContent?.mode)) {
    errors.push("mode must be simulation or controlled_generation.");
  }
  if (taskContent?.mode !== assignmentInput?.mode) {
    errors.push("task content mode must match assignment input mode.");
  }
  if (taskContent?.rubric_version !== "rubric-v2-seven-dimensional") {
    errors.push("rubric_version must equal rubric-v2-seven-dimensional.");
  }
  for (const field of ["rubric_sha256", "protected_manifest_sha256"]) {
    if (!sha256Hex(taskContent?.[field])) errors.push(`${field} must be a lowercase SHA-256 hex digest.`);
  }
  if (!nonEmptyString(taskContent?.task_token_secret) || taskContent.task_token_secret.length < 16) {
    errors.push("task_token_secret must be a non-empty controlled secret of at least 16 characters.");
  }
  if (taskContent?.task_token_secret === assignmentInput?.seed) {
    errors.push("task_token_secret must be distinct from the assignment seed.");
  }

  if (taskContent?.mode === "simulation") {
    if (taskContent?.data_class !== "synthetic_test_fixture") {
      errors.push("simulation mode requires synthetic_test_fixture task content.");
    }
    for (const field of CONTROLLED_TASK_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== false) errors.push(`simulation authorization.${field} must remain false.`);
    }
    if (authorization.private_controlled_storage_confirmed !== false) {
      errors.push("simulation authorization.private_controlled_storage_confirmed must remain false.");
    }
    if (!emptyArray(authorization.approval_record_ids) || authorization.approved_at !== null) {
      errors.push("simulation mode must not contain approval records or an approval timestamp.");
    }
  }

  if (taskContent?.mode === "controlled_generation") {
    if (taskContent?.data_class !== "private_controlled_task_content") {
      errors.push("controlled_generation requires private_controlled_task_content.");
    }
    for (const field of CONTROLLED_TASK_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== true) errors.push(`controlled authorization.${field} must equal true.`);
    }
    if (authorization.private_controlled_storage_confirmed !== true) {
      errors.push("controlled generation requires private_controlled_storage_confirmed=true.");
    }
    if (!Array.isArray(authorization.approval_record_ids) || authorization.approval_record_ids.length < 3) {
      errors.push("controlled task generation requires at least three versioned approval record IDs.");
    }
    if (!validIsoTimestamp(authorization.approved_at)) {
      errors.push("controlled task generation requires a valid authorization.approved_at timestamp.");
    }
  }

  if (authorization.distribution_authorized !== false) {
    errors.push("authorization.distribution_authorized must remain false; generation does not authorize distribution.");
  }
  if (authorization.rating_work_authorized !== false) {
    errors.push("authorization.rating_work_authorized must remain false; generation does not authorize rating work.");
  }

  if (positions.length !== 12) errors.push("positions must contain exactly 12 entries.");
  const assignmentBySlot = new Map(assignmentPositions.map((position) => [cleanId(position?.slot_id), position]));
  const taskBySlot = new Map();
  const seenPositionIds = new Set();
  const seenCritiqueIds = new Set();

  for (const [index, position] of positions.entries()) {
    const prefix = `positions[${index}]`;
    const slotId = cleanId(position?.slot_id);
    const positionId = cleanId(position?.position_id);
    const assignmentPosition = assignmentBySlot.get(slotId);
    const critiques = Array.isArray(position?.critiques) ? position.critiques : [];

    if (!assignmentPosition) errors.push(`${prefix}.slot_id must reference an assignment-input slot.`);
    if (taskBySlot.has(slotId)) errors.push(`Duplicate task-content slot: ${slotId}.`);
    taskBySlot.set(slotId, position);
    if (!controlledId(positionId)) errors.push(`${prefix}.position_id must be a controlled identifier.`);
    if (seenPositionIds.has(positionId)) errors.push(`${prefix}.position_id duplicates an earlier position ID.`);
    seenPositionIds.add(positionId);
    if (assignmentPosition && positionId !== cleanId(assignmentPosition.position_id)) {
      errors.push(`${prefix}.position_id must match the assignment input for ${slotId}.`);
    }
    if (!Number.isInteger(position?.position_version) || position.position_version < 1) {
      errors.push(`${prefix}.position_version must be a positive integer.`);
    }
    if (!nonEmptyString(position?.position_text)) errors.push(`${prefix}.position_text is required.`);
    if (!position?.controlled_metadata || typeof position.controlled_metadata !== "object" || Array.isArray(position.controlled_metadata)) {
      errors.push(`${prefix}.controlled_metadata must be an object retained only in controlled input.`);
    }
    if (position?.controlled_metadata?.source_class !== assignmentPosition?.source_class) {
      errors.push(`${prefix}.controlled_metadata.source_class must match the assignment input.`);
    }
    if (position?.controlled_metadata?.topic_family !== assignmentPosition?.topic_family) {
      errors.push(`${prefix}.controlled_metadata.topic_family must match the assignment input.`);
    }

    if (critiques.length !== 4) errors.push(`${prefix}.critiques must contain exactly four entries.`);
    const expectedCritiqueIds = Array.isArray(assignmentPosition?.critique_ids)
      ? assignmentPosition.critique_ids.map(cleanId)
      : [];
    const critiqueById = new Map();
    for (const [critiqueIndex, critique] of critiques.entries()) {
      const critiquePrefix = `${prefix}.critiques[${critiqueIndex}]`;
      const critiqueId = cleanId(critique?.critique_id);
      if (!controlledId(critiqueId)) errors.push(`${critiquePrefix}.critique_id must be a controlled identifier.`);
      if (critiqueById.has(critiqueId)) errors.push(`${critiquePrefix}.critique_id duplicates a sibling critique.`);
      critiqueById.set(critiqueId, critique);
      if (seenCritiqueIds.has(critiqueId)) errors.push(`${critiquePrefix}.critique_id is reused by another position.`);
      seenCritiqueIds.add(critiqueId);
      if (!expectedCritiqueIds.includes(critiqueId)) {
        errors.push(`${critiquePrefix}.critique_id must match the assignment input for ${slotId}.`);
      }
      if (!Number.isInteger(critique?.critique_version) || critique.critique_version < 1) {
        errors.push(`${critiquePrefix}.critique_version must be a positive integer.`);
      }
      if (!nonEmptyString(critique?.critique_text)) errors.push(`${critiquePrefix}.critique_text is required.`);
    }
    for (const expectedCritiqueId of expectedCritiqueIds) {
      if (!critiqueById.has(expectedCritiqueId)) errors.push(`${prefix}.critiques is missing ${expectedCritiqueId}.`);
    }

    if (taskContent?.mode === "simulation") {
      if (!positionId.startsWith("SIM_")) errors.push(`${prefix}.position_id must start with SIM_ in simulation mode.`);
      if ([...critiqueById.keys()].some((id) => !id.startsWith("SIM_"))) {
        errors.push(`${prefix}.critique IDs must start with SIM_ in simulation mode.`);
      }
    }
  }

  for (const slotId of assignmentBySlot.keys()) {
    if (!taskBySlot.has(slotId)) errors.push(`task content is missing assignment slot ${slotId}.`);
  }

  return {
    status: errors.length ? "fail" : "pass",
    mode: taskContent?.mode ?? null,
    data_class: taskContent?.data_class ?? null,
    positions: positions.length,
    critiques: positions.reduce((sum, position) => sum + (Array.isArray(position?.critiques) ? position.critiques.length : 0), 0),
    errors,
  };
}

export function generatePilotTaskBundles(methodology, assignmentInput, taskContent) {
  const contentValidation = validatePilotTaskContentInput(assignmentInput, taskContent);
  if (contentValidation.status !== "pass") {
    throw new PilotTaskBundleError(`Pilot task content is invalid:\n${contentValidation.errors.join("\n")}`, {
      validation: contentValidation,
    });
  }

  const assignment = generatePilotAssignments(methodology, assignmentInput);
  const contentByPositionId = new Map(
    taskContent.positions.map((position) => [cleanId(position.position_id), structuredClone(position)]),
  );
  const participantBundles = [];
  const operatorEntries = [];
  const participantIds = assignment.anonymous_slot_mapping
    .map((entry) => entry.participant_id)
    .sort((left, right) => left.localeCompare(right));

  for (const participantId of participantIds) {
    const assignedPositions = assignment.position_assignments
      .filter((position) => position.rater_ids.includes(participantId))
      .sort((left, right) => left.slot_id.localeCompare(right.slot_id));
    const positionMappings = [];
    const bundlePositions = [];

    for (const assignmentPosition of assignedPositions) {
      const sourcePosition = contentByPositionId.get(assignmentPosition.position_id);
      const critiqueById = new Map(sourcePosition.critiques.map((critique) => [cleanId(critique.critique_id), critique]));
      const taskPositionToken = tokenFor(
        taskContent.task_token_secret,
        `${participantId}|position|${assignmentPosition.position_id}|v${sourcePosition.position_version}`,
      );
      const critiqueMappings = [];
      const bundleCritiques = assignmentPosition.critique_ids.map((critiqueId) => {
        const sourceCritique = critiqueById.get(critiqueId);
        const taskCritiqueToken = tokenFor(
          taskContent.task_token_secret,
          `${participantId}|critique|${assignmentPosition.position_id}|${critiqueId}|v${sourceCritique.critique_version}`,
        );
        critiqueMappings.push({
          task_critique_token: taskCritiqueToken,
          critique_id: critiqueId,
          critique_version: sourceCritique.critique_version,
        });
        return {
          task_critique_token: taskCritiqueToken,
          critique_version: sourceCritique.critique_version,
          critique_text: sourceCritique.critique_text,
          response_template: emptyResponseTemplate(),
        };
      });
      positionMappings.push({
        task_position_token: taskPositionToken,
        position_id: assignmentPosition.position_id,
        position_version: sourcePosition.position_version,
        slot_id: assignmentPosition.slot_id,
        critique_mappings: critiqueMappings,
      });
      bundlePositions.push({
        task_position_token: taskPositionToken,
        position_version: sourcePosition.position_version,
        position_text: sourcePosition.position_text,
        critiques: bundleCritiques,
      });
    }

    const bundleBody = {
      bundle_version: "pilot-task-bundle-v1",
      programme_id: taskContent.programme_id,
      data_class: taskContent.data_class,
      participant_id: participantId,
      assignment_selected_mapping_hash: assignment.selected_mapping_hash,
      protected_manifest_sha256: taskContent.protected_manifest_sha256,
      rubric_version: taskContent.rubric_version,
      rubric_sha256: taskContent.rubric_sha256,
      blind_conditions: {
        source_class_hidden: true,
        source_and_author_or_model_identity_hidden: true,
        acquisition_judge_outputs_hidden: true,
        provisional_quality_strata_hidden: true,
        paired_rater_identity_and_ratings_hidden: true,
        aggregate_ratings_hidden: true,
        labels_hidden: true,
        adjudication_status_hidden: true,
      },
      response_contract: {
        stage: "initial",
        version: 1,
        required_score_dimensions: [...RATING_DIMENSIONS],
        required_auxiliary_fields: [
          "overall_rationale",
          "confidence",
          "time_spent_seconds",
          "insufficient_context",
          "verification_status",
          "item_integrity_flags",
        ],
      },
      positions: bundlePositions,
      distribution_authorized: false,
      rating_work_authorized: false,
      phase_2_authorized: false,
    };
    assertBlindTaskBundle(bundleBody);
    const taskBundleSha256 = sha256(canonicalStringify(bundleBody));
    const bundleId = `PTB_${taskBundleSha256.slice(0, 24)}`;
    const bundle = {
      ...bundleBody,
      bundle_id: bundleId,
      task_bundle_sha256: taskBundleSha256,
      submission_template: {
        submission_version: 1,
        programme_id: taskContent.programme_id,
        participant_id: participantId,
        bundle_id: bundleId,
        task_bundle_sha256: taskBundleSha256,
        rubric_version: taskContent.rubric_version,
        stage: "initial",
        submitted_at: null,
        responses: bundlePositions.flatMap((position) =>
          position.critiques.map((critique) => ({
            task_position_token: position.task_position_token,
            task_critique_token: critique.task_critique_token,
            ...emptyResponseTemplate(),
          })),
        ),
      },
    };
    assertBlindTaskBundle(bundle);
    participantBundles.push(bundle);
    operatorEntries.push({
      participant_id: participantId,
      bundle_id: bundleId,
      task_bundle_sha256: taskBundleSha256,
      position_mappings: positionMappings,
    });
  }

  verifyTaskBundleArithmetic(participantBundles);
  const bundleHashes = participantBundles.map((bundle) => bundle.task_bundle_sha256).sort();
  const operatorIndex = {
    index_version: "pilot-task-bundle-operator-index-v1",
    programme_id: taskContent.programme_id,
    data_class: taskContent.data_class,
    mode: taskContent.mode,
    assignment_selected_mapping_hash: assignment.selected_mapping_hash,
    protected_manifest_sha256: taskContent.protected_manifest_sha256,
    rubric_version: taskContent.rubric_version,
    rubric_sha256: taskContent.rubric_sha256,
    task_content_sha256: sha256(canonicalStringify(canonicalTaskContentForHash(taskContent))),
    task_token_secret_sha256: sha256(taskContent.task_token_secret),
    bundle_commitment_sha256: sha256(bundleHashes.join("\n")),
    participant_bundles: operatorEntries,
    distribution_authorized: false,
    rating_work_authorized: false,
    phase_2_authorized: false,
  };

  return {
    report_version: "pilot-task-bundle-generation-v1",
    programme_id: taskContent.programme_id,
    data_class: taskContent.data_class,
    mode: taskContent.mode,
    generated_under_controlled_authorization: taskContent.mode === "controlled_generation",
    distribution_authorized: false,
    rating_work_authorized: false,
    phase_2_authorized: false,
    assignment,
    task_content_sha256: operatorIndex.task_content_sha256,
    task_token_secret_sha256: operatorIndex.task_token_secret_sha256,
    protected_manifest_sha256: taskContent.protected_manifest_sha256,
    rubric_version: taskContent.rubric_version,
    rubric_sha256: taskContent.rubric_sha256,
    bundle_commitment_sha256: operatorIndex.bundle_commitment_sha256,
    participant_bundles: participantBundles,
    operator_index: operatorIndex,
  };
}

export function sanitizePilotTaskBundleSummary(report) {
  const publicSummary = {
    report_version: "pilot-task-bundle-public-summary-v1",
    programme_id: report.programme_id,
    data_class: report.data_class,
    mode: report.mode,
    generated_under_controlled_authorization: report.generated_under_controlled_authorization === true,
    distribution_authorized: false,
    rating_work_authorized: false,
    phase_2_authorized: false,
    assignment: sanitizePilotAssignmentReport(report.assignment),
    protected_manifest_sha256: report.protected_manifest_sha256,
    rubric_version: report.rubric_version,
    rubric_sha256: report.rubric_sha256,
    task_content_sha256: report.task_content_sha256,
    task_token_secret_sha256: report.task_token_secret_sha256,
    bundle_commitment_sha256: report.bundle_commitment_sha256,
    counts: {
      task_bundles: report.participant_bundles.length,
      positions_per_bundle: 4,
      critiques_per_position: 4,
      critiques_per_bundle: 16,
      total_bundle_position_presentations: report.participant_bundles.length * 4,
      total_bundle_critique_presentations: report.participant_bundles.length * 16,
    },
    blindness: {
      source_class_hidden: true,
      source_and_author_or_model_identity_hidden: true,
      acquisition_judge_outputs_hidden: true,
      provisional_quality_strata_hidden: true,
      paired_rater_identity_and_ratings_hidden: true,
      aggregate_ratings_hidden: true,
      labels_hidden: true,
      adjudication_status_hidden: true,
    },
    privacy: {
      contains_participant_ids: false,
      contains_position_or_critique_ids: false,
      contains_task_tokens: false,
      contains_individual_bundle_ids_or_hashes: false,
      contains_position_or_critique_text: false,
      contains_assignment_pairs: false,
      controlled_bundles_and_operator_index_withheld: true,
    },
  };
  assertPublicPilotTaskBundleSummary(publicSummary);
  return publicSummary;
}

export function assertBlindTaskBundle(bundle) {
  const forbidden = findKeys(bundle, FORBIDDEN_RATER_BUNDLE_KEYS);
  if (forbidden.length) {
    throw new PilotTaskBundleError(`Blind task bundle exposes forbidden metadata: ${forbidden.join(", ")}`);
  }
  if (bundle?.distribution_authorized !== false || bundle?.rating_work_authorized !== false || bundle?.phase_2_authorized !== false) {
    throw new PilotTaskBundleError("Task bundles must not authorize distribution, rating work, or Phase 2.");
  }
  return true;
}

export function assertPublicPilotTaskBundleSummary(summary) {
  const forbidden = findKeys(summary, FORBIDDEN_PUBLIC_SUMMARY_KEYS);
  if (forbidden.length) {
    throw new PilotTaskBundleError(`Public task-bundle summary exposes controlled fields: ${forbidden.join(", ")}`);
  }
  if (summary?.distribution_authorized !== false || summary?.rating_work_authorized !== false || summary?.phase_2_authorized !== false) {
    throw new PilotTaskBundleError("Public task-bundle summary must not authorize distribution, rating work, or Phase 2.");
  }
  for (const field of [
    "contains_participant_ids",
    "contains_position_or_critique_ids",
    "contains_task_tokens",
    "contains_individual_bundle_ids_or_hashes",
    "contains_position_or_critique_text",
    "contains_assignment_pairs",
  ]) {
    if (summary?.privacy?.[field] !== false) throw new PilotTaskBundleError(`privacy.${field} must equal false.`);
  }
  return true;
}

export function validatePilotTaskSubmission(bundle, submission) {
  const errors = [];
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    return { status: "fail", responses: 0, errors: ["bundle must be an object."] };
  }
  if (!submission || typeof submission !== "object" || Array.isArray(submission)) {
    return { status: "fail", responses: 0, errors: ["submission must be an object."] };
  }

  if (submission?.submission_version !== 1) errors.push("submission_version must equal 1.");
  if (submission?.programme_id !== bundle.programme_id) errors.push("submission programme_id must match the bundle.");
  if (submission?.participant_id !== bundle.participant_id) errors.push("submission participant_id must match the bundle.");
  if (submission?.bundle_id !== bundle.bundle_id) errors.push("submission bundle_id must match the bundle.");
  if (submission?.task_bundle_sha256 !== bundle.task_bundle_sha256) {
    errors.push("submission task_bundle_sha256 must match the bundle commitment.");
  }
  if (submission?.rubric_version !== bundle.rubric_version) errors.push("submission rubric_version must match the bundle.");
  if (submission?.stage !== "initial") errors.push("submission stage must equal initial.");
  if (!validIsoTimestamp(submission?.submitted_at)) errors.push("submission submitted_at must be a valid ISO-8601 timestamp.");

  const responses = Array.isArray(submission?.responses) ? submission.responses : [];
  if (responses.length !== 16) errors.push("submission responses must contain exactly 16 initial ratings.");
  const expected = new Map();
  for (const position of Array.isArray(bundle?.positions) ? bundle.positions : []) {
    for (const critique of Array.isArray(position?.critiques) ? position.critiques : []) {
      expected.set(critique.task_critique_token, position.task_position_token);
    }
  }
  const seen = new Set();
  for (const [index, response] of responses.entries()) {
    const prefix = `responses[${index}]`;
    const positionToken = cleanId(response?.task_position_token);
    const critiqueToken = cleanId(response?.task_critique_token);
    if (!expected.has(critiqueToken)) errors.push(`${prefix}.task_critique_token is not in the assigned bundle.`);
    if (expected.get(critiqueToken) !== positionToken) errors.push(`${prefix}.task_position_token does not match its critique token.`);
    if (seen.has(critiqueToken)) errors.push(`${prefix}.task_critique_token duplicates an earlier response.`);
    seen.add(critiqueToken);
    validateResponsePayload(response, prefix, errors);
  }
  for (const critiqueToken of expected.keys()) {
    if (!seen.has(critiqueToken)) errors.push("submission is missing an assigned critique response.");
  }

  const forbidden = findKeys(submission, FORBIDDEN_SUBMISSION_KEYS);
  for (const path of forbidden) errors.push(`submission contains forbidden controlled metadata: ${path}.`);

  return {
    status: errors.length ? "fail" : "pass",
    responses: responses.length,
    expected_responses: expected.size,
    errors,
  };
}

function validateResponsePayload(response, prefix, errors) {
  const scores = objectOrEmpty(response?.scores);
  const scoreKeys = Object.keys(scores).sort();
  const requiredKeys = [...RATING_DIMENSIONS].sort();
  if (scoreKeys.length !== requiredKeys.length || scoreKeys.some((key, index) => key !== requiredKeys[index])) {
    errors.push(`${prefix}.scores must contain the seven rubric dimensions exactly.`);
  }
  for (const dimension of RATING_DIMENSIONS) {
    if (!unitIntervalNumber(scores[dimension])) errors.push(`${prefix}.scores.${dimension} must lie in [0, 1].`);
  }
  if (!nonEmptyString(response?.overall_rationale)) errors.push(`${prefix}.overall_rationale is required.`);
  if (!unitIntervalNumber(response?.confidence)) errors.push(`${prefix}.confidence must lie in [0, 1].`);
  if (!Number.isInteger(response?.time_spent_seconds) || response.time_spent_seconds <= 0) {
    errors.push(`${prefix}.time_spent_seconds must be a positive integer.`);
  }
  if (typeof response?.insufficient_context !== "boolean") errors.push(`${prefix}.insufficient_context must be boolean.`);
  if (!VERIFICATION_STATUSES.includes(response?.verification_status)) {
    errors.push(`${prefix}.verification_status is not recognized.`);
  }
  const flags = normalizeIds(response?.item_integrity_flags);
  if (!Array.isArray(response?.item_integrity_flags)) errors.push(`${prefix}.item_integrity_flags must be an array.`);
  if (new Set(flags).size !== flags.length) errors.push(`${prefix}.item_integrity_flags must be unique.`);
  for (const flag of flags) {
    if (!ITEM_INTEGRITY_FLAGS.includes(flag)) errors.push(`${prefix}.item_integrity_flags contains unsupported value ${flag}.`);
  }
}

function emptyResponseTemplate() {
  return {
    scores: Object.fromEntries(RATING_DIMENSIONS.map((dimension) => [dimension, null])),
    overall_rationale: null,
    confidence: null,
    time_spent_seconds: null,
    insufficient_context: null,
    verification_status: null,
    item_integrity_flags: [],
  };
}

function verifyTaskBundleArithmetic(bundles) {
  if (bundles.length !== 6) throw new PilotTaskBundleError("Task generation must produce exactly six participant bundles.");
  const positionTokens = new Set();
  const critiqueTokens = new Set();
  for (const bundle of bundles) {
    if (bundle.positions.length !== 4) throw new PilotTaskBundleError("Each participant bundle must contain exactly four positions.");
    const critiqueCount = bundle.positions.reduce((sum, position) => sum + position.critiques.length, 0);
    if (critiqueCount !== 16) throw new PilotTaskBundleError("Each participant bundle must contain exactly sixteen critiques.");
    for (const position of bundle.positions) {
      if (position.critiques.length !== 4) throw new PilotTaskBundleError("Each bundled position must contain exactly four sibling critiques.");
      if (positionTokens.has(position.task_position_token)) throw new PilotTaskBundleError("Task position tokens must be participant-specific and unique.");
      positionTokens.add(position.task_position_token);
      for (const critique of position.critiques) {
        if (critiqueTokens.has(critique.task_critique_token)) throw new PilotTaskBundleError("Task critique tokens must be participant-specific and unique.");
        critiqueTokens.add(critique.task_critique_token);
      }
    }
  }
  if (positionTokens.size !== 24 || critiqueTokens.size !== 96) {
    throw new PilotTaskBundleError("Task bundle arithmetic must contain 24 position presentations and 96 critique presentations.");
  }
}

function canonicalTaskContentForHash(value) {
  const clone = redactTaskSecret(value);
  if (Array.isArray(clone.positions)) {
    clone.positions = [...clone.positions]
      .map((position) => ({
        ...position,
        critiques: Array.isArray(position?.critiques)
          ? [...position.critiques].sort((left, right) => cleanId(left?.critique_id).localeCompare(cleanId(right?.critique_id)))
          : [],
      }))
      .sort((left, right) => cleanId(left?.slot_id).localeCompare(cleanId(right?.slot_id)));
  }
  return clone;
}

function redactTaskSecret(value) {
  const clone = structuredClone(value);
  clone.task_token_secret = `[sha256:${sha256(String(value?.task_token_secret ?? ""))}]`;
  return clone;
}

function tokenFor(secret, material) {
  return `T_${createHmac("sha256", secret).update(material).digest("hex")}`;
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

function unitIntervalNumber(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
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
      "Usage: node scripts/pilot-task-bundle-generator.mjs <pilot-methodology-recommendations.json> <assignment-input.json> <task-content.json> [--controlled-output-dir <private-dir>]",
    );
    console.log("Simulation prints only a public summary. Controlled generation writes six blind bundles plus an operator index outside the repository with file mode 0600.");
    console.log("Task generation never authorizes distribution, rating work, funding submission, or Phase 2.");
  } else {
    const root = resolve(import.meta.dirname, "..");
    const methodology = JSON.parse(await readFile(resolve(process.argv[2]), "utf8"));
    const assignmentInput = JSON.parse(await readFile(resolve(process.argv[3]), "utf8"));
    const taskContent = JSON.parse(await readFile(resolve(process.argv[4]), "utf8"));
    const flagIndex = process.argv.indexOf("--controlled-output-dir");
    const outputDir = flagIndex >= 0 ? process.argv[flagIndex + 1] : null;
    const report = generatePilotTaskBundles(methodology, assignmentInput, taskContent);

    if (report.mode === "controlled_generation") {
      if (!outputDir) throw new PilotTaskBundleError("Controlled task generation requires --controlled-output-dir.");
      const resolvedOutputDir = resolve(outputDir);
      if (pathInside(root, resolvedOutputDir)) {
        throw new PilotTaskBundleError("Controlled task bundles must be written outside the repository.");
      }
      await mkdir(resolvedOutputDir, { recursive: true, mode: 0o700 });
      await chmod(resolvedOutputDir, 0o700);
      for (const [index, bundle] of report.participant_bundles.entries()) {
        const fileName = `blind-task-bundle-${String(index + 1).padStart(2, "0")}.json`;
        const path = resolve(resolvedOutputDir, fileName);
        await writeFile(path, `${JSON.stringify(bundle, null, 2)}\n`, { mode: 0o600 });
        await chmod(path, 0o600);
        report.operator_index.participant_bundles[index].bundle_file = fileName;
      }
      const indexPath = resolve(resolvedOutputDir, "operator-index.json");
      await writeFile(indexPath, `${JSON.stringify(report.operator_index, null, 2)}\n`, { mode: 0o600 });
      await chmod(indexPath, 0o600);
    } else if (outputDir) {
      throw new PilotTaskBundleError("Simulation mode does not write controlled task bundles.");
    }

    console.log(JSON.stringify(sanitizePilotTaskBundleSummary(report), null, 2));
  }
}
