import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "npm:jose@6";

const TEAM_SLUG = "ellen-s";
const TEAM_ID = "team_ySu6sF3Uho1E1GnJtCQPVEuJ";
const VERCEL_PROJECT = "rlhf-conceptual-reasoning";
const VERCEL_PROJECT_ID = "prj_2Aq2qYbFw85GBMRLXdfyTIwvEXhZ";
const TEAM_ISSUER = `https://oidc.vercel.com/${TEAM_SLUG}`;
const GLOBAL_ISSUER = "https://oidc.vercel.com";
const AUDIENCE = `https://vercel.com/${TEAM_SLUG}`;
const SUBJECT = `owner:${TEAM_SLUG}:project:${VERCEL_PROJECT}:environment:preview`;
const GENESIS_HASH = "0".repeat(64);
const MAX_RESTORE_EVENTS = 500;
const teamJwks = createRemoteJWKSet(new URL(`${TEAM_ISSUER}/.well-known/jwks`));
const globalJwks = createRemoteJWKSet(new URL(`${GLOBAL_ISSUER}/.well-known/jwks`));

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase function runtime credentials are unavailable.");

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: { "x-metaphilosophy-component": "staging-acceptance-v1" } },
});

Deno.serve(async (request) => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
  if (request.method !== "POST") {
    return response(405, { ok: false, error: { code: "method_not_allowed", message: "Use POST." } }, headers);
  }

  try {
    const token = bearerToken(request.headers.get("authorization"));
    const claims = await verifyVercelPreviewToken(token);
    const body = await request.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "status";
    const exactReleaseSha = validateReleaseSha(body?.exactReleaseSha, request.headers.get("x-metaphilosophy-release-sha"));

    let data;
    if (action === "status") {
      data = await status(exactReleaseSha, claims);
    } else if (action === "restore.verify") {
      data = await restoreAndVerify({
        events: body?.events,
        expectedEventCount: body?.expectedEventCount,
        expectedHeadHash: body?.expectedHeadHash,
        expectedBackupSha256: body?.expectedBackupSha256,
        exactReleaseSha,
        claims,
      });
    } else if (action === "restore.prefix.verify") {
      data = await verifyRestorePrefix({
        events: body?.events,
        expectedEventCount: body?.expectedEventCount,
        expectedHeadHash: body?.expectedHeadHash,
        expectedBackupSha256: body?.expectedBackupSha256,
        expectedRestoredPrefixCount: body?.expectedRestoredPrefixCount,
        expectedRestoredPrefixHeadHash: body?.expectedRestoredPrefixHeadHash,
        exactReleaseSha,
        claims,
      });
    } else if (action === "report.store") {
      data = await storeReport({
        exactReleaseSha,
        reportKind: body?.reportKind,
        statusValue: body?.status,
        report: body?.report,
        events: body?.events,
        backupSha256: body?.backupSha256,
        headHash: body?.headHash,
        eventCount: body?.eventCount,
        claims,
      });
    } else if (action === "report.latest") {
      data = await latestReport(exactReleaseSha, claims);
    } else {
      throw acceptanceError(404, "unknown_action", "Unknown hosted acceptance action.");
    }

    return response(200, { ok: true, action, data }, headers);
  } catch (error) {
    const statusCode = Number(error?.status) || 500;
    const code = typeof error?.code === "string" ? error.code : "acceptance_error";
    const message = statusCode >= 500
      ? "The hosted staging acceptance request failed closed."
      : String(error?.message ?? "Request failed.");
    if (statusCode >= 500) console.error("metaphilosophy_staging_acceptance_error", error);
    return response(statusCode, { ok: false, error: { code, message } }, headers);
  }
});

async function status(exactReleaseSha: string, claims: JWTPayload) {
  const metadata = await loadMetadata();
  assertSyntheticMetadata(metadata);
  const primary = await primaryReadback();
  const restore = await restoreReadback();
  const latest = await selectLatestReport(exactReleaseSha);
  return {
    status: "ok",
    exactReleaseSha,
    metadata,
    primary,
    restore,
    latestReport: latest ? publicReport(latest) : null,
    caller: publicClaims(claims),
    researchRatingsAuthorized: false,
  };
}

async function restoreAndVerify({ events, expectedEventCount, expectedHeadHash, expectedBackupSha256, exactReleaseSha, claims }) {
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_RESTORE_EVENTS) {
    throw acceptanceError(400, "invalid_restore_events", `Restore requires 1 to ${MAX_RESTORE_EVENTS} events.`);
  }
  const verification = await verifyEventChain(events);
  if (Number(expectedEventCount) !== events.length) {
    throw acceptanceError(409, "restore_count_mismatch", "The supplied event count does not match the backup.");
  }
  if (String(expectedHeadHash) !== verification.headHash) {
    throw acceptanceError(409, "restore_head_mismatch", "The supplied chain head does not match the backup.");
  }
  const backupSha256 = await sha256Hex(canonicalStringify(events));
  if (String(expectedBackupSha256) !== backupSha256) {
    throw acceptanceError(409, "restore_backup_hash_mismatch", "The supplied backup digest does not match the backup.");
  }

  let existing = await loadRestoreEvents();
  if (existing.length === 0) {
    const { data, error } = await admin.rpc("metaphilosophy_staging_restore_drill_load", { p_events: events });
    if (error) throw new Error(`restore load failed: ${error.message}`);
    if (Number(data?.[0]?.restored_count ?? 0) !== events.length) {
      throw new Error("restore load count did not match the backup");
    }
    existing = await loadRestoreEvents();
  }

  const existingVerification = await verifyEventChain(existing);
  if (canonicalStringify(existing) !== canonicalStringify(events)) {
    throw acceptanceError(409, "restore_target_differs", "The restore target contains a different event chain.");
  }
  const readback = await restoreReadback();
  assertReadback(readback, events.length, verification.headHash);

  return {
    status: "pass",
    exactReleaseSha,
    restoredEventCount: events.length,
    restoredHeadHash: existingVerification.headHash,
    backupSha256,
    databaseReadback: readback,
    exactEventEquality: true,
    applicationHashVerification: true,
    caller: publicClaims(claims),
    researchRatingsAuthorized: false,
  };
}


async function verifyRestorePrefix({
  events,
  expectedEventCount,
  expectedHeadHash,
  expectedBackupSha256,
  expectedRestoredPrefixCount,
  expectedRestoredPrefixHeadHash,
  exactReleaseSha,
  claims,
}) {
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_RESTORE_EVENTS) {
    throw acceptanceError(400, "invalid_restore_events", `Restore-prefix verification requires 1 to ${MAX_RESTORE_EVENTS} events.`);
  }
  const fullVerification = await verifyEventChain(events);
  if (Number(expectedEventCount) !== events.length) {
    throw acceptanceError(409, "restore_count_mismatch", "The supplied event count does not match the backup.");
  }
  if (String(expectedHeadHash) !== fullVerification.headHash) {
    throw acceptanceError(409, "restore_head_mismatch", "The supplied chain head does not match the backup.");
  }
  const backupSha256 = await sha256Hex(canonicalStringify(events));
  if (String(expectedBackupSha256) !== backupSha256) {
    throw acceptanceError(409, "restore_backup_hash_mismatch", "The supplied backup digest does not match the backup.");
  }

  const existing = await loadRestoreEvents();
  if (existing.length === 0) {
    throw acceptanceError(409, "restore_prefix_missing", "No prior independently restored chain exists; use restore.verify instead.");
  }
  const existingVerification = await verifyEventChain(existing);
  if (Number(expectedRestoredPrefixCount) !== existing.length) {
    throw acceptanceError(409, "restore_prefix_count_mismatch", "The recorded restore-prefix count does not match the retained restore ledger.");
  }
  if (String(expectedRestoredPrefixHeadHash) !== existingVerification.headHash) {
    throw acceptanceError(409, "restore_prefix_head_mismatch", "The recorded restore-prefix head does not match the retained restore ledger.");
  }
  if (events.length <= existing.length) {
    throw acceptanceError(409, "restore_prefix_has_no_extension", "The current primary chain must be a strict append-only extension of the prior restore prefix.");
  }
  const currentPrefix = events.slice(0, existing.length);
  if (canonicalStringify(currentPrefix) !== canonicalStringify(existing)) {
    throw acceptanceError(409, "restore_prefix_differs", "The retained restore ledger is not an exact prefix of the current primary chain.");
  }

  const readback = await restoreReadback();
  assertReadback(readback, existing.length, existingVerification.headHash);
  const priorReport = await selectLatestPassingReportForRestorePrefix(existing.length, existingVerification.headHash);
  if (!priorReport) {
    throw acceptanceError(409, "restore_prefix_unanchored", "The retained restore prefix is not anchored to a prior passing exact-release report.");
  }

  return {
    status: "pass",
    exactReleaseSha,
    restoredPrefixEventCount: existing.length,
    restoredPrefixHeadHash: existingVerification.headHash,
    fullEventCount: events.length,
    fullHeadHash: fullVerification.headHash,
    appendOnlySuffixEventCount: events.length - existing.length,
    backupSha256,
    databaseReadback: readback,
    exactEventEquality: false,
    exactPrefixEquality: true,
    applicationHashVerification: true,
    priorRestoreAnchorReport: publicReport(priorReport),
    caller: publicClaims(claims),
    researchRatingsAuthorized: false,
  };
}

async function storeReport({ exactReleaseSha, reportKind, statusValue, report, events, backupSha256, headHash, eventCount, claims }) {
  const kind = String(reportKind ?? "").trim();
  if (!/^[a-z0-9._:-]{5,120}$/u.test(kind)) throw acceptanceError(400, "invalid_report_kind", "Invalid report kind.");
  if (!new Set(["pass", "fail"]).has(statusValue)) throw acceptanceError(400, "invalid_report_status", "Invalid report status.");
  if (!report || typeof report !== "object" || Array.isArray(report)) throw acceptanceError(400, "invalid_report", "Report must be an object.");
  if (report.researchRatingsAuthorized !== false) {
    throw acceptanceError(409, "authorization_boundary_missing", "The report must retain researchRatingsAuthorized=false.");
  }
  if (!Array.isArray(events) || events.length !== Number(eventCount)) {
    throw acceptanceError(400, "invalid_report_backup", "The report backup event count is inconsistent.");
  }
  const verification = await verifyEventChain(events);
  const calculatedBackupSha256 = await sha256Hex(canonicalStringify(events));
  if (calculatedBackupSha256 !== String(backupSha256)) {
    throw acceptanceError(409, "report_backup_hash_mismatch", "The report backup digest is inconsistent.");
  }
  if (verification.headHash !== String(headHash)) {
    throw acceptanceError(409, "report_chain_head_mismatch", "The report chain head is inconsistent.");
  }

  const prior = await selectLatestReport(exactReleaseSha, kind);
  if (prior) return { report: publicReport(prior), replay: true, caller: publicClaims(claims) };

  const retainedReport = {
    ...structuredClone(report),
    caller: publicClaims(claims),
    evidenceRetention: "private_append_only_supabase_staging",
  };
  const { data, error } = await admin
    .from("metaphilosophy_staging_verification_reports")
    .insert({
      report_kind: kind,
      exact_release_sha: exactReleaseSha,
      status: statusValue,
      report: retainedReport,
      backup_events: events,
      backup_sha256: calculatedBackupSha256,
      chain_head_hash: verification.headHash,
      event_count: events.length,
      research_ratings_authorized: false,
    })
    .select("id,report_kind,exact_release_sha,status,backup_sha256,chain_head_hash,event_count,research_ratings_authorized,created_at,report")
    .single();
  if (error) throw new Error(`report insert failed: ${error.message}`);
  return { report: publicReport(data), replay: false, caller: publicClaims(claims) };
}

async function latestReport(exactReleaseSha: string, claims: JWTPayload) {
  const latest = await selectLatestReport(exactReleaseSha);
  return {
    exactReleaseSha,
    report: latest ? publicReport(latest) : null,
    caller: publicClaims(claims),
    researchRatingsAuthorized: false,
  };
}

async function selectLatestReport(exactReleaseSha: string, reportKind: string | null = null) {
  let query = admin
    .from("metaphilosophy_staging_verification_reports")
    .select("id,report_kind,exact_release_sha,status,backup_sha256,chain_head_hash,event_count,research_ratings_authorized,created_at,report")
    .eq("exact_release_sha", exactReleaseSha)
    .order("created_at", { ascending: false })
    .limit(1);
  if (reportKind) query = query.eq("report_kind", reportKind);
  const { data, error } = await query;
  if (error) throw new Error(`report read failed: ${error.message}`);
  return data?.[0] ?? null;
}


async function selectLatestPassingReportForRestorePrefix(eventCount: number, chainHeadHash: string) {
  const { data, error } = await admin
    .from("metaphilosophy_staging_verification_reports")
    .select("id,report_kind,exact_release_sha,status,backup_sha256,chain_head_hash,event_count,research_ratings_authorized,created_at,report")
    .eq("status", "pass")
    .eq("event_count", eventCount)
    .eq("chain_head_hash", chainHeadHash)
    .eq("research_ratings_authorized", false)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(`restore-prefix anchor read failed: ${error.message}`);
  return data?.[0] ?? null;
}

async function loadMetadata() {
  const { data, error } = await admin
    .from("metaphilosophy_staging_schema_metadata")
    .select("singleton,schema_version,purpose,research_ratings_authorized,updated_at")
    .eq("singleton", true)
    .single();
  if (error) throw new Error(`metadata read failed: ${error.message}`);
  return data;
}

async function primaryReadback() {
  const { data, error } = await admin.rpc("metaphilosophy_staging_chain_readback");
  if (error) throw new Error(`primary readback failed: ${error.message}`);
  return normalizeReadback(data?.[0]);
}

async function restoreReadback() {
  const { data, error } = await admin.rpc("metaphilosophy_staging_restore_drill_readback");
  if (error) throw new Error(`restore readback failed: ${error.message}`);
  return normalizeReadback(data?.[0]);
}

async function loadRestoreEvents() {
  const { data, error } = await admin
    .from("metaphilosophy_staging_restore_drill_events")
    .select("sequence,event_id,event_type,aggregate_id,actor_id,payload,created_at,prev_hash,event_hash")
    .order("sequence", { ascending: true });
  if (error) throw new Error(`restore event read failed: ${error.message}`);
  return (data ?? []).map(rowToEvent);
}

function normalizeReadback(row) {
  return {
    eventCount: Number(row?.event_count ?? 0),
    minimumSequence: row?.minimum_sequence == null ? null : Number(row.minimum_sequence),
    maximumSequence: row?.maximum_sequence == null ? null : Number(row.maximum_sequence),
    sequenceGapCount: Number(row?.sequence_gap_count ?? 0),
    previousHashMismatchCount: Number(row?.previous_hash_mismatch_count ?? 0),
    duplicateEventIdCount: Number(row?.duplicate_event_id_count ?? 0),
    duplicateEventHashCount: Number(row?.duplicate_event_hash_count ?? 0),
    headHash: String(row?.head_hash ?? GENESIS_HASH),
    researchRatingsAuthorized: row?.research_ratings_authorized ?? false,
  };
}

function assertReadback(readback, eventCount, headHash) {
  if (
    readback.eventCount !== eventCount ||
    readback.minimumSequence !== 1 ||
    readback.maximumSequence !== eventCount ||
    readback.sequenceGapCount !== 0 ||
    readback.previousHashMismatchCount !== 0 ||
    readback.duplicateEventIdCount !== 0 ||
    readback.duplicateEventHashCount !== 0 ||
    readback.headHash !== headHash
  ) {
    throw new Error("restore database readback failed its integrity invariants");
  }
}

function assertSyntheticMetadata(metadata) {
  if (
    Number(metadata?.schema_version) !== 4 ||
    metadata?.purpose !== "synthetic_rehearsal_only" ||
    metadata?.research_ratings_authorized !== false
  ) {
    throw new Error("staging metadata does not preserve the schema-v4 synthetic-only authorization boundary");
  }
}

async function verifyVercelPreviewToken(token: string): Promise<JWTPayload> {
  if (!token) throw acceptanceError(401, "oidc_token_required", "A Vercel OIDC token is required.");
  let payload: JWTPayload | null = null;
  let lastError: unknown = null;
  for (const candidate of [
    { issuer: TEAM_ISSUER, jwks: teamJwks },
    { issuer: GLOBAL_ISSUER, jwks: globalJwks },
  ]) {
    try {
      ({ payload } = await jwtVerify(token, candidate.jwks, {
        issuer: candidate.issuer,
        audience: AUDIENCE,
        subject: SUBJECT,
      }));
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!payload) {
    console.warn("metaphilosophy_staging_acceptance_oidc_rejected", lastError instanceof Error ? lastError.message : String(lastError));
    throw acceptanceError(401, "oidc_token_rejected", "The Vercel OIDC token was rejected.");
  }
  if (payload.owner !== TEAM_SLUG || payload.owner_id !== TEAM_ID) throw acceptanceError(403, "wrong_owner", "The token owner is not authorized.");
  if (payload.project !== VERCEL_PROJECT || payload.project_id !== VERCEL_PROJECT_ID) throw acceptanceError(403, "wrong_project", "The token project is not authorized.");
  if (payload.environment !== "preview") throw acceptanceError(403, "wrong_environment", "Only the preview environment is authorized.");
  return payload;
}

async function verifyEventChain(events) {
  let expectedSequence = 1;
  let expectedPreviousHash = GENESIS_HASH;
  const eventIds = new Set();
  const eventHashes = new Set();
  for (const event of events) {
    if (Number(event.sequence) !== expectedSequence) throw acceptanceError(409, "event_sequence_mismatch", `Event sequence mismatch at ${expectedSequence}.`);
    if (String(event.prevHash) !== expectedPreviousHash) throw acceptanceError(409, "event_previous_hash_mismatch", `Event previous hash mismatch at ${expectedSequence}.`);
    const eventId = String(event.eventId);
    const eventHash = String(event.eventHash);
    if (eventIds.has(eventId)) throw acceptanceError(409, "duplicate_event_id", `Duplicate event ID ${eventId}.`);
    if (eventHashes.has(eventHash)) throw acceptanceError(409, "duplicate_event_hash", `Duplicate event hash ${eventHash}.`);
    const calculated = await hashEvent(event);
    if (calculated !== eventHash) throw acceptanceError(409, "event_content_hash_mismatch", `Event content hash mismatch at ${expectedSequence}.`);
    eventIds.add(eventId);
    eventHashes.add(eventHash);
    expectedPreviousHash = eventHash;
    expectedSequence += 1;
  }
  return { ok: true, events: events.length, headHash: events.at(-1)?.eventHash ?? GENESIS_HASH };
}

async function hashEvent(event) {
  return sha256Hex(canonicalStringify({
    sequence: Number(event.sequence),
    eventId: event.eventId,
    type: event.type,
    aggregateId: event.aggregateId ?? null,
    actorId: event.actorId ?? null,
    payload: event.payload ?? {},
    createdAt: new Date(String(event.createdAt)).toISOString(),
    prevHash: event.prevHash,
  }));
}

function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validateReleaseSha(value, headerValue) {
  const sha = String(value ?? "").trim();
  if (!/^[a-f0-9]{40}$/u.test(sha)) throw acceptanceError(400, "invalid_release_sha", "A full lowercase Git SHA is required.");
  if (headerValue && headerValue !== sha) throw acceptanceError(409, "release_sha_header_mismatch", "Release SHA header and body do not match.");
  return sha;
}

function bearerToken(header) {
  const value = String(header ?? "");
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

function rowToEvent(row) {
  return {
    sequence: Number(row.sequence),
    eventId: String(row.event_id),
    type: row.event_type,
    aggregateId: row.aggregate_id,
    actorId: row.actor_id,
    payload: row.payload ?? {},
    createdAt: new Date(row.created_at).toISOString(),
    prevHash: row.prev_hash,
    eventHash: row.event_hash,
  };
}

function publicReport(row) {
  return {
    id: row.id,
    reportKind: row.report_kind,
    exactReleaseSha: row.exact_release_sha,
    status: row.status,
    backupSha256: row.backup_sha256,
    chainHeadHash: row.chain_head_hash,
    eventCount: Number(row.event_count),
    researchRatingsAuthorized: row.research_ratings_authorized,
    createdAt: row.created_at,
    report: row.report,
  };
}

function publicClaims(payload) {
  return { owner: payload.owner, project: payload.project, environment: payload.environment, subject: payload.sub };
}

function response(status, body, headers) {
  return new Response(`${JSON.stringify(body)}\n`, { status, headers });
}

function acceptanceError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}
