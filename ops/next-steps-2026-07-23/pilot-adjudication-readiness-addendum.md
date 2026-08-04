# Pilot adjudication readiness addendum

**Status:** blocked template only.  
**Parent effect:** none. This addendum does not alter or pass any of the six pre-start gates in `pilot-readiness-ledger.json`.  
**Execution effect:** none. No real policy, adjudicator, case, discussion, rerating, closure, snapshot, honorarium ledger, or payment is authorized.

This record governs the post-initial-rating path. It begins only after accepted initial ratings exist and keeps adjudication separate from the controls needed to start the pilot.

## Current authorization state

| Activity | Authorized? |
|---|---:|
| Q-006A consultation design | No — owner decision pending |
| Q-006B operative adjudication policy | No |
| Q-006C dedicated adjudicator roster | No |
| Accepted-initial snapshot freeze | No |
| Controlled case generation | No |
| Case distribution | No |
| Adjudication work | No |
| Rater discussion | No |
| Append-only rerating work | No |
| Resolution quality control or acceptance | No |
| Final snapshot generation | No |
| Final snapshot sign-off | No |
| Adjudication-unit ledger freeze | No |
| Honorarium payment | No |
| Analysis or publication | No |
| Funding submission or Phase 2 | No |

## Why this is separate from pre-start readiness

Assignment, task-packet generation, distribution, and the official rating start must be ready before the pilot begins. Adjudication cannot be completed before initial ratings exist. Mixing those stages into one readiness ledger would make a post-rating obligation look like a prerequisite for starting, or make starting the pilot look like authorization to adjudicate.

The addendum therefore uses seven post-rating closure gates without changing the existing six pre-start gates.

## Seven post-rating closure gates

1. **A-01 — freeze the inputs.** The accepted-initial snapshot, explicitly operative policy, and two-adjudicator roster are frozen with hashes and versioned approvals.
2. **A-02 — generate required cases.** One critique-level case is created for every critique with at least one operative route. Assignment topic, conflict, exposure, and role-separation checks pass.
3. **A-03 — authorize delivery and work.** Case distribution and adjudication work are separately authorized through the approved delivery process.
4. **A-04 — authorize any rater reconsideration.** Rater discussion and append-only rerating work, when needed, are separately assigned and completed. Adjudicators never edit ratings.
5. **A-05 — close every required case.** Each case receives an independently quality-controlled accepted closure, including explicit unresolved closure when object-level disagreement remains.
6. **A-06 — freeze and sign the final label snapshot.** The snapshot preserves the initial and latest-accepted rating distributions and is signed by both dedicated adjudicators. It does not impose a consensus score.
7. **A-07 — freeze the adjudication-unit ledger.** Accepted required case closures and accepted required snapshot sign-offs are converted into candidate units. This does not authorize payment.

Analysis, publication, funding submission, and Phase 2 remain separate later decisions even when all seven gates pass.

## Controlled evidence required

### Operative policy

The private record must contain the approved policy ID and version, operative routes, numerical and low-clarity thresholds, Q-006B approval record, approval timestamp, and policy SHA-256. The checked-in diagnostic policy has zero operative routes and cannot create cases.

### Dedicated adjudicators

Exactly two dedicated adjudicators must have qualification evidence, approved topic families, consent, completed calibration, conflict and prior-exposure records, availability, and role separation from the six core raters.

### Accepted-initial snapshot

The controlled snapshot records the 12-position / 48-critique manifest, accepted initial rating records, rubric version and hash, latest initial lock timestamp, and dataset commitment. If the pilot closes early, the exact incomplete state and owner-approved closure record replace any false claim of 96 completed ratings.

### Case generation and assignment

The private case set records the generation authorization, assignment-seed commitment, individual case-packet hashes, case-set commitment, adjudicator balance, topic/conflict/exposure checks, and controlled storage path. No eligible adjudicator means no assignment; constraints are not relaxed.

### Distribution and work

The controlled record covers recipient authentication, distribution and work authorizations, access duration, revocation, support, suspected-leak procedures, and any separately authorized rater-discussion or rerating work.

### Resolution

Each case closure records every operative route, object-level considerations, any append-only rerating IDs, residual disagreement when unresolved, no-score-imposition and no-convergence-pressure acknowledgements, independent quality control, and the resolution-set commitment.

### Final snapshot

The private snapshot binds the rating dataset, initial snapshot, case set, resolution set, per-critique initial and latest-accepted ratings, unresolved-case flags, snapshot body, both adjudicator sign-offs, and final snapshot commitment.

### Adjudication honoraria

The USD 100 reserve recognizes two event types already approved in the honoraria plan:

- an accepted adjudication record closing an operator-assigned required case; and
- an accepted required final label-snapshot sign-off.

Each accepted event is a candidate one-unit record. It does not authorize payment. The final accepted-unit ledger, contributor eligibility, administrative checks, largest-remainder calculation, and separate disbursement authorization remain necessary. Unused funds remain unspent.

## Invariants

Initial ratings are immutable. A valid rerating is append-only, operator-assigned, object-level, and authored by an original rater. An adjudicator can record considerations and case disposition but cannot create a replacement score.

Discussion is not required to produce agreement. A residual interpretation, evidence, or philosophical disagreement may close as explicitly unresolved and remain visible in the final snapshot.

The final snapshot is distribution-preserving. It records what the initial raters said, what their latest accepted ratings are, and what the adjudication record resolved or left unresolved. It does not average the judgments into an invented final score.

## Immediate next action

Q-006A remains the immediate owner decision. Approval would authorize consultation preparation and non-final item and calibration screening only. It would not approve operative routes, select adjudicators, generate or distribute cases, begin discussion or adjudication, assign reratings, accept closures, sign a final snapshot, freeze honorarium units, or make payments.
