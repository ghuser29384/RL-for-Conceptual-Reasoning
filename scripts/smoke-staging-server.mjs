import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { FileEventStore } from "../src/staging-event-store.mjs";
import { reduceStagingEvents } from "../src/staging-service.mjs";
import { createLmcaServer } from "../src/server.mjs";

const rootDir = resolve(import.meta.dirname, "..");
const temporaryRoot = await mkdtemp(join(tmpdir(), "metaphilosophy-staging-smoke-"));
const dataDir = resolve(temporaryRoot, "data");
const environment = {
  ...process.env,
  STAGING_DATA_DIR: dataDir,
  STAGING_BOOTSTRAP_TOKEN: "synthetic-rehearsal-bootstrap-token-32-bytes-minimum",
  STAGING_CSRF_SECRET: "synthetic-rehearsal-csrf-secret-32-bytes-minimum",
  STAGING_ALLOW_REMOTE_BOOTSTRAP: "false",
};
const reportPath = resolve(process.env.STAGING_SMOKE_REPORT ?? ".staging-evidence/human-workflow-smoke-report.json");
const timeline = [];

let server = await startServer();
let baseUrl = serverBaseUrl(server);

try {
  const stagingPage = await fetch(`${baseUrl}/staging/`, { redirect: "error" });
  assert.equal(stagingPage.status, 200);
  assert.match(await stagingPage.text(), /Synthetic rehearsal only/);
  timeline.push("staging_shell_loaded");

  const health = await anonymousRequest("health");
  assert.equal(health.status, "ok");
  assert.equal(health.researchRatingsAuthorized, false);
  timeline.push("health_fail_closed_for_research");

  const bootstrap = await rawRequest("bootstrap", {
    method: "POST",
    headers: { "x-staging-bootstrap-token": environment.STAGING_BOOTSTRAP_TOKEN },
    body: { operatorEmail: "operator@staging.metaphilosophy.invalid" },
  });
  assert.equal(bootstrap.positionId, "synthetic-rehearsal-position-001");
  timeline.push("synthetic_operator_bootstrapped");

  const operator = await redeem(bootstrap.inviteToken);
  assert.equal(operator.identity.role, "operator");

  const raterAIdentity = await operator.request("identity.create", {
    method: "POST",
    body: { role: "rater", displayName: "Synthetic dry-run rater A", email: "rater-a@staging.metaphilosophy.invalid" },
  });
  const raterBIdentity = await operator.request("identity.create", {
    method: "POST",
    body: { role: "rater", displayName: "Synthetic dry-run rater B", email: "rater-b@staging.metaphilosophy.invalid" },
  });
  const adjudicatorIdentity = await operator.request("identity.create", {
    method: "POST",
    body: { role: "adjudicator", displayName: "Synthetic dry-run adjudicator", email: "adjudicator@staging.metaphilosophy.invalid" },
  });
  const recoveryIdentity = await operator.request("identity.create", {
    method: "POST",
    body: { role: "rater", displayName: "Synthetic recovery identity", email: "recovery@staging.metaphilosophy.invalid" },
  });
  timeline.push("controlled_identities_created");

  const recoveryInvite = await operator.request("invite.create", { method: "POST", body: { identityId: recoveryIdentity.identity.id, expiresInHours: 2 } });
  await operator.request("invite.revoke", { method: "POST", body: { inviteId: recoveryInvite.invite.id, reason: "synthetic revocation drill" } });
  await assert.rejects(() => redeem(recoveryInvite.token), (error) => error.status === 401 && error.code === "revoked_invite");
  const replacementInvite = await operator.request("invite.replace", { method: "POST", body: { inviteId: recoveryInvite.invite.id, expiresInHours: 2 } });
  const recoveredSession = await redeem(replacementInvite.token);
  assert.equal(recoveredSession.identity.id, recoveryIdentity.identity.id);
  await recoveredSession.request("logout", { method: "POST", body: {} });
  timeline.push("invite_revoke_replace_recovery_passed");

  const raterAInvite = await operator.request("invite.create", { method: "POST", body: { identityId: raterAIdentity.identity.id, expiresInHours: 24 } });
  const raterBInvite = await operator.request("invite.create", { method: "POST", body: { identityId: raterBIdentity.identity.id, expiresInHours: 24 } });
  const adjudicatorInvite = await operator.request("invite.create", { method: "POST", body: { identityId: adjudicatorIdentity.identity.id, expiresInHours: 24 } });

  const assignmentA = await operator.request("assignment.create", { method: "POST", body: { identityId: raterAIdentity.identity.id, positionId: bootstrap.positionId, kind: "initial" } });
  const assignmentB = await operator.request("assignment.create", { method: "POST", body: { identityId: raterBIdentity.identity.id, positionId: bootstrap.positionId, kind: "initial" } });
  const raterA = await redeem(raterAInvite.token);
  const raterB = await redeem(raterBInvite.token);
  const adjudicator = await redeem(adjudicatorInvite.token);
  timeline.push("two_isolated_raters_and_adjudicator_authenticated");

  const workspaceA = await raterA.request("workspace");
  const workspaceB = await raterB.request("workspace");
  assert.equal(workspaceA.assignments.length, 1);
  assert.equal(workspaceB.assignments.length, 1);
  assert.equal(workspaceA.assignments[0].critiques.length, 4);
  assert.equal(workspaceA.assignments[0].position.status, "synthetic_rehearsal_only");
  assert.ok(workspaceA.rubric.generalGuidance.length >= 6);
  assert.equal(JSON.stringify(workspaceA).includes(raterBIdentity.identity.id), false);
  assert.equal(JSON.stringify(workspaceB).includes(raterAIdentity.identity.id), false);

  const critiqueIds = workspaceA.assignments[0].critiques.map((critique) => critique.id);
  await assert.rejects(
    () => raterA.request("draft.save", {
      method: "PUT",
      body: { assignmentId: assignmentB.assignment.id, critiqueId: critiqueIds[0], expectedVersion: 0, rating: makeRating(0.7, 0.7) },
    }),
    (error) => error.status === 403 && error.code === "assignment_forbidden",
  );
  timeline.push("cross_account_and_direct_object_access_denied");

  const firstSave = await raterA.request("draft.save", {
    method: "PUT",
    body: { assignmentId: assignmentA.assignment.id, critiqueId: critiqueIds[0], expectedVersion: 0, rating: makeRating(0.85, 0.85, { requestReview: true }) },
  });
  assert.equal(firstSave.draft.version, 1);
  await assert.rejects(
    () => raterA.request("draft.save", {
      method: "PUT",
      body: { assignmentId: assignmentA.assignment.id, critiqueId: critiqueIds[0], expectedVersion: 0, rating: makeRating(0.8, 0.8) },
    }),
    (error) => error.status === 409 && error.code === "draft_version_conflict" && error.detail.currentVersion === 1,
  );
  await raterA.request("draft.save", {
    method: "PUT",
    body: { assignmentId: assignmentA.assignment.id, critiqueId: critiqueIds[0], expectedVersion: 1, rating: makeRating(0.85, 0.85, { requestReview: true }) },
  });
  for (let index = 1; index < critiqueIds.length; index += 1) {
    await raterA.request("draft.save", {
      method: "PUT",
      body: { assignmentId: assignmentA.assignment.id, critiqueId: critiqueIds[index], expectedVersion: 0, rating: makeRating(0.62 - index * 0.12, 0.75) },
    });
  }
  for (let index = 0; index < critiqueIds.length; index += 1) {
    await raterB.request("draft.save", {
      method: "PUT",
      body: { assignmentId: assignmentB.assignment.id, critiqueId: critiqueIds[index], expectedVersion: 0, rating: makeRating(index === 0 ? 0.1 : 0.62 - index * 0.12, index === 0 ? 0.2 : 0.75, { interpretationConfidence: index === 0 ? "low" : "high" }) },
    });
  }
  timeline.push("autosave_and_optimistic_conflict_recovery_passed");

  await stopServer(server);
  server = await startServer();
  baseUrl = serverBaseUrl(server);
  raterA.baseUrl = baseUrl;
  raterB.baseUrl = baseUrl;
  operator.baseUrl = baseUrl;
  adjudicator.baseUrl = baseUrl;
  const resumedA = await raterA.request("workspace");
  assert.equal(resumedA.assignments[0].critiques.every((critique) => critique.draft), true);
  timeline.push("server_restart_and_draft_resume_passed");

  const packetHashA = resumedA.assignments[0].packetHash;
  await assert.rejects(
    () => raterA.request("assignment.submit", {
      method: "POST",
      body: { assignmentId: assignmentA.assignment.id, idempotencyKey: `tamper:${crypto.randomUUID()}`, packetHash: `${packetHashA.slice(0, -1)}0` },
    }),
    (error) => error.status === 409 && error.code === "packet_hash_mismatch",
  );

  const keyA = `submit:${assignmentA.assignment.id}:${crypto.randomUUID()}`;
  const submitA = await raterA.request("assignment.submit", {
    method: "POST",
    body: { assignmentId: assignmentA.assignment.id, idempotencyKey: keyA, packetHash: packetHashA },
  });
  assert.equal(submitA.replay, false);
  const replayA = await raterA.request("assignment.submit", {
    method: "POST",
    body: { assignmentId: assignmentA.assignment.id, idempotencyKey: keyA, packetHash: packetHashA },
  });
  assert.equal(replayA.replay, true);
  await assert.rejects(
    () => raterA.request("assignment.submit", {
      method: "POST",
      body: { assignmentId: assignmentA.assignment.id, idempotencyKey: `duplicate:${crypto.randomUUID()}`, packetHash: packetHashA },
    }),
    (error) => error.status === 409 && error.code === "already_submitted",
  );

  const packetHashB = (await raterB.request("workspace")).assignments[0].packetHash;
  await raterB.request("assignment.submit", {
    method: "POST",
    body: { assignmentId: assignmentB.assignment.id, idempotencyKey: `submit:${assignmentB.assignment.id}:${crypto.randomUUID()}`, packetHash: packetHashB },
  });
  timeline.push("tamper_rejection_exactly_once_submission_and_receipts_passed");

  const operatorAfterRatings = await operator.request("workspace");
  assert.equal(operatorAfterRatings.counts.ratings, 8);
  assert.equal(operatorAfterRatings.counts.openAdjudicationCases, 1);

  const correction = await raterA.request("correction.request", {
    method: "POST",
    body: { assignmentId: assignmentA.assignment.id, reason: "Synthetic drill: the rater identified an object-level interpretation mistake after locking the initial ratings." },
  });
  const correctionResolution = await operator.request("correction.resolve", {
    method: "POST",
    body: { requestId: correction.request.id, action: "approve_rerating", notes: "Synthetic drill approval. Preserve the original ratings and create a linked re-rating assignment." },
  });
  assert.equal(correctionResolution.assignment.predecessorAssignmentId, assignmentA.assignment.id);
  const reratingWorkspace = await raterA.request("workspace");
  const reratingAssignment = reratingWorkspace.assignments.find((assignment) => assignment.kind === "rerating");
  assert.ok(reratingAssignment);
  for (const critique of reratingAssignment.critiques) {
    await raterA.request("draft.save", {
      method: "PUT",
      body: { assignmentId: reratingAssignment.id, critiqueId: critique.id, expectedVersion: 0, rating: makeRating(0.55, 0.65, { backgroundAssumptions: "Object-level reconsideration after noticing an interpretation issue; the initial record remains preserved." }) },
    });
  }
  await raterA.request("assignment.submit", {
    method: "POST",
    body: { assignmentId: reratingAssignment.id, idempotencyKey: `rerating:${reratingAssignment.id}:${crypto.randomUUID()}`, packetHash: reratingAssignment.packetHash },
  });
  timeline.push("immutable_initials_and_linked_rerating_passed");

  const adjudicatorWorkspace = await adjudicator.request("workspace");
  assert.equal(adjudicatorWorkspace.cases.length, 1);
  const caseId = adjudicatorWorkspace.cases[0].id;
  await adjudicator.request("adjudication.review", {
    method: "POST",
    body: {
      caseId,
      disposition: "unresolved",
      explanation: "Synthetic drill: both literal readings remain plausible after object-level review, so the disagreement should be represented as unresolved rather than forced into consensus.",
      requiresRerating: false,
    },
  });
  const closed = await operator.request("adjudication.close", {
    method: "POST",
    body: { caseId, status: "unresolved", notes: "Synthetic drill closure. Preserve initial ratings, linked re-rating, and explicit interpretation uncertainty in the snapshot." },
  });
  assert.equal(closed.snapshot.status, "unresolved");
  assert.equal(closed.snapshot.initialRatingIds.length, 8);
  assert.equal(closed.snapshot.reratingIds.length, 4);
  timeline.push("human_adjudication_handoff_and_unresolved_snapshot_passed");

  await raterB.request("withdrawal.request", {
    method: "POST",
    body: { assignmentId: assignmentB.assignment.id, reason: "Synthetic drill: test withdrawal recording after accepted initial work without deleting the immutable records." },
  });
  timeline.push("correction_and_withdrawal_workflows_passed");

  const privateExport = await operator.request("export.private");
  const publicExport = await operator.request("export.public");
  assert.ok(privateExport.events.length > 30);
  assert.equal(JSON.stringify(publicExport).includes("@staging.metaphilosophy.invalid"), false);
  assert.equal(publicExport.counts.ratings, 12);
  timeline.push("private_audit_and_public_safe_exports_passed");

  await stopServer(server);
  server = null;
  const sourceStore = new FileEventStore({ filePath: resolve(dataDir, "events.jsonl") });
  await sourceStore.initialize();
  const backupPath = resolve(temporaryRoot, "backup", "events.jsonl");
  const backup = await sourceStore.backup(backupPath);
  const restoredStore = new FileEventStore({ filePath: resolve(temporaryRoot, "restored", "events.jsonl") });
  await restoredStore.initialize();
  const restored = await restoredStore.restore(backupPath);
  assert.equal(restored.headHash, backup.headHash);
  const restoredState = reduceStagingEvents(await restoredStore.loadEvents());
  assert.equal(restoredState.ratings.length, 12);
  assert.equal(restoredState.labelSnapshots.length, 1);
  timeline.push("backup_restore_and_hash_chain_readback_passed");

  const report = {
    generatedAt: new Date().toISOString(),
    purpose: "synthetic_rehearsal_only",
    researchRatingsAuthorized: false,
    status: "pass",
    timeline,
    assertions: {
      fullLmcaRubricRenderedByContract: true,
      twoIsolatedRaterSessions: true,
      crossAccountDenial: true,
      autosaveResume: true,
      staleWriteConflict: true,
      packetTamperRejection: true,
      idempotentSubmission: true,
      immutableInitialRatings: 8,
      linkedReratings: 4,
      unresolvedAdjudicationSnapshot: 1,
      privateAndPublicExports: true,
      backupRestoreHeadHashMatch: true,
    },
    chain: { events: backup.events, headHash: backup.headHash },
    limitations: [
      "This is an automated synthetic rehearsal, not evidence from qualified human dry-run raters.",
      "No hosted database or preview deployment was exercised.",
      "No research rating, participant selection, outreach, payment, or funding submission was authorized.",
    ],
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (server) await stopServer(server);
}

async function startServer() {
  const serverInstance = createLmcaServer({ rootDir, dataDir, environment });
  await new Promise((resolvePromise, reject) => {
    serverInstance.once("error", reject);
    serverInstance.listen(0, "127.0.0.1", () => {
      serverInstance.off("error", reject);
      resolvePromise();
    });
  });
  return serverInstance;
}

function serverBaseUrl(serverInstance) {
  return `http://127.0.0.1:${serverInstance.address().port}`;
}

async function stopServer(serverInstance) {
  await new Promise((resolvePromise, reject) => serverInstance.close((error) => error ? reject(error) : resolvePromise()));
}

async function anonymousRequest(action, options = {}) {
  return rawRequest(action, options);
}

async function rawRequest(action, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(`${baseUrl}/api/staging?action=${encodeURIComponent(action)}`, {
    method,
    headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "error",
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    const error = new Error(payload.error?.message ?? `HTTP ${response.status}`);
    error.status = response.status;
    error.code = payload.error?.code;
    error.detail = payload.error?.detail;
    throw error;
  }
  return payload.data;
}

async function redeem(token) {
  const response = await fetch(`${baseUrl}/api/staging?action=invite.redeem`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    redirect: "error",
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    const error = new Error(payload.error?.message ?? `HTTP ${response.status}`);
    error.status = response.status;
    error.code = payload.error?.code;
    error.detail = payload.error?.detail;
    throw error;
  }
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  return makeClient({ cookie: setCookie.split(";", 1)[0], csrfToken: payload.data.csrfToken, identity: payload.data.identity });
}

function makeClient({ cookie, csrfToken, identity }) {
  return {
    baseUrl,
    cookie,
    csrfToken,
    identity,
    async request(action, { method = "GET", body } = {}) {
      const response = await fetch(`${this.baseUrl}/api/staging?action=${encodeURIComponent(action)}`, {
        method,
        headers: {
          Accept: "application/json",
          Cookie: this.cookie,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(method === "GET" ? {} : { "X-Staging-CSRF": this.csrfToken, "Sec-Fetch-Site": "same-origin" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "error",
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        const error = new Error(payload.error?.message ?? `HTTP ${response.status}`);
        error.status = response.status;
        error.code = payload.error?.code;
        error.detail = payload.error?.detail;
        throw error;
      }
      return payload.data;
    },
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
    rationale: "This synthetic rehearsal rationale identifies the attacked claim, evaluates the object-level force of the objection, and records why the numerical judgment follows.",
    confidence: "high",
    timeSpentSeconds: 420,
    interpretationConfidence: overrides.interpretationConfidence ?? "high",
    backgroundAssumptions: overrides.backgroundAssumptions ?? "Assume the position is read literally and no unstated reply is imported.",
    assessability: "assessable",
    issueFlags: overrides.interpretationConfidence === "low" ? ["position_ambiguity"] : [],
    verificationStatus: "not_needed",
    requestReview: Boolean(overrides.requestReview),
  };
}
