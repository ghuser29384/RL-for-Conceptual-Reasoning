# Pilot interpretation-cause coding contract

**Status:** synthetic implementation template; no real coding work, participant access, payment, or research authorization.  
**Owner decision:** D2 = A.  
**Machine-readable contract:** `pilot-interpretation-cause-coding-contract.json`  
**Implementation:** `scripts/pilot-interpretation-cause-coding.mjs`

## Purpose

The approved endpoint design treats interpretation-linked disagreement as a primary research object. Triggered-only coding would reveal why selected high-gap cases differ but could not estimate the prevalence of interpretation differences across the complete 48-critique pilot. D2 therefore requires two dedicated adjudicators to independently code all 48 paired interpretation fingerprints.

## Coding packet

Each paired unit is represented by a frozen packet containing:

- the position and critique text;
- the two interpretation fingerprints labelled only `RATER_A` and `RATER_B`;
- the item topic family; and
- a packet and pair commitment.

The packet does not contain rater identity or seniority, numeric score vectors, score gaps, model judgments, acquisition strata, aggregate pilot results, adjudication outcomes, or the other adjudicator's code.

Both adjudicators receive all 48 packets, creating 96 initial coding obligations. Both must be qualified, consented, calibrated, available, conflict-free, unexposed to labels, and approved for all six topic families before a controlled run can be authorized.

## Initial codes

An initial code:

- uses stage `initial_interpretation_cause_code` and version 1;
- references one exact packet and its assigned adjudicator;
- selects one or more approved cause codes;
- includes an object-level rationale;
- attests that every prohibited visibility class remained hidden;
- is locked after the packet opened; and
- is immutable.

`compatible_interpretations` and `unresolved_or_indeterminate` are exclusive classifications and cannot be combined with other codes. Every packet receives exactly one initial code, yielding two distinct adjudicator codes for each of the 48 pairs.

## Reconciliation

A later reconciliation record is separate from both initial codes. It must reference both immutable code IDs exactly and may record:

- a shared classification reached after comparison;
- coding disagreement preserved; or
- unresolved classification.

It cannot delete, replace, overwrite, or select a “winning” initial code, and it cannot impose consensus. The raw dual-code agreement and disagreement remain reportable even after reconciliation.

## Analysis and public output

The controlled analysis reports:

- the complete 48-pair denominator;
- 96 initial code records;
- exact cause-code-set agreement and disagreement;
- cause-code counts by role-masked coder and by pair;
- reconciliation dispositions; and
- unresolved cases before and after reconciliation.

The sanitized public report contains aggregate counts and commitments only. It excludes item, rater, adjudicator, packet, code, and reconciliation identifiers; position and critique text; interpretation fingerprints; rationales; and individual packet hashes.

## Workload and honorarium boundary

D2 creates 96 cause-code records in addition to ordinary disagreement-triggered adjudication. LMCA reports that short position–critique ratings take approximately 5–15 minutes, but it does not report time for a separate interpretation-cause coding task. The implementation therefore does not fabricate a time estimate for D2.

The current USD 100 adjudication reserve is unchanged and has not been shown sufficient. A dry-run-based workload and honorarium re-estimate is required before named adjudicator commitments or payment representations. This contract does not change contribution units or authorize payment.

## Controlled-generation boundary

Synthetic packet generation is allowed with all authorization flags false. A later controlled packet run requires Q-006B, confirmed participants, explicit cause-coding authorization, completed workload/honorarium readback, private controlled storage, three approval records, and a valid timestamp. Full controlled packets are written with mode `0600` outside the repository and are never printed to standard output.

This implementation does not provide those approvals, distribute packets, start coding work, or authorize research.
