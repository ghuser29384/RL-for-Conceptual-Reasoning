# Metaphilosophy research positioning v1

**Status:** Approved by Ellen Sun on 15 August 2026  
**Contract:** `ops/research-positioning-v1.json`

## Positioning

Metaphilosophy is an **auditable expert-judgment system for philosophical and conceptual reasoning**.

Its central research problem is not whether a model can top another general leaderboard. It is whether judgments about arguments in domains without an accessible answer key can be collected in a form that is stable enough to learn from, transparent enough to inspect, and honest about the disagreement that remains.

## Relationship to LMCA

Cooper et al.'s *A dataset of rated conceptual arguments* supplies the substantive starting point. LMCA argues that many conceptual questions lack realistically accessible ground truth and an accepted resolution method, while progress can still occur through the evaluation of contextualized arguments. Its core record is a position, a critique, and ratings of the critique on centrality, strength, correctness, clarity, dead weight, single issue, and overall.

Metaphilosophy adopts that measurement unit and rubric. It does not own, relabel, or merge LMCA's ratings. Its independent contribution is to study and operationalize the **reliability structure of expert judgment**: how ratings vary across people, interpretations, context, time, checking, discussion, revision, and aggregation rules, with every consequential step preserved in an auditable record.

This emphasis follows directly from LMCA's own evidence and limitations. LMCA reports substantial convergence after checking and discussion, but not complete convergence. It identifies interpretation of the position or critique as a major source of difficult disagreement, preserves original ratings when revisions are added, and warns that subjectivity cannot be fully eliminated. Those observations are not side issues for Metaphilosophy; they define the main research object.

## Core research questions

1. How much do qualified experts disagree before discussion when they apply the same rubric to the same contextualized critique?
2. Which disagreements arise from interpretation, strength-centrality allocation, calibration, or substantive philosophical judgment?
3. How do checking, discussion, and revision change judgments while preserving the original blind rating?
4. Which conclusions remain robust when the rater, rater panel, context, timing, or aggregation rule changes?
5. What time, expertise, interface support, and operational controls are required to produce judgments worth scaling?

Here, **judge robustness** means the stability of a reported conclusion under reasonable changes to who supplied the judgments and how those judgments were elicited, interpreted, checked, revised, and aggregated. It does not mean forcing experts into consensus.

## Implication for the 48-critique pilot

The planned 48-critique study is a **measurement and workflow feasibility pilot**. Its primary output should be a robustness and disagreement report, not a model leaderboard.

The pilot should preserve blind initial ratings, separately link later checks and revisions, retain position-level and rater-level variation, distinguish interpretation disputes from mere score differences where possible, and report unresolved disagreements rather than averaging them away. A versioned pilot dataset may be released only if the judgment process proves sufficiently interpretable. Model-evaluation results may be included later as secondary diagnostics, after the human-label foundation has been assessed.

The exact primary and secondary estimands, aggregation rules, uncertainty intervals, decision thresholds, and sample-size adequacy are not frozen by this positioning decision. They require a separate design amendment before any research use. In particular, the study must establish what can be learned from twelve positions, forty-eight critiques, and the proposed rater structure without overstating precision or generalizability.

## Explicit non-goals

Metaphilosophy is not currently trying to:

- build an ordinary LMCA-style model leaderboard as its core direction;
- treat expert ratings as objective ground truth about bottom-line philosophical conclusions;
- claim ownership of LMCA records or counts;
- present forty-eight critiques as an already validated benchmark;
- infer model improvement from a small pilot without an independently justified evaluation design;
- compress disagreement into one pooled agreement number that hides rater, position, or interpretation sensitivity.

## Ordered outputs

The intended order is:

1. an expert-judgment robustness and disagreement report;
2. an auditable, versioned pilot dataset, conditional on adequate measurement quality;
3. secondary model-evaluation diagnostics, conditional on a defensible human-label foundation;
4. only then, a separately authorized decision about a larger dataset, evaluation product, or training application.

This document does not modify public copy, revise the current pilot endpoints, authorize recruitment or participant access, start research, merge code, or deploy production.
