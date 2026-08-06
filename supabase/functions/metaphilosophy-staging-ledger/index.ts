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
const MAX_EVENTS_PER_APPEND = 250;
const teamJwks = createRemoteJWKSet(new URL(`${TEAM_ISSUER}/.well-known/jwks`));
const globalJwks = createRemoteJWKSet(new URL(`${GLOBAL_ISSUER}/.well-known/jwks`));

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase function runtime credentials are unavailable.");

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: { "x-metaphilosophy-component": "staging-ledger-gateway-v1" } },
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
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    const claims = await verifyVercelPreviewToken(token);
    const body = await request.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "health";

    let data;
    if (action === "health") {
      const events = await loadEvents();
      const chain = await verifyEventChain(events);
      const metadata = await loadMetadata();
      assertSyntheticMetadata(metadata);
      data = {
        status: "ok",
        gatewayVersion: "metaphilosophy-staging-ledger-v1",
        persistence: "supabase_postgres",
        chain,
        metadata,
        caller: publicClaims(claims),
        researchRatingsAuthorized: false,
      };
    } else if (action === "load") {
      const events = await loadEvents();
      const chain = await verifyEventChain(events);
      const metadata = await loadMetadata();
      assertSyntheticMetadata(metadata);
      data = { events, chain, metadata, researchRatingsAuthorized: false };
    } else if (action === "appendMany") {
      const items = Array.isArray(body?.items) ? body.items : null;
      if (!items) throw gatewayError(400, "invalid_items", "items must be an array.");
      if (items.length > MAX_EVENTS_PER_APPEND) {
        throw gatewayError(413, "too_many_events", `At most ${MAX_EVENTS_PER_APPEND} events may be appended at once.`);
      }
      const created = await appendMany(items);
      const events = await loadEvents();
      const chain = await verifyEventChain(events);
      const metadata = await loadMetadata();
      assertSyntheticMetadata(metadata);
      data = { events: created, chain, metadata, researchRatingsAuthorized: false };
    } else {
      throw gatewayError(404, "unknown_action", "Unknown staging ledger action.");
    }

    return response(200, { ok: true, action, data }, headers);
  } catch (error) {
    const status = Number(error?.status) || 500;
    const code = typeof error?.code === "string" ? error.code : "gateway_error";
    const message = status >= 500
      ? "The hosted staging ledger request failed closed."
      : String(error?.message ?? "Request failed.");
    if (status >= 500) console.error("metaphilosophy_staging_gateway_error", error);
    return response(status, { ok: false, error: { code, message } }, headers);
  }
});

async function verifyVercelPreviewToken(token: string): Promise<JWTPayload> {
  if (!token) throw gatewayError(401, "oidc_token_required", "A Vercel OIDC token is required.");

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
    console.warn(
      "metaphilosophy_staging_oidc_rejected",
      lastError instanceof Error ? lastError.message : String(lastError),
    );
    throw gatewayError(401, "oidc_token_rejected", "The Vercel OIDC token was rejected.");
  }

  if (payload.owner !== TEAM_SLUG || payload.owner_id !== TEAM_ID) {
    throw gatewayError(403, "wrong_owner", "The token owner is not authorized.");
  }
  if (payload.project !== VERCEL_PROJECT || payload.project_id !== VERCEL_PROJECT_ID) {
    throw gatewayError(403, "wrong_project", "The token project is not authorized.");
  }
  if (payload.environment !== "preview") {
    throw gatewayError(403, "wrong_environment", "Only the preview environment is authorized.");
  }
  return payload;
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

function assertSyntheticMetadata(metadata: Record<string, unknown>) {
  if (metadata?.purpose !== "synthetic_rehearsal_only" || metadata?.research_ratings_authorized !== false) {
    throw new Error("staging metadata does not preserve the synthetic-only authorization boundary");
  }
}

async function loadEvents() {
  const { data, error } = await admin
    .from("metaphilosophy_staging_events")
    .select("sequence,event_id,event_type,aggregate_id,actor_id,payload,created_at,prev_hash,event_hash")
    .order("sequence", { ascending: true });
  if (error) throw new Error(`event read failed: ${error.message}`);
  return (data ?? []).map((row) => ({
    sequence: Number(row.sequence),
    eventId: String(row.event_id),
    type: row.event_type,
    aggregateId: row.aggregate_id,
    actorId: row.actor_id,
    payload: row.payload ?? {},
    createdAt: new Date(row.created_at).toISOString(),
    prevHash: row.prev_hash,
    eventHash: row.event_hash,
  }));
}

async function appendMany(items: unknown[]) {
  if (items.length === 0) return [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { sequence, headHash } = await readHead();
    const created = [];
    let nextSequence = sequence;
    let previousHash = headHash;

    for (const raw of items) {
      const item = normalizeAppendItem(raw);
      nextSequence += 1;
      const event = {
        sequence: nextSequence,
        eventId: item.eventId ?? crypto.randomUUID(),
        type: item.type,
        aggregateId: item.aggregateId,
        actorId: item.actorId,
        payload: item.payload,
        createdAt: new Date(item.createdAt ?? Date.now()).toISOString(),
        prevHash: previousHash,
      };
      const complete = { ...event, eventHash: await hashEvent(event) };
      created.push(complete);
      previousHash = complete.eventHash;
    }

    const { error } = await admin.rpc("metaphilosophy_staging_gateway_insert_events", {
      p_expected_sequence: sequence,
      p_expected_head_hash: headHash,
      p_events: created,
    });
    if (!error) return created;
    if (error.code === "40001" || /chain changed/i.test(error.message)) continue;
    throw new Error(`event append failed: ${error.message}`);
  }
  throw gatewayError(409, "chain_conflict", "The staging chain changed repeatedly; retry the request.");
}

async function readHead() {
  const { data, error } = await admin
    .from("metaphilosophy_staging_events")
    .select("sequence,event_hash")
    .order("sequence", { ascending: false })
    .limit(1);
  if (error) throw new Error(`chain head read failed: ${error.message}`);
  return data?.length
    ? { sequence: Number(data[0].sequence), headHash: String(data[0].event_hash) }
    : { sequence: 0, headHash: GENESIS_HASH };
}

function normalizeAppendItem(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw gatewayError(400, "invalid_event", "Each event item must be an object.");
  }
  const item = raw as Record<string, unknown>;
  const type = typeof item.type === "string" ? item.type.trim() : "";
  if (type.length < 3 || type.length > 120) {
    throw gatewayError(400, "invalid_event_type", "Event type must contain 3 to 120 characters.");
  }
  const payload = item.payload ?? {};
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw gatewayError(400, "invalid_event_payload", "Event payload must be an object.");
  }
  const eventId = item.eventId == null ? null : String(item.eventId);
  if (eventId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(eventId)) {
    throw gatewayError(400, "invalid_event_id", "Event ID must be a UUID.");
  }
  return {
    eventId,
    type,
    aggregateId: item.aggregateId == null ? null : String(item.aggregateId),
    actorId: item.actorId == null ? null : String(item.actorId),
    payload,
    createdAt: item.createdAt == null ? null : String(item.createdAt),
  };
}

async function verifyEventChain(events: Array<Record<string, unknown>>) {
  let expectedSequence = 1;
  let expectedPreviousHash = GENESIS_HASH;
  const eventIds = new Set<string>();
  const eventHashes = new Set<string>();
  for (const event of events) {
    if (Number(event.sequence) !== expectedSequence) {
      throw new Error(`Event sequence mismatch at ${expectedSequence}.`);
    }
    if (String(event.prevHash) !== expectedPreviousHash) {
      throw new Error(`Event previous-hash mismatch at ${expectedSequence}.`);
    }
    const eventId = String(event.eventId);
    const eventHash = String(event.eventHash);
    if (eventIds.has(eventId)) throw new Error(`Duplicate event ID ${eventId}.`);
    if (eventHashes.has(eventHash)) throw new Error(`Duplicate event hash ${eventHash}.`);
    const calculated = await hashEvent(event);
    if (calculated !== eventHash) throw new Error(`Event content hash mismatch at ${expectedSequence}.`);
    eventIds.add(eventId);
    eventHashes.add(eventHash);
    expectedPreviousHash = eventHash;
    expectedSequence += 1;
  }
  return { ok: true, events: events.length, headHash: events.at(-1)?.eventHash ?? GENESIS_HASH };
}

async function hashEvent(event: Record<string, unknown>) {
  const normalized = canonicalStringify({
    sequence: Number(event.sequence),
    eventId: event.eventId,
    type: event.type,
    aggregateId: event.aggregateId ?? null,
    actorId: event.actorId ?? null,
    payload: event.payload ?? {},
    createdAt: new Date(String(event.createdAt)).toISOString(),
    prevHash: event.prevHash,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function canonicalStringify(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(object)
        .sort()
        .filter((key) => object[key] !== undefined)
        .map((key) => [key, canonicalize(object[key])]),
    );
  }
  return value;
}

function publicClaims(payload: JWTPayload) {
  return {
    owner: payload.owner,
    project: payload.project,
    environment: payload.environment,
    subject: payload.sub,
  };
}

function response(status: number, body: unknown, headers: Record<string, string>) {
  return new Response(`${JSON.stringify(body)}\n`, { status, headers });
}

function gatewayError(status: number, code: string, message: string) {
  const error = new Error(message) as Error & { status: number; code: string };
  error.status = status;
  error.code = code;
  return error;
}
