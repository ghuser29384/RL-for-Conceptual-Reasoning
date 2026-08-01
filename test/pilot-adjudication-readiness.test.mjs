import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  EXPECTED_ADJUDICATION_CLOSURE_GATES,
  validatePilotAdjudicationReadiness,
} from "../scripts/verify-pilot-adjudication-readiness.mjs";

const path = resolve(
  import.meta.dirname,
  "../ops/next-steps-2026-07-23/pilot-adjudication-readiness-addendum.json",
);

async function loadAddendum() {
  return JSON.parse(await readFile(path, "utf8"));
}

test("accepts the blocked post-rating adjudication readiness addendum", async () => {
  const report = validatePilotAdjudicationReadiness(await loadAddendum());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(
    report.closure_gate_count,
    EXPECTED_ADJUDICATION_CLOSURE_GATES.length,
  );
  assert.equal(
    report.blocked_gate_count,
    EXPECTED_ADJUDICATION_CLOSURE_GATES.length,
  );
  assert.equal(report.operative_policy_approved, false);
  assert.equal(report.case_generation_authorized, false);
  assert.equal(report.adjudication_work_authorized, false);
  assert.equal(report.final_snapshot_signoff_authorized, false);
  assert.equal(report.payment_authorized, false);
  assert.equal(report.phase_2_authorized, false);
});

test("rejects silently approving policy, work, rerating, sign-off, payment, or Phase 2", async () => {
  const value = await loadAddendum();
  for (const field of [
    "operative_adjudication_policy_approved",
    "controlled_case_generation_authorized",
    "adjudication_work_authorized",
    "rerating_work_authorized",
    "resolution_acceptance_authorized",
    "final_snapshot_signoff_authorized",
    "honoraria_payment_authorized",
    "phase_2_authorized",
  ]) {
    value.authorization_state[field] = true;
  }
  const report = validatePilotAdjudicationReadiness(value);
  assert.equal(report.status, "fail");
  for (const field of [
    "operative_adjudication_policy_approved",
    "controlled_case_generation_authorized",
    "adjudication_work_authorized",
    "rerating_work_authorized",
    "resolution_acceptance_authorized",
    "final_snapshot_signoff_authorized",
    "honoraria_payment_authorized",
    "phase_2_authorized",
  ]) {
    assert.ok(
      report.errors.some((error) => error.includes(field)),
      `missing authorization error for ${field}`,
    );
  }
});

test("rejects passing closure gates or claiming post-rating completion", async () => {
  const value = await loadAddendum();
  value.post_rating_closure_gates[0].status = "passed";
  value.post_rating_closure_gates[0].evidence = "unapproved-evidence";
  value.overall_post_rating_state.status = "complete";
  value.overall_post_rating_state.all_required_cases_closed = true;
  value.overall_post_rating_state.final_snapshot_complete = true;
  value.overall_post_rating_state.adjudication_unit_ledger_frozen = true;
  value.overall_post_rating_state.closed_at = "2026-08-10T00:00:00.000Z";
  const report = validatePilotAdjudicationReadiness(value);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("A-01 must remain blocked")));
  assert.ok(report.errors.some((error) => error.includes("status must remain blocked")));
  assert.ok(report.errors.some((error) => error.includes("all_required_cases_closed")));
  assert.ok(report.errors.some((error) => error.includes("final_snapshot_complete")));
  assert.ok(report.errors.some((error) => error.includes("closed_at")));
});

test("rejects weakening two-adjudicator, honoraria, evidence, or gate requirements", async () => {
  const value = await loadAddendum();
  value.controlled_evidence_templates.adjudicator_roster.required_count = 1;
  value.controlled_evidence_templates.resolution.required_fields = ["case ID"];
  value.controlled_evidence_templates.adjudication_honoraria.reserve_usd = 500;
  value.controlled_evidence_templates.adjudication_honoraria.candidate_events_authorize_payment = true;
  value.post_rating_closure_gates.pop();
  const report = validatePilotAdjudicationReadiness(value);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("exactly two adjudicators")));
  assert.ok(report.errors.some((error) => error.includes("resolution.required_fields")));
  assert.ok(report.errors.some((error) => error.includes("USD 100")));
  assert.ok(report.errors.some((error) => error.includes("must not authorize payment")));
  assert.ok(report.errors.some((error) => error.includes("exactly seven")));
});

test("rejects public people, item, rating, case, resolution, sign-off, or payment records", async () => {
  const value = await loadAddendum();
  value.public_record_policy.adjudicator_id = "ADJ_REAL_1";
  value.public_record_policy.position_id = "PROTECTED_P01";
  value.public_record_policy.rating_id = "RATING_1";
  value.public_record_policy.case_id = "CASE_1";
  value.public_record_policy.resolution_id = "RES_1";
  value.public_record_policy.signoff_id = "SIGN_1";
  value.public_record_policy.email = "expert@example.org";
  const report = validatePilotAdjudicationReadiness(value);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("email address")));
  assert.ok(report.errors.filter((error) => error.includes("Forbidden public field populated")).length >= 7);
});

test("rejects removing immutable, unresolved, distribution-preserving, or separation invariants", async () => {
  const value = await loadAddendum();
  value.invariants = ["No effect."];
  const report = validatePilotAdjudicationReadiness(value);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("At least nine")));
  assert.ok(report.errors.some((error) => error.includes("initial ratings are immutable")));
  assert.ok(report.errors.some((error) => error.includes("explicit unresolved closure")));
  assert.ok(report.errors.some((error) => error.includes("does not impose a consensus score")));
  assert.ok(report.errors.some((error) => error.includes("do not authorize payment")));
});
