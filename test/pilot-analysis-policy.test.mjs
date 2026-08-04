import assert from "node:assert/strict";
import test from "node:test";

import {
  requireValidPilotAnalysisPolicy,
  validatePilotAnalysisPolicy,
} from "../scripts/pilot-analysis-policy.mjs";

test("accepts the implicit and checked-in diagnostic-only policy shapes", () => {
  const implicit = validatePilotAnalysisPolicy({});
  assert.equal(implicit.status, "pass", implicit.errors.join("\n"));
  assert.equal(implicit.normalized_policy.operational_authorization, false);
  assert.deepEqual(implicit.normalized_policy.approved_routes, []);

  const diagnostic = validatePilotAnalysisPolicy({
    status: "diagnostic_only_no_routes_approved",
    approved_routes: [],
    diagnostic_minimum_mean_overall_gap: 0.2,
    low_clarity_below: 0.5,
    numeric_thresholds: {
      overall_gap: 0.3,
      strength_times_centrality_gap: 0.3,
      correctness_gap: 0.35,
      clarity_gap: 0.35,
    },
  });
  assert.equal(diagnostic.status, "pass", diagnostic.errors.join("\n"));
  assert.equal(diagnostic.normalized_policy.operational_authorization, false);
});

test("rejects unknown, duplicate, negative, zero, and out-of-range policy values", () => {
  const report = validatePilotAnalysisPolicy({
    approved_routes: ["overall_gap", "overall_gap", "not_a_route"],
    diagnostic_minimum_mean_overall_gap: 1.1,
    low_clarity_below: -0.1,
    numeric_thresholds: {
      overall_gap: -0.2,
      clarity_gap: 0,
      correctness_gap: 1.1,
      unknown_gap: 0.3,
    },
  });
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("duplicates")));
  assert.ok(report.errors.some((error) => error.includes("Unsupported approved route")));
  assert.ok(report.errors.some((error) => error.includes("Unsupported numeric threshold")));
  assert.ok(report.errors.some((error) => error.includes("overall_gap must lie in (0, 1]")));
  assert.ok(report.errors.some((error) => error.includes("clarity_gap must lie in (0, 1]")));
  assert.ok(report.errors.some((error) => error.includes("correctness_gap must lie in (0, 1]")));
  assert.ok(report.errors.some((error) => error.includes("diagnostic_minimum_mean_overall_gap")));
  assert.ok(report.errors.some((error) => error.includes("low_clarity_below")));
});

test("requires explicit Q-006B approval evidence before any route becomes operative", () => {
  const missingApproval = validatePilotAnalysisPolicy({
    status: "approved_for_operation",
    approved_routes: ["overall_gap", "low_clarity"],
    low_clarity_below: 0.5,
    numeric_thresholds: { overall_gap: 0.3 },
    governance: { q_006b_approved: false },
  });
  assert.equal(missingApproval.status, "fail");
  assert.ok(missingApproval.errors.some((error) => error.includes("q_006b_approved")));
  assert.ok(missingApproval.errors.some((error) => error.includes("approval_record")));
  assert.ok(missingApproval.errors.some((error) => error.includes("approved_at")));

  const approved = requireValidPilotAnalysisPolicy({
    status: "approved_for_operation",
    approved_routes: ["overall_gap", "low_clarity"],
    low_clarity_below: 0.5,
    numeric_thresholds: { overall_gap: 0.3 },
    governance: {
      q_006b_approved: true,
      approval_record: "Q-006B-v1",
      approved_at: "2026-08-15T00:00:00.000Z",
      operative_adjudication_routes: 2,
    },
  });
  assert.equal(approved.operational_authorization, true);
  assert.deepEqual(approved.approved_routes, ["low_clarity", "overall_gap"]);
});

test("rejects approved numeric routes without their thresholds", () => {
  const report = validatePilotAnalysisPolicy({
    status: "approved_for_operation",
    approved_routes: ["correctness_gap"],
    governance: {
      q_006b_approved: true,
      approval_record: "Q-006B-v1",
      approved_at: "2026-08-15T00:00:00.000Z",
    },
  });
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("requires a threshold")));
});
