import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import {
  RATING_DIMENSIONS,
  generatePilotTaskBundles,
  sanitizePilotTaskBundleSummary,
  validatePilotTaskContentInput,
  validatePilotTaskSubmission,
} from "./pilot-task-bundle-generator.mjs";

const REQUIRED_HIDDEN_FIELDS = Object.freeze([
  "source class",
  "source identity",
  "author or model identity",
  "acquisition-judge records and scores",
  "provisional quality strata",
  "paired-rater identity and ratings",
  "aggregate ratings",
  "labels",
  "adjudication status",
]);

export function validatePilotTaskBundleContract(contract, methodology, assignmentInput, taskContent) {
  const errors = [];
  const canonicalInputs = objectOrEmpty(contract?.canonical_inputs);
  const blindPolicy = objectOrEmpty(contract?.blind_packet_policy);
  const tokenPolicy = objectOrEmpty(blindPolicy.task_tokens);
  const commitmentChain = objectOrEmpty(contract?.commitment_chain);
  const submission = objectOrEmpty(contract?.submission_contract);
  const authorization = objectOrEmpty(contract?.authorization);
  const controlledAuthorization = objectOrEmpty(authorization.controlled_generation);
  const distributionAuthorization = objectOrEmpty(authorization.distribution);
  const ratingAuthorization = objectOrEmpty(authorization.rating_work);
  const privacy = objectOrEmpty(contract?.privacy);
  const governance = objectOrEmpty(contract?.governance);

  if (contract?.contract_id !== "metaphilosophy-pilot-task-bundle-v1-2026-08-01") {
    errors.push("contract_id must identify the 2026-08-01 pilot task-bundle contract.");
  }
  if (contract?.contract_version !== 1) errors.push("contract_version must equal 1.");
  if (contract?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (contract?.status !== "implementation_template_non_binding_generation_and_distribution_not_authorized") {
    errors.push("status must keep generation and distribution non-binding and unauthorized.");
  }

  if (contract?.source_boundary?.primary_reference !== "A dataset of rated conceptual arguments") {
    errors.push("source_boundary must identify A dataset of rated conceptual arguments.");
  }
  if (contract?.source_boundary?.reference_role !== "methodological_prior_art_and_external_benchmark") {
    errors.push("The LMCA reference must remain methodological prior art and an external benchmark.");
  }
  if (contract?.source_boundary?.direct_row_reuse !== false) errors.push("Direct LMCA row reuse must remain false.");

  for (const [field, expected] of Object.entries({
    positions: 12,
    critiques_per_position: 4,
    participant_bundles: 6,
    positions_per_participant_bundle: 4,
    critiques_per_participant_bundle: 16,
    total_position_presentations: 24,
    total_critique_presentations: 96,
  })) {
    if (canonicalInputs[field] !== expected) errors.push(`canonical_inputs.${field} must equal ${expected}.`);
  }
  if (canonicalInputs.rubric_version !== "rubric-v2-seven-dimensional") {
    errors.push("canonical_inputs.rubric_version must equal rubric-v2-seven-dimensional.");
  }
  if (!sameStringSet(canonicalInputs.required_score_dimensions, RATING_DIMENSIONS)) {
    errors.push("canonical_inputs.required_score_dimensions must contain the seven rubric dimensions exactly.");
  }

  if (blindPolicy.position_and_critique_text_included !== true || blindPolicy.same_position_sibling_critiques_kept_together !== true) {
    errors.push("Blind packets must include exact text and keep sibling critiques together.");
  }
  if (blindPolicy.controlled_position_and_critique_ids_replaced_with_participant_specific_tokens !== true) {
    errors.push("Blind packets must replace controlled item IDs with participant-specific tokens.");
  }
  const hiddenFields = normalizeStrings(blindPolicy.must_hide);
  for (const field of REQUIRED_HIDDEN_FIELDS) {
    if (!hiddenFields.includes(field)) errors.push(`blind_packet_policy.must_hide must include ${field}.`);
  }
  if (tokenPolicy.participant_specific !== true || tokenPolicy.assignment_seed_reuse_prohibited !== true || tokenPolicy.raw_secret_publication_prohibited !== true) {
    errors.push("Task-token policy must preserve participant specificity, seed separation, and raw-secret non-publication.");
  }

  const requiredHashes = normalizeStrings(commitmentChain.required_hashes).join(" ").toLowerCase();
  for (const fragment of ["assignment", "manifest", "rubric", "task-content", "task-token-secret", "individual task-bundle", "combined six-bundle"]) {
    if (!requiredHashes.includes(fragment)) errors.push(`commitment_chain.required_hashes must include ${fragment}.`);
  }
  if (commitmentChain.input_array_order_independent !== true) errors.push("Task-content commitments must be input-array-order independent.");

  if (submission.stage !== "initial" || submission.submission_version !== 1 || submission.responses_required !== 16) {
    errors.push("Submission contract must require sixteen version-1 initial responses.");
  }
  if (submission.task_bundle_hash_must_match !== true || submission.every_assigned_task_token_exactly_once !== true) {
    errors.push("Submission contract must bind the exact bundle hash and every assigned task token.");
  }
  if (submission.controlled_source_or_assignment_metadata_in_submission_prohibited !== true) {
    errors.push("Submission contract must prohibit controlled source and assignment metadata.");
  }

  if (controlledAuthorization.currently_authorized !== false) errors.push("Controlled task generation must remain unauthorized.");
  if (controlledAuthorization.controlled_output_directory_must_be_outside_repository !== true) {
    errors.push("Controlled task output must remain outside the repository.");
  }
  if (controlledAuthorization.directory_mode !== "0700" || controlledAuthorization.bundle_and_operator_index_file_mode !== "0600") {
    errors.push("Controlled task output modes must remain 0700 for the directory and 0600 for files.");
  }
  if (distributionAuthorization.currently_authorized !== false || distributionAuthorization.not_authorized_by_generation !== true) {
    errors.push("Task distribution must remain separately unauthorized.");
  }
  if (ratingAuthorization.currently_authorized !== false || ratingAuthorization.not_authorized_by_generation_or_distribution_artifact !== true) {
    errors.push("Rating work must remain unauthorized by task artifacts.");
  }

  if (privacy.controlled_task_content !== "private_controlled_record_only") errors.push("Controlled task content must remain private.");
  if (privacy.operator_index !== "private_controlled_record_only") errors.push("The operator index must remain private.");
  const publicExclusions = normalizeStrings(privacy.public_summary_must_exclude).join(" ").toLowerCase();
  for (const fragment of ["participant", "position", "critique", "task tokens", "individual bundle", "text", "assignment pairs", "operator-index"]) {
    if (!publicExclusions.includes(fragment)) errors.push(`privacy.public_summary_must_exclude must include ${fragment}.`);
  }

  for (const field of [
    "binding_effect",
    "q_006a_approved",
    "q_006b_approved",
    "q_006c_approved",
    "task_bundle_generation_authorized",
    "task_bundle_distribution_authorized",
    "rating_work_authorized",
    "outreach_authorized",
    "payment_commitment_authorized",
    "funding_submission_authorized",
    "phase_2_authorized",
  ]) {
    if (governance[field] !== false) errors.push(`governance.${field} must remain false.`);
  }

  const contentValidation = validatePilotTaskContentInput(assignmentInput, taskContent);
  if (contentValidation.status !== "pass") errors.push(...contentValidation.errors.map((error) => `Synthetic task content: ${error}`));

  let generation = null;
  let publicSummary = null;
  let validSubmissionReport = null;
  if (contentValidation.status === "pass") {
    try {
      generation = generatePilotTaskBundles(methodology, assignmentInput, taskContent);
      publicSummary = sanitizePilotTaskBundleSummary(generation);
      if (generation.participant_bundles.length !== 6) errors.push("Synthetic generation must produce six task bundles.");
      if (generation.participant_bundles.some((bundle) => bundle.positions.length !== 4)) {
        errors.push("Each synthetic task bundle must contain four positions.");
      }
      if (generation.participant_bundles.some((bundle) => bundle.submission_template.responses.length !== 16)) {
        errors.push("Each synthetic task bundle must contain sixteen response templates.");
      }
      const firstBundle = generation.participant_bundles[0];
      const validSubmission = completeSyntheticSubmission(firstBundle);
      validSubmissionReport = validatePilotTaskSubmission(firstBundle, validSubmission);
      if (validSubmissionReport.status !== "pass") {
        errors.push(...validSubmissionReport.errors.map((error) => `Synthetic submission: ${error}`));
      }
      const incomplete = structuredClone(validSubmission);
      incomplete.responses.pop();
      const incompleteReport = validatePilotTaskSubmission(firstBundle, incomplete);
      if (incompleteReport.status !== "fail") errors.push("Incomplete synthetic submissions must fail closed.");
    } catch (error) {
      errors.push(`Synthetic generation failed: ${error.message}`);
    }
  }

  return {
    status: errors.length ? "fail" : "pass",
    contract_id: contract?.contract_id ?? null,
    synthetic_task_bundles: generation?.participant_bundles?.length ?? null,
    synthetic_bundle_commitment_sha256: generation?.bundle_commitment_sha256 ?? null,
    synthetic_public_summary_safe: publicSummary ? true : null,
    synthetic_submission_valid: validSubmissionReport?.status === "pass",
    controlled_generation_authorized: governance.task_bundle_generation_authorized ?? null,
    distribution_authorized: governance.task_bundle_distribution_authorized ?? null,
    rating_work_authorized: governance.rating_work_authorized ?? null,
    phase_2_authorized: governance.phase_2_authorized ?? null,
    errors,
  };
}

function completeSyntheticSubmission(bundle) {
  const submission = structuredClone(bundle.submission_template);
  submission.submitted_at = "2026-08-01T00:00:00.000Z";
  submission.responses = submission.responses.map((response, index) => ({
    ...response,
    scores: {
      centrality: 0.5,
      strength: 0.5,
      correctness: 0.9,
      clarity: 0.9,
      dead_weight: 0.1,
      single_issue: 0.9,
      overall: 0.5,
    },
    overall_rationale: `Synthetic test rationale ${index + 1}.`,
    confidence: 0.8,
    time_spent_seconds: 300 + index,
    insufficient_context: false,
    verification_status: "not_applicable",
    item_integrity_flags: [],
  }));
  return submission;
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeStrings(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean) : [];
}

function sameStringSet(left, right) {
  const leftSet = new Set(normalizeStrings(left));
  const rightSet = new Set(normalizeStrings(right));
  return leftSet.size === rightSet.size && [...leftSet].every((entry) => rightSet.has(entry));
}

export async function readAndValidatePilotTaskBundleContract(contractPath, methodologyPath, assignmentPath, taskContentPath) {
  const [contract, methodology, assignmentInput, taskContent] = await Promise.all([
    readJson(contractPath),
    readJson(methodologyPath),
    readJson(assignmentPath),
    readJson(taskContentPath),
  ]);
  return validatePilotTaskBundleContract(contract, methodology, assignmentInput, taskContent);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const report = await readAndValidatePilotTaskBundleContract(
    resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/pilot-task-bundle-contract.json`),
    resolve(process.argv[3] ?? `${root}/ops/next-steps-2026-07-23/pilot-methodology-recommendations.json`),
    resolve(process.argv[4] ?? `${root}/test/fixtures/pilot-assignment-synthetic.json`),
    resolve(process.argv[5] ?? `${root}/test/fixtures/pilot-task-content-synthetic.json`),
  );
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
