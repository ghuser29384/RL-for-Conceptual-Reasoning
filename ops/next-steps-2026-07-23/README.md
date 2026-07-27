# Metaphilosophy next-steps execution package

Date opened: 2026-07-23

This directory is the execution record for the programme that follows the first LMCA paper and the synthetic argument-library release. It separates four artifact classes that must never be conflated:

1. **LMCA expert-rated research data** — position–critique pairs with human-expert ratings.
2. **Synthetic argument library** — model-authored, public, and unrated material.
3. **Benchmark material** — protected evaluation items with frozen exposure and scoring rules.
4. **Research-study data** — participant-level records collected under a study-specific protocol.

## Current checkpoint

The public synthetic release is frozen under a checksum-backed contract. The long-term Hard Set source allocation remains **50 LMCA positions, 20 public-synthetic positions, and 30 newly hidden public-domain-derived positions**, but its 400-critique bulk-annotation phase is now explicitly deferred.

The current execution target is **Metaphilosophy Pilot 01**:

- 12 public synthetic positions across 12 domains;
- four critiques per position, or 48 critiques;
- two independent blind ratings per critique, or 96 required initial ratings;
- 4–8 calibrated early-career expert raters, targeting six, plus two alternates;
- one to two senior methodological advisers in bounded one-to-three-hour roles;
- a four-week maximum window beginning only after pilot readiness passes;
- the existing USD 500 limited-honoraria ceiling, divided into a USD 400 core-rater pool and USD 100 adjudication reserve.

Senior researchers must not receive an assumed bulk-rating request. Their requested contribution is protocol and Rubric v2 review, 8–12 shared calibration cases, disagreement/adjudication advice, early-career referrals, and—where relevant—guidance on the canonical LMCA data and licensing.

The public early-career expression-of-interest route is `/pilot-raters/`. It is non-binding, uses human qualification decisions, and collects no bank credentials, tax identifiers, or identity documents.

Emergent Ventures and Long-Term Future Fund application drafts now exist, but both are blocked until the Pilot 01 result report and at least one senior methodological feedback record are frozen. Missing results must remain explicit placeholders.

The full 400-critique programme may expand only after Pilot 01 review and either:

1. awarded or legally available external funding sufficient for the pilot-derived workload; or
2. written commitments from qualified volunteers covering at least 800 blind initial rating units, pilot-derived adjudication capacity, and replacement capacity.

Expressions of interest, pending applications, prestige, prior LMCA work, and silence after outreach do not count as committed capacity.

## Key files

- `release-audit.md` — public release audit findings.
- `release-contract.json` — machine-readable public-release invariants.
- `decision-register.json` — decisions made under the user's 90% credence rule.
- `hard-set-source-allocation.json` — long-term 50/20/30 source quotas and source-specific gates.
- `panel-honoraria-plan.json` — previously approved full-set panel and honoraria rules; full-set execution is now subordinate to the Pilot 01 expansion gate.
- `../pilot-01/pilot-contract.json` — Pilot 01 design, panel bounds, budget, readiness, measurement, recruitment, and funding-evidence gates.
- `../pilot-01/pilot-items-public.json` — exact 12-position and 48-critique public development manifest.
- `../pilot-01/senior-methodological-adviser-brief.md` — bounded senior role.
- `../pilot-01/early-career-rater-recruitment-plan.md` — recruitment and qualification workflow.
- `../pilot-01/pilot-result-report-template.md` — empirical result-report contract.
- `../pilot-01/full-hard-set-expansion-gate.json` — mandatory funding or committed-capacity gate.
- `../../funding/emergent-ventures-pilot-evidence-draft.md` — blocked pilot-evidence application draft.
- `../../funding/ltff-pilot-evidence-draft.md` — blocked pilot-evidence application draft.

## Local verification

```bash
node scripts/verify-program-contracts.mjs
node scripts/verify-hard-set-source-allocation.mjs
node scripts/verify-panel-honoraria-plan.mjs
node scripts/verify-pilot-01.mjs
node scripts/calculate-honoraria.mjs --help
node scripts/calculate-pilot-honoraria.mjs --help
npm test
npm run build
```

## Production verification

```bash
node scripts/audit-production-release.mjs
```

The production audit is deliberately separate from `npm test`; a transient network failure must not invalidate deterministic repository tests.
