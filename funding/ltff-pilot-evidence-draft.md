# Long-Term Future Fund application draft — Metaphilosophy

Status: **draft; submission blocked pending Pilot 01 results and senior methodological feedback**  
Application owner: **Ellen Sun**  
Official application information: https://funds.effectivealtruism.org/apply-for-funding

## Project summary

Metaphilosophy is building expert data and evaluation infrastructure to improve AI systems’ ability to assess arguments about conceptual questions: questions without an accessible ground-truth answer or a widely accepted resolution procedure, but on which progress can be made through arguments and critique.

The project follows “A dataset of rated conceptual arguments” (LMCA), which contains 951 rated critiques across topics including AI safety, decision theory, ethics, philosophy of mind, and politics. LMCA uses seven expert-rating dimensions—centrality, strength, correctness, clarity, dead weight, single issue, and overall—and found that leading models had not yet reached the apparent expert ceiling. It also identified major limitations: insufficient double rating, source and style confounds, too few positions with a useful quality spread, and unresolved uncertainty about evaluation metrics.

Metaphilosophy’s planned next release is a harder, multiply rated 100-position, 400-critique set. Before launching that expensive programme, the project is running a 48-critique public development pilot to measure actual workload, inter-rater agreement, disagreement causes, adjudication demand, attrition, and operational reliability.

## Why this may improve the long-term future

Advanced AI systems will increasingly advise on high-stakes strategic and normative questions for which there is no simple answer key. Relevant examples include AI governance, alignment strategy, cooperation, institutional design, moral uncertainty, and decisions affecting future generations. Improving conceptual-reasoning judgment may help humans detect flawed arguments, compare strategic considerations, and oversee AI-generated reasoning in these domains.

This is a differential-capabilities project rather than a general-capability benchmark. The intended outputs are expert evaluation data, rating methods, critique-judgment tests, and human-assistance evidence. The project does not train systems to execute harmful real-world actions and does not equate contested philosophical conclusions with ground truth.

## Prior work and evidence

### LMCA baseline

- 951 rated critiques and 1,458 initial ratings.
- 442 positions with at least one rated critique; 279 with at least two.
- Human raters outperformed the best tested model judgments on the reported comparison.
- A shared 52-critique rating test found that discussion substantially improved agreement.
- The most important difficult disagreements concerned interpretation, context, and the level of detail required for a critique.
- The authors recommended increasing double rating and adding more difficult arguments.

### Metaphilosophy infrastructure

- Live public project site.
- Separate 1,000-critique synthetic library, clearly labeled synthetic and unrated.
- Machine-readable provenance and release contracts with checksum validation.
- Frozen long-term source allocation: 50 LMCA positions, 20 public synthetic positions, and 30 protected public-domain-derived positions.
- Protected-item disclosure rules and an explicit ban on representing incomplete artifacts as expert validated.
- Pilot-first execution and a hard expansion gate requiring pilot evidence plus awarded funding or substantial signed volunteer capacity.

## Pilot 01

Pilot 01 contains:

- 12 public positions across 12 philosophical domains;
- four critiques per position, for 48 critiques;
- two blind initial ratings per critique, for 96 required ratings;
- four to eight calibrated early-career expert raters;
- one to two senior methodological advisers in bounded one-to-three-hour roles;
- a four-week maximum window beginning only after readiness passes.

The pilot is a development and workflow study, not a hidden benchmark. It measures:

- rating and adjudication time;
- initial and post-discussion agreement;
- dimension-level disagreement;
- disagreement causes;
- attrition and replacement demand;
- confounds associated with source, style, length, and domain;
- rater and adviser feedback.

### Pilot results

Complete after the frozen report exists:

- Sample and completion: `[PILOT_COMPLETION_EVIDENCE]`
- Workload: `[PILOT_TIME_EVIDENCE]`
- Agreement: `[PILOT_AGREEMENT_EVIDENCE]`
- Disagreement and adjudication: `[PILOT_ADJUDICATION_EVIDENCE]`
- Operations and attrition: `[PILOT_OPERATIONS_EVIDENCE]`
- Senior methodological feedback: `[SENIOR_FEEDBACK_EVIDENCE]`
- Protocol changes adopted: `[PROTOCOL_CHANGE_EVIDENCE]`

## Proposed funded work

Request: `[REQUEST_AMOUNT]` over `[REQUEST_DURATION]`.

Funding would support:

1. **Data and provenance work** — obtain and audit the canonical LMCA inventory; review source and redistribution status; prepare protected public-domain-derived material.
2. **Critique acquisition** — produce or select four versioned critiques per approved position while controlling authorship, style, length, and attack-family confounds.
3. **Expert validation** — two independent blind ratings per critique, calibrated re-ratings, and triggered adjudication.
4. **Benchmark validation** — human baselines, calibration analysis, weighted pairwise ranking, custom weighted loss, bootstrap uncertainty, source/style confound tests, and contamination documentation.
5. **Human-assistance study** — test whether high-quality critiques improve human conceptual reasoning rather than merely changing persuasion.
6. **Operations and auditability** — secure assignment, exposure, revision, adjudication, and release records; payment administration and required compliance work.
7. **Publication** — release public research artifacts, reproducible analysis, and a protected benchmark evaluation process.

The full budget must be calculated from Pilot 01 observations. Insert: `[PILOT_DERIVED_BUDGET_AND_UNCERTAINTY]`.

## Theory of change

1. Expert raters can agree more reliably about contextualized argument quality than about contested bottom-line conclusions.
2. Multiply rated, difficult, provenance-controlled examples can measure model judgment without pretending to possess philosophical ground truth.
3. Such data can improve critique evaluation, critique generation, debate, and AI-assisted human reasoning.
4. Better AI support for strategic and normative reasoning may improve decisions concerning advanced AI and the long-term future.

Key uncertainties include whether expert agreement remains strong on harder items, whether source and style confounds can be controlled, whether model performance generalizes across domains, and whether better critiques actually improve human judgment. The pilot and proposed human-assistance study are designed to test these uncertainties rather than assume them away.

## Risks and safeguards

- **Benchmark contamination:** protected items and split assignments are not publicly served.
- **Synthetic-data conflation:** public synthetic material remains labeled and excluded from expert-rated totals until newly rated.
- **Rater subjectivity:** blind independent ratings, preserved revisions, disagreement records, and adviser review.
- **Distributional shortcuts:** source, authorship, length, style, and domain diagnostics.
- **Overclaiming:** release gates prohibit representing incomplete work as validated.
- **Budget risk:** full-set launch requires awarded funding or substantial signed volunteer capacity; pending applications do not count.
- **Founder and operational risk:** staged milestones, pilot-derived workload, frozen audit records, and explicit stop/revise conditions.

## Milestones

1. Complete Pilot 01 and senior review.
2. Freeze Rubric v2 revisions and a pilot-derived cost model.
3. Obtain and audit canonical LMCA data and licensing.
4. Freeze exact candidate items and critiques under provenance and exposure controls.
5. Recruit and calibrate the funded expert panel.
6. Complete 800 initial ratings and required adjudication.
7. Validate metrics and confounds.
8. Publish LMCA Release 02 and Metaphilosophy Bench 01.
9. Run the human-assistance experiment.

## Team and advisers

Project owner: **Ellen Sun**.

Confirmed contributors and advisers: `[PENDING; DO NOT NAME WITHOUT CONSENT]`.

Relevant prior experience and execution evidence: `[FOUNDER_AND_TEAM_EVIDENCE]`.

## Funding alternatives and counterfactual

Current committed budget: USD 500 for Pilot 01 limited volunteer honoraria.

Other pending or planned applications: `[PENDING_APPLICATIONS]`.

Without additional funding, Metaphilosophy will complete the small pilot and preserve the full 400-critique programme as blocked. It will not ask senior researchers to absorb bulk annotation or treat vague volunteer interest as capacity.

## Submission gate

Do not submit until:

- Pilot 01 results are frozen;
- at least one senior methodological review is received;
- names and quotations have exact attribution permission;
- the request and cost model use observed pilot data;
- the project’s legal recipient or fiscal arrangement is identified;
- all placeholders are resolved or explicitly marked not applicable.
