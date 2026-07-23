# Metaphilosophy next-steps execution package

Date opened: 2026-07-23

This directory is the execution record for the programme that follows the first LMCA paper and the synthetic argument-library release. It separates four artifact classes that must never be conflated:

1. **LMCA expert-rated research data** — position–critique pairs with human-expert ratings.
2. **Synthetic argument library** — model-authored, public, and unrated material.
3. **Benchmark material** — protected evaluation items with frozen exposure and scoring rules.
4. **Research-study data** — participant-level records collected under a study-specific protocol.

## Current checkpoint

The public synthetic release is frozen under a checksum-backed contract, and the expired reviewer campaign is closed by default. The project owner has now approved mixed Hard Set acquisition option 2: **50 LMCA positions, 20 public-synthetic positions, and 30 newly hidden public-domain-derived positions**.

This freezes source quotas, not exact item IDs. The exact 50 LMCA items remain blocked by the missing canonical row-level dataset and license. The exact 20 public-synthetic items await cross-source coverage and difficulty screening. All 30 protected upstream draft positions are nominated but require independent source-fidelity and ambiguity/scope review before critique production.

The next owner decision is core expert-panel size, compensation, and committed capacity for at least 800 initial ratings plus pairwise and adjudication work.

## Files

- `release-audit.md` — human-readable audit findings and remediation status.
- `release-contract.json` — machine-readable public-release invariants.
- `decision-register.json` — decisions made under the user's 90% credence rule.
- `hard-set-source-allocation.json` — machine-readable 50/20/30 source quotas, gates, hashes, and public-disclosure rules.
- `hard-set-source-allocation.md` — human-readable rationale, selection sequence, and explicit non-decisions.

Local verification:

```bash
node scripts/verify-program-contracts.mjs
node scripts/verify-hard-set-source-allocation.mjs
npm test
```

Production verification:

```bash
node scripts/audit-production-release.mjs
```

The production audit is deliberately separate from `npm test`; a transient network failure must not invalidate deterministic repository tests.
