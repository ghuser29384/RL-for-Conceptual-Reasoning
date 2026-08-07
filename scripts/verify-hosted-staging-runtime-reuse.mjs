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
const ACCEPTED_BACKEND_BLOBS = Object.freeze({
  "api/staging.mjs": "50fcdb32b5c45422f4b43081e74a67806f7c1f62",
  "src/staging-event-store.mjs": "7d787bef3dbf0adf78192386dea5dc17b5a046ed",
  "src/staging-rubric.mjs": "43fb998121da80581dee9dac79d3c05465858d63",
  "src/staging-service.mjs": "76729b9336820dd885b878031958ab1e45254ec3",
  "src/staging-server.mjs": "24586fe1143906d11f41454ab9878d7d3895e9c5",
  "src/platform-server.mjs": "8b02307586e125edb7d8ff4e6f699dddbf1c916e",
  "supabase/functions/metaphilosophy-staging-ledger/index.ts": "f5481c7c85070b290fc63e2c0174566c709f3403",
  "supabase/functions/metaphilosophy-staging-ledger/deno.json": "cfa5f9137424860ff413b7dfcf68b9c92b013690",
  "supabase/functions/metaphilosophy-staging-acceptance/index.ts": "3cd8c051380a44a5ea8f6c042e190d7d1379882e",
  "supabase/functions/metaphilosophy-staging-acceptance/deno.json": "cfa5f9137424860ff413b7dfcf68b9c92b013690",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v1.sql": "a356862cd4746bd5598a8bc09e7d001edac494d1",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v2.sql": "b0f483862a6c966579b9fb6c2ac0202b883ced8b",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v3.sql": "58ddd8fb8d5fe1f25f584bdced873a54e5daa050",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v4.sql": "4a0e0a02627c8b576d8b8f5bbb83c7162c2dd589",
});
const BACKEND_PATHS = Object.freeze(Object.keys(ACCEPTED_BACKEND_BLOBS));

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

const observedBlobs = {};
for (const path of BACKEND_PATHS) {
  const expectedBlob = ACCEPTED_BACKEND_BLOBS[path];
  let observedBlob;
  try {
    observedBlob = execFileSync("git", ["hash-object", "--", path], { encoding: "utf8" }).trim();
  } catch (error) {
    throw new Error(`Unable to hash required hosted-runtime file ${path}: ${error?.message ?? "unknown error"}`);
  }
  observedBlobs[path] = observedBlob;
  if (observedBlob !== expectedBlob) {
    throw new Error(
      `Hosted rating backend file ${path} differs from accepted release ${acceptedReleaseSha}; a fresh full hosted acceptance is required before publication.`,
    );
  }
}

const response = await fetch(ACCEPTANCE_URL, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${oidcToken}`,
    "Content-Type": "application/json",
    "X-Metaphilosophy-Release-Sha": exactReleaseSha,
    Connection: "close",
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
  observedBackendBlobs: observedBlobs,
  hostedEventCount: expectedCount,
  hostedHeadHash: expectedHead,
  protectedFrontendRequiresExactHeadRenderedAudit: true,
  researchRatingsAuthorized: false,
  realPersonContacted: false,
  outboundMessageSent: false,
}, null, 2));

process.exit(0);
