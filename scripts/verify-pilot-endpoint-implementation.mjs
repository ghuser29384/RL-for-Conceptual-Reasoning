import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export async function verifyPilotEndpointImplementation(root = resolve(import.meta.dirname, "..")) {
  const paths = {
    approved: "ops/pilot-endpoint-design-amendment-v1.json",
    selfCheck: "ops/next-steps-2026-07-23/pilot-self-check-selection-contract.json",
    causeCoding: "ops/next-steps-2026-07-23/pilot-interpretation-cause-coding-contract.json",
    analysis: "ops/next-steps-2026-07-23/pilot-endpoint-analysis-contract-v1.json",
    selfCheckModule: "scripts/pilot-self-check-selection.mjs",
    causeCodingModule: "scripts/pilot-interpretation-cause-coding.mjs",
    analysisModule: "scripts/pilot-endpoint-analysis-v1.mjs",
    baseService: "src/pilot-endpoint-service.mjs",
    approvedService: "src/approved-pilot-endpoint-service.mjs",
    formModule: "staging/pilot-endpoint-form.mjs",
  };
  const [approved, selfCheck, causeCoding, analysis, selfCheckModule, causeCodingModule, analysisModule, baseService, approvedService, formModule] = await Promise.all([
    readJson(resolve(root, paths.approved)),
    readJson(resolve(root, paths.selfCheck)),
    readJson(resolve(root, paths.causeCoding)),
    readJson(resolve(root, paths.analysis)),
    readFile(resolve(root, paths.selfCheckModule), "utf8"),
    readFile(resolve(root, paths.causeCodingModule), "utf8"),
    readFile(resolve(root, paths.analysisModule), "utf8"),
    readFile(resolve(root, paths.baseService), "utf8"),
    readFile(resolve(root, paths.approvedService), "utf8"),
    readFile(resolve(root, paths.formModule), "utf8"),
  ]);

  assert.equal(approved.contract_id, "mp-pilot-endpoint-design-amendment-v1");
  assert.equal(approved.status, "approved_for_implementation_design_only");
  assert.equal(approved.owner_decisions.D1_blind_self_check_scope.selected_option, "B");
  assert.equal(approved.owner_decisions.D1_blind_self_check_scope.self_check_records, 24);
  assert.equal(approved.owner_decisions.D2_interpretation_cause_coding_coverage.selected_option, "A");
  assert.equal(approved.owner_decisions.D2_interpretation_cause_coding_coverage.paired_fingerprints, 48);
  assert.equal(approved.owner_decisions.D2_interpretation_cause_coding_coverage.independent_adjudicators_per_pair, 2);
  assertAllFalse(approved.authorization, "approved endpoint authorization");

  assert.equal(selfCheck.contract_id, "pilot-self-check-selection-contract-v1-2026-08-16");
  assert.equal(selfCheck.status, "implementation_template_synthetic_only_no_selection_frozen");
  assert.equal(selfCheck.owner_decision.selected_option, "B");
  assert.equal(selfCheck.owner_decision.selected_positions, 6);
  assert.equal(selfCheck.owner_decision.selected_critiques_per_position, 2);
  assert.equal(selfCheck.owner_decision.self_check_records, 24);
  assert.equal(selfCheck.owner_decision.self_checks_per_core_rater, 4);
  assert.equal(selfCheck.owner_decision.selected_positions_per_core_rater, 2);
  assert.equal(selfCheck.selection_policy.frozen_before_any_pilot_rating, true);
  assert.equal(selfCheck.selection_policy.input_order_independent, true);
  assert.equal(selfCheck.self_check_record_policy.stage, "blind_self_check");
  assert.equal(selfCheck.self_check_record_policy.original_initial_record_immutable, true);
  assertAllFalse(selfCheck.authorization_boundary, "self-check authorization");

  assert.equal(causeCoding.contract_id, "pilot-interpretation-cause-coding-contract-v1-2026-08-16");
  assert.equal(causeCoding.status, "implementation_template_synthetic_only_no_coding_work_authorized");
  assert.equal(causeCoding.owner_decision.selected_option, "A");
  assert.equal(causeCoding.owner_decision.paired_fingerprints, 48);
  assert.equal(causeCoding.owner_decision.independent_adjudicators_per_pair, 2);
  assert.equal(causeCoding.owner_decision.initial_cause_code_records, 96);
  assert.equal(causeCoding.blind_coding_policy.initial_codes_immutable, true);
  assert.equal(causeCoding.blind_coding_policy.reconciliation_may_not_overwrite_initial_codes, true);
  assert.equal(causeCoding.blind_coding_policy.forced_consensus_prohibited, true);
  assert.equal(causeCoding.workload_boundary.current_adjudication_reserve_usd, 100);
  assert.equal(causeCoding.workload_boundary.reserve_changed_by_this_contract, false);
  assert.equal(causeCoding.workload_boundary.reserve_shown_sufficient, false);
  assertAllFalse(causeCoding.authorization_boundary, "cause-coding authorization");

  assert.equal(analysis.contract_id, "pilot-endpoint-analysis-contract-v1-2026-08-16");
  assert.equal(analysis.status, "implementation_template_synthetic_only_no_research_authorization");
  assert.equal(analysis.complete_structure.position_is_primary_aggregation_unit, true);
  assert.equal(analysis.complete_structure.blind_initial_ratings, 96);
  assert.equal(analysis.complete_structure.blind_self_check_records, 24);
  assert.equal(analysis.complete_structure.interpretation_cause_code_records, 96);
  assert.equal(analysis.inference_boundary.population_valid_headline_confidence_interval, false);
  assert.equal(analysis.inference_boundary.primary_null_hypothesis_tests, false);
  assert.equal(analysis.inference_boundary.scientific_numerical_pass_threshold, null);
  assert.equal(analysis.inference_boundary.imputation, false);
  assert.equal(analysis.inference_boundary.reliability_weighting, false);
  assert.equal(analysis.inference_boundary.primary_model_result, false);
  assert.equal(analysis.inference_boundary.automatic_phase_2_decision, false);
  assert.equal(analysis.workload_readback.current_adjudication_reserve_usd, 100);
  assert.equal(analysis.workload_readback.current_reserve_changed, false);
  assert.equal(analysis.workload_readback.current_reserve_shown_sufficient, false);
  assertAllFalse(analysis.authorization_boundary, "analysis authorization");

  assert.match(selfCheckModule, /export function generatePilotSelfCheckSelection/);
  assert.match(selfCheckModule, /outcome-independent blind self-check/i);
  assert.match(selfCheckModule, /SELF_CHECK_RECORDS = 24/);
  assert.match(selfCheckModule, /selected_positions_per_core_rater: 2/);
  assert.match(selfCheckModule, /Controlled generation requires --controlled-output/);
  assert.match(selfCheckModule, /mode: 0o600/);

  assert.match(causeCodingModule, /export function generateInterpretationCauseCodingPackets/);
  assert.match(causeCodingModule, /export function validateInterpretationCauseCodeDataset/);
  assert.match(causeCodingModule, /export function validateInterpretationCauseReconciliations/);
  assert.match(causeCodingModule, /export function analyzeInterpretationCauseCodes/);
  assert.match(causeCodingModule, /numeric_scores_visible/);
  assert.match(causeCodingModule, /other_adjudicator_code_visible/);
  assert.match(causeCodingModule, /initial_codes_immutable: true/);
  assert.match(causeCodingModule, /current_reserve_shown_sufficient: false/);

  assert.match(analysisModule, /export function validatePilotEndpointDataset/);
  assert.match(analysisModule, /export function correctedWithinPositionOrderingAgreement/);
  assert.match(analysisModule, /export function symmetricLmcaHumanDiscrepancy/);
  assert.match(analysisModule, /export function analyzePilotEndpointDataset/);
  assert.match(analysisModule, /average_absolute_within_rater_overall_gap/);
  assert.match(analysisModule, /mean_score_gap_weight_forbidden: true/);
  assert.match(analysisModule, /position_is_primary_aggregation_unit: true/);
  assert.match(analysisModule, /scientific_numerical_pass_threshold: null/);
  assert.match(analysisModule, /reliability_weighting_used: false/);
  assert.match(analysisModule, /imputation_used: false/);

  assert.match(baseService, /pilot_endpoint\.position_conclusion\.locked/);
  assert.match(baseService, /pilot_endpoint\.initial_rating\.locked/);
  assert.match(baseService, /pilot_endpoint\.blind_self_check\.locked/);
  assert.match(baseService, /interpretationFingerprintLockedBeforePeerExposure: true/);
  assert.match(baseService, /initialRatingPreserved: true/);
  assert.match(baseService, /peer_scores_visible/);
  assert.match(baseService, /model_judgments_visible/);
  assert.match(baseService, /cause_codes_visible/);
  assert.match(approvedService, /self_check_selection_too_late/);
  assert.match(approvedService, /self_check_selection_required_before_rating/);

  assert.match(formModule, /blind_initial_with_interpretation_fingerprint/);
  assert.match(formModule, /initialState: "unset"/);
  assert.match(formModule, /blind_self_check/);
  assert.match(formModule, /initial_interpretation_cause_code/);
  assert.match(formModule, /numericScoresVisible: false/);
  assert.match(formModule, /otherAdjudicatorCodeVisible: false/);
  assert.match(formModule, /researchStartAuthorized: false/);

  return {
    status: "pass",
    approved_endpoint_contract_id: approved.contract_id,
    self_check_records: selfCheck.owner_decision.self_check_records,
    interpretation_pairs: causeCoding.owner_decision.paired_fingerprints,
    interpretation_initial_codes: causeCoding.owner_decision.initial_cause_code_records,
    position_first: analysis.complete_structure.position_is_primary_aggregation_unit,
    authorization_false: true,
    files_checked: Object.values(paths).length,
  };
}

function assertAllFalse(value, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  for (const [key, fieldValue] of Object.entries(value)) {
    assert.equal(fieldValue, false, `${label}.${key} must remain false`);
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await verifyPilotEndpointImplementation();
  console.log(JSON.stringify(report, null, 2));
}
