import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

import {
  CONTRIBUTION_ARCHITECTURE,
  CONTRIBUTION_PART_SCHEMAS,
  CONTRIBUTION_TEMPLATES,
  createContributionSubmissionResources,
  createGateDecisionResource,
  createPreparedDraftFromArgumentExtraction,
  createPreparedDraftFromPart,
  createReviewSignalResource,
  promotePreparedDraftToCandidateItem,
  requiredGateIdsForPolicy,
} from "../src/domain/contributions.mjs";
import { createApiContext, createLmcaServer, demoUsers, handleApiRequest, signSessionToken } from "../src/server.mjs";

test("contribution registries define separated artifact, review, and visibility planes without source-suggestion rights fields", () => {
  assert.deepEqual(CONTRIBUTION_ARCHITECTURE.artifactPipeline, [
    "ContributionSubmission",
    "ContributionPart",
    "PreparedDraft",
    "CandidateItem",
    "live corpus item",
  ]);
  assert.deepEqual(CONTRIBUTION_ARCHITECTURE.optionalGroupingPipeline, ["CandidateItem", "CandidateBatchMembership", "CandidateBatch"]);
  assert.ok(CONTRIBUTION_ARCHITECTURE.reviewControlPlane.includes("ReviewSignal"));
  assert.ok(CONTRIBUTION_ARCHITECTURE.reviewControlPlane.includes("GateDecision"));
  assert.ok(CONTRIBUTION_ARCHITECTURE.visibilityAssignmentControlPlane.includes("ExposureConflict"));

  assert.deepEqual(Object.keys(CONTRIBUTION_PART_SCHEMAS).sort(), ["critique_text", "position_text", "source_suggestion"]);
  assert.equal(CONTRIBUTION_PART_SCHEMAS.source_suggestion.requiresOriginDisclosure, false);
  assert.equal(CONTRIBUTION_PART_SCHEMAS.position_text.validPreparedDraftType, "prepared_position_draft");
  assert.equal(CONTRIBUTION_PART_SCHEMAS.critique_text.validCandidateItemType, "candidate_critique");
  assert.deepEqual(Object.keys(CONTRIBUTION_TEMPLATES).sort(), [
    "critique_existing",
    "position_and_critique",
    "position_only",
    "source_suggestion",
  ]);

  const sourceSchemaText = JSON.stringify(CONTRIBUTION_PART_SCHEMAS.source_suggestion);
  assert.doesNotMatch(sourceSchemaText, /rights|copyright|short_excerpt|public_release_permission|validation_use_permission/i);
});

test("raw contribution submission creates only untrusted contribution artifacts and internal signals", () => {
  const result = createContributionSubmissionResources(
    {
      templateKey: "position_only",
      parts: [
        {
          type: "position_text",
          fields: {
            submitted_text: "Approval voting is better because voters can support every acceptable candidate without ranking.",
          },
          originDisclosure: { origin_choice: "self_written" },
        },
      ],
    },
    { id: "volunteer-1", role: "graduate" },
    { idFactory: sequentialIds(), now: "2026-06-26T12:00:00.000Z" },
  );

  assert.equal(result.ok, true);
  assert.equal(result.resources.contributionSubmission[0].trustStatus, "untrusted_user_submission");
  assert.equal(result.resources.contributionSubmission[0].submitterExposureRecordCreated, true);
  assert.equal(result.resources.contributionPart[0].partReviewStatus, "submitted_pending_review");
  assert.equal(Object.hasOwn(result.resources.contributionPart[0], "part_promotion_status"), false);
  assert.equal(Object.hasOwn(result.resources.contributionPart[0], "promotionStatus"), false);
  assert.equal(result.resources.originDisclosure.length, 1);
  assert.equal(result.resources.exposureConflict[0].independentBlindEligibilityEffect, "exclude_from_initial_blind_rating");
  assert.equal(result.resources.candidateItem, undefined);
  assert.equal(result.resources.candidateBatch, undefined);
});

test("source suggestions skip OriginDisclosure and rights fields are rejected", () => {
  const source = createContributionSubmissionResources(
    {
      templateKey: "source_suggestion",
      parts: [
        {
          type: "source_suggestion",
          fields: {
            source_title: "A useful paper",
            source_type_simple: "paper",
            why_relevant: "It may contain arguments about voting incentives.",
          },
        },
      ],
    },
    { id: "volunteer-1", role: "graduate" },
    { idFactory: sequentialIds(), now: "2026-06-26T12:00:00.000Z" },
  );
  assert.equal(source.ok, true);
  assert.equal(source.resources.originDisclosure.length, 0);

  const rejected = createContributionSubmissionResources(
    {
      templateKey: "source_suggestion",
      rights_attestation: "I have rights",
      parts: [
        {
          type: "source_suggestion",
          fields: {
            source_title: "A useful paper",
            source_type_simple: "paper",
            why_relevant: "It may contain arguments about voting incentives.",
          },
        },
      ],
    },
    { id: "volunteer-1", role: "graduate" },
    { idFactory: sequentialIds() },
  );
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error, "forbidden_contribution_fields");
});

test("prepared-draft promotion is blocked until raw and prepared gates pass and never creates batches or live records", () => {
  const idFactory = sequentialIds();
  const submission = createContributionSubmissionResources(
    {
      templateKey: "position_only",
      parts: [
        {
          type: "position_text",
          fields: {
            submitted_text: "A direct quote needs review before it can become blind-safe candidate text.",
          },
          originDisclosure: { origin_choice: "direct_quote" },
        },
      ],
    },
    { id: "volunteer-1", role: "graduate" },
    { idFactory, now: "2026-06-26T12:00:00.000Z" },
  );
  const part = submission.resources.contributionPart[0];
  assert.ok(submission.resources.reviewSignal.map((signal) => signal.signalType).includes("possible_blinding_risk_signal"));
  assert.ok(submission.resources.reviewSignal.map((signal) => signal.signalType).includes("likely_source_leakage"));

  const blockedDraft = createPreparedDraftFromPart(
    part,
    { id: "prepared-position-1", preparedText: "Prepared blind-safe argument text." },
    [],
    { id: "admin-1", role: "admin" },
    { idFactory },
  );
  assert.equal(blockedDraft.ok, false);
  assert.equal(blockedDraft.error, "raw_intake_gates_not_satisfied");

  const rawGateDecisions = passingGateDecisions("raw_intake_acceptance", part.id);
  const readyDraftAtCreation = createPreparedDraftFromPart(
    part,
    {
      id: "prepared-position-ready-at-creation",
      preparedText: "Prepared blind-safe argument text.",
      preparedDraftStatus: "ready_for_candidate_item_creation",
      blindingReviewStatus: "blinding_review_passed",
      sourceLeakageReviewStatus: "source_leakage_review_passed",
      gateReadinessStatus: "ready_for_candidate_item_creation",
    },
    rawGateDecisions,
    { id: "admin-1", role: "admin" },
    { idFactory },
  );
  assert.equal(readyDraftAtCreation.ok, false);
  assert.equal(readyDraftAtCreation.error, "prepared_draft_review_route_required");

  const preparedDraft = createPreparedDraftFromPart(
    part,
    { id: "prepared-position-1", preparedText: "Prepared blind-safe argument text." },
    rawGateDecisions,
    { id: "admin-1", role: "admin" },
    { idFactory, now: "2026-06-26T12:05:00.000Z" },
  );
  assert.equal(preparedDraft.ok, true);
  assert.equal(preparedDraft.resource.candidateRaterVisibleText, "Prepared blind-safe argument text.");
  assert.equal(preparedDraft.resource.blindingReviewStatus, "pending_blinding_review");
  assert.equal(preparedDraft.resource.sourceLeakageReviewStatus, "pending_source_leakage_review");
  assert.equal(preparedDraft.resource.gateReadinessStatus, "not_ready");
  assert.equal(preparedDraft.resource.createdBy, "admin-1");

  const rawPromotion = promotePreparedDraftToCandidateItem(part, {}, rawGateDecisions, { id: "admin-1", role: "admin" }, { idFactory });
  assert.equal(rawPromotion.ok, false);
  assert.equal(rawPromotion.error, "promotion_requires_prepared_draft");

  const blockedPromotion = promotePreparedDraftToCandidateItem(
    preparedDraft.resource,
    {},
    rawGateDecisions,
    { id: "admin-1", role: "admin" },
    { idFactory },
  );
  assert.equal(blockedPromotion.ok, false);
  assert.equal(blockedPromotion.error, "prepared_draft_not_ready_for_promotion");

  const reviewedPreparedDraft = {
    ...preparedDraft.resource,
    preparedDraftStatus: "ready_for_candidate_item_creation",
    blindingReviewStatus: "blinding_review_passed",
    sourceLeakageReviewStatus: "source_leakage_review_passed",
    gateReadinessStatus: "ready_for_candidate_item_creation",
    candidateItemReadiness: "ready_for_candidate_item_creation",
  };

  const blockedGatePromotion = promotePreparedDraftToCandidateItem(
    reviewedPreparedDraft,
    {},
    rawGateDecisions,
    { id: "admin-1", role: "admin" },
    { idFactory },
  );
  assert.equal(blockedGatePromotion.ok, false);
  assert.equal(blockedGatePromotion.error, "prepared_draft_gates_not_satisfied");

  const promotion = promotePreparedDraftToCandidateItem(
    reviewedPreparedDraft,
    {},
    [...rawGateDecisions, ...passingGateDecisions("prepared_draft_readiness", reviewedPreparedDraft.id)],
    { id: "admin-1", role: "admin" },
    { idFactory, now: "2026-06-26T12:10:00.000Z" },
  );
  assert.equal(promotion.ok, true);
  assert.equal(promotion.candidateItem.itemType, "candidate_position");
  assert.equal(promotion.candidateItem.downstreamPromotionStatus, "not_promoted_to_live");
  assert.equal(promotion.promotionRecord.createdCandidateBatch, false);
  assert.equal(promotion.promotionRecord.createdLiveRecord, false);
});

test("source-derived critique extractions can be accepted without being mislabeled as position intake", () => {
  const critiqueExtraction = {
    id: "argument-extraction-critique-only",
    sourceCardId: "source-card-critique-only",
    sourceSpanIds: ["source-span-critique-only"],
    extractionBatchId: "extraction-batch-critique-only",
    argumentRole: "critique_argument",
    reviewStatus: "accepted_for_critique_intake",
    possiblePreparedCritiqueText: "This objection fails because it never identifies the inferential burden the position allegedly misses.",
    critiqueTarget: "A position about explicit inferential burdens.",
  };
  const preparedCritique = createPreparedDraftFromArgumentExtraction(
    critiqueExtraction,
    {
      id: "prepared-critique-from-critique-extraction",
      draftType: "prepared_critique_draft",
      targetPositionId: "position-target",
    },
    { id: "admin-1", role: "admin" },
  );
  assert.equal(preparedCritique.ok, true);
  assert.equal(preparedCritique.resource.draftType, "prepared_critique_draft");
  assert.equal(preparedCritique.resource.sourceArgumentExtractionId, critiqueExtraction.id);
  assert.equal(preparedCritique.resource.targetPositionId, "position-target");
  assert.equal(preparedCritique.resource.candidateRaterVisibleText, critiqueExtraction.possiblePreparedCritiqueText);

  const readySourceDraftAtCreation = createPreparedDraftFromArgumentExtraction(
    critiqueExtraction,
    {
      id: "prepared-critique-ready-at-creation",
      draftType: "prepared_critique_draft",
      targetPositionId: "position-target",
      preparedDraftStatus: "ready_for_candidate_item_creation",
      blindingReviewStatus: "blinding_review_passed",
      sourceLeakageReviewStatus: "source_leakage_review_passed",
      gateReadinessStatus: "ready_for_candidate_item_creation",
    },
    { id: "admin-1", role: "admin" },
  );
  assert.equal(readySourceDraftAtCreation.ok, false);
  assert.equal(readySourceDraftAtCreation.error, "prepared_draft_review_route_required");

  const blockedPendingExtraction = createPreparedDraftFromArgumentExtraction(
    { ...critiqueExtraction, id: "argument-extraction-pending", reviewStatus: "pending_admin_review" },
    {
      id: "prepared-critique-from-pending-extraction",
      draftType: "prepared_critique_draft",
      targetPositionId: "position-target",
    },
    { id: "admin-1", role: "admin" },
  );
  assert.equal(blockedPendingExtraction.ok, false);
  assert.equal(blockedPendingExtraction.error, "argument_extraction_not_accepted");
});

test("review signals are evidentiary and cannot replace prepared-draft gate decisions", () => {
  const signal = createReviewSignalResource(
    {
      id: "review-signal-evidence-only",
      signalType: "context_insufficiency",
      source: "automated_prescreen",
      confidence: 0.82,
      explanation: "The extracted argument appears to need surrounding source context before rater-visible preparation.",
      affectedObjectType: "PreparedDraft",
      affectedObjectId: "prepared-draft-evidence-only",
      relatedGateIds: ["context_sufficiency_gate"],
    },
    { id: "admin-1", role: "admin" },
  );
  assert.equal(signal.ok, true);
  assert.equal(signal.resource.visibilityClass, "admin_only");

  const raterVisibleSignal = createReviewSignalResource(
    {
      signalType: "source_leakage",
      source: "admin",
      explanation: "This should stay out of ordinary rater views.",
      affectedObjectType: "PreparedDraft",
      affectedObjectId: "prepared-draft-evidence-only",
      visibilityClass: "rater_visible_after_promotion",
    },
    { id: "admin-1", role: "admin" },
  );
  assert.equal(raterVisibleSignal.ok, false);
  assert.equal(raterVisibleSignal.error, "invalid_review_signal_visibility");

  const automatedGate = createGateDecisionResource(
    {
      gateId: "context_sufficiency_gate",
      workflowPolicyId: "prepared_draft_readiness",
      objectType: "PreparedDraft",
      objectId: "prepared-draft-evidence-only",
      gateStatus: "passed",
      decisionSource: "automated_prescreen",
      citedReviewSignalIds: [signal.resource.id],
    },
    { id: "admin-1", role: "admin" },
  );
  assert.equal(automatedGate.ok, false);
  assert.equal(automatedGate.error, "automated_prescreen_cannot_decide_gate");
});

test("contribution API persists submissions separately and hides review controls from the user dashboard", async () => {
  const auditStore = createMemoryAuditStore();
  const context = createApiContext({ sessionSecret: "unit-test-secret", auditStore });
  const raterToken = signSessionToken(demoUsers.find((user) => user.id === "demo-rater"), "unit-test-secret");
  const headers = { "content-type": "application/json", authorization: `Bearer ${raterToken}` };

  const created = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/contributions/submissions",
    headers,
    body: JSON.stringify({
      contributionSubmission: {
        templateKey: "position_only",
        parts: [
          {
            type: "position_text",
            fields: { submitted_text: "A user contribution should remain pending until preparation and promotion gates pass." },
            originDisclosure: { origin_choice: "ai_assisted", llm_assistance_description: "AI suggested wording." },
          },
        ],
      },
    }),
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.safety.createdCandidateItems, false);
  assert.equal(created.body.safety.createdLiveCorpusRecords, false);
  const workflowEvents = await auditStore.readWorkflowEvents();
  const resourceKeys = workflowEvents.map((event) => event.resourceKey);
  assert.ok(resourceKeys.includes("contributionSubmission"));
  assert.ok(resourceKeys.includes("contributionPart"));
  assert.ok(resourceKeys.includes("originDisclosure"));
  assert.ok(resourceKeys.includes("reviewSignal"));
  assert.ok(resourceKeys.includes("exposureConflict"));
  assert.equal(resourceKeys.includes("position"), false);
  assert.equal(resourceKeys.includes("candidateItem"), false);
  assert.equal(resourceKeys.includes("candidateBatch"), false);
  assert.equal(resourceKeys.includes("trainingExport"), false);

  const dashboard = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/contributions/my-submissions",
    headers: { authorization: `Bearer ${raterToken}` },
  });
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.submissions.length, 1);
  assert.doesNotMatch(dashboard.text, /reviewSignals|gateDecisions|sourceLeakageDetails|modelJudgeScores/);

  const forbidden = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/contributions/submissions",
    headers,
    body: JSON.stringify({
      contributionSubmission: {
        templateKey: "position_only",
        public_release_permission: true,
        parts: [
          {
            type: "position_text",
            fields: { submitted_text: "This should be rejected because permission fields are out of scope." },
            originDisclosure: { origin_choice: "self_written" },
          },
        ],
      },
    }),
  });
  assert.equal(forbidden.status, 400);
  assert.equal(forbidden.body.error, "forbidden_contribution_fields");
});

test("contribution API blocks prepared-draft promotion until gate decisions pass", async () => {
  const auditStore = createMemoryAuditStore();
  const context = createApiContext({ sessionSecret: "unit-test-secret", auditStore });
  const raterToken = signSessionToken(demoUsers.find((user) => user.id === "demo-rater"), "unit-test-secret");
  const adminToken = signSessionToken(demoUsers.find((user) => user.id === "demo-admin"), "unit-test-secret");
  const raterHeaders = { "content-type": "application/json", authorization: `Bearer ${raterToken}` };
  const adminHeaders = { "content-type": "application/json", authorization: `Bearer ${adminToken}` };

  await invokeApi(context, {
    method: "POST",
    url: "/api/v1/contributions/submissions",
    headers: raterHeaders,
    body: JSON.stringify({
      contributionSubmission: {
        templateKey: "position_only",
        parts: [
          {
            type: "position_text",
            fields: { submitted_text: "Reviewers can prepare this argument only after raw gates pass." },
            originDisclosure: { origin_choice: "self_written" },
          },
        ],
      },
    }),
  });
  const initialEvents = await auditStore.readWorkflowEvents();
  const submissionId = initialEvents.find((event) => event.resourceKey === "contributionSubmission").resourceId;
  const partId = initialEvents.find((event) => event.resourceKey === "contributionPart").resourceId;

  const blockedDraft = await invokeApi(context, {
    method: "POST",
    url: `/api/v1/admin/user-submissions/${submissionId}/prepared-drafts`,
    headers: adminHeaders,
    body: JSON.stringify({ preparedDraft: { id: "prepared-api-1", sourceContributionPartId: partId, preparedText: "Prepared text." } }),
  });
  assert.equal(blockedDraft.status, 400);
  assert.equal(blockedDraft.body.error, "raw_intake_gates_not_satisfied");

  for (const decision of passingGateDecisions("raw_intake_acceptance", partId)) {
    const response = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/admin/gate-decisions",
      headers: adminHeaders,
      body: JSON.stringify({ gateDecision: decision }),
    });
    assert.equal(response.status, 201);
  }

  const draft = await invokeApi(context, {
    method: "POST",
    url: `/api/v1/admin/user-submissions/${submissionId}/prepared-drafts`,
    headers: adminHeaders,
    body: JSON.stringify({ preparedDraft: { id: "prepared-api-1", sourceContributionPartId: partId, preparedText: "Prepared text." } }),
  });
  assert.equal(draft.status, 201);

  const blockedPromotion = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/admin/prepared-drafts/prepared-api-1/promote",
    headers: adminHeaders,
    body: JSON.stringify({ promotion: {} }),
  });
  assert.equal(blockedPromotion.status, 400);
  assert.equal(blockedPromotion.body.error, "prepared_draft_not_ready_for_promotion");

  const reviewedDraft = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/admin/prepared-drafts/prepared-api-1/review",
    headers: adminHeaders,
    body: JSON.stringify({
      preparedDraftReview: {
        preparedDraftStatus: "ready_for_candidate_item_creation",
        preparedText: "Prepared text.",
        candidateRaterVisibleText: "Prepared text.",
        blindingReviewStatus: "blinding_review_passed",
        sourceLeakageReviewStatus: "source_leakage_review_passed",
        gateReadinessStatus: "ready_for_candidate_item_creation",
      },
    }),
  });
  assert.equal(reviewedDraft.status, 201);

  const blockedGatePromotion = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/admin/prepared-drafts/prepared-api-1/promote",
    headers: adminHeaders,
    body: JSON.stringify({ promotion: {} }),
  });
  assert.equal(blockedGatePromotion.status, 400);
  assert.equal(blockedGatePromotion.body.error, "prepared_draft_gates_not_satisfied");

  for (const decision of passingGateDecisions("prepared_draft_readiness", "prepared-api-1")) {
    const response = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/admin/gate-decisions",
      headers: adminHeaders,
      body: JSON.stringify({ gateDecision: decision }),
    });
    assert.equal(response.status, 201);
  }

  const promotion = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/admin/prepared-drafts/prepared-api-1/promote",
    headers: adminHeaders,
    body: JSON.stringify({ promotion: {} }),
  });
  assert.equal(promotion.status, 201);
  assert.equal(promotion.body.candidateItem.itemType, "candidate_position");
  assert.equal(promotion.body.safety.createdCandidateBatch, false);
  assert.equal(promotion.body.safety.createdLivePosition, false);
});

test("legacy contribution new routes redirect to the unified page", async () => {
  const server = createLmcaServer({ sessionSecret: "unit-test-secret", auditStore: createMemoryAuditStore() });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/contribute/positions/new`, { redirect: "manual" });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), "/contribute/new?type=position");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

function passingGateDecisions(policyId, objectId) {
  return requiredGateIdsForPolicy(policyId).map((gateId) => ({
    id: `gate-${policyId}-${objectId}-${gateId}`,
    gateId,
    workflowPolicyId: policyId,
    objectId,
    gateStatus: "passed",
    decisionSource: "authorized_admin",
    decisionNote: "Unit test gate pass.",
    reviewerId: "demo-admin",
    timestamp: "2026-06-26T12:00:00.000Z",
  }));
}

function sequentialIds() {
  let index = 0;
  return (prefix) => `${prefix}-${(index += 1)}`;
}

function createMemoryAuditStore() {
  const ratingEvents = [];
  const certificationEvents = [];
  const benchmarkEvents = [];
  const sourceStyleEvents = [];
  const workflowEvents = [];
  return {
    storageMode: "memory_test_append_only",
    readRatingEvents: async () => ratingEvents,
    appendRatingEvent: async (event) => {
      ratingEvents.push(event);
    },
    readCertificationEvents: async () => certificationEvents,
    appendCertificationEvent: async (event) => {
      certificationEvents.push(event);
    },
    readBenchmarkExposureEvents: async () => benchmarkEvents,
    appendBenchmarkExposureEvent: async (event) => {
      benchmarkEvents.push(event);
    },
    readSourceStyleAuditEvents: async () => sourceStyleEvents,
    appendSourceStyleAuditEvent: async (event) => {
      sourceStyleEvents.push(event);
    },
    readWorkflowEvents: async () => workflowEvents,
    appendWorkflowEvent: async (event) => {
      workflowEvents.push(event);
    },
  };
}

function requestFixture({ method = "GET", url = "/", headers = {}, body = "" } = {}) {
  const request = new Readable({
    read() {
      this.push(body);
      this.push(null);
    },
  });
  request.method = method;
  request.url = url;
  request.headers = { host: "127.0.0.1", ...headers };
  request.socket = { remoteAddress: "127.0.0.1" };
  return request;
}

async function invokeApi(context, { method, url, headers = {}, body = "" }) {
  const request = requestFixture({ method, url, headers, body });
  const response = responseFixture();
  await handleApiRequest(request, response, new URL(url, "http://127.0.0.1"), context);
  return response.result();
}

function responseFixture() {
  const chunks = [];
  let status = 200;
  let headers = {};
  let resolveEnd;
  const ended = new Promise((resolve) => {
    resolveEnd = resolve;
  });
  return {
    writeHead(statusCode, responseHeaders = {}) {
      status = statusCode;
      headers = responseHeaders;
    },
    end(chunk) {
      if (chunk) chunks.push(Buffer.from(chunk));
      resolveEnd();
    },
    async result() {
      await ended;
      const text = Buffer.concat(chunks).toString("utf8");
      return {
        status,
        headers,
        text,
        body: text ? JSON.parse(text) : null,
      };
    },
  };
}
