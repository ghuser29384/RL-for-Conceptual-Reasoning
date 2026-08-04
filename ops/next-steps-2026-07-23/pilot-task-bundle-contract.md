# Pilot blind task-bundle contract

**Status:** implementation template only; non-binding; Q-006A, Q-006B, and Q-006C remain pending.  
**Contains:** no real participant, protected item, assignment, rating, payment, or outreach record.  
**Does not authorize:** task-bundle generation for real records, task distribution, rating work, outreach, payment, funding submission, or Phase 2.

## Why this layer is needed

The pilot now has a deterministic assignment generator and an append-only rating-analysis contract. A critical operational gap remained between them: an assignment could identify which participant should rate which controlled item, but there was no canonical way to create a rater-facing packet that was simultaneously blind, version-bound, auditable, and safe to submit against.

A manual packet could accidentally expose source or author identity, acquisition-judge scores, a provisional quality stratum, the paired rater, an aggregate rating, a label, or adjudication status. It could also drift from the protected manifest or rubric after assignment. A free-form submission could then be impossible to tie reliably to the exact text and version the rater saw.

The task-bundle layer closes that gap without selecting a real item or participant.

## Source-derived requirements and Metaphilosophy extensions

The LMCA reference rates critiques on centrality, strength, correctness, clarity, dead weight, single issue, and overall. It procedurally hides source and confounding tags during rating, ordinarily presents sibling critiques of one position together, keeps initial ratings independent, and preserves original ratings when object-level reconsideration produces a revision.

This contract preserves those elements. It adds Metaphilosophy-specific controls that are not claims from LMCA:

- participant-specific opaque task tokens instead of controlled position and critique IDs;
- a cryptographic bundle commitment covering the exact item versions, text, rubric, assignment, response schema, and blindness declarations;
- a private operator index that maps task tokens back to controlled records; and
- a validator that accepts an initial submission only when it is bound to the exact bundle and contains all sixteen assigned responses exactly once.

No LMCA row is copied or exposed.

## Blind rater packet

Each of the six eventual core raters receives one controlled packet containing four assigned positions and four sibling critiques for each position, for sixteen production ratings total.

The rater-facing packet includes:

- the exact position and critique text and their frozen versions;
- participant-specific opaque position and critique tokens;
- the frozen rubric version and SHA-256 commitment;
- the protected-manifest and selected-assignment commitments;
- the seven score fields;
- overall rationale, confidence, elapsed time, insufficient-context, verification-status, and item-integrity fields; and
- explicit declarations that distribution, rating work, and Phase 2 are not authorized merely by the file's existence.

It excludes:

- source class and source identity;
- author or model identity;
- acquisition-judge records and scores;
- provisional quality strata;
- the paired rater's identity or ratings;
- aggregate ratings;
- labels; and
- adjudication status.

The synthetic fixture deliberately contains all of those hidden fields. Tests prove that they do not survive into the rater packet.

## Opaque task tokens

A controlled task-token secret is separate from the assignment seed. For each participant and item version, the generator creates an HMAC-SHA-256 token. The same controlled item therefore receives a different token in each participant's packet.

The raw token secret is never placed in a bundle, operator index, or public summary. Only its SHA-256 commitment may be disclosed. The private operator index maps each token back to the controlled participant, position, critique, and version records.

This limits identifier exposure and makes a copied packet harder to correlate with another rater's packet, while retaining a deterministic audit path.

## Commitment chain

The operator index records commitments to:

1. the selected assignment mapping;
2. the frozen protected manifest;
3. the frozen rubric;
4. the task content, with the raw task-token secret redacted;
5. the task-token secret;
6. every individual task-bundle body; and
7. the sorted set of all six task-bundle hashes.

The bundle hash covers the exact text and versions, opaque tokens, blindness declarations, response contract, and authorization-false state. A later text, rubric, or manifest change therefore produces a different bundle commitment.

## Submission validation

An initial submission must:

- identify the same programme, participant, bundle, rubric, and task-bundle hash;
- use stage `initial` and submission version 1;
- contain exactly sixteen responses;
- include every assigned critique token exactly once;
- pair each critique token with its correct position token;
- contain exactly the seven score dimensions, each in the interval from zero to one;
- include a non-empty overall rationale, confidence, positive elapsed time, insufficient-context flag, recognized verification status, and recognized item-integrity flags; and
- contain no source, assignment, paired-rater, aggregate-rating, label, or adjudication metadata.

This validator does not itself create rating records. A later controlled ingestion layer must use the private operator index to materialize append-only initial-rating records. That separation prevents a structurally valid but unauthorized task submission from silently becoming accepted production data.

## Authorization boundary

Synthetic simulation is allowed with synthetic identifiers and every approval flag false. The simulation can generate full bundles in memory for tests, but its command-line interface prints only a privacy-safe public summary.

Controlled task generation remains blocked until the private inputs record:

- Q-006B approval;
- Q-006C approval;
- a frozen protected manifest;
- a separately authorized controlled assignment;
- a separately authorized task-bundle generation action;
- private controlled storage;
- at least three versioned approval records; and
- a valid approval timestamp.

A controlled output directory must be outside the repository, use directory mode `0700`, and contain six bundle files plus the operator index with file mode `0600`.

Generating these files still does **not** authorize distribution or rating work. Distribution requires a later, separate control tied to final readiness. The final readiness signature and start rule remain unchanged.

## Public-output boundary

The public summary may contain aggregate bundle arithmetic, blindness declarations, authorization-false state, and cryptographic commitments. It may not contain:

- participant IDs;
- controlled position or critique IDs;
- task tokens;
- individual bundle IDs or hashes;
- position or critique text;
- assignment pairs; or
- operator-index mappings.

The checked-in fixture and contract are synthetic. No real task packet has been generated, distributed, or rated.
