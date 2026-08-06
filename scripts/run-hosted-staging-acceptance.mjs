import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { RemoteEventStore, verifyEventChain } from "../src/staging-event-store.mjs";
import { StagingWorkflowService } from "../src/staging-service.mjs";

const RELEASE_PREVIEW_BRANCH = "release/vercel-preview";
const LEDGER_URL = "https://zpnbshgrscbfelpychhn.supabase.co/functions/v1/metaphilosophy-staging-ledger";
const ACCEPTANCE_URL = "https://zpnbshgrscbfelpychhn.supabase.co/functions/v1/metaphilosophy-staging-acceptance";
const REPORT_KIND = "protected-hosted-synthetic-lifecycle-v2";

const isActualReleasePreview = process.env.VERCEL === "1"
  && process.env.VERCEL_ENV === "preview"
  && process.env.VERCEL_GIT_COMMIT_REF === RELEASE_PREVIEW_BRANCH;

if (!isActualReleasePreview) {
  console.log(JSON.stringify({
    status: "skipped",
    reason: "not_the_actual_designated_vercel_preview",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    environment: process.env.VERCEL_ENV ?? null,
  }));
  process.exit(0);
}

const oidcToken = process.env.VERCEL_OIDC_TOKEN;
const exactReleaseSha = process.env.VERCEL_GIT_COMMIT_SHA;
if (!oidcToken) throw new Error("VERCEL_OIDC_TOKEN is required for hosted staging acceptance.");
if (!/^[a-f0-9]{40}$/u.test(String(exactReleaseSha))) throw new Error("VERCEL_GIT_COMMIT_SHA must be a full lowercase SHA.");

const initialStatus = await acceptanceRequest("status");
assert.equal(initialStatus.metadata?.schema_version, 4);
assert.equal(initialStatus.metadata?.purpose, "synthetic_rehearsal_only");
assert.equal(initialStatus.metadata?.research_ratings_authorized, false);
assert.equal(initialStatus.researchRatingsAuthorized, false);
const startingPrimary = structuredClone(initialStatus.primary);

if (
  initialStatus.latestReport?.reportKind === REPORT_KIND
  && initialStatus.latestReport?.status === "pass"
  && initialStatus.latestReport?.researchRatingsAuthorized === false
) {
  console.log(JSON.stringify({
    status: "pass",
    replay: true,
    exactReleaseSha,
    report: initialStatus.latestReport,
    researchRatingsAuthorized: false,
  }, null, 2));
  process.exit(0);
}

if (initialStatus.restore.eventCount !== 0) {
  throw new Error(
    `Hosted staging acceptance requires an empty restore ledger when no exact-release report exists; found ${initialStatus.restore.eventCount}.`,
  );
}

const makeStore = () => new RemoteEventStore({
  gatewayUrl: LEDGER_URL,
  oidcToken,
  expectedReleaseSha: exactReleaseSha,
  expectedBranch: RELEASE_PREVIEW_BRANCH,
});

const acceptanceRunId = crypto.randomUUID();
const fixture = hostedRehearsalFixture(acceptanceRunId);
let currentTime = new Date("2026-08-06T14:00:00.000Z");
const now = () => new Date(currentTime);
const timeline = [];
if (startingPrimary.eventCount > 0) timeline.push("prior_failed_attempt_chain_preserved_append_only");
const store = makeStore();
const service = new StagingWorkflowService({ store, now });
await service.initialize();

const bootstrapSecret = "synthetic-hosted-acceptance-bootstrap-domain";
const bootstrap = await service.bootstrap({
  bootstrapToken: bootstrapSecret,
  expectedBootstrapToken: bootstrapSecret,
  operatorEmail: "operator@hosted-acceptance.metaphilosophy.invalid",
  fixture,
  allowExistingOperator: true,
});
const operator = await service.redeemInvite({
  token: bootstrap.inviteToken,
  userAgent: "metaphilosophy-hosted-acceptance-operator",
});
assert.equal(operator.identity.role, "operator");
timeline.push("synthetic_operator_bootstrapped_through_hosted_oidc_ledger");

const raterAIdentity = await service.createIdentity({
  actorSessionToken: operator.sessionToken,
  role: "rater",
  displayName: "Synthetic hosted rater A",
  email: "rater-a@hosted-acceptance.metaphilosophy.invalid",
});
const raterBIdentity = await service.createIdentity({
  actorSessionToken: operator.sessionToken,
  role: "rater",
  displayName: "Synthetic hosted rater B",
  email: "rater-b@hosted-acceptance.metaphilosophy.invalid",
});
const adjudicatorIdentity = await service.createIdentity({
  actorSessionToken: operator.sessionToken,
  role: "adjudicator",
  displayName: "Synthetic hosted adjudicator",
  email: "adjudicator@hosted-acceptance.metaphilosophy.invalid",
});
const recoveryIdentity = await service.createIdentity({
  actorSessionToken: operator.sessionToken,
  role: "rater",
  displayName: "Synthetic hosted recovery identity",
  email: "recovery@hosted-acceptance.metaphilosophy.invalid",
});

timeline.push("role_separated_synthetic_identities_created");

const recoveryInvite = await service.createInvite({
  actorSessionToken: operator.sessionToken,
  identityId: recoveryIdentity.identity.id,
  expiresInHours: 1,
});
await service.revokeInvite({
  actorSessionToken: operator.sessionToken,
  inviteId: recoveryInvite.invite.id,
  reason: "synthetic hosted credential-revocation drill",
});
await assert.rejects(
  () => service.redeemInvite({ token: recoveryInvite.token }),
  (error) => error.status === 401 && error.code === "revoked_invite",
);
const replacement = await service.replaceInvite({
  actorSessionToken: operator.sessionToken,
  inviteId: recoveryInvite.invite.id,
  expiresInHours: 2,
});
const recovered = await service.redeemInvite({
  token: replacement.token,
  userAgent: "metaphilosophy-hosted-acceptance-recovery",
});
assert.equal(recovered.identity.id, recoveryIdentity.identity.id);
await service.logout(recovered.sessionToken);
await assert.rejects(() => service.me(recovered.sessionToken), (error) => error.status === 401);
timeline.push("revocation_replacement_single_use_and_logout_passed");

const expiringIdentity = await service.createIdentity({
  actorSessionToken: operator.sessionToken,
  role: "rater",
  displayName: "Synthetic hosted expiry identity",
  email: "expiry@hosted-acceptance.metaphilosophy.invalid",
});
const expiringInvite = await service.createInvite({
  actorSessionToken: operator.sessionToken,
  identityId: expiringIdentity.identity.id,
  expiresInHours: 1,
});
currentTime = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000);
await assert.rejects(
  () => service.redeemInvite({ token: expiringInvite.token }),
  (error) => error.status === 401 && error.code === "expired_invite",
);
timeline.push("invitation_expiry_passed");

const raterA = await redeemIdentity(raterAIdentity.identity.id, "rater-a");
const raterB = await redeemIdentity(raterBIdentity.identity.id, "rater-b");
const adjudicator = await redeemIdentity(adjudicatorIdentity.identity.id, "adjudicator");

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
assert.equal(Object.keys(workspaceA.rubric.dimensions).length, 7);
assert.equal(JSON.stringify(workspaceA).includes(raterBIdentity.identity.id), false);
assert.equal(JSON.stringify(workspaceB).includes(raterAIdentity.identity.id), false);
timeline.push("two_rater_blinding_four_siblings_and_complete_lmca_rubric_passed");

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
timeline.push("cross_account_direct_object_write_denied");

for (let index = 0; index < critiqueIds.length; index += 1) {
  await service.saveDraft({
    sessionToken: raterA.sessionToken,
    assignmentId: assignmentA.assignment.id,
    critiqueId: critiqueIds[index],
    expectedVersion: 0,
    rating: makeRating(index === 0 ? 0.9 : 0.62 - index * 0.12, 0.9, {
      requestReview: index === 0,
    }),
  });
  await service.saveDraft({
    sessionToken: raterB.sessionToken,
    assignmentId: assignmentB.assignment.id,
    critiqueId: critiqueIds[index],
    expectedVersion: 0,
    rating: makeRating(index === 0 ? 0.1 : 0.62 - index * 0.12, index === 0 ? 0.2 : 0.9, {
      interpretationConfidence: index === 0 ? "low" : "high",
      issueFlags: index === 0 ? ["position_ambiguity"] : [],
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
timeline.push("hosted_autosave_and_stale_version_conflict_passed");

const restartedStore = makeStore();
const restartedService = new StagingWorkflowService({ store: restartedStore, now });
await restartedService.initialize();
const resumedWorkspaceA = await restartedService.getWorkspace(raterA.sessionToken);
assert.equal(resumedWorkspaceA.assignments[0].critiques.every((critique) => critique.draft?.version === 1), true);
timeline.push("new_runtime_instance_readback_and_session_resume_passed");

await assert.rejects(
  () => restartedService.submitAssignment({
    sessionToken: raterA.sessionToken,
    assignmentId: assignmentA.assignment.id,
    idempotencyKey: `tamper:${crypto.randomUUID()}`,
    packetHash: "tampered-packet-hash",
  }),
  (error) => error.status === 409 && error.code === "packet_hash_mismatch",
);

const idempotencyA = `hosted-submit:${assignmentA.assignment.id}:${crypto.randomUUID()}`;
const submissionA = await restartedService.submitAssignment({
  sessionToken: raterA.sessionToken,
  assignmentId: assignmentA.assignment.id,
  idempotencyKey: idempotencyA,
  packetHash: assignmentA.assignment.packetHash,
});
assert.equal(submissionA.replay, false);
const replayA = await restartedService.submitAssignment({
  sessionToken: raterA.sessionToken,
  assignmentId: assignmentA.assignment.id,
  idempotencyKey: idempotencyA,
  packetHash: assignmentA.assignment.packetHash,
});
assert.equal(replayA.replay, true);
await restartedService.submitAssignment({
  sessionToken: raterB.sessionToken,
  assignmentId: assignmentB.assignment.id,
  idempotencyKey: `hosted-submit:${assignmentB.assignment.id}:${crypto.randomUUID()}`,
  packetHash: assignmentB.assignment.packetHash,
});
let afterInitials = await restartedService.state();
assert.equal(afterInitials.ratings.filter((rating) => rating.eventType === "initial").length, 8);
assert.equal(afterInitials.adjudicationCases.filter((item) => item.status === "open").length, 1);
timeline.push("tamper_rejection_exactly_once_submission_receipts_and_triggered_adjudication_passed");

const correction = await restartedService.requestCorrection({
  sessionToken: raterA.sessionToken,
  assignmentId: assignmentA.assignment.id,
  reason: "Synthetic hosted drill: an interpretation mistake was identified after immutable initial submission.",
});
const correctionResolution = await restartedService.operatorResolveCorrection({
  actorSessionToken: operator.sessionToken,
  requestId: correction.request.id,
  action: "approve_rerating",
  notes: "Synthetic hosted approval: preserve initials and create one predecessor-linked rerating assignment.",
});
assert.equal(correctionResolution.assignment.predecessorAssignmentId, assignmentA.assignment.id);
const reratingWorkspace = await restartedService.getWorkspace(raterA.sessionToken);
const reratingAssignment = reratingWorkspace.assignments.find((assignment) => assignment.kind === "rerating");
assert.ok(reratingAssignment);
for (const critique of reratingAssignment.critiques) {
  await restartedService.saveDraft({
    sessionToken: raterA.sessionToken,
    assignmentId: reratingAssignment.id,
    critiqueId: critique.id,
    expectedVersion: 0,
    rating: makeRating(0.55, 0.65, {
      backgroundAssumptions: "Object-level reconsideration after identifying an interpretation issue; the initial record remains immutable.",
    }),
  });
}
await restartedService.submitAssignment({
  sessionToken: raterA.sessionToken,
  assignmentId: reratingAssignment.id,
  idempotencyKey: `hosted-rerating:${reratingAssignment.id}:${crypto.randomUUID()}`,
  packetHash: reratingAssignment.packetHash,
});
timeline.push("rater_visible_correction_and_predecessor_linked_rerating_passed");

const adjudicatorWorkspace = await restartedService.getWorkspace(adjudicator.sessionToken);
assert.equal(adjudicatorWorkspace.cases.length, 1);
const caseId = adjudicatorWorkspace.cases[0].id;
await restartedService.submitAdjudicationReview({
  sessionToken: adjudicator.sessionToken,
  caseId,
  disposition: "unresolved",
  explanation: "Synthetic hosted drill: the competing literal readings remain plausible, so the disagreement must remain explicit rather than being forced into consensus.",
  requiresRerating: false,
});
const closure = await restartedService.closeAdjudicationCase({
  actorSessionToken: operator.sessionToken,
  caseId,
  status: "unresolved",
  notes: "Synthetic hosted closure: preserve both initial distributions, the linked rerating, and unresolved interpretation uncertainty.",
});
assert.equal(closure.snapshot.status, "unresolved");
assert.equal(closure.snapshot.initialRatingIds.length, 8);
assert.equal(closure.snapshot.reratingIds.length, 4);
timeline.push("independent_adjudication_handoff_and_explicit_unresolved_snapshot_passed");

await restartedService.requestWithdrawal({
  sessionToken: raterB.sessionToken,
  assignmentId: assignmentB.assignment.id,
  reason: "Synthetic hosted withdrawal after accepted work; retained ratings remain in the append-only private audit trail.",
});
const afterWithdrawal = await restartedService.state();
assert.equal(afterWithdrawal.ratings.length, 12);
assert.equal(afterWithdrawal.labelSnapshots.length, 1);
assert.equal(afterWithdrawal.assignments.find((assignment) => assignment.id === assignmentB.assignment.id).status, "withdrawn");
timeline.push("withdrawal_lock_and_immutable_rating_retention_passed");

const publicExport = await restartedService.operatorExport({
  actorSessionToken: operator.sessionToken,
  publicOnly: true,
});
const privateExport = await restartedService.operatorExport({
  actorSessionToken: operator.sessionToken,
  publicOnly: false,
});
assert.equal(JSON.stringify(publicExport).includes("@hosted-acceptance.metaphilosophy.invalid"), false);
assert.equal(publicExport.counts.ratings, 12);
assert.ok(privateExport.events.length > 30);
timeline.push("private_audit_and_privacy_safe_public_export_passed");

const finalEvents = await restartedStore.loadEvents();
verifyEventChain(finalEvents);
const finalChain = await restartedStore.verifyChain();
assert.equal(finalChain.events, finalEvents.length);
assert.equal(finalChain.headHash, finalEvents.at(-1).eventHash);
const backupSha256 = createHash("sha256").update(canonicalStringify(finalEvents)).digest("hex");

const restoreEvidence = await acceptanceRequest("restore.verify", {
  events: finalEvents,
  expectedEventCount: finalEvents.length,
  expectedHeadHash: finalChain.headHash,
  expectedBackupSha256: backupSha256,
});
assert.equal(restoreEvidence.status, "pass");
assert.equal(restoreEvidence.exactEventEquality, true);
assert.equal(restoreEvidence.databaseReadback.eventCount, finalEvents.length);
assert.equal(restoreEvidence.databaseReadback.headHash, finalChain.headHash);
timeline.push("independent_append_only_restore_ledger_and_exact_chain_equality_passed");

const secondRestartStore = makeStore();
const secondRestartService = new StagingWorkflowService({ store: secondRestartStore, now });
await secondRestartService.initialize();
const finalState = await secondRestartService.state();
const finalWorkspaceA = await secondRestartService.getWorkspace(raterA.sessionToken);
assert.equal(finalState.ratings.filter((rating) => rating.eventType === "initial").length, 8);
assert.equal(finalState.ratings.filter((rating) => rating.eventType === "rerating").length, 4);
assert.equal(finalState.labelSnapshots.length, 1);
assert.equal(finalWorkspaceA.assignments.some((assignment) => assignment.kind === "rerating" && assignment.status === "submitted"), true);
timeline.push("second_runtime_restart_preserved_sessions_ratings_receipts_and_snapshot");

const report = {
  schemaVersion: "metaphilosophy-protected-hosted-synthetic-acceptance-v1",
  generatedAt: new Date().toISOString(),
  status: "pass",
  exactReleaseSha,
  releaseBranch: RELEASE_PREVIEW_BRANCH,
  acceptanceRunId,
  preservedPriorPrimary: startingPrimary,
  scope: "Vercel preview build identity exercising the retained OIDC-authenticated hosted staging database; no public or remote bootstrap endpoint",
  researchRatingsAuthorized: false,
  timeline,
  lmcaMethod: {
    contextualizedPositionCritiquePairs: true,
    siblingCritiques: 4,
    dimensions: ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"],
    strengthCentralityProductRetained: true,
    initialRatersBlindToEachOther: true,
    originalRatingsImmutable: true,
  },
  counts: {
    identities: finalState.identities.length,
    assignments: finalState.assignments.length,
    initialRatings: finalState.ratings.filter((rating) => rating.eventType === "initial").length,
    reratings: finalState.ratings.filter((rating) => rating.eventType === "rerating").length,
    labelSnapshots: finalState.labelSnapshots.length,
    primaryEvents: finalEvents.length,
    restoredEvents: restoreEvidence.databaseReadback.eventCount,
  },
  chain: {
    primaryHeadHash: finalChain.headHash,
    restoredHeadHash: restoreEvidence.databaseReadback.headHash,
    canonicalBackupSha256: backupSha256,
    sequenceGapCount: restoreEvidence.databaseReadback.sequenceGapCount,
    previousHashMismatchCount: restoreEvidence.databaseReadback.previousHashMismatchCount,
    duplicateEventIdCount: restoreEvidence.databaseReadback.duplicateEventIdCount,
    duplicateEventHashCount: restoreEvidence.databaseReadback.duplicateEventHashCount,
  },
  boundaries: {
    protectedOrRealResearchItemPresent: false,
    realPersonContacted: false,
    outboundMessageSent: false,
    researchRatingCollected: false,
    paymentPromisedOrMade: false,
    fundingSubmissionMade: false,
    productionChanged: false,
    remoteBootstrapEnabled: false,
  },
  remainingGates: {
    qualifiedHumanDryRunsComplete: false,
    operationsOwnerReadinessSigned: false,
    participantContactAuthorized: false,
  },
};

const retained = await acceptanceRequest("report.store", {
  reportKind: REPORT_KIND,
  status: "pass",
  report,
  events: finalEvents,
  backupSha256,
  headHash: finalChain.headHash,
  eventCount: finalEvents.length,
});
assert.equal(retained.report.status, "pass");
assert.equal(retained.report.researchRatingsAuthorized, false);
assert.equal(retained.report.exactReleaseSha, exactReleaseSha);

console.log(JSON.stringify({
  ...report,
  evidence: {
    retainedReportId: retained.report.id,
    retainedAt: retained.report.createdAt,
    replay: retained.replay,
  },
}, null, 2));

async function redeemIdentity(identityId, label) {
  const invite = await service.createInvite({
    actorSessionToken: operator.sessionToken,
    identityId,
    expiresInHours: 24,
  });
  return service.redeemInvite({
    token: invite.token,
    userAgent: `metaphilosophy-hosted-acceptance-${label}`,
  });
}

async function acceptanceRequest(action, extra = {}) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let response;
    let payload;
    try {
      response = await fetch(ACCEPTANCE_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${oidcToken}`,
          "Content-Type": "application/json",
          "X-Metaphilosophy-Release-Sha": exactReleaseSha,
          "X-Metaphilosophy-Release-Branch": RELEASE_PREVIEW_BRANCH,
        },
        body: JSON.stringify({ action, exactReleaseSha, ...extra }),
        signal: AbortSignal.timeout(120_000),
      });
      payload = await response.json().catch(() => null);
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 250 * attempt));
      continue;
    }
    if (response.ok && payload?.ok === true) return payload.data;
    const retryable = response.status >= 500
      || (response.status === 401 && payload?.error?.code === "oidc_token_rejected");
    if (!retryable || attempt === 3) {
      throw new Error(
        payload?.error?.message
          ? `${action} failed with HTTP ${response.status}: ${payload.error.code} ${payload.error.message}`
          : `${action} failed with HTTP ${response.status}.`,
      );
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250 * attempt));
  }
  throw new Error(`${action} exhausted its bounded hosted acceptance retry policy.`);
}

function hostedRehearsalFixture(runId) {
  const prefix = `synthetic-hosted-${runId}`;
  return {
    position: {
      id: `${prefix}-position`,
      version: "1",
      title: "Synthetic hosted rehearsal: contextualized conceptual critique evaluation",
      text: "A community can improve judgment on conceptual questions by comparing contextualized objections even when it lacks a decisive answer to the underlying question. Comparative evaluation of relevance, correctness, clarity, and argumentative force can therefore provide useful supervision for systems that reason about philosophy.",
      context: "This uniquely identified record exists only for the protected hosted synthetic acceptance run and must never enter Pilot 01 research results.",
    },
    critiques: [
      { id: `${prefix}-critique-001`, version: "1", text: "Agreement about local argumentative qualities could reflect a shared but systematically biased standard, so convergence alone does not establish epistemic progress." },
      { id: `${prefix}-critique-002`, version: "1", text: "The position does not specify how omitted background commitments are represented; an objection can appear decisive only because the relevant context has been withheld." },
      { id: `${prefix}-critique-003`, version: "1", text: "Even if critique evaluation is easier than settling conclusions, the ratings may still be too noisy to provide useful supervision. Comparative ease is not adequacy." },
      { id: `${prefix}-critique-004`, version: "1", text: "Famous objections may survive because of canon formation rather than merit, so training on expert consensus can reproduce historical selection effects." },
    ],
  };
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
    rationale: "This synthetic hosted rationale identifies the attacked claim, assesses centrality and object-level force, and does not infer quality from source, author, or prose style.",
    confidence: "high",
    timeSpentSeconds: 420,
    interpretationConfidence: overrides.interpretationConfidence ?? "high",
    backgroundAssumptions: overrides.backgroundAssumptions ?? "Read the stated position and critique relatively literally and do not import an unstated reply.",
    assessability: "assessable",
    issueFlags: overrides.issueFlags ?? [],
    verificationStatus: "not_needed",
    requestReview: Boolean(overrides.requestReview),
  };
}

function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}
