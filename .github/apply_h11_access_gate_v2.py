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
        ("src/staging-service.mjs", "h11_active_session_exists"),
        ("src/staging-service.mjs", "H11-ACCESS-GATE-2026-08-07-V2"),
        ("test/h11-access-gate-contract.test.mjs", "gate supersession revokes an active H-11 session"),
    ]:
        if marker in read(path):
            raise RuntimeError(f"Prior or partial V2 patch found in {path}")

    replace_once(
        "src/staging-service.mjs",
        'const H11_ACCESS_GATE_VERSION = "H11-ACCESS-GATE-2026-08-07-V1";',
        'const H11_ACCESS_GATE_VERSION = "H11-ACCESS-GATE-2026-08-07-V2";',
    )

    replace_once(
        "api/staging.mjs",
        '''        case "h11.access.gate.record":
          requireMethod(req, "POST");
          result = await runtime.service.recordH11AccessGate({ actorSessionToken: sessionToken, ...body });
          break;''',
        '''        case "h11.access.gate.record":
          requireMethod(req, "POST");
          result = await runtime.service.recordH11AccessGate({
            actorSessionToken: sessionToken,
            ...body,
            expectedReleaseSha: runtime.environment.VERCEL_GIT_COMMIT_SHA ?? null,
          });
          break;''',
    )

    replace_once(
        "src/staging-service.mjs",
        '''    const gate = resolveInviteAccessGate(state, identity, this.now(), expiresInHours);
    if (!invite.revokedAt && !invite.usedAt) {''',
        '''    const now = this.now();
    const gate = resolveInviteAccessGate(state, identity, now, expiresInHours);
    assertNoActiveH11Invite(state, identity.id, gate.metadata.h11AccessGateId ?? null, now, invite.id);
    if (!invite.revokedAt && !invite.usedAt) {''',
    )

    replace_once(
        "src/staging-service.mjs",
        '''    const h11SessionExpiresAt = validateInviteAccessGateAtRedemption(state, invite, identity, now, this.sessionTtlHours);
    const sessionToken = makeToken();''',
        '''    const h11Access = validateInviteAccessGateAtRedemption(state, invite, identity, now, this.sessionTtlHours);
    const sessionToken = makeToken();''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''      createdAt: now.toISOString(),
      expiresAt: h11SessionExpiresAt ?? addHours(now, this.sessionTtlHours).toISOString(),
      revokedAt: null,
      userAgentHash: userAgent ? createHash("sha256").update(String(userAgent)).digest("hex") : null,''',
        '''      createdAt: now.toISOString(),
      expiresAt: h11Access?.expiresAt ?? addHours(now, this.sessionTtlHours).toISOString(),
      revokedAt: null,
      purpose: effectiveIdentityPurpose(identity),
      h11AccessGateId: h11Access?.h11AccessGateId ?? null,
      assignmentId: h11Access?.assignmentId ?? null,
      packetHash: h11Access?.packetHash ?? null,
      userAgentHash: userAgent ? createHash("sha256").update(String(userAgent)).digest("hex") : null,''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''      event("audit.recorded", randomUUID(), identity.id, { action: "invite.redeemed", subjectId: invite.id }, now.toISOString()),''',
        '''      event("audit.recorded", randomUUID(), identity.id, {
        action: "invite.redeemed",
        subjectId: invite.id,
        h11AccessGateId: session.h11AccessGateId,
        assignmentId: session.assignmentId,
        sessionExpiresAt: session.expiresAt,
      }, now.toISOString()),''',
    )

    replace_once(
        "src/staging-service.mjs",
        '''  async recordH11AccessGate({ actorSessionToken, identityId, assignmentId, payload }) {''',
        '''  async recordH11AccessGate({ actorSessionToken, identityId, assignmentId, payload, expectedReleaseSha = null }) {''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''    const normalized = normalizeH11AccessGate(payload, this.now());
    const prior = latestH11AccessGate(state, identity.id, assignment.id);''',
        '''    const normalized = normalizeH11AccessGate(payload, this.now());
    if (expectedReleaseSha && normalized.externalPreflight.releaseSha !== String(expectedReleaseSha).trim().toLowerCase()) {
      throw serviceError(409, "h11_release_sha_mismatch", "The recorded release SHA does not match the exact runtime commit serving this protected staging environment.");
    }
    const prior = latestH11AccessGate(state, identity.id, assignment.id);''',
    )
    replace_once(
        "src/staging-service.mjs",
        dedent('''
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
        '''),
        dedent('''
            const sessionsToRevoke = state.sessions.filter((session) => (
              session.identityId === identity.id
              && !session.revokedAt
              && new Date(session.expiresAt) > new Date(recordedAt)
            ));
            await this.store.appendMany([
              event("h11.access.gate.recorded", record.id, actor.identity.id, record, recordedAt),
              ...sessionsToRevoke.map((session) => event("session.revoked", session.id, actor.identity.id, {
                sessionId: session.id,
                revokedAt: recordedAt,
                reason: "h11_access_gate_superseded",
              }, recordedAt)),
              event("audit.recorded", randomUUID(), actor.identity.id, {
                action: "h11.access.gate.recorded",
                subjectId: record.id,
                identityId: identity.id,
                assignmentId: assignment.id,
                packetHash: assignment.packetHash,
                version: record.version,
                supersedesId: record.supersedesId,
                invalidatedSessionIds: sessionsToRevoke.map((session) => session.id),
              }, recordedAt),
            ]);
            return {
              record: publicH11AccessGate(record),
              replay: false,
              invalidatedSessions: sessionsToRevoke.map((session) => session.id),
            };
        '''),
    )

    replace_once(
        "src/staging-service.mjs",
        '''    const identity = state.identities.find((candidate) => candidate.id === session.identityId && candidate.status === "active");
    return identity ? { session, identity, state } : null;''',
        '''    const identity = state.identities.find((candidate) => candidate.id === session.identityId && candidate.status === "active");
    if (!identity) return null;
    if (!allowExpired && !allowRevoked && !activeSessionMatchesCurrentAccessGate(state, session, identity, this.now())) return null;
    return { session, identity, state };''',
    )

    replace_once(
        "src/staging-service.mjs",
        '''      shareLinkCreatedWithin23Hours: requireGateTrue(external.shareLinkCreatedWithin23Hours, "Confirm the share link was created no more than 23 hours before the session."),
      signedOutIncognitoJourneyPassed:''',
        '''      shareLinkCreatedAt: requireIsoDate(external.shareLinkCreatedAt, "Share-link creation time"),
      shareLinkCreatedWithin23Hours: requireGateTrue(external.shareLinkCreatedWithin23Hours, "Confirm the share link was created no more than 23 hours before the session."),
      signedOutIncognitoJourneyPassed:''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''  const start = new Date(normalized.session.startAt);
  const end = new Date(normalized.session.endAt);
  const shareExpiry = new Date(normalized.externalPreflight.shareLinkExpiresAt);''',
        '''  const start = new Date(normalized.session.startAt);
  const end = new Date(normalized.session.endAt);
  const shareCreated = new Date(normalized.externalPreflight.shareLinkCreatedAt);
  const shareExpiry = new Date(normalized.externalPreflight.shareLinkExpiresAt);''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''  if (shareExpiry < end) {
    throw serviceError(409, "h11_share_link_expires_too_early", "The protected share link must remain valid through the complete session window.");
  }
  if (shareExpiry.getTime() > now.getTime() + 23 * 60 * 60 * 1000) {''',
        '''  if (shareCreated.getTime() > now.getTime() + 5 * 60 * 1000) {
    throw serviceError(400, "h11_share_link_created_in_future", "The recorded share-link creation time is implausibly in the future.");
  }
  if (now.getTime() - shareCreated.getTime() > 23 * 60 * 60 * 1000) {
    throw serviceError(409, "h11_share_link_stale", "The protected share link was created more than 23 hours ago; create and preflight a fresh link.");
  }
  if (shareExpiry <= shareCreated) {
    throw serviceError(400, "h11_share_link_window_invalid", "The protected share-link expiry must be after its recorded creation time.");
  }
  if (shareExpiry < end) {
    throw serviceError(409, "h11_share_link_expires_too_early", "The protected share link must remain valid through the complete session window.");
  }
  if (shareExpiry.getTime() > now.getTime() + 23 * 60 * 60 * 1000) {''',
    )

    replace_once(
        "src/staging-service.mjs",
        dedent('''
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
        '''),
        dedent('''
        function assertNoActiveH11Invite(state, identityId, h11AccessGateId, now, excludedInviteId = null) {
          if (!h11AccessGateId) return;
          const existing = state.invites.find((invite) => (
            invite.id !== excludedInviteId
            && invite.identityId === identityId
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
          const activeSession = state.sessions.find((session) => (
            session.identityId === identityId
            && !session.revokedAt
            && new Date(session.expiresAt) > now
          ));
          if (activeSession) {
            throw serviceError(409, "h11_active_session_exists", "An authenticated H-11 session is already active. Supersede the gate to invalidate it before issuing another invitation.", {
              sessionId: activeSession.id,
              expiresAt: activeSession.expiresAt,
            });
          }
        }
        '''),
    )

    replace_once(
        "src/staging-service.mjs",
        '''  if (!preflight) throw serviceError(409, "h11_access_gate_required", "Record the complete recipient screening, final consent, session, and external access gate before issuing an invitation.");
  if (preflight.packetHash !== assignment.packetHash)''',
        '''  if (!preflight) throw serviceError(409, "h11_access_gate_required", "Record the complete recipient screening, final consent, session, and external access gate before issuing an invitation.");
  if (preflight.version !== H11_ACCESS_GATE_VERSION) throw serviceError(409, "h11_access_gate_version_stale", "Record a fresh access gate under the current H-11 access-control contract before issuing an invitation.");
  if (preflight.packetHash !== assignment.packetHash)''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''  if (!latest || latest.id !== invite.h11AccessGateId) {
    throw serviceError(401, "h11_access_gate_superseded", "The access gate was replaced; ask the operator for a fresh invitation.");
  }
  if (latest.packetHash !== assignment.packetHash || invite.packetHash !== assignment.packetHash) {''',
        '''  if (!latest || latest.id !== invite.h11AccessGateId) {
    throw serviceError(401, "h11_access_gate_superseded", "The access gate was replaced; ask the operator for a fresh invitation.");
  }
  if (latest.version !== H11_ACCESS_GATE_VERSION) {
    throw serviceError(401, "h11_access_gate_version_stale", "The invitation was issued under an obsolete H-11 access-control contract.");
  }
  if (latest.packetHash !== assignment.packetHash || invite.packetHash !== assignment.packetHash) {''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''  const ordinarySessionExpiry = addHours(now, sessionTtlHours);
  return new Date(Math.min(
    ordinarySessionExpiry.getTime(),
    end.getTime(),
    shareExpiry.getTime(),
    inviteExpiry.getTime(),
  )).toISOString();
}

function normalizeRating''',
        '''  const ordinarySessionExpiry = addHours(now, sessionTtlHours);
  return {
    expiresAt: new Date(Math.min(
      ordinarySessionExpiry.getTime(),
      end.getTime(),
      shareExpiry.getTime(),
      inviteExpiry.getTime(),
    )).toISOString(),
    h11AccessGateId: latest.id,
    assignmentId: assignment.id,
    packetHash: assignment.packetHash,
  };
}

function activeSessionMatchesCurrentAccessGate(state, session, identity, now) {
  if (identity.role !== "rater") return !session.h11AccessGateId;
  const purpose = effectiveIdentityPurpose(identity);
  if (purpose === "synthetic_automation") return isSyntheticEmail(identity.email) && !session.h11AccessGateId;
  if (purpose !== "h11_human_usability" || isSyntheticEmail(identity.email)) return false;
  if (!session.h11AccessGateId || !session.assignmentId || !session.packetHash) return false;
  const assignment = state.assignments.find((candidate) => candidate.id === session.assignmentId);
  if (!assignment || assignment.identityId !== identity.id || assignment.packetHash !== session.packetHash) return false;
  const latest = latestH11AccessGate(state, identity.id, assignment.id);
  if (!latest || latest.id !== session.h11AccessGateId || latest.version !== H11_ACCESS_GATE_VERSION) return false;
  if (latest.packetHash !== session.packetHash) return false;
  const end = new Date(latest.payload.session.endAt);
  const shareExpiry = new Date(latest.payload.externalPreflight.shareLinkExpiresAt);
  return now < end && now < shareExpiry;
}

function normalizeRating''',
    )

    # Operator UI now records link creation time and recognizes only V2 as ready.
    replace_once(
        "staging/app.mjs",
        '''    const ready = Boolean(latest && assignment && latest.packetHash === assignment.packetHash && new Date(latest.validUntil) > new Date());''',
        '''    const ready = Boolean(latest && latest.version === "H11-ACCESS-GATE-2026-08-07-V2" && assignment && latest.packetHash === assignment.packetHash && new Date(latest.validUntil) > new Date());''',
    )
    replace_once(
        "staging/app.mjs",
        '''          <div><dt>Deployment</dt><dd><code>${escapeHtml(latest.payload.externalPreflight.deploymentId)}</code></dd></div>
          <div><dt>Session</dt>''',
        '''          <div><dt>Deployment</dt><dd><code>${escapeHtml(latest.payload.externalPreflight.deploymentId)}</code></dd></div>
          <div><dt>Share link</dt><dd>${escapeHtml(latest.payload.externalPreflight.shareLinkCreatedAt || "legacy/unknown")} → ${escapeHtml(latest.payload.externalPreflight.shareLinkExpiresAt)}</dd></div>
          <div><dt>Session</dt>''',
    )
    replace_once(
        "staging/app.mjs",
        '''    const shareExpiryDefault = external.shareLinkExpiresAt ? toLocalDateTimeValue(external.shareLinkExpiresAt) : toLocalDateTimeValue(new Date(Date.now() + 4 * 60 * 60 * 1000));''',
        '''    const shareCreatedDefault = external.shareLinkCreatedAt ? toLocalDateTimeValue(external.shareLinkCreatedAt) : toLocalDateTimeValue(new Date());
    const shareExpiryDefault = external.shareLinkExpiresAt ? toLocalDateTimeValue(external.shareLinkExpiresAt) : toLocalDateTimeValue(new Date(Date.now() + 4 * 60 * 60 * 1000));''',
    )
    replace_once(
        "staging/app.mjs",
        '''          <label><span>Schema version</span><input name="schemaVersion" type="number" min="4" max="4" value="4" readonly required></label>
          <label><span>Protected share-link expiry</span><input name="shareLinkExpiresAt" type="datetime-local" value="${escapeHtml(shareExpiryDefault)}" required></label>''',
        '''          <label><span>Schema version</span><input name="schemaVersion" type="number" min="4" max="4" value="4" readonly required></label>
          <label><span>Protected share-link creation time</span><input name="shareLinkCreatedAt" type="datetime-local" value="${escapeHtml(shareCreatedDefault)}" required></label>
          <label><span>Protected share-link expiry</span><input name="shareLinkExpiresAt" type="datetime-local" value="${escapeHtml(shareExpiryDefault)}" required></label>''',
    )
    replace_once(
        "staging/app.mjs",
        '''            noOpenP0P1Defect: bool("noOpenP0P1Defect"),
            shareLinkCreatedWithin23Hours: bool("shareLinkCreatedWithin23Hours"),''',
        '''            noOpenP0P1Defect: bool("noOpenP0P1Defect"),
            shareLinkCreatedAt: new Date(data.get("shareLinkCreatedAt")).toISOString(),
            shareLinkCreatedWithin23Hours: bool("shareLinkCreatedWithin23Hours"),''',
    )

    # Contract tests.
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  const firstPayload = makeAccessGate(harness.now());
  const first = await harness.service.recordH11AccessGate({''',
        '''  const staleLinkPayload = makeAccessGate(harness.now());
  staleLinkPayload.externalPreflight.shareLinkCreatedAt = new Date(harness.now().getTime() - 24 * 60 * 60 * 1000).toISOString();
  await assert.rejects(
    () => harness.service.recordH11AccessGate({
      actorSessionToken: operator.sessionToken,
      identityId: participant.identity.id,
      assignmentId: assignment.assignment.id,
      payload: staleLinkPayload,
    }),
    (error) => error.status === 409 && error.code === "h11_share_link_stale",
  );

  const firstPayload = makeAccessGate(harness.now());
  await assert.rejects(
    () => harness.service.recordH11AccessGate({
      actorSessionToken: operator.sessionToken,
      identityId: participant.identity.id,
      assignmentId: assignment.assignment.id,
      payload: firstPayload,
      expectedReleaseSha: "c".repeat(40),
    }),
    (error) => error.status === 409 && error.code === "h11_release_sha_mismatch",
  );
  const first = await harness.service.recordH11AccessGate({''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  const replacement = await harness.service.replaceInvite({
    actorSessionToken: operator.sessionToken,
    inviteId: invite.invite.id,
    expiresInHours: 2,
  });
  const session = await harness.service.redeemInvite({ token: replacement.token });''',
        '''  const replacement = await harness.service.replaceInvite({
    actorSessionToken: operator.sessionToken,
    inviteId: invite.invite.id,
    expiresInHours: 2,
  });
  await assert.rejects(
    () => harness.service.replaceInvite({ actorSessionToken: operator.sessionToken, inviteId: invite.invite.id, expiresInHours: 2 }),
    (error) => error.status === 409 && error.code === "h11_active_invite_exists",
  );
  const session = await harness.service.redeemInvite({ token: replacement.token });''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  assert.ok(new Date(session.session.expiresAt) <= new Date(superseding.record.payload.externalPreflight.shareLinkExpiresAt));

  const operatorWorkspace''',
        '''  assert.ok(new Date(session.session.expiresAt) <= new Date(superseding.record.payload.externalPreflight.shareLinkExpiresAt));
  await assert.rejects(
    () => harness.service.createInvite({ actorSessionToken: operator.sessionToken, identityId: participant.identity.id, expiresInHours: 1 }),
    (error) => error.status === 409 && error.code === "h11_active_session_exists",
  );

  const thirdPayload = makeAccessGate(harness.now(), {
    deploymentId: "dpl_h11thirddeployment000000003",
    ownerAuthorizationReference: "H11-TEST-OWNER-AUTHORIZATION-0003",
  });
  const third = await harness.service.recordH11AccessGate({
    actorSessionToken: operator.sessionToken,
    identityId: participant.identity.id,
    assignmentId: assignment.assignment.id,
    payload: thirdPayload,
  });
  assert.equal(third.record.supersedesId, superseding.record.id);
  assert.deepEqual(third.invalidatedSessions, [session.session.id]);
  await assert.rejects(
    () => harness.service.me(session.sessionToken),
    (error) => error.status === 401 && error.code === "authentication_required",
  );

  const operatorWorkspace''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  assert.equal(operatorWorkspace.h11AccessGates.length, 2);''',
        '''  assert.equal(operatorWorkspace.h11AccessGates.length, 3);''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  assert.equal(privateExport.state.h11AccessGates.length, 2);''',
        '''  assert.equal(privateExport.state.h11AccessGates.length, 3);
  assert.ok(privateExport.state.sessions.find((record) => record.id === session.session.id).revokedAt);''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''      noOpenP0P1Defect: true,
      shareLinkCreatedWithin23Hours: true,''',
        '''      noOpenP0P1Defect: true,
      shareLinkCreatedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      shareLinkCreatedWithin23Hours: true,''',
    )

    # E2E payload and version assertion.
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        'record.version === "H11-ACCESS-GATE-2026-08-07-V1"',
        'record.version === "H11-ACCESS-GATE-2026-08-07-V2"',
    )
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''      noOpenP0P1Defect: true,
      shareLinkCreatedWithin23Hours: true,''',
        '''      noOpenP0P1Defect: true,
      shareLinkCreatedAt: new Date(now - 5 * 60 * 1000).toISOString(),
      shareLinkCreatedWithin23Hours: true,''',
    )

    # Static verifier.
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        'assert.match(contents["src/staging-service.mjs"], /H11-ACCESS-GATE-2026-08-07-V1/);',
        'assert.match(contents["src/staging-service.mjs"], /H11-ACCESS-GATE-2026-08-07-V2/);',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["src/staging-service.mjs"], /h11SessionExpiresAt/);''',
        '''assert.match(contents["src/staging-service.mjs"], /h11Access/);
assert.match(contents["src/staging-service.mjs"], /h11_active_session_exists/);
assert.match(contents["src/staging-service.mjs"], /activeSessionMatchesCurrentAccessGate/);
assert.match(contents["src/staging-service.mjs"], /h11_release_sha_mismatch/);
assert.match(contents["src/staging-service.mjs"], /h11_share_link_stale/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["staging/app.mjs"], /Still no access issuance/);''',
        '''assert.match(contents["staging/app.mjs"], /Still no access issuance/);
assert.match(contents["staging/app.mjs"], /shareLinkCreatedAt/);
assert.match(contents["staging/app.mjs"], /H11-ACCESS-GATE-2026-08-07-V2/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["test/h11-access-gate-contract.test.mjs"], /human_identity_deliverable_email_required/);''',
        '''assert.match(contents["test/h11-access-gate-contract.test.mjs"], /human_identity_deliverable_email_required/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_active_session_exists/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_release_sha_mismatch/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_share_link_stale/);''',
    )

    append_once(
        "ops/next-steps-2026-07-23/h11-fail-closed-access-issuance-gate-2026-08-07.md",
        "## V2 session and exact-release binding",
        dedent('''
        ## V2 session and exact-release binding

        The current access record is `H11-ACCESS-GATE-2026-08-07-V2`. V1 records are deliberately stale for future invitation issuance.

        V2 adds four controls:

        1. a structured share-link creation timestamp that must be no more than 23 hours old, cannot be materially in the future, and must precede the recorded expiry;
        2. hosted API verification that the operator-entered release SHA equals `VERCEL_GIT_COMMIT_SHA` for the exact runtime serving the gate form;
        3. session metadata binding to the exact H-11 gate, assignment, and packet hash, with authentication revalidation against the latest gate on every ordinary protected request; and
        4. explicit revocation of any still-active participant session when a new gate supersedes the prior gate.

        Replacement invitation issuance now excludes only the invitation being replaced and rejects the operation if another unused current-gate invitation or any active participant session already exists. An operator who needs to recover from a lost authenticated browser must supersede the gate, thereby invalidating the prior session, before issuing a fresh token.
        '''),
    )

    (ROOT / ".github/apply_h11_access_gate_v2.py").unlink(missing_ok=True)
    (ROOT / ".github/workflows/apply-h11-access-gate-v2.yml").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
