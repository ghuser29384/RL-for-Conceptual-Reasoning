# Metaphilosophy pre-outreach product quality gate

**Gate version:** 4  
**Opened:** 2026-08-01  
**Updated:** 2026-08-02  
**Status:** blocked at P-07 and P-10  
**Scope:** public product, public research protocol, synthetic library, closed intake, production availability, and outreach claims.  
**Effect:** no email, adviser contact, participant outreach, public recruitment, or send authorization may occur until every required gate passes and Ellen Sun records a separate exact-packet send decision.

## Why this gate exists

Prospective advisers and raters should encounter a credible research product before Metaphilosophy asks for their time. A polished message cannot compensate for a disabled domain, broken route, ambiguous provenance, implied expert results that do not exist, or a protocol that is visible only in internal repository files.

This gate is stricter than the Q-006A preparation authorization. Q-006A permits preparation, public professional-source research, and non-final screening. It does not permit contact, calibration work, rating, assignment, distribution, payment, publication of study results, funding submission, or Phase 2.

## Current hard blocker: the project is paused

The Vercel account can create and build new projects, and the exact Metaphilosophy production candidate has completed successfully. The remaining failure is project-local:

- project: `rlhf-conceptual-reasoning`;
- project ID: `prj_2Aq2qYbFw85GBMRLXdfyTIwvEXhZ`;
- project state: `live: false`;
- custom-domain response: HTTP `402` with `DEPLOYMENT_DISABLED`;
- active production candidate: `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC`;
- active candidate state: `READY`, target `production`; and
- required account action: Vercel Dashboard → project Settings → **Resume Service** → **Resume**.

Vercel documents that paused projects must be resumed individually through project settings or the authenticated REST API. Increasing the spend amount or paying the balance does not automatically resume every project. The connected deployment tool can create deployments but does not expose the project-unpause mutation; a Vercel access token is required for the REST endpoint. No token was copied, created, logged, or stored during recovery testing.

The GitHub Vercel workflow now pins the stable, non-secret Vercel team and project IDs directly and fails closed only when the repository lacks `VERCEL_TOKEN`. This remaining credential gap does not prevent the already-built direct production candidate from serving after the project is resumed, but it still blocks reproducible GitHub-controlled deployments.

No outreach may begin while the custom domains are disabled. Resuming service does not itself authorize outreach.

## Exact release candidate

The candidate is bound to:

- Git commit: `23c4a7407aa7dcb6c079ce0a6bf7058c58284154`;
- public release marker: `mp-preoutreach-20260802-r1`;
- production deployment: `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC`;
- deployment URL: `rlhf-conceptual-reasoning-ort6z02tm-ellen-s.vercel.app`;
- CI run: `30736377664`;
- validated public-build artifact: `8829714772`;
- public-build artifact SHA-256: `08693d6d86020aa1fbb1137912918c39344110f14f3b439206a21776806f27ab`;
- rendered-audit artifact: `8829714925`; and
- rendered-audit artifact SHA-256: `4c8ed5a1413c59de3577535504b4f2a62aeb957c3c88cda3d407bdb4f33652f9`.

The production build log proves that Vercel:

1. fetched exact commit `23c4a7407aa7dcb6c079ce0a6bf7058c58284154`;
2. reconstructed the synthetic release from 24 fragments;
3. verified synthetic source SHA-256 `1cb41afee3851c158b520da628a3659c3a387d16c18e6c38f64db1492f59d591`;
4. unpacked 250 positions, 1,000 critiques, and 25 domains;
5. copied only 16 allowlisted public source files;
6. verified release marker `mp-preoutreach-20260802-r1`;
7. excluded the internal research workspace from the public build; and
8. completed deployment successfully.

## Candidate-build evidence

The current candidate checkpoint produced:

- 438 complete Node tests: passed;
- 17 focused public-boundary and dependency tests: passed;
- static public build: passed;
- 12 transitive local stylesheet dependencies resolved and allowlisted;
- internal `src/app.mjs` preserved in the repository but excluded from `dist`;
- eight Playwright desktop/mobile interaction tests: passed;
- seven retained screenshots covering the homepage, protocol, library, and closed intake; and
- independent direct build on a clean Vercel project: passed from the same exact commit and release marker.

Earlier rendered inspection found and verified repairs for two defects:

1. five Epoch stylesheets imported by `epoch-system.css` were missing from the public source allowlist; and
2. the closed mobile navigation could remain visible in full-page evidence despite its control reporting a closed state.

The repaired build verifies the complete stylesheet dependency graph and requires the closed mobile navigation to be visually hidden and non-interactive.

## Required gates

| ID | Requirement | Evidence required | Current state |
|---|---|---|---|
| P-01 | Truthful public claims | Homepage distinguishes LMCA prior work, 1,000 unrated synthetic critiques, and a proposed 48-critique pilot with zero production ratings | **Passed on exact candidate** |
| P-02 | Complete public navigation | Home, pilot protocol, synthetic library, LMCA paper, workspace gate, and closed intake resolve without blank or misleading rating routes | **Passed locally and on clean Vercel candidate; custom-domain recheck blocked** |
| P-03 | Public protocol quality | `/research/` explains scope, rubric, source boundary, blindness, append-only records, disagreement preservation, analysis restraint, and readiness gates | **Passed static, interaction, and manual rendered review** |
| P-04 | Closed-intake integrity | `/contribute` and reviewer routes show that no application, deadline, calibration submission, or paid assignment is open | **Passed static and rendered review** |
| P-05 | Accessibility and responsive structure | Keyboard focus, skip links, semantic headings, responsive layouts, reduced-motion handling, and mobile-readable navigation | **Passed static and rendered review** |
| P-06 | Deterministic repository verification | Pre-outreach verifiers, adversarial tests, complete Node suite, dependency closure, and static build all pass | **Passed: 438/438 tests** |
| P-07 | Production availability | Root, `/research/`, `/arguments/`, `/workspace`, and `/contribute` return 2xx without a hosting-platform error | **Blocked only by project pause; exact production candidate is READY** |
| P-08 | Rendered desktop and mobile audit | Screenshots and interaction checks at representative desktop and mobile widths; no overflow, hidden content, broken controls, or illegible text | **Passed on production-like build; exact custom-domain rerun required after resume** |
| P-09 | Runtime and route safety | No relevant browser/runtime errors; legacy `?section=rating` cannot produce a blank page; public build excludes internal execution source and protected data | **Passed locally; exact custom-domain recheck required after resume** |
| P-10 | Final owner review | Ellen Sun reviews the exact working production deployment, recipient slate, messages, links, sender, follow-up, and reply handling | **Not requested; cannot begin before P-07 and production rechecks** |

## Automated repository checks

Run:

```bash
node scripts/verify-pre-outreach-public-site.mjs
node scripts/verify-public-trust-surface.mjs
node scripts/verify-public-css-dependencies.mjs
node scripts/verify-q006a-public-calibration-screening.mjs
npm test
npm run build
npx playwright test --config=e2e/playwright.config.mjs
```

The checks must reject at least:

- a public `/contribute` recruitment call to action;
- a public `?section=rating` workspace link;
- a blank or misleading workspace route;
- public import or build inclusion of the internal execution application;
- language implying an existing Metaphilosophy expert-rated corpus;
- removal of the LMCA / synthetic / future-pilot boundary;
- any missing transitive public stylesheet;
- a mobile menu that remains visible or interactive while closed;
- removal of required keyboard or reduced-motion styles;
- selection of a publicly exposed LMCA example for calibration or production;
- copied LMCA item text or human rating values in the screening record; and
- any screening record that silently authorizes contact, calibration, freeze, production selection, or Phase 2.

## Exact post-resume procedure

Immediately after **Resume Service** is confirmed:

1. confirm project `live: true` and production deployment `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC` remains active;
2. confirm `www.metaphilosophy.org` and `metaphilosophy.org` no longer return `DEPLOYMENT_DISABLED`;
3. run:

```bash
node scripts/audit-pre-outreach-production.mjs https://www.metaphilosophy.org
```

4. verify the release marker `mp-preoutreach-20260802-r1` on the served root document;
5. verify root, `/research/`, `/arguments/`, `/workspace`, `/reference`, `/contribute`, and the LMCA redirect;
6. verify `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`;
7. rerun the eight Playwright checks against `PUBLIC_SITE_BASE_URL=https://www.metaphilosophy.org`;
8. inspect desktop and mobile screenshots, console errors, page errors, failed requests, and horizontal overflow;
9. query runtime errors and relevant fatal/error logs for the exact production deployment; and
10. update P-07 through P-09 only if all checks pass.

A successful build is insufficient if the custom domain remains disabled, stale, protected unexpectedly, or attached to a different deployment.

## Rendered audit protocol

At minimum, inspect:

- homepage at approximately 1440 × 1000 and 390 × 844;
- `/research/` at the same widths;
- `/arguments/`, including search, filters, result rendering, pagination, and JSONL download;
- `/contribute`, confirming the intentionally closed state;
- `/workspace` and `/reference`, confirming the public readiness gate rather than internal execution UI;
- the legacy `/?section=rating` route, confirming it lands on public status rather than a blank workspace;
- keyboard-only navigation and visible focus;
- mobile menu opening, Escape closure, visual hiding, and pointer blocking;
- long headings, metric cards, tables, and footer links; and
- browser console errors, page errors, request failures, and horizontal overflow.

Record screenshots and a concise finding log. Repair every P0/P1 failure before P-08 may pass.

## Claim rules

Until new data exist, public copy must preserve all of the following:

- LMCA is external prior work, not a Metaphilosophy dataset;
- the 1,000-item Metaphilosophy library is synthetic and unrated;
- the proposed pilot has collected zero production expert ratings;
- the protocol is approved for consultation and non-final screening, not execution;
- the pilot tests workflow feasibility and cannot establish philosophical ground truth, broad model superiority, or sufficient data for material model improvement;
- disagreement may remain unresolved; and
- no favorable result automatically activates Phase 2.

## Send boundary

Passing P-01 through P-09 does not send or authorize an email. It only makes the product eligible for final owner review.

Before any Gmail action, Ellen Sun must receive and separately approve:

- the exact working production URL and commit;
- completed production and rendered-audit evidence;
- exact named recipients and role rationales;
- the public professional source for each address;
- exact messages, subject lines, links, and attachments;
- sender identity;
- one permitted follow-up;
- reply-handling owner and disposition process; and
- confirmation that no endorsement, payment, frozen-methodology, protected-data, or active-recruitment claim is implied.

**Current conclusion:** do not send emails. Resume the existing Vercel project, rerun the exact custom-domain audits, and only then request a separate final owner review.
