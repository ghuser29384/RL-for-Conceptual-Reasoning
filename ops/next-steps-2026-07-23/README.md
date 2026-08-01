# Metaphilosophy next-steps execution package

Date opened: 2026-07-23  
Pilot-first revision: 2026-07-30  
Blind task-bundle and ingestion revision: 2026-08-01

This directory is the execution record for the programme that follows the first LMCA paper and the synthetic argument-library release. It separates four artifact classes that must never be conflated:

1. **LMCA expert-rated research data** — position–critique pairs with human-expert ratings.
2. **Synthetic argument library** — model-authored, public, and unrated material.
3. **Benchmark material** — protected evaluation items with frozen exposure and scoring rules.
4. **Research-study data** — participant-level records collected under a study-specific protocol.

## Current checkpoint

The public synthetic release is frozen under a checksum-backed contract, and the expired July reviewer campaign remains closed. The immediate programme is now a **48-critique pilot**, not the full 400-critique Hard Set.

The recommended pilot structure is **12 positions × 4 critiques**, with **two independent blind ratings per critique** for **96 required initial ratings**. It uses **6 early-career core raters and 2 dedicated adjudicators**, a **four-week / 28-day end-to-end window**, and the already approved **USD 500 limited-honoraria ceiling**: **USD 400** for the contribution-weighted core-rater pool and **USD 100** for the contribution-weighted adjudication reserve.

The pilot-first direction is owner-approved. The exact 12 × 4 structure, topic/source matrix, candidate-acquisition procedure, balanced assignment template, shared calibration rule, adviser envelope, and numerical adjudication and scale-readiness thresholds remain recommendations pending methodological review and explicit owner approval. The repository must not convert those recommendations into binding policy merely because they appear in the draft protocol.

The LMCA work is treated as methodological prior art and an external benchmark. The pilot does not reuse LMCA rows because the canonical row-level dataset and redistribution license have not been supplied. The pilot instead tests a multi-rater, platform-mediated workflow designed to measure rating time, agreement, adjudication load, item defects, and auditability.

A source-grounded LMCA audit supports a preferred **six-six source crossing**, a **12-pair no-repeat anonymous assignment graph**, an **eight-critique shared public calibration proposal**, review whenever either rater assigns **clarity below 0.5**, and position-level small-sample safeguards. These remain non-binding Q-006A/Q-006B recommendations.

## Deterministic assignment

The anonymous graph has an executable assignment layer. It enumerates all `6! = 720` participant-to-slot mappings, rejects any mapping that violates approved topic coverage, item conflicts, prior exposure, calibration, consent, availability, or frozen graph constraints, and deterministically selects among feasible mappings using a secret-seed hash. It never relaxes constraints to force an assignment. The synthetic fixture deliberately has exactly one feasible mapping.

This closes a protocol gap: baseline eligibility in two philosophical areas is not enough to justify four-topic production assignment. Every assigned topic family must be separately recorded as within the participant's approved coverage. If the confirmed roster cannot support the preferred graph, the result is no assignment until recruitment changes or Q-006B approves a versioned graph change.

The assignment CLI prints only a sanitized public summary in simulation mode:

```bash
node scripts/pilot-assignment-generator.mjs \
  ops/next-steps-2026-07-23/pilot-methodology-recommendations.json \
  test/fixtures/pilot-assignment-synthetic.json
```

A later controlled run requires Q-006B and Q-006C evidence, a frozen manifest, confirmed and calibrated participants, completed conflict/exposure checks, a separate assignment authorization, and private controlled storage. The full output cannot be printed to standard output or written inside the repository; it must be written outside the working tree with file mode `0600`. Generating an assignment does not authorize task-bundle generation, distribution, or ratings.

## Blind task bundles and submissions

The assignment layer feeds a separate blind task-bundle generator. It produces six participant-specific packets, each containing four assigned positions and four sibling critiques per position, for sixteen production-rating forms per core rater and ninety-six critique presentations overall.

The synthetic task-content fixture intentionally contains the metadata most likely to compromise blindness: source class and identity, author or model identity, acquisition-judge records and scores, provisional quality strata, paired-rater information, aggregate ratings, labels, and adjudication status. The generator strips all of it from the rater-facing packet. Controlled position and critique IDs are replaced with participant-specific HMAC-SHA-256 task tokens.

Each packet is cryptographically bound to:

- the selected assignment mapping;
- the frozen protected-manifest hash;
- the rubric version and SHA-256 commitment;
- the exact position and critique text and versions;
- the blind response contract; and
- declarations that the artifact does not authorize distribution, rating work, or Phase 2.

A private operator index maps task tokens back to controlled participant, position, critique, and version records. The raw task-token secret is never placed in a packet or public summary; only its hash is retained. The public output omits participant IDs, controlled item IDs, task tokens, individual bundle IDs or hashes, texts, assignment pairs, and operator-index mappings.

The simulation command prints only a privacy-safe public summary:

```bash
node scripts/pilot-task-bundle-generator.mjs \
  ops/next-steps-2026-07-23/pilot-methodology-recommendations.json \
  test/fixtures/pilot-assignment-synthetic.json \
  test/fixtures/pilot-task-content-synthetic.json
```

A controlled run remains blocked until Q-006B and Q-006C, a frozen manifest, a separately authorized controlled assignment, a separate task-bundle-generation authorization, private storage, versioned approval records, and an approval timestamp. Controlled output must be outside the repository; the directory uses mode `0700`, and six blind bundle files plus the operator index use mode `0600`.

Generation is not distribution. Even a valid private packet cannot be sent or opened for rating until a later distribution control and the final readiness signature pass. The submission validator requires all sixteen assigned task tokens exactly once and binds the participant, bundle, rubric, and bundle hash. It rejects token substitution, duplicates, omissions, invalid score vectors, and leaked source or assignment metadata. It does not itself materialize accepted rating records.

## Replay-safe rating ingestion

A separate ingestion layer now controls the transition from a validated blind submission to accepted append-only rating records. It never treats structural submission validity as acceptance.

Every submitted response needs one private quality-control disposition:

- `accepted_materialize` creates one accepted version-1 initial rating when no initial rating already exists for that participant and critique;
- `rejected_no_materialization` retains the raw submission and quality-control record separately but creates no accepted rating; and
- `already_materialized_noop` creates no record and is valid only when an accepted initial rating already exists from an earlier submission.

This supports correction without overwrite. A rejected response can be corrected only through a new canonical submission. Previously accepted responses in that later packet must use no-op decisions, while the corrected response may be newly materialized. A later object-level change to an accepted rating uses the separate predecessor-linked re-rating contract.

Before ingestion, the engine verifies the canonical operator-index hash, combined packet commitment, individual packet hashes and bodies, submission validity, canonical response-order-independent submission hashes, exact item-manifest agreement with the target dataset, and the full authorization record. It rejects exact submission replay, duplicate initial ratings, missing or duplicate quality-control decisions, invalid no-ops, manifest drift, and any task-delivery field in the rating dataset.

Accepted records retain the exact submitted score vector and auxiliary fields. Quality control records a disposition and reason but does not rewrite the rating. Each accepted record receives deterministic controlled identifiers and provenance linking the canonical submission, packet, operator index, quality-control decision, and ingestion event.

A successful batch produces a private ingestion receipt and before/after dataset commitments. Simulation prints only a sanitized aggregate summary. Controlled output must remain outside the repository with file mode `0600`. Ingestion does not authorize payment, publication, a funding submission, or Phase 2.

```bash
node scripts/pilot-rating-ingestion.mjs --help
```

## Rating, analysis, and public reporting

The repository contains an executable, source-faithful rating-record and analysis layer. The controlled engine validates append-only initial ratings and object-level re-ratings; implements the LMCA custom weighted loss and weighted pairwise ranking error; computes symmetric within-position ordering agreement, dimension gaps, interval-distance agreement diagnostics, rating-time summaries, position-level results, and leave-one-position-out ranges; and keeps every adjudication route inoperative unless an approved policy explicitly names it.

Policy parsing fails closed. Unknown or duplicate routes, unsupported threshold keys, out-of-range values, and approved numerical routes without thresholds are rejected. Any non-empty operative route list additionally requires explicit Q-006B approval evidence, an approval-record identifier, and an approval timestamp. The checked-in policy has zero approved routes.

The canonical reporting command is privacy-safe:

```bash
node scripts/run-pilot-rating-analysis.mjs <rating-dataset.json> [analysis-policy.json]
```

It returns separate immutable-initial and latest-accepted snapshots, plus aggregate revision counts. Controlled dataset, position, critique, rating, and pseudonymous rater identifiers are removed. Position-level results use generated public blocks, and item-level route records are reduced to aggregate counts. CI rejects identifier-bearing output.

Senior researchers are approached only for bounded methodological advice. Early-career experts perform the bulk ratings. Draft adviser, rater, and outreach materials are included for review, but no outreach has been authorized or sent from this package.

The approved **50 LMCA / 20 public-synthetic / 30 newly hidden public-domain-derived** source allocation is preserved only as a possible **Phase 2** strategy. The 100-position / 400-critique programme is blocked until the pilot is reviewed, senior methodological concerns are recorded, external funding or documented complete qualified-volunteer capacity exists, and the project owner records a new activation decision.

The contribution rules remain frozen: accepted initial ratings, operator-assigned substantive re-ratings, required adjudication closures, and final label-snapshot sign-offs each earn one unit. Every accepted unit participates after qualification; there is no percentage-completion threshold. Unused adjudication funds remain unspent. The pools use transparent pro-rata allocation and largest-remainder cent rounding, with proportional release if the project owner approves an early closure.

**Ellen Sun, project owner, is the human operations owner.** Once the complete pilot readiness record is signed, the programme starts at 00:00 UTC on the earliest Monday at least 72 hours later and ends exactly 28 days after that. Accepted units remain credited if a contributor withdraws or is replaced.

The public readiness ledger keeps every execution gate blocked while Q-006A is pending. It contains only empty templates and required-field contracts for methodological feedback, candidate screening, calibration, model baselines, people, payment, assignment, task bundles, and readiness evidence. It contains no recipient addresses, participant names, protected item IDs or text, task tokens, rater packets, labels, assignments, payment data, or execution authorization.

The next owner checkpoint is **Q-006**. The recommended decision packet splits it into Q-006A (approve the consultation design), Q-006B (freeze methodology, protected items, assignment, task-bundle, ingestion, and analysis rules after adviser feedback), and Q-006C (approve people, delivery, operator roles, payment, and dates after expressions of interest).

## Files

- `release-audit.md` — human-readable audit findings and remediation status.
- `release-contract.json` — machine-readable public-release invariants.
- `decision-register.json` — decisions made under the user's 90% credence rule.
- `pilot-48-plan.json` — machine-readable pilot scope, protocol recommendations, governance boundary, deliverables, and expansion gate.
- `pilot-48-plan.md` — human-readable 48-critique pilot protocol.
- `lmca-methodology-audit.md` — source-grounded audit mapping LMCA evidence and limitations to pilot design requirements.
- `pilot-methodology-recommendations.json` — machine-readable non-binding assignment, source-crossing, calibration, adjudication, and analysis recommendation.
- `pilot-methodology-recommendations.md` — human-readable balanced assignment template and small-sample safeguards.
- `pilot-readiness-ledger.json` — machine-readable blocked readiness state, authorization boundaries, empty controlled-record templates, and six execution gates.
- `pilot-readiness-ledger.md` — human-readable readiness and sensitive-data boundary.
- `pilot-assignment-contract.json` — machine-readable deterministic assignment, authorization, competence, conflict, exposure, and privacy contract; contains no real assignment data.
- `pilot-assignment-contract.md` — human-readable assignment-generation and no-constraint-relaxation boundary.
- `pilot-task-bundle-contract.json` — machine-readable blind packet, opaque-token, commitment-chain, submission, privacy, generation, and distribution contract; contains no real task packet.
- `pilot-task-bundle-contract.md` — human-readable blind task-delivery and hash-bound submission boundary.
- `pilot-rating-ingestion-contract.json` — machine-readable submission binding, per-response quality-control, replay, materialization, receipt, privacy, and authorization contract; contains no real submission or rating data.
- `pilot-rating-ingestion-contract.md` — human-readable transition from validated submissions to accepted append-only ratings.
- `pilot-rating-analysis-contract.json` — machine-readable append-only rating, source-derived loss, diagnostic, privacy, and threshold-governance contract; contains no rating data.
- `pilot-rating-analysis-contract.md` — human-readable implementation, strict-policy, snapshot, and public-report boundary.
- `pilot-analysis-policy-template.json` — checked-in diagnostic policy with provisional values and zero approved routes.
- `methodological-adviser-brief.md` — internal bounded-review brief; not sent.
- `early-career-rater-brief.md` — internal role, workload, topic-coverage, blindness, task-packet, calibration, withdrawal, and honoraria brief; not published or sent.
- `outreach-plan.md` — internal recipient, sequencing, email-approval, reply-handling, and audit plan; no email sent.
- `q-006-decision-packet.md` — staged owner decision packet separating consultation design, frozen methodology/items, and people/payment/dates.
- `q-006a-owner-approval.md` — concise pending owner-approval record; silence is explicitly not approval.
- `hard-set-source-allocation.json` — machine-readable deferred Phase 2 50/20/30 source quotas, gates, hashes, and public-disclosure rules.
- `hard-set-source-allocation.md` — human-readable deferred Phase 2 source-allocation rationale and activation boundary.
- `panel-honoraria-plan.json` — machine-readable pilot panel, delivery, contribution-unit, payout, operations, attrition, and readiness rules.
- `panel-honoraria-plan.md` — human-readable pilot panel and honoraria operating plan.

Local verification:

```bash
node scripts/verify-pilot-48-plan.mjs
node scripts/verify-pilot-methodology-recommendations.mjs
node scripts/verify-pilot-readiness-ledger.mjs
node scripts/verify-pilot-assignment-contract.mjs
node scripts/pilot-assignment-generator.mjs --help
node scripts/verify-pilot-task-bundle-contract.mjs
node scripts/verify-pilot-task-bundle-integration.mjs
node scripts/pilot-task-bundle-generator.mjs --help
node scripts/verify-pilot-rating-ingestion-contract.mjs
node scripts/pilot-rating-ingestion.mjs --help
node scripts/verify-pilot-rating-analysis-contract.mjs
node scripts/verify-pilot-public-analysis.mjs
node scripts/pilot-rating-analysis.mjs --help
node scripts/run-pilot-rating-analysis.mjs --help
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
