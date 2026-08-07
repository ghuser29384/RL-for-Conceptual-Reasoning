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
  "staging/participant-readiness.mjs",
  "staging/participant-readiness.css",
  "scripts/bootstrap-staging-rehearsal.mjs",
  "scripts/smoke-staging-runtime.mjs",
  "scripts/smoke-staging-postgres.mjs",
  "scripts/run-human-workflow-support-tabletop.mjs",
  "e2e/human-workflow-staging.spec.mjs",
  "test/h11-access-gate-contract.test.mjs",
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
assert.match(contents["api/staging.mjs"], /participant\.evidence\.record/);
assert.match(contents["api/staging.mjs"], /h11\.access\.gate\.record/);
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
assert.match(contents["src/staging-service.mjs"], /participant\.evidence\.recorded/);
assert.match(contents["src/staging-service.mjs"], /H11-CONSENT-2026-08-07-V1/);
assert.match(contents["src/staging-service.mjs"], /H11-DEBRIEF-2026-08-07-V1/);
assert.match(contents["src/staging-service.mjs"], /H11-ACCESS-GATE-2026-08-07-V2/);
assert.match(contents["src/staging-service.mjs"], /h11\.access\.gate\.recorded/);
assert.match(contents["src/staging-service.mjs"], /h11_access_gate_required/);
assert.match(contents["src/staging-service.mjs"], /h11_access_gate_superseded/);
assert.match(contents["src/staging-service.mjs"], /h11_active_invite_exists/);
assert.match(contents["src/staging-service.mjs"], /human_identity_deliverable_email_required/);
assert.match(contents["src/staging-service.mjs"], /h11Access/);
assert.match(contents["src/staging-service.mjs"], /h11_active_session_exists/);
assert.match(contents["src/staging-service.mjs"], /activeSessionMatchesCurrentAccessGate/);
assert.match(contents["src/staging-service.mjs"], /h11_release_sha_mismatch/);
assert.match(contents["src/staging-service.mjs"], /h11_share_link_stale/);
assert.match(contents["src/staging-service.mjs"], /h11_pseudonym_required/);
assert.match(contents["src/staging-service.mjs"], /directContactPersisted: false/);
assert.match(contents["src/staging-service.mjs"], /contactRouteValidated: true/);
assert.match(contents["src/staging-service.mjs"], /h11_identity_not_minimized/);

assert.match(contents["staging/index.html"], /Synthetic rehearsal only/);
assert.match(contents["staging/index.html"], /Seven LMCA dimensions/);
assert.match(contents["staging/index.html"], /Interpretation confidence/);
assert.match(contents["staging/index.html"], /Relevant background assumptions/);
assert.match(contents["staging/index.html"], /not meaningfully assessable/i);
assert.match(contents["staging/app.mjs"], /debounced|scheduleAutosave|autosave/i);
assert.match(contents["staging/app.mjs"], /Submit all four ratings/);
assert.match(contents["staging/app.mjs"], /other raters, and adjudication state are hidden/i);
assert.match(contents["staging/app.mjs"], /Correction request:/);
assert.match(contents["staging/app.mjs"], /Original ratings remain immutable/);
assert.match(contents["staging/app.mjs"], /Withdrawal recorded; assignment locked/);
assert.match(contents["staging/app.mjs"], /Accepted records remain retained/);
assert.match(contents["staging/app.mjs"], /Approve predecessor-linked re-rating/);
assert.match(contents["staging/app.mjs"], /Open adjudication case/);
assert.match(contents["staging/app.mjs"], /Close resolved/);
assert.match(contents["staging/app.mjs"], /Close unresolved/);
assert.match(contents["staging/app.mjs"], /Close item defective/);
assert.match(contents["staging/app.mjs"], /Explicitly unresolved/);
assert.match(contents["staging/app.mjs"], /Synthetic-session consent/);
assert.match(contents["staging/app.mjs"], /Record consent and open synthetic assignment/);
assert.match(contents["staging/app.mjs"], /Submit synthetic-session debrief/);
assert.match(contents["staging/app.mjs"], /Consent and debrief records/);
assert.match(contents["staging/app.mjs"], /H-11 access issuance gate/);
assert.match(contents["staging/app.mjs"], /Record immutable H-11 access gate/);
assert.match(contents["staging/app.mjs"], /Still no access issuance/);
assert.match(contents["staging/app.mjs"], /shareLinkCreatedAt/);
assert.match(contents["staging/app.mjs"], /H11-ACCESS-GATE-2026-08-07-V2/);
assert.match(contents["staging/app.mjs"], /validated transiently · not persisted/);
assert.match(contents["staging/participant-readiness.css"], /participant-evidence-panel/);

assert.match(contents["src/staging-server.mjs"], /Content-Security-Policy/);
assert.match(contents["src/staging-server.mjs"], /X-Robots-Tag/);
assert.match(contents["src/staging-server.mjs"], /Path traversal rejected/);
assert.match(contents["src/server.mjs"], /createPlatformLmcaServer/);
assert.match(contents["src/server.mjs"], /createStagingLmcaServer/);
assert.match(contents["scripts/bootstrap-staging-rehearsal.mjs"], /--confirm-synthetic-rehearsal/);
assert.match(contents["scripts/bootstrap-staging-rehearsal.mjs"], /researchRatingsAuthorized: false/);
assert.match(contents["scripts/smoke-staging-runtime.mjs"], /cross_account_direct_object_access_denied/);
assert.match(contents["scripts/smoke-staging-runtime.mjs"], /backup_restore_and_hash_chain_readback_passed/);
assert.match(contents["scripts/smoke-staging-runtime.mjs"], /automated synthetic runtime rehearsal/);
assert.match(contents["scripts/smoke-staging-runtime.mjs"], /No outreach, participant selection, payment, funding submission, or real research rating was authorized/);

assert.match(contents["scripts/smoke-staging-postgres.mjs"], /STAGING_SOURCE_DATABASE_URL/);
assert.match(contents["scripts/smoke-staging-postgres.mjs"], /STAGING_RESTORE_DATABASE_URL/);
assert.match(contents["scripts/smoke-staging-postgres.mjs"], /metaphilosophy_staging_chain_readback/);
assert.match(contents["scripts/smoke-staging-postgres.mjs"], /metaphilosophy_staging_assert_synthetic_only/);
assert.match(contents["scripts/smoke-staging-postgres.mjs"], /update public\.metaphilosophy_staging_events/);
assert.match(contents["scripts/smoke-staging-postgres.mjs"], /delete from public\.metaphilosophy_staging_events/);
assert.match(contents["scripts/smoke-staging-postgres.mjs"], /postgres_connection_close_reopen_and_session_resume_passed/);
assert.match(contents["scripts/smoke-staging-postgres.mjs"], /second_database_exact_event_restore_chain_readback_and_session_resume_passed/);
assert.match(contents["scripts/smoke-staging-postgres.mjs"], /realPersonContacted: false/);
assert.match(contents["scripts/smoke-staging-postgres.mjs"], /researchRatingCollected: false/);
assert.match(contents["scripts/smoke-staging-postgres.mjs"], /paymentPromisedOrMade: false/);

assert.match(contents["scripts/run-human-workflow-support-tabletop.mjs"], /Ellen Sun/);
assert.match(contents["scripts/run-human-workflow-support-tabletop.mjs"], /severity: "P1"/);
assert.match(contents["scripts/run-human-workflow-support-tabletop.mjs"], /revoked_invite/);
assert.match(contents["scripts/run-human-workflow-support-tabletop.mjs"], /replacement_token_single_redemption_passed/);
assert.match(contents["scripts/run-human-workflow-support-tabletop.mjs"], /outbound_message_sent: false/);
assert.match(contents["scripts/run-human-workflow-support-tabletop.mjs"], /research_ratings_authorized: false/);

assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /Correction request: open/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /Withdrawal recorded; assignment locked/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /Close unresolved/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /without re-rating/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /predecessor-linked re-rating/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /snapshot\.reratingIds\.length === 4/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /completeSyntheticConsent/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /completeSyntheticDebrief/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /participantEvidence/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /h11AccessGates/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /h11_access_gate_required/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /H-11 access invitations fail closed/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_access_gate_superseded/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_active_invite_exists/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /legacy real-email rater invitations remain blocked/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /human_identity_deliverable_email_required/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_active_session_exists/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_release_sha_mismatch/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_share_link_stale/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_pseudonym_required/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /privacy-test@example\.test/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /not\.toContain\("browser-a@example\.test"\)/);

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
    automatedDisposablePostgresRehearsalDefined: true,
    automatedSyntheticOperationsUiDefined: true,
    automatedSupportTabletopDefined: true,
    hostedDatabaseConfigured: false,
    qualifiedHumanDryRunsComplete: false,
    operationsOwnerReadinessSigned: false,
    researchRatingsAuthorized: false,
  },
}, null, 2));
