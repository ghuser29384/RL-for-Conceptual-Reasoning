# Public attribution and positioning audit — 15 August 2026

## Scope

This audit covers the canonical public release at `www.metaphilosophy.org`, the public source entrypoints on `main`, and the repository checks intended to prevent inaccurate attribution or study-status claims.

The factual baseline comes from:

- Emery Cooper, Caspar Oesterheld, Linh Chi Nguyen, Alexander Kastner, and Ethan Perez, *A dataset of rated conceptual arguments* (`src/assets/LMCA_dataset.pdf` in the source repository; public links resolve to the canonical paper record);
- the canonical homepage and its metadata;
- `/research/`;
- `/arguments/`;
- `/reviewers/`;
- `src/site-entry.mjs`, `src/exact-reference-home.mjs`, and the public editorial verifier.

## Factual boundary

The LMCA paper is external prior work. It reports 951 rated critiques, 1,458 ratings, 442 positions with at least one rated critique, and 478 rated model-written critiques. It defines the seven rating dimensions used by the current Metaphilosophy plan: centrality, strength, correctness, clarity, dead weight, single issue, and overall.

Metaphilosophy currently has a separate public library of 1,000 model-written critiques of 250 positions. Those critiques are synthetic and unrated. The proposed first Metaphilosophy study contains 48 critiques. It has not begun, and zero Metaphilosophy research ratings have been collected.

Metaphilosophy adapts the LMCA method and adds operational controls around assignment, access, versioning, first-rating preservation, and reporting. It does not own or relabel the LMCA ratings.

## Findings

### Canonical production surfaces

The canonical production release correctly states that:

- Metaphilosophy is a research project by Ellen Sun;
- the method is adapted from LMCA;
- the first Metaphilosophy study has not begun;
- the 1,000-item public library is synthetic and unrated;
- the planned study has 48 critiques and zero collected ratings;
- LMCA ratings are prior work and are not Metaphilosophy ratings;
- research-rating applications are closed and there is no assignment to claim.

No corrective production-copy change is required by this audit.

### Repository regression risk

`src/public-home.mjs` contained an older, non-runtime homepage implementation that displayed LMCA counts inside Metaphilosophy-branded interface copy and used claims such as “Teaching AI to do philosophy.” The active root entrypoint imports `src/exact-reference-home.mjs`, and the static build allowlist does not copy `src/public-home.mjs`, so the stale module was not part of the canonical production release. It nevertheless created a future regression risk.

The remediation on this branch replaces that module with a compatibility re-export of `src/exact-reference-home.mjs`, leaving one source of truth for homepage copy.

### Verification gap

The existing public editorial verifier checked authorship, inflated outcome claims, generic marketing language, and several stale phrases. It did not mechanically require the LMCA/Metaphilosophy provenance boundary or the current zero-rating status.

The remediation on this branch adds checks that:

- require the current provenance and status markers on each relevant public surface;
- reject wording that relabels LMCA as a Metaphilosophy dataset or assigns LMCA counts to Metaphilosophy;
- reject claims that the first study has begun or that Metaphilosophy has already collected research ratings;
- require the legacy homepage module to remain a compatibility re-export rather than a second copy implementation.

## Claims that remain prohibited

Until the underlying facts change through an authorized research release, public material must not claim or imply that:

- LMCA is a Metaphilosophy dataset;
- the 951 critiques or 1,458 ratings reported by LMCA were produced by Metaphilosophy;
- the 1,000 synthetic critiques have expert scores or constitute endorsed arguments;
- the first Metaphilosophy study has begun;
- Metaphilosophy has collected research ratings;
- the planned 48-critique study is already a validated benchmark or is sufficient to improve a model materially.

## Deliberate limits of this audit

This pass does not choose a new long-term research positioning, alter the 48-critique study design, authorize participant access, reopen recruitment, merge the branch, or deploy production. Those are separate decisions. The next strategic document should define Metaphilosophy’s independent contribution relative to LMCA and broader conceptual-reasoning benchmarks before the pilot endpoints are revised.
