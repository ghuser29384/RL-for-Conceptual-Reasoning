# Metaphilosophy next-steps execution package

Date opened: 2026-07-23  
Pilot-first revision: 2026-07-30

This directory is the execution record for the programme that follows the first LMCA paper and the synthetic argument-library release. It separates four artifact classes that must never be conflated:

1. **LMCA expert-rated research data** — position–critique pairs with human-expert ratings.
2. **Synthetic argument library** — model-authored, public, and unrated material.
3. **Benchmark material** — protected evaluation items with frozen exposure and scoring rules.
4. **Research-study data** — participant-level records collected under a study-specific protocol.

## Current checkpoint

The public synthetic release is frozen under a checksum-backed contract, and the expired July reviewer campaign remains closed. The immediate programme is now a **48-critique pilot**, not the full 400-critique Hard Set.

The recommended pilot structure is **12 positions × 4 critiques**, with **two independent blind ratings per critique** for **96 required initial ratings**. It uses **6 early-career core raters and 2 dedicated adjudicators**, a **four-week / 28-day end-to-end window**, and the already approved **USD 500 limited-honoraria ceiling**: **USD 400** for the contribution-weighted core-rater pool and **USD 100** for the contribution-weighted adjudication reserve.

The pilot-first direction is owner-approved. The exact 12 × 4 structure, topic/source matrix, candidate-acquisition procedure, adviser envelope, and numerical adjudication and scale-readiness thresholds remain recommendations pending methodological review and explicit owner approval. The repository must not convert those recommendations into binding policy merely because they appear in the draft protocol.

The LMCA work is treated as methodological prior art and an external benchmark. The pilot does not reuse LMCA rows because the canonical row-level dataset and redistribution license have not been supplied. The pilot instead tests a multi-rater, platform-mediated workflow designed to measure rating time, agreement, adjudication load, item defects, and auditability.

Senior researchers are approached only for bounded methodological advice. Early-career experts perform the bulk ratings. No outreach has been authorized or sent from this package.

The approved **50 LMCA / 20 public-synthetic / 30 newly hidden public-domain-derived** source allocation is preserved only as a possible **Phase 2** strategy. The 100-position / 400-critique programme is blocked until the pilot is reviewed, senior methodological concerns are recorded, external funding or documented complete qualified-volunteer capacity exists, and the project owner records a new activation decision.

The contribution rules remain frozen: accepted initial ratings, operator-assigned substantive re-ratings, required adjudication closures, and final label-snapshot sign-offs each earn one unit. Every accepted unit participates after qualification; there is no percentage-completion threshold. Unused adjudication funds remain unspent. The pools use transparent pro-rata allocation and largest-remainder cent rounding, with proportional release if the project owner approves an early closure.

**Ellen Sun, project owner, is the human operations owner.** Once the complete pilot readiness record is signed, the programme starts at 00:00 UTC on the earliest Monday at least 72 hours later and ends exactly 28 days after that. Accepted units remain credited if a contributor withdraws or is replaced.

The next owner checkpoint is **Q-006**: approve the recommended pilot structure and thresholds, exact protected items, rater/adjudicator and adviser rosters, participant jurisdictions and payment methods, and the external-funding application owner.

## Files

- `release-audit.md` — human-readable audit findings and remediation status.
- `release-contract.json` — machine-readable public-release invariants.
- `decision-register.json` — decisions made under the user's 90% credence rule.
- `pilot-48-plan.json` — machine-readable pilot scope, protocol recommendations, governance boundary, deliverables, and expansion gate.
- `pilot-48-plan.md` — human-readable 48-critique pilot protocol.
- `hard-set-source-allocation.json` — machine-readable deferred Phase 2 50/20/30 source quotas, gates, hashes, and public-disclosure rules.
- `hard-set-source-allocation.md` — human-readable deferred Phase 2 source-allocation rationale and activation boundary.
- `panel-honoraria-plan.json` — machine-readable pilot panel, delivery, contribution-unit, payout, operations, attrition, and readiness rules.
- `panel-honoraria-plan.md` — human-readable pilot panel and honoraria operating plan.

Local verification:

```bash
node scripts/verify-pilot-48-plan.mjs
node scripts/verify-hard-set-source-allocation.mjs
node scripts/verify-panel-honoraria-plan.mjs
node scripts/verify-program-contracts.mjs
node scripts/calculate-honoraria.mjs --help
npm test
```

Production verification:

```bash
node scripts/audit-production-release.mjs
```

The production audit is deliberately separate from `npm test`; a transient network failure must not invalidate deterministic repository tests.
