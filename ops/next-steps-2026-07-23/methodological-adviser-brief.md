# Internal draft — bounded methodological-adviser brief

**Not sent. Exact advisers and wording require project-owner approval.**  
**Requested contribution:** approximately 20 minutes of asynchronous review **or** one 30-minute call.  
**Not requested:** bulk rating, routine adjudication, an open-ended advisory role, or endorsement.

## Metaphilosophy 48-critique pilot

Metaphilosophy is developing a platform through which qualified human reviewers evaluate philosophical critiques, with the long-run aim of improving and measuring AI systems' conceptual reasoning.

The immediate project is deliberately limited: a 48-critique pilot intended to test whether the platform can collect blind, auditable, multi-rater judgments efficiently enough to justify a larger expert-rated programme. The pilot is not presented as enough data to train a materially improved model.

The LMCA project, *A dataset of rated conceptual arguments*, is direct prior art. It provides strong evidence that conceptual critiques can be rated along multiple dimensions and reports 951 rated critiques. It also identifies limitations that matter for follow-on work, including concentration in one primary rater, too few positions with a useful spread of critiques, source/style confounding, and interpretation-driven disagreement. Metaphilosophy's pilot is intended to test a complementary workflow rather than claim novelty for the basic idea of rating conceptual arguments.

## Proposed design

The core proposal, still subject to methodological review and project-owner approval, is:

- 12 position texts;
- 4 critiques per position;
- 48 critiques in total;
- 2 independent blind initial ratings per critique;
- 96 initial ratings;
- 6 early-career core raters and 2 dedicated adjudicators;
- all four sibling critiques assigned to the same rater pair;
- 12 distinct anonymous rater pairs, with four positions, four partners, and four topic families per rater;
- a preferred six-six source crossing, with one public-synthetic and one protected-public-domain-derived position in each of six topic families and two positions from each source class per rater;
- the seven LMCA-style dimensions: centrality, strength, correctness, clarity, dead weight, single issue, and overall;
- original ratings preserved when re-rating or adjudication occurs;
- source, author/model identity, model-judge scores, provisional quality strata, and other raters' judgments hidden during initial rating;
- an eight-critique public calibration set rated by all six core raters and both adjudicators; and
- position-level uncertainty and leave-one-position-out sensitivity rather than reliance on a single pooled agreement number.

LMCA rows are not part of the pilot unless the canonical row-level data and redistribution license are separately supplied and approved. Candidate items instead come from Metaphilosophy's public synthetic library and protected public-domain-derived positions with source-fidelity and ambiguity review.

The preferred six-six source crossing is a target rather than a launch promise. If item review makes it infeasible, the fallback is at least four positions from each source class, maximum feasible topic crossing, and an explicit confound/deviation record.

## Concrete review candidates

The consultation packet exposes the following proposals so that they can be criticized before they become policy:

### Assignment and calibration

- Is a no-repeat, 12-pair anonymous assignment graph an appropriate balance between comparability and rater independence?
- Is an eight-critique shared public calibration set sufficient, excessive, or badly structured relative to sixteen production ratings per core rater?
- Should calibration use a rubric-based considerations dossier rather than a single gold score vector?

### Adjudication and item review

Provisional numerical triggers are:

- overall difference ≥ 0.30;
- `strength × centrality` difference ≥ 0.30;
- correctness difference ≥ 0.35; and
- clarity difference ≥ 0.35.

Proposed non-numeric review routes are:

- either rater scores clarity below 0.5;
- either rater reports an unresolved correctness-sensitive verification issue;
- either rater flags insufficient context; or
- either rater flags source fidelity, ambiguity, scope, or leakage.

These routes open item or evidence review. They do not automatically require a score change.

### Scale readiness

Provisional candidates are:

- median accepted-rating time ≤ 15 minutes;
- weighted within-position pairwise agreement ≥ 0.75 for pairs whose mean overall gap is at least 0.20;
- at least 9 of 12 positions with an overall-score spread ≥ 0.30; and
- no more than 25% of critiques unresolved because of item defects after adjudication.

All numerical values remain non-binding. The proposed analysis reports uncertainty, all position-level results, and leave-one-position-out sensitivity. Passing does not automatically activate the 400-critique programme.

## Decisions that remain deliberately open

The project has not frozen:

- the exact 12 × 4 structure;
- topic and source quotas;
- the candidate-critique acquisition procedure;
- the anonymous assignment template;
- the calibration examples or qualification rule;
- numerical disagreement triggers or non-numeric review routes;
- numerical scale-readiness thresholds;
- the exact items, raters, adjudicators, or model baselines; or
- any claim that the pilot validates the full 400-critique expansion.

Numerical candidates currently appear in the protocol only so advisers can criticize concrete proposals. They are marked non-binding and require explicit project-owner approval before the first protected rating.

## Three review questions

1. **What is the largest threat to the pilot's validity or usefulness?**
2. **Which item-selection, source-crossing, assignment, calibration, rubric, or adjudication rule should change before launch?**
3. **What evidence would make the pilot meaningfully informative beyond the existing LMCA work?**

A useful response may be as short as three bullet points. Specific objections are more useful than general encouragement.

## What the adviser would receive

The review packet would contain only:

1. this brief;
2. the human-readable pilot protocol;
3. the LMCA-to-pilot methodological audit;
4. the balanced assignment/calibration/analysis recommendation;
5. the seven-dimensional rubric;
6. one clearly marked non-protected example position with four example critiques; and
7. a three-question response form.

Protected pilot items, identities, model-judge scores, and labels would not be shared unless a later role and exposure agreement explicitly required them.

## How feedback will be used

Every substantive comment will enter a versioned methodological-feedback log with one of four dispositions:

- adopted before launch;
- adopted with modification;
- not adopted, with rationale; or
- unresolved and disclosed.

The project will not quote, name, or imply endorsement by an adviser without separate permission. Participation creates no continuing obligation.

## Proposed outreach sentence

> Would you be willing to spend about 20 minutes reviewing a short protocol for a 48-critique expert-rating pilot, or discuss it in one 30-minute call? I am not asking you to rate the dataset or join an ongoing advisory board. The three questions concern the largest validity risk, the design change you would prioritize, and what would make this pilot informative beyond existing work such as LMCA.

This sentence is an internal draft, not an authorized or sent message.
