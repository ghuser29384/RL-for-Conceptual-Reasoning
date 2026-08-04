import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { validatePilotRatingIngestionContract } from "./verify-pilot-rating-ingestion-contract.mjs";

const root = resolve(import.meta.dirname, "..");
const ops = resolve(root, "ops/next-steps-2026-07-23");

export async function verifyPilotRatingIngestionIntegration() {
  const [
    contract,
    methodology,
    assignmentInput,
    taskContent,
    controlBase,
    contractBrief,
    readme,
    q006Packet,
    q006aApproval,
    raterBrief,
    implementation,
    workflow,
  ] = await Promise.all([
    readJson(resolve(ops, "pilot-rating-ingestion-contract.json")),
    readJson(resolve(ops, "pilot-methodology-recommendations.json")),
    readJson(resolve(root, "test/fixtures/pilot-assignment-synthetic.json")),
    readJson(resolve(root, "test/fixtures/pilot-task-content-synthetic.json")),
    readJson(resolve(root, "test/fixtures/pilot-rating-ingestion-control-synthetic.json")),
    readFile(resolve(ops, "pilot-rating-ingestion-contract.md"), "utf8"),
    readFile(resolve(ops, "README.md"), "utf8"),
    readFile(resolve(ops, "q-006-decision-packet.md"), "utf8"),
    readFile(resolve(ops, "q-006a-owner-approval.md"), "utf8"),
    readFile(resolve(ops, "early-career-rater-brief.md"), "utf8"),
    readFile(resolve(root, "scripts/pilot-rating-ingestion.mjs"), "utf8"),
    readFile(resolve(root, ".github/workflows/metaphilosophy-program-integrity.yml"), "utf8"),
  ]);

  const report = validatePilotRatingIngestionContract(
    contract,
    methodology,
    assignmentInput,
    taskContent,
    controlBase,
  );
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.synthetic_complete_ratings, 96);
  assert.equal(report.synthetic_replay_rejected, true);
  assert.equal(report.synthetic_rejection_path_ratings, 95);
  assert.equal(report.controlled_ingestion_authorized, false);
  assert.equal(report.funding_submission_authorized, false);
  assert.equal(report.phase_2_authorized, false);

  for (const pattern of [
    /One explicit decision per response/i,
    /accepted_materialize/,
    /rejected_no_materialization/,
    /already_materialized_noop/,
    /exact canonical submission hash already recorded/i,
    /does not authorize payment, a funding application, publication, or Phase 2/i,
  ]) {
    assert.match(contractBrief, pattern);
  }

  for (const pattern of [
    /Replay-safe rating ingestion/i,
    /structural submission validity as acceptance/i,
    /rejected_no_materialization/,
    /exact submission replay/i,
    /pilot-rating-ingestion-contract\.json/,
    /verify-pilot-rating-ingestion-contract\.mjs/,
  ]) {
    assert.match(readme, pattern);
  }

  for (const pattern of [
    /Rating-ingestion proposal/i,
    /structural submission validity does not imply acceptance/i,
    /Rating-ingestion and adjudication boundaries/i,
    /A valid submission is not an accepted rating/i,
    /Ingestion does not authorize adjudication/i,
  ]) {
    assert.match(q006Packet, pattern);
  }

  for (const pattern of [
    /Approved by the project owner/i,
    /controlled rating ingestion/i,
    /Rating-ingestion proposal/i,
    /submission validation does not authorize acceptance/i,
    /any real quality-control acceptance, rejection, no-op, ingestion event, accepted rating record/i,
    /No email was sent/i,
  ]) {
    assert.match(q006aApproval, pattern);
  }

  for (const pattern of [
    /Quality control, rejection, correction, and ingestion/i,
    /accepted_materialize/,
    /rejected_no_materialization/,
    /already_materialized_noop/,
    /Quality control evaluates completeness/i,
    /does not silently rewrite/i,
    /No production acceptance or ingestion is currently authorized/i,
  ]) {
    assert.match(raterBrief, pattern);
  }

  for (const pattern of [
    /export function validatePilotRatingIngestionControl/,
    /export function ingestPilotInitialRatings/,
    /export function sanitizePilotRatingIngestionSummary/,
    /Submission replay rejected/,
    /rejected_responses_materialized_as_ratings: false/,
    /Controlled ingestion output must be outside the repository/,
  ]) {
    assert.match(implementation, pattern);
  }

  for (const pattern of [
    /verify-pilot-rating-ingestion-contract\.mjs/,
    /pilot-rating-ingestion\.mjs/,
    /pilot-rating-ingestion\.test\.mjs/,
    /pilot-rating-ingestion-control-synthetic\.json/,
    /node scripts\/pilot-rating-ingestion\.mjs --help/,
  ]) {
    assert.match(workflow, pattern);
  }

  const publicFiles = JSON.stringify({ contract, controlBase });
  assert.equal(publicFiles.includes('"participant_id":'), false);
  assert.equal(publicFiles.includes('"task_critique_token":'), false);
  assert.equal(publicFiles.includes('"rating_id":'), false);
  assert.equal(publicFiles.includes('"quality_control_decisions":[{'), false);

  return {
    status: "pass",
    synthetic_complete_ratings: report.synthetic_complete_ratings,
    synthetic_complete_dataset_sha256: report.synthetic_complete_dataset_sha256,
    synthetic_ingestion_event_sha256: report.synthetic_ingestion_event_sha256,
    synthetic_replay_rejected: report.synthetic_replay_rejected,
    q006a_approved: true,
    controlled_ingestion_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await verifyPilotRatingIngestionIntegration();
  console.log(JSON.stringify(report, null, 2));
}
