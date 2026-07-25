# Metaphilosophy next-steps execution package

Date opened: 2026-07-23

This directory is the execution record for the programme that follows the first LMCA paper and the synthetic argument-library release. It separates four artifact classes that must never be conflated:

1. **LMCA expert-rated research data** — position–critique pairs with human-expert ratings.
2. **Synthetic argument library** — model-authored, public, and unrated material.
3. **Benchmark material** — protected evaluation items with frozen exposure and scoring rules.
4. **Research-study data** — participant-level records collected under a study-specific protocol.

## Current checkpoint

The public synthetic release is frozen under a checksum-backed contract, and the expired reviewer campaign is closed by default. The project owner has approved mixed Hard Set acquisition option 2: **50 LMCA positions, 20 public-synthetic positions, and 30 newly hidden public-domain-derived positions**.

This freezes source quotas, not exact item IDs. The exact 50 LMCA items remain blocked by the missing canonical row-level dataset and license. The exact 20 public-synthetic items await cross-source coverage and difficulty screening. All 30 protected upstream draft positions are nominated but require independent source-fidelity and ambiguity/scope review before critique production.

The project owner has approved **6 core raters and 2 dedicated adjudicators**, a **four-week / 28-day end-to-end delivery window**, and a **USD 500 limited-honoraria ceiling** divided into a **USD 400 contribution-weighted core-rater completion pool** and a **USD 100 contribution-weighted adjudication reserve**.

The contribution rules are now frozen: accepted initial ratings, operator-assigned substantive re-ratings, required adjudication closures, and final label-snapshot sign-offs each earn one unit. Every accepted unit participates after qualification; there is no percentage-completion threshold. Unused adjudication funds remain unspent. The pools use transparent pro-rata allocation and largest-remainder cent rounding, with proportional release if the project owner approves an early closure.

**Ellen Sun, project owner, is the human operations owner.** Once the complete readiness record is signed, the programme starts at 00:00 UTC on the earliest Monday at least 72 hours later and ends exactly 28 days after that. Accepted units remain credited if a contributor withdraws or is replaced.

The next owner checkpoint concerns the exact panel identities and replacements, participant jurisdictions and payment methods, applicable legal/tax review, and any external-funding application owner and target.

## Files

- `release-audit.md` — human-readable audit findings and remediation status.
- `release-contract.json` — machine-readable public-release invariants.
- `decision-register.json` — decisions made under the user's 90% credence rule.
- `hard-set-source-allocation.json` — machine-readable 50/20/30 source quotas, gates, hashes, and public-disclosure rules.
- `hard-set-source-allocation.md` — human-readable rationale, selection sequence, and explicit non-decisions.
- `panel-honoraria-plan.json` — machine-readable panel, delivery, contribution-unit, payout, operations, attrition, and readiness rules.
- `panel-honoraria-plan.md` — human-readable panel and honoraria operating plan.

Local verification:

```bash
node scripts/verify-program-contracts.mjs
node scripts/verify-hard-set-source-allocation.mjs
node scripts/verify-panel-honoraria-plan.mjs
node scripts/calculate-honoraria.mjs --help
npm test
```

Production verification:

```bash
node scripts/audit-production-release.mjs
```

The production audit is deliberately separate from `npm test`; a transient network failure must not invalidate deterministic repository tests.
