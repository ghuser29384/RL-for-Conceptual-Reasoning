# Expert reviewer recruitment launch — July 14–16, 2026

## Counting rule

An activated reviewer is a unique person whose expertise has been verified, whose public calibration has been manually reviewed, and who has consented to future assignments. Applications and calibration completions are leading indicators, not the target metric.

## Live routes

- Intake: `https://www.metaphilosophy.org/reviewers/`
- Source-tagged example: `https://www.metaphilosophy.org/reviewers/?source=connector&campaign=july-2026-expert-reviewer-sprint`
- Aggregate progress: `https://www.metaphilosophy.org/api/reviewer-recruitment?mode=stats`
- Admin export: same endpoint with `mode=export` and `Authorization: Bearer $RECRUITMENT_ADMIN_TOKEN`

## Launch offer

- $25 after identity, eligibility, duplicate, and good-faith calibration checks.
- $60/hour for subsequent accepted review work.
- $15 per referred expert who qualifies and completes calibration, capped at two referrals.

## Channel links

- Connectors: `?source=connector`
- Direct email: `?source=direct-email`
- Existing reviewers: `?source=existing-reviewer`
- Philosophy community: `?source=philosophy-community`
- AI safety community: `?source=ai-safety-community`
- Paid panel: `?source=paid-panel`
- Referral links are generated after submission with `source=referral&ref=<code>`.

## Hourly operating thresholds

- Hour 8: 15 activated reviewers
- Hour 12: 30
- Hour 18: 45
- Hour 24: 55
- Hour 36: 80
- Hour 48: at least 100 after deduplication and manual quality review

Trigger escalation when an activation threshold is missed: raise calibration compensation to $35, increase the paid-panel cap, request direct introductions rather than forwards, and remove any remaining nonessential onboarding friction.

## Manual review protocol

1. Verify the public profile, affiliation, or equivalent credential evidence.
2. Confirm the calibration rationale independently identifies whether the critique correctly reads the normative premise.
3. Review all seven scores as a coherent pattern; do not require point-for-point matching.
4. Mark the reviewer qualified, needs follow-up, or not qualified.
5. Record payment eligibility separately from qualification.
6. Do not expose hidden benchmark material during recruitment or calibration.

## Data and security

The public page uses no third-party analytics. The API stores no raw IP address; it stores a keyed or one-way fingerprint for rate limiting. Public progress exposes aggregate counts only. PII export requires a bearer token in `RECRUITMENT_ADMIN_TOKEN`.
