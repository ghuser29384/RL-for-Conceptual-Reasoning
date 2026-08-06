import assert from "node:assert/strict";

import { PostgresEventStore, verifyEventChain } from "../src/staging-event-store.mjs";

const databases = [
  ["source", requireEnvironment("STAGING_SOURCE_DATABASE_URL")],
  ["restore", requireEnvironment("STAGING_RESTORE_DATABASE_URL")],
];
const results = [];

for (const [label, connectionString] of databases) {
  const store = new PostgresEventStore({ connectionString, ssl: false });
  try {
    await store.initialize();
    const metadataRows = await store.sql`
      select schema_version, purpose, research_ratings_authorized
      from public.metaphilosophy_staging_schema_metadata
      where singleton = true
    `;
    assert.equal(Number(metadataRows[0]?.schema_version), 4);
    assert.equal(metadataRows[0]?.purpose, "synthetic_rehearsal_only");
    assert.equal(metadataRows[0]?.research_ratings_authorized, false);

    const relationRows = await store.sql`
      select relname, relrowsecurity
      from pg_class
      where oid in (
        to_regclass('public.metaphilosophy_staging_verification_reports'),
        to_regclass('public.metaphilosophy_staging_restore_drill_events')
      )
      order by relname
    `;
    assert.deepEqual(
      relationRows.map((row) => [row.relname, row.relrowsecurity]),
      [
        ["metaphilosophy_staging_restore_drill_events", true],
        ["metaphilosophy_staging_verification_reports", true],
      ],
    );

    const functionRows = await store.sql`
      select proname
      from pg_proc
      where proname in (
        'metaphilosophy_staging_restore_drill_load',
        'metaphilosophy_staging_restore_drill_readback'
      )
      order by proname
    `;
    assert.deepEqual(
      functionRows.map((row) => row.proname),
      [
        "metaphilosophy_staging_restore_drill_load",
        "metaphilosophy_staging_restore_drill_readback",
      ],
    );

    const events = await store.loadEvents();
    assert.ok(events.length > 0);
    verifyEventChain(events);
    const expectedHeadHash = events.at(-1).eventHash;

    const initialRestoreRows = await store.sql`select * from public.metaphilosophy_staging_restore_drill_readback()`;
    assert.equal(Number(initialRestoreRows[0].event_count), 0);

    const restoredRows = await store.sql`
      select * from public.metaphilosophy_staging_restore_drill_load(${store.sql.json(events)}::jsonb)
    `;
    assert.equal(Number(restoredRows[0].restored_count), events.length);
    assert.equal(restoredRows[0].head_hash, expectedHeadHash);

    const restoreReadbackRows = await store.sql`select * from public.metaphilosophy_staging_restore_drill_readback()`;
    const readback = restoreReadbackRows[0];
    assert.equal(Number(readback.event_count), events.length);
    assert.equal(Number(readback.minimum_sequence), 1);
    assert.equal(Number(readback.maximum_sequence), events.length);
    assert.equal(Number(readback.sequence_gap_count), 0);
    assert.equal(Number(readback.previous_hash_mismatch_count), 0);
    assert.equal(Number(readback.duplicate_event_id_count), 0);
    assert.equal(Number(readback.duplicate_event_hash_count), 0);
    assert.equal(readback.head_hash, expectedHeadHash);

    await assert.rejects(
      () => store.sql`update public.metaphilosophy_staging_restore_drill_events set actor_id = actor_id where sequence = 1`,
      /append-only/u,
    );
    await assert.rejects(
      () => store.sql`delete from public.metaphilosophy_staging_restore_drill_events where sequence = 1`,
      /append-only/u,
    );

    const evidenceSha = label === "source" ? "a".repeat(40) : "b".repeat(40);
    const inserted = await store.sql`
      insert into public.metaphilosophy_staging_verification_reports
        (report_kind, exact_release_sha, status, report, backup_events, backup_sha256, chain_head_hash, event_count, research_ratings_authorized)
      values
        (
          'disposable-v4-contract-check',
          ${evidenceSha},
          'pass',
          ${store.sql.json({ label, synthetic: true })},
          ${store.sql.json(events)},
          ${"c".repeat(64)},
          ${expectedHeadHash},
          ${events.length},
          false
        )
      returning id
    `;
    assert.equal(inserted.length, 1);
    await assert.rejects(
      () => store.sql`update public.metaphilosophy_staging_verification_reports set status = 'fail' where id = ${inserted[0].id}`,
      /append-only/u,
    );
    await assert.rejects(
      () => store.sql`delete from public.metaphilosophy_staging_verification_reports where id = ${inserted[0].id}`,
      /append-only/u,
    );

    results.push({
      database: label,
      schemaVersion: 4,
      primaryEvents: events.length,
      restoredEvents: Number(readback.event_count),
      headHash: readback.head_hash,
      reportMutationRejected: true,
      restoreMutationRejected: true,
      researchRatingsAuthorized: false,
    });
  } finally {
    await store.close().catch(() => undefined);
  }
}

console.log(JSON.stringify({
  status: "pass",
  scope: "disposable PostgreSQL v4 verification and isolated restore contracts",
  databases: results,
  realPersonContacted: false,
  outboundMessageSent: false,
  researchRatingCollected: false,
  paymentPromisedOrMade: false,
  researchRatingsAuthorized: false,
}, null, 2));

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}
