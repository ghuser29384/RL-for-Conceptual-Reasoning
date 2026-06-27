import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RATER_ISSUE_FLAG_DEFINITIONS,
  RUBRIC_DIMENSIONS,
  assignments,
  buildHiddenBenchmarkFreezeReport,
  buildRaterCertificationReport,
  buildReleaseRightsRecords,
  buildTrainingExport,
  buildOctoberReleaseReport,
  certificationPacks,
  createBlindRatingView,
  createExportManifest,
  createLabelSnapshot,
  critiques,
  fullRubricEvaluationRun,
  isValidScore,
  overallOnlyEvaluationRun,
  positions,
  postLockSourceStyleAudits,
  promptArtifacts,
  ratingContextSnapshots,
  scoreCertificationAttempt,
  seedBenchmarkExposureEvents,
  seedCertificationAttempts,
  seedRatings,
} from "./domain/core.mjs";
import { createExternalJwtAuthConfig, verifyExternalJwtToken } from "./auth/external-jwt.mjs";
import { createLocalAuditStore } from "./storage/local-audit-store.mjs";

const releaseId = "october-2026-demo";
export const demoUsers = [
  { id: "demo-rater", displayName: "Demo Graduate Rater", role: "graduate", allowedAssignmentIds: ["assign-ai-base-rate", "assign-voting-bullet"] },
  { id: "demo-expert", displayName: "Demo Expert Adjudicator", role: "expert", allowedAssignmentIds: ["assign-ai-base-rate", "assign-voting-bullet", "assign-mind-zombie"] },
  { id: "demo-admin", displayName: "Demo Release Admin", role: "admin", allowedAssignmentIds: ["*"] },
];

const hiddenMetadataKeys = new Set([
  "sourceCategory",
  "sourceType",
  "authorshipType",
  "styleBand",
  "adminTags",
  "split",
  "sourceModel",
  "generatorPromptVersion",
  "modelJudgeScore",
  "peerRatings",
  "candidateSelectionReason",
  "benchmarkStatus",
]);

const sourceStyleAuditSourceGuesses = new Set(["human_written", "expert_written", "llm_generated", "adapted_or_external", "unknown"]);
const sourceStyleAuditAuthorshipGuesses = new Set(["expert", "volunteer", "model", "adapted_source", "unknown"]);
const ratingVerificationStatuses = new Set(["not_needed", "verified", "not_practicable", "unresolved"]);
const ratingEvidenceReferenceFields = [
  ["rationaleEvidenceSpanIds", "rationale_evidence_span_ids"],
  ["attackedClaimSpanRefs", "attacked_claim_span_refs"],
  ["critiqueSupportSpanRefs", "critique_support_span_refs"],
  ["wrongClaimSpanRefs", "wrong_claim_span_refs"],
  ["deadWeightSpanRefs", "dead_weight_span_refs"],
  ["sideIssueSpanRefs", "side_issue_span_refs"],
  ["unclearTextSpanRefs", "unclear_text_span_refs"],
];
const ratingScoreEntryExplicitnessStatuses = new Set(["all_required_scores_explicit", "low_clarity_branch_explicit", "revision_scores_explicit"]);
const ratingMissingFieldValidationStatuses = new Set(["passed_no_missing_required_fields", "low_clarity_provisional_fields_allowed"]);
const lockedInitialSourceTagVisibilityStates = new Set(["hidden", "hidden_from_initial_rater", "source_tag_protected_visibility_preserved"]);
const allowedRatingFlagKeys = new Set(RATER_ISSUE_FLAG_DEFINITIONS.map((definition) => definition.key));
const adminRoles = ["admin"];
const adminAuditRoles = ["admin", "auditor"];
const expertWorkflowRoles = ["expert", "admin"];
const expertAuditWorkflowRoles = ["expert", "admin", "auditor"];
const ratingWorkflowRoles = ["rater", "graduate", "phd", "expert", "admin"];
const workflowStateReadRoles = ["rater", "graduate", "phd", "expert", "admin", "auditor"];
const workflowStateTransitionRoles = ["rater", "graduate", "phd", "expert", "admin"];
const participantDataWriteRoles = ["rater", "graduate", "phd", "expert", "admin"];
const participantDataReadRoles = ["rater", "graduate", "phd", "expert", "admin", "auditor"];
const raterSessionRequiredFields = [
  "id",
  "raterId",
  "sessionTarget",
  "startedAt",
  "endedAt",
  "activeTimeSeconds",
  "completedAssignmentCount",
  "expectedEffortCompleted",
  "breakPromptCount",
  "breakTakenCount",
  "stopAfterCurrentItemState",
  "fatigueWarningState",
  "interruptionSummary",
  "qaRoutingStatus",
  "timestamp",
];
const assignmentDeclineRequiredFields = [
  "id",
  "assignmentId",
  "raterId",
  "itemKeys",
  "reasonCode",
  "freeTextNote",
  "priorExposureConflictFlag",
  "topicFitUpdateSuggestion",
  "reassignmentStatus",
  "qaRoutingStatus",
  "sourcePeerModelGoldProtectedLabelVisibilityState",
  "excludedFromRatingDenominator",
  "timestamp",
];
const itemIssueReportRequiredFields = [
  "id",
  "reporterId",
  "reporterRole",
  "issueCategory",
  "severity",
  "blindSafeReporterNote",
  "reporterExposureState",
  "labelVisibilityStateForTriage",
  "modelResultVisibilityStateForTriage",
  "triageState",
  "quarantineStalePropagationState",
  "excludedFromLabelDenominator",
  "createdAt",
];
const ratingDraftSessionRequiredFields = [
  "id",
  "assignmentId",
  "autosaveRevisionId",
  "dependencyVersionSnapshot",
  "staleDependencyStatus",
  "staleSubmissionBlocked",
  "fieldCompletionState",
  "lastSavedAt",
  "resumeCount",
  "recoveredAfterInterruption",
  "abandonedVsSubmittedStatus",
  "draftNotExportedAsLabel",
  "timestamp",
];
const ratingDraftSessionDependencyFields = [
  "dependencyVersionSnapshot.itemTextVersionId",
  "dependencyVersionSnapshot.rubricVersion",
  "dependencyVersionSnapshot.instructionRenderVersionId",
  "dependencyVersionSnapshot.workflowProfileId",
  "dependencyVersionSnapshot.assistPolicyId",
  "dependencyVersionSnapshot.rubricLintConfigId",
  "dependencyVersionSnapshot.scoreInputPolicyId",
  "dependencyVersionSnapshot.ratingContextSnapshotId",
];
const ratingCheckActionRequiredFields = [
  "id",
  "ratingId",
  "assignmentId",
  "raterId",
  "checkKind",
  "auxiliaryMaterialSeen",
  "modelExposureTiming",
  "humanOnlyCheckLockedBeforeModelExposure",
  "rubricVersionUsedForCheck",
  "timestamp",
];
const ratingCheckRecordRequiredFields = [
  "id",
  "ratingId",
  "checkerId",
  "checkType",
  "auxiliaryMaterialSeen",
  "modelExposureTiming",
  "humanOnlyCheckLockedBeforeModelExposure",
  "rubricVersionUsedForCheck",
  "labelContaminationGroupId",
  "timestamp",
];
const modelAssistedRatingCheckRequiredFields = [
  "assistingModelRequestedAlias",
  "assistingModelResolvedSnapshot",
  "assistingModelProvider",
  "assistingModelFamily",
  "assistingPromptTemplateId",
  "preModelRatingCheckId",
  "modelAssistanceDeltaSummary",
];
const correctnessClaimWeightWorksheetRequiredFields = [
  "id",
  "claimSpanIds",
  "claimSignificanceWeights",
  "correctnessCredencesStatuses",
  "unclearClaimExclusionFlags",
  "advisoryAggregateCorrectnessEstimate",
  "submittedScoreOverrideFlag",
  "exposureBlindingState",
  "createdBy",
  "timestamp",
];
const verificationRecordRequiredFields = [
  "id",
  "claimChecked",
  "verificationType",
  "verifierId",
  "verifierRole",
  "verificationStatus",
  "verificationResult",
  "exposureStatus",
];
const interpretationTargetMapRequiredFields = [
  "id",
  "positionTextVersionId",
  "critiqueTextVersionId",
  "plausibilityNotes",
  "pricedInBackgroundAssumptionStatus",
  "productAllocationNote",
  "visibilityState",
  "createdBy",
  "timestamp",
];
const verificationWorkspaceSessionRequiredFields = [
  "id",
  "claimType",
  "verificationStatus",
  "correctnessHalfEntireUnclearFlag",
  "exposureBlindingState",
  "verifierId",
  "verifierRole",
  "timestamp",
];
const discussionThreadRequiredFields = [
  "id",
  "issueType",
  "status",
  "createdAt",
  "updatedAt",
];
const postLockDiscussionSessionRequiredFields = [
  "id",
  "discussionThreadId",
  "initialRatingLockCheck",
  "identityStagingPolicy",
  "identityMaskPhaseStatus",
  "roleRevealPolicy",
  "moderatorAdjudicatorVisibilityExceptions",
  "visibleMaterialPolicy",
  "peerScoreRationaleVisibilityTimestamp",
  "majorityPressureWarningState",
  "transcriptArtifact",
  "writtenFollowUpStatus",
  "discussionStatus",
  "timestamp",
];
const adjudicationMemoRequiredFields = [
  "id",
  "discussionThreadId",
  "contestedInterpretation",
  "worstPlausibleInterpretationConsidered",
  "interpretationPlausibilityNotes",
  "multiInterpretationCoverageSummary",
  "adversarialInterpretationWeightingSummary",
  "pricedInAssessment",
  "backgroundKnowledgeAssessment",
  "bottomLineDependenceSummary",
  "clearlyUnsatisfactoryImprecisionSummary",
  "contentFreeDeadWeightSummary",
  "obfuscationSummary",
  "strengthCentralityAllocationSummary",
  "midRangeStrengthUncertaintySummary",
  "correctnessWeightingSummary",
  "correctnessVerificationStatus",
  "correctnessVerificationSummary",
  "clarityAfterEffortSummary",
  "postDiscussionResolutionStatus",
  "unresolvedDisagreementClass",
  "splitDecision",
  "rubricVersionConsidered",
  "timestamp",
];
const adjudicatorPreReadRequiredFields = [
  "id",
  "adjudicatorId",
  "visibleMaterialPolicy",
  "preReadNotes",
  "completedBeforePeerDistributionExposure",
  "linkedAdjudicationMemoId",
  "timestamp",
];
const adjudicationReviewSessionRequiredFields = [
  "id",
  "discussionThreadId",
  "scoreSpreadHeatmapVersion",
  "centXStrProductAllocationView",
  "verificationConflictSummary",
  "siblingContextDifferenceSummary",
  "preSubmitLintSummary",
  "finalizationStatus",
  "timestamp",
];
const uxSimplificationPolicyRequiredFields = [
  "id",
  "policyVersion",
  "taskFirstCopyRequired",
  "progressiveDisclosureRequired",
  "glossarySupportRequired",
  "serverDerivedScreenStateRequired",
  "exactRubricSemanticsPreserved",
  "appendixFAnchorAccess",
  "protectedSplitVariantPolicy",
  "hiddenMetadataLeakagePolicy",
  "createdBy",
  "frozenAt",
  "timestamp",
];
const uxSimplificationReviewRequiredFields = [
  "id",
  "policyId",
  "reviewStatus",
  "reviewerRole",
  "rubricSemanticsPreservationResult",
  "blindingProtectedLabelLeakageResult",
  "accessibilityReadabilityLinkage",
  "userComprehensionOrExpertReviewNotes",
  "blockersAndMitigations",
  "promotionDecision",
  "reviewer",
  "timestamp",
];
const screenStatePayloadRequiredFields = [
  "id",
  "surface",
  "role",
  "payloadSource",
  "schemaVersion",
  "outputSchemaVersion",
  "taskStatement",
  "primaryNextAction",
  "submissionConsequenceSummary",
  "progressiveDisclosureState",
  "createdAt",
  "rejectedUnknownKeys",
  "sanitized",
];
const uxNoFeatureLossKeys = [
  "score_fields",
  "safe_decline",
  "source_recognition",
  "item_issue_report",
  "verification_control",
  "adjudication_control",
  "data_governance_withdrawal",
  "rater_data_profile_visibility",
  "protected_label_warning",
  "audit_provenance_capture",
  "release_governance_action",
  "appendix_f_anchor_access",
  "pre_submit_lint",
  "autosave_resume",
];
const uxHiddenFieldClasses = [
  "source_metadata",
  "admin_tags",
  "benchmark_membership",
  "gold_answers",
  "peer_ratings",
  "model_judge_scores",
  "active_learning_selection_reasons",
  "protected_split_status",
  "rater_performance_metadata",
];
const uxScreenControlRequirements = {
  rating: ["score_fields", "safe_decline", "source_recognition", "item_issue_report", "verification_control", "appendix_f_anchor_access", "pre_submit_lint", "autosave_resume"],
  practice: ["score_fields", "item_issue_report", "appendix_f_anchor_access", "post_lock_feedback", "audit_provenance_capture"],
  calibration: ["score_fields", "appendix_f_anchor_access", "post_lock_feedback", "audit_provenance_capture"],
  consent: ["data_governance_withdrawal", "audit_provenance_capture"],
  withdrawal: ["data_governance_withdrawal", "audit_provenance_capture"],
  rater_data_governance: ["rater_data_profile_visibility", "data_governance_withdrawal", "audit_provenance_capture"],
  discussion: ["item_issue_report", "adjudication_control", "audit_provenance_capture"],
  adjudication: ["verification_control", "adjudication_control", "item_issue_report", "audit_provenance_capture"],
  release_review: ["release_governance_action", "protected_label_warning", "audit_provenance_capture"],
  admin_governance: ["release_governance_action", "data_governance_withdrawal", "audit_provenance_capture"],
};
const uxSimplificationSurfaces = Object.keys(uxScreenControlRequirements);
const uxRequiredAlwaysVisibleControls = ["task_statement", "primary_next_action", "required_controls"];
const uxRequiredOneClickAccessibleControls = ["appendix_f_anchor_access", "rubric_glossary", "item_issue_report"];
const uxForbiddenVisibleFieldFragments = [
  "sourcecategory",
  "sourcetype",
  "authorshiptype",
  "styleband",
  "admintags",
  "split",
  "sourcemodel",
  "generatorpromptversion",
  "modeljudgescore",
  "peerratings",
  "candidateselectionreason",
  "benchmarkstatus",
  "goldanswer",
  "hiddenbenchmark",
  "protectedsplit",
  "raterperformance",
];
const simplifiedCopyRequiredGlossaryTerms = ["centrality", "strength"];
const simplifiedCopyProtectedSplitVariantDispositions = ["frozen_compatible", "quarantined_sensitivity_snapshot"];
const uxPolicyRequiredObjectFields = [
  "taskFirstLayoutRules",
  "plainLanguageCopyRules",
  "glossaryTooltipPolicy",
  "progressiveDisclosureMapRequirements",
  "exactRubricTermPreservationRules",
  "prohibitedSimplifications",
  "protectedSplitEligibility",
];
const uxPolicyRequiredArrayFields = [
  "enabledSurfaces",
  "coveredRoles",
  "coveredLaneClasses",
  "coveredSplitClasses",
  "localeSet",
  "requiredAlwaysVisibleControls",
  "requiredOneClickAccessibleControls",
  "noFeatureLossChecklist",
  "associatedCopyBundleIds",
  "associatedCopyBundleHashes",
];
const uxReviewRequiredObjectFields = [
  "featureParityChecklistResults",
  "requiredControlDiscoverabilityResults",
  "rubricSemanticsPreservationResult",
  "blindingProtectedLabelLeakageResult",
  "accessibilityReadabilityLinkage",
  "blockersAndMitigations",
];
const uxReviewRequiredArrayFields = [
  "reviewedSurfaces",
  "workflowProfileIds",
  "reviewedLocaleSet",
  "noFeatureLossChecklist",
];
const raterDataGovernanceCategories = [
  "identity_profile",
  "rating_performance",
  "session_pacing",
  "safe_decline_reasons",
  "source_style_guesses",
  "discussion_participation",
  "calibration_results",
  "reliability_profile",
];
const raterDataUseScopes = ["certification", "reliability_estimation", "research", "release_reporting", "operations"];
const volunteerWithdrawalRequestTypes = new Set([
  "future_assignment_stop",
  "account_deactivation",
  "identifiable_telemetry_restriction",
  "public_attribution_removal",
  "learning_dashboard_deletion",
  "future_training_export_exclusion",
  "frozen_label_removal_request",
]);
const workflowStateMachineRules = {
  assignment: [
    ["queued", "accepted_or_declined"],
    ["accepted_or_declined", "draft"],
    ["draft", "locked_initial_rating"],
    ["queued", "safe_declined"],
    ["queued", "reassigned"],
  ],
  rating: [
    ["draft", "locked_initial"],
    ["locked_initial", "self_checked"],
    ["locked_initial", "expert_checked"],
    ["locked_initial", "model_assisted_checked"],
    ["self_checked", "revision_proposed"],
    ["expert_checked", "revision_proposed"],
    ["model_assisted_checked", "revision_proposed"],
    ["revision_proposed", "revised_rating_appended"],
  ],
  discussion_thread: [
    ["not_open", "eligible_after_initial_locks"],
    ["eligible_after_initial_locks", "object_level_discussion"],
    ["object_level_discussion", "revision_window"],
    ["revision_window", "adjudication_finalized"],
  ],
  post_lock_discussion_session: [
    ["not_open", "eligible_after_initial_locks"],
    ["eligible_after_initial_locks", "object_level_discussion"],
    ["object_level_discussion", "revision_window"],
    ["revision_window", "adjudication_finalized"],
  ],
  adjudication_memo: [
    ["not_open", "eligible_after_initial_locks"],
    ["eligible_after_initial_locks", "object_level_discussion"],
    ["object_level_discussion", "revision_window"],
    ["revision_window", "adjudication_finalized"],
  ],
  verification_record: [
    ["not_needed", "requested"],
    ["requested", "in_progress"],
    ["in_progress", "verified"],
    ["in_progress", "not_practicable"],
    ["in_progress", "unresolved"],
    ["verified", "adjudication_resolved"],
    ["not_practicable", "adjudication_resolved"],
    ["unresolved", "adjudication_resolved"],
  ],
  label_snapshot: [["candidate", "frozen"]],
  pairwise_comparison_snapshot: [["candidate", "frozen"]],
  evaluation_run: [
    ["configured", "contamination_checks_passed"],
    ["contamination_checks_passed", "run"],
    ["run", "frozen"],
  ],
  training_export: [
    ["configured", "contamination_checks_passed"],
    ["contamination_checks_passed", "run"],
    ["run", "frozen"],
  ],
  release_version: [
    ["draft", "gate_checks_passed"],
    ["gate_checks_passed", "frozen"],
    ["frozen", "published"],
    ["frozen", "internal_only"],
  ],
};

const workflowWriteEndpoints = [
  workflowWriteSpec(/^\/api\/v1\/intake\/positions$/, "position_intake_submitted", "position", adminRoles, {
    allowHiddenMetadata: true,
    requiredAnyFields: [["text", "textVersions"]],
  }),
  workflowWriteSpec(/^\/api\/v1\/intake\/critiques$/, "critique_intake_submitted", "critique", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "positionId"],
    requiredAnyFields: [["text", "textVersions"]],
  }),
  workflowWriteSpec(/^\/api\/v1\/rights\/review$/, "rights_review_submitted", "rightsReview", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/releases\/freeze$/, "release_freeze_submitted", "releaseFreeze", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/certification-records$/, "certification_record_submitted", "certificationRecord", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/exposure-logs$/, "exposure_log_submitted", "exposureLog", adminRoles, { rejectRawBenchmarkContent: true }),
  workflowWriteSpec(/^\/api\/v1\/revisions$/, "revision_record_submitted", "revisionRecord", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/item-text-versions$/, "item_text_version_submitted", "itemTextVersion", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/rating-context-snapshots$/, "rating_context_snapshot_submitted", "ratingContextSnapshot", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/pairwise-comparison-snapshots$/, "pairwise_comparison_snapshot_submitted", "pairwiseComparisonSnapshot", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/rater-reliability-weight-models$/, "rater_reliability_weight_model_submitted", "raterReliabilityWeightModel", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/raters$/, "rater_submitted", "rater", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/assignments$/, "assignment_submitted", "assignment", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "raterId",
      "raterSessionId",
      "positionId",
      "critiqueId",
      "assignmentType",
      "workflowProfileId",
      "workflowProfileVersion",
      "scoreInputPolicyId",
      "requiredUiPanelSet",
      "optionalUiPanelSet",
      "preRatingSelfScreenStatus",
      "raterItemConflictCheckStatus",
      "independentBlindEligibilityStatus",
      "declineOrReassignmentStatus",
      "blindState",
      "sourceTagVisibilityState",
      "topicRoutingBasisAdminOnly",
      "validationMembershipBlindToRater",
      "ratingContextSnapshotId",
      "samePositionSessionId",
      "samePositionOrderPolicy",
      "orderCounterbalanceBucket",
      "positionOrderIndex",
      "siblingCritiquesSeenPriorCount",
      "siblingCritiquesSeenPriorIds",
      "laterSiblingCritiquesAbsentAtSubmission",
      "positionLengthBand",
      "critiqueLengthBand",
      "expectedEffortBand",
      "startedAt",
      "activeTimeSeconds",
      "idleGapSummary",
      "interruptionCount",
      "draftAutosaveStatus",
      "lastAutosavedAt",
      "draftDependencyStaleStatus",
      "resumeCount",
      "sessionPacingState",
      "fatigueWarningState",
      "uiMode",
      "rubricAnchorPanelVersion",
      "preSubmitLintPolicyVersion",
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-sessions$/, "rater_session_submitted", "raterSession", ratingWorkflowRoles, {
    requiredFields: raterSessionRequiredFields,
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-sessions\/(?<id>[^/]+)$/, "rater_session_updated", "raterSession", ratingWorkflowRoles, {
    method: "PATCH",
    pathParamField: "id",
    requiredFields: raterSessionRequiredFields,
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-sessions\/(?<id>[^/]+)\/pause$/, "rater_session_paused", "raterSession", ratingWorkflowRoles, {
    pathParamField: "id",
    requiredFields: raterSessionRequiredFields,
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-sessions\/(?<id>[^/]+)\/stop-after-current$/, "rater_session_stop_after_current", "raterSession", ratingWorkflowRoles, {
    pathParamField: "id",
    requiredFields: raterSessionRequiredFields,
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/practice-sessions$/, "public_example_practice_session_submitted", "publicExamplePracticeSession", ratingWorkflowRoles, {
    requiredFields: ["id", "raterId", "sourceAnchorExampleIds", "workflowProfileId", "attemptRatings", "lockedAt", "feedbackArtifactId", "trainingExposureStatus", "excludedFromRatingDenominator"],
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-learning-plans$/, "rater_learning_plan_submitted", "raterLearningPlan", ratingWorkflowRoles, {
    requiredFields: ["id", "raterId", "rubricVersion", "certificationPackVersion", "practiceGoldDuplicatePerformanceSummaries", "perDimensionDriftSummary", "assignedRemediationModules", "currentAssignmentRestrictionsUnlocks", "feedbackArtifactsShown", "protectedLabelExposureCheck", "timestamp"],
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/gold-items$/, "gold_item_submitted", "goldItem", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/source-anchor-examples$/, "source_anchor_example_submitted", "sourceAnchorExample", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/benchmark-split-members$/, "benchmark_split_member_submitted", "benchmarkSplitMember", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/rights-records$/, "rights_record_submitted", "rightsRecord", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/release-versions$/, "release_version_submitted", "releaseVersion", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/release-gate-profiles$/, "release_gate_profile_submitted", "releaseGateProfile", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/primary-rater-anchor-policies$/, "primary_rater_anchor_policy_submitted", "primaryRaterAnchorPolicy", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/comparability-claims$/, "comparability_claim_submitted", "comparabilityClaim", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/candidate-batches$/, "candidate_batch_submitted", "candidateBatch", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/candidate-critiques$/, "candidate_critique_submitted", "candidateCritique", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/model-judge-scores$/, "model_judge_score_submitted", "modelJudgeScore", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/active-learning-selection-audits$/, "active_learning_selection_audit_submitted", "activeLearningSelectionAudit", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/candidate-batches\/(?<id>[^/]+)\/model-judge-scores$/, "candidate_batch_model_judge_scores_submitted", "modelJudgeScores", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "candidateBatchId",
  }),
  workflowWriteSpec(/^\/api\/v1\/candidates\/(?<id>[^/]+)\/review$/, "candidate_review_submitted", "candidateReview", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "candidateId",
  }),
  workflowWriteSpec(/^\/api\/v1\/candidates\/(?<id>[^/]+)\/promote$/, "candidate_promotion_submitted", "candidatePromotion", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "candidateId",
  }),
  workflowWriteSpec(/^\/api\/v1\/critique-generation-runs$/, "critique_generation_run_submitted", "critiqueGenerationRun", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/generated-critiques$/, "generated_critique_submitted", "generatedCritiqueSubmission", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/generated-critiques\/(?<id>[^/]+)\/promote$/, "generated_critique_promotion_submitted", "generatedCritiquePromotion", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "generatedCritiqueId",
  }),
  workflowWriteSpec(/^\/api\/v1\/generation-evaluation-reports$/, "generation_evaluation_report_submitted", "generationEvaluationReport", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/ratings\/(?<id>[^/]+)\/check$/, "rating_check_submitted", "ratingCheck", ratingWorkflowRoles, {
    pathParamField: "ratingId",
    requiredFields: ratingCheckActionRequiredFields,
    requiredNonEmptyArrayFields: ["auxiliaryMaterialSeen"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/flag$/, "assignment_flag_submitted", "assignmentFlag", ratingWorkflowRoles, {
    pathParamField: "assignmentId",
    requiredFields: ["id", "assignmentId", "raterId", "reasonCode"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/self-screen$/, "assignment_self_screen_submitted", "assignmentSelfScreen", ratingWorkflowRoles, {
    pathParamField: "assignmentId",
    requiredFields: ["id", "assignmentId", "raterId", "selfScreenStatus", "sourcePeerModelGoldProtectedLabelVisibilityState"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/decline$/, "assignment_decline_submitted", "assignmentDecline", ratingWorkflowRoles, {
    pathParamField: "assignmentId",
    requiredFields: assignmentDeclineRequiredFields,
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/defer$/, "assignment_deferral_submitted", "assignmentDeferral", ratingWorkflowRoles, {
    pathParamField: "assignmentId",
    requiredFields: ["id", "assignmentId", "raterId", "deferReason", "resumePolicy", "sourcePeerModelGoldProtectedLabelVisibilityState"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/source-recognition-events$/, "source_recognition_event_submitted", "sourceRecognitionEvent", ratingWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "assignmentId",
    requiredFields: ["id", "assignmentId", "raterId", "recognitionType", "raterAction", "independentBlindEligibilityEffect", "protectedStatusHiddenFromRater"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/discussions$/, "discussion_submitted", "discussion", expertWorkflowRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/discussions\/(?<id>[^/]+)\/post-lock-sessions$/, "post_lock_discussion_session_submitted", "postLockDiscussionSession", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "discussionThreadId",
    requiredFields: postLockDiscussionSessionRequiredFields,
    requiredNonEmptyArrayFields: [
      "itemKeys",
      "participantIds",
      "participantRoles",
      "objectLevelCommentRecords",
      "spanReferenceLinks",
      "overlookedPointFlags",
      "revisionProposalIds",
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/discussions\/(?<id>[^/]+)\/comments$/, "discussion_comment_submitted", "discussionComment", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "discussionThreadId",
    requiredFields: ["id", "discussionThreadId", "authorId", "commentText", "objectLevelStatus", "timestamp"],
  }),
  workflowWriteSpec(/^\/api\/v1\/discussions\/(?<id>[^/]+)\/revision-proposals$/, "discussion_revision_proposal_submitted", "discussionRevisionProposal", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "discussionThreadId",
    requiredFields: ["id", "discussionThreadId", "proposedBy", "ratingIdPrior", "revisionRationale", "timestamp"],
  }),
  workflowWriteSpec(/^\/api\/v1\/discussion-threads$/, "discussion_thread_submitted", "discussionThread", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: discussionThreadRequiredFields,
    requiredAnyFieldSets: [[["itemId"], ["positionId", "critiqueId"], ["itemKeys"]]],
    requiredNonEmptyArrayFields: ["disagreementTaxonomyCodes"],
  }),
  workflowWriteSpec(/^\/api\/v1\/adjudications$/, "adjudication_submitted", "adjudication", expertWorkflowRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/adjudications\/(?<id>[^/]+)\/finalize$/, "adjudication_finalized", "adjudicationFinalization", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "adjudicationId",
  }),
  workflowWriteSpec(/^\/api\/v1\/adjudication-memos$/, "adjudication_memo_submitted", "adjudicationMemo", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: adjudicationMemoRequiredFields,
    requiredAnyFieldSets: [[["itemId"], ["positionId", "critiqueId"], ["itemKeys"]]],
    requiredNonEmptyArrayFields: ["plausibleInterpretationsConsidered", "disagreementTaxonomyCodes", "adjudicatorIds"],
    requiredFiniteNumberFields: ["maxFinalRaterSpread"],
  }),
  workflowWriteSpec(/^\/api\/v1\/adjudicator-pre-reads$/, "adjudicator_pre_read_submitted", "adjudicatorPreRead", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: adjudicatorPreReadRequiredFields,
    requiredNonEmptyArrayFields: ["itemKeys", "preliminaryIssueTags"],
    requiredExactFields: { completedBeforePeerDistributionExposure: true },
  }),
  workflowWriteSpec(/^\/api\/v1\/adjudication-review-sessions$/, "adjudication_review_session_submitted", "adjudicationReviewSession", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: adjudicationReviewSessionRequiredFields,
    requiredNonEmptyArrayFields: ["itemKeys", "rationaleSpanOverlayRefs", "revisionTimelineRefs", "targetMapIds", "minorityRationaleFields", "adjudicatorIds"],
  }),
  workflowWriteSpec(/^\/api\/v1\/verification-records$/, "verification_record_submitted", "verificationRecord", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: verificationRecordRequiredFields,
    requiredAnyFieldSets: [[["itemId"], ["positionId", "critiqueId"]]],
    requiredAnyFields: [["timestamp", "createdAt"]],
    requiredNonEmptyArrayFields: ["verificationMaterials"],
    requiredFiniteNumberFields: ["confidence"],
  }),
  workflowWriteSpec(/^\/api\/v1\/interpretation-target-maps$/, "interpretation_target_map_submitted", "interpretationTargetMap", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: interpretationTargetMapRequiredFields,
    requiredNonEmptyArrayFields: [
      "itemKeys",
      "candidateIntendedConclusionSpans",
      "attackedClaimSpans",
      "plausiblePositionCritiqueInterpretations",
      "centralityTargetClaimSet",
      "strengthTargetClaimSet",
    ],
    requiredObjectFields: ["critiqueCoverageByInterpretation"],
  }),
  workflowWriteSpec(/^\/api\/v1\/verification-workspace-sessions$/, "verification_workspace_session_submitted", "verificationWorkspaceSession", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: verificationWorkspaceSessionRequiredFields,
    requiredNonEmptyArrayFields: ["itemKeys", "claimList", "claimSpanRefs", "evidenceMaterialRefs"],
    requiredWhen: [{ field: "verificationStatus", equals: "not_practicable", requiredFields: ["notPracticableJustification"] }],
  }),
  workflowWriteSpec(/^\/api\/v1\/rating-checks$/, "rating_check_record_submitted", "ratingCheck", ratingWorkflowRoles, {
    requiredFields: ratingCheckRecordRequiredFields,
    requiredNonEmptyArrayFields: ["auxiliaryMaterialSeen"],
    requiredWhen: [
      {
        field: "checkType",
        equals: "model_assisted_check",
        requiredFields: modelAssistedRatingCheckRequiredFields,
        requiredExactFields: { humanOnlyCheckLockedBeforeModelExposure: true },
      },
    ],
    requireActorField: "checkerId",
  }),
  workflowWriteSpec(/^\/api\/v1\/calibration-feedback-events$/, "calibration_feedback_event_submitted", "calibrationFeedbackEvent", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "raterId", "goldItemId", "attemptRatingId", "rubricVersion", "perDimensionDeviationSummary", "feedbackTextVersion", "shownAfterLock", "protectedSplitConflictCheck"],
  }),
  workflowWriteSpec(/^\/api\/v1\/prompt-templates$/, "prompt_template_submitted", "promptTemplate", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/parser-configs$/, "parser_config_submitted", "parserConfig", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/metric-configs$/, "metric_config_submitted", "metricConfig", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/derived-utility-formulas$/, "derived_utility_formula_submitted", "derivedUtilityFormula", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/model-improvement-runs$/, "model_improvement_run_submitted", "modelImprovementRun", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/evaluations\/run$/, "evaluation_run_submitted", "evaluationRun", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/evaluations\/(?<id>[^/]+)\/predictions$/, "model_evaluation_prediction_submitted", "modelEvaluationPrediction", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "evaluationRunId",
  }),
  workflowWriteSpec(/^\/api\/v1\/evaluations\/(?<id>[^/]+)\/calibrate$/, "calibration_run_submitted", "calibrationRun", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "evaluationRunId",
  }),
  workflowWriteSpec(/^\/api\/v1\/artifact-probes\/run$/, "artifact_probe_run_submitted", "artifactProbeRun", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/sycophancy-probes\/run$/, "sycophancy_probe_run_submitted", "sycophancyProbeRun", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/obfuscation-stress-runs$/, "obfuscation_stress_run_submitted", "obfuscationStressRun", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/sanity-baselines\/run$/, "sanity_baseline_run_submitted", "sanityBaselineRun", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/human-ceiling-runs$/, "human_ceiling_run_submitted", "humanCeilingRun", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/leaderboards$/, "leaderboard_submitted", "leaderboard", adminRoles, { allowHiddenMetadata: true }),
  workflowWriteSpec(/^\/api\/v1\/evaluations\/(?<id>[^/]+)\/failure-audits$/, "model_failure_audit_submitted", "modelFailureAudit", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "evaluationRunId",
  }),
  workflowWriteSpec(/^\/api\/v1\/ux-simplification-policies$/, "ux_simplification_policy_submitted", "uxSimplificationPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: uxSimplificationPolicyRequiredFields,
    requiredNonEmptyArrayFields: uxPolicyRequiredArrayFields,
    requiredObjectFields: uxPolicyRequiredObjectFields,
    requiredArrayIncludes: {
      enabledSurfaces: uxSimplificationSurfaces,
      requiredAlwaysVisibleControls: uxRequiredAlwaysVisibleControls,
      requiredOneClickAccessibleControls: uxRequiredOneClickAccessibleControls,
      noFeatureLossChecklist: uxNoFeatureLossKeys,
    },
    requiredExactFields: {
      taskFirstCopyRequired: true,
      progressiveDisclosureRequired: true,
      glossarySupportRequired: true,
      serverDerivedScreenStateRequired: true,
      exactRubricSemanticsPreserved: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/ux-simplification-reviews$/, "ux_simplification_review_submitted", "uxSimplificationReview", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: uxSimplificationReviewRequiredFields,
    requiredAnyFields: [["screenStateIds", "screenSetIds"]],
    requiredNestedFields: ["accessibilityReadabilityLinkage.accessibilityConformanceReportId"],
    requiredNonEmptyArrayFields: uxReviewRequiredArrayFields,
    requiredObjectFields: uxReviewRequiredObjectFields,
    requiredArrayIncludes: { noFeatureLossChecklist: uxNoFeatureLossKeys },
    requiredExactFields: {
      reviewStatus: "passed",
      "rubricSemanticsPreservationResult.status": "passed",
      "blindingProtectedLabelLeakageResult.status": "passed",
      "accessibilityReadabilityLinkage.readabilityStatus": "passed",
      promotionDecision: "promote",
      exactRubricSemanticsPreserved: true,
      appendixFAnchorAccessVerified: true,
      serverDerivedScreenStateVerified: true,
      protectedLeakageReviewPassed: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/screen-state-payloads$/, "screen_state_payload_submitted", "screenStatePayload", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: screenStatePayloadRequiredFields,
    requiredNonEmptyArrayFields: ["visibleFieldAllowlist", "enabledActionAllowlist", "requiredControlKeys", "optionalPanelKeys", "hiddenFieldClasses"],
    requiredNestedFields: [
      "policyVersionProvenance.uxSimplificationPolicyId",
      "policyVersionProvenance.visibilityPolicyId",
      "policyVersionProvenance.workflowProfileId",
      "policyVersionProvenance.assistPolicyId",
      "policyVersionProvenance.uiExperimentPolicyId",
      "policyVersionProvenance.rubricLintConfigId",
    ],
    requiredObjectFields: ["policyVersionProvenance", "requiredOptionalControlMap", "protectedGoldBenchmarkDisclosureState"],
    requiredArrayIncludes: { hiddenFieldClasses: uxHiddenFieldClasses },
    requiredArrayIncludesByFieldValue: [
      { field: "surface", arrayField: "enabledActionAllowlist", values: uxScreenControlRequirements },
      { field: "surface", arrayField: "requiredControlKeys", values: uxScreenControlRequirements },
      { field: "surface", arrayField: "requiredOptionalControlMap.requiredControls", values: uxScreenControlRequirements },
    ],
    forbiddenArrayValueFragments: { visibleFieldAllowlist: uxForbiddenVisibleFieldFragments },
    requiredExactFields: {
      payloadSource: "server_derived",
      "protectedGoldBenchmarkDisclosureState.benchmarkMembership": "not_disclosed",
      "protectedGoldBenchmarkDisclosureState.goldAnswer": "not_disclosed",
      "protectedGoldBenchmarkDisclosureState.protectedSplitStatus": "not_disclosed",
      rejectedUnknownKeys: true,
      sanitized: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/visibility-policies$/, "visibility_policy_submitted", "visibilityPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "fieldClasses", "allowedReadActions", "allowedWriteActions"],
  }),
  workflowWriteSpec(/^\/api\/v1\/rating-workflow-profiles$/, "rating_workflow_profile_submitted", "ratingWorkflowProfile", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "profileVersion", "taskModesCovered", "requiredScoreFields"],
  }),
  workflowWriteSpec(/^\/api\/v1\/ui-experiment-policies$/, "ui_experiment_policy_submitted", "uiExperimentPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "coveredSplitLaneClasses", "blockedExperimentClasses"],
  }),
  workflowWriteSpec(/^\/api\/v1\/pre-submit-assist-policies$/, "pre_submit_assist_policy_submitted", "preSubmitAssistPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "rubricVersion", "workflowProfileId", "prohibitedInputs"],
  }),
  workflowWriteSpec(/^\/api\/v1\/accessibility-conformance-reports$/, "accessibility_conformance_report_submitted", "accessibilityConformanceReport", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "screenIds", "checksPassed", "readabilityReviewStatus"],
  }),
  workflowWriteSpec(/^\/api\/v1\/volunteer-incentive-policies$/, "volunteer_incentive_policy_submitted", "volunteerIncentivePolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "allowedCompensationCreditInputs", "prohibitedIncentiveSignals", "frozenAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-qualification-records$/, "rater_qualification_record_submitted", "raterQualificationRecord", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "raterId", "qualificationScope", "qualificationSource", "evidenceArtifactReference", "approvedRoles", "approver"],
  }),
  workflowWriteSpec(/^\/api\/v1\/language-artifact-assessments$/, "language_artifact_assessment_submitted", "languageArtifactAssessment", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "artifactType", "pinDownabilityImpact", "substantiveAmbiguityImpact", "correctnessImpact", "deadWeightImpact", "overallQualityImpact"],
  }),
  workflowWriteSpec(/^\/api\/v1\/source-recognition-events$/, "source_recognition_event_submitted", "sourceRecognitionEvent", ratingWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "assignmentId", "raterId", "recognitionType", "raterAction", "independentBlindEligibilityEffect", "protectedStatusHiddenFromRater"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/model-provider-data-handling-policies$/, "model_provider_data_handling_policy_submitted", "modelProviderDataHandlingPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "providerEndpointClass", "coveredRunClass", "approvedSplitContentClasses", "approvalStatus", "reviewer", "expiresAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/task-output-eligibility-policies$/, "task_output_eligibility_policy_submitted", "taskOutputEligibilityPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "assignmentOutputClasses", "eligibleLabelSnapshotUses", "excludedDenominatorClasses", "frozenAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/score-input-policies$/, "score_input_policy_submitted", "scoreInputPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "coveredWorkflowSplitClasses", "scoreControlMode", "initialDefaultState", "rawStoragePrecision", "frozenAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-instruction-render-versions$/, "rater_instruction_render_version_submitted", "raterInstructionRenderVersion", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "rubricVersion", "workflowProfileId", "renderedRubricAnchorChecksum", "scoreInputPolicyId", "scoreDefaultPolicy", "rubricLintConfigId", "frozenAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/rubric-lint-configs$/, "rubric_lint_config_submitted", "rubricLintConfig", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "rubricVersion", "workflowProfileId", "preSubmitAssistPolicyId", "lintRuleIds", "frozenAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/rubric-lint-events$/, "rubric_lint_event_submitted", "rubricLintEvent", ratingWorkflowRoles, {
    requiredFields: ["id", "assignmentId", "lintConfigId", "lintRuleId", "triggerState", "severity", "resolvedStatus"],
    requireAssignmentClaimField: "assignmentId",
  }),
  workflowWriteSpec(/^\/api\/v1\/item-issues$/, "item_issue_report_submitted", "itemIssueReport", ratingWorkflowRoles, {
    requiredFields: itemIssueReportRequiredFields,
    requiredAnyFields: [["positionId", "critiqueId", "assignmentId", "ratingId", "snapshotId", "evaluationId", "releaseId"]],
    requiredExactFields: {
      labelVisibilityStateForTriage: "hidden",
      modelResultVisibilityStateForTriage: "hidden",
    },
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
    requireActorField: "reporterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rating-draft-sessions$/, "rating_draft_session_submitted", "ratingDraftSession", ratingWorkflowRoles, {
    requiredFields: ratingDraftSessionRequiredFields,
    requiredNestedFields: ratingDraftSessionDependencyFields,
    requiredExactFields: {
      staleSubmissionBlocked: true,
      draftNotExportedAsLabel: true,
    },
    requireAssignmentClaimField: "assignmentId",
  }),
  workflowWriteSpec(/^\/api\/v1\/score-confidence-annotations$/, "score_confidence_annotation_submitted", "scoreConfidenceAnnotation", ratingWorkflowRoles, {
    requiredFields: ["id", "assignmentId", "ratingId", "raterId", "dimensionConfidences", "scaleVersion", "annotationUsePolicy"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-score-confidences$/, "rater_score_confidence_submitted", "raterScoreConfidence", ratingWorkflowRoles, {
    requiredFields: ["id", "assignmentId", "ratingId", "raterId", "dimensionConfidences", "scaleVersion", "annotationUsePolicy"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rationale-evidence-spans$/, "rationale_evidence_span_submitted", "rationaleEvidenceSpan", ratingWorkflowRoles, {
    requiredFields: [
      "id",
      "itemTextVersionId",
      "spanTarget",
      "startOffset",
      "endOffset",
      "normalizedSelectedTextHash",
      "linkedDimensionOrFlag",
      "noteId",
      "visibilityState",
      "hiddenUntilInitialRatingLock",
      "rawSelectedTextStored",
      "timestamp",
    ],
    requiredAnyFields: [["ratingId", "adjudicationMemoId"]],
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/same-position-scratchpads$/, "same_position_scratchpad_submitted", "samePositionScratchpad", ratingWorkflowRoles, {
    requiredFields: ["id", "raterId", "positionId", "samePositionSessionId", "visibilityState", "promotedToRationaleIds", "timestamp"],
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/same-position-batch-reviews$/, "same_position_batch_review_submitted", "samePositionBatchReview", ratingWorkflowRoles, {
    requiredFields: ["id", "raterId", "positionId", "samePositionSessionId", "siblingRatingIdsReviewed", "productOverallDeltaSummary", "reviewStatus", "nonIndependentEvidenceFlag"],
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/correctness-claim-weight-worksheets$/, "correctness_claim_weight_worksheet_submitted", "correctnessClaimWeightWorksheet", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: correctnessClaimWeightWorksheetRequiredFields,
    requiredAnyFields: [["ratingId", "adjudicationId", "verificationWorkspaceId"]],
    requiredNonEmptyArrayFields: ["claimSpanIds", "claimSignificanceWeights", "correctnessCredencesStatuses", "unclearClaimExclusionFlags"],
    requiredWhen: [{ field: "submittedScoreOverrideFlag", equals: true, requiredFields: ["overrideExplanation"] }],
  }),
  workflowWriteSpec(/^\/api\/v1\/external-assistance-declarations$/, "external_assistance_declaration_submitted", "externalAssistanceDeclaration", ratingWorkflowRoles, {
    requiredFields: ["id", "assignmentId", "raterId", "assistanceType", "protectedTextEventFlag", "contaminationRouting", "accessibilityExceptionStatus"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/protected-artifact-retention-records$/, "protected_artifact_retention_record_submitted", "protectedArtifactRetentionRecord", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "artifactType", "artifactIdOrStoragePointer", "sourceSplitProtectionClass", "releaseConfigManifestId", "retentionDeletionPolicy", "restoreTimeRevalidationStatus"],
  }),
  workflowWriteSpec(/^\/api\/v1\/protected-artifacts\/(?<id>[^/]+)\/revalidate$/, "protected_artifact_revalidation_submitted", "protectedArtifactRevalidation", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "protectedArtifactId",
    requiredFields: ["id", "protectedArtifactId", "releaseConfigManifestId", "revalidationStatus", "staleSupersededBehavior", "checkedAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/blinding-preview-audits$/, "blinding_preview_audit_submitted", "blindingPreviewAudit", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "itemKeys", "itemTextVersionIds", "renderedRaterVisibleTextChecksum", "approvalStatus", "reviewerId"],
  }),
  workflowWriteSpec(/^\/api\/v1\/partial-task-outputs$/, "partial_task_output_submitted", "partialTaskOutput", ratingWorkflowRoles, {
    requiredFields: ["id", "assignmentId", "raterId", "taskType", "itemKeys", "outputFields", "eligibleUses", "excludedDenominators"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/raters\/(?<id>[^/]+)\/position-cluster-exposures$/, "rater_position_cluster_exposure_submitted", "raterPositionClusterExposure", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "raterId",
    requiredFields: ["id", "raterId", "positionClusterId", "exposureSource", "exposureTimestamp", "blindEligibilityEffect", "createdBy"],
  }),
  workflowWriteSpec(/^\/api\/v1\/spot-checks$/, "spot_check_qa_item_submitted", "spotCheckQaItem", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "itemKeys", "samplingStratum", "samplingSeedArtifact", "reviewerId", "checkResult", "excludedFromIndependentRaterCount"],
  }),
  workflowWriteSpec(/^\/api\/v1\/adjudication-triage-items$/, "adjudication_triage_queue_item_submitted", "adjudicationTriageQueueItem", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "itemKeys", "triggerType", "releaseBlockingStatus", "priority", "queueLane", "status", "routingRationale"],
  }),
  workflowWriteSpec(/^\/api\/v1\/diagnostic-deferrals$/, "diagnostic_deferral_record_submitted", "diagnosticDeferralRecord", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "diagnosticName", "claimAffected", "notRunReason", "approvedWeakerClaimWording", "reviewerId", "createdAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/queue-policy-snapshots$/, "queue_policy_snapshot_submitted", "queuePolicySnapshot", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "liveGoldDuplicateValidationMix", "topicRoutingRules", "tierRoutingRules", "safeDeclineReassignmentPolicy", "samePositionOrderPolicy", "randomizationStratificationSeedPolicy", "frozenAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/assignment-selection-audits$/, "assignment_selection_audit_submitted", "assignmentSelectionAudit", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "queuePolicySnapshotId", "candidateAssignments", "servedAssignments", "declinesReassignmentsByReason", "raterTierDistribution", "selfSelectionIndicators", "createdAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/model-inference-configs$/, "model_inference_config_submitted", "modelInferenceConfig", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "evaluationRunId", "providerEndpoint", "modelSnapshot", "decodingParameters", "reasoningBudget", "toolAvailability", "messageStackTemplate", "retryPolicy"],
  }),
  workflowWriteSpec(/^\/api\/v1\/model-run-environments$/, "model_run_environment_submitted", "modelRunEnvironment", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "evaluationRunId", "runtimeOrchestratorVersion", "apiRouteDeploymentId", "libraryVersions", "parserExtractorVersionLinks"],
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-item-conflicts$/, "rater_item_conflict_submitted", "raterItemConflict", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "raterId", "conflictType", "disclosureSource", "independentBlindEligibilityEffect", "allowedNonBlindRoles", "reviewerResolution"],
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/conflict-screen$/, "assignment_conflict_screen_submitted", "raterItemConflict", ratingWorkflowRoles, {
    pathParamField: "assignmentId",
    requiredFields: ["id", "assignmentId", "raterId", "conflictType", "disclosureSource", "independentBlindEligibilityEffect", "allowedNonBlindRoles", "reviewerResolution"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-training-exposure-snapshots$/, "rater_training_exposure_snapshot_submitted", "raterTrainingExposureSnapshot", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "raterId", "assignmentId", "rubricVersion", "publicSourceAnchorExampleIdsPreviouslySeen", "protectedSplitConflictStatus", "createdAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/release-errata$/, "release_erratum_submitted", "releaseErratum", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "releaseId", "erratumType", "affectedArtifactIds", "defectSummary", "supersedingArtifactIds", "historicalArtifactsMutated", "status", "approvedBy", "createdAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/releases\/(?<id>[^/]+)\/supersede$/, "release_supersession_erratum_submitted", "releaseErratum", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "releaseId",
    requiredFields: ["id", "releaseId", "erratumType", "affectedArtifactIds", "defectSummary", "supersedingArtifactIds", "historicalArtifactsMutated", "status", "approvedBy", "createdAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/schedule-status-snapshots$/, "schedule_status_snapshot_submitted", "scheduleStatusSnapshot", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "releaseVersionOrProjectScope", "milestoneId", "milestoneName", "plannedStart", "plannedEnd", "status", "criticalPathImpact", "owner", "approvedBy"],
  }),
  workflowWriteSpec(/^\/api\/v1\/governance-approvals$/, "governance_approval_record_submitted", "governanceApprovalRecord", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "actionKind", "affectedArtifactIds", "proposedBy", "approver1", "approver2", "independenceSeparationOfDutiesStatus", "reasonCode", "visibilitySplitMetricLeaderboardImpactSummary", "approvalTimestamp"],
  }),
  workflowWriteSpec(/^\/api\/v1\/benchmark-submission-policies$/, "benchmark_submission_policy_submitted", "benchmarkSubmissionPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "aggregateOnlyReport", "submissionBudget", "cooldownPolicy", "hiddenIdExposureProhibited", "perItemFeedbackProhibited", "frozenAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/benchmark-submissions$/, "benchmark_submission_submitted", "benchmarkSubmission", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "benchmarkSubmissionPolicyId", "releaseId", "submittedAggregateReportId", "perItemOutputIncluded", "hiddenIdExposureIncluded", "budgetConsumptionStatus", "submittedAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/screens\/(?<id>[^/]+)\/feature-parity-check$/, "screen_feature_parity_check_submitted", "screenFeatureParityCheck", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "screenId",
    requiredFields: ["id", "screenId", "uxSimplificationPolicyId", "requiredControlResults", "featureParityChecklistResults", "noFeatureLoss", "checkedAt"],
    requiredObjectFields: ["requiredControlResults", "featureParityChecklistResults"],
    requiredObjectKeysByFieldValue: [
      { field: "screenId", objectField: "requiredControlResults", values: uxScreenControlRequirements },
    ],
    requiredExactFields: {
      noFeatureLoss: true,
      "featureParityChecklistResults.no_feature_loss": "passed",
      "featureParityChecklistResults.required_controls_reachable": "passed",
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/screens\/(?<id>[^/]+)\/simplified-copy-preview$/, "simplified_copy_preview_submitted", "simplifiedCopyPreview", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "screenId",
    requiredFields: ["id", "screenId", "copyBundleId", "glossaryTooltipIds", "exactRubricTermPreservation", "hiddenFieldLeakageCheck", "uiExperimentPolicyId", "raterInstructionRenderVersionId", "releaseConfigManifestId", "protectedSplitVariantDisposition", "reviewerId", "reviewedAt"],
    requiredNonEmptyArrayFields: ["glossaryTooltipIds"],
    requiredArrayIncludes: { glossaryTooltipIds: simplifiedCopyRequiredGlossaryTerms },
    allowedValues: { protectedSplitVariantDisposition: simplifiedCopyProtectedSplitVariantDispositions },
    requiredExactFields: { exactRubricTermPreservation: true, hiddenFieldLeakageCheck: "passed" },
    requiredWhen: [
      {
        field: "protectedSplitVariantDisposition",
        equals: "quarantined_sensitivity_snapshot",
        requiredFields: ["uiSensitivitySnapshotId"],
      },
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/governed-bundle-canonicalization-profiles$/, "governed_bundle_canonicalization_profile_submitted", "governedBundleCanonicalizationProfile", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "version", "hashAlgorithm", "materializationQueryRules", "activatedAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/governed-bundles$/, "governed_bundle_submitted", "governedBundleRecord", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "bundleFamily", "semanticVersion", "canonicalizationProfileId", "canonicalContentHash", "appendOnlyActivationStatus"],
  }),
  workflowWriteSpec(/^\/api\/v1\/governed-bundles\/(?<id>[^/]+)\/verify$/, "governed_bundle_verification_submitted", "governedBundleVerification", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "governedBundleId",
    requiredFields: ["id", "governedBundleId", "verificationStatus", "expectedHash", "observedHash"],
  }),
  workflowWriteSpec(/^\/api\/v1\/release-config-manifests$/, "release_config_manifest_submitted", "releaseConfigManifest", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "releaseId", "version", "canonicalManifestHash", "governedBundleIds", "bindingFamilies", "frozenAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/releases\/(?<id>[^/]+)\/freeze-config-manifest$/, "release_config_manifest_frozen", "releaseConfigManifest", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "releaseId",
    requiredFields: ["id", "releaseId", "version", "canonicalManifestHash", "governedBundleIds", "bindingFamilies", "frozenAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/release-config-manifests\/(?<id>[^/]+)\/verify$/, "release_config_manifest_verification_submitted", "releaseConfigManifestVerification", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "manifestId",
    requiredFields: ["id", "manifestId", "verificationStatus", "expectedHash", "observedHash"],
  }),
  workflowWriteSpec(/^\/api\/v1\/policy-action-kinds$/, "policy_action_kind_submitted", "policyActionKind", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "actionKind", "requiresCurrentDecision", "requiresManifestBinding", "replayProtection", "wrongScopeBehavior"],
  }),
  workflowWriteSpec(/^\/api\/v1\/policy-decisions$/, "policy_decision_submitted", "policyDecisionRecord", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "actionKindId", "decisionStatus", "actorId", "manifestId", "releaseId", "outputSchemaVersion", "expiresAt", "decidedAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/implementation-phase-gate-bundles$/, "implementation_phase_gate_bundle_submitted", "implementationPhaseGateBundle", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "releaseId", "manifestId", "version", "laneStates", "futurePhaseDefault", "frozenAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/queue-freshness-policies$/, "queue_freshness_policy_submitted", "queueFreshnessPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "lane", "freshnessWindowMinutes", "dependencyRevalidationChecks", "staleBehavior"],
  }),
  workflowWriteSpec(/^\/api\/v1\/queues\/(?<id>[^/]+)\/stale-by-delay-scan$/, "queue_stale_by_delay_scan_submitted", "queueStaleByDelayScan", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "lane",
    requiredFields: ["id", "lane", "scanStatus", "staleCount", "dependencyRevalidationChecks", "scannedAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/client-surface-integrity-policies$/, "client_surface_integrity_policy_submitted", "clientSurfaceIntegrityPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "surface", "thirdPartyAnalyticsProhibited", "sessionReplayProhibited", "domCaptureProhibited", "cspEnforced"],
  }),
  workflowWriteSpec(/^\/api\/v1\/client-surfaces\/(?<id>[^/]+)\/integrity-check$/, "client_surface_integrity_check_submitted", "clientSurfaceIntegrityCheck", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "clientSurfaceId",
    requiredFields: ["id", "clientSurfaceId", "surface", "checkStatus", "checksPassed", "checkedAt"],
  }),
  workflowWriteSpec(/^\/api\/v1\/sensitive-audit-chain\/events$/, "sensitive_audit_chain_event_submitted", "sensitiveAuditChainEvent", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "sequence", "eventKind", "actorHash", "affectedArtifactIds", "beforeHash", "afterHash", "eventHash", "occurredAt"],
  }),
];

const workflowReadEndpoints = [
  workflowReadSpec(/^\/api\/v1\/certification-records\/(?<id>[^/]+)$/, "certificationRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/exposure-logs\/(?<id>[^/]+)$/, "exposureLog", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/revisions\/(?<id>[^/]+)$/, "revisionRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/item-text-versions\/(?<id>[^/]+)$/, "itemTextVersion", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rating-context-snapshots\/(?<id>[^/]+)$/, "ratingContextSnapshot", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/pairwise-comparison-snapshots\/(?<id>[^/]+)$/, "pairwiseComparisonSnapshot", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-reliability-weight-models\/(?<id>[^/]+)$/, "raterReliabilityWeightModel", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/raters\/(?<id>[^/]+)$/, "rater", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)$/, "assignment", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-sessions\/(?<id>[^/]+)$/, "raterSession", workflowStateReadRoles),
  workflowReadSpec(/^\/api\/v1\/practice-sessions\/(?<id>[^/]+)$/, "publicExamplePracticeSession", workflowStateReadRoles),
  workflowReadSpec(/^\/api\/v1\/rater-learning-plans\/(?<id>[^/]+)$/, "raterLearningPlan", workflowStateReadRoles),
  workflowReadSpec(/^\/api\/v1\/gold-items\/(?<id>[^/]+)$/, "goldItem", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/source-anchor-examples\/(?<id>[^/]+)$/, "sourceAnchorExample", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/benchmark-split-members\/(?<id>[^/]+)$/, "benchmarkSplitMember", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rights-records\/(?<id>[^/]+)$/, "rightsRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/release-versions\/(?<id>[^/]+)$/, "releaseVersion", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/release-gate-profiles\/(?<id>[^/]+)$/, "releaseGateProfile", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/primary-rater-anchor-policies\/(?<id>[^/]+)$/, "primaryRaterAnchorPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/comparability-claims\/(?<id>[^/]+)$/, "comparabilityClaim", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/candidate-batches\/(?<id>[^/]+)$/, "candidateBatch", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/candidate-critiques\/(?<id>[^/]+)$/, "candidateCritique", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-judge-scores\/(?<id>[^/]+)$/, "modelJudgeScore", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/active-learning-selection-audits\/(?<id>[^/]+)$/, "activeLearningSelectionAudit", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/critique-generation-runs\/(?<id>[^/]+)$/, "critiqueGenerationRun", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/generated-critiques\/(?<id>[^/]+)$/, "generatedCritiqueSubmission", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/generation-evaluation-reports\/(?<id>[^/]+)$/, "generationEvaluationReport", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-evaluation-predictions\/(?<id>[^/]+)$/, "modelEvaluationPrediction", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/discussions\/(?<id>[^/]+)$/, "discussion", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/discussion-threads\/(?<id>[^/]+)$/, "discussionThread", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/adjudication-memos\/(?<id>[^/]+)$/, "adjudicationMemo", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/verification-records\/(?<id>[^/]+)$/, "verificationRecord", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/adjudicator-pre-reads\/(?<id>[^/]+)$/, "adjudicatorPreRead", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/adjudication-review-sessions\/(?<id>[^/]+)$/, "adjudicationReviewSession", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/interpretation-target-maps\/(?<id>[^/]+)$/, "interpretationTargetMap", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/verification-workspace-sessions\/(?<id>[^/]+)$/, "verificationWorkspaceSession", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/rating-checks\/(?<id>[^/]+)$/, "ratingCheck", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/calibration-feedback-events\/(?<id>[^/]+)$/, "calibrationFeedbackEvent", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/parser-configs\/(?<id>[^/]+)$/, "parserConfig", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/metric-configs\/(?<id>[^/]+)$/, "metricConfig", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/derived-utility-formulas\/(?<id>[^/]+)$/, "derivedUtilityFormula", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-improvement-runs\/(?<id>[^/]+)$/, "modelImprovementRun", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/artifact-probes\/(?<id>[^/]+)$/, "artifactProbeRun", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/sycophancy-probes\/(?<id>[^/]+)$/, "sycophancyProbeRun", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/obfuscation-stress-runs\/(?<id>[^/]+)$/, "obfuscationStressRun", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/sanity-baselines\/(?<id>[^/]+)$/, "sanityBaselineRun", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/ux-simplification-policies\/(?<id>[^/]+)$/, "uxSimplificationPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/ux-simplification-reviews\/(?<id>[^/]+)$/, "uxSimplificationReview", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/screen-state-payloads\/(?<id>[^/]+)$/, "screenStatePayload", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/visibility-policies\/(?<id>[^/]+)$/, "visibilityPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rating-workflow-profiles\/(?<id>[^/]+)$/, "ratingWorkflowProfile", workflowStateReadRoles),
  workflowReadSpec(/^\/api\/v1\/ui-experiment-policies\/(?<id>[^/]+)$/, "uiExperimentPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/pre-submit-assist-policies\/(?<id>[^/]+)$/, "preSubmitAssistPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/accessibility-conformance-reports\/(?<id>[^/]+)$/, "accessibilityConformanceReport", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/volunteer-incentive-policies\/(?<id>[^/]+)$/, "volunteerIncentivePolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-qualification-records\/(?<id>[^/]+)$/, "raterQualificationRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/language-artifact-assessments\/(?<id>[^/]+)$/, "languageArtifactAssessment", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/source-recognition-events\/(?<id>[^/]+)$/, "sourceRecognitionEvent", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/model-provider-data-handling-policies\/(?<id>[^/]+)$/, "modelProviderDataHandlingPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/task-output-eligibility-policies\/(?<id>[^/]+)$/, "taskOutputEligibilityPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/score-input-policies\/(?<id>[^/]+)$/, "scoreInputPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-instruction-render-versions\/(?<id>[^/]+)$/, "raterInstructionRenderVersion", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rubric-lint-configs\/(?<id>[^/]+)$/, "rubricLintConfig", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rubric-lint-events\/(?<id>[^/]+)$/, "rubricLintEvent", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/item-issues\/(?<id>[^/]+)$/, "itemIssueReport", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/rating-draft-sessions\/(?<id>[^/]+)$/, "ratingDraftSession", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/score-confidence-annotations\/(?<id>[^/]+)$/, "scoreConfidenceAnnotation", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/rater-score-confidences\/(?<id>[^/]+)$/, "raterScoreConfidence", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/rationale-evidence-spans\/(?<id>[^/]+)$/, "rationaleEvidenceSpan", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/same-position-scratchpads\/(?<id>[^/]+)$/, "samePositionScratchpad", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/same-position-batch-reviews\/(?<id>[^/]+)$/, "samePositionBatchReview", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/correctness-claim-weight-worksheets\/(?<id>[^/]+)$/, "correctnessClaimWeightWorksheet", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/external-assistance-declarations\/(?<id>[^/]+)$/, "externalAssistanceDeclaration", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/protected-artifact-retention-records\/(?<id>[^/]+)$/, "protectedArtifactRetentionRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/blinding-preview-audits\/(?<id>[^/]+)$/, "blindingPreviewAudit", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/partial-task-outputs\/(?<id>[^/]+)$/, "partialTaskOutput", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/spot-checks\/(?<id>[^/]+)$/, "spotCheckQaItem", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/adjudication-triage-items\/(?<id>[^/]+)$/, "adjudicationTriageQueueItem", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/diagnostic-deferrals\/(?<id>[^/]+)$/, "diagnosticDeferralRecord", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/queue-policy-snapshots\/(?<id>[^/]+)$/, "queuePolicySnapshot", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/assignment-selection-audits\/(?<id>[^/]+)$/, "assignmentSelectionAudit", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-inference-configs\/(?<id>[^/]+)$/, "modelInferenceConfig", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-run-environments\/(?<id>[^/]+)$/, "modelRunEnvironment", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-item-conflicts\/(?<id>[^/]+)$/, "raterItemConflict", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/rater-training-exposure-snapshots\/(?<id>[^/]+)$/, "raterTrainingExposureSnapshot", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/release-errata\/(?<id>[^/]+)$/, "releaseErratum", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/schedule-status-snapshots\/(?<id>[^/]+)$/, "scheduleStatusSnapshot", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/governance-approvals\/(?<id>[^/]+)$/, "governanceApprovalRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/protected-artifact-revalidations\/(?<id>[^/]+)$/, "protectedArtifactRevalidation", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/benchmark-submission-policies\/(?<id>[^/]+)$/, "benchmarkSubmissionPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/benchmark-submissions\/(?<id>[^/]+)$/, "benchmarkSubmission", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/screen-feature-parity-checks\/(?<id>[^/]+)$/, "screenFeatureParityCheck", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/simplified-copy-previews\/(?<id>[^/]+)$/, "simplifiedCopyPreview", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/governed-bundle-canonicalization-profiles\/(?<id>[^/]+)$/, "governedBundleCanonicalizationProfile", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/governed-bundles\/(?<id>[^/]+)$/, "governedBundleRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/release-config-manifests\/(?<id>[^/]+)$/, "releaseConfigManifest", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/policy-action-kinds\/(?<id>[^/]+)$/, "policyActionKind", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/policy-decisions\/(?<id>[^/]+)$/, "policyDecisionRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/implementation-phase-gate-bundles\/(?<id>[^/]+)$/, "implementationPhaseGateBundle", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/queue-freshness-policies\/(?<id>[^/]+)$/, "queueFreshnessPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/client-surface-integrity-policies\/(?<id>[^/]+)$/, "clientSurfaceIntegrityPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/sensitive-audit-chain\/events\/(?<id>[^/]+)$/, "sensitiveAuditChainEvent", adminAuditRoles),
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

export function createLmcaServer(options = {}) {
  const context = createApiContext(options);
  const { rootDir } = context;

  return createHttpServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApiRequest(request, response, url, context);
        return;
      }
      await serveStatic(response, rootDir, url.pathname);
    } catch (error) {
      sendJson(response, 500, {
        error: "internal_server_error",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

export function createApiContext(options = {}) {
  const rootDir = resolve(options.rootDir ?? resolve(import.meta.dirname, ".."));
  const auditDir = resolve(options.auditDir ?? join(rootDir, "data", "audit"));
  const auditStore = options.auditStore ?? createLocalAuditStore({ auditDir });
  const sessionSecret = options.sessionSecret ?? process.env.LMCA_SESSION_SECRET ?? "local-dev-session-secret-not-for-production";
  const auth = createAuthConfig({ ...options, sessionSecret });
  const publicAuth = createPublicAuthConfig(auth, options);
  return { rootDir, auditStore, auth, publicAuth };
}

export async function createConfiguredApiContext(options = {}) {
  const rootDir = resolve(options.rootDir ?? resolve(import.meta.dirname, ".."));
  const sessionSecret = options.sessionSecret ?? process.env.LMCA_SESSION_SECRET ?? "local-dev-session-secret-not-for-production";
  const auditStore = options.auditStore ?? (await createAuditStoreFromEnvironment(rootDir, options.auditDir));
  const auth = createAuthConfig({ ...options, sessionSecret });
  const publicAuth = createPublicAuthConfig(auth, options);
  return { rootDir, auditStore, auth, publicAuth };
}

export function createAuthConfig(options = {}) {
  const mode = options.authMode ?? process.env.LMCA_AUTH_MODE ?? "demo";
  const requireRealAuth = options.requireRealAuth ?? process.env.LMCA_REQUIRE_REAL_AUTH === "true";
  if (!["demo", "external_jwt"].includes(mode)) {
    throw new Error(`Unsupported LMCA_AUTH_MODE: ${mode}`);
  }
  if (requireRealAuth && mode !== "external_jwt") {
    throw new Error("LMCA_REQUIRE_REAL_AUTH=true requires LMCA_AUTH_MODE=external_jwt");
  }
  if (mode === "external_jwt") {
    return {
      mode,
      description: "external_jwt_rbac",
      externalJwt: createExternalJwtAuthConfig({
        issuer: options.authIssuer,
        audience: options.authAudience,
        jwksUrl: options.authJwksUrl,
        jwks: options.authJwks,
        roleClaim: options.authRoleClaim,
        assignmentsClaim: options.authAssignmentsClaim,
        clockSkewSeconds: options.authClockSkewSeconds,
        jwksCacheMs: options.authJwksCacheMs,
      }),
    };
  }
  return {
    mode,
    description: "signed_demo_sessions",
    sessionSecret: options.sessionSecret,
  };
}

export function createPublicAuthConfig(auth, options = {}) {
  if (auth.mode === "external_jwt") {
    return {
      authMode: auth.description,
      provider: "clerk",
      clerkPublishableKey: options.clerkPublishableKey ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? null,
      clerkJwtTemplate: options.clerkJwtTemplate ?? process.env.LMCA_CLERK_JWT_TEMPLATE ?? "lmca",
      roleClaim: auth.externalJwt.roleClaim,
      assignmentsClaim: auth.externalJwt.assignmentsClaim,
      demoSessionEndpointEnabled: false,
    };
  }
  return {
    authMode: auth.description,
    provider: "demo",
    clerkPublishableKey: null,
    clerkJwtTemplate: null,
    roleClaim: null,
    assignmentsClaim: null,
    demoSessionEndpointEnabled: true,
  };
}

async function createAuditStoreFromEnvironment(rootDir, auditDir) {
  if (process.env.LMCA_AUDIT_STORE === "postgres") {
    const { createPostgresAuditStore } = await import("./storage/postgres-audit-store.mjs");
    return createPostgresAuditStore();
  }
  if (process.env.LMCA_REQUIRE_PRODUCTION_STORAGE === "true") {
    throw new Error("LMCA_REQUIRE_PRODUCTION_STORAGE=true requires LMCA_AUDIT_STORE=postgres");
  }
  const resolvedAuditDir = process.env.VERCEL
    ? resolve(process.env.LMCA_AUDIT_DIR ?? "/tmp/rlhf-audit")
    : resolve(auditDir ?? join(rootDir, "data", "audit"));
  return createLocalAuditStore({
    auditDir: resolvedAuditDir,
    storageMode: process.env.VERCEL ? "local_jsonl_ephemeral_vercel_preview" : "local_jsonl_append_only",
  });
}

export async function handleApiRequest(request, response, url, context) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      releaseId,
      auditMode: context.auditStore.storageMode,
      authMode: context.auth.description,
      rbacPolicy: context.auth.mode === "external_jwt" ? "external_jwt_role_and_assignment_claims" : "local_demo_users_only",
      hiddenMetadataPolicy: "server_rejects_rater_submissions_with_admin_only_fields",
      benchmarkAccessPolicy: "admin_only_with_append_only_exposure_log",
      sourceStyleAuditPolicy: "optional_post_lock_diagnostic_only_append_log",
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/auth/config") {
    sendJson(response, 200, {
      ...context.publicAuth,
      configured: context.auth.mode === "demo" || Boolean(context.publicAuth.clerkPublishableKey),
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/assignments/next") {
    await nextAssignmentEndpoint(request, response, context);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/ratings") {
    await recordRatingEndpoint(request, response, context, "blind_initial_submitted");
    return;
  }

  const v1RevisionMatch = url.pathname.match(/^\/api\/v1\/ratings\/([^/]+)\/revise$/);
  if (request.method === "POST" && v1RevisionMatch) {
    await recordRatingEndpoint(request, response, context, "revision_submitted", { parentRatingId: decodeURIComponent(v1RevisionMatch[1]) });
    return;
  }

  const v1CertificationStatusMatch = url.pathname.match(/^\/api\/v1\/certification\/([^/]+)\/status$/);
  if (request.method === "POST" && url.pathname === "/api/v1/certification/start") {
    await certificationStartEndpoint(request, response, context);
    return;
  }
  if (request.method === "GET" && v1CertificationStatusMatch) {
    await certificationStatusEndpoint(request, response, context, decodeURIComponent(v1CertificationStatusMatch[1]));
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/qa/metrics") {
    await reportArtifactEndpoint(request, response, context, ["admin", "auditor", "expert"], (report) => ({
      releaseId,
      ratingEffortQuality: report.ratingEffortQuality,
      correctnessVerification: report.correctnessVerification,
      postDiscussionDisagreement: report.postDiscussionDisagreement,
      rubricQaCoverage: report.rubricQaCoverage,
      sourceStyleAudit: report.sourceStyleAudit,
    }));
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/qa/drift") {
    await reportArtifactEndpoint(request, response, context, ["admin", "auditor", "expert"], (report) => ({
      releaseId,
      rubricDrift: report.rubricDrift,
      raterCompositionConflicts: report.raterCompositionConflicts,
      ratingRevisionAudit: report.ratingRevisionAudit,
    }));
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/benchmark/candidates/freeze") {
    await benchmarkFreezeReportEndpoint(request, response, context);
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/benchmark/exposure") {
    await benchmarkExposureEndpoint(request, response, context);
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/label-snapshots") {
    await labelSnapshotEndpoint(request, response, context);
    return;
  }
  const v1LabelSnapshotMatch = url.pathname.match(/^\/api\/v1\/label-snapshots\/([^/]+)$/);
  if (request.method === "GET" && v1LabelSnapshotMatch) {
    await labelSnapshotEndpoint(request, response, context, decodeURIComponent(v1LabelSnapshotMatch[1]));
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/corpus-manifests") {
    await corpusManifestEndpoint(request, response, context);
    return;
  }
  const v1CorpusManifestMatch = url.pathname.match(/^\/api\/v1\/corpus-manifests\/([^/]+)$/);
  if (request.method === "GET" && v1CorpusManifestMatch) {
    await corpusManifestEndpoint(request, response, context, decodeURIComponent(v1CorpusManifestMatch[1]));
    return;
  }
  const v1ExportMatch = url.pathname.match(/^\/api\/v1\/exports\/(public|internal)$/);
  if (request.method === "POST" && v1ExportMatch) {
    await exportManifestEndpoint(request, response, context, v1ExportMatch[1]);
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/training-exports") {
    await trainingExportV1Endpoint(request, response, context);
    return;
  }
  const v1TrainingExportMatch = url.pathname.match(/^\/api\/v1\/training-exports\/([^/]+)$/);
  if (request.method === "GET" && v1TrainingExportMatch) {
    await trainingExportV1Endpoint(request, response, context, decodeURIComponent(v1TrainingExportMatch[1]));
    return;
  }
  const v1PromptTemplateMatch = url.pathname.match(/^\/api\/v1\/prompt-templates\/([^/]+)$/);
  if (request.method === "GET" && v1PromptTemplateMatch) {
    await protectedJsonEndpoint(request, response, context, ["admin", "auditor"], async () => {
      const id = decodeURIComponent(v1PromptTemplateMatch[1]);
      return promptArtifacts[id] ?? (await workflowResourceById(context, "promptTemplate", id));
    });
    return;
  }
  const v1EvaluationMatch = url.pathname.match(/^\/api\/v1\/evaluations\/([^/]+)$/);
  if (request.method === "GET" && v1EvaluationMatch) {
    await protectedJsonEndpoint(request, response, context, ["admin", "auditor"], async () => {
      const id = decodeURIComponent(v1EvaluationMatch[1]);
      return evaluationRunById(id) ?? (await workflowResourceById(context, "evaluationRun", id));
    });
    return;
  }
  const v1EvaluationPredictionsMatch = url.pathname.match(/^\/api\/v1\/evaluations\/([^/]+)\/predictions$/);
  if (request.method === "GET" && v1EvaluationPredictionsMatch) {
    await protectedJsonEndpoint(request, response, context, ["admin", "auditor"], async () => {
      const evaluationRunId = decodeURIComponent(v1EvaluationPredictionsMatch[1]);
      const run = evaluationRunById(evaluationRunId);
      const persistedPredictions = await workflowResourcesByField(context, "modelEvaluationPrediction", "evaluationRunId", evaluationRunId);
      if (!run && !persistedPredictions.length) return null;
      return {
        evaluationRunId,
        predictions: [...(run?.predictions ?? []), ...persistedPredictions],
      };
    });
    return;
  }
  const v1EvaluationReportMatch = url.pathname.match(/^\/api\/v1\/evaluations\/([^/]+)\/report$/);
  if (request.method === "GET" && v1EvaluationReportMatch) {
    await reportArtifactEndpoint(request, response, context, ["admin", "auditor"], (report) =>
      evaluationReportForId(report, decodeURIComponent(v1EvaluationReportMatch[1]), context),
    );
    return;
  }
  const v1CalibrationRunMatch = url.pathname.match(/^\/api\/v1\/calibration-runs\/([^/]+)$/);
  if (request.method === "GET" && v1CalibrationRunMatch) {
    await reportArtifactEndpoint(request, response, context, ["admin", "auditor"], async (report) => {
      const id = decodeURIComponent(v1CalibrationRunMatch[1]);
      return findArtifactById(report.recalibratedEvaluation, id) ?? (await workflowResourceById(context, "calibrationRun", id));
    });
    return;
  }
  const v1HumanCeilingRunMatch = url.pathname.match(/^\/api\/v1\/human-ceiling-runs\/([^/]+)$/);
  if (request.method === "GET" && v1HumanCeilingRunMatch) {
    await reportArtifactEndpoint(request, response, context, ["admin", "auditor"], async (report) => {
      const id = decodeURIComponent(v1HumanCeilingRunMatch[1]);
      return findArtifactById(report.humanCeiling, id) ?? (await workflowResourceById(context, "humanCeilingRun", id));
    });
    return;
  }
  const v1LeaderboardMatch = url.pathname.match(/^\/api\/v1\/leaderboards\/([^/]+)$/);
  if (request.method === "GET" && v1LeaderboardMatch) {
    await reportArtifactEndpoint(request, response, context, ["admin", "auditor"], async (report) => {
      const id = decodeURIComponent(v1LeaderboardMatch[1]);
      return artifactIdMatches(report.leaderboardReport, id) ? report.leaderboardReport : await workflowResourceById(context, "leaderboard", id);
    });
    return;
  }
  const v1FailureAuditsMatch = url.pathname.match(/^\/api\/v1\/evaluations\/([^/]+)\/failure-audits$/);
  if (request.method === "GET" && v1FailureAuditsMatch) {
    await reportArtifactEndpoint(request, response, context, ["admin", "auditor"], async (report) => {
      const evaluationRunId = decodeURIComponent(v1FailureAuditsMatch[1]);
      return {
        evaluationRunId,
        audits: [
          ...report.modelFailureAudits.filter((audit) => audit.evaluationRunId === evaluationRunId),
          ...(await workflowResourcesByField(context, "modelFailureAudit", "evaluationRunId", evaluationRunId)),
        ],
      };
    });
    return;
  }
  const v1ReleaseConfigManifestMatch = url.pathname.match(/^\/api\/v1\/releases\/([^/]+)\/config-manifest$/);
  if (request.method === "GET" && v1ReleaseConfigManifestMatch) {
    await releaseConfigManifestForReleaseEndpoint(request, response, context, decodeURIComponent(v1ReleaseConfigManifestMatch[1]));
    return;
  }
  const v1EvaluationConfigManifestMatch = url.pathname.match(/^\/api\/v1\/evaluations\/([^/]+)\/release-config-manifest$/);
  if (request.method === "GET" && v1EvaluationConfigManifestMatch) {
    await releaseConfigManifestForEvaluationEndpoint(request, response, context, decodeURIComponent(v1EvaluationConfigManifestMatch[1]));
    return;
  }
  const v1PolicyDecisionConsumeMatch = url.pathname.match(/^\/api\/v1\/policy-decisions\/([^/]+)\/consume$/);
  if (request.method === "POST" && v1PolicyDecisionConsumeMatch) {
    await policyDecisionConsumeEndpoint(request, response, context, decodeURIComponent(v1PolicyDecisionConsumeMatch[1]));
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/implementation-phase") {
    await implementationPhaseEndpoint(request, response, context);
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/sensitive-audit-chain/events") {
    await sensitiveAuditChainEventsEndpoint(request, response, context);
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/sensitive-audit-chain/verify") {
    await sensitiveAuditChainVerifyEndpoint(request, response, context);
    return;
  }

  const v1WorkflowStateMatch = url.pathname.match(/^\/api\/v1\/state\/([^/]+)\/([^/]+)$/);
  if (request.method === "GET" && v1WorkflowStateMatch) {
    await workflowStateEndpoint(request, response, context, decodeURIComponent(v1WorkflowStateMatch[1]), decodeURIComponent(v1WorkflowStateMatch[2]));
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/state-transitions") {
    await workflowStateTransitionEndpoint(request, response, context);
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/raters/me/data-profile") {
    await raterDataProfileEndpoint(request, response, context);
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/raters/me/data-consent") {
    await participantDataWorkflowWriteEndpoint(request, response, context, "raterDataConsent", "rater_data_consent_submitted", validateRaterDataConsentPayload);
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/raters/me/data-restriction-request") {
    await participantDataWorkflowWriteEndpoint(
      request,
      response,
      context,
      "raterDataRestrictionRequest",
      "rater_data_restriction_request_submitted",
      validateRaterDataRestrictionPayload,
    );
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/raters/me/withdrawal-requests") {
    await participantDataWorkflowWriteEndpoint(
      request,
      response,
      context,
      "volunteerDataWithdrawalRequest",
      "volunteer_data_withdrawal_request_submitted",
      validateVolunteerDataWithdrawalPayload,
    );
    return;
  }
  const v1WithdrawalRequestMatch = url.pathname.match(/^\/api\/v1\/raters\/me\/withdrawal-requests\/([^/]+)$/);
  if (request.method === "GET" && v1WithdrawalRequestMatch) {
    await volunteerWithdrawalRequestEndpoint(request, response, context, decodeURIComponent(v1WithdrawalRequestMatch[1]));
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/raters/me/exposure-eligibility") {
    await raterExposureEligibilityEndpoint(request, response, context, url);
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/assignment-selection-audits") {
    await assignmentSelectionAuditsEndpoint(request, response, context);
    return;
  }
  const v1AssignmentTrainingExposureMatch = url.pathname.match(/^\/api\/v1\/assignments\/([^/]+)\/training-exposure-snapshot$/);
  if (request.method === "GET" && v1AssignmentTrainingExposureMatch) {
    await assignmentTrainingExposureSnapshotEndpoint(request, response, context, decodeURIComponent(v1AssignmentTrainingExposureMatch[1]));
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/raters/me/training-exposure") {
    await raterTrainingExposureEndpoint(request, response, context, url);
    return;
  }
  const v1ReleaseScheduleStatusMatch = url.pathname.match(/^\/api\/v1\/releases\/([^/]+)\/schedule-status$/);
  if (request.method === "GET" && v1ReleaseScheduleStatusMatch) {
    await releaseScheduleStatusEndpoint(request, response, context, decodeURIComponent(v1ReleaseScheduleStatusMatch[1]));
    return;
  }
  const v1AssignmentScreenStateMatch = url.pathname.match(/^\/api\/v1\/assignments\/([^/]+)\/screen-state$/);
  if (request.method === "GET" && v1AssignmentScreenStateMatch) {
    await assignmentScreenStateEndpoint(request, response, context, decodeURIComponent(v1AssignmentScreenStateMatch[1]));
    return;
  }
  const v1DiscussionScreenStateMatch = url.pathname.match(/^\/api\/v1\/discussions\/([^/]+)\/screen-state$/);
  if (request.method === "GET" && v1DiscussionScreenStateMatch) {
    await genericWorkflowScreenStateEndpoint(request, response, context, "discussion", decodeURIComponent(v1DiscussionScreenStateMatch[1]));
    return;
  }
  const v1PostLockDiscussionSessionMatch = url.pathname.match(/^\/api\/v1\/discussions\/([^/]+)\/post-lock-sessions\/([^/]+)$/);
  if (request.method === "GET" && v1PostLockDiscussionSessionMatch) {
    await postLockDiscussionSessionEndpoint(
      request,
      response,
      context,
      decodeURIComponent(v1PostLockDiscussionSessionMatch[1]),
      decodeURIComponent(v1PostLockDiscussionSessionMatch[2]),
    );
    return;
  }
  const v1AdjudicationScreenStateMatch = url.pathname.match(/^\/api\/v1\/adjudications\/([^/]+)\/screen-state$/);
  if (request.method === "GET" && v1AdjudicationScreenStateMatch) {
    await genericWorkflowScreenStateEndpoint(request, response, context, "adjudication", decodeURIComponent(v1AdjudicationScreenStateMatch[1]));
    return;
  }
  const v1AdjudicationCockpitMatch = url.pathname.match(/^\/api\/v1\/adjudications\/([^/]+)\/cockpit$/);
  if (request.method === "GET" && v1AdjudicationCockpitMatch) {
    await adjudicationCockpitEndpoint(request, response, context, decodeURIComponent(v1AdjudicationCockpitMatch[1]));
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/raters/me/calibration-dashboard") {
    await raterCalibrationDashboardEndpoint(request, response, context, url);
    return;
  }
  const v1RemediationCompleteMatch = url.pathname.match(/^\/api\/v1\/raters\/me\/remediation\/([^/]+)\/complete$/);
  if (request.method === "POST" && v1RemediationCompleteMatch) {
    await remediationCompleteEndpoint(request, response, context, decodeURIComponent(v1RemediationCompleteMatch[1]));
    return;
  }
  const v1ItemIssueActionMatch = url.pathname.match(/^\/api\/v1\/item-issues\/([^/]+)\/(triage|resolve|quarantine)$/);
  if (request.method === "POST" && v1ItemIssueActionMatch) {
    await itemIssueActionEndpoint(
      request,
      response,
      context,
      decodeURIComponent(v1ItemIssueActionMatch[1]),
      decodeURIComponent(v1ItemIssueActionMatch[2]),
    );
    return;
  }
  const v1BenchmarkSubmissionAggregateMatch = url.pathname.match(/^\/api\/v1\/benchmark-submissions\/([^/]+)\/aggregate-report$/);
  if (request.method === "GET" && v1BenchmarkSubmissionAggregateMatch) {
    await benchmarkSubmissionAggregateReportEndpoint(request, response, context, decodeURIComponent(v1BenchmarkSubmissionAggregateMatch[1]));
    return;
  }
  const v1SimplifiedCopyPreviewMatch = url.pathname.match(/^\/api\/v1\/screens\/([^/]+)\/simplified-copy-preview$/);
  if (request.method === "GET" && v1SimplifiedCopyPreviewMatch) {
    await simplifiedCopyPreviewEndpoint(request, response, context, decodeURIComponent(v1SimplifiedCopyPreviewMatch[1]));
    return;
  }

  const workflowWriteMatch = matchWorkflowEndpoint(request.method, url.pathname, workflowWriteEndpoints);
  if (workflowWriteMatch) {
    await workflowWriteEndpoint(request, response, context, workflowWriteMatch);
    return;
  }

  const workflowReadMatch = matchWorkflowEndpoint(request.method, url.pathname, workflowReadEndpoints);
  if (workflowReadMatch) {
    await workflowReadEndpoint(request, response, context, workflowReadMatch);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/sessions") {
    if (context.auth.mode !== "demo") {
      sendJson(response, 403, { error: "demo_sessions_disabled" });
      return;
    }
    const body = await readJsonBody(request);
    const user = demoUsers.find((item) => item.id === body.userId);
    if (!user) {
      sendJson(response, 401, { error: "unknown_demo_user" });
      return;
    }
    const token = signSessionToken(user, context.auth.sessionSecret);
    sendJson(response, 201, { token, user, expiresInSeconds: 8 * 60 * 60 });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/release/report") {
    const { report } = await buildCurrentReleaseArtifacts(context);
    sendJson(response, 200, report);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/certification/status") {
    const session = await authenticateRequest(request, context.auth);
    if (!session.ok) {
      sendJson(response, 401, { error: session.error });
      return;
    }
    const requestedRaterId = url.searchParams.get("raterId") ?? session.user.id;
    if (requestedRaterId !== session.user.id && session.user.role !== "admin") {
      sendJson(response, 403, { error: "admin_role_required_for_other_rater_certification" });
      return;
    }
    const persistedCertificationAttempts = await readPersistedCertificationAttempts(context.auditStore);
    sendJson(response, 200, buildRaterCertificationReport(requestedRaterId, [...seedCertificationAttempts, ...persistedCertificationAttempts]));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/certification/attempts") {
    await recordCertificationAttemptEndpoint(request, response, context);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/benchmark/freeze-report") {
    await benchmarkFreezeReportEndpoint(request, response, context);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/benchmark/exposures") {
    await recordBenchmarkExposureEndpoint(request, response, context);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/training/export") {
    await trainingExportEndpoint(request, response, context);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/audit/events") {
    const session = await authenticateRequest(request, context.auth);
    if (!session.ok) {
      sendJson(response, 401, { error: session.error });
      return;
    }
    if (!["admin", "auditor"].includes(session.user.role)) {
      sendJson(response, 403, { error: "audit_reader_role_required" });
      return;
    }
    const events = await context.auditStore.readRatingEvents();
    sendJson(response, 200, { events });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ratings/blind") {
    await recordRatingEndpoint(request, response, context, "blind_initial_submitted");
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ratings/revisions") {
    await recordRatingEndpoint(request, response, context, "revision_submitted");
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/source-style/audits") {
    await recordSourceStyleAuditEndpoint(request, response, context);
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

async function certificationStartEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!["rater", "graduate", "phd", "expert", "admin"].includes(session.user.role)) {
    sendJson(response, 403, { error: "authorized_rater_role_required" });
    return;
  }
  const body = await readJsonBody(request);
  const requestedRaterId = body.raterId ?? session.user.id;
  if (requestedRaterId !== session.user.id && session.user.role !== "admin") {
    sendJson(response, 403, { error: "admin_role_required_for_other_rater_certification" });
    return;
  }
  const requestedPackId = body.packId;
  const pack = requestedPackId ? certificationPacks.find((item) => item.id === requestedPackId) : certificationPacks.find((item) => item.status === "live");
  if (!pack) {
    sendJson(response, 404, { error: "certification_pack_not_found" });
    return;
  }
  const persistedCertificationAttempts = await readPersistedCertificationAttempts(context.auditStore);
  sendJson(response, 200, {
    raterId: requestedRaterId,
    pack,
    currentStatus: buildRaterCertificationReport(requestedRaterId, [...seedCertificationAttempts, ...persistedCertificationAttempts]),
  });
}

async function certificationStatusEndpoint(request, response, context, requestedRaterId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (requestedRaterId !== session.user.id && session.user.role !== "admin") {
    sendJson(response, 403, { error: "admin_role_required_for_other_rater_certification" });
    return;
  }
  const persistedCertificationAttempts = await readPersistedCertificationAttempts(context.auditStore);
  sendJson(response, 200, buildRaterCertificationReport(requestedRaterId, [...seedCertificationAttempts, ...persistedCertificationAttempts]));
}

async function benchmarkExposureEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!["admin", "auditor"].includes(session.user.role)) {
    sendJson(response, 403, { error: "benchmark_exposure_reader_role_required" });
    return;
  }
  sendJson(response, 200, {
    releaseId,
    events: [...seedBenchmarkExposureEvents, ...(await readPersistedBenchmarkExposureEvents(context.auditStore))],
  });
}

async function labelSnapshotEndpoint(request, response, context, requestedId = null) {
  if (request.method === "POST") {
    const persisted = await maybePersistSubmittedWorkflowArtifact(request, response, context, {
      eventType: "label_snapshot_submitted",
      resourceKey: "labelSnapshot",
      roles: adminRoles,
      route: "/api/v1/label-snapshots",
    });
    if (persisted) return;
  }
  await reportArtifactEndpoint(request, response, context, ["admin", "auditor"], async (_report, { labelSnapshot }) => {
    if (!requestedId) return labelSnapshot;
    if (artifactIdMatches(labelSnapshot, requestedId)) return labelSnapshot;
    return workflowResourceById(context, "labelSnapshot", requestedId);
  });
}

async function corpusManifestEndpoint(request, response, context, requestedId = null) {
  if (request.method === "POST") {
    const persisted = await maybePersistSubmittedWorkflowArtifact(request, response, context, {
      eventType: "corpus_manifest_submitted",
      resourceKey: "corpusManifest",
      roles: adminRoles,
      route: "/api/v1/corpus-manifests",
    });
    if (persisted) return;
  }
  await reportArtifactEndpoint(request, response, context, ["admin", "auditor"], async (report) => {
    if (!requestedId) return report.corpusManifest;
    if (artifactIdMatches(report.corpusManifest, requestedId)) return report.corpusManifest;
    return workflowResourceById(context, "corpusManifest", requestedId);
  });
}

async function exportManifestEndpoint(request, response, context, kind) {
  if (request.method === "POST") {
    const persisted = await maybePersistSubmittedWorkflowArtifact(request, response, context, {
      eventType: "export_manifest_submitted",
      resourceKey: "exportManifest",
      roles: adminRoles,
      route: `/api/v1/exports/${kind}`,
      normalize: (resource) => ({ ...resource, kind: resource.kind ?? kind }),
    });
    if (persisted) return;
  }
  await protectedJsonEndpoint(request, response, context, ["admin", "auditor"], async () => {
    const { labelSnapshot, positionList, critiqueList } = await buildCurrentReleaseArtifacts(context);
    return createExportManifest(kind, releaseId, positionList, critiqueList, labelSnapshot);
  });
}

async function trainingExportV1Endpoint(request, response, context, requestedId = null) {
  if (request.method === "POST") {
    const persisted = await maybePersistSubmittedWorkflowArtifact(request, response, context, {
      eventType: "training_export_submitted",
      resourceKey: "trainingExport",
      roles: adminRoles,
      route: "/api/v1/training-exports",
    });
    if (persisted) return;
  }
  await reportArtifactEndpoint(request, response, context, ["admin"], async (report) => {
    if (!requestedId) return report.trainingExport;
    if (artifactIdMatches(report.trainingExport, requestedId)) return report.trainingExport;
    return workflowResourceById(context, "trainingExport", requestedId);
  });
}

async function maybePersistSubmittedWorkflowArtifact(request, response, context, spec) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return true;
  }
  if (!spec.roles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: spec.roles });
    return true;
  }
  const body = await readJsonBody(request);
  const candidate = body[spec.resourceKey] ?? body.resource;
  if (!candidate) return false;
  const normalizedCandidate = spec.normalize ? spec.normalize(candidate) : candidate;
  const validation = validateWorkflowPayload(normalizedCandidate, session.user, spec, {});
  if (!validation.ok) {
    sendJson(response, validation.statusCode ?? 400, { error: validation.error ?? "invalid_workflow_payload", detail: validation.detail });
    return true;
  }
  const event = createWorkflowAuditEvent(spec.eventType, session.user, spec.resourceKey, validation.resource, request, {
    route: spec.route,
    requiredRoles: spec.roles,
  });
  await context.auditStore.appendWorkflowEvent(event);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    eventType: event.type,
    resourceKey: spec.resourceKey,
    resourceId: validation.resource.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
  return true;
}

async function reportArtifactEndpoint(request, response, context, roles, selector) {
  await protectedJsonEndpoint(request, response, context, roles, async () => {
    const artifacts = await buildCurrentReleaseArtifacts(context);
    return selector(artifacts.report, artifacts);
  });
}

async function protectedJsonEndpoint(request, response, context, roles, buildPayload) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!roles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: roles });
    return;
  }
  const payload = await buildPayload(session.user);
  if (payload === null || payload === undefined) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, payload);
}

async function workflowWriteEndpoint(request, response, context, match) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  const { spec, params } = match;
  if (!spec.roles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: spec.roles });
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body[spec.resourceKey] ?? body.resource ?? body;
  const validation = validateWorkflowPayload(candidate, session.user, spec, params);
  if (!validation.ok) {
    sendJson(response, validation.statusCode ?? 400, { error: validation.error ?? "invalid_workflow_payload", detail: validation.detail });
    return;
  }
  const event = createWorkflowAuditEvent(spec.eventType, session.user, spec.resourceKey, validation.resource, request, {
    route: spec.route,
    params,
    requiredRoles: spec.roles,
  });
  await context.auditStore.appendWorkflowEvent(event);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    eventType: event.type,
    resourceKey: spec.resourceKey,
    resourceId: validation.resource.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function workflowReadEndpoint(request, response, context, match) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  const { spec, params } = match;
  if (!spec.roles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: spec.roles });
    return;
  }
  const resource = await workflowResourceById(context, spec.resourceKey, params.id);
  if (!resource) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, resource);
}

async function raterExposureEligibilityEndpoint(request, response, context, url) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!workflowStateReadRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: workflowStateReadRoles });
    return;
  }
  const requestedRaterId = session.user.role === "admin" ? url.searchParams.get("raterId") ?? session.user.id : session.user.id;
  const exposures = await workflowResourcesByField(context, "raterPositionClusterExposure", "raterId", requestedRaterId);
  const blockedPositionClusterIds = [
    ...new Set(
      exposures
        .filter((exposure) => {
          const effect = String(exposure.blindEligibilityEffect ?? "").toLowerCase();
          return effect.includes("excluded") || effect.includes("blocked") || effect.includes("non_blind");
        })
        .map((exposure) => exposure.positionClusterId)
        .filter(Boolean),
    ),
  ];
  sendJson(response, 200, {
    raterId: requestedRaterId,
    exposureCount: exposures.length,
    blockedPositionClusterIds,
    eligiblePositionClusterIds: [],
    exposures,
  });
}

async function assignmentSelectionAuditsEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminAuditRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminAuditRoles });
    return;
  }
  const assignmentSelectionAudits = latestWorkflowResources(await readPersistedWorkflowEvents(context.auditStore), "assignmentSelectionAudit");
  sendJson(response, 200, { releaseId, assignmentSelectionAudits });
}

async function assignmentTrainingExposureSnapshotEndpoint(request, response, context, assignmentId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!workflowStateReadRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: workflowStateReadRoles });
    return;
  }
  const snapshots = await workflowResourcesByField(context, "raterTrainingExposureSnapshot", "assignmentId", assignmentId);
  const visibleSnapshots = session.user.role === "admin" ? snapshots : snapshots.filter((snapshot) => snapshot.raterId === session.user.id);
  const snapshot = visibleSnapshots.at(-1);
  if (!snapshot) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, snapshot);
}

async function raterTrainingExposureEndpoint(request, response, context, url) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!workflowStateReadRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: workflowStateReadRoles });
    return;
  }
  const requestedRaterId = session.user.role === "admin" ? url.searchParams.get("raterId") ?? session.user.id : session.user.id;
  const trainingExposureSnapshots = await workflowResourcesByField(context, "raterTrainingExposureSnapshot", "raterId", requestedRaterId);
  sendJson(response, 200, { raterId: requestedRaterId, trainingExposureSnapshots });
}

async function releaseScheduleStatusEndpoint(request, response, context, requestedReleaseId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminAuditRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminAuditRoles });
    return;
  }
  const scheduleStatusSnapshots = latestWorkflowResources(await readPersistedWorkflowEvents(context.auditStore), "scheduleStatusSnapshot").filter(
    (snapshot) =>
      snapshot.releaseVersionOrProjectScope === requestedReleaseId ||
      snapshot.releaseId === requestedReleaseId ||
      snapshot.releaseVersion === requestedReleaseId ||
      snapshot.projectScope === requestedReleaseId,
  );
  sendJson(response, 200, { releaseId: requestedReleaseId, scheduleStatusSnapshots });
}

async function assignmentScreenStateEndpoint(request, response, context, assignmentId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!workflowStateReadRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: workflowStateReadRoles });
    return;
  }
  if (["rater", "graduate", "phd"].includes(session.user.role) && !session.user.allowedAssignmentIds?.includes("*") && !session.user.allowedAssignmentIds?.includes(assignmentId)) {
    sendJson(response, 403, { error: "workflow_actor_not_authorized", detail: `actor ${session.user.id} is not assigned to ${assignmentId}` });
    return;
  }
  const assignment =
    assignments.find((item) => item.id === assignmentId) ??
    (await workflowResourceById(context, "assignment", assignmentId)) ??
    { id: assignmentId, positionId: null, critiqueId: null };
  sendJson(response, 200, buildScreenStatePayload("rating", assignment.id, session.user, {
    assignmentId: assignment.id,
    positionId: assignment.positionId ?? null,
    critiqueId: assignment.critiqueId ?? null,
    primaryNextAction: "complete_required_scores",
    visibleFieldAllowlist: [
      "assignment.id",
      "assignment.positionTextVersionId",
      "assignment.critiqueTextVersionId",
      "assignment.ratingContextSnapshotId",
      "scoreFields",
      "safeDecline",
      "sourceRecognition",
      "itemIssueReport",
      "verificationControl",
      "appendixFAnchorAccess",
      "preSubmitLint",
      "autosaveResume",
    ],
    enabledActionAllowlist: [
      "score_fields",
      "safe_decline",
      "source_recognition",
      "item_issue_report",
      "verification_control",
      "appendix_f_anchor_access",
      "pre_submit_lint",
      "autosave_resume",
    ],
  }));
}

async function genericWorkflowScreenStateEndpoint(request, response, context, surface, id) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!workflowStateReadRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: workflowStateReadRoles });
    return;
  }
  const actionSets = {
    discussion: ["object_level_comment", "revision_proposal", "majority_pressure_warning_ack"],
    adjudication: ["review_score_spread", "review_target_map", "review_verification_conflicts", "finalize_memo"],
  };
  sendJson(response, 200, buildScreenStatePayload(surface, id, session.user, {
    primaryNextAction: surface === "discussion" ? "add_object_level_comment" : "review_adjudication_cockpit",
    visibleFieldAllowlist: [
      `${surface}.id`,
      "itemKeys",
      "participantHandles",
      "rationaleSpans",
      "verificationSummary",
      "revisionTimeline",
      "minorityRationaleFields",
    ],
    enabledActionAllowlist: actionSets[surface] ?? [],
  }));
}

async function postLockDiscussionSessionEndpoint(request, response, context, discussionThreadId, sessionId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!expertAuditWorkflowRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: expertAuditWorkflowRoles });
    return;
  }
  const resource = await workflowResourceById(context, "postLockDiscussionSession", sessionId);
  if (!resource || resource.discussionThreadId !== discussionThreadId) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, resource);
}

async function adjudicationCockpitEndpoint(request, response, context, adjudicationId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!expertAuditWorkflowRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: expertAuditWorkflowRoles });
    return;
  }
  const allSessions = latestWorkflowResources(await readPersistedWorkflowEvents(context.auditStore), "adjudicationReviewSession");
  const reviewSessions = allSessions.filter(
    (item) => item.adjudicationId === adjudicationId || item.discussionThreadId === adjudicationId || item.id === adjudicationId,
  );
  const latestSession = reviewSessions.at(-1) ?? null;
  sendJson(response, 200, {
    adjudicationId,
    cockpitStatus: latestSession ? "adjudication_review_session_available" : "no_review_session_recorded",
    reviewSession: latestSession,
    screenState: buildScreenStatePayload("adjudication", adjudicationId, session.user, {
      primaryNextAction: latestSession ? "finalize_or_request_revision" : "open_adjudication_review_session",
      visibleFieldAllowlist: [
        "scoreSpreadHeatmapVersion",
        "centXStrProductAllocationView",
        "rationaleSpanOverlayRefs",
        "verificationConflictSummary",
        "revisionTimelineRefs",
        "minorityRationaleFields",
      ],
      enabledActionAllowlist: ["review_target_map", "review_verification_conflicts", "record_minority_rationale", "finalize_memo"],
    }),
  });
}

async function raterCalibrationDashboardEndpoint(request, response, context, url) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!workflowStateReadRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: workflowStateReadRoles });
    return;
  }
  const requestedRaterId = session.user.role === "admin" ? url.searchParams.get("raterId") ?? session.user.id : session.user.id;
  const [learningPlans, calibrationFeedbackEvents, practiceSessions] = await Promise.all([
    workflowResourcesByField(context, "raterLearningPlan", "raterId", requestedRaterId),
    workflowResourcesByField(context, "calibrationFeedbackEvent", "raterId", requestedRaterId),
    workflowResourcesByField(context, "publicExamplePracticeSession", "raterId", requestedRaterId),
  ]);
  sendJson(response, 200, {
    raterId: requestedRaterId,
    latestLearningPlan: learningPlans.at(-1) ?? null,
    calibrationFeedbackEvents,
    practiceSessions,
    protectedLabelExposurePolicy: "no_live_or_hidden_labels_in_training_dashboard",
  });
}

async function remediationCompleteEndpoint(request, response, context, moduleId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!participantDataWriteRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: participantDataWriteRoles });
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.raterLearningPlan ?? body.resource ?? {};
  const raterId = session.user.role === "admin" ? candidate.raterId ?? body.raterId ?? session.user.id : session.user.id;
  const resource = {
    id: candidate.id ?? `rater-learning-plan-${raterId}-${moduleId}`,
    raterId,
    rubricVersion: candidate.rubricVersion ?? "appendix-f-operational-v1",
    certificationPackVersion: candidate.certificationPackVersion ?? "pack-v1",
    practiceGoldDuplicatePerformanceSummaries: candidate.practiceGoldDuplicatePerformanceSummaries ?? { remediation: "completed" },
    perDimensionDriftSummary: candidate.perDimensionDriftSummary ?? { remediation: "completed" },
    assignedRemediationModules: normalizeWorkflowStringList(candidate.assignedRemediationModules ?? [moduleId]),
    completedModules: normalizeWorkflowStringList(candidate.completedModules ?? [moduleId]),
    currentAssignmentRestrictionsUnlocks: normalizeWorkflowStringList(candidate.currentAssignmentRestrictionsUnlocks ?? ["ordinary_live_allowed"]),
    feedbackArtifactsShown: normalizeWorkflowStringList(candidate.feedbackArtifactsShown ?? []),
    protectedLabelExposureCheck: candidate.protectedLabelExposureCheck ?? "no_protected_or_live_labels_shown",
    timestamp: candidate.timestamp ?? new Date().toISOString(),
  };
  const validation = validateWorkflowPayload(resource, session.user, {
    resourceKey: "raterLearningPlan",
    requiredFields: ["id", "raterId", "rubricVersion", "certificationPackVersion", "practiceGoldDuplicatePerformanceSummaries", "perDimensionDriftSummary", "assignedRemediationModules", "currentAssignmentRestrictionsUnlocks", "feedbackArtifactsShown", "protectedLabelExposureCheck", "timestamp"],
    requireActorField: "raterId",
  });
  if (!validation.ok) {
    sendJson(response, validation.statusCode ?? 400, { error: validation.error ?? "invalid_remediation_completion", detail: validation.detail });
    return;
  }
  const event = createWorkflowAuditEvent("rater_remediation_module_completed", session.user, "raterLearningPlan", validation.resource, request, {
    route: "/api/v1/raters/me/remediation/{module_id}/complete",
    params: { module_id: moduleId },
    requiredRoles: participantDataWriteRoles,
  });
  await context.auditStore.appendWorkflowEvent(event);
  sendJson(response, 201, {
    ok: true,
    moduleId,
    resourceKey: "raterLearningPlan",
    resourceId: validation.resource.id,
    eventId: event.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function itemIssueActionEndpoint(request, response, context, itemIssueId, action) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!expertWorkflowRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: expertWorkflowRoles });
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.itemIssueAction ?? body.resource ?? body;
  const resource = {
    id: candidate.id ?? `item-issue-action-${itemIssueId}-${action}`,
    itemIssueId,
    action,
    actorId: candidate.actorId ?? session.user.id,
    resolutionStatus: candidate.resolutionStatus ?? action,
    quarantineScope: candidate.quarantineScope ?? (action === "quarantine" ? "affected_item" : "none"),
    labelVisibilityStateForTriage: candidate.labelVisibilityStateForTriage ?? "labels_hidden_from_triage",
    modelResultVisibilityStateForTriage: candidate.modelResultVisibilityStateForTriage ?? "model_results_hidden_from_triage",
    notes: candidate.notes ?? "",
    timestamp: candidate.timestamp ?? new Date().toISOString(),
  };
  const validation = validateWorkflowPayload(resource, session.user, {
    resourceKey: "itemIssueAction",
    requiredFields: ["id", "itemIssueId", "action", "actorId", "resolutionStatus", "labelVisibilityStateForTriage", "modelResultVisibilityStateForTriage", "timestamp"],
    allowHiddenMetadata: true,
  });
  if (!validation.ok) {
    sendJson(response, validation.statusCode ?? 400, { error: validation.error ?? "invalid_item_issue_action", detail: validation.detail });
    return;
  }
  const event = createWorkflowAuditEvent(`item_issue_${action}_submitted`, session.user, "itemIssueAction", validation.resource, request, {
    route: `/api/v1/item-issues/{id}/${action}`,
    params: { id: itemIssueId },
    requiredRoles: expertWorkflowRoles,
  });
  await context.auditStore.appendWorkflowEvent(event);
  sendJson(response, 201, {
    ok: true,
    itemIssueId,
    action,
    eventId: event.id,
    resourceKey: "itemIssueAction",
    resourceId: validation.resource.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function benchmarkSubmissionAggregateReportEndpoint(request, response, context, submissionId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminAuditRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminAuditRoles });
    return;
  }
  const submission = await workflowResourceById(context, "benchmarkSubmission", submissionId);
  if (!submission) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, {
    id: submission.submittedAggregateReportId,
    benchmarkSubmissionId: submission.id,
    releaseId: submission.releaseId,
    aggregateOnly: true,
    perItemOutputIncluded: false,
    hiddenIdExposureIncluded: false,
    budgetConsumptionStatus: submission.budgetConsumptionStatus,
    cooldownStatus: submission.cooldownStatus,
  });
}

async function simplifiedCopyPreviewEndpoint(request, response, context, screenId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminAuditRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminAuditRoles });
    return;
  }
  const previews = await workflowResourcesByField(context, "simplifiedCopyPreview", "screenId", screenId);
  const preview = previews.at(-1);
  if (!preview) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, preview);
}

function buildScreenStatePayload(surface, entityId, actor, options = {}) {
  return {
    id: `screen-state-${surface}-${entityId}`,
    surface,
    entityId,
    role: actor.role,
    payloadSource: "server_derived",
    schemaVersion: "screen-state-lmca-v1",
    outputSchemaVersion: "screen-state-output-lmca-v1",
    sanitized: true,
    rejectedUnknownKeys: true,
    taskStatement: options.taskStatement ?? `Review the ${surface} workflow state.`,
    primaryNextAction: options.primaryNextAction ?? "review_required_fields",
    submissionConsequenceSummary:
      options.submissionConsequenceSummary ?? "Submitting records an append-only workflow event and does not expose hidden labels.",
    progressiveDisclosureState: options.progressiveDisclosureState ?? "advanced_controls_collapsed_until_needed",
    visibleFieldAllowlist: options.visibleFieldAllowlist ?? [],
    enabledActionAllowlist: options.enabledActionAllowlist ?? [],
    requiredControlKeys: options.requiredControlKeys ?? options.enabledActionAllowlist ?? [],
    optionalPanelKeys: options.optionalPanelKeys ?? ["rubric_glossary", "provenance_summary"],
    hiddenFieldClasses: [
      "source_metadata",
      "admin_tags",
      "benchmark_membership",
      "gold_answers",
      "peer_ratings",
      "model_judge_scores",
      "active_learning_selection_reasons",
      "protected_split_status",
      "rater_performance_metadata",
    ],
    requiredOptionalControlMap:
      options.requiredOptionalControlMap ?? {
        requiredControls: options.requiredControlKeys ?? options.enabledActionAllowlist ?? [],
        optionalPanels: options.optionalPanelKeys ?? ["rubric_glossary", "provenance_summary"],
      },
    protectedGoldBenchmarkDisclosureState:
      options.protectedGoldBenchmarkDisclosureState ?? {
        benchmarkMembership: "not_disclosed",
        goldAnswer: "not_disclosed",
        protectedSplitStatus: "not_disclosed",
      },
    policyVersionProvenance: {
      uxSimplificationPolicyId: `ux-simplification-policy-${releaseId}`,
      visibilityPolicyId: `visibility-policy-${releaseId}`,
      workflowProfileId: `${surface}-workflow-profile`,
      assistPolicyId: `pre-submit-assist-${releaseId}`,
      uiExperimentPolicyId: `ui-experiment-policy-${releaseId}`,
      rubricLintConfigId: `rubric-lint-config-${releaseId}`,
    },
    actor: { id: actor.id, role: actor.role },
    createdAt: options.createdAt ?? new Date().toISOString(),
    ...options,
  };
}

async function releaseConfigManifestForReleaseEndpoint(request, response, context, requestedReleaseId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminAuditRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminAuditRoles });
    return;
  }
  const manifests = await workflowResourcesByField(context, "releaseConfigManifest", "releaseId", requestedReleaseId);
  const manifest = manifests.at(-1);
  if (!manifest) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, manifest);
}

async function releaseConfigManifestForEvaluationEndpoint(request, response, context, evaluationRunId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminAuditRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminAuditRoles });
    return;
  }
  const manifests = await workflowResourcesByField(context, "releaseConfigManifest", "evaluationRunId", evaluationRunId);
  const manifest = manifests.at(-1);
  if (!manifest) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, manifest);
}

async function policyDecisionConsumeEndpoint(request, response, context, requestedDecisionId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminRoles });
    return;
  }
  const decision = await workflowResourceById(context, "policyDecisionRecord", requestedDecisionId);
  if (!decision) {
    sendJson(response, 404, { error: "policy_decision_not_found" });
    return;
  }
  const priorConsumptions = await workflowResourcesByField(context, "policyDecisionConsumption", "decisionId", requestedDecisionId);
  if (priorConsumptions.length) {
    sendJson(response, 409, { error: "policy_decision_already_consumed", decisionId: requestedDecisionId });
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.policyDecisionConsumption ?? body.resource ?? body;
  const consumption = {
    ...candidate,
    decisionId: requestedDecisionId,
    actionKind: candidate.actionKind ?? decision.actionKind,
    manifestId: candidate.manifestId ?? decision.manifestId,
    outputSchemaVersion: candidate.outputSchemaVersion ?? decision.outputSchemaVersion,
    idempotencyKey: candidate.idempotencyKey ?? decision.idempotencyKey,
    replayRejected: false,
    scopeMatched: true,
    consumedAt: candidate.consumedAt ?? new Date().toISOString(),
  };
  const scopeMismatches = [
    consumption.actionKind !== decision.actionKind ? "actionKind" : null,
    consumption.manifestId !== decision.manifestId ? "manifestId" : null,
    consumption.outputSchemaVersion !== decision.outputSchemaVersion ? "outputSchemaVersion" : null,
    decision.idempotencyKey && consumption.idempotencyKey !== decision.idempotencyKey ? "idempotencyKey" : null,
  ].filter(Boolean);
  if (scopeMismatches.length) {
    sendJson(response, 409, { error: "policy_decision_scope_mismatch", decisionId: requestedDecisionId, scopeMismatches });
    return;
  }
  const validation = validateWorkflowPayload(consumption, session.user, {
    resourceKey: "policyDecisionConsumption",
    requiredFields: ["id", "decisionId", "actionKind", "manifestId", "outputSchemaVersion", "consumedAt"],
    allowHiddenMetadata: true,
  });
  if (!validation.ok) {
    sendJson(response, validation.statusCode ?? 400, { error: validation.error ?? "invalid_policy_decision_consumption", detail: validation.detail });
    return;
  }
  const event = createWorkflowAuditEvent("policy_decision_consumed", session.user, "policyDecisionConsumption", validation.resource, request, {
    route: "/api/v1/policy-decisions/{id}/consume",
    requiredRoles: adminRoles,
  });
  await context.auditStore.appendWorkflowEvent(event);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    eventType: event.type,
    resourceKey: "policyDecisionConsumption",
    resourceId: validation.resource.id,
    decisionId: requestedDecisionId,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function implementationPhaseEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminAuditRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminAuditRoles });
    return;
  }
  const bundles = await workflowResourcesByField(context, "implementationPhaseGateBundle", "releaseId", releaseId);
  const activeBundle = bundles.at(-1);
  if (!activeBundle) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, {
    releaseId,
    activeBundleId: activeBundle.id,
    manifestId: activeBundle.manifestId,
    futurePhaseDefault: activeBundle.futurePhaseDefault,
    broadeningRequiresManifestActivation: activeBundle.broadeningRequiresManifestActivation === true,
    laneStates: activeBundle.laneStates ?? [],
  });
}

async function sensitiveAuditChainEventsEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminAuditRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminAuditRoles });
    return;
  }
  const events = latestWorkflowResources(await readPersistedWorkflowEvents(context.auditStore), "sensitiveAuditChainEvent").sort(
    (left, right) => Number(left.sequence ?? 0) - Number(right.sequence ?? 0) || String(left.id).localeCompare(String(right.id)),
  );
  sendJson(response, 200, { releaseId, events });
}

async function sensitiveAuditChainVerifyEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminRoles });
    return;
  }
  const body = await readJsonBody(request);
  const events = latestWorkflowResources(await readPersistedWorkflowEvents(context.auditStore), "sensitiveAuditChainEvent").sort(
    (left, right) => Number(left.sequence ?? 0) - Number(right.sequence ?? 0) || String(left.id).localeCompare(String(right.id)),
  );
  const failures = [];
  events.forEach((event, index) => {
    const expectedSequence = index + 1;
    const previous = events[index - 1] ?? null;
    if (event.sequence !== expectedSequence) failures.push(`sequence:${event.id}`);
    if (index === 0 && event.previousEventHash) failures.push(`previousEventHash:${event.id}`);
    if (index > 0 && event.previousEventHash !== previous.eventHash) failures.push(`previousEventHash:${event.id}`);
    if (!String(event.eventHash ?? "").startsWith("sha256:")) failures.push(`eventHash:${event.id}`);
  });
  const verification = {
    id: body.id ?? body.sensitiveAuditChainVerification?.id ?? `sensitive-audit-chain-verification-${Date.now()}`,
    releaseId,
    chainStatus: failures.length ? "failed" : "passed",
    verifiedEventCount: events.length,
    failures,
    verifiedAt: body.verifiedAt ?? body.sensitiveAuditChainVerification?.verifiedAt ?? new Date().toISOString(),
  };
  const event = createWorkflowAuditEvent("sensitive_audit_chain_verification_submitted", session.user, "sensitiveAuditChainVerification", verification, request, {
    route: "/api/v1/sensitive-audit-chain/verify",
    requiredRoles: adminRoles,
  });
  await context.auditStore.appendWorkflowEvent(event);
  sendJson(response, 201, {
    ok: true,
    ...verification,
    eventId: event.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function workflowStateTransitionEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!workflowStateTransitionRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: workflowStateTransitionRoles });
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.workflowStateTransitionLog ?? body.stateTransition ?? body.transition ?? body;
  const validation = validateWorkflowStateTransitionPayload(candidate, session.user);
  if (!validation.resource) {
    sendJson(response, validation.statusCode ?? 400, { error: validation.error ?? "invalid_workflow_state_transition", detail: validation.detail });
    return;
  }
  const eventType = validation.ok ? "workflow_state_transition_accepted" : "workflow_state_transition_rejected";
  const event = createWorkflowAuditEvent(eventType, session.user, "workflowStateTransitionLog", validation.resource, request, {
    route: "/api/v1/state-transitions",
    requiredRoles: workflowStateTransitionRoles,
  });
  await context.auditStore.appendWorkflowEvent(event);
  if (!validation.ok) {
    sendJson(response, validation.statusCode ?? 409, {
      error: validation.error ?? "workflow_state_transition_guard_failed",
      detail: validation.detail,
      transitionId: validation.resource.id,
      acceptedNextState: validation.resource.acceptedNextState,
      failedGuardReasons: validation.resource.failedGuardReasons,
      eventId: event.id,
      accessAudit: event.accessAudit,
    });
    return;
  }
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    eventType: event.type,
    resourceKey: event.resourceKey,
    resourceId: validation.resource.id,
    transitionId: validation.resource.id,
    entityType: validation.resource.entityType,
    entityId: validation.resource.entityId,
    acceptedNextState: validation.resource.acceptedNextState,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function workflowStateEndpoint(request, response, context, entityTypeInput, entityId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!workflowStateReadRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: workflowStateReadRoles });
    return;
  }
  const entityType = normalizeWorkflowStateEntityType(entityTypeInput);
  if (!workflowStateMachineRules[entityType]) {
    sendJson(response, 404, { error: "unknown_workflow_state_entity_type" });
    return;
  }
  if (["rater", "graduate", "phd"].includes(session.user.role) && entityType === "assignment" && !session.user.allowedAssignmentIds?.includes("*") && !session.user.allowedAssignmentIds?.includes(entityId)) {
    sendJson(response, 403, { error: "workflow_actor_not_authorized", detail: `actor ${session.user.id} is not assigned to ${entityId}` });
    return;
  }
  const transitions = (await workflowResourcesByField(context, "workflowStateTransitionLog", "entityId", entityId))
    .filter((transition) => normalizeWorkflowStateEntityType(transition.entityType) === entityType)
    .sort((left, right) => String(left.timestamp ?? "").localeCompare(String(right.timestamp ?? "")) || String(left.id).localeCompare(String(right.id)));
  if (!transitions.length) {
    sendJson(response, 404, { error: "workflow_state_not_found" });
    return;
  }
  sendJson(response, 200, {
    entityType,
    entityId,
    currentState: transitions.at(-1).acceptedNextState,
    transitionCount: transitions.length,
    transitions,
    appendOnly: true,
  });
}

async function raterDataProfileEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!participantDataReadRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: participantDataReadRoles });
    return;
  }
  const raterId = session.user.id;
  const [consents, restrictions, withdrawals] = await Promise.all([
    workflowResourcesByField(context, "raterDataConsent", "raterId", raterId),
    workflowResourcesByField(context, "raterDataRestrictionRequest", "raterId", raterId),
    workflowResourcesByField(context, "volunteerDataWithdrawalRequest", "raterId", raterId),
  ]);
  sendJson(response, 200, {
    raterId,
    noticeVersion: "rater-data-use-v1",
    categories: raterDataGovernanceCategories.map((category) => ({
      category,
      collected: true,
      publicArtifacts: "deidentified_by_default",
      identifiableAccess: "approved_operational_or_research_roles_only",
    })),
    useScopes: raterDataUseScopes,
    deIdentificationPolicy: {
      publicArtifactsDefault: "deidentified",
      attributionRequiresExplicitAgreement: true,
      privateLearningDataExcludedFromReleaseArtifacts: true,
      privateLearningDataExcludedFromModelTrainingExports: true,
    },
    consent: {
      latest: consents.at(-1) ?? null,
      submittedCount: consents.length,
    },
    restrictionRequests: restrictions,
    withdrawalRequests: withdrawals,
  });
}

async function participantDataWorkflowWriteEndpoint(request, response, context, resourceKey, eventType, validator) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!participantDataWriteRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: participantDataWriteRoles });
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body[resourceKey] ?? body.resource ?? body;
  const validation = validator(candidate, session.user);
  if (!validation.ok) {
    sendJson(response, validation.statusCode ?? 400, { error: validation.error ?? "invalid_participant_data_payload", detail: validation.detail });
    return;
  }
  const event = createWorkflowAuditEvent(eventType, session.user, resourceKey, validation.resource, request, {
    route: routeForParticipantDataResource(resourceKey),
    requiredRoles: participantDataWriteRoles,
  });
  await context.auditStore.appendWorkflowEvent(event);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    eventType: event.type,
    resourceKey,
    resourceId: validation.resource.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function volunteerWithdrawalRequestEndpoint(request, response, context, id) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!participantDataReadRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: participantDataReadRoles });
    return;
  }
  const resource = await workflowResourceById(context, "volunteerDataWithdrawalRequest", id);
  if (!resource) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  if (!["admin", "auditor"].includes(session.user.role) && resource.raterId !== session.user.id) {
    sendJson(response, 403, { error: "participant_data_actor_not_authorized" });
    return;
  }
  sendJson(response, 200, resource);
}

function routeForParticipantDataResource(resourceKey) {
  if (resourceKey === "raterDataConsent") return "/api/v1/raters/me/data-consent";
  if (resourceKey === "raterDataRestrictionRequest") return "/api/v1/raters/me/data-restriction-request";
  return "/api/v1/raters/me/withdrawal-requests";
}

async function buildCurrentReleaseArtifacts(context, options = {}) {
  const workflowEvents = await readPersistedWorkflowEvents(context.auditStore);
  const { positionList, critiqueList } = await buildCurrentCorpus(context);
  const persistedRatings = await readPersistedRatings(context.auditStore);
  const persistedCertificationAttempts = await readPersistedCertificationAttempts(context.auditStore);
  const persistedBenchmarkExposureEvents = await readPersistedBenchmarkExposureEvents(context.auditStore);
  const persistedSourceStyleAudits = await readPersistedSourceStyleAudits(context.auditStore);
  const rightsReviews = latestWorkflowResources(workflowEvents, "rightsReview");
  const releaseFreezes = latestWorkflowResources(workflowEvents, "releaseFreeze");
  const certificationRecords = latestWorkflowResources(workflowEvents, "certificationRecord");
  const exposureLogs = latestWorkflowResources(workflowEvents, "exposureLog");
  const revisionRecords = latestWorkflowResources(workflowEvents, "revisionRecord");
  const assignmentFlags = latestWorkflowResources(workflowEvents, "assignmentFlag");
  const discussions = latestWorkflowResources(workflowEvents, "discussion");
  const discussionThreads = latestWorkflowResources(workflowEvents, "discussionThread");
  const adjudications = latestWorkflowResources(workflowEvents, "adjudication");
  const adjudicationFinalizations = latestWorkflowResources(workflowEvents, "adjudicationFinalization");
  const adjudicationMemos = latestWorkflowResources(workflowEvents, "adjudicationMemo");
  const verificationRecords = latestWorkflowResources(workflowEvents, "verificationRecord");
  const ratingChecks = latestWorkflowResources(workflowEvents, "ratingCheck");
  const labelSnapshots = latestWorkflowResources(workflowEvents, "labelSnapshot");
  const corpusManifests = latestWorkflowResources(workflowEvents, "corpusManifest");
  const trainingExports = latestWorkflowResources(workflowEvents, "trainingExport");
  const exportManifests = latestWorkflowResources(workflowEvents, "exportManifest");
  const itemTextVersions = latestWorkflowResources(workflowEvents, "itemTextVersion");
  const ratingContextSnapshotArtifacts = latestWorkflowResources(workflowEvents, "ratingContextSnapshot");
  const pairwiseComparisonSnapshots = latestWorkflowResources(workflowEvents, "pairwiseComparisonSnapshot");
  const raterReliabilityWeightModels = latestWorkflowResources(workflowEvents, "raterReliabilityWeightModel");
  const raters = latestWorkflowResources(workflowEvents, "rater");
  const workflowAssignments = latestWorkflowResources(workflowEvents, "assignment");
  const candidateBatches = latestWorkflowResources(workflowEvents, "candidateBatch");
  const candidateCritiques = latestWorkflowResources(workflowEvents, "candidateCritique");
  const modelJudgeScores = latestWorkflowResources(workflowEvents, "modelJudgeScore");
  const candidateBatchModelJudgeScoreSubmissions = latestWorkflowResources(workflowEvents, "modelJudgeScores");
  const candidateReviews = latestWorkflowResources(workflowEvents, "candidateReview");
  const candidatePromotions = latestWorkflowResources(workflowEvents, "candidatePromotion");
  const critiqueGenerationRuns = latestWorkflowResources(workflowEvents, "critiqueGenerationRun");
  const generatedCritiqueSubmissions = latestWorkflowResources(workflowEvents, "generatedCritiqueSubmission");
  const generatedCritiquePromotions = latestWorkflowResources(workflowEvents, "generatedCritiquePromotion");
  const generationEvaluationReports = latestWorkflowResources(workflowEvents, "generationEvaluationReport");
  const promptTemplates = latestWorkflowResources(workflowEvents, "promptTemplate");
  const parserConfigs = latestWorkflowResources(workflowEvents, "parserConfig");
  const modelImprovementRuns = latestWorkflowResources(workflowEvents, "modelImprovementRun");
  const evaluationRuns = latestWorkflowResources(workflowEvents, "evaluationRun");
  const modelEvaluationPredictions = latestWorkflowResources(workflowEvents, "modelEvaluationPrediction");
  const calibrationRuns = latestWorkflowResources(workflowEvents, "calibrationRun");
  const artifactProbeRuns = latestWorkflowResources(workflowEvents, "artifactProbeRun");
  const sanityBaselineRuns = latestWorkflowResources(workflowEvents, "sanityBaselineRun");
  const humanCeilingRuns = latestWorkflowResources(workflowEvents, "humanCeilingRun");
  const leaderboards = latestWorkflowResources(workflowEvents, "leaderboard");
  const modelFailureAudits = latestWorkflowResources(workflowEvents, "modelFailureAudit");
  const goldItems = latestWorkflowResources(workflowEvents, "goldItem");
  const sourceAnchorExamples = latestWorkflowResources(workflowEvents, "sourceAnchorExample");
  const benchmarkSplitMembers = latestWorkflowResources(workflowEvents, "benchmarkSplitMember");
  const rightsRecords = latestWorkflowResources(workflowEvents, "rightsRecord");
  const releaseVersions = latestWorkflowResources(workflowEvents, "releaseVersion");
  const metricConfigs = latestWorkflowResources(workflowEvents, "metricConfig");
  const derivedUtilityFormulas = latestWorkflowResources(workflowEvents, "derivedUtilityFormula");
  const releaseGateProfiles = latestWorkflowResources(workflowEvents, "releaseGateProfile");
  const primaryRaterAnchorPolicies = latestWorkflowResources(workflowEvents, "primaryRaterAnchorPolicy");
  const comparabilityClaims = latestWorkflowResources(workflowEvents, "comparabilityClaim");
  const activeLearningSelectionAudits = latestWorkflowResources(workflowEvents, "activeLearningSelectionAudit");
  const sycophancyProbeRuns = latestWorkflowResources(workflowEvents, "sycophancyProbeRun");
  const obfuscationStressRuns = latestWorkflowResources(workflowEvents, "obfuscationStressRun");
  const uxSimplificationPolicies = latestWorkflowResources(workflowEvents, "uxSimplificationPolicy");
  const uxSimplificationReviews = latestWorkflowResources(workflowEvents, "uxSimplificationReview");
  const screenStatePayloads = latestWorkflowResources(workflowEvents, "screenStatePayload");
  const workflowStateTransitionLogs = latestWorkflowResources(workflowEvents, "workflowStateTransitionLog");
  const raterDataConsents = latestWorkflowResources(workflowEvents, "raterDataConsent");
  const volunteerDataConsentProfiles = latestWorkflowResources(workflowEvents, "volunteerDataConsentProfile");
  const raterDataRestrictionRequests = latestWorkflowResources(workflowEvents, "raterDataRestrictionRequest");
  const volunteerDataWithdrawalRequests = latestWorkflowResources(workflowEvents, "volunteerDataWithdrawalRequest");
  const visibilityPolicies = latestWorkflowResources(workflowEvents, "visibilityPolicy");
  const ratingWorkflowProfiles = latestWorkflowResources(workflowEvents, "ratingWorkflowProfile");
  const uiExperimentPolicies = latestWorkflowResources(workflowEvents, "uiExperimentPolicy");
  const preSubmitAssistPolicies = latestWorkflowResources(workflowEvents, "preSubmitAssistPolicy");
  const accessibilityConformanceReports = latestWorkflowResources(workflowEvents, "accessibilityConformanceReport");
  const volunteerIncentivePolicies = latestWorkflowResources(workflowEvents, "volunteerIncentivePolicy");
  const raterQualificationRecords = latestWorkflowResources(workflowEvents, "raterQualificationRecord");
  const languageArtifactAssessments = latestWorkflowResources(workflowEvents, "languageArtifactAssessment");
  const sourceRecognitionEvents = latestWorkflowResources(workflowEvents, "sourceRecognitionEvent");
  const modelProviderDataHandlingPolicies = latestWorkflowResources(workflowEvents, "modelProviderDataHandlingPolicy");
  const taskOutputEligibilityPolicies = latestWorkflowResources(workflowEvents, "taskOutputEligibilityPolicy");
  const scoreInputPolicies = latestWorkflowResources(workflowEvents, "scoreInputPolicy");
  const raterInstructionRenderVersions = latestWorkflowResources(workflowEvents, "raterInstructionRenderVersion");
  const rubricLintConfigs = latestWorkflowResources(workflowEvents, "rubricLintConfig");
  const rubricLintEvents = latestWorkflowResources(workflowEvents, "rubricLintEvent");
  const itemIssueReports = latestWorkflowResources(workflowEvents, "itemIssueReport");
  const ratingDraftSessions = latestWorkflowResources(workflowEvents, "ratingDraftSession");
  const correctnessClaimWeightWorksheets = latestWorkflowResources(workflowEvents, "correctnessClaimWeightWorksheet");
  const protectedArtifactRetentionRecords = latestWorkflowResources(workflowEvents, "protectedArtifactRetentionRecord");
  const scoreConfidenceAnnotations = latestWorkflowResources(workflowEvents, "scoreConfidenceAnnotation");
  const raterScoreConfidences = latestWorkflowResources(workflowEvents, "raterScoreConfidence");
  const rationaleEvidenceSpans = latestWorkflowResources(workflowEvents, "rationaleEvidenceSpan");
  const samePositionScratchpads = latestWorkflowResources(workflowEvents, "samePositionScratchpad");
  const samePositionBatchReviews = latestWorkflowResources(workflowEvents, "samePositionBatchReview");
  const externalAssistanceDeclarations = latestWorkflowResources(workflowEvents, "externalAssistanceDeclaration");
  const blindingPreviewAudits = latestWorkflowResources(workflowEvents, "blindingPreviewAudit");
  const partialTaskOutputs = latestWorkflowResources(workflowEvents, "partialTaskOutput");
  const raterPositionClusterExposures = latestWorkflowResources(workflowEvents, "raterPositionClusterExposure");
  const spotCheckQaItems = latestWorkflowResources(workflowEvents, "spotCheckQaItem");
  const adjudicationTriageQueueItems = latestWorkflowResources(workflowEvents, "adjudicationTriageQueueItem");
  const diagnosticDeferralRecords = latestWorkflowResources(workflowEvents, "diagnosticDeferralRecord");
  const queuePolicySnapshots = latestWorkflowResources(workflowEvents, "queuePolicySnapshot");
  const assignmentSelectionAudits = latestWorkflowResources(workflowEvents, "assignmentSelectionAudit");
  const modelInferenceConfigs = latestWorkflowResources(workflowEvents, "modelInferenceConfig");
  const modelRunEnvironments = latestWorkflowResources(workflowEvents, "modelRunEnvironment");
  const raterItemConflicts = latestWorkflowResources(workflowEvents, "raterItemConflict");
  const raterTrainingExposureSnapshots = latestWorkflowResources(workflowEvents, "raterTrainingExposureSnapshot");
  const releaseErrata = latestWorkflowResources(workflowEvents, "releaseErratum");
  const scheduleStatusSnapshots = latestWorkflowResources(workflowEvents, "scheduleStatusSnapshot");
  const publicExamplePracticeSessions = latestWorkflowResources(workflowEvents, "publicExamplePracticeSession");
  const raterLearningPlans = latestWorkflowResources(workflowEvents, "raterLearningPlan");
  const raterSessions = latestWorkflowResources(workflowEvents, "raterSession");
  const assignmentDeclines = latestWorkflowResources(workflowEvents, "assignmentDecline");
  const interpretationTargetMaps = latestWorkflowResources(workflowEvents, "interpretationTargetMap");
  const verificationWorkspaceSessions = latestWorkflowResources(workflowEvents, "verificationWorkspaceSession");
  const adjudicatorPreReads = latestWorkflowResources(workflowEvents, "adjudicatorPreRead");
  const postLockDiscussionSessions = latestWorkflowResources(workflowEvents, "postLockDiscussionSession");
  const adjudicationReviewSessions = latestWorkflowResources(workflowEvents, "adjudicationReviewSession");
  const calibrationFeedbackEvents = latestWorkflowResources(workflowEvents, "calibrationFeedbackEvent");
  const governanceApprovalRecords = latestWorkflowResources(workflowEvents, "governanceApprovalRecord");
  const protectedArtifactRevalidations = latestWorkflowResources(workflowEvents, "protectedArtifactRevalidation");
  const benchmarkSubmissionPolicies = latestWorkflowResources(workflowEvents, "benchmarkSubmissionPolicy");
  const benchmarkSubmissions = latestWorkflowResources(workflowEvents, "benchmarkSubmission");
  const screenFeatureParityChecks = latestWorkflowResources(workflowEvents, "screenFeatureParityCheck");
  const simplifiedCopyPreviews = latestWorkflowResources(workflowEvents, "simplifiedCopyPreview");
  const governedBundleCanonicalizationProfiles = latestWorkflowResources(workflowEvents, "governedBundleCanonicalizationProfile");
  const governedBundleRecords = latestWorkflowResources(workflowEvents, "governedBundleRecord");
  const releaseConfigManifests = latestWorkflowResources(workflowEvents, "releaseConfigManifest");
  const releaseConfigManifestVerifications = latestWorkflowResources(workflowEvents, "releaseConfigManifestVerification");
  const policyActionKinds = latestWorkflowResources(workflowEvents, "policyActionKind");
  const policyDecisionRecords = latestWorkflowResources(workflowEvents, "policyDecisionRecord");
  const policyDecisionConsumptions = latestWorkflowResources(workflowEvents, "policyDecisionConsumption");
  const implementationPhaseGateBundles = latestWorkflowResources(workflowEvents, "implementationPhaseGateBundle");
  const queueFreshnessPolicies = latestWorkflowResources(workflowEvents, "queueFreshnessPolicy");
  const queueStaleByDelayScans = latestWorkflowResources(workflowEvents, "queueStaleByDelayScan");
  const clientSurfaceIntegrityPolicies = latestWorkflowResources(workflowEvents, "clientSurfaceIntegrityPolicy");
  const clientSurfaceIntegrityChecks = latestWorkflowResources(workflowEvents, "clientSurfaceIntegrityCheck");
  const sensitiveAuditChainEvents = latestWorkflowResources(workflowEvents, "sensitiveAuditChainEvent");
  const sensitiveAuditChainVerifications = latestWorkflowResources(workflowEvents, "sensitiveAuditChainVerification");
  const ratings = [...seedRatings, ...persistedRatings];
  const certificationAttempts = [...seedCertificationAttempts, ...persistedCertificationAttempts];
  const benchmarkExposureEvents = [...seedBenchmarkExposureEvents, ...persistedBenchmarkExposureEvents];
  const sourceStyleAudits = [...postLockSourceStyleAudits, ...persistedSourceStyleAudits];
  const labelSnapshot = createLabelSnapshot(
    options.snapshotId ?? "snapshot-oct-api",
    releaseId,
    ratings,
    critiqueList.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    options.targetLabelVersion ?? "initial_only",
    positionList,
  );
  const report = buildOctoberReleaseReport(releaseId, labelSnapshot, ratings, positionList, critiqueList, certificationAttempts, benchmarkExposureEvents, sourceStyleAudits, {
    rightsReviews,
    releaseFreezes,
    certificationRecords,
    exposureLogs,
    revisionRecords,
    assignmentFlags,
    discussions,
    discussionThreads,
    adjudications,
    adjudicationFinalizations,
    adjudicationMemos,
    verificationRecords,
    ratingChecks,
    labelSnapshots,
    corpusManifests,
    trainingExports,
    exportManifests,
    itemTextVersions,
    ratingContextSnapshots: ratingContextSnapshotArtifacts,
    pairwiseComparisonSnapshots,
    raterReliabilityWeightModels,
    raters,
    workflowAssignments,
    candidateBatches,
    candidateCritiques,
    modelJudgeScores,
    candidateBatchModelJudgeScoreSubmissions,
    candidateReviews,
    candidatePromotions,
    critiqueGenerationRuns,
    generatedCritiqueSubmissions,
    generatedCritiquePromotions,
    generationEvaluationReports,
    promptTemplates,
    parserConfigs,
    modelImprovementRuns,
    evaluationRuns,
    modelEvaluationPredictions,
    calibrationRuns,
    artifactProbeRuns,
    sanityBaselineRuns,
    humanCeilingRuns,
    leaderboards,
    modelFailureAudits,
    goldItems,
    sourceAnchorExamples,
    benchmarkSplitMembers,
    rightsRecords,
    releaseVersions,
    metricConfigs,
    derivedUtilityFormulas,
    releaseGateProfiles,
    primaryRaterAnchorPolicies,
    comparabilityClaims,
    activeLearningSelectionAudits,
    sycophancyProbeRuns,
    obfuscationStressRuns,
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads,
    workflowStateTransitionLogs,
    raterDataConsents,
    volunteerDataConsentProfiles,
    raterDataRestrictionRequests,
    volunteerDataWithdrawalRequests,
    visibilityPolicies,
    ratingWorkflowProfiles,
    uiExperimentPolicies,
    preSubmitAssistPolicies,
    accessibilityConformanceReports,
    volunteerIncentivePolicies,
    raterQualificationRecords,
    languageArtifactAssessments,
    sourceRecognitionEvents,
    modelProviderDataHandlingPolicies,
    taskOutputEligibilityPolicies,
    scoreInputPolicies,
    raterInstructionRenderVersions,
    rubricLintConfigs,
    rubricLintEvents,
    itemIssueReports,
    ratingDraftSessions,
    correctnessClaimWeightWorksheets,
    protectedArtifactRetentionRecords,
    scoreConfidenceAnnotations,
    raterScoreConfidences,
    rationaleEvidenceSpans,
    samePositionScratchpads,
    samePositionBatchReviews,
    externalAssistanceDeclarations,
    blindingPreviewAudits,
    partialTaskOutputs,
    raterPositionClusterExposures,
    spotCheckQaItems,
    adjudicationTriageQueueItems,
    diagnosticDeferralRecords,
    queuePolicySnapshots,
    assignmentSelectionAudits,
    modelInferenceConfigs,
    modelRunEnvironments,
    raterItemConflicts,
    raterTrainingExposureSnapshots,
    releaseErrata,
    scheduleStatusSnapshots,
    publicExamplePracticeSessions,
    raterLearningPlans,
    raterSessions,
    assignmentDeclines,
    interpretationTargetMaps,
    verificationWorkspaceSessions,
    adjudicatorPreReads,
    postLockDiscussionSessions,
    adjudicationReviewSessions,
    calibrationFeedbackEvents,
    governanceApprovalRecords,
    protectedArtifactRevalidations,
    benchmarkSubmissionPolicies,
    benchmarkSubmissions,
    screenFeatureParityChecks,
    simplifiedCopyPreviews,
    governedBundleCanonicalizationProfiles,
    governedBundleRecords,
    releaseConfigManifests,
    releaseConfigManifestVerifications,
    policyActionKinds,
    policyDecisionRecords,
    policyDecisionConsumptions,
    implementationPhaseGateBundles,
    queueFreshnessPolicies,
    queueStaleByDelayScans,
    clientSurfaceIntegrityPolicies,
    clientSurfaceIntegrityChecks,
    sensitiveAuditChainEvents,
    sensitiveAuditChainVerifications,
  });
  return {
    report,
    labelSnapshot,
    ratings,
    certificationAttempts,
    benchmarkExposureEvents,
    sourceStyleAudits,
    positionList,
    critiqueList,
    rightsReviews,
    releaseFreezes,
    certificationRecords,
    exposureLogs,
    revisionRecords,
    assignmentFlags,
    discussions,
    discussionThreads,
    adjudications,
    adjudicationFinalizations,
    adjudicationMemos,
    verificationRecords,
    ratingChecks,
    labelSnapshots,
    corpusManifests,
    trainingExports,
    exportManifests,
    itemTextVersions,
    ratingContextSnapshots: ratingContextSnapshotArtifacts,
    pairwiseComparisonSnapshots,
    raterReliabilityWeightModels,
    raters,
    workflowAssignments,
    candidateBatches,
    candidateCritiques,
    modelJudgeScores,
    candidateBatchModelJudgeScoreSubmissions,
    candidateReviews,
    candidatePromotions,
    critiqueGenerationRuns,
    generatedCritiqueSubmissions,
    generatedCritiquePromotions,
    generationEvaluationReports,
    promptTemplates,
    parserConfigs,
    modelImprovementRuns,
    evaluationRuns,
    modelEvaluationPredictions,
    calibrationRuns,
    artifactProbeRuns,
    sanityBaselineRuns,
    humanCeilingRuns,
    leaderboards,
    modelFailureAudits,
    goldItems,
    sourceAnchorExamples,
    benchmarkSplitMembers,
    rightsRecords,
    releaseVersions,
    metricConfigs,
    derivedUtilityFormulas,
    releaseGateProfiles,
    primaryRaterAnchorPolicies,
    comparabilityClaims,
    activeLearningSelectionAudits,
    sycophancyProbeRuns,
    obfuscationStressRuns,
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads,
    workflowStateTransitionLogs,
    raterDataConsents,
    volunteerDataConsentProfiles,
    raterDataRestrictionRequests,
    volunteerDataWithdrawalRequests,
    visibilityPolicies,
    ratingWorkflowProfiles,
    uiExperimentPolicies,
    preSubmitAssistPolicies,
    accessibilityConformanceReports,
    volunteerIncentivePolicies,
    raterQualificationRecords,
    languageArtifactAssessments,
    sourceRecognitionEvents,
    modelProviderDataHandlingPolicies,
    taskOutputEligibilityPolicies,
    scoreInputPolicies,
    raterInstructionRenderVersions,
    rubricLintConfigs,
    rubricLintEvents,
    itemIssueReports,
    ratingDraftSessions,
    correctnessClaimWeightWorksheets,
    protectedArtifactRetentionRecords,
    scoreConfidenceAnnotations,
    raterScoreConfidences,
    rationaleEvidenceSpans,
    samePositionScratchpads,
    samePositionBatchReviews,
    externalAssistanceDeclarations,
    blindingPreviewAudits,
    partialTaskOutputs,
    raterPositionClusterExposures,
    spotCheckQaItems,
    adjudicationTriageQueueItems,
    diagnosticDeferralRecords,
    queuePolicySnapshots,
    assignmentSelectionAudits,
    modelInferenceConfigs,
    modelRunEnvironments,
    raterItemConflicts,
    raterTrainingExposureSnapshots,
    releaseErrata,
    scheduleStatusSnapshots,
    publicExamplePracticeSessions,
    raterLearningPlans,
    raterSessions,
    assignmentDeclines,
    interpretationTargetMaps,
    verificationWorkspaceSessions,
    adjudicatorPreReads,
    postLockDiscussionSessions,
    adjudicationReviewSessions,
    calibrationFeedbackEvents,
    governanceApprovalRecords,
    protectedArtifactRevalidations,
    benchmarkSubmissionPolicies,
    benchmarkSubmissions,
    screenFeatureParityChecks,
    simplifiedCopyPreviews,
    governedBundleCanonicalizationProfiles,
    governedBundleRecords,
    releaseConfigManifests,
    releaseConfigManifestVerifications,
    policyActionKinds,
    policyDecisionRecords,
    policyDecisionConsumptions,
    implementationPhaseGateBundles,
    queueFreshnessPolicies,
    queueStaleByDelayScans,
    clientSurfaceIntegrityPolicies,
    clientSurfaceIntegrityChecks,
    sensitiveAuditChainEvents,
    sensitiveAuditChainVerifications,
  };
}

function evaluationRunById(id) {
  return [fullRubricEvaluationRun, overallOnlyEvaluationRun].find((run) => run.id === id) ?? null;
}

async function evaluationReportForId(report, id, context) {
  const run = evaluationRunById(id) ?? (await workflowResourceById(context, "evaluationRun", id));
  if (!run) return null;
  const persistedPredictions = await workflowResourcesByField(context, "modelEvaluationPrediction", "evaluationRunId", id);
  const persistedCalibrationRuns = await workflowResourcesByField(context, "calibrationRun", "evaluationRunId", id);
  const persistedFailureAudits = await workflowResourcesByField(context, "modelFailureAudit", "evaluationRunId", id);
  const staticFailureAudits = report.modelFailureAudits.filter((audit) => audit.evaluationRunId === id);
  return {
    evaluationRun: run,
    predictions: [...(run.predictions ?? []), ...persistedPredictions],
    metricEligibility: report.metricEligibility,
    leaderboardReport: report.leaderboardReport.evaluationRunIds?.includes?.(id) ? report.leaderboardReport : null,
    promptTrackSeparation: report.promptTrackSeparation,
    recalibratedEvaluation: run.id === report.recalibratedEvaluation?.evaluationRunId ? report.recalibratedEvaluation : null,
    calibrationRuns: persistedCalibrationRuns,
    modelFailureAudits: [...staticFailureAudits, ...persistedFailureAudits],
    humanScoreDistribution: report.humanScoreDistribution,
    sanityBaselines: report.sanityBaselines,
    modelAssistedLabelOverlap: report.modelAssistedLabelOverlap,
  };
}

function artifactIdMatches(artifact, id) {
  return artifact && typeof artifact === "object" && artifact.id === id;
}

function findArtifactById(value, id) {
  if (!value || typeof value !== "object") return null;
  if (value.id === id) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findArtifactById(item, id);
      if (found) return found;
    }
    return null;
  }
  for (const item of Object.values(value)) {
    const found = findArtifactById(item, id);
    if (found) return found;
  }
  return null;
}

function hasWorkflowField(resource, field) {
  if (field === "textVersions") {
    return Array.isArray(resource.textVersions) && resource.textVersions.some((version) => typeof version?.text === "string" && version.text.trim());
  }
  const value = workflowFieldValue(resource, field);
  return value !== undefined && value !== null && value !== "";
}

function workflowWriteSpec(pattern, eventType, resourceKey, roles, options = {}) {
  return {
    method: options.method ?? "POST",
    pattern,
    eventType,
    resourceKey,
    roles,
    route: routeFromPattern(pattern),
    ...options,
  };
}

function workflowReadSpec(pattern, resourceKey, roles, options = {}) {
  return {
    method: "GET",
    pattern,
    resourceKey,
    roles,
    route: routeFromPattern(pattern),
    ...options,
  };
}

function matchWorkflowEndpoint(method, pathname, specs) {
  for (const spec of specs) {
    if (method !== spec.method) continue;
    const match = pathname.match(spec.pattern);
    if (!match) continue;
    const groups = match.groups ?? {};
    const params = Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, decodeURIComponent(value)]));
    return { spec, params };
  }
  return null;
}

function routeFromPattern(pattern) {
  return String(pattern).replace(/^\/\^\\\//, "/").replace(/\\\/\$$/, "/").replace(/\\\//g, "/");
}

async function nextAssignmentEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!["rater", "graduate", "phd", "expert", "admin"].includes(session.user.role)) {
    sendJson(response, 403, { error: "authorized_rater_role_required" });
    return;
  }
  const assignment = assignments
    .filter((item) => item.exposure === "blind_initial")
    .find((item) => session.user.allowedAssignmentIds?.includes("*") || session.user.allowedAssignmentIds?.includes(item.id));
  if (!assignment) {
    sendJson(response, 404, { error: "no_blind_initial_assignment_available" });
    return;
  }
  const visibleView = createBlindRatingView(assignment, positions, critiques);
  const position = positions.find((item) => item.id === assignment.positionId);
  const critique = critiques.find((item) => item.id === assignment.critiqueId);
  const contextSnapshot = ratingContextSnapshots.find(
    (snapshot) => snapshot.positionId === assignment.positionId && snapshot.visibleCritiqueIds.includes(assignment.critiqueId),
  );
  sendJson(response, 200, {
    assignment: {
      id: assignment.id,
      positionId: assignment.positionId,
      critiqueId: assignment.critiqueId,
      positionTextVersionId: position?.textVersions.at(-1)?.id ?? null,
      critiqueTextVersionId: critique?.textVersions.at(-1)?.id ?? null,
      ratingContextSnapshotId: contextSnapshot?.id ?? null,
      positionText: visibleView.positionText,
      critiqueText: visibleView.critiqueText,
      hiddenBeforeInitialSubmission: visibleView.hiddenMetadata,
    },
    screenState: {
      id: `screen-state-${assignment.id}`,
      assignmentId: assignment.id,
      surface: "rating",
      role: session.user.role,
      payloadSource: "server_derived",
      schemaVersion: "screen-state-lmca-v1",
      outputSchemaVersion: "screen-state-output-lmca-v1",
      policyVersionProvenance: {
        uxSimplificationPolicyId: `ux-simplification-policy-${releaseId}`,
        visibilityPolicyId: `visibility-policy-${releaseId}`,
        workflowProfileId: "ordinary-live-rating-profile",
        assistPolicyId: `pre-submit-assist-${releaseId}`,
        uiExperimentPolicyId: `ui-experiment-policy-${releaseId}`,
        rubricLintConfigId: `rubric-lint-config-${releaseId}`,
      },
      taskStatement: "Rate how well the critique attacks the supplied position.",
      primaryNextAction: "complete_required_scores",
      submissionConsequenceSummary:
        "Submitting locks an initial blind rating for audit and keeps source, peer, gold, model, and protected labels hidden.",
      progressiveDisclosureState: "advanced_issue_panels_collapsed_until_needed",
      createdAt: new Date().toISOString(),
      visibleFieldAllowlist: [
        "assignment.id",
        "assignment.positionTextVersionId",
        "assignment.critiqueTextVersionId",
        "assignment.ratingContextSnapshotId",
        "assignment.positionText",
        "assignment.critiqueText",
        "scoreFields",
        "safeDecline",
        "sourceRecognition",
        "itemIssueReport",
        "verificationControl",
        "appendixFAnchorAccess",
        "preSubmitLint",
        "autosaveResume",
      ],
      enabledActionAllowlist: [
        "score_fields",
        "safe_decline",
        "source_recognition",
        "item_issue_report",
        "verification_control",
        "appendix_f_anchor_access",
        "pre_submit_lint",
        "autosave_resume",
      ],
      requiredControlKeys: [
        "score_fields",
        "safe_decline",
        "source_recognition",
        "item_issue_report",
        "verification_control",
        "appendix_f_anchor_access",
        "pre_submit_lint",
        "autosave_resume",
      ],
      optionalPanelKeys: ["rubric_glossary", "short_item_label", "appendix_f_anchor"],
      requiredOptionalControlMap: {
        requiredControls: [
          "score_fields",
          "safe_decline",
          "source_recognition",
          "item_issue_report",
          "verification_control",
          "appendix_f_anchor_access",
          "pre_submit_lint",
          "autosave_resume",
        ],
        optionalPanels: ["rubric_glossary", "short_item_label", "appendix_f_anchor"],
      },
      protectedGoldBenchmarkDisclosureState: {
        benchmarkMembership: "not_disclosed",
        goldAnswer: "not_disclosed",
        protectedSplitStatus: "not_disclosed",
      },
      hiddenFieldClasses: [
        "source_metadata",
        "admin_tags",
        "benchmark_membership",
        "gold_answers",
        "peer_ratings",
        "model_judge_scores",
        "active_learning_selection_reasons",
        "protected_split_status",
        "rater_performance_metadata",
      ],
      rejectedUnknownKeys: true,
      sanitized: true,
    },
    actor: {
      id: session.user.id,
      role: session.user.role,
    },
  });
}

async function recordRatingEndpoint(request, response, context, eventType, options = {}) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  const actor = session.user;
  if (!["rater", "graduate", "phd", "expert", "admin"].includes(actor.role)) {
    sendJson(response, 403, { error: "authorized_rater_role_required" });
    return;
  }

  const body = await readJsonBody(request);
  const rating = body.rating;
  if (options.parentRatingId && rating?.parentRatingId !== options.parentRatingId) {
    sendJson(response, 400, { error: "revision_path_mismatch", detail: "rating.parentRatingId must match the v1 revision route id" });
    return;
  }
  const validation = validateRatingPayload(rating, eventType);
  if (!validation.ok) {
    sendJson(response, 400, { error: "invalid_rating_payload", detail: validation.detail });
    return;
  }
  const actorValidation = validateRatingActor(rating, actor);
  if (!actorValidation.ok) {
    sendJson(response, 403, { error: "rating_actor_not_authorized", detail: actorValidation.detail });
    return;
  }

  const event = createAuditEvent(eventType, actor, rating, request);
  await context.auditStore.appendRatingEvent(event);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    ratingId: rating.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function recordSourceStyleAuditEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  const actor = session.user;
  if (!["rater", "graduate", "phd", "expert", "admin"].includes(actor.role)) {
    sendJson(response, 403, { error: "authorized_rater_role_required" });
    return;
  }

  const body = await readJsonBody(request);
  const audit = body.audit;
  const ratings = [...seedRatings, ...(await readPersistedRatings(context.auditStore))];
  const validation = validatePostLockSourceStyleAuditPayload(audit, ratings);
  if (!validation.ok) {
    sendJson(response, 400, { error: "invalid_source_style_audit", detail: validation.detail });
    return;
  }
  const actorValidation = validateSourceStyleAuditActor(audit, actor);
  if (!actorValidation.ok) {
    sendJson(response, 403, { error: "source_style_audit_actor_not_authorized", detail: actorValidation.detail });
    return;
  }

  const event = createSourceStyleAuditEvent("post_lock_source_style_audit_submitted", actor, audit, request);
  await context.auditStore.appendSourceStyleAuditEvent(event);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    auditId: audit.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function recordCertificationAttemptEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  const body = await readJsonBody(request);
  const attempt = body.attempt;
  const validation = validateCertificationAttemptPayload(attempt);
  if (!validation.ok) {
    sendJson(response, 400, { error: "invalid_certification_attempt", detail: validation.detail });
    return;
  }
  if (session.user.role !== "admin" && attempt.raterId !== session.user.id) {
    sendJson(response, 403, { error: "certification_actor_not_authorized", detail: `attempt.raterId must match ${session.user.id}` });
    return;
  }
  const scoredAttempt = scoreCertificationAttempt(attempt);
  const event = createCertificationAuditEvent("certification_attempt_submitted", session.user, attempt, scoredAttempt, request);
  await context.auditStore.appendCertificationEvent(event);
  const persistedAttempts = await readPersistedCertificationAttempts(context.auditStore);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    attemptId: attempt.id,
    payloadHash: event.payloadHash,
    scoredAttempt,
    report: buildRaterCertificationReport(attempt.raterId, [...seedCertificationAttempts, ...persistedAttempts]),
  });
}

async function benchmarkFreezeReportEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    await appendBenchmarkExposure(context, createBenchmarkExposureEvent("benchmark_access_denied", null, deniedBenchmarkExposure("freeze_report_read"), request, { allowed: false }));
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (session.user.role !== "admin") {
    await appendBenchmarkExposure(
      context,
      createBenchmarkExposureEvent("benchmark_access_denied", session.user, deniedBenchmarkExposure("freeze_report_read"), request, { allowed: false }),
    );
    sendJson(response, 403, { error: "admin_role_required_for_hidden_benchmark" });
    return;
  }
  const exposure = {
    action: "freeze_report_read",
    artifactId: `hidden-benchmark-freeze-${releaseId}`,
    purpose: "release_freeze",
    accessPhase: "pre_freeze",
  };
  await appendBenchmarkExposure(context, createBenchmarkExposureEvent("benchmark_exposure_recorded", session.user, exposure, request));
  sendJson(response, 200, await buildAdminBenchmarkFreezeReport(context));
}

async function recordBenchmarkExposureEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    await appendBenchmarkExposure(context, createBenchmarkExposureEvent("benchmark_access_denied", null, deniedBenchmarkExposure("manual_exposure_record"), request, { allowed: false }));
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (session.user.role !== "admin") {
    await appendBenchmarkExposure(
      context,
      createBenchmarkExposureEvent("benchmark_access_denied", session.user, deniedBenchmarkExposure("manual_exposure_record"), request, { allowed: false }),
    );
    sendJson(response, 403, { error: "admin_role_required_for_hidden_benchmark" });
    return;
  }
  const body = await readJsonBody(request);
  const exposure = body.exposure;
  const validation = validateBenchmarkExposurePayload(exposure);
  if (!validation.ok) {
    sendJson(response, 400, { error: "invalid_benchmark_exposure", detail: validation.detail });
    return;
  }
  const event = createBenchmarkExposureEvent("benchmark_exposure_recorded", session.user, exposure, request);
  await appendBenchmarkExposure(context, event);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    payloadHash: event.payloadHash,
    report: await buildAdminBenchmarkFreezeReport(context),
  });
}

async function trainingExportEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (session.user.role !== "admin") {
    sendJson(response, 403, { error: "admin_role_required_for_training_export" });
    return;
  }
  sendJson(response, 200, await buildAdminTrainingExport(context));
}

export function validateRatingPayload(rating, eventType) {
  if (!rating || typeof rating !== "object" || Array.isArray(rating)) return invalid("rating object is required");
  const hiddenKeys = findHiddenKeys(rating);
  if (hiddenKeys.length) return invalid(`rater submissions cannot contain hidden metadata keys: ${hiddenKeys.join(", ")}`);
  const rawBenchmarkKeys = findRawBenchmarkContentKeys(rating);
  if (rawBenchmarkKeys.length) return invalid(`rater submissions cannot contain raw protected item content keys: ${rawBenchmarkKeys.join(", ")}`);
  const required = [
    "id",
    "assignmentId",
    "positionId",
    "critiqueId",
    "raterId",
    "kind",
    "rubricVersion",
    "scoreInputPolicyId",
    "positionTextVersionId",
    "critiqueTextVersionId",
    "ratingContextSnapshotId",
    "scores",
    "rawScores",
    "scoreQuantizationPolicy",
    "scoreEntryExplicitnessStatus",
    "scoreMissingFieldValidationStatus",
    "activeSeconds",
    "idleGapSeconds",
    "interruptionCount",
    "submittedAt",
    "lockedAt",
  ];
  const missing = required.filter((field) => rating[field] === undefined || rating[field] === null || rating[field] === "");
  if (missing.length) return invalid(`missing required fields: ${missing.join(", ")}`);
  if (eventType === "blind_initial_submitted" && rating.kind !== "blind_initial") return invalid("blind rating endpoint only accepts kind=blind_initial");
  if (eventType === "revision_submitted" && (rating.kind !== "revision" || !rating.parentRatingId)) {
    return invalid("revision endpoint requires kind=revision and parentRatingId");
  }
  if (!assignments.some((assignment) => assignment.id === rating.assignmentId)) return invalid(`unknown assignmentId: ${rating.assignmentId}`);
  if (!positions.some((position) => position.id === rating.positionId)) return invalid(`unknown positionId: ${rating.positionId}`);
  if (!critiques.some((critique) => critique.id === rating.critiqueId && critique.positionId === rating.positionId)) {
    return invalid(`critiqueId ${rating.critiqueId} does not belong to positionId ${rating.positionId}`);
  }
  const contextSnapshot = ratingContextSnapshots.find((snapshot) => snapshot.id === rating.ratingContextSnapshotId);
  if (!contextSnapshot) return invalid(`unknown ratingContextSnapshotId: ${rating.ratingContextSnapshotId}`);
  if (contextSnapshot.positionId !== rating.positionId) return invalid("ratingContextSnapshotId must belong to the rated position");
  if (!contextSnapshot.visibleCritiqueIds.includes(rating.critiqueId)) return invalid("ratingContextSnapshotId must include the rated critique");
  const scoreValidation = validateRatingScoreObject(rating.scores, "scores");
  if (!scoreValidation.ok) return scoreValidation;
  const rawScoreValidation = validateRatingScoreObject(rating.rawScores, "rawScores");
  if (!rawScoreValidation.ok) return rawScoreValidation;
  if (rating.displayedScores !== undefined) {
    const displayedScoreValidation = validateRatingScoreObject(rating.displayedScores, "displayedScores");
    if (!displayedScoreValidation.ok) return displayedScoreValidation;
  }
  if (!String(rating.scoreInputPolicyId ?? "").trim()) return invalid("scoreInputPolicyId is required");
  if (!String(rating.scoreQuantizationPolicy ?? "").trim()) return invalid("scoreQuantizationPolicy is required");
  if (!ratingScoreEntryExplicitnessStatuses.has(rating.scoreEntryExplicitnessStatus)) {
    return invalid(`unsupported scoreEntryExplicitnessStatus: ${rating.scoreEntryExplicitnessStatus}`);
  }
  if (!ratingMissingFieldValidationStatuses.has(rating.scoreMissingFieldValidationStatus)) {
    return invalid(`unsupported scoreMissingFieldValidationStatus: ${rating.scoreMissingFieldValidationStatus}`);
  }
  if (rating.scores.clarity >= 0.5 && rating.scoreMissingFieldValidationStatus !== "passed_no_missing_required_fields") {
    return invalid("full-rubric ratings must pass missing-field validation");
  }
  if (rating.scores.clarity < 0.5 && rating.scoreEntryExplicitnessStatus !== "low_clarity_branch_explicit") {
    return invalid("low-clarity ratings must declare low_clarity_branch_explicit score entry");
  }
  if (!Array.isArray(rating.provisionalDimensions)) return invalid("provisionalDimensions must be an array");
  if (rating.flags !== undefined) {
    if (!rating.flags || typeof rating.flags !== "object" || Array.isArray(rating.flags)) return invalid("flags must be an object when provided");
    const unknownFlags = Object.keys(rating.flags).filter((flag) => !allowedRatingFlagKeys.has(flag));
    if (unknownFlags.length) return invalid(`unsupported rating flags: ${unknownFlags.join(", ")}`);
    const nonBooleanFlags = Object.entries(rating.flags)
      .filter(([, value]) => typeof value !== "boolean")
      .map(([flag]) => flag);
    if (nonBooleanFlags.length) return invalid(`rating flags must be boolean: ${nonBooleanFlags.join(", ")}`);
  }
  if (!Number.isFinite(rating.activeSeconds) || rating.activeSeconds <= 0) return invalid("activeSeconds must be a positive number");
  if (!Number.isFinite(rating.idleGapSeconds) || rating.idleGapSeconds < 0) return invalid("idleGapSeconds must be a non-negative number");
  if (!Number.isInteger(rating.interruptionCount) || rating.interruptionCount < 0) return invalid("interruptionCount must be a non-negative integer");
  if (rating.correctnessVerificationStatus !== undefined && !ratingVerificationStatuses.has(rating.correctnessVerificationStatus)) {
    return invalid(`unsupported correctnessVerificationStatus: ${rating.correctnessVerificationStatus}`);
  }
  if (rating.correctnessVerificationNote !== undefined && (typeof rating.correctnessVerificationNote !== "string" || rating.correctnessVerificationNote.length > 500)) {
    return invalid("correctnessVerificationNote must be a short string");
  }
  for (const [camelField, snakeField] of ratingEvidenceReferenceFields) {
    const providedField = rating[camelField] !== undefined ? camelField : rating[snakeField] !== undefined ? snakeField : null;
    if (!providedField) continue;
    const value = rating[providedField];
    if (!Array.isArray(value)) return invalid(`${providedField} must be an array`);
    if (value.some((item) => typeof item !== "string" || !item.trim())) return invalid(`${providedField} must contain only non-empty string refs`);
  }
  const rationaleEvidenceSpanIds = rating.rationaleEvidenceSpanIds ?? rating.rationale_evidence_span_ids ?? [];
  const hasAnySpanRefs = ratingEvidenceReferenceFields
    .filter(([camelField]) => camelField !== "rationaleEvidenceSpanIds")
    .some(([camelField, snakeField]) => (rating[camelField] ?? rating[snakeField] ?? []).length > 0);
  if (hasAnySpanRefs && rationaleEvidenceSpanIds.length === 0) {
    return invalid("rationaleEvidenceSpanIds must be provided when span reference fields are submitted");
  }
  const lockedBeforePeerExposure = rating.lockedBeforePeerExposure ?? rating.locked_before_peer_exposure;
  if (lockedBeforePeerExposure !== undefined && lockedBeforePeerExposure !== true) return invalid("lockedBeforePeerExposure must be true when provided");
  const sourceTagVisibilityState = rating.sourceTagVisibilityState ?? rating.source_tag_visibility_state;
  if (sourceTagVisibilityState !== undefined && !lockedInitialSourceTagVisibilityStates.has(sourceTagVisibilityState)) {
    return invalid(`unsupported sourceTagVisibilityState: ${sourceTagVisibilityState}`);
  }
  return { ok: true };
}

function validateRatingScoreObject(scores, fieldName) {
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) return invalid(`${fieldName} object is required`);
  if (!isValidScore(scores.clarity) || !isValidScore(scores.overall)) return invalid(`${fieldName}.clarity and ${fieldName}.overall must be finite scores in [0, 1]`);
  if (scores.clarity >= 0.5) {
    const badFields = RUBRIC_DIMENSIONS.filter((dimension) => !isValidScore(scores[dimension]));
    if (badFields.length) return invalid(`full-rubric rating requires valid ${fieldName} for: ${badFields.join(", ")}`);
  }
  return { ok: true };
}

export function validatePostLockSourceStyleAuditPayload(audit, ratings = seedRatings) {
  if (!audit || typeof audit !== "object" || Array.isArray(audit)) return invalid("audit object is required");
  const forbidden = findHiddenKeys(audit).concat(findRawBenchmarkContentKeys(audit));
  if (forbidden.length) return invalid(`source/style audits cannot contain hidden/raw metadata keys: ${forbidden.join(", ")}`);
  const required = [
    "id",
    "ratingId",
    "assignmentId",
    "positionId",
    "critiqueId",
    "raterId",
    "collectedAt",
    "sourceGuess",
    "authorshipGuess",
    "styleGuess",
    "styleGuessConfidence",
    "shownBeforeInitialLock",
    "usedForScoring",
  ];
  const missing = required.filter((field) => audit[field] === undefined || audit[field] === null || audit[field] === "");
  if (missing.length) return invalid(`missing required fields: ${missing.join(", ")}`);
  if (!sourceStyleAuditSourceGuesses.has(audit.sourceGuess)) return invalid(`unsupported sourceGuess: ${audit.sourceGuess}`);
  if (!sourceStyleAuditAuthorshipGuesses.has(audit.authorshipGuess)) return invalid(`unsupported authorshipGuess: ${audit.authorshipGuess}`);
  if (typeof audit.styleGuess !== "string" || audit.styleGuess.length > 80) return invalid("styleGuess must be a short string");
  if (!Number.isFinite(audit.styleGuessConfidence) || audit.styleGuessConfidence < 0 || audit.styleGuessConfidence > 1) {
    return invalid("styleGuessConfidence must be a finite score in [0, 1]");
  }
  if (audit.collectionPhase !== undefined && audit.collectionPhase !== "post_initial_lock") return invalid("collectionPhase must be post_initial_lock");
  if (audit.shownBeforeInitialLock !== false) return invalid("source/style audit controls must not be shown before initial lock");
  if (audit.usedForScoring !== false) return invalid("source/style audit guesses are diagnostic only and cannot be used for scoring");
  const rating = ratings.find((item) => item.id === audit.ratingId);
  if (!rating) return invalid(`unknown ratingId: ${audit.ratingId}`);
  if (rating.kind !== "blind_initial") return invalid("source/style audits must attach to a locked blind_initial rating");
  if (rating.assignmentId !== audit.assignmentId) return invalid("audit assignmentId must match the locked rating");
  if (rating.positionId !== audit.positionId) return invalid("audit positionId must match the locked rating");
  if (rating.critiqueId !== audit.critiqueId) return invalid("audit critiqueId must match the locked rating");
  if (rating.raterId !== audit.raterId) return invalid("audit raterId must match the locked rating");
  const collectedAt = Date.parse(audit.collectedAt);
  const lockedAt = Date.parse(rating.lockedAt);
  if (!Number.isFinite(collectedAt) || !Number.isFinite(lockedAt)) return invalid("collectedAt and rating.lockedAt must be valid timestamps");
  if (collectedAt < lockedAt) return invalid("source/style guesses can only be collected after the initial rating lock");
  return { ok: true };
}

export function validateCertificationAttemptPayload(attempt) {
  if (!attempt || typeof attempt !== "object" || Array.isArray(attempt)) return invalid("attempt object is required");
  const required = [
    "id",
    "raterId",
    "packId",
    "rubricVersion",
    "submittedAt",
    "goldItemsCompleted",
    "duplicateItemsCompleted",
    "hardAmbiguityItemsCompleted",
    "duplicateConsistencyMeanAbsDiff",
    "hardAmbiguityReviewPass",
    "itemResults",
  ];
  const missing = required.filter((field) => attempt[field] === undefined || attempt[field] === null || attempt[field] === "");
  if (missing.length) return invalid(`missing required fields: ${missing.join(", ")}`);
  if (!Array.isArray(attempt.itemResults) || attempt.itemResults.length === 0) return invalid("itemResults must be a non-empty array");
  if (typeof attempt.hardAmbiguityReviewPass !== "boolean") return invalid("hardAmbiguityReviewPass must be boolean");
  if (!isValidScore(attempt.duplicateConsistencyMeanAbsDiff)) return invalid("duplicateConsistencyMeanAbsDiff must be in [0, 1]");
  for (const result of attempt.itemResults) {
    if (!result.itemId || !result.dimensionErrors) return invalid("each itemResult needs itemId and dimensionErrors");
    const invalidDimensions = RUBRIC_DIMENSIONS.filter((dimension) => !isValidScore(result.dimensionErrors[dimension]));
    if (invalidDimensions.length) return invalid(`dimensionErrors must include scores in [0, 1] for: ${invalidDimensions.join(", ")}`);
  }
  try {
    scoreCertificationAttempt(attempt);
  } catch (error) {
    return invalid(error instanceof Error ? error.message : String(error));
  }
  return { ok: true };
}

export function validateBenchmarkExposurePayload(exposure) {
  if (!exposure || typeof exposure !== "object" || Array.isArray(exposure)) return invalid("exposure object is required");
  const forbidden = findHiddenKeys(exposure).concat(findRawBenchmarkContentKeys(exposure));
  if (forbidden.length) return invalid(`benchmark exposure logs cannot include hidden/raw content keys: ${forbidden.join(", ")}`);
  const required = ["action", "artifactId", "purpose"];
  const missing = required.filter((field) => exposure[field] === undefined || exposure[field] === null || exposure[field] === "");
  if (missing.length) return invalid(`missing required fields: ${missing.join(", ")}`);
  const allowedActions = new Set(["freeze_report_read", "manual_exposure_record", "membership_view", "artifact_probe_run", "rights_review", "post_freeze_access_review"]);
  if (!allowedActions.has(exposure.action)) return invalid(`unsupported benchmark action: ${exposure.action}`);
  const allowedPurposes = new Set(["release_freeze", "rights_review", "artifact_balance_audit", "authorized_artifact_probe", "access_audit_review", "incident_response"]);
  if (!allowedPurposes.has(exposure.purpose)) return invalid(`unsupported benchmark purpose: ${exposure.purpose}`);
  if (typeof exposure.artifactId !== "string" || !exposure.artifactId.startsWith("hidden-benchmark")) {
    return invalid("artifactId must reference a hidden-benchmark artifact without raw item contents");
  }
  if (exposure.probeFamilies !== undefined) {
    if (!Array.isArray(exposure.probeFamilies) || exposure.probeFamilies.some((item) => typeof item !== "string")) {
      return invalid("probeFamilies must be an array of strings");
    }
  }
  return { ok: true };
}

export function validateWorkflowStateTransitionPayload(transition, actor) {
  if (!transition || typeof transition !== "object" || Array.isArray(transition)) return invalid("workflow state transition object is required");
  const id = transition.id ?? transition.transitionId ?? transition.transition_id;
  const entityType = normalizeWorkflowStateEntityType(transition.entityType ?? transition.entity_type);
  const entityId = transition.entityId ?? transition.entity_id;
  const priorState = transition.priorState ?? transition.prior_state;
  const requestedNextState = transition.requestedNextState ?? transition.requested_next_state;
  const acceptedNextState = transition.acceptedNextState ?? transition.accepted_next_state ?? requestedNextState;
  const guardChecks = normalizeWorkflowGuardChecks(transition.guardChecks ?? transition.guard_checks ?? transition.guardChecksEvaluated);
  const failedGuardReasons = normalizeWorkflowStringList(transition.failedGuardReasons ?? transition.failed_guard_reasons);
  const actorId = transition.actorId ?? transition.transitionActorId ?? transition.transition_actor_id ?? actor.id;
  const actorRole = transition.actorRole ?? transition.transitionActorRole ?? transition.transition_actor_role ?? actor.role;
  const missing = [
    ["id", id],
    ["entityType", entityType],
    ["entityId", entityId],
    ["priorState", priorState],
    ["requestedNextState", requestedNextState],
    ["actorId", actorId],
    ["actorRole", actorRole],
  ].filter(([, value]) => value === undefined || value === null || value === "");
  if (missing.length) return invalid(`missing required fields: ${missing.map(([field]) => field).join(", ")}`);
  const rules = workflowStateMachineRules[entityType];
  if (!rules) return invalid(`unsupported workflow state entityType: ${entityType}`);
  if (!guardChecks.length) return invalid("guardChecks must include at least one evaluated backend guard");
  if (findHiddenKeys(transition).length || findRawBenchmarkContentKeys(transition).length) {
    return invalid("workflow state transitions cannot include hidden source, benchmark, peer, model, or gold payload fields");
  }
  if (["rater", "graduate", "phd"].includes(actor.role)) {
    const assignmentId = transition.assignmentId ?? transition.assignment_id ?? (entityType === "assignment" ? entityId : null);
    if (assignmentId && !actor.allowedAssignmentIds?.includes("*") && !actor.allowedAssignmentIds?.includes(assignmentId)) {
      return { ok: false, statusCode: 403, error: "workflow_actor_not_authorized", detail: `actor ${actor.id} is not assigned to ${assignmentId}` };
    }
  }
  const allowed = rules.some(([prior, next]) => prior === priorState && next === requestedNextState);
  const normalized = {
    id,
    entityType,
    entityId,
    assignmentId: transition.assignmentId ?? transition.assignment_id ?? null,
    priorState,
    requestedNextState,
    acceptedNextState: allowed && !failedGuardReasons.length ? acceptedNextState : priorState,
    actorId,
    actorRole,
    guardChecks,
    failedGuardReasons: allowed ? failedGuardReasons : [...failedGuardReasons, `transition_not_allowed:${priorState}->${requestedNextState}`],
    lockFreezeArtifactIds: normalizeWorkflowStringList(transition.lockFreezeArtifactIds ?? transition.lock_freeze_artifact_ids),
    sourceTagProtectedVisibilityState: transition.sourceTagProtectedVisibilityState ?? transition.source_tag_protected_visibility_state ?? "source_tag_protected_visibility_preserved",
    timestamp: transition.timestamp ?? transition.createdAt ?? transition.created_at ?? new Date().toISOString(),
  };
  if (!allowed) {
    return {
      ok: false,
      statusCode: 409,
      error: "workflow_state_transition_not_allowed",
      detail: `${entityType} cannot transition ${priorState} -> ${requestedNextState}`,
      resource: normalized,
    };
  }
  if (failedGuardReasons.length) {
    return {
      ok: false,
      statusCode: 409,
      error: "workflow_state_transition_guard_failed",
      detail: failedGuardReasons.join(", "),
      resource: normalized,
    };
  }
  if (acceptedNextState !== requestedNextState) return invalid("acceptedNextState must match requestedNextState for accepted transitions");
  return { ok: true, resource: normalized };
}

export function validateRaterDataConsentPayload(consent, actor) {
  if (!consent || typeof consent !== "object" || Array.isArray(consent)) return invalid("rater data consent object is required");
  const id = consent.id ?? consent.consentId;
  const raterId = consent.raterId ?? actor.id;
  const categories = normalizeWorkflowStringList(consent.dataCategoriesCovered ?? consent.consentedCategories ?? consent.dataCategories);
  const useScopes = normalizeWorkflowStringList(consent.useScopesAcknowledged ?? consent.useScopes);
  const missing = [
    ["id", id],
    ["noticeVersion", consent.noticeVersion],
  ].filter(([, value]) => value === undefined || value === null || value === "");
  if (missing.length) return invalid(`missing required fields: ${missing.map(([field]) => field).join(", ")}`);
  const actorCheck = validateParticipantRaterId(raterId, actor);
  if (!actorCheck.ok) return actorCheck;
  if (findHiddenKeys(consent).length || findRawBenchmarkContentKeys(consent).length) return invalid("rater data consent cannot include hidden or raw protected item fields");
  const missingCategories = raterDataGovernanceCategories.filter((category) => !categories.includes(category));
  if (missingCategories.length) return invalid(`dataCategoriesCovered missing: ${missingCategories.join(", ")}`);
  const missingUseScopes = raterDataUseScopes.filter((scope) => !useScopes.includes(scope));
  if (missingUseScopes.length) return invalid(`useScopesAcknowledged missing: ${missingUseScopes.join(", ")}`);
  if (consent.publicArtifactsDeidentifiedByDefault !== true) return invalid("publicArtifactsDeidentifiedByDefault must be true");
  if (consent.privateLearningDataExcludedFromReleaseAndTraining !== true) return invalid("privateLearningDataExcludedFromReleaseAndTraining must be true");
  if (consent.dataProfileVisible !== true) return invalid("dataProfileVisible must be true");
  const resource = {
    id,
    raterId,
    noticeVersion: consent.noticeVersion,
    dataCategoriesCovered: categories,
    useScopesAcknowledged: useScopes,
    dataProfileVisible: true,
    publicArtifactsDeidentifiedByDefault: true,
    identifiableAccessRestriction: consent.identifiableAccessRestriction ?? "approved_operational_or_research_roles_only",
    privateLearningDataExcludedFromReleaseAndTraining: true,
    consentedAt: consent.consentedAt ?? new Date().toISOString(),
  };
  return { ok: true, resource };
}

export function validateRaterDataRestrictionPayload(request, actor) {
  if (!request || typeof request !== "object" || Array.isArray(request)) return invalid("rater data restriction request object is required");
  const id = request.id ?? request.restrictionRequestId;
  const raterId = request.raterId ?? actor.id;
  const affectedDataCategories = normalizeWorkflowStringList(request.affectedDataCategories);
  const missing = [
    ["id", id],
    ["requestType", request.requestType],
  ].filter(([, value]) => value === undefined || value === null || value === "");
  if (missing.length) return invalid(`missing required fields: ${missing.map(([field]) => field).join(", ")}`);
  const actorCheck = validateParticipantRaterId(raterId, actor);
  if (!actorCheck.ok) return actorCheck;
  if (!affectedDataCategories.length) return invalid("affectedDataCategories must be non-empty");
  if (findHiddenKeys(request).length || findRawBenchmarkContentKeys(request).length) return invalid("rater data restriction request cannot include hidden or raw protected item fields");
  return {
    ok: true,
    resource: {
      id,
      raterId,
      requestType: request.requestType,
      affectedDataCategories,
      actionTaken: request.actionTaken ?? "pending_review",
      requesterNotificationStatus: request.requesterNotificationStatus ?? "received",
      timestamp: request.timestamp ?? new Date().toISOString(),
    },
  };
}

export function validateVolunteerDataWithdrawalPayload(request, actor) {
  if (!request || typeof request !== "object" || Array.isArray(request)) return invalid("volunteer data withdrawal request object is required");
  const id = request.id ?? request.withdrawalRequestId;
  const raterId = request.raterId ?? actor.id;
  const requestType = request.requestType;
  const affectedDataCategories = normalizeWorkflowStringList(request.affectedDataCategories);
  const missing = [
    ["id", id],
    ["requestType", requestType],
  ].filter(([, value]) => value === undefined || value === null || value === "");
  if (missing.length) return invalid(`missing required fields: ${missing.map(([field]) => field).join(", ")}`);
  const actorCheck = validateParticipantRaterId(raterId, actor);
  if (!actorCheck.ok) return actorCheck;
  if (!volunteerWithdrawalRequestTypes.has(requestType)) return invalid(`unsupported withdrawal requestType: ${requestType}`);
  if (!affectedDataCategories.length) return invalid("affectedDataCategories must be non-empty");
  if (findHiddenKeys(request).length || findRawBenchmarkContentKeys(request).length) return invalid("volunteer withdrawal request cannot include hidden or raw protected item fields");
  return {
    ok: true,
    resource: {
      id,
      raterId,
      requestType,
      affectedDataCategories,
      actionTaken: request.actionTaken ?? "pending_review",
      futureAssignmentStop: request.futureAssignmentStop === true || requestType === "future_assignment_stop",
      identifiableTelemetryRestricted: request.identifiableTelemetryRestricted !== false,
      publicAttributionRemoved: request.publicAttributionRemoved !== false,
      privateLearningDashboardDeleted: request.privateLearningDashboardDeleted !== false,
      futureTrainingExportExcluded: request.futureTrainingExportExcluded !== false,
      frozenSnapshotImpact: request.frozenSnapshotImpact ?? "already_frozen_deidentified_label_snapshots_preserved",
      denominatorChangeArtifactId: request.denominatorChangeArtifactId ?? null,
      requesterNotificationStatus: request.requesterNotificationStatus ?? "received",
      timestamp: request.timestamp ?? new Date().toISOString(),
    },
  };
}

function validateParticipantRaterId(raterId, actor) {
  if (!raterId) return invalid("raterId is required");
  if (actor.role !== "admin" && raterId !== actor.id) {
    return { ok: false, statusCode: 403, error: "participant_data_actor_not_authorized", detail: `raterId must match authenticated actor ${actor.id}` };
  }
  return { ok: true };
}

export function validateWorkflowPayload(resource, actor, spec, params = {}) {
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return invalid(`${spec.resourceKey} object is required`);
  const normalized = structuredClone(resource);
  if (spec.pathParamField) {
    const pathValue = params.id;
    if (!pathValue) return invalid(`${spec.pathParamField} route parameter is required`);
    if (normalized[spec.pathParamField] !== undefined && normalized[spec.pathParamField] !== pathValue) {
      return invalid(`${spec.resourceKey}.${spec.pathParamField} must match route id ${pathValue}`);
    }
    normalized[spec.pathParamField] = pathValue;
  }
  if (typeof normalized.id !== "string" || normalized.id.trim() === "") return invalid(`${spec.resourceKey}.id is required`);
  const requiredFields = spec.requiredFields ?? ["id"];
  const missing = requiredFields.filter((field) => normalized[field] === undefined || normalized[field] === null || normalized[field] === "");
  if (missing.length) return invalid(`missing required fields: ${missing.join(", ")}`);
  const missingNested = (spec.requiredNestedFields ?? []).filter((fieldPath) => !hasWorkflowField(normalized, fieldPath));
  if (missingNested.length) return invalid(`missing required fields: ${missingNested.join(", ")}`);
  const missingArrays = (spec.requiredNonEmptyArrayFields ?? []).filter((fieldPath) => {
    const value = workflowFieldValue(normalized, fieldPath);
    return !Array.isArray(value) || value.length === 0;
  });
  if (missingArrays.length) return invalid(`missing required non-empty arrays: ${missingArrays.join(", ")}`);
  const missingObjects = (spec.requiredObjectFields ?? []).filter((fieldPath) => {
    const value = workflowFieldValue(normalized, fieldPath);
    return !value || typeof value !== "object" || Array.isArray(value) || !Object.keys(value).length;
  });
  if (missingObjects.length) return invalid(`missing required non-empty objects: ${missingObjects.join(", ")}`);
  for (const [fieldPath, requiredValues] of Object.entries(spec.requiredArrayIncludes ?? {})) {
    const value = workflowFieldValue(normalized, fieldPath);
    const missingValues = requiredValues.filter((item) => !Array.isArray(value) || !value.includes(item));
    if (missingValues.length) return invalid(`missing required array values in ${fieldPath}: ${missingValues.join(", ")}`);
  }
  for (const rule of spec.requiredArrayIncludesByFieldValue ?? []) {
    const discriminator = workflowFieldValue(normalized, rule.field);
    const requiredValues = rule.values?.[discriminator] ?? [];
    const value = workflowFieldValue(normalized, rule.arrayField);
    const missingValues = requiredValues.filter((item) => !Array.isArray(value) || !value.includes(item));
    if (missingValues.length) {
      return invalid(`missing required array values in ${rule.arrayField} for ${rule.field}=${JSON.stringify(discriminator)}: ${missingValues.join(", ")}`);
    }
  }
  for (const [fieldPath, requiredKeys] of Object.entries(spec.requiredObjectKeys ?? {})) {
    const value = workflowFieldValue(normalized, fieldPath);
    const missingKeys = requiredKeys.filter((key) => !value || typeof value !== "object" || Array.isArray(value) || !Object.hasOwn(value, key));
    if (missingKeys.length) return invalid(`missing required object keys in ${fieldPath}: ${missingKeys.join(", ")}`);
  }
  for (const rule of spec.requiredObjectKeysByFieldValue ?? []) {
    const discriminator = workflowFieldValue(normalized, rule.field);
    const requiredKeys = rule.values?.[discriminator] ?? [];
    const value = workflowFieldValue(normalized, rule.objectField);
    const missingKeys = requiredKeys.filter((key) => !value || typeof value !== "object" || Array.isArray(value) || !Object.hasOwn(value, key));
    if (missingKeys.length) {
      return invalid(`missing required object keys in ${rule.objectField} for ${rule.field}=${JSON.stringify(discriminator)}: ${missingKeys.join(", ")}`);
    }
  }
  for (const [fieldPath, forbiddenFragments] of Object.entries(spec.forbiddenArrayValueFragments ?? {})) {
    const value = workflowFieldValue(normalized, fieldPath);
    const normalizedFragments = forbiddenFragments.map((fragment) => normalizeFieldFragment(fragment));
    const forbiddenValues = Array.isArray(value)
      ? value.filter((item) => {
          const normalizedItem = normalizeFieldFragment(item);
          return normalizedFragments.some((fragment) => normalizedItem.includes(fragment));
        })
      : [];
    if (forbiddenValues.length) return invalid(`forbidden array values in ${fieldPath}: ${forbiddenValues.join(", ")}`);
  }
  for (const fieldSet of spec.requiredAnyFields ?? []) {
    if (!fieldSet.some((field) => hasWorkflowField(normalized, field))) {
      return invalid(`one of these fields is required: ${fieldSet.join(", ")}`);
    }
  }
  for (const fieldSets of spec.requiredAnyFieldSets ?? []) {
    if (!fieldSets.some((fieldSet) => fieldSet.every((field) => hasWorkflowField(normalized, field)))) {
      return invalid(`one complete field set is required: ${fieldSets.map((fieldSet) => fieldSet.join("+")).join(" or ")}`);
    }
  }
  const invalidNumbers = (spec.requiredFiniteNumberFields ?? []).filter((fieldPath) => !Number.isFinite(workflowFieldValue(normalized, fieldPath)));
  if (invalidNumbers.length) return invalid(`required numeric fields must be finite numbers: ${invalidNumbers.join(", ")}`);
  for (const [fieldPath, allowedValues] of Object.entries(spec.allowedValues ?? {})) {
    const observedValue = workflowFieldValue(normalized, fieldPath);
    if (!allowedValues.includes(observedValue)) {
      return invalid(`${spec.resourceKey}.${fieldPath} must be one of: ${allowedValues.join(", ")}`);
    }
  }
  for (const [fieldPath, expectedValue] of Object.entries(spec.requiredExactFields ?? {})) {
    const observedValue = workflowFieldValue(normalized, fieldPath);
    if (observedValue !== expectedValue) return invalid(`${spec.resourceKey}.${fieldPath} must equal ${JSON.stringify(expectedValue)}`);
  }
  for (const conditional of spec.requiredWhen ?? []) {
    const observedValue = workflowFieldValue(normalized, conditional.field);
    const matches = Object.hasOwn(conditional, "equals")
      ? observedValue === conditional.equals
      : conditional.values?.includes(observedValue);
    if (!matches) continue;
    const conditionalMissing = (conditional.requiredFields ?? []).filter((fieldPath) => !hasWorkflowField(normalized, fieldPath));
    if (conditionalMissing.length) return invalid(`missing required fields when ${conditional.field}=${JSON.stringify(observedValue)}: ${conditionalMissing.join(", ")}`);
    const conditionalMissingArrays = (conditional.requiredNonEmptyArrayFields ?? []).filter((fieldPath) => {
      const value = workflowFieldValue(normalized, fieldPath);
      return !Array.isArray(value) || value.length === 0;
    });
    if (conditionalMissingArrays.length) {
      return invalid(`missing required non-empty arrays when ${conditional.field}=${JSON.stringify(observedValue)}: ${conditionalMissingArrays.join(", ")}`);
    }
    for (const [fieldPath, expectedValue] of Object.entries(conditional.requiredExactFields ?? {})) {
      const conditionalObserved = workflowFieldValue(normalized, fieldPath);
      if (conditionalObserved !== expectedValue) {
        return invalid(`${spec.resourceKey}.${fieldPath} must equal ${JSON.stringify(expectedValue)} when ${conditional.field}=${JSON.stringify(observedValue)}`);
      }
    }
  }

  const hiddenKeys = findHiddenKeys(normalized);
  if (spec.rejectHiddenMetadata && hiddenKeys.length) return invalid(`${spec.resourceKey} cannot include hidden metadata keys: ${hiddenKeys.join(", ")}`);
  if (!spec.allowHiddenMetadata && actor.role !== "admin" && hiddenKeys.length) {
    return invalid(`${spec.resourceKey} cannot include hidden metadata keys for non-admin actors: ${hiddenKeys.join(", ")}`);
  }

  const rawBenchmarkKeys = findRawBenchmarkContentKeys(normalized);
  if (spec.rejectRawBenchmarkContent && rawBenchmarkKeys.length) {
    return invalid(`${spec.resourceKey} cannot include raw benchmark content keys: ${rawBenchmarkKeys.join(", ")}`);
  }

  if (spec.requireActorField && actor.role !== "admin" && normalized[spec.requireActorField] !== actor.id) {
    return { ok: false, statusCode: 403, error: "workflow_actor_not_authorized", detail: `${spec.resourceKey}.${spec.requireActorField} must match ${actor.id}` };
  }
  if (spec.requireAssignmentClaimField && !actor.allowedAssignmentIds?.includes("*") && !actor.allowedAssignmentIds?.includes(normalized[spec.requireAssignmentClaimField])) {
    return {
      ok: false,
      statusCode: 403,
      error: "workflow_actor_not_authorized",
      detail: `actor ${actor.id} is not assigned to ${normalized[spec.requireAssignmentClaimField]}`,
    };
  }

  return { ok: true, resource: normalized };
}

function workflowFieldValue(resource, fieldPath) {
  return String(fieldPath)
    .split(".")
    .reduce((current, segment) => {
      if (!current || typeof current !== "object") return undefined;
      return current[segment];
    }, resource);
}

function normalizeFieldFragment(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function validateRatingActor(rating, actor) {
  if (!actor || typeof actor !== "object") return invalid("actor session is required");
  if (actor.role !== "admin" && rating.raterId !== actor.id) return invalid(`rating.raterId must match the authenticated actor ${actor.id}`);
  if (!actor.allowedAssignmentIds?.includes("*") && !actor.allowedAssignmentIds?.includes(rating.assignmentId)) {
    return invalid(`actor ${actor.id} is not assigned to ${rating.assignmentId}`);
  }
  return { ok: true };
}

export function validateSourceStyleAuditActor(audit, actor) {
  if (!actor || typeof actor !== "object") return invalid("actor session is required");
  if (!["rater", "graduate", "phd", "expert", "admin"].includes(actor.role)) return invalid("authorized rater role is required");
  if (actor.role !== "admin" && audit.raterId !== actor.id) return invalid(`audit.raterId must match the authenticated actor ${actor.id}`);
  if (!actor.allowedAssignmentIds?.includes("*") && !actor.allowedAssignmentIds?.includes(audit.assignmentId)) {
    return invalid(`actor ${actor.id} is not assigned to ${audit.assignmentId}`);
  }
  return { ok: true };
}

export function createAuditEvent(type, actor, rating, request) {
  const normalizedActor = typeof actor === "string" ? { id: rating.raterId, role: actor } : actor;
  const receivedAt = new Date().toISOString();
  const payloadHash = `sha256:${sha256(canonicalJson(rating))}`;
  return {
    id: randomUUID(),
    type,
    receivedAt,
    actorRole: normalizedActor.role,
    actorHash: `sha256:${sha256(String(normalizedActor.id))}`,
    payloadHash,
    payload: { rating },
    accessAudit: {
      blindInitialMetadataWithheld: type === "blind_initial_submitted",
      sourceMetadataAcceptedFromRater: false,
      peerRatingsAcceptedFromRater: false,
      remoteAddressHash: `sha256:${sha256(request.socket.remoteAddress ?? "unknown")}`,
    },
  };
}

export function createSourceStyleAuditEvent(type, actor, audit, request) {
  const receivedAt = new Date().toISOString();
  const normalizedAudit = {
    id: audit.id,
    ratingId: audit.ratingId,
    assignmentId: audit.assignmentId,
    positionId: audit.positionId,
    critiqueId: audit.critiqueId,
    raterId: audit.raterId,
    collectedAt: audit.collectedAt,
    sourceGuess: audit.sourceGuess,
    authorshipGuess: audit.authorshipGuess,
    styleGuess: audit.styleGuess,
    styleGuessConfidence: audit.styleGuessConfidence,
    collectionPhase: audit.collectionPhase ?? "post_initial_lock",
    shownBeforeInitialLock: false,
    usedForScoring: false,
    notes: typeof audit.notes === "string" ? audit.notes.slice(0, 280) : "",
  };
  const payloadHash = `sha256:${sha256(canonicalJson(normalizedAudit))}`;
  return {
    id: randomUUID(),
    type,
    receivedAt,
    actorRole: actor.role,
    actorHash: `sha256:${sha256(String(actor.id))}`,
    payloadHash,
    payload: { audit: normalizedAudit },
    accessAudit: {
      postLockOnly: true,
      diagnosticOnly: true,
      sourceMetadataAcceptedFromRater: false,
      ordinaryScoringUseAccepted: false,
      remoteAddressHash: `sha256:${sha256(request.socket.remoteAddress ?? "unknown")}`,
    },
  };
}

export function createCertificationAuditEvent(type, actor, attempt, scoredAttempt, request) {
  const receivedAt = new Date().toISOString();
  const payloadHash = `sha256:${sha256(canonicalJson(attempt))}`;
  return {
    id: randomUUID(),
    type,
    receivedAt,
    actorRole: actor.role,
    actorHash: `sha256:${sha256(String(actor.id))}`,
    payloadHash,
    payload: { attempt },
    scoredAttempt,
    accessAudit: {
      trainingExposureOnly: true,
      protectedEvaluationUseAllowed: false,
      remoteAddressHash: `sha256:${sha256(request.socket.remoteAddress ?? "unknown")}`,
    },
  };
}

export function createBenchmarkExposureEvent(type, actor, exposure, request, options = {}) {
  const normalizedActor = actor ?? { id: "unknown", role: "unauthenticated" };
  const receivedAt = new Date().toISOString();
  const normalizedExposure = {
    action: exposure.action,
    artifactId: exposure.artifactId,
    purpose: exposure.purpose,
    accessPhase: exposure.accessPhase ?? "pre_freeze",
    probeFamilies: Array.isArray(exposure.probeFamilies) ? exposure.probeFamilies : [],
    notes: typeof exposure.notes === "string" ? exposure.notes.slice(0, 280) : "",
  };
  const payloadHash = `sha256:${sha256(canonicalJson(normalizedExposure))}`;
  const allowed = options.allowed ?? true;
  return {
    id: randomUUID(),
    type,
    occurredAt: receivedAt,
    actorRole: normalizedActor.role,
    actorHash: `sha256:${sha256(String(normalizedActor.id))}`,
    payloadHash,
    action: normalizedExposure.action,
    artifactId: normalizedExposure.artifactId,
    purpose: normalizedExposure.purpose,
    allowed,
    accessPhase: normalizedExposure.accessPhase,
    probeFamilies: normalizedExposure.probeFamilies,
    payload: { exposure: normalizedExposure },
    accessAudit: {
      requiredRole: "admin",
      authorizedRole: normalizedActor.role === "admin",
      rawHiddenContentAccepted: false,
      remoteAddressHash: `sha256:${sha256(request.socket.remoteAddress ?? "unknown")}`,
    },
  };
}

export function createWorkflowAuditEvent(type, actor, resourceKey, resource, request, options = {}) {
  const receivedAt = new Date().toISOString();
  const payloadHash = `sha256:${sha256(canonicalJson(resource))}`;
  return {
    id: randomUUID(),
    type,
    receivedAt,
    actorRole: actor.role,
    actorHash: `sha256:${sha256(String(actor.id))}`,
    resourceKey,
    resourceId: resource.id,
    payloadHash,
    payload: { [resourceKey]: resource },
    workflow: {
      appendOnly: true,
      route: options.route ?? null,
      pathParams: options.params ?? {},
      requiredRoles: options.requiredRoles ?? [],
    },
    accessAudit: {
      workflowAppendOnly: true,
      hiddenMetadataAccepted: actor.role === "admin",
      sourceMetadataAcceptedFromRater: false,
      peerRatingsAcceptedFromRater: false,
      remoteAddressHash: `sha256:${sha256(request.socket.remoteAddress ?? "unknown")}`,
    },
  };
}

export function signSessionToken(user, secret, options = {}) {
  const issuedAt = options.issuedAt ?? Date.now();
  const expiresAt = options.expiresAt ?? issuedAt + 8 * 60 * 60 * 1000;
  const payload = {
    userId: user.id,
    role: user.role,
    displayName: user.displayName,
    allowedAssignmentIds: user.allowedAssignmentIds ?? [],
    issuedAt,
    expiresAt,
    nonce: options.nonce ?? randomUUID(),
  };
  const encodedPayload = base64UrlEncode(canonicalJson(payload));
  const signature = hmac(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token, secret, nowMs = Date.now()) {
  if (typeof token !== "string" || !token.includes(".")) return { ok: false, error: "missing_or_malformed_session_token" };
  const [encodedPayload, signature] = token.split(".");
  const expected = hmac(encodedPayload, secret);
  if (!constantTimeEqual(signature, expected)) return { ok: false, error: "invalid_session_signature" };
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "invalid_session_payload" };
  }
  if (!payload.expiresAt || payload.expiresAt <= nowMs) return { ok: false, error: "session_expired" };
  const user = demoUsers.find((item) => item.id === payload.userId);
  if (!user || user.role !== payload.role) return { ok: false, error: "session_user_not_found" };
  return { ok: true, user };
}

async function readPersistedRatings(auditStore) {
  const events = await auditStore.readRatingEvents();
  return events.map((event) => event.payload?.rating).filter((rating) => rating && typeof rating === "object");
}

async function readPersistedCertificationAttempts(auditStore) {
  const events = await auditStore.readCertificationEvents();
  return events.map((event) => event.payload?.attempt).filter((attempt) => attempt && typeof attempt === "object");
}

async function readPersistedBenchmarkExposureEvents(auditStore) {
  return auditStore.readBenchmarkExposureEvents();
}

async function readPersistedSourceStyleAudits(auditStore) {
  const events = await auditStore.readSourceStyleAuditEvents();
  return events.map((event) => event.payload?.audit).filter((audit) => audit && typeof audit === "object");
}

async function readPersistedWorkflowEvents(auditStore) {
  if (typeof auditStore.readWorkflowEvents !== "function") return [];
  return auditStore.readWorkflowEvents();
}

async function buildCurrentCorpus(context) {
  const workflowEvents = await readPersistedWorkflowEvents(context.auditStore);
  const basePositionsById = new Map(positions.map((position) => [position.id, position]));
  const persistedPositions = latestWorkflowResources(workflowEvents, "position").map((resource) =>
    normalizeWorkflowPosition(resource, basePositionsById.get(resource.id)),
  );
  const positionList = mergeById(positions, persistedPositions);
  const positionIds = new Set(positionList.map((position) => position.id));
  const baseCritiquesById = new Map(critiques.map((critique) => [critique.id, critique]));
  const persistedCritiques = latestWorkflowResources(workflowEvents, "critique")
    .map((resource) => normalizeWorkflowCritique(resource, baseCritiquesById.get(resource.id)))
    .filter((critique) => positionIds.has(critique.positionId));
  const critiqueList = mergeById(critiques, persistedCritiques).filter((critique) => positionIds.has(critique.positionId));
  return { positionList, critiqueList };
}

function latestWorkflowResources(events, resourceKey) {
  const resourcesById = new Map();
  events.forEach((event) => {
    const resource = event.payload?.[resourceKey];
    if (resource && typeof resource === "object" && typeof resource.id === "string" && resource.id) {
      resourcesById.set(resource.id, resource);
    }
  });
  return [...resourcesById.values()];
}

function mergeById(baseItems, updateItems) {
  const items = new Map(baseItems.map((item) => [item.id, item]));
  updateItems.forEach((item) => {
    items.set(item.id, item);
  });
  return [...items.values()];
}

function normalizeWorkflowPosition(resource, base = {}) {
  const textVersions = normalizeWorkflowTextVersions(resource, base, "ptv");
  const raterVisibleTextVersionId = resource.intakeScreening?.raterVisibleTextVersionId ?? base.intakeScreening?.raterVisibleTextVersionId ?? textVersions.at(-1)?.id;
  const intakeScreening = {
    originalTextPreserved: true,
    normalizationStatus: "operator_intake_pending_review",
    expertNormalizationRequired: false,
    adminOnlyAmbiguityNotes: [],
    adminOnlyIntendedConclusionNotes: [],
    notesVisibleToInitialRaters: false,
    contextGapFlags: [],
    ordinaryHeadlineEligibility: "review_required",
    ...(base.intakeScreening ?? {}),
    ...(resource.intakeScreening ?? {}),
    raterVisibleTextVersionId,
  };
  const { text: _text, originalText: _originalText, raterVisibleText: _raterVisibleText, textVersions: _textVersions, intakeScreening: _screening, ...rest } = resource;
  return {
    ...base,
    ...rest,
    id: resource.id,
    clusterId: resource.clusterId ?? base.clusterId ?? `cluster-${resource.id}`,
    title: resource.title ?? base.title ?? resource.id,
    topicFamily: resource.topicFamily ?? base.topicFamily ?? "miscellaneous_topics",
    split: resource.split ?? base.split ?? "public_train",
    sourceCategory: resource.sourceCategory ?? base.sourceCategory ?? "unknown",
    sourceLanguage: resource.sourceLanguage ?? base.sourceLanguage ?? "unknown",
    translationStatus: resource.translationStatus ?? base.translationStatus ?? "unknown",
    sourceTaskFormat: resource.sourceTaskFormat ?? base.sourceTaskFormat ?? "unknown",
    authorshipRoute: resource.authorshipRoute ?? base.authorshipRoute ?? "operator_intake_append_only",
    llmAssistance: resource.llmAssistance ?? base.llmAssistance ?? "unknown",
    conceptualScope: resource.conceptualScope ?? base.conceptualScope ?? "pending_scope_review",
    groundTruthAvailability: resource.groundTruthAvailability ?? base.groundTruthAvailability ?? "pending_ground_truth_review",
    nonConceptualDependencyNotes: resource.nonConceptualDependencyNotes ?? base.nonConceptualDependencyNotes ?? "",
    contextSufficiency: resource.contextSufficiency ?? base.contextSufficiency ?? "needs_review",
    assumedBackgroundPolicy: resource.assumedBackgroundPolicy ?? base.assumedBackgroundPolicy ?? "",
    pricedInContextNotes: resource.pricedInContextNotes ?? base.pricedInContextNotes ?? "",
    intakeScreening,
    textVersions,
    adminTags: Array.isArray(resource.adminTags) ? resource.adminTags : base.adminTags ?? [],
  };
}

function normalizeWorkflowCritique(resource, base = {}) {
  const textVersions = normalizeWorkflowTextVersions(resource, base, "ctv");
  const { text: _text, originalText: _originalText, raterVisibleText: _raterVisibleText, textVersions: _textVersions, ...rest } = resource;
  return {
    ...base,
    ...rest,
    id: resource.id,
    positionId: resource.positionId ?? base.positionId,
    sourceType: resource.sourceType ?? base.sourceType ?? "unknown",
    authorshipType: resource.authorshipType ?? base.authorshipType ?? "unknown",
    lengthBand: resource.lengthBand ?? base.lengthBand ?? "unknown",
    styleBand: resource.styleBand ?? base.styleBand ?? "unknown",
    marginalInformativeness: resource.marginalInformativeness ?? base.marginalInformativeness ?? "unknown",
    textVersions,
  };
}

function normalizeWorkflowTextVersions(resource, base, prefix) {
  if (Array.isArray(resource.textVersions) && resource.textVersions.length) {
    return resource.textVersions
      .filter((version) => version && typeof version === "object" && typeof version.text === "string" && version.text)
      .map((version, index) => normalizeWorkflowTextVersion(resource.id, version, prefix, index));
  }
  if (Array.isArray(base.textVersions) && base.textVersions.length && !resource.text && !resource.originalText && !resource.raterVisibleText) {
    return base.textVersions;
  }
  const text = resource.raterVisibleText ?? resource.text ?? resource.originalText;
  return [normalizeWorkflowTextVersion(resource.id, { id: `${prefix}-${resource.id}-v1`, text: String(text ?? "") }, prefix, 0)];
}

function normalizeWorkflowTextVersion(resourceId, version, prefix, index) {
  const id = version.id ?? `${prefix}-${resourceId}-v${index + 1}`;
  const text = version.text;
  return {
    id,
    text,
    canonicalHash: version.canonicalHash ?? `sha256:${sha256(canonicalJson({ id, text }))}`,
    renderedHash: version.renderedHash ?? version.raterVisibleHash ?? `sha256:${sha256(canonicalJson({ id, text, view: "rendered" }))}`,
    createdAt: version.createdAt ?? new Date().toISOString(),
  };
}

async function workflowResourceById(context, resourceKey, id) {
  const resources = await workflowResourcesByField(context, resourceKey, "id", id);
  return resources.at(-1) ?? null;
}

async function workflowResourcesByField(context, resourceKey, field, value) {
  const events = await readPersistedWorkflowEvents(context.auditStore);
  return events
    .map((event) => event.payload?.[resourceKey])
    .filter((resource) => resource && typeof resource === "object" && resource[field] === value);
}

async function appendBenchmarkExposure(context, event) {
  await context.auditStore.appendBenchmarkExposureEvent(event);
}

async function buildAdminBenchmarkFreezeReport(context) {
  const { positionList, critiqueList } = await buildCurrentCorpus(context);
  const workflowEvents = await readPersistedWorkflowEvents(context.auditStore);
  const benchmarkSplitMembers = latestWorkflowResources(workflowEvents, "benchmarkSplitMember");
  const rightsRecords = latestWorkflowResources(workflowEvents, "rightsRecord");
  const persistedRatings = await readPersistedRatings(context.auditStore);
  const exposureEvents = [...seedBenchmarkExposureEvents, ...(await readPersistedBenchmarkExposureEvents(context.auditStore))];
  const snapshot = createLabelSnapshot(
    "snapshot-oct-benchmark-api",
    releaseId,
    [...seedRatings, ...persistedRatings],
    critiqueList.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "benchmark_frozen",
    positionList,
  );
  return buildHiddenBenchmarkFreezeReport(releaseId, snapshot, positionList, critiqueList, buildReleaseRightsRecords(rightsRecords), exposureEvents, {
    includeRestrictedIds: true,
    benchmarkSplitMembers,
  });
}

async function buildAdminTrainingExport(context) {
  const { positionList, critiqueList } = await buildCurrentCorpus(context);
  const ratings = [...seedRatings, ...(await readPersistedRatings(context.auditStore))];
  const snapshot = createLabelSnapshot(
    "snapshot-oct-training-api",
    releaseId,
    ratings,
    critiqueList.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "initial_only",
    positionList,
  );
  return buildTrainingExport(releaseId, snapshot, positionList, critiqueList, ratings, ratingContextSnapshots);
}

async function serveStatic(response, rootDir, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = safeJoin(rootDir, requestedPath);
  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }
  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(file);
  } catch (error) {
    if (error && error.code === "ENOENT" && requestedPath !== "/index.html") {
      await serveStatic(response, rootDir, "/index.html");
      return;
    }
    sendText(response, 404, "Not found");
  }
}

function safeJoin(rootDir, requestedPath) {
  const normalized = normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = resolve(join(rootDir, normalized));
  return filePath === rootDir || filePath.startsWith(`${rootDir}${sep}`) ? filePath : null;
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("request body too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
  response.end(body);
}

function normalizeWorkflowStateEntityType(value) {
  return String(value ?? "").trim().replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function normalizeWorkflowStringList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string" && item).map((item) => item.trim());
  if (typeof value === "string" && value) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeWorkflowGuardChecks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((check) => {
      if (typeof check === "string") return { id: check, status: "passed" };
      if (!check || typeof check !== "object") return null;
      const id = check.id ?? check.guardId ?? check.name ?? check.key;
      if (!id) return null;
      return {
        id,
        status: check.status ?? (check.passed === false ? "failed" : "passed"),
        detail: check.detail ?? check.reason ?? null,
      };
    })
    .filter(Boolean);
}

function findHiddenKeys(value, prefix = "") {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const own = hiddenMetadataKeys.has(key) ? [path] : [];
    return own.concat(findHiddenKeys(child, path));
  });
}

function findRawBenchmarkContentKeys(value, prefix = "") {
  const forbiddenKeys = new Set([
    "positionText",
    "critiqueText",
    "rawPositionText",
    "rawCritiqueText",
    "sourceText",
    "hiddenPositionIds",
    "hiddenCritiqueIds",
    "hiddenItemIds",
    "membership",
  ]);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const own = forbiddenKeys.has(key) ? [path] : [];
    return own.concat(findRawBenchmarkContentKeys(child, path));
  });
}

function deniedBenchmarkExposure(action) {
  return {
    action,
    artifactId: `hidden-benchmark-freeze-${releaseId}`,
    purpose: "access_audit_review",
    accessPhase: "access_denied",
  };
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function authenticateRequest(request, authConfigOrSecret) {
  const header = String(getHeader(request.headers, "authorization") ?? "");
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return { ok: false, error: "missing_bearer_token" };

  if (typeof authConfigOrSecret === "string") return verifySessionToken(match[1], authConfigOrSecret);
  const auth = authConfigOrSecret ?? createAuthConfig();
  if (auth.mode === "demo") return verifySessionToken(match[1], auth.sessionSecret);
  if (auth.mode === "external_jwt") return verifyExternalJwtToken(match[1], auth.externalJwt);
  return { ok: false, error: "unsupported_auth_mode" };
}

function invalid(detail) {
  return { ok: false, detail };
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function hmac(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

function getHeader(headers, key) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(key);
  return headers[key] ?? headers[key.toLowerCase()] ?? null;
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT ?? 4173);
  const host = process.env.HOST ?? "127.0.0.1";
  createLmcaServer().listen(port, host, () => {
    console.log(`LMCA server listening on http://${host}:${port}/`);
  });
}
