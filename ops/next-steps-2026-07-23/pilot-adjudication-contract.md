# Pilot adjudication and final label-snapshot contract

**Status:** implementation template only; non-binding; no real case, resolution, rerating assignment, sign-off, or honorarium event exists.  
**Does not authorize:** case generation or distribution for real records, adjudication work, rater discussion, rerating, resolution acceptance, snapshot sign-off, payment, publication, funding submission, or Phase 2.

## Why this layer is needed

The pilot can now generate a conflict-aware assignment, produce blind participant packets, validate packet-bound submissions, and materialize explicitly accepted initial ratings. The analysis engine can identify candidate and operative review routes. The remaining gap was what happens after an operative route exists.

A case workflow must not:

- open work from merely diagnostic thresholds;
- let an adjudicator overwrite either initial rating;
- force raters to converge because someone else disagrees;
- hide an interpretation dispute that remains unresolved;
- accept a rerating unrelated to the preserved initial record;
- fabricate a single consensus score where the data support only a distribution; or
- turn an accepted case record into automatic payment or Phase 2 authorization.

The adjudication layer closes this gap while retaining every original judgment.

## What is derived from LMCA

The supplied LMCA paper reports that initial raters are blind to other ratings, that large disagreements are discussed through object-level considerations, that differences in interpretation are a major source of difficult disagreements, and that original ratings are always preserved when reconsideration produces a new rating. It also reports residual disagreements after discussion rather than treating discussion as guaranteed convergence.

Metaphilosophy preserves these principles. Deterministic case identifiers, conflict-aware adjudicator assignment, case commitments, versioned closure records, quality-control decisions, honorarium-event candidates, and two-adjudicator snapshot sign-off are project-specific operational extensions.

## Opening required cases

A real case may be generated only from an analysis policy with explicitly approved operative routes. The checked-in diagnostic policy has zero approved routes and cannot open work.

The case generator uses only the accepted-initial snapshot. A critique with one or more operative routes creates one critique-level case, even when several routes apply. The packet records:

- the exact accepted-initial snapshot commitment;
- the approved policy identity and commitment;
- the position and critique identifiers;
- every operative route and its observed details;
- the two preserved initial rating records;
- the topic family;
- the assigned dedicated adjudicator;
- the opening timestamp; and
- explicit declarations that downstream activity is unauthorized.

The individual packet hash binds the full case body. A case-set commitment binds the sorted packet hashes.

## Adjudicator assignment

The pilot roster contains exactly two dedicated adjudicators. Each must be qualified, consented, calibrated, available, and separately approved for the case topic family.

Hard exclusions are:

- position or critique conflict;
- prior label exposure to the position;
- inadequate topic coverage; and
- being one of the two original case raters.

Cases are assigned to the least-loaded eligible adjudicator. A secret-seed SHA-256 ranking breaks ties deterministically. Assignment counts may differ by at most one. When no eligible adjudicator exists, the system produces no assignment rather than relaxing a constraint.

Generating a case packet does not authorize distributing it or beginning adjudication.

## Resolution records

A case may close in one of three ways:

### Closed without rerating

Object-level review resolves every operative route, and neither original rater changes an accepted rating.

### Closed after rerating

At least one original rater independently accepts an object-level consideration and submits an operator-assigned append-only rerating. Every accepted rerating for the case up to the resolution time must be referenced.

### Closed unresolved

At least one operative route remains unresolved. The resolution must preserve the residual disagreement or alternative interpretation explicitly rather than invent agreement.

Every record contains:

- one route disposition and rationale for every operative route;
- object-level considerations;
- interpretation, context, and verification notes where relevant;
- referenced rerating IDs;
- a residual-disagreement summary when unresolved;
- acknowledgements that minority interpretations are preserved, scores are not imposed, and convergence pressure is prohibited; and
- an independent quality-control decision by an approved operator who is not the adjudicator.

The record cannot contain `final_scores`, `consensus_scores`, replacement or imposed scores, a winning rater, majority-vote result, or forced-convergence instruction.

A quality-control-rejected resolution can be corrected through a later predecessor-linked version. No resolution may follow an accepted closure.

## Rerating boundary

The adjudicator cannot create or edit a rating. A valid case rerating must be:

- accepted and operator-assigned;
- authored by one of the two original raters;
- for the same position and critique;
- locked after the case opened;
- linked through a contiguous predecessor chain to one of the preserved initial ratings; and
- supported by an object-level revision reason.

Operational correction of an unaccepted submission is not an object-level rerating. Conversely, an object-level change to an accepted rating is not a clerical correction.

## Final label snapshot

The final snapshot is distribution-preserving. It does not create a synthetic consensus score.

For every critique, the controlled snapshot records commitments to:

- the two accepted initial ratings;
- the latest accepted rating for each original rater;
- any case and accepted resolution;
- whether residual disagreement remains; and
- the current controlled rating-dataset hash.

The snapshot can proceed only when every required case has an accepted closure, including explicit unresolved closure where necessary.

Both dedicated adjudicators must sign the same snapshot-body hash. Each sign-off confirms:

- completeness;
- preservation of the original initial ratings;
- preservation of residual disagreement;
- absence of an imposed consensus score; and
- that participation is not substantive endorsement of Metaphilosophy, the positions, or the final labels.

An independent quality-control operator accepts each sign-off. The final snapshot commitment binds the body and both sign-offs.

## Honorarium boundary

An accepted required case closure creates one **candidate** adjudication-unit event. An accepted required final snapshot sign-off creates one candidate sign-off event.

These events match the approved USD 100 adjudication-reserve definitions, but they do not authorize payment. Payment still requires the final frozen unit ledger, identity and administrative checks, and a separate disbursement authorization. Unused reserve funds remain unspent.

## Authorization separation

The following are distinct:

1. operative-policy approval;
2. case generation;
3. case distribution;
4. adjudication work;
5. any rater discussion or rerating work;
6. resolution quality control and acceptance;
7. final snapshot generation;
8. final snapshot sign-off;
9. honorarium-ledger freeze;
10. payment;
11. publication;
12. funding submission; and
13. Phase 2 activation.

No stage is inferred from the existence of an artifact created at an earlier stage.

Controlled files remain outside the repository with mode `0600`. Public summaries contain aggregate counts and commitments only. They exclude people, item, rating, case, resolution, sign-off, and operator identifiers; scores and rationales; object-level notes; and individual case-packet hashes.

## Current state

The checked-in policy and control records are synthetic fixtures. They exercise two synthetic cases: one resolved after an append-only rerating and one explicitly preserved as unresolved. No real case has been opened or assigned.

The real project remains blocked at Q-006A. Q-006B must later freeze the operative routes, case and resolution schema, rerating procedure, quality-control rules, unresolved-case treatment, and snapshot semantics. Q-006C must later approve the named adjudicators, topic coverage, conflicts, delivery method, operator roles, notification and appeal procedures, and dates.
