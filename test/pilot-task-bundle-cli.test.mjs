import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const scriptPath = resolve(root, "scripts/pilot-task-bundle-generator.mjs");
const methodologyPath = resolve(root, "ops/next-steps-2026-07-23/pilot-methodology-recommendations.json");
const assignmentPath = resolve(root, "test/fixtures/pilot-assignment-synthetic.json");
const taskContentPath = resolve(root, "test/fixtures/pilot-task-content-synthetic.json");

test("runs the synthetic task-bundle CLI as a public-summary-only simulation", async () => {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [scriptPath, methodologyPath, assignmentPath, taskContentPath],
    { cwd: root, maxBuffer: 4 * 1024 * 1024 },
  );
  assert.equal(stderr, "");
  const summary = JSON.parse(stdout);
  assert.equal(summary.report_version, "pilot-task-bundle-public-summary-v1");
  assert.equal(summary.mode, "simulation");
  assert.equal(summary.counts.task_bundles, 6);
  assert.equal(summary.counts.total_bundle_critique_presentations, 96);
  assert.equal(summary.distribution_authorized, false);
  assert.equal(summary.rating_work_authorized, false);
  assert.equal(summary.phase_2_authorized, false);
  assert.equal(summary.privacy.contains_participant_ids, false);
  assert.equal(summary.privacy.contains_position_or_critique_ids, false);
  assert.equal(summary.privacy.contains_task_tokens, false);
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
    "SIM_P",
    "Synthetic position",
  ]) {
    assert.equal(serialized.includes(forbidden), false, `CLI output leaked ${forbidden}`);
  }
});

test("refuses to write controlled artifacts in simulation mode", async () => {
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [scriptPath, methodologyPath, assignmentPath, taskContentPath, "--controlled-output-dir", "/tmp/forbidden-simulation-output"],
      { cwd: root, maxBuffer: 4 * 1024 * 1024 },
    ),
    (error) => /Simulation mode does not write controlled task bundles/.test(`${error.stderr}${error.stdout}`),
  );
});
