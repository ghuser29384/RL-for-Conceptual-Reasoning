# H-11 integrated consent and debrief flow — 2026-08-07

**Status:** implementation candidate on the draft Pilot 01 branch; not deployed and not authorized for participant use
**Scope:** synthetic H-11 usability evidence only
**Research-use state:** `research_ratings_authorized=false`

## Product change

Metaphilosophy Review now has an in-product, append-only evidence path for the two human checks that were previously dependent on email and manual notes:

1. **Synthetic-session consent** before the initial assignment is displayed.
2. **Rubric-comprehension and usability debrief** after the initial assignment is submitted or withdrawn.

The consent record uses the approved H-11 statements: scope and terms read, synthetic scores excluded from research, consent to the private audit trail and de-identified internal notes, and voluntary participation with the right to stop.

The debrief records:

- centrality, strength, strength-times-centrality, low-clarity, and immutable-initials explanations;
- six 1–5 workflow-confidence ratings;
- explicit hidden-metadata and non-synthetic-material observations;
- device, browser, recovery path, and duration;
- the most confusing part and one prioritized improvement.

## Integrity and privacy

- Evidence records are immutable and idempotent.
- Records are bound to the authenticated rater and initial synthetic assignment.
- Debrief submission is rejected until the initial assignment is submitted or withdrawn.
- The protected operator workspace can inspect the evidence and receives a visible stop-condition warning.
- Private exports contain the records.
- Public-safe exports continue to omit participant evidence and free text.
- No new database table or research authorization is introduced; records use the existing append-only synthetic event ledger.

## Release boundary

This change invalidates none of the already accepted evidence because it is not yet on the accepted release branch. It must pass the complete contract, repository, build, synthetic lifecycle, disposable PostgreSQL, support-tabletop, and rendered Chromium gates before it can be considered as a successor candidate. It does not authorize contact, access, payment, research ratings, publication, or production deployment.
