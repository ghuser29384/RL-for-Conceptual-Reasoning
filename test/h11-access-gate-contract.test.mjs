import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
  await assert.rejects(
    () => harness.service.createInvite({ actorSessionToken: operator.sessionToken, identityId: participant.identity.id, expiresInHours: 2 }),
    (error) => error.status === 409 && error.code === "h11_active_invite_exists",
  );

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
  assert.equal(session.session.expiresAt, replacement.invite.expiresAt);
  assert.ok(new Date(session.session.expiresAt) <= new Date(superseding.record.payload.session.endAt));
  assert.ok(new Date(session.session.expiresAt) <= new Date(superseding.record.payload.externalPreflight.shareLinkExpiresAt));

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
});

async function makeHarness() {
  const directory = await mkdtemp(join(tmpdir(), "metaphilosophy-h11-access-gate-"));
  const store = new FileEventStore({ filePath: join(directory, "events.jsonl") });
  let current = new Date("2026-08-07T10:00:00.000Z");
  const service = new StagingWorkflowService({ store, now: () => new Date(current) });
  await service.initialize();
  return {
    service,
    store,
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
