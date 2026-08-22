# BlueDot workload-timing and nonbinding price-evidence protocol v1

**Status:** owner-approved protocol design only; no external evidence has been collected  
**Owner decision:** B — keep the BlueDot request amount and individual allocations unset  
**Approved by:** Ellen Sun  
**Approval date:** 22 August 2026  
**Machine-readable contract:** `ops/next-steps-2026-07-23/bluedot-timing-price-validation-v1.json`  
**Endpoint design:** `mp-pilot-endpoint-design-amendment-v1`

## 1. Decision and purpose

The BlueDot request amount remains **unset**. Individual role allocations remain **unset**. This protocol does not infer a grant request from the existing USD 500 pilot honoraria ceiling, and it does not amend the current pilot honoraria plan.

The purpose is narrower: obtain current evidence about the effort required for Metaphilosophy's added interpretation and disagreement controls, then obtain post-task, nonbinding price expectations from the people who performed each role. Only after that evidence exists may the owner make a separate pricing decision.

The LMCA paper reports that short ordinary ratings take about 5–15 minutes, but that estimate does not cover Metaphilosophy's separate prospective interpretation record, blind self-check, dual blind cause coding, reconciliation rehearsal, orientation, calibration, or administration. No duration for those additional tasks is invented here.

## 2. Bounded measurement geometry

The exercise preserves sibling-critique context while remaining small:

- 2 synthetic positions;
- 4 sibling critiques per position;
- 8 paired critique units;
- 2 separate rater-role people;
- 4 position-conclusion records;
- 16 critique-interpretation records;
- 16 blind initial rating records;
- 4 blind self-check records, selected before any timed work;
- 2 separate cause-coder-role people;
- 16 initial cause-code records; and
- 2 fixed synthetic reconciliation vignettes, timed for both cause coders, producing 4 person-level reconciliation timing records.

The people filling rater and cause-coder roles must be distinct for qualified evidence. The two reconciliation vignettes are workload rehearsals, not adjudication of research data.

## 3. Two evidence stages

### T0 — synthetic instrumentation rehearsal

T0 verifies the counters, active-time timer, pause and interruption handling, exclusion logic, public sanitizer, and fail-closed readiness calculation. It may use the owner or simulated identities and synthetic records.

T0 can establish only `synthetic_instrumentation_ready_not_price_evidence`. It is not expert usability evidence, scientific evidence, a research rating, or price evidence. It cannot select a grant amount.

### T1 — qualified role-specific timing and price evidence

T1 requires two qualified rater-role people and two different qualified cause-coder-role people. Before anyone is contacted or receives access, a separate owner authorization must bind the current participant information, consent, qualification, conflict and exposure checks, private storage, task packet, and payment-question wording.

After each person completes the timed scope, that person records a nonbinding fixed-honorarium expectation in USD. The record is not a promise by either side. T1 is workload and price evidence, not the beginning or completion of the 48-critique research study.

This protocol does not authorize T1, outreach, participant access, payment, or grant submission.

## 4. Timing rules

Every work unit uses `monotonic_active_timer_v1` and records:

- pseudonymous evidence-person ID;
- role;
- stage;
- synthetic position and critique slot where applicable;
- start and completion timestamps;
- active seconds;
- paused seconds;
- interruption count;
- completion or exclusion state; and
- a coded exclusion reason when excluded.

Active time excludes declared pauses, unrelated interruptions, unattended network waiting, time before affirmative task start, and time after submission or abandonment. Wall-clock time and active time are retained separately. Orientation, calibration, and administration are not folded into ordinary rating or cause-coding time. Missing timing is never imputed, and an incomplete record is never silently replaced.

The separately timed stages are:

1. orientation;
2. calibration;
3. position-conclusion interpretation;
4. critique interpretation, including target, priced-in status, confidence, and assumptions;
5. initial scoring and rationale;
6. blind self-check;
7. initial interpretation-cause coding;
8. reconciliation rehearsal; and
9. administration.

## 5. Qualified-evidence requirements

For evidence to reach an owner decision gate, the private record must contain exactly two qualified raters and two separate qualified cause coders. For every person, the record must show privately that:

- qualification was documented;
- participant information was supplied;
- consent was recorded;
- conflicts and prior exposure were checked;
- calibration was completed;
- the task scope and nonbinding price question were understood; and
- a post-task nonbinding price record was completed.

All required core-stage work units must be complete, non-imputed, and linked to one pseudonymous person and one synthetic slot. Any withdrawal, incomplete role, or unresolved P0/P1 defect keeps pricing readiness closed.

## 6. Nonbinding price records

There are four private post-task price records, one per person. Each records:

- role;
- USD currency;
- confirmation that the completed scope was reviewed;
- confirmation that the response is post-task and nonbinding;
- response status;
- minimum acceptable fixed honorarium;
- preferred fixed honorarium; and
- maximum acceptable workload hours.

A usable amount record requires nonnegative minimum and preferred amounts, with preferred amount at least the minimum. `declines_fixed_honorarium_model` and `needs_scope_revision` are valid findings, but they route to an owner redesign decision rather than a pricing-ready state.

Individual price amounts and role-level two-person ranges are private. They are not included in the public readback.

## 7. Readiness states

The evaluator may emit only:

- `not_ready_to_price`;
- `synthetic_instrumentation_ready_not_price_evidence`;
- `blocked_by_unresolved_serious_defect`;
- `evidence_ready_for_owner_redesign_decision`; or
- `evidence_ready_for_owner_pricing_decision`.

No state automatically selects a grant amount or individual allocation. Even complete qualified evidence ends at an explicit owner decision gate.

## 8. Privacy and publication boundary

The private evidence uses pseudonymous IDs. Legal names, payment details, and qualification documents remain in a separate access-controlled system.

The public readback omits person identifiers, item text, free-text rationales, individual timestamps, individual timing records, individual price amounts or ranges, payment details, jurisdictions, and qualification documents. It may show only aggregate counts, role-by-stage timing summaries, complete price-record counts by role, unresolved serious-defect count, readiness state, and explicit claim and authorization boundaries.

## 9. Claim boundary

Completion of T0 is not expert usability validation and is not price evidence. Completion of T1 is not a completed research study. No calibration record is a Metaphilosophy research rating. No result validates a benchmark, expert reliability, or model improvement. No person is committed, no payment is promised, and no BlueDot amount is selected by this protocol.

## 10. Authorization boundary

All of the following remain false:

- external outreach;
- participant selection or access;
- human timing collection;
- price-acceptance collection;
- research ratings or research start;
- payment;
- grant submission or grant-amount selection;
- publication of private evidence;
- merge or deployment; and
- production or staging data mutation.

A later action must cite separate, current approval records. Grant receipt itself would not waive participant, research, privacy, payment, or release gates.
