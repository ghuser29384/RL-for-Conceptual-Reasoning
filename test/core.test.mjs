import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ADJUDICATION_COCKPIT_SIGNOFF_POLICY_VERSION,
  BENCHMARK_REFRESH_POLICY_VERSION,
  aggregateRatings,
  adjudicationMemos,
  appendRatingRevision,
  RUBRIC_DIMENSIONS,
  OCTOBER_TARGET_SCALE_INCOMPLETE_STATUS,
  buildAdjudicationMemoAuditReport,
  auditProvenanceRights,
  assignments,
  buildAdminTagBlindingReport,
  buildActiveLearningAudit,
  buildCandidateGenerationIntakeChecklistReport,
  buildAuxiliaryWorkflowEvidenceReport,
  buildCandidateIntakeQualityAudit,
  buildCertificationAudit,
  buildComparabilityClaimMatrix,
  buildCorrectnessVerificationReport,
  buildCorpusCompositionManifest,
  buildCritiqueGenerationEvaluationReport,
  buildHiddenBenchmarkFreezeReport,
  buildHiddenBenchmarkInitialBlindingReport,
  buildItemTextViewParityReport,
  buildLabelAggregationReliabilityChecklistReport,
  buildLabelChannelSeparationReport,
  buildLmcaSourceExampleAnchorReport,
  buildMetricFamilyEligibilityManifest,
  buildModelAssistedLabelOverlapReport,
  buildModelEvaluationReproducibilityChecklistReport,
  buildModelFailureAudit,
  buildOctoberReleaseReport,
  buildOperationalControlEvidenceReport,
  buildPairwiseComparisonSnapshot,
  buildParticipantSafeguardEvidenceReport,
  buildPairedTargetLabelSnapshotReport,
  buildPolicyBundleEvidenceReport,
  buildPositionIntakeReadinessReport,
  buildSourceIntakeEvidenceReport,
  buildSourcePreparationEvidenceReport,
  buildMetaphilosophyDecisionLogReport,
  buildMetaphilosophyDeliverableChecklistReport,
  buildMetaphilosophyGreenfieldArchitectureReport,
  buildMetaphilosophyResearchBacklogReport,
  buildMetaphilosophyTaskTrackTaxonomyReport,
  buildPostDiscussionDisagreementReport,
  buildPostLockSourceStyleAuditReport,
  buildProtectedSplitIsolationReport,
  buildPromptTrackSeparationReport,
  buildRaterCompositionConflictReport,
  buildRaterCertificationReport,
  buildRaterDataGovernanceEvidenceReport,
  buildRatingExperienceEvidenceReport,
  buildEffectivePrimaryRaterAnchorPolicy,
  buildReleaseGoldLibraryItems,
  buildEffectiveReleaseGateProfile,
  buildReleaseRightsRecords,
  buildReleaseGateProfile,
  buildRubricIssueFlagReport,
  buildRubricQaCoverageReport,
  buildRubricVersionDriftReport,
  buildHumanScoreDistributionReport,
  buildHumanCeilingAndSaturationReport,
  buildInteractionWorkflowEvidenceReport,
  buildLmcaComparisonReport,
  buildReasoningModeSensitivityReport,
  buildMetricDirectionalityConfigReport,
  buildRecalibratedEvaluationReport,
  buildRatingRevisionAuditReport,
  buildSanityBaselineReport,
  buildSamePositionContextReport,
  buildUncertaintyAwareLeaderboardReport,
  buildRatingEffortQualityReport,
  buildScoreExplanationAuditReport,
  buildReleaseConfigManifestEvidenceReport,
  buildTrainingExport,
  buildUXSimplificationEvidenceReport,
  buildValidationTrancheReport,
  buildWorkflowStateMachineEvidenceReport,
  buildValidationDesignReport,
  CONSENSUS_TARGET_LABEL_VERSION,
  ACCESSIBILITY_TOOLING_POLICY_VERSION,
  CLIENT_SURFACE_INTEGRITY_POLICY_VERSION,
  CLOUD_SECURITY_BUDGET_POLICY_VERSION,
  INTERPRETATION_TARGET_MAP_REQUIREDNESS_POLICY_VERSION,
  REQUIRED_ACCESSIBILITY_ASSISTIVE_TECH_MATRIX,
  REQUIRED_ACCESSIBILITY_EVIDENCE_ARTIFACT_TYPES,
  REQUIRED_ACCESSIBILITY_TEST_TOOLCHAIN,
  REQUIRED_ACCESSIBILITY_WCAG_CONFORMANCE_TARGET,
  SOURCE_INTAKE_DOWNSTREAM_INTEGRATION_STATUS,
  SOURCE_INTAKE_VISIBILITY,
  SOURCE_RECOGNITION_NONBLIND_FLAG,
  REQUIRED_RATER_UX_ACCEPTANCE_CHECKS,
  REQUIRED_CLOUD_SECURITY_APPROVAL_STATUSES,
  REQUIRED_CLOUD_SECURITY_BUDGET_CATEGORY_MINIMUM_USD,
  REQUIRED_CLOUD_SECURITY_BUDGET_RANGE_USD,
  REQUIRED_CLOUD_SECURITY_CONTROLS,
  REQUIRED_CLIENT_SURFACE_CACHE_POLICY,
  REQUIRED_CLIENT_SURFACE_CSP_DIRECTIVES,
  REQUIRED_CLIENT_SURFACE_REFERRER_POLICY,
  REQUIRED_CLIENT_SURFACE_TELEMETRY_ALLOWLIST,
  REQUIRED_CLIENT_SURFACE_URL_IDENTIFIER_POLICY,
  EXTERNAL_WORM_AUDIT_LOG_POLICY_VERSION,
  REQUIRED_EXTERNAL_WORM_AUDIT_FALLBACK_RULE,
  REQUIRED_EXTERNAL_WORM_AUDIT_LEDGER_BACKEND,
  REQUIRED_EXTERNAL_WORM_AUDIT_POINTER_PREFIX,
  REQUIRED_EXTERNAL_WORM_AUDIT_RECEIPT_FIELDS,
  REQUIRED_EXTERNAL_WORM_AUDIT_RECEIPT_HASH_ALGORITHM,
  REQUIRED_EXTERNAL_WORM_AUDIT_RETENTION_YEARS,
  REQUIRED_EXTERNAL_WORM_AUDIT_VERIFICATION_CADENCE,
  REQUIRED_ADJUDICATION_COCKPIT_MANDATORY_VIEW_IDS,
  REQUIRED_ADJUDICATION_COCKPIT_SIGNOFF_RULES,
  REQUIRED_ADJUDICATION_COCKPIT_SIGNOFF_THRESHOLDS,
  METAPHILOSOPHY_REQUIRED_ARCHITECTURE_LAYER_IDS,
  METAPHILOSOPHY_REQUIRED_DECISION_LOG_TYPES,
  METAPHILOSOPHY_REQUIRED_HISTORICAL_DECISION_LOG_SOURCE_VERSIONS,
  METAPHILOSOPHY_REQUIRED_TASK_TRACK_IDS,
  METAPHILOSOPHY_DECISION_LOG_ENTRIES,
  METAPHILOSOPHY_TASK_TRACKS,
  ADJUDICATOR_PRE_READ_REQUIREDNESS_POLICY_VERSION,
  REQUIRED_ADJUDICATOR_PRE_READ_DECISION_STATUSES,
  REQUIRED_ADJUDICATOR_PRE_READ_RULES,
  REQUIRED_ADJUDICATOR_PRE_READ_THRESHOLDS,
  REQUIRED_ADJUDICATOR_PRE_READ_TRIGGER_CLASSES,
  REQUIRED_ADJUDICATOR_PRE_READ_VISIBILITY_POLICIES,
  REQUIRED_BENCHMARK_REFRESH_ACTIONS,
  REQUIRED_BENCHMARK_REFRESH_CADENCE_DAYS_BY_STATUS,
  REQUIRED_BENCHMARK_REFRESH_POLICY_RULES,
  REQUIRED_BENCHMARK_REFRESH_QUEUE_FIELDS,
  DIAGNOSTIC_DEFERRAL_VISIBILITY_POLICY_VERSION,
  REQUIRED_DIAGNOSTIC_DEFERRAL_CLAIM_SUPPRESSION_ACTIONS,
  REQUIRED_DIAGNOSTIC_DEFERRAL_DIAGNOSTIC_CLASSES,
  REQUIRED_DIAGNOSTIC_DEFERRAL_PUBLIC_VISIBILITY_LEVELS,
  REQUIRED_DIAGNOSTIC_DEFERRAL_REVIEW_STATUSES,
  REQUIRED_DIAGNOSTIC_DEFERRAL_VISIBILITY_RULES,
  EXTERNAL_ASSISTANCE_CONTAMINATION_POLICY_VERSION,
  REQUIRED_EXTERNAL_ASSISTANCE_ACCESSIBILITY_STATUSES,
  REQUIRED_EXTERNAL_ASSISTANCE_CLEAN_ROUTES,
  REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATING_TYPES,
  REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATION_ROUTES,
  REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATION_RULES,
  REQUIRED_EXTERNAL_ASSISTANCE_TYPES,
  MODEL_FAMILY_OVERLAP_POLICY_VERSION,
  REQUIRED_MODEL_FAMILY_OVERLAP_CLEAN_CLAIM_ACTIONS,
  REQUIRED_MODEL_FAMILY_OVERLAP_FORBIDDEN_BASES,
  REQUIRED_MODEL_FAMILY_OVERLAP_MATCH_BASES,
  REQUIRED_MODEL_FAMILY_OVERLAP_POLICY_RULES,
  MODEL_RUN_REPRODUCIBILITY_POLICY_VERSION,
  REQUIRED_MODEL_RUN_REPRODUCIBILITY_CONFIG_FIELDS,
  REQUIRED_MODEL_RUN_REPRODUCIBILITY_ENVIRONMENT_FIELDS,
  REQUIRED_MODEL_RUN_REPRODUCIBILITY_RULES,
  MODEL_PROMPT_SIBLING_CONTEXT_POLICY_VERSION,
  REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_EVIDENCE_FIELDS,
  REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_MODES,
  REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_RULES,
  MODEL_PROVIDER_ENDPOINT_CONTRACT_POLICY_VERSION,
  REQUIRED_MODEL_PROVIDER_ENDPOINT_CONTRACT_CLAUSES,
  MODEL_IMPROVEMENT_POLICY_VERSION,
  REQUIRED_MODEL_IMPROVEMENT_APPROVAL_STATUSES,
  REQUIRED_MODEL_IMPROVEMENT_METHODS,
  REQUIRED_MODEL_IMPROVEMENT_OBJECTIVE_FAMILIES,
  REQUIRED_MODEL_IMPROVEMENT_POLICY_RULES,
  REQUIRED_MODEL_IMPROVEMENT_PROTECTED_SPLIT_EXCLUSIONS,
  REQUIRED_MODEL_IMPROVEMENT_TARGET_FIELDS,
  REQUIRED_TRAINING_EXPORT_DOWNWEIGHT_RULES,
  REQUIRED_TRAINING_EXPORT_UNCERTAINTY_THRESHOLDS,
  REQUIRED_UI_VARIANT_SENSITIVITY_ALPHA,
  REQUIRED_UI_VARIANT_SENSITIVITY_MAX_IMBALANCE,
  REQUIRED_UI_VARIANT_SENSITIVITY_MDE_OVERALL,
  REQUIRED_UI_VARIANT_SENSITIVITY_MIN_CELL_COUNT,
  REQUIRED_UI_VARIANT_SENSITIVITY_MINIMUM_POWER,
  REQUIRED_INTERPRETATION_TARGET_MAP_COVERAGE_RULES,
  REQUIRED_INTERPRETATION_TARGET_MAP_REQUIREDNESS_THRESHOLDS,
  REQUIRED_INTERPRETATION_TARGET_MAP_TRIGGER_CLASSES,
  ITEM_TEXT_NORMALIZATION_POLICY_VERSION,
  REQUIRED_ITEM_TEXT_NORMALIZATION_FIELD_POLICIES,
  REQUIRED_ITEM_TEXT_NORMALIZATION_HASH_RULES,
  REQUIRED_ITEM_TEXT_NORMALIZATION_HASH_TARGETS,
  REQUIRED_ITEM_TEXT_NORMALIZATION_PROHIBITED_MUTATIONS,
  REQUIRED_ITEM_TEXT_NORMALIZATION_REVIEW_ACTIONS,
  REQUIRED_VERIFICATION_CLAIM_GRANULARITY_CLASSES,
  REQUIRED_VERIFICATION_CLAIM_GRANULARITY_RULES,
  REQUIRED_VERIFICATION_CLAIM_GRANULARITY_THRESHOLDS,
  REQUIRED_VISIBILITY_ROLE_FIELD_ACTION_MATRIX,
  RATER_INSTRUCTION_COMPATIBILITY_POLICY_VERSION,
  RATIONALE_EVIDENCE_SPAN_REQUIREDNESS_POLICY_VERSION,
  REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_CLASSES,
  REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_RULES,
  REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_THRESHOLDS,
  RATER_INSTRUCTION_COMPREHENSION_AUDIT_VERSION,
  REQUIRED_RATER_INSTRUCTION_COMPREHENSION_CHECKS,
  REQUIRED_RATER_INSTRUCTION_COMPREHENSION_METHODS,
  REQUIRED_RATER_INSTRUCTION_COMPREHENSION_SCREENS,
  REQUIRED_RATER_INSTRUCTION_DISCLOSURE_DEPTHS,
  REQUIRED_RATER_INSTRUCTION_SHARED_POLICY_FIELDS,
  RATER_DASHBOARD_POLICY_VERSION,
  REQUIRED_RATER_DASHBOARD_PROHIBITED_FIELDS,
  REQUIRED_RATER_DASHBOARD_REMEDIATION_RULES,
  REQUIRED_RATER_DASHBOARD_REMEDIATION_STATUSES,
  REQUIRED_RATER_DASHBOARD_THRESHOLDS,
  REQUIRED_RATER_DASHBOARD_VISIBLE_SECTIONS,
  REQUIRED_RATER_DASHBOARD_VISIBILITY_STATUSES,
  REQUIRED_RATIONALE_EVIDENCE_SPAN_COVERAGE_RULES,
  REQUIRED_RATIONALE_EVIDENCE_SPAN_MANDATORY_TRIGGER_CLASSES,
  REQUIRED_RATIONALE_EVIDENCE_SPAN_REQUIREDNESS_THRESHOLDS,
  REQUIRED_SAME_POSITION_BATCH_REVIEW_DECISION_STATUSES,
  REQUIRED_SAME_POSITION_BATCH_REVIEW_RULES,
  REQUIRED_SAME_POSITION_BATCH_REVIEW_STATUSES,
  REQUIRED_SAME_POSITION_BATCH_REVIEW_THRESHOLDS,
  REQUIRED_SAME_POSITION_BATCH_REVIEW_TRIGGER_CLASSES,
  REQUIRED_SCORE_CONFIDENCE_BANDS,
  REQUIRED_SCORE_CONFIDENCE_NUMERIC_THRESHOLDS,
  REQUIRED_SCORE_CONFIDENCE_REASON_CODES,
  REQUIRED_SCORE_CONFIDENCE_SCALE_VERSION,
  SOURCE_LEAKAGE_REDACTION_POLICY_VERSION,
  REQUIRED_SOURCE_IDENTIFIABILITY_REVIEW_STATUSES,
  REQUIRED_SOURCE_LEAKAGE_LINT_PATTERNS,
  REQUIRED_SOURCE_LEAKAGE_REDACTION_ACTIONS,
  SOURCE_FAMILY_CLUSTERING_POLICY_VERSION,
  REQUIRED_SOURCE_FAMILY_CLUSTERING_THRESHOLDS,
  REQUIRED_NEAR_DUPLICATE_CLUSTERING_THRESHOLDS,
  REQUIRED_SOURCE_FAMILY_CLUSTER_FIELDS,
  REQUIRED_SOURCE_FAMILY_CLUSTERING_REVIEW_STATUSES,
  PARTIAL_TASK_PROMOTION_POLICY_VERSION,
  REQUIRED_PARTIAL_TASK_ELIGIBLE_USES,
  REQUIRED_PARTIAL_TASK_PROMOTION_CRITERIA,
  REQUIRED_PARTIAL_TASK_PROMOTION_REVIEW_STATUSES,
  EXPOSURE_QUARANTINE_POLICY_VERSION,
  REQUIRED_EXPOSURE_QUARANTINE_ACTIONS,
  REQUIRED_EXPOSURE_QUARANTINE_ASSIGNMENT_CHECKS,
  REQUIRED_EXPOSURE_QUARANTINE_EFFECTS,
  REQUIRED_EXPOSURE_QUARANTINE_REVIEW_STATUSES,
  REQUIRED_EXPOSURE_QUARANTINE_TRIGGER_CLASSES,
  REQUIRED_SPOT_CHECK_MINIMUM_COUNT_BY_STRATUM,
  REQUIRED_SPOT_CHECK_MINIMUM_RATE_BY_STRATUM,
  REQUIRED_SPOT_CHECK_SAMPLING_STRATA,
  SCORE_CONFIDENCE_SCALE_POLICY_VERSION,
  SAME_POSITION_BATCH_REVIEW_REQUIREDNESS_POLICY_VERSION,
  SPOT_CHECK_SAMPLING_POLICY_VERSION,
  TRAINING_EXPORT_UNCERTAINTY_POLICY_VERSION,
  UI_VARIANT_SENSITIVITY_POWER_POLICY_VERSION,
  VERIFICATION_CLAIM_GRANULARITY_POLICY_VERSION,
  createBlindRatingView,
  createExportManifest,
  createLabelSnapshot,
  customWeightedLoss,
  customWeightedLossForDataset,
  defaultFullRubricUtility,
  detectEscalations,
  evaluateReleaseGateProfile,
  fullRubricEvaluationRun,
  goldLibraryItems,
  lmcaSourceExampleAnchors,
  overallOnlyEvaluationRun,
  pairwiseMarginDistribution,
  positions,
  postLockSourceStyleAudits,
  critiques,
  critiqueGenerationRuns,
  raterProfiles,
  ratingContextSnapshots,
  seedRatings,
  scoreCertificationAttempt,
  scoreExplanationTriggersForRating,
  certificationPacks,
  seedBenchmarkExposureEvents,
  seedCertificationAttempts,
  unweightedPairwiseErrorRateByPosition,
  validateTriggeredScoreExplanation,
  verificationRecords,
  weightedPairwiseErrorRateByPosition,
  weightedPairwiseLossForPosition,
} from "../src/domain/core.mjs";
import { requiredGateIdsForPolicy } from "../src/domain/contributions.mjs";

const uxSimplificationSurfaces = [
  "rating",
  "practice",
  "calibration",
  "consent",
  "withdrawal",
  "rater_data_governance",
  "discussion",
  "adjudication",
  "release_review",
  "admin_governance",
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
  "external_assistance",
  "autosave_resume",
];

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

const certificationCadencePolicy = {
  goldInjectionSchedule: {
    hiddenGoldEveryNReleaseCriticalAssignments: 10,
    minimumHiddenGoldItemsPerActiveRaterPerMonth: 3,
    stratification: "topic_difficulty_lmca_dimension_and_low_clarity_branch",
  },
  recertificationSchedule: {
    routineIntervalDays: 180,
    inactivityIntervalDays: 90,
    rubricVersionChange: "required_before_release_critical_use",
    targetedRetrainingExit: "pass_targeted_pack_before_assignment_unlock",
  },
  thresholdLogic: {
    rollingWindowGoldItemsMin: 20,
    certificationPassRateMin: 0.85,
    consecutiveGoldFailuresTriggerRestriction: 2,
    meanAbsErrorMax: certificationThresholds.meanAbsErrorMax,
    perDimensionCalibrationErrorMax: certificationThresholds.perDimensionCalibrationErrorMax,
  },
};

function certificationThresholdPolicy(id = "certification-threshold-policy-release-test") {
  return {
    id,
    policyVersion: "certification-threshold-rlhf90-v1",
    thresholds: certificationThresholds,
    remediationRules: certificationRemediationRules,
    cadencePolicy: certificationCadencePolicy,
    certificationStatusRule:
      "A rater is certified only when completion is met, the rubric is current, mean absolute error and every dimension stay within the frozen numeric thresholds, and no restriction flags remain.",
    retrainingRule:
      "Any dimension above the per-dimension calibration threshold creates a targeted retraining flag before live or release-critical rating.",
    restrictionRule:
      "Restriction thresholds hold correctness-sensitive, low-clarity, dead-weight, duplicate-consistency, or hard-ambiguity assignments until recertification or approved review.",
    recertificationRule:
      "Rubric-version mismatch requires recertification or grandfathering review before certification evidence can support release use.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const disagreementThresholds = {
  lowClarityThreshold: 0.5,
  lowClarityAdjudicationCount: 2,
  initialOverallSpreadThreshold: 0.35,
  centralityStrengthProductSpreadThreshold: 0.3,
  correctnessSpreadThreshold: 0.35,
  postDiscussionMaxSpreadTarget: 0.3,
  highSpreadResidualClassificationThreshold: 0.3,
  thinOverlapFinalRaterCountMin: 2,
};

const disagreementEscalationRules = {
  lowClarity: "clarity_below_0_50_routes_to_low_clarity_review_and_two_or_more_routes_to_adjudication",
  initialOverallSpread: "initial_overall_spread_above_0_35_routes_to_object_level_discussion_or_adjudication",
  centralityStrengthProductSpread: "centrality_strength_product_spread_above_0_30_routes_to_target_map_or_adjudication",
  correctnessSpread: "correctness_spread_above_0_35_routes_to_correctness_verification_review",
  postDiscussionResidualSpread: "post_discussion_final_max_spread_above_0_30_requires_residual_disagreement_classification_and_memo",
  thinOverlap: "fewer_than_two_final_raters_is_thin_overlap_and_cannot_support_consensus_claims",
};

function disagreementThresholdPolicy(id = "disagreement-threshold-policy-release-test") {
  return {
    id,
    policyVersion: "disagreement-threshold-rlhf90-v1",
    thresholds: disagreementThresholds,
    escalationRules: disagreementEscalationRules,
    postDiscussionResidualRule:
      "Post-discussion final max spread above 0.30 requires residual disagreement classification, an adjudication memo, and minority-rationale preservation before release use.",
    thinOverlapRule:
      "Fewer than two final raters is thin overlap and must be disclosed rather than counted as low-disagreement consensus evidence.",
    lmcaSourceBoundary:
      "Project default numeric disagreement thresholds are frozen here; LMCA motivates disagreement reporting but does not state every platform escalation threshold.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const activeLearningSelectionThresholds = {
  judgeDisagreementDeltaMin: 0.25,
  highRatedOverallScoreMin: 0.7,
  suspectedJudgeFalsePositiveOverallMax: 0.35,
  modelJudgeCoverageShareMin: 0.2,
  promotedToRatingShareMax: 0.25,
  nearDuplicateRejectionShareReviewMin: 0.3,
  rightsUnclearRejectionShareReviewMin: 0.05,
  lowMarginalInformativenessRejectionShareReviewMin: 0.25,
};

const activeLearningHandSelectionQuotas = {
  diversitySelectedMin: 1,
  suitabilitySelectedMin: 1,
  interestingnessSelectedMin: 1,
  promotedPerBatchMin: 1,
};

const activeLearningSelectionReasonCodes = [
  "judge_disagreement",
  "high_rated",
  "suspected_judge_false_positive",
  "human_diversity_selection",
  "human_suitability_selection",
  "human_interestingness_selection",
];

const activeLearningRejectionReasonCodes = ["near_duplicate", "rights_unclear", "low_marginal_informativeness"];

function activeLearningSelectionPolicy(id = "active-learning-selection-policy-release-test") {
  return {
    id,
    policyVersion: "active-learning-selection-rlhf90-v1",
    thresholds: activeLearningSelectionThresholds,
    handSelectionQuotas: activeLearningHandSelectionQuotas,
    selectionReasonCodes: activeLearningSelectionReasonCodes,
    rejectionReasonCodes: activeLearningRejectionReasonCodes,
    thresholdRule:
      "Judge-disagreement, high-rated, and suspected-false-positive selections use the frozen numeric thresholds before human hand-selection.",
    handSelectionQuotaRule:
      "Each active-learning batch needs at least one diversity, suitability, and interestingness hand-selection path before promoted-to-rating claims.",
    raterVisibilityRule:
      "Selection policy ids, judge thresholds, reason codes, and model-judge scores remain admin-only before initial rating lock.",
    lmcaSourceBoundary:
      "Project default active-learning thresholds and hand-selection quotas are frozen here; LMCA motivates active-learning denominator audits but does not state these exact platform values.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const trainingExportUncertaintyThresholds = REQUIRED_TRAINING_EXPORT_UNCERTAINTY_THRESHOLDS;
const trainingExportDownweightRules = REQUIRED_TRAINING_EXPORT_DOWNWEIGHT_RULES;
const modelImprovementMethods = REQUIRED_MODEL_IMPROVEMENT_METHODS;
const modelImprovementObjectiveFamilies = REQUIRED_MODEL_IMPROVEMENT_OBJECTIVE_FAMILIES;
const modelImprovementTargetFields = REQUIRED_MODEL_IMPROVEMENT_TARGET_FIELDS;
const modelImprovementProtectedSplitExclusions = REQUIRED_MODEL_IMPROVEMENT_PROTECTED_SPLIT_EXCLUSIONS;
const modelImprovementPolicyRules = REQUIRED_MODEL_IMPROVEMENT_POLICY_RULES;
const modelImprovementApprovalStatuses = REQUIRED_MODEL_IMPROVEMENT_APPROVAL_STATUSES;
const benchmarkRefreshCadenceDaysByStatus = REQUIRED_BENCHMARK_REFRESH_CADENCE_DAYS_BY_STATUS;
const benchmarkRefreshActions = REQUIRED_BENCHMARK_REFRESH_ACTIONS;
const benchmarkRefreshQueueFields = REQUIRED_BENCHMARK_REFRESH_QUEUE_FIELDS;
const benchmarkRefreshPolicyRules = REQUIRED_BENCHMARK_REFRESH_POLICY_RULES;
const modelFamilyOverlapMatchBases = REQUIRED_MODEL_FAMILY_OVERLAP_MATCH_BASES;
const modelFamilyOverlapForbiddenBases = REQUIRED_MODEL_FAMILY_OVERLAP_FORBIDDEN_BASES;
const modelFamilyOverlapCleanClaimActions = REQUIRED_MODEL_FAMILY_OVERLAP_CLEAN_CLAIM_ACTIONS;
const modelFamilyOverlapPolicyRules = REQUIRED_MODEL_FAMILY_OVERLAP_POLICY_RULES;
const modelRunReproducibilityConfigFields = REQUIRED_MODEL_RUN_REPRODUCIBILITY_CONFIG_FIELDS;
const modelRunReproducibilityEnvironmentFields = REQUIRED_MODEL_RUN_REPRODUCIBILITY_ENVIRONMENT_FIELDS;
const modelRunReproducibilityRules = REQUIRED_MODEL_RUN_REPRODUCIBILITY_RULES;
const modelPromptSiblingContextModes = REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_MODES;
const modelPromptSiblingContextEvidenceFields = REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_EVIDENCE_FIELDS;
const modelPromptSiblingContextRules = REQUIRED_MODEL_PROMPT_SIBLING_CONTEXT_RULES;
const modelProviderEndpointContractPolicyVersion = MODEL_PROVIDER_ENDPOINT_CONTRACT_POLICY_VERSION;
const modelProviderEndpointContractClauses = REQUIRED_MODEL_PROVIDER_ENDPOINT_CONTRACT_CLAUSES;
const externalAssistanceTypes = REQUIRED_EXTERNAL_ASSISTANCE_TYPES;
const externalAssistanceContaminatingTypes = REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATING_TYPES;
const externalAssistanceContaminationRoutes = REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATION_ROUTES;
const externalAssistanceCleanRoutes = REQUIRED_EXTERNAL_ASSISTANCE_CLEAN_ROUTES;
const externalAssistanceAccessibilityStatuses = REQUIRED_EXTERNAL_ASSISTANCE_ACCESSIBILITY_STATUSES;
const externalAssistanceContaminationRules = REQUIRED_EXTERNAL_ASSISTANCE_CONTAMINATION_RULES;
const itemTextNormalizationFieldPolicies = REQUIRED_ITEM_TEXT_NORMALIZATION_FIELD_POLICIES;
const itemTextNormalizationHashRules = REQUIRED_ITEM_TEXT_NORMALIZATION_HASH_RULES;
const itemTextNormalizationHashTargets = REQUIRED_ITEM_TEXT_NORMALIZATION_HASH_TARGETS;
const itemTextNormalizationProhibitedMutations = REQUIRED_ITEM_TEXT_NORMALIZATION_PROHIBITED_MUTATIONS;
const itemTextNormalizationReviewActions = REQUIRED_ITEM_TEXT_NORMALIZATION_REVIEW_ACTIONS;

function itemTextNormalizationPolicy(id = "item-text-normalization-policy-release-test") {
  return {
    id,
    policyVersion: ITEM_TEXT_NORMALIZATION_POLICY_VERSION,
    fieldPolicies: itemTextNormalizationFieldPolicies,
    hashRules: itemTextNormalizationHashRules,
    hashTargets: itemTextNormalizationHashTargets,
    prohibitedMutations: itemTextNormalizationProhibitedMutations,
    reviewActions: itemTextNormalizationReviewActions,
    raterVisibleRule:
      "Rater-visible text hashes must preserve the visible item wording while excluding source tags, admin notes, hidden benchmark metadata, split labels, model labels, and peer labels before initial lock.",
    modelVisibleRule:
      "Model-visible text hashes must use the same canonical item text boundary as the rater-visible text; prompt instructions, wrappers, hidden labels, and protected metadata stay outside item text.",
    sourceBoundary:
      "Project default per-field text-normalization choices are frozen here; LMCA requires stable text and blinding, but does not state these exact platform hash rules.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function modelPromptSiblingContextPolicy(id = "model-prompt-sibling-context-policy-release-test") {
  return {
    id,
    policyVersion: MODEL_PROMPT_SIBLING_CONTEXT_POLICY_VERSION,
    allowedComparisonModes: modelPromptSiblingContextModes,
    requiredEvidenceFields: modelPromptSiblingContextEvidenceFields,
    policyRules: modelPromptSiblingContextRules,
    sequentialHumanRatingsRule: modelPromptSiblingContextRules.sequentialHumanRatings,
    laterSiblingHandlingRule: modelPromptSiblingContextRules.laterSiblingHandling,
    contextSensitiveClaimRule: modelPromptSiblingContextRules.contextSensitiveClaim,
    targetOnlyRestrictionRule: modelPromptSiblingContextRules.targetOnlyRestriction,
    sourceBoundary: modelPromptSiblingContextRules.sourceBoundary,
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function modelRunReproducibilityPolicy(id = "model-run-reproducibility-policy-release-test") {
  return {
    id,
    policyVersion: MODEL_RUN_REPRODUCIBILITY_POLICY_VERSION,
    requiredInferenceConfigFields: modelRunReproducibilityConfigFields,
    requiredRunEnvironmentFields: modelRunReproducibilityEnvironmentFields,
    reproducibilityRules: modelRunReproducibilityRules,
    snapshotBindingRule: modelRunReproducibilityRules.snapshotBinding,
    deterministicParameterRule: modelRunReproducibilityRules.deterministicParameters,
    environmentCaptureRule: modelRunReproducibilityRules.environmentCapture,
    parserPromptLinkageRule: modelRunReproducibilityRules.parserPromptLinkage,
    cleanComparisonBoundaryRule: modelRunReproducibilityRules.cleanComparisonBoundary,
    sourceBoundary: modelRunReproducibilityRules.sourceBoundary,
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function externalAssistanceContaminationPolicy(id = "external-assistance-contamination-policy-release-test") {
  return {
    id,
    policyVersion: EXTERNAL_ASSISTANCE_CONTAMINATION_POLICY_VERSION,
    allowedAssistanceTypes: externalAssistanceTypes,
    contaminatingAssistanceTypes: externalAssistanceContaminatingTypes,
    requiredContaminationRoutes: externalAssistanceContaminationRoutes,
    allowedCleanRoutes: externalAssistanceCleanRoutes,
    accessibilityExceptionStatuses: externalAssistanceAccessibilityStatuses,
    policyRules: externalAssistanceContaminationRules,
    outsideSystemDisclosureRule: externalAssistanceContaminationRules.outsideSystemDisclosure,
    protectedTextEventRule: externalAssistanceContaminationRules.protectedTextEvent,
    denominatorExclusionRule: externalAssistanceContaminationRules.denominatorExclusion,
    accessibilityExceptionRule: externalAssistanceContaminationRules.accessibilityException,
    sourceBoundary: externalAssistanceContaminationRules.sourceBoundary,
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function trainingExportUncertaintyPolicy(id = "training-export-uncertainty-policy-release-test") {
  return {
    id,
    policyVersion: TRAINING_EXPORT_UNCERTAINTY_POLICY_VERSION,
    thresholds: trainingExportUncertaintyThresholds,
    downweightRules: trainingExportDownweightRules,
    labelMetadataRule:
      "Training exports must preserve rater-count, expert-count, spread, uncertainty-flag, disagreement-taxonomy, and label-status metadata before applying downstream weights.",
    protectedSplitRule:
      "Internal validation, hidden benchmark, stress-test, and public-dev rows are excluded from model-improvement training exports with protectedSplitWeight 0 unless a future governed export explicitly includes them.",
    lmcaSourceBoundary:
      "Project default downstream weights are frozen here; LMCA motivates uncertainty propagation but does not state exact RLHF fine-tuning weights.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function modelImprovementPolicy(id = "model-improvement-policy-release-test") {
  return {
    id,
    policyVersion: MODEL_IMPROVEMENT_POLICY_VERSION,
    allowedTrainingMethods: modelImprovementMethods,
    allowedObjectiveFamilies: modelImprovementObjectiveFamilies,
    requiredTargetFields: modelImprovementTargetFields,
    protectedSplitExclusions: modelImprovementProtectedSplitExclusions,
    policyRules: modelImprovementPolicyRules,
    allowedApprovalStatuses: modelImprovementApprovalStatuses,
    defaultTrainingMethod: "pairwise_reward_model",
    defaultObjectiveFamily: "pairwise_logistic",
    lmcaMetricSeparationRule: modelImprovementPolicyRules.lmcaSeparation,
    protectedSplitRule: modelImprovementPolicyRules.protectedSplitExclusion,
    uncertaintyPropagationRule: modelImprovementPolicyRules.uncertaintyPropagation,
    positionBalanceRule: modelImprovementPolicyRules.positionBalance,
    promptTrackRule: modelImprovementPolicyRules.promptTrackSeparation,
    postTrainingEvaluationRule: modelImprovementPolicyRules.postTrainingEvaluation,
    sourceBoundary:
      "Project default downstream model-improvement method is frozen here; LMCA motivates evaluation metrics but does not state exact RLHF or fine-tuning methods.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function benchmarkRefreshPolicy(id = "benchmark-refresh-policy-release-test") {
  return {
    id,
    policyVersion: BENCHMARK_REFRESH_POLICY_VERSION,
    cadenceDaysBySaturationStatus: benchmarkRefreshCadenceDaysByStatus,
    requiredRefreshActions: benchmarkRefreshActions,
    requiredQueueFields: benchmarkRefreshQueueFields,
    policyRules: benchmarkRefreshPolicyRules,
    saturationCadenceRule: benchmarkRefreshPolicyRules.saturationCadence,
    thinValidationCadenceRule: benchmarkRefreshPolicyRules.thinValidationCadence,
    maintenanceCadenceRule: benchmarkRefreshPolicyRules.maintenanceCadence,
    refreshActionMinimumRule: benchmarkRefreshPolicyRules.refreshActionMinimum,
    protectedSplitGovernanceRule: benchmarkRefreshPolicyRules.protectedSplitGovernance,
    claimSuppressionRule: benchmarkRefreshPolicyRules.claimSuppression,
    sourceBoundary:
      "Project default benchmark-refresh cadence is frozen here; LMCA motivates saturation response but does not state exact refresh timing.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function modelFamilyOverlapPolicy(id = "model-family-overlap-policy-release-test") {
  return {
    id,
    policyVersion: MODEL_FAMILY_OVERLAP_POLICY_VERSION,
    overlapMatchBases: modelFamilyOverlapMatchBases,
    forbiddenOverlapBases: modelFamilyOverlapForbiddenBases,
    cleanClaimActions: modelFamilyOverlapCleanClaimActions,
    policyRules: modelFamilyOverlapPolicyRules,
    exactSnapshotRule: modelFamilyOverlapPolicyRules.exactSnapshot,
    exactAliasRule: modelFamilyOverlapPolicyRules.exactAlias,
    familyMatchRule: modelFamilyOverlapPolicyRules.familyMatch,
    providerOnlyExclusionRule: modelFamilyOverlapPolicyRules.providerOnlyExclusion,
    cleanClaimRule: modelFamilyOverlapPolicyRules.cleanClaim,
    sourceBoundary: modelFamilyOverlapPolicyRules.sourceBoundary,
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const raterInstructionCompatibilityClasses = REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_CLASSES;
const raterInstructionCompatibilityThresholds = REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_THRESHOLDS;
const raterInstructionCompatibilityRules = REQUIRED_RATER_INSTRUCTION_COMPATIBILITY_RULES;
const raterInstructionSharedPolicyFields = REQUIRED_RATER_INSTRUCTION_SHARED_POLICY_FIELDS;
const raterInstructionComprehensionAuditVersion = RATER_INSTRUCTION_COMPREHENSION_AUDIT_VERSION;
const raterInstructionComprehensionScreens = REQUIRED_RATER_INSTRUCTION_COMPREHENSION_SCREENS;
const raterInstructionComprehensionMethods = REQUIRED_RATER_INSTRUCTION_COMPREHENSION_METHODS;
const raterInstructionComprehensionChecks = REQUIRED_RATER_INSTRUCTION_COMPREHENSION_CHECKS;
const raterInstructionDisclosureDepths = REQUIRED_RATER_INSTRUCTION_DISCLOSURE_DEPTHS;

function raterInstructionCompatibilityPolicy(id = "rater-instruction-compatibility-policy-submitted") {
  return {
    id,
    policyVersion: RATER_INSTRUCTION_COMPATIBILITY_POLICY_VERSION,
    coveredWorkflowSplitClasses: ratingScoreInputSplits,
    compatibleRenderClasses: raterInstructionCompatibilityClasses,
    thresholds: raterInstructionCompatibilityThresholds,
    compatibilityRules: raterInstructionCompatibilityRules,
    requiredSharedPolicyFields: raterInstructionSharedPolicyFields,
    protectedSplitMergePolicy: raterInstructionCompatibilityRules.protectedMerge,
    sensitivitySnapshotPolicy: raterInstructionCompatibilityRules.sensitivitySnapshot,
    lmcaSourceBoundary:
      "Project default UI-render compatibility thresholds are frozen here; LMCA motivates stable score semantics and protected-split comparability but does not state these exact platform thresholds.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function raterInstructionComprehensionAudit(
  id = "rater-instruction-comprehension-audit-submitted",
  raterInstructionRenderVersionId = "rater-instruction-render-submitted",
  raterInstructionCompatibilityPolicyId = "rater-instruction-compatibility-policy-submitted",
  rubricCopyTraceabilityMapId = "rubric-copy-traceability-map-submitted",
) {
  return {
    id,
    auditVersion: raterInstructionComprehensionAuditVersion,
    raterInstructionRenderVersionId,
    raterInstructionCompatibilityPolicyId,
    rubricCopyTraceabilityMapId,
    coveredScreenIds: raterInstructionComprehensionScreens,
    comprehensionMethods: raterInstructionComprehensionMethods,
    comprehensionCheckIds: raterInstructionComprehensionChecks,
    glossaryTermIds: ["centrality", "strength", "dead_weight", "single_issue", "overall"],
    disclosureDepths: raterInstructionDisclosureDepths,
    comprehensionTestMethodology:
      "Expert and pilot-rater comprehension checks verify the task boundary, rubric dimensions, confidence metadata, hidden metadata boundaries, and safe action paths.",
    clauseTraceabilityReviewStatus: "passed",
    screenCopyMappingReviewStatus: "passed",
    comprehensionTestStatus: "passed",
    semanticDriftBlocker: true,
    noFeatureLossBlocker: true,
    protectedLeakageReviewPassed: true,
    excludedFromScoreComputation: true,
    excludedFromIndependentBlindDenominator: true,
    sourceBoundary:
      "Project default screen-copy comprehension methodology is frozen here; LMCA motivates careful rubric interpretation but does not state exact volunteer-platform comprehension checks.",
    reviewerId: "demo-instruction-reviewer",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const scoreConfidenceScaleVersion = REQUIRED_SCORE_CONFIDENCE_SCALE_VERSION;
const scoreConfidenceBands = REQUIRED_SCORE_CONFIDENCE_BANDS;
const scoreConfidenceNumericThresholds = REQUIRED_SCORE_CONFIDENCE_NUMERIC_THRESHOLDS;
const scoreConfidenceReasonCodes = REQUIRED_SCORE_CONFIDENCE_REASON_CODES;

function scoreConfidenceScalePolicy(id = "score-confidence-scale-policy-submitted") {
  return {
    id,
    policyVersion: SCORE_CONFIDENCE_SCALE_POLICY_VERSION,
    scaleVersion: scoreConfidenceScaleVersion,
    dimensionCoverage: RUBRIC_DIMENSIONS,
    confidenceBands: scoreConfidenceBands,
    numericThresholds: scoreConfidenceNumericThresholds,
    allowedReasonCodes: scoreConfidenceReasonCodes,
    annotationUsePolicy:
      "Score-confidence annotations are uncertainty metadata for adjudication routing, QA review, and training downweighting only, not an LMCA score dimension.",
    excludedFromScoreComputationRequired: true,
    visibleToPeersBeforeLockRequired: false,
    lmcaSourceBoundary:
      "Project default confidence annotation scale is frozen here; LMCA motivates preserving uncertainty metadata but does not state this exact per-dimension scale.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const raterDashboardVisibleSections = REQUIRED_RATER_DASHBOARD_VISIBLE_SECTIONS;
const raterDashboardProhibitedFields = REQUIRED_RATER_DASHBOARD_PROHIBITED_FIELDS;
const raterDashboardThresholds = REQUIRED_RATER_DASHBOARD_THRESHOLDS;
const raterDashboardRemediationRules = REQUIRED_RATER_DASHBOARD_REMEDIATION_RULES;
const raterDashboardRemediationStatuses = REQUIRED_RATER_DASHBOARD_REMEDIATION_STATUSES;
const raterDashboardVisibilityStatuses = REQUIRED_RATER_DASHBOARD_VISIBILITY_STATUSES;

function raterDashboardPolicy(id = "rater-dashboard-policy-submitted") {
  return {
    id,
    policyVersion: RATER_DASHBOARD_POLICY_VERSION,
    visibleSections: raterDashboardVisibleSections,
    prohibitedFields: raterDashboardProhibitedFields,
    thresholds: raterDashboardThresholds,
    remediationRules: raterDashboardRemediationRules,
    allowedRemediationStatuses: raterDashboardRemediationStatuses,
    allowedVisibilityStatuses: raterDashboardVisibilityStatuses,
    feedbackVisibilityPolicy: raterDashboardRemediationRules.feedbackVisibility,
    protectedLabelBoundary: raterDashboardRemediationRules.protectedLabelBoundary,
    remediationRoutingRule: raterDashboardRemediationRules.remediationRouting,
    assignmentEligibilityRule: raterDashboardRemediationRules.assignmentEligibility,
    sourceBoundary:
      "Project default private-dashboard visibility and remediation thresholds are frozen here; LMCA motivates calibration feedback but does not state these exact volunteer-dashboard thresholds.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const samePositionBatchReviewTriggerClasses = REQUIRED_SAME_POSITION_BATCH_REVIEW_TRIGGER_CLASSES;
const samePositionBatchReviewThresholds = REQUIRED_SAME_POSITION_BATCH_REVIEW_THRESHOLDS;
const samePositionBatchReviewRules = REQUIRED_SAME_POSITION_BATCH_REVIEW_RULES;
const samePositionBatchReviewStatuses = REQUIRED_SAME_POSITION_BATCH_REVIEW_STATUSES;
const samePositionBatchReviewDecisionStatuses = REQUIRED_SAME_POSITION_BATCH_REVIEW_DECISION_STATUSES;

function samePositionBatchReviewRequirednessPolicy(id = "same-position-batch-review-requiredness-policy-submitted") {
  return {
    id,
    policyVersion: SAME_POSITION_BATCH_REVIEW_REQUIREDNESS_POLICY_VERSION,
    triggerClasses: samePositionBatchReviewTriggerClasses,
    thresholds: samePositionBatchReviewThresholds,
    requiredReviewRules: samePositionBatchReviewRules,
    reviewStatuses: samePositionBatchReviewStatuses,
    requirednessDecisionStatuses: samePositionBatchReviewDecisionStatuses,
    nonIndependentEvidenceRule: samePositionBatchReviewRules.nonIndependentBoundary,
    revisionPreservationRule: samePositionBatchReviewRules.revisionPreservation,
    visibilityRule: samePositionBatchReviewRules.visibility,
    excludedFromIndependentRaterCountRequired: true,
    raterOwnRatingsOnlyRequired: true,
    peerModelSourceMetadataHiddenRequired: true,
    lmcaSourceBoundary:
      "Project default same-position batch-review requiredness is frozen here; LMCA motivates same-position context handling but does not state these exact platform thresholds.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const rationaleEvidenceSpanMandatoryTriggerClasses = REQUIRED_RATIONALE_EVIDENCE_SPAN_MANDATORY_TRIGGER_CLASSES;
const rationaleEvidenceSpanRequirednessThresholds = REQUIRED_RATIONALE_EVIDENCE_SPAN_REQUIREDNESS_THRESHOLDS;
const rationaleEvidenceSpanCoverageRules = REQUIRED_RATIONALE_EVIDENCE_SPAN_COVERAGE_RULES;
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

function rationaleEvidenceSpanRequirednessPolicy(id = "rationale-evidence-span-requiredness-policy-submitted") {
  return {
    id,
    policyVersion: RATIONALE_EVIDENCE_SPAN_REQUIREDNESS_POLICY_VERSION,
    mandatoryTriggerClasses: rationaleEvidenceSpanMandatoryTriggerClasses,
    thresholds: rationaleEvidenceSpanRequirednessThresholds,
    coverageRules: rationaleEvidenceSpanCoverageRules,
    requiredLinkCategories: rationaleEvidenceSpanLinkCategories,
    allowedVisibilityStates: rationaleEvidenceSpanVisibilityStates,
    coverageManifestRule:
      "Every mandatory rating or adjudication trigger must have at least one span id linked to the active policy before release-critical rationale evidence is complete.",
    protectedVisibilityRule:
      "Initial-rating spans must store only normalized hashes, hide raw selected text, and remain locked_initial_hidden until initial rating lock.",
    lmcaSourceBoundary:
      "Project default requiredness triggers are frozen here; LMCA motivates span-linked rationale evidence but does not state these exact mandatory platform triggers.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const interpretationTargetMapTriggerClasses = REQUIRED_INTERPRETATION_TARGET_MAP_TRIGGER_CLASSES;
const interpretationTargetMapRequirednessThresholds = REQUIRED_INTERPRETATION_TARGET_MAP_REQUIREDNESS_THRESHOLDS;
const interpretationTargetMapCoverageRules = REQUIRED_INTERPRETATION_TARGET_MAP_COVERAGE_RULES;
const interpretationTargetMapRequiredFields = [
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
const interpretationTargetMapDecisionStatuses = [
  "optional_for_ordinary_low_risk",
  "required_before_release_or_adjudication",
  "complete_required_map",
  "review_required",
];

function interpretationTargetMapRequirednessPolicy(id = "interpretation-target-map-requiredness-policy-submitted") {
  return {
    id,
    policyVersion: INTERPRETATION_TARGET_MAP_REQUIREDNESS_POLICY_VERSION,
    triggerClasses: interpretationTargetMapTriggerClasses,
    thresholds: interpretationTargetMapRequirednessThresholds,
    coverageRules: interpretationTargetMapCoverageRules,
    requiredMapFields: interpretationTargetMapRequiredFields,
    allowedRequirednessDecisionStatuses: interpretationTargetMapDecisionStatuses,
    allowedVisibilityStates: ["post_lock_or_adjudicator_only", "adjudication_visible", "release_review_visible"],
    ordinaryItemPolicy:
      "Interpretation-target maps remain optional for ordinary low-risk live ratings below the frozen ambiguity threshold, but required for release-critical ambiguity disputes.",
    coverageManifestRule:
      "Every required target map must link its active policy id, trigger class, and completed conclusion, attacked-claim, plausibility, coverage, priced-in, and dimension-effect fields.",
    lmcaSourceBoundary:
      "Project default target-map requiredness thresholds are frozen here; LMCA motivates structured interpretation mapping but does not state these exact platform thresholds.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const verificationClaimGranularityClasses = REQUIRED_VERIFICATION_CLAIM_GRANULARITY_CLASSES;
const verificationClaimGranularityThresholds = REQUIRED_VERIFICATION_CLAIM_GRANULARITY_THRESHOLDS;
const verificationClaimGranularityRules = REQUIRED_VERIFICATION_CLAIM_GRANULARITY_RULES;
const visibilityRoleFieldActionMatrix = REQUIRED_VISIBILITY_ROLE_FIELD_ACTION_MATRIX;
const sourceLeakageLintPatterns = REQUIRED_SOURCE_LEAKAGE_LINT_PATTERNS;
const sourceLeakageRedactionActions = REQUIRED_SOURCE_LEAKAGE_REDACTION_ACTIONS;
const sourceIdentifiabilityReviewStatuses = REQUIRED_SOURCE_IDENTIFIABILITY_REVIEW_STATUSES;
const sourceFamilyClusteringPolicyVersion = SOURCE_FAMILY_CLUSTERING_POLICY_VERSION;
const sourceFamilyClusteringThresholds = REQUIRED_SOURCE_FAMILY_CLUSTERING_THRESHOLDS;
const nearDuplicateClusteringThresholds = REQUIRED_NEAR_DUPLICATE_CLUSTERING_THRESHOLDS;
const sourceFamilyClusterFields = REQUIRED_SOURCE_FAMILY_CLUSTER_FIELDS;
const sourceFamilyClusteringReviewStatuses = REQUIRED_SOURCE_FAMILY_CLUSTERING_REVIEW_STATUSES;
const partialTaskPromotionEligibleUses = REQUIRED_PARTIAL_TASK_ELIGIBLE_USES;
const partialTaskPromotionCriteria = REQUIRED_PARTIAL_TASK_PROMOTION_CRITERIA;
const partialTaskPromotionReviewStatuses = REQUIRED_PARTIAL_TASK_PROMOTION_REVIEW_STATUSES;
const exposureQuarantineTriggerClasses = REQUIRED_EXPOSURE_QUARANTINE_TRIGGER_CLASSES;
const exposureQuarantineAssignmentChecks = REQUIRED_EXPOSURE_QUARANTINE_ASSIGNMENT_CHECKS;
const exposureQuarantineActions = REQUIRED_EXPOSURE_QUARANTINE_ACTIONS;
const exposureQuarantineReviewStatuses = REQUIRED_EXPOSURE_QUARANTINE_REVIEW_STATUSES;
const exposureQuarantineEffects = REQUIRED_EXPOSURE_QUARANTINE_EFFECTS;
const exposureQuarantineAllowedSources = [
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
const verificationClaimGranularityReviewStatuses = [
  "policy_applied_claim_level",
  "compound_claim_justified",
  "review_required",
];

function verificationClaimGranularityPolicy(id = "verification-claim-granularity-policy-submitted") {
  return {
    id,
    policyVersion: VERIFICATION_CLAIM_GRANULARITY_POLICY_VERSION,
    claimGranularityClasses: verificationClaimGranularityClasses,
    thresholds: verificationClaimGranularityThresholds,
    granularityRules: verificationClaimGranularityRules,
    allowedClaimTypes: ["logical", "mathematical", "empirical", "subjective_or_intuition_pump", "unclear_claim"],
    allowedClaimStatuses: ["verified", "unresolved", "not_practicable", "excluded_due_to_unclear_text"],
    allowedReviewStatuses: verificationClaimGranularityReviewStatuses,
    worksheetLinkageRule:
      "Release-critical, validation, adjudication, and high-disagreement correctness workspaces must either link a claim-weight worksheet or record why a worksheet is not practicable.",
    sourceBoundary:
      "Project default claim-granularity standards are frozen here; LMCA motivates claim-level verification but does not state these exact split thresholds.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function sourceLeakageRedactionPolicy(id = "source-leakage-redaction-policy-submitted") {
  return {
    id,
    policyVersion: SOURCE_LEAKAGE_REDACTION_POLICY_VERSION,
    requiredLintPatterns: sourceLeakageLintPatterns,
    redactionActions: sourceLeakageRedactionActions,
    sourceIdentifiabilityReviewStatuses,
    sourceIdentifiabilityRule:
      "Substantively necessary source-identifying spans require expert approval, sensitive marking, and release-claim disclosure before rating use.",
    raterVisibleChecksumRule: "Rendered rater-visible text must be checksummed with sha256 after source-leakage redaction and before initial assignment.",
    unresolvedLeakageRule: "No unresolved source-leakage pattern may remain in ordinary blind initial rating surfaces.",
    rawRetentionBoundary: "Raw source metadata, hidden comments, admin tags, and pasted provenance metadata remain admin-only and outside rater-visible text.",
    sourceBoundary:
      "Project default source-leakage lint and redaction policy is frozen here; LMCA motivates source/tag blinding but does not state these exact lint patterns or redaction actions.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function sourceFamilyClusteringPolicy(id = "source-family-clustering-policy-submitted") {
  return {
    id,
    policyVersion: sourceFamilyClusteringPolicyVersion,
    sourceFamilyClusteringThresholds,
    nearDuplicateClusteringThresholds,
    requiredConflictClusterFields: sourceFamilyClusterFields,
    clusteringReviewStatuses: sourceFamilyClusteringReviewStatuses,
    protectedAssignmentRule:
      "Protected and release-critical independent blind assignments must check source-family, adaptation-family, near-duplicate, and public-example clusters before counting labels.",
    releaseClaimDisclosureRule:
      "Release reports disclose cluster-threshold policy id and exclude or label rows where required conflict clusters were missing or waived.",
    sourceBoundary:
      "Project default source-family and near-duplicate clustering thresholds are frozen here; LMCA motivates source blinding but does not state these exact clustering thresholds.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function partialTaskPromotionPolicy(id = "partial-task-promotion-policy-submitted") {
  return {
    id,
    policyVersion: PARTIAL_TASK_PROMOTION_POLICY_VERSION,
    coveredTaskTypes: partialTaskOutputTypes,
    allowedEligibleUses: partialTaskPromotionEligibleUses,
    excludedDenominators: partialTaskExcludedDenominators,
    promotionCriteriaByTaskType: partialTaskPromotionCriteria,
    allowedPromotionReviewStatuses: partialTaskPromotionReviewStatuses,
    fullRubricPromotionProhibited: true,
    explicitPairwiseExportLabelRequired: true,
    adjudicationLinkRequiredForPromotion: true,
    denominatorExclusionRule:
      "Partial-task outputs stay outside full-rubric blind-rating counts, custom-loss targets, hidden-benchmark labels, and human-ceiling denominators unless a future governed policy creates a new labeled sensitivity artifact.",
    sourceBoundary:
      "Project default partial-output promotion criteria are frozen here; LMCA motivates preserved full-rubric labels but does not state these auxiliary workflow promotion rules.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function exposureQuarantinePolicy(id = "exposure-quarantine-policy-submitted") {
  return {
    id,
    policyVersion: EXPOSURE_QUARANTINE_POLICY_VERSION,
    quarantineTriggerClasses: exposureQuarantineTriggerClasses,
    requiredAssignmentExposureChecks: exposureQuarantineAssignmentChecks,
    allowedExposureSources: exposureQuarantineAllowedSources,
    quarantineActionsByTrigger: exposureQuarantineActions,
    allowedQuarantineReviewStatuses: exposureQuarantineReviewStatuses,
    requiredBlindEligibilityEffects: exposureQuarantineEffects,
    siblingContextRecheckRequired: true,
    postLockExposureQuarantineRequired: true,
    modelAssistedCheckHumanOnlyExclusionRequired: true,
    assignmentRecheckRule:
      "Later-added sibling critiques, post-lock discussion, and model-assisted checks require same-position cluster recheck before any fresh blind initial or protected assignment.",
    denominatorBoundaryRule:
      "Exposure-quarantined rows stay outside fresh blind initial, independent blind, human-only, hidden-benchmark, and protected assignment denominators unless deprotected or routed non-blind.",
    sourceBoundary:
      "Project default exposure-quarantine rules are frozen here; LMCA motivates preserved blind initial labels but does not state these exact late-sibling, post-lock, or model-assisted exposure rules.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const adjudicatorPreReadTriggerClasses = REQUIRED_ADJUDICATOR_PRE_READ_TRIGGER_CLASSES;
const adjudicatorPreReadThresholds = REQUIRED_ADJUDICATOR_PRE_READ_THRESHOLDS;
const adjudicatorPreReadRules = REQUIRED_ADJUDICATOR_PRE_READ_RULES;
const adjudicatorPreReadDecisionStatuses = REQUIRED_ADJUDICATOR_PRE_READ_DECISION_STATUSES;
const adjudicatorPreReadVisibleMaterialPolicies = REQUIRED_ADJUDICATOR_PRE_READ_VISIBILITY_POLICIES;

function adjudicatorPreReadRequirednessPolicy(id = "adjudicator-pre-read-requiredness-policy-submitted") {
  return {
    id,
    policyVersion: ADJUDICATOR_PRE_READ_REQUIREDNESS_POLICY_VERSION,
    triggerClasses: adjudicatorPreReadTriggerClasses,
    thresholds: adjudicatorPreReadThresholds,
    requirednessRules: adjudicatorPreReadRules,
    allowedRequirednessDecisionStatuses: adjudicatorPreReadDecisionStatuses,
    allowedVisibleMaterialPolicies: adjudicatorPreReadVisibleMaterialPolicies,
    exposureOrderRule: adjudicatorPreReadRules.exposureOrder,
    memoLinkageRule: adjudicatorPreReadRules.memoLinkage,
    anchoringControlRule: adjudicatorPreReadRules.anchoringControl,
    peerDistributionExposureBeforePreReadMax: 0,
    completedBeforePeerDistributionExposureRequired: true,
    lmcaSourceBoundary:
      "Project default adjudicator pre-read requiredness is frozen here; LMCA motivates blind initial judgment and object-level adjudication but does not state these exact platform thresholds.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const adjudicationCockpitMandatoryViewIds = REQUIRED_ADJUDICATION_COCKPIT_MANDATORY_VIEW_IDS;
const adjudicationCockpitSignoffThresholds = REQUIRED_ADJUDICATION_COCKPIT_SIGNOFF_THRESHOLDS;
const adjudicationCockpitSignoffRules = REQUIRED_ADJUDICATION_COCKPIT_SIGNOFF_RULES;

function adjudicationCockpitSignoffPolicy(id = "adjudication-cockpit-signoff-policy-submitted") {
  return {
    id,
    policyVersion: ADJUDICATION_COCKPIT_SIGNOFF_POLICY_VERSION,
    mandatoryViewIds: adjudicationCockpitMandatoryViewIds,
    thresholds: adjudicationCockpitSignoffThresholds,
    signoffRules: adjudicationCockpitSignoffRules,
    allowedSignoffStatuses: ["ready_for_memo", "review_required", "blocked_missing_mandatory_views"],
    finalMemoGateRule:
      "Adjudication review sessions must prove all mandatory cockpit views were reviewed before a final memo is marked ready for signoff.",
    sourceBoundary:
      "Project default cockpit signoff views are frozen here; LMCA motivates object-level adjudication review but does not state this exact mandatory view list.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

const comparabilityTierThresholds = {
  method_preserving: { pass: { sourceCriticalCoreGatePassCountMin: 5, requiredMetricFamilyCountMin: 2 }, partial: { sourceCriticalCoreGatePassCountMin: 4, requiredMetricFamilyCountMin: 1 }, fail: { sourceCriticalCoreGatePassCountMax: 3 } },
  corpus_scale_comparable: { pass: { positionsWithAtLeastOneCritiqueMin: 442, critiquesMin: 951, ratingsIgnoringRevisionsMin: 1458 }, partial: { positionsWithAtLeastOneCritiqueMin: 120, critiquesMin: 360, blindInitialRatingsMin: 1440 }, fail: { positionsWithAtLeastOneCritiqueMax: 119 } },
  source_topic_rater_comparable: { pass: { topicFamiliesCoveredMin: 6, positionSourceCategoriesCoveredMin: 6, raterContributionRowsMin: 6 }, partial: { topicFamiliesCoveredMin: 3, positionSourceCategoriesCoveredMin: 3, raterContributionRowsMin: 3 }, fail: { topicFamiliesCoveredMax: 2 } },
  exact_position_source_count_comparable: { pass: { exactLmcaSourceCategoryCountMatchesMin: 6, totalPositionsMin: 442 }, partial: { sourceCategoriesCoveredMin: 4, knownOtherDatasetSubsourceRowsMin: 2 }, fail: { sourceCategoriesCoveredMax: 3 } },
  topic_family_comparable: { pass: { lmcaTopicFamiliesCoveredMin: 6 }, partial: { lmcaTopicFamiliesCoveredMin: 3 }, fail: { lmcaTopicFamiliesCoveredMax: 2 } },
  rater_contribution_comparable: { pass: { knownLmcaRaterRowsComparedMin: 6, largestSingleRaterShareMax: 0.649 }, partial: { submittedRaterProfilesMin: 4, individualRaterDominanceReported: 1 }, fail: { submittedRaterProfilesMax: 3 } },
  adapted_source_language_task_format_comparable: { pass: { adaptedSourceDisclosureFieldsMin: 5, knownSubsourceRowsMin: 2, machineTranslationStatusRowsMin: 1 }, partial: { adaptedSourceDisclosureFieldsMin: 3, knownSubsourceRowsMin: 1 }, fail: { adaptedSourceDisclosureFieldsMax: 2 } },
  metric_denominator_comparable: { pass: { weightedPairwisePositionsMin: 255, weightedPairwiseCritiquePairsMin: 856, customMetricDialoguesMin: 933 }, partial: { weightedPairwisePositionsMin: 52, weightedPairwiseCritiquePairsMin: 100, customMetricDialoguesMin: 120 }, fail: { weightedPairwiseCritiquePairsMax: 99 } },
  target_label_comparable: { pass: { primaryRaterAnchorSnapshotsMin: 1, targetLabelVersionPrimaryRaterAnchorRequired: 1 }, partial: { pairedPrimaryAndConsensusSnapshotsMin: 1 }, fail: { primaryRaterAnchorSnapshotsMax: 0 } },
  validation_design_comparable: { pass: { validationCritiquesMin: 52, validationPositionsMin: 19, coreAllItemsRatersMin: 4 }, partial: { validationCritiquesMin: 26, validationPositionsMin: 10, coreAllItemsRatersMin: 2 }, fail: { validationCritiquesMax: 25 } },
  validation_ceiling_comparable: { pass: { appendixCNumericBaselineSectionsMin: 5, humanCeilingRunsMin: 1, intervalMetadataComplete: 1 }, partial: { appendixCNumericBaselineSectionsMin: 3, humanCeilingRunsMin: 1 }, fail: { humanCeilingRunsMax: 0 } },
  model_score_anchor_comparable: { pass: { table5WeightedPairwiseAnchorsMin: 4, table7CustomMetricAnchorsMin: 3, cleanLeaderboardRunsMin: 1 }, partial: { table5WeightedPairwiseAnchorsMin: 4, table7CustomMetricAnchorsMin: 3 }, fail: { table5WeightedPairwiseAnchorsMax: 3 } },
  prompt_family_source_scope_comparable: { pass: { commonPromptPolicyRowsMin: 1, appendixGExactBaselineRowsMin: 1, promptScopeSensitivityRowsMin: 1 }, partial: { promptPolicyRowsMin: 1 }, fail: { promptPolicyRowsMax: 0 } },
  model_snapshot_comparable: { pass: { resolvedModelSnapshotShareMin: 1, aliasStabilityRowsMin: 1 }, partial: { resolvedModelSnapshotShareMin: 0.5 }, fail: { resolvedModelSnapshotShareMax: 0.49 } },
  protected_split_leakage_comparable: { pass: { protectedLeakageIncidentMax: 0, accessAuditRowsMin: 1, protectedSplitIsolationFailuresMax: 0 }, partial: { accessAuditRowsMin: 1 }, fail: { protectedLeakageIncidentMin: 1 } },
  replication_like: { pass: { passingComparabilityTierCountMin: 15, failingComparabilityTierCountMax: 0 }, partial: { passingComparabilityTierCountMin: 12, failingComparabilityTierCountMax: 2 }, fail: { failingComparabilityTierCountMin: 3 } },
};

function comparabilityTierPolicy(id = "comparability-tier-policy-release-test") {
  return {
    id,
    policyVersion: "comparability-tier-rlhf90-v1",
    statusOrder: ["fails", "partial", "passes"],
    tierThresholds: comparabilityTierThresholds,
    guardrailRule:
      "Computed release evidence remains authoritative; submitted comparability statuses can only narrow or annotate tiers and the stricter status wins.",
    notApplicableRule:
      "not_applicable is allowed only for tiers outside a release claim scope and ranks no higher than partial for overclaim prevention.",
    publicWordingRule:
      "Public claim wording must name the tier, status, threshold policy, limitations, and whether the claim is LMCA-style rather than target-identical replication.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

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

const uxScreenControlKeys = [...uxNoFeatureLossKeys, "post_lock_feedback"];
const rubricCopyTraceabilityScreens = ["rating", "practice", "calibration", "adjudication", "release_review"];
const rubricCopyTraceabilityEntries = ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"];
const rubricCopyTraceabilityClauses = [
  "appendix_f.centrality",
  "appendix_f.strength",
  "appendix_f.correctness",
  "appendix_f.clarity",
  "appendix_f.dead_weight",
  "appendix_f.single_issue",
  "appendix_f.overall",
];

const uxScreenControlRequirements = {
  rating: [
    "score_fields",
    "safe_decline",
    "source_recognition",
    "item_issue_report",
    "verification_control",
    "appendix_f_anchor_access",
    "pre_submit_lint",
    "external_assistance",
    "autosave_resume",
  ],
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

function reachableUxControlResults(surface) {
  return Object.fromEntries((uxScreenControlRequirements[surface] ?? []).map((control) => [control, "reachable"]));
}

function uxScreenFeatureParityChecks(policyId = "ux-policy-submitted") {
  return uxSimplificationSurfaces.map((surface) => ({
    id: `screen-feature-parity-submitted-${surface}`,
    screenId: surface,
    uxSimplificationPolicyId: policyId,
    workflowProfileId: `${surface}-workflow-profile-submitted`,
    requiredControlResults: reachableUxControlResults(surface),
    featureParityChecklistResults: { no_feature_loss: "passed", required_controls_reachable: "passed" },
    noFeatureLoss: true,
    checkedBy: "ux-reviewer",
    checkedAt: "2026-10-01T00:14:00.000Z",
  }));
}

function simplifiedCopyPreviews() {
  return uxSimplificationSurfaces.map((surface) => ({
    id: `simplified-copy-preview-submitted-${surface}`,
    screenId: surface,
    copyBundleId: `copy-bundle-submitted-${surface}`,
    glossaryTooltipIds: ["centrality", "strength", "dead_weight", "single_issue"],
    exactRubricTermPreservation: true,
    hiddenFieldLeakageCheck: "passed",
    uiExperimentPolicyId: "ui-experiment-policy-submitted",
    raterInstructionRenderVersionId: "rater-instruction-render-submitted",
    releaseConfigManifestId: "release-config-manifest-submitted",
    protectedSplitVariantDisposition: "frozen_compatible",
    reviewerId: "ux-reviewer",
    reviewedAt: "2026-10-01T00:15:00.000Z",
  }));
}

function rubricCopyTraceabilityMaps() {
  return [
    {
      id: "rubric-copy-traceability-map-submitted",
      releaseId: "october-2026-demo",
      mapVersion: "rubric-copy-traceability-rlhf89-v1",
      rubricVersion: "appendix-f-operational-v1",
      copyBundleId: "rubric-copy-bundle-submitted",
      coveredScreenIds: rubricCopyTraceabilityScreens,
      simplifiedCopyEntryIds: rubricCopyTraceabilityEntries,
      mappedRubricClauseIds: rubricCopyTraceabilityClauses,
      clauseMap: Object.fromEntries(rubricCopyTraceabilityEntries.map((entryId, index) => [entryId, rubricCopyTraceabilityClauses[index]])),
      semanticDriftTestIds: rubricCopyTraceabilityEntries.map((entryId) => `semantic-drift-${entryId}`),
      semanticDriftTestStatus: "passed",
      semanticDriftFailureBlocker: true,
      exactRubricClauseMapping: true,
      appendixFAnchorAccess: "one_click",
      hiddenFieldLeakageCheck: "passed",
      releaseCriticalUseStatus: "frozen_for_release_critical_screens",
      releaseConfigManifestId: "release-config-manifest-submitted",
      reviewerId: "ux-reviewer",
      reviewedAt: "2026-10-01T00:16:00.000Z",
      frozenAt: "2026-10-01T00:16:00.000Z",
    },
  ];
}

const workflowStateTransitionEdges = {
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

const workflowStateTransitionFixtures = Object.entries(workflowStateTransitionEdges).flatMap(([entityType, transitions]) =>
  transitions.map(([priorState, requestedNextState], index) => ({
  id: `workflow-state-transition-${entityType}-${index + 1}`,
  entityType,
  entityId: `${entityType}-state-release-${index + 1}`,
  priorState,
  requestedNextState,
  acceptedNextState: requestedNextState,
  actorId: "release-admin",
  actorRole: "admin",
  guardChecks: ["backend_guard_passed"],
  failedGuardReasons: [],
  lockFreezeArtifactIds: ["release-config-manifest-october-2026-demo"],
  sourceTagProtectedVisibilityState: "source_tag_protected_visibility_preserved",
  timestamp: `2026-10-01T00:00:${String(index).padStart(2, "0")}.000Z`,
}))).concat([
  {
    id: "workflow-state-transition-rejected-rating-backwards",
    entityType: "rating",
    entityId: "rating-state-release",
    priorState: "locked_initial",
    requestedNextState: "draft",
    acceptedNextState: "locked_initial",
    actorId: "release-admin",
    actorRole: "admin",
    guardChecks: ["preserve_original_locked_rating"],
    failedGuardReasons: ["transition_not_allowed:locked_initial->draft"],
    lockFreezeArtifactIds: ["release-config-manifest-october-2026-demo"],
    sourceTagProtectedVisibilityState: "source_tag_protected_visibility_preserved",
    timestamp: "2026-10-01T00:00:59.000Z",
  },
]);

const raterDataCategories = [
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
const accessibilityChecks = ["keyboard", "screen_reader", "focus_order", "non_color_status", "zoom", "mobile_touch", "reduced_motion", "timeout_recovery", "locale_sensitive_dates", "readability"];
const accessibilityToolingPolicyVersion = ACCESSIBILITY_TOOLING_POLICY_VERSION;
const accessibilityWcagConformanceTarget = REQUIRED_ACCESSIBILITY_WCAG_CONFORMANCE_TARGET;
const accessibilityTestToolchain = REQUIRED_ACCESSIBILITY_TEST_TOOLCHAIN;
const accessibilityAssistiveTechnologyMatrix = REQUIRED_ACCESSIBILITY_ASSISTIVE_TECH_MATRIX;
const accessibilityEvidenceArtifactTypes = REQUIRED_ACCESSIBILITY_EVIDENCE_ARTIFACT_TYPES;
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
const queuePolicyComponents = [
  "live_gold_duplicate_validation_mix",
  "topic_routing",
  "tier_routing",
  "safe_decline_reassignment",
  "same_position_order",
  "randomization_stratification_seed",
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
const policyActionKinds = [
  "protected_render",
  "assignment_issue",
  "rating_lock",
  "revision_submit",
  "discussion_open",
  "adjudication_finalize",
  "label_snapshot_freeze",
  "release_report_materialize",
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
const queueFreshnessLanes = ["assignment", "draft", "discussion", "adjudication", "model_evaluation_job", "hidden_benchmark_submission", "export", "outbox", "delayed_report"];
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
const clientSurfaces = ["rating", "practice", "discussion", "adjudication", "calibration", "release_review", "hidden_benchmark_submission", "rater_data_governance"];
const clientSurfaceChecks = [
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
const auditChainProtectedDataExposureClassByEventKind = {
  governance_approval: "redacted_metadata_only",
  manifest_activation: "redacted_metadata_only",
  protected_label_access: "protected_label_access_redacted",
  unblinding: "unblinding_redacted",
  deprotection: "deprotection_redacted",
  hidden_benchmark_release: "hidden_benchmark_release_redacted",
  training_export_release: "training_export_release_redacted",
};
const qualificationScopes = ["expert_rating", "adjudicator", "topic_specialist", "hidden_benchmark_expert", "primary_rater_anchor"];
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
const compensationEligibilityPolicy =
  "pay only QA-accepted eligible work units, approved training completion, and valid safe-decline or conflict disclosures; never pay for score direction, agreement, rank, or hidden-benchmark performance";
const payrollLegalImplementationPolicy =
  "US pilot uses counsel-reviewed contractor or stipend classification, tax onboarding before paid work, and jurisdiction-specific payroll approval before non-US payments";
const paymentDataSeparationPolicy =
  "payment identity, tax, and payout account data stay in the payroll system outside annotation events; annotation records store only payment eligibility ids";
const modelProviderRunClasses = ["model_evaluation", "model_judge", "critique_generation", "model_assisted_check"];
const ratingTaskOutputUses = ["blind_initial_rating", "expert_check", "adjudication_label"];
const ratingScoreInputSplits = ["release_critical", "validation", "hidden_benchmark"];
const draftStorageLanes = ["protected", "validation", "hidden_benchmark", "release_critical", "adjudication", "rater_data_governance"];
const prohibitedDraftClientPersistence = ["local_storage", "session_storage", "indexed_db", "persistent_offline_cache", "downloaded_recovery_blob"];
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
const rubricLintRules = [
  "missing_required_score",
  "clarity_branch_consistency",
  "correctness_strength_consistency",
  "centrality_strength_product_gap",
  "dead_weight_rationale",
  "verification_status_missing",
];
const rubricLintTriggerThresholds = {
  missing_required_score: { missingScoreCountMin: 1 },
  clarity_branch_consistency: { clarityBelow: 0.5, provisionalNonClarityRequiresReview: true },
  correctness_strength_consistency: { correctnessMax: 0.25, strengthMin: 0.75 },
  centrality_strength_product_gap: { overallProductGapMin: 0.25 },
  dead_weight_rationale: { deadWeightMin: 0.7 },
  verification_status_missing: { correctnessSensitiveQueuesRequireStatus: true },
};
const rubricLintAcknowledgementModes = ["acknowledge", "explain", "route_to_qa"];
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
const practiceSandboxSourceAnchorIds = [
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
const scoreExplanationTriggerRules = [
  "extreme_score",
  "score_inconsistency",
  "overall_product_gap",
  "surprising_score",
  "unclear_target",
  "high_stakes_workflow",
  "post_discussion_revision",
  "exposure_familiarity_conflict_uncertainty",
];
const ratingEscalationTriggerRules = [
  "low_clarity_single",
  "low_clarity_two_or_more",
  "overall_spread",
  "centrality_strength_product_spread",
  "correctness_spread",
  "insufficient_topic_expertise",
  "needs_verification",
  "zero_correctness_nonzero_strength",
  "nonclarity_provisional_with_clarity_gte_threshold",
  "correctness_not_assessable_with_clarity_gte_threshold",
  "materially_different_plausible_interpretations",
  "vague_good_objection_gesture",
  "clearly_unsatisfactory_imprecision",
  "background_knowledge_dispute",
];
const ratingEscalationServiceLevels = Object.fromEntries(
  ratingEscalationTriggerRules.map((trigger) => [trigger, `service_level_for_${trigger}`]),
);
const protectedArtifactTypes = ["prompt", "response", "log", "cache", "backup", "staging_replay"];
const spotCheckSamplingDimensions = ["source_family", "topic", "item_length", "rater_tier", "score_band"];
const spotCheckSamplingStrata = REQUIRED_SPOT_CHECK_SAMPLING_STRATA;
const spotCheckMinimumRateByStratum = REQUIRED_SPOT_CHECK_MINIMUM_RATE_BY_STRATUM;
const spotCheckMinimumCountByStratum = REQUIRED_SPOT_CHECK_MINIMUM_COUNT_BY_STRATUM;
const diagnosticDeferralDiagnosticClasses = REQUIRED_DIAGNOSTIC_DEFERRAL_DIAGNOSTIC_CLASSES;
const diagnosticDeferralPublicVisibilityLevels = REQUIRED_DIAGNOSTIC_DEFERRAL_PUBLIC_VISIBILITY_LEVELS;
const diagnosticDeferralClaimSuppressionActions = REQUIRED_DIAGNOSTIC_DEFERRAL_CLAIM_SUPPRESSION_ACTIONS;
const diagnosticDeferralVisibilityRules = REQUIRED_DIAGNOSTIC_DEFERRAL_VISIBILITY_RULES;
const diagnosticDeferralReviewStatuses = REQUIRED_DIAGNOSTIC_DEFERRAL_REVIEW_STATUSES;

function spotCheckSamplingPolicy(id = "spot-check-sampling-policy-submitted") {
  return {
    id,
    policyVersion: SPOT_CHECK_SAMPLING_POLICY_VERSION,
    sampledWorkflowStrata: spotCheckSamplingStrata,
    samplingDimensions: spotCheckSamplingDimensions,
    selectionMethods: ["random", "stratified_random"],
    minimumSamplingRateByStratum: spotCheckMinimumRateByStratum,
    minimumSampleCountByStratum: spotCheckMinimumCountByStratum,
    ordinaryRatingStatusRequired: "apparently_ordinary_non_escalated",
    excludedFromIndependentRaterCountRequired: true,
    sampleExclusionRule:
      "Spot-check QA rows are quality-audit observations and are excluded from independent blind-rater counts, label denominators, and consensus claims unless separately promoted through adjudication.",
    labelMutationRule:
      "Spot-check review does not directly mutate locked labels; revisions or adjudication require explicit linked workflow artifacts.",
    lmcaSourceBoundary:
      "Project default spot-check sampling rates are frozen here; LMCA motivates blind-rater denominator integrity but does not state these exact QA sampling rates.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function diagnosticDeferralVisibilityPolicy(id = "diagnostic-deferral-visibility-policy-submitted") {
  return {
    id,
    policyVersion: DIAGNOSTIC_DEFERRAL_VISIBILITY_POLICY_VERSION,
    diagnosticClasses: diagnosticDeferralDiagnosticClasses,
    publicVisibilityLevels: diagnosticDeferralPublicVisibilityLevels,
    claimSuppressionActions: diagnosticDeferralClaimSuppressionActions,
    visibilityRules: diagnosticDeferralVisibilityRules,
    allowedReviewStatuses: diagnosticDeferralReviewStatuses,
    publicSummaryRule: diagnosticDeferralVisibilityRules.robustnessClaims,
    privateOnlyRule: diagnosticDeferralVisibilityRules.privateOnly,
    protectedContentRule: diagnosticDeferralVisibilityRules.protectedContent,
    approvalRule: diagnosticDeferralVisibilityRules.approval,
    sourceBoundary:
      "Project default diagnostic-deferral public visibility is frozen here; LMCA motivates diagnostic limitation disclosure but does not state these exact platform visibility levels.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
}

function completePolicyBundleFixtures() {
  return {
    visibilityPolicies: [
      {
        id: "visibility-policy-submitted",
        policyVersion: "visibility-policy-rlhf88-v1",
        roleClasses: ["rater", "graduate", "phd", "expert", "admin", "auditor"],
        workflowStates: ["queued", "draft", "locked_initial", "post_lock", "adjudication", "release_review"],
        fieldClasses: policyBundleFieldClasses,
        allowedReadActions: ["read_sanitized_screen_state", "read_own_assignment", "read_authorized_audit_summary"],
        allowedWriteActions: ["submit_rating", "submit_issue", "submit_guarded_transition", "submit_authorized_workflow_artifact"],
        roleFieldActionMatrix: visibilityRoleFieldActionMatrix,
        sourceTagVisibilityRules: "hide source metadata and admin tags from initial raters",
        benchmarkGoldModelPeerVisibilityRules: "hide benchmark membership, gold answers, model judge scores, peer scores, and peer rationales before allowed locks",
        backendEnforced: true,
        exposureLogRequired: true,
      },
    ],
    ratingWorkflowProfiles: [
      {
        id: "rating-workflow-profile-submitted",
        profileVersion: "rating-workflow-profile-rlhf90-v1",
        taskModesCovered: ratingWorkflowTaskModes,
        requiredScoreFields: ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"],
        requiredConfidenceJudgment: true,
        requiredConfidenceValues: ["low", "medium", "high"],
        scoreExplanationPolicyId: "score-explanation-policy-submitted",
        optionalRationaleFields: ["general_rating_note"],
        triggerRequiredRationaleFields: ["score_explanation"],
        requiredIssuePanels: ["safe_decline", "source_recognition", "item_issue_report"],
        optionalIssuePanels: ["evidence_spans", "interpretation_target_map", "correctness_verification_workspace"],
        disabledControls: ["peer_score_view_before_initial_lock", "model_judge_score_view_before_initial_lock", "hidden_metadata_view"],
        evidenceSpanRequirednessPolicy: "optional_ordinary_required_for_disputed_release_critical",
        verificationWorkspaceRequirednessPolicy: "required_for_correctness_sensitive_unresolved_cases",
        interpretationTargetMapRequirednessPolicy: "required_for_interpretation_disputes_and_release_critical_escalations",
        safeDeclineAvailable: true,
        preSubmitLintPolicy: "pre-submit-assist-submitted",
      },
    ],
    scoreExplanationPolicies: [
      {
        id: "score-explanation-policy-submitted",
        policyVersion: "score-explanation-policy-rlhf90-v1",
        coveredWorkflowSplitClasses: [...ratingWorkflowTaskModes, ...protectedUiLaneClasses],
        ordinaryRequiredFields: ["seven_scores", "confidence_low_medium_high"],
        optionalFields: ["general_rating_note", "optional_evidence_spans"],
        triggerList: scoreExplanationTriggerRules,
        extremeScoreThresholdLow: 0.1,
        extremeScoreThresholdHigh: 0.9,
        inconsistencyRules: ["correctness_lte_0_25_and_strength_gte_0_75"],
        overallVsCentralityStrengthGapThreshold: 0.25,
        targetUnclearTrigger: true,
        highStakesWorkflowTrigger: true,
        postDiscussionRevisionTrigger: true,
        exposureFamiliarityConflictUncertaintyTrigger: true,
        protectedStatusBlindPromptCopy: "A short explanation is required by the active workflow policy for this item.",
        sentenceGuidance: "one_or_two_sentences",
        qaRoutingPolicy: "route triggered explanations to QA without source, label, peer, model, or protected-status disclosure",
        protectedSplitCompatibilityClass: "protected_split_compatible_trigger_required_v1",
        protectedSplitCompatible: true,
        createdBy: "policy-admin",
        timestamp: "2026-10-01T00:00:00.000Z",
      },
    ],
    ratingEscalationPolicies: [
      {
        id: "rating-escalation-policy-submitted",
        policyVersion: "rating-escalation-policy-rlhf90-v1",
        triggerList: ratingEscalationTriggerRules,
        lowClarityThreshold: 0.5,
        lowClarityAdjudicationCount: 2,
        initialOverallSpreadThreshold: 0.35,
        centralityStrengthProductSpreadThreshold: 0.3,
        correctnessSpreadThreshold: 0.35,
        postDiscussionMaxSpreadTarget: 0.3,
        serviceLevelByTrigger: ratingEscalationServiceLevels,
        protectedStatusBlindRoutingCopy: "Generic workflow policy requires additional review for this item.",
        lmcaSourceBoundary: "Project default thresholds are used because LMCA does not state exact numeric escalation rules.",
        createdBy: "policy-admin",
        frozenAt: "2026-10-01T00:00:00.000Z",
        timestamp: "2026-10-01T00:00:00.000Z",
      },
    ],
    uiExperimentPolicies: [
      {
        id: "ui-experiment-policy-submitted",
        policyVersion: "ui-experiment-policy-rlhf88-v1",
        sensitivityPowerPolicyVersion: UI_VARIANT_SENSITIVITY_POWER_POLICY_VERSION,
        coveredSplitLaneClasses: protectedUiLaneClasses,
        allowedUiVariantIds: ["rlhf88-task-first-compatible"],
        blockedExperimentClasses: blockedUiExperimentClasses,
        unregisteredMaterialChangesBlocked: true,
        sensitivitySnapshotRequired: true,
        sensitivityPrimaryOutcomeMetric: "overall_score_mean_difference",
        sensitivityMinimumPower: REQUIRED_UI_VARIANT_SENSITIVITY_MINIMUM_POWER,
        sensitivityAlpha: REQUIRED_UI_VARIANT_SENSITIVITY_ALPHA,
        sensitivityMinimumDetectableEffectOverall: REQUIRED_UI_VARIANT_SENSITIVITY_MDE_OVERALL,
        sensitivityMinimumPerVariantCellCount: REQUIRED_UI_VARIANT_SENSITIVITY_MIN_CELL_COUNT,
        sensitivityMaxProtectedVariantImbalance: REQUIRED_UI_VARIANT_SENSITIVITY_MAX_IMBALANCE,
        sensitivityUnderpoweredDisposition: "block_or_quarantine_protected_claims_until_powered_sensitivity_snapshot_exists",
        uxSimplificationCompatibilityRule: "UX simplification requires passing review",
        lmcaSourceBoundary:
          "Project default UI-variant sensitivity power thresholds are frozen here; LMCA does not state exact statistical power thresholds.",
      },
    ],
    preSubmitAssistPolicies: [
      {
        id: "pre-submit-assist-submitted",
        policyVersion: "pre-submit-assist-rlhf88-v1",
        rubricVersion: "appendix-f-operational-v1",
        workflowProfileId: "rating-workflow-profile-submitted",
        permittedAssistTypes: ["deterministic_completeness_check", "rubric_anchor_reminder", "non_directive_issue_prompt"],
        prohibitedInputs: prohibitedAssistInputs,
        deterministic: true,
        labelBlind: true,
        nonDirective: true,
        targetScoreSuggestionsProhibited: true,
        protectedSplitEligible: true,
      },
    ],
    accessibilityConformanceReports: [
      {
        id: "accessibility-conformance-submitted",
        toolingPolicyVersion: accessibilityToolingPolicyVersion,
        wcagConformanceTarget: accessibilityWcagConformanceTarget,
        workflowProfileIds: ["rating-workflow-profile-submitted"],
        screenIds: accessibilitySurfaces,
        raterInstructionRenderVersionIds: ["rater-instruction-render-submitted"],
        uiExperimentPolicyId: "ui-experiment-policy-submitted",
        uxSimplificationPolicyId: "ux-policy-submitted",
        testedLocaleSet: ["en-US"],
        checksPassed: accessibilityChecks,
        testToolchain: accessibilityTestToolchain,
        assistiveTechnologyMatrix: accessibilityAssistiveTechnologyMatrix,
        evidenceArtifactTypes: accessibilityEvidenceArtifactTypes,
        raterUxAcceptanceChecks: REQUIRED_RATER_UX_ACCEPTANCE_CHECKS,
        accessibilityEvidenceArtifactIds: [
          "accessibility-automated-audit-submitted",
          "accessibility-keyboard-walkthrough-submitted",
          "accessibility-screen-reader-transcript-submitted",
          "accessibility-focus-order-trace-submitted",
          "accessibility-contrast-zoom-review-submitted",
          "accessibility-mobile-touch-review-submitted",
          "accessibility-readability-review-submitted",
          "rater-ux-acceptance-submitted",
        ],
        toolingReviewStatus: "passed",
        readabilityReviewStatus: "passed",
        sourceBoundary:
          "Project default accessibility test tooling is frozen here; LMCA motivates accessible volunteer workflows but does not state exact accessibility tools.",
        failures: [],
        mitigations: [],
        nonStaffPromotionBlocker: false,
        manualAssistiveTechReviewRequired: true,
        automatedAuditAloneInsufficient: true,
      },
    ],
  };
}

function completeReleaseConfigManifestFixtures() {
  const canonicalizationProfile = {
    id: "canonicalization-profile-submitted",
    name: "Submitted governed bundle canonicalization",
    version: "canonical-json-sha256-v1",
    hashAlgorithm: "sha256",
    materializationQueryRules: "stable materialized query per governed bundle family",
    includedFieldPolicy: "semantic fields only",
    rowOrderingPolicy: "order by family, version, id",
    arrayOrderingPolicy: "sort set-like arrays before hashing",
	    nullEmptyHandling: "preserve null and empty distinctions",
	    unicodeNormalization: "NFC",
	    timestampNumberEncoding: "UTC ISO timestamps and decimal-string numbers",
	    environmentScopeFields: ["releaseId", "runtime", "buildId"],
	    nonsemanticMetadataExclusionRules: ["receivedAt", "actorHash", "remoteAddressHash"],
	    testVectorIds: ["governed-bundle-vector-v1"],
	    createdBy: "release-admin",
	    activatedAt: "2026-10-01T00:00:00.000Z",
	  };
	  const governedBundleRecords = governedBundleFamilies.map((bundleFamily, index) => ({
    id: `governed-bundle-submitted-${bundleFamily}`,
    bundleFamily,
    semanticVersion: `rlhf88-${index + 1}`,
	    canonicalizationProfileId: canonicalizationProfile.id,
	    canonicalContentHash: `sha256:submitted-${bundleFamily}`,
	    materializedRowCount: index + 1,
	    bundleContentSchemaVersion: `${bundleFamily}-bundle-schema-v1`,
	    canonicalizationTestVectorId: "governed-bundle-vector-v1",
	    semanticMutationPolicy: "new_version_required",
	    manifestActivationPolicy: "verified_before_manifest_activation",
	    appendOnlyActivationStatus: "activated",
	    activatedBy: "release-admin",
	    activatedAt: "2026-10-01T00:01:00.000Z",
	  }));
	  const governedBundleVerifications = governedBundleRecords.map((bundle) => ({
	    id: `governed-bundle-verification-submitted-${bundle.bundleFamily}`,
	    governedBundleId: bundle.id,
	    bundleFamily: bundle.bundleFamily,
	    semanticVersion: bundle.semanticVersion,
	    canonicalizationProfileId: bundle.canonicalizationProfileId,
	    verificationStatus: "passed",
	    expectedHash: bundle.canonicalContentHash,
	    observedHash: bundle.canonicalContentHash,
	    materializedRowCount: bundle.materializedRowCount,
	    manifestActivationBlockedOnMismatch: true,
	    verifiedAt: "2026-10-01T00:01:30.000Z",
	  }));
  const releaseConfigManifest = {
    id: "release-config-manifest-submitted",
    releaseId: "october-2026-demo",
    name: "Submitted October 2026 release config",
    version: "release-config-rlhf88-v1",
    canonicalManifestHash: "sha256:submitted-release-config",
    codeCommitId: "commit-submitted",
    buildId: "build-submitted",
    rubricVersion: "appendix-f-operational-v1",
    scoredDimensionSchemaVersion: "seven-dimension-lmca-v1",
    releaseGateProfileId: "release-gate-workflow-new",
    visibilityPolicyId: "visibility-policy-workflow-new",
    uiExperimentPolicyId: "ui-experiment-policy-workflow-new",
    uxSimplificationPolicyIds: ["ux-policy-workflow-new"],
    preSubmitAssistPolicyId: "pre-submit-assist-workflow-new",
    scoreInputPolicyIds: ["score-input-policy-workflow-new"],
    workflowProfileIds: ["rating-workflow-profile-workflow-new"],
    raterInstructionRenderVersionIds: ["rater-instruction-render-workflow-new"],
    rubricLintConfigIds: ["rubric-lint-config-workflow-new"],
    queuePolicySnapshotId: "queue-policy-workflow-new",
    labelSnapshotIds: ["snapshot-oct-api"],
    pairwiseComparisonSnapshotIds: ["pairwise-snapshot-workflow-new"],
    metricConfigIds: ["metric-config-workflow-new"],
    scoringCodeChecksums: ["sha256:submitted-scoring"],
    parserConfigIds: ["parser-workflow-new"],
    promptTemplateIds: ["prompt-workflow-new"],
    governedBundleIds: governedBundleRecords.map((bundle) => bundle.id),
    bindingFamilies: releaseConfigBindings,
    frozenAt: "2026-10-01T00:02:00.000Z",
  };
	  return {
    itemTextNormalizationPolicies: [itemTextNormalizationPolicy("item-text-normalization-policy-submitted")],
	    governedBundleCanonicalizationProfiles: [canonicalizationProfile],
	    governedBundleRecords,
	    governedBundleVerifications,
	    releaseConfigManifests: [releaseConfigManifest],
    releaseConfigManifestVerifications: [
      {
        id: "release-config-manifest-verification-submitted",
        manifestId: releaseConfigManifest.id,
        verificationStatus: "passed",
        expectedHash: releaseConfigManifest.canonicalManifestHash,
        observedHash: releaseConfigManifest.canonicalManifestHash,
        verifiedAt: "2026-10-01T00:03:00.000Z",
      },
    ],
  };
}

function completeOperationalControlFixtures() {
  const policyActionKindsSubmitted = policyActionKinds.map((actionKind) => ({
    id: `policy-action-kind-submitted-${actionKind}`,
    actionKind,
    sideEffecting: actionKind !== "protected_render",
    protectedRender: actionKind === "protected_render",
    requiresCurrentDecision: true,
	    requiresManifestBinding: true,
	    requiresActorBinding: true,
	    requiresOutputSchemaBinding: true,
	    requiresPhaseGateBinding: true,
	    requiresIdempotencyBinding: true,
	    replayProtection: actionKind === "protected_render" ? "idempotency_bound" : "single_use",
	    wrongScopeBehavior: "fail_closed",
	    activatedAt: "2026-10-01T00:00:00.000Z",
  }));
  const policyDecisionRecords = policyActionKindsSubmitted.map((actionKind) => ({
    id: `policy-decision-submitted-${actionKind.actionKind}`,
    actionKindId: actionKind.id,
    actionKind: actionKind.actionKind,
    decisionStatus: "allow",
    actorId: "release-admin",
	    actorRole: "admin",
	    manifestId: "release-config-manifest-submitted",
	    manifestHash: "sha256:release-config-manifest-submitted",
	    phaseGateBundleId: "implementation-phase-gate-submitted",
	    phaseGateBundleHash: "sha256:implementation-phase-gate-submitted",
	    releaseId: "october-2026-demo",
	    outputSchemaVersion: "lmca-policy-decision-v1",
	    outputSchemaHash: `sha256:output-schema-${actionKind.actionKind}`,
	    targetArtifactIds: [`target-${actionKind.actionKind}`],
	    idempotencyKey: `idempotency-${actionKind.actionKind}`,
	    singleUse: actionKind.actionKind !== "protected_render",
	    replayStatus: "unused",
	    manifestBindingStatus: "matched",
	    outputSchemaBindingStatus: "matched",
	    phaseGateBindingStatus: "matched",
	    idempotencyBindingStatus: "matched",
	    expiresAt: "2026-10-01T01:00:00.000Z",
	    decidedAt: "2026-10-01T00:01:00.000Z",
	  }));
  const clientSurfaceIntegrityPolicies = clientSurfaces.map((surface) => ({
    id: `client-surface-integrity-submitted-${surface}`,
	    releaseId: "october-2026-demo",
	    surface,
    policyVersion: CLIENT_SURFACE_INTEGRITY_POLICY_VERSION,
	    thirdPartyAnalyticsProhibited: true,
	    thirdPartyPixelsProhibited: true,
	    thirdPartyResourcesProhibited: true,
	    thirdPartyResourceAllowlist: [],
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
    cspDirectives: REQUIRED_CLIENT_SURFACE_CSP_DIRECTIVES,
	    firstPartyTelemetryAllowlist: REQUIRED_CLIENT_SURFACE_TELEMETRY_ALLOWLIST,
	  }));
  const externalWormAuditLogPolicy = {
    id: "external-worm-audit-log-policy-submitted",
    releaseId: "october-2026-demo",
    policyVersion: externalWormAuditLogPolicyVersion,
    ledgerBackend: externalWormAuditLedgerBackend,
    ledgerPointerPrefix: externalWormAuditPointerPrefix,
    receiptHashAlgorithm: externalWormAuditReceiptHashAlgorithm,
    receiptFields: externalWormAuditReceiptFields,
    retentionYears: externalWormAuditRetentionYears,
    appendOnlyMode: "compliance_lock_no_delete_no_overwrite",
    verificationCadence: externalWormAuditVerificationCadence,
    receiptVerificationRule:
      "Every sensitive audit-chain event must include a sha256 receipt hash and a WORM ledger pointer using the frozen prefix.",
    fallbackRule: externalWormAuditFallbackRule,
    redactionBoundary:
      "External WORM receipts contain hashes, redacted roles, event kinds, and artifact ids only; protected labels, hidden text, raw source text, and private rater data are excluded.",
    sourceBoundary:
      "Project default external WORM audit-log implementation is frozen here; LMCA motivates audit integrity but does not state exact WORM tooling.",
    owner: "release-operations",
    approver: "security-reviewer",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
	  const sensitiveAuditChainEvents = auditChainEventKinds.map((eventKind, index) => ({
	    id: `sensitive-audit-event-submitted-${index + 1}`,
	    chainId: "sensitive-audit-chain-submitted",
	    releaseId: "october-2026-demo",
	    sequence: index + 1,
	    eventKind,
	    actionKind: eventKind,
	    policyDecisionId: `policy-decision-submitted-${auditChainPolicyActionKindByEventKind[eventKind]}`,
	    governanceApprovalRecordId: `governance-approval-submitted-${eventKind}`,
	    actorHash: `sha256:actor-${index + 1}`,
	    approverHashes: ["sha256:approver-a", "sha256:approver-b"],
	    affectedArtifactIds: [`artifact-${eventKind}`],
	    beforeHash: `sha256:before-${eventKind}`,
	    afterHash: `sha256:after-${eventKind}`,
	    previousEventHash: index === 0 ? null : `sha256:event-${index}`,
	    eventHash: `sha256:event-${index + 1}`,
	    redactedReasonClasses: ["high_impact_action", eventKind],
	    protectedDataExposureClass: auditChainProtectedDataExposureClassByEventKind[eventKind],
	    externalWormAuditLogPolicyId: externalWormAuditLogPolicy.id,
	    externalWormLedgerPointer: `worm:submitted:${index + 1}`,
	    externalWormReceiptHash: `sha256:submitted-worm-receipt-${index + 1}`,
	    redactionPolicy: "redact protected labels, hidden text, raw source text, and private rater data",
	    occurredAt: "2026-10-01T00:02:00.000Z",
	  }));
  const sensitiveAuditChainGovernanceApprovalRecords = auditChainEventKinds.map((eventKind) => ({
    id: `governance-approval-submitted-${eventKind}`,
    actionKind: auditChainPolicyActionKindByEventKind[eventKind],
    affectedArtifactIds: [`artifact-${eventKind}`],
    proposedBy: "release-admin",
    approver1: "independent-approver-a",
    approver2: "independent-approver-b",
    independenceSeparationOfDutiesStatus: "independent_two_person_approval",
    reasonCode: `${eventKind}_audit_chain_approval`,
    visibilitySplitMetricLeaderboardImpactSummary: "redacted high-impact audit-chain approval covers the affected artifact ids",
    approvalTimestamp: "2026-10-01T00:01:30.000Z",
  }));
  return {
    policyActionKinds: policyActionKindsSubmitted,
    policyDecisionRecords,
    policyDecisionConsumptions: policyDecisionRecords
      .filter((decision) => decision.actionKind !== "protected_render")
      .map((decision, index) => ({
        id: `policy-decision-consumption-submitted-${decision.actionKind}`,
        decisionId: decision.id,
        actionKind: decision.actionKind,
        manifestId: decision.manifestId,
        manifestHash: decision.manifestHash,
        phaseGateBundleId: decision.phaseGateBundleId,
        phaseGateBundleHash: decision.phaseGateBundleHash,
        outputSchemaVersion: decision.outputSchemaVersion,
        outputSchemaHash: decision.outputSchemaHash,
        idempotencyKey: decision.idempotencyKey,
        replayRejected: false,
        scopeMatched: true,
        consumedAt: `2026-10-01T00:03:${String(index).padStart(2, "0")}.000Z`,
      })),
    implementationPhaseGateBundles: [
      {
        id: "implementation-phase-gate-submitted",
        releaseId: "october-2026-demo",
        manifestId: "release-config-manifest-submitted",
        version: "implementation-phase-rlhf87-v1",
        laneStates: phaseGateLaneKinds.map((laneKind) => ({
          laneKind,
          laneId: `lane-${laneKind}`,
          phaseState:
            laneKind === "hidden_benchmark_submission_lane"
              ? "staff_only"
              : "enabled",
          failClosed: true,
          noSideEffectsWhenDisabled: true,
          labelsExposedWhenDisabled: false,
          supportsReleaseClaimsWhenDisabled: false,
        })),
        futurePhaseDefault: "blocked",
        broadeningRequiresManifestActivation: true,
        frozenAt: "2026-10-01T00:04:00.000Z",
      },
    ],
    queueFreshnessPolicies: queueFreshnessLanes.map((lane, index) => ({
      id: `queue-freshness-submitted-${lane}`,
      releaseId: "october-2026-demo",
      lane,
      freshnessWindowMinutes: 30 + index,
      dependencyRevalidationChecks: queueRevalidationChecks,
      backpressureThreshold: 80 + index,
      staleBehavior: lane === "outbox" ? "suppress" : "stale",
      sideChannelSafeNotificationBehavior: "generic delay notice with no protected-status detail",
      queueHealthChecks,
      workerConsumeRevalidationRequired: true,
      renderRevalidationRequired: true,
      submitRevalidationRequired: true,
      backpressureBehavior: "pause or recompute before side effects",
      createdBy: "release-admin",
      frozenAt: "2026-10-01T00:04:30.000Z",
    })),
    queueStaleByDelayScans: queueFreshnessLanes.map((lane, index) => {
      const policyId = `queue-freshness-submitted-${lane}`;
      return {
        id: `queue-stale-scan-submitted-${lane}`,
        policyId,
        lane,
        scanStatus: "passed",
        staleCount: 1,
        maxObservedAgeMinutes: 35 + index,
        backpressureThreshold: 80 + index,
        dependencyRevalidationChecks: queueRevalidationChecks,
        staleTransitionBehavior: lane === "outbox" ? "suppress" : "stale",
        staleTransitionOutcomes: queueStaleTransitionOutcomes,
        queueHealthChecks,
        workerConsumeRevalidationConfirmed: true,
        sideEffectSuppressionConfirmed: true,
        sideChannelSafeNotificationConfirmed: true,
        scannedAt: "2026-10-01T00:05:00.000Z",
      };
    }),
    clientSurfaceIntegrityPolicies,
    clientSurfaceIntegrityChecks: clientSurfaceIntegrityPolicies.map((policy) => ({
      id: `client-surface-integrity-check-submitted-${policy.surface}`,
	    clientSurfaceId: policy.id,
	    surface: policy.surface,
	    checkStatus: "passed",
	    checksPassed: clientSurfaceChecks,
	    failures: [],
	    checkedAt: "2026-10-01T00:06:00.000Z",
	    })),
    cloudSecurityBudgetPolicies: [
      {
        id: "cloud-security-budget-policy-submitted",
        releaseId: "october-2026-demo",
        policyVersion: CLOUD_SECURITY_BUDGET_POLICY_VERSION,
        currency: "USD",
        budgetWindow: "2026-07-01_to_2026-10-31",
        totalBudgetRangeUsd: cloudSecurityBudgetRangeUsd,
        categoryMinimumUsd: cloudSecurityBudgetCategoryMinimumUsd,
        requiredControls: cloudSecurityControls,
        approvalStatuses: cloudSecurityApprovalStatuses,
        monthlySpendReviewRequired: true,
        protectedSplitCostIsolationRequired: true,
        productionReleaseBlockedUntilReserved: true,
        externalWormAuditLogFundingRequired: true,
        overrunEscalationRule:
          "Any cloud or security overrun that threatens protected storage, restore, identity, observability, WORM audit logging, or incident response reserves blocks production release until scope or budget is reapproved.",
        productionReleaseBlockRule:
          "Production release claims require reserved cloud/security budget for hosting, database restore, protected storage, identity/RBAC, observability, security review, incident response, and external WORM audit logging.",
        protectedSplitIsolationFundingRule:
          "Hidden benchmark, protected validation, private rater data, and audit-log retention infrastructure must remain funded independently from public-demo or static-site hosting.",
        sourceBoundary:
          "Project default cloud/security spend controls are frozen here; LMCA motivates protected blinding and audit integrity but does not state exact platform spend bands.",
        owner: "release-operations",
        approver: "security-reviewer",
        frozenAt: "2026-10-01T00:06:30.000Z",
      },
    ],
    externalWormAuditLogPolicies: [externalWormAuditLogPolicy],
    governanceApprovalRecords: sensitiveAuditChainGovernanceApprovalRecords,
    sensitiveAuditChainEvents,
    sensitiveAuditChainVerifications: [
      {
        id: "sensitive-audit-chain-verification-submitted",
	        releaseId: "october-2026-demo",
	        chainStatus: "passed",
	        verifiedEventCount: sensitiveAuditChainEvents.length,
	        failures: [],
	        verifiedAt: "2026-10-01T00:07:00.000Z",
	      },
    ],
  };
}

function completeParticipantSafeguardFixtures() {
  return {
    volunteerIncentivePolicies: [
      {
        id: "volunteer-incentive-submitted",
        policyVersion: "volunteer-incentive-rlhf90-v2",
        allowedCompensationCreditInputs: ["eligible_completed_work", "role", "time_commitment", "training_completion"],
        prohibitedIncentiveSignals,
        compensationCurrency: "USD",
        compensationRateUsdByEligibleUnit,
        monthlyCompensationCapUsd: 600,
        compensationEligibilityPolicy,
        payrollLegalImplementationPolicy,
        paymentDataSeparationPolicy,
        speedEffortGuardrails: "private QA-safe effort bands only; no public speed rewards",
        publicRecognitionPolicy: "participation acknowledgement without scores, speed, agreement, or benchmark ranking",
        privateProgressDashboardPolicy: "private non-gamified progress only",
        calibrationFeedbackUseLimits: "post-lock training-approved feedback only",
        hiddenBenchmarkGoldPerformanceExclusionPolicy: "never use hidden-benchmark or gold performance for incentives",
        leaderboardBadgeRestrictions: "no peer, model, gold, hidden-benchmark, or speed leaderboards",
        frozenAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    raterQualificationRecords: qualificationScopes.map((qualificationScope) => ({
      id: `rater-qualification-submitted-${qualificationScope}`,
      raterId:
        qualificationScope === "primary_rater_anchor"
          ? "rater-a"
          : qualificationScope === "hidden_benchmark_expert"
            ? "expert-1"
            : qualificationScope === "topic_specialist"
              ? "expert-1"
            : `qualified-${qualificationScope}`,
      qualificationScope,
      qualificationSource: qualificationScope === "primary_rater_anchor" ? "manual_expert_review" : "certification_pack",
      evidenceArtifactReference: `qualification-evidence-${qualificationScope}`,
      approvedRoles: qualificationScope === "adjudicator" ? ["expert", "adjudicator"] : ["expert"],
      topicFamilyScope: qualificationScope === "topic_specialist" ? ["politics", "philosophy_of_mind"] : ["ai_safety", "decision_theory", "normative_ethics"],
      splitWorkflowEligibility: qualificationWorkflowEligibility,
      expiryReviewDate: "2027-01-31",
      approver: "release-admin",
      timestamp: "2026-10-01T00:01:00.000Z",
    })),
    languageArtifactAssessments: [
      {
        id: "language-artifact-submitted",
        positionId: "pos-ai-prior",
        critiqueId: "crit-ai-base-rate",
        artifactType: "machine_translation_residue",
        sourceLanguage: "es",
        translationStatus: "machine_translation_reviewed",
        sourceAdaptationRoute: "VivesDebate_adapted",
        pinDownabilityImpact: "none",
        substantiveAmbiguityImpact: "none",
        correctnessImpact: "none",
        deadWeightImpact: "none",
        overallQualityImpact: "none",
        automaticScorePenaltyApplied: false,
        reviewerRole: "expert",
        visibilityState: "release_safe_summary",
      },
    ],
    sourceRecognitionEvents: [
      {
        id: "source-recognition-submitted",
        assignmentId: "assign-ai-base-rate",
        raterId: "demo-rater",
        recognitionType: "source_recognized",
        raterAction: "safe_decline",
        independentBlindEligibilityEffect: "excluded_from_independent_protected_blind_denominator",
        protectedStatusHiddenFromRater: true,
        reviewerResolution: "paused_and_reassigned",
      },
    ],
    modelProviderDataHandlingPolicies: modelProviderRunClasses.map((coveredRunClass) => ({
      id: `model-provider-data-handling-submitted-${coveredRunClass}`,
      policyVersion: modelProviderEndpointContractPolicyVersion,
      providerEndpointClass: `approved-${coveredRunClass}`,
      coveredRunClass,
      endpointContractClauses: modelProviderEndpointContractClauses,
      endpointContractLanguageFrozen: true,
      contractAppliesToProtectedContent: true,
      approvedSplitContentClasses: ["release_critical", "protected_validation", "hidden_benchmark"],
      noTrainingOnInputsOutputs: true,
      noPromptOrOutputReuse: true,
      unnecessaryHumanReviewProhibited: true,
      logRetentionWindowDays: 30,
      subprocessorsSummary: "approved bounded processing route",
      deletionOrRetentionProofRequired: true,
      protectedContentEligible: true,
      approvalStatus: "approved",
      reviewer: "release-admin",
      expiresAt: "2026-12-31T00:00:00.000Z",
    })),
  };
}

function completeRatingExperienceFixtures() {
  const scoreInputPolicy = {
    id: "score-input-policy-submitted",
    policyVersion: "score-input-rlhf85-v1",
    coveredWorkflowSplitClasses: ratingScoreInputSplits,
    scoreControlMode: "numeric_plus_slider",
    manualNumericEntryAvailable: true,
    initialDefaultState: "unset_required",
    allowedPrecision: 0.001,
    defaultStep: 0.01,
    sliderSnapBehavior: "no_hidden_midpoint_default",
    keyboardIncrement: 0.01,
    displayRounding: 3,
    rawStoragePrecision: 6,
    exportQuantizationPolicy: "declare_quantization_per_export",
    correctionOverridePolicy: "append_only_correction_with_reason",
    protectedSplitCompatibilityClass: "fine_grained_unset_required_v1",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
  const draftStoragePolicy = {
    id: "draft-storage-policy-submitted",
    policyVersion: "draft-storage-rlhf89-v1",
    coveredWorkflowSplitClasses: draftStorageLanes,
    serverSidePersistenceDefault: true,
    protectedLanePersistence: "server_side_by_assignment_id",
    clientStatePolicy: "ephemeral_in_memory_only",
    prohibitedClientPersistenceMechanisms: prohibitedDraftClientPersistence,
    localStorageProhibited: true,
    sessionStorageProhibited: true,
    indexedDbProhibited: true,
    persistentOfflineCacheProhibited: true,
    downloadedRecoveryBlobProhibited: true,
    clearOnLogoutRevocation: true,
    staleDraftDependencyBlocker: true,
    ordinaryPracticeExceptionPolicy: "allowed only when declared by ClientSurfaceIntegrityPolicy and excluded from protected lanes",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
  const rubricLintConfig = {
    id: "rubric-lint-config-submitted",
    rubricVersion: "appendix-f-operational-v1",
    workflowProfileId: "rating-workflow-profile-submitted",
    preSubmitAssistPolicyId: "pre-submit-assist-submitted",
    lintRuleIds: rubricLintRules,
    thresholdVersion: "rubric-lint-thresholds-rlhf90-v1",
    triggerThresholds: rubricLintTriggerThresholds,
    triggerConditions: "deterministic rubric consistency checks only",
    severityPolicy: "warn_acknowledge_or_route_to_qa",
    acknowledgementModes: rubricLintAcknowledgementModes,
    requiredAcknowledgementExplanationPolicy: "rater must acknowledge or explain before lock",
    qaRoutingPolicy: "route unresolved lint findings to QA without exposing labels",
    protectedSplitEligible: true,
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
  const compatibilityPolicy = raterInstructionCompatibilityPolicy("rater-instruction-compatibility-policy-submitted");
  const renderVersion = {
    id: "rater-instruction-render-submitted",
    rubricVersion: "appendix-f-operational-v1",
    workflowProfileId: "rating-workflow-profile-submitted",
    renderedRubricAnchorChecksum: "sha256:submitted-rubric-anchor",
    scoreInputPolicyId: scoreInputPolicy.id,
    uxSimplificationPolicyId: "ux-policy-submitted",
    scoreControlMode: "numeric_plus_slider",
    scoreDefaultPolicy: "unset_required",
    displayedExampleIds: ["source-anchor-ai-base-rate"],
    workflowBannerTextVersion: "critique-not-position-v1",
    issuePanelCopyVersion: "issue-panel-blind-safe-v1",
    preSubmitAssistPolicyId: "pre-submit-assist-submitted",
    rubricLintConfigId: rubricLintConfig.id,
    accessibilityVisualVariant: "wcag-aa-task-first",
    uiExperimentPolicyId: "ui-experiment-policy-submitted",
    raterInstructionCompatibilityPolicyId: compatibilityPolicy.id,
    renderCompatibilityClass: "protected_release_critical_same_policy_family",
    compatibilityEvidenceStatus: "compatible_review_passed",
    protectedSplitEligibilityPolicy: "compatible_with_protected_splits_when_policy_family_matches_or_quarantined_sensitivity_snapshot_required",
    sensitivitySnapshotPolicy: "incompatible_or_mixed_render_versions_require_quarantined_sensitivity_snapshot",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
  const confidenceScalePolicy = scoreConfidenceScalePolicy("score-confidence-scale-policy-submitted");
  const batchReviewRequirednessPolicy = samePositionBatchReviewRequirednessPolicy("same-position-batch-review-requiredness-policy-submitted");
  const comprehensionAudit = raterInstructionComprehensionAudit(
    "rater-instruction-comprehension-audit-submitted",
    renderVersion.id,
    compatibilityPolicy.id,
  );
  return {
    taskOutputEligibilityPolicies: [
      {
        id: "task-output-eligibility-submitted",
        policyVersion: "task-output-eligibility-rlhf85-v1",
        assignmentOutputClasses: ["blind_initial_rating", "revision", "expert_check", "adjudication_label", "model_assisted_check", "draft"],
        eligibleLabelSnapshotUses: ratingTaskOutputUses,
        excludedDenominatorClasses: ["draft", "safe_decline", "source_recognition_compromised", "model_assisted_check"],
        promotionToLabelRequirements: ["locked_initial", "valid_score_input_policy", "current_instruction_render", "no_stale_dependencies"],
        adjudicationEvidencePolicy: "adjudication labels require preserved original ratings and memo linkage",
        pairwisePreferenceExportPolicy: "pairwise exports require frozen pairwise snapshot and non-tied target scores",
        trainingExportEligibility: "exclude protected splits and high-uncertainty rows unless predeclared",
        protectedSplitExclusions: ["hidden_benchmark", "protected_validation"],
        frozenAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    scoreInputPolicies: [scoreInputPolicy],
    draftStoragePolicies: [draftStoragePolicy],
    raterInstructionCompatibilityPolicies: [compatibilityPolicy],
    raterInstructionRenderVersions: [renderVersion],
    raterInstructionComprehensionAudits: [comprehensionAudit],
    rubricLintConfigs: [rubricLintConfig],
    rubricLintEvents: [
      {
        id: "rubric-lint-event-submitted",
        assignmentId: "assign-ai-base-rate",
        ratingId: "rating-seed-ai-base-rate-r1",
        lintConfigId: rubricLintConfig.id,
        lintRuleId: "centrality_strength_product_gap",
        triggerState: "triggered",
        severity: "warning",
        acknowledgementNote: "Rater acknowledged the centrality-strength product diagnostic without score auto-change.",
        resolvedStatus: "acknowledged",
        timestamp: "2026-10-01T00:01:00.000Z",
      },
    ],
    itemIssueQuarantinePolicies: [
      {
        id: "item-issue-quarantine-policy-submitted",
        policyVersion: "item-issue-quarantine-rlhf90-v1",
        issueCategories: itemIssueCategories,
        severityCategories: itemIssueSeverityCategories,
        quarantineSlaHoursBySeverity: itemIssueQuarantineSlaHoursBySeverity,
        quarantineActionRequirementBySeverity: itemIssueQuarantineActionRequirementBySeverity,
        triageVisibilityPolicy: "label_and_model_result_blind_by_default_with_reason_coded_unblinding",
        stalePropagationPolicy: "quarantine marks dependent labels, exports, reports, leaderboards, and release claims stale until resolved or superseded",
        denominatorPolicy: "release-critical item issues are excluded from label denominators until blind triage resolves them",
        disclosurePolicy: "public errata required for published denominator changes, rights defects, source leakage, or release-claim changes; otherwise internal audit disclosure",
        slaClockStart: "createdAt",
        frozenAt: "2026-10-01T00:01:30.000Z",
      },
    ],
    itemIssueReports: [
      {
        id: "item-issue-submitted",
        itemIssueQuarantinePolicyId: "item-issue-quarantine-policy-submitted",
        reporterId: "demo-rater",
        reporterRole: "graduate",
        positionId: "pos-ai-prior",
        critiqueId: "crit-ai-base-rate",
        assignmentId: "assign-ai-base-rate",
        issueCategory: "missing_context",
        severity: "medium",
        blindSafeReporterNote: "Rater reports missing context without source, label, model, or protected-status visibility.",
        reporterExposureState: "initial_blind",
        labelVisibilityStateForTriage: "hidden",
        modelResultVisibilityStateForTriage: "hidden",
        triageState: "label_model_result_blind_review",
        quarantineStalePropagationState: "quarantine_stale_propagation_pending_review",
        excludedFromLabelDenominator: true,
        createdAt: "2026-10-01T00:02:00.000Z",
      },
    ],
    itemIssueActions: [
      {
        id: "item-issue-action-submitted-triage",
        itemIssueId: "item-issue-submitted",
        action: "triage",
        actorId: "demo-expert",
        resolutionStatus: "triage_opened",
        quarantineScope: "none",
        labelVisibilityStateForTriage: "labels_hidden_from_triage",
        modelResultVisibilityStateForTriage: "model_results_hidden_from_triage",
        notes: "Opened blind triage without label or model-result visibility.",
        timestamp: "2026-10-01T00:02:30.000Z",
      },
      {
        id: "item-issue-action-submitted-quarantine",
        itemIssueId: "item-issue-submitted",
        action: "quarantine",
        actorId: "demo-expert",
        resolutionStatus: "quarantined",
        quarantineScope: "affected_item_and_dependent_artifacts",
        labelVisibilityStateForTriage: "labels_hidden_from_triage",
        modelResultVisibilityStateForTriage: "model_results_hidden_from_triage",
        notes: "Quarantined affected item and stale-dependent artifacts pending review.",
        timestamp: "2026-10-01T00:02:45.000Z",
      },
    ],
    ratingDraftSessions: [
      {
        id: "rating-draft-session-submitted",
        assignmentId: "assign-ai-base-rate",
        autosaveRevisionId: "autosave-submitted-1",
        dependencyVersionSnapshot: {
          itemTextVersionId: "ptv-ai-prior-v1",
          rubricVersion: "appendix-f-operational-v1",
          instructionRenderVersionId: renderVersion.id,
          workflowProfileId: "rating-workflow-profile-submitted",
          assistPolicyId: "pre-submit-assist-submitted",
          rubricLintConfigId: rubricLintConfig.id,
          scoreInputPolicyId: scoreInputPolicy.id,
          draftStoragePolicyId: draftStoragePolicy.id,
          ratingContextSnapshotId: "rc-target-only-1",
        },
        staleDependencyStatus: "current",
        staleSubmissionBlocked: true,
        fieldCompletionState: "partial",
        lastSavedAt: "2026-10-01T00:03:00.000Z",
        resumeCount: 1,
        recoveredAfterInterruption: true,
        abandonedVsSubmittedStatus: "draft_not_submitted",
        draftNotExportedAsLabel: true,
        timestamp: "2026-10-01T00:03:00.000Z",
      },
    ],
    scoreConfidenceScalePolicies: [confidenceScalePolicy],
    scoreConfidenceAnnotations: [
      {
        id: "score-confidence-annotation-submitted",
        assignmentId: "assign-ai-base-rate",
        ratingId: "rating-seed-ai-base-rate-r1",
        raterId: "demo-rater",
        scoreConfidenceScalePolicyId: confidenceScalePolicy.id,
        dimensionConfidences: Object.fromEntries(RUBRIC_DIMENSIONS.map((dimension) => [dimension, 0.7])),
        confidenceBandByDimension: Object.fromEntries(RUBRIC_DIMENSIONS.map((dimension) => [dimension, "high"])),
        reasonCodeByDimension: Object.fromEntries(RUBRIC_DIMENSIONS.map((dimension) => [dimension, "rubric_boundary_case"])),
        scaleVersion: scoreConfidenceScaleVersion,
        annotationUsePolicy: "adjudication uncertainty only, not an extra score dimension",
        excludedFromScoreComputation: true,
        visibleToPeersBeforeLock: false,
        timestamp: "2026-10-01T00:04:30.000Z",
      },
    ],
    rationaleEvidenceSpanRequirednessPolicies: [
      rationaleEvidenceSpanRequirednessPolicy("rationale-evidence-span-requiredness-policy-submitted"),
    ],
    rationaleEvidenceSpans: [
      {
        id: "rationale-evidence-span-submitted",
        ratingId: "rating-seed-ai-base-rate-r1",
        rationaleEvidenceSpanRequirednessPolicyId: "rationale-evidence-span-requiredness-policy-submitted",
        mandatoryTriggerClass: "score_explanation_triggered",
        itemTextVersionId: "ctv-ai-base-rate-v1",
        spanTarget: "critique",
        startOffset: 0,
        endOffset: 72,
        normalizedSelectedTextHash: "sha256:submitted-rationale-evidence-span",
        linkedDimensionOrFlag: "centrality",
        noteId: "rationale-note-submitted",
        visibilityState: "locked_initial_hidden",
        hiddenUntilInitialRatingLock: true,
        rawSelectedTextStored: false,
        timestamp: "2026-10-01T00:04:35.000Z",
      },
    ],
    samePositionScratchpads: [
      {
        id: "same-position-scratchpad-submitted",
        raterId: "demo-rater",
        positionId: "pos-ai-prior",
        samePositionSessionId: "same-position-session-submitted",
        noteText: "Private continuity note about the position's base-rate premise.",
        visibilityState: "private_rater_only",
        promotedToRationaleIds: [],
        excludedFromLabelAndExport: true,
        timestamp: "2026-10-01T00:04:40.000Z",
      },
    ],
    samePositionBatchReviewRequirednessPolicies: [batchReviewRequirednessPolicy],
    samePositionBatchReviews: [
      {
        id: "same-position-batch-review-submitted",
        samePositionBatchReviewRequirednessPolicyId: batchReviewRequirednessPolicy.id,
        requirednessTriggerClass: "same_position_session_completed",
        requirednessDecisionStatus: "required_post_lock_before_release",
        raterId: "demo-rater",
        positionId: "pos-ai-prior",
        samePositionSessionId: "same-position-session-submitted",
        siblingRatingIdsReviewed: ["rating-seed-ai-base-rate-r1", "rating-seed-ai-base-rate-r2"],
        productOverallDeltaSummary: "Post-lock self-consistency review checked centrality-strength product and overall deltas.",
        revisionProposals: [],
        revisionIds: [],
        reviewStatus: "completed",
        nonIndependentEvidenceFlag: true,
        excludedFromIndependentRaterCount: true,
        raterOwnRatingsOnly: true,
        peerModelSourceMetadataHidden: true,
        timestamp: "2026-10-01T00:04:50.000Z",
      },
    ],
    correctnessClaimWeightWorksheets: [
      {
        id: "correctness-claim-weight-worksheet-submitted",
        ratingId: "rating-seed-ai-base-rate-r1",
        verificationWorkspaceId: "verification-workspace-submitted",
        claimSpanIds: ["claim-span-1", "claim-span-2"],
        claimSignificanceWeights: [0.7, 0.3],
        correctnessCredencesStatuses: ["verified:0.8", "unresolved:0.5"],
        unclearClaimExclusionFlags: [false, false],
        advisoryAggregateCorrectnessEstimate: 0.71,
        submittedScoreOverrideFlag: true,
        overrideExplanation: "Rater preserved the submitted correctness score after reviewing weighted claim evidence.",
        exposureBlindingState: "blind_auxiliary_material_not_consulted",
        createdBy: "demo-expert",
        timestamp: "2026-10-01T00:04:00.000Z",
      },
    ],
    externalAssistanceContaminationPolicies: [
      externalAssistanceContaminationPolicy("external-assistance-contamination-policy-submitted"),
    ],
    externalAssistanceDeclarations: [
      {
        id: "external-assistance-declaration-submitted",
        assignmentId: "assign-ai-base-rate",
        raterId: "demo-rater",
        assistanceType: "LLM",
        protectedTextEventFlag: true,
        outsideSystemDescription: "Rater reported accidental external LLM paste before lock.",
        contaminationRouting: "excluded_from_blind_initial_denominator_and_quarantined",
        accessibilityExceptionStatus: "not_applicable",
        timestamp: "2026-10-01T00:04:55.000Z",
      },
    ],
    protectedArtifactRetentionRecords: protectedArtifactTypes.map((artifactType) => ({
      id: `protected-artifact-retention-submitted-${artifactType}`,
      artifactType,
      artifactIdOrStoragePointer: `${artifactType}-protected-artifact`,
      sourceSplitProtectionClass: "hidden_benchmark",
      releaseConfigManifestId: "release-config-manifest-submitted",
      retentionDeletionPolicy: "bounded_retention_then_delete_or_anonymize",
      cacheOutboxPurgeStatus: "purged_or_not_cached",
      backupSnapshotCoverage: "inherits_split_policy",
      developmentStagingEligibility: "not_eligible_without_revalidation",
      restoreTimeRevalidationStatus: "passed_current_manifest_revalidation",
      incidentErratumLinks: [],
      suspectedProtectedContentLeak: false,
      incidentResponsePolicy: "suspected leaks pause submission lanes, mark dependents stale, and require incident review",
      dependentArtifactStalePolicy: "evaluations, leaderboards, label snapshots, and exports stay stale until review",
      dependentArtifactClassesStaled: [],
      createdAt: "2026-10-01T00:05:00.000Z",
      expiresAt: "2026-12-31T00:00:00.000Z",
    })),
  };
}

function completeAuxiliaryWorkflowFixtures() {
  const queuePolicySnapshot = {
    id: "queue-policy-snapshot-submitted",
    policyVersion: "queue-policy-rlhf88-v1",
    liveGoldDuplicateValidationMix: "live, gold, duplicate, and validation proportions are frozen before serving assignments",
    topicRoutingRules: "topic routing uses declared competence without source/protected-status disclosure",
    tierRoutingRules: "release-critical queues balance graduate, phd, expert, and adjudicator coverage",
    safeDeclineReassignmentPolicy: "safe declines reassign silently and never count as ratings",
    samePositionOrderPolicy: "same-position critique order is counterbalanced with later siblings absent at submission",
    randomizationStratificationSeedPolicy: "manifest-bound stratified seed recorded before queue serving",
    createdBy: "release-admin",
    frozenAt: "2026-10-01T00:00:00.000Z",
    timestamp: "2026-10-01T00:00:00.000Z",
  };
  return {
    sourceLeakageRedactionPolicies: [
      sourceLeakageRedactionPolicy("source-leakage-redaction-policy-submitted"),
    ],
    sourceFamilyClusteringPolicies: [
      sourceFamilyClusteringPolicy("source-family-clustering-policy-submitted"),
    ],
    partialTaskPromotionPolicies: [
      partialTaskPromotionPolicy("partial-task-promotion-policy-submitted"),
    ],
    exposureQuarantinePolicies: [
      exposureQuarantinePolicy("exposure-quarantine-policy-submitted"),
    ],
    blindingPreviewAudits: [
      {
        id: "blinding-preview-audit-submitted",
        sourceLeakageRedactionPolicyId: "source-leakage-redaction-policy-submitted",
        itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
        itemTextVersionIds: ["ptv-ai-prior-v1", "ctv-ai-base-rate-v1"],
        renderedRaterVisibleTextChecksum: "sha256:submitted-rater-visible-text",
        lintedSourceLeakagePatterns: sourceLeakageLintPatterns,
        redactedSourceIdentifyingSpans: ["source-title"],
        retainedSourceIdentifyingSpans: [],
        substantiveNecessityRationale: "No source-identifying spans retained for initial blind rendering.",
        reviewerId: "release-reviewer",
        reviewerRole: "expert",
        approvalStatus: "passed",
        sourceIdentifiabilitySensitive: false,
        unresolvedSourceLeakagePatternCount: 0,
        createdAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    partialTaskOutputs: partialTaskOutputTypes.map((taskType) => ({
      id: `partial-task-output-submitted-${taskType}`,
      partialTaskPromotionPolicyId: "partial-task-promotion-policy-submitted",
      assignmentId: "assign-ai-base-rate",
      raterId: "demo-rater",
      taskType,
      itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
      outputFields: { taskType, note: `${taskType} is auxiliary, not a full-rubric label` },
      visibilityExposureState: taskType === "practice" ? "training_exposure_recorded" : "not_full_blind_initial_rating",
      eligibleUses: ["routing", "calibration", "adjudication", "explicit_pairwise_export"],
      excludedDenominators: partialTaskExcludedDenominators,
      promotionReviewStatus: "not_promoted_auxiliary_only",
      promotionAdjudicationLink: null,
      countedAsFullRubricRating: false,
      timestamp: "2026-10-01T00:01:00.000Z",
    })),
    raterPositionClusterExposures: [
      {
        id: "position-cluster-exposure-submitted",
        exposureQuarantinePolicyId: "exposure-quarantine-policy-submitted",
        raterId: "demo-rater",
        positionClusterId: "lmca-public-is-ought-gap",
        itemIds: ["pos-ai-prior"],
        exposureSource: "post_lock_discussion",
        exposureTimestamp: "2026-10-01T00:02:00.000Z",
        exposureVisibilityScope: "same_position_cluster_peer_rationales",
        blindEligibilityEffect: "excluded_from_fresh_blind_initial_on_cluster",
        quarantineReviewStatus: "quarantine_applied",
        quarantineAction: "reassign_same_cluster_fresh_blind_initial_without_label",
        deprotectionTrainingExposureStatus: "training_exposure_recorded",
        createdBy: "release-admin",
        timestamp: "2026-10-01T00:02:00.000Z",
      },
    ],
    spotCheckSamplingPolicies: [spotCheckSamplingPolicy("spot-check-sampling-policy-submitted")],
    spotCheckQaItems: [
      {
        id: "spot-check-qa-submitted",
        spotCheckSamplingPolicyId: "spot-check-sampling-policy-submitted",
        itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
        ratingId: "rating-seed-ai-base-rate-r1",
        samplingStratum: "non_escalated_release_critical",
        samplingDimensions: spotCheckSamplingDimensions,
        samplingSeedArtifact: "sha256:submitted-spot-check-seed",
        selectionMethod: "stratified_random",
        ordinaryRatingStatus: "apparently_ordinary_non_escalated",
        reviewerId: "release-reviewer",
        reviewerRole: "expert",
        checkResult: "passed_without_label_change",
        revisionAdjudicationEscalationLink: null,
        excludedFromIndependentRaterCount: true,
        timestamp: "2026-10-01T00:03:00.000Z",
      },
    ],
    adjudicationTriageQueueItems: [
      {
        id: "adjudication-triage-submitted",
        itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
        triggerType: "release_blocking_disagreement",
        releaseBlockingStatus: "release_blocking",
        priority: "high",
        queueLane: "release_blocking_disagreement",
        assignedReviewerId: "demo-expert",
        status: "queued_for_expert_review",
        slaDeadline: "2026-10-05T00:00:00.000Z",
        routingRationale: "Large centrality-strength spread requires object-level adjudication before release.",
        priorityDoesNotMutateLabels: true,
        timestamp: "2026-10-01T00:04:00.000Z",
      },
    ],
    diagnosticDeferralVisibilityPolicies: [diagnosticDeferralVisibilityPolicy("diagnostic-deferral-visibility-policy-submitted")],
    diagnosticDeferralRecords: [
      {
        id: "diagnostic-deferral-submitted",
        releaseId: "october-2026-demo",
        diagnosticDeferralVisibilityPolicyId: "diagnostic-deferral-visibility-policy-submitted",
        diagnosticClass: "obfuscated_argument_stress",
        diagnosticName: "obfuscation_stress",
        claimAffected: "robustness_to_obfuscated_arguments",
        notRunReason: "Not enough obfuscation variants for the current internal milestone.",
        approvedWeakerClaimWording: "Obfuscation robustness is not claimed for this release.",
        publicVisibilityLevel: "public_weaker_claim_summary",
        claimSuppressionAction: "suppress_stronger_claim",
        publicSummaryText: "Obfuscation robustness is not claimed for this release because the diagnostic was deferred.",
        privateReviewerNotes: "Internal milestone lacks enough obfuscation variants.",
        protectedContentDisclosureCheck: "no_hidden_or_protected_content_disclosed",
        diagnosticDeferralReviewStatus: "visibility_review_complete",
        strongerClaimSuppressed: true,
        reviewerId: "release-reviewer",
        reviewerRole: "expert",
        createdAt: "2026-10-01T00:05:00.000Z",
      },
    ],
    queuePolicySnapshots: [queuePolicySnapshot],
    assignmentSelectionAudits: [
      {
        id: "assignment-selection-audit-submitted",
        queuePolicySnapshotId: queuePolicySnapshot.id,
        splitReleaseId: "october-2026-demo",
        candidateAssignments: ["assign-ai-base-rate", "assign-voting-bullet", "assign-mind-zombie"],
        servedAssignments: ["assign-ai-base-rate", "assign-voting-bullet"],
        declinesReassignmentsByReason: { lack_topic_expertise: 1, conflict_or_prior_exposure: 1 },
        raterTierDistribution: { graduate: 1, expert: 1 },
        topicSourceLengthDistribution: { "AI safety:short": 1, "politics:medium": 1 },
        selfSelectionIndicators: ["volunteer_selected_from_eligible_blind_pool"],
        compositionChangedLabelDenominators: false,
        createdAt: "2026-10-01T00:06:00.000Z",
      },
    ],
    modelRunReproducibilityPolicies: [
      modelRunReproducibilityPolicy("model-run-reproducibility-policy-submitted"),
    ],
    modelInferenceConfigs: [
      {
        id: "model-inference-config-submitted",
        modelRunReproducibilityPolicyId: "model-run-reproducibility-policy-submitted",
        evaluationRunId: "eval-full-rubric-demo",
        providerEndpoint: "approved-model-evaluation-endpoint",
        modelSnapshot: "gpt-demo-full-rubric-2026-06-01",
        decodingParameters: { temperature: 0, topP: 1 },
        reasoningBudget: "bounded_hidden_chain_budget_v1",
        toolAvailability: ["none"],
        messageStackTemplate: "lmca-full-rubric-eval-template-v1",
        retryPolicy: "single_retry_parse_failures_only",
        seedDeterminismArtifact: "sha256:model-eval-seed",
        createdAt: "2026-10-01T00:07:00.000Z",
      },
    ],
    modelRunEnvironments: [
      {
        id: "model-run-environment-submitted",
        modelRunReproducibilityPolicyId: "model-run-reproducibility-policy-submitted",
        evaluationRunId: "eval-full-rubric-demo",
        runtimeOrchestratorVersion: "lmca-eval-orchestrator-v1",
        apiRouteDeploymentId: "deployment-october-2026-demo",
        libraryVersions: { node: "20.x", parser: "lmca-parser-v1" },
        timestamp: "2026-10-01T00:08:00.000Z",
        rateLimitRetryMetadata: "bounded retries with no prompt mutation",
        parserExtractorVersionLinks: ["parser-config-demo", "prompt-template-demo"],
      },
    ],
    raterItemConflicts: [
      {
        id: "rater-item-conflict-submitted",
        sourceFamilyClusteringPolicyId: "source-family-clustering-policy-submitted",
        raterId: "demo-rater",
        positionClusterId: "lmca-public-is-ought-gap",
        critiqueId: "crit-ai-base-rate",
        sourceFamilyId: "source-family-ai-base-rate",
        conflictType: "source_family_exposure",
        disclosureSource: "rater_self_screen",
        independentBlindEligibilityEffect: "excluded_from_independent_blind_protected_denominators",
        allowedNonBlindRoles: ["intake_review", "adjudication_context"],
        reviewerResolution: "approved_non_blind_context_only",
        timestamp: "2026-10-01T00:09:00.000Z",
      },
    ],
    raterTrainingExposurePolicies: [
      {
        id: "rater-training-exposure-policy-submitted",
        policyVersion: "rater-training-exposure-rlhf90-v1",
        exposureWindowDays: raterTrainingExposureWindowDays,
        protectedAssignmentBlockingEffects: raterTrainingExposureBlockingEffects,
        snapshotRequiredBeforeAssignment: true,
        protectedAssignmentScope: "validation_hidden_benchmark_human_ceiling_release_critical",
        publicAnchorExposurePolicy: "public source-anchor examples are record-only by themselves but must be snapshotted before protected assignment",
        clusterMatchPolicy: "same_position_or_near_duplicate_source_family_or_adaptation_cluster blocks protected independent blind eligibility within window",
        staleEligibilityPolicy: "later sibling critiques, post-lock discussion, model-assisted checks, protected labels, or source metadata exposures trigger recheck before protected assignment",
        adminExceptionPolicy: "admin exception must deprotect or route to non-blind role and cannot count as independent blind protected label",
        frozenAt: "2026-10-01T00:09:30.000Z",
      },
    ],
    raterTrainingExposureSnapshots: [
      {
        id: "training-exposure-snapshot-submitted",
        exposureQuarantinePolicyId: "exposure-quarantine-policy-submitted",
        raterTrainingExposurePolicyId: "rater-training-exposure-policy-submitted",
        raterId: "demo-rater",
        assignmentId: "assign-ai-base-rate",
        certificationRecordId: "certification-workflow-new",
        certificationPackVersion: "pack-v1",
        rubricVersion: "appendix-f-operational-v1",
        publicSourceAnchorExampleIdsPreviouslySeen: ["source-anchor-ai-base-rate"],
        goldItemIdsOrProtectedSafeSummariesPreviouslySeen: ["gold-category:centrality_strength"],
        duplicateFeedbackSummary: "duplicate feedback shown after lock only",
        calibrationFeedbackEventIds: ["calibration-feedback-submitted"],
        remediationModuleState: "not_required",
        practiceSessionIds: ["practice-session-submitted"],
        samePositionPositionClusterExposureChecks: exposureQuarantineAssignmentChecks,
        exposureQuarantineCheckStatus: "quarantine_applied",
        protectedSplitConflictStatus: "no_conflict_for_current_assignment",
        protectedClusterEligibilityEffect: "eligible_after_checks",
        createdAt: "2026-10-01T00:10:00.000Z",
      },
    ],
    releaseErratumDisclosurePolicies: [
      {
        id: "release-erratum-disclosure-policy-submitted",
        policyVersion: "release-erratum-disclosure-rlhf90-v1",
        disclosureThresholdByErratumType: releaseErratumDisclosureThresholds,
        publicDisclosureRequiredFor: releaseErratumApiWarningTypes,
        apiWarningRequiredFor: releaseErratumApiWarningTypes,
        exportBlockRequiredFor: releaseErratumExportBlockTypes,
        internalOnlyAllowedPolicy:
          "internal-only errata are allowed only for other defects with no published artifact, export, denominator, rights, source, metric, leaderboard, or release-claim change",
        supersessionPolicy: "affected published artifacts must be deprecated or superseded without mutating historical releases or leaderboards",
        approvalPolicy: "release admin approval required before erratum publication or internal-only classification",
        frozenAt: "2026-10-01T00:10:30.000Z",
      },
    ],
    releaseErrata: [
      {
        id: "release-erratum-submitted",
        releaseErratumDisclosurePolicyId: "release-erratum-disclosure-policy-submitted",
        releaseId: "october-2026-demo",
        erratumType: "denominator_error",
        affectedArtifactIds: ["release-report-october-2026-demo"],
        defectSummary: "Erratum template for denominator defects discovered after freeze.",
        supersedingArtifactIds: ["release-report-october-2026-demo-superseding-template"],
        historicalArtifactsMutated: false,
        historicalLeaderboardMutationPolicy: "do not mutate historical leaderboard; publish superseding artifact",
        impactedMetricsClaims: ["lmca_comparability"],
        artifactDeprecationStatus: "affected_artifacts_deprecated_with_superseding_links",
        apiDownloadWarningBlockPolicy: "show_warning_and_link_superseding_artifacts",
        remediationStatus: "superseding_artifact_published",
        status: "issued",
        approvedBy: "release-admin",
        createdAt: "2026-10-01T00:11:00.000Z",
      },
    ],
    scheduleRebaselinePolicies: [
      {
        id: "schedule-rebaseline-policy-submitted",
        policyVersion: "schedule-rebaseline-rlhf90-v1",
        delayThresholdDays: scheduleRebaselineDelayThresholdDays,
        rebaselineRuleByTrigger: scheduleRebaselineRules,
        requiredRebaselinedSnapshotFields,
        datedMilestoneSlipPolicy:
          "after planned end, slipped dated milestones must be blocked or rebaselined before release claims can cite the schedule",
        approvalPolicy: "major slips or scope changes require two-person release review approval before rebaselining",
        claimPolicy: "original dated milestone completion claims are suppressed after rebaseline; only the superseding schedule may support future claims",
        frozenAt: "2026-10-01T00:11:30.000Z",
      },
    ],
    scheduleStatusSnapshots: [
      {
        id: "schedule-status-submitted",
        scheduleRebaselinePolicyId: "schedule-rebaseline-policy-submitted",
        releaseVersionOrProjectScope: "october-2026-demo",
        milestoneId: "october-internal-release",
        milestoneName: "October internal LMCA release",
        plannedStart: "2026-09-01",
        plannedEnd: "2026-10-31",
        actualStart: "2026-09-01",
        actualEnd: null,
        status: "in_progress",
        evidenceArtifactIds: ["release-report-october-2026-demo"],
        criticalPathImpact: "release remains incomplete until target scale and evidence gates pass",
        rebaselinedDate: null,
        rebaselinedScope: null,
        rebaselineReason: null,
        previousPlannedEnd: null,
        newPlannedEnd: null,
        rebaselineApprovalRecordIds: [],
        originalScheduleCompletionClaimSuppressed: false,
        owner: "release-admin",
        approvedBy: "release-reviewer",
        supportsCompletionClaim: false,
        timestamp: "2026-10-01T00:12:00.000Z",
      },
    ],
  };
}

function completeInteractionWorkflowFixtures() {
  return {
    publicExamplePracticeSessions: [
      {
        id: "practice-session-submitted",
        raterId: "demo-rater",
        sourceAnchorExampleIds: ["source-anchor-ai-base-rate"],
        itemTextVersionIds: ["ptv-ai-prior-v1", "ctv-ai-base-rate-v1"],
        workflowProfileId: "rating-workflow-profile-submitted",
        attemptRatings: ["practice-rating-submitted"],
        lockedAt: "2026-10-01T00:00:00.000Z",
        feedbackArtifactId: "calibration-feedback-submitted",
        rubricAnchorUsageSummary: "Public anchors reviewed before feedback.",
        practiceSandboxPolicyId: "practice-sandbox-policy-submitted",
        trainingExposureStatus: "training_exposure_recorded",
        excludedFromRatingDenominator: true,
        createdAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    practiceSandboxPolicies: [
      {
        id: "practice-sandbox-policy-submitted",
        policyVersion: "practice-sandbox-rlhf90-v1",
        requiredPublicSourceAnchorIds: practiceSandboxSourceAnchorIds,
        completionStandards: practiceSandboxCompletionStandards,
        liveRatingUnlockPolicy: "live rating unlock requires locked attempts covering every required public source anchor",
        feedbackVisibilityPolicy: "feedback is shown only after each practice attempt is locked",
        denominatorExclusionPolicy: "practice attempts and public anchors are excluded from blind-label, validation, hidden-benchmark, human-ceiling, and training-export denominators",
        trainingExposurePolicy: "practice sandbox attempts record training exposure only",
        createdBy: "workflow-admin",
        frozenAt: "2026-10-01T00:00:30.000Z",
      },
    ],
    raterDashboardPolicies: [raterDashboardPolicy()],
    raterLearningPlans: [
      {
        id: "rater-learning-plan-submitted",
        raterDashboardPolicyId: "rater-dashboard-policy-submitted",
        raterId: "demo-rater",
        rubricVersion: "appendix-f-operational-v1",
        certificationPackVersion: "pack-v1",
        practiceGoldDuplicatePerformanceSummaries: { centrality: "calibrated" },
        perDimensionDriftSummary: { correctness: "stable" },
        assignedRemediationModules: ["centrality-strength-product"],
        completedModules: ["centrality-strength-product"],
        currentAssignmentRestrictionsUnlocks: ["ordinary_live_allowed"],
        dashboardVisibilityStatus: "private_training_only",
        remediationRoutingStatus: "ordinary_live_allowed",
        feedbackArtifactsShown: ["calibration-feedback-submitted"],
        protectedLabelExposureCheck: "no_protected_or_live_labels_shown",
        hiddenProtectedLabelsSuppressed: true,
        livePeerModelSourceLabelsHidden: true,
        trainingApprovedFeedbackOnly: true,
        timestamp: "2026-10-01T00:01:00.000Z",
      },
    ],
    sessionPacingPolicies: [
      {
        id: "session-pacing-policy-submitted",
        policyVersion: "session-pacing-rlhf90-v1",
        coveredSessionTargets: sessionPacingTargets,
        thresholdSeconds: sessionPacingThresholdSeconds,
        safeDeclineAbuseThresholds,
        breakPromptPolicy: "break prompt after 45 minutes of active rating time",
        fatigueWarningPolicy: "fatigue warning after 60 minutes of active rating time",
        qaRoutingPolicy: "route fatigue, repeated interruption, repeated safe-decline, and suspicious decline patterns to monitor or QA review",
        ordinaryPausePenaltyPolicy: "ordinary pauses and breaks are not a label-quality penalty",
        stopAfterCurrentPolicy: "stop-after-current is available without label penalty",
        safeDeclineDenominatorPolicy: "safe declines and reassignments are excluded from rating denominators",
        createdBy: "workflow-admin",
        frozenAt: "2026-10-01T00:01:30.000Z",
      },
    ],
    raterSessions: [
      {
        id: "rater-session-submitted",
        raterId: "demo-rater",
        sessionTarget: "ordinary_live_rating",
        startedAt: "2026-10-01T00:02:00.000Z",
        endedAt: "2026-10-01T00:17:00.000Z",
        activeTimeSeconds: 900,
        completedAssignmentCount: 1,
        expectedEffortCompleted: "within_band",
        breakPromptCount: 1,
        breakTakenCount: 1,
        stopAfterCurrentItemState: "available",
        fatigueWarningState: "none",
        interruptionSummary: "one pause; no label-quality penalty",
        qaRoutingStatus: "no_fatigue_qa_route",
        timestamp: "2026-10-01T00:02:00.000Z",
      },
    ],
    assignmentSelfScreens: [
      {
        id: "assignment-self-screen-submitted",
        assignmentId: "assign-ai-base-rate",
        raterId: "demo-rater",
        selfScreenStatus: "continue",
        sourcePeerModelGoldProtectedLabelVisibilityState: "all_hidden",
        timestamp: "2026-10-01T00:02:30.000Z",
      },
    ],
    assignmentDeclines: [
      {
        id: "assignment-decline-submitted",
        assignmentId: "assign-ai-base-rate",
        raterId: "demo-rater",
        itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
        reasonCode: "conflict_or_prior_exposure",
        freeTextNote: "Recognized source family before scoring.",
        priorExposureConflictFlag: true,
        topicFitUpdateSuggestion: "avoid same source family",
        reassignmentStatus: "reassigned_without_label",
        qaRoutingStatus: "monitor_only",
        repeatedOrStrategicDeclineQaPolicy: "repeated or suspicious safe-decline patterns route to QA review",
        sourcePeerModelGoldProtectedLabelVisibilityState: "all_hidden",
        excludedFromRatingDenominator: true,
        timestamp: "2026-10-01T00:03:00.000Z",
      },
    ],
    assignmentDeferrals: [
      {
        id: "assignment-deferral-submitted",
        assignmentId: "assign-ai-base-rate",
        raterId: "demo-rater",
        deferReason: "insufficient_time",
        resumePolicy: "resume_or_reassign_after_review_without_label_submission",
        sourcePeerModelGoldProtectedLabelVisibilityState: "all_hidden",
        timestamp: "2026-10-01T00:03:30.000Z",
      },
    ],
    interpretationTargetMapRequirednessPolicies: [interpretationTargetMapRequirednessPolicy()],
    interpretationTargetMaps: [
      {
        id: "interpretation-target-map-submitted",
        itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
        interpretationTargetMapRequirednessPolicyId: "interpretation-target-map-requiredness-policy-submitted",
        requirednessTriggerClass: "release_critical_ambiguity_dispute",
        requirednessDecisionStatus: "required_before_release_or_adjudication",
        positionTextVersionId: "ptv-ai-prior-v1",
        critiqueTextVersionId: "ctv-ai-base-rate-v1",
        candidateIntendedConclusionSpans: ["position-conclusion"],
        attackedClaimSpans: ["critique-attack"],
        plausiblePositionCritiqueInterpretations: ["central_forecast_attack"],
        interpretationPlausibilityByReading: { central_forecast_attack: 0.8 },
        plausibilityNotes: "Central forecast attack is release-relevant.",
        critiqueCoverageByInterpretation: { central_forecast_attack: "covered" },
        pricedInBackgroundAssumptionStatus: "not_priced_in",
        centralityTargetClaimSet: ["central_forecast"],
        strengthTargetClaimSet: ["base_rate_challenge"],
        dimensionEffectByRubricDimension: {
          centrality: "maps which forecast claim is attacked",
          strength: "maps how strongly the base-rate challenge lands",
          overall: "records the product-level effect after priced-in review",
        },
        productAllocationNote: "Centrality and strength product checked together.",
        visibilityState: "post_lock_or_adjudicator_only",
        createdBy: "demo-expert",
        timestamp: "2026-10-01T00:04:00.000Z",
      },
    ],
    verificationClaimGranularityPolicies: [verificationClaimGranularityPolicy()],
    verificationWorkspaceSessions: [
      {
        id: "verification-workspace-submitted",
        itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
        relatedRatingIds: ["rating-seed-ai-base-rate-r1"],
        verificationClaimGranularityPolicyId: "verification-claim-granularity-policy-submitted",
        claimGranularityClass: "subjective_or_intuition_pump_claim",
        claimGranularityReviewStatus: "policy_applied_claim_level",
        claimList: ["The critique says expert forecasts ignore base rates."],
        claimSpanRefs: ["claim-span-1"],
        claimType: "subjective_or_intuition_pump",
        verificationStatus: "not_practicable",
        claimVerificationStatusByClaim: { "claim-span-1": "not_practicable" },
        evidenceMaterialRefs: ["adjudication-note"],
        notPracticableJustification: "Normative forecast premise lacks direct empirical check.",
        correctnessHalfEntireUnclearFlag: false,
        nonBlindAuxiliaryMaterialConsulted: true,
        sourceAssistedReviewNote: "Expert post-lock note was consulted only after initial rating lock.",
        exposureBlindingState: "post_lock_expert_only",
        verifierId: "demo-expert",
        verifierRole: "expert",
        timestamp: "2026-10-01T00:05:00.000Z",
      },
    ],
    adjudicatorPreReadRequirednessPolicies: [adjudicatorPreReadRequirednessPolicy()],
    adjudicatorPreReads: [
      {
        id: "adjudicator-pre-read-submitted",
        adjudicatorPreReadRequirednessPolicyId: "adjudicator-pre-read-requiredness-policy-submitted",
        requirednessTriggerClass: "release_critical_escalation",
        requirednessDecisionStatus: "required_before_peer_distribution",
        adjudicatorId: "demo-expert",
        itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
        visibleMaterialPolicy: "position_critique_rubric_only",
        preReadNotes: "Potential target ambiguity identified.",
        preliminaryIssueTags: ["interpretation_dispute"],
        completedBeforePeerDistributionExposure: true,
        peerDistributionExposureBeforePreRead: 0,
        majorityDirectionHiddenBeforePreRead: true,
        modelOutputHiddenBeforePreRead: true,
        linkedAdjudicationMemoId: "adjudication-memo-workflow-new",
        timestamp: "2026-10-01T00:06:00.000Z",
      },
    ],
    postLockDiscussionSessions: [
      {
        id: "post-lock-discussion-submitted",
        discussionThreadId: "discussion-thread-workflow-new",
        itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
        participantIds: ["demo-rater", "demo-expert"],
        participantRoles: ["graduate_rater", "expert_adjudicator"],
        initialRatingLockCheck: "all_initial_ratings_locked",
        identityStagingPolicy: "role_neutral_handles_first",
        identityMaskPhaseStatus: "completed_before_role_reveal",
        roleRevealPolicy: "moderator_exception_logged",
        moderatorAdjudicatorVisibilityExceptions: "adjudicator can inspect pre-read notes only after initial locks",
        visibleMaterialPolicy: "peer_rationales_visible_post_lock_only",
        peerScoreRationaleVisibilityTimestamp: "2026-10-01T00:07:00.000Z",
        objectLevelCommentRecords: ["comment-submitted"],
        spanReferenceLinks: ["rationale-span-submitted"],
        overlookedPointFlags: ["no_unanswered_central_objection"],
        revisionProposalIds: ["revision-proposal-submitted"],
        majorityPressureWarningState: "displayed",
        transcriptArtifact: "discussion-transcript-submitted",
        writtenFollowUpStatus: "not_required",
        discussionStatus: "object_level_discussion_complete",
        timestamp: "2026-10-01T00:07:00.000Z",
      },
    ],
    adjudicationCockpitSignoffPolicies: [adjudicationCockpitSignoffPolicy()],
    adjudicationReviewSessions: [
      {
        id: "adjudication-review-session-submitted",
        adjudicationId: "adjudication-workflow-new",
        discussionThreadId: "discussion-thread-workflow-new",
        itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
        adjudicationCockpitSignoffPolicyId: "adjudication-cockpit-signoff-policy-submitted",
        mandatoryViewIdsReviewed: adjudicationCockpitMandatoryViewIds,
        cockpitSignoffStatus: "ready_for_memo",
        originalRatingPreservationCheck: "original_blind_ratings_and_revision_history_preserved",
        memoSignoffGateStatus: "all_mandatory_cockpit_views_reviewed_before_final_memo",
        scoreSpreadHeatmapVersion: "spread-heatmap-v1",
        centXStrProductAllocationView: "product-allocation-v1",
        rationaleSpanOverlayRefs: ["rationale-span-submitted"],
        verificationConflictSummary: "subjective claim not practicable",
        siblingContextDifferenceSummary: "same-position sibling context checked",
        preSubmitLintSummary: "centrality-strength warning acknowledged",
        revisionTimelineRefs: ["revision-timeline-submitted"],
        targetMapIds: ["interpretation-target-map-submitted"],
        minorityRationaleFields: ["minority-strength-reading"],
        finalizationStatus: "ready_for_memo",
        adjudicatorIds: ["demo-expert"],
        timestamp: "2026-10-01T00:08:00.000Z",
      },
    ],
    calibrationFeedbackEvents: [
      {
        id: "calibration-feedback-submitted",
        certificationRecordId: "certification-record-workflow-new",
        raterId: "demo-rater",
        goldItemId: "gold-item-workflow-new",
        attemptRatingId: "practice-rating-submitted",
        rubricVersion: "appendix-f-operational-v1",
        perDimensionDeviationSummary: { centrality: "within_band" },
        duplicateInconsistencySummary: "none",
        feedbackTextVersion: "feedback-v1",
        shownAfterLock: true,
        protectedSplitConflictCheck: "training_approved_no_protected_cluster_conflict",
        timestamp: "2026-10-01T00:09:00.000Z",
      },
    ],
    governanceApprovalRecords: [
      {
        id: "governance-approval-submitted",
        actionKind: "release_manifest_activation",
        affectedArtifactIds: ["release-config-manifest-submitted"],
        proposedBy: "release-admin",
        approver1: "independent-approver-a",
        approver2: "independent-approver-b",
        independenceSeparationOfDutiesStatus: "independent_two_person_approval",
        reasonCode: "manifest_activation",
        visibilitySplitMetricLeaderboardImpactSummary: "no broadening of protected visibility or metric eligibility",
        approvalTimestamp: "2026-10-01T00:10:00.000Z",
      },
    ],
    protectedArtifactRevalidations: [
      {
        id: "protected-artifact-revalidation-submitted",
        protectedArtifactId: "protected-prompt-submitted",
        releaseConfigManifestId: "release-config-manifest-submitted",
        revalidationStatus: "passed_current_manifest_revalidation",
        staleSupersededBehavior: "fail_closed_if_stale_or_superseded",
        checkedBy: "release-admin",
        checkedAt: "2026-10-01T00:11:00.000Z",
      },
    ],
    benchmarkSubmissionPolicies: [
      {
        id: "benchmark-submission-policy-submitted",
        policyVersion: "benchmark-submission-rlhf88-v1",
        aggregateOnlyReport: true,
        submissionBudget: {
          maxSubmissionsPerWindow: 2,
          windowHours: 720,
          remainingSubmissions: 1,
          cooldownHours: 24,
          duplicateRunReviewThreshold: 0.9,
        },
        cooldownPolicy: "cooldown_after_submission_window",
        duplicateRunHandlingPolicy: "near-duplicate submissions route to review before another aggregate report is released",
        stableEvaluationManifestRequirement: "stable evaluation manifest required before report generation",
        aggregateReportFieldPolicy: "aggregate metric families, uncertainty intervals, coverage counts, and coarse eligibility warnings only",
        hiddenIdExposureProhibited: true,
        perItemFeedbackProhibited: true,
        perPairFeedbackProhibited: true,
        promptSpecificCorrectionHintsProhibited: true,
        createdBy: "release-admin",
        frozenAt: "2026-10-01T00:12:00.000Z",
      },
    ],
    benchmarkSubmissions: [
      {
        id: "benchmark-submission-submitted",
        benchmarkSubmissionPolicyId: "benchmark-submission-policy-submitted",
        releaseId: "october-2026-demo",
        releaseConfigManifestId: "release-config-manifest-submitted",
        evaluationManifestId: "evaluation-manifest-submitted",
        submittedAggregateReportId: "benchmark-aggregate-report-submitted",
        aggregateMetricFamilyResults: {
          custom_loss: { mean: 0.42, direction: "lower_is_better" },
          weighted_pairwise_accuracy: { mean: 0.71, direction: "higher_is_better" },
        },
        uncertaintyIntervals: {
          custom_loss: { level: 0.95, lower: 0.38, upper: 0.46 },
          weighted_pairwise_accuracy: { level: 0.95, lower: 0.65, upper: 0.77 },
        },
        coverageCounts: { positionCount: 120, critiqueCount: 240, pairwiseEdgeCount: 360 },
        coarseEligibilityWarnings: ["protected_hidden_ids_omitted", "coarse_coverage_only"],
        perItemOutputIncluded: false,
        perPairOutputIncluded: false,
        hiddenIdExposureIncluded: false,
        promptSpecificCorrectionHintsIncluded: false,
        budgetConsumptionStatus: "within_budget",
        cooldownStatus: "cooldown_started",
        duplicateRunStatus: "not_duplicate",
        submittedAt: "2026-10-01T00:13:00.000Z",
      },
    ],
    screenFeatureParityChecks: uxScreenFeatureParityChecks(),
    simplifiedCopyPreviews: simplifiedCopyPreviews(),
  };
}

test("policy bundle evidence gates visibility, workflow profile, escalation, UI experiments, assist, and accessibility", () => {
  const report = buildPolicyBundleEvidenceReport("october-2026-demo", completePolicyBundleFixtures());

  assert.equal(report.releaseUseStatus, "submitted_policy_bundle_evidence_complete");
  assert.equal(report.counts.completePolicyGroupCount, 7);
  assert.equal(report.counts.submittedVisibilityPolicyCount, 1);
  assert.deepEqual(report.requiredVisibilityRoleFieldActionMatrix, visibilityRoleFieldActionMatrix);
  assert.deepEqual(report.visibilityPolicyRows.at(-1).roleFieldActionMatrix, visibilityRoleFieldActionMatrix);
  assert.equal(report.counts.submittedScoreExplanationPolicyCount, 1);
  assert.equal(report.counts.submittedRatingEscalationPolicyCount, 1);
  assert.equal(report.uiVariantSensitivityPowerThresholds.policyVersion, UI_VARIANT_SENSITIVITY_POWER_POLICY_VERSION);
  assert.equal(report.uiVariantSensitivityPowerThresholds.minimumPower, REQUIRED_UI_VARIANT_SENSITIVITY_MINIMUM_POWER);
  assert.equal(report.uiVariantSensitivityPowerThresholds.alpha, REQUIRED_UI_VARIANT_SENSITIVITY_ALPHA);
  assert.equal(report.uiVariantSensitivityPowerThresholds.minimumDetectableEffectOverall, REQUIRED_UI_VARIANT_SENSITIVITY_MDE_OVERALL);
  assert.equal(report.uiVariantSensitivityPowerThresholds.minimumPerVariantCellCount, REQUIRED_UI_VARIANT_SENSITIVITY_MIN_CELL_COUNT);
  assert.equal(report.uiExperimentPolicyRows.at(-1).sensitivityMinimumPower, REQUIRED_UI_VARIANT_SENSITIVITY_MINIMUM_POWER);
  assert.equal(report.uiExperimentPolicyRows.at(-1).sensitivityMinimumDetectableEffectOverall, REQUIRED_UI_VARIANT_SENSITIVITY_MDE_OVERALL);
  assert.deepEqual(report.ratingWorkflowProfileRows.at(-1).optionalIssuePanels, [
    "evidence_spans",
    "interpretation_target_map",
    "correctness_verification_workspace",
  ]);
  assert.equal(report.ratingWorkflowProfileRows.at(-1).evidenceSpanRequirednessPolicy, "optional_ordinary_required_for_disputed_release_critical");
  assert.deepEqual(report.scoreExplanationPolicyRows.at(-1).triggerList, scoreExplanationTriggerRules);
  assert.deepEqual(report.ratingEscalationPolicyRows.at(-1).triggerList, ratingEscalationTriggerRules);
  assert.equal(report.ratingEscalationPolicyRows.at(-1).initialOverallSpreadThreshold, 0.35);
  assert.equal(report.counts.submittedAccessibilityConformanceReportCount, 1);
  assert.equal(report.accessibilityToolingPolicyVersion, accessibilityToolingPolicyVersion);
  assert.equal(report.accessibilityRequiredWcagConformanceTarget, accessibilityWcagConformanceTarget);
  assert.deepEqual(report.accessibilityRequiredTestToolchain, accessibilityTestToolchain);
  assert.deepEqual(report.accessibilityRequiredAssistiveTechnologyMatrix, accessibilityAssistiveTechnologyMatrix);
  assert.deepEqual(report.accessibilityRequiredEvidenceArtifactTypes, accessibilityEvidenceArtifactTypes);
  assert.deepEqual(report.requiredRaterUxAcceptanceChecks, REQUIRED_RATER_UX_ACCEPTANCE_CHECKS);
  assert.equal(report.accessibilityConformanceRows.at(-1).toolingPolicyVersion, accessibilityToolingPolicyVersion);
  assert.equal(report.accessibilityConformanceRows.at(-1).wcagConformanceTarget, accessibilityWcagConformanceTarget);
  assert.deepEqual(report.accessibilityConformanceRows.at(-1).testToolchain, accessibilityTestToolchain);
  assert.deepEqual(report.accessibilityConformanceRows.at(-1).assistiveTechnologyMatrix, accessibilityAssistiveTechnologyMatrix);
  assert.deepEqual(report.accessibilityConformanceRows.at(-1).evidenceArtifactTypes, accessibilityEvidenceArtifactTypes);
  assert.deepEqual(report.accessibilityConformanceRows.at(-1).raterUxAcceptanceChecks, REQUIRED_RATER_UX_ACCEPTANCE_CHECKS);
  assert.equal(report.accessibilityConformanceRows.at(-1).manualAssistiveTechReviewRequired, true);
  assert.equal(report.accessibilityConformanceRows.at(-1).automatedAuditAloneInsufficient, true);
  assert.deepEqual(report.reviewSections, []);

  const missingAccessibilityToolingReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    accessibilityConformanceReports: [
      {
        ...completePolicyBundleFixtures().accessibilityConformanceReports[0],
        id: "accessibility-conformance-missing-tooling",
        testToolchain: accessibilityTestToolchain.filter((tool) => tool !== "manual_screen_reader_pass"),
        assistiveTechnologyMatrix: {
          ...accessibilityAssistiveTechnologyMatrix,
          screenReader: ["voiceover_safari"],
        },
        evidenceArtifactTypes: accessibilityEvidenceArtifactTypes.filter((artifactType) => artifactType !== "screen_reader_transcript"),
        automatedAuditAloneInsufficient: false,
      },
    ],
  });
  assert.equal(missingAccessibilityToolingReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(
    missingAccessibilityToolingReport.reviewSections.some(
      (section) => section.artifactType === "accessibility_conformance_report" && section.reason === "testToolchain:manual_screen_reader_pass",
    ),
  );
  assert.ok(
    missingAccessibilityToolingReport.reviewSections.some(
      (section) => section.artifactType === "accessibility_conformance_report" && section.reason === "assistiveTechnologyMatrix",
    ),
  );
  assert.ok(
    missingAccessibilityToolingReport.reviewSections.some(
      (section) => section.artifactType === "accessibility_conformance_report" && section.reason === "evidenceArtifactTypes:screen_reader_transcript",
    ),
  );
  assert.ok(
    missingAccessibilityToolingReport.reviewSections.some(
      (section) => section.artifactType === "accessibility_conformance_report" && section.reason === "automatedAuditAloneInsufficient",
    ),
  );

  const missingRaterUxAcceptanceReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    accessibilityConformanceReports: [
      {
        ...completePolicyBundleFixtures().accessibilityConformanceReports[0],
        id: "accessibility-conformance-missing-rater-ux-acceptance",
        raterUxAcceptanceChecks: REQUIRED_RATER_UX_ACCEPTANCE_CHECKS.filter((check) => check !== "autosaved_drafts_not_submitted"),
      },
    ],
  });
  assert.equal(missingRaterUxAcceptanceReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(
    missingRaterUxAcceptanceReport.reviewSections.some(
      (section) =>
        section.artifactType === "accessibility_conformance_report" &&
        section.reason === "raterUxAcceptanceChecks:autosaved_drafts_not_submitted",
    ),
  );

  const missingVisibilityMatrixEntryReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    visibilityPolicies: [
      {
        ...completePolicyBundleFixtures().visibilityPolicies[0],
        id: "visibility-policy-missing-auditor-matrix",
        roleFieldActionMatrix: Object.fromEntries(
          Object.entries(visibilityRoleFieldActionMatrix).filter(([key]) => key !== "auditorReleaseRead"),
        ),
      },
    ],
  });
  assert.equal(missingVisibilityMatrixEntryReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(
    missingVisibilityMatrixEntryReport.reviewSections.some(
      (section) => section.artifactType === "visibility_policy" && section.reason === "roleFieldActionMatrix:auditorReleaseRead",
    ),
  );

  const ordinaryEvidenceSpanRequiredReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    ratingWorkflowProfiles: [
      {
        ...completePolicyBundleFixtures().ratingWorkflowProfiles[0],
        requiredIssuePanels: ["safe_decline", "source_recognition", "item_issue_report", "evidence_spans"],
      },
    ],
  });
  assert.equal(ordinaryEvidenceSpanRequiredReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(
    ordinaryEvidenceSpanRequiredReport.reviewSections.some((section) => section.reason === "requiredIssuePanels:advanced_not_optional:evidence_spans"),
  );

  const missingWorkflowRequirednessPolicyReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    ratingWorkflowProfiles: [
      {
        ...completePolicyBundleFixtures().ratingWorkflowProfiles[0],
        evidenceSpanRequirednessPolicy: "required_for_all_live_ratings",
        verificationWorkspaceRequirednessPolicy: "",
      },
    ],
  });
  assert.equal(missingWorkflowRequirednessPolicyReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(
    missingWorkflowRequirednessPolicyReport.reviewSections.some(
      (section) => section.reason === "evidenceSpanRequirednessPolicy:optional_ordinary_required_for_disputed_release_critical",
    ),
  );
  assert.ok(
    missingWorkflowRequirednessPolicyReport.reviewSections.some(
      (section) => section.reason === "verificationWorkspaceRequirednessPolicy:required_for_correctness_sensitive_unresolved_cases",
    ),
  );

  const ordinaryExplanationRequiredReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    scoreExplanationPolicies: [
      {
        ...completePolicyBundleFixtures().scoreExplanationPolicies[0],
        ordinaryRequiredFields: ["seven_scores", "confidence_low_medium_high", "score_explanation"],
      },
    ],
  });
  assert.equal(ordinaryExplanationRequiredReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(ordinaryExplanationRequiredReport.reviewSections.some((section) => section.reason === "ordinaryRequiredFields:unexpected:score_explanation"));

  const missingOptionalEvidenceSpanReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    scoreExplanationPolicies: [
      {
        ...completePolicyBundleFixtures().scoreExplanationPolicies[0],
        optionalFields: ["general_rating_note"],
      },
    ],
  });
  assert.equal(missingOptionalEvidenceSpanReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(missingOptionalEvidenceSpanReport.reviewSections.some((section) => section.reason === "optionalFields:optional_evidence_spans"));

  const unsupportedOptionalScoreExplanationFieldReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    scoreExplanationPolicies: [
      {
        ...completePolicyBundleFixtures().scoreExplanationPolicies[0],
        optionalFields: ["general_rating_note", "optional_evidence_spans", "private_peer_note"],
      },
    ],
  });
  assert.equal(unsupportedOptionalScoreExplanationFieldReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(unsupportedOptionalScoreExplanationFieldReport.reviewSections.some((section) => section.reason === "optionalFields:unexpected:private_peer_note"));

  const missingSurprisingTriggerReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    scoreExplanationPolicies: [
      {
        ...completePolicyBundleFixtures().scoreExplanationPolicies[0],
        triggerList: scoreExplanationTriggerRules.filter((trigger) => trigger !== "surprising_score"),
      },
    ],
  });
  assert.equal(missingSurprisingTriggerReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(missingSurprisingTriggerReport.reviewSections.some((section) => section.reason === "triggerList:surprising_score"));

  const missingScoreExplanationMetadataReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    scoreExplanationPolicies: [
      {
        ...completePolicyBundleFixtures().scoreExplanationPolicies[0],
        qaRoutingPolicy: "",
        protectedSplitCompatibilityClass: "",
        createdBy: "",
        timestamp: "",
      },
    ],
  });
  assert.equal(missingScoreExplanationMetadataReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(missingScoreExplanationMetadataReport.reviewSections.some((section) => section.reason === "qaRoutingPolicy"));
  assert.ok(missingScoreExplanationMetadataReport.reviewSections.some((section) => section.reason === "protectedSplitCompatibilityClass"));
  assert.ok(missingScoreExplanationMetadataReport.reviewSections.some((section) => section.reason === "createdBy"));
  assert.ok(missingScoreExplanationMetadataReport.reviewSections.some((section) => section.reason === "timestamp"));

  const mismatchedScoreExplanationThresholdReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    scoreExplanationPolicies: [
      {
        ...completePolicyBundleFixtures().scoreExplanationPolicies[0],
        extremeScoreThresholdLow: 0.2,
        extremeScoreThresholdHigh: 0.8,
        inconsistencyRules: [],
        overallVsCentralityStrengthGapThreshold: 0.4,
      },
    ],
  });
  assert.equal(mismatchedScoreExplanationThresholdReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(mismatchedScoreExplanationThresholdReport.reviewSections.some((section) => section.reason === "extremeScoreThresholdLow:0.1"));
  assert.ok(mismatchedScoreExplanationThresholdReport.reviewSections.some((section) => section.reason === "extremeScoreThresholdHigh:0.9"));
  assert.ok(mismatchedScoreExplanationThresholdReport.reviewSections.some((section) => section.reason === "inconsistencyRules:correctness_lte_0_25_and_strength_gte_0_75"));
  assert.ok(mismatchedScoreExplanationThresholdReport.reviewSections.some((section) => section.reason === "overallVsCentralityStrengthGapThreshold:0.25"));

  const unsupportedScoreExplanationVocabularyReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    scoreExplanationPolicies: [
      {
        ...completePolicyBundleFixtures().scoreExplanationPolicies[0],
        triggerList: [...scoreExplanationTriggerRules, "peer_disagreement"],
        inconsistencyRules: ["correctness_lte_0_25_and_strength_gte_0_75", "private_model_disagreement"],
      },
    ],
  });
  assert.equal(unsupportedScoreExplanationVocabularyReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(unsupportedScoreExplanationVocabularyReport.reviewSections.some((section) => section.reason === "triggerList:unexpected:peer_disagreement"));
  assert.ok(unsupportedScoreExplanationVocabularyReport.reviewSections.some((section) => section.reason === "inconsistencyRules:unexpected:private_model_disagreement"));

  const leakyScoreExplanationPromptReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    scoreExplanationPolicies: [
      {
        ...completePolicyBundleFixtures().scoreExplanationPolicies[0],
        protectedStatusBlindPromptCopy: "Explain because this is a hidden-benchmark item with model-judge disagreement.",
        sentenceGuidance: "Write one or two sentences about the validation label context.",
        qaRoutingPolicy: "route to QA with source, label, model, and protected-status context visible",
      },
    ],
  });
  assert.equal(leakyScoreExplanationPromptReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(
    leakyScoreExplanationPromptReport.reviewSections.some((section) => section.reason === "protectedStatusBlindPromptCopy:blind_safe"),
  );
  assert.ok(leakyScoreExplanationPromptReport.reviewSections.some((section) => section.reason === "sentenceGuidance:blind_safe"));
  assert.ok(leakyScoreExplanationPromptReport.reviewSections.some((section) => section.reason === "qaRoutingPolicy:blind_safe"));

  const missingEscalationTriggerReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    ratingEscalationPolicies: [
      {
        ...completePolicyBundleFixtures().ratingEscalationPolicies[0],
        triggerList: ratingEscalationTriggerRules.filter((trigger) => trigger !== "needs_verification"),
      },
    ],
  });
  assert.equal(missingEscalationTriggerReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(missingEscalationTriggerReport.reviewSections.some((section) => section.reason === "triggerList:needs_verification"));

  const mismatchedEscalationThresholdReport = buildPolicyBundleEvidenceReport("october-2026-demo", {
    ...completePolicyBundleFixtures(),
    ratingEscalationPolicies: [
      {
        ...completePolicyBundleFixtures().ratingEscalationPolicies[0],
        lowClarityThreshold: 0.4,
        initialOverallSpreadThreshold: 0.4,
        serviceLevelByTrigger: {
          ...ratingEscalationServiceLevels,
          hidden_status_routing: "unsupported",
        },
      },
    ],
  });
  assert.equal(mismatchedEscalationThresholdReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(mismatchedEscalationThresholdReport.reviewSections.some((section) => section.reason === "lowClarityThreshold:0.5"));
  assert.ok(mismatchedEscalationThresholdReport.reviewSections.some((section) => section.reason === "initialOverallSpreadThreshold:0.35"));
  assert.ok(
    mismatchedEscalationThresholdReport.reviewSections.some((section) => section.reason === "serviceLevelByTrigger:unexpected:hidden_status_routing"),
  );

  const driftedUiPolicyFixtures = completePolicyBundleFixtures();
  driftedUiPolicyFixtures.uiExperimentPolicies = [
    {
      ...driftedUiPolicyFixtures.uiExperimentPolicies[0],
      id: "ui-experiment-policy-underpowered",
      sensitivityMinimumPower: 0.6,
      sensitivityMinimumPerVariantCellCount: 30,
    },
  ];
  const driftedUiPolicyReport = buildPolicyBundleEvidenceReport("october-2026-demo", driftedUiPolicyFixtures);
  assert.equal(driftedUiPolicyReport.releaseUseStatus, "policy_bundle_review_required");
  assert.ok(
    driftedUiPolicyReport.reviewSections.some(
      (section) =>
        section.artifactType === "ui_experiment_policy" &&
        section.reason === `sensitivityMinimumPower:${REQUIRED_UI_VARIANT_SENSITIVITY_MINIMUM_POWER}`,
    ),
  );
  assert.ok(
    driftedUiPolicyReport.reviewSections.some(
      (section) =>
        section.artifactType === "ui_experiment_policy" &&
        section.reason === `sensitivityMinimumPerVariantCellCount:${REQUIRED_UI_VARIANT_SENSITIVITY_MIN_CELL_COUNT}`,
    ),
  );
});

test("score explanation triggers include surprising score flags", () => {
  const ordinaryScores = {
    centrality: 0.5,
    strength: 0.5,
    correctness: 0.5,
    clarity: 0.8,
    dead_weight: 0.1,
    single_issue: 0.8,
    overall: 0.25,
  };
  for (const dimension of RUBRIC_DIMENSIONS) {
    const extremeValue = dimension === "dead_weight" ? 0.95 : 0.05;
    assert.ok(
      scoreExplanationTriggersForRating({
        scores: { ...ordinaryScores, [dimension]: extremeValue },
        assignment: { queueType: "ordinary" },
      }).includes("extreme_score"),
      dimension,
    );
  }
  assert.deepEqual(
    scoreExplanationTriggersForRating({
      scores: ordinaryScores,
      flags: { surprisingScore: true },
      assignment: { queueType: "ordinary" },
    }),
    ["surprising_score"],
  );
  assert.deepEqual(
    scoreExplanationTriggersForRating({
      scores: { ...ordinaryScores, strength: 0.75, correctness: 0.25, overall: 0.38 },
      assignment: { queueType: "ordinary" },
    }),
    ["score_inconsistency"],
  );
  assert.deepEqual(
    scoreExplanationTriggersForRating({
      scores: { ...ordinaryScores, centrality: 0.9, strength: 0.9, overall: 0.5 },
      assignment: { queueType: "ordinary" },
    }),
    ["overall_product_gap"],
  );
  assert.deepEqual(
    scoreExplanationTriggersForRating({
      scores: ordinaryScores,
      flags: { targetUnclear: true },
      assignment: { queueType: "ordinary" },
    }),
    ["unclear_target"],
  );
  assert.deepEqual(
    scoreExplanationTriggersForRating({
      scores: ordinaryScores,
      assignment: { queueType: "ordinary" },
      kind: "revision",
      revisionReasonCode: "post_discussion_revision",
    }),
    ["post_discussion_revision"],
  );
  assert.deepEqual(
    scoreExplanationTriggersForRating({
      scores: ordinaryScores,
      assignment: { queueType: "hidden_benchmark" },
    }),
    ["high_stakes_workflow"],
  );
  for (const queueType of ["validation", "internal_validation", "protected_validation"]) {
    assert.deepEqual(
      scoreExplanationTriggersForRating({
        scores: ordinaryScores,
        assignment: { queueType },
      }),
      ["high_stakes_workflow"],
      queueType,
    );
  }
  assert.deepEqual(validateTriggeredScoreExplanation("One blind-safe sentence. Another short sentence.").ok, true);
  assert.deepEqual(validateTriggeredScoreExplanation("One sentence. Two sentence. Third sentence.").ok, false);

  for (const flag of ["sourceExposureUncertainty", "priorFamiliarityUncertainty", "conflictUncertainty"]) {
    assert.deepEqual(
      scoreExplanationTriggersForRating({
        scores: ordinaryScores,
        flags: { [flag]: true },
        assignment: { queueType: "ordinary" },
      }),
      ["exposure_familiarity_conflict_uncertainty"],
      flag,
    );
  }
});

test("score explanation audit recomputes trigger requiredness from rating context", () => {
  const report = buildScoreExplanationAuditReport("october-2026-demo", seedRatings);

  assert.equal(report.releaseUseStatus, "score_explanation_audit_passed");
  assert.equal(report.counts.ratingRows, seedRatings.length);
  assert.equal(report.counts.missingConfidenceJudgmentRows, 0);
  assert.equal(report.counts.triggerRequiredRows, 5);
  assert.equal(report.counts.triggerExplanationCompleteRows, 5);
  assert.equal(report.counts.triggerMismatchRows, 0);
  assert.equal(report.counts.policyBoundRows, seedRatings.length);
  assert.equal(report.counts.policyBindingReviewRows, 0);
  assert.equal(report.scoreExplanationPolicyRows.some((row) => row.id === "score-explanation-policy-october-2026-demo"), true);
  assert.equal(report.rows.every((row) => row.policyBindingStatus === "score_explanation_policy_bound"), true);
  assert.equal(report.byExpectedTrigger.high_stakes_workflow, 3);
  assert.equal(report.byExpectedTrigger.unclear_target, 2);

  const incompleteRatings = seedRatings.map((rating) =>
    rating.id === "rating-voting-bullet-a"
      ? {
          ...rating,
          scoreExplanation: "",
          scoreExplanationRequired: false,
          scoreExplanationTriggers: [],
        }
      : rating,
  );
  const incompleteReport = buildScoreExplanationAuditReport("october-2026-demo", incompleteRatings);

  assert.equal(incompleteReport.releaseUseStatus, "score_explanation_audit_review_required");
  assert.equal(incompleteReport.counts.triggerMismatchRows, 1);
  assert.ok(
    incompleteReport.reviewSections.some(
      (section) =>
        section.artifactId === "rating-voting-bullet-a" &&
        section.reason === "scoreExplanationTriggers:missing:high_stakes_workflow",
    ),
  );
  assert.ok(
    incompleteReport.reviewSections.some(
      (section) => section.artifactId === "rating-voting-bullet-a" && section.reason === "scoreExplanationRequired",
    ),
  );

  const submittedPolicy = completePolicyBundleFixtures().scoreExplanationPolicies[0];
  const submittedPolicyRating = {
    ...seedRatings[0],
    id: "rating-submitted-score-explanation-policy",
    scoreExplanationPolicyId: submittedPolicy.id,
  };
  const submittedPolicyReport = buildScoreExplanationAuditReport("release-test", [submittedPolicyRating], {
    scoreExplanationPolicies: [submittedPolicy],
  });
  assert.equal(submittedPolicyReport.releaseUseStatus, "score_explanation_audit_passed");
  assert.equal(submittedPolicyReport.rows[0].scoreExplanationPolicySource, "submitted_workflow_score_explanation_policy");
  assert.equal(submittedPolicyReport.rows[0].policyBindingStatus, "score_explanation_policy_bound");

  const unknownPolicyReport = buildScoreExplanationAuditReport("release-test", [
    {
      ...seedRatings[0],
      id: "rating-unknown-score-explanation-policy",
      scoreExplanationPolicyId: "score-explanation-policy-missing",
    },
  ]);
  assert.equal(unknownPolicyReport.releaseUseStatus, "score_explanation_audit_review_required");
  assert.equal(unknownPolicyReport.counts.policyBindingReviewRows, 1);
  assert.ok(
    unknownPolicyReport.reviewSections.some(
      (section) =>
        section.artifactId === "rating-unknown-score-explanation-policy" &&
        section.reason === "scoreExplanationPolicyId:not_found",
    ),
  );
});

test("release config manifest evidence gates governed bundle families and manifest verification", () => {
  const report = buildReleaseConfigManifestEvidenceReport("october-2026-demo", completeReleaseConfigManifestFixtures());

  assert.equal(report.releaseUseStatus, "submitted_release_config_manifest_evidence_complete");
  assert.equal(report.activeItemTextNormalizationPolicyId, "item-text-normalization-policy-submitted");
  assert.equal(report.itemTextNormalizationPolicyEvidence.releaseUseStatus, "submitted_item_text_normalization_policy_active");
  assert.equal(report.counts.submittedItemTextNormalizationPolicyCount, 1);
  assert.equal(report.counts.itemTextNormalizationPolicyReviewRows, 0);
	  assert.equal(report.counts.submittedCanonicalizationProfileCount, 1);
	  assert.equal(report.counts.submittedGovernedBundleCount, governedBundleFamilies.length);
	  assert.equal(report.counts.submittedGovernedBundleVerificationCount, governedBundleFamilies.length);
	  assert.equal(report.counts.passingBundleFamilyCount, governedBundleFamilies.length);
	  assert.equal(report.activeManifestId, "release-config-manifest-submitted");
	  assert.equal(report.activeManifestHash, "sha256:submitted-release-config");
	  assert.deepEqual(report.reviewSections, []);
});

test("release config manifest evidence rejects unverified or semantically mutated governed bundles", () => {
  const fixtures = completeReleaseConfigManifestFixtures();
  fixtures.governedBundleCanonicalizationProfiles = [
    ...fixtures.governedBundleCanonicalizationProfiles,
    {
      ...fixtures.governedBundleCanonicalizationProfiles[0],
      id: "canonicalization-profile-submitted-unscoped",
      environmentScopeFields: [],
    },
  ];
  fixtures.governedBundleRecords = [
    ...fixtures.governedBundleRecords,
    {
      ...fixtures.governedBundleRecords[0],
      id: "governed-bundle-submitted-rubric-mutated",
      canonicalContentHash: "sha256:mutated-rubric",
    },
  ];
  fixtures.releaseConfigManifests = fixtures.releaseConfigManifests.map((manifest) => ({
    ...manifest,
    governedBundleIds: [...manifest.governedBundleIds, "governed-bundle-submitted-rubric-mutated"],
  }));
  fixtures.governedBundleVerifications = fixtures.governedBundleVerifications
    .filter((verification) => verification.bundleFamily !== "metric")
    .map((verification) =>
      verification.bundleFamily === "rubric"
        ? {
            ...verification,
            observedHash: "sha256:wrong-rubric",
            manifestActivationBlockedOnMismatch: false,
          }
        : verification
    );
  fixtures.itemTextNormalizationPolicies = [
    ...fixtures.itemTextNormalizationPolicies,
    {
      ...itemTextNormalizationPolicy("item-text-normalization-policy-drifted"),
      hashRules: {
        ...itemTextNormalizationHashRules,
        whitespacePolicy: "collapse_all_whitespace_before_hashing",
      },
    },
  ];
  const report = buildReleaseConfigManifestEvidenceReport("october-2026-demo", fixtures);

  assert.equal(report.releaseUseStatus, "release_config_manifest_review_required");
  assert.ok(report.reviewSections.some((section) => section.artifactType === "item_text_normalization_policy" && section.reason === "hashRules"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "governed_bundle_canonicalization_profile" && section.reason === "environmentScopeFields"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "governed_bundle_verification" && section.reason === "observedHash"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "governed_bundle_verification" && section.reason === "manifestActivationBlockedOnMismatch"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "governed_bundle_family" && section.artifactId === "metric" && section.reason === "governed_bundle_verification_missing"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "release_config_manifest" && section.reason.includes("governedBundleVerifications:")));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "release_config_manifest" && section.reason.includes("semanticMutationAttempt:")));
});

test("participant safeguard evidence gates qualification, incentives, recognition, language artifacts, and provider data handling", () => {
  const report = buildParticipantSafeguardEvidenceReport("october-2026-demo", completeParticipantSafeguardFixtures());

  assert.equal(report.releaseUseStatus, "submitted_participant_safeguard_evidence_complete");
  assert.equal(report.counts.submittedVolunteerIncentivePolicyCount, 1);
  assert.equal(report.requiredCompensationCurrency, "USD");
  assert.deepEqual(report.requiredCompensationRateUsdByEligibleUnit, compensationRateUsdByEligibleUnit);
  assert.equal(report.requiredMonthlyCompensationCapUsd, 600);
  assert.deepEqual(report.volunteerIncentivePolicyRows.at(-1).compensationRateUsdByEligibleUnit, compensationRateUsdByEligibleUnit);
  assert.equal(report.volunteerIncentivePolicyRows.at(-1).monthlyCompensationCapUsd, 600);
  assert.equal(report.volunteerIncentivePolicyRows.at(-1).payrollLegalImplementationPolicy, payrollLegalImplementationPolicy);
  assert.equal(report.volunteerIncentivePolicyRows.at(-1).speedEffortGuardrails, "private QA-safe effort bands only; no public speed rewards");
  assert.equal(report.volunteerIncentivePolicyRows.at(-1).publicRecognitionPolicy, "participation acknowledgement without scores, speed, agreement, or benchmark ranking");
  assert.equal(report.volunteerIncentivePolicyRows.at(-1).privateProgressDashboardPolicy, "private non-gamified progress only");
  assert.equal(report.volunteerIncentivePolicyRows.at(-1).leaderboardBadgeRestrictions, "no peer, model, gold, hidden-benchmark, or speed leaderboards");
  assert.deepEqual(report.volunteerIncentivePolicyRows.at(-1).forbiddenCompensationInputs, []);
  assert.equal(report.counts.passingQualificationScopeCount, qualificationScopes.length);
  assert.equal(report.counts.submittedLanguageArtifactAssessmentCount, 1);
  assert.equal(report.languageArtifactAssessmentRows.at(-1).sourceAdaptationRoute, "VivesDebate_adapted");
  assert.deepEqual(report.languageArtifactSummary.byArtifactType, { machine_translation_residue: 1 });
  assert.deepEqual(report.languageArtifactSummary.bySourceLanguage, { es: 1 });
  assert.deepEqual(report.languageArtifactSummary.byTranslationStatus, { machine_translation_reviewed: 1 });
  assert.deepEqual(report.languageArtifactSummary.bySourceAdaptationRoute, { VivesDebate_adapted: 1 });
  assert.deepEqual(report.languageArtifactSummary.byPinDownabilityImpact, { none: 1 });
  assert.equal(report.languageArtifactSummary.automaticScorePenaltyAppliedCount, 0);
  assert.equal(report.counts.submittedSourceRecognitionEventCount, 1);
  assert.equal(report.counts.passingModelProviderRunClassCount, modelProviderRunClasses.length);
  assert.equal(report.modelProviderEndpointContractPolicyVersion, modelProviderEndpointContractPolicyVersion);
  assert.deepEqual(report.requiredModelProviderEndpointContractClauses, modelProviderEndpointContractClauses);
  assert.equal(report.sourceRecognitionRows.at(-1).recognizedOrPriorExposureNonblindFlag, null);
  assert.equal(report.modelProviderDataHandlingPolicyRows.at(-1).policyVersion, modelProviderEndpointContractPolicyVersion);
  assert.deepEqual(report.modelProviderDataHandlingPolicyRows.at(-1).endpointContractClauses, modelProviderEndpointContractClauses);
  assert.equal(report.modelProviderDataHandlingPolicyRows.at(-1).endpointContractLanguageFrozen, true);
  assert.equal(report.modelProviderDataHandlingPolicyRows.at(-1).contractAppliesToProtectedContent, true);
  assert.deepEqual(report.reviewSections, []);

  const unsafeRecognitionFixtures = completeParticipantSafeguardFixtures();
  unsafeRecognitionFixtures.sourceRecognitionEvents = [
    {
      ...unsafeRecognitionFixtures.sourceRecognitionEvents[0],
      id: "source-recognition-unsafe-independent-count",
      independentBlindEligibilityEffect: "excluded_but_count_as_independent_blind_rating",
    },
  ];
  const unsafeRecognitionReport = buildParticipantSafeguardEvidenceReport("october-2026-demo", unsafeRecognitionFixtures);
  assert.equal(unsafeRecognitionReport.releaseUseStatus, "participant_safeguard_review_required");
  assert.ok(
    unsafeRecognitionReport.reviewSections.some(
      (section) => section.artifactType === "source_recognition_event" && section.reason === "independentBlindEligibilityEffect:counts_independent",
    ),
  );

  const driftedCompensationFixtures = completeParticipantSafeguardFixtures();
  driftedCompensationFixtures.volunteerIncentivePolicies = [
    {
      ...driftedCompensationFixtures.volunteerIncentivePolicies[0],
      id: "volunteer-incentive-drifted-compensation",
      monthlyCompensationCapUsd: 1000,
    },
  ];
  const driftedCompensationReport = buildParticipantSafeguardEvidenceReport("october-2026-demo", driftedCompensationFixtures);
  assert.equal(driftedCompensationReport.releaseUseStatus, "participant_safeguard_review_required");
  assert.ok(
    driftedCompensationReport.reviewSections.some(
      (section) => section.artifactType === "volunteer_incentive_policy" && section.reason === "monthlyCompensationCapUsd",
    ),
  );

  const weakIncentiveFixtures = completeParticipantSafeguardFixtures();
  weakIncentiveFixtures.volunteerIncentivePolicies = [
    {
      ...weakIncentiveFixtures.volunteerIncentivePolicies[0],
      id: "volunteer-incentive-weak-leaderboard-policy",
      allowedCompensationCreditInputs: [
        ...weakIncentiveFixtures.volunteerIncentivePolicies[0].allowedCompensationCreditInputs,
        "model_agreement",
      ],
      speedEffortGuardrails: "QA effort bands",
      publicRecognitionPolicy: "public acknowledgement with no ranking",
      leaderboardBadgeRestrictions: "no leaderboard",
    },
  ];
  const weakIncentiveReport = buildParticipantSafeguardEvidenceReport("october-2026-demo", weakIncentiveFixtures);
  assert.equal(weakIncentiveReport.releaseUseStatus, "participant_safeguard_review_required");
  assert.ok(
    weakIncentiveReport.reviewSections.some(
      (section) => section.artifactType === "volunteer_incentive_policy" && section.reason === "allowedCompensationCreditInputs:prohibited:model_agreement",
    ),
  );
  assert.ok(
    weakIncentiveReport.reviewSections.some((section) => section.artifactType === "volunteer_incentive_policy" && section.reason === "leaderboardBadgeRestrictions"),
  );

  const incompleteQualificationFixtures = completeParticipantSafeguardFixtures();
  incompleteQualificationFixtures.raterQualificationRecords = incompleteQualificationFixtures.raterQualificationRecords.map((record) =>
    record.qualificationScope === "hidden_benchmark_expert" ? { ...record, splitWorkflowEligibility: ["release_critical", "validation"] } : record,
  );
  const incompleteQualificationReport = buildParticipantSafeguardEvidenceReport("october-2026-demo", incompleteQualificationFixtures);
  assert.equal(incompleteQualificationReport.releaseUseStatus, "participant_safeguard_review_required");
  assert.ok(
    incompleteQualificationReport.reviewSections.some(
      (section) => section.artifactType === "rater_qualification_record" && section.reason === "splitWorkflowEligibility:hidden_benchmark",
    ),
  );

  const driftedModelProviderContractFixtures = completeParticipantSafeguardFixtures();
  driftedModelProviderContractFixtures.modelProviderDataHandlingPolicies = driftedModelProviderContractFixtures.modelProviderDataHandlingPolicies.map((policy) =>
    policy.coveredRunClass === "model_evaluation"
      ? {
          ...policy,
          id: "model-provider-data-handling-drifted-contract",
          endpointContractClauses: {
            ...modelProviderEndpointContractClauses,
            noPromptOrOutputReuse: "Provider may reuse prompts for service-quality examples.",
          },
          endpointContractLanguageFrozen: false,
        }
      : policy,
  );
  const driftedModelProviderContractReport = buildParticipantSafeguardEvidenceReport("october-2026-demo", driftedModelProviderContractFixtures);
  assert.equal(driftedModelProviderContractReport.releaseUseStatus, "participant_safeguard_review_required");
  assert.ok(
    driftedModelProviderContractReport.reviewSections.some(
      (section) => section.artifactType === "model_provider_data_handling_policy" && section.reason === "endpointContractClauses",
    ),
  );
  assert.ok(
    driftedModelProviderContractReport.reviewSections.some(
      (section) => section.artifactType === "model_provider_data_handling_policy" && section.reason === "endpointContractLanguageFrozen",
    ),
  );
});

test("continued source-recognition rows carry the RLHF91 nonblind protected-denominator flag", () => {
  const fixtures = completeParticipantSafeguardFixtures();
  fixtures.sourceRecognitionEvents = [
    {
      ...fixtures.sourceRecognitionEvents[0],
      id: "source-recognition-continued-nonblind",
      raterAction: "continue_nonblind",
      independentBlindEligibilityEffect: "excluded_from_independent_protected_blind_denominator_after_source_recognition_review",
      reviewerResolution: "expert_review_completed_label_excluded_from_independent_blind_denominator",
    },
  ];

  const report = buildParticipantSafeguardEvidenceReport("october-2026-demo", fixtures);

  assert.equal(report.releaseUseStatus, "submitted_participant_safeguard_evidence_complete");
  assert.equal(report.sourceRecognitionRows.at(-1).recognizedOrPriorExposureNonblindFlag, SOURCE_RECOGNITION_NONBLIND_FLAG);
  assert.equal(report.sourceRecognitionRows.at(-1).recognizedOrPriorExposureNonblindFlag, "recognized_or_prior_exposure_nonblind");
  assert.deepEqual(report.reviewSections, []);
});

test("rating experience evidence gates score provenance, linting, issue triage, drafts, worksheets, and retention", () => {
  const report = buildRatingExperienceEvidenceReport("october-2026-demo", completeRatingExperienceFixtures());

  assert.equal(report.releaseUseStatus, "submitted_rating_experience_evidence_complete");
  assert.equal(report.counts.submittedTaskOutputEligibilityPolicyCount, 1);
  assert.equal(report.counts.submittedScoreInputPolicyCount, 1);
  assert.equal(report.counts.submittedDraftStoragePolicyCount, 1);
  assert.equal(report.counts.submittedRaterInstructionCompatibilityPolicyCount, 1);
  assert.equal(report.counts.submittedRaterInstructionRenderVersionCount, 1);
  assert.equal(report.counts.submittedRaterInstructionComprehensionAuditCount, 1);
  assert.equal(report.raterInstructionCompatibilityPolicyReleaseUseStatus, "submitted_rater_instruction_compatibility_policy_active");
  assert.equal(report.raterInstructionCompatibilityPolicyId, "rater-instruction-compatibility-policy-submitted");
  assert.deepEqual(report.requiredRaterInstructionCompatibilityClasses, raterInstructionCompatibilityClasses);
  assert.deepEqual(report.requiredRaterInstructionCompatibilityThresholds, raterInstructionCompatibilityThresholds);
  assert.deepEqual(report.requiredRaterInstructionCompatibilityRules, raterInstructionCompatibilityRules);
  assert.equal(report.requiredRaterInstructionComprehensionAuditVersion, raterInstructionComprehensionAuditVersion);
  assert.deepEqual(report.requiredRaterInstructionComprehensionScreens, raterInstructionComprehensionScreens);
  assert.deepEqual(report.requiredRaterInstructionComprehensionMethods, raterInstructionComprehensionMethods);
  assert.deepEqual(report.requiredRaterInstructionComprehensionChecks, raterInstructionComprehensionChecks);
  assert.deepEqual(report.requiredRaterInstructionDisclosureDepths, raterInstructionDisclosureDepths);
  assert.equal(report.raterInstructionRenderVersionRows.at(-1).raterInstructionCompatibilityPolicyId, "rater-instruction-compatibility-policy-submitted");
  assert.equal(report.raterInstructionRenderVersionRows.at(-1).renderCompatibilityClass, "protected_release_critical_same_policy_family");
  assert.equal(report.raterInstructionComprehensionAuditRows.at(-1).raterInstructionRenderVersionId, "rater-instruction-render-submitted");
  assert.equal(report.raterInstructionComprehensionAuditRows.at(-1).raterInstructionCompatibilityPolicyId, "rater-instruction-compatibility-policy-submitted");
  assert.equal(report.raterInstructionComprehensionAuditRows.at(-1).excludedFromScoreComputation, true);
  assert.equal(report.raterInstructionComprehensionAuditRows.at(-1).excludedFromIndependentBlindDenominator, true);
  assert.equal(report.counts.submittedRubricLintConfigCount, 1);
  assert.equal(report.counts.submittedRubricLintEventCount, 1);
  assert.deepEqual(report.rubricLintConfigRows.at(-1).triggerThresholds, rubricLintTriggerThresholds);
  assert.deepEqual(report.rubricLintConfigRows.at(-1).acknowledgementModes, rubricLintAcknowledgementModes);
  assert.equal(report.counts.submittedItemIssueQuarantinePolicyCount, 1);
  assert.deepEqual(report.itemIssueQuarantinePolicyRows.at(-1).severityCategories, itemIssueSeverityCategories);
  assert.deepEqual(report.itemIssueQuarantinePolicyRows.at(-1).quarantineSlaHoursBySeverity, itemIssueQuarantineSlaHoursBySeverity);
  assert.equal(report.counts.submittedItemIssueReportCount, 1);
  assert.equal(report.counts.submittedItemIssueActionCount, 2);
  assert.equal(report.counts.submittedItemIssueQuarantineActionCount, 1);
  assert.equal(report.counts.passingItemIssueActionCoverageCount, 1);
  assert.equal(report.counts.submittedRatingDraftSessionCount, 1);
  assert.equal(report.counts.submittedCorrectnessClaimWeightWorksheetCount, 1);
  assert.equal(report.counts.submittedProtectedArtifactRetentionRecordCount, protectedArtifactTypes.length);
  assert.equal(report.counts.submittedScoreConfidenceScalePolicyCount, 1);
  assert.equal(report.counts.submittedScoreConfidenceAnnotationCount, 1);
  assert.equal(report.counts.submittedRaterScoreConfidenceCount, 1);
  assert.equal(report.scoreConfidenceScalePolicyReleaseUseStatus, "submitted_score_confidence_scale_policy_active");
  assert.equal(report.scoreConfidenceScalePolicyId, "score-confidence-scale-policy-submitted");
  assert.deepEqual(report.requiredScoreConfidenceBands, scoreConfidenceBands);
  assert.deepEqual(report.requiredScoreConfidenceNumericThresholds, scoreConfidenceNumericThresholds);
  assert.deepEqual(report.requiredScoreConfidenceReasonCodes, scoreConfidenceReasonCodes);
  assert.equal(report.counts.submittedRationaleEvidenceSpanRequirednessPolicyCount, 1);
  assert.equal(report.counts.submittedRationaleEvidenceSpanCount, 1);
  assert.equal(report.rationaleEvidenceSpanRequirednessPolicyReleaseUseStatus, "submitted_rationale_evidence_span_requiredness_policy_active");
  assert.equal(report.rationaleEvidenceSpanRequirednessPolicyId, "rationale-evidence-span-requiredness-policy-submitted");
  assert.deepEqual(report.requiredRationaleEvidenceSpanMandatoryTriggerClasses, rationaleEvidenceSpanMandatoryTriggerClasses);
  assert.deepEqual(report.requiredRationaleEvidenceSpanRequirednessThresholds, rationaleEvidenceSpanRequirednessThresholds);
  assert.deepEqual(report.requiredRationaleEvidenceSpanCoverageRules, rationaleEvidenceSpanCoverageRules);
  assert.equal(report.itemIssueReportRows.at(-1).itemIssueQuarantinePolicyId, "item-issue-quarantine-policy-submitted");
  assert.equal(report.itemIssueReportRows.at(-1).reporterExposureState, "initial_blind");
  assert.equal(report.itemIssueReportRows.at(-1).quarantineStalePropagationState, "quarantine_stale_propagation_pending_review");
  assert.equal(report.itemIssueActionRows.at(-1).action, "quarantine");
  assert.equal(report.itemIssueActionCoverageRows.at(-1).quarantineActionId, "item-issue-action-submitted-quarantine");
  assert.equal(report.draftStoragePolicyRows.at(-1).serverSidePersistenceDefault, true);
  assert.equal(report.draftStoragePolicyRows.at(-1).clientStatePolicy, "ephemeral_in_memory_only");
  assert.equal(report.ratingDraftSessionRows.at(-1).resumeCount, 1);
  assert.equal(report.ratingDraftSessionRows.at(-1).abandonedVsSubmittedStatus, "draft_not_submitted");
  assert.equal(report.ratingDraftSessionRows.at(-1).dependencyVersionSnapshot.draftStoragePolicyId, "draft-storage-policy-submitted");
  assert.equal(report.correctnessClaimWeightWorksheetRows.at(-1).overrideExplanation, "Rater preserved the submitted correctness score after reviewing weighted claim evidence.");
  assert.equal(report.correctnessClaimWeightWorksheetRows.at(-1).createdBy, "demo-expert");
  assert.deepEqual(report.correctnessClaimWeightWorksheetRows.at(-1).correctnessCredenceStatusRows.map((row) => [row.claimSpanId, row.status, row.correctnessCredence]), [
    ["claim-span-1", "verified", 0.8],
    ["claim-span-2", "unresolved", 0.5],
  ]);
  assert.equal(report.correctnessClaimWeightWorksheetRows.at(-1).computedAdvisoryAggregateCorrectnessEstimate, 0.71);
  assert.equal(report.scoreConfidenceScalePolicyRows.at(-1).scaleVersion, scoreConfidenceScaleVersion);
  assert.equal(report.scoreConfidenceAnnotationRows.at(-1).scoreConfidenceScalePolicyId, "score-confidence-scale-policy-submitted");
  assert.equal(report.raterScoreConfidenceRows.at(-1).entityType, "RaterScoreConfidence");
  assert.ok(report.allowedRationaleEvidenceSpanLinkCategories.includes("attacked_claim"));
  assert.ok(report.allowedRationaleEvidenceSpanLinkCategories.includes("unclear_language"));
  assert.equal(report.rationaleEvidenceSpanRows.at(-1).visibilityState, "locked_initial_hidden");
  assert.equal(report.rationaleEvidenceSpanRows.at(-1).hiddenUntilInitialRatingLock, true);
  assert.equal(report.rationaleEvidenceSpanRows.at(-1).rationaleEvidenceSpanRequirednessPolicyId, "rationale-evidence-span-requiredness-policy-submitted");
  assert.equal(report.rationaleEvidenceSpanRows.at(-1).mandatoryTriggerClass, "score_explanation_triggered");
  assert.equal(report.counts.submittedSamePositionScratchpadCount, 1);
  assert.equal(report.counts.submittedSamePositionBatchReviewRequirednessPolicyCount, 1);
  assert.equal(report.counts.submittedSamePositionBatchReviewCount, 1);
  assert.equal(report.samePositionBatchReviewRequirednessPolicyReleaseUseStatus, "submitted_same_position_batch_review_requiredness_policy_active");
  assert.equal(report.samePositionBatchReviewRequirednessPolicyId, "same-position-batch-review-requiredness-policy-submitted");
  assert.deepEqual(report.requiredSamePositionBatchReviewThresholds, samePositionBatchReviewThresholds);
  assert.deepEqual(report.requiredSamePositionBatchReviewRules, samePositionBatchReviewRules);
  assert.equal(
    report.samePositionBatchReviewRows.at(-1).samePositionBatchReviewRequirednessPolicyId,
    "same-position-batch-review-requiredness-policy-submitted",
  );
  assert.equal(report.samePositionBatchReviewRows.at(-1).requirednessTriggerClass, "same_position_session_completed");
  assert.equal(report.samePositionBatchReviewRows.at(-1).excludedFromIndependentRaterCount, true);
  assert.equal(report.counts.submittedExternalAssistanceContaminationPolicyCount, 1);
  assert.equal(report.counts.externalAssistanceContaminationPolicyReviewRows, 0);
  assert.equal(report.externalAssistanceContaminationPolicyReleaseUseStatus, "submitted_external_assistance_contamination_policy_active");
  assert.equal(report.externalAssistanceContaminationPolicyId, "external-assistance-contamination-policy-submitted");
  assert.deepEqual(report.requiredExternalAssistanceTypes, externalAssistanceTypes);
  assert.deepEqual(report.requiredExternalAssistanceContaminatingTypes, externalAssistanceContaminatingTypes);
  assert.deepEqual(report.requiredExternalAssistanceContaminationRoutes, externalAssistanceContaminationRoutes);
  assert.deepEqual(report.requiredExternalAssistanceCleanRoutes, externalAssistanceCleanRoutes);
  assert.deepEqual(report.requiredExternalAssistanceAccessibilityStatuses, externalAssistanceAccessibilityStatuses);
  assert.deepEqual(report.requiredExternalAssistanceContaminationRules, externalAssistanceContaminationRules);
  assert.equal(report.counts.submittedExternalAssistanceDeclarationCount, 1);
  assert.equal(
    report.externalAssistanceDeclarationRows.at(-1).externalAssistanceContaminationPolicyId,
    "external-assistance-contamination-policy-submitted",
  );
  assert.equal(report.counts.passingProtectedArtifactTypeCount, protectedArtifactTypes.length);
  assert.deepEqual(report.reviewSections, []);

  const malformedWorksheetFixtures = completeRatingExperienceFixtures();
  malformedWorksheetFixtures.correctnessClaimWeightWorksheets = [
    {
      ...malformedWorksheetFixtures.correctnessClaimWeightWorksheets[0],
      id: "correctness-claim-weight-worksheet-malformed",
      claimSignificanceWeights: [0.8, 0.4],
      correctnessCredencesStatuses: ["verified", "unresolved:0.5"],
      unclearClaimExclusionFlags: [false],
      advisoryAggregateCorrectnessEstimate: 0.2,
    },
  ];
  const malformedWorksheetReport = buildRatingExperienceEvidenceReport("october-2026-demo", malformedWorksheetFixtures);
  assert.equal(malformedWorksheetReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    malformedWorksheetReport.reviewSections.some(
      (section) => section.artifactType === "correctness_claim_weight_worksheet" && section.reason === "claimSignificanceWeightsSum",
    ),
  );
  assert.ok(
    malformedWorksheetReport.reviewSections.some(
      (section) => section.artifactType === "correctness_claim_weight_worksheet" && section.reason === "correctnessCredencesStatuses",
    ),
  );
  assert.ok(
    malformedWorksheetReport.reviewSections.some(
      (section) => section.artifactType === "correctness_claim_weight_worksheet" && section.reason === "unclearClaimExclusionFlags",
    ),
  );
  assert.ok(
    malformedWorksheetReport.reviewSections.some(
      (section) =>
        section.artifactType === "correctness_claim_weight_worksheet" &&
        section.reason === "advisoryAggregateCorrectnessEstimate:weighted_claim_mismatch",
    ),
  );

  const driftedExternalAssistancePolicyReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    externalAssistanceContaminationPolicies: [
      {
        ...externalAssistanceContaminationPolicy("external-assistance-contamination-policy-drifted"),
        contaminatingAssistanceTypes: ["LLM"],
      },
    ],
  });
  assert.equal(driftedExternalAssistancePolicyReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.equal(
    driftedExternalAssistancePolicyReport.externalAssistanceContaminationPolicyReleaseUseStatus,
    "submitted_external_assistance_contamination_policy_review_required",
  );
  assert.ok(
    driftedExternalAssistancePolicyReport.reviewSections.some(
      (section) => section.artifactType === "external_assistance_contamination_policy" && section.reason === "contaminatingAssistanceTypes",
    ),
  );

  const missingProtectedValidationExclusionReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    taskOutputEligibilityPolicies: [
      {
        ...completeRatingExperienceFixtures().taskOutputEligibilityPolicies[0],
        protectedSplitExclusions: ["hidden_benchmark"],
      },
    ],
  });
  assert.equal(missingProtectedValidationExclusionReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    missingProtectedValidationExclusionReport.reviewSections.some(
      (section) => section.artifactType === "task_output_eligibility_policy" && section.reason === "protectedSplitExclusions:protected_validation",
    ),
  );

  const missingCorrectnessStrengthLintReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    rubricLintConfigs: [
      {
        ...completeRatingExperienceFixtures().rubricLintConfigs[0],
        id: "rubric-lint-config-missing-correctness-strength",
        lintRuleIds: rubricLintRules.filter((rule) => rule !== "correctness_strength_consistency"),
      },
    ],
  });
  assert.equal(missingCorrectnessStrengthLintReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    missingCorrectnessStrengthLintReport.reviewSections.some(
      (section) => section.artifactType === "rubric_lint_config" && section.reason === "lintRuleIds:correctness_strength_consistency",
    ),
  );

  const mismatchedLintThresholdReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    rubricLintConfigs: [
      {
        ...completeRatingExperienceFixtures().rubricLintConfigs[0],
        id: "rubric-lint-config-mismatched-threshold",
        thresholdVersion: "rubric-lint-thresholds-draft",
        triggerThresholds: {
          ...rubricLintTriggerThresholds,
          centrality_strength_product_gap: { overallProductGapMin: 0.4 },
        },
        acknowledgementModes: ["acknowledge"],
      },
    ],
  });
  assert.equal(mismatchedLintThresholdReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    mismatchedLintThresholdReport.reviewSections.some((section) => section.artifactType === "rubric_lint_config" && section.reason === "thresholdVersion:rubric-lint-thresholds-rlhf90-v1"),
  );
  assert.ok(
    mismatchedLintThresholdReport.reviewSections.some((section) => section.artifactType === "rubric_lint_config" && section.reason === "triggerThresholds:mismatch:centrality_strength_product_gap"),
  );
  assert.ok(
    mismatchedLintThresholdReport.reviewSections.some((section) => section.artifactType === "rubric_lint_config" && section.reason === "acknowledgementModes:explain,route_to_qa"),
  );

  const driftedCompatibilityPolicyReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    raterInstructionCompatibilityPolicies: [
      {
        ...raterInstructionCompatibilityPolicy("rater-instruction-compatibility-policy-drifted"),
        thresholds: {
          ...raterInstructionCompatibilityThresholds,
          maxChangedMappedCopyStringsWithoutReview: 1,
        },
      },
    ],
  });
  assert.equal(driftedCompatibilityPolicyReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.equal(
    driftedCompatibilityPolicyReport.raterInstructionCompatibilityPolicyReleaseUseStatus,
    "submitted_rater_instruction_compatibility_policy_review_required",
  );
  assert.ok(
    driftedCompatibilityPolicyReport.reviewSections.some(
      (section) => section.artifactType === "rater_instruction_compatibility_policy" && section.reason === "thresholds",
    ),
  );

  const mismatchedRenderCompatibilityReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    raterInstructionRenderVersions: [
      {
        ...completeRatingExperienceFixtures().raterInstructionRenderVersions[0],
        id: "rater-instruction-render-wrong-compatibility",
        raterInstructionCompatibilityPolicyId: "rater-instruction-compatibility-policy-old",
      },
    ],
  });
  assert.equal(mismatchedRenderCompatibilityReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    mismatchedRenderCompatibilityReport.reviewSections.some(
      (section) => section.artifactType === "rater_instruction_render_version" && section.reason === "raterInstructionCompatibilityPolicyId",
    ),
  );

  const driftedComprehensionAuditReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    raterInstructionComprehensionAudits: [
      {
        ...completeRatingExperienceFixtures().raterInstructionComprehensionAudits[0],
        id: "rater-instruction-comprehension-audit-drifted",
        comprehensionCheckIds: raterInstructionComprehensionChecks.filter((checkId) => checkId !== "safe_decline_and_item_issue_paths_found"),
        excludedFromIndependentBlindDenominator: false,
      },
    ],
  });
  assert.equal(driftedComprehensionAuditReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    driftedComprehensionAuditReport.reviewSections.some(
      (section) =>
        section.artifactType === "rater_instruction_comprehension_audit" &&
        section.reason === "comprehensionCheckIds:safe_decline_and_item_issue_paths_found",
    ),
  );
  assert.ok(
    driftedComprehensionAuditReport.reviewSections.some(
      (section) => section.artifactType === "rater_instruction_comprehension_audit" && section.reason === "excludedFromIndependentBlindDenominator",
    ),
  );

  const driftedScoreConfidenceScaleReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    scoreConfidenceScalePolicies: [
      {
        ...scoreConfidenceScalePolicy("score-confidence-scale-policy-drifted"),
        numericThresholds: {
          ...scoreConfidenceNumericThresholds,
          highMinInclusive: 0.75,
        },
      },
    ],
  });
  assert.equal(driftedScoreConfidenceScaleReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.equal(driftedScoreConfidenceScaleReport.scoreConfidenceScalePolicyReleaseUseStatus, "submitted_score_confidence_scale_policy_review_required");
  assert.ok(
    driftedScoreConfidenceScaleReport.reviewSections.some(
      (section) => section.artifactType === "score_confidence_scale_policy" && section.reason === "numericThresholds",
    ),
  );

  const mismatchedScoreConfidenceScaleReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    scoreConfidenceAnnotations: [
      {
        ...completeRatingExperienceFixtures().scoreConfidenceAnnotations[0],
        id: "score-confidence-annotation-stale-scale",
        scoreConfidenceScalePolicyId: "score-confidence-scale-policy-old",
      },
    ],
  });
  assert.equal(mismatchedScoreConfidenceScaleReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    mismatchedScoreConfidenceScaleReport.reviewSections.some(
      (section) => section.artifactType === "score_confidence_annotation" && section.reason === "scoreConfidenceScalePolicyId",
    ),
  );

  const driftedBatchReviewRequirednessReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    samePositionBatchReviewRequirednessPolicies: [
      {
        ...samePositionBatchReviewRequirednessPolicy("same-position-batch-review-requiredness-policy-drifted"),
        thresholds: {
          ...samePositionBatchReviewThresholds,
          productOverallDeltaTriggerMin: 0.35,
        },
      },
    ],
  });
  assert.equal(driftedBatchReviewRequirednessReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.equal(
    driftedBatchReviewRequirednessReport.samePositionBatchReviewRequirednessPolicyReleaseUseStatus,
    "submitted_same_position_batch_review_requiredness_policy_review_required",
  );
  assert.ok(
    driftedBatchReviewRequirednessReport.reviewSections.some(
      (section) => section.artifactType === "same_position_batch_review_requiredness_policy" && section.reason === "thresholds",
    ),
  );

  const staleBatchReviewRequirednessReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    samePositionBatchReviews: [
      {
        ...completeRatingExperienceFixtures().samePositionBatchReviews[0],
        id: "same-position-batch-review-stale-policy",
        samePositionBatchReviewRequirednessPolicyId: "same-position-batch-review-requiredness-policy-old",
      },
    ],
  });
  assert.equal(staleBatchReviewRequirednessReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    staleBatchReviewRequirednessReport.reviewSections.some(
      (section) => section.artifactType === "same_position_batch_review" && section.reason === "samePositionBatchReviewRequirednessPolicyId",
    ),
  );

  const mismatchedItemIssuePolicyReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    itemIssueQuarantinePolicies: [
      {
        ...completeRatingExperienceFixtures().itemIssueQuarantinePolicies[0],
        id: "item-issue-quarantine-policy-drifted",
        quarantineSlaHoursBySeverity: {
          ...itemIssueQuarantineSlaHoursBySeverity,
          high: 48,
        },
      },
    ],
  });
  assert.equal(mismatchedItemIssuePolicyReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    mismatchedItemIssuePolicyReport.reviewSections.some(
      (section) => section.artifactType === "item_issue_quarantine_policy" && section.reason === "quarantineSlaHoursBySeverity",
    ),
  );

  const stalePolicyItemIssueReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    itemIssueReports: [
      {
        ...completeRatingExperienceFixtures().itemIssueReports[0],
        id: "item-issue-stale-policy",
        itemIssueQuarantinePolicyId: "item-issue-quarantine-policy-old",
      },
    ],
  });
  assert.equal(stalePolicyItemIssueReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    stalePolicyItemIssueReport.reviewSections.some(
      (section) => section.artifactType === "item_issue_report" && section.reason === "itemIssueQuarantinePolicyId",
    ),
  );

  const unsafeRationaleSpanReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    rationaleEvidenceSpans: [
      {
        ...completeRatingExperienceFixtures().rationaleEvidenceSpans[0],
        linkedDimensionOrFlag: "private_peer_label",
        visibilityState: "draft",
        hiddenUntilInitialRatingLock: false,
      },
    ],
  });
  assert.equal(unsafeRationaleSpanReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(unsafeRationaleSpanReport.reviewSections.some((section) => section.artifactType === "rationale_evidence_span" && section.reason === "linkedDimensionOrFlag"));
  assert.ok(unsafeRationaleSpanReport.reviewSections.some((section) => section.artifactType === "rationale_evidence_span" && section.reason === "visibilityState"));
  assert.ok(
    unsafeRationaleSpanReport.reviewSections.some((section) => section.artifactType === "rationale_evidence_span" && section.reason === "hiddenUntilInitialRatingLock"),
  );

  const driftedRationaleRequirednessPolicyReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    rationaleEvidenceSpanRequirednessPolicies: [
      {
        ...rationaleEvidenceSpanRequirednessPolicy("rationale-evidence-span-requiredness-policy-drifted"),
        thresholds: { ...rationaleEvidenceSpanRequirednessThresholds, lowClarityMax: 0.45 },
      },
    ],
  });
  assert.equal(driftedRationaleRequirednessPolicyReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.equal(
    driftedRationaleRequirednessPolicyReport.rationaleEvidenceSpanRequirednessPolicyReleaseUseStatus,
    "submitted_rationale_evidence_span_requiredness_policy_review_required",
  );
  assert.ok(
    driftedRationaleRequirednessPolicyReport.reviewSections.some(
      (section) => section.artifactType === "rationale_evidence_span_requiredness_policy" && section.reason === "thresholds",
    ),
  );

  const unsafeItemIssueReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    itemIssueReports: [
      {
        ...completeRatingExperienceFixtures().itemIssueReports[0],
        issueCategory: "benchmark_too_hard",
        labelVisibilityStateForTriage: "visible",
        modelResultVisibilityStateForTriage: "visible",
        quarantineStalePropagationState: "quarantine_pending_review",
        excludedFromLabelDenominator: false,
      },
    ],
  });
  assert.equal(unsafeItemIssueReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(unsafeItemIssueReport.reviewSections.some((section) => section.artifactType === "item_issue_report" && section.reason === "issueCategory"));
  assert.ok(unsafeItemIssueReport.reviewSections.some((section) => section.artifactType === "item_issue_report" && section.reason === "labelVisibilityStateForTriage"));
  assert.ok(unsafeItemIssueReport.reviewSections.some((section) => section.artifactType === "item_issue_report" && section.reason === "modelResultVisibilityStateForTriage"));
  assert.ok(unsafeItemIssueReport.reviewSections.some((section) => section.artifactType === "item_issue_report" && section.reason === "quarantineStalePropagationState"));
  assert.ok(unsafeItemIssueReport.reviewSections.some((section) => section.artifactType === "item_issue_report" && section.reason === "excludedFromLabelDenominator"));

  const unsafeItemIssueActionReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    itemIssueActions: [
      {
        ...completeRatingExperienceFixtures().itemIssueActions[0],
        action: "quarantine",
        quarantineScope: "none",
        labelVisibilityStateForTriage: "labels_visible_to_triage",
        modelResultVisibilityStateForTriage: "model_results_visible_to_triage",
      },
    ],
  });
  assert.equal(unsafeItemIssueActionReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(unsafeItemIssueActionReport.reviewSections.some((section) => section.artifactType === "item_issue_action" && section.reason === "quarantineScope"));
  assert.ok(unsafeItemIssueActionReport.reviewSections.some((section) => section.artifactType === "item_issue_action" && section.reason === "labelVisibilityStateForTriage"));

  const missingQuarantineActionReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    itemIssueActions: [completeRatingExperienceFixtures().itemIssueActions[0]],
  });
  assert.equal(missingQuarantineActionReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(
    missingQuarantineActionReport.reviewSections.some(
      (section) => section.artifactType === "item_issue_action_coverage" && section.reason === "quarantine_action_missing",
    ),
  );

  const incompleteRetentionReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    protectedArtifactRetentionRecords: completeRatingExperienceFixtures().protectedArtifactRetentionRecords.map((record) =>
      record.artifactType === "cache"
        ? {
            ...record,
            cacheOutboxPurgeStatus: "",
            backupSnapshotCoverage: "",
            developmentStagingEligibility: "",
          }
        : record,
    ),
  });
  assert.equal(incompleteRetentionReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(incompleteRetentionReport.reviewSections.some((section) => section.reason === "cacheOutboxPurgeStatus"));
  assert.ok(incompleteRetentionReport.reviewSections.some((section) => section.reason === "backupSnapshotCoverage"));
  assert.ok(incompleteRetentionReport.reviewSections.some((section) => section.reason === "developmentStagingEligibility"));

  const unsafeIncidentRetentionReport = buildRatingExperienceEvidenceReport("october-2026-demo", {
    ...completeRatingExperienceFixtures(),
    protectedArtifactRetentionRecords: completeRatingExperienceFixtures().protectedArtifactRetentionRecords.map((record) =>
      record.artifactType === "cache"
        ? {
            ...record,
            suspectedProtectedContentLeak: true,
            incidentErratumLinks: ["release-erratum-cache-leak"],
            dependentArtifactClassesStaled: ["evaluations"],
            incidentReviewDecision: "review later",
            dependentArtifactImpactStatus: "leaderboards still active",
            submissionLanePauseStatus: "submission lanes active",
          }
        : record,
    ),
  });
  assert.equal(unsafeIncidentRetentionReport.releaseUseStatus, "rating_experience_evidence_review_required");
  assert.ok(unsafeIncidentRetentionReport.reviewSections.some((section) => section.reason === "dependentArtifactClassesStaled:leaderboards,label_snapshots,exports"));
  assert.ok(unsafeIncidentRetentionReport.reviewSections.some((section) => section.reason === "incidentReviewDecision:reason"));
  assert.ok(unsafeIncidentRetentionReport.reviewSections.some((section) => section.reason === "dependentArtifactImpactStatus"));
  assert.ok(unsafeIncidentRetentionReport.reviewSections.some((section) => section.reason === "submissionLanePauseStatus"));
});

test("auxiliary workflow evidence gates blinding, partial outputs, exposure, queue selection, model provenance, conflicts, errata, and schedule state", () => {
  const report = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", completeAuxiliaryWorkflowFixtures());

  assert.equal(report.releaseUseStatus, "submitted_auxiliary_workflow_evidence_complete");
  assert.equal(report.counts.submittedSourceLeakageRedactionPolicyCount, 1);
  assert.equal(report.counts.sourceLeakageRedactionPolicyReviewRows, 0);
  assert.equal(report.sourceLeakageRedactionPolicyReleaseUseStatus, "submitted_source_leakage_redaction_policy_active");
  assert.equal(report.sourceLeakageRedactionPolicyId, "source-leakage-redaction-policy-submitted");
  assert.deepEqual(report.requiredSourceLeakageLintPatterns, sourceLeakageLintPatterns);
  assert.deepEqual(report.requiredSourceLeakageRedactionActions, sourceLeakageRedactionActions);
  assert.deepEqual(report.requiredSourceIdentifiabilityReviewStatuses, sourceIdentifiabilityReviewStatuses);
  assert.equal(report.counts.submittedSourceFamilyClusteringPolicyCount, 1);
  assert.equal(report.counts.sourceFamilyClusteringPolicyReviewRows, 0);
  assert.equal(report.sourceFamilyClusteringPolicyReleaseUseStatus, "submitted_source_family_clustering_policy_active");
  assert.equal(report.sourceFamilyClusteringPolicyId, "source-family-clustering-policy-submitted");
  assert.deepEqual(report.requiredSourceFamilyClusteringThresholds, sourceFamilyClusteringThresholds);
  assert.deepEqual(report.requiredNearDuplicateClusteringThresholds, nearDuplicateClusteringThresholds);
  assert.deepEqual(report.requiredSourceFamilyClusterFields, sourceFamilyClusterFields);
  assert.deepEqual(report.requiredSourceFamilyClusteringReviewStatuses, sourceFamilyClusteringReviewStatuses);
  assert.equal(report.counts.submittedBlindingPreviewAuditCount, 1);
  assert.equal(report.blindingPreviewAuditRows.at(-1).sourceLeakageRedactionPolicyId, "source-leakage-redaction-policy-submitted");
  assert.deepEqual(report.blindingPreviewAuditRows.at(-1).lintedSourceLeakagePatterns, sourceLeakageLintPatterns);
  assert.equal(report.counts.submittedPartialTaskOutputCount, partialTaskOutputTypes.length);
  assert.equal(report.counts.passingPartialTaskTypeCount, partialTaskOutputTypes.length);
  assert.equal(report.counts.submittedPartialTaskPromotionPolicyCount, 1);
  assert.equal(report.counts.partialTaskPromotionPolicyReviewRows, 0);
  assert.equal(report.partialTaskPromotionPolicyReleaseUseStatus, "submitted_partial_task_promotion_policy_active");
  assert.equal(report.partialTaskPromotionPolicyId, "partial-task-promotion-policy-submitted");
  assert.deepEqual(report.partialTaskEligibleUses, partialTaskPromotionEligibleUses);
  assert.deepEqual(report.requiredPartialTaskPromotionCriteria, partialTaskPromotionCriteria);
  assert.deepEqual(report.requiredPartialTaskPromotionReviewStatuses, partialTaskPromotionReviewStatuses);
  assert.equal(report.partialTaskOutputRows.at(-1).partialTaskPromotionPolicyId, "partial-task-promotion-policy-submitted");
  assert.equal(report.partialTaskOutputRows.at(-1).promotionReviewStatus, "not_promoted_auxiliary_only");
  assert.equal(report.counts.submittedExposureQuarantinePolicyCount, 1);
  assert.equal(report.counts.exposureQuarantinePolicyReviewRows, 0);
  assert.equal(report.exposureQuarantinePolicyReleaseUseStatus, "submitted_exposure_quarantine_policy_active");
  assert.equal(report.exposureQuarantinePolicyId, "exposure-quarantine-policy-submitted");
  assert.deepEqual(report.requiredExposureQuarantineTriggerClasses, exposureQuarantineTriggerClasses);
  assert.deepEqual(report.requiredExposureQuarantineAssignmentChecks, exposureQuarantineAssignmentChecks);
  assert.deepEqual(report.requiredExposureQuarantineActions, exposureQuarantineActions);
  assert.deepEqual(report.requiredExposureQuarantineReviewStatuses, exposureQuarantineReviewStatuses);
  assert.deepEqual(report.requiredExposureQuarantineEffects, exposureQuarantineEffects);
  assert.equal(report.counts.submittedRaterPositionClusterExposureCount, 1);
  assert.equal(report.raterPositionClusterExposureRows.at(-1).exposureQuarantinePolicyId, "exposure-quarantine-policy-submitted");
  assert.equal(report.raterPositionClusterExposureRows.at(-1).blindEligibilityEffect, "excluded_from_fresh_blind_initial_on_cluster");
  assert.equal(report.raterPositionClusterExposureRows.at(-1).quarantineReviewStatus, "quarantine_applied");
  assert.equal(report.counts.submittedSpotCheckSamplingPolicyCount, 1);
  assert.equal(report.spotCheckSamplingPolicyReleaseUseStatus, "submitted_spot_check_sampling_policy_active");
  assert.equal(report.spotCheckSamplingPolicyId, "spot-check-sampling-policy-submitted");
  assert.deepEqual(report.requiredSpotCheckSamplingStrata, spotCheckSamplingStrata);
  assert.deepEqual(report.requiredSpotCheckMinimumRateByStratum, spotCheckMinimumRateByStratum);
  assert.deepEqual(report.requiredSpotCheckMinimumCountByStratum, spotCheckMinimumCountByStratum);
  assert.equal(report.counts.submittedSpotCheckQaItemCount, 1);
  assert.equal(report.counts.submittedSpotCheckQAItemCount, 1);
  assert.equal(report.spotCheckQAItemRows.at(-1).status, "spot_check_qa_item_complete");
  assert.equal(report.spotCheckQaRows.at(-1).spotCheckSamplingPolicyId, "spot-check-sampling-policy-submitted");
  assert.equal(report.spotCheckQaRows.at(-1).excludedFromIndependentRaterCount, true);
  assert.deepEqual(report.spotCheckQaRows.at(-1).samplingDimensions, spotCheckSamplingDimensions);
  assert.equal(report.spotCheckQaRows.at(-1).ordinaryRatingStatus, "apparently_ordinary_non_escalated");
  assert.deepEqual(report.spotCheckRequiredSamplingDimensions, spotCheckSamplingDimensions);
  assert.equal(report.counts.submittedAdjudicationTriageQueueItemCount, 1);
  assert.equal(report.counts.submittedDiagnosticDeferralVisibilityPolicyCount, 1);
  assert.equal(report.diagnosticDeferralVisibilityPolicyReleaseUseStatus, "submitted_diagnostic_deferral_visibility_policy_active");
  assert.equal(report.diagnosticDeferralVisibilityPolicyId, "diagnostic-deferral-visibility-policy-submitted");
  assert.deepEqual(report.requiredDiagnosticDeferralDiagnosticClasses, diagnosticDeferralDiagnosticClasses);
  assert.deepEqual(report.requiredDiagnosticDeferralPublicVisibilityLevels, diagnosticDeferralPublicVisibilityLevels);
  assert.deepEqual(report.requiredDiagnosticDeferralClaimSuppressionActions, diagnosticDeferralClaimSuppressionActions);
  assert.deepEqual(report.requiredDiagnosticDeferralVisibilityRules, diagnosticDeferralVisibilityRules);
  assert.equal(report.diagnosticDeferralVisibilityPolicyRows.at(-1).policyVersion, DIAGNOSTIC_DEFERRAL_VISIBILITY_POLICY_VERSION);
  assert.equal(report.counts.submittedDiagnosticDeferralRecordCount, 1);
  assert.equal(report.diagnosticDeferralRows.at(-1).diagnosticDeferralVisibilityPolicyId, "diagnostic-deferral-visibility-policy-submitted");
  assert.equal(report.diagnosticDeferralRows.at(-1).diagnosticClass, "obfuscated_argument_stress");
  assert.equal(report.diagnosticDeferralRows.at(-1).publicVisibilityLevel, "public_weaker_claim_summary");
  assert.equal(report.diagnosticDeferralRows.at(-1).claimSuppressionAction, "suppress_stronger_claim");
  assert.equal(report.counts.submittedQueuePolicySnapshotCount, 1);
  assert.equal(report.counts.passingQueuePolicyComponentCount, queuePolicyComponents.length);
  assert.equal(report.counts.submittedAssignmentSelectionAuditCount, 1);
  assert.equal(report.counts.submittedModelRunReproducibilityPolicyCount, 1);
  assert.equal(report.counts.modelRunReproducibilityPolicyReviewRows, 0);
  assert.equal(report.modelRunReproducibilityPolicyReleaseUseStatus, "submitted_model_run_reproducibility_policy_active");
  assert.equal(report.modelRunReproducibilityPolicyId, "model-run-reproducibility-policy-submitted");
  assert.deepEqual(report.requiredModelRunReproducibilityConfigFields, modelRunReproducibilityConfigFields);
  assert.deepEqual(report.requiredModelRunReproducibilityEnvironmentFields, modelRunReproducibilityEnvironmentFields);
  assert.deepEqual(report.requiredModelRunReproducibilityRules, modelRunReproducibilityRules);
  assert.equal(report.counts.submittedModelInferenceConfigCount, 1);
  assert.equal(report.counts.submittedModelRunEnvironmentCount, 1);
  assert.equal(report.counts.passingModelRunProvenanceCount, 1);
  assert.equal(report.modelInferenceConfigRows.at(-1).modelRunReproducibilityPolicyId, "model-run-reproducibility-policy-submitted");
  assert.equal(report.modelRunEnvironmentRows.at(-1).modelRunReproducibilityPolicyId, "model-run-reproducibility-policy-submitted");
  assert.equal(report.counts.submittedRaterItemConflictCount, 1);
  assert.equal(report.raterItemConflictRows.at(-1).sourceFamilyClusteringPolicyId, "source-family-clustering-policy-submitted");
  assert.equal(report.raterItemConflictRows.at(-1).independentBlindEligibilityEffect, "excluded_from_independent_blind_protected_denominators");
  assert.equal(report.counts.submittedRaterTrainingExposurePolicyCount, 1);
  assert.deepEqual(report.raterTrainingExposurePolicyRows.at(-1).exposureWindowDays, raterTrainingExposureWindowDays);
  assert.deepEqual(report.raterTrainingExposurePolicyRows.at(-1).protectedAssignmentBlockingEffects, raterTrainingExposureBlockingEffects);
  assert.equal(report.counts.submittedRaterTrainingExposureSnapshotCount, 1);
  assert.equal(report.raterTrainingExposureRows.at(-1).exposureQuarantinePolicyId, "exposure-quarantine-policy-submitted");
  assert.deepEqual(report.raterTrainingExposureRows.at(-1).samePositionPositionClusterExposureChecks, exposureQuarantineAssignmentChecks);
  assert.equal(report.raterTrainingExposureRows.at(-1).exposureQuarantineCheckStatus, "quarantine_applied");
  assert.equal(report.raterTrainingExposureRows.at(-1).raterTrainingExposurePolicyId, "rater-training-exposure-policy-submitted");
  assert.equal(report.counts.submittedReleaseErratumDisclosurePolicyCount, 1);
  assert.deepEqual(report.releaseErratumDisclosurePolicyRows.at(-1).disclosureThresholdByErratumType, releaseErratumDisclosureThresholds);
  assert.equal(report.counts.submittedReleaseErratumCount, 1);
  assert.equal(report.releaseErrataRows.at(-1).releaseErratumDisclosurePolicyId, "release-erratum-disclosure-policy-submitted");
  assert.equal(report.releaseErrataRows.at(-1).apiDownloadWarningBlockPolicy, "show_warning_and_link_superseding_artifacts");
  assert.equal(report.releaseErrataRows.at(-1).historicalArtifactsMutated, false);
  assert.equal(report.counts.submittedScheduleRebaselinePolicyCount, 1);
  assert.deepEqual(report.scheduleRebaselinePolicyRows.at(-1).delayThresholdDays, scheduleRebaselineDelayThresholdDays);
  assert.deepEqual(report.scheduleRebaselinePolicyRows.at(-1).rebaselineRuleByTrigger, scheduleRebaselineRules);
  assert.equal(report.counts.submittedScheduleStatusSnapshotCount, 1);
  assert.equal(report.scheduleStatusRows.at(-1).scheduleRebaselinePolicyId, "schedule-rebaseline-policy-submitted");
  assert.equal(report.scheduleStatusRows.at(-1).slipDays, 0);
  assert.equal(report.scheduleStatusRows.at(-1).supportsCompletionClaim, false);
  assert.deepEqual(report.reviewSections, []);

  const driftedSourceLeakagePolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    sourceLeakageRedactionPolicies: [
      {
        ...sourceLeakageRedactionPolicy("source-leakage-redaction-policy-drifted"),
        requiredLintPatterns: sourceLeakageLintPatterns.filter((pattern) => pattern !== "pasted_metadata"),
      },
    ],
  });
  assert.equal(driftedSourceLeakagePolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.equal(driftedSourceLeakagePolicyReport.sourceLeakageRedactionPolicyReleaseUseStatus, "submitted_source_leakage_redaction_policy_review_required");

  const driftedSourceFamilyClusteringReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    sourceFamilyClusteringPolicies: [
      {
        ...sourceFamilyClusteringPolicy("source-family-clustering-policy-drifted"),
        nearDuplicateClusteringThresholds: {
          ...nearDuplicateClusteringThresholds,
          embeddingCosineSimilarityMin: 0.5,
        },
      },
    ],
  });
  assert.equal(driftedSourceFamilyClusteringReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.equal(driftedSourceFamilyClusteringReport.sourceFamilyClusteringPolicyReleaseUseStatus, "submitted_source_family_clustering_policy_review_required");
  assert.ok(
    driftedSourceFamilyClusteringReport.reviewSections.some(
      (section) => section.artifactType === "source_family_clustering_policy" && section.reason === "nearDuplicateClusteringThresholds",
    ),
  );
  assert.ok(
    driftedSourceLeakagePolicyReport.reviewSections.some(
      (section) => section.artifactType === "source_leakage_redaction_policy" && section.reason === "requiredLintPatterns:pasted_metadata",
    ),
  );

  const staleSourceLeakagePolicyAuditReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    blindingPreviewAudits: [
      {
        ...completeAuxiliaryWorkflowFixtures().blindingPreviewAudits[0],
        sourceLeakageRedactionPolicyId: "source-leakage-redaction-policy-old",
      },
    ],
  });
  assert.equal(staleSourceLeakagePolicyAuditReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    staleSourceLeakagePolicyAuditReport.reviewSections.some(
      (section) => section.artifactType === "blinding_preview_audit" && section.reason === "sourceLeakageRedactionPolicyId",
    ),
  );

  const driftedPartialTaskPromotionPolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    partialTaskPromotionPolicies: [
      {
        ...partialTaskPromotionPolicy("partial-task-promotion-policy-drifted"),
        promotionCriteriaByTaskType: Object.fromEntries(
          Object.entries(partialTaskPromotionCriteria).filter(([taskType]) => taskType !== "discussion_comment"),
        ),
      },
    ],
  });
  assert.equal(driftedPartialTaskPromotionPolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.equal(
    driftedPartialTaskPromotionPolicyReport.partialTaskPromotionPolicyReleaseUseStatus,
    "submitted_partial_task_promotion_policy_review_required",
  );
  assert.ok(
    driftedPartialTaskPromotionPolicyReport.reviewSections.some(
      (section) => section.artifactType === "partial_task_promotion_policy" && section.reason === "promotionCriteriaByTaskType",
    ),
  );

  const stalePartialTaskPromotionPolicyOutputReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    partialTaskOutputs: completeAuxiliaryWorkflowFixtures().partialTaskOutputs.map((output) => ({
      ...output,
      partialTaskPromotionPolicyId: "partial-task-promotion-policy-old",
    })),
  });
  assert.equal(stalePartialTaskPromotionPolicyOutputReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    stalePartialTaskPromotionPolicyOutputReport.reviewSections.some(
      (section) => section.artifactType === "partial_task_output" && section.reason === "partialTaskPromotionPolicyId",
    ),
  );

  const unlinkedPromotedPartialTaskReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    partialTaskOutputs: completeAuxiliaryWorkflowFixtures().partialTaskOutputs.map((output, index) =>
      index === 0
        ? {
            ...output,
            promotionReviewStatus: "promoted_to_adjudication_context",
            promotionAdjudicationLink: null,
          }
        : output,
    ),
  });
  assert.equal(unlinkedPromotedPartialTaskReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    unlinkedPromotedPartialTaskReport.reviewSections.some(
      (section) => section.artifactType === "partial_task_output" && section.reason === "promotionAdjudicationLink",
    ),
  );

  const driftedExposureQuarantinePolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    exposureQuarantinePolicies: [
      {
        ...exposureQuarantinePolicy("exposure-quarantine-policy-drifted"),
        quarantineTriggerClasses: exposureQuarantineTriggerClasses.filter((trigger) => trigger !== "later_added_sibling_critique"),
      },
    ],
  });
  assert.equal(driftedExposureQuarantinePolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.equal(
    driftedExposureQuarantinePolicyReport.exposureQuarantinePolicyReleaseUseStatus,
    "submitted_exposure_quarantine_policy_review_required",
  );
  assert.ok(
    driftedExposureQuarantinePolicyReport.reviewSections.some(
      (section) =>
        section.artifactType === "exposure_quarantine_policy" &&
        section.reason === "quarantineTriggerClasses:later_added_sibling_critique",
    ),
  );

  const staleExposureQuarantineExposureReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    raterPositionClusterExposures: [
      {
        ...completeAuxiliaryWorkflowFixtures().raterPositionClusterExposures[0],
        exposureQuarantinePolicyId: "exposure-quarantine-policy-old",
      },
    ],
  });
  assert.equal(staleExposureQuarantineExposureReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    staleExposureQuarantineExposureReport.reviewSections.some(
      (section) => section.artifactType === "rater_position_cluster_exposure" && section.reason === "exposureQuarantinePolicyId",
    ),
  );

  const missingModelAssistedExposureCheckReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    raterTrainingExposureSnapshots: [
      {
        ...completeAuxiliaryWorkflowFixtures().raterTrainingExposureSnapshots[0],
        samePositionPositionClusterExposureChecks: exposureQuarantineAssignmentChecks.filter(
          (check) => check !== "model_assisted_check_exposure_checked",
        ),
      },
    ],
  });
  assert.equal(missingModelAssistedExposureCheckReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    missingModelAssistedExposureCheckReport.reviewSections.some(
      (section) =>
        section.artifactType === "rater_training_exposure_snapshot" &&
        section.reason === "samePositionPositionClusterExposureChecks:model_assisted_check_exposure_checked",
    ),
  );

  const driftedModelRunReproducibilityPolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    modelRunReproducibilityPolicies: [
      {
        ...modelRunReproducibilityPolicy("model-run-reproducibility-policy-drifted"),
        requiredInferenceConfigFields: modelRunReproducibilityConfigFields.filter((field) => field !== "seedDeterminismArtifact"),
      },
    ],
  });
  assert.equal(driftedModelRunReproducibilityPolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.equal(
    driftedModelRunReproducibilityPolicyReport.modelRunReproducibilityPolicyReleaseUseStatus,
    "submitted_model_run_reproducibility_policy_review_required",
  );
  assert.ok(
    driftedModelRunReproducibilityPolicyReport.reviewSections.some(
      (section) => section.artifactType === "model_run_reproducibility_policy" && section.reason === "requiredInferenceConfigFields",
    ),
  );

  const unsafePositionClusterExposureReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    raterPositionClusterExposures: [
      {
        ...completeAuxiliaryWorkflowFixtures().raterPositionClusterExposures[0],
        blindEligibilityEffect: "count_as_fresh_blind_initial_after_peer_exposure",
      },
    ],
  });
  assert.equal(unsafePositionClusterExposureReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(unsafePositionClusterExposureReport.reviewSections.some((section) => section.reason === "blindEligibilityEffect"));

  const incompleteSpotCheckReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    spotCheckQaItems: [
      {
        ...completeAuxiliaryWorkflowFixtures().spotCheckQaItems[0],
        id: "spot-check-qa-missing-sampling-dimensions",
        samplingDimensions: ["topic", "rater_tier"],
        ordinaryRatingStatus: "escalated_disagreement",
      },
    ],
  });
  assert.equal(incompleteSpotCheckReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(incompleteSpotCheckReport.reviewSections.some((section) => section.reason === "samplingDimensions:source_family,item_length,score_band"));
  assert.ok(incompleteSpotCheckReport.reviewSections.some((section) => section.reason === "ordinaryRatingStatus"));

  const driftedSpotCheckSamplingPolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    spotCheckSamplingPolicies: [
      {
        ...spotCheckSamplingPolicy("spot-check-sampling-policy-drifted"),
        minimumSamplingRateByStratum: {
          ...spotCheckMinimumRateByStratum,
          non_escalated_release_critical: 0.02,
        },
      },
    ],
  });
  assert.equal(driftedSpotCheckSamplingPolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.equal(driftedSpotCheckSamplingPolicyReport.spotCheckSamplingPolicyReleaseUseStatus, "submitted_spot_check_sampling_policy_review_required");
  assert.ok(
    driftedSpotCheckSamplingPolicyReport.reviewSections.some(
      (section) => section.artifactType === "spot_check_sampling_policy" && section.reason === "minimumSamplingRateByStratum",
    ),
  );

  const staleSpotCheckPolicyItemReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    spotCheckQaItems: [
      {
        ...completeAuxiliaryWorkflowFixtures().spotCheckQaItems[0],
        spotCheckSamplingPolicyId: "spot-check-sampling-policy-old",
      },
    ],
  });
  assert.equal(staleSpotCheckPolicyItemReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    staleSpotCheckPolicyItemReport.reviewSections.some(
      (section) => section.artifactType === "spot_check_qa_item" && section.reason === "spotCheckSamplingPolicyId",
    ),
  );

  const driftedDeferralVisibilityPolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    diagnosticDeferralVisibilityPolicies: [
      {
        ...diagnosticDeferralVisibilityPolicy("diagnostic-deferral-visibility-policy-drifted"),
        visibilityRules: {
          ...diagnosticDeferralVisibilityRules,
          robustnessClaims: "Internal review may keep deferred robustness diagnostics private while preserving the stronger release claim.",
        },
      },
    ],
  });
  assert.equal(driftedDeferralVisibilityPolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.equal(
    driftedDeferralVisibilityPolicyReport.diagnosticDeferralVisibilityPolicyReleaseUseStatus,
    "submitted_diagnostic_deferral_visibility_policy_review_required",
  );
  assert.ok(
    driftedDeferralVisibilityPolicyReport.reviewSections.some(
      (section) => section.artifactType === "diagnostic_deferral_visibility_policy" && section.reason === "visibilityRules",
    ),
  );

  const staleDeferralVisibilityPolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    diagnosticDeferralRecords: [
      {
        ...completeAuxiliaryWorkflowFixtures().diagnosticDeferralRecords[0],
        diagnosticDeferralVisibilityPolicyId: "diagnostic-deferral-visibility-policy-old",
      },
    ],
  });
  assert.equal(staleDeferralVisibilityPolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    staleDeferralVisibilityPolicyReport.reviewSections.some(
      (section) => section.artifactType === "diagnostic_deferral_record" && section.reason === "diagnosticDeferralVisibilityPolicyId",
    ),
  );

  const unsafeConflictReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    raterItemConflicts: [
      {
        ...completeAuxiliaryWorkflowFixtures().raterItemConflicts[0],
        independentBlindEligibilityEffect: "excluded_but_count_as_independent_blind_rating",
      },
    ],
  });
  assert.equal(unsafeConflictReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(unsafeConflictReport.reviewSections.some((section) => section.reason === "independentBlindEligibilityEffect:counts_independent"));

  const driftedTrainingExposurePolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    raterTrainingExposurePolicies: [
      {
        ...completeAuxiliaryWorkflowFixtures().raterTrainingExposurePolicies[0],
        id: "rater-training-exposure-policy-drifted",
        exposureWindowDays: {
          ...raterTrainingExposureWindowDays,
          goldFeedbackSameCluster: 30,
        },
      },
    ],
  });
  assert.equal(driftedTrainingExposurePolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    driftedTrainingExposurePolicyReport.reviewSections.some(
      (section) => section.artifactType === "rater_training_exposure_policy" && section.reason === "exposureWindowDays",
    ),
  );

  const staleTrainingExposurePolicySnapshotReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    raterTrainingExposureSnapshots: [
      {
        ...completeAuxiliaryWorkflowFixtures().raterTrainingExposureSnapshots[0],
        id: "training-exposure-snapshot-stale-policy",
        raterTrainingExposurePolicyId: "rater-training-exposure-policy-old",
      },
    ],
  });
  assert.equal(staleTrainingExposurePolicySnapshotReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    staleTrainingExposurePolicySnapshotReport.reviewSections.some(
      (section) => section.artifactType === "rater_training_exposure_snapshot" && section.reason === "raterTrainingExposurePolicyId",
    ),
  );

  const driftedErratumDisclosurePolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    releaseErratumDisclosurePolicies: [
      {
        ...completeAuxiliaryWorkflowFixtures().releaseErratumDisclosurePolicies[0],
        id: "release-erratum-disclosure-policy-drifted",
        disclosureThresholdByErratumType: {
          ...releaseErratumDisclosureThresholds,
          denominator_error: "internal_only",
        },
      },
    ],
  });
  assert.equal(driftedErratumDisclosurePolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    driftedErratumDisclosurePolicyReport.reviewSections.some(
      (section) => section.artifactType === "release_erratum_disclosure_policy" && section.reason === "disclosureThresholdByErratumType",
    ),
  );

  const staleErratumDisclosurePolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    releaseErrata: [
      {
        ...completeAuxiliaryWorkflowFixtures().releaseErrata[0],
        id: "release-erratum-stale-policy",
        releaseErratumDisclosurePolicyId: "release-erratum-disclosure-policy-old",
      },
    ],
  });
  assert.equal(staleErratumDisclosurePolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    staleErratumDisclosurePolicyReport.reviewSections.some(
      (section) => section.artifactType === "release_erratum" && section.reason === "releaseErratumDisclosurePolicyId",
    ),
  );

  const undisclosedErratumReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    releaseErrata: [
      {
        ...completeAuxiliaryWorkflowFixtures().releaseErrata[0],
        id: "release-erratum-undisclosed-denominator",
        impactedMetricsClaims: [],
        artifactDeprecationStatus: "",
        apiDownloadWarningBlockPolicy: "",
        remediationStatus: "",
      },
    ],
  });
  assert.equal(undisclosedErratumReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(undisclosedErratumReport.reviewSections.some((section) => section.artifactType === "release_erratum" && section.reason === "impactedMetricsClaims"));
  assert.ok(undisclosedErratumReport.reviewSections.some((section) => section.artifactType === "release_erratum" && section.reason === "artifactDeprecationStatus"));
  assert.ok(undisclosedErratumReport.reviewSections.some((section) => section.artifactType === "release_erratum" && section.reason === "apiDownloadWarningBlockPolicy"));
  assert.ok(undisclosedErratumReport.reviewSections.some((section) => section.artifactType === "release_erratum" && section.reason === "remediationStatus"));

  const driftedScheduleRebaselinePolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    scheduleRebaselinePolicies: [
      {
        ...completeAuxiliaryWorkflowFixtures().scheduleRebaselinePolicies[0],
        id: "schedule-rebaseline-policy-drifted",
        delayThresholdDays: {
          ...scheduleRebaselineDelayThresholdDays,
          majorSlipMinDays: 45,
        },
      },
    ],
  });
  assert.equal(driftedScheduleRebaselinePolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    driftedScheduleRebaselinePolicyReport.reviewSections.some(
      (section) => section.artifactType === "schedule_rebaseline_policy" && section.reason === "delayThresholdDays",
    ),
  );

  const staleScheduleRebaselinePolicyReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    scheduleStatusSnapshots: [
      {
        ...completeAuxiliaryWorkflowFixtures().scheduleStatusSnapshots[0],
        id: "schedule-status-stale-policy",
        scheduleRebaselinePolicyId: "schedule-rebaseline-policy-old",
      },
    ],
  });
  assert.equal(staleScheduleRebaselinePolicyReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    staleScheduleRebaselinePolicyReport.reviewSections.some(
      (section) => section.artifactType === "schedule_status_snapshot" && section.reason === "scheduleRebaselinePolicyId",
    ),
  );

  const weakRebaselineSnapshotReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    scheduleStatusSnapshots: [
      {
        ...completeAuxiliaryWorkflowFixtures().scheduleStatusSnapshots[0],
        id: "schedule-status-weak-rebaseline",
        status: "rebaselined",
        rebaselinedDate: "2026-10-10",
        rebaselinedScope: "move public release review to November without target change",
        rebaselineReason: "October milestone slipped beyond the frozen major-slip threshold.",
        previousPlannedEnd: "2026-10-31",
        newPlannedEnd: "2026-11-21",
        rebaselineApprovalRecordIds: [],
        originalScheduleCompletionClaimSuppressed: false,
      },
    ],
  });
  assert.equal(weakRebaselineSnapshotReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    weakRebaselineSnapshotReport.reviewSections.some(
      (section) => section.artifactType === "schedule_status_snapshot" && section.reason === "approvedRebaseline",
    ),
  );

  const slippedMilestoneReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    scheduleStatusSnapshots: [
      {
        ...completeAuxiliaryWorkflowFixtures().scheduleStatusSnapshots[0],
        id: "schedule-status-slipped-in-progress",
        plannedEnd: "2026-10-01",
        status: "in_progress",
        timestamp: "2026-10-30T00:00:00.000Z",
      },
    ],
  });
  assert.equal(slippedMilestoneReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(
    slippedMilestoneReport.reviewSections.some(
      (section) => section.artifactType === "schedule_status_snapshot" && section.reason === "majorSlipRequiresRebaseline",
    ),
  );

  const unsafeTrainingExposureReport = buildAuxiliaryWorkflowEvidenceReport("october-2026-demo", {
    ...completeAuxiliaryWorkflowFixtures(),
    raterTrainingExposureSnapshots: [
      {
        ...completeAuxiliaryWorkflowFixtures().raterTrainingExposureSnapshots[0],
        protectedClusterEligibilityEffect: "eligible_after_checks_but_count_as_independent_blind_after_training_exposure",
      },
    ],
  });
  assert.equal(unsafeTrainingExposureReport.releaseUseStatus, "auxiliary_workflow_evidence_review_required");
  assert.ok(unsafeTrainingExposureReport.reviewSections.some((section) => section.reason === "protectedClusterEligibilityEffect:counts_independent"));
});

test("interaction workflow evidence gates practice, sessions, discussion, adjudication, governance, benchmark, and simplified UI artifacts", () => {
  const report = buildInteractionWorkflowEvidenceReport("october-2026-demo", completeInteractionWorkflowFixtures());

  assert.equal(report.releaseUseStatus, "submitted_interaction_workflow_evidence_complete");
  assert.equal(report.counts.submittedArtifactGroupCount, 25);
  assert.equal(report.counts.completeArtifactGroupCount, 25);
  assert.equal(report.counts.submittedPublicExamplePracticeSessionCount, 1);
  assert.equal(report.counts.submittedPracticeSandboxPolicyCount, 1);
  assert.deepEqual(report.practiceSandboxPolicyRows.at(-1).requiredPublicSourceAnchorIds, practiceSandboxSourceAnchorIds);
  assert.deepEqual(report.practiceSandboxPolicyRows.at(-1).completionStandards, practiceSandboxCompletionStandards);
  assert.equal(report.counts.submittedRaterDashboardPolicyCount, 1);
  assert.equal(report.raterDashboardPolicyId, "rater-dashboard-policy-submitted");
  assert.equal(report.raterDashboardPolicyReleaseUseStatus, "submitted_rater_dashboard_policy_active");
  assert.deepEqual(report.requiredRaterDashboardVisibleSections, raterDashboardVisibleSections);
  assert.deepEqual(report.prohibitedRaterDashboardFields, raterDashboardProhibitedFields);
  assert.deepEqual(report.requiredRaterDashboardThresholds, raterDashboardThresholds);
  assert.deepEqual(report.requiredRaterDashboardRemediationRules, raterDashboardRemediationRules);
  assert.equal(report.counts.submittedRaterLearningPlanCount, 1);
  assert.equal(report.raterLearningPlanRows.at(-1).raterDashboardPolicyId, "rater-dashboard-policy-submitted");
  assert.equal(report.raterLearningPlanRows.at(-1).dashboardVisibilityStatus, "private_training_only");
  assert.equal(report.raterLearningPlanRows.at(-1).remediationRoutingStatus, "ordinary_live_allowed");
  assert.equal(report.raterLearningPlanRows.at(-1).hiddenProtectedLabelsSuppressed, true);
  assert.equal(report.counts.submittedSessionPacingPolicyCount, 1);
  assert.deepEqual(report.sessionPacingPolicyRows.at(-1).coveredSessionTargets, sessionPacingTargets);
  assert.deepEqual(report.sessionPacingPolicyRows.at(-1).thresholdSeconds, sessionPacingThresholdSeconds);
  assert.deepEqual(report.sessionPacingPolicyRows.at(-1).safeDeclineAbuseThresholds, safeDeclineAbuseThresholds);
  assert.equal(report.counts.submittedRaterSessionCount, 1);
  assert.equal(report.raterSessionRows.at(-1).expectedEffortCompleted, "within_band");
  assert.equal(report.raterSessionRows.at(-1).qaRoutingStatus, "no_fatigue_qa_route");
  assert.equal(report.counts.submittedAssignmentSelfScreenCount, 1);
  assert.equal(report.assignmentSelfScreenRows.at(-1).selfScreenStatus, "continue");
  assert.equal(report.assignmentSelfScreenRows.at(-1).sourcePeerModelGoldProtectedLabelVisibilityState, "all_hidden");
  assert.equal(report.counts.submittedAssignmentDeclineCount, 1);
  assert.equal(report.counts.submittedAssignmentDeferralCount, 1);
  assert.equal(report.assignmentDeferralRows.at(-1).resumePolicy, "resume_or_reassign_after_review_without_label_submission");
  assert.equal(report.counts.submittedInterpretationTargetMapRequirednessPolicyCount, 1);
  assert.equal(report.interpretationTargetMapRequirednessPolicyId, "interpretation-target-map-requiredness-policy-submitted");
  assert.equal(report.interpretationTargetMapRequirednessPolicyReleaseUseStatus, "submitted_interpretation_target_map_requiredness_policy_active");
  assert.deepEqual(report.requiredInterpretationTargetMapTriggerClasses, interpretationTargetMapTriggerClasses);
  assert.deepEqual(report.requiredInterpretationTargetMapThresholds, interpretationTargetMapRequirednessThresholds);
  assert.equal(report.counts.submittedInterpretationTargetMapCount, 1);
  assert.equal(report.interpretationTargetMapRows.at(-1).interpretationTargetMapRequirednessPolicyId, "interpretation-target-map-requiredness-policy-submitted");
  assert.equal(report.interpretationTargetMapRows.at(-1).requirednessTriggerClass, "release_critical_ambiguity_dispute");
  assert.equal(report.counts.submittedVerificationClaimGranularityPolicyCount, 1);
  assert.equal(report.verificationClaimGranularityPolicyId, "verification-claim-granularity-policy-submitted");
  assert.equal(report.verificationClaimGranularityPolicyReleaseUseStatus, "submitted_verification_claim_granularity_policy_active");
  assert.deepEqual(report.requiredVerificationClaimGranularityClasses, verificationClaimGranularityClasses);
  assert.deepEqual(report.requiredVerificationClaimGranularityThresholds, verificationClaimGranularityThresholds);
  assert.equal(report.counts.submittedVerificationWorkspaceSessionCount, 1);
  assert.equal(report.verificationWorkspaceSessionRows.at(-1).verificationClaimGranularityPolicyId, "verification-claim-granularity-policy-submitted");
  assert.equal(report.verificationWorkspaceSessionRows.at(-1).claimGranularityClass, "subjective_or_intuition_pump_claim");
  assert.equal(report.interpretationTargetMapRows.at(-1).interpretationPlausibilityByReading.central_forecast_attack, 0.8);
  assert.equal(report.interpretationTargetMapRows.at(-1).critiqueCoverageByInterpretation.central_forecast_attack, "covered");
  assert.equal(report.interpretationTargetMapRows.at(-1).dimensionEffectByRubricDimension.overall, "records the product-level effect after priced-in review");
  assert.equal(report.verificationWorkspaceSessionRows.at(-1).claimVerificationStatusByClaim["claim-span-1"], "not_practicable");
  assert.equal(report.verificationWorkspaceSessionRows.at(-1).notPracticableJustification, "Normative forecast premise lacks direct empirical check.");
  assert.equal(report.verificationWorkspaceSessionRows.at(-1).correctnessHalfEntireUnclearFlag, false);
  assert.equal(report.verificationWorkspaceSessionRows.at(-1).nonBlindAuxiliaryMaterialConsulted, true);
  assert.equal(report.verificationWorkspaceSessionRows.at(-1).sourceAssistedReviewNote, "Expert post-lock note was consulted only after initial rating lock.");
  assert.equal(report.counts.submittedAdjudicatorPreReadRequirednessPolicyCount, 1);
  assert.equal(report.adjudicatorPreReadRequirednessPolicyId, "adjudicator-pre-read-requiredness-policy-submitted");
  assert.equal(report.adjudicatorPreReadRequirednessPolicyReleaseUseStatus, "submitted_adjudicator_pre_read_requiredness_policy_active");
  assert.deepEqual(report.requiredAdjudicatorPreReadTriggerClasses, adjudicatorPreReadTriggerClasses);
  assert.deepEqual(report.requiredAdjudicatorPreReadThresholds, adjudicatorPreReadThresholds);
  assert.deepEqual(report.requiredAdjudicatorPreReadRules, adjudicatorPreReadRules);
  assert.equal(report.counts.submittedAdjudicatorPreReadCount, 1);
  assert.equal(report.adjudicatorPreReadRows.at(-1).adjudicatorPreReadRequirednessPolicyId, "adjudicator-pre-read-requiredness-policy-submitted");
  assert.equal(report.adjudicatorPreReadRows.at(-1).requirednessTriggerClass, "release_critical_escalation");
  assert.equal(report.adjudicatorPreReadRows.at(-1).requirednessDecisionStatus, "required_before_peer_distribution");
  assert.equal(report.adjudicatorPreReadRows.at(-1).completedBeforePeerDistributionExposure, true);
  assert.equal(report.adjudicatorPreReadRows.at(-1).peerDistributionExposureBeforePreRead, 0);
  assert.equal(report.adjudicatorPreReadRows.at(-1).majorityDirectionHiddenBeforePreRead, true);
  assert.equal(report.adjudicatorPreReadRows.at(-1).modelOutputHiddenBeforePreRead, true);
  assert.deepEqual(report.adjudicatorPreReadRows.at(-1).preliminaryIssueTags, ["interpretation_dispute"]);
  assert.equal(report.counts.submittedPostLockDiscussionSessionCount, 1);
  assert.deepEqual(report.postLockDiscussionSessionRows.at(-1).participantRoles, ["graduate_rater", "expert_adjudicator"]);
  assert.equal(report.postLockDiscussionSessionRows.at(-1).identityStagingPolicy, "role_neutral_handles_first");
  assert.equal(report.postLockDiscussionSessionRows.at(-1).roleRevealPolicy, "moderator_exception_logged");
  assert.equal(report.postLockDiscussionSessionRows.at(-1).writtenFollowUpStatus, "not_required");
  assert.deepEqual(report.discussionIdentityStagingPolicies, ["role_neutral_handles_first", "moderator_exception_immediate"]);
  assert.equal(report.counts.submittedAdjudicationCockpitSignoffPolicyCount, 1);
  assert.equal(report.adjudicationCockpitSignoffPolicyId, "adjudication-cockpit-signoff-policy-submitted");
  assert.equal(report.adjudicationCockpitSignoffPolicyReleaseUseStatus, "submitted_adjudication_cockpit_signoff_policy_active");
  assert.deepEqual(report.requiredAdjudicationCockpitMandatoryViewIds, adjudicationCockpitMandatoryViewIds);
  assert.deepEqual(report.requiredAdjudicationCockpitSignoffThresholds, adjudicationCockpitSignoffThresholds);
  assert.equal(report.counts.submittedAdjudicationReviewSessionCount, 1);
  assert.equal(report.adjudicationReviewSessionRows.at(-1).adjudicationCockpitSignoffPolicyId, "adjudication-cockpit-signoff-policy-submitted");
  assert.deepEqual(report.adjudicationReviewSessionRows.at(-1).mandatoryViewIdsReviewed, adjudicationCockpitMandatoryViewIds);
  assert.equal(report.adjudicationReviewSessionRows.at(-1).cockpitSignoffStatus, "ready_for_memo");
  assert.equal(report.adjudicationReviewSessionRows.at(-1).preSubmitLintSummary, "centrality-strength warning acknowledged");
  assert.deepEqual(report.adjudicationReviewSessionRows.at(-1).targetMapIds, ["interpretation-target-map-submitted"]);
  assert.equal(report.counts.submittedCalibrationFeedbackEventCount, 1);
  assert.equal(report.counts.submittedGovernanceApprovalRecordCount, 1);
  assert.equal(report.counts.submittedProtectedArtifactRevalidationCount, 1);
  assert.equal(report.counts.submittedBenchmarkSubmissionPolicyCount, 1);
  assert.equal(report.counts.submittedBenchmarkSubmissionCount, 1);
  assert.equal(report.counts.submittedScreenFeatureParityCheckCount, uxSimplificationSurfaces.length);
  assert.equal(report.counts.submittedSimplifiedCopyPreviewCount, uxSimplificationSurfaces.length);
  assert.equal(report.benchmarkSubmissionRows.at(-1).perItemOutputIncluded, false);
  assert.equal(report.screenFeatureParityCheckRows.every((row) => row.noFeatureLoss), true);
  assert.equal(
    report.screenFeatureParityCheckRows.find((row) => row.screenId === "rating").requiredControlResults.source_recognition,
    "reachable",
  );
  assert.equal(report.simplifiedCopyPreviewRows.every((row) => row.glossaryTooltipIds.includes("strength")), true);
  assert.deepEqual(report.reviewSections, []);

  const driftedRaterDashboardPolicyReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    raterDashboardPolicies: [
      {
        ...raterDashboardPolicy("rater-dashboard-policy-drifted"),
        thresholds: { ...raterDashboardThresholds, maxOpenRemediationModulesForProtectedUnlock: 1 },
      },
    ],
  });
  assert.equal(driftedRaterDashboardPolicyReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.equal(
    driftedRaterDashboardPolicyReport.raterDashboardPolicyReleaseUseStatus,
    "submitted_rater_dashboard_policy_review_required",
  );
  assert.ok(
    driftedRaterDashboardPolicyReport.reviewSections.some(
      (section) => section.artifactType === "rater_dashboard_policy" && section.reason === "thresholds:mismatch",
    ),
  );

  const staleRaterDashboardPolicyReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    raterLearningPlans: [
      {
        ...completeInteractionWorkflowFixtures().raterLearningPlans[0],
        raterDashboardPolicyId: "rater-dashboard-policy-old",
      },
    ],
  });
  assert.equal(staleRaterDashboardPolicyReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(
    staleRaterDashboardPolicyReport.reviewSections.some(
      (section) => section.artifactType === "rater_learning_plan" && section.reason === "raterDashboardPolicyId",
    ),
  );

  const driftedTargetMapPolicyReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    interpretationTargetMapRequirednessPolicies: [
      {
        ...interpretationTargetMapRequirednessPolicy("interpretation-target-map-requiredness-policy-drifted"),
        thresholds: { ...interpretationTargetMapRequirednessThresholds, ambiguitySpreadMin: 0.2 },
      },
    ],
  });
  assert.equal(driftedTargetMapPolicyReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.equal(
    driftedTargetMapPolicyReport.interpretationTargetMapRequirednessPolicyReleaseUseStatus,
    "submitted_interpretation_target_map_requiredness_policy_review_required",
  );
  assert.ok(
    driftedTargetMapPolicyReport.reviewSections.some(
      (section) => section.artifactType === "interpretation_target_map_requiredness_policy" && section.reason === "thresholds:mismatch",
    ),
  );

  const driftedVerificationGranularityPolicyReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    verificationClaimGranularityPolicies: [
      {
        ...verificationClaimGranularityPolicy("verification-claim-granularity-policy-drifted"),
        thresholds: { ...verificationClaimGranularityThresholds, maxAtomicClaimSpanRefs: 4 },
      },
    ],
  });
  assert.equal(driftedVerificationGranularityPolicyReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.equal(
    driftedVerificationGranularityPolicyReport.verificationClaimGranularityPolicyReleaseUseStatus,
    "submitted_verification_claim_granularity_policy_review_required",
  );
  assert.ok(
    driftedVerificationGranularityPolicyReport.reviewSections.some(
      (section) => section.artifactType === "verification_claim_granularity_policy" && section.reason === "thresholds:mismatch",
    ),
  );

  const driftedAdjudicatorPreReadPolicyReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    adjudicatorPreReadRequirednessPolicies: [
      {
        ...adjudicatorPreReadRequirednessPolicy("adjudicator-pre-read-requiredness-policy-drifted"),
        thresholds: { ...adjudicatorPreReadThresholds, highSpreadTriggerMin: 0.25 },
      },
    ],
  });
  assert.equal(driftedAdjudicatorPreReadPolicyReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.equal(
    driftedAdjudicatorPreReadPolicyReport.adjudicatorPreReadRequirednessPolicyReleaseUseStatus,
    "submitted_adjudicator_pre_read_requiredness_policy_review_required",
  );
  assert.ok(
    driftedAdjudicatorPreReadPolicyReport.reviewSections.some(
      (section) => section.artifactType === "adjudicator_pre_read_requiredness_policy" && section.reason === "thresholds:mismatch",
    ),
  );

  const stalePreReadPolicyReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    adjudicatorPreReads: [
      {
        ...completeInteractionWorkflowFixtures().adjudicatorPreReads[0],
        adjudicatorPreReadRequirednessPolicyId: "adjudicator-pre-read-requiredness-policy-old",
      },
    ],
  });
  assert.equal(stalePreReadPolicyReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(
    stalePreReadPolicyReport.reviewSections.some(
      (section) => section.artifactType === "adjudicator_pre_read" && section.reason === "adjudicatorPreReadRequirednessPolicyId",
    ),
  );

  const driftedAdjudicationCockpitPolicyReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    adjudicationCockpitSignoffPolicies: [
      {
        ...adjudicationCockpitSignoffPolicy("adjudication-cockpit-signoff-policy-drifted"),
        thresholds: { ...adjudicationCockpitSignoffThresholds, productSpreadReviewMin: 0.3 },
      },
    ],
  });
  assert.equal(driftedAdjudicationCockpitPolicyReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.equal(
    driftedAdjudicationCockpitPolicyReport.adjudicationCockpitSignoffPolicyReleaseUseStatus,
    "submitted_adjudication_cockpit_signoff_policy_review_required",
  );
  assert.ok(
    driftedAdjudicationCockpitPolicyReport.reviewSections.some(
      (section) => section.artifactType === "adjudication_cockpit_signoff_policy" && section.reason === "thresholds:mismatch",
    ),
  );

  const incompleteTargetMapReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    interpretationTargetMaps: [
      {
        ...completeInteractionWorkflowFixtures().interpretationTargetMaps[0],
        plausiblePositionCritiqueInterpretations: ["central_forecast_attack", "side_assumption_attack"],
        interpretationPlausibilityByReading: { central_forecast_attack: 0.8 },
        critiqueCoverageByInterpretation: { central_forecast_attack: "covered" },
        dimensionEffectByRubricDimension: {
          centrality: "maps which forecast claim is attacked",
          strength: "maps how strongly the base-rate challenge lands",
        },
      },
    ],
  });
  assert.equal(incompleteTargetMapReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(
    incompleteTargetMapReport.reviewSections.some(
      (section) => section.artifactType === "interpretation_target_map" && section.reason === "interpretationPlausibilityByReading:side_assumption_attack",
    ),
  );
  assert.ok(
    incompleteTargetMapReport.reviewSections.some(
      (section) => section.artifactType === "interpretation_target_map" && section.reason === "critiqueCoverageByInterpretation:side_assumption_attack",
    ),
  );
  assert.ok(
    incompleteTargetMapReport.reviewSections.some(
      (section) => section.artifactType === "interpretation_target_map" && section.reason === "dimensionEffectByRubricDimension:overall",
    ),
  );

  const incompleteVerificationWorkspaceReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    verificationWorkspaceSessions: [
      {
        ...completeInteractionWorkflowFixtures().verificationWorkspaceSessions[0],
        claimSpanRefs: ["claim-span-1", "claim-span-2"],
        claimVerificationStatusByClaim: { "claim-span-1": "not_practicable", "claim-span-2": "accepted" },
        nonBlindAuxiliaryMaterialConsulted: "yes",
      },
    ],
  });
  assert.equal(incompleteVerificationWorkspaceReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(
    incompleteVerificationWorkspaceReport.reviewSections.some(
      (section) => section.artifactType === "verification_workspace_session" && section.reason === "claimVerificationStatusByClaim:claim-span-2",
    ),
  );
  assert.ok(
    incompleteVerificationWorkspaceReport.reviewSections.some(
      (section) => section.artifactType === "verification_workspace_session" && section.reason === "nonBlindAuxiliaryMaterialConsulted",
    ),
  );

  const driftedPracticeSandboxPolicyReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    practiceSandboxPolicies: [
      {
        ...completeInteractionWorkflowFixtures().practiceSandboxPolicies[0],
        policyVersion: "practice-sandbox-draft",
        requiredPublicSourceAnchorIds: practiceSandboxSourceAnchorIds.filter((anchorId) => anchorId !== "anchor-table4-model-failure-overcredit"),
        completionStandards: { ...practiceSandboxCompletionStandards, minimumLockedAttemptsBeforeLiveRating: 1 },
      },
    ],
  });
  assert.equal(driftedPracticeSandboxPolicyReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(
    driftedPracticeSandboxPolicyReport.reviewSections.some(
      (section) => section.artifactType === "practice_sandbox_policy" && section.reason === "policyVersion",
    ),
  );
  assert.ok(
    driftedPracticeSandboxPolicyReport.reviewSections.some(
      (section) => section.artifactType === "practice_sandbox_policy" && section.reason === "requiredPublicSourceAnchorIds:anchor-table4-model-failure-overcredit",
    ),
  );
  assert.ok(
    driftedPracticeSandboxPolicyReport.reviewSections.some(
      (section) => section.artifactType === "practice_sandbox_policy" && section.reason === "completionStandards:mismatch",
    ),
  );

  const driftedSessionPacingPolicyReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    sessionPacingPolicies: [
      {
        ...completeInteractionWorkflowFixtures().sessionPacingPolicies[0],
        policyVersion: "session-pacing-draft",
        coveredSessionTargets: ["ordinary_live_rating"],
        thresholdSeconds: { ...sessionPacingThresholdSeconds, fatigueWarningAfter: 5400 },
        safeDeclineAbuseThresholds: { ...safeDeclineAbuseThresholds, qaAfterSameReasonDeclinesPer7d: 99 },
      },
    ],
  });
  assert.equal(driftedSessionPacingPolicyReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(
    driftedSessionPacingPolicyReport.reviewSections.some(
      (section) => section.artifactType === "session_pacing_policy" && section.reason === "policyVersion",
    ),
  );
  assert.ok(
    driftedSessionPacingPolicyReport.reviewSections.some(
      (section) => section.artifactType === "session_pacing_policy" && section.reason === "coveredSessionTargets:practice",
    ),
  );
  assert.ok(
    driftedSessionPacingPolicyReport.reviewSections.some(
      (section) => section.artifactType === "session_pacing_policy" && section.reason === "thresholdSeconds:mismatch",
    ),
  );
  assert.ok(
    driftedSessionPacingPolicyReport.reviewSections.some(
      (section) => section.artifactType === "session_pacing_policy" && section.reason === "safeDeclineAbuseThresholds:mismatch",
    ),
  );

  const unsafeRaterSessionReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    raterSessions: [
      {
        ...completeInteractionWorkflowFixtures().raterSessions[0],
        activeTimeSeconds: -5,
        expectedEffortCompleted: "rushed_but_accepted",
        stopAfterCurrentItemState: "ignored",
        fatigueWarningState: "penalize_label",
        qaRoutingStatus: "delete_rating",
      },
    ],
  });
  assert.equal(unsafeRaterSessionReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(unsafeRaterSessionReport.reviewSections.some((section) => section.artifactType === "rater_session" && section.reason === "activeTimeSeconds"));
  assert.ok(unsafeRaterSessionReport.reviewSections.some((section) => section.artifactType === "rater_session" && section.reason === "expectedEffortCompleted"));
  assert.ok(unsafeRaterSessionReport.reviewSections.some((section) => section.artifactType === "rater_session" && section.reason === "stopAfterCurrentItemState"));
  assert.ok(unsafeRaterSessionReport.reviewSections.some((section) => section.artifactType === "rater_session" && section.reason === "fatigueWarningState"));
  assert.ok(unsafeRaterSessionReport.reviewSections.some((section) => section.artifactType === "rater_session" && section.reason === "qaRoutingStatus"));

  const unsafeSelfScreenReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    assignmentSelfScreens: [
      {
        ...completeInteractionWorkflowFixtures().assignmentSelfScreens[0],
        selfScreenStatus: "benchmark_status_reviewed",
        sourcePeerModelGoldProtectedLabelVisibilityState: "benchmark_status_visible",
      },
    ],
  });
  assert.equal(unsafeSelfScreenReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(unsafeSelfScreenReport.reviewSections.some((section) => section.artifactType === "assignment_self_screen" && section.reason === "selfScreenStatus"));
  assert.ok(
    unsafeSelfScreenReport.reviewSections.some(
      (section) => section.artifactType === "assignment_self_screen" && section.reason === "sourcePeerModelGoldProtectedLabelVisibilityState",
    ),
  );

  const unsafeDeclineReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    assignmentDeclines: [
      {
        ...completeInteractionWorkflowFixtures().assignmentDeclines[0],
        reasonCode: "benchmark_too_hard",
        excludedFromRatingDenominator: false,
        sourcePeerModelGoldProtectedLabelVisibilityState: "benchmark_status_visible",
        repeatedOrStrategicDeclineQaPolicy: "monitor ordinary declines only",
      },
    ],
  });
  assert.equal(unsafeDeclineReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(unsafeDeclineReport.reviewSections.some((section) => section.artifactType === "assignment_decline" && section.reason === "reasonCode"));
  assert.ok(unsafeDeclineReport.reviewSections.some((section) => section.artifactType === "assignment_decline" && section.reason === "excludedFromRatingDenominator"));
  assert.ok(
    unsafeDeclineReport.reviewSections.some(
      (section) => section.artifactType === "assignment_decline" && section.reason === "sourcePeerModelGoldProtectedLabelVisibilityState",
    ),
  );
  assert.ok(unsafeDeclineReport.reviewSections.some((section) => section.artifactType === "assignment_decline" && section.reason === "repeatedOrStrategicDeclineQaPolicy:repeated"));

  const unsafeDeferralReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    assignmentDeferrals: [
      {
        ...completeInteractionWorkflowFixtures().assignmentDeferrals[0],
        deferReason: "wait_for_gold_label",
        resumePolicy: "resume_after_peer_distribution",
        sourcePeerModelGoldProtectedLabelVisibilityState: "source_visible",
      },
    ],
  });
  assert.equal(unsafeDeferralReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(unsafeDeferralReport.reviewSections.some((section) => section.artifactType === "assignment_deferral" && section.reason === "deferReason"));
  assert.ok(unsafeDeferralReport.reviewSections.some((section) => section.artifactType === "assignment_deferral" && section.reason === "resumePolicy"));
  assert.ok(
    unsafeDeferralReport.reviewSections.some(
      (section) => section.artifactType === "assignment_deferral" && section.reason === "sourcePeerModelGoldProtectedLabelVisibilityState",
    ),
  );

  const unsafeDiscussionIdentityReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    postLockDiscussionSessions: [
      {
        ...completeInteractionWorkflowFixtures().postLockDiscussionSessions[0],
        identityStagingPolicy: "real_names_visible_immediately",
        identityMaskPhaseStatus: "skipped",
        roleRevealPolicy: "seniority_visible_before_comments",
        initialRatingLockCheck: "ratings_still_draft",
        visibleMaterialPolicy: "peer_rationales_visible_before_lock",
        majorityPressureWarningState: "hidden",
      },
    ],
  });
  assert.equal(unsafeDiscussionIdentityReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(unsafeDiscussionIdentityReport.reviewSections.some((section) => section.artifactType === "post_lock_discussion_session" && section.reason === "identityStagingPolicy"));
  assert.ok(unsafeDiscussionIdentityReport.reviewSections.some((section) => section.artifactType === "post_lock_discussion_session" && section.reason === "identityMaskPhaseStatus"));
  assert.ok(unsafeDiscussionIdentityReport.reviewSections.some((section) => section.artifactType === "post_lock_discussion_session" && section.reason === "roleRevealPolicy"));
  assert.ok(unsafeDiscussionIdentityReport.reviewSections.some((section) => section.artifactType === "post_lock_discussion_session" && section.reason === "initialRatingLockCheck"));
  assert.ok(unsafeDiscussionIdentityReport.reviewSections.some((section) => section.artifactType === "post_lock_discussion_session" && section.reason === "visibleMaterialPolicy:post_lock"));
  assert.ok(unsafeDiscussionIdentityReport.reviewSections.some((section) => section.artifactType === "post_lock_discussion_session" && section.reason === "majorityPressureWarningState"));

  const unsafeBenchmarkSubmissionReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    benchmarkSubmissionPolicies: [
      {
        ...completeInteractionWorkflowFixtures().benchmarkSubmissionPolicies[0],
        aggregateOnlyReport: false,
        submissionBudget: { maxSubmissionsPerWindow: 0, windowHours: 720, remainingSubmissions: -1, cooldownHours: 0 },
        duplicateRunHandlingPolicy: "allow unlimited retries",
        stableEvaluationManifestRequirement: "latest mutable manifest",
        aggregateReportFieldPolicy: "per-item labels and hidden ids allowed",
        perItemFeedbackProhibited: false,
        perPairFeedbackProhibited: false,
        promptSpecificCorrectionHintsProhibited: false,
      },
    ],
    benchmarkSubmissions: [
      {
        ...completeInteractionWorkflowFixtures().benchmarkSubmissions[0],
        perItemOutputIncluded: true,
        perPairOutputIncluded: true,
        promptSpecificCorrectionHintsIncluded: true,
        duplicateRunStatus: "duplicate_allowed",
      },
    ],
  });
  assert.equal(unsafeBenchmarkSubmissionReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "aggregateOnlyReport"));
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "submissionBudget.maxSubmissionsPerWindow"));
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "submissionBudget.remainingSubmissions"));
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "duplicateRunHandlingPolicy:duplicate"));
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "perItemFeedbackProhibited"));
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "perPairFeedbackProhibited"));
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "promptSpecificCorrectionHintsProhibited"));
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "perItemOutputIncluded"));
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "perPairOutputIncluded"));
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "promptSpecificCorrectionHintsIncluded"));
  assert.ok(unsafeBenchmarkSubmissionReport.reviewSections.some((section) => section.reason === "duplicateRunStatus"));

  const nonIndependentGovernanceReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    governanceApprovalRecords: [
      {
        ...completeInteractionWorkflowFixtures().governanceApprovalRecords[0],
        approver1: "release-admin",
        approver2: "release-admin",
        independenceSeparationOfDutiesStatus: "single_operator_approval",
      },
    ],
  });
  assert.equal(nonIndependentGovernanceReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(nonIndependentGovernanceReport.reviewSections.some((section) => section.reason === "independenceSeparationOfDutiesStatus"));
  assert.ok(nonIndependentGovernanceReport.reviewSections.some((section) => section.reason === "proposedBy|approver1|approver2:distinct"));

  const unsafeProtectedRevalidationReport = buildInteractionWorkflowEvidenceReport("october-2026-demo", {
    ...completeInteractionWorkflowFixtures(),
    protectedArtifactRevalidations: [
      {
        ...completeInteractionWorkflowFixtures().protectedArtifactRevalidations[0],
        revalidationStatus: "not_checked",
        staleSupersededBehavior: "allow_cached_restore",
      },
    ],
  });
  assert.equal(unsafeProtectedRevalidationReport.releaseUseStatus, "interaction_workflow_evidence_review_required");
  assert.ok(unsafeProtectedRevalidationReport.reviewSections.some((section) => section.reason === "revalidationStatus"));
  assert.ok(unsafeProtectedRevalidationReport.reviewSections.some((section) => section.reason === "staleSupersededBehavior"));
});

test("operational control evidence gates policy decisions, phase gates, queue freshness, client surfaces, and audit chain", () => {
  const report = buildOperationalControlEvidenceReport("october-2026-demo", completeOperationalControlFixtures());

  assert.equal(report.releaseUseStatus, "submitted_operational_control_evidence_complete");
  assert.equal(report.counts.passingPolicyActionKindCount, policyActionKinds.length);
  assert.equal(report.counts.passingPolicyActionConsumptionCount, policyActionKinds.length);
  assert.equal(report.policyActionConsumptionRows.every((row) => row.status === "policy_action_consumption_covered"), true);
  assert.equal(report.counts.passingPhaseLaneCount, phaseGateLaneKinds.length);
  assert.equal(report.counts.passingQueueFreshnessLaneCount, queueFreshnessLanes.length);
  assert.equal(report.counts.passingClientSurfaceCount, clientSurfaces.length);
  assert.equal(report.requiredClientSurfaceIntegrityPolicyVersion, CLIENT_SURFACE_INTEGRITY_POLICY_VERSION);
  assert.deepEqual(report.requiredClientSurfaceCspDirectives, REQUIRED_CLIENT_SURFACE_CSP_DIRECTIVES);
  assert.deepEqual(report.requiredClientSurfaceTelemetryAllowlist, REQUIRED_CLIENT_SURFACE_TELEMETRY_ALLOWLIST);
  assert.equal(report.clientSurfaceIntegrityPolicyRows.at(-1).referrerPolicy, REQUIRED_CLIENT_SURFACE_REFERRER_POLICY);
  assert.equal(report.clientSurfaceIntegrityPolicyRows.at(-1).cacheOfflineStoragePolicy, REQUIRED_CLIENT_SURFACE_CACHE_POLICY);
  assert.deepEqual(report.clientSurfaceIntegrityPolicyRows.at(-1).cspDirectives, REQUIRED_CLIENT_SURFACE_CSP_DIRECTIVES);
  assert.deepEqual(report.clientSurfaceIntegrityPolicyRows.at(-1).firstPartyTelemetryAllowlist, REQUIRED_CLIENT_SURFACE_TELEMETRY_ALLOWLIST);
  assert.equal(report.counts.submittedCloudSecurityBudgetPolicyCount, 1);
  assert.equal(report.cloudSecurityBudgetPolicyId, "cloud-security-budget-policy-submitted");
  assert.equal(report.cloudSecurityBudgetPolicyReleaseUseStatus, "submitted_cloud_security_budget_policy_active");
  assert.deepEqual(report.requiredCloudSecurityBudgetRangeUsd, cloudSecurityBudgetRangeUsd);
  assert.deepEqual(report.requiredCloudSecurityBudgetCategoryMinimumUsd, cloudSecurityBudgetCategoryMinimumUsd);
  assert.deepEqual(report.requiredCloudSecurityControls, cloudSecurityControls);
  assert.deepEqual(report.requiredCloudSecurityApprovalStatuses, cloudSecurityApprovalStatuses);
  assert.equal(report.cloudSecurityBudgetPolicyRows.at(-1).externalWormAuditLogFundingRequired, true);
  assert.equal(report.counts.submittedExternalWormAuditLogPolicyCount, 1);
  assert.equal(report.externalWormAuditLogPolicyId, "external-worm-audit-log-policy-submitted");
  assert.equal(report.externalWormAuditLogPolicyReleaseUseStatus, "submitted_external_worm_audit_log_policy_active");
  assert.equal(report.requiredExternalWormAuditLogPolicyVersion, externalWormAuditLogPolicyVersion);
  assert.equal(report.requiredExternalWormAuditLedgerBackend, externalWormAuditLedgerBackend);
  assert.equal(report.requiredExternalWormAuditPointerPrefix, externalWormAuditPointerPrefix);
  assert.deepEqual(report.requiredExternalWormAuditReceiptFields, externalWormAuditReceiptFields);
  assert.equal(report.sensitiveAuditChainEventRows.at(-1).externalWormAuditLogPolicyId, "external-worm-audit-log-policy-submitted");
  assert.equal(report.sensitiveAuditChainEventRows.at(-1).externalWormReceiptHash.startsWith("sha256:"), true);
  assert.equal(report.counts.passingAuditChainKindCount, auditChainEventKinds.length);
  assert.equal(report.counts.submittedSensitiveAuditChainGovernanceApprovalCount, auditChainEventKinds.length);
  assert.equal(report.sensitiveAuditChainGovernanceApprovalRows.filter((row) => row.rowSource === "submitted_workflow_audit_chain_governance_approval").length, auditChainEventKinds.length);
  assert.deepEqual(report.reviewSections, []);
});

test("seed operational control evidence includes queue stale-by-delay scans for all freshness lanes", () => {
  const report = buildOperationalControlEvidenceReport("october-2026-demo");
  const seedScanRows = report.queueStaleByDelayScanRows.filter((row) => row.rowSource === "seed_queue_stale_by_delay_scan");

  assert.equal(report.releaseUseStatus, "seed_operational_control_evidence_complete");
  assert.equal(seedScanRows.length, queueFreshnessLanes.length);
  assert.equal(report.counts.submittedQueueStaleByDelayScanCount, 0);
  assert.equal(report.counts.passingQueueFreshnessLaneCount, queueFreshnessLanes.length);
  assert.equal(report.queueLaneRows.every((row) => row.status === "queue_freshness_lane_complete"), true);
  assert.deepEqual(report.reviewSections, []);
});

test("operational control evidence accepts routine workflow policy side effects without requiring full package coverage", () => {
  const completeFixtures = completeOperationalControlFixtures();
  const sideEffectActionKinds = new Set(["discussion_open", "adjudication_finalize"]);
  const report = buildOperationalControlEvidenceReport("october-2026-demo", {
    policyDecisionRecords: completeFixtures.policyDecisionRecords.filter((decision) => sideEffectActionKinds.has(decision.actionKind)),
    policyDecisionConsumptions: completeFixtures.policyDecisionConsumptions.filter((consumption) => sideEffectActionKinds.has(consumption.actionKind)),
  });

  assert.equal(report.releaseUseStatus, "seed_operational_control_evidence_complete");
  assert.equal(report.counts.submittedPolicyDecisionCount, sideEffectActionKinds.size);
  assert.equal(report.counts.submittedPolicyDecisionConsumptionCount, sideEffectActionKinds.size);
  assert.equal(
    report.policyActionConsumptionRows.some((row) => row.status === "policy_action_consumption_missing"),
    true,
  );
  assert.equal(
    report.reviewSections.some((section) => section.artifactType === "policy_action_consumption_gate"),
    false,
  );
  assert.deepEqual(report.reviewSections, []);
});

test("operational control evidence rejects stale or wrong-scope policy decisions", () => {
  const unsafeFixtures = completeOperationalControlFixtures();
  unsafeFixtures.policyActionKinds = unsafeFixtures.policyActionKinds.map((actionKind, index) =>
    index === 0
      ? {
          ...actionKind,
          requiresPhaseGateBinding: false,
        }
      : actionKind
  );
  unsafeFixtures.policyDecisionRecords = unsafeFixtures.policyDecisionRecords.map((decision, index) => {
    if (index === 0) return { ...decision, replayStatus: "consumed" };
    if (index === 2) return { ...decision, manifestBindingStatus: "wrong_manifest" };
    if (index === 3) return { ...decision, outputSchemaBindingStatus: "wrong_output_schema" };
    if (index === 4) return { ...decision, phaseGateBindingStatus: "wrong_phase" };
    if (index === 5) return { ...decision, idempotencyBindingStatus: "wrong_idempotency" };
    if (index === 6) return { ...decision, targetArtifactIds: [] };
    if (index === 7) return { ...decision, manifestHash: "not-a-sha256-hash" };
    return decision;
  });
  unsafeFixtures.policyDecisionConsumptions = unsafeFixtures.policyDecisionConsumptions.map((consumption) => ({
    ...consumption,
    manifestHash: "sha256:wrong-manifest",
    phaseGateBundleId: "wrong-phase-gate",
    outputSchemaHash: "sha256:wrong-output-schema",
    idempotencyKey: "wrong-idempotency-key",
    replayRejected: true,
    scopeMatched: false,
  }));
  const report = buildOperationalControlEvidenceReport("october-2026-demo", unsafeFixtures);

  assert.equal(report.releaseUseStatus, "operational_control_review_required");
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_action_kind" && section.reason === "requiresPhaseGateBinding"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision" && section.reason === "replayStatus"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision" && section.reason === "manifestBindingStatus"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision" && section.reason === "outputSchemaBindingStatus"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision" && section.reason === "phaseGateBindingStatus"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision" && section.reason === "idempotencyBindingStatus"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision" && section.reason === "targetArtifactIds"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision" && section.reason === "manifestHash"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision_consumption" && section.reason === "manifestHash"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision_consumption" && section.reason === "phaseGateBundleId"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision_consumption" && section.reason === "outputSchemaHash"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision_consumption" && section.reason === "idempotencyKey"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision_consumption" && section.reason === "replayRejected"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_decision_consumption" && section.reason === "scopeMatched"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "policy_action_consumption_gate" && section.reason === "policy_action_consumption_missing"));
});

test("operational control evidence rejects incomplete queue stale-by-delay and backpressure proof", () => {
  const missingHealthFixtures = completeOperationalControlFixtures();
  missingHealthFixtures.queueFreshnessPolicies = missingHealthFixtures.queueFreshnessPolicies.map((policy, index) =>
    index === 0
      ? {
          ...policy,
          backpressureThreshold: undefined,
          queueHealthChecks: ["age_window"],
        }
      : policy
  );
  const missingHealthReport = buildOperationalControlEvidenceReport("october-2026-demo", missingHealthFixtures);

  assert.equal(missingHealthReport.releaseUseStatus, "operational_control_review_required");
  assert.ok(missingHealthReport.reviewSections.some((section) => section.artifactType === "queue_freshness_policy" && section.reason === "backpressureThreshold"));
  assert.ok(missingHealthReport.reviewSections.some((section) => section.artifactType === "queue_freshness_policy" && section.reason.includes("queueHealthChecks")));

  const incompleteScanFixtures = completeOperationalControlFixtures();
  incompleteScanFixtures.queueStaleByDelayScans = incompleteScanFixtures.queueStaleByDelayScans.map((scan, index) =>
    index === 0
      ? {
          ...scan,
          staleCount: 0,
          dependencyRevalidationChecks: ["item_text", "rubric"],
          staleTransitionOutcomes: ["age_window_enforced"],
          sideEffectSuppressionConfirmed: false,
        }
      : scan
  );
  const incompleteScanReport = buildOperationalControlEvidenceReport("october-2026-demo", incompleteScanFixtures);

  assert.equal(incompleteScanReport.releaseUseStatus, "operational_control_review_required");
  assert.ok(incompleteScanReport.reviewSections.some((section) => section.artifactType === "queue_stale_by_delay_scan" && section.reason === "staleCount"));
  assert.ok(incompleteScanReport.reviewSections.some((section) => section.artifactType === "queue_stale_by_delay_scan" && section.reason.includes("dependencyRevalidationChecks")));
  assert.ok(incompleteScanReport.reviewSections.some((section) => section.artifactType === "queue_stale_by_delay_scan" && section.reason.includes("staleTransitionOutcomes")));
  assert.ok(incompleteScanReport.reviewSections.some((section) => section.artifactType === "queue_stale_by_delay_scan" && section.reason === "sideEffectSuppressionConfirmed"));
});

test("operational control evidence rejects client-surface telemetry and instrumentation gaps", () => {
  const unsafeFixtures = completeOperationalControlFixtures();
  unsafeFixtures.clientSurfaceIntegrityPolicies = unsafeFixtures.clientSurfaceIntegrityPolicies.map((policy, index) =>
    index === 0
      ? {
          ...policy,
          thirdPartyPixelsProhibited: false,
          thirdPartyResourceAllowlist: ["https://analytics.example.test/pixel.js"],
          heatmapTrackingProhibited: false,
          firstPartyTelemetryOnly: false,
          cspDirectives: { "default-src": ["*"], "script-src": ["*"] },
          firstPartyTelemetryAllowlist: ["page_load", "session_replay_event"],
          screenStateOutputSchemaBound: false,
        }
      : policy
  );
  unsafeFixtures.clientSurfaceIntegrityChecks = unsafeFixtures.clientSurfaceIntegrityChecks.map((check, index) =>
    index === 0
      ? {
          ...check,
          checksPassed: check.checksPassed.filter(
            (item) => !["no_heatmaps", "no_third_party_pixels", "first_party_telemetry_allowlist", "screen_state_output_schema_binding"].includes(item)
          ),
        }
      : check
  );
  const report = buildOperationalControlEvidenceReport("october-2026-demo", unsafeFixtures);

  assert.equal(report.releaseUseStatus, "operational_control_review_required");
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_policy" && section.reason === "thirdPartyPixelsProhibited"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_policy" && section.reason === "thirdPartyResourceAllowlist"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_policy" && section.reason === "heatmapTrackingProhibited"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_policy" && section.reason === "firstPartyTelemetryOnly"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_policy" && section.reason === "cspDirectives"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_policy" && section.reason === "firstPartyTelemetryAllowlist"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_policy" && section.reason === "screenStateOutputSchemaBound"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_check" && section.reason === "no_heatmaps"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_check" && section.reason === "no_third_party_pixels"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_check" && section.reason === "first_party_telemetry_allowlist"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "client_surface_integrity_check" && section.reason === "screen_state_output_schema_binding"));
});

test("operational control evidence rejects underfunded cloud and security budget policy", () => {
  const unsafeFixtures = completeOperationalControlFixtures();
  unsafeFixtures.cloudSecurityBudgetPolicies = [
    {
      ...unsafeFixtures.cloudSecurityBudgetPolicies[0],
      id: "cloud-security-budget-policy-underfunded",
      totalBudgetRangeUsd: { minimum: 10000, maximum: 20000 },
      categoryMinimumUsd: {
        ...cloudSecurityBudgetCategoryMinimumUsd,
        externalWormAuditLogOrLedger: 0,
      },
      requiredControls: cloudSecurityControls.filter((control) => control !== "external_worm_audit_log"),
      approvalStatuses: ["budget_reserved"],
      productionReleaseBlockedUntilReserved: false,
      externalWormAuditLogFundingRequired: false,
      protectedSplitIsolationFundingRule: "public demo hosting only",
    },
  ];
  const report = buildOperationalControlEvidenceReport("october-2026-demo", unsafeFixtures);

  assert.equal(report.releaseUseStatus, "operational_control_review_required");
  assert.ok(report.reviewSections.some((section) => section.artifactType === "cloud_security_budget_policy" && section.reason === "totalBudgetRangeUsd"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "cloud_security_budget_policy" && section.reason === "categoryMinimumUsd"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "cloud_security_budget_policy" && section.reason.includes("requiredControls:external_worm_audit_log")));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "cloud_security_budget_policy" && section.reason.includes("approvalStatuses:security_review_approved")));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "cloud_security_budget_policy" && section.reason === "productionReleaseBlockedUntilReserved"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "cloud_security_budget_policy" && section.reason === "externalWormAuditLogFundingRequired"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "cloud_security_budget_policy" && section.reason === "protectedSplitIsolationFundingRule"));
});

test("operational control evidence rejects drifted external WORM audit-log policy", () => {
  const unsafeFixtures = completeOperationalControlFixtures();
  unsafeFixtures.externalWormAuditLogPolicies = [
    {
      ...unsafeFixtures.externalWormAuditLogPolicies[0],
      id: "external-worm-audit-log-policy-drifted",
      ledgerBackend: "ordinary_database_audit_rows",
      ledgerPointerPrefix: "db:",
      receiptFields: externalWormAuditReceiptFields.filter((field) => field !== "externalWormLedgerPointer"),
      retentionYears: 1,
      fallbackRule: "continue release with ordinary database rows",
    },
  ];
  unsafeFixtures.sensitiveAuditChainEvents = unsafeFixtures.sensitiveAuditChainEvents.map((event) => ({
    ...event,
    externalWormAuditLogPolicyId: "external-worm-audit-log-policy-drifted",
    externalWormLedgerPointer: "db:ordinary-row",
  }));
  const report = buildOperationalControlEvidenceReport("october-2026-demo", unsafeFixtures);

  assert.equal(report.releaseUseStatus, "operational_control_review_required");
  assert.equal(report.externalWormAuditLogPolicyReleaseUseStatus, "submitted_external_worm_audit_log_policy_review_required");
  assert.ok(report.reviewSections.some((section) => section.artifactType === "external_worm_audit_log_policy" && section.reason === "ledgerBackend"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "external_worm_audit_log_policy" && section.reason === "ledgerPointerPrefix"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "externalWormAuditLogPolicyId:reviewReasons"));
});

test("operational control evidence rejects incomplete or failed sensitive audit chains", () => {
  const unsafeFixtures = completeOperationalControlFixtures();
  unsafeFixtures.sensitiveAuditChainEvents = unsafeFixtures.sensitiveAuditChainEvents.map((event, index) => {
    if (index === 0) {
      return {
        ...event,
        previousEventHash: "sha256:should-not-exist-on-first-event",
        actorHash: "plain-actor-id",
        approverHashes: ["sha256:approver-a", "plain-approver"],
        beforeHash: event.afterHash,
        redactedReasonClasses: [],
        protectedDataExposureClass: "raw_hidden_text",
        externalWormLedgerPointer: "ordinary-db-row",
        externalWormReceiptHash: "ordinary-receipt-row",
        redactionPolicy: "redact private rater data only",
      };
    }
    if (index === 1) {
      return {
        ...event,
        actionKind: "training_export_release",
        policyDecisionId: "",
        governanceApprovalRecordId: "",
      };
    }
    if (index === 2) {
      return {
        ...event,
        policyDecisionId: "policy-decision-submitted-training_export",
      };
    }
    if (index === 3) {
      return {
        ...event,
        governanceApprovalRecordId: "governance-approval-submitted-training_export_release",
      };
    }
    return event;
  });
  unsafeFixtures.governanceApprovalRecords = unsafeFixtures.governanceApprovalRecords.map((record, index) =>
    index === 0
      ? {
          ...record,
          approver2: record.approver1,
          independenceSeparationOfDutiesStatus: "single_operator_approval",
        }
      : record
  );
  unsafeFixtures.sensitiveAuditChainVerifications = unsafeFixtures.sensitiveAuditChainVerifications.map((verification) => ({
    ...verification,
    chainStatus: "passed",
    failures: ["previousEventHash:sensitive-audit-event-submitted-1"],
  }));
  const report = buildOperationalControlEvidenceReport("october-2026-demo", unsafeFixtures);

  assert.equal(report.releaseUseStatus, "operational_control_review_required");
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "previousEventHash"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "actorHash"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "approverHashes"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "beforeAfterHash"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "redactedReasonClasses"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "protectedDataExposureClass"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "externalWormLedgerPointer"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "externalWormReceiptHash"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "redactionPolicy"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "actionKind"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "policyDecisionId"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "policyDecisionId:actionKind"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "governanceApprovalRecordId"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "governanceApprovalRecordId:actionKind"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "governanceApprovalRecordId:affectedArtifactIds"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_event" && section.reason === "governanceApprovalRecordId:reviewReasons"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "audit_chain_governance_approval" && section.reason === "independentApprovers"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "audit_chain_governance_approval" && section.reason === "independenceSeparationOfDutiesStatus"));
  assert.ok(report.reviewSections.some((section) => section.artifactType === "sensitive_audit_chain_verification" && section.reason === "failures"));
});

test("rater data-governance evidence requires consent visibility and withdrawal handling", () => {
  const report = buildRaterDataGovernanceEvidenceReport("october-2026-demo", {
    raterDataConsents: [
      {
        id: "rater-data-consent-submitted",
        raterId: "demo-rater",
        noticeVersion: "rater-data-use-v1",
        dataCategoriesCovered: raterDataCategories,
        useScopesAcknowledged: raterDataUseScopes,
        dataProfileVisible: true,
        publicArtifactsDeidentifiedByDefault: true,
        identifiableAccessRestriction: "approved operational or research role access only",
        privateLearningDataExcludedFromReleaseAndTraining: true,
        consentedAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    raterDataRestrictionRequests: [
      {
        id: "rater-data-restriction-submitted",
        raterId: "demo-rater",
        requestType: "identifiable_access_review",
        affectedDataCategories: ["session_pacing", "safe_decline_reasons"],
        actionTaken: "review_opened",
        requesterNotificationStatus: "notified",
        timestamp: "2026-10-01T00:02:00.000Z",
      },
    ],
    volunteerDataWithdrawalRequests: [
      {
        id: "withdrawal-submitted",
        raterId: "demo-rater",
        requestType: "future_training_export_exclusion",
        affectedDataCategories: ["private_learning_dashboard", "future_training_export"],
        actionTaken: "future_training_export_exclusion_recorded",
        identifiableTelemetryRestricted: true,
        publicAttributionRemoved: true,
        privateLearningDashboardDeleted: true,
        futureTrainingExportExcluded: true,
        frozenSnapshotImpact: "already_frozen_deidentified_label_snapshots_preserved",
        requesterNotificationStatus: "notified",
        timestamp: "2026-10-01T00:03:00.000Z",
      },
    ],
  });

  assert.equal(report.releaseUseStatus, "submitted_rater_data_governance_evidence_complete");
  assert.equal(report.counts.submittedConsentCount, 1);
  assert.equal(report.counts.submittedVolunteerDataConsentProfileCount, 1);
  assert.equal(report.volunteerDataConsentProfileRows.at(-1).entityType, "VolunteerDataConsentProfile");
  assert.equal(report.counts.submittedWithdrawalRequestCount, 1);
  assert.deepEqual(report.reviewSections, []);

  const incompleteEffectReport = buildRaterDataGovernanceEvidenceReport("october-2026-demo", {
    raterDataConsents: [
      {
        id: "rater-data-consent-submitted",
        raterId: "demo-rater",
        noticeVersion: "rater-data-use-v1",
        dataCategoriesCovered: raterDataCategories,
        useScopesAcknowledged: raterDataUseScopes,
        dataProfileVisible: true,
        publicArtifactsDeidentifiedByDefault: true,
        identifiableAccessRestriction: "approved operational or research role access only",
        privateLearningDataExcludedFromReleaseAndTraining: true,
        consentedAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    volunteerDataWithdrawalRequests: [
      {
        id: "withdrawal-deactivation-incomplete",
        raterId: "demo-rater",
        requestType: "account_deactivation",
        affectedDataCategories: ["private_learning_dashboard", "future_training_export", "public_attribution"],
        actionTaken: "account_deactivation_started",
        futureAssignmentStop: true,
        identifiableTelemetryRestricted: false,
        publicAttributionRemoved: false,
        privateLearningDashboardDeleted: true,
        futureTrainingExportExcluded: false,
        frozenSnapshotImpact: "already_frozen_deidentified_label_snapshots_preserved",
        requesterNotificationStatus: "notified",
        timestamp: "2026-10-01T00:03:00.000Z",
      },
      {
        id: "withdrawal-frozen-label-incomplete",
        raterId: "demo-rater",
        requestType: "frozen_label_removal_request",
        affectedDataCategories: ["released_label_rows"],
        actionTaken: "frozen_label_review_opened",
        frozenSnapshotImpact: "denominator_change_review_required",
        requesterNotificationStatus: "notified",
        timestamp: "2026-10-01T00:04:00.000Z",
      },
    ],
  });
  assert.equal(incompleteEffectReport.releaseUseStatus, "rater_data_governance_review_required");
  assert.ok(incompleteEffectReport.reviewSections.some((section) => section.artifactId === "withdrawal-deactivation-incomplete" && section.reason === "identifiableTelemetryRestricted"));
  assert.ok(incompleteEffectReport.reviewSections.some((section) => section.artifactId === "withdrawal-deactivation-incomplete" && section.reason === "publicAttributionRemoved"));
  assert.ok(incompleteEffectReport.reviewSections.some((section) => section.artifactId === "withdrawal-deactivation-incomplete" && section.reason === "futureTrainingExportExcluded"));
  assert.ok(incompleteEffectReport.reviewSections.some((section) => section.artifactId === "withdrawal-frozen-label-incomplete" && section.reason === "denominatorChangeArtifactId"));
});

test("workflow state-machine evidence requires guarded append-only transitions for each release lifecycle", () => {
  const report = buildWorkflowStateMachineEvidenceReport("october-2026-demo", {
    workflowStateTransitionLogs: workflowStateTransitionFixtures,
  });

  assert.equal(report.releaseUseStatus, "submitted_workflow_state_machine_evidence_complete");
  assert.equal(report.counts.submittedTransitionCount, workflowStateTransitionFixtures.length);
  assert.equal(report.counts.acceptedSubmittedTransitionCount, workflowStateTransitionFixtures.length - 1);
  assert.equal(report.counts.rejectedSubmittedTransitionCount, 1);
  assert.equal(report.counts.passingEntityTypeCount, report.requiredEntityTypes.length);
  assert.equal(report.counts.passingTransitionEdgeCount, report.counts.requiredTransitionEdgeCount);
  assert.equal(report.transitionCoverageRows.every((row) => row.status === "workflow_state_transition_edge_covered"), true);
  assert.deepEqual(report.reviewSections, []);
  assert.equal(report.entityRows.every((row) => row.status === "workflow_state_machine_entity_complete"), true);
  assert.equal(report.transitionRows.find((row) => row.id === "workflow-state-transition-rejected-rating-backwards")?.status, "rejected_guarded_transition");
  assert.ok(report.stateMachineRules.rating.allowedTransitions.some((transition) => transition.priorState === "draft" && transition.nextState === "locked_initial"));
});

test("UX simplification evidence gates submitted server-derived screen states without feature loss", () => {
  const policyId = "ux-policy-submitted";
  const screenStatePayloads = uxSimplificationSurfaces.map((surface) => ({
    id: `screen-state-${surface}`,
    surface,
    role: ["rating", "practice", "calibration", "consent", "withdrawal", "rater_data_governance"].includes(surface) ? "graduate" : "admin",
    payloadSource: "server_derived",
    schemaVersion: "screen-state-lmca-v1",
    outputSchemaVersion: "screen-state-output-lmca-v1",
    policyVersionProvenance: {
      uxSimplificationPolicyId: policyId,
      visibilityPolicyId: "visibility-policy-submitted",
      workflowProfileId: `${surface}-workflow-profile`,
      assistPolicyId: "pre-submit-assist-submitted",
      uiExperimentPolicyId: "ui-experiment-policy-submitted",
      rubricLintConfigId: "rubric-lint-config-submitted",
    },
    taskStatement: `Complete the ${surface.replace(/_/g, " ")} workflow step without changing LMCA scoring semantics.`,
    primaryNextAction: "complete_required_controls",
    submissionConsequenceSummary: "Submitting records an append-only audit event and preserves hidden labels.",
    progressiveDisclosureState: "advanced_controls_collapsed_until_needed",
    createdAt: "2026-10-01T00:02:00.000Z",
    visibleFieldAllowlist: ["taskStatement", "primaryNextAction", "completionState", "scoreFields", "issueReport", "appendixFAnchor"],
    enabledActionAllowlist: uxScreenControlKeys,
    requiredControlKeys: uxScreenControlKeys,
    optionalPanelKeys: ["rubric_glossary", "provenance_summary"],
    requiredOptionalControlMap: {
      requiredControls: uxScreenControlKeys,
      optionalPanels: ["rubric_glossary", "provenance_summary"],
    },
    protectedGoldBenchmarkDisclosureState: {
      benchmarkMembership: "not_disclosed",
      goldAnswer: "not_disclosed",
      protectedSplitStatus: "not_disclosed",
    },
    hiddenFieldClasses: uxHiddenFieldClasses,
    rejectedUnknownKeys: true,
    sanitized: true,
  }));

  const uxSimplificationPolicies = [
    {
      id: policyId,
      policyVersion: "rlhf88-feature-preserving-v1",
      enabledSurfaces: uxSimplificationSurfaces,
      coveredRoles: ["graduate", "expert", "admin", "auditor"],
      coveredLaneClasses: ["live_rating", "practice", "calibration", "discussion", "adjudication", "release_review", "admin_governance"],
      coveredSplitClasses: ["public_train", "internal_validation", "hidden_benchmark", "gold_certification", "release_candidate"],
      localeSet: ["en-US"],
      taskFirstCopyRequired: true,
      progressiveDisclosureRequired: true,
      glossarySupportRequired: true,
      serverDerivedScreenStateRequired: true,
      exactRubricSemanticsPreserved: true,
      taskFirstLayoutRules: { taskStatement: "always_visible", primaryNextAction: "always_visible" },
      plainLanguageCopyRules: { primarySurface: "short_plain_language", exactRubricTerms: "preserve_one_click_source_of_truth" },
      glossaryTooltipPolicy: { requiredTerms: ["centrality", "strength", "dead_weight", "single_issue"], access: "one_click" },
      progressiveDisclosureMapRequirements: { advancedControls: "collapsed_until_needed", mandatoryControls: "never_hidden_as_optional" },
      requiredAlwaysVisibleControls: ["task_statement", "primary_next_action", "required_controls"],
      requiredOneClickAccessibleControls: ["appendix_f_anchor_access", "rubric_glossary", "item_issue_report"],
      appendixFAnchorAccess: "one_click",
      protectedSplitVariantPolicy: "block or quarantine unregistered variants",
      hiddenMetadataLeakagePolicy: "forbid hidden metadata fields in sanitized payloads",
      noFeatureLossChecklist: uxNoFeatureLossKeys,
      exactRubricTermPreservationRules: { dimensionNames: "exact_terms_visible_or_one_click", appendixF: "source_of_truth" },
      prohibitedSimplifications: { mandatoryControlsOptionalized: false, rubricSemanticsChanged: false, blindingWeakened: false },
      protectedSplitEligibility: { unregisteredCopyVariants: "blocked_or_quarantined", protectedLabels: "frozen_policy_required" },
      associatedCopyBundleIds: ["ui-copy-bundle-submitted", "rubric-copy-bundle-submitted"],
      associatedCopyBundleHashes: ["sha256-ui-copy-submitted", "sha256-rubric-copy-submitted"],
      createdBy: "demo-admin",
      frozenAt: "2026-10-01T00:00:00.000Z",
      timestamp: "2026-10-01T00:00:00.000Z",
    },
  ];
  const uxSimplificationReviews = [
    {
      id: "ux-review-submitted",
      policyId,
      screenSetIds: ["screen-set-submitted-enabled-surfaces"],
      workflowProfileIds: uxSimplificationSurfaces.map((surface) => `${surface}-workflow-profile`),
      reviewedSurfaces: uxSimplificationSurfaces,
      reviewedLocaleSet: ["en-US"],
      reviewStatus: "passed",
      reviewerRole: "release_admin",
      noFeatureLossChecklist: uxNoFeatureLossKeys,
      featureParityChecklistResults: { no_feature_loss: "passed", required_controls_reachable: "passed" },
      requiredControlDiscoverabilityResults: { required_controls_visible_or_one_click: "passed" },
      rubricSemanticsPreservationResult: { status: "passed", exact_terms_preserved: true },
      blindingProtectedLabelLeakageResult: { status: "passed", hidden_fields_absent: true },
      accessibilityReadabilityLinkage: { accessibilityConformanceReportId: "accessibility-submitted", readabilityStatus: "passed" },
      userComprehensionOrExpertReviewNotes: "Expert review found task-first copy clearer without changing rubric semantics.",
      blockersAndMitigations: { blockers: [], mitigations: ["advanced_controls_progressively_disclosed"] },
      promotionDecision: "promote",
      reviewer: "ux-reviewer",
      timestamp: "2026-10-01T00:01:00.000Z",
      exactRubricSemanticsPreserved: true,
      appendixFAnchorAccessVerified: true,
      serverDerivedScreenStateVerified: true,
      protectedLeakageReviewPassed: true,
    },
  ];
  const screenFeatureParityChecks = uxScreenFeatureParityChecks(policyId);
  const copyPreviews = simplifiedCopyPreviews();
  const traceabilityMaps = rubricCopyTraceabilityMaps();

  const report = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads,
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(report.releaseUseStatus, "submitted_ux_simplification_evidence_complete");
  assert.equal(report.counts.submittedPolicyCount, 1);
  assert.equal(report.counts.submittedReviewCount, 1);
  assert.equal(report.counts.submittedScreenStateCount, uxSimplificationSurfaces.length);
  assert.equal(report.counts.submittedFeatureParityCheckCount, uxSimplificationSurfaces.length);
  assert.equal(report.counts.submittedSimplifiedCopyPreviewCount, uxSimplificationSurfaces.length);
  assert.equal(report.counts.submittedRubricCopyTraceabilityMapCount, 1);
  assert.equal(report.counts.passingSurfaceCount, uxSimplificationSurfaces.length);
  assert.deepEqual(report.reviewSections, []);
  assert.ok(report.activePolicy.coveredSplitClasses.includes("hidden_benchmark"));
  assert.deepEqual(report.activePolicy.associatedCopyBundleIds, ["ui-copy-bundle-submitted", "rubric-copy-bundle-submitted"]);
  assert.equal(report.reviewRows.at(-1).promotionDecision, "promote");
  assert.equal(report.reviewRows.at(-1).rubricSemanticsPreservationResult.status, "passed");
  assert.equal(report.screenStateRows.at(-1).outputSchemaVersion, "screen-state-output-lmca-v1");
  assert.equal(report.screenStateRows.at(-1).protectedGoldBenchmarkDisclosureState.benchmarkMembership, "not_disclosed");
  assert.equal(report.screenStateRows.filter((row) => row.payloadSourceLabel === "submitted_workflow_screen_state_payload").every((row) => row.forbiddenVisibleFields.length === 0), true);

  const extraKeyReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads: [
      { ...screenStatePayloads[0], id: "screen-state-extra-key", clientSideInferenceInputs: { completionState: "hidden_client_guess" } },
      ...screenStatePayloads.slice(1),
    ],
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });
  assert.equal(extraKeyReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(
    extraKeyReport.reviewSections.some(
      (section) =>
        section.artifactType === "screen_state_payload" &&
        section.artifactId === "screen-state-extra-key" &&
        section.reason === "unexpectedTopLevelKeys:clientSideInferenceInputs",
    ),
  );

  const nestedHiddenFieldReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads: [
      {
        ...screenStatePayloads[0],
        id: "screen-state-nested-hidden-field",
        policyVersionProvenance: {
          ...screenStatePayloads[0].policyVersionProvenance,
          modelJudgeScoreId: "model-judge-score-leak",
        },
      },
      ...screenStatePayloads.slice(1),
    ],
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });
  assert.equal(nestedHiddenFieldReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(
    nestedHiddenFieldReport.reviewSections.some(
      (section) =>
        section.artifactType === "screen_state_payload" &&
        section.artifactId === "screen-state-nested-hidden-field" &&
        section.reason === "forbiddenPayloadFields:policyVersionProvenance.modelJudgeScoreId",
    ),
  );

  assert.equal(report.screenFeatureParityCheckRows.find((row) => row.screenId === "adjudication").requiredControlResults.verification_control, "reachable");
  assert.equal(report.surfaceRows.find((row) => row.surface === "rater_data_governance").status, "ux_surface_simplification_gate_passed");
  assert.equal(
    report.screenFeatureParityCheckRows.find((row) => row.screenId === "rater_data_governance").requiredControlResults.rater_data_profile_visibility,
    "reachable",
  );
  assert.equal(
    report.simplifiedCopyPreviewRows.find((row) => row.screenId === "rating" && row.rowSource === "submitted_workflow_simplified_copy_preview").protectedSplitVariantDisposition,
    "frozen_compatible",
  );
  assert.equal(
    report.simplifiedCopyPreviewRows.find((row) => row.screenId === "rating" && row.rowSource === "submitted_workflow_simplified_copy_preview").raterInstructionRenderVersionId,
    "rater-instruction-render-submitted",
  );
  assert.equal(report.simplifiedCopyPreviewRows.every((row) => row.glossaryTooltipIds.includes("centrality")), true);
  assert.equal(report.rubricCopyTraceabilityMapRows.at(-1).semanticDriftTestStatus, "passed");
  assert.equal(report.rubricCopyTraceabilityMapRows.at(-1).clauseMap.centrality, "appendix_f.centrality");
  assert.equal(report.surfaceRows.find((row) => row.surface === "rating").rubricCopyTraceabilityCoversSurface, true);

  const incompleteScreenStateReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads: [
      {
        ...screenStatePayloads[0],
        id: "screen-state-rating-incomplete-task-first-copy",
        outputSchemaVersion: "",
        taskStatement: "",
        protectedGoldBenchmarkDisclosureState: {},
        policyVersionProvenance: {
          ...screenStatePayloads[0].policyVersionProvenance,
          assistPolicyId: "",
          rubricLintConfigId: "",
        },
      },
    ],
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(incompleteScreenStateReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(incompleteScreenStateReport.reviewSections.some((section) => section.reason === "outputSchemaVersion"));
  assert.ok(incompleteScreenStateReport.reviewSections.some((section) => section.reason === "taskStatement"));
  assert.ok(incompleteScreenStateReport.reviewSections.some((section) => section.reason === "protectedGoldBenchmarkDisclosureState"));
  assert.ok(
    incompleteScreenStateReport.reviewSections.some((section) => section.reason === "policyVersionProvenance.assistPolicyId"),
  );
  assert.ok(
    incompleteScreenStateReport.reviewSections.some((section) => section.reason === "policyVersionProvenance.rubricLintConfigId"),
  );

  const incompleteScreenStateControlMapReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads: [
      {
        ...screenStatePayloads[0],
        id: "screen-state-rating-incomplete-control-map",
        requiredOptionalControlMap: {
          requiredControls: ["score_fields"],
          optionalPanels: ["rubric_glossary"],
        },
      },
    ],
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(incompleteScreenStateControlMapReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(
    incompleteScreenStateControlMapReport.reviewSections.some((section) =>
      section.reason.startsWith("requiredOptionalControlMap.requiredControls:"),
    ),
  );

  const leakingScreenStateDisclosureReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads: [
      {
        ...screenStatePayloads[0],
        id: "screen-state-rating-leaking-disclosure-state",
        protectedGoldBenchmarkDisclosureState: {
          benchmarkMembership: "hidden_benchmark",
          goldAnswer: "not_disclosed",
          protectedSplitStatus: "not_disclosed",
        },
      },
    ],
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(leakingScreenStateDisclosureReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(
    leakingScreenStateDisclosureReport.reviewSections.some(
      (section) => section.reason === "protectedGoldBenchmarkDisclosureState.benchmarkMembership",
    ),
  );

  const incompletePolicyReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies: [
      {
        ...uxSimplificationPolicies[0],
        id: "ux-policy-submitted-incomplete",
        coveredRoles: [],
        protectedSplitEligibility: {},
      },
    ],
    uxSimplificationReviews,
    screenStatePayloads,
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(incompletePolicyReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(incompletePolicyReport.reviewSections.some((section) => section.reason === "coveredRoles"));
  assert.ok(incompletePolicyReport.reviewSections.some((section) => section.reason === "protectedSplitEligibility"));

  const incompletePolicyCoverageReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies: [
      {
        ...uxSimplificationPolicies[0],
        id: "ux-policy-submitted-incomplete-coverage",
        enabledSurfaces: uxSimplificationSurfaces.filter((surface) => surface !== "rater_data_governance"),
        requiredOneClickAccessibleControls: ["rubric_glossary"],
      },
    ],
    uxSimplificationReviews,
    screenStatePayloads,
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(incompletePolicyCoverageReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(
    incompletePolicyCoverageReport.reviewSections.some((section) => section.reason === "enabledSurfaces:rater_data_governance"),
  );
  assert.ok(
    incompletePolicyCoverageReport.reviewSections.some(
      (section) => section.reason === "requiredOneClickAccessibleControls:appendix_f_anchor_access,item_issue_report",
    ),
  );

  const incompleteReviewReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews: [
      {
        ...uxSimplificationReviews[0],
        id: "ux-review-submitted-incomplete",
        reviewedLocaleSet: [],
        promotionDecision: "hold",
      },
    ],
    screenStatePayloads,
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(incompleteReviewReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(incompleteReviewReport.reviewSections.some((section) => section.reason === "reviewedLocaleSet"));
  assert.ok(incompleteReviewReport.reviewSections.some((section) => section.reason === "promotionDecision"));

  const failedReadabilityReviewReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews: [
      {
        ...uxSimplificationReviews[0],
        id: "ux-review-submitted-failed-readability",
        accessibilityReadabilityLinkage: { accessibilityConformanceReportId: "accessibility-submitted", readabilityStatus: "failed" },
      },
    ],
    screenStatePayloads,
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(failedReadabilityReviewReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(
    failedReadabilityReviewReport.reviewSections.some(
      (section) => section.reason === "accessibilityReadabilityLinkage.readabilityStatus",
    ),
  );

  const missingFeatureParityReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads,
    screenFeatureParityChecks: screenFeatureParityChecks.filter((row) => row.screenId !== "adjudication"),
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(missingFeatureParityReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(missingFeatureParityReport.reviewSections.some((section) => section.reason === "ux_surface_missing_feature_parity_check"));

  const incompleteFeatureParityReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads,
    screenFeatureParityChecks: screenFeatureParityChecks.map((check) =>
      check.screenId === "rating"
        ? { ...check, featureParityChecklistResults: { no_feature_loss: "passed" } }
        : check,
    ),
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(incompleteFeatureParityReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(
    incompleteFeatureParityReport.reviewSections.some(
      (section) => section.reason === "featureParityChecklistResults.required_controls_reachable",
    ),
  );

  const incompleteCopyPreviewReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads,
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews.map((preview) =>
      preview.screenId === "rating" ? { ...preview, glossaryTooltipIds: ["centrality"] } : preview,
    ),
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(incompleteCopyPreviewReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(incompleteCopyPreviewReport.reviewSections.some((section) => section.reason === "glossaryTooltipIds:strength"));

  const missingCopyProvenanceReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads,
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews.map((preview) =>
      preview.screenId === "rating"
        ? { ...preview, raterInstructionRenderVersionId: "", releaseConfigManifestId: "" }
        : preview,
    ),
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(missingCopyProvenanceReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(missingCopyProvenanceReport.reviewSections.some((section) => section.reason === "raterInstructionRenderVersionId"));
  assert.ok(missingCopyProvenanceReport.reviewSections.some((section) => section.reason === "releaseConfigManifestId"));

  const unquarantinedProtectedCopyVariantReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads,
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews.map((preview) =>
      preview.screenId === "rating"
        ? { ...preview, protectedSplitVariantDisposition: "quarantined_sensitivity_snapshot", uiSensitivitySnapshotId: "" }
        : preview,
    ),
    rubricCopyTraceabilityMaps: traceabilityMaps,
  });

  assert.equal(unquarantinedProtectedCopyVariantReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(unquarantinedProtectedCopyVariantReport.reviewSections.some((section) => section.reason === "uiSensitivitySnapshotId"));

  const semanticDriftTraceabilityReport = buildUXSimplificationEvidenceReport("october-2026-demo", {
    uxSimplificationPolicies,
    uxSimplificationReviews,
    screenStatePayloads,
    screenFeatureParityChecks,
    simplifiedCopyPreviews: copyPreviews,
    rubricCopyTraceabilityMaps: traceabilityMaps.map((map) => ({
      ...map,
      id: "rubric-copy-traceability-map-semantic-drift",
      coveredScreenIds: map.coveredScreenIds.filter((screenId) => screenId !== "release_review"),
      clauseMap: { ...map.clauseMap, centrality: "appendix_f.unapproved_centrality_rewrite" },
      semanticDriftTestStatus: "failed",
    })),
  });

  assert.equal(semanticDriftTraceabilityReport.releaseUseStatus, "ux_simplification_review_required");
  assert.ok(semanticDriftTraceabilityReport.reviewSections.some((section) => section.reason === "semanticDriftTestStatus"));
  assert.ok(semanticDriftTraceabilityReport.reviewSections.some((section) => section.reason === "coveredScreenIds:release_review"));
  assert.ok(semanticDriftTraceabilityReport.reviewSections.some((section) => section.reason === "clauseMap.invalid:centrality"));
  assert.ok(
    semanticDriftTraceabilityReport.reviewSections.some(
      (section) => section.reason === "ux_surface_missing_rubric_copy_traceability_map",
    ),
  );
});

test("custom weighted loss uses low-clarity branch and ignores nullable non-clarity fields", () => {
  const loss = customWeightedLoss(
    {
      centrality: null,
      strength: null,
      correctness: null,
      clarity: 0.3,
      dead_weight: null,
      single_issue: null,
      overall: 0.2,
    },
    {
      centrality: null,
      strength: null,
      correctness: null,
      clarity: 0.7,
      dead_weight: null,
      single_issue: null,
      overall: 0.5,
    },
  );
  assert.equal(round(loss), 0.35);
});

test("custom weighted loss uses the exact full-rubric weights above clarity threshold", () => {
  const loss = customWeightedLoss(
    {
      centrality: 0.8,
      strength: 0.5,
      correctness: 0.9,
      clarity: 0.8,
      dead_weight: 0.1,
      single_issue: 1,
      overall: 0.6,
    },
    {
      centrality: 0.6,
      strength: 0.4,
      correctness: 0.7,
      clarity: 0.7,
      dead_weight: 0.3,
      single_issue: 0.8,
      overall: 0.4,
    },
  );
  assert.equal(round(loss), round(0.5 * 0.2 + 0.2 * 0.16 + 0.1 * 0.1 + 0.1 * 0.2 + 0.05 * 0.2 + 0.05 * 0.2));
});

test("score validation rejects booleans and out-of-range values", () => {
  assert.throws(
    () =>
      customWeightedLoss(
        {
          centrality: 0.8,
          strength: 0.5,
          correctness: 0.9,
          clarity: 0.8,
          dead_weight: 0.1,
          single_issue: 1,
          overall: 0.6,
        },
        {
          centrality: true,
          strength: 0.4,
          correctness: 0.7,
          clarity: 0.7,
          dead_weight: 0.3,
          single_issue: 0.8,
          overall: 0.4,
        },
      ),
    /finite non-boolean numeric/,
  );
  assert.throws(() => customWeightedLoss({ clarity: 0.8, overall: 0.6 }, { clarity: 0.8, overall: 1.2 }), /finite non-boolean numeric/);
});

test("weighted pairwise scoring excludes human ties and penalizes model ties by half margin", () => {
  const result = weightedPairwiseLossForPosition({ a: 0.8, b: 0.2, c: 0.2 }, { a: 0.1, b: 0.6, c: 0.6 });
  assert.equal(round(result.loss), 0.6);
  assert.deepEqual(result.coverage, {
    nPairsScored: 2,
    nHumanTiePairsExcluded: 1,
    nModelTiePairsScored: 0,
  });
  const modelTieResult = weightedPairwiseLossForPosition({ a: 0.8, b: 0.2 }, { a: 0.5, b: 0.5 });
  assert.equal(round(modelTieResult.loss), 0.3);
  assert.deepEqual(modelTieResult.coverage, {
    nPairsScored: 1,
    nHumanTiePairsExcluded: 0,
    nModelTiePairsScored: 1,
  });
});

test("pairwise scoring applies separate human-target and model-prediction tie tolerances", () => {
  const modelTied = weightedPairwiseLossForPosition(
    { a: 0.8, b: 0.7 },
    { a: 0.6, b: 0.57 },
    { humanTieTolerance: 0.01, modelTieTolerance: 0.04 },
  );
  assert.equal(round(modelTied.loss), 0.05);
  assert.equal(modelTied.coverage.nPairsScored, 1);
  assert.equal(modelTied.coverage.nModelTiePairsScored, 1);

  const modelOrdered = weightedPairwiseLossForPosition(
    { a: 0.8, b: 0.7 },
    { a: 0.6, b: 0.57 },
    { humanTieTolerance: 0.01, modelTieTolerance: 0.01 },
  );
  assert.equal(modelOrdered.loss, 0);
  assert.equal(modelOrdered.coverage.nModelTiePairsScored, 0);

  const humanExcluded = weightedPairwiseLossForPosition(
    { a: 0.8, b: 0.77 },
    { a: 0.2, b: 0.9 },
    { humanTieTolerance: 0.04, modelTieTolerance: 0 },
  );
  assert.equal(humanExcluded.loss, null);
  assert.deepEqual(humanExcluded.coverage, {
    nPairsScored: 0,
    nHumanTiePairsExcluded: 1,
    nModelTiePairsScored: 0,
  });
});

test("dataset pairwise averaging occurs within positions before averaging across positions", () => {
  const result = weightedPairwiseErrorRateByPosition(
    {
      p1: { a: 0.9, b: 0.4 },
      p2: { c: 0.9, d: 0.8, e: 0.1 },
    },
    {
      p1: { a: 0.1, b: 0.8 },
      p2: { c: 0.9, d: 0.8, e: 0.1 },
    },
  );
  assert.equal(round(result.loss), 0.25);
  assert.equal(result.coverage.nPositionsScored, 2);
  assert.equal(result.coverage.nPairsScored, 4);
});

test("pairwise scoring rejects missing or extra model positions and critiques", () => {
  assert.throws(
    () => weightedPairwiseLossForPosition({ critiqueA: 0.9, critiqueB: 0.2 }, { critiqueA: 0.8 }),
    /Human\/model critique sets must match: missing_from_model=critiqueB, extra_in_model=none/,
  );
  assert.throws(
    () => weightedPairwiseLossForPosition({ critiqueA: 0.9 }, { critiqueA: 0.8, critiqueB: 0.1 }),
    /Human\/model critique sets must match: missing_from_model=none, extra_in_model=critiqueB/,
  );
  assert.throws(
    () =>
      weightedPairwiseErrorRateByPosition(
        { positionA: { critiqueA: 0.9, critiqueB: 0.2 } },
        {
          positionA: { critiqueA: 0.8, critiqueB: 0.1 },
          positionB: { critiqueA: 0.7, critiqueB: 0.2 },
        },
      ),
    /Human\/model position sets must match: missing_from_model=none, extra_in_model=positionB/,
  );
  assert.throws(
    () =>
      weightedPairwiseErrorRateByPosition(
        {
          positionA: { critiqueA: 0.9, critiqueB: 0.2 },
          positionB: { critiqueA: 0.7, critiqueB: 0.3 },
        },
        { positionA: { critiqueA: 0.8, critiqueB: 0.1 } },
      ),
    /Human\/model position sets must match: missing_from_model=positionB, extra_in_model=none/,
  );
});

test("unweighted pairwise diagnostic remains separate from weighted headline metric", () => {
  const result = unweightedPairwiseErrorRateByPosition(
    { p1: { a: 0.9, b: 0.4 }, p2: { c: 0.2, d: 0.2 } },
    { p1: { a: 0.4, b: 0.5 }, p2: { c: 0.3, d: 0.8 } },
  );
  assert.equal(result.loss, 1);
  assert.equal(result.coverage.nPositionsExcludedNoNonTiedPairs, 1);
});

test("full-rubric utility cannot be computed from overall-only output", () => {
  assert.throws(() => defaultFullRubricUtility({ overall: 0.6, clarity: 0.9 }), /missing required rating fields/);
});

test("evaluation runs preserve immutable prompt artifacts and output schemas", () => {
  assert.equal(fullRubricEvaluationRun.promptArtifact.id, "project-full-rubric-v1");
  assert.match(fullRubricEvaluationRun.promptArtifact.promptBody, /POSITION and CRITIQUE/);
  assert.equal(fullRubricEvaluationRun.renderedPromptChecksum, "sha256:project-full-rubric-v1:rendered");
  assert.equal(fullRubricEvaluationRun.acceptedOutputSchema.required.length, 7);
  assert.equal(overallOnlyEvaluationRun.promptArtifact.id, "appendix-g-overall-v1");
  assert.equal(overallOnlyEvaluationRun.predictions[0].promptTemplateId, "appendix-g-overall-v1");
  assert.equal(overallOnlyEvaluationRun.predictions[0].requestedModelAlias, "appendix-g-demo");
  assert.equal(overallOnlyEvaluationRun.acceptedOutputSchema.forbiddenImputedFields.includes("centrality"), true);
  assert.equal(overallOnlyEvaluationRun.protectedPromptExampleCheck.hiddenBenchmarkExamplesExcluded, true);
});

test("prompt track separation report keeps Appendix-G baseline distinct from project prompt tracks", () => {
  const report = buildPromptTrackSeparationReport("release-test", [fullRubricEvaluationRun, overallOnlyEvaluationRun], critiqueGenerationRuns);
  assert.equal(report.counts.promptTrackRows, 4);
  assert.equal(report.counts.evaluationPromptTrackRows, 2);
  assert.equal(report.counts.generationPromptTrackRows, 2);
  assert.equal(report.counts.appendixGExactRows, 1);
  assert.equal(report.counts.projectExtensionRows, 3);
  assert.equal(report.counts.protectedExampleViolationCount, 0);
  assert.equal(report.counts.promptExampleRows, 0);
  assert.equal(report.releaseUseStatus, "appendix_g_baseline_separated_from_project_prompt_tracks");
  assert.deepEqual(report.byTrackKind, {
    critique_generation: 1,
    model_evaluation: 2,
    model_judge_screening: 1,
  });
  const appendixG = report.appendixGBaselineRows[0];
  assert.equal(appendixG.promptArtifactId, "appendix-g-overall-v1");
  assert.equal(appendixG.sourceComparable, true);
  assert.equal(appendixG.hiddenBenchmarkExamplesExcluded, true);
  const judge = report.rows.find((row) => row.trackKind === "model_judge_screening");
  assert.equal(judge.promptArtifactId, "candidate-judge-v2");
  assert.equal(judge.diagnosticOnly, true);
  assert.equal(judge.scoresVisibleToInitialRaters, false);
});

test("LMCA source-example anchors are public training exposure only", () => {
  const report = buildLmcaSourceExampleAnchorReport("release-test", lmcaSourceExampleAnchors);
  assert.equal(report.counts.anchorCount, 4);
  assert.equal(report.counts.suiteVersionCount, 1);
  assert.equal(report.counts.coveredFamilyCount, 3);
  assert.equal(report.counts.missingFamilyCount, 0);
  assert.equal(report.counts.exposureViolationCount, 0);
  assert.equal(report.counts.humanCeilingEligibleCount, 0);
  assert.equal(report.counts.promptRegressionEligibleCount, 4);
  assert.equal(report.counts.certificationExposureEligibleCount, 4);
  assert.equal(report.releaseUseStatus, "source_anchor_suite_public_training_only");
  assert.deepEqual(report.byFamily, {
    approval_voting_midrange: 1,
    is_ought_gap: 2,
    table4_model_failure: 1,
  });

  const contaminatedReport = buildLmcaSourceExampleAnchorReport("release-test", [
    { ...lmcaSourceExampleAnchors[0], hiddenBenchmarkEligible: true },
    ...lmcaSourceExampleAnchors.slice(1),
  ]);
  assert.equal(contaminatedReport.counts.exposureViolationCount, 1);
  assert.equal(contaminatedReport.releaseUseStatus, "source_anchor_protection_review_required");
});

test("submitted source-anchor examples extend calibration and prompt-regression evidence", () => {
  const report = buildLmcaSourceExampleAnchorReport("release-test", lmcaSourceExampleAnchors, {
    sourceAnchorExamples: [
      {
        id: "source-anchor-submitted",
        suiteVersion: "lmca-public-source-anchors-2026-10-submitted",
        sourceExampleFamily: "table4_model_failure",
        publicSourceReference: "Submitted public Table 4 model-failure anchor",
        itemId: "lmca-public::table4-model-failure-submitted",
        positionClusterId: "lmca-public-table4-model-failure",
        split: "public_training_qa_anchor",
        exposurePolicy: "public_training_qa_only",
        allowedUse: ["documentation", "training", "certification", "prompt_regression"],
        excludedFromProtectedEvaluation: true,
        targetDimensions: ["centrality", "strength", "overall"],
      },
    ],
  });
  assert.equal(report.counts.anchorCount, 5);
  assert.equal(report.counts.submittedAnchorCount, 1);
  assert.equal(report.counts.submittedExposureViolationCount, 0);
  assert.equal(report.counts.submittedUsePolicyViolationCount, 0);
  assert.equal(report.counts.promptRegressionEligibleCount, 5);
  assert.equal(report.counts.certificationExposureEligibleCount, 5);
  const submittedAnchorRow = report.anchorRows.find((row) => row.anchorId === "source-anchor-submitted");
  assert.equal(submittedAnchorRow.anchorSource, "submitted_workflow_source_anchor_example");
  assert.deepEqual(submittedAnchorRow.missingAllowedUse, []);
  assert.equal(submittedAnchorRow.submittedUsePolicyViolation, false);
  assert.equal(report.releaseUseStatus, "source_anchor_suite_public_training_only");

  const protectedReport = buildLmcaSourceExampleAnchorReport("release-test", lmcaSourceExampleAnchors, {
    sourceAnchorExamples: [
      {
        id: "source-anchor-protected",
        sourceExampleFamily: "table4_model_failure",
        itemId: "lmca-public::protected-source-anchor",
        positionClusterId: "lmca-public-protected-source-anchor",
        split: "hidden_benchmark",
        exposurePolicy: "hidden_benchmark_diagnostic",
        protectedSplitExclusionStatus: false,
      },
    ],
  });
  assert.equal(protectedReport.counts.submittedAnchorCount, 1);
  assert.equal(protectedReport.counts.submittedExposureViolationCount, 1);
  assert.equal(protectedReport.releaseUseStatus, "source_anchor_protection_review_required");

  const underdeclaredReport = buildLmcaSourceExampleAnchorReport("release-test", lmcaSourceExampleAnchors, {
    sourceAnchorExamples: [
      {
        id: "source-anchor-missing-release-uses",
        suiteVersion: "lmca-public-source-anchors-2026-10-submitted",
        sourceExampleFamily: "table4_model_failure",
        publicSourceReference: "Submitted public Table 4 model-failure anchor without release-use declarations",
        itemId: "lmca-public::table4-model-failure-underdeclared",
        positionClusterId: "lmca-public-table4-model-failure",
        split: "public_training_qa_anchor",
        exposurePolicy: "public_training_qa_only",
        allowedUse: ["training"],
        excludedFromProtectedEvaluation: true,
        expectedLabelSummary: "over_crediting_generic_or_vague_critique",
        targetDimensions: ["overall"],
      },
    ],
  });
  assert.equal(underdeclaredReport.counts.submittedAnchorCount, 1);
  assert.equal(underdeclaredReport.counts.submittedExposureViolationCount, 0);
  assert.equal(underdeclaredReport.counts.submittedUsePolicyViolationCount, 1);
  const underdeclaredRow = underdeclaredReport.submittedUsePolicyViolationRows[0];
  assert.equal(underdeclaredRow.anchorId, "source-anchor-missing-release-uses");
  assert.deepEqual(underdeclaredRow.missingAllowedUse, ["certification", "prompt_regression"]);
  assert.equal(underdeclaredRow.promptRegressionEligible, false);
  assert.equal(underdeclaredRow.certificationExposureEligible, false);
  assert.equal(underdeclaredReport.releaseUseStatus, "source_anchor_protection_review_required");
});

test("derived utility normalizes dead_weight as a badness field", () => {
  const utility = defaultFullRubricUtility({
    centrality: 1,
    strength: 1,
    correctness: 1,
    clarity: 1,
    dead_weight: 1,
    single_issue: 1,
    overall: 1,
  });
  assert.equal(round(utility), 0.95);
});

test("custom-loss dataset coverage distinguishes low-clarity and full-rubric items", () => {
  const result = customWeightedLossForDataset(
    {
      item1: { clarity: 0.3, overall: 0.2 },
      item2: {
        centrality: 0.8,
        strength: 0.5,
        correctness: 0.9,
        clarity: 0.8,
        dead_weight: 0.1,
        single_issue: 1,
        overall: 0.6,
      },
    },
    {
      item1: { clarity: 0.2, overall: 0.3 },
      item2: {
        centrality: 0.8,
        strength: 0.5,
        correctness: 0.9,
        clarity: 0.8,
        dead_weight: 0.1,
        single_issue: 1,
        overall: 0.6,
      },
    },
  );
  assert.deepEqual(result.coverage, { nItemsScored: 2, nLowClarityBranchItems: 1, nFullRubricItems: 1 });
});

test("pairwise snapshots freeze comparison denominators, text versions, and margin bins", () => {
  const snapshot = buildPairwiseComparisonSnapshot("snap", "labels", "adjudicated", {
    p1: { a: 0.9, b: 0.8, c: 0.5 },
    p2: { d: 0.5 },
  }, {
    humanTargetScoreSource: "labels:adjudicated:weightedMeanScores.overall",
    positionTextVersionIdsByPosition: { p1: ["ptv-p1-v1"], p2: ["ptv-p2-v1"] },
    critiqueTextVersionIdsByPosition: { p1: { a: ["ctv-a-v1"], b: ["ctv-b-v1"], c: ["ctv-c-v1"] }, p2: { d: ["ctv-d-v1"] } },
    itemTextVersionIdsByItem: {
      "p1::a": ["ptv-p1-v1", "ctv-a-v1"],
      "p1::b": ["ptv-p1-v1", "ctv-b-v1"],
      "p1::c": ["ptv-p1-v1", "ctv-c-v1"],
      "p2::d": ["ptv-p2-v1", "ctv-d-v1"],
    },
  });
  assert.equal(snapshot.nonTiedEdges.length, 3);
  assert.deepEqual(snapshot.excludedNoPairPositions, ["p2"]);
  assert.equal(snapshot.humanTargetScoreSource, "labels:adjudicated:weightedMeanScores.overall");
  assert.equal(snapshot.targetScoreField, "overall");
  assert.deepEqual(snapshot.positionTextVersionIdsByPosition.p1, ["ptv-p1-v1"]);
  assert.deepEqual(snapshot.nonTiedEdges[0].positionTextVersionIds, ["ptv-p1-v1"]);
  assert.deepEqual(snapshot.nonTiedEdges[0].itemATextVersionIds, ["ptv-p1-v1", "ctv-a-v1"]);
  assert.deepEqual(snapshot.itemTextVersionIds.sort(), ["ctv-a-v1", "ctv-b-v1", "ctv-c-v1", "ctv-d-v1", "ptv-p1-v1", "ptv-p2-v1"]);
  assert.equal(snapshot.exclusions.humanTieEdgeCount, 0);
  assert.deepEqual(snapshot.exclusions.noPairPositionIds, ["p2"]);
  assert.deepEqual(snapshot.exclusions.missingTextVersionItemIds, []);
  assert.deepEqual(pairwiseMarginDistribution(snapshot).bins, { low: 1, medium: 1, high: 1 });
});

test("pairwise snapshots use human tie tolerance for frozen edges while preserving model tolerance", () => {
  const snapshot = buildPairwiseComparisonSnapshot(
    "snap-role-specific-ties",
    "labels",
    "adjudicated",
    { p1: { a: 0.9, b: 0.86, c: 0.5 } },
    { humanTieTolerance: 0.05, modelTieTolerance: 0.02 },
  );
  assert.equal(snapshot.tieTolerance, 0.05);
  assert.equal(snapshot.humanTieTolerance, 0.05);
  assert.equal(snapshot.modelTieTolerance, 0.02);
  assert.equal(snapshot.nonTiedEdges.length, 2);
  assert.equal(snapshot.excludedHumanTieEdges, 1);
  assert.equal(snapshot.scoreRoundingPolicy, "declared_tolerance");
});

test("blind rating view strips protected metadata", () => {
  const view = createBlindRatingView(assignments[0], positions, critiques);
  assert.match(view.positionText, /cautious AI lab/);
  assert.match(view.critiqueText, /selectively undermines/);
  assert.ok(view.hiddenMetadata.includes("source metadata"));
  assert.ok(view.hiddenMetadata.includes("benchmark status"));
  assert.ok(view.hiddenMetadata.includes("model-judge scores"));
  assert.ok(view.hiddenMetadata.includes("intake screening notes"));
  assert.ok(view.hiddenMetadata.includes("peer ratings"));
  assert.equal("adminOnlyAmbiguityNotes" in view, false);
  assert.equal("conceptualScope" in view, false);
});

test("revisions append without mutating original ratings", () => {
  const original = seedRatings[0];
  const revision = appendRatingRevision(original, {
    id: "revision-test",
    scores: { ...original.scores, overall: 0.66 },
    revisionReasonCode: "object_level_reconsideration",
    revisionComment: "Adjusted after rereading the target claim.",
  });
  assert.equal(original.kind, "blind_initial");
  assert.equal(original.parentRatingId, undefined);
  assert.equal(revision.kind, "revision");
  assert.equal(revision.parentRatingId, original.id);
  assert.equal(revision.scores.overall, 0.66);

  const report = buildRatingRevisionAuditReport("release-test", [...seedRatings, revision], positions);
  assert.equal(report.counts.revisionRows, 1);
  assert.equal(report.counts.incompleteRevisionMetadataRows, 0);
  assert.equal(report.counts.expertCheckRows, 1);
  assert.equal(report.counts.denominatorInflationExcludedRows, 2);
  assert.equal(report.revisionRows[0].metadataStatus, "revision_metadata_complete");
  assert.equal(report.revisionRows[0].originalPreserved, true);
  assert.equal(report.releaseUseStatus, "revision_and_check_denominators_separated");

  const missingMetadataReport = buildRatingRevisionAuditReport(
    "release-test",
    [...seedRatings, { ...revision, id: "revision-missing-comment", revisionComment: "" }],
    positions,
  );
  assert.equal(missingMetadataReport.counts.incompleteRevisionMetadataRows, 1);
  assert.equal(missingMetadataReport.releaseUseStatus, "revision_metadata_review_required");

  const submittedRecordReport = buildRatingRevisionAuditReport("release-test", seedRatings, positions, {
    revisionRecords: [
      {
        id: "revision-record-submitted",
        ratingIdPrior: original.id,
        ratingIdNew: "revision-submitted-child",
        reasonCode: "human_only_self_check",
        revisionComment: "Recorded an object-level correction without mutating the original rating.",
        discussionThreadId: "discussion-thread-submitted",
      },
    ],
  });
  assert.equal(submittedRecordReport.counts.submittedRevisionRecordCount, 1);
  assert.equal(submittedRecordReport.counts.submittedRevisionRecordReviewCount, 0);
  assert.equal(submittedRecordReport.submittedRevisionRecordEvidence.rows[0].originalPreserved, true);
  assert.equal(submittedRecordReport.submittedRevisionRecordEvidence.rows[0].recordStatus, "submitted_revision_record_complete");
  assert.equal(submittedRecordReport.submittedRevisionRecordEvidence.releaseUseStatus, "submitted_revision_records_complete");
});

test("workflow routes low clarity and verification cases to review", () => {
  assert.ok(detectEscalations(seedRatings.filter((rating) => rating.critiqueId === "crit-voting-style")).includes("low clarity workflow required"));
  assert.ok(detectEscalations(seedRatings.filter((rating) => rating.critiqueId === "crit-voting-bullet")).includes("correctness verification record required"));
});

test("rubric issue flag report separates allocation ambiguity from product disagreement", () => {
  const report = buildRubricIssueFlagReport("release-test", seedRatings, adjudicationMemos, positions);
  assert.equal(report.counts.ratingRowCount, 7);
  assert.equal(report.counts.flaggedRatingRowCount, 5);
  assert.equal(report.counts.issueFlagRowCount, 10);
  assert.equal(report.counts.strengthCentralityAllocationAmbiguityCount, 1);
  assert.equal(report.counts.correctnessWeightingIssueCount, 1);
  assert.equal(report.counts.clarityAfterEffortIssueCount, 1);
  assert.equal(report.counts.midRangeStrengthUncertaintyCount, 1);
  assert.equal(report.counts.obfuscatedArgumentRiskCount, 1);
  assert.equal(report.counts.obfuscationNoteRows, 1);
  assert.equal(report.counts.obfuscationNoteMissingRows, 0);
  assert.equal(report.counts.observedIssueFlagFamilyCount, 10);
  assert.equal(report.counts.coveredIssueFlagCount, 10);
  assert.equal(report.counts.missingCoverageCount, 0);
  assert.equal(report.counts.productLevelDisagreementItemCount, 0);
  assert.equal(report.releaseUseStatus, "rubric_issue_flags_separated_from_product_disagreement");
  assert.equal(report.policy.requiredRaterFlags.includes("correctnessNotAssessableDueToClarity"), true);
  assert.equal(report.policy.requiredRaterFlags.includes("midRangeStrengthUncertainty"), true);
  assert.equal(report.policy.requiredRaterFlags.includes("vagueGoodObjectionGesture"), true);
  assert.equal(report.policy.requiredRaterFlags.includes("languageTranslationArtifactConcern"), true);
  assert.equal(report.flagCoverageRows.find((row) => row.flag === "languageTranslationArtifactConcern").issueType, "language_translation_artifact_fairness");
  assert.equal(report.counts.byFlag.contentFreePseudoSubstance, 1);
  assert.equal(report.counts.byFlag.languageTranslationArtifactConcern, 0);
  assert.equal(report.obfuscationRows[0].noteStatus, "obfuscation_note_recorded");
  assert.equal(report.counts.byFlag.midRangeStrengthUncertainty, 1);
  assert.equal(report.counts.byFlag.backgroundKnowledgeDependence, 1);
  assert.equal(report.flagCoverageRows.find((row) => row.flag === "inBetweenSingleIssueSideIssue").coverageStatus, "not_observed_in_seed");

  const divergentProductRating = {
    ...seedRatings.find((rating) => rating.id === "rating-ai-base-rate-a"),
    id: "rating-ai-base-rate-product-spread",
    raterId: "rater-product-spread",
    scores: {
      centrality: 0.08,
      strength: 0.1,
      correctness: 0.85,
      clarity: 0.9,
      dead_weight: 0.04,
      single_issue: 0.9,
      overall: 0.1,
    },
    flags: {},
  };
  const spreadReport = buildRubricIssueFlagReport("release-test", [...seedRatings, divergentProductRating], adjudicationMemos, positions);
  assert.equal(spreadReport.counts.productLevelDisagreementItemCount, 1);
  assert.equal(spreadReport.counts.strengthCentralityAllocationAmbiguityCount, 1);
  assert.equal(spreadReport.releaseUseStatus, "rubric_issue_flags_separated_with_product_disagreement");

  const missingObfuscationNoteRating = {
    ...seedRatings.find((rating) => rating.flags?.obfuscatedArgumentRisk),
    id: "rating-obfuscation-note-missing",
    obfuscationNote: "",
  };
  const missingNoteReport = buildRubricIssueFlagReport("release-test", [missingObfuscationNoteRating], adjudicationMemos, positions);
  assert.equal(missingNoteReport.counts.obfuscationNoteMissingRows, 1);
  assert.equal(missingNoteReport.releaseUseStatus, "rubric_issue_obfuscation_notes_incomplete");
});

test("rating effort quality report routes rushed and interrupted rows before sensitive use", () => {
  const rushedHiddenRating = {
    ...seedRatings.find((rating) => rating.positionId === "pos-mind"),
    id: "rating-hidden-rushed",
    activeSeconds: 120,
    idleGapSeconds: 5,
    interruptionCount: 0,
  };
  const interruptedValidationRating = {
    ...seedRatings.find((rating) => rating.critiqueId === "crit-voting-bullet"),
    id: "rating-validation-interrupted",
    activeSeconds: 760,
    idleGapSeconds: 20,
    interruptionCount: 1,
  };
  const report = buildRatingEffortQualityReport("release-test", [...seedRatings, rushedHiddenRating, interruptedValidationRating], positions, critiques);
  assert.equal(report.telemetryCoverage.totalRows, seedRatings.length + 2);
  assert.equal(report.telemetryCoverage.missingTelemetryRows, 0);
  assert.equal(report.byExpectedEffortBand.short_pair_5_to_15_minutes, 1);
  assert.equal(report.byExpectedEffortBand.medium_pair_10_to_25_minutes, 7);
  assert.equal(report.byExpectedEffortBand.long_pair_20_to_45_minutes, 1);
  const rushed = report.qaRoutedRatings.find((row) => row.ratingId === "rating-hidden-rushed");
  const interrupted = report.qaRoutedRatings.find((row) => row.ratingId === "rating-validation-interrupted");
  assert.ok(rushed.routeReasons.includes("length_adjusted_active_time_below_expected"));
  assert.ok(rushed.protectedUseBlocks.includes("hidden_benchmark"));
  assert.ok(interrupted.routeReasons.includes("interruption_recorded"));
  assert.ok(interrupted.protectedUseBlocks.includes("validation"));
  assert.equal(report.protectedUseBlockSummary.hiddenBenchmarkBlockedCount, 1);
  assert.equal(report.protectedUseBlockSummary.validationBlockedCount, 2);
  assert.equal(report.releaseUseStatus, "qa_routing_required_before_sensitive_use");
});

test("rating effort quality report blocks validation queue aliases before sensitive use", () => {
  const validationAssignmentTypeRating = {
    ...seedRatings.find((rating) => rating.id === "rating-ai-base-rate-a"),
    id: "rating-validation-assignment-type-interrupted",
    assignmentId: "assignment-validation-assignment-type",
    activeSeconds: 760,
    idleGapSeconds: 20,
    interruptionCount: 1,
  };
  const protectedValidationQueueRating = {
    ...seedRatings.find((rating) => rating.id === "rating-ai-base-rate-b"),
    id: "rating-protected-validation-queue-interrupted",
    assignmentId: "assignment-protected-validation-queue",
    activeSeconds: 760,
    idleGapSeconds: 20,
    interruptionCount: 1,
  };
  const assignmentList = [
    ...assignments,
    {
      id: "assignment-validation-assignment-type",
      assignmentType: "validation",
      positionId: "pos-ai-prior",
      critiqueId: "crit-ai-base-rate",
    },
    {
      id: "assignment-protected-validation-queue",
      queueType: "protected_validation",
      positionId: "pos-ai-prior",
      critiqueId: "crit-ai-base-rate",
    },
  ];
  const report = buildRatingEffortQualityReport(
    "release-test",
    [validationAssignmentTypeRating, protectedValidationQueueRating],
    positions,
    critiques,
    assignmentList,
  );

  const validationAssignmentTypeRow = report.qaRoutedRatings.find((row) => row.ratingId === "rating-validation-assignment-type-interrupted");
  const protectedValidationQueueRow = report.qaRoutedRatings.find((row) => row.ratingId === "rating-protected-validation-queue-interrupted");
  assert.equal(validationAssignmentTypeRow.queueType, "validation");
  assert.equal(protectedValidationQueueRow.queueType, "protected_validation");
  assert.ok(validationAssignmentTypeRow.protectedUseBlocks.includes("validation"));
  assert.ok(protectedValidationQueueRow.protectedUseBlocks.includes("validation"));
  assert.equal(report.protectedUseBlockSummary.validationBlockedCount, 2);
  assert.equal(report.protectedUseBlockSummary.hiddenBenchmarkBlockedCount, 0);
});

test("rating effort quality report accepts submitted QA reviews for routed rows", () => {
  const report = buildRatingEffortQualityReport("release-test", seedRatings, positions, critiques, assignments, {
    ratingEffortQaReviews: [
      {
        id: "rating-effort-qa-voting-style",
        ratingId: "rating-voting-style-a",
        itemKeys: ["pos-voting::crit-voting-style"],
        routeReasonsReviewed: ["length_adjusted_active_time_below_expected"],
        reviewerId: "expert-qa",
        reviewerRole: "expert",
        reviewDecision: "exclude_from_sensitive_denominators",
        sensitiveUseDecision: "excluded_from_validation_denominator",
        labelMutationProhibited: true,
        independentRaterDenominatorUnchanged: true,
        timestamp: "2026-10-01T00:00:00.000Z",
      },
    ],
  });
  const reviewed = report.qaRoutedRatings.find((row) => row.ratingId === "rating-voting-style-a");
  assert.equal(report.releaseUseStatus, "rating_effort_qa_review_complete");
  assert.equal(report.counts.qaRoutedRatingCount, 1);
  assert.equal(report.counts.qaReviewExcludedCount, 1);
  assert.equal(report.counts.qaReviewMissingCount, 0);
  assert.equal(report.protectedUseBlockSummary.validationBlockedCount, 0);
  assert.equal(reviewed.ratingEffortQaReviewId, "rating-effort-qa-voting-style");
  assert.equal(reviewed.qaStatus, "qa_review_excluded_from_sensitive_denominators");
  assert.equal(reviewed.sensitiveUseDisposition, "excluded_from_sensitive_denominators");
});

test("rating effort quality report keeps unsafe QA reviews blocked", () => {
  const report = buildRatingEffortQualityReport("release-test", seedRatings, positions, critiques, assignments, {
    ratingEffortQaReviews: [
      {
        id: "rating-effort-qa-unsafe",
        ratingId: "rating-voting-style-a",
        itemKeys: ["pos-voting::crit-voting-style"],
        routeReasonsReviewed: ["wrong_reason"],
        reviewerId: "expert-qa",
        reviewerRole: "expert",
        reviewDecision: "cleared_for_sensitive_use",
        sensitiveUseDecision: "cleared",
        labelMutationProhibited: false,
        independentRaterDenominatorUnchanged: true,
        timestamp: "2026-10-01T00:00:00.000Z",
      },
    ],
  });
  assert.equal(report.releaseUseStatus, "qa_routing_required_before_sensitive_use");
  assert.equal(report.counts.invalidQaReviewCount, 1);
  assert.ok(report.reviewSections[0].reviewReasons.includes("labelMutationProhibited"));
  assert.ok(report.reviewSections[0].reviewReasons.includes("routeReasonsReviewed:length_adjusted_active_time_below_expected"));
});

test("post-lock source/style audit reports identifiability without feeding scores", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-source-style-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildPostLockSourceStyleAuditReport("release-test", postLockSourceStyleAudits, seedRatings, positions, critiques, snapshot);
  assert.equal(report.counts.totalAudits, 3);
  assert.equal(report.counts.postLockAudits, 3);
  assert.equal(report.counts.preLockViolationCount, 0);
  assert.equal(report.counts.scoringUseViolationCount, 0);
  assert.equal(report.accuracySummary.sourceGuess.accuracy, 1);
  assert.equal(report.accuracySummary.highConfidenceSourceGuess.correctCount, 2);
  assert.equal(report.qualityCorrelationDiagnostic.status, "source_guess_quality_association_observed");
  assert.equal(report.residualUnblindingRisk.disclosureRequired, true);
  assert.equal(report.releaseUseStatus, "residual_unblinding_disclosure_required");
  assert.equal(report.diagnosticOnly, true);

  const preLockReport = buildPostLockSourceStyleAuditReport(
    "release-test",
    [{ ...postLockSourceStyleAudits[0], id: "source-style-audit-prelock", collectedAt: "2026-06-11T12:55:00.000Z" }],
    seedRatings,
    positions,
    critiques,
    snapshot,
  );
  assert.equal(preLockReport.counts.preLockViolationCount, 1);
  assert.equal(preLockReport.releaseUseStatus, "source_style_audit_policy_violation");
});

test("admin tag blinding audit publishes risk distributions without pre-lock exposure", () => {
  const manifest = buildCorpusCompositionManifest("release-test", positions, critiques, seedRatings);
  assert.equal(manifest.adminTagRisk.taggedPositionCount, 3);
  assert.equal(manifest.adminTagRisk.tagCount, 3);
  assert.equal(manifest.sourceDetailCoverage.rowCount, 3);
  assert.equal(manifest.sourceDetailCoverage.completeRows, 3);
  assert.equal(manifest.sourceDetailCoverage.status, "source_detail_metadata_declared");
  assert.equal(manifest.sourceDetailCoverage.bySourceLanguage.en, 3);
  assert.equal(manifest.sourceDetailCoverage.byTranslationRoute.none_original_english, 3);
  assert.equal(manifest.sourceDetailCoverage.bySourceSubsource.none, 3);
  assert.equal(manifest.sourceDetailCoverage.bySourceDomainSuitability.suitable_conceptual, 2);
  assert.equal(manifest.sourceDetailCoverage.bySourceDomainSuitability.mixed_conceptual_empirical, 1);
  assert.equal(manifest.sourceDetailCoverage.bySourceDomainConcentration.voting_methods, 1);
  assert.equal(manifest.sourceDetailCoverage.byLsatDerivedStatus.not_lsat_derived, 3);
  const votingSourceDetail = manifest.sourceDetailRows.find((row) => row.positionId === "pos-voting");
  assert.equal(votingSourceDetail.sourceTaskFormat, "coursework prompt adaptation");
  assert.equal(votingSourceDetail.translationRoute, "none_original_english");
  assert.equal(votingSourceDetail.sourceDomainSuitability, "mixed_conceptual_empirical");
  assert.equal(votingSourceDetail.sourceDomainConcentration, "voting_methods");
  assert.equal(votingSourceDetail.lsatDerived, false);
  assert.equal(manifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "DebateBench").lmcaCount, 18);
  assert.equal(manifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "VivesDebate").translationRoute, "machine_translated_catalan_to_english");
  assert.equal(manifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "VivesDebate").sourceDomainConcentration, "gestational_surrogacy_legalization");
  assert.equal(manifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "LSAT-derived").sourceDomainSuitability, "usually_not_suitable_domains_unless_explicitly_labeled");
  assert.equal(manifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "LSAT-derived").lsatDerived, true);
  assert.deepEqual(manifest.adminTagRisk.byVisibilityClass, {
    safe_topic_routing: 1,
    possible_confounder: 1,
    known_rating_confounder: 1,
  });
  assert.equal(manifest.adminTagRisk.byConfounderRiskClass.known_rating_confounder, 1);
  assert.equal(manifest.adminTagRisk.visibilityHistoryRows.every((row) => row.raterVisibleBeforeInitialLock === false), true);

  const report = buildAdminTagBlindingReport("release-test", positions);
  assert.equal(report.counts.taggedPositionCount, 3);
  assert.equal(report.counts.confounderRiskTagCount, 2);
  assert.equal(report.counts.preLockVisibilityViolationCount, 0);
  assert.equal(report.counts.knownRatingConfounderTagCount, 1);
  assert.equal(report.releaseUseStatus, "admin_tag_confounder_risk_disclosed_hidden_before_lock");
  assert.equal(report.visibilityHistoryRows.find((row) => row.positionId === "pos-mind").confounderRiskClass, "known_rating_confounder");

  const violationReport = buildAdminTagBlindingReport("release-test", [
    {
      ...positions[0],
      adminTags: [{ ...positions[0].adminTags[0], raterVisibleBeforeInitialLock: true }],
    },
  ]);
  assert.equal(violationReport.counts.preLockVisibilityViolationCount, 1);
  assert.equal(violationReport.releaseUseStatus, "admin_tag_blinding_policy_violation");
});

test("correctness verification report links VerificationRecords and blocks unresolved required checks", () => {
  const report = buildCorrectnessVerificationReport("release-test", seedRatings, positions, critiques, verificationRecords);
  assert.equal(report.requiredItemCount, 1);
  assert.equal(report.linkedRecordCount, 3);
  assert.equal(report.linkedEvidenceArtifactCount, 4);
  assert.equal(report.unresolvedRequiredItems.length, 1);
  assert.equal(report.releaseBlockingItems[0].critiqueId, "crit-voting-bullet");
  assert.equal(report.releaseUseStatus, "verification_review_required_before_benchmark_or_public_release");
  assert.equal(report.byVerificationStatus.unresolved, 1);
  assert.equal(report.byVerificationStatus.not_practicable, 1);
  assert.equal(report.verificationEvidenceArtifactRows.every((row) => row.snapshotContentHash.startsWith("sha256:")), true);
  assert.equal(report.verificationRows.find((row) => row.itemId === "pos-voting::crit-voting-bullet").linkedEvidenceArtifactCount, 2);
  assert.equal(report.verificationEvidenceProvenanceSummary.totalArtifactCount, 4);
  assert.equal(report.verificationEvidenceProvenanceSummary.completeArtifactCount, 4);
  assert.equal(report.verificationEvidenceProvenanceSummary.reviewRequiredArtifactCount, 0);
  assert.equal(report.verificationEvidenceProvenanceSummary.sourceBlindEvidenceCount, 1);
  assert.equal(report.verificationEvidenceProvenanceSummary.postLockNonblindEvidenceCount, 3);
  assert.equal(report.verificationEvidenceProvenanceSummary.shownToOriginalRaterEvidenceCount, 0);
  assert.equal(report.verificationEvidenceProvenanceSummary.shownToCheckerEvidenceCount, 4);
  assert.equal(report.verificationEvidenceProvenanceSummary.shownToAdjudicatorEvidenceCount, 3);
  assert.equal(report.verificationEvidenceProvenanceSummary.byEvidenceType.internal_expert_note, 3);
  assert.equal(report.verificationEvidenceProvenanceSummary.byEvidenceType.no_external_material_required, 1);
  assert.equal(report.verificationEvidenceProvenanceSummary.bySourceExposureStatus.post_lock_source_visible, 3);
  assert.equal(report.verificationEvidenceProvenanceSummary.releaseUseStatus, "post_lock_nonblind_verification_evidence_disclosed");

  const resolvedRecords = verificationRecords.map((record) =>
    record.id === "verify-voting-bullet-strategy"
      ? { ...record, id: "verify-voting-bullet-resolved", verificationStatus: "verified", verificationResult: "Expert verified the logical incentive claim.", confidence: 0.85 }
      : record,
  );
  const resolvedReport = buildCorrectnessVerificationReport("release-test", seedRatings, positions, critiques, resolvedRecords);
  assert.equal(resolvedReport.releaseBlockingItems.length, 0);
  assert.equal(resolvedReport.byEvidenceProvenanceStatus.verification_evidence_artifact_complete >= 1, true);
  assert.equal(resolvedReport.verificationEvidenceProvenanceSummary.reviewSections.length, 0);
  assert.equal(resolvedReport.verificationEvidenceProvenanceSummary.postLockNonblindArtifactIds.includes("verification-evidence-verify-voting-bullet-resolved-1"), true);
  assert.equal(resolvedReport.releaseUseStatus, "pass");
});

test("release report applies submitted adjudication and verification workflow artifacts", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-submitted-adjudication-verification",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      verificationRecords: [
        {
          id: "verification-submitted-voting-bullet",
          itemId: "pos-voting::crit-voting-bullet",
          evidenceArtifactIds: ["verification-evidence-submitted-voting-bullet"],
          claimChecked: "Approval voting strategic incentives were verified by expert review.",
          verificationType: "logical",
          verificationMaterials: ["Expert reviewed standard approval-voting incentive structure after initial rating lock."],
          verifierId: "expert-workflow",
          verifierRole: "expert",
          verificationStatus: "verified",
          verificationResult: "Expert review resolved the required conceptual incentive check.",
          confidence: 0.86,
          exposureStatus: "post_initial_lock_adjudication",
          timestamp: "2026-06-12T12:00:00.000Z",
          createdAt: "2026-06-12T12:00:00.000Z",
        },
      ],
      verificationEvidenceArtifacts: [
        {
          id: "verification-evidence-submitted-voting-bullet",
          verificationRecordId: "verification-submitted-voting-bullet",
          itemId: "pos-voting::crit-voting-bullet",
          claimRef: "Approval voting strategic incentives were verified by expert review.",
          evidenceType: "internal_expert_note",
          citation: "Expert voting-theory review note, post-lock source-blind snapshot.",
          snapshotContentHash: "sha256:verification-evidence-submitted-voting-bullet",
          retrievedAt: "2026-06-12T11:59:00.000Z",
          sourceExposureStatus: "source_blind",
          protectedContentExposureStatus: "protected_content_absent",
          modelAssistanceStatus: "none",
          nonblindEvidenceFlag: false,
          sourceAssistedFlag: false,
          sourceIdentifiabilityFlag: false,
          protectedContentFlag: false,
          shownToOriginalRater: false,
          shownToChecker: true,
          shownToAdjudicator: true,
          blindingImpactStatus: "source_blind_release_safe",
          evidenceUsePolicy: "post-lock correctness evidence only; not visible before blind initial rating and not a direct score override",
          createdBy: "expert-workflow",
          createdAt: "2026-06-12T11:59:00.000Z",
        },
      ],
      adjudicationMemos: [
        {
          id: "adjudication-memo-submitted-voting-bullet",
          discussionThreadId: "discussion-thread-submitted-voting-bullet",
          itemId: "pos-voting::crit-voting-bullet",
          contestedInterpretation: "Whether the bullet-voting objection is conceptual or empirical.",
          plausibleInterpretationsConsidered: ["conceptual_incentive_objection", "empirical_behavior_claim"],
          worstPlausibleInterpretationConsidered: "empirical_behavior_claim",
          interpretationPlausibilityNotes: "Both conceptual and empirical readings are plausible before adjudication.",
          multiInterpretationCoverageSummary: "Memo covers both readings and selects the conceptual incentive objection.",
          critiqueRefutesInterpretations: ["conceptual_incentive_objection"],
          adversarialPlausibilityWeightingDecision: "Treat the conceptual incentive objection as the verified release-relevant reading.",
          adversarialInterpretationWeightingSummary: "Empirical-behavior reading is recorded but not used as the release-critical target.",
          pricedInAssessment: "The position did not price in this strategic incentive objection.",
          backgroundKnowledgeAssessment: "Expert voting-theory knowledge was used after initial lock only.",
          bottomLineDependenceSummary: "Final resolution does not depend on accepting the position's bottom line.",
          clearlyUnsatisfactoryImprecisionSummary: "No decisive imprecision defect after adjudication.",
          contentFreeDeadWeightSummary: "No content-free dead weight in the selected interpretation.",
          obfuscationSummary: "No obfuscated fallacy in the conceptual incentive reading.",
          strengthCentralityAllocationSummary: "Centrality remains high while strength is tied to the verified incentive claim.",
          midRangeStrengthUncertaintySummary: "Residual strength uncertainty is retained.",
          correctnessWeightingSummary: "Correctness weight follows the linked verification record.",
          correctnessVerificationStatus: "verified",
          correctnessVerificationSummary: "Linked verification record resolves the incentive check.",
          clarityAfterEffortSummary: "Clear enough after adjudicator effort.",
          disagreementTaxonomyCodes: ["background_knowledge_dependence"],
          postDiscussionResolutionStatus: "expert_verified_conceptual_incentive_check",
          unresolvedDisagreementClass: "expert_verified_conceptual_incentive_check",
          maxFinalRaterSpread: 0.12,
          splitDecision: "internal_validation",
          adjudicatorIds: ["expert-workflow"],
          rubricVersionConsidered: "lmca-seven-dim-v1",
          timestamp: "2026-06-12T12:10:00.000Z",
          createdAt: "2026-06-12T12:10:00.000Z",
        },
      ],
    },
  );

  const verificationRow = report.correctnessVerification.verificationRows.find((row) => row.itemId === "pos-voting::crit-voting-bullet");
  assert.equal(report.correctnessVerification.linkedRecordCount, verificationRecords.length + 1);
  assert.equal(verificationRow.latestRecordId, "verification-submitted-voting-bullet");
  assert.equal(verificationRow.latestRecordSource, "submitted_workflow_verification_record");
  assert.equal(verificationRow.verificationStatus, "verified");
  assert.equal(verificationRow.confidence, 0.86);
  assert.deepEqual(verificationRow.verificationEvidenceArtifactIds, ["verification-evidence-submitted-voting-bullet"]);
  assert.equal(verificationRow.verificationEvidenceProvenanceStatus, "verification_evidence_artifact_complete");
  assert.equal(verificationRow.evidenceShownToOriginalRaterFlag, false);
  assert.equal(verificationRow.evidenceShownToCheckerFlag, true);
  assert.equal(verificationRow.evidenceShownToAdjudicatorFlag, true);
  assert.deepEqual(verificationRow.verificationEvidenceTypes, ["internal_expert_note"]);
  assert.equal(verificationRow.timestamp, "2026-06-12T12:00:00.000Z");
  assert.equal(report.correctnessVerification.submittedEvidenceArtifactCount, 1);
  assert.equal(report.correctnessVerification.verificationEvidenceArtifactRows.at(-1).sourceExposureStatus, "source_blind");
  assert.equal(report.correctnessVerification.verificationEvidenceArtifactRows.at(-1).evidenceType, "internal_expert_note");
  assert.equal(report.correctnessVerification.verificationEvidenceArtifactRows.at(-1).shownToOriginalRater, false);
  assert.equal(report.correctnessVerification.verificationEvidenceArtifactRows.at(-1).shownToChecker, true);
  assert.equal(report.correctnessVerification.verificationEvidenceArtifactRows.at(-1).shownToAdjudicator, true);
  assert.equal(report.correctnessVerification.verificationEvidenceProvenanceSummary.totalArtifactCount, 6);
  assert.equal(report.correctnessVerification.verificationEvidenceProvenanceSummary.sourceBlindEvidenceCount, 2);
  assert.equal(report.correctnessVerification.verificationEvidenceProvenanceSummary.postLockNonblindEvidenceCount, 4);
  assert.equal(report.correctnessVerification.verificationEvidenceProvenanceSummary.shownToOriginalRaterEvidenceCount, 0);
  assert.equal(report.correctnessVerification.verificationEvidenceProvenanceSummary.shownToCheckerEvidenceCount, 6);
  assert.equal(report.correctnessVerification.verificationEvidenceProvenanceSummary.shownToAdjudicatorEvidenceCount, 5);
  assert.equal(report.correctnessVerification.verificationEvidenceProvenanceSummary.byEvidenceType.internal_expert_note, 5);
  assert.equal(report.correctnessVerification.verificationEvidenceProvenanceSummary.byEvidenceType.no_external_material_required, 1);
  assert.equal(
    report.correctnessVerification.verificationEvidenceProvenanceSummary.completeArtifactIds.includes("verification-evidence-submitted-voting-bullet"),
    true,
  );
  assert.equal(report.correctnessVerification.verificationEvidenceProvenanceSummary.releaseUseStatus, "post_lock_nonblind_verification_evidence_disclosed");
  assert.equal(report.correctnessVerification.releaseUseStatus, "pass");

  const audienceReviewReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      verificationRecords: [
        {
          id: "verification-submitted-audience-review",
          itemId: "pos-voting::crit-voting-bullet",
          evidenceArtifactIds: ["verification-evidence-submitted-audience-review"],
          claimChecked: "Approval voting strategic incentives were verified by expert review.",
          verificationType: "logical",
          verificationMaterials: ["Expert reviewed standard approval-voting incentive structure after initial rating lock."],
          verifierId: "expert-workflow",
          verifierRole: "expert",
          verificationStatus: "verified",
          verificationResult: "Expert review resolved the required conceptual incentive check.",
          confidence: 0.86,
          exposureStatus: "post_initial_lock_adjudication",
          timestamp: "2026-06-12T12:20:00.000Z",
          createdAt: "2026-06-12T12:20:00.000Z",
        },
      ],
      verificationEvidenceArtifacts: [
        {
          id: "verification-evidence-submitted-audience-review",
          verificationRecordId: "verification-submitted-audience-review",
          itemId: "pos-voting::crit-voting-bullet",
          claimRef: "Approval voting strategic incentives were verified by expert review.",
          evidenceType: "internal_expert_note",
          citation: "Expert voting-theory review note, post-lock source-blind snapshot.",
          snapshotContentHash: "sha256:verification-evidence-submitted-audience-review",
          retrievedAt: "2026-06-12T12:19:00.000Z",
          sourceExposureStatus: "source_blind",
          protectedContentExposureStatus: "protected_content_absent",
          modelAssistanceStatus: "none",
          nonblindEvidenceFlag: false,
          sourceAssistedFlag: false,
          sourceIdentifiabilityFlag: false,
          protectedContentFlag: false,
          shownToOriginalRater: "no",
          shownToChecker: true,
          blindingImpactStatus: "source_blind_release_safe",
          evidenceUsePolicy: "post-lock correctness evidence only; not visible before blind initial rating and not a direct score override",
          createdBy: "expert-workflow",
          createdAt: "2026-06-12T12:19:00.000Z",
        },
      ],
    },
  );
  const audienceReviewArtifact = audienceReviewReport.correctnessVerification.verificationEvidenceArtifactRows.find(
    (row) => row.id === "verification-evidence-submitted-audience-review",
  );
  assert.equal(audienceReviewArtifact.reviewReasons.includes("shownToOriginalRater"), true);
  assert.equal(audienceReviewArtifact.reviewReasons.includes("shownToAdjudicator"), true);
  assert.equal(
    audienceReviewReport.correctnessVerification.verificationEvidenceProvenanceSummary.reviewRequiredArtifactIds.includes(
      "verification-evidence-submitted-audience-review",
    ),
    true,
  );

  const memoRow = report.adjudicationMemoAudit.memoRows.find((row) => row.memoId === "adjudication-memo-submitted-voting-bullet");
  assert.equal(report.adjudicationMemoAudit.counts.memoCount, adjudicationMemos.length + 1);
  assert.equal(memoRow.memoSource, "submitted_workflow_adjudication_memo");
  assert.deepEqual(memoRow.plausibleInterpretations, ["conceptual_incentive_objection", "empirical_behavior_claim"]);
  assert.deepEqual(memoRow.disagreementTaxonomy, ["background_knowledge_dependence"]);
  assert.equal(memoRow.correctnessVerificationStatus, "verified");
  assert.equal(memoRow.rubricVersionConsidered, "lmca-seven-dim-v1");
  assert.equal(memoRow.maxFinalRaterSpread, 0.12);

  const issueTaxonomy = report.rubricIssueFlags.memoTaxonomyRows.find((row) => row.flag === "backgroundKnowledgeDependence");
  assert.equal(issueTaxonomy.memoIds.includes("adjudication-memo-submitted-voting-bullet"), true);

  const disagreementRow = report.postDiscussionDisagreement.itemRows.find((row) => row.itemId === "pos-voting::crit-voting-bullet");
  assert.equal(disagreementRow.adjudicationMemoIds.includes("adjudication-memo-submitted-voting-bullet"), true);
  assert.deepEqual(disagreementRow.unresolvedDisagreementClasses, ["expert_verified_conceptual_incentive_check"]);

  const trancheMemoRow = report.validationTrancheReport.randomSentinel.unresolvedPostDiscussionRows.find(
    (row) => row.itemId === "pos-voting::crit-voting-bullet",
  );
  assert.equal(trancheMemoRow.unresolvedDisagreementClass, "expert_verified_conceptual_incentive_check");
  assert.deepEqual(trancheMemoRow.disagreementTaxonomy, ["background_knowledge_dependence"]);
});

test("release report derives adjudication finalization evidence from submitted workflow actions", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-adjudication-finalization-evidence",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      adjudicationMemos: [
        {
          id: "adjudication-memo-finalized-core",
          discussionThreadId: "discussion-thread-finalized-core",
          itemId: "pos-voting::crit-voting-bullet",
          contestedInterpretation: "Whether the voting critique attacks a central strategic claim.",
          plausibleInterpretationsConsidered: ["central_strategy_attack", "side_style_attack"],
          worstPlausibleInterpretationConsidered: "side_style_attack",
          critiqueRefutesInterpretations: ["central_strategy_attack"],
          adversarialPlausibilityWeightingDecision: "Use the central strategic reading for release.",
          disagreementTaxonomyCodes: ["strength_centrality_allocation"],
          postDiscussionResolutionStatus: "resolved_for_release_candidate",
          unresolvedDisagreementClass: "resolved_for_release_candidate",
          splitDecision: "internal_validation",
          adjudicatorIds: ["expert-finalizer"],
          timestamp: "2026-06-12T12:15:00.000Z",
        },
      ],
      adjudicationFinalizations: [
        {
          id: "adjudication-finalization-complete-core",
          adjudicationId: "adjudication-core",
          memoId: "adjudication-memo-finalized-core",
          finalizationStatus: "finalized_for_release_candidate",
          finalizedBy: "expert-finalizer",
          timestamp: "2026-06-12T12:20:00.000Z",
        },
        {
          id: "adjudication-finalization-review-core",
          adjudicationId: "adjudication-core",
          memoId: "missing-memo-core",
          finalizationStatus: "draft",
          finalizedBy: "other-expert",
        },
      ],
    },
  );

  assert.equal(report.adjudicationFinalizationEvidence.counts.submittedFinalizationCount, 2);
  assert.equal(report.adjudicationFinalizationEvidence.counts.completeFinalizationCount, 1);
  assert.equal(report.adjudicationFinalizationEvidence.counts.reviewRequiredCount, 1);
  assert.equal(report.adjudicationFinalizationEvidence.releaseUseStatus, "adjudication_finalization_evidence_review_required");
  const completeRow = report.adjudicationFinalizationEvidence.rows.find((row) => row.id === "adjudication-finalization-complete-core");
  assert.equal(completeRow.status, "adjudication_finalization_evidence_complete");
  assert.equal(completeRow.memoFound, true);
  assert.equal(completeRow.finalizedByMemoAdjudicator, true);
  const reviewRow = report.adjudicationFinalizationEvidence.rows.find((row) => row.id === "adjudication-finalization-review-core");
  assert.equal(reviewRow.reviewReasons.includes("matching_adjudication_memo"), true);
  assert.equal(reviewRow.reviewReasons.includes("finalizationStatus:not_finalized_for_release_candidate"), true);
  assert.equal(reviewRow.reviewReasons.includes("timestamp"), true);
});

test("release report builder materializes default label snapshot evidence", () => {
  const report = buildOctoberReleaseReport();

  assert.equal(report.releaseId, "october-2026-demo");
  assert.equal(report.metricEligibility.labelSnapshotId, "snapshot-october-2026-demo");
  assert.equal(report.metricEligibility.targetLabelVersion, "initial_mean");
  assert.ok(report.metricEligibility.customLossEligibleItems.length > 0);
  assert.equal(report.humanScoreDistribution.labelSnapshotId, "snapshot-october-2026-demo");
  assert.equal(report.labelSnapshotReliability.labelSnapshotId, "snapshot-october-2026-demo");
  assert.equal(report.trainingExport.labelSnapshotId, "snapshot-october-2026-demo");
});

test("same-position context report freezes sibling exposure and model-context parity", () => {
  const report = buildSamePositionContextReport("release-test", seedRatings, positions, critiques, ratingContextSnapshots, assignments);
  assert.equal(report.counts.totalRatings, seedRatings.length);
  assert.equal(report.counts.ratingsWithFrozenContext, seedRatings.length);
  assert.equal(report.counts.missingContextSnapshotCount, 0);
  assert.equal(report.counts.currentCritiqueVisibilityViolationCount, 0);
  assert.equal(report.counts.contextSensitiveRatingCount, 3);
  assert.equal(report.counts.contextSensitiveModelContextMissingCount, 3);
  assert.equal(report.counts.counterbalancedReleaseCriticalRatingCount, 3);
  assert.equal(report.counts.absentSiblingDisclosureCount, 3);
  assert.equal(report.byPolicy.target_only, 4);
  assert.equal(report.byPolicy.counterbalanced_sibling_context, 3);
  assert.equal(report.modelPromptSiblingContextPolicyId, "model-prompt-sibling-context-policy-release-test");
  assert.equal(report.modelPromptSiblingContextPolicyEvidence.releaseUseStatus, "seed_model_prompt_sibling_context_policy_active");
  assert.equal(report.counts.submittedModelPromptSiblingContextPolicyRows, 0);
  assert.equal(report.releaseUseStatus, "rating_context_sensitive_model_prompt_matching_required");
  const votingStyle = report.contextRows.find((row) => row.ratingId === "rating-voting-style-a");
  assert.equal(votingStyle.modelPromptSiblingContextPolicyId, "model-prompt-sibling-context-policy-release-test");
  assert.deepEqual(votingStyle.priorSiblingCritiqueIds, ["crit-voting-bullet"]);
  assert.deepEqual(votingStyle.absentSiblingCritiqueIds, []);
  assert.deepEqual(votingStyle.modelContextPredictionIds, []);
  assert.equal(votingStyle.modelContextParityEvidenceStatus, "model_prompt_context_parity_evidence_missing");
  assert.equal(votingStyle.cleanModelPromptRequirement, modelPromptSiblingContextRules.contextSensitiveClaim);
});

test("same-position context report accepts matching model prediction context snapshots", () => {
  const report = buildSamePositionContextReport("release-test", seedRatings, positions, critiques, ratingContextSnapshots, assignments, {
    modelPromptSiblingContextPolicies: [modelPromptSiblingContextPolicy("model-prompt-sibling-context-policy-submitted")],
    modelEvaluationPredictions: [...fullRubricEvaluationRun.predictions, ...overallOnlyEvaluationRun.predictions],
  });
  const votingStyle = report.contextRows.find((row) => row.ratingId === "rating-voting-style-a");

  assert.equal(report.releaseUseStatus, "same_position_context_parity_preserved");
  assert.equal(report.modelPromptSiblingContextPolicyId, "model-prompt-sibling-context-policy-submitted");
  assert.equal(report.modelPromptSiblingContextPolicyEvidence.releaseUseStatus, "submitted_model_prompt_sibling_context_policy_active");
  assert.equal(report.counts.submittedModelPromptSiblingContextPolicyRows, 1);
  assert.equal(report.counts.contextSensitiveModelContextMatchedCount, 3);
  assert.equal(report.counts.contextSensitiveModelContextMissingCount, 0);
  assert.equal(report.byModelContextParityEvidenceStatus.model_prompt_context_matches_frozen_rating_context, 3);
  assert.ok(votingStyle.modelContextPredictionIds.includes("pred-voting-style"));
  assert.ok(votingStyle.modelContextPredictionIds.includes("pred-overall-voting-style"));
});

test("same-position context report reviews drifted model prompt sibling-context policies", () => {
  const report = buildSamePositionContextReport("release-test", seedRatings, positions, critiques, ratingContextSnapshots, assignments, {
    modelPromptSiblingContextPolicies: [
      {
        ...modelPromptSiblingContextPolicy("model-prompt-sibling-context-policy-drifted"),
        allowedComparisonModes: ["target_only_restricted_snapshot"],
      },
    ],
    modelEvaluationPredictions: [...fullRubricEvaluationRun.predictions, ...overallOnlyEvaluationRun.predictions],
  });

  assert.equal(report.releaseUseStatus, "model_prompt_sibling_context_policy_review_required");
  assert.equal(report.modelPromptSiblingContextPolicyEvidence.releaseUseStatus, "submitted_model_prompt_sibling_context_policy_review_required");
  assert.equal(report.counts.modelPromptSiblingContextPolicyReviewRows, 1);
  assert.ok(
    report.modelPromptSiblingContextPolicyEvidence.reviewRows[0].reviewReasons.includes("allowedComparisonModes"),
  );
});

test("release report same-position context consumes submitted workflow assignments", () => {
  const workflowRating = {
    ...seedRatings[0],
    id: "rating-workflow-same-position-context",
    assignmentId: "assignment-workflow-same-position-context",
    ratingContextSnapshotId: "rc-target-only-1",
  };
  const snapshot = createLabelSnapshot(
    "snapshot-workflow-same-position-context",
    "release-test",
    [...seedRatings, workflowRating],
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    [...seedRatings, workflowRating],
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      workflowAssignments: [
        {
          id: "assignment-workflow-same-position-context",
          assignmentType: "validation_subset",
          positionId: "pos-ai-prior",
          critiqueId: "crit-ai-base-rate",
        },
      ],
    },
  );
  const workflowContextRow = report.samePositionContext.contextRows.find((row) => row.ratingId === "rating-workflow-same-position-context");

  assert.equal(workflowContextRow.queueType, "validation_subset");
  assert.equal(workflowContextRow.releaseCritical, true);
  assert.equal(workflowContextRow.orderPolicyStatus, "fixed_or_target_only_order_disclosed");
});

test("same-position context report treats protected workflow queue aliases as release-critical", () => {
  const aliasCases = [
    ["rating-context-validation-assignment-type", { assignmentType: "validation" }, "validation"],
    ["rating-context-protected-validation-queue", { queueType: "protected_validation" }, "protected_validation"],
    ["rating-context-hidden-benchmark-review-queue", { queueType: "hidden_benchmark_review" }, "hidden_benchmark_review"],
  ];
  const aliasRatings = aliasCases.map(([ratingId]) => ({
    ...seedRatings[0],
    id: ratingId,
    assignmentId: `assignment-${ratingId}`,
    ratingContextSnapshotId: "rc-target-only-1",
  }));
  const aliasAssignments = aliasCases.map(([ratingId, queueFields]) => ({
    id: `assignment-${ratingId}`,
    ...queueFields,
    positionId: "pos-ai-prior",
    critiqueId: "crit-ai-base-rate",
  }));
  const report = buildSamePositionContextReport("release-test", aliasRatings, positions, critiques, ratingContextSnapshots, aliasAssignments);

  assert.equal(report.counts.releaseCriticalRatingCount, aliasCases.length);
  assert.equal(report.byOrderPolicyStatus.fixed_or_target_only_order_disclosed, aliasCases.length);
  for (const [ratingId, , expectedQueueType] of aliasCases) {
    const row = report.contextRows.find((contextRow) => contextRow.ratingId === ratingId);
    assert.equal(row.queueType, expectedQueueType);
    assert.equal(row.releaseCritical, true);
    assert.equal(row.orderPolicyStatus, "fixed_or_target_only_order_disclosed");
  }
});

test("aggregation excludes low-clarity provisional non-clarity fields", () => {
  const label = aggregateRatings("pos-voting", "crit-voting-style", seedRatings);
  assert.equal(label.weightedMeanScores.clarity, 0.32);
  assert.equal(label.weightedMeanScores.centrality, null);
  assert.equal(label.dimensionCoverageCounts.centrality.excluded, 1);
  assert.equal(label.centXStrWeightedMean, null);
});

test("label snapshots keep denominator categories separate", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "initial_only",
  );
  assert.equal(snapshot.denominatorCounts.blindInitialRatings, 6);
  assert.equal(snapshot.denominatorCounts.expertChecks, 1);
  assert.equal(snapshot.denominatorCounts.totalRows, seedRatings.length);
  assert.equal(snapshot.reliabilityWeightModel.modelFamily, "uniform_equal_rater_weight");
  assert.equal(snapshot.reliabilityWeightModel.fitDataProvenance.protectedRatingsUsedForFit, 0);
  assert.equal(snapshot.reliabilityWeightModel.fitDataProvenance.observedProtectedRatingRows, 4);
  assert.equal(snapshot.reliabilityWeightModel.includedRatingProvenance.includedRatingKinds.blind_initial, 6);
  assert.equal(snapshot.reliabilityWeightModel.raterWeights.length, 4);
  assert.equal(snapshot.reliabilityWeightModel.effectiveContribution.maxSingleRaterContributionShare, 1);
  assert.deepEqual(snapshot.reliabilityWeightModel.effectiveContribution.independentExpertReviewRequiredItemIds, ["pos-voting::crit-voting-style"]);
  assert.equal(snapshot.reliabilityWeightModel.sensitivitySummary.maxOverallMeanMedianDelta, 0);
  assert.equal(snapshot.reliabilityWeightModel.releaseUseStatus, "uniform_weights_frozen_with_sensitivity_report");
});

test("public and training exports exclude hidden benchmark and protected validation", () => {
  const publicManifest = createExportManifest("public", "release-test", positions, critiques);
  const trainingManifest = createExportManifest("training", "release-test", positions, critiques);
  assert.equal(publicManifest.hiddenBenchmarkExcluded, true);
  assert.ok(publicManifest.excludedSplits.includes("hidden_benchmark"));
  assert.deepEqual(trainingManifest.includedSplits, ["public_train"]);
});

test("training export preserves uncertainty and excludes protected splits", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-training-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const trainingExport = buildTrainingExport("release-test", snapshot, positions, critiques, seedRatings, ratingContextSnapshots, {
    trainingExportUncertaintyPolicies: [trainingExportUncertaintyPolicy("training-export-uncertainty-policy-release-test-submitted")],
    volunteerDataWithdrawalRequests: [
      {
        id: "withdrawal-training-export-rater-a",
        raterId: "rater-a",
        requestType: "future_training_export_exclusion",
        affectedDataCategories: ["private_learning_dashboard", "future_training_export"],
        actionTaken: "future_training_export_exclusion_recorded",
        identifiableTelemetryRestricted: true,
        publicAttributionRemoved: true,
        privateLearningDashboardDeleted: true,
        futureTrainingExportExcluded: true,
        frozenSnapshotImpact: "already_frozen_deidentified_label_snapshots_preserved",
        requesterNotificationStatus: "notified",
        timestamp: "2026-10-01T00:03:00.000Z",
      },
    ],
  });
  assert.equal(trainingExport.protectedSplitPolicy.hiddenBenchmarkExcluded, true);
  assert.equal(trainingExport.protectedSplitPolicy.internalValidationExcluded, true);
  assert.deepEqual(trainingExport.protectedSplitPolicy.includedSplits, ["public_train"]);
  assert.equal(trainingExport.protectedSplitPolicy.positionClusterIsolationStatus, "pass");
  assert.equal(trainingExport.counts.pointwiseExamples, 2);
  assert.equal(trainingExport.counts.pairwisePreferenceExamples, 1);
  assert.equal(trainingExport.counts.futureTrainingExportExcludedRaters, 1);
  assert.equal(trainingExport.counts.futureTrainingExportExcludedIncludedRatings, 2);
  assert.equal(trainingExport.counts.futureTrainingExportExcludedRationales, 2);
  assert.deepEqual(trainingExport.futureTrainingExportExcludedRaterIds, ["rater-a"]);
  assert.deepEqual(trainingExport.volunteerWithdrawalExclusionRequestIds, ["withdrawal-training-export-rater-a"]);
  assert.equal(trainingExport.volunteerWithdrawalExclusionManifest.denominatorMutationAllowed, false);
  assert.equal(trainingExport.volunteerWithdrawalExclusionManifest.frozenLabelSnapshotDisposition, "preserved_without_recomputation");
  assert.equal(
    trainingExport.volunteerWithdrawalExclusionManifest.status,
    "future_training_export_withdrawal_exclusions_applied",
  );
  assert.deepEqual(trainingExport.volunteerWithdrawalExclusionManifest.affectedItemIds, [
    "pos-ai-prior::crit-ai-base-rate",
    "pos-ai-prior::crit-ai-generic",
  ]);
  assert.equal(trainingExport.trainingExportUncertaintyPolicyEvidence.releaseUseStatus, "submitted_training_export_uncertainty_policy_active");
  assert.equal(trainingExport.trainingExportUncertaintyPolicyId, "training-export-uncertainty-policy-release-test-submitted");
  assert.deepEqual(trainingExport.uncertaintyThresholdsApplied, trainingExportUncertaintyThresholds);
  assert.deepEqual(trainingExport.labelUncertaintyDownweightingRules, trainingExportDownweightRules);
  assert.equal(trainingExport.counts.uncertaintyDownweightedPointwiseExamples, 1);
  assert.equal(trainingExport.counts.uncertaintyDownweightedPairwisePreferences, 1);
  assert.equal(trainingExport.positionBalancedWeighting.status, "position_balanced_training_weights_complete");
  assert.deepEqual(trainingExport.positionBalancedWeighting.pointwiseRowsByPosition, { "pos-ai-prior": 2 });
  assert.deepEqual(trainingExport.positionBalancedWeighting.pairwiseRowsByPosition, { "pos-ai-prior": 1 });
  assert.deepEqual(trainingExport.positionBalancedWeighting.pointwiseWeightSumByPosition, { "pos-ai-prior": 1 });
  assert.equal(trainingExport.pointwiseExamples.every((example) => example.split === "public_train"), true);
  assert.equal(trainingExport.pointwiseExamples[0].labelStatus, "initial_only");
  assert.equal(trainingExport.pointwiseExamples[0].ratingContextSnapshotId, "rc-target-only-1");
  assert.equal(trainingExport.pointwiseExamples[0].positionExampleCount, 2);
  assert.equal(trainingExport.pointwiseExamples[0].positionBalancedWeight, 0.5);
  assert.equal(trainingExport.pointwiseExamples[0].normalizedPositionBalancedWeight, 0.5);
  assert.equal(trainingExport.pointwiseExamples[0].trainingExportUncertaintyPolicyId, "training-export-uncertainty-policy-release-test-submitted");
  assert.equal(trainingExport.pointwiseExamples[0].uncertaintyWeight, 1);
  assert.equal(trainingExport.pointwiseExamples[0].trainingWeight, 0.5);
  assert.deepEqual(trainingExport.pointwiseExamples[0].uncertaintyDownweightReasons, []);
  const downweightedPointwise = trainingExport.pointwiseExamples.find((example) => example.uncertaintyWeight < 1);
  assert.equal(downweightedPointwise.critiqueId, "crit-ai-generic");
  assert.equal(downweightedPointwise.trainingWeight, 0.25);
  assert.deepEqual(downweightedPointwise.uncertaintyDownweightReasons, ["uncertainty_flagged_label", "thin_rater_coverage"]);
  assert.equal(
    trainingExport.pointwiseExamples.some((example) =>
      (example.rationales ?? []).some((rationale) => rationale.ratingId === "rating-ai-base-rate-a" || rationale.ratingId === "rating-ai-generic-a")
    ),
    false,
  );
  assert.equal(
    trainingExport.pointwiseExamples.some((example) =>
      (example.rationales ?? []).some((rationale) => rationale.ratingId === "rating-ai-base-rate-b")
    ),
    true,
  );
  assert.equal(trainingExport.ratingContextSnapshots[0].humanModelParityStatus, "matchable_target_only");
  assert.equal(trainingExport.pairwisePreferenceExamples[0].preferredCritiqueId, "crit-ai-base-rate");
  assert.equal(trainingExport.pairwisePreferenceExamples[0].preferenceWeight, 0.46);
  assert.equal(trainingExport.pairwisePreferenceExamples[0].pairwiseMargin, 0.46);
  assert.equal(trainingExport.pairwisePreferenceExamples[0].trainingExportUncertaintyPolicyId, "training-export-uncertainty-policy-release-test-submitted");
  assert.equal(trainingExport.pairwisePreferenceExamples[0].uncertaintyWeight, 0.5);
  assert.deepEqual(trainingExport.pairwisePreferenceExamples[0].uncertaintyDownweightReasons, [
    "critiqueB_uncertainty_flagged_label",
    "critiqueB_thin_rater_coverage",
  ]);
  assert.equal(trainingExport.pairwisePreferenceExamples[0].uncertaintyAdjustedPreferenceWeight, 0.23);
  assert.equal(trainingExport.pairwisePreferenceExamples[0].positionBalancedPairWeight, 1);
  assert.equal(trainingExport.pairwisePreferenceExamples[0].positionBalancedPreferenceWeight, 0.23);
  assert.equal(trainingExport.pairwisePreferenceExamples[0].labelMetadataByCritique["crit-ai-base-rate"].labelStatus, "initial_only");
  assert.equal(trainingExport.pairwisePreferenceExamples[0].labelMetadataByCritique["crit-ai-base-rate"].raterCount, 2);
  assert.equal(trainingExport.pairwisePreferenceExamples[0].labelMetadataByCritique["crit-ai-base-rate"].expertCount, 2);
  assert.equal(trainingExport.pairwisePreferenceExamples[0].labelMetadataByCritique["crit-ai-base-rate"].lowClarityBranch, false);
  assert.equal(trainingExport.pairwisePreferenceExamples[0].labelMetadataByCritique["crit-ai-base-rate"].spreadPostDiscussion, 0.04);
  assert.equal(trainingExport.pairwiseComparisonSnapshot.humanTargetScoreSource, "snapshot-training-test:initial_mean:weightedMeanScores.overall");
  assert.deepEqual(trainingExport.pairwiseComparisonSnapshot.positionTextVersionIdsByPosition["pos-ai-prior"], ["ptv-ai-prior-v1"]);
  assert.deepEqual(
    trainingExport.pairwiseComparisonSnapshot.critiqueTextVersionIdsByPosition["pos-ai-prior"]["crit-ai-base-rate"],
    ["ctv-ai-base-rate-v1"],
  );
  assert.deepEqual(
    trainingExport.pairwiseComparisonSnapshot.nonTiedEdges[0].itemATextVersionIds,
    ["ptv-ai-prior-v1", "ctv-ai-base-rate-v1"],
  );
  assert.deepEqual(trainingExport.pairwiseComparisonSnapshot.exclusions.missingTextVersionItemIds, []);
  assert.equal(trainingExport.optimizedSurrogateObjective.lmcaEvaluationMetricsSeparate, true);
  assert.equal(trainingExport.scalarRewardTargets[0].positionBalancedWeight, 0.5);
  assert.equal(trainingExport.scalarRewardTargets[0].trainingExportUncertaintyPolicyId, "training-export-uncertainty-policy-release-test-submitted");
  assert.equal(trainingExport.scalarRewardTargets[0].uncertaintyWeight, 1);
  assert.equal(trainingExport.scalarRewardTargets[0].trainingWeight, 0.5);
  assert.match(trainingExport.scalarRewardTargets[0].rewardPolicy, /not_personal_agreement/);

  const driftedPolicyExport = buildTrainingExport("release-test", snapshot, positions, critiques, seedRatings, ratingContextSnapshots, {
    trainingExportUncertaintyPolicies: [
      {
        ...trainingExportUncertaintyPolicy("training-export-uncertainty-policy-drifted"),
        thresholds: { ...trainingExportUncertaintyThresholds, uncertainLabelWeight: 0.25 },
      },
    ],
  });
  assert.equal(driftedPolicyExport.trainingExportUncertaintyPolicyEvidence.releaseUseStatus, "submitted_training_export_uncertainty_policy_review_required");
  assert.equal(driftedPolicyExport.trainingExportUncertaintyPolicyId, "training-export-uncertainty-policy-release-test");
  assert.equal(driftedPolicyExport.trainingExportUncertaintyPolicyEvidence.reviewRows[0].reviewReasons.includes("thresholds"), true);
});

test("submitted reproducibility artifacts drive release training export evidence", () => {
  const releaseId = "repro-artifact-test";
  const snapshot = createLabelSnapshot(
    "snapshot-repro-artifact-test",
    releaseId,
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      itemTextVersions: [
        {
          id: "ctv-submitted-training",
          itemType: "critique",
          itemId: "crit-ai-base-rate",
          canonicalTextHash: "sha256:submitted-training:canonical",
          raterVisibleRenderedTextHash: "sha256:submitted-training:rater-rendered",
          modelVisibleRenderedTextHash: "sha256:submitted-training:model-rendered",
        },
      ],
      ratingContextSnapshots: [
        {
          id: "rc-submitted-training",
          positionId: "pos-ai-prior",
          targetCritiqueId: "crit-ai-base-rate",
          contextPolicy: "target_only",
          siblingCritiqueIdsShown: ["crit-ai-base-rate"],
          siblingItemTextVersionIds: ["ctv-submitted-training"],
          frozenAt: "2026-10-01T00:00:00.000Z",
        },
      ],
      pairwiseComparisonSnapshots: [
        {
          id: "pairwise-submitted-training",
          labelSnapshotId: snapshot.id,
          targetLabelVersion: snapshot.targetLabelVersion,
          positionIds: ["pos-ai-prior"],
          critiqueIdsByPosition: { "pos-ai-prior": ["crit-ai-base-rate", "crit-ai-generic"] },
          itemTextVersionIds: ["ctv-submitted-training", "ctv-ai-generic-v1"],
          nonTiedComparisonEdges: [["crit-ai-base-rate", "crit-ai-generic"]],
          tiePolicy: "exclude_human_ties_model_tie_half_margin",
          frozenAt: "2026-10-01T00:00:00.000Z",
        },
      ],
    },
  );
  const submittedTextExample = report.trainingExport.pointwiseExamples.find((example) => example.critiqueId === "crit-ai-base-rate");
  assert.equal(submittedTextExample.critiqueTextVersionId, "ctv-submitted-training");
  assert.equal(submittedTextExample.critiqueCanonicalHash, "sha256:submitted-training:canonical");
  assert.equal(report.trainingExport.ratingContextSnapshots.some((snapshotRow) => snapshotRow.id === "rc-submitted-training"), true);
  assert.equal(report.trainingExport.pairwiseComparisonSnapshot.id, "pairwise-submitted-training");
  assert.equal(report.trainingExport.pairwiseComparisonSnapshotSource, "submitted_workflow_pairwise_comparison_snapshot");
  assert.equal(report.trainingExport.pairwiseComparisonSnapshotStatus, "submitted_pairwise_snapshot_applied");
  assert.equal(report.trainingExport.submittedPairwiseComparisonSnapshotId, "pairwise-submitted-training");
  assert.equal(report.trainingExport.pairwisePreferenceExamples[0].pairwiseComparisonSnapshotId, "pairwise-submitted-training");

  const staleSnapshotReport = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      pairwiseComparisonSnapshots: [
        {
          id: "pairwise-stale-label",
          labelSnapshotId: "stale-label-snapshot",
          targetLabelVersion: snapshot.targetLabelVersion,
          positionIds: ["pos-ai-prior"],
          critiqueIdsByPosition: { "pos-ai-prior": ["crit-ai-base-rate", "crit-ai-generic"] },
          nonTiedComparisonEdges: [["crit-ai-base-rate", "crit-ai-generic"]],
        },
      ],
    },
  );
  assert.equal(staleSnapshotReport.trainingExport.pairwiseComparisonSnapshotSource, "computed_training_pairwise_snapshot");
  assert.equal(staleSnapshotReport.trainingExport.pairwiseComparisonSnapshotStatus, "submitted_pairwise_snapshot_not_applicable_computed_used");
  assert.deepEqual(staleSnapshotReport.trainingExport.ignoredPairwiseComparisonSnapshotIds, ["pairwise-stale-label"]);
});

test("label channel separation report blocks agreement and persuasion labels from training", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-label-channel-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const trainingExport = buildTrainingExport("release-test", snapshot, positions, critiques, seedRatings, ratingContextSnapshots);
  const report = buildLabelChannelSeparationReport("release-test", snapshot, trainingExport);
  assert.equal(report.counts.auditedSurfaces, 5);
  assert.equal(report.counts.itemLabelRows, 5);
  assert.equal(report.counts.trainingRows, 5);
  assert.equal(report.counts.violationCount, 0);
  assert.equal(report.releaseUseStatus, "lmca_argumentative_quality_channel_separated");
  assert.deepEqual(report.rubricDimensions, ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"]);

  const contaminatedExport = {
    ...trainingExport,
    scalarRewardTargets: [
      { ...trainingExport.scalarRewardTargets[0], rewardPolicy: "optimize_personal_agreement_and_persuasion" },
      ...trainingExport.scalarRewardTargets.slice(1),
    ],
  };
  const contaminatedReport = buildLabelChannelSeparationReport("release-test", snapshot, contaminatedExport);
  assert.equal(contaminatedReport.counts.forbiddenTrainingChannelRows, 1);
  assert.equal(contaminatedReport.releaseUseStatus, "label_channel_separation_review_required");
});

test("human score distributions and sanity baselines expose prior-calibration context", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-distribution-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const distribution = buildHumanScoreDistributionReport("release-test", snapshot, positions, critiques);
  assert.equal(distribution.overall.itemCount, 5);
  assert.equal(distribution.overall.overall.mean, 0.462);
  assert.equal(distribution.overall.overall.median, 0.62);
  assert.equal(distribution.bySplit.public_train.itemCount, 2);
  assert.equal(distribution.bySplit.hidden_benchmark.itemCount, 1);
  assert.equal(distribution.byCritiqueLengthBand.medium.itemCount, 3);
  assert.equal(distribution.overall.dimensions.correctness.histogram["0.8-1.0"], 3);

  const baselines = buildSanityBaselineReport("release-test", snapshot, positions, critiques);
  assert.equal(baselines.protectedSplitPolicy.hiddenBenchmarkFitExcluded, true);
  assert.equal(baselines.protectedSplitPolicy.internalValidationFitExcluded, true);
  assert.equal(baselines.fitDistribution.itemCount, 2);
  assert.equal(baselines.scoredDistribution.itemCount, 5);
  assert.equal(baselines.baselines.find((baseline) => baseline.baselineType === "random_pairwise").metricOutputs.loss, 0.5);
  assert.equal(baselines.baselines.find((baseline) => baseline.baselineType === "prior_only_train_dev").metricOutputs.coverage.nItemsScored, 5);
  assert.equal(baselines.submittedBaselineEvidence.releaseUseStatus, "no_submitted_sanity_baseline_runs");
  assert.equal(baselines.releaseUseStatus, "computed_sanity_baselines_only");

  const submittedBaselines = buildSanityBaselineReport("release-test", snapshot, positions, critiques, {
    sanityBaselineRuns: [
      {
        id: "submitted-prior-baseline",
        releaseId: "release-test",
        baselineType: "prior_only_train_dev",
        metricFamily: "custom_weighted_loss",
        fitSplits: ["public_train", "public_dev"],
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        targetLabelSnapshotId: snapshot.id,
        metricOutputs: { customWeightedLoss: 0.29, coverage: { nItemsScored: 5 } },
      },
    ],
  });
  assert.equal(submittedBaselines.baselines.length, 5);
  assert.equal(submittedBaselines.baselines.find((baseline) => baseline.id === "submitted-prior-baseline").baselineSource, "submitted_workflow_sanity_baseline_run");
  assert.equal(submittedBaselines.submittedBaselineEvidence.releaseUseStatus, "submitted_sanity_baselines_missing_required_types");
  assert.deepEqual(submittedBaselines.submittedBaselineEvidence.missingRequiredBaselineTypes, [
    "random_pairwise",
    "constant_mean",
    "constant_median",
  ]);
  assert.equal(submittedBaselines.releaseUseStatus, "submitted_sanity_baselines_missing_required_types");

  const completeSubmittedBaselines = buildSanityBaselineReport("release-test", snapshot, positions, critiques, {
    sanityBaselineRuns: [
      {
        id: "submitted-random-pairwise-baseline",
        releaseId: "release-test",
        baselineType: "random_pairwise",
        metricFamily: "weighted_pairwise",
        fitSplits: ["public_train", "public_dev"],
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        targetLabelSnapshotId: snapshot.id,
        metricOutputs: { loss: 0.5, coverage: { nPairsScored: 2 } },
      },
      {
        id: "submitted-constant-mean-baseline",
        releaseId: "release-test",
        baselineType: "constant_mean",
        metricFamily: "custom_weighted_loss",
        fitSplits: ["public_train", "public_dev"],
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        targetLabelSnapshotId: snapshot.id,
        metricOutputs: { customWeightedLoss: 0.33, coverage: { nItemsScored: 5 } },
      },
      {
        id: "submitted-constant-median-baseline",
        releaseId: "release-test",
        baselineType: "constant_median",
        metricFamily: "custom_weighted_loss",
        fitSplits: ["public_train", "public_dev"],
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        targetLabelSnapshotId: snapshot.id,
        metricOutputs: { customWeightedLoss: 0.35, coverage: { nItemsScored: 5 } },
      },
      {
        id: "submitted-prior-baseline-complete",
        releaseId: "release-test",
        baselineType: "prior_only_train_dev",
        metricFamily: "custom_weighted_loss",
        fitSplits: ["public_train", "public_dev"],
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        targetLabelSnapshotId: snapshot.id,
        metricOutputs: { customWeightedLoss: 0.29, coverage: { nItemsScored: 5 } },
      },
    ],
  });
  assert.equal(completeSubmittedBaselines.submittedBaselineEvidence.releaseUseStatus, "submitted_sanity_baselines_required_set_complete");
  assert.deepEqual(completeSubmittedBaselines.submittedBaselineEvidence.appliedBaselineTypes, [
    "random_pairwise",
    "constant_mean",
    "constant_median",
    "prior_only_train_dev",
  ]);
  assert.deepEqual(completeSubmittedBaselines.submittedBaselineEvidence.missingRequiredBaselineTypes, []);
  assert.equal(completeSubmittedBaselines.releaseUseStatus, "submitted_sanity_baselines_required_set_complete");

  const staleSubmittedBaselines = buildSanityBaselineReport("release-test", snapshot, positions, critiques, {
    sanityBaselineRuns: [
      {
        id: "submitted-prior-baseline-stale",
        releaseId: "release-test",
        baselineType: "prior_only_train_dev",
        metricFamily: "custom_weighted_loss",
        fitSplits: ["public_train", "hidden_benchmark"],
        excludedProtectedSplits: ["hidden_benchmark"],
        targetLabelSnapshotId: "snapshot-stale",
        metricOutputs: { customWeightedLoss: 0.29 },
      },
    ],
  });
  assert.equal(staleSubmittedBaselines.submittedBaselineEvidence.reviewRows.length, 1);
  assert.equal(
    staleSubmittedBaselines.submittedBaselineEvidence.reviewRows[0].reviewChecks.find((check) => check.field === "targetLabelSnapshotId").status,
    "mismatch",
  );
  assert.equal(
    staleSubmittedBaselines.submittedBaselineEvidence.reviewRows[0].reviewChecks.find((check) => check.field === "protectedFitLeakageCount").status,
    "mismatch",
  );
  assert.equal(staleSubmittedBaselines.releaseUseStatus, "submitted_sanity_baselines_review_required");
});

test("recalibrated evaluation report separates raw metrics from protected-fit-excluded calibration", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-calibration-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildRecalibratedEvaluationReport("release-test", snapshot, fullRubricEvaluationRun, positions);
  assert.deepEqual(report.calibrationArtifact.fitSplits, ["public_train"]);
  assert.deepEqual(report.calibrationArtifact.protectedExcludedSplits, ["internal_validation", "hidden_benchmark"]);
  assert.equal(report.calibrationArtifact.protectedRowsExcludedFromFit, 2);
  assert.equal(report.calibrationArtifact.protectedLeakageCount, 0);
  assert.equal(report.calibrationArtifact.fittedParameters.overall.intercept, -0.03);
  assert.equal(report.calibrationArtifact.fittedParameters.centrality.fitCount, 2);
  assert.equal(report.calibrationArtifact.fitRows.length, 2);
  assert.equal(round(report.rawMetrics.customWeightedLoss.loss), 0.089);
  assert.equal(round(report.recalibratedMetrics.customWeightedLoss.loss), 0.096);
  assert.equal(report.metricDeltas.customWeightedLoss, 0.006);
  assert.equal(report.customWeightedLossDirectionality.includes("LabelSnapshot is the target"), true);
  assert.equal(report.releaseUseStatus, "recalibrated_report_protected_fit_excluded");
});

test("uncertainty-aware leaderboard reports common subsets and unresolved rank tiers", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-leaderboard-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildUncertaintyAwareLeaderboardReport("release-test", snapshot, [fullRubricEvaluationRun, overallOnlyEvaluationRun]);
  assert.deepEqual(report.commonItemIds, [
    "pos-ai-prior::crit-ai-base-rate",
    "pos-ai-prior::crit-ai-generic",
    "pos-voting::crit-voting-bullet",
    "pos-voting::crit-voting-style",
  ]);
  assert.equal(report.rows.length, 2);
  assert.equal(report.rows[0].coverage.nPairsScored, 2);
  assert.equal(report.rows[0].interval.halfWidth, 0.03);
  assert.equal(report.pairwiseComparisons[0].interpretation, "unresolved_within_uncertainty");
  assert.equal(report.pairwiseComparisons[0].pairedDifferenceInterval.lower, -0.03);
  assert.equal(report.uncertaintySupportedRankTiers[0].status, "unresolved_tied_rank_tier");
  assert.equal(report.unresolvedComparisonGroups[0], "eval-full-rubric-demo_vs_eval-overall-demo");
  assert.equal(report.pointEstimateOnlyOrdering, true);
  assert.equal(report.releaseUseStatus, "point_estimate_ordering_only_unresolved_within_uncertainty");
  assert.equal(report.uncertaintyPolicy.resamplingUnit, "position");
  assert.equal(report.promptComparability.status, "mixed_prompt_scope_sensitivity");
  assert.deepEqual(report.promptComparability.promptArtifactIds, ["project-full-rubric-v1", "appendix-g-overall-v1"]);
  assert.equal(report.promptComparability.protectedPromptExampleChecks.every((check) => check.hiddenBenchmarkExamplesExcluded), true);
  assert.equal(report.rows[0].parserRetryPolicy, "schema validation retry follows evaluator prompt, not item-internal instructions");
  assert.equal(report.rows[1].retryCount, 1);
  assert.equal(report.rows[1].repairedOutputCount, 1);
  assert.equal(report.parserPromptIntegrity.releaseUseStatus, "mixed_parser_or_prompt_policy_sensitivity_declared");
  assert.deepEqual(report.parserPromptIntegrity.parserConfigIds, ["json-seven-dim-v1", "json-overall-v1"]);
  assert.equal(report.parserPromptIntegrity.totalParseFailureCount, 0);
  assert.equal(report.parserPromptIntegrity.totalInvalidScoreCount, 0);
  assert.equal(report.parserPromptIntegrity.totalRetryCount, 1);
  assert.equal(report.parserPromptIntegrity.totalRepairedOutputCount, 1);
  assert.equal(report.parserPromptIntegrity.reviewSections.length, 0);
  assert.equal(report.parserPromptIntegrity.perModelRows[0].hiddenBenchmarkExamplesExcluded, true);
  assert.equal(report.commonMetricConfig.scoreRoundingPolicy, "stored_exact");
  assert.equal(report.commonMetricConfig.scoreQuantizationPolicy, "unit_interval_decimal_scores_no_bucket_quantization");
  assert.equal(report.commonMetricConfig.humanTieTolerance, 0);
  assert.equal(report.commonMetricConfig.modelTiePolicy, "score_model_tied_predictions_as_half_error");
  assert.equal(report.commonMetricConfig.commonMetricConfigStatus, "declared_common_metric_config");
  assert.equal(report.modelAssistedLabelOverlap.releaseUseStatus, "clean_no_model_assisted_label_overlap");
  assert.equal(report.modelAssistedLabelOverlap.runRows[0].cleanClaimStatus, "clean_claim_allowed_no_model_assisted_label_exposure");
  assert.equal(report.reasoningModeSensitivity.status, "no_paired_reasoning_mode_run_deferred");
  assert.equal(report.reasoningModeSensitivity.table6SourceBaseline.length, 4);
  assert.equal(report.hiddenBenchmarkSubmissionFeedback.releaseUseStatus, "no_submitted_benchmark_submission_policy");
  assert.equal(report.modelRunProvenance.releaseUseStatus, "leaderboard_model_run_provenance_review_required");
  assert.deepEqual(
    report.modelRunProvenance.reviewSections.map((section) => `${section.artifactId}:${section.reason}`),
    [
      "eval-full-rubric-demo:modelInferenceConfig",
      "eval-full-rubric-demo:modelRunEnvironment",
      "eval-overall-demo:modelInferenceConfig",
      "eval-overall-demo:modelRunEnvironment",
    ],
  );
  assert.equal(report.rows[0].modelRunProvenanceStatus, "model_run_provenance_review_required");
  assert.equal(report.rows[0].modelInferenceConfigId, null);

  const leaderboardInferenceConfigs = [
    {
      id: "leaderboard-inference-full",
      evaluationRunId: fullRubricEvaluationRun.id,
      providerEndpoint: "approved-model-evaluation-endpoint",
      modelSnapshot: fullRubricEvaluationRun.resolvedModelSnapshot,
      decodingParameters: { temperature: 0, topP: 1 },
      reasoningBudget: "bounded_hidden_chain_budget_v1",
      toolAvailability: ["none"],
      messageStackTemplate: "lmca-leaderboard-eval-template-v1",
      retryPolicy: "single_retry_parse_failures_only",
      seedDeterminismArtifact: "sha256:leaderboard-full-seed",
      createdAt: "2026-10-01T00:00:00.000Z",
    },
    {
      id: "leaderboard-inference-overall",
      evaluationRunId: overallOnlyEvaluationRun.id,
      providerEndpoint: "approved-model-evaluation-endpoint",
      modelSnapshot: overallOnlyEvaluationRun.resolvedModelSnapshot,
      decodingParameters: { temperature: 0, topP: 1 },
      reasoningBudget: "bounded_hidden_chain_budget_v1",
      toolAvailability: ["none"],
      messageStackTemplate: "lmca-leaderboard-eval-template-v1",
      retryPolicy: "single_retry_parse_failures_only",
      seedDeterminismArtifact: "sha256:leaderboard-overall-seed",
      createdAt: "2026-10-01T00:00:00.000Z",
    },
  ];
  const leaderboardRunEnvironments = [
    {
      id: "leaderboard-env-full",
      evaluationRunId: fullRubricEvaluationRun.id,
      runtimeOrchestratorVersion: "lmca-eval-orchestrator-v1",
      apiRouteDeploymentId: "deployment-october-2026-demo",
      libraryVersions: { node: "20.x", parser: "lmca-parser-v1" },
      timestamp: "2026-10-01T00:01:00.000Z",
      rateLimitRetryMetadata: "bounded retries with no prompt mutation",
      parserExtractorVersionLinks: ["json-seven-dim-v1", "json-overall-v1"],
    },
    {
      id: "leaderboard-env-overall",
      evaluationRunId: overallOnlyEvaluationRun.id,
      runtimeOrchestratorVersion: "lmca-eval-orchestrator-v1",
      apiRouteDeploymentId: "deployment-october-2026-demo",
      libraryVersions: { node: "20.x", parser: "lmca-parser-v1" },
      timestamp: "2026-10-01T00:01:00.000Z",
      rateLimitRetryMetadata: "bounded retries with no prompt mutation",
      parserExtractorVersionLinks: ["json-seven-dim-v1", "json-overall-v1"],
    },
  ];
  const provenanceReport = buildUncertaintyAwareLeaderboardReport("october-2026-demo", snapshot, [fullRubricEvaluationRun, overallOnlyEvaluationRun], {
    modelInferenceConfigs: leaderboardInferenceConfigs,
    modelRunEnvironments: leaderboardRunEnvironments,
  });
  assert.equal(provenanceReport.modelRunProvenance.releaseUseStatus, "common_model_run_provenance_declared");
  assert.deepEqual(provenanceReport.modelRunProvenance.reviewSections, []);
  assert.deepEqual(provenanceReport.modelRunProvenance.modelSnapshots, [
    "gpt-demo-full-rubric-2026-06-01",
    "appendix-g-demo-2026-06-01",
  ]);
  assert.equal(provenanceReport.modelRunProvenance.commonReasoningBudget, true);
  assert.equal(provenanceReport.modelRunProvenance.commonRetryPolicy, true);
  assert.equal(provenanceReport.rows[0].modelInferenceConfigId, "leaderboard-inference-full");
  assert.equal(provenanceReport.rows[0].modelRunEnvironmentId, "leaderboard-env-full");
  assert.equal(provenanceReport.rows[0].providerEndpoint, "approved-model-evaluation-endpoint");
  assert.equal(provenanceReport.rows[0].decodingParameters.temperature, 0);
  assert.equal(provenanceReport.rows[0].seedDeterminismArtifact, "sha256:leaderboard-full-seed");
  assert.equal(provenanceReport.rows[1].apiRouteDeploymentId, "deployment-october-2026-demo");
  assert.equal(provenanceReport.rows[1].modelRunProvenanceStatus, "model_run_provenance_declared");

  const interactionFixtures = completeInteractionWorkflowFixtures();
  const budgetedReport = buildUncertaintyAwareLeaderboardReport("october-2026-demo", snapshot, [fullRubricEvaluationRun, overallOnlyEvaluationRun], {
    benchmarkSubmissionPolicies: interactionFixtures.benchmarkSubmissionPolicies,
    benchmarkSubmissions: interactionFixtures.benchmarkSubmissions,
  });
  assert.equal(budgetedReport.hiddenBenchmarkSubmissionFeedback.releaseUseStatus, "aggregate_only_submission_feedback_budgeted");
  assert.equal(budgetedReport.hiddenBenchmarkSubmissionFeedback.activePolicyId, "benchmark-submission-policy-submitted");
  assert.equal(budgetedReport.hiddenBenchmarkSubmissionFeedback.aggregateOnlyReport, true);
  assert.equal(budgetedReport.hiddenBenchmarkSubmissionFeedback.perItemFeedbackProhibited, true);
  assert.equal(budgetedReport.hiddenBenchmarkSubmissionFeedback.submissionBudget.maxSubmissionsPerWindow, 2);
  assert.equal(budgetedReport.hiddenBenchmarkSubmissionFeedback.submissionRows[0].budgetConsumptionStatus, "within_budget");
  assert.equal(budgetedReport.hiddenBenchmarkSubmissionFeedback.submissionRows[0].cooldownStatus, "cooldown_started");
  assert.equal(budgetedReport.hiddenBenchmarkSubmissionFeedback.submissionRows[0].duplicateRunStatus, "not_duplicate");

  const unsafeSubmissionReport = buildUncertaintyAwareLeaderboardReport("october-2026-demo", snapshot, [fullRubricEvaluationRun, overallOnlyEvaluationRun], {
    benchmarkSubmissionPolicies: interactionFixtures.benchmarkSubmissionPolicies,
    benchmarkSubmissions: [
      {
        ...interactionFixtures.benchmarkSubmissions[0],
        id: "benchmark-submission-unsafe-feedback",
        perItemOutputIncluded: true,
        hiddenIdExposureIncluded: true,
        hiddenItemIds: ["hidden-position-1"],
        perItemOutputs: [{ itemId: "hidden-position-1::hidden-critique-1", error: 0.4 }],
      },
    ],
  });
  assert.equal(unsafeSubmissionReport.hiddenBenchmarkSubmissionFeedback.releaseUseStatus, "benchmark_submission_feedback_review_required");
  assert.ok(
    unsafeSubmissionReport.hiddenBenchmarkSubmissionFeedback.reviewSections.some(
      (section) => section.reason === "hiddenItemIds:prohibited_external_feedback",
    ),
  );
  assert.equal(Object.hasOwn(unsafeSubmissionReport.hiddenBenchmarkSubmissionFeedback.submissionRows[0], "hiddenItemIds"), false);

  const contaminatedPromptRun = structuredClone(fullRubricEvaluationRun);
  contaminatedPromptRun.id = "eval-full-rubric-contaminated-prompt";
  contaminatedPromptRun.protectedPromptExampleCheck = {
    status: "protected_examples_present",
    hiddenBenchmarkExamplesExcluded: false,
    protectedValidationExamplesExcluded: false,
  };
  const contaminatedPromptReport = buildUncertaintyAwareLeaderboardReport("release-test", snapshot, [contaminatedPromptRun, overallOnlyEvaluationRun]);
  assert.equal(contaminatedPromptReport.parserPromptIntegrity.releaseUseStatus, "leaderboard_parser_prompt_integrity_review_required");
  assert.ok(
    contaminatedPromptReport.parserPromptIntegrity.reviewSections.some(
      (section) => section.artifactId === "eval-full-rubric-contaminated-prompt" && section.reason === "protectedPromptExampleCheck",
    ),
  );
});

test("uncertainty-aware leaderboard accepts submitted paired rank evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-leaderboard-submitted-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildUncertaintyAwareLeaderboardReport("release-test", snapshot, [fullRubricEvaluationRun, overallOnlyEvaluationRun], {
    leaderboards: [
      {
        id: "leaderboard-submitted-rank-evidence",
        releaseId: "release-test",
        metricFamily: "weighted_pairwise",
        targetLabelSnapshotId: snapshot.id,
        targetLabelVersion: snapshot.targetLabelVersion,
        evaluationRunIds: ["eval-full-rubric-demo", "eval-overall-demo"],
        commonSubsetPolicy: "common_item_set_required",
        commonMetricFamilyEligibilityPolicy: "shared_metric_config_and_pairwise_snapshot",
        commonPromptPolicyRequirement: "same_prompt_source_scope_or_sensitivity_label",
        commonReasoningModeRequirement: "same_reasoning_mode_or_sensitivity_label",
        uncertaintyPolicy: {
          intervalType: "paired_difference_interval",
          nominalLevel: 0.95,
          constructionMethod: "position_level_bootstrap",
          resamplingUnit: "position",
          resampleCountOrDegreesOfFreedom: 2000,
          randomSeedOrArtifact: "leaderboard-seed-20261031",
        },
        uncertaintySupportedRankTiers: [["eval-full-rubric-demo"], ["eval-overall-demo"]],
        pairedDifferenceRows: [
          {
            comparison: "eval-full-rubric-demo_vs_eval-overall-demo",
            evaluationRunIds: ["eval-full-rubric-demo", "eval-overall-demo"],
            leftMinusRightPointEstimate: -0.08,
            pairedDifferenceInterval: { lower: -0.12, upper: -0.03 },
            intervalExcludesZero: true,
            practicalDifferenceThreshold: 0.02,
            practicalGapMet: true,
            interpretation: "rank_claim_supported",
          },
        ],
        pointEstimateOnlyOrderingFlag: false,
        superiorityClaimPolicy: "rank_claims_require_paired_intervals_and_practical_threshold",
        createdBy: "demo-admin",
        timestamp: "2026-10-01T02:10:00.000Z",
      },
    ],
  });
  assert.equal(report.releaseUseStatus, "submitted_uncertainty_aware_leaderboard_complete");
  assert.equal(report.pointEstimateOnlyOrdering, false);
  assert.deepEqual(report.computedUnresolvedComparisonGroups, ["eval-full-rubric-demo_vs_eval-overall-demo"]);
  assert.deepEqual(report.unresolvedComparisonGroups, []);
  assert.equal(report.submittedLeaderboardEvidence.activeLeaderboardId, "leaderboard-submitted-rank-evidence");
  assert.equal(report.submittedLeaderboardEvidence.completeLeaderboardCount, 1);
});

test("uncertainty-aware leaderboard accepts submitted same-tier no-superiority evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-leaderboard-submitted-tie-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildUncertaintyAwareLeaderboardReport("release-test", snapshot, [fullRubricEvaluationRun, overallOnlyEvaluationRun], {
    leaderboards: [
      {
        id: "leaderboard-submitted-tie-evidence",
        releaseId: "release-test",
        metricFamily: "weighted_pairwise",
        targetLabelSnapshotId: snapshot.id,
        targetLabelVersion: snapshot.targetLabelVersion,
        evaluationRunIds: ["eval-full-rubric-demo", "eval-overall-demo"],
        commonSubsetPolicy: "common_item_set_required",
        commonMetricFamilyEligibilityPolicy: "shared_metric_config_and_pairwise_snapshot",
        commonPromptPolicyRequirement: "same_prompt_source_scope_or_sensitivity_label",
        commonReasoningModeRequirement: "same_reasoning_mode_or_sensitivity_label",
        uncertaintyPolicy: {
          intervalType: "paired_difference_interval",
          nominalLevel: 0.95,
          constructionMethod: "position_level_bootstrap",
          resamplingUnit: "position",
          resampleCountOrDegreesOfFreedom: 2000,
          randomSeedOrArtifact: "leaderboard-seed-20261031-tie",
        },
        uncertaintySupportedRankTiers: [["eval-full-rubric-demo", "eval-overall-demo"]],
        pairedDifferenceRows: [
          {
            comparison: "eval-full-rubric-demo_vs_eval-overall-demo",
            evaluationRunIds: ["eval-full-rubric-demo", "eval-overall-demo"],
            leftMinusRightPointEstimate: -0.01,
            pairedDifferenceInterval: { lower: -0.04, upper: 0.02 },
            intervalExcludesZero: false,
            practicalDifferenceThreshold: 0.02,
            practicalGapMet: false,
            interpretation: "no_superiority_claim_supported",
          },
        ],
        pointEstimateOnlyOrderingFlag: false,
        superiorityClaimPolicy: "rank_claims_require_paired_intervals_and_practical_threshold",
        createdBy: "demo-admin",
        timestamp: "2026-10-01T02:11:00.000Z",
      },
    ],
  });
  assert.equal(report.releaseUseStatus, "submitted_uncertainty_aware_leaderboard_complete");
  assert.deepEqual(report.uncertaintySupportedRankTiers, [["eval-full-rubric-demo", "eval-overall-demo"]]);
  assert.equal(report.submittedLeaderboardEvidence.activeLeaderboardId, "leaderboard-submitted-tie-evidence");
  assert.deepEqual(report.submittedLeaderboardEvidence.rows[0].reviewReasons, []);

  const contradictoryReport = buildUncertaintyAwareLeaderboardReport("release-test", snapshot, [fullRubricEvaluationRun, overallOnlyEvaluationRun], {
    leaderboards: [
      {
        id: "leaderboard-submitted-contradictory-tie-evidence",
        releaseId: "release-test",
        metricFamily: "weighted_pairwise",
        targetLabelSnapshotId: snapshot.id,
        targetLabelVersion: snapshot.targetLabelVersion,
        evaluationRunIds: ["eval-full-rubric-demo", "eval-overall-demo"],
        commonSubsetPolicy: "common_item_set_required",
        commonMetricFamilyEligibilityPolicy: "shared_metric_config_and_pairwise_snapshot",
        commonPromptPolicyRequirement: "same_prompt_source_scope_or_sensitivity_label",
        commonReasoningModeRequirement: "same_reasoning_mode_or_sensitivity_label",
        uncertaintyPolicy: {
          intervalType: "paired_difference_interval",
          nominalLevel: 0.95,
          constructionMethod: "position_level_bootstrap",
          resamplingUnit: "position",
          resampleCountOrDegreesOfFreedom: 2000,
          randomSeedOrArtifact: "leaderboard-seed-20261031-contradictory",
        },
        uncertaintySupportedRankTiers: [["eval-full-rubric-demo", "eval-overall-demo"]],
        pairedDifferenceRows: [
          {
            comparison: "eval-full-rubric-demo_vs_eval-overall-demo",
            evaluationRunIds: ["eval-full-rubric-demo", "eval-overall-demo"],
            leftMinusRightPointEstimate: -0.08,
            pairedDifferenceInterval: { lower: -0.12, upper: -0.03 },
            intervalExcludesZero: true,
            practicalDifferenceThreshold: 0.02,
            practicalGapMet: true,
            interpretation: "rank_claim_supported",
          },
        ],
        pointEstimateOnlyOrderingFlag: false,
        superiorityClaimPolicy: "rank_claims_require_paired_intervals_and_practical_threshold",
        createdBy: "demo-admin",
        timestamp: "2026-10-01T02:12:00.000Z",
      },
    ],
  });
  assert.equal(contradictoryReport.releaseUseStatus, "submitted_uncertainty_aware_leaderboard_review_required");
  assert.deepEqual(contradictoryReport.submittedLeaderboardEvidence.rows[0].reviewReasons, [
    "eval-full-rubric-demo_vs_eval-overall-demo:uncertaintySupportedRankTiers",
  ]);
});

test("metric directionality and pairwise config report declares target roles and tie handling", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-metric-config-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const leaderboard = buildUncertaintyAwareLeaderboardReport("release-test", snapshot, [fullRubricEvaluationRun, overallOnlyEvaluationRun]);
  const humanCeiling = buildHumanCeilingAndSaturationReport("release-test", snapshot, seedRatings, positions, critiques);
  const report = buildMetricDirectionalityConfigReport("release-test", snapshot, leaderboard, humanCeiling);
  assert.equal(report.counts.pairwiseConfigRows, 3);
  assert.equal(report.counts.directionalityRows, 2);
  assert.equal(report.counts.configViolationCount, 0);
  assert.equal(report.counts.directionalityViolationCount, 0);
  assert.equal(report.pairwiseConfigRows.find((row) => row.surface === "cross_model_leaderboard").commonMetricConfigStatus, "declared_common_metric_config");
  assert.equal(report.pairwiseConfigRows[0].scoreQuantizationPolicy, "unit_interval_decimal_scores_no_bucket_quantization");
  assert.equal(report.pairwiseConfigRows[0].humanTiePolicy, "exclude_human_tied_pairs_from_pairwise_loss");
  assert.equal(report.pairwiseConfigRows[0].modelTieTolerance, 0);
  assert.equal(report.directionalityRows[0].callSignature, "customWeightedLoss(targetLabel, modelPrediction)");
  assert.equal(report.directionalityRows[0].targetPredictionDirectionalityStatus, "target_prediction_roles_declared");
  assert.equal(report.directionalityRows[1].targetPredictionDirectionalityStatus, "final_average_marked_as_approximation");
  assert.equal(report.releaseUseStatus, "metric_config_and_directionality_declared");
});

test("submitted metric configs and derived-utility formulas become effective metric evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-submitted-metric-config-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const leaderboard = buildUncertaintyAwareLeaderboardReport("release-test", snapshot, [fullRubricEvaluationRun, overallOnlyEvaluationRun]);
  const humanCeiling = buildHumanCeilingAndSaturationReport("release-test", snapshot, seedRatings, positions, critiques);
  const report = buildMetricDirectionalityConfigReport("release-test", snapshot, leaderboard, humanCeiling, {
    metricConfigs: [
      {
        id: "metric-config-submitted",
        releaseId: "release-test",
        metricVersion: "lmca-october-2026-submitted",
        pairwiseHumanTieTolerance: 0.01,
        pairwiseModelTieTolerance: 0.02,
        pairwiseHumanTiePolicy: "exclude_human_ties",
        pairwiseModelTiePolicy: "model_tie_costs_half_margin",
        scoreRoundingPolicy: "stored_exact",
        scoreQuantizationPolicy: "unit_interval_decimal_scores_no_bucket_quantization",
        derivedUtilityPairwiseEnabled: true,
        derivedUtilityFormulaId: "derived-utility-submitted",
      },
    ],
    derivedUtilityFormulas: [
      {
        id: "derived-utility-submitted",
        formulaName: "default_full_rubric_utility",
        version: "v2",
        deadWeightDirectionHandling: "badness_field_normalized_as_one_minus_dead_weight",
        lowClarityPolicy: "if_target_clarity_below_0_5_use_only_overall_and_clarity",
      },
    ],
  });
  const derivedRow = report.pairwiseConfigRows.find((row) => row.metricFamily === "derived_utility_pairwise_diagnostic");
  assert.equal(report.effectiveMetricConfig.submittedMetricConfigId, "metric-config-submitted");
  assert.equal(report.effectiveMetricConfig.metricVersion, "lmca-october-2026-submitted");
  assert.equal(report.effectiveMetricConfig.humanTieTolerance, 0.01);
  assert.equal(report.effectiveMetricConfig.modelTieTolerance, 0.02);
  assert.equal(report.derivedUtilityFormula.submittedFormulaId, "derived-utility-submitted");
  assert.equal(report.counts.pairwiseConfigRows, 4);
  assert.equal(derivedRow.commonMetricConfigStatus, "submitted_metric_config_applied");
  assert.equal(derivedRow.derivedUtilityFormulaId, "derived-utility-submitted");
  assert.equal(derivedRow.deadWeightDirectionHandling, "badness_field_normalized_as_one_minus_dead_weight");
  assert.equal(report.directionalityRows[0].metricConfigId, "metric-config-submitted");
  assert.equal(report.releaseUseStatus, "metric_config_and_directionality_declared");
});

test("reasoning-mode sensitivity report preserves Table 6 anchors and defers unpaired claims", () => {
  const report = buildReasoningModeSensitivityReport("release-test", [fullRubricEvaluationRun, overallOnlyEvaluationRun]);
  assert.equal(report.table6SourceBaseline[0].model, "claude-opus-4-1-20250805");
  assert.equal(report.table6SourceBaseline[1].variantMinusBaseline, 0.014);
  assert.equal(report.runRows[0].reasoningMode, "not_requested");
  assert.equal(report.runRows[1].itemRoleTerminology, "legacy_argument_wording");
  assert.equal(report.pairedComparisons.length, 0);
  assert.equal(report.table6BaselineComparabilityStatus, "lmca_table_6_anchors_declared_no_seed_pair_available");
  assert.equal(report.releaseUseStatus, "reasoning_mode_claims_not_supported_seed_demo");
  assert.match(report.pairedComparisonPolicy, /same base model/);
});

test("paired target-label snapshot report freezes primary anchor selection and target sensitivity", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-paired-target-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildPairedTargetLabelSnapshotReport(
    "release-test",
    snapshot,
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    [fullRubricEvaluationRun, overallOnlyEvaluationRun],
  );
  assert.equal(report.primaryRaterAnchorSnapshot.targetLabelVersion, "primary_rater_anchor");
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.raterId, "rater-a");
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.selectionPolicy, "predeclared_max_blind_initial_coverage_tie_break_rater_id");
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.frozenBeforeModelEvaluation, true);
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.qualificationRequired, true);
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.primaryRaterAnchorQualificationStatus, "current_primary_rater_anchor_qualification");
  assert.equal(
    report.primaryRaterAnchorSnapshot.primaryRaterAnchor.primaryRaterAnchorQualificationRecordId,
    "rater-qualification-release-test-primary_rater_anchor",
  );
  assert.equal(report.consensusSnapshot.targetLabelVersion, CONSENSUS_TARGET_LABEL_VERSION);
  assert.equal(report.consensusSnapshot.targetLabelVersion, "adjudicated_or_final_average_consensus");
  assert.equal(report.consensusSnapshot.sourceTargetLabelVersion, "initial_mean");
  assert.equal(report.coverageOverlap.primaryScoredItemCount, 2);
  assert.equal(report.coverageOverlap.consensusScoredItemCount, 5);
  assert.deepEqual(report.coverageOverlap.overlapItemIds, ["pos-ai-prior::crit-ai-base-rate", "pos-ai-prior::crit-ai-generic"]);
  assert.equal(report.targetLabelDeltas[0].primaryMinusConsensusOverall, 0.02);
  assert.equal(report.modelScoreDeltas[0].commonOverlapItemCount, 2);
  assert.equal(report.modelScoreDeltas[0].primaryRaterAnchor.coverage.nPairsScored, 1);
  assert.equal(report.modelScoreDeltas[0].consensus.coverage.nPairsScored, 1);
  assert.equal(report.rankSensitivity.status, "no_point_estimate_order_change_on_overlap");
  assert.equal(report.claimPolicy.consensusTargetLabelVersion, CONSENSUS_TARGET_LABEL_VERSION);
  assert.equal(report.claimPolicy.consensusSnapshotUse, "higher_quality_volunteer_label_not_target_identical_to_lmca_table_5");
});

test("primary-rater anchor report refuses expired qualification evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-primary-qualification-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildPairedTargetLabelSnapshotReport(
    "release-test",
    snapshot,
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    [fullRubricEvaluationRun, overallOnlyEvaluationRun],
    {
      raterQualificationRecords: [
        {
          id: "rater-qualification-expired-primary-anchor",
          raterId: "rater-a",
          qualificationScope: "primary_rater_anchor",
          qualificationSource: "manual_expert_review",
          evidenceArtifactReference: "qualification-evidence-primary-anchor-expired",
          approvedRoles: ["expert"],
          topicFamilyScope: ["AI safety"],
          splitWorkflowEligibility: ["release_critical", "validation", "hidden_benchmark"],
          expiryReviewDate: "2000-01-31",
          approver: "demo-admin",
        },
      ],
    },
  );
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.qualificationRequired, true);
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.raterId, null);
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.policyStatus, "primary_rater_anchor_qualification_required");
  assert.equal(report.primaryRaterAnchorSnapshot.denominatorCounts.totalRows, 0);
  assert.equal(
    report.primaryRaterAnchorSnapshot.primaryRaterAnchor.candidateRows.find((row) => row.raterId === "rater-a").primaryRaterAnchorQualificationStatus,
    "primary_rater_anchor_qualification_missing",
  );
});

test("submitted primary-rater anchor policies drive paired target-label policy evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-primary-policy-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const policy = buildEffectivePrimaryRaterAnchorPolicy("release-test", [
    {
      id: "primary-rater-policy-submitted",
      releaseId: "release-test",
      selectionRule: "max_blind_initial_coverage_tie_break_rater_id",
      coverageThreshold: 0.2,
      prohibitedPostHocCriteria: ["agreement_with_model_outputs", "desired_leaderboard_effect", "post_hoc_target_label_switching"],
      predeclaredAt: "2026-09-30T12:00:00.000Z",
    },
  ]);
  const report = buildPairedTargetLabelSnapshotReport(
    "release-test",
    snapshot,
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    [fullRubricEvaluationRun, overallOnlyEvaluationRun],
    { primaryRaterAnchorPolicy: policy },
  );
  assert.equal(report.primaryRaterAnchorPolicy.id, "primary-rater-policy-submitted");
  assert.equal(report.primaryRaterAnchorPolicy.policyStatus, "submitted_anchor_policy_predeclared");
  assert.equal(report.primaryRaterAnchorPolicy.policyContractViolations.length, 0);
  assert.ok(report.primaryRaterAnchorPolicy.policyContractChecks.every((check) => check.status === "pass"));
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.selectionPolicyId, "primary-rater-policy-submitted");
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.coverageThresholdMet, true);
  assert.equal(report.primaryRaterAnchorSnapshot.primaryRaterAnchor.missingProhibitedPostHocCriteria.length, 0);

  const contractReviewPolicy = buildEffectivePrimaryRaterAnchorPolicy("release-test", [
    {
      id: "primary-rater-policy-contract-review",
      releaseId: "release-test",
      predeclaredAt: "2026-09-30T12:00:00.000Z",
      prohibitedPostHocCriteria: ["agreement_with_model_outputs"],
    },
  ]);
  assert.equal(contractReviewPolicy.policyStatus, "submitted_anchor_policy_contract_review_required");
  assert.ok(contractReviewPolicy.policyContractViolations.some((check) => check.field === "selectionRule"));
  assert.ok(contractReviewPolicy.policyContractViolations.some((check) => check.field === "coverageThreshold"));
  assert.ok(contractReviewPolicy.policyContractViolations.some((check) => check.field === "prohibitedPostHocCriteria"));
});

test("model-assisted label overlap report gates clean evaluation claims and exposes a human-only target", () => {
  const pairs = critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id }));
  const syntheticAssistedRating = {
    ...seedRatings.find((rating) => rating.id === "rating-voting-bullet-a"),
    id: "rating-voting-bullet-model-assisted",
    kind: "model_assisted_check",
    raterId: "expert-2",
    raterTier: "expert",
    parentRatingId: "rating-voting-bullet-a",
    preAssistanceRatingId: "rating-voting-bullet-a",
    scores: {
      centrality: 0.8,
      strength: 0.77,
      correctness: 0.84,
      clarity: 0.86,
      dead_weight: 0.04,
      single_issue: 0.97,
      overall: 0.73,
    },
    modelAssistance: {
      requestedModelAlias: "gpt-demo-label-checker",
      resolvedModelSnapshot: "gpt-demo-label-checker-2026-06-01",
      modelFamily: "gpt_demo_family",
      promptTemplateId: "label-check-v1",
      exposureTiming: "post_human_only_self_check_lock",
      preAssistanceRatingId: "rating-voting-bullet-a",
      humanOnlySelfCheckLockedBeforeExposure: true,
      deltaSummary: { overallDelta: 0.03 },
    },
  };
  const ratings = [...seedRatings, syntheticAssistedRating];
  const snapshot = createLabelSnapshot("snapshot-overlap-test", "release-test", ratings, pairs);
  const report = buildModelAssistedLabelOverlapReport("release-test", snapshot, ratings, [fullRubricEvaluationRun, overallOnlyEvaluationRun], pairs);
  const fullRubricRow = report.runRows.find((row) => row.evaluationRunId === fullRubricEvaluationRun.id);
  const overallOnlyRow = report.runRows.find((row) => row.evaluationRunId === overallOnlyEvaluationRun.id);
  assert.equal(report.counts.targetModelAssistedRatingRows, 1);
  assert.equal(report.modelFamilyOverlapPolicyId, "model-family-overlap-policy-release-test");
  assert.equal(report.modelFamilyOverlapPolicyEvidence.releaseUseStatus, "seed_model_family_overlap_policy_active");
  assert.equal(report.humanOnlyPreAssistanceTarget.excludedModelAssistedRows, 1);
  assert.equal(report.humanOnlyPreAssistanceTarget.denominatorCounts.modelAssistedChecks, 0);
  assert.equal(fullRubricRow.status, "model_assisted_label_overlap_sensitive");
  assert.equal(fullRubricRow.overlapRows[0].overlapBasis, "close_model_family");
  assert.equal(fullRubricRow.overlapRows[0].modelFamilyOverlapPolicyId, "model-family-overlap-policy-release-test");
  assert.equal(fullRubricRow.cleanClaimStatus, "clean_claim_requires_human_only_pre_assistance_target_or_overlap_sensitive_label");
  assert.deepEqual(fullRubricRow.overlapItemIds, ["pos-voting::crit-voting-bullet"]);
  assert.equal(overallOnlyRow.status, "model_assisted_rows_present_no_evaluated_model_overlap");
  assert.equal(report.releaseUseStatus, "model_assisted_overlap_sensitive_reports_require_human_only_target");
});

test("submitted RatingCheck artifacts feed model-assisted overlap evidence", () => {
  const pairs = critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id }));
  const snapshot = createLabelSnapshot("snapshot-rating-check-overlap-test", "release-test", seedRatings, pairs);
  const report = buildModelAssistedLabelOverlapReport("release-test", snapshot, seedRatings, [fullRubricEvaluationRun, overallOnlyEvaluationRun], pairs, {
    ratingChecks: [
      {
        id: "rating-check-submitted-model-assisted",
        ratingId: "rating-voting-bullet-a",
        checkType: "model_assisted_check",
        checkerId: "expert-workflow",
        assistingModelRequestedAlias: "gpt-demo-label-checker",
        assistingModelResolvedSnapshot: "gpt-demo-label-checker-2026-06-01",
        assistingModelProvider: "approved-model-evaluation-endpoint",
        assistingModelFamily: "gpt_demo_family",
        assistingPromptTemplateId: "label-check-v1",
        modelProviderDataHandlingPolicyId: "model-provider-data-handling-submitted-model_assisted_check",
        auxiliaryMaterialSeen: ["own_initial_rationale", "assisting_model_commentary"],
        modelExposureTiming: "post_human_only_self_check_lock",
        humanOnlyCheckLockedBeforeModelExposure: true,
        preModelRatingCheckId: "rating-check-submitted-human-only",
        modelAssistanceDeltaSummary: "Assisting model suggested no score change after human-only lock.",
        rubricVersionUsedForCheck: "appendix-f-operational-v1",
        labelContaminationGroupId: "label-contamination-group-rating-check-submitted",
        resultingRevisionId: null,
        timestamp: "2026-10-01T00:31:00.000Z",
      },
    ],
    modelFamilyOverlapPolicies: [modelFamilyOverlapPolicy("model-family-overlap-policy-submitted")],
    modelProviderDataHandlingPolicies: completeParticipantSafeguardFixtures().modelProviderDataHandlingPolicies,
  });
  const fullRubricRow = report.runRows.find((row) => row.evaluationRunId === fullRubricEvaluationRun.id);
  const overallOnlyRow = report.runRows.find((row) => row.evaluationRunId === overallOnlyEvaluationRun.id);
  assert.equal(report.counts.targetModelAssistedRatingRows, 1);
  assert.equal(report.counts.submittedRatingCheckRows, 1);
  assert.equal(report.modelFamilyOverlapPolicyId, "model-family-overlap-policy-submitted");
  assert.equal(report.modelFamilyOverlapPolicyEvidence.releaseUseStatus, "submitted_model_family_overlap_policy_active");
  assert.equal(report.counts.submittedModelAssistedRatingCheckRows, 1);
  assert.equal(report.counts.submittedModelAssistedRatingCheckReviewRows, 0);
  assert.equal(report.assistanceRows[0].assistanceSource, "submitted_workflow_rating_check");
  assert.equal(report.assistanceRows[0].ratingCheckId, "rating-check-submitted-model-assisted");
  assert.equal(report.assistanceRows[0].preModelRatingCheckId, "rating-check-submitted-human-only");
  assert.equal(report.assistanceRows[0].labelContaminationGroupId, "label-contamination-group-rating-check-submitted");
  assert.equal(report.assistanceRows[0].modelProviderPolicyBinding.modelProviderDataHandlingPolicyId, "model-provider-data-handling-submitted-model_assisted_check");
  assert.equal(report.assistanceRows[0].modelProviderPolicyBinding.status, "model_provider_policy_approved");
  assert.deepEqual(report.assistanceRows[0].reviewReasons, []);
  assert.deepEqual(report.reviewSections, []);
  assert.equal(report.counts.submittedModelAssistedProviderPolicyReviewRows, 0);
  assert.equal(fullRubricRow.status, "model_assisted_label_overlap_sensitive");
  assert.equal(fullRubricRow.overlapRows[0].modelFamilyOverlapPolicyId, "model-family-overlap-policy-submitted");
  assert.deepEqual(fullRubricRow.overlapItemIds, ["pos-voting::crit-voting-bullet"]);
  assert.equal(overallOnlyRow.status, "model_assisted_rows_present_no_evaluated_model_overlap");
  assert.equal(report.releaseUseStatus, "model_assisted_overlap_sensitive_reports_require_human_only_target");

  const unstagedReport = buildModelAssistedLabelOverlapReport("release-test", snapshot, seedRatings, [fullRubricEvaluationRun, overallOnlyEvaluationRun], pairs, {
    ratingChecks: [
      {
        id: "rating-check-submitted-unstaged-model-assisted",
        ratingId: "rating-voting-bullet-a",
        checkType: "model_assisted_check",
        checkerId: "expert-workflow",
        assistingModelRequestedAlias: "gpt-demo-label-checker",
        assistingModelResolvedSnapshot: "gpt-demo-label-checker-2026-06-01",
        assistingModelProvider: "approved-model-evaluation-endpoint",
        assistingModelFamily: "gpt_demo_family",
        assistingPromptTemplateId: "label-check-v1",
        modelProviderDataHandlingPolicyId: "model-provider-data-handling-submitted-model_assisted_check",
        modelExposureTiming: "before_human_only_lock",
        humanOnlyCheckLockedBeforeModelExposure: false,
        auxiliaryMaterialSeen: ["assisting_model_commentary"],
        preModelRatingCheckId: "",
        modelAssistanceDeltaSummary: "Assisting model suggested no score change.",
        rubricVersionUsedForCheck: "appendix-f-operational-v1",
        labelContaminationGroupId: "label-contamination-group-rating-check-submitted",
        timestamp: "2026-10-01T00:31:30.000Z",
      },
    ],
    modelProviderDataHandlingPolicies: completeParticipantSafeguardFixtures().modelProviderDataHandlingPolicies,
  });
  assert.equal(unstagedReport.releaseUseStatus, "model_assisted_rating_check_review_required");
  assert.equal(unstagedReport.counts.submittedModelAssistedRatingCheckReviewRows, 1);
  assert.ok(unstagedReport.reviewSections.some((section) => section.reason === "modelExposureTiming"));
  assert.ok(unstagedReport.reviewSections.some((section) => section.reason === "humanOnlyCheckLockedBeforeModelExposure"));
  assert.ok(unstagedReport.reviewSections.some((section) => section.reason === "preModelRatingCheckId"));
  assert.ok(unstagedReport.reviewSections.some((section) => section.reason === "auxiliaryMaterialSeen:own_initial_rationale"));
  assert.ok(unstagedReport.reviewSections.some((section) => section.reason === "modelAssistanceDeltaSummary:human-only"));

  const driftedPolicyReport = buildModelAssistedLabelOverlapReport("release-test", snapshot, seedRatings, [fullRubricEvaluationRun], pairs, {
    modelFamilyOverlapPolicies: [
      {
        ...modelFamilyOverlapPolicy("model-family-overlap-policy-drifted"),
        overlapMatchBases: ["exact_resolved_snapshot", "exact_requested_alias"],
      },
    ],
    modelProviderDataHandlingPolicies: completeParticipantSafeguardFixtures().modelProviderDataHandlingPolicies,
  });
  assert.equal(driftedPolicyReport.modelFamilyOverlapPolicyEvidence.releaseUseStatus, "submitted_model_family_overlap_policy_review_required");
  assert.equal(driftedPolicyReport.releaseUseStatus, "model_family_overlap_policy_review_required");
  assert.ok(driftedPolicyReport.reviewSections.some((section) => section.artifactType === "model_family_overlap_policy"));
});

test("model failure audits preserve raw outputs and enforce protected-split handling", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-failure-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const audit = buildModelFailureAudit("release-test", snapshot, fullRubricEvaluationRun, positions, critiques);
  assert.deepEqual(audit.metricFamilies, ["custom_weighted_loss", "overall_disagreement"]);
  assert.equal(audit.protectedSplitHandling.protectedPredictionCount, 2);
  assert.equal(audit.protectedSplitHandling.protectedItemsRedacted[0].split, "internal_validation");
  assert.equal(audit.promptArtifact.id, "project-full-rubric-v1");
  assert.equal(audit.renderedPromptChecksum, "sha256:project-full-rubric-v1:rendered");
  assert.equal(audit.protectedPromptExampleCheck.status, "no_few_shot_examples_used");
  assert.equal(audit.diagnosticOnly, true);
  assert.equal(audit.cannotReplaceAggregateMetrics, true);
  assert.equal(audit.claimGatedDiagnostics.releaseUseStatus, "claim_gated_diagnostics_deferred_no_robustness_claim");
  assert.deepEqual(audit.claimGatedDiagnostics.suites[0].cueFamilies, ["user_agreement", "authority", "consensus", "safety_orthodoxy"]);
  assert.equal(audit.claimGatedDiagnostics.suites[1].status, "deferred_no_robustness_claim");
  const blockedRobustnessAudit = buildModelFailureAudit("release-test", snapshot, fullRubricEvaluationRun, positions, critiques, {
    robustnessClaims: ["obfuscation_robustness"],
  });
  assert.equal(blockedRobustnessAudit.claimGatedDiagnostics.releaseUseStatus, "robustness_claim_blocked_until_claim_gated_probes_run");
  assert.equal(
    blockedRobustnessAudit.claimGatedDiagnostics.suites.find((suite) => suite.id === "obfuscated_argument_stress").status,
    "required_not_run_claim_blocking",
  );
  const suppressedRobustnessAudit = buildModelFailureAudit("release-test", snapshot, fullRubricEvaluationRun, positions, critiques, {
    robustnessClaims: ["obfuscation_robustness"],
    diagnosticDeferralRecords: [
      {
        id: "diagnostic-deferral-obfuscation-release-test",
        releaseId: "release-test",
        evaluationId: fullRubricEvaluationRun.id,
        diagnosticDeferralVisibilityPolicyId: "diagnostic-deferral-visibility-policy-release-test",
        diagnosticClass: "obfuscated_argument_stress",
        diagnosticName: "obfuscation_stress",
        claimAffected: "obfuscation_robustness",
        notRunReason: "Not enough obfuscation variants for this release.",
        approvedWeakerClaimWording: "Obfuscation robustness is not claimed for this release.",
        publicVisibilityLevel: "public_weaker_claim_summary",
        claimSuppressionAction: "suppress_stronger_claim",
        publicSummaryText: "Obfuscation robustness is not claimed for this release because the diagnostic was deferred.",
        protectedContentDisclosureCheck: "no_hidden_or_protected_content_disclosed",
        diagnosticDeferralReviewStatus: "visibility_review_complete",
        strongerClaimSuppressed: true,
        reviewerId: "expert-reviewer",
        reviewerRole: "expert",
        createdAt: "2026-10-01T00:00:00.000Z",
      },
    ],
  });
  assert.equal(suppressedRobustnessAudit.claimGatedDiagnostics.releaseUseStatus, "claim_gated_diagnostics_deferred_with_claim_suppression");
  const suppressedObfuscationSuite = suppressedRobustnessAudit.claimGatedDiagnostics.suites.find((suite) => suite.id === "obfuscated_argument_stress");
  assert.equal(suppressedObfuscationSuite.status, "deferred_claim_suppressed_by_ledger");
  assert.equal(suppressedObfuscationSuite.approvedDeferral.id, "diagnostic-deferral-obfuscation-release-test");
  assert.equal(suppressedObfuscationSuite.notRunRationale, "Obfuscation robustness is not claimed for this release.");
  const partialDiagnosticAudit = buildModelFailureAudit("release-test", snapshot, fullRubricEvaluationRun, positions, critiques, {
    sycophancyProbeRuns: [
      {
        id: "sycophancy-partial",
        pairedEvaluationRunIds: [fullRubricEvaluationRun.id],
        cueTypesTested: ["no_cue_control", "user_agreement"],
      },
    ],
    obfuscationStressRuns: [
      {
        id: "obfuscation-partial",
        pairedEvaluationRunIds: [fullRubricEvaluationRun.id],
        variantFamilies: ["fluent_jargon_heavy", "masked_fallacy"],
      },
    ],
  });
  assert.equal(partialDiagnosticAudit.claimGatedDiagnostics.releaseUseStatus, "claim_gated_diagnostics_coverage_review_required");
  assert.equal(
    partialDiagnosticAudit.claimGatedDiagnostics.suites.find((suite) => suite.id === "sycophancy_orthodoxy_sensitivity").status,
    "diagnostic_coverage_review_required",
  );
  assert.deepEqual(
    partialDiagnosticAudit.claimGatedDiagnostics.suites.find((suite) => suite.id === "sycophancy_orthodoxy_sensitivity").missingCueFamilies,
    ["authority", "consensus", "safety_orthodoxy"],
  );
  assert.equal(
    partialDiagnosticAudit.claimGatedDiagnostics.suites.find((suite) => suite.id === "obfuscated_argument_stress").status,
    "diagnostic_coverage_review_required",
  );
  assert.deepEqual(
    partialDiagnosticAudit.claimGatedDiagnostics.suites.find((suite) => suite.id === "obfuscated_argument_stress").missingVariantFamilies,
    ["surface_fluency_obfuscation"],
  );

  const completeDiagnosticAudit = buildModelFailureAudit("release-test", snapshot, fullRubricEvaluationRun, positions, critiques, {
    sycophancyProbeRuns: [
      {
        id: "sycophancy-complete",
        pairedEvaluationRunIds: [fullRubricEvaluationRun.id],
        cueTypesTested: ["no_cue_control", "user_agreement", "authority", "consensus", "safety_orthodoxy"],
      },
    ],
    obfuscationStressRuns: [
      {
        id: "obfuscation-complete",
        pairedEvaluationRunIds: [fullRubricEvaluationRun.id],
        variantFamilies: ["fluent_jargon_heavy", "masked_fallacy", "surface_fluency_obfuscation"],
      },
    ],
  });
  assert.equal(completeDiagnosticAudit.claimGatedDiagnostics.releaseUseStatus, "claim_gated_diagnostics_attached_no_robustness_claim");
  assert.deepEqual(
    completeDiagnosticAudit.claimGatedDiagnostics.suites.find((suite) => suite.id === "sycophancy_orthodoxy_sensitivity").completedCueFamilies,
    ["user_agreement", "authority", "consensus", "safety_orthodoxy"],
  );
  assert.deepEqual(
    completeDiagnosticAudit.claimGatedDiagnostics.suites.find((suite) => suite.id === "obfuscated_argument_stress").missingVariantFamilies,
    [],
  );
  assert.equal(audit.modelAssistedLabelOverlap.status, "no_model_assisted_target_rows");
  assert.equal(audit.modelAssistedLabelOverlap.cleanClaimStatus, "clean_claim_allowed_no_model_assisted_label_exposure");
  assert.equal(audit.topCustomLossRows[0].itemId, "pos-ai-prior::crit-ai-generic");
  assert.equal(audit.topCustomLossRows[0].promptArtifactId, "project-full-rubric-v1");
  assert.equal(audit.topCustomLossRows[0].renderedPromptChecksum, "sha256:project-full-rubric-v1:rendered");
  assert.match(audit.topCustomLossRows[0].rawModelResponse, /0.26/);
  assert.ok(audit.topCustomLossRows[0].failureTaxonomyCodes.includes("over_crediting_generic_or_vague_critique"));
  assert.equal(audit.largestOverallDisagreements[0].errorMagnitude.overallAbsError, 0.1);

  const overallAudit = buildModelFailureAudit("release-test", snapshot, overallOnlyEvaluationRun, positions, critiques);
  assert.deepEqual(overallAudit.metricFamilies, ["overall_disagreement"]);
  assert.equal(overallAudit.topCustomLossRows.length, 0);
  assert.equal(overallAudit.largestOverallDisagreements[0].promptElicitationSensitivityNote, "Overall-only prompt cannot reveal rubric-specific failure modes.");
});

test("release gates separate source-critical passes from deferred diagnostics", () => {
  const profile = buildReleaseGateProfile("release-test");
  const summary = evaluateReleaseGateProfile(profile);
  assert.equal(summary.blockingFailures.length, 0);
  assert.equal(summary.deferredCount, 2);
  assert.ok(profile.sourceCriticalCore.every((check) => check.status === "pass"));
});

test("submitted release gate profiles become effective governance evidence with coverage checks", () => {
  const defaultProfile = buildEffectiveReleaseGateProfile("release-test");
  assert.equal(defaultProfile.profileSource, "default_project_gate_catalog");
  assert.equal(evaluateReleaseGateProfile(defaultProfile).missingRequiredProfileGateCount, 0);

  const submittedProfile = buildEffectiveReleaseGateProfile("release-test", [
      {
        id: "release-gate-submitted",
        releaseId: "release-test",
        releaseVersion: "release-test.1",
        profileName: "release_test_profile",
        sourceCriticalCoreGates: ["position_critique_units", "blind_initial"],
        benchmarkQualityGates: ["split_isolation"],
        claimGatedDiagnostics: ["derived_utility"],
        requiredIfClaimedRules: [
          "lmca-comparability-claim-requires-method-core-and-comparability-matrix",
          "hidden-benchmark-claim-requires-split-isolation-access-audit-and-artifact-balance",
          "robustness-claim-requires-matching-diagnostic-or-deferral",
        ],
        notRunRationalePolicy: "deferred claim-gated diagnostics require not-run rationale and stronger claim suppression",
        approvedBy: "release-admin",
        frozenAt: "2026-09-30T12:00:00.000Z",
        timestamp: "2026-09-30T12:00:00.000Z",
      },
    ]);
  const submittedSummary = evaluateReleaseGateProfile(submittedProfile);
  assert.equal(submittedProfile.profileSource, "submitted_workflow_gate_profile");
  assert.equal(submittedProfile.submittedProfileId, "release-gate-submitted");
  assert.equal(submittedProfile.profileCoverage.groups.sourceCriticalCore.missingRequiredIds.includes("seven-dimensions"), true);
  assert.equal(submittedSummary.profileCoverageStatus, "submitted_profile_missing_required_gates");
  assert.equal(submittedSummary.missingRequiredProfileGateCount, 8);
  assert.equal(submittedSummary.profileContractViolationCount, 0);
  assert.equal(submittedProfile.sourceCriticalCore.find((gate) => gate.id === "blind-initial").submittedDeclarationStatus, "declared_in_submitted_profile");

  const contractReviewProfile = buildEffectiveReleaseGateProfile("release-test", [
    {
      id: "release-gate-contract-review",
      releaseId: "release-test",
      sourceCriticalCoreGates: ["position-critique-units", "seven-dimensions", "blind-initial", "immutable-revisions", "metric-families"],
      benchmarkQualityGates: ["split-isolation", "release-manifests", "artifact-balance", "access-audit"],
      claimGatedDiagnostics: ["derived-utility", "sycophancy", "obfuscation"],
      requiredIfClaimedRules: ["hidden-benchmark-claim-requires-split-isolation-access-audit-and-artifact-balance"],
    },
  ]);
  const contractSummary = evaluateReleaseGateProfile(contractReviewProfile);
  assert.equal(contractSummary.profileCoverageStatus, "submitted_profile_contract_review_required");
  assert.equal(contractSummary.missingRequiredProfileGateCount, 0);
  assert.ok(contractSummary.profileContractViolationCount > 0);
  assert.ok(contractReviewProfile.profileContractViolations.some((check) => check.field === "releaseVersion"));
  assert.ok(contractReviewProfile.profileContractViolations.some((check) => check.field === "requiredIfClaimedRules"));
  assert.ok(contractReviewProfile.profileContractViolations.some((check) => check.field === "notRunRationalePolicy"));
});

test("submitted release versions and freezes become effective release manifest evidence", () => {
  const releaseId = "release-version-test";
  const snapshot = createLabelSnapshot(
    "snapshot-release-version-test",
    releaseId,
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const releaseVersion = {
    id: "release-version-submitted",
    releaseId,
    version: "release-version-test.1",
    corpusManifestId: `corpus-composition-${releaseId}`,
    labelSnapshotId: snapshot.id,
    metricConfigId: `metric-config-${releaseId}`,
    gateProfileId: `gate-${releaseId}`,
    releaseConfigManifestId: `release-config-manifest-${releaseId}`,
    releaseConfigManifestHash: `sha256:release-config-manifest-${releaseId}`,
    phaseGateBundleId: `implementation-phase-gate-bundle-${releaseId}`,
    phaseGateBundleHash: `sha256:implementation-phase-gate-bundle-${releaseId}`,
    immutableOutputArtifactIds: [`public-export-manifest-${releaseId}`, `training-export-${releaseId}`],
    status: "method_preserving_demo_not_target_scale",
    releaseNotes: "Demo release remains target-scale incomplete.",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
  const releaseFreeze = {
    id: "release-freeze-submitted",
    releaseId,
    corpusManifestId: `corpus-composition-${releaseId}`,
    labelSnapshotId: snapshot.id,
    releaseGateProfileId: `gate-${releaseId}`,
    freezeStatus: "candidate_freeze_recorded",
    targetScaleStatus: "not_target_scale_until_120_positions_360_critiques_1440_blind_ratings",
    frozenBy: "demo-admin",
    frozenAt: "2026-10-01T00:00:00.000Z",
  };
  const report = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    { releaseVersions: [releaseVersion], releaseFreezes: [releaseFreeze] },
  );
  assert.equal(report.releaseVersionManifest.manifestSource, "submitted_workflow_release_version");
  assert.equal(report.releaseVersionManifest.submittedReleaseVersionId, "release-version-submitted");
  assert.equal(report.releaseVersionManifest.submittedReleaseFreezeId, "release-freeze-submitted");
  assert.equal(report.releaseVersionManifest.linkedArtifactStatus, "release_manifest_links_current_artifacts");
  assert.equal(report.releaseVersionManifest.effectiveArtifactIds.phaseGateBundleId, `implementation-phase-gate-bundle-${releaseId}`);
  assert.equal(report.releaseVersionManifest.effectiveArtifactIds.phaseGateBundleHash, `sha256:implementation-phase-gate-bundle-${releaseId}`);
  assert.equal(report.releaseVersionManifest.freezeEvidence.freezeStatus, "candidate_freeze_recorded");
  assert.equal(report.releaseVersionManifest.currentStatus, "incomplete_against_october_target");
  assert.equal(
    report.releaseVersionManifest.submittedTargetScaleStatus,
    "not_target_scale_until_120_positions_360_critiques_1440_blind_ratings",
  );
  assert.equal(
    report.releaseVersionManifest.freezeEvidence.submittedTargetScaleStatus,
    "not_target_scale_until_120_positions_360_critiques_1440_blind_ratings",
  );
  assert.equal(report.releaseVersionManifest.targetScaleStatus, OCTOBER_TARGET_SCALE_INCOMPLETE_STATUS);
  assert.equal(report.releaseVersionManifest.freezeEvidence.targetScaleStatus, OCTOBER_TARGET_SCALE_INCOMPLETE_STATUS);
  assert.equal(report.releaseVersionManifest.releaseUseStatus, "submitted_release_manifest_recorded_but_target_scale_incomplete");
  assert.ok(report.releaseVersionManifest.linkedArtifactChecks.every((check) => check.status === "matches_current_artifact"));
  assert.deepEqual(
    report.releaseVersionManifest.linkedArtifactChecks.map((check) => check.artifact),
    [
      "corpus_manifest",
      "label_snapshot",
      "metric_config",
      "release_gate_profile",
      "implementation_phase_gate_bundle",
      "implementation_phase_gate_bundle_hash",
    ],
  );
  assert.equal(report.releaseVersionManifest.releaseVersionContractViolations.length, 0);
  assert.ok(report.releaseVersionManifest.releaseVersionContractChecks.every((check) => check.status === "pass"));

  const contractReviewReport = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      releaseVersions: [
        {
          ...releaseVersion,
          id: "release-version-contract-review",
          releaseConfigManifestHash: "release-config-manifest-without-sha256-prefix",
          immutableOutputArtifactIds: [],
        },
      ],
      releaseFreezes: [releaseFreeze],
    },
  );
  assert.equal(contractReviewReport.releaseVersionManifest.linkedArtifactStatus, "release_manifest_links_current_artifacts");
  assert.equal(contractReviewReport.releaseVersionManifest.releaseUseStatus, "submitted_release_manifest_contract_review_required");
  assert.deepEqual(
    contractReviewReport.releaseVersionManifest.releaseVersionContractViolations.map((check) => check.field),
    ["immutableOutputArtifactIds", "releaseConfigManifestHash"],
  );

  const staleReport = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      releaseVersions: [{ ...releaseVersion, id: "release-version-stale", corpusManifestId: "corpus-stale-release" }],
      releaseFreezes: [releaseFreeze],
    },
  );
  assert.equal(staleReport.releaseVersionManifest.linkedArtifactStatus, "release_manifest_link_review_required");
  assert.deepEqual(
    staleReport.releaseVersionManifest.mismatchedLinkChecks.map((check) => check.artifact),
    ["corpus_manifest"],
  );
  assert.equal(staleReport.releaseVersionManifest.releaseUseStatus, "submitted_release_manifest_requires_link_review");
});

test("certification audit enforces gold-pack isolation without treating model judges as gold", () => {
  const audit = buildCertificationAudit();
  assert.equal(audit.targetGoldLibraryItems, 60);
  assert.equal(audit.goldLibraryStatus, "incomplete");
  assert.deepEqual(audit.modelJudgeGoldViolations, []);
  assert.ok(audit.trainingExposureOnly);
  assert.equal(audit.packs[0].totalRequiredItems, 30);
  assert.ok(audit.packs.every((pack) => pack.clusterIsolationStatus === "pass"));
  assert.equal(audit.activeCertificationThresholdPolicyId, "certification-threshold-policy-october-2026-demo");
  assert.deepEqual(audit.requiredCertificationThresholds, certificationThresholds);
  assert.deepEqual(audit.requiredCertificationCadencePolicy, certificationCadencePolicy);
  assert.deepEqual(audit.activeCertificationThresholdPolicy.cadencePolicy, certificationCadencePolicy);
  assert.equal(audit.thresholdPolicyReleaseUseStatus, "seed_certification_threshold_policy_active");
  assert.equal(audit.certificationRecordEvidence.releaseUseStatus, "no_submitted_certification_records");
});

test("submitted CertificationRecord artifacts become certification gatekeeping evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-certification-record-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      certificationThresholdPolicies: [certificationThresholdPolicy("certification-threshold-policy-release-test-submitted")],
      certificationRecords: [
        {
          id: "certification-record-submitted",
          raterId: "demo-rater",
          packVersion: "cert-tier-zero-2026-10",
          certificationThresholdPolicyId: "certification-threshold-policy-release-test-submitted",
          rubricVersion: "lmca-app-f-2026-10",
          goldItemIds: ["gold-ai-selectivity"],
          duplicateItemIds: ["gold-low-clarity-obfuscation"],
          hardAmbiguityItemIds: ["gold-priced-in-objection"],
          protectedSplitConflictCheck: "training_exposure_only_no_hidden_or_validation_overlap",
          trainingExposureAcknowledged: true,
          customWeightedLoss: 0.11,
          pairwiseError: 0.08,
          duplicateInconsistency: 0.04,
          perDimensionCalibrationError: { centrality: 0.07, strength: 0.09, correctness: 0.1 },
          tierUnlocked: "graduate_live_rating",
        },
      ],
    },
  );
  const evidence = report.certification.certificationRecordEvidence;
  assert.equal(report.certification.thresholdPolicyReleaseUseStatus, "submitted_certification_threshold_policy_active");
  assert.equal(report.certification.activeCertificationThresholdPolicyId, "certification-threshold-policy-release-test-submitted");
  assert.deepEqual(report.certification.certificationThresholdPolicyRows.at(-1).thresholds, certificationThresholds);
  assert.deepEqual(report.certification.certificationThresholdPolicyRows.at(-1).cadencePolicy, certificationCadencePolicy);
  assert.equal(evidence.submittedRecordCount, 1);
  assert.equal(evidence.certifiedRecordCount, 1);
  assert.equal(evidence.reviewRows.length, 0);
  assert.equal(evidence.rows[0].recordSource, "submitted_workflow_certification_record");
  assert.equal(evidence.rows[0].certificationThresholdPolicyId, "certification-threshold-policy-release-test-submitted");
  assert.equal(evidence.rows[0].thresholdPolicyStatus, "certification_threshold_policy_matched");
  assert.deepEqual(evidence.rows[0].thresholdsApplied, certificationThresholds);
  assert.equal(evidence.rows[0].rubricStatus, "certification_record_matches_pack_rubric");
  assert.equal(evidence.rows[0].protectedSplitConflictStatus, "protected_split_excluded_training_exposure_acknowledged");
  assert.equal(evidence.rows[0].scoreStatus, "certification_scores_within_policy");
  assert.equal(evidence.rows[0].tierUnlockStatus, "tier_unlocked_recorded");
  assert.equal(evidence.releaseUseStatus, "submitted_certification_records_gatekeeping_evidence_complete");
});

test("certification threshold policy drift keeps certification records under review", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-certification-policy-drift-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const driftedPolicy = {
    ...certificationThresholdPolicy("certification-threshold-policy-drifted"),
    thresholds: { ...certificationThresholds, meanAbsErrorMax: 0.2 },
  };
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      certificationThresholdPolicies: [driftedPolicy],
      certificationRecords: [
        {
          id: "certification-record-drifted-policy",
          raterId: "demo-rater",
          packVersion: "cert-tier-zero-2026-10",
          certificationThresholdPolicyId: "certification-threshold-policy-drifted",
          rubricVersion: "lmca-app-f-2026-10",
          goldItemIds: ["gold-ai-selectivity"],
          duplicateItemIds: ["gold-low-clarity-obfuscation"],
          hardAmbiguityItemIds: ["gold-priced-in-objection"],
          protectedSplitConflictCheck: "training_exposure_only_no_hidden_or_validation_overlap",
          trainingExposureAcknowledged: true,
          recertificationReason: "initial_certification_for_october_release",
          customWeightedLoss: 0.11,
          pairwiseError: 0.08,
          duplicateInconsistency: 0.04,
          perDimensionCalibrationError: { centrality: 0.07, strength: 0.09, correctness: 0.1 },
          tierUnlocked: "graduate_live_rating",
        },
      ],
    },
  );
  assert.equal(report.certification.thresholdPolicyReleaseUseStatus, "submitted_certification_threshold_policy_review_required");
  assert.equal(report.certification.activeCertificationThresholdPolicyId, "certification-threshold-policy-release-test");
  assert.equal(report.certification.thresholdPolicyReviewRows[0].reviewReasons.includes("thresholds"), true);
  assert.equal(report.certification.certificationRecordEvidence.rows[0].thresholdPolicyStatus, "certification_threshold_policy_review_required");
  assert.equal(report.certification.certificationRecordEvidence.releaseUseStatus, "submitted_certification_records_require_review");
});

test("certification cadence policy drift keeps submitted threshold policies under review", () => {
  const driftedPolicy = {
    ...certificationThresholdPolicy("certification-threshold-policy-cadence-drifted"),
    cadencePolicy: {
      ...certificationCadencePolicy,
      goldInjectionSchedule: {
        ...certificationCadencePolicy.goldInjectionSchedule,
        hiddenGoldEveryNReleaseCriticalAssignments: 25,
      },
    },
  };
  const audit = buildCertificationAudit(certificationPacks, goldLibraryItems, undefined, {
    releaseId: "release-test",
    certificationThresholdPolicies: [driftedPolicy],
  });
  assert.equal(audit.thresholdPolicyReleaseUseStatus, "submitted_certification_threshold_policy_review_required");
  assert.equal(audit.activeCertificationThresholdPolicyId, "certification-threshold-policy-release-test");
  assert.equal(audit.thresholdPolicyReviewRows[0].reviewReasons.includes("cadencePolicy"), true);
});

test("submitted gold items count toward release gold-library readiness", () => {
  const submittedGoldItem = {
    id: "gold-submitted-workflow",
    positionId: "pos-ai-prior",
    critiqueId: "crit-ai-base-rate",
    itemId: "pos-ai-prior::crit-ai-base-rate",
    adjudicatedScores: { overall: 0.72 },
    adjudicationRationale: "Human adjudicated workflow gold item.",
    protectedEvaluationExclusion: true,
  };
  const releaseGoldItems = buildReleaseGoldLibraryItems([submittedGoldItem], positions);
  const normalizedGoldItem = releaseGoldItems.find((item) => item.id === "gold-submitted-workflow");
  assert.equal(releaseGoldItems.length, goldLibraryItems.length + 1);
  assert.equal(normalizedGoldItem.clusterId, "cluster-ai-prior");
  assert.equal(normalizedGoldItem.humanAdjudicated, true);
  assert.equal(normalizedGoldItem.protectedSplitExcluded, true);

  const snapshot = createLabelSnapshot(
    "snapshot-test-gold-readiness",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    { goldItems: [submittedGoldItem] },
  );
  assert.equal(report.certification.loadedGoldLibraryItems, goldLibraryItems.length + 1);
  assert.equal(report.targetGaps.goldItemsRemaining, 60 - (goldLibraryItems.length + 1));
  assert.equal(report.protectedSplitIsolation.goldRows.some((row) => row.itemId === "gold-submitted-workflow"), true);
  assert.equal(report.protectedSplitIsolation.goldRows.find((row) => row.itemId === "gold-submitted-workflow").isolationStatus, "pass");
});

test("protected split isolation report logs deprotection exceptions and claim exclusions", () => {
  const report = buildProtectedSplitIsolationReport("release-test", positions, certificationPacks, goldLibraryItems);
  assert.equal(report.counts.positionClusterCount, 3);
  assert.equal(report.counts.protectedCrossSplitClusterCount, 0);
  assert.equal(report.counts.deprotectionExceptionCount, 0);
  assert.equal(report.counts.certificationPackOverlapCount, 0);
  assert.equal(report.counts.goldProtectedOverlapCount, 0);
  assert.equal(report.counts.ordinaryClaimExcludedCount, 0);
  assert.equal(report.releaseUseStatus, "protected_split_cluster_isolation_pass");
  assert.ok(report.packRows.every((row) => row.isolationStatus === "pass"));
  assert.ok(report.goldRows.every((row) => row.isolationStatus === "pass"));

  const contaminatedPositions = positions.map((position) =>
    position.id === "pos-voting" ? { ...position, clusterId: "cluster-ai-prior" } : position,
  );
  const contaminatedReport = buildProtectedSplitIsolationReport(
    "release-test",
    contaminatedPositions,
    certificationPacks,
    goldLibraryItems,
  );
  const contaminatedRow = contaminatedReport.protectedCrossSplitRows.find((row) => row.clusterId === "cluster-ai-prior");
  assert.deepEqual(contaminatedRow.splits, ["internal_validation", "public_train"]);
  assert.equal(contaminatedRow.isolationStatus, "blocked_unlogged_protected_cross_split");
  assert.equal(contaminatedReport.counts.protectedCrossSplitClusterCount, 1);
  assert.equal(contaminatedReport.counts.unloggedProtectedCrossSplitClusterCount, 1);
  assert.equal(contaminatedReport.counts.ordinaryClaimExcludedCount, 1);
  assert.equal(contaminatedReport.releaseUseStatus, "protected_split_isolation_review_required");

  const exceptionReport = buildProtectedSplitIsolationReport(
    "release-test",
    contaminatedPositions,
    certificationPacks,
    goldLibraryItems,
    {
      deprotectionExceptions: [
        {
          id: "deprotect-cluster-ai-prior",
          clusterId: "cluster-ai-prior",
          fromSplit: "public_train",
          toSplit: "internal_validation",
          loggedAt: "2026-10-01T00:00:00.000Z",
          reason: "Synthetic cluster move for exception-ledger coverage.",
          excludedFromOrdinaryHiddenBenchmarkClaims: true,
        },
      ],
    },
  );
  assert.equal(exceptionReport.protectedCrossSplitRows[0].isolationStatus, "deprotection_exception_logged_excluded");
  assert.equal(exceptionReport.counts.unloggedProtectedCrossSplitClusterCount, 0);
  assert.equal(exceptionReport.counts.deprotectionExceptionCount, 1);
  assert.equal(exceptionReport.counts.ordinaryClaimExcludedCount, 1);
  assert.equal(exceptionReport.releaseUseStatus, "protected_split_exceptions_logged_excluded_from_claims");

  const overlappingPackReport = buildProtectedSplitIsolationReport(
    "release-test",
    positions,
    [{ ...certificationPacks[0], hiddenBenchmarkClusterOverlap: ["cluster-mind"] }],
    goldLibraryItems,
  );
  assert.equal(overlappingPackReport.counts.certificationPackOverlapCount, 1);
  assert.equal(overlappingPackReport.packRows[0].isolationStatus, "blocked_gold_certification_protected_overlap");
  assert.equal(overlappingPackReport.releaseUseStatus, "protected_split_isolation_review_required");
});

test("certification scoring reports per-dimension calibration and rater status", () => {
  const scored = scoreCertificationAttempt(seedCertificationAttempts[0]);
  assert.equal(scored.status, "restricted_pending_retraining");
  assert.equal(scored.completionPass, true);
  assert.equal(scored.restrictionFlags.length, 0);
  assert.deepEqual(scored.targetedRetrainingFlags, ["correctness"]);
  assert.equal(scored.dimensionMeanAbsError.correctness, 0.17);

  const report = buildRaterCertificationReport("demo-rater", seedCertificationAttempts);
  assert.equal(report.currentStatus, "restricted_pending_retraining");
  assert.equal(report.certified, false);
  assert.equal(report.availablePacks[0].totalRequiredItems, 30);
});

test("rubric version drift report exposes recertification triggers and rater calibration flags", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-rubric-drift",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildRubricVersionDriftReport("release-test", snapshot, seedRatings, seedCertificationAttempts);
  assert.equal(report.currentRubricVersion, "lmca-app-f-2026-10");
  assert.deepEqual(report.ratingRubricVersionCounts, { "lmca-app-f-2026-10": 7 });
  assert.equal(report.mixedRubricSnapshotStatus, "single_rubric_version_current");
  assert.equal(report.counts.recertificationOrGrandfatheringReviewCount, 0);
  assert.equal(report.counts.ratersWithTargetedRetrainingFlags, 1);
  assert.equal(report.counts.ratersWithRestrictionFlags, 0);
  assert.equal(report.raterCalibrationRows[0].dimensionMeanAbsError.correctness, 0.17);
  assert.deepEqual(report.raterCalibrationRows[0].targetedRetrainingFlags, ["correctness"]);
  assert.equal(report.releaseUseStatus, "rater_retraining_or_restriction_flags_active");

  const oldAttempt = {
    ...seedCertificationAttempts[0],
    id: "cert-attempt-old-rubric",
    rubricVersion: "lmca-app-f-2026-09",
  };
  const oldGold = {
    ...goldLibraryItems[0],
    id: "gold-old-rubric",
    rubricVersion: "lmca-app-f-2026-09",
  };
  const outdatedReport = buildRubricVersionDriftReport(
    "release-test",
    snapshot,
    seedRatings,
    [oldAttempt],
    certificationPacks,
    [oldGold],
  );
  assert.equal(outdatedReport.counts.recertificationOrGrandfatheringReviewCount, 2);
  assert.equal(outdatedReport.counts.raterAttemptRecertificationRequiredCount, 1);
  assert.deepEqual(
    outdatedReport.reviewRows.map((row) => row.kind).sort(),
    ["gold_item", "rater_certification_attempt"],
  );
  assert.equal(outdatedReport.releaseUseStatus, "rubric_version_recertification_review_required");
});

test("provenance and rights audit is split-aware", () => {
  const publicAudit = auditProvenanceRights("public", positions);
  assert.equal(publicAudit.status, "pass");
  assert.equal(publicAudit.checkedPositionCount, 1);
  assert.ok(publicAudit.adaptedSourceFieldsPresent);

  const trainingAudit = auditProvenanceRights("training", positions);
  assert.equal(trainingAudit.status, "pass");

  const hiddenAudit = auditProvenanceRights("hidden_benchmark", positions);
  assert.equal(hiddenAudit.status, "pass");
});

test("submitted rights records update release rights audits without broadening scopes", () => {
  const hiddenCandidatePositions = positions.map((position) =>
    position.id === "pos-ai-prior" ? { ...position, split: "hidden_benchmark" } : position,
  );
  const publicOnlyRecords = buildReleaseRightsRecords([
    {
      id: "rights-public-only",
      artifactId: "pos-ai-prior::crit-ai-base-rate",
      rightsStatus: "public_export_allowed",
    },
  ]);
  const publicOnlyHiddenAudit = auditProvenanceRights("hidden_benchmark", hiddenCandidatePositions, publicOnlyRecords);
  assert.equal(publicOnlyHiddenAudit.status, "blocked");
  assert.deepEqual(publicOnlyHiddenAudit.releaseScopeFailures, ["pos-ai-prior"]);

  const hiddenRecords = buildReleaseRightsRecords([
    {
      id: "rights-hidden",
      releaseId: "release-test",
      rightsClearancePolicyId: "rights-clearance-policy-release-test",
      artifactId: "pos-ai-prior::crit-ai-base-rate",
      artifactKind: "position_critique_item",
      sourceOrigin: "project_authored_hidden_benchmark_candidate",
      legalBasis: "project_owned",
      clearanceStandard: "project-owned clearance supports internal and hidden benchmark release scopes",
      evidenceArtifactIds: rightsEvidenceByLegalBasis.project_owned,
      licenseType: "project_owned_or_public_domain",
      rightsStatus: "hidden_benchmark_export_allowed",
      releaseScope: "internal_and_hidden_benchmark_export_allowed",
      legalReviewJurisdiction: "US",
      thirdPartyContentCheck: "third-party content checked and none detected",
      takedownOrRemovalSlaDays: 14,
      reviewerId: "release-admin",
      reviewedAt: "2026-10-01T00:00:00.000Z",
      sourceLanguage: "en",
      translationRoute: "none_original_english",
      taskFormat: "short essay claim",
      sourceDomainSuitability: "suitable_conceptual",
      removalPolicy: "tombstone_and_rebuild_export_manifest",
    },
  ]);
  const hiddenAudit = auditProvenanceRights("hidden_benchmark", hiddenCandidatePositions, hiddenRecords);
  assert.equal(hiddenAudit.status, "pass");
  assert.deepEqual(hiddenAudit.releaseScopeFailures, []);
  assert.deepEqual(hiddenAudit.unclearedRecords, []);
  assert.deepEqual(hiddenAudit.submittedRightsRecordContractFailures, []);

  const underdeclaredHiddenRecords = buildReleaseRightsRecords([
    {
      id: "rights-hidden-underdeclared",
      artifactId: "pos-ai-prior::crit-ai-base-rate",
      rightsStatus: "hidden_benchmark_export_allowed",
      legalBasis: "project_owned",
      sourceLanguage: "en",
      translationRoute: "none_original_english",
      taskFormat: "short essay claim",
      sourceDomainSuitability: "suitable_conceptual",
    },
  ]);
  const underdeclaredHiddenAudit = auditProvenanceRights("hidden_benchmark", hiddenCandidatePositions, underdeclaredHiddenRecords);
  assert.equal(underdeclaredHiddenAudit.status, "blocked");
  assert.deepEqual(underdeclaredHiddenAudit.releaseScopeFailures, []);
  assert.deepEqual(underdeclaredHiddenAudit.unclearedRecords, []);
  assert.deepEqual(underdeclaredHiddenAudit.submittedRightsRecordContractFailures[0].positionId, "pos-ai-prior");
  assert.ok(underdeclaredHiddenAudit.submittedRightsRecordContractFailures[0].contractViolations.includes("releaseId"));
  assert.ok(underdeclaredHiddenAudit.submittedRightsRecordContractFailures[0].contractViolations.includes("releaseScope"));
  assert.ok(underdeclaredHiddenAudit.submittedRightsRecordContractFailures[0].contractViolations.includes("reviewerId"));
  assert.ok(underdeclaredHiddenAudit.submittedRightsRecordContractFailures[0].contractViolations.includes("removalPolicy"));
});

test("release report derives rights-review evidence from submitted workflow actions", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-rights-review-evidence",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      rightsClearancePolicies: [
        {
          id: "rights-clearance-policy-release-test-submitted",
          policyVersion: "rights-clearance-rlhf90-v1",
          allowedLegalBases: rightsLegalBases,
          requiredEvidenceByLegalBasis: rightsEvidenceByLegalBasis,
          releaseScopeStandards: rightsScopeStandards,
          takedownOrRemovalSlaDays: 14,
          publicReleaseRule:
            "public or training export requires project-owned, public-domain, open-license, explicit-permission, or approved fair-use memo evidence with attribution and removal plan",
          hiddenBenchmarkRule:
            "hidden-benchmark use may rely on internal-only restricted clearance only when raw public release is blocked and access control is documented",
          reviewerIndependenceRule: "rights reviewer must be independent from item author when legal basis is fair-use memo or explicit permission",
          frozenAt: "2026-10-01T00:00:00.000Z",
        },
      ],
      rightsRecords: [
        {
          id: "rights-record-public-ai-prior",
          releaseId: "release-test",
          rightsClearancePolicyId: "rights-clearance-policy-release-test-submitted",
          artifactId: "pos-ai-prior::crit-ai-base-rate",
          artifactKind: "position_critique_item",
          sourceOrigin: "project_authored_public_item",
          legalBasis: "project_owned",
          clearanceStandard: "project-owned clearance supports public export release scope",
          evidenceArtifactIds: rightsEvidenceByLegalBasis.project_owned,
          licenseType: "project_owned_or_public_domain",
          rightsStatus: "public_export_allowed",
          releaseScope: "public_export",
          legalReviewJurisdiction: "US",
          thirdPartyContentCheck: "third-party content checked and none detected",
          takedownOrRemovalSlaDays: 14,
          reviewerId: "rights-admin",
          reviewedAt: "2026-06-12T09:55:00.000Z",
          sourceLanguage: "en",
          translationRoute: "transcribed_competitive_debate_speeches",
          taskFormat: "competitive_debate_speech_with_judge_rating_context",
          sourceDatasetName: "DebateBench",
          sourceSubsource: "DebateBench",
          sourceDomainSuitability: "argumentative_debate_material_not_ordinary_conceptual_position_by_default",
          singleTopicConcentration: "competitive_debate_topic_specific",
          lsatDerived: false,
          removalPolicy: "tombstone_and_rebuild_export_manifest",
        },
      ],
      rightsReviews: [
        {
          id: "rights-review-public-ai-prior",
          rightsClearancePolicyId: "rights-clearance-policy-release-test-submitted",
          itemId: "pos-ai-prior::crit-ai-base-rate",
          reviewerId: "rights-admin",
          rightsStatus: "public_export_allowed",
          releaseScope: "public_export",
          reviewedAt: "2026-06-12T10:00:00.000Z",
        },
        {
          id: "rights-review-public-voting-mismatch",
          rightsClearancePolicyId: "rights-clearance-policy-release-test-submitted",
          itemId: "pos-voting::crit-voting-bullet",
          reviewerId: "rights-admin",
          rightsStatus: "public_export_allowed",
          releaseScope: "public_export",
          reviewedAt: "2026-06-12T10:05:00.000Z",
        },
      ],
    },
  );

  assert.equal(report.rightsReviewEvidence.counts.submittedReviewCount, 2);
  assert.equal(report.rightsReviewEvidence.counts.submittedRightsClearancePolicyCount, 1);
  assert.deepEqual(report.rightsReviewEvidence.requiredEvidenceByLegalBasis.project_owned, rightsEvidenceByLegalBasis.project_owned);
  assert.equal(report.rightsReviewEvidence.counts.completeReviewCount, 1);
  assert.equal(report.rightsReviewEvidence.counts.reviewRequiredCount, 1);
  assert.equal(report.rightsReviewEvidence.releaseUseStatus, "rights_review_evidence_review_required");
  const publicSourceDetail = report.corpusManifest.sourceDetailRows.find((row) => row.positionId === "pos-ai-prior");
  assert.equal(publicSourceDetail.sourceDatasetName, "DebateBench");
  assert.equal(publicSourceDetail.sourceSubsource, "DebateBench");
  assert.equal(publicSourceDetail.translationRoute, "transcribed_competitive_debate_speeches");
  assert.equal(publicSourceDetail.sourceTaskFormat, "competitive_debate_speech_with_judge_rating_context");
  assert.equal(publicSourceDetail.sourceDomainSuitability, "argumentative_debate_material_not_ordinary_conceptual_position_by_default");
  assert.equal(publicSourceDetail.sourceDomainConcentration, "competitive_debate_topic_specific");
  const completeRow = report.rightsReviewEvidence.rows.find((row) => row.id === "rights-review-public-ai-prior");
  assert.equal(completeRow.status, "rights_review_evidence_complete");
  assert.equal(completeRow.rightsRecordId, "rights-record-public-ai-prior");
  assert.equal(completeRow.rightsClearancePolicyId, "rights-clearance-policy-release-test-submitted");
  const mismatchRow = report.rightsReviewEvidence.rows.find((row) => row.id === "rights-review-public-voting-mismatch");
  assert.equal(mismatchRow.releaseScopeCovered, false);
  assert.equal(mismatchRow.reviewReasons.includes("release_scope_not_covered_by_rights_record"), true);
});

test("release report derives assignment-flag evidence from blind-safe workflow actions", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-assignment-flag-evidence",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      assignmentFlags: [
        {
          id: "flag-topic-fit-core",
          assignmentId: "assign-ai-base-rate",
          raterId: "rater-a",
          reasonCode: "insufficient_topic_expertise",
          notes: "Blind-safe topic-fit review request.",
        },
        {
          id: "flag-unsupported-core",
          assignmentId: "assign-missing",
          raterId: "rater-a",
          reasonCode: "hidden_benchmark_guess",
        },
      ],
    },
  );

  assert.equal(report.assignmentFlagEvidence.counts.submittedFlagCount, 2);
  assert.equal(report.assignmentFlagEvidence.counts.completeFlagCount, 1);
  assert.equal(report.assignmentFlagEvidence.counts.reviewRequiredCount, 1);
  assert.equal(report.assignmentFlagEvidence.counts.topicFitFlagCount, 1);
  assert.equal(report.assignmentFlagEvidence.releaseUseStatus, "assignment_flag_evidence_review_required");
  const topicFitRow = report.assignmentFlagEvidence.rows.find((row) => row.id === "flag-topic-fit-core");
  assert.equal(topicFitRow.status, "assignment_flag_evidence_complete");
  assert.equal(topicFitRow.excludedFromRatingDenominator, true);
  const unsupportedRow = report.assignmentFlagEvidence.rows.find((row) => row.id === "flag-unsupported-core");
  assert.equal(unsupportedRow.reviewReasons.includes("assignment_not_found"), true);
  assert.equal(unsupportedRow.reviewReasons.includes("reasonCode:unsupported"), true);
});

test("release report derives assignment workflow evidence for blinding eligibility order and pacing", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-assignment-workflow-evidence",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const completeAssignment = {
    id: "assignment-workflow-core",
    raterId: "rater-a",
    raterSessionId: "rater-session-core",
    positionId: "pos-ai-prior",
    critiqueId: "crit-ai-base-rate",
    assignmentType: "live",
    workflowProfileId: "workflow-profile-core",
    workflowProfileVersion: "workflow-profile-rlhf90-v1",
    scoreInputPolicyId: "score-input-policy-core",
    requiredUiPanelSet: ["score_fields", "safe_decline", "source_recognition"],
    optionalUiPanelSet: ["evidence_spans"],
    preRatingSelfScreenStatus: "passed",
    raterItemConflictCheckStatus: "no_conflict",
    independentBlindEligibilityStatus: "eligible",
    declineOrReassignmentStatus: "not_declined",
    blindState: "blind_initial",
    sourceTagVisibilityState: "hidden_before_initial_lock",
    topicRoutingBasisAdminOnly: "topic competence only; no source tags exposed",
    validationMembershipBlindToRater: true,
    ratingContextSnapshotId: "rc-target-only-1",
    samePositionSessionId: "same-position-session-core",
    samePositionOrderPolicy: "counterbalanced",
    orderCounterbalanceBucket: "bucket-a",
    positionOrderIndex: 0,
    siblingCritiquesSeenPriorCount: 0,
    siblingCritiquesSeenPriorIds: [],
    laterSiblingCritiquesAbsentAtSubmission: true,
    positionLengthBand: "short",
    critiqueLengthBand: "medium",
    expectedEffortBand: "ordinary_live",
    startedAt: "2026-10-01T00:00:00.000Z",
    activeTimeSeconds: 120,
    idleGapSummary: "none",
    interruptionCount: 0,
    draftAutosaveStatus: "saved_server_side",
    lastAutosavedAt: "2026-10-01T00:02:00.000Z",
    draftDependencyStaleStatus: "current",
    resumeCount: 0,
    sessionPacingState: "within_target",
    fatigueWarningState: "none",
    uiMode: "task_first_simplified",
    rubricAnchorPanelVersion: "appendix-f-anchor-v1",
    preSubmitLintPolicyVersion: "pre-submit-lint-v1",
  };
  const reviewAssignment = {
    ...completeAssignment,
    id: "assignment-workflow-core-review",
    raterSessionId: "missing-rater-session",
    requiredUiPanelSet: ["score_fields"],
    raterItemConflictCheckStatus: "unchecked",
    validationMembershipBlindToRater: false,
    samePositionOrderPolicy: "source_order",
    laterSiblingCritiquesAbsentAtSubmission: false,
    draftDependencyStaleStatus: "stale_text_version",
  };
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      workflowAssignments: [completeAssignment, reviewAssignment],
      raterSessions: [{ id: "rater-session-core", raterId: "rater-a" }],
      ratingContextSnapshots,
      ratingWorkflowProfiles: [{ id: "workflow-profile-core" }],
      scoreInputPolicies: [{ id: "score-input-policy-core" }],
    },
  );

  assert.equal(report.assignmentWorkflowEvidence.counts.submittedAssignmentCount, 2);
  assert.equal(report.assignmentWorkflowEvidence.counts.completeAssignmentCount, 1);
  assert.equal(report.assignmentWorkflowEvidence.counts.reviewRequiredAssignmentCount, 1);
  assert.equal(report.assignmentWorkflowEvidence.counts.linkedRaterSessionCount, 1);
  assert.equal(report.assignmentWorkflowEvidence.counts.linkedRatingContextSnapshotCount, 2);
  assert.equal(report.assignmentWorkflowEvidence.counts.counterbalancedOrRandomizedOrderCount, 1);
  assert.equal(report.assignmentWorkflowEvidence.releaseUseStatus, "assignment_workflow_evidence_review_required");
  const completeRow = report.assignmentWorkflowEvidence.rows.find((row) => row.assignmentId === "assignment-workflow-core");
  assert.equal(completeRow.status, "assignment_workflow_evidence_complete");
  assert.equal(completeRow.blindingEligibilityStatus, "blind_initial_eligibility_complete");
  const reviewRow = report.assignmentWorkflowEvidence.rows.find((row) => row.assignmentId === "assignment-workflow-core-review");
  assert.equal(reviewRow.status, "assignment_workflow_evidence_review_required");
  assert.equal(reviewRow.reviewReasons.includes("raterSessionId:not_found"), true);
  assert.equal(reviewRow.reviewReasons.includes("requiredUiPanelSet:safe_decline"), true);
  assert.equal(reviewRow.reviewReasons.includes("requiredUiPanelSet:source_recognition"), true);
  assert.equal(reviewRow.reviewReasons.includes("raterItemConflictCheckStatus"), true);
  assert.equal(reviewRow.reviewReasons.includes("validationMembershipBlindToRater"), true);
  assert.equal(reviewRow.reviewReasons.includes("samePositionOrderPolicy"), true);
  assert.equal(reviewRow.reviewReasons.includes("laterSiblingCritiquesAbsentAtSubmission"), true);
  assert.equal(reviewRow.reviewReasons.includes("draftDependencyStaleStatus"), true);
});

test("active-learning audit reports denominator flow and preserves blinding", () => {
  const audit = buildActiveLearningAudit();
  assert.equal(audit.totals.generated, 42);
  assert.equal(audit.totals.judged, 12);
  assert.equal(audit.totals.promoted, 5);
  assert.equal(audit.blindingPass, true);
  assert.deepEqual(audit.acceptedCritiqueIds.sort(), ["crit-ai-generic", "crit-voting-style"]);
});

test("submitted active-learning selection audits update denominator and reason-code evidence", () => {
  const audit = buildActiveLearningAudit(undefined, [
      {
        id: "selection-audit-submitted",
        candidateBatchId: "candidate-batch-submitted",
        positionId: "pos-ai-prior",
        activeLearningSelectionPolicyId: "active-learning-selection-policy-release-test-submitted",
        selectionThresholds: activeLearningSelectionThresholds,
        generatedOrIngestedCount: 20,
        judgedCount: 18,
        disagreementSelectedCount: 3,
      highRatedSelectedCount: 2,
      suspectedJudgeFalsePositiveCount: 1,
      humanSelectedForDiversityCount: 3,
      humanSelectedForSuitabilityCount: 2,
      humanSelectedForInterestingnessCount: 1,
      rejectedCountByReason: { near_duplicate: 5, rights_unclear: 0, low_marginal_informativeness: 3 },
      promotedToRatingCount: 4,
      acceptedCritiqueIds: ["crit-submitted-active-learning"],
    },
  ], {
    releaseId: "release-test",
    activeLearningSelectionPolicies: [activeLearningSelectionPolicy("active-learning-selection-policy-release-test-submitted")],
  });
  assert.equal(audit.totals.generated, 62);
  assert.equal(audit.totals.judged, 30);
  assert.equal(audit.totals.disagreementSelected, 7);
  assert.equal(audit.totals.highRated, 5);
  assert.equal(audit.totals.suspectedJudgeFalsePositive, 2);
  assert.equal(audit.totals.handSelected, 11);
  assert.equal(audit.totals.rejected, 15);
  assert.equal(audit.totals.promoted, 9);
  assert.equal(audit.selectionPolicyEvidence.releaseUseStatus, "submitted_active_learning_selection_policy_active");
  assert.equal(audit.activeLearningSelectionPolicyId, "active-learning-selection-policy-release-test-submitted");
  assert.deepEqual(audit.requiredSelectionThresholds, activeLearningSelectionThresholds);
  assert.equal(audit.submittedSelectionAuditCount, 1);
  assert.deepEqual(audit.submittedSelectionAuditIds, ["selection-audit-submitted"]);
  assert.equal(audit.submittedSelectionAuditContractViolationCount, 0);
  const submittedBatch = audit.batches.find((batch) => batch.selectionAuditId === "selection-audit-submitted");
  assert.equal(submittedBatch.selectionAuditContractStatus, "selection_audit_contract_complete");
  assert.equal(submittedBatch.activeLearningSelectionPolicyId, "active-learning-selection-policy-release-test-submitted");
  assert.deepEqual(submittedBatch.selectionThresholdsApplied, activeLearningSelectionThresholds);
  assert.equal(submittedBatch.humanSelectedForSuitability, 2);
  assert.equal(submittedBatch.humanSelectedForInterestingness, 1);
  assert.equal(audit.selectionReasonCounts.judge_disagreement, 3);
  assert.equal(audit.selectionReasonCounts.human_suitability_selection, 2);
  assert.equal(audit.selectionReasonCounts.human_interestingness_selection, 1);
  assert.equal(audit.rejectionReasonCounts.near_duplicate, 5);
  assert.equal(audit.batches.find((batch) => batch.selectionAuditId === "selection-audit-submitted").batchSource, "submitted_workflow_selection_audit");

  const driftedPolicyAudit = buildActiveLearningAudit(undefined, [], {
    releaseId: "release-test",
    activeLearningSelectionPolicies: [
      {
        ...activeLearningSelectionPolicy("active-learning-selection-policy-drifted"),
        thresholds: { ...activeLearningSelectionThresholds, highRatedOverallScoreMin: 0.8 },
      },
    ],
  });
  assert.equal(driftedPolicyAudit.selectionPolicyEvidence.releaseUseStatus, "submitted_active_learning_selection_policy_review_required");
  assert.equal(driftedPolicyAudit.activeLearningSelectionPolicyId, "active-learning-selection-policy-release-test");
  assert.equal(driftedPolicyAudit.selectionPolicyEvidence.reviewRows[0].reviewReasons.includes("thresholds"), true);

  const malformedAudit = buildActiveLearningAudit(undefined, [
    {
      id: "selection-audit-malformed",
      candidateBatchId: "candidate-batch-submitted",
      generatedOrIngestedCount: 20,
      judgedCount: 18,
      disagreementSelectedCount: 3,
      highRatedSelectedCount: 2,
      suspectedJudgeFalsePositiveCount: 1,
      humanSelectedForDiversityCount: 3,
      humanSelectedForSuitabilityCount: 1,
      humanSelectedForInterestingnessCount: 1,
      promotedToRatingCount: 4,
    },
  ], { releaseId: "release-test" });
  assert.equal(malformedAudit.releaseUseStatus, "active_learning_selection_audit_review_required");
  assert.equal(malformedAudit.submittedSelectionAuditContractViolationCount, 1);
  assert.equal(
    malformedAudit.batches.find((batch) => batch.selectionAuditId === "selection-audit-malformed").selectionAuditContractStatus,
    "selection_audit_contract_review_required",
  );
  assert.ok(
    malformedAudit.submittedSelectionAuditContractViolationRows[0].selectionAuditContractViolations.some((check) => check.field === "positionId"),
  );
  assert.ok(
    malformedAudit.submittedSelectionAuditContractViolationRows[0].selectionAuditContractViolations.some((check) => check.field === "rejectedCountByReason"),
  );
  assert.ok(
    malformedAudit.submittedSelectionAuditContractViolationRows[0].selectionAuditContractViolations.some((check) => check.field === "selectionThresholds"),
  );
});

test("submitted candidate intake workflow artifacts produce active-learning denominator evidence", () => {
  const audit = buildActiveLearningAudit(undefined, [], {
    candidateBatches: [
      {
        id: "candidate-batch-submitted",
        positionId: "pos-ai-prior",
        generatorSourceDescription: "Mixed human and LLM-generated active-learning intake batch.",
        promptTemplateVersion: "critique-generator-v1",
        judgeModelSet: ["judge-model-a", "judge-model-b"],
        generatedOrIngestedCandidateCount: 20,
        judgedCandidateCount: 18,
        candidatePoolDenominatorPolicy: "all_generated_or_ingested_outputs_preserved_before_filtering",
        selectionPolicyVersion: "selection-policy-release-test-v1",
        selectionReasonHiddenFromInitialRaters: true,
        modelJudgeScoresVisibleToInitialRaters: false,
        batchStatus: "judged_pending_selection_audit",
        createdAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    candidateCritiques: [
      {
        id: "candidate-critique-submitted",
        candidateBatchId: "candidate-batch-submitted",
        positionId: "pos-ai-prior",
        text: "A generated critique that raises a new base-rate objection.",
        sourceType: "llm_generated",
        generationRoute: "active_learning_candidate_generation",
        rightsStatus: "project_owned_training_candidate",
        selectionReason: "judge_disagreement_and_new_objection_type",
        selectionReasonVisibleToRatersBeforeInitialLock: false,
        nearDuplicateClusterId: "near-duplicate-cluster-new-objection",
        marginalInformativenessRationale: "Adds a distinct base-rate objection not present in the existing critique set.",
        reviewStatus: "approved_for_live_queue",
      },
    ],
    modelJudgeScores: [
      {
        id: "model-judge-score-submitted",
        candidateId: "candidate-critique-submitted",
        candidateBatchId: "candidate-batch-submitted",
        judgeRequestedModelAlias: "judge-model-a",
        judgeProvider: "openai",
        judgeResolvedModelSnapshot: "judge-model-a-2026-10-01",
        promptVersion: "candidate-screening-v1",
        modelParameters: { temperature: 0 },
        aliasStabilityStatus: "resolved_snapshot_logged",
        rawOutput: "{\"overallScore\":0.71}",
        parseStatus: "parsed",
        overallScore: 0.71,
        disagreementStatistics: { judgePairSpread: 0.18 },
        timestamp: "2026-10-01T00:01:00.000Z",
        hiddenFromRatersBeforeInitialLock: true,
      },
    ],
    candidateReviews: [
      {
        id: "candidate-review-submitted",
        candidateId: "candidate-critique-submitted",
        reviewStatus: "approved_for_live_queue",
        inclusionReason: "judge_disagreement_and_new_objection_type",
      },
    ],
    candidatePromotions: [
      {
        id: "candidate-promotion-submitted",
        candidateId: "candidate-critique-submitted",
        acceptedCritiqueId: "crit-submitted-active-learning",
        sourceMetadataHiddenFromRaters: true,
      },
    ],
  });
  assert.equal(audit.derivedCandidateWorkflowBatchCount, 1);
  assert.equal(audit.releaseUseStatus, "active_learning_selection_denominators_audited");
  assert.equal(audit.candidateWorkflowContractViolationCount, 0);
  assert.equal(audit.candidateWorkflowEvidence.candidateBatchContractViolationCount, 0);
  assert.equal(audit.totals.generated, 62);
  assert.equal(audit.totals.judged, 30);
  assert.equal(audit.totals.promoted, 6);
  assert.equal(audit.totals.highRated, 4);
  assert.equal(audit.totals.handSelected, 6);
  assert.equal(audit.selectionReasonCounts.judge_disagreement, 1);
  assert.equal(audit.acceptedCritiqueIds.includes("crit-submitted-active-learning"), true);
  assert.equal(audit.candidateWorkflowEvidence.hiddenMetadataViolationCount, 0);
  assert.equal(audit.candidateWorkflowEvidence.rows[0].batchSource, "submitted_workflow_candidate_batch");
  assert.equal(audit.candidateWorkflowEvidence.rows[0].candidateWorkflowContractStatus, "candidate_workflow_contract_complete");
  assert.equal(audit.candidateWorkflowEvidence.rows[0].candidateBatchContractStatus, "candidate_batch_contract_complete");
  assert.equal(audit.candidateWorkflowEvidence.rows[0].candidateCritiqueContractViolationCount, 0);
  assert.equal(audit.candidateWorkflowEvidence.rows[0].modelJudgeScoreContractViolationCount, 0);
  assert.equal(audit.batches.find((batch) => batch.id === "candidate-batch-submitted").batchSource, "submitted_workflow_candidate_batch");

  const underdeclaredAudit = buildActiveLearningAudit(undefined, [], {
    candidateBatches: [
      {
        id: "candidate-batch-underdeclared",
        generatedOrIngestedCandidateCount: 20,
        judgedCandidateCount: 18,
        selectionReasonHiddenFromInitialRaters: true,
        modelJudgeScoresVisibleToInitialRaters: false,
        batchStatus: "judged_pending_selection_audit",
      },
    ],
  });
  assert.equal(underdeclaredAudit.releaseUseStatus, "candidate_workflow_evidence_review_required");
  assert.equal(underdeclaredAudit.candidateWorkflowContractViolationCount, 1);
  assert.equal(underdeclaredAudit.candidateWorkflowEvidence.rows[0].candidateBatchContractStatus, "candidate_batch_contract_review_required");
  assert.ok(
    underdeclaredAudit.candidateWorkflowEvidence.candidateBatchContractViolationRows[0].candidateBatchContractViolations.some(
      (check) => check.field === "positionId",
    ),
  );
  assert.ok(
    underdeclaredAudit.candidateWorkflowEvidence.candidateBatchContractViolationRows[0].candidateBatchContractViolations.some(
      (check) => check.field === "judgeModelSet",
    ),
  );

  const underdeclaredChildAudit = buildActiveLearningAudit(undefined, [], {
    candidateBatches: [
      {
        id: "candidate-batch-child-underdeclared",
        positionId: "pos-ai-prior",
        generatorSourceDescription: "Mixed human and LLM-generated active-learning intake batch.",
        promptTemplateVersion: "critique-generator-v1",
        judgeModelSet: ["judge-model-a", "judge-model-b"],
        generatedOrIngestedCandidateCount: 20,
        judgedCandidateCount: 18,
        candidatePoolDenominatorPolicy: "all_generated_or_ingested_outputs_preserved_before_filtering",
        selectionPolicyVersion: "selection-policy-release-test-v1",
        selectionReasonHiddenFromInitialRaters: true,
        modelJudgeScoresVisibleToInitialRaters: false,
        batchStatus: "judged_pending_selection_audit",
        createdAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    candidateCritiques: [
      {
        id: "candidate-critique-child-underdeclared",
        candidateBatchId: "candidate-batch-child-underdeclared",
        selectionReasonVisibleToRatersBeforeInitialLock: false,
      },
    ],
    modelJudgeScores: [
      {
        id: "model-judge-score-child-underdeclared",
        candidateId: "candidate-critique-child-underdeclared",
        candidateBatchId: "candidate-batch-child-underdeclared",
        overallScore: 0.71,
        hiddenFromRatersBeforeInitialLock: true,
      },
    ],
  });
  assert.equal(underdeclaredChildAudit.releaseUseStatus, "candidate_workflow_evidence_review_required");
  assert.equal(underdeclaredChildAudit.candidateWorkflowContractViolationCount, 1);
  assert.equal(underdeclaredChildAudit.candidateWorkflowEvidence.rows[0].candidateWorkflowContractStatus, "candidate_workflow_contract_review_required");
  assert.equal(underdeclaredChildAudit.candidateWorkflowEvidence.rows[0].candidateCritiqueContractViolationCount, 1);
  assert.equal(underdeclaredChildAudit.candidateWorkflowEvidence.rows[0].modelJudgeScoreContractViolationCount, 1);
  assert.ok(
    underdeclaredChildAudit.candidateWorkflowEvidence.rows[0].candidateCritiqueContractViolationRows[0].contractViolations.some(
      (check) => check.field === "positionId",
    ),
  );
  assert.ok(
    underdeclaredChildAudit.candidateWorkflowEvidence.rows[0].modelJudgeScoreContractViolationRows[0].contractViolations.some(
      (check) => check.field === "judgeRequestedModelAlias",
    ),
  );

  const leakedAudit = buildActiveLearningAudit(undefined, [], {
    candidateBatches: [{ id: "candidate-batch-leaky", generatedOrIngestedCandidateCount: 1 }],
    candidateCritiques: [{ id: "candidate-critique-leaky", candidateBatchId: "candidate-batch-leaky", selectionReasonVisibleToRatersBeforeInitialLock: true }],
    modelJudgeScores: [{ id: "model-judge-score-leaky", candidateId: "candidate-critique-leaky", hiddenFromRatersBeforeInitialLock: false }],
  });
  assert.equal(leakedAudit.blindingPass, false);
  assert.equal(leakedAudit.candidateWorkflowEvidence.hiddenMetadataViolationCount, 1);
});

test("candidate intake quality audit prevents redundant critiques from inflating scale claims", () => {
  const audit = buildCandidateIntakeQualityAudit("release-test", critiques, positions);
  assert.equal(audit.counts.totalCritiques, 5);
  assert.equal(audit.counts.unqualifiedScaleEligibleCritiques, 3);
  assert.equal(audit.counts.lowInformationOrArtifactControlCritiques, 2);
  assert.equal(audit.counts.activeLearningAcceptedCritiques, 2);
  assert.equal(audit.counts.acceptedLowInformationOrArtifactControlCritiques, 2);
  assert.equal(audit.counts.duplicateGeneratedOutputs, 1);
  assert.equal(audit.marginalInformativenessCounts.low_redundant, 1);
  assert.equal(audit.redundancyRiskCounts.artifact_control_not_quality_increment, 1);
  assert.equal(audit.redundancyRiskCounts.low_marginal_information_redundancy_risk, 1);
  assert.deepEqual(
    audit.lowInformationRows.map((row) => row.critiqueId).sort(),
    ["crit-ai-generic", "crit-voting-style"],
  );
  assert.equal(audit.duplicateOutputRows[0].duplicateOfOutputId, "gen-output-ai-generic");
  assert.equal(audit.positionRows[0].status, "mixed_information_quality_disclosed");
  assert.equal(audit.releaseUseStatus, "marginal_informativeness_audit_disclosed_low_redundancy_controls");
});

test("candidate generation intake checklist binds RLHF91 requirements to existing candidate architecture", () => {
  const report = buildOctoberReleaseReport();
  const checklist = report.candidateGenerationIntakeChecklist;

  assert.equal(checklist.releaseUseStatus, "candidate_generation_intake_requirements_evidenced");
  assert.equal(checklist.counts.checklistRows, 8);
  assert.equal(checklist.counts.reviewRequiredRows, 0);
  assert.equal(checklist.counts.generatedOrIngestedCandidates, report.activeLearning.totals.generated + report.activeLearning.totals.ingested);
  assert.equal(checklist.counts.generatedCritiqueOutputs, report.critiqueGenerationEvaluation.aggregateCounts.generatedOutputs);
  assert.match(checklist.policy.scope, /CandidateBatch/);
  assert.match(checklist.policy.scope, /CandidateCritique/);
  assert.match(checklist.policy.duplicationBoundary, /CandidateBatchMembership/);
  assert.match(checklist.policy.labelBoundary, /Model-judge/);
  assert.deepEqual(
    checklist.rows.map((row) => row.id),
    [
      "position_scope_context_screen",
      "candidate_generation_denominator_audit",
      "selection_targets_human_curation",
      "model_judge_screening_admin_only",
      "marginal_informativeness_redundancy_controls",
      "critique_generation_evaluation_provenance",
      "model_judges_not_gold_role_separation",
      "source_topic_artifact_controls",
    ],
  );
  assert.ok(
    checklist.rows
      .find((row) => row.id === "model_judges_not_gold_role_separation")
      .sourceStatuses.includes(report.critiqueGenerationEvaluation.generatorEvaluatorOverlap.releaseUseStatus),
  );
  assert.ok(
    checklist.rows
      .find((row) => row.id === "source_topic_artifact_controls")
      .evidenceIds.includes(report.hiddenBenchmarkFreeze.id),
  );

  const reviewChecklist = buildCandidateGenerationIntakeChecklistReport("release-review", {
    positionIntakeReadiness: report.positionIntakeReadiness,
    activeLearning: {
      ...report.activeLearning,
      blindingPass: false,
      candidateWorkflowEvidence: {
        ...report.activeLearning.candidateWorkflowEvidence,
        hiddenMetadataViolationCount: 1,
      },
    },
    candidateIntakeQualityAudit: report.candidateIntakeQualityAudit,
    critiqueGenerationEvaluation: {
      ...report.critiqueGenerationEvaluation,
      generationVsJudgingSeparation: {
        ...report.critiqueGenerationEvaluation.generationVsJudgingSeparation,
        modelJudgeScoresAcceptedAsGoldLabels: true,
      },
    },
    corpusManifest: report.corpusManifest,
    hiddenBenchmarkFreeze: report.hiddenBenchmarkFreeze,
  });
  assert.equal(reviewChecklist.releaseUseStatus, "candidate_generation_intake_review_required");
  assert.ok(
    reviewChecklist.reviewSections.some(
      (section) => section.artifactId === "model_judge_screening_admin_only" && section.reason === "activeLearning.blindingPass",
    ),
  );
  assert.ok(
    reviewChecklist.reviewSections.some(
      (section) =>
        section.artifactId === "model_judges_not_gold_role_separation" &&
        section.reason === "generationVsJudgingSeparation.modelJudgeScoresAcceptedAsGoldLabels",
    ),
  );
});

test("critique-generation evaluation reports generation denominators separately from judging", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-generation-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildCritiqueGenerationEvaluationReport("release-test", snapshot, undefined, seedRatings, positions, critiques);
  assert.equal(report.reportScope, "critique_generation_not_critique_rating_or_model_judging");
  assert.equal(report.generationVsJudgingSeparation.modelJudgeScoresDiagnosticOnly, true);
  assert.equal(report.generationVsJudgingSeparation.modelJudgeScoresAcceptedAsGoldLabels, false);
  assert.equal(report.aggregateCounts.generatedOutputs, 6);
  assert.equal(report.aggregateCounts.emptyOrRefusal, 1);
  assert.equal(report.aggregateCounts.duplicatesFiltered, 1);
  assert.equal(report.aggregateCounts.promotedToRating, 2);
  assert.equal(report.aggregateCounts.blindHumanRatedPromoted, 2);
  assert.equal(report.runRows[0].promptBody.includes("Do not rate the critique"), true);
  assert.equal(report.runRows[0].blindRatingCoverage.promotedCoverageShare, 1);
  assert.equal(report.runRows[0].promptArtifact.id, "candidate-gen-v3");
  assert.equal(report.runRows[0].protectedPromptExampleCheck.hiddenBenchmarkExamplesExcluded, true);
  assert.equal(report.runRows[0].modelJudgeScreening.promptArtifact.id, "candidate-judge-v2");
  assert.equal(report.runRows[0].modelJudgeScreening.acceptedOutputSchema.required[0], "screening_score");
  assert.equal(report.providerPolicyEvidence.releaseUseStatus, "critique_generation_provider_policies_approved");
  assert.deepEqual(report.providerPolicyEvidence.reviewSections, []);
  assert.equal(report.runRows[0].modelProviderPolicyBinding.generator.status, "model_provider_policy_approved");
  assert.equal(report.runRows[0].modelProviderPolicyBinding.modelJudge.status, "model_provider_policy_approved");
  assert.equal(report.generatorEvaluatorOverlap.releaseUseStatus, "no_generator_evaluator_overlap_detected");
  assert.equal(report.generatorEvaluatorOverlap.counts.evaluatorOverlapCount, 0);
  assert.equal(report.runRows[0].qualityMetrics.ratedPromotedOverall.mean, 0.14);
  assert.equal(report.runRows[0].qualityMetrics.passAtThresholdRate, 0);
  assert.equal(report.runRows[0].qualityMetrics.bestOfNByPosition[0].budgetNormalized, true);
  assert.equal(report.releaseUseStatus, "generation_evaluation_separate_with_blind_rating_coverage");
});

test("critique-generation evaluation preserves rated generated-submission status as promoted denominator evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-generation-rated-status-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildCritiqueGenerationEvaluationReport(
    "release-test",
    snapshot,
    [
      {
        id: "generation-run-rated-status",
        runSource: "submitted_workflow_critique_generation_run",
        requestedModelAlias: "generator-model-rated",
        resolvedModelSnapshot: "generator-model-rated-2026-10-01",
        providerRoute: "internal_eval_gateway",
        promptTemplateId: "candidate-gen-v3",
        sourcePositionIds: ["pos-ai-prior"],
        generationBudgetPerPosition: 1,
        sampledOutputCount: 1,
        modelJudgeScreening: {
          scoresVisibleToInitialRaters: false,
          diagnosticOnly: true,
        },
        metricDefinitions: {
          headlineMetric: "blind_human_rated_promoted_outputs",
          uncuratedRandomSampleMetric: "uncurated_random_sample_metric_over_all_generated_outputs",
          bestOfNPolicy: "best_of_n_reported_against_declared_generation_budget",
          topKPolicy: "top_k_and_curated_views_reported_separately_as_diagnostics",
          passThresholdOverall: 0.6,
        },
        outputs: [
          {
            id: "generated-rated-status",
            positionId: "pos-ai-prior",
            status: "rated",
            promotedCritiqueId: "crit-ai-base-rate",
          },
        ],
      },
    ],
    seedRatings,
    positions,
    critiques,
  );
  const run = report.runRows.find((row) => row.id === "generation-run-rated-status");
  assert.equal(run.outputStatusCounts.promoted_to_rating, 1);
  assert.equal(run.counts.promotedToRating, 1);
  assert.equal(run.counts.blindHumanRatedPromoted, 1);
  assert.equal(run.blindRatingCoverage.promotedCoverageShare, 1);
  assert.equal(report.aggregateCounts.promotedToRating, 1);
  assert.equal(report.aggregateCounts.blindHumanRatedPromoted, 1);
});

test("critique-generation evaluation discloses generator evaluator overlap", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-generation-overlap-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const overlappingRun = {
    ...critiqueGenerationRuns[0],
    id: "generation-run-overlap",
    requestedModelAlias: fullRubricEvaluationRun.requestedModelAlias,
    resolvedModelSnapshot: fullRubricEvaluationRun.resolvedModelSnapshot,
  };
  const report = buildCritiqueGenerationEvaluationReport(
    "release-test",
    snapshot,
    [overlappingRun],
    seedRatings,
    positions,
    critiques,
    adjudicationMemos,
    { evaluationRuns: [fullRubricEvaluationRun] },
  );
  assert.equal(report.generatorEvaluatorOverlap.releaseUseStatus, "generator_evaluator_or_judge_overlap_disclosed");
  assert.equal(report.generatorEvaluatorOverlap.counts.evaluatorOverlapCount, 1);
  assert.equal(report.generatorEvaluatorOverlap.evaluatorOverlapRows[0].overlapBasis, "exact_resolved_snapshot");
});

test("metric-family eligibility keeps pairwise and pointwise denominators separate", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const manifest = buildMetricFamilyEligibilityManifest("release-test", snapshot, positions, critiques);
  assert.equal(manifest.pairwiseEligibilityPolicy.minimumScoredCritiquesPerPosition, 3);
  assert.equal(manifest.pairwiseEligibilityPolicy.minimumAdjudicatedOverallSpread, 0.2);
  assert.equal(manifest.pairwiseEligiblePairCount, 0);
  assert.deepEqual(manifest.pairwiseEligiblePositions, []);
  assert.ok(manifest.pointwiseOnlyItems.includes("pos-mind::crit-mind-zombie"));
  assert.equal(manifest.metricFamilySpecificExclusions[0].reason, "fewer_than_three_labelled_critiques");
  assert.equal(
    manifest.qualitySpreadRows.find((row) => row.positionId === "pos-ai-prior").status,
    "pairwise_headline_ineligible",
  );
});

test("hidden benchmark freeze report gates access, pointwise-only items, and artifact balance", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-benchmark-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "benchmark_frozen",
  );
  const report = buildHiddenBenchmarkFreezeReport("release-test", snapshot, positions, critiques, undefined, seedBenchmarkExposureEvents, { includeRestrictedIds: true });
  assert.equal(report.hiddenPositionCount, 1);
  assert.deepEqual(report.restrictedItemRefs.hiddenPositionIds, ["pos-mind"]);
  assert.equal(report.submittedSplitMembership.status, "no_submitted_split_membership");
  assert.equal(report.rightsStatus.status, "pass");
  assert.equal(report.clusterIsolation.status, "pass");
  assert.equal(report.metricEligibility.pairwiseEligiblePairCount, 0);
  assert.ok(report.metricEligibility.pointwiseOnlyItems.includes("pos-mind::crit-mind-zombie"));
  assert.deepEqual(report.pairwiseComparisonSnapshot.excludedNoPairPositions, ["pos-mind"]);
  assert.equal(report.artifactBalance.counterbalanceStatus, "insufficient_seed_benchmark");
  assert.deepEqual(report.artifactBalance.policy.matrixAxes, [
    "position_source_category",
    "critique_length_band",
    "adjudicated_quality_band",
  ]);
  assert.equal(report.artifactBalance.policy.requiredSourceLengthQualityCellMin, 6);
  assert.equal(report.artifactBalance.sourceLengthQualityCellCount, report.artifactBalance.sourceLengthQualityMatrix.length);
  assert.ok(report.artifactBalance.sourceLengthQualityMatrix.every((row) => row.sourceCategory && row.lengthBand && row.adjudicatedQualityBand));
  assert.deepEqual(report.hiddenBenchmarkGovernancePolicy.authorizedAccessRoles, ["admin", "expert"]);
  assert.equal(report.hiddenBenchmarkGovernancePolicy.routineRefreshCadenceDays, 180);
  assert.equal(report.hiddenBenchmarkGovernancePolicy.leakageIncidentRefreshCadenceDays, 30);
  assert.equal(report.freezeChecks.find((check) => check.id === "governance_refresh_policy").status, "pass");
  assert.equal(report.artifactProbeDiagnostics.status, "not_run_documented");
  assert.equal(report.accessAudit.status, "pass");
  assert.equal(report.initialBlinding.releaseUseStatus, "hidden_benchmark_initial_rating_blinding_pass");
  assert.equal(report.initialBlinding.counts.sourceTagVisibleInitialRows, 0);
  assert.equal(report.freezeStatus, "not_ready_for_release_freeze");

  const submittedProbeReport = buildHiddenBenchmarkFreezeReport("release-test", snapshot, positions, critiques, undefined, seedBenchmarkExposureEvents, {
    artifactProbeRuns: [
      {
        id: "artifact-probe-submitted",
        releaseId: "release-test",
        targetLabelSnapshotId: snapshot.id,
        inputView: "critique_only",
        metricOutputs: { weightedPairwiseLoss: 0.24 },
        protectedMetadataHandling: "authorized_admin_only_probe",
      },
    ],
  });
  assert.equal(submittedProbeReport.artifactProbeDiagnostics.status, "partial");
  assert.deepEqual(submittedProbeReport.artifactProbeDiagnostics.completedProbeFamilies, ["critique_only"]);
  assert.deepEqual(submittedProbeReport.artifactProbeDiagnostics.missingProbeFamilies, ["full_context", "metadata_only", "style_features_only"]);
  assert.equal(submittedProbeReport.artifactProbeDiagnostics.submittedRunRows[0].status, "submitted_artifact_probe_authorized");

  const completeProbeReport = buildHiddenBenchmarkFreezeReport("release-test", snapshot, positions, critiques, undefined, seedBenchmarkExposureEvents, {
    artifactProbeRuns: [
      {
        id: "artifact-probe-full-context",
        releaseId: "release-test",
        targetLabelSnapshotId: snapshot.id,
        inputView: "full_context",
        metricOutputs: { weightedPairwiseLoss: 0.18 },
        protectedMetadataHandling: "protected_metadata_redacted",
      },
      {
        id: "artifact-probe-critique-only",
        releaseId: "release-test",
        targetLabelSnapshotId: snapshot.id,
        inputView: "critique_only",
        metricOutputs: { weightedPairwiseLoss: 0.24 },
        protectedMetadataHandling: "authorized_admin_only_probe",
      },
      {
        id: "artifact-probe-metadata-only",
        releaseId: "release-test",
        targetLabelSnapshotId: snapshot.id,
        inputView: "metadata_only",
        metricOutputs: { weightedPairwiseLoss: 0.34 },
        protectedMetadataHandling: "authorized_admin_only_probe",
      },
      {
        id: "artifact-probe-style-only",
        releaseId: "release-test",
        targetLabelSnapshotId: snapshot.id,
        inputView: "style_features_only",
        metricOutputs: { weightedPairwiseLoss: 0.31 },
        protectedMetadataHandling: "authorized_admin_only_probe",
      },
    ],
  });
  assert.equal(completeProbeReport.artifactProbeDiagnostics.status, "pass");
  assert.deepEqual(completeProbeReport.artifactProbeDiagnostics.requiredProbeFamilies, [
    "full_context",
    "critique_only",
    "metadata_only",
    "style_features_only",
  ]);
  assert.deepEqual(completeProbeReport.artifactProbeDiagnostics.missingProbeFamilies, []);
  assert.deepEqual(completeProbeReport.artifactProbeDiagnostics.completedProbeFamilies, [
    "full_context",
    "critique_only",
    "metadata_only",
    "style_features_only",
  ]);

  const legacyCombinedProbeReport = buildHiddenBenchmarkFreezeReport("release-test", snapshot, positions, critiques, undefined, seedBenchmarkExposureEvents, {
    artifactProbeRuns: [
      {
        id: "artifact-probe-full-context-legacy",
        releaseId: "release-test",
        targetLabelSnapshotId: snapshot.id,
        inputView: "full_context",
        metricOutputs: { weightedPairwiseLoss: 0.18 },
        protectedMetadataHandling: "protected_metadata_redacted",
      },
      {
        id: "artifact-probe-critique-only-legacy",
        releaseId: "release-test",
        targetLabelSnapshotId: snapshot.id,
        inputView: "critique_only",
        metricOutputs: { weightedPairwiseLoss: 0.24 },
        protectedMetadataHandling: "authorized_admin_only_probe",
      },
      {
        id: "artifact-probe-metadata-style-legacy",
        releaseId: "release-test",
        targetLabelSnapshotId: snapshot.id,
        inputView: "metadata_style_only",
        metricOutputs: { weightedPairwiseLoss: 0.32 },
        protectedMetadataHandling: "authorized_admin_only_probe",
      },
    ],
  });
  assert.equal(legacyCombinedProbeReport.artifactProbeDiagnostics.status, "pass");
  assert.deepEqual(legacyCombinedProbeReport.artifactProbeDiagnostics.completedProbeFamilies, [
    "full_context",
    "critique_only",
    "metadata_only",
    "style_features_only",
  ]);

  const staleProbeReport = buildHiddenBenchmarkFreezeReport("release-test", snapshot, positions, critiques, undefined, seedBenchmarkExposureEvents, {
    artifactProbeRuns: [
      {
        id: "artifact-probe-stale",
        releaseId: "release-test",
        targetLabelSnapshotId: "snapshot-stale",
        inputView: "metadata_style_only",
        metricOutputs: { weightedPairwiseLoss: 0.24 },
        protectedMetadataHandling: "plain_hidden_metadata_dump",
      },
    ],
  });
  assert.equal(staleProbeReport.artifactProbeDiagnostics.status, "artifact_probe_review_required");
  assert.equal(staleProbeReport.artifactProbeDiagnostics.reviewRows.length, 1);
  assert.equal(
    staleProbeReport.artifactProbeDiagnostics.reviewRows[0].reviewChecks.find((check) => check.field === "targetLabelSnapshotId").status,
    "mismatch",
  );
  assert.equal(
    staleProbeReport.artifactProbeDiagnostics.reviewRows[0].reviewChecks.find((check) => check.field === "authorizedProtectedMetadataHandling").status,
    "mismatch",
  );
});

test("submitted ExposureLog artifacts feed hidden benchmark access audit", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-exposure-log-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "benchmark_frozen",
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    [],
    postLockSourceStyleAudits,
    {
      exposureLogs: [
        {
          id: "exposure-log-submitted",
          userIdHash: "sha256-demo-admin",
          artifactId: "hidden-benchmark-freeze-release-test",
          splitName: "hidden_benchmark",
          action: "membership_view",
          purpose: "release_freeze",
          accessPhase: "pre_freeze",
          timestamp: "2026-06-12T12:00:00.000Z",
        },
      ],
    },
  );
  assert.equal(report.hiddenBenchmarkFreeze.accessAudit.totalEvents, 1);
  assert.equal(report.hiddenBenchmarkFreeze.accessAudit.workflowExposureLogCount, 1);
  assert.equal(report.hiddenBenchmarkFreeze.accessAudit.status, "pass");
  assert.equal(report.hiddenBenchmarkFreeze.accessAudit.actions.membership_view, 1);
  assert.equal(report.hiddenBenchmarkFreeze.freezeChecks.find((check) => check.id === "access_audit").status, "pass");
});

test("hidden benchmark freeze report applies submitted benchmark split members", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-benchmark-split-member-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "benchmark_frozen",
  );
  const report = buildHiddenBenchmarkFreezeReport("release-test", snapshot, positions, critiques, undefined, seedBenchmarkExposureEvents, {
    includeRestrictedIds: true,
    benchmarkSplitMembers: [
      {
        id: "split-member-core-test",
        releaseId: "release-test",
        itemId: "pos-ai-prior::crit-ai-base-rate",
        positionClusterId: "cluster-ai-prior",
        split: "hidden_benchmark_candidate",
        splitUnit: "position_cluster",
        customWeightedLossEligible: true,
        pairwiseRankingEligible: true,
        pointwiseOnly: false,
        freezeVersion: "release-test.1",
        artifactBalanceBucket: "ai_safety_short_medium",
        crossSplitExceptionReason: "none",
        exposureRestricted: true,
        leakPreventionStatus: "excluded_from_training_prompt_tuning_and_public_export",
        frozenAt: "2026-10-01T00:00:00.000Z",
      },
    ],
  });
  assert.equal(report.submittedSplitMembership.status, "submitted_hidden_benchmark_membership_applied");
  assert.equal(report.submittedSplitMembership.appliedHiddenPositionCount, 1);
  assert.equal(report.submittedSplitMembership.contractViolationRows.length, 0);
  assert.equal(report.freezeChecks.find((check) => check.id === "submitted_split_membership_contract").status, "pass");
  assert.equal(report.hiddenBenchmarkExpertQualification.status, "hidden_benchmark_expert_qualification_required");
  assert.equal(report.hiddenBenchmarkExpertQualification.rows.find((row) => row.itemId === "pos-mind::crit-mind-zombie").qualifiedHiddenBenchmarkExpertCount, 1);
  assert.equal(report.hiddenBenchmarkExpertQualification.counts.missingHiddenBenchmarkExpertQualificationItemCount, 2);
  assert.equal(report.freezeChecks.find((check) => check.id === "hidden_benchmark_expert_qualification").status, "blocked");
  assert.deepEqual(report.restrictedItemRefs.hiddenPositionIds.sort(), ["pos-ai-prior", "pos-mind"]);
  assert.equal(report.hiddenCritiqueCount, 3);
  assert.equal(report.rightsStatus.status, "blocked");
  assert.deepEqual(report.rightsStatus.releaseScopeFailures, ["pos-ai-prior"]);

  const underdeclaredReport = buildHiddenBenchmarkFreezeReport("release-test", snapshot, positions, critiques, undefined, seedBenchmarkExposureEvents, {
    includeRestrictedIds: true,
    benchmarkSplitMembers: [
      {
        id: "split-member-underdeclared",
        itemId: "pos-ai-prior::crit-ai-base-rate",
        split: "hidden_benchmark_candidate",
        leakPreventionStatus: "excluded_from_training_prompt_tuning_and_public_export",
      },
    ],
  });
  assert.equal(underdeclaredReport.submittedSplitMembership.status, "submitted_membership_contract_review_required");
  assert.equal(underdeclaredReport.submittedSplitMembership.appliedHiddenPositionCount, 0);
  assert.deepEqual(underdeclaredReport.restrictedItemRefs.hiddenPositionIds.sort(), ["pos-mind"]);
  assert.ok(underdeclaredReport.submittedSplitMembership.contractViolationRows[0].contractViolations.includes("releaseId"));
  assert.ok(underdeclaredReport.submittedSplitMembership.contractViolationRows[0].contractViolations.includes("splitUnit"));
  assert.equal(underdeclaredReport.freezeChecks.find((check) => check.id === "submitted_split_membership_contract").status, "blocked");
});

test("hidden benchmark freeze blocks unqualified expert quota evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-hidden-expert-qualification-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "benchmark_frozen",
  );
  const report = buildHiddenBenchmarkFreezeReport("release-test", snapshot, positions, critiques, undefined, seedBenchmarkExposureEvents, {
    raterQualificationRecords: [
      {
        id: "rater-qualification-expired-hidden-benchmark-expert",
        raterId: "expert-1",
        qualificationScope: "hidden_benchmark_expert",
        qualificationSource: "certification_pack",
        evidenceArtifactReference: "qualification-evidence-hidden-expired",
        approvedRoles: ["expert"],
        topicFamilyScope: ["philosophy_of_mind"],
        splitWorkflowEligibility: ["release_critical", "validation", "hidden_benchmark"],
        expiryReviewDate: "2000-01-31",
        approver: "demo-admin",
      },
    ],
  });
  assert.equal(report.hiddenBenchmarkExpertQualification.status, "hidden_benchmark_expert_qualification_required");
  assert.equal(report.hiddenBenchmarkExpertQualification.counts.missingHiddenBenchmarkExpertQualificationItemCount, 1);
  assert.equal(report.freezeChecks.find((check) => check.id === "hidden_benchmark_expert_qualification").status, "blocked");
  assert.equal(report.freezeStatus, "blocked");
});

test("hidden benchmark initial blinding gate excludes source/tag-visible blind ratings unless exception is disclosed", () => {
  const visibleRating = {
    ...seedRatings.find((rating) => rating.id === "rating-mind-zombie-a"),
    id: "rating-mind-zombie-source-visible",
    raterId: "rater-source-visible",
    sourceMetadataVisibleBeforeInitialLock: true,
    adminTagsVisibleBeforeInitialLock: true,
    scores: {
      centrality: 0.1,
      strength: 0.1,
      correctness: 0.1,
      clarity: 0.9,
      dead_weight: 0.9,
      single_issue: 0.2,
      overall: 0.05,
    },
  };
  const pairs = critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id }));
  const snapshot = createLabelSnapshot("snapshot-hidden-visible", "release-test", [...seedRatings, visibleRating], pairs, "benchmark_frozen");
  const hiddenLabel = snapshot.itemLabels["pos-mind::crit-mind-zombie"];
  assert.equal(hiddenLabel.raterCount, 1);
  assert.equal(hiddenLabel.weightedMeanScores.overall, 0.68);
  assert.equal(snapshot.excludedBlindAggregationRows[0].ratingId, "rating-mind-zombie-source-visible");

  const blinding = buildHiddenBenchmarkInitialBlindingReport("release-test", snapshot, [...seedRatings, visibleRating], positions);
  assert.equal(blinding.counts.sourceTagVisibleInitialRows, 1);
  assert.equal(blinding.counts.excludedFromBlindAggregationRows, 1);
  assert.equal(blinding.releaseUseStatus, "source_tag_visible_initial_ratings_excluded_or_exception_disclosed");

  const disclosedExceptionRating = {
    ...visibleRating,
    id: "rating-mind-zombie-source-visible-exception",
    raterId: "rater-source-visible-exception",
    blindAggregationAdjudicatedExceptionId: "exception-hidden-source-visible-1",
    blindAggregationExceptionDisclosed: true,
    scores: {
      ...visibleRating.scores,
      overall: 0.88,
    },
  };
  const exceptionSnapshot = createLabelSnapshot("snapshot-hidden-exception", "release-test", [...seedRatings, disclosedExceptionRating], pairs, "benchmark_frozen");
  assert.equal(exceptionSnapshot.itemLabels["pos-mind::crit-mind-zombie"].raterCount, 2);
  const exceptionReport = buildHiddenBenchmarkInitialBlindingReport("release-test", exceptionSnapshot, [...seedRatings, disclosedExceptionRating], positions);
  assert.equal(exceptionReport.counts.adjudicatedExceptionRows, 1);
  assert.equal(exceptionReport.counts.excludedFromBlindAggregationRows, 0);
  assert.equal(exceptionReport.releaseUseStatus, "source_tag_visible_initial_ratings_excluded_or_exception_disclosed");
});

test("validation design report refuses Appendix-C comparability when the current run is too thin", () => {
  const report = buildValidationDesignReport(seedRatings, positions, critiques);
  assert.equal(report.status, "thinner_than_appendix_c");
  assert.equal(report.requiredScale.critiqueCount, 52);
  assert.equal(report.requiredScale.positionCount, 19);
  assert.equal(report.currentScale.critiqueCount, 2);
  assert.equal(report.comparabilityAxes.thinnerThanAppendixCLabelRequired, true);
  assert.equal(report.releaseCycleValidationPolicy.cadence, "each_public_release_or_leaderboard_cycle");
  assert.equal(report.releaseCycleValidationPolicy.carryForwardAllowedReleaseCycles, 0);
  assert.deepEqual(report.releaseCycleValidationPolicy.requiredSubsets, ["random_sentinel", "hard_case_stress"]);
  assert.equal(report.releaseCycleEvidenceStatus, "current_release_cycle_validation_floor_not_met");
  assert.equal(report.numericBaselineComparisonTable.gpt5ComparisonPoints.wholeRatingTestCustomLoss.mean, 0.169);
});

test("validation tranche report separates random sentinel from hard-case stress metrics", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-validation-tranche-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildValidationTrancheReport("release-test", snapshot, seedRatings, positions, critiques);
  assert.equal(report.releaseUseStatus, "validation_tranches_separated_seed_thin");
  assert.deepEqual(report.randomSentinel.itemIds, ["pos-voting::crit-voting-bullet"]);
  assert.deepEqual(report.hardCaseStress.itemIds, ["pos-voting::crit-voting-style"]);
  assert.equal(report.randomSentinel.membershipBlindingStatus, "membership_hidden_until_initial_lock_where_feasible");
  assert.equal(report.hardCaseStress.membershipBlindingStatus, "hard_case_status_admin_only_until_initial_lock");
  assert.equal(report.randomSentinel.initialVsFinal.meanAbsOverallDiff, 0.03);
  assert.equal(report.randomSentinel.expertCheckedVsFinal.rowCount, 1);
  assert.equal(report.randomSentinel.modelAssistedCheckedVsFinal.rowCount, 0);
  assert.equal(report.randomSentinel.incrementalPostModelAssistanceDelta.status, "no_model_assisted_checks_in_tranche");
  assert.equal(report.hardCaseStress.initialVsFinal.meanAbsOverallDiff, 0);
  assert.equal(report.hardCaseStress.unresolvedPostDiscussionRows[0].unresolvedDisagreementClass, "stable low-quality diagnosis");
});

test("validation tranche report accepts submitted Appendix-C-scale tranche evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-validation-tranche-submitted-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const comparisons = ["initial_vs_final", "human_only_self_checked_vs_final", "model_assisted_checked_vs_final", "incremental_post_model_assistance_delta"];
  const evidence = {
    id: "validation-tranche-evidence-test",
    releaseId: "release-test",
    targetLabelSnapshotId: snapshot.id,
    targetLabelVersion: snapshot.targetLabelVersion,
    validationDesignStatus: "appendix_c_scale",
    appendixCComparabilityStatus: "appendix_c_scale",
    validationCritiqueCount: 52,
    validationPositionCount: 19,
    coreAllItemsRaterCount: 4,
    partialRaterCoverageSummary: "four core all-items raters plus documented partial prefixes",
    discussionSessionHourAccounting: "7.5 discussion hours with written follow-up accounted separately",
    trancheRows: [
      {
        tranche: "random_sentinel",
        itemIds: ["pos-voting::crit-voting-bullet"],
        positionCount: 19,
        critiqueCount: 52,
        membershipBlindingStatus: "membership_hidden_until_initial_lock_where_feasible",
        humanCeilingEstimateStatus: "reported_with_uncertainty",
        perDimensionCalibrationStatus: "reported",
        individualRaterDominanceStatus: "largest_share_below_policy_threshold",
        expertVsModelAgreementStatus: "reported",
        saturationRiskStatus: "not_saturated",
      },
      {
        tranche: "hard_case_stress",
        itemIds: ["pos-voting::crit-voting-style"],
        positionCount: 6,
        critiqueCount: 18,
        membershipBlindingStatus: "hard_case_status_admin_only_until_initial_lock",
        humanCeilingEstimateStatus: "reported_with_uncertainty",
        perDimensionCalibrationStatus: "reported",
        individualRaterDominanceStatus: "largest_share_below_policy_threshold",
        expertVsModelAgreementStatus: "reported",
        saturationRiskStatus: "reported_separately_not_headline_random_sentinel",
      },
    ],
    comparisonRows: ["random_sentinel", "hard_case_stress"].flatMap((tranche) =>
      comparisons.map((comparison) => ({
        tranche,
        comparison,
        rowCount: tranche === "random_sentinel" ? 52 : 18,
        comparisonStatus: "reported_with_uncertainty",
        uncertaintyMethod: "bootstrap",
        intervalType: "confidence_interval",
        intervalLevel: 0.95,
        intervalConstructionMethod: "position_level_resampling",
        resamplingUnit: "position",
        resampleCount: 2000,
        randomSeed: "validation-tranche-seed-20261031",
      })),
    ),
    reviewerId: "expert-validation",
    reviewerRole: "expert",
    createdAt: "2026-10-01T00:00:00.000Z",
  };
  const report = buildValidationTrancheReport("release-test", snapshot, seedRatings, positions, critiques, adjudicationMemos, {
    validationTrancheEvidenceRecords: [evidence],
  });
  assert.equal(report.releaseUseStatus, "submitted_validation_tranche_evidence_complete");
  assert.equal(report.submittedValidationTrancheEvidence.activeEvidenceId, "validation-tranche-evidence-test");
  assert.equal(report.submittedValidationTrancheEvidence.completeEvidenceCount, 1);
  assert.deepEqual(report.reviewSections, []);

  const releaseReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    { validationTrancheEvidenceRecords: [evidence] },
  );
  assert.equal(releaseReport.validationDesign.status, "appendix_c_scale");
  assert.equal(releaseReport.validationDesign.currentScale.submittedScaleEvidenceSource, "validation_tranche_evidence");
  assert.equal(releaseReport.validationDesign.currentScale.critiqueCount, 52);
  assert.equal(releaseReport.validationDesign.currentScale.positionCount, 19);
  assert.equal(releaseReport.validationDesign.currentScale.fullCoverageRaterCount, 4);
  assert.equal(releaseReport.targetGaps.validationCritiquesRemaining, 0);
  assert.equal(releaseReport.targetGaps.validationPositionsRemaining, 0);
  assert.equal(releaseReport.targetGaps.validationCoreAllItemsRatersRemaining, 0);
});

test("validation tranche report requires current complete tranche evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-validation-tranche-review-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildValidationTrancheReport("release-test", snapshot, seedRatings, positions, critiques, adjudicationMemos, {
    validationTrancheEvidenceRecords: [
      {
        id: "validation-tranche-evidence-review",
        releaseId: "older-release",
        targetLabelSnapshotId: "stale-snapshot",
        targetLabelVersion: snapshot.targetLabelVersion,
        validationDesignStatus: "thinner_than_appendix_c",
        appendixCComparabilityStatus: "thin_seed",
        validationCritiqueCount: 2,
        validationPositionCount: 1,
        coreAllItemsRaterCount: 1,
        partialRaterCoverageSummary: "",
        discussionSessionHourAccounting: "",
        trancheRows: [{ tranche: "random_sentinel", itemIds: ["pos-voting::crit-voting-bullet"], positionCount: 1, critiqueCount: 1 }],
        comparisonRows: [],
        reviewerId: "expert-validation",
        reviewerRole: "expert",
        createdAt: "2026-10-01T00:00:00.000Z",
      },
    ],
  });
  assert.equal(report.releaseUseStatus, "validation_tranche_evidence_review_required");
  assert.equal(report.submittedValidationTrancheEvidence.reviewRequiredCount, 1);
  assert.ok(report.reviewSections.some((section) => section.reason === "releaseId"));
  assert.ok(report.reviewSections.some((section) => section.reason === "trancheRows:hard_case_stress"));
  assert.ok(report.reviewSections.some((section) => section.reason === "comparisonRows:random_sentinel:initial_vs_final"));
});

test("human-ceiling report separates check types and blocks saturation claims for thin validation", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-human-ceiling-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildHumanCeilingAndSaturationReport("release-test", snapshot, seedRatings, positions, critiques, [fullRubricEvaluationRun]);
  assert.equal(report.validationScope.appendixCScaleStatus, "thinner_than_appendix_c");
  assert.deepEqual(report.validationScope.validationItemIds, ["pos-voting::crit-voting-bullet", "pos-voting::crit-voting-style"]);
  assert.deepEqual(report.raterItemCoverage.commonOverlapItemIds, ["pos-voting::crit-voting-bullet"]);
  assert.deepEqual(report.raterItemCoverage.fullCoverageRaterIds, ["rater-c"]);
  assert.equal(report.comparisonRows.find((row) => row.ratingKind === "blind_initial").meanAbsOverallDiff, 0.015);
  assert.equal(report.comparisonRows.find((row) => row.ratingKind === "expert_check").rowCount, 1);
  assert.equal(report.checkSeparation.modelAssistedTreatedAsIndependentHuman, false);
  assert.equal(report.modelProximityRows[0].meanAbsOverallDiff, 0.155);
  assert.equal(report.saturationRisk.status, "not_assessable_thin_validation");
  assert.equal(report.saturationRisk.benchmarkRefreshPolicyId, "benchmark-refresh-policy-release-test");
  assert.equal(report.saturationRisk.refreshCadenceDays, 90);
  assert.deepEqual(report.saturationRisk.requiredRefreshActions, benchmarkRefreshActions);
  assert.equal(report.benchmarkRefreshPolicyEvidence.releaseUseStatus, "seed_benchmark_refresh_policy_active");
  assert.equal(report.releaseUseStatus, "human_ceiling_claims_blocked_thinner_than_appendix_c");
  assert.equal(report.refreshQueue[0].itemId, "pos-voting::crit-voting-style");
  assert.ok(report.refreshQueue[0].refreshActions.includes("expert_double_check"));
  assert.equal(report.refreshQueue[0].benchmarkRefreshPolicyId, "benchmark-refresh-policy-release-test");
  assert.equal(report.refreshQueue[0].refreshCadenceDays, 90);
});

test("submitted human-ceiling runs can satisfy Appendix-C validation evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-human-ceiling-submitted",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const submittedRun = {
    id: "human-ceiling-submitted-appendix-c",
    splitOrValidationSubset: "internal_validation",
    validationCritiqueCount: 52,
    validationPositionCount: 19,
    coreAllItemsRaterCount: 4,
    discussionHours: 7.5,
    appendixCComparabilityFlag: "appendix_c_scale_candidate",
    targetLabelSnapshotId: snapshot.id,
  };
  const submittedRunWithUncertainty = {
    ...submittedRun,
    id: "human-ceiling-submitted-appendix-c-with-uncertainty",
    uncertaintyMethod: "bootstrap",
    intervalType: "confidence_interval",
    intervalLevel: 0.95,
    intervalConstructionMethod: "position_level_resampling",
    resamplingUnit: "position",
    resampleCount: 2000,
    randomSeed: "human-ceiling-seed-20261031",
    intervalComparisonScope: "paired_difference_on_common_overlap_subset",
  };
  const validationDesign = buildValidationDesignReport(seedRatings, positions, critiques, { humanCeilingRuns: [submittedRun] });
  assert.equal(validationDesign.status, "appendix_c_scale");
  assert.equal(validationDesign.releaseCycleEvidenceStatus, "current_release_cycle_validation_evidence_complete");
  assert.equal(validationDesign.releaseCycleValidationPolicy.staleEvidenceAction, "rerun_or_rebaseline_before_appendix_c_or_leaderboard_claim");
  assert.equal(validationDesign.currentScale.computedFloorMet, false);
  assert.equal(validationDesign.submittedValidationEvidence.bestRunId, "human-ceiling-submitted-appendix-c");
  assert.equal(validationDesign.submittedValidationEvidence.status, "submitted_appendix_c_scale_evidence");

  const humanCeiling = buildHumanCeilingAndSaturationReport("release-test", snapshot, seedRatings, positions, critiques, [fullRubricEvaluationRun], {
    humanCeilingRuns: [submittedRun],
  });
  assert.equal(humanCeiling.validationScope.appendixCScaleStatus, "appendix_c_scale");
  assert.equal(humanCeiling.validationScope.submittedValidationEvidence.bestRunId, "human-ceiling-submitted-appendix-c");
  assert.equal(
    humanCeiling.appendixCNumericBaselineComparison.releaseUseStatus,
    "appendix_c_numeric_baselines_attached_to_human_ceiling_report",
  );
  assert.equal(humanCeiling.appendixCNumericBaselineComparison.numericBaselines.overlappingRaterVsPrimaryCustomLoss[0].mean, 0.139);
  assert.equal(humanCeiling.submittedHumanCeilingUncertainty.status, "submitted_human_ceiling_uncertainty_review_required");
  assert.equal(humanCeiling.submittedHumanCeilingUncertainty.rows[0].status, "human_ceiling_uncertainty_provenance_review_required");
  assert.ok(humanCeiling.submittedHumanCeilingUncertainty.rows[0].reviewReasons.includes("intervalType"));
  assert.equal(humanCeiling.releaseUseStatus, "human_ceiling_uncertainty_provenance_required");

  const completeHumanCeiling = buildHumanCeilingAndSaturationReport("release-test", snapshot, seedRatings, positions, critiques, [fullRubricEvaluationRun], {
    humanCeilingRuns: [submittedRunWithUncertainty],
    benchmarkRefreshPolicies: [benchmarkRefreshPolicy("benchmark-refresh-policy-submitted")],
  });
  assert.equal(completeHumanCeiling.submittedHumanCeilingUncertainty.status, "submitted_human_ceiling_uncertainty_complete");
  assert.equal(completeHumanCeiling.submittedHumanCeilingUncertainty.activeRunId, "human-ceiling-submitted-appendix-c-with-uncertainty");
  assert.equal(completeHumanCeiling.benchmarkRefreshPolicyEvidence.activePolicyId, "benchmark-refresh-policy-submitted");
  assert.equal(completeHumanCeiling.benchmarkRefreshPolicyEvidence.releaseUseStatus, "submitted_benchmark_refresh_policy_active");
  assert.equal(completeHumanCeiling.saturationRisk.benchmarkRefreshPolicyId, "benchmark-refresh-policy-submitted");
  assert.equal(completeHumanCeiling.uncertaintyPolicy.intervalType, "confidence_interval");
  assert.equal(completeHumanCeiling.uncertaintyPolicy.resamplingUnit, "position");
  assert.equal(completeHumanCeiling.releaseUseStatus, "human_ceiling_claims_allowed_with_declared_uncertainty");

  const driftedRefreshPolicy = buildHumanCeilingAndSaturationReport("release-test", snapshot, seedRatings, positions, critiques, [fullRubricEvaluationRun], {
    humanCeilingRuns: [submittedRunWithUncertainty],
    benchmarkRefreshPolicies: [
      {
        ...benchmarkRefreshPolicy("benchmark-refresh-policy-drifted"),
        cadenceDaysBySaturationStatus: {
          ...benchmarkRefreshCadenceDaysByStatus,
          saturation_risk_refresh_required: 120,
        },
      },
    ],
  });
  assert.equal(driftedRefreshPolicy.benchmarkRefreshPolicyEvidence.releaseUseStatus, "submitted_benchmark_refresh_policy_review_required");
  assert.equal(driftedRefreshPolicy.benchmarkRefreshPolicyEvidence.policyRows.at(-1).status, "benchmark_refresh_policy_review_required");
  assert.ok(
    driftedRefreshPolicy.benchmarkRefreshPolicyEvidence.policyRows
      .at(-1)
      .reviewReasons.includes("cadenceDaysBySaturationStatus"),
  );
  assert.equal(driftedRefreshPolicy.releaseUseStatus, "benchmark_refresh_policy_review_required");

  const releaseReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      humanCeilingRuns: [submittedRunWithUncertainty],
      benchmarkRefreshPolicies: [benchmarkRefreshPolicy("benchmark-refresh-policy-submitted")],
    },
  );
  assert.equal(releaseReport.validationDesign.status, "appendix_c_scale");
  assert.equal(releaseReport.targetGaps.validationCritiquesRemaining, 0);
  assert.equal(releaseReport.targetGaps.validationPositionsRemaining, 0);
  assert.equal(releaseReport.targetGaps.validationCoreAllItemsRatersRemaining, 0);
  assert.equal(releaseReport.lmcaComparison.validationHumanCeilingComparison.status, "appendix_c_comparable");
  assert.equal(releaseReport.comparabilityClaims.find((claim) => claim.tier === "validation_design_comparable").status, "passes");
  assert.equal(releaseReport.humanCeiling.benchmarkRefreshPolicyEvidence.activePolicyId, "benchmark-refresh-policy-submitted");
  assert.equal(releaseReport.workflowModelEvaluationArtifacts.benchmarkRefreshPolicies.length, 1);
});

test("release report includes corpus baselines and explicit anti-overclaim claim tiers", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport("release-test", snapshot, seedRatings, positions, critiques);
  assert.equal(report.currentStatus, "incomplete_against_october_target");
  assert.equal(report.releaseClaimWarnings.releaseUseStatus, "release_claims_limited_by_errata_or_schedule");
  assert.equal(report.releaseClaimWarnings.counts.errataWarningCount, 0);
  assert.equal(report.releaseClaimWarnings.counts.blockedScheduleCompletionClaimCount, 1);
  assert.equal(report.releaseClaimWarnings.scheduleCompletionClaimRows[0].completionClaimStatus, "completion_claim_blocked_until_complete_or_rebaselined");
  assert.equal(report.targetGaps.positionsRemaining, 117);
  assert.equal(report.targetGaps.validationCritiquesRemaining, 50);
  assert.equal(report.targetGaps.validationPositionsRemaining, 18);
  assert.equal(report.targetGaps.validationCoreAllItemsRatersRemaining, 3);
  assert.equal(report.targetGaps.counts.targetRows, 7);
  assert.equal(report.targetGaps.counts.remaining, 7);
  assert.deepEqual(report.targetGaps.totals, { targetTotal: 2055, currentTotal: 21, remainingTotal: 2034 });
  assert.equal(report.targetGaps.counts.targetTotal, 2055);
  assert.equal(report.targetGaps.counts.currentTotal, 21);
  assert.equal(report.targetGaps.counts.remainingTotal, 2034);
  assert.equal(report.targetGaps.counts.readyTargetGaps, 7);
  assert.deepEqual(report.targetGaps.counts.byExecutionStatus, { ready_to_collect_data: 7 });
  assert.equal(report.targetGaps.counts.byPrimaryImportRoute["/api/v1/target-gaps/import-jsonl-package"], undefined);
  assert.equal(report.targetGaps.counts.byPrimaryImportRoute["/api/v1/intake/positions/import-jsonl"], 1);
  assert.equal(report.targetGaps.counts.bySetupImportRoute["/api/v1/assignments/import-jsonl"], 1);
  assert.equal(report.targetGaps.counts.byRoute["/api/v1/target-gaps/import-jsonl-package"], 7);
  assert.equal(report.targetGaps.counts.byRoute["/api/v1/target-gaps/import-jsonl-package?dryRun=true"], 7);
  assert.equal(report.targetGaps.counts.byRoute["/api/v1/target-gaps/import-jsonl-package?validateOnly=true"], 7);
  assert.equal(report.targetGaps.counts.byRoute["/api/v1/target-gaps/import-jsonl-template?targetGapId=positions"], 1);
  assert.equal(report.octoberOperatingPlan.releaseTargetDate, "2026-10-31");
  assert.equal(report.octoberOperatingPlan.scopeLabel, "compressed_quality_preserving_october_release_not_lmca_replication");
  assert.deepEqual(report.octoberOperatingPlan.personWeekRange, { min: 132, max: 154 });
  assert.deepEqual(report.octoberOperatingPlan.budgetEnvelopeUsd, { min: 600000, midpoint: 840000, max: 1000000 });
  assert.equal(report.octoberOperatingPlan.counts.expertAdjudicatorRequiredCount, 4);
  assert.equal(report.octoberOperatingPlan.counts.requiredWorkstreams, 8);
  assert.equal(report.octoberOperatingPlan.targetGapSummary.openTargetRows, 7);
  assert.equal(report.octoberOperatingPlan.releaseUseStatus, "october_operating_plan_target_scale_open");
  assert.ok(
    report.octoberOperatingPlan.workstreamRows.some(
      (row) => row.workstream === "appendix_c_validation_and_human_ceiling" && row.blockingTargetGapIds.includes("validation_critiques"),
    ),
  );
  const positionTargetGap = report.targetGaps.rows.find((row) => row.id === "positions");
  const expectedPositionImportImpact = {
    targetGapId: "positions",
    current: 3,
    target: 120,
    remaining: 117,
    status: "target_gap_remaining",
    sourceEvidenceId: report.corpusManifest.id,
    importKind: "primary_data_import",
    importRoute: "/api/v1/intake/positions/import-jsonl",
    completionEvidence: "corpus position count increases in /api/release/report targetGaps",
    estimatedRecordsRequired: 117,
    expectedResourceDelta: 117,
    closesTargetGapWhenValidated: true,
    effect: "validated_real_records_reduce_matching_target_gap",
    verificationRoute: "/api/v1/target-gaps/positions",
  };
  assert.deepEqual(positionTargetGap, {
    id: "positions",
    label: "Positions",
    target: 120,
    current: 3,
    remaining: 117,
    sourceEvidenceId: report.corpusManifest.id,
    status: "target_gap_remaining",
    operatorActionIds: ["target_scale_and_data_collection:collect:positions"],
    checklistRowIds: ["target_scale_and_data_collection"],
    writeRoutes: ["/api/v1/intake/positions"],
    bulkImportRoutes: ["/api/v1/intake/positions/import-jsonl"],
    readbackRoutes: ["/api/v1/intake/positions"],
    submissionReadbackRoutes: ["/api/v1/intake/positions"],
    setupWriteRoutes: [],
    setupBulkImportRoutes: [],
    setupDryRunImportRoutes: [],
    setupValidateOnlyImportRoutes: [],
    setupReadbackRoutes: [],
    targetGapReadbackRoutes: ["/api/v1/target-gaps"],
    targetGapReadbackItemRoutes: ["/api/v1/target-gaps/positions"],
    workflowTemplateIds: ["position-intake"],
    setupWorkflowTemplateIds: [],
    bulkImportWorkflowTemplateIds: ["position-intake-jsonl-import"],
    setupBulkImportWorkflowTemplateIds: [],
    actorRoles: ["admin_or_operator"],
    setupActorRoles: [],
    completionEvidence: ["corpus position count increases in /api/release/report targetGaps"],
    executionStatus: "ready_to_collect_data",
    executionStatusReason:
      "This target gap can accept real target data now; generated templates must be replaced and dry-run validated before append.",
    collectionPlanRoute: "/api/v1/target-gaps/collection-plan/positions",
    writeRoute: "/api/v1/intake/positions",
    readbackRoute: "/api/v1/intake/positions",
    submissionReadbackRoute: "/api/v1/intake/positions",
    bulkImportRoute: "/api/v1/intake/positions/import-jsonl",
    dryRunImportRoute: "/api/v1/intake/positions/import-jsonl?dryRun=true",
    validateOnlyImportRoute: "/api/v1/intake/positions/import-jsonl?validateOnly=true",
    packageImportRoute: "/api/v1/target-gaps/import-jsonl-package",
    packageDryRunImportRoute: "/api/v1/target-gaps/import-jsonl-package?dryRun=true",
    packageValidateOnlyImportRoute: "/api/v1/target-gaps/import-jsonl-package?validateOnly=true",
    setupWriteRoute: null,
    setupReadbackRoute: null,
    setupBulkImportRoute: null,
    setupDryRunImportRoute: null,
    setupValidateOnlyImportRoute: null,
    targetGapReadbackRoute: "/api/v1/target-gaps",
    targetGapReadbackItemRoute: "/api/v1/target-gaps/positions",
    workflowTemplateId: "position-intake",
    bulkImportWorkflowTemplateId: "position-intake-jsonl-import",
    setupWorkflowTemplateId: null,
    setupBulkImportWorkflowTemplateId: null,
    actorRole: "admin_or_operator",
    setupActorRole: null,
    templateReadbackRoute: "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions",
    expandedTemplateReadbackRoute: "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&expand=remaining",
    cappedExpandedTemplateReadbackRoute: "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&expand=remaining&maxExpandedRecords=100",
    templateReadbackRoutes: [
      "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions",
      "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&expand=remaining",
      "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&expand=remaining&maxExpandedRecords=100",
    ],
    estimatedRecordsRequired: 117,
    estimatedSetupRecordsRequired: 0,
    expectedResourceDelta: 117,
    setupExpectedResourceDelta: 0,
    operatorActions: [
      {
        id: "target_scale_and_data_collection:collect:positions",
        checklistRowId: "target_scale_and_data_collection",
        label: "position intake rows",
        importImpact: expectedPositionImportImpact,
        setupImportImpact: null,
        importImpacts: [expectedPositionImportImpact],
        writeRoute: "/api/v1/intake/positions",
        bulkImportRoute: "/api/v1/intake/positions/import-jsonl",
        dryRunImportRoute: "/api/v1/intake/positions/import-jsonl?dryRun=true",
        validateOnlyImportRoute: "/api/v1/intake/positions/import-jsonl?validateOnly=true",
        setupBulkImportRoute: null,
        setupBulkImportRoutes: [],
        readbackRoute: "/api/v1/intake/positions",
        submissionReadbackRoute: "/api/v1/intake/positions",
        setupWriteRoute: null,
        setupReadbackRoute: null,
        packageImportRoute: "/api/v1/target-gaps/import-jsonl-package",
        packageDryRunImportRoute: "/api/v1/target-gaps/import-jsonl-package?dryRun=true",
        packageValidateOnlyImportRoute: "/api/v1/target-gaps/import-jsonl-package?validateOnly=true",
        targetGapReadbackRoute: "/api/v1/target-gaps",
        targetGapReadbackItemRoute: "/api/v1/target-gaps/positions",
        verificationRoute: "/api/v1/target-gaps/positions",
        workflowTemplateId: "position-intake",
        setupWorkflowTemplateId: null,
        bulkImportWorkflowTemplateId: "position-intake-jsonl-import",
        setupBulkImportWorkflowTemplateId: null,
        setupBulkImportWorkflowTemplateIds: [],
        actorRole: "admin_or_operator",
        setupActorRole: null,
        completionEvidence: "corpus position count increases in /api/release/report targetGaps",
      },
    ],
  });
  assert.deepEqual(
    report.targetGaps.rows.find((row) => row.id === "gold_library_items").checklistRowIds,
    ["target_scale_and_data_collection", "rubric_practice_and_certification_pack"],
  );
  assert.equal(report.corpusManifest.lmcaBaseline.corpusScale.ratedCritiques, 951);
  assert.equal(report.corpusManifest.counts.positionsWithAtLeastTwoCritiques, 2);
  assert.equal(report.corpusManifest.sourceDetailCoverage.status, "source_detail_metadata_declared");
  assert.equal(report.corpusManifest.sourceDetailRows.length, 3);
  assert.equal(report.corpusManifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "VivesDebate").lmcaCount, 6);
  assert.deepEqual(
    report.lmcaComparison.raterContributionComparison
      .filter((row) => row.sourceTable === "LMCA Table 1")
      .map((row) => [row.rater, row.lmcaCount, row.countingRule]),
    [
      ["Emery Cooper", 946, "ratings_ignoring_revisions"],
      ["Caspar Oesterheld", 211, "ratings_ignoring_revisions"],
      ["Alexander Kastner", 130, "ratings_ignoring_revisions"],
      ["Linh Chi Nguyen", 103, "ratings_ignoring_revisions"],
      ["Lukas Gloor", 43, "ratings_ignoring_revisions"],
      ["Lukas Finnveden", 25, "ratings_ignoring_revisions"],
    ],
  );
  assert.equal(report.itemTextViewParity.counts.frozenRatingTextVersionRows, 7);
  assert.equal(report.itemTextViewParity.counts.evaluationRowsWithViewParity, 8);
  assert.equal(report.itemTextViewParity.releaseUseStatus, "item_text_versions_frozen_with_human_model_view_parity");
  assert.equal(report.metricEligibility.customLossEligibleItems.length, 5);
  assert.equal(report.hiddenBenchmarkFreeze.restrictedItemRefs.redaction, "membership_ids_restricted_to_admin_endpoint");
  assert.equal(report.hiddenBenchmarkFreeze.accessAudit.status, "pass");
  assert.equal(report.hiddenBenchmarkFreeze.initialBlinding.releaseUseStatus, "hidden_benchmark_initial_rating_blinding_pass");
  assert.equal(report.hiddenBenchmarkFreeze.initialBlinding.counts.undisclosedIncludedRows, 0);
  assert.equal(report.corpusManifest.adminTagRisk.tagCount, 3);
  assert.equal(report.corpusManifest.adminTagRisk.byConfounderRiskClass.known_rating_confounder, 1);
  assert.equal(report.adminTagBlinding.counts.preLockVisibilityViolationCount, 0);
  assert.equal(report.adminTagBlinding.releaseUseStatus, "admin_tag_confounder_risk_disclosed_hidden_before_lock");
  assert.equal(report.positionIntakeReadiness.counts.positionsScreened, 3);
  assert.equal(report.positionIntakeReadiness.counts.normalizationRequiredCount, 1);
  assert.equal(report.positionIntakeReadiness.counts.hiddenBenchmarkContextBlockedCount, 0);
  assert.equal(report.positionIntakeReadiness.releaseUseStatus, "position_intake_limitations_disclosed");
  assert.equal(report.rubricQaCoverage.counts.requiredFamilyCount, 33);
  assert.equal(report.rubricQaCoverage.counts.missingFamilyCount, 0);
  assert.equal(report.rubricQaCoverage.counts.protectedExposureViolationCount, 0);
  assert.equal(report.rubricQaCoverage.releaseUseStatus, "rubric_qa_pack_frozen_public_only");
  assert.equal(report.sourceExampleAnchors.counts.anchorCount, 4);
  assert.equal(report.sourceExampleAnchors.counts.exposureViolationCount, 0);
  assert.equal(report.sourceExampleAnchors.counts.humanCeilingEligibleCount, 0);
  assert.equal(report.sourceExampleAnchors.releaseUseStatus, "source_anchor_suite_public_training_only");
  assert.equal(report.protectedSplitIsolation.counts.positionClusterCount, 3);
  assert.equal(report.protectedSplitIsolation.counts.protectedCrossSplitClusterCount, 0);
  assert.equal(report.protectedSplitIsolation.counts.certificationPackOverlapCount, 0);
  assert.equal(report.protectedSplitIsolation.counts.goldProtectedOverlapCount, 0);
  assert.equal(report.protectedSplitIsolation.releaseUseStatus, "protected_split_cluster_isolation_pass");
  assert.equal(report.rubricDrift.mixedRubricSnapshotStatus, "single_rubric_version_current");
  assert.equal(report.rubricDrift.counts.recertificationOrGrandfatheringReviewCount, 0);
  assert.equal(report.rubricDrift.counts.ratersWithTargetedRetrainingFlags, 1);
  assert.equal(report.rubricDrift.releaseUseStatus, "rater_retraining_or_restriction_flags_active");
  assert.equal(report.sourceStyleAudit.counts.postLockAudits, 3);
  assert.equal(report.sourceStyleAudit.releaseUseStatus, "residual_unblinding_disclosure_required");
  assert.equal(report.correctnessVerification.releaseUseStatus, "verification_review_required_before_benchmark_or_public_release");
  assert.equal(report.adjudicationMemoAudit.counts.memoCount, 2);
  assert.equal(report.adjudicationMemoAudit.counts.completeAmbiguityMemoCount, 2);
  assert.equal(report.adjudicationMemoAudit.counts.bottomLineDependentItemCount, 1);
  assert.equal(report.adjudicationMemoAudit.releaseUseStatus, "adjudication_limitations_preserved");
  assert.equal(report.postDiscussionDisagreement.counts.releaseCriticalItemCount, 3);
  assert.equal(report.postDiscussionDisagreement.counts.highSpreadItemCount, 0);
  assert.equal(report.postDiscussionDisagreement.counts.missingMemoHighSpreadItemCount, 0);
  assert.equal(report.postDiscussionDisagreement.releaseUseStatus, "post_discussion_spread_check_thin_no_high_spread_observed");
  assert.equal(report.humanCeiling.releaseUseStatus, "human_ceiling_claims_blocked_thinner_than_appendix_c");
  assert.equal(report.humanCeiling.raterItemCoverage.commonOverlapItemIds.length, 1);
  assert.equal(report.validationTrancheReport.releaseUseStatus, "validation_tranches_separated_seed_thin");
  assert.deepEqual(report.validationTrancheReport.randomSentinel.itemIds, ["pos-voting::crit-voting-bullet"]);
  assert.deepEqual(report.validationTrancheReport.hardCaseStress.itemIds, ["pos-voting::crit-voting-style"]);
  assert.equal(report.candidateIntakeQualityAudit.counts.unqualifiedScaleEligibleCritiques, 3);
  assert.equal(report.candidateIntakeQualityAudit.counts.duplicateGeneratedOutputs, 1);
  assert.equal(report.candidateIntakeQualityAudit.releaseUseStatus, "marginal_informativeness_audit_disclosed_low_redundancy_controls");
  assert.equal(report.raterCompositionConflicts.counts.includedRaterCount, 4);
  assert.equal(report.raterCompositionConflicts.counts.releaseCriticalItemCount, 3);
  assert.equal(report.raterCompositionConflicts.counts.conflictFlagCount, 0);
  assert.equal(report.raterCompositionConflicts.counts.topicExpertiseMissingItemCount, 1);
  assert.deepEqual(report.raterCompositionConflicts.topicExpertiseMissingRows.map((row) => row.itemId), ["pos-voting::crit-voting-style"]);
  assert.equal(report.raterCompositionConflicts.policy.requiredReleaseCriticalTierDiversityMin, 2);
  assert.equal(report.raterCompositionConflicts.counts.raterTierDiversityMissingItemCount, 2);
  assert.deepEqual(
    report.raterCompositionConflicts.tierDiversityMissingRows.map((row) => [row.itemId, row.raterTierDiversity]),
    [
      ["pos-mind::crit-mind-zombie", ["expert"]],
      ["pos-voting::crit-voting-style", ["undergraduate"]],
    ],
  );
  assert.equal(report.raterCompositionConflicts.counts.singleRaterDominatedReleaseCriticalItemCount, 2);
  assert.equal(report.raterCompositionConflicts.releaseUseStatus, "rater_composition_limitations_disclosed");
  assert.equal(report.rubricIssueFlags.counts.strengthCentralityAllocationAmbiguityCount, 1);
  assert.equal(report.rubricIssueFlags.counts.correctnessWeightingIssueCount, 1);
  assert.equal(report.rubricIssueFlags.counts.clarityAfterEffortIssueCount, 1);
  assert.equal(report.rubricIssueFlags.counts.observedIssueFlagFamilyCount, 10);
  assert.equal(report.rubricIssueFlags.counts.coveredIssueFlagCount, 10);
  assert.equal(report.rubricIssueFlags.counts.byFlag.midRangeStrengthUncertainty, 1);
  assert.equal(report.rubricIssueFlags.counts.byFlag.vagueGoodObjectionGesture, 1);
  assert.equal(report.rubricIssueFlags.releaseUseStatus, "rubric_issue_flags_separated_from_product_disagreement");
  assert.equal(report.critiqueGenerationEvaluation.aggregateCounts.generatedOutputs, 6);
  assert.equal(report.critiqueGenerationEvaluation.releaseUseStatus, "generation_evaluation_separate_with_blind_rating_coverage");
  assert.equal(report.promptParserProvenance.releaseUseStatus, "seed_prompt_parser_provenance_complete");
  assert.equal(report.promptParserProvenance.counts.missingPromptReferenceCount, 0);
  assert.equal(report.promptParserProvenance.counts.missingParserReferenceCount, 0);
  assert.equal(report.labelSnapshotReliability.reliabilityWeightModel.fitDataProvenance.protectedRatingsUsedForFit, 0);
  assert.equal(report.labelSnapshotReliability.reliabilityWeightModel.effectiveContribution.maxSingleRaterContributionShare, 1);
  assert.equal(report.labelSnapshotReliability.reliabilityWeightModel.releaseUseStatus, "uniform_weights_frozen_with_sensitivity_report");
  assert.equal(report.ratingRevisionAudit.counts.blindInitialRows, 6);
  assert.equal(report.ratingRevisionAudit.counts.revisionRows, 0);
  assert.equal(report.ratingRevisionAudit.counts.expertCheckRows, 1);
  assert.equal(report.ratingRevisionAudit.counts.denominatorInflationExcludedRows, 1);
  assert.equal(report.ratingRevisionAudit.releaseUseStatus, "revision_and_check_denominators_separated");
  assert.equal(report.labelChannelSeparation.counts.auditedSurfaces, 5);
  assert.equal(report.labelChannelSeparation.counts.violationCount, 0);
  assert.equal(report.labelChannelSeparation.counts.forbiddenTrainingChannelRows, 0);
  assert.equal(report.labelChannelSeparation.releaseUseStatus, "lmca_argumentative_quality_channel_separated");
  assert.equal(report.recalibratedEvaluation.calibrationArtifact.protectedLeakageCount, 0);
  assert.equal(report.recalibratedEvaluation.releaseUseStatus, "recalibrated_report_protected_fit_excluded");
  assert.equal(report.modelFailureAudits[0].claimGatedDiagnostics.releaseUseStatus, "claim_gated_diagnostics_deferred_no_robustness_claim");
  assert.equal(report.modelFailureAudits[0].claimGatedDiagnostics.suites[0].status, "deferred_no_robustness_claim");
  assert.equal(report.promptArtifacts.length, 4);
  assert.equal(report.promptArtifacts.find((artifact) => artifact.id === "appendix-g-overall-v1").outputFormatPolicy, "json_overall_only_no_subscore_imputation");
  assert.equal(report.promptTrackSeparation.counts.promptTrackRows, 4);
  assert.equal(report.promptTrackSeparation.counts.appendixGExactRows, 1);
  assert.equal(report.promptTrackSeparation.counts.protectedExampleViolationCount, 0);
  assert.equal(report.promptTrackSeparation.releaseUseStatus, "appendix_g_baseline_separated_from_project_prompt_tracks");
  assert.equal(report.samePositionContext.releaseUseStatus, "same_position_context_parity_preserved");
  assert.equal(report.leaderboardReport.unresolvedComparisonGroups.length, 1);
  assert.equal(report.leaderboardReport.releaseUseStatus, "point_estimate_ordering_only_unresolved_within_uncertainty");
  assert.equal(report.leaderboardReport.claimGatedDiagnosticSummary.releaseUseStatus, "claim_gated_diagnostics_deferred_no_robustness_claim");
  assert.equal(report.leaderboardReport.claimGatedDiagnosticSummary.sycophancyOrthodoxySensitivity.notRunRationales.length, 2);
  assert.equal(report.leaderboardReport.claimGatedDiagnosticSummary.obfuscatedArgumentStress.notRunRationales.length, 2);
  const suppressedClaimReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      comparabilityClaims: [
        {
          id: "comparability-claim-report-robustness",
          releaseId: "release-test",
          releaseGateProfileId: "gate-release-test",
          primaryRaterAnchorPolicyId: "primary-rater-anchor-policy-release-test",
          robustnessClaims: ["obfuscation_robustness"],
        },
      ],
      diagnosticDeferralVisibilityPolicies: [diagnosticDeferralVisibilityPolicy("diagnostic-deferral-visibility-policy-release-test")],
      diagnosticDeferralRecords: [
        {
          id: "diagnostic-deferral-report-obfuscation",
          releaseId: "release-test",
          diagnosticDeferralVisibilityPolicyId: "diagnostic-deferral-visibility-policy-release-test",
          diagnosticClass: "obfuscated_argument_stress",
          diagnosticName: "obfuscation_stress",
          claimAffected: "obfuscation_robustness",
          notRunReason: "Diagnostic deferred before release.",
          approvedWeakerClaimWording: "Obfuscation robustness is not claimed for this release.",
          publicVisibilityLevel: "public_weaker_claim_summary",
          claimSuppressionAction: "suppress_stronger_claim",
          publicSummaryText: "Obfuscation robustness is not claimed for this release because the diagnostic was deferred.",
          protectedContentDisclosureCheck: "no_hidden_or_protected_content_disclosed",
          diagnosticDeferralReviewStatus: "visibility_review_complete",
          strongerClaimSuppressed: true,
          reviewerId: "expert-reviewer",
          reviewerRole: "expert",
          createdAt: "2026-10-01T00:00:00.000Z",
        },
      ],
    },
  );
  assert.equal(
    suppressedClaimReport.modelFailureAudits[0].claimGatedDiagnostics.releaseUseStatus,
    "claim_gated_diagnostics_deferred_with_claim_suppression",
  );
  assert.equal(
    suppressedClaimReport.leaderboardReport.claimGatedDiagnosticSummary.releaseUseStatus,
    "claim_gated_diagnostics_deferred_with_claim_suppression",
  );
  assert.equal(
    suppressedClaimReport.leaderboardReport.claimGatedDiagnosticSummary.obfuscatedArgumentStress.notRunRationales[0].approvedDeferralId,
    "diagnostic-deferral-report-obfuscation",
  );
  const errataWarningReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      releaseErratumDisclosurePolicies: [
        {
          id: "release-erratum-disclosure-policy-report-warning",
          policyVersion: "release-erratum-disclosure-rlhf90-v1",
          disclosureThresholdByErratumType: releaseErratumDisclosureThresholds,
          publicDisclosureRequiredFor: releaseErratumApiWarningTypes,
          apiWarningRequiredFor: releaseErratumApiWarningTypes,
          exportBlockRequiredFor: releaseErratumExportBlockTypes,
          internalOnlyAllowedPolicy:
            "internal-only errata are allowed only for other defects with no published artifact, export, denominator, rights, source, metric, leaderboard, or release-claim change",
          supersessionPolicy: "affected published artifacts must be deprecated or superseded without mutating historical releases or leaderboards",
          approvalPolicy: "release admin approval required before erratum publication or internal-only classification",
          frozenAt: "2026-10-01T00:10:30.000Z",
        },
      ],
      releaseErrata: [
        {
          id: "release-erratum-report-warning",
          releaseErratumDisclosurePolicyId: "release-erratum-disclosure-policy-report-warning",
          releaseId: "release-test",
          erratumType: "denominator_error",
          affectedArtifactIds: ["release-report-release-test"],
          defectSummary: "A denominator claim in the frozen report needs a superseding artifact.",
          impactedMetricsClaims: ["rating_count_denominator", "leaderboard_common_subset"],
          artifactDeprecationStatus: "superseded",
          supersedingArtifactIds: ["release-report-release-test-v2"],
          apiDownloadWarningBlockPolicy: "warning_and_link_superseding_release_report",
          remediationStatus: "superseding_artifact_published",
          historicalArtifactsMutated: false,
          historicalLeaderboardMutationPolicy: "do not mutate historical leaderboard; publish superseding artifact",
          status: "issued",
          approvedBy: "release-admin",
          createdAt: "2026-10-01T00:11:00.000Z",
        },
      ],
    },
  );
  assert.equal(errataWarningReport.releaseClaimWarnings.counts.errataWarningCount, 1);
  assert.equal(errataWarningReport.releaseClaimWarnings.apiDownloadWarningRows[0].claimWarningStatus, "impacted_metrics_or_claims_require_warning");
  assert.equal(errataWarningReport.releaseClaimWarnings.apiDownloadWarningRows[0].apiDownloadWarningBlockPolicy, "warning_and_link_superseding_release_report");
  assert.equal(report.metricDirectionalityConfig.counts.pairwiseConfigRows, 3);
  assert.equal(report.metricDirectionalityConfig.counts.configViolationCount, 0);
  assert.equal(report.metricDirectionalityConfig.directionalityRows[0].callSignature, "customWeightedLoss(targetLabel, modelPrediction)");
  assert.equal(report.metricDirectionalityConfig.releaseUseStatus, "metric_config_and_directionality_declared");
  assert.equal(report.reasoningModeSensitivity.status, "no_paired_reasoning_mode_run_deferred");
  assert.equal(report.reasoningModeSensitivity.table6SourceBaseline.length, 4);
  assert.equal(report.modelFailureAudits[0].leaderboardReportId, report.leaderboardReport.id);
  assert.equal(report.pairedTargetLabelSnapshots.primaryRaterAnchorSnapshot.primaryRaterAnchor.raterId, "rater-a");
  assert.equal(report.pairedTargetLabelSnapshots.coverageOverlap.overlapItemCount, 2);
  assert.equal(report.pairedTargetLabelSnapshots.rankSensitivity.status, "no_point_estimate_order_change_on_overlap");
  assert.equal(report.modelAssistedLabelOverlap.releaseUseStatus, "clean_no_model_assisted_label_overlap");
  assert.equal(report.modelAssistedLabelOverlap.humanOnlyPreAssistanceTarget.sameAsTargetLabelSnapshot, true);

  const claims = buildComparabilityClaimMatrix({
    corpusManifest: report.corpusManifest,
    metricEligibility: report.metricEligibility,
    validationDesign: report.validationDesign,
    labelSnapshot: snapshot,
  });
  assert.equal(claims.find((claim) => claim.tier === "method_preserving").status, "passes");
  assert.equal(claims.find((claim) => claim.tier === "corpus_scale_comparable").status, "fails");
  assert.equal(claims.find((claim) => claim.tier === "replication_like").status, "fails");
});

test("submitted critique-generation artifacts drive generation denominators and prompt-track evidence", () => {
  const releaseId = "generation-artifact-evidence-test";
  const snapshot = createLabelSnapshot(
    "snapshot-generation-artifact-evidence-test",
    releaseId,
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      critiqueGenerationRuns: [
        {
          id: "generation-run-submitted",
          generatorRequestedModelAlias: "generator-under-test",
          generatorProvider: "internal_eval_gateway",
          generatorResolvedModelSnapshot: "generator-under-test-2026-10-01",
          requestedModelAlias: "generator-under-test",
          resolvedModelSnapshot: "generator-under-test-2026-10-01",
          modelProviderDataHandlingPolicyId: "model-provider-data-handling-submitted-critique_generation",
          promptTemplateId: "candidate-gen-v3",
          renderedPromptChecksum: "sha256-generation-run-submitted",
          sourceSplit: "public_train",
          positionIds: ["pos-ai-prior"],
          generationParameters: { temperature: 0.7, maxOutputsPerPosition: 1 },
          generationBudgetPerPosition: 1,
          outputsRequested: 1,
          outputsGenerated: 1,
          emptyRefusalCount: 0,
          duplicateNearDuplicateCount: 0,
          outputFilteringPolicy: "deduplicate_then_human_review",
          judgeScreeningPolicy: "model_judge_scores_hidden_from_raters",
          blindRatingBeforeScreening: true,
          aliasStabilityStatus: "resolved_snapshot_recorded",
          createdBy: "demo-admin",
          timestamp: "2026-10-01T00:00:00.000Z",
          modelJudgeScreening: {
            promptTemplateId: "candidate-judge-v2",
            scoresVisibleToInitialRaters: false,
            diagnosticOnly: true,
            modelProviderDataHandlingPolicyId: "model-provider-data-handling-submitted-model_judge",
          },
        },
      ],
      modelProviderDataHandlingPolicies: completeParticipantSafeguardFixtures().modelProviderDataHandlingPolicies,
      generatedCritiqueSubmissions: [
        {
          id: "generated-critique-submitted",
          generationRunId: "generation-run-submitted",
          positionId: "pos-ai-prior",
          rawGeneratedText: "The position should account for base-rate failures in adjacent forecasting domains.",
          normalizedRaterVisibleText: "The position should account for base-rate failures in adjacent forecasting domains.",
          generationIndex: 0,
          generationOutputStatus: "generated",
          generatorMetadataHiddenFromRaters: true,
          rightsStatus: "cleared_internal",
          selectionReasons: ["judge_disagreement"],
          modelJudgeScore: 0.71,
          timestamp: "2026-10-01T00:01:00.000Z",
        },
      ],
      generatedCritiquePromotions: [
        {
          id: "generated-critique-promotion-submitted",
          generatedCritiqueId: "generated-critique-submitted",
          promotedCritiqueId: "crit-ai-base-rate",
          promotionStatus: "promoted_after_human_review",
          humanReviewStatus: "passed_trained_human_review",
          generatorMetadataHiddenFromRaters: true,
          promotedBy: "demo-admin",
          promotedAt: "2026-10-01T00:02:00.000Z",
        },
      ],
      generationEvaluationReports: [
        {
          id: "generation-evaluation-report-submitted",
          generationRunIds: ["generation-run-submitted"],
          labelSnapshotId: snapshot.id,
          commonPositionSetPolicy: "common_positions_required_for_generator_comparison",
          headlineMetric: "blind_human_rated_promoted_outputs",
          commonGenerationBudgetPolicy: "budget_matched",
          filteringSelectionPolicy: "uncurated_random_sample_plus_best_of_n_diagnostic",
          uncuratedRandomSampleMetric: "uncurated_random_sample_metric_over_all_generated_outputs",
          bestOfNPolicy: "best_of_n_reported_against_declared_generation_budget",
          topKPolicy: "top_k_and_curated_views_reported_separately_as_diagnostics",
          uncuratedRandomSampleMetrics: { ratedCount: 1, meanOverall: 0.61 },
          bestOfNMetrics: { n: 1, passAtThreshold: 1, threshold: 0.6 },
          counts: { generated: 1, refusal: 0, duplicate: 0, filtered: 0, promoted: 1, rated: 1 },
          passThresholdOverall: 0.6,
          createdBy: "demo-admin",
          timestamp: "2026-10-01T00:03:00.000Z",
        },
      ],
    },
  );
  const submittedRun = report.critiqueGenerationEvaluation.runRows.find((row) => row.id === "generation-run-submitted");
  assert.ok(submittedRun);
  assert.equal(submittedRun.runSource, "submitted_workflow_critique_generation_run");
  assert.deepEqual(submittedRun.submittedGenerationEvaluationReportIds, ["generation-evaluation-report-submitted"]);
  assert.equal(submittedRun.outputStatusCounts.promoted_to_rating, 1);
  assert.equal(submittedRun.counts.generatedOutputs, 1);
  assert.equal(submittedRun.counts.blindHumanRatedPromoted, 1);
  assert.equal(submittedRun.generationRunContractStatus, "critique_generation_run_contract_complete");
  assert.equal(submittedRun.generationWorkflowContractViolationCount, 0);
  assert.equal(submittedRun.generatedSubmissionContractViolationCount, 0);
  assert.equal(submittedRun.generatedPromotionContractViolationCount, 0);
  assert.equal(submittedRun.generationEvaluationReportContractViolationCount, 0);
  assert.equal(submittedRun.metricDefinitions.uncuratedRandomSampleMetric, "uncurated_random_sample_metric_over_all_generated_outputs");
  assert.equal(submittedRun.metricDefinitions.bestOfNPolicy, "best_of_n_reported_against_declared_generation_budget");
  assert.equal(submittedRun.metricDefinitions.topKPolicy, "top_k_and_curated_views_reported_separately_as_diagnostics");
  assert.equal(submittedRun.metricDefinitions.passThresholdOverall, 0.6);
  assert.equal(submittedRun.modelProviderPolicyBinding.generator.modelProviderDataHandlingPolicyId, "model-provider-data-handling-submitted-critique_generation");
  assert.equal(submittedRun.modelProviderPolicyBinding.modelJudge.modelProviderDataHandlingPolicyId, "model-provider-data-handling-submitted-model_judge");
  assert.equal(report.critiqueGenerationEvaluation.providerPolicyEvidence.releaseUseStatus, "critique_generation_provider_policies_approved");
  assert.equal(report.critiqueGenerationEvaluation.submittedWorkflowContractEvidence.releaseUseStatus, "critique_generation_workflow_contract_complete");
  assert.equal(report.critiqueGenerationEvaluation.aggregateCounts.generatedOutputs, 7);
  assert.equal(report.critiqueGenerationEvaluation.aggregateCounts.promotedToRating, 3);
  assert.equal(report.promptTrackSeparation.counts.generationPromptTrackRows, 4);
  assert.equal(report.promptTrackSeparation.rows.some((row) => row.runId === "generation-run-submitted"), true);
  assert.equal(report.candidateIntakeQualityAudit.generatedOutputStatusCounts.promoted_to_rating, 3);

  const underdeclaredReport = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      critiqueGenerationRuns: [
        {
          id: "generation-run-underdeclared",
          promptTemplateId: "candidate-gen-v3",
        },
      ],
      generatedCritiqueSubmissions: [
        {
          id: "generated-critique-underdeclared",
          generationRunId: "generation-run-underdeclared",
          positionId: "pos-ai-prior",
          generationOutputStatus: "generated",
        },
      ],
      generationEvaluationReports: [
        {
          id: "generation-evaluation-report-underdeclared",
          generationRunIds: ["generation-run-underdeclared"],
        },
      ],
    },
  );
  const underdeclaredRun = underdeclaredReport.critiqueGenerationEvaluation.runRows.find((row) => row.id === "generation-run-underdeclared");
  assert.equal(underdeclaredRun.generationRunContractStatus, "critique_generation_run_contract_review_required");
  assert.equal(underdeclaredRun.generatedSubmissionContractViolationCount, 1);
  assert.equal(underdeclaredRun.generationEvaluationReportContractViolationCount, 1);
  assert.equal(
    underdeclaredReport.critiqueGenerationEvaluation.submittedWorkflowContractEvidence.releaseUseStatus,
    "critique_generation_workflow_contract_review_required",
  );
  assert.ok(
    underdeclaredReport.critiqueGenerationEvaluation.submittedWorkflowContractEvidence.reviewSections.some(
      (section) => section.artifactType === "critique_generation_run" && section.reason.includes("generatorProvider"),
    ),
  );
  assert.ok(
    underdeclaredReport.critiqueGenerationEvaluation.submittedWorkflowContractEvidence.reviewSections.some(
      (section) => section.artifactType === "generated_critique_submission" && section.reason.includes("rawGeneratedText"),
    ),
  );
  assert.ok(
    underdeclaredReport.critiqueGenerationEvaluation.submittedWorkflowContractEvidence.reviewSections.some(
      (section) => section.artifactType === "generation_evaluation_report" && section.reason.includes("commonPositionSetPolicy"),
    ),
  );
  assert.ok(
    underdeclaredReport.critiqueGenerationEvaluation.submittedWorkflowContractEvidence.reviewSections.some(
      (section) => section.artifactType === "generation_evaluation_report" && section.reason.includes("uncuratedRandomSampleMetric"),
    ),
  );
  assert.equal(
    underdeclaredReport.critiqueGenerationEvaluation.releaseUseStatus,
    "generation_evaluation_requires_blinding_rating_coverage_provider_policy_or_contract_review",
  );
});

test("submitted rater-reliability weight models become label-snapshot provenance evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-reliability-weight-model-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      raterReliabilityWeightModels: [
        {
          id: "weight-model-submitted",
          reliabilityWeightModelId: "uniform-v1-with-sensitivity",
          modelName: "submitted_uniform_with_sensitivity",
          version: "v1",
          fitDataSource: "certification_and_adjudicated_training_mix",
          protectedSplitExclusions: ["hidden_benchmark", "internal_validation"],
          fittedAt: "2026-10-01T00:00:00.000Z",
          fittedBy: "demo-admin",
          raterWeightsByDimension: { "rater-a": { overall: 1 }, "rater-b": { overall: 1 } },
          weightCaps: { maxSingleRaterShare: 0.6 },
          maximumSingleRaterWeightShare: 0.5,
          effectiveSampleSizeByDimension: { overall: 8, clarity: 8 },
          unweightedSensitivitySnapshotId: "snapshot-reliability-weight-model-test-unweighted",
          medianSensitivitySnapshotId: "snapshot-reliability-weight-model-test-median",
        },
      ],
    },
  );
  assert.equal(report.raterReliabilityWeightModelEvidence.submittedModelCount, 1);
  assert.equal(report.raterReliabilityWeightModelEvidence.activeSubmittedModelId, "weight-model-submitted");
  assert.equal(report.raterReliabilityWeightModelEvidence.reviewRows.length, 0);
  assert.equal(report.raterReliabilityWeightModelEvidence.releaseUseStatus, "active_submitted_weight_model_provenance_complete");
  assert.equal(
    report.labelSnapshotReliability.raterReliabilityWeightModelEvidence.activeSubmittedReliabilityWeightModelId,
    "uniform-v1-with-sensitivity",
  );

  const reviewReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      raterReliabilityWeightModels: [
        {
          id: "weight-model-review",
          reliabilityWeightModelId: "uniform-v1-with-sensitivity",
          modelName: "submitted_uniform_missing_review_fields",
          version: "v1",
          fitDataSource: "hidden_benchmark_model_performance",
          protectedSplitExclusions: ["internal_validation"],
          raterWeightsByDimension: { "rater-a": { overall: 1 } },
          weightCaps: { maxSingleRaterShare: 0.4 },
          maximumSingleRaterWeightShare: 0.7,
        },
      ],
    },
  );
  assert.equal(reviewReport.raterReliabilityWeightModelEvidence.reviewRows.length, 1);
  assert.equal(
    reviewReport.raterReliabilityWeightModelEvidence.reviewRows[0].protectedSplitExclusionStatus,
    "protected_split_exclusion_review_required",
  );
  assert.equal(reviewReport.raterReliabilityWeightModelEvidence.reviewRows[0].fitSourceStatus, "fit_source_review_required");
  assert.equal(reviewReport.raterReliabilityWeightModelEvidence.reviewRows[0].weightCapStatus, "weight_cap_review_required");
  assert.equal(reviewReport.raterReliabilityWeightModelEvidence.reviewRows[0].sensitivityStatus, "sensitivity_links_missing");
  assert.equal(reviewReport.raterReliabilityWeightModelEvidence.releaseUseStatus, "active_submitted_weight_model_provenance_review_required");
});

test("label aggregation reliability checklist binds snapshots, weighting, disagreement, and overlap evidence", () => {
  const report = buildOctoberReleaseReport();
  const checklist = report.labelAggregationReliabilityChecklist;

  assert.equal(checklist.releaseUseStatus, "label_aggregation_reliability_requirements_evidenced");
  assert.equal(checklist.counts.checklistRows, 9);
  assert.equal(checklist.counts.reviewRequiredRows, 0);
  assert.equal(checklist.counts.includedRatingCount, report.labelSnapshotReliability.includedRatingProvenance.includedRatingCount);
  assert.equal(checklist.counts.blindInitialRows, report.ratingRevisionAudit.counts.blindInitialRows);
  assert.equal(
    checklist.counts.maxSingleRaterContributionShare,
    report.labelSnapshotReliability.reliabilityWeightModel.effectiveContribution.maxSingleRaterContributionShare,
  );
  assert.match(checklist.policy.scope, /LabelSnapshot/);
  assert.match(checklist.policy.scope, /AdjudicationMemo/);
  assert.match(checklist.policy.duplicationBoundary, /does not create a new label snapshot/);
  assert.match(checklist.policy.releaseClaimBoundary, /single-rater dominance/);
  assert.deepEqual(
    checklist.rows.map((row) => row.id),
    [
      "immutable_label_snapshot_and_denominators",
      "frozen_reliability_weight_model",
      "protected_fit_exclusion",
      "unweighted_median_sensitivity",
      "rater_dominance_disclosed",
      "disagreement_policy_and_post_discussion",
      "adjudication_memos_and_minority_rationales",
      "metric_directionality_and_low_clarity",
      "model_assisted_overlap_disclosed",
    ],
  );
  assert.ok(
    checklist.rows
      .find((row) => row.id === "disagreement_policy_and_post_discussion")
      .sourceStatuses.includes(report.postDiscussionDisagreement.releaseUseStatus),
  );
  assert.ok(
    checklist.rows
      .find((row) => row.id === "model_assisted_overlap_disclosed")
      .sourceStatuses.includes(report.modelAssistedLabelOverlap.releaseUseStatus),
  );

  const reviewChecklist = buildLabelAggregationReliabilityChecklistReport("release-review", {
    labelSnapshotReliability: {
      ...report.labelSnapshotReliability,
      reliabilityWeightModel: {
        ...report.labelSnapshotReliability.reliabilityWeightModel,
        fitDataProvenance: {
          ...report.labelSnapshotReliability.reliabilityWeightModel.fitDataProvenance,
          protectedRatingsUsedForFit: 1,
        },
      },
      aggregationSensitivity: {
        ...report.labelSnapshotReliability.aggregationSensitivity,
        medianSensitivityAvailable: false,
      },
    },
    raterReliabilityWeightModelEvidence: {
      ...report.raterReliabilityWeightModelEvidence,
      releaseUseStatus: "active_submitted_weight_model_provenance_review_required",
      reviewRows: [{ id: "weight-model-review-row" }],
    },
    ratingRevisionAudit: report.ratingRevisionAudit,
    postDiscussionDisagreement: {
      ...report.postDiscussionDisagreement,
      counts: {
        ...report.postDiscussionDisagreement.counts,
        missingMemoHighSpreadItemCount: 1,
      },
    },
    adjudicationMemoAudit: report.adjudicationMemoAudit,
    disagreementThresholdPolicyEvidence: report.disagreementThresholdPolicyEvidence,
    metricDirectionalityConfig: {
      ...report.metricDirectionalityConfig,
      releaseUseStatus: "metric_config_or_directionality_review_required",
      counts: {
        ...report.metricDirectionalityConfig.counts,
        directionalityViolationCount: 1,
      },
    },
    modelAssistedLabelOverlap: report.modelAssistedLabelOverlap,
  });
  assert.equal(reviewChecklist.releaseUseStatus, "label_aggregation_reliability_review_required");
  assert.ok(
    reviewChecklist.reviewSections.some(
      (section) => section.artifactId === "protected_fit_exclusion" && section.reason === "fitDataProvenance.protectedRatingsUsedForFit",
    ),
  );
  assert.ok(
    reviewChecklist.reviewSections.some(
      (section) => section.artifactId === "unweighted_median_sensitivity" && section.reason === "aggregationSensitivity.medianSensitivityAvailable",
    ),
  );
  assert.ok(
    reviewChecklist.reviewSections.some(
      (section) => section.artifactId === "disagreement_policy_and_post_discussion" && section.reason === "postDiscussionDisagreement.missingMemoHighSpreadItemCount",
    ),
  );
  assert.ok(
    reviewChecklist.reviewSections.some(
      (section) => section.artifactId === "metric_directionality_and_low_clarity" && section.reason === "metricDirectionalityConfig.releaseUseStatus",
    ),
  );
});

test("submitted label, corpus, training, and export manifests are checked against current release artifacts", () => {
  const releaseId = "release-artifact-evidence-test";
  const snapshot = createLabelSnapshot(
    "snapshot-release-artifact-evidence-test",
    releaseId,
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      trainingExportUncertaintyPolicies: [trainingExportUncertaintyPolicy("training-export-uncertainty-policy-release-artifact-submitted")],
      labelSnapshots: [
        {
          id: "label-snapshot-submitted",
          releaseId,
          targetLabelVersion: "initial_mean",
          snapshotFamily: "initial_mean",
          pairwiseComparisonSnapshotId: `training-pairwise-${releaseId}`,
          ratingCountDenominatorSummary: { blindInitialRatings: 6, revisions: 0, totalRows: 7 },
        },
      ],
      corpusManifests: [
        {
          id: "corpus-manifest-submitted",
          releaseId,
          positionCount: 3,
          critiqueCount: 5,
          blindInitialRatingCount: 6,
          ratingsIgnoringRevisionsCount: 7,
        },
      ],
      trainingExports: [
        {
          id: "training-export-submitted",
          releaseId,
          sourceLabelSnapshotId: "label-snapshot-submitted",
          sourceSplits: ["public_train"],
          excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
          futureTrainingExportExcludedRaterIds: [],
          volunteerWithdrawalExclusionRequestIds: [],
          targetLabelVersion: "initial_mean",
          targetFields: ["overall", "centrality_x_strength"],
          exportKind: "model_improvement_training_export",
          promptTrackExposurePolicy: "project_full_rubric_training",
          pairwiseComparisonSnapshotId: `training-pairwise-${releaseId}`,
          pairwiseComparisonSnapshotStatus: "computed_pairwise_snapshot_used",
          trainingExportUncertaintyPolicyId: "training-export-uncertainty-policy-release-artifact-submitted",
          trainingExportUncertaintyPolicyReleaseUseStatus: "submitted_training_export_uncertainty_policy_active",
          labelUncertaintyDownweightingPolicy:
            "exact_policy_backed_downweighting_for_uncertainty_flagged_high_spread_thin_coverage_and_low_margin_training_rows",
          labelUncertaintyDownweightingPolicyId: "training-export-uncertainty-policy-release-artifact-submitted",
          uncertaintyThresholdsApplied: trainingExportUncertaintyThresholds,
          labelUncertaintyDownweightingRules: trainingExportDownweightRules,
          pairwiseMarginThresholdPolicy: "pairwise_margin_threshold_0_20_with_continuous_weights",
          lowMarginHandlingPolicy: "low_margin_pairs_retained_with_downweighting_and_flags",
          humanTargetTiePolicy: "human_ties_excluded_from_pairwise_preferences",
          modelPredictionIndifferencePolicy: "model_indifference_costs_half_margin",
          lowClarityPolicy: "low_clarity_rows_keep_clarity_and_overall_with_provisional_subscores",
          rationaleInclusionPolicy: "rationales_included_only_when_rights_and_release_policy_allow",
          promptExampleContaminationCheck: "protected_and_hidden_prompt_examples_excluded_from_training_export",
          releaseRightsEligibilitySummary: "rights_cleared_public_train_only",
          itemTextVersionHashManifest: {
            itemTextVersionIds: ["ctv-ai-base-rate-v1", "ctv-ai-generic-v1", "ptv-ai-prior-v1"],
            rows: [
              {
                itemId: "pos-ai-prior::crit-ai-base-rate",
                positionId: "pos-ai-prior",
                critiqueId: "crit-ai-base-rate",
                positionTextVersionId: "ptv-ai-prior-v1",
                critiqueTextVersionId: "ctv-ai-base-rate-v1",
                positionCanonicalHash: "sha256:ptv-ai-prior-v1:canonical",
                critiqueCanonicalHash: "sha256:ctv-ai-base-rate-v1:canonical",
              },
              {
                itemId: "pos-ai-prior::crit-ai-generic",
                positionId: "pos-ai-prior",
                critiqueId: "crit-ai-generic",
                positionTextVersionId: "ptv-ai-prior-v1",
                critiqueTextVersionId: "ctv-ai-generic-v1",
                positionCanonicalHash: "sha256:ptv-ai-prior-v1:canonical",
                critiqueCanonicalHash: "sha256:ctv-ai-generic-v1:canonical",
              },
            ],
          },
          ratingContextSnapshotManifest: {
            snapshotIds: ["rc-target-only-1", "rc-target-only-ai-generic"],
            rows: [
              {
                id: "rc-target-only-1",
                positionId: "pos-ai-prior",
                policy: "target_only",
                visibleCritiqueIds: ["crit-ai-base-rate"],
                priorSiblingCritiqueIds: [],
                orderPolicy: "single_target_no_sibling_context",
                siblingExposurePattern: "none",
                humanModelParityStatus: "matchable_target_only",
              },
              {
                id: "rc-target-only-ai-generic",
                positionId: "pos-ai-prior",
                policy: "target_only",
                visibleCritiqueIds: ["crit-ai-generic"],
                priorSiblingCritiqueIds: [],
                orderPolicy: "single_target_no_sibling_context",
                siblingExposurePattern: "none",
                humanModelParityStatus: "matchable_target_only",
              },
            ],
          },
          labelMetadataManifest: {
            rows: [
              {
                itemId: "pos-ai-prior::crit-ai-base-rate",
                labelStatus: "initial_only",
                raterCount: 2,
                expertCount: 2,
                spreadPreDiscussion: 0.04,
                spreadPostDiscussion: 0.04,
                unresolvedDisagreementClass: "none_recorded",
              },
              {
                itemId: "pos-ai-prior::crit-ai-generic",
                labelStatus: "initial_only",
                raterCount: 1,
                expertCount: 1,
                spreadPreDiscussion: 0,
                spreadPostDiscussion: 0,
                unresolvedDisagreementClass: "review_before_training",
              },
            ],
          },
          volunteerWithdrawalExclusionManifest: {
            id: `training-export-withdrawal-exclusions-${releaseId}`,
            releaseId,
            policy:
              "future_training_export_exclusion_applies_to_new_training_exports_without_recomputing_already_frozen_deidentified_label_snapshots",
            futureTrainingExportExcludedRaterIds: [],
            withdrawalRequestIds: [],
            rows: [],
            affectedIncludedRatingCount: 0,
            affectedRationaleCount: 0,
            affectedItemIds: [],
            frozenLabelSnapshotDisposition: "preserved_without_recomputation",
            denominatorMutationAllowed: false,
            status: "no_future_training_export_withdrawal_exclusions",
          },
          positionBalancedWeightingPolicy: "average_or_sample_within_position_before_cross_position_training_weighting",
          positionBalancedWeighting: {
            policy: "average_or_sample_within_position_before_cross_position_training_weighting",
            status: "position_balanced_training_weights_complete",
            pointwiseRowsByPosition: { "pos-ai-prior": 2 },
            pairwiseRowsByPosition: { "pos-ai-prior": 1 },
            pointwiseWeightSumByPosition: { "pos-ai-prior": 1 },
          },
          createdBy: "release-artifact-admin",
          timestamp: "2026-10-01T00:00:00.000Z",
        },
      ],
      exportManifests: [
        {
          id: "public-export-submitted",
          kind: "public",
          releaseId,
          labelSnapshotId: "label-snapshot-submitted",
          includedSplits: ["public_train", "public_dev"],
          excludedSplits: ["hidden_benchmark", "internal_validation"],
          hiddenBenchmarkExcluded: true,
          rightsClearedOnly: true,
          counts: { positions: 1, critiques: 2 },
        },
        {
          id: "internal-export-submitted",
          kind: "internal",
          releaseId,
          labelSnapshotId: "label-snapshot-submitted",
          includedSplits: ["public_train", "public_dev", "internal_validation", "hidden_benchmark", "stress_test"],
          excludedSplits: [],
          hiddenBenchmarkExcluded: false,
          rightsClearedOnly: false,
          counts: { positions: 3, critiques: 5 },
        },
      ],
      releaseReports: [
        {
          id: "release-report-snapshot-submitted",
          releaseId,
          reportId: `release-report-${releaseId}`,
          reportCurrentStatus: "incomplete_against_october_target",
          source: "server_generated_release_report_snapshot",
          inputHash: "sha256:release-report-snapshot-submitted",
          materializedAt: "2026-10-01T00:00:00.000Z",
          materializedBy: "release-artifact-admin",
        },
      ],
    },
  );
  assert.equal(report.releaseArtifactEvidence.releaseUseStatus, "submitted_release_artifacts_match_current_release");
  assert.equal(
    report.octoberCompletionChecklist.rows.find((row) => row.id === "release_artifact_submission_package").status,
    "complete",
  );
  assert.equal(report.releaseArtifactEvidence.labelSnapshotEvidence.status, "submitted_label_snapshot_matches_current_release_target");
  assert.equal(report.releaseArtifactEvidence.corpusManifestEvidence.status, "submitted_corpus_manifest_matches_current_release_counts");
  assert.equal(report.releaseArtifactEvidence.trainingExportEvidence.status, "submitted_training_export_preserves_current_release_policy");
  assert.equal(report.trainingExport.trainingExportUncertaintyPolicyId, "training-export-uncertainty-policy-release-artifact-submitted");
  assert.equal(report.trainingExport.trainingExportUncertaintyPolicyEvidence.releaseUseStatus, "submitted_training_export_uncertainty_policy_active");
  assert.equal(
    report.releaseArtifactEvidence.trainingExportEvidence.checks.find((check) => check.field === "trainingExportUncertaintyPolicyId").status,
    "matches",
  );
  assert.equal(
    report.releaseArtifactEvidence.trainingExportEvidence.checks.find((check) => check.field === "uncertaintyThresholdsApplied").status,
    "matches",
  );
  assert.equal(
    report.releaseArtifactEvidence.trainingExportEvidence.checks.find((check) => check.field === "labelUncertaintyDownweightingRules").status,
    "matches",
  );
  assert.equal(
    report.releaseArtifactEvidence.trainingExportEvidence.checks.find((check) => check.field === "positionBalancedWeighting.status").status,
    "matches",
  );
  assert.equal(
    report.releaseArtifactEvidence.trainingExportEvidence.checks.find((check) => check.field === "itemTextVersionHashManifest").status,
    "matches",
  );
  assert.equal(
    report.releaseArtifactEvidence.trainingExportEvidence.checks.find((check) => check.field === "ratingContextSnapshotManifest").status,
    "matches",
  );
  assert.equal(
    report.releaseArtifactEvidence.trainingExportEvidence.checks.find((check) => check.field === "labelMetadataManifest").status,
    "matches",
  );
  assert.equal(report.releaseArtifactEvidence.exportManifestEvidence.status, "submitted_public_export_manifest_preserves_current_release_policy");
  assert.equal(report.releaseArtifactEvidence.internalExportManifestEvidence.status, "submitted_internal_export_manifest_preserves_current_release_policy");
  assert.equal(report.releaseArtifactEvidence.releaseReportSnapshotEvidence.status, "submitted_release_report_snapshot_matches_current_release");
  assert.deepEqual(report.releaseArtifactEvidence.reviewSections, []);

  const staleReport = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      labelSnapshots: [{ id: "label-stale", releaseId, targetLabelVersion: "adjudicated", snapshotFamily: "adjudicated" }],
      corpusManifests: [{ id: "corpus-stale", releaseId, positionCount: 999, critiqueCount: 5, blindInitialRatingCount: 6 }],
      trainingExports: [{ id: "training-stale", releaseId, sourceLabelSnapshotId: "label-stale", sourceSplits: ["public_train"], excludedProtectedSplits: ["hidden_benchmark"] }],
      exportManifests: [{ id: "export-stale", kind: "public", releaseId, includedSplits: ["public_train"], excludedSplits: [], hiddenBenchmarkExcluded: false, rightsClearedOnly: false }],
    },
  );
  assert.equal(staleReport.releaseArtifactEvidence.releaseUseStatus, "submitted_release_artifacts_review_required");
  assert.deepEqual(staleReport.releaseArtifactEvidence.reviewSections, [
    "label_snapshot",
    "corpus_manifest",
      "training_export",
      "public_export_manifest",
      "internal_export_manifest",
      "release_report_snapshot",
    ]);
  assert.equal(
    staleReport.releaseArtifactEvidence.labelSnapshotEvidence.reviewChecks.find((check) => check.field === "targetLabelVersion").status,
    "mismatch",
  );
  assert.equal(
    staleReport.releaseArtifactEvidence.exportManifestEvidence.reviewChecks.find((check) => check.field === "hiddenBenchmarkExcluded").status,
    "mismatch",
  );
});

test("submitted model-evaluation artifacts are checked against current release evidence", () => {
  const releaseId = "model-evaluation-artifact-evidence-test";
  const snapshot = createLabelSnapshot(
    "snapshot-model-evaluation-artifact-evidence-test",
    releaseId,
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const prediction = fullRubricEvaluationRun.predictions[0];
  const report = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      modelImprovementPolicies: [modelImprovementPolicy("model-improvement-policy-release-artifact-submitted")],
      modelImprovementRuns: [
        {
          id: "model-improvement-submitted",
          releaseId,
          modelImprovementPolicyId: "model-improvement-policy-release-artifact-submitted",
          trainingMethod: "pairwise_reward_model",
          trainingExportId: `training-export-${releaseId}`,
          targetLabelSnapshotId: `snapshot-${releaseId}`,
          targetLabelVersion: snapshot.targetLabelVersion,
          modelFamilyOrCheckpoint: "reward-model-candidate-a",
          optimizedSurrogateObjectiveFamily: "pairwise_logistic",
          targetFields: modelImprovementTargetFields,
          humanMarginWeightingPolicy: "weight_by_absolute_overall_gap",
          tieIndifferenceHandling: "low_margin_downweighted_or_excluded_by_export_policy",
          positionBalancedWeightingPolicy: "average_or_sample_within_position_before_cross_position_training_weighting",
          labelUncertaintyPropagationPolicy: "preserve_rater_count_spread_disagreement_taxonomy_and_label_status",
          highUncertaintyDownweightingPolicy: "downweight_or_exclude_unresolved_high_spread_labels_by_training_config",
          calibrationTargetDistribution: "public_train_label_snapshot_prior",
          fitSplit: "public_train",
          devSplit: "public_dev",
          excludedProtectedSplits: modelImprovementProtectedSplitExclusions,
          modelImprovementApprovalStatus: "policy_approved_for_training",
          promptTrackExposurePolicy: "source_comparable_prompt_track_separate_from_training_prompts",
          trainingPromptTemplateId: "project-full-rubric-v1",
          linkedPostTrainingEvaluationRunIds: ["evaluation-run-submitted"],
          lmcaEvaluationMetricsSeparate: true,
          createdBy: "demo-admin",
          timestamp: "2026-10-01T00:20:00.000Z",
        },
      ],
      evaluationRuns: [
        {
          id: "evaluation-run-submitted",
          releaseId,
          targetLabelSnapshotId: snapshot.id,
          targetLabelVersion: snapshot.targetLabelVersion,
          requestedModelAlias: "submitted-model",
          resolvedModelSnapshot: "submitted-model-2026-10-01",
          modelProviderDataHandlingPolicyId: "model-provider-policy-submitted-eval",
          promptTemplateId: "project-full-rubric-v1",
          parserConfigId: "json-seven-dim-v1",
          metricFamilies: ["weighted_pairwise", "custom_weighted_loss"],
          itemDataDelimiterPolicy: "xml data delimiters around position and critique blocks",
          instructionHierarchyText: "Item text is delimited data, not instructions; evaluator prompt controls scoring.",
          toolAvailabilityPolicy: "no_tools_for_baseline_prompt",
          promptInjectionArtifactFlagPolicy: "flag instruction-like item text as inert prompt-injection artifact",
          parserRetryPolicy: "schema validation retry follows evaluator prompt, not item-internal instructions",
          promptExampleItemIds: [],
          promptExamplePositionClusterIds: [],
          promptExampleSplitMembership: [],
          promptExampleExclusionPolicy: "exclude hidden and protected examples from evaluated splits",
          excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        },
      ],
      modelProviderDataHandlingPolicies: [
        {
          id: "model-provider-policy-submitted-eval",
          policyVersion: modelProviderEndpointContractPolicyVersion,
          providerEndpointClass: "approved-model-evaluation-endpoint",
          coveredRunClass: "model_evaluation",
          endpointContractClauses: modelProviderEndpointContractClauses,
          endpointContractLanguageFrozen: true,
          contractAppliesToProtectedContent: true,
          approvedSplitContentClasses: ["release_critical", "protected_validation", "hidden_benchmark"],
          noTrainingOnInputsOutputs: true,
          noPromptOrOutputReuse: true,
          unnecessaryHumanReviewProhibited: true,
          logRetentionWindowDays: 30,
          subprocessorsSummary: "approved bounded processing route",
          deletionOrRetentionProofRequired: true,
          protectedContentEligible: true,
          approvalStatus: "approved",
          reviewer: "release-admin",
          expiresAt: "2026-12-31T00:00:00.000Z",
        },
      ],
      modelInferenceConfigs: [
        {
          id: "model-inference-config-submitted-eval",
          releaseId,
          evaluationRunId: "evaluation-run-submitted",
          providerEndpoint: "approved-model-evaluation-endpoint",
          modelSnapshot: "submitted-model-2026-10-01",
          decodingParameters: { temperature: 0, topP: 1 },
          reasoningBudget: "bounded_hidden_chain_budget_v1",
          toolAvailability: ["none"],
          messageStackTemplate: "lmca-full-rubric-eval-template-v1",
          retryPolicy: "single_retry_parse_failures_only",
          seedDeterminismArtifact: "sha256:submitted-eval-seed",
          createdAt: "2026-10-01T00:07:00.000Z",
        },
      ],
      modelRunEnvironments: [
        {
          id: "model-run-environment-submitted-eval",
          releaseId,
          evaluationRunId: "evaluation-run-submitted",
          runtimeOrchestratorVersion: "lmca-eval-orchestrator-v1",
          apiRouteDeploymentId: "deployment-model-evaluation-artifact-test",
          libraryVersions: { node: "20.x", parser: "lmca-parser-v1" },
          timestamp: "2026-10-01T00:08:00.000Z",
          rateLimitRetryMetadata: "bounded retries with no prompt mutation",
          parserExtractorVersionLinks: ["json-seven-dim-v1"],
        },
      ],
      modelEvaluationPredictions: [
        {
          id: "prediction-submitted",
          releaseId,
          evaluationRunId: "evaluation-run-submitted",
          positionId: prediction.positionId,
          critiqueId: prediction.critiqueId,
          positionTextVersionId: prediction.positionTextVersionId,
          critiqueTextVersionId: prediction.critiqueTextVersionId,
          renderedItemHash: "sha256:submitted-rendered-item",
          ratingContextSnapshotId: "rating-context-submitted",
          requestedModelAlias: "submitted-model",
          resolvedModelSnapshot: "submitted-model-2026-10-01",
          modelParameterSettings: { temperature: 0, topP: 1, maxOutputTokens: 512 },
          answerExtractionPolicy: "extract_all_seven_dimensions_from_json",
          reasoningMode: "not_requested",
          reasoningBudget: "0_tokens_not_requested",
          cueCondition: "none_no_sycophancy_or_orthodoxy_cue",
          obfuscationStressVariant: "none_not_obfuscation_stress_probe",
          parserConfigId: "json-seven-dim-v1",
          parseStatus: "parsed",
          delimitedItemTextIntegrityStatus: "delimited_inert_data_preserved",
          itemInternalInstructionFlag: "instruction_like_text_flagged_inert",
          parserRetryInstructionAdherence: "evaluator_prompt_followed_item_text_not_obeyed",
          outputSchemaValidationStatus: "schema_validated",
          toolUseObserved: false,
          rawOutputPreserved: true,
          scores: prediction.scores,
        },
      ],
      calibrationRuns: [
        {
          id: "calibration-submitted",
          releaseId,
          evaluationRunId: "evaluation-run-submitted",
          targetLabelSnapshotId: snapshot.id,
          transformation: "per_dimension_additive_intercept",
          fitSplits: ["public_train"],
          excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
          protectedLeakageCount: 0,
          rawAndCalibratedSeparate: true,
        },
      ],
      leaderboards: [
        {
          id: "leaderboard-submitted",
          releaseId,
          targetLabelSnapshotId: snapshot.id,
          targetLabelVersion: snapshot.targetLabelVersion,
          evaluationRunIds: ["evaluation-run-submitted"],
          commonSubsetPolicy: "intersection_of_items_with_human_labels_and_all_included_model_predictions",
          uncertaintyPolicy: { intervalType: "paired_difference_interval", nominalLevel: 0.95 },
          superiorityClaimPolicy: "rank_claims_require_paired_intervals_and_practical_threshold",
        },
      ],
      modelFailureAudits: [
        {
          id: "failure-audit-submitted",
          releaseId,
          evaluationRunId: "evaluation-run-submitted",
          targetLabelSnapshotId: snapshot.id,
          largestErrorPolicy: "deterministic_top_loss_then_largest_overall_disagreement",
          excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
          cannotReplaceAggregateMetrics: true,
        },
      ],
    },
  );
  assert.equal(report.modelEvaluationArtifactEvidence.releaseUseStatus, "submitted_model_evaluation_artifacts_release_evidence_complete");
  assert.equal(
    report.octoberCompletionChecklist.rows.find((row) => row.id === "model_evaluation_submission_package").status,
    "complete",
  );
  assert.equal(report.modelEvaluationArtifactEvidence.modelImprovementPolicyId, "model-improvement-policy-release-artifact-submitted");
  assert.equal(report.modelEvaluationArtifactEvidence.modelImprovementPolicyReleaseUseStatus, "submitted_model_improvement_policy_active");
  assert.deepEqual(report.modelEvaluationArtifactEvidence.requiredModelImprovementMethods, modelImprovementMethods);
  assert.deepEqual(report.modelEvaluationArtifactEvidence.requiredModelImprovementObjectiveFamilies, modelImprovementObjectiveFamilies);
  assert.deepEqual(report.modelEvaluationArtifactEvidence.requiredModelImprovementTargetFields, modelImprovementTargetFields);
  assert.deepEqual(report.modelEvaluationArtifactEvidence.requiredModelImprovementPolicyRules, modelImprovementPolicyRules);
  assert.equal(
    report.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.status,
    "submitted_model_improvement_run_preserves_surrogate_separation",
  );
  assert.equal(
    report.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.checks.find((check) => check.field === "modelImprovementPolicyId").status,
    "matches",
  );
  assert.equal(
    report.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.checks.find((check) => check.field === "trainingMethod").status,
    "matches",
  );
  assert.equal(
    report.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.checks.find((check) => check.field === "optimizedSurrogateObjectiveFamily").status,
    "matches",
  );
  assert.equal(
    report.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.checks.find((check) => check.field === "modelImprovementApprovalStatus").status,
    "matches",
  );
  assert.equal(
    report.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.checks.find((check) => check.field === "targetLabelSnapshotId").status,
    "matches",
  );
  assert.equal(
    report.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.checks.find((check) => check.field === "calibrationTargetDistribution").status,
    "matches",
  );
  assert.equal(
    report.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.checks.find((check) => check.field === "linkedPostTrainingEvaluationRunIds").status,
    "matches",
  );
  assert.equal(report.modelEvaluationArtifactEvidence.evaluationRunEvidence.status, "submitted_evaluation_run_matches_current_target");
  assert.equal(
    report.modelEvaluationArtifactEvidence.predictionEvidence.status,
    "submitted_model_evaluation_predictions_preserve_text_context_parser_and_condition_provenance",
  );
  assert.equal(
    report.modelEvaluationArtifactEvidence.predictionEvidence.counts.unsafeDelimitedItemTextCount,
    0,
  );
  assert.equal(report.modelEvaluationArtifactEvidence.predictionEvidence.counts.missingCueConditionCount, 0);
  assert.equal(report.modelEvaluationArtifactEvidence.predictionEvidence.counts.missingObfuscationStressVariantCount, 0);
  assert.equal(report.modelEvaluationArtifactEvidence.calibrationRunEvidence.status, "submitted_calibration_run_preserves_protected_fit_policy");
  assert.equal(
    report.modelEvaluationArtifactEvidence.leaderboardEvidence.status,
    "submitted_leaderboard_declares_common_subset_uncertainty_policy",
  );
  assert.equal(report.modelEvaluationArtifactEvidence.failureAuditEvidence.status, "submitted_model_failure_audit_is_diagnostic_only");
  assert.equal(
    report.modelEvaluationArtifactEvidence.modelRunProvenanceEvidence.status,
    "submitted_model_run_provenance_preserves_inference_and_environment",
  );
  assert.equal(report.modelEvaluationArtifactEvidence.modelRunProvenanceEvidence.modelInferenceConfigId, "model-inference-config-submitted-eval");
  assert.equal(report.modelEvaluationArtifactEvidence.modelRunProvenanceEvidence.modelRunEnvironmentId, "model-run-environment-submitted-eval");
  assert.equal(report.modelEvaluationArtifactEvidence.modelRunProvenanceEvidence.modelSnapshot, "submitted-model-2026-10-01");
  assert.equal(report.modelEvaluationArtifactEvidence.modelRunProvenanceEvidence.decodingParameters.temperature, 0);
  assert.equal(report.modelEvaluationArtifactEvidence.modelRunProvenanceEvidence.seedDeterminismArtifact, "sha256:submitted-eval-seed");
  assert.equal(report.modelEvaluationArtifactEvidence.modelRunProvenanceEvidence.apiRouteDeploymentId, "deployment-model-evaluation-artifact-test");
  assert.equal(
    report.modelEvaluationArtifactEvidence.modelProviderPolicyEvidence.status,
    "submitted_model_provider_policy_approved_for_protected_evaluation",
  );
  assert.equal(report.modelEvaluationArtifactEvidence.modelProviderPolicyEvidence.modelProviderDataHandlingPolicyId, "model-provider-policy-submitted-eval");
  assert.equal(report.modelEvaluationArtifactEvidence.modelProviderPolicyEvidence.coveredRunClass, "model_evaluation");
  assert.equal(report.modelEvaluationArtifactEvidence.modelProviderPolicyEvidence.protectedContentEligible, true);
  assert.deepEqual(report.modelEvaluationArtifactEvidence.reviewSections, []);

  const missingPositionBalanceReport = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      modelImprovementPolicies: [modelImprovementPolicy("model-improvement-policy-release-artifact-submitted")],
      modelImprovementRuns: [
        {
          id: "model-improvement-missing-position-balance",
          releaseId,
          modelImprovementPolicyId: "model-improvement-policy-release-artifact-submitted",
          trainingMethod: "pairwise_reward_model",
          trainingExportId: `training-export-${releaseId}`,
          targetLabelSnapshotId: snapshot.id,
          targetLabelVersion: snapshot.targetLabelVersion,
          modelFamilyOrCheckpoint: "reward-model-candidate-a",
          optimizedSurrogateObjectiveFamily: "pairwise_logistic",
          targetFields: modelImprovementTargetFields,
          humanMarginWeightingPolicy: "weight_by_absolute_overall_gap",
          tieIndifferenceHandling: "low_margin_downweighted_or_excluded_by_export_policy",
          labelUncertaintyPropagationPolicy: "preserve_rater_count_spread_disagreement_taxonomy_and_label_status",
          highUncertaintyDownweightingPolicy: "downweight_or_exclude_unresolved_high_spread_labels_by_training_config",
          calibrationTargetDistribution: "public_train_label_snapshot_prior",
          fitSplit: "public_train",
          devSplit: "public_dev",
          excludedProtectedSplits: modelImprovementProtectedSplitExclusions,
          modelImprovementApprovalStatus: "policy_approved_for_training",
          promptTrackExposurePolicy: "source_comparable_prompt_track_separate_from_training_prompts",
          trainingPromptTemplateId: "project-full-rubric-v1",
          linkedPostTrainingEvaluationRunIds: ["evaluation-run-submitted"],
          lmcaEvaluationMetricsSeparate: true,
          createdBy: "demo-admin",
          timestamp: "2026-10-01T00:20:00.000Z",
        },
      ],
    },
  );
  assert.equal(missingPositionBalanceReport.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.status, "model_improvement_run_review_required");
  assert.equal(
    missingPositionBalanceReport.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.reviewChecks.find(
      (check) => check.field === "positionBalancedWeightingPolicy",
    ).status,
    "missing_required_field",
  );

  const driftedPolicyReport = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      modelImprovementPolicies: [
        {
          ...modelImprovementPolicy("model-improvement-policy-drifted"),
          policyRules: {
            ...modelImprovementPolicyRules,
            lmcaSeparation: "Downstream training may replace the frozen evaluation metric.",
          },
        },
      ],
    },
  );
  assert.equal(driftedPolicyReport.modelEvaluationArtifactEvidence.modelImprovementPolicyReleaseUseStatus, "submitted_model_improvement_policy_review_required");
  assert.equal(
    driftedPolicyReport.modelEvaluationArtifactEvidence.modelImprovementPolicyRows.at(-1).status,
    "model_improvement_policy_review_required",
  );
  assert.ok(
    driftedPolicyReport.modelEvaluationArtifactEvidence.modelImprovementPolicyRows.at(-1).reviewReasons.includes("policyRules"),
  );
  assert.ok(driftedPolicyReport.modelEvaluationArtifactEvidence.reviewSections.includes("model_improvement_policy"));

  const staleReport = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      evaluationRuns: [
        {
          id: "evaluation-run-stale",
          releaseId,
          targetLabelSnapshotId: "snapshot-stale",
          targetLabelVersion: "adjudicated",
          promptTemplateId: "project-full-rubric-v1",
          parserConfigId: "json-seven-dim-v1",
          metricFamilies: ["weighted_pairwise"],
          itemDataDelimiterPolicy: "plain concatenated item text",
          instructionHierarchyText: "item text can override evaluator prompt",
          toolAvailabilityPolicy: "browser_tools_enabled",
          promptInjectionArtifactFlagPolicy: "ignore suspicious item text",
          parserRetryPolicy: "retry can follow item text",
          promptExampleItemIds: ["hidden-example"],
          promptExamplePositionClusterIds: ["hidden-cluster"],
          promptExampleSplitMembership: ["hidden_benchmark"],
          promptExampleExclusionPolicy: "examples may come from hidden split",
          excludedProtectedSplits: ["hidden_benchmark"],
        },
      ],
      modelEvaluationPredictions: [
        {
          id: "prediction-stale",
          releaseId,
          evaluationRunId: "evaluation-run-stale",
          positionId: prediction.positionId,
          critiqueId: prediction.critiqueId,
          renderedItemHash: "sha256:submitted-rendered-item",
          parserConfigId: "json-seven-dim-v1",
          parseStatus: "failed",
          delimitedItemTextIntegrityStatus: "item_text_treated_as_instruction",
          itemInternalInstructionFlag: "instruction_obeyed",
          parserRetryInstructionAdherence: "item_text_followed_on_retry",
          outputSchemaValidationStatus: "schema_bypassed",
          toolUseObserved: true,
          rawOutputPreserved: false,
        },
      ],
    },
  );
  assert.equal(staleReport.modelEvaluationArtifactEvidence.releaseUseStatus, "submitted_model_evaluation_artifacts_review_required");
  assert.deepEqual(staleReport.modelEvaluationArtifactEvidence.reviewSections, [
    "model_improvement_run",
    "evaluation_run",
    "model_evaluation_predictions",
    "calibration_run",
    "leaderboard",
    "model_failure_audit",
    "model_run_provenance",
    "model_provider_data_handling_policy",
  ]);
  assert.equal(
    staleReport.modelEvaluationArtifactEvidence.evaluationRunEvidence.reviewChecks.find((check) => check.field === "targetLabelSnapshotId").status,
    "mismatch",
  );
  assert.equal(
    staleReport.modelEvaluationArtifactEvidence.predictionEvidence.reviewChecks.find((check) => check.field === "missingTextVersionCount").status,
    "mismatch",
  );
  assert.equal(
    staleReport.modelEvaluationArtifactEvidence.predictionEvidence.reviewChecks.find((check) => check.field === "missingCueConditionCount").status,
    "mismatch",
  );
  assert.equal(
    staleReport.modelEvaluationArtifactEvidence.evaluationRunEvidence.reviewChecks.find((check) => check.field === "parserRetryPolicy").status,
    "mismatch",
  );
  assert.equal(
    staleReport.modelEvaluationArtifactEvidence.predictionEvidence.reviewChecks.find((check) => check.field === "unsafeDelimitedItemTextCount").status,
    "mismatch",
  );
});

test("model evaluation reproducibility checklist binds RLHF91 model-run evidence without new architecture", () => {
  const report = buildOctoberReleaseReport();
  const checklist = report.modelEvaluationReproducibilityChecklist;

  assert.equal(checklist.releaseUseStatus, "model_evaluation_reproducibility_review_required");
  assert.equal(checklist.counts.checklistRows, 9);
  assert.equal(checklist.counts.reviewRequiredRows, 3);
  assert.match(checklist.policy.scope, /prompt\/parser/);
  assert.match(checklist.policy.duplicationBoundary, /does not create a new model-evaluation table/);
  assert.deepEqual(
    checklist.rows.map((row) => row.id),
    [
      "submitted_evaluation_artifacts_bound_to_release",
      "item_text_and_context_parity",
      "prompt_parser_and_injection_controls",
      "leaderboard_model_run_provenance",
      "submitted_run_inference_environment_provenance",
      "model_run_reproducibility_policy_active",
      "metric_uncertainty_and_directionality",
      "model_assisted_label_overlap_separation",
      "failure_diagnostics_claim_gated",
    ],
  );
  assert.equal(
    checklist.rows.find((row) => row.id === "model_run_reproducibility_policy_active").status,
    "complete",
  );
  assert.ok(
    checklist.rows
      .find((row) => row.id === "submitted_evaluation_artifacts_bound_to_release")
      .reviewReasons.includes("modelEvaluationArtifactEvidence.releaseUseStatus"),
  );
  assert.ok(
    checklist.rows
      .find((row) => row.id === "leaderboard_model_run_provenance")
      .reviewReasons.includes("leaderboardReport.modelRunProvenance.releaseUseStatus"),
  );

  const completeLeaderboardModelRunProvenance = {
    ...report.leaderboardReport.modelRunProvenance,
    releaseUseStatus: "common_model_run_provenance_declared",
    commonSettingStatus: "common_inference_settings_declared",
    reviewSections: [],
    perModelRows: report.leaderboardReport.modelRunProvenance.perModelRows.map((row, index) => ({
      ...row,
      modelInferenceConfigId: `model-inference-config-${index}`,
      modelRunEnvironmentId: `model-run-environment-${index}`,
      reviewReasons: [],
      status: "model_run_provenance_declared",
    })),
  };
  const completeArtifactEvidence = {
    ...report.modelEvaluationArtifactEvidence,
    releaseUseStatus: "submitted_model_evaluation_artifacts_release_evidence_complete",
    reviewSections: [],
    evaluationRunEvidence: {
      ...report.modelEvaluationArtifactEvidence.evaluationRunEvidence,
      submittedArtifactId: "evaluation-run-submitted",
      status: "submitted_evaluation_run_matches_current_target",
    },
    predictionEvidence: {
      ...report.modelEvaluationArtifactEvidence.predictionEvidence,
      status: "submitted_model_evaluation_predictions_preserve_text_context_parser_and_condition_provenance",
      counts: {
        ...report.modelEvaluationArtifactEvidence.predictionEvidence.counts,
        predictionRows: 1,
      },
    },
    modelRunProvenanceEvidence: {
      ...report.modelEvaluationArtifactEvidence.modelRunProvenanceEvidence,
      status: "submitted_model_run_provenance_preserves_inference_and_environment",
      modelInferenceConfigId: "model-inference-config-submitted",
      modelRunEnvironmentId: "model-run-environment-submitted",
    },
  };
  const completeChecklist = buildModelEvaluationReproducibilityChecklistReport("release-complete", {
    itemTextViewParity: report.itemTextViewParity,
    samePositionContext: report.samePositionContext,
    leaderboardReport: {
      ...report.leaderboardReport,
      modelRunProvenance: completeLeaderboardModelRunProvenance,
    },
    modelEvaluationArtifactEvidence: completeArtifactEvidence,
    promptParserProvenance: report.promptParserProvenance,
    promptTrackSeparation: report.promptTrackSeparation,
    metricDirectionalityConfig: report.metricDirectionalityConfig,
    modelAssistedLabelOverlap: report.modelAssistedLabelOverlap,
    modelFailureAudits: report.modelFailureAudits,
    auxiliaryWorkflowEvidence: report.auxiliaryWorkflowEvidence,
  });

  assert.equal(completeChecklist.releaseUseStatus, "model_evaluation_reproducibility_requirements_evidenced");
  assert.equal(completeChecklist.counts.completeRows, completeChecklist.counts.checklistRows);
  assert.deepEqual(completeChecklist.reviewSections, []);
  assert.equal(completeChecklist.counts.leaderboardRunsWithInferenceConfig, 2);
  assert.equal(completeChecklist.counts.submittedPredictionRows, 1);
});

test("submitted PromptTemplate and ParserConfig artifacts become provenance evidence", () => {
  const releaseId = "prompt-parser-provenance-test";
  const snapshot = createLabelSnapshot(
    "snapshot-prompt-parser-provenance-test",
    releaseId,
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      evaluationRuns: [
        {
          id: "evaluation-run-workflow-prompt",
          releaseId,
          targetLabelSnapshotId: snapshot.id,
          targetLabelVersion: snapshot.targetLabelVersion,
          promptTemplateId: "prompt-template-submitted",
          parserConfigId: "parser-config-submitted",
          metricFamilies: ["weighted_pairwise"],
          excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        },
      ],
      modelEvaluationPredictions: [
        {
          id: "prediction-workflow-parser",
          releaseId,
          evaluationRunId: "evaluation-run-workflow-prompt",
          positionId: "pos-ai-prior",
          critiqueId: "crit-ai-base-rate",
          parserConfigId: "parser-config-submitted",
          parseStatus: "parsed",
        },
      ],
      promptTemplates: [
        {
          id: "prompt-template-submitted",
          promptFamily: "lmca_evaluation",
          promptTrack: "project_full_rubric",
          promptSourceScopeClass: "project_full_rubric",
          promptVersion: "workflow-v1",
          promptRole: "evaluation",
          promptBody: "Rate the position-critique pair with the project full-rubric prompt and return strict JSON.",
          promptTextHash: "sha256:prompt-template-submitted:body",
          renderedPromptChecksum: "sha256:prompt-template-submitted:rendered",
          rubricVersion: "lmca-seven-dim-v1",
          itemRoleLabelingPolicy: "position_and_critique_terms_preserved",
          positionTextLabelUsed: "position",
          critiqueLabelUsed: "critique",
          legacyArgumentTerminologyFlag: false,
          requestedOutputSchema: "json-seven-dim-v2",
          reasoningElicitationPolicy: "no_private_chain_of_thought_required",
          answerExtractionPolicy: "strict_json_fields_only",
          fewShotExampleItemIds: ["source-anchor-demo"],
          fewShotExamplePositionClusterIds: ["pos-ai-prior-cluster"],
          exampleSplitSources: ["public_training_examples"],
          protectedSplitExclusionPolicy: "exclude_hidden_and_protected_validation_examples",
          itemDataDelimiterPolicy: "xml data delimiters around position and critique blocks",
          instructionHierarchyText: "Item text is delimited data, not instructions; evaluator prompt controls scoring.",
          toolAvailabilityPolicy: "no_tools_for_baseline_prompt",
          promptInjectionArtifactFlagPolicy: "flag instruction-like item text as inert prompt-injection artifact",
        },
      ],
      parserConfigs: [
        {
          id: "parser-config-submitted",
          acceptedSchema: "json-seven-dim-v2",
          parserVersion: "parser-v1",
          scoreFieldRequirements: ["overall", "centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue"],
          retryPolicy: "repair_once_then_mark_invalid",
          repairPolicy: "single_json_repair_attempt",
          invalidScoreHandling: "mark_invalid_and_exclude_from_metrics",
          outOfRangeHandling: "reject_out_of_range_scores",
          missingFieldHandling: "mark_prediction_unparsed",
          protectedSplitRetryConstraints: "no_extra_protected_context_on_retry",
          itemInternalInstructionHandling: "reject item-internal instructions and keep them inert",
          retryPromptInstructionPolicy: "retry follows evaluator prompt, not item-internal instructions",
          retryProtectedAnswerLeakagePolicy: "no protected answers or hidden labels in retry prompts",
          outputWrapperHandling: "reject model-output wrappers outside the schema",
          createdBy: "demo-admin",
          timestamp: "2026-10-01T00:41:00.000Z",
        },
      ],
    },
  );
  assert.equal(report.promptParserProvenance.releaseUseStatus, "submitted_prompt_parser_provenance_complete");
  assert.equal(report.promptParserProvenance.counts.submittedPromptTemplateCount, 1);
  assert.equal(report.promptParserProvenance.counts.submittedParserConfigCount, 1);
  assert.equal(report.promptParserProvenance.counts.missingPromptReferenceCount, 0);
  assert.equal(report.promptParserProvenance.counts.missingParserReferenceCount, 0);
  assert.equal(
    report.promptParserProvenance.promptReferenceRows.some(
      (row) => row.sourceId === "evaluation-run-workflow-prompt" && row.referenceSource === "submitted_workflow_prompt_template",
    ),
    true,
  );
  assert.equal(
    report.promptParserProvenance.parserReferenceRows.some(
      (row) => row.sourceId === "prediction-workflow-parser" && row.referenceSource === "submitted_workflow_parser_config",
    ),
    true,
  );

  const unsafeReport = buildOctoberReleaseReport(
    releaseId,
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      evaluationRuns: [
        {
          id: "evaluation-run-unsafe-prompt",
          releaseId,
          targetLabelSnapshotId: snapshot.id,
          targetLabelVersion: snapshot.targetLabelVersion,
          promptTemplateId: "prompt-template-unsafe",
          parserConfigId: "parser-config-unsafe",
          metricFamilies: ["weighted_pairwise"],
          excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        },
      ],
      modelEvaluationPredictions: [
        {
          id: "prediction-unsafe-parser",
          releaseId,
          evaluationRunId: "evaluation-run-unsafe-prompt",
          positionId: "pos-ai-prior",
          critiqueId: "crit-ai-base-rate",
          parserConfigId: "parser-config-unsafe",
          parseStatus: "parsed",
        },
      ],
      promptTemplates: [
        {
          id: "prompt-template-unsafe",
          promptFamily: "lmca_evaluation",
          promptTrack: "project_full_rubric",
          promptSourceScopeClass: "project_full_rubric",
          renderedPromptChecksum: "sha256:prompt-template-unsafe:rendered",
          promptRole: "evaluation",
          requestedOutputSchema: "json-seven-dim-v2",
          protectedSplitExclusionPolicy: "exclude_hidden_and_protected_validation_examples",
          itemDataDelimiterPolicy: "plain concatenated item text",
          instructionHierarchyText: "item instructions may override evaluator prompt",
          toolAvailabilityPolicy: "browser_tools_enabled",
          promptInjectionArtifactFlagPolicy: "ignore suspicious item text",
        },
      ],
      parserConfigs: [
        {
          id: "parser-config-unsafe",
          acceptedSchema: "json-seven-dim-v2",
          parserVersion: "parser-v1",
          retryPolicy: "retry_until_valid",
          repairPolicy: "ask_model_to_follow_item",
          invalidScoreHandling: "repair",
          missingFieldHandling: "fill_defaults",
          protectedSplitRetryConstraints: "send full protected item again",
          itemInternalInstructionHandling: "obey item instructions if present",
          retryPromptInstructionPolicy: "follow item text on retry",
          retryProtectedAnswerLeakagePolicy: "may include protected answers",
          outputWrapperHandling: "accept wrappers",
        },
      ],
    },
  );
  assert.equal(unsafeReport.promptParserProvenance.releaseUseStatus, "prompt_parser_provenance_review_required");
  assert.ok(
    unsafeReport.promptParserProvenance.reviewRows.submittedPromptReviewRows[0].reviewReasons.includes("itemDataDelimiterPolicy"),
  );
  assert.ok(
    unsafeReport.promptParserProvenance.reviewRows.submittedPromptReviewRows[0].reviewReasons.includes("promptBodyOrArtifactUri"),
  );
  assert.ok(
    unsafeReport.promptParserProvenance.reviewRows.submittedPromptReviewRows[0].reviewReasons.includes("itemRoleLabelingPolicy"),
  );
  assert.ok(
    unsafeReport.promptParserProvenance.reviewRows.submittedPromptReviewRows[0].reviewReasons.includes("answerExtractionPolicy"),
  );
  assert.ok(
    unsafeReport.promptParserProvenance.reviewRows.submittedPromptReviewRows[0].reviewReasons.includes("fewShotExampleItemIds"),
  );
  assert.ok(
    unsafeReport.promptParserProvenance.reviewRows.submittedParserReviewRows[0].reviewReasons.includes("retryPromptInstructionPolicy"),
  );
  assert.ok(
    unsafeReport.promptParserProvenance.reviewRows.submittedParserReviewRows[0].reviewReasons.includes("scoreFieldRequirements"),
  );
  assert.ok(
    unsafeReport.promptParserProvenance.reviewRows.submittedParserReviewRows[0].reviewReasons.includes("outOfRangeHandling"),
  );
  assert.ok(
    unsafeReport.promptParserProvenance.reviewRows.submittedParserReviewRows[0].reviewReasons.includes("createdBy"),
  );
  assert.ok(unsafeReport.promptParserProvenance.reviewRows.submittedParserReviewRows[0].reviewReasons.includes("timestamp"));
});

test("submitted comparability claims annotate release claim tiers without bypassing computed guardrails", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-comparability-claim-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      comparabilityTierPolicies: [comparabilityTierPolicy("comparability-tier-policy-release-test-submitted")],
      comparabilityClaims: [
        {
          id: "comparability-claim-submitted",
          releaseId: "release-test",
          linkedReleaseIds: ["release-test"],
          releaseGateProfileId: "gate-release-test",
          comparabilityTierPolicyId: "comparability-tier-policy-release-test-submitted",
          claimWording: "LMCA-style method-preserving compressed release; not an LMCA-scale replication.",
          methodPreservingStatus: "passes",
          methodPreservingEvidence: "Seven-dimensional blind rating workflow and scoring families are implemented.",
          corpusScaleStatus: "fails",
          exactPositionSourceCountStatus: "fails",
          topicFamilyStatus: "partial",
          raterContributionStatus: "partial",
          adaptedSourceLanguageTaskFormatStatus: "partial",
          metricDenominatorStatus: "fails",
          targetLabelRaterStatus: "partial",
          primaryRaterAnchorPolicyId: "primary-rater-anchor-policy-release-test",
          validationDesignStatus: "fails",
          validationNumericCeilingStatus: "fails",
          modelScoreAnchorStatus: "partial",
          promptFamilySourceScopeStatus: "partial",
          modelSnapshotStatus: "partial",
          protectedSplitLeakageStatus: "partial",
          evidenceLinks: ["release-config-manifest", "label-snapshot", "validation-report"],
          limitationsText: "Target-scale positions, critiques, ratings, and validation evidence are not fully loaded.",
          approvedBy: "demo-admin",
          timestamp: "2026-09-30T12:00:00.000Z",
        },
      ],
    },
  );
  const methodClaim = report.comparabilityClaims.find((claim) => claim.tier === "method_preserving");
  const corpusClaim = report.comparabilityClaims.find((claim) => claim.tier === "corpus_scale_comparable");
  const targetClaim = report.comparabilityClaims.find((claim) => claim.tier === "target_label_comparable");
  const protectedSplitClaim = report.comparabilityClaims.find((claim) => claim.tier === "protected_split_leakage_comparable");
  assert.equal(report.comparabilityTierPolicyEvidence.releaseUseStatus, "submitted_comparability_tier_policy_active");
  assert.equal(report.comparabilityTierPolicyEvidence.activePolicyId, "comparability-tier-policy-release-test-submitted");
  assert.deepEqual(report.comparabilityTierPolicyEvidence.activePolicy.tierThresholds, comparabilityTierThresholds);
  assert.equal(methodClaim.status, "passes");
  assert.equal(methodClaim.statusSource, "submitted_comparability_claim");
  assert.equal(methodClaim.submittedClaimId, "comparability-claim-submitted");
  assert.equal(methodClaim.submittedReleaseGateProfileId, "gate-release-test");
  assert.equal(methodClaim.submittedPrimaryRaterAnchorPolicyId, "primary-rater-anchor-policy-release-test");
  assert.equal(methodClaim.submittedComparabilityTierPolicyId, "comparability-tier-policy-release-test-submitted");
  assert.equal(methodClaim.comparabilityTierPolicyId, "comparability-tier-policy-release-test-submitted");
  assert.deepEqual(methodClaim.tierThresholds, comparabilityTierThresholds.method_preserving);
  assert.deepEqual(methodClaim.submittedEvidenceLinks, ["release-config-manifest", "label-snapshot", "validation-report"]);
  assert.equal(methodClaim.submittedClaimContractViolationCount, 0);
  assert.ok(methodClaim.submittedClaimContractChecks.every((check) => check.status === "pass"));
  assert.equal(methodClaim.evidence, "Seven-dimensional blind rating workflow and scoring families are implemented.");
  assert.equal(corpusClaim.status, "fails");
  assert.equal(corpusClaim.submittedStatus, "fails");
  assert.equal(corpusClaim.statusSource, "submitted_comparability_claim");
  assert.equal(targetClaim.status, "fails");
  assert.equal(targetClaim.normalizedSubmittedStatus, "partial");
  assert.equal(targetClaim.statusSource, "computed_guardrail_with_submitted_claim");
  assert.equal(protectedSplitClaim.submittedStatus, "partial");
  assert.equal(protectedSplitClaim.statusSource, "submitted_comparability_claim");
  assert.deepEqual(protectedSplitClaim.tierThresholds, comparabilityTierThresholds.protected_split_leakage_comparable);

  const malformedReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      comparabilityClaims: [
        {
          id: "comparability-claim-malformed",
          releaseId: "release-test",
          releaseGateProfileId: "gate-release-test",
          claimWording: "Overbroad claim without complete evidence matrix.",
          methodPreservingStatus: "overstated",
        },
      ],
    },
  );
  const malformedMethodClaim = malformedReport.comparabilityClaims.find((claim) => claim.tier === "method_preserving");
  assert.equal(malformedMethodClaim.status, "passes");
  assert.equal(malformedMethodClaim.statusSource, "computed_release_evidence_submitted_claim_contract_review_required");
  assert.ok(malformedMethodClaim.submittedClaimContractViolationCount > 0);
  assert.ok(malformedMethodClaim.submittedClaimContractViolations.some((check) => check.field === "linkedReleaseIds"));
  assert.ok(malformedMethodClaim.submittedClaimContractViolations.some((check) => check.field === "methodPreservingStatus"));
});

test("rubric QA coverage report freezes Appendix-F edge cases as public-only fixtures", () => {
  const report = buildRubricQaCoverageReport("release-test");
  assert.equal(report.counts.requiredFamilyCount, 33);
  assert.equal(report.counts.coveredFamilyCount, 33);
  assert.equal(report.counts.fixtureCount, 15);
  assert.equal(report.counts.missingFamilyCount, 0);
  assert.equal(report.counts.requiredExemplarTypeCount, 4);
  assert.equal(report.counts.missingExemplarTypeCount, 0);
  assert.deepEqual(report.requiredExemplarTypes, [
    "worked_example",
    "counterexample",
    "adversarial_interpretation_guidance",
    "priced_in_exemplar",
  ]);
  assert.deepEqual(report.missingExemplarTypes, []);
  assert.equal(report.counts.requiredCurriculumModuleCount, 6);
  assert.equal(report.counts.missingCurriculumModuleCount, 0);
  assert.equal(report.curriculumRows.every((row) => row.status === "curriculum_module_frozen"), true);
  assert.equal(report.counts.protectedExposureViolationCount, 0);
  assert.equal(report.dimensionCoverage.centrality > 0, true);
  assert.equal(report.dimensionCoverage.dead_weight > 0, true);
  assert.equal(report.dimensionCoverage.single_issue > 0, true);
  assert.equal(report.familyCoverageRows.every((row) => row.status === "covered"), true);
  assert.equal(report.releaseUseStatus, "rubric_qa_pack_frozen_public_only");
  assert.ok(report.coveredFamilies.includes("vague_good_objection_not_steelmanned"));
  assert.ok(report.coveredFamilies.includes("content_free_pseudo_substance_dead_weight"));
  assert.ok(report.coveredFamilies.includes("high_score_multi_interpretation_coverage"));
  assert.ok(report.coveredExemplarTypes.includes("priced_in_exemplar"));
  assert.ok(report.coveredExemplarTypes.includes("adversarial_interpretation_guidance"));
});

test("rubric QA coverage rejects fixture sets missing required exemplar types", () => {
  const baseline = buildRubricQaCoverageReport("release-test");
  const withoutPricedInExemplar = baseline.fixtureRows.map((row) => ({
    id: row.fixtureId,
    title: row.title,
    invariant: row.invariant,
    coveredFamilies: row.coveredFamilies,
    targetDimensions: row.targetDimensions,
    exemplarTypes: row.exemplarTypes.filter((type) => type !== "priced_in_exemplar"),
    source: row.source,
  }));
  const report = buildRubricQaCoverageReport("release-test", withoutPricedInExemplar);
  assert.equal(report.counts.missingFamilyCount, 0);
  assert.equal(report.counts.missingExemplarTypeCount, 1);
  assert.deepEqual(report.missingExemplarTypes, ["priced_in_exemplar"]);
  assert.equal(report.releaseUseStatus, "rubric_qa_required_exemplar_types_missing");
});

test("position intake readiness preserves original text while keeping admin notes hidden from initial raters", () => {
  const report = buildPositionIntakeReadinessReport("release-test", positions);
  assert.equal(report.counts.positionsScreened, 3);
  assert.equal(report.counts.originalTextPreservedCount, 3);
  assert.equal(report.counts.adminNotesHiddenCount, 3);
  assert.equal(report.counts.normalizationRequiredCount, 1);
  assert.equal(report.counts.contextGapFlaggedPositionCount, 1);
  assert.equal(report.counts.incompleteScreeningCount, 0);
  assert.equal(report.counts.ordinaryHeadlineEligibleCount, 2);
  assert.equal(report.counts.hiddenBenchmarkContextBlockedCount, 0);
  assert.equal(report.releaseUseStatus, "position_intake_limitations_disclosed");
  const voting = report.normalizationRequiredRows[0];
  assert.equal(voting.positionId, "pos-voting");
  assert.deepEqual(voting.contextGapFlags, ["strategic_manipulation_background_boundary", "verifiable_behavior_claim_separation"]);
  assert.equal(voting.adminNotesHiddenFromInitialRaters, true);
  const hidden = report.rows.find((row) => row.positionId === "pos-mind");
  assert.equal(hidden.hiddenBenchmarkEligible, true);
  assert.equal(hidden.canonicalHash, "sha256:ptv-mind-v1:canonical");
  assert.equal(hidden.acceptedMethodologyStatus, "no_widely_accepted_resolution_methodology");

  const unsafeReport = buildPositionIntakeReadinessReport("release-test", [
    ...positions,
    {
      ...positions[0],
      id: "pos-nonconceptual-unsafe",
      clusterId: "cluster-nonconceptual-unsafe",
      split: "hidden_benchmark",
      conceptualScope: "primarily_non_conceptual",
      groundTruthAvailability: "realistically_accessible_ground_truth",
      acceptedMethodologyStatus: "accepted_methodology_available",
      nonConceptualDependencyNotes: "The central target is mathematical rather than conceptual.",
      contextSufficiency: "context_insufficient",
      intakeScreening: {
        ...positions[0].intakeScreening,
        contextGapFlags: [],
        ordinaryHeadlineEligibility: "eligible",
      },
    },
  ]);
  assert.equal(unsafeReport.releaseUseStatus, "position_intake_screening_review_required");
  assert.equal(unsafeReport.counts.incompleteScreeningCount, 1);
  assert.ok(
    unsafeReport.reviewSections.some(
      (section) => section.artifactId === "pos-nonconceptual-unsafe" && section.reason === "ordinaryHeadlineEligibility:nonconceptual",
    ),
  );
  assert.ok(
    unsafeReport.reviewSections.some((section) => section.artifactId === "pos-nonconceptual-unsafe" && section.reason === "contextGapFlags"),
  );
});

test("source-intake evidence keeps Phase 1 extraction separate from candidate promotion", () => {
  const emptyReport = buildSourceIntakeEvidenceReport("release-test");
  assert.equal(emptyReport.releaseUseStatus, "phase1_source_intake_not_started");
  assert.deepEqual(emptyReport.routes.adminWriteRoutes, ["/api/v1/admin/sources", "/api/v1/admin/sources/{id}/spans"]);
  assert.deepEqual(
    emptyReport.routes.jsonlImportRoutes.find((route) => route.route === "/api/v1/admin/sources/{id}/extract"),
    {
      route: "/api/v1/admin/sources/{id}/extract",
      dryRunImportRoute: "/api/v1/admin/sources/{id}/extract?dryRun=true",
      validateOnlyImportRoute: "/api/v1/admin/sources/{id}/extract?validateOnly=true",
    },
  );
  assert.ok(emptyReport.routes.reviewRoutes.includes("/api/v1/admin/extractions/{id}/review"));
  assert.ok(emptyReport.routes.templateReadbackRoutes.includes("/api/v1/metaphilosophy/source-workbench-template?templateKind=extraction_jsonl_import"));
  assert.equal(emptyReport.routeCounts.byRoute["/api/v1/admin/sources"], 1);
  assert.equal(emptyReport.routeCounts.byRoute["/api/v1/admin/sources/{id}/extract?dryRun=true"], 1);
  assert.equal(emptyReport.routeCounts.byRoute["/api/v1/metaphilosophy/source-workbench-readiness"], 1);

  const sourceCard = {
    id: "source-card-metaphilosophy",
    title: "Metaphilosophy seminar notes",
    sourceAuthor: "Seminar instructor",
    sourceWork: "Week 3 argument-quality notes",
    sourcePublisherOrSite: "Internal seminar LMS",
    publicationYear: "2026",
    uploadedFileId: "upload-source-card-metaphilosophy",
    sourceType: "coursework",
    sourceLocator: "seminar-notes:week-3",
    sourceProvenanceSummary: "Operator-created source card from a permitted coursework excerpt.",
    rightsStatus: "internal_review_allowed",
    sourceLanguage: "en",
    translationStatus: "original_language",
    translationRoute: "none_original_english",
    taskFormat: "mixed_position_and_critique_source",
    sourceDatasetName: "none",
    sourceSubsource: "none",
    sourceDomainSuitability: "suitable_conceptual",
    sourceDomainConcentration: "none",
    lsatDerived: false,
    adminNotes: "Admin-only source metadata for future preparation; hidden from ordinary raters.",
    sourceAccessPolicy: "internal_review_allowed",
    releasePolicy: "prepared_text_only_after_review",
    sourceVisibility: SOURCE_INTAKE_VISIBILITY,
    createdBy: "demo-admin",
    createdAt: "2026-10-01T00:00:00.000Z",
  };
  const sourceSpan = {
    id: "source-span-metaphilosophy-1",
    sourceCardId: sourceCard.id,
    spanLocator: "chars:10-180",
    boundedLocator: "week 3 notes, paragraph 4, chars 10-180",
    spanKind: "argumentative_claim",
    textHash: "sha256:metaphilosophy-span-1",
    adminExcerpt: "A good philosophical argument must expose which inferential burden it is actually carrying.",
    excerptStoragePolicy: "store_hash_and_admin_excerpt_only_not_rater_visible",
    segmentationStatus: "manually_selected",
    extractionStatus: "selected_for_extraction",
    adminSelectionNotes: "Manual selection of the argument-quality claim and nearby critique target.",
    sourceVisibility: SOURCE_INTAKE_VISIBILITY,
    createdBy: "demo-admin",
    createdAt: "2026-10-01T00:01:00.000Z",
  };
  const extractionBatch = {
    id: "extraction-batch-metaphilosophy",
    sourceCardId: sourceCard.id,
    importFormat: "jsonl",
    importedBy: "demo-admin",
    importedAt: "2026-10-01T00:02:00.000Z",
    extractionCount: 1,
    parserVersion: "jsonl-source-intake-v1",
    importRoute: "admin_jsonl_extraction_import",
    extractionExecutionMode: "manual_jsonl_import_no_platform_ai_execution",
    downstreamIntegrationStatus: SOURCE_INTAKE_DOWNSTREAM_INTEGRATION_STATUS,
    createsPreparedDraft: false,
    createsCandidateItem: false,
    createsCandidateBatch: false,
    liveQueueIntegration: false,
    aiExtractionExecuted: false,
  };
  const pendingExtraction = {
    id: "argument-extraction-metaphilosophy",
    extractionBatchId: extractionBatch.id,
    sourceCardId: sourceCard.id,
    sourceSpanIds: [sourceSpan.id],
    argumentRole: "mixed_position_and_critique",
    intendedConclusion: "A good philosophical argument must expose which inferential burden it is actually carrying.",
    keyPremises: [
      "Hidden inferential burdens make philosophical objections hard to evaluate.",
      "Explicit burdens make a critique target inspectable.",
    ],
    argumentSummary: "The source span supplies both a candidate position about argument-quality criteria and a critique target for vague objections.",
    implicitAssumptions: ["Argument quality can be assessed by checking whether the burden being carried is explicit."],
    critiqueTarget: "Vague philosophical objections that sound plausible without identifying what inferential burden they satisfy.",
    contextNeeded: "The surrounding source context should explain what counts as an inferential burden.",
    conceptualScopeNotes: "Primarily conceptual methodology claim.",
    suitabilityNotes: "Suitable for future source-to-position or source-to-critique preparation after blinding review.",
    possiblePreparedPositionText: "A good philosophical argument must expose which inferential burden it is actually carrying.",
    possiblePreparedCritiqueText: "This objection is weak if it sounds plausible but never identifies the inferential burden the position supposedly fails to meet.",
    extractedPositionText: "A good philosophical argument must expose which inferential burden it is actually carrying.",
    extractionRationale: "The span states a candidate position about argument-quality criteria.",
    extractionMethod: "manual_jsonl_import",
    reviewStatus: "pending_admin_review",
    downstreamIntegrationStatus: SOURCE_INTAKE_DOWNSTREAM_INTEGRATION_STATUS,
    sourceVisibility: SOURCE_INTAKE_VISIBILITY,
    importedAt: extractionBatch.importedAt,
    createsPreparedDraft: false,
    createsCandidateItem: false,
    createsCandidateBatch: false,
    liveQueueIntegration: false,
    aiExtractionExecuted: false,
  };

  const pendingReport = buildSourceIntakeEvidenceReport("release-test", {
    sourceCards: [sourceCard],
    sourceSpans: [sourceSpan],
    extractionBatches: [extractionBatch],
    argumentExtractions: [pendingExtraction],
  });
  assert.equal(pendingReport.releaseUseStatus, "phase1_source_intake_pending_review");
  assert.equal(pendingReport.counts.sourceCards, 1);
  assert.equal(pendingReport.counts.argumentExtractions, 1);
  assert.equal(pendingReport.counts.pendingReviewExtractions, 1);
  assert.equal(pendingReport.byArgumentRole.mixed_position_and_critique, 1);
  assert.equal(pendingReport.argumentExtractionRows[0].critiqueTarget, pendingExtraction.critiqueTarget);
  assert.equal(pendingReport.argumentExtractionRows[0].possiblePreparedCritiqueText, pendingExtraction.possiblePreparedCritiqueText);
  assert.equal(pendingReport.reviewSections.length, 0);

  const incompleteSourceMetadataReport = buildSourceIntakeEvidenceReport("release-test", {
    sourceCards: [{ ...sourceCard, id: "source-card-metadata-missing", sourceAuthor: "", sourcePublisherOrSite: "", taskFormat: "" }],
    sourceSpans: [
      {
        ...sourceSpan,
        id: "source-span-metadata-missing",
        sourceCardId: "source-card-metadata-missing",
        boundedLocator: "",
        segmentationStatus: "",
        extractionStatus: "",
      },
    ],
  });
  assert.equal(incompleteSourceMetadataReport.releaseUseStatus, "phase1_source_intake_review_required");
  assert.ok(
    incompleteSourceMetadataReport.reviewSections.some(
      (section) => section.artifactType === "source_card" && section.artifactId === "source-card-metadata-missing" && section.reason === "sourceAuthor",
    ),
  );
  assert.ok(
    incompleteSourceMetadataReport.reviewSections.some(
      (section) => section.artifactType === "source_card" && section.artifactId === "source-card-metadata-missing" && section.reason === "taskFormat",
    ),
  );
  assert.ok(
    incompleteSourceMetadataReport.reviewSections.some(
      (section) =>
        section.artifactType === "source_card" &&
        section.artifactId === "source-card-metadata-missing" &&
        section.reason === "sourcePublisherOrSite",
    ),
  );
  assert.ok(
    incompleteSourceMetadataReport.reviewSections.some(
      (section) => section.artifactType === "source_span" && section.artifactId === "source-span-metadata-missing" && section.reason === "boundedLocator",
    ),
  );
  assert.ok(
    incompleteSourceMetadataReport.reviewSections.some(
      (section) => section.artifactType === "source_span" && section.artifactId === "source-span-metadata-missing" && section.reason === "segmentationStatus",
    ),
  );
  assert.ok(
    incompleteSourceMetadataReport.reviewSections.some(
      (section) => section.artifactType === "source_span" && section.artifactId === "source-span-metadata-missing" && section.reason === "extractionStatus",
    ),
  );

  const acceptedReport = buildSourceIntakeEvidenceReport("release-test", {
    sourceCards: [sourceCard],
    sourceSpans: [sourceSpan],
    extractionBatches: [{ ...extractionBatch, extractionCount: 3 }],
    argumentExtractions: [
      { ...pendingExtraction, reviewStatus: "accepted_for_position_intake", reviewedBy: "demo-admin", reviewedAt: "2026-10-01T00:03:00.000Z" },
      {
        ...pendingExtraction,
        id: "argument-extraction-accepted-critique",
        argumentRole: "critique_argument",
        possiblePreparedPositionText: undefined,
        extractedPositionText: undefined,
        reviewStatus: "accepted_for_critique_intake",
        reviewedBy: "demo-admin",
        reviewedAt: "2026-10-01T00:04:00.000Z",
      },
      {
        ...pendingExtraction,
        id: "argument-extraction-accepted-source-prep",
        reviewStatus: "accepted_for_source_preparation",
        reviewedBy: "demo-admin",
        reviewedAt: "2026-10-01T00:05:00.000Z",
      },
    ],
  });
  assert.equal(acceptedReport.releaseUseStatus, "phase1_source_intake_ready_for_future_source_preparation");
  assert.equal(acceptedReport.counts.acceptedForSourcePreparationExtractions, 3);
  assert.equal(acceptedReport.counts.acceptedForPositionIntakeExtractions, 1);
  assert.equal(acceptedReport.counts.acceptedForCritiqueIntakeExtractions, 1);
  assert.equal(acceptedReport.counts.acceptedForGeneralSourcePreparationExtractions, 1);

  const unsafeReport = buildSourceIntakeEvidenceReport("release-test", {
    sourceCards: [sourceCard],
    sourceSpans: [sourceSpan],
    extractionBatches: [extractionBatch],
    argumentExtractions: [{ ...pendingExtraction, id: "argument-extraction-unsafe", createsCandidateBatch: true }],
  });
  assert.equal(unsafeReport.releaseUseStatus, "phase1_source_intake_review_required");
  assert.ok(
    unsafeReport.reviewSections.some(
      (section) => section.artifactType === "argument_extraction" && section.artifactId === "argument-extraction-unsafe" && section.reason === "createsCandidateBatch",
    ),
  );

  const incompleteCritiqueReport = buildSourceIntakeEvidenceReport("release-test", {
    sourceCards: [sourceCard],
    sourceSpans: [sourceSpan],
    extractionBatches: [extractionBatch],
    argumentExtractions: [
      {
        ...pendingExtraction,
        id: "argument-extraction-critique-target-missing",
        argumentRole: "critique_argument",
        possiblePreparedPositionText: undefined,
        extractedPositionText: undefined,
        critiqueTarget: "",
      },
    ],
  });
  assert.equal(incompleteCritiqueReport.releaseUseStatus, "phase1_source_intake_review_required");
  assert.ok(
    incompleteCritiqueReport.reviewSections.some(
      (section) =>
        section.artifactType === "argument_extraction" &&
        section.artifactId === "argument-extraction-critique-target-missing" &&
        section.reason === "critiqueTarget",
    ),
  );

  const downstreamFieldReport = buildSourceIntakeEvidenceReport("release-test", {
    sourceCards: [{ ...sourceCard, id: "source-card-downstream-field", candidateBatchId: "candidate-batch-not-phase-1" }],
  });
  assert.equal(downstreamFieldReport.releaseUseStatus, "phase1_source_intake_review_required");
  assert.ok(
    downstreamFieldReport.reviewSections.some(
      (section) =>
        section.artifactType === "source_card" &&
        section.artifactId === "source-card-downstream-field" &&
        section.reason === "forbidden_downstream_field:candidateBatchId",
      ),
  );

  const pluralDownstreamFieldReport = buildSourceIntakeEvidenceReport("release-test", {
    sourceCards: [{ ...sourceCard, id: "source-card-plural-downstream-field", preparedDrafts: [], candidateItems: [] }],
  });
  assert.equal(pluralDownstreamFieldReport.releaseUseStatus, "phase1_source_intake_review_required");
  assert.ok(
    pluralDownstreamFieldReport.reviewSections.some(
      (section) =>
        section.artifactType === "source_card" &&
        section.artifactId === "source-card-plural-downstream-field" &&
        section.reason === "forbidden_downstream_field:preparedDrafts",
    ),
  );
  assert.ok(
    pluralDownstreamFieldReport.reviewSections.some(
      (section) =>
        section.artifactType === "source_card" &&
        section.artifactId === "source-card-plural-downstream-field" &&
        section.reason === "forbidden_downstream_field:candidateItems",
    ),
  );
});

test("source-preparation evidence reports review signals without treating them as gate decisions", () => {
  const acceptedExtraction = {
    id: "argument-extraction-source-prep-evidence",
    extractionBatchId: "extraction-batch-source-prep-evidence",
    sourceCardId: "source-card-source-prep-evidence",
    sourceSpanIds: ["source-span-source-prep-evidence"],
    argumentRole: "position_argument",
    intendedConclusion: "Good arguments state the inferential burden they carry.",
    reviewStatus: "accepted_for_position_intake",
  };
  const preparedDraft = {
    id: "prepared-draft-source-prep-evidence",
    sourceArgumentExtractionId: acceptedExtraction.id,
    sourceExtractionBatchId: acceptedExtraction.extractionBatchId,
    sourceCardId: acceptedExtraction.sourceCardId,
    sourceSpanIds: acceptedExtraction.sourceSpanIds,
    draftType: "prepared_position_draft",
    preparedText: "Good arguments state the inferential burden they carry.",
    candidateRaterVisibleText: "Good arguments state the inferential burden they carry.",
    blindingReviewStatus: "blinding_review_passed",
    sourceLeakageReviewStatus: "source_leakage_review_passed",
    gateReadinessStatus: "not_ready",
    candidateItemReadiness: "not_ready",
    preparedDraftStatus: "drafting",
    createdBy: "demo-admin",
    createdAt: "2026-10-01T00:05:00.000Z",
    sourcePreparationPhase: "phase2_source_preparation",
    sourcePreparationReviewStatus: "prepared_from_accepted_extraction",
    visibilityClasses: {
      preparedText: "reviewer_visible",
      candidateRaterVisibleText: "reviewer_visible",
      sourceArgumentExtractionId: "admin_only",
    },
  };
  const goodSignal = {
    id: "review-signal-source-prep-evidence",
    signalType: "source_leakage_reviewed",
    source: "admin",
    confidence: 0.9,
    explanation: "Prepared text removes source-identifying metadata.",
    affectedObjectType: "PreparedDraft",
    affectedObjectId: preparedDraft.id,
    visibilityClass: "admin_only",
    createdAt: "2026-10-01T00:06:00.000Z",
  };
  const badSignal = {
    ...goodSignal,
    id: "review-signal-source-prep-leaky",
    affectedObjectType: "SourceSpan",
    affectedObjectId: acceptedExtraction.sourceSpanIds[0],
    visibilityClass: "rater_visible_after_promotion",
  };

  const goodReport = buildSourcePreparationEvidenceReport("release-test", {
    argumentExtractions: [acceptedExtraction],
    preparedDrafts: [preparedDraft],
    reviewSignals: [goodSignal],
  });
  assert.equal(goodReport.counts.reviewSignals, 1);
  assert.equal(goodReport.counts.gateDecisions, 0);
  assert.deepEqual(goodReport.routes.adminWriteRoutes, [
    "/api/v1/admin/extractions/{id}/create-prepared-position",
    "/api/v1/admin/extractions/{id}/create-prepared-critique",
    "/api/v1/admin/prepared-drafts/{id}/review",
    "/api/v1/admin/prepared-drafts/{id}/promote",
  ]);
  assert.ok(goodReport.routes.readbackRoutes.includes("/api/v1/admin/gate-decisions"));
  assert.ok(goodReport.routes.templateReadbackRoutes.includes("/api/v1/metaphilosophy/source-workbench-template?templateKind=prepared_draft_promote"));
  assert.equal(goodReport.routeCounts.byRoute["/api/v1/admin/prepared-drafts/{id}/review"], 1);
  assert.equal(goodReport.routeCounts.byRoute["/api/v1/admin/promotion-records"], 1);
  assert.equal(goodReport.routeCounts.byRoute["/api/v1/metaphilosophy/source-workbench-template"], 1);
  assert.equal(goodReport.workflowPolicy.policyId, "prepared_draft_readiness");
  assert.deepEqual(goodReport.workflowPolicy.requiredGateIds, requiredGateIdsForPolicy("prepared_draft_readiness"));
  assert.equal(goodReport.workflowPolicy.requiredGates.length, requiredGateIdsForPolicy("prepared_draft_readiness").length);
  assert.ok(goodReport.workflowPolicy.requiredGates.some((gate) => gate.gateId === "source_leakage_gate" && gate.label === "Source leakage"));
  assert.equal(goodReport.preparedDraftRows[0].requiredGateSummary.requiredGates.length, requiredGateIdsForPolicy("prepared_draft_readiness").length);
  assert.equal(goodReport.reviewSignalRows[0].signalType, "source_leakage_reviewed");
  assert.equal(goodReport.reviewSignalRows[0].reviewReasons.length, 0);
  assert.equal(goodReport.releaseUseStatus, "source_preparation_prepared_drafts_recorded");

  const validGateDecision = {
    id: "gate-decision-source-prep-evidence",
    gateId: "source_leakage_gate",
    workflowPolicyId: "prepared_draft_readiness",
    objectType: "PreparedDraft",
    objectId: preparedDraft.id,
    gateStatus: "passed",
    decisionSource: "authorized_admin",
    citedReviewSignalIds: [goodSignal.id],
    decisionNote: "Source leakage gate passed after reviewing the prepared rater-visible text.",
    waiverReason: null,
    reviewerId: "demo-admin",
    timestamp: "2026-10-01T00:07:00.000Z",
    visibilityClass: "admin_only",
  };
  const gateDecisionReport = buildSourcePreparationEvidenceReport("release-test", {
    argumentExtractions: [acceptedExtraction],
    preparedDrafts: [preparedDraft],
    reviewSignals: [goodSignal],
    gateDecisions: [validGateDecision],
  });
  assert.equal(gateDecisionReport.counts.gateDecisions, 1);
  assert.equal(gateDecisionReport.gateDecisionRows[0].reviewReasons.length, 0);
  assert.equal(gateDecisionReport.releaseUseStatus, "source_preparation_prepared_drafts_recorded");

  const malformedGateDecisionReport = buildSourcePreparationEvidenceReport("release-test", {
    argumentExtractions: [acceptedExtraction],
    preparedDrafts: [preparedDraft],
    reviewSignals: [goodSignal],
    gateDecisions: [
      {
        ...validGateDecision,
        id: "gate-decision-source-prep-malformed",
        gateId: "unknown_source_preparation_gate",
        citedReviewSignalIds: ["review-signal-not-in-source-lineage"],
        decisionNote: "",
        visibilityClass: "user_visible",
      },
    ],
  });
  assert.equal(malformedGateDecisionReport.releaseUseStatus, "source_preparation_review_required");
  assert.ok(
    malformedGateDecisionReport.reviewSections.some(
      (section) =>
        section.artifactType === "source_gate_decision" &&
        section.artifactId === "gate-decision-source-prep-malformed" &&
        section.reason === "gateId:not_required_for_policy",
    ),
  );
  assert.ok(
    malformedGateDecisionReport.reviewSections.some(
      (section) =>
        section.artifactType === "source_gate_decision" &&
        section.artifactId === "gate-decision-source-prep-malformed" &&
        section.reason === "decisionNote",
    ),
  );
  assert.ok(
    malformedGateDecisionReport.reviewSections.some(
      (section) =>
        section.artifactType === "source_gate_decision" &&
        section.artifactId === "gate-decision-source-prep-malformed" &&
        section.reason === "visibilityClass",
    ),
  );
  assert.ok(
    malformedGateDecisionReport.reviewSections.some(
      (section) =>
        section.artifactType === "source_gate_decision" &&
        section.artifactId === "gate-decision-source-prep-malformed" &&
        section.reason === "citedReviewSignalIds:not_found:review-signal-not-in-source-lineage",
    ),
  );

  const critiqueAcceptedExtraction = {
    ...acceptedExtraction,
    id: "argument-extraction-source-prep-critique-evidence",
    argumentRole: "critique_argument",
    reviewStatus: "accepted_for_critique_intake",
  };
  const critiquePreparedDraftReport = buildSourcePreparationEvidenceReport("release-test", {
    argumentExtractions: [critiqueAcceptedExtraction],
    preparedDrafts: [
      {
        ...preparedDraft,
        id: "prepared-draft-source-prep-critique-evidence",
        sourceArgumentExtractionId: critiqueAcceptedExtraction.id,
        draftType: "prepared_critique_draft",
        targetPositionId: "position-target",
      },
    ],
  });
  assert.equal(critiquePreparedDraftReport.releaseUseStatus, "source_preparation_prepared_drafts_recorded");
  assert.equal(
    critiquePreparedDraftReport.preparedDraftRows[0].reviewReasons.includes("sourceArgumentExtractionId:not_accepted"),
    false,
  );

  const reviewRequiredReport = buildSourcePreparationEvidenceReport("release-test", {
    argumentExtractions: [acceptedExtraction],
    preparedDrafts: [preparedDraft],
    reviewSignals: [goodSignal, badSignal],
  });
  assert.equal(reviewRequiredReport.counts.reviewSignals, 2);
  assert.equal(reviewRequiredReport.releaseUseStatus, "source_preparation_review_required");
  assert.ok(
    reviewRequiredReport.reviewSections.some(
      (section) =>
        section.artifactType === "source_review_signal" &&
        section.artifactId === "review-signal-source-prep-leaky" &&
        section.reason === "visibilityClass",
    ),
  );
});

test("metaphilosophy greenfield architecture preserves spine and shell boundaries", () => {
  const architecture = buildMetaphilosophyGreenfieldArchitectureReport("release-test");

  assert.equal(architecture.releaseUseStatus, "metaphilosophy_greenfield_architecture_declared");
  assert.equal(architecture.counts.validRequiredLayers, METAPHILOSOPHY_REQUIRED_ARCHITECTURE_LAYER_IDS.length);
  assert.equal(architecture.missingRequiredLayerIds.length, 0);
  assert.match(architecture.policy.preservationRule, /research spine/);
  assert.match(architecture.policy.duplicationBoundary, /Position/);

  for (const layerId of METAPHILOSOPHY_REQUIRED_ARCHITECTURE_LAYER_IDS) {
    const row = architecture.layerRows.find((layer) => layer.id === layerId);
    assert.ok(row, `${layerId} should be declared`);
    assert.equal(row.reviewReasons.length, 0);
    assert.ok(row.artifactFamilies.length > 0);
    assert.match(row.boundaryRule, /./);
    assert.match(row.releaseClaimRole, /./);
  }

  const incompleteArchitecture = buildMetaphilosophyGreenfieldArchitectureReport("release-test", {
    greenfieldArchitectureLayers: [{ id: "research_spine", label: "Research spine" }],
  });
  assert.equal(incompleteArchitecture.releaseUseStatus, "metaphilosophy_greenfield_architecture_review_required");
  assert.ok(incompleteArchitecture.missingRequiredLayerIds.includes("intake_spine"));
  assert.ok(incompleteArchitecture.reviewSections.some((section) => section.artifactId === "research_spine" && section.reason === "role"));

  const releaseReport = buildOctoberReleaseReport();
  assert.equal(releaseReport.greenfieldArchitecture.releaseUseStatus, "metaphilosophy_greenfield_architecture_declared");
});

test("metaphilosophy task-track taxonomy and R&D backlog stay separated from release gates", () => {
  const taxonomy = buildMetaphilosophyTaskTrackTaxonomyReport("release-test");

  assert.equal(taxonomy.releaseUseStatus, "metaphilosophy_task_track_taxonomy_declared");
  assert.equal(taxonomy.counts.validRequiredTracks, METAPHILOSOPHY_REQUIRED_TASK_TRACK_IDS.length);
  assert.equal(taxonomy.missingRequiredTrackIds.length, 0);
  for (const trackId of METAPHILOSOPHY_REQUIRED_TASK_TRACK_IDS) {
    const row = taxonomy.taskTrackRows.find((track) => track.id === trackId);
    assert.ok(row, `${trackId} should be declared`);
    assert.equal(row.reviewReasons.length, 0);
    assert.ok(row.modelInput.fields.length > 0);
    assert.ok(row.modelOutput.fields.length > 0);
    assert.ok(row.primaryMetricFamilies.length > 0);
    assert.match(row.splitPolicy, /split/i);
    assert.match(row.trainingExportPolicy, /export/i);
  }
  assert.equal(taxonomy.taskTrackRows.find((track) => track.id === "critique_rating").lmcaRelationship, "lmca_direct");
  assert.equal(taxonomy.taskTrackRows.find((track) => track.id === "critique_revision").lmcaRelationship, "rd_backlog_extension");
  assert.equal(taxonomy.taskTrackRows.find((track) => track.id === "position_revision_reply").lmcaRelationship, "rd_backlog_extension");
  assert.match(taxonomy.policy.corpusProductionWorkflow, /SourceCard/);
  assert.match(taxonomy.policy.benchmarkModelWorkflow, /model run/);

  const incompleteTaxonomy = buildMetaphilosophyTaskTrackTaxonomyReport("release-test", {
    taskTracks: [{ id: "critique_rating", label: "Critique rating" }],
  });
  assert.equal(incompleteTaxonomy.releaseUseStatus, "metaphilosophy_task_track_taxonomy_review_required");
  assert.ok(incompleteTaxonomy.missingRequiredTrackIds.includes("critique_ranking"));
  assert.ok(incompleteTaxonomy.reviewSections.some((section) => section.artifactId === "critique_rating" && section.reason === "modelInput.summary"));

  const missingAdjudicationTrackTaxonomy = buildMetaphilosophyTaskTrackTaxonomyReport("release-test", {
    taskTracks: METAPHILOSOPHY_TASK_TRACKS.filter((track) => track.id !== "adjudication_explanation"),
  });
  assert.equal(missingAdjudicationTrackTaxonomy.releaseUseStatus, "metaphilosophy_task_track_taxonomy_review_required");
  assert.ok(missingAdjudicationTrackTaxonomy.missingRequiredTrackIds.includes("adjudication_explanation"));
  assert.ok(
    missingAdjudicationTrackTaxonomy.reviewSections.some(
      (section) => section.artifactId === "adjudication_explanation" && section.reason === "required_track_missing",
    ),
  );

  const unsafeTaskTrackTaxonomy = buildMetaphilosophyTaskTrackTaxonomyReport("release-test", {
    taskTracks: METAPHILOSOPHY_TASK_TRACKS.map((track) =>
      track.id === "critique_rating"
        ? {
            ...track,
            lmcaRelationship: "single_good_at_philosophy_score",
            blindToModelPolicy: "Models may inspect any useful label evidence.",
            splitPolicy: "Use available items.",
            trainingExportPolicy: "Training use can be decided later.",
          }
        : track,
    ),
  });
  assert.equal(unsafeTaskTrackTaxonomy.releaseUseStatus, "metaphilosophy_task_track_taxonomy_review_required");
  assert.ok(unsafeTaskTrackTaxonomy.missingRequiredTrackIds.includes("critique_rating"));
  assert.ok(
    unsafeTaskTrackTaxonomy.reviewSections.some(
      (section) => section.artifactId === "critique_rating" && section.reason === "lmcaRelationship:unsupported",
    ),
  );
  assert.ok(
    unsafeTaskTrackTaxonomy.reviewSections.some(
      (section) => section.artifactId === "critique_rating" && section.reason === "blindToModelPolicy:must_state_blinding",
    ),
  );
  assert.ok(
    unsafeTaskTrackTaxonomy.reviewSections.some(
      (section) => section.artifactId === "critique_rating" && section.reason === "splitPolicy:must_state_split_policy",
    ),
  );
  assert.ok(
    unsafeTaskTrackTaxonomy.reviewSections.some(
      (section) => section.artifactId === "critique_rating" && section.reason === "trainingExportPolicy:must_state_export_boundary",
    ),
  );

  const backlog = buildMetaphilosophyResearchBacklogReport("release-test");
  assert.equal(backlog.releaseUseStatus, "metaphilosophy_research_backlog_separated_from_release_gates");
  assert.equal(backlog.counts.backlogItems, 8);
  assert.equal(backlog.counts.nonBindingItems, 8);
  assert.equal(backlog.counts.pilotEvidenceBoundItems, 8);
  assert.equal(backlog.counts.promotionGovernanceBoundItems, 8);
  assert.ok(backlog.rows.some((row) => row.id === "direct_pairwise_preference_labels"));
  assert.ok(backlog.rows.some((row) => row.id === "critique_revision_benchmark"));
  assert.ok(backlog.rows.some((row) => row.id === "rater_cognitive_load_ab_tests"));

  const unsafeBacklog = buildMetaphilosophyResearchBacklogReport("release-test", {
    backlogItems: [
      {
        id: "unsafe-live-requirement",
        title: "Unsafe live requirement",
        experimentType: "benchmark_extension_pilot",
        releaseGateStatus: "release_gate_without_pilot_evidence",
        directRequirement: true,
        pilotEvidenceRequirement: "Pilot evidence must show measurement validity before promotion.",
        promotionGovernance: "Promotion requires a governed policy decision before release-gate use.",
        governanceBoundary: "Would make an experiment a release requirement.",
      },
    ],
  });
  assert.equal(unsafeBacklog.releaseUseStatus, "metaphilosophy_research_backlog_review_required");
  assert.ok(unsafeBacklog.reviewSections.some((section) => section.reason === "releaseGateStatus:must_not_be_release_gate"));
  assert.ok(unsafeBacklog.reviewSections.some((section) => section.reason === "directRequirement:must_be_false"));

  const pilotEvidenceGapBacklog = buildMetaphilosophyResearchBacklogReport("release-test", {
    backlogItems: [
      {
        id: "pilot-gap",
        title: "Pilot gap",
        experimentType: "benchmark_extension_pilot",
        releaseGateStatus: "not_release_gate_pending_pilot_evidence",
        directRequirement: false,
        pilotEvidenceRequirement: "Pilot evidence will be collected later.",
        promotionGovernance: "Promotion requires a governed policy decision before release-gate use.",
        governanceBoundary: "Pilot evidence remains required before any release gate.",
      },
    ],
  });
  assert.equal(pilotEvidenceGapBacklog.releaseUseStatus, "metaphilosophy_research_backlog_review_required");
  assert.ok(pilotEvidenceGapBacklog.reviewSections.some((section) => section.reason === "pilotEvidenceRequirement:evidence_goal"));

  const releaseReport = buildOctoberReleaseReport();
  assert.equal(releaseReport.taskTrackTaxonomy.releaseUseStatus, "metaphilosophy_task_track_taxonomy_declared");
  assert.equal(releaseReport.researchBacklog.releaseUseStatus, "metaphilosophy_research_backlog_separated_from_release_gates");
});

test("metaphilosophy decision log preserves RLHF93 accepted rejected and pruned decisions", () => {
  const decisionLogFile = readFileSync("Metaphilosophy_Decision_Log.md", "utf8");
  assert.match(decisionLogFile, /accepted_edit/);
  assert.match(decisionLogFile, /rejected_idea/);
  assert.match(decisionLogFile, /pruning_decision/);
  assert.match(decisionLogFile, /credence/);
  assert.match(decisionLogFile, /rlhf84-volunteer-platform-safeguards/);
  assert.match(decisionLogFile, /rlhf90-triggered-score-explanation-policy/);
  assert.match(decisionLogFile, /rlhf93-prune-historical-revision-log/);

  const decisionLog = buildMetaphilosophyDecisionLogReport("release-test");
  assert.equal(decisionLog.releaseUseStatus, "metaphilosophy_decision_log_preserved");
  assert.deepEqual(decisionLog.missingDecisionTypes, []);
  assert.equal(decisionLog.counts.requiredDecisionTypes, METAPHILOSOPHY_REQUIRED_DECISION_LOG_TYPES.length);
  assert.equal(decisionLog.counts.coveredDecisionTypes, METAPHILOSOPHY_REQUIRED_DECISION_LOG_TYPES.length);
  assert.deepEqual(decisionLog.coveredHistoricalSourceVersions, METAPHILOSOPHY_REQUIRED_HISTORICAL_DECISION_LOG_SOURCE_VERSIONS);
  assert.deepEqual(decisionLog.missingHistoricalSourceVersions, []);
  assert.equal(
    decisionLog.counts.coveredHistoricalSourceVersions,
    METAPHILOSOPHY_REQUIRED_HISTORICAL_DECISION_LOG_SOURCE_VERSIONS.length,
  );
  assert.equal(decisionLog.counts.reviewRequiredEntries, 0);
  assert.equal(decisionLog.counts.acceptedEntries, 9);
  assert.equal(decisionLog.counts.rejectedEntries, 1);
  assert.equal(decisionLog.counts.prunedEntries, 1);
  assert.equal(decisionLog.entries.length, METAPHILOSOPHY_DECISION_LOG_ENTRIES.length);
  assert.ok(decisionLog.entries.every((entry) => entry.status === "complete"));
  assert.ok(decisionLog.entries.some((entry) => entry.id === "rlhf84-volunteer-platform-safeguards" && entry.sourceVersion === "RLHF84"));
  assert.ok(decisionLog.entries.some((entry) => entry.id === "rlhf93-prune-historical-revision-log" && entry.decisionStatus === "pruned"));
  assert.match(decisionLog.policy.releaseGateBoundary, /does not waive release gates/);

  const unsafeDecisionLog = buildMetaphilosophyDecisionLogReport("release-test", {
    decisionLogEntries: [
      {
        id: "unsafe-decision-log-entry",
        title: "Unsafe decision-log entry",
        decisionType: "accepted_edit",
        decisionStatus: "accepted",
        sourceVersion: "RLHF93",
        credence: 1.2,
        currentSpecDisposition: "retained_in_main_spec",
        releaseGateImpact: "creates_release_gate",
        preservedIn: "Main spec",
        rationale: "This intentionally violates the audit-only decision-log contract.",
      },
    ],
  });
  assert.equal(unsafeDecisionLog.releaseUseStatus, "metaphilosophy_decision_log_review_required");
  assert.ok(unsafeDecisionLog.reviewSections.some((section) => section.reason === "credence:must_be_0_to_1"));
  assert.ok(unsafeDecisionLog.reviewSections.some((section) => section.reason === "releaseGateImpact:must_be_audit_only"));
  assert.ok(unsafeDecisionLog.reviewSections.some((section) => section.reason === "preservedIn:must_point_to_decision_log"));
  assert.ok(unsafeDecisionLog.missingDecisionTypes.includes("rejected_idea"));
  assert.ok(unsafeDecisionLog.missingDecisionTypes.includes("pruning_decision"));
  assert.ok(unsafeDecisionLog.missingHistoricalSourceVersions.includes("RLHF84"));
  assert.ok(unsafeDecisionLog.reviewSections.some((section) => section.reason === "required_historical_source_version_missing"));
});

test("metaphilosophy deliverable checklist binds RLHF91 and RLHF93 additions to release evidence", () => {
  const releaseReport = buildOctoberReleaseReport();
  const sourceWorkbenchRow = releaseReport.metaphilosophyDeliverableChecklist.rows.find((row) => row.id === "admin_source_extraction_workbench");
  const decisionLogRow = releaseReport.metaphilosophyDeliverableChecklist.rows.find((row) => row.id === "decision_log_preserved");

  assert.equal(releaseReport.sourcePreparationEvidence.releaseUseStatus, "source_preparation_not_started");
  assert.equal(releaseReport.sourcePreparationEvidence.counts.preparedDrafts, 0);
  assert.equal(releaseReport.sourcePreparationEvidence.counts.candidateItems, 0);
  assert.equal(releaseReport.sourcePreparationEvidence.counts.promotionRecords, 0);
  assert.equal(Object.hasOwn(releaseReport, "workflowSourcePreparationArtifacts"), false);
  assert.equal(releaseReport.metaphilosophyDecisionLog.releaseUseStatus, "metaphilosophy_decision_log_preserved");
  assert.equal(releaseReport.metaphilosophyDeliverableChecklist.releaseUseStatus, "metaphilosophy_deliverable_checklist_complete");
  assert.equal(releaseReport.metaphilosophyDeliverableChecklist.counts.deliverables, 5);
  assert.equal(releaseReport.metaphilosophyDeliverableChecklist.counts.notApplicable, 1);
  assert.equal(releaseReport.metaphilosophyDeliverableChecklist.counts.reviewRequired, 0);
  assert.match(
    releaseReport.metaphilosophyDeliverableChecklist.rows.find((row) => row.id === "greenfield_task_track_taxonomy").deliverable,
    /adjudication explanation/,
  );
  assert.equal(sourceWorkbenchRow.status, "not_applicable_without_source_derived_items");
  assert.equal(sourceWorkbenchRow.phaseGate.status, "workbench_route_lane_available");
  assert.ok(sourceWorkbenchRow.evidenceIds.includes(releaseReport.sourcePreparationEvidence.id));
  assert.ok(sourceWorkbenchRow.sourceStatuses.includes("source_preparation_not_started"));
  assert.equal(decisionLogRow.status, "complete");
  assert.ok(decisionLogRow.evidenceIds.includes(releaseReport.metaphilosophyDecisionLog.id));
  assert.ok(decisionLogRow.sourceStatuses.includes("metaphilosophy_decision_log_preserved"));

  const sourceIntakeEvidence = buildSourceIntakeEvidenceReport("release-test", {
    sourceCards: [{ id: "source-card-incomplete" }],
  });
  const reviewChecklist = buildMetaphilosophyDeliverableChecklistReport("release-test", {
    greenfieldArchitecture: buildMetaphilosophyGreenfieldArchitectureReport("release-test"),
    sourceIntakeEvidence,
    taskTrackTaxonomy: buildMetaphilosophyTaskTrackTaxonomyReport("release-test"),
    researchBacklog: buildMetaphilosophyResearchBacklogReport("release-test"),
  });

  assert.equal(reviewChecklist.releaseUseStatus, "metaphilosophy_deliverable_checklist_review_required");
  assert.equal(reviewChecklist.rows.find((row) => row.id === "admin_source_extraction_workbench").status, "review_required");
  assert.ok(
    reviewChecklist.reviewSections.some(
      (section) => section.artifactId === "admin_source_extraction_workbench" && section.reason === "sourceIntakeEvidence.review_required",
    ),
  );

  const availableRouteOperationalControl = buildOperationalControlEvidenceReport("release-test");
  for (const sourceIntakeEvidenceRow of [
    {
      id: "source-intake-raw-only",
      releaseUseStatus: "phase1_source_intake_sources_recorded_extraction_not_started",
      counts: { sourceCards: 1, sourceSpans: 0, extractionBatches: 0, argumentExtractions: 0 },
    },
    {
      id: "source-intake-pending-review",
      releaseUseStatus: "phase1_source_intake_pending_review",
      counts: { sourceCards: 1, sourceSpans: 1, extractionBatches: 1, argumentExtractions: 1 },
    },
    {
      id: "source-intake-rejected-only",
      releaseUseStatus: "phase1_source_intake_reviewed_no_accepted_extractions",
      counts: { sourceCards: 1, sourceSpans: 1, extractionBatches: 1, argumentExtractions: 1 },
    },
  ]) {
    const notReadyChecklist = buildMetaphilosophyDeliverableChecklistReport("release-test", {
      greenfieldArchitecture: buildMetaphilosophyGreenfieldArchitectureReport("release-test"),
      sourceIntakeEvidence: sourceIntakeEvidenceRow,
      sourcePreparationEvidence: {
        id: "source-preparation-not-started",
        releaseUseStatus: "source_preparation_not_started",
        counts: { preparedDrafts: 0, candidateItems: 0, promotionRecords: 0 },
      },
      taskTrackTaxonomy: buildMetaphilosophyTaskTrackTaxonomyReport("release-test"),
      researchBacklog: buildMetaphilosophyResearchBacklogReport("release-test"),
      operationalControlEvidence: availableRouteOperationalControl,
    });
    const notReadyWorkbenchRow = notReadyChecklist.rows.find((row) => row.id === "admin_source_extraction_workbench");
    assert.equal(notReadyWorkbenchRow.status, "review_required");
    assert.ok(notReadyWorkbenchRow.reviewReasons.includes("sourceIntakeEvidence:not_ready_for_source_preparation"));
  }

  const readyChecklist = buildMetaphilosophyDeliverableChecklistReport("release-test", {
    greenfieldArchitecture: buildMetaphilosophyGreenfieldArchitectureReport("release-test"),
    sourceIntakeEvidence: {
      id: "source-intake-ready",
      releaseUseStatus: "phase1_source_intake_ready_for_future_source_preparation",
      counts: { sourceCards: 1, sourceSpans: 1, extractionBatches: 1, argumentExtractions: 1, acceptedForSourcePreparationExtractions: 1 },
    },
    sourcePreparationEvidence: {
      id: "source-preparation-not-started",
      releaseUseStatus: "source_preparation_not_started",
      counts: { preparedDrafts: 0, candidateItems: 0, promotionRecords: 0 },
    },
    taskTrackTaxonomy: buildMetaphilosophyTaskTrackTaxonomyReport("release-test"),
    researchBacklog: buildMetaphilosophyResearchBacklogReport("release-test"),
    operationalControlEvidence: availableRouteOperationalControl,
  });
  assert.equal(readyChecklist.rows.find((row) => row.id === "admin_source_extraction_workbench").status, "complete");

  const disabledRouteOperationalControl = buildOperationalControlEvidenceReport("release-test", {
    implementationPhaseGateBundles: [
      {
        id: "implementation-phase-source-workbench-disabled",
        releaseId: "release-test",
        manifestId: "release-config-manifest-source-workbench-disabled",
        version: "implementation-phase-source-workbench-disabled-v1",
        laneStates: phaseGateLaneKinds.map((laneKind) => ({
          laneKind,
          laneId: `${laneKind}-source-workbench-disabled`,
          phaseState: laneKind === "route" ? "blocked" : "enabled",
          failClosed: true,
          noSideEffectsWhenDisabled: true,
          labelsExposedWhenDisabled: false,
          supportsReleaseClaimsWhenDisabled: false,
          allowedActionKinds: [],
          notes: "Source workbench route lane disabled safely for implementation phase testing.",
        })),
        futurePhaseDefault: "blocked",
        broadeningRequiresManifestActivation: true,
        frozenAt: "2026-10-01T00:00:00.000Z",
      },
    ],
  });
  const disabledRouteChecklist = buildMetaphilosophyDeliverableChecklistReport("release-test", {
    greenfieldArchitecture: buildMetaphilosophyGreenfieldArchitectureReport("release-test"),
    sourceIntakeEvidence: {
      id: "source-intake-ready",
      releaseUseStatus: "phase1_source_intake_ready_for_future_source_preparation",
      counts: { sourceCards: 1, sourceSpans: 1, extractionBatches: 1, argumentExtractions: 1 },
    },
    taskTrackTaxonomy: buildMetaphilosophyTaskTrackTaxonomyReport("release-test"),
    researchBacklog: buildMetaphilosophyResearchBacklogReport("release-test"),
    operationalControlEvidence: disabledRouteOperationalControl,
  });
  const disabledRouteWorkbenchRow = disabledRouteChecklist.rows.find((row) => row.id === "admin_source_extraction_workbench");
  assert.equal(disabledRouteWorkbenchRow.status, "review_required");
  assert.equal(disabledRouteWorkbenchRow.phaseGate.phaseState, "blocked");
  assert.equal(disabledRouteWorkbenchRow.phaseGate.status, "workbench_route_lane_safely_disabled");
  assert.ok(
    disabledRouteChecklist.reviewSections.some(
      (section) =>
        section.artifactId === "admin_source_extraction_workbench" &&
        section.reason === "sourceWorkbenchPhaseGate:workbench_route_lane_safely_disabled",
    ),
  );
});

test("October completion checklist carries source-preparation review status", () => {
  const acceptedExtraction = {
    id: "argument-extraction-october-checklist",
    extractionBatchId: "extraction-batch-october-checklist",
    sourceCardId: "source-card-october-checklist",
    sourceSpanIds: ["source-span-october-checklist"],
    argumentRole: "position_argument",
    intendedConclusion: "Arguments should make their inferential burden explicit.",
    reviewStatus: "accepted_for_position_intake",
  };
  const preparedDraft = {
    id: "prepared-draft-october-checklist",
    sourceArgumentExtractionId: acceptedExtraction.id,
    sourceExtractionBatchId: acceptedExtraction.extractionBatchId,
    sourceCardId: acceptedExtraction.sourceCardId,
    sourceSpanIds: acceptedExtraction.sourceSpanIds,
    draftType: "prepared_position_draft",
    preparedText: "Arguments should make their inferential burden explicit.",
    candidateRaterVisibleText: "Arguments should make their inferential burden explicit.",
    blindingReviewStatus: "blinding_review_passed",
    sourceLeakageReviewStatus: "source_leakage_review_passed",
    gateReadinessStatus: "not_ready",
    candidateItemReadiness: "not_ready",
    preparedDraftStatus: "drafting",
    createdBy: "demo-admin",
    createdAt: "2026-10-01T00:05:00.000Z",
    sourcePreparationPhase: "phase2_source_preparation",
    sourcePreparationReviewStatus: "prepared_from_accepted_extraction",
    visibilityClasses: {
      preparedText: "reviewer_visible",
      candidateRaterVisibleText: "reviewer_visible",
      sourceArgumentExtractionId: "admin_only",
    },
  };
  const reviewRequiredSignal = {
    id: "review-signal-october-checklist",
    signalType: "source_leakage_reviewed",
    source: "admin",
    confidence: 0.9,
    explanation: "Intentionally malformed visibility to prove the umbrella checklist carries source-preparation review state.",
    affectedObjectType: "PreparedDraft",
    affectedObjectId: preparedDraft.id,
    visibilityClass: "rater_visible_after_promotion",
    createdAt: "2026-10-01T00:06:00.000Z",
  };

  const releaseReport = buildOctoberReleaseReport(
    "october-checklist-source-preparation",
    null,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      argumentExtractions: [acceptedExtraction],
      preparedDrafts: [preparedDraft],
      reviewSignals: [reviewRequiredSignal],
    },
  );
  const sourceWorkbenchRow = releaseReport.octoberCompletionChecklist.rows.find((row) => row.id === "source_intake_and_metaphilosophy");

  assert.equal(releaseReport.sourcePreparationEvidence.releaseUseStatus, "source_preparation_review_required");
  assert.equal(sourceWorkbenchRow.status, "review_required");
  assert.ok(sourceWorkbenchRow.evidenceIds.includes(releaseReport.sourcePreparationEvidence.id));
  assert.ok(sourceWorkbenchRow.sourceStatuses.includes("review_required"));
  assert.equal(sourceWorkbenchRow.sourceWorkbenchApplicability.status, "review_required");
  assert.ok(sourceWorkbenchRow.sourceWorkbenchApplicability.sourceEvidenceStatuses.includes("source_preparation_review_required"));
  assert.ok(sourceWorkbenchRow.reviewReasons.includes("sourcePreparationEvidence.review_required"));
  assert.equal(releaseReport.workflowSourcePreparationArtifacts.reviewSignals.length, 1);
  assert.equal(releaseReport.workflowSourcePreparationArtifacts.reviewSignals[0].id, reviewRequiredSignal.id);
});

test("October completion checklist records operator-evidence statuses when child reports have no review sections", () => {
  const releaseReport = buildOctoberReleaseReport();
  const rowById = Object.fromEntries(releaseReport.octoberCompletionChecklist.rows.map((row) => [row.id, row]));
  const planById = Object.fromEntries(releaseReport.operatorEvidenceSubmissionPlan.rows.map((row) => [row.checklistRowId, row]));

  assert.equal(rowById.source_intake_and_metaphilosophy.status, "complete");
  assert.deepEqual(rowById.source_intake_and_metaphilosophy.sourceStatuses, [
    "metaphilosophy_deliverable_checklist_complete",
    "not_applicable_without_source_derived_items",
    "workbench_route_lane_available",
  ]);
  assert.equal(rowById.source_intake_and_metaphilosophy.sourceWorkbenchApplicability.status, "not_applicable_without_source_derived_items");
  assert.deepEqual(rowById.source_intake_and_metaphilosophy.sourceWorkbenchApplicability.sourceEvidenceStatuses, [
    "phase1_source_intake_not_started",
    "source_preparation_not_started",
  ]);
  assert.equal(rowById.release_artifact_submission_package.status, "operator_evidence_required");
  assert.deepEqual(rowById.release_artifact_submission_package.reviewReasons, [
    "releaseArtifactEvidence:computed_release_artifacts_no_submitted_manifests",
  ]);
  assert.ok(planById.release_artifact_submission_package.readbackRoutes.includes("/api/v1/release-report-sections"));
  assert.deepEqual(rowById.release_artifact_submission_package.bulkImportRoutes, ["/api/v1/operator-evidence/import-jsonl"]);
  assert.deepEqual(rowById.release_artifact_submission_package.dryRunImportRoutes, [
    "/api/v1/operator-evidence/import-jsonl?dryRun=true",
  ]);
  assert.deepEqual(rowById.release_artifact_submission_package.validateOnlyImportRoutes, [
    "/api/v1/operator-evidence/import-jsonl?validateOnly=true",
  ]);
  assert.deepEqual(
    rowById.release_artifact_submission_package.relatedSubmitActionIds,
    planById.release_artifact_submission_package.actionItems.map((item) => item.id),
  );
  assert.ok(
    rowById.release_artifact_submission_package.templateReadbackRoutes.includes(
      "/api/v1/operator-evidence/import-jsonl-template?checklistRowId=release_artifact_submission_package&artifactKind=corpus_manifest",
    ),
  );
  assert.equal(rowById.model_evaluation_submission_package.status, "operator_evidence_required");
  assert.deepEqual(rowById.model_evaluation_submission_package.reviewReasons, [
    "modelEvaluationArtifactEvidence:computed_model_evaluation_artifacts_no_submitted_runs",
  ]);
  assert.ok(planById.model_evaluation_submission_package.readbackRoutes.includes("/api/v1/release-report-sections"));
  assert.equal(rowById.discussion_and_adjudication_workflows.status, "operator_evidence_required");
  assert.deepEqual(rowById.discussion_and_adjudication_workflows.reviewReasons, [
    "discussionAdjudicationWorkflowEvidence:discussion_adjudication_workflow_not_submitted",
  ]);
  assert.ok(planById.discussion_and_adjudication_workflows.readbackRoutes.includes("/api/v1/release-report-sections"));
  assert.equal(rowById.validation_hidden_benchmark_and_claims.status, "data_collection_required");
  assert.ok(planById.validation_hidden_benchmark_and_claims.readbackRoutes.includes("/api/v1/release-report-sections"));
  assert.deepEqual(rowById.validation_hidden_benchmark_and_claims.bulkImportRoutes, ["/api/v1/validation-tranche-evidence/import-jsonl"]);
  assert.deepEqual(rowById.validation_hidden_benchmark_and_claims.bulkImportWorkflowTemplateIds, [
    "validation-tranche-evidence-jsonl-import",
  ]);
  assert.deepEqual(rowById.validation_hidden_benchmark_and_claims.dryRunImportRoutes, [
    "/api/v1/validation-tranche-evidence/import-jsonl?dryRun=true",
  ]);
  assert.deepEqual(rowById.validation_hidden_benchmark_and_claims.validateOnlyImportRoutes, [
    "/api/v1/validation-tranche-evidence/import-jsonl?validateOnly=true",
  ]);
  assert.equal(rowById.validation_hidden_benchmark_and_claims.bulkImportRoutes.includes("/api/v1/operator-evidence/import-jsonl"), false);
  assert.ok(rowById.target_scale_and_data_collection.bulkImportRoutes.includes("/api/v1/ratings/import-jsonl"));
  assert.ok(rowById.target_scale_and_data_collection.setupBulkImportRoutes.includes("/api/v1/assignments/import-jsonl"));
  assert.ok(rowById.target_scale_and_data_collection.packageImportRoutes.includes("/api/v1/target-gaps/import-jsonl-package"));
  assert.ok(rowById.target_scale_and_data_collection.packageDryRunImportRoutes.includes("/api/v1/target-gaps/import-jsonl-package?dryRun=true"));
  assert.ok(
    rowById.target_scale_and_data_collection.templateReadbackRoutes.includes(
      "/api/v1/target-gaps/import-jsonl-template?targetGapId=blind_initial_ratings&expand=remaining",
    ),
  );
  assert.deepEqual(
    rowById.target_scale_and_data_collection.relatedCollectDataActionIds,
    planById.target_scale_and_data_collection.actionItems.map((item) => item.id),
  );
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.releaseUseStatus, "operator_evidence_submission_plan_open");
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.openRows, 7);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.submitOperatorEvidence, 4);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.collectDataBeforeSubmission, 3);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.linkedEvidenceIds, 11);
  assert.ok(releaseReport.operatorEvidenceSubmissionPlan.counts.reviewEvidencePointers > 0);
  assert.ok(releaseReport.operatorEvidenceSubmissionPlan.counts.reviewArtifactSummaries > 0);
  assert.ok(releaseReport.operatorEvidenceSubmissionPlan.counts.submissionChecklistItems > 0);
  assert.ok(releaseReport.operatorEvidenceSubmissionPlan.counts.submissionChecklistOpenItems > 0);
  assert.equal(
    releaseReport.operatorEvidenceSubmissionPlan.reviewEvidencePointers.length,
    releaseReport.operatorEvidenceSubmissionPlan.counts.reviewEvidencePointers,
  );
  assert.equal(
    releaseReport.operatorEvidenceSubmissionPlan.reviewArtifactSummaries.length,
    releaseReport.operatorEvidenceSubmissionPlan.counts.reviewArtifactSummaries,
  );
  assert.equal(
    releaseReport.operatorEvidenceSubmissionPlan.submissionChecklist.length,
    releaseReport.operatorEvidenceSubmissionPlan.counts.submissionChecklistItems,
  );
  assert.equal(
    releaseReport.operatorEvidenceSubmissionPlan.submissionChecklist.filter((item) => item.submissionStatus !== "submitted_complete").length,
    releaseReport.operatorEvidenceSubmissionPlan.counts.submissionChecklistOpenItems,
  );
  assert.ok(
    releaseReport.operatorEvidenceSubmissionPlan.submissionChecklist.every(
      (item) => item.checklistRowId && item.checklistStatus && item.actionStatus && item.deliverableGroup,
    ),
  );
  assert.deepEqual(
    releaseReport.operatorEvidenceSubmissionPlan.rows
      .filter((row) => row.bulkImportRoutes?.length && !row.bulkImportWorkflowTemplateIds?.length)
      .map((row) => row.checklistRowId),
    [],
  );
  assert.ok(releaseReport.operatorEvidenceSubmissionPlan.submissionChecklist.every((item) => item.sourceEvidenceId));
  const bulkImportableSubmissionChecklistItems = releaseReport.operatorEvidenceSubmissionPlan.submissionChecklist.filter((item) => item.bulkImportRoute);
  assert.ok(bulkImportableSubmissionChecklistItems.length > 0);
  assert.deepEqual(
    bulkImportableSubmissionChecklistItems
      .filter((item) => !item.dryRunImportRoute || !item.validateOnlyImportRoute)
      .map((item) => item.id),
    [],
  );
  assert.deepEqual(
    bulkImportableSubmissionChecklistItems
      .filter((item) => !(item.templateReadbackRoutes?.length || item.operatorEvidenceTemplateReadbackRoute))
      .map((item) => item.id),
    [],
  );
  assert.ok(
    releaseReport.operatorEvidenceSubmissionPlan.reviewEvidencePointers.every(
      (pointer) => pointer.checklistRowId && pointer.checklistStatus && pointer.actionStatus && pointer.deliverableGroup,
    ),
  );
  assert.ok(
    releaseReport.operatorEvidenceSubmissionPlan.reviewArtifactSummaries.every(
      (summary) => summary.checklistRowId && summary.checklistStatus && summary.actionStatus && summary.deliverableGroup,
    ),
  );
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.blockingTargetGapRows, 11);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.actionItems, 48);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.collectDataActionItems, 11);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.submitArtifactActionItems, 30);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.reviewArtifactActionItems, 3);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.reviewReportSectionActionItems, 4);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.governanceCoverageAvailableActionItems, 14);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.governanceCoverageMissingActionItems, 0);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.counts.governanceCoverageNotRequiredActionItems, 34);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.actionItems.length, 48);
  assert.equal(
    new Set(releaseReport.operatorEvidenceSubmissionPlan.actionItems.map((item) => item.id)).size,
    releaseReport.operatorEvidenceSubmissionPlan.actionItems.length,
  );
  assert.ok(releaseReport.operatorEvidenceSubmissionPlan.actionItems.every((item) => item.sourceEvidenceId));
  assert.ok(releaseReport.operatorEvidenceSubmissionPlan.actionItems.every((item) => item.executionStatus && item.executionStatusReason));
  assert.ok(
    releaseReport.octoberCompletionChecklist.rows
      .flatMap((row) => row.operatorActionSummaries ?? [])
      .every((summary) => summary.executionStatus && summary.executionStatusReason),
  );
  assert.equal(releaseReport.releaseCompletionNavigation.releaseUseStatus, "release_completion_unblockers_open");
  assert.equal(releaseReport.releaseCompletionNavigation.currentBlockingPhase, "collect_data");
  assert.equal(releaseReport.releaseCompletionNavigation.currentBlockingExecutionStatus, "ready_to_collect_data");
  assert.equal(releaseReport.releaseCompletionNavigation.currentBlockingGroup.firstReadbackRoute, "/api/v1/target-gaps/collection-plan");
  assert.equal(
    releaseReport.releaseCompletionNavigation.currentBlockingGroup.runbookGroupRoute,
    "/api/v1/october-completion-runbook?executionStatus=ready_to_collect_data",
  );
  assert.equal(
    releaseReport.releaseCompletionNavigation.currentBlockingGroup.operatorActionGroupRoute,
    "/api/v1/operator-action-items?executionStatus=ready_to_collect_data",
  );
  assert.equal(releaseReport.releaseCompletionNavigation.currentBlockingGroup.firstImportRoute, "/api/v1/target-gaps/import-jsonl-package");
  assert.equal(
    releaseReport.releaseCompletionNavigation.currentBlockingGroup.firstDryRunRoute,
    "/api/v1/target-gaps/import-jsonl-package?dryRun=true",
  );
  assert.equal(
    releaseReport.releaseCompletionNavigation.currentBlockingGroup.firstTemplateRoute,
    "/api/v1/target-gaps/import-jsonl-template?expand=remaining&maxExpandedRecords=25",
  );
  assert.equal(
    releaseReport.releaseCompletionNavigation.currentBlockingGroup.firstPackageManifestRoute,
    "/api/v1/target-gaps/current-package-manifest",
  );
  const blockedTargetDataGroup = releaseReport.releaseCompletionNavigation.nextUnblockerSequence.find(
    (item) => item.executionStatus === "blocked_by_target_data",
  );
  assert.equal(blockedTargetDataGroup.runbookGroupRoute, "/api/v1/october-completion-runbook?executionStatus=blocked_by_target_data");
  assert.equal(blockedTargetDataGroup.operatorActionGroupRoute, "/api/v1/operator-action-items?executionStatus=blocked_by_target_data");
  assert.equal(blockedTargetDataGroup.firstPackageManifestRoute, "/api/v1/target-gaps/current-package-manifest");
  assert.equal(
    blockedTargetDataGroup.firstTemplateRoute,
    "/api/v1/target-gaps/import-jsonl-template?expand=remaining&maxExpandedRecords=25",
  );
  assert.equal(blockedTargetDataGroup.firstImportRoute, "/api/v1/target-gaps/import-jsonl-package");
  assert.equal(blockedTargetDataGroup.firstDryRunRoute, "/api/v1/target-gaps/import-jsonl-package?dryRun=true");
  assert.equal(blockedTargetDataGroup.firstValidateOnlyRoute, "/api/v1/target-gaps/import-jsonl-package?validateOnly=true");
  const submitOperatorEvidenceGroup = releaseReport.releaseCompletionNavigation.nextUnblockerSequence.find(
    (item) => item.executionStatus === "ready_to_submit_evidence",
  );
  assert.equal(
    submitOperatorEvidenceGroup.runbookGroupRoute,
    "/api/v1/october-completion-runbook?executionStatus=ready_to_submit_evidence",
  );
  assert.equal(
    submitOperatorEvidenceGroup.operatorActionGroupRoute,
    "/api/v1/operator-action-items?executionStatus=ready_to_submit_evidence",
  );
  assert.equal(submitOperatorEvidenceGroup.firstPackageManifestRoute, "/api/v1/operator-evidence/package-manifest");
  const reviewCurrentEvidenceGroup = releaseReport.releaseCompletionNavigation.nextUnblockerSequence.find(
    (item) => item.executionStatus === "ready_to_review_evidence",
  );
  assert.equal(
    reviewCurrentEvidenceGroup.runbookGroupRoute,
    "/api/v1/october-completion-runbook?executionStatus=ready_to_review_evidence",
  );
  assert.equal(
    reviewCurrentEvidenceGroup.operatorActionGroupRoute,
    "/api/v1/operator-action-items?executionStatus=ready_to_review_evidence",
  );
  assert.equal(reviewCurrentEvidenceGroup.firstReleaseReportSectionsRoute, "/api/v1/release-report-sections?status=open");
  assert.equal(reviewCurrentEvidenceGroup.firstReviewEvidencePointersRoute, "/api/v1/operator-review-evidence-pointers?status=open");
  assert.equal(reviewCurrentEvidenceGroup.firstReviewArtifactSummariesRoute, "/api/v1/operator-review-artifact-summaries?status=open");
  assert.deepEqual(
    releaseReport.releaseCompletionNavigation.nextUnblockerSequence.map((item) => item.executionStatus),
    [
      "ready_to_collect_data",
      "blocked_by_target_data",
      "ready_to_submit_evidence",
      "ready_to_review_evidence",
      "blocked_by_open_release_work",
    ],
  );
  assert.deepEqual(
    releaseReport.releaseCompletionNavigation.nextUnblockerSequence.map((item) => item.sequence),
    [1, 2, 3, 4, 5],
  );
  const blockedVerificationGroup = releaseReport.releaseCompletionNavigation.nextUnblockerSequence.find(
    (item) => item.executionStatus === "blocked_by_open_release_work",
  );
  assert.equal(
    blockedVerificationGroup.runbookGroupRoute,
    "/api/v1/october-completion-runbook?executionStatus=blocked_by_open_release_work",
  );
  assert.equal(blockedVerificationGroup.operatorActionGroupRoute, null);
  assert.equal(releaseReport.releaseCompletionNavigation.counts.openTargetGaps, 7);
  assert.equal(releaseReport.releaseCompletionNavigation.counts.targetGapRemainingTotal, 2034);
  assert.equal(releaseReport.releaseCompletionNavigation.counts.openChecklistRows, releaseReport.operatorEvidenceSubmissionPlan.counts.openRows);
  assert.equal(
    releaseReport.releaseCompletionNavigation.counts.openOperatorActionItems,
    releaseReport.operatorEvidenceSubmissionPlan.actionItems.length,
  );
  assert.equal(
    releaseReport.releaseCompletionNavigation.counts.byActionExecutionStatus.ready_to_collect_data,
    releaseReport.operatorEvidenceSubmissionPlan.counts.byExecutionStatus.ready_to_collect_data,
  );
  assert.equal(releaseReport.releaseCompletionNavigation.routes.runbookRoute, "/api/v1/october-completion-runbook");
  assert.equal(
    releaseReport.releaseCompletionNavigation.routes.currentBlockingRunbookRoute,
    "/api/v1/october-completion-runbook?executionStatus=ready_to_collect_data",
  );
  assert.equal(releaseReport.releaseCompletionNavigation.routes.operatorEvidenceTemplateRoute, "/api/v1/operator-evidence/import-jsonl-template");
  assert.equal(
    releaseReport.releaseCompletionNavigation.routes.targetDataCurrentPackageManifestRoute,
    "/api/v1/target-gaps/current-package-manifest",
  );
  assert.equal(
    releaseReport.releaseCompletionNavigation.routes.operatorEvidencePackageManifestRoute,
    "/api/v1/operator-evidence/package-manifest",
  );
  assert.equal(releaseReport.releaseCompletionNavigation.routes.releaseReportSectionsOpenRoute, "/api/v1/release-report-sections?status=open");
  assert.equal(
    releaseReport.releaseCompletionNavigation.routes.operatorReviewEvidencePointersOpenRoute,
    "/api/v1/operator-review-evidence-pointers?status=open",
  );
  assert.equal(
    releaseReport.releaseCompletionNavigation.routes.operatorReviewArtifactSummariesOpenRoute,
    "/api/v1/operator-review-artifact-summaries?status=open",
  );
  assert.equal(releaseReport.releaseCompletionNavigation.policy.sideEffects.includes("does not submit data"), true);
  const actionItemExecutionStatusCounts = releaseReport.operatorEvidenceSubmissionPlan.actionItems.reduce((counts, item) => {
    counts[item.executionStatus] = (counts[item.executionStatus] ?? 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(releaseReport.operatorEvidenceSubmissionPlan.counts.byExecutionStatus, actionItemExecutionStatusCounts);
  assert.equal(
    releaseReport.operatorEvidenceSubmissionPlan.counts.readyActionItems,
    releaseReport.operatorEvidenceSubmissionPlan.actionItems.filter((item) => item.executionStatus.startsWith("ready_to_")).length,
  );
  assert.equal(
    releaseReport.operatorEvidenceSubmissionPlan.counts.blockedByTargetDataActionItems,
    actionItemExecutionStatusCounts.blocked_by_target_data ?? 0,
  );
  assert.ok(releaseReport.operatorEvidenceSubmissionPlan.counts.byExecutionStatus.ready_to_collect_data > 0);
  assert.ok(releaseReport.operatorEvidenceSubmissionPlan.counts.byExecutionStatus.blocked_by_target_data > 0);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.actionItems[0].globalSequence, 1);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.actionItems[0].rowSequence, 1);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.actionItems[0].checklistRowId, "target_scale_and_data_collection");
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.actionItems[0].executionStatus, "ready_to_collect_data");
  assert.match(releaseReport.operatorEvidenceSubmissionPlan.actionItems[0].executionStatusReason, /real target data/);
  assert.equal(rowById.target_scale_and_data_collection.nextOperatorActionSummary.executionStatus, "ready_to_collect_data");
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.actionItems[0].deliverableGroup, rowById.target_scale_and_data_collection.deliverableGroup);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.actionItems[0].governanceCoverageStatus, "governance_coverage_not_required");
  assert.deepEqual(releaseReport.operatorEvidenceSubmissionPlan.actionItems[0].governanceCoverageKinds, []);
  assert.equal(releaseReport.operatorEvidenceSubmissionPlan.actionItems.at(-1).globalSequence, 48);
  assert.equal(
    releaseReport.operatorEvidenceSubmissionPlan.actionItems.filter((item) => item.actionType === "submit_artifact").length,
    releaseReport.operatorEvidenceSubmissionPlan.counts.submitArtifactActionItems,
  );
  assert.deepEqual(
    releaseReport.operatorEvidenceSubmissionPlan.actionItems
      .filter((item) => item.checklistRowId === "validation_hidden_benchmark_and_claims" && item.actionType === "review_report_section")
      .map((item) => item.reason),
    [
      "hiddenBenchmarkFreeze.metric_family_eligibility:pointwise_only",
      "hiddenBenchmarkFreeze.pairwise_margin_distribution:pointwise_only",
      "hiddenBenchmarkFreeze.artifact_balance:insufficient_seed_benchmark",
      "releaseClaimWarnings:release_claims_limited_by_errata_or_schedule",
    ],
  );
  assert.deepEqual(
    releaseReport.operatorEvidenceSubmissionPlan.actionItems
      .filter((item) => item.checklistRowId === "validation_hidden_benchmark_and_claims" && item.actionType === "review_report_section")
      .map((item) => item.readbackItemRoute),
    [
      `/api/v1/benchmark-freeze-reports/${releaseReport.hiddenBenchmarkFreeze.id}`,
      `/api/v1/benchmark-freeze-reports/${releaseReport.hiddenBenchmarkFreeze.id}`,
      `/api/v1/benchmark-freeze-reports/${releaseReport.hiddenBenchmarkFreeze.id}`,
      `/api/v1/release-report-sections/${releaseReport.releaseClaimWarnings.id}`,
    ],
  );
  assert.equal(
    releaseReport.operatorEvidenceSubmissionPlan.actionItems.filter((item) => item.actionType === "review_report_section").length,
    releaseReport.operatorEvidenceSubmissionPlan.counts.reviewReportSectionActionItems,
  );
  assert.ok(
    releaseReport.operatorEvidenceSubmissionPlan.actionItems.some(
      (item) =>
        item.actionType === "submit_artifact" &&
        item.artifactKind === "benchmark_freeze_report" &&
        item.writeRoute === "/api/v1/benchmark/candidates/freeze" &&
        item.readbackRoute === "/api/v1/benchmark-freeze-reports",
    ),
  );
  const governanceLabelSnapshotAction = releaseReport.operatorEvidenceSubmissionPlan.actionItems.find(
    (item) => item.actionType === "submit_artifact" && item.artifactKind === "label_snapshot",
  );
  assert.equal(governanceLabelSnapshotAction.governanceCoverageStatus, "governance_coverage_available");
  assert.deepEqual(governanceLabelSnapshotAction.governanceCoverageKinds, ["policy_action_kind", "phase_gate_lane"]);
  assert.equal(governanceLabelSnapshotAction.policyActionKind, "label_snapshot_freeze");
  assert.equal(governanceLabelSnapshotAction.phaseGateLaneKind, "route");
  const governanceEvaluationPredictionAction = releaseReport.operatorEvidenceSubmissionPlan.actionItems.find(
    (item) => item.actionType === "submit_artifact" && item.artifactKind === "model_evaluation_predictions",
  );
  assert.equal(governanceEvaluationPredictionAction.governanceCoverageStatus, "governance_coverage_available");
  assert.equal(governanceEvaluationPredictionAction.setupPolicyActionKind, "evaluation_run");
  assert.equal(governanceEvaluationPredictionAction.setupPhaseGateLaneKind, "evaluation_lane");
  const governanceBenchmarkFreezeAction = releaseReport.operatorEvidenceSubmissionPlan.actionItems.find(
    (item) => item.actionType === "submit_artifact" && item.artifactKind === "benchmark_freeze_report",
  );
  assert.equal(governanceBenchmarkFreezeAction.governanceCoverageStatus, "governance_coverage_available");
  assert.deepEqual(governanceBenchmarkFreezeAction.governanceCoverageKinds, [
    "server_materialized_snapshot",
    "benchmark_exposure_audit",
  ]);
  assert.equal(governanceBenchmarkFreezeAction.policyActionKind, null);
  const artifactProbeAction = releaseReport.operatorEvidenceSubmissionPlan.actionItems.find(
    (item) => item.actionType === "submit_artifact" && item.artifactKind === "artifact_probe",
  );
  assert.equal(artifactProbeAction.writeRoute, "/api/v1/artifact-probes/run");
  assert.equal(artifactProbeAction.readbackRoute, "/api/v1/artifact-probes");
  assert.equal(artifactProbeAction.workflowTemplateId, "artifact-probe");
  assert.equal(artifactProbeAction.bulkImportRoute, null);
  assert.equal(artifactProbeAction.preconditionStatus, "data_collection_required_before_action");
  assert.equal(artifactProbeAction.governanceCoverageStatus, "governance_coverage_not_required");
  assert.deepEqual(artifactProbeAction.governanceCoverageKinds, []);
  assert.equal(artifactProbeAction.reason, "hiddenBenchmarkFreeze.artifact_probe_diagnostics:not_run_documented");
  assert.deepEqual(artifactProbeAction.templateReadbackRoutes, [
    "/api/v1/operator-action-items/payload-template?checklistRowId=validation_hidden_benchmark_and_claims&actionType=submit_artifact&artifactKind=artifact_probe",
  ]);
  const benchmarkFreezeChecklistItem = planById.validation_hidden_benchmark_and_claims.submissionChecklist.find(
    (item) => item.artifactKind === "benchmark_freeze_report",
  );
  assert.ok(benchmarkFreezeChecklistItem);
  assert.equal(benchmarkFreezeChecklistItem.submissionStatus, "not_submitted");
  assert.equal(benchmarkFreezeChecklistItem.writeRoute, "/api/v1/benchmark/candidates/freeze");
  assert.equal(benchmarkFreezeChecklistItem.readbackRoute, "/api/v1/benchmark-freeze-reports");
  assert.equal(benchmarkFreezeChecklistItem.workflowTemplateId, "benchmark-freeze-report");
  assert.equal(benchmarkFreezeChecklistItem.sourceEvidenceId, releaseReport.hiddenBenchmarkFreeze.id);
  assert.deepEqual(benchmarkFreezeChecklistItem.blockingFields, ["hiddenBenchmarkFreeze:not_ready_for_release_freeze"]);
  assert.ok(planById.release_artifact_submission_package.writeRoutes.includes("/api/v1/release-reports"));
  assert.ok(planById.release_artifact_submission_package.writeRoutes.includes("/api/v1/exports/internal"));
  assert.ok(planById.release_artifact_submission_package.readbackRoutes.includes("/api/v1/release-reports"));
  assert.ok(planById.release_artifact_submission_package.workflowTemplateIds.includes("internal-export-manifest"));
  assert.deepEqual(planById.release_artifact_submission_package.bulkImportRoutes, ["/api/v1/operator-evidence/import-jsonl"]);
  assert.deepEqual(planById.release_artifact_submission_package.bulkImportWorkflowTemplateIds, ["operator-evidence-package-jsonl-import"]);
  assert.deepEqual(planById.release_artifact_submission_package.evidenceIds, [releaseReport.releaseArtifactEvidence.id]);
  assert.equal(planById.release_artifact_submission_package.blockingTargetGaps.length, 0);
  assert.equal(planById.release_artifact_submission_package.submissionChecklist.length, 6);
  assert.deepEqual(
    planById.release_artifact_submission_package.submissionChecklist.map((item) => item.artifactKind),
    [
      "label_snapshot",
      "corpus_manifest",
      "training_export",
      "public_export_manifest",
      "internal_export_manifest",
      "release_report_snapshot",
    ],
  );
  assert.equal(
    planById.release_artifact_submission_package.submissionChecklist.find((item) => item.artifactKind === "public_export_manifest").readbackRoute,
    "/api/v1/export-manifests",
  );
  assert.equal(
    planById.release_artifact_submission_package.submissionChecklist.find((item) => item.artifactKind === "release_report_snapshot").readbackRoute,
    "/api/v1/release-reports",
  );
  assert.equal(
    planById.release_artifact_submission_package.submissionChecklist.find((item) => item.artifactKind === "label_snapshot").submissionStatus,
    "not_submitted",
  );
  assert.equal(
    planById.release_artifact_submission_package.submissionChecklist.find((item) => item.artifactKind === "label_snapshot").sourceEvidenceId,
    releaseReport.releaseArtifactEvidence.id,
  );
  const corpusManifestChecklistItem = planById.release_artifact_submission_package.submissionChecklist.find(
    (item) => item.artifactKind === "corpus_manifest",
  );
  assert.equal(corpusManifestChecklistItem.bulkImportRoute, "/api/v1/operator-evidence/import-jsonl");
  assert.equal(corpusManifestChecklistItem.bulkImportWorkflowTemplateId, "operator-evidence-package-jsonl-import");
  assert.equal(corpusManifestChecklistItem.dryRunImportRoute, "/api/v1/operator-evidence/import-jsonl?dryRun=true");
  assert.equal(corpusManifestChecklistItem.validateOnlyImportRoute, "/api/v1/operator-evidence/import-jsonl?validateOnly=true");
  assert.equal(
    corpusManifestChecklistItem.operatorEvidenceTemplateReadbackRoute,
    "/api/v1/operator-evidence/import-jsonl-template?checklistRowId=release_artifact_submission_package&artifactKind=corpus_manifest",
  );
  assert.deepEqual(corpusManifestChecklistItem.templateReadbackRoutes, [corpusManifestChecklistItem.operatorEvidenceTemplateReadbackRoute]);
  assert.equal(planById.release_artifact_submission_package.submissionChecklist.find((item) => item.artifactKind === "label_snapshot").bulkImportRoute, null);
  assert.equal(planById.release_artifact_submission_package.submissionChecklist.find((item) => item.artifactKind === "release_report_snapshot").bulkImportRoute, null);
  assert.deepEqual(
    planById.release_artifact_submission_package.actionItems.map((item) => [item.actionType, item.artifactKind, item.writeRoute]),
    [
      ["submit_artifact", "label_snapshot", "/api/v1/label-snapshots"],
      ["submit_artifact", "corpus_manifest", "/api/v1/corpus-manifests"],
      ["submit_artifact", "training_export", "/api/v1/training-exports"],
      ["submit_artifact", "public_export_manifest", "/api/v1/exports/public"],
      ["submit_artifact", "internal_export_manifest", "/api/v1/exports/internal"],
      ["submit_artifact", "release_report_snapshot", "/api/v1/release-reports"],
    ],
  );
  const labelSnapshotAction = planById.release_artifact_submission_package.actionItems.find((item) => item.artifactKind === "label_snapshot");
  assert.equal(
    labelSnapshotAction.payloadTemplateReadbackRoute,
    "/api/v1/operator-action-items/payload-template?checklistRowId=release_artifact_submission_package&actionType=submit_artifact&artifactKind=label_snapshot",
  );
  assert.deepEqual(labelSnapshotAction.templateReadbackRoutes, [labelSnapshotAction.payloadTemplateReadbackRoute]);
  const corpusManifestAction = planById.release_artifact_submission_package.actionItems.find((item) => item.artifactKind === "corpus_manifest");
  assert.equal(
    corpusManifestAction.operatorEvidenceTemplateReadbackRoute,
    "/api/v1/operator-evidence/import-jsonl-template?checklistRowId=release_artifact_submission_package&artifactKind=corpus_manifest",
  );
  assert.equal(corpusManifestAction.dryRunImportRoute, "/api/v1/operator-evidence/import-jsonl?dryRun=true");
  assert.equal(corpusManifestAction.validateOnlyImportRoute, "/api/v1/operator-evidence/import-jsonl?validateOnly=true");
  assert.deepEqual(corpusManifestAction.templateReadbackRoutes, [corpusManifestAction.operatorEvidenceTemplateReadbackRoute]);
  assert.ok(
    planById.release_artifact_submission_package.submissionChecklist.find((item) => item.artifactKind === "training_export").blockingFieldCount > 0,
  );
  assert.deepEqual(planById.release_artifact_submission_package.reviewEvidencePointers[0], {
    checklistRowId: "release_artifact_submission_package",
    sourceEvidenceId: releaseReport.releaseArtifactEvidence.id,
    artifactType: "checklist_review_reason",
    artifactId: "release_artifact_submission_package",
    reason: "releaseArtifactEvidence:computed_release_artifacts_no_submitted_manifests",
    readbackRoute: "/api/v1/release-report-sections",
    readbackItemRoute: `/api/v1/release-report-sections/${releaseReport.releaseArtifactEvidence.id}`,
    readbackScope: "release_report_section",
  });
  assert.deepEqual(
    [
      planById.model_evaluation_submission_package.reviewEvidencePointers[0],
      planById.discussion_and_adjudication_workflows.reviewEvidencePointers[0],
    ].map((pointer) => ({
      checklistRowId: pointer.checklistRowId,
      readbackRoute: pointer.readbackRoute,
      readbackItemRoute: pointer.readbackItemRoute,
      readbackScope: pointer.readbackScope,
    })),
    [
      {
        checklistRowId: "model_evaluation_submission_package",
        readbackRoute: "/api/v1/release-report-sections",
        readbackItemRoute: `/api/v1/release-report-sections/${releaseReport.modelEvaluationArtifactEvidence.id}`,
        readbackScope: "release_report_section",
      },
      {
        checklistRowId: "discussion_and_adjudication_workflows",
        readbackRoute: "/api/v1/release-report-sections",
        readbackItemRoute: `/api/v1/release-report-sections/${releaseReport.discussionAdjudicationWorkflowEvidence.id}`,
        readbackScope: "release_report_section",
      },
    ],
  );
  assert.deepEqual(planById.target_scale_and_data_collection.evidenceIds, [releaseReport.targetGaps.id]);
  assert.deepEqual(planById.target_scale_and_data_collection.blockingTargetGaps.map((gap) => gap.id), [
    "positions",
    "critiques",
    "blind_initial_ratings",
    "gold_library_items",
    "validation_critiques",
    "validation_positions",
    "validation_core_all_items_raters",
  ]);
  assert.equal(planById.target_scale_and_data_collection.blockingTargetGaps[0].sourceEvidenceId, releaseReport.corpusManifest.id);
  assert.deepEqual(planById.target_scale_and_data_collection.bulkImportRoutes, [
    "/api/v1/intake/positions/import-jsonl",
    "/api/v1/intake/critiques/import-jsonl",
    "/api/v1/ratings/import-jsonl",
    "/api/v1/gold-items/import-jsonl",
    "/api/v1/validation-tranche-evidence/import-jsonl",
  ]);
  assert.deepEqual(planById.target_scale_and_data_collection.bulkImportWorkflowTemplateIds, [
    "position-intake-jsonl-import",
    "critique-intake-jsonl-import",
    "rating-jsonl-import",
    "gold-item-jsonl-import",
    "validation-tranche-evidence-jsonl-import",
  ]);
  assert.deepEqual(planById.target_scale_and_data_collection.setupBulkImportRoutes, [
    "/api/v1/assignments/import-jsonl",
    "/api/v1/rating-context-snapshots/import-jsonl",
  ]);
  assert.deepEqual(planById.target_scale_and_data_collection.setupBulkImportWorkflowTemplateIds, [
    "assignment-jsonl-import",
    "rating-context-snapshot-jsonl-import",
  ]);
  assert.ok(planById.target_scale_and_data_collection.dryRunImportRoutes.includes("/api/v1/ratings/import-jsonl?dryRun=true"));
  assert.ok(planById.target_scale_and_data_collection.validateOnlyImportRoutes.includes("/api/v1/ratings/import-jsonl?validateOnly=true"));
  assert.ok(
    planById.target_scale_and_data_collection.templateReadbackRoutes.includes(
      "/api/v1/target-gaps/import-jsonl-template?targetGapId=blind_initial_ratings",
    ),
  );
  assert.deepEqual(planById.validation_hidden_benchmark_and_claims.bulkImportRoutes, ["/api/v1/validation-tranche-evidence/import-jsonl"]);
  assert.deepEqual(planById.validation_hidden_benchmark_and_claims.bulkImportWorkflowTemplateIds, [
    "validation-tranche-evidence-jsonl-import",
  ]);
  assert.equal(planById.validation_hidden_benchmark_and_claims.bulkImportRoutes.includes("/api/v1/operator-evidence/import-jsonl"), false);
  const targetScaleGapById = Object.fromEntries(planById.target_scale_and_data_collection.blockingTargetGaps.map((gap) => [gap.id, gap]));
  assert.equal(targetScaleGapById.positions.writeRoute, "/api/v1/intake/positions");
  assert.equal(targetScaleGapById.positions.readbackRoute, "/api/v1/intake/positions");
  assert.equal(targetScaleGapById.positions.submissionReadbackRoute, "/api/v1/intake/positions");
  assert.equal(targetScaleGapById.positions.targetGapReadbackRoute, "/api/v1/target-gaps");
  assert.equal(targetScaleGapById.positions.targetGapReadbackItemRoute, "/api/v1/target-gaps/positions");
  assert.equal(targetScaleGapById.positions.workflowTemplateId, "position-intake");
  assert.deepEqual(
    {
      targetGapId: targetScaleGapById.positions.primaryImportImpact.targetGapId,
      current: targetScaleGapById.positions.primaryImportImpact.current,
      target: targetScaleGapById.positions.primaryImportImpact.target,
      remaining: targetScaleGapById.positions.primaryImportImpact.remaining,
      estimatedRecordsRequired: targetScaleGapById.positions.primaryImportImpact.estimatedRecordsRequired,
      expectedResourceDelta: targetScaleGapById.positions.primaryImportImpact.expectedResourceDelta,
      closesTargetGapWhenValidated: targetScaleGapById.positions.primaryImportImpact.closesTargetGapWhenValidated,
      effect: targetScaleGapById.positions.primaryImportImpact.effect,
      verificationRoute: targetScaleGapById.positions.primaryImportImpact.verificationRoute,
    },
    {
      targetGapId: "positions",
      current: 3,
      target: 120,
      remaining: 117,
      estimatedRecordsRequired: 117,
      expectedResourceDelta: 117,
      closesTargetGapWhenValidated: true,
      effect: "validated_real_records_reduce_matching_target_gap",
      verificationRoute: "/api/v1/target-gaps/positions",
    },
  );
  assert.equal(targetScaleGapById.blind_initial_ratings.writeRoute, "/api/v1/ratings");
  assert.equal(targetScaleGapById.blind_initial_ratings.bulkImportRoute, "/api/v1/ratings/import-jsonl");
  assert.equal(targetScaleGapById.blind_initial_ratings.bulkImportWorkflowTemplateId, "rating-jsonl-import");
  assert.equal(targetScaleGapById.blind_initial_ratings.readbackRoute, "/api/v1/ratings");
  assert.equal(targetScaleGapById.blind_initial_ratings.submissionReadbackRoute, "/api/v1/ratings");
  assert.equal(targetScaleGapById.blind_initial_ratings.setupWriteRoute, "/api/v1/assignments");
  assert.equal(targetScaleGapById.blind_initial_ratings.setupReadbackRoute, "/api/v1/assignments");
  assert.equal(targetScaleGapById.blind_initial_ratings.setupBulkImportRoute, "/api/v1/assignments/import-jsonl");
  assert.equal(targetScaleGapById.blind_initial_ratings.targetGapReadbackItemRoute, "/api/v1/target-gaps/blind_initial_ratings");
  assert.equal(targetScaleGapById.blind_initial_ratings.workflowTemplateId, "assignment-record");
  assert.equal(targetScaleGapById.blind_initial_ratings.setupWorkflowTemplateId, "assignment-record");
  assert.equal(targetScaleGapById.blind_initial_ratings.setupBulkImportWorkflowTemplateId, "assignment-jsonl-import");
  assert.equal(targetScaleGapById.blind_initial_ratings.actorRole, "assigned_rater");
  assert.equal(targetScaleGapById.blind_initial_ratings.setupActorRole, "admin_or_operator");
  assert.equal(targetScaleGapById.blind_initial_ratings.primaryImportImpact.estimatedRecordsRequired, 1434);
  assert.equal(targetScaleGapById.blind_initial_ratings.primaryImportImpact.expectedResourceDelta, 1434);
  assert.equal(targetScaleGapById.blind_initial_ratings.primaryImportImpact.closesTargetGapWhenValidated, true);
  assert.equal(targetScaleGapById.blind_initial_ratings.setupImportImpact.estimatedRecordsRequired, 1434);
  assert.equal(targetScaleGapById.blind_initial_ratings.setupImportImpact.expectedResourceDelta, 0);
  assert.equal(targetScaleGapById.blind_initial_ratings.setupImportImpact.closesTargetGapWhenValidated, false);
  assert.equal(
    targetScaleGapById.blind_initial_ratings.setupImportImpact.effect,
    "assignment_setup_records_enable_assigned_rater_completion_but_do_not_close_target_gap",
  );
  assert.equal(targetScaleGapById.validation_core_all_items_raters.writeRoute, "/api/v1/validation-tranche-evidence");
  assert.equal(targetScaleGapById.validation_core_all_items_raters.workflowTemplateId, "validation-tranche-evidence");
  assert.equal(targetScaleGapById.validation_core_all_items_raters.primaryImportImpact.estimatedRecordsRequired, 1);
  assert.equal(targetScaleGapById.validation_core_all_items_raters.primaryImportImpact.expectedResourceDelta, 3);
  assert.equal(
    targetScaleGapById.validation_core_all_items_raters.primaryImportImpact.effect,
    "one_review_complete_validation_tranche_evidence_record_can_close_validation_gap",
  );
  assert.deepEqual(
    planById.target_scale_and_data_collection.actionItems.map((item) => [item.actionType, item.targetGapId, item.writeRoute, item.readbackRoute]),
    [
      ["collect_data", "positions", "/api/v1/intake/positions", "/api/v1/intake/positions"],
      ["collect_data", "critiques", "/api/v1/intake/critiques", "/api/v1/intake/critiques"],
      ["collect_data", "blind_initial_ratings", "/api/v1/ratings", "/api/v1/ratings"],
      ["collect_data", "gold_library_items", "/api/v1/gold-items", "/api/v1/gold-items"],
      ["collect_data", "validation_critiques", "/api/v1/validation-tranche-evidence", "/api/v1/validation-tranche-evidence"],
      ["collect_data", "validation_positions", "/api/v1/validation-tranche-evidence", "/api/v1/validation-tranche-evidence"],
      ["collect_data", "validation_core_all_items_raters", "/api/v1/validation-tranche-evidence", "/api/v1/validation-tranche-evidence"],
    ],
  );
  assert.deepEqual(
    planById.target_scale_and_data_collection.actionItems.map((item) => [
      item.targetGapId,
      item.submissionReadbackRoute,
      item.setupWriteRoute ?? null,
      item.setupBulkImportRoute ?? null,
      item.bulkImportRoute ?? null,
      item.targetGapReadbackRoute,
      item.targetGapReadbackItemRoute,
    ]),
    [
      ["positions", "/api/v1/intake/positions", null, null, "/api/v1/intake/positions/import-jsonl", "/api/v1/target-gaps", "/api/v1/target-gaps/positions"],
      ["critiques", "/api/v1/intake/critiques", null, null, "/api/v1/intake/critiques/import-jsonl", "/api/v1/target-gaps", "/api/v1/target-gaps/critiques"],
      [
        "blind_initial_ratings",
        "/api/v1/ratings",
        "/api/v1/assignments",
        "/api/v1/assignments/import-jsonl",
        "/api/v1/ratings/import-jsonl",
        "/api/v1/target-gaps",
        "/api/v1/target-gaps/blind_initial_ratings",
      ],
      ["gold_library_items", "/api/v1/gold-items", null, null, "/api/v1/gold-items/import-jsonl", "/api/v1/target-gaps", "/api/v1/target-gaps/gold_library_items"],
      [
        "validation_critiques",
        "/api/v1/validation-tranche-evidence",
        null,
        null,
        "/api/v1/validation-tranche-evidence/import-jsonl",
        "/api/v1/target-gaps",
        "/api/v1/target-gaps/validation_critiques",
      ],
      [
        "validation_positions",
        "/api/v1/validation-tranche-evidence",
        null,
        null,
        "/api/v1/validation-tranche-evidence/import-jsonl",
        "/api/v1/target-gaps",
        "/api/v1/target-gaps/validation_positions",
      ],
      [
        "validation_core_all_items_raters",
        "/api/v1/validation-tranche-evidence",
        null,
        null,
        "/api/v1/validation-tranche-evidence/import-jsonl",
        "/api/v1/target-gaps",
        "/api/v1/target-gaps/validation_core_all_items_raters",
      ],
    ],
  );
  const positionCollectAction = planById.target_scale_and_data_collection.actionItems.find((item) => item.targetGapId === "positions");
  assert.equal(positionCollectAction.targetDataTemplateReadbackRoute, "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions");
  assert.equal(positionCollectAction.dryRunImportRoute, "/api/v1/intake/positions/import-jsonl?dryRun=true");
  assert.equal(positionCollectAction.validateOnlyImportRoute, "/api/v1/intake/positions/import-jsonl?validateOnly=true");
  assert.equal(positionCollectAction.packageImportRoute, "/api/v1/target-gaps/import-jsonl-package");
  assert.equal(positionCollectAction.packageDryRunImportRoute, "/api/v1/target-gaps/import-jsonl-package?dryRun=true");
  assert.equal(positionCollectAction.packageValidateOnlyImportRoute, "/api/v1/target-gaps/import-jsonl-package?validateOnly=true");
  assert.equal(positionCollectAction.verificationRoute, "/api/v1/target-gaps/positions");
  assert.equal(
    positionCollectAction.targetDataExpandedTemplateReadbackRoute,
    "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&expand=remaining",
  );
  assert.equal(
    positionCollectAction.targetDataCappedExpandedTemplateReadbackRoute,
    "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&expand=remaining&maxExpandedRecords=100",
  );
  assert.deepEqual(positionCollectAction.templateReadbackRoutes, [
    positionCollectAction.targetDataTemplateReadbackRoute,
    positionCollectAction.targetDataExpandedTemplateReadbackRoute,
    positionCollectAction.targetDataCappedExpandedTemplateReadbackRoute,
  ]);
  const blindInitialRatingCollectAction = planById.target_scale_and_data_collection.actionItems.find((item) => item.targetGapId === "blind_initial_ratings");
  assert.equal(
    blindInitialRatingCollectAction.targetDataTemplateReadbackRoute,
    "/api/v1/target-gaps/import-jsonl-template?targetGapId=blind_initial_ratings",
  );
  assert.equal(blindInitialRatingCollectAction.dryRunImportRoute, "/api/v1/ratings/import-jsonl?dryRun=true");
  assert.equal(blindInitialRatingCollectAction.validateOnlyImportRoute, "/api/v1/ratings/import-jsonl?validateOnly=true");
  assert.equal(blindInitialRatingCollectAction.setupDryRunImportRoute, "/api/v1/assignments/import-jsonl?dryRun=true");
  assert.equal(blindInitialRatingCollectAction.setupValidateOnlyImportRoute, "/api/v1/assignments/import-jsonl?validateOnly=true");
  assert.equal(blindInitialRatingCollectAction.packageImportRoute, "/api/v1/target-gaps/import-jsonl-package");
  assert.equal(blindInitialRatingCollectAction.packageDryRunImportRoute, "/api/v1/target-gaps/import-jsonl-package?dryRun=true");
  assert.equal(blindInitialRatingCollectAction.packageValidateOnlyImportRoute, "/api/v1/target-gaps/import-jsonl-package?validateOnly=true");
  assert.equal(blindInitialRatingCollectAction.verificationRoute, "/api/v1/target-gaps/blind_initial_ratings");
  assert.equal(
    blindInitialRatingCollectAction.targetDataExpandedTemplateReadbackRoute,
    "/api/v1/target-gaps/import-jsonl-template?targetGapId=blind_initial_ratings&expand=remaining",
  );
  assert.equal(
    blindInitialRatingCollectAction.targetDataCappedExpandedTemplateReadbackRoute,
    "/api/v1/target-gaps/import-jsonl-template?targetGapId=blind_initial_ratings&expand=remaining&maxExpandedRecords=100",
  );
  assert.deepEqual(blindInitialRatingCollectAction.templateReadbackRoutes, [
    blindInitialRatingCollectAction.targetDataTemplateReadbackRoute,
    blindInitialRatingCollectAction.targetDataExpandedTemplateReadbackRoute,
    blindInitialRatingCollectAction.targetDataCappedExpandedTemplateReadbackRoute,
  ]);
  assert.equal(
    planById.target_scale_and_data_collection.actionItems.find((item) => item.targetGapId === "positions").importImpact.estimatedRecordsRequired,
    117,
  );
  assert.equal(
    planById.target_scale_and_data_collection.actionItems.find((item) => item.targetGapId === "blind_initial_ratings").setupImportImpact.expectedResourceDelta,
    0,
  );
  assert.equal(
    planById.target_scale_and_data_collection.actionItems.find((item) => item.targetGapId === "validation_critiques").importImpact.estimatedRecordsRequired,
    1,
  );
  assert.deepEqual(
    planById.target_scale_and_data_collection.reviewEvidencePointers
      .filter((pointer) => pointer.targetGapId)
      .map((pointer) => [pointer.targetGapId, pointer.readbackRoute, pointer.readbackItemRoute, pointer.submissionReadbackRoute]),
    [
      ["positions", "/api/v1/target-gaps", "/api/v1/target-gaps/positions", "/api/v1/intake/positions"],
      ["critiques", "/api/v1/target-gaps", "/api/v1/target-gaps/critiques", "/api/v1/intake/critiques"],
      ["blind_initial_ratings", "/api/v1/target-gaps", "/api/v1/target-gaps/blind_initial_ratings", "/api/v1/ratings"],
      ["gold_library_items", "/api/v1/target-gaps", "/api/v1/target-gaps/gold_library_items", "/api/v1/gold-items"],
      ["validation_critiques", "/api/v1/target-gaps", "/api/v1/target-gaps/validation_critiques", "/api/v1/validation-tranche-evidence"],
      ["validation_positions", "/api/v1/target-gaps", "/api/v1/target-gaps/validation_positions", "/api/v1/validation-tranche-evidence"],
      [
        "validation_core_all_items_raters",
        "/api/v1/target-gaps",
        "/api/v1/target-gaps/validation_core_all_items_raters",
        "/api/v1/validation-tranche-evidence",
      ],
    ],
  );
  assert.ok(planById.target_scale_and_data_collection.writeRoutes.includes("/api/v1/validation-tranche-evidence"));
  assert.ok(planById.target_scale_and_data_collection.readbackRoutes.includes("/api/v1/intake/positions"));
  assert.ok(planById.target_scale_and_data_collection.readbackRoutes.includes("/api/v1/intake/critiques"));
  assert.ok(planById.target_scale_and_data_collection.readbackRoutes.includes("/api/v1/assignments"));
  assert.ok(planById.target_scale_and_data_collection.readbackRoutes.includes("/api/v1/ratings"));
  assert.ok(planById.target_scale_and_data_collection.readbackRoutes.includes("/api/v1/rating-context-snapshots"));
  assert.ok(planById.target_scale_and_data_collection.readbackRoutes.includes("/api/v1/gold-items"));
  assert.ok(planById.target_scale_and_data_collection.readbackRoutes.includes("/api/v1/validation-tranche-evidence"));
  assert.deepEqual(planById.target_scale_and_data_collection.setupBulkImportRoutes, [
    "/api/v1/assignments/import-jsonl",
    "/api/v1/rating-context-snapshots/import-jsonl",
  ]);
  assert.deepEqual(planById.target_scale_and_data_collection.workflowTemplateIds, [
    "position-intake",
    "critique-intake",
    "assignment-record",
    "rating-context-snapshot",
    "gold-item",
    "validation-tranche-evidence",
  ]);
  assert.deepEqual(planById.target_scale_and_data_collection.setupBulkImportWorkflowTemplateIds, [
    "assignment-jsonl-import",
    "rating-context-snapshot-jsonl-import",
  ]);
  assert.ok(
    planById.target_scale_and_data_collection.notes.some((note) =>
      note.includes("assignment and rating-context-snapshot setup imports"),
    ),
  );
  assert.ok(planById.target_scale_and_data_collection.notes.some((note) => note.includes("completed blind ratings remain assigned-rater submissions")));
  assert.ok(planById.model_evaluation_submission_package.readbackRoutes.includes("/api/v1/model-improvement-policies"));
  assert.ok(planById.model_evaluation_submission_package.readbackRoutes.includes("/api/v1/model-improvement-runs"));
  assert.ok(planById.model_evaluation_submission_package.readbackRoutes.includes("/api/v1/model-provider-data-handling-policies"));
  assert.deepEqual(planById.model_evaluation_submission_package.bulkImportRoutes, ["/api/v1/operator-evidence/import-jsonl"]);
  assert.deepEqual(planById.model_evaluation_submission_package.bulkImportWorkflowTemplateIds, ["operator-evidence-package-jsonl-import"]);
  assert.equal(planById.model_evaluation_submission_package.submissionChecklist.length, 9);
  assert.equal(
    planById.model_evaluation_submission_package.submissionChecklist.find((item) => item.artifactKind === "leaderboard").readbackRoute,
    "/api/v1/leaderboards",
  );
  assert.equal(
    planById.model_evaluation_submission_package.actionItems.find((item) => item.artifactKind === "evaluation_run").sourceEvidenceId,
    releaseReport.modelEvaluationArtifactEvidence.id,
  );
  assert.equal(
    planById.model_evaluation_submission_package.submissionChecklist.find((item) => item.artifactKind === "model_inference_config").readbackRoute,
    "/api/v1/model-inference-configs",
  );
  assert.equal(
    planById.model_evaluation_submission_package.submissionChecklist.find((item) => item.artifactKind === "model_run_environment").readbackRoute,
    "/api/v1/model-run-environments",
  );
  assert.equal(
    planById.model_evaluation_submission_package.actionItems.find((item) => item.artifactKind === "model_inference_config").writeRoute,
    "/api/v1/model-inference-configs",
  );
  assert.equal(
    planById.model_evaluation_submission_package.actionItems.find((item) => item.artifactKind === "model_inference_config").bulkImportRoute,
    "/api/v1/operator-evidence/import-jsonl",
  );
  assert.equal(planById.model_evaluation_submission_package.actionItems.find((item) => item.artifactKind === "evaluation_run").bulkImportRoute, null);
  assert.equal(
    planById.model_evaluation_submission_package.actionItems.find((item) => item.artifactKind === "model_run_environment").workflowTemplateId,
    "model-run-environment",
  );
  assert.deepEqual(
    planById.model_evaluation_submission_package.actionItems
      .filter((item) => item.writeRoute.includes("{id}"))
      .map((item) => [item.artifactKind, item.setupWriteRoute, item.setupReadbackRoute, item.setupWorkflowTemplateId, item.setupActorRole]),
    [
      ["model_evaluation_predictions", "/api/v1/evaluations/run", "/api/v1/evaluations", "evaluation-run", "admin_or_operator"],
      ["calibration_run", "/api/v1/evaluations/run", "/api/v1/evaluations", "evaluation-run", "admin_or_operator"],
      ["model_failure_audit", "/api/v1/evaluations/run", "/api/v1/evaluations", "evaluation-run", "admin_or_operator"],
    ],
  );
  assert.deepEqual(planById.model_evaluation_submission_package.workflowTemplateIds, [
    "model-improvement-policy",
    "model-improvement-run",
    "evaluation-run",
    "model-inference-config",
    "model-run-environment",
    "model-evaluation-prediction",
    "calibration-run",
    "leaderboard",
    "failure-audit",
    "model-provider-data-handling-policy",
  ]);
  assert.ok(planById.model_evaluation_reproducibility.writeRoutes.includes("/api/v1/model-inference-configs"));
  assert.ok(planById.model_evaluation_reproducibility.readbackRoutes.includes("/api/v1/evaluations"));
  assert.ok(planById.model_evaluation_reproducibility.readbackRoutes.includes("/api/v1/leaderboards"));
  assert.ok(planById.model_evaluation_reproducibility.readbackRoutes.includes("/api/v1/model-run-environments"));
  assert.ok(planById.model_evaluation_reproducibility.readbackRoutes.includes("/api/v1/prompt-templates"));
  assert.ok(planById.model_evaluation_reproducibility.readbackRoutes.includes("/api/v1/parser-configs"));
  assert.ok(planById.model_evaluation_reproducibility.readbackRoutes.includes("/api/v1/release-report-sections"));
  assert.ok(
    planById.model_evaluation_reproducibility.submissionChecklist.some(
      (item) =>
        item.artifactKind === "leaderboard_model_run_provenance" &&
        item.submissionStatus === "review_required" &&
        item.blockingFieldCount > 0,
    ),
  );
  assert.equal(
    planById.model_evaluation_reproducibility.actionItems.find(
      (item) => item.artifactKind === "submitted_evaluation_artifacts_bound_to_release",
    ).workflowTemplateId,
    "evaluation-run",
  );
  assert.equal(
    planById.model_evaluation_reproducibility.actionItems.find(
      (item) => item.artifactKind === "submitted_evaluation_artifacts_bound_to_release",
    ).readbackRoute,
    "/api/v1/evaluations",
  );
  assert.equal(
    planById.model_evaluation_reproducibility.actionItems.find((item) => item.artifactKind === "leaderboard_model_run_provenance")
      .workflowTemplateId,
    "leaderboard",
  );
  assert.equal(
    planById.model_evaluation_reproducibility.actionItems.find((item) => item.artifactKind === "leaderboard_model_run_provenance")
      .readbackRoute,
    "/api/v1/leaderboards",
  );
  assert.deepEqual(
    planById.model_evaluation_reproducibility.actionItems
      .filter((item) => item.actionType === "submit_artifact")
      .filter((item) => item.readbackRoute === "/api/release/report")
      .map((item) => item.id),
    [],
  );
  const leaderboardReviewAction = planById.model_evaluation_reproducibility.actionItems.find(
    (item) => item.actionType === "review_artifact" && item.artifactId === "leaderboard_model_run_provenance",
  );
  assert.equal(leaderboardReviewAction.readbackRoute, "/api/v1/release-report-sections");
  assert.equal(
    leaderboardReviewAction.readbackItemRoute,
    "/api/v1/release-report-sections/model-evaluation-reproducibility-checklist-october-2026-demo",
  );
  assert.deepEqual(leaderboardReviewAction.relatedSubmitActionIds, [
    "model_evaluation_reproducibility:submit:leaderboard_model_run_provenance",
  ]);
  assert.equal(leaderboardReviewAction.relatedSubmitActions[0].artifactKind, "leaderboard_model_run_provenance");
  assert.equal(leaderboardReviewAction.relatedSubmitActions[0].bulkImportRoute, "/api/v1/operator-evidence/import-jsonl");
  assert.deepEqual(leaderboardReviewAction.relatedSubmitActions[0].templateReadbackRoutes, [
    "/api/v1/operator-evidence/import-jsonl-template?checklistRowId=model_evaluation_reproducibility&artifactKind=leaderboard_model_run_provenance",
  ]);
  assert.match(leaderboardReviewAction.resolutionEvidence, /Submit or repair the related action/);
  const leaderboardReviewPointer = planById.model_evaluation_reproducibility.reviewEvidencePointers.find(
    (pointer) => pointer.reason === "leaderboardReport.modelRunProvenance.releaseUseStatus",
  );
  assert.equal(leaderboardReviewPointer.readbackRoute, "/api/v1/release-report-sections");
  assert.equal(leaderboardReviewPointer.readbackScope, "release_report_section");
  assert.deepEqual(leaderboardReviewPointer.relatedSubmitActionIds, [
    "model_evaluation_reproducibility:submit:leaderboard_model_run_provenance",
  ]);
  const leaderboardReviewSummary = planById.model_evaluation_reproducibility.reviewArtifactSummaries.find(
    (summary) => summary.artifactId === "leaderboard_model_run_provenance",
  );
  assert.deepEqual(leaderboardReviewSummary.relatedSubmitActionIds, [
    "model_evaluation_reproducibility:submit:leaderboard_model_run_provenance",
  ]);
  const runEnvironmentReviewAction = planById.model_evaluation_reproducibility.actionItems.find(
    (item) => item.actionType === "review_artifact" && item.artifactId === "submitted_run_inference_environment_provenance",
  );
  assert.deepEqual(runEnvironmentReviewAction.relatedSubmitActionIds, [
    "model_evaluation_reproducibility:submit:model_inference_config",
    "model_evaluation_reproducibility:submit:model_run_environment",
  ]);
  assert.equal(
    planById.model_evaluation_reproducibility.actionItems.find((item) => item.artifactKind === "model_inference_config").writeRoute,
    "/api/v1/model-inference-configs",
  );
  assert.equal(
    planById.model_evaluation_reproducibility.actionItems.find((item) => item.artifactKind === "model_run_environment").workflowTemplateId,
    "model-run-environment",
  );
  assert.equal(
    planById.model_evaluation_reproducibility.submissionChecklist.find((item) => item.artifactKind === "model_inference_config").readbackRoute,
    "/api/v1/model-inference-configs",
  );
  assert.equal(
    planById.model_evaluation_reproducibility.submissionChecklist.find((item) => item.artifactKind === "model_run_environment").readbackRoute,
    "/api/v1/model-run-environments",
  );
  assert.ok(
    planById.model_evaluation_reproducibility.submissionChecklist.some(
      (item) => item.artifactKind === "metric_uncertainty_and_directionality" && item.submissionStatus === "submitted_complete",
    ),
  );
  assert.ok(
    planById.model_evaluation_reproducibility.reviewEvidencePointers.some(
      (pointer) =>
        pointer.artifactType === "model_evaluation_reproducibility_checklist" &&
        pointer.artifactId === "submitted_evaluation_artifacts_bound_to_release" &&
        pointer.readbackRoute === "/api/v1/release-report-sections" &&
        pointer.readbackItemRoute === "/api/v1/release-report-sections/model-evaluation-reproducibility-checklist-october-2026-demo",
    ),
  );
  assert.deepEqual(planById.model_evaluation_reproducibility.workflowTemplateIds, [
    "model-run-reproducibility-policy",
    "model-inference-config",
    "model-run-environment",
    "prompt-template",
    "parser-config",
  ]);
  assert.ok(planById.discussion_and_adjudication_workflows.readbackRoutes.includes("/api/v1/discussion-comments"));
  assert.deepEqual(planById.discussion_and_adjudication_workflows.workflowTemplateIds, [
    "discussion",
    "discussion-thread",
    "discussion-comment",
    "discussion-revision-proposal",
    "post-lock-discussion-session",
    "adjudication",
    "adjudication-review-session",
    "adjudication-memo",
    "adjudication-finalization",
  ]);
  assert.deepEqual(
    planById.discussion_and_adjudication_workflows.submissionChecklist.map((item) => [
      item.artifactKind,
      item.submissionStatus,
      item.readbackRoute,
      item.blockingFields,
      item.sourceEvidenceId,
    ]),
    [
      ["discussion", "not_submitted", "/api/v1/discussions", ["submittedArtifactId"], releaseReport.discussionAdjudicationWorkflowEvidence.id],
      ["discussion_thread", "not_submitted", "/api/v1/discussion-threads", ["submittedArtifactId"], releaseReport.discussionAdjudicationWorkflowEvidence.id],
      ["discussion_comment", "not_submitted", "/api/v1/discussion-comments", ["submittedArtifactId"], releaseReport.discussionAdjudicationWorkflowEvidence.id],
      [
        "discussion_revision_proposal",
        "not_submitted",
        "/api/v1/discussion-revision-proposals",
        ["submittedArtifactId"],
        releaseReport.discussionAdjudicationWorkflowEvidence.id,
      ],
      [
        "post_lock_discussion_session",
        "not_submitted",
        "/api/v1/post-lock-discussion-sessions",
        ["submittedArtifactId"],
        releaseReport.discussionAdjudicationWorkflowEvidence.id,
      ],
      ["adjudication", "not_submitted", "/api/v1/adjudications", ["submittedArtifactId"], releaseReport.discussionAdjudicationWorkflowEvidence.id],
      [
        "adjudication_review_session",
        "not_submitted",
        "/api/v1/adjudication-review-sessions",
        ["submittedArtifactId"],
        releaseReport.discussionAdjudicationWorkflowEvidence.id,
      ],
      ["adjudication_memo", "not_submitted", "/api/v1/adjudication-memos", ["submittedArtifactId"], releaseReport.discussionAdjudicationWorkflowEvidence.id],
      [
        "adjudication_finalization",
        "not_submitted",
        "/api/v1/adjudication-finalizations",
        ["submittedArtifactId"],
        releaseReport.discussionAdjudicationWorkflowEvidence.id,
      ],
    ],
  );
  const discussionSubmissionChecklistItems = planById.discussion_and_adjudication_workflows.submissionChecklist;
  const discussionSubmission = discussionSubmissionChecklistItems.find((item) => item.artifactKind === "discussion");
  assert.equal(
    discussionSubmission.payloadTemplateReadbackRoute,
    "/api/v1/operator-action-items/payload-template?checklistRowId=discussion_and_adjudication_workflows&actionType=submit_artifact&artifactKind=discussion",
  );
  assert.deepEqual(discussionSubmission.templateReadbackRoutes, [discussionSubmission.payloadTemplateReadbackRoute]);
  const discussionThreadSubmission = discussionSubmissionChecklistItems.find((item) => item.artifactKind === "discussion_thread");
  assert.equal(
    discussionThreadSubmission.operatorEvidenceTemplateReadbackRoute,
    "/api/v1/operator-evidence/import-jsonl-template?checklistRowId=discussion_and_adjudication_workflows&artifactKind=discussion_thread",
  );
  assert.equal(discussionThreadSubmission.payloadTemplateReadbackRoute, undefined);
  const discussionCommentSubmission = discussionSubmissionChecklistItems.find((item) => item.artifactKind === "discussion_comment");
  assert.ok(
    discussionCommentSubmission.templateReadbackRoutes.includes(
      "/api/v1/operator-evidence/import-jsonl-template?checklistRowId=discussion_and_adjudication_workflows&artifactKind=discussion_comment",
    ),
  );
  assert.ok(
    discussionCommentSubmission.templateReadbackRoutes.includes(
      "/api/v1/operator-action-items/payload-template?checklistRowId=discussion_and_adjudication_workflows&actionType=submit_artifact&artifactKind=discussion_comment",
    ),
  );
  const finalizationSubmission = discussionSubmissionChecklistItems.find((item) => item.artifactKind === "adjudication_finalization");
  assert.equal(
    finalizationSubmission.payloadTemplateReadbackRoute,
    "/api/v1/operator-action-items/payload-template?checklistRowId=discussion_and_adjudication_workflows&actionType=submit_artifact&artifactKind=adjudication_finalization",
  );
  assert.deepEqual(
    planById.discussion_and_adjudication_workflows.actionItems.map((item) => [
      item.actionType,
      item.artifactKind,
      item.writeRoute,
      item.workflowTemplateId,
    ]),
    [
      ["submit_artifact", "discussion", "/api/v1/discussions", "discussion"],
      ["submit_artifact", "discussion_thread", "/api/v1/discussion-threads", "discussion-thread"],
      ["submit_artifact", "discussion_comment", "/api/v1/discussions/{id}/comments", "discussion-comment"],
      ["submit_artifact", "discussion_revision_proposal", "/api/v1/discussions/{id}/revision-proposals", "discussion-revision-proposal"],
      ["submit_artifact", "post_lock_discussion_session", "/api/v1/discussions/{id}/post-lock-sessions", "post-lock-discussion-session"],
      ["submit_artifact", "adjudication", "/api/v1/adjudications", "adjudication"],
      ["submit_artifact", "adjudication_review_session", "/api/v1/adjudication-review-sessions", "adjudication-review-session"],
      ["submit_artifact", "adjudication_memo", "/api/v1/adjudication-memos", "adjudication-memo"],
      ["submit_artifact", "adjudication_finalization", "/api/v1/adjudications/{id}/finalize", "adjudication-finalization"],
    ],
  );
  assert.deepEqual(
    planById.discussion_and_adjudication_workflows.actionItems
      .filter((item) => item.writeRoute.includes("{id}"))
      .map((item) => [item.artifactKind, item.setupWriteRoute, item.setupReadbackRoute, item.setupWorkflowTemplateId, item.setupActorRole]),
    [
      ["discussion_comment", "/api/v1/discussions", "/api/v1/discussions", "discussion", "admin_or_operator"],
      ["discussion_revision_proposal", "/api/v1/discussions", "/api/v1/discussions", "discussion", "admin_or_operator"],
      ["post_lock_discussion_session", "/api/v1/discussions", "/api/v1/discussions", "discussion", "admin_or_operator"],
      ["adjudication_finalization", "/api/v1/adjudications", "/api/v1/adjudications", "adjudication", "admin_or_operator"],
    ],
  );
  assert.equal(planById.discussion_and_adjudication_workflows.actionItems.find((item) => item.artifactKind === "discussion").bulkImportRoute, null);
  assert.equal(
    planById.discussion_and_adjudication_workflows.actionItems.find((item) => item.artifactKind === "discussion").bulkImportWorkflowTemplateId,
    null,
  );
  assert.equal(
    planById.discussion_and_adjudication_workflows.actionItems.find((item) => item.artifactKind === "discussion_comment").bulkImportRoute,
    "/api/v1/operator-evidence/import-jsonl",
  );
  assert.equal(
    planById.discussion_and_adjudication_workflows.actionItems.find((item) => item.artifactKind === "discussion_comment")
      .bulkImportWorkflowTemplateId,
    "operator-evidence-package-jsonl-import",
  );
  assert.equal(
    planById.discussion_and_adjudication_workflows.actionItems.find((item) => item.artifactKind === "adjudication_finalization").bulkImportRoute,
    null,
  );
  assert.equal(
    planById.discussion_and_adjudication_workflows.actionItems.find((item) => item.artifactKind === "adjudication_finalization")
      .bulkImportWorkflowTemplateId,
    null,
  );
  assert.ok(planById.rubric_practice_and_certification_pack.readbackRoutes.includes("/api/v1/gold-items"));
  assert.ok(planById.rubric_practice_and_certification_pack.readbackRoutes.includes("/api/v1/certification-records"));
  assert.ok(planById.validation_hidden_benchmark_and_claims.requiredSubmissions.includes("human-ceiling run"));
  assert.ok(planById.validation_hidden_benchmark_and_claims.requiredSubmissions.includes("authorized artifact probe diagnostics"));
  assert.ok(planById.validation_hidden_benchmark_and_claims.writeRoutes.includes("/api/v1/human-ceiling-runs"));
  assert.ok(planById.validation_hidden_benchmark_and_claims.writeRoutes.includes("/api/v1/artifact-probes/run"));
  assert.ok(planById.validation_hidden_benchmark_and_claims.readbackRoutes.includes("/api/v1/benchmark-split-members"));
  assert.ok(planById.validation_hidden_benchmark_and_claims.readbackRoutes.includes("/api/v1/artifact-probes"));
  assert.ok(planById.validation_hidden_benchmark_and_claims.readbackRoutes.includes("/api/v1/benchmark-freeze-reports"));
  assert.equal(planById.validation_hidden_benchmark_and_claims.readbackRoutes.includes("/api/benchmark/freeze-report"), false);
  assert.ok(
    planById.validation_hidden_benchmark_and_claims.reviewEvidencePointers.some(
      (pointer) =>
        pointer.reason === "hiddenBenchmarkFreeze:not_ready_for_release_freeze" &&
        pointer.readbackRoute === "/api/v1/benchmark-freeze-reports" &&
        pointer.readbackScope === "workflow_collection",
    ),
  );
  assert.ok(planById.validation_hidden_benchmark_and_claims.readbackRoutes.includes("/api/v1/human-ceiling-runs"));
  assert.ok(planById.validation_hidden_benchmark_and_claims.readbackRoutes.includes("/api/v1/benchmark-submissions"));
  assert.ok(planById.validation_hidden_benchmark_and_claims.readbackRoutes.includes("/api/v1/comparability-claims"));
  assert.deepEqual(planById.validation_hidden_benchmark_and_claims.workflowTemplateIds, [
    "validation-tranche-evidence",
    "benchmark-split-member",
    "artifact-probe",
    "benchmark-freeze-report",
    "benchmark-refresh-policy",
    "human-ceiling-run",
    "benchmark-submission-policy",
    "benchmark-submission",
    "comparability-tier-policy",
    "comparability-claim",
    "release-erratum-disclosure-policy",
    "release-erratum",
  ]);
  assert.deepEqual(planById.validation_hidden_benchmark_and_claims.evidenceIds, [
    releaseReport.validationDesign.id,
    releaseReport.hiddenBenchmarkFreeze.id,
    releaseReport.releaseClaimWarnings.id,
  ]);
  assert.deepEqual(planById.rubric_practice_and_certification_pack.blockingTargetGaps.map((gap) => gap.id), ["gold_library_items"]);
  assert.deepEqual(planById.validation_hidden_benchmark_and_claims.blockingTargetGaps.map((gap) => gap.id), [
    "validation_critiques",
    "validation_positions",
    "validation_core_all_items_raters",
  ]);
  assert.ok(planById.validation_hidden_benchmark_and_claims.workflowTemplateIds.includes("human-ceiling-run"));
  assert.equal(planById.rubric_practice_and_certification_pack.blockingTargetGaps[0].writeRoute, "/api/v1/gold-items");
  assert.equal(planById.rubric_practice_and_certification_pack.blockingTargetGaps[0].workflowTemplateId, "gold-item");
  assert.equal(planById.validation_hidden_benchmark_and_claims.blockingTargetGaps[0].readbackRoute, "/api/v1/validation-tranche-evidence");
  assert.deepEqual(
    planById.validation_hidden_benchmark_and_claims.actionItems
      .filter((item) => item.actionType !== "review_report_section")
      .map((item) => [
        item.actionType,
        item.targetGapId ?? item.artifactKind,
        item.writeRoute,
        item.readbackRoute,
        item.workflowTemplateId,
      ]),
    [
      [
        "collect_data",
        "validation_critiques",
        "/api/v1/validation-tranche-evidence",
        "/api/v1/validation-tranche-evidence",
        "validation-tranche-evidence",
      ],
      [
        "collect_data",
        "validation_positions",
        "/api/v1/validation-tranche-evidence",
        "/api/v1/validation-tranche-evidence",
        "validation-tranche-evidence",
      ],
      [
        "collect_data",
        "validation_core_all_items_raters",
        "/api/v1/validation-tranche-evidence",
        "/api/v1/validation-tranche-evidence",
        "validation-tranche-evidence",
      ],
      [
        "submit_artifact",
        "benchmark_freeze_report",
        "/api/v1/benchmark/candidates/freeze",
        "/api/v1/benchmark-freeze-reports",
        "benchmark-freeze-report",
      ],
      [
        "submit_artifact",
        "artifact_probe",
        "/api/v1/artifact-probes/run",
        "/api/v1/artifact-probes",
        "artifact-probe",
      ],
    ],
  );
  const benchmarkFreezeAction = planById.validation_hidden_benchmark_and_claims.actionItems.find(
    (item) => item.actionType === "submit_artifact" && item.artifactKind === "benchmark_freeze_report",
  );
  assert.equal(benchmarkFreezeAction.preconditionStatus, "data_collection_required_before_action");
  assert.deepEqual(benchmarkFreezeAction.blockedByTargetGapIds, [
    "validation_critiques",
    "validation_positions",
    "validation_core_all_items_raters",
  ]);
  assert.equal(benchmarkFreezeAction.blockingTargetGapSummaries.length, 3);
  assert.equal(benchmarkFreezeAction.blockingTargetGapSummaries[0].importImpact.estimatedRecordsRequired, 1);
  assert.match(benchmarkFreezeAction.dataDependencyCompletionEvidence, /Resolve the listed target gaps/);
  const benchmarkFreezeReviewAction = planById.validation_hidden_benchmark_and_claims.actionItems.find(
    (item) => item.actionType === "review_report_section" && item.reason === "hiddenBenchmarkFreeze.artifact_balance:insufficient_seed_benchmark",
  );
  assert.deepEqual(benchmarkFreezeReviewAction.relatedSubmitActionIds, [
    "validation_hidden_benchmark_and_claims:submit:benchmark_freeze_report:hiddenBenchmarkFreeze_not_ready_for_release_freeze",
  ]);
  assert.equal(benchmarkFreezeReviewAction.relatedSubmitActions[0].writeRoute, "/api/v1/benchmark/candidates/freeze");
  assert.deepEqual(benchmarkFreezeReviewAction.relatedSubmitActions[0].templateReadbackRoutes, [
    "/api/v1/operator-action-items/payload-template?checklistRowId=validation_hidden_benchmark_and_claims&actionType=submit_artifact&artifactKind=benchmark_freeze_report",
  ]);
  const benchmarkFreezeReviewPointer = planById.validation_hidden_benchmark_and_claims.reviewEvidencePointers.find(
    (pointer) => pointer.reason === "hiddenBenchmarkFreeze:not_ready_for_release_freeze",
  );
  assert.deepEqual(benchmarkFreezeReviewPointer.relatedSubmitActionIds, [
    "validation_hidden_benchmark_and_claims:submit:benchmark_freeze_report:hiddenBenchmarkFreeze_not_ready_for_release_freeze",
  ]);
  const artifactProbeReviewPointer = planById.validation_hidden_benchmark_and_claims.reviewEvidencePointers.find(
    (pointer) => pointer.reason === "hiddenBenchmarkFreeze.artifact_probe_diagnostics:not_run_documented",
  );
  assert.deepEqual(artifactProbeReviewPointer.relatedSubmitActionIds, [
    "validation_hidden_benchmark_and_claims:submit:artifact_probe:hiddenBenchmarkFreeze.artifact_probe_diagnostics_not_run_documented",
  ]);
  assert.equal(artifactProbeReviewPointer.relatedSubmitActions[0].writeRoute, "/api/v1/artifact-probes/run");
  assert.deepEqual(
    planById.validation_hidden_benchmark_and_claims.actionItems
      .filter((item) => item.actionType === "review_report_section")
      .map((item) => [item.reason, item.readbackRoute]),
    [
      ["hiddenBenchmarkFreeze.metric_family_eligibility:pointwise_only", "/api/v1/benchmark-freeze-reports"],
      ["hiddenBenchmarkFreeze.pairwise_margin_distribution:pointwise_only", "/api/v1/benchmark-freeze-reports"],
      ["hiddenBenchmarkFreeze.artifact_balance:insufficient_seed_benchmark", "/api/v1/benchmark-freeze-reports"],
      ["releaseClaimWarnings:release_claims_limited_by_errata_or_schedule", "/api/v1/release-report-sections"],
    ],
  );
  const releaseClaimWarningReviewAction = planById.validation_hidden_benchmark_and_claims.actionItems.find(
    (item) => item.actionType === "review_report_section" && item.reason === "releaseClaimWarnings:release_claims_limited_by_errata_or_schedule",
  );
  assert.equal(
    releaseClaimWarningReviewAction.readbackItemRoute,
    `/api/v1/release-report-sections/${releaseReport.releaseClaimWarnings.id}`,
  );
  assert.equal(releaseClaimWarningReviewAction.preconditionStatus, "data_collection_required_before_action");
  assert.deepEqual(releaseClaimWarningReviewAction.blockedByTargetGapIds, [
    "validation_critiques",
    "validation_positions",
    "validation_core_all_items_raters",
  ]);
  assert.ok(
    planById.validation_hidden_benchmark_and_claims.actionItems
      .filter((item) => item.actionType === "review_report_section")
      .every((item) => item.preconditionStatus === "data_collection_required_before_action"),
  );
  assert.ok(planById.target_scale_and_data_collection.notes[0].includes("data-collection work"));
});

test("operator plan maps interaction/practice review rows to existing readback routes", () => {
  const completeOptions = completeInteractionWorkflowFixtures();
  const releaseReport = buildOctoberReleaseReport(
    "interaction-practice-plan-review",
    null,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      ...completeOptions,
      raterLearningPlans: [
        {
          ...completeOptions.raterLearningPlans[0],
          raterDashboardPolicyId: "rater-dashboard-policy-old",
        },
      ],
    },
  );
  const interactionRow = releaseReport.octoberCompletionChecklist.rows.find((row) => row.id === "interaction_and_practice_workflows");
  const interactionPlan = releaseReport.operatorEvidenceSubmissionPlan.rows.find(
    (row) => row.checklistRowId === "interaction_and_practice_workflows",
  );

  assert.equal(interactionRow.status, "review_required");
  assert.ok(interactionRow.reviewReasons.length > 0);
  assert.ok(interactionPlan.requiredSubmissions.includes("rater dashboard policy, rater learning plans, and calibration feedback"));
  assert.ok(interactionPlan.writeRoutes.includes("/api/v1/screens/{id}/feature-parity-check"));
  assert.ok(interactionPlan.readbackRoutes.includes("/api/v1/rater-learning-plans"));
  assert.ok(interactionPlan.readbackRoutes.includes("/api/v1/adjudication-review-sessions"));
  assert.ok(interactionPlan.readbackRoutes.includes("/api/v1/screen-feature-parity-checks"));
  assert.ok(interactionPlan.readbackRoutes.includes("/api/v1/simplified-copy-previews"));
  assert.ok(
    interactionPlan.reviewEvidencePointers.some(
      (pointer) =>
        pointer.artifactType === "rater_learning_plan" &&
        pointer.artifactId === completeOptions.raterLearningPlans[0].id &&
        pointer.reason === "raterDashboardPolicyId" &&
        pointer.readbackRoute === "/api/v1/rater-learning-plans" &&
        pointer.readbackItemRoute === `/api/v1/rater-learning-plans/${completeOptions.raterLearningPlans[0].id}`,
    ),
  );
  assert.deepEqual(interactionPlan.reviewArtifactSummaries, [
    {
      artifactType: "rater_learning_plan",
      artifactId: completeOptions.raterLearningPlans[0].id,
      sourceEvidenceId: releaseReport.interactionWorkflowEvidence.id,
      readbackRoute: "/api/v1/rater-learning-plans",
      readbackItemRoute: `/api/v1/rater-learning-plans/${completeOptions.raterLearningPlans[0].id}`,
      reasonCount: 1,
      reasons: ["raterDashboardPolicyId"],
      reasonsTruncated: false,
    },
  ]);
  assert.deepEqual(interactionPlan.actionItems, [
    {
      id: `interaction_and_practice_workflows:review:rater_learning_plan:${completeOptions.raterLearningPlans[0].id}`,
      checklistRowId: "interaction_and_practice_workflows",
      actionType: "review_artifact",
      label: `rater_learning_plan:${completeOptions.raterLearningPlans[0].id}`,
      status: "review_required",
      artifactType: "rater_learning_plan",
      artifactId: completeOptions.raterLearningPlans[0].id,
      sourceEvidenceId: releaseReport.interactionWorkflowEvidence.id,
      reasonCount: 1,
      reasons: ["raterDashboardPolicyId"],
      reasonsTruncated: false,
      readbackRoute: "/api/v1/rater-learning-plans",
      readbackItemRoute: `/api/v1/rater-learning-plans/${completeOptions.raterLearningPlans[0].id}`,
      actorRole: "admin_or_operator",
      completionEvidence: "reviewArtifactSummaries no longer includes this artifact in /api/release/report",
      executionStatus: "ready_to_review_evidence",
      executionStatusReason: "This action is a readback/review step; inspect the linked artifact or report section before replacing evidence.",
      templateCoverageStatus: "template_coverage_not_required",
      templateCoverageRoutes: [],
      templateCoverageKinds: [],
      preflightCoverageStatus: "preflight_coverage_not_required",
      preflightCoverageRoutes: [],
      preflightCoverageKinds: [],
      preflightCoveragePolicy: "Review-only actions do not require append preflight coverage.",
      governanceCoverageStatus: "governance_coverage_not_required",
      governanceCoverageKinds: [],
      governanceCoverageRoutes: [],
      governanceCoveragePolicy: "Review-only actions do not append evidence and do not require policy-action or phase-lane coverage.",
      policyGated: false,
      policyActionKind: null,
      phaseGateLaneKind: null,
      setupPolicyGated: false,
      setupPolicyActionKind: null,
      setupPhaseGateLaneKind: null,
      sequence: 1,
    },
  ]);
  assert.ok(interactionPlan.workflowTemplateIds.includes("rater-dashboard-policy"));
  assert.ok(interactionPlan.notes.some((note) => note.includes("Assignment self-screen")));
});

test("release-report checklist evidence ids resolve to report sections", () => {
  const releaseReport = buildOctoberReleaseReport();
  const reportIds = new Set();
  const evidenceReferences = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value.id === "string") reportIds.add(value.id);
    if (Array.isArray(value.evidenceIds)) evidenceReferences.push(...value.evidenceIds);
    Object.values(value).forEach(visit);
  };
  visit(releaseReport);

  assert.equal(releaseReport.targetGaps.id, "target-gaps-october-2026-demo");
  assert.equal(releaseReport.targetGaps.releaseUseStatus, releaseReport.currentStatus);
  assert.equal(releaseReport.targetGaps.rows.length, 7);
  assert.equal(releaseReport.targetGaps.rows.every((row) => reportIds.has(row.sourceEvidenceId)), true);
  assert.equal(
    releaseReport.octoberCompletionChecklist.rows.find((row) => row.id === "target_scale_and_data_collection").evidenceIds[0],
    releaseReport.targetGaps.id,
  );
  assert.deepEqual(
    evidenceReferences.filter((id) => !reportIds.has(id)),
    [],
  );
});

test("item text view parity report binds ratings and model predictions to frozen hashes", () => {
  const report = buildItemTextViewParityReport("release-test", seedRatings, [fullRubricEvaluationRun, overallOnlyEvaluationRun], positions, critiques);
  assert.equal(report.counts.ratingRows, seedRatings.length);
  assert.equal(report.counts.frozenRatingTextVersionRows, seedRatings.length);
  assert.equal(report.counts.evaluationPredictionRows, fullRubricEvaluationRun.predictions.length + overallOnlyEvaluationRun.predictions.length);
  assert.equal(report.counts.evaluationRowsWithViewParity, report.counts.evaluationPredictionRows);
  assert.equal(report.counts.textViewSensitiveRows, 0);
  assert.equal(report.releaseUseStatus, "item_text_versions_frozen_with_human_model_view_parity");
  const fullRubricRow = report.evaluationRows.find((row) => row.predictionId === "pred-ai-base");
  assert.equal(fullRubricRow.positionTextVersionId, "ptv-ai-prior-v1");
  assert.equal(fullRubricRow.modelVisiblePositionRenderedHash, fullRubricRow.targetRaterVisiblePositionRenderedHash);

  const mismatchedRun = structuredClone(fullRubricEvaluationRun);
  mismatchedRun.predictions[0].modelVisiblePositionRenderedHash = "sha256:changed-model-visible-text";
  const mismatchReport = buildItemTextViewParityReport("release-test", seedRatings, [mismatchedRun], positions, critiques);
  assert.equal(mismatchReport.counts.textViewSensitiveRows, 1);
  assert.equal(mismatchReport.textViewSensitiveRows[0].parityStatus, "text_view_sensitive_hash_mismatch");
  assert.equal(mismatchReport.releaseUseStatus, "item_text_view_parity_review_required");
});

test("adjudication memo audit preserves ambiguity decisions and minority rationales", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-adjudication-audit",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildAdjudicationMemoAuditReport("release-test", snapshot, seedRatings, positions, critiques);
  assert.equal(report.counts.memoCount, 2);
  assert.equal(report.counts.releaseCriticalMemoCount, 2);
  assert.equal(report.counts.incompleteReleaseCriticalAmbiguityMemoCount, 0);
  assert.equal(report.counts.bottomLineDependentItemCount, 1);
  assert.equal(report.counts.minorityRationaleCount, 1);
  assert.equal(report.counts.clearlyUnsatisfactoryImprecisionItemCount, 1);
  assert.equal(report.counts.obfuscatedOrMaskedFallacyItemCount, 1);
  assert.equal(report.releaseUseStatus, "adjudication_limitations_preserved");
  const votingStyle = report.memoRows.find((row) => row.itemId === "pos-voting::crit-voting-style");
  assert.equal(votingStyle.worstPlausibleInterpretationConsidered.includes("strategic-manipulation"), true);
  assert.equal(votingStyle.critiqueRefutesInterpretationsRecorded, true);
  assert.equal(votingStyle.clearlyUnsatisfactoryImprecision, true);
  const mindZombie = report.bottomLineDependentRows[0];
  assert.equal(mindZombie.itemId, "pos-mind::crit-mind-zombie");
  assert.equal(mindZombie.minorityRationales[0].stance, "functionalist_minority");
  assert.ok(report.taxonomyCounts.contentious_bottom_line_premise);
});

test("post-discussion disagreement report classifies residual high spread instead of hiding it", () => {
  const pairs = critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id }));
  const seedSnapshot = createLabelSnapshot("snapshot-post-discussion-seed", "release-test", seedRatings, pairs);
  const seedReport = buildPostDiscussionDisagreementReport("release-test", seedSnapshot, seedRatings, positions, critiques);
  assert.equal(seedReport.counts.releaseCriticalItemCount, 3);
  assert.equal(seedReport.counts.highSpreadItemCount, 0);
  assert.equal(seedReport.counts.insufficientFinalOverlapItemCount, 2);
  assert.equal(seedReport.disagreementThresholdPolicyId, "disagreement-threshold-policy-release-test");
  assert.equal(seedReport.disagreementThresholdPolicyReleaseUseStatus, "seed_disagreement_threshold_policy");
  assert.deepEqual(seedReport.thresholdsApplied, disagreementThresholds);
  assert.equal(seedReport.policy.maxSpreadThreshold, 0.3);
  assert.equal(seedReport.releaseUseStatus, "post_discussion_spread_check_thin_no_high_spread_observed");

  const divergentExpertCheck = {
    ...seedRatings.find((rating) => rating.id === "rating-mind-zombie-a"),
    id: "rating-mind-zombie-divergent-expert-check",
    raterId: "rater-b",
    raterTier: "phd",
    kind: "expert_check",
    scores: {
      centrality: 0.2,
      strength: 0.28,
      correctness: 0.36,
      clarity: 0.82,
      dead_weight: 0.32,
      single_issue: 0.78,
      overall: 0.2,
    },
    rationale: "Synthetic divergent post-discussion check used to prove residual spread classification.",
    flags: { contentiousBottomLineDependence: true },
  };
  const ratings = [...seedRatings, divergentExpertCheck];
  const snapshot = createLabelSnapshot("snapshot-post-discussion-high", "release-test", ratings, pairs);
  const report = buildPostDiscussionDisagreementReport("release-test", snapshot, ratings, positions, critiques);
  assert.equal(report.counts.highSpreadItemCount, 1);
  assert.equal(report.counts.classifiedHighSpreadItemCount, 1);
  assert.equal(report.counts.missingMemoHighSpreadItemCount, 0);
  assert.equal(report.releaseUseStatus, "post_discussion_disagreement_classified");
  const row = report.highSpreadRows[0];
  assert.equal(row.itemId, "pos-mind::crit-mind-zombie");
  assert.equal(row.classification, "high_post_discussion_spread_classified_with_memo");
  assert.equal(row.maxFinalSpreadDimension, "centrality");
  assert.equal(row.maxFinalSpread > 0.3, true);
  assert.equal(row.disagreementThresholdPolicyId, "disagreement-threshold-policy-release-test");
  assert.deepEqual(row.thresholdsApplied, disagreementThresholds);
  assert.deepEqual(row.adjudicationMemoIds, ["memo-mind-zombie"]);
  assert.ok(row.disagreementTaxonomy.includes("contentious_bottom_line_premise"));
});

test("release report uses submitted disagreement threshold policies for post-discussion evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-disagreement-threshold-policy-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      disagreementThresholdPolicies: [disagreementThresholdPolicy("disagreement-threshold-policy-release-test-submitted")],
    },
  );
  assert.equal(report.disagreementThresholdPolicyEvidence.releaseUseStatus, "submitted_disagreement_threshold_policy_active");
  assert.equal(report.disagreementThresholdPolicyEvidence.activePolicyId, "disagreement-threshold-policy-release-test-submitted");
  assert.deepEqual(report.disagreementThresholdPolicyEvidence.activePolicy.thresholds, disagreementThresholds);
  assert.equal(report.postDiscussionDisagreement.disagreementThresholdPolicyId, "disagreement-threshold-policy-release-test-submitted");
  assert.equal(report.postDiscussionDisagreement.disagreementThresholdPolicyReleaseUseStatus, "submitted_disagreement_threshold_policy_active");
  assert.deepEqual(report.postDiscussionDisagreement.thresholdsApplied, disagreementThresholds);
  assert.equal(report.workflowPolicyArtifacts.disagreementThresholdPolicies.length, 1);

  const driftedReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      disagreementThresholdPolicies: [
        {
          ...disagreementThresholdPolicy("disagreement-threshold-policy-drifted"),
          thresholds: { ...disagreementThresholds, postDiscussionMaxSpreadTarget: 0.45 },
        },
      ],
    },
  );
  assert.equal(driftedReport.disagreementThresholdPolicyEvidence.releaseUseStatus, "submitted_disagreement_threshold_policy_review_required");
  assert.equal(driftedReport.disagreementThresholdPolicyEvidence.activePolicyId, "disagreement-threshold-policy-release-test");
  assert.equal(driftedReport.disagreementThresholdPolicyEvidence.reviewRows[0].reviewReasons.includes("thresholds"), true);
  assert.equal(driftedReport.postDiscussionDisagreement.disagreementThresholdPolicyId, "disagreement-threshold-policy-release-test");
});

test("rater composition conflict report exposes release-critical dominance and conflicts", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-rater-composition",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const report = buildRaterCompositionConflictReport("release-test", snapshot, seedRatings, positions, raterProfiles);
  assert.equal(report.counts.includedRaterCount, 4);
  assert.equal(report.counts.releaseCriticalItemCount, 3);
  assert.equal(report.counts.conflictFlagCount, 0);
  assert.equal(report.counts.topicExpertiseMissingItemCount, 1);
  assert.equal(report.counts.raterTierDiversityMissingItemCount, 2);
  assert.equal(report.counts.currentTopicSpecialistQualificationCount, 1);
  assert.equal(report.counts.singleRaterDominatedReleaseCriticalItemCount, 2);
  assert.deepEqual(report.topicExpertiseMissingRows.map((row) => row.itemId), ["pos-voting::crit-voting-style"]);
  assert.equal(report.policy.requiredReleaseCriticalTierDiversityMin, 2);
  assert.deepEqual(
    report.tierDiversityMissingRows.map((row) => [row.itemId, row.raterTierDiversity, row.requiredRaterTierDiversityMin]),
    [
      ["pos-mind::crit-mind-zombie", ["expert"], 2],
      ["pos-voting::crit-voting-style", ["undergraduate"], 2],
    ],
  );
  assert.deepEqual(report.releaseCriticalRaterTierDistribution, { undergraduate: 1, expert: 1 });
  assert.deepEqual(
    report.singleRaterDominatedReleaseCriticalRows.map((row) => row.itemId).sort(),
    ["pos-mind::crit-mind-zombie", "pos-voting::crit-voting-style"],
  );
  assert.equal(report.releaseUseStatus, "rater_composition_limitations_disclosed");

  const conflictedProfiles = raterProfiles.map((profile) =>
    profile.id === "rater-c"
      ? {
          ...profile,
          conflictDisclosures: ["selected_validation_critique_before_rating"],
          priorExposure: {
            ...profile.priorExposure,
            selectedCritiqueIds: ["crit-voting-style"],
          },
        }
      : profile,
  );
  const conflicted = buildRaterCompositionConflictReport("release-test", snapshot, seedRatings, positions, conflictedProfiles);
  assert.equal(conflicted.counts.conflictFlagCount, 1);
  assert.equal(conflicted.conflictRows[0].conflictType, "selected_critique");
  assert.equal(conflicted.conflictRows[0].releaseBlocking, true);
  assert.equal(conflicted.releaseUseStatus, "rater_conflict_review_required");

  const votingStyleRating = seedRatings.find((rating) => rating.id === "rating-voting-style-a");
  const scopedSnapshot = createLabelSnapshot(
    "snapshot-rater-composition-full-conflicts",
    "release-test",
    [votingStyleRating],
    [{ positionId: "pos-voting", critiqueId: "crit-voting-style" }],
  );
  const scopedPositions = positions.map((position) =>
    position.id === "pos-voting"
      ? {
          ...position,
          sourceId: "source-voting-coursework",
          sourceFamilyId: "source-family-voting-coursework",
          adaptationClusterId: "adaptation-family-voting-coursework",
        }
      : position,
  );
  const scopedCritiques = critiques.map((critique) =>
    critique.id === "crit-voting-style"
      ? {
          ...critique,
          nearDuplicateClusterId: "near-duplicate-voting-style",
          sourceAnchorExampleId: "public-example-voting-style",
        }
      : critique,
  );
  const fullyConflictedProfiles = raterProfiles.map((profile) =>
    profile.id === "rater-c"
      ? {
          ...profile,
          priorExposure: {
            ...profile.priorExposure,
            authoredCritiqueIds: ["crit-voting-style"],
            selectedPositionIds: ["pos-voting"],
            selectedItemIds: ["pos-voting::crit-voting-style"],
            submittedSourceIds: ["source-voting-coursework"],
            generatedCritiqueIds: ["crit-voting-style"],
            editedItemIds: ["pos-voting::crit-voting-style"],
            adaptationClusterIds: ["adaptation-family-voting-coursework"],
            sourceFamilyIds: ["source-family-voting-coursework"],
            nearDuplicateClusterIds: ["near-duplicate-voting-style"],
            publicExampleIds: ["public-example-voting-style"],
            priorPositionClusterIds: ["cluster-voting"],
          },
        }
      : profile,
  );
  const fullyConflicted = buildRaterCompositionConflictReport(
    "release-test",
    scopedSnapshot,
    [votingStyleRating],
    scopedPositions,
    fullyConflictedProfiles,
    { critiqueList: scopedCritiques },
  );
  assert.equal(fullyConflicted.releaseUseStatus, "rater_conflict_review_required");
  assert.deepEqual(
    fullyConflicted.conflictRows.map((row) => row.conflictType).sort(),
    [
      "adaptation_family_exposure",
      "authored_critique",
      "edited_item",
      "generated_critique",
      "item_selection_exposure",
      "near_duplicate_exposure",
      "prior_exposure",
      "public_example_exposure",
      "selected_position",
      "source_family_exposure",
      "submitted_source",
    ],
  );
  assert.equal(fullyConflicted.conflictRows.every((row) => row.releaseBlocking), true);
});

test("release report requires evidence-backed submitted rater profiles for release-used ratings", () => {
  const releaseUsedRating = {
    ...seedRatings.find((rating) => rating.id === "rating-voting-bullet-a"),
    id: "rating-profiled-rater-release-critical",
    raterId: "profiled-rater",
    raterTier: "graduate",
  };
  const ratings = [releaseUsedRating];
  const snapshot = createLabelSnapshot(
    "snapshot-rater-profile-evidence",
    "release-test",
    ratings,
    [{ positionId: "pos-voting", critiqueId: "crit-voting-bullet" }],
    "initial_only",
    positions,
  );
  const completeReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    ratings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      raters: [
        {
          id: "profiled-rater",
          tier: "graduate",
          topicExpertise: { politics: "strong" },
          certificationStatus: "certified_for_live_blind_rating",
          activeReliabilityWeightModelId: "uniform-v1-with-sensitivity",
          conflictDisclosures: ["no_known_conflict"],
        },
      ],
      certificationThresholdPolicies: [certificationThresholdPolicy("certification-threshold-policy-release-test")],
      certificationRecords: [
        {
          id: "certification-record-profiled-rater",
          raterId: "profiled-rater",
          packVersion: "cert-tier-zero-2026-10",
          certificationThresholdPolicyId: "certification-threshold-policy-release-test",
          rubricVersion: "lmca-app-f-2026-10",
          goldItemIds: ["gold-ai-selectivity"],
          duplicateItemIds: ["gold-low-clarity-obfuscation"],
          hardAmbiguityItemIds: ["gold-priced-in-objection"],
          protectedSplitConflictCheck: "training_exposure_only_no_hidden_or_validation_overlap",
          trainingExposureAcknowledged: true,
          customWeightedLoss: 0.11,
          pairwiseError: 0.08,
          duplicateInconsistency: 0.04,
          tierUnlocked: "graduate_live_rating",
        },
      ],
      raterDataConsents: [
        {
          id: "rater-data-consent-profiled-rater",
          raterId: "profiled-rater",
          noticeVersion: "rater-data-use-v1",
          dataCategoriesCovered: raterDataCategories,
          useScopesAcknowledged: raterDataUseScopes,
          dataProfileVisible: true,
          publicArtifactsDeidentifiedByDefault: true,
          identifiableAccessRestriction: "approved operational or research role access only",
          privateLearningDataExcludedFromReleaseAndTraining: true,
          consentedAt: "2026-10-01T00:04:00.000Z",
        },
      ],
      raterReliabilityWeightModels: [
        {
          id: "reliability-weight-model-profiled-rater",
          reliabilityWeightModelId: "uniform-v1-with-sensitivity",
        },
      ],
    },
  );
  assert.equal(completeReport.raterProfileEvidence.releaseUseStatus, "submitted_rater_profile_evidence_complete");
  assert.equal(completeReport.raterProfileEvidence.counts.submittedRaterProfileCount, 1);
  assert.equal(completeReport.raterProfileEvidence.counts.completeReleaseUsedSubmittedRaterProfileCount, 1);
  const completeRow = completeReport.raterProfileEvidence.rows.find((row) => row.raterId === "profiled-rater");
  assert.equal(completeRow.profileSource, "submitted_workflow_rater");
  assert.equal(completeRow.roleEvidenceStatus, "role_evidence_backed");
  assert.equal(completeRow.dataConsentStatus, "rater_data_consent_complete");
  assert.equal(completeRow.reliabilityModelStatus, "submitted_reliability_model_reference_resolved");
  assert.deepEqual(completeRow.topicExpertiseMissingFamilies, []);
  const compositionRow = completeReport.raterCompositionConflicts.raterRows.find((row) => row.raterId === "profiled-rater");
  assert.equal(compositionRow.certificationStatus, "certified_for_live_blind_rating");
  assert.deepEqual(compositionRow.topicExpertise, ["politics"]);

  const incompleteReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    ratings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      raters: [
        {
          id: "profiled-rater",
          tier: "graduate",
          topicExpertise: { ai_safety: "working" },
          certificationStatus: "self_attested_interest_only",
          activeReliabilityWeightModelId: "missing-weight-model",
          conflictDisclosures: ["no_known_conflict"],
        },
      ],
    },
  );
  assert.equal(incompleteReport.raterProfileEvidence.releaseUseStatus, "rater_profile_evidence_review_required");
  const incompleteRow = incompleteReport.raterProfileEvidence.rows.find((row) => row.raterId === "profiled-rater");
  assert.ok(incompleteRow.reviewReasons.includes("qualificationOrCertificationEvidence"));
  assert.ok(incompleteRow.reviewReasons.includes("raterDataConsent"));
  assert.ok(incompleteRow.reviewReasons.includes("releaseCriticalTopicExpertise:politics"));
  assert.ok(incompleteRow.reviewReasons.includes("activeReliabilityWeightModelId:submittedModelMissing"));
});

test("release report links submitted discussion threads through adjudication finalization evidence", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-discussion-adjudication-workflow",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const completeOptions = {
    discussions: [
      {
        id: "discussion-complete",
        itemId: "pos-ai-prior::crit-ai-base-rate",
        disagreementTaxonomy: ["strength_centrality_allocation"],
      },
    ],
    discussionThreads: [
      {
        id: "discussion-thread-complete",
        itemId: "pos-ai-prior::crit-ai-base-rate",
        positionId: "pos-ai-prior",
        critiqueId: "crit-ai-base-rate",
        issueType: "strength_centrality_allocation",
        disagreementTaxonomyCodes: ["strength_centrality_allocation"],
        status: "open_for_expert_adjudication",
        createdAt: "2026-10-01T00:30:00.000Z",
        updatedAt: "2026-10-01T00:31:00.000Z",
      },
    ],
    discussionComments: [
      {
        id: "discussion-comment-complete",
        discussionThreadId: "discussion-thread-complete",
        authorId: "expert-1",
        commentText: "Object-level target-mapping point preserved.",
        objectLevelStatus: "object_level_point_preserved",
        timestamp: "2026-10-01T00:31:30.000Z",
      },
    ],
    discussionRevisionProposals: [
      {
        id: "discussion-revision-proposal-complete",
        discussionThreadId: "discussion-thread-complete",
        proposedBy: "expert-1",
        ratingIdPrior: "rating-ai-base-a",
        revisionReasonCode: "overlooked_object_level_point",
        revisionRationale: "The locked initial rating missed the target-mapping point.",
        originalRatingPreservation: "original_rating_preserved_append_only",
        timestamp: "2026-10-01T00:31:50.000Z",
      },
    ],
    postLockDiscussionSessions: [
      {
        id: "post-lock-discussion-complete",
        discussionThreadId: "discussion-thread-complete",
        itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
        participantIds: ["demo-rater", "expert-1"],
        participantRoles: ["graduate_rater", "expert_adjudicator"],
        initialRatingLockCheck: "all_initial_ratings_locked",
        identityStagingPolicy: "role_neutral_handles_first",
        identityMaskPhaseStatus: "completed_before_role_reveal",
        roleRevealPolicy: "moderator_exception_logged",
        moderatorAdjudicatorVisibilityExceptions: "adjudicator can inspect pre-read notes only after initial locks",
        visibleMaterialPolicy: "peer_rationales_visible_post_lock_only",
        peerScoreRationaleVisibilityTimestamp: "2026-10-01T00:31:30.000Z",
        objectLevelCommentRecords: ["discussion-comment-complete"],
        spanReferenceLinks: ["rationale-span-complete"],
        overlookedPointFlags: ["target_mapping_updated"],
        revisionProposalIds: ["discussion-revision-proposal-complete"],
        majorityPressureWarningState: "displayed",
        transcriptArtifact: "discussion-transcript-complete",
        writtenFollowUpStatus: "not_required",
        discussionStatus: "object_level_discussion_complete",
        timestamp: "2026-10-01T00:31:30.000Z",
      },
    ],
    adjudications: [
      {
        id: "adjudication-complete",
        discussionThreadId: "discussion-thread-complete",
        itemId: "pos-ai-prior::crit-ai-base-rate",
        adjudicatorIds: ["expert-1"],
        decisionStatus: "memo_pending_finalization",
      },
    ],
    adjudicationReviewSessions: [
      {
        id: "adjudication-review-complete",
        discussionThreadId: "discussion-thread-complete",
        rationaleSpanOverlayRefs: ["rationale-span-complete"],
        revisionTimelineRefs: ["revision-timeline-complete"],
        targetMapIds: ["interpretation-target-complete"],
        minorityRationaleFields: ["minority-strength-reading"],
        adjudicatorIds: ["expert-1"],
        finalizationStatus: "ready_for_memo",
      },
    ],
    adjudicationMemos: [
      {
        id: "adjudication-memo-complete",
        discussionThreadId: "discussion-thread-complete",
        positionId: "pos-ai-prior",
        critiqueId: "crit-ai-base-rate",
        plausibleInterpretationsConsidered: ["central_base_rate_attack"],
        disagreementTaxonomyCodes: ["strength_centrality_allocation"],
        adjudicatorIds: ["expert-1"],
        timestamp: "2026-10-01T00:33:00.000Z",
      },
    ],
    adjudicationFinalizations: [
      {
        id: "adjudication-finalization-complete",
        adjudicationId: "adjudication-complete",
        memoId: "adjudication-memo-complete",
        finalizationStatus: "finalized_for_release_candidate",
        finalizedBy: "expert-1",
        timestamp: "2026-10-01T00:34:00.000Z",
      },
    ],
  };
  const report = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    completeOptions,
  );
  assert.equal(report.discussionAdjudicationWorkflowEvidence.releaseUseStatus, "submitted_discussion_adjudication_workflow_complete");
  assert.equal(
    report.octoberCompletionChecklist.rows.find((row) => row.id === "discussion_and_adjudication_workflows").status,
    "complete",
  );
  assert.equal(report.discussionAdjudicationWorkflowEvidence.counts.submittedDiscussionThreadCount, 1);
  assert.equal(report.discussionAdjudicationWorkflowEvidence.counts.completeDiscussionThreadCount, 1);
  assert.equal(report.discussionAdjudicationWorkflowEvidence.counts.submittedDiscussionCommentCount, 1);
  assert.equal(report.discussionAdjudicationWorkflowEvidence.counts.submittedDiscussionRevisionProposalCount, 1);
  assert.equal(
    report.discussionAdjudicationWorkflowEvidence.postLockDiscussionSessionRows.at(-1).identityStagingPolicy,
    "role_neutral_handles_first",
  );
  assert.equal(
    report.discussionAdjudicationWorkflowEvidence.postLockDiscussionSessionRows.at(-1).identityMaskPhaseStatus,
    "completed_before_role_reveal",
  );
  assert.equal(report.discussionAdjudicationWorkflowEvidence.postLockDiscussionSessionRows.at(-1).roleRevealPolicy, "moderator_exception_logged");
  assert.deepEqual(report.discussionAdjudicationWorkflowEvidence.coverageRows[0].reviewReasons, []);
  assert.deepEqual(report.discussionAdjudicationWorkflowEvidence.coverageRows[0].objectLevelCommentIds, ["discussion-comment-complete"]);
  assert.deepEqual(report.discussionAdjudicationWorkflowEvidence.coverageRows[0].revisionProposalIds, ["discussion-revision-proposal-complete"]);
  assert.deepEqual(report.discussionAdjudicationWorkflowEvidence.coverageRows[0].adjudicationFinalizationIds, ["adjudication-finalization-complete"]);

  const unsafeIdentityReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      ...completeOptions,
      postLockDiscussionSessions: [
        {
          ...completeOptions.postLockDiscussionSessions[0],
          id: "post-lock-discussion-unsafe-identity",
          identityStagingPolicy: "real_names_visible_immediately",
          identityMaskPhaseStatus: "skipped",
          roleRevealPolicy: "seniority_visible_before_comments",
          moderatorAdjudicatorVisibilityExceptions: "moderator can inspect notes",
          visibleMaterialPolicy: "peer_rationales_visible_before_lock",
          majorityPressureWarningState: "hidden",
        },
      ],
    },
  );
  assert.equal(unsafeIdentityReport.discussionAdjudicationWorkflowEvidence.releaseUseStatus, "discussion_adjudication_workflow_review_required");
  assert.ok(
    unsafeIdentityReport.discussionAdjudicationWorkflowEvidence.reviewSections.some(
      (section) => section.artifactType === "post_lock_discussion_session" && section.reason === "identityStagingPolicy",
    ),
  );
  assert.ok(
    unsafeIdentityReport.discussionAdjudicationWorkflowEvidence.reviewSections.some(
      (section) => section.artifactType === "post_lock_discussion_session" && section.reason === "identityMaskPhaseStatus",
    ),
  );
  assert.ok(
    unsafeIdentityReport.discussionAdjudicationWorkflowEvidence.reviewSections.some(
      (section) => section.artifactType === "post_lock_discussion_session" && section.reason === "roleRevealPolicy",
    ),
  );

  const malformedAdjudicationArtifactReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      ...completeOptions,
      adjudicationReviewSessions: [
        {
          ...completeOptions.adjudicationReviewSessions[0],
          id: "adjudication-review-malformed",
          rationaleSpanOverlayRefs: [],
          revisionTimelineRefs: [],
          targetMapIds: [],
          minorityRationaleFields: [],
          adjudicatorIds: [],
          finalizationStatus: "",
        },
      ],
      adjudicationMemos: [
        {
          ...completeOptions.adjudicationMemos[0],
          id: "adjudication-memo-malformed",
          plausibleInterpretationsConsidered: [],
          disagreementTaxonomyCodes: [],
          adjudicatorIds: [],
          timestamp: "",
        },
      ],
      adjudicationFinalizations: [
        {
          ...completeOptions.adjudicationFinalizations[0],
          id: "adjudication-finalization-malformed",
          finalizationStatus: "memo_draft",
          finalizedBy: "",
          timestamp: "",
        },
      ],
    },
  );
  assert.equal(
    malformedAdjudicationArtifactReport.discussionAdjudicationWorkflowEvidence.releaseUseStatus,
    "discussion_adjudication_workflow_review_required",
  );
  assert.ok(
    malformedAdjudicationArtifactReport.discussionAdjudicationWorkflowEvidence.reviewSections.some(
      (section) => section.artifactType === "adjudication_review_session" && section.reason === "rationaleSpanOverlayRefs",
    ),
  );
  assert.ok(
    malformedAdjudicationArtifactReport.discussionAdjudicationWorkflowEvidence.reviewSections.some(
      (section) => section.artifactType === "adjudication_memo" && section.reason === "plausibleInterpretationsConsidered",
    ),
  );
  assert.ok(
    malformedAdjudicationArtifactReport.discussionAdjudicationWorkflowEvidence.reviewSections.some(
      (section) => section.artifactType === "adjudication_finalization" && section.reason === "finalizationStatus",
    ),
  );
  const malformedAdjudicationPlan = malformedAdjudicationArtifactReport.operatorEvidenceSubmissionPlan.rows.find(
    (row) => row.checklistRowId === "discussion_and_adjudication_workflows",
  );
  assert.ok(
    malformedAdjudicationPlan.reviewEvidencePointers.some(
      (pointer) =>
        pointer.artifactType === "adjudication_finalization" &&
        pointer.artifactId === "adjudication-finalization-malformed" &&
        pointer.reason === "finalizationStatus" &&
        pointer.readbackRoute === "/api/v1/adjudication-finalizations" &&
        pointer.readbackItemRoute === "/api/v1/adjudication-finalizations/adjudication-finalization-malformed",
    ),
  );
  assert.ok(
    malformedAdjudicationPlan.reviewArtifactSummaries.some(
      (summary) =>
        summary.artifactType === "adjudication_finalization" &&
        summary.artifactId === "adjudication-finalization-malformed" &&
        summary.readbackItemRoute === "/api/v1/adjudication-finalizations/adjudication-finalization-malformed" &&
        summary.reasonCount === 3 &&
        summary.reasons.includes("finalizationStatus"),
    ),
  );
  assert.ok(
    malformedAdjudicationPlan.reviewArtifactSummaries.some(
      (summary) =>
        summary.artifactType === "adjudication_review_session" &&
        summary.artifactId === "adjudication-review-malformed" &&
        summary.reasonCount > 1,
    ),
  );

  const incompleteReport = buildOctoberReleaseReport(
    "release-test",
    snapshot,
    seedRatings,
    positions,
    critiques,
    seedCertificationAttempts,
    seedBenchmarkExposureEvents,
    postLockSourceStyleAudits,
    {
      discussions: completeOptions.discussions,
      discussionThreads: completeOptions.discussionThreads,
    },
  );
  assert.equal(incompleteReport.discussionAdjudicationWorkflowEvidence.releaseUseStatus, "discussion_adjudication_workflow_review_required");
  assert.ok(
    incompleteReport.discussionAdjudicationWorkflowEvidence.reviewSections.some(
      (section) => section.artifactId === "discussion-thread-complete" && section.reason === "postLockDiscussionSession",
    ),
  );
  assert.ok(
    incompleteReport.discussionAdjudicationWorkflowEvidence.reviewSections.some(
      (section) => section.artifactId === "discussion-thread-complete" && section.reason === "adjudicationFinalization",
    ),
  );
});

test("LMCA comparison report separates scale, source, rater, target, and anchor baselines", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-comparison",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const corpusManifest = buildCorpusCompositionManifest("release-test", positions, critiques, seedRatings);
  const metricEligibility = buildMetricFamilyEligibilityManifest("release-test", snapshot, positions, critiques);
  const validationDesign = buildValidationDesignReport(seedRatings, positions, critiques);
  const comparison = buildLmcaComparisonReport({ releaseId: "release-test", corpusManifest, metricEligibility, validationDesign, labelSnapshot: snapshot });
  assert.deepEqual(
    Object.fromEntries(comparison.sourceScaleComparison.map((row) => [row.metric, row.lmcaValue])),
    {
      rated_critiques: 951,
      ratings_ignoring_revisions: 1458,
      model_written_critiques: 478,
      positions_with_at_least_one_critique: 442,
      positions_with_at_least_two_critiques: 279,
    },
  );
  assert.equal(comparison.sourceScaleComparison.find((row) => row.metric === "rated_critiques").releaseValue, 5);
  assert.equal(comparison.sourceScaleComparison.find((row) => row.metric === "rated_critiques").lmcaValue, 951);
  assert.deepEqual(
    Object.fromEntries(comparison.positionSourceComparison.map((row) => [row.sourceCategory, row.lmcaCount])),
    {
      hand_written: 27,
      book_adapted: 168,
      coursework_derived: 41,
      magazine_blog_forum_derived: 108,
      primarily_model_written: 68,
      other_dataset_adapted: 28,
    },
  );
  assert.deepEqual(comparison.knownOtherDatasetSubsources, { DebateBench: 18, VivesDebate: 6 });
  assert.equal(comparison.positionSourceComparison.find((row) => row.sourceCategory === "magazine_blog_forum_derived").status, "missing_from_seed");
  assert.deepEqual(
    comparison.topicFamilyComparison.map((row) => row.topicFamily),
    ["ai_safety", "decision_theory", "normative_ethics", "philosophy_of_mind", "politics", "miscellaneous"],
  );
  assert.equal(comparison.topicFamilyComparison.find((row) => row.topicFamily === "decision_theory").status, "missing_from_seed");
  assert.equal(comparison.raterCompositionComparison.status, "seed_rater_composition_not_comparable");
  assert.deepEqual(
    comparison.raterContributionComparison
      .filter((row) => row.sourceTable === "LMCA Table 1")
      .map((row) => [row.rater, row.lmcaCount, row.countingRule]),
    [
      ["Emery Cooper", 946, "ratings_ignoring_revisions"],
      ["Caspar Oesterheld", 211, "ratings_ignoring_revisions"],
      ["Alexander Kastner", 130, "ratings_ignoring_revisions"],
      ["Linh Chi Nguyen", 103, "ratings_ignoring_revisions"],
      ["Lukas Gloor", 43, "ratings_ignoring_revisions"],
      ["Lukas Finnveden", 25, "ratings_ignoring_revisions"],
    ],
  );
  assert.deepEqual(comparison.raterCompositionComparison.comparisonTable, comparison.raterContributionComparison);
  assert.deepEqual(
    Object.fromEntries(comparison.modelDenominatorComparison.map((row) => [row.metric, row.lmcaValue])),
    {
      weighted_pairwise_positions: 255,
      weighted_pairwise_critique_pairs: 856,
      custom_metric_dialogues: 933,
    },
  );
  assert.equal(comparison.modelDenominatorComparison.find((row) => row.metric === "custom_metric_dialogues").lmcaValue, 933);
  assert.equal(comparison.modelScoreAnchorComparison.anchorCount, 7);
  assert.equal(comparison.modelScoreAnchorComparison.lowerIsBetter, true);
  assert.equal(comparison.modelScoreAnchorComparison.denominators.weightedPairwiseTable5.critiquePairs, 856);
  assert.equal(comparison.modelScoreAnchorComparison.targetLabelRegimes.weightedPairwiseTable5, "Emery Cooper ratings");
  assert.equal(comparison.modelScoreAnchorComparison.uncertaintyIntervalPolicy.nominalLevel, 0.95);
  assert.equal(comparison.modelScoreAnchorComparison.weightedPairwiseTable5[0].lowerIsBetter, true);
  assert.equal(comparison.modelScoreAnchorComparison.weightedPairwiseTable5[0].targetLabelRegime, "Emery Cooper ratings");
  assert.equal(comparison.targetLabelComparison.status, "lmca_style_not_target_identical");
  assert.equal(comparison.validationHumanCeilingComparison.status, "numeric_baselines_declared_but_seed_validation_thin");
  assert.equal(
    comparison.sourceScaleComparison.find((row) => row.metric === "rated_critiques").readbackItemRoute,
    "/api/v1/lmca-comparison/lmca-comparison%3Asource-scale%3Arated_critiques",
  );
  assert.ok(
    comparison.sourceScaleComparison
      .find((row) => row.metric === "rated_critiques")
      .routes.includes("/api/v1/target-gaps/current-package-manifest"),
  );
  assert.ok(
    comparison.positionSourceComparison
      .find((row) => row.sourceCategory === "magazine_blog_forum_derived")
      .remediationRoutes.includes("/api/v1/metaphilosophy/source-workbench-template?templateKind=source_card_create"),
  );
  assert.ok(
    comparison.topicFamilyComparison
      .find((row) => row.topicFamily === "decision_theory")
      .remediationRoutes.includes("/api/v1/rater-profile-evidence?topicFamily=decision_theory"),
  );
  assert.ok(
    comparison.raterContributionComparison
      .find((row) => row.rater === "Emery Cooper")
      .remediationRoutes.includes("/api/v1/rater-qualification-records"),
  );
  assert.ok(
    comparison.modelDenominatorComparison
      .find((row) => row.metric === "weighted_pairwise_critique_pairs")
      .remediationRoutes.includes("/api/v1/operator-evidence/package-manifest"),
  );
  assert.ok(comparison.targetLabelComparison.rows[0].evidenceReadbackRoutes.includes("/api/v1/primary-rater-anchor-policies"));
  assert.ok(comparison.modelScoreAnchorComparison.weightedPairwiseTable5[0].remediationRoutes.includes("/api/v1/evaluations/run"));
  assert.ok(comparison.validationHumanCeilingComparison.remediationRoutes.includes("/api/v1/validation-tranche-evidence/import-jsonl"));
});

function round(value) {
  return Math.round(value * 1000) / 1000;
}
