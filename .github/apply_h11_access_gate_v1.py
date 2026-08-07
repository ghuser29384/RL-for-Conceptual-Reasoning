#!/usr/bin/env python3
from __future__ import annotations

import os
from pathlib import Path
from textwrap import dedent, indent

ROOT = Path(__file__).resolve().parents[1]
BRANCH = "agent/48-critique-pilot-20260730"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one anchor, found {count}: {old[:160]!r}")
    write(path, text.replace(old, new, 1))


def append_once(path: str, marker: str, content: str) -> None:
    text = read(path)
    if marker in text:
        return
    write(path, text.rstrip() + "\n\n" + content.strip() + "\n")


def main() -> None:
    if os.environ.get("GITHUB_REF_NAME") not in {None, BRANCH}:
        raise RuntimeError(f"Unexpected branch: {os.environ.get('GITHUB_REF_NAME')}")

    for path, marker in [
        ("api/staging.mjs", '"h11.access.gate.record"'),
        ("src/staging-service.mjs", "h11.access.gate.recorded"),
        ("staging/app.mjs", "H-11 access issuance gate"),
        ("test/h11-access-gate-contract.test.mjs", "H-11 access invitations fail closed"),
    ]:
        target = ROOT / path
        if target.exists() and marker in target.read_text(encoding="utf-8"):
            raise RuntimeError(f"Prior or partial patch found in {path}")

    # API surface.
    replace_once(
        "api/staging.mjs",
        '  "assignment.create",\n  "draft.save",',
        '  "assignment.create",\n  "h11.access.gate.record",\n  "draft.save",',
    )
    replace_once(
        "api/staging.mjs",
        '''        case "assignment.create":
          requireMethod(req, "POST");
          result = await runtime.service.createAssignment({ actorSessionToken: sessionToken, ...body });
          break;
        case "draft.save":''',
        '''        case "assignment.create":
          requireMethod(req, "POST");
          result = await runtime.service.createAssignment({ actorSessionToken: sessionToken, ...body });
          break;
        case "h11.access.gate.record":
          requireMethod(req, "POST");
          result = await runtime.service.recordH11AccessGate({ actorSessionToken: sessionToken, ...body });
          break;
        case "draft.save":''',
    )

    # Service constants and identity classification.
    replace_once(
        "src/staging-service.mjs",
        '''const PARTICIPANT_EVIDENCE_KINDS = new Set(["consent", "debrief"]);
const H11_CONSENT_VERSION = "H11-CONSENT-2026-08-07-V1";
const H11_DEBRIEF_VERSION = "H11-DEBRIEF-2026-08-07-V1";''',
        '''const PARTICIPANT_EVIDENCE_KINDS = new Set(["consent", "debrief"]);
const IDENTITY_PURPOSES = new Set(["synthetic_automation", "h11_human_usability", "synthetic_adjudication", "controlled_operator"]);
const H11_CONSENT_VERSION = "H11-CONSENT-2026-08-07-V1";
const H11_DEBRIEF_VERSION = "H11-DEBRIEF-2026-08-07-V1";
const H11_ACCESS_GATE_VERSION = "H11-ACCESS-GATE-2026-08-07-V1";
const H11_PAYMENT_RAILS = ["wise", "paypal", "us_bank_transfer", "waive", "other"];
const H11_EXPOSURE_VALUES = ["no", "yes", "uncertain"];
const H11_CONFLICT_VALUES = ["none_declared", "review_required", "disqualifying"];
const H11_SCREENING_VALUES = ["pass", "pause", "decline"];
const H11_CHECK_VALUES = ["pass", "review_required", "fail"];''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''        displayName: "Synthetic rehearsal operator",
        email: normalizeEmail(operatorEmail),
        status: "active",''',
        '''        displayName: "Synthetic rehearsal operator",
        email: normalizeEmail(operatorEmail),
        purpose: "controlled_operator",
        status: "active",''',
    )

    old_identity = dedent('''
      async createIdentity({ actorSessionToken, role, displayName, email }) {
        const actor = await this.requireRole(actorSessionToken, "operator");
        if (!VALID_ROLES.has(role)) throw serviceError(400, "invalid_role", "Role must be operator, rater, or adjudicator.");
        const normalized = normalizeEmail(email);
        if (!normalized) throw serviceError(400, "invalid_email", "A valid email address is required.");
        const state = await this.state();
        const existing = state.identities.find((identity) => identity.email === normalized && identity.role === role && identity.status === "active");
        if (existing) return { identity: publicIdentity(existing), created: false };
        const identity = {
          id: randomUUID(),
          role,
          displayName: String(displayName ?? "").trim().slice(0, 160) || normalized,
          email: normalized,
          status: "active",
        };
        await this.store.append(event("identity.created", identity.id, actor.identity.id, identity, this.now().toISOString()));
        await this.audit(actor.identity.id, "identity.created", { identityId: identity.id, role });
        return { identity: publicIdentity(identity), created: true };
      }
    ''')
    new_identity = dedent('''
      async createIdentity({ actorSessionToken, role, displayName, email, purpose = null }) {
        const actor = await this.requireRole(actorSessionToken, "operator");
        if (!VALID_ROLES.has(role)) throw serviceError(400, "invalid_role", "Role must be operator, rater, or adjudicator.");
        const normalized = normalizeEmail(email);
        if (!normalized) throw serviceError(400, "invalid_email", "A valid email address is required.");
        const normalizedPurpose = normalizeIdentityPurpose({ role, purpose, email: normalized });
        const state = await this.state();
        const existing = state.identities.find((identity) => identity.email === normalized && identity.role === role && identity.status === "active");
        if (existing) {
          if (effectiveIdentityPurpose(existing) !== normalizedPurpose) {
            throw serviceError(409, "identity_purpose_conflict", "An active identity already exists with a different access purpose.");
          }
          return { identity: publicIdentity(existing), created: false };
        }
        const identity = {
          id: randomUUID(),
          role,
          purpose: normalizedPurpose,
          displayName: String(displayName ?? "").trim().slice(0, 160) || normalized,
          email: normalized,
          status: "active",
        };
        await this.store.append(event("identity.created", identity.id, actor.identity.id, identity, this.now().toISOString()));
        await this.audit(actor.identity.id, "identity.created", { identityId: identity.id, role, purpose: normalizedPurpose });
        return { identity: publicIdentity(identity), created: true };
      }
    ''')
    replace_once("src/staging-service.mjs", old_identity, new_identity)

    old_invite = dedent('''
      async createInvite({ actorSessionToken, identityId, expiresInHours = this.inviteTtlHours }) {
        const actor = await this.requireRole(actorSessionToken, "operator");
        const state = await this.state();
        const identity = activeIdentity(state, identityId);
        const result = await this.createInviteInternal({ identityId: identity.id, actorId: actor.identity.id, expiresInHours });
        await this.audit(actor.identity.id, "invite.created", { inviteId: result.invite.id, identityId: identity.id, expiresAt: result.invite.expiresAt });
        return { invite: publicInvite(result.invite), token: result.token };
      }
    ''')
    new_invite = dedent('''
      async createInvite({ actorSessionToken, identityId, expiresInHours = this.inviteTtlHours }) {
        const actor = await this.requireRole(actorSessionToken, "operator");
        const state = await this.state();
        const identity = activeIdentity(state, identityId);
        const gate = resolveInviteAccessGate(state, identity, this.now(), expiresInHours);
        const result = await this.createInviteInternal({
          identityId: identity.id,
          actorId: actor.identity.id,
          expiresInHours,
          expiresAt: gate.expiresAt,
          metadata: gate.metadata,
        });
        await this.audit(actor.identity.id, "invite.created", {
          inviteId: result.invite.id,
          identityId: identity.id,
          purpose: effectiveIdentityPurpose(identity),
          h11AccessGateId: result.invite.h11AccessGateId ?? null,
          assignmentId: result.invite.assignmentId ?? null,
          expiresAt: result.invite.expiresAt,
        });
        return { invite: publicInvite(result.invite), token: result.token };
      }
    ''')
    replace_once("src/staging-service.mjs", old_invite, new_invite)

    old_replace = dedent('''
      async replaceInvite({ actorSessionToken, inviteId, expiresInHours = this.inviteTtlHours }) {
        const actor = await this.requireRole(actorSessionToken, "operator");
        const state = await this.state();
        const invite = state.invites.find((candidate) => candidate.id === inviteId);
        if (!invite) throw serviceError(404, "invite_not_found", "Invite not found.");
        if (!invite.revokedAt && !invite.usedAt) {
          await this.store.append(event("invite.revoked", invite.id, actor.identity.id, {
            inviteId,
            reason: "replaced",
            revokedAt: this.now().toISOString(),
          }, this.now().toISOString()));
        }
        const replacement = await this.createInviteInternal({ identityId: invite.identityId, actorId: actor.identity.id, expiresInHours });
        await this.store.append(event("invite.replaced", invite.id, actor.identity.id, {
          inviteId,
          replacementInviteId: replacement.invite.id,
        }, this.now().toISOString()));
        await this.audit(actor.identity.id, "invite.replaced", { inviteId, replacementInviteId: replacement.invite.id });
        return { invite: publicInvite(replacement.invite), token: replacement.token };
      }
    ''')
    new_replace = dedent('''
      async replaceInvite({ actorSessionToken, inviteId, expiresInHours = this.inviteTtlHours }) {
        const actor = await this.requireRole(actorSessionToken, "operator");
        const state = await this.state();
        const invite = state.invites.find((candidate) => candidate.id === inviteId);
        if (!invite) throw serviceError(404, "invite_not_found", "Invite not found.");
        const identity = activeIdentity(state, invite.identityId);
        const gate = resolveInviteAccessGate(state, identity, this.now(), expiresInHours);
        if (!invite.revokedAt && !invite.usedAt) {
          await this.store.append(event("invite.revoked", invite.id, actor.identity.id, {
            inviteId,
            reason: "replaced",
            revokedAt: this.now().toISOString(),
          }, this.now().toISOString()));
        }
        const replacement = await this.createInviteInternal({
          identityId: invite.identityId,
          actorId: actor.identity.id,
          expiresInHours,
          expiresAt: gate.expiresAt,
          metadata: gate.metadata,
        });
        await this.store.append(event("invite.replaced", invite.id, actor.identity.id, {
          inviteId,
          replacementInviteId: replacement.invite.id,
        }, this.now().toISOString()));
        await this.audit(actor.identity.id, "invite.replaced", {
          inviteId,
          replacementInviteId: replacement.invite.id,
          h11AccessGateId: replacement.invite.h11AccessGateId ?? null,
        });
        return { invite: publicInvite(replacement.invite), token: replacement.token };
      }
    ''')
    replace_once("src/staging-service.mjs", old_replace, new_replace)

    replace_once(
        "src/staging-service.mjs",
        '''    const identity = activeIdentity(state, invite.identityId);
    const sessionToken = makeToken();''',
        '''    const identity = activeIdentity(state, invite.identityId);
    validateInviteAccessGateAtRedemption(state, invite, identity, now);
    const sessionToken = makeToken();''',
    )

    # H-11 access-gate method.
    access_method = indent(dedent(r'''
      async recordH11AccessGate({ actorSessionToken, identityId, assignmentId, payload }) {
        const actor = await this.requireRole(actorSessionToken, "operator");
        const state = await this.state();
        const identity = activeIdentity(state, identityId);
        if (identity.role !== "rater" || effectiveIdentityPurpose(identity) !== "h11_human_usability") {
          throw serviceError(400, "wrong_identity_purpose", "H-11 access gates apply only to qualified human usability-rater identities.");
        }
        const assignment = state.assignments.find((candidate) => candidate.id === assignmentId);
        if (!assignment) throw serviceError(404, "assignment_not_found", "Assignment not found.");
        if (assignment.identityId !== identity.id || assignment.kind !== "initial") {
          throw serviceError(400, "wrong_assignment", "The access gate must bind the participant's initial synthetic assignment.");
        }
        if (assignment.status !== "assigned") {
          throw serviceError(409, "assignment_not_open", "The H-11 access gate must be recorded before the initial assignment is completed or withdrawn.");
        }

        const normalized = normalizeH11AccessGate(payload, this.now());
        const prior = latestH11AccessGate(state, identity.id, assignment.id);
        if (prior && prior.packetHash === assignment.packetHash && JSON.stringify(prior.payload) === JSON.stringify(normalized)) {
          return { record: publicH11AccessGate(prior), replay: true };
        }

        const recordedAt = this.now().toISOString();
        const record = {
          id: randomUUID(),
          identityId: identity.id,
          assignmentId: assignment.id,
          packetHash: assignment.packetHash,
          version: H11_ACCESS_GATE_VERSION,
          payload: normalized,
          supersedesId: prior?.id ?? null,
          recordedAt,
          validUntil: normalized.externalPreflight.shareLinkExpiresAt,
        };
        await this.store.appendMany([
          event("h11.access.gate.recorded", record.id, actor.identity.id, record, recordedAt),
          event("audit.recorded", randomUUID(), actor.identity.id, {
            action: "h11.access.gate.recorded",
            subjectId: record.id,
            identityId: identity.id,
            assignmentId: assignment.id,
            packetHash: assignment.packetHash,
            version: record.version,
            supersedesId: record.supersedesId,
          }, recordedAt),
        ]);
        return { record: publicH11AccessGate(record), replay: false };
      }

    '''), "  ")
    replace_once(
        "src/staging-service.mjs",
        '''  async recordParticipantEvidence({ sessionToken, assignmentId, kind, payload }) {''',
        access_method + '''  async recordParticipantEvidence({ sessionToken, assignmentId, kind, payload }) {''',
    )

    # Invitation metadata and workspaces.
    old_internal = dedent('''
      async createInviteInternal({ identityId, actorId, expiresInHours }) {
        const token = makeToken();
        const createdAt = this.now();
        const invite = {
          id: randomUUID(),
          identityId,
          tokenHash: sha256Token(token),
          createdAt: createdAt.toISOString(),
          expiresAt: addHours(createdAt, clampHours(expiresInHours, 1, 168)).toISOString(),
          usedAt: null,
          revokedAt: null,
          replacementInviteId: null,
        };
        await this.store.append(event("invite.created", invite.id, actorId, invite, invite.createdAt));
        return { invite, token };
      }
    ''')
    new_internal = dedent('''
      async createInviteInternal({ identityId, actorId, expiresInHours, expiresAt = null, metadata = {} }) {
        const token = makeToken();
        const createdAt = this.now();
        const invite = {
          id: randomUUID(),
          identityId,
          tokenHash: sha256Token(token),
          createdAt: createdAt.toISOString(),
          expiresAt: expiresAt ?? addHours(createdAt, clampHours(expiresInHours, 1, 168)).toISOString(),
          usedAt: null,
          revokedAt: null,
          replacementInviteId: null,
          ...metadata,
        };
        await this.store.append(event("invite.created", invite.id, actorId, invite, invite.createdAt));
        return { invite, token };
      }
    ''')
    replace_once("src/staging-service.mjs", old_internal, new_internal)
    replace_once(
        "src/staging-service.mjs",
        '''      participantEvidence: state.participantEvidence.map(publicParticipantEvidence),
      chain: state.chain,''',
        '''      participantEvidence: state.participantEvidence.map(publicParticipantEvidence),
      h11AccessGates: state.h11AccessGates.map(publicH11AccessGate),
      chain: state.chain,''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''    participantEvidence: [], labelSnapshots: [], auditEvents: [],''',
        '''    participantEvidence: [], h11AccessGates: [], labelSnapshots: [], auditEvents: [],''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''      case "participant.evidence.recorded": upsert(state.participantEvidence, payload); break;
      case "adjudication.opened":''',
        '''      case "participant.evidence.recorded": upsert(state.participantEvidence, payload); break;
      case "h11.access.gate.recorded": upsert(state.h11AccessGates, payload); break;
      case "adjudication.opened":''',
    )

    # Service validators and helpers.
    helper_block = dedent(r'''
    function normalizeIdentityPurpose({ role, purpose, email }) {
      let value = String(purpose ?? "").trim();
      if (!value) {
        if (role === "rater" && isSyntheticEmail(email)) value = "synthetic_automation";
        else if (role === "adjudicator" && isSyntheticEmail(email)) value = "synthetic_adjudication";
        else if (role === "operator") value = "controlled_operator";
      }
      if (!IDENTITY_PURPOSES.has(value)) {
        throw serviceError(400, "identity_purpose_required", "Choose an explicit controlled identity purpose.");
      }
      const allowed = {
        rater: new Set(["synthetic_automation", "h11_human_usability"]),
        adjudicator: new Set(["synthetic_adjudication"]),
        operator: new Set(["controlled_operator"]),
      };
      if (!allowed[role]?.has(value)) throw serviceError(400, "identity_purpose_role_mismatch", "The identity purpose does not match the selected role.");
      if (["synthetic_automation", "synthetic_adjudication"].includes(value) && !isSyntheticEmail(email)) {
        throw serviceError(400, "synthetic_identity_email_required", "Synthetic automation identities must use a non-deliverable .invalid email address.");
      }
      return value;
    }

    function effectiveIdentityPurpose(identity) {
      if (identity?.purpose) return identity.purpose;
      if (identity?.role === "rater" && isSyntheticEmail(identity.email)) return "synthetic_automation";
      if (identity?.role === "adjudicator" && isSyntheticEmail(identity.email)) return "synthetic_adjudication";
      if (identity?.role === "operator") return "controlled_operator";
      return "unknown";
    }

    function isSyntheticEmail(email) {
      return String(email ?? "").toLowerCase().endsWith(".invalid");
    }

    function normalizeH11AccessGate(payload = {}, now = new Date()) {
      const screening = payload.screening ?? {};
      const finalConsent = payload.finalConsent ?? {};
      const session = payload.session ?? {};
      const external = payload.externalPreflight ?? {};

      const normalized = {
        recipientSlot: requireChoice(payload.recipientSlot, ["A", "B", "fallback"], "Recipient slot"),
        screening: {
          identityConfirmed: requireGateTrue(screening.identityConfirmed, "Confirm the intended participant's identity."),
          professionalRouteConfirmed: requireGateTrue(screening.professionalRouteConfirmed, "Confirm the professional contact route."),
          exactSyntheticItemExposure: requireChoice(screening.exactSyntheticItemExposure, H11_EXPOSURE_VALUES, "Exact synthetic-item exposure"),
          stagingInterfaceExposure: requireChoice(screening.stagingInterfaceExposure, H11_EXPOSURE_VALUES, "Staging-interface exposure"),
          conflictStatus: requireChoice(screening.conflictStatus, H11_CONFLICT_VALUES, "Conflict or institutional restriction"),
          conflictNotes: optionalText(screening.conflictNotes, 2000),
          countryOfTaxResidence: requireText(screening.countryOfTaxResidence, 2, 100, "Country of tax residence"),
          countryOfWorkForSession: requireText(screening.countryOfWorkForSession, 2, 100, "Country of work for the session"),
          sanctionsScreening: requireChoice(screening.sanctionsScreening, H11_CHECK_VALUES, "Sanctions screening"),
          honorariumEligibility: requireChoice(screening.honorariumEligibility, H11_CHECK_VALUES, "Honorarium eligibility"),
          preferredPaymentRail: requireChoice(screening.preferredPaymentRail, H11_PAYMENT_RAILS, "Preferred payment rail"),
          accessibilityOrDeviceNeeds: optionalText(screening.accessibilityOrDeviceNeeds, 2000),
          operatorCoverageAvailable: requireGateTrue(screening.operatorCoverageAvailable, "Confirm live operator coverage for the session window."),
          screeningOutcome: requireChoice(screening.screeningOutcome, H11_SCREENING_VALUES, "Screening outcome"),
        },
        finalConsent: {
          scopeAndDataTermsRead: requireGateTrue(finalConsent.scopeAndDataTermsRead, "Record the participant's confirmation that the H-11 scope and data terms were read."),
          syntheticScoresExcluded: requireGateTrue(finalConsent.syntheticScoresExcluded, "Record confirmation that synthetic scores are excluded from research use."),
          auditTrailAndNotesConsented: requireGateTrue(finalConsent.auditTrailAndNotesConsented, "Record consent to the private audit trail and de-identified internal usability notes."),
          voluntaryAndMayStop: requireGateTrue(finalConsent.voluntaryAndMayStop, "Record confirmation that participation is voluntary and may be stopped."),
          confirmationReference: requireText(finalConsent.confirmationReference, 12, 240, "Consent confirmation reference"),
        },
        session: {
          startAt: requireIsoDate(session.startAt, "Session start"),
          endAt: requireIsoDate(session.endAt, "Session end"),
          timeZone: requireText(session.timeZone, 2, 100, "Session time zone"),
          supportRouteConfirmed: requireGateTrue(session.supportRouteConfirmed, "Confirm the private live support route."),
        },
        externalPreflight: {
          releaseSha: requireReleaseSha(external.releaseSha),
          deploymentId: requireDeploymentId(external.deploymentId),
          schemaVersion: requireInteger(external.schemaVersion, 4, 4, "Schema version"),
          syntheticOnlyPurposeConfirmed: requireGateTrue(external.syntheticOnlyPurposeConfirmed, "Confirm the synthetic_rehearsal_only purpose."),
          researchRatingsAuthorizedFalseConfirmed: requireGateTrue(external.researchRatingsAuthorizedFalseConfirmed, "Confirm research_ratings_authorized=false."),
          noOpenP0P1Defect: requireGateTrue(external.noOpenP0P1Defect, "Confirm that no P0 or P1 defect or incident is open."),
          shareLinkCreatedWithin23Hours: requireGateTrue(external.shareLinkCreatedWithin23Hours, "Confirm the share link was created no more than 23 hours before the session."),
          signedOutIncognitoJourneyPassed: requireGateTrue(external.signedOutIncognitoJourneyPassed, "Confirm the normal signed-out or incognito external journey passed."),
          noOperatorOrCrossIdentityExposure: requireGateTrue(external.noOperatorOrCrossIdentityExposure, "Confirm the external path exposed no operator session, other identity, assignment, or reusable token."),
          controlIdentityJourneyPassed: requireGateTrue(external.controlIdentityJourneyPassed, "Confirm the combined external journey passed with a separate synthetic control identity."),
          shareLinkExpiresAt: requireIsoDate(external.shareLinkExpiresAt, "Share-link expiry"),
        },
        ownerAuthorizationReference: requireText(payload.ownerAuthorizationReference, 12, 240, "Owner access-authorization reference"),
        notes: optionalText(payload.notes, 4000),
      };

      if (normalized.screening.conflictStatus !== "none_declared") {
        throw serviceError(409, "h11_conflict_not_cleared", "Conflict or institutional-restriction review must be cleared before access authorization.");
      }
      if (normalized.screening.sanctionsScreening !== "pass" || normalized.screening.honorariumEligibility !== "pass") {
        throw serviceError(409, "h11_eligibility_not_cleared", "Sanctions and honorarium-eligibility checks must both pass before access authorization.");
      }
      if (normalized.screening.screeningOutcome !== "pass") {
        throw serviceError(409, "h11_screening_not_passed", "The recipient screening outcome must be pass before access authorization.");
      }

      const start = new Date(normalized.session.startAt);
      const end = new Date(normalized.session.endAt);
      const shareExpiry = new Date(normalized.externalPreflight.shareLinkExpiresAt);
      if (end <= start) throw serviceError(400, "invalid_session_window", "The H-11 session end must be after its start.");
      if (end.getTime() - start.getTime() > 4 * 60 * 60 * 1000) {
        throw serviceError(400, "invalid_session_window", "The H-11 protected session window may not exceed four hours.");
      }
      if (start.getTime() < now.getTime() - 15 * 60 * 1000) {
        throw serviceError(409, "h11_session_window_stale", "The recorded H-11 session window has already begun too far in the past.");
      }
      if (start.getTime() > now.getTime() + 14 * 24 * 60 * 60 * 1000) {
        throw serviceError(400, "h11_session_window_too_distant", "The H-11 session window must be within the next fourteen days.");
      }
      if (shareExpiry < end) {
        throw serviceError(409, "h11_share_link_expires_too_early", "The protected share link must remain valid through the complete session window.");
      }
      if (shareExpiry.getTime() > now.getTime() + 23 * 60 * 60 * 1000) {
        throw serviceError(409, "h11_share_link_too_long", "The recorded share-link expiry may not exceed the approved 23-hour limit.");
      }
      return normalized;
    }

    function requireGateTrue(value, message) {
      if (value !== true) throw serviceError(400, "h11_access_gate_incomplete", message);
      return true;
    }

    function requireIsoDate(value, label) {
      const date = new Date(String(value ?? ""));
      if (!Number.isFinite(date.getTime())) throw serviceError(400, "invalid_datetime", `${label} must be a valid ISO date-time.`);
      return date.toISOString();
    }

    function requireReleaseSha(value) {
      const sha = String(value ?? "").trim().toLowerCase();
      if (!/^[a-f0-9]{40}$/u.test(sha)) throw serviceError(400, "invalid_release_sha", "Release SHA must be the exact 40-character Git commit SHA.");
      return sha;
    }

    function requireDeploymentId(value) {
      const deploymentId = String(value ?? "").trim();
      if (!/^dpl_[A-Za-z0-9]{12,156}$/u.test(deploymentId)) throw serviceError(400, "invalid_deployment_id", "Deployment ID must be an exact Vercel dpl_ identifier.");
      return deploymentId;
    }

    function latestH11AccessGate(state, identityId, assignmentId) {
      return state.h11AccessGates
        .filter((record) => record.identityId === identityId && record.assignmentId === assignmentId)
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null;
    }

    function resolveInviteAccessGate(state, identity, now, expiresInHours) {
      if (effectiveIdentityPurpose(identity) !== "h11_human_usability") return { expiresAt: null, metadata: {} };
      const assignment = state.assignments
        .filter((candidate) => candidate.identityId === identity.id && candidate.kind === "initial" && candidate.status === "assigned")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (!assignment) throw serviceError(409, "h11_assignment_required", "Create the participant's exact initial synthetic assignment before issuing access.");
      const preflight = latestH11AccessGate(state, identity.id, assignment.id);
      if (!preflight) throw serviceError(409, "h11_access_gate_required", "Record the complete recipient screening, final consent, session, and external access gate before issuing an invitation.");
      if (preflight.packetHash !== assignment.packetHash) throw serviceError(409, "h11_packet_gate_mismatch", "The access gate does not match the current assignment packet.");
      const end = new Date(preflight.payload.session.endAt);
      const shareExpiry = new Date(preflight.payload.externalPreflight.shareLinkExpiresAt);
      const latestValidEnd = new Date(Math.min(end.getTime(), shareExpiry.getTime()));
      if (latestValidEnd <= now) throw serviceError(409, "h11_access_gate_expired", "The H-11 access gate or protected share link has expired.");
      const requestedExpiry = addHours(now, clampHours(expiresInHours, 1, 168));
      if (requestedExpiry > latestValidEnd) {
        const remainingHours = Math.max(0, (latestValidEnd.getTime() - now.getTime()) / (60 * 60 * 1000));
        throw serviceError(409, "h11_invite_exceeds_window", "The application invitation cannot outlive the approved session or share-link window.", { remainingHours });
      }
      return {
        expiresAt: requestedExpiry.toISOString(),
        metadata: {
          purpose: "h11_human_usability",
          h11AccessGateId: preflight.id,
          assignmentId: assignment.id,
          packetHash: assignment.packetHash,
        },
      };
    }

    function validateInviteAccessGateAtRedemption(state, invite, identity, now) {
      if (!invite.h11AccessGateId) return;
      if (effectiveIdentityPurpose(identity) !== "h11_human_usability") {
        throw serviceError(401, "h11_identity_mismatch", "The invitation access purpose no longer matches the identity.");
      }
      const assignment = state.assignments.find((candidate) => candidate.id === invite.assignmentId);
      if (!assignment || assignment.identityId !== identity.id || assignment.kind !== "initial") {
        throw serviceError(401, "h11_assignment_mismatch", "The invitation is not bound to the participant's current initial assignment.");
      }
      const latest = latestH11AccessGate(state, identity.id, assignment.id);
      if (!latest || latest.id !== invite.h11AccessGateId) {
        throw serviceError(401, "h11_access_gate_superseded", "The access gate was replaced; ask the operator for a fresh invitation.");
      }
      if (latest.packetHash !== assignment.packetHash || invite.packetHash !== assignment.packetHash) {
        throw serviceError(401, "h11_packet_gate_mismatch", "The invitation packet no longer matches the approved access gate.");
      }
      const start = new Date(latest.payload.session.startAt);
      const end = new Date(latest.payload.session.endAt);
      const shareExpiry = new Date(latest.payload.externalPreflight.shareLinkExpiresAt);
      if (now < start) throw serviceError(403, "h11_access_window_not_open", "The protected H-11 session window has not opened yet.");
      if (now >= end || now >= shareExpiry) throw serviceError(401, "h11_access_window_closed", "The protected H-11 session or share-link window has closed.");
    }

    ''')
    replace_once(
        "src/staging-service.mjs",
        '''function normalizeRating(rating = {}) {''',
        helper_block + '''function normalizeRating(rating = {}) {''',
    )

    replace_once(
        "src/staging-service.mjs",
        '''function publicIdentity(identity) {
  return identity ? { id: identity.id, role: identity.role, displayName: identity.displayName, status: identity.status } : null;
}''',
        '''function publicIdentity(identity) {
  return identity ? { id: identity.id, role: identity.role, purpose: effectiveIdentityPurpose(identity), displayName: identity.displayName, status: identity.status } : null;
}''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''function publicInvite(invite) {
  return { id: invite.id, identityId: invite.identityId, createdAt: invite.createdAt, expiresAt: invite.expiresAt, usedAt: invite.usedAt, revokedAt: invite.revokedAt, replacementInviteId: invite.replacementInviteId ?? null };
}''',
        '''function publicInvite(invite) {
  return {
    id: invite.id,
    identityId: invite.identityId,
    purpose: invite.purpose ?? null,
    h11AccessGateId: invite.h11AccessGateId ?? null,
    assignmentId: invite.assignmentId ?? null,
    packetHash: invite.packetHash ?? null,
    createdAt: invite.createdAt,
    expiresAt: invite.expiresAt,
    usedAt: invite.usedAt,
    revokedAt: invite.revokedAt,
    replacementInviteId: invite.replacementInviteId ?? null,
  };
}''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''function publicParticipantEvidence(record) {''',
        '''function publicH11AccessGate(record) {
  return record ? {
    id: record.id,
    identityId: record.identityId,
    assignmentId: record.assignmentId,
    packetHash: record.packetHash,
    version: record.version,
    payload: structuredClone(record.payload),
    supersedesId: record.supersedesId ?? null,
    recordedAt: record.recordedAt,
    validUntil: record.validUntil,
  } : null;
}

function publicParticipantEvidence(record) {''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''    withdrawalRequests: state.withdrawalRequests.length,
  };''',
        '''    withdrawalRequests: state.withdrawalRequests.length,
    h11AccessGates: state.h11AccessGates.length,
  };''',
    )

    # Operator HTML.
    replace_once(
        "staging/index.html",
        '''          <label><span>Role</span><select name="role" required><option value="rater">Rater</option><option value="adjudicator">Adjudicator</option><option value="operator">Operator</option></select></label>
          <button class="primary-button" type="submit">Create identity</button>''',
        '''          <label><span>Role</span><select name="role" required><option value="rater">Rater</option><option value="adjudicator">Adjudicator</option><option value="operator">Operator</option></select></label>
          <label><span>Purpose</span><select name="purpose" required><option value="synthetic_automation" data-role="rater">Synthetic automation rater</option><option value="h11_human_usability" data-role="rater">H-11 qualified human usability participant</option><option value="synthetic_adjudication" data-role="adjudicator">Synthetic adjudicator</option><option value="controlled_operator" data-role="operator">Controlled operator</option></select><small class="field-help">Synthetic identities must use a non-deliverable .invalid email. Human H-11 identities are access-gated separately.</small></label>
          <button class="primary-button" type="submit">Create identity</button>''',
    )
    replace_once(
        "staging/index.html",
        '''          <label><span>Expires in hours</span><input name="expiresInHours" type="number" min="1" max="168" value="72" required></label>
          <button class="primary-button" type="submit">Create invitation</button>''',
        '''          <label><span>Expires in hours</span><input name="expiresInHours" type="number" min="1" max="168" value="3" required><small class="field-help">H-11 invitations are rejected until the complete access gate passes and may not outlive the approved session or protected share-link window.</small></label>
          <button class="primary-button" type="submit">Create invitation</button>''',
    )
    replace_once(
        "staging/index.html",
        '''<table><caption>Controlled identities</caption><thead><tr><th>Name</th><th>Role</th><th>Status</th><th>ID</th></tr></thead>''',
        '''<table><caption>Controlled identities</caption><thead><tr><th>Name</th><th>Role</th><th>Purpose</th><th>Status</th><th>ID</th></tr></thead>''',
    )

    # Operator app purpose handling and access gate panel.
    replace_once(
        "staging/app.mjs",
        '''    identityBody.insertAdjacentHTML("beforeend", `<tr><td>${escapeHtml(identity.displayName)}</td><td>${escapeHtml(identity.role)}</td><td>${escapeHtml(identity.status)}</td><td><code>${escapeHtml(identity.id)}</code></td></tr>`);''',
        '''    identityBody.insertAdjacentHTML("beforeend", `<tr><td>${escapeHtml(identity.displayName)}</td><td>${escapeHtml(identity.role)}</td><td>${escapeHtml(identity.purpose || "unknown")}</td><td>${escapeHtml(identity.status)}</td><td><code>${escapeHtml(identity.id)}</code></td></tr>`);''',
    )
    replace_once(
        "staging/app.mjs",
        '''  document.querySelector("#create-identity-form").addEventListener("submit", operatorFormHandler("identity.create", (form) => Object.fromEntries(new FormData(form)), loadWorkspace));''',
        '''  const identityForm = document.querySelector("#create-identity-form");
  const identityRole = identityForm.elements.namedItem("role");
  const identityPurpose = identityForm.elements.namedItem("purpose");
  const syncIdentityPurpose = () => {
    const role = identityRole.value;
    let selectedStillAllowed = false;
    for (const option of identityPurpose.options) {
      const allowed = option.dataset.role === role;
      option.hidden = !allowed;
      option.disabled = !allowed;
      if (allowed && option.selected) selectedStillAllowed = true;
    }
    if (!selectedStillAllowed) identityPurpose.value = [...identityPurpose.options].find((option) => !option.disabled)?.value || "";
  };
  identityRole.addEventListener("change", syncIdentityPurpose);
  syncIdentityPurpose();
  identityForm.addEventListener("submit", operatorFormHandler("identity.create", (form) => Object.fromEntries(new FormData(form)), loadWorkspace));''',
    )
    replace_once(
        "staging/app.mjs",
        '''  renderOperatorParticipantEvidence();
  renderOperatorCorrectionQueue();''',
        '''  renderOperatorAccessGate();
  renderOperatorParticipantEvidence();
  renderOperatorCorrectionQueue();''',
    )

    access_ui = dedent(r'''
    function renderOperatorAccessGate() {
      const panel = document.createElement("section");
      panel.className = "panel operator-queue access-gate-panel";
      panel.dataset.queue = "access-preflight";
      panel.innerHTML = `
        <p class="eyebrow">H-11 access issuance gate</p>
        <h2>Screening, final consent, and protected-access preflight</h2>
        <p class="muted">A human H-11 invitation is rejected by the service until an immutable record below passes every recipient-screening, final-consent, exact-session, external-browser, release, and owner-authorization gate. This record never issues access or authorizes research ratings by itself.</p>`;

      const identities = (state.workspace.identities ?? []).filter((identity) => identity.role === "rater" && identity.purpose === "h11_human_usability");
      if (!identities.length) {
        panel.insertAdjacentHTML("beforeend", '<p class="muted">No H-11 human usability identity exists. Synthetic automation identities do not use this gate.</p>');
      }

      for (const identity of identities) {
        const assignment = (state.workspace.assignments ?? [])
          .filter((candidate) => candidate.identityId === identity.id && candidate.kind === "initial")
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
        const records = (state.workspace.h11AccessGates ?? [])
          .filter((record) => record.identityId === identity.id && (!assignment || record.assignmentId === assignment.id))
          .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
        const latest = records[0] ?? null;
        const ready = Boolean(latest && assignment && latest.packetHash === assignment.packetHash && new Date(latest.validUntil) > new Date());
        const card = document.createElement("article");
        card.className = "subpanel access-gate-card";
        card.dataset.identityId = identity.id;
        card.innerHTML = `
          <div class="operator-evidence-heading">
            <div>
              <p class="eyebrow">${ready ? "ready for bounded invite issuance" : "blocked"}</p>
              <h3>${escapeHtml(identity.displayName)}</h3>
              <p>${assignment ? `Initial assignment <code>${escapeHtml(assignment.id)}</code> · ${escapeHtml(assignment.status)}` : "Create the exact initial synthetic assignment before recording this gate."}</p>
            </div>
            <span class="evidence-chip ${ready ? "is-complete" : ""}">${ready ? "Access preflight ready" : "Invitation blocked"}</span>
          </div>`;

        if (latest) {
          const summary = document.createElement("details");
          summary.className = "technical-integrity access-gate-summary";
          summary.innerHTML = `
            <summary>Latest immutable H-11 access-gate record</summary>
            <dl>
              <div><dt>Version</dt><dd>${escapeHtml(latest.version)}</dd></div>
              <div><dt>Recorded</dt><dd>${escapeHtml(latest.recordedAt)}</dd></div>
              <div><dt>Valid until</dt><dd>${escapeHtml(latest.validUntil)}</dd></div>
              <div><dt>Release</dt><dd><code>${escapeHtml(latest.payload.externalPreflight.releaseSha)}</code></dd></div>
              <div><dt>Deployment</dt><dd><code>${escapeHtml(latest.payload.externalPreflight.deploymentId)}</code></dd></div>
              <div><dt>Session</dt><dd>${escapeHtml(latest.payload.session.startAt)} → ${escapeHtml(latest.payload.session.endAt)} · ${escapeHtml(latest.payload.session.timeZone)}</dd></div>
              <div><dt>Screening</dt><dd>${escapeHtml(latest.payload.screening.screeningOutcome)} · conflicts ${escapeHtml(latest.payload.screening.conflictStatus)} · sanctions ${escapeHtml(latest.payload.screening.sanctionsScreening)} · honorarium ${escapeHtml(latest.payload.screening.honorariumEligibility)}</dd></div>
              <div><dt>Owner reference</dt><dd>${escapeHtml(latest.payload.ownerAuthorizationReference)}</dd></div>
            </dl>`;
          card.append(summary);
        }

        if (!assignment || assignment.status !== "assigned") {
          card.insertAdjacentHTML("beforeend", '<p class="status-banner"><strong>Gate unavailable.</strong><span>An open initial synthetic assignment is required.</span></p>');
          panel.append(card);
          continue;
        }

        const p = latest?.payload ?? {};
        const screening = p.screening ?? {};
        const consent = p.finalConsent ?? {};
        const session = p.session ?? {};
        const external = p.externalPreflight ?? {};
        const startDefault = session.startAt ? toLocalDateTimeValue(session.startAt) : toLocalDateTimeValue(new Date(Date.now() + 5 * 60 * 1000));
        const endDefault = session.endAt ? toLocalDateTimeValue(session.endAt) : toLocalDateTimeValue(new Date(Date.now() + 3 * 60 * 60 * 1000));
        const shareExpiryDefault = external.shareLinkExpiresAt ? toLocalDateTimeValue(external.shareLinkExpiresAt) : toLocalDateTimeValue(new Date(Date.now() + 4 * 60 * 60 * 1000));
        const form = document.createElement("form");
        form.className = "evidence-form h11-access-gate-form";
        form.innerHTML = `
          <fieldset>
            <legend>Recipient screening</legend>
            <div class="evidence-scale-grid">
              <label><span>Recipient slot</span><select name="recipientSlot" required>${selectOptions([["A", "A"], ["B", "B"], ["fallback", "Fallback"]], p.recipientSlot || "A")}</select></label>
              <label><span>Exact synthetic-item exposure</span><select name="exactSyntheticItemExposure" required>${selectOptions([["no", "No"], ["yes", "Yes"], ["uncertain", "Uncertain"]], screening.exactSyntheticItemExposure || "no")}</select></label>
              <label><span>Staging-interface exposure</span><select name="stagingInterfaceExposure" required>${selectOptions([["no", "No"], ["yes", "Yes"], ["uncertain", "Uncertain"]], screening.stagingInterfaceExposure || "no")}</select></label>
              <label><span>Conflict / institutional restriction</span><select name="conflictStatus" required>${selectOptions([["none_declared", "None declared / cleared"], ["review_required", "Review required"], ["disqualifying", "Disqualifying"]], screening.conflictStatus || "none_declared")}</select></label>
              <label><span>Country of tax residence</span><input name="countryOfTaxResidence" value="${escapeHtml(screening.countryOfTaxResidence || "")}" required></label>
              <label><span>Country of work for session</span><input name="countryOfWorkForSession" value="${escapeHtml(screening.countryOfWorkForSession || "")}" required></label>
              <label><span>Sanctions screening</span><select name="sanctionsScreening" required>${selectOptions([["pass", "Pass"], ["review_required", "Review required"], ["fail", "Fail"]], screening.sanctionsScreening || "pass")}</select></label>
              <label><span>Honorarium eligibility</span><select name="honorariumEligibility" required>${selectOptions([["pass", "Pass"], ["review_required", "Review required"], ["fail", "Fail"]], screening.honorariumEligibility || "pass")}</select></label>
              <label><span>Preferred payment rail</span><select name="preferredPaymentRail" required>${selectOptions([["wise", "Wise"], ["paypal", "PayPal"], ["us_bank_transfer", "Supported U.S. bank transfer"], ["waive", "Waive honorarium"], ["other", "Other / separately reviewed"]], screening.preferredPaymentRail || "wise")}</select></label>
              <label><span>Screening outcome</span><select name="screeningOutcome" required>${selectOptions([["pass", "Pass"], ["pause", "Pause"], ["decline", "Decline"]], screening.screeningOutcome || "pass")}</select></label>
            </div>
            <label class="check-row"><input name="identityConfirmed" type="checkbox" ${checked(screening.identityConfirmed)} required><span>Identity confirmed.</span></label>
            <label class="check-row"><input name="professionalRouteConfirmed" type="checkbox" ${checked(screening.professionalRouteConfirmed)} required><span>Professional contact route confirmed.</span></label>
            <label class="check-row"><input name="operatorCoverageAvailable" type="checkbox" ${checked(screening.operatorCoverageAvailable)} required><span>Live operator coverage is available for the proposed window.</span></label>
            <label class="full-width"><span>Minimum necessary conflict notes</span><textarea name="conflictNotes" rows="3" maxlength="2000">${escapeHtml(screening.conflictNotes || "")}</textarea></label>
            <label class="full-width"><span>Accessibility, browser, or device needs</span><textarea name="accessibilityOrDeviceNeeds" rows="3" maxlength="2000">${escapeHtml(screening.accessibilityOrDeviceNeeds || "")}</textarea></label>
          </fieldset>

          <fieldset>
            <legend>Final consent and staffed session window</legend>
            <label class="check-row"><input name="scopeAndDataTermsRead" type="checkbox" ${checked(consent.scopeAndDataTermsRead)} required><span>Participant confirmed that the H-11 scope and data terms were read.</span></label>
            <label class="check-row"><input name="syntheticScoresExcluded" type="checkbox" ${checked(consent.syntheticScoresExcluded)} required><span>Participant confirmed that synthetic scores are excluded from research use.</span></label>
            <label class="check-row"><input name="auditTrailAndNotesConsented" type="checkbox" ${checked(consent.auditTrailAndNotesConsented)} required><span>Participant consented to the private audit trail and de-identified internal usability notes.</span></label>
            <label class="check-row"><input name="voluntaryAndMayStop" type="checkbox" ${checked(consent.voluntaryAndMayStop)} required><span>Participant confirmed that participation is voluntary and may be stopped.</span></label>
            <label class="full-width"><span>Private consent-confirmation reference</span><input name="confirmationReference" value="${escapeHtml(consent.confirmationReference || "")}" minlength="12" maxlength="240" required><small class="field-help">Use a private thread/message reference; do not paste the participant's full message or credentials.</small></label>
            <div class="evidence-scale-grid">
              <label><span>Session start</span><input name="startAt" type="datetime-local" value="${escapeHtml(startDefault)}" required></label>
              <label><span>Session end</span><input name="endAt" type="datetime-local" value="${escapeHtml(endDefault)}" required></label>
              <label><span>Time zone</span><input name="timeZone" value="${escapeHtml(session.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")}" required></label>
            </div>
            <label class="check-row"><input name="supportRouteConfirmed" type="checkbox" ${checked(session.supportRouteConfirmed)} required><span>Private live support route confirmed for the session.</span></label>
          </fieldset>

          <fieldset>
            <legend>Exact protected external-access preflight</legend>
            <div class="evidence-scale-grid">
              <label><span>Accepted release SHA</span><input name="releaseSha" value="${escapeHtml(external.releaseSha || "")}" pattern="[a-fA-F0-9]{40}" required></label>
              <label><span>Exact Vercel deployment ID</span><input name="deploymentId" value="${escapeHtml(external.deploymentId || "")}" pattern="dpl_[A-Za-z0-9]{12,156}" required></label>
              <label><span>Schema version</span><input name="schemaVersion" type="number" min="4" max="4" value="4" readonly required></label>
              <label><span>Protected share-link expiry</span><input name="shareLinkExpiresAt" type="datetime-local" value="${escapeHtml(shareExpiryDefault)}" required></label>
            </div>
            <label class="check-row"><input name="syntheticOnlyPurposeConfirmed" type="checkbox" ${checked(external.syntheticOnlyPurposeConfirmed)} required><span>Exact release purpose is <code>synthetic_rehearsal_only</code>.</span></label>
            <label class="check-row"><input name="researchRatingsAuthorizedFalseConfirmed" type="checkbox" ${checked(external.researchRatingsAuthorizedFalseConfirmed)} required><span>Exact release reports <code>research_ratings_authorized=false</code>.</span></label>
            <label class="check-row"><input name="noOpenP0P1Defect" type="checkbox" ${checked(external.noOpenP0P1Defect)} required><span>No P0/P1 defect, integrity alert, or incident is open.</span></label>
            <label class="check-row"><input name="shareLinkCreatedWithin23Hours" type="checkbox" ${checked(external.shareLinkCreatedWithin23Hours)} required><span>Fresh protected share URL was created no more than 23 hours before the session.</span></label>
            <label class="check-row"><input name="signedOutIncognitoJourneyPassed" type="checkbox" ${checked(external.signedOutIncognitoJourneyPassed)} required><span>Normal signed-out/incognito external browser journey passed.</span></label>
            <label class="check-row"><input name="noOperatorOrCrossIdentityExposure" type="checkbox" ${checked(external.noOperatorOrCrossIdentityExposure)} required><span>External path exposed no operator session, other identity, assignment, or reusable application token.</span></label>
            <label class="check-row"><input name="controlIdentityJourneyPassed" type="checkbox" ${checked(external.controlIdentityJourneyPassed)} required><span>Combined external journey passed with a separate synthetic control identity.</span></label>
          </fieldset>

          <fieldset>
            <legend>Separate owner authorization</legend>
            <label><span>Owner access-authorization reference</span><input name="ownerAuthorizationReference" value="${escapeHtml(p.ownerAuthorizationReference || "")}" minlength="12" maxlength="240" required><small class="field-help">This must refer to a separate owner decision authorizing access issuance for this recipient and exact window.</small></label>
            <label class="full-width"><span>Minimum necessary private notes</span><textarea name="notes" rows="3" maxlength="4000">${escapeHtml(p.notes || "")}</textarea></label>
          </fieldset>

          <div class="support-callout">
            <strong>Still no access issuance</strong>
            <span>Submitting this form records an immutable private gate. Use the separate invitation control only after the record returns ready. Never store the share URL or application token here.</span>
          </div>
          <div class="evidence-actions">
            <button class="primary-button" type="submit">Record immutable H-11 access gate</button>
            <p class="form-status" role="status"></p>
          </div>`;

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const data = new FormData(form);
          const status = form.querySelector(".form-status");
          const submit = form.querySelector('button[type="submit"]');
          const bool = (name) => data.get(name) === "on";
          submit.disabled = true;
          status.textContent = "Recording H-11 access gate…";
          status.className = "form-status";
          try {
            const payload = {
              recipientSlot: data.get("recipientSlot"),
              screening: {
                identityConfirmed: bool("identityConfirmed"),
                professionalRouteConfirmed: bool("professionalRouteConfirmed"),
                exactSyntheticItemExposure: data.get("exactSyntheticItemExposure"),
                stagingInterfaceExposure: data.get("stagingInterfaceExposure"),
                conflictStatus: data.get("conflictStatus"),
                conflictNotes: data.get("conflictNotes") || "",
                countryOfTaxResidence: data.get("countryOfTaxResidence") || "",
                countryOfWorkForSession: data.get("countryOfWorkForSession") || "",
                sanctionsScreening: data.get("sanctionsScreening"),
                honorariumEligibility: data.get("honorariumEligibility"),
                preferredPaymentRail: data.get("preferredPaymentRail"),
                accessibilityOrDeviceNeeds: data.get("accessibilityOrDeviceNeeds") || "",
                operatorCoverageAvailable: bool("operatorCoverageAvailable"),
                screeningOutcome: data.get("screeningOutcome"),
              },
              finalConsent: {
                scopeAndDataTermsRead: bool("scopeAndDataTermsRead"),
                syntheticScoresExcluded: bool("syntheticScoresExcluded"),
                auditTrailAndNotesConsented: bool("auditTrailAndNotesConsented"),
                voluntaryAndMayStop: bool("voluntaryAndMayStop"),
                confirmationReference: data.get("confirmationReference") || "",
              },
              session: {
                startAt: new Date(data.get("startAt")).toISOString(),
                endAt: new Date(data.get("endAt")).toISOString(),
                timeZone: data.get("timeZone") || "",
                supportRouteConfirmed: bool("supportRouteConfirmed"),
              },
              externalPreflight: {
                releaseSha: data.get("releaseSha") || "",
                deploymentId: data.get("deploymentId") || "",
                schemaVersion: Number(data.get("schemaVersion")),
                syntheticOnlyPurposeConfirmed: bool("syntheticOnlyPurposeConfirmed"),
                researchRatingsAuthorizedFalseConfirmed: bool("researchRatingsAuthorizedFalseConfirmed"),
                noOpenP0P1Defect: bool("noOpenP0P1Defect"),
                shareLinkCreatedWithin23Hours: bool("shareLinkCreatedWithin23Hours"),
                signedOutIncognitoJourneyPassed: bool("signedOutIncognitoJourneyPassed"),
                noOperatorOrCrossIdentityExposure: bool("noOperatorOrCrossIdentityExposure"),
                controlIdentityJourneyPassed: bool("controlIdentityJourneyPassed"),
                shareLinkExpiresAt: new Date(data.get("shareLinkExpiresAt")).toISOString(),
              },
              ownerAuthorizationReference: data.get("ownerAuthorizationReference") || "",
              notes: data.get("notes") || "",
            };
            await api("h11.access.gate.record", {
              method: "POST",
              body: { identityId: identity.id, assignmentId: assignment.id, payload },
            });
            status.textContent = "H-11 access gate recorded.";
            await loadWorkspace();
          } catch (error) {
            status.textContent = error.message;
            status.className = "form-status error-message";
          } finally {
            submit.disabled = false;
          }
        });
        card.append(form);
        panel.append(card);
      }
      elements.workspaceContent.append(panel);
    }

    function checked(value) {
      return value === true ? "checked" : "";
    }

    function selectOptions(options, selectedValue) {
      return options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
    }

    function toLocalDateTimeValue(value) {
      const date = value instanceof Date ? value : new Date(value);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
      return local.toISOString().slice(0, 16);
    }

    ''')
    replace_once(
        "staging/app.mjs",
        '''function renderOperatorParticipantEvidence() {''',
        access_ui + '''function renderOperatorParticipantEvidence() {''',
    )

    append_once(
        "staging/participant-readiness.css",
        ".access-gate-panel {",
        dedent(r'''
        .access-gate-panel {
          border-color: #b6c7d8;
          background:
            linear-gradient(145deg, rgba(244, 248, 252, 0.98), rgba(255, 255, 255, 0.98)),
            var(--paper);
        }

        .access-gate-card {
          margin-top: 16px;
        }

        .access-gate-form {
          padding-top: 18px;
          border-top: 1px solid var(--line);
        }

        .access-gate-summary {
          margin-bottom: 18px;
        }

        .access-gate-summary dl > div {
          grid-template-columns: minmax(125px, 0.24fr) minmax(0, 1fr);
        }

        .h11-access-gate-form code,
        .access-gate-summary code {
          overflow-wrap: anywhere;
        }

        @media (max-width: 700px) {
          .access-gate-card {
            padding: 16px;
          }
        }
        '''),
    )

    # Focused contract test.
    write(
        "test/h11-access-gate-contract.test.mjs",
        dedent(r'''
        import assert from "node:assert/strict";
        import { mkdtemp } from "node:fs/promises";
        import { tmpdir } from "node:os";
        import { join } from "node:path";
        import test from "node:test";

        import { FileEventStore } from "../src/staging-event-store.mjs";
        import { StagingWorkflowService } from "../src/staging-service.mjs";

        test("H-11 access invitations fail closed until exact screening, consent, session, external preflight, and owner authorization pass", async () => {
          const harness = await makeHarness();
          const bootstrap = await harness.service.bootstrap({ bootstrapToken: "h11-test-bootstrap", expectedBootstrapToken: "h11-test-bootstrap" });
          const operator = await harness.service.redeemInvite({ token: bootstrap.inviteToken });
          const participant = await harness.service.createIdentity({
            actorSessionToken: operator.sessionToken,
            role: "rater",
            purpose: "h11_human_usability",
            displayName: "Qualified H-11 participant",
            email: "qualified-participant@example.test",
          });
          assert.equal(participant.identity.purpose, "h11_human_usability");

          const assignment = await harness.service.createAssignment({
            actorSessionToken: operator.sessionToken,
            identityId: participant.identity.id,
            positionId: bootstrap.positionId,
            kind: "initial",
          });

          await assert.rejects(
            () => harness.service.createInvite({ actorSessionToken: operator.sessionToken, identityId: participant.identity.id, expiresInHours: 2 }),
            (error) => error.status === 409 && error.code === "h11_access_gate_required",
          );

          await assert.rejects(
            () => harness.service.recordH11AccessGate({
              actorSessionToken: operator.sessionToken,
              identityId: participant.identity.id,
              assignmentId: assignment.assignment.id,
              payload: { ...makeAccessGate(harness.now()), finalConsent: { ...makeAccessGate(harness.now()).finalConsent, voluntaryAndMayStop: false } },
            }),
            (error) => error.status === 400 && error.code === "h11_access_gate_incomplete",
          );

          const firstPayload = makeAccessGate(harness.now());
          const first = await harness.service.recordH11AccessGate({
            actorSessionToken: operator.sessionToken,
            identityId: participant.identity.id,
            assignmentId: assignment.assignment.id,
            payload: firstPayload,
          });
          assert.equal(first.replay, false);
          assert.equal((await harness.service.recordH11AccessGate({
            actorSessionToken: operator.sessionToken,
            identityId: participant.identity.id,
            assignmentId: assignment.assignment.id,
            payload: firstPayload,
          })).replay, true);

          const invite = await harness.service.createInvite({
            actorSessionToken: operator.sessionToken,
            identityId: participant.identity.id,
            expiresInHours: 2,
          });
          assert.equal(invite.invite.h11AccessGateId, first.record.id);
          assert.equal(invite.invite.assignmentId, assignment.assignment.id);

          const supersedingPayload = makeAccessGate(harness.now(), {
            deploymentId: "dpl_h11supersedingdeployment000002",
            ownerAuthorizationReference: "H11-TEST-OWNER-AUTHORIZATION-0002",
          });
          const superseding = await harness.service.recordH11AccessGate({
            actorSessionToken: operator.sessionToken,
            identityId: participant.identity.id,
            assignmentId: assignment.assignment.id,
            payload: supersedingPayload,
          });
          assert.equal(superseding.record.supersedesId, first.record.id);

          await assert.rejects(
            () => harness.service.redeemInvite({ token: invite.token }),
            (error) => error.status === 401 && error.code === "h11_access_gate_superseded",
          );

          const replacement = await harness.service.replaceInvite({
            actorSessionToken: operator.sessionToken,
            inviteId: invite.invite.id,
            expiresInHours: 2,
          });
          const session = await harness.service.redeemInvite({ token: replacement.token });
          assert.equal(session.identity.id, participant.identity.id);

          const operatorWorkspace = await harness.service.getWorkspace(operator.sessionToken);
          assert.equal(operatorWorkspace.h11AccessGates.length, 2);
          const privateExport = await harness.service.operatorExport({ actorSessionToken: operator.sessionToken, publicOnly: false });
          const publicExport = await harness.service.operatorExport({ actorSessionToken: operator.sessionToken, publicOnly: true });
          assert.equal(privateExport.state.h11AccessGates.length, 2);
          assert.ok(JSON.stringify(privateExport).includes("qualified-participant@example.test"));
          assert.ok(JSON.stringify(privateExport).includes("H11-TEST-OWNER-AUTHORIZATION-0002"));
          assert.equal(JSON.stringify(publicExport).includes("qualified-participant@example.test"), false);
          assert.equal(JSON.stringify(publicExport).includes("H11-TEST-OWNER-AUTHORIZATION-0002"), false);
          assert.equal(JSON.stringify(publicExport).includes("United States"), false);
        });

        test("real-email raters require an explicit H-11 purpose while synthetic automation remains .invalid-only", async () => {
          const harness = await makeHarness();
          const bootstrap = await harness.service.bootstrap({ bootstrapToken: "h11-purpose-bootstrap", expectedBootstrapToken: "h11-purpose-bootstrap" });
          const operator = await harness.service.redeemInvite({ token: bootstrap.inviteToken });

          await assert.rejects(
            () => harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", displayName: "Unclassified", email: "unclassified@example.test" }),
            (error) => error.status === 400 && error.code === "identity_purpose_required",
          );
          await assert.rejects(
            () => harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", purpose: "synthetic_automation", displayName: "Misclassified", email: "real-looking@example.test" }),
            (error) => error.status === 400 && error.code === "synthetic_identity_email_required",
          );
          const synthetic = await harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", displayName: "Synthetic", email: "synthetic@example.invalid" });
          assert.equal(synthetic.identity.purpose, "synthetic_automation");
        });

        async function makeHarness() {
          const directory = await mkdtemp(join(tmpdir(), "metaphilosophy-h11-access-gate-"));
          const store = new FileEventStore({ filePath: join(directory, "events.jsonl") });
          let current = new Date("2026-08-07T10:00:00.000Z");
          const service = new StagingWorkflowService({ store, now: () => new Date(current) });
          await service.initialize();
          return {
            service,
            now: () => new Date(current),
            advanceMinutes(minutes) { current = new Date(current.getTime() + minutes * 60 * 1000); },
          };
        }

        function makeAccessGate(now, overrides = {}) {
          const start = new Date(now.getTime() - 5 * 60 * 1000);
          const end = new Date(now.getTime() + 3 * 60 * 60 * 1000);
          const shareExpiry = new Date(now.getTime() + 4 * 60 * 60 * 1000);
          return {
            recipientSlot: "A",
            screening: {
              identityConfirmed: true,
              professionalRouteConfirmed: true,
              exactSyntheticItemExposure: "no",
              stagingInterfaceExposure: "no",
              conflictStatus: "none_declared",
              conflictNotes: "No conflict or institutional restriction was declared in the private screening record.",
              countryOfTaxResidence: "United States",
              countryOfWorkForSession: "United States",
              sanctionsScreening: "pass",
              honorariumEligibility: "pass",
              preferredPaymentRail: "wise",
              accessibilityOrDeviceNeeds: "No additional needs declared.",
              operatorCoverageAvailable: true,
              screeningOutcome: "pass",
            },
            finalConsent: {
              scopeAndDataTermsRead: true,
              syntheticScoresExcluded: true,
              auditTrailAndNotesConsented: true,
              voluntaryAndMayStop: true,
              confirmationReference: "H11-TEST-CONSENT-CONFIRMATION-0001",
            },
            session: {
              startAt: start.toISOString(),
              endAt: end.toISOString(),
              timeZone: "America/New_York",
              supportRouteConfirmed: true,
            },
            externalPreflight: {
              releaseSha: "a".repeat(40),
              deploymentId: overrides.deploymentId ?? "dpl_h11syntheticdeployment000001",
              schemaVersion: 4,
              syntheticOnlyPurposeConfirmed: true,
              researchRatingsAuthorizedFalseConfirmed: true,
              noOpenP0P1Defect: true,
              shareLinkCreatedWithin23Hours: true,
              signedOutIncognitoJourneyPassed: true,
              noOperatorOrCrossIdentityExposure: true,
              controlIdentityJourneyPassed: true,
              shareLinkExpiresAt: shareExpiry.toISOString(),
            },
            ownerAuthorizationReference: overrides.ownerAuthorizationReference ?? "H11-TEST-OWNER-AUTHORIZATION-0001",
            notes: "Synthetic contract-test record only; no human was contacted and no research rating was authorized.",
          };
        }
        ''').strip() + "\n",
    )

    # E2E: exercise the access gate with both H-11 identities.
    old_setup = dedent('''
      const raterA = await api(operatorRequest, "identity.create", { method: "POST", headers, data: { role: "rater", displayName: "Synthetic browser rater A", email: "browser-a@staging.metaphilosophy.invalid" } });
      const raterB = await api(operatorRequest, "identity.create", { method: "POST", headers, data: { role: "rater", displayName: "Synthetic browser rater B", email: "browser-b@staging.metaphilosophy.invalid" } });
      const adjudicator = await api(operatorRequest, "identity.create", { method: "POST", headers, data: { role: "adjudicator", displayName: "Synthetic browser adjudicator", email: "browser-adjudicator@staging.metaphilosophy.invalid" } });

      const inviteA = await api(operatorRequest, "invite.create", { method: "POST", headers, data: { identityId: raterA.identity.id, expiresInHours: 24 } });
      const inviteB = await api(operatorRequest, "invite.create", { method: "POST", headers, data: { identityId: raterB.identity.id, expiresInHours: 24 } });
      const inviteAdjudicator = await api(operatorRequest, "invite.create", { method: "POST", headers, data: { identityId: adjudicator.identity.id, expiresInHours: 24 } });
      const assignmentA = await api(operatorRequest, "assignment.create", { method: "POST", headers, data: { identityId: raterA.identity.id, positionId: bootstrap.positionId, kind: "initial" } });
      const assignmentB = await api(operatorRequest, "assignment.create", { method: "POST", headers, data: { identityId: raterB.identity.id, positionId: bootstrap.positionId, kind: "initial" } });
    ''')
    new_setup = dedent('''
      const raterA = await api(operatorRequest, "identity.create", { method: "POST", headers, data: { role: "rater", purpose: "h11_human_usability", displayName: "Synthetic browser rater A", email: "browser-a@example.test" } });
      const raterB = await api(operatorRequest, "identity.create", { method: "POST", headers, data: { role: "rater", purpose: "h11_human_usability", displayName: "Synthetic browser rater B", email: "browser-b@example.test" } });
      const adjudicator = await api(operatorRequest, "identity.create", { method: "POST", headers, data: { role: "adjudicator", purpose: "synthetic_adjudication", displayName: "Synthetic browser adjudicator", email: "browser-adjudicator@staging.metaphilosophy.invalid" } });

      const assignmentA = await api(operatorRequest, "assignment.create", { method: "POST", headers, data: { identityId: raterA.identity.id, positionId: bootstrap.positionId, kind: "initial" } });
      const assignmentB = await api(operatorRequest, "assignment.create", { method: "POST", headers, data: { identityId: raterB.identity.id, positionId: bootstrap.positionId, kind: "initial" } });

      const blockedInvite = await operatorRequest.post("/api/staging?action=invite.create", {
        headers,
        data: { identityId: raterA.identity.id, expiresInHours: 2 },
      });
      expect(blockedInvite.status()).toBe(409);
      expect((await blockedInvite.json()).error.code).toBe("h11_access_gate_required");

      const gateA = await api(operatorRequest, "h11.access.gate.record", { method: "POST", headers, data: { identityId: raterA.identity.id, assignmentId: assignmentA.assignment.id, payload: makeH11AccessGatePayload("A") } });
      const gateB = await api(operatorRequest, "h11.access.gate.record", { method: "POST", headers, data: { identityId: raterB.identity.id, assignmentId: assignmentB.assignment.id, payload: makeH11AccessGatePayload("B") } });
      const inviteA = await api(operatorRequest, "invite.create", { method: "POST", headers, data: { identityId: raterA.identity.id, expiresInHours: 2 } });
      const inviteB = await api(operatorRequest, "invite.create", { method: "POST", headers, data: { identityId: raterB.identity.id, expiresInHours: 2 } });
      const inviteAdjudicator = await api(operatorRequest, "invite.create", { method: "POST", headers, data: { identityId: adjudicator.identity.id, expiresInHours: 24 } });
      expect(inviteA.invite.h11AccessGateId).toBe(gateA.record.id);
      expect(inviteB.invite.h11AccessGateId).toBe(gateB.record.id);
    ''')
    replace_once("e2e/human-workflow-staging.spec.mjs", old_setup, new_setup)
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''  await expect(operatorPage.locator('[data-queue="participant-evidence"]')).toContainText("Synthetic browser rater A");''',
        '''  await expect(operatorPage.locator('[data-queue="access-preflight"]')).toContainText("Synthetic browser rater A");
  await expect(operatorPage.locator('[data-queue="access-preflight"]')).toContainText("Synthetic browser rater B");
  await expect(operatorPage.locator('[data-queue="access-preflight"]')).toContainText("Access preflight ready");
  await expect(operatorPage.locator('[data-queue="participant-evidence"]')).toContainText("Synthetic browser rater A");''',
    )
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''  expect(privateExport.state.participantEvidence).toHaveLength(4);''',
        '''  expect(privateExport.state.h11AccessGates).toHaveLength(2);
  expect(privateExport.state.h11AccessGates.every((record) => record.version === "H11-ACCESS-GATE-2026-08-07-V1")).toBe(true);
  expect(privateExport.state.participantEvidence).toHaveLength(4);''',
    )
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''  expect(JSON.stringify(publicExport)).not.toContain("@staging.metaphilosophy.invalid");''',
        '''  expect(JSON.stringify(publicExport)).not.toContain("@staging.metaphilosophy.invalid");
  expect(JSON.stringify(publicExport)).not.toContain("browser-a@example.test");
  expect(JSON.stringify(publicExport)).not.toContain("H11-E2E-OWNER-AUTHORIZATION");''',
    )
    e2e_helper = dedent(r'''
    function makeH11AccessGatePayload(recipientSlot) {
      const now = Date.now();
      return {
        recipientSlot,
        screening: {
          identityConfirmed: true,
          professionalRouteConfirmed: true,
          exactSyntheticItemExposure: "no",
          stagingInterfaceExposure: "no",
          conflictStatus: "none_declared",
          conflictNotes: "Synthetic rendered-browser rehearsal only.",
          countryOfTaxResidence: "United States",
          countryOfWorkForSession: "United States",
          sanctionsScreening: "pass",
          honorariumEligibility: "pass",
          preferredPaymentRail: "wise",
          accessibilityOrDeviceNeeds: "No additional needs in the synthetic browser rehearsal.",
          operatorCoverageAvailable: true,
          screeningOutcome: "pass",
        },
        finalConsent: {
          scopeAndDataTermsRead: true,
          syntheticScoresExcluded: true,
          auditTrailAndNotesConsented: true,
          voluntaryAndMayStop: true,
          confirmationReference: `H11-E2E-CONSENT-${recipientSlot}-0001`,
        },
        session: {
          startAt: new Date(now - 5 * 60 * 1000).toISOString(),
          endAt: new Date(now + 3 * 60 * 60 * 1000).toISOString(),
          timeZone: "UTC",
          supportRouteConfirmed: true,
        },
        externalPreflight: {
          releaseSha: "b".repeat(40),
          deploymentId: `dpl_h11browserdeployment${recipientSlot}000001`,
          schemaVersion: 4,
          syntheticOnlyPurposeConfirmed: true,
          researchRatingsAuthorizedFalseConfirmed: true,
          noOpenP0P1Defect: true,
          shareLinkCreatedWithin23Hours: true,
          signedOutIncognitoJourneyPassed: true,
          noOperatorOrCrossIdentityExposure: true,
          controlIdentityJourneyPassed: true,
          shareLinkExpiresAt: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
        },
        ownerAuthorizationReference: `H11-E2E-OWNER-AUTHORIZATION-${recipientSlot}-0001`,
        notes: "Synthetic rendered-browser evidence only; no human participant or research rating.",
      };
    }

    ''')
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''async function completeSyntheticConsent(page) {''',
        e2e_helper + '''async function completeSyntheticConsent(page) {''',
    )

    # Static verifier.
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''  "e2e/human-workflow-staging.spec.mjs",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v1.sql",''',
        '''  "e2e/human-workflow-staging.spec.mjs",
  "test/h11-access-gate-contract.test.mjs",
  "ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v1.sql",''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["api/staging.mjs"], /participant\\.evidence\\.record/);''',
        '''assert.match(contents["api/staging.mjs"], /participant\\.evidence\\.record/);
assert.match(contents["api/staging.mjs"], /h11\\.access\\.gate\\.record/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["src/staging-service.mjs"], /H11-DEBRIEF-2026-08-07-V1/);''',
        '''assert.match(contents["src/staging-service.mjs"], /H11-DEBRIEF-2026-08-07-V1/);
assert.match(contents["src/staging-service.mjs"], /H11-ACCESS-GATE-2026-08-07-V1/);
assert.match(contents["src/staging-service.mjs"], /h11\\.access\\.gate\\.recorded/);
assert.match(contents["src/staging-service.mjs"], /h11_access_gate_required/);
assert.match(contents["src/staging-service.mjs"], /h11_access_gate_superseded/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["staging/app.mjs"], /Consent and debrief records/);''',
        '''assert.match(contents["staging/app.mjs"], /Consent and debrief records/);
assert.match(contents["staging/app.mjs"], /H-11 access issuance gate/);
assert.match(contents["staging/app.mjs"], /Record immutable H-11 access gate/);
assert.match(contents["staging/app.mjs"], /Still no access issuance/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /participantEvidence/);''',
        '''assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /participantEvidence/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /h11AccessGates/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /h11_access_gate_required/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /H-11 access invitations fail closed/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_access_gate_superseded/);''',
    )

    # Standard gate covers the new contract test.
    replace_once(
        ".github/workflows/metaphilosophy-human-workflow-staging.yml",
        '''      - "test/human-workflow-staging-contract.test.mjs"
      - "test/hosted-staging-gateway-contract.test.mjs"''',
        '''      - "test/human-workflow-staging-contract.test.mjs"
      - "test/h11-access-gate-contract.test.mjs"
      - "test/hosted-staging-gateway-contract.test.mjs"''',
    )
    # The same path block appears twice (push and pull_request); replace second occurrence.
    replace_once(
        ".github/workflows/metaphilosophy-human-workflow-staging.yml",
        '''      - "test/human-workflow-staging-contract.test.mjs"
      - "test/hosted-staging-gateway-contract.test.mjs"''',
        '''      - "test/human-workflow-staging-contract.test.mjs"
      - "test/h11-access-gate-contract.test.mjs"
      - "test/hosted-staging-gateway-contract.test.mjs"''',
    )
    replace_once(
        ".github/workflows/metaphilosophy-human-workflow-staging.yml",
        '''          node --check test/hosted-staging-gateway-contract.test.mjs
          node --check e2e/human-workflow-staging.spec.mjs''',
        '''          node --check test/hosted-staging-gateway-contract.test.mjs
          node --check test/h11-access-gate-contract.test.mjs
          node --check e2e/human-workflow-staging.spec.mjs''',
    )
    replace_once(
        ".github/workflows/metaphilosophy-human-workflow-staging.yml",
        '''        run: node --test test/human-workflow-staging-contract.test.mjs test/hosted-staging-gateway-contract.test.mjs''',
        '''        run: node --test test/human-workflow-staging-contract.test.mjs test/h11-access-gate-contract.test.mjs test/hosted-staging-gateway-contract.test.mjs''',
    )

    # Operational record.
    write(
        "ops/next-steps-2026-07-23/h11-fail-closed-access-issuance-gate-2026-08-07.md",
        dedent(r'''
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
        ''').strip() + "\n",
    )

    # Remove one-shot automation from the validated product commit.
    (ROOT / ".github/apply_h11_access_gate_v1.py").unlink(missing_ok=True)
    (ROOT / ".github/workflows/apply-h11-access-gate-v1.yml").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
