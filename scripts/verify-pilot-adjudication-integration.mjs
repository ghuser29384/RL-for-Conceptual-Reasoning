import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import {
  buildPilotFinalLabelSnapshot,
  generatePilotAdjudicationCases,
  validatePilotAdjudicationControl,
  validatePilotAdjudicationResolutions,
} from "./pilot-adjudication.mjs";
import {
  sanitizePilotAdjudicationCaseSummary,
  sanitizePilotAdjudicationResolutionSummary,
  sanitizePilotFinalLabelSnapshotSummary,
} from "./pilot-adjudication-public.mjs";
import { hashPilotRatingDataset } from "./pilot-rating-ingestion.mjs";

const root = resolve(import.meta.dirname, "..");
const ops = resolve(root, "ops/next-steps-2026-07-23");

export async function verifyPilotAdjudicationIntegration() {
  const [contract, contractBrief, dataset, policy, control] = await Promise.all([
    readJson(resolve(ops, "pilot-adjudication-contract.json")),
    readFile(resolve(ops, "pilot-adjudication-contract.md"), "utf8"),
    readJson(resolve(root, "test/fixtures/pilot-rating-analysis-synthetic.json")),
    readJson(
      resolve(
        root,
        "test/fixtures/pilot-analysis-policy-adjudication-synthetic.json",
      ),
    ),
    readJson(resolve(root, "test/fixtures/pilot-adjudication-control-synthetic.json")),
  ]);

  verifyContract(contract, contractBrief);

  const controlReport = validatePilotAdjudicationControl(dataset, policy, control);
  assert.equal(controlReport.status, "pass", controlReport.errors.join("\n"));
  const caseSet = generatePilotAdjudicationCases(dataset, policy, control);
  assert.equal(caseSet.case_count, 2);
  assert.deepEqual(Object.values(caseSet.assignment_counts).sort(), [1, 1]);
  assert.match(caseSet.case_set_commitment_sha256, /^[a-f0-9]{64}$/);
  const caseSummary = sanitizePilotAdjudicationCaseSummary(caseSet);
  assert.equal(caseSummary.counts.case_count, 2);
  assert.equal(caseSummary.counts.maximum_assignment_imbalance, 0);
  assert.equal(caseSummary.distribution_authorized, false);
  assert.equal(caseSummary.adjudication_work_authorized, false);
  assert.equal(caseSummary.rerating_work_authorized, false);

  const reratedDataset = addSyntheticRerating(dataset);
  const resolutionReport = validatePilotAdjudicationResolutions(
    caseSet,
    reratedDataset,
    buildSyntheticResolutionInput(caseSet, reratedDataset),
  );
  assert.equal(resolutionReport.status, "pass", resolutionReport.errors.join("\n"));
  assert.equal(resolutionReport.accepted_closure_count, 2);
  assert.equal(resolutionReport.unresolved_case_count, 1);
  assert.equal(resolutionReport.open_case_count, 0);
  assert.equal(resolutionReport.accepted_adjudication_unit_events.length, 2);
  const resolutionSummary = sanitizePilotAdjudicationResolutionSummary(
    resolutionReport,
  );
  assert.equal(resolutionSummary.counts.required_case_count, 2);
  assert.equal(resolutionSummary.counts.unresolved_case_count, 1);

  const draft = buildPilotFinalLabelSnapshot(
    caseSet,
    reratedDataset,
    resolutionReport,
    buildSyntheticSnapshotInput(caseSet, reratedDataset, resolutionReport, null),
  );
  assert.match(draft.snapshot_body_sha256, /^[a-f0-9]{64}$/);
  const finalSnapshot = buildPilotFinalLabelSnapshot(
    caseSet,
    reratedDataset,
    resolutionReport,
    buildSyntheticSnapshotInput(
      caseSet,
      reratedDataset,
      resolutionReport,
      draft.snapshot_body_sha256,
    ),
  );
  assert.equal(finalSnapshot.status, "pass", finalSnapshot.errors.join("\n"));
  assert.equal(finalSnapshot.body.consensus_score_created, false);
  assert.equal(finalSnapshot.body.original_initial_ratings_preserved, true);
  assert.equal(finalSnapshot.body.unresolved_cases, 1);
  assert.equal(finalSnapshot.signoffs.length, 2);
  assert.equal(finalSnapshot.accepted_signoff_unit_events.length, 2);
  const snapshotSummary = sanitizePilotFinalLabelSnapshotSummary(finalSnapshot);
  assert.equal(snapshotSummary.consensus_score_created, false);
  assert.equal(snapshotSummary.counts.accepted_adjudicator_signoff_count, 2);

  for (const summary of [caseSummary, resolutionSummary, snapshotSummary]) {
    const text = JSON.stringify(summary);
    for (const forbidden of [
      '"adjudicator_id":',
      '"rater_id":',
      '"position_id":',
      '"critique_id":',
      '"rating_id":',
      '"case_id":',
      '"resolution_id":',
      '"signoff_id":',
      '"object_level_considerations":',
      "ADJ_SYN_",
      "C-SYN-03",
      "RT-SYN-009",
    ]) {
      assert.equal(text.includes(forbidden), false, `Public output leaked ${forbidden}`);
    }
  }

  return {
    status: "pass",
    synthetic_case_count: caseSet.case_count,
    synthetic_case_set_sha256: caseSet.case_set_commitment_sha256,
    synthetic_resolution_set_sha256:
      resolutionReport.resolution_set_commitment_sha256,
    synthetic_unresolved_case_count: resolutionReport.unresolved_case_count,
    synthetic_final_snapshot_sha256: finalSnapshot.final_snapshot_sha256,
    synthetic_candidate_adjudication_units:
      resolutionReport.accepted_adjudication_unit_events.length +
      finalSnapshot.accepted_signoff_unit_events.length,
    controlled_case_generation_authorized: false,
    controlled_resolution_authorized: false,
    controlled_snapshot_authorized: false,
    payment_authorized: false,
    publication_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
  };
}

function verifyContract(contract, brief) {
  assert.equal(
    contract.contract_id,
    "metaphilosophy-pilot-adjudication-v1-2026-08-01",
  );
  assert.equal(contract.contract_version, 1);
  assert.equal(
    contract.programme_id,
    "metaphilosophy-48-critique-pilot-v1-2026-07-30",
  );
  assert.equal(
    contract.status,
    "implementation_template_non_binding_no_real_cases_resolutions_or_signoffs",
  );
  assert.equal(
    contract.source_boundary.primary_reference,
    "A dataset of rated conceptual arguments",
  );
  assert.equal(
    contract.source_boundary.reference_role,
    "methodological_prior_art_and_external_benchmark",
  );
  assert.equal(contract.source_boundary.direct_lmca_row_reuse, false);
  assert.equal(contract.case_generation.operational_policy_required, true);
  assert.equal(contract.case_generation.diagnostic_only_policy_may_open_cases, false);
  assert.equal(contract.adjudicator_assignment.required_adjudicators, 2);
  assert.equal(contract.adjudicator_assignment.role_separation_from_core_raters, true);
  assert.equal(
    contract.adjudicator_assignment.maximum_assignment_count_imbalance,
    1,
  );
  assert.equal(
    contract.adjudicator_assignment.no_eligible_adjudicator_rule,
    "fail_closed_and_generate_no_assignment_for_the_case",
  );
  assert.deepEqual(
    [...contract.resolution_records.dispositions].sort(),
    ["closed_after_rerating", "closed_unresolved", "closed_without_rerating"],
  );
  assert.equal(
    contract.resolution_records.quality_control_operator_must_differ_from_adjudicator,
    true,
  );
  assert.ok(contract.resolution_records.prohibited_fields.includes("consensus_scores"));
  assert.ok(contract.resolution_records.prohibited_fields.includes("forced_convergence"));
  assert.equal(
    contract.rerating_boundary.adjudicator_may_directly_create_or_edit_rating,
    false,
  );
  assert.equal(
    contract.final_label_snapshot.semantics,
    "distribution_preserving_initial_and_latest_accepted_ratings_no_imposed_consensus_score",
  );
  assert.equal(contract.final_label_snapshot.consensus_score_created, false);
  assert.equal(contract.final_label_snapshot.required_signoffs, 2);
  assert.equal(contract.honoraria_boundary.adjudication_reserve_usd, 100);
  assert.equal(
    contract.honoraria_boundary.event_generation_authorizes_payment,
    false,
  );
  for (const field of [
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
  ]) {
    assert.equal(contract.governance[field], false, `governance.${field} must remain false`);
  }
  assert.match(brief, /diagnostic policy has zero approved routes/i);
  assert.match(brief, /original ratings are always preserved/i);
  assert.match(brief, /closed unresolved/i);
  assert.match(brief, /does not create a synthetic consensus score/i);
  assert.match(brief, /Generating a case packet does not authorize distributing it/i);
  assert.match(brief, /do not authorize payment/i);
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
      overall: 0.34,
    },
    overall_rationale:
      "Synthetic object-level rerating after considering an alternative interpretation and verification result.",
    confidence: 0.65,
    time_spent_seconds: 610,
    insufficient_context: false,
    verification_status: "verified",
    item_integrity_flags: [],
    accepted: true,
    locked_at: "2026-08-05T00:00:00.000Z",
    operator_assigned: true,
    object_level_revision_reason:
      "The rater independently accepted an object-level interpretation and verification consideration overlooked initially.",
  });
  return value;
}

function buildSyntheticResolutionInput(caseSet, dataset) {
  const reratingCase = caseSet.cases.find(
    (entry) => entry.critique_id === "C-SYN-03",
  );
  const unresolvedCase = caseSet.cases.find(
    (entry) => entry.critique_id === "C-SYN-04",
  );
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
      "private_controlled_storage_confirmed",
    ]),
    require_all_cases_closed: true,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    records: [
      makeResolution(
        reratingCase,
        "AR_SYN_C3_V1",
        "closed_after_rerating",
        "2026-08-06T00:00:00.000Z",
        ["RT-SYN-009"],
        false,
      ),
      makeResolution(
        unresolvedCase,
        "AR_SYN_C4_V1",
        "closed_unresolved",
        "2026-08-06T00:30:00.000Z",
        [],
        true,
      ),
    ],
  };
}

function makeResolution(
  caseEntry,
  resolutionId,
  disposition,
  reviewedAt,
  reratingIds,
  unresolved,
) {
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
        : "The alternative interpretation and verification result were reviewed on object-level grounds.",
    ],
    interpretation_notes: unresolved
      ? "Both plausible readings remain preserved."
      : "The rater independently accepted the revised reading.",
    context_notes: "No additional protected context was introduced.",
    verification_notes: unresolved
      ? null
      : "The previously unresolved claim was verified before rerating.",
    route_dispositions: caseEntry.operative_routes.map((entry) => ({
      route: entry.route,
      status: unresolved ? "unresolved_preserved" : "resolved",
      rationale: unresolved
        ? `Synthetic review preserves ${entry.route} as unresolved.`
        : `Synthetic object-level review resolves ${entry.route} without imposing a score.`,
    })),
    rerating_rating_ids: reratingIds,
    residual_disagreement_summary: unresolved
      ? "The final snapshot must retain this ambiguity and uncertainty rather than invent consensus."
      : null,
    minority_or_alternative_interpretations_preserved: true,
    no_score_imposition_acknowledged: true,
    no_convergence_pressure_acknowledged: true,
    quality_control: {
      decision: "accepted_closure",
      operator_id: "OPS_SYN_QC",
      reason:
        "The synthetic case record is complete, assigned, route-complete, and non-coercive.",
      decided_at: unresolved
        ? "2026-08-06T01:30:00.000Z"
        : "2026-08-06T01:00:00.000Z",
    },
    payment_authorized: false,
    phase_2_authorized: false,
  };
}

function buildSyntheticSnapshotInput(
  caseSet,
  dataset,
  resolutionReport,
  snapshotBodySha256,
) {
  const input = {
    snapshot_request_id: "FLS_SYN_1",
    input_version: 1,
    programme_id: dataset.programme_id,
    data_class: "synthetic_test_fixture",
    mode: "simulation",
    synthetic_only: true,
    created_at: "2026-08-07T00:00:00.000Z",
    case_set_commitment_sha256: caseSet.case_set_commitment_sha256,
    resolution_set_commitment_sha256:
      resolutionReport.resolution_set_commitment_sha256,
    dataset_sha256: hashPilotRatingDataset(dataset),
    approved_quality_control_operator_ids: ["OPS_SYN_QC"],
    authorization: falseAuthorization([
      "q_006b_approved",
      "q_006c_approved",
      "all_required_cases_closed_or_documented_unresolved",
      "final_snapshot_generation_authorized",
      "final_snapshot_signoff_authorized",
      "private_controlled_storage_confirmed",
    ]),
    publication_authorized: false,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    signoffs: [],
  };
  if (!snapshotBodySha256) return input;
  const roster = [
    ...new Set(caseSet.cases.map((entry) => entry.assigned_adjudicator_id)),
  ].sort();
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
      reason:
        "Synthetic sign-off is complete and bound to the exact snapshot body.",
      decided_at: `2026-08-07T0${index + 3}:00:00.000Z`,
    },
  }));
  return input;
}

function falseAuthorization(fields) {
  return {
    ...Object.fromEntries(fields.map((field) => [field, false])),
    approval_record_ids: [],
    approved_at: null,
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await verifyPilotAdjudicationIntegration();
  console.log(JSON.stringify(report, null, 2));
}
