import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import {
  evaluateCalibration,
  makeReferralCode,
  normalizeRecruitmentSubmission,
  validateRecruitmentSubmission,
} from "../recruitment/reviewer-recruitment.mjs";

let sqlPromise;
let schemaReadyPromise;

export const config = { maxDuration: 60 };

export default async function reviewerRecruitmentHandler(request, response) {
  setCommonHeaders(response);

  try {
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "GET") {
      await handleGet(request, response);
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 405, { error: "method_not_allowed" }, { allow: "GET, POST, OPTIONS" });
      return;
    }

    if (!sameOriginRequest(request)) {
      sendJson(response, 403, { error: "cross_origin_submission_rejected" });
      return;
    }

    const raw = await readJsonBody(request, 96_000);
    const submission = normalizeRecruitmentSubmission(raw);

    // A filled honeypot receives a generic success response without writing data.
    if (submission.website) {
      sendJson(response, 202, { status: "received", qualificationStatus: "pending_manual_review" });
      return;
    }

    const validation = validateRecruitmentSubmission(submission);
    if (!validation.ok) {
      sendJson(response, 422, { error: "validation_failed", fields: validation.errors });
      return;
    }

    const sql = await getSql();
    await ensureSchema(sql);

    const sourceFingerprint = requestFingerprint(request);
    const [{ recent_count: recentCountRaw } = { recent_count: 0 }] = await sql`
      select count(*)::int as recent_count
      from reviewer_recruitment_applications
      where source_fingerprint = ${sourceFingerprint}
        and updated_at > now() - interval '1 hour'
    `;
    if (Number(recentCountRaw) >= 8) {
      sendJson(response, 429, { error: "submission_rate_limited", retryAfterSeconds: 3600 }, { "retry-after": "3600" });
      return;
    }

    const now = new Date().toISOString();
    const newId = randomUUID();
    const referralCode = makeReferralCode(newId);
    const calibrationEvaluation = evaluateCalibration(submission.calibration);

    const [record] = await sql`
      insert into reviewer_recruitment_applications (
        id,
        email_normalized,
        display_name,
        background_json,
        consent_json,
        calibration_json,
        recruitment_source_json,
        source_fingerprint,
        application_status,
        calibration_signal,
        application_version,
        referral_code,
        payment_status,
        submitted_at,
        updated_at,
        submission_count
      ) values (
        ${newId}::uuid,
        ${submission.applicant.emailNormalized},
        ${submission.applicant.displayName},
        ${sql.json(submission.applicant)},
        ${sql.json(submission.consent)},
        ${sql.json({ ...submission.calibration, evaluation: calibrationEvaluation })},
        ${sql.json(submission.source)},
        ${sourceFingerprint},
        'calibration_completed',
        ${calibrationEvaluation.signal},
        ${submission.applicationVersion},
        ${referralCode},
        'pending_identity_and_good_faith_review',
        ${now}::timestamptz,
        ${now}::timestamptz,
        1
      )
      on conflict (email_normalized) do update set
        display_name = excluded.display_name,
        background_json = excluded.background_json,
        consent_json = excluded.consent_json,
        calibration_json = excluded.calibration_json,
        recruitment_source_json = excluded.recruitment_source_json,
        source_fingerprint = excluded.source_fingerprint,
        application_status = 'calibration_completed',
        calibration_signal = excluded.calibration_signal,
        application_version = excluded.application_version,
        payment_status = case
          when reviewer_recruitment_applications.payment_status = 'paid' then 'paid'
          else 'pending_identity_and_good_faith_review'
        end,
        updated_at = excluded.updated_at,
        submission_count = reviewer_recruitment_applications.submission_count + 1
      returning id::text, referral_code, application_status, payment_status, updated_at
    `;

    sendJson(response, 201, {
      status: "calibration_completed",
      qualificationStatus: "pending_manual_review",
      paymentStatus: record.payment_status,
      applicationReference: record.id.slice(0, 8),
      referralCode: record.referral_code,
      submittedAt: record.updated_at,
      nextStep: "The reviewer-operations team will verify expertise and calibration quality, then email qualified reviewers.",
    });
  } catch (error) {
    const configurationError = /POSTGRES_URL|DATABASE_URL/.test(String(error?.message ?? ""));
    console.error("reviewer_recruitment_error", {
      name: error?.name,
      message: error?.message,
      configurationError,
    });
    sendJson(response, configurationError ? 503 : 500, {
      error: configurationError ? "recruitment_storage_not_configured" : "internal_server_error",
      detail: configurationError
        ? "Recruitment storage is not configured. No application was recorded."
        : "The application could not be recorded. No payment or qualification status has been created.",
    });
  }
}

async function handleGet(request, response) {
  const sql = await getSql();
  await ensureSchema(sql);
  const url = new URL(request.url ?? "/api/reviewer-recruitment", `https://${requestHost(request)}`);
  const mode = url.searchParams.get("mode") ?? "stats";

  if (mode === "export") {
    if (!adminAuthorized(request)) {
      sendJson(response, 401, { error: "admin_authorization_required" }, { "www-authenticate": "Bearer" });
      return;
    }
    const rows = await sql`
      select
        id::text,
        email_normalized,
        display_name,
        background_json,
        consent_json,
        calibration_json,
        recruitment_source_json,
        application_status,
        calibration_signal,
        referral_code,
        payment_status,
        reviewer_decision,
        reviewer_decision_at,
        submitted_at,
        updated_at,
        submission_count
      from reviewer_recruitment_applications
      order by updated_at desc
      limit 1000
    `;
    sendJson(response, 200, { generatedAt: new Date().toISOString(), count: rows.length, applications: rows });
    return;
  }

  const [summary] = await sql`
    select
      count(*)::int as applications,
      count(*) filter (where application_status = 'calibration_completed')::int as calibrations_completed,
      count(*) filter (where calibration_signal = 'strong_pattern_match')::int as strong_calibration_signals,
      count(*) filter (where updated_at > now() - interval '24 hours')::int as completed_last_24_hours,
      count(*) filter (where reviewer_decision = 'qualified')::int as qualified_reviewers
    from reviewer_recruitment_applications
  `;
  const sources = await sql`
    select coalesce(recruitment_source_json->>'source', 'unknown') as source, count(*)::int as count
    from reviewer_recruitment_applications
    group by 1
    order by count desc, source asc
    limit 20
  `;
  sendJson(response, 200, {
    generatedAt: new Date().toISOString(),
    target: 100,
    applications: Number(summary.applications),
    calibrationsCompleted: Number(summary.calibrations_completed),
    strongCalibrationSignals: Number(summary.strong_calibration_signals),
    completedLast24Hours: Number(summary.completed_last_24_hours),
    qualifiedReviewers: Number(summary.qualified_reviewers),
    sources,
    countingPolicy: "Qualified reviewers are counted only after a human reviewer records a qualified decision.",
  });
}

async function getSql() {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
      if (!connectionString) throw new Error("POSTGRES_URL or DATABASE_URL is required for reviewer recruitment intake");
      const { default: postgres } = await import("postgres");
      return postgres(connectionString, {
        max: Number(process.env.POSTGRES_CONNECTION_LIMIT ?? 4),
        ssl: process.env.POSTGRES_SSL === "disable" ? false : "require",
        connect_timeout: 10,
        idle_timeout: 20,
      });
    })();
  }
  return sqlPromise;
}

async function ensureSchema(sql) {
  schemaReadyPromise ??= (async () => {
    await sql`
      create table if not exists reviewer_recruitment_applications (
        id uuid primary key,
        email_normalized text not null unique,
        display_name text not null,
        background_json jsonb not null,
        consent_json jsonb not null,
        calibration_json jsonb not null,
        recruitment_source_json jsonb not null,
        source_fingerprint text not null,
        application_status text not null,
        calibration_signal text not null,
        application_version text not null,
        referral_code text not null unique,
        payment_status text not null,
        reviewer_decision text,
        reviewer_decision_note text,
        reviewer_decision_at timestamptz,
        submitted_at timestamptz not null,
        updated_at timestamptz not null,
        submission_count integer not null default 1
      )
    `;
    await sql`
      create index if not exists reviewer_recruitment_status_updated_idx
      on reviewer_recruitment_applications (application_status, updated_at desc)
    `;
    await sql`
      create index if not exists reviewer_recruitment_source_fingerprint_idx
      on reviewer_recruitment_applications (source_fingerprint, updated_at desc)
    `;
  })();
  return schemaReadyPromise;
}

async function readJsonBody(request, maxBytes) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body) && typeof request.body[Symbol.asyncIterator] !== "function") {
    return request.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("request body too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function sameOriginRequest(request) {
  const origin = headerValue(request.headers, "origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === requestHost(request);
  } catch {
    return false;
  }
}

function requestFingerprint(request) {
  const forwarded = headerValue(request.headers, "x-forwarded-for") ?? "unknown";
  const firstIp = String(forwarded).split(",")[0].trim();
  const userAgent = headerValue(request.headers, "user-agent") ?? "unknown";
  const secret = process.env.RECRUITMENT_HASH_SECRET ?? process.env.LMCA_SESSION_SECRET;
  const value = `${firstIp}\n${userAgent}`;
  return secret
    ? createHmac("sha256", secret).update(value).digest("hex")
    : createHash("sha256").update(value).digest("hex");
}

function adminAuthorized(request) {
  const expected = process.env.RECRUITMENT_ADMIN_TOKEN;
  if (!expected) return false;
  const authorization = String(headerValue(request.headers, "authorization") ?? "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  return safeEqual(match[1], expected);
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function requestHost(request) {
  return String(headerValue(request.headers, "host") ?? "www.metaphilosophy.org");
}

function headerValue(headers, key) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(key);
  return headers[key] ?? headers[key.toLowerCase()] ?? null;
}

function setCommonHeaders(response) {
  response.setHeader?.("cache-control", "no-store, max-age=0");
  response.setHeader?.("content-security-policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  response.setHeader?.("referrer-policy", "same-origin");
  response.setHeader?.("x-content-type-options", "nosniff");
  response.setHeader?.("x-frame-options", "DENY");
  response.setHeader?.("access-control-allow-methods", "GET, POST, OPTIONS");
  response.setHeader?.("access-control-allow-headers", "content-type, authorization");
}

function sendJson(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", ...extraHeaders });
  response.end(JSON.stringify(body));
}
