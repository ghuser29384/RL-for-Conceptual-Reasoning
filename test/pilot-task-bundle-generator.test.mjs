import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  PilotTaskBundleError,
  assertBlindTaskBundle,
  assertPublicPilotTaskBundleSummary,
  generatePilotTaskBundles,
  sanitizePilotTaskBundleSummary,
  validatePilotTaskContentInput,
  validatePilotTaskSubmission,
} from "../scripts/pilot-task-bundle-generator.mjs";

const root = resolve(import.meta.dirname, "..");
const methodologyPath = resolve(root, "ops/next-steps-2026-07-23/pilot-methodology-recommendations.json");
const assignmentPath = resolve(root, "test/fixtures/pilot-assignment-synthetic.json");
const taskContentPath = resolve(root, "test/fixtures/pilot-task-content-synthetic.json");

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadInputs() {
  return Promise.all([loadJson(methodologyPath), loadJson(assignmentPath), loadJson(taskContentPath)]);
}

function completeSubmission(bundle) {
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

test("generates six deterministic blind bundles with the exact 4-position and 16-critique workload", async () => {
  const [methodology, assignmentInput, taskContent] = await loadInputs();
  const report = generatePilotTaskBundles(methodology, assignmentInput, taskContent);
  assert.equal(report.mode, "simulation");
  assert.equal(report.participant_bundles.length, 6);
  assert.match(report.bundle_commitment_sha256, /^[a-f0-9]{64}$/);
  assert.equal(report.distribution_authorized, false);
  assert.equal(report.rating_work_authorized, false);
  assert.equal(report.phase_2_authorized, false);
  for (const bundle of report.participant_bundles) {
    assert.equal(assertBlindTaskBundle(bundle), true);
    assert.equal(bundle.positions.length, 4);
    assert.equal(bundle.positions.reduce((sum, position) => sum + position.critiques.length, 0), 16);
    assert.equal(bundle.submission_template.responses.length, 16);
    assert.match(bundle.bundle_id, /^PTB_[a-f0-9]{24}$/);
    assert.match(bundle.task_bundle_sha256, /^[a-f0-9]{64}$/);
  }
  assert.equal(report.operator_index.participant_bundles.length, 6);
  assert.equal(
    report.operator_index.participant_bundles.reduce(
      (sum, entry) => sum + entry.position_mappings.reduce((inner, position) => inner + position.critique_mappings.length, 0),
      0,
    ),
    96,
  );
});

test("strips every source, judge, label, paired-rater, aggregate, and adjudication field from rater bundles", async () => {
  const [methodology, assignmentInput, taskContent] = await loadInputs();
  const report = generatePilotTaskBundles(methodology, assignmentInput, taskContent);
  const serialized = JSON.stringify(report.participant_bundles);
  for (const forbidden of [
    '"slot_id":',
    '"position_id":',
    '"critique_id":',
    '"source_class":',
    '"topic_family":',
    '"source_identity":',
    '"author_or_model_identity":',
    '"acquisition_judge_record":',
    '"acquisition_judge_scores":',
    '"provisional_quality_stratum":',
    '"paired_rater_identity":',
    '"aggregate_ratings":',
    '"labels":',
    '"adjudication_status":',
    '"controlled_metadata":',
    "SIM_SOURCE_",
    "SIM_AUTHOR_",
    "MUST_BE_HIDDEN",
    "SIM_P01_C1",
  ]) {
    assert.equal(serialized.includes(forbidden), false, `blind bundle leaked ${forbidden}`);
  }
  assert.equal(serialized.includes(taskContent.task_token_secret), false);
});

test("is independent of assignment, task-position, and task-critique input-array order", async () => {
  const [methodology, assignmentInput, taskContent] = await loadInputs();
  const first = generatePilotTaskBundles(methodology, assignmentInput, taskContent);
  assignmentInput.positions.reverse();
  assignmentInput.participants.reverse();
  taskContent.positions.reverse();
  for (const position of taskContent.positions) position.critiques.reverse();
  const second = generatePilotTaskBundles(methodology, assignmentInput, taskContent);
  assert.equal(first.bundle_commitment_sha256, second.bundle_commitment_sha256);
  assert.equal(first.task_content_sha256, second.task_content_sha256);
  assert.deepEqual(first.participant_bundles, second.participant_bundles);
  assert.deepEqual(first.operator_index, second.operator_index);
});

test("changes the bundle commitment when frozen task text changes", async () => {
  const [methodology, assignmentInput, taskContent] = await loadInputs();
  const first = generatePilotTaskBundles(methodology, assignmentInput, taskContent);
  taskContent.positions[0].position_text += " Materially changed text.";
  const second = generatePilotTaskBundles(methodology, assignmentInput, taskContent);
  assert.notEqual(first.task_content_sha256, second.task_content_sha256);
  assert.notEqual(first.bundle_commitment_sha256, second.bundle_commitment_sha256);
});

test("uses participant-specific opaque task tokens for the same controlled item", async () => {
  const [methodology, assignmentInput, taskContent] = await loadInputs();
  const report = generatePilotTaskBundles(methodology, assignmentInput, taskContent);
  const mappings = [];
  for (const participant of report.operator_index.participant_bundles) {
    for (const position of participant.position_mappings) {
      if (position.position_id === "SIM_P01") mappings.push(position.task_position_token);
    }
  }
  assert.equal(mappings.length, 2);
  assert.notEqual(mappings[0], mappings[1]);
  assert.ok(mappings.every((token) => /^T_[a-f0-9]{64}$/.test(token)));
});

test("rejects task content drift, assignment-seed reuse, and premature controlled generation", async () => {
  const [, assignmentInput, taskContent] = await loadInputs();
  taskContent.positions[0].critiques.pop();
  taskContent.task_token_secret = assignmentInput.seed;
  taskContent.data_class = "private_controlled_task_content";
  taskContent.mode = "controlled_generation";
  assignmentInput.data_class = "private_controlled_assignment_input";
  assignmentInput.mode = "controlled_generation";
  const validation = validatePilotTaskContentInput(assignmentInput, taskContent);
  assert.equal(validation.status, "fail");
  assert.ok(validation.errors.some((error) => error.includes("exactly four")));
  assert.ok(validation.errors.some((error) => error.includes("distinct from the assignment seed")));
  for (const field of ["q_006b_approved", "q_006c_approved", "protected_manifest_frozen", "task_bundle_generation_authorized"]) {
    assert.ok(validation.errors.some((error) => error.includes(field)), `missing error for ${field}`);
  }
  assert.ok(validation.errors.some((error) => error.includes("approval record")));
  assert.ok(validation.errors.some((error) => error.includes("approved_at")));
  assert.ok(validation.errors.some((error) => error.includes("private_controlled_storage_confirmed")));
});

test("publishes only aggregate commitments and no identifiers, tokens, text, or individual bundle hashes", async () => {
  const [methodology, assignmentInput, taskContent] = await loadInputs();
  const summary = sanitizePilotTaskBundleSummary(generatePilotTaskBundles(methodology, assignmentInput, taskContent));
  assert.equal(assertPublicPilotTaskBundleSummary(summary), true);
  assert.deepEqual(summary.counts, {
    task_bundles: 6,
    positions_per_bundle: 4,
    critiques_per_position: 4,
    critiques_per_bundle: 16,
    total_bundle_position_presentations: 24,
    total_bundle_critique_presentations: 96,
  });
  const serialized = JSON.stringify(summary);
  for (const forbidden of [
    '"participant_id":',
    '"position_id":',
    '"critique_id":',
    '"task_position_token":',
    '"task_critique_token":',
    '"bundle_id":',
    '"task_bundle_sha256":',
    '"participant_bundles":',
    '"operator_index":',
    "Synthetic position",
    "Synthetic critique",
    "SIM_P",
  ]) {
    assert.equal(serialized.includes(forbidden), false, `public summary leaked ${forbidden}`);
  }
});

test("accepts a complete hash-bound submission and rejects tampering, duplicates, omissions, bad scores, and hidden metadata", async () => {
  const [methodology, assignmentInput, taskContent] = await loadInputs();
  const bundle = generatePilotTaskBundles(methodology, assignmentInput, taskContent).participant_bundles[0];
  const valid = completeSubmission(bundle);
  assert.equal(validatePilotTaskSubmission(bundle, valid).status, "pass");

  const tamperedHash = structuredClone(valid);
  tamperedHash.task_bundle_sha256 = "0".repeat(64);
  assert.ok(validatePilotTaskSubmission(bundle, tamperedHash).errors.some((error) => error.includes("bundle commitment")));

  const duplicate = structuredClone(valid);
  duplicate.responses[1].task_critique_token = duplicate.responses[0].task_critique_token;
  assert.ok(validatePilotTaskSubmission(bundle, duplicate).errors.some((error) => error.includes("duplicates")));
  assert.ok(validatePilotTaskSubmission(bundle, duplicate).errors.some((error) => error.includes("missing")));

  const invalidScore = structuredClone(valid);
  invalidScore.responses[0].scores.overall = 1.2;
  assert.ok(validatePilotTaskSubmission(bundle, invalidScore).errors.some((error) => error.includes("scores.overall")));

  const incomplete = structuredClone(valid);
  incomplete.responses.pop();
  assert.equal(validatePilotTaskSubmission(bundle, incomplete).status, "fail");

  const leaked = structuredClone(valid);
  leaked.responses[0].source_identity = "forbidden";
  assert.ok(validatePilotTaskSubmission(bundle, leaked).errors.some((error) => error.includes("forbidden controlled metadata")));
});

test("fails loudly if a blind bundle is manually contaminated", async () => {
  const [methodology, assignmentInput, taskContent] = await loadInputs();
  const bundle = generatePilotTaskBundles(methodology, assignmentInput, taskContent).participant_bundles[0];
  bundle.positions[0].source_class = "forbidden";
  assert.throws(
    () => assertBlindTaskBundle(bundle),
    (error) => error instanceof PilotTaskBundleError && /forbidden metadata/.test(error.message),
  );
});
