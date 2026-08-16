import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  PilotInterpretationCauseCodingError,
  analyzeInterpretationCauseCodes,
  assertPublicInterpretationCauseCodingReport,
  generateInterpretationCauseCodingPackets,
  sanitizeInterpretationCauseCodingAnalysis,
  sanitizeInterpretationCauseCodingPacketReport,
  validateInterpretationCauseCodeDataset,
  validateInterpretationCauseCodingControl,
  validateInterpretationCauseReconciliations,
} from "../scripts/pilot-interpretation-cause-coding.mjs";

const root = resolve(import.meta.dirname, "..");
const topics = [
  "normative_ethics",
  "political_philosophy",
  "epistemology_and_philosophy_of_science",
  "philosophy_of_mind_and_ai_consciousness",
  "decision_theory_and_social_choice",
  "metaphilosophy_and_ai_governance",
];
const hiddenVisibility = {
  numeric_scores_visible: false,
  score_gaps_visible: false,
  other_adjudicator_code_visible: false,
  model_judgments_visible: false,
  acquisition_strata_visible: false,
  aggregate_pilot_results_visible: false,
  adjudication_outcomes_visible: false,
  rater_identity_visible: false,
  rater_seniority_visible: false,
};

async function endpointContract() {
  return JSON.parse(await readFile(resolve(root, "ops/pilot-endpoint-design-amendment-v1.json"), "utf8"));
}

function makeControl() {
  const pairs = [];
  for (let positionIndex = 1; positionIndex <= 12; positionIndex += 1) {
    const slot = String(positionIndex).padStart(2, "0");
    const topic = topics[Math.floor((positionIndex - 1) / 2)];
    for (let critiqueIndex = 1; critiqueIndex <= 4; critiqueIndex += 1) {
      const pairNumber = (positionIndex - 1) * 4 + critiqueIndex;
      pairs.push({
        pair_id: `SIM_PAIR_${String(pairNumber).padStart(2, "0")}`,
        position_id: `SIM_P${slot}`,
        critique_id: `SIM_P${slot}_C${critiqueIndex}`,
        topic_family: topic,
        position_text: `Synthetic position ${slot} states a bounded philosophical claim for workflow testing.`,
        critique_text: `Synthetic critique ${critiqueIndex} attacks one specified part of position ${slot} for workflow testing.`,
        fingerprints: [
          {
            fingerprint_id: `SIM_FP_${String(pairNumber).padStart(2, "0")}_A`,
            role_mask: "RATER_A",
            position_conclusion_summary: `Rater A reads position ${slot} as advancing the stated bounded conclusion.`,
            critique_target_summary: `Rater A reads critique ${critiqueIndex} as attacking the stated supporting claim.`,
            priced_in_assessment: pairNumber % 7 === 0 ? "uncertain" : "no",
            interpretation_confidence: pairNumber % 7 === 0 ? "low" : "high",
            background_assumptions: pairNumber % 7 === 0
              ? "The synthetic reader is uncertain which background assumption the position presupposes."
              : "",
            position_ambiguity: pairNumber % 11 === 0,
            critique_ambiguity: pairNumber % 13 === 0,
            insufficient_context: false,
            locked_at: "2026-08-16T00:00:00.000Z",
            immutable: true,
          },
          {
            fingerprint_id: `SIM_FP_${String(pairNumber).padStart(2, "0")}_B`,
            role_mask: "RATER_B",
            position_conclusion_summary: `Rater B reads position ${slot} as advancing the same bounded conclusion.`,
            critique_target_summary: `Rater B reads critique ${critiqueIndex} as attacking the specified supporting claim.`,
            priced_in_assessment: "no",
            interpretation_confidence: "high",
            background_assumptions: "",
            position_ambiguity: false,
            critique_ambiguity: false,
            insufficient_context: false,
            locked_at: "2026-08-16T00:00:01.000Z",
            immutable: true,
          },
        ],
      });
    }
  }

  return {
    coding_request_id: "synthetic-interpretation-cause-coding-v1",
    input_version: 1,
    programme_id: "metaphilosophy-48-critique-pilot-v1-2026-07-30",
    data_class: "synthetic_test_fixture",
    mode: "simulation",
    opened_at: "2026-08-16T01:00:00.000Z",
    rating_work_authorized: false,
    research_start_authorized: false,
    participant_access_authorized: false,
    recruitment_authorized: false,
    payment_authorized: false,
    phase_2_authorized: false,
    authorization: {
      q_006b_approved: false,
      participants_confirmed: false,
      cause_coding_authorized: false,
      workload_and_honorarium_readback_complete: false,
      private_controlled_storage_confirmed: false,
      approval_record_ids: [],
      approved_at: null,
    },
    adjudicators: [
      {
        adjudicator_id: "SIM_ADJ_A",
        qualified: true,
        consented: true,
        calibrated: true,
        available: true,
        approved_topic_families: [...topics],
        conflict_position_ids: [],
        conflict_critique_ids: [],
        prior_label_exposure_position_ids: [],
      },
      {
        adjudicator_id: "SIM_ADJ_B",
        qualified: true,
        consented: true,
        calibrated: true,
        available: true,
        approved_topic_families: [...topics],
        conflict_position_ids: [],
        conflict_critique_ids: [],
        prior_label_exposure_position_ids: [],
      },
    ],
    pairs,
  };
}

function makeCodeDataset(packetReport) {
  const pairOrdinal = new Map(
    [...new Set(packetReport.packets.map((packet) => packet.pair_id))]
      .sort()
      .map((pairId, index) => [pairId, index + 1]),
  );
  const adjudicatorIds = [...new Set(packetReport.packets.map((packet) => packet.adjudicator_id))].sort();
  const initialCodes = packetReport.packets.map((packet, index) => {
    const ordinal = pairOrdinal.get(packet.pair_id);
    const coderIndex = adjudicatorIds.indexOf(packet.adjudicator_id);
    let causeCodes;
    if (ordinal <= 40) causeCodes = ["compatible_interpretations"];
    else if (ordinal <= 44) {
      causeCodes = coderIndex === 0
        ? ["material_position_conclusion_difference"]
        : ["material_critique_target_or_claim_difference"];
    } else causeCodes = ["unresolved_or_indeterminate"];
    return {
      code_id: `SIM_CODE_${String(index + 1).padStart(3, "0")}`,
      packet_id: packet.packet_id,
      pair_id: packet.pair_id,
      adjudicator_id: packet.adjudicator_id,
      stage: "initial_interpretation_cause_code",
      version: 1,
      predecessor_code_id: null,
      cause_codes: causeCodes,
      rationale: `Synthetic object-level rationale for ${packet.pair_id} under the assigned role-masked packet.`,
      locked_at: `2026-08-16T02:${String(Math.floor(index / 60)).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}.000Z`,
      immutable: true,
      visibility_attestation: { ...hiddenVisibility },
    };
  });
  return {
    dataset_id: "synthetic-interpretation-cause-code-dataset-v1",
    dataset_version: 1,
    programme_id: packetReport.programme_id,
    data_class: packetReport.data_class,
    initial_codes_immutable: true,
    rating_work_authorized: false,
    research_start_authorized: false,
    initial_codes: initialCodes,
  };
}

function makeReconciliations(codeDataset) {
  const byPair = new Map();
  for (const code of codeDataset.initial_codes) {
    if (!byPair.has(code.pair_id)) byPair.set(code.pair_id, []);
    byPair.get(code.pair_id).push(code);
  }
  const disputedPairIds = [...byPair.keys()].sort().slice(40, 44);
  return disputedPairIds.map((pairId, index) => ({
    reconciliation_id: `SIM_RECON_${index + 1}`,
    pair_id: pairId,
    initial_code_ids: byPair.get(pairId).map((code) => code.code_id).sort(),
    disposition: index < 2
      ? "shared_classification"
      : index === 2
        ? "coding_disagreement_preserved"
        : "unresolved_classification",
    cause_codes: index < 2 ? ["material_critique_target_or_claim_difference"] : [],
    rationale: `Synthetic reconciliation rationale preserving both immutable initial codes for ${pairId}.`,
    locked_at: `2026-08-16T04:00:0${index}.000Z`,
    initial_codes_preserved: true,
    overwrites_initial_codes: false,
    forced_consensus_prohibited: true,
  }));
}

test("generates exactly 96 role-masked packets for all 48 paired fingerprints", async () => {
  const contract = await endpointContract();
  const control = makeControl();
  const validation = validateInterpretationCauseCodingControl(contract, control);
  assert.equal(validation.status, "pass", validation.errors.join("\n"));

  const report = generateInterpretationCauseCodingPackets(contract, control);
  assert.equal(report.pair_count, 48);
  assert.equal(report.adjudicator_count, 2);
  assert.equal(report.packet_count, 96);
  assert.equal(report.invariants.all_pairs_dual_coded, true);
  assert.equal(report.invariants.role_masked, true);
  assert.equal(report.coding_work_authorized, false);
  assert.equal(report.payment_authorized, false);
  assert.ok(report.packets.every((packet) => Object.values(packet.visibility).every((value) => value === false)));
  const packetsPerPair = new Map();
  for (const packet of report.packets) {
    packetsPerPair.set(packet.pair_id, (packetsPerPair.get(packet.pair_id) ?? 0) + 1);
    assert.deepEqual(packet.fingerprints.map((row) => row.role_mask), ["RATER_A", "RATER_B"]);
    assert.equal("rater_id" in packet.fingerprints[0], false);
  }
  assert.ok([...packetsPerPair.values()].every((count) => count === 2));
});

test("packet set is independent of control pair and adjudicator array ordering", async () => {
  const contract = await endpointContract();
  const control = makeControl();
  const first = generateInterpretationCauseCodingPackets(contract, control);
  const reordered = structuredClone(control);
  reordered.pairs.reverse();
  reordered.adjudicators.reverse();
  reordered.pairs.forEach((pair) => pair.fingerprints.reverse());
  const second = generateInterpretationCauseCodingPackets(contract, reordered);
  assert.equal(second.packet_set_sha256, first.packet_set_sha256);
  assert.deepEqual(second.packets, first.packets);
});

test("rejects score, score-gap, model-output, and rater-identity leakage in coding inputs", async () => {
  const contract = await endpointContract();
  const control = makeControl();
  control.pairs[0].scores = { overall: [0.2, 0.8] };
  control.pairs[1].score_gaps = { overall: 0.6 };
  control.pairs[2].model_judgments = ["strong", "weak"];
  control.pairs[3].fingerprints[0].rater_id = "SIM_REAL_RATER";

  const validation = validateInterpretationCauseCodingControl(contract, control);
  assert.equal(validation.status, "fail");
  assert.ok(validation.errors.some((error) => error.includes("forbidden blind-coding fields")));
  assert.throws(
    () => generateInterpretationCauseCodingPackets(contract, control),
    (error) => error instanceof PilotInterpretationCauseCodingError && error.message.includes("forbidden blind-coding fields"),
  );
});

test("validates complete immutable dual coding and rejects visibility contamination", async () => {
  const contract = await endpointContract();
  const packetReport = generateInterpretationCauseCodingPackets(contract, makeControl());
  const dataset = makeCodeDataset(packetReport);
  const validation = validateInterpretationCauseCodeDataset(packetReport, dataset, { requireComplete: true });
  assert.equal(validation.status, "pass", validation.errors.join("\n"));
  assert.equal(validation.initial_codes, 96);
  assert.equal(validation.covered_pairs, 48);

  const contaminated = structuredClone(dataset);
  contaminated.initial_codes[0].visibility_attestation.numeric_scores_visible = true;
  contaminated.initial_codes[1].scores = { overall: 0.5 };
  const failed = validateInterpretationCauseCodeDataset(packetReport, contaminated, { requireComplete: true });
  assert.equal(failed.status, "fail");
  assert.ok(failed.errors.some((error) => error.includes("numeric_scores_visible must equal false")));
  assert.ok(failed.errors.some((error) => error.includes("forbidden blind-coding fields")));
});

test("preserves immutable initial codes and permits only separate non-overwriting reconciliation", async () => {
  const contract = await endpointContract();
  const packetReport = generateInterpretationCauseCodingPackets(contract, makeControl());
  const dataset = makeCodeDataset(packetReport);
  const reconciliations = makeReconciliations(dataset);
  const validation = validateInterpretationCauseReconciliations(packetReport, dataset, reconciliations);
  assert.equal(validation.status, "pass", validation.errors.join("\n"));

  const invalid = structuredClone(reconciliations);
  invalid[0].overwrite_initial_codes = true;
  invalid[0].replacement_code_ids = invalid[0].initial_code_ids;
  invalid[1].forced_consensus_prohibited = false;
  const failed = validateInterpretationCauseReconciliations(packetReport, dataset, invalid);
  assert.equal(failed.status, "fail");
  assert.ok(failed.errors.some((error) => error.includes("overwrites_initial_codes must equal false")));
  assert.ok(failed.errors.some((error) => error.includes("forbidden overwrite or consensus fields")));
  assert.ok(failed.errors.some((error) => error.includes("forced_consensus_prohibited must equal true")));
});

test("reports the all-48 denominator, raw dual-code disagreement, and unresolved classifications", async () => {
  const contract = await endpointContract();
  const packetReport = generateInterpretationCauseCodingPackets(contract, makeControl());
  const dataset = makeCodeDataset(packetReport);
  const reconciliations = makeReconciliations(dataset);
  const report = analyzeInterpretationCauseCodes(packetReport, dataset, reconciliations);

  assert.equal(report.analysis.pair_count, 48);
  assert.equal(report.analysis.initial_code_count, 96);
  assert.equal(report.analysis.exact_agreement_pairs, 44);
  assert.equal(report.analysis.raw_disagreement_pairs, 4);
  assert.equal(report.analysis.raw_unresolved_or_disagreed_pairs, 8);
  assert.equal(report.analysis.reconciliation_records, 4);
  assert.equal(report.analysis.reconciliation_disposition_counts.shared_classification, 2);
  assert.equal(report.analysis.reconciliation_disposition_counts.coding_disagreement_preserved, 1);
  assert.equal(report.analysis.reconciliation_disposition_counts.unresolved_classification, 1);
  assert.equal(report.analysis.final_unresolved_pairs, 6);
  assert.equal(report.workload_readback.independent_initial_cause_code_records, 96);
  assert.equal(report.workload_readback.source_derived_minutes_per_cause_code, null);
  assert.equal(report.workload_readback.current_adjudication_reserve_usd, 100);
  assert.equal(report.workload_readback.current_reserve_changed, false);
  assert.equal(report.workload_readback.current_reserve_shown_sufficient, false);
  assert.equal(report.payment_authorized, false);
});

test("sanitized packet and analysis reports exclude controlled identifiers, texts, fingerprints, and rationales", async () => {
  const contract = await endpointContract();
  const packetReport = generateInterpretationCauseCodingPackets(contract, makeControl());
  const dataset = makeCodeDataset(packetReport);
  const analysis = analyzeInterpretationCauseCodes(packetReport, dataset, makeReconciliations(dataset));
  const packetPublic = sanitizeInterpretationCauseCodingPacketReport(packetReport);
  const analysisPublic = sanitizeInterpretationCauseCodingAnalysis(analysis);

  assert.equal(assertPublicInterpretationCauseCodingReport(packetPublic), true);
  assert.equal(assertPublicInterpretationCauseCodingReport(analysisPublic), true);
  assert.equal("packets" in packetPublic, false);
  assert.equal("initial_codes" in analysisPublic, false);
  assert.equal(packetPublic.privacy.contains_item_ids_or_text, false);
  assert.equal(packetPublic.privacy.contains_fingerprints, false);
  assert.equal(analysisPublic.privacy.contains_individual_codes_or_rationales, false);
  assert.equal(analysisPublic.privacy.contains_reconciliation_rationales, false);
});

test("controlled packet generation remains blocked without Q-006B, workload, and storage approvals", async () => {
  const contract = await endpointContract();
  const control = makeControl();
  control.mode = "controlled_packet_generation";
  control.data_class = "private_controlled_cause_coding_input";

  const validation = validateInterpretationCauseCodingControl(contract, control);
  assert.equal(validation.status, "fail");
  assert.ok(validation.errors.some((error) => error.includes("q_006b_approved must equal true")));
  assert.ok(validation.errors.some((error) => error.includes("workload_and_honorarium_readback_complete must equal true")));
  assert.ok(validation.errors.some((error) => error.includes("cause_coding_authorized must equal true")));
});
