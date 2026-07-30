# Metaphilosophy 48-critique pilot

**Decision date:** 2026-07-30  
**Status:** Scope and protocol approved; exact items, participants, payment readiness, and adviser roster remain gated.  
**Execution scope:** 12 positions × 4 critiques = 48 critiques; 2 blind initial ratings per critique = 96 initial ratings.

## Why this pilot now

The full 100-position / 400-critique Hard Set is no longer the immediate execution target. It remains a deferred expansion plan.

The immediate objective is to establish whether Metaphilosophy can run a reliable, efficient, auditable expert-judgment workflow with the existing USD 500 limited-honoraria ceiling. The pilot should produce operational evidence, a controlled sample, reliability results, and bounded senior methodological feedback for Long-Term Future Fund and Emergent Ventures applications. It must not be represented as enough data to train a materially improved philosophical reasoner.

The LMCA paper is direct prior art and a methodological benchmark. It already provides substantial evidence that experts can rate conceptual critiques, so Metaphilosophy should not present the pilot as the first demonstration of that proposition. The pilot instead tests a more deliberately multi-rater, platform-mediated workflow that addresses several of LMCA's reported limitations: single-rater concentration, too few positions with a useful spread of critiques, source/style confounding, and interpretation-driven disagreement. No LMCA row is reused unless the canonical row-level dataset and redistribution license are separately supplied and approved.

## Frozen scope

| Component | Pilot requirement |
|---|---:|
| Positions | 12 |
| Critiques per position | 4 |
| Critiques | 48 |
| Blind initial ratings per critique | 2 |
| Required initial ratings | 96 |
| Core raters | 6 |
| Dedicated adjudicators | 2 |
| Nominal work per core rater | 4 positions / 16 critiques |
| End-to-end window | 28 days after readiness |

Each position is the assignment and split unit. Its four sibling critiques go to the same two core raters. Across 12 positions, this creates 24 position assignments: exactly four positions per core rater and sixteen critique ratings per core rater.

## Topic matrix

Use two positions in each family:

1. Normative ethics.
2. Political philosophy.
3. Epistemology and philosophy of science.
4. Philosophy of mind and AI consciousness.
5. Decision theory and social choice.
6. Metaphilosophy and AI governance.

The exact item IDs remain controlled and pending. Topic balance may not be changed silently.

## Source policy

The pilot must not depend on unavailable LMCA rows. Eligible sources are:

- public synthetic Metaphilosophy material receiving new expert ratings; and
- protected public-domain-derived positions that pass independent source-fidelity and ambiguity/scope review.

At least four positions must come from each eligible class. The remaining four may come from either class to improve topic coverage, difficulty, source/style balance, and readiness. Exact source counts and IDs are frozen only in the controlled manifest.

For each position, collect at least eight candidate critiques and select four. The selected set should normally contain:

- one high-mean, low-disagreement candidate under frozen model judges;
- one plausible low-mean, low-disagreement candidate; and
- two high-disagreement candidates or candidates attacking distinct issues.

These are acquisition strata, not ground-truth labels. Raters never see the strata, sources, model identities, model scores, or other raters' judgments.

## Rating protocol

Use the existing seven-dimensional Rubric v2:

- centrality;
- strength;
- correctness;
- clarity;
- dead weight;
- single issue; and
- overall.

For analysis, substantive impact is represented by `strength × centrality`; neither field should be treated as independently decisive.

A rater sees the frozen position context and all four sibling critiques in a rater-specific randomized order. Before the rater locks all four initial ratings, the system must not reveal any paired rater identity, other rating, aggregate, model judgment, or adjudication status.

Each accepted rating also records:

- an overall rationale;
- confidence;
- time spent;
- an insufficient-context flag; and
- verification status for correctness-sensitive claims.

Original ratings are immutable. A substantive re-rating creates a new version and requires an object-level reason. Disagreement by itself is not a sufficient reason to revise.

## Assignment design

Each position is assigned to exactly two core raters. Assignment generation must:

- minimize repeated rater pairs;
- balance topic families;
- avoid authorship, substantive editing, label exposure, and other conflicts;
- keep all four sibling critiques with the same two raters; and
- record the deterministic assignment seed, eligibility, conflict, and exposure checks.

The bulk work is for early-career experts: philosophy PhD students, advanced research-degree students, recent PhDs, or comparably qualified researchers. Senior researchers are not asked to rate the 48 critiques.

## Adjudication

A case opens when any of the following occurs:

- absolute overall-score difference ≥ 0.30;
- absolute `strength × centrality` difference ≥ 0.30;
- correctness difference ≥ 0.35;
- clarity difference ≥ 0.35;
- either rater flags insufficient context; or
- either rater flags source fidelity, ambiguity, scope, or leakage.

Both dedicated adjudicators independently inspect every required case before seeing the other's disposition. The case record must identify the competing interpretations, object-level considerations, any item defect, whether re-rating is required, and either a final status or an explicitly unresolved status.

Consensus is not compulsory. Original and revised ratings remain preserved, and unresolved interpretation uncertainty is part of the dataset rather than an error to conceal.

## Senior methodological advisers

Recruit two to four senior methodological advisers only after the two-page protocol is ready.

The request is bounded to either:

- approximately 20 minutes of asynchronous review; or
- one 30-minute call.

Ask exactly three questions:

1. What is the largest threat to the pilot's validity or usefulness?
2. Which rubric, assignment, or adjudication rule should change before launch?
3. What evidence would make the pilot meaningfully informative beyond the existing LMCA work?

Do not ask senior researchers to rate the pilot, perform routine adjudication, join an open-ended board, or endorse Metaphilosophy before seeing results.

## Analysis and scale-readiness gate

Report, at minimum:

- completion and rejection counts;
- rating-time distribution;
- per-dimension inter-rater agreement;
- within-position pairwise ordering agreement;
- absolute gaps in overall and `strength × centrality`;
- adjudication frequency and causes;
- pre/post-adjudication agreement;
- topic, source, length, and rater effects; and
- comparison with frozen model-judge baselines.

Use intraclass correlation for overall scores, an interval-aware agreement coefficient such as Krippendorff's alpha by dimension, weighted within-position pairwise agreement, and mean absolute rater difference.

The pilot is scale-ready only if all of the following hold:

1. All 96 blind initial ratings are accepted or validly replaced.
2. Median accepted-rating time is at most 15 minutes.
3. Weighted pairwise agreement is at least 0.75 for critique pairs whose mean overall-score gap is at least 0.20.
4. At least 9 of 12 positions have a consensus overall-score spread of at least 0.30 across their four critiques.
5. No more than 25% of critiques remain unresolved because of defective context, source fidelity, ambiguity, or scope after adjudication.
6. Rating, revision, adjudication, exposure, and payment audit trails are complete.

A failed criterion triggers redesign. It does not permit post hoc metric substitution.

## Deliverables

The pilot ends with:

- a controlled 12-position / 48-critique manifest;
- 96 accepted blind initial ratings;
- versioned re-ratings and adjudication records;
- a frozen label snapshot with uncertainty metadata;
- a reproducible analysis report;
- the methodological-adviser feedback log;
- a two-page public methodology and limitations summary; and
- an evidence packet for Long-Term Future Fund and Emergent Ventures applications.

## Full 400-critique expansion

The 100-position / 400-critique plan remains frozen as a possible Phase 2 source-allocation strategy, not an active workload.

It may be activated only after:

1. the pilot completion gate passes and its findings are reviewed;
2. senior methodological feedback is recorded and material concerns are resolved or disclosed;
3. external funding is secured **or** named, qualified volunteers have made documented commitments covering the complete 400-critique workload, expected re-ratings, adjudication, replacements, and operations; and
4. the project owner records a new explicit activation decision.

There is no automatic rollover from 48 to 400.

## Remaining readiness decisions

Before launch, freeze:

- the exact 12 positions, 48 critiques, permitted source mix, and controlled manifest hash;
- six early-career core raters, two adjudicators, and replacement candidates;
- participant jurisdictions, payment rails, tax documentation, sanctions screening, and applicable legal review;
- two to four senior methodological advisers and outreach order;
- the model-baseline lineup and reproducibility record; and
- the external-funding application owner and submission dates.
