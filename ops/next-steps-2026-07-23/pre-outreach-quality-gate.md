# Metaphilosophy pre-outreach product quality gate

**Gate version:** 5  
**Opened:** 2026-08-01  
**Updated:** 2026-08-02  
**Status:** P-01 through P-09 passed; blocked only at P-10 final owner review  
**Scope:** public product, public research protocol, synthetic library, closed intake, production availability, runtime safety, and outreach claims.  
**Effect:** passing this gate makes the exact production product eligible for owner review. It does not authorize email, adviser contact, participant outreach, public recruitment, calibration, rating, payment, publication of study results, funding submission, or Phase 2.

## Production recovery and exact release

At `2026-08-02T07:12Z`, the custom production domains recovered and began serving the exact marked candidate:

- canonical production origin: `https://www.metaphilosophy.org`;
- apex behavior: HTTP `308` to the canonical `www` origin;
- Git source commit: `23c4a7407aa7dcb6c079ce0a6bf7058c58284154`;
- public release marker: `mp-preoutreach-20260802-r1`;
- Vercel project: `rlhf-conceptual-reasoning`;
- Vercel project ID: `prj_2Aq2qYbFw85GBMRLXdfyTIwvEXhZ`;
- production deployment: `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC`;
- deployment target and state: `production`, `READY`; and
- domain aliases: `metaphilosophy.org`, `www.metaphilosophy.org`, the corresponding project aliases, and the existing Good Philosophy and Argument Quality aliases.

The served root document contains the exact release marker. The public domain no longer returns `DEPLOYMENT_DISABLED`.

## Production audit evidence

The exact-domain audit completed successfully on workflow run `30737577369` at branch audit commit `d02c6cd98ac6d39dc60c57d28513c0ae328eb1b3`.

Evidence artifact:

- artifact name: `metaphilosophy-production-audit`;
- artifact ID: `8830142366`;
- artifact SHA-256: `fe14cf83f90c07ae7cddf440f7d168bc22dc6a5aedff6e2c39571895cd607cbc`;
- retention expiry: 2026-09-01; and
- retained files: three machine-readable production reports and nine full-page screenshots.

Automated production results:

- production corpus release audit: passed;
- manifest and exact file byte/hash checks: passed;
- 250 positions, 1,000 critiques, 25 domains, and four critiques per position: verified;
- production availability and public-claim audit: passed;
- root, homepage claims module, `/research/`, `/arguments/`, and `/contribute`: HTTP 200 with all required claim markers;
- `/workspace` and `/reference`: public readiness gate rendered, with no internal execution UI;
- legacy `/?section=rating`: redirected to the truthful public status surface;
- release marker `mp-preoutreach-20260802-r1`: verified;
- apex canonicalization: HTTP 308 to `https://www.metaphilosophy.org/`;
- LMCA route: HTTP 307 temporary redirect to `https://arxiv.org/pdf/2607.27499`;
- internal `src/app.mjs`: HTTP 404, with no internal markers exposed;
- `X-Content-Type-Options: nosniff`: verified;
- `X-Frame-Options: DENY`: verified;
- `Referrer-Policy: strict-origin-when-cross-origin`: verified;
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`: verified;
- Playwright production checks: 13 passed, 0 failed; and
- browser console errors, page errors, failed requests, and horizontal overflow: none in the tested routes and interactions.

Runtime evidence for `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC`:

- grouped runtime error clusters in the two-hour recovery window: none;
- `error` or `fatal` runtime logs: none; and
- no 5xx/runtime failure evidence was found.

Manual rendered review inspected all nine retained production screenshots:

1. homepage desktop;
2. homepage mobile;
3. research protocol desktop;
4. research protocol mobile;
5. synthetic library desktop;
6. synthetic library mobile;
7. closed reviewer intake;
8. `/workspace` readiness gate; and
9. `/reference` readiness gate.

No P0/P1 visual issue, obscured content, broken styling, horizontal overflow, accidental open navigation, internal execution UI, or misleading recruitment state was observed.

## Required gates

| ID | Requirement | Current state |
|---|---|---|
| P-01 | Truthful public claims distinguish LMCA prior work, 1,000 unrated synthetic critiques, and a proposed 48-critique pilot with zero production ratings | **Passed on exact production** |
| P-02 | Complete public navigation across home, protocol, library, LMCA paper, workspace gate, reference gate, and closed intake | **Passed on exact production** |
| P-03 | Public protocol explains scope, rubric, source boundary, blindness, append-only records, disagreement preservation, analysis restraint, and readiness gates | **Passed on exact production** |
| P-04 | `/contribute` and reviewer routes state that no application, deadline, calibration submission, or paid assignment is open | **Passed on exact production** |
| P-05 | Keyboard focus, skip links, semantic headings, responsive layouts, reduced-motion handling, and mobile navigation | **Passed static and production rendered audit** |
| P-06 | Deterministic repository verification, adversarial tests, dependency closure, and static build | **Passed** |
| P-07 | Production availability without hosting-platform error | **Passed** |
| P-08 | Rendered desktop/mobile audit with no P0/P1 defect | **Passed on exact production** |
| P-09 | Runtime and route safety; legacy route safe; internal source excluded; no relevant errors | **Passed on exact production** |
| P-10 | Ellen Sun reviews and decides on the exact Wave-1 recipients, messages, links, sender, follow-up, and reply handling | **Pending owner decision** |

## Remaining CI hardening

The Vercel deployment workflow now pins the stable, non-secret team and project identifiers directly and validates them. It continues to fail closed only because the encrypted GitHub Actions secret `VERCEL_TOKEN` is absent.

This missing automation credential does not invalidate the active production release or P-01 through P-09. It must be added before future GitHub-controlled Vercel deployments are relied upon. Its value must never be committed, printed, attached, or placed in a PR, issue, or email.

## Claim rules

Until new Metaphilosophy ratings exist, public copy must continue to preserve all of the following:

- LMCA is external prior work, not a Metaphilosophy dataset;
- the 1,000-item Metaphilosophy library is synthetic and unrated;
- the proposed pilot has collected zero production expert ratings;
- the protocol is approved for consultation and non-final screening, not execution;
- the pilot tests workflow feasibility and cannot establish philosophical ground truth, broad model superiority, or sufficient data for material model improvement;
- disagreement may remain unresolved; and
- no favorable result automatically activates Phase 2.

## P-10 send boundary

P-01 through P-09 have passed. No email has been sent and passing these gates does not authorize one.

Before any Gmail action, Ellen Sun must receive and separately approve:

- the exact working production URL and source commit;
- the completed production audit evidence;
- exact named Wave-1 recipients and bounded methodological roles;
- the public professional source for each recipient address;
- exact subject lines, messages, links, and attachments;
- sender identity;
- the one permitted follow-up and stopping rule;
- reply-handling owner and disposition process; and
- confirmation that no endorsement, payment, frozen-methodology, protected-data, active-recruitment, or rating-work claim is implied.

**Current conclusion:** production is eligible for P-10 owner review. Do not send emails until Ellen Sun explicitly approves the exact packet.
