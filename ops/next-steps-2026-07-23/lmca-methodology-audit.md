# Internal audit — LMCA implications for the 48-critique pilot

**Status:** Source-grounded methodological audit. This document does not approve outreach, numerical thresholds, protected items, or participant selection.

**Primary source:** Emery Cooper, Caspar Oesterheld, Linh Chi Nguyen, Alexander Kastner, and Ethan Perez, *A dataset of rated conceptual arguments* (here called **LMCA**).

## What LMCA establishes

LMCA provides direct prior art for multidimensional expert evaluation of conceptual critiques. It reports:

- 951 rated critiques;
- 1,458 ratings, ignoring revisions;
- 442 positions with at least one rated critique;
- 279 positions with at least two rated critiques; and
- seven dimensions: centrality, strength, correctness, clarity, dead weight, single issue, and overall.

LMCA therefore supports the basic feasibility of rating contextualized conceptual critiques. Metaphilosophy should not claim that its pilot is the first dataset or first demonstration of this idea.

LMCA's contribution is substantially larger than the proposed 48-critique pilot. The pilot's defensible purpose is narrower: test a deliberately multi-rater, platform-mediated, auditable operating design; measure time and disagreement; diagnose item failures; and generate evidence about whether a larger programme is operationally justified.

## LMCA limitations that the pilot should directly address

### 1. Rater concentration

LMCA reports 946 ratings by Emery Cooper out of 1,458 total ratings. Other listed raters contributed substantially fewer ratings. The paper itself states that almost all data points were rated by the primary rater and says later releases will likely increase double-rating or double-checking.

**Pilot response:** every production critique receives two independent initial ratings. The anonymous assignment graph should be connected, balanced, and free of repeated rater pairs so the pilot does not merely replace one primary rater with six isolated mini-datasets.

### 2. Too few positions with a useful within-position spread

LMCA identifies a shortage of positions containing multiple critiques with a meaningful spread from weak to strong. This weakens comparison-based evaluation.

**Pilot response:** retain four critiques per position and select them from a larger candidate pool. Candidate selection should seek a likely strong candidate, a plausible weak candidate, and two disagreement- or attack-family-diverse candidates. These acquisition strata are not labels and remain hidden from raters.

### 3. Source and style confounding

LMCA warns that model-generated critiques are disproportionately weak, while some long, distinctively human-written critiques are disproportionately strong. It also notes that procedural source blindness cannot eliminate source cues visible in the text.

**Pilot response:** prefer a six-six source crossing, with one public-synthetic and one protected-public-domain-derived position in every proposed topic family. At the rater level, each anonymous rater should receive two positions from each source class. Candidate selection must record length, formatting, citation, source, and style-cue diagnostics before rating. The project should not rewrite substantive critique text merely to conceal its source; residual cue risk belongs in the limitations and sensitivity analysis.

### 4. Interpretation-driven disagreement

LMCA describes differences in interpretation of positions and critiques as among the largest causes of initial disagreement. It also identifies disagreements about whether a point is already “priced in,” how much detail a critique needs, and what background knowledge should be assumed.

**Pilot response:** freeze a position context card before rating, including the intended conclusion, relevant scope, and ambiguity notes. Calibration should deliberately include interpretation ambiguity, priced-in objections, background-knowledge dependence, and vague critiques that may appear to make a stronger point than they actually articulate.

### 5. Strength–centrality ambiguity

LMCA explains that the allocation between strength and centrality is often ambiguous and therefore treats their product as the more meaningful measure of substantive impact.

**Pilot response:** preserve both rubric fields because they aid reasoning, but do not treat either as a standalone quality target. Primary analysis and disagreement routing should include `strength × centrality`.

### 6. Low clarity changes what can be interpreted

LMCA's custom loss uses only clarity and overall when the human clarity score is below 0.5, because the remaining dimensions may be unreliable or not meaningful for an unclear critique.

**Pilot response:** add a proposed mandatory item-review route whenever either initial rater scores clarity below 0.5. This is distinct from a large difference in clarity: two raters can agree that a critique is very unclear, which still creates an item-quality issue.

### 7. Revision should follow object-level reasons, not social conformity

LMCA preserves original ratings and instructs raters not to update merely because others disagree. In its rating test, object-level discussion and reconsideration substantially improved agreement, but some interpretation and intuition-based disagreements remained.

**Pilot response:** lock and preserve initial ratings. Re-rating requires a recorded object-level reason. Adjudication may conclude that uncertainty remains; consensus is not compulsory.

## What the LMCA rating test does and does not imply

LMCA's rating test used 52 critiques across 19 positions. Four raters rated the full set, two additional raters rated subsets, and the raters spent roughly seven to eight hours in two meetings plus written discussion. The paper reports high final agreement and materially worse initial agreement, while emphasizing the small sample and wide uncertainty for some metrics.

This supports four pilot choices:

1. use a common public calibration set rated by all six core raters and both adjudicators;
2. preserve pre-discussion and post-discussion records separately;
3. treat interpretation and item defects as first-class outputs rather than mere noise; and
4. report uncertainty and raw position-level results, not only a single reliability coefficient.

It does **not** justify copying LMCA's exact discussion time, using final consensus as unquestionable ground truth, or treating the proposed 48-critique pilot as a statistical replication of LMCA.

## Recommended methodological changes

### Balanced anonymous assignment

Use the anonymous 12-slot assignment in `pilot-methodology-recommendations.json`. It has the following properties:

- 12 distinct rater pairs;
- four positions and sixteen critique ratings per core rater;
- four distinct rater partners per core rater;
- four distinct topic families per core rater;
- under the preferred source mix, two positions from each source class per core rater; and
- under the preferred source mix, one position from each source class in every topic family.

This is a design template, not a mapping to named participants. Conflicts or prior exposure may require a regenerated design with the same invariants.

### Shared public calibration

Recommend two public positions with four critiques each, rated independently by all six core raters and both adjudicators. The eight calibration critiques should cover the principal LMCA rating difficulties. Initial calibration ratings remain preserved. Discussion uses a rubric-based considerations dossier, not an unquestionable single gold vector.

No numerical pass threshold should be frozen before methodological-adviser review and explicit project-owner approval. Calibration items do not count toward the 48 critiques or pilot outcomes.

### Adjudication and item review

In addition to provisional numerical difference triggers, present advisers with two non-numeric routing candidates:

- either rater assigns clarity below 0.5; and
- either rater reports an unresolved correctness-sensitive verification issue.

These routes should open item or evidence review. They should not automatically pressure a rater to change a score.

### Small-sample analysis protections

The pilot has only 12 position clusters. Therefore:

- publish all position-level results;
- use position, not individual critique, as the resampling and leave-one-out unit;
- report leave-one-position-out ranges for primary agreement summaries;
- separate pre-adjudication from post-adjudication results;
- label ICC, Krippendorff's alpha, model comparisons, and subgroup effects exploratory; and
- make no causal claim that one source, topic, model family, or rater type is superior.

## Remaining decisions

The following remain unresolved and should not be inferred from this audit:

- whether six suitable positions from each source class survive independent item review;
- the exact calibration items and qualification rule;
- final adjudication thresholds and review routes;
- final scale-readiness criteria and uncertainty procedure;
- the named rater, adjudicator, and adviser rosters;
- payment, tax, sanctions, privacy, and jurisdiction readiness; and
- the exact protected manifest.

## Recommendation

Use the balanced assignment, source-crossing target, shared calibration, low-clarity route, and small-sample safeguards as the concrete Q-006A consultation proposal. Freeze none of them as production policy until adviser feedback is recorded and the project owner resolves Q-006B.
