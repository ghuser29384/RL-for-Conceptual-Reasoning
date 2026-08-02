# Metaphilosophy pre-outreach product quality gate

**Gate version:** 2  
**Opened:** 2026-08-01  
**Updated:** 2026-08-02  
**Status:** blocked at P-07 and P-10  
**Scope:** public product, public research protocol, synthetic library, closed intake, production availability, and outreach claims.  
**Effect:** no email, adviser contact, participant outreach, public recruitment, or send authorization may occur until every required gate passes and Ellen Sun records a separate exact-packet send decision.

## Why this gate exists

Prospective advisers and raters should encounter a credible research product before Metaphilosophy asks for their time. A polished message cannot compensate for a disabled domain, broken route, ambiguous provenance, implied expert results that do not exist, or a protocol that is visible only in internal repository files.

This gate is stricter than the Q-006A preparation authorization. Q-006A permits preparation, public professional-source research, and non-final screening. It does not permit contact, calibration work, rating, assignment, distribution, payment, publication of study results, funding submission, or Phase 2.

## Current hard blockers

On 2026-08-02, both the public domain and the last known ready Vercel preview returned:

- HTTP status `402`;
- Vercel error `DEPLOYMENT_DISABLED`; and
- no Metaphilosophy page content.

The GitHub Vercel deployment workflow is independently blocked because the repository does not expose the required `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets to the workflow. Repository and rendered-preview quality can therefore pass while production remains unavailable.

No outreach may begin while the public domain is disabled. Restoring hosting or deployment credentials does not itself authorize outreach.

## Evidence checkpoint

The product-quality checkpoint at commit `41165a3d979384050fe41ab0afce5cb197302c9b` produced:

- pre-outreach workflow run `30735256254`: passed;
- 438 complete Node tests: passed;
- 17 focused public-boundary and dependency tests: passed;
- static public build: passed;
- 12 transitive local stylesheet dependencies resolved and allowlisted;
- internal `src/app.mjs` preserved in the repository but excluded from `dist`;
- eight Playwright desktop/mobile interaction tests: passed;
- rendered evidence artifact `8829342441`;
- artifact SHA-256 `fbb1c6d99299c54ab8db02869a1233076414812d8f9eb86f56a099ca39d567f7`; and
- seven retained screenshots covering the homepage, protocol, library, and closed intake.

Manual inspection of the rendered artifact found and then verified the repair of two defects:

1. five Epoch stylesheets imported by `epoch-system.css` were missing from the public source allowlist; and
2. the closed mobile navigation could remain visible in full-page evidence despite its control reporting a closed state.

The repaired build now verifies the complete stylesheet dependency graph and requires the closed mobile navigation to be visually hidden and non-interactive. The final inspected screenshots show the mobile hero rather than the navigation overlay, with no horizontal overflow or broken stylesheet requests.

## Required gates

| ID | Requirement | Evidence required | Current state |
|---|---|---|---|
| P-01 | Truthful public claims | Homepage distinguishes LMCA prior work, 1,000 unrated synthetic critiques, and a proposed 48-critique pilot with zero production ratings | **Passed on candidate build** |
| P-02 | Complete public navigation | Home, pilot protocol, synthetic library, LMCA paper, workspace gate, and closed intake resolve without blank or misleading rating routes | **Passed on candidate build; production verification blocked** |
| P-03 | Public protocol quality | `/research/` explains scope, rubric, source boundary, blindness, append-only records, disagreement preservation, analysis restraint, and readiness gates | **Passed static, interaction, and manual rendered review** |
| P-04 | Closed-intake integrity | `/contribute` and reviewer routes show that no application, deadline, calibration submission, or paid assignment is open | **Passed static and rendered review** |
| P-05 | Accessibility and responsive structure | Keyboard focus, skip links, semantic headings, responsive layouts, reduced-motion handling, and mobile-readable navigation | **Passed static and rendered review** |
| P-06 | Deterministic repository verification | Pre-outreach verifiers, adversarial tests, complete Node suite, dependency closure, and static build all pass | **Passed: 438/438 tests** |
| P-07 | Production availability | Root, `/research/`, `/arguments/`, `/workspace`, and `/contribute` return 2xx without a hosting-platform error | **Blocked: `402 DEPLOYMENT_DISABLED`; deployment secrets absent** |
| P-08 | Rendered desktop and mobile audit | Screenshots and interaction checks at representative desktop and mobile widths; no overflow, hidden content, broken controls, or illegible text | **Passed on production-like local build; artifact inspected** |
| P-09 | Runtime and route safety | No relevant browser/runtime errors; legacy `?section=rating` cannot produce a blank page; public build excludes internal execution source and protected data | **Passed on production-like local build; production recheck blocked** |
| P-10 | Final owner review | Ellen Sun reviews the exact working production deployment, recipient slate, messages, links, sender, follow-up, and reply handling | **Not requested; cannot begin before P-07** |

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

## Production audit

After the Vercel account state is restored, deployment credentials are configured, and the candidate deployment is available, run:

```bash
node scripts/audit-pre-outreach-production.mjs https://www.metaphilosophy.org
```

Then repeat the rendered browser audit against the exact deployment rather than relying only on the production-like local build. The production audit must pass all required routes, claim markers, headers, browser-console checks, and failed-request checks. A successful repository build is insufficient if production is disabled, stale, or attached to a different commit.

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

**Current conclusion:** do not send emails. Restore and verify production first; then request a separate final owner review.
