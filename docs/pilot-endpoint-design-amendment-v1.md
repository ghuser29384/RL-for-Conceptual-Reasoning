# Metaphilosophy pilot endpoint design amendment v1

**Status:** owner-approved design contract; implementation and research use remain unauthorized  
**Approved by:** Ellen Sun  
**Approval date:** 16 August 2026  
**Strategy contract:** `ops/research-positioning-v1.json` (`mp-research-positioning-v1`)  
**Machine-readable contract:** `ops/pilot-endpoint-design-amendment-v1.json`  
**Methodological basis:** Cooper et al., *A dataset of rated conceptual arguments*, especially Section 2 and Appendices C, D, and F  
**Evidence record:** `docs/pilot-endpoint-evidence-ledger-2026-08-15.md`

This contract incorporates the analysis in `docs/pilot-endpoint-design-amendment-v1-draft.md` and resolves its two open owner decisions. It freezes what a later implementation must encode. It does not itself modify the pilot workflow, approve Q-006B, freeze protected items or operational thresholds, authorize participant access or recruitment, start research, merge a pull request, change public copy, or deploy production.

## 1. Study role and geometry

The proposed study remains a finite pilot of expert-judgment robustness and workflow feasibility:

- 12 position clusters;
- 4 sibling critiques per position;
- 48 paired critique units;
- 2 independently locked blind initial ratings per critique;
- 96 accepted blind initial rating records;
- 6 core raters, each covering 4 positions and 16 critiques; and
- 12 unique rater pairs, one pair per position.

Position is the primary aggregation and sensitivity unit. Four critiques share one position and one rater pair, and each rater pair appears on only one position. Pair-specific interaction is therefore confounded with position. The 48 critique units and 72 within-position critique comparisons must not be presented as independent top-level observations.

## 2. Primary endpoint families

### P1 — blind-initial disagreement profile

For each paired critique, compute the absolute difference between the two blind initial raters on:

- `overall`; and
- `centrality × strength`.

Summarize each quantity first within each position by averaging across its four critiques. Report all twelve identity-free position blocks, then the equal-position-weighted mean, median, interquartile range, and full range. Centrality and strength may be shown separately as diagnostics but are not standalone primary quality endpoints.

### P2 — interpretation-linked disagreement

Every initial rater must lock a pre-peer interpretation fingerprint before seeing any peer score, aggregate, model judgment, cause code, or adjudication state.

The fingerprint contains:

- one short `position_conclusion_summary` per rater and position, completed before that rater locks the first sibling critique;
- one short `critique_target_summary` per critique;
- `priced_in_assessment`: `no`, `partly`, `yes`, or `uncertain`;
- `interpretation_confidence`: `high`, `medium`, or `low`;
- `background_assumptions`, required when confidence is low or priced-in status is uncertain; and
- position-ambiguity, critique-ambiguity, and insufficient-context flags.

Paired fingerprints are classified using one or more of these cause codes:

- compatible interpretations;
- material difference about the position's conclusion;
- material difference about what the critique attacks or claims;
- priced-in disagreement;
- background-assumption disagreement;
- score-calibration or rubric-allocation difference without material interpretation difference;
- substantive object-level disagreement;
- mixed cause; or
- unresolved or indeterminate.

### P3 — operational feasibility and burden

Report completion at the rating, critique, and position levels; total and distributional active rating time; safe declines; rejected or replaced records; item-integrity and verification routes; self-checks; revisions; adjudication cases; unresolved cases; and adjudicator active time where applicable.

LMCA's approximate 5–15 minute range for short ratings is a planning reference, not a Metaphilosophy pass/fail threshold.

## 3. Owner decision D1 = B — balanced blind self-check subsample

The pilot will require **24 blind self-check records**, selected independently of observed human scores or disagreements.

The frozen selection invariants are:

- select 6 of the 12 positions before any pilot rating is submitted;
- include exactly one position from each of the six topic families;
- include exactly 3 positions from each of the two approved source classes;
- select exactly 2 of the 4 critiques within each selected position;
- both original raters self-check each selected critique, producing `6 × 2 × 2 = 24` self-check records;
- each of the six core raters self-checks exactly 4 of their initial ratings; and
- each core rater appears in exactly 2 selected positions.

The exact position IDs, critique IDs, deterministic selection seed, and resulting manifest commitment must be frozen at the later controlled-manifest stage before the first pilot rating. Selection must not use initial human scores, peer disagreement, later adjudication status, or post-rating model outputs.

Each self-check must:

- occur after the rater's corresponding initial rating is locked;
- occur before exposure to peer ratings or rationales, model judgments, aggregates, cause codes, discussion, or adjudication state;
- preserve the original rating unchanged;
- create a separate predecessor-linked `blind_self_check` record;
- record whether any score changed and the object-level reason for the change; and
- remain analytically distinct from post-peer, post-evidence, or adjudication-stage revision.

The self-check subsample supports a bounded descriptive estimate of checking burden and within-rater change. It does not support a population-level causal claim about checking.

## 4. Owner decision D2 = A — dual blind cause coding of all 48 pairs

Two dedicated adjudicators will independently code **all 48 paired interpretation fingerprints**.

For each pair, both adjudicators must complete and lock an initial cause code before either adjudicator sees:

- numeric score gaps or score vectors;
- the other adjudicator's code or rationale;
- model judgments or acquisition strata;
- aggregate pilot results; or
- adjudication outcomes.

The cause-coding view may contain the frozen position and critique text plus the two role-masked interpretation fingerprints. It must not disclose rater identity, seniority, or performance history beyond what is strictly required for conflict handling.

Both initial cause codes remain immutable. A later reconciliation memo may record shared conclusions, remaining coding disagreement, or an unresolved classification, but it must not overwrite either initial code. The report must publish the all-48 denominator, raw dual-code agreement and disagreement, cause-code counts, and unresolved coding cases.

This decision expands adjudicator work beyond disagreement-triggered case handling. Before named participant commitments or payment representations, the project must re-estimate the adjudicator workload and verify that the honorarium and operations plan can cover it. This contract does not authorize payment or alter the current USD 100 adjudication reserve.

## 5. Secondary and exploratory endpoints

Secondary endpoints are:

- a symmetric human–human discrepancy defined as the average of the two directions of the exact LMCA custom weighted loss, explicitly labelled a Metaphilosophy extension rather than LMCA ground-truth error;
- within-position ordering robustness, with unweighted agreement reported first and the weighted diagnostic using the average of the two raters' absolute within-rater gaps, not the gap between two-rater mean scores;
- stage-separated change across blind initial, blind self-check, post-peer or post-evidence revision, adjudicated latest accepted, and unresolved states; and
- leave-one-position-out, leave-one-rater-out, equal-position mean, and position-median sensitivity.

Krippendorff alpha, ICC or mixed-model decompositions, topic/source/length/style associations, individual-rater offsets, formal exchangeability-based resampling intervals, and model comparisons remain exploratory only. Model results may be added only after the human-label analysis is frozen and may not become the pilot's headline output.

## 6. Uncertainty, missingness, and decision rules

The twelve positions are purposively selected rather than sampled from a defined population. The headline uncertainty display is therefore finite-pilot robustness evidence:

- all twelve position values;
- interquartile and full ranges;
- leave-one-position-out range;
- leave-one-rater-out range; and
- mean-versus-median sensitivity.

A position-cluster bootstrap may appear only as an appendix sensitivity analysis under an explicit exchangeability assumption. Primary endpoints use no null-hypothesis p-values and no population-valid headline confidence interval.

No score or interpretation field is imputed. A revision or self-check cannot replace a missing blind initial rating. Any replacement must be a new independently blinded initial rating from a pre-authorized eligible replacement rater with no peer or model exposure. Item withdrawal or replacement after a defect is discovered must be disclosed and must not be performed silently after inspecting ratings.

There is no scientific numerical pass/fail threshold for agreement, rating time, unresolved cases, or score spread. Procedural completion permits review only. It does not authorize Phase 2, a public benchmark, model-training claims, participant access, recruitment, or research expansion.

## 7. Minimum implementation boundary

A later separately authorized implementation must, at minimum:

1. encode this approved contract and keep it machine-verifiable;
2. extend the controlled rating schema, storage, service, and UI for the interpretation fingerprint and the selected `blind_self_check` stage;
3. add a blind, role-masked, dual-adjudicator cause-coding workflow for all 48 pairs;
4. correct the ordering-weight cancellation defect and add the position-first primary, secondary, stage, missingness, and sensitivity outputs;
5. add complete synthetic fixtures and regression tests for all invariants; and
6. update the pilot plan, analysis, adjudication, workload, and methodology contracts without changing production claims or authorizing research.

This approved design remains fail-closed. Its existence is not Q-006B approval, operational readiness, research authorization, or permission to merge or deploy.