import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { validatePilotRatingDataset } from "./pilot-rating-analysis.mjs";
import {
  INGESTION_DISPOSITIONS,
  PilotRatingIngestionError,
  assertPublicPilotRatingIngestionSummary,
  assertRatingDatasetContainsNoTaskTokens,
  hashPilotOperatorIndex,
  hashPilotTaskSubmission,
  ingestPilotInitialRatings,
  sanitizePilotRatingIngestionSummary,
  validatePilotRatingIngestionControl,
} from "./pilot-rating-ingestion.mjs";
import { generatePilotTaskBundles } from "./pilot-task-bundle-generator.mjs";

const REQUIRED_CONTROLLED_AUTHORIZATION_PHRASES = Object.freeze([
  "Q-006B approved",
  "Q-006C approved",
  "protected manifest frozen",
  "controlled assignment generated",
  "task bundles generated",
  "final readiness signed",
  "task-bundle distribution authorized",
  "rating work authorized",
  "quality control complete",
  "rating ingestion authorized",
  "private controlled storage confirmed",
]);

export function validatePilotRatingIngestionContract(contract, methodology, assignmentInput, taskContent, controlBase) {
  const errors = [];
  const sourceBoundary = objectOrEmpty(contract?.source_boundary);
  const canonicalInputs = objectOrEmpty(contract?.canonical_inputs);
  const inputBinding = objectOrEmpty(contract?.input_binding);
  const qualityControl = objectOrEmpty(contract?.quality_control);
  const materialization = objectOrEmpty(contract?.materialization);
  const replay = objectOrEmpty(contract?.append_only_and_replay_policy);
  const event = objectOrEmpty(contract?.ingestion_event);
  const authorization = objectOrEmpty(contract?.authorization);
  const controlledAuthorization = objectOrEmpty(authorization.controlled_ingestion);
  const publicSummary = objectOrEmpty(contract?.public_summary);
  const governance = objectOrEmpty(contract?.governance);

  if (contract?.contract_id !== "metaphilosophy-pilot-rating-ingestion-v1-2026-08-01") {
    errors.push("contract_id must identify the 2026-08-01 pilot rating-ingestion contract.");
  }
  if (contract?.contract_version !== 1) errors.push("contract_version must equal 1.");
  if (contract?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (contract?.status !== "implementation_template_non_binding_no_real_submission_or_rating_data") {
    errors.push("status must remain a non-binding template with no real submission or rating data.");
  }

  if (sourceBoundary.primary_reference !== "A dataset of rated conceptual arguments") {
    errors.push("source_boundary must identify A dataset of rated conceptual arguments.");
  }
  if (sourceBoundary.reference_role !== "methodological_prior_art_and_external_benchmark") {
    errors.push("LMCA must remain methodological prior art and an external benchmark.");
  }
  if (sourceBoundary.direct_row_reuse !== false) errors.push("Direct LMCA row reuse must remain false.");

  if (canonicalInputs.operator_index_version !== "pilot-task-bundle-operator-index-v1") {
    errors.push("canonical_inputs.operator_index_version is incorrect.");
  }
  if (canonicalInputs.task_bundle_version !== "pilot-task-bundle-v1") {
    errors.push("canonical_inputs.task_bundle_version is incorrect.");
  }
  if (canonicalInputs.task_submission_version !== 1 || canonicalInputs.target_rating_dataset_version !== 1) {
    errors.push("Submission and target dataset versions must equal 1.");
  }
  if (canonicalInputs.rubric_version !== "rubric-v2-seven-dimensional") {
    errors.push("canonical_inputs.rubric_version is incorrect.");
  }
  if (!sameStringSet(canonicalInputs.required_score_dimensions, [
    "centrality",
    "strength",
    "correctness",
    "clarity",
    "dead_weight",
    "single_issue",
    "overall",
  ])) {
    errors.push("canonical_inputs.required_score_dimensions must contain the seven rubric dimensions exactly.");
  }

  for (const field of [
    "operator_index_sha256_required",
    "combined_bundle_commitment_sha256_required",
    "individual_bundle_hash_must_match_operator_index",
    "individual_bundle_body_hash_must_recompute",
    "submission_must_pass_task_bundle_validator",
    "canonical_submission_sha256_computed_by_ingestion",
    "response_array_order_independent_submission_hash",
    "operator_index_array_order_independent_hash",
    "target_dataset_positions_must_match_operator_index_manifest",
  ]) {
    if (inputBinding[field] !== true) errors.push(`input_binding.${field} must equal true.`);
  }

  if (qualityControl.decision_required_for_every_submitted_response !== true) {
    errors.push("Every submitted response must require a quality-control decision.");
  }
  if (!sameStringSet(qualityControl.allowed_dispositions, INGESTION_DISPOSITIONS)) {
    errors.push("quality_control.allowed_dispositions must contain the three ingestion dispositions exactly.");
  }
  if (qualityControl.quality_control_decision_does_not_modify_submitted_scores !== true) {
    errors.push("Quality control must not modify submitted scores.");
  }

  if (materialization.accepted_records_only !== true || materialization.accepted_field_value !== true) {
    errors.push("Materialization must create accepted records only.");
  }
  if (materialization.task_tokens_must_not_enter_rating_dataset !== true) {
    errors.push("Task tokens must be prohibited from the rating dataset.");
  }
  if (materialization.rejected_responses_materialized !== false || materialization.raw_submissions_retained_separately !== true) {
    errors.push("Rejected responses must not be materialized and raw submissions must remain separately retained.");
  }

  for (const field of [
    "exact_submission_replay_rejected",
    "duplicate_initial_rating_rejected",
    "rating_versions_remain_contiguous",
    "existing_initial_rating_requires_already_materialized_noop",
    "rejected_response_may_be_corrected_only_through_a_new_canonical_submission",
    "new_submission_cannot_overwrite_an_existing_initial_rating",
    "later_object_level_revision_uses_the_separate_rerating_contract",
  ]) {
    if (replay[field] !== true) errors.push(`append_only_and_replay_policy.${field} must equal true.`);
  }

  if (event.private_receipt_required !== true || event.dataset_hash_after_ingestion_required !== true) {
    errors.push("A private receipt and post-ingestion dataset hash are required.");
  }
  if (event.receipt_storage !== "private_controlled_record_only") {
    errors.push("The ingestion receipt must remain a private controlled record.");
  }

  if (controlledAuthorization.currently_authorized !== false) errors.push("Controlled ingestion must remain unauthorized.");
  const controlledRequirements = normalizeStrings(controlledAuthorization.required_true_fields);
  for (const phrase of REQUIRED_CONTROLLED_AUTHORIZATION_PHRASES) {
    if (!controlledRequirements.includes(phrase)) errors.push(`controlled_ingestion.required_true_fields must include ${phrase}.`);
  }
  if (controlledAuthorization.minimum_versioned_approval_records !== 4) {
    errors.push("Controlled ingestion must require at least four versioned approval records.");
  }
  if (controlledAuthorization.controlled_output_must_be_outside_repository !== true || controlledAuthorization.controlled_output_file_mode !== "0600") {
    errors.push("Controlled ingestion output must remain outside the repository with file mode 0600.");
  }

  if (publicSummary.simulation_may_publish_exact_synthetic_counts !== true || publicSummary.controlled_ingestion_exact_counts_withheld_by_default !== true) {
    errors.push("Public-summary count policy is incomplete.");
  }
  const exclusions = normalizeStrings(publicSummary.must_exclude).join(" ").toLowerCase();
  for (const fragment of ["participant", "position", "critique", "rating ids", "bundle", "task tokens", "submission hashes", "decision", "rating content", "dataset", "receipt"]) {
    if (!exclusions.includes(fragment)) errors.push(`public_summary.must_exclude must include ${fragment}.`);
  }

  for (const field of [
    "binding_effect",
    "q_006a_approved",
    "q_006b_approved",
    "q_006c_approved",
    "controlled_assignment_generation_authorized",
    "controlled_task_bundle_generation_authorized",
    "task_bundle_distribution_authorized",
    "rating_work_authorized",
    "quality_control_acceptance_authorized",
    "controlled_rating_ingestion_authorized",
    "funding_submission_authorized",
    "phase_2_authorized",
  ]) {
    if (governance[field] !== false) errors.push(`governance.${field} must remain false.`);
  }

  let synthetic = null;
  let replayRejected = false;
  let rejectionPath = null;
  try {
    const taskReport = generatePilotTaskBundles(methodology, assignmentInput, taskContent);
    const submissions = completeSyntheticSubmissions(taskReport.participant_bundles);
    const control = completeSyntheticControl(controlBase, taskReport.operator_index, submissions);
    const controlValidation = validatePilotRatingIngestionControl(
      taskReport.operator_index,
      taskReport.participant_bundles,
      submissions,
      control,
    );
    if (controlValidation.status !== "pass") errors.push(...controlValidation.errors.map((error) => `Synthetic control: ${error}`));
    synthetic = ingestPilotInitialRatings(
      taskReport.operator_index,
      taskReport.participant_bundles,
      submissions,
      control,
    );
    const ratingValidation = validatePilotRatingDataset(synthetic.dataset, { requireComplete: true });
    if (ratingValidation.status !== "pass") errors.push(...ratingValidation.errors.map((error) => `Synthetic dataset: ${error}`));
    if (synthetic.dataset.ratings.length !== 96) errors.push("Synthetic complete ingestion must materialize 96 ratings.");
    if (synthetic.receipt.disposition_counts.accepted_materialize !== 96) {
      errors.push("Synthetic complete ingestion must record 96 accepted-materialize decisions.");
    }
    assertRatingDatasetContainsNoTaskTokens(synthetic.dataset);
    const summary = sanitizePilotRatingIngestionSummary(synthetic);
    assertPublicPilotRatingIngestionSummary(summary);

    try {
      ingestPilotInitialRatings(
        taskReport.operator_index,
        taskReport.participant_bundles,
        submissions,
        control,
        synthetic.dataset,
      );
    } catch (error) {
      replayRejected = error instanceof PilotRatingIngestionError && /Submission replay rejected/.test(error.message);
    }
    if (!replayRejected) errors.push("Exact synthetic submission replay must fail closed.");

    const rejectionControl = completeSyntheticControl(controlBase, taskReport.operator_index, submissions);
    rejectionControl.quality_control_decisions[0].disposition = "rejected_no_materialization";
    rejectionControl.quality_control_decisions[0].decision_reason = "Synthetic rejection-path test.";
    rejectionPath = ingestPilotInitialRatings(
      taskReport.operator_index,
      taskReport.participant_bundles,
      submissions,
      rejectionControl,
    );
    if (rejectionPath.dataset.ratings.length !== 95) errors.push("One rejected synthetic response must yield 95 materialized ratings.");
    if (rejectionPath.receipt.disposition_counts.rejected_no_materialization !== 1) {
      errors.push("Synthetic rejection path must record one rejected response.");
    }
  } catch (error) {
    errors.push(`Synthetic ingestion verification failed: ${error.message}`);
  }

  return {
    status: errors.length ? "fail" : "pass",
    contract_id: contract?.contract_id ?? null,
    synthetic_complete_ratings: synthetic?.dataset?.ratings?.length ?? null,
    synthetic_complete_dataset_sha256: synthetic?.target_dataset_sha256_after ?? null,
    synthetic_ingestion_event_sha256: synthetic?.ingestion_event_sha256 ?? null,
    synthetic_replay_rejected: replayRejected,
    synthetic_rejection_path_ratings: rejectionPath?.dataset?.ratings?.length ?? null,
    controlled_ingestion_authorized: governance.controlled_rating_ingestion_authorized ?? null,
    funding_submission_authorized: governance.funding_submission_authorized ?? null,
    phase_2_authorized: governance.phase_2_authorized ?? null,
    errors,
  };
}

export function completeSyntheticSubmissions(bundles) {
  return bundles.map((bundle, bundleIndex) => {
    const submission = structuredClone(bundle.submission_template);
    submission.submitted_at = new Date(Date.parse("2026-08-04T10:00:00.000Z") + bundleIndex * 60_000).toISOString();
    submission.responses = submission.responses.map((response, responseIndex) => ({
      ...response,
      scores: {
        centrality: syntheticScore(0.35, bundleIndex, responseIndex, 0.03),
        strength: syntheticScore(0.4, bundleIndex, responseIndex, 0.025),
        correctness: syntheticScore(0.72, bundleIndex, responseIndex, 0.015),
        clarity: syntheticScore(0.76, bundleIndex, responseIndex, 0.01),
        dead_weight: syntheticScore(0.18, bundleIndex, responseIndex, 0.008),
        single_issue: syntheticScore(0.78, bundleIndex, responseIndex, 0.009),
        overall: syntheticScore(0.42, bundleIndex, responseIndex, 0.02),
      },
      overall_rationale: `Synthetic ingestion response ${bundleIndex + 1}-${responseIndex + 1}.`,
      confidence: syntheticScore(0.68, bundleIndex, responseIndex, 0.006),
      time_spent_seconds: 300 + bundleIndex * 20 + responseIndex,
      insufficient_context: false,
      verification_status: responseIndex % 7 === 0 ? "verified" : "not_applicable",
      item_integrity_flags: responseIndex % 11 === 0 ? ["ambiguity"] : [],
    }));
    return submission;
  });
}

export function completeSyntheticControl(base, operatorIndex, submissions) {
  const control = structuredClone(base);
  control.operator_index_sha256 = hashPilotOperatorIndex(operatorIndex);
  control.bundle_commitment_sha256 = operatorIndex.bundle_commitment_sha256;
  control.quality_control_decisions = [];
  for (const [submissionIndex, submission] of submissions.entries()) {
    const submissionSha256 = hashPilotTaskSubmission(submission);
    for (const [responseIndex, response] of submission.responses.entries()) {
      control.quality_control_decisions.push({
        decision_id: `SIM_QC_${String(submissionIndex + 1).padStart(2, "0")}_${String(responseIndex + 1).padStart(2, "0")}`,
        submission_sha256: submissionSha256,
        task_critique_token: response.task_critique_token,
        disposition: "accepted_materialize",
        decision_reason: "Synthetic response is complete and structurally valid.",
        operator_id: "SIM_QC_OPERATOR",
        decided_at: new Date(Date.parse("2026-08-04T11:00:00.000Z") + submissionIndex * 60_000 + responseIndex * 1_000).toISOString(),
      });
    }
  }
  return control;
}

function syntheticScore(base, bundleIndex, responseIndex, increment) {
  return Math.min(0.98, Number((base + ((bundleIndex * 16 + responseIndex) % 12) * increment).toFixed(3)));
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeStrings(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean) : [];
}

function sameStringSet(left, right) {
  const leftValues = normalizeStrings(left);
  const rightValues = normalizeStrings(right);
  return leftValues.length === rightValues.length && rightValues.every((entry) => leftValues.includes(entry));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function readAndValidatePilotRatingIngestionContract(
  contractPath,
  methodologyPath,
  assignmentPath,
  taskContentPath,
  controlPath,
) {
  const [contract, methodology, assignmentInput, taskContent, controlBase] = await Promise.all([
    readJson(contractPath),
    readJson(methodologyPath),
    readJson(assignmentPath),
    readJson(taskContentPath),
    readJson(controlPath),
  ]);
  return validatePilotRatingIngestionContract(contract, methodology, assignmentInput, taskContent, controlBase);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const report = await readAndValidatePilotRatingIngestionContract(
    resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/pilot-rating-ingestion-contract.json`),
    resolve(process.argv[3] ?? `${root}/ops/next-steps-2026-07-23/pilot-methodology-recommendations.json`),
    resolve(process.argv[4] ?? `${root}/test/fixtures/pilot-assignment-synthetic.json`),
    resolve(process.argv[5] ?? `${root}/test/fixtures/pilot-task-content-synthetic.json`),
    resolve(process.argv[6] ?? `${root}/test/fixtures/pilot-rating-ingestion-control-synthetic.json`),
  );
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
