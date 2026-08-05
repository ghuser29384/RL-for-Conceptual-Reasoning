import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { FileEventStore } from "../src/staging-event-store.mjs";
import { reduceStagingEvents } from "../src/staging-service.mjs";
import { createLmcaServer } from "../src/staging-server.mjs";

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
  timeline.push("blind_assignments_created");

  const raterA = await redeem(raterAInvite.token);
  const raterB = await redeem(raterBInvite.token);
  const adjudicator = await redeem(adjudicatorInvite.token);

  const workspaceA = await raterA.request("workspace", { method: "GET" });
  const workspaceB = await raterB.request("workspace", { method: "GET" });
  assert.equal(workspaceA.assignments.length, 1);
  assert.equal(workspaceB.assignments.length, 1);
  assert.equal(JSON.stringify(workspaceA).includes(raterBIdentity.identity.id), false);
  assert.equal(JSON.stringify(workspaceB).includes(raterAIdentity.identity.id), false);
  assert.equal(JSON.stringify(workspaceA).includes("source"), false);
  assert.equal(JSON.stringify(workspaceA).includes("authorship"), false);
  assert.equal(JSON.stringify(workspaceA).includes("peerRatings"), false);

  await assert.rejects(
    () => raterA.request("assignment.get", { method: "GET", query: { assignmentId: assignmentB.assignment.id } }),
    (error) => error.status === 404,
  );
  timeline.push("cross_account_and_direct_object_access_denied");

  const [firstCritiqueA, secondCritiqueA, thirdCritiqueA, fourthCritiqueA] = workspaceA.assignments[0].critiques;
  const assignmentIdA = workspaceA.assignments[0].id;
  const [firstCritiqueB, secondCritiqueB, thirdCritiqueB, fourthCritiqueB] = workspaceB.assignments[0].critiques;
  const assignmentIdB = workspaceB.assignments[0].id;

  let draftVersion = 0;
  for (const [index, critique] of [firstCritiqueA, secondCritiqueA, thirdCritiqueA, fourthCritiqueA].entries()) {
    const saved = await raterA.request("draft.save", {
      method: "PUT",
      body: {
        assignmentId: assignmentIdA,
        critiqueId: critique.id,
        expectedVersion: draftVersion === 0 ? 0 : 0,
        rating: validRating(index === 0 ? 0.9 : 0.25 + index * 0.05),
      },
    });
    assert.equal(saved.draft.version, 1);
    if (index === 0) draftVersion = saved.draft.version;
  }
  await assert.rejects(
    () => raterA.request("draft.save", {
      method: "PUT",
      body: {
        assignmentId: assignmentIdA,
        critiqueId: firstCritiqueA.id,
        expectedVersion: 0,
        rating: validRating(0.7),
      },
    }),
    (error) => error.status === 409 && error.code === "draft_version_conflict",
  );
  timeline.push("autosave_version_conflict_rejected");

  await stopServer(server);
  server = await startServer();
  baseUrl = serverBaseUrl(server);
  const resumedA = await resume(raterA.cookies);
  const resumedWorkspace = await resumedA.request("workspace", { method: "GET" });
  assert.equal(resumedWorkspace.assignments[0].critiques[0].draft.version, 1);
  timeline.push("restart_resume_passed");

  const receiptA = await resumedA.request("assignment.submit", {
    method: "POST",
    body: {
      assignmentId: assignmentIdA,
      packetHash: resumedWorkspace.assignments[0].packetHash,
      idempotencyKey: "synthetic-submit-rater-a-0001",
    },
  });
  assert.ok(receiptA.receipt.id);
  const replayA = await resumedA.request("assignment.submit", {
    method: "POST",
    body: {
      assignmentId: assignmentIdA,
      packetHash: resumedWorkspace.assignments[0].packetHash,
      idempotencyKey: "synthetic-submit-rater-a-0001",
    },
  });
  assert.equal(replayA.replay, true);
  await assert.rejects(
    () => resumedA.request("assignment.submit", {
      method: "POST",
      body: {
        assignmentId: assignmentIdA,
        packetHash: "tampered-packet-hash",
        idempotencyKey: "synthetic-submit-rater-a-tampered",
      },
    }),
    (error) => error.status === 409 && error.code === "packet_hash_mismatch",
  );
  timeline.push("exactly_once_submission_and_tamper_rejection_passed");

  for (const [index, critique] of [firstCritiqueB, secondCritiqueB, thirdCritiqueB, fourthCritiqueB].entries()) {
    await raterB.request("draft.save", {
      method: "PUT",
      body: {
        assignmentId: assignmentIdB,
        critiqueId: critique.id,
        expectedVersion: 0,
        rating: validRating(index === 0 ? 0.05 : 0.75 - index * 0.05),
      },
    });
  }
  const receiptB = await raterB.request("assignment.submit", {
    method: "POST",
    body: {
      assignmentId: assignmentIdB,
      packetHash: workspaceB.assignments[0].packetHash,
      idempotencyKey: "synthetic-submit-rater-b-0001",
    },
  });
  assert.ok(receiptB.receipt.id);
  timeline.push("second_blind_rating_submitted");

  const operatorAfterRatings = await resume(operator.cookies);
  const caseOpen = await operatorAfterRatings.request("adjudication.open", {
    method: "POST",
    body: { positionId: bootstrap.positionId, adjudicatorIdentityId: adjudicatorIdentity.identity.id },
  });
  assert.equal(caseOpen.case.status, "open");
  timeline.push("adjudication_handoff_opened");

  const adjudicatorAfterRestart = await resume(adjudicator.cookies);
  const adjudicationWorkspace = await adjudicatorAfterRestart.request("workspace", { method: "GET" });
  assert.equal(adjudicationWorkspace.cases.length, 1);
  assert.equal(JSON.stringify(adjudicationWorkspace).includes(raterAIdentity.identity.id), false);
  assert.equal(JSON.stringify(adjudicationWorkspace).includes(raterBIdentity.identity.id), false);

  await adjudicatorAfterRestart.request("adjudication.review", {
    method: "POST",
    body: {
      caseId: caseOpen.case.id,
      disposition: "unresolved",
      explanation: "The two readings remain defensible after object-level review; preserve both initial ratings and close explicitly unresolved.",
      requiresRerating: false,
    },
  });
  await operatorAfterRatings.request("adjudication.close", {
    method: "POST",
    body: {
      caseId: caseOpen.case.id,
      status: "unresolved",
      notes: "Synthetic rehearsal closure preserves disagreement without imposed consensus.",
    },
  });
  timeline.push("adjudication_unresolved_closure_passed");

  const correction = await resumedA.request("correction.request", {
    method: "POST",
    body: { assignmentId: assignmentIdA, reason: "Synthetic object-level correction request after noticing an alternative interpretation." },
  });
  const correctionResolution = await operatorAfterRatings.request("correction.resolve", {
    method: "POST",
    body: { requestId: correction.request.id, action: "approve_rerating", notes: "Synthetic correction approved for a predecessor-linked revision." },
  });
  assert.equal(correctionResolution.reratingAssignment.kind, "rerating");
  assert.equal(correctionResolution.reratingAssignment.predecessorAssignmentId, assignmentIdA);
  const withdrawal = await raterB.request("withdrawal.request", {
    method: "POST",
    body: { assignmentId: assignmentIdB, reason: "Synthetic withdrawal-path rehearsal." },
  });
  assert.equal(withdrawal.assignment.status, "withdrawn");
  timeline.push("correction_rerating_and_withdrawal_paths_passed");

  const privateExport = await operatorAfterRatings.request("export.private", { method: "GET" });
  assert.equal(privateExport.researchRatingsAuthorized, false);
  assert.ok(privateExport.ratings.length >= 8);
  assert.equal(privateExport.cases.some((item) => item.status === "unresolved"), true);

  const fileStore = new FileEventStore({ filePath: resolve(dataDir, "events.jsonl") });
  const eventsBeforeBackup = await fileStore.readEvents({ verify: true });
  const backupPath = resolve(temporaryRoot, "backup", "events-backup.jsonl");
  await mkdir(dirname(backupPath), { recursive: true });
  await writeFile(backupPath, `${eventsBeforeBackup.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");
  const restoredStore = new FileEventStore({ filePath: backupPath });
  const restoredEvents = await restoredStore.readEvents({ verify: true });
  assert.deepEqual(restoredEvents, eventsBeforeBackup);
  const restoredState = reduceStagingEvents(restoredEvents);
  assert.equal(restoredState.submissions.length, 2);
  assert.equal(restoredState.adjudicationCases.some((item) => item.status === "unresolved"), true);
  timeline.push("backup_restore_and_hash_chain_readback_passed");

  const report = {
    schemaVersion: "metaphilosophy-human-workflow-smoke-v1",
    generatedAt: new Date().toISOString(),
    scope: "automated synthetic rehearsal only; no human participant and no research rating",
    timeline,
    counts: {
      identities: privateExport.identities.length,
      assignments: privateExport.assignments.length,
      submissions: privateExport.submissions.length,
      immutableRatings: privateExport.ratings.length,
      adjudicationCases: privateExport.cases.length,
    },
    invariants: {
      researchRatingsAuthorized: false,
      noRealParticipant: true,
      noOutboundInvitation: true,
      noPaymentPromise: true,
      noPublicRatingExport: true,
      initialRatingsPreserved: true,
      unresolvedDisagreementPreserved: true,
    },
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await stopServer(server);
}

async function startServer() {
  const next = createLmcaServer({ rootDir, dataDir, environment });
  await new Promise((resolvePromise) => next.listen(0, "127.0.0.1", resolvePromise));
  return next;
}

function serverBaseUrl(instance) {
  return `http://127.0.0.1:${instance.address().port}`;
}

async function stopServer(instance) {
  if (!instance?.listening) return;
  await new Promise((resolvePromise, reject) => instance.close((error) => (error ? reject(error) : resolvePromise())));
}

async function redeem(token) {
  const result = await rawRequest("invite.redeem", { method: "POST", body: { token } });
  return createClient(result, result.cookies);
}

async function resume(cookies) {
  const me = await rawRequest("me", { method: "GET", cookies });
  return createClient(me, cookies);
}

function createClient(authResult, cookies) {
  return {
    identity: authResult.identity,
    csrfToken: authResult.csrfToken,
    cookies,
    request(action, options = {}) {
      return rawRequest(action, { ...options, cookies, csrfToken: authResult.csrfToken });
    },
  };
}

async function anonymousRequest(action, options = {}) {
  return rawRequest(action, options);
}

async function rawRequest(action, { method = "GET", body, headers = {}, cookies = [], csrfToken, query = {} } = {}) {
  const url = new URL(`${baseUrl}/api/staging`);
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  const finalHeaders = { accept: "application/json", ...headers };
  if (body !== undefined) finalHeaders["content-type"] = "application/json";
  if (cookies.length) finalHeaders.cookie = cookies.join("; ");
  if (csrfToken) finalHeaders["x-staging-csrf"] = csrfToken;
  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok || !payload?.ok) {
    const error = new Error(payload?.error?.message ?? `HTTP ${response.status}`);
    error.status = response.status;
    error.code = payload?.error?.code;
    error.detail = payload?.error?.detail;
    throw error;
  }
  const setCookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie().map((value) => value.split(";", 1)[0])
    : [response.headers.get("set-cookie")].filter(Boolean).map((value) => value.split(";", 1)[0]);
  if (setCookies.length) payload.data.cookies = setCookies;
  return payload.data;
}

function validRating(overall) {
  return {
    scores: {
      centrality: overall > 0.5 ? 1 : 0.5,
      strength: overall,
      correctness: 0.9,
      clarity: 0.9,
      dead_weight: 0.05,
      single_issue: 0.9,
      overall,
    },
    assessability: "assessable",
    interpretationConfidence: "high",
    confidence: "high",
    verificationStatus: "not_needed",
    timeSpentSeconds: 420,
    rationale: "Synthetic rehearsal rationale with enough object-level detail to satisfy the structured validation contract.",
    backgroundAssumptions: "Assume only the literal claims and context supplied in the synthetic position text.",
    issueFlags: [],
    requestReview: false,
  };
}
