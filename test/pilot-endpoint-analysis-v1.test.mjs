import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { generatePilotAssignments } from "../scripts/pilot-assignment-generator.mjs";
import {
  analyzePilotEndpointDataset,
  assertPublicPilotEndpointAnalysis,
  correctedWithinPositionOrderingAgreement,
  sanitizePilotEndpointAnalysis,
  symmetricLmcaHumanDiscrepancy,
  validatePilotEndpointDataset,
} from "../scripts/pilot-endpoint-analysis-v1.mjs";
import { generatePilotSelfCheckSelection } from "../scripts/pilot-self-check-selection.mjs";

const root = resolve(import.meta.dirname, "..");
const exposureAttestation = {
  peer_scores_visible: false,
  peer_rationales_visible: false,
  model_judgments_visible: false,
  aggregate_results_visible: false,
  cause_codes_visible: false,
  discussion_visible: false,
  adjudication_state_visible: false,
};

async function loadJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

async function completeFixture() {
  const [endpointContract, methodology, assignmentInput] = await Promise.all([
    loadJson("ops/pilot-endpoint-design-amendment-v1.json"),
    loadJson("ops/next-steps-2026-07-23/pilot-methodology-recommendations.json"),
    loadJson("test/fixtures/pilot-assignment-synthetic.json"),
  ]);
  const assignmentReport = generatePilotAssignments(methodology, assignmentInput);
  const selectionInput = {
    selection_input_id: "synthetic-endpoint-analysis-self-check-selection-v1",
    input_version: 1,
    programme_id: assignmentInput.programme_id,
    data_class: "synthetic_test_fixture",
    mode: "simulation",
    seed: "synthetic-endpoint-analysis-selection-seed-v1",
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
  const selection = generatePilotSelfCheckSelection(endpointContract, selectionInput);
  const assignments = [...assignmentReport.position_assignments].sort((left, right) => left.slot_id.localeCompare(right.slot_id));
  const positions = assignments.map((assignment) => ({
    position_id: assignment.position_id,
    critique_ids: [...assignment.critique_ids],
    topic_family: assignment.topic_family,
    source_class: assignment.source_class,
  }));
  const initialRatings = [];
  let ratingOrdinal = 0;

  for (const [positionIndex, assignment] of assignments.entries()) {
    const positionConclusionLock = new Date(Date.UTC(2026, 7, 16, positionIndex, 0, 0)).toISOString();
    for (const [raterIndex, raterId] of [...assignment.rater_ids].sort().entries()) {
      const positionConclusionSummary = `${raterId} reads ${assignment.position_id} as advancing one bounded conclusion used consistently across all sibling critiques.`;
      for (const [critiqueIndex, critiqueId] of [...assignment.critique_ids].sort().entries()) {
        ratingOrdinal += 1;
        const overall = clamp01(0.14 + positionIndex * 0.035 + critiqueIndex * 0.16 + raterIndex * 0.035);
        const centrality = clamp01(0.24 + critiqueIndex * 0.15 + positionIndex * 0.012 + raterIndex * 0.02);
        const strength = clamp01(0.28 + critiqueIndex * 0.13 + positionIndex * 0.008 - raterIndex * 0.015);
        const clarity = clamp01(0.73 + ((positionIndex + critiqueIndex + raterIndex) % 5) * 0.045);
        const lockedAt = new Date(Date.UTC(2026, 7, 16, positionIndex, 10 + raterIndex * 5 + critiqueIndex, 0)).toISOString();
        initialRatings.push({
          rating_id: `RT_INIT_${String(ratingOrdinal).padStart(3, "0")}`,
          position_id: assignment.position_id,
          critique_id: critiqueId,
          rater_id: raterId,
          stage: "initial",
          version: 1,
          predecessor_rating_id: null,
          rubric_version: "rubric-v2-seven-dimensional",
          scores: {
            centrality,
            strength,
            correctness: clamp01(0.62 + critiqueIndex * 0.055 - raterIndex * 0.02),
            clarity,
            dead_weight: clamp01(0.19 - critiqueIndex * 0.025 + raterIndex * 0.01),
            single_issue: clamp01(0.82 - critiqueIndex * 0.025 + raterIndex * 0.015),
            overall,
          },
          overall_rationale: `Synthetic blind-initial rationale for ${critiqueId}; it supplies enough object-level detail for endpoint analysis testing.`,
          confidence: clamp01(0.72 + raterIndex * 0.06),
          time_spent_seconds: 360 + positionIndex * 9 + critiqueIndex * 17 + raterIndex * 13,
          insufficient_context: false,
          verification_status: "not_applicable",
          item_integrity_flags: [],
          accepted: true,
          locked_at: lockedAt,
          object_level_revision_reason: null,
          position_conclusion_summary: positionConclusionSummary,
          position_conclusion_locked_at: positionConclusionLock,
          critique_target_summary: `${raterId} reads ${critiqueId} as attacking the specified support for the bounded position conclusion.`,
          priced_in_assessment: "no",
          interpretation_confidence: "high",
          background_assumptions: "",
          position_ambiguity: false,
          critique_ambiguity: false,
          interpretation_fingerprint_locked_before_peer_exposure: true,
        });
      }
    }
  }

  const initialByKey = new Map(
    initialRatings.map((rating) => [`${rating.position_id}|${rating.critique_id}|${rating.rater_id}`, rating]),
  );
  const selfChecks = selection.self_check_records.map((selectionRecord, index) => {
    const predecessor = initialByKey.get(`${selectionRecord.position_id}|${selectionRecord.critique_id}|${selectionRecord.rater_id}`);
    assert.ok(predecessor, "selection record must map to an initial rating");
    const changed = index % 3 === 0;
    const scores = structuredClone(predecessor.scores);
    if (changed) scores.overall = clamp01(scores.overall + (index % 2 === 0 ? 0.025 : -0.025));
    return {
      rating_id: `RT_CHECK_${String(index + 1).padStart(3, "0")}`,
      position_id: predecessor.position_id,
      critique_id: predecessor.critique_id,
      rater_id: predecessor.rater_id,
      stage: "blind_self_check",
      version: 2,
      predecessor_rating_id: predecessor.rating_id,
      self_check_selection_record_id: selectionRecord.self_check_record_id,
      rubric_version: "rubric-v2-seven-dimensional",
      scores,
      overall_rationale: `Synthetic blind self-check rationale for ${predecessor.critique_id}; no peer, model, aggregate, or adjudication evidence was visible.`,
      confidence: predecessor.confidence,
      time_spent_seconds: 150 + (index % 5) * 12,
      accepted: true,
      locked_at: new Date(Date.parse(predecessor.locked_at) + 86_400_000).toISOString(),
      scores_changed: changed,
      object_level_revision_reason: changed
        ? "On blind rereading, the critique's object-level force warranted a small overall-score correction."
        : null,
      initial_rating_preserved: true,
      exposure_attestation: { ...exposureAttestation },
    };
  });

  return {
    endpointContract,
    assignmentReport,
    selection,
    dataset: {
      dataset_id: "synthetic-complete-endpoint-analysis-v1",
      dataset_version: 1,
      programme_id: assignmentInput.programme_id,
      data_class: "synthetic_test_fixture",
      rubric_version: "rubric-v2-seven-dimensional",
      positions,
      ratings: [...initialRatings, ...selfChecks],
    },
  };
}

test("validates the complete 96-initial plus 24-self-check endpoint fixture", async () => {
  const { dataset } = await completeFixture();
  const report = validatePilotEndpointDataset(dataset, { requireComplete: true, requireEndpointV1: true });
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.positions, 12);
  assert.equal(report.critiques, 48);
  assert.equal(report.accepted_initial_ratings, 96);
  assert.equal(report.accepted_blind_self_checks, 24);
});

test("rejects self-check exposure, predecessor, and change-reason violations", async () => {
  const { dataset } = await completeFixture();
  const invalid = structuredClone(dataset);
  const firstCheck = invalid.ratings.find((rating) => rating.stage === "blind_self_check");
  firstCheck.exposure_attestation.peer_scores_visible = true;
  firstCheck.predecessor_rating_id = "MISSING_INITIAL";
  firstCheck.scores_changed = true;
  firstCheck.object_level_revision_reason = null;

  const report = validatePilotEndpointDataset(invalid, { requireComplete: true, requireEndpointV1: true });
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("peer_scores_visible must equal false")));
  assert.ok(report.errors.some((error) => error.includes("predecessor_rating_id does not exist")));
});

test("rejects inconsistent position interpretations and missing conditional background assumptions", async () => {
  const { dataset } = await completeFixture();
  const invalid = structuredClone(dataset);
  const initial = invalid.ratings.filter((rating) => rating.stage === "initial");
  initial[1].position_conclusion_summary = "A materially different synthetic conclusion interpretation for one sibling critique.";
  initial[2].interpretation_confidence = "low";
  initial[2].background_assumptions = "";
  initial[3].priced_in_assessment = "uncertain";
  initial[3].background_assumptions = "";

  const report = validatePilotEndpointDataset(invalid, { requireComplete: true, requireEndpointV1: true });
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("one position_conclusion_summary")));
  assert.ok(report.errors.filter((error) => error.includes("background_assumptions is required")).length >= 2);
});

test("the corrected ordering diagnostic preserves a strong reversal that mean-score weighting would erase", () => {
  const rowsA = [
    ratingForMetric("C1", 0.9),
    ratingForMetric("C2", 0.1),
  ];
  const rowsB = [
    ratingForMetric("C1", 0.1),
    ratingForMetric("C2", 0.9),
  ];
  const meanScoreGap = Math.abs(((0.9 + 0.1) / 2) - ((0.1 + 0.9) / 2));
  assert.equal(meanScoreGap, 0);

  const result = correctedWithinPositionOrderingAgreement(rowsA, rowsB);
  assert.equal(result.comparison_count, 1);
  assert.equal(result.unweighted_agreement, 0);
  assert.equal(result.weight_sum, 0.8);
  assert.equal(result.weighted_agreement, 0);
  assert.equal(result.pair_results[0].strong_reversal_preserved, true);
  assert.equal(result.mean_score_gap_weight_forbidden, true);
});

test("symmetric human discrepancy averages both directional LMCA branches", () => {
  const clear = ratingForMetric("C1", 0.74, { clarity: 0.9, centrality: 0.8, strength: 0.7 });
  const unclear = ratingForMetric("C1", 0.42, { clarity: 0.35, centrality: 0.3, strength: 0.2 });
  const result = symmetricLmcaHumanDiscrepancy(clear, unclear);
  assert.equal(result.mixed_clarity_branch, true);
  assert.equal(result.discrepancy, (result.forward + result.reverse) / 2);
  assert.match(result.classification, /Metaphilosophy symmetric extension/);
});

test("reports position-first profiles and the approved deletion sensitivities without a scientific pass rule", async () => {
  const { dataset } = await completeFixture();
  const interpretationCauseAnalysis = {
    analysis: {
      pair_count: 48,
      initial_code_count: 96,
      exact_agreement_pairs: 41,
      raw_disagreement_pairs: 7,
      final_unresolved_pairs: 3,
    },
  };
  const report = analyzePilotEndpointDataset(dataset, {
    requireComplete: true,
    requireEndpointV1: true,
    interpretationCauseAnalysis,
  });

  assert.equal(report.primary.P1_blind_initial_disagreement_profile.position_count, 12);
  assert.equal(report.primary.P1_blind_initial_disagreement_profile.position_mean_values.length, 12);
  assert.equal(report.primary.P2_interpretation_linkage.pair_count, 48);
  assert.equal(report.primary.P2_interpretation_linkage.initial_code_count, 96);
  assert.equal(report.primary.P3_operational_feasibility_and_burden.accepted_initial_ratings, 96);
  assert.equal(report.primary.P3_operational_feasibility_and_burden.accepted_blind_self_checks, 24);
  assert.equal(report.secondary.S4_composition_and_aggregation_sensitivity.leave_one_position_out.summaries.length, 12);
  assert.equal(report.secondary.S4_composition_and_aggregation_sensitivity.leave_one_rater_out.summaries.length, 6);
  assert.ok(report.secondary.S4_composition_and_aggregation_sensitivity.leave_one_rater_out.summaries.every((row) => row.retained_position_count === 8));
  assert.equal(report.secondary.S4_composition_and_aggregation_sensitivity.reliability_weighting, false);
  assert.equal(report.scientific_numerical_pass_threshold, null);
  assert.equal(report.population_confidence_interval_authorized, false);
  assert.equal(report.null_hypothesis_primary_tests_authorized, false);
  assert.equal(report.primary_model_result, false);
  assert.equal(report.automatic_phase_2_authorized, false);
  assert.equal(report.imputation_used, false);
  assert.equal(report.workload_readback.current_adjudication_reserve_usd, 100);
  assert.equal(report.workload_readback.current_adjudication_reserve_changed, false);
  assert.equal(report.workload_readback.current_adjudication_reserve_shown_sufficient, false);
});

test("public endpoint report replaces controlled position and rater identifiers with generated blocks", async () => {
  const { dataset } = await completeFixture();
  const controlled = analyzePilotEndpointDataset(dataset, { requireComplete: true, requireEndpointV1: true });
  const publicReport = sanitizePilotEndpointAnalysis(controlled);
  const serialized = JSON.stringify(publicReport);

  assert.equal(assertPublicPilotEndpointAnalysis(publicReport), true);
  assert.equal(publicReport.position_results.length, 12);
  assert.ok(publicReport.position_results.every((row) => /^position_\d{2}$/.test(row.position_block)));
  assert.equal(serialized.includes("\"position_id\""), false);
  assert.equal(serialized.includes("\"rater_id\""), false);
  assert.equal(serialized.includes("RT_INIT_"), false);
  assert.equal(serialized.includes("RT_CHECK_"), false);
  assert.equal(serialized.includes("position_conclusion_summary"), false);
  assert.equal(serialized.includes("critique_target_summary"), false);
  assert.equal(serialized.includes("overall_rationale"), false);
  assert.equal(publicReport.privacy.contains_item_ids, false);
  assert.equal(publicReport.privacy.contains_rater_ids, false);
  assert.equal(publicReport.privacy.contains_fingerprint_text, false);
  assert.equal(publicReport.privacy.contains_rationales, false);
});

function ratingForMetric(critiqueId, overall, overrides = {}) {
  return {
    critique_id: critiqueId,
    scores: {
      centrality: overrides.centrality ?? 0.6,
      strength: overrides.strength ?? 0.6,
      correctness: overrides.correctness ?? 0.8,
      clarity: overrides.clarity ?? 0.8,
      dead_weight: overrides.dead_weight ?? 0.1,
      single_issue: overrides.single_issue ?? 0.9,
      overall,
    },
  };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}
