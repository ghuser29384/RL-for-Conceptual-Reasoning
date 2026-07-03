import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ADJUDICATION_COCKPIT_SIGNOFF_POLICY_VERSION,
  ADJUDICATOR_PRE_READ_REQUIREDNESS_POLICY_VERSION,
  ARTIFACT_PROBE_INPUT_VIEWS,
  ACTIVE_LEARNING_SELECTION_POLICY_VERSION,
  ACCESSIBILITY_TOOLING_POLICY_VERSION,
  BENCHMARK_REFRESH_POLICY_VERSION,
  CLIENT_SURFACE_INTEGRITY_POLICY_VERSION,
  CLOUD_SECURITY_BUDGET_POLICY_VERSION,
  DISAGREEMENT_THRESHOLD_POLICY_VERSION,
  DIAGNOSTIC_DEFERRAL_VISIBILITY_POLICY_VERSION,
  EXPOSURE_QUARANTINE_POLICY_VERSION,
  EXTERNAL_WORM_AUDIT_LOG_POLICY_VERSION,
  EXTERNAL_ASSISTANCE_CONTAMINATION_POLICY_VERSION,
  INTERPRETATION_TARGET_MAP_REQUIREDNESS_POLICY_VERSION,
  ITEM_TEXT_NORMALIZATION_POLICY_VERSION,
  MODEL_FAMILY_OVERLAP_POLICY_VERSION,
  MODEL_PROMPT_SIBLING_CONTEXT_POLICY_VERSION,
  MODEL_PROVIDER_ENDPOINT_CONTRACT_POLICY_VERSION,
  MODEL_IMPROVEMENT_POLICY_VERSION,
  MODEL_RUN_REPRODUCIBILITY_POLICY_VERSION,
  OBFUSCATION_STRESS_VARIANT_FAMILIES,
  PARTIAL_TASK_PROMOTION_POLICY_VERSION,
  RATER_ISSUE_FLAG_DEFINITIONS,
  RATING_EFFORT_QA_REVIEW_DECISIONS,
  RATER_DASHBOARD_POLICY_VERSION,
  RATING_ESCALATION_CORRECTNESS_SPREAD_THRESHOLD,
  RATING_ESCALATION_LOW_CLARITY_ADJUDICATION_COUNT,
  RATING_ESCALATION_LOW_CLARITY_THRESHOLD,
  RATING_ESCALATION_OVERALL_SPREAD_THRESHOLD,
  RATING_ESCALATION_POST_DISCUSSION_MAX_SPREAD_TARGET,
  RATING_ESCALATION_PRODUCT_SPREAD_THRESHOLD,
  RATING_ESCALATION_TRIGGER_RULES,
  RATIONALE_EVIDENCE_SPAN_REQUIREDNESS_POLICY_VERSION,
  RATER_INSTRUCTION_COMPATIBILITY_POLICY_VERSION,
  SAME_POSITION_BATCH_REVIEW_REQUIREDNESS_POLICY_VERSION,
  SCORE_CONFIDENCE_SCALE_POLICY_VERSION,
  SPOT_CHECK_SAMPLING_POLICY_VERSION,
  REQUIRED_RATIONALE_EVIDENCE_SPAN_COVERAGE_RULES,
  REQUIRED_RATIONALE_EVIDENCE_SPAN_MANDATORY_TRIGGER_CLASSES,
  REQUIRED_RATIONALE_EVIDENCE_SPAN_REQUIREDNESS_THRESHOLDS,
  REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_CLASSES,
  REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_RULES,
  REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_THRESHOLDS,
  REQUIRED_RATER_INSTRUCTION_SHARED_POLICY_FIELDS,
  REQUIRED_RATER_DASHBOARD_PROHIBITED_FIELDS,
  REQUIRED_RATER_DASHBOARD_REMEDIATION_RULES,
  REQUIRED_RATER_DASHBOARD_REMEDIATION_STATUSES,
  REQUIRED_RATER_DASHBOARD_THRESHOLDS,
  REQUIRED_RATER_DASHBOARD_VISIBLE_SECTIONS,
  REQUIRED_RATER_DASHBOARD_VISIBILITY_STATUSES,
  REQUIRED_SAME_POSITION_BATCH_REVIEW_DECISION_STATUSES,
  REQUIRED_SAME_POSITION_BATCH_REVIEW_RULES,
  REQUIRED_SAME_POSITION_BATCH_REVIEW_STATUSES,
  REQUIRED_SAME_POSITION_BATCH_REVIEW_THRESHOLDS,
  REQUIRED_SAME_POSITION_BATCH_REVIEW_TRIGGER_CLASSES,
  REQUIRED_SCORE_CONFIDENCE_BANDS,
  REQUIRED_SCORE_CONFIDENCE_NUMERIC_THRESHOLDS,
  REQUIRED_SCORE_CONFIDENCE_REASON_CODES,
  REQUIRED_SCORE_CONFIDENCE_SCALE_VERSION,
  REQUIRED_SOURCE_IDENTIFIABILITY_REVIEW_STATUSES,
  REQUIRED_SOURCE_LEAKAGE_LINT_PATTERNS,
  REQUIRED_SOURCE_LEAKAGE_REDACTION_ACTIONS,
  SOURCE_FAMILY_CLUSTERING_POLICY_VERSION,
  REQUIRED_SOURCE_FAMILY_CLUSTERING_THRESHOLDS,
  REQUIRED_NEAR_DUPLICATE_CLUSTERING_THRESHOLDS,
  REQUIRED_SOURCE_FAMILY_CLUSTER_FIELDS,
  REQUIRED_SOURCE_FAMILY_CLUSTERING_REVIEW_STATUSES,
  REQUIRED_SPOT_CHECK_MINIMUM_COUNT_BY_STRATUM,
  REQUIRED_SPOT_CHECK_MINIMUM_RATE_BY_STRATUM,
  REQUIRED_SPOT_CHECK_SAMPLING_STRATA,
  REQUIRED_INTERPRETATION_TARGET_MAP_COVERAGE_RULES,
  REQUIRED_INTERPRETATION_TARGET_MAP_REQUIREDNESS_THRESHOLDS,
  REQUIRED_INTERPRETATION_TARGET_MAP_TRIGGER_CLASSES,
  REQUIRED_ITEM_TEXT_NORMALIZATION_FIELD_POLICIES,
  REQUIRED_ITEM_TEXT_NORMALIZATION_HASH_RULES,
  REQUIRED_ITEM_TEXT_NORMALIZATION_HASH_TARGETS,
  REQUIRED_ITEM_TEXT_NORMALIZATION_PROHIBITED_MUTATIONS,
  REQUIRED_ITEM_TEXT_NORMALIZATION_REVIEW_ACTIONS,
  REQUIRED_DISAGREEMENT_ESCALATION_RULES,
  REQUIRED_DISAGREEMENT_THRESHOLDS,
  REQUIRED_ACTIVE_LEARNING_HAND_SELECTION_QUOTAS,
  REQUIRED_ACTIVE_LEARNING_REJECTION_REASON_CODES,
  REQUIRED_ACTIVE_LEARNING_SELECTION_REASON_CODES,
  REQUIRED_ACTIVE_LEARNING_SELECTION_THRESHOLDS,
  REQUIRED_ACCESSIBILITY_ASSISTIVE_TECH_MATRIX,
  REQUIRED_ACCESSIBILITY_EVIDENCE_ARTIFACT_TYPES,
  REQUIRED_ACCESSIBILITY_TEST_TOOLCHAIN,
  REQUIRED_ACCESSIBILITY_WCAG_CONFORMANCE_TARGET,
  REQUIRED_ADJUDICATION_COCKPIT_MANDATORY_VIEW_IDS,
  REQUIRED_ADJUDICATION_COCKPIT_SIGNOFF_RULES,
  REQUIRED_ADJUDICATION_COCKPIT_SIGNOFF_THRESHOLDS,
  REQUIRED_ADJUDICATOR_PRE_READ_DECISION_STATUSES,
  REQUIRED_ADJUDICATOR_PRE_READ_RULES,
  REQUIRED_ADJUDICATOR_PRE_READ_THRESHOLDS,
  REQUIRED_ADJUDICATOR_PRE_READ_TRIGGER_CLASSES,
  REQUIRED_ADJUDICATOR_PRE_READ_VISIBILITY_POLICIES,
  REQUIRED_BENCHMARK_REFRESH_ACTIONS,
  REQUIRED_BENCHMARK_REFRESH_CADENCE_DAYS_BY_STATUS,
  REQUIRED_BENCHMARK_REFRESH_POLICY_RULES,
  REQUIRED_BENCHMARK_REFRESH_QUEUE_FIELDS,
  REQUIRED_CLOUD_SECURITY_APPROVAL_STATUSES,
  REQUIRED_CLOUD_SECURITY_BUDGET_CATEGORY_MINIMUM_USD,
  REQUIRED_CLOUD_SECURITY_BUDGET_RANGE_USD,
  REQUIRED_CLOUD_SECURITY_CONTROLS,
  REQUIRED_CLIENT_SURFACE_CACHE_POLICY,
  REQUIRED_CLIENT_SURFACE_CSP_DIRECTIVES,
  REQUIRED_CLIENT_SURFACE_REFERRER_POLICY,
  REQUIRED_CLIENT_SURFACE_TELEMETRY_ALLOWLIST,
  REQUIRED_CLIENT_SURFACE_URL_IDENTIFIER_POLICY,
  REQUIRED_DIAGNOSTIC_DEFERRAL_CLAIM_SUPPRESSION_ACTIONS,
  REQUIRED_DIAGNOSTIC_DEFERRAL_DIAGNOSTIC_CLASSES,
  REQUIRED_DIAGNOSTIC_DEFERRAL_PUBLIC_VISIBILITY_LEVELS,
  REQUIRED_DIAGNOSTIC_DEFERRAL_REVIEW_STATUSES,
  REQUIRED_DIAGNOSTIC_DEFERRAL_VISIBILITY_RULES,
  REQUIRED_EXTERNAL_ASSISTANCE_ACCESSIBILITY_STATUSES,
  REQUIRED_EXTERNAL_ASSISTANCE_CLEAN_ROUTES,
  REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATING_TYPES,
  REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATION_ROUTES,
  REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATION_RULES,
  REQUIRED_EXTERNAL_ASSISTANCE_TYPES,
  REQUIRED_EXTERNAL_WORM_AUDIT_FALLBACK_RULE,
  REQUIRED_EXTERNAL_WORM_AUDIT_LEDGER_BACKEND,
  REQUIRED_EXTERNAL_WORM_AUDIT_POINTER_PREFIX,
  REQUIRED_EXTERNAL_WORM_AUDIT_RECEIPT_FIELDS,
  REQUIRED_EXTERNAL_WORM_AUDIT_RECEIPT_HASH_ALGORITHM,
  REQUIRED_EXTERNAL_WORM_AUDIT_RETENTION_YEARS,
  REQUIRED_EXTERNAL_WORM_AUDIT_VERIFICATION_CADENCE,
  REQUIRED_EXPOSURE_QUARANTINE_ACTIONS,
  REQUIRED_EXPOSURE_QUARANTINE_ASSIGNMENT_CHECKS,
  REQUIRED_EXPOSURE_QUARANTINE_EFFECTS,
  REQUIRED_EXPOSURE_QUARANTINE_REVIEW_STATUSES,
  REQUIRED_EXPOSURE_QUARANTINE_TRIGGER_CLASSES,
  REQUIRED_MODEL_FAMILY_OVERLAP_CLEAN_CLAIM_ACTIONS,
  REQUIRED_MODEL_FAMILY_OVERLAP_FORBIDDEN_BASES,
  REQUIRED_MODEL_FAMILY_OVERLAP_MATCH_BASES,
  REQUIRED_MODEL_FAMILY_OVERLAP_POLICY_RULES,
  REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_EVIDENCE_FIELDS,
  REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_MODES,
  REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_RULES,
  REQUIRED_MODEL_PROVIDER_ENDPOINT_CONTRACT_CLAUSES,
  REQUIRED_MODEL_RUN_REPRODUCIBILITY_CONFIG_FIELDS,
  REQUIRED_MODEL_RUN_REPRODUCIBILITY_ENVIRONMENT_FIELDS,
  REQUIRED_MODEL_RUN_REPRODUCIBILITY_RULES,
  REQUIRED_MODEL_IMPROVEMENT_APPROVAL_STATUSES,
  REQUIRED_MODEL_IMPROVEMENT_METHODS,
  REQUIRED_MODEL_IMPROVEMENT_OBJECTIVE_FAMILIES,
  REQUIRED_MODEL_IMPROVEMENT_POLICY_RULES,
  REQUIRED_MODEL_IMPROVEMENT_PROTECTED_SPLIT_EXCLUSIONS,
  REQUIRED_MODEL_IMPROVEMENT_TARGET_FIELDS,
  REQUIRED_PARTIAL_TASK_ELIGIBLE_USES,
  REQUIRED_PARTIAL_TASK_PROMOTION_CRITERIA,
  REQUIRED_PARTIAL_TASK_PROMOTION_REVIEW_STATUSES,
  REQUIRED_RATER_UX_ACCEPTANCE_CHECKS,
  REQUIRED_TRAINING_EXPORT_DOWNWEIGHT_RULES,
  REQUIRED_TRAINING_EXPORT_UNCERTAINTY_THRESHOLDS,
  REQUIRED_UI_VARIANT_SENSITIVITY_ALPHA,
  REQUIRED_UI_VARIANT_SENSITIVITY_MAX_IMBALANCE,
  REQUIRED_UI_VARIANT_SENSITIVITY_MDE_OVERALL,
  REQUIRED_UI_VARIANT_SENSITIVITY_MIN_CELL_COUNT,
  REQUIRED_UI_VARIANT_SENSITIVITY_MINIMUM_POWER,
  RUBRIC_DIMENSIONS,
  SANITY_BASELINE_TYPES,
  SCORE_CONFIDENCE_LEVELS,
  SCORE_EXPLANATION_EXTREME_THRESHOLD_HIGH,
  SCORE_EXPLANATION_EXTREME_THRESHOLD_LOW,
  SCORE_EXPLANATION_INCONSISTENCY_RULES,
  SCORE_EXPLANATION_OPTIONAL_FIELDS,
  SCORE_EXPLANATION_ORDINARY_REQUIRED_FIELDS,
  SCORE_EXPLANATION_OVERALL_PRODUCT_GAP_THRESHOLD,
  SCORE_EXPLANATION_TRIGGER_RULES,
  SOURCE_LEAKAGE_REDACTION_POLICY_VERSION,
  SYCOPHANCY_ORTHODOXY_CUE_TYPES,
  TRAINING_EXPORT_UNCERTAINTY_POLICY_VERSION,
  UI_VARIANT_SENSITIVITY_POWER_POLICY_VERSION,
  assignments,
  buildHiddenBenchmarkFreezeReport,
  buildEffectiveRatingContextSnapshots,
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
  ratingObfuscationNoteForRating,
  scoreCertificationAttempt,
  scoreExplanationTriggersForRating,
  validateRatingObfuscationNote,
  validateTriggeredScoreExplanation,
  seedBenchmarkExposureEvents,
  seedCertificationAttempts,
  seedRatings,
  VALIDATION_TRANCHE_REQUIRED_COMPARISONS,
  VALIDATION_TRANCHE_TYPES,
  VERIFICATION_CLAIM_GRANULARITY_POLICY_VERSION,
  REQUIRED_VERIFICATION_CLAIM_GRANULARITY_CLASSES,
  REQUIRED_VERIFICATION_CLAIM_GRANULARITY_RULES,
  REQUIRED_VERIFICATION_CLAIM_GRANULARITY_THRESHOLDS,
  REQUIRED_VISIBILITY_ROLE_FIELD_ACTION_MATRIX,
} from "./domain/core.mjs";
import {
  CONTRIBUTION_ARCHITECTURE,
  CONTRIBUTION_PART_SCHEMAS,
  CONTRIBUTION_TEMPLATES,
  ORIGIN_CHOICES,
  WORKFLOW_GATES,
  WORKFLOW_POLICIES,
  createContributionSubmissionResources,
  createGateDecisionResource,
  createPreparedDraftFromPart,
  eligibleContributionPositions,
  gatesSatisfiedForPolicy,
  promotePreparedDraftToCandidateItem,
  requiredGateIdsForPolicy,
  sanitizeContributionSubmissionForUser,
} from "./domain/contributions.mjs";
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
const rationaleEvidenceSpanLinkCategories = [
  ...RUBRIC_DIMENSIONS,
  "attacked_claim",
  "critique_support",
  "wrong_claim",
  "dead_weight_span",
  "side_issue",
  "unclear_language",
  "unclear_text",
];
const rationaleEvidenceSpanVisibilityStates = ["locked_initial_hidden", "post_lock_visible", "adjudication_visible"];
const ratingScoreEntryExplicitnessStatuses = new Set(["all_required_scores_explicit", "low_clarity_branch_explicit", "revision_scores_explicit"]);
const ratingMissingFieldValidationStatuses = new Set(["passed_no_missing_required_fields", "low_clarity_provisional_fields_allowed"]);
const lockedInitialSourceTagVisibilityStates = new Set(["hidden", "hidden_from_initial_rater", "source_tag_protected_visibility_preserved"]);
const allowedRatingFlagKeys = new Set(RATER_ISSUE_FLAG_DEFINITIONS.map((definition) => definition.key));
const ratingConfidenceJudgmentValues = new Set(SCORE_CONFIDENCE_LEVELS);
const allowedScoreExplanationTriggers = new Set(SCORE_EXPLANATION_TRIGGER_RULES);
const adminRoles = ["admin"];
const adminAuditRoles = ["admin", "auditor"];
const expertWorkflowRoles = ["expert", "admin"];
const expertAuditWorkflowRoles = ["expert", "admin", "auditor"];
const ratingWorkflowRoles = ["rater", "graduate", "phd", "expert", "admin"];
const workflowStateReadRoles = ["rater", "graduate", "phd", "expert", "admin", "auditor"];
const workflowStateTransitionRoles = ["rater", "graduate", "phd", "expert", "admin"];
const participantDataWriteRoles = ["rater", "graduate", "phd", "expert", "admin"];
const participantDataReadRoles = ["rater", "graduate", "phd", "expert", "admin", "auditor"];
const contributionSubmissionRoles = ["rater", "graduate", "phd", "expert", "admin"];
const contributionAdminRoles = ["admin"];
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
const raterSessionExpectedEffortStatuses = ["below_band", "within_band", "above_band", "not_enough_data"];
const raterSessionStopAfterCurrentStates = ["available", "requested", "completed", "not_available"];
const raterSessionFatigueWarningStates = ["none", "break_recommended", "fatigue_risk_flagged", "routed_to_qa_review"];
const raterSessionQaRoutingStatuses = [
  "no_fatigue_qa_route",
  "monitor_only",
  "routed_to_qa_fatigue_risk",
  "routed_to_qa_suspicious_low_effort",
  "routed_to_qa_repeated_interruption",
];
const raterSessionNonNegativeNumberFields = ["activeTimeSeconds", "completedAssignmentCount", "breakPromptCount", "breakTakenCount"];
const sessionPacingPolicyVersion = "session-pacing-rlhf90-v1";
const sessionPacingTargets = ["ordinary_live_rating", "practice", "calibration", "discussion", "adjudication", "release_review"];
const sessionPacingThresholdSeconds = {
  breakPromptAfter: 2700,
  fatigueWarningAfter: 3600,
  qaReviewAfter: 7200,
};
const safeDeclineAbuseThresholds = {
  monitorAfterDeclinesPer24h: 3,
  qaAfterSameReasonDeclinesPer7d: 5,
  suspiciousPatternWindowHours: 24,
};
const practiceSandboxPolicyVersion = "practice-sandbox-rlhf90-v1";
const practiceSandboxRequiredSourceAnchorIds = [
  "anchor-is-ought-near-zero",
  "anchor-is-ought-near-perfect",
  "anchor-approval-voting-midrange",
  "anchor-table4-model-failure-overcredit",
];
const practiceSandboxCompletionStandards = {
  minimumLockedAttemptsBeforeLiveRating: 4,
  requiredAnchorAttemptCoverage: 4,
  allSevenScoresRequired: true,
  feedbackAfterLockOnly: true,
  excludedFromReleaseDenominators: true,
  trainingExposureRecorded: true,
};
const raterTrainingExposurePolicyVersion = "rater-training-exposure-rlhf90-v1";
const raterTrainingExposureWindowDays = {
  publicSourceAnchorRecordOnly: 0,
  practiceFeedbackSamePublicAnchor: 0,
  goldFeedbackSameCluster: 180,
  duplicateFeedbackSameCluster: 180,
  calibrationFeedbackSameCluster: 90,
  remediationModuleSameCluster: 90,
  samePositionClusterExposure: 365,
  peerRationaleOrPostLockDiscussion: 365,
  modelAssistedCheckSameCluster: 365,
  adjudicationMemoOrProtectedLabelAccess: 3650,
  sourceMetadataOrHiddenBenchmarkAccess: 3650,
};
const raterTrainingExposureBlockingEffects = {
  publicSourceAnchorRecordOnly: "record_training_exposure_without_protected_block_by_itself",
  practiceFeedbackSamePublicAnchor: "record_training_exposure_without_protected_block_by_itself",
  goldFeedbackSameCluster: "block_or_reassign_protected_assignment_with_same_cluster_until_window_expires",
  duplicateFeedbackSameCluster: "block_or_reassign_protected_assignment_with_same_cluster_until_window_expires",
  calibrationFeedbackSameCluster: "block_or_reassign_protected_assignment_with_same_cluster_until_window_expires",
  remediationModuleSameCluster: "block_or_reassign_protected_assignment_with_same_cluster_until_window_expires",
  samePositionClusterExposure: "exclude_from_independent_blind_denominators_and_reassign_same_cluster",
  peerRationaleOrPostLockDiscussion: "exclude_from_independent_blind_denominators_and_reassign_same_cluster",
  modelAssistedCheckSameCluster: "exclude_from_human_only_blind_denominators_and_reassign_same_cluster",
  adjudicationMemoOrProtectedLabelAccess: "non_blind_for_related_protected_cluster_until_admin_exception",
  sourceMetadataOrHiddenBenchmarkAccess: "blocked_from_related_protected_assignment_until_deprotection_or_admin_exception",
};
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
  "repeatedOrStrategicDeclineQaPolicy",
  "sourcePeerModelGoldProtectedLabelVisibilityState",
  "excludedFromRatingDenominator",
  "timestamp",
];
const assignmentDeclineReasonCodes = ["lack_topic_expertise", "conflict_or_prior_exposure", "text_unreadable_or_wrong_item", "insufficient_time", "other"];
const assignmentDeclineReassignmentStatuses = ["reassigned_without_label", "paused_for_topic_fit_review", "closed_no_reassignment_needed"];
const assignmentDeclineQaRoutingStatuses = ["monitor_only", "routed_to_qa_repeated_decline", "routed_to_qa_suspicious_pattern"];
const assignmentSelfScreenStatuses = ["continue", "pause", "request_reassignment"];
const assignmentDeferralReasons = assignmentDeclineReasonCodes;
const assignmentDeferralResumePolicies = [
  "resume_without_label_submission",
  "reassign_without_label_submission",
  "resume_or_reassign_after_review_without_label_submission",
];
const assignmentFlagReasonCodes = [
  "insufficient_topic_expertise",
  "conflict_or_prior_exposure",
  "text_unreadable_or_wrong_item",
  "source_recognition_or_prior_exposure",
  "time_or_fatigue_risk",
  "other",
];
const itemIssueReportRequiredFields = [
  "id",
  "itemIssueQuarantinePolicyId",
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
const itemIssueCategories = [
  "source_leakage",
  "missing_context",
  "malformed_text",
  "duplicate_or_near_duplicate",
  "nonconceptual_or_scope",
  "translation_or_adaptation_error",
  "rights_or_provenance",
  "rubric_or_ui_render_defect",
  "external_assistance_or_exfiltration",
];
const itemIssueQuarantinePolicyVersion = "item-issue-quarantine-rlhf90-v1";
const itemIssueSeverities = ["low", "medium", "high", "critical"];
const itemIssueSeverityCategories = [
  {
    severity: "critical",
    definition: "confirmed_or_likely_source_leakage_rights_failure_or_release_blocking_context_defect",
    releaseEffect: "block_release_and_quarantine_dependents",
  },
  {
    severity: "high",
    definition: "plausible_leakage_context_duplicate_translation_or_ui_defect_that_can_change_labels",
    releaseEffect: "quarantine_item_and_dependents_until_triage",
  },
  {
    severity: "medium",
    definition: "localized_defect_or_ambiguity_that_can_affect_one_item_or_assignment",
    releaseEffect: "quarantine_affected_item_until_resolution",
  },
  {
    severity: "low",
    definition: "copy_formatting_or_minor_clarity_defect_unlikely_to_change_locked_labels",
    releaseEffect: "triage_within_sla_and_quarantine_if_release_critical_or_unresolved",
  },
];
const itemIssueQuarantineSlaHoursBySeverity = {
  critical: 4,
  high: 24,
  medium: 72,
  low: 168,
};
const itemIssueQuarantineActionRequirementBySeverity = {
  critical: "quarantine_affected_item_and_dependent_artifacts_until_resolved_or_superseded",
  high: "quarantine_affected_item_and_dependent_artifacts_until_triaged",
  medium: "quarantine_affected_item_until_triaged_or_resolved",
  low: "triage_within_sla_and_quarantine_if_release_critical_or_unresolved",
};
const itemIssueActionKinds = ["triage", "resolve", "quarantine"];
const itemIssueResolutionStatuses = ["triage_opened", "resolved", "quarantined"];
const itemIssueQuarantineScopes = ["none", "affected_item", "dependent_artifacts", "affected_item_and_dependent_artifacts"];
const benchmarkSubmissionBudgetKeys = [
  "maxSubmissionsPerWindow",
  "windowHours",
  "remainingSubmissions",
  "cooldownHours",
  "duplicateRunReviewThreshold",
];
const benchmarkBudgetConsumptionStatuses = ["within_budget", "budget_depleted_routed_to_review"];
const benchmarkCooldownStatuses = ["cooldown_started", "cooldown_satisfied", "cooldown_review_required"];
const benchmarkDuplicateRunStatuses = ["not_duplicate", "near_duplicate_routed_to_review"];
const benchmarkSubmissionPolicyRequiredFields = [
  "id",
  "policyVersion",
  "aggregateOnlyReport",
  "submissionBudget",
  "cooldownPolicy",
  "duplicateRunHandlingPolicy",
  "stableEvaluationManifestRequirement",
  "aggregateReportFieldPolicy",
  "hiddenIdExposureProhibited",
  "perItemFeedbackProhibited",
  "perPairFeedbackProhibited",
  "promptSpecificCorrectionHintsProhibited",
  "frozenAt",
];
const benchmarkSubmissionRequiredFields = [
  "id",
  "benchmarkSubmissionPolicyId",
  "releaseId",
  "releaseConfigManifestId",
  "evaluationManifestId",
  "submittedAggregateReportId",
  "aggregateMetricFamilyResults",
  "uncertaintyIntervals",
  "coverageCounts",
  "coarseEligibilityWarnings",
  "perItemOutputIncluded",
  "perPairOutputIncluded",
  "hiddenIdExposureIncluded",
  "promptSpecificCorrectionHintsIncluded",
  "budgetConsumptionStatus",
  "cooldownStatus",
  "duplicateRunStatus",
  "submittedAt",
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
  "dependencyVersionSnapshot.draftStoragePolicyId",
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
const ratingCheckTypes = ["self_check", "expert_check", "model_assisted_check"];
const ratingCheckModelExposureTimings = ["none", "post_human_only_self_check_lock"];
const modelAssistedAuxiliaryMaterialRequirements = ["own_initial_rationale", "assisting_model_commentary"];
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
const correctnessVerificationStatuses = [
  "not_needed",
  "requested",
  "in_progress",
  "verified",
  "not_practicable",
  "unresolved",
  "adjudication_resolved",
];
const verificationWorkspaceClaimTypes = ["logical", "mathematical", "empirical", "subjective_or_intuition_pump", "unclear_claim"];
const verificationWorkspaceClaimStatuses = ["verified", "unresolved", "not_practicable", "excluded_due_to_unclear_text"];
const verificationEvidenceSourceExposureStatuses = ["source_blind", "post_lock_source_visible", "source_identifiable", "not_applicable"];
const verificationEvidenceProtectedContentStatuses = ["none", "protected_content_absent", "protected_content_redacted", "protected_content_present_authorized"];
const verificationEvidenceModelAssistanceStatuses = ["none", "model_assisted_retrieval", "model_generated_summary", "model_suggested_source"];
const verificationEvidenceTypes = [
  "external_citation",
  "immutable_snapshot",
  "internal_expert_note",
  "supplied_item_text",
  "model_assisted_material",
  "no_external_material_required",
];
const verificationEvidenceBlindingImpactStatuses = [
  "source_blind_release_safe",
  "post_lock_nonblind_evidence",
  "source_assisted_review_required",
  "protected_content_quarantined",
];
const verificationEvidenceAudienceFields = ["shownToOriginalRater", "shownToChecker", "shownToAdjudicator"];
const interpretationTargetMapRequiredFields = [
  "id",
  "interpretationTargetMapRequirednessPolicyId",
  "requirednessTriggerClass",
  "requirednessDecisionStatus",
  "positionTextVersionId",
  "critiqueTextVersionId",
  "plausibilityNotes",
  "interpretationPlausibilityByReading",
  "pricedInBackgroundAssumptionStatus",
  "dimensionEffectByRubricDimension",
  "productAllocationNote",
  "visibilityState",
  "createdBy",
  "timestamp",
];
const interpretationTargetMapRequirednessPolicyRequiredFields = [
  "id",
  "policyVersion",
  "ordinaryItemPolicy",
  "coverageManifestRule",
  "lmcaSourceBoundary",
  "frozenAt",
];
const interpretationTargetMapRequiredFieldsManifest = [
  "candidateIntendedConclusionSpans",
  "attackedClaimSpans",
  "plausiblePositionCritiqueInterpretations",
  "interpretationPlausibilityByReading",
  "critiqueCoverageByInterpretation",
  "pricedInBackgroundAssumptionStatus",
  "centralityTargetClaimSet",
  "strengthTargetClaimSet",
  "dimensionEffectByRubricDimension",
];
const interpretationTargetMapRequirednessDecisionStatuses = [
  "optional_for_ordinary_low_risk",
  "required_before_release_or_adjudication",
  "complete_required_map",
  "review_required",
];
const verificationClaimGranularityPolicyRequiredFields = [
  "id",
  "policyVersion",
  "worksheetLinkageRule",
  "sourceBoundary",
  "frozenAt",
];
const verificationClaimGranularityReviewStatuses = [
  "policy_applied_claim_level",
  "compound_claim_justified",
  "review_required",
];
const verificationWorkspaceSessionRequiredFields = [
  "id",
  "verificationClaimGranularityPolicyId",
  "claimGranularityClass",
  "claimGranularityReviewStatus",
  "claimType",
  "verificationStatus",
  "claimVerificationStatusByClaim",
  "sourceAssistedReviewNote",
  "correctnessHalfEntireUnclearFlag",
  "nonBlindAuxiliaryMaterialConsulted",
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
const discussionIdentityStagingPolicies = ["role_neutral_handles_first", "moderator_exception_immediate"];
const discussionIdentityMaskPhaseStatuses = ["pending_role_neutral_comment_phase", "completed_before_role_reveal", "not_feasible_moderator_exception_logged"];
const discussionRoleRevealPolicies = [
  "no_role_reveal_until_object_level_comment_phase_complete",
  "moderator_exception_logged",
  "adjudicator_visibility_exception_logged",
];
const discussionObjectLevelStatuses = [
  "object_level_point_preserved",
  "overlooked_point_flagged",
  "span_reference_added",
  "verification_conflict_noted",
  "revision_proposal_supported_by_object_level_reason",
];
const discussionRevisionReasonCodes = [
  "overlooked_object_level_point",
  "target_mapping_correction",
  "span_evidence_correction",
  "verification_update",
  "post_discussion_revision",
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
  "adjudicatorPreReadRequirednessPolicyId",
  "requirednessTriggerClass",
  "requirednessDecisionStatus",
  "adjudicatorId",
  "visibleMaterialPolicy",
  "preReadNotes",
  "completedBeforePeerDistributionExposure",
  "peerDistributionExposureBeforePreRead",
  "linkedAdjudicationMemoId",
  "timestamp",
];
const adjudicatorPreReadRequirednessPolicyRequiredFields = [
  "id",
  "policyVersion",
  "exposureOrderRule",
  "memoLinkageRule",
  "anchoringControlRule",
  "lmcaSourceBoundary",
  "frozenAt",
];
const adjudicationReviewSessionRequiredFields = [
  "id",
  "adjudicationCockpitSignoffPolicyId",
  "cockpitSignoffStatus",
  "originalRatingPreservationCheck",
  "memoSignoffGateStatus",
  "discussionThreadId",
  "scoreSpreadHeatmapVersion",
  "centXStrProductAllocationView",
  "verificationConflictSummary",
  "siblingContextDifferenceSummary",
  "preSubmitLintSummary",
  "finalizationStatus",
  "timestamp",
];
const adjudicationCockpitSignoffPolicyRequiredFields = [
  "id",
  "policyVersion",
  "finalMemoGateRule",
  "sourceBoundary",
  "frozenAt",
];
const adjudicationCockpitSignoffStatuses = [
  "ready_for_memo",
  "review_required",
  "blocked_missing_mandatory_views",
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
const rubricCopyTraceabilityReleaseCriticalScreens = ["rating", "practice", "calibration", "adjudication", "release_review"];
const rubricCopyTraceabilityRequiredEntries = ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"];
const rubricCopyTraceabilityRequiredClauses = [
  "appendix_f.centrality",
  "appendix_f.strength",
  "appendix_f.correctness",
  "appendix_f.clarity",
  "appendix_f.dead_weight",
  "appendix_f.single_issue",
  "appendix_f.overall",
];
const ratingTaskOutputUses = ["label_snapshot", "routing", "calibration", "adjudication", "training_export", "diagnostic"];
const ratingTaskOutputClasses = ["blind_initial_rating", "revision", "expert_check", "adjudication_label", "model_assisted_check", "draft"];
const ratingExcludedDenominatorClasses = ["draft", "safe_decline", "source_recognition_compromised", "model_assisted_check"];
const ratingPromotionRequirements = ["locked_initial", "valid_score_input_policy", "current_instruction_render", "no_stale_dependencies"];
const ratingProtectedSplitExclusions = ["hidden_benchmark", "protected_validation"];
const ratingScoreInputSplits = ["release_critical", "validation", "hidden_benchmark"];
const draftStorageLanes = ["protected", "validation", "hidden_benchmark", "release_critical", "adjudication", "rater_data_governance"];
const prohibitedDraftClientPersistence = ["local_storage", "session_storage", "indexed_db", "persistent_offline_cache", "downloaded_recovery_blob"];
const raterInstructionCompatibilityPolicyVersion = RATER_INSTRUCTION_COMPATIBILITY_POLICY_VERSION;
const raterInstructionCompatibilityClasses = REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_CLASSES;
const raterInstructionCompatibilityThresholds = REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_THRESHOLDS;
const raterInstructionCompatibilityRules = REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_RULES;
const raterInstructionSharedPolicyFields = REQUIRED_RATER_INSTRUCTION_SHARED_POLICY_FIELDS;
const scoreConfidenceScalePolicyVersion = SCORE_CONFIDENCE_SCALE_POLICY_VERSION;
const scoreConfidenceScaleVersion = REQUIRED_SCORE_CONFIDENCE_SCALE_VERSION;
const scoreConfidenceBands = REQUIRED_SCORE_CONFIDENCE_BANDS;
const scoreConfidenceNumericThresholds = REQUIRED_SCORE_CONFIDENCE_NUMERIC_THRESHOLDS;
const scoreConfidenceReasonCodes = REQUIRED_SCORE_CONFIDENCE_REASON_CODES;
const samePositionBatchReviewRequirednessPolicyVersion = SAME_POSITION_BATCH_REVIEW_REQUIREDNESS_POLICY_VERSION;
const samePositionBatchReviewTriggerClasses = REQUIRED_SAME_POSITION_BATCH_REVIEW_TRIGGER_CLASSES;
const samePositionBatchReviewThresholds = REQUIRED_SAME_POSITION_BATCH_REVIEW_THRESHOLDS;
const samePositionBatchReviewRules = REQUIRED_SAME_POSITION_BATCH_REVIEW_RULES;
const samePositionBatchReviewStatuses = REQUIRED_SAME_POSITION_BATCH_REVIEW_STATUSES;
const samePositionBatchReviewDecisionStatuses = REQUIRED_SAME_POSITION_BATCH_REVIEW_DECISION_STATUSES;
const rubricLintRules = [
  "missing_required_score",
  "clarity_branch_consistency",
  "correctness_strength_consistency",
  "centrality_strength_product_gap",
  "dead_weight_rationale",
  "verification_status_missing",
];
const rubricLintThresholdVersion = "rubric-lint-thresholds-rlhf90-v1";
const rubricLintAcknowledgementModes = ["acknowledge", "explain", "route_to_qa"];
const rubricLintTriggerThresholds = {
  missing_required_score: { missingScoreCountMin: 1 },
  clarity_branch_consistency: { clarityBelow: 0.5, provisionalNonClarityRequiresReview: true },
  correctness_strength_consistency: { correctnessMax: 0.25, strengthMin: 0.75 },
  centrality_strength_product_gap: { overallProductGapMin: 0.25 },
  dead_weight_rationale: { deadWeightMin: 0.7 },
  verification_status_missing: { correctnessSensitiveQueuesRequireStatus: true },
};
const certificationThresholdPolicyVersion = "certification-threshold-rlhf90-v1";
const certificationThresholds = {
  customWeightedLossMax: 0.14,
  pairwiseErrorMax: 0.14,
  duplicateInconsistencyMax: 0.12,
  meanAbsErrorMax: 0.14,
  perDimensionCalibrationErrorMax: 0.15,
  restrictionDimensionErrorMax: 0.2,
};
const certificationRemediationRules = {
  dimensionErrorAbovePerDimensionMax: "targeted_retraining_required_before_live_or_release_critical_rating",
  restrictionDimensionErrorAboveMax: "hold_matching_sensitive_assignments_until_recertified",
  duplicateInconsistencyAboveMax: "duplicate_consistency_review_required_before_tier_unlock",
  hardAmbiguityReviewFailure: "hard_ambiguity_review_required_before_tier_unlock",
  rubricVersionMismatch: "recertification_or_grandfathering_review_required",
};
const disagreementThresholdPolicyVersion = DISAGREEMENT_THRESHOLD_POLICY_VERSION;
const disagreementThresholds = REQUIRED_DISAGREEMENT_THRESHOLDS;
const disagreementEscalationRules = REQUIRED_DISAGREEMENT_ESCALATION_RULES;
const activeLearningSelectionPolicyVersion = ACTIVE_LEARNING_SELECTION_POLICY_VERSION;
const activeLearningSelectionThresholds = REQUIRED_ACTIVE_LEARNING_SELECTION_THRESHOLDS;
const activeLearningHandSelectionQuotas = REQUIRED_ACTIVE_LEARNING_HAND_SELECTION_QUOTAS;
const activeLearningSelectionReasonCodes = REQUIRED_ACTIVE_LEARNING_SELECTION_REASON_CODES;
const activeLearningRejectionReasonCodes = REQUIRED_ACTIVE_LEARNING_REJECTION_REASON_CODES;
const trainingExportUncertaintyPolicyVersion = TRAINING_EXPORT_UNCERTAINTY_POLICY_VERSION;
const trainingExportUncertaintyThresholds = REQUIRED_TRAINING_EXPORT_UNCERTAINTY_THRESHOLDS;
const trainingExportDownweightRules = REQUIRED_TRAINING_EXPORT_DOWNWEIGHT_RULES;
const itemTextNormalizationPolicyVersion = ITEM_TEXT_NORMALIZATION_POLICY_VERSION;
const itemTextNormalizationFieldPolicies = REQUIRED_ITEM_TEXT_NORMALIZATION_FIELD_POLICIES;
const itemTextNormalizationHashRules = REQUIRED_ITEM_TEXT_NORMALIZATION_HASH_RULES;
const itemTextNormalizationHashTargets = REQUIRED_ITEM_TEXT_NORMALIZATION_HASH_TARGETS;
const itemTextNormalizationProhibitedMutations = REQUIRED_ITEM_TEXT_NORMALIZATION_PROHIBITED_MUTATIONS;
const itemTextNormalizationReviewActions = REQUIRED_ITEM_TEXT_NORMALIZATION_REVIEW_ACTIONS;
const modelImprovementPolicyVersion = MODEL_IMPROVEMENT_POLICY_VERSION;
const modelImprovementMethods = REQUIRED_MODEL_IMPROVEMENT_METHODS;
const modelImprovementObjectiveFamilies = REQUIRED_MODEL_IMPROVEMENT_OBJECTIVE_FAMILIES;
const modelImprovementTargetFields = REQUIRED_MODEL_IMPROVEMENT_TARGET_FIELDS;
const modelImprovementProtectedSplitExclusions = REQUIRED_MODEL_IMPROVEMENT_PROTECTED_SPLIT_EXCLUSIONS;
const modelImprovementPolicyRules = REQUIRED_MODEL_IMPROVEMENT_POLICY_RULES;
const modelImprovementApprovalStatuses = REQUIRED_MODEL_IMPROVEMENT_APPROVAL_STATUSES;
const benchmarkRefreshPolicyVersion = BENCHMARK_REFRESH_POLICY_VERSION;
const benchmarkRefreshCadenceDaysByStatus = REQUIRED_BENCHMARK_REFRESH_CADENCE_DAYS_BY_STATUS;
const benchmarkRefreshActions = REQUIRED_BENCHMARK_REFRESH_ACTIONS;
const benchmarkRefreshQueueFields = REQUIRED_BENCHMARK_REFRESH_QUEUE_FIELDS;
const benchmarkRefreshPolicyRules = REQUIRED_BENCHMARK_REFRESH_POLICY_RULES;
const modelFamilyOverlapPolicyVersion = MODEL_FAMILY_OVERLAP_POLICY_VERSION;
const modelFamilyOverlapMatchBases = REQUIRED_MODEL_FAMILY_OVERLAP_MATCH_BASES;
const modelFamilyOverlapForbiddenBases = REQUIRED_MODEL_FAMILY_OVERLAP_FORBIDDEN_BASES;
const modelFamilyOverlapCleanClaimActions = REQUIRED_MODEL_FAMILY_OVERLAP_CLEAN_CLAIM_ACTIONS;
const modelFamilyOverlapPolicyRules = REQUIRED_MODEL_FAMILY_OVERLAP_POLICY_RULES;
const modelPromptSiblingContextPolicyVersion = MODEL_PROMPT_SIBLING_CONTEXT_POLICY_VERSION;
const modelPromptSiblingContextModes = REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_MODES;
const modelPromptSiblingContextEvidenceFields = REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_EVIDENCE_FIELDS;
const modelPromptSiblingContextRules = REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_RULES;
const modelRunReproducibilityPolicyVersion = MODEL_RUN_REPRODUCIBILITY_POLICY_VERSION;
const modelRunReproducibilityConfigFields = REQUIRED_MODEL_RUN_REPRODUCIBILITY_CONFIG_FIELDS;
const modelRunReproducibilityEnvironmentFields = REQUIRED_MODEL_RUN_REPRODUCIBILITY_ENVIRONMENT_FIELDS;
const modelRunReproducibilityRules = REQUIRED_MODEL_RUN_REPRODUCIBILITY_RULES;
const externalAssistanceContaminationPolicyVersion = EXTERNAL_ASSISTANCE_CONTAMINATION_POLICY_VERSION;
const externalAssistanceTypes = REQUIRED_EXTERNAL_ASSISTANCE_TYPES;
const externalAssistanceContaminatingTypes = REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATING_TYPES;
const externalAssistanceContaminationRoutes = REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATION_ROUTES;
const externalAssistanceCleanRoutes = REQUIRED_EXTERNAL_ASSISTANCE_CLEAN_ROUTES;
const externalAssistanceAccessibilityStatuses = REQUIRED_EXTERNAL_ASSISTANCE_ACCESSIBILITY_STATUSES;
const externalAssistanceContaminationRules = REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATION_RULES;
const rationaleEvidenceSpanRequirednessPolicyVersion = RATIONALE_EVIDENCE_SPAN_REQUIREDNESS_POLICY_VERSION;
const rationaleEvidenceSpanMandatoryTriggerClasses = REQUIRED_RATIONALE_EVIDENCE_SPAN_MANDATORY_TRIGGER_CLASSES;
const rationaleEvidenceSpanRequirednessThresholds = REQUIRED_RATIONALE_EVIDENCE_SPAN_REQUIREDNESS_THRESHOLDS;
const rationaleEvidenceSpanCoverageRules = REQUIRED_RATIONALE_EVIDENCE_SPAN_COVERAGE_RULES;
const comparabilityClaimTiers = [
  "method_preserving",
  "corpus_scale_comparable",
  "source_topic_rater_comparable",
  "exact_position_source_count_comparable",
  "topic_family_comparable",
  "rater_contribution_comparable",
  "adapted_source_language_task_format_comparable",
  "metric_denominator_comparable",
  "target_label_comparable",
  "validation_design_comparable",
  "validation_ceiling_comparable",
  "model_score_anchor_comparable",
  "prompt_family_source_scope_comparable",
  "model_snapshot_comparable",
  "protected_split_leakage_comparable",
  "replication_like",
];
const comparabilityTierPolicyVersion = "comparability-tier-rlhf90-v1";
const comparabilityTierStatusOrder = ["fails", "partial", "passes"];
const comparabilityTierThresholds = {
  method_preserving: {
    pass: { sourceCriticalCoreGatePassCountMin: 5, requiredMetricFamilyCountMin: 2 },
    partial: { sourceCriticalCoreGatePassCountMin: 4, requiredMetricFamilyCountMin: 1 },
    fail: { sourceCriticalCoreGatePassCountMax: 3 },
  },
  corpus_scale_comparable: {
    pass: { positionsWithAtLeastOneCritiqueMin: 442, critiquesMin: 951, ratingsIgnoringRevisionsMin: 1458 },
    partial: { positionsWithAtLeastOneCritiqueMin: 120, critiquesMin: 360, blindInitialRatingsMin: 1440 },
    fail: { positionsWithAtLeastOneCritiqueMax: 119 },
  },
  source_topic_rater_comparable: {
    pass: { topicFamiliesCoveredMin: 6, positionSourceCategoriesCoveredMin: 6, raterContributionRowsMin: 6 },
    partial: { topicFamiliesCoveredMin: 3, positionSourceCategoriesCoveredMin: 3, raterContributionRowsMin: 3 },
    fail: { topicFamiliesCoveredMax: 2 },
  },
  exact_position_source_count_comparable: {
    pass: { exactLmcaSourceCategoryCountMatchesMin: 6, totalPositionsMin: 442 },
    partial: { sourceCategoriesCoveredMin: 4, knownOtherDatasetSubsourceRowsMin: 2 },
    fail: { sourceCategoriesCoveredMax: 3 },
  },
  topic_family_comparable: {
    pass: { lmcaTopicFamiliesCoveredMin: 6 },
    partial: { lmcaTopicFamiliesCoveredMin: 3 },
    fail: { lmcaTopicFamiliesCoveredMax: 2 },
  },
  rater_contribution_comparable: {
    pass: { knownLmcaRaterRowsComparedMin: 6, largestSingleRaterShareMax: 0.649 },
    partial: { submittedRaterProfilesMin: 4, individualRaterDominanceReported: 1 },
    fail: { submittedRaterProfilesMax: 3 },
  },
  adapted_source_language_task_format_comparable: {
    pass: { adaptedSourceDisclosureFieldsMin: 5, knownSubsourceRowsMin: 2, machineTranslationStatusRowsMin: 1 },
    partial: { adaptedSourceDisclosureFieldsMin: 3, knownSubsourceRowsMin: 1 },
    fail: { adaptedSourceDisclosureFieldsMax: 2 },
  },
  metric_denominator_comparable: {
    pass: { weightedPairwisePositionsMin: 255, weightedPairwiseCritiquePairsMin: 856, customMetricDialoguesMin: 933 },
    partial: { weightedPairwisePositionsMin: 52, weightedPairwiseCritiquePairsMin: 100, customMetricDialoguesMin: 120 },
    fail: { weightedPairwiseCritiquePairsMax: 99 },
  },
  target_label_comparable: {
    pass: { primaryRaterAnchorSnapshotsMin: 1, targetLabelVersionPrimaryRaterAnchorRequired: 1 },
    partial: { pairedPrimaryAndConsensusSnapshotsMin: 1 },
    fail: { primaryRaterAnchorSnapshotsMax: 0 },
  },
  validation_design_comparable: {
    pass: { validationCritiquesMin: 52, validationPositionsMin: 19, coreAllItemsRatersMin: 4 },
    partial: { validationCritiquesMin: 26, validationPositionsMin: 10, coreAllItemsRatersMin: 2 },
    fail: { validationCritiquesMax: 25 },
  },
  validation_ceiling_comparable: {
    pass: { appendixCNumericBaselineSectionsMin: 5, humanCeilingRunsMin: 1, intervalMetadataComplete: 1 },
    partial: { appendixCNumericBaselineSectionsMin: 3, humanCeilingRunsMin: 1 },
    fail: { humanCeilingRunsMax: 0 },
  },
  model_score_anchor_comparable: {
    pass: { table5WeightedPairwiseAnchorsMin: 4, table7CustomMetricAnchorsMin: 3, cleanLeaderboardRunsMin: 1 },
    partial: { table5WeightedPairwiseAnchorsMin: 4, table7CustomMetricAnchorsMin: 3 },
    fail: { table5WeightedPairwiseAnchorsMax: 3 },
  },
  prompt_family_source_scope_comparable: {
    pass: { commonPromptPolicyRowsMin: 1, appendixGExactBaselineRowsMin: 1, promptScopeSensitivityRowsMin: 1 },
    partial: { promptPolicyRowsMin: 1 },
    fail: { promptPolicyRowsMax: 0 },
  },
  model_snapshot_comparable: {
    pass: { resolvedModelSnapshotShareMin: 1, aliasStabilityRowsMin: 1 },
    partial: { resolvedModelSnapshotShareMin: 0.5 },
    fail: { resolvedModelSnapshotShareMax: 0.49 },
  },
  protected_split_leakage_comparable: {
    pass: { protectedLeakageIncidentMax: 0, accessAuditRowsMin: 1, protectedSplitIsolationFailuresMax: 0 },
    partial: { accessAuditRowsMin: 1 },
    fail: { protectedLeakageIncidentMin: 1 },
  },
  replication_like: {
    pass: { passingComparabilityTierCountMin: 15, failingComparabilityTierCountMax: 0 },
    partial: { passingComparabilityTierCountMin: 12, failingComparabilityTierCountMax: 2 },
    fail: { failingComparabilityTierCountMin: 3 },
  },
};
const partialTaskOutputTypes = [
  "pairwise_preference_only",
  "clarity_triage",
  "dead_weight_triage",
  "verification_only",
  "practice",
  "safe_decline",
  "discussion_comment",
];
const partialTaskExcludedDenominators = [
  "full_rubric_blind_rating_count",
  "custom_loss_target",
  "hidden_benchmark_label",
  "human_ceiling_denominator",
];
const spotCheckSamplingDimensions = ["source_family", "topic", "item_length", "rater_tier", "score_band"];
const spotCheckSelectionMethods = ["random", "stratified_random"];
const spotCheckResultStatuses = ["passed_without_label_change", "routed_to_revision", "routed_to_adjudication", "escalated_quality_issue"];
const spotCheckSamplingPolicyVersion = SPOT_CHECK_SAMPLING_POLICY_VERSION;
const spotCheckSamplingStrata = REQUIRED_SPOT_CHECK_SAMPLING_STRATA;
const spotCheckMinimumRateByStratum = REQUIRED_SPOT_CHECK_MINIMUM_RATE_BY_STRATUM;
const spotCheckMinimumCountByStratum = REQUIRED_SPOT_CHECK_MINIMUM_COUNT_BY_STRATUM;
const exposureQuarantinePolicyVersion = EXPOSURE_QUARANTINE_POLICY_VERSION;
const exposureQuarantineTriggerClasses = REQUIRED_EXPOSURE_QUARANTINE_TRIGGER_CLASSES;
const exposureQuarantineAssignmentChecks = REQUIRED_EXPOSURE_QUARANTINE_ASSIGNMENT_CHECKS;
const exposureQuarantineActions = REQUIRED_EXPOSURE_QUARANTINE_ACTIONS;
const exposureQuarantineReviewStatuses = REQUIRED_EXPOSURE_QUARANTINE_REVIEW_STATUSES;
const exposureQuarantineEffects = REQUIRED_EXPOSURE_QUARANTINE_EFFECTS;
const positionClusterExposureSources = [
  "own_rating",
  "peer_score",
  "peer_rationale",
  "post_lock_discussion",
  "adjudication_memo",
  "gold_feedback",
  "practice_feedback",
  "source_metadata",
  "model_judge_output",
  "model_assisted_check",
  "protected_label",
  "hidden_benchmark_access",
  "external_assistance",
  "declared_custom",
];
const adjudicationTriageLanes = [
  "release_blocking_disagreement",
  "low_clarity",
  "correctness_verification",
  "interpretation_dispute",
  "benchmark_candidate_review",
  "spot_check_qa",
  "training_feedback",
];
const raterItemConflictTypes = [
  "authored_position",
  "authored_critique",
  "generated_critique",
  "submitted_source",
  "selected_or_adapted_source",
  "item_selection_exposure",
  "edited_item",
  "source_family_exposure",
  "adaptation_family_exposure",
  "near_duplicate_exposure",
  "public_example_exposure",
  "prior_exposure",
  "close_collaboration_or_conflict",
  "declared_custom",
];
const sourceFamilyClusteringPolicyVersion = SOURCE_FAMILY_CLUSTERING_POLICY_VERSION;
const sourceFamilyClusteringThresholds = REQUIRED_SOURCE_FAMILY_CLUSTERING_THRESHOLDS;
const nearDuplicateClusteringThresholds = REQUIRED_NEAR_DUPLICATE_CLUSTERING_THRESHOLDS;
const sourceFamilyClusterFields = REQUIRED_SOURCE_FAMILY_CLUSTER_FIELDS;
const sourceFamilyClusteringReviewStatuses = REQUIRED_SOURCE_FAMILY_CLUSTERING_REVIEW_STATUSES;
const releaseErratumTypes = [
  "scoring_bug",
  "source_leakage_defect",
  "rights_provenance_issue",
  "corrupted_text",
  "denominator_error",
  "configuration_manifest_error",
  "other",
];
const releaseErratumDisclosurePolicyVersion = "release-erratum-disclosure-rlhf90-v1";
const releaseErratumDisclosureThresholds = {
  scoring_bug: "public_erratum_and_superseding_artifact_required",
  source_leakage_defect: "public_erratum_api_warning_and_protected_incident_review_required",
  rights_provenance_issue: "public_erratum_export_block_until_rights_review_required",
  corrupted_text: "public_erratum_required_when_published_or_release_critical",
  denominator_error: "public_erratum_and_metric_claim_warning_required",
  configuration_manifest_error: "public_erratum_and_manifest_supersession_required",
  other: "internal_audit_allowed_only_when_no_published_export_denominator_rights_source_metric_leaderboard_or_claim_change",
};
const releaseErratumApiWarningTypes = [
  "scoring_bug",
  "source_leakage_defect",
  "rights_provenance_issue",
  "corrupted_text",
  "denominator_error",
  "configuration_manifest_error",
];
const releaseErratumExportBlockTypes = ["source_leakage_defect", "rights_provenance_issue"];
const scheduleSnapshotStatuses = ["not_started", "in_progress", "complete", "blocked", "rebaselined", "dropped"];
const scheduleRebaselinePolicyVersion = "schedule-rebaseline-rlhf90-v1";
const scheduleRebaselineDelayThresholdDays = {
  minorSlipMaxDays: 6,
  significantSlipMinDays: 7,
  majorSlipMinDays: 21,
};
const scheduleRebaselineRules = {
  slipUnderSevenDays: "keep_original_milestone_with_delay_note_no_completion_claim_until_complete",
  slipSevenToTwentyDays: "blocked_or_in_progress_requires_recovery_plan_owner_review_and_updated_risk_disclosure",
  slipTwentyOneDaysOrMore: "rebaselined_status_requires_new_date_scope_and_two_person_release_review",
  scopeOrTargetChange: "rebaselined_status_required_with_scope_delta_and_compressed_scope_label_update",
  rebaselinedCompletionClaim: "original_dated_milestone_completion_claim_forbidden_superseding_schedule_only",
};
const requiredRebaselinedSnapshotFields = [
  "rebaselinedDate",
  "rebaselinedScope",
  "rebaselineReason",
  "previousPlannedEnd",
  "newPlannedEnd",
  "rebaselineApprovalRecordIds",
];
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
const policyBundleFieldClasses = [
  "source_metadata",
  "admin_tags",
  "benchmark_membership",
  "gold_answers",
  "peer_ratings",
  "peer_rationales",
  "model_judge_scores",
  "active_learning_selection_reasons",
  "rater_identity",
  "rater_role",
  "discussion_identity",
  "verification_evidence",
  "volunteer_performance_metadata",
];
const visibilityRoleFieldActionMatrix = REQUIRED_VISIBILITY_ROLE_FIELD_ACTION_MATRIX;
const ratingWorkflowTaskModes = [
  "ordinary_live",
  "validation",
  "gold_certification",
  "hidden_benchmark",
  "low_clarity",
  "verification",
  "interpretation_dispute",
  "adjudication",
];
const rubricDimensions = ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"];
const protectedUiLaneClasses = ["validation", "hidden_benchmark", "gold_certification", "release_critical"];
const blockedUiExperimentClasses = [
  "score_controls",
  "anchor_panel_copy",
  "lint_behavior",
  "issue_panel_requiredness",
  "example_visibility",
  "layout_density",
  "accessibility_variant",
  "score_affecting_wording",
];
const prohibitedAssistInputs = [
  "target_scores",
  "gold_answers",
  "peer_scores",
  "model_judge_scores",
  "adjudicated_labels",
  "benchmark_membership",
  "protected_split_status",
];
const accessibilitySurfaces = ["rating", "practice", "discussion", "adjudication", "consent", "withdrawal"];
const accessibilityChecks = [
  "keyboard",
  "screen_reader",
  "focus_order",
  "non_color_status",
  "zoom",
  "mobile_touch",
  "reduced_motion",
  "timeout_recovery",
  "locale_sensitive_dates",
  "readability",
];
const accessibilityToolingPolicyVersion = ACCESSIBILITY_TOOLING_POLICY_VERSION;
const accessibilityWcagConformanceTarget = REQUIRED_ACCESSIBILITY_WCAG_CONFORMANCE_TARGET;
const accessibilityTestToolchain = REQUIRED_ACCESSIBILITY_TEST_TOOLCHAIN;
const accessibilityAssistiveTechnologyMatrix = REQUIRED_ACCESSIBILITY_ASSISTIVE_TECH_MATRIX;
const accessibilityEvidenceArtifactTypes = REQUIRED_ACCESSIBILITY_EVIDENCE_ARTIFACT_TYPES;
const raterUxAcceptanceChecks = REQUIRED_RATER_UX_ACCEPTANCE_CHECKS;
const qualificationScopes = ["expert_rating", "adjudicator", "topic_specialist", "hidden_benchmark_expert", "primary_rater_anchor"];
const qualificationSources = ["credential", "certification_pack", "prior_rating_reliability", "manual_expert_review", "approved_exception"];
const qualificationWorkflowEligibility = ["release_critical", "validation", "hidden_benchmark"];
const prohibitedIncentiveSignals = [
  "rating_direction",
  "peer_agreement_before_feedback",
  "model_agreement",
  "gold_performance_before_permitted_feedback",
  "speed_beyond_qa_band",
  "hidden_benchmark_performance",
  "accepted_revision_count",
  "leaderboard_rank",
];
const volunteerIncentivePolicyVersion = "volunteer-incentive-rlhf90-v2";
const compensationRateUsdByEligibleUnit = {
  ordinaryRating: 12,
  releaseCriticalRating: 18,
  practiceOrCalibrationSession: 8,
  trainingModuleCompletion: 10,
  validSafeDeclineOrConflictDisclosure: 3,
  postLockDiscussionParticipation: 15,
  correctnessVerificationWorkspace: 20,
  adjudicationMemo: 35,
};
const compensationCurrency = "USD";
const monthlyCompensationCapUsd = 600;
const compensationEligibilityPolicy =
  "pay only QA-accepted eligible work units, approved training completion, and valid safe-decline or conflict disclosures; never pay for score direction, agreement, rank, or hidden-benchmark performance";
const payrollLegalImplementationPolicy =
  "US pilot uses counsel-reviewed contractor or stipend classification, tax onboarding before paid work, and jurisdiction-specific payroll approval before non-US payments";
const paymentDataSeparationPolicy =
  "payment identity, tax, and payout account data stay in the payroll system outside annotation events; annotation records store only payment eligibility ids";
const languageArtifactTypes = [
  "non_native_wording",
  "dialect_or_register",
  "machine_translation_residue",
  "typo_or_grammar_noise",
  "OCR_or_formatting_noise",
  "awkward_but_determinate",
];
const sourceRecognitionTypes = [
  "source_recognized",
  "author_or_style_recognized",
  "prior_coursework_or_forum_exposure",
  "model_generation_route_recognized",
  "other_prior_exposure",
];
const sourceRecognitionActions = ["safe_decline", "continue_nonblind", "request_review"];
const sourceRecognitionBlindEffectFragments = ["excluded", "blocked", "nonblind", "non_blind", "non_independent", "paused", "reassign", "review"];
const blindDenominatorCountingForbiddenFragments = ["count_as_independent", "count as independent", "counts_as_independent", "counts as independent", "fresh blind", "fresh_blind"];
const sourceRecognitionForbiddenBlindEffectFragments = blindDenominatorCountingForbiddenFragments;
const modelProviderRunClasses = ["model_evaluation", "model_judge", "critique_generation", "model_assisted_check"];
const modelProviderEndpointContractPolicyVersion = MODEL_PROVIDER_ENDPOINT_CONTRACT_POLICY_VERSION;
const modelProviderEndpointContractClauses = REQUIRED_MODEL_PROVIDER_ENDPOINT_CONTRACT_CLAUSES;
const protectedArtifactTypes = ["prompt", "response", "log", "cache", "backup", "staging_replay"];
const policyActionKinds = [
  "protected_render",
  "assignment_issue",
  "rating_lock",
  "revision_submit",
  "discussion_open",
  "adjudication_finalize",
  "label_snapshot_freeze",
  "pairwise_snapshot_freeze",
  "evaluation_run",
  "hidden_benchmark_aggregate_report",
  "release_freeze",
  "training_export",
  "unblinding",
  "deprotection",
  "governance_action",
  "manifest_activation",
];
const phaseGateLaneKinds = [
  "route",
  "worker",
  "queue",
  "ui_panel",
  "export_path",
  "evaluation_lane",
  "hidden_benchmark_submission_lane",
  "governance_action",
];
const phaseGateStates = ["enabled", "staff_only", "shadow", "disabled_stub", "blocked"];
const phaseGateSideEffectEnabledStates = new Set(["enabled", "staff_only"]);
const phaseGateStaffRoles = ["admin", "auditor"];
const phaseGateGovernanceResourceKeys = new Set([
  "governanceApprovalRecord",
  "governedBundleCanonicalizationProfile",
  "governedBundleRecord",
  "governedBundleVerification",
  "releaseConfigManifest",
  "releaseConfigManifestVerification",
  "policyActionKind",
  "policyDecisionRecord",
  "policyDecisionConsumption",
  "implementationPhaseGateBundle",
  "externalWormAuditLogPolicy",
  "sensitiveAuditChainEvent",
  "sensitiveAuditChainVerification",
]);
const phaseGateQueueResourceKeys = new Set([
  "assignment",
  "assignmentSelectionAudit",
  "queuePolicySnapshot",
  "queueFreshnessPolicy",
  "queueStaleByDelayScan",
  "workflowStateTransitionLog",
]);
const phaseGateUiPanelResourceKeys = new Set([
  "screenStatePayload",
  "uxSimplificationPolicy",
  "uxSimplificationReview",
  "clientSurfaceIntegrityPolicy",
  "clientSurfaceIntegrityCheck",
  "screenFeatureParityCheck",
  "simplifiedCopyPreview",
  "rubricCopyTraceabilityMap",
  "raterInstructionCompatibilityPolicy",
  "raterInstructionRenderVersion",
  "rubricLintConfig",
  "rubricLintEvent",
]);
const phaseGateExportResourceKeys = new Set(["exportManifest", "trainingExport", "modelImprovementRun"]);
const phaseGateEvaluationResourceKeys = new Set([
  "evaluationRun",
  "modelEvaluationPrediction",
  "calibrationRun",
  "artifactProbeRun",
  "sycophancyProbeRun",
  "obfuscationStressRun",
  "sanityBaselineRun",
  "humanCeilingRun",
  "validationTrancheEvidence",
  "leaderboard",
  "modelFailureAudit",
  "modelProviderDataHandlingPolicy",
  "modelRunReproducibilityPolicy",
  "modelInferenceConfig",
  "modelRunEnvironment",
]);
const phaseGateWorkerResourceKeys = new Set([
  "candidateBatch",
  "candidateCritique",
  "modelJudgeScore",
  "modelJudgeScores",
  "activeLearningSelectionAudit",
  "candidateReview",
  "candidatePromotion",
  "critiqueGenerationRun",
  "generatedCritiqueSubmission",
  "generatedCritiquePromotion",
  "generationEvaluationReport",
]);
const phaseGateHiddenBenchmarkSubmissionResourceKeys = new Set(["benchmarkSubmissionPolicy", "benchmarkSubmission"]);
const queueFreshnessLanes = [
  "assignment",
  "draft",
  "discussion",
  "adjudication",
  "model_evaluation_job",
  "hidden_benchmark_submission",
  "export",
  "outbox",
  "delayed_report",
];
const queueRevalidationChecks = [
  "item_text",
  "rubric",
  "ui_render",
  "workflow",
  "split_protection",
  "release_config_manifest",
  "rater_eligibility",
  "artifact_dependency",
];
const queueHealthChecks = [
  "dependency_version_drift",
  "age_window",
  "backpressure_depth",
  "authorization_current",
  "side_effect_suppression",
];
const queueStaleTransitionOutcomes = ["dependency_change_blocked", "age_window_enforced", "backpressure_window_enforced"];
const queueStaleBehaviors = ["stale", "paused", "pause", "cancel", "cancelled", "recompute", "suppress"];
const clientSurfaces = ["rating", "practice", "discussion", "adjudication", "calibration", "release_review", "hidden_benchmark_submission", "rater_data_governance"];
const clientSurfaceRequiredChecks = [
  "no_third_party_analytics",
  "no_third_party_pixels",
  "no_third_party_resources",
  "no_session_replay",
  "no_heatmaps",
  "no_dom_capture",
  "no_keystroke_logging",
  "no_sensitive_url_ids",
  "referrer_policy",
  "no_persistent_offline_cache",
  "first_party_telemetry_allowlist",
  "screen_state_output_schema_binding",
  "csp",
];
const cloudSecurityBudgetPolicyVersion = CLOUD_SECURITY_BUDGET_POLICY_VERSION;
const cloudSecurityBudgetRangeUsd = REQUIRED_CLOUD_SECURITY_BUDGET_RANGE_USD;
const cloudSecurityBudgetCategoryMinimumUsd = REQUIRED_CLOUD_SECURITY_BUDGET_CATEGORY_MINIMUM_USD;
const cloudSecurityControls = REQUIRED_CLOUD_SECURITY_CONTROLS;
const cloudSecurityApprovalStatuses = REQUIRED_CLOUD_SECURITY_APPROVAL_STATUSES;
const externalWormAuditLogPolicyVersion = EXTERNAL_WORM_AUDIT_LOG_POLICY_VERSION;
const externalWormAuditLedgerBackend = REQUIRED_EXTERNAL_WORM_AUDIT_LEDGER_BACKEND;
const externalWormAuditPointerPrefix = REQUIRED_EXTERNAL_WORM_AUDIT_POINTER_PREFIX;
const externalWormAuditReceiptHashAlgorithm = REQUIRED_EXTERNAL_WORM_AUDIT_RECEIPT_HASH_ALGORITHM;
const externalWormAuditReceiptFields = REQUIRED_EXTERNAL_WORM_AUDIT_RECEIPT_FIELDS;
const externalWormAuditRetentionYears = REQUIRED_EXTERNAL_WORM_AUDIT_RETENTION_YEARS;
const externalWormAuditVerificationCadence = REQUIRED_EXTERNAL_WORM_AUDIT_VERIFICATION_CADENCE;
const externalWormAuditFallbackRule = REQUIRED_EXTERNAL_WORM_AUDIT_FALLBACK_RULE;
const auditChainEventKinds = [
  "governance_approval",
  "manifest_activation",
  "protected_label_access",
  "unblinding",
  "deprotection",
  "hidden_benchmark_release",
  "training_export_release",
];
const auditChainPolicyActionKindByEventKind = {
  governance_approval: "governance_action",
  manifest_activation: "manifest_activation",
  protected_label_access: "protected_render",
  unblinding: "unblinding",
  deprotection: "deprotection",
  hidden_benchmark_release: "hidden_benchmark_aggregate_report",
  training_export_release: "training_export",
};
const auditChainProtectedDataExposureClasses = [
  "redacted_metadata_only",
  "protected_label_access_redacted",
  "unblinding_redacted",
  "deprotection_redacted",
  "hidden_benchmark_release_redacted",
  "training_export_release_redacted",
];
const releaseConfigBindings = [
  "code",
  "rubric",
  "scoring",
  "visibility",
  "workflow",
  "ui_render",
  "ux_simplification",
  "lint",
  "assist",
  "queue",
  "split",
  "rights_provenance",
  "item_text",
  "rating_context",
  "label",
  "pairwise",
  "parser",
  "prompt",
  "metric",
  "score_input",
  "export_policy",
];
const raterDashboardPolicyRequiredFields = [
  "id",
  "policyVersion",
  "feedbackVisibilityPolicy",
  "protectedLabelBoundary",
  "remediationRoutingRule",
  "assignmentEligibilityRule",
  "sourceBoundary",
  "frozenAt",
];
const raterLearningPlanRequiredFields = [
  "id",
  "raterDashboardPolicyId",
  "raterId",
  "rubricVersion",
  "certificationPackVersion",
  "practiceGoldDuplicatePerformanceSummaries",
  "perDimensionDriftSummary",
  "assignedRemediationModules",
  "currentAssignmentRestrictionsUnlocks",
  "dashboardVisibilityStatus",
  "remediationRoutingStatus",
  "feedbackArtifactsShown",
  "protectedLabelExposureCheck",
  "timestamp",
];
const diagnosticDeferralVisibilityPolicyRequiredFields = [
  "id",
  "policyVersion",
  "publicSummaryRule",
  "privateOnlyRule",
  "protectedContentRule",
  "approvalRule",
  "sourceBoundary",
  "frozenAt",
];
const rightsClearancePolicyVersion = "rights-clearance-rlhf90-v1";
const rightsLegalBases = ["project_owned", "public_domain", "open_license", "explicit_permission", "fair_use_memo", "internal_only_restricted"];
const rightsEvidenceByLegalBasis = {
  project_owned: ["authorship_attestation", "contributor_license_or_assignment", "third_party_content_check"],
  public_domain: ["public_domain_basis", "jurisdiction_or_publication_date", "source_url_or_archive"],
  open_license: ["license_identifier", "license_text_or_url", "attribution_requirements", "commercial_derivative_benchmark_use_allowed"],
  explicit_permission: ["permission_grant", "permitted_release_scopes", "revocation_or_expiry_terms"],
  fair_use_memo: ["factor_analysis", "excerpt_minimization", "public_release_risk_review", "fallback_removal_plan"],
  internal_only_restricted: ["internal_use_basis", "raw_public_release_block", "access_control_plan"],
};
const rightsScopeStandards = {
  public: "explicit_public_export_public_summary_and_attribution_allowed",
  training: "training_or_model_improvement_export_allowed_without_provider_training_conflict",
  hidden_benchmark: "internal_hidden_benchmark_use_allowed_raw_public_release_blocked",
  internal: "internal_research_review_and_adjudication_use_allowed",
};
const rightsTakedownOrRemovalSlaDays = 14;
const governedBundleFamilies = [
  "rubric",
  "scoring",
  "visibility",
  "workflow",
  "ui_render",
  "lint",
  "assist",
  "score_input",
  "queue",
  "split",
  "output_schema",
  "prompt",
  "parser",
  "metric",
  "export_policy",
  "phase_gate",
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
  workflowWriteSpec(/^\/api\/v1\/rights\/review$/, "rights_review_submitted", "rightsReview", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "rightsClearancePolicyId", "reviewerId", "rightsStatus", "releaseScope"],
    requiredAnyFields: [["positionId", "itemId", "artifactId"]],
  }),
  workflowWriteSpec(/^\/api\/v1\/rights-clearance-policies$/, "rights_clearance_policy_submitted", "rightsClearancePolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "allowedLegalBases",
      "requiredEvidenceByLegalBasis",
      "releaseScopeStandards",
      "takedownOrRemovalSlaDays",
      "publicReleaseRule",
      "hiddenBenchmarkRule",
      "reviewerIndependenceRule",
      "frozenAt",
    ],
    requiredObjectFields: ["requiredEvidenceByLegalBasis", "releaseScopeStandards"],
    requiredObjectKeys: {
      requiredEvidenceByLegalBasis: rightsLegalBases,
      releaseScopeStandards: Object.keys(rightsScopeStandards),
    },
    requiredStructuredFields: {
      requiredEvidenceByLegalBasis: rightsEvidenceByLegalBasis,
      releaseScopeStandards: rightsScopeStandards,
    },
    requiredArrayIncludes: { allowedLegalBases: rightsLegalBases },
    requiredStringIncludes: {
      publicReleaseRule: ["public", "training", "evidence", "removal"],
      hiddenBenchmarkRule: ["hidden", "raw public release", "access control"],
      reviewerIndependenceRule: ["independent"],
    },
    requiredExactFields: {
      policyVersion: rightsClearancePolicyVersion,
      takedownOrRemovalSlaDays: rightsTakedownOrRemovalSlaDays,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/releases\/freeze$/, "release_freeze_submitted", "releaseFreeze", adminRoles, {
    allowHiddenMetadata: true,
    policyActionKind: "release_freeze",
    phaseGateLaneKind: "governance_action",
  }),
  workflowWriteSpec(/^\/api\/v1\/certification-threshold-policies$/, "certification_threshold_policy_submitted", "certificationThresholdPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "thresholds",
      "remediationRules",
      "certificationStatusRule",
      "retrainingRule",
      "restrictionRule",
      "recertificationRule",
      "frozenAt",
    ],
    requiredObjectFields: ["thresholds", "remediationRules"],
    requiredObjectKeys: {
      thresholds: Object.keys(certificationThresholds),
      remediationRules: Object.keys(certificationRemediationRules),
    },
    requiredStructuredFields: {
      thresholds: certificationThresholds,
      remediationRules: certificationRemediationRules,
    },
    requiredStringIncludes: {
      certificationStatusRule: ["mean absolute error", "certified"],
      retrainingRule: ["dimension", "retraining"],
      restrictionRule: ["restriction"],
      recertificationRule: ["rubric", "recertification"],
    },
    requiredExactFields: { policyVersion: certificationThresholdPolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/certification-records$/, "certification_record_submitted", "certificationRecord", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "raterId",
      "packVersion",
      "certificationThresholdPolicyId",
      "rubricVersion",
      "protectedSplitConflictCheck",
      "recertificationReason",
      "tierUnlocked",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["goldItemIds", "duplicateItemIds", "hardAmbiguityItemIds"],
    requiredObjectFields: ["perDimensionCalibrationErrorProfile"],
    requiredFiniteNumberFields: ["customWeightedLoss", "pairwiseError", "duplicateInconsistency"],
    requiredNumberRanges: [
      { field: "customWeightedLoss", min: 0, max: 1 },
      { field: "pairwiseError", min: 0, max: 1 },
      { field: "duplicateInconsistency", min: 0, max: 1 },
    ],
    requiredExactFields: { trainingExposureAcknowledged: true },
    requiredStringIncludes: {
      protectedSplitConflictCheck: ["hidden", "validation"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/exposure-logs$/, "exposure_log_submitted", "exposureLog", adminRoles, { rejectRawBenchmarkContent: true }),
  workflowWriteSpec(/^\/api\/v1\/revisions$/, "revision_record_submitted", "revisionRecord", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "ratingIdPrior", "ratingIdNew", "reasonCode", "revisionComment", "discussionThreadId", "timestamp"],
    requiredDistinctFieldSets: [["ratingIdPrior", "ratingIdNew"]],
  }),
  workflowWriteSpec(
    /^\/api\/v1\/item-text-normalization-policies$/,
    "item_text_normalization_policy_submitted",
    "itemTextNormalizationPolicy",
    adminRoles,
    {
      requiredFields: [
        "id",
        "policyVersion",
        "fieldPolicies",
        "hashRules",
        "hashTargets",
        "prohibitedMutations",
        "reviewActions",
        "raterVisibleRule",
        "modelVisibleRule",
        "sourceBoundary",
        "frozenAt",
      ],
      requiredObjectFields: ["fieldPolicies", "hashRules"],
      requiredObjectKeys: {
        fieldPolicies: Object.keys(itemTextNormalizationFieldPolicies),
        hashRules: Object.keys(itemTextNormalizationHashRules),
      },
      requiredStructuredFields: {
        fieldPolicies: itemTextNormalizationFieldPolicies,
        hashRules: itemTextNormalizationHashRules,
      },
      requiredNonEmptyArrayFields: ["hashTargets", "prohibitedMutations", "reviewActions"],
      requiredArrayIncludes: {
        hashTargets: itemTextNormalizationHashTargets,
        prohibitedMutations: itemTextNormalizationProhibitedMutations,
        reviewActions: itemTextNormalizationReviewActions,
      },
      allowedArrayValues: {
        hashTargets: itemTextNormalizationHashTargets,
        prohibitedMutations: itemTextNormalizationProhibitedMutations,
        reviewActions: itemTextNormalizationReviewActions,
      },
      requiredStringIncludes: {
        raterVisibleRule: ["source", "admin", "hidden"],
        modelVisibleRule: ["prompt", "item text", "hidden"],
        sourceBoundary: ["project", "lmca"],
      },
      requiredExactFields: { policyVersion: itemTextNormalizationPolicyVersion },
    },
  ),
  workflowWriteSpec(/^\/api\/v1\/item-text-versions$/, "item_text_version_submitted", "itemTextVersion", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "itemType",
      "itemId",
      "canonicalText",
      "canonicalTextHash",
      "raterVisibleRenderedTextHash",
      "modelVisibleRenderedTextHash",
      "raterVisibleVersionLabel",
      "hashDisplayVisibilityPolicy",
      "normalizationStatus",
      "diffFromPriorVersionOrSourceArtifact",
      "sourceProvenanceLink",
      "createdBy",
      "createdAt",
    ],
    allowedValues: { itemType: ["position", "critique"] },
    requiredStringPrefixes: {
      canonicalTextHash: "sha256:",
      raterVisibleRenderedTextHash: "sha256:",
      modelVisibleRenderedTextHash: "sha256:",
    },
  }),
  workflowWriteSpec(
    /^\/api\/v1\/model-prompt-sibling-context-policies$/,
    "model_prompt_sibling_context_policy_submitted",
    "modelPromptSiblingContextPolicy",
    adminRoles,
    {
      requiredFields: [
        "id",
        "policyVersion",
        "allowedComparisonModes",
        "requiredEvidenceFields",
        "policyRules",
        "sequentialHumanRatingsRule",
        "laterSiblingHandlingRule",
        "contextSensitiveClaimRule",
        "targetOnlyRestrictionRule",
        "sourceBoundary",
        "frozenAt",
      ],
      requiredNonEmptyArrayFields: ["allowedComparisonModes", "requiredEvidenceFields"],
      requiredObjectFields: ["policyRules"],
      requiredObjectKeys: { policyRules: Object.keys(modelPromptSiblingContextRules) },
      requiredStructuredFields: { policyRules: modelPromptSiblingContextRules },
      requiredArrayIncludes: {
        allowedComparisonModes: modelPromptSiblingContextModes,
        requiredEvidenceFields: modelPromptSiblingContextEvidenceFields,
      },
      allowedArrayValues: {
        allowedComparisonModes: modelPromptSiblingContextModes,
        requiredEvidenceFields: modelPromptSiblingContextEvidenceFields,
      },
      requiredStringIncludes: {
        sequentialHumanRatingsRule: ["same-position", "RatingContextSnapshot"],
        laterSiblingHandlingRule: ["later-added", "absent"],
        contextSensitiveClaimRule: ["context-sensitive", "model-prompt"],
        targetOnlyRestrictionRule: ["target-only", "sibling-context-sensitive"],
        sourceBoundary: ["project", "lmca"],
      },
      requiredExactFields: { policyVersion: modelPromptSiblingContextPolicyVersion },
    },
  ),
  workflowWriteSpec(/^\/api\/v1\/rating-context-snapshots$/, "rating_context_snapshot_submitted", "ratingContextSnapshot", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "positionId",
      "targetCritiqueId",
      "contextPolicy",
      "laterSiblingAbsent",
      "assignmentSource",
      "modelVisibleContextHash",
      "createdBy",
      "createdAt",
    ],
    requiredNonEmptyArrayFields: ["siblingCritiqueIdsShown", "siblingItemTextVersionIds", "siblingOrder"],
    allowedValues: { contextPolicy: ["target_only", "prior_siblings_in_session", "all_current_siblings", "counterbalanced_order", "custom"] },
    requiredStringPrefixes: { modelVisibleContextHash: "sha256:" },
  }),
  workflowWriteSpec(/^\/api\/v1\/pairwise-comparison-snapshots$/, "pairwise_comparison_snapshot_submitted", "pairwiseComparisonSnapshot", adminRoles, {
    allowHiddenMetadata: true,
    policyActionKind: "pairwise_snapshot_freeze",
    phaseGateLaneKind: "route",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-reliability-weight-models$/, "rater_reliability_weight_model_submitted", "raterReliabilityWeightModel", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "reliabilityWeightModelId",
      "modelName",
      "version",
      "fitDataSource",
      "fittedAt",
      "fittedBy",
      "maximumSingleRaterWeightShare",
      "unweightedSensitivitySnapshotId",
      "medianSensitivitySnapshotId",
      "freezeVersion",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["protectedSplitExclusions"],
    requiredObjectFields: ["raterWeightsByDimension", "weightCaps", "effectiveSampleSizeByDimension"],
    requiredObjectKeys: { weightCaps: ["maxSingleRaterShare"] },
    requiredArrayIncludes: { protectedSplitExclusions: ["hidden_benchmark", "internal_validation"] },
    requiredNumberRanges: [
      { field: "maximumSingleRaterWeightShare", min: 0, max: 1 },
      { field: "weightCaps.maxSingleRaterShare", min: 0, max: 1 },
    ],
    requiredStringIncludesAny: { fitDataSource: ["gold", "certification", "adjudicated", "training", "validation"] },
    forbiddenStringFragments: { fitDataSource: ["hidden_benchmark", "model_performance"] },
  }),
  workflowWriteSpec(/^\/api\/v1\/raters$/, "rater_submitted", "rater", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "tier", "certificationStatus", "activeReliabilityWeightModelId"],
    requiredAnyFields: [["topicExpertise", "topicExpertiseByFamily"]],
    requiredNonEmptyArrayFields: ["conflictDisclosures"],
    allowedValues: { tier: ["undergraduate", "graduate", "phd", "expert", "admin"] },
  }),
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
    requiredNonEmptyArrayFields: ["requiredUiPanelSet"],
    requiredNumberRanges: [
      { field: "activeTimeSeconds", min: 0 },
      { field: "interruptionCount", min: 0 },
      { field: "resumeCount", min: 0 },
      { field: "positionOrderIndex", min: 0 },
      { field: "siblingCritiquesSeenPriorCount", min: 0 },
    ],
    requiredStringIncludesAny: {
      samePositionOrderPolicy: ["counterbalanced", "randomized", "random"],
    },
    requiredExactFields: {
      preRatingSelfScreenStatus: "passed",
      raterItemConflictCheckStatus: "no_conflict",
      independentBlindEligibilityStatus: "eligible",
      blindState: "blind_initial",
      sourceTagVisibilityState: "hidden_before_initial_lock",
      validationMembershipBlindToRater: true,
      laterSiblingCritiquesAbsentAtSubmission: true,
      draftDependencyStaleStatus: "current",
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/session-pacing-policies$/, "session_pacing_policy_submitted", "sessionPacingPolicy", adminRoles, {
    requiredFields: [
      "id",
      "policyVersion",
      "breakPromptPolicy",
      "fatigueWarningPolicy",
      "qaRoutingPolicy",
      "ordinaryPausePenaltyPolicy",
      "stopAfterCurrentPolicy",
      "safeDeclineDenominatorPolicy",
      "createdBy",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["coveredSessionTargets"],
    requiredArrayIncludes: { coveredSessionTargets: sessionPacingTargets },
    allowedArrayValues: { coveredSessionTargets: sessionPacingTargets },
    requiredObjectFields: ["thresholdSeconds", "safeDeclineAbuseThresholds"],
    requiredObjectKeys: {
      thresholdSeconds: Object.keys(sessionPacingThresholdSeconds),
      safeDeclineAbuseThresholds: Object.keys(safeDeclineAbuseThresholds),
    },
    requiredStructuredFields: {
      thresholdSeconds: sessionPacingThresholdSeconds,
      safeDeclineAbuseThresholds,
    },
    requiredExactFields: { policyVersion: sessionPacingPolicyVersion },
    requiredStringIncludes: {
      breakPromptPolicy: ["45"],
      fatigueWarningPolicy: ["60"],
      qaRoutingPolicy: ["fatigue", "repeated", "suspicious", "qa"],
      ordinaryPausePenaltyPolicy: ["ordinary", "not", "label-quality penalty"],
      stopAfterCurrentPolicy: ["stop-after-current", "without label penalty"],
      safeDeclineDenominatorPolicy: ["safe declines", "excluded", "denominators"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-sessions$/, "rater_session_submitted", "raterSession", ratingWorkflowRoles, {
    requiredFields: raterSessionRequiredFields,
    requiredNumberRanges: raterSessionNonNegativeNumberFields.map((field) => ({ field, min: 0 })),
    allowedValues: {
      expectedEffortCompleted: raterSessionExpectedEffortStatuses,
      stopAfterCurrentItemState: raterSessionStopAfterCurrentStates,
      fatigueWarningState: raterSessionFatigueWarningStates,
      qaRoutingStatus: raterSessionQaRoutingStatuses,
    },
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-sessions\/(?<id>[^/]+)$/, "rater_session_updated", "raterSession", ratingWorkflowRoles, {
    method: "PATCH",
    pathParamField: "id",
    requiredFields: raterSessionRequiredFields,
    requiredNumberRanges: raterSessionNonNegativeNumberFields.map((field) => ({ field, min: 0 })),
    allowedValues: {
      expectedEffortCompleted: raterSessionExpectedEffortStatuses,
      stopAfterCurrentItemState: raterSessionStopAfterCurrentStates,
      fatigueWarningState: raterSessionFatigueWarningStates,
      qaRoutingStatus: raterSessionQaRoutingStatuses,
    },
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-sessions\/(?<id>[^/]+)\/pause$/, "rater_session_paused", "raterSession", ratingWorkflowRoles, {
    pathParamField: "id",
    requiredFields: raterSessionRequiredFields,
    requiredNumberRanges: raterSessionNonNegativeNumberFields.map((field) => ({ field, min: 0 })),
    allowedValues: {
      expectedEffortCompleted: raterSessionExpectedEffortStatuses,
      stopAfterCurrentItemState: raterSessionStopAfterCurrentStates,
      fatigueWarningState: raterSessionFatigueWarningStates,
      qaRoutingStatus: raterSessionQaRoutingStatuses,
    },
    requiredStringIncludes: { interruptionSummary: ["pause"] },
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-sessions\/(?<id>[^/]+)\/stop-after-current$/, "rater_session_stop_after_current", "raterSession", ratingWorkflowRoles, {
    pathParamField: "id",
    requiredFields: raterSessionRequiredFields,
    requiredNumberRanges: raterSessionNonNegativeNumberFields.map((field) => ({ field, min: 0 })),
    allowedValues: {
      expectedEffortCompleted: raterSessionExpectedEffortStatuses,
      stopAfterCurrentItemState: raterSessionStopAfterCurrentStates,
      fatigueWarningState: raterSessionFatigueWarningStates,
      qaRoutingStatus: raterSessionQaRoutingStatuses,
    },
    requiredExactFields: { stopAfterCurrentItemState: "requested" },
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/practice-sandbox-policies$/, "practice_sandbox_policy_submitted", "practiceSandboxPolicy", adminRoles, {
    requiredFields: [
      "id",
      "policyVersion",
      "liveRatingUnlockPolicy",
      "feedbackVisibilityPolicy",
      "denominatorExclusionPolicy",
      "trainingExposurePolicy",
      "createdBy",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["requiredPublicSourceAnchorIds"],
    requiredArrayIncludes: { requiredPublicSourceAnchorIds: practiceSandboxRequiredSourceAnchorIds },
    allowedArrayValues: { requiredPublicSourceAnchorIds: practiceSandboxRequiredSourceAnchorIds },
    requiredObjectFields: ["completionStandards"],
    requiredObjectKeys: { completionStandards: Object.keys(practiceSandboxCompletionStandards) },
    requiredStructuredFields: { completionStandards: practiceSandboxCompletionStandards },
    requiredExactFields: { policyVersion: practiceSandboxPolicyVersion },
    requiredStringIncludes: {
      liveRatingUnlockPolicy: ["locked", "every required public source anchor"],
      feedbackVisibilityPolicy: ["only after", "locked"],
      denominatorExclusionPolicy: ["excluded", "blind-label", "validation", "hidden-benchmark", "human-ceiling", "training-export"],
      trainingExposurePolicy: ["training exposure only"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/practice-sessions$/, "public_example_practice_session_submitted", "publicExamplePracticeSession", ratingWorkflowRoles, {
    requiredFields: [
      "id",
      "raterId",
      "sourceAnchorExampleIds",
      "workflowProfileId",
      "practiceSandboxPolicyId",
      "attemptRatings",
      "lockedAt",
      "feedbackArtifactId",
      "trainingExposureStatus",
      "excludedFromRatingDenominator",
    ],
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-dashboard-policies$/, "rater_dashboard_policy_submitted", "raterDashboardPolicy", adminAuditRoles, {
    allowHiddenMetadata: true,
    requiredFields: raterDashboardPolicyRequiredFields,
    requiredNonEmptyArrayFields: ["visibleSections", "prohibitedFields", "allowedRemediationStatuses", "allowedVisibilityStatuses"],
    requiredObjectFields: ["thresholds", "remediationRules"],
    requiredArrayIncludes: {
      visibleSections: REQUIRED_RATER_DASHBOARD_VISIBLE_SECTIONS,
      prohibitedFields: REQUIRED_RATER_DASHBOARD_PROHIBITED_FIELDS,
      allowedRemediationStatuses: REQUIRED_RATER_DASHBOARD_REMEDIATION_STATUSES,
      allowedVisibilityStatuses: REQUIRED_RATER_DASHBOARD_VISIBILITY_STATUSES,
    },
    requiredObjectKeys: {
      thresholds: Object.keys(REQUIRED_RATER_DASHBOARD_THRESHOLDS),
      remediationRules: Object.keys(REQUIRED_RATER_DASHBOARD_REMEDIATION_RULES),
    },
    requiredStructuredFields: {
      thresholds: REQUIRED_RATER_DASHBOARD_THRESHOLDS,
      remediationRules: REQUIRED_RATER_DASHBOARD_REMEDIATION_RULES,
    },
    requiredExactFields: { policyVersion: RATER_DASHBOARD_POLICY_VERSION },
    requiredStringIncludes: {
      feedbackVisibilityPolicy: ["only after lock", "training-approved"],
      protectedLabelBoundary: ["hidden-benchmark", "protected-validation", "peer scores", "model-judge"],
      remediationRoutingRule: ["targeted practice", "protected", "unlocks"],
      assignmentEligibilityRule: ["assignment-time", "training-exposure snapshots"],
      sourceBoundary: ["Project default", "LMCA", "does not state"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-learning-plans$/, "rater_learning_plan_submitted", "raterLearningPlan", ratingWorkflowRoles, {
    requiredFields: raterLearningPlanRequiredFields,
    allowedValues: {
      dashboardVisibilityStatus: REQUIRED_RATER_DASHBOARD_VISIBILITY_STATUSES,
      remediationRoutingStatus: REQUIRED_RATER_DASHBOARD_REMEDIATION_STATUSES,
    },
    requiredExactFields: {
      hiddenProtectedLabelsSuppressed: true,
      livePeerModelSourceLabelsHidden: true,
      trainingApprovedFeedbackOnly: true,
    },
    requiredStringIncludes: { protectedLabelExposureCheck: ["no_protected", "live_labels"] },
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/gold-items$/, "gold_item_submitted", "goldItem", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "itemId",
      "positionId",
      "critiqueId",
      "positionClusterId",
      "splitName",
      "rubricVersion",
      "adjudicatedSummary",
      "difficultyClass",
      "ambiguityClass",
      "trainingExposureStatus",
      "protectedSplitConflictCheck",
    ],
    requiredObjectFields: ["adjudicatedRatings"],
    requiredExactFields: { rationaleVisibleToRater: false },
    requiredStringIncludes: {
      trainingExposureStatus: ["training"],
      protectedSplitConflictCheck: ["hidden", "validation"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/source-anchor-examples$/, "source_anchor_example_submitted", "sourceAnchorExample", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "suiteVersion",
      "sourceExampleFamily",
      "publicSourceReference",
      "itemId",
      "positionClusterId",
      "split",
      "exposurePolicy",
      "intendedLesson",
      "expectedLabelSummary",
    ],
    requiredNonEmptyArrayFields: ["allowedUse", "targetDimensions"],
    requiredArrayIncludes: { allowedUse: ["training", "certification", "prompt_regression"] },
    requiredStringIncludes: {
      split: ["public"],
      exposurePolicy: ["public", "training"],
    },
    requiredExactFields: {
      excludedFromProtectedEvaluation: true,
      promptRegressionEligible: true,
      certificationExposureEligible: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/benchmark-split-members$/, "benchmark_split_member_submitted", "benchmarkSplitMember", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "itemId",
      "positionClusterId",
      "split",
      "splitUnit",
      "freezeVersion",
      "artifactBalanceBucket",
      "crossSplitExceptionReason",
      "leakPreventionStatus",
      "frozenAt",
    ],
    allowedValues: { split: ["hidden_benchmark_candidate", "hidden_benchmark"], splitUnit: ["position_cluster"] },
    requiredStringIncludes: {
      leakPreventionStatus: ["excluded", "training", "public"],
    },
    requiredExactFields: {
      customWeightedLossEligible: true,
      pairwiseRankingEligible: true,
      pointwiseOnly: false,
      exposureRestricted: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/rights-records$/, "rights_record_submitted", "rightsRecord", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "rightsClearancePolicyId",
      "artifactId",
      "artifactKind",
      "sourceOrigin",
      "legalBasis",
      "clearanceStandard",
      "legalReviewJurisdiction",
      "licenseType",
      "rightsStatus",
      "releaseScope",
      "thirdPartyContentCheck",
      "takedownOrRemovalSlaDays",
      "reviewerId",
      "reviewedAt",
      "sourceLanguage",
      "translationRoute",
      "taskFormat",
      "sourceDomainSuitability",
      "removalPolicy",
    ],
    requiredNonEmptyArrayFields: ["evidenceArtifactIds"],
    allowedValues: { legalBasis: rightsLegalBases },
    requiredWhen: rightsLegalBases.map((legalBasis) => ({
      field: "legalBasis",
      equals: legalBasis,
      requiredArrayIncludes: { evidenceArtifactIds: rightsEvidenceByLegalBasis[legalBasis] },
    })),
    requiredStringIncludesAny: {
      rightsStatus: ["allowed", "cleared"],
      releaseScope: ["public", "training", "internal", "hidden", "benchmark"],
    },
    requiredStringIncludes: {
      clearanceStandard: ["clearance", "release"],
      thirdPartyContentCheck: ["third-party", "checked"],
    },
    requiredExactFields: {
      takedownOrRemovalSlaDays: rightsTakedownOrRemovalSlaDays,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/release-versions$/, "release_version_submitted", "releaseVersion", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "version",
      "corpusManifestId",
      "labelSnapshotId",
      "metricConfigId",
      "gateProfileId",
      "releaseConfigManifestId",
      "releaseConfigManifestHash",
      "status",
      "releaseNotes",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["immutableOutputArtifactIds"],
    requiredStringPrefixes: { releaseConfigManifestHash: "sha256:" },
  }),
  workflowWriteSpec(/^\/api\/v1\/release-gate-profiles$/, "release_gate_profile_submitted", "releaseGateProfile", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "releaseVersion",
      "profileName",
      "notRunRationalePolicy",
      "approvedBy",
      "frozenAt",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["sourceCriticalCoreGates", "benchmarkQualityGates", "claimGatedDiagnostics", "requiredIfClaimedRules"],
    requiredArrayIncludes: {
      sourceCriticalCoreGates: ["position-critique-units", "seven-dimensions", "blind-initial", "immutable-revisions", "metric-families"],
      benchmarkQualityGates: ["split-isolation", "release-manifests", "artifact-balance", "access-audit"],
      claimGatedDiagnostics: ["derived-utility", "sycophancy", "obfuscation"],
      requiredIfClaimedRules: [
        "lmca-comparability-claim-requires-method-core-and-comparability-matrix",
        "hidden-benchmark-claim-requires-split-isolation-access-audit-and-artifact-balance",
        "robustness-claim-requires-matching-diagnostic-or-deferral",
      ],
    },
    requiredStringIncludesAny: {
      notRunRationalePolicy: ["deferred", "not-run", "not run", "suppress", "claim"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/primary-rater-anchor-policies$/, "primary_rater_anchor_policy_submitted", "primaryRaterAnchorPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "releaseId", "selectionRule", "coverageThreshold", "predeclaredAt"],
    requiredNonEmptyArrayFields: ["prohibitedPostHocCriteria"],
    requiredArrayIncludes: {
      prohibitedPostHocCriteria: ["agreement_with_model_outputs", "desired_leaderboard_effect", "post_hoc_target_label_switching"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/comparability-tier-policies$/, "comparability_tier_policy_submitted", "comparabilityTierPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "statusOrder",
      "tierThresholds",
      "guardrailRule",
      "notApplicableRule",
      "publicWordingRule",
      "frozenAt",
    ],
    requiredObjectFields: ["tierThresholds"],
    requiredObjectKeys: { tierThresholds: comparabilityClaimTiers },
    requiredStructuredFields: {
      statusOrder: comparabilityTierStatusOrder,
      tierThresholds: comparabilityTierThresholds,
    },
    requiredStringIncludes: {
      guardrailRule: ["computed", "stricter"],
      notApplicableRule: ["not_applicable", "partial"],
      publicWordingRule: ["tier", "limitations"],
    },
    requiredExactFields: { policyVersion: comparabilityTierPolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/comparability-claims$/, "comparability_claim_submitted", "comparabilityClaim", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "releaseGateProfileId",
      "comparabilityTierPolicyId",
      "claimWording",
      "methodPreservingStatus",
      "corpusScaleStatus",
      "exactPositionSourceCountStatus",
      "topicFamilyStatus",
      "raterContributionStatus",
      "adaptedSourceLanguageTaskFormatStatus",
      "metricDenominatorStatus",
      "targetLabelRaterStatus",
      "primaryRaterAnchorPolicyId",
      "validationDesignStatus",
      "validationNumericCeilingStatus",
      "modelScoreAnchorStatus",
      "promptFamilySourceScopeStatus",
      "modelSnapshotStatus",
      "protectedSplitLeakageStatus",
      "limitationsText",
      "approvedBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["linkedReleaseIds", "evidenceLinks"],
    allowedValues: {
      methodPreservingStatus: ["passes", "partial", "fails", "not_applicable"],
      corpusScaleStatus: ["passes", "partial", "fails", "not_applicable"],
      exactPositionSourceCountStatus: ["passes", "partial", "fails", "not_applicable"],
      topicFamilyStatus: ["passes", "partial", "fails", "not_applicable"],
      raterContributionStatus: ["passes", "partial", "fails", "not_applicable"],
      adaptedSourceLanguageTaskFormatStatus: ["passes", "partial", "fails", "not_applicable"],
      metricDenominatorStatus: ["passes", "partial", "fails", "not_applicable"],
      targetLabelRaterStatus: ["passes", "partial", "fails", "not_applicable"],
      validationDesignStatus: ["passes", "partial", "fails", "not_applicable"],
      validationNumericCeilingStatus: ["passes", "partial", "fails", "not_applicable"],
      modelScoreAnchorStatus: ["passes", "partial", "fails", "not_applicable"],
      promptFamilySourceScopeStatus: ["passes", "partial", "fails", "not_applicable"],
      modelSnapshotStatus: ["passes", "partial", "fails", "not_applicable"],
      protectedSplitLeakageStatus: ["passes", "partial", "fails", "not_applicable"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/candidate-batches$/, "candidate_batch_submitted", "candidateBatch", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "positionId",
      "generatorSourceDescription",
      "promptTemplateVersion",
      "judgeModelSet",
      "generatedOrIngestedCandidateCount",
      "judgedCandidateCount",
      "candidatePoolDenominatorPolicy",
      "selectionPolicyVersion",
      "batchStatus",
      "createdAt",
    ],
    requiredNonEmptyArrayFields: ["judgeModelSet"],
    requiredFiniteNumberFields: ["generatedOrIngestedCandidateCount", "judgedCandidateCount"],
    requiredExactFields: {
      selectionReasonHiddenFromInitialRaters: true,
      modelJudgeScoresVisibleToInitialRaters: false,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/candidate-critiques$/, "candidate_critique_submitted", "candidateCritique", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "candidateBatchId",
      "positionId",
      "text",
      "sourceType",
      "generationRoute",
      "rightsStatus",
      "selectionReason",
      "nearDuplicateClusterId",
      "marginalInformativenessRationale",
      "reviewStatus",
    ],
    requiredExactFields: {
      selectionReasonVisibleToRatersBeforeInitialLock: false,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/model-judge-scores$/, "model_judge_score_submitted", "modelJudgeScore", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "candidateId",
      "candidateBatchId",
      "judgeRequestedModelAlias",
      "judgeProvider",
      "judgeResolvedModelSnapshot",
      "promptVersion",
      "modelParameters",
      "aliasStabilityStatus",
      "rawOutput",
      "parseStatus",
      "overallScore",
      "disagreementStatistics",
      "timestamp",
    ],
    requiredObjectFields: ["modelParameters", "disagreementStatistics"],
    requiredFiniteNumberFields: ["overallScore"],
    requiredExactFields: {
      hiddenFromRatersBeforeInitialLock: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/active-learning-selection-policies$/, "active_learning_selection_policy_submitted", "activeLearningSelectionPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "thresholds",
      "handSelectionQuotas",
      "selectionReasonCodes",
      "rejectionReasonCodes",
      "thresholdRule",
      "handSelectionQuotaRule",
      "raterVisibilityRule",
      "lmcaSourceBoundary",
      "frozenAt",
    ],
    requiredObjectFields: ["thresholds", "handSelectionQuotas"],
    requiredNonEmptyArrayFields: ["selectionReasonCodes", "rejectionReasonCodes"],
    requiredObjectKeys: {
      thresholds: Object.keys(activeLearningSelectionThresholds),
      handSelectionQuotas: Object.keys(activeLearningHandSelectionQuotas),
    },
    requiredStructuredFields: {
      thresholds: activeLearningSelectionThresholds,
      handSelectionQuotas: activeLearningHandSelectionQuotas,
    },
    requiredArrayIncludes: {
      selectionReasonCodes: activeLearningSelectionReasonCodes,
      rejectionReasonCodes: activeLearningRejectionReasonCodes,
    },
    allowedArrayValues: {
      selectionReasonCodes: activeLearningSelectionReasonCodes,
      rejectionReasonCodes: activeLearningRejectionReasonCodes,
    },
    requiredStringIncludes: {
      thresholdRule: ["judge", "threshold"],
      handSelectionQuotaRule: ["diversity", "suitability", "interestingness"],
      raterVisibilityRule: ["admin-only", "initial rating lock"],
      lmcaSourceBoundary: ["Project", "LMCA"],
    },
    requiredExactFields: { policyVersion: activeLearningSelectionPolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/training-export-uncertainty-policies$/, "training_export_uncertainty_policy_submitted", "trainingExportUncertaintyPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "thresholds",
      "downweightRules",
      "labelMetadataRule",
      "protectedSplitRule",
      "lmcaSourceBoundary",
      "frozenAt",
    ],
    requiredObjectFields: ["thresholds", "downweightRules"],
    requiredObjectKeys: {
      thresholds: Object.keys(trainingExportUncertaintyThresholds),
      downweightRules: Object.keys(trainingExportDownweightRules),
    },
    requiredStructuredFields: {
      thresholds: trainingExportUncertaintyThresholds,
      downweightRules: trainingExportDownweightRules,
    },
    requiredStringIncludes: {
      labelMetadataRule: ["rater-count", "spread", "uncertainty"],
      protectedSplitRule: ["internal validation", "hidden benchmark", "excluded"],
      lmcaSourceBoundary: ["Project", "LMCA"],
    },
    requiredExactFields: { policyVersion: trainingExportUncertaintyPolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/model-improvement-policies$/, "model_improvement_policy_submitted", "modelImprovementPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "defaultTrainingMethod",
      "defaultObjectiveFamily",
      "lmcaMetricSeparationRule",
      "protectedSplitRule",
      "uncertaintyPropagationRule",
      "positionBalanceRule",
      "promptTrackRule",
      "postTrainingEvaluationRule",
      "sourceBoundary",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: [
      "allowedTrainingMethods",
      "allowedObjectiveFamilies",
      "requiredTargetFields",
      "protectedSplitExclusions",
      "allowedApprovalStatuses",
    ],
    requiredObjectFields: ["policyRules"],
    requiredArrayIncludes: {
      allowedTrainingMethods: modelImprovementMethods,
      allowedObjectiveFamilies: modelImprovementObjectiveFamilies,
      requiredTargetFields: modelImprovementTargetFields,
      protectedSplitExclusions: modelImprovementProtectedSplitExclusions,
      allowedApprovalStatuses: modelImprovementApprovalStatuses,
    },
    allowedArrayValues: {
      allowedTrainingMethods: modelImprovementMethods,
      allowedObjectiveFamilies: modelImprovementObjectiveFamilies,
      requiredTargetFields: modelImprovementTargetFields,
      protectedSplitExclusions: modelImprovementProtectedSplitExclusions,
      allowedApprovalStatuses: modelImprovementApprovalStatuses,
    },
    requiredObjectKeys: { policyRules: Object.keys(modelImprovementPolicyRules) },
    requiredStructuredFields: { policyRules: modelImprovementPolicyRules },
    allowedValues: {
      defaultTrainingMethod: modelImprovementMethods,
      defaultObjectiveFamily: modelImprovementObjectiveFamilies,
    },
    requiredStringIncludes: {
      lmcaMetricSeparationRule: ["project-level", "never replaces", "LMCA"],
      protectedSplitRule: ["hidden benchmark", "protected validation", "excluded"],
      uncertaintyPropagationRule: ["rater count", "uncertainty", "disagreement"],
      positionBalanceRule: ["within position", "cross-position"],
      promptTrackRule: ["training prompts", "evaluation prompts", "separately"],
      postTrainingEvaluationRule: ["post-training", "frozen LMCA metrics"],
      sourceBoundary: ["Project default", "LMCA", "does not state"],
    },
    requiredExactFields: { policyVersion: modelImprovementPolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/active-learning-selection-audits$/, "active_learning_selection_audit_submitted", "activeLearningSelectionAudit", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "candidateBatchId",
      "positionId",
      "activeLearningSelectionPolicyId",
      "generatedOrIngestedCount",
      "judgedCount",
      "disagreementSelectedCount",
      "highRatedSelectedCount",
      "suspectedJudgeFalsePositiveCount",
      "humanSelectedForDiversityCount",
      "humanSelectedForSuitabilityCount",
      "humanSelectedForInterestingnessCount",
      "selectionThresholds",
      "rejectedCountByReason",
      "promotedToRatingCount",
    ],
    requiredObjectFields: ["selectionThresholds", "rejectedCountByReason"],
    requiredFiniteNumberFields: [
      "generatedOrIngestedCount",
      "judgedCount",
      "disagreementSelectedCount",
      "highRatedSelectedCount",
      "suspectedJudgeFalsePositiveCount",
      "humanSelectedForDiversityCount",
      "humanSelectedForSuitabilityCount",
      "humanSelectedForInterestingnessCount",
      "promotedToRatingCount",
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/candidate-batches\/(?<id>[^/]+)\/model-judge-scores$/, "candidate_batch_model_judge_scores_submitted", "modelJudgeScores", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "candidateBatchId",
    requiredFields: ["id", "submittedScoreIds", "batchCoveragePolicy", "judgedCandidateCount", "submittedAt"],
    requiredNonEmptyArrayFields: ["submittedScoreIds"],
    requiredFiniteNumberFields: ["judgedCandidateCount"],
    requiredExactFields: {
      hiddenFromRatersBeforeInitialLock: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/candidates\/(?<id>[^/]+)\/review$/, "candidate_review_submitted", "candidateReview", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "candidateId",
  }),
  workflowWriteSpec(/^\/api\/v1\/candidates\/(?<id>[^/]+)\/promote$/, "candidate_promotion_submitted", "candidatePromotion", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "candidateId",
  }),
  workflowWriteSpec(/^\/api\/v1\/critique-generation-runs$/, "critique_generation_run_submitted", "critiqueGenerationRun", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "generatorRequestedModelAlias",
      "generatorProvider",
      "generatorResolvedModelSnapshot",
      "promptTemplateId",
      "renderedPromptChecksum",
      "sourceSplit",
      "positionIds",
      "generationParameters",
      "generationBudgetPerPosition",
      "outputsRequested",
      "outputsGenerated",
      "emptyRefusalCount",
      "duplicateNearDuplicateCount",
      "outputFilteringPolicy",
      "judgeScreeningPolicy",
      "aliasStabilityStatus",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["positionIds"],
    requiredObjectFields: ["generationParameters"],
    requiredFiniteNumberFields: ["generationBudgetPerPosition", "outputsRequested", "outputsGenerated", "emptyRefusalCount", "duplicateNearDuplicateCount"],
    requiredExactFields: {
      blindRatingBeforeScreening: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/generated-critiques$/, "generated_critique_submitted", "generatedCritiqueSubmission", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "generationRunId",
      "positionId",
      "rawGeneratedText",
      "normalizedRaterVisibleText",
      "generationIndex",
      "generationOutputStatus",
      "rightsStatus",
      "timestamp",
    ],
    requiredFiniteNumberFields: ["generationIndex"],
    allowedValues: {
      generationOutputStatus: ["generated", "empty", "refusal", "duplicate", "filtered", "promoted", "rated"],
    },
    requiredExactFields: {
      generatorMetadataHiddenFromRaters: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/generated-critiques\/(?<id>[^/]+)\/promote$/, "generated_critique_promotion_submitted", "generatedCritiquePromotion", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "generatedCritiqueId",
    requiredFields: ["id", "promotedCritiqueId", "promotionStatus", "humanReviewStatus", "promotedBy", "promotedAt"],
    allowedValues: {
      promotionStatus: ["promoted_after_human_review"],
      humanReviewStatus: ["passed_trained_human_review"],
    },
    requiredExactFields: {
      generatorMetadataHiddenFromRaters: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/generation-evaluation-reports$/, "generation_evaluation_report_submitted", "generationEvaluationReport", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "generationRunIds",
      "labelSnapshotId",
      "commonPositionSetPolicy",
      "commonGenerationBudgetPolicy",
      "filteringSelectionPolicy",
      "uncuratedRandomSampleMetrics",
      "bestOfNMetrics",
      "counts",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["generationRunIds"],
    requiredObjectFields: ["uncuratedRandomSampleMetrics", "bestOfNMetrics", "counts"],
    requiredObjectKeys: {
      uncuratedRandomSampleMetrics: ["ratedCount", "meanOverall"],
      bestOfNMetrics: ["n", "passAtThreshold", "threshold"],
      counts: ["generated", "refusal", "duplicate", "filtered", "promoted", "rated"],
    },
    requiredFiniteNumberFields: [
      "uncuratedRandomSampleMetrics.ratedCount",
      "uncuratedRandomSampleMetrics.meanOverall",
      "bestOfNMetrics.n",
      "bestOfNMetrics.passAtThreshold",
      "bestOfNMetrics.threshold",
      "counts.generated",
      "counts.refusal",
      "counts.duplicate",
      "counts.filtered",
      "counts.promoted",
      "counts.rated",
    ],
  }),
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
    allowedValues: {
      reasonCode: assignmentFlagReasonCodes,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/self-screen$/, "assignment_self_screen_submitted", "assignmentSelfScreen", ratingWorkflowRoles, {
    pathParamField: "assignmentId",
    requiredFields: ["id", "assignmentId", "raterId", "selfScreenStatus", "sourcePeerModelGoldProtectedLabelVisibilityState"],
    allowedValues: {
      selfScreenStatus: assignmentSelfScreenStatuses,
    },
    requiredExactFields: {
      sourcePeerModelGoldProtectedLabelVisibilityState: "all_hidden",
    },
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/decline$/, "assignment_decline_submitted", "assignmentDecline", ratingWorkflowRoles, {
    pathParamField: "assignmentId",
    requiredFields: assignmentDeclineRequiredFields,
    requiredNonEmptyArrayFields: ["itemKeys"],
    allowedValues: {
      reasonCode: assignmentDeclineReasonCodes,
      reassignmentStatus: assignmentDeclineReassignmentStatuses,
      qaRoutingStatus: assignmentDeclineQaRoutingStatuses,
    },
    requiredStringIncludes: { repeatedOrStrategicDeclineQaPolicy: ["repeated", "suspicious", "qa"] },
    requiredExactFields: {
      excludedFromRatingDenominator: true,
      sourcePeerModelGoldProtectedLabelVisibilityState: "all_hidden",
    },
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/defer$/, "assignment_deferral_submitted", "assignmentDeferral", ratingWorkflowRoles, {
    pathParamField: "assignmentId",
    requiredFields: ["id", "assignmentId", "raterId", "deferReason", "resumePolicy", "sourcePeerModelGoldProtectedLabelVisibilityState"],
    allowedValues: {
      deferReason: assignmentDeferralReasons,
      resumePolicy: assignmentDeferralResumePolicies,
    },
    requiredExactFields: {
      sourcePeerModelGoldProtectedLabelVisibilityState: "all_hidden",
    },
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/source-recognition-events$/, "source_recognition_event_submitted", "sourceRecognitionEvent", ratingWorkflowRoles, {
    pathParamField: "assignmentId",
    requiredFields: ["id", "assignmentId", "raterId", "recognitionType", "raterAction", "independentBlindEligibilityEffect", "protectedStatusHiddenFromRater"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
    allowedValues: {
      recognitionType: sourceRecognitionTypes,
      raterAction: sourceRecognitionActions,
    },
    requiredExactFields: {
      protectedStatusHiddenFromRater: true,
    },
    requiredStringIncludesAny: {
      independentBlindEligibilityEffect: sourceRecognitionBlindEffectFragments,
    },
    forbiddenStringFragments: {
      independentBlindEligibilityEffect: sourceRecognitionForbiddenBlindEffectFragments,
    },
    requiredWhen: [
      {
        field: "raterAction",
        equals: "continue_nonblind",
        requiredFields: ["reviewerResolution"],
        requiredStringIncludesAny: {
          independentBlindEligibilityEffect: ["excluded", "nonblind"],
          reviewerResolution: ["review", "expert"],
        },
      },
    ],
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/discussions$/, "discussion_submitted", "discussion", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id"],
    requiredAnyFieldSets: [[["itemId"], ["positionId", "critiqueId"], ["itemKeys"]]],
    requiredNonEmptyArrayFields: ["disagreementTaxonomy"],
    policyActionKind: "discussion_open",
    phaseGateLaneKind: "route",
  }),
  workflowWriteSpec(/^\/api\/v1\/discussions\/(?<id>[^/]+)\/post-lock-sessions$/, "post_lock_discussion_session_submitted", "postLockDiscussionSession", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "discussionThreadId",
    requiredFields: postLockDiscussionSessionRequiredFields,
    allowedValues: {
      identityStagingPolicy: discussionIdentityStagingPolicies,
      identityMaskPhaseStatus: discussionIdentityMaskPhaseStatuses,
      roleRevealPolicy: discussionRoleRevealPolicies,
    },
    requiredExactFields: {
      initialRatingLockCheck: "all_initial_ratings_locked",
      majorityPressureWarningState: "displayed",
    },
    requiredStringIncludes: {
      visibleMaterialPolicy: ["post_lock"],
      moderatorAdjudicatorVisibilityExceptions: ["adjudicator", "initial locks"],
    },
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
    allowedValues: { objectLevelStatus: discussionObjectLevelStatuses },
  }),
  workflowWriteSpec(/^\/api\/v1\/discussions\/(?<id>[^/]+)\/revision-proposals$/, "discussion_revision_proposal_submitted", "discussionRevisionProposal", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "discussionThreadId",
    requiredFields: ["id", "discussionThreadId", "proposedBy", "ratingIdPrior", "revisionReasonCode", "revisionRationale", "originalRatingPreservation", "timestamp"],
    allowedValues: { revisionReasonCode: discussionRevisionReasonCodes },
    requiredExactFields: { originalRatingPreservation: "original_rating_preserved_append_only" },
  }),
  workflowWriteSpec(/^\/api\/v1\/discussion-threads$/, "discussion_thread_submitted", "discussionThread", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: discussionThreadRequiredFields,
    requiredAnyFieldSets: [[["itemId"], ["positionId", "critiqueId"], ["itemKeys"]]],
    requiredNonEmptyArrayFields: ["disagreementTaxonomyCodes"],
  }),
  workflowWriteSpec(/^\/api\/v1\/adjudications$/, "adjudication_submitted", "adjudication", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "discussionThreadId", "decisionStatus"],
    requiredAnyFieldSets: [[["itemId"], ["positionId", "critiqueId"], ["itemKeys"]]],
    requiredNonEmptyArrayFields: ["adjudicatorIds"],
  }),
  workflowWriteSpec(/^\/api\/v1\/adjudications\/(?<id>[^/]+)\/finalize$/, "adjudication_finalized", "adjudicationFinalization", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "adjudicationId",
    requiredFields: ["id", "adjudicationId", "memoId", "finalizationStatus", "finalizedBy", "timestamp"],
    allowedValues: { finalizationStatus: ["finalized_for_release_candidate"] },
    policyActionKind: "adjudication_finalize",
    phaseGateLaneKind: "route",
  }),
  workflowWriteSpec(/^\/api\/v1\/adjudication-memos$/, "adjudication_memo_submitted", "adjudicationMemo", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: adjudicationMemoRequiredFields,
    requiredAnyFieldSets: [[["itemId"], ["positionId", "critiqueId"], ["itemKeys"]]],
    requiredNonEmptyArrayFields: ["plausibleInterpretationsConsidered", "disagreementTaxonomyCodes", "adjudicatorIds"],
    requiredFiniteNumberFields: ["maxFinalRaterSpread"],
  }),
  workflowWriteSpec(
    /^\/api\/v1\/adjudicator-pre-read-requiredness-policies$/,
    "adjudicator_pre_read_requiredness_policy_submitted",
    "adjudicatorPreReadRequirednessPolicy",
    adminAuditRoles,
    {
      allowHiddenMetadata: true,
      requiredFields: adjudicatorPreReadRequirednessPolicyRequiredFields,
      requiredNonEmptyArrayFields: ["triggerClasses", "allowedRequirednessDecisionStatuses", "allowedVisibleMaterialPolicies"],
      requiredObjectFields: ["thresholds", "requirednessRules"],
      requiredArrayIncludes: {
        triggerClasses: REQUIRED_ADJUDICATOR_PRE_READ_TRIGGER_CLASSES,
        allowedRequirednessDecisionStatuses: REQUIRED_ADJUDICATOR_PRE_READ_DECISION_STATUSES,
        allowedVisibleMaterialPolicies: REQUIRED_ADJUDICATOR_PRE_READ_VISIBILITY_POLICIES,
      },
      requiredObjectKeys: {
        thresholds: Object.keys(REQUIRED_ADJUDICATOR_PRE_READ_THRESHOLDS),
        requirednessRules: Object.keys(REQUIRED_ADJUDICATOR_PRE_READ_RULES),
      },
      requiredStructuredFields: {
        thresholds: REQUIRED_ADJUDICATOR_PRE_READ_THRESHOLDS,
        requirednessRules: REQUIRED_ADJUDICATOR_PRE_READ_RULES,
      },
      requiredExactFields: {
        policyVersion: ADJUDICATOR_PRE_READ_REQUIREDNESS_POLICY_VERSION,
        completedBeforePeerDistributionExposureRequired: true,
        peerDistributionExposureBeforePreReadMax: 0,
      },
      requiredStringIncludes: {
        exposureOrderRule: ["before", "peer-score"],
        memoLinkageRule: ["memo", "deferral"],
        anchoringControlRule: ["anchoring-control", "original ratings"],
        lmcaSourceBoundary: ["Project default", "LMCA", "does not state"],
      },
    },
  ),
  workflowWriteSpec(/^\/api\/v1\/adjudicator-pre-reads$/, "adjudicator_pre_read_submitted", "adjudicatorPreRead", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: adjudicatorPreReadRequiredFields,
    requiredNonEmptyArrayFields: ["itemKeys", "preliminaryIssueTags"],
    allowedValues: {
      requirednessTriggerClass: REQUIRED_ADJUDICATOR_PRE_READ_TRIGGER_CLASSES,
      requirednessDecisionStatus: REQUIRED_ADJUDICATOR_PRE_READ_DECISION_STATUSES,
      visibleMaterialPolicy: REQUIRED_ADJUDICATOR_PRE_READ_VISIBILITY_POLICIES,
    },
    requiredExactFields: {
      completedBeforePeerDistributionExposure: true,
      peerDistributionExposureBeforePreRead: 0,
      majorityDirectionHiddenBeforePreRead: true,
      modelOutputHiddenBeforePreRead: true,
    },
  }),
  workflowWriteSpec(
    /^\/api\/v1\/adjudication-cockpit-signoff-policies$/,
    "adjudication_cockpit_signoff_policy_submitted",
    "adjudicationCockpitSignoffPolicy",
    adminAuditRoles,
    {
      allowHiddenMetadata: true,
      requiredFields: adjudicationCockpitSignoffPolicyRequiredFields,
      requiredNonEmptyArrayFields: ["mandatoryViewIds", "allowedSignoffStatuses"],
      requiredObjectFields: ["thresholds", "signoffRules"],
      requiredArrayIncludes: {
        mandatoryViewIds: REQUIRED_ADJUDICATION_COCKPIT_MANDATORY_VIEW_IDS,
        allowedSignoffStatuses: adjudicationCockpitSignoffStatuses,
      },
      requiredObjectKeys: {
        thresholds: Object.keys(REQUIRED_ADJUDICATION_COCKPIT_SIGNOFF_THRESHOLDS),
        signoffRules: Object.keys(REQUIRED_ADJUDICATION_COCKPIT_SIGNOFF_RULES),
      },
      requiredStructuredFields: {
        thresholds: REQUIRED_ADJUDICATION_COCKPIT_SIGNOFF_THRESHOLDS,
        signoffRules: REQUIRED_ADJUDICATION_COCKPIT_SIGNOFF_RULES,
      },
      requiredExactFields: { policyVersion: ADJUDICATION_COCKPIT_SIGNOFF_POLICY_VERSION },
      requiredStringIncludes: {
        finalMemoGateRule: ["mandatory cockpit views", "final memo"],
        sourceBoundary: ["Project default", "LMCA", "does not state"],
      },
    },
  ),
  workflowWriteSpec(/^\/api\/v1\/adjudication-review-sessions$/, "adjudication_review_session_submitted", "adjudicationReviewSession", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: adjudicationReviewSessionRequiredFields,
    requiredNonEmptyArrayFields: [
      "itemKeys",
      "mandatoryViewIdsReviewed",
      "rationaleSpanOverlayRefs",
      "revisionTimelineRefs",
      "targetMapIds",
      "minorityRationaleFields",
      "adjudicatorIds",
    ],
    requiredArrayIncludes: { mandatoryViewIdsReviewed: REQUIRED_ADJUDICATION_COCKPIT_MANDATORY_VIEW_IDS },
    allowedValues: { cockpitSignoffStatus: adjudicationCockpitSignoffStatuses },
    requiredStringIncludes: {
      originalRatingPreservationCheck: ["original", "preserved"],
      memoSignoffGateStatus: ["mandatory", "reviewed", "memo"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/verification-records$/, "verification_record_submitted", "verificationRecord", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: verificationRecordRequiredFields,
    requiredAnyFieldSets: [[["itemId"], ["positionId", "critiqueId"]]],
    requiredAnyFields: [["timestamp", "createdAt"]],
    requiredNonEmptyArrayFields: ["verificationMaterials"],
    requiredFiniteNumberFields: ["confidence"],
    allowedValues: { verificationStatus: correctnessVerificationStatuses },
  }),
  workflowWriteSpec(/^\/api\/v1\/verification-evidence-artifacts$/, "verification_evidence_artifact_submitted", "verificationEvidenceArtifact", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "claimRef",
      "evidenceType",
      "citation",
      "snapshotContentHash",
      "retrievedAt",
      "sourceExposureStatus",
      "protectedContentExposureStatus",
      "modelAssistanceStatus",
      "nonblindEvidenceFlag",
      "sourceAssistedFlag",
      "sourceIdentifiabilityFlag",
      "protectedContentFlag",
      ...verificationEvidenceAudienceFields,
      "blindingImpactStatus",
      "evidenceUsePolicy",
      "createdBy",
      "createdAt",
    ],
    requiredAnyFieldSets: [[["itemId"], ["positionId", "critiqueId"]]],
    requiredAnyFields: [["verificationRecordId", "verificationWorkspaceId"]],
    requiredStringPrefixes: { snapshotContentHash: "sha256:" },
    requiredBooleanFields: [
      "nonblindEvidenceFlag",
      "sourceAssistedFlag",
      "sourceIdentifiabilityFlag",
      "protectedContentFlag",
      ...verificationEvidenceAudienceFields,
    ],
    allowedValues: {
      evidenceType: verificationEvidenceTypes,
      sourceExposureStatus: verificationEvidenceSourceExposureStatuses,
      protectedContentExposureStatus: verificationEvidenceProtectedContentStatuses,
      modelAssistanceStatus: verificationEvidenceModelAssistanceStatuses,
      blindingImpactStatus: verificationEvidenceBlindingImpactStatuses,
    },
    requiredWhen: [
      {
        field: "sourceExposureStatus",
        equals: "post_lock_source_visible",
        requiredExactFields: { nonblindEvidenceFlag: true },
      },
      {
        field: "sourceExposureStatus",
        equals: "source_identifiable",
        requiredExactFields: { nonblindEvidenceFlag: true, sourceIdentifiabilityFlag: true },
      },
      {
        field: "modelAssistanceStatus",
        equals: "model_assisted_retrieval",
        requiredExactFields: { sourceAssistedFlag: true },
      },
      {
        field: "modelAssistanceStatus",
        equals: "model_generated_summary",
        requiredExactFields: { sourceAssistedFlag: true },
      },
      {
        field: "modelAssistanceStatus",
        equals: "model_suggested_source",
        requiredExactFields: { sourceAssistedFlag: true },
      },
      {
        field: "protectedContentExposureStatus",
        equals: "protected_content_present_authorized",
        requiredExactFields: { protectedContentFlag: true },
      },
    ],
  }),
  workflowWriteSpec(
    /^\/api\/v1\/interpretation-target-map-requiredness-policies$/,
    "interpretation_target_map_requiredness_policy_submitted",
    "interpretationTargetMapRequirednessPolicy",
    adminAuditRoles,
    {
      allowHiddenMetadata: true,
      requiredFields: interpretationTargetMapRequirednessPolicyRequiredFields,
      requiredNonEmptyArrayFields: ["triggerClasses", "requiredMapFields", "allowedRequirednessDecisionStatuses", "allowedVisibilityStates"],
      requiredObjectFields: ["thresholds", "coverageRules"],
      requiredArrayIncludes: {
        triggerClasses: REQUIRED_INTERPRETATION_TARGET_MAP_TRIGGER_CLASSES,
        requiredMapFields: interpretationTargetMapRequiredFieldsManifest,
        allowedRequirednessDecisionStatuses: interpretationTargetMapRequirednessDecisionStatuses,
      },
      requiredObjectKeys: {
        thresholds: Object.keys(REQUIRED_INTERPRETATION_TARGET_MAP_REQUIREDNESS_THRESHOLDS),
        coverageRules: Object.keys(REQUIRED_INTERPRETATION_TARGET_MAP_COVERAGE_RULES),
      },
      requiredStructuredFields: {
        thresholds: REQUIRED_INTERPRETATION_TARGET_MAP_REQUIREDNESS_THRESHOLDS,
        coverageRules: REQUIRED_INTERPRETATION_TARGET_MAP_COVERAGE_RULES,
      },
      requiredExactFields: { policyVersion: INTERPRETATION_TARGET_MAP_REQUIREDNESS_POLICY_VERSION },
      requiredStringIncludes: {
        ordinaryItemPolicy: ["optional", "ordinary", "release-critical"],
        coverageManifestRule: ["policy id", "trigger class", "dimension-effect"],
        lmcaSourceBoundary: ["Project default", "LMCA", "does not state"],
      },
    },
  ),
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
    requiredObjectFields: ["interpretationPlausibilityByReading", "critiqueCoverageByInterpretation", "dimensionEffectByRubricDimension"],
    requiredObjectKeys: { dimensionEffectByRubricDimension: ["centrality", "strength", "overall"] },
    requiredObjectKeysFromArrayFields: [
      { objectField: "interpretationPlausibilityByReading", arrayField: "plausiblePositionCritiqueInterpretations" },
      { objectField: "critiqueCoverageByInterpretation", arrayField: "plausiblePositionCritiqueInterpretations" },
    ],
    allowedValues: {
      requirednessTriggerClass: REQUIRED_INTERPRETATION_TARGET_MAP_TRIGGER_CLASSES,
      requirednessDecisionStatus: interpretationTargetMapRequirednessDecisionStatuses,
    },
  }),
  workflowWriteSpec(
    /^\/api\/v1\/verification-claim-granularity-policies$/,
    "verification_claim_granularity_policy_submitted",
    "verificationClaimGranularityPolicy",
    adminAuditRoles,
    {
      allowHiddenMetadata: true,
      requiredFields: verificationClaimGranularityPolicyRequiredFields,
      requiredNonEmptyArrayFields: ["claimGranularityClasses", "allowedClaimTypes", "allowedClaimStatuses", "allowedReviewStatuses"],
      requiredObjectFields: ["thresholds", "granularityRules"],
      requiredArrayIncludes: {
        claimGranularityClasses: REQUIRED_VERIFICATION_CLAIM_GRANULARITY_CLASSES,
        allowedClaimTypes: verificationWorkspaceClaimTypes,
        allowedClaimStatuses: verificationWorkspaceClaimStatuses,
        allowedReviewStatuses: verificationClaimGranularityReviewStatuses,
      },
      requiredObjectKeys: {
        thresholds: Object.keys(REQUIRED_VERIFICATION_CLAIM_GRANULARITY_THRESHOLDS),
        granularityRules: Object.keys(REQUIRED_VERIFICATION_CLAIM_GRANULARITY_RULES),
      },
      requiredStructuredFields: {
        thresholds: REQUIRED_VERIFICATION_CLAIM_GRANULARITY_THRESHOLDS,
        granularityRules: REQUIRED_VERIFICATION_CLAIM_GRANULARITY_RULES,
      },
      requiredExactFields: { policyVersion: VERIFICATION_CLAIM_GRANULARITY_POLICY_VERSION },
      requiredStringIncludes: {
        worksheetLinkageRule: ["Release-critical", "claim-weight worksheet", "not practicable"],
        sourceBoundary: ["Project default", "LMCA", "does not state"],
      },
    },
  ),
  workflowWriteSpec(/^\/api\/v1\/verification-workspace-sessions$/, "verification_workspace_session_submitted", "verificationWorkspaceSession", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: verificationWorkspaceSessionRequiredFields,
    requiredNonEmptyArrayFields: ["itemKeys", "claimList", "claimSpanRefs", "evidenceMaterialRefs"],
    requiredObjectFields: ["claimVerificationStatusByClaim"],
    requiredObjectKeysFromArrayFields: [{ objectField: "claimVerificationStatusByClaim", arrayField: "claimSpanRefs" }],
    allowedObjectValues: { claimVerificationStatusByClaim: verificationWorkspaceClaimStatuses },
    requiredBooleanFields: ["correctnessHalfEntireUnclearFlag", "nonBlindAuxiliaryMaterialConsulted"],
    allowedValues: {
      claimType: verificationWorkspaceClaimTypes,
      verificationStatus: verificationWorkspaceClaimStatuses,
      claimGranularityClass: REQUIRED_VERIFICATION_CLAIM_GRANULARITY_CLASSES,
      claimGranularityReviewStatus: verificationClaimGranularityReviewStatuses,
    },
    requiredWhen: [{ field: "verificationStatus", equals: "not_practicable", requiredFields: ["notPracticableJustification"] }],
  }),
  workflowWriteSpec(/^\/api\/v1\/model-family-overlap-policies$/, "model_family_overlap_policy_submitted", "modelFamilyOverlapPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "policyRules",
      "exactSnapshotRule",
      "exactAliasRule",
      "familyMatchRule",
      "providerOnlyExclusionRule",
      "cleanClaimRule",
      "sourceBoundary",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["overlapMatchBases", "forbiddenOverlapBases", "cleanClaimActions"],
    requiredObjectFields: ["policyRules"],
    requiredArrayIncludes: {
      overlapMatchBases: modelFamilyOverlapMatchBases,
      forbiddenOverlapBases: modelFamilyOverlapForbiddenBases,
      cleanClaimActions: modelFamilyOverlapCleanClaimActions,
    },
    allowedArrayValues: {
      overlapMatchBases: modelFamilyOverlapMatchBases,
      forbiddenOverlapBases: modelFamilyOverlapForbiddenBases,
      cleanClaimActions: modelFamilyOverlapCleanClaimActions,
    },
    requiredObjectKeys: { policyRules: Object.keys(modelFamilyOverlapPolicyRules) },
    requiredStructuredFields: { policyRules: modelFamilyOverlapPolicyRules },
    requiredStringIncludes: {
      exactSnapshotRule: ["exact resolved model snapshot", "overlap-sensitive"],
      exactAliasRule: ["exact requested model alias", "overlap-sensitive"],
      familyMatchRule: ["close model-family", "overlap-sensitive"],
      providerOnlyExclusionRule: ["provider-only", "not sufficient"],
      cleanClaimRule: ["clean independent", "human-only pre-assistance", "overlap-sensitive"],
      sourceBoundary: ["Project default", "LMCA", "does not state"],
    },
    requiredExactFields: { policyVersion: modelFamilyOverlapPolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/rating-checks$/, "rating_check_record_submitted", "ratingCheck", ratingWorkflowRoles, {
    requiredFields: ratingCheckRecordRequiredFields,
    requiredNonEmptyArrayFields: ["auxiliaryMaterialSeen"],
    allowedValues: { checkType: ratingCheckTypes, modelExposureTiming: ratingCheckModelExposureTimings },
    requiredWhen: [
      {
        field: "checkType",
        equals: "model_assisted_check",
        requiredFields: modelAssistedRatingCheckRequiredFields,
        requiredArrayIncludes: { auxiliaryMaterialSeen: modelAssistedAuxiliaryMaterialRequirements },
        requiredExactFields: {
          humanOnlyCheckLockedBeforeModelExposure: true,
          modelExposureTiming: "post_human_only_self_check_lock",
        },
        requiredStringIncludes: { modelAssistanceDeltaSummary: ["human-only"] },
      },
    ],
    requireActorField: "checkerId",
  }),
  workflowWriteSpec(/^\/api\/v1\/calibration-feedback-events$/, "calibration_feedback_event_submitted", "calibrationFeedbackEvent", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "raterId", "goldItemId", "attemptRatingId", "rubricVersion", "perDimensionDeviationSummary", "feedbackTextVersion", "shownAfterLock", "protectedSplitConflictCheck"],
  }),
  workflowWriteSpec(/^\/api\/v1\/prompt-templates$/, "prompt_template_submitted", "promptTemplate", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "promptFamily",
      "promptTrack",
      "promptVersion",
      "promptSourceScopeClass",
      "renderedPromptChecksum",
      "promptTextHash",
      "rubricVersion",
      "promptRole",
      "itemRoleLabelingPolicy",
      "positionTextLabelUsed",
      "critiqueLabelUsed",
      "legacyArgumentTerminologyFlag",
      "requestedOutputSchema",
      "reasoningElicitationPolicy",
      "answerExtractionPolicy",
      "fewShotExampleItemIds",
      "fewShotExamplePositionClusterIds",
      "exampleSplitSources",
      "protectedSplitExclusionPolicy",
      "itemDataDelimiterPolicy",
      "instructionHierarchyText",
      "toolAvailabilityPolicy",
      "promptInjectionArtifactFlagPolicy",
      "createdBy",
      "timestamp",
    ],
    requiredAnyFields: [["fullPromptBody", "promptBody", "promptArtifactUri"]],
    requiredExactFields: {
      protectedSplitExclusionPolicy: "exclude_hidden_benchmark_and_internal_validation_examples",
    },
    requiredStringIncludes: {
      itemDataDelimiterPolicy: ["delimiter"],
      instructionHierarchyText: ["data", "not instruction"],
      promptInjectionArtifactFlagPolicy: ["flag"],
    },
    requiredStringIncludesAny: {
      toolAvailabilityPolicy: ["no_tools", "disabled", "diagnostic"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/parser-configs$/, "parser_config_submitted", "parserConfig", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "acceptedSchema",
      "parserVersion",
      "scoreFieldRequirements",
      "retryPolicy",
      "repairPolicy",
      "invalidScoreHandling",
      "outOfRangeHandling",
      "missingFieldHandling",
      "protectedSplitRetryConstraints",
      "itemInternalInstructionHandling",
      "retryPromptInstructionPolicy",
      "retryProtectedAnswerLeakagePolicy",
      "outputWrapperHandling",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["scoreFieldRequirements"],
    requiredStringIncludes: {
      itemInternalInstructionHandling: ["reject", "item"],
      retryPromptInstructionPolicy: ["not", "item"],
      retryProtectedAnswerLeakagePolicy: ["no", "protected"],
      outputWrapperHandling: ["reject", "wrapper"],
      protectedSplitRetryConstraints: ["no", "protected"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/metric-configs$/, "metric_config_submitted", "metricConfig", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "metricFamily",
      "metricVersion",
      "scoringCodeArtifactChecksum",
      "lowClarityThreshold",
      "customLossTargetRole",
      "customLossPredictionRole",
      "scoreRoundingPolicy",
      "pairwiseHumanTiePolicy",
      "pairwiseHumanTieTolerance",
      "pairwiseModelTiePolicy",
      "pairwiseModelTieTolerance",
      "lowMarginThresholdConfig",
      "pairwiseMarginBinConfig",
      "defaultResamplingUnit",
      "defaultIntervalType",
      "defaultIntervalLevel",
      "defaultResampleCount",
      "defaultPairedVsIndependentIntervalPolicy",
      "unweightedPairwiseDiagnosticEnabled",
      "derivedUtilityPairwiseEnabled",
      "derivedUtilityFormulaId",
      "derivedUtilityFormulaBodyOrArtifact",
      "derivedUtilityLowClarityPolicy",
      "createdBy",
      "timestamp",
    ],
    requiredObjectFields: ["lowMarginThresholdConfig", "pairwiseMarginBinConfig"],
    requiredFiniteNumberFields: ["lowClarityThreshold", "pairwiseHumanTieTolerance", "pairwiseModelTieTolerance", "defaultIntervalLevel", "defaultResampleCount"],
    requiredExactFields: {
      unweightedPairwiseDiagnosticEnabled: true,
      derivedUtilityPairwiseEnabled: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/derived-utility-formulas$/, "derived_utility_formula_submitted", "derivedUtilityFormula", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "formulaName",
      "version",
      "formulaBodyOrArtifact",
      "inputDimensions",
      "weights",
      "centralityStrengthHandling",
      "deadWeightDirectionHandling",
      "singleIssueInterpretation",
      "lowClarityPolicy",
      "scoreNormalizationPolicy",
      "tiePolicy",
      "protectedSplitFitExclusionPolicy",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["inputDimensions"],
    requiredObjectFields: ["weights"],
    requiredExactFields: {
      deadWeightDirectionHandling: "badness_field_normalized_as_one_minus_dead_weight",
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/model-improvement-runs$/, "model_improvement_run_submitted", "modelImprovementRun", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "modelImprovementPolicyId",
      "trainingMethod",
      "trainingExportId",
      "targetLabelSnapshotId",
      "targetLabelVersion",
      "modelFamilyOrCheckpoint",
      "optimizedSurrogateObjectiveFamily",
      "humanMarginWeightingPolicy",
      "tieIndifferenceHandling",
      "positionBalancedWeightingPolicy",
      "labelUncertaintyPropagationPolicy",
      "highUncertaintyDownweightingPolicy",
      "calibrationTargetDistribution",
      "fitSplit",
      "devSplit",
      "modelImprovementApprovalStatus",
      "promptTrackExposurePolicy",
      "trainingPromptTemplateId",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["targetFields", "excludedProtectedSplits", "linkedPostTrainingEvaluationRunIds"],
    requiredArrayIncludes: {
      targetFields: modelImprovementTargetFields,
      excludedProtectedSplits: modelImprovementProtectedSplitExclusions,
    },
    allowedValues: {
      trainingMethod: modelImprovementMethods,
      optimizedSurrogateObjectiveFamily: modelImprovementObjectiveFamilies,
      modelImprovementApprovalStatus: modelImprovementApprovalStatuses,
    },
    requiredExactFields: {
      lmcaEvaluationMetricsSeparate: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/evaluations\/run$/, "evaluation_run_submitted", "evaluationRun", adminRoles, {
    allowHiddenMetadata: true,
    policyActionKind: "evaluation_run",
    phaseGateLaneKind: "evaluation_lane",
    requiredFields: [
      "id",
      "releaseId",
      "targetLabelSnapshotId",
      "targetLabelVersion",
      "requestedModelAlias",
      "resolvedModelSnapshot",
      "promptTemplateId",
      "renderedPromptChecksum",
      "promptPolicyComparabilityStatus",
      "parserConfigId",
      "metricConfigId",
      "pairwiseComparisonSnapshotId",
      "ratingContextSnapshotPolicy",
      "humanTargetTiePolicy",
      "modelPredictionTiePolicy",
      "answerExtractionPolicy",
      "reasoningMode",
      "itemDataDelimiterPolicy",
      "instructionHierarchyText",
      "toolAvailabilityPolicy",
      "promptInjectionArtifactFlagPolicy",
      "parserRetryPolicy",
      "promptExampleItemIds",
      "promptExamplePositionClusterIds",
      "promptExampleSplitMembership",
      "promptExampleExclusionPolicy",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["metricFamilies", "excludedProtectedSplits"],
    requiredObjectFields: ["modelParameterSettings"],
    requiredArrayIncludes: {
      excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
    },
    requiredStringIncludes: {
      itemDataDelimiterPolicy: ["delimiter"],
      instructionHierarchyText: ["data", "not instruction"],
      promptInjectionArtifactFlagPolicy: ["flag"],
      parserRetryPolicy: ["schema", "not item"],
      promptExampleExclusionPolicy: ["hidden", "protected"],
    },
    requiredStringIncludesAny: {
      toolAvailabilityPolicy: ["no_tools", "disabled", "diagnostic"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/evaluations\/(?<id>[^/]+)\/predictions$/, "model_evaluation_prediction_submitted", "modelEvaluationPrediction", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "evaluationRunId",
    requiredFields: [
      "id",
      "releaseId",
      "positionId",
      "critiqueId",
      "positionTextVersionId",
      "critiqueTextVersionId",
      "renderedItemHash",
      "ratingContextSnapshotId",
      "requestedModelAlias",
      "resolvedModelSnapshot",
      "promptTemplateId",
      "renderedPromptChecksum",
      "parserConfigId",
      "rawModelResponse",
      "parseStatus",
      "answerExtractionPolicy",
      "reasoningMode",
      "reasoningBudget",
      "cueCondition",
      "obfuscationStressVariant",
      "delimitedItemTextIntegrityStatus",
      "itemInternalInstructionFlag",
      "parserRetryInstructionAdherence",
      "outputSchemaValidationStatus",
      "toolUseObserved",
      "rawOutputPreserved",
      "timestamp",
    ],
    requiredObjectFields: ["modelParameterSettings"],
    requiredAnyFields: [["scores", "parsedFullRubricScores", "parsedOverallScore"]],
    allowedValues: {
      itemInternalInstructionFlag: ["none_detected", "instruction_like_text_flagged_inert", "model_output_wrapper_flagged_inert"],
    },
    requiredExactFields: {
      delimitedItemTextIntegrityStatus: "delimited_inert_data_preserved",
      parserRetryInstructionAdherence: "evaluator_prompt_followed_item_text_not_obeyed",
      outputSchemaValidationStatus: "schema_validated",
      toolUseObserved: false,
      rawOutputPreserved: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/evaluations\/(?<id>[^/]+)\/calibrate$/, "calibration_run_submitted", "calibrationRun", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "evaluationRunId",
    requiredFields: [
      "id",
      "releaseId",
      "targetLabelSnapshotId",
      "targetLabelVersion",
      "calibrationScope",
      "transformation",
      "rawMetricsArtifactId",
      "recalibratedMetricsArtifactId",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["fitSplits", "targetDimensions", "excludedProtectedSplits"],
    requiredObjectFields: ["fittedParameters"],
    requiredArrayIncludes: {
      excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
    },
    requiredExactFields: {
      protectedLeakageCount: 0,
      rawAndCalibratedSeparate: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/artifact-probes\/run$/, "artifact_probe_run_submitted", "artifactProbeRun", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "splitEvaluated",
      "targetLabelSnapshotId",
      "targetLabelVersion",
      "inputView",
      "requestedModelAlias",
      "protectedMetadataHandling",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["featureSet"],
    requiredObjectFields: ["metricOutputs"],
    allowedValues: { inputView: ARTIFACT_PROBE_INPUT_VIEWS },
  }),
  workflowWriteSpec(/^\/api\/v1\/sycophancy-probes\/run$/, "sycophancy_probe_run_submitted", "sycophancyProbeRun", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "releaseId", "targetLabelSnapshotId", "targetLabelVersion", "requestedModelAlias", "protectedDataHandling", "createdBy", "timestamp"],
    requiredNonEmptyArrayFields: ["pairedEvaluationRunIds", "cueTypesTested"],
    requiredArrayIncludes: { cueTypesTested: SYCOPHANCY_ORTHODOXY_CUE_TYPES },
    allowedArrayValues: { cueTypesTested: SYCOPHANCY_ORTHODOXY_CUE_TYPES },
    requiredObjectFields: ["cueSensitivitySummary"],
  }),
  workflowWriteSpec(/^\/api\/v1\/obfuscation-stress-runs$/, "obfuscation_stress_run_submitted", "obfuscationStressRun", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "releaseId", "targetLabelSnapshotId", "targetLabelVersion", "requestedModelAlias", "protectedDataHandling", "createdBy", "timestamp"],
    requiredNonEmptyArrayFields: ["pairedEvaluationRunIds", "variantFamilies", "clearBaselineItemIds"],
    requiredArrayIncludes: { variantFamilies: OBFUSCATION_STRESS_VARIANT_FAMILIES },
    allowedArrayValues: { variantFamilies: OBFUSCATION_STRESS_VARIANT_FAMILIES },
    requiredObjectFields: ["stressResultSummary"],
  }),
  workflowWriteSpec(/^\/api\/v1\/sanity-baselines\/run$/, "sanity_baseline_run_submitted", "sanityBaselineRun", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "releaseId", "baselineType", "targetLabelSnapshotId", "targetLabelVersion", "metricFamily", "metricVersion", "createdBy", "timestamp"],
    requiredNonEmptyArrayFields: ["fitSplits", "excludedProtectedSplits"],
    requiredObjectFields: ["metricOutputs", "coverageCounts"],
    requiredArrayIncludes: {
      excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
    },
    allowedValues: { baselineType: SANITY_BASELINE_TYPES },
  }),
  workflowWriteSpec(/^\/api\/v1\/benchmark-refresh-policies$/, "benchmark_refresh_policy_submitted", "benchmarkRefreshPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "cadenceDaysBySaturationStatus",
      "policyRules",
      "saturationCadenceRule",
      "thinValidationCadenceRule",
      "maintenanceCadenceRule",
      "refreshActionMinimumRule",
      "protectedSplitGovernanceRule",
      "claimSuppressionRule",
      "sourceBoundary",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["requiredRefreshActions", "requiredQueueFields"],
    requiredObjectFields: ["cadenceDaysBySaturationStatus", "policyRules"],
    requiredObjectKeys: {
      cadenceDaysBySaturationStatus: Object.keys(benchmarkRefreshCadenceDaysByStatus),
      policyRules: Object.keys(benchmarkRefreshPolicyRules),
    },
    requiredStructuredFields: {
      cadenceDaysBySaturationStatus: benchmarkRefreshCadenceDaysByStatus,
      policyRules: benchmarkRefreshPolicyRules,
    },
    requiredArrayIncludes: {
      requiredRefreshActions: benchmarkRefreshActions,
      requiredQueueFields: benchmarkRefreshQueueFields,
    },
    allowedArrayValues: {
      requiredRefreshActions: benchmarkRefreshActions,
      requiredQueueFields: benchmarkRefreshQueueFields,
    },
    requiredStringIncludes: {
      saturationCadenceRule: ["saturation-risk", "30 days", "benchmark refresh"],
      thinValidationCadenceRule: ["thin validation", "90-day", "human-ceiling"],
      maintenanceCadenceRule: ["no-saturation", "180-day", "maintenance"],
      refreshActionMinimumRule: ["double rating", "expert double-checking", "harder"],
      protectedSplitGovernanceRule: ["protected validation", "hidden-benchmark", "governed"],
      claimSuppressionRule: ["claims", "suppressed", "diagnostic deferral"],
      sourceBoundary: ["Project default", "LMCA", "does not state"],
    },
    requiredExactFields: { policyVersion: benchmarkRefreshPolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/human-ceiling-runs$/, "human_ceiling_run_submitted", "humanCeilingRun", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "splitOrValidationSubset",
      "appendixCComparabilityFlag",
      "targetLabelSnapshotId",
      "targetLabelVersion",
      "comparisonType",
      "modelAssistedCheckInclusionPolicy",
      "uncertaintyMethod",
      "uncertaintyIntervalType",
      "intervalLevel",
      "intervalConstructionMethod",
      "resamplingUnit",
      "resampleCountOrDegreesOfFreedom",
      "randomSeedOrResamplingArtifact",
      "intervalComparisonScope",
      "saturationRiskThreshold",
      "createdBy",
      "timestamp",
    ],
    requiredFiniteNumberFields: ["validationCritiqueCount", "validationPositionCount", "coreAllItemsRaterCount", "discussionHours"],
    requiredObjectFields: ["metricOutputsByFamily"],
  }),
  workflowWriteSpec(/^\/api\/v1\/validation-tranche-evidence$/, "validation_tranche_evidence_submitted", "validationTrancheEvidence", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "targetLabelSnapshotId",
      "targetLabelVersion",
      "validationDesignStatus",
      "appendixCComparabilityStatus",
      "partialRaterCoverageSummary",
      "discussionSessionHourAccounting",
      "reviewerId",
      "reviewerRole",
      "createdAt",
    ],
    requiredFiniteNumberFields: ["validationCritiqueCount", "validationPositionCount", "coreAllItemsRaterCount"],
    requiredNonEmptyArrayFields: ["trancheRows", "comparisonRows"],
    requiredObjectArrayFieldValues: [
      { arrayField: "trancheRows", valueField: "tranche", requiredValues: VALIDATION_TRANCHE_TYPES },
      { arrayField: "comparisonRows", valueField: "comparison", requiredValues: VALIDATION_TRANCHE_REQUIRED_COMPARISONS },
    ],
    allowedObjectArrayFieldValues: [
      { arrayField: "trancheRows", valueField: "tranche", allowedValues: VALIDATION_TRANCHE_TYPES },
      { arrayField: "comparisonRows", valueField: "tranche", allowedValues: VALIDATION_TRANCHE_TYPES },
      { arrayField: "comparisonRows", valueField: "comparison", allowedValues: VALIDATION_TRANCHE_REQUIRED_COMPARISONS },
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/leaderboards$/, "leaderboard_submitted", "leaderboard", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "metricFamily",
      "targetLabelSnapshotId",
      "targetLabelVersion",
      "commonSubsetPolicy",
      "commonMetricFamilyEligibilityPolicy",
      "commonPromptPolicyRequirement",
      "commonReasoningModeRequirement",
      "superiorityClaimPolicy",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["evaluationRunIds", "uncertaintySupportedRankTiers", "pairedDifferenceRows"],
    requiredObjectFields: ["uncertaintyPolicy"],
    requiredObjectKeys: {
      uncertaintyPolicy: [
        "intervalType",
        "nominalLevel",
        "constructionMethod",
        "resamplingUnit",
        "resampleCountOrDegreesOfFreedom",
        "randomSeedOrArtifact",
      ],
    },
    requiredExactFields: {
      pointEstimateOnlyOrderingFlag: false,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/evaluations\/(?<id>[^/]+)\/failure-audits$/, "model_failure_audit_submitted", "modelFailureAudit", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "evaluationRunId",
    requiredFields: [
      "id",
      "releaseId",
      "targetLabelSnapshotId",
      "targetLabelVersion",
      "largestErrorPolicy",
      "promptTemplateId",
      "parserConfigId",
      "reasoningMode",
      "rawOutputProvenancePolicy",
      "protectedSplitHandling",
      "createdBy",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["excludedProtectedSplits"],
    requiredObjectFields: ["failureTaxonomy", "largestErrorSummary"],
    requiredArrayIncludes: {
      excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
    },
    requiredExactFields: {
      cannotReplaceAggregateMetrics: true,
    },
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
    allowedValues: { surface: uxSimplificationSurfaces },
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
    requiredFields: [
      "id",
      "policyVersion",
      "sourceTagVisibilityRules",
      "benchmarkGoldModelPeerVisibilityRules",
      "discussionIdentityRevealRules",
      "volunteerPerformanceMetadataVisibility",
      "verificationMaterialVisibility",
      "exportVisibilityRules",
      "frozenAt",
    ],
    requiredObjectFields: ["roleFieldActionMatrix"],
    requiredObjectKeys: { roleFieldActionMatrix: Object.keys(visibilityRoleFieldActionMatrix) },
    requiredStructuredFields: { roleFieldActionMatrix: visibilityRoleFieldActionMatrix },
    requiredNonEmptyArrayFields: ["roleClasses", "workflowStates", "fieldClasses", "allowedReadActions", "allowedWriteActions"],
    requiredArrayIncludes: { fieldClasses: policyBundleFieldClasses },
    requiredExactFields: {
      backendEnforced: true,
      exposureLogRequired: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/rating-workflow-profiles$/, "rating_workflow_profile_submitted", "ratingWorkflowProfile", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "profileVersion",
      "scoreExplanationPolicyId",
      "evidenceSpanRequirednessPolicy",
      "verificationWorkspaceRequirednessPolicy",
      "interpretationTargetMapRequirednessPolicy",
      "preSubmitLintPolicy",
      "releaseGateProfileLinkage",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: [
      "taskModesCovered",
      "requiredScoreFields",
      "requiredConfidenceValues",
      "triggerRequiredRationaleFields",
      "requiredIssuePanels",
      "optionalIssuePanels",
      "disabledControls",
    ],
    requiredArrayIncludes: {
      taskModesCovered: ratingWorkflowTaskModes,
      requiredScoreFields: rubricDimensions,
      requiredConfidenceValues: SCORE_CONFIDENCE_LEVELS,
      triggerRequiredRationaleFields: ["score_explanation"],
      requiredIssuePanels: ["safe_decline", "source_recognition", "item_issue_report"],
      optionalIssuePanels: ["evidence_spans", "interpretation_target_map", "correctness_verification_workspace"],
      disabledControls: ["peer_score_view_before_initial_lock", "model_judge_score_view_before_initial_lock", "hidden_metadata_view"],
    },
    allowedArrayValues: {
      requiredScoreFields: rubricDimensions,
      requiredConfidenceValues: SCORE_CONFIDENCE_LEVELS,
      triggerRequiredRationaleFields: ["score_explanation"],
      requiredIssuePanels: ["safe_decline", "source_recognition", "item_issue_report"],
      optionalIssuePanels: ["evidence_spans", "interpretation_target_map", "correctness_verification_workspace"],
      disabledControls: ["peer_score_view_before_initial_lock", "model_judge_score_view_before_initial_lock", "hidden_metadata_view"],
    },
    requiredExactFields: {
      safeDeclineAvailable: true,
      requiredConfidenceJudgment: true,
      evidenceSpanRequirednessPolicy: "optional_ordinary_required_for_disputed_release_critical",
      verificationWorkspaceRequirednessPolicy: "required_for_correctness_sensitive_unresolved_cases",
      interpretationTargetMapRequirednessPolicy: "required_for_interpretation_disputes_and_release_critical_escalations",
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/score-explanation-policies$/, "score_explanation_policy_submitted", "scoreExplanationPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "protectedStatusBlindPromptCopy",
      "sentenceGuidance",
      "qaRoutingPolicy",
      "protectedSplitCompatibilityClass",
      "createdBy",
      "frozenAt",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["coveredWorkflowSplitClasses", "ordinaryRequiredFields", "optionalFields", "triggerList", "inconsistencyRules"],
    requiredArrayIncludes: {
      coveredWorkflowSplitClasses: ratingWorkflowTaskModes,
      ordinaryRequiredFields: SCORE_EXPLANATION_ORDINARY_REQUIRED_FIELDS,
      optionalFields: SCORE_EXPLANATION_OPTIONAL_FIELDS,
      triggerList: SCORE_EXPLANATION_TRIGGER_RULES,
      inconsistencyRules: SCORE_EXPLANATION_INCONSISTENCY_RULES,
    },
    allowedArrayValues: {
      ordinaryRequiredFields: SCORE_EXPLANATION_ORDINARY_REQUIRED_FIELDS,
      optionalFields: SCORE_EXPLANATION_OPTIONAL_FIELDS,
      triggerList: SCORE_EXPLANATION_TRIGGER_RULES,
      inconsistencyRules: SCORE_EXPLANATION_INCONSISTENCY_RULES,
    },
    requiredExactFields: {
      extremeScoreThresholdLow: SCORE_EXPLANATION_EXTREME_THRESHOLD_LOW,
      extremeScoreThresholdHigh: SCORE_EXPLANATION_EXTREME_THRESHOLD_HIGH,
      overallVsCentralityStrengthGapThreshold: SCORE_EXPLANATION_OVERALL_PRODUCT_GAP_THRESHOLD,
      targetUnclearTrigger: true,
      highStakesWorkflowTrigger: true,
      postDiscussionRevisionTrigger: true,
      exposureFamiliarityConflictUncertaintyTrigger: true,
      protectedSplitCompatible: true,
    },
    requiredStringIncludesAny: {
      qaRoutingPolicy: ["qa"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/rating-escalation-policies$/, "rating_escalation_policy_submitted", "ratingEscalationPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "protectedStatusBlindRoutingCopy",
      "lmcaSourceBoundary",
      "createdBy",
      "frozenAt",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["triggerList"],
    requiredObjectFields: ["serviceLevelByTrigger"],
    requiredArrayIncludes: {
      triggerList: RATING_ESCALATION_TRIGGER_RULES,
    },
    allowedArrayValues: {
      triggerList: RATING_ESCALATION_TRIGGER_RULES,
    },
    requiredObjectKeys: {
      serviceLevelByTrigger: RATING_ESCALATION_TRIGGER_RULES,
    },
    requiredExactFields: {
      lowClarityThreshold: RATING_ESCALATION_LOW_CLARITY_THRESHOLD,
      lowClarityAdjudicationCount: RATING_ESCALATION_LOW_CLARITY_ADJUDICATION_COUNT,
      initialOverallSpreadThreshold: RATING_ESCALATION_OVERALL_SPREAD_THRESHOLD,
      centralityStrengthProductSpreadThreshold: RATING_ESCALATION_PRODUCT_SPREAD_THRESHOLD,
      correctnessSpreadThreshold: RATING_ESCALATION_CORRECTNESS_SPREAD_THRESHOLD,
      postDiscussionMaxSpreadTarget: RATING_ESCALATION_POST_DISCUSSION_MAX_SPREAD_TARGET,
    },
    requiredStringIncludesAny: {
      protectedStatusBlindRoutingCopy: ["workflow", "policy"],
      lmcaSourceBoundary: ["project", "default"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/disagreement-threshold-policies$/, "disagreement_threshold_policy_submitted", "disagreementThresholdPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "thresholds",
      "escalationRules",
      "postDiscussionResidualRule",
      "thinOverlapRule",
      "lmcaSourceBoundary",
      "frozenAt",
    ],
    requiredObjectFields: ["thresholds", "escalationRules"],
    requiredObjectKeys: {
      thresholds: Object.keys(disagreementThresholds),
      escalationRules: Object.keys(disagreementEscalationRules),
    },
    requiredStructuredFields: {
      thresholds: disagreementThresholds,
      escalationRules: disagreementEscalationRules,
    },
    requiredStringIncludes: {
      postDiscussionResidualRule: ["0.30", "classification", "memo"],
      thinOverlapRule: ["two", "final raters"],
      lmcaSourceBoundary: ["Project", "LMCA"],
    },
    requiredExactFields: { policyVersion: disagreementThresholdPolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/ui-experiment-policies$/, "ui_experiment_policy_submitted", "uiExperimentPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "sensitivityPowerPolicyVersion",
      "materialChangeDefinition",
      "sensitivityPrimaryOutcomeMetric",
      "sensitivityUnderpoweredDisposition",
      "compatibilityRuleForMixedRenderVersions",
      "uxSimplificationCompatibilityRule",
      "lmcaSourceBoundary",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["coveredSplitLaneClasses", "allowedUiVariantIds", "blockedExperimentClasses"],
    requiredFiniteNumberFields: [
      "sensitivityMinimumPower",
      "sensitivityAlpha",
      "sensitivityMinimumDetectableEffectOverall",
      "sensitivityMinimumPerVariantCellCount",
      "sensitivityMaxProtectedVariantImbalance",
    ],
    requiredNumberRanges: [
      { field: "sensitivityMinimumPower", min: 0, max: 1 },
      { field: "sensitivityAlpha", min: 0, max: 1 },
      { field: "sensitivityMinimumDetectableEffectOverall", min: 0, max: 1 },
      { field: "sensitivityMinimumPerVariantCellCount", min: 1 },
      { field: "sensitivityMaxProtectedVariantImbalance", min: 0, max: 1 },
    ],
    requiredArrayIncludes: {
      coveredSplitLaneClasses: protectedUiLaneClasses,
      blockedExperimentClasses: blockedUiExperimentClasses,
    },
    requiredExactFields: {
      sensitivityPowerPolicyVersion: UI_VARIANT_SENSITIVITY_POWER_POLICY_VERSION,
      unregisteredMaterialChangesBlocked: true,
      sensitivitySnapshotRequired: true,
      sensitivityPrimaryOutcomeMetric: "overall_score_mean_difference",
      sensitivityMinimumPower: REQUIRED_UI_VARIANT_SENSITIVITY_MINIMUM_POWER,
      sensitivityAlpha: REQUIRED_UI_VARIANT_SENSITIVITY_ALPHA,
      sensitivityMinimumDetectableEffectOverall: REQUIRED_UI_VARIANT_SENSITIVITY_MDE_OVERALL,
      sensitivityMinimumPerVariantCellCount: REQUIRED_UI_VARIANT_SENSITIVITY_MIN_CELL_COUNT,
      sensitivityMaxProtectedVariantImbalance: REQUIRED_UI_VARIANT_SENSITIVITY_MAX_IMBALANCE,
    },
    requiredStringIncludes: {
      sensitivityUnderpoweredDisposition: ["block", "quarantine"],
      lmcaSourceBoundary: ["Project", "default"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/pre-submit-assist-policies$/, "pre_submit_assist_policy_submitted", "preSubmitAssistPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "rubricVersion", "workflowProfileId", "acknowledgementPolicy", "frozenAt"],
    requiredNonEmptyArrayFields: ["permittedAssistTypes", "prohibitedInputs"],
    requiredArrayIncludes: {
      permittedAssistTypes: ["deterministic_completeness_check", "rubric_anchor_reminder", "non_directive_issue_prompt"],
      prohibitedInputs: prohibitedAssistInputs,
    },
    requiredExactFields: {
      deterministic: true,
      labelBlind: true,
      nonDirective: true,
      targetScoreSuggestionsProhibited: true,
      protectedSplitEligible: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/accessibility-conformance-reports$/, "accessibility_conformance_report_submitted", "accessibilityConformanceReport", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "toolingPolicyVersion",
      "wcagConformanceTarget",
      "uiExperimentPolicyId",
      "uxSimplificationPolicyId",
      "toolingReviewStatus",
      "readabilityReviewStatus",
      "sourceBoundary",
      "reviewer",
      "timestamp",
    ],
    requiredObjectFields: ["assistiveTechnologyMatrix"],
    requiredObjectKeys: { assistiveTechnologyMatrix: Object.keys(accessibilityAssistiveTechnologyMatrix) },
    requiredStructuredFields: { assistiveTechnologyMatrix: accessibilityAssistiveTechnologyMatrix },
    requiredNonEmptyArrayFields: [
      "workflowProfileIds",
      "screenIds",
      "raterInstructionRenderVersionIds",
      "testedLocaleSet",
      "checksPassed",
      "testToolchain",
      "evidenceArtifactTypes",
      "raterUxAcceptanceChecks",
      "accessibilityEvidenceArtifactIds",
    ],
    requiredArrayIncludes: {
      screenIds: accessibilitySurfaces,
      checksPassed: accessibilityChecks,
      testToolchain: accessibilityTestToolchain,
      evidenceArtifactTypes: accessibilityEvidenceArtifactTypes,
      raterUxAcceptanceChecks,
    },
    requiredStringIncludes: {
      sourceBoundary: ["project default", "LMCA", "accessibility tool"],
    },
    requiredExactFields: {
      toolingPolicyVersion: accessibilityToolingPolicyVersion,
      wcagConformanceTarget: accessibilityWcagConformanceTarget,
      toolingReviewStatus: "passed",
      readabilityReviewStatus: "passed",
      nonStaffPromotionBlocker: false,
      manualAssistiveTechReviewRequired: true,
      automatedAuditAloneInsufficient: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/volunteer-incentive-policies$/, "volunteer_incentive_policy_submitted", "volunteerIncentivePolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "compensationCurrency",
      "compensationRateUsdByEligibleUnit",
      "monthlyCompensationCapUsd",
      "compensationEligibilityPolicy",
      "payrollLegalImplementationPolicy",
      "paymentDataSeparationPolicy",
      "speedEffortGuardrails",
      "publicRecognitionPolicy",
      "privateProgressDashboardPolicy",
      "calibrationFeedbackUseLimits",
      "hiddenBenchmarkGoldPerformanceExclusionPolicy",
      "leaderboardBadgeRestrictions",
      "frozenAt",
    ],
    requiredObjectFields: ["compensationRateUsdByEligibleUnit"],
    requiredObjectKeys: { compensationRateUsdByEligibleUnit: Object.keys(compensationRateUsdByEligibleUnit) },
    requiredStructuredFields: { compensationRateUsdByEligibleUnit },
    requiredNonEmptyArrayFields: ["allowedCompensationCreditInputs", "prohibitedIncentiveSignals"],
    requiredArrayIncludes: { prohibitedIncentiveSignals },
    requiredStringIncludes: {
      speedEffortGuardrails: ["qa"],
      privateProgressDashboardPolicy: ["private", "non-gamified"],
      hiddenBenchmarkGoldPerformanceExclusionPolicy: ["hidden", "never"],
    },
    requiredStringIncludesAny: {
      publicRecognitionPolicy: ["without", "no"],
      leaderboardBadgeRestrictions: ["no", "prohibit"],
    },
    requiredExactFields: {
      policyVersion: volunteerIncentivePolicyVersion,
      compensationCurrency,
      monthlyCompensationCapUsd,
      compensationEligibilityPolicy,
      payrollLegalImplementationPolicy,
      paymentDataSeparationPolicy,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-qualification-records$/, "rater_qualification_record_submitted", "raterQualificationRecord", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "raterId",
      "qualificationScope",
      "qualificationSource",
      "evidenceArtifactReference",
      "expiryReviewDate",
      "approver",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["approvedRoles", "topicFamilyScope", "splitWorkflowEligibility"],
    requiredArrayIncludes: { splitWorkflowEligibility: qualificationWorkflowEligibility },
    allowedValues: {
      qualificationScope: qualificationScopes,
      qualificationSource: qualificationSources,
    },
    requiredWhen: [
      {
        field: "qualificationSource",
        equals: "approved_exception",
        requiredFields: ["exceptionReason"],
      },
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/language-artifact-assessments$/, "language_artifact_assessment_submitted", "languageArtifactAssessment", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "artifactType",
      "pinDownabilityImpact",
      "substantiveAmbiguityImpact",
      "correctnessImpact",
      "deadWeightImpact",
      "overallQualityImpact",
      "reviewerRole",
      "visibilityState",
      "timestamp",
    ],
    requiredAnyFields: [["positionId", "critiqueId", "assignmentId", "ratingId", "adjudicationId"]],
    allowedValues: { artifactType: languageArtifactTypes },
    requiredExactFields: { automaticScorePenaltyApplied: false },
  }),
  workflowWriteSpec(/^\/api\/v1\/source-recognition-events$/, "source_recognition_event_submitted", "sourceRecognitionEvent", ratingWorkflowRoles, {
    requiredFields: ["id", "assignmentId", "raterId", "recognitionType", "raterAction", "independentBlindEligibilityEffect", "protectedStatusHiddenFromRater"],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
    allowedValues: {
      recognitionType: sourceRecognitionTypes,
      raterAction: sourceRecognitionActions,
    },
    requiredExactFields: {
      protectedStatusHiddenFromRater: true,
    },
    requiredStringIncludesAny: {
      independentBlindEligibilityEffect: sourceRecognitionBlindEffectFragments,
    },
    forbiddenStringFragments: {
      independentBlindEligibilityEffect: sourceRecognitionForbiddenBlindEffectFragments,
    },
    requiredWhen: [
      {
        field: "raterAction",
        equals: "continue_nonblind",
        requiredFields: ["reviewerResolution"],
        requiredStringIncludesAny: {
          independentBlindEligibilityEffect: ["excluded", "nonblind"],
          reviewerResolution: ["review", "expert"],
        },
      },
    ],
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/model-provider-data-handling-policies$/, "model_provider_data_handling_policy_submitted", "modelProviderDataHandlingPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "providerEndpointClass", "coveredRunClass", "subprocessorsSummary", "approvalStatus", "reviewer", "expiresAt"],
    requiredObjectFields: ["endpointContractClauses"],
    requiredObjectKeys: { endpointContractClauses: Object.keys(modelProviderEndpointContractClauses) },
    requiredStructuredFields: { endpointContractClauses: modelProviderEndpointContractClauses },
    requiredNonEmptyArrayFields: ["approvedSplitContentClasses"],
    requiredFiniteNumberFields: ["logRetentionWindowDays"],
    requiredNumberRanges: [{ field: "logRetentionWindowDays", min: 0, max: 30 }],
    requiredArrayIncludes: { approvedSplitContentClasses: ["protected_validation", "hidden_benchmark"] },
    allowedValues: { coveredRunClass: modelProviderRunClasses },
    requiredExactFields: {
      policyVersion: modelProviderEndpointContractPolicyVersion,
      endpointContractLanguageFrozen: true,
      contractAppliesToProtectedContent: true,
      noTrainingOnInputsOutputs: true,
      noPromptOrOutputReuse: true,
      unnecessaryHumanReviewProhibited: true,
      deletionOrRetentionProofRequired: true,
      protectedContentEligible: true,
      approvalStatus: "approved",
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/task-output-eligibility-policies$/, "task_output_eligibility_policy_submitted", "taskOutputEligibilityPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "adjudicationEvidencePolicy",
      "pairwisePreferenceExportPolicy",
      "trainingExportEligibility",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: [
      "assignmentOutputClasses",
      "eligibleLabelSnapshotUses",
      "excludedDenominatorClasses",
      "promotionToLabelRequirements",
      "protectedSplitExclusions",
    ],
    requiredArrayIncludes: {
      assignmentOutputClasses: ratingTaskOutputClasses,
      eligibleLabelSnapshotUses: ratingTaskOutputUses,
      excludedDenominatorClasses: ratingExcludedDenominatorClasses,
      promotionToLabelRequirements: ratingPromotionRequirements,
      protectedSplitExclusions: ratingProtectedSplitExclusions,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/score-input-policies$/, "score_input_policy_submitted", "scoreInputPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "scoreControlMode",
      "sliderSnapBehavior",
      "exportQuantizationPolicy",
      "correctionOverridePolicy",
      "protectedSplitCompatibilityClass",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["coveredWorkflowSplitClasses"],
    requiredArrayIncludes: { coveredWorkflowSplitClasses: ratingScoreInputSplits },
    requiredFiniteNumberFields: ["allowedPrecision", "defaultStep", "keyboardIncrement", "displayRounding", "rawStoragePrecision"],
    requiredExactFields: {
      manualNumericEntryAvailable: true,
      initialDefaultState: "unset_required",
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/draft-storage-policies$/, "draft_storage_policy_submitted", "draftStoragePolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "protectedLanePersistence", "clientStatePolicy", "ordinaryPracticeExceptionPolicy", "frozenAt"],
    requiredNonEmptyArrayFields: ["coveredWorkflowSplitClasses", "prohibitedClientPersistenceMechanisms"],
    requiredArrayIncludes: {
      coveredWorkflowSplitClasses: draftStorageLanes,
      prohibitedClientPersistenceMechanisms: prohibitedDraftClientPersistence,
    },
    requiredExactFields: {
      serverSidePersistenceDefault: true,
      localStorageProhibited: true,
      sessionStorageProhibited: true,
      indexedDbProhibited: true,
      persistentOfflineCacheProhibited: true,
      downloadedRecoveryBlobProhibited: true,
      clearOnLogoutRevocation: true,
      staleDraftDependencyBlocker: true,
    },
  }),
  workflowWriteSpec(
    /^\/api\/v1\/rater-instruction-compatibility-policies$/,
    "rater_instruction_compatibility_policy_submitted",
    "raterInstructionCompatibilityPolicy",
    adminRoles,
    {
      allowHiddenMetadata: true,
      requiredFields: [
        "id",
        "policyVersion",
        "protectedSplitMergePolicy",
        "sensitivitySnapshotPolicy",
        "lmcaSourceBoundary",
        "frozenAt",
      ],
      requiredNonEmptyArrayFields: ["coveredWorkflowSplitClasses", "compatibleRenderClasses", "requiredSharedPolicyFields"],
      requiredObjectFields: ["thresholds", "compatibilityRules"],
      requiredArrayIncludes: {
        coveredWorkflowSplitClasses: ratingScoreInputSplits,
        compatibleRenderClasses: raterInstructionCompatibilityClasses,
        requiredSharedPolicyFields: raterInstructionSharedPolicyFields,
      },
      requiredObjectKeys: {
        thresholds: Object.keys(raterInstructionCompatibilityThresholds),
        compatibilityRules: Object.keys(raterInstructionCompatibilityRules),
      },
      requiredStructuredFields: {
        thresholds: raterInstructionCompatibilityThresholds,
        compatibilityRules: raterInstructionCompatibilityRules,
      },
      requiredExactFields: { policyVersion: raterInstructionCompatibilityPolicyVersion },
      requiredStringIncludes: {
        protectedSplitMergePolicy: ["policy", "family"],
        sensitivitySnapshotPolicy: ["sensitivity", "snapshot"],
        lmcaSourceBoundary: ["Project", "LMCA"],
      },
    },
  ),
  workflowWriteSpec(/^\/api\/v1\/rater-instruction-render-versions$/, "rater_instruction_render_version_submitted", "raterInstructionRenderVersion", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "rubricVersion",
      "workflowProfileId",
      "renderedRubricAnchorChecksum",
      "scoreInputPolicyId",
      "uxSimplificationPolicyId",
      "scoreControlMode",
      "workflowBannerTextVersion",
      "issuePanelCopyVersion",
      "preSubmitAssistPolicyId",
      "rubricLintConfigId",
      "accessibilityVisualVariant",
      "uiExperimentPolicyId",
      "raterInstructionCompatibilityPolicyId",
      "renderCompatibilityClass",
      "compatibilityEvidenceStatus",
      "protectedSplitEligibilityPolicy",
      "sensitivitySnapshotPolicy",
      "frozenAt",
    ],
    requiredStringPrefixes: { renderedRubricAnchorChecksum: "sha256:" },
    allowedValues: { renderCompatibilityClass: raterInstructionCompatibilityClasses },
    requiredStringIncludes: {
      protectedSplitEligibilityPolicy: ["compatible"],
      sensitivitySnapshotPolicy: ["sensitivity", "snapshot"],
    },
    requiredExactFields: {
      scoreDefaultPolicy: "unset_required",
      compatibilityEvidenceStatus: "compatible_review_passed",
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/rubric-lint-configs$/, "rubric_lint_config_submitted", "rubricLintConfig", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "rubricVersion",
      "workflowProfileId",
      "preSubmitAssistPolicyId",
      "thresholdVersion",
      "triggerConditions",
      "severityPolicy",
      "requiredAcknowledgementExplanationPolicy",
      "qaRoutingPolicy",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["lintRuleIds", "acknowledgementModes"],
    requiredObjectFields: ["triggerThresholds"],
    requiredObjectKeys: { triggerThresholds: rubricLintRules },
    requiredArrayIncludes: { lintRuleIds: rubricLintRules, acknowledgementModes: rubricLintAcknowledgementModes },
    requiredExactFields: { protectedSplitEligible: true, thresholdVersion: rubricLintThresholdVersion },
    requiredStructuredFields: { triggerThresholds: rubricLintTriggerThresholds },
  }),
  workflowWriteSpec(/^\/api\/v1\/rubric-lint-events$/, "rubric_lint_event_submitted", "rubricLintEvent", ratingWorkflowRoles, {
    requiredFields: ["id", "assignmentId", "lintConfigId", "lintRuleId", "triggerState", "severity", "resolvedStatus"],
    requireAssignmentClaimField: "assignmentId",
    allowedValues: {
      lintRuleId: rubricLintRules,
      triggerState: ["triggered", "not_triggered", "acknowledged"],
      severity: ["info", "warning", "blocker"],
      resolvedStatus: ["acknowledged", "resolved", "overridden", "not_applicable"],
    },
    requiredWhen: [
      {
        field: "triggerState",
        equals: "triggered",
        requiredFields: ["acknowledgementNote"],
      },
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/item-issue-quarantine-policies$/, "item_issue_quarantine_policy_submitted", "itemIssueQuarantinePolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "triageVisibilityPolicy",
      "stalePropagationPolicy",
      "denominatorPolicy",
      "disclosurePolicy",
      "slaClockStart",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["issueCategories", "severityCategories"],
    requiredArrayIncludes: { issueCategories: itemIssueCategories },
    requiredObjectKeys: {
      quarantineSlaHoursBySeverity: itemIssueSeverities,
      quarantineActionRequirementBySeverity: itemIssueSeverities,
    },
    requiredStructuredFields: {
      severityCategories: itemIssueSeverityCategories,
      quarantineSlaHoursBySeverity: itemIssueQuarantineSlaHoursBySeverity,
      quarantineActionRequirementBySeverity: itemIssueQuarantineActionRequirementBySeverity,
    },
    requiredStringIncludes: {
      triageVisibilityPolicy: ["label", "model", "blind"],
      stalePropagationPolicy: ["dependent", "stale"],
      denominatorPolicy: ["excluded", "denominator"],
      disclosurePolicy: ["errata"],
      slaClockStart: ["createdAt"],
    },
    requiredExactFields: { policyVersion: itemIssueQuarantinePolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/item-issues$/, "item_issue_report_submitted", "itemIssueReport", ratingWorkflowRoles, {
    requiredFields: itemIssueReportRequiredFields,
    requiredAnyFields: [["positionId", "critiqueId", "assignmentId", "ratingId", "snapshotId", "evaluationId", "releaseId"]],
    allowedValues: { issueCategory: itemIssueCategories, severity: itemIssueSeverities },
    requiredStringIncludes: { quarantineStalePropagationState: ["quarantine", "stale", "propagation"] },
    requiredExactFields: {
      labelVisibilityStateForTriage: "hidden",
      modelResultVisibilityStateForTriage: "hidden",
      excludedFromLabelDenominator: true,
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
  workflowWriteSpec(/^\/api\/v1\/score-confidence-scale-policies$/, "score_confidence_scale_policy_submitted", "scoreConfidenceScalePolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "scaleVersion",
      "annotationUsePolicy",
      "lmcaSourceBoundary",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["dimensionCoverage", "confidenceBands", "allowedReasonCodes"],
    requiredObjectFields: ["numericThresholds"],
    requiredArrayIncludes: {
      dimensionCoverage: RUBRIC_DIMENSIONS,
      confidenceBands: scoreConfidenceBands,
      allowedReasonCodes: scoreConfidenceReasonCodes,
    },
    requiredObjectKeys: {
      numericThresholds: Object.keys(scoreConfidenceNumericThresholds),
    },
    requiredStructuredFields: {
      numericThresholds: scoreConfidenceNumericThresholds,
    },
    requiredStringIncludes: {
      annotationUsePolicy: ["not", "score"],
      lmcaSourceBoundary: ["Project", "LMCA"],
    },
    requiredExactFields: {
      policyVersion: scoreConfidenceScalePolicyVersion,
      scaleVersion: scoreConfidenceScaleVersion,
      excludedFromScoreComputationRequired: true,
      visibleToPeersBeforeLockRequired: false,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/score-confidence-annotations$/, "score_confidence_annotation_submitted", "scoreConfidenceAnnotation", ratingWorkflowRoles, {
    requiredFields: [
      "id",
      "scoreConfidenceScalePolicyId",
      "assignmentId",
      "ratingId",
      "raterId",
      "dimensionConfidences",
      "confidenceBandByDimension",
      "reasonCodeByDimension",
      "scaleVersion",
      "annotationUsePolicy",
      "timestamp",
    ],
    requiredObjectFields: ["dimensionConfidences", "confidenceBandByDimension", "reasonCodeByDimension"],
    requiredObjectKeys: {
      dimensionConfidences: RUBRIC_DIMENSIONS,
      confidenceBandByDimension: RUBRIC_DIMENSIONS,
      reasonCodeByDimension: RUBRIC_DIMENSIONS,
    },
    requiredStringIncludes: { annotationUsePolicy: ["not", "score"] },
    requiredExactFields: {
      scaleVersion: scoreConfidenceScaleVersion,
      excludedFromScoreComputation: true,
      visibleToPeersBeforeLock: false,
    },
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-score-confidences$/, "rater_score_confidence_submitted", "raterScoreConfidence", ratingWorkflowRoles, {
    requiredFields: [
      "id",
      "scoreConfidenceScalePolicyId",
      "assignmentId",
      "ratingId",
      "raterId",
      "dimensionConfidences",
      "confidenceBandByDimension",
      "reasonCodeByDimension",
      "scaleVersion",
      "annotationUsePolicy",
      "timestamp",
    ],
    requiredObjectFields: ["dimensionConfidences", "confidenceBandByDimension", "reasonCodeByDimension"],
    requiredObjectKeys: {
      dimensionConfidences: RUBRIC_DIMENSIONS,
      confidenceBandByDimension: RUBRIC_DIMENSIONS,
      reasonCodeByDimension: RUBRIC_DIMENSIONS,
    },
    requiredStringIncludes: { annotationUsePolicy: ["not", "score"] },
    requiredExactFields: {
      scaleVersion: scoreConfidenceScaleVersion,
      excludedFromScoreComputation: true,
      visibleToPeersBeforeLock: false,
    },
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(
    /^\/api\/v1\/rationale-evidence-span-requiredness-policies$/,
    "rationale_evidence_span_requiredness_policy_submitted",
    "rationaleEvidenceSpanRequirednessPolicy",
    adminRoles,
    {
      requiredFields: [
        "id",
        "policyVersion",
        "mandatoryTriggerClasses",
        "thresholds",
        "coverageRules",
        "requiredLinkCategories",
        "allowedVisibilityStates",
        "coverageManifestRule",
        "protectedVisibilityRule",
        "lmcaSourceBoundary",
        "frozenAt",
      ],
      requiredNonEmptyArrayFields: ["mandatoryTriggerClasses", "requiredLinkCategories", "allowedVisibilityStates"],
      requiredObjectFields: ["thresholds", "coverageRules"],
      requiredObjectKeys: {
        thresholds: Object.keys(rationaleEvidenceSpanRequirednessThresholds),
        coverageRules: Object.keys(rationaleEvidenceSpanCoverageRules),
      },
      requiredStructuredFields: {
        thresholds: rationaleEvidenceSpanRequirednessThresholds,
        coverageRules: rationaleEvidenceSpanCoverageRules,
      },
      requiredArrayIncludes: {
        mandatoryTriggerClasses: rationaleEvidenceSpanMandatoryTriggerClasses,
        requiredLinkCategories: rationaleEvidenceSpanLinkCategories,
        allowedVisibilityStates: rationaleEvidenceSpanVisibilityStates,
      },
      allowedArrayValues: {
        mandatoryTriggerClasses: rationaleEvidenceSpanMandatoryTriggerClasses,
        requiredLinkCategories: rationaleEvidenceSpanLinkCategories,
        allowedVisibilityStates: rationaleEvidenceSpanVisibilityStates,
      },
      requiredStringIncludes: {
        coverageManifestRule: ["mandatory", "span id", "active policy"],
        protectedVisibilityRule: ["raw selected text", "locked_initial_hidden"],
        lmcaSourceBoundary: ["Project", "LMCA"],
      },
      requiredExactFields: { policyVersion: rationaleEvidenceSpanRequirednessPolicyVersion },
    },
  ),
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
    allowedValues: {
      spanTarget: ["position", "critique"],
      linkedDimensionOrFlag: rationaleEvidenceSpanLinkCategories,
      visibilityState: rationaleEvidenceSpanVisibilityStates,
    },
    requiredExactFields: {
      hiddenUntilInitialRatingLock: true,
      rawSelectedTextStored: false,
    },
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/same-position-scratchpads$/, "same_position_scratchpad_submitted", "samePositionScratchpad", ratingWorkflowRoles, {
    requiredFields: ["id", "raterId", "positionId", "samePositionSessionId", "visibilityState", "promotedToRationaleIds", "timestamp"],
    requiredAnyFields: [["noteText", "encryptedNoteArtifact"]],
    requiredExactFields: { excludedFromLabelAndExport: true },
    requireActorField: "raterId",
  }),
  workflowWriteSpec(
    /^\/api\/v1\/same-position-batch-review-requiredness-policies$/,
    "same_position_batch_review_requiredness_policy_submitted",
    "samePositionBatchReviewRequirednessPolicy",
    adminRoles,
    {
      allowHiddenMetadata: true,
      requiredFields: [
        "id",
        "policyVersion",
        "nonIndependentEvidenceRule",
        "revisionPreservationRule",
        "visibilityRule",
        "lmcaSourceBoundary",
        "frozenAt",
      ],
      requiredNonEmptyArrayFields: ["triggerClasses", "reviewStatuses", "requirednessDecisionStatuses"],
      requiredObjectFields: ["thresholds", "requiredReviewRules"],
      requiredArrayIncludes: {
        triggerClasses: samePositionBatchReviewTriggerClasses,
        reviewStatuses: samePositionBatchReviewStatuses,
        requirednessDecisionStatuses: samePositionBatchReviewDecisionStatuses,
      },
      requiredObjectKeys: {
        thresholds: Object.keys(samePositionBatchReviewThresholds),
        requiredReviewRules: Object.keys(samePositionBatchReviewRules),
      },
      requiredStructuredFields: {
        thresholds: samePositionBatchReviewThresholds,
        requiredReviewRules: samePositionBatchReviewRules,
      },
      requiredStringIncludes: {
        nonIndependentEvidenceRule: ["not", "independent"],
        revisionPreservationRule: ["append", "original"],
        visibilityRule: ["own", "locked"],
        lmcaSourceBoundary: ["Project", "LMCA"],
      },
      requiredExactFields: {
        policyVersion: samePositionBatchReviewRequirednessPolicyVersion,
        excludedFromIndependentRaterCountRequired: true,
        raterOwnRatingsOnlyRequired: true,
        peerModelSourceMetadataHiddenRequired: true,
      },
    },
  ),
  workflowWriteSpec(/^\/api\/v1\/same-position-batch-reviews$/, "same_position_batch_review_submitted", "samePositionBatchReview", ratingWorkflowRoles, {
    requiredFields: [
      "id",
      "samePositionBatchReviewRequirednessPolicyId",
      "requirednessTriggerClass",
      "requirednessDecisionStatus",
      "raterId",
      "positionId",
      "samePositionSessionId",
      "productOverallDeltaSummary",
      "revisionProposals",
      "revisionIds",
      "reviewStatus",
      "nonIndependentEvidenceFlag",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["siblingRatingIdsReviewed"],
    allowedValues: {
      requirednessTriggerClass: samePositionBatchReviewTriggerClasses,
      requirednessDecisionStatus: samePositionBatchReviewDecisionStatuses,
      reviewStatus: samePositionBatchReviewStatuses,
    },
    requiredExactFields: {
      nonIndependentEvidenceFlag: true,
      excludedFromIndependentRaterCount: true,
      raterOwnRatingsOnly: true,
      peerModelSourceMetadataHidden: true,
    },
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/correctness-claim-weight-worksheets$/, "correctness_claim_weight_worksheet_submitted", "correctnessClaimWeightWorksheet", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: correctnessClaimWeightWorksheetRequiredFields,
    requiredAnyFields: [["ratingId", "adjudicationId", "verificationWorkspaceId"]],
    requiredNonEmptyArrayFields: ["claimSpanIds", "claimSignificanceWeights", "correctnessCredencesStatuses", "unclearClaimExclusionFlags"],
    requiredWhen: [{ field: "submittedScoreOverrideFlag", equals: true, requiredFields: ["overrideExplanation"] }],
  }),
  workflowWriteSpec(
    /^\/api\/v1\/external-assistance-contamination-policies$/,
    "external_assistance_contamination_policy_submitted",
    "externalAssistanceContaminationPolicy",
    adminRoles,
    {
      requiredFields: [
        "id",
        "policyVersion",
        "allowedAssistanceTypes",
        "contaminatingAssistanceTypes",
        "requiredContaminationRoutes",
        "allowedCleanRoutes",
        "accessibilityExceptionStatuses",
        "policyRules",
        "outsideSystemDisclosureRule",
        "protectedTextEventRule",
        "denominatorExclusionRule",
        "accessibilityExceptionRule",
        "sourceBoundary",
        "frozenAt",
      ],
      requiredNonEmptyArrayFields: [
        "allowedAssistanceTypes",
        "contaminatingAssistanceTypes",
        "requiredContaminationRoutes",
        "allowedCleanRoutes",
        "accessibilityExceptionStatuses",
      ],
      requiredObjectFields: ["policyRules"],
      requiredObjectKeys: { policyRules: Object.keys(externalAssistanceContaminationRules) },
      requiredStructuredFields: { policyRules: externalAssistanceContaminationRules },
      requiredArrayIncludes: {
        allowedAssistanceTypes: externalAssistanceTypes,
        contaminatingAssistanceTypes: externalAssistanceContaminatingTypes,
        requiredContaminationRoutes: externalAssistanceContaminationRoutes,
        allowedCleanRoutes: externalAssistanceCleanRoutes,
        accessibilityExceptionStatuses: externalAssistanceAccessibilityStatuses,
      },
      allowedArrayValues: {
        allowedAssistanceTypes: externalAssistanceTypes,
        contaminatingAssistanceTypes: externalAssistanceTypes,
        requiredContaminationRoutes: externalAssistanceContaminationRoutes,
        allowedCleanRoutes: externalAssistanceCleanRoutes,
        accessibilityExceptionStatuses: externalAssistanceAccessibilityStatuses,
      },
      requiredStringIncludes: {
        outsideSystemDisclosureRule: ["external-assistance", "outside system"],
        protectedTextEventRule: ["protected", "contamination-sensitive"],
        denominatorExclusionRule: ["excluded", "denominators"],
        accessibilityExceptionRule: ["accessibility", "non-content"],
        sourceBoundary: ["project", "lmca"],
      },
      requiredExactFields: { policyVersion: externalAssistanceContaminationPolicyVersion },
    },
  ),
  workflowWriteSpec(/^\/api\/v1\/external-assistance-declarations$/, "external_assistance_declaration_submitted", "externalAssistanceDeclaration", ratingWorkflowRoles, {
    requiredFields: ["id", "assignmentId", "raterId", "assistanceType", "protectedTextEventFlag", "contaminationRouting", "accessibilityExceptionStatus", "timestamp"],
    allowedValues: { assistanceType: ["none", "search", "LLM", "collaborator", "accessibility_tool", "other"] },
    requiredWhen: [
      {
        field: "assistanceType",
        values: ["search", "LLM", "collaborator", "accessibility_tool", "other"],
        requiredFields: ["outsideSystemDescription"],
        requiredStringIncludesAny: { contaminationRouting: ["excluded", "quarantine"] },
      },
      {
        field: "protectedTextEventFlag",
        equals: true,
        requiredFields: ["outsideSystemDescription"],
        requiredStringIncludesAny: { contaminationRouting: ["excluded", "quarantine"] },
      },
    ],
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/protected-artifact-retention-records$/, "protected_artifact_retention_record_submitted", "protectedArtifactRetentionRecord", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "artifactType",
      "artifactIdOrStoragePointer",
      "sourceSplitProtectionClass",
      "releaseConfigManifestId",
      "retentionDeletionPolicy",
      "cacheOutboxPurgeStatus",
      "backupSnapshotCoverage",
      "developmentStagingEligibility",
      "restoreTimeRevalidationStatus",
      "suspectedProtectedContentLeak",
      "incidentResponsePolicy",
      "dependentArtifactStalePolicy",
      "createdAt",
      "expiresAt",
    ],
    allowedValues: { artifactType: protectedArtifactTypes },
    requiredStringIncludesAny: {
      retentionDeletionPolicy: ["delete", "anonymize"],
      cacheOutboxPurgeStatus: ["purged", "not_cached"],
      backupSnapshotCoverage: ["split"],
      developmentStagingEligibility: ["revalidation"],
      restoreTimeRevalidationStatus: ["passed"],
    },
    requiredStringIncludes: {
      incidentResponsePolicy: ["pause", "stale", "review"],
      dependentArtifactStalePolicy: ["evaluation", "leaderboard", "label", "export"],
    },
    requiredWhen: [
      {
        field: "suspectedProtectedContentLeak",
        equals: true,
        requiredFields: ["incidentReviewDecision", "dependentArtifactImpactStatus", "submissionLanePauseStatus"],
        requiredNonEmptyArrayFields: ["incidentErratumLinks", "dependentArtifactClassesStaled"],
        requiredArrayIncludes: {
          dependentArtifactClassesStaled: ["evaluations", "leaderboards", "label_snapshots", "exports"],
        },
        requiredStringIncludes: {
          incidentReviewDecision: ["reason"],
          dependentArtifactImpactStatus: ["stale"],
          submissionLanePauseStatus: ["pause"],
        },
      },
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/protected-artifacts\/(?<id>[^/]+)\/revalidate$/, "protected_artifact_revalidation_submitted", "protectedArtifactRevalidation", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "protectedArtifactId",
    requiredFields: ["id", "protectedArtifactId", "releaseConfigManifestId", "revalidationStatus", "staleSupersededBehavior", "checkedBy", "checkedAt"],
    requiredExactFields: {
      revalidationStatus: "passed_current_manifest_revalidation",
      staleSupersededBehavior: "fail_closed_if_stale_or_superseded",
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/source-leakage-redaction-policies$/, "source_leakage_redaction_policy_submitted", "sourceLeakageRedactionPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "sourceIdentifiabilityRule",
      "raterVisibleChecksumRule",
      "unresolvedLeakageRule",
      "rawRetentionBoundary",
      "sourceBoundary",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["requiredLintPatterns", "sourceIdentifiabilityReviewStatuses"],
    requiredObjectFields: ["redactionActions"],
    requiredArrayIncludes: {
      requiredLintPatterns: REQUIRED_SOURCE_LEAKAGE_LINT_PATTERNS,
      sourceIdentifiabilityReviewStatuses: REQUIRED_SOURCE_IDENTIFIABILITY_REVIEW_STATUSES,
    },
    requiredObjectKeys: { redactionActions: REQUIRED_SOURCE_LEAKAGE_LINT_PATTERNS },
    requiredStructuredFields: { redactionActions: REQUIRED_SOURCE_LEAKAGE_REDACTION_ACTIONS },
    requiredStringIncludes: {
      sourceIdentifiabilityRule: ["substantively necessary", "expert", "sensitive"],
      raterVisibleChecksumRule: ["sha256", "rater-visible", "redaction"],
      unresolvedLeakageRule: ["no unresolved", "source-leakage", "blind"],
      rawRetentionBoundary: ["raw source metadata", "admin-only", "rater-visible"],
      sourceBoundary: ["Project default", "LMCA"],
    },
    requiredExactFields: { policyVersion: SOURCE_LEAKAGE_REDACTION_POLICY_VERSION },
  }),
  workflowWriteSpec(/^\/api\/v1\/blinding-preview-audits$/, "blinding_preview_audit_submitted", "blindingPreviewAudit", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "sourceLeakageRedactionPolicyId",
      "renderedRaterVisibleTextChecksum",
      "reviewerId",
      "reviewerRole",
      "approvalStatus",
      "unresolvedSourceLeakagePatternCount",
      "createdAt",
    ],
    requiredNonEmptyArrayFields: ["itemKeys", "itemTextVersionIds", "lintedSourceLeakagePatterns"],
    requiredArrayIncludes: { lintedSourceLeakagePatterns: REQUIRED_SOURCE_LEAKAGE_LINT_PATTERNS },
    requiredStringPrefixes: { renderedRaterVisibleTextChecksum: "sha256:" },
    requiredExactFields: {
      approvalStatus: "passed",
      unresolvedSourceLeakagePatternCount: 0,
    },
    requiredWhen: [
      {
        field: "sourceIdentifiabilitySensitive",
        equals: true,
        requiredFields: ["substantiveNecessityRationale"],
        requiredNonEmptyArrayFields: ["retainedSourceIdentifyingSpans"],
      },
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/partial-task-promotion-policies$/, "partial_task_promotion_policy_submitted", "partialTaskPromotionPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "denominatorExclusionRule",
      "sourceBoundary",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["coveredTaskTypes", "allowedEligibleUses", "excludedDenominators", "allowedPromotionReviewStatuses"],
    requiredObjectFields: ["promotionCriteriaByTaskType"],
    requiredArrayIncludes: {
      coveredTaskTypes: partialTaskOutputTypes,
      allowedEligibleUses: REQUIRED_PARTIAL_TASK_ELIGIBLE_USES,
      excludedDenominators: partialTaskExcludedDenominators,
      allowedPromotionReviewStatuses: REQUIRED_PARTIAL_TASK_PROMOTION_REVIEW_STATUSES,
    },
    requiredObjectKeys: { promotionCriteriaByTaskType: partialTaskOutputTypes },
    requiredStructuredFields: { promotionCriteriaByTaskType: REQUIRED_PARTIAL_TASK_PROMOTION_CRITERIA },
    requiredStringIncludes: {
      denominatorExclusionRule: ["full-rubric", "custom-loss", "hidden-benchmark", "human-ceiling"],
      sourceBoundary: ["Project default", "LMCA"],
    },
    requiredExactFields: {
      policyVersion: PARTIAL_TASK_PROMOTION_POLICY_VERSION,
      fullRubricPromotionProhibited: true,
      explicitPairwiseExportLabelRequired: true,
      adjudicationLinkRequiredForPromotion: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/partial-task-outputs$/, "partial_task_output_submitted", "partialTaskOutput", ratingWorkflowRoles, {
    requiredFields: ["id", "partialTaskPromotionPolicyId", "assignmentId", "raterId", "taskType", "visibilityExposureState", "promotionReviewStatus", "timestamp"],
    requiredNonEmptyArrayFields: ["itemKeys", "eligibleUses", "excludedDenominators"],
    requiredObjectFields: ["outputFields"],
    requiredArrayIncludes: { eligibleUses: REQUIRED_PARTIAL_TASK_ELIGIBLE_USES, excludedDenominators: partialTaskExcludedDenominators },
    allowedValues: { taskType: partialTaskOutputTypes, promotionReviewStatus: REQUIRED_PARTIAL_TASK_PROMOTION_REVIEW_STATUSES },
    requiredExactFields: { countedAsFullRubricRating: false },
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/exposure-quarantine-policies$/, "exposure_quarantine_policy_submitted", "exposureQuarantinePolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "assignmentRecheckRule",
      "denominatorBoundaryRule",
      "sourceBoundary",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: [
      "quarantineTriggerClasses",
      "requiredAssignmentExposureChecks",
      "allowedExposureSources",
      "allowedQuarantineReviewStatuses",
      "requiredBlindEligibilityEffects",
    ],
    requiredObjectFields: ["quarantineActionsByTrigger"],
    requiredArrayIncludes: {
      quarantineTriggerClasses: exposureQuarantineTriggerClasses,
      requiredAssignmentExposureChecks: exposureQuarantineAssignmentChecks,
      allowedExposureSources: positionClusterExposureSources,
      allowedQuarantineReviewStatuses: exposureQuarantineReviewStatuses,
      requiredBlindEligibilityEffects: exposureQuarantineEffects,
    },
    requiredObjectKeys: { quarantineActionsByTrigger: exposureQuarantineTriggerClasses },
    requiredStructuredFields: { quarantineActionsByTrigger: exposureQuarantineActions },
    requiredStringIncludes: {
      assignmentRecheckRule: ["Later-added sibling", "post-lock discussion", "model-assisted checks"],
      denominatorBoundaryRule: ["fresh blind initial", "human-only", "independent"],
      sourceBoundary: ["Project default", "LMCA"],
    },
    requiredExactFields: {
      policyVersion: exposureQuarantinePolicyVersion,
      siblingContextRecheckRequired: true,
      postLockExposureQuarantineRequired: true,
      modelAssistedCheckHumanOnlyExclusionRequired: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/raters\/(?<id>[^/]+)\/position-cluster-exposures$/, "rater_position_cluster_exposure_submitted", "raterPositionClusterExposure", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    pathParamField: "raterId",
    requiredFields: [
      "id",
      "exposureQuarantinePolicyId",
      "raterId",
      "positionClusterId",
      "exposureSource",
      "exposureTimestamp",
      "exposureVisibilityScope",
      "blindEligibilityEffect",
      "quarantineReviewStatus",
      "quarantineAction",
      "createdBy",
      "timestamp",
    ],
    allowedValues: { exposureSource: positionClusterExposureSources, quarantineReviewStatus: exposureQuarantineReviewStatuses },
    requiredStringIncludesAny: {
      blindEligibilityEffect: ["excluded", "blocked", "non_blind"],
      quarantineAction: ["reassign", "non_blind", "excluded", "block", "training"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/spot-check-sampling-policies$/, "spot_check_sampling_policy_submitted", "spotCheckSamplingPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "ordinaryRatingStatusRequired", "sampleExclusionRule", "labelMutationRule", "lmcaSourceBoundary", "frozenAt"],
    requiredNonEmptyArrayFields: ["sampledWorkflowStrata", "samplingDimensions", "selectionMethods"],
    requiredObjectFields: ["minimumSamplingRateByStratum", "minimumSampleCountByStratum"],
    requiredArrayIncludes: {
      sampledWorkflowStrata: spotCheckSamplingStrata,
      samplingDimensions: spotCheckSamplingDimensions,
      selectionMethods: spotCheckSelectionMethods,
    },
    requiredObjectKeys: {
      minimumSamplingRateByStratum: Object.keys(spotCheckMinimumRateByStratum),
      minimumSampleCountByStratum: Object.keys(spotCheckMinimumCountByStratum),
    },
    requiredStructuredFields: {
      minimumSamplingRateByStratum: spotCheckMinimumRateByStratum,
      minimumSampleCountByStratum: spotCheckMinimumCountByStratum,
    },
    requiredExactFields: {
      policyVersion: spotCheckSamplingPolicyVersion,
      ordinaryRatingStatusRequired: "apparently_ordinary_non_escalated",
      excludedFromIndependentRaterCountRequired: true,
    },
    requiredStringIncludes: {
      sampleExclusionRule: ["excluded", "independent"],
      labelMutationRule: ["not", "mutate"],
      lmcaSourceBoundary: ["Project", "LMCA"],
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/spot-checks$/, "spot_check_qa_item_submitted", "spotCheckQaItem", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "spotCheckSamplingPolicyId",
      "samplingStratum",
      "samplingSeedArtifact",
      "selectionMethod",
      "ordinaryRatingStatus",
      "reviewerId",
      "reviewerRole",
      "checkResult",
      "timestamp",
    ],
    requiredNonEmptyArrayFields: ["itemKeys", "samplingDimensions"],
    requiredArrayIncludes: { samplingDimensions: spotCheckSamplingDimensions },
    allowedArrayValues: { samplingDimensions: spotCheckSamplingDimensions },
    allowedValues: { selectionMethod: spotCheckSelectionMethods, checkResult: spotCheckResultStatuses },
    requiredStringPrefixes: { samplingSeedArtifact: "sha256:" },
    requiredExactFields: { excludedFromIndependentRaterCount: true, ordinaryRatingStatus: "apparently_ordinary_non_escalated" },
  }),
  workflowWriteSpec(/^\/api\/v1\/rating-effort-qa-reviews$/, "rating_effort_qa_review_submitted", "ratingEffortQaReview", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "ratingId", "reviewerId", "reviewerRole", "reviewDecision", "sensitiveUseDecision", "timestamp"],
    requiredNonEmptyArrayFields: ["itemKeys", "routeReasonsReviewed"],
    allowedValues: { reviewDecision: RATING_EFFORT_QA_REVIEW_DECISIONS },
    requiredExactFields: {
      labelMutationProhibited: true,
      independentRaterDenominatorUnchanged: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/adjudication-triage-items$/, "adjudication_triage_queue_item_submitted", "adjudicationTriageQueueItem", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "triggerType", "releaseBlockingStatus", "priority", "queueLane", "assignedReviewerId", "status", "routingRationale", "timestamp"],
    requiredNonEmptyArrayFields: ["itemKeys"],
    allowedValues: { queueLane: adjudicationTriageLanes },
    requiredExactFields: { priorityDoesNotMutateLabels: true },
  }),
  workflowWriteSpec(
    /^\/api\/v1\/diagnostic-deferral-visibility-policies$/,
    "diagnostic_deferral_visibility_policy_submitted",
    "diagnosticDeferralVisibilityPolicy",
    adminRoles,
    {
      allowHiddenMetadata: true,
      requiredFields: diagnosticDeferralVisibilityPolicyRequiredFields,
      requiredNonEmptyArrayFields: ["diagnosticClasses", "publicVisibilityLevels", "claimSuppressionActions", "allowedReviewStatuses"],
      requiredObjectFields: ["visibilityRules"],
      requiredArrayIncludes: {
        diagnosticClasses: REQUIRED_DIAGNOSTIC_DEFERRAL_DIAGNOSTIC_CLASSES,
        publicVisibilityLevels: REQUIRED_DIAGNOSTIC_DEFERRAL_PUBLIC_VISIBILITY_LEVELS,
        claimSuppressionActions: REQUIRED_DIAGNOSTIC_DEFERRAL_CLAIM_SUPPRESSION_ACTIONS,
        allowedReviewStatuses: REQUIRED_DIAGNOSTIC_DEFERRAL_REVIEW_STATUSES,
      },
      requiredObjectKeys: { visibilityRules: Object.keys(REQUIRED_DIAGNOSTIC_DEFERRAL_VISIBILITY_RULES) },
      requiredStructuredFields: { visibilityRules: REQUIRED_DIAGNOSTIC_DEFERRAL_VISIBILITY_RULES },
      requiredExactFields: { policyVersion: DIAGNOSTIC_DEFERRAL_VISIBILITY_POLICY_VERSION },
      requiredStringIncludes: {
        publicSummaryRule: ["public", "weaker", "claim"],
        privateOnlyRule: ["private", "no public", "claim"],
        protectedContentRule: ["hidden", "protected", "private"],
        approvalRule: ["approval", "release"],
        sourceBoundary: ["Project default", "LMCA", "does not state"],
      },
    },
  ),
  workflowWriteSpec(/^\/api\/v1\/diagnostic-deferrals$/, "diagnostic_deferral_record_submitted", "diagnosticDeferralRecord", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "diagnosticDeferralVisibilityPolicyId",
      "diagnosticClass",
      "diagnosticName",
      "claimAffected",
      "notRunReason",
      "approvedWeakerClaimWording",
      "publicVisibilityLevel",
      "claimSuppressionAction",
      "publicSummaryText",
      "protectedContentDisclosureCheck",
      "diagnosticDeferralReviewStatus",
      "reviewerId",
      "reviewerRole",
      "createdAt",
    ],
    requiredAnyFields: [["releaseId", "evaluationId"]],
    allowedValues: {
      diagnosticClass: REQUIRED_DIAGNOSTIC_DEFERRAL_DIAGNOSTIC_CLASSES,
      publicVisibilityLevel: REQUIRED_DIAGNOSTIC_DEFERRAL_PUBLIC_VISIBILITY_LEVELS,
      claimSuppressionAction: REQUIRED_DIAGNOSTIC_DEFERRAL_CLAIM_SUPPRESSION_ACTIONS,
      diagnosticDeferralReviewStatus: REQUIRED_DIAGNOSTIC_DEFERRAL_REVIEW_STATUSES,
    },
    requiredStringIncludes: { protectedContentDisclosureCheck: ["no_hidden", "protected"] },
    requiredExactFields: { strongerClaimSuppressed: true },
  }),
  workflowWriteSpec(/^\/api\/v1\/queue-policy-snapshots$/, "queue_policy_snapshot_submitted", "queuePolicySnapshot", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "liveGoldDuplicateValidationMix",
      "topicRoutingRules",
      "tierRoutingRules",
      "safeDeclineReassignmentPolicy",
      "samePositionOrderPolicy",
      "randomizationStratificationSeedPolicy",
      "createdBy",
      "frozenAt",
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/assignment-selection-audits$/, "assignment_selection_audit_submitted", "assignmentSelectionAudit", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "queuePolicySnapshotId", "createdAt"],
    requiredAnyFields: [["splitReleaseId", "releaseId", "splitId"]],
    requiredNonEmptyArrayFields: ["candidateAssignments", "servedAssignments", "selfSelectionIndicators"],
    requiredObjectFields: ["declinesReassignmentsByReason", "raterTierDistribution", "topicSourceLengthDistribution"],
    requiredExactFields: { compositionChangedLabelDenominators: false },
  }),
  workflowWriteSpec(/^\/api\/v1\/model-run-reproducibility-policies$/, "model_run_reproducibility_policy_submitted", "modelRunReproducibilityPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "requiredInferenceConfigFields",
      "requiredRunEnvironmentFields",
      "reproducibilityRules",
      "snapshotBindingRule",
      "deterministicParameterRule",
      "environmentCaptureRule",
      "parserPromptLinkageRule",
      "cleanComparisonBoundaryRule",
      "sourceBoundary",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["requiredInferenceConfigFields", "requiredRunEnvironmentFields"],
    requiredObjectFields: ["reproducibilityRules"],
    requiredArrayIncludes: {
      requiredInferenceConfigFields: modelRunReproducibilityConfigFields,
      requiredRunEnvironmentFields: modelRunReproducibilityEnvironmentFields,
    },
    allowedArrayValues: {
      requiredInferenceConfigFields: modelRunReproducibilityConfigFields,
      requiredRunEnvironmentFields: modelRunReproducibilityEnvironmentFields,
    },
    requiredObjectKeys: { reproducibilityRules: Object.keys(modelRunReproducibilityRules) },
    requiredStructuredFields: { reproducibilityRules: modelRunReproducibilityRules },
    requiredStringIncludes: {
      snapshotBindingRule: ["provider endpoint", "model snapshot", "inference config"],
      deterministicParameterRule: ["decoding", "retry", "prompt"],
      environmentCaptureRule: ["orchestrator", "deployment", "library"],
      parserPromptLinkageRule: ["parser", "prompt", "schema"],
      cleanComparisonBoundaryRule: ["complete", "leaderboard", "validation"],
      sourceBoundary: ["Project default", "LMCA", "does not state"],
    },
    requiredExactFields: { policyVersion: modelRunReproducibilityPolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/model-inference-configs$/, "model_inference_config_submitted", "modelInferenceConfig", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "modelRunReproducibilityPolicyId", "evaluationRunId", "providerEndpoint", "modelSnapshot", "reasoningBudget", "messageStackTemplate", "retryPolicy", "seedDeterminismArtifact", "createdAt"],
    requiredNonEmptyArrayFields: ["toolAvailability"],
    requiredObjectFields: ["decodingParameters"],
  }),
  workflowWriteSpec(/^\/api\/v1\/model-run-environments$/, "model_run_environment_submitted", "modelRunEnvironment", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "modelRunReproducibilityPolicyId", "evaluationRunId", "runtimeOrchestratorVersion", "apiRouteDeploymentId", "timestamp", "rateLimitRetryMetadata"],
    requiredNonEmptyArrayFields: ["parserExtractorVersionLinks"],
    requiredObjectFields: ["libraryVersions"],
  }),
  workflowWriteSpec(/^\/api\/v1\/source-family-clustering-policies$/, "source_family_clustering_policy_submitted", "sourceFamilyClusteringPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "protectedAssignmentRule",
      "releaseClaimDisclosureRule",
      "sourceBoundary",
      "frozenAt",
    ],
    requiredObjectFields: ["sourceFamilyClusteringThresholds", "nearDuplicateClusteringThresholds"],
    requiredObjectKeys: {
      sourceFamilyClusteringThresholds: Object.keys(sourceFamilyClusteringThresholds),
      nearDuplicateClusteringThresholds: Object.keys(nearDuplicateClusteringThresholds),
    },
    requiredStructuredFields: {
      sourceFamilyClusteringThresholds,
      nearDuplicateClusteringThresholds,
    },
    requiredNonEmptyArrayFields: ["requiredConflictClusterFields", "clusteringReviewStatuses"],
    requiredArrayIncludes: {
      requiredConflictClusterFields: sourceFamilyClusterFields,
      clusteringReviewStatuses: sourceFamilyClusteringReviewStatuses,
    },
    requiredStringIncludes: {
      protectedAssignmentRule: ["source-family", "near-duplicate", "protected"],
      releaseClaimDisclosureRule: ["release", "exclude"],
      sourceBoundary: ["Project default", "LMCA", "does not state"],
    },
    requiredExactFields: { policyVersion: sourceFamilyClusteringPolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-item-conflicts$/, "rater_item_conflict_submitted", "raterItemConflict", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "sourceFamilyClusteringPolicyId", "raterId", "conflictType", "disclosureSource", "independentBlindEligibilityEffect", "reviewerResolution", "timestamp"],
    requiredAnyFields: [["positionId", "positionClusterId", "critiqueId", "sourceFamilyId", "adaptationClusterId", "nearDuplicateClusterId"]],
    requiredNonEmptyArrayFields: ["allowedNonBlindRoles"],
    allowedValues: { conflictType: raterItemConflictTypes },
    requiredStringIncludesAny: { independentBlindEligibilityEffect: ["excluded", "blocked", "non_independent"] },
    forbiddenStringFragments: { independentBlindEligibilityEffect: blindDenominatorCountingForbiddenFragments },
  }),
  workflowWriteSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)\/conflict-screen$/, "assignment_conflict_screen_submitted", "raterItemConflict", ratingWorkflowRoles, {
    pathParamField: "assignmentId",
    requiredFields: ["id", "assignmentId", "sourceFamilyClusteringPolicyId", "raterId", "conflictType", "disclosureSource", "independentBlindEligibilityEffect", "reviewerResolution", "timestamp"],
    requiredAnyFields: [["positionId", "positionClusterId", "critiqueId", "sourceFamilyId", "adaptationClusterId", "nearDuplicateClusterId"]],
    requiredNonEmptyArrayFields: ["allowedNonBlindRoles"],
    allowedValues: { conflictType: raterItemConflictTypes },
    requiredStringIncludesAny: { independentBlindEligibilityEffect: ["excluded", "blocked", "non_independent"] },
    forbiddenStringFragments: { independentBlindEligibilityEffect: blindDenominatorCountingForbiddenFragments },
    requireAssignmentClaimField: "assignmentId",
    requireActorField: "raterId",
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-training-exposure-policies$/, "rater_training_exposure_policy_submitted", "raterTrainingExposurePolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "protectedAssignmentScope",
      "publicAnchorExposurePolicy",
      "clusterMatchPolicy",
      "staleEligibilityPolicy",
      "adminExceptionPolicy",
      "frozenAt",
    ],
    requiredObjectKeys: {
      exposureWindowDays: Object.keys(raterTrainingExposureWindowDays),
      protectedAssignmentBlockingEffects: Object.keys(raterTrainingExposureBlockingEffects),
    },
    requiredStructuredFields: {
      exposureWindowDays: raterTrainingExposureWindowDays,
      protectedAssignmentBlockingEffects: raterTrainingExposureBlockingEffects,
    },
    requiredStringIncludes: {
      protectedAssignmentScope: ["validation", "hidden", "release"],
      publicAnchorExposurePolicy: ["record"],
      clusterMatchPolicy: ["cluster", "block"],
      staleEligibilityPolicy: ["recheck"],
      adminExceptionPolicy: ["cannot count", "independent blind"],
    },
    requiredExactFields: {
      policyVersion: raterTrainingExposurePolicyVersion,
      snapshotRequiredBeforeAssignment: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/rater-training-exposure-snapshots$/, "rater_training_exposure_snapshot_submitted", "raterTrainingExposureSnapshot", expertWorkflowRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "exposureQuarantinePolicyId",
      "raterTrainingExposurePolicyId",
      "raterId",
      "assignmentId",
      "rubricVersion",
      "exposureQuarantineCheckStatus",
      "protectedSplitConflictStatus",
      "protectedClusterEligibilityEffect",
      "createdAt",
    ],
    requiredNonEmptyArrayFields: ["publicSourceAnchorExampleIdsPreviouslySeen", "samePositionPositionClusterExposureChecks"],
    requiredArrayIncludes: { samePositionPositionClusterExposureChecks: exposureQuarantineAssignmentChecks },
    allowedValues: { exposureQuarantineCheckStatus: exposureQuarantineReviewStatuses },
    requiredStringIncludesAny: {
      protectedClusterEligibilityEffect: ["eligible_after_checks", "excluded", "blocked", "non_blind", "reassign"],
    },
    forbiddenStringFragments: { protectedClusterEligibilityEffect: blindDenominatorCountingForbiddenFragments },
  }),
  workflowWriteSpec(/^\/api\/v1\/release-erratum-disclosure-policies$/, "release_erratum_disclosure_policy_submitted", "releaseErratumDisclosurePolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "internalOnlyAllowedPolicy",
      "supersessionPolicy",
      "approvalPolicy",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["publicDisclosureRequiredFor", "apiWarningRequiredFor", "exportBlockRequiredFor"],
    requiredObjectKeys: { disclosureThresholdByErratumType: releaseErratumTypes },
    requiredStructuredFields: { disclosureThresholdByErratumType: releaseErratumDisclosureThresholds },
    requiredArrayIncludes: {
      publicDisclosureRequiredFor: releaseErratumApiWarningTypes,
      apiWarningRequiredFor: releaseErratumApiWarningTypes,
      exportBlockRequiredFor: releaseErratumExportBlockTypes,
    },
    requiredStringIncludes: {
      internalOnlyAllowedPolicy: ["no published", "export", "claim"],
      supersessionPolicy: ["superseded", "historical"],
      approvalPolicy: ["approval"],
    },
    requiredExactFields: { policyVersion: releaseErratumDisclosurePolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/release-errata$/, "release_erratum_submitted", "releaseErratum", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseErratumDisclosurePolicyId",
      "releaseId",
      "erratumType",
      "defectSummary",
      "historicalLeaderboardMutationPolicy",
      "status",
      "approvedBy",
      "createdAt",
    ],
    requiredNonEmptyArrayFields: ["affectedArtifactIds", "supersedingArtifactIds"],
    allowedValues: { erratumType: releaseErratumTypes },
    requiredExactFields: { historicalArtifactsMutated: false },
    requiredWhen: [
      {
        field: "erratumType",
        values: releaseErratumApiWarningTypes,
        requiredFields: ["artifactDeprecationStatus", "apiDownloadWarningBlockPolicy", "remediationStatus"],
        requiredNonEmptyArrayFields: ["impactedMetricsClaims"],
      },
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/releases\/(?<id>[^/]+)\/supersede$/, "release_supersession_erratum_submitted", "releaseErratum", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "releaseId",
    requiredFields: [
      "id",
      "releaseErratumDisclosurePolicyId",
      "releaseId",
      "erratumType",
      "defectSummary",
      "historicalLeaderboardMutationPolicy",
      "status",
      "approvedBy",
      "createdAt",
    ],
    requiredNonEmptyArrayFields: ["affectedArtifactIds", "supersedingArtifactIds"],
    allowedValues: { erratumType: releaseErratumTypes },
    requiredExactFields: { historicalArtifactsMutated: false },
    requiredWhen: [
      {
        field: "erratumType",
        values: releaseErratumApiWarningTypes,
        requiredFields: ["artifactDeprecationStatus", "apiDownloadWarningBlockPolicy", "remediationStatus"],
        requiredNonEmptyArrayFields: ["impactedMetricsClaims"],
      },
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/schedule-status-snapshots$/, "schedule_status_snapshot_submitted", "scheduleStatusSnapshot", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "scheduleRebaselinePolicyId",
      "releaseVersionOrProjectScope",
      "milestoneId",
      "milestoneName",
      "plannedStart",
      "plannedEnd",
      "status",
      "criticalPathImpact",
      "owner",
      "approvedBy",
      "timestamp",
    ],
    allowedValues: { status: scheduleSnapshotStatuses },
    requiredWhen: [
      {
        field: "status",
        equals: "complete",
        requiredNonEmptyArrayFields: ["evidenceArtifactIds"],
      },
      {
        field: "status",
        equals: "rebaselined",
        requiredFields: ["rebaselinedDate", "rebaselinedScope", "rebaselineReason", "previousPlannedEnd", "newPlannedEnd"],
        requiredNonEmptyArrayFields: ["rebaselineApprovalRecordIds"],
        requiredExactFields: { originalScheduleCompletionClaimSuppressed: true },
      },
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/schedule-rebaseline-policies$/, "schedule_rebaseline_policy_submitted", "scheduleRebaselinePolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "policyVersion",
      "delayThresholdDays",
      "rebaselineRuleByTrigger",
      "requiredRebaselinedSnapshotFields",
      "datedMilestoneSlipPolicy",
      "approvalPolicy",
      "claimPolicy",
      "frozenAt",
    ],
    requiredObjectFields: ["delayThresholdDays", "rebaselineRuleByTrigger"],
    requiredObjectKeys: {
      delayThresholdDays: Object.keys(scheduleRebaselineDelayThresholdDays),
      rebaselineRuleByTrigger: Object.keys(scheduleRebaselineRules),
    },
    requiredStructuredFields: {
      delayThresholdDays: scheduleRebaselineDelayThresholdDays,
      rebaselineRuleByTrigger: scheduleRebaselineRules,
    },
    requiredArrayIncludes: { requiredRebaselinedSnapshotFields },
    requiredStringIncludes: {
      datedMilestoneSlipPolicy: ["planned", "blocked", "rebaseline"],
      approvalPolicy: ["approval"],
      claimPolicy: ["completion", "superseding"],
    },
    requiredStringIncludesAny: {
      approvalPolicy: ["two-person", "two person"],
    },
    requiredExactFields: { policyVersion: scheduleRebaselinePolicyVersion },
  }),
  workflowWriteSpec(/^\/api\/v1\/governance-approvals$/, "governance_approval_record_submitted", "governanceApprovalRecord", adminRoles, {
    allowHiddenMetadata: true,
    policyActionKind: "governance_action",
    policyActionKindField: "actionKind",
    policyActionKindMap: {
      unblinding: "unblinding",
      deprotection: "deprotection",
    },
    phaseGateLaneKind: "governance_action",
    requiredFields: ["id", "actionKind", "affectedArtifactIds", "proposedBy", "approver1", "approver2", "independenceSeparationOfDutiesStatus", "reasonCode", "visibilitySplitMetricLeaderboardImpactSummary", "approvalTimestamp"],
    requiredNonEmptyArrayFields: ["affectedArtifactIds"],
    requiredDistinctFieldSets: [["proposedBy", "approver1", "approver2"]],
    requiredExactFields: { independenceSeparationOfDutiesStatus: "independent_two_person_approval" },
  }),
  workflowWriteSpec(/^\/api\/v1\/benchmark-submission-policies$/, "benchmark_submission_policy_submitted", "benchmarkSubmissionPolicy", adminRoles, {
    requiredFields: benchmarkSubmissionPolicyRequiredFields,
    requiredObjectFields: ["submissionBudget"],
    requiredObjectKeys: { submissionBudget: benchmarkSubmissionBudgetKeys },
    requiredPositiveIntegerFields: [
      "submissionBudget.maxSubmissionsPerWindow",
      "submissionBudget.windowHours",
      "submissionBudget.cooldownHours",
    ],
    requiredNumberRanges: [
      { field: "submissionBudget.remainingSubmissions", min: 0 },
      { field: "submissionBudget.duplicateRunReviewThreshold", min: 0, max: 1 },
    ],
    requiredStringIncludes: {
      cooldownPolicy: ["cooldown"],
      duplicateRunHandlingPolicy: ["duplicate", "review"],
      stableEvaluationManifestRequirement: ["stable", "manifest"],
      aggregateReportFieldPolicy: ["aggregate", "uncertainty", "coverage", "coarse"],
    },
    requiredExactFields: {
      aggregateOnlyReport: true,
      hiddenIdExposureProhibited: true,
      perItemFeedbackProhibited: true,
      perPairFeedbackProhibited: true,
      promptSpecificCorrectionHintsProhibited: true,
    },
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/benchmark-submissions$/, "benchmark_submission_submitted", "benchmarkSubmission", adminRoles, {
    policyActionKind: "hidden_benchmark_aggregate_report",
    phaseGateLaneKind: "hidden_benchmark_submission_lane",
    requiredFields: benchmarkSubmissionRequiredFields,
    requiredObjectFields: ["aggregateMetricFamilyResults", "uncertaintyIntervals", "coverageCounts"],
    requiredNonEmptyArrayFields: ["coarseEligibilityWarnings"],
    allowedValues: {
      budgetConsumptionStatus: benchmarkBudgetConsumptionStatuses,
      cooldownStatus: benchmarkCooldownStatuses,
      duplicateRunStatus: benchmarkDuplicateRunStatuses,
    },
    requiredExactFields: {
      perItemOutputIncluded: false,
      perPairOutputIncluded: false,
      hiddenIdExposureIncluded: false,
      promptSpecificCorrectionHintsIncluded: false,
    },
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
  }),
  workflowWriteSpec(/^\/api\/v1\/screens\/(?<id>[^/]+)\/feature-parity-check$/, "screen_feature_parity_check_submitted", "screenFeatureParityCheck", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "screenId",
    requiredFields: ["id", "screenId", "uxSimplificationPolicyId", "requiredControlResults", "featureParityChecklistResults", "noFeatureLoss", "checkedAt"],
    requiredObjectFields: ["requiredControlResults", "featureParityChecklistResults"],
    requiredObjectKeysByFieldValue: [
      { field: "screenId", objectField: "requiredControlResults", values: uxScreenControlRequirements },
    ],
    allowedValues: { screenId: uxSimplificationSurfaces },
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
    allowedValues: {
      screenId: uxSimplificationSurfaces,
      protectedSplitVariantDisposition: simplifiedCopyProtectedSplitVariantDispositions,
    },
    requiredExactFields: { exactRubricTermPreservation: true, hiddenFieldLeakageCheck: "passed" },
    requiredWhen: [
      {
        field: "protectedSplitVariantDisposition",
        equals: "quarantined_sensitivity_snapshot",
        requiredFields: ["uiSensitivitySnapshotId"],
      },
    ],
  }),
  workflowWriteSpec(/^\/api\/v1\/rubric-copy-traceability-maps$/, "rubric_copy_traceability_map_submitted", "rubricCopyTraceabilityMap", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "mapVersion",
      "rubricVersion",
      "copyBundleId",
      "semanticDriftTestStatus",
      "appendixFAnchorAccess",
      "hiddenFieldLeakageCheck",
      "releaseCriticalUseStatus",
      "releaseConfigManifestId",
      "reviewerId",
      "reviewedAt",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: ["coveredScreenIds", "simplifiedCopyEntryIds", "mappedRubricClauseIds", "semanticDriftTestIds"],
    requiredObjectFields: ["clauseMap"],
    requiredObjectKeys: { clauseMap: rubricCopyTraceabilityRequiredEntries },
    requiredArrayIncludes: {
      coveredScreenIds: rubricCopyTraceabilityReleaseCriticalScreens,
      simplifiedCopyEntryIds: rubricCopyTraceabilityRequiredEntries,
      mappedRubricClauseIds: rubricCopyTraceabilityRequiredClauses,
    },
    requiredStringIncludes: { appendixFAnchorAccess: ["one_click"] },
    requiredExactFields: {
      semanticDriftTestStatus: "passed",
      semanticDriftFailureBlocker: true,
      exactRubricClauseMapping: true,
      hiddenFieldLeakageCheck: "passed",
      releaseCriticalUseStatus: "frozen_for_release_critical_screens",
    },
  }),
	  workflowWriteSpec(/^\/api\/v1\/governed-bundle-canonicalization-profiles$/, "governed_bundle_canonicalization_profile_submitted", "governedBundleCanonicalizationProfile", adminRoles, {
	    allowHiddenMetadata: true,
	    requiredFields: [
	      "id",
	      "version",
	      "hashAlgorithm",
	      "materializationQueryRules",
	      "includedFieldPolicy",
	      "rowOrderingPolicy",
	      "arrayOrderingPolicy",
	      "nullEmptyHandling",
	      "unicodeNormalization",
	      "timestampNumberEncoding",
	      "environmentScopeFields",
	      "nonsemanticMetadataExclusionRules",
	      "createdBy",
	      "activatedAt",
	    ],
	    requiredNonEmptyArrayFields: ["environmentScopeFields", "nonsemanticMetadataExclusionRules", "testVectorIds"],
	    requiredExactFields: { hashAlgorithm: "sha256" },
	  }),
	  workflowWriteSpec(/^\/api\/v1\/governed-bundles$/, "governed_bundle_submitted", "governedBundleRecord", adminRoles, {
	    allowHiddenMetadata: true,
	    requiredFields: ["id", "bundleFamily", "semanticVersion", "canonicalizationProfileId", "canonicalContentHash", "materializedRowCount", "bundleContentSchemaVersion", "canonicalizationTestVectorId", "semanticMutationPolicy", "manifestActivationPolicy", "appendOnlyActivationStatus", "activatedBy", "activatedAt"],
	    requiredPositiveIntegerFields: ["materializedRowCount"],
	    requiredStringPrefixes: { canonicalContentHash: "sha256:" },
	    allowedValues: { bundleFamily: governedBundleFamilies },
	    requiredExactFields: {
	      appendOnlyActivationStatus: "activated",
	      semanticMutationPolicy: "new_version_required",
	      manifestActivationPolicy: "verified_before_manifest_activation",
	    },
	  }),
	  workflowWriteSpec(/^\/api\/v1\/governed-bundles\/(?<id>[^/]+)\/verify$/, "governed_bundle_verification_submitted", "governedBundleVerification", adminRoles, {
	    allowHiddenMetadata: true,
	    pathParamField: "governedBundleId",
	    requiredFields: ["id", "governedBundleId", "bundleFamily", "semanticVersion", "canonicalizationProfileId", "verificationStatus", "expectedHash", "observedHash", "materializedRowCount", "manifestActivationBlockedOnMismatch", "verifiedAt"],
	    requiredPositiveIntegerFields: ["materializedRowCount"],
	    requiredStringPrefixes: { expectedHash: "sha256:", observedHash: "sha256:" },
	    requiredFieldMatches: [{ field: "observedHash", matchesField: "expectedHash" }],
	    requiredExactFields: {
	      verificationStatus: "passed",
	      manifestActivationBlockedOnMismatch: true,
	    },
	  }),
  workflowWriteSpec(/^\/api\/v1\/release-config-manifests$/, "release_config_manifest_submitted", "releaseConfigManifest", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "version",
      "canonicalManifestHash",
      "codeCommitId",
      "rubricVersion",
      "scoredDimensionSchemaVersion",
      "releaseGateProfileId",
      "visibilityPolicyId",
      "uiExperimentPolicyId",
      "preSubmitAssistPolicyId",
      "queuePolicySnapshotId",
      "governedBundleIds",
      "bindingFamilies",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: [
      "governedBundleIds",
      "bindingFamilies",
      "uxSimplificationPolicyIds",
      "scoreInputPolicyIds",
      "workflowProfileIds",
      "raterInstructionRenderVersionIds",
      "rubricLintConfigIds",
      "labelSnapshotIds",
      "pairwiseComparisonSnapshotIds",
      "metricConfigIds",
      "scoringCodeChecksums",
      "parserConfigIds",
      "promptTemplateIds",
    ],
    requiredArrayIncludes: { bindingFamilies: releaseConfigBindings },
    requiredStringPrefixes: { canonicalManifestHash: "sha256:" },
  }),
  workflowWriteSpec(/^\/api\/v1\/releases\/(?<id>[^/]+)\/freeze-config-manifest$/, "release_config_manifest_frozen", "releaseConfigManifest", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "releaseId",
    policyActionKind: "manifest_activation",
    phaseGateLaneKind: "governance_action",
    requiredFields: [
      "id",
      "releaseId",
      "version",
      "canonicalManifestHash",
      "codeCommitId",
      "rubricVersion",
      "scoredDimensionSchemaVersion",
      "releaseGateProfileId",
      "visibilityPolicyId",
      "uiExperimentPolicyId",
      "preSubmitAssistPolicyId",
      "queuePolicySnapshotId",
      "governedBundleIds",
      "bindingFamilies",
      "frozenAt",
    ],
    requiredNonEmptyArrayFields: [
      "governedBundleIds",
      "bindingFamilies",
      "uxSimplificationPolicyIds",
      "scoreInputPolicyIds",
      "workflowProfileIds",
      "raterInstructionRenderVersionIds",
      "rubricLintConfigIds",
      "labelSnapshotIds",
      "pairwiseComparisonSnapshotIds",
      "metricConfigIds",
      "scoringCodeChecksums",
      "parserConfigIds",
      "promptTemplateIds",
    ],
    requiredArrayIncludes: { bindingFamilies: releaseConfigBindings },
    requiredStringPrefixes: { canonicalManifestHash: "sha256:" },
  }),
  workflowWriteSpec(/^\/api\/v1\/release-config-manifests\/(?<id>[^/]+)\/verify$/, "release_config_manifest_verification_submitted", "releaseConfigManifestVerification", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "manifestId",
    requiredFields: ["id", "manifestId", "verificationStatus", "expectedHash", "observedHash", "verifiedAt"],
    requiredStringPrefixes: { expectedHash: "sha256:", observedHash: "sha256:" },
    requiredFieldMatches: [{ field: "observedHash", matchesField: "expectedHash" }],
    requiredExactFields: { verificationStatus: "passed" },
  }),
	  workflowWriteSpec(/^\/api\/v1\/policy-action-kinds$/, "policy_action_kind_submitted", "policyActionKind", adminRoles, {
	    allowHiddenMetadata: true,
	    requiredFields: ["id", "actionKind", "requiresCurrentDecision", "requiresManifestBinding", "requiresActorBinding", "requiresOutputSchemaBinding", "requiresPhaseGateBinding", "requiresIdempotencyBinding", "replayProtection", "wrongScopeBehavior", "activatedAt"],
	    allowedValues: {
	      actionKind: policyActionKinds,
	      replayProtection: ["single_use", "idempotency_bound"],
	    },
	    requiredExactFields: {
	      requiresCurrentDecision: true,
	      requiresManifestBinding: true,
	      requiresActorBinding: true,
	      requiresOutputSchemaBinding: true,
	      requiresPhaseGateBinding: true,
	      requiresIdempotencyBinding: true,
	      wrongScopeBehavior: "fail_closed",
	    },
	  }),
	  workflowWriteSpec(/^\/api\/v1\/policy-decisions$/, "policy_decision_submitted", "policyDecisionRecord", adminRoles, {
	    allowHiddenMetadata: true,
	    requiredFields: ["id", "actionKindId", "actionKind", "decisionStatus", "actorId", "manifestId", "manifestHash", "phaseGateBundleId", "phaseGateBundleHash", "releaseId", "outputSchemaVersion", "outputSchemaHash", "expiresAt", "decidedAt", "replayStatus", "manifestBindingStatus", "outputSchemaBindingStatus", "phaseGateBindingStatus", "idempotencyBindingStatus"],
	    requiredAnyFields: [["idempotencyKey", "singleUse"]],
	    requiredNonEmptyArrayFields: ["targetArtifactIds"],
	    allowedValues: { actionKind: policyActionKinds },
	    requiredStringPrefixes: { manifestHash: "sha256:", phaseGateBundleHash: "sha256:", outputSchemaHash: "sha256:" },
	    requiredExactFields: {
	      decisionStatus: "allow",
	      replayStatus: "unused",
	      manifestBindingStatus: "matched",
	      outputSchemaBindingStatus: "matched",
	      phaseGateBindingStatus: "matched",
	      idempotencyBindingStatus: "matched",
	    },
	  }),
  workflowWriteSpec(/^\/api\/v1\/implementation-phase-gate-bundles$/, "implementation_phase_gate_bundle_submitted", "implementationPhaseGateBundle", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "releaseId", "manifestId", "version", "laneStates", "futurePhaseDefault", "frozenAt"],
    requiredNonEmptyArrayFields: ["laneStates"],
    requiredObjectArrayFieldValues: [{ arrayField: "laneStates", valueField: "laneKind", requiredValues: phaseGateLaneKinds }],
    allowedObjectArrayFieldValues: [
      { arrayField: "laneStates", valueField: "laneKind", allowedValues: phaseGateLaneKinds },
      { arrayField: "laneStates", valueField: "phaseState", allowedValues: phaseGateStates },
    ],
    requiredObjectArrayExactFields: [
      {
        arrayField: "laneStates",
        exactFields: {
          failClosed: true,
          noSideEffectsWhenDisabled: true,
          labelsExposedWhenDisabled: false,
          supportsReleaseClaimsWhenDisabled: false,
        },
      },
    ],
    requiredExactFields: {
      futurePhaseDefault: "blocked",
      broadeningRequiresManifestActivation: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/queue-freshness-policies$/, "queue_freshness_policy_submitted", "queueFreshnessPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "lane",
      "freshnessWindowMinutes",
      "dependencyRevalidationChecks",
      "backpressureThreshold",
      "staleBehavior",
      "sideChannelSafeNotificationBehavior",
      "queueHealthChecks",
      "createdBy",
      "frozenAt",
    ],
    requiredFiniteNumberFields: ["freshnessWindowMinutes", "backpressureThreshold"],
    requiredNonEmptyArrayFields: ["dependencyRevalidationChecks", "queueHealthChecks"],
    requiredArrayIncludes: { dependencyRevalidationChecks: queueRevalidationChecks, queueHealthChecks },
    allowedValues: { lane: queueFreshnessLanes, staleBehavior: queueStaleBehaviors },
    requiredStringIncludes: { sideChannelSafeNotificationBehavior: ["generic", "protected"] },
    requiredExactFields: {
      workerConsumeRevalidationRequired: true,
      renderRevalidationRequired: true,
      submitRevalidationRequired: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/queues\/(?<id>[^/]+)\/stale-by-delay-scan$/, "queue_stale_by_delay_scan_submitted", "queueStaleByDelayScan", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "lane",
    requiredFields: [
      "id",
      "policyId",
      "lane",
      "scanStatus",
      "staleCount",
      "maxObservedAgeMinutes",
      "backpressureThreshold",
      "dependencyRevalidationChecks",
      "staleTransitionBehavior",
      "staleTransitionOutcomes",
      "queueHealthChecks",
      "scannedAt",
    ],
    requiredFiniteNumberFields: ["staleCount", "maxObservedAgeMinutes", "backpressureThreshold"],
    requiredPositiveIntegerFields: ["staleCount"],
    requiredNonEmptyArrayFields: ["dependencyRevalidationChecks", "staleTransitionOutcomes", "queueHealthChecks"],
    requiredArrayIncludes: {
      dependencyRevalidationChecks: queueRevalidationChecks,
      staleTransitionOutcomes: queueStaleTransitionOutcomes,
      queueHealthChecks,
    },
    allowedValues: { lane: queueFreshnessLanes, staleTransitionBehavior: queueStaleBehaviors },
    requiredExactFields: {
      scanStatus: "passed",
      workerConsumeRevalidationConfirmed: true,
      sideEffectSuppressionConfirmed: true,
      sideChannelSafeNotificationConfirmed: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/client-surface-integrity-policies$/, "client_surface_integrity_policy_submitted", "clientSurfaceIntegrityPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: ["id", "policyVersion", "surface", "thirdPartyAnalyticsProhibited", "thirdPartyPixelsProhibited", "thirdPartyResourcesProhibited", "sessionReplayProhibited", "heatmapTrackingProhibited", "domCaptureProhibited", "keystrokeLoggingProhibited", "sensitiveUrlIdsProhibited", "urlIdentifierPolicy", "referrerLeakageBlocked", "referrerPolicy", "persistentOfflineCacheProhibited", "cacheOfflineStoragePolicy", "firstPartyTelemetryOnly", "telemetryAllowlistEnforced", "screenStateOutputSchemaBound", "nonStaffPromotionBlockedOnViolation", "cspEnforced"],
    requiredObjectFields: ["cspDirectives"],
    requiredNonEmptyArrayFields: ["firstPartyTelemetryAllowlist"],
    requiredEmptyArrayFields: ["thirdPartyResourceAllowlist"],
    requiredArrayIncludes: { firstPartyTelemetryAllowlist: REQUIRED_CLIENT_SURFACE_TELEMETRY_ALLOWLIST },
    allowedArrayValues: { firstPartyTelemetryAllowlist: REQUIRED_CLIENT_SURFACE_TELEMETRY_ALLOWLIST },
    requiredStructuredFields: { cspDirectives: REQUIRED_CLIENT_SURFACE_CSP_DIRECTIVES },
    allowedValues: { surface: clientSurfaces },
    requiredExactFields: {
      policyVersion: CLIENT_SURFACE_INTEGRITY_POLICY_VERSION,
      thirdPartyAnalyticsProhibited: true,
      thirdPartyPixelsProhibited: true,
      thirdPartyResourcesProhibited: true,
      sessionReplayProhibited: true,
      heatmapTrackingProhibited: true,
      domCaptureProhibited: true,
      keystrokeLoggingProhibited: true,
      sensitiveUrlIdsProhibited: true,
      urlIdentifierPolicy: REQUIRED_CLIENT_SURFACE_URL_IDENTIFIER_POLICY,
      referrerLeakageBlocked: true,
      referrerPolicy: REQUIRED_CLIENT_SURFACE_REFERRER_POLICY,
      persistentOfflineCacheProhibited: true,
      cacheOfflineStoragePolicy: REQUIRED_CLIENT_SURFACE_CACHE_POLICY,
      firstPartyTelemetryOnly: true,
      telemetryAllowlistEnforced: true,
      screenStateOutputSchemaBound: true,
      nonStaffPromotionBlockedOnViolation: true,
      cspEnforced: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/client-surfaces\/(?<id>[^/]+)\/integrity-check$/, "client_surface_integrity_check_submitted", "clientSurfaceIntegrityCheck", adminRoles, {
    allowHiddenMetadata: true,
    pathParamField: "clientSurfaceId",
    requiredFields: ["id", "clientSurfaceId", "surface", "checkStatus", "checksPassed", "checkedAt"],
    requiredNonEmptyArrayFields: ["checksPassed"],
    requiredEmptyArrayFields: ["failures"],
    requiredArrayIncludes: { checksPassed: clientSurfaceRequiredChecks },
    allowedValues: { surface: clientSurfaces },
    requiredExactFields: { checkStatus: "passed" },
  }),
  workflowWriteSpec(/^\/api\/v1\/cloud-security-budget-policies$/, "cloud_security_budget_policy_submitted", "cloudSecurityBudgetPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "policyVersion",
      "currency",
      "budgetWindow",
      "totalBudgetRangeUsd",
      "categoryMinimumUsd",
      "requiredControls",
      "approvalStatuses",
      "overrunEscalationRule",
      "productionReleaseBlockRule",
      "protectedSplitIsolationFundingRule",
      "sourceBoundary",
      "owner",
      "approver",
      "frozenAt",
    ],
    requiredObjectFields: ["totalBudgetRangeUsd", "categoryMinimumUsd"],
    requiredObjectKeys: { totalBudgetRangeUsd: Object.keys(cloudSecurityBudgetRangeUsd), categoryMinimumUsd: Object.keys(cloudSecurityBudgetCategoryMinimumUsd) },
    requiredStructuredFields: {
      totalBudgetRangeUsd: cloudSecurityBudgetRangeUsd,
      categoryMinimumUsd: cloudSecurityBudgetCategoryMinimumUsd,
    },
    requiredNonEmptyArrayFields: ["requiredControls", "approvalStatuses"],
    requiredArrayIncludes: {
      requiredControls: cloudSecurityControls,
      approvalStatuses: cloudSecurityApprovalStatuses,
    },
    requiredStringIncludes: {
      overrunEscalationRule: ["overrun", "blocks", "release"],
      productionReleaseBlockRule: ["release", "reserved", "cloud"],
      protectedSplitIsolationFundingRule: ["hidden", "protected", "funded"],
      sourceBoundary: ["project default", "lmca", "spend"],
    },
    requiredExactFields: {
      policyVersion: cloudSecurityBudgetPolicyVersion,
      currency: "USD",
      monthlySpendReviewRequired: true,
      protectedSplitCostIsolationRequired: true,
      productionReleaseBlockedUntilReserved: true,
      externalWormAuditLogFundingRequired: true,
    },
  }),
  workflowWriteSpec(/^\/api\/v1\/external-worm-audit-log-policies$/, "external_worm_audit_log_policy_submitted", "externalWormAuditLogPolicy", adminRoles, {
    allowHiddenMetadata: true,
    requiredFields: [
      "id",
      "releaseId",
      "policyVersion",
      "ledgerBackend",
      "ledgerPointerPrefix",
      "receiptHashAlgorithm",
      "receiptFields",
      "retentionYears",
      "appendOnlyMode",
      "verificationCadence",
      "receiptVerificationRule",
      "fallbackRule",
      "redactionBoundary",
      "sourceBoundary",
      "owner",
      "approver",
      "frozenAt",
    ],
    requiredPositiveIntegerFields: ["retentionYears"],
    requiredNonEmptyArrayFields: ["receiptFields"],
    requiredArrayIncludes: { receiptFields: externalWormAuditReceiptFields },
    requiredStringIncludes: {
      receiptVerificationRule: ["sha256", "WORM", "ledger"],
      redactionBoundary: ["protected", "hidden", "raw", "private", "excluded"],
      sourceBoundary: ["project default", "lmca", "worm"],
    },
    requiredExactFields: {
      policyVersion: externalWormAuditLogPolicyVersion,
      ledgerBackend: externalWormAuditLedgerBackend,
      ledgerPointerPrefix: externalWormAuditPointerPrefix,
      receiptHashAlgorithm: externalWormAuditReceiptHashAlgorithm,
      retentionYears: externalWormAuditRetentionYears,
      appendOnlyMode: "compliance_lock_no_delete_no_overwrite",
      verificationCadence: externalWormAuditVerificationCadence,
      fallbackRule: externalWormAuditFallbackRule,
    },
  }),
	  workflowWriteSpec(/^\/api\/v1\/sensitive-audit-chain\/events$/, "sensitive_audit_chain_event_submitted", "sensitiveAuditChainEvent", adminRoles, {
	    allowHiddenMetadata: true,
	    validateSensitiveAuditChainBindings: true,
	    requiredFields: ["id", "chainId", "sequence", "eventKind", "actionKind", "policyDecisionId", "governanceApprovalRecordId", "actorHash", "protectedDataExposureClass", "externalWormAuditLogPolicyId", "externalWormLedgerPointer", "externalWormReceiptHash", "affectedArtifactIds", "beforeHash", "afterHash", "eventHash", "redactionPolicy", "occurredAt"],
	    requiredPositiveIntegerFields: ["sequence"],
	    requiredNonEmptyArrayFields: ["affectedArtifactIds", "approverHashes", "redactedReasonClasses"],
	    requiredStringPrefixes: {
	      actorHash: "sha256:",
	      beforeHash: "sha256:",
	      afterHash: "sha256:",
	      eventHash: "sha256:",
	      externalWormLedgerPointer: externalWormAuditPointerPrefix,
	      externalWormReceiptHash: `${externalWormAuditReceiptHashAlgorithm}:`,
	    },
	    requiredArrayValuePrefixes: { approverHashes: "sha256:" },
	    requiredStringIncludes: { redactionPolicy: ["protected", "hidden", "raw", "private"] },
	    requiredFieldMatches: [{ field: "actionKind", matchesField: "eventKind" }],
	    allowedValues: {
	      eventKind: auditChainEventKinds,
	      actionKind: auditChainEventKinds,
	      protectedDataExposureClass: auditChainProtectedDataExposureClasses,
	    },
	  }),
];

const workflowReadEndpoints = [
  workflowReadSpec(/^\/api\/v1\/certification-threshold-policies\/(?<id>[^/]+)$/, "certificationThresholdPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/certification-records\/(?<id>[^/]+)$/, "certificationRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/exposure-logs\/(?<id>[^/]+)$/, "exposureLog", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/revisions\/(?<id>[^/]+)$/, "revisionRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/item-text-normalization-policies\/(?<id>[^/]+)$/, "itemTextNormalizationPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/item-text-versions\/(?<id>[^/]+)$/, "itemTextVersion", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-prompt-sibling-context-policies\/(?<id>[^/]+)$/, "modelPromptSiblingContextPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rating-context-snapshots\/(?<id>[^/]+)$/, "ratingContextSnapshot", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/pairwise-comparison-snapshots\/(?<id>[^/]+)$/, "pairwiseComparisonSnapshot", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-reliability-weight-models\/(?<id>[^/]+)$/, "raterReliabilityWeightModel", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/raters\/(?<id>[^/]+)$/, "rater", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/assignments\/(?<id>[^/]+)$/, "assignment", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/session-pacing-policies\/(?<id>[^/]+)$/, "sessionPacingPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-sessions\/(?<id>[^/]+)$/, "raterSession", workflowStateReadRoles),
  workflowReadSpec(/^\/api\/v1\/practice-sessions\/(?<id>[^/]+)$/, "publicExamplePracticeSession", workflowStateReadRoles),
  workflowReadSpec(/^\/api\/v1\/practice-sandbox-policies\/(?<id>[^/]+)$/, "practiceSandboxPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-dashboard-policies\/(?<id>[^/]+)$/, "raterDashboardPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-learning-plans\/(?<id>[^/]+)$/, "raterLearningPlan", workflowStateReadRoles),
  workflowReadSpec(/^\/api\/v1\/gold-items\/(?<id>[^/]+)$/, "goldItem", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/source-anchor-examples\/(?<id>[^/]+)$/, "sourceAnchorExample", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/benchmark-split-members\/(?<id>[^/]+)$/, "benchmarkSplitMember", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rights-clearance-policies\/(?<id>[^/]+)$/, "rightsClearancePolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rights-records\/(?<id>[^/]+)$/, "rightsRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/release-versions\/(?<id>[^/]+)$/, "releaseVersion", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/release-gate-profiles\/(?<id>[^/]+)$/, "releaseGateProfile", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/primary-rater-anchor-policies\/(?<id>[^/]+)$/, "primaryRaterAnchorPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/comparability-tier-policies\/(?<id>[^/]+)$/, "comparabilityTierPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/comparability-claims\/(?<id>[^/]+)$/, "comparabilityClaim", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/candidate-batches\/(?<id>[^/]+)$/, "candidateBatch", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/candidate-critiques\/(?<id>[^/]+)$/, "candidateCritique", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-judge-scores\/(?<id>[^/]+)$/, "modelJudgeScore", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/active-learning-selection-policies\/(?<id>[^/]+)$/, "activeLearningSelectionPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/training-export-uncertainty-policies\/(?<id>[^/]+)$/, "trainingExportUncertaintyPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-improvement-policies\/(?<id>[^/]+)$/, "modelImprovementPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/active-learning-selection-audits\/(?<id>[^/]+)$/, "activeLearningSelectionAudit", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/critique-generation-runs\/(?<id>[^/]+)$/, "critiqueGenerationRun", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/generated-critiques\/(?<id>[^/]+)$/, "generatedCritiqueSubmission", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/generation-evaluation-reports\/(?<id>[^/]+)$/, "generationEvaluationReport", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-evaluation-predictions\/(?<id>[^/]+)$/, "modelEvaluationPrediction", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/discussions\/(?<id>[^/]+)$/, "discussion", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/discussion-threads\/(?<id>[^/]+)$/, "discussionThread", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/adjudication-memos\/(?<id>[^/]+)$/, "adjudicationMemo", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/verification-records\/(?<id>[^/]+)$/, "verificationRecord", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/verification-evidence-artifacts\/(?<id>[^/]+)$/, "verificationEvidenceArtifact", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/adjudicator-pre-read-requiredness-policies\/(?<id>[^/]+)$/, "adjudicatorPreReadRequirednessPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/adjudicator-pre-reads\/(?<id>[^/]+)$/, "adjudicatorPreRead", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/adjudication-cockpit-signoff-policies\/(?<id>[^/]+)$/, "adjudicationCockpitSignoffPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/adjudication-review-sessions\/(?<id>[^/]+)$/, "adjudicationReviewSession", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/interpretation-target-map-requiredness-policies\/(?<id>[^/]+)$/, "interpretationTargetMapRequirednessPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/interpretation-target-maps\/(?<id>[^/]+)$/, "interpretationTargetMap", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/verification-claim-granularity-policies\/(?<id>[^/]+)$/, "verificationClaimGranularityPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/verification-workspace-sessions\/(?<id>[^/]+)$/, "verificationWorkspaceSession", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/model-family-overlap-policies\/(?<id>[^/]+)$/, "modelFamilyOverlapPolicy", adminAuditRoles),
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
  workflowReadSpec(/^\/api\/v1\/benchmark-refresh-policies\/(?<id>[^/]+)$/, "benchmarkRefreshPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/validation-tranche-evidence\/(?<id>[^/]+)$/, "validationTrancheEvidence", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/ux-simplification-policies\/(?<id>[^/]+)$/, "uxSimplificationPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/ux-simplification-reviews\/(?<id>[^/]+)$/, "uxSimplificationReview", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/screen-state-payloads\/(?<id>[^/]+)$/, "screenStatePayload", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/visibility-policies\/(?<id>[^/]+)$/, "visibilityPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rating-workflow-profiles\/(?<id>[^/]+)$/, "ratingWorkflowProfile", workflowStateReadRoles),
  workflowReadSpec(/^\/api\/v1\/score-explanation-policies\/(?<id>[^/]+)$/, "scoreExplanationPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rating-escalation-policies\/(?<id>[^/]+)$/, "ratingEscalationPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/disagreement-threshold-policies\/(?<id>[^/]+)$/, "disagreementThresholdPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/ui-experiment-policies\/(?<id>[^/]+)$/, "uiExperimentPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/pre-submit-assist-policies\/(?<id>[^/]+)$/, "preSubmitAssistPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/accessibility-conformance-reports\/(?<id>[^/]+)$/, "accessibilityConformanceReport", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/volunteer-incentive-policies\/(?<id>[^/]+)$/, "volunteerIncentivePolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-qualification-records\/(?<id>[^/]+)$/, "raterQualificationRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/language-artifact-assessments\/(?<id>[^/]+)$/, "languageArtifactAssessment", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/source-recognition-events\/(?<id>[^/]+)$/, "sourceRecognitionEvent", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/model-provider-data-handling-policies\/(?<id>[^/]+)$/, "modelProviderDataHandlingPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/source-family-clustering-policies\/(?<id>[^/]+)$/, "sourceFamilyClusteringPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/task-output-eligibility-policies\/(?<id>[^/]+)$/, "taskOutputEligibilityPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/score-input-policies\/(?<id>[^/]+)$/, "scoreInputPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/draft-storage-policies\/(?<id>[^/]+)$/, "draftStoragePolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-instruction-compatibility-policies\/(?<id>[^/]+)$/, "raterInstructionCompatibilityPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-instruction-render-versions\/(?<id>[^/]+)$/, "raterInstructionRenderVersion", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rubric-lint-configs\/(?<id>[^/]+)$/, "rubricLintConfig", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rubric-lint-events\/(?<id>[^/]+)$/, "rubricLintEvent", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/item-issue-quarantine-policies\/(?<id>[^/]+)$/, "itemIssueQuarantinePolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/item-issues\/(?<id>[^/]+)$/, "itemIssueReport", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/rating-draft-sessions\/(?<id>[^/]+)$/, "ratingDraftSession", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/score-confidence-scale-policies\/(?<id>[^/]+)$/, "scoreConfidenceScalePolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/score-confidence-annotations\/(?<id>[^/]+)$/, "scoreConfidenceAnnotation", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/rater-score-confidences\/(?<id>[^/]+)$/, "raterScoreConfidence", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/rationale-evidence-span-requiredness-policies\/(?<id>[^/]+)$/, "rationaleEvidenceSpanRequirednessPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rationale-evidence-spans\/(?<id>[^/]+)$/, "rationaleEvidenceSpan", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/same-position-scratchpads\/(?<id>[^/]+)$/, "samePositionScratchpad", expertAuditWorkflowRoles),
  workflowReadSpec(
    /^\/api\/v1\/same-position-batch-review-requiredness-policies\/(?<id>[^/]+)$/,
    "samePositionBatchReviewRequirednessPolicy",
    adminAuditRoles,
  ),
  workflowReadSpec(/^\/api\/v1\/same-position-batch-reviews\/(?<id>[^/]+)$/, "samePositionBatchReview", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/correctness-claim-weight-worksheets\/(?<id>[^/]+)$/, "correctnessClaimWeightWorksheet", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/external-assistance-contamination-policies\/(?<id>[^/]+)$/, "externalAssistanceContaminationPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/external-assistance-declarations\/(?<id>[^/]+)$/, "externalAssistanceDeclaration", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/protected-artifact-retention-records\/(?<id>[^/]+)$/, "protectedArtifactRetentionRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/source-leakage-redaction-policies\/(?<id>[^/]+)$/, "sourceLeakageRedactionPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/blinding-preview-audits\/(?<id>[^/]+)$/, "blindingPreviewAudit", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/partial-task-promotion-policies\/(?<id>[^/]+)$/, "partialTaskPromotionPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/partial-task-outputs\/(?<id>[^/]+)$/, "partialTaskOutput", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/exposure-quarantine-policies\/(?<id>[^/]+)$/, "exposureQuarantinePolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/spot-check-sampling-policies\/(?<id>[^/]+)$/, "spotCheckSamplingPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/spot-checks\/(?<id>[^/]+)$/, "spotCheckQaItem", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/rating-effort-qa-reviews\/(?<id>[^/]+)$/, "ratingEffortQaReview", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/adjudication-triage-items\/(?<id>[^/]+)$/, "adjudicationTriageQueueItem", expertAuditWorkflowRoles),
  workflowReadSpec(
    /^\/api\/v1\/diagnostic-deferral-visibility-policies\/(?<id>[^/]+)$/,
    "diagnosticDeferralVisibilityPolicy",
    adminAuditRoles,
  ),
  workflowReadSpec(/^\/api\/v1\/diagnostic-deferrals\/(?<id>[^/]+)$/, "diagnosticDeferralRecord", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/queue-policy-snapshots\/(?<id>[^/]+)$/, "queuePolicySnapshot", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/assignment-selection-audits\/(?<id>[^/]+)$/, "assignmentSelectionAudit", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-run-reproducibility-policies\/(?<id>[^/]+)$/, "modelRunReproducibilityPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-inference-configs\/(?<id>[^/]+)$/, "modelInferenceConfig", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/model-run-environments\/(?<id>[^/]+)$/, "modelRunEnvironment", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-item-conflicts\/(?<id>[^/]+)$/, "raterItemConflict", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/rater-training-exposure-policies\/(?<id>[^/]+)$/, "raterTrainingExposurePolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rater-training-exposure-snapshots\/(?<id>[^/]+)$/, "raterTrainingExposureSnapshot", expertAuditWorkflowRoles),
  workflowReadSpec(/^\/api\/v1\/release-erratum-disclosure-policies\/(?<id>[^/]+)$/, "releaseErratumDisclosurePolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/release-errata\/(?<id>[^/]+)$/, "releaseErratum", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/schedule-rebaseline-policies\/(?<id>[^/]+)$/, "scheduleRebaselinePolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/schedule-status-snapshots\/(?<id>[^/]+)$/, "scheduleStatusSnapshot", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/governance-approvals\/(?<id>[^/]+)$/, "governanceApprovalRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/protected-artifact-revalidations\/(?<id>[^/]+)$/, "protectedArtifactRevalidation", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/benchmark-submission-policies\/(?<id>[^/]+)$/, "benchmarkSubmissionPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/benchmark-submissions\/(?<id>[^/]+)$/, "benchmarkSubmission", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/screen-feature-parity-checks\/(?<id>[^/]+)$/, "screenFeatureParityCheck", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/simplified-copy-previews\/(?<id>[^/]+)$/, "simplifiedCopyPreview", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/rubric-copy-traceability-maps\/(?<id>[^/]+)$/, "rubricCopyTraceabilityMap", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/governed-bundle-canonicalization-profiles\/(?<id>[^/]+)$/, "governedBundleCanonicalizationProfile", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/governed-bundles\/(?<id>[^/]+)$/, "governedBundleRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/release-config-manifests\/(?<id>[^/]+)$/, "releaseConfigManifest", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/policy-action-kinds\/(?<id>[^/]+)$/, "policyActionKind", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/policy-decisions\/(?<id>[^/]+)$/, "policyDecisionRecord", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/implementation-phase-gate-bundles\/(?<id>[^/]+)$/, "implementationPhaseGateBundle", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/queue-freshness-policies\/(?<id>[^/]+)$/, "queueFreshnessPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/client-surface-integrity-policies\/(?<id>[^/]+)$/, "clientSurfaceIntegrityPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/cloud-security-budget-policies\/(?<id>[^/]+)$/, "cloudSecurityBudgetPolicy", adminAuditRoles),
  workflowReadSpec(/^\/api\/v1\/external-worm-audit-log-policies\/(?<id>[^/]+)$/, "externalWormAuditLogPolicy", adminAuditRoles),
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
      const contributeRedirects = {
        "/contribute/positions/new": "/contribute/new?type=position",
        "/contribute/critiques/new": "/contribute/new?type=critique",
        "/contribute/sources/new": "/contribute/new?type=source",
      };
      if (request.method === "GET" && contributeRedirects[url.pathname]) {
        response.writeHead(308, { location: contributeRedirects[url.pathname], "cache-control": "no-store" });
        response.end();
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
  const v1AssignmentDraftStoragePolicyMatch = url.pathname.match(/^\/api\/v1\/assignments\/([^/]+)\/draft-storage-policy$/);
  if (request.method === "GET" && v1AssignmentDraftStoragePolicyMatch) {
    await assignmentDraftStoragePolicyEndpoint(request, response, context, decodeURIComponent(v1AssignmentDraftStoragePolicyMatch[1]));
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
  const v1RubricCopyTraceabilityMatch = url.pathname.match(/^\/api\/v1\/rubric-copy-traceability\/([^/]+)$/);
  if (request.method === "GET" && v1RubricCopyTraceabilityMatch) {
    await rubricCopyTraceabilityForScreenStateEndpoint(request, response, context, decodeURIComponent(v1RubricCopyTraceabilityMatch[1]));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/contributions/config") {
    contributionConfigEndpoint(response);
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/contributions/eligible-positions") {
    sendJson(response, 200, { positions: eligibleContributionPositions(positions) });
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/contributions/submissions") {
    await contributionSubmissionEndpoint(request, response, context);
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/contributions/my-submissions") {
    await contributionMySubmissionsEndpoint(request, response, context);
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/admin/user-submissions") {
    await adminContributionQueueEndpoint(request, response, context, "user-submissions");
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/admin/prepared-drafts") {
    await adminContributionQueueEndpoint(request, response, context, "prepared-drafts");
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/v1/admin/candidate-batches") {
    await adminContributionQueueEndpoint(request, response, context, "candidate-batches");
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/v1/admin/gate-decisions") {
    await contributionGateDecisionEndpoint(request, response, context);
    return;
  }
  const contributionPreparedDraftMatch = url.pathname.match(/^\/api\/v1\/admin\/user-submissions\/([^/]+)\/prepared-drafts$/);
  if (request.method === "POST" && contributionPreparedDraftMatch) {
    await contributionPreparedDraftEndpoint(request, response, context, decodeURIComponent(contributionPreparedDraftMatch[1]));
    return;
  }
  const contributionPromoteMatch = url.pathname.match(/^\/api\/v1\/admin\/prepared-drafts\/([^/]+)\/promote$/);
  if (request.method === "POST" && contributionPromoteMatch) {
    await contributionPreparedDraftPromotionEndpoint(request, response, context, decodeURIComponent(contributionPromoteMatch[1]));
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
      policyActionKind: "label_snapshot_freeze",
      phaseGateLaneKind: "route",
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
      policyActionKind: "training_export",
      phaseGateLaneKind: "export_path",
      requiredFields: [
        "id",
        "releaseId",
        "exportKind",
        "sourceLabelSnapshotId",
        "targetLabelVersion",
        "promptTrackExposurePolicy",
        "pairwiseComparisonSnapshotId",
        "pairwiseComparisonSnapshotStatus",
        "positionBalancedWeightingPolicy",
        "trainingExportUncertaintyPolicyId",
        "trainingExportUncertaintyPolicyReleaseUseStatus",
        "labelUncertaintyDownweightingPolicy",
        "labelUncertaintyDownweightingPolicyId",
        "pairwiseMarginThresholdPolicy",
        "lowMarginHandlingPolicy",
        "humanTargetTiePolicy",
        "modelPredictionIndifferencePolicy",
        "lowClarityPolicy",
        "rationaleInclusionPolicy",
        "promptExampleContaminationCheck",
        "releaseRightsEligibilitySummary",
        "createdBy",
        "timestamp",
      ],
      requiredNonEmptyArrayFields: ["sourceSplits", "excludedProtectedSplits", "targetFields"],
      requiredObjectFields: [
        "positionBalancedWeighting",
        "uncertaintyThresholdsApplied",
        "labelUncertaintyDownweightingRules",
        "itemTextVersionHashManifest",
        "ratingContextSnapshotManifest",
        "labelMetadataManifest",
      ],
      requiredObjectKeys: {
        positionBalancedWeighting: ["policy", "status", "pointwiseRowsByPosition", "pairwiseRowsByPosition", "pointwiseWeightSumByPosition"],
        uncertaintyThresholdsApplied: Object.keys(trainingExportUncertaintyThresholds),
        labelUncertaintyDownweightingRules: Object.keys(trainingExportDownweightRules),
        itemTextVersionHashManifest: ["itemTextVersionIds", "rows"],
        ratingContextSnapshotManifest: ["snapshotIds", "rows"],
        labelMetadataManifest: ["rows"],
      },
      requiredStructuredFields: {
        uncertaintyThresholdsApplied: trainingExportUncertaintyThresholds,
        labelUncertaintyDownweightingRules: trainingExportDownweightRules,
      },
      requiredArrayIncludes: {
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
      },
      requiredStringIncludes: {
        labelUncertaintyDownweightingPolicy: ["uncertainty"],
        pairwiseMarginThresholdPolicy: ["margin"],
        lowMarginHandlingPolicy: ["low", "margin"],
        humanTargetTiePolicy: ["tie"],
        lowClarityPolicy: ["clarity"],
        rationaleInclusionPolicy: ["rationale"],
        releaseRightsEligibilitySummary: ["rights"],
      },
      requiredStringIncludesAny: {
        modelPredictionIndifferencePolicy: ["indifference", "tie"],
        promptExampleContaminationCheck: ["protected", "hidden"],
      },
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
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, spec);
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
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
  let resource = validation.resource;
  let policyGate = null;
  if (spec.policyActionKind) {
    policyGate = await appendWorkflowPolicyDecisionGate(context, request, session.user, resource, spec, {});
    if (!policyGate.ok) {
      sendJson(response, policyGate.statusCode ?? 409, { error: policyGate.error, detail: policyGate.detail, ...(policyGate.extra ?? {}) });
      return true;
    }
    resource = {
      ...resource,
      policyActionKind: policyGate.actionKind,
      policyDecisionId: policyGate.decision.id,
      policyDecisionConsumptionId: policyGate.consumption.id,
      policyDecisionIdempotencyKey: policyGate.decision.idempotencyKey,
    };
  }
  const bindingValidation = await validateWorkflowResourceBindings(context, resource, spec);
  if (!bindingValidation.ok) {
    sendJson(response, bindingValidation.statusCode ?? 409, {
      error: bindingValidation.error ?? "workflow_resource_binding_failed",
      detail: bindingValidation.detail,
      ...(bindingValidation.extra ?? {}),
    });
    return true;
  }
  const event = createWorkflowAuditEvent(spec.eventType, session.user, spec.resourceKey, resource, request, {
    route: spec.route,
    requiredRoles: spec.roles,
  });
  await context.auditStore.appendWorkflowEvent(event);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    eventType: event.type,
    resourceKey: spec.resourceKey,
    resourceId: resource.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
    ...(policyGate
      ? {
          policyDecisionId: policyGate.decision.id,
          policyDecisionConsumptionId: policyGate.consumption.id,
          policyActionKind: policyGate.actionKind,
        }
      : {}),
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
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, spec);
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body[spec.resourceKey] ?? body.resource ?? body;
  const validationContext = spec.requireAssignmentClaimField
    ? { workflowAssignments: latestWorkflowResources(await readPersistedWorkflowEvents(context.auditStore), "assignment") }
    : {};
  const validation = validateWorkflowPayload(candidate, session.user, spec, params, validationContext);
  if (!validation.ok) {
    sendJson(response, validation.statusCode ?? 400, { error: validation.error ?? "invalid_workflow_payload", detail: validation.detail });
    return;
  }
  let resource = validation.resource;
  let policyGate = null;
  if (spec.policyActionKind) {
    policyGate = await appendWorkflowPolicyDecisionGate(context, request, session.user, resource, spec, params);
    if (!policyGate.ok) {
      sendJson(response, policyGate.statusCode ?? 409, { error: policyGate.error, detail: policyGate.detail, ...(policyGate.extra ?? {}) });
      return;
    }
    resource = {
      ...resource,
      policyActionKind: policyGate.actionKind,
      policyDecisionId: policyGate.decision.id,
      policyDecisionConsumptionId: policyGate.consumption.id,
      policyDecisionIdempotencyKey: policyGate.decision.idempotencyKey,
    };
  }
  const bindingValidation = await validateWorkflowResourceBindings(context, resource, spec);
  if (!bindingValidation.ok) {
    sendJson(response, bindingValidation.statusCode ?? 409, {
      error: bindingValidation.error ?? "workflow_resource_binding_failed",
      detail: bindingValidation.detail,
      ...(bindingValidation.extra ?? {}),
    });
    return;
  }
  const event = createWorkflowAuditEvent(spec.eventType, session.user, spec.resourceKey, resource, request, {
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
    resourceId: resource.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
    ...(policyGate
      ? {
          policyDecisionId: policyGate.decision.id,
          policyDecisionConsumptionId: policyGate.consumption.id,
          policyActionKind: policyGate.actionKind,
        }
      : {}),
  });
}

async function enforceWorkflowSpecPhaseGate(context, actor, spec) {
  const laneKind = workflowSpecPhaseGateLaneKind(spec);
  const phaseGate = await resolveImplementationPhaseGate(context, laneKind, actor);
  if (phaseGate.ok) return { ok: true, laneKind, phaseGate };
  return {
    ok: false,
    statusCode: 409,
    error: "implementation_phase_lane_unavailable",
    detail: phaseGate.detail,
    extra: {
      laneKind,
      phaseState: phaseGate.phaseState ?? null,
      activeBundleId: phaseGate.bundle?.id ?? null,
    },
  };
}

function sendWorkflowPhaseGateFailure(response, phaseGate) {
  sendJson(response, phaseGate.statusCode ?? 409, { error: phaseGate.error, detail: phaseGate.detail, ...(phaseGate.extra ?? {}) });
}

function workflowSpecPhaseGateLaneKind(spec) {
  if (spec.phaseGateLaneKind) return spec.phaseGateLaneKind;
  if (phaseGateGovernanceResourceKeys.has(spec.resourceKey)) return "governance_action";
  if (phaseGateQueueResourceKeys.has(spec.resourceKey)) return "queue";
  if (phaseGateUiPanelResourceKeys.has(spec.resourceKey)) return "ui_panel";
  if (phaseGateExportResourceKeys.has(spec.resourceKey)) return "export_path";
  if (phaseGateEvaluationResourceKeys.has(spec.resourceKey)) return "evaluation_lane";
  if (phaseGateWorkerResourceKeys.has(spec.resourceKey)) return "worker";
  if (phaseGateHiddenBenchmarkSubmissionResourceKeys.has(spec.resourceKey)) return "hidden_benchmark_submission_lane";
  return "route";
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

function contributionConfigEndpoint(response) {
  sendJson(response, 200, {
    architecture: CONTRIBUTION_ARCHITECTURE,
    partSchemas: CONTRIBUTION_PART_SCHEMAS,
    templates: CONTRIBUTION_TEMPLATES,
    originChoices: ORIGIN_CHOICES,
    workflowGates: WORKFLOW_GATES,
    workflowPolicies: WORKFLOW_POLICIES,
    userFacingRoutes: {
      contribute: "/contribute",
      newContribution: "/contribute/new",
      mySubmissions: "/contribute/my-submissions",
      legacyRedirects: {
        "/contribute/positions/new": "/contribute/new?type=position",
        "/contribute/critiques/new": "/contribute/new?type=critique",
        "/contribute/sources/new": "/contribute/new?type=source",
      },
    },
  });
}

async function contributionSubmissionEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!contributionSubmissionRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: contributionSubmissionRoles });
    return;
  }
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, { resourceKey: "contributionSubmission", roles: contributionSubmissionRoles });
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.contributionSubmission ?? body.submission ?? body.resource ?? body;
  const result = createContributionSubmissionResources(candidate, session.user, {
    eligiblePositionIds: positions.map((position) => position.id),
  });
  if (!result.ok) {
    sendJson(response, 400, { error: result.error, detail: result.detail });
    return;
  }
  const events = await appendContributionWorkflowResources(context, request, session.user, result.resources, {
    eventSuffix: result.submission.reviewStatus === "draft" ? "draft_saved" : "submitted",
    route: "/api/v1/contributions/submissions",
    requiredRoles: contributionSubmissionRoles,
  });
  sendJson(response, 201, {
    ok: true,
    submission: result.userView,
    eventIds: events.map((event) => event.id),
    resourcesCreated: contributionResourceCounts(result.resources),
    safety: {
      trustStatus: "untrusted_user_submission",
      createdCandidateItems: false,
      createdCandidateBatches: false,
      createdLiveCorpusRecords: false,
      reviewSignalsHiddenFromUser: true,
    },
  });
}

async function contributionMySubmissionsEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!contributionSubmissionRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: contributionSubmissionRoles });
    return;
  }
  const model = await contributionReadModel(context);
  const submissions = model.contributionSubmissions
    .filter((submission) => submission.submitterId === session.user.id)
    .map((submission) =>
      sanitizeContributionSubmissionForUser(submission, {
        contributionParts: model.contributionParts,
        preparedDrafts: model.preparedDrafts,
        clarificationRequests: model.clarificationRequests,
      }),
    );
  sendJson(response, 200, {
    submissions,
    privacy: {
      userVisibleOnly: true,
      reviewerControlPlaneWithheld: true,
      raterOnlyMaterialWithheld: true,
    },
  });
}

async function adminContributionQueueEndpoint(request, response, context, queueName) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!contributionAdminRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: contributionAdminRoles });
    return;
  }
  const model = await contributionReadModel(context);
  if (queueName === "prepared-drafts") {
    sendJson(response, 200, {
      tabs: [
        "All drafts",
        "Has review signals",
        "Needs blinding review",
        "Needs context review",
        "Needs duplicate review",
        "Blocked by gate",
        "Ready for candidate-item creation",
        "Promoted to candidate item",
        "Rejected",
      ],
      rows: model.preparedDrafts.map((draft) => adminPreparedDraftRow(draft, model)),
    });
    return;
  }
  if (queueName === "candidate-batches") {
    const batchingEnabled = model.candidateBatches.length > 0;
    sendJson(response, 200, {
      batchingEnabled,
      tabs: batchingEnabled
        ? ["All batches", "Draft batches", "Ready for review", "Has review signals", "Blocked by gate", "Under review", "Ready for downstream promotion", "Closed"]
        : [],
      rows: model.candidateBatches.map((batch) => adminCandidateBatchRow(batch, model)),
    });
    return;
  }
  sendJson(response, 200, {
    tabs: [
      "All pending",
      "Needs clarification",
      "Positions",
      "Critiques",
      "Sources",
      "Multi-part submissions",
      "Has review signals",
      "Blocked by gate",
      "Possible duplicates",
      "Possible source leakage",
      "AI-assisted",
      "Direct quotes",
    ],
    filters: [
      "contribution type",
      "template key",
      "part type",
      "source-origin choice",
      "review-signal type",
      "review-signal source",
      "gate status",
      "direct quote flag",
      "adapted-source flag",
      "conceptual-scope gate status",
      "context-sufficiency gate status",
      "likely source leakage",
      "duplicate/near-duplicate status",
      "LLM-assisted/model-generated status",
      "submitter history",
    ],
    rows: model.contributionSubmissions.map((submission) => adminContributionSubmissionRow(submission, model)),
  });
}

async function contributionGateDecisionEndpoint(request, response, context) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!contributionAdminRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: contributionAdminRoles });
    return;
  }
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, { resourceKey: "gateDecision", roles: contributionAdminRoles });
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.gateDecision ?? body.resource ?? body;
  const validation = createGateDecisionResource(candidate, session.user);
  if (!validation.ok) {
    sendJson(response, 400, { error: validation.error, detail: validation.detail });
    return;
  }
  const [event] = await appendContributionWorkflowResources(
    context,
    request,
    session.user,
    { gateDecision: [validation.resource] },
    { eventSuffix: "recorded", route: "/api/v1/admin/gate-decisions", requiredRoles: contributionAdminRoles },
  );
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    resourceKey: "gateDecision",
    resourceId: validation.resource.id,
    gateDecision: validation.resource,
  });
}

async function contributionPreparedDraftEndpoint(request, response, context, submissionId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!contributionAdminRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: contributionAdminRoles });
    return;
  }
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, { resourceKey: "preparedDraft", roles: contributionAdminRoles });
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
    return;
  }
  const model = await contributionReadModel(context);
  const submission = model.contributionSubmissions.find((item) => item.id === submissionId);
  if (!submission) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.preparedDraft ?? body.resource ?? body;
  const partId = candidate.sourceContributionPartId ?? candidate.sourcePartId ?? candidate.contributionPartId;
  const part = model.contributionParts.find((item) => item.id === partId && item.submissionId === submission.id);
  if (!part) {
    sendJson(response, 400, { error: "source_contribution_part_not_found", detail: `No ContributionPart ${partId} exists on ${submission.id}.` });
    return;
  }
  const validation = createPreparedDraftFromPart(part, candidate, model.gateDecisions, session.user);
  if (!validation.ok) {
    sendJson(response, 400, { error: validation.error, detail: validation.detail });
    return;
  }
  const [event] = await appendContributionWorkflowResources(
    context,
    request,
    session.user,
    { preparedDraft: [validation.resource] },
    { eventSuffix: "created", route: `/api/v1/admin/user-submissions/${submissionId}/prepared-drafts`, requiredRoles: contributionAdminRoles },
  );
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    preparedDraft: validation.resource,
    requiredPreparedDraftGateIds: requiredGateIdsForPolicy("prepared_draft_readiness"),
  });
}

async function contributionPreparedDraftPromotionEndpoint(request, response, context, preparedDraftId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!contributionAdminRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: contributionAdminRoles });
    return;
  }
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, { resourceKey: "promotionRecord", roles: contributionAdminRoles });
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
    return;
  }
  const model = await contributionReadModel(context);
  const preparedDraft = model.preparedDrafts.find((item) => item.id === preparedDraftId);
  if (!preparedDraft) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.promotion ?? body.resource ?? body;
  const validation = promotePreparedDraftToCandidateItem(preparedDraft, candidate, model.gateDecisions, session.user);
  if (!validation.ok) {
    sendJson(response, 400, { error: validation.error, detail: validation.detail });
    return;
  }
  const events = await appendContributionWorkflowResources(context, request, session.user, validation.resources, {
    eventSuffix: "created",
    route: `/api/v1/admin/prepared-drafts/${preparedDraftId}/promote`,
    requiredRoles: contributionAdminRoles,
  });
  sendJson(response, 201, {
    ok: true,
    eventIds: events.map((event) => event.id),
    candidateItem: validation.candidateItem,
    promotionRecord: validation.promotionRecord,
    safety: {
      createdCandidateBatch: false,
      createdLivePosition: false,
      createdLiveCritique: false,
    },
  });
}

async function appendContributionWorkflowResources(context, request, actor, resources, options = {}) {
  const orderedKeys = [
    "contributionSubmission",
    "contributionPart",
    "originDisclosure",
    "contributionPartLink",
    "reviewSignal",
    "exposureConflict",
    "gateDecision",
    "clarificationRequest",
    "reviewDecision",
    "preparedDraft",
    "candidateItem",
    "promotionRecord",
    "candidateBatchMembership",
  ];
  const events = [];
  for (const resourceKey of orderedKeys) {
    for (const resource of resources[resourceKey] ?? []) {
      const event = createWorkflowAuditEvent(`${snakeCase(resourceKey)}_${options.eventSuffix ?? "recorded"}`, actor, resourceKey, resource, request, {
        route: options.route ?? null,
        requiredRoles: options.requiredRoles ?? [],
      });
      await context.auditStore.appendWorkflowEvent(event);
      events.push(event);
    }
  }
  return events;
}

async function contributionReadModel(context) {
  const workflowEvents = await readPersistedWorkflowEvents(context.auditStore);
  return {
    contributionSubmissions: latestWorkflowResources(workflowEvents, "contributionSubmission"),
    contributionParts: latestWorkflowResources(workflowEvents, "contributionPart"),
    originDisclosures: latestWorkflowResources(workflowEvents, "originDisclosure"),
    contributionPartLinks: latestWorkflowResources(workflowEvents, "contributionPartLink"),
    reviewSignals: latestWorkflowResources(workflowEvents, "reviewSignal"),
    workflowGates: latestWorkflowResources(workflowEvents, "workflowGate"),
    workflowPolicies: latestWorkflowResources(workflowEvents, "workflowPolicy"),
    gateDecisions: latestWorkflowResources(workflowEvents, "gateDecision"),
    clarificationRequests: latestWorkflowResources(workflowEvents, "clarificationRequest"),
    reviewDecisions: latestWorkflowResources(workflowEvents, "reviewDecision"),
    preparedDrafts: latestWorkflowResources(workflowEvents, "preparedDraft"),
    candidateItems: latestWorkflowResources(workflowEvents, "candidateItem"),
    promotionRecords: latestWorkflowResources(workflowEvents, "promotionRecord"),
    candidateBatches: latestWorkflowResources(workflowEvents, "candidateBatch"),
    candidateBatchMemberships: latestWorkflowResources(workflowEvents, "candidateBatchMembership"),
    exposureConflicts: latestWorkflowResources(workflowEvents, "exposureConflict"),
  };
}

function contributionResourceCounts(resources) {
  return Object.fromEntries(Object.entries(resources).map(([key, rows]) => [key, rows.length]));
}

function adminContributionSubmissionRow(submission, model) {
  const parts = model.contributionParts.filter((part) => part.submissionId === submission.id);
  const origins = model.originDisclosures.filter((origin) => parts.some((part) => part.id === origin.contributionPartId));
  const signals = model.reviewSignals.filter((signal) => parts.some((part) => part.id === signal.affectedObjectId));
  const gateSummary = contributionGateSummary(model.gateDecisions, parts.map((part) => part.id), "raw_intake_acceptance");
  return {
    id: submission.id,
    contributionType: submission.templateKey,
    templateKey: submission.templateKey,
    partsIncluded: parts.map((part) => part.partType),
    preview: parts.map((part) => part.submittedText ?? part.rawFields?.source_title).filter(Boolean).join(" / ").slice(0, 120),
    submitterTrustTier: submission.submitterTrustTier,
    sourceOriginChoiceSummary: origins.map((origin) => origin.origin_choice),
    reviewSignalBadges: [...new Set(signals.map((signal) => signal.signalType))],
    requiredGateSummary: gateSummary,
    createdDate: submission.createdAt,
    currentRollupStatus: submission.reviewStatus,
    primaryAction: "Review submission",
  };
}

function adminPreparedDraftRow(draft, model) {
  const sourcePart = model.contributionParts.find((part) => part.id === draft.sourceContributionPartId);
  const origin = model.originDisclosures.find((item) => item.contributionPartId === draft.sourceContributionPartId);
  const signals = model.reviewSignals.filter((signal) => signal.affectedObjectId === draft.id || signal.affectedObjectId === draft.sourceContributionPartId);
  return {
    id: draft.id,
    preparedDraftType: draft.draftType,
    sourceContributionPart: draft.sourceContributionPartId,
    preview: String(draft.preparedText ?? draft.preparedSourceCardContent?.source_title ?? sourcePart?.submittedText ?? "").slice(0, 120),
    sourceOriginSummary: origin?.origin_choice ?? "none",
    reviewSignalBadges: [...new Set(signals.map((signal) => signal.signalType))],
    requiredGateSummary: contributionGateSummary(model.gateDecisions, [draft.id], "prepared_draft_readiness"),
    candidateItemReadiness: draft.candidateItemReadiness,
    primaryAction: "Review prepared draft",
  };
}

function adminCandidateBatchRow(batch, model) {
  const memberships = model.candidateBatchMemberships.filter((membership) => membership.candidateBatchId === batch.id);
  const itemIds = new Set(memberships.map((membership) => membership.candidateItemId));
  const items = model.candidateItems.filter((item) => itemIds.has(item.id));
  return {
    id: batch.id,
    batchTitle: batch.title ?? batch.id,
    batchPurpose: batch.batchPurpose ?? batch.purpose ?? null,
    candidateItemCount: items.length,
    includedItemTypes: [...new Set(items.map((item) => item.itemType))],
    batchReviewSignalSummary: model.reviewSignals.filter((signal) => signal.affectedObjectId === batch.id).map((signal) => signal.signalType),
    batchGateSummary: contributionGateSummary(model.gateDecisions, [batch.id], "candidate_batch_downstream_handoff"),
    batchStatus: batch.batchStatus ?? "draft",
    createdDate: batch.createdAt ?? null,
    primaryAction: "Review batch",
  };
}

function contributionGateSummary(gateDecisions, objectIds, policyId) {
  const summaries = objectIds.map((objectId) => gatesSatisfiedForPolicy(policyId, objectId, gateDecisions));
  const missingGateIds = [...new Set(summaries.flatMap((summary) => summary.missingGateIds))];
  const blockingGateIds = [...new Set(summaries.flatMap((summary) => summary.blockingGateIds))];
  return {
    policyId,
    status: missingGateIds.length || blockingGateIds.length ? "blocked_or_pending" : "satisfied",
    requiredGateIds: requiredGateIdsForPolicy(policyId),
    missingGateIds,
    blockingGateIds,
  };
}

function snakeCase(value) {
  return String(value).replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
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

async function assignmentDraftStoragePolicyEndpoint(request, response, context, assignmentId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!workflowStateReadRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: workflowStateReadRoles });
    return;
  }
  if (["rater", "graduate", "phd"].includes(session.user.role) && !(await actorCanAccessAssignmentId(context, assignmentId, session.user))) {
    sendJson(response, 403, { error: "workflow_actor_not_authorized", detail: `actor ${session.user.id} is not assigned to ${assignmentId}` });
    return;
  }
  const artifacts = await buildCurrentReleaseArtifacts(context);
  const submittedPolicy = artifacts.draftStoragePolicies.at(-1) ?? null;
  const policy = submittedPolicy ?? artifacts.report.ratingExperienceEvidence?.draftStoragePolicyRows?.at(-1) ?? null;
  if (!policy) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, {
    assignmentId,
    draftStoragePolicy: policy,
    policySource: submittedPolicy ? "submitted_workflow_draft_storage_policy" : "seed_draft_storage_policy",
    serverSidePersistenceDefault: policy.serverSidePersistenceDefault === true,
    clientStatePolicy: policy.clientStatePolicy ?? null,
    localStorageProhibited: policy.localStorageProhibited === true,
    staleDraftDependencyBlocker: policy.staleDraftDependencyBlocker === true,
  });
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
  if (["rater", "graduate", "phd"].includes(session.user.role) && !(await actorCanAccessAssignmentId(context, assignmentId, session.user))) {
    sendJson(response, 403, { error: "workflow_actor_not_authorized", detail: `actor ${session.user.id} is not assigned to ${assignmentId}` });
    return;
  }
  const assignment =
    assignments.find((item) => item.id === assignmentId) ??
    (await workflowResourceById(context, "assignment", assignmentId)) ??
    { id: assignmentId, positionId: null, critiqueId: null };
  const screenState = buildScreenStatePayload("rating", assignment.id, session.user, {
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
  });
  const protectedRender = await attachProtectedRenderPolicyDecision(
    context,
    request,
    session.user,
    screenState,
    "/api/v1/assignments/{id}/screen-state",
    workflowStateReadRoles,
    { id: assignmentId },
  );
  if (!protectedRender.ok) {
    sendJson(response, protectedRender.statusCode ?? 409, { error: protectedRender.error, detail: protectedRender.detail, ...(protectedRender.extra ?? {}) });
    return;
  }
  sendJson(response, 200, protectedRender.screenState);
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
  const screenState = buildScreenStatePayload(surface, id, session.user, {
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
  });
  const protectedRender = await attachProtectedRenderPolicyDecision(
    context,
    request,
    session.user,
    screenState,
    `/api/v1/${surface === "discussion" ? "discussions" : "adjudications"}/{id}/screen-state`,
    workflowStateReadRoles,
    { id },
  );
  if (!protectedRender.ok) {
    sendJson(response, protectedRender.statusCode ?? 409, { error: protectedRender.error, detail: protectedRender.detail, ...(protectedRender.extra ?? {}) });
    return;
  }
  sendJson(response, 200, protectedRender.screenState);
}

async function attachProtectedRenderPolicyDecision(context, request, actor, screenState, route, roles, params = {}) {
  const policyGate = await appendWorkflowPolicyDecisionGate(
    context,
    request,
    actor,
    {
      id: screenState.id,
      surface: screenState.surface,
      outputSchemaVersion: screenState.outputSchemaVersion,
      targetArtifactId: screenState.entityId ?? screenState.assignmentId ?? screenState.id,
    },
    {
      eventType: "protected_render",
      resourceKey: "protectedRender",
      route,
      roles,
      policyActionKind: "protected_render",
      phaseGateLaneKind: "ui_panel",
      policyDecisionSingleUse: false,
    },
    params,
  );
  if (!policyGate.ok) return policyGate;
  return {
    ok: true,
    screenState: {
      ...screenState,
      policyActionKind: policyGate.actionKind,
      policyDecisionId: policyGate.decision.id,
      policyDecisionConsumptionId: policyGate.consumption.id,
      policyDecisionIdempotencyKey: policyGate.decision.idempotencyKey,
    },
  };
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
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, { resourceKey: "raterLearningPlan", roles: participantDataWriteRoles });
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.raterLearningPlan ?? body.resource ?? {};
  const raterId = session.user.role === "admin" ? candidate.raterId ?? body.raterId ?? session.user.id : session.user.id;
  const resource = {
    id: candidate.id ?? `rater-learning-plan-${raterId}-${moduleId}`,
    raterDashboardPolicyId: candidate.raterDashboardPolicyId ?? `rater-dashboard-policy-october-2026-demo`,
    raterId,
    rubricVersion: candidate.rubricVersion ?? "appendix-f-operational-v1",
    certificationPackVersion: candidate.certificationPackVersion ?? "pack-v1",
    practiceGoldDuplicatePerformanceSummaries: candidate.practiceGoldDuplicatePerformanceSummaries ?? { remediation: "completed" },
    perDimensionDriftSummary: candidate.perDimensionDriftSummary ?? { remediation: "completed" },
    assignedRemediationModules: normalizeWorkflowStringList(candidate.assignedRemediationModules ?? [moduleId]),
    completedModules: normalizeWorkflowStringList(candidate.completedModules ?? [moduleId]),
    currentAssignmentRestrictionsUnlocks: normalizeWorkflowStringList(candidate.currentAssignmentRestrictionsUnlocks ?? ["ordinary_live_allowed"]),
    dashboardVisibilityStatus: candidate.dashboardVisibilityStatus ?? "private_training_only",
    remediationRoutingStatus: candidate.remediationRoutingStatus ?? "ordinary_live_allowed",
    feedbackArtifactsShown: normalizeWorkflowStringList(candidate.feedbackArtifactsShown ?? []),
    protectedLabelExposureCheck: candidate.protectedLabelExposureCheck ?? "no_protected_or_live_labels_shown",
    hiddenProtectedLabelsSuppressed: candidate.hiddenProtectedLabelsSuppressed ?? true,
    livePeerModelSourceLabelsHidden: candidate.livePeerModelSourceLabelsHidden ?? true,
    trainingApprovedFeedbackOnly: candidate.trainingApprovedFeedbackOnly ?? true,
    timestamp: candidate.timestamp ?? new Date().toISOString(),
  };
  const validation = validateWorkflowPayload(resource, session.user, {
    resourceKey: "raterLearningPlan",
    requiredFields: raterLearningPlanRequiredFields,
    allowedValues: {
      dashboardVisibilityStatus: REQUIRED_RATER_DASHBOARD_VISIBILITY_STATUSES,
      remediationRoutingStatus: REQUIRED_RATER_DASHBOARD_REMEDIATION_STATUSES,
    },
    requiredExactFields: {
      hiddenProtectedLabelsSuppressed: true,
      livePeerModelSourceLabelsHidden: true,
      trainingApprovedFeedbackOnly: true,
    },
    requiredStringIncludes: { protectedLabelExposureCheck: ["no_protected", "live_labels"] },
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
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, { resourceKey: "itemIssueAction", roles: expertWorkflowRoles });
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.itemIssueAction ?? body.resource ?? body;
  const resource = {
    ...candidate,
    id: candidate.id ?? `item-issue-action-${itemIssueId}-${action}`,
    itemIssueId,
    action,
    actorId: candidate.actorId ?? session.user.id,
    resolutionStatus: candidate.resolutionStatus ?? (action === "triage" ? "triage_opened" : action === "resolve" ? "resolved" : "quarantined"),
    quarantineScope: candidate.quarantineScope ?? (action === "quarantine" ? "affected_item" : "none"),
    labelVisibilityStateForTriage: candidate.labelVisibilityStateForTriage ?? "labels_hidden_from_triage",
    modelResultVisibilityStateForTriage: candidate.modelResultVisibilityStateForTriage ?? "model_results_hidden_from_triage",
    notes: candidate.notes ?? "",
    timestamp: candidate.timestamp ?? new Date().toISOString(),
  };
  const validation = validateWorkflowPayload(resource, session.user, {
    resourceKey: "itemIssueAction",
    requiredFields: ["id", "itemIssueId", "action", "actorId", "resolutionStatus", "quarantineScope", "labelVisibilityStateForTriage", "modelResultVisibilityStateForTriage", "timestamp"],
    allowedValues: {
      action: itemIssueActionKinds,
      resolutionStatus: itemIssueResolutionStatuses,
      quarantineScope: itemIssueQuarantineScopes,
    },
    requiredExactFields: {
      labelVisibilityStateForTriage: "labels_hidden_from_triage",
      modelResultVisibilityStateForTriage: "model_results_hidden_from_triage",
    },
    requiredWhen: [
      {
        field: "action",
        equals: "quarantine",
        requiredStringIncludesAny: { quarantineScope: ["affected", "dependent"] },
      },
    ],
    requireActorField: "actorId",
    rejectHiddenMetadata: true,
    rejectRawBenchmarkContent: true,
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
    releaseConfigManifestId: submission.releaseConfigManifestId,
    evaluationManifestId: submission.evaluationManifestId,
    aggregateOnly: true,
    perItemOutputIncluded: false,
    perPairOutputIncluded: false,
    hiddenIdExposureIncluded: false,
    promptSpecificCorrectionHintsIncluded: false,
    aggregateMetricFamilyResults: submission.aggregateMetricFamilyResults,
    uncertaintyIntervals: submission.uncertaintyIntervals,
    coverageCounts: submission.coverageCounts,
    coarseEligibilityWarnings: submission.coarseEligibilityWarnings,
    budgetConsumptionStatus: submission.budgetConsumptionStatus,
    cooldownStatus: submission.cooldownStatus,
    duplicateRunStatus: submission.duplicateRunStatus,
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

async function rubricCopyTraceabilityForScreenStateEndpoint(request, response, context, screenStateId) {
  const session = await authenticateRequest(request, context.auth);
  if (!session.ok) {
    sendJson(response, 401, { error: session.error });
    return;
  }
  if (!adminAuditRoles.includes(session.user.role)) {
    sendJson(response, 403, { error: "required_role_missing", requiredRoles: adminAuditRoles });
    return;
  }
  const screenState = await workflowResourceById(context, "screenStatePayload", screenStateId);
  const surface = inferScreenStateSurface(screenStateId, screenState);
  if (!surface) {
    sendJson(response, 404, { error: "screen_state_surface_not_found" });
    return;
  }
  const artifacts = await buildCurrentReleaseArtifacts(context);
  const submittedMap = [...artifacts.rubricCopyTraceabilityMaps].reverse().find((map) => normalizeWorkflowStringList(map.coveredScreenIds).includes(surface)) ?? null;
  const seedMap =
    [...(artifacts.report.uxSimplification?.rubricCopyTraceabilityMapRows ?? [])]
      .reverse()
      .find((map) => normalizeWorkflowStringList(map.coveredScreenIds).includes(surface)) ?? null;
  const map = submittedMap ?? seedMap;
  if (!map) {
    sendJson(response, 404, { error: "artifact_not_found" });
    return;
  }
  sendJson(response, 200, {
    screenStateId,
    surface,
    screenState: screenState ?? null,
    rubricCopyTraceabilityMap: map,
    traceabilitySource: submittedMap ? "submitted_workflow_rubric_copy_traceability_map" : "seed_rubric_copy_traceability_map",
    semanticDriftTestStatus: map.semanticDriftTestStatus ?? null,
    releaseCriticalUseStatus: map.releaseCriticalUseStatus ?? null,
  });
}

function inferScreenStateSurface(screenStateId, screenState) {
  const explicitSurface = screenState?.surface ?? screenState?.screenId ?? screenState?.screenKind;
  if (typeof explicitSurface === "string" && explicitSurface) return explicitSurface;
  const normalized = String(screenStateId ?? "");
  if (normalized.startsWith("screen-state-rating-")) return "rating";
  if (normalized.startsWith("screen-state-discussion-")) return "discussion";
  if (normalized.startsWith("screen-state-adjudication-")) return "adjudication";
  if (normalized.startsWith("screen-state-practice-")) return "practice";
  if (assignments.some((assignment) => `screen-state-${assignment.id}` === normalized || assignment.id === normalized)) return "rating";
  return null;
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
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, { resourceKey: "policyDecisionConsumption", roles: adminRoles });
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
    return;
  }
  const decision = await workflowResourceById(context, "policyDecisionRecord", requestedDecisionId);
	  if (!decision) {
	    sendJson(response, 404, { error: "policy_decision_not_found" });
	    return;
	  }
	  const policyDecisionFailClosedReasons = [
	    decision.decisionStatus === "allow" ? null : "decisionStatus",
	    decision.replayStatus === "unused" ? null : "replayStatus",
	    decision.manifestBindingStatus === "matched" ? null : "manifestBindingStatus",
	    decision.outputSchemaBindingStatus === "matched" ? null : "outputSchemaBindingStatus",
	    decision.phaseGateBindingStatus === "matched" ? null : "phaseGateBindingStatus",
	    decision.idempotencyBindingStatus === "matched" ? null : "idempotencyBindingStatus",
	    typeof decision.manifestHash === "string" && decision.manifestHash.startsWith("sha256:") ? null : "manifestHash",
	    typeof decision.phaseGateBundleId === "string" && decision.phaseGateBundleId.trim() ? null : "phaseGateBundleId",
	    typeof decision.phaseGateBundleHash === "string" && decision.phaseGateBundleHash.startsWith("sha256:") ? null : "phaseGateBundleHash",
	    typeof decision.outputSchemaHash === "string" && decision.outputSchemaHash.startsWith("sha256:") ? null : "outputSchemaHash",
	    Array.isArray(decision.targetArtifactIds) && decision.targetArtifactIds.length ? null : "targetArtifactIds",
	    Date.parse(decision.expiresAt) > Date.now() ? null : "expiresAt",
	  ].filter(Boolean);
	  if (policyDecisionFailClosedReasons.length) {
	    sendJson(response, 409, {
	      error: "policy_decision_not_current",
	      decisionId: requestedDecisionId,
	      failClosedReasons: policyDecisionFailClosedReasons,
	    });
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
	    manifestHash: candidate.manifestHash ?? decision.manifestHash,
	    phaseGateBundleId: candidate.phaseGateBundleId ?? decision.phaseGateBundleId,
	    phaseGateBundleHash: candidate.phaseGateBundleHash ?? decision.phaseGateBundleHash,
	    outputSchemaVersion: candidate.outputSchemaVersion ?? decision.outputSchemaVersion,
	    outputSchemaHash: candidate.outputSchemaHash ?? decision.outputSchemaHash,
	    idempotencyKey: candidate.idempotencyKey ?? decision.idempotencyKey,
	    replayRejected: false,
	    scopeMatched: true,
    consumedAt: candidate.consumedAt ?? new Date().toISOString(),
  };
  const scopeMismatches = [
	    consumption.actionKind !== decision.actionKind ? "actionKind" : null,
	    consumption.manifestId !== decision.manifestId ? "manifestId" : null,
	    consumption.manifestHash !== decision.manifestHash ? "manifestHash" : null,
	    consumption.phaseGateBundleId !== decision.phaseGateBundleId ? "phaseGateBundleId" : null,
	    consumption.phaseGateBundleHash !== decision.phaseGateBundleHash ? "phaseGateBundleHash" : null,
	    consumption.outputSchemaVersion !== decision.outputSchemaVersion ? "outputSchemaVersion" : null,
	    consumption.outputSchemaHash !== decision.outputSchemaHash ? "outputSchemaHash" : null,
	    decision.idempotencyKey && consumption.idempotencyKey !== decision.idempotencyKey ? "idempotencyKey" : null,
	  ].filter(Boolean);
  if (scopeMismatches.length) {
    sendJson(response, 409, { error: "policy_decision_scope_mismatch", decisionId: requestedDecisionId, scopeMismatches });
    return;
  }
	  const validation = validateWorkflowPayload(consumption, session.user, {
	    resourceKey: "policyDecisionConsumption",
	    requiredFields: ["id", "decisionId", "actionKind", "manifestId", "manifestHash", "phaseGateBundleId", "phaseGateBundleHash", "outputSchemaVersion", "outputSchemaHash", "idempotencyKey", "consumedAt"],
	    requiredStringPrefixes: { manifestHash: "sha256:", phaseGateBundleHash: "sha256:", outputSchemaHash: "sha256:" },
	    requiredExactFields: { replayRejected: false, scopeMatched: true },
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
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, { resourceKey: "sensitiveAuditChainVerification", roles: adminRoles });
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
    return;
  }
  const body = await readJsonBody(request);
  const workflowEvents = await readPersistedWorkflowEvents(context.auditStore);
  const externalWormAuditLogPolicies = latestWorkflowResources(workflowEvents, "externalWormAuditLogPolicy");
  const events = latestWorkflowResources(workflowEvents, "sensitiveAuditChainEvent").sort(
    (left, right) => Number(left.sequence ?? 0) - Number(right.sequence ?? 0) || String(left.id).localeCompare(String(right.id)),
  );
  const failures = [];
	  events.forEach((event, index) => {
	    const expectedSequence = index + 1;
	    const previous = events[index - 1] ?? null;
	    const approverHashes = Array.isArray(event.approverHashes) ? event.approverHashes : [];
	    const affectedArtifactIds = Array.isArray(event.affectedArtifactIds) ? event.affectedArtifactIds : [];
	    const redactedReasonClasses = Array.isArray(event.redactedReasonClasses) ? event.redactedReasonClasses : [];
	    if (event.sequence !== expectedSequence) failures.push(`sequence:${event.id}`);
	    if (index === 0 && event.previousEventHash) failures.push(`previousEventHash:${event.id}`);
	    if (index > 0 && event.previousEventHash !== previous.eventHash) failures.push(`previousEventHash:${event.id}`);
	    if (!String(event.chainId ?? "").trim()) failures.push(`chainId:${event.id}`);
	    if (event.actionKind !== event.eventKind) failures.push(`actionKind:${event.id}`);
	    if (!String(event.policyDecisionId ?? "").trim()) failures.push(`policyDecisionId:${event.id}`);
	    if (!String(event.governanceApprovalRecordId ?? "").trim()) failures.push(`governanceApprovalRecordId:${event.id}`);
	    if (!String(event.actorHash ?? "").startsWith("sha256:")) failures.push(`actorHash:${event.id}`);
	    if (approverHashes.length < 2 || approverHashes.some((hash) => !String(hash ?? "").startsWith("sha256:"))) failures.push(`approverHashes:${event.id}`);
	    if (!affectedArtifactIds.length) failures.push(`affectedArtifactIds:${event.id}`);
	    if (!String(event.beforeHash ?? "").startsWith("sha256:")) failures.push(`beforeHash:${event.id}`);
	    if (!String(event.afterHash ?? "").startsWith("sha256:")) failures.push(`afterHash:${event.id}`);
	    if (event.beforeHash === event.afterHash) failures.push(`beforeAfterHash:${event.id}`);
	    if (!String(event.eventHash ?? "").startsWith("sha256:")) failures.push(`eventHash:${event.id}`);
	    if (!redactedReasonClasses.length) failures.push(`redactedReasonClasses:${event.id}`);
	    if (!auditChainProtectedDataExposureClasses.includes(event.protectedDataExposureClass)) failures.push(`protectedDataExposureClass:${event.id}`);
	    const externalWormAuditLogPolicy = externalWormAuditLogPolicies.find((policy) => policy.id === event.externalWormAuditLogPolicyId);
	    if (!externalWormAuditLogPolicy) {
	      failures.push(`externalWormAuditLogPolicyId:${event.id}`);
	    } else {
	      if (externalWormAuditLogPolicy.policyVersion !== externalWormAuditLogPolicyVersion) failures.push(`externalWormAuditLogPolicyId:policyVersion:${event.id}`);
	      if (externalWormAuditLogPolicy.ledgerBackend !== externalWormAuditLedgerBackend) failures.push(`externalWormAuditLogPolicyId:ledgerBackend:${event.id}`);
	      if (!String(event.externalWormLedgerPointer ?? "").startsWith(externalWormAuditLogPolicy.ledgerPointerPrefix ?? externalWormAuditPointerPrefix)) {
	        failures.push(`externalWormLedgerPointer:${event.id}`);
	      }
	      if (!String(event.externalWormReceiptHash ?? "").startsWith(`${externalWormAuditLogPolicy.receiptHashAlgorithm ?? externalWormAuditReceiptHashAlgorithm}:`)) {
	        failures.push(`externalWormReceiptHash:${event.id}`);
	      }
	    }
	    const redactionPolicy = String(event.redactionPolicy ?? "").toLowerCase();
	    if (!["protected", "hidden", "raw", "private"].every((fragment) => redactionPolicy.includes(fragment))) failures.push(`redactionPolicy:${event.id}`);
	    if (!Number.isFinite(Date.parse(event.occurredAt))) failures.push(`occurredAt:${event.id}`);
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
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, { resourceKey: "workflowStateTransitionLog", roles: workflowStateTransitionRoles });
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
    return;
  }
  const body = await readJsonBody(request);
  const candidate = body.workflowStateTransitionLog ?? body.stateTransition ?? body.transition ?? body;
  const validation = validateWorkflowStateTransitionPayload(candidate, session.user, {
    workflowAssignments: latestWorkflowResources(await readPersistedWorkflowEvents(context.auditStore), "assignment"),
  });
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
  if (["rater", "graduate", "phd"].includes(session.user.role) && entityType === "assignment" && !(await actorCanAccessAssignmentId(context, entityId, session.user))) {
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
  const phaseGate = await enforceWorkflowSpecPhaseGate(context, session.user, { resourceKey, roles: participantDataWriteRoles });
  if (!phaseGate.ok) {
    sendWorkflowPhaseGateFailure(response, phaseGate);
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
  const rightsClearancePolicies = latestWorkflowResources(workflowEvents, "rightsClearancePolicy");
  const releaseFreezes = latestWorkflowResources(workflowEvents, "releaseFreeze");
  const certificationThresholdPolicies = latestWorkflowResources(workflowEvents, "certificationThresholdPolicy");
  const certificationRecords = latestWorkflowResources(workflowEvents, "certificationRecord");
  const exposureLogs = latestWorkflowResources(workflowEvents, "exposureLog");
  const revisionRecords = latestWorkflowResources(workflowEvents, "revisionRecord");
  const assignmentFlags = latestWorkflowResources(workflowEvents, "assignmentFlag");
  const discussions = latestWorkflowResources(workflowEvents, "discussion");
  const discussionThreads = latestWorkflowResources(workflowEvents, "discussionThread");
  const discussionComments = latestWorkflowResources(workflowEvents, "discussionComment");
  const discussionRevisionProposals = latestWorkflowResources(workflowEvents, "discussionRevisionProposal");
  const adjudications = latestWorkflowResources(workflowEvents, "adjudication");
  const adjudicationFinalizations = latestWorkflowResources(workflowEvents, "adjudicationFinalization");
  const adjudicationMemos = latestWorkflowResources(workflowEvents, "adjudicationMemo");
  const verificationRecords = latestWorkflowResources(workflowEvents, "verificationRecord");
  const verificationEvidenceArtifacts = latestWorkflowResources(workflowEvents, "verificationEvidenceArtifact");
  const modelFamilyOverlapPolicies = latestWorkflowResources(workflowEvents, "modelFamilyOverlapPolicy");
  const ratingChecks = latestWorkflowResources(workflowEvents, "ratingCheck");
  const labelSnapshots = latestWorkflowResources(workflowEvents, "labelSnapshot");
  const corpusManifests = latestWorkflowResources(workflowEvents, "corpusManifest");
  const trainingExports = latestWorkflowResources(workflowEvents, "trainingExport");
  const exportManifests = latestWorkflowResources(workflowEvents, "exportManifest");
  const itemTextNormalizationPolicies = latestWorkflowResources(workflowEvents, "itemTextNormalizationPolicy");
  const itemTextVersions = latestWorkflowResources(workflowEvents, "itemTextVersion");
  const modelPromptSiblingContextPolicies = latestWorkflowResources(workflowEvents, "modelPromptSiblingContextPolicy");
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
  const modelImprovementPolicies = latestWorkflowResources(workflowEvents, "modelImprovementPolicy");
  const modelImprovementRuns = latestWorkflowResources(workflowEvents, "modelImprovementRun");
  const evaluationRuns = latestWorkflowResources(workflowEvents, "evaluationRun");
  const modelEvaluationPredictions = latestWorkflowResources(workflowEvents, "modelEvaluationPrediction");
  const calibrationRuns = latestWorkflowResources(workflowEvents, "calibrationRun");
  const artifactProbeRuns = latestWorkflowResources(workflowEvents, "artifactProbeRun");
  const sanityBaselineRuns = latestWorkflowResources(workflowEvents, "sanityBaselineRun");
  const humanCeilingRuns = latestWorkflowResources(workflowEvents, "humanCeilingRun");
  const benchmarkRefreshPolicies = latestWorkflowResources(workflowEvents, "benchmarkRefreshPolicy");
  const validationTrancheEvidenceRecords = latestWorkflowResources(workflowEvents, "validationTrancheEvidence");
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
  const comparabilityTierPolicies = latestWorkflowResources(workflowEvents, "comparabilityTierPolicy");
  const comparabilityClaims = latestWorkflowResources(workflowEvents, "comparabilityClaim");
  const activeLearningSelectionPolicies = latestWorkflowResources(workflowEvents, "activeLearningSelectionPolicy");
  const trainingExportUncertaintyPolicies = latestWorkflowResources(workflowEvents, "trainingExportUncertaintyPolicy");
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
  const scoreExplanationPolicies = latestWorkflowResources(workflowEvents, "scoreExplanationPolicy");
  const ratingEscalationPolicies = latestWorkflowResources(workflowEvents, "ratingEscalationPolicy");
  const disagreementThresholdPolicies = latestWorkflowResources(workflowEvents, "disagreementThresholdPolicy");
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
  const draftStoragePolicies = latestWorkflowResources(workflowEvents, "draftStoragePolicy");
  const raterInstructionCompatibilityPolicies = latestWorkflowResources(workflowEvents, "raterInstructionCompatibilityPolicy");
  const raterInstructionRenderVersions = latestWorkflowResources(workflowEvents, "raterInstructionRenderVersion");
  const rubricLintConfigs = latestWorkflowResources(workflowEvents, "rubricLintConfig");
  const rubricLintEvents = latestWorkflowResources(workflowEvents, "rubricLintEvent");
  const itemIssueQuarantinePolicies = latestWorkflowResources(workflowEvents, "itemIssueQuarantinePolicy");
  const itemIssueReports = latestWorkflowResources(workflowEvents, "itemIssueReport");
  const itemIssueActions = latestWorkflowResources(workflowEvents, "itemIssueAction");
  const ratingDraftSessions = latestWorkflowResources(workflowEvents, "ratingDraftSession");
  const correctnessClaimWeightWorksheets = latestWorkflowResources(workflowEvents, "correctnessClaimWeightWorksheet");
  const protectedArtifactRetentionRecords = latestWorkflowResources(workflowEvents, "protectedArtifactRetentionRecord");
  const scoreConfidenceScalePolicies = latestWorkflowResources(workflowEvents, "scoreConfidenceScalePolicy");
  const scoreConfidenceAnnotations = latestWorkflowResources(workflowEvents, "scoreConfidenceAnnotation");
  const raterScoreConfidences = latestWorkflowResources(workflowEvents, "raterScoreConfidence");
  const rationaleEvidenceSpanRequirednessPolicies = latestWorkflowResources(workflowEvents, "rationaleEvidenceSpanRequirednessPolicy");
  const rationaleEvidenceSpans = latestWorkflowResources(workflowEvents, "rationaleEvidenceSpan");
  const samePositionScratchpads = latestWorkflowResources(workflowEvents, "samePositionScratchpad");
  const samePositionBatchReviewRequirednessPolicies = latestWorkflowResources(workflowEvents, "samePositionBatchReviewRequirednessPolicy");
  const samePositionBatchReviews = latestWorkflowResources(workflowEvents, "samePositionBatchReview");
  const externalAssistanceContaminationPolicies = latestWorkflowResources(workflowEvents, "externalAssistanceContaminationPolicy");
  const externalAssistanceDeclarations = latestWorkflowResources(workflowEvents, "externalAssistanceDeclaration");
  const sourceLeakageRedactionPolicies = latestWorkflowResources(workflowEvents, "sourceLeakageRedactionPolicy");
  const blindingPreviewAudits = latestWorkflowResources(workflowEvents, "blindingPreviewAudit");
  const partialTaskPromotionPolicies = latestWorkflowResources(workflowEvents, "partialTaskPromotionPolicy");
  const partialTaskOutputs = latestWorkflowResources(workflowEvents, "partialTaskOutput");
  const exposureQuarantinePolicies = latestWorkflowResources(workflowEvents, "exposureQuarantinePolicy");
  const raterPositionClusterExposures = latestWorkflowResources(workflowEvents, "raterPositionClusterExposure");
  const spotCheckSamplingPolicies = latestWorkflowResources(workflowEvents, "spotCheckSamplingPolicy");
  const spotCheckQaItems = latestWorkflowResources(workflowEvents, "spotCheckQaItem");
  const ratingEffortQaReviews = latestWorkflowResources(workflowEvents, "ratingEffortQaReview");
  const adjudicationTriageQueueItems = latestWorkflowResources(workflowEvents, "adjudicationTriageQueueItem");
  const diagnosticDeferralVisibilityPolicies = latestWorkflowResources(workflowEvents, "diagnosticDeferralVisibilityPolicy");
  const diagnosticDeferralRecords = latestWorkflowResources(workflowEvents, "diagnosticDeferralRecord");
  const queuePolicySnapshots = latestWorkflowResources(workflowEvents, "queuePolicySnapshot");
  const assignmentSelectionAudits = latestWorkflowResources(workflowEvents, "assignmentSelectionAudit");
  const modelRunReproducibilityPolicies = latestWorkflowResources(workflowEvents, "modelRunReproducibilityPolicy");
  const modelInferenceConfigs = latestWorkflowResources(workflowEvents, "modelInferenceConfig");
  const modelRunEnvironments = latestWorkflowResources(workflowEvents, "modelRunEnvironment");
  const sourceFamilyClusteringPolicies = latestWorkflowResources(workflowEvents, "sourceFamilyClusteringPolicy");
  const raterItemConflicts = latestWorkflowResources(workflowEvents, "raterItemConflict");
  const raterTrainingExposurePolicies = latestWorkflowResources(workflowEvents, "raterTrainingExposurePolicy");
  const raterTrainingExposureSnapshots = latestWorkflowResources(workflowEvents, "raterTrainingExposureSnapshot");
  const releaseErratumDisclosurePolicies = latestWorkflowResources(workflowEvents, "releaseErratumDisclosurePolicy");
  const releaseErrata = latestWorkflowResources(workflowEvents, "releaseErratum");
  const scheduleRebaselinePolicies = latestWorkflowResources(workflowEvents, "scheduleRebaselinePolicy");
  const scheduleStatusSnapshots = latestWorkflowResources(workflowEvents, "scheduleStatusSnapshot");
  const publicExamplePracticeSessions = latestWorkflowResources(workflowEvents, "publicExamplePracticeSession");
  const practiceSandboxPolicies = latestWorkflowResources(workflowEvents, "practiceSandboxPolicy");
  const raterDashboardPolicies = latestWorkflowResources(workflowEvents, "raterDashboardPolicy");
  const raterLearningPlans = latestWorkflowResources(workflowEvents, "raterLearningPlan");
  const sessionPacingPolicies = latestWorkflowResources(workflowEvents, "sessionPacingPolicy");
  const raterSessions = latestWorkflowResources(workflowEvents, "raterSession");
  const assignmentSelfScreens = latestWorkflowResources(workflowEvents, "assignmentSelfScreen");
  const assignmentDeclines = latestWorkflowResources(workflowEvents, "assignmentDecline");
  const assignmentDeferrals = latestWorkflowResources(workflowEvents, "assignmentDeferral");
  const interpretationTargetMapRequirednessPolicies = latestWorkflowResources(workflowEvents, "interpretationTargetMapRequirednessPolicy");
  const interpretationTargetMaps = latestWorkflowResources(workflowEvents, "interpretationTargetMap");
  const verificationClaimGranularityPolicies = latestWorkflowResources(workflowEvents, "verificationClaimGranularityPolicy");
  const verificationWorkspaceSessions = latestWorkflowResources(workflowEvents, "verificationWorkspaceSession");
  const adjudicatorPreReadRequirednessPolicies = latestWorkflowResources(workflowEvents, "adjudicatorPreReadRequirednessPolicy");
  const adjudicatorPreReads = latestWorkflowResources(workflowEvents, "adjudicatorPreRead");
  const postLockDiscussionSessions = latestWorkflowResources(workflowEvents, "postLockDiscussionSession");
  const adjudicationCockpitSignoffPolicies = latestWorkflowResources(workflowEvents, "adjudicationCockpitSignoffPolicy");
  const adjudicationReviewSessions = latestWorkflowResources(workflowEvents, "adjudicationReviewSession");
  const calibrationFeedbackEvents = latestWorkflowResources(workflowEvents, "calibrationFeedbackEvent");
  const governanceApprovalRecords = latestWorkflowResources(workflowEvents, "governanceApprovalRecord");
  const protectedArtifactRevalidations = latestWorkflowResources(workflowEvents, "protectedArtifactRevalidation");
  const benchmarkSubmissionPolicies = latestWorkflowResources(workflowEvents, "benchmarkSubmissionPolicy");
  const benchmarkSubmissions = latestWorkflowResources(workflowEvents, "benchmarkSubmission");
  const screenFeatureParityChecks = latestWorkflowResources(workflowEvents, "screenFeatureParityCheck");
  const simplifiedCopyPreviews = latestWorkflowResources(workflowEvents, "simplifiedCopyPreview");
	  const rubricCopyTraceabilityMaps = latestWorkflowResources(workflowEvents, "rubricCopyTraceabilityMap");
	  const governedBundleCanonicalizationProfiles = latestWorkflowResources(workflowEvents, "governedBundleCanonicalizationProfile");
	  const governedBundleRecords = latestWorkflowResources(workflowEvents, "governedBundleRecord");
	  const governedBundleVerifications = latestWorkflowResources(workflowEvents, "governedBundleVerification");
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
  const cloudSecurityBudgetPolicies = latestWorkflowResources(workflowEvents, "cloudSecurityBudgetPolicy");
  const externalWormAuditLogPolicies = latestWorkflowResources(workflowEvents, "externalWormAuditLogPolicy");
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
    rightsClearancePolicies,
    releaseFreezes,
    certificationThresholdPolicies,
    certificationRecords,
    exposureLogs,
    revisionRecords,
    assignmentFlags,
    discussions,
    discussionThreads,
    discussionComments,
    discussionRevisionProposals,
    adjudications,
    adjudicationFinalizations,
    adjudicationMemos,
    verificationRecords,
    verificationEvidenceArtifacts,
    modelFamilyOverlapPolicies,
    ratingChecks,
    labelSnapshots,
    corpusManifests,
    trainingExports,
    exportManifests,
    itemTextNormalizationPolicies,
    itemTextVersions,
    modelPromptSiblingContextPolicies,
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
    modelImprovementPolicies,
    modelImprovementRuns,
    evaluationRuns,
    modelEvaluationPredictions,
    calibrationRuns,
    artifactProbeRuns,
    sanityBaselineRuns,
    humanCeilingRuns,
    benchmarkRefreshPolicies,
    validationTrancheEvidenceRecords,
    leaderboards,
    modelFailureAudits,
    goldItems,
    sourceAnchorExamples,
    benchmarkSplitMembers,
    rightsClearancePolicies,
    rightsRecords,
    releaseVersions,
    metricConfigs,
    derivedUtilityFormulas,
    releaseGateProfiles,
    primaryRaterAnchorPolicies,
    comparabilityTierPolicies,
    comparabilityClaims,
    activeLearningSelectionPolicies,
    trainingExportUncertaintyPolicies,
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
    scoreExplanationPolicies,
    ratingEscalationPolicies,
    disagreementThresholdPolicies,
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
    draftStoragePolicies,
    raterInstructionCompatibilityPolicies,
    raterInstructionRenderVersions,
    rubricLintConfigs,
    rubricLintEvents,
    itemIssueQuarantinePolicies,
    itemIssueReports,
    itemIssueActions,
    ratingDraftSessions,
    correctnessClaimWeightWorksheets,
    protectedArtifactRetentionRecords,
    scoreConfidenceScalePolicies,
    scoreConfidenceAnnotations,
    raterScoreConfidences,
    rationaleEvidenceSpanRequirednessPolicies,
    rationaleEvidenceSpans,
    samePositionScratchpads,
    samePositionBatchReviewRequirednessPolicies,
    samePositionBatchReviews,
    externalAssistanceContaminationPolicies,
    externalAssistanceDeclarations,
    sourceLeakageRedactionPolicies,
    blindingPreviewAudits,
    partialTaskPromotionPolicies,
    partialTaskOutputs,
    exposureQuarantinePolicies,
    raterPositionClusterExposures,
    spotCheckSamplingPolicies,
    spotCheckQaItems,
    ratingEffortQaReviews,
    adjudicationTriageQueueItems,
    diagnosticDeferralVisibilityPolicies,
    diagnosticDeferralRecords,
    queuePolicySnapshots,
    assignmentSelectionAudits,
    modelRunReproducibilityPolicies,
    modelInferenceConfigs,
    modelRunEnvironments,
    sourceFamilyClusteringPolicies,
    raterItemConflicts,
    raterTrainingExposurePolicies,
    raterTrainingExposureSnapshots,
    releaseErratumDisclosurePolicies,
    releaseErrata,
    scheduleRebaselinePolicies,
    scheduleStatusSnapshots,
    publicExamplePracticeSessions,
    practiceSandboxPolicies,
    raterDashboardPolicies,
    raterLearningPlans,
    sessionPacingPolicies,
    raterSessions,
    assignmentSelfScreens,
    assignmentDeclines,
    assignmentDeferrals,
    interpretationTargetMapRequirednessPolicies,
    interpretationTargetMaps,
    verificationClaimGranularityPolicies,
    verificationWorkspaceSessions,
    adjudicatorPreReadRequirednessPolicies,
    adjudicatorPreReads,
    postLockDiscussionSessions,
    adjudicationCockpitSignoffPolicies,
    adjudicationReviewSessions,
    calibrationFeedbackEvents,
    governanceApprovalRecords,
    protectedArtifactRevalidations,
    benchmarkSubmissionPolicies,
    benchmarkSubmissions,
    screenFeatureParityChecks,
    simplifiedCopyPreviews,
	    rubricCopyTraceabilityMaps,
	    governedBundleCanonicalizationProfiles,
	    governedBundleRecords,
	    governedBundleVerifications,
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
    cloudSecurityBudgetPolicies,
    externalWormAuditLogPolicies,
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
    certificationThresholdPolicies,
    certificationRecords,
    exposureLogs,
    revisionRecords,
    assignmentFlags,
    discussions,
    discussionThreads,
    discussionComments,
    discussionRevisionProposals,
    adjudications,
    adjudicationFinalizations,
    adjudicationMemos,
    verificationRecords,
    verificationEvidenceArtifacts,
    modelFamilyOverlapPolicies,
    ratingChecks,
    labelSnapshots,
    corpusManifests,
    trainingExports,
    exportManifests,
    itemTextNormalizationPolicies,
    itemTextVersions,
    modelPromptSiblingContextPolicies,
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
    modelImprovementPolicies,
    modelImprovementRuns,
    evaluationRuns,
    modelEvaluationPredictions,
    calibrationRuns,
    artifactProbeRuns,
    sanityBaselineRuns,
    humanCeilingRuns,
    benchmarkRefreshPolicies,
    validationTrancheEvidenceRecords,
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
    comparabilityTierPolicies,
    comparabilityClaims,
    activeLearningSelectionPolicies,
    trainingExportUncertaintyPolicies,
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
    scoreExplanationPolicies,
    ratingEscalationPolicies,
    disagreementThresholdPolicies,
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
    draftStoragePolicies,
    raterInstructionCompatibilityPolicies,
    raterInstructionRenderVersions,
    rubricLintConfigs,
    rubricLintEvents,
    itemIssueQuarantinePolicies,
    itemIssueReports,
    itemIssueActions,
    ratingDraftSessions,
    correctnessClaimWeightWorksheets,
    protectedArtifactRetentionRecords,
    scoreConfidenceScalePolicies,
    scoreConfidenceAnnotations,
    raterScoreConfidences,
    rationaleEvidenceSpanRequirednessPolicies,
    rationaleEvidenceSpans,
    samePositionScratchpads,
    samePositionBatchReviewRequirednessPolicies,
    samePositionBatchReviews,
    externalAssistanceContaminationPolicies,
    externalAssistanceDeclarations,
    sourceLeakageRedactionPolicies,
    blindingPreviewAudits,
    partialTaskPromotionPolicies,
    partialTaskOutputs,
    exposureQuarantinePolicies,
    raterPositionClusterExposures,
    spotCheckSamplingPolicies,
    spotCheckQaItems,
    ratingEffortQaReviews,
    adjudicationTriageQueueItems,
    diagnosticDeferralVisibilityPolicies,
    diagnosticDeferralRecords,
    queuePolicySnapshots,
    assignmentSelectionAudits,
    modelRunReproducibilityPolicies,
    modelInferenceConfigs,
    modelRunEnvironments,
    sourceFamilyClusteringPolicies,
    raterItemConflicts,
    raterTrainingExposurePolicies,
    raterTrainingExposureSnapshots,
    releaseErratumDisclosurePolicies,
    releaseErrata,
    scheduleRebaselinePolicies,
    scheduleStatusSnapshots,
      publicExamplePracticeSessions,
      practiceSandboxPolicies,
      raterDashboardPolicies,
      raterLearningPlans,
      sessionPacingPolicies,
      raterSessions,
    assignmentSelfScreens,
    assignmentDeclines,
    assignmentDeferrals,
    interpretationTargetMapRequirednessPolicies,
    interpretationTargetMaps,
    verificationClaimGranularityPolicies,
    verificationWorkspaceSessions,
    adjudicatorPreReadRequirednessPolicies,
    adjudicatorPreReads,
    postLockDiscussionSessions,
    adjudicationCockpitSignoffPolicies,
    adjudicationReviewSessions,
    calibrationFeedbackEvents,
    governanceApprovalRecords,
    protectedArtifactRevalidations,
    benchmarkSubmissionPolicies,
    benchmarkSubmissions,
    screenFeatureParityChecks,
    simplifiedCopyPreviews,
    rubricCopyTraceabilityMaps,
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
    cloudSecurityBudgetPolicies,
    externalWormAuditLogPolicies,
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
  const workflowEvents = await readPersistedWorkflowEvents(context.auditStore);
  const { positionList, critiqueList } = await buildCurrentCorpus(context);
  const workflowAssignments = latestWorkflowResources(workflowEvents, "assignment");
  const ratingContextSnapshotList = buildEffectiveRatingContextSnapshots(latestWorkflowResources(workflowEvents, "ratingContextSnapshot"));
  const workflowAssignmentIds = new Set(workflowAssignments.map((item) => item.id));
  const assignment = [
    ...workflowAssignments.filter(isIssuableBlindAssignment),
    ...assignments.filter((item) => !workflowAssignmentIds.has(item.id) && isIssuableBlindAssignment(item)),
  ].find((item) => actorCanReceiveAssignment(item, session.user));
  if (!assignment) {
    sendJson(response, 404, { error: "no_blind_initial_assignment_available" });
    return;
  }
  const position = positionList.find((item) => item.id === assignment.positionId);
  const critique = critiqueList.find((item) => item.id === assignment.critiqueId);
  if (!position || !critique) {
    sendJson(response, 409, {
      error: "assignment_reference_missing",
      detail: `assignment ${assignment.id} references missing position or critique`,
    });
    return;
  }
  const contextSnapshot = ratingContextSnapshotList.find((snapshot) => snapshot.id === assignment.ratingContextSnapshotId) ??
    ratingContextSnapshotList.find((snapshot) => snapshot.positionId === assignment.positionId && snapshot.visibleCritiqueIds.includes(assignment.critiqueId));
  if (assignment.ratingContextSnapshotId && !contextSnapshot) {
    sendJson(response, 409, {
      error: "assignment_rating_context_missing",
      detail: `assignment ${assignment.id} references missing ratingContextSnapshotId ${assignment.ratingContextSnapshotId}`,
    });
    return;
  }
  const visibleView = createBlindRatingView(assignment, positionList, critiqueList);
  const assignmentIssueRoles = ["rater", "graduate", "phd", "expert", "admin"];
  const policyGate = await appendWorkflowPolicyDecisionGate(
    context,
    request,
    session.user,
    {
      id: `assignment-issue-${assignment.id}-${session.user.id}`,
      assignmentId: assignment.id,
      positionId: assignment.positionId,
      critiqueId: assignment.critiqueId,
      ratingContextSnapshotId: contextSnapshot?.id ?? assignment.ratingContextSnapshotId ?? null,
      outputSchemaVersion: "assignment-issue-output-lmca-v1",
    },
    {
      eventType: "assignment_issue",
      resourceKey: "assignmentIssue",
      route: "/api/v1/assignments/next",
      roles: assignmentIssueRoles,
      policyActionKind: "assignment_issue",
      phaseGateLaneKind: "queue",
    },
  );
  if (!policyGate.ok) {
    sendJson(response, policyGate.statusCode ?? 409, { error: policyGate.error, detail: policyGate.detail, ...(policyGate.extra ?? {}) });
    return;
  }
  sendJson(response, 200, {
    assignment: {
      id: assignment.id,
      positionId: assignment.positionId,
      critiqueId: assignment.critiqueId,
      positionTextVersionId: position?.textVersions.at(-1)?.id ?? null,
      critiqueTextVersionId: critique?.textVersions.at(-1)?.id ?? null,
      ratingContextSnapshotId: contextSnapshot?.id ?? assignment.ratingContextSnapshotId ?? null,
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
        workflowProfileId: assignment.workflowProfileId ?? "ordinary-live-rating-profile",
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
      policyActionKind: policyGate.actionKind,
      policyDecisionId: policyGate.decision.id,
      policyDecisionConsumptionId: policyGate.consumption.id,
      policyDecisionIdempotencyKey: policyGate.decision.idempotencyKey,
      sanitized: true,
    },
    actor: {
      id: session.user.id,
      role: session.user.role,
    },
    policyActionKind: policyGate.actionKind,
    policyDecisionId: policyGate.decision.id,
    policyDecisionConsumptionId: policyGate.consumption.id,
  });
}

function isIssuableBlindAssignment(assignment) {
  const blindState = assignment.blindState ?? assignment.exposure;
  if (blindState !== "blind_initial") return false;
  if (assignment.declineOrReassignmentStatus && assignment.declineOrReassignmentStatus !== "not_declined") return false;
  if (assignment.independentBlindEligibilityStatus && assignment.independentBlindEligibilityStatus !== "eligible") return false;
  if (assignment.draftDependencyStaleStatus && assignment.draftDependencyStaleStatus !== "current") return false;
  if (assignment.submittedAt) return false;
  return true;
}

function actorCanReceiveAssignment(assignment, actor) {
  if (actor.allowedAssignmentIds?.includes("*") || actor.allowedAssignmentIds?.includes(assignment.id)) return true;
  const assignedRaterId = assignment.raterId ?? assignment.assignedTo ?? assignment.assigned_to ?? null;
  return Boolean(assignedRaterId && assignedRaterId === actor.id);
}

async function actorCanAccessAssignmentId(context, assignmentId, actor) {
  if (actor.allowedAssignmentIds?.includes("*") || actor.allowedAssignmentIds?.includes(assignmentId)) return true;
  const assignment = await workflowResourceById(context, "assignment", assignmentId);
  return Boolean(assignment && actorCanReceiveAssignment(assignment, actor));
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
  const ratingValidationContext = await buildRatingValidationContext(context);
  const validation = validateRatingPayload(rating, eventType, ratingValidationContext);
  if (!validation.ok) {
    sendJson(response, 400, { error: "invalid_rating_payload", detail: validation.detail });
    return;
  }
  const actorValidation = validateRatingActor(rating, actor, ratingValidationContext);
  if (!actorValidation.ok) {
    sendJson(response, 403, { error: "rating_actor_not_authorized", detail: actorValidation.detail });
    return;
  }

  const policyGate = await appendRatingPolicyDecisionGate(context, request, actor, rating, eventType);
  if (!policyGate.ok) {
    sendJson(response, policyGate.statusCode ?? 409, {
      error: policyGate.error ?? "policy_decision_gate_failed",
      detail: policyGate.detail,
      ...(policyGate.extra ?? {}),
    });
    return;
  }
  const governedRating = {
    ...rating,
    policyActionKind: policyGate.actionKind,
    policyDecisionId: policyGate.decision.id,
    policyDecisionConsumptionId: policyGate.consumption.id,
    policyDecisionIdempotencyKey: policyGate.decision.idempotencyKey,
  };
  const event = createAuditEvent(eventType, actor, governedRating, request);
  await context.auditStore.appendRatingEvent(event);
  sendJson(response, 201, {
    ok: true,
    eventId: event.id,
    ratingId: governedRating.id,
    policyDecisionId: policyGate.decision.id,
    policyDecisionConsumptionId: policyGate.consumption.id,
    payloadHash: event.payloadHash,
    accessAudit: event.accessAudit,
  });
}

async function buildRatingValidationContext(context) {
  const workflowEvents = await readPersistedWorkflowEvents(context.auditStore);
  const { positionList, critiqueList } = await buildCurrentCorpus(context);
  const workflowAssignments = latestWorkflowResources(workflowEvents, "assignment");
  const ratingContextSnapshotArtifacts = latestWorkflowResources(workflowEvents, "ratingContextSnapshot");
  const scoreExplanationPolicyArtifacts = latestWorkflowResources(workflowEvents, "scoreExplanationPolicy");
  return {
    assignments: [...assignments, ...workflowAssignments],
    positions: positionList,
    critiques: critiqueList,
    ratingContextSnapshots: buildEffectiveRatingContextSnapshots(ratingContextSnapshotArtifacts),
    allowedScoreExplanationPolicyIds: new Set([
      `score-explanation-policy-${releaseId}`,
      ...scoreExplanationPolicyArtifacts.map((policy) => policy.id).filter(Boolean),
    ]),
  };
}

async function appendWorkflowPolicyDecisionGate(context, request, actor, resource, spec, params = {}) {
  const laneKind = workflowSpecPhaseGateLaneKind(spec);
  const phaseGate = await resolveImplementationPhaseGate(context, laneKind, actor);
  if (!phaseGate.ok) {
    return {
      ok: false,
      statusCode: 409,
      error: "implementation_phase_lane_unavailable",
      detail: phaseGate.detail,
      extra: {
        laneKind,
        phaseState: phaseGate.phaseState ?? null,
        activeBundleId: phaseGate.bundle?.id ?? null,
      },
    };
  }
  const actionKind = resolveWorkflowPolicyActionKind(spec, resource);
  const decidedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const idempotencyKey = `${actionKind}:${spec.eventType}:${resource.id}:${params.id ?? "root"}`;
  const outputSchemaVersion = `lmca-${actionKind.replace(/_/g, "-")}-workflow-v1`;
  const phaseGateBundleId = phaseGate.bundle?.id ?? `implementation-phase-gate-bundle-${releaseId}`;
  const decision = {
    id: `policy-decision-${actionKind}-${randomUUID()}`,
    actionKindId: `policy-action-kind-${releaseId}-${actionKind}`,
    actionKind,
    decisionStatus: "allow",
    actorId: actor.id,
    actorRole: actor.role,
    manifestId: phaseGate.bundle?.manifestId ?? `release-config-manifest-${releaseId}`,
    manifestHash: phaseGate.bundle?.manifestHash ?? phaseGate.bundle?.canonicalManifestHash ?? `sha256:manifest-${releaseId}`,
    phaseGateBundleId,
    phaseGateBundleHash:
      phaseGate.bundle?.phaseGateBundleHash ?? phaseGate.bundle?.canonicalBundleHash ?? phaseGate.bundle?.bundleHash ?? `sha256:${sha256(phaseGateBundleId)}`,
    releaseId,
    outputSchemaVersion,
    outputSchemaHash: `sha256:${sha256(outputSchemaVersion)}`,
    targetArtifactIds: workflowPolicyGateTargetArtifactIds(resource, params),
    idempotencyKey,
    singleUse: spec.policyDecisionSingleUse !== false,
    replayStatus: "unused",
    manifestBindingStatus: "matched",
    outputSchemaBindingStatus: "matched",
    phaseGateBindingStatus: "matched",
    idempotencyBindingStatus: "matched",
    expiresAt,
    decidedAt,
  };
  const decisionValidation = validateWorkflowPayload(decision, actor, {
    resourceKey: "policyDecisionRecord",
    requiredFields: [
      "id",
      "actionKindId",
      "actionKind",
      "decisionStatus",
      "actorId",
      "manifestId",
      "manifestHash",
      "phaseGateBundleId",
      "phaseGateBundleHash",
      "releaseId",
      "outputSchemaVersion",
      "outputSchemaHash",
      "expiresAt",
      "decidedAt",
      "replayStatus",
      "manifestBindingStatus",
      "outputSchemaBindingStatus",
      "phaseGateBindingStatus",
      "idempotencyBindingStatus",
    ],
    requiredAnyFields: [["idempotencyKey", "singleUse"]],
    requiredNonEmptyArrayFields: ["targetArtifactIds"],
    allowedValues: { actionKind: policyActionKinds },
    requiredStringPrefixes: { manifestHash: "sha256:", phaseGateBundleHash: "sha256:", outputSchemaHash: "sha256:" },
    requiredExactFields: {
      decisionStatus: "allow",
      replayStatus: "unused",
      manifestBindingStatus: "matched",
      outputSchemaBindingStatus: "matched",
      phaseGateBindingStatus: "matched",
      idempotencyBindingStatus: "matched",
    },
    allowHiddenMetadata: true,
  });
  if (!decisionValidation.ok) {
    return { ok: false, statusCode: decisionValidation.statusCode ?? 409, error: "invalid_workflow_policy_decision", detail: decisionValidation.detail };
  }
  const consumption = {
    id: `policy-decision-consumption-${actionKind}-${randomUUID()}`,
    decisionId: decision.id,
    actionKind,
    manifestId: decision.manifestId,
    manifestHash: decision.manifestHash,
    phaseGateBundleId: decision.phaseGateBundleId,
    phaseGateBundleHash: decision.phaseGateBundleHash,
    outputSchemaVersion: decision.outputSchemaVersion,
    outputSchemaHash: decision.outputSchemaHash,
    idempotencyKey,
    replayRejected: false,
    scopeMatched: true,
    consumedAt: decidedAt,
  };
  const consumptionValidation = validateWorkflowPayload(consumption, actor, {
    resourceKey: "policyDecisionConsumption",
    requiredFields: [
      "id",
      "decisionId",
      "actionKind",
      "manifestId",
      "manifestHash",
      "phaseGateBundleId",
      "phaseGateBundleHash",
      "outputSchemaVersion",
      "outputSchemaHash",
      "idempotencyKey",
      "consumedAt",
    ],
    requiredStringPrefixes: { manifestHash: "sha256:", phaseGateBundleHash: "sha256:", outputSchemaHash: "sha256:" },
    requiredExactFields: { replayRejected: false, scopeMatched: true },
    allowHiddenMetadata: true,
  });
  if (!consumptionValidation.ok) {
    return {
      ok: false,
      statusCode: consumptionValidation.statusCode ?? 409,
      error: "invalid_workflow_policy_decision_consumption",
      detail: consumptionValidation.detail,
    };
  }
  const eventOptions = {
    route: `internal:${spec.route}/policy-decision-gate`,
    params,
    requiredRoles: spec.roles,
  };
  const decisionEvent = createWorkflowAuditEvent("policy_decision_submitted", actor, "policyDecisionRecord", decisionValidation.resource, request, eventOptions);
  const consumptionEvent = createWorkflowAuditEvent(
    "policy_decision_consumed",
    actor,
    "policyDecisionConsumption",
    consumptionValidation.resource,
    request,
    eventOptions,
  );
  await context.auditStore.appendWorkflowEvent(decisionEvent);
  await context.auditStore.appendWorkflowEvent(consumptionEvent);
  return {
    ok: true,
    actionKind,
    decision: decisionValidation.resource,
    consumption: consumptionValidation.resource,
    eventIds: [decisionEvent.id, consumptionEvent.id],
  };
}

async function resolveImplementationPhaseGate(context, laneKind, actor = null) {
  if (!laneKind) return { ok: true, bundle: null, lane: null, phaseState: "enabled" };
  const bundles = await workflowResourcesByField(context, "implementationPhaseGateBundle", "releaseId", releaseId);
  const bundle = bundles.at(-1) ?? null;
  if (!bundle) return { ok: true, bundle: null, lane: null, phaseState: "enabled" };
  const lane = (bundle.laneStates ?? []).find((item) => item?.laneKind === laneKind) ?? null;
  if (!lane) {
    return { ok: false, bundle, lane: null, phaseState: bundle.futurePhaseDefault ?? "blocked", detail: `missing implementation phase lane ${laneKind}` };
  }
  if (lane.failClosed !== true) {
    return { ok: false, bundle, lane, phaseState: lane.phaseState ?? null, detail: `${laneKind} lane is not fail-closed` };
  }
  if (!phaseGateSideEffectEnabledStates.has(lane.phaseState)) {
    const disabledSafe =
      lane.noSideEffectsWhenDisabled === true &&
      lane.labelsExposedWhenDisabled === false &&
      lane.supportsReleaseClaimsWhenDisabled === false;
    return {
      ok: false,
      bundle,
      lane,
      phaseState: lane.phaseState ?? null,
      detail: disabledSafe ? `${laneKind} lane is ${lane.phaseState}` : `${laneKind} lane disabled state is not safe`,
    };
  }
  if (lane.phaseState === "staff_only" && !phaseGateStaffRoles.includes(actor?.role)) {
    return {
      ok: false,
      bundle,
      lane,
      phaseState: lane.phaseState,
      detail: `${laneKind} lane is staff_only`,
    };
  }
  return { ok: true, bundle, lane, phaseState: lane.phaseState };
}

function workflowPolicyGateTargetArtifactIds(resource, params = {}) {
  return [
    resource.id,
    params.id,
    resource.targetArtifactId,
    resource.assignmentId,
    resource.itemId,
    ...(Array.isArray(resource.affectedArtifactIds) ? resource.affectedArtifactIds : []),
    resource.positionId && resource.critiqueId ? `${resource.positionId}::${resource.critiqueId}` : null,
    resource.discussionThreadId,
    resource.adjudicationId,
    resource.memoId,
  ].filter((value, index, values) => typeof value === "string" && value.trim() && values.indexOf(value) === index);
}

function resolveWorkflowPolicyActionKind(spec, resource) {
  if (!spec.policyActionKindField) return spec.policyActionKind;
  const resourceValue = resource?.[spec.policyActionKindField];
  return spec.policyActionKindMap?.[resourceValue] ?? spec.policyActionKind;
}

async function validateWorkflowResourceBindings(context, resource, spec) {
  if (spec.validateSensitiveAuditChainBindings) {
    return validateSensitiveAuditChainEventBindings(context, resource);
  }
  if (spec.resourceKey === "comparabilityClaim") {
    return validateComparabilityClaimBindings(context, resource);
  }
  return { ok: true };
}

async function validateComparabilityClaimBindings(context, claim) {
  const workflowEvents = await readPersistedWorkflowEvents(context.auditStore);
  const gateProfiles = latestWorkflowResources(workflowEvents, "releaseGateProfile");
  const primaryRaterPolicies = latestWorkflowResources(workflowEvents, "primaryRaterAnchorPolicy");
  const comparabilityTierPolicies = latestWorkflowResources(workflowEvents, "comparabilityTierPolicy");
  const claimReleaseId = claim.releaseId ?? releaseId;
  const failures = [];

  const defaultGateProfileId = `gate-${claimReleaseId}`;
  const linkedGateProfile =
    claim.releaseGateProfileId === defaultGateProfileId
      ? { id: defaultGateProfileId, releaseId: claimReleaseId, frozenAt: "2026-09-30T12:00:00.000Z", profileSource: "default_project_gate_catalog" }
      : gateProfiles.find((profile) => profile.id === claim.releaseGateProfileId) ?? null;
  if (!linkedGateProfile) {
    failures.push("releaseGateProfileId:not_found");
  } else {
    if (linkedGateProfile.releaseId && linkedGateProfile.releaseId !== claimReleaseId) {
      failures.push("releaseGateProfileId:release_mismatch");
    }
    if (claim.timestamp && linkedGateProfile.frozenAt && Date.parse(linkedGateProfile.frozenAt) > Date.parse(claim.timestamp)) {
      failures.push("releaseGateProfileId:not_frozen_before_claim");
    }
  }

  const defaultPrimaryRaterPolicyId = `primary-rater-anchor-policy-${claimReleaseId}`;
  const linkedPrimaryPolicy =
    claim.primaryRaterAnchorPolicyId === defaultPrimaryRaterPolicyId
      ? { id: defaultPrimaryRaterPolicyId, releaseId: claimReleaseId, policySource: "default_project_anchor_policy" }
      : primaryRaterPolicies.find((policy) => policy.id === claim.primaryRaterAnchorPolicyId) ?? null;
  if (!linkedPrimaryPolicy) {
    failures.push("primaryRaterAnchorPolicyId:not_found");
  } else if (linkedPrimaryPolicy.releaseId && linkedPrimaryPolicy.releaseId !== claimReleaseId) {
    failures.push("primaryRaterAnchorPolicyId:release_mismatch");
  }

  if (Array.isArray(claim.linkedReleaseIds) && !claim.linkedReleaseIds.includes(claimReleaseId)) {
    failures.push("linkedReleaseIds:releaseId_missing");
  }

  const defaultComparabilityTierPolicyId = `comparability-tier-policy-${claimReleaseId}`;
  const linkedComparabilityTierPolicy =
    claim.comparabilityTierPolicyId === defaultComparabilityTierPolicyId
      ? { id: defaultComparabilityTierPolicyId, releaseId: claimReleaseId, policySource: "default_project_comparability_tier_policy" }
      : comparabilityTierPolicies.find((policy) => policy.id === claim.comparabilityTierPolicyId) ?? null;
  if (!linkedComparabilityTierPolicy) {
    failures.push("comparabilityTierPolicyId:not_found");
  } else if (linkedComparabilityTierPolicy.releaseId && linkedComparabilityTierPolicy.releaseId !== claimReleaseId) {
    failures.push("comparabilityTierPolicyId:release_mismatch");
  }

  if (failures.length) {
    return {
      ok: false,
      statusCode: 409,
      error: "comparability_claim_binding_failed",
      detail: failures.join(", "),
      extra: { bindingFailures: failures },
    };
  }
  return { ok: true };
}

async function validateSensitiveAuditChainEventBindings(context, event) {
  const failures = [];
  const expectedPolicyActionKind = auditChainPolicyActionKindByEventKind[event.eventKind];
  if (!expectedPolicyActionKind) failures.push("eventKind");

  const decision = await workflowResourceById(context, "policyDecisionRecord", event.policyDecisionId);
  if (!decision) {
    failures.push("policyDecisionId:not_found");
  } else {
    if (decision.actionKind !== expectedPolicyActionKind) failures.push("policyDecisionId:actionKind");
    if (decision.decisionStatus !== "allow") failures.push("policyDecisionId:decisionStatus");
    if (decision.manifestBindingStatus !== "matched") failures.push("policyDecisionId:manifestBindingStatus");
    if (decision.outputSchemaBindingStatus !== "matched") failures.push("policyDecisionId:outputSchemaBindingStatus");
    if (decision.phaseGateBindingStatus !== "matched") failures.push("policyDecisionId:phaseGateBindingStatus");
    if (decision.idempotencyBindingStatus !== "matched") failures.push("policyDecisionId:idempotencyBindingStatus");
  }

  const governanceApproval = await workflowResourceById(context, "governanceApprovalRecord", event.governanceApprovalRecordId);
  if (!governanceApproval) {
    failures.push("governanceApprovalRecordId:not_found");
  } else {
    if (governanceApproval.actionKind !== expectedPolicyActionKind) failures.push("governanceApprovalRecordId:actionKind");
    if (governanceApproval.independenceSeparationOfDutiesStatus !== "independent_two_person_approval") {
      failures.push("governanceApprovalRecordId:independenceSeparationOfDutiesStatus");
    }
    const approvedArtifactIds = new Set(Array.isArray(governanceApproval.affectedArtifactIds) ? governanceApproval.affectedArtifactIds : []);
    const uncoveredArtifactIds = (Array.isArray(event.affectedArtifactIds) ? event.affectedArtifactIds : []).filter((id) => !approvedArtifactIds.has(id));
    if (uncoveredArtifactIds.length) failures.push("governanceApprovalRecordId:affectedArtifactIds");
  }

  const externalWormAuditLogPolicy = await workflowResourceById(context, "externalWormAuditLogPolicy", event.externalWormAuditLogPolicyId);
  if (!externalWormAuditLogPolicy) {
    failures.push("externalWormAuditLogPolicyId:not_found");
  } else {
    if (externalWormAuditLogPolicy.policyVersion !== externalWormAuditLogPolicyVersion) failures.push("externalWormAuditLogPolicyId:policyVersion");
    if (externalWormAuditLogPolicy.ledgerBackend !== externalWormAuditLedgerBackend) failures.push("externalWormAuditLogPolicyId:ledgerBackend");
    if (!String(event.externalWormLedgerPointer ?? "").startsWith(externalWormAuditLogPolicy.ledgerPointerPrefix ?? externalWormAuditPointerPrefix)) {
      failures.push("externalWormLedgerPointer");
    }
    if (!String(event.externalWormReceiptHash ?? "").startsWith(`${externalWormAuditLogPolicy.receiptHashAlgorithm ?? externalWormAuditReceiptHashAlgorithm}:`)) {
      failures.push("externalWormReceiptHash");
    }
  }

  if (failures.length) {
    return {
      ok: false,
      statusCode: 409,
      error: "sensitive_audit_chain_binding_failed",
      detail: failures.join(", "),
      extra: { bindingFailures: failures },
    };
  }
  return { ok: true };
}

async function appendRatingPolicyDecisionGate(context, request, actor, rating, eventType) {
  const actionKind = eventType === "revision_submitted" ? "revision_submit" : "rating_lock";
  const phaseGate = await resolveImplementationPhaseGate(context, "route", actor);
  if (!phaseGate.ok) {
    return {
      ok: false,
      statusCode: 409,
      error: "implementation_phase_lane_unavailable",
      detail: phaseGate.detail,
      extra: {
        laneKind: "route",
        phaseState: phaseGate.phaseState ?? null,
        activeBundleId: phaseGate.bundle?.id ?? null,
      },
    };
  }
  const decidedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const idempotencyKey = `${actionKind}:${rating.id}:${rating.assignmentId}:${rating.kind}`;
  const outputSchemaVersion = actionKind === "revision_submit" ? "lmca-rating-revision-submit-v1" : "lmca-rating-lock-v1";
  const phaseGateBundleId = phaseGate.bundle?.id ?? `implementation-phase-gate-bundle-${releaseId}`;
  const decision = {
    id: `policy-decision-${actionKind}-${randomUUID()}`,
    actionKindId: `policy-action-kind-${releaseId}-${actionKind}`,
    actionKind,
    decisionStatus: "allow",
    actorId: actor.id,
    actorRole: actor.role,
    manifestId: phaseGate.bundle?.manifestId ?? `release-config-manifest-${releaseId}`,
    manifestHash: phaseGate.bundle?.manifestHash ?? phaseGate.bundle?.canonicalManifestHash ?? `sha256:manifest-${releaseId}`,
    phaseGateBundleId,
    phaseGateBundleHash:
      phaseGate.bundle?.phaseGateBundleHash ?? phaseGate.bundle?.canonicalBundleHash ?? phaseGate.bundle?.bundleHash ?? `sha256:${sha256(phaseGateBundleId)}`,
    releaseId,
    outputSchemaVersion,
    outputSchemaHash: `sha256:${sha256(outputSchemaVersion)}`,
    targetArtifactIds: [rating.id, rating.assignmentId, `${rating.positionId}::${rating.critiqueId}`],
    idempotencyKey,
    singleUse: true,
    replayStatus: "unused",
    manifestBindingStatus: "matched",
    outputSchemaBindingStatus: "matched",
    phaseGateBindingStatus: "matched",
    idempotencyBindingStatus: "matched",
    expiresAt,
    decidedAt,
  };
  const decisionValidation = validateWorkflowPayload(decision, actor, {
    resourceKey: "policyDecisionRecord",
    requiredFields: [
      "id",
      "actionKindId",
      "actionKind",
      "decisionStatus",
      "actorId",
      "manifestId",
      "manifestHash",
      "phaseGateBundleId",
      "phaseGateBundleHash",
      "releaseId",
      "outputSchemaVersion",
      "outputSchemaHash",
      "expiresAt",
      "decidedAt",
      "replayStatus",
      "manifestBindingStatus",
      "outputSchemaBindingStatus",
      "phaseGateBindingStatus",
      "idempotencyBindingStatus",
    ],
    requiredAnyFields: [["idempotencyKey", "singleUse"]],
    requiredNonEmptyArrayFields: ["targetArtifactIds"],
    allowedValues: { actionKind: policyActionKinds },
    requiredStringPrefixes: { manifestHash: "sha256:", phaseGateBundleHash: "sha256:", outputSchemaHash: "sha256:" },
    requiredExactFields: {
      decisionStatus: "allow",
      replayStatus: "unused",
      manifestBindingStatus: "matched",
      outputSchemaBindingStatus: "matched",
      phaseGateBindingStatus: "matched",
      idempotencyBindingStatus: "matched",
    },
    allowHiddenMetadata: true,
  });
  if (!decisionValidation.ok) {
    return { ok: false, statusCode: decisionValidation.statusCode ?? 409, error: "invalid_rating_policy_decision", detail: decisionValidation.detail };
  }
  const consumption = {
    id: `policy-decision-consumption-${actionKind}-${randomUUID()}`,
    decisionId: decision.id,
    actionKind,
    manifestId: decision.manifestId,
    manifestHash: decision.manifestHash,
    phaseGateBundleId: decision.phaseGateBundleId,
    phaseGateBundleHash: decision.phaseGateBundleHash,
    outputSchemaVersion: decision.outputSchemaVersion,
    outputSchemaHash: decision.outputSchemaHash,
    idempotencyKey,
    replayRejected: false,
    scopeMatched: true,
    consumedAt: decidedAt,
  };
  const consumptionValidation = validateWorkflowPayload(consumption, actor, {
    resourceKey: "policyDecisionConsumption",
    requiredFields: [
      "id",
      "decisionId",
      "actionKind",
      "manifestId",
      "manifestHash",
      "phaseGateBundleId",
      "phaseGateBundleHash",
      "outputSchemaVersion",
      "outputSchemaHash",
      "idempotencyKey",
      "consumedAt",
    ],
    requiredStringPrefixes: { manifestHash: "sha256:", phaseGateBundleHash: "sha256:", outputSchemaHash: "sha256:" },
    requiredExactFields: { replayRejected: false, scopeMatched: true },
    allowHiddenMetadata: true,
  });
  if (!consumptionValidation.ok) {
    return { ok: false, statusCode: consumptionValidation.statusCode ?? 409, error: "invalid_rating_policy_decision_consumption", detail: consumptionValidation.detail };
  }
  const decisionEvent = createWorkflowAuditEvent("policy_decision_submitted", actor, "policyDecisionRecord", decisionValidation.resource, request, {
    route: "internal:/api/ratings/policy-decision-gate",
    requiredRoles: ratingWorkflowRoles,
  });
  const consumptionEvent = createWorkflowAuditEvent("policy_decision_consumed", actor, "policyDecisionConsumption", consumptionValidation.resource, request, {
    route: "internal:/api/ratings/policy-decision-gate",
    requiredRoles: ratingWorkflowRoles,
  });
  await context.auditStore.appendWorkflowEvent(decisionEvent);
  await context.auditStore.appendWorkflowEvent(consumptionEvent);
  return {
    ok: true,
    actionKind,
    decision: decisionValidation.resource,
    consumption: consumptionValidation.resource,
    eventIds: [decisionEvent.id, consumptionEvent.id],
  };
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
  const actorValidation = validateSourceStyleAuditActor(audit, actor, {
    workflowAssignments: latestWorkflowResources(await readPersistedWorkflowEvents(context.auditStore), "assignment"),
  });
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

export function validateRatingPayload(rating, eventType, validationContext = {}) {
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
    "scoreConfidenceJudgment",
    "scoreExplanationPolicyId",
    "scoreExplanationTriggers",
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
  const assignmentList = validationContext.assignments ?? assignments;
  const positionList = validationContext.positions ?? positions;
  const critiqueList = validationContext.critiques ?? critiques;
  const contextSnapshotList = validationContext.ratingContextSnapshots ?? ratingContextSnapshots;
  const assignment = assignmentList.find((item) => item.id === rating.assignmentId);
  if (!assignment) return invalid(`unknown assignmentId: ${rating.assignmentId}`);
  if (!positionList.some((position) => position.id === rating.positionId)) return invalid(`unknown positionId: ${rating.positionId}`);
  if (!critiqueList.some((critique) => critique.id === rating.critiqueId && critique.positionId === rating.positionId)) {
    return invalid(`critiqueId ${rating.critiqueId} does not belong to positionId ${rating.positionId}`);
  }
  const contextSnapshot = contextSnapshotList.find((snapshot) => snapshot.id === rating.ratingContextSnapshotId);
  if (!contextSnapshot) return invalid(`unknown ratingContextSnapshotId: ${rating.ratingContextSnapshotId}`);
  if (contextSnapshot.positionId !== rating.positionId) return invalid("ratingContextSnapshotId must belong to the rated position");
  if (!contextSnapshot.visibleCritiqueIds.includes(rating.critiqueId)) return invalid("ratingContextSnapshotId must include the rated critique");
  if ((assignment.positionId ?? rating.positionId) !== rating.positionId) return invalid("assignmentId must belong to the rated position");
  if ((assignment.critiqueId ?? rating.critiqueId) !== rating.critiqueId) return invalid("assignmentId must belong to the rated critique");
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
  if (!ratingConfidenceJudgmentValues.has(rating.scoreConfidenceJudgment)) {
    return invalid("scoreConfidenceJudgment must be one of: low, medium, high");
  }
  if (!String(rating.scoreExplanationPolicyId ?? "").trim()) return invalid("scoreExplanationPolicyId is required");
  if (
    validationContext.allowedScoreExplanationPolicyIds instanceof Set &&
    !validationContext.allowedScoreExplanationPolicyIds.has(rating.scoreExplanationPolicyId)
  ) {
    return invalid(`unknown scoreExplanationPolicyId: ${rating.scoreExplanationPolicyId}`);
  }
  if (!Array.isArray(rating.scoreExplanationTriggers)) return invalid("scoreExplanationTriggers must be an array");
  const unsupportedExplanationTriggers = rating.scoreExplanationTriggers.filter((trigger) => !allowedScoreExplanationTriggers.has(trigger));
  if (unsupportedExplanationTriggers.length) return invalid(`unsupported scoreExplanationTriggers: ${unsupportedExplanationTriggers.join(", ")}`);
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
  const obfuscationNote = ratingObfuscationNoteForRating(rating);
  if (obfuscationNote !== "" && typeof obfuscationNote !== "string") return invalid("obfuscationNote must be a short string when provided");
  if (rating.flags?.obfuscatedArgumentRisk === true) {
    const obfuscationNoteValidation = validateRatingObfuscationNote(obfuscationNote);
    if (!obfuscationNoteValidation.ok) return invalid(obfuscationNoteValidation.detail);
  } else if (typeof obfuscationNote === "string" && obfuscationNote.trim()) {
    return invalid("obfuscationNote is only allowed when obfuscatedArgumentRisk is flagged");
  }
  const expectedExplanationTriggers = scoreExplanationTriggersForRating({
    scores: rating.scores,
    flags: rating.flags ?? {},
    assignment,
    kind: rating.kind,
    workflowProfileId: rating.workflowProfileId,
    revisionReasonCode: rating.revisionReasonCode,
  });
  const missingExplanationTriggers = expectedExplanationTriggers.filter((trigger) => !rating.scoreExplanationTriggers.includes(trigger));
  if (missingExplanationTriggers.length) return invalid(`missing scoreExplanationTriggers: ${missingExplanationTriggers.join(", ")}`);
  const unexpectedExplanationTriggers = rating.scoreExplanationTriggers.filter((trigger) => !expectedExplanationTriggers.includes(trigger));
  if (unexpectedExplanationTriggers.length) return invalid(`unexpected scoreExplanationTriggers: ${unexpectedExplanationTriggers.join(", ")}`);
  const explanationRequired = expectedExplanationTriggers.length > 0;
  if (rating.generalRatingNote !== undefined && (typeof rating.generalRatingNote !== "string" || rating.generalRatingNote.length > 1000)) {
    return invalid("generalRatingNote must be a short string when provided");
  }
  if (rating.scoreExplanation !== undefined && (typeof rating.scoreExplanation !== "string" || rating.scoreExplanation.length > 1200)) {
    return invalid("scoreExplanation must be a short string when provided");
  }
  if (explanationRequired) {
    if (rating.scoreExplanationRequired !== true) return invalid("scoreExplanationRequired must be true when ScoreExplanationPolicy triggers");
    if (rating.scoreExplanationPromptVisibility !== "label_source_protected_status_blind") {
      return invalid("scoreExplanationPromptVisibility must preserve label/source/protected-status blinding");
    }
    const triggeredExplanationValidation = validateTriggeredScoreExplanation(rating.scoreExplanation);
    if (!triggeredExplanationValidation.ok) return invalid(triggeredExplanationValidation.detail);
  } else if (rating.scoreExplanationRequired === true) {
    return invalid("scoreExplanationRequired cannot be true without ScoreExplanationPolicy triggers");
  } else if (typeof rating.scoreExplanation === "string" && rating.scoreExplanation.trim()) {
    return invalid("scoreExplanation is only allowed when ScoreExplanationPolicy triggers; use generalRatingNote for optional ordinary notes");
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

export function validateWorkflowStateTransitionPayload(transition, actor, validationContext = {}) {
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
    const workflowAssignment = (validationContext.workflowAssignments ?? []).find((assignment) => assignment.id === assignmentId);
    const actorAssignedByWorkflow = Boolean(workflowAssignment && actorCanReceiveAssignment(workflowAssignment, actor));
    if (assignmentId && !actor.allowedAssignmentIds?.includes("*") && !actor.allowedAssignmentIds?.includes(assignmentId) && !actorAssignedByWorkflow) {
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
    ["identifiableAccessRestriction", consent.identifiableAccessRestriction],
  ].filter(([, value]) => value === undefined || value === null || value === "");
  if (missing.length) return invalid(`missing required fields: ${missing.map(([field]) => field).join(", ")}`);
  const actorCheck = validateParticipantRaterId(raterId, actor);
  if (!actorCheck.ok) return actorCheck;
  if (findHiddenKeys(consent).length || findRawBenchmarkContentKeys(consent).length) return invalid("rater data consent cannot include hidden or raw protected item fields");
  const missingCategories = raterDataGovernanceCategories.filter((category) => !categories.includes(category));
  if (missingCategories.length) return invalid(`dataCategoriesCovered missing: ${missingCategories.join(", ")}`);
  const missingUseScopes = raterDataUseScopes.filter((scope) => !useScopes.includes(scope));
  if (missingUseScopes.length) return invalid(`useScopesAcknowledged missing: ${missingUseScopes.join(", ")}`);
  const accessRestriction = String(consent.identifiableAccessRestriction).toLowerCase();
  if (!accessRestriction.includes("approved") || !accessRestriction.includes("role")) {
    return invalid("identifiableAccessRestriction must limit access to approved roles");
  }
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
    identifiableAccessRestriction: consent.identifiableAccessRestriction,
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
    ["requesterNotificationStatus", request.requesterNotificationStatus],
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
      requesterNotificationStatus: request.requesterNotificationStatus,
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
    ["actionTaken", request.actionTaken],
    ["frozenSnapshotImpact", request.frozenSnapshotImpact],
    ["requesterNotificationStatus", request.requesterNotificationStatus],
  ].filter(([, value]) => value === undefined || value === null || value === "");
  if (missing.length) return invalid(`missing required fields: ${missing.map(([field]) => field).join(", ")}`);
  const actorCheck = validateParticipantRaterId(raterId, actor);
  if (!actorCheck.ok) return actorCheck;
  if (!volunteerWithdrawalRequestTypes.has(requestType)) return invalid(`unsupported withdrawal requestType: ${requestType}`);
  if (!affectedDataCategories.length) return invalid("affectedDataCategories must be non-empty");
  const effectFailures = volunteerWithdrawalRequiredEffectFailures(requestType, request);
  if (effectFailures.length) return invalid(`withdrawal request missing required effect confirmations: ${effectFailures.join(", ")}`);
  if (findHiddenKeys(request).length || findRawBenchmarkContentKeys(request).length) return invalid("volunteer withdrawal request cannot include hidden or raw protected item fields");
  return {
    ok: true,
    resource: {
      id,
      raterId,
      requestType,
      affectedDataCategories,
      actionTaken: request.actionTaken ?? "pending_review",
      futureAssignmentStop: request.futureAssignmentStop !== false && ["future_assignment_stop", "account_deactivation"].includes(requestType),
      identifiableTelemetryRestricted: request.identifiableTelemetryRestricted !== false,
      publicAttributionRemoved: request.publicAttributionRemoved !== false,
      privateLearningDashboardDeleted: request.privateLearningDashboardDeleted !== false,
      futureTrainingExportExcluded: request.futureTrainingExportExcluded !== false,
      frozenSnapshotImpact: request.frozenSnapshotImpact,
      denominatorChangeArtifactId: request.denominatorChangeArtifactId ?? null,
      requesterNotificationStatus: request.requesterNotificationStatus,
      timestamp: request.timestamp ?? new Date().toISOString(),
    },
  };
}

function volunteerWithdrawalRequiredEffectFailures(requestType, request = {}) {
  const failures = [];
  const rejectsFalse = (types, field) => {
    if (types.includes(requestType) && request[field] === false) failures.push(field);
  };
  rejectsFalse(["future_assignment_stop", "account_deactivation"], "futureAssignmentStop");
  rejectsFalse(["identifiable_telemetry_restriction", "account_deactivation"], "identifiableTelemetryRestricted");
  rejectsFalse(["public_attribution_removal", "account_deactivation"], "publicAttributionRemoved");
  rejectsFalse(["learning_dashboard_deletion", "account_deactivation"], "privateLearningDashboardDeleted");
  rejectsFalse(["future_training_export_exclusion", "account_deactivation"], "futureTrainingExportExcluded");
  if (requestType === "frozen_label_removal_request" && !request.denominatorChangeArtifactId) {
    failures.push("denominatorChangeArtifactId");
  }
  return failures;
}

function validateParticipantRaterId(raterId, actor) {
  if (!raterId) return invalid("raterId is required");
  if (actor.role !== "admin" && raterId !== actor.id) {
    return { ok: false, statusCode: 403, error: "participant_data_actor_not_authorized", detail: `raterId must match authenticated actor ${actor.id}` };
  }
  return { ok: true };
}

export function validateWorkflowPayload(resource, actor, spec, params = {}, validationContext = {}) {
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
  const nonEmptyArrays = (spec.requiredEmptyArrayFields ?? []).filter((fieldPath) => {
    const value = workflowFieldValue(normalized, fieldPath);
    return !Array.isArray(value) || value.length !== 0;
  });
  if (nonEmptyArrays.length) return invalid(`required arrays must be empty: ${nonEmptyArrays.join(", ")}`);
  const missingObjects = (spec.requiredObjectFields ?? []).filter((fieldPath) => {
    const value = workflowFieldValue(normalized, fieldPath);
    return !value || typeof value !== "object" || Array.isArray(value) || !Object.keys(value).length;
  });
  if (missingObjects.length) return invalid(`missing required non-empty objects: ${missingObjects.join(", ")}`);
  for (const fieldSet of spec.requiredDistinctFieldSets ?? []) {
    const values = fieldSet.map((fieldPath) => workflowFieldValue(normalized, fieldPath));
    const normalizedValues = values.map((value) => (typeof value === "string" ? value.trim() : value)).filter((value) => value !== undefined && value !== null && value !== "");
    if (normalizedValues.length !== fieldSet.length || new Set(normalizedValues).size !== normalizedValues.length) {
      return invalid(`${fieldSet.join(", ")} must be distinct`);
    }
  }
  for (const [fieldPath, requiredValues] of Object.entries(spec.requiredArrayIncludes ?? {})) {
    const value = workflowFieldValue(normalized, fieldPath);
    const missingValues = requiredValues.filter((item) => !Array.isArray(value) || !value.includes(item));
    if (missingValues.length) return invalid(`missing required array values in ${fieldPath}: ${missingValues.join(", ")}`);
  }
	  for (const [fieldPath, allowedValues] of Object.entries(spec.allowedArrayValues ?? {})) {
	    const value = workflowFieldValue(normalized, fieldPath);
	    if (!Array.isArray(value)) return invalid(`${fieldPath} must be an array`);
	    const invalidValues = value.filter((item) => !allowedValues.includes(item));
	    if (invalidValues.length) return invalid(`${fieldPath} must contain only: ${allowedValues.join(", ")}`);
	  }
	  for (const [fieldPath, requiredPrefix] of Object.entries(spec.requiredArrayValuePrefixes ?? {})) {
	    const value = workflowFieldValue(normalized, fieldPath);
	    if (!Array.isArray(value)) return invalid(`${fieldPath} must be an array`);
	    const invalidValues = value.filter((item) => typeof item !== "string" || !item.startsWith(requiredPrefix));
	    if (invalidValues.length) return invalid(`${fieldPath} values must start with ${JSON.stringify(requiredPrefix)}`);
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
  for (const rule of spec.requiredObjectKeysFromArrayFields ?? []) {
    const value = workflowFieldValue(normalized, rule.objectField);
    const requiredKeys = workflowFieldValue(normalized, rule.arrayField);
    if (!Array.isArray(requiredKeys)) return invalid(`${rule.arrayField} must be an array`);
    const missingKeys = requiredKeys.filter((key) => !value || typeof value !== "object" || Array.isArray(value) || !Object.hasOwn(value, key));
    if (missingKeys.length) return invalid(`missing required object keys in ${rule.objectField}: ${missingKeys.join(", ")}`);
  }
  for (const [fieldPath, allowedValues] of Object.entries(spec.allowedObjectValues ?? {})) {
    const value = workflowFieldValue(normalized, fieldPath);
    if (!value || typeof value !== "object" || Array.isArray(value)) return invalid(`${fieldPath} must be an object`);
    const invalidKeys = Object.entries(value)
      .filter(([, entryValue]) => !allowedValues.includes(entryValue))
      .map(([key]) => key);
    if (invalidKeys.length) return invalid(`${fieldPath} values must be one of: ${allowedValues.join(", ")}`);
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
  for (const rule of spec.requiredObjectArrayFieldValues ?? []) {
    const arrayValue = workflowFieldValue(normalized, rule.arrayField);
    if (!Array.isArray(arrayValue)) return invalid(`${rule.arrayField} must be an array`);
    const missingValues = rule.requiredValues.filter((requiredValue) =>
      !arrayValue.some((item) => item && typeof item === "object" && workflowFieldValue(item, rule.valueField) === requiredValue)
    );
    if (missingValues.length) return invalid(`missing required ${rule.valueField} values in ${rule.arrayField}: ${missingValues.join(", ")}`);
  }
  for (const rule of spec.allowedObjectArrayFieldValues ?? []) {
    const arrayValue = workflowFieldValue(normalized, rule.arrayField);
    if (!Array.isArray(arrayValue)) return invalid(`${rule.arrayField} must be an array`);
    const invalidValues = arrayValue
      .map((item) => item && typeof item === "object" ? workflowFieldValue(item, rule.valueField) : undefined)
      .filter((value) => !rule.allowedValues.includes(value));
    if (invalidValues.length) return invalid(`${rule.arrayField}.${rule.valueField} must be one of: ${rule.allowedValues.join(", ")}`);
  }
  for (const rule of spec.requiredObjectArrayExactFields ?? []) {
    const arrayValue = workflowFieldValue(normalized, rule.arrayField);
    if (!Array.isArray(arrayValue)) return invalid(`${rule.arrayField} must be an array`);
    for (const [fieldPath, expectedValue] of Object.entries(rule.exactFields ?? {})) {
      const invalidIndexes = arrayValue
        .map((item, index) => item && typeof item === "object" && workflowFieldValue(item, fieldPath) === expectedValue ? null : index)
        .filter((index) => index !== null);
      if (invalidIndexes.length) return invalid(`${rule.arrayField}.${fieldPath} must equal ${JSON.stringify(expectedValue)} at indexes: ${invalidIndexes.join(", ")}`);
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
  const invalidBooleans = (spec.requiredBooleanFields ?? []).filter((fieldPath) => typeof workflowFieldValue(normalized, fieldPath) !== "boolean");
  if (invalidBooleans.length) return invalid(`fields must be boolean: ${invalidBooleans.join(", ")}`);
  for (const rule of spec.requiredNumberRanges ?? []) {
    const value = workflowFieldValue(normalized, rule.field);
    const min = rule.min ?? Number.NEGATIVE_INFINITY;
    const max = rule.max ?? Number.POSITIVE_INFINITY;
    if (!Number.isFinite(value) || value < min || value > max) {
      return invalid(`${spec.resourceKey}.${rule.field} must be a finite number in [${min}, ${max}]`);
    }
  }
  const invalidPositiveIntegers = (spec.requiredPositiveIntegerFields ?? []).filter((fieldPath) => {
    const value = workflowFieldValue(normalized, fieldPath);
    return !Number.isInteger(value) || value <= 0;
  });
  if (invalidPositiveIntegers.length) return invalid(`required fields must be positive integers: ${invalidPositiveIntegers.join(", ")}`);
  for (const [fieldPath, requiredPrefix] of Object.entries(spec.requiredStringPrefixes ?? {})) {
    const observedValue = workflowFieldValue(normalized, fieldPath);
    if (typeof observedValue !== "string" || !observedValue.startsWith(requiredPrefix)) {
      return invalid(`${spec.resourceKey}.${fieldPath} must start with ${JSON.stringify(requiredPrefix)}`);
    }
  }
  for (const [fieldPath, requiredFragments] of Object.entries(spec.requiredStringIncludes ?? {})) {
    const observedValue = workflowFieldValue(normalized, fieldPath);
    const normalizedObserved = typeof observedValue === "string" ? observedValue.toLowerCase() : "";
    const missingFragments = requiredFragments.filter((fragment) => !normalizedObserved.includes(String(fragment).toLowerCase()));
    if (missingFragments.length) return invalid(`${spec.resourceKey}.${fieldPath} must include: ${missingFragments.join(", ")}`);
  }
  for (const [fieldPath, allowedFragments] of Object.entries(spec.requiredStringIncludesAny ?? {})) {
    const observedValue = workflowFieldValue(normalized, fieldPath);
    const normalizedObserved = typeof observedValue === "string" ? observedValue.toLowerCase() : "";
    if (!allowedFragments.some((fragment) => normalizedObserved.includes(String(fragment).toLowerCase()))) {
      return invalid(`${spec.resourceKey}.${fieldPath} must include one of: ${allowedFragments.join(", ")}`);
    }
  }
  for (const [fieldPath, forbiddenFragments] of Object.entries(spec.forbiddenStringFragments ?? {})) {
    const observedValue = workflowFieldValue(normalized, fieldPath);
    const normalizedObserved = typeof observedValue === "string" ? observedValue.toLowerCase() : "";
    const observedForbidden = forbiddenFragments.filter((fragment) => normalizedObserved.includes(String(fragment).toLowerCase()));
    if (observedForbidden.length) return invalid(`${spec.resourceKey}.${fieldPath} must not include: ${observedForbidden.join(", ")}`);
  }
  for (const rule of spec.requiredFieldMatches ?? []) {
    const observedValue = workflowFieldValue(normalized, rule.field);
    const expectedValue = workflowFieldValue(normalized, rule.matchesField);
    if (observedValue !== expectedValue) {
      return invalid(`${spec.resourceKey}.${rule.field} must match ${rule.matchesField}`);
    }
  }
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
  for (const [fieldPath, expectedValue] of Object.entries(spec.requiredStructuredFields ?? {})) {
    const observedValue = workflowFieldValue(normalized, fieldPath);
    if (canonicalJson(observedValue) !== canonicalJson(expectedValue)) return invalid(`${spec.resourceKey}.${fieldPath} must match the frozen policy structure`);
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
    for (const [fieldPath, requiredValues] of Object.entries(conditional.requiredArrayIncludes ?? {})) {
      const value = workflowFieldValue(normalized, fieldPath);
      const missingValues = requiredValues.filter((item) => !Array.isArray(value) || !value.includes(item));
      if (missingValues.length) {
        return invalid(`missing required array values in ${fieldPath} when ${conditional.field}=${JSON.stringify(observedValue)}: ${missingValues.join(", ")}`);
      }
    }
    for (const [fieldPath, expectedValue] of Object.entries(conditional.requiredExactFields ?? {})) {
      const conditionalObserved = workflowFieldValue(normalized, fieldPath);
      if (conditionalObserved !== expectedValue) {
        return invalid(`${spec.resourceKey}.${fieldPath} must equal ${JSON.stringify(expectedValue)} when ${conditional.field}=${JSON.stringify(observedValue)}`);
      }
    }
    for (const [fieldPath, requiredFragments] of Object.entries(conditional.requiredStringIncludes ?? {})) {
      const conditionalObserved = workflowFieldValue(normalized, fieldPath);
      const normalizedObserved = typeof conditionalObserved === "string" ? conditionalObserved.toLowerCase() : "";
      const missingFragments = requiredFragments.filter((fragment) => !normalizedObserved.includes(String(fragment).toLowerCase()));
      if (missingFragments.length) {
        return invalid(`${spec.resourceKey}.${fieldPath} must include ${missingFragments.join(", ")} when ${conditional.field}=${JSON.stringify(observedValue)}`);
      }
    }
    for (const [fieldPath, allowedFragments] of Object.entries(conditional.requiredStringIncludesAny ?? {})) {
      const conditionalObserved = workflowFieldValue(normalized, fieldPath);
      const normalizedObserved = typeof conditionalObserved === "string" ? conditionalObserved.toLowerCase() : "";
      if (!allowedFragments.some((fragment) => normalizedObserved.includes(String(fragment).toLowerCase()))) {
        return invalid(`${spec.resourceKey}.${fieldPath} must include one of ${allowedFragments.join(", ")} when ${conditional.field}=${JSON.stringify(observedValue)}`);
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
  if (spec.requireAssignmentClaimField) {
    const assignmentId = normalized[spec.requireAssignmentClaimField];
    const workflowAssignment = (validationContext.workflowAssignments ?? []).find((assignment) => assignment.id === assignmentId);
    const actorAssignedByWorkflow = Boolean(workflowAssignment && actorCanReceiveAssignment(workflowAssignment, actor));
    if (!actor.allowedAssignmentIds?.includes("*") && !actor.allowedAssignmentIds?.includes(assignmentId) && !actorAssignedByWorkflow) {
      return {
        ok: false,
        statusCode: 403,
        error: "workflow_actor_not_authorized",
        detail: `actor ${actor.id} is not assigned to ${assignmentId}`,
      };
    }
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

export function validateRatingActor(rating, actor, validationContext = {}) {
  if (!actor || typeof actor !== "object") return invalid("actor session is required");
  if (actor.role !== "admin" && rating.raterId !== actor.id) return invalid(`rating.raterId must match the authenticated actor ${actor.id}`);
  const assignment = (validationContext.assignments ?? assignments).find((item) => item.id === rating.assignmentId);
  const assignedRaterId = assignment?.raterId ?? assignment?.assignedTo ?? assignment?.assigned_to ?? null;
  const actorAssignedByWorkflow = Boolean(assignedRaterId && assignedRaterId === actor.id);
  if (!actor.allowedAssignmentIds?.includes("*") && !actor.allowedAssignmentIds?.includes(rating.assignmentId) && !actorAssignedByWorkflow) {
    return invalid(`actor ${actor.id} is not assigned to ${rating.assignmentId}`);
  }
  return { ok: true };
}

export function validateSourceStyleAuditActor(audit, actor, validationContext = {}) {
  if (!actor || typeof actor !== "object") return invalid("actor session is required");
  if (!["rater", "graduate", "phd", "expert", "admin"].includes(actor.role)) return invalid("authorized rater role is required");
  if (actor.role !== "admin" && audit.raterId !== actor.id) return invalid(`audit.raterId must match the authenticated actor ${actor.id}`);
  const workflowAssignment = (validationContext.workflowAssignments ?? []).find((assignment) => assignment.id === audit.assignmentId);
  const actorAssignedByWorkflow = Boolean(workflowAssignment && actorCanReceiveAssignment(workflowAssignment, actor));
  if (!actor.allowedAssignmentIds?.includes("*") && !actor.allowedAssignmentIds?.includes(audit.assignmentId) && !actorAssignedByWorkflow) {
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
      policyActionKind: rating.policyActionKind ?? null,
      policyDecisionId: rating.policyDecisionId ?? null,
      policyDecisionConsumed: Boolean(rating.policyDecisionConsumptionId),
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
      policyActionKind: resource.policyActionKind ?? null,
      policyDecisionId: resource.policyDecisionId ?? null,
      policyDecisionConsumed: Boolean(resource.policyDecisionConsumptionId),
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
  const workflowEvents = await readPersistedWorkflowEvents(context.auditStore);
  const trainingExportUncertaintyPolicies = latestWorkflowResources(workflowEvents, "trainingExportUncertaintyPolicy");
  const pairwiseComparisonSnapshots = latestWorkflowResources(workflowEvents, "pairwiseComparisonSnapshot");
  const ratings = [...seedRatings, ...(await readPersistedRatings(context.auditStore))];
  const snapshot = createLabelSnapshot(
    "snapshot-oct-training-api",
    releaseId,
    ratings,
    critiqueList.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "initial_only",
    positionList,
  );
  return buildTrainingExport(releaseId, snapshot, positionList, critiqueList, ratings, ratingContextSnapshots, {
    trainingExportUncertaintyPolicies,
    pairwiseComparisonSnapshots,
  });
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
