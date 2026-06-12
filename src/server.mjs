import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RATER_ISSUE_FLAG_DEFINITIONS,
  RUBRIC_DIMENSIONS,
  assignments,
  buildHiddenBenchmarkFreezeReport,
  buildRaterCertificationReport,
  buildTrainingExport,
  buildOctoberReleaseReport,
  createLabelSnapshot,
  critiques,
  isValidScore,
  positions,
  postLockSourceStyleAudits,
  ratingContextSnapshots,
  scoreCertificationAttempt,
  seedBenchmarkExposureEvents,
  seedCertificationAttempts,
  seedRatings,
} from "./domain/core.mjs";

const releaseId = "october-2026-demo";
export const demoUsers = [
  { id: "demo-rater", displayName: "Demo Graduate Rater", role: "graduate", allowedAssignmentIds: ["assign-ai-base-rate", "assign-voting-bullet"] },
  { id: "demo-expert", displayName: "Demo Expert Adjudicator", role: "expert", allowedAssignmentIds: ["assign-ai-base-rate", "assign-voting-bullet", "assign-mind-zombie"] },
  { id: "demo-admin", displayName: "Demo Release Admin", role: "admin", allowedAssignmentIds: ["*"] },
];

const hiddenMetadataKeys = new Set([
  "sourceCategory",
  "sourceType",
  "authorshipType",
  "styleBand",
  "adminTags",
  "split",
  "sourceModel",
  "generatorPromptVersion",
  "modelJudgeScore",
  "peerRatings",
  "candidateSelectionReason",
  "benchmarkStatus",
]);

const sourceStyleAuditSourceGuesses = new Set(["human_written", "expert_written", "llm_generated", "adapted_or_external", "unknown"]);
const sourceStyleAuditAuthorshipGuesses = new Set(["expert", "volunteer", "model", "adapted_source", "unknown"]);
const ratingVerificationStatuses = new Set(["not_needed", "verified", "not_practicable", "unresolved"]);
const allowedRatingFlagKeys = new Set(RATER_ISSUE_FLAG_DEFINITIONS.map((definition) => definition.key));

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

export function createLmcaServer(options = {}) {
  const rootDir = resolve(options.rootDir ?? resolve(import.meta.dirname, ".."));
  const auditDir = resolve(options.auditDir ?? join(rootDir, "data", "audit"));
  const auditLogPath = join(auditDir, "rating-events.jsonl");
  const certificationLogPath = join(auditDir, "certification-events.jsonl");
  const benchmarkLogPath = join(auditDir, "benchmark-exposure-events.jsonl");
  const sourceStyleAuditLogPath = join(auditDir, "source-style-audit-events.jsonl");
  const sessionSecret = options.sessionSecret ?? process.env.LMCA_SESSION_SECRET ?? "local-dev-session-secret-not-for-production";

  return createHttpServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url, { auditDir, auditLogPath, certificationLogPath, benchmarkLogPath, sourceStyleAuditLogPath, sessionSecret });
        return;
      }
      await serveStatic(response, rootDir, url.pathname);
    } catch (error) {
      sendJson(response, 500, {
        error: "internal_server_error",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

async function handleApi(request, response, url, context) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      releaseId,
      auditMode: "append_only_jsonl",
      authMode: "signed_demo_sessions",
      hiddenMetadataPolicy: "server_rejects_rater_submissions_with_admin_only_fields",
      benchmarkAccessPolicy: "admin_only_with_append_only_exposure_log",
      sourceStyleAuditPolicy: "optional_post_lock_diagnostic_only_append_log",
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/sessions") {
    const body = await readJsonBody(request);
    const user = demoUsers.find((item) => item.id === body.userId);
    if (!user) {
      sendJson(response, 401, { error: "unknown_demo_user" });
      return;
    }
    const token = signSessionToken(user, context.sessionSecret);
    sendJson(response, 201, { token, user, expiresInSeconds: 8 * 60 * 60 });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/release/report") {
    const persistedRatings = await readPersistedRatings(context.auditLogPath);
    const persistedCertificationAttempts = await readPersistedCertificationAttempts(context.certificationLogPath);
    const persistedBenchmarkExposureEvents = await readPersistedBenchmarkExposureEvents(context.benchmarkLogPath);
    const persistedSourceStyleAudits = await readPersistedSourceStyleAudits(context.sourceStyleAuditLogPath);
    const ratings = [...seedRatings, ...persistedRatings];
    const certificationAttempts = [...seedCertificationAttempts, ...persistedCertificationAttempts];
    const benchmarkExposureEvents = [...seedBenchmarkExposureEvents, ...persistedBenchmarkExposureEvents];
    const sourceStyleAudits = [...postLockSourceStyleAudits, ...persistedSourceStyleAudits];
    const snapshot = createLabelSnapshot(
      "snapshot-oct-api",
      releaseId,
      ratings,
      critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
      "initial_only",
    );
    sendJson(
      response,
      200,
      buildOctoberReleaseReport(releaseId, snapshot, ratings, positions, critiques, certificationAttempts, benchmarkExposureEvents, sourceStyleAudits),
    );
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/certification/status") {
    const session = authenticateRequest(request, context.sessionSecret);
    if (!session.ok) {
      sendJson(response, 401, { error: session.error });
      return;
    }
    const requestedRaterId = url.searchParams.get("raterId") ?? session.user.id;
    if (requestedRaterId !== session.user.id && session.user.role !== "admin") {
      sendJson(response, 403, { error: "admin_role_required_for_other_rater_certification" });
      return;
    }
    const persistedCertificationAttempts = await readPersistedCertificationAttempts(context.certificationLogPath);
    sendJson(response, 200, buildRaterCertificationReport(requestedRaterId, [...seedCertificationAttempts, ...persistedCertificationAttempts]));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/certification/attempts") {
    await recordCertificationAttemptEndpoint(request, response, context);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/benchmark/freeze-report") {
    await benchmarkFreezeReportEndpoint(request, response, context);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/benchmark/exposures") {
    await recordBenchmarkExposureEndpoint(request, response, context);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/training/export") {
    await trainingExportEndpoint(request, response, context);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/audit/events") {
    const session = authenticateRequest(request, context.sessionSecret);
    if (!session.ok) {
      sendJson(response, 401, { error: session.error });
      return;
    }
    if (session.user.role !== "admin") {
      sendJson(response, 403, { error: "admin_role_required" });
      return;
    }
    const events = await readAuditEvents(context.auditLogPath);
    sendJson(response, 200, { events });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ratings/blind") {
    await recordRatingEndpoint(request, response, context, "blind_initial_submitted");
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ratings/revisions") {
    await recordRatingEndpoint(request, response, context, "revision_submitted");
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/source-style/audits") {
    await recordSourceStyleAuditEndpoint(request, response, context);
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

async function recordRatingEndpoint(request, response, context, eventType) {
  const session = authenticateRequest(request, context.sessionSecret);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  const actor = session.user;
  if (!["rater", "graduate", "phd", "expert", "admin"].includes(actor.role)) {
    sendJson(response, 403, { error: "authorized_rater_role_required" });
    return;
  }

  const body = await readJsonBody(request);
  const rating = body.rating;
  const validation = validateRatingPayload(rating, eventType);
  if (!validation.ok) {
    sendJson(response, 400, { error: "invalid_rating_payload", detail: validation.detail });
    return;
  }
  const actorValidation = validateRatingActor(rating, actor);
  if (!actorValidation.ok) {
    sendJson(response, 403, { error: "rating_actor_not_authorized", detail: actorValidation.detail });
    return;
  }

  const event = createAuditEvent(eventType, actor, rating, request);
  await mkdir(context.auditDir, { recursive: true });
  await appendFile(context.auditLogPath, `${JSON.stringify(event)}\n`, "utf8");
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    ratingId: rating.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function recordSourceStyleAuditEndpoint(request, response, context) {
  const session = authenticateRequest(request, context.sessionSecret);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  const actor = session.user;
  if (!["rater", "graduate", "phd", "expert", "admin"].includes(actor.role)) {
    sendJson(response, 403, { error: "authorized_rater_role_required" });
    return;
  }

  const body = await readJsonBody(request);
  const audit = body.audit;
  const ratings = [...seedRatings, ...(await readPersistedRatings(context.auditLogPath))];
  const validation = validatePostLockSourceStyleAuditPayload(audit, ratings);
  if (!validation.ok) {
    sendJson(response, 400, { error: "invalid_source_style_audit", detail: validation.detail });
    return;
  }
  const actorValidation = validateSourceStyleAuditActor(audit, actor);
  if (!actorValidation.ok) {
    sendJson(response, 403, { error: "source_style_audit_actor_not_authorized", detail: actorValidation.detail });
    return;
  }

  const event = createSourceStyleAuditEvent("post_lock_source_style_audit_submitted", actor, audit, request);
  await mkdir(context.auditDir, { recursive: true });
  await appendFile(context.sourceStyleAuditLogPath, `${JSON.stringify(event)}\n`, "utf8");
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    auditId: audit.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function recordCertificationAttemptEndpoint(request, response, context) {
  const session = authenticateRequest(request, context.sessionSecret);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  const body = await readJsonBody(request);
  const attempt = body.attempt;
  const validation = validateCertificationAttemptPayload(attempt);
  if (!validation.ok) {
    sendJson(response, 400, { error: "invalid_certification_attempt", detail: validation.detail });
    return;
  }
  if (session.user.role !== "admin" && attempt.raterId !== session.user.id) {
    sendJson(response, 403, { error: "certification_actor_not_authorized", detail: `attempt.raterId must match ${session.user.id}` });
    return;
  }
  const scoredAttempt = scoreCertificationAttempt(attempt);
  const event = createCertificationAuditEvent("certification_attempt_submitted", session.user, attempt, scoredAttempt, request);
  await mkdir(context.auditDir, { recursive: true });
  await appendFile(context.certificationLogPath, `${JSON.stringify(event)}\n`, "utf8");
  const persistedAttempts = await readPersistedCertificationAttempts(context.certificationLogPath);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    attemptId: attempt.id,
    payloadHash: event.payloadHash,
    scoredAttempt,
    report: buildRaterCertificationReport(attempt.raterId, [...seedCertificationAttempts, ...persistedAttempts]),
  });
}

async function benchmarkFreezeReportEndpoint(request, response, context) {
  const session = authenticateRequest(request, context.sessionSecret);
  if (!session.ok) {
    await appendBenchmarkExposure(context, createBenchmarkExposureEvent("benchmark_access_denied", null, deniedBenchmarkExposure("freeze_report_read"), request, { allowed: false }));
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (session.user.role !== "admin") {
    await appendBenchmarkExposure(
      context,
      createBenchmarkExposureEvent("benchmark_access_denied", session.user, deniedBenchmarkExposure("freeze_report_read"), request, { allowed: false }),
    );
    sendJson(response, 403, { error: "admin_role_required_for_hidden_benchmark" });
    return;
  }
  const exposure = {
    action: "freeze_report_read",
    artifactId: `hidden-benchmark-freeze-${releaseId}`,
    purpose: "release_freeze",
    accessPhase: "pre_freeze",
  };
  await appendBenchmarkExposure(context, createBenchmarkExposureEvent("benchmark_exposure_recorded", session.user, exposure, request));
  sendJson(response, 200, await buildAdminBenchmarkFreezeReport(context));
}

async function recordBenchmarkExposureEndpoint(request, response, context) {
  const session = authenticateRequest(request, context.sessionSecret);
  if (!session.ok) {
    await appendBenchmarkExposure(context, createBenchmarkExposureEvent("benchmark_access_denied", null, deniedBenchmarkExposure("manual_exposure_record"), request, { allowed: false }));
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (session.user.role !== "admin") {
    await appendBenchmarkExposure(
      context,
      createBenchmarkExposureEvent("benchmark_access_denied", session.user, deniedBenchmarkExposure("manual_exposure_record"), request, { allowed: false }),
    );
    sendJson(response, 403, { error: "admin_role_required_for_hidden_benchmark" });
    return;
  }
  const body = await readJsonBody(request);
  const exposure = body.exposure;
  const validation = validateBenchmarkExposurePayload(exposure);
  if (!validation.ok) {
    sendJson(response, 400, { error: "invalid_benchmark_exposure", detail: validation.detail });
    return;
  }
  const event = createBenchmarkExposureEvent("benchmark_exposure_recorded", session.user, exposure, request);
  await appendBenchmarkExposure(context, event);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    payloadHash: event.payloadHash,
    report: await buildAdminBenchmarkFreezeReport(context),
  });
}

async function trainingExportEndpoint(request, response, context) {
  const session = authenticateRequest(request, context.sessionSecret);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (session.user.role !== "admin") {
    sendJson(response, 403, { error: "admin_role_required_for_training_export" });
    return;
  }
  sendJson(response, 200, await buildAdminTrainingExport(context));
}

export function validateRatingPayload(rating, eventType) {
  if (!rating || typeof rating !== "object" || Array.isArray(rating)) return invalid("rating object is required");
  const hiddenKeys = findHiddenKeys(rating);
  if (hiddenKeys.length) return invalid(`rater submissions cannot contain hidden metadata keys: ${hiddenKeys.join(", ")}`);
  const required = [
    "id",
    "assignmentId",
    "positionId",
    "critiqueId",
    "raterId",
    "kind",
    "rubricVersion",
    "positionTextVersionId",
    "critiqueTextVersionId",
    "ratingContextSnapshotId",
    "scores",
    "activeSeconds",
    "idleGapSeconds",
    "interruptionCount",
    "submittedAt",
    "lockedAt",
  ];
  const missing = required.filter((field) => rating[field] === undefined || rating[field] === null || rating[field] === "");
  if (missing.length) return invalid(`missing required fields: ${missing.join(", ")}`);
  if (eventType === "blind_initial_submitted" && rating.kind !== "blind_initial") return invalid("blind rating endpoint only accepts kind=blind_initial");
  if (eventType === "revision_submitted" && (rating.kind !== "revision" || !rating.parentRatingId)) {
    return invalid("revision endpoint requires kind=revision and parentRatingId");
  }
  if (!assignments.some((assignment) => assignment.id === rating.assignmentId)) return invalid(`unknown assignmentId: ${rating.assignmentId}`);
  if (!positions.some((position) => position.id === rating.positionId)) return invalid(`unknown positionId: ${rating.positionId}`);
  if (!critiques.some((critique) => critique.id === rating.critiqueId && critique.positionId === rating.positionId)) {
    return invalid(`critiqueId ${rating.critiqueId} does not belong to positionId ${rating.positionId}`);
  }
  const contextSnapshot = ratingContextSnapshots.find((snapshot) => snapshot.id === rating.ratingContextSnapshotId);
  if (!contextSnapshot) return invalid(`unknown ratingContextSnapshotId: ${rating.ratingContextSnapshotId}`);
  if (contextSnapshot.positionId !== rating.positionId) return invalid("ratingContextSnapshotId must belong to the rated position");
  if (!contextSnapshot.visibleCritiqueIds.includes(rating.critiqueId)) return invalid("ratingContextSnapshotId must include the rated critique");
  if (!rating.scores || typeof rating.scores !== "object" || Array.isArray(rating.scores)) return invalid("scores object is required");
  if (!isValidScore(rating.scores.clarity) || !isValidScore(rating.scores.overall)) return invalid("clarity and overall must be finite scores in [0, 1]");
  if (rating.scores.clarity >= 0.5) {
    const badFields = RUBRIC_DIMENSIONS.filter((dimension) => !isValidScore(rating.scores[dimension]));
    if (badFields.length) return invalid(`full-rubric rating requires valid scores for: ${badFields.join(", ")}`);
  }
  if (!Array.isArray(rating.provisionalDimensions)) return invalid("provisionalDimensions must be an array");
  if (rating.flags !== undefined) {
    if (!rating.flags || typeof rating.flags !== "object" || Array.isArray(rating.flags)) return invalid("flags must be an object when provided");
    const unknownFlags = Object.keys(rating.flags).filter((flag) => !allowedRatingFlagKeys.has(flag));
    if (unknownFlags.length) return invalid(`unsupported rating flags: ${unknownFlags.join(", ")}`);
    const nonBooleanFlags = Object.entries(rating.flags)
      .filter(([, value]) => typeof value !== "boolean")
      .map(([flag]) => flag);
    if (nonBooleanFlags.length) return invalid(`rating flags must be boolean: ${nonBooleanFlags.join(", ")}`);
  }
  if (!Number.isFinite(rating.activeSeconds) || rating.activeSeconds <= 0) return invalid("activeSeconds must be a positive number");
  if (!Number.isFinite(rating.idleGapSeconds) || rating.idleGapSeconds < 0) return invalid("idleGapSeconds must be a non-negative number");
  if (!Number.isInteger(rating.interruptionCount) || rating.interruptionCount < 0) return invalid("interruptionCount must be a non-negative integer");
  if (rating.correctnessVerificationStatus !== undefined && !ratingVerificationStatuses.has(rating.correctnessVerificationStatus)) {
    return invalid(`unsupported correctnessVerificationStatus: ${rating.correctnessVerificationStatus}`);
  }
  if (rating.correctnessVerificationNote !== undefined && (typeof rating.correctnessVerificationNote !== "string" || rating.correctnessVerificationNote.length > 500)) {
    return invalid("correctnessVerificationNote must be a short string");
  }
  return { ok: true };
}

export function validatePostLockSourceStyleAuditPayload(audit, ratings = seedRatings) {
  if (!audit || typeof audit !== "object" || Array.isArray(audit)) return invalid("audit object is required");
  const forbidden = findHiddenKeys(audit).concat(findRawBenchmarkContentKeys(audit));
  if (forbidden.length) return invalid(`source/style audits cannot contain hidden/raw metadata keys: ${forbidden.join(", ")}`);
  const required = [
    "id",
    "ratingId",
    "assignmentId",
    "positionId",
    "critiqueId",
    "raterId",
    "collectedAt",
    "sourceGuess",
    "authorshipGuess",
    "styleGuess",
    "styleGuessConfidence",
    "shownBeforeInitialLock",
    "usedForScoring",
  ];
  const missing = required.filter((field) => audit[field] === undefined || audit[field] === null || audit[field] === "");
  if (missing.length) return invalid(`missing required fields: ${missing.join(", ")}`);
  if (!sourceStyleAuditSourceGuesses.has(audit.sourceGuess)) return invalid(`unsupported sourceGuess: ${audit.sourceGuess}`);
  if (!sourceStyleAuditAuthorshipGuesses.has(audit.authorshipGuess)) return invalid(`unsupported authorshipGuess: ${audit.authorshipGuess}`);
  if (typeof audit.styleGuess !== "string" || audit.styleGuess.length > 80) return invalid("styleGuess must be a short string");
  if (!Number.isFinite(audit.styleGuessConfidence) || audit.styleGuessConfidence < 0 || audit.styleGuessConfidence > 1) {
    return invalid("styleGuessConfidence must be a finite score in [0, 1]");
  }
  if (audit.collectionPhase !== undefined && audit.collectionPhase !== "post_initial_lock") return invalid("collectionPhase must be post_initial_lock");
  if (audit.shownBeforeInitialLock !== false) return invalid("source/style audit controls must not be shown before initial lock");
  if (audit.usedForScoring !== false) return invalid("source/style audit guesses are diagnostic only and cannot be used for scoring");
  const rating = ratings.find((item) => item.id === audit.ratingId);
  if (!rating) return invalid(`unknown ratingId: ${audit.ratingId}`);
  if (rating.kind !== "blind_initial") return invalid("source/style audits must attach to a locked blind_initial rating");
  if (rating.assignmentId !== audit.assignmentId) return invalid("audit assignmentId must match the locked rating");
  if (rating.positionId !== audit.positionId) return invalid("audit positionId must match the locked rating");
  if (rating.critiqueId !== audit.critiqueId) return invalid("audit critiqueId must match the locked rating");
  if (rating.raterId !== audit.raterId) return invalid("audit raterId must match the locked rating");
  const collectedAt = Date.parse(audit.collectedAt);
  const lockedAt = Date.parse(rating.lockedAt);
  if (!Number.isFinite(collectedAt) || !Number.isFinite(lockedAt)) return invalid("collectedAt and rating.lockedAt must be valid timestamps");
  if (collectedAt < lockedAt) return invalid("source/style guesses can only be collected after the initial rating lock");
  return { ok: true };
}

export function validateCertificationAttemptPayload(attempt) {
  if (!attempt || typeof attempt !== "object" || Array.isArray(attempt)) return invalid("attempt object is required");
  const required = [
    "id",
    "raterId",
    "packId",
    "rubricVersion",
    "submittedAt",
    "goldItemsCompleted",
    "duplicateItemsCompleted",
    "hardAmbiguityItemsCompleted",
    "duplicateConsistencyMeanAbsDiff",
    "hardAmbiguityReviewPass",
    "itemResults",
  ];
  const missing = required.filter((field) => attempt[field] === undefined || attempt[field] === null || attempt[field] === "");
  if (missing.length) return invalid(`missing required fields: ${missing.join(", ")}`);
  if (!Array.isArray(attempt.itemResults) || attempt.itemResults.length === 0) return invalid("itemResults must be a non-empty array");
  if (typeof attempt.hardAmbiguityReviewPass !== "boolean") return invalid("hardAmbiguityReviewPass must be boolean");
  if (!isValidScore(attempt.duplicateConsistencyMeanAbsDiff)) return invalid("duplicateConsistencyMeanAbsDiff must be in [0, 1]");
  for (const result of attempt.itemResults) {
    if (!result.itemId || !result.dimensionErrors) return invalid("each itemResult needs itemId and dimensionErrors");
    const invalidDimensions = RUBRIC_DIMENSIONS.filter((dimension) => !isValidScore(result.dimensionErrors[dimension]));
    if (invalidDimensions.length) return invalid(`dimensionErrors must include scores in [0, 1] for: ${invalidDimensions.join(", ")}`);
  }
  try {
    scoreCertificationAttempt(attempt);
  } catch (error) {
    return invalid(error instanceof Error ? error.message : String(error));
  }
  return { ok: true };
}

export function validateBenchmarkExposurePayload(exposure) {
  if (!exposure || typeof exposure !== "object" || Array.isArray(exposure)) return invalid("exposure object is required");
  const forbidden = findHiddenKeys(exposure).concat(findRawBenchmarkContentKeys(exposure));
  if (forbidden.length) return invalid(`benchmark exposure logs cannot include hidden/raw content keys: ${forbidden.join(", ")}`);
  const required = ["action", "artifactId", "purpose"];
  const missing = required.filter((field) => exposure[field] === undefined || exposure[field] === null || exposure[field] === "");
  if (missing.length) return invalid(`missing required fields: ${missing.join(", ")}`);
  const allowedActions = new Set(["freeze_report_read", "manual_exposure_record", "membership_view", "artifact_probe_run", "rights_review", "post_freeze_access_review"]);
  if (!allowedActions.has(exposure.action)) return invalid(`unsupported benchmark action: ${exposure.action}`);
  const allowedPurposes = new Set(["release_freeze", "rights_review", "artifact_balance_audit", "authorized_artifact_probe", "access_audit_review", "incident_response"]);
  if (!allowedPurposes.has(exposure.purpose)) return invalid(`unsupported benchmark purpose: ${exposure.purpose}`);
  if (typeof exposure.artifactId !== "string" || !exposure.artifactId.startsWith("hidden-benchmark")) {
    return invalid("artifactId must reference a hidden-benchmark artifact without raw item contents");
  }
  if (exposure.probeFamilies !== undefined) {
    if (!Array.isArray(exposure.probeFamilies) || exposure.probeFamilies.some((item) => typeof item !== "string")) {
      return invalid("probeFamilies must be an array of strings");
    }
  }
  return { ok: true };
}

export function validateRatingActor(rating, actor) {
  if (!actor || typeof actor !== "object") return invalid("actor session is required");
  if (actor.role !== "admin" && rating.raterId !== actor.id) return invalid(`rating.raterId must match the authenticated actor ${actor.id}`);
  if (!actor.allowedAssignmentIds?.includes("*") && !actor.allowedAssignmentIds?.includes(rating.assignmentId)) {
    return invalid(`actor ${actor.id} is not assigned to ${rating.assignmentId}`);
  }
  return { ok: true };
}

export function validateSourceStyleAuditActor(audit, actor) {
  if (!actor || typeof actor !== "object") return invalid("actor session is required");
  if (!["rater", "graduate", "phd", "expert", "admin"].includes(actor.role)) return invalid("authorized rater role is required");
  if (actor.role !== "admin" && audit.raterId !== actor.id) return invalid(`audit.raterId must match the authenticated actor ${actor.id}`);
  if (!actor.allowedAssignmentIds?.includes("*") && !actor.allowedAssignmentIds?.includes(audit.assignmentId)) {
    return invalid(`actor ${actor.id} is not assigned to ${audit.assignmentId}`);
  }
  return { ok: true };
}

export function createAuditEvent(type, actor, rating, request) {
  const normalizedActor = typeof actor === "string" ? { id: rating.raterId, role: actor } : actor;
  const receivedAt = new Date().toISOString();
  const payloadHash = `sha256:${sha256(canonicalJson(rating))}`;
  return {
    id: randomUUID(),
    type,
    receivedAt,
    actorRole: normalizedActor.role,
    actorHash: `sha256:${sha256(String(normalizedActor.id))}`,
    payloadHash,
    payload: { rating },
    accessAudit: {
      blindInitialMetadataWithheld: type === "blind_initial_submitted",
      sourceMetadataAcceptedFromRater: false,
      peerRatingsAcceptedFromRater: false,
      remoteAddressHash: `sha256:${sha256(request.socket.remoteAddress ?? "unknown")}`,
    },
  };
}

export function createSourceStyleAuditEvent(type, actor, audit, request) {
  const receivedAt = new Date().toISOString();
  const normalizedAudit = {
    id: audit.id,
    ratingId: audit.ratingId,
    assignmentId: audit.assignmentId,
    positionId: audit.positionId,
    critiqueId: audit.critiqueId,
    raterId: audit.raterId,
    collectedAt: audit.collectedAt,
    sourceGuess: audit.sourceGuess,
    authorshipGuess: audit.authorshipGuess,
    styleGuess: audit.styleGuess,
    styleGuessConfidence: audit.styleGuessConfidence,
    collectionPhase: audit.collectionPhase ?? "post_initial_lock",
    shownBeforeInitialLock: false,
    usedForScoring: false,
    notes: typeof audit.notes === "string" ? audit.notes.slice(0, 280) : "",
  };
  const payloadHash = `sha256:${sha256(canonicalJson(normalizedAudit))}`;
  return {
    id: randomUUID(),
    type,
    receivedAt,
    actorRole: actor.role,
    actorHash: `sha256:${sha256(String(actor.id))}`,
    payloadHash,
    payload: { audit: normalizedAudit },
    accessAudit: {
      postLockOnly: true,
      diagnosticOnly: true,
      sourceMetadataAcceptedFromRater: false,
      ordinaryScoringUseAccepted: false,
      remoteAddressHash: `sha256:${sha256(request.socket.remoteAddress ?? "unknown")}`,
    },
  };
}

export function createCertificationAuditEvent(type, actor, attempt, scoredAttempt, request) {
  const receivedAt = new Date().toISOString();
  const payloadHash = `sha256:${sha256(canonicalJson(attempt))}`;
  return {
    id: randomUUID(),
    type,
    receivedAt,
    actorRole: actor.role,
    actorHash: `sha256:${sha256(String(actor.id))}`,
    payloadHash,
    payload: { attempt },
    scoredAttempt,
    accessAudit: {
      trainingExposureOnly: true,
      protectedEvaluationUseAllowed: false,
      remoteAddressHash: `sha256:${sha256(request.socket.remoteAddress ?? "unknown")}`,
    },
  };
}

export function createBenchmarkExposureEvent(type, actor, exposure, request, options = {}) {
  const normalizedActor = actor ?? { id: "unknown", role: "unauthenticated" };
  const receivedAt = new Date().toISOString();
  const normalizedExposure = {
    action: exposure.action,
    artifactId: exposure.artifactId,
    purpose: exposure.purpose,
    accessPhase: exposure.accessPhase ?? "pre_freeze",
    probeFamilies: Array.isArray(exposure.probeFamilies) ? exposure.probeFamilies : [],
    notes: typeof exposure.notes === "string" ? exposure.notes.slice(0, 280) : "",
  };
  const payloadHash = `sha256:${sha256(canonicalJson(normalizedExposure))}`;
  const allowed = options.allowed ?? true;
  return {
    id: randomUUID(),
    type,
    occurredAt: receivedAt,
    actorRole: normalizedActor.role,
    actorHash: `sha256:${sha256(String(normalizedActor.id))}`,
    payloadHash,
    action: normalizedExposure.action,
    artifactId: normalizedExposure.artifactId,
    purpose: normalizedExposure.purpose,
    allowed,
    accessPhase: normalizedExposure.accessPhase,
    probeFamilies: normalizedExposure.probeFamilies,
    payload: { exposure: normalizedExposure },
    accessAudit: {
      requiredRole: "admin",
      authorizedRole: normalizedActor.role === "admin",
      rawHiddenContentAccepted: false,
      remoteAddressHash: `sha256:${sha256(request.socket.remoteAddress ?? "unknown")}`,
    },
  };
}

export function signSessionToken(user, secret, options = {}) {
  const issuedAt = options.issuedAt ?? Date.now();
  const expiresAt = options.expiresAt ?? issuedAt + 8 * 60 * 60 * 1000;
  const payload = {
    userId: user.id,
    role: user.role,
    displayName: user.displayName,
    allowedAssignmentIds: user.allowedAssignmentIds ?? [],
    issuedAt,
    expiresAt,
    nonce: options.nonce ?? randomUUID(),
  };
  const encodedPayload = base64UrlEncode(canonicalJson(payload));
  const signature = hmac(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token, secret, nowMs = Date.now()) {
  if (typeof token !== "string" || !token.includes(".")) return { ok: false, error: "missing_or_malformed_session_token" };
  const [encodedPayload, signature] = token.split(".");
  const expected = hmac(encodedPayload, secret);
  if (!constantTimeEqual(signature, expected)) return { ok: false, error: "invalid_session_signature" };
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "invalid_session_payload" };
  }
  if (!payload.expiresAt || payload.expiresAt <= nowMs) return { ok: false, error: "session_expired" };
  const user = demoUsers.find((item) => item.id === payload.userId);
  if (!user || user.role !== payload.role) return { ok: false, error: "session_user_not_found" };
  return { ok: true, user };
}

async function readPersistedRatings(auditLogPath) {
  const events = await readAuditEvents(auditLogPath);
  return events.map((event) => event.payload?.rating).filter((rating) => rating && typeof rating === "object");
}

async function readPersistedCertificationAttempts(certificationLogPath) {
  const events = await readAuditEvents(certificationLogPath);
  return events.map((event) => event.payload?.attempt).filter((attempt) => attempt && typeof attempt === "object");
}

async function readPersistedBenchmarkExposureEvents(benchmarkLogPath) {
  return readAuditEvents(benchmarkLogPath);
}

async function readPersistedSourceStyleAudits(sourceStyleAuditLogPath) {
  const events = await readAuditEvents(sourceStyleAuditLogPath);
  return events.map((event) => event.payload?.audit).filter((audit) => audit && typeof audit === "object");
}

async function appendBenchmarkExposure(context, event) {
  await mkdir(context.auditDir, { recursive: true });
  await appendFile(context.benchmarkLogPath, `${JSON.stringify(event)}\n`, "utf8");
}

async function buildAdminBenchmarkFreezeReport(context) {
  const persistedRatings = await readPersistedRatings(context.auditLogPath);
  const exposureEvents = [...seedBenchmarkExposureEvents, ...(await readPersistedBenchmarkExposureEvents(context.benchmarkLogPath))];
  const snapshot = createLabelSnapshot(
    "snapshot-oct-benchmark-api",
    releaseId,
    [...seedRatings, ...persistedRatings],
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "benchmark_frozen",
  );
  return buildHiddenBenchmarkFreezeReport(releaseId, snapshot, positions, critiques, undefined, exposureEvents, { includeRestrictedIds: true });
}

async function buildAdminTrainingExport(context) {
  const ratings = [...seedRatings, ...(await readPersistedRatings(context.auditLogPath))];
  const snapshot = createLabelSnapshot(
    "snapshot-oct-training-api",
    releaseId,
    ratings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "initial_only",
  );
  return buildTrainingExport(releaseId, snapshot, positions, critiques, ratings, ratingContextSnapshots);
}

async function readAuditEvents(auditLogPath) {
  let text = "";
  try {
    text = await readFile(auditLogPath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function serveStatic(response, rootDir, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = safeJoin(rootDir, requestedPath);
  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }
  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(file);
  } catch (error) {
    if (error && error.code === "ENOENT" && requestedPath !== "/index.html") {
      await serveStatic(response, rootDir, "/index.html");
      return;
    }
    sendText(response, 404, "Not found");
  }
}

function safeJoin(rootDir, requestedPath) {
  const normalized = normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = resolve(join(rootDir, normalized));
  return filePath === rootDir || filePath.startsWith(`${rootDir}${sep}`) ? filePath : null;
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("request body too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
  response.end(body);
}

function findHiddenKeys(value, prefix = "") {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const own = hiddenMetadataKeys.has(key) ? [path] : [];
    return own.concat(findHiddenKeys(child, path));
  });
}

function findRawBenchmarkContentKeys(value, prefix = "") {
  const forbiddenKeys = new Set([
    "positionText",
    "critiqueText",
    "rawPositionText",
    "rawCritiqueText",
    "sourceText",
    "hiddenPositionIds",
    "hiddenCritiqueIds",
    "hiddenItemIds",
    "membership",
  ]);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const own = forbiddenKeys.has(key) ? [path] : [];
    return own.concat(findRawBenchmarkContentKeys(child, path));
  });
}

function deniedBenchmarkExposure(action) {
  return {
    action,
    artifactId: `hidden-benchmark-freeze-${releaseId}`,
    purpose: "access_audit_review",
    accessPhase: "access_denied",
  };
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function authenticateRequest(request, secret) {
  const header = String(request.headers.authorization ?? "");
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return { ok: false, error: "missing_session_token" };
  return verifySessionToken(match[1], secret);
}

function invalid(detail) {
  return { ok: false, detail };
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function hmac(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT ?? 4173);
  const host = process.env.HOST ?? "127.0.0.1";
  createLmcaServer().listen(port, host, () => {
    console.log(`LMCA server listening on http://${host}:${port}/`);
  });
}
