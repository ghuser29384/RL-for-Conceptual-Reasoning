# Pilot rating-record and analysis contract

**Status:** implementation template only; non-binding; contains no rating, protected-item, participant, payment, or outreach data.

This contract converts the existing pilot methodology into an executable data and analysis boundary without approving Q-006A, numerical adjudication thresholds, a calibration pass rule, protected items, participants, outreach, payment, funding submission, or Phase 2.

## Source-derived analytical rules

The following rules are taken from *A dataset of rated conceptual arguments* rather than introduced as new Metaphilosophy findings:

- score critiques from 0 to 1 on centrality, strength, correctness, clarity, dead weight, single issue, and overall;
- use `strength × centrality` as the substantive-impact quantity rather than treating either field as a standalone model-scoring target;
- when the reference clarity score is below 0.5, the custom discrepancy uses only clarity and overall, weighted 0.5 each;
- otherwise, the custom discrepancy weights overall at 0.5, `strength × centrality` at 0.2, clarity and correctness at 0.1 each, and dead weight and single issue at 0.05 each;
- compute the weighted pairwise ranking error within positions, assigning zero loss for matching order, half the reference overall-score gap for a candidate tie, and the full gap for reversed order; and
- preserve every original rating when discussion or object-level reconsideration produces a revision.

These rules are encoded directly in the controlled analysis implementation and tested against hand-calculated examples.

## Append-only rating records

Every rating record has:

- a unique controlled record ID;
- position, critique, and pseudonymous rater IDs;
- the frozen rubric version;
- all seven score dimensions;
- an overall rationale, confidence, elapsed time, insufficient-context flag, verification status, and item-integrity flags;
- an immutable stage and version; and
- a lock timestamp.

An initial rating is version 1 and has no predecessor. A re-rating must reference the immediately preceding record for the same rater and critique, advance the version by one, and contain an object-level revision reason. Existing records are never overwritten or deleted.

The validator can inspect partial in-progress datasets. A separate complete-pilot mode enforces the recommended 12 positions, four critiques per position, two initial raters per critique, 96 accepted initial ratings, six core raters, sixteen initial ratings per core rater, and the same rater pair across all four sibling critiques.

## Controlled analysis outputs

The controlled implementation produces:

- the LMCA custom weighted loss;
- the LMCA weighted pairwise ranking error;
- symmetric weighted within-position ordering agreement between two human raters;
- mean absolute rater differences for every dimension and `strength × centrality`;
- an interval-distance Krippendorff-alpha diagnostic specialized to the two-ratings-per-critique pilot design;
- accepted-rating-time summaries;
- candidate and operative adjudication routes;
- consensus overall-score spread within each position;
- position-level result blocks; and
- leave-one-position-out ranges for primary aggregate diagnostics.

The implementation does not estimate causal source or topic effects, rank individual raters publicly, treat model judgments as labels or adjudicators, or return an automatic Phase 2 decision.

## Separate initial and latest-accepted snapshots

The canonical runner reports two distinct views:

1. `initial` — the immutable accepted initial ratings, before any object-level re-rating; and
2. `latest_accepted` — the latest accepted record in each rater–critique chain.

The runner also reports only aggregate revision counts. It never overwrites or reclassifies the stored source records. This separation prevents post-discussion or post-adjudication agreement from being confused with independent initial agreement.

## Strict policy validation

A diagnostic policy may contain provisional thresholds but must have an empty `approved_routes` list. Unknown routes, duplicate routes, unsupported threshold keys, thresholds outside their permitted intervals, and malformed clarity or pair-gap values fail before analysis.

Any non-empty operative route list additionally requires:

- policy status `approved_for_operation`;
- explicit `q_006b_approved=true` governance evidence;
- a versioned approval-record identifier;
- a valid approval timestamp; and
- the required threshold for every approved numerical route.

Consequently, merely placing a number in a JSON file cannot activate adjudication.

## Fail-closed threshold handling

No adjudication route is operative by default. The analysis may calculate candidate routes for inspection, but a route affects the operative count only when a valid approved policy explicitly names it.

Accordingly:

- provisional numerical thresholds remain diagnostic;
- low-clarity and unresolved-verification routes remain diagnostic until approved;
- calibration qualification remains unset;
- a diagnostic result cannot authorize outreach, protected-item freezing, participant work, payment, funding submission, or Phase 2; and
- later policy changes must be versioned and cannot be applied retroactively to conceal an unfavorable result.

## Public-report privacy boundary

The controlled engine necessarily uses controlled position, critique, rating, and pseudonymous rater identifiers. It is not the public-output interface.

The canonical public runner is:

```bash
node scripts/run-pilot-rating-analysis.mjs <rating-dataset.json> [analysis-policy.json]
```

Its output is sanitized by construction:

- controlled dataset, position, critique, rating, and pseudonymous rater identifiers are omitted;
- position-level results use generated blocks such as `position_01`;
- item-level adjudication-route records are replaced by aggregate route counts;
- both initial and latest-accepted snapshots pass the same sanitizer; and
- CI rejects any output containing a forbidden controlled-identifier key.

Operational records use controlled pseudonymous rater IDs. Protected items and sensitive participant data remain in private controlled storage. Public reporting is limited to approved aggregate counts, generated position blocks, hashes, uncertainty-aware results, and separately permissioned attribution.
