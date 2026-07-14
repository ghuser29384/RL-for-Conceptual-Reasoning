import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";

import {
  REVIEWER_CAMPAIGN_DEADLINE_ISO,
  REVIEWER_CAMPAIGN_GOAL,
  evaluateReviewerApplication,
  validateReviewerApplication,
} from "../src/domain/reviewer-recruitment.mjs";

const GLOBAL_SQL_KEY = Symbol.for("metaphilosophy.reviewerIntake.sql");
const GLOBAL_SCHEMA_KEY = Symbol.for("metaphilosophy.reviewerIntake.schemaPromise");
const GLOBAL_RATE_KEY = Symbol.for("metaphilosophy.reviewerIntake.rateLimits");
const MAX_BODY_BYTES = 64_000;

function jsonResponse(res, statusCode, payload, extraHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  for (const [key, value] of Object.entries(extraHeaders)) res.setHeader(key, value);
  res.end(JSON.stringify(payload));
}

function databaseUrl() {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

function database() {
  const url = databaseUrl();
  if (!url) return null;
  if (!globalThis[GLOBAL_SQL_KEY]) {
    globalThis[GLOBAL_SQL_KEY] = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      ssl: "require",
    });
  }
  return globalThis[GLOBAL_SQL_KEY];
}

async function ensureSchema(sql) {
  if (!globalThis[GLOBAL_SCHEMA_KEY]) {
    globalThis[GLOBAL_SCHEMA_KEY] = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS reviewer_applications (
          id text PRIMARY KEY,
          email_normalized text NOT NULL UNIQUE,
          email text NOT NULL,
          display_name text NOT NULL,
          role_title text NOT NULL DEFAULT '',
          affiliation text NOT NULL DEFAULT '',
          profile_url text NOT NULL DEFAULT '',
          primary_field text NOT NULL,
          secondary_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
          training_level text NOT NULL,
          expertise_summary text NOT NULL,
          reviewer_experience boolean NOT NULL DEFAULT false,
          availability_hours integer NOT NULL DEFAULT 0,
          topic_preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
          source_channel text NOT NULL DEFAULT 'direct',
          campaign text NOT NULL DEFAULT '',
          referrer_code text NOT NULL DEFAULT '',
          own_referral_code text NOT NULL UNIQUE,
          consent_research_use boolean NOT NULL,
          consent_followup boolean NOT NULL,
          consent_no_external_assistance boolean NOT NULL,
          consent_adult boolean NOT NULL,
          comments text NOT NULL DEFAULT '',
          calibration jsonb NOT NULL,
          calibration_evaluation jsonb NOT NULL,
          qualification_status text NOT NULL,
          request_fingerprint text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS reviewer_applications_status_idx ON reviewer_applications (qualification_status)`;
      await sql`CREATE INDEX IF NOT EXISTS reviewer_applications_channel_idx ON reviewer_applications (source_channel)`;
      await sql`CREATE INDEX IF NOT EXISTS reviewer_applications_created_idx ON reviewer_applications (created_at DESC)`;
      return true;
    })().catch((error) => {
      globalThis[GLOBAL_SCHEMA_KEY] = null;
      throw error;
    });
  }
  return globalThis[GLOBAL_SCHEMA_KEY];
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) throw new Error("body_too_large");
    return JSON.parse(req.body || "{}");
  }
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > MAX_BODY_BYTES) throw new Error("body_too_large");
    return JSON.parse(req.body.toString("utf8") || "{}");
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("body_too_large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function requestIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "");
  return forwarded.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
}

function requestFingerprint(req) {
  const salt = process.env.REVIEWER_FINGERPRINT_SALT || "metaphilosophy-reviewer-intake-v1";
  const input = `${salt}|${requestIp(req)}|${String(req.headers["user-agent"] || "")}`;
  return createHash("sha256").update(input).digest("hex");
}

function withinRateLimit(req) {
  if (!globalThis[GLOBAL_RATE_KEY]) globalThis[GLOBAL_RATE_KEY] = new Map();
  const store = globalThis[GLOBAL_RATE_KEY];
  const key = requestFingerprint(req);
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const current = store.get(key) || { startedAt: now, count: 0 };
  const record = now - current.startedAt >= windowMs ? { startedAt: now, count: 0 } : current;
  record.count += 1;
  store.set(key, record);

  if (store.size > 5000) {
    for (const [candidate, value] of store) {
      if (now - value.startedAt >= windowMs) store.delete(candidate);
    }
  }
  return record.count <= 8;
}

function referralCode() {
  return `R${randomUUID().replaceAll("-", "").slice(0, 9).toUpperCase()}`;
}

function adminTokenFromRequest(req) {
  const authorization = String(req.headers.authorization || "");
  if (/^Bearer\s+/i.test(authorization)) return authorization.replace(/^Bearer\s+/i, "").trim();
  return String(req.headers["x-admin-token"] || "").trim();
}

async function publicSummary(sql) {
  const [totals] = await sql`
    SELECT
      count(*)::int AS applications,
      count(*) FILTER (WHERE qualification_status = 'provisional_qualified')::int AS provisional_qualified,
      count(*) FILTER (WHERE qualification_status = 'manual_review')::int AS manual_review,
      count(*) FILTER (WHERE qualification_status = 'not_qualified')::int AS not_qualified,
      count(*) FILTER (WHERE referrer_code <> '')::int AS referred_applications,
      max(created_at) AS last_submission_at
    FROM reviewer_applications
  `;
  const channels = await sql`
    SELECT
      source_channel,
      count(*)::int AS applications,
      count(*) FILTER (WHERE qualification_status = 'provisional_qualified')::int AS provisional_qualified,
      count(*) FILTER (WHERE qualification_status = 'manual_review')::int AS manual_review
    FROM reviewer_applications
    GROUP BY source_channel
    ORDER BY applications DESC, source_channel ASC
    LIMIT 30
  `;

  return {
    goal: REVIEWER_CAMPAIGN_GOAL,
    deadline: REVIEWER_CAMPAIGN_DEADLINE_ISO,
    applications: totals?.applications || 0,
    completedCalibrations: totals?.applications || 0,
    provisionalQualified: totals?.provisional_qualified || 0,
    manualReview: totals?.manual_review || 0,
    notQualified: totals?.not_qualified || 0,
    referredApplications: totals?.referred_applications || 0,
    activatedWorkingCount: (totals?.provisional_qualified || 0) + (totals?.manual_review || 0),
    gapToGoal: Math.max(0, REVIEWER_CAMPAIGN_GOAL - ((totals?.provisional_qualified || 0) + (totals?.manual_review || 0))),
    lastSubmissionAt: totals?.last_submission_at || null,
    channels: channels.map((row) => ({
      sourceChannel: row.source_channel,
      applications: row.applications,
      provisionalQualified: row.provisional_qualified,
      manualReview: row.manual_review,
    })),
  };
}

async function adminApplications(sql) {
  const rows = await sql`
    SELECT
      id,
      email,
      display_name,
      role_title,
      affiliation,
      profile_url,
      primary_field,
      secondary_fields,
      training_level,
      expertise_summary,
      reviewer_experience,
      availability_hours,
      topic_preferences,
      source_channel,
      campaign,
      referrer_code,
      own_referral_code,
      comments,
      calibration,
      calibration_evaluation,
      qualification_status,
      created_at,
      updated_at
    FROM reviewer_applications
    ORDER BY created_at DESC
    LIMIT 1000
  `;
  return rows;
}

async function notifySubmission(application, evaluation, id) {
  const webhook = process.env.REVIEWER_NOTIFY_WEBHOOK_URL;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "reviewer_application_submitted",
        id,
        name: application.name,
        email: application.email,
        primaryField: application.primaryField,
        trainingLevel: application.trainingLevel,
        sourceChannel: application.sourceChannel,
        qualificationStatus: evaluation.qualificationStatus,
        calibrationScore: evaluation.calibration.score,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    console.warn("reviewer_submission_notification_failed", error?.message || error);
  }
}

async function handleGet(req, res, sql) {
  const url = new URL(req.url, "https://metaphilosophy.org");
  if (url.searchParams.get("view") === "applications") {
    const configuredToken = process.env.REVIEWER_ADMIN_TOKEN || "";
    if (!configuredToken) return jsonResponse(res, 404, { error: "not_found" });
    if (adminTokenFromRequest(req) !== configuredToken) return jsonResponse(res, 403, { error: "forbidden" });
    return jsonResponse(res, 200, { applications: await adminApplications(sql) });
  }
  return jsonResponse(res, 200, await publicSummary(sql));
}

async function handlePost(req, res, sql) {
  if (!withinRateLimit(req)) {
    return jsonResponse(res, 429, { error: "rate_limited", message: "Too many submissions from this connection." });
  }

  let raw;
  try {
    raw = await readJsonBody(req);
  } catch (error) {
    const bodyTooLarge = error?.message === "body_too_large";
    return jsonResponse(res, bodyTooLarge ? 413 : 400, {
      error: bodyTooLarge ? "body_too_large" : "invalid_json",
      message: bodyTooLarge ? "The submission is too large." : "The request body must be valid JSON.",
    });
  }

  const validation = validateReviewerApplication(raw);
  if (!validation.ok) {
    return jsonResponse(res, 422, {
      error: "validation_failed",
      message: "Correct the highlighted fields and submit again.",
      fields: validation.errors,
    });
  }

  const application = validation.application;
  const evaluation = evaluateReviewerApplication(application);
  const id = randomUUID();
  const ownReferralCode = referralCode();
  const fingerprint = requestFingerprint(req);

  const [saved] = await sql`
    INSERT INTO reviewer_applications (
      id,
      email_normalized,
      email,
      display_name,
      role_title,
      affiliation,
      profile_url,
      primary_field,
      secondary_fields,
      training_level,
      expertise_summary,
      reviewer_experience,
      availability_hours,
      topic_preferences,
      source_channel,
      campaign,
      referrer_code,
      own_referral_code,
      consent_research_use,
      consent_followup,
      consent_no_external_assistance,
      consent_adult,
      comments,
      calibration,
      calibration_evaluation,
      qualification_status,
      request_fingerprint
    ) VALUES (
      ${id},
      ${application.email},
      ${application.email},
      ${application.name},
      ${application.roleTitle},
      ${application.affiliation},
      ${application.profileUrl},
      ${application.primaryField},
      ${sql.json(application.secondaryFields)},
      ${application.trainingLevel},
      ${application.expertiseSummary},
      ${application.reviewerExperience},
      ${application.availabilityHours},
      ${sql.json(application.topicPreferences)},
      ${application.sourceChannel},
      ${application.campaign},
      ${application.referrerCode},
      ${ownReferralCode},
      ${application.consentResearchUse},
      ${application.consentFollowup},
      ${application.consentNoExternalAssistance},
      ${application.consentAdult},
      ${application.comments},
      ${sql.json(application.calibration)},
      ${sql.json(evaluation)},
      ${evaluation.qualificationStatus},
      ${fingerprint}
    )
    ON CONFLICT (email_normalized) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      role_title = EXCLUDED.role_title,
      affiliation = EXCLUDED.affiliation,
      profile_url = EXCLUDED.profile_url,
      primary_field = EXCLUDED.primary_field,
      secondary_fields = EXCLUDED.secondary_fields,
      training_level = EXCLUDED.training_level,
      expertise_summary = EXCLUDED.expertise_summary,
      reviewer_experience = EXCLUDED.reviewer_experience,
      availability_hours = EXCLUDED.availability_hours,
      topic_preferences = EXCLUDED.topic_preferences,
      source_channel = EXCLUDED.source_channel,
      campaign = EXCLUDED.campaign,
      referrer_code = CASE
        WHEN reviewer_applications.referrer_code = '' THEN EXCLUDED.referrer_code
        ELSE reviewer_applications.referrer_code
      END,
      consent_research_use = EXCLUDED.consent_research_use,
      consent_followup = EXCLUDED.consent_followup,
      consent_no_external_assistance = EXCLUDED.consent_no_external_assistance,
      consent_adult = EXCLUDED.consent_adult,
      comments = EXCLUDED.comments,
      calibration = EXCLUDED.calibration,
      calibration_evaluation = EXCLUDED.calibration_evaluation,
      qualification_status = EXCLUDED.qualification_status,
      request_fingerprint = EXCLUDED.request_fingerprint,
      updated_at = now()
    RETURNING id, own_referral_code, qualification_status, created_at, updated_at
  `;

  await notifySubmission(application, evaluation, saved.id);

  return jsonResponse(res, 201, {
    ok: true,
    applicationId: saved.id,
    qualificationStatus: saved.qualification_status,
    calibrationScore: evaluation.calibration.score,
    referralCode: saved.own_referral_code,
    deadline: REVIEWER_CAMPAIGN_DEADLINE_ISO,
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("allow", "GET, POST, OPTIONS");
    return res.end();
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse(res, 405, { error: "method_not_allowed" }, { allow: "GET, POST, OPTIONS" });
  }

  const sql = database();
  if (!sql) {
    return jsonResponse(res, 503, {
      error: "database_not_configured",
      message: "Reviewer intake is temporarily unavailable. Contact the research team directly.",
    });
  }

  try {
    await ensureSchema(sql);
    if (req.method === "GET") return await handleGet(req, res, sql);
    return await handlePost(req, res, sql);
  } catch (error) {
    console.error("reviewer_intake_error", error);
    return jsonResponse(res, 500, {
      error: "internal_error",
      message: "The application could not be saved. No payment or commitment was created.",
    });
  }
}
