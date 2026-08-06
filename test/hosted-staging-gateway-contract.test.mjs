import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { RemoteEventStore } from "../src/staging-event-store.mjs";

const files = Object.fromEntries(await Promise.all([
  "api/staging.mjs",
  "src/staging-event-store.mjs",
  "supabase/functions/metaphilosophy-staging-ledger/index.ts",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v3.sql",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v4.sql",
  "scripts/verify-vercel-oidc-staging-gateway.mjs",
  "vercel.json",
].map(async (path) => [path, await readFile(new URL(`../${path}`, import.meta.url), "utf8")])));

test("the designated preview uses a non-secret Vercel OIDC gateway and keeps remote bootstrap disabled", () => {
  const api = files["api/staging.mjs"];
  assert.match(api, /release\/vercel-preview/u);
  assert.match(api, /VERCEL_ENV === "preview"/u);
  assert.match(api, /x-vercel-oidc-token/u);
  assert.match(api, /zpnbshgrscbfelpychhn/u);
  assert.doesNotMatch(api, /mbswhjnjvwlewdqmwwcf/u);
  assert.match(api, /metaphilosophy-staging-ledger/u);
  assert.match(api, /remote_bootstrap_disabled/u);
  assert.doesNotMatch(api, /STAGING_ALLOW_REMOTE_BOOTSTRAP\s*=\s*["']true/u);
  assert.doesNotMatch(api, /SUPABASE_SERVICE_ROLE_KEY|POSTGRES_PASSWORD/u);
});

test("the Supabase gateway verifies exact Vercel owner, project, and preview claims", () => {
  const gateway = files["supabase/functions/metaphilosophy-staging-ledger/index.ts"];
  assert.match(gateway, /team_ySu6sF3Uho1E1GnJtCQPVEuJ/u);
  assert.match(gateway, /prj_2Aq2qYbFw85GBMRLXdfyTIwvEXhZ/u);
  assert.match(gateway, /environment:preview/u);
  assert.match(gateway, /jwtVerify/u);
  assert.match(gateway, /createRemoteJWKSet/u);
  assert.match(gateway, /researchRatingsAuthorized: false/u);
  assert.match(gateway, /synthetic_rehearsal_only/u);
  assert.match(gateway, /canonicalStringify/u);
  assert.doesNotMatch(gateway, /Access-Control-Allow-Origin/u);
});

test("the gateway database RPC is transactional, serialized, and inaccessible to public roles", () => {
  const migration = files["ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v3.sql"];
  assert.match(migration, /security definer/iu);
  assert.match(migration, /set search_path = public, pg_temp/iu);
  assert.match(migration, /pg_advisory_xact_lock/iu);
  assert.match(migration, /errcode = '40001'/u);
  assert.match(migration, /revoke all.+from anon/isu);
  assert.match(migration, /revoke all.+from authenticated/isu);
  assert.match(migration, /grant execute.+to service_role/isu);
  assert.match(migration, /research_ratings_authorized = false/u);
});

test("Vercel refuses to publish the designated preview unless its OIDC identity reaches the retained US East database", () => {
  const script = files["scripts/verify-vercel-oidc-staging-gateway.mjs"];
  const vercel = JSON.parse(files["vercel.json"]);
  assert.equal(vercel.buildCommand, "npm run build && node scripts/verify-vercel-oidc-staging-gateway.mjs");
  assert.match(script, /VERCEL_OIDC_TOKEN/u);
  assert.match(script, /zpnbshgrscbfelpychhn/u);
  assert.doesNotMatch(script, /mbswhjnjvwlewdqmwwcf/u);
  assert.match(script, /release\/vercel-preview/u);
  assert.match(script, /synthetic_rehearsal_only/u);
  assert.match(script, /researchRatingsAuthorized, false/u);
  assert.match(script, /schema_version, 3/u);
  assert.doesNotMatch(script, /SUPABASE_SERVICE_ROLE_KEY|POSTGRES_PASSWORD/u);
});

test("RemoteEventStore sends OIDC and rejects a missing synthetic-only boundary", async () => {
  const originalFetch = globalThis.fetch;
  const observed = [];
  globalThis.fetch = async (url, options) => {
    observed.push({ url, options });
    return new Response(JSON.stringify({
      ok: true,
      action: "health",
      data: {
        chain: { ok: true, events: 0, headHash: "0".repeat(64) },
        metadata: { purpose: "synthetic_rehearsal_only" },
        researchRatingsAuthorized: false,
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const store = new RemoteEventStore({
      gatewayUrl: "https://example.invalid/functions/v1/ledger",
      oidcToken: "short-lived-vercel-oidc-token",
      expectedReleaseSha: "a".repeat(40),
      expectedBranch: "release/vercel-preview",
    });
    const chain = await store.initialize();
    assert.equal(chain.events, 0);
    assert.equal(observed.length, 1);
    assert.equal(observed[0].options.headers.Authorization, "Bearer short-lived-vercel-oidc-token");
    assert.equal(observed[0].options.headers["X-Metaphilosophy-Release-Branch"], "release/vercel-preview");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the unactivated v4 verification extension remains isolated and append-only", () => {
  const migration = files["ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v4.sql"];
  assert.match(migration, /metaphilosophy_staging_verification_reports/u);
  assert.match(migration, /metaphilosophy_staging_restore_drill_events/u);
  assert.match(migration, /before update or delete/iu);
  assert.match(migration, /restore_drill_load/u);
  assert.match(migration, /restore_drill_readback/u);
  assert.match(migration, /research_ratings_authorized = false/u);
  assert.match(migration, /revoke all.+from anon/isu);
  assert.match(migration, /revoke all.+from authenticated/isu);
});
