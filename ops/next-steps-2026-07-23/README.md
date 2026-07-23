# Metaphilosophy next-steps execution package

Date opened: 2026-07-23

This directory is the execution record for the programme that follows the first LMCA paper and the synthetic argument-library release. It separates four artifact classes that must never be conflated:

1. **LMCA expert-rated research data** — position–critique pairs with human-expert ratings.
2. **Synthetic argument library** — model-authored, public, and unrated material.
3. **Benchmark material** — protected evaluation items with frozen exposure and scoring rules.
4. **Research-study data** — participant-level records collected under a study-specific protocol.

## Current checkpoint

The release audit is complete enough to freeze the current public synthetic release and to stop the expired reviewer campaign from accepting new submissions by default. The next programme decision is the source composition of the 400-critique hard-set candidate pool. That decision is intentionally not encoded here because the available options have materially different validity and contamination consequences.

## Files

- `release-audit.md` — human-readable audit findings and remediation status.
- `release-contract.json` — machine-readable public-release invariants.
- `decision-register.json` — decisions made under the user's 90% credence rule.

Local verification:

```bash
node scripts/verify-program-contracts.mjs
```

Production verification:

```bash
node scripts/audit-production-release.mjs
```

The production audit is deliberately separate from `npm test`; a transient network failure must not invalidate deterministic repository tests.
