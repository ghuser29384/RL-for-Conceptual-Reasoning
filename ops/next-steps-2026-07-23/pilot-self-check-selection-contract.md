# Pilot blind self-check selection contract

**Status:** synthetic implementation template; no real selection, rating work, participant access, payment, or research authorization.  
**Owner decision:** D1 = B.  
**Machine-readable contract:** `pilot-self-check-selection-contract.json`  
**Implementation:** `scripts/pilot-self-check-selection.mjs`

## Purpose

The approved endpoint design requires a balanced subsample of 24 blind self-check records. The subsample must be selected before any pilot rating and without inspecting human scores, disagreement, adjudication, or post-rating model outputs. A manual selection would be easy to bias after seeing item identities or expected difficulty, so the implementation treats the approved balance rules as a deterministic constraint problem.

## Exact design

The selector receives the frozen conflict-aware assignment report and a secret selection seed. It selects:

- six of the twelve positions;
- exactly one position from each topic family;
- exactly three positions from each approved source class;
- exactly two selected positions for each of the six core raters;
- exactly two of the four critiques within each selected position; and
- both original raters for every selected critique.

The result contains twelve selected critiques and twenty-four self-check records. Each core rater receives four self-check records across exactly two selected positions.

## Deterministic selection

The selector enumerates every six-position subset. It retains only subsets satisfying the topic, source, and per-rater incidence rules. Each feasible canonical slot set is ranked by SHA-256 under the secret seed; the lexicographically smallest rank is selected.

Within each selected position, all six two-of-four critique pairs are ranked by SHA-256 under the same seed and position slot. The lexicographically smallest pair is selected.

Input arrays are normalized and sorted before ranking. Reordering positions, critiques, or rater IDs cannot change the result. The full report commits to the endpoint contract, assignment view, redacted selection input, seed, selected position set, selected critique set, and complete controlled body through hashes.

## Outcome-independence gate

Selection input is allowlisted to the assignment manifest fields needed for balance. The validator rejects score, rating, disagreement, adjudication, model-score, and route-result fields in the position assignments. The selector therefore cannot use observed study outcomes as selection inputs.

The exact position IDs, critique IDs, rater IDs, and seed remain private controlled data. The public summary contains only commitments, counts, invariants, and authorization state.

## Self-check stage boundary

A selected self-check record uses the separate `blind_self_check` stage. It must occur:

1. after the same rater's corresponding blind initial record is locked;
2. before peer scores or rationales, model judgments, aggregate results, cause codes, discussion, or adjudication state are exposed; and
3. as a predecessor-linked append-only record that never overwrites the initial.

A score change requires an object-level reason. A self-check cannot replace a missing initial rating and cannot support a population-level causal claim about checking.

## Controlled-generation boundary

Synthetic simulation is allowed with all authorization flags false. The module also contains a fail-closed controlled-output path for a later approved manifest stage: it requires Q-006B, a frozen protected manifest, explicit self-check-selection authorization, private controlled storage, approval records, and a valid timestamp. Full controlled output is written with mode `0600` outside the repository and is never printed to standard output.

This implementation does not provide those approvals, create a real manifest, start rating work, or change any payment policy.
