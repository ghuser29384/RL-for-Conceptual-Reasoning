import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { generatePilotAssignments } from "../scripts/pilot-assignment-generator.mjs";
import { validatePilotEndpointDataset } from "../scripts/pilot-endpoint-analysis-v1.mjs";
import { generatePilotSelfCheckSelection } from "../scripts/pilot-self-check-selection.mjs";
import { FileEventStore } from "../src/staging-event-store.mjs";
import {
  PilotEndpointServiceError,
  PilotEndpointWorkflowService,
} from "../src/pilot-endpoint-service.mjs";
import {
  createBlindSelfCheckFormModel,
  createInitialEndpointFormModel,
  createInterpretationCauseCodingFormModel,
  validateBlindSelfCheckFormPayload,
  validateInitialEndpointFormPayload,
  validateInterpretationCauseCodeFormPayload,
} from "../staging/pilot-endpoint-form.mjs";
import { readFile } from "node:fs/promises";

const root = resolve(import.meta.dirname, "..");
const noExposure = {
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

async function workflowFixture() {
  const [endpointContract, methodology, assignmentInput] = await Promise.all([
    loadJson("ops/pilot-endpoint-design-amendment-v1.json"),
    loadJson("ops/next-steps-2026-07-23/pilot-methodology-recommendations.json"),
    loadJson("test/fixtures/pilot-assignment-synthetic.json"),
  ]);
  const assignmentReport = generatePilotAssignments(methodology, assignmentInput);
  const selection = generatePilotSelfCheckSelection(endpointContract, {
    selection_input_id: "synthetic-service-selection-v1",
    input_version: 1,
    programme_id: assignmentInput.programme_id,
    data_class: "synthetic_test_fixture",
    mode: "simulation",
    seed: "synthetic-service-selection-seed-v1",
    authorization: {
      q_006b_approved: false,
      protected_manifest_frozen: false,
      self_check_selection_authorized: false,
      private_controlled_storage_confirmed: false,
      approval_record_ids: [],
      approved_at: null,
    },
    assignment_report: assignmentReport,
  });
  return { endpointContract, assignmentReport, selection };
}

async function withService(run) {
  const directory = await mkdtemp(join(tmpdir(), "metaphilosophy-endpoint-service-"));
  const filePath = join(directory, "events.ndjson");
  let nowMs = Date.parse("2026-08-16T10:00:00.000Z");
  const now = () => new Date(nowMs);
  const advance = (milliseconds) => { nowMs += milliseconds; };
  const store = new FileEventStore({ filePath });
  const service = new PilotEndpointWorkflowService({ store, now });
  await service.initialize();
  try {
    await run({ service, store, filePath, advance, now });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function registerAllPackets(service, assignmentReport) {
  for (const assignment of assignmentReport.position_assignments) {
    for (const raterId of assignment.rater_ids) {
      await service.registerAssignmentPacket({
        actorId: "SIM_OPERATOR",
        packet: {
          packetId: `PKT_${assignment.slot_id}_${raterId}`,
          raterId,
          positionId: assignment.position_id,
          critiqueIds: assignment.critique_ids,
        },
      });
    }
  }
}

function validInitialPayload(selectionRecord) {
  return {
    ratingId: "SIM_INITIAL_RATING_001",
    raterId: selectionRecord.rater_id,
    positionId: selectionRecord.position_id,
    critiqueId: selectionRecord.critique_id,
    rubricVersion: "rubric-v2-seven-dimensional",
    scores: {
      centrality: 0.72,
      strength: 0.66,
      correctness: 0.85,
      clarity: 0.9,
      dead_weight: 0.08,
      single_issue: 0.9,
      overall: 0.65,
    },
    overallRationale: "The synthetic critique attacks an important premise and offers a reasonably strong object-level reason against it.",
    confidence: 0.82,
    timeSpentSeconds: 510,
    verificationStatus: "not_applicable",
    itemIntegrityFlags: [],
    critiqueTargetSummary: "The critique attacks the position's specified supporting premise.",
    pricedInAssessment: "no",
    interpretationConfidence: "high",
    backgroundAssumptions: "",
    positionAmbiguity: false,
    critiqueAmbiguity: false,
    insufficientContext: false,
  };
}

function validSelfCheckPayload(selectionRecord, predecessor) {
  return {
    ratingId: "SIM_SELF_CHECK_001",
    raterId: selectionRecord.rater_id,
    positionId: selectionRecord.position_id,
    critiqueId: selectionRecord.critique_id,
    predecessorRatingId: predecessor.ratingId,
    selfCheckSelectionRecordId: selectionRecord.self_check_record_id,
    scores: { ...predecessor.scores, overall: predecessor.scores.overall + 0.02 },
    overallRationale: "On blind rereading, the synthetic critique still targets the same premise, with a small upward correction to its holistic force.",
    confidence: 0.84,
    timeSpentSeconds: 180,
    objectLevelRevisionReason: "The second independent reading made the critique's object-level support slightly stronger than initially assessed.",
    exposureAttestation: { ...noExposure },
  };
}

test("persists assignment packets, interpretation fingerprints, and predecessor-linked self-checks in the append-only chain", async () => {
  const fixture = await workflowFixture();
  await withService(async ({ service, store, filePath, advance }) => {
    await registerAllPackets(service, fixture.assignmentReport);
    const registeredSelection = await service.registerSelfCheckSelection({
      actorId: "SIM_OPERATOR",
      selectionReport: fixture.selection,
    });
    assert.equal(registeredSelection.created, true);
    assert.equal(registeredSelection.selection.recordCount, 24);
    assert.equal(registeredSelection.selection.ratingWorkAuthorized, false);
    assert.equal(registeredSelection.selection.paymentAuthorized, false);

    const selectionRecord = fixture.selection.self_check_records[0];
    const conclusion = await service.lockPositionConclusion({
      actorId: selectionRecord.rater_id,
      raterId: selectionRecord.rater_id,
      positionId: selectionRecord.position_id,
      summary: "The synthetic position advances one bounded conclusion that is fixed before rating any sibling critique.",
    });
    assert.equal(conclusion.created, true);
    assert.equal(conclusion.conclusion.immutable, true);
    assert.equal(conclusion.conclusion.lockedBeforeFirstSiblingRating, true);

    advance(60_000);
    const initial = await service.lockInitialRating({
      actorId: selectionRecord.rater_id,
      payload: validInitialPayload(selectionRecord),
    });
    assert.equal(initial.rating.stage, "initial");
    assert.equal(initial.rating.version, 1);
    assert.equal(initial.rating.predecessorRatingId, null);
    assert.equal(initial.rating.interpretationFingerprintLockedBeforePeerExposure, true);
    assert.match(initial.rating.interpretationFingerprintSha256, /^[a-f0-9]{64}$/);
    assert.match(initial.rating.ratingSha256, /^[a-f0-9]{64}$/);

    const workspaceBeforeCheck = await service.getRaterWorkspace({
      raterId: selectionRecord.rater_id,
      positionId: selectionRecord.position_id,
    });
    assert.equal(workspaceBeforeCheck.ownRatings.length, 1);
    assert.equal(workspaceBeforeCheck.selectedSelfChecks.length >= 1, true);
    assert.ok(Object.values(workspaceBeforeCheck.visibility).every((value) => value === false));
    assert.ok(Object.values(workspaceBeforeCheck.authorization).every((value) => value === false));

    advance(86_400_000);
    const selfCheck = await service.lockBlindSelfCheck({
      actorId: selectionRecord.rater_id,
      payload: validSelfCheckPayload(selectionRecord, initial.rating),
    });
    assert.equal(selfCheck.rating.stage, "blind_self_check");
    assert.equal(selfCheck.rating.version, 2);
    assert.equal(selfCheck.rating.predecessorRatingId, initial.rating.ratingId);
    assert.equal(selfCheck.rating.initialRatingPreserved, true);
    assert.equal(selfCheck.rating.scoresChanged, true);
    assert.ok(Object.values(selfCheck.rating.exposureAttestation).every((value) => value === false));

    const chain = await store.verifyChain();
    assert.equal(chain.ok, true);
    assert.equal(chain.events, 28);
    assert.match(chain.headHash, /^[a-f0-9]{64}$/);

    const reopenedStore = new FileEventStore({ filePath });
    const reopenedService = new PilotEndpointWorkflowService({ store: reopenedStore, now: () => new Date("2026-08-18T00:00:00.000Z") });
    const reopenedState = await reopenedService.state();
    assert.equal(reopenedState.assignmentPackets.length, 24);
    assert.equal(reopenedState.selfCheckSelection.records.length, 24);
    assert.equal(reopenedState.positionConclusions.length, 1);
    assert.equal(reopenedState.ratings.length, 2);

    const dataset = await reopenedService.buildControlledDataset({
      datasetId: "SIM_ENDPOINT_DATASET_PARTIAL",
      positions: fixture.assignmentReport.position_assignments.map((assignment) => ({
        position_id: assignment.position_id,
        critique_ids: assignment.critique_ids,
      })),
    });
    const validation = validatePilotEndpointDataset(dataset, { requireComplete: false, requireEndpointV1: true });
    assert.equal(validation.status, "pass", validation.errors.join("\n"));
    assert.equal(validation.accepted_initial_ratings, 1);
    assert.equal(validation.accepted_blind_self_checks, 1);
    assert.ok(Object.values(dataset.authorization).every((value) => value === false));
  });
});

test("enforces locked position interpretation, frozen assignment membership, and immutable initial records", async () => {
  const fixture = await workflowFixture();
  await withService(async ({ service, advance }) => {
    await registerAllPackets(service, fixture.assignmentReport);
    await service.registerSelfCheckSelection({ actorId: "SIM_OPERATOR", selectionReport: fixture.selection });
    const selectionRecord = fixture.selection.self_check_records[0];
    const payload = validInitialPayload(selectionRecord);

    await assert.rejects(
      service.lockInitialRating({ actorId: selectionRecord.rater_id, payload }),
      (error) => error instanceof PilotEndpointServiceError && error.code === "position_conclusion_required",
    );

    await service.lockPositionConclusion({
      actorId: selectionRecord.rater_id,
      raterId: selectionRecord.rater_id,
      positionId: selectionRecord.position_id,
      summary: "The synthetic position advances one bounded conclusion that is locked before sibling ratings.",
    });
    await assert.rejects(
      service.lockPositionConclusion({
        actorId: selectionRecord.rater_id,
        raterId: selectionRecord.rater_id,
        positionId: selectionRecord.position_id,
        summary: "A different replacement conclusion that must not overwrite the immutable first interpretation.",
      }),
      (error) => error instanceof PilotEndpointServiceError && error.code === "position_conclusion_immutable",
    );

    const wrongCritique = structuredClone(payload);
    wrongCritique.critiqueId = "UNASSIGNED_CRITIQUE";
    await assert.rejects(
      service.lockInitialRating({ actorId: selectionRecord.rater_id, payload: wrongCritique }),
      (error) => error instanceof PilotEndpointServiceError && error.code === "critique_not_assigned",
    );

    advance(60_000);
    await service.lockInitialRating({ actorId: selectionRecord.rater_id, payload });
    await assert.rejects(
      service.lockInitialRating({ actorId: selectionRecord.rater_id, payload }),
      (error) => error instanceof PilotEndpointServiceError && error.code === "initial_rating_immutable",
    );
  });
});

test("blocks self-checks outside the frozen sample, after exposure, or without an object-level change reason", async () => {
  const fixture = await workflowFixture();
  await withService(async ({ service, advance }) => {
    await registerAllPackets(service, fixture.assignmentReport);
    await service.registerSelfCheckSelection({ actorId: "SIM_OPERATOR", selectionReport: fixture.selection });
    const selectionRecord = fixture.selection.self_check_records[0];
    await service.lockPositionConclusion({
      actorId: selectionRecord.rater_id,
      raterId: selectionRecord.rater_id,
      positionId: selectionRecord.position_id,
      summary: "The synthetic position advances one bounded conclusion that is locked before sibling ratings.",
    });
    advance(60_000);
    const initial = await service.lockInitialRating({
      actorId: selectionRecord.rater_id,
      payload: validInitialPayload(selectionRecord),
    });
    advance(86_400_000);

    const exposed = validSelfCheckPayload(selectionRecord, initial.rating);
    exposed.exposureAttestation.peer_scores_visible = true;
    await assert.rejects(
      service.lockBlindSelfCheck({ actorId: selectionRecord.rater_id, payload: exposed }),
      (error) => error instanceof PilotEndpointServiceError && error.code === "self_check_exposure_detected",
    );

    const noReason = validSelfCheckPayload(selectionRecord, initial.rating);
    noReason.objectLevelRevisionReason = null;
    await assert.rejects(
      service.lockBlindSelfCheck({ actorId: selectionRecord.rater_id, payload: noReason }),
      (error) => error instanceof PilotEndpointServiceError && error.code === "self_check_reason_required",
    );

    const notSelected = validSelfCheckPayload(selectionRecord, initial.rating);
    notSelected.selfCheckSelectionRecordId = "SC_NOT_SELECTED";
    await assert.rejects(
      service.lockBlindSelfCheck({ actorId: selectionRecord.rater_id, payload: notSelected }),
      (error) => error instanceof PilotEndpointServiceError && error.code === "self_check_not_selected",
    );
  });
});

test("initial form makes interpretation explicit before scores and conditionally requires assumptions", () => {
  const model = createInitialEndpointFormModel({
    positionId: "SIM_P01",
    critiqueId: "SIM_C01",
    positionConclusion: null,
  });
  assert.equal(model.formKind, "blind_initial_with_interpretation_fingerprint");
  assert.equal(model.interpretation.positionConclusionSummary.required, true);
  assert.equal(model.interpretation.critiqueTargetSummary.required, true);
  assert.equal(model.interpretation.pricedInAssessment.required, true);
  assert.equal(model.rating.dimensions.length, 7);
  assert.ok(model.rating.dimensions.every((dimension) => dimension.initialState === "unset"));
  assert.ok(Object.values(model.visibility).every((value) => value === false));
  assert.ok(Object.values(model.authorization).every((value) => value === false));

  const invalid = validateInitialEndpointFormPayload({
    positionConclusionSummary: "too short",
    critiqueTargetSummary: "too short",
    pricedInAssessment: "uncertain",
    interpretationConfidence: "low",
    backgroundAssumptions: "",
    positionAmbiguity: false,
    critiqueAmbiguity: false,
    insufficientContext: false,
    scores: {},
    overallRationale: "short",
    confidence: 2,
    timeSpentSeconds: 0,
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.interpretationFingerprintReady, false);
  assert.ok("backgroundAssumptions" in invalid.errors);
  assert.ok("scores.overall" in invalid.errors);

  const valid = validateInitialEndpointFormPayload({
    positionConclusionSummary: "The position advances one bounded conclusion under the supplied context.",
    critiqueTargetSummary: "The critique attacks the central supporting claim for that conclusion.",
    pricedInAssessment: "uncertain",
    interpretationConfidence: "low",
    backgroundAssumptions: "The position may assume that the relevant comparison class is fixed.",
    positionAmbiguity: true,
    critiqueAmbiguity: false,
    insufficientContext: false,
    scores: {
      centrality: 0.8,
      strength: 0.7,
      correctness: 0.9,
      clarity: 0.85,
      dead_weight: 0.05,
      single_issue: 0.9,
      overall: 0.72,
    },
    overallRationale: "The critique attacks a central premise with a fairly strong and clearly stated object-level objection.",
    confidence: 0.8,
    timeSpentSeconds: 600,
  });
  assert.equal(valid.ok, true, JSON.stringify(valid.errors));
  assert.equal(valid.interpretationFingerprintReady, true);
});

test("self-check form preserves the initial and refuses any visible peer, model, aggregate, cause, discussion, or adjudication signal", () => {
  const initialRating = {
    ratingId: "SIM_INITIAL",
    stage: "initial",
    version: 1,
    scores: {
      centrality: 0.8,
      strength: 0.7,
      correctness: 0.9,
      clarity: 0.85,
      dead_weight: 0.05,
      single_issue: 0.9,
      overall: 0.72,
    },
  };
  const model = createBlindSelfCheckFormModel({
    selectionRecord: { selfCheckRecordId: "SIM_SELECTION" },
    initialRating,
  });
  assert.equal(model.formKind, "blind_self_check");
  assert.equal(model.predecessor.ownRatingOnly, true);
  assert.ok(Object.values(model.exposureAttestation).every((value) => value === false));
  assert.ok(Object.values(model.visibility).every((value) => value === false));

  const changedScores = { ...initialRating.scores, overall: 0.75 };
  const valid = validateBlindSelfCheckFormPayload({
    scores: changedScores,
    overallRationale: "The blind rereading supports a small holistic correction while preserving the same interpretation.",
    confidence: 0.82,
    timeSpentSeconds: 180,
    objectLevelRevisionReason: "A second independent reading made the objection's force slightly clearer.",
    exposureAttestation: { ...noExposure },
  }, initialRating);
  assert.equal(valid.ok, true, JSON.stringify(valid.errors));
  assert.equal(valid.scoresChanged, true);

  const invalid = validateBlindSelfCheckFormPayload({
    scores: changedScores,
    overallRationale: "The blind rereading supports a small holistic correction while preserving the same interpretation.",
    confidence: 0.82,
    timeSpentSeconds: 180,
    objectLevelRevisionReason: "",
    exposureAttestation: { ...noExposure, model_judgments_visible: true },
  }, initialRating);
  assert.equal(invalid.ok, false);
  assert.ok("objectLevelRevisionReason" in invalid.errors);
  assert.ok("exposureAttestation.model_judgments_visible" in invalid.errors);
});

test("cause-coding form renders only role-masked fingerprints and rejects score leakage or forced mixed classifications", () => {
  const packet = {
    position_text: "Synthetic position text for role-masked interpretation coding.",
    critique_text: "Synthetic critique text for role-masked interpretation coding.",
    topic_family: "normative_ethics",
    pair_commitment_sha256: "a".repeat(64),
    fingerprints: [
      {
        role_mask: "RATER_A",
        position_conclusion_summary: "Rater A reads the position as making one bounded claim.",
        critique_target_summary: "Rater A reads the critique as attacking the main premise.",
        priced_in_assessment: "no",
        interpretation_confidence: "high",
        background_assumptions: "",
        position_ambiguity: false,
        critique_ambiguity: false,
        insufficient_context: false,
      },
      {
        role_mask: "RATER_B",
        position_conclusion_summary: "Rater B reads the position as making the same bounded claim.",
        critique_target_summary: "Rater B reads the critique as attacking a narrower premise.",
        priced_in_assessment: "partly",
        interpretation_confidence: "medium",
        background_assumptions: "",
        position_ambiguity: false,
        critique_ambiguity: false,
        insufficient_context: false,
      },
    ],
  };
  const model = createInterpretationCauseCodingFormModel(packet);
  assert.equal(model.formKind, "initial_interpretation_cause_code");
  assert.equal(model.fingerprints.length, 2);
  assert.deepEqual(model.fingerprints.map((row) => row.role_mask).sort(), ["RATER_A", "RATER_B"]);
  assert.ok(Object.values(model.visibility).every((value) => value === false));
  assert.equal("scores" in model, false);
  assert.equal("otherAdjudicatorCode" in model, false);

  const invalidClassification = validateInterpretationCauseCodeFormPayload({
    causeCodes: ["compatible_interpretations", "material_critique_target_or_claim_difference"],
    rationale: "These classifications cannot be combined because compatibility is exclusive.",
  });
  assert.equal(invalidClassification.ok, false);
  assert.ok("causeCodes" in invalidClassification.errors);

  assert.throws(
    () => createInterpretationCauseCodingFormModel({ ...packet, score_gaps: { overall: 0.5 } }),
    /prohibited fields/,
  );
});
