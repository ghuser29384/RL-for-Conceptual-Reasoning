# Human-expert rating workflow audit — 2026-08-04

**Verdict:** **not operationally ready; do not send rating requests.**  
**Confidence:** above 99% that the current evidence is insufficient to call the external human-expert workflow functional.  
**Scope:** the complete journey from invitation and authentication through blind rating, submission, persistence, correction, adjudication, withdrawal, and operator recovery.  
**Email state:** no Gmail draft created; no email sent; no follow-up scheduled.  
**Supersedes for outreach purposes:** `p-10-wave-1-owner-review-packet-2026-08-02.md` and all drafts requesting methodological criticism.

## Executive finding

Metaphilosophy currently has two materially different systems:

1. a public research and trust surface that has passed production checks; and
2. substantial synthetic, contract-level infrastructure for assignment, blind packets, submission validation, ingestion, adjudication, and analysis.

Neither establishes that an invited external philosopher can presently open a secure assignment, complete the LMCA-based rating task, leave and resume safely, submit ratings, receive a receipt, and have those ratings persist and enter the controlled dataset correctly.

The public `/workspace` and `/reference` routes intentionally render a readiness gate. The development command points to `src/server.mjs`, but that file is empty. The controlled packet, distribution, rating, quality-control, and ingestion contracts remain non-binding and unauthorized for real records. The current readiness ledger explicitly marks rating work, distribution, ingestion, adjudication, and payment as unauthorized and `ready_to_start` as false.

Therefore, production-site quality cannot be used as evidence that the human-rating workflow is ready. Sending an email that asks an expert to perform ratings would promise a task that Metaphilosophy cannot yet demonstrate end to end.

## What is genuinely implemented and valuable

The repository contains strong synthetic and contract-level controls for:

- the LMCA seven-dimensional rubric;
- same-position sibling-critique grouping;
- procedural blindness to source, author/model identity, provisional strata, other-rater judgments, labels, and adjudication state;
- participant-specific opaque task tokens;
- task-bundle and rubric commitments;
- exactly-once assigned-response validation;
- malformed, duplicate, unassigned, or altered submission rejection;
- append-only accepted initial records;
- replay and duplicate-initial-rating rejection;
- explicit accepted, rejected, and already-materialized quality-control dispositions;
- private operator-index and ingestion receipts;
- predecessor-linked object-level reratings;
- adjudication without imposed consensus; and
- preservation of unresolved disagreement.

These controls materially reduce methodological and data-integrity risk. They are not equivalent to a usable human product.

## LMCA fidelity requirements

The eventual rater-facing workflow must preserve the parts of the LMCA method that the pilot claims to adapt:

- rate contextualized position–critique pairs, not bottom-line philosophical conclusions;
- use the seven 0–1 dimensions: centrality, strength, correctness, clarity, dead weight, single issue, and overall;
- show critiques of the same position together;
- hide source and confounding metadata during initial rating;
- keep initial raters blind to other raters’ judgments;
- preserve every original rating when an object-level reconsideration produces a revision;
- treat `strength × centrality`, rather than either dimension alone, as the substantive-impact quantity;
- apply the low-clarity branch when clarity is below 0.5; and
- support practical checking of correctness-sensitive claims.

The interface must expose the full LMCA rubric and scoring guidance at the point of judgment rather than only naming the dimensions.

## Release-blocking findings

### H-01 — no externally usable production workspace

The public workspace is intentionally closed and says that production expert ratings have not started. This is correct public behavior, but it means an invited expert has no production rating route.

**Required evidence to pass:** a separate authenticated staging workspace, inaccessible to the public, that supports the complete assigned-rater journey.

### H-02 — no functioning repository development server

`package.json` maps both `npm run dev` and `npm run serve` to `node src/server.mjs`. The branch version of `src/server.mjs` is empty.

**Required evidence to pass:** a reproducible integrated server or an explicitly documented alternative staging architecture, with a clean-start command and health check.

### H-03 — invitation, identity, and session lifecycle not demonstrated

No audited flow demonstrates:

- a single intended recipient receiving a task access mechanism;
- expiry, one-time use, revocation, and replacement;
- account or magic-link authentication;
- session expiry and reauthentication;
- prevention of one rater accessing another rater’s packet; or
- operator recovery from a lost link or compromised session.

**Required evidence to pass:** automated and manual tests for issue, open, expire, revoke, replace, cross-account denial, and session recovery.

### H-04 — LMCA rating interaction not demonstrated in a browser

The repository validates synthetic JSON packets and submissions, but no retained browser evidence establishes that a human can:

- read a position with all four sibling critiques;
- consult the exact rubric definitions and examples;
- enter all seven scores in the interval `[0,1]`;
- record rationale, confidence, time, insufficient-context status, verification status, and item-integrity flags;
- understand the `strength × centrality` and clarity-below-0.5 rules;
- navigate without losing work; and
- distinguish draft, locked, submitted, and accepted states.

**Required evidence to pass:** desktop and mobile browser tests plus manual expert-style walkthroughs using synthetic content.

### H-05 — autosave, resume, and failure recovery not demonstrated

No accepted evidence establishes safe behavior under:

- tab close or browser restart;
- transient network failure;
- duplicate clicks;
- stale version conflict;
- expired session during editing;
- server restart; or
- partial submission.

**Required evidence to pass:** deterministic persistence and recovery tests with no lost or duplicated scores.

### H-06 — durable controlled persistence not demonstrated end to end

The ingestion engine defines append-only, replay-safe materialization, but the audited evidence is synthetic and contract-level. No full browser-to-database run demonstrates that the submitted values, bundle binding, timestamps, and provenance survive process restart and are correctly readable by the operator.

**Required evidence to pass:** an isolated staging database run with before/after commitments, restart, readback, backup, restore, and audit-log verification.

### H-07 — correction and withdrawal UX not demonstrated

The contracts distinguish operational correction from object-level rerating, but no human workflow shows:

- how a rater reports a mistake;
- what remains immutable;
- how a replacement submission is requested;
- how a withdrawal request is recorded;
- what data remain retained; and
- which accepted contribution units remain credited.

**Required evidence to pass:** synthetic correction, withdrawal, and operator-response drills with rater-visible status.

### H-08 — two-rater blindness and isolation not demonstrated end to end

The packet generator removes hidden fields, but no dual-browser test demonstrates that two assigned raters cannot infer or access one another’s identities, tokens, drafts, submissions, labels, or adjudication state.

**Required evidence to pass:** simultaneous two-account tests, direct-object-reference attempts, token substitution, and cross-packet correlation checks.

### H-09 — adjudication handoff not demonstrated as a human workflow

Synthetic adjudication contracts exist, but no staged operator/adjudicator flow establishes case receipt, conflict exclusion, discussion boundaries, explicit unresolved closure, independent quality control, and final snapshot sign-off.

**Required evidence to pass:** one closed-without-rerating case, one valid predecessor-linked rerating case, and one explicitly unresolved case, all exercised through the intended operator interface.

### H-10 — support and incident operations not demonstrated

There is no audited runbook execution for:

- inaccessible assignment;
- suspected source leak;
- wrong item or version;
- accidental disclosure;
- compromised token;
- rater unavailability;
- duplicate submission;
- database outage; or
- operator replacement.

**Required evidence to pass:** named private roles, support route, severity and response rules, and at least one tabletop recovery drill.

### H-11 — real-user usability not demonstrated

Contract tests cannot establish whether a philosopher understands the task, rubric, status transitions, or time commitment.

**Required evidence to pass:** at least two qualified internal or volunteer dry-run raters, not used in the production analysis, completing the full synthetic workflow and reporting no P0/P1 usability or comprehension defect.

### H-12 — no signed operational-readiness record

The effective readiness ledger states that R-02 through R-06 are blocked and `ready_to_start` is false.

**Required evidence to pass:** a versioned operations-owner signature that cites every H-01–H-11 artifact and does not infer readiness from synthetic unit tests alone.

## Mandatory staging acceptance run

Before any rating-request email, run one isolated, non-production rehearsal with:

- one operator;
- two synthetic core-rater identities;
- one synthetic adjudicator identity;
- one position and four sibling critiques;
- no real protected item;
- no real expert rating used in research results; and
- a disposable staging database and controlled storage directory.

The rehearsal must execute, in order:

1. issue two distinct expiring access mechanisms;
2. authenticate in two isolated browser contexts;
3. confirm cross-account and direct-object access denial;
4. open the assigned position and four sibling critiques;
5. inspect the complete LMCA rubric;
6. enter, autosave, close, reopen, and resume draft ratings;
7. simulate a failed request and retry without duplication;
8. submit all required fields and obtain a receipt;
9. reject exact replay and a tampered packet;
10. persist and read back both initial ratings after server restart;
11. open an adjudication case without exposing one rater’s draft to the other;
12. preserve one original rating while accepting a predecessor-linked rerating;
13. close one issue explicitly unresolved;
14. exercise a correction and withdrawal request;
15. export the private audit trail and privacy-safe public summary;
16. back up and restore the staging dataset; and
17. obtain operator and dry-run-rater sign-off.

Every failure must remain fail-closed. No step may rely on manually editing accepted rating records.

## Operational readiness rule

Do not use “perfectly functional.” A defensible release standard is:

> The human-expert workflow is operationally ready for a bounded pilot when all H-01–H-12 gates pass on the exact staged release, no P0/P1 defect remains, all P2 defects have documented workarounds or deferrals, the LMCA-derived rubric is faithfully rendered, and Ellen Sun signs the versioned readiness record.

A passing rehearsal authorizes only the separately approved recipients and workload. It does not automatically authorize public recruitment, additional participants, publication, payment, funding submission, or Phase 2.

## Current decision

- human-expert rating outreach: **blocked**;
- stale methodological-criticism outreach packet: **superseded and prohibited**;
- new rating-request drafts: **not approved for Gmail drafting or sending**;
- next engineering task: build and verify the authenticated staging rater journey;
- next research task: freeze no real item until the human workflow and Q-006B gates are ready; and
- next owner decision: only after the complete staging acceptance evidence is available.
