# Metaphilosophy controlled-rating support and incident runbook

**Version:** 1.0 — 2026-08-05  
**Scope:** synthetic rehearsal and, only after a later signed readiness record, the bounded 48-critique pilot.  
**Current research-rating authorization:** **false**.  
**Operations owner:** Ellen Sun.  
**Default rule:** fail closed. Do not repair accepted records by editing the event ledger.

## Private roles

| Role | Authority | Must not do |
|---|---|---|
| Operations owner | Final staging-readiness decision, participant authorization, incident severity override, payment release | Sign readiness without cited evidence; expose tokens or private exports in public channels |
| Staging operator | Issue/revoke/replace invites, assign eligible synthetic packets, inspect private audit export, open/close adjudication cases under policy | View or alter draft content merely to influence a rating; edit accepted events; reuse one participant’s access for another |
| Rater | Access only assigned position bundles; save drafts; submit; request correction or withdrawal | Share invitation/session; access another packet; use prohibited assistance; overwrite a locked initial rating |
| Adjudicator | Independently review triggered cases and record object-level disposition | Force consensus; see the other adjudicator’s disposition before locking an independent review; delete initial ratings |
| Infrastructure custodian | Maintain isolated database, encrypted backups, hosted preview secrets and recovery procedure | Use Moral Trade or Normativity databases; copy private exports into analytics, logs, issue bodies or public storage |

Until named people accept each private role, Ellen Sun is accountable but no person other than Ellen is authorized to operate real participant records.

## Support route

Before any external dry run, establish one private support address or form controlled by the operations owner. The invitation must state:

- the support route;
- expected response time;
- that banking credentials, tax identifiers and identity documents must not be sent through ordinary email;
- that a lost, forwarded or exposed invitation should be reported immediately;
- that no response is research data unless the invitation explicitly says the pilot has begun.

The public website and GitHub issues are **not** support channels for participant-specific incidents.

## Severity model

### P0 — stop all staging and rating activity

Examples:

- cross-account access or direct-object authorization failure;
- exposed live invite/session, private export or participant identity;
- accepted event-chain mismatch, unexplained sequence gap or successful mutation/deletion;
- protected item or other-rater judgment exposed before lock;
- staging writes reaching a non-Metaphilosophy database;
- backup cannot be restored while the primary store is unavailable;
- a real research rating collected before readiness authorization.

Response:

1. Revoke affected invitations and sessions immediately.
2. Disable hosted staging access or remove the preview alias.
3. Preserve logs, exports, hashes and timestamps without editing accepted events.
4. Notify the operations owner immediately.
5. Identify affected records and people; do not send a speculative public notice.
6. Restore only into an isolated replacement environment and verify the full chain.
7. Resume only after a written root-cause review, a regression test and owner sign-off.

### P1 — block affected participant or workflow

Examples:

- autosave loses or duplicates a draft;
- stale-write conflict is not surfaced safely;
- invitation expiry/revocation/replacement behaves incorrectly;
- submission receipt is missing or idempotency fails;
- correction, withdrawal, re-rating or adjudication handoff cannot complete;
- mobile or desktop UI prevents completion of required fields;
- wrong item/version assigned but not submitted.

Response target: acknowledge within one operating day. Pause the affected identity or workflow. Reassign only unstarted work. Preserve accepted units and immutable records. Resume after the exact path passes a synthetic regression test.

### P2 — documented workaround permitted before a bounded dry run

Examples:

- nonblocking wording, layout or accessibility defect with a safe workaround;
- delayed operator metric that does not affect assignment, blindness, persistence or submission;
- cosmetic export formatting issue with correct underlying private data.

A workaround must be written, communicated to affected testers and assigned an owner and deadline. P2 defects may not be silently reclassified as acceptable for research collection.

### P3 — backlog

Cosmetic or convenience issues with no effect on comprehension, accessibility target, data integrity, privacy, timing or workload.

## Incident playbooks

### Inaccessible or expired assignment

1. Confirm the intended identity without asking for sensitive documents by ordinary email.
2. Inspect invite status and audit event.
3. Revoke the old invite whether or not compromise is suspected.
4. Issue a replacement invite with a new token and appropriate expiry.
5. Confirm that the old token fails and the new token opens only the intended identity.
6. Record the support outcome in the private incident log.

### Suspected token compromise or accidental forwarding

Treat as P0 if an unauthorized person may have redeemed it; otherwise P1.

1. Revoke invite and all sessions for the identity.
2. Inspect redemption time, user-agent hash, assignments and event chain.
3. Quarantine any draft or submission whose authorship is uncertain; do not delete it.
4. Issue replacement access only after operator review.
5. Determine whether another participant or item was exposed.

### Wrong position, critique or version

1. Pause the assignment before submission.
2. Compare packet commitment and controlled manifest.
3. Do not edit the existing packet in place.
4. Withdraw the assignment with an explicit reason and issue a new versioned assignment.
5. If submitted, open an item-integrity adjudication case and exclude the record from analysis until resolved.

### Source, model or label leakage

1. Stop the affected bundle and classify at least P1; P0 if another rater’s judgment or protected material was exposed.
2. Record exactly what was visible and for how long.
3. Mark exposure metadata on the identity and item.
4. Do not reuse the person as a clean initial rater for that item.
5. Replace the item or assignment under the frozen exposure policy.

### Duplicate click, request retry or network interruption

1. Use the original idempotency key for a retry of the same submission.
2. Return the existing receipt when payload and packet commitments match.
3. Reject reuse of that key for different content.
4. Reject a second submission with a new key after the assignment is locked.
5. Never create a second initial rating for the same rater–critique pair.

### Database outage or process restart

1. Stop new writes; keep the interface fail closed.
2. Verify the event chain and schema metadata before reopening.
3. Restart and confirm drafts and sessions behave as specified.
4. If the primary store is corrupt or unavailable, restore the latest verified backup into a new isolated store.
5. Compare event count and head hash to the backup receipt.
6. Record any events after the backup separately; never splice or renumber the chain manually.

### Correction request

1. Initial ratings remain immutable.
2. Determine whether the issue is operational formatting or an object-level reconsideration.
3. Reject avoidable self-correction that does not warrant a new substantive record, or approve a predecessor-linked re-rating assignment.
4. Record the reason and disposition.
5. Keep both initial and revised records in private exports and analysis provenance.

### Withdrawal request

1. Acknowledge the request and pause new assignments.
2. Record the reason and timestamp.
3. Preserve accepted records and earned units under the approved policy.
4. Apply the participant-facing retention notice; do not promise deletion that conflicts with audit or research-integrity obligations.
5. Reassign only overdue or unstarted work after eligibility checks.

### Rater unavailability

1. Request a recovery or withdrawal update.
2. After 48 hours without an approved recovery plan, pause new work and reassign unstarted assignments.
3. Preserve accepted units and records.
4. Require a replacement to pass the same consent, conflict, exposure and calibration gates.

### Adjudication cannot reach agreement

1. Do not force consensus.
2. Record competing interpretations and object-level considerations.
3. Close explicitly as unresolved when appropriate.
4. Preserve initial ratings, every valid re-rating and each independent adjudication review.
5. Carry uncertainty into the frozen label snapshot and public limitations.

### Operator replacement

1. Revoke prior operator sessions and rotate staging secrets.
2. Verify the successor’s authorization from the operations owner.
3. Provide the runbook, schema receipts, current chain head, outstanding incidents and backup verification.
4. Exercise one synthetic invite, submission and export before granting access to any real participant record.

## Backup and restoration

Before external dry runs:

- use a dedicated Metaphilosophy staging database;
- retain encrypted, access-controlled backups outside the application process;
- produce a receipt containing event count, chain head, schema version, backup time and storage location;
- exercise restoration into a disposable isolated database;
- verify every application event hash in addition to database sequence/linkage checks;
- keep `research_ratings_authorized=false` until the owner’s readiness signature.

## Evidence mapping for the automated synthetic rehearsal

`scripts/smoke-staging-server.mjs` exercises:

- revoked and replaced invite recovery;
- two isolated rater identities and cross-account denial;
- autosave, stale-version conflict and restart/resume;
- tampered packet rejection and exactly-once submission receipt;
- immutable initials plus predecessor-assignment-linked re-rating;
- unresolved adjudication closure;
- correction and withdrawal requests;
- private and public-safe exports; and
- backup/restore with matching chain head.

That automated rehearsal is necessary but **does not satisfy the two-qualified-human-dry-run requirement or the owner readiness signature**.

## Required human tabletop before H-10 can pass

Using synthetic identities only, the operations owner and one operator must walk through:

1. a forwarded live invitation;
2. a wrong item/version discovered before submission;
3. a network retry after a successful but unacknowledged submission;
4. a database outage followed by verified restore;
5. an explicitly unresolved adjudication; and
6. operator replacement.

For each scenario record detection, severity, first action, evidence retained, participant communication, recovery condition and owner disposition. The tabletop must identify no unresolved P0/P1 defect.

## Current gate status

- Runbook written: **yes**.
- Automated synthetic recovery rehearsal: **implemented; CI result pending at this version**.
- Human tabletop executed: **no**.
- H-10 passed: **no**.
- Rater outreach authorized: **no**.
- Real research ratings authorized: **no**.
