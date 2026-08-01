import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  PilotAdjudicationError,
  buildPilotFinalLabelSnapshot,
  generatePilotAdjudicationCases,
  hashPilotAdjudicationPolicy,
  hashPilotInitialRatingSnapshot,
  validatePilotAdjudicationControl,
  validatePilotAdjudicationResolutions,
} from "../scripts/pilot-adjudication.mjs";
import {
  assertPublicAdjudicationSummary,
  sanitizePilotAdjudicationCaseSummary,
  sanitizePilotAdjudicationResolutionSummary,
  sanitizePilotFinalLabelSnapshotSummary,
} from "../scripts/pilot-adjudication-public.mjs";
import { hashPilotRatingDataset } from "../scripts/pilot-rating-ingestion.mjs";

const root = resolve(import.meta.dirname, "..");
const datasetPath = resolve(root, "test/fixtures/pilot-rating-analysis-synthetic.json");
const operationalPolicyPath = resolve(root, "test/fixtures/pilot-analysis-policy-adjudication-synthetic.json");
const diagnosticPolicyPath = resolve(root, "ops/next-steps-2026-07-23/pilot-analysis-policy-template.json");
const controlPath = resolve(root, "test/fixtures/pilot-adjudication-control-synthetic.json");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadInputs() {
  return Promise.all([
    readJson(datasetPath),
    readJson(operationalPolicyPath),
    readJson(controlPath),
  ]);
}

function addAcceptedObjectLevelRerating(dataset) {
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
      "Synthetic object-level rerating after considering the alternative interpretation and verification record.",
    confidence: 0.65,
    time_spent_seconds: 610,
    insufficient_context: false,
    verification_status: "verified",
    item_integrity_flags: [],
    accepted: true,
    locked_at: "2026-08-05T00:00:00.000Z",
    operator_assigned: true,
    object_level_revision_reason:
      "The rater accepted an object-level interpretation and verification consideration that had been overlooked initially.",
  });
  return value;
}

function makeResolutionInput(caseSet, dataset) {
  const reratingCase = caseSet.cases.find(
    (entry) => entry.critique_id === "C-SYN-03",
  );
  const unresolvedCase = caseSet.cases.find(
    (entry) => entry.critique_id === "C-SYN-04",
  );
  assert.ok(reratingCase);
  assert.ok(unresolvedCase);

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
    authorization: {
      q_006b_approved: false,
      q_006c_approved: false,
      analysis_policy_frozen: false,
      adjudication_cases_distributed: false,
      adjudication_work_authorized: false,
      resolution_quality_control_complete: false,
      adjudication_resolution_acceptance_authorized: false,
      private_controlled_storage_confirmed: false,
      approval_record_ids: [],
      approved_at: null,
    },
    require_all_cases_closed: true,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    records: [
      {
        resolution_id: "AR_SYN_C3_V1",
        case_id: reratingCase.case_id,
        case_packet_sha256: reratingCase.case_packet_sha256,
        resolution_version: 1,
        predecessor_resolution_id: null,
        correction_reason: null,
        adjudicator_id: reratingCase.assigned_adjudicator_id,
        disposition: "closed_after_rerating",
        reviewed_at: "2026-08-06T00:00:00.000Z",
        object_level_considerations: [
          "The low-clarity reading and the alternative interpretation were compared directly.",
          "The correctness-sensitive claim was checked before the rater reconsidered the score.",
        ],
        interpretation_notes:
          "The revised rating reflects an interpretation the rater independently accepted on object-level grounds.",
        context_notes:
          "No additional protected context was introduced beyond the frozen case record.",
        verification_notes:
          "The previously unresolved claim was recorded as verified in the accepted rerating.",
        route_dispositions: reratingCase.operative_routes.map((entry) => ({
          route: entry.route,
          status: "resolved",
          rationale: `Synthetic object-level review resolved ${entry.route} without imposing a score.`,
        })),
        rerating_rating_ids: ["RT-SYN-009"],
        residual_disagreement_summary: null,
        minority_or_alternative_interpretations_preserved: true,
        no_score_imposition_acknowledged: true,
        no_convergence_pressure_acknowledged: true,
        quality_control: {
          decision: "accepted_closure",
          operator_id: "OPS_SYN_QC",
          reason:
            "The case record is complete, packet-bound, route-complete, and linked to the accepted append-only rerating.",
          decided_at: "2026-08-06T01:00:00.000Z",
        },
        payment_authorized: false,
        phase_2_authorized: false,
      },
      {
        resolution_id: "AR_SYN_C4_V1",
        case_id: unresolvedCase.case_id,
        case_packet_sha256: unresolvedCase.case_packet_sha256,
        resolution_version: 1,
        predecessor_resolution_id: null,
        correction_reason: null,
        adjudicator_id: unresolvedCase.assigned_adjudicator_id,
        disposition: "closed_unresolved",
        reviewed_at: "2026-08-06T00:30:00.000Z",
        object_level_considerations: [
          "The ambiguity flag identifies a genuine residual item-interpretation issue rather than a clerical defect.",
        ],
        interpretation_notes: "Both plausible readings remain in the controlled record.",
        context_notes:
          "The frozen item policy does not justify silently choosing one reading.",
        verification_notes: null,
        route_dispositions: unresolvedCase.operative_routes.map((entry) => ({
          route: entry.route,
          status: "unresolved_preserved",
          rationale: `Synthetic review preserves the residual ${entry.route} issue rather than fabricating agreement.`,
        })),
        rerating_rating_ids: [],
        residual_disagreement_summary:
          "The item remains usable only with the ambiguity and resulting uncertainty explicitly preserved in the final snapshot.",
        minority_or_alternative_interpretations_preserved: true,
        no_score_imposition_acknowledged: true,
        no_convergence_pressure_acknowledged: true,
        quality_control: {
          decision: "accepted_closure",
          operator_id: "OPS_SYN_QC",
          reason:
            "The unresolved case is fully documented and does not claim consensus.",
          decided_at: "2026-08-06T01:30:00.000Z",
        },
        payment_authorized: false,
        phase_2_authorized: false,
      },
    ],
  };
}

function makeSnapshotInput(
  caseSet,
  dataset,
  resolutionReport,
  snapshotBodySha256 = null,
) {
  const value = {
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
    authorization: {
      q_006b_approved: false,
      q_006c_approved: false,
      all_required_cases_closed_or_documented_unresolved: false,
      final_snapshot_generation_authorized: false,
      final_snapshot_signoff_authorized: false,
      private_controlled_storage_confirmed: false,
      approval_record_ids: [],
      approved_at: null,
    },
    publication_authorized: false,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    signoffs: [],
  };
  if (!snapshotBodySha256) return value;
  const roster = [
    ...new Set(caseSet.cases.map((entry) => entry.assigned_adjudicator_id)),
  ].sort();
  value.signoffs = roster.map((adjudicatorId, index) => ({
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
        "Synthetic sign-off is complete and bound to the exact distribution-preserving snapshot body.",
      decided_at: `2026-08-07T0${index + 3}:00:00.000Z`,
    },
  }));
  return value;
}

test("opens two deterministic operative cases and balances them across two dedicated adjudicators", async () => {
  const [dataset, policy, control] = await loadInputs();
  const caseSet = generatePilotAdjudicationCases(dataset, policy, control);
  assert.equal(caseSet.case_count, 2);
  assert.deepEqual(
    caseSet.cases.map((entry) => entry.critique_id).sort(),
    ["C-SYN-03", "C-SYN-04"],
  );
  assert.deepEqual(Object.values(caseSet.assignment_counts).sort(), [1, 1]);
  assert.equal(
    caseSet.cases.find((entry) => entry.critique_id === "C-SYN-03")
      .case_kind,
    "mixed_review",
  );
  assert.ok(caseSet.cases.every((entry) => entry.initial_ratings.length === 2));
  assert.ok(
    caseSet.cases.every(
      (entry) =>
        entry.payment_authorized === false && entry.phase_2_authorized === false,
    ),
  );
  assert.match(caseSet.case_set_commitment_sha256, /^[a-f0-9]{64}$/);
});

test("is invariant to dataset, policy-route, adjudicator, and topic-map array order", async () => {
  const [dataset, policy, control] = await loadInputs();
  const first = generatePilotAdjudicationCases(dataset, policy, control);
  dataset.positions.reverse();
  dataset.ratings.reverse();
  policy.approved_routes.reverse();
  control.adjudicators.reverse();
  control.position_topic_families.reverse();
  const second = generatePilotAdjudicationCases(dataset, policy, control);
  assert.equal(first.initial_snapshot_sha256, second.initial_snapshot_sha256);
  assert.equal(first.analysis_policy_sha256, second.analysis_policy_sha256);
  assert.equal(
    first.case_set_commitment_sha256,
    second.case_set_commitment_sha256,
  );
  assert.deepEqual(first.cases, second.cases);
});

test("refuses to open work from the checked-in diagnostic-only policy", async () => {
  const [dataset, , control] = await loadInputs();
  const policy = await readJson(diagnosticPolicyPath);
  control.analysis_policy_id = policy.policy_id;
  control.analysis_policy_version = policy.policy_version;
  const report = validatePilotAdjudicationControl(dataset, policy, control);
  assert.equal(report.status, "fail");
  assert.ok(
    report.errors.some((error) =>
      error.includes("at least one explicitly approved operative route"),
    ),
  );
  assert.throws(
    () => generatePilotAdjudicationCases(dataset, policy, control),
    (error) =>
      error instanceof PilotAdjudicationError &&
      /explicitly approved operative route/.test(error.message),
  );
});

test("fails closed when both adjudicators are conflicted or lack topic coverage", async () => {
  const [dataset, policy, control] = await loadInputs();
  for (const adjudicator of control.adjudicators) {
    adjudicator.conflict_position_ids = ["P-SYN-01"];
    adjudicator.approved_topic_families = ["wrong_topic"];
  }
  assert.throws(
    () => generatePilotAdjudicationCases(dataset, policy, control),
    (error) =>
      error instanceof PilotAdjudicationError &&
      /No eligible adjudicator/.test(error.message),
  );
});

test("accepts append-only rerating closure and preserves a separate unresolved case", async () => {
  const [baseDataset, policy, control] = await loadInputs();
  const caseSet = generatePilotAdjudicationCases(baseDataset, policy, control);
  const dataset = addAcceptedObjectLevelRerating(baseDataset);
  const report = validatePilotAdjudicationResolutions(
    caseSet,
    dataset,
    makeResolutionInput(caseSet, dataset),
  );
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.required_case_count, 2);
  assert.equal(report.accepted_closure_count, 2);
  assert.equal(report.open_case_count, 0);
  assert.equal(report.unresolved_case_count, 1);
  assert.equal(report.accepted_adjudication_unit_events.length, 2);
  assert.ok(
    report.accepted_adjudication_unit_events.every(
      (entry) => entry.payment_authorized === false,
    ),
  );
  assert.equal(
    dataset.ratings.find((entry) => entry.rating_id === "RT-SYN-005").scores
      .clarity,
    0.4,
  );
  assert.equal(
    dataset.ratings.find((entry) => entry.rating_id === "RT-SYN-009")
      .predecessor_rating_id,
    "RT-SYN-005",
  );
});

test("rejects score imposition, missing route dispositions, wrong adjudicators, and invalid rerating chains", async () => {
  const [baseDataset, policy, control] = await loadInputs();
  const caseSet = generatePilotAdjudicationCases(baseDataset, policy, control);
  const dataset = addAcceptedObjectLevelRerating(baseDataset);
  const input = makeResolutionInput(caseSet, dataset);
  input.records[0].final_scores = { overall: 0.5 };
  input.records[0].route_dispositions.pop();
  input.records[0].adjudicator_id = "R-SYN-A";
  dataset.ratings.find(
    (entry) => entry.rating_id === "RT-SYN-009",
  ).predecessor_rating_id = "RT-SYN-001";
  input.dataset_sha256 = hashPilotRatingDataset(dataset);
  const report = validatePilotAdjudicationResolutions(caseSet, dataset, input);
  assert.equal(report.status, "fail");
  assert.ok(
    report.errors.some((error) => error.includes("prohibited score-imposition")),
  );
  assert.ok(report.errors.some((error) => error.includes("missing")));
  assert.ok(
    report.errors.some((error) => error.includes("must match the case assignment")),
  );
  assert.ok(report.errors.some((error) => error.includes("predecessor chain")));
});

test("builds a two-signoff distribution-preserving snapshot without fabricating consensus", async () => {
  const [baseDataset, policy, control] = await loadInputs();
  const caseSet = generatePilotAdjudicationCases(baseDataset, policy, control);
  const dataset = addAcceptedObjectLevelRerating(baseDataset);
  const resolutionReport = validatePilotAdjudicationResolutions(
    caseSet,
    dataset,
    makeResolutionInput(caseSet, dataset),
  );
  assert.equal(resolutionReport.status, "pass", resolutionReport.errors.join("\n"));

  const draft = buildPilotFinalLabelSnapshot(
    caseSet,
    dataset,
    resolutionReport,
    makeSnapshotInput(caseSet, dataset, resolutionReport),
  );
  assert.equal(draft.status, "fail");
  assert.match(draft.snapshot_body_sha256, /^[a-f0-9]{64}$/);

  const snapshot = buildPilotFinalLabelSnapshot(
    caseSet,
    dataset,
    resolutionReport,
    makeSnapshotInput(
      caseSet,
      dataset,
      resolutionReport,
      draft.snapshot_body_sha256,
    ),
  );
  assert.equal(snapshot.status, "pass", snapshot.errors.join("\n"));
  assert.equal(snapshot.body.consensus_score_created, false);
  assert.equal(snapshot.body.original_initial_ratings_preserved, true);
  assert.equal(snapshot.body.accepted_initial_ratings, 8);
  assert.equal(snapshot.body.latest_accepted_ratings, 8);
  assert.equal(snapshot.body.accepted_reratings, 1);
  assert.equal(snapshot.body.unresolved_cases, 1);
  assert.equal(snapshot.signoffs.length, 2);
  assert.equal(snapshot.accepted_signoff_unit_events.length, 2);
  assert.match(snapshot.final_snapshot_sha256, /^[a-f0-9]{64}$/);

  const critique3 = snapshot.body.critique_records.find(
    (entry) => entry.critique_id === "C-SYN-03",
  );
  assert.deepEqual(critique3.initial_rating_ids.sort(), [
    "RT-SYN-005",
    "RT-SYN-006",
  ]);
  assert.deepEqual(critique3.latest_accepted_rating_ids.sort(), [
    "RT-SYN-006",
    "RT-SYN-009",
  ]);
});

test("public summaries contain only aggregate counts and commitments", async () => {
  const [baseDataset, policy, control] = await loadInputs();
  const caseSet = generatePilotAdjudicationCases(baseDataset, policy, control);
  const dataset = addAcceptedObjectLevelRerating(baseDataset);
  const resolutionReport = validatePilotAdjudicationResolutions(
    caseSet,
    dataset,
    makeResolutionInput(caseSet, dataset),
  );
  const draft = buildPilotFinalLabelSnapshot(
    caseSet,
    dataset,
    resolutionReport,
    makeSnapshotInput(caseSet, dataset, resolutionReport),
  );
  const snapshot = buildPilotFinalLabelSnapshot(
    caseSet,
    dataset,
    resolutionReport,
    makeSnapshotInput(
      caseSet,
      dataset,
      resolutionReport,
      draft.snapshot_body_sha256,
    ),
  );

  const summaries = [
    sanitizePilotAdjudicationCaseSummary(caseSet),
    sanitizePilotAdjudicationResolutionSummary(resolutionReport),
    sanitizePilotFinalLabelSnapshotSummary(snapshot),
  ];
  assert.equal(summaries[0].counts.case_count, 2);
  for (const summary of summaries) {
    assert.equal(assertPublicAdjudicationSummary(summary), true);
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
      "C-SYN-03",
      "RT-SYN-009",
      "ADJ_SYN_",
    ]) {
      assert.equal(text.includes(forbidden), false, `public summary leaked ${forbidden}`);
    }
  }
});

test("hashes the initial snapshot and operational policy deterministically", async () => {
  const [dataset, policy] = await loadInputs();
  const firstSnapshotHash = hashPilotInitialRatingSnapshot(dataset);
  const firstPolicyHash = hashPilotAdjudicationPolicy(policy);
  dataset.ratings.reverse();
  policy.approved_routes.reverse();
  assert.equal(hashPilotInitialRatingSnapshot(dataset), firstSnapshotHash);
  assert.equal(hashPilotAdjudicationPolicy(policy), firstPolicyHash);
  assert.match(firstSnapshotHash, /^[a-f0-9]{64}$/);
  assert.match(firstPolicyHash, /^[a-f0-9]{64}$/);
});
