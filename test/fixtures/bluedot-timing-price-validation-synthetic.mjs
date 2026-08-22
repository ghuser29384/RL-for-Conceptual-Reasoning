import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export function createSyntheticBlueDotTimingPriceEvidence({ controlled = false } = {}) {
  const prefix = controlled ? "EVID" : "SIM";
  const startMs = Date.parse("2026-08-22T12:00:00.000Z");
  const people = [
    [`${prefix}_RATER_A`, "rater"], [`${prefix}_RATER_B`, "rater"],
    [`${prefix}_CODER_A`, "cause_coder"], [`${prefix}_CODER_B`, "cause_coder"],
  ].map(([evidence_person_id, role]) => ({
    evidence_person_id, role, simulated: !controlled,
    qualification_documented_privately: true,
    participant_information_received: true,
    consent_recorded: true,
    conflict_and_prior_exposure_check_complete: true,
    calibration_complete: true,
    scope_and_price_question_understood: true,
    post_task_price_record_complete: true,
  }));

  const latest = new Map(); const work_units = []; let sequence = 0;
  const add = (personId, stage, active, paused = 0, slot = null) => {
    sequence += 1;
    const started = latest.get(personId) ?? startMs;
    const completed = started + (active + paused + 5) * 1000;
    latest.set(personId, completed + 5000);
    work_units.push({
      work_unit_id: `${prefix}_WU_${String(sequence).padStart(3, "0")}`,
      evidence_person_id: personId, stage, slot,
      timing_method: "monotonic_active_timer_v1",
      started_at: new Date(started).toISOString(), completed_at: new Date(completed).toISOString(),
      active_seconds: active, paused_seconds: paused, interruption_count: paused ? 1 : 0,
      imputed: false, complete: true, excluded: false, exclusion_reason: null,
    });
  };

  for (const { evidence_person_id } of people) {
    add(evidence_person_id, "orientation", 300);
    add(evidence_person_id, "calibration", 600, 30);
  }
  for (const personId of [`${prefix}_RATER_A`, `${prefix}_RATER_B`]) {
    for (const position of ["P1", "P2"]) add(personId, "position_conclusion", 90, 0, position);
    for (const position of ["P1", "P2"]) for (const critique of ["C1", "C2", "C3", "C4"]) {
      const slot = `${position}/${critique}`;
      add(personId, "critique_interpretation", 120, 0, slot);
      add(personId, "initial_scoring", 360, critique === "C3" ? 20 : 0, slot);
    }
    for (const slot of ["P1/C1", "P2/C1"]) add(personId, "blind_self_check", 180, 0, slot);
    add(personId, "administration", 120);
  }
  for (const personId of [`${prefix}_CODER_A`, `${prefix}_CODER_B`]) {
    for (const position of ["P1", "P2"]) for (const critique of ["C1", "C2", "C3", "C4"]) add(personId, "initial_cause_code", 150, 0, `${position}/${critique}`);
    for (const slot of ["R1", "R2"]) add(personId, "reconciliation_rehearsal", 300, slot === "R2" ? 15 : 0, slot);
    add(personId, "administration", 120);
  }

  const workCompletedMs = Math.max(...work_units.map((row) => Date.parse(row.completed_at)));
  const values = new Map([
    [`${prefix}_RATER_A`, [120, 160, 4]], [`${prefix}_RATER_B`, [130, 170, 4]],
    [`${prefix}_CODER_A`, [45, 60, 2]], [`${prefix}_CODER_B`, [50, 65, 2]],
  ]);
  const price_records = people.map(({ evidence_person_id, role }, index) => {
    const [minimum, preferred, maximumHours] = values.get(evidence_person_id);
    return {
      price_record_id: `${prefix}_PRICE_${index + 1}`, evidence_person_id, role, currency: "USD",
      scope_reviewed: true, post_task: true, nonbinding: true,
      response_status: "usable_amount_evidence",
      minimum_acceptable_fixed_honorarium_usd: minimum,
      preferred_fixed_honorarium_usd: preferred,
      maximum_acceptable_workload_hours: maximumHours,
      recorded_at: new Date(workCompletedMs + (index + 1) * 60_000).toISOString(),
    };
  });

  return {
    evidence_id: `${prefix}_BLUEDOT_TIMING_PRICE_V1`,
    protocol_contract_id: "mp-bluedot-timing-price-validation-v1", input_version: 1,
    mode: controlled ? "controlled_evidence_validation" : "simulation",
    data_class: controlled ? "private_qualified_timing_price_evidence" : "synthetic_test_fixture",
    fixture_only: !controlled,
    started_at: new Date(startMs).toISOString(), completed_at: new Date(workCompletedMs).toISOString(),
    authorization: controlled ? {
      human_timing_collection_approved: true, price_acceptance_collection_approved: true,
      participant_information_approved: true, consent_materials_approved: true,
      private_storage_confirmed: true, task_packet_frozen: true, owner_authorization_recorded: true,
      approval_record_ids: ["APPROVAL_SCOPE_V1", "APPROVAL_CONSENT_V1", "APPROVAL_STORAGE_V1", "APPROVAL_ACCESS_V1"],
      approved_at: "2026-08-22T11:58:00.000Z",
    } : {
      human_timing_collection_approved: false, price_acceptance_collection_approved: false,
      participant_information_approved: false, consent_materials_approved: false,
      private_storage_confirmed: false, task_packet_frozen: false, owner_authorization_recorded: false,
      approval_record_ids: [], approved_at: null,
    },
    research_ratings_authorized: false, research_start_authorized: false,
    payment_authorized: false, grant_submission_authorized: false,
    deployment_authorized: false, production_or_staging_mutation_authorized: false,
    self_check_selection: { frozen_at: "2026-08-22T11:59:00.000Z", selected_slots: ["P1/C1", "P2/C1"] },
    people, work_units, price_records, defects: [],
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) console.log(JSON.stringify(createSyntheticBlueDotTimingPriceEvidence(), null, 2));
