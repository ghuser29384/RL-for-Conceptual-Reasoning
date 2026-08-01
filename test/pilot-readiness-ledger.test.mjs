import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { EXPECTED_READINESS_GATES, validatePilotReadinessLedger } from "../scripts/verify-pilot-readiness-ledger.mjs";

const ledgerPath = resolve(import.meta.dirname, "../ops/next-steps-2026-07-23/pilot-readiness-ledger.json");

async function loadLedger() {
  return JSON.parse(await readFile(ledgerPath, "utf8"));
}

test("accepts the Q-006A-approved but otherwise blocked public readiness shell", async () => {
  const report = validatePilotReadinessLedger(await loadLedger());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.q006a_status, "approved_nonbinding_consultation_and_screening_only");
  assert.equal(report.q006a_approved_at, "2026-08-01T11:34:32Z");
  assert.equal(report.readiness_gate_count, EXPECTED_READINESS_GATES.length);
  assert.equal(report.passed_gate_count, 1);
  assert.equal(report.blocked_gate_count, 5);
  assert.equal(report.consultation_packet_preparation_authorized, true);
  assert.equal(report.adviser_recipient_research_authorized, true);
  assert.equal(report.public_calibration_screening_authorized, true);
  assert.equal(report.nonfinal_item_screening_authorized, true);
  assert.equal(report.methodological_adviser_outreach_authorized, false);
  assert.equal(report.controlled_assignment_generation_authorized, false);
  assert.equal(report.controlled_task_bundle_generation_authorized, false);
  assert.equal(report.task_bundle_distribution_authorized, false);
  assert.equal(report.ready_to_start, false);
});

test("rejects weakening or falsifying the recorded Q-006A approval", async () => {
  const ledger = await loadLedger();
  ledger.authorization_state.q006a.status = "pending_project_owner_decision";
  ledger.authorization_state.q006a.approved_at = null;
  ledger.authorization_state.q006a.owner_instruction = "Different instruction";
  ledger.readiness_gates[0].status = "blocked";
  ledger.readiness_gates[0].evidence = null;
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("approved for non-binding consultation")));
  assert.ok(report.errors.some((error) => error.includes("valid approval timestamp")));
  assert.ok(report.errors.some((error) => error.includes("exact approval instruction")));
  assert.ok(report.errors.some((error) => error.includes("R-01 must be passed")));
});

test("rejects disabling an approved preparation activity", async () => {
  const ledger = await loadLedger();
  ledger.authorization_state.methodological_consultation_packet_preparation_authorized = false;
  ledger.authorization_state.methodological_adviser_recipient_research_authorized = false;
  ledger.authorization_state.public_calibration_screening_authorized = false;
  ledger.authorization_state.nonfinal_item_screening_authorized = false;
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  for (const field of [
    "methodological_consultation_packet_preparation_authorized",
    "methodological_adviser_recipient_research_authorized",
    "public_calibration_screening_authorized",
    "nonfinal_item_screening_authorized",
  ]) {
    assert.ok(report.errors.some((error) => error.includes(field)), `missing error for ${field}`);
  }
});

test("rejects treating Q-006A as outreach or execution authorization", async () => {
  const ledger = await loadLedger();
  for (const field of [
    "methodological_adviser_outreach_authorized",
    "public_recruitment_authorized",
    "participant_outreach_authorized",
    "protected_manifest_freeze_authorized",
    "participant_selection_authorized",
    "controlled_assignment_generation_authorized",
    "controlled_task_bundle_generation_authorized",
    "task_bundle_distribution_authorized",
    "calibration_or_rating_work_authorized",
    "quality_control_acceptance_authorized",
    "controlled_rating_ingestion_authorized",
    "adjudication_case_generation_authorized",
    "adjudication_case_distribution_authorized",
    "adjudication_work_authorized",
    "rerating_work_authorized",
    "adjudication_resolution_acceptance_authorized",
    "final_snapshot_generation_authorized",
    "final_snapshot_signoff_authorized",
    "adjudication_unit_ledger_freeze_authorized",
    "payment_commitment_authorized",
    "funding_submission_authorized",
    "phase_2_activation_authorized",
  ]) {
    ledger.authorization_state[field] = true;
  }
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("methodological_adviser_outreach_authorized")));
  assert.ok(report.errors.some((error) => error.includes("controlled_assignment_generation_authorized")));
  assert.ok(report.errors.some((error) => error.includes("controlled_rating_ingestion_authorized")));
  assert.ok(report.errors.some((error) => error.includes("adjudication_work_authorized")));
  assert.ok(report.errors.some((error) => error.includes("payment_commitment_authorized")));
  assert.ok(report.errors.some((error) => error.includes("phase_2_activation_authorized")));
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

test("rejects representing authorized screening as completed, frozen, or assigned", async () => {
  const ledger = await loadLedger();
  ledger.item_screening_template.public_summary.positions_screened = 1;
  ledger.item_screening_template.public_summary.controlled_manifest_sha256 = "a".repeat(64);
  ledger.item_screening_template.protected_manifest_freeze_authorized = true;
  ledger.item_screening_template.participant_assignment_authorized = true;
  ledger.calibration_template.qualification_rule = "mean absolute difference below 0.1";
  ledger.calibration_template.selected_materials_sha256 = "b".repeat(64);
  ledger.calibration_template.calibration_work_authorized = true;
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("positions_screened")));
  assert.ok(report.errors.some((error) => error.includes("controlled_manifest_sha256")));
  assert.ok(report.errors.some((error) => error.includes("manifest freeze or participant assignment")));
  assert.ok(report.errors.some((error) => error.includes("qualification and selected-material hash")));
  assert.ok(report.errors.some((error) => error.includes("must not authorize calibration work")));
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

test("rejects silently authorizing, distributing, or publishing controlled task bundles", async () => {
  const ledger = await loadLedger();
  ledger.authorization_state.controlled_task_bundle_generation_authorized = true;
  ledger.authorization_state.task_bundle_distribution_authorized = true;
  ledger.task_bundle_template.status = "generated_and_distributed";
  ledger.task_bundle_template.public_summary = {
    participant_bundles: [
      {
        participant_ids: ["RATER_1"],
        task_position_token: "T_secret",
        task_critique_token: "T_secret_critique",
      },
    ],
  };
  ledger.task_bundle_template.distribution_authorized_by_generation = true;
  ledger.task_bundle_template.rating_work_authorized_by_bundle = true;
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("controlled_task_bundle_generation_authorized")));
  assert.ok(report.errors.some((error) => error.includes("task_bundle_distribution_authorized")));
  assert.ok(report.errors.some((error) => error.includes("Task-bundle template must remain unauthorized")));
  assert.ok(report.errors.some((error) => error.includes("task_bundle_template.public_summary")));
  assert.ok(report.errors.some((error) => error.includes("must not authorize distribution")));
  assert.ok(report.errors.some((error) => error.includes("must not authorize rating work")));
  assert.ok(report.errors.some((error) => error.includes("Forbidden public field populated")));
});

test("rejects removal of topic-coverage, assignment, task-bundle, or gate evidence requirements", async () => {
  const ledger = await loadLedger();
  ledger.people_payment_template.private_required_fields = ledger.people_payment_template.private_required_fields.filter(
    (field) => field !== "approved_topic_families",
  );
  ledger.assignment_template.private_required_fields = ["q006b_approval_record"];
  ledger.task_bundle_template.private_required_fields = ["q006b_approval_record"];
  ledger.readiness_gates.find((gate) => gate.id === "R-03").name = "Methodology approved";
  ledger.readiness_gates.find((gate) => gate.id === "R-05").name = "Assignments generated";
  ledger.readiness_gates.find((gate) => gate.id === "R-01").evidence.approval_record_id = "wrong";
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("approved_topic_families")));
  assert.ok(report.errors.some((error) => error.includes("assignment_template.private_required_fields")));
  assert.ok(report.errors.some((error) => error.includes("task_bundle_template.private_required_fields")));
  assert.ok(report.errors.some((error) => error.includes("R-03 name")));
  assert.ok(report.errors.some((error) => error.includes("R-05 name")));
  assert.ok(report.errors.some((error) => error.includes("R-01 evidence")));
});

test("rejects premature readiness or a second passed gate", async () => {
  const ledger = await loadLedger();
  ledger.readiness_gates[1].status = "passed";
  ledger.readiness_gates[1].evidence = { unsupported: true };
  ledger.overall_readiness.status = "ready";
  ledger.overall_readiness.ready_to_start = true;
  ledger.overall_readiness.readiness_signed_at = "2026-08-01T12:00:00Z";
  const report = validatePilotReadinessLedger(ledger);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("R-02 must remain blocked")));
  assert.ok(report.errors.some((error) => error.includes("Overall readiness must remain blocked")));
  assert.ok(report.errors.some((error) => error.includes("readiness_signed_at")));
});
