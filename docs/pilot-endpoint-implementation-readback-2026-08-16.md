# Pilot endpoint implementation readback — 16 August 2026

## Status

This branch implements the owner-approved endpoint design in a synthetic, append-only, fail-closed vertical slice on top of draft PR #17. It contains no real position, critique, participant, rating, cause code, payment, or hosted-staging mutation. It does not approve Q-006B, authorize participant access or recruitment, start research, change public copy, merge a pull request, or deploy.

## Implemented

### Approved design and regression boundary

The branch includes the approved research positioning and endpoint contracts, the dated D1/D2 decision record, machine-readable contracts, source-contract verifiers, and regression tests. D1 remains option B and D2 remains option A.

### D1 — balanced blind self-check subsample

`pilot-self-check-selection.mjs` deterministically selects six positions, one per topic family and three per source class, from the frozen assignment graph. It selects two critiques per chosen position and both original raters per critique, yielding twenty-four self-check records. Every rater receives four records across two selected positions. Selection is input-order independent, selected before outcomes, rejects score/disagreement/model fields, and exposes only commitments and aggregate invariants publicly.

The canonical approved service blocks any initial rating until the D1 manifest is registered and blocks manifest registration after any rating has been locked. A `blind_self_check` is a separate append-only version-2 record directly linked to an initial version-1 record. It requires every peer/model/aggregate/cause/discussion/adjudication exposure flag to remain false and requires an object-level reason exactly when the score vector changes.

### D2 — dual blind interpretation-cause coding

`pilot-interpretation-cause-coding.mjs` generates ninety-six role-masked packets: two adjudicators for each of forty-eight paired fingerprints. Before both initial codes lock, packets exclude scores and gaps, the other coder's decision, model judgments, acquisition strata, aggregate results, adjudication outcomes, and rater identity or seniority.

Each packet receives one immutable version-1 initial code from its assigned adjudicator. Reconciliation is a separate record that must reference both initial codes and cannot delete, replace, overwrite, select a winner, or force consensus. The analysis preserves the all-forty-eight denominator, raw code agreement/disagreement, cause counts, reconciliation dispositions, and unresolved cases.

### Structured interpretation and append-only storage

The endpoint service records one immutable position-conclusion summary per rater-position before the first sibling rating. Each initial rating adds a critique-target summary, priced-in assessment, interpretation confidence, conditionally required background assumptions, ambiguity/context flags, and cryptographic commitments to the assignment packet, interpretation fingerprint, and rating.

The service uses the repository's append-only event-store interface. Synthetic tests reopen the file-backed store, verify the hash chain, and reconstruct the same assignment, selection, conclusion, initial, and self-check state. Rater workspace output contains only that rater's assignment and records and keeps peer ratings, peer rationales, peer fingerprints, model judgments, aggregates, cause codes, discussion, and adjudication state hidden.

### Task-first form models

The initial-rating form asks for the position conclusion and critique target before the score panel, includes priced-in and interpretation-confidence fields, conditionally requires background assumptions, starts all seven score controls unset, and states that the initial record is immutable.

The self-check form shows only the rater's own predecessor and the selected obligation, exposes no outside signal, and makes a revision reason conditional on an actual score change. The cause-coding form renders only the position, critique, two role-masked fingerprints, cause codes, and rationale field; it rejects any packet carrying score or other-coder leakage.

### Position-first analysis

`pilot-endpoint-analysis-v1.mjs` validates the complete 96-initial/24-self-check structure and produces:

- twelve position-level mean absolute gaps in `overall` and `centrality × strength`;
- equal-position mean, median, interquartile range, and full range;
- the all-pair interpretation-cause analysis;
- completion and active-time burden;
- symmetric two-direction LMCA-style discrepancy, labelled a Metaphilosophy extension;
- unweighted ordering agreement first;
- optional weighting by the average of the two raters' absolute within-rater gaps;
- stage-separated change;
- leave-one-position and leave-one-rater ranges; and
- mean-versus-median sensitivity.

A regression test constructs a strong reversal whose two-rater mean gap is zero and confirms that the corrected weighting retains positive weight. The report does not use imputation, reliability weights, public rater rankings, primary p-values, a population-valid headline confidence interval, a numerical success cutoff, an automatic Phase 2 rule, or a primary model result.

### Public-output privacy

Selection, cause-coding, and endpoint-analysis public sanitizers omit controlled item, rating, rater, adjudicator, packet, code, and reconciliation identifiers; item text; fingerprint text; background assumptions; rationales; and individual packet hashes. Position and rater deletion analyses use generated blocks. All authorization flags remain false.

### Programme-integrity repair

The inherited programme verifier expected obsolete closed-intake sentences. It now pins the current public facts: applications are closed, the first study has not begun, there is no assignment to claim, and zero research ratings have been collected. It also rejects reintroduction of the July-window and paid-assignment wording. No production page was changed.

## Workload boundary

D1 adds twenty-four blind self-check records. D2 adds ninety-six initial cause-code records, plus any later reconciliation. LMCA reports ordinary short-rating time but does not report time for a separate interpretation-cause coding task. This branch therefore records no invented D2 duration estimate.

The current USD 100 adjudication reserve is unchanged and has not been shown sufficient for D2. Before named adjudicator commitments, outreach, or payment representations, a synthetic or owner dry run must measure coding and reconciliation time and support a separately approved workload/honorarium amendment if necessary.

## Remaining integration risk

The implementation is deliberately not wired to the protected hosted-staging routes. Doing so safely requires a separate integration review against the existing H-11 access gates, Supabase event schema, participant consent/debrief flow, protected UI, route-level authorization, and deployment boundary. The current branch supplies the contracts, data semantics, services, form models, storage behavior, analysis, privacy sanitizers, and synthetic tests needed for that later review without creating a participant-facing path now.

No real self-check manifest has been frozen. No real cause-coding packet has been generated. No actual endpoint has been activated.
