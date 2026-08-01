import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { EXPECTED_READINESS_GATES, validatePilotReadinessLedger } from "../scripts/verify-pilot-readiness-ledger.mjs";

const ledgerPath = resolve(import.meta.dirname, "../ops/next-steps-2026-07-23/pilot-readiness-ledger.json");

async function loadLedger() {
  return JSON.parse(await readFile(ledgerPath, "utf8"));
}

test("accepts the blocked public readiness shell", async () => {
  const report = validatePilotReadinessLedger(await loadLedger());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.q006a_status, "pending_project_owner_decision");
  assert.equal(report.readiness_gate_count, EXPECTED_READINESS_GATES.length);
  assert.equal(report.blocked_gate_count, EXPECTED_READINESS_GATES.length);
  assert.equal(report.controlled_assignment_generation_authorized, false);
  assert.equal(report.ready_to_start, false);
});

test("rejects silently authorizing Q-006A-dependent activity", async () => {
  const ledger = await loadLedger();
  ledger.authorization_state.q006a.status = "approved";
  ledger.authorization_state.q006a.approved_at = "2026-07-30T16:30:00Z";
  ledger.authorization_state.methodological_adviser_recipient_research_authorized = true;
  ledger.authorization_state.nonfinal_item_screening_authorized = true;
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("Q-006A must remain pending")));
  assert.ok(report.errors.some((error) => error.includes("methodological_adviser_recipient_research_authorized")));
  assert.ok(report.errors.some((error) => error.includes("nonfinal_item_screening_authorized")));
});

test("rejects public recipient data or participant names", async () => {
  const ledger = await loadLedger();
  ledger.methodological_feedback_template.public_entries.push({ email: "adviser@example.org" });
  ledger.people_payment_template.public_named_people.push("Named Person");
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("public methodological-adviser entries")));
  assert.ok(report.errors.some((error) => error.includes("must not name participants")));
  assert.ok(report.errors.some((error) => error.includes("email address")));
  assert.ok(report.errors.some((error) => error.includes("Forbidden public field populated")));
});

test("rejects premature item-screening or calibration claims", async () => {
  const ledger = await loadLedger();
  ledger.item_screening_template.public_summary.positions_screened = 1;
  ledger.item_screening_template.public_summary.controlled_manifest_sha256 = "a".repeat(64);
  ledger.calibration_template.qualification_rule = "mean absolute difference below 0.1";
  ledger.calibration_template.selected_materials_sha256 = "b".repeat(64);
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("positions_screened")));
  assert.ok(report.errors.some((error) => error.includes("controlled_manifest_sha256")));
  assert.ok(report.errors.some((error) => error.includes("qualification and material hash")));
});

test("rejects silently authorizing or publishing a controlled assignment", async () => {
  const ledger = await loadLedger();
  ledger.authorization_state.controlled_assignment_generation_authorized = true;
  ledger.assignment_template.status = "generated";
  ledger.assignment_template.public_summary = {
    participant_ids: ["RATER_1"],
    position_assignments: [{ position_ids: ["P01"] }],
  };
  ledger.assignment_template.rating_work_authorized_by_assignment = true;
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("controlled_assignment_generation_authorized")));
  assert.ok(report.errors.some((error) => error.includes("Assignment template must remain unauthorized")));
  assert.ok(report.errors.some((error) => error.includes("assignment_template.public_summary")));
  assert.ok(report.errors.some((error) => error.includes("must not authorize rating work")));
  assert.ok(report.errors.some((error) => error.includes("Forbidden public field populated")));
});

test("rejects removal of topic-coverage or controlled-assignment evidence requirements", async () => {
  const ledger = await loadLedger();
  ledger.people_payment_template.private_required_fields = ledger.people_payment_template.private_required_fields.filter(
    (field) => field !== "approved_topic_families",
  );
  ledger.assignment_template.private_required_fields = ["q006b_approval_record"];
  ledger.readiness_gates.find((gate) => gate.id === "R-05").name = "Assignments generated";
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("approved_topic_families")));
  assert.ok(report.errors.some((error) => error.includes("assignment_template.private_required_fields")));
  assert.ok(report.errors.some((error) => error.includes("R-05 name")));
});

test("rejects premature readiness or Phase 2 activation", async () => {
  const ledger = await loadLedger();
  ledger.authorization_state.phase_2_activation_authorized = true;
  ledger.readiness_gates[0].status = "passed";
  ledger.readiness_gates[0].evidence = "unapproved";
  ledger.overall_readiness.status = "ready";
  ledger.overall_readiness.ready_to_start = true;
  ledger.overall_readiness.readiness_signed_at = "2026-07-30T16:30:00Z";
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("phase_2_activation_authorized")));
  assert.ok(report.errors.some((error) => error.includes("R-01 must remain blocked")));
  assert.ok(report.errors.some((error) => error.includes("Overall readiness must remain blocked")));
  assert.ok(report.errors.some((error) => error.includes("readiness_signed_at")));
});
