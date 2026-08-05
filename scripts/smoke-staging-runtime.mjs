import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { FileEventStore } from "../src/staging-event-store.mjs";
import { StagingWorkflowService } from "../src/staging-service.mjs";

const temporaryRoot = await mkdtemp(join(tmpdir(), "metaphilosophy-staging-runtime-"));
const sourcePath = resolve(temporaryRoot, "primary", "events.jsonl");
const backupPath = resolve(temporaryRoot, "backup", "events.jsonl");
const restorePath = resolve(temporaryRoot, "restore", "events.jsonl");
const reportPath = resolve(process.env.STAGING_SMOKE_REPORT ?? ".staging-evidence/human-workflow-smoke-report.json");
const timeline = [];

const store = new FileEventStore({ filePath: sourcePath });
let currentTime = new Date("2026-08-05T00:00:00.000Z");
const service = new StagingWorkflowService({ store, now: () => new Date(currentTime) });
await service.initialize();

const bootstrap = await service.bootstrap({
  bootstrapToken: "synthetic-bootstrap-token",
  expectedBootstrapToken: "synthetic-bootstrap-token",
  operatorEmail: "operator@staging.metaphilosophy.invalid",
});
const operator = await service.redeemInvite({ token: bootstrap.inviteToken, userAgent: "synthetic-runtime-smoke" });
assert.equal(operator.identity.role, "operator");
timeline.push("synthetic_operator_bootstrapped");

const raterAIdentity = await service.createIdentity({
  actorSessionToken: operator.sessionToken,
  role: "rater",
  displayName: "Synthetic dry-run rater A",
  email: "rater-a@staging.metaphilosophy.invalid",
});
const raterBIdentity = await service.createIdentity({
  actorSessionToken: operator.sessionToken,
  role: "rater",
  displayName: "Synthetic dry-run rater B",
  email: "rater-b@staging.metaphilosophy.invalid",
});
const adjudicatorIdentity = await service.createIdentity({
  actorSessionToken: operator.sessionToken,
  role: "adjudicator",
  displayName: "Synthetic dry-run adjudicator",
  email: "adjudicator@staging.metaphilosophy.invalid",
});
const recoveryIdentity = await service.createIdentity({
  actorSessionToken: operator.sessionToken,
  role: "rater",
  displayName: "Synthetic recovery identity",
  email: "recovery@staging.metaphilosophy.invalid",
});
timeline.push("controlled_identities_created");

const recoveryInvite = await service.createInvite({ actorSessionToken: operator.sessionToken, identityId: recoveryIdentity.identity.id, expiresInHours: 1 });
await service.revokeInvite({ actorSessionToken: operator.sessionToken, inviteId: recoveryInvite.invite.id, reason: "synthetic revocation drill" });
await assert.rejects(
  () => service.redeemInvite({ token: recoveryInvite.token }),
  (error) => error.status === 401 && error.code === "revoked_invite",
);
const replacement = await service.replaceInvite({ actorSessionToken: operator.sessionToken, inviteId: recoveryInvite.invite.id, expiresInHours: 2 });
const recovered = await service.redeemInvite({ token: replacement.token });
assert.equal(recovered.identity.id, recoveryIdentity.identity.id);
await service.logout(recovered.sessionToken);
await assert.rejects(() => service.me(recovered.sessionToken), (error) => error.status === 401);
timeline.push("invite_revoke_replace_and_logout_passed");

const expiringIdentity = await service.createIdentity({
  actorSessionToken: operator.sessionToken,
  role: "rater",
  displayName: "Synthetic expiry identity",
  email: "expiry@staging.metaphilosophy.invalid",
});
const expiringInvite = await service.createInvite({ actorSessionToken: operator.sessionToken, identityId: expiringIdentity.identity.id, expiresInHours: 1 });
currentTime = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000);
await assert.rejects(
  () => service.redeemInvite({ token: expiringInvite.token }),
  (error) => error.status === 401 && error.code === "expired_invite",
);
timeline.push("invite_expiry_passed");

const raterA = await redeemIdentity(raterAIdentity.identity.id);
const raterB = await redeemIdentity(raterBIdentity.identity.id);
const adjudicator = await redeemIdentity(adjudicatorIdentity.identity.id);

const assignmentA = await service.createAssignment({
  actorSessionToken: operator.sessionToken,
  identityId: raterAIdentity.identity.id,
  positionId: bootstrap.positionId,
  kind: "initial",
});
const assignmentB = await service.createAssignment({
  actorSessionToken: operator.sessionToken,
  identityId: raterBIdentity.identity.id,
  positionId: bootstrap.positionId,
  kind: "initial",
});

const workspaceA = await service.getWorkspace(raterA.sessionToken);
const workspaceB = await service.getWorkspace(raterB.sessionToken);
assert.equal(workspaceA.assignments.length, 1);
assert.equal(workspaceB.assignments.length, 1);
assert.equal(workspaceA.assignments[0].critiques.length, 4);
assert.equal(workspaceA.assignments[0].position.status, "synthetic_rehearsal_only");
assert.equal(JSON.stringify(workspaceA).includes(raterBIdentity.identity.id), false);
assert.equal(JSON.stringify(workspaceB).includes(raterAIdentity.identity.id), false);
assert.ok(workspaceA.rubric.generalGuidance.length >= 6);

timeline.push("two_isolated_raters_and_full_rubric_loaded");

const critiqueIds = workspaceA.assignments[0].critiques.map((critique) => critique.id);
await assert.rejects(
  () => service.saveDraft({
    sessionToken: raterA.sessionToken,
    assignmentId: assignmentB.assignment.id,
    critiqueId: critiqueIds[0],
    expectedVersion: 0,
    rating: makeRating(0.5, 0.5),
  }),
  (error) => error.status === 403 && error.code === "assignment_forbidden",
);
timeline.push("cross_account_direct_object_access_denied");

for (let index = 0; index < critiqueIds.length; index += 1) {
  await service.saveDraft({
    sessionToken: raterA.sessionToken,
    assignmentId: assignmentA.assignment.id,
    critiqueId: critiqueIds[index],
    expectedVersion: 0,
    rating: makeRating(index === 0 ? 0.9 : 0.62 - index * 0.12, 0.9, { requestReview: index === 0 }),
  });
  await service.saveDraft({
    sessionToken: raterB.sessionToken,
    assignmentId: assignmentB.assignment.id,
    critiqueId: critiqueIds[index],
    expectedVersion: 0,
    rating: makeRating(index === 0 ? 0.1 : 0.62 - index * 0.12, index === 0 ? 0.2 : 0.9, {
      interpretationConfidence: index === 0 ? "low" : "high",
    }),
  });
}

await assert.rejects(
  () => service.saveDraft({
    sessionToken: raterA.sessionToken,
    assignmentId: assignmentA.assignment.id,
    critiqueId: critiqueIds[0],
    expectedVersion: 0,
    rating: makeRating(0.7, 0.7),
  }),
  (error) => error.status === 409 && error.code === "draft_version_conflict" && error.detail.currentVersion === 1,
);

const reconstructedStore = new FileEventStore({ filePath: sourcePath });
const reconstructedService = new StagingWorkflowService({ store: reconstructedStore, now: () => new Date(currentTime) });
await reconstructedService.initialize();
const resumedWorkspaceA = await reconstructedService.getWorkspace(raterA.sessionToken);
assert.equal(resumedWorkspaceA.assignments[0].critiques.every((critique) => critique.draft?.version === 1), true);
timeline.push("autosave_conflict_and_process_restart_resume_passed");

await assert.rejects(
  () => reconstructedService.submitAssignment({
    sessionToken: raterA.sessionToken,
    assignmentId: assignmentA.assignment.id,
    idempotencyKey: `tamper:${crypto.randomUUID()}`,
    packetHash: "tampered-packet-hash",
  }),
  (error) => error.status === 409 && error.code === "packet_hash_mismatch",
);

const idempotencyA = `submit:${assignmentA.assignment.id}:${crypto.randomUUID()}`;
const submissionA = await reconstructedService.submitAssignment({
  sessionToken: raterA.sessionToken,
  assignmentId: assignmentA.assignment.id,
  idempotencyKey: idempotencyA,
  packetHash: assignmentA.assignment.packetHash,
});
assert.equal(submissionA.replay, false);
assert.ok(submissionA.receipt.id);
const replayA = await reconstructedService.submitAssignment({
  sessionToken: raterA.sessionToken,
  assignmentId: assignmentA.assignment.id,
  idempotencyKey: idempotencyA,
  packetHash: assignmentA.assignment.packetHash,
});
assert.equal(replayA.replay, true);
await assert.rejects(
  () => reconstructedService.submitAssignment({
    sessionToken: raterA.sessionToken,
    assignmentId: assignmentA.assignment.id,
    idempotencyKey: `duplicate:${crypto.randomUUID()}`,
    packetHash: assignmentA.assignment.packetHash,
  }),
  (error) => error.status === 409 && error.code === "already_submitted",
);

await reconstructedService.submitAssignment({
  sessionToken: raterB.sessionToken,
  assignmentId: assignmentB.assignment.id,
  idempotencyKey: `submit:${assignmentB.assignment.id}:${crypto.randomUUID()}`,
  packetHash: assignmentB.assignment.packetHash,
});
let afterInitials = await reconstructedService.state();
assert.equal(afterInitials.ratings.length, 8);
assert.equal(afterInitials.adjudicationCases.filter((item) => item.status === "open").length, 1);
timeline.push("tamper_rejection_idempotent_submission_and_receipts_passed");

const correction = await reconstructedService.requestCorrection({
  sessionToken: raterA.sessionToken,
  assignmentId: assignmentA.assignment.id,
  reason: "Synthetic drill: an object-level interpretation mistake was identified after locking the initial ratings.",
});
const correctionResolution = await reconstructedService.operatorResolveCorrection({
  actorSessionToken: operator.sessionToken,
  requestId: correction.request.id,
  action: "approve_rerating",
  notes: "Synthetic drill approval. Preserve the original ratings and create a predecessor-linked re-rating assignment.",
});
assert.equal(correctionResolution.assignment.predecessorAssignmentId, assignmentA.assignment.id);
const reratingWorkspace = await reconstructedService.getWorkspace(raterA.sessionToken);
const reratingAssignment = reratingWorkspace.assignments.find((assignment) => assignment.kind === "rerating");
assert.ok(reratingAssignment);
for (const critique of reratingAssignment.critiques) {
  await reconstructedService.saveDraft({
    sessionToken: raterA.sessionToken,
    assignmentId: reratingAssignment.id,
    critiqueId: critique.id,
    expectedVersion: 0,
    rating: makeRating(0.55, 0.65, {
      backgroundAssumptions: "Object-level reconsideration after identifying an interpretation issue; the immutable initial record remains preserved.",
    }),
  });
}
await reconstructedService.submitAssignment({
  sessionToken: raterA.sessionToken,
  assignmentId: reratingAssignment.id,
  idempotencyKey: `rerating:${reratingAssignment.id}:${crypto.randomUUID()}`,
  packetHash: reratingAssignment.packetHash,
});
timeline.push("immutable_initials_and_predecessor_linked_rerating_passed");

const adjudicatorWorkspace = await reconstructedService.getWorkspace(adjudicator.sessionToken);
assert.equal(adjudicatorWorkspace.cases.length, 1);
const caseId = adjudicatorWorkspace.cases[0].id;
await reconstructedService.submitAdjudicationReview({
  sessionToken: adjudicator.sessionToken,
  caseId,
  disposition: "unresolved",
  explanation: "Synthetic drill: two literal readings remain sufficiently plausible that the disagreement must be represented explicitly rather than forced into consensus.",
  requiresRerating: false,
});
const closure = await reconstructedService.closeAdjudicationCase({
  actorSessionToken: operator.sessionToken,
  caseId,
  status: "unresolved",
  notes: "Synthetic drill closure. Preserve initial ratings, the linked re-rating, and explicit interpretation uncertainty in the final snapshot.",
});
assert.equal(closure.snapshot.status, "unresolved");
assert.equal(closure.snapshot.initialRatingIds.length, 8);
assert.equal(closure.snapshot.reratingIds.length, 4);
timeline.push("adjudication_handoff_and_unresolved_snapshot_passed");

await reconstructedService.requestWithdrawal({
  sessionToken: raterB.sessionToken,
  assignmentId: assignmentB.assignment.id,
  reason: "Synthetic withdrawal drill after accepted initial work; immutable records remain in the controlled audit trail.",
});
const finalState = await reconstructedService.state();
assert.equal(finalState.ratings.length, 12);
assert.equal(finalState.labelSnapshots.length, 1);
assert.equal(finalState.assignments.find((assignment) => assignment.id === assignmentB.assignment.id).status, "withdrawn");
timeline.push("correction_and_withdrawal_paths_passed");

const publicExport = await reconstructedService.operatorExport({ actorSessionToken: operator.sessionToken, publicOnly: true });
const privateExport = await reconstructedService.operatorExport({ actorSessionToken: operator.sessionToken, publicOnly: false });
assert.equal(JSON.stringify(publicExport).includes("@staging.metaphilosophy.invalid"), false);
assert.equal(publicExport.counts.ratings, 12);
assert.ok(privateExport.events.length > 30);
timeline.push("private_audit_and_public_safe_exports_passed");

const backup = await reconstructedStore.backup(backupPath);
const restoredStore = new FileEventStore({ filePath: restorePath });
await restoredStore.initialize();
const restoreReceipt = await restoredStore.restore(backupPath);
assert.equal(restoreReceipt.headHash, backup.headHash);
assert.equal(restoreReceipt.events, backup.events);
const restoredService = new StagingWorkflowService({ store: restoredStore, now: () => new Date(currentTime) });
await restoredService.initialize();
const restoredState = await restoredService.state();
assert.equal(restoredState.ratings.length, 12);
assert.equal(restoredState.labelSnapshots.length, 1);
timeline.push("backup_restore_and_hash_chain_readback_passed");

const report = {
  schemaVersion: "metaphilosophy-human-workflow-smoke-v2",
  generatedAt: new Date().toISOString(),
  status: "pass",
  scope: "automated synthetic runtime rehearsal only; no human participant and no research rating",
  researchRatingsAuthorized: false,
  timeline,
  counts: {
    identities: restoredState.identities.length,
    assignments: restoredState.assignments.length,
    ratings: restoredState.ratings.length,
    labelSnapshots: restoredState.labelSnapshots.length,
    events: restoreReceipt.events,
  },
  chainHeadHash: restoreReceipt.headHash,
  limitations: [
    "This is not evidence from two qualified human dry-run raters.",
    "No dedicated hosted staging database or preview deployment was exercised.",
    "No outreach, participant selection, payment, funding submission, or real research rating was authorized.",
  ],
};
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

async function redeemIdentity(identityId) {
  const invite = await service.createInvite({ actorSessionToken: operator.sessionToken, identityId, expiresInHours: 24 });
  return service.redeemInvite({ token: invite.token, userAgent: "synthetic-runtime-smoke" });
}

function makeRating(overall, strength, overrides = {}) {
  return {
    scores: {
      centrality: 0.9,
      strength,
      correctness: 0.9,
      clarity: 0.95,
      dead_weight: 0.05,
      single_issue: 0.95,
      overall,
    },
    rationale: "This synthetic rehearsal rationale identifies the attacked claim, assesses centrality and object-level force, and does not infer quality from source, author, or prose style.",
    confidence: "high",
    timeSpentSeconds: 420,
    interpretationConfidence: overrides.interpretationConfidence ?? "high",
    backgroundAssumptions: overrides.backgroundAssumptions ?? "Read the stated position literally and do not import an unstated reply or broader conclusion.",
    assessability: "assessable",
    issueFlags: overrides.interpretationConfidence === "low" ? ["position_ambiguity"] : [],
    verificationStatus: "not_needed",
    requestReview: Boolean(overrides.requestReview),
  };
}
