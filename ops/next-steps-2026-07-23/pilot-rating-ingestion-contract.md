# Pilot rating-ingestion contract

**Status:** implementation template only; non-binding; no real submission or rating data.  
**Does not authorize:** participant work, packet distribution, quality-control acceptance, controlled ingestion, payment, funding submission, or Phase 2.

## The operational gap

The pilot now has three distinct layers:

1. a deterministic private assignment;
2. participant-specific blind task packets and validated submissions; and
3. an append-only rating dataset and analysis engine.

The second layer previously stopped after structural submission validation. It correctly refused to treat a valid packet response as an accepted rating, but it did not define the controlled operation that could later make that transition. Manual copying would create material risks:

- a task token could be mapped to the wrong controlled critique;
- a packet or submission could be altered without detection;
- a submission could be ingested twice;
- a response could be marked accepted without a recorded quality-control decision;
- a rejected response could accidentally enter the analysis dataset;
- an existing initial rating could be overwritten; or
- task-delivery identifiers could leak into the rating dataset or public reporting.

The ingestion layer closes this gap without creating or accepting any real rating.

## Source-derived requirements

The LMCA reference keeps initial raters blind to others’ judgments, uses the seven dimensions centrality, strength, correctness, clarity, dead weight, single issue, and overall, asks raters to verify correctness-sensitive claims where practical, and preserves original ratings when object-level reconsideration later produces a revision.

This ingestion contract preserves those principles. Canonical submission hashing, per-response quality-control dispositions, opaque-token resolution, deterministic rating IDs, event receipts, replay rejection, and public-summary sanitization are Metaphilosophy-specific operational extensions. No LMCA row is copied or exposed.

## Inputs and commitment checks

A proposed ingestion batch supplies:

- the private operator index produced by task-bundle generation;
- between one and six exact participant task packets;
- exactly one validated submission for each supplied packet;
- a versioned ingestion-control record;
- one quality-control decision for every submitted response; and
- optionally, the existing append-only rating dataset.

Before materialization, the engine verifies:

- the operator-index version and programme;
- the canonical operator-index SHA-256;
- the combined six-packet commitment;
- every supplied packet’s participant, packet ID, and packet hash against the operator index;
- every supplied packet body against its own hash;
- every submission through the task-submission validator;
- a canonical, response-order-independent SHA-256 for every submission;
- exact agreement between the operator-index item manifest and the target dataset’s 12 positions and 48 critiques; and
- the complete authorization state for a controlled run.

A mismatch stops the batch. The engine does not substitute another packet, infer a missing mapping, relax a hash check, or partially trust an invalid submission.

## One explicit decision per response

Each submitted response needs a private quality-control decision with:

- a controlled decision ID;
- the canonical submission hash;
- the task critique token;
- one recognized disposition;
- a substantive decision reason;
- a controlled operator ID; and
- a decision timestamp no earlier than submission and no later than ingestion.

The three dispositions are:

### `accepted_materialize`

Create one accepted initial-rating record. This is allowed only when the target dataset does not already contain an initial rating by that participant on that critique.

### `rejected_no_materialization`

Create no rating record. The raw submission and quality-control decision remain separately retained in private controlled storage. Rejection therefore does not delete the participant’s submitted judgment, but the rejected response does not enter the accepted analysis dataset or honorarium-unit count.

A corrected response must arrive in a new canonical submission. It cannot overwrite or mutate the rejected raw submission.

### `already_materialized_noop`

Create no new record. This disposition is valid only when the target dataset already contains an accepted initial rating by that participant on that critique. It supports a later corrected packet submission in which some responses were accepted from an earlier submission and must not be duplicated.

A response with an existing initial rating cannot be re-materialized under a new submission hash. A later object-level change uses the separate, predecessor-linked re-rating contract.

## Accepted rating materialization

For every `accepted_materialize` decision, the engine creates one immutable initial record with:

- a deterministic controlled rating ID;
- the controlled position and critique IDs resolved through the private operator index;
- the controlled participant ID as the rater ID;
- stage `initial` and version 1;
- the exact submitted score vector and auxiliary fields;
- `accepted: true`;
- the validated submission timestamp as `locked_at`;
- no predecessor;
- `operator_assigned: false`;
- no revision reason; and
- provenance linking the submission hash, packet ID and hash, operator-index hash, quality-control decision, and ingestion event.

The quality-control operation does not edit the submitted scores, rationale, confidence, elapsed time, context flag, verification status, or integrity flags.

Task position tokens, task critique tokens, token secrets, operator-index mappings, packet response templates, and other delivery-only fields are prohibited from the rating dataset.

## Append-only and replay rules

The engine rejects:

- an exact canonical submission hash already recorded in the dataset’s ingestion history;
- a second initial rating for the same participant and critique;
- `already_materialized_noop` without an existing accepted initial rating;
- `accepted_materialize` when an initial rating already exists;
- `rejected_no_materialization` when an initial rating already exists and should instead be a no-op;
- duplicate or unknown quality-control decisions;
- an ingestion event that would make the rating dataset invalid; and
- any output containing task-delivery fields.

The target dataset is revalidated through the append-only rating contract after materialization. When it reaches 96 accepted initial ratings, it must additionally pass the complete 12-position, 48-critique, six-rater arithmetic.

## Private ingestion receipt

Every successful batch creates a deterministic ingestion event and private receipt. The event commitment covers:

- the programme and ingestion request;
- the target dataset hash before ingestion;
- the operator-index and combined-packet commitments;
- canonical submission hashes;
- quality-control decision hashes;
- materialized rating IDs;
- aggregate disposition counts;
- versioned authorization records;
- the ingestion timestamp; and
- declarations that funding submission and Phase 2 remain unauthorized.

The receipt also records the target dataset hash after ingestion. It is a private controlled record because it contains participant, packet, submission, decision, and rating identifiers.

## Authorization boundary

Synthetic simulation is allowed only with synthetic packets, submissions, operators, and decisions. Every execution authorization flag remains false, no approval record is supplied, and no controlled output is written.

A real controlled ingestion requires all of the following to be true in a versioned control record:

- Q-006B approved;
- Q-006C approved;
- protected manifest frozen;
- controlled assignment generated;
- task packets generated;
- final readiness signed;
- packet distribution authorized;
- rating work authorized;
- quality control complete;
- this ingestion batch specifically authorized; and
- private controlled storage confirmed.

At least four versioned approval records and a valid approval timestamp are required. The operator index must come from a controlled-generation run. The output file must be outside the repository and use mode `0600`.

Ingestion does not authorize payment, a funding application, publication, or Phase 2.

## Public summary

A synthetic run may publish exact synthetic counts. A controlled run withholds exact submission, response, acceptance, rejection, and no-op counts by default.

The public summary may contain only programme and report versions, mode, aggregate or coarse counts, cryptographic commitments, governance declarations, and privacy declarations. It excludes:

- participant and rater IDs;
- position and critique IDs;
- rating IDs;
- packet IDs and individual packet hashes;
- task tokens;
- individual submission hashes;
- quality-control decision and operator IDs;
- submitted rating content;
- the controlled dataset; and
- the private receipt.

No real submission has been ingested by this implementation work.
