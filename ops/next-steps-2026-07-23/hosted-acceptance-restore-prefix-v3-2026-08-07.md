# Hosted acceptance restore-prefix V3 — 2026-08-07

**Scope:** protected synthetic hosted acceptance only  
**Research-use state:** `research_ratings_authorized=false`

## Defect

The schema-v4 restore drill was intentionally append-only and designed as a one-time independent restore target. After the first accepted hosted release, later exact-release builds failed before exercising the new product because the retained restore ledger was no longer empty.

Deleting or resetting that evidence would weaken the audit trail. Reusing it without proving continuity would also be insufficient.

## V3 resolution

Hosted acceptance now has two fail-closed restore modes:

1. **Empty target:** perform the original exact independent restore of the complete primary chain.
2. **Retained prior restore:** prove that the retained independently restored chain is byte-for-byte the exact prefix of the current fully verified primary chain; require a prior passing exact-release report with the same prefix count and head hash; require a strict non-empty append-only suffix; and retain the current full backup and chain head in the new exact-release report.

The current primary chain is still fully rehashed and read back from the hosted database. The prior restore target remains immutable. No evidence is deleted or overwritten.

## Boundary

This change affects only hosted synthetic acceptance infrastructure. It does not issue participant access, create an H-11 participant identity, send outreach, authorize research ratings, change production, pass H-11, or sign H-12.
