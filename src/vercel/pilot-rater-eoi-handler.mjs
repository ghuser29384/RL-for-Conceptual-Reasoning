import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import {
  normalizePilotRaterEoi,
  publicPilotRaterEoiSummary,
  validatePilotRaterEoi,
} from "../recruitment/pilot-rater-eoi.mjs";

let sqlPromise;
let schemaReadyPromise;

export const config = { maxDuration: 60 };

export function pilotRaterEoiOpen(environment = process.env) {
  return String(environment.PILOT_RATER_EOI_OPEN ?? "true").toLowerCase() !== "false";
}

export default async function pilotRaterEoiHandler(request, response) {
  setCommonHeaders(response);

  try {
    if (request.method === "OPTIONS") return sendEmpty(response, 204);
    if (request.method === "GET") return handleGet(request, response);
    if (request.method !== "POST") return sendJson(response, 405, { error: "method_not_allowed" }, { allow: "GET, POST, OPTIONS" });
    if (!pilotRaterEoiOpen()) return sendJson(response, 410, { error: "pilot_rater_eoi_closed", detail: "Pilot 01 expressions of interest are closed." });
    if (!sameOriginRequest(request)) return sendJson(response, 403, { error: "cross_origin_submission_rejected" });

    const raw = await readJsonBody(request, 96_000);
    const submission = normalizePilotRaterEoi(raw);

    if (submission.website) {
      return sendJson(response, 202, { status: "received", applicationStatus: "pending_human_review" });
    }

    const validation = validatePilotRaterEoi(submission);
    if (!validation.ok) return sendJson(response, 422, { error: "validation_failed", fields: validation.errors });

    const sql = await getSql();
    await ensureSchema(sql);

    const sourceFingerprint = requestFingerprint(request);
    const [{ recent_count: recentCountRaw } = { recent_count: 0 }] = await sql`
      select count(*)::int as recent_count
      from pilot_rater_expressions_of_interest
      where source_fingerprint = ${sourceFingerprint}
        and updated_at > now() - interval '1 hour'
    `;
    if (Number(recentCountRaw) >= 6) {
      return sendJson(response, 429, { error: "submission_rate_limited", retryAfterSeconds: 3600 }, { "retry-after": "3600" });
    }

    const now = new Date().toISOString();
    const newId = randomUUID();
    const [record] = await sql`
      insert into pilot_rater_expressions_of_interest (
        id,
        email_normalized,
        display_name,
        application_json,
        public_summary_json,
        source_fingerprint,
        application_status,
        application_version,
        submitted_at,
        updated_at,
        submission_count
      ) values (
        ${newId}::uuid,
        ${submission.applicant.emailNormalized},
        ${submission.applicant.displayName},
        ${sql.json(submission)},
        ${sql.json(publicPilotRaterEoiSummary(submission))},
        ${sourceFingerprint},
        'received_pending_human_review',
        ${submission.applicationVersion},
        ${now}::timestamptz,
        ${now}::timestamptz,
        1
      )
      on conflict (email_normalized) do update set
        display_name = excluded.display_name,
        application_json = excluded.application_json,
        public_summary_json = excluded.public_summary_json,
        source_fingerprint = excluded.source_fingerprint,
        application_status = case
          when pilot_rater_expressions_of_interest.application_status in ('qualified', 'activated')
            then pilot_rater_expressions_of_interest.application_status
          else 'received_pending_human_review'
        end,
        application_version = excluded.application_version,
        updated_at = excluded.updated_at,
        submission_count = pilot_rater_expressions_of_interest.submission_count + 1
      returning id::text, application_status, updated_at
    `;

    return sendJson(response, 201, {
      status: "received",
      applicationStatus: record.application_status,
      applicationReference: record.id.slice(0, 8),
      submittedAt: record.updated_at,
      nextStep: "A human reviewer will screen the expression of interest. Qualified applicants may be invited to complete a separate calibration.",
    });
  } catch (error) {
    const configurationError = /POSTGRES_URL|DATABASE_URL/.test(String(error?.message ?? ""));
    console.error("pilot_rater_eoi_error", {
      name: error?.name,
      message: error?.message,
      configurationError,
    });
    return sendJson(response, configurationError ? 503 : 500, {
      error: configurationError ? "pilot_rater_storage_not_configured" : "internal_server_error",
      detail: configurationError
        ? "Pilot-rater storage is temporarily unavailable. No expression of interest was recorded."
        : "The expression of interest could not be recorded. No qualification or payment status was created.",
    });
  }
}

async function handleGet(request, response) {
  const sql = await getSql();
  await ensureSchema(sql);
  const url = new URL(request.url ?? "/api/pilot-rater-eoi", `https://${requestHost(request)}`);
  const mode = url.searchParams.get("mode") ?? "stats";

  if (mode === "export") {
    if (!adminAuthorized(request)) return sendJson(response, 401, { error: "admin_authorization_required" }, { "www-authenticate": "Bearer" });
    const rows = await sql`
      select
        id::text,
        email_normalized,
        display_name,
        application_json,
        source_fingerprint,
        application_status,
        reviewer_decision,
        reviewer_decision_note,
        reviewer_decision_at,
        submitted_at,
        updated_at,
        submission_count
      from pilot_rater_expressions_of_interest
      order by updated_at desc
      limit 2000
    `;
    return sendJson(response, 200, { generatedAt: new Date().toISOString(), count: rows.length, applications: rows });
  }

  const [summary] = await sql`
    select
      count(*)::int as applications,
      count(*) filter (where application_status = 'received_pending_human_review')::int as pending_human_review,
      count(*) filter (where reviewer_decision = 'qualified')::int as qualified,
      count(*) filter (where application_status = 'activated')::int as activated,
      count(*) filter (where updated_at > now() - interval '7 days')::int as received_last_7_days
    from pilot_rater_expressions_of_interest
  `;
  return sendJson(response, 200, {
    generatedAt: new Date().toISOString(),
    pilotId: "metaphilosophy-pilot-01-2026-07-27",
    targetCoreRaters: 6,
    targetAlternates: 2,
    applications: Number(summary.applications),
    pendingHumanReview: Number(summary.pending_human_review),
    qualified: Number(summary.qualified),
    activated: Number(summary.activated),
    receivedLast7Days: Number(summary.received_last_7_days),
    countingPolicy: "Only a human reviewer can mark an applicant qualified or activated.",
  });
}

async function getSql() {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
      if (!connectionString) throw new Error("POSTGRES_URL or DATABASE_URL is required for Pilot 01 rater intake");
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
      create table if not exists pilot_rater_expressions_of_interest (
        id uuid primary key,
        email_normalized text not null unique,
        display_name text not null,
        application_json jsonb not null,
        public_summary_json jsonb not null,
        source_fingerprint text not null,
        application_status text not null,
        application_version text not null,
        reviewer_decision text,
        reviewer_decision_note text,
        reviewer_decision_at timestamptz,
        submitted_at timestamptz not null,
        updated_at timestamptz not null,
        submission_count integer not null default 1
      )
    `;
    await sql`
      create index if not exists pilot_rater_eoi_status_updated_idx
      on pilot_rater_expressions_of_interest (application_status, updated_at desc)
    `;
    await sql`
      create index if not exists pilot_rater_eoi_fingerprint_updated_idx
      on pilot_rater_expressions_of_interest (source_fingerprint, updated_at desc)
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
  return secret ? createHmac("sha256", secret).update(value).digest("hex") : createHash("sha256").update(value).digest("hex");
}

function adminAuthorized(request) {
  const expected = process.env.PILOT_RATER_ADMIN_TOKEN ?? process.env.RECRUITMENT_ADMIN_TOKEN;
  if (!expected) return false;
  const authorization = String(headerValue(request.headers, "authorization") ?? "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return Boolean(match && safeEqual(match[1], expected));
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

function sendEmpty(response, statusCode) {
  response.statusCode = statusCode;
  response.end();
}

function sendJson(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", ...extraHeaders });
  response.end(JSON.stringify(body));
}
