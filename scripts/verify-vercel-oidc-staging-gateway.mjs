import assert from "node:assert/strict";

const RELEASE_PREVIEW_BRANCH = "release/vercel-preview";
const GATEWAY_URL = "https://zpnbshgrscbfelpychhn.supabase.co/functions/v1/metaphilosophy-staging-ledger";
const EXPECTED_TEAM = "ellen-s";
const EXPECTED_PROJECT = "rlhf-conceptual-reasoning";

const isActualReleasePreview = process.env.VERCEL === "1"
  && process.env.VERCEL_ENV === "preview"
  && process.env.VERCEL_GIT_COMMIT_REF === RELEASE_PREVIEW_BRANCH;

if (!isActualReleasePreview) {
  console.log(JSON.stringify({
    status: "skipped",
    reason: "not_the_actual_designated_vercel_preview",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    environment: process.env.VERCEL_ENV ?? null,
  }));
  process.exit(0);
}

const oidcToken = process.env.VERCEL_OIDC_TOKEN;
if (!oidcToken) {
  throw new Error("VERCEL_OIDC_TOKEN is unavailable. Enable Vercel OIDC Federation before the protected preview can deploy.");
}

const response = await fetch(GATEWAY_URL, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${oidcToken}`,
    "Content-Type": "application/json",
    "X-Metaphilosophy-Release-Sha": process.env.VERCEL_GIT_COMMIT_SHA ?? "",
    "X-Metaphilosophy-Release-Branch": RELEASE_PREVIEW_BRANCH,
  },
  body: JSON.stringify({ action: "health" }),
  signal: AbortSignal.timeout(30_000),
});

const text = await response.text();
let payload;
try {
  payload = JSON.parse(text);
} catch {
  throw new Error(`The staging gateway returned non-JSON content with HTTP ${response.status}.`);
}

if (!response.ok || payload?.ok !== true) {
  const code = payload?.error?.code ?? "unknown_gateway_error";
  throw new Error(`The staging gateway rejected the Vercel preview identity: HTTP ${response.status}, ${code}.`);
}

const data = payload.data;
assert.equal(data.status, "ok");
assert.equal(data.persistence, "supabase_postgres");
assert.equal(data.researchRatingsAuthorized, false);
assert.equal(data.metadata?.purpose, "synthetic_rehearsal_only");
assert.equal(data.metadata?.research_ratings_authorized, false);
assert.equal(data.metadata?.schema_version, 3);
assert.equal(data.chain?.ok, true);
assert.ok(Number.isInteger(data.chain?.events) && data.chain.events >= 0);
assert.match(String(data.chain?.headHash), /^[a-f0-9]{64}$/u);
assert.equal(data.caller?.owner, EXPECTED_TEAM);
assert.equal(data.caller?.project, EXPECTED_PROJECT);
assert.equal(data.caller?.environment, "preview");

console.log(JSON.stringify({
  status: "pass",
  scope: "Vercel build identity to OIDC-authenticated Supabase Edge Function and isolated staging Postgres",
  release: {
    sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    environment: process.env.VERCEL_ENV,
  },
  gateway: {
    projectRef: "zpnbshgrscbfelpychhn",
    persistence: data.persistence,
    schemaVersion: data.metadata.schema_version,
    purpose: data.metadata.purpose,
    researchRatingsAuthorized: data.researchRatingsAuthorized,
    chainEvents: data.chain.events,
    chainHeadHash: data.chain.headHash,
  },
  caller: data.caller,
}, null, 2));
