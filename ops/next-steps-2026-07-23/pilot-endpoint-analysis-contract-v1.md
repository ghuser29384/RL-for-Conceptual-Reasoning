# Pilot endpoint analysis contract v1

**Status:** synthetic implementation template; no real data, research start, public benchmark, payment, merge, or deployment authorization.  
**Approved endpoint contract:** `ops/pilot-endpoint-design-amendment-v1.json`  
**Canonical analysis:** `scripts/pilot-endpoint-analysis-v1.mjs`

## Primary reporting structure

The approved analysis treats the **position** as the primary aggregation and sensitivity unit. Four critiques share one position and one rater pair, and each rater pair appears on only one position. The forty-eight paired critique units and seventy-two within-position comparisons therefore cannot be treated as independent top-level observations.

The primary report has three endpoint families:

1. **Blind-initial disagreement profile.** Compute each paired critique's absolute gap in `overall` and `centrality × strength`, average within each of the twelve positions, show every identity-free position block, then report the equal-position mean, position median, interquartile range, and full range.
2. **Interpretation linkage.** Attach the aggregate all-48 dual-blind cause-coding result. The analysis retains the complete denominator, raw coder agreement/disagreement, cause counts, reconciliation dispositions, and unresolved cases.
3. **Operational feasibility and burden.** Report completion, active rating time, the twenty-four blind self-checks, integrity and verification flags, revisions, adjudication, unresolved cases, and the separate cause-coding workload.

## Secondary analyses

The module also computes:

- the average of the two directions of LMCA's directional custom loss, explicitly labelled a Metaphilosophy symmetric extension rather than ground-truth error;
- unweighted within-position ordering agreement first;
- an optional ordering weight equal to the average of the two raters' absolute within-rater overall-score gaps;
- stage-separated blind initial, blind self-check, post-peer/post-evidence revision, adjudicated latest accepted, and unresolved summaries; and
- leave-one-position, leave-one-rater, equal-position-mean, and position-median sensitivity.

The prior mean-score-gap weighting is prohibited. When one rater strongly prefers critique A and the other strongly prefers critique B, the two-rater means can tie. Weighting by that mean gap would give the strongest reversal zero weight. The approved weight preserves it.

## Interpretation and self-check records

Every accepted initial record contains a position conclusion summary locked before the first sibling rating, a critique-target summary, priced-in assessment, interpretation confidence, conditionally required background assumptions, and ambiguity/context flags. Every blind self-check is a separate version-2 record directly linked to the initial version-1 record and carries an attestation that peer, model, aggregate, cause-code, discussion, and adjudication information remained hidden.

The complete endpoint fixture requires:

- 12 positions and 48 critiques;
- 96 accepted blind initial ratings from six core raters;
- 24 accepted blind self-check records;
- six selected positions and twelve selected critiques;
- both original raters checking every selected critique;
- four self-check records and two selected positions per core rater; and
- 96 independent initial interpretation-cause codes when the cause-coding analysis is attached.

## Inference boundary

The twelve positions are deliberately selected rather than sampled from a defined population. The headline uncertainty display is therefore raw position values, descriptive ranges, leave-one-position and leave-one-rater ranges, and mean-versus-median sensitivity. A cluster bootstrap may be an appendix sensitivity analysis only under an explicit exchangeability assumption.

The analysis does not use imputation, reliability weights, public rater rankings, primary null-hypothesis tests, a population-valid headline confidence interval, a scientific numerical success cutoff, an automatic Phase 2 rule, or a primary model leaderboard. Any model comparison remains exploratory and can occur only after the human-label analysis is frozen.

## Public-output boundary

The sanitized report replaces controlled positions and raters with generated blocks. It excludes dataset, item, rating, and rater identifiers; predecessor and selection-record identifiers; interpretation fingerprint text; background assumptions; rationales; and revision reasons. Both controlled and public reports preserve every authorization flag as false.

## Workload boundary

The approved design adds twenty-four blind self-check records and ninety-six interpretation-cause code records. LMCA provides a time estimate for ordinary short ratings, but not for the separate cause-coding task. The analysis therefore does not invent a cause-coding time estimate. The USD 100 adjudication reserve is unchanged and has not been shown sufficient. A dry-run workload and honorarium re-estimate remains required before named adjudicator commitments.
