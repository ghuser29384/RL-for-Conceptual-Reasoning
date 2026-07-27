# Emergent Ventures application draft — Metaphilosophy

Status: **draft; submission blocked pending Pilot 01 results and senior methodological feedback**  
Application owner: **Ellen Sun**  
Official application: https://mercatus.tfaforms.net/5099527  
Current official limit: proposal no longer than 1,500 words.

## Working title

Metaphilosophy: expert data and benchmarks for AI reasoning without ground truth

## Proposal

Large language models are improving rapidly on tasks with verifiable answers, such as mathematics and programming. Many of the decisions that matter most, however, do not have an accessible ground-truth answer or a generally accepted method of resolution. Questions about AI governance, moral uncertainty, long-term priorities, institutional design, consciousness, and decision theory are often advanced by comparing arguments rather than checking an answer key.

Metaphilosophy is building the data and evaluation infrastructure needed to make AI better at this kind of conceptual reasoning.

The project builds on “A dataset of rated conceptual arguments” (LMCA), which contains positions, critiques, and expert ratings across seven dimensions: centrality, strength, correctness, clarity, dead weight, single issue, and overall quality. The first study found that expert ratings were meaningfully more accurate than the best tested model judgments, but it also identified important limitations: too few critiques were double rated, many positions lacked a useful spread of critique quality, source and style could act as confounders, and difficult disagreements often concerned interpretation and context.

Metaphilosophy is converting those limitations into a rigorous next research programme. The long-term target is a 100-position, 400-critique Hard Set containing 50 LMCA positions, 20 public synthetic positions, and 30 protected public-domain-derived positions. Every critique would receive at least two independent expert ratings, with versioned disagreement review and adjudication.

Before attempting that larger programme, I am running a deliberately small public development pilot:

- 12 positions across 12 philosophical domains;
- four critiques per position, or 48 critiques total;
- two independent blind ratings per critique, or 96 initial ratings;
- four to eight qualified early-career expert raters;
- bounded methodological review from senior researchers with relevant experience;
- measurement of rating time, agreement, disagreement causes, adjudication demand, attrition, and operational reliability.

The pilot is not a hidden benchmark and is not being represented as proof that the full design works. Its purpose is to replace guesses with measurements. The results will determine the realistic cost, staffing model, rubric changes, and adjudication capacity required for the full programme.

### Pilot evidence

Insert only after the result report is frozen:

- Completion and sample: `[PILOT_COMPLETION_EVIDENCE]`
- Median and 90th-percentile rating time: `[PILOT_TIME_EVIDENCE]`
- Initial and post-discussion agreement: `[PILOT_AGREEMENT_EVIDENCE]`
- Disagreement and adjudication demand: `[PILOT_ADJUDICATION_EVIDENCE]`
- Attrition and operational findings: `[PILOT_OPERATIONS_EVIDENCE]`
- Senior methodological feedback, with permission status: `[SENIOR_FEEDBACK_EVIDENCE]`

### What funding would change

The current pilot has only a USD 500 pooled volunteer-honoraria ceiling. That is enough to test a small workflow, but not enough to pay the economic cost of a 400-critique expert-validation programme.

I am seeking `[REQUEST_AMOUNT]` for `[REQUEST_DURATION]` to fund:

1. expert critique rating and calibrated re-rating;
2. senior methodological review and difficult-case adjudication;
3. construction and provenance review of protected public-domain-derived items;
4. audit-ready assignment, exposure, versioning, and label-freeze infrastructure;
5. benchmark validation, including confound and contamination tests;
6. a controlled study of whether high-quality critiques improve human reasoning;
7. publication of reproducible research artifacts and documentation.

The requested budget will be derived from observed pilot workload rather than from a generic hourly assumption. Insert the frozen cost model here: `[PILOT_DERIVED_BUDGET]`.

### Why this could matter

AI systems will increasingly participate in decisions where societies cannot simply reward the system for matching a known answer. A robust dataset of expert judgments about arguments could support better model evaluation, preference learning, critique generation, debate, and human decision support in these domains.

If the method works, its value is not limited to academic philosophy. It could improve how AI assists with AI safety strategy, moral and political trade-offs, long-range governance, and other high-stakes conceptual questions. The project is designed to make progress without pretending that contested conclusions have settled ground truth.

### Execution to date

- The first LMCA paper and expert-rated dataset establish the underlying research direction.
- Metaphilosophy has a live public platform and a separate 1,000-critique synthetic library, explicitly labeled synthetic and unrated.
- Release provenance, checksums, and artifact-class boundaries are enforced in code and CI.
- The full Hard Set source quotas and protected-item rules are frozen.
- The public 48-critique pilot manifest, recruitment workflow, result-report template, funding-evidence gates, and full-set expansion gate are implemented.
- The full programme is explicitly blocked until pilot evidence and either external funding or substantial signed volunteer capacity exist.

### Founder

`[FOUNDER_BIOGRAPHY]`

### Milestones

1. Activate qualified early-career raters and senior methodological advisers.
2. Complete and publish a deidentified Pilot 01 report.
3. Revise Rubric v2 and the rating workflow based on observed errors.
4. Secure the canonical LMCA data and complete source-specific item screening.
5. Pass the external-funding or committed-capacity gate.
6. Run the 400-critique expert-validation programme.
7. Release LMCA Release 02 and Metaphilosophy Bench 01 under frozen evaluation rules.

## Submission gate

Do not submit until:

- the Pilot 01 result report is frozen;
- at least one senior methodological feedback record exists;
- permission is recorded for every attributed name or quotation;
- the request amount and milestones are recalculated from pilot evidence;
- all placeholders are resolved or explicitly marked not applicable.
