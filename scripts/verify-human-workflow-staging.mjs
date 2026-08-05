import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { RUBRIC, SCORE_DIMENSIONS } from "../src/staging-rubric.mjs";

const root = resolve(import.meta.dirname, "..");
const requiredFiles = [
  "api/staging.mjs",
  "src/staging-event-store.mjs",
  "src/staging-service.mjs",
  "src/staging-rubric.mjs",
  "src/staging-server.mjs",
  "src/platform-server.mjs",
  "src/server.mjs",
  "staging/index.html",
  "staging/app.mjs",
  "staging/styles.css",
  "scripts/bootstrap-staging-rehearsal.mjs",
  "scripts/smoke-staging-server.mjs",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v1.sql",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v2.sql",
];

const contents = Object.fromEntries(await Promise.all(requiredFiles.map(async (path) => [path, await readFile(resolve(root, path), "utf8")])));

assert.deepEqual(SCORE_DIMENSIONS, ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"]);
assert.equal(Object.keys(RUBRIC.dimensions).length, 7);
assert.ok(RUBRIC.generalGuidance.length >= 6);
assert.match(RUBRIC.dimensions.strength.guidance.join(" "), /strength × centrality/);
assert.match(RUBRIC.dimensions.clarity.guidance.join(" "), /below 0\.5/);
assert.match(RUBRIC.generalGuidance.join(" "), /Initial ratings are independent and immutable/);

assert.match(contents["api/staging.mjs"], /HttpOnly/);
assert.match(contents["api/staging.mjs"], /SameSite=Strict/);
assert.match(contents["api/staging.mjs"], /x-staging-csrf/i);
assert.match(contents["api/staging.mjs"], /staging_database_unconfigured/);
assert.match(contents["api/staging.mjs"], /researchRatingsAuthorized: false/);
assert.doesNotMatch(contents["api/staging.mjs"], /Access-Control-Allow-Origin[^\n]*\*/);

assert.match(contents["src/staging-event-store.mjs"], /appendFile/);
assert.match(contents["src/staging-event-store.mjs"], /verifyEventChain/);
assert.match(contents["src/staging-event-store.mjs"], /prevHash/);
assert.match(contents["src/staging-event-store.mjs"], /pg_advisory_xact_lock/);
assert.match(contents["src/staging-service.mjs"], /invite\.revoked/);
assert.match(contents["src/staging-service.mjs"], /invite\.replaced/);
assert.match(contents["src/staging-service.mjs"], /draft_version_conflict/);
assert.match(contents["src/staging-service.mjs"], /packet_hash_mismatch/);
assert.match(contents["src/staging-service.mjs"], /submission\.receipt\.created/);
assert.match(contents["src/staging-service.mjs"], /predecessorAssignmentId/);
assert.match(contents["src/staging-service.mjs"], /adjudication\.closed/);
assert.match(contents["src/staging-service.mjs"], /label_snapshot\.created/);
assert.match(contents["src/staging-service.mjs"], /status: "unresolved"|"unresolved"/);
assert.match(contents["src/staging-service.mjs"], /overallGap >= 0\.3/);
assert.match(contents["src/staging-service.mjs"], /impactGap >= 0\.3/);
assert.match(contents["src/staging-service.mjs"], /assessabilityDisagreement/);

assert.match(contents["staging/index.html"], /Synthetic rehearsal only/);
assert.match(contents["staging/index.html"], /Seven LMCA dimensions/);
assert.match(contents["staging/index.html"], /Interpretation confidence/);
assert.match(contents["staging/index.html"], /Relevant background assumptions/);
assert.match(contents["staging/index.html"], /not meaningfully assessable/i);
assert.match(contents["staging/app.mjs"], /debounced|scheduleAutosave|autosave/i);
assert.match(contents["staging/app.mjs"], /Submit all four ratings/);
assert.match(contents["staging/app.mjs"], /other raters, and adjudication state are hidden/i);
assert.match(contents["staging/app.mjs"], /Request correction/);
assert.match(contents["staging/app.mjs"], /Request withdrawal/);
assert.match(contents["staging/app.mjs"], /Explicitly unresolved/);

assert.match(contents["src/staging-server.mjs"], /Content-Security-Policy/);
assert.match(contents["src/staging-server.mjs"], /X-Robots-Tag/);
assert.match(contents["src/staging-server.mjs"], /Path traversal rejected/);
assert.match(contents["src/server.mjs"], /createPlatformLmcaServer/);
assert.match(contents["src/server.mjs"], /createStagingLmcaServer/);
assert.match(contents["scripts/bootstrap-staging-rehearsal.mjs"], /--confirm-synthetic-rehearsal/);
assert.match(contents["scripts/bootstrap-staging-rehearsal.mjs"], /researchRatingsAuthorized: false/);
assert.match(contents["scripts/smoke-staging-server.mjs"], /cross_account_and_direct_object_access_denied/);
assert.match(contents["scripts/smoke-staging-server.mjs"], /backup_restore_and_hash_chain_readback_passed/);
assert.match(contents["scripts/smoke-staging-server.mjs"], /automated synthetic rehearsal/);

for (const schemaPath of [
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v1.sql",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v2.sql",
]) {
  assert.match(contents[schemaPath], /synthetic_rehearsal_only/);
  assert.match(contents[schemaPath], /research_ratings_authorized/);
  assert.doesNotMatch(contents[schemaPath], /research_ratings_authorized\s*=\s*true/i);
}
assert.match(contents["ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v1.sql"], /append-only/i);
assert.match(contents["ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v1.sql"], /before update or delete/i);
assert.match(contents["ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v2.sql"], /chain_readback/);

console.log(JSON.stringify({
  status: "pass",
  filesChecked: requiredFiles.length,
  rubricDimensions: SCORE_DIMENSIONS,
  claims: {
    authenticatedStagingArchitectureDefined: true,
    automatedSyntheticRehearsalDefined: true,
    hostedDatabaseConfigured: false,
    qualifiedHumanDryRunsComplete: false,
    operationsOwnerReadinessSigned: false,
    researchRatingsAuthorized: false,
  },
}, null, 2));
