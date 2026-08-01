# Metaphilosophy pre-outreach product quality gate

**Gate version:** 1  
**Opened:** 2026-08-01  
**Status:** blocked  
**Scope:** public product, public research protocol, synthetic library, closed intake, production availability, and outreach claims.  
**Effect:** no email, adviser contact, participant outreach, public recruitment, or send authorization may occur until every required gate below passes and Ellen Sun records a separate send decision.

## Why this gate exists

Prospective advisers and raters should encounter a credible research product before Metaphilosophy asks for their time. A polished message cannot compensate for a disabled domain, broken route, ambiguous provenance, implied expert results that do not exist, or a protocol that is visible only in internal repository files.

This gate is stricter than the Q-006A preparation authorization. Q-006A permits preparation, research, and screening. It does not permit contact.

## Current hard blocker

On 2026-08-01, requests to `https://www.metaphilosophy.org/` returned:

- HTTP status `402`;
- Vercel error `DEPLOYMENT_DISABLED`; and
- no Metaphilosophy page content.

The public product is therefore unavailable even though the latest recorded production deployment is marked ready. This is an external hosting-account or plan state, not a passing product state. No outreach may begin while the domain returns this response.

## Required gates

| ID | Requirement | Evidence required | Current state |
|---|---|---|---|
| P-01 | Truthful public claims | Homepage distinguishes LMCA prior work, 1,000 unrated synthetic critiques, and a proposed 48-critique pilot with zero production ratings | Implemented; automated verification required |
| P-02 | Complete public navigation | Home, pilot protocol, synthetic library, LMCA paper, and closed intake resolve without blank or misleading workspace routes | Implemented; production verification blocked |
| P-03 | Public protocol quality | `/research/` explains scope, rubric, source boundary, blindness, append-only records, disagreement preservation, analysis restraint, and readiness gates | Implemented; visual and production verification blocked |
| P-04 | Closed-intake integrity | `/contribute` and reviewer routes show that no application, deadline, calibration submission, or paid assignment is open | Implemented; production verification blocked |
| P-05 | Accessibility and responsive structure | Keyboard focus, skip links, semantic headings, responsive layouts, reduced-motion handling where applicable, and mobile-readable navigation | Static checks implemented; rendered audit pending |
| P-06 | Deterministic repository verification | Pre-outreach verifier, adversarial tests, complete Node suite, and static build all pass on the current head | Pending current-head CI |
| P-07 | Production availability | Root, public claims module, `/research/`, `/arguments/`, and `/contribute` return 2xx without a Vercel error | Blocked by `402 DEPLOYMENT_DISABLED` |
| P-08 | Rendered desktop and mobile audit | Screenshots and interaction checks at representative desktop and mobile widths; no overflow, hidden content, broken controls, or illegible text | Blocked until a deployment is available |
| P-09 | Runtime and route safety | No relevant fatal/runtime errors; legacy `?section=rating` route cannot produce a blank page; no public route exposes protected or participant data | Code path repaired; production check pending |
| P-10 | Final owner review | Ellen Sun reviews the exact public deployment, exact recipient slate, exact messages, attachments, sender, follow-up, and reply handling | Not requested yet |

## Automated repository checks

Run:

```bash
node scripts/verify-pre-outreach-public-site.mjs
node --test test/pre-outreach-public-site.test.mjs
npm test
npm run build
```

The verifier must reject at least:

- a public `/contribute` call to action;
- a public `?section=rating` workspace link;
- a blank workspace fallback;
- language implying an existing Metaphilosophy expert-rated corpus;
- removal of the LMCA / synthetic / future-pilot boundary;
- removal of the protocol from the static build; and
- loss of required keyboard or responsive styles.

## Production audit

After the hosting state is restored and the candidate deployment is available, run:

```bash
node scripts/audit-pre-outreach-production.mjs https://www.metaphilosophy.org
```

The audit must pass all required routes and claim markers. A successful repository build is insufficient if production is disabled or stale.

## Rendered audit protocol

At minimum, inspect:

- homepage at approximately 1440 × 1000 and 390 × 844;
- `/research/` at the same widths;
- `/arguments/`, including search, filters, result rendering, pagination, and downloads;
- `/contribute`, confirming the intentionally closed state;
- the legacy `/?section=rating` route, confirming it lands on public status rather than a blank workspace;
- keyboard-only navigation and visible focus;
- mobile navigation, long headings, metric cards, tables, and footer links; and
- browser console and failed network requests.

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

- the exact working production URL;
- the completed quality-gate evidence;
- exact named recipients and role rationales;
- the public professional source for each address;
- exact messages, subject lines, links, and attachments;
- sender identity;
- one permitted follow-up;
- reply-handling owner and disposition process; and
- confirmation that no endorsement, payment, frozen-methodology, or protected-data claim is implied.

**Current conclusion:** do not send emails.
