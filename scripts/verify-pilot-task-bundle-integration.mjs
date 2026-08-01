import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { validatePilotReadinessLedger } from "./verify-pilot-readiness-ledger.mjs";
import { validatePilotTaskBundleContract } from "./verify-pilot-task-bundle-contract.mjs";

const root = resolve(import.meta.dirname, "..");
const ops = resolve(root, "ops/next-steps-2026-07-23");

export async function verifyPilotTaskBundleIntegration() {
  const [
    contract,
    methodology,
    assignmentInput,
    taskContent,
    readiness,
    readinessBrief,
    readme,
    raterBrief,
    q006Packet,
    q006aApproval,
    workflow,
  ] = await Promise.all([
    readJson(resolve(ops, "pilot-task-bundle-contract.json")),
    readJson(resolve(ops, "pilot-methodology-recommendations.json")),
    readJson(resolve(root, "test/fixtures/pilot-assignment-synthetic.json")),
    readJson(resolve(root, "test/fixtures/pilot-task-content-synthetic.json")),
    readJson(resolve(ops, "pilot-readiness-ledger.json")),
    readFile(resolve(ops, "pilot-readiness-ledger.md"), "utf8"),
    readFile(resolve(ops, "README.md"), "utf8"),
    readFile(resolve(ops, "early-career-rater-brief.md"), "utf8"),
    readFile(resolve(ops, "q-006-decision-packet.md"), "utf8"),
    readFile(resolve(ops, "q-006a-owner-approval.md"), "utf8"),
    readFile(resolve(root, ".github/workflows/metaphilosophy-program-integrity.yml"), "utf8"),
  ]);

  const contractReport = validatePilotTaskBundleContract(contract, methodology, assignmentInput, taskContent);
  assert.equal(contractReport.status, "pass", contractReport.errors.join("\n"));
  assert.equal(contractReport.synthetic_task_bundles, 6);
  assert.match(contractReport.synthetic_bundle_commitment_sha256, /^[a-f0-9]{64}$/);
  assert.equal(contractReport.synthetic_public_summary_safe, true);
  assert.equal(contractReport.synthetic_submission_valid, true);
  assert.equal(contractReport.controlled_generation_authorized, false);
  assert.equal(contractReport.distribution_authorized, false);
  assert.equal(contractReport.rating_work_authorized, false);
  assert.equal(contractReport.phase_2_authorized, false);

  const readinessReport = validatePilotReadinessLedger(readiness);
  assert.equal(readinessReport.status, "pass", readinessReport.errors.join("\n"));
  assert.equal(readinessReport.q006a_status, "approved_nonbinding_consultation_and_screening_only");
  assert.equal(readinessReport.controlled_task_bundle_generation_authorized, false);
  assert.equal(readinessReport.task_bundle_distribution_authorized, false);
  assert.equal(readinessReport.ready_to_start, false);
  assert.equal(readiness.authorization_state.calibration_or_rating_work_authorized, false);
  assert.equal(readiness.task_bundle_template.public_summary, null);
  assert.equal(readiness.task_bundle_template.distribution_authorized_by_generation, false);
  assert.equal(readiness.task_bundle_template.rating_work_authorized_by_bundle, false);

  const requiredReadinessPhrases = [
    /Controlled blind task-bundle generation \| No/i,
    /Task-bundle distribution \| No/i,
    /Task-packet generation is a further separate gate/i,
    /generating packets would not authorize distribution/i,
    /A structurally valid submission is not an accepted rating/i,
    /Q-006A does not authorize researching, contacting, selecting, or onboarding raters or adjudicators/i,
  ];
  for (const pattern of requiredReadinessPhrases) assert.match(readinessBrief, pattern);

  const requiredReadmePhrases = [
    /Blind task bundles and submissions/i,
    /participant-specific HMAC-SHA-256 task tokens/i,
    /Generation is not distribution/i,
    /all sixteen assigned task tokens exactly once/i,
    /pilot-task-bundle-contract\.json/,
    /verify-pilot-task-bundle-contract\.mjs/,
  ];
  for (const pattern of requiredReadmePhrases) assert.match(readme, pattern);

  const requiredRaterPhrases = [
    /Blind task packet and submission/i,
    /opaque task tokens/i,
    /all sixteen assigned task tokens exactly once/i,
    /private task packet is not permission to begin/i,
    /original (accepted )?initial response is preserved/i,
  ];
  for (const pattern of requiredRaterPhrases) assert.match(raterBrief, pattern);

  const requiredQ006Phrases = [
    /Blind task-packet proposal/i,
    /Artifact separation/i,
    /Blind packet, acceptance, ingestion, and adjudication/i,
    /Task-bundle generation and distribution boundary/i,
    /Generation does not authorize distribution/i,
    /valid submission is not an accepted rating/i,
  ];
  for (const pattern of requiredQ006Phrases) assert.match(q006Packet, pattern);

  const requiredApprovalPhrases = [
    /Approved by the project owner/i,
    /controlled task-bundle generation or distribution/i,
    /Blind task-packet proposal/i,
    /Artifact separation/i,
    /any controlled assignment or task-packet generation action/i,
    /any task-packet distribution or rating-start action/i,
  ];
  for (const pattern of requiredApprovalPhrases) assert.match(q006aApproval, pattern);

  for (const pattern of [
    /verify-pilot-task-bundle-contract\.mjs/,
    /verify-pilot-task-bundle-integration\.mjs/,
    /pilot-task-bundle-generator\.mjs/,
    /pilot-task-bundle-summary\.json/,
    /contains_task_tokens/,
  ]) {
    assert.match(workflow, pattern);
  }

  return {
    status: "pass",
    synthetic_task_bundles: contractReport.synthetic_task_bundles,
    synthetic_bundle_commitment_sha256: contractReport.synthetic_bundle_commitment_sha256,
    q006a_approved: true,
    controlled_task_bundle_generation_authorized: false,
    task_bundle_distribution_authorized: false,
    rating_work_authorized: false,
    phase_2_authorized: false,
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await verifyPilotTaskBundleIntegration();
  console.log(JSON.stringify(report, null, 2));
}
