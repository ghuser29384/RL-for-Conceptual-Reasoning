# Metaphilosophy pre-outreach product and workflow quality gate

**Gate version:** 6  
**Opened:** 2026-08-01  
**Updated:** 2026-08-04  
**Status:** public product P-01 through P-09 passed; human-rating workflow H-01 through H-12 blocked; final send review blocked  
**Effect:** no email, Gmail draft, adviser contact, rating request, participant outreach, recruitment, assignment, calibration, rating, payment, publication, funding submission, or Phase 2 action is authorized by this file.

## Controlling distinction

The audited public site is functioning and trustworthy. The external human-expert rating workflow has not been demonstrated end to end.

Public production quality is necessary but insufficient. An expert must be able to authenticate, access only the assigned blind packet, understand and apply the complete LMCA rubric, autosave and resume, submit exactly once, recover from failure, obtain a receipt, and have the rating persist and enter the controlled append-only dataset. The current evidence does not establish that journey.

The controlling human-workflow audit is:

- `ops/next-steps-2026-07-23/human-expert-rating-workflow-audit-2026-08-04.md`

The old methodological-adviser packet is superseded:

- `ops/next-steps-2026-07-23/p-10-wave-1-owner-review-packet-2026-08-02.md`

## Public product gates

The exact production release remains:

- canonical origin: `https://www.metaphilosophy.org`;
- source commit: `23c4a7407aa7dcb6c079ce0a6bf7058c58284154`;
- release marker: `mp-preoutreach-20260802-r1`;
- deployment: `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC`; and
- production-audit artifact: `8830142366`, SHA-256 `fe14cf83f90c07ae7cddf440f7d168bc22dc6a5aedff6e2c39571895cd607cbc`.

| ID | Public requirement | State |
|---|---|---|
| P-01 | Truthful separation of external LMCA work, the unrated synthetic library, and the unstarted pilot | **Passed** |
| P-02 | Complete public navigation | **Passed** |
| P-03 | Public protocol quality and claim restraint | **Passed** |
| P-04 | Closed-intake integrity | **Passed** |
| P-05 | Accessibility and responsive structure | **Passed** |
| P-06 | Deterministic repository verification | **Passed** |
| P-07 | Production availability | **Passed** |
| P-08 | Rendered desktop/mobile audit | **Passed** |
| P-09 | Public runtime and route safety | **Passed** |

These gates establish that Metaphilosophy can be inspected publicly without misleading prospective experts. They do not establish that experts can perform rating work.

## Human-expert workflow gates

| ID | Operational requirement | Current state |
|---|---|---|
| H-01 | Authenticated non-public staging rater workspace | **Blocked** |
| H-02 | Reproducible integrated server or documented staging architecture | **Blocked** |
| H-03 | Invitation, identity, expiry, revocation, and session lifecycle | **Blocked** |
| H-04 | Browser-tested complete LMCA rating interaction | **Blocked** |
| H-05 | Autosave, resume, retry, conflict, and failure recovery | **Blocked** |
| H-06 | Durable browser-to-database persistence, restart, backup, and restore | **Blocked** |
| H-07 | Correction, withdrawal, and immutable-history UX | **Blocked** |
| H-08 | Two-rater blindness and cross-account isolation | **Blocked** |
| H-09 | Human adjudication handoff and unresolved closure | **Blocked** |
| H-10 | Support and incident runbooks exercised | **Blocked** |
| H-11 | Two qualified synthetic dry-run raters complete the journey | **Blocked** |
| H-12 | Versioned operations-owner readiness signature | **Blocked** |

The public workspace correctly states that the rating workspace is closed. The repository’s `dev` and `serve` commands point to an empty `src/server.mjs`. Controlled packet generation, distribution, rating work, quality-control acceptance, ingestion, adjudication, and payment remain unauthorized. Synthetic contract tests do not pass H-01 through H-12 by themselves.

## Required staged acceptance run

Before any human-rating request, retain evidence that one operator, two isolated synthetic raters, and one synthetic adjudicator completed the exact rehearsal defined in the human-workflow audit. The run must cover:

- access issuance, expiry, revocation, replacement, and cross-account denial;
- position plus four sibling-critique presentation;
- complete LMCA rubric and scoring guidance;
- seven scores plus every auxiliary field;
- autosave, close, reopen, resume, and network failure;
- exact-once submission and receipt;
- replay and tamper rejection;
- durable readback after process restart;
- correction and withdrawal;
- predecessor-linked rerating and explicit unresolved closure;
- audit export, backup, restore, and operator recovery; and
- manual usability sign-off with no P0/P1 defect.

## Final send gate

Only after H-01 through H-12 pass may a new rating-request packet enter final review. That replacement packet must state the actual bounded workload, exact honorarium terms, data and attribution terms, support route, task window, withdrawal rules, and the fact that expressing interest creates no obligation.

A valid final send decision must separately approve:

- exact named recipients and expertise fit;
- exact rating workload and topic coverage;
- the working authenticated task-access process;
- sender identity and Gmail account;
- exact subject and message;
- protocol and task links;
- honorarium disclosure;
- one follow-up or no follow-up;
- reply and support ownership; and
- a strict prohibition on sending beyond the approved scope.

## Current conclusion

**Do not send or draft rating-request emails.** Build the authenticated staging rater journey, complete the staged acceptance run, resolve every H-01–H-12 blocker, and obtain the signed readiness record first.
