# Metaphilosophy pilot endpoint design amendment v1 — draft

**Status:** evidence-backed draft; two owner decisions remain open  
**Date:** 15 August 2026  
**Strategy contract:** `ops/research-positioning-v1.json` (`mp-research-positioning-v1`)  
**Proposed study:** 12 positions × 4 critiques × 2 blind initial raters = 96 blind initial ratings  
**Repository evidence reviewed:** current `main`, the exact head of draft PR #24, and the detailed pilot implementation at draft PR #17 head `50acaf893ab99c7659dd63f46a0e27de1049e47d`

This document is an analysis and recommendation only. It does not modify the rating workflow, approve Q-006B, freeze items or thresholds, authorize participant access or recruitment, start research, merge a pull request, or deploy production.

## 1. Executive recommendation

The 48-critique study should be treated as a **finite-pilot study of expert-judgment robustness and workflow feasibility**, not as a population survey of philosophers, a validated benchmark, or a model leaderboard.

Its headline result should be a three-part profile:

1. **Blind-initial disagreement:** how far the two independently locked judgments differ on `overall` and on `centrality × strength`, shown first at the position level.
2. **Interpretation linkage:** which material disagreements are associated with different readings of the position, critique, context, or what is already priced in.
3. **Expert effort and process burden:** completeness, active rating time, item-integrity problems, checking/revision burden, adjudication burden, and unresolved cases.

No scalar agreement threshold should automatically label the pilot successful, authorize expansion, or turn its output into a benchmark. The result should instead support a later owner decision about what measurement design, sample, and budget would be justified next.

## 2. Evidence boundary

### 2.1 LMCA source findings

Cooper et al., *A dataset of rated conceptual arguments*, supplies the substantive measurement method:

- the unit is a contextualized position–critique pair;
- critiques are scored from 0 to 1 on centrality, strength, correctness, clarity, dead weight, single issue, and overall;
- `centrality × strength`, rather than either component alone, represents how much the critique weakens the position;
- sources and tags are hidden during rating;
- initial ratings are blind to other raters;
- discussion and object-level reconsideration can produce a new rating, while the original rating is always preserved;
- short ratings take approximately 5–15 minutes on average;
- interpretation of the position or critique is a major source of hard disagreement;
- checking and discussion improved agreement in the LMCA rating test, but did not eliminate disagreement; and
- LMCA itself cautions that metric choice, exact scores, source/style cues, and small validation subsets remain limitations.

LMCA Appendix C used a 52-critique, 19-position rating test with four core raters on every item, plus two partial raters. The proposed Metaphilosophy pilot has only two raters per critique and therefore cannot reproduce that validation design or estimate the same quantities with comparable support.

### 2.2 Current Metaphilosophy design findings

The current pilot proposal and implementation already provide several strong foundations:

- all four sibling critiques of a position go to the same two blind initial raters;
- six core raters each cover four positions and sixteen critiques;
- the preferred graph uses twelve unique rater pairs, with each rater connected to four partners;
- original ratings are immutable and later ratings are linked versions;
- the form already records all seven scores, assessability, interpretation confidence, rating confidence, verification status, issue flags, background assumptions, rationale, and active time;
- the current analysis separates accepted initial ratings from latest accepted ratings;
- provisional disagreement thresholds are diagnostic only and activate no workflow route; and
- the current analysis already emits position blocks and leave-one-position-out ranges.

The current analysis nevertheless needs amendment before it matches the approved research positioning. In particular, it does not yet collect a sufficiently structured interpretation fingerprint; it treats agreement coefficients too prominently for this small design; it lacks a blind self-check stage; and its symmetric weighted ordering function weights critique pairs by the gap between the two-rater mean scores, which can assign zero weight to a pair precisely when the raters strongly reverse each other. That weighting should not be used as a primary endpoint.

## 3. What the sample structure can and cannot support

### 3.1 Exact geometry

The proposed complete pilot contains:

- 12 position clusters;
- 4 paired critique units per position;
- 48 paired critique units;
- 96 blind initial rating records;
- 6 within-position critique comparisons per position, or 72 comparisons in total; and
- 6 raters, each contributing to 4 positions.

The 48 critique pairs and 72 ranking comparisons are **not independent top-level observations**. Four critiques share a position, and all four are rated by the same rater pair. Position is therefore the primary aggregation and sensitivity unit.

Each rater pair appears on only one position. A pair-specific interaction is consequently inseparable from that position. Individual rater offsets are connected through the assignment graph and can be inspected descriptively, but six raters and four positions per rater are insufficient for stable reliability weights, public rater rankings, or broad claims about rater quality.

### 3.2 Credible finite-pilot claims

The design can credibly describe:

- the observed distribution of blind-initial disagreement across these twelve positions;
- whether results are dominated by one position or by positions involving one rater;
- the frequency and types of interpretation or item-integrity problems under the chosen coding procedure;
- the amount of expert time required by this workflow;
- how often ratings are checked, revised, adjudicated, or left unresolved; and
- whether the software and governance preserve the intended evidence chain.

### 3.3 Unsupported claims

The design cannot credibly establish:

- a population-level inter-rater reliability for philosophers in general;
- causal topic or source-class effects;
- stable rater reliability weights or a ranking of raters;
- a general model leaderboard or model-family superiority claim;
- a causal effect of discussion when only disagreement-triggered cases receive discussion;
- a causal effect of checking unless a prespecified blind self-check stage is added;
- that a small numerical agreement threshold proves readiness for 400 critiques; or
- that a consensus or average score is objective philosophical ground truth.

## 4. Exact endpoint recommendations

### 4.1 Notation

For position `p`, critique `c`, and the two blind initial raters `a` and `b`, let:

- `O_pcr` be the overall score;
- `C_pcr` be centrality;
- `S_pcr` be strength; and
- `I_pcr = C_pcr × S_pcr` be substantive impact.

Define critique-level absolute gaps:

- `G_overall_pc = |O_pca − O_pcb|`;
- `G_impact_pc = |I_pca − I_pcb|`;
- `G_clarity_pc = |clarity_pca − clarity_pcb|`; and
- `G_correctness_pc = |correctness_pca − correctness_pcb|`.

For each position, take the arithmetic mean across its four critiques. The finite-pilot aggregate gives each of the twelve positions equal weight.

### 4.2 Primary endpoint family P1 — blind-initial disagreement profile

The primary numerical result is a **profile**, not one score:

1. the twelve position-level mean `G_overall` values;
2. the twelve position-level mean `G_impact` values;
3. the equal-position-weighted mean and median of each set;
4. the interquartile range and full minimum–maximum range; and
5. the number and identity-free position blocks containing mixed-clarity cases, item-integrity flags, or incomplete pairs.

`centrality` and `strength` may be displayed separately for diagnosis, but neither is a standalone primary quality endpoint.

### 4.3 Primary endpoint family P2 — interpretation-linked disagreement

Every blind initial rating should contain a pre-peer interpretation fingerprint locked before any peer score, aggregate, model judgment, or adjudication state is visible.

Minimum fields:

- `position_conclusion_summary`: one short statement per rater and position, entered before the first sibling critique is locked;
- `critique_target_summary`: one short statement per critique identifying the claim or part of the position attacked;
- `priced_in_assessment`: `no`, `partly`, `yes`, or `uncertain`;
- `interpretation_confidence`: the existing `high`, `medium`, or `low` field;
- `background_assumptions`: the existing field, required when interpretation confidence is low or the priced-in assessment is uncertain; and
- the existing position-ambiguity, critique-ambiguity, and insufficient-context flags.

A later, separately preserved cause record should classify paired interpretations as one or more of:

- compatible interpretations;
- material difference about the position's conclusion;
- material difference about what the critique attacks or claims;
- priced-in disagreement;
- background-assumption disagreement;
- score calibration or rubric-allocation difference without a material interpretation difference;
- substantive object-level disagreement;
- mixed cause; or
- unresolved/indeterminate.

The primary report should publish counts and denominators, not only illustrative examples. The exact coverage and independence rule for cause coding remains one of the two owner decisions listed in Section 11.

### 4.4 Primary endpoint family P3 — operational feasibility and burden

Report:

- accepted blind initial ratings divided by 96;
- complete paired critiques divided by 48;
- complete position blocks divided by 12;
- total core-rater active time;
- median, interquartile range, and range of active time per accepted rating;
- the same time summaries by identity-free position block and pseudonymous rater slot;
- counts and rates of safe declines, rejections, replacements, integrity flags, verification routes, checks, revisions, adjudication cases, and unresolved cases; and
- adjudicator active time if an adjudication stage occurs.

The LMCA 5–15 minute figure is a planning reference, not a Metaphilosophy pass threshold. The pilot should report observed burden without declaring failure merely because the median exceeds 15 minutes.

### 4.5 Secondary endpoint S1 — symmetric LMCA-style composite discrepancy

The LMCA custom weighted loss is directional because one rating is treated as the reference and its clarity determines the low-clarity branch. No blind initial Metaphilosophy rater is privileged as ground truth.

Let `L(x, y)` be the exact LMCA custom weighted loss with `x` as reference. Define the project-specific symmetric human–human discrepancy:

`D_sym(x, y) = [L(x, y) + L(y, x)] / 2`.

Report `D_sym` at the critique and position levels, using the same equal-position aggregation and sensitivity summaries as the primary gaps. Label it explicitly as a **Metaphilosophy symmetric extension of the LMCA loss**, not an LMCA source metric and not ground-truth error.

Mixed-clarity pairs, where only one rater gives clarity below 0.5, must be shown separately because the two directional branches use different component sets.

### 4.6 Secondary endpoint S2 — within-position ordering robustness

For each of the six critique pairs in a position:

- agreement = 1 when both raters order the critiques in the same direction;
- agreement = 0.5 when at least one rater ties them; and
- agreement = 0 when the raters reverse the order.

Report unweighted agreement first.

For the weighted diagnostic, use

`weight_ij = (|O_ai − O_aj| + |O_bi − O_bj|) / 2`.

This preserves weight when raters strongly reverse each other. Do not weight by the difference between the two-rater mean scores, because opposite rankings can cancel to a zero mean gap and disappear from the statistic.

Aggregate within each position first, then across the twelve positions. Do not treat the 72 critique comparisons as 72 independent observations.

### 4.7 Secondary endpoint S3 — stage-separated change

Always keep separate:

- blind initial;
- blind self-check, if approved;
- post-peer or post-evidence revision;
- adjudicated latest accepted; and
- explicitly unresolved.

For any later record, report:

- within-rater score-change magnitude;
- change in the paired-rater `G_overall`, `G_impact`, and `D_sym` gaps;
- revision reason and cause code; and
- whether the case remains unresolved.

A decrease in disagreement is not automatically an increase in truth. Post-peer changes are conditional on the routing policy and must not be described as the causal effect of discussion.

### 4.8 Secondary endpoint S4 — rater-composition and aggregation sensitivity

For every primary aggregate, report:

- leave-one-position-out range: twelve estimates, each omitting one position;
- leave-one-rater-out range: six estimates, each using the eight positions not involving that rater;
- equal-position mean;
- median of the twelve position summaries; and
- a table showing whether substantive conclusions change under those alternatives.

Do not estimate or apply reliability weights in this pilot.

### 4.9 Exploratory endpoints

The following may appear only as exploratory diagnostics:

- interval Krippendorff alpha by dimension;
- an ICC or mixed-model rater/position decomposition, if implemented with explicit small-sample warnings;
- source, topic, length, style-cue, or order associations;
- individual-rater offsets shown only to authorized researchers, never as public performance rankings;
- comparison of initial with latest accepted ratings;
- model-judge comparisons after the human-label analysis is frozen; and
- any formal resampling interval under an exchangeability assumption.

No exploratory result may become the headline endpoint after results are seen.

## 5. Uncertainty and sensitivity

The twelve positions are deliberately selected, not a random sample from a defined population of philosophical arguments. A conventional 95% confidence interval would therefore invite an unsupported population interpretation.

The required headline uncertainty display is instead a **finite-pilot robustness interval**:

- full twelve-position values;
- interquartile and minimum–maximum ranges;
- leave-one-position-out range;
- leave-one-rater-out range; and
- mean-versus-median sensitivity.

These intervals answer the relevant pilot question: whether the reported result depends on one position, one rater's four positions, or one aggregation rule.

A position-cluster bootstrap may be provided only in an appendix, labeled as a heuristic sensitivity analysis conditional on treating the twelve selected positions as exchangeable. It is not a population-valid headline confidence interval and is not required for the pilot's primary claim.

Do not report null-hypothesis p-values for primary pilot endpoints.

## 6. Missing data and replacement policy

- No score or interpretation field is imputed.
- A revision never substitutes for a missing blind initial rating.
- A valid replacement must be a new, independently blinded initial rating from a pre-authorized eligible replacement rater with no peer or model exposure.
- The complete primary report requires all 48 critiques to have two accepted blind initial ratings and all twelve position blocks to be complete.
- If the pilot stops early or remains incomplete, publish completeness and missingness by reason, but label aggregate endpoint summaries `incomplete_pilot_descriptive_only`.
- Preserve rejected, withdrawn, and superseded operational records in the audit trail while excluding them from the accepted-initial endpoint snapshot.
- Item withdrawal after a defect is discovered must be disclosed. It must not be replaced silently after ratings are observed.

## 7. Decision rules

### 7.1 No scientific pass/fail cutoff

The amendment recommends **no numerical scale-readiness threshold** for agreement, time, unresolved cases, or score spread. With twelve purposively selected position clusters, such a cutoff would be more arbitrary than evidential.

The pilot is procedurally complete only when:

1. all 96 blind initial ratings are accepted or validly replaced;
2. every required interpretation fingerprint is locked;
3. every triggered review case is closed or explicitly marked unresolved;
4. all stages and causes are preserved without overwriting initials; and
5. the complete analysis and audit package reproduces from the frozen snapshot.

Completion permits review; it does not authorize Phase 2.

### 7.2 Operational routing thresholds remain separate

The existing candidate thresholds (`overall` and impact gap 0.30; correctness and clarity gap 0.35; clarity below 0.5) remain diagnostic-only. This amendment does not approve them as workflow triggers.

Operational routing should ultimately combine categorical integrity routes with a versioned burden-tested numerical policy. Whatever values are chosen must be frozen before research use and must not be interpreted as scientific success thresholds.

## 8. Interpretation of checking, discussion, and revision

LMCA Appendix C separates initial ratings, double-checked ratings, and final post-discussion ratings. The current Metaphilosophy workflow has independent initials and later reratings, but no mandatory pre-peer self-check stage. Without such a stage, it cannot distinguish individual checking from peer discussion.

A balanced blind self-check subsample is methodologically preferable to disagreement-triggered checking alone because the latter selects cases based on the outcome being studied. The exact scope remains an owner decision in Section 11.

Any self-check must:

- be selected before any pilot rating is submitted;
- occur before peer, model, aggregate, or adjudication exposure;
- preserve the first rating and create a distinct `blind_self_check` record;
- prohibit a score change based merely on anticipated agreement; and
- record whether the rater found a new object-level consideration, corrected an error, or made no substantive change.

## 9. Existing implementation audit

### Retain

- exact 12 × 4 × 2 completeness validation;
- immutable initial and version-linked later records;
- position blocks;
- position-first leave-one-out analysis;
- exact LMCA custom weighted loss;
- all seven dimensions plus `centrality × strength`;
- time, confidence, verification, integrity flags, rationale, and background assumptions;
- diagnostic-only threshold policy with no approved routes; and
- sanitized public output.

### Amend before research use

- add the structured interpretation fingerprint and cause taxonomy;
- add a distinct blind-self-check stage if approved;
- add symmetric `D_sym` explicitly and label it as a project extension;
- make `G_overall` and `G_impact` position profiles primary;
- correct symmetric weighted ordering so reversed rankings cannot cancel out through the two-rater mean;
- add leave-one-rater-out and aggregation-rule sensitivity;
- demote alpha/ICC from headline status;
- add stage-specific denominators and missingness status;
- add adjudicator-time and interpretation-coding burden where applicable; and
- remove all automatic scale-readiness conclusions.

## 10. Smallest safe repository patch after approval

Do not implement this plan until the two open decisions are resolved and a separate owner instruction authorizes the patch.

The smallest safe patch would be:

1. **Freeze the amendment**
   - add an approved machine-readable endpoint contract beside this document;
   - add a verifier preventing model ranking, consensus-only reporting, or revisions from becoming the primary result.
2. **Extend the controlled rating record**
   - update `src/staging-rubric.mjs`, the controlled schema, service normalization, database/event projection, and UI for interpretation fields and any approved self-check stage.
3. **Amend the analysis engine**
   - update `scripts/pilot-rating-analysis.mjs` and its public sanitizer with the endpoints and sensitivity rules above;
   - correct the symmetric ranking weight;
   - keep initial, self-check, post-peer, and unresolved snapshots separate.
4. **Add representative tests**
   - add a complete 12-position synthetic fixture using the approved assignment graph;
   - test position weighting, rater deletion, mixed clarity, reversed rankings, missing pairs, interpretation cause counts, and stage preservation.
5. **Update pilot contracts, not production claims**
   - amend the pilot plan, analysis contract, adjudication contract, and methodology recommendation on the pilot branch;
   - do not change public production copy or deploy until a separate release review.

## 11. Open owner decisions

All other recommendations in this draft have at least 90% design credence. The following choices do not.

### D1. Blind self-check scope

**A — all 96 initial ratings.** Strongest separation of first impression from individual checking, but adds approximately 8–24 core-rater hours using LMCA's 5–15 minute planning estimate.

**B — balanced 24-rating subsample.** Preselect six positions, one per topic family and three per source class, using a six-edge degree-two subgraph so every rater self-checks two positions. Preselect two critiques per chosen position, so every rater self-checks four ratings. Adds approximately 2–6 core-rater hours. This is the current recommendation, but credence that it is exactly optimal is **0.86**.

**C — no mandatory blind self-check.** Lowest burden, but the pilot cannot estimate checking separately from outcome-triggered discussion/revision.

### D2. Interpretation-cause coding coverage

**A — two adjudicators independently code all 48 paired interpretation fingerprints before seeing numeric score gaps.** Clean denominator and strongest estimate of interpretation prevalence, but highest adjudicator burden.

**B — all 48 receive one blinded code; two-adjudicator coding is reserved for any mismatch plus a prespecified random audit of apparently compatible pairs.** Lower burden with an audit, but more complex analysis and weaker independence.

**C — code only cases triggered by score gaps or ambiguity flags.** Lowest burden, but only estimates causes conditional on being routed and cannot estimate interpretation-disagreement prevalence across the pilot.

The methodologically preferred option is A, but the credence that its information gain is worth the burden under the current USD 500 envelope is **0.82**.

## 12. Decision ledger and credences

| Decision | Recommendation | Credence |
|---|---|---:|
| Primary unit | Position-first finite-pilot analysis | 0.98 |
| Headline output | Disagreement, interpretation, and effort profile; no single score | 0.97 |
| Primary score quantities | Absolute `overall` and `centrality × strength` gaps | 0.97 |
| Symmetric LMCA-style loss | Secondary project extension, not ground-truth error | 0.94 |
| Ordering metric correction | Weight by average within-rater gap; report unweighted first | 0.98 |
| Uncertainty | Raw position blocks plus deletion and aggregation sensitivity, not population CI | 0.95 |
| Missingness | No imputation; no revision as replacement; incomplete pilot labeled | 0.99 |
| Rater weights | Do not estimate or apply reliability weights | 0.96 |
| Model results | Secondary exploratory diagnostics only after human analysis freezes | 0.99 |
| Scale decision | No automatic numerical pass/fail or Phase 2 authorization | 0.98 |
| Structured interpretation fingerprint | Require before peer exposure | 0.94 |
| Blind self-check scope | Option B provisionally preferred | 0.86 — owner decision required |
| Interpretation coding coverage | Option A provisionally preferred | 0.82 — owner decision required |
