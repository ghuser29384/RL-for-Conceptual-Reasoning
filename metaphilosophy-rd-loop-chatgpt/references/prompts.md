# Metaphilosophy R&D Loop Prompts

Use these prompts exactly, replacing `RLHF Conceptual Reasoningv.md` and `RLHF Conceptual Reasoningv+1.md` with the detected current and next numeric filenames. Use `scripts/detect_latest_version.py` before rendering a prompt unless the user explicitly supplies a newer version.

## A. Discovery pass — no edit

Run a no-edit Metaphilosophy discovery pass on RLHF Conceptual Reasoningv.md.

Treat the current document as one historical design proposal, not as the default solution.

Goal:
Find material improvements to Metaphilosophy as a system for producing reliable human/expert-supervised datasets and benchmarks for AI philosophical reasoning, especially critique rating, critique ranking, critique generation, and critique revision.

Do not edit the document.

First:
1. Restate the current platform goal.
2. Design the simplest credible greenfield system for that goal.
3. Identify the minimum scientific core.
4. Identify which current components are essential, safeguards, useful non-core features, R&D hypotheses, accidental complexity, or deletion/consolidation candidates.
5. Identify path-dependency risks.

Then generate at least 8 candidate changes:
- at least 2 deletions or consolidations;
- at least 2 architecture changes;
- at least 2 measurement/benchmark changes;
- at least 1 UX/rater-burden change;
- at least 1 R&D experiment instead of a product requirement.

For each candidate, state:
- proposed change;
- problem it fixes;
- expected benefit;
- possible downside;
- implementation cost;
- measurement-validity risk;
- path-dependency risk;
- reversibility;
- what evidence would confirm or disconfirm it;
- credence that adopting it improves Metaphilosophy rather than worsens it.

Do not edit RLHF Conceptual Reasoningv.md.

## B. Adversarial review pass — no edit

Run an adversarial review of the candidate changes from the previous Metaphilosophy discovery pass.

Do not edit RLHF Conceptual Reasoningv.md.

For each candidate:
1. Steelman the case against adopting it.
2. Identify hidden costs, implementation traps, measurement-validity risks, Goodhart risks, leakage risks, and UX-burden risks.
3. Ask whether an existing component already solves the problem.
4. Ask whether deletion, consolidation, or an experiment would be better than direct adoption.
5. Revise the credence upward, downward, or unchanged.

Then classify each candidate:
A. eligible for direct edit;
B. R&D backlog / experiment only;
C. reject;
D. needs empirical evidence before any decision.

End with a ranked list of at most 3 changes that should proceed to the edit pass.

## C. Decision/edit pass

Run the Metaphilosophy decision/edit pass on RLHF Conceptual Reasoningv.md using the discovery and adversarial-review outputs.

Editing thresholds:
- Directly edit the main spec only if credence >65%.
- For low-risk clarification, simplification, or deletion, >60% is sufficient.
- For major added architecture, data objects, workflows, or governance complexity, require >70%.
- If an idea is promising but uncertain, do not make it a requirement. Add it to Metaphilosophy_R&D_Backlog.md only if adding the backlog item itself has >60% expected value.
- Reject ideas below 40%, unless they reveal an important failure mode.

When editing:
- preserve source blinding, exposure/conflict handling, split governance, label-snapshot immutability, benchmark protection, and auditability;
- do not add ordinary user/rater fields unless clearly justified;
- do not expose hidden/admin metadata to raters;
- do not let AI-generated, user-submitted, or source-derived material enter live rating without review and promotion;
- prefer reuse, deletion, or consolidation over new objects;
- add or update tests/acceptance criteria for every direct edit.

If edits are made, output:
- RLHF Conceptual Reasoningv+1.md

Also update:
- Metaphilosophy_Decision_Log.md
- Metaphilosophy_R&D_Backlog.md, if backlog items are added

After editing, provide:
1. Direct edits made, with credence.
2. R&D backlog items added, with credence that adding them was useful.
3. Rejected ideas.
4. Complexity delta.
5. New/changed tests.
6. Unresolved design questions.

If no edit passes threshold, do not modify the main document.

## D. Pruning-only pass

Run a pruning-only iteration on RLHF Conceptual Reasoningv.md.

Do not add any new feature, object, field, route, test suite, policy, or workflow.

Look only for:
- deletion candidates;
- consolidation candidates;
- duplicated abstractions;
- over-specific implementation detail that belongs in backlog;
- user-facing complexity that can be hidden or removed;
- admin complexity that can be replaced by one reusable abstraction;
- release requirements that should be claim-gated rather than mandatory.

Make a direct edit only if the deletion or consolidation has >60% credence of improving Metaphilosophy without weakening measurement validity, source blinding, split governance, label snapshots, or auditability.

If edits are made, output RLHF Conceptual Reasoningv+1.md.

Also update Metaphilosophy_Decision_Log.md.

After the revised document, provide:
- deletions/consolidations made;
- credence for each;
- risk of each deletion;
- safeguards preserved;
- tests updated.

## F. Path-dependency reset — every 4 successful version increments

Run a path-dependency reset on RLHF Conceptual Reasoningv.md.

Do not edit yet.

Ignore the current document’s structure. Design the simplest credible Metaphilosophy system from first principles for producing reliable expert-rated position–critique datasets and benchmarks for AI philosophical reasoning.

Then compare the greenfield system against the current document.

Classify every major component as:
1. essential scientific core;
2. necessary safeguard;
3. useful but non-core;
4. R&D hypothesis;
5. accidental complexity;
6. deletion/consolidation candidate.

Look especially for:
- duplicated abstractions;
- overgrown governance machinery;
- UI complexity that does not improve labels;
- admin workflows that could be merged;
- benchmark tasks that should be split;
- product features that should instead be experiments;
- release requirements that should be claim-gated rather than mandatory.

Propose a simplification/refactor plan.

Only edit RLHF Conceptual Reasoningv.md if at least one deletion, consolidation, or architectural refactor has >65% credence of improving the platform without weakening measurement validity, blinding, split governance, or auditability.

If edits are made, output RLHF Conceptual Reasoningv+1.md.

If no edits are made, output only the reset analysis and explain why the current design should stand.
