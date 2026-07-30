# Metaphilosophy 48-critique pilot

**Decision date:** 2026-07-30  
**Status:** The pilot-first direction and 48-critique scope are owner-approved. The detailed methodology is a reviewable recommendation; exact items, participants, payment readiness, advisers, and numerical thresholds remain gated.  
**Recommended execution structure:** 12 positions × 4 critiques = 48 critiques; 2 blind initial ratings per critique = 96 initial ratings.

## Governance boundary

The owner-approved decisions are:

- run a 48-critique pilot before attempting the full 400-critique programme;
- recruit early-career experts for the bulk rating work;
- ask senior researchers only for bounded methodological advice, not bulk ratings;
- use pilot evidence and senior feedback in Long-Term Future Fund and Emergent Ventures applications; and
- activate the 400-critique programme only after external funding or substantial committed qualified-volunteer capacity, followed by a new explicit owner decision.

The 12 × 4 structure, topic/source matrix, candidate-acquisition procedure, adviser envelope, and numerical adjudication and scale-readiness thresholds below are recommended protocol elements. They do not become binding merely by appearing in this draft. Under the project's 90% decision rule, uncertain numerical and roster choices require methodological review and explicit owner approval before readiness can pass.

## Why this pilot now

The full 100-position / 400-critique Hard Set is no longer the immediate execution target. It remains a deferred Phase 2 source-allocation plan.

The immediate objective is to establish whether Metaphilosophy can run a reliable, efficient, auditable expert-judgment workflow within the existing USD 500 limited-honoraria ceiling. The pilot should produce operational evidence, a controlled sample, reliability results, and bounded senior methodological feedback for funding applications. It must not be represented as enough data to train a materially improved philosophical reasoner.

The LMCA paper is direct prior art and a methodological benchmark. It already provides substantial evidence that experts can rate conceptual critiques, so Metaphilosophy should not present this pilot as the first demonstration of that proposition. The pilot instead tests a more deliberately multi-rater, platform-mediated workflow that responds to several limitations reported in LMCA: concentration in one primary rater, too few positions with a useful spread of critiques, source/style confounding, and interpretation-driven disagreement. No LMCA row is reused unless the canonical row-level dataset and redistribution license are separately supplied and approved.

## Recommended pilot structure

| Component | Recommendation |
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

Each position is the assignment and split unit. Its four sibling critiques go to the same two core raters. Across 12 positions, this creates 24 position assignments: four positions and sixteen critique ratings per core rater.

This structure is recommended because it preserves the existing four-critiques-per-position design, yields six within-position critique pairs per position, and keeps each early-career rater's pilot burden bounded. It still requires final owner approval at readiness.

## Recommended topic matrix

Use two positions in each family:

1. Normative ethics.
2. Political philosophy.
3. Epistemology and philosophy of science.
4. Philosophy of mind and AI consciousness.
5. Decision theory and social choice.
6. Metaphilosophy and AI governance.

This exact allocation is proposed, not yet frozen. The controlled item manifest may alter it only through a recorded owner-approved decision.

## Source and candidate policy

The pilot must not depend on unavailable LMCA rows. The eligible source classes are:

- public synthetic Metaphilosophy material receiving new expert ratings; and
- protected public-domain-derived positions that pass independent source-fidelity and ambiguity/scope review.

The recommended mix reserves at least four positions for each eligible source class and allocates the remaining four to whichever class best improves topic coverage, difficulty, source/style balance, and readiness. Exact source counts and IDs remain pending controlled-manifest review.

For each position, the recommended acquisition procedure is to collect at least eight candidate critiques and select four. A selected set should normally contain:

- one high-mean, low-disagreement candidate under frozen model judges;
- one plausible low-mean, low-disagreement candidate; and
- two high-disagreement candidates or candidates attacking distinct issues.

These are acquisition strata, not ground-truth labels. Raters never see strata, sources, model identities, model scores, or other raters' judgments. The candidate-pool minimum and exact selection rule remain recommendations until the controlled manifest is approved.

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

Each position is assigned to exactly two core raters. Assignment generation should:

- minimize repeated rater pairs;
- balance topic families;
- avoid authorship, substantive editing, label exposure, and other conflicts;
- keep all four sibling critiques with the same two raters; and
- record the deterministic assignment seed, eligibility, conflict, and exposure checks.

The bulk work is for early-career experts: philosophy PhD students, advanced research-degree students, recent PhDs, or comparably qualified researchers. Senior researchers are not asked to rate the 48 critiques.

## Adjudication

The following **numerical triggers are provisional candidates**, not binding policy:

- absolute overall-score difference ≥ 0.30;
- absolute `strength × centrality` difference ≥ 0.30;
- correctness difference ≥ 0.35; and
- clarity difference ≥ 0.35.

The final values must be reviewed by methodological advisers and explicitly approved by the project owner before the first protected rating.

Regardless of the final numerical thresholds, an integrity case must open when either initial rater flags insufficient context, source fidelity, ambiguity, scope, or leakage.

Both dedicated adjudicators independently inspect every required case before seeing the other's disposition. The case record identifies competing interpretations, object-level considerations, any item defect, whether re-rating is required, and either a final status or an explicitly unresolved status.

Consensus is not compulsory. Original and revised ratings remain preserved, and unresolved interpretation uncertainty is part of the dataset rather than an error to conceal.

## Senior methodological advisers

The recommended outreach envelope is two to four senior methodological advisers after the two-page protocol is ready. The exact roster and request require owner approval.

The recommended maximum request is either:

- approximately 20 minutes of asynchronous review; or
- one 30-minute call.

The draft asks three questions:

1. What is the largest threat to the pilot's validity or usefulness?
2. Which rubric, assignment, or adjudication rule should change before launch?
3. What evidence would make the pilot meaningfully informative beyond the existing LMCA work?

Do not ask senior researchers to rate the pilot, perform routine adjudication, join an open-ended board, or endorse Metaphilosophy before seeing results.

## Analysis and scale readiness

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

The binding completion requirements are:

1. All 96 blind initial ratings are accepted or validly replaced.
2. Every case required by the pre-registered adjudication policy is resolved or explicitly documented as unresolved.
3. Both adjudicators complete the final label-snapshot sign-off.
4. Rating, revision, adjudication, exposure, and payment audit trails are complete.

The following **numerical scale-readiness criteria are provisional candidates**:

- median accepted-rating time no greater than 15 minutes;
- weighted pairwise agreement at least 0.75 for critique pairs whose mean overall-score gap is at least 0.20;
- at least 9 of 12 positions with a consensus overall-score spread of at least 0.30; and
- no more than 25% of critiques unresolved because of defective context, source fidelity, ambiguity, or scope after adjudication.

These values must be frozen before rating, after adviser feedback and explicit owner approval. Later amendments require a versioned, time-stamped rationale and cannot be applied retroactively to conceal an unfavorable result.

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

The 100-position / 400-critique plan remains a possible Phase 2 source-allocation strategy, not an active workload.

It may be activated only after:

1. the pilot completion requirements pass and its pre-registered scale-readiness findings are reviewed;
2. senior methodological feedback is recorded and material concerns are resolved or disclosed;
3. external funding is secured **or** named, qualified volunteers have made documented commitments covering the complete 400-critique workload, expected re-ratings, adjudication, replacements, and operations; and
4. the project owner records a new explicit activation decision.

There is no automatic rollover from 48 to 400.

## Remaining readiness decisions

Before launch, approve and freeze:

- the recommended 12 × 4 structure and paired-rater assignment design;
- the exact topic/source matrix and candidate-acquisition rule;
- the numerical adjudication triggers and scale-readiness thresholds;
- the exact 12 positions, 48 critiques, and controlled manifest hash;
- six early-career core raters, two adjudicators, and replacement candidates;
- participant jurisdictions, payment rails, tax documentation, sanctions screening, and applicable legal review;
- the senior methodological-adviser roster, outreach order, and bounded request;
- the model-baseline lineup and reproducibility record; and
- the external-funding application owner and submission dates.
