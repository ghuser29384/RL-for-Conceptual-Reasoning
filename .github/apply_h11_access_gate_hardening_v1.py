#!/usr/bin/env python3
from __future__ import annotations

import os
from pathlib import Path
from textwrap import dedent

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
        raise RuntimeError(f"{path}: expected one anchor, found {count}: {old[:180]!r}")
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
        ("src/staging-service.mjs", "h11_active_invite_exists"),
        ("test/h11-access-gate-contract.test.mjs", "legacy real-email rater invitations remain blocked"),
    ]:
        if marker in read(path):
            raise RuntimeError(f"Prior or partial hardening found in {path}")

    replace_once(
        "src/staging-service.mjs",
        dedent('''
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
        '''),
        dedent('''
          async createInvite({ actorSessionToken, identityId, expiresInHours = this.inviteTtlHours }) {
            const actor = await this.requireRole(actorSessionToken, "operator");
            const state = await this.state();
            const identity = activeIdentity(state, identityId);
            const now = this.now();
            const gate = resolveInviteAccessGate(state, identity, now, expiresInHours);
            assertNoActiveH11Invite(state, identity.id, gate.metadata.h11AccessGateId ?? null, now);
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
        '''),
    )

    replace_once(
        "src/staging-service.mjs",
        '''    const identity = activeIdentity(state, invite.identityId);
    validateInviteAccessGateAtRedemption(state, invite, identity, now);
    const sessionToken = makeToken();''',
        '''    const identity = activeIdentity(state, invite.identityId);
    const h11SessionExpiresAt = validateInviteAccessGateAtRedemption(state, invite, identity, now, this.sessionTtlHours);
    const sessionToken = makeToken();''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''      expiresAt: addHours(now, this.sessionTtlHours).toISOString(),''',
        '''      expiresAt: h11SessionExpiresAt ?? addHours(now, this.sessionTtlHours).toISOString(),''',
    )

    replace_once(
        "src/staging-service.mjs",
        dedent('''
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
        '''),
        dedent('''
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
          if (value === "h11_human_usability" && isSyntheticEmail(email)) {
            throw serviceError(400, "human_identity_deliverable_email_required", "Qualified human H-11 identities may not use a synthetic .invalid email address.");
          }
          return value;
        }
        '''),
    )

    replace_once(
        "src/staging-service.mjs",
        dedent('''
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
        '''),
        dedent('''
        function validateRaterIdentityPurpose(identity, errorStatus) {
          const purpose = effectiveIdentityPurpose(identity);
          if (identity.role !== "rater") return purpose;
          if (purpose === "synthetic_automation") {
            if (!isSyntheticEmail(identity.email)) {
              throw serviceError(errorStatus, "synthetic_identity_email_required", "Synthetic automation access requires a non-deliverable .invalid identity.");
            }
            return purpose;
          }
          if (purpose === "h11_human_usability") {
            if (isSyntheticEmail(identity.email)) {
              throw serviceError(errorStatus, "human_identity_deliverable_email_required", "Qualified human H-11 access may not use a synthetic .invalid identity.");
            }
            return purpose;
          }
          throw serviceError(errorStatus, "identity_purpose_required", "Unclassified real-email rater access is blocked. Create or repair an explicitly H-11-classified identity before proceeding.");
        }

        function assertNoActiveH11Invite(state, identityId, h11AccessGateId, now) {
          if (!h11AccessGateId) return;
          const existing = state.invites.find((invite) => (
            invite.identityId === identityId
            && invite.h11AccessGateId === h11AccessGateId
            && !invite.usedAt
            && !invite.revokedAt
            && new Date(invite.expiresAt) > now
          ));
          if (existing) {
            throw serviceError(409, "h11_active_invite_exists", "An unused H-11 invitation already exists for this exact access gate. Revoke or replace it rather than issuing a second valid token.", {
              inviteId: existing.id,
              expiresAt: existing.expiresAt,
            });
          }
        }

        function resolveInviteAccessGate(state, identity, now, expiresInHours) {
          const purpose = validateRaterIdentityPurpose(identity, 409);
          if (identity.role !== "rater" || purpose === "synthetic_automation") return { expiresAt: null, metadata: {} };
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

        function validateInviteAccessGateAtRedemption(state, invite, identity, now, sessionTtlHours) {
          const purpose = validateRaterIdentityPurpose(identity, 401);
          if (identity.role !== "rater") {
            if (invite.h11AccessGateId) throw serviceError(401, "h11_identity_mismatch", "A non-rater identity cannot redeem an H-11 participant invitation.");
            return null;
          }
          if (purpose === "synthetic_automation") {
            if (invite.h11AccessGateId) throw serviceError(401, "h11_identity_mismatch", "A synthetic automation identity cannot redeem a human H-11 participant invitation.");
            return null;
          }
          if (!invite.h11AccessGateId) {
            throw serviceError(401, "h11_access_gate_required", "Qualified human H-11 access requires an invitation bound to the complete access gate.");
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
          const inviteExpiry = new Date(invite.expiresAt);
          if (now < start) throw serviceError(403, "h11_access_window_not_open", "The protected H-11 session window has not opened yet.");
          if (now >= end || now >= shareExpiry || now >= inviteExpiry) throw serviceError(401, "h11_access_window_closed", "The protected H-11 session, share-link, or invitation window has closed.");
          const ordinarySessionExpiry = addHours(now, sessionTtlHours);
          return new Date(Math.min(
            ordinarySessionExpiry.getTime(),
            end.getTime(),
            shareExpiry.getTime(),
            inviteExpiry.getTime(),
          )).toISOString();
        }
        '''),
    )

    # Contract tests for the newly discovered bypass and lifetime boundaries.
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''import assert from "node:assert/strict";''',
        '''import assert from "node:assert/strict";
import { createHash } from "node:crypto";''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  assert.equal(invite.invite.h11AccessGateId, first.record.id);
  assert.equal(invite.invite.assignmentId, assignment.assignment.id);

  const supersedingPayload''',
        '''  assert.equal(invite.invite.h11AccessGateId, first.record.id);
  assert.equal(invite.invite.assignmentId, assignment.assignment.id);
  await assert.rejects(
    () => harness.service.createInvite({ actorSessionToken: operator.sessionToken, identityId: participant.identity.id, expiresInHours: 2 }),
    (error) => error.status === 409 && error.code === "h11_active_invite_exists",
  );

  const supersedingPayload''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  const session = await harness.service.redeemInvite({ token: replacement.token });
  assert.equal(session.identity.id, participant.identity.id);''',
        '''  const session = await harness.service.redeemInvite({ token: replacement.token });
  assert.equal(session.identity.id, participant.identity.id);
  assert.equal(session.session.expiresAt, replacement.invite.expiresAt);
  assert.ok(new Date(session.session.expiresAt) <= new Date(superseding.record.payload.session.endAt));
  assert.ok(new Date(session.session.expiresAt) <= new Date(superseding.record.payload.externalPreflight.shareLinkExpiresAt));''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  await assert.rejects(
    () => harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", purpose: "synthetic_automation", displayName: "Misclassified", email: "real-looking@example.test" }),
    (error) => error.status === 400 && error.code === "synthetic_identity_email_required",
  );
  const synthetic = await harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", displayName: "Synthetic", email: "synthetic@example.invalid" });
  assert.equal(synthetic.identity.purpose, "synthetic_automation");
});''',
        '''  await assert.rejects(
    () => harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", purpose: "synthetic_automation", displayName: "Misclassified", email: "real-looking@example.test" }),
    (error) => error.status === 400 && error.code === "synthetic_identity_email_required",
  );
  await assert.rejects(
    () => harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", purpose: "h11_human_usability", displayName: "Fake human", email: "fake-human@example.invalid" }),
    (error) => error.status === 400 && error.code === "human_identity_deliverable_email_required",
  );
  const synthetic = await harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", displayName: "Synthetic", email: "synthetic@example.invalid" });
  assert.equal(synthetic.identity.purpose, "synthetic_automation");
  const syntheticInvite = await harness.service.createInvite({ actorSessionToken: operator.sessionToken, identityId: synthetic.identity.id, expiresInHours: 24 });
  const syntheticSession = await harness.service.redeemInvite({ token: syntheticInvite.token });
  assert.equal(new Date(syntheticSession.session.expiresAt).getTime() - harness.now().getTime(), 12 * 60 * 60 * 1000);
});

test("legacy real-email rater invitations remain blocked even when they predate explicit identity purposes", async () => {
  const harness = await makeHarness();
  const bootstrap = await harness.service.bootstrap({ bootstrapToken: "h11-legacy-bootstrap", expectedBootstrapToken: "h11-legacy-bootstrap" });
  const operator = await harness.service.redeemInvite({ token: bootstrap.inviteToken });
  const legacyIdentityId = "11111111-1111-4111-8111-111111111111";
  await harness.store.append({
    type: "identity.created",
    aggregateId: legacyIdentityId,
    actorId: operator.identity.id,
    payload: {
      id: legacyIdentityId,
      role: "rater",
      displayName: "Legacy unclassified real-email rater",
      email: "legacy-real-rater@example.test",
      status: "active",
    },
    createdAt: harness.now().toISOString(),
  });

  await assert.rejects(
    () => harness.service.createInvite({ actorSessionToken: operator.sessionToken, identityId: legacyIdentityId, expiresInHours: 2 }),
    (error) => error.status === 409 && error.code === "identity_purpose_required",
  );

  const legacyToken = "legacy-real-rater-invite-token-before-purpose-migration";
  const legacyInviteId = "22222222-2222-4222-8222-222222222222";
  await harness.store.append({
    type: "invite.created",
    aggregateId: legacyInviteId,
    actorId: operator.identity.id,
    payload: {
      id: legacyInviteId,
      identityId: legacyIdentityId,
      tokenHash: createHash("sha256").update(legacyToken).digest("hex"),
      createdAt: harness.now().toISOString(),
      expiresAt: new Date(harness.now().getTime() + 2 * 60 * 60 * 1000).toISOString(),
      usedAt: null,
      revokedAt: null,
      replacementInviteId: null,
    },
    createdAt: harness.now().toISOString(),
  });
  await assert.rejects(
    () => harness.service.redeemInvite({ token: legacyToken }),
    (error) => error.status === 401 && error.code === "identity_purpose_required",
  );
});''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  return {
    service,
    now: () => new Date(current),''',
        '''  return {
    service,
    store,
    now: () => new Date(current),''',
    )

    # Keep static verification from regressing these invariants.
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["src/staging-service.mjs"], /h11_access_gate_superseded/);''',
        '''assert.match(contents["src/staging-service.mjs"], /h11_access_gate_superseded/);
assert.match(contents["src/staging-service.mjs"], /h11_active_invite_exists/);
assert.match(contents["src/staging-service.mjs"], /human_identity_deliverable_email_required/);
assert.match(contents["src/staging-service.mjs"], /h11SessionExpiresAt/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_access_gate_superseded/);''',
        '''assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_access_gate_superseded/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_active_invite_exists/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /legacy real-email rater invitations remain blocked/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /human_identity_deliverable_email_required/);''',
    )

    append_once(
        "ops/next-steps-2026-07-23/h11-fail-closed-access-issuance-gate-2026-08-07.md",
        "## Post-implementation hardening",
        dedent('''
        ## Post-implementation hardening

        A second code review found and closed four residual access-boundary defects before deployment:

        1. an H-11 authenticated session could otherwise inherit the ordinary 12-hour session lifetime and survive beyond the approved session or share-link window;
        2. a legacy real-email rater identity without an explicit purpose could otherwise be treated as an ordinary non-H-11 identity during invitation issuance or redemption;
        3. a `.invalid` synthetic identity could otherwise be mislabeled as a qualified human H-11 identity; and
        4. the same current H-11 access gate could otherwise have more than one simultaneously valid unused invitation.

        The service now bounds an H-11 session to the earliest of the ordinary session TTL, the approved session end, the protected share-link expiry, and the one-time invitation expiry. It rejects unclassified real-email rater access at both issuance and redemption, requires synthetic and human identity classes to use non-overlapping email classes, and permits only one unused invitation for the same current gate. A superseding gate still invalidates every invitation bound to the earlier gate.
        '''),
    )

    (ROOT / ".github/apply_h11_access_gate_hardening_v1.py").unlink(missing_ok=True)
    (ROOT / ".github/workflows/apply-h11-access-gate-hardening-v1.yml").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
