# Metaphilosophy Vercel production recovery — 2026-08-02

**Status:** exact production candidate ready; existing project remains paused.  
**Project:** `rlhf-conceptual-reasoning`  
**Project ID:** `prj_2Aq2qYbFw85GBMRLXdfyTIwvEXhZ`  
**Team ID:** `team_ySu6sF3Uho1E1GnJtCQPVEuJ`  
**Operations owner:** Ellen Sun  
**Outreach effect:** none. This record does not authorize email, recruitment, calibration, rating, payment, funding submission, publication of results, or Phase 2.

## Finding

The team account is capable of creating and building new deployments. The outage is isolated to the existing Metaphilosophy project, whose project record remains `live: false`.

Vercel project state and observed behavior:

- custom domains return HTTP `402` and `DEPLOYMENT_DISABLED`;
- new preview and production deployments on the existing project can be created;
- the exact production candidate completed and is `READY`;
- the production domains remain blocked because the project itself is paused; and
- Vercel requires paused projects to be resumed individually through the Dashboard or an authenticated REST call.

The connected Vercel deployment tool does not expose the project-unpause endpoint. Vercel build/deployment OIDC credentials were tested only against the documented unpause endpoint and were correctly rejected as invalid for account-management API access. No token was printed, copied, persisted, or exposed.

## Exact production candidate

- Git commit: `23c4a7407aa7dcb6c079ce0a6bf7058c58284154`
- release marker: `mp-preoutreach-20260802-r1`
- production deployment ID: `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC`
- deployment URL: `rlhf-conceptual-reasoning-ort6z02tm-ellen-s.vercel.app`
- deployment target: `production`
- deployment state: `READY`

Build-log evidence:

- exact commit fetched and checked out;
- `npm ci` completed without vulnerabilities;
- static build completed;
- synthetic release reconstructed from 24 fragments;
- synthetic source SHA-256: `1cb41afee3851c158b520da628a3659c3a387d16c18e6c38f64db1492f59d591`;
- 250 positions, 1,000 critiques, and 25 domains unpacked;
- 16 allowlisted public source files copied;
- release marker verified; and
- deployment completed.

## CI evidence

- workflow run: `30736377664`
- commit: `23c4a7407aa7dcb6c079ce0a6bf7058c58284154`
- complete Node tests: 438 passed, 0 failed
- focused public-boundary/dependency tests: 17 passed, 0 failed
- Playwright tests: 8 passed, 0 failed
- public-dist artifact ID: `8829714772`
- public-dist artifact SHA-256: `08693d6d86020aa1fbb1137912918c39344110f14f3b439206a21776806f27ab`
- rendered-audit artifact ID: `8829714925`
- rendered-audit artifact SHA-256: `4c8ed5a1413c59de3577535504b4f2a62aeb957c3c88cda3d407bdb4f33652f9`

## Recovery action requiring an authenticated account session

In the Vercel Dashboard:

1. select team `ghuser29384's projects`;
2. open project `rlhf-conceptual-reasoning`;
3. open **Settings**;
4. select **Resume Service** in the paused-project banner; and
5. confirm with **Resume**.

The active production deployment should resume without another deployment.

## Mandatory verification immediately after resume

1. Confirm project `live: true`.
2. Confirm `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC` remains the active production deployment.
3. Confirm `www.metaphilosophy.org` and `metaphilosophy.org` return 2xx without `x-vercel-error`.
4. Verify release marker `mp-preoutreach-20260802-r1`.
5. Run `node scripts/audit-pre-outreach-production.mjs https://www.metaphilosophy.org`.
6. Run the eight Playwright tests with `PUBLIC_SITE_BASE_URL=https://www.metaphilosophy.org`.
7. Inspect desktop/mobile screenshots and browser console, page, request-failure, and overflow evidence.
8. Verify the LMCA redirect remains temporary and points to the canonical arXiv PDF.
9. Query runtime error clusters and fatal/error logs for the exact deployment.
10. Update P-07 through P-09 only after all checks pass.

## CI hardening still required

The deployment workflow now treats the Vercel team and project IDs as stable non-secret identifiers and pins them directly. It validates their exact expected values before deployment.

Only one repository secret remains required:

- `VERCEL_TOKEN`.

The token must be added through GitHub's encrypted Actions-secret interface and must not be committed, printed, attached, or copied into an issue or pull-request body. Until it exists, preview and production jobs continue to fail closed at the credential gate. This does not prevent the already-ready direct production candidate from serving once the project is resumed.

## Temporary-resource cleanup

Several isolated Vercel projects were created solely to distinguish team-account availability from the paused-project state and to test bounded recovery paths. They should be removed through the authenticated Dashboard after the production project is restored and verified. Do not remove `rlhf-conceptual-reasoning` or its custom domains.
