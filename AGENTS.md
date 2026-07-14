# Project guidance for Codex

## Project identity

This repository was historically called **RLHF for Conceptual Reasoning** and is now being treated as the **Metaphilosophy** project. Do not rename files, routes, package identifiers, or public copy merely to normalize that transition. Follow the current specification and explicit user instructions.

## Authority and freshness

Use this file as durable project context, not as proof of present feature completeness, dataset readiness, or deployment state.

For every task, apply this order of authority:

1. The user's current request and any exact brief, specification version, named file, or acceptance criteria.
2. Current repository files, tests, generated output, Git history, deployment configuration, and runtime evidence.
3. The project intent and historical lessons below.

Re-detect the newest specification on every spec-driven task. The latest version found during the prior-account handoff was `RLHF Conceptual Reasoning93.md`, but that is only a historical observation and must not be assumed current.

## Working agreements

- Read the exact specification or named artifact before acting; do not substitute a remembered summary.
- Preserve the full specification objective across turns and interruptions. Do not redefine success around a convenient subset.
- Preserve user-provided names, labels, prompts, and exact visible copy unless asked to revise them.
- Prefer extending the current architecture over a speculative rewrite.
- Inspect existing server readbacks, projections, audit packages, manifests, and tests before adding a supposedly missing backend summary; several apparently missing surfaces historically already existed.
- Make public claims mechanically true. Do not invent completion, evidence, dataset readiness, reviewer status, counts, or deployment state.
- Keep read-only audits non-mutating unless the user explicitly asks for a change.
- Report evidence, pass/fail boundaries, unresolved questions, and remaining risks.
- For commit/push work, inspect branch, remote, upstream divergence, recent history, and exact files; stage narrowly and preserve unrelated user changes.

## Historical platform context

The prior project work included the following. Reverify current files before relying on any item:

- Existing readback surfaces exposed package manifests, operator action items, completion-audit unblockers, participant data-governance projections/readbacks, and public-dataset review packages.
- A historical package manifest reported 7 target gaps, 9 steps, 2 setup steps, and 7 primary steps. These counts are not current unless reproduced from the latest artifacts.
- External JWT handling was changed to support Clerk-style metadata fallback for simple role or assignment claim names while retaining strict behavior for explicitly configured dotted claim paths.
- The exact homepage sentence `Building a dataset to train AI to do better philosophy.` was added and checked-in generated output was rebuilt.
- A GitHub Actions/Vercel workflow separated pull-request Preview deployments from `main` Production deployments while preserving quality gates.
- Public dataset review-package audit support, participant data-governance readbacks and projections, review manifests, release-freeze preflights, operator-evidence review preflights, and RLHF93 audit next-action routing were developed before the account handoff.

A proposed next backend gap—first-class summarization of shared target gaps across multiple ready operator actions—was only a hypothesis. Do not implement it without first proving from the current specification, readbacks, and tests that the capability is genuinely missing.

## Specification and generated-output discipline

- Locate the latest specification version before planning or modifying behavior.
- Trace each requested requirement to current code, tests, data contracts, readbacks, and generated output.
- Distinguish implemented behavior, partial scaffolding, test-only fixtures, and speculative proposals.
- When source changes regenerate checked-in `dist/` or other build artifacts, stage the source and corresponding generated output together.
- Inspect generated diffs for unintended churn rather than accepting them blindly.
- Keep Preview and Production branch behavior explicit. When the requested deliverable is a repository diff or workflow, do not deploy directly.

## Authentication and authorization

For auth-related changes:

- Inspect the current JWT/claim configuration and tests before reusing historical assumptions.
- Preserve strict handling for explicitly configured dotted claim paths.
- Treat metadata fallback for simple claim names as a compatibility path, not permission to weaken authorization.
- Verify role, assignment, operator, reviewer, and participant boundaries through current tests and server readbacks.
- Never report authorization as correct from static code review alone when an integration or runtime test is available.

## Dataset and audit semantics

- Keep dataset review, governance, freeze, operator-action, evidence, and release states explicit.
- Do not collapse submitted, ready, reviewed, approved, blocked, frozen, released, or rejected states.
- Preserve auditability: manifests and readbacks should expose evidence and the next required action, not merely a boolean success label.
- Treat fixture or generated example data as non-production unless the current contract explicitly says otherwise.
- Do not infer that a review package is complete merely because a manifest exists; validate referenced files, hashes, required fields, reviewer state, and release preconditions.

## Browser-assisted workflow continuity

A prior browser-based skill run was blocked before prompt submission by an interstitial. For any similar workflow:

- confirm the target conversation is readable before acting;
- avoid duplicate prompt submissions;
- use only a bounded refresh/retry;
- stop after the same step fails twice and provide the exact manual continuation action;
- resume only from verified saved state.

## Current verification commands

Inspect `package.json` before execution. The current root scripts include:

```bash
npm test
npm run build
npm run smoke:server
npm run check
```

Use focused tests first, then the full relevant check. Run `git diff --check` and inspect generated-output changes before publishing.

## Questions to recheck when relevant

- What is the newest specification after the historically observed version 93?
- Which concepts from the former RLHF framing remain in the current Metaphilosophy scope?
- Do current readbacks already satisfy a proposed backend requirement?
- Are Preview and Production deployments still mapped to the intended branches, environments, and quality gates?
- Is the current auth contract still compatible with the historical JWT fallback behavior without weakening authorization?
