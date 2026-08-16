export const PILOT_ENDPOINT_FORM_VERSION = "pilot-endpoint-form-v1-2026-08-16";
export const PILOT_ENDPOINT_SCORE_DIMENSIONS = Object.freeze([
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "overall",
]);
export const PILOT_ENDPOINT_PRICED_IN_OPTIONS = Object.freeze([
  { value: "no", label: "No" },
  { value: "partly", label: "Partly" },
  { value: "yes", label: "Yes" },
  { value: "uncertain", label: "Uncertain" },
]);
export const PILOT_ENDPOINT_INTERPRETATION_CONFIDENCE_OPTIONS = Object.freeze([
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]);
export const PILOT_ENDPOINT_CAUSE_CODES = Object.freeze([
  "compatible_interpretations",
  "material_position_conclusion_difference",
  "material_critique_target_or_claim_difference",
  "priced_in_disagreement",
  "background_assumption_disagreement",
  "score_calibration_or_rubric_allocation_only",
  "substantive_object_level_disagreement",
  "mixed_cause",
  "unresolved_or_indeterminate",
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
const FORBIDDEN_CAUSE_PACKET_KEYS = new Set([
  "rater_id",
  "rater_ids",
  "scores",
  "score_vector",
  "score_vectors",
  "score_gap",
  "score_gaps",
  "overall_gap",
  "impact_gap",
  "model_judgments",
  "acquisition_strata",
  "aggregate_results",
  "adjudication_outcomes",
  "other_adjudicator_code",
  "other_adjudicator_rationale",
]);

export function createInitialEndpointFormModel({
  positionId,
  critiqueId,
  positionConclusion = null,
  isFirstSibling = positionConclusion === null,
}) {
  const conclusionLocked = Boolean(positionConclusion?.immutable && positionConclusion?.summary);
  return {
    formVersion: PILOT_ENDPOINT_FORM_VERSION,
    formKind: "blind_initial_with_interpretation_fingerprint",
    task: {
      title: "Rate this critique independently",
      summary: "First record how you understand the position and what the critique attacks. Then apply the seven rating dimensions.",
      submissionConsequence: "Submission locks the blind initial rating. It cannot be overwritten; later reconsideration creates a separate record.",
      sourceAndPeerDataHidden: true,
    },
    item: {
      positionId,
      critiqueId,
      shortReferenceOnly: true,
    },
    interpretation: {
      positionConclusionSummary: {
        required: isFirstSibling && !conclusionLocked,
        editable: !conclusionLocked,
        value: conclusionLocked ? positionConclusion.summary : "",
        minimumCharacters: 10,
        maximumCharacters: 2000,
        help: "State the position's bounded conclusion as written. Reuse this locked statement for the other three sibling critiques.",
      },
      critiqueTargetSummary: {
        required: true,
        minimumCharacters: 10,
        maximumCharacters: 2000,
        help: "State which claim or part of the position the critique attacks.",
      },
      pricedInAssessment: {
        required: true,
        options: PILOT_ENDPOINT_PRICED_IN_OPTIONS,
        help: "Is the critique's point already acknowledged or clearly anticipated by the position?",
      },
      interpretationConfidence: {
        required: true,
        options: PILOT_ENDPOINT_INTERPRETATION_CONFIDENCE_OPTIONS,
      },
      backgroundAssumptions: {
        requiredWhen: [
          { field: "interpretationConfidence", equals: "low" },
          { field: "pricedInAssessment", equals: "uncertain" },
        ],
        maximumCharacters: 4000,
        help: "Record assumptions that materially affect how the position or critique is read.",
      },
      flags: [
        { key: "positionAmbiguity", label: "The position remains materially ambiguous" },
        { key: "critiqueAmbiguity", label: "The critique remains materially ambiguous" },
        { key: "insufficientContext", label: "The supplied context is insufficient" },
      ],
    },
    rating: {
      dimensions: PILOT_ENDPOINT_SCORE_DIMENSIONS.map((key) => ({
        key,
        minimum: 0,
        maximum: 1,
        step: 0.01,
        initialState: "unset",
        required: true,
      })),
      overallRationale: { required: true, minimumCharacters: 40, maximumCharacters: 12000 },
      confidence: { required: true, minimum: 0, maximum: 1 },
      timeSpentSeconds: { required: true, minimum: 1, maximum: 86400 },
    },
    visibility: hiddenPrePeerVisibility(),
    authorization: failClosedAuthorization(),
  };
}

export function validateInitialEndpointFormPayload(payload, options = {}) {
  const errors = {};
  const positionConclusionAlreadyLocked = options.positionConclusionAlreadyLocked === true;
  const positionConclusionSummary = String(payload?.positionConclusionSummary ?? "").trim();
  if (!positionConclusionAlreadyLocked && !textWithin(positionConclusionSummary, 10, 2000)) {
    errors.positionConclusionSummary = "State the position conclusion in 10–2000 characters before the first sibling rating.";
  }
  if (!textWithin(String(payload?.critiqueTargetSummary ?? "").trim(), 10, 2000)) {
    errors.critiqueTargetSummary = "State what the critique attacks in 10–2000 characters.";
  }
  if (!PILOT_ENDPOINT_PRICED_IN_OPTIONS.some((option) => option.value === payload?.pricedInAssessment)) {
    errors.pricedInAssessment = "Select no, partly, yes, or uncertain.";
  }
  if (!PILOT_ENDPOINT_INTERPRETATION_CONFIDENCE_OPTIONS.some((option) => option.value === payload?.interpretationConfidence)) {
    errors.interpretationConfidence = "Select high, medium, or low.";
  }
  const backgroundAssumptions = String(payload?.backgroundAssumptions ?? "").trim();
  if (backgroundAssumptions.length > 4000) errors.backgroundAssumptions = "Background assumptions exceed 4000 characters.";
  if (
    (payload?.interpretationConfidence === "low" || payload?.pricedInAssessment === "uncertain")
    && backgroundAssumptions.length < 10
  ) {
    errors.backgroundAssumptions = "Explain the relevant assumptions for low confidence or uncertain priced-in status.";
  }
  for (const field of ["positionAmbiguity", "critiqueAmbiguity", "insufficientContext"]) {
    if (typeof payload?.[field] !== "boolean") errors[field] = "Select yes or no.";
  }
  validateScoreVector(payload?.scores, errors);
  if (!textWithin(String(payload?.overallRationale ?? "").trim(), 40, 12000)) {
    errors.overallRationale = "Provide 40–12000 characters of object-level reasoning.";
  }
  const confidence = Number(payload?.confidence);
  if (!unitInterval(confidence)) errors.confidence = "Confidence must lie in [0, 1].";
  const timeSpentSeconds = Number(payload?.timeSpentSeconds);
  if (!Number.isInteger(timeSpentSeconds) || timeSpentSeconds < 1 || timeSpentSeconds > 86400) {
    errors.timeSpentSeconds = "Time spent must be an integer from 1 to 86400 seconds.";
  }
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    interpretationFingerprintReady: ![
      "positionConclusionSummary",
      "critiqueTargetSummary",
      "pricedInAssessment",
      "interpretationConfidence",
      "backgroundAssumptions",
      "positionAmbiguity",
      "critiqueAmbiguity",
      "insufficientContext",
    ].some((field) => field in errors),
  };
}

export function createBlindSelfCheckFormModel({ selectionRecord, initialRating }) {
  return {
    formVersion: PILOT_ENDPOINT_FORM_VERSION,
    formKind: "blind_self_check",
    task: {
      title: "Re-read your own rating without outside signals",
      summary: "Review the same position and critique independently. Peer ratings, model judgments, aggregates, cause codes, discussion, and adjudication remain hidden.",
      submissionConsequence: "Submission appends a self-check record linked to the immutable initial rating. It never replaces the initial.",
    },
    selection: {
      selfCheckSelectionRecordId: selectionRecord?.selfCheckRecordId,
      requiredStage: "blind_self_check",
      outcomeIndependentSelection: true,
    },
    predecessor: {
      ratingId: initialRating?.ratingId,
      stage: initialRating?.stage,
      version: initialRating?.version,
      scores: structuredClone(initialRating?.scores ?? {}),
      ownRatingOnly: true,
    },
    rating: {
      dimensions: PILOT_ENDPOINT_SCORE_DIMENSIONS.map((key) => ({
        key,
        minimum: 0,
        maximum: 1,
        step: 0.01,
        initialState: "unset",
        required: true,
      })),
      overallRationale: { required: true, minimumCharacters: 40, maximumCharacters: 12000 },
      objectLevelRevisionReason: {
        requiredWhenScoresChange: true,
        prohibitedWhenScoresDoNotChange: true,
      },
      confidence: { required: true, minimum: 0, maximum: 1 },
      timeSpentSeconds: { required: true, minimum: 1, maximum: 86400 },
    },
    exposureAttestation: Object.fromEntries(SELF_CHECK_EXPOSURE_FIELDS.map((field) => [field, false])),
    visibility: hiddenPrePeerVisibility(),
    authorization: failClosedAuthorization(),
  };
}

export function validateBlindSelfCheckFormPayload(payload, initialRating) {
  const errors = {};
  validateScoreVector(payload?.scores, errors);
  if (!textWithin(String(payload?.overallRationale ?? "").trim(), 40, 12000)) {
    errors.overallRationale = "Provide 40–12000 characters of object-level reasoning.";
  }
  const confidence = Number(payload?.confidence);
  if (!unitInterval(confidence)) errors.confidence = "Confidence must lie in [0, 1].";
  const timeSpentSeconds = Number(payload?.timeSpentSeconds);
  if (!Number.isInteger(timeSpentSeconds) || timeSpentSeconds < 1 || timeSpentSeconds > 86400) {
    errors.timeSpentSeconds = "Time spent must be an integer from 1 to 86400 seconds.";
  }
  for (const field of SELF_CHECK_EXPOSURE_FIELDS) {
    if (payload?.exposureAttestation?.[field] !== false) errors[`exposureAttestation.${field}`] = "Blind self-check requires this exposure state to remain false.";
  }
  const changed = scoreVectorsDiffer(initialRating?.scores, payload?.scores);
  const reason = String(payload?.objectLevelRevisionReason ?? "").trim();
  if (changed && reason.length < 10) errors.objectLevelRevisionReason = "Explain the object-level reason for a changed score.";
  if (!changed && reason.length > 0) errors.objectLevelRevisionReason = "Do not enter a revision reason when the score vector is unchanged.";
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    scoresChanged: changed,
  };
}

export function createInterpretationCauseCodingFormModel(packet) {
  const forbidden = findKeys(packet, FORBIDDEN_CAUSE_PACKET_KEYS);
  if (forbidden.length) throw new Error(`Cause-coding packet exposes prohibited fields: ${forbidden.join(", ")}`);
  if (!Array.isArray(packet?.fingerprints) || packet.fingerprints.length !== 2) {
    throw new Error("Cause-coding packet must contain exactly two role-masked interpretation fingerprints.");
  }
  const roleMasks = packet.fingerprints.map((fingerprint) => fingerprint.role_mask).sort();
  if (roleMasks[0] !== "RATER_A" || roleMasks[1] !== "RATER_B") {
    throw new Error("Cause-coding packet must contain RATER_A and RATER_B exactly.");
  }
  return {
    formVersion: PILOT_ENDPOINT_FORM_VERSION,
    formKind: "initial_interpretation_cause_code",
    task: {
      title: "Classify the interpretation relationship before seeing scores",
      summary: "Compare the two role-masked readings. Code what explains their relationship without access to numeric ratings, model judgments, aggregates, or adjudication outcomes.",
      submissionConsequence: "Submission locks an immutable first cause code. Later reconciliation is separate and cannot overwrite it.",
    },
    item: {
      positionText: packet.position_text,
      critiqueText: packet.critique_text,
      topicFamily: packet.topic_family,
      pairCommitmentSha256: packet.pair_commitment_sha256,
    },
    fingerprints: structuredClone(packet.fingerprints),
    causeCodes: PILOT_ENDPOINT_CAUSE_CODES.map((value) => ({ value, label: causeCodeLabel(value) })),
    rationale: { required: true, minimumCharacters: 20, maximumCharacters: 8000 },
    visibility: {
      numericScoresVisible: false,
      scoreGapsVisible: false,
      otherAdjudicatorCodeVisible: false,
      modelJudgmentsVisible: false,
      acquisitionStrataVisible: false,
      aggregatePilotResultsVisible: false,
      adjudicationOutcomesVisible: false,
      raterIdentityVisible: false,
      raterSeniorityVisible: false,
    },
    authorization: failClosedAuthorization(),
  };
}

export function validateInterpretationCauseCodeFormPayload(payload) {
  const errors = {};
  const causeCodes = Array.isArray(payload?.causeCodes)
    ? payload.causeCodes.map((value) => String(value ?? "").trim()).filter(Boolean)
    : [];
  if (causeCodes.length === 0) errors.causeCodes = "Select at least one cause code.";
  if (new Set(causeCodes).size !== causeCodes.length) errors.causeCodes = "Cause codes must be unique.";
  if (causeCodes.some((value) => !PILOT_ENDPOINT_CAUSE_CODES.includes(value))) errors.causeCodes = "One or more cause codes are unsupported.";
  if (causeCodes.includes("compatible_interpretations") && causeCodes.length !== 1) {
    errors.causeCodes = "Compatible interpretations cannot be combined with another cause code.";
  }
  if (causeCodes.includes("unresolved_or_indeterminate") && causeCodes.length !== 1) {
    errors.causeCodes = "Unresolved or indeterminate cannot be combined with another cause code.";
  }
  if (!textWithin(String(payload?.rationale ?? "").trim(), 20, 8000)) {
    errors.rationale = "Provide 20–8000 characters of object-level coding rationale.";
  }
  return { ok: Object.keys(errors).length === 0, errors, causeCodes };
}

function hiddenPrePeerVisibility() {
  return {
    sourceVisible: false,
    tagsVisible: false,
    peerScoresVisible: false,
    peerRationalesVisible: false,
    peerFingerprintsVisible: false,
    modelJudgmentsVisible: false,
    aggregateResultsVisible: false,
    causeCodesVisible: false,
    discussionVisible: false,
    adjudicationStateVisible: false,
  };
}

function failClosedAuthorization() {
  return {
    participantAccessAuthorized: false,
    recruitmentAuthorized: false,
    researchStartAuthorized: false,
    paymentAuthorized: false,
    phase2Authorized: false,
  };
}

function validateScoreVector(scores, errors) {
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) {
    errors.scores = "Enter all seven scores.";
    return;
  }
  for (const dimension of PILOT_ENDPOINT_SCORE_DIMENSIONS) {
    const value = Number(scores[dimension]);
    if (!unitInterval(value)) errors[`scores.${dimension}`] = `${dimension} must lie in [0, 1].`;
  }
}

function scoreVectorsDiffer(left, right) {
  return PILOT_ENDPOINT_SCORE_DIMENSIONS.some((dimension) => (
    !Number.isFinite(Number(left?.[dimension]))
    || !Number.isFinite(Number(right?.[dimension]))
    || Math.abs(Number(left[dimension]) - Number(right[dimension])) > 1e-12
  ));
}

function causeCodeLabel(value) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function findKeys(value, forbiddenKeys, path = "$") {
  const found = [];
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => found.push(...findKeys(entry, forbiddenKeys, `${path}[${index}]`)));
    return found;
  }
  for (const [key, entry] of Object.entries(value)) {
    const keyPath = `${path}.${key}`;
    if (forbiddenKeys.has(key)) found.push(keyPath);
    found.push(...findKeys(entry, forbiddenKeys, keyPath));
  }
  return found;
}

function textWithin(value, minimum, maximum) {
  return typeof value === "string" && value.trim().length >= minimum && value.trim().length <= maximum;
}

function unitInterval(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}
