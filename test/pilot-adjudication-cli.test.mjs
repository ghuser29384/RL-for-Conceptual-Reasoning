import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const scriptPath = resolve(root, "scripts/run-pilot-adjudication.mjs");
const datasetPath = resolve(root, "test/fixtures/pilot-rating-analysis-synthetic.json");
const policyPath = resolve(
  root,
  "test/fixtures/pilot-analysis-policy-adjudication-synthetic.json",
);
const controlPath = resolve(
  root,
  "test/fixtures/pilot-adjudication-control-synthetic.json",
);

test("runs adjudication case generation as a public-summary-only simulation", async () => {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [scriptPath, datasetPath, policyPath, controlPath],
    { cwd: root, maxBuffer: 4 * 1024 * 1024 },
  );
  assert.equal(stderr, "");
  const summary = JSON.parse(stdout);
  assert.equal(
    summary.report_version,
    "pilot-adjudication-case-public-summary-v1",
  );
  assert.equal(summary.mode, "simulation");
  assert.equal(summary.counts.case_count, 2);
  assert.equal(summary.counts.assigned_to_two_dedicated_adjudicators, true);
  assert.equal(summary.counts.maximum_assignment_imbalance, 0);
  assert.equal(summary.distribution_authorized, false);
  assert.equal(summary.adjudication_work_authorized, false);
  assert.equal(summary.rerating_work_authorized, false);
  assert.equal(summary.payment_authorized, false);
  assert.equal(summary.phase_2_authorized, false);

  const text = JSON.stringify(summary);
  for (const forbidden of [
    '"adjudicator_id":',
    '"rater_id":',
    '"position_id":',
    '"critique_id":',
    '"rating_id":',
    '"case_id":',
    '"case_packet_sha256":',
    '"initial_ratings":',
    "ADJ_SYN_",
    "C-SYN-03",
  ]) {
    assert.equal(text.includes(forbidden), false, `CLI output leaked ${forbidden}`);
  }
});

test("refuses to write controlled case artifacts in simulation mode", async () => {
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [
        scriptPath,
        datasetPath,
        policyPath,
        controlPath,
        "--controlled-output",
        "/tmp/forbidden-pilot-adjudication-cases.json",
      ],
      { cwd: root, maxBuffer: 4 * 1024 * 1024 },
    ),
    (error) =>
      /Simulation mode does not write controlled adjudication case files/.test(
        `${error.stderr}${error.stdout}`,
      ),
  );
});
