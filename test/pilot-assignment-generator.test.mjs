import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  PilotAssignmentError,
  assertPublicPilotAssignmentReport,
  generatePilotAssignments,
  sanitizePilotAssignmentReport,
  validatePilotAssignmentInput,
} from "../scripts/pilot-assignment-generator.mjs";

const root = resolve(import.meta.dirname, "..");
const methodologyPath = resolve(root, "ops/next-steps-2026-07-23/pilot-methodology-recommendations.json");
const fixturePath = resolve(root, "test/fixtures/pilot-assignment-synthetic.json");

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadInputs() {
  return Promise.all([loadJson(methodologyPath), loadJson(fixturePath)]);
}

test("generates the balanced synthetic assignment deterministically", async () => {
  const [methodology, input] = await loadInputs();
  const report = generatePilotAssignments(methodology, input);
  assert.equal(report.mode, "simulation");
  assert.equal(report.feasible_mapping_count, 1);
  assert.equal(report.rating_work_authorized, false);
  assert.equal(report.phase_2_authorized, false);
  assert.deepEqual(report.invariants, {
    positions: 12,
    critiques: 48,
    core_raters: 6,
    raters_per_position: 2,
    positions_per_rater: 4,
    critiques_per_rater: 16,
    unique_rater_pairs: 12,
    distinct_partners_per_rater: 4,
    distinct_topic_families_per_rater: 4,
    preferred_source_positions_per_rater: {
      public_synthetic_with_new_expert_ratings: 2,
      protected_public_domain_derived: 2,
    },
  });
  assert.equal(report.anonymous_slot_mapping.length, 6);
  assert.equal(report.position_assignments.length, 12);
});

test("is independent of participant and position input-array order", async () => {
  const [methodology, input] = await loadInputs();
  const first = generatePilotAssignments(methodology, input);
  const reordered = structuredClone(input);
  reordered.participants.reverse();
  reordered.positions.reverse();
  for (const participant of reordered.participants) {
    participant.approved_topic_families.reverse();
    participant.conflict_position_ids.reverse();
    participant.prior_exposure_position_ids.reverse();
  }
  const second = generatePilotAssignments(methodology, reordered);
  assert.equal(first.selected_mapping_hash, second.selected_mapping_hash);
  assert.deepEqual(first.anonymous_slot_mapping, second.anonymous_slot_mapping);
  assert.deepEqual(first.position_assignments, second.position_assignments);
});

test("respects approved topic coverage, conflicts, and prior exposure", async () => {
  const [methodology, input] = await loadInputs();
  const report = generatePilotAssignments(methodology, input);
  const participants = new Map(input.participants.map((participant) => [participant.participant_id, participant]));
  for (const assignment of report.position_assignments) {
    for (const participantId of assignment.rater_ids) {
      const participant = participants.get(participantId);
      assert.ok(participant.approved_topic_families.includes(assignment.topic_family));
      assert.equal(participant.conflict_position_ids.includes(assignment.position_id), false);
      assert.equal(participant.prior_exposure_position_ids.includes(assignment.position_id), false);
    }
  }
});

test("fails closed rather than assigning outside topic competence", async () => {
  const [methodology, input] = await loadInputs();
  input.participants[0].approved_topic_families = ["normative_ethics"];
  assert.throws(
    () => generatePilotAssignments(methodology, input),
    (error) => error instanceof PilotAssignmentError && /No feasible anonymous-slot mapping/.test(error.message),
  );
});

test("fails closed rather than ignoring conflicts or exposure", async () => {
  const [methodology, input] = await loadInputs();
  input.participants[0].conflict_position_ids = input.positions.map((position) => position.position_id);
  assert.throws(
    () => generatePilotAssignments(methodology, input),
    (error) => error instanceof PilotAssignmentError && /No feasible anonymous-slot mapping/.test(error.message),
  );
});

test("rejects controlled generation without every Q-006B and Q-006C authorization field", async () => {
  const [methodology, input] = await loadInputs();
  input.data_class = "private_controlled_assignment_input";
  input.mode = "controlled_generation";
  const report = validatePilotAssignmentInput(methodology, input);
  assert.equal(report.status, "fail");
  for (const field of [
    "q_006b_approved",
    "q_006c_approved",
    "protected_manifest_frozen",
    "participants_confirmed",
    "conflict_and_exposure_checks_complete",
    "calibration_complete",
    "controlled_assignment_authorized",
  ]) {
    assert.ok(report.errors.some((error) => error.includes(field)), `missing error for ${field}`);
  }
  assert.ok(report.errors.some((error) => error.includes("approval record")));
  assert.ok(report.errors.some((error) => error.includes("approved_at")));
  assert.ok(report.errors.some((error) => error.includes("private_controlled_storage_confirmed")));
});

test("accepts a fully authorized controlled input but still does not authorize rating work", async () => {
  const [methodology, input] = await loadInputs();
  input.data_class = "private_controlled_assignment_input";
  input.mode = "controlled_generation";
  input.assignment_input_id = "controlled-assignment-input-v1";
  input.seed = "controlled-test-seed";
  input.authorization = {
    q_006b_approved: true,
    q_006c_approved: true,
    protected_manifest_frozen: true,
    participants_confirmed: true,
    conflict_and_exposure_checks_complete: true,
    calibration_complete: true,
    controlled_assignment_authorized: true,
    approval_record_ids: ["Q006B-v1", "Q006C-v1", "ASSIGNMENT-AUTH-v1"],
    approved_at: "2026-08-01T00:00:00.000Z",
    private_controlled_storage_confirmed: true,
  };
  for (const position of input.positions) {
    const oldPositionId = position.position_id;
    position.position_id = oldPositionId.replace("SIM_", "CTRL_");
    position.critique_ids = position.critique_ids.map((id) => id.replace("SIM_", "CTRL_"));
    for (const participant of input.participants) {
      participant.conflict_position_ids = participant.conflict_position_ids.map((id) =>
        id === oldPositionId ? position.position_id : id,
      );
      participant.prior_exposure_position_ids = participant.prior_exposure_position_ids.map((id) =>
        id === oldPositionId ? position.position_id : id,
      );
    }
  }
  for (const participant of input.participants) {
    participant.participant_id = participant.participant_id.replace("SIM_", "CTRL_");
  }
  const validation = validatePilotAssignmentInput(methodology, input);
  assert.equal(validation.status, "pass", validation.errors.join("\n"));
  const report = generatePilotAssignments(methodology, input);
  assert.equal(report.assignment_generated_under_controlled_authorization, true);
  assert.equal(report.rating_work_authorized, false);
  assert.equal(report.phase_2_authorized, false);
  const publicSummary = sanitizePilotAssignmentReport(report);
  assert.deepEqual(publicSummary.feasibility, {
    at_least_one_feasible_mapping: true,
    exact_count_withheld: true,
  });
});

test("rejects PII-like participant identifiers and unknown position references", async () => {
  const [methodology, input] = await loadInputs();
  input.participants[0].participant_id = "person@example.com";
  input.participants[1].prior_exposure_position_ids = ["SIM_UNKNOWN"];
  const report = validatePilotAssignmentInput(methodology, input);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("controlled pseudonymous identifier")));
  assert.ok(report.errors.some((error) => error.includes("known position IDs")));
});

test("public assignment summaries contain no controlled identifiers or assignment pairs", async () => {
  const [methodology, input] = await loadInputs();
  const summary = sanitizePilotAssignmentReport(generatePilotAssignments(methodology, input));
  assert.equal(assertPublicPilotAssignmentReport(summary), true);
  assert.deepEqual(summary.feasibility, { feasible_mapping_count: 1 });
  const serialized = JSON.stringify(summary);
  for (const forbiddenToken of [
    '"participant_id":',
    '"position_id":',
    '"critique_id":',
    '"anonymous_slot_mapping":',
    '"position_assignments":',
  ]) {
    assert.equal(serialized.includes(forbiddenToken), false, `public summary leaked ${forbiddenToken}`);
  }
});
