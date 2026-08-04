# Internal recommendation — balanced pilot assignment, calibration, and analysis

**Status:** Non-binding Q-006A/Q-006B recommendation.  
**No effect by itself:** no outreach, protected-item freeze, participant selection, payment onboarding, or Phase 2 activation.

This document operationalizes the source-grounded findings in `lmca-methodology-audit.md`. The machine-readable counterpart is `pilot-methodology-recommendations.json`.

## 1. Preferred crossed assignment

Use anonymous rater slots until six named core raters have passed qualification, consent, conflict, prior-exposure, and calibration review.

| Slot | Topic family | Preferred source class | Anonymous rater pair |
|---|---|---|---|
| P01 | Normative ethics | Public synthetic, newly expert-rated | R1 + R3 |
| P02 | Normative ethics | Protected public-domain-derived | R2 + R4 |
| P03 | Political philosophy | Public synthetic, newly expert-rated | R1 + R4 |
| P04 | Political philosophy | Protected public-domain-derived | R2 + R3 |
| P05 | Epistemology and philosophy of science | Public synthetic, newly expert-rated | R3 + R6 |
| P06 | Epistemology and philosophy of science | Protected public-domain-derived | R1 + R5 |
| P07 | Philosophy of mind and AI consciousness | Public synthetic, newly expert-rated | R4 + R5 |
| P08 | Philosophy of mind and AI consciousness | Protected public-domain-derived | R1 + R6 |
| P09 | Decision theory and social choice | Public synthetic, newly expert-rated | R2 + R5 |
| P10 | Decision theory and social choice | Protected public-domain-derived | R4 + R6 |
| P11 | Metaphilosophy and AI governance | Public synthetic, newly expert-rated | R2 + R6 |
| P12 | Metaphilosophy and AI governance | Protected public-domain-derived | R3 + R5 |

### Design properties

The template gives:

- exactly two raters per position;
- exactly four positions and sixteen critique ratings per rater;
- twelve distinct rater pairs, with no repeated pair;
- four distinct partners per rater;
- four distinct topic families per rater;
- two public-synthetic and two protected positions per rater; and
- one position from each source class in every topic family.

The three omitted pairs are R1–R2, R3–R4, and R5–R6. This yields a connected assignment graph rather than isolated rater pairs.

Named participants are not inserted mechanically. If conflicts or prior exposure invalidate a slot, regenerate the anonymous mapping while preserving the invariants rather than making an undocumented swap.

### Feasibility fallback

The six-six source crossing is preferred, not binding. If independent source-fidelity or ambiguity review leaves fewer than six viable positions in either source class:

1. retain at least four positions from each eligible source class;
2. maximize topic-level one-of-each-source crossing;
3. preserve two-of-each-source workload per rater where feasible;
4. keep all twelve rater pairs unique; and
5. record each deviation, its cause, and its expected confounding effect for Q-006B.

## 2. Candidate-set controls

For every position, collect at least eight candidate critiques and select four only after freezing:

- word and sentence counts;
- formatting and citation cues;
- source and author/model identity;
- acquisition-judge mean and disagreement;
- attack family; and
- obvious source-style cue risk.

The selected four should still seek a likely strong candidate, a plausible weak candidate, and two disagreement- or attack-family-diverse candidates. These are acquisition strata, not human labels.

Do not choose a set in which provisional quality is trivially predictable from length, formatting, citations, or source. Do not substantively rewrite a critique merely to make its source harder to guess. Record residual cue risk and test it descriptively.

## 3. Shared calibration proposal

### Size and participation

Recommend two public, non-protected positions with four critiques each: eight shared calibration critiques in total. All six core raters and both adjudicators complete the same calibration set independently.

At the LMCA source estimate of 5–15 minutes for a short rating, this adds roughly 40–120 minutes of scoring per participant before discussion. This estimate must be disclosed; calibration is not counted as an honorarium contribution unit under the current plan.

### Required issue coverage

The calibration set should include examples that surface:

1. ambiguity in the intended conclusion or critique interpretation;
2. an objection that may already be priced in;
3. strength–centrality allocation ambiguity;
4. clarity below the proposed 0.5 branch;
5. a correctness-sensitive claim requiring practical verification;
6. a specific but low-centrality objection;
7. dead weight versus an unsuccessful substantive argument; and
8. one issue versus multiple independent issues.

One example can cover more than one category, but the selection ledger must explain the coverage.

### Sequence

1. Independently rate and lock all eight examples.
2. Preserve every initial calibration rating.
3. Reveal a rubric-based considerations dossier, not a single unquestionable gold vector.
4. Discuss large differences only through object-level reasons.
5. Permit a versioned revision only when the rater records such a reason.
6. Record pass, targeted remediation, or non-selection under the later frozen qualification rule.

No exact numerical pass threshold is approved here. The calibration examples and any reference considerations are excluded from the 48-critique protected pilot and all pilot outcome metrics.

## 4. Additional item-review candidates

Present the following to methodological advisers alongside the provisional numerical disagreement triggers:

### Low clarity

Open item review whenever either initial rater gives clarity below 0.5. Agreement that a critique is extremely unclear should not prevent review merely because the two clarity scores are close.

When this route opens, preserve all scores but treat the non-clarity dimensions as potentially unreliable. The later analysis should use the pre-registered low-clarity branch.

### Unresolved verification

Open evidence review whenever either rater records that a correctness-sensitive claim remains practically verifiable but unresolved. Do not settle such a case by averaging confidence or encouraging convergence before the verification attempt is completed or explicitly deemed infeasible.

Neither route automatically requires a score change.

## 5. Pre-analysis safeguards

### Primary quantities

Prioritize:

- overall score;
- `strength × centrality`;
- clarity;
- accepted rating time;
- absolute initial-rater difference;
- within-position pairwise ordering;
- item-integrity flags; and
- adjudication frequency and cause.

Strength and centrality remain useful diagnostic fields but are not standalone quality targets.

### Dependence and uncertainty

Four critiques share each position context, so the critique is not an independent resampling unit. **Use position, not individual critique, as the resampling unit.** The analysis should:

- publish the twelve position-level result blocks;
- use position for resampling or leave-one-position-out analysis;
- report leave-one-position-out ranges for primary agreement summaries;
- provide uncertainty intervals for ICC, Krippendorff's alpha, and model comparisons;
- label those coefficients exploratory; and
- keep initial, revised, and final/adjudicated summaries separate.

### Low-clarity branch

When human clarity is below 0.5, the custom discrepancy summary retains only clarity and overall. The project may still preserve the other fields in the raw audit record but should not treat them as equally interpretable.

### Claims the pilot cannot support

With twelve positions, do not claim that:

- one source class causes better critiques or ratings;
- one topic family is intrinsically easier;
- one model family is philosophically superior in general;
- one individual rater is better than another; or
- passing a numerical threshold independently justifies the full 400-critique expansion.

Source, topic, length, model, and rater effects remain descriptive diagnostics.

## 6. Model-baseline boundary

Before any protected human rating, freeze:

- model and provider identity;
- exact model version;
- prompt and rubric version;
- reasoning or effort setting;
- temperature and other sampling parameters;
- retry policy;
- output parser and invalid-output rule;
- request date and API environment; and
- raw-response retention and hashing policy.

Model judgments are baselines and candidate-acquisition signals. They are not labels, adjudicators, or evidence that a human disagreement has been resolved.

## 7. Q-006 staging

### Q-006A

Approve these elements only as the consultation and non-final screening design:

- preferred balanced assignment invariants;
- preferred six-six source crossing and documented fallback;
- eight-item shared public calibration proposal;
- low-clarity and unresolved-verification review candidates; and
- small-sample analysis safeguards.

### Q-006B

After adviser feedback and item screening, freeze:

- final source mix and assignment generator;
- exact calibration materials and qualification rule;
- final adjudication and item-review routes;
- final uncertainty and scale-readiness rules;
- exact protected positions and critiques; and
- all manifest and exclusion hashes.

### Q-006C

After expressions of interest, approve named people, payment and jurisdiction readiness, senior-adviser roster and outreach order, sender and reply ownership, and the readiness-signoff date.
