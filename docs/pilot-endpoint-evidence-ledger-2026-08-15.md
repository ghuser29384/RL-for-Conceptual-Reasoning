# Pilot endpoint evidence ledger — 15 August 2026

**Status:** analysis support for `pilot-endpoint-design-amendment-v1-draft.md`; no operational authorization.

## Source hierarchy

1. Cooper et al., *A dataset of rated conceptual arguments* (LMCA), especially Section 2 and Appendices C, D, and F.
2. `RLHF Conceptual Reasoning93.md` and `Metaphilosophy_Decision_Log.md` on the current strategy base.
3. Approved strategy contract `ops/research-positioning-v1.json`.
4. Public study plan `research/index.html`.
5. Detailed pilot recommendations and implementation at draft PR #17 head `50acaf893ab99c7659dd63f46a0e27de1049e47d`.

## Traceability matrix

| Claim or recommendation | Evidence class | Basis | Disposition in draft |
|---|---|---|---|
| Contextualized position–critique is the rating unit | LMCA source | Sections 1–2 | Retained |
| Seven dimensions, 0–1 | LMCA source | Section 2 and Appendix F | Retained |
| Use `centrality × strength` rather than either field alone for substantive impact | LMCA source | Section 3, Appendix A, Appendix D, Appendix F | Primary quantity retained |
| Hide source/tags and peer ratings during initial rating | LMCA source | Section 2 | Retained |
| Preserve original ratings when revisions are added | LMCA source | Section 2 and Appendix C | Retained as immutable-initial rule |
| Short rating planning estimate is 5–15 minutes | LMCA source | Section 2 | Planning reference only; not a threshold |
| Interpretation is a leading hard-disagreement cause | LMCA source | Appendices C and D | Motivates structured fingerprint |
| Checking and discussion improved agreement but did not remove all disagreement | LMCA source | Appendix C | Motivates stage separation; no forced consensus |
| LMCA rating test used 52 critiques across 19 positions with four core raters on all items | LMCA source | Appendix C | Demonstrates that the 2-rater pilot cannot reproduce Appendix C |
| Low-clarity branch and exact custom loss weights | LMCA source | Appendix B.2 | Retained exactly in directional loss |
| Symmetrizing directional custom loss for two human raters | Metaphilosophy extension | No rater is a privileged target | Secondary endpoint; labeled extension |
| 12 positions × 4 critiques × 2 blind initial raters | Current project proposal | Public study plan and pilot plan | Analyzed as proposed geometry; not newly authorized |
| Six raters, four positions each, twelve unique rater pairs | Current project recommendation | Pilot methodology and assignment contract | Used for sensitivity and identifiability analysis |
| Position is the resampling/aggregation unit | Project inference from design plus existing recommendation | Four critiques share context and rater pair | Required |
| Pair-specific effect is confounded with position | Statistical implication of assignment graph | Each pair appears on only one position | Explicit limitation |
| Do not estimate reliability weights or rank raters | Small-sample project decision | Six raters, four positions each | Required |
| Structured interpretation fingerprint | Metaphilosophy extension | Needed to measure approved research object | Required recommendation |
| Blind self-check stage | Metaphilosophy extension motivated by LMCA Appendix C | Needed to separate checking from discussion | Scope pending owner decision D1 |
| Dual interpretation-cause coding | Metaphilosophy extension | Needed for an all-pilot interpretation denominator | Coverage pending owner decision D2 |
| Absolute `overall` and impact gaps as headline quantities | Metaphilosophy endpoint choice | Transparent, symmetric, source-compatible | Primary |
| No single pooled agreement statistic | Approved strategy | `mp-research-positioning-v1` | Required |
| Correct symmetric ranking weight uses average within-rater gap | Metaphilosophy metric correction | Prevents reversed rankings from canceling through the two-rater mean | Secondary diagnostic |
| Alpha and ICC are exploratory | Small-sample design judgment | Two ratings per critique and twelve clusters | Required |
| No population-valid headline CI | Sampling-frame limitation | Positions are purposively selected | Required |
| Leave-one-position and leave-one-rater ranges | Robustness strategy | Directly tests dependence on one cluster or rater | Required |
| No automatic scale-readiness threshold | Approved positioning plus small-sample limitation | Pilot supports a later decision, not automatic expansion | Required |
| Model comparison is secondary only | Approved strategy | `mp-research-positioning-v1` | Required |

## Repository implementation observations

### Existing fields that reduce patch size

`src/staging-rubric.mjs` already includes:

- seven rubric scores;
- assessability;
- interpretation confidence;
- rating confidence;
- verification status;
- position/critique ambiguity and insufficient-context flags;
- background assumptions;
- rationale; and
- active time.

The amendment therefore needs structured interpretation content and stage semantics, not an unrelated replacement rating form.

### Existing analysis capabilities to preserve

`scripts/pilot-rating-analysis.mjs` already includes:

- complete-pilot validation;
- exact LMCA custom weighted loss;
- initial/latest snapshot separation;
- position blocks;
- dimension gaps and `centrality × strength`;
- alpha diagnostic;
- candidate/operative route separation; and
- leave-one-position-out ranges.

### Existing analysis defect to correct

The current symmetric weighted ordering calculation weights a critique pair by the absolute difference between the two-rater mean overall scores. If one rater strongly prefers critique A and the other equally strongly prefers critique B, the means can tie, the weight becomes zero, and the strongest reversal disappears. The draft instead uses the average of the two raters' absolute within-rater gaps and reports unweighted agreement first.

## Unresolved evidence gaps

The reviewed materials do not establish:

- the incremental validity per expert-hour of checking all 96 ratings versus a balanced subsample;
- the time required for dual interpretation coding of all 48 pairs;
- whether that coding burden fits the existing USD 100 adjudication reserve;
- a source-derived numerical adjudication threshold; or
- a source-derived numerical scale-readiness threshold.

Those gaps are why D1 and D2 remain owner choices and why the draft recommends no scientific pass/fail cutoff.
