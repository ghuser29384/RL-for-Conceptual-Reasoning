import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import {
  RUBRIC,
  SCORE_DIMENSIONS,
  substantiveImpact,
  validateRatingPayload,
} from "./staging-rubric.mjs";

const SESSION_TTL_HOURS = 12;
const INVITE_TTL_HOURS = 72;
const VALID_ROLES = new Set(["operator", "rater", "adjudicator"]);
const TERMINAL_ASSIGNMENT_STATES = new Set(["submitted", "withdrawn"]);

export class StagingWorkflowService {
  constructor({ store, now = () => new Date(), sessionTtlHours = SESSION_TTL_HOURS, inviteTtlHours = INVITE_TTL_HOURS }) {
    if (!store) throw new Error("A staging event store is required.");
    this.store = store;
    this.now = now;
    this.sessionTtlHours = sessionTtlHours;
    this.inviteTtlHours = inviteTtlHours;
  }

  async initialize() {
    await this.store.initialize();
    return this.store.verifyChain();
  }

  async state() {
    return reduceStagingEvents(await this.store.loadEvents());
  }

  async bootstrap({ bootstrapToken, expectedBootstrapToken, operatorEmail = "operator@example.invalid", fixture = defaultRehearsalFixture(), allowExistingOperator = false }) {
    assertSecret(bootstrapToken, expectedBootstrapToken, "bootstrap token");
    const state = await this.state();
    if (!allowExistingOperator && state.identities.some((identity) => identity.role === "operator" && identity.status === "active")) {
      throw serviceError(409, "bootstrap_already_completed", "An active operator already exists.");
    }

    const operatorId = randomUUID();
    const positionId = fixture.position.id;
    const now = this.now().toISOString();
    const events = [
      event("identity.created", operatorId, null, {
        id: operatorId,
        role: "operator",
        displayName: "Synthetic rehearsal operator",
        email: normalizeEmail(operatorEmail),
        status: "active",
      }, now),
      event("position.created", positionId, operatorId, {
        ...fixture.position,
        status: "synthetic_rehearsal_only",
      }, now),
      ...fixture.critiques.map((critique, index) => event("critique.created", critique.id, operatorId, {
        ...critique,
        positionId,
        ordinal: index + 1,
        status: "synthetic_rehearsal_only",
      }, now)),
    ];
    await this.store.appendMany(events);
    const invite = await this.createInviteInternal({ identityId: operatorId, actorId: operatorId, expiresInHours: 2 });
    await this.audit(operatorId, "bootstrap.completed", { operatorId, positionId, fixtureCritiques: fixture.critiques.length });
    return { operatorId, positionId, inviteToken: invite.token, inviteId: invite.invite.id };
  }

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

  async createInvite({ actorSessionToken, identityId, expiresInHours = this.inviteTtlHours }) {
    const actor = await this.requireRole(actorSessionToken, "operator");
    const state = await this.state();
    const identity = activeIdentity(state, identityId);
    const result = await this.createInviteInternal({ identityId: identity.id, actorId: actor.identity.id, expiresInHours });
    await this.audit(actor.identity.id, "invite.created", { inviteId: result.invite.id, identityId: identity.id, expiresAt: result.invite.expiresAt });
    return { invite: publicInvite(result.invite), token: result.token };
  }

  async revokeInvite({ actorSessionToken, inviteId, reason = "operator_revocation" }) {
    const actor = await this.requireRole(actorSessionToken, "operator");
    const state = await this.state();
    const invite = state.invites.find((candidate) => candidate.id === inviteId);
    if (!invite) throw serviceError(404, "invite_not_found", "Invite not found.");
    if (invite.revokedAt) return { invite: publicInvite(invite), changed: false };
    const revokedAt = this.now().toISOString();
    await this.store.append(event("invite.revoked", invite.id, actor.identity.id, { inviteId, reason: String(reason).slice(0, 500), revokedAt }, revokedAt));
    await this.audit(actor.identity.id, "invite.revoked", { inviteId, reason });
    return { invite: publicInvite({ ...invite, revokedAt }), changed: true };
  }

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

  async redeemInvite({ token, userAgent = null }) {
    const tokenHash = sha256Token(token);
    const state = await this.state();
    const invite = state.invites.find((candidate) => candidate.tokenHash === tokenHash);
    if (!invite) throw serviceError(401, "invalid_invite", "The invitation is invalid.");
    const now = this.now();
    if (invite.revokedAt) throw serviceError(401, "revoked_invite", "The invitation has been revoked.");
    if (invite.usedAt) throw serviceError(409, "used_invite", "The invitation has already been used. Ask the operator for a replacement.");
    if (new Date(invite.expiresAt) <= now) throw serviceError(401, "expired_invite", "The invitation has expired.");
    const identity = activeIdentity(state, invite.identityId);
    const sessionToken = makeToken();
    const session = {
      id: randomUUID(),
      identityId: identity.id,
      tokenHash: sha256Token(sessionToken),
      createdAt: now.toISOString(),
      expiresAt: addHours(now, this.sessionTtlHours).toISOString(),
      revokedAt: null,
      userAgentHash: userAgent ? createHash("sha256").update(String(userAgent)).digest("hex") : null,
    };
    await this.store.appendMany([
      event("invite.redeemed", invite.id, identity.id, { inviteId: invite.id, usedAt: now.toISOString(), sessionId: session.id }, now.toISOString()),
      event("session.created", session.id, identity.id, session, now.toISOString()),
      event("audit.recorded", randomUUID(), identity.id, { action: "invite.redeemed", subjectId: invite.id }, now.toISOString()),
    ]);
    return { sessionToken, session: publicSession(session), identity: publicIdentity(identity) };
  }

  async logout(sessionToken) {
    const authenticated = await this.authenticate(sessionToken, { allowExpired: true, allowRevoked: true });
    if (!authenticated) return { changed: false };
    if (authenticated.session.revokedAt) return { changed: false };
    const revokedAt = this.now().toISOString();
    await this.store.append(event("session.revoked", authenticated.session.id, authenticated.identity.id, {
      sessionId: authenticated.session.id,
      revokedAt,
      reason: "logout",
    }, revokedAt));
    return { changed: true };
  }

  async me(sessionToken) {
    const authenticated = await this.requireSession(sessionToken);
    return { identity: publicIdentity(authenticated.identity), session: publicSession(authenticated.session) };
  }

  async createAssignment({ actorSessionToken, identityId, positionId, kind = "initial" }) {
    const actor = await this.requireRole(actorSessionToken, "operator");
    const state = await this.state();
    const identity = activeIdentity(state, identityId);
    if (kind === "initial" && identity.role !== "rater") throw serviceError(400, "wrong_role", "Initial assignments require a rater identity.");
    if (kind === "adjudication" && identity.role !== "adjudicator") throw serviceError(400, "wrong_role", "Adjudication assignments require an adjudicator identity.");
    const position = state.positions.find((candidate) => candidate.id === positionId);
    if (!position) throw serviceError(404, "position_not_found", "Position not found.");
    const critiques = state.critiques.filter((critique) => critique.positionId === positionId).sort((a, b) => a.ordinal - b.ordinal);
    if (kind === "initial" && critiques.length !== 4) throw serviceError(409, "invalid_sibling_count", "Initial pilot assignments require exactly four sibling critiques.");
    const duplicate = state.assignments.find((assignment) => assignment.identityId === identityId && assignment.positionId === positionId && assignment.kind === kind && assignment.status !== "withdrawn");
    if (duplicate) return { assignment: publicAssignment(duplicate), created: false };
    const assignment = {
      id: randomUUID(),
      identityId,
      positionId,
      kind,
      status: "assigned",
      packetHash: packetHash(position, critiques),
      createdAt: this.now().toISOString(),
      submittedAt: null,
    };
    await this.store.append(event("assignment.created", assignment.id, actor.identity.id, assignment, assignment.createdAt));
    await this.audit(actor.identity.id, "assignment.created", { assignmentId: assignment.id, identityId, positionId, kind });
    return { assignment: publicAssignment(assignment), created: true };
  }

  async getWorkspace(sessionToken) {
    const authenticated = await this.requireSession(sessionToken);
    const state = await this.state();
    const identity = authenticated.identity;
    if (identity.role === "rater") return this.raterWorkspace(state, identity);
    if (identity.role === "adjudicator") return this.adjudicatorWorkspace(state, identity);
    if (identity.role === "operator") return this.operatorWorkspace(state, identity);
    throw serviceError(403, "unsupported_role", "This role has no staging workspace.");
  }

  async saveDraft({ sessionToken, assignmentId, critiqueId, expectedVersion, rating }) {
    const authenticated = await this.requireRole(sessionToken, "rater");
    const state = await this.state();
    const assignment = ownedAssignment(state, assignmentId, authenticated.identity.id);
    if (assignment.kind !== "initial" && assignment.kind !== "rerating") throw serviceError(403, "wrong_assignment_kind", "This assignment does not accept ratings.");
    if (TERMINAL_ASSIGNMENT_STATES.has(assignment.status)) throw serviceError(409, "assignment_locked", "The assignment is locked.");
    const critique = state.critiques.find((candidate) => candidate.id === critiqueId && candidate.positionId === assignment.positionId);
    if (!critique) throw serviceError(404, "critique_not_found", "Critique is not part of this assignment.");
    const current = state.drafts.find((draft) => draft.assignmentId === assignmentId && draft.critiqueId === critiqueId);
    const currentVersion = current?.version ?? 0;
    if (Number(expectedVersion) !== currentVersion) {
      throw serviceError(409, "draft_version_conflict", "The draft changed elsewhere. Reload before saving.", { currentVersion, currentDraft: current?.rating ?? null });
    }
    const validation = validateRatingPayload(rating, { requireComplete: false });
    const next = {
      assignmentId,
      critiqueId,
      identityId: authenticated.identity.id,
      version: currentVersion + 1,
      rating: normalizeRating(rating),
      validationErrors: validation.errors,
      updatedAt: this.now().toISOString(),
    };
    await this.store.append(event("draft.saved", `${assignmentId}:${critiqueId}`, authenticated.identity.id, next, next.updatedAt));
    return { draft: next, complete: validateRatingPayload(next.rating).ok };
  }

  async submitAssignment({ sessionToken, assignmentId, idempotencyKey, packetHash: submittedPacketHash }) {
    const authenticated = await this.requireRole(sessionToken, "rater");
    if (!validIdempotencyKey(idempotencyKey)) throw serviceError(400, "invalid_idempotency_key", "Provide a valid idempotency key.");
    const state = await this.state();
    const assignment = ownedAssignment(state, assignmentId, authenticated.identity.id);
    if (assignment.packetHash !== submittedPacketHash) throw serviceError(409, "packet_hash_mismatch", "The assignment packet has changed or was tampered with.");
    const prior = state.submissionReceipts.find((receipt) => receipt.identityId === authenticated.identity.id && receipt.idempotencyKey === idempotencyKey);
    if (prior) {
      if (prior.assignmentId !== assignmentId || prior.packetHash !== submittedPacketHash) {
        throw serviceError(409, "idempotency_conflict", "The idempotency key was already used for different content.");
      }
      return { receipt: prior, replay: true };
    }
    if (assignment.status === "submitted") throw serviceError(409, "already_submitted", "This assignment has already been submitted.");
    if (assignment.status === "withdrawn") throw serviceError(409, "assignment_withdrawn", "This assignment was withdrawn.");

    const critiques = state.critiques.filter((critique) => critique.positionId === assignment.positionId).sort((a, b) => a.ordinal - b.ordinal);
    const drafts = critiques.map((critique) => state.drafts.find((draft) => draft.assignmentId === assignmentId && draft.critiqueId === critique.id));
    const errors = {};
    drafts.forEach((draft, index) => {
      if (!draft) errors[critiques[index].id] = { missing: "No draft exists." };
      else {
        const validation = validateRatingPayload(draft.rating);
        if (!validation.ok) errors[critiques[index].id] = validation.errors;
      }
    });
    if (Object.keys(errors).length) throw serviceError(422, "incomplete_assignment", "All four critiques must pass validation before submission.", { errors });

    const submittedAt = this.now().toISOString();
    const ratingEvents = drafts.map((draft) => ({
      id: randomUUID(),
      assignmentId,
      critiqueId: draft.critiqueId,
      identityId: authenticated.identity.id,
      eventType: assignment.kind === "rerating" ? "rerating" : "initial",
      predecessorRatingId: assignment.predecessorRatingId ?? null,
      packetHash: assignment.packetHash,
      rating: draft.rating,
      substantiveImpact: substantiveImpact(draft.rating.scores),
      submittedAt,
    }));
    const payloadHash = createHash("sha256").update(JSON.stringify(ratingEvents.map((record) => ({
      critiqueId: record.critiqueId,
      rating: record.rating,
      packetHash: record.packetHash,
    })))).digest("hex");
    const receipt = {
      id: randomUUID(),
      assignmentId,
      identityId: authenticated.identity.id,
      idempotencyKey,
      packetHash: submittedPacketHash,
      payloadHash,
      ratingIds: ratingEvents.map((record) => record.id),
      submittedAt,
    };
    await this.store.appendMany([
      ...ratingEvents.map((record) => event("rating.submitted", record.id, authenticated.identity.id, record, submittedAt)),
      event("assignment.submitted", assignment.id, authenticated.identity.id, { assignmentId, submittedAt, receiptId: receipt.id }, submittedAt),
      event("submission.receipt.created", receipt.id, authenticated.identity.id, receipt, submittedAt),
      event("audit.recorded", randomUUID(), authenticated.identity.id, { action: "assignment.submitted", subjectId: assignmentId, payloadHash }, submittedAt),
    ]);
    await this.openTriggeredAdjudicationCases(assignment.positionId, authenticated.identity.id);
    return { receipt, replay: false };
  }

  async requestCorrection({ sessionToken, assignmentId, reason }) {
    const authenticated = await this.requireRole(sessionToken, "rater");
    const state = await this.state();
    const assignment = ownedAssignment(state, assignmentId, authenticated.identity.id);
    if (assignment.status !== "submitted") throw serviceError(409, "not_submitted", "A correction can be requested only after submission.");
    const request = {
      id: randomUUID(),
      assignmentId,
      identityId: authenticated.identity.id,
      reason: requireText(reason, 20, 4000, "Correction reason"),
      status: "open",
      createdAt: this.now().toISOString(),
    };
    await this.store.append(event("correction.requested", request.id, authenticated.identity.id, request, request.createdAt));
    await this.audit(authenticated.identity.id, "correction.requested", { requestId: request.id, assignmentId });
    return { request };
  }

  async requestWithdrawal({ sessionToken, assignmentId, reason }) {
    const authenticated = await this.requireRole(sessionToken, "rater");
    const state = await this.state();
    const assignment = ownedAssignment(state, assignmentId, authenticated.identity.id);
    const request = {
      id: randomUUID(),
      assignmentId,
      identityId: authenticated.identity.id,
      reason: requireText(reason, 10, 4000, "Withdrawal reason"),
      status: "open",
      createdAt: this.now().toISOString(),
    };
    await this.store.appendMany([
      event("withdrawal.requested", request.id, authenticated.identity.id, request, request.createdAt),
      event("assignment.withdrawn", assignment.id, authenticated.identity.id, { assignmentId, withdrawnAt: request.createdAt }, request.createdAt),
    ]);
    await this.audit(authenticated.identity.id, "withdrawal.requested", { requestId: request.id, assignmentId });
    return { request };
  }

  async operatorResolveCorrection({ actorSessionToken, requestId, action, notes }) {
    const actor = await this.requireRole(actorSessionToken, "operator");
    const state = await this.state();
    const request = state.correctionRequests.find((candidate) => candidate.id === requestId);
    if (!request) throw serviceError(404, "request_not_found", "Correction request not found.");
    if (!new Set(["approve_rerating", "reject"]).has(action)) throw serviceError(400, "invalid_action", "Choose approve_rerating or reject.");
    const events = [event("correction.resolved", request.id, actor.identity.id, {
      requestId,
      action,
      notes: String(notes ?? "").slice(0, 4000),
      resolvedAt: this.now().toISOString(),
    }, this.now().toISOString())];
    let assignment = null;
    if (action === "approve_rerating") {
      const original = state.assignments.find((candidate) => candidate.id === request.assignmentId);
      assignment = {
        id: randomUUID(),
        identityId: request.identityId,
        positionId: original.positionId,
        kind: "rerating",
        status: "assigned",
        packetHash: original.packetHash,
        predecessorAssignmentId: original.id,
        predecessorRatingIds: state.ratings.filter((rating) => rating.assignmentId === original.id).map((rating) => rating.id),
        createdAt: this.now().toISOString(),
        submittedAt: null,
      };
      events.push(event("assignment.created", assignment.id, actor.identity.id, assignment, assignment.createdAt));
    }
    await this.store.appendMany(events);
    await this.audit(actor.identity.id, "correction.resolved", { requestId, action, reratingAssignmentId: assignment?.id ?? null });
    return { requestId, action, assignment: assignment ? publicAssignment(assignment) : null };
  }

  async openAdjudicationCase({ actorSessionToken, positionId, reason, trigger = "operator_request" }) {
    const actor = await this.requireRole(actorSessionToken, "operator");
    const state = await this.state();
    if (!state.positions.some((position) => position.id === positionId)) throw serviceError(404, "position_not_found", "Position not found.");
    const open = state.adjudicationCases.find((candidate) => candidate.positionId === positionId && candidate.status === "open");
    if (open) return { adjudicationCase: publicAdjudicationCase(open), created: false };
    const adjudicationCase = {
      id: randomUUID(),
      positionId,
      trigger,
      reason: requireText(reason, 10, 4000, "Adjudication reason"),
      status: "open",
      createdAt: this.now().toISOString(),
      closedAt: null,
    };
    await this.store.append(event("adjudication.opened", adjudicationCase.id, actor.identity.id, adjudicationCase, adjudicationCase.createdAt));
    await this.audit(actor.identity.id, "adjudication.opened", { caseId: adjudicationCase.id, positionId, trigger });
    return { adjudicationCase: publicAdjudicationCase(adjudicationCase), created: true };
  }

  async submitAdjudicationReview({ sessionToken, caseId, disposition, explanation, requiresRerating = false }) {
    const authenticated = await this.requireRole(sessionToken, "adjudicator");
    const state = await this.state();
    const adjudicationCase = state.adjudicationCases.find((candidate) => candidate.id === caseId);
    if (!adjudicationCase) throw serviceError(404, "case_not_found", "Adjudication case not found.");
    if (adjudicationCase.status !== "open") throw serviceError(409, "case_closed", "Adjudication case is closed.");
    if (!new Set(["confirm_initials", "request_rerating", "unresolved", "item_defective"]).has(disposition)) {
      throw serviceError(400, "invalid_disposition", "Invalid adjudication disposition.");
    }
    const existing = state.adjudicationReviews.find((review) => review.caseId === caseId && review.identityId === authenticated.identity.id);
    if (existing) throw serviceError(409, "review_already_submitted", "This adjudicator has already submitted an independent review.");
    const review = {
      id: randomUUID(),
      caseId,
      identityId: authenticated.identity.id,
      disposition,
      explanation: requireText(explanation, 40, 12000, "Adjudication explanation"),
      requiresRerating: Boolean(requiresRerating || disposition === "request_rerating"),
      submittedAt: this.now().toISOString(),
    };
    await this.store.append(event("adjudication.reviewed", review.id, authenticated.identity.id, review, review.submittedAt));
    await this.audit(authenticated.identity.id, "adjudication.reviewed", { caseId, reviewId: review.id, disposition });
    return { review };
  }

  async closeAdjudicationCase({ actorSessionToken, caseId, status, notes }) {
    const actor = await this.requireRole(actorSessionToken, "operator");
    const state = await this.state();
    const adjudicationCase = state.adjudicationCases.find((candidate) => candidate.id === caseId);
    if (!adjudicationCase) throw serviceError(404, "case_not_found", "Adjudication case not found.");
    const reviews = state.adjudicationReviews.filter((review) => review.caseId === caseId);
    if (reviews.length < 1) throw serviceError(409, "missing_review", "At least one independent adjudicator review is required.");
    if (!new Set(["resolved", "unresolved", "item_defective"]).has(status)) throw serviceError(400, "invalid_status", "Invalid closure status.");
    const closedAt = this.now().toISOString();
    const snapshot = {
      id: randomUUID(),
      caseId,
      positionId: adjudicationCase.positionId,
      status,
      notes: requireText(notes, 10, 8000, "Closure notes"),
      initialRatingIds: state.ratings.filter((rating) => state.critiques.find((critique) => critique.id === rating.critiqueId)?.positionId === adjudicationCase.positionId && rating.eventType === "initial").map((rating) => rating.id),
      reratingIds: state.ratings.filter((rating) => state.critiques.find((critique) => critique.id === rating.critiqueId)?.positionId === adjudicationCase.positionId && rating.eventType === "rerating").map((rating) => rating.id),
      adjudicationReviewIds: reviews.map((review) => review.id),
      createdAt: closedAt,
    };
    await this.store.appendMany([
      event("adjudication.closed", caseId, actor.identity.id, { caseId, status, notes: snapshot.notes, closedAt }, closedAt),
      event("label_snapshot.created", snapshot.id, actor.identity.id, snapshot, closedAt),
      event("audit.recorded", randomUUID(), actor.identity.id, { action: "adjudication.closed", subjectId: caseId, status }, closedAt),
    ]);
    return { adjudicationCase: publicAdjudicationCase({ ...adjudicationCase, status, closedAt }), snapshot };
  }

  async operatorExport({ actorSessionToken, publicOnly = false }) {
    const actor = await this.requireRole(actorSessionToken, "operator");
    const events = await this.store.loadEvents();
    const state = reduceStagingEvents(events);
    await this.audit(actor.identity.id, "export.created", { publicOnly });
    if (publicOnly) {
      return {
        generatedAt: this.now().toISOString(),
        counts: publicCounts(state),
        positions: state.positions.map(({ id, title, status }) => ({ id, title, status })),
        ratings: state.ratings.map((rating) => ({
          id: rating.id,
          critiqueId: rating.critiqueId,
          eventType: rating.eventType,
          scores: rating.rating.scores,
          substantiveImpact: rating.substantiveImpact,
          submittedAt: rating.submittedAt,
        })),
        snapshots: state.labelSnapshots,
      };
    }
    return {
      generatedAt: this.now().toISOString(),
      chain: { events: events.length, headHash: events.at(-1)?.eventHash ?? "0".repeat(64) },
      events,
      state,
    };
  }

  async authenticate(sessionToken, { allowExpired = false, allowRevoked = false } = {}) {
    if (!sessionToken) return null;
    const hash = sha256Token(sessionToken);
    const state = await this.state();
    const session = state.sessions.find((candidate) => candidate.tokenHash === hash);
    if (!session) return null;
    if (!allowRevoked && session.revokedAt) return null;
    if (!allowExpired && new Date(session.expiresAt) <= this.now()) return null;
    const identity = state.identities.find((candidate) => candidate.id === session.identityId && candidate.status === "active");
    return identity ? { session, identity, state } : null;
  }

  async requireSession(sessionToken) {
    const result = await this.authenticate(sessionToken);
    if (!result) throw serviceError(401, "authentication_required", "A valid staging session is required.");
    return result;
  }

  async requireRole(sessionToken, role) {
    const result = await this.requireSession(sessionToken);
    if (result.identity.role !== role) throw serviceError(403, "forbidden", `The ${role} role is required.`);
    return result;
  }

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

  async audit(actorId, action, detail) {
    return this.store.append(event("audit.recorded", randomUUID(), actorId, {
      action,
      detail,
    }, this.now().toISOString()));
  }

  raterWorkspace(state, identity) {
    const assignments = state.assignments
      .filter((assignment) => assignment.identityId === identity.id && ["initial", "rerating"].includes(assignment.kind))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return {
      role: "rater",
      rubric: RUBRIC,
      assignments: assignments.map((assignment) => {
        const position = state.positions.find((candidate) => candidate.id === assignment.positionId);
        const critiques = state.critiques.filter((critique) => critique.positionId === assignment.positionId).sort((a, b) => a.ordinal - b.ordinal);
        return {
          ...publicAssignment(assignment),
          position: publicPosition(position),
          critiques: critiques.map((critique) => ({ ...publicCritique(critique), draft: state.drafts.find((draft) => draft.assignmentId === assignment.id && draft.critiqueId === critique.id) ?? null })),
          receipt: state.submissionReceipts.find((receipt) => receipt.assignmentId === assignment.id) ?? null,
          correctionRequests: state.correctionRequests.filter((request) => request.assignmentId === assignment.id),
          withdrawalRequests: state.withdrawalRequests.filter((request) => request.assignmentId === assignment.id),
        };
      }),
    };
  }

  adjudicatorWorkspace(state, identity) {
    return {
      role: "adjudicator",
      rubric: RUBRIC,
      cases: state.adjudicationCases.map((adjudicationCase) => ({
        ...publicAdjudicationCase(adjudicationCase),
        position: publicPosition(state.positions.find((position) => position.id === adjudicationCase.positionId)),
        critiques: state.critiques.filter((critique) => critique.positionId === adjudicationCase.positionId).sort((a, b) => a.ordinal - b.ordinal).map((critique) => ({
          ...publicCritique(critique),
          ratings: state.ratings.filter((rating) => rating.critiqueId === critique.id).map(publicRating),
        })),
        ownReview: state.adjudicationReviews.find((review) => review.caseId === adjudicationCase.id && review.identityId === identity.id) ?? null,
      })),
    };
  }

  operatorWorkspace(state) {
    return {
      role: "operator",
      counts: publicCounts(state),
      identities: state.identities.map(publicIdentity),
      invites: state.invites.map(publicInvite),
      assignments: state.assignments.map(publicAssignment),
      correctionRequests: state.correctionRequests,
      withdrawalRequests: state.withdrawalRequests,
      adjudicationCases: state.adjudicationCases.map(publicAdjudicationCase),
      chain: state.chain,
    };
  }

  async openTriggeredAdjudicationCases(positionId, actorId) {
    const state = await this.state();
    const ratings = state.ratings.filter((rating) => {
      const critique = state.critiques.find((candidate) => candidate.id === rating.critiqueId);
      return critique?.positionId === positionId && rating.eventType === "initial";
    });
    const byCritique = new Map();
    for (const rating of ratings) {
      if (!byCritique.has(rating.critiqueId)) byCritique.set(rating.critiqueId, []);
      byCritique.get(rating.critiqueId).push(rating);
    }
    const reasons = [];
    for (const [critiqueId, records] of byCritique) {
      if (records.length < 2) continue;
      const [a, b] = records.slice(0, 2);
      const overallGap = Math.abs(a.rating.scores.overall - b.rating.scores.overall);
      const impactGap = Math.abs(a.substantiveImpact - b.substantiveImpact);
      const incompatibleInterpretation = a.rating.interpretationConfidence === "low" || b.rating.interpretationConfidence === "low"
        || a.rating.issueFlags.includes("position_ambiguity") || b.rating.issueFlags.includes("position_ambiguity")
        || a.rating.issueFlags.includes("critique_ambiguity") || b.rating.issueFlags.includes("critique_ambiguity");
      const assessabilityDisagreement = a.rating.assessability !== b.rating.assessability;
      const requested = Boolean(a.rating.requestReview || b.rating.requestReview);
      if (overallGap >= 0.3 || impactGap >= 0.3 || incompatibleInterpretation || assessabilityDisagreement || requested) {
        reasons.push({ critiqueId, overallGap, impactGap, incompatibleInterpretation, assessabilityDisagreement, requested });
      }
    }
    if (!reasons.length) return null;
    const existing = state.adjudicationCases.find((candidate) => candidate.positionId === positionId && candidate.status === "open");
    if (existing) return existing;
    const openedAt = this.now().toISOString();
    const adjudicationCase = {
      id: randomUUID(),
      positionId,
      trigger: "pre_registered_disagreement_policy",
      reason: "One or more pre-registered numerical or interpretation/assessability triggers fired.",
      triggerDetail: reasons,
      status: "open",
      createdAt: openedAt,
      closedAt: null,
    };
    await this.store.append(event("adjudication.opened", adjudicationCase.id, actorId, adjudicationCase, openedAt));
    return adjudicationCase;
  }
}

export function reduceStagingEvents(events) {
  const state = {
    identities: [], invites: [], sessions: [], positions: [], critiques: [], assignments: [], drafts: [], ratings: [],
    submissionReceipts: [], correctionRequests: [], withdrawalRequests: [], adjudicationCases: [], adjudicationReviews: [],
    labelSnapshots: [], auditEvents: [],
    chain: { events: events.length, headHash: events.at(-1)?.eventHash ?? "0".repeat(64) },
  };
  const upsert = (collection, value, key = "id") => {
    const index = collection.findIndex((item) => item[key] === value[key]);
    if (index === -1) collection.push(structuredClone(value));
    else collection[index] = { ...collection[index], ...structuredClone(value) };
  };

  for (const eventRecord of events) {
    const payload = eventRecord.payload ?? {};
    switch (eventRecord.type) {
      case "identity.created": upsert(state.identities, payload); break;
      case "identity.deactivated": upsert(state.identities, { id: payload.identityId, status: "inactive", deactivatedAt: payload.deactivatedAt }); break;
      case "invite.created": upsert(state.invites, payload); break;
      case "invite.redeemed": upsert(state.invites, { id: payload.inviteId, usedAt: payload.usedAt, sessionId: payload.sessionId }); break;
      case "invite.revoked": upsert(state.invites, { id: payload.inviteId, revokedAt: payload.revokedAt, revocationReason: payload.reason }); break;
      case "invite.replaced": upsert(state.invites, { id: payload.inviteId, replacementInviteId: payload.replacementInviteId }); break;
      case "session.created": upsert(state.sessions, payload); break;
      case "session.revoked": upsert(state.sessions, { id: payload.sessionId, revokedAt: payload.revokedAt, revocationReason: payload.reason }); break;
      case "position.created": upsert(state.positions, payload); break;
      case "critique.created": upsert(state.critiques, payload); break;
      case "assignment.created": upsert(state.assignments, payload); break;
      case "assignment.submitted": upsert(state.assignments, { id: payload.assignmentId, status: "submitted", submittedAt: payload.submittedAt, receiptId: payload.receiptId }); break;
      case "assignment.withdrawn": upsert(state.assignments, { id: payload.assignmentId, status: "withdrawn", withdrawnAt: payload.withdrawnAt }); break;
      case "draft.saved": upsert(state.drafts, payload, "assignmentCritiqueKey"); break;
      case "rating.submitted": upsert(state.ratings, payload); break;
      case "submission.receipt.created": upsert(state.submissionReceipts, payload); break;
      case "correction.requested": upsert(state.correctionRequests, payload); break;
      case "correction.resolved": upsert(state.correctionRequests, { id: payload.requestId, status: payload.action === "reject" ? "rejected" : "approved", resolution: payload }); break;
      case "withdrawal.requested": upsert(state.withdrawalRequests, payload); break;
      case "adjudication.opened": upsert(state.adjudicationCases, payload); break;
      case "adjudication.reviewed": upsert(state.adjudicationReviews, payload); break;
      case "adjudication.closed": upsert(state.adjudicationCases, { id: payload.caseId, status: payload.status, closedAt: payload.closedAt, closureNotes: payload.notes }); break;
      case "label_snapshot.created": upsert(state.labelSnapshots, payload); break;
      case "audit.recorded": state.auditEvents.push({ id: eventRecord.eventId, actorId: eventRecord.actorId, createdAt: eventRecord.createdAt, ...payload }); break;
      default: break;
    }
  }
  for (const draft of state.drafts) {
    draft.assignmentCritiqueKey ??= `${draft.assignmentId}:${draft.critiqueId}`;
  }
  return state;
}

function event(type, aggregateId, actorId, payload, createdAt) {
  const normalizedPayload = structuredClone(payload);
  if (type === "draft.saved") normalizedPayload.assignmentCritiqueKey = `${payload.assignmentId}:${payload.critiqueId}`;
  return { type, aggregateId, actorId, payload: normalizedPayload, createdAt };
}

function defaultRehearsalFixture() {
  return {
    position: {
      id: "synthetic-rehearsal-position-001",
      version: "1",
      title: "Synthetic rehearsal: argument evaluation without decisive ground truth",
      text: "A community can improve judgment on conceptual questions by comparing contextualized objections even when it lacks a decisive answer to the underlying question. The comparative evaluation of relevance, correctness, and argumentative force can therefore provide useful supervision for systems that reason about philosophy.",
      context: "This record exists only to exercise the staging workflow. It must never enter Pilot 01 research results.",
    },
    critiques: [
      { id: "synthetic-rehearsal-critique-001", version: "1", text: "Agreement about local argumentative qualities could reflect a shared but systematically biased standard, so convergence alone does not establish epistemic progress." },
      { id: "synthetic-rehearsal-critique-002", version: "1", text: "The position does not specify how omitted background commitments are represented; an objection can appear decisive only because the relevant context has been withheld." },
      { id: "synthetic-rehearsal-critique-003", version: "1", text: "Even if critique evaluation is easier than settling conclusions, the ratings may still be too noisy to provide useful supervision. Comparative ease is not adequacy." },
      { id: "synthetic-rehearsal-critique-004", version: "1", text: "Famous objections may survive because of canon formation rather than merit, so training on expert consensus can reproduce historical selection effects." },
    ],
  };
}

function normalizeRating(rating = {}) {
  return {
    scores: Object.fromEntries(SCORE_DIMENSIONS.map((dimension) => [dimension, roundScore(rating?.scores?.[dimension])])),
    rationale: String(rating.rationale ?? "").trim().slice(0, 12000),
    confidence: rating.confidence,
    timeSpentSeconds: Number(rating.timeSpentSeconds ?? 0),
    interpretationConfidence: rating.interpretationConfidence,
    backgroundAssumptions: String(rating.backgroundAssumptions ?? "").trim().slice(0, 4000),
    assessability: rating.assessability,
    issueFlags: [...new Set(Array.isArray(rating.issueFlags) ? rating.issueFlags : [])].sort(),
    verificationStatus: rating.verificationStatus,
    requestReview: Boolean(rating.requestReview),
  };
}

function roundScore(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(4)) : null;
}

function makeToken() {
  return randomBytes(32).toString("base64url");
}

function sha256Token(token) {
  if (!token || typeof token !== "string") return "";
  return createHash("sha256").update(token).digest("hex");
}

function assertSecret(actual, expected, label) {
  if (!actual || !expected) throw serviceError(503, "bootstrap_disabled", `The ${label} is not configured.`);
  const a = Buffer.from(createHash("sha256").update(String(actual)).digest());
  const b = Buffer.from(createHash("sha256").update(String(expected)).digest());
  if (!timingSafeEqual(a, b)) throw serviceError(401, "invalid_bootstrap_token", `Invalid ${label}.`);
}

function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email.slice(0, 254) : "";
}

function addHours(date, hours) {
  return new Date(date.getTime() + Number(hours) * 60 * 60 * 1000);
}

function clampHours(value, minimum, maximum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : minimum;
}

function activeIdentity(state, identityId) {
  const identity = state.identities.find((candidate) => candidate.id === identityId && candidate.status === "active");
  if (!identity) throw serviceError(404, "identity_not_found", "Active identity not found.");
  return identity;
}

function ownedAssignment(state, assignmentId, identityId) {
  const assignment = state.assignments.find((candidate) => candidate.id === assignmentId);
  if (!assignment) throw serviceError(404, "assignment_not_found", "Assignment not found.");
  if (assignment.identityId !== identityId) throw serviceError(403, "assignment_forbidden", "This assignment belongs to another identity.");
  return assignment;
}

function publicIdentity(identity) {
  return identity ? { id: identity.id, role: identity.role, displayName: identity.displayName, status: identity.status } : null;
}

function publicInvite(invite) {
  return { id: invite.id, identityId: invite.identityId, createdAt: invite.createdAt, expiresAt: invite.expiresAt, usedAt: invite.usedAt, revokedAt: invite.revokedAt, replacementInviteId: invite.replacementInviteId ?? null };
}

function publicSession(session) {
  return { id: session.id, identityId: session.identityId, createdAt: session.createdAt, expiresAt: session.expiresAt, revokedAt: session.revokedAt };
}

function publicAssignment(assignment) {
  return { id: assignment.id, identityId: assignment.identityId, positionId: assignment.positionId, kind: assignment.kind, status: assignment.status, packetHash: assignment.packetHash, createdAt: assignment.createdAt, submittedAt: assignment.submittedAt ?? null, predecessorAssignmentId: assignment.predecessorAssignmentId ?? null };
}

function publicPosition(position) {
  return position ? { id: position.id, version: position.version, title: position.title, text: position.text, context: position.context, status: position.status } : null;
}

function publicCritique(critique) {
  return critique ? { id: critique.id, version: critique.version, positionId: critique.positionId, ordinal: critique.ordinal, text: critique.text, status: critique.status } : null;
}

function publicRating(rating) {
  return { id: rating.id, critiqueId: rating.critiqueId, eventType: rating.eventType, predecessorRatingId: rating.predecessorRatingId, rating: rating.rating, substantiveImpact: rating.substantiveImpact, submittedAt: rating.submittedAt };
}

function publicAdjudicationCase(adjudicationCase) {
  return { id: adjudicationCase.id, positionId: adjudicationCase.positionId, trigger: adjudicationCase.trigger, reason: adjudicationCase.reason, triggerDetail: adjudicationCase.triggerDetail ?? [], status: adjudicationCase.status, createdAt: adjudicationCase.createdAt, closedAt: adjudicationCase.closedAt ?? null };
}

function publicCounts(state) {
  return {
    identities: state.identities.length,
    activeRaters: state.identities.filter((identity) => identity.role === "rater" && identity.status === "active").length,
    assignments: state.assignments.length,
    submittedAssignments: state.assignments.filter((assignment) => assignment.status === "submitted").length,
    ratings: state.ratings.length,
    openAdjudicationCases: state.adjudicationCases.filter((adjudicationCase) => adjudicationCase.status === "open").length,
    correctionRequests: state.correctionRequests.length,
    withdrawalRequests: state.withdrawalRequests.length,
  };
}

function packetHash(position, critiques) {
  return createHash("sha256").update(JSON.stringify({
    position: publicPosition(position),
    critiques: critiques.map(publicCritique),
    rubricVersion: RUBRIC.version,
  })).digest("hex");
}

function validIdempotencyKey(value) {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{16,160}$/u.test(value);
}

function requireText(value, minimum, maximum, label) {
  const text = String(value ?? "").trim();
  if (text.length < minimum) throw serviceError(400, "invalid_text", `${label} must contain at least ${minimum} characters.`);
  return text.slice(0, maximum);
}

export function serviceError(status, code, message, detail = undefined) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.detail = detail;
  return error;
}
