# H-11 qualified-human synthetic dry-run owner gate — 2026-08-06

**Packet ID:** `H11-OWNER-GATE-2026-08-06-V1`  
**Status:** protected pre-H11 engineering gate passed on exact release; prepared for owner review; **not approved; do not contact anyone**  
**Operations owner:** Ellen Sun  
**Evidence dependency:** `hosted-staging-acceptance-evidence-2026-08-06-v1.json`  
**Controlling audit:** `human-expert-rating-workflow-audit-2026-08-04.md`

## Decision boundary

This packet prepares the H-11 decision but does not select a participant, authorize an email, create an invitation, distribute an assignment, promise an honorarium, collect a rating, or activate research use.

The pre-H11 engineering gate is now evidenced on exact protected release `202135a21fb15f5a12698e6a78e8c8d8b7fa79ef`. The record combines exact-head CI, rendered desktop and narrow-mobile rehearsals, Vercel OIDC to the retained Supabase Postgres project, a complete hosted synthetic lifecycle, correction and withdrawal, adjudication, support-tabletop, backup and exact restore, and a READY SSO-protected deployment. This technical pass does not pass H-11, authorize contact, or establish qualified-human comprehension. Outreach remains fail-closed until Ellen Sun explicitly approves the selections, message, support plan, honorarium, and contact authorization in this packet, and all recipient-specific checks are complete.

## Recommended qualified dry-run slate

### Primary pair

1. **Alexander Kastner**
   - Coauthor of *A dataset of rated conceptual arguments*.
   - Reported as contributing 130 critique ratings, ignoring revisions.
   - Rated all 52 critiques in the paper's rating-test set.
   - Direct experience with blind initial ratings, object-level disagreement discussion, and preserved revisions.

2. **Linh Chi Nguyen**
   - Coauthor of *A dataset of rated conceptual arguments*.
   - Reported as contributing 103 critique ratings, ignoring revisions.
   - Rated all 52 critiques in the paper's rating-test set.
   - Direct experience with blind initial ratings, object-level disagreement discussion, and preserved revisions.

### Ordered fallbacks

3. **Lukas Gloor**
   - Acknowledged contributor to the LMCA work.
   - Reported as contributing 43 ratings and rating the first 43 critiques in the rating-test set.

4. **Lukas Finnveden**
   - Acknowledged contributor to the LMCA work.
   - Reported as contributing 25 ratings and rating the first 23 critiques in the rating-test set.

### Selection rationale and limits

The primary pair has the strongest documented combination of direct rubric use, substantial rating volume, and participation in the paper's blind-initial-rating and object-level reconciliation process. The fallbacks also have direct rubric experience but lower documented volume.

This is a qualification recommendation, not evidence of interest, availability, current affiliation, contactability, or endorsement. Current professional role, public professional contact route, conflicts, and willingness must be reverified privately immediately before any separately authorized contact. No email address is stored in this public repository.

## Exact dry-run scope

Each selected person would be asked to complete one private synthetic usability session. The session is **not research rating work** and its scores must not enter the pilot dataset, model evaluation, publication, or participant-performance assessment.

The session contains:

- one explicitly synthetic position;
- four synthetic sibling critiques shown together;
- the full LMCA-derived seven-dimensional rubric;
- centrality, strength, correctness, clarity, dead weight, single issue, and overall scores;
- interpretation confidence, relevant background assumptions, assessability, verification status, issue flags, rationale, confidence, and time;
- invitation redemption and authenticated access;
- draft entry, autosave, deliberate close, reopen, and resume;
- final submission and immutable receipt;
- one controlled recovery or failure event;
- one rater-visible post-submission path; and
- a short comprehension and usability debrief.

### Role allocation

- **Dry-run rater A:** desktop journey, close/reopen recovery, submission, then correction request.
- **Dry-run rater B:** narrow/mobile journey, retry after one controlled failed request, submission, then withdrawal request.
- **Operations owner:** invitation issuance, support, incident logging, operator response, evidence retention, and stop authority.

The automated synthetic adjudicator remains synthetic. Neither dry-run participant is asked to adjudicate another person's work under H-11.

## Time and evidence

**Expected participant time:** 60–90 minutes.  
**Proposed completion window:** seven calendar days after acceptance, with no advertised date until the protected hosted release passes H-01 through H-10.  
**Permitted follow-up:** one brief follow-up seven calendar days after the first message if no reply.

A dry run passes only when both participants:

1. reach the assigned workspace without operator-side record editing;
2. correctly explain the distinction between centrality, strength, and `strength × centrality`;
3. correctly identify that low clarity makes other component ratings less reliable;
4. understand that initial ratings are independent and immutable;
5. complete all required fields and resume without lost work;
6. receive a submission receipt and understand the locked state;
7. complete their assigned correction or withdrawal path;
8. report no unresolved P0 or P1 usability, security, privacy, comprehension, or data-integrity defect; and
9. consent to retention of the synthetic audit trail and de-identified usability notes for internal workflow verification only.

P0 or P1 means immediate stop, revocation of outstanding access, defect correction, exact-release re-verification, and a fresh H-11 run. P2 defects require a documented workaround or deferral accepted by the operations owner before H-11 can pass.

## Privacy and research-use controls

- No protected, unpublished, or real pilot item may appear.
- Synthetic ratings are tagged `synthetic_rehearsal_only` and `research_ratings_authorized=false`.
- The dry-run scores are excluded from all research analyses and public claims.
- Public attribution, quotation, or naming requires separate permission.
- Declining or withdrawing has no adverse consequence.
- Sensitive payment, tax, identity, or banking information is not requested by ordinary email.
- Access expires, is single-use, and may be revoked or replaced.
- The private evidence record retains only what is necessary to prove the workflow and resolve defects.

## Recommended honorarium decision

**Recommendation:** a flat **USD 75 per completed usability session**, maximum **USD 150** for H-11.

This is a proposed separate quality-assurance honorarium. It is not a per-rating wage, does not depend on score content or agreement, and must not be silently drawn from the approved USD 400 core-rater completion pool or USD 100 adjudication reserve, whose current rules assign zero contribution units to calibration or practice work.

No compensation may be mentioned until Ellen Sun separately approves:

- the USD 150 additional ceiling;
- recipient-specific eligibility and payment rail;
- applicable tax, sanctions, jurisdiction, and identity checks; and
- the exact payment wording.

Default rails after recipient-specific review are ACH or domestic bank transfer for eligible US recipients, Wise for supported cross-border recipients, and PayPal as fallback or recipient preference. Payment onboarding must occur through an appropriate private channel.

## Proposed sender and support owner

**Sender:** Ellen Sun.  
**Support owner:** Ellen Sun.  
**Support promise:** acknowledge access-blocking or suspected-disclosure reports as promptly as reasonably possible during the agreed dry-run window; revoke access immediately when compromise is plausible; follow the verified P0–P3 incident runbook; make no promise of continuous availability or a guaranteed response time.

## Exact proposed first message

**Subject:** Private synthetic usability check for Metaphilosophy Review

> Hi [Name],
>
> I am building Metaphilosophy Review, a workflow for expert evaluation of conceptual critiques using a rubric adapted from *A dataset of rated conceptual arguments*.
>
> Before inviting any research participants, I am looking for two people with direct experience using this rating method to test a private staging workflow with entirely synthetic material. This would not be a research rating, would not enter any dataset or analysis, and would not imply endorsement.
>
> The session covers one synthetic position and four sibling critiques, including saving and resuming, final submission, one post-submission recovery path, and a short usability and rubric-comprehension debrief. I expect it to take about 60–90 minutes.
>
> Subject to payment onboarding and the applicable recipient-specific checks, I propose a flat USD 75 usability honorarium for the completed session.
>
> Would you be open to doing this during a private protected staging window? I would send the exact scope, privacy terms, and access window before you decide finally.
>
> Best,
> Ellen Sun

## Reply handling

- **Interested:** thank the person; do not issue access until this packet is explicitly approved, professional-contact and conflict checks are complete, consent and privacy terms are final, payment eligibility and wording are cleared, and the exact session window is set.
- **Question:** answer only within the approved synthetic scope; escalate methodological or compensation changes to the owner decision record.
- **Decline or no capacity:** thank the person and make no further request beyond the one permitted follow-up for non-response.
- **Conflict or concern:** record privately, do not debate, and move to the next approved fallback only after the operations owner authorizes that substitution.
- **Request to use real data or produce a research rating:** decline for H-11 and state that the exercise is synthetic usability verification only.

## Owner decisions required

Every field below defaults to **not approved**:

| Decision | Recommendation | Current state |
|---|---|---|
| Primary dry-run pair | Alexander Kastner and Linh Chi Nguyen | Not approved |
| Ordered fallbacks | Lukas Gloor, then Lukas Finnveden | Not approved |
| Synthetic-only scope | Exact scope above; no research use | Not approved |
| Session length | 60–90 minutes | Not approved |
| Completion window | Seven days after acceptance | Not approved |
| First message and subject | Exact text above | Not approved |
| One follow-up | After seven calendar days | Not approved |
| Sender and support owner | Ellen Sun | Not approved for this H-11 send |
| Separate QA honorarium | USD 75 each; USD 150 ceiling | Not approved |
| Payment wording and rails | Recipient-specific private onboarding | Not approved |
| Professional-contact re-verification | Required immediately before send | Not approved as completed |
| Contact or invitation | May be authorized only through explicit approval of this packet after recipient-specific checks | Not authorized |

## Approval syntax

A future owner decision may approve or modify the packet using an unambiguous record such as:

```text
APPROVE H11-OWNER-GATE-2026-08-06-V1
primary: Alexander Kastner; Linh Chi Nguyen
fallbacks: Lukas Gloor; Lukas Finnveden
scope: exact synthetic-only scope in the packet
honorarium: USD 75 each, USD 150 separate QA ceiling
sender/support owner: Ellen Sun
message: exact proposed first message
follow-up: one after seven calendar days
contact authorization: approved only after recipient-specific professional-contact, conflict, eligibility, payment, consent, and scheduling checks are complete
```

Approval of this packet would still not authorize real research ratings, pilot participant selection, the 48-critique assignment graph, public recruitment, ingestion of real ratings, adjudication work, publication, funding submission, or Phase 2.
