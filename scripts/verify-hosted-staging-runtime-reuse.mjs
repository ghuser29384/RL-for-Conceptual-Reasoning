import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const RELEASE_PREVIEW_BRANCH = "release/vercel-preview";
const ACCEPTANCE_URL = "https://zpnbshgrscbfelpychhn.supabase.co/functions/v1/metaphilosophy-staging-acceptance";
const EVIDENCE_PATH = resolve(
  import.meta.dirname,
  "../ops/next-steps-2026-07-23/hosted-staging-acceptance-evidence-2026-08-06-v1.json",
);
const BACKEND_PATHS = Object.freeze([
  "api/staging.mjs",
  "src/staging-event-store.mjs",
  "src/staging-rubric.mjs",
  "src/staging-service.mjs",
  "src/staging-server.mjs",
  "src/platform-server.mjs",
  "supabase/functions/metaphilosophy-staging-ledger/index.ts",
  "supabase/functions/metaphilosophy-staging-ledger/deno.json",
  "supabase/functions/metaphilosophy-staging-acceptance/index.ts",
  "supabase/functions/metaphilosophy-staging-acceptance/deno.json",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v1.sql",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v2.sql",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v3.sql",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v4.sql",
]);

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
const exactReleaseSha = String(process.env.VERCEL_GIT_COMMIT_SHA ?? "");
if (!oidcToken) throw new Error("VERCEL_OIDC_TOKEN is required for hosted staging verification.");
if (!/^[a-f0-9]{40}$/u.test(exactReleaseSha)) throw new Error("VERCEL_GIT_COMMIT_SHA must be a full lowercase SHA.");

const evidence = JSON.parse(await readFile(EVIDENCE_PATH, "utf8"));
const acceptedReleaseSha = String(evidence?.exact_release?.commit ?? "");
if (!/^[a-f0-9]{40}$/u.test(acceptedReleaseSha)) throw new Error("The retained hosted-acceptance evidence has no valid exact release SHA.");
assert.equal(evidence?.hosted_acceptance?.status, "pass");
assert.equal(evidence?.supabase?.schema_version, 4);
assert.equal(evidence?.supabase?.purpose, "synthetic_rehearsal_only");
assert.equal(evidence?.supabase?.research_ratings_authorized, false);

try {
  execFileSync(
    "git",
    ["diff", "--quiet", `${acceptedReleaseSha}..${exactReleaseSha}`, "--", ...BACKEND_PATHS],
    { stdio: "pipe" },
  );
} catch (error) {
  throw new Error(
    `The hosted rating backend differs from accepted release ${acceptedReleaseSha}; a fresh full hosted acceptance is required before publication. ${error?.message ?? ""}`,
  );
}

const response = await fetch(ACCEPTANCE_URL, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${oidcToken}`,
    "Content-Type": "application/json",
    "X-Metaphilosophy-Release-Sha": exactReleaseSha,
  },
  body: JSON.stringify({ action: "status", exactReleaseSha }),
});
const payload = await response.json().catch(() => null);
if (!response.ok || !payload?.ok) {
  throw new Error(`Hosted staging status failed (${response.status}): ${payload?.error?.code ?? "unknown_error"}`);
}
const status = payload.data;
const expectedCount = Number(evidence.hosted_acceptance.total_events);
const expectedHead = String(evidence.hosted_acceptance.primary_head_hash);

assert.equal(status.metadata?.schema_version, 4);
assert.equal(status.metadata?.purpose, "synthetic_rehearsal_only");
assert.equal(status.metadata?.research_ratings_authorized, false);
assert.equal(status.researchRatingsAuthorized, false);
for (const [name, readback] of [["primary", status.primary], ["restore", status.restore]]) {
  assert.equal(readback?.eventCount, expectedCount, `${name} event count changed`);
  assert.equal(readback?.headHash, expectedHead, `${name} chain head changed`);
  assert.equal(readback?.sequenceGapCount, 0, `${name} sequence gap detected`);
  assert.equal(readback?.previousHashMismatchCount, 0, `${name} previous-hash mismatch detected`);
  assert.equal(readback?.duplicateEventIdCount, 0, `${name} duplicate event ID detected`);
  assert.equal(readback?.duplicateEventHashCount, 0, `${name} duplicate event hash detected`);
  assert.equal(readback?.researchRatingsAuthorized, false, `${name} authorization boundary changed`);
}

console.log(JSON.stringify({
  status: "pass",
  mode: "accepted_backend_evidence_reused_for_unchanged_runtime",
  exactReleaseSha,
  acceptedReleaseSha,
  backendPathsChecked: BACKEND_PATHS.length,
  hostedEventCount: expectedCount,
  hostedHeadHash: expectedHead,
  protectedFrontendRequiresExactHeadRenderedAudit: true,
  researchRatingsAuthorized: false,
  realPersonContacted: false,
  outboundMessageSent: false,
}, null, 2));
