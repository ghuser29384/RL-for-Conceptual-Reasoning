import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { FileEventStore } from "../src/staging-event-store.mjs";
import { RUBRIC, SCORE_DIMENSIONS, validateRatingPayload } from "../src/staging-rubric.mjs";
import { StagingWorkflowService } from "../src/staging-service.mjs";

test("LMCA-derived rubric preserves seven dimensions and requires structured ambiguity fields", () => {
  assert.deepEqual(SCORE_DIMENSIONS, ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"]);
  assert.equal(Object.keys(RUBRIC.dimensions).length, 7);
  assert.match(RUBRIC.dimensions.strength.guidance.join(" "), /strength × centrality/);
  assert.match(RUBRIC.dimensions.clarity.guidance.join(" "), /below 0\.5/);

  const valid = validateRatingPayload(makeRating(0.7, 0.8));
  assert.equal(valid.ok, true);
  assert.equal(valid.substantiveImpact, 0.72);

  const invalid = validateRatingPayload({ scores: {}, rationale: "", issueFlags: [] });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors["scores.overall"]);
  assert.ok(invalid.errors.interpretationConfidence);
  assert.ok(invalid.errors.assessability);
});

test("file event store is append-only, hash-chained, and detects tampering", async () => {
  const directory = await mkdtemp(join(tmpdir(), "metaphilosophy-event-store-test-"));
  const filePath = join(directory, "events.jsonl");
  const store = new FileEventStore({ filePath });
  await store.initialize();
  await store.append({ type: "test.one", aggregateId: "a", actorId: "actor", payload: { value: 1 } });
  await store.append({ type: "test.two", aggregateId: "a", actorId: "actor", payload: { value: 2 } });
  const chain = await store.verifyChain();
  assert.equal(chain.events, 2);
  assert.match(chain.headHash, /^[a-f0-9]{64}$/);

  const original = await readFile(filePath, "utf8");
  await writeFile(filePath, original.replace('"value":1', '"value":9'), "utf8");
  await assert.rejects(() => store.verifyChain(), /hash mismatch/i);
});

test("invite expiry, revocation, replacement, and session isolation fail closed", async () => {
  const harness = await makeHarness();
  const operator = await bootstrapOperator(harness);
  const rater = await harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", displayName: "Rater", email: "rater@example.invalid" });

  const expiring = await harness.service.createInvite({ actorSessionToken: operator.sessionToken, identityId: rater.identity.id, expiresInHours: 1 });
  harness.advanceHours(2);
  await assert.rejects(() => harness.service.redeemInvite({ token: expiring.token }), (error) => error.status === 401 && error.code === "expired_invite");

  const invite = await harness.service.createInvite({ actorSessionToken: operator.sessionToken, identityId: rater.identity.id, expiresInHours: 24 });
  await harness.service.revokeInvite({ actorSessionToken: operator.sessionToken, inviteId: invite.invite.id, reason: "test" });
  await assert.rejects(() => harness.service.redeemInvite({ token: invite.token }), (error) => error.status === 401 && error.code === "revoked_invite");

  const replacement = await harness.service.replaceInvite({ actorSessionToken: operator.sessionToken, inviteId: invite.invite.id, expiresInHours: 24 });
  const session = await harness.service.redeemInvite({ token: replacement.token });
  assert.equal(session.identity.id, rater.identity.id);
  await assert.rejects(() => harness.service.redeemInvite({ token: replacement.token }), (error) => error.status === 409 && error.code === "used_invite");

  await harness.service.logout(session.sessionToken);
  await assert.rejects(() => harness.service.me(session.sessionToken), (error) => error.status === 401);
});

test("two raters remain isolated and produce immutable, idempotent, adjudicable records", async () => {
  const harness = await makeHarness();
  const operator = await bootstrapOperator(harness);
  const state = await harness.service.state();
  const positionId = state.positions[0].id;
  const critiqueIds = state.critiques.map((critique) => critique.id);

  const raterAIdentity = await harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", displayName: "Rater A", email: "a@example.invalid" });
  const raterBIdentity = await harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", displayName: "Rater B", email: "b@example.invalid" });
  const adjudicatorIdentity = await harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "adjudicator", displayName: "Adjudicator", email: "adjudicator@example.invalid" });

  const raterA = await redeemIdentity(harness, operator.sessionToken, raterAIdentity.identity.id);
  const raterB = await redeemIdentity(harness, operator.sessionToken, raterBIdentity.identity.id);
  const adjudicator = await redeemIdentity(harness, operator.sessionToken, adjudicatorIdentity.identity.id);

  const assignmentA = await harness.service.createAssignment({ actorSessionToken: operator.sessionToken, identityId: raterAIdentity.identity.id, positionId, kind: "initial" });
  const assignmentB = await harness.service.createAssignment({ actorSessionToken: operator.sessionToken, identityId: raterBIdentity.identity.id, positionId, kind: "initial" });

  const workspaceA = await harness.service.getWorkspace(raterA.sessionToken);
  const workspaceB = await harness.service.getWorkspace(raterB.sessionToken);
  assert.equal(JSON.stringify(workspaceA).includes(raterBIdentity.identity.id), false);
  assert.equal(JSON.stringify(workspaceB).includes(raterAIdentity.identity.id), false);
  assert.equal(workspaceA.assignments[0].critiques.length, 4);

  await assert.rejects(
    () => harness.service.saveDraft({ sessionToken: raterA.sessionToken, assignmentId: assignmentB.assignment.id, critiqueId: critiqueIds[0], expectedVersion: 0, rating: makeRating(0.5, 0.5) }),
    (error) => error.status === 403 && error.code === "assignment_forbidden",
  );

  for (let index = 0; index < critiqueIds.length; index += 1) {
    await harness.service.saveDraft({
      sessionToken: raterA.sessionToken,
      assignmentId: assignmentA.assignment.id,
      critiqueId: critiqueIds[index],
      expectedVersion: 0,
      rating: makeRating(index === 0 ? 0.9 : 0.5, 0.9, { requestReview: index === 0 }),
    });
    await harness.service.saveDraft({
      sessionToken: raterB.sessionToken,
      assignmentId: assignmentB.assignment.id,
      critiqueId: critiqueIds[index],
      expectedVersion: 0,
      rating: makeRating(index === 0 ? 0.1 : 0.5, index === 0 ? 0.2 : 0.9, { interpretationConfidence: index === 0 ? "low" : "high" }),
    });
  }

  const packetA = assignmentA.assignment.packetHash;
  await assert.rejects(
    () => harness.service.submitAssignment({ sessionToken: raterA.sessionToken, assignmentId: assignmentA.assignment.id, idempotencyKey: `tamper:${crypto.randomUUID()}`, packetHash: `${packetA}x` }),
    (error) => error.status === 409 && error.code === "packet_hash_mismatch",
  );

  const keyA = `submit:${crypto.randomUUID()}`;
  const submittedA = await harness.service.submitAssignment({ sessionToken: raterA.sessionToken, assignmentId: assignmentA.assignment.id, idempotencyKey: keyA, packetHash: packetA });
  assert.equal(submittedA.replay, false);
  assert.equal((await harness.service.submitAssignment({ sessionToken: raterA.sessionToken, assignmentId: assignmentA.assignment.id, idempotencyKey: keyA, packetHash: packetA })).replay, true);
  await assert.rejects(
    () => harness.service.saveDraft({ sessionToken: raterA.sessionToken, assignmentId: assignmentA.assignment.id, critiqueId: critiqueIds[0], expectedVersion: 1, rating: makeRating(0.2, 0.2) }),
    (error) => error.status === 409 && error.code === "assignment_locked",
  );

  await harness.service.submitAssignment({ sessionToken: raterB.sessionToken, assignmentId: assignmentB.assignment.id, idempotencyKey: `submit:${crypto.randomUUID()}`, packetHash: assignmentB.assignment.packetHash });
  let afterInitials = await harness.service.state();
  assert.equal(afterInitials.ratings.length, 8);
  assert.equal(afterInitials.adjudicationCases.filter((item) => item.status === "open").length, 1);

  const correction = await harness.service.requestCorrection({ sessionToken: raterA.sessionToken, assignmentId: assignmentA.assignment.id, reason: "Object-level interpretation mistake found after the immutable initial submission." });
  const approved = await harness.service.operatorResolveCorrection({ actorSessionToken: operator.sessionToken, requestId: correction.request.id, action: "approve_rerating", notes: "Approve a linked synthetic re-rating while preserving every initial record." });
  assert.equal(approved.assignment.predecessorAssignmentId, assignmentA.assignment.id);
  const rerating = (await harness.service.getWorkspace(raterA.sessionToken)).assignments.find((item) => item.kind === "rerating");
  assert.ok(rerating);
  for (const critiqueId of critiqueIds) {
    await harness.service.saveDraft({ sessionToken: raterA.sessionToken, assignmentId: rerating.id, critiqueId, expectedVersion: 0, rating: makeRating(0.55, 0.65) });
  }
  await harness.service.submitAssignment({ sessionToken: raterA.sessionToken, assignmentId: rerating.id, idempotencyKey: `rerating:${crypto.randomUUID()}`, packetHash: rerating.packetHash });

  const adjudicatorWorkspace = await harness.service.getWorkspace(adjudicator.sessionToken);
  assert.equal(adjudicatorWorkspace.cases.length, 1);
  const caseId = adjudicatorWorkspace.cases[0].id;
  await harness.service.submitAdjudicationReview({
    sessionToken: adjudicator.sessionToken,
    caseId,
    disposition: "unresolved",
    explanation: "Both literal interpretations remain sufficiently plausible that the disagreement should be represented explicitly instead of forced into one label.",
  });
  const closed = await harness.service.closeAdjudicationCase({ actorSessionToken: operator.sessionToken, caseId, status: "unresolved", notes: "Preserve the two initials, linked re-rating, and unresolved interpretation in the final synthetic snapshot." });
  assert.equal(closed.snapshot.initialRatingIds.length, 8);
  assert.equal(closed.snapshot.reratingIds.length, 4);

  await harness.service.requestWithdrawal({ sessionToken: raterB.sessionToken, assignmentId: assignmentB.assignment.id, reason: "Synthetic withdrawal drill after accepted initial work; records must remain preserved." });
  const finalState = await harness.service.state();
  assert.equal(finalState.ratings.length, 12);
  assert.equal(finalState.labelSnapshots.length, 1);
  assert.equal(finalState.assignments.find((item) => item.id === assignmentB.assignment.id).status, "withdrawn");

  const publicExport = await harness.service.operatorExport({ actorSessionToken: operator.sessionToken, publicOnly: true });
  const privateExport = await harness.service.operatorExport({ actorSessionToken: operator.sessionToken, publicOnly: false });
  assert.equal(JSON.stringify(publicExport).includes("a@example.invalid"), false);
  assert.ok(privateExport.events.length > 20);
});

async function makeHarness() {
  const directory = await mkdtemp(join(tmpdir(), "metaphilosophy-service-test-"));
  const store = new FileEventStore({ filePath: join(directory, "events.jsonl") });
  let current = new Date("2026-08-05T00:00:00.000Z");
  const service = new StagingWorkflowService({ store, now: () => new Date(current) });
  await service.initialize();
  return {
    store,
    service,
    advanceHours(hours) { current = new Date(current.getTime() + hours * 60 * 60 * 1000); },
  };
}

async function bootstrapOperator(harness) {
  const bootstrap = await harness.service.bootstrap({ bootstrapToken: "test-bootstrap-token", expectedBootstrapToken: "test-bootstrap-token" });
  return harness.service.redeemInvite({ token: bootstrap.inviteToken });
}

async function redeemIdentity(harness, operatorToken, identityId) {
  const invite = await harness.service.createInvite({ actorSessionToken: operatorToken, identityId, expiresInHours: 24 });
  return harness.service.redeemInvite({ token: invite.token });
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
    rationale: "The critique is assessed against the stated position, with its target, centrality, object-level force, correctness, and clarity explained rather than inferred from style.",
    confidence: "high",
    timeSpentSeconds: 420,
    interpretationConfidence: overrides.interpretationConfidence ?? "high",
    backgroundAssumptions: "Read the position literally and do not import an unstated reply or broader conclusion.",
    assessability: "assessable",
    issueFlags: overrides.interpretationConfidence === "low" ? ["position_ambiguity"] : [],
    verificationStatus: "not_needed",
    requestReview: Boolean(overrides.requestReview),
  };
}
