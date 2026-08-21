import { createHash, randomUUID } from "node:crypto";

const SCORE_DIMENSIONS = Object.freeze([
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "overall",
]);
const PRICED_IN_ASSESSMENTS = Object.freeze(["no", "partly", "yes", "uncertain"]);
const INTERPRETATION_CONFIDENCE_OPTIONS = Object.freeze(["high", "medium", "low"]);
const VERIFICATION_STATUSES = Object.freeze([
  "not_applicable",
  "verified",
  "unresolved_verifiable",
  "not_practically_verifiable",
]);
const ITEM_INTEGRITY_FLAGS = Object.freeze([
  "source_fidelity",
  "ambiguity",
  "scope",
  "leakage",
  "other_documented",
]);
const SELF_CHECK_EXPOSURE_FIELDS = Object.freeze([
  "peer_scores_visible",
  "peer_rationales_visible",
  "model_judgments_visible",
  "aggregate_results_visible",
  "cause_codes_visible",
  "discussion_visible",
  "adjudication_state_visible",
]);
const EVENT_TYPES = Object.freeze({
  ASSIGNMENT_PACKET_REGISTERED: "pilot_endpoint.assignment_packet.registered",
  SELF_CHECK_SELECTION_REGISTERED: "pilot_endpoint.self_check_selection.registered",
  POSITION_CONCLUSION_LOCKED: "pilot_endpoint.position_conclusion.locked",
  INITIAL_RATING_LOCKED: "pilot_endpoint.initial_rating.locked",
  BLIND_SELF_CHECK_LOCKED: "pilot_endpoint.blind_self_check.locked",
});

export class PilotEndpointServiceError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.name = "PilotEndpointServiceError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class PilotEndpointWorkflowService {
  constructor({ store, now = () => new Date() }) {
    if (!store) throw new Error("An append-only event store is required.");
    this.store = store;
    this.now = now;
  }

  async initialize() {
    await this.store.initialize();
    return this.store.verifyChain();
  }

  async state() {
    return reducePilotEndpointEvents(await this.store.loadEvents());
  }

  async registerAssignmentPacket({ actorId, packet }) {
    const state = await this.state();
    const normalized = normalizeAssignmentPacket(packet);
    const existing = state.assignmentPackets.find((row) => row.packetId === normalized.packetId);
    if (existing) {
      if (existing.packetSha256 !== normalized.packetSha256) {
        throw serviceError(409, "assignment_packet_hash_conflict", "The assignment packet ID is already bound to different content.");
      }
      return { packet: publicAssignmentPacket(existing), created: false };
    }
    const duplicateAssignment = state.assignmentPackets.find((row) => (
      row.raterId === normalized.raterId && row.positionId === normalized.positionId
    ));
    if (duplicateAssignment) {
      throw serviceError(409, "assignment_already_registered", "That rater-position assignment already has a frozen packet.");
    }
    const createdAt = this.now().toISOString();
    await this.store.append({
      type: EVENT_TYPES.ASSIGNMENT_PACKET_REGISTERED,
      aggregateId: normalized.packetId,
      actorId: cleanId(actorId),
      payload: { ...normalized, createdAt },
      createdAt,
    });
    return { packet: publicAssignmentPacket({ ...normalized, createdAt }), created: true };
  }

  async registerSelfCheckSelection({ actorId, selectionReport }) {
    const state = await this.state();
    const normalized = normalizeSelfCheckSelectionReport(selectionReport, state.assignmentPackets);
    const existing = state.selfCheckSelection;
    if (existing) {
      if (existing.controlledManifestHash !== normalized.controlledManifestHash) {
        throw serviceError(409, "self_check_selection_already_frozen", "A different self-check selection manifest is already frozen.");
      }
      return { selection: publicSelfCheckSelection(existing), created: false };
    }
    const createdAt = this.now().toISOString();
    await this.store.append({
      type: EVENT_TYPES.SELF_CHECK_SELECTION_REGISTERED,
      aggregateId: normalized.controlledManifestHash,
      actorId: cleanId(actorId),
      payload: { ...normalized, createdAt },
      createdAt,
    });
    return { selection: publicSelfCheckSelection({ ...normalized, createdAt }), created: true };
  }

  async lockPositionConclusion({ actorId, raterId, positionId, summary }) {
    const state = await this.state();
    const normalizedRaterId = controlledId(raterId, "raterId");
    const normalizedPositionId = controlledId(positionId, "positionId");
    const assignment = state.assignmentPackets.find((row) => (
      row.raterId === normalizedRaterId && row.positionId === normalizedPositionId
    ));
    if (!assignment) throw serviceError(404, "assignment_not_found", "No frozen assignment packet exists for this rater and position.");
    const key = `${normalizedRaterId}|${normalizedPositionId}`;
    const normalizedSummary = boundedText(summary, 10, 2000, "position conclusion summary");
    const existing = state.positionConclusions.find((row) => row.key === key);
    if (existing) {
      if (existing.summary !== normalizedSummary) {
        throw serviceError(409, "position_conclusion_immutable", "The position conclusion is already locked and cannot be replaced.");
      }
      return { conclusion: publicPositionConclusion(existing), created: false };
    }
    if (state.ratings.some((row) => row.raterId === normalizedRaterId && row.positionId === normalizedPositionId)) {
      throw serviceError(409, "position_conclusion_too_late", "The position conclusion must lock before the first sibling rating.");
    }
    const lockedAt = this.now().toISOString();
    const record = {
      key,
      conclusionId: randomUUID(),
      raterId: normalizedRaterId,
      positionId: normalizedPositionId,
      assignmentPacketId: assignment.packetId,
      assignmentPacketSha256: assignment.packetSha256,
      summary: normalizedSummary,
      summarySha256: sha256(normalizedSummary),
      lockedAt,
      immutable: true,
      lockedBeforeFirstSiblingRating: true,
    };
    await this.store.append({
      type: EVENT_TYPES.POSITION_CONCLUSION_LOCKED,
      aggregateId: record.conclusionId,
      actorId: cleanId(actorId) || normalizedRaterId,
      payload: record,
      createdAt: lockedAt,
    });
    return { conclusion: publicPositionConclusion(record), created: true };
  }

  async lockInitialRating({ actorId, payload }) {
    const state = await this.state();
    const normalized = normalizeInitialRatingPayload(payload);
    const assignment = state.assignmentPackets.find((row) => (
      row.raterId === normalized.raterId && row.positionId === normalized.positionId
    ));
    if (!assignment) throw serviceError(404, "assignment_not_found", "No frozen assignment packet exists for this rater and position.");
    if (!assignment.critiqueIds.includes(normalized.critiqueId)) {
      throw serviceError(403, "critique_not_assigned", "The critique does not belong to the rater's frozen assignment packet.");
    }
    const conclusion = state.positionConclusions.find((row) => (
      row.raterId === normalized.raterId && row.positionId === normalized.positionId
    ));
    if (!conclusion) {
      throw serviceError(409, "position_conclusion_required", "Lock the position conclusion before the first sibling rating.");
    }
    const duplicate = state.ratings.find((row) => (
      row.stage === "initial"
      && row.raterId === normalized.raterId
      && row.positionId === normalized.positionId
      && row.critiqueId === normalized.critiqueId
    ));
    if (duplicate) throw serviceError(409, "initial_rating_immutable", "An initial rating already exists for this rater and critique.");

    const lockedAt = this.now().toISOString();
    if (Date.parse(conclusion.lockedAt) > Date.parse(lockedAt)) {
      throw serviceError(409, "invalid_lock_order", "The position conclusion must lock before the initial rating.");
    }
    const ratingId = normalized.ratingId ?? randomUUID();
    if (state.ratings.some((row) => row.ratingId === ratingId)) {
      throw serviceError(409, "rating_id_conflict", "The rating ID is already in use.");
    }
    const rating = {
      ratingId,
      positionId: normalized.positionId,
      critiqueId: normalized.critiqueId,
      raterId: normalized.raterId,
      assignmentPacketId: assignment.packetId,
      assignmentPacketSha256: assignment.packetSha256,
      stage: "initial",
      version: 1,
      predecessorRatingId: null,
      rubricVersion: normalized.rubricVersion,
      scores: normalized.scores,
      overallRationale: normalized.overallRationale,
      confidence: normalized.confidence,
      timeSpentSeconds: normalized.timeSpentSeconds,
      verificationStatus: normalized.verificationStatus,
      itemIntegrityFlags: normalized.itemIntegrityFlags,
      accepted: true,
      lockedAt,
      objectLevelRevisionReason: null,
      positionConclusionId: conclusion.conclusionId,
      positionConclusionSummary: conclusion.summary,
      positionConclusionLockedAt: conclusion.lockedAt,
      critiqueTargetSummary: normalized.critiqueTargetSummary,
      pricedInAssessment: normalized.pricedInAssessment,
      interpretationConfidence: normalized.interpretationConfidence,
      backgroundAssumptions: normalized.backgroundAssumptions,
      positionAmbiguity: normalized.positionAmbiguity,
      critiqueAmbiguity: normalized.critiqueAmbiguity,
      insufficientContext: normalized.insufficientContext,
      interpretationFingerprintLockedBeforePeerExposure: true,
      interpretationFingerprintSha256: sha256(canonicalStringify({
        positionConclusionSummary: conclusion.summary,
        critiqueTargetSummary: normalized.critiqueTargetSummary,
        pricedInAssessment: normalized.pricedInAssessment,
        interpretationConfidence: normalized.interpretationConfidence,
        backgroundAssumptions: normalized.backgroundAssumptions,
        positionAmbiguity: normalized.positionAmbiguity,
        critiqueAmbiguity: normalized.critiqueAmbiguity,
        insufficientContext: normalized.insufficientContext,
      })),
      ratingSha256: null,
    };
    rating.ratingSha256 = sha256(canonicalStringify({ ...rating, ratingSha256: null }));
    await this.store.append({
      type: EVENT_TYPES.INITIAL_RATING_LOCKED,
      aggregateId: rating.ratingId,
      actorId: cleanId(actorId) || normalized.raterId,
      payload: rating,
      createdAt: lockedAt,
    });
    return { rating: publicOwnRating(rating), created: true };
  }

  async lockBlindSelfCheck({ actorId, payload }) {
    const state = await this.state();
    if (!state.selfCheckSelection) {
      throw serviceError(409, "self_check_selection_missing", "No frozen self-check selection manifest is registered.");
    }
    const normalized = normalizeBlindSelfCheckPayload(payload);
    const selectionRecord = state.selfCheckSelection.records.find((row) => (
      row.selfCheckRecordId === normalized.selfCheckSelectionRecordId
    ));
    if (!selectionRecord) throw serviceError(404, "self_check_not_selected", "The requested rating is not in the frozen self-check subsample.");
    for (const [field, value] of [
      ["raterId", normalized.raterId],
      ["positionId", normalized.positionId],
      ["critiqueId", normalized.critiqueId],
    ]) {
      if (selectionRecord[field] !== value) {
        throw serviceError(409, "self_check_selection_mismatch", `The self-check ${field} does not match the frozen selection record.`);
      }
    }
    const predecessor = state.ratings.find((row) => row.ratingId === normalized.predecessorRatingId);
    if (!predecessor || predecessor.stage !== "initial" || predecessor.version !== 1 || predecessor.accepted !== true) {
      throw serviceError(409, "invalid_self_check_predecessor", "A blind self-check must link directly to the accepted initial version-1 rating.");
    }
    for (const field of ["raterId", "positionId", "critiqueId"]) {
      if (predecessor[field] !== normalized[field]) {
        throw serviceError(409, "self_check_predecessor_mismatch", `The self-check predecessor must match ${field}.`);
      }
    }
    const existing = state.ratings.find((row) => (
      row.stage === "blind_self_check" && row.predecessorRatingId === predecessor.ratingId
    ));
    if (existing) throw serviceError(409, "self_check_immutable", "A blind self-check already exists for this initial rating.");

    for (const field of SELF_CHECK_EXPOSURE_FIELDS) {
      if (normalized.exposureAttestation[field] !== false) {
        throw serviceError(409, "self_check_exposure_detected", `Blind self-check requires ${field}=false.`);
      }
    }
    const lockedAt = this.now().toISOString();
    if (Date.parse(lockedAt) <= Date.parse(predecessor.lockedAt)) {
      throw serviceError(409, "invalid_self_check_lock_order", "The self-check must lock after its initial rating.");
    }
    const scoresChanged = scoreVectorsDiffer(predecessor.scores, normalized.scores);
    if (scoresChanged && !normalized.objectLevelRevisionReason) {
      throw serviceError(400, "self_check_reason_required", "A changed self-check requires an object-level revision reason.");
    }
    if (!scoresChanged && normalized.objectLevelRevisionReason) {
      throw serviceError(400, "self_check_reason_without_change", "An unchanged self-check must not fabricate a revision reason.");
    }
    const ratingId = normalized.ratingId ?? randomUUID();
    if (state.ratings.some((row) => row.ratingId === ratingId)) {
      throw serviceError(409, "rating_id_conflict", "The rating ID is already in use.");
    }
    const rating = {
      ratingId,
      positionId: normalized.positionId,
      critiqueId: normalized.critiqueId,
      raterId: normalized.raterId,
      assignmentPacketId: predecessor.assignmentPacketId,
      assignmentPacketSha256: predecessor.assignmentPacketSha256,
      stage: "blind_self_check",
      version: 2,
      predecessorRatingId: predecessor.ratingId,
      selfCheckSelectionRecordId: selectionRecord.selfCheckRecordId,
      selfCheckSelectionManifestHash: state.selfCheckSelection.controlledManifestHash,
      rubricVersion: predecessor.rubricVersion,
      scores: normalized.scores,
      overallRationale: normalized.overallRationale,
      confidence: normalized.confidence,
      timeSpentSeconds: normalized.timeSpentSeconds,
      accepted: true,
      lockedAt,
      scoresChanged,
      objectLevelRevisionReason: normalized.objectLevelRevisionReason,
      initialRatingPreserved: true,
      exposureAttestation: normalized.exposureAttestation,
      ratingSha256: null,
    };
    rating.ratingSha256 = sha256(canonicalStringify({ ...rating, ratingSha256: null }));
    await this.store.append({
      type: EVENT_TYPES.BLIND_SELF_CHECK_LOCKED,
      aggregateId: rating.ratingId,
      actorId: cleanId(actorId) || normalized.raterId,
      payload: rating,
      createdAt: lockedAt,
    });
    return { rating: publicOwnRating(rating), created: true };
  }

  async getRaterWorkspace({ raterId, positionId }) {
    const state = await this.state();
    const normalizedRaterId = controlledId(raterId, "raterId");
    const normalizedPositionId = controlledId(positionId, "positionId");
    const assignment = state.assignmentPackets.find((row) => (
      row.raterId === normalizedRaterId && row.positionId === normalizedPositionId
    ));
    if (!assignment) throw serviceError(404, "assignment_not_found", "No frozen assignment packet exists for this rater and position.");
    const ownRatings = state.ratings
      .filter((row) => row.raterId === normalizedRaterId && row.positionId === normalizedPositionId)
      .map(publicOwnRating)
      .sort((left, right) => left.critiqueId.localeCompare(right.critiqueId) || left.version - right.version);
    const ownConclusion = state.positionConclusions.find((row) => (
      row.raterId === normalizedRaterId && row.positionId === normalizedPositionId
    ));
    const selectedSelfChecks = (state.selfCheckSelection?.records ?? [])
      .filter((row) => row.raterId === normalizedRaterId && row.positionId === normalizedPositionId)
      .map((row) => ({
        selfCheckRecordId: row.selfCheckRecordId,
        critiqueId: row.critiqueId,
        requiredStage: "blind_self_check",
      }));
    return {
      assignment: publicAssignmentPacket(assignment),
      positionConclusion: ownConclusion ? publicPositionConclusion(ownConclusion) : null,
      ownRatings,
      selectedSelfChecks,
      visibility: {
        peerRatingsVisible: false,
        peerRationalesVisible: false,
        peerFingerprintsVisible: false,
        modelJudgmentsVisible: false,
        aggregateResultsVisible: false,
        causeCodesVisible: false,
        discussionVisible: false,
        adjudicationStateVisible: false,
      },
      authorization: {
        researchStartAuthorized: false,
        participantAccessAuthorized: false,
        recruitmentAuthorized: false,
        paymentAuthorized: false,
        phase2Authorized: false,
      },
    };
  }

  async buildControlledDataset({ datasetId, positions }) {
    const state = await this.state();
    return {
      dataset_id: controlledId(datasetId, "datasetId"),
      dataset_version: 1,
      programme_id: "metaphilosophy-48-critique-pilot-v1-2026-07-30",
      data_class: "synthetic_test_fixture",
      rubric_version: "rubric-v2-seven-dimensional",
      positions: structuredClone(positions),
      ratings: state.ratings.map(toAnalysisRating),
      authorization: {
        research_start_authorized: false,
        participant_access_authorized: false,
        recruitment_authorized: false,
        payment_authorized: false,
        phase_2_authorized: false,
      },
    };
  }
}

export function reducePilotEndpointEvents(events) {
  const state = {
    assignmentPackets: [],
    selfCheckSelection: null,
    positionConclusions: [],
    ratings: [],
  };
  for (const event of Array.isArray(events) ? events : []) {
    const payload = event?.payload ?? {};
    if (event.type === EVENT_TYPES.ASSIGNMENT_PACKET_REGISTERED) state.assignmentPackets.push(payload);
    if (event.type === EVENT_TYPES.SELF_CHECK_SELECTION_REGISTERED) state.selfCheckSelection = payload;
    if (event.type === EVENT_TYPES.POSITION_CONCLUSION_LOCKED) state.positionConclusions.push(payload);
    if (event.type === EVENT_TYPES.INITIAL_RATING_LOCKED || event.type === EVENT_TYPES.BLIND_SELF_CHECK_LOCKED) {
      state.ratings.push(payload);
    }
  }
  return state;
}

function normalizeAssignmentPacket(packet) {
  const packetId = controlledId(packet?.packetId, "packetId");
  const raterId = controlledId(packet?.raterId, "raterId");
  const positionId = controlledId(packet?.positionId, "positionId");
  const critiqueIds = normalizeIds(packet?.critiqueIds).sort();
  if (critiqueIds.length !== 4 || new Set(critiqueIds).size !== 4 || critiqueIds.some((id) => !controlledIdValue(id))) {
    throw serviceError(400, "invalid_assignment_packet", "An assignment packet must contain exactly four unique controlled critique IDs.");
  }
  const canonical = { packetId, raterId, positionId, critiqueIds };
  const packetSha256 = sha256(canonicalStringify(canonical));
  if (packet?.packetSha256 && packet.packetSha256 !== packetSha256) {
    throw serviceError(400, "assignment_packet_hash_mismatch", "The assignment packet hash does not match its canonical content.");
  }
  return {
    ...canonical,
    packetSha256,
    frozen: true,
    syntheticOnly: true,
    ratingWorkAuthorized: false,
    researchStartAuthorized: false,
  };
}

function normalizeSelfCheckSelectionReport(report, assignmentPackets) {
  if (report?.report_version !== "pilot-self-check-selection-v1") {
    throw serviceError(400, "invalid_self_check_selection", "Selection report must identify pilot-self-check-selection-v1.");
  }
  if (report?.rating_work_authorized !== false || report?.research_start_authorized !== false || report?.payment_authorized !== false) {
    throw serviceError(400, "selection_authorization_violation", "Selection registration must not authorize rating work, research, or payment.");
  }
  if (report?.invariants?.selected_positions !== 6 || report?.invariants?.selected_critiques !== 12 || report?.invariants?.self_check_records !== 24) {
    throw serviceError(400, "selection_invariant_violation", "Selection report must preserve 6 positions, 12 critiques, and 24 self-check records.");
  }
  if (report?.invariants?.self_checks_per_core_rater !== 4 || report?.invariants?.selected_positions_per_core_rater !== 2) {
    throw serviceError(400, "selection_rater_balance_violation", "Selection report must preserve four checks and two selected positions per rater.");
  }
  const records = Array.isArray(report?.self_check_records) ? report.self_check_records.map((row) => ({
    selfCheckRecordId: controlledId(row.self_check_record_id, "self_check_record_id"),
    slotId: controlledId(row.slot_id, "slot_id"),
    positionId: controlledId(row.position_id, "position_id"),
    critiqueId: controlledId(row.critique_id, "critique_id"),
    raterId: controlledId(row.rater_id, "rater_id"),
    predecessorStage: row.predecessor_stage,
    requiredStage: row.required_stage,
    outcomeIndependentSelection: row.outcome_independent_selection,
  })) : [];
  if (records.length !== 24 || new Set(records.map((row) => row.selfCheckRecordId)).size !== 24) {
    throw serviceError(400, "selection_record_count_invalid", "Selection report must contain 24 unique controlled records.");
  }
  for (const record of records) {
    if (record.predecessorStage !== "initial" || record.requiredStage !== "blind_self_check" || record.outcomeIndependentSelection !== true) {
      throw serviceError(400, "selection_record_invalid", "Every selection record must require an outcome-independent blind self-check after an initial rating.");
    }
    const assignment = assignmentPackets.find((row) => (
      row.raterId === record.raterId && row.positionId === record.positionId && row.critiqueIds.includes(record.critiqueId)
    ));
    if (!assignment) throw serviceError(409, "selection_assignment_missing", "Every self-check selection record must match a registered assignment packet.");
  }
  const selectedPositions = Array.isArray(report?.selected_positions) ? structuredClone(report.selected_positions) : [];
  const controlledBody = { selected_positions: selectedPositions, self_check_records: report.self_check_records };
  const controlledManifestHash = sha256(canonicalStringify(controlledBody));
  if (report?.controlled_manifest_hash !== controlledManifestHash) {
    throw serviceError(400, "selection_manifest_hash_mismatch", "The self-check selection manifest hash does not match the controlled body.");
  }
  return {
    controlledManifestHash,
    selectedPositionSetHash: report.selected_position_set_hash,
    selectedCritiqueSetHash: report.selected_critique_set_hash,
    endpointContractSha256: report.endpoint_contract_sha256,
    selectionSeedSha256: report.selection_seed_sha256,
    records,
    invariants: structuredClone(report.invariants),
    frozenBeforeAnyPilotRating: true,
    outcomeIndependent: true,
    ratingWorkAuthorized: false,
    researchStartAuthorized: false,
    paymentAuthorized: false,
  };
}

function normalizeInitialRatingPayload(payload) {
  const raterId = controlledId(payload?.raterId, "raterId");
  const positionId = controlledId(payload?.positionId, "positionId");
  const critiqueId = controlledId(payload?.critiqueId, "critiqueId");
  const ratingId = payload?.ratingId ? controlledId(payload.ratingId, "ratingId") : null;
  const rubricVersion = String(payload?.rubricVersion ?? "").trim();
  if (rubricVersion !== "rubric-v2-seven-dimensional") {
    throw serviceError(400, "invalid_rubric_version", "Initial ratings must use rubric-v2-seven-dimensional.");
  }
  const scores = normalizeScores(payload?.scores);
  const critiqueTargetSummary = boundedText(payload?.critiqueTargetSummary, 10, 2000, "critique target summary");
  if (!PRICED_IN_ASSESSMENTS.includes(payload?.pricedInAssessment)) {
    throw serviceError(400, "invalid_priced_in_assessment", "Select no, partly, yes, or uncertain for priced-in assessment.");
  }
  if (!INTERPRETATION_CONFIDENCE_OPTIONS.includes(payload?.interpretationConfidence)) {
    throw serviceError(400, "invalid_interpretation_confidence", "Select high, medium, or low interpretation confidence.");
  }
  const backgroundAssumptions = String(payload?.backgroundAssumptions ?? "").trim();
  if (backgroundAssumptions.length > 4000) throw serviceError(400, "background_assumptions_too_long", "Background assumptions exceed 4000 characters.");
  if ((payload.interpretationConfidence === "low" || payload.pricedInAssessment === "uncertain") && backgroundAssumptions.length < 10) {
    throw serviceError(400, "background_assumptions_required", "Describe the relevant background assumptions for low confidence or uncertain priced-in status.");
  }
  const confidence = Number(payload?.confidence);
  if (!unitInterval(confidence)) throw serviceError(400, "invalid_confidence", "Rating confidence must lie in [0,1].");
  const timeSpentSeconds = Number(payload?.timeSpentSeconds);
  if (!Number.isInteger(timeSpentSeconds) || timeSpentSeconds <= 0 || timeSpentSeconds > 86400) {
    throw serviceError(400, "invalid_time_spent", "Time spent must be an integer from 1 to 86400 seconds.");
  }
  if (!VERIFICATION_STATUSES.includes(payload?.verificationStatus)) {
    throw serviceError(400, "invalid_verification_status", "Verification status is unsupported.");
  }
  const itemIntegrityFlags = normalizeIds(payload?.itemIntegrityFlags);
  if (new Set(itemIntegrityFlags).size !== itemIntegrityFlags.length || itemIntegrityFlags.some((flag) => !ITEM_INTEGRITY_FLAGS.includes(flag))) {
    throw serviceError(400, "invalid_item_integrity_flags", "Item-integrity flags are duplicated or unsupported.");
  }
  return {
    raterId,
    positionId,
    critiqueId,
    ratingId,
    rubricVersion,
    scores,
    overallRationale: boundedText(payload?.overallRationale, 40, 12000, "overall rationale"),
    confidence,
    timeSpentSeconds,
    verificationStatus: payload.verificationStatus,
    itemIntegrityFlags,
    critiqueTargetSummary,
    pricedInAssessment: payload.pricedInAssessment,
    interpretationConfidence: payload.interpretationConfidence,
    backgroundAssumptions,
    positionAmbiguity: booleanValue(payload?.positionAmbiguity, "positionAmbiguity"),
    critiqueAmbiguity: booleanValue(payload?.critiqueAmbiguity, "critiqueAmbiguity"),
    insufficientContext: booleanValue(payload?.insufficientContext, "insufficientContext"),
  };
}

function normalizeBlindSelfCheckPayload(payload) {
  const ratingId = payload?.ratingId ? controlledId(payload.ratingId, "ratingId") : null;
  const exposureAttestation = objectOrEmpty(payload?.exposureAttestation);
  for (const field of SELF_CHECK_EXPOSURE_FIELDS) {
    if (typeof exposureAttestation[field] !== "boolean") {
      throw serviceError(400, "incomplete_self_check_exposure_attestation", `Self-check exposure attestation must include ${field}.`);
    }
  }
  const confidence = Number(payload?.confidence);
  if (!unitInterval(confidence)) throw serviceError(400, "invalid_confidence", "Rating confidence must lie in [0,1].");
  const timeSpentSeconds = Number(payload?.timeSpentSeconds);
  if (!Number.isInteger(timeSpentSeconds) || timeSpentSeconds <= 0 || timeSpentSeconds > 86400) {
    throw serviceError(400, "invalid_time_spent", "Time spent must be an integer from 1 to 86400 seconds.");
  }
  const reason = String(payload?.objectLevelRevisionReason ?? "").trim();
  return {
    ratingId,
    raterId: controlledId(payload?.raterId, "raterId"),
    positionId: controlledId(payload?.positionId, "positionId"),
    critiqueId: controlledId(payload?.critiqueId, "critiqueId"),
    predecessorRatingId: controlledId(payload?.predecessorRatingId, "predecessorRatingId"),
    selfCheckSelectionRecordId: controlledId(payload?.selfCheckSelectionRecordId, "selfCheckSelectionRecordId"),
    scores: normalizeScores(payload?.scores),
    overallRationale: boundedText(payload?.overallRationale, 40, 12000, "overall rationale"),
    confidence,
    timeSpentSeconds,
    objectLevelRevisionReason: reason || null,
    exposureAttestation: Object.fromEntries(SELF_CHECK_EXPOSURE_FIELDS.map((field) => [field, exposureAttestation[field]])),
  };
}

function publicAssignmentPacket(packet) {
  return {
    packetId: packet.packetId,
    raterId: packet.raterId,
    positionId: packet.positionId,
    critiqueIds: [...packet.critiqueIds],
    packetSha256: packet.packetSha256,
    frozen: true,
    syntheticOnly: true,
    ratingWorkAuthorized: false,
    researchStartAuthorized: false,
  };
}

function publicSelfCheckSelection(selection) {
  return {
    controlledManifestHash: selection.controlledManifestHash,
    selectedPositionSetHash: selection.selectedPositionSetHash,
    selectedCritiqueSetHash: selection.selectedCritiqueSetHash,
    selectionSeedSha256: selection.selectionSeedSha256,
    recordCount: selection.records.length,
    invariants: structuredClone(selection.invariants),
    frozenBeforeAnyPilotRating: true,
    outcomeIndependent: true,
    ratingWorkAuthorized: false,
    researchStartAuthorized: false,
    paymentAuthorized: false,
  };
}

function publicPositionConclusion(record) {
  return {
    conclusionId: record.conclusionId,
    raterId: record.raterId,
    positionId: record.positionId,
    summary: record.summary,
    summarySha256: record.summarySha256,
    lockedAt: record.lockedAt,
    immutable: true,
    lockedBeforeFirstSiblingRating: true,
  };
}

function publicOwnRating(rating) {
  return structuredClone(rating);
}

function toAnalysisRating(row) {
  return {
    rating_id: row.ratingId,
    position_id: row.positionId,
    critique_id: row.critiqueId,
    rater_id: row.raterId,
    stage: row.stage,
    version: row.version,
    predecessor_rating_id: row.predecessorRatingId,
    self_check_selection_record_id: row.selfCheckSelectionRecordId ?? null,
    rubric_version: row.rubricVersion,
    scores: structuredClone(row.scores),
    overall_rationale: row.overallRationale,
    confidence: row.confidence,
    time_spent_seconds: row.timeSpentSeconds,
    verification_status: row.verificationStatus ?? "not_applicable",
    item_integrity_flags: [...(row.itemIntegrityFlags ?? [])],
    accepted: row.accepted,
    locked_at: row.lockedAt,
    object_level_revision_reason: row.objectLevelRevisionReason,
    position_conclusion_summary: row.positionConclusionSummary,
    position_conclusion_locked_at: row.positionConclusionLockedAt,
    critique_target_summary: row.critiqueTargetSummary,
    priced_in_assessment: row.pricedInAssessment,
    interpretation_confidence: row.interpretationConfidence,
    background_assumptions: row.backgroundAssumptions,
    position_ambiguity: row.positionAmbiguity,
    critique_ambiguity: row.critiqueAmbiguity,
    insufficient_context: row.insufficientContext,
    interpretation_fingerprint_locked_before_peer_exposure: row.interpretationFingerprintLockedBeforePeerExposure,
    scores_changed: row.scoresChanged,
    initial_rating_preserved: row.initialRatingPreserved,
    exposure_attestation: row.exposureAttestation ? structuredClone(row.exposureAttestation) : undefined,
  };
}

function normalizeScores(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw serviceError(400, "invalid_scores", "Scores must be an object.");
  }
  const scores = {};
  for (const dimension of SCORE_DIMENSIONS) {
    const score = Number(value[dimension]);
    if (!unitInterval(score)) throw serviceError(400, "invalid_scores", `${dimension} must lie in [0,1].`);
    scores[dimension] = score;
  }
  return scores;
}

function scoreVectorsDiffer(left, right) {
  return SCORE_DIMENSIONS.some((dimension) => Math.abs(Number(left?.[dimension]) - Number(right?.[dimension])) > 1e-12);
}

function boundedText(value, minimum, maximum, label) {
  const normalized = String(value ?? "").trim();
  if (normalized.length < minimum || normalized.length > maximum) {
    throw serviceError(400, "invalid_text", `${label} must contain ${minimum}-${maximum} characters.`);
  }
  return normalized;
}

function booleanValue(value, label) {
  if (typeof value !== "boolean") throw serviceError(400, "invalid_boolean", `${label} must be boolean.`);
  return value;
}

function controlledId(value, label) {
  const normalized = cleanId(value);
  if (!controlledIdValue(normalized)) throw serviceError(400, "invalid_identifier", `${label} must be a controlled identifier.`);
  return normalized;
}

function controlledIdValue(value) {
  return nonEmptyString(value) && !/\s|@/.test(value);
}

function serviceError(status, code, message, details = {}) {
  return new PilotEndpointServiceError(status, code, message, details);
}

function unitInterval(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeIds(value) {
  return Array.isArray(value) ? value.map(cleanId).filter(Boolean) : [];
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function canonicalStringify(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}
