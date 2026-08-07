# H-11 fail-closed access-issuance gate — 2026-08-07

**Status:** implementation candidate; not deployed and not authorization to issue access  
**Scope:** qualified-human H-11 synthetic usability sessions only  
**Research-use state:** `research_ratings_authorized=false`

## Defect addressed

The controlled operator workspace previously allowed an operator to create a rater identity and issue a one-time application invitation before the recipient-specific screening, final consent, exact session window, signed-out external-browser preflight, and separate owner access decision had been represented in the product. The operating packet required those gates, but the service did not enforce them.

## New fail-closed boundary

Rater identities are now explicitly classified as either:

- `synthetic_automation`, which is limited to non-deliverable `.invalid` addresses; or
- `h11_human_usability`, which requires the complete H-11 access gate below.

A human H-11 application invitation is rejected until an immutable `h11.access.gate.recorded` event binds all of the following to the exact identity, initial synthetic assignment, packet hash, release SHA, deployment, and session window:

1. recipient identity and professional route;
2. prior exposure and conflict/institutional-restriction screening;
3. country-level tax residence and country of work only;
4. sanctions and honorarium eligibility results and the preferred rail;
5. accessibility/device needs and operator coverage;
6. all four final-consent confirmations and a private confirmation reference;
7. exact start, end, time zone, and private support route;
8. exact release SHA, Vercel deployment ID, schema version 4, `synthetic_rehearsal_only`, and `research_ratings_authorized=false`;
9. no open P0/P1 defect;
10. fresh share-link timing, signed-out/incognito browser success, absence of operator/cross-identity exposure, and a separate control-identity journey;
11. share-link expiry; and
12. a separate owner access-authorization reference.

The service blocks invitation creation when the record is absent, incomplete, paused, failed, mismatched, stale, or too short-lived. An application invitation cannot outlive the approved session or protected share-link window. Recording a superseding gate invalidates every unused invitation bound to the earlier gate. Redemption is rejected before the session opens, after either window closes, after packet drift, or after gate supersession.

## Data minimization

The gate stores only country-level jurisdiction fields, minimum-necessary notes, references, release identifiers, dates, and pass/pause/fail evidence. It must not contain tax identifiers, banking credentials, identity documents, full addresses, plaintext share URLs, or application tokens. Records appear only in the protected operator workspace and private export; the public-safe export remains unchanged.

## Non-authorization

This implementation does not create a Vercel share URL, participant identity, assignment, invitation, payment obligation, calendar event, email, or research record. It does not move the protected release branch, deploy a successor, pass H-11, sign H-12, or authorize Pilot 01 ratings.

## Post-implementation hardening

A second code review found and closed four residual access-boundary defects before deployment:

1. an H-11 authenticated session could otherwise inherit the ordinary 12-hour session lifetime and survive beyond the approved session or share-link window;
2. a legacy real-email rater identity without an explicit purpose could otherwise be treated as an ordinary non-H-11 identity during invitation issuance or redemption;
3. a `.invalid` synthetic identity could otherwise be mislabeled as a qualified human H-11 identity; and
4. the same current H-11 access gate could otherwise have more than one simultaneously valid unused invitation.

The service now bounds an H-11 session to the earliest of the ordinary session TTL, the approved session end, the protected share-link expiry, and the one-time invitation expiry. It rejects unclassified real-email rater access at both issuance and redemption, requires synthetic and human identity classes to use non-overlapping email classes, and permits only one unused invitation for the same current gate. A superseding gate still invalidates every invitation bound to the earlier gate.
