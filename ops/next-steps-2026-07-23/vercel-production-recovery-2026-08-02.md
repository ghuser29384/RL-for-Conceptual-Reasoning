# Metaphilosophy Vercel production recovery — 2026-08-02

**Status:** recovered and audited on the public custom domains.  
**Project:** `rlhf-conceptual-reasoning`  
**Project ID:** `prj_2Aq2qYbFw85GBMRLXdfyTIwvEXhZ`  
**Team ID:** `team_ySu6sF3Uho1E1GnJtCQPVEuJ`  
**Operations owner:** Ellen Sun  
**Outreach effect:** none. Recovery does not authorize email, recruitment, calibration, rating, payment, funding submission, publication of results, or Phase 2.

## Incident and recovery

The incident initially presented as:

- HTTP `402` on `metaphilosophy.org` and `www.metaphilosophy.org`;
- `x-vercel-error: DEPLOYMENT_DISABLED`;
- project-local deployment queueing; and
- project metadata reporting `live: false`.

The team account itself remained capable of creating and building new projects, so the failure was isolated to the existing Metaphilosophy project rather than a continuing account-wide build outage.

An exact production candidate was built successfully while the domains were unavailable. At `2026-08-02T07:12Z`, the production data plane recovered and began serving that candidate on the custom domains. Subsequent custom-domain requests returned HTTP 200 with no Vercel error. The project metadata endpoint continued to lag by reporting `live: false`; the served custom-domain response, exact release marker, deployment alias set, and end-to-end production audit are treated as the operational source of truth.

## Exact production release

- source commit: `23c4a7407aa7dcb6c079ce0a6bf7058c58284154`;
- release marker: `mp-preoutreach-20260802-r1`;
- production deployment ID: `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC`;
- deployment URL: `rlhf-conceptual-reasoning-ort6z02tm-ellen-s.vercel.app`;
- deployment target: `production`;
- deployment state: `READY`;
- canonical origin: `https://www.metaphilosophy.org`; and
- apex origin: HTTP 308 redirect to the canonical origin.

Build-log evidence:

- exact commit fetched and checked out;
- `npm ci` completed without vulnerabilities;
- static build completed;
- synthetic release reconstructed from 24 fragments;
- synthetic source SHA-256: `1cb41afee3851c158b520da628a3659c3a387d16c18e6c38f64db1492f59d591`;
- 250 positions, 1,000 critiques, and 25 domains unpacked;
- 16 allowlisted public source files copied;
- release marker verified;
- internal workspace excluded from the public build; and
- deployment completed.

## Candidate-build evidence

Workflow run `30736377664` verified the pre-deployment candidate:

- complete Node tests: 438 passed, 0 failed;
- focused public-boundary/dependency tests: 17 passed, 0 failed;
- production-like Playwright tests: 8 passed, 0 failed;
- public-dist artifact ID: `8829714772`;
- public-dist artifact SHA-256: `08693d6d86020aa1fbb1137912918c39344110f14f3b439206a21776806f27ab`;
- rendered-audit artifact ID: `8829714925`; and
- rendered-audit artifact SHA-256: `4c8ed5a1413c59de3577535504b4f2a62aeb957c3c88cda3d407bdb4f33652f9`.

## Exact-domain production evidence

Workflow run `30737577369` audited the recovered public domains:

- audit commit: `d02c6cd98ac6d39dc60c57d28513c0ae328eb1b3`;
- production audit artifact ID: `8830142366`;
- production audit artifact SHA-256: `fe14cf83f90c07ae7cddf440f7d168bc22dc6a5aedff6e2c39571895cd607cbc`;
- artifact retention expiry: 2026-09-01;
- production corpus release audit: passed;
- route and public-claim audit: passed;
- release marker and canonical-domain audit: passed;
- security-header audit: passed;
- LMCA redirect audit: passed;
- internal-source exclusion audit: passed;
- browser production checks: 13 passed, 0 failed; and
- manual inspection of nine retained production screenshots: no P0/P1 defect.

Verified production behavior:

- root: HTTP 200;
- homepage claims module: HTTP 200;
- `/research/`: HTTP 200;
- `/arguments/`: HTTP 200;
- `/contribute`: HTTP 200 and intentionally closed;
- `/workspace`: public readiness gate, no internal execution UI;
- `/reference`: public readiness gate, no internal execution UI;
- legacy `/?section=rating`: truthful public status surface;
- `metaphilosophy.org`: HTTP 308 to `www.metaphilosophy.org`;
- LMCA route: HTTP 307 to `https://arxiv.org/pdf/2607.27499`;
- internal `/src/app.mjs`: HTTP 404;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`; and
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

Runtime monitoring for exact deployment `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC` found:

- no grouped runtime error clusters in the recovery window;
- no `error` or `fatal` runtime logs; and
- no evidence of a 5xx application failure.

## Remaining CI hardening

The GitHub deployment workflow pins and validates the stable, non-secret Vercel team and project identifiers. Only one encrypted repository secret remains required:

- `VERCEL_TOKEN`.

The absence of this token does not invalidate the active production release or the completed production audit. It does mean future GitHub-controlled Vercel deployment jobs remain deliberately blocked at the credential gate.

The token must be added only through GitHub's encrypted Actions-secret interface. Its value must not be committed, printed, attached, or placed in a PR, issue, chat message, or email.

## Temporary-resource cleanup

Several isolated Vercel projects were created solely to distinguish account availability from the paused-project state and test bounded recovery paths. The connected Vercel tool does not expose project deletion. These disposable projects should be removed through the authenticated Vercel Dashboard after preserving this incident record. Do not remove `rlhf-conceptual-reasoning` or any of its production domains.

## Closure

Production recovery gates P-07 through P-09 are passed. The next process gate is P-10: Ellen Sun's separate review of the exact Wave-1 methodological-adviser outreach packet. No Gmail action is authorized by this recovery record.
