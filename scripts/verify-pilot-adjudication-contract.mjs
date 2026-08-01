import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import {
  buildPilotFinalLabelSnapshot,
  generatePilotAdjudicationCases,
  sanitizePilotAdjudicationCaseSummary,
  sanitizePilotAdjudicationResolutionSummary,
  sanitizePilotFinalLabelSnapshotSummary,
  validatePilotAdjudicationControl,
  validatePilotAdjudicationResolutions,
} from "./pilot-adjudication.mjs";
import { hashPilotRatingDataset } from "./pilot-rating-ingestion.mjs";

const REQUIRED_GOVERNANCE_FALSE_FIELDS = Object.freeze([
  "binding_effect",
  "q_006a_approved",
  "q_006b_approved",
  "q_006c_approved",
  "operative_policy_approved_for_real_data",
  "case_generation_authorized",
  "case_distribution_authorized",
  "adjudication_work_authorized",
  "rerating_work_authorized",
  "resolution_acceptance_authorized",
  "final_snapshot_generation_authorized",
  "final_snapshot_signoff_authorized",
  "payment_authorized",
  "publication_authorized",
  "funding_submission_authorized",
  "phase_2_authorized",
]);

export async function validatePilotAdjudicationContract(contract, dataset, policy, control) {
  const errors = [];
  const governance = objectOrEmpty(contract?.governance);
  const sourceBoundary = objectOrEmpty(contract?.source_boundary);
  const caseGeneration = objectOrEmpty(contract?.case_generation);
  const assignment = objectOrEmpty(contract?.adjudicator_assignment);
  const resolutionRecords = objectOrEmpty(contract?.resolution_records);
  const reratingBoundary = objectOrEmpty(contract?.rerating_boundary);
  const snapshotContract = objectOrEmpty(contract?.final_label_snapshot);
  const honoraria = objectOrEmpty(contract?.honoraria_boundary);
  const authorization = objectOrEmpty(contract?.authorization);
  const privacy = objectOrEmpty(contract?.privacy);

  if (contract?.contract_id !== "metaphilosophy-pilot-adjudication-v1-2026-08-01") {
    errors.push("contract_id must identify the 2026-08-01 pilot adjudication contract.");
  }
  if (contract?.contract_version !== 1) errors.push("contract_version must equal 1.");
  if (contract?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (contract?.status !== "implementation_template_non_binding_no_real_cases_resolutions_or_signoffs") {
    errors.push("status must keep the contract non-binding and free of real adjudication records.");
  }

  if (sourceBoundary.primary_reference !== "A dataset of rated conceptual arguments") {
    errors.push("source_boundary must identify A dataset of rated conceptual arguments.");
  }
  if (sourceBoundary.reference_role !== "methodological_prior_art_and_external_benchmark") {
    errors.push("LMCA must remain methodological prior art and an external benchmark.");
  }
  if (sourceBoundary.direct_lmca_row_reuse !== false) errors.push("Direct LMCA row reuse must remain false.");
  const sourceDerived = normalizeStrings(sourceBoundary.source_derived_elements).join(" ").toLowerCase();
  for (const phrase of ["blind", "object-level", "interpretation", "original ratings", "residual disagreements"]) {
    if (!sourceDerived.includes(phrase)) errors.push(`source_derived_elements must include ${phrase}.`);
  }

  if (caseGeneration.input_snapshot !== "accepted_initial_ratings_only") errors.push("Cases must derive from accepted initial ratings only.");
  if (caseGeneration.operational_policy_required !== true || caseGeneration.diagnostic_only_policy_may_open_cases !== false) {
    errors.push("Case generation must require an operational policy and reject diagnostic-only routes.");
  }
  if (caseGeneration.one_case_per_position_critique_pair !== true || caseGeneration.case_opening_unit !== "critique") {
    errors.push("Case generation must create one critique-level case per routed position-critique pair.");
  }
  if (!sameStringSet(caseGeneration.operative_route_ids, [
    "insufficient_context",
    "item_integrity",
    "unresolved_verification",
    "low_clarity",
    "overall_gap",
    "strength_times_centrality_gap",
    "correctness_gap",
    "clarity_gap",
  ])) {
    errors.push("case_generation.operative_route_ids must contain the eight supported routes exactly.");
  }

  if (assignment.required_adjudicators !== 2 || assignment.role_separation_from_core_raters !== true) {
    errors.push("Assignment must require two dedicated adjudicators separated from core raters.");
  }
  if (assignment.maximum_assignment_count_imbalance !== 1) errors.push("Maximum adjudicator assignment imbalance must equal one.");
  if (assignment.no_eligible_adjudicator_rule !== "fail_closed_and_generate_no_assignment_for_the_case") {
    errors.push("No-eligible-adjudicator behavior must fail closed.");
  }

  if (resolutionRecords.record_model !== "append_only_versioned_until_first_accepted_closure") {
    errors.push("Resolution records must remain append-only until the first accepted closure.");
  }
  if (!sameStringSet(resolutionRecords.dispositions, [
    "closed_without_rerating",
    "closed_after_rerating",
    "closed_unresolved",
  ])) {
    errors.push("Resolution dispositions must contain the three supported closure modes exactly.");
  }
  if (!sameStringSet(resolutionRecords.quality_control_decisions, ["accepted_closure", "rejected_record"])) {
    errors.push("Resolution quality-control decisions must remain accepted_closure and rejected_record.");
  }
  if (resolutionRecords.quality_control_operator_must_differ_from_adjudicator !== true) {
    errors.push("Resolution quality control must remain independent from the adjudicator.");
  }
  const prohibited = normalizeStrings(resolutionRecords.prohibited_fields);
  for (const field of ["final_scores", "consensus_scores", "imposed_score", "winning_rater", "majority_vote", "forced_convergence"]) {
    if (!prohibited.includes(field)) errors.push(`resolution_records.prohibited_fields must include ${field}.`);
  }

  if (reratingBoundary.adjudicator_may_directly_create_or_edit_rating !== false) {
    errors.push("Adjudicators must not directly create or edit ratings.");
  }
  if (reratingBoundary.all_accepted_case_reratings_up_to_resolution_time_must_be_referenced !== true) {
    errors.push("Every accepted case rerating up to resolution time must be referenced.");
  }
  if (reratingBoundary.operational_correction_is_not_object_level_rerating !== true) {
    errors.push("Operational correction must remain distinct from object-level rerating.");
  }

  if (snapshotContract.semantics !== "distribution_preserving_initial_and_latest_accepted_ratings_no_imposed_consensus_score") {
    errors.push("Final snapshot must preserve rating distributions without imposing consensus.");
  }
  if (snapshotContract.consensus_score_created !== false || snapshotContract.initial_rating_overwrite_or_deletion_prohibited !== true) {
    errors.push("Snapshot must not create consensus or permit initial-rating deletion.");
  }
  if (snapshotContract.required_signoffs !== 2) errors.push("Final snapshot must require two adjudicator sign-offs.");
  if (snapshotContract.signoff_quality_control_operator_must_differ_from_adjudicator !== true) {
    errors.push("Snapshot sign-off quality control must remain independent.");
  }

  if (honoraria.candidate_units_per_event !== 1 || honoraria.event_generation_authorizes_payment !== false) {
    errors.push("Candidate adjudication unit events must equal one unit and never authorize payment.");
  }
  if (honoraria.adjudication_reserve_usd !== 100 || honoraria.unused_balance_remains_unspent !== true) {
    errors.push("The adjudication reserve must remain USD 100 with unused funds unspent.");
  }

  if (authorization.synthetic_simulation?.allowed !== true || authorization.synthetic_simulation?.synthetic_data_only !== true) {
    errors.push("Synthetic adjudication simulation must remain allowed only for synthetic data.");
  }
  if (authorization.controlled_case_generation?.currently_authorized !== false) {
    errors.push("Controlled case generation must remain unauthorized.");
  }
  if (authorization.controlled_resolution?.currently_authorized !== false) {
    errors.push("Controlled case resolution must remain unauthorized.");
  }
  if (authorization.controlled_snapshot?.currently_authorized !== false) {
    errors.push("Controlled final snapshot must remain unauthorized.");
  }
  if (authorization.controlled_output?.outside_repository !== true || authorization.controlled_output?.file_mode !== "0600") {
    errors.push("Controlled adjudication output must remain outside the repository with mode 0600.");
  }

  if (privacy.case_packets !== "private_controlled_record_only" || privacy.resolution_records !== "private_controlled_record_only" || privacy.final_snapshot_and_signoffs !== "private_controlled_record_only") {
    errors.push("Case, resolution, snapshot, and sign-off records must remain private controlled records.");
  }
  const publicExclusions = normalizeStrings(privacy.public_summaries_must_exclude).join(" ").toLowerCase();
  for (const phrase of ["adjudicator", "position", "rating", "scores", "individual case-packet", "controlled case"]) {
    if (!publicExclusions.includes(phrase)) errors.push(`privacy.public_summaries_must_exclude must include ${phrase}.`);
  }

  for (const field of REQUIRED_GOVERNANCE_FALSE_FIELDS) {
    if (governance[field] !== false) errors.push(`governance.${field} must remain false.`);
  }

  const controlReport = validatePilotAdjudicationControl(dataset, policy, control);
  if (controlReport.status !== "pass") errors.push(...controlReport.errors.map((error) => `Synthetic control: ${error}`));

  let caseSet = null;
  let resolutionReport = null;
  let finalSnapshot = null;
  if (controlReport.status === "pass") {
    try {
      caseSet = generatePilotAdjudicationCases(dataset, policy, control);
      assert.equal(caseSet.case_count, 2);
      assert.deepEqual(Object.values(caseSet.assignment_counts).sort(), [1, 1]);
      sanitizePilotAdjudicationCaseSummary(caseSet);

      const reratedDataset = addSyntheticRerating(dataset);
      const resolutionInput = buildSyntheticResolutionInput(caseSet, reratedDataset);
      resolutionReport = validatePilotAdjudicationResolutions(caseSet, reratedDataset, resolutionInput);
      if (resolutionReport.status !== "pass") errors.push(...resolutionReport.errors.map((error) => `Synthetic resolution: ${error}`));
      sanitizePilotAdjudicationResolutionSummary(resolutionReport);

      const draftInput = buildSyntheticSnapshotInput(caseSet, reratedDataset, resolutionReport, null);
      const draft = buildPilotFinalLabelSnapshot(caseSet, reratedDataset, resolutionReport, draftInput);
      const finalInput = buildSyntheticSnapshotInput(caseSet, reratedDataset, resolutionReport, draft.snapshot_body_sha256);
      finalSnapshot = buildPilotFinalLabelSnapshot(caseSet, reratedDataset, resolutionReport, finalInput);
      if (finalSnapshot.status !== "pass") errors.push(...finalSnapshot.errors.map((error) => `Synthetic snapshot: ${error}`));
      sanitizePilotFinalLabelSnapshotSummary(finalSnapshot);
    } catch (error) {
      errors.push(`Synthetic adjudication workflow failed: ${error.message}`);
    }
  }

  return {
    status: errors.length ? "fail" : "pass",
    contract_id: contract?.contract_id ?? null,
    synthetic_case_count: caseSet?.case_count ?? null,
    synthetic_case_set_sha256: caseSet?.case_set_commitment_sha256 ?? null,
    synthetic_resolution_set_sha256: resolutionReport?.resolution_set_commitment_sha256 ?? null,
    synthetic_unresolved_case_count: resolutionReport?.unresolved_case_count ?? null,
    synthetic_final_snapshot_sha256: finalSnapshot?.final_snapshot_sha256 ?? null,
    synthetic_candidate_adjudication_units:
      (resolutionReport?.accepted_adjudication_unit_events?.length ?? 0) +
      (finalSnapshot?.accepted_signoff_unit_events?.length ?? 0),
    controlled_case_generation_authorized: governance.case_generation_authorized ?? null,
    controlled_resolution_authorized: governance.resolution_acceptance_authorized ?? null,
    controlled_snapshot_authorized: governance.final_snapshot_generation_authorized ?? null,
    payment_authorized: governance.payment_authorized ?? null,
    phase_2_authorized: governance.phase_2_authorized ?? null,
    errors,
  };
}

function addSyntheticRerating(dataset) {
  const value = structuredClone(dataset);
  value.ratings.push({
    rating_id: "RT-SYN-009",
    position_id: "P-SYN-01",
    critique_id: "C-SYN-03",
    rater_id: "R-SYN-A",
    stage: "rerating",
    version: 2,
    predecessor_rating_id: "RT-SYN-005",
    rubric_version: "rubric-v2-seven-dimensional",
    scores: {
      centrality: 0.62,
      strength: 0.42,
      correctness: 0.65,
      clarity: 0.65,
      dead_weight: 0.25,
      single_issue: 0.7,
      overall: 0.34
    },
    overall_rationale: "Synthetic object-level rerating after considering an alternative interpretation and verification result.",
    confidence: 0.65,
    time_spent_seconds: 610,
    insufficient_context: false,
    verification_status: "verified",
    item_integrity_flags: [],
    accepted: true,
    locked_at: "2026-08-05T00:00:00.000Z",
    operator_assigned: true,
    object_level_revision_reason: "The rater independently accepted an object-level interpretation and verification consideration overlooked initially."
  });
  return value;
}

function buildSyntheticResolutionInput(caseSet, dataset) {
  const reratingCase = caseSet.cases.find((entry) => entry.critique_id === "C-SYN-03");
  const unresolvedCase = caseSet.cases.find((entry) => entry.critique_id === "C-SYN-04");
  return {
    resolution_batch_id: "ARB_SYN_BATCH_1",
    input_version: 1,
    programme_id: dataset.programme_id,
    data_class: "synthetic_test_fixture",
    mode: "simulation",
    synthetic_only: true,
    resolved_at: "2026-08-06T03:00:00.000Z",
    case_set_commitment_sha256: caseSet.case_set_commitment_sha256,
    dataset_sha256: hashPilotRatingDataset(dataset),
    approved_quality_control_operator_ids: ["OPS_SYN_QC"],
    authorization: falseAuthorization([
      "q_006b_approved",
      "q_006c_approved",
      "analysis_policy_frozen",
      "adjudication_cases_distributed",
      "adjudication_work_authorized",
      "resolution_quality_control_complete",
      "adjudication_resolution_acceptance_authorized",
      "private_controlled_storage_confirmed"
    ]),
    require_all_cases_closed: true,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    records: [
      makeResolution(reratingCase, "AR_SYN_C3_V1", "closed_after_rerating", "2026-08-06T00:00:00.000Z", ["RT-SYN-009"], false),
      makeResolution(unresolvedCase, "AR_SYN_C4_V1", "closed_unresolved", "2026-08-06T00:30:00.000Z", [], true)
    ]
  };
}

function makeResolution(caseEntry, resolutionId, disposition, reviewedAt, reratingIds, unresolved) {
  return {
    resolution_id: resolutionId,
    case_id: caseEntry.case_id,
    case_packet_sha256: caseEntry.case_packet_sha256,
    resolution_version: 1,
    predecessor_resolution_id: null,
    correction_reason: null,
    adjudicator_id: caseEntry.assigned_adjudicator_id,
    disposition,
    reviewed_at: reviewedAt,
    object_level_considerations: [
      unresolved
        ? "The residual ambiguity is genuine and should remain visible."
        : "The alternative interpretation and verification result were reviewed on object-level grounds."
    ],
    interpretation_notes: unresolved ? "Both plausible readings remain preserved." : "The rater independently accepted the revised reading.",
    context_notes: "No additional protected context was introduced.",
    verification_notes: unresolved ? null : "The previously unresolved claim was verified before rerating.",
    route_dispositions: caseEntry.operative_routes.map((entry) => ({
      route: entry.route,
      status: unresolved ? "unresolved_preserved" : "resolved",
      rationale: unresolved
        ? `Synthetic review preserves ${entry.route} as unresolved.`
        : `Synthetic object-level review resolves ${entry.route} without imposing a score.`
    })),
    rerating_rating_ids: reratingIds,
    residual_disagreement_summary: unresolved
      ? "The final snapshot must retain this ambiguity and its uncertainty rather than invent consensus."
      : null,
    minority_or_alternative_interpretations_preserved: true,
    no_score_imposition_acknowledged: true,
    no_convergence_pressure_acknowledged: true,
    quality_control: {
      decision: "accepted_closure",
      operator_id: "OPS_SYN_QC",
      reason: "The synthetic case record is complete, assigned, route-complete, and non-coercive.",
      decided_at: unresolved ? "2026-08-06T01:30:00.000Z" : "2026-08-06T01:00:00.000Z"
    },
    payment_authorized: false,
    phase_2_authorized: false
  };
}

function buildSyntheticSnapshotInput(caseSet, dataset, resolutionReport, snapshotBodySha256) {
  const input = {
    snapshot_request_id: "FLS_SYN_1",
    input_version: 1,
    programme_id: dataset.programme_id,
    data_class: "synthetic_test_fixture",
    mode: "simulation",
    synthetic_only: true,
    created_at: "2026-08-07T00:00:00.000Z",
    case_set_commitment_sha256: caseSet.case_set_commitment_sha256,
    resolution_set_commitment_sha256: resolutionReport.resolution_set_commitment_sha256,
    dataset_sha256: hashPilotRatingDataset(dataset),
    approved_quality_control_operator_ids: ["OPS_SYN_QC"],
    authorization: falseAuthorization([
      "q_006b_approved",
      "q_006c_approved",
      "all_required_cases_closed_or_documented_unresolved",
      "final_snapshot_generation_authorized",
      "final_snapshot_signoff_authorized",
      "private_controlled_storage_confirmed"
    ]),
    publication_authorized: false,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    signoffs: []
  };
  if (!snapshotBodySha256) return input;
  const roster = [...new Set(caseSet.cases.map((entry) => entry.assigned_adjudicator_id))].sort();
  input.signoffs = roster.map((adjudicatorId, index) => ({
    signoff_id: `FS_SYN_${index + 1}`,
    adjudicator_id: adjudicatorId,
    snapshot_body_sha256: snapshotBodySha256,
    signed_at: `2026-08-07T0${index + 1}:00:00.000Z`,
    completeness_confirmed: true,
    original_initial_ratings_preserved_confirmed: true,
    residual_disagreement_preserved_confirmed: true,
    no_consensus_score_imposed_confirmed: true,
    participation_is_not_substantive_endorsement_confirmed: true,
    quality_control: {
      decision: "accepted_signoff",
      operator_id: "OPS_SYN_QC",
      reason: "Synthetic sign-off is complete and bound to the exact snapshot body.",
      decided_at: `2026-08-07T0${index + 3}:00:00.000Z`
    }
  }));
  return input;
}

function falseAuthorization(fields) {
  return {
    ...Object.fromEntries(fields.map((field) => [field, false])),
    approval_record_ids: [],
    approved_at: null
  };
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeStrings(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean) : [];
}

function sameStringSet(left, right) {
  const leftSet = new Set(normalizeStrings(left));
  const rightSet = new Set(normalizeStrings(right));
  return leftSet.size === rightSet.size && [...leftSet].every((entry) => rightSet.has(entry));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function readAndValidatePilotAdjudicationContract(contractPath, datasetPath, policyPath, controlPath) {
  const [contract, dataset, policy, control] = await Promise.all([
    readJson(contractPath),
    readJson(datasetPath),
    readJson(policyPath),
    readJson(controlPath)
  ]);
  return validatePilotAdjudicationContract(contract, dataset, policy, control);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const report = await readAndValidatePilotAdjudicationContract(
    resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/pilot-adjudication-contract.json`),
    resolve(process.argv[3] ?? `${root}/test/fixtures/pilot-rating-analysis-synthetic.json`),
    resolve(process.argv[4] ?? `${root}/test/fixtures/pilot-analysis-policy-adjudication-synthetic.json`),
    resolve(process.argv[5] ?? `${root}/test/fixtures/pilot-adjudication-control-synthetic.json`)
  );
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
