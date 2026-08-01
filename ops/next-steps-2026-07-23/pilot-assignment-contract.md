# Pilot assignment-generation contract

**Status:** implementation template only; non-binding; Q-006B and Q-006C remain pending.  
**Contains:** no real participant, position, critique, conflict, exposure, payment, or assignment record.  
**Does not authorize:** recipient research, outreach, public recruitment, item screening or freezing, participant selection, calibration, rating work, payment, funding submission, or Phase 2.

This contract does not authorize rating work.

## Why this layer is needed

The current preferred design specifies twelve anonymous position slots and twelve distinct anonymous rater pairs. A design table alone does not safely map six named, qualified participants into `R1`–`R6`. Manual substitution could overlook an authorship conflict, prior exposure, topic-competence gap, or repeated-pair imbalance.

The generator therefore treats the anonymous graph as a constraint problem. It either produces a deterministic feasible mapping or stops. It never solves infeasibility by silently dropping a conflict, widening a person's approved topic coverage, or changing the graph.

This is a Metaphilosophy-specific operational extension. The LMCA reference motivates a deliberately multi-rater workflow because its current dataset is highly concentrated in one primary rater. LMCA also hides source during rating while warning that source and writing style may remain inferable. Assignment balance is therefore necessary but not sufficient: candidate-selection and source-cue controls remain separate requirements.

## Controlled inputs

A later controlled run requires exactly:

- twelve frozen position records, one for each approved assignment slot;
- four controlled critique IDs per position;
- six confirmed core-rater records;
- a controlled pseudonymous participant ID for each rater;
- passed qualification, consent, availability, and calibration status;
- the topic families for which each participant is approved;
- item-level conflict and prior-exposure records; and
- a secret assignment seed.

The `approved_topic_families` field closes a gap in the prose eligibility standard. Being generally qualified or competent in two areas does not by itself justify assignment to four different topic families. Every assigned position must fall within the participant's recorded approved coverage. If the six-person roster cannot support the preferred graph under this rule, the project must recruit differently or obtain Q-006B approval for a versioned graph change.

## Deterministic mapping

The algorithm:

1. sorts the six controlled participant IDs;
2. enumerates all `6! = 720` bijections from participants to anonymous slots `R1`–`R6`;
3. rejects every mapping that violates topic competence, conflict, prior exposure, or the frozen position graph;
4. hashes the secret seed plus each remaining canonical mapping; and
5. selects the feasible mapping with the lexicographically smallest hash.

This makes the result deterministic and independent of input-array order while preventing an operator from informally choosing among feasible mappings after seeing their consequences. The audit record commits to the methodology graph, redacted input, seed, and selected mapping through SHA-256 hashes.

## Preserved balance

Under the current preferred six-six source crossing, a valid output has:

- 12 positions and 48 critiques;
- two independent initial raters per position;
- six core raters;
- four positions and sixteen critiques per rater;
- twelve unique rater pairs;
- four distinct partners per rater;
- four distinct topic families per rater; and
- two positions from each eligible source class per rater.

If no mapping satisfies all constraints, the result is **no assignment**. There is no constraint-relaxation fallback.

## Authorization boundary

Synthetic simulation is allowed with `SIM_` identifiers and every approval flag false. It exists only to test determinism, arithmetic, privacy, and failure behavior.

A controlled run remains blocked until its private input records all of the following as true:

- Q-006B approved;
- Q-006C approved;
- protected manifest frozen;
- participants confirmed;
- conflict and exposure checks complete;
- calibration complete;
- controlled assignment specifically authorized; and
- private controlled storage confirmed.

It must also include at least three versioned approval records and a valid approval timestamp. The controlled CLI refuses to print a full assignment to standard output. It requires an output path outside the repository and writes the file with mode `0600`.

Generating an assignment still does **not** authorize rating work. The final readiness signature and start rule remain separate.

## Public-output boundary

A public summary may disclose hashes, balance invariants, authorization state, and whether a feasible controlled mapping exists. It may disclose the exact feasible-mapping count only for a synthetic fixture.

It must not disclose:

- participant, position, or critique IDs;
- the anonymous-slot mapping;
- rater pairs;
- item-level conflicts or exposure;
- the exact controlled feasible-mapping count; or
- any claim that rating work or Phase 2 is authorized.

## Current state

The checked-in contract and fixture are synthetic. No real roster or protected manifest has been supplied, selected, assigned, or exposed. Q-006A remains the immediate owner decision.
