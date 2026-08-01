import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { validatePilotRatingDataset } from "../scripts/pilot-rating-analysis.mjs";
import {
  PilotRatingIngestionError,
  assertPublicPilotRatingIngestionSummary,
  assertRatingDatasetContainsNoTaskTokens,
  hashPilotOperatorIndex,
  hashPilotTaskSubmission,
  ingestPilotInitialRatings,
  sanitizePilotRatingIngestionSummary,
  validatePilotRatingIngestionControl,
} from "../scripts/pilot-rating-ingestion.mjs";
import { generatePilotTaskBundles } from "../scripts/pilot-task-bundle-generator.mjs";
import {
  completeSyntheticControl,
  completeSyntheticSubmissions,
} from "../scripts/verify-pilot-rating-ingestion-contract.mjs";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const methodologyPath = resolve(root, "ops/next-steps-2026-07-23/pilot-methodology-recommendations.json");
const assignmentPath = resolve(root, "test/fixtures/pilot-assignment-synthetic.json");
const taskContentPath = resolve(root, "test/fixtures/pilot-task-content-synthetic.json");
const controlPath = resolve(root, "test/fixtures/pilot-rating-ingestion-control-synthetic.json");
const ingestionScriptPath = resolve(root, "scripts/pilot-rating-ingestion.mjs");

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadWorkflow() {
  const [methodology, assignmentInput, taskContent, controlBase] = await Promise.all([
    loadJson(methodologyPath),
    loadJson(assignmentPath),
    loadJson(taskContentPath),
    loadJson(controlPath),
  ]);
  const taskReport = generatePilotTaskBundles(methodology, assignmentInput, taskContent);
  const submissions = completeSyntheticSubmissions(taskReport.participant_bundles);
  const control = completeSyntheticControl(controlBase, taskReport.operator_index, submissions);
  return { methodology, assignmentInput, taskContent, controlBase, taskReport, submissions, control };
}

test("materializes a complete six-rater pilot into 96 accepted append-only initial ratings", async () => {
  const { taskReport, submissions, control } = await loadWorkflow();
  const result = ingestPilotInitialRatings(
    taskReport.operator_index,
    taskReport.participant_bundles,
    submissions,
    control,
  );
  assert.equal(result.mode, "simulation");
  assert.equal(result.controlled_ingestion_completed, false);
  assert.equal(result.dataset.positions.length, 12);
  assert.equal(result.dataset.ratings.length, 96);
  assert.equal(result.receipt.disposition_counts.accepted_materialize, 96);
  assert.equal(result.receipt.disposition_counts.rejected_no_materialization, 0);
  assert.equal(result.receipt.disposition_counts.already_materialized_noop, 0);
  assert.equal(result.funding_submission_authorized, false);
  assert.equal(result.phase_2_authorized, false);
  assert.equal(validatePilotRatingDataset(result.dataset, { requireComplete: true }).status, "pass");
  assert.equal(assertRatingDatasetContainsNoTaskTokens(result.dataset), true);

  for (const rating of result.dataset.ratings) {
    assert.equal(rating.stage, "initial");
    assert.equal(rating.version, 1);
    assert.equal(rating.accepted, true);
    assert.equal(rating.operator_assigned, false);
    assert.equal(rating.predecessor_rating_id, null);
    assert.equal(rating.object_level_revision_reason, null);
    assert.equal(rating.source_record_kind, "blind_task_submission_v1");
    assert.match(rating.source_submission_sha256, /^[a-f0-9]{64}$/);
    assert.match(rating.source_task_bundle_sha256, /^[a-f0-9]{64}$/);
    assert.match(rating.source_operator_index_sha256, /^[a-f0-9]{64}$/);
    assert.match(rating.ingestion_event_sha256, /^[a-f0-9]{64}$/);
    assert.equal(rating.locked_at, submissions.find((submission) => submission.participant_id === rating.rater_id).submitted_at);
  }
});

test("is independent of bundle, submission, decision, and operator-index array order", async () => {
  const { taskReport, submissions, control } = await loadWorkflow();
  const first = ingestPilotInitialRatings(taskReport.operator_index, taskReport.participant_bundles, submissions, control);

  const reorderedIndex = structuredClone(taskReport.operator_index);
  reorderedIndex.participant_bundles.reverse();
  for (const participant of reorderedIndex.participant_bundles) {
    participant.position_mappings.reverse();
    for (const position of participant.position_mappings) position.critique_mappings.reverse();
  }
  const reorderedBundles = structuredClone(taskReport.participant_bundles).reverse();
  const reorderedSubmissions = structuredClone(submissions).reverse();
  for (const submission of reorderedSubmissions) {
    submission.responses.reverse();
    for (const response of submission.responses) response.item_integrity_flags.reverse();
  }
  const reorderedControl = structuredClone(control);
  reorderedControl.operator_index_sha256 = hashPilotOperatorIndex(reorderedIndex);
  reorderedControl.quality_control_decisions.reverse();

  const second = ingestPilotInitialRatings(
    reorderedIndex,
    reorderedBundles,
    reorderedSubmissions,
    reorderedControl,
  );
  assert.equal(first.ingestion_event_sha256, second.ingestion_event_sha256);
  assert.equal(first.target_dataset_sha256_after, second.target_dataset_sha256_after);
  assert.deepEqual(first.dataset, second.dataset);
  assert.deepEqual(first.receipt, second.receipt);
});

test("rejects exact submission replay against an existing ingestion history", async () => {
  const { taskReport, submissions, control } = await loadWorkflow();
  const first = ingestPilotInitialRatings(taskReport.operator_index, taskReport.participant_bundles, submissions, control);
  assert.throws(
    () => ingestPilotInitialRatings(
      taskReport.operator_index,
      taskReport.participant_bundles,
      submissions,
      control,
      first.dataset,
    ),
    (error) => error instanceof PilotRatingIngestionError && /Submission replay rejected/.test(error.message),
  );
});

test("retains rejected responses outside the accepted dataset and materializes only accepted decisions", async () => {
  const { taskReport, submissions, control } = await loadWorkflow();
  control.quality_control_decisions[0].disposition = "rejected_no_materialization";
  control.quality_control_decisions[0].decision_reason = "Synthetic response requires correction before acceptance.";
  const result = ingestPilotInitialRatings(taskReport.operator_index, taskReport.participant_bundles, submissions, control);
  assert.equal(result.dataset.ratings.length, 95);
  assert.equal(result.receipt.disposition_counts.accepted_materialize, 95);
  assert.equal(result.receipt.disposition_counts.rejected_no_materialization, 1);
  assert.equal(result.receipt.raw_submissions_retained_separately, true);
  assert.equal(result.receipt.rejected_responses_materialized_as_ratings, false);
  assert.equal(validatePilotRatingDataset(result.dataset, { requireComplete: false }).status, "pass");
});

test("supports a corrected submission using no-op decisions for previously materialized responses", async () => {
  const { taskReport, submissions, controlBase } = await loadWorkflow();
  const bundle = taskReport.participant_bundles[0];
  const firstSubmission = submissions[0];
  const firstControl = completeSyntheticControl(controlBase, taskReport.operator_index, [firstSubmission]);
  const rejectedToken = firstSubmission.responses[0].task_critique_token;
  firstControl.quality_control_decisions[0].disposition = "rejected_no_materialization";
  firstControl.quality_control_decisions[0].decision_reason = "Synthetic correction required.";
  const first = ingestPilotInitialRatings(taskReport.operator_index, [bundle], [firstSubmission], firstControl);
  assert.equal(first.dataset.ratings.length, 15);

  const correctedSubmission = structuredClone(firstSubmission);
  correctedSubmission.submitted_at = "2026-08-05T10:00:00.000Z";
  correctedSubmission.responses.find((response) => response.task_critique_token === rejectedToken).overall_rationale += " Corrected.";
  const correctedControl = completeSyntheticControl(controlBase, taskReport.operator_index, [correctedSubmission]);
  correctedControl.ingested_at = "2026-08-05T12:00:00.000Z";
  for (const decision of correctedControl.quality_control_decisions) {
    decision.decided_at = "2026-08-05T11:00:00.000Z";
    if (decision.task_critique_token !== rejectedToken) {
      decision.disposition = "already_materialized_noop";
      decision.decision_reason = "An accepted initial rating already exists from the earlier submission.";
    }
  }
  const second = ingestPilotInitialRatings(
    taskReport.operator_index,
    [bundle],
    [correctedSubmission],
    correctedControl,
    first.dataset,
  );
  assert.equal(second.dataset.ratings.length, 16);
  assert.equal(second.receipt.disposition_counts.accepted_materialize, 1);
  assert.equal(second.receipt.disposition_counts.already_materialized_noop, 15);
  assert.equal(second.receipt.disposition_counts.rejected_no_materialization, 0);
});

test("rejects no-op without an existing accepted initial rating and rejects duplicate materialization", async () => {
  const { taskReport, submissions, controlBase } = await loadWorkflow();
  const bundle = taskReport.participant_bundles[0];
  const submission = submissions[0];
  const noopControl = completeSyntheticControl(controlBase, taskReport.operator_index, [submission]);
  noopControl.quality_control_decisions[0].disposition = "already_materialized_noop";
  noopControl.quality_control_decisions[0].decision_reason = "Invalid synthetic no-op.";
  assert.throws(
    () => ingestPilotInitialRatings(taskReport.operator_index, [bundle], [submission], noopControl),
    (error) => error instanceof PilotRatingIngestionError && /requires an existing accepted initial rating/.test(error.message),
  );

  const acceptedControl = completeSyntheticControl(controlBase, taskReport.operator_index, [submission]);
  const first = ingestPilotInitialRatings(taskReport.operator_index, [bundle], [submission], acceptedControl);
  const changedSubmission = structuredClone(submission);
  changedSubmission.submitted_at = "2026-08-05T10:00:00.000Z";
  changedSubmission.responses[0].overall_rationale += " Changed submission.";
  const duplicateControl = completeSyntheticControl(controlBase, taskReport.operator_index, [changedSubmission]);
  duplicateControl.ingested_at = "2026-08-05T12:00:00.000Z";
  for (const decision of duplicateControl.quality_control_decisions) decision.decided_at = "2026-08-05T11:00:00.000Z";
  assert.throws(
    () => ingestPilotInitialRatings(
      taskReport.operator_index,
      [bundle],
      [changedSubmission],
      duplicateControl,
      first.dataset,
    ),
    (error) => error instanceof PilotRatingIngestionError && /would duplicate an existing initial rating/.test(error.message),
  );
});

test("fails closed on missing decisions, invalid authorization, tampered bundle bodies, and manifest drift", async () => {
  const { taskReport, submissions, control } = await loadWorkflow();
  const missingDecision = structuredClone(control);
  missingDecision.quality_control_decisions.pop();
  assert.equal(
    validatePilotRatingIngestionControl(taskReport.operator_index, taskReport.participant_bundles, submissions, missingDecision).status,
    "fail",
  );

  const prematureControlled = structuredClone(control);
  prematureControlled.mode = "controlled_ingestion";
  prematureControlled.data_class = "private_controlled_rating_ingestion";
  prematureControlled.target_data_class = "private_controlled_pilot_record";
  prematureControlled.synthetic_acceptance_only = false;
  const controlledValidation = validatePilotRatingIngestionControl(
    taskReport.operator_index,
    taskReport.participant_bundles,
    submissions,
    prematureControlled,
  );
  assert.equal(controlledValidation.status, "fail");
  for (const field of [
    "q_006b_approved",
    "q_006c_approved",
    "final_readiness_signed",
    "task_bundle_distribution_authorized",
    "rating_work_authorized",
    "quality_control_complete",
    "rating_ingestion_authorized",
  ]) {
    assert.ok(controlledValidation.errors.some((error) => error.includes(field)), `missing authorization error for ${field}`);
  }

  const tamperedBundles = structuredClone(taskReport.participant_bundles);
  tamperedBundles[0].positions[0].position_text += " Tampered.";
  assert.ok(
    validatePilotRatingIngestionControl(taskReport.operator_index, tamperedBundles, submissions, control).errors.some((error) =>
      error.includes("bundle body"),
    ),
  );

  const valid = ingestPilotInitialRatings(taskReport.operator_index, taskReport.participant_bundles, submissions, control);
  const driftedDataset = structuredClone(valid.dataset);
  driftedDataset.positions[0].critique_ids[0] = "SIM_DRIFT";
  const newSubmission = structuredClone(submissions[0]);
  newSubmission.submitted_at = "2026-08-05T10:00:00.000Z";
  newSubmission.responses[0].overall_rationale += " New.";
  const newControl = completeSyntheticControl(await loadJson(controlPath), taskReport.operator_index, [newSubmission]);
  newControl.ingested_at = "2026-08-05T12:00:00.000Z";
  for (const decision of newControl.quality_control_decisions) decision.decided_at = "2026-08-05T11:00:00.000Z";
  assert.throws(
    () => ingestPilotInitialRatings(taskReport.operator_index, [taskReport.participant_bundles[0]], [newSubmission], newControl, driftedDataset),
    (error) => error instanceof PilotRatingIngestionError && /positions must match/.test(error.message),
  );
});

test("public summary contains commitments and aggregate synthetic counts but no controlled records", async () => {
  const { taskReport, submissions, control } = await loadWorkflow();
  const result = ingestPilotInitialRatings(taskReport.operator_index, taskReport.participant_bundles, submissions, control);
  const summary = sanitizePilotRatingIngestionSummary(result);
  assert.equal(assertPublicPilotRatingIngestionSummary(summary), true);
  assert.equal(summary.counts.submissions_processed, 6);
  assert.equal(summary.counts.responses_reviewed, 96);
  assert.equal(summary.counts.ratings_materialized, 96);
  assert.equal(summary.counts.exact_counts_withheld, false);
  const serialized = JSON.stringify(summary);
  for (const forbidden of [
    '"participant_id":',
    '"rater_id":',
    '"position_id":',
    '"critique_id":',
    '"rating_id":',
    '"bundle_id":',
    '"task_bundle_sha256":',
    '"task_position_token":',
    '"task_critique_token":',
    '"submission_sha256":',
    '"decision_id":',
    '"operator_id":',
    '"dataset":',
    '"receipt":',
    "SIM_P",
    "Synthetic ingestion response",
  ]) {
    assert.equal(serialized.includes(forbidden), false, `public summary leaked ${forbidden}`);
  }
});

test("runs the ingestion CLI in public-summary-only simulation mode", async () => {
  const { taskReport, submissions, control } = await loadWorkflow();
  const directory = await mkdtemp(join(tmpdir(), "metaphilosophy-ingestion-"));
  try {
    const operatorPath = join(directory, "operator-index.json");
    const bundlesPath = join(directory, "bundles.json");
    const submissionsPath = join(directory, "submissions.json");
    const controlFilePath = join(directory, "control.json");
    await Promise.all([
      writeFile(operatorPath, JSON.stringify(taskReport.operator_index)),
      writeFile(bundlesPath, JSON.stringify({ participant_bundles: taskReport.participant_bundles })),
      writeFile(submissionsPath, JSON.stringify({ submissions })),
      writeFile(controlFilePath, JSON.stringify(control)),
    ]);
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [ingestionScriptPath, operatorPath, bundlesPath, submissionsPath, controlFilePath],
      { cwd: root, maxBuffer: 4 * 1024 * 1024 },
    );
    assert.equal(stderr, "");
    const summary = JSON.parse(stdout);
    assert.equal(summary.report_version, "pilot-rating-ingestion-public-summary-v1");
    assert.equal(summary.mode, "simulation");
    assert.equal(summary.counts.ratings_materialized, 96);
    assert.equal(summary.phase_2_authorized, false);
    assert.equal(JSON.stringify(summary).includes('"rating_id":'), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("canonical submission hash ignores response ordering but changes when submitted content changes", async () => {
  const { submissions } = await loadWorkflow();
  const first = submissions[0];
  const reordered = structuredClone(first);
  reordered.responses.reverse();
  for (const response of reordered.responses) response.item_integrity_flags.reverse();
  assert.equal(hashPilotTaskSubmission(first), hashPilotTaskSubmission(reordered));
  reordered.responses[0].overall_rationale += " Material change.";
  assert.notEqual(hashPilotTaskSubmission(first), hashPilotTaskSubmission(reordered));
});
