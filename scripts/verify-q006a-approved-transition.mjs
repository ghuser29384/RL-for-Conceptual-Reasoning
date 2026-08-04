import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const APPROVED_AT = "2026-08-01T11:34:32Z";

const EXPECTED_PREPARATION_TRUE = Object.freeze([
  "methodological_consultation_packet_finalization_authorized",
  "methodological_adviser_recipient_research_authorized",
  "public_calibration_candidate_screening_authorized",
  "controlled_nonfinal_item_screening_authorized",
]);

const EXPECTED_EXECUTION_FALSE = Object.freeze([
  "methodological_adviser_outreach_authorized",
  "public_recruitment_authorized",
  "participant_outreach_authorized",
  "protected_manifest_or_calibration_freeze_authorized",
  "participant_selection_authorized",
  "controlled_assignment_generation_authorized",
  "controlled_task_bundle_generation_authorized",
  "task_bundle_distribution_authorized",
  "calibration_or_rating_work_authorized",
  "quality_control_acceptance_authorized",
  "controlled_rating_ingestion_authorized",
  "adjudication_case_generation_or_distribution_authorized",
  "adjudication_discussion_or_rerating_authorized",
  "case_resolution_or_final_snapshot_authorized",
  "honorarium_ledger_freeze_or_payment_authorized",
  "publication_authorized",
  "funding_submission_authorized",
  "phase_2_activation_authorized",
]);

const LEGACY_PREPARATION_TRUE = Object.freeze([
  "methodological_consultation_packet_preparation_authorized",
  "methodological_adviser_recipient_research_authorized",
  "public_calibration_screening_authorized",
  "nonfinal_item_screening_authorized",
]);

const LEGACY_EXECUTION_FALSE = Object.freeze([
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
]);

const EXPECTED_ARTIFACTS = Object.freeze([
  "ops/next-steps-2026-07-23/q-006a-methodological-adviser-slate.md",
  "ops/next-steps-2026-07-23/q-006a-methodological-adviser-email-packet.md",
  "ops/next-steps-2026-07-23/q-006a-methodological-review-excerpt.md",
]);

const HISTORICAL_SNAPSHOT_PATH =
  "ops/next-steps-2026-07-23/q-006a-pre-approval-readiness-snapshot.json";
const LEGACY_CURRENT_LEDGER_PATH =
  "ops/next-steps-2026-07-23/pilot-readiness-ledger.json";

export async function verifyQ006aApprovedTransition(root = resolve(import.meta.dirname, "..")) {
  const ops = resolve(root, "ops/next-steps-2026-07-23");
  const [snapshot, legacy, effective, state, interpretation, slate, emailPacket, excerpt] =
    await Promise.all([
      readJson(resolve(root, HISTORICAL_SNAPSHOT_PATH)),
      readJson(resolve(root, LEGACY_CURRENT_LEDGER_PATH)),
      readJson(resolve(ops, "pilot-readiness-ledger-v2.json")),
      readJson(resolve(ops, "q-006a-approved-state.json")),
      readFile(resolve(ops, "q-006a-approval-interpretation-2026-08-01.md"), "utf8"),
      readFile(resolve(ops, "q-006a-methodological-adviser-slate.md"), "utf8"),
      readFile(resolve(ops, "q-006a-methodological-adviser-email-packet.md"), "utf8"),
      readFile(resolve(ops, "q-006a-methodological-review-excerpt.md"), "utf8"),
    ]);

  verifyHistoricalSnapshot(snapshot);
  verifyLegacyCurrentLedger(legacy);

  assert.equal(effective.ledger_id, "metaphilosophy-pilot-readiness-v2-2026-08-01");
  assert.equal(effective.ledger_version, 2);
  assert.equal(effective.supersedes?.ledger_id, snapshot.source?.ledger_id);
  assert.equal(effective.supersedes?.historical_v1_retained, true);
  assert.equal(effective.supersedes?.historical_snapshot, HISTORICAL_SNAPSHOT_PATH);
  assert.equal(effective.supersedes?.legacy_current_ledger, LEGACY_CURRENT_LEDGER_PATH);
  assert.equal(effective.status, "q006a_approved_preparation_only_r02_blocked");
  assert.equal(effective.q006a?.status, "approved");
  assert.equal(effective.q006a?.approved_by, "Ellen Sun");
  assert.equal(effective.q006a?.approved_at, APPROVED_AT);

  for (const field of EXPECTED_PREPARATION_TRUE) {
    assert.equal(effective.authorization_state?.[field], true, `${field} must be true after Q-006A approval`);
  }
  for (const field of EXPECTED_EXECUTION_FALSE) {
    assert.equal(effective.authorization_state?.[field], false, `${field} must remain false after Q-006A approval`);
  }

  const gates = verifyEffectiveGates(effective);

  assert.equal(state.status, "approved");
  assert.equal(state.approved_by, "Ellen Sun");
  assert.equal(state.approved_at, APPROVED_AT);
  assert.equal(state.source_instruction, "Do the next step.");
  assert.equal(state.next_gate, "R-02 bounded methodological feedback collected and dispositioned");
  assert.ok(Object.values(state.execution_authorizations ?? {}).every((value) => value === false));

  assert.match(interpretation, /Do the next step/);
  assert.match(interpretation, /Approval of Q-006A as written/i);
  assert.match(interpretation, /No contact or sending/i);

  assert.deepEqual([...effective.prepared_q006a_artifacts].sort(), [...EXPECTED_ARTIFACTS].sort());
  for (const path of [HISTORICAL_SNAPSHOT_PATH, ...EXPECTED_ARTIFACTS]) {
    await access(resolve(root, path), constants.R_OK);
  }

  for (const name of ["Catarina Dutilh Novaes", "Edouard Machery", "Joshua Knobe", "Eric Schwitzgebel"]) {
    assert.match(slate, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(slate, /No contact or sending is authorized/i);
  assert.match(slate, /Wave 1/i);
  assert.match(slate, /Wave 2/i);
  assert.match(slate, /Stop outreach once two substantive reviews are secured/i);
  assert.match(slate, /separate sending approval/i);

  assert.match(emailPacket, /Exact internal draft\. Not sent/i);
  assert.match(emailPacket, /Request for 20-minute methodological review/i);
  assert.match(emailPacket, /I am not asking for bulk rating/i);
  assert.match(emailPacket, /single permitted follow-up/i);
  assert.match(emailPacket, /Before any email is drafted in or sent through Gmail/i);

  assert.match(excerpt, /12 philosophical positions/i);
  assert.match(excerpt, /48 critiques total/i);
  assert.match(excerpt, /96 accepted initial ratings/i);
  assert.match(excerpt, /creates no synthetic consensus score/i);
  assert.match(excerpt, /The checked-in project policy has zero operative routes/i);
  assert.match(excerpt, /Participation does not imply endorsement/i);

  const artifactText = `${slate}\n${emailPacket}\n${excerpt}`;
  for (const forbidden of [
    "task_position_token",
    "task_critique_token",
    "protected_item_text",
    "participant_id",
    "rating_id",
    "case_id",
  ]) {
    assert.equal(artifactText.includes(forbidden), false, `prepared public packet exposes ${forbidden}`);
  }

  return {
    status: "pass",
    historical_snapshot_retained: true,
    legacy_current_ledger_consistent: true,
    effective_ledger_id: effective.ledger_id,
    q006a_status: effective.q006a.status,
    r01_status: gates.get("R-01").status,
    blocked_remaining_gates: ["R-02", "R-03", "R-04", "R-05", "R-06"].length,
    preparation_authorizations_true: EXPECTED_PREPARATION_TRUE.length,
    execution_authorizations_false: EXPECTED_EXECUTION_FALSE.length,
    adviser_candidates: 4,
    outreach_authorized: false,
    pilot_ready_to_start: false,
    phase_2_authorized: false,
  };
}

function verifyHistoricalSnapshot(snapshot) {
  assert.equal(snapshot.snapshot_id, "q006a-pre-approval-readiness-v1-2026-08-01");
  assert.equal(snapshot.snapshot_version, 1);
  assert.equal(snapshot.source?.ledger_id, "metaphilosophy-pilot-readiness-v1-2026-07-30");
  assert.equal(snapshot.source?.github_blob_sha, "d0ccc4071fac3612ece4e7236e379e47b3219095");
  assert.equal(snapshot.q006a?.status, "pending_project_owner_decision");
  assert.equal(snapshot.q006a?.approved_at, null);
  assert.ok(Object.values(snapshot.authorization_state ?? {}).every((value) => value === false));
  assert.equal(snapshot.readiness_gates?.length, 6);
  for (const gate of snapshot.readiness_gates ?? []) {
    assert.equal(gate.status, "blocked", `${gate.id} historical state must be blocked`);
    assert.equal(gate.evidence, null, `${gate.id} historical evidence must be null`);
  }
  assert.equal(snapshot.overall_readiness?.ready_to_start, false);
}

function verifyLegacyCurrentLedger(legacy) {
  assert.equal(legacy.ledger_id, "metaphilosophy-pilot-readiness-v1-2026-07-30");
  assert.equal(legacy.authorization_state?.q006a?.status, "approved_nonbinding_consultation_and_screening_only");
  assert.equal(legacy.authorization_state?.q006a?.approved_at, APPROVED_AT);
  for (const field of LEGACY_PREPARATION_TRUE) {
    assert.equal(legacy.authorization_state?.[field], true, `legacy ${field} must be true`);
  }
  for (const field of LEGACY_EXECUTION_FALSE) {
    assert.equal(legacy.authorization_state?.[field], false, `legacy ${field} must remain false`);
  }
  const gates = new Map((legacy.readiness_gates ?? []).map((gate) => [gate.id, gate]));
  assert.equal(gates.get("R-01")?.status, "passed");
  for (const id of ["R-02", "R-03", "R-04", "R-05", "R-06"]) {
    assert.equal(gates.get(id)?.status, "blocked", `legacy ${id} must remain blocked`);
    assert.equal(gates.get(id)?.evidence, null, `legacy ${id} evidence must remain null`);
  }
  assert.equal(legacy.overall_readiness?.ready_to_start, false);
}

function verifyEffectiveGates(effective) {
  const gates = new Map((effective.readiness_gates ?? []).map((gate) => [gate.id, gate]));
  assert.equal(gates.size, 6);
  assert.equal(gates.get("R-01")?.status, "passed");
  assert.equal(gates.get("R-01")?.passed_at, APPROVED_AT);
  assert.ok(Array.isArray(gates.get("R-01")?.evidence) && gates.get("R-01").evidence.length === 2);
  for (const id of ["R-02", "R-03", "R-04", "R-05", "R-06"]) {
    assert.equal(gates.get(id)?.status, "blocked", `${id} must remain blocked`);
    assert.equal(gates.get(id)?.evidence, null, `${id} evidence must remain null`);
    assert.equal(gates.get(id)?.passed_at, null, `${id} passed_at must remain null`);
  }
  assert.equal(effective.overall_readiness?.status, "blocked_at_r02");
  assert.equal(effective.overall_readiness?.ready_to_start, false);
  assert.equal(effective.overall_readiness?.readiness_signed_at, null);
  assert.equal(effective.overall_readiness?.derived_calendar_start, null);
  assert.equal(effective.overall_readiness?.derived_calendar_end, null);
  return gates;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await verifyQ006aApprovedTransition();
  console.log(JSON.stringify(report, null, 2));
}
