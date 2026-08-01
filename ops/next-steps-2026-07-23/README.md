# Metaphilosophy next-steps execution package

Date opened: 2026-07-23  
Pilot-first revision: 2026-07-30  
Controlled-workflow revision: 2026-08-01  
Q-006A approved: 2026-08-01T11:34:32Z

This directory is the execution record for the programme following the first LMCA paper and the public synthetic argument-library release. It keeps four artifact classes distinct:

1. **LMCA expert-rated research data** — position–critique pairs with human-expert ratings.
2. **Synthetic argument library** — model-authored, public, and unrated material.
3. **Benchmark material** — protected evaluation items with frozen exposure and scoring rules.
4. **Research-study data** — participant-level records collected under a study-specific protocol.

## Current checkpoint

The immediate programme is a **48-critique pilot**, not the deferred 400-critique Hard Set. The proposed structure is 12 positions × 4 critiques, with two independent blind initial ratings per critique, for 96 initial ratings. The operating envelope remains six early-career core raters, two dedicated adjudicators, 28 days after final readiness, and a USD 500 limited-honoraria ceiling split into USD 400 for core-rater units and USD 100 for adjudication units.

Q-006A is approved under record `Q006A-APPROVAL-2026-08-01T113432Z`. That approval is deliberately narrow. It authorizes:

- methodological consultation-packet preparation;
- exact methodological-adviser recipient research;
- public, non-protected calibration screening; and
- private non-final pilot-item screening.

It does **not** authorize adviser contact or email, public recruitment, participant outreach or selection, protected-manifest freeze, controlled assignment, task-packet generation or distribution, calibration or rating work, acceptance or ingestion, adjudication, payment, publication, funding submission, or Phase 2.

Readiness gate R-01 is passed. R-02 through R-06 remain blocked, the pilot is not ready to start, and calendar dates remain unset. Q-006B is not yet ready for an owner decision; the authorized preparation and screening work must first produce reviewable evidence.

The LMCA work remains methodological prior art and an external benchmark. The pilot does not reuse LMCA rows because canonical row-level data and a redistribution license have not been supplied and approved. Metaphilosophy’s project-specific contributions are the controlled assignment, packet, ingestion, adjudication, and audit mechanisms described below.

## Q-006A-authorized preparation

The project may now prepare, without contacting anyone:

1. an exact bounded methodological-adviser candidate slate with role rationales and public professional sources;
2. the consultation brief, email drafts, attachments, permitted single follow-up, sender proposal, reply-handling plan, and privacy/claims audit;
3. a screened set of public, non-protected candidates for the proposed two-position, eight-critique calibration packet; and
4. a private non-final candidate-item ledger covering provenance, rights, source fidelity, ambiguity, scope, confounds, attack-family coverage, and exclusion reasons.

No recipient may be contacted until Ellen Sun separately reviews and approves the exact recipients, public address sources, messages, attachments, sender, follow-up, and reply handling. Screening does not freeze a manifest, select participants, create assignments, or expose protected text publicly.

## Deterministic assignment

The anonymous assignment graph has an executable generator. It enumerates all `6! = 720` participant-to-slot mappings, rejects any mapping that violates approved topic coverage, item conflict, prior exposure, calibration, consent, availability, or the frozen graph, and deterministically selects among feasible mappings using a secret-seed hash. It never relaxes constraints merely to force an assignment.

The synthetic fixture has exactly one feasible mapping. Its public summary exposes only commitments and aggregate balance checks. A real controlled run remains blocked pending Q-006B, Q-006C, a frozen manifest, confirmed and calibrated participants, completed conflict and exposure checks, private controlled storage, and a separate versioned assignment authorization.

```bash
node scripts/pilot-assignment-generator.mjs \
  ops/next-steps-2026-07-23/pilot-methodology-recommendations.json \
  test/fixtures/pilot-assignment-synthetic.json
```

The full controlled mapping must remain outside the repository with file mode `0600`. Assignment generation does not authorize task-packet generation, packet distribution, rating work, or pilot start.

## Blind task bundles and submissions

The assignment layer feeds a separate blind task-bundle generator. It produces six participant-specific packets in the synthetic path, each containing four assigned positions and four sibling critiques per position, for sixteen production forms per rater and 96 critique presentations overall.

Controlled position and critique IDs are replaced with participant-specific HMAC-SHA-256 task tokens. Each packet is bound to the selected assignment, protected-manifest commitment, rubric version and hash, exact item text and versions, blindness declarations, response schema, and authorization-false state.

Rater-facing packets omit source and author/model identity, acquisition-judge outputs, provisional quality strata, paired-rater information, aggregate ratings, labels, adjudication status, and controlled item IDs. A private operator index maps opaque tokens back to controlled records.

```bash
node scripts/pilot-task-bundle-generator.mjs \
  ops/next-steps-2026-07-23/pilot-methodology-recommendations.json \
  test/fixtures/pilot-assignment-synthetic.json \
  test/fixtures/pilot-task-content-synthetic.json
```

**Generation is not distribution.** A controlled output directory must remain outside the repository with mode `0700`; packet and operator-index files use mode `0600`. A valid submission must match the exact participant, packet, rubric, and packet hash and contain all sixteen assigned task tokens exactly once. Token substitution, duplicates, omissions, malformed score vectors, and hidden metadata fail closed. Structural validation does not itself create an accepted rating.

Contract and verification files include `pilot-task-bundle-contract.json`, `pilot-task-bundle-contract.md`, `scripts/verify-pilot-task-bundle-contract.mjs`, and `scripts/verify-pilot-task-bundle-integration.mjs`.

## Replay-safe rating ingestion

A separate ingestion layer controls the transition from a validated blind submission to accepted append-only rating records. It never treats structural submission validity as acceptance.

Every response receives one private quality-control disposition:

- `accepted_materialize` creates one accepted version-1 initial rating when no initial rating already exists for that participant and critique;
- `rejected_no_materialization` preserves the raw submission and decision but creates no accepted rating; and
- `already_materialized_noop` creates no new record and is valid only when an accepted initial rating already exists from an earlier submission.

This supports correction without overwrite. A corrected response arrives in a new canonical submission; previously accepted sibling responses become no-ops, while the corrected response may be newly materialized. Exact submission replay, duplicate initial ratings, missing decisions, invalid no-ops, packet tampering, manifest drift, and task-delivery fields in the rating dataset are rejected.

Accepted records preserve submitted scores and auxiliary fields exactly. Quality control records a disposition and reason but does not rewrite the rater’s judgment. Each successful batch creates deterministic rating IDs, an ingestion-event commitment, a private receipt, and before/after dataset hashes.

```bash
node scripts/pilot-rating-ingestion.mjs --help
```

Controlled output remains outside the repository with mode `0600`. Ingestion does not authorize adjudication, payment, publication, funding submission, or Phase 2. Contract and verification files include `pilot-rating-ingestion-contract.json`, `pilot-rating-ingestion-contract.md`, and `scripts/verify-pilot-rating-ingestion-contract.mjs`.

## Controlled adjudication and final snapshot

No real adjudication route is operative. The checked-in policy has zero approved routes and is diagnostic-only. A later operative policy would require Q-006B evidence, a versioned approval record, and an approval timestamp.

The controlled adjudication engine opens one critique-level case only when an approved operative route applies. It preserves both initial ratings and deterministically assigns each case to the least-loaded eligible one of exactly two dedicated adjudicators, subject to topic coverage, conflicts, prior protected-label exposure, and separation from the original raters.

A case may close:

- without rerating;
- after a valid original-rater, operator-assigned, predecessor-linked append-only rerating; or
- explicitly unresolved.

Adjudicators cannot create or edit ratings, impose replacement or consensus scores, designate a winning rater, use majority vote as a label, or pressure convergence. Every operative route receives an object-level disposition and rationale. Closure quality control must be performed by an approved operator distinct from the adjudicator.

The final label snapshot is distribution-preserving. It binds the original ratings, latest accepted ratings, case and resolution records, and residual-disagreement state for every critique. It does not create a synthetic consensus score. Both dedicated adjudicators must sign the same snapshot-body hash, and each sign-off receives independent quality control.

Case generation, case distribution, adjudication work, rerating, resolution acceptance, snapshot generation, snapshot sign-off, adjudication-unit ledger freeze, and payment remain separate gates. Q-006A authorizes none of them.

## Rating analysis and public reporting

The controlled analysis engine validates append-only initial ratings and predecessor-linked object-level reratings; implements the LMCA custom weighted loss and weighted pairwise ranking error; and computes symmetric within-position ordering agreement, dimension gaps, interval-distance agreement diagnostics, rating-time summaries, position-level results, and leave-one-position-out ranges.

The source-derived custom loss uses clarity plus overall when human clarity is below 0.5, and otherwise uses overall, `strength × centrality`, clarity, correctness, dead weight, and single issue with the frozen weights. Strength and centrality are not treated as independent headline targets.

```bash
node scripts/run-pilot-rating-analysis.mjs <rating-dataset.json> [analysis-policy.json]
```

Public reports separate immutable-initial from latest-accepted snapshots and omit controlled dataset, item, rating, and pseudonymous-rater identifiers. Position-level results and uncertainty remain visible; passing a diagnostic threshold cannot automatically activate Phase 2.

## People, honoraria, and expansion

Senior researchers are considered only for bounded methodological advice. Early-career experts perform bulk ratings. No adviser, rater, adjudicator, or replacement has been selected or contacted.

Accepted initial ratings, operator-assigned substantive reratings, required accepted adjudication closures, and required accepted final-snapshot sign-offs each earn one contribution unit under the approved limited-honoraria rules. Calibration, duplicates, rejected work, unassigned work, and avoidable self-correction earn zero units. Candidate unit events do not authorize payment.

The approved 50 LMCA / 20 public-synthetic / 30 newly hidden public-domain-derived allocation remains a possible Phase 2 strategy only. The 100-position / 400-critique expansion is blocked until the pilot is reviewed, methodological concerns are resolved or disclosed, external funding or complete documented qualified-volunteer capacity exists, and the project owner records a new activation decision.

## Principal files

- `decision-register.json` — owner decisions and the current Q-006B evidence-collection state.
- `q-006a-owner-approval.md` — approved Q-006A scope and prohibitions.
- `q-006-decision-packet.md` — Q-006A approved; Q-006B and Q-006C remain open.
- `pilot-readiness-ledger.json` / `.md` — R-01 passed, R-02 through R-06 blocked.
- `pilot-48-plan.json` / `.md` — pilot scope and non-binding methodology.
- `pilot-methodology-recommendations.json` / `.md` — assignment, source-crossing, calibration, review, and small-sample recommendations.
- `methodological-adviser-brief.md` — preparation authorized; not sent.
- `outreach-plan.md` — internal pre-send controls; no email sent.
- `early-career-rater-brief.md` and `dedicated-adjudicator-brief.md` — internal, unsent participant-role briefs.
- `pilot-assignment-contract.*`, `pilot-task-bundle-contract.*`, `pilot-rating-ingestion-contract.*`, `pilot-rating-analysis-contract.*`, and `pilot-adjudication-contract.*` — controlled-workflow contracts.
- `pilot-adjudication-readiness.json` / `.md` — separate post-rating closure gates, all blocked.
- `panel-honoraria-plan.*` — USD 400 / USD 100 limited-honoraria rules.
- `hard-set-source-allocation.*` — deferred Phase 2 allocation.

## Verification

```bash
node scripts/verify-pilot-48-plan.mjs
node scripts/verify-pilot-methodology-recommendations.mjs
node scripts/verify-pilot-readiness-ledger.mjs
node scripts/verify-pilot-assignment-contract.mjs
node scripts/verify-pilot-task-bundle-contract.mjs
node scripts/verify-pilot-task-bundle-integration.mjs
node scripts/verify-pilot-rating-ingestion-contract.mjs
node scripts/verify-pilot-rating-ingestion-integration.mjs
node scripts/verify-pilot-rating-analysis-contract.mjs
node scripts/verify-pilot-public-analysis.mjs
node scripts/verify-pilot-adjudication-readiness.mjs
node scripts/verify-pilot-adjudication-contract.mjs
node scripts/verify-pilot-adjudication-integration.mjs
node scripts/verify-hard-set-source-allocation.mjs
node scripts/verify-panel-honoraria-plan.mjs
node scripts/verify-program-contracts.mjs
npm test
npm run build
```

The production audit remains separate from deterministic repository tests. This draft PR changes research contracts and controlled tooling, not the public-site runtime. It has not been promoted to production.
