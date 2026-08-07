#!/usr/bin/env python3
from __future__ import annotations

import os
from pathlib import Path
from textwrap import dedent

ROOT = Path(__file__).resolve().parents[1]
BRANCH = "candidate/h11-hosted-acceptance-v3-20260807"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected exactly one anchor, found {count}: {old[:180]!r}")
    write(path, text.replace(old, new, 1))


def main() -> None:
    if os.environ.get("GITHUB_REF_NAME") not in {None, BRANCH}:
        raise RuntimeError(f"Unexpected branch: {os.environ.get('GITHUB_REF_NAME')}")

    for path, marker in [
        ("scripts/run-hosted-staging-acceptance.mjs", "restore.prefix.verify"),
        ("supabase/functions/metaphilosophy-staging-acceptance/index.ts", "restore_prefix_unanchored"),
        ("test/hosted-staging-gateway-contract.test.mjs", "restore prefix reuse remains anchored"),
    ]:
        target = ROOT / path
        if target.exists() and marker in target.read_text(encoding="utf-8"):
            raise RuntimeError(f"Prior or partial hosted-acceptance V3 patch found in {path}")

    # Build-time hosted acceptance script.
    replace_once(
        "scripts/run-hosted-staging-acceptance.mjs",
        'const REPORT_KIND = "protected-hosted-synthetic-lifecycle-v2";',
        'const REPORT_KIND = "protected-hosted-synthetic-lifecycle-v3";',
    )
    replace_once(
        "scripts/run-hosted-staging-acceptance.mjs",
        "const startingPrimary = structuredClone(initialStatus.primary);",
        "const startingPrimary = structuredClone(initialStatus.primary);\nconst startingRestore = structuredClone(initialStatus.restore);",
    )
    replace_once(
        "scripts/run-hosted-staging-acceptance.mjs",
        dedent('''
        if (initialStatus.restore.eventCount !== 0) {
          throw new Error(
            `Hosted staging acceptance requires an empty restore ledger when no exact-release report exists; found ${initialStatus.restore.eventCount}.`,
          );
        }

        '''),
        "",
    )
    replace_once(
        "scripts/run-hosted-staging-acceptance.mjs",
        dedent('''
        const restoreEvidence = await acceptanceRequest("restore.verify", {
          events: finalEvents,
          expectedEventCount: finalEvents.length,
          expectedHeadHash: finalChain.headHash,
          expectedBackupSha256: backupSha256,
        });
        assert.equal(restoreEvidence.status, "pass");
        assert.equal(restoreEvidence.exactEventEquality, true);
        assert.equal(restoreEvidence.databaseReadback.eventCount, finalEvents.length);
        assert.equal(restoreEvidence.databaseReadback.headHash, finalChain.headHash);
        timeline.push("independent_append_only_restore_ledger_and_exact_chain_equality_passed");
        '''),
        dedent('''
        let restoreEvidence;
        if (startingRestore.eventCount === 0) {
          restoreEvidence = await acceptanceRequest("restore.verify", {
            events: finalEvents,
            expectedEventCount: finalEvents.length,
            expectedHeadHash: finalChain.headHash,
            expectedBackupSha256: backupSha256,
          });
          assert.equal(restoreEvidence.status, "pass");
          assert.equal(restoreEvidence.exactEventEquality, true);
          assert.equal(restoreEvidence.databaseReadback.eventCount, finalEvents.length);
          assert.equal(restoreEvidence.databaseReadback.headHash, finalChain.headHash);
          timeline.push("independent_append_only_restore_ledger_and_exact_chain_equality_passed");
        } else {
          restoreEvidence = await acceptanceRequest("restore.prefix.verify", {
            events: finalEvents,
            expectedEventCount: finalEvents.length,
            expectedHeadHash: finalChain.headHash,
            expectedBackupSha256: backupSha256,
            expectedRestoredPrefixCount: startingRestore.eventCount,
            expectedRestoredPrefixHeadHash: startingRestore.headHash,
          });
          assert.equal(restoreEvidence.status, "pass");
          assert.equal(restoreEvidence.exactPrefixEquality, true);
          assert.equal(restoreEvidence.databaseReadback.eventCount, startingRestore.eventCount);
          assert.equal(restoreEvidence.databaseReadback.headHash, startingRestore.headHash);
          assert.equal(restoreEvidence.fullEventCount, finalEvents.length);
          assert.equal(restoreEvidence.fullHeadHash, finalChain.headHash);
          assert.equal(restoreEvidence.appendOnlySuffixEventCount, finalEvents.length - startingRestore.eventCount);
          assert.ok(restoreEvidence.appendOnlySuffixEventCount > 0);
          timeline.push("previous_independent_restore_prefix_and_current_append_only_extension_verified");
        }
        '''),
    )
    replace_once(
        "scripts/run-hosted-staging-acceptance.mjs",
        "    restoredEvents: restoreEvidence.databaseReadback.eventCount,",
        "    restoredEvents: restoreEvidence.databaseReadback.eventCount,\n    restoredPrefixEvents: restoreEvidence.restoredPrefixEventCount ?? restoreEvidence.databaseReadback.eventCount,\n    currentUnrestoredAppendOnlySuffixEvents: restoreEvidence.appendOnlySuffixEventCount ?? 0,",
    )
    replace_once(
        "scripts/run-hosted-staging-acceptance.mjs",
        "    restoredHeadHash: restoreEvidence.databaseReadback.headHash,",
        "    restoredHeadHash: restoreEvidence.databaseReadback.headHash,\n    currentPrimaryHeadHash: finalChain.headHash,\n    restoreMode: restoreEvidence.exactEventEquality === true ? \"full_exact_restore\" : \"previous_exact_restore_prefix_plus_verified_append_only_extension\",",
    )

    # Supabase Edge acceptance function.
    replace_once(
        "supabase/functions/metaphilosophy-staging-acceptance/index.ts",
        dedent('''
            } else if (action === "report.store") {
              data = await storeReport({
        '''),
        dedent('''
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
        '''),
    )

    prefix_function = dedent('''
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

    ''')
    replace_once(
        "supabase/functions/metaphilosophy-staging-acceptance/index.ts",
        "async function storeReport({ exactReleaseSha, reportKind, statusValue, report, events, backupSha256, headHash, eventCount, claims }) {",
        prefix_function + "async function storeReport({ exactReleaseSha, reportKind, statusValue, report, events, backupSha256, headHash, eventCount, claims }) {",
    )

    anchor_helper = dedent('''
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

    ''')
    replace_once(
        "supabase/functions/metaphilosophy-staging-acceptance/index.ts",
        "async function loadMetadata() {",
        anchor_helper + "async function loadMetadata() {",
    )

    # Static contract tests.
    replace_once(
        "test/hosted-staging-gateway-contract.test.mjs",
        "  assert.match(acceptance, /restore\\.verify/u);",
        "  assert.match(acceptance, /restore\\.verify/u);\n  assert.match(acceptance, /restore\\.prefix\\.verify/u);\n  assert.match(acceptance, /previous_independent_restore_prefix_and_current_append_only_extension_verified/u);\n  assert.doesNotMatch(acceptance, /requires an empty restore ledger/u);",
    )
    replace_once(
        "test/hosted-staging-gateway-contract.test.mjs",
        "  assert.match(gateway, /restore\\.verify/u);",
        "  assert.match(gateway, /restore\\.verify/u);\n  assert.match(gateway, /restore\\.prefix\\.verify/u);\n  assert.match(gateway, /restore_prefix_unanchored/u);\n  assert.match(gateway, /exactPrefixEquality/u);\n  assert.match(gateway, /selectLatestPassingReportForRestorePrefix/u);",
    )
    replace_once(
        "test/hosted-staging-gateway-contract.test.mjs",
        'test("RemoteEventStore sends OIDC and rejects a missing synthetic-only boundary", async () => {',
        dedent('''
        test("restore prefix reuse remains anchored to an earlier exact restore and a strict append-only extension", () => {
          const acceptance = files["scripts/run-hosted-staging-acceptance.mjs"];
          const gateway = files["supabase/functions/metaphilosophy-staging-acceptance/index.ts"];
          assert.match(acceptance, /startingRestore/u);
          assert.match(acceptance, /expectedRestoredPrefixCount/u);
          assert.match(acceptance, /expectedRestoredPrefixHeadHash/u);
          assert.match(acceptance, /appendOnlySuffixEventCount > 0/u);
          assert.match(gateway, /events\.slice\(0, existing\.length\)/u);
          assert.match(gateway, /canonicalStringify\(currentPrefix\) !== canonicalStringify\(existing\)/u);
          assert.match(gateway, /events\.length <= existing\.length/u);
          assert.match(gateway, /priorRestoreAnchorReport/u);
          assert.match(gateway, /researchRatingsAuthorized: false/u);
        });

        test("RemoteEventStore sends OIDC and rejects a missing synthetic-only boundary", async () => {
        '''),
    )

    # Operational record.
    write(
        "ops/next-steps-2026-07-23/hosted-acceptance-restore-prefix-v3-2026-08-07.md",
        dedent('''
        # Hosted acceptance restore-prefix V3 — 2026-08-07

        **Scope:** protected synthetic hosted acceptance only  
        **Research-use state:** `research_ratings_authorized=false`

        ## Defect

        The schema-v4 restore drill was intentionally append-only and designed as a one-time independent restore target. After the first accepted hosted release, later exact-release builds failed before exercising the new product because the retained restore ledger was no longer empty.

        Deleting or resetting that evidence would weaken the audit trail. Reusing it without proving continuity would also be insufficient.

        ## V3 resolution

        Hosted acceptance now has two fail-closed restore modes:

        1. **Empty target:** perform the original exact independent restore of the complete primary chain.
        2. **Retained prior restore:** prove that the retained independently restored chain is byte-for-byte the exact prefix of the current fully verified primary chain; require a prior passing exact-release report with the same prefix count and head hash; require a strict non-empty append-only suffix; and retain the current full backup and chain head in the new exact-release report.

        The current primary chain is still fully rehashed and read back from the hosted database. The prior restore target remains immutable. No evidence is deleted or overwritten.

        ## Boundary

        This change affects only hosted synthetic acceptance infrastructure. It does not issue participant access, create an H-11 participant identity, send outreach, authorize research ratings, change production, pass H-11, or sign H-12.
        ''').strip() + "\n",
    )

    (ROOT / ".github/apply_hosted_acceptance_prefix_v3.py").unlink(missing_ok=True)
    (ROOT / ".github/workflows/apply-hosted-acceptance-prefix-v3.yml").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
