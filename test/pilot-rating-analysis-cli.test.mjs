import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { resolve } from "node:path";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const scriptPath = resolve(root, "scripts/pilot-rating-analysis.mjs");
const fixturePath = resolve(root, "test/fixtures/pilot-rating-analysis-synthetic.json");
const policyPath = resolve(root, "ops/next-steps-2026-07-23/pilot-analysis-policy-template.json");

test("runs the pilot analysis CLI on a public synthetic fixture with zero operative routes", async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath, fixturePath, policyPath], {
    cwd: root,
    maxBuffer: 2 * 1024 * 1024,
  });
  assert.equal(stderr, "");
  const report = JSON.parse(stdout);
  assert.equal(report.data_class, "synthetic_test_fixture");
  assert.equal(report.diagnostic_only, true);
  assert.equal(report.numeric_thresholds_binding, false);
  assert.equal(report.phase_2_authorized, false);
  assert.equal(report.policy.fail_closed_default, true);
  assert.equal(report.aggregate.positions_with_complete_pairs, 1);
  assert.equal(report.aggregate.accepted_initial_ratings, 8);
  assert.equal(report.aggregate.total_critiques_with_two_initial_ratings, 4);
  assert.equal(report.aggregate.critiques_with_operative_routes, 0);
  assert.ok(report.aggregate.critiques_with_candidate_routes >= 2);
  assert.equal(report.leave_one_position_out_ranges, null);
});

test("keeps the checked-in policy template diagnostic-only and unapproved", async () => {
  const policy = JSON.parse(await readFile(policyPath, "utf8"));
  assert.equal(policy.status, "diagnostic_only_no_routes_approved");
  assert.deepEqual(policy.approved_routes, []);
  assert.equal(policy.governance.operative_adjudication_routes, 0);
  assert.equal(policy.governance.q_006a_approved, false);
  assert.equal(policy.governance.q_006b_approved, false);
  assert.equal(policy.governance.may_not_trigger_work_or_modify_ratings, true);
  assert.equal(policy.governance.may_not_authorize_phase_2, true);
});
