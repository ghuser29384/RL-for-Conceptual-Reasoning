import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { generatePilotAssignments } from "../scripts/pilot-assignment-generator.mjs";
import {
  PilotSelfCheckSelectionError,
  assertPublicPilotSelfCheckSelectionReport,
  generatePilotSelfCheckSelection,
  sanitizePilotSelfCheckSelectionReport,
  validatePilotSelfCheckSelectionInput,
} from "../scripts/pilot-self-check-selection.mjs";

const root = resolve(import.meta.dirname, "..");

async function loadJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

async function fixture() {
  const [endpointContract, methodology, assignmentInput] = await Promise.all([
    loadJson("ops/pilot-endpoint-design-amendment-v1.json"),
    loadJson("ops/next-steps-2026-07-23/pilot-methodology-recommendations.json"),
    loadJson("test/fixtures/pilot-assignment-synthetic.json"),
  ]);
  const assignmentReport = generatePilotAssignments(methodology, assignmentInput);
  const selectionInput = {
    selection_input_id: "synthetic-self-check-selection-v1",
    input_version: 1,
    programme_id: assignmentInput.programme_id,
    data_class: "synthetic_test_fixture",
    mode: "simulation",
    seed: "synthetic-self-check-selection-seed-v1",
    authorization: {
      q_006b_approved: false,
      protected_manifest_frozen: false,
      self_check_selection_authorized: false,
      private_controlled_storage_confirmed: false,
      approval_record_ids: [],
      approved_at: null,
    },
    assignment_report: assignmentReport,
  };
  return { endpointContract, methodology, assignmentInput, assignmentReport, selectionInput };
}

test("selects the approved balanced 24-record blind self-check subsample", async () => {
  const { endpointContract, selectionInput } = await fixture();
  const report = generatePilotSelfCheckSelection(endpointContract, selectionInput);

  assert.equal(report.report_version, "pilot-self-check-selection-v1");
  assert.equal(report.invariants.selected_positions, 6);
  assert.equal(report.invariants.selected_topic_families, 6);
  assert.deepEqual(report.invariants.selected_positions_per_source_class, {
    public_synthetic_with_new_expert_ratings: 3,
    protected_public_domain_derived: 3,
  });
  assert.equal(report.invariants.selected_critiques, 12);
  assert.equal(report.invariants.selected_critiques_per_position, 2);
  assert.equal(report.invariants.self_check_records, 24);
  assert.equal(report.invariants.core_raters, 6);
  assert.equal(report.invariants.self_checks_per_core_rater, 4);
  assert.equal(report.invariants.selected_positions_per_core_rater, 2);
  assert.equal(report.invariants.both_original_raters_per_selected_critique, true);
  assert.ok(report.feasible_position_set_count >= 1);
  assert.equal(report.rating_work_authorized, false);
  assert.equal(report.research_start_authorized, false);
  assert.equal(report.payment_authorized, false);
  assert.ok(report.self_check_records.every((row) => row.required_stage === "blind_self_check"));
  assert.ok(report.self_check_records.every((row) => row.predecessor_stage === "initial"));
});

test("selection is deterministic and independent of assignment array ordering", async () => {
  const { endpointContract, selectionInput } = await fixture();
  const first = generatePilotSelfCheckSelection(endpointContract, selectionInput);
  const reordered = structuredClone(selectionInput);
  reordered.assignment_report.position_assignments.reverse();
  for (const row of reordered.assignment_report.position_assignments) {
    row.critique_ids.reverse();
    row.rater_ids.reverse();
  }
  const second = generatePilotSelfCheckSelection(endpointContract, reordered);

  assert.equal(second.selected_position_set_hash, first.selected_position_set_hash);
  assert.equal(second.selected_critique_set_hash, first.selected_critique_set_hash);
  assert.deepEqual(second.selected_positions, first.selected_positions);
  assert.deepEqual(second.self_check_records, first.self_check_records);
});

test("changing the frozen seed changes ranking without weakening balance invariants", async () => {
  const { endpointContract, selectionInput } = await fixture();
  const first = generatePilotSelfCheckSelection(endpointContract, selectionInput);
  const secondInput = structuredClone(selectionInput);
  secondInput.seed = "synthetic-self-check-selection-seed-v2";
  const second = generatePilotSelfCheckSelection(endpointContract, secondInput);

  assert.notEqual(second.selection_seed_sha256, first.selection_seed_sha256);
  assert.equal(second.invariants.selected_positions, 6);
  assert.equal(second.invariants.self_check_records, 24);
  assert.equal(second.invariants.self_checks_per_core_rater, 4);
  assert.equal(second.invariants.selected_positions_per_core_rater, 2);
});

test("rejects outcome-bearing assignment rows so selection cannot inspect study results", async () => {
  const { endpointContract, selectionInput } = await fixture();
  const contaminated = structuredClone(selectionInput);
  contaminated.assignment_report.position_assignments[0].mean_overall_score = 0.72;
  contaminated.assignment_report.position_assignments[1].disagreement_score = 0.41;
  contaminated.assignment_report.position_assignments[2].model_scores = [0.1, 0.9];

  const validation = validatePilotSelfCheckSelectionInput(endpointContract, contaminated);
  assert.equal(validation.status, "fail");
  assert.ok(validation.errors.some((error) => error.includes("forbidden outcome-dependent fields")));
  assert.throws(
    () => generatePilotSelfCheckSelection(endpointContract, contaminated),
    (error) => error instanceof PilotSelfCheckSelectionError && error.message.includes("forbidden outcome-dependent fields"),
  );
});

test("fails closed when the assignment no longer supports one-per-topic and three-per-source balance", async () => {
  const { endpointContract, selectionInput } = await fixture();
  const invalid = structuredClone(selectionInput);
  invalid.assignment_report.position_assignments[1].topic_family = "political_philosophy";
  invalid.assignment_report.position_assignments[1].source_class = "public_synthetic_with_new_expert_ratings";

  const validation = validatePilotSelfCheckSelectionInput(endpointContract, invalid);
  assert.equal(validation.status, "fail");
  assert.ok(validation.errors.some((error) => error.includes("topic family normative_ethics")));
  assert.ok(validation.errors.some((error) => error.includes("source class protected_public_domain_derived")));
});

test("public summary withholds controlled position, critique, rater, and record fields", async () => {
  const { endpointContract, selectionInput } = await fixture();
  const full = generatePilotSelfCheckSelection(endpointContract, selectionInput);
  const publicReport = sanitizePilotSelfCheckSelectionReport(full);

  assert.equal(assertPublicPilotSelfCheckSelectionReport(publicReport), true);
  assert.equal(publicReport.privacy.contains_position_ids, false);
  assert.equal(publicReport.privacy.contains_critique_ids, false);
  assert.equal(publicReport.privacy.contains_rater_ids, false);
  assert.equal(publicReport.privacy.contains_selected_slots, false);
  assert.equal(publicReport.privacy.contains_self_check_records, false);
  assert.equal("selected_positions" in publicReport, false);
  assert.equal("self_check_records" in publicReport, false);
});

test("controlled selection remains blocked without Q-006B and private-storage approvals", async () => {
  const { endpointContract, selectionInput } = await fixture();
  const controlled = structuredClone(selectionInput);
  controlled.mode = "controlled_generation";
  controlled.data_class = "private_controlled_selection_input";

  const validation = validatePilotSelfCheckSelectionInput(endpointContract, controlled);
  assert.equal(validation.status, "fail");
  assert.ok(validation.errors.some((error) => error.includes("q_006b_approved must equal true")));
  assert.ok(validation.errors.some((error) => error.includes("self_check_selection_authorized must equal true")));
});
