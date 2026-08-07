# H-11 reply triage, consent, and access gate — 2026-08-07

**Packet ID:** `H11-REPLY-TRIAGE-ACCESS-GATE-2026-08-07-V1`  
**Status:** prepared only; no reply has been received and no further email or access action is authorized  
**Scope:** synthetic usability testing only  
**Research-use state:** `research_ratings_authorized=false`

## 1. Reply classification

Classify each incoming response before acting:

| Code | Meaning | Permitted immediate action |
|---|---|---|
| `institution_forwarded` | Redwood confirms forwarding but no recipient reply | thank Redwood only if a response is operationally necessary; otherwise wait |
| `recipient_interested` | intended person is open to considering the session | prepare the exact screening response below for owner review; do not issue access |
| `recipient_questions` | intended person requests clarification | answer only the questions asked, preserving the synthetic-only and non-binding boundary |
| `recipient_declines` | intended person declines or lacks capacity | send at most one courteous acknowledgment; do not persuade or follow up |
| `identity_mismatch` | Alex is not the LMCA coauthor or the recipient is otherwise incorrect | close the route; do not forward or activate a fallback without a new owner decision |
| `institution_cannot_forward` | Redwood cannot or will not forward | close the route; do not infer a personal address or search for one without a new owner decision |
| `delivery_failure` | bounce or delivery error | verify the official route; do not resend until the cause and route are rechecked |
| `other` | ambiguous or unexpected response | pause and obtain an owner decision before substantive action |

No response may be interpreted as acceptance, consent, identity verification, or eligibility.

## 2. Exact screening response after a positive or tentative reply

This message is prepared but **must not be sent automatically**. It requires a live-thread review, recipient-specific adaptation, and owner approval.

**Subject:** reply in the existing thread

> Hi [Alex / Linh],
>
> Thank you for considering this. Before I set a protected staging window or send access, I need to confirm a small number of non-sensitive eligibility and scheduling details.
>
> 1. Please confirm that you are the intended recipient [and, for Alex: the Alexander Kastner credited as a coauthor of *A dataset of rated conceptual arguments*].
> 2. Have you previously seen Metaphilosophy’s staging interface or the exact synthetic rehearsal position? “No,” “yes,” or “not sure” is sufficient.
> 3. Is there any conflict, employer policy, outside-honorarium restriction, or other institutional constraint that could affect a private synthetic usability session?
> 4. What is your country of tax residence, and from which country would you perform the session? Please do not send a tax identifier, home address, identity document, or banking details by email.
> 5. Subject to eligibility checks, would you prefer Wise, PayPal, a supported U.S. bank transfer, or to waive the proposed USD 75 honorarium? No payment credentials are needed at this stage.
> 6. Do you have any accessibility, browser, or device needs I should account for?
> 7. Please give two or three possible 60–90 minute windows and your time zone.
>
> The session remains entirely synthetic. Its scores will not enter a research dataset, model training, model evaluation, a publication, or a public leaderboard. You may stop or withdraw at any time. Metaphilosophy will not publicly name, quote, or attribute feedback to you without separate permission.
>
> I will review the answers, send the full consent and retention terms, and confirm a protected access window before asking you to decide finally.
>
> Best,
> Ellen

## 3. Screening decision record

Before sending final terms, record the following privately:

```yaml
schema_version: h11-recipient-screening-v1
recipient_slot: A_or_B
identity_confirmed: true_false
professional_route_confirmed: true_false
prior_exposure:
  exact_synthetic_item: no_yes_uncertain
  staging_interface: no_yes_uncertain
conflict_or_institutional_restriction:
  status: none_declared_review_required_disqualifying
  notes: minimum_necessary
country_of_tax_residence:
country_of_work_for_session:
sanctions_screening: pass_review_required_fail
honorarium_eligibility: pass_review_required_fail
preferred_payment_rail: wise_paypal_us_bank_transfer_waive_other
accessibility_or_device_needs:
availability_windows:
operator_coverage_available: true_false
screening_outcome: pass_pause_decline
screened_by: Ellen Sun
screened_at:
```

Do not store tax identifiers, banking credentials, identity documents, full addresses, or unnecessary personal details in this record.

## 4. Final consent and scheduling message

Send only after the screening record passes, the exact session window is staffed, and the external access path has passed the manual preflight in section 5.

> Hi [Alex / Linh],
>
> Thank you. I can offer the following private synthetic-usability window:
>
> **Date and time:** [exact date, start time, time zone, and expected end time]  
> **Operator/support contact:** Ellen Sun, through this email thread  
> **Task:** one synthetic position and four sibling critiques, including autosave/resume, final submission, one post-submission recovery path, and a short debrief  
> **Expected duration:** 60–90 minutes
>
> **Research boundary.** This is a usability and rubric-comprehension check, not a research-rating task. Your scores will not enter the Metaphilosophy pilot dataset, model training, model evaluation, a publication, or a public leaderboard.
>
> **Voluntary participation.** You may stop or withdraw at any time without penalty. Declining or stopping will have no adverse consequence.
>
> **Private records.** The system retains a private audit trail needed to verify access, autosave, submission, correction or withdrawal, and data integrity. Identifiable H-11 records will be retained until 90 days after H-12 sign-off or final defect closure, whichever is later. Direct identifiers will then be removed, with only de-identified usability findings, integrity hashes, and the minimum audit summary retained. Metaphilosophy will not publicly name, quote, or attribute feedback to you without separate permission.
>
> **Data minimization.** Please do not enter confidential, proprietary, legally protected, tax, banking, payment, or personally sensitive information in rating fields or ordinary email. Any necessary payment onboarding will occur separately through an appropriate private channel.
>
> **Access and incident rule.** Access is personal, time-limited, and single-use at invitation redemption. Stop and reply in this thread if you see non-synthetic material, another participant’s information, missing work, duplicate submission, unexpected access behavior, or any information that should have been hidden.
>
> **Honorarium.** Subject to the completed eligibility review, the synthetic usability session carries a flat USD 75 honorarium. If you begin and a platform defect, security stop, or operator-required termination prevents completion, the full USD 75 remains payable. The honorarium is not conditioned on agreement, score direction, positive feedback, or absence of criticism.
>
> Before I issue access, please reply confirming all four statements:
>
> 1. I have read the H-11 synthetic usability-session scope and data terms.
> 2. I understand that my scores are synthetic test data and are excluded from research use.
> 3. I consent to the private audit trail and de-identified internal usability notes described above.
> 4. I understand that I may stop or withdraw at any time.
>
> I will send the short-lived access instructions only after receiving that confirmation.
>
> Best,
> Ellen

## 5. External protected-access preflight

The exact accepted staging release remains protected by Vercel access control and the application’s own single-use invitation. Before sending any participant access:

1. confirm the accepted release is still READY and corresponds to the approved release SHA;
2. confirm schema version 4, `synthetic_rehearsal_only`, and `research_ratings_authorized=false`;
3. confirm no P0/P1 defect, integrity alert, or incident is open;
4. create a fresh short-lived Vercel share URL for the exact `/staging/` route no more than 23 hours before the session;
5. test the share URL in a normal signed-out/incognito browser and confirm that it reaches the staging shell without requiring the participant to join a Vercel team;
6. confirm the share URL does not expose an operator session, another identity, an assignment, or a reusable application token;
7. create exactly one participant identity, one synthetic assignment, and one expiring single-use application invitation only after final consent;
8. test the combined external journey with a separate synthetic control identity before sending the participant’s token;
9. record the share-link expiry and invitation expiry privately, without committing either plaintext value to the repository; and
10. revoke and replace either credential immediately if it is disclosed, misdirected, or tested beyond the intended control flow.

### Current limitation

A fresh Vercel share URL can be generated, but the available non-browser fetch connector does not preserve the redirect cookie needed to prove the complete external browser handshake. Therefore the signed-out/incognito browser check in step 5 remains a mandatory manual pre-access gate. The generated test link from preparation must not be reused for a participant and will expire automatically.

## 6. Access message

Prepare only after the final consent reply and all section 5 checks pass. The message must contain:

- exact session window and time zone;
- the short-lived protected staging URL;
- the personal single-use application invitation or exact redemption instruction;
- the credential expiry times;
- a reminder not to forward either credential;
- the stop-and-report conditions;
- the operator’s live support channel; and
- no research item or research authorization language.

Do not store access credentials in the public repository, calendar description, issue tracker, or ordinary operational notes.

## 7. Decline acknowledgment

> Hi [Alex / Linh],
>
> Thank you for letting me know. I appreciate your considering it, and I will not follow up further about this session.
>
> Best,
> Ellen

## 8. Current state

- Initial institutional inquiries: sent separately on `2026-08-07`.
- Replies: none found as of the first post-send check.
- Delivery failures: none found as of the first post-send check.
- Screening responses: not sent.
- Consent: not requested or obtained.
- Session dates: not set.
- External browser access preflight: not complete.
- Participant invitation or access: not issued.
- Payment commitment or onboarding: not completed.
- H-11: incomplete.
- H-12: blocked.
- Real research ratings: unauthorized.
