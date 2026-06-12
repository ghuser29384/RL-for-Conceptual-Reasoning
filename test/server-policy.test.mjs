import test from "node:test";
import assert from "node:assert/strict";

import {
  createAuditEvent,
  createBenchmarkExposureEvent,
  createCertificationAuditEvent,
  createSourceStyleAuditEvent,
  demoUsers,
  signSessionToken,
  validateBenchmarkExposurePayload,
  validateCertificationAttemptPayload,
  validatePostLockSourceStyleAuditPayload,
  validateRatingActor,
  validateRatingPayload,
  validateSourceStyleAuditActor,
  verifySessionToken,
} from "../src/server.mjs";

test("server policy accepts valid blind ratings and hashes audit payloads", () => {
  const rating = validBlindRating("rating-policy-test");
  const validation = validateRatingPayload(rating, "blind_initial_submitted");
  assert.equal(validation.ok, true);

  const event = createAuditEvent("blind_initial_submitted", "graduate", rating, { socket: { remoteAddress: "127.0.0.1" } });
  assert.equal(event.type, "blind_initial_submitted");
  assert.equal(event.actorRole, "graduate");
  assert.match(event.id, /^[0-9a-f-]{36}$/);
  assert.match(event.actorHash, /^sha256:/);
  assert.match(event.payloadHash, /^sha256:/);
  assert.equal(event.accessAudit.blindInitialMetadataWithheld, true);
  assert.equal(event.accessAudit.sourceMetadataAcceptedFromRater, false);
});

test("server policy signs, verifies, rejects tampered, and expires session tokens", () => {
  const secret = "unit-test-secret";
  const user = demoUsers.find((item) => item.id === "demo-rater");
  const token = signSessionToken(user, secret, { issuedAt: 1000, expiresAt: 2000, nonce: "fixed" });
  const verified = verifySessionToken(token, secret, 1500);
  assert.equal(verified.ok, true);
  assert.equal(verified.user.id, "demo-rater");

  assert.equal(verifySessionToken(`${token}x`, secret, 1500).ok, false);
  assert.equal(verifySessionToken(token, "wrong-secret", 1500).error, "invalid_session_signature");
  assert.equal(verifySessionToken(token, secret, 2500).error, "session_expired");
});

test("server policy rejects hidden metadata in rater submissions", () => {
  const rating = {
    ...validBlindRating("rating-hidden-policy"),
    adminTags: ["hidden-benchmark-candidate"],
  };
  const validation = validateRatingPayload(rating, "blind_initial_submitted");
  assert.equal(validation.ok, false);
  assert.match(validation.detail, /hidden metadata/);
});

test("server policy rejects endpoint/kind mismatches and incomplete full-rubric scores", () => {
  const wrongKind = validateRatingPayload({ ...validBlindRating("rating-wrong-kind"), kind: "revision" }, "blind_initial_submitted");
  assert.equal(wrongKind.ok, false);
  assert.match(wrongKind.detail, /kind=blind_initial/);

  const missingScore = validBlindRating("rating-missing-score");
  missingScore.scores.strength = null;
  const validation = validateRatingPayload(missingScore, "blind_initial_submitted");
  assert.equal(validation.ok, false);
  assert.match(validation.detail, /full-rubric rating requires valid scores/);
});

test("server policy requires rating context snapshots to include the rated critique", () => {
  const unknownContext = validateRatingPayload({ ...validBlindRating("rating-context-unknown"), ratingContextSnapshotId: "missing-context" }, "blind_initial_submitted");
  assert.equal(unknownContext.ok, false);
  assert.match(unknownContext.detail, /unknown ratingContextSnapshotId/);

  const wrongCritiqueContext = validateRatingPayload(
    {
      ...validBlindRating("rating-context-wrong-critique"),
      assignmentId: "assign-ai-base-rate",
      critiqueId: "crit-ai-generic",
      critiqueTextVersionId: "ctv-ai-generic-v1",
      ratingContextSnapshotId: "rc-target-only-1",
    },
    "blind_initial_submitted",
  );
  assert.equal(wrongCritiqueContext.ok, false);
  assert.match(wrongCritiqueContext.detail, /include the rated critique/);
});

test("server policy requires valid rating effort telemetry", () => {
  const missingTelemetry = validBlindRating("rating-missing-effort");
  delete missingTelemetry.activeSeconds;
  const missingValidation = validateRatingPayload(missingTelemetry, "blind_initial_submitted");
  assert.equal(missingValidation.ok, false);
  assert.match(missingValidation.detail, /activeSeconds/);

  const invalidTelemetry = { ...validBlindRating("rating-invalid-effort"), idleGapSeconds: -1, interruptionCount: 0.5 };
  const invalidValidation = validateRatingPayload(invalidTelemetry, "blind_initial_submitted");
  assert.equal(invalidValidation.ok, false);
  assert.match(invalidValidation.detail, /idleGapSeconds/);
});

test("server policy validates optional structured correctness verification status", () => {
  const rating = {
    ...validBlindRating("rating-verification-status"),
    correctnessVerificationStatus: "unresolved",
    correctnessVerificationNote: "Needs a linked VerificationRecord before validation use.",
  };
  assert.equal(validateRatingPayload(rating, "blind_initial_submitted").ok, true);

  const invalidStatus = validateRatingPayload({ ...rating, id: "rating-verification-status-bad", correctnessVerificationStatus: "needs_check" }, "blind_initial_submitted");
  assert.equal(invalidStatus.ok, false);
  assert.match(invalidStatus.detail, /unsupported correctnessVerificationStatus/);
});

test("server policy validates structured rater issue flags", () => {
  const rating = {
    ...validBlindRating("rating-issue-flags"),
    flags: {
      needsVerification: true,
      correctnessNotAssessableDueToClarity: false,
      vagueGoodObjectionGesture: true,
      midRangeStrengthUncertainty: true,
      backgroundKnowledgeDependence: false,
    },
  };
  assert.equal(validateRatingPayload(rating, "blind_initial_submitted").ok, true);

  const unknownFlag = validateRatingPayload(
    { ...rating, id: "rating-issue-flags-unknown", flags: { ...rating.flags, sourceVisibleConcern: true } },
    "blind_initial_submitted",
  );
  assert.equal(unknownFlag.ok, false);
  assert.match(unknownFlag.detail, /unsupported rating flags/);

  const nonBooleanFlag = validateRatingPayload(
    { ...rating, id: "rating-issue-flags-nonboolean", flags: { ...rating.flags, needsVerification: "yes" } },
    "blind_initial_submitted",
  );
  assert.equal(nonBooleanFlag.ok, false);
  assert.match(nonBooleanFlag.detail, /rating flags must be boolean/);
});

test("server policy accepts low-clarity branch with provisional non-clarity dimensions", () => {
  const rating = validBlindRating("rating-low-clarity");
  rating.scores = {
    centrality: null,
    strength: null,
    correctness: 0.5,
    clarity: 0.32,
    dead_weight: null,
    single_issue: null,
    overall: 0.12,
  };
  rating.provisionalDimensions = ["centrality", "strength", "dead_weight", "single_issue"];
  const validation = validateRatingPayload(rating, "blind_initial_submitted");
  assert.equal(validation.ok, true);
});

test("server policy prevents rater impersonation and unassigned assignment writes", () => {
  const demoRater = demoUsers.find((item) => item.id === "demo-rater");
  const demoAdmin = demoUsers.find((item) => item.id === "demo-admin");
  assert.equal(validateRatingActor(validBlindRating("rating-actor-ok"), demoRater).ok, true);
  assert.equal(validateRatingActor({ ...validBlindRating("rating-actor-admin"), raterId: "someone-else" }, demoAdmin).ok, true);

  const impersonation = validateRatingActor({ ...validBlindRating("rating-actor-bad"), raterId: "another-rater" }, demoRater);
  assert.equal(impersonation.ok, false);
  assert.match(impersonation.detail, /must match/);

  const unassigned = validateRatingActor({ ...validBlindRating("rating-actor-unassigned"), assignmentId: "assign-mind-zombie" }, demoRater);
  assert.equal(unassigned.ok, false);
  assert.match(unassigned.detail, /not assigned/);
});

test("server policy accepts only post-lock diagnostic source/style audits", () => {
  const rating = validBlindRating("rating-source-style-lock");
  const audit = validSourceStyleAudit("source-style-policy-test", rating);
  assert.equal(validatePostLockSourceStyleAuditPayload(audit, [rating]).ok, true);

  const actor = demoUsers.find((item) => item.id === "demo-rater");
  assert.equal(validateSourceStyleAuditActor(audit, actor).ok, true);
  const event = createSourceStyleAuditEvent("post_lock_source_style_audit_submitted", actor, audit, { socket: { remoteAddress: "127.0.0.1" } });
  assert.equal(event.type, "post_lock_source_style_audit_submitted");
  assert.equal(event.accessAudit.diagnosticOnly, true);
  assert.equal(event.accessAudit.sourceMetadataAcceptedFromRater, false);
  assert.match(event.payloadHash, /^sha256:/);

  const preLock = validatePostLockSourceStyleAuditPayload({ ...audit, id: "source-style-prelock", collectedAt: "2026-06-11T13:59:00.000Z" }, [rating]);
  assert.equal(preLock.ok, false);
  assert.match(preLock.detail, /after the initial rating lock/);

  const hiddenMetadata = validatePostLockSourceStyleAuditPayload({ ...audit, id: "source-style-hidden", sourceType: "llm_generated" }, [rating]);
  assert.equal(hiddenMetadata.ok, false);
  assert.match(hiddenMetadata.detail, /hidden\/raw metadata/);

  const impersonation = validateSourceStyleAuditActor({ ...audit, raterId: "other-rater" }, actor);
  assert.equal(impersonation.ok, false);
  assert.match(impersonation.detail, /must match/);
});

test("server policy validates and audits certification attempts", () => {
  const attempt = validCertificationAttempt("cert-policy-attempt");
  const validation = validateCertificationAttemptPayload(attempt);
  assert.equal(validation.ok, true);
  const actor = demoUsers.find((item) => item.id === "demo-rater");
  const event = createCertificationAuditEvent("certification_attempt_submitted", actor, attempt, { status: "certified" }, { socket: { remoteAddress: "127.0.0.1" } });
  assert.equal(event.type, "certification_attempt_submitted");
  assert.match(event.payloadHash, /^sha256:/);
  assert.equal(event.accessAudit.trainingExposureOnly, true);
  assert.equal(event.accessAudit.protectedEvaluationUseAllowed, false);
});

test("server policy rejects malformed certification attempts", () => {
  const attempt = validCertificationAttempt("cert-policy-bad");
  attempt.itemResults[0].dimensionErrors.correctness = null;
  const validation = validateCertificationAttemptPayload(attempt);
  assert.equal(validation.ok, false);
  assert.match(validation.detail, /dimensionErrors/);
});

test("server policy validates benchmark exposure logs without accepting hidden content", () => {
  const exposure = {
    action: "artifact_probe_run",
    artifactId: "hidden-benchmark-freeze-october-2026-demo",
    purpose: "authorized_artifact_probe",
    probeFamilies: ["critique_only", "metadata_style_only"],
    notes: "Authorized pre-freeze artifact probe record.",
  };
  assert.equal(validateBenchmarkExposurePayload(exposure).ok, true);
  const actor = demoUsers.find((item) => item.id === "demo-admin");
  const event = createBenchmarkExposureEvent("benchmark_exposure_recorded", actor, exposure, { socket: { remoteAddress: "127.0.0.1" } });
  assert.equal(event.type, "benchmark_exposure_recorded");
  assert.equal(event.actorRole, "admin");
  assert.equal(event.action, "artifact_probe_run");
  assert.equal(event.accessAudit.rawHiddenContentAccepted, false);
  assert.match(event.payloadHash, /^sha256:/);

  const hiddenPayload = validateBenchmarkExposurePayload({
    ...exposure,
    positionText: "If two systems have exactly the same causal and functional organization...",
  });
  assert.equal(hiddenPayload.ok, false);
  assert.match(hiddenPayload.detail, /hidden\/raw content/);

  const metadataPayload = validateBenchmarkExposurePayload({ ...exposure, split: "hidden_benchmark" });
  assert.equal(metadataPayload.ok, false);
  assert.match(metadataPayload.detail, /hidden\/raw content|hidden metadata/);
});

function validBlindRating(id) {
  return {
    id,
    assignmentId: "assign-ai-base-rate",
    positionId: "pos-ai-prior",
    critiqueId: "crit-ai-base-rate",
    raterId: "demo-rater",
    raterTier: "graduate",
    kind: "blind_initial",
    rubricVersion: "lmca-app-f-2026-10",
    positionTextVersionId: "ptv-ai-prior-v1",
    critiqueTextVersionId: "ctv-ai-base-rate-v1",
    ratingContextSnapshotId: "rc-target-only-1",
    scores: {
      centrality: 0.7,
      strength: 0.68,
      correctness: 0.9,
      clarity: 0.88,
      dead_weight: 0.05,
      single_issue: 0.92,
      overall: 0.62,
    },
    provisionalDimensions: [],
    rationale: "Server-side audit policy test rating.",
    flags: {},
    activeSeconds: 620,
    idleGapSeconds: 10,
    interruptionCount: 0,
    submittedAt: "2026-06-11T14:00:00.000Z",
    lockedAt: "2026-06-11T14:00:00.000Z",
  };
}

function validCertificationAttempt(id) {
  return {
    id,
    raterId: "demo-rater",
    packId: "cert-tier-zero-2026-10",
    rubricVersion: "lmca-app-f-2026-10",
    submittedAt: "2026-06-11T14:00:00.000Z",
    goldItemsCompleted: 20,
    duplicateItemsCompleted: 5,
    hardAmbiguityItemsCompleted: 5,
    duplicateConsistencyMeanAbsDiff: 0.06,
    hardAmbiguityReviewPass: true,
    itemResults: [
      {
        itemId: "gold-ai-selectivity",
        dimensionErrors: {
          centrality: 0.08,
          strength: 0.1,
          correctness: 0.1,
          clarity: 0.04,
          dead_weight: 0.03,
          single_issue: 0.04,
          overall: 0.08,
        },
      },
    ],
  };
}

function validSourceStyleAudit(id, rating = validBlindRating("rating-source-style-lock")) {
  return {
    id,
    ratingId: rating.id,
    assignmentId: rating.assignmentId,
    positionId: rating.positionId,
    critiqueId: rating.critiqueId,
    raterId: rating.raterId,
    collectedAt: "2026-06-11T14:02:00.000Z",
    sourceGuess: "human_written",
    authorshipGuess: "expert",
    styleGuess: "direct",
    styleGuessConfidence: 0.72,
    collectionPhase: "post_initial_lock",
    shownBeforeInitialLock: false,
    usedForScoring: false,
    notes: "Policy test post-lock source/style guess.",
  };
}
