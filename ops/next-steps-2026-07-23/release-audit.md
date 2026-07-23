# Public release audit — 2026-07-23

## Scope

The audit covered the canonical GitHub repository, current Vercel production deployment, public website routes, the synthetic release manifest, reviewer-intake aggregate status, and the LMCA paper supplied for this programme.

## Verified

### Canonical source and deployment

- Repository: `ghuser29384/RL-for-Conceptual-Reasoning`.
- Audited main commit: `f147f2e0159dc17aeda987b572b0a3a53d6e9f96`.
- Audited production deployment: `dpl_aft61xsr7PnQ4wP7v7cwuFvrAv2o`, state `READY`, target `production`.
- The newest non-production deployment observed during the audit was in `ERROR`; it does not replace the ready production deployment.

### Synthetic release 01

The public manifest reports:

- release ID `synthetic-1000-v1`;
- 1,000 critique records;
- 250 positions;
- exactly four critiques per position;
- 25 domains;
- 24 archived source chunks;
- canonical source SHA-256 `1cb41afee3851c158b520da628a3659c3a387d16c18e6c38f64db1492f59d591`.

The public library states that the collection is synthetic and unrated and must not be included in LMCA rating totals. This boundary is retained as a release invariant.

### Reviewer intake

The July 2026 intake page still advertised a July 16 deadline on July 23. Its aggregate endpoint reported:

- applications: 0;
- completed calibrations: 0;
- qualified reviewers: 0.

The repository change in this execution package therefore closes POST intake by default and routes public intake URLs to a closed-state page. Reopening requires an explicit environment flag plus approved dates, budget, and a human qualification owner.

## Gaps

1. GitHub has no numbered release objects, despite the product policy that releases are numbered rather than repeatedly renamed.
2. The expert-rated LMCA data described in the paper is not yet frozen as a numbered repository release with a canonical downloadable artifact, manifest, and checksum set.
3. No protected Bench 01 test set is frozen.
4. No completed 400-critique expert hard set exists.
5. No human-utility study observations exist.
6. The open draft reviewer-recruitment PR contains unique operational-interface files and should not be closed until those files are either retained or explicitly rejected.

## Remediation completed

- Added and merged a machine-readable public-release contract.
- Added deterministic repository validation.
- Added a networked production audit that verifies checksums and corpus invariants.
- Added a closed-state reviewer page and an API-level default closure gate.
- Recorded every programme decision made so far with credence at or above 0.90.
- Recorded the project owner's Hard Set allocation: 50 LMCA / 20 public synthetic / 30 newly hidden positions.
- Added a machine validator that prevents quota drift and public exposure of protected item identifiers or text.

## Current checkpoint

The position-source allocation is resolved. Exact item IDs remain unfrozen: the 50 LMCA positions require the canonical row-level dataset and license; the 20 public-synthetic positions require cross-source coverage and difficulty screening; and all 30 nominated protected position extractions require independent source-fidelity and ambiguity/scope review before critique production.

The next owner decision is core expert-panel size, compensation, and committed capacity for at least 800 initial ratings plus pairwise and adjudication work.
