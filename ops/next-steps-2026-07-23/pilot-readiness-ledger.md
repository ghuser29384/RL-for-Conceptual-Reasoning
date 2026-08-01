# Metaphilosophy pilot readiness ledger

**Status:** blocked.  
**Current decision:** Q-006A remains pending.  
**Effect of this file:** none by itself. It does not authorize outreach, recruitment, participant selection, controlled assignment generation, controlled task-bundle generation or distribution, protected-item screening or freezing, calibration, rating work, payment, funding submission, or Phase 2 activation.

This is the public companion to `pilot-readiness-ledger.json`. Sensitive recipient, participant, protected-item, conflict, exposure, assignment, task-token, task-bundle, operator-index, and administrative records remain in private controlled storage.

## Current authorization state

| Activity | Authorized? |
|---|---:|
| Q-006A consultation design approval | No — owner decision pending |
| Methodological-adviser recipient research | No |
| Methodological-adviser email | No |
| Public recruitment | No |
| Early-career rater or adjudicator outreach | No |
| Non-final protected-item screening | No |
| Protected manifest freeze | No |
| Participant selection | No |
| Controlled assignment generation | No |
| Controlled blind task-bundle generation | No |
| Task-bundle distribution | No |
| Calibration or rating work | No |
| Payment commitment | No |
| LTFF or Emergent Ventures submission | No |
| 400-critique Phase 2 activation | No |

## Records prepared in template form

### Methodological feedback

The private feedback log will record a controlled adviser identifier, the owner-approved message version, substantive comments, protocol versions before and after the feedback, and one of four dispositions:

- adopted before launch;
- adopted with modification;
- not adopted, with rationale; or
- unresolved and disclosed.

No public name or quotation may be attributed without separate permission. Participation must not be presented as endorsement.

### Candidate screening

The private candidate ledger will record provenance, rights, source fidelity, ambiguity and scope review, critique-count arithmetic, length and formatting cues, acquisition-judge hashes, attack-family coverage, source-style cue risk, inclusion or exclusion reasons, conflicts, and prior exposure.

The public repository may later contain only aggregate counts and approved hashes. It must not contain exact protected position or critique IDs, text, labels, assignments, task tokens, rater packets, or exposure records.

### Calibration

The current proposal remains two public, non-protected positions with four critiques each. All six core raters and both adjudicators would independently rate the eight examples. The exact examples and qualification rule remain pending methodological review and owner approval.

Calibration is excluded from production metrics and currently earns zero honorarium units. That burden must be disclosed before participant acceptance.

### Model baselines

Before any protected human rating, a private reproducibility record must freeze provider, exact model version, prompt and rubric versions, reasoning or effort setting, sampling parameters, retry policy, output parser, invalid-output rule, request date, API environment, and raw-response retention and hashing policy.

Model judgments may be used as acquisition signals or comparison baselines. They are not human labels and do not adjudicate human disagreements.

### People and topic coverage

The private readiness record must eventually cover six core raters, two dedicated adjudicators, and replacement coverage where feasible. It separately records qualification, approved topic families, consent, conflicts, prior exposure, calibration, availability, and administrative readiness.

Baseline competence in two areas does not make a participant eligible for every position. Each assigned topic family must appear in that participant's approved coverage record.

### Controlled assignment

Participant selection and assignment generation are separate gates. A controlled mapping may be generated only after Q-006B and Q-006C, a frozen private manifest, passed calibration, completed conflict and exposure checks, confirmed topic coverage, private controlled storage, and a separate versioned assignment authorization.

The deterministic generator enumerates all participant-to-anonymous-slot mappings and rejects any mapping that violates topic competence, conflict, prior exposure, or the frozen balance graph. If none is feasible, it produces no assignment. It may not relax a constraint or make an undocumented manual swap.

The full mapping remains a private controlled record outside the repository. Only hashes and a privacy-safe summary may later be published. Assignment generation does not authorize task-bundle generation, distribution, rating work, or the pilot start.

### Controlled blind task bundles

After a controlled assignment exists, a second separately authorized operation may generate six participant-specific blind packets. Each packet contains four assigned positions and four sibling critiques per position, for sixteen production-rating forms.

The task-bundle generator binds each packet to the selected assignment, protected-manifest hash, rubric version and hash, exact text and item versions, blindness declarations, and response schema. Controlled position and critique IDs are replaced with participant-specific HMAC task tokens. A private operator index maps those tokens back to controlled records.

Rater packets must omit source class and identity, author or model identity, acquisition-judge outputs, provisional quality strata, the paired rater's identity or ratings, aggregate ratings, labels, and adjudication status. The public summary contains only aggregate arithmetic, privacy declarations, authorization-false state, and cryptographic commitments.

Controlled task generation requires Q-006B, Q-006C, the frozen manifest, a separately authorized controlled assignment, a separate task-bundle-generation authorization, private storage, versioned approvals, and an approval timestamp. The output directory remains outside the repository with mode `0700`; bundle files and the operator index use mode `0600`.

Generating private task files does not authorize distribution. Distribution remains a separate control tied to final readiness and the approved delivery process. A valid submission must match the exact bundle hash, participant, rubric, and all sixteen assigned task tokens; the submission validator does not itself create accepted rating records.

## Six readiness gates

1. **Q-006A:** consultation and non-final screening design approved.
2. **Methodological feedback:** bounded feedback collected and dispositioned.
3. **Q-006B:** methodology, calibration, analysis, deterministic assignment, blind task-bundle, and controlled item-manifest rules approved.
4. **Q-006C:** people, topic coverage, administrative readiness, outreach, task distribution, and date decisions approved.
5. **Controlled assignment and task bundles:** separately authorized mapping and blind packets generated, with conflict, exposure, topic-coverage, balance, blindness, and commitment checks passed.
6. **Readiness signature:** Ellen Sun signs the complete readiness record.

Only after all six gates pass may the first-Monday start rule be applied. Until then, calendar dates remain unset. A private task-bundle file existing before that signature does not itself permit delivery or rating.

## Immediate next action

Approve, revise, or reject Q-006A. Approval would authorize consultation-packet preparation, recipient research, public calibration screening, and non-final item screening only. Exact recipients, any email send action, participant selection, controlled assignment generation, controlled task-bundle generation or distribution, and rating work would still require later separate approvals.
