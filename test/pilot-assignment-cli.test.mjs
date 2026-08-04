import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const scriptPath = resolve(root, "scripts/pilot-assignment-generator.mjs");
const methodologyPath = resolve(root, "ops/next-steps-2026-07-23/pilot-methodology-recommendations.json");
const fixturePath = resolve(root, "test/fixtures/pilot-assignment-synthetic.json");

test("runs the assignment CLI on a synthetic fixture and emits only a public summary", async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath, methodologyPath, fixturePath], {
    cwd: root,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(stderr, "");
  const report = JSON.parse(stdout);
  assert.equal(report.report_version, "pilot-assignment-public-summary-v1");
  assert.equal(report.mode, "simulation");
  assert.equal(report.feasibility.feasible_mapping_count, 1);
  assert.equal(report.rating_work_authorized, false);
  assert.equal(report.phase_2_authorized, false);
  assert.equal(report.privacy.contains_participant_ids, false);
  assert.equal(report.privacy.contains_position_or_critique_ids, false);
  assert.equal(report.privacy.contains_assignment_pairs, false);
  const serialized = JSON.stringify(report);
  for (const forbiddenToken of [
    '"participant_id":',
    '"position_id":',
    '"critique_id":',
    '"anonymous_slot_mapping":',
    '"position_assignments":',
  ]) {
    assert.equal(serialized.includes(forbiddenToken), false, `CLI output leaked ${forbiddenToken}`);
  }
});
