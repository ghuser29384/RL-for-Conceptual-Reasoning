# Q-006 owner decision packet

**Status:** Internal recommendation. No outreach, protected-item selection, controlled assignment, task-bundle generation or distribution, rating ingestion, payment onboarding, rating work, or funding submission occurs from this document alone.

Q-006 currently combines methodological, roster, payment, delivery, acceptance, and outreach decisions that become knowable at different times. The recommended approach is to resolve it in three checkpoints rather than force premature choices.

## Recommended decision structure

### Q-006A — approve the consultation design

Approve the following as the protocol to show bounded methodological advisers, while keeping all numerical thresholds, exact items, participants, controlled artifacts, and acceptance decisions provisional:

1. **Pilot structure:** 12 positions × 4 critiques = 48 critiques.
2. **Independent review:** 2 blind initial ratings per critique = 96 initial ratings.
3. **Assignment unit:** all four sibling critiques stay with the same pair of raters.
4. **Panel:** 6 early-career core raters and 2 dedicated adjudicators.
5. **Topic proposal:** 2 positions in each of six families:
   - normative ethics;
   - political philosophy;
   - epistemology and philosophy of science;
   - philosophy of mind and AI consciousness;
   - decision theory and social choice; and
   - metaphilosophy and AI governance.
6. **Eligible item sources:** public synthetic material receiving new expert ratings and protected public-domain-derived positions that pass source-fidelity and ambiguity/scope review.
7. **Preferred source crossing:** target 6 positions from each source class, with one position from each source class in every topic family. If this is infeasible after independent item review, retain at least 4 from each source class and document all deviations for Q-006B.
8. **Balanced anonymous assignment:** use 12 distinct rater pairs, four positions and four distinct partners per rater, four distinct topic families per rater, and—under the preferred source crossing—two positions from each source class per rater. The concrete anonymous template is in `pilot-methodology-recommendations.md`.
9. **Assignment eligibility and failure rule:** every assigned topic family must appear in that participant's separately approved coverage record; authorship conflicts and prior exposure are hard exclusions. If no participant-to-slot mapping satisfies every competence, conflict, exposure, and balance constraint, generate no assignment. Do not relax a constraint or make an undocumented manual swap.
10. **Candidate-acquisition proposal:** collect at least 8 candidate critiques per position, then select 4 that include a likely strong candidate, a plausible weak candidate, and two high-disagreement or attack-family-diverse candidates under frozen acquisition judges.
11. **Candidate confound controls:** freeze length, formatting, citation, source, model/author, attack-family, judge-disagreement, and source-style-cue diagnostics before selection. Do not treat acquisition-judge strata as labels or substantively rewrite critiques merely to hide source.
12. **Rubric:** centrality, strength, correctness, clarity, dead weight, single issue, and overall; analyze substantive impact through `strength × centrality`.
13. **Blindness:** hide source class and identity, author/model identity, acquisition-judge outputs, provisional strata, paired-rater identity and ratings, aggregate ratings, labels, and adjudication status until initial ratings are locked.
14. **Blind task-packet proposal:** after later controlled approvals, give each core rater one participant-specific packet containing four assigned positions and four sibling critiques per position. Replace controlled item IDs with participant-specific opaque task tokens; bind the packet to the selected assignment, manifest, rubric, exact text versions, blindness declarations, and response schema; keep a private operator index; and require a hash-bound submission containing all sixteen assigned responses exactly once.
15. **Artifact separation:** generating a controlled assignment does not authorize task-packet generation; generating a task packet does not authorize distribution; distribution does not itself authorize rating before final readiness; structural submission validity does not imply acceptance; and acceptance review does not itself authorize controlled ingestion. No stage may be inferred from the existence of the preceding artifact.
16. **Rating-ingestion proposal:** canonically hash each submission; require one recorded quality-control disposition and reason per response; materialize only explicitly accepted responses; retain rejected raw submissions and decisions separately; use an explicit no-op for responses already materialized from an earlier submission; reject exact replay and duplicate initial ratings; and bind each batch to a private ingestion event and before/after dataset commitments.
17. **Revision:** preserve every accepted original rating; require an object-level reason for any versioned re-rating. Operational rejection or correction of an unaccepted submission is not represented as an object-level re-rating.
18. **Shared calibration proposal:** all six core raters and both adjudicators independently rate the same 8 public, non-protected calibration critiques across 2 positions. Preserve initial ratings, discuss object-level reasons using a considerations dossier rather than an unquestionable gold vector, and exclude calibration from pilot outcomes.
19. **Additional item-review proposals:** open review if either rater assigns clarity below 0.5 or reports an unresolved correctness-sensitive verification issue. Neither route automatically requires revision.
20. **Small-sample safeguards:** publish position-level results, use position as the resampling or leave-one-out unit, separate initial from post-adjudication results, and treat ICC, alpha, model comparisons, and subgroup effects as exploratory.
21. **Senior role:** bounded methodological review only—approximately 20 asynchronous minutes or one 30-minute call, with no bulk rating, ongoing board role, or implied endorsement.

**Recommendation:** approve Q-006A. This is sufficiently specified for methodological criticism without pretending that the thresholds, exact calibration rule, protected items, participants, assignment mapping, task packets, acceptance decisions, ingestion events, or delivery process are final.

## Source-grounded rationale

The LMCA paper establishes the feasibility of multidimensional expert rating and reports 951 rated critiques. It also identifies rater concentration, source/style confounding, too few positions with a useful within-position quality spread, and interpretation-driven disagreement. Its scoring discussion treats `strength × centrality` as more meaningful than either component alone and uses only clarity plus overall when human clarity falls below 0.5. It also preserves original ratings when object-level discussion produces revisions.

The new `lmca-methodology-audit.md` and `pilot-methodology-recommendations.*` convert those observations into concrete, testable consultation proposals while preserving LMCA as prior art and prohibiting uncleared row reuse. The assignment, task-bundle, and ingestion engines are Metaphilosophy-specific operational extensions: LMCA motivates multi-rater, source-blind rating and preservation of initial judgments, but it does not supply these allocation, tokenization, commitment, delivery, acceptance, or replay-control algorithms.

## Provisional questions for advisers

The review packet should expose concrete candidates rather than ask only vague questions. The following remain explicitly non-binding.

### Adjudication candidates

- overall-score difference ≥ 0.30;
- `strength × centrality` difference ≥ 0.30;
- correctness difference ≥ 0.35;
- clarity difference ≥ 0.35;
- mandatory item review whenever either rater scores clarity below 0.5;
- mandatory evidence review whenever either rater reports an unresolved correctness-sensitive verification issue; and
- mandatory review whenever either rater flags insufficient context, source fidelity, ambiguity, scope, or leakage.

The adviser should be asked whether the numerical values are too low, too high, redundant, or likely to create capacity or selection bias, and whether the non-numeric routes are properly classified as item/evidence review rather than pressure to converge.

### Scale-readiness candidates

- median accepted-rating time ≤ 15 minutes;
- weighted within-position pairwise agreement ≥ 0.75 for critique pairs whose mean overall-score gap is at least 0.20;
- at least 9 of 12 positions with a consensus overall-score spread ≥ 0.30; and
- no more than 25% of critiques unresolved because of defective context, source fidelity, ambiguity, or scope after adjudication.

These should be reported with uncertainty intervals, all position-level results, leave-one-position-out sensitivity, and failure analysis. They must not automatically trigger Phase 2, even if met.

### Blind-packet, acceptance, and ingestion candidates

- participant-specific opaque tokens rather than controlled item IDs;
- separate assignment and task-token secrets;
- a packet commitment covering assignment, manifest, rubric, exact text versions, blindness declarations, and response schema;
- private operator-index mapping with no public or rater-facing item mapping;
- refusal to validate a submission with an altered packet hash, missing or duplicate token, unassigned token, incomplete score vector, or hidden source/assignment metadata;
- a quality-control decision and reason for every response, without editing the submitted score content;
- separate `accepted_materialize`, `rejected_no_materialization`, and `already_materialized_noop` dispositions;
- canonical replay rejection and deterministic accepted-rating and ingestion-event commitments; and
- separate controls for packet generation, distribution, rating start, acceptance review, ingestion, analysis, and publication.

The adviser should be asked whether these controls create unnecessary burden, whether the commitments are sufficient to reconstruct what a rater saw and what was accepted, whether any metadata necessary for object-level judgment is mistakenly hidden, whether rejected responses should remain outside the accepted dataset, and whether the operator index or ingestion receipt creates avoidable re-identification or single-point-of-failure risk.

## Q-006B — freeze methodology, controlled items, task contracts, and ingestion rules

Resolve only after bounded adviser feedback, calibration feasibility review, and item screening are available.

Approve:

1. the final topic and source matrix;
2. the final candidate-pool and critique-selection rule;
3. the final anonymous assignment graph and deterministic generator, including topic-coverage, conflict, prior-exposure, no-relaxation, seed, hashing, and permitted versioned-regeneration rules;
4. the final blind task-bundle contract, including hidden metadata, task-token construction, separation from the assignment seed, exact packet-hash coverage, operator-index fields, output permissions, and permitted versioned-regeneration rules;
5. the final initial-submission schema and validator, including exact packet/rubric binding, task-token completeness, allowed verification states and integrity flags;
6. the final rating-ingestion contract, including canonical submission hashing, quality-control dispositions, acceptance reasons, rejection and correction treatment, deterministic rating IDs, replay rules, no-op rules, provenance fields, ingestion-event receipts, and public-summary privacy;
7. the exact public calibration examples, considerations dossier, remediation rule, and qualification threshold;
8. final numerical adjudication triggers and non-numeric item/evidence-review routes;
9. final numerical scale-readiness criteria and uncertainty reporting;
10. the exact 12 position IDs and 48 critique IDs;
11. source, authorship, version, rights, exposure, and conflict records;
12. the controlled manifest hash;
13. the frozen rubric version and hash;
14. the frozen model-baseline lineup and API reproducibility record; and
15. the exclusion ledger for screened but rejected items.

The recommended default is not to change a protected position or critique after the manifest is frozen. A substantive text change creates a new version and invalidates the affected packet commitment, requiring assignment/exposure review and a newly generated packet. If the preferred graph is infeasible under the approved roster, it must be versioned and re-approved rather than silently altered.

## Q-006C — approve people, delivery, acceptance roles, payment, and dates

Resolve after expressions of interest and qualification information exist.

Approve:

1. six named early-career core raters;
2. two named adjudicators;
3. at least two prequalified replacements, where feasible;
4. each participant's approved topic-family coverage;
5. conflict, prior-exposure, consent, availability, and calibration status;
6. recipient jurisdictions and feasible payment methods;
7. the private process for identity, tax, payment, and sanctions-screening data;
8. the controlled task-packet delivery mechanism, recipient authentication, access duration, revocation, loss or suspected-leak response, support channel, and deletion/retention instructions;
9. the operator-index custodian and access list;
10. the quality-control operator role, allowed acceptance and rejection reasons, correction process, escalation path, and separation from adjudication;
11. the ingestion authorizer, ingestion operator, receipt custodian, storage path, backup, and access list;
12. the participant communication and appeal process for rejected work;
13. the external-funding application owner;
14. the exact senior-adviser roster and outreach order;
15. the authorized sender and reply-handling owner; and
16. the readiness-signoff timestamp, from which the first-Monday start and 28-day end are derived.

**Recommendation for funding ownership:** Ellen Sun remains accountable as project owner, while a named drafting/research contributor may be assigned separately. Do not represent either Long-Term Future Fund or Emergent Ventures as applied to, interested, or committed before an actual submission or response.

## Assignment authorization boundary

Even after Q-006B and Q-006C, a controlled assignment run requires a separate versioned assignment-authorization record, a frozen private manifest, completed conflict/exposure checks, passed calibration, confirmed private storage, and a secret seed. The full assignment cannot be printed publicly or written into the repository. Generating the mapping does not authorize task-packet generation or rating work.

## Task-bundle generation and distribution boundary

After a controlled assignment exists, task-bundle generation requires a separate versioned authorization, the approved manifest and rubric hashes, a distinct controlled task-token secret, private output storage outside the repository, and a valid approval timestamp. The six blind packets and operator index use restricted file permissions and remain controlled artifacts.

Generation does not authorize distribution. Distribution requires the Q-006C delivery controls and the final readiness evidence. A packet may not be sent, opened for production work, or treated as a live assignment merely because it was generated.

## Rating-ingestion authorization boundary

A structurally valid submission is not an accepted rating. Controlled ingestion additionally requires Q-006B and Q-006C, the frozen manifest, generated assignment and packets, final readiness, authorized distribution and rating work, completed per-response quality control, private controlled storage, and a separate versioned ingestion authorization.

The ingestion engine may materialize only responses explicitly marked `accepted_materialize`. Rejected responses remain in the raw submission and decision archive but do not enter the accepted rating dataset. Exact replay and duplicate initial ratings fail closed. The private receipt and controlled dataset must remain outside the repository with restricted access.

Ingestion does not authorize payment, publication, a funding submission, or Phase 2.

## Email authorization boundary

Approval of Q-006A authorizes only preparation of the consultation packet, recipient research, public calibration screening, and non-final item screening. It does **not** authorize sending.

Before any email, the project owner receives:

- exact recipients and role rationales;
- public source for each professional address;
- exact adviser, rater, and adjudicator messages;
- all attachments or links;
- the single permitted follow-up;
- sender address and reply-handling plan; and
- confirmation that no protected item, private participant record, uncommitted payment claim, or endorsement claim is included.

The project owner then separately authorizes sending.

## Recommended immediate owner action

Approve or revise **Q-006A only**. That unlocks three non-binding tasks:

1. assemble the exact bounded methodological-adviser candidate slate and complete email packet without sending;
2. screen public examples for the shared calibration packet; and
3. screen candidate positions and critiques into a controlled, non-final pilot-item slate using the balanced assignment, topic-coverage, blindness, task-packet, ingestion, and confound-control requirements.

It does not unlock controlled assignment, task-packet generation or distribution, participant work, quality-control acceptance, ingestion, or payment. Q-006B and Q-006C should remain open until the evidence required to decide them exists.
