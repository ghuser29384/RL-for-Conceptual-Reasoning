import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { PostgresEventStore, verifyEventChain } from "../src/staging-event-store.mjs";
import { StagingWorkflowService } from "../src/staging-service.mjs";

const sourceDatabaseUrl = requireEnvironment("STAGING_SOURCE_DATABASE_URL");
const restoreDatabaseUrl = requireEnvironment("STAGING_RESTORE_DATABASE_URL");
const reportPath = resolve(process.env.STAGING_POSTGRES_REPORT ?? ".staging-evidence/human-workflow-postgres-rehearsal-report.json");
const backupPath = resolve(process.env.STAGING_POSTGRES_BACKUP ?? ".staging-evidence/postgres-events-backup.jsonl");
const fixedNow = new Date("2026-08-06T04:00:00.000Z");
const now = () => new Date(fixedNow);
const timeline = [];

let sourceStore = new PostgresEventStore({ connectionString: sourceDatabaseUrl, ssl: false });
let restoreStore = null;

try {
  await sourceStore.initialize();
  const sourceMetadata = await inspectSchema(sourceStore);
  assert.equal(sourceMetadata.schemaVersion, 2);
  assert.equal(sourceMetadata.purpose, "synthetic_rehearsal_only");
  assert.equal(sourceMetadata.researchRatingsAuthorized, false);
  assert.equal(sourceMetadata.eventsTableRls, true);
  assert.equal(sourceMetadata.metadataTableRls, true);
  timeline.push("reviewed_v1_v2_migrations_and_fail_closed_metadata_verified");

  const sourceService = new StagingWorkflowService({ store: sourceStore, now });
  await sourceService.initialize();
  const bootstrap = await sourceService.bootstrap({
    bootstrapToken: "synthetic-postgres-bootstrap-token",
    expectedBootstrapToken: "synthetic-postgres-bootstrap-token",
    operatorEmail: "operator@postgres-rehearsal.metaphilosophy.invalid",
  });
  const operator = await sourceService.redeemInvite({
    token: bootstrap.inviteToken,
    userAgent: "synthetic-postgres-rehearsal-operator",
  });
  const raterIdentity = await sourceService.createIdentity({
    actorSessionToken: operator.sessionToken,
    role: "rater",
    displayName: "Synthetic PostgreSQL rehearsal rater",
    email: "rater@postgres-rehearsal.metaphilosophy.invalid",
  });
  const raterInvite = await sourceService.createInvite({
    actorSessionToken: operator.sessionToken,
    identityId: raterIdentity.identity.id,
    expiresInHours: 24,
  });
  const rater = await sourceService.redeemInvite({
    token: raterInvite.token,
    userAgent: "synthetic-postgres-rehearsal-rater",
  });
  const assignment = await sourceService.createAssignment({
    actorSessionToken: operator.sessionToken,
    identityId: raterIdentity.identity.id,
    positionId: bootstrap.positionId,
    kind: "initial",
  });
  const workspace = await sourceService.getWorkspace(rater.sessionToken);
  assert.equal(workspace.assignments.length, 1);
  assert.equal(workspace.assignments[0].critiques.length, 4);
  assert.equal(workspace.assignments[0].position.status, "synthetic_rehearsal_only");

  for (const [index, critique] of workspace.assignments[0].critiques.entries()) {
    await sourceService.saveDraft({
      sessionToken: rater.sessionToken,
      assignmentId: assignment.assignment.id,
      critiqueId: critique.id,
      expectedVersion: 0,
      rating: makeRating(index),
    });
  }
  const idempotencyKey = `postgres-submit:${assignment.assignment.id}`;
  const submitted = await sourceService.submitAssignment({
    sessionToken: rater.sessionToken,
    assignmentId: assignment.assignment.id,
    idempotencyKey,
    packetHash: assignment.assignment.packetHash,
  });
  assert.equal(submitted.replay, false);
  assert.ok(submitted.receipt.id);
  const replay = await sourceService.submitAssignment({
    sessionToken: rater.sessionToken,
    assignmentId: assignment.assignment.id,
    idempotencyKey,
    packetHash: assignment.assignment.packetHash,
  });
  assert.equal(replay.replay, true);
  const sourceStateBeforeRestart = await sourceService.state();
  assert.equal(sourceStateBeforeRestart.ratings.length, 4);
  timeline.push("synthetic_postgres_assignment_autosave_submission_and_receipt_passed");

  const sourceReadbackBeforeRestart = await readDatabaseIntegrity(sourceStore);
  assertDatabaseIntegrity(sourceReadbackBeforeRestart);
  await assertSyntheticOnly(sourceStore);
  await assert.rejects(
    () => sourceStore.sql`update public.metaphilosophy_staging_events set actor_id = actor_id where sequence = 1`,
    /append-only/u,
  );
  await assert.rejects(
    () => sourceStore.sql`delete from public.metaphilosophy_staging_events where sequence = 1`,
    /append-only/u,
  );
  timeline.push("database_readback_synthetic_only_assertion_and_mutation_rejection_passed");

  await sourceStore.close();
  sourceStore = new PostgresEventStore({ connectionString: sourceDatabaseUrl, ssl: false });
  const resumedService = new StagingWorkflowService({ store: sourceStore, now });
  await resumedService.initialize();
  const resumedWorkspace = await resumedService.getWorkspace(rater.sessionToken);
  assert.equal(resumedWorkspace.assignments.length, 1);
  assert.ok(resumedWorkspace.assignments[0].receipt?.id);
  assert.equal(resumedWorkspace.assignments[0].critiques.every((critique) => critique.draft?.version === 1), true);
  const resumedState = await resumedService.state();
  assert.equal(resumedState.ratings.length, 4);
  timeline.push("postgres_connection_close_reopen_and_session_resume_passed");

  await mkdir(dirname(backupPath), { recursive: true });
  const backup = await sourceStore.backup(backupPath);
  const backupText = await readFile(backupPath, "utf8");
  const backupEvents = backupText.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).map(JSON.parse);
  assert.equal(backupEvents.length, backup.events);
  verifyEventChain(backupEvents);
  timeline.push("postgres_jsonl_backup_and_application_hash_verification_passed");

  restoreStore = new PostgresEventStore({ connectionString: restoreDatabaseUrl, ssl: false });
  await restoreStore.initialize();
  const restoreMetadata = await inspectSchema(restoreStore);
  assert.deepEqual(restoreMetadata, sourceMetadata);
  const restoreInitialReadback = await readDatabaseIntegrity(restoreStore);
  assert.equal(restoreInitialReadback.eventCount, 0);

  await restoreStore.appendMany(backupEvents.map((event) => ({
    eventId: event.eventId,
    type: event.type,
    aggregateId: event.aggregateId,
    actorId: event.actorId,
    payload: event.payload,
    createdAt: event.createdAt,
  })));
  const restoredEvents = await restoreStore.loadEvents();
  assert.deepEqual(restoredEvents, backupEvents);
  const restoreReadback = await readDatabaseIntegrity(restoreStore);
  assertDatabaseIntegrity(restoreReadback);
  assert.equal(restoreReadback.eventCount, backup.events);
  assert.equal(restoreReadback.headHash, backup.headHash);
  await assertSyntheticOnly(restoreStore);

  const restoredService = new StagingWorkflowService({ store: restoreStore, now });
  await restoredService.initialize();
  const restoredWorkspace = await restoredService.getWorkspace(rater.sessionToken);
  const restoredState = await restoredService.state();
  assert.equal(restoredWorkspace.assignments.length, 1);
  assert.equal(restoredWorkspace.assignments[0].receipt.id, submitted.receipt.id);
  assert.equal(restoredState.ratings.length, 4);
  assert.equal(restoredState.assignments.length, sourceStateBeforeRestart.assignments.length);
  timeline.push("second_database_exact_event_restore_chain_readback_and_session_resume_passed");

  const report = {
    schemaVersion: "metaphilosophy-human-workflow-postgres-rehearsal-v1",
    generatedAt: new Date().toISOString(),
    status: "pass",
    scope: "ephemeral GitHub Actions PostgreSQL service; automated synthetic data only",
    researchRatingsAuthorized: false,
    timeline,
    migrations: {
      versions: [1, 2],
      purpose: sourceMetadata.purpose,
      eventsTableRls: sourceMetadata.eventsTableRls,
      metadataTableRls: sourceMetadata.metadataTableRls,
    },
    source: {
      events: sourceReadbackBeforeRestart.eventCount,
      headHash: sourceReadbackBeforeRestart.headHash,
      ratings: resumedState.ratings.length,
      closeReopenResumePassed: true,
      updateRejected: true,
      deleteRejected: true,
    },
    backup: {
      format: "hash-chained JSONL",
      events: backup.events,
      headHash: backup.headHash,
      applicationHashVerificationPassed: true,
    },
    restore: {
      databaseWasInitiallyEmpty: restoreInitialReadback.eventCount === 0,
      exactEventEqualityPassed: true,
      events: restoreReadback.eventCount,
      headHash: restoreReadback.headHash,
      databaseReadbackPassed: true,
      applicationHashVerificationPassed: true,
      sessionAndReceiptResumePassed: true,
    },
    invariants: {
      sourceAndRestoreHeadHashesMatch: restoreReadback.headHash === sourceReadbackBeforeRestart.headHash,
      sourceAndRestoreEventCountsMatch: restoreReadback.eventCount === sourceReadbackBeforeRestart.eventCount,
      sequenceGapCount: restoreReadback.sequenceGapCount,
      previousHashMismatchCount: restoreReadback.previousHashMismatchCount,
      duplicateEventIdCount: restoreReadback.duplicateEventIdCount,
      duplicateEventHashCount: restoreReadback.duplicateEventHashCount,
      syntheticOnlyAssertionPassed: true,
      realPersonContacted: false,
      outboundMessageSent: false,
      researchRatingCollected: false,
      paymentPromisedOrMade: false,
      protectedOrRealItemPresent: false,
    },
    limitations: [
      "The PostgreSQL service and both databases are disposable GitHub Actions resources, not a protected hosted preview database.",
      "This does not prove external-network availability, Vercel-to-database connectivity, or deployment protection.",
      "No qualified human dry-run rater participated.",
      "No outreach, participant selection, payment, real research rating, publication, funding submission, or Phase 2 action is authorized.",
    ],
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await sourceStore?.close().catch(() => undefined);
  await restoreStore?.close().catch(() => undefined);
}

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function inspectSchema(store) {
  const metadataRows = await store.sql`
    select schema_version, purpose, research_ratings_authorized
    from public.metaphilosophy_staging_schema_metadata
    where singleton = true
  `;
  const tableRows = await store.sql`
    select relname, relrowsecurity
    from pg_class
    where oid in (
      to_regclass('public.metaphilosophy_staging_events'),
      to_regclass('public.metaphilosophy_staging_schema_metadata')
    )
  `;
  const tableMap = new Map(tableRows.map((row) => [row.relname, row.relrowsecurity]));
  return {
    schemaVersion: Number(metadataRows[0]?.schema_version),
    purpose: metadataRows[0]?.purpose,
    researchRatingsAuthorized: metadataRows[0]?.research_ratings_authorized,
    eventsTableRls: tableMap.get("metaphilosophy_staging_events"),
    metadataTableRls: tableMap.get("metaphilosophy_staging_schema_metadata"),
  };
}

async function readDatabaseIntegrity(store) {
  const rows = await store.sql`select * from public.metaphilosophy_staging_chain_readback()`;
  const row = rows[0];
  return {
    eventCount: Number(row.event_count),
    minimumSequence: row.minimum_sequence === null ? null : Number(row.minimum_sequence),
    maximumSequence: row.maximum_sequence === null ? null : Number(row.maximum_sequence),
    sequenceGapCount: Number(row.sequence_gap_count),
    previousHashMismatchCount: Number(row.previous_hash_mismatch_count),
    duplicateEventIdCount: Number(row.duplicate_event_id_count),
    duplicateEventHashCount: Number(row.duplicate_event_hash_count),
    headHash: row.head_hash,
    researchRatingsAuthorized: row.research_ratings_authorized,
  };
}

function assertDatabaseIntegrity(readback) {
  assert.ok(readback.eventCount > 0);
  assert.equal(readback.minimumSequence, 1);
  assert.equal(readback.maximumSequence, readback.eventCount);
  assert.equal(readback.sequenceGapCount, 0);
  assert.equal(readback.previousHashMismatchCount, 0);
  assert.equal(readback.duplicateEventIdCount, 0);
  assert.equal(readback.duplicateEventHashCount, 0);
  assert.match(readback.headHash, /^[a-f0-9]{64}$/u);
  assert.equal(readback.researchRatingsAuthorized, false);
}

async function assertSyntheticOnly(store) {
  await store.sql`select public.metaphilosophy_staging_assert_synthetic_only()`;
}

function makeRating(index) {
  return {
    scores: {
      centrality: 0.9,
      strength: Number((0.82 - index * 0.08).toFixed(2)),
      correctness: 0.9,
      clarity: 0.95,
      dead_weight: 0.05,
      single_issue: 0.95,
      overall: Number((0.78 - index * 0.1).toFixed(2)),
    },
    rationale: "This synthetic PostgreSQL rehearsal rationale identifies the attacked claim, assesses centrality and object-level force, and does not infer quality from source, authorship, or prose style.",
    confidence: "high",
    timeSpentSeconds: 420,
    interpretationConfidence: "high",
    backgroundAssumptions: "Read the synthetic position and critique relatively literally and do not import an unstated response.",
    assessability: "assessable",
    issueFlags: [],
    verificationStatus: "not_needed",
    requestReview: false,
  };
}
