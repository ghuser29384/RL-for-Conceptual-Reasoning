import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign as signCrypto } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";

import vercelHealthHandler from "../api/health.mjs";
import {
  authenticateRequest,
  createAuditEvent,
  createApiContext,
  createAuthConfig,
  createBenchmarkExposureEvent,
  createCertificationAuditEvent,
  createSourceStyleAuditEvent,
  demoUsers,
  handleApiRequest,
  signSessionToken,
  validateBenchmarkExposurePayload,
  validateCertificationAttemptPayload,
  validatePostLockSourceStyleAuditPayload,
  validateRatingActor,
  validateRatingPayload,
  validateSourceStyleAuditActor,
  verifySessionToken,
} from "../src/server.mjs";

const uxSimplificationSurfaces = [
  "rating",
  "practice",
  "calibration",
  "consent",
  "withdrawal",
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

const uxScreenControlKeys = [...uxNoFeatureLossKeys, "post_lock_feedback"];

const workflowStateTransitionFixtures = [
  ["assignment", "assignment-state-release", "draft", "locked_initial_rating"],
  ["rating", "rating-state-release", "draft", "locked_initial"],
  ["discussion_thread", "discussion-state-release", "eligible_after_initial_locks", "object_level_discussion"],
  ["post_lock_discussion_session", "post-lock-session-state-release", "object_level_discussion", "revision_window"],
  ["adjudication_memo", "adjudication-state-release", "revision_window", "adjudication_finalized"],
  ["verification_record", "verification-state-release", "in_progress", "verified"],
  ["label_snapshot", "label-snapshot-state-release", "candidate", "frozen"],
  ["pairwise_comparison_snapshot", "pairwise-state-release", "candidate", "frozen"],
  ["evaluation_run", "evaluation-state-release", "contamination_checks_passed", "run"],
  ["training_export", "training-export-state-release", "contamination_checks_passed", "run"],
  ["release_version", "release-state-release", "gate_checks_passed", "frozen"],
].map(([entityType, entityId, priorState, requestedNextState], index) => ({
  id: `workflow-state-transition-${index + 1}`,
  entityType,
  entityId,
  priorState,
  requestedNextState,
  acceptedNextState: requestedNextState,
  actorId: "demo-admin",
  actorRole: "admin",
  guardChecks: ["backend_guard_passed"],
  failedGuardReasons: [],
  lockFreezeArtifactIds: ["release-config-manifest-october-2026-demo"],
  sourceTagProtectedVisibilityState: "source_tag_protected_visibility_preserved",
  timestamp: `2026-10-01T00:00:${String(index).padStart(2, "0")}.000Z`,
}));

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
  "pairwise_snapshot_freeze",
  "evaluation_run",
  "hidden_benchmark_aggregate_report",
  "release_freeze",
  "training_export",
  "manifest_activation",
];
const phaseGateLaneKinds = ["route", "worker", "queue", "ui_panel", "export_path", "evaluation_lane", "hidden_benchmark_submission_lane", "governance_action"];
const queueFreshnessLanes = ["assignment", "draft", "discussion", "adjudication", "model_evaluation_job", "hidden_benchmark_submission", "export", "outbox", "delayed_report"];
const queueRevalidationChecks = ["item_text", "rubric", "workflow", "split", "manifest", "actor_eligibility", "artifact_dependency"];
const clientSurfaces = ["rating", "practice", "discussion", "adjudication", "calibration", "release_review", "hidden_benchmark_submission", "rater_data_governance"];
const auditChainEventKinds = ["governance_approval", "manifest_activation", "protected_label_access", "hidden_benchmark_release", "training_export_release"];
const qualificationScopes = ["expert_rating", "adjudicator", "topic_specialist", "hidden_benchmark_expert", "primary_rater_anchor"];
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
const modelProviderRunClasses = ["model_evaluation", "model_judge", "critique_generation", "model_assisted_check"];
const ratingTaskOutputUses = ["blind_initial_rating", "expert_check", "adjudication_label"];
const ratingScoreInputSplits = ["release_critical", "validation", "hidden_benchmark"];
const rubricDimensions = ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"];
const rubricLintRules = ["missing_required_score", "clarity_branch_consistency", "centrality_strength_product_gap", "dead_weight_rationale", "verification_status_missing"];
const protectedArtifactTypes = ["prompt", "response", "log", "cache", "backup", "staging_replay"];

function completePolicyBundleFixtures() {
  return {
    visibilityPolicy: {
      id: "visibility-policy-workflow-new",
      policyVersion: "visibility-policy-rlhf88-v1",
      roleClasses: ["rater", "graduate", "phd", "expert", "admin", "auditor"],
      workflowStates: ["queued", "draft", "locked_initial", "post_lock", "adjudication", "release_review"],
      fieldClasses: policyBundleFieldClasses,
      allowedReadActions: ["read_sanitized_screen_state", "read_own_assignment", "read_authorized_audit_summary"],
      allowedWriteActions: ["submit_rating", "submit_issue", "submit_guarded_transition", "submit_authorized_workflow_artifact"],
      sourceTagVisibilityRules: "hide source metadata and admin tags from initial raters",
      benchmarkGoldModelPeerVisibilityRules: "hide benchmark membership, gold answers, model judge scores, peer scores, and peer rationales before allowed locks",
      backendEnforced: true,
      exposureLogRequired: true,
    },
    ratingWorkflowProfile: {
      id: "rating-workflow-profile-workflow-new",
      profileVersion: "rating-workflow-profile-rlhf88-v1",
      taskModesCovered: ratingWorkflowTaskModes,
      requiredScoreFields: ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"],
      requiredRationaleFields: ["short_rationale", "low_clarity_explanation"],
      requiredIssuePanels: ["safe_decline", "source_recognition", "item_issue_report"],
      optionalIssuePanels: ["evidence_spans", "interpretation_target_map", "correctness_verification_workspace"],
      safeDeclineAvailable: true,
      preSubmitLintPolicy: "pre-submit-assist-workflow-new",
    },
    uiExperimentPolicy: {
      id: "ui-experiment-policy-workflow-new",
      policyVersion: "ui-experiment-policy-rlhf88-v1",
      coveredSplitLaneClasses: protectedUiLaneClasses,
      blockedExperimentClasses: blockedUiExperimentClasses,
      unregisteredMaterialChangesBlocked: true,
      sensitivitySnapshotRequired: true,
      uxSimplificationCompatibilityRule: "UX simplification requires passing review",
    },
    preSubmitAssistPolicy: {
      id: "pre-submit-assist-workflow-new",
      policyVersion: "pre-submit-assist-rlhf88-v1",
      rubricVersion: "appendix-f-operational-v1",
      workflowProfileId: "rating-workflow-profile-workflow-new",
      permittedAssistTypes: ["deterministic_completeness_check", "rubric_anchor_reminder", "non_directive_issue_prompt"],
      prohibitedInputs: prohibitedAssistInputs,
      deterministic: true,
      labelBlind: true,
      nonDirective: true,
      targetScoreSuggestionsProhibited: true,
      protectedSplitEligible: true,
    },
    accessibilityConformanceReport: {
      id: "accessibility-conformance-workflow-new",
      workflowProfileIds: ["rating-workflow-profile-workflow-new"],
      screenIds: accessibilitySurfaces,
      raterInstructionRenderVersionIds: ["rater-instruction-render-workflow-new"],
      uiExperimentPolicyId: "ui-experiment-policy-workflow-new",
      uxSimplificationPolicyId: "ux-policy-workflow-new",
      testedLocaleSet: ["en-US"],
      checksPassed: accessibilityChecks,
      readabilityReviewStatus: "passed",
      failures: [],
      mitigations: [],
      nonStaffPromotionBlocker: false,
    },
  };
}

function completeReleaseConfigWorkflowFixtures() {
  const governedBundleCanonicalizationProfile = {
    id: "canonicalization-profile-workflow-new",
    name: "Workflow governed bundle canonicalization",
    version: "canonical-json-sha256-v1",
    hashAlgorithm: "sha256",
    materializationQueryRules: "stable materialized query per bundle family",
    includedFieldPolicy: "semantic fields only",
    rowOrderingPolicy: "order by family, version, id",
    arrayOrderingPolicy: "sort set-like arrays before hashing",
    nullEmptyHandling: "preserve null and empty distinctions",
    unicodeNormalization: "NFC",
    timestampNumberEncoding: "UTC ISO timestamps and decimal-string numbers",
    testVectorIds: ["governed-bundle-vector-v1"],
    activatedAt: "2026-10-01T00:07:00.000Z",
  };
  const governedBundleRecords = governedBundleFamilies.map((bundleFamily, index) => ({
    id: `governed-bundle-workflow-${bundleFamily}`,
    bundleFamily,
    semanticVersion: `rlhf88-${index + 1}`,
    canonicalizationProfileId: governedBundleCanonicalizationProfile.id,
    canonicalContentHash: `sha256:workflow-${bundleFamily}`,
    materializedRowCount: index + 1,
    appendOnlyActivationStatus: "activated",
    activatedBy: "demo-admin",
    activatedAt: "2026-10-01T00:08:00.000Z",
  }));
  const releaseConfigManifest = {
    id: "release-config-manifest-workflow-new",
    releaseId: "october-2026-demo",
    evaluationRunId: "eval-workflow-new",
    name: "Workflow October 2026 release config",
    version: "release-config-rlhf88-v1",
    canonicalManifestHash: "sha256:workflow-release-config",
    codeCommitId: "commit-workflow-new",
    buildId: "build-workflow-new",
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
    scoringCodeChecksums: ["sha256:workflow-scoring"],
    parserConfigIds: ["parser-workflow-new"],
    promptTemplateIds: ["prompt-workflow-new"],
    governedBundleIds: governedBundleRecords.map((bundle) => bundle.id),
    bindingFamilies: releaseConfigBindings,
    frozenAt: "2026-10-01T00:09:00.000Z",
  };
  return {
    governedBundleCanonicalizationProfile,
    governedBundleRecords,
    governedBundleVerification: {
      id: "governed-bundle-verification-workflow-new",
      governedBundleId: governedBundleRecords[0].id,
      verificationStatus: "passed",
      expectedHash: governedBundleRecords[0].canonicalContentHash,
      observedHash: governedBundleRecords[0].canonicalContentHash,
      verifiedAt: "2026-10-01T00:10:00.000Z",
    },
    releaseConfigManifest,
    releaseConfigManifestVerification: {
      id: "release-config-manifest-verification-workflow-new",
      manifestId: releaseConfigManifest.id,
      verificationStatus: "passed",
      expectedHash: releaseConfigManifest.canonicalManifestHash,
      observedHash: releaseConfigManifest.canonicalManifestHash,
      verifiedAt: "2026-10-01T00:11:00.000Z",
    },
  };
}

function completeOperationalControlWorkflowFixtures() {
  const policyActionKindRecords = policyActionKinds.map((actionKind) => ({
    id: `policy-action-kind-workflow-${actionKind}`,
    actionKind,
    sideEffecting: actionKind !== "protected_render",
    protectedRender: actionKind === "protected_render",
    requiresCurrentDecision: true,
    requiresManifestBinding: true,
    requiresActorBinding: true,
    requiresOutputSchemaBinding: true,
    replayProtection: actionKind === "protected_render" ? "idempotency_bound" : "single_use",
    wrongScopeBehavior: "fail_closed",
    activatedAt: "2026-10-01T00:12:00.000Z",
  }));
  const policyDecisionRecords = policyActionKindRecords.map((actionKind) => ({
    id: `policy-decision-workflow-${actionKind.actionKind}`,
    actionKindId: actionKind.id,
    actionKind: actionKind.actionKind,
    decisionStatus: "allow",
    actorId: "demo-admin",
    actorRole: "admin",
    manifestId: "release-config-manifest-workflow-new",
    releaseId: "october-2026-demo",
    outputSchemaVersion: "lmca-policy-decision-v1",
    idempotencyKey: `idempotency-${actionKind.actionKind}`,
    singleUse: actionKind.actionKind !== "protected_render",
    expiresAt: "2026-10-01T01:12:00.000Z",
    decidedAt: "2026-10-01T00:12:00.000Z",
  }));
  const clientSurfaceIntegrityPolicies = clientSurfaces.map((surface) => ({
    id: `client-surface-integrity-workflow-${surface}`,
    releaseId: "october-2026-demo",
    surface,
    thirdPartyAnalyticsProhibited: true,
    sessionReplayProhibited: true,
    domCaptureProhibited: true,
    keystrokeLoggingProhibited: true,
    sensitiveUrlIdsProhibited: true,
    referrerLeakageBlocked: true,
    persistentOfflineCacheProhibited: true,
    cspEnforced: true,
    firstPartyTelemetryAllowlist: ["page_load", "submit_click"],
  }));
  const sensitiveAuditChainEvents = auditChainEventKinds.map((eventKind, index) => ({
    id: `sensitive-audit-chain-event-workflow-${index + 1}`,
    releaseId: "october-2026-demo",
    sequence: index + 1,
    eventKind,
    actorHash: `sha256:workflow-actor-${index + 1}`,
    approverHashes: ["sha256:workflow-approver-a", "sha256:workflow-approver-b"],
    affectedArtifactIds: [`artifact-${eventKind}`],
    beforeHash: `sha256:workflow-before-${eventKind}`,
    afterHash: `sha256:workflow-after-${eventKind}`,
    previousEventHash: index === 0 ? null : `sha256:workflow-event-${index}`,
    eventHash: `sha256:workflow-event-${index + 1}`,
    redactionPolicy: "redact protected labels, hidden text, and private rater data",
    occurredAt: "2026-10-01T00:17:00.000Z",
  }));
  return {
    policyActionKindRecords,
    policyDecisionRecords,
    policyDecisionConsumption: {
      id: "policy-decision-consumption-workflow-new",
      decisionId: "policy-decision-workflow-rating_lock",
      actionKind: "rating_lock",
      manifestId: "release-config-manifest-workflow-new",
      outputSchemaVersion: "lmca-policy-decision-v1",
      idempotencyKey: "idempotency-rating_lock",
      consumedAt: "2026-10-01T00:13:00.000Z",
    },
    implementationPhaseGateBundle: {
      id: "implementation-phase-gate-workflow-new",
      releaseId: "october-2026-demo",
      manifestId: "release-config-manifest-workflow-new",
      version: "implementation-phase-rlhf87-v1",
      laneStates: phaseGateLaneKinds.map((laneKind) => ({
        laneKind,
        laneId: `lane-${laneKind}`,
        phaseState: laneKind === "hidden_benchmark_submission_lane" ? "staff_only" : "enabled",
        failClosed: true,
        noSideEffectsWhenDisabled: true,
        labelsExposedWhenDisabled: false,
        supportsReleaseClaimsWhenDisabled: false,
      })),
      futurePhaseDefault: "blocked",
      broadeningRequiresManifestActivation: true,
      frozenAt: "2026-10-01T00:14:00.000Z",
    },
    queueFreshnessPolicies: queueFreshnessLanes.map((lane, index) => ({
      id: `queue-freshness-workflow-${lane}`,
      releaseId: "october-2026-demo",
      lane,
      freshnessWindowMinutes: 45 + index,
      dependencyRevalidationChecks: queueRevalidationChecks,
      staleBehavior: lane === "outbox" ? "suppress" : "stale",
      workerConsumeRevalidationRequired: true,
      renderRevalidationRequired: true,
      submitRevalidationRequired: true,
      backpressureBehavior: "pause or recompute before side effects",
    })),
    queueStaleByDelayScans: queueFreshnessLanes.map((lane) => ({
      id: `queue-stale-scan-workflow-${lane}`,
      lane,
      scanStatus: "passed",
      staleCount: 0,
      dependencyRevalidationChecks: queueRevalidationChecks,
      scannedAt: "2026-10-01T00:15:00.000Z",
    })),
    clientSurfaceIntegrityPolicies,
    clientSurfaceIntegrityChecks: clientSurfaceIntegrityPolicies.map((policy) => ({
      id: `client-surface-integrity-check-workflow-${policy.surface}`,
      clientSurfaceId: policy.id,
      surface: policy.surface,
      checkStatus: "passed",
      checksPassed: [
        "no_third_party_analytics",
        "no_session_replay",
        "no_dom_capture",
        "no_sensitive_url_ids",
        "referrer_policy",
        "no_persistent_offline_cache",
        "csp",
      ],
      failures: [],
      checkedAt: "2026-10-01T00:16:00.000Z",
    })),
    sensitiveAuditChainEvents,
  };
}

function completeParticipantSafeguardWorkflowFixtures() {
  return {
    volunteerIncentivePolicy: {
      id: "volunteer-incentive-workflow-new",
      policyVersion: "volunteer-incentive-rlhf84-v1",
      allowedCompensationCreditInputs: ["eligible_completed_work", "role", "time_commitment", "training_completion"],
      prohibitedIncentiveSignals,
      speedEffortGuardrails: "private QA-safe effort bands only",
      publicRecognitionPolicy: "participation acknowledgement without scores, speed, agreement, or benchmark ranking",
      privateProgressDashboardPolicy: "private non-gamified progress only",
      calibrationFeedbackUseLimits: "post-lock training-approved feedback only",
      hiddenBenchmarkGoldPerformanceExclusionPolicy: "never use hidden-benchmark or gold performance for incentives",
      leaderboardBadgeRestrictions: "no peer, model, gold, hidden-benchmark, or speed leaderboards",
      frozenAt: "2026-10-01T00:19:00.000Z",
    },
    raterQualificationRecords: qualificationScopes.map((qualificationScope) => ({
      id: `rater-qualification-workflow-${qualificationScope}`,
      raterId: `qualified-${qualificationScope}`,
      qualificationScope,
      qualificationSource: qualificationScope === "primary_rater_anchor" ? "manual_expert_review" : "certification_pack",
      evidenceArtifactReference: `qualification-evidence-${qualificationScope}`,
      approvedRoles: qualificationScope === "adjudicator" ? ["expert", "adjudicator"] : ["expert"],
      topicFamilyScope: ["AI safety", "decision theory", "normative ethics"],
      splitWorkflowEligibility: ["release_critical", "validation", "hidden_benchmark"],
      expiryReviewDate: "2027-01-31",
      approver: "demo-admin",
      timestamp: "2026-10-01T00:20:00.000Z",
    })),
    languageArtifactAssessment: {
      id: "language-artifact-workflow-new",
      positionId: "pos-ai-prior",
      critiqueId: "crit-ai-base-rate",
      artifactType: "machine_translation_residue",
      pinDownabilityImpact: "none",
      substantiveAmbiguityImpact: "none",
      correctnessImpact: "none",
      deadWeightImpact: "none",
      overallQualityImpact: "none",
      automaticScorePenaltyApplied: false,
      reviewerRole: "expert",
      visibilityState: "release_safe_summary",
    },
    sourceRecognitionEvent: {
      id: "source-recognition-workflow-new",
      assignmentId: "assign-ai-base-rate",
      raterId: "demo-rater",
      recognitionType: "source_recognized",
      raterAction: "safe_decline",
      independentBlindEligibilityEffect: "excluded_from_independent_protected_blind_denominator",
      protectedStatusHiddenFromRater: true,
      reviewerResolution: "paused_and_reassigned",
    },
    modelProviderDataHandlingPolicies: modelProviderRunClasses.map((coveredRunClass) => ({
      id: `model-provider-data-handling-workflow-${coveredRunClass}`,
      providerEndpointClass: `approved-${coveredRunClass}`,
      coveredRunClass,
      approvedSplitContentClasses: ["release_critical", "protected_validation", "hidden_benchmark"],
      noTrainingOnInputsOutputs: true,
      noPromptOrOutputReuse: true,
      unnecessaryHumanReviewProhibited: true,
      logRetentionWindowDays: 30,
      subprocessorsSummary: "approved bounded processing route",
      deletionOrRetentionProofRequired: true,
      protectedContentEligible: true,
      approvalStatus: "approved",
      reviewer: "demo-admin",
      expiresAt: "2026-12-31T00:00:00.000Z",
    })),
  };
}

function completeRatingExperienceWorkflowFixtures() {
  const scoreInputPolicy = {
    id: "score-input-policy-workflow-new",
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
    frozenAt: "2026-10-01T00:21:00.000Z",
  };
  const rubricLintConfig = {
    id: "rubric-lint-config-workflow-new",
    rubricVersion: "appendix-f-operational-v1",
    workflowProfileId: "rating-workflow-profile-workflow-new",
    preSubmitAssistPolicyId: "pre-submit-assist-workflow-new",
    lintRuleIds: rubricLintRules,
    triggerConditions: "deterministic rubric consistency checks only",
    severityPolicy: "warn_acknowledge_or_route_to_qa",
    requiredAcknowledgementExplanationPolicy: "rater must acknowledge or explain before lock",
    qaRoutingPolicy: "route unresolved lint findings to QA without exposing labels",
    protectedSplitEligible: true,
    frozenAt: "2026-10-01T00:22:00.000Z",
  };
  const raterInstructionRenderVersion = {
    id: "rater-instruction-render-workflow-new",
    rubricVersion: "appendix-f-operational-v1",
    workflowProfileId: "rating-workflow-profile-workflow-new",
    renderedRubricAnchorChecksum: "sha256:workflow-rubric-anchor",
    scoreInputPolicyId: scoreInputPolicy.id,
    uxSimplificationPolicyId: "ux-policy-workflow-new",
    scoreControlMode: "numeric_plus_slider",
    scoreDefaultPolicy: "unset_required",
    displayedExampleIds: ["source-anchor-ai-base-rate"],
    workflowBannerTextVersion: "critique-not-position-v1",
    issuePanelCopyVersion: "issue-panel-blind-safe-v1",
    preSubmitAssistPolicyId: "pre-submit-assist-workflow-new",
    rubricLintConfigId: rubricLintConfig.id,
    accessibilityVisualVariant: "wcag-aa-task-first",
    uiExperimentPolicyId: "ui-experiment-policy-workflow-new",
    protectedSplitEligibilityPolicy: "compatible_with_protected_splits",
    frozenAt: "2026-10-01T00:23:00.000Z",
  };
  return {
    taskOutputEligibilityPolicy: {
      id: "task-output-eligibility-policy-workflow-new",
      policyVersion: "task-output-eligibility-rlhf85-v1",
      assignmentOutputClasses: ["blind_initial_rating", "revision", "expert_check", "adjudication_label", "model_assisted_check", "draft"],
      eligibleLabelSnapshotUses: ratingTaskOutputUses,
      excludedDenominatorClasses: ["draft", "safe_decline", "source_recognition_compromised", "model_assisted_check"],
      promotionToLabelRequirements: ["locked_initial", "valid_score_input_policy", "current_instruction_render", "no_stale_dependencies"],
      adjudicationEvidencePolicy: "adjudication labels require preserved original ratings and memo linkage",
      pairwisePreferenceExportPolicy: "pairwise exports require frozen pairwise snapshot and non-tied target scores",
      trainingExportEligibility: "exclude protected splits and high-uncertainty rows unless predeclared",
      protectedSplitExclusions: ["hidden_benchmark", "protected_validation"],
      frozenAt: "2026-10-01T00:20:00.000Z",
    },
    scoreInputPolicy,
    raterInstructionRenderVersion,
    rubricLintConfig,
    rubricLintEvent: {
      id: "rubric-lint-event-workflow-new",
      assignmentId: "assign-ai-base-rate",
      ratingId: "rating-seed-ai-base-rate-r1",
      lintConfigId: rubricLintConfig.id,
      lintRuleId: "centrality_strength_product_gap",
      triggerState: "triggered",
      severity: "warning",
      acknowledgementNote: "Rater acknowledged the centrality-strength product diagnostic without score auto-change.",
      resolvedStatus: "acknowledged",
      timestamp: "2026-10-01T00:24:00.000Z",
    },
    itemIssueReport: {
      id: "item-issue-workflow-new",
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
      quarantineStalePropagationState: "quarantine_pending_review",
      excludedFromLabelDenominator: true,
      createdAt: "2026-10-01T00:25:00.000Z",
    },
    ratingDraftSession: {
      id: "rating-draft-session-workflow-new",
      assignmentId: "assign-ai-base-rate",
      autosaveRevisionId: "autosave-workflow-1",
      dependencyVersionSnapshot: {
        itemTextVersionId: "ptv-ai-prior-v1",
        rubricVersion: "appendix-f-operational-v1",
        instructionRenderVersionId: raterInstructionRenderVersion.id,
        workflowProfileId: "rating-workflow-profile-workflow-new",
        assistPolicyId: "pre-submit-assist-workflow-new",
        rubricLintConfigId: rubricLintConfig.id,
        scoreInputPolicyId: scoreInputPolicy.id,
        ratingContextSnapshotId: "rc-target-only-1",
      },
      staleDependencyStatus: "current",
      staleSubmissionBlocked: true,
      fieldCompletionState: "partial",
      lastSavedAt: "2026-10-01T00:26:00.000Z",
      resumeCount: 1,
      recoveredAfterInterruption: true,
      abandonedVsSubmittedStatus: "draft_not_submitted",
      draftNotExportedAsLabel: true,
      timestamp: "2026-10-01T00:26:00.000Z",
    },
    scoreConfidenceAnnotation: {
      id: "score-confidence-annotation-workflow-new",
      assignmentId: "assign-ai-base-rate",
      ratingId: "rating-seed-ai-base-rate-r1",
      raterId: "demo-rater",
      dimensionConfidences: Object.fromEntries(rubricDimensions.map((dimension) => [dimension, 0.7])),
      scaleVersion: "confidence-0-1-v1",
      annotationUsePolicy: "adjudication uncertainty only, not an extra score dimension",
      excludedFromScoreComputation: true,
      visibleToPeersBeforeLock: false,
      timestamp: "2026-10-01T00:26:30.000Z",
    },
    rationaleEvidenceSpan: {
      id: "rationale-evidence-span-workflow-new",
      ratingId: "rating-seed-ai-base-rate-r1",
      itemTextVersionId: "ctv-ai-base-rate-v1",
      spanTarget: "critique",
      startOffset: 0,
      endOffset: 72,
      normalizedSelectedTextHash: "sha256:workflow-rationale-evidence-span",
      linkedDimensionOrFlag: "centrality",
      noteId: "rationale-note-workflow-new",
      visibilityState: "locked_initial_hidden",
      hiddenUntilInitialRatingLock: true,
      rawSelectedTextStored: false,
      timestamp: "2026-10-01T00:26:35.000Z",
    },
    samePositionScratchpad: {
      id: "same-position-scratchpad-workflow-new",
      raterId: "demo-rater",
      positionId: "pos-ai-prior",
      samePositionSessionId: "same-position-session-workflow-new",
      noteText: "Private continuity note about the position's base-rate premise.",
      visibilityState: "private_rater_only",
      promotedToRationaleIds: [],
      excludedFromLabelAndExport: true,
      timestamp: "2026-10-01T00:26:40.000Z",
    },
    samePositionBatchReview: {
      id: "same-position-batch-review-workflow-new",
      raterId: "demo-rater",
      positionId: "pos-ai-prior",
      samePositionSessionId: "same-position-session-workflow-new",
      siblingRatingIdsReviewed: ["rating-seed-ai-base-rate-r1", "rating-seed-ai-base-rate-r2"],
      productOverallDeltaSummary: "Post-lock self-consistency review checked centrality-strength product and overall deltas.",
      revisionProposals: [],
      revisionIds: [],
      reviewStatus: "completed",
      nonIndependentEvidenceFlag: true,
      timestamp: "2026-10-01T00:26:50.000Z",
    },
    correctnessClaimWeightWorksheet: {
      id: "correctness-claim-weight-worksheet-workflow-new",
      ratingId: "rating-seed-ai-base-rate-r1",
      verificationWorkspaceId: "verification-workspace-workflow-new",
      claimSpanIds: ["claim-span-1", "claim-span-2"],
      claimSignificanceWeights: [0.7, 0.3],
      correctnessCredencesStatuses: ["verified:0.8", "unresolved:0.5"],
      unclearClaimExclusionFlags: [false, false],
      advisoryAggregateCorrectnessEstimate: 0.71,
      submittedScoreOverrideFlag: true,
      overrideExplanation: "Rater preserved the submitted correctness score after reviewing weighted claim evidence.",
      exposureBlindingState: "blind_auxiliary_material_not_consulted",
      createdBy: "demo-expert",
      timestamp: "2026-10-01T00:27:00.000Z",
    },
    externalAssistanceDeclaration: {
      id: "external-assistance-declaration-workflow-new",
      assignmentId: "assign-ai-base-rate",
      raterId: "demo-rater",
      assistanceType: "LLM",
      protectedTextEventFlag: true,
      outsideSystemDescription: "Rater reported accidental external LLM paste before lock.",
      contaminationRouting: "excluded_from_blind_initial_denominator_and_quarantined",
      accessibilityExceptionStatus: "not_applicable",
      timestamp: "2026-10-01T00:27:30.000Z",
    },
    protectedArtifactRetentionRecords: protectedArtifactTypes.map((artifactType) => ({
      id: `protected-artifact-retention-workflow-${artifactType}`,
      artifactType,
      artifactIdOrStoragePointer: `${artifactType}-protected-artifact`,
      sourceSplitProtectionClass: "hidden_benchmark",
      releaseConfigManifestId: "release-config-manifest-workflow-new",
      retentionDeletionPolicy: "bounded_retention_then_delete_or_anonymize",
      cacheOutboxPurgeStatus: "purged_or_not_cached",
      backupSnapshotCoverage: "inherits_split_policy",
      developmentStagingEligibility: "not_eligible_without_revalidation",
      restoreTimeRevalidationStatus: "passed_current_manifest_revalidation",
      incidentErratumLinks: [],
      createdAt: "2026-10-01T00:28:00.000Z",
      expiresAt: "2026-12-31T00:00:00.000Z",
    })),
  };
}

function completeAuxiliaryWorkflowFixtures() {
  const queuePolicySnapshot = {
    id: "queue-policy-snapshot-workflow-new",
    policyVersion: "queue-policy-rlhf88-v1",
    liveGoldDuplicateValidationMix: "live, gold, duplicate, and validation proportions are frozen before serving assignments",
    topicRoutingRules: "topic routing uses declared competence without source/protected-status disclosure",
    tierRoutingRules: "release-critical queues balance graduate, phd, expert, and adjudicator coverage",
    safeDeclineReassignmentPolicy: "safe declines reassign silently and never count as ratings",
    samePositionOrderPolicy: "same-position critique order is counterbalanced with later siblings absent at submission",
    randomizationStratificationSeedPolicy: "manifest-bound stratified seed recorded before queue serving",
    createdBy: "demo-admin",
    frozenAt: "2026-10-01T00:29:00.000Z",
    timestamp: "2026-10-01T00:29:00.000Z",
  };
  return {
    blindingPreviewAudit: {
      id: "blinding-preview-audit-workflow-new",
      itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
      itemTextVersionIds: ["ptv-ai-prior-v1", "ctv-ai-base-rate-v1"],
      renderedRaterVisibleTextChecksum: "sha256:workflow-rater-visible-text",
      lintedSourceLeakagePatterns: ["author_name", "url", "source_title", "admin_tag"],
      redactedSourceIdentifyingSpans: ["source-title"],
      retainedSourceIdentifyingSpans: [],
      substantiveNecessityRationale: "No source-identifying spans retained for initial blind rendering.",
      reviewerId: "demo-expert",
      reviewerRole: "expert",
      approvalStatus: "passed",
      sourceIdentifiabilitySensitive: false,
      unresolvedSourceLeakagePatternCount: 0,
      createdAt: "2026-10-01T00:30:00.000Z",
    },
    partialTaskOutputs: partialTaskOutputTypes.map((taskType) => ({
      id: `partial-task-output-workflow-${taskType}`,
      assignmentId: "assign-ai-base-rate",
      raterId: "demo-rater",
      taskType,
      itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
      outputFields: { taskType, note: `${taskType} is auxiliary, not a full-rubric label` },
      visibilityExposureState: taskType === "practice" ? "training_exposure_recorded" : "not_full_blind_initial_rating",
      eligibleUses: ["routing", "calibration", "adjudication", "explicit_pairwise_export"],
      excludedDenominators: partialTaskExcludedDenominators,
      promotionAdjudicationLink: null,
      countedAsFullRubricRating: false,
      timestamp: "2026-10-01T00:31:00.000Z",
    })),
    raterPositionClusterExposure: {
      id: "position-cluster-exposure-workflow-new",
      raterId: "demo-rater",
      positionClusterId: "lmca-public-is-ought-gap",
      itemIds: ["pos-ai-prior"],
      exposureSource: "post_lock_discussion",
      exposureTimestamp: "2026-10-01T00:32:00.000Z",
      exposureVisibilityScope: "same_position_cluster_peer_rationales",
      blindEligibilityEffect: "excluded_from_fresh_blind_initial_on_cluster",
      deprotectionTrainingExposureStatus: "training_exposure_recorded",
      createdBy: "demo-admin",
      timestamp: "2026-10-01T00:32:00.000Z",
    },
    spotCheckQaItem: {
      id: "spot-check-qa-workflow-new",
      itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
      ratingId: "rating-seed-ai-base-rate-r1",
      samplingStratum: "non_escalated_release_critical",
      samplingSeedArtifact: "sha256:workflow-spot-check-seed",
      reviewerId: "demo-expert",
      reviewerRole: "expert",
      checkResult: "passed_without_label_change",
      revisionAdjudicationEscalationLink: null,
      excludedFromIndependentRaterCount: true,
      timestamp: "2026-10-01T00:33:00.000Z",
    },
    adjudicationTriageQueueItem: {
      id: "adjudication-triage-workflow-new",
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
      timestamp: "2026-10-01T00:34:00.000Z",
    },
    diagnosticDeferralRecord: {
      id: "diagnostic-deferral-workflow-new",
      releaseId: "october-2026-demo",
      diagnosticName: "obfuscation_stress",
      claimAffected: "robustness_to_obfuscated_arguments",
      notRunReason: "Not enough obfuscation variants for the current internal milestone.",
      approvedWeakerClaimWording: "Obfuscation robustness is not claimed for this release.",
      strongerClaimSuppressed: true,
      reviewerId: "demo-expert",
      reviewerRole: "expert",
      createdAt: "2026-10-01T00:35:00.000Z",
    },
    queuePolicySnapshot,
    assignmentSelectionAudit: {
      id: "assignment-selection-audit-workflow-new",
      queuePolicySnapshotId: queuePolicySnapshot.id,
      splitReleaseId: "october-2026-demo",
      candidateAssignments: ["assign-ai-base-rate", "assign-voting-bullet", "assign-mind-zombie"],
      servedAssignments: ["assign-ai-base-rate", "assign-voting-bullet"],
      declinesReassignmentsByReason: { lack_topic_expertise: 1, conflict_or_prior_exposure: 1 },
      raterTierDistribution: { graduate: 1, expert: 1 },
      topicSourceLengthDistribution: { "AI safety:short": 1, "politics:medium": 1 },
      selfSelectionIndicators: ["volunteer_selected_from_eligible_blind_pool"],
      compositionChangedLabelDenominators: false,
      createdAt: "2026-10-01T00:36:00.000Z",
    },
    modelInferenceConfig: {
      id: "model-inference-config-workflow-new",
      evaluationRunId: "eval-full-rubric-demo",
      providerEndpoint: "approved-model-evaluation-endpoint",
      modelSnapshot: "gpt-demo-2026-10-01",
      decodingParameters: { temperature: 0, topP: 1 },
      reasoningBudget: "bounded_hidden_chain_budget_v1",
      toolAvailability: ["none"],
      messageStackTemplate: "lmca-full-rubric-eval-template-v1",
      retryPolicy: "single_retry_parse_failures_only",
      seedDeterminismArtifact: "sha256:model-eval-seed",
      createdAt: "2026-10-01T00:37:00.000Z",
    },
    modelRunEnvironment: {
      id: "model-run-environment-workflow-new",
      evaluationRunId: "eval-full-rubric-demo",
      runtimeOrchestratorVersion: "lmca-eval-orchestrator-v1",
      apiRouteDeploymentId: "deployment-october-2026-demo",
      libraryVersions: { node: "20.x", parser: "lmca-parser-v1" },
      timestamp: "2026-10-01T00:38:00.000Z",
      rateLimitRetryMetadata: "bounded retries with no prompt mutation",
      parserExtractorVersionLinks: ["parser-config-demo", "prompt-template-demo"],
    },
    raterItemConflict: {
      id: "rater-item-conflict-workflow-new",
      raterId: "demo-rater",
      positionClusterId: "lmca-public-is-ought-gap",
      critiqueId: "crit-ai-base-rate",
      sourceFamilyId: "source-family-ai-base-rate",
      conflictType: "source_family_exposure",
      disclosureSource: "rater_self_screen",
      independentBlindEligibilityEffect: "excluded_from_independent_blind_protected_denominators",
      allowedNonBlindRoles: ["intake_review", "adjudication_context"],
      reviewerResolution: "approved_non_blind_context_only",
      timestamp: "2026-10-01T00:39:00.000Z",
    },
    assignmentConflictScreen: {
      id: "assignment-conflict-screen-workflow-new",
      assignmentId: "assign-ai-base-rate",
      raterId: "demo-rater",
      positionClusterId: "lmca-public-is-ought-gap",
      critiqueId: "crit-ai-base-rate",
      conflictType: "public_example_exposure",
      disclosureSource: "pre_rating_self_screen",
      independentBlindEligibilityEffect: "excluded_from_independent_blind_protected_denominators",
      allowedNonBlindRoles: ["practice", "non_blind_check"],
      reviewerResolution: "route_to_non_blind_or_reassign",
      timestamp: "2026-10-01T00:39:30.000Z",
    },
    raterTrainingExposureSnapshot: {
      id: "training-exposure-snapshot-workflow-new",
      raterId: "demo-rater",
      assignmentId: "assign-ai-base-rate",
      certificationRecordId: "certification-workflow-new",
      certificationPackVersion: "pack-v1",
      rubricVersion: "appendix-f-operational-v1",
      publicSourceAnchorExampleIdsPreviouslySeen: ["source-anchor-ai-base-rate"],
      goldItemIdsOrProtectedSafeSummariesPreviouslySeen: ["gold-category:centrality_strength"],
      duplicateFeedbackSummary: "duplicate feedback shown after lock only",
      calibrationFeedbackEventIds: ["calibration-feedback-workflow-new"],
      remediationModuleState: "not_required",
      practiceSessionIds: ["practice-session-workflow-new"],
      samePositionPositionClusterExposureChecks: ["no_prior_same_position_exposure", "position_cluster_checked"],
      protectedSplitConflictStatus: "no_conflict_for_current_assignment",
      protectedClusterEligibilityEffect: "eligible_after_checks",
      createdAt: "2026-10-01T00:40:00.000Z",
    },
    releaseErratum: {
      id: "release-erratum-workflow-new",
      releaseId: "october-2026-demo",
      erratumType: "denominator_error",
      affectedArtifactIds: ["release-report-october-2026-demo"],
      defectSummary: "Erratum template for denominator defects discovered after freeze.",
      supersedingArtifactIds: ["release-report-october-2026-demo-superseding-template"],
      historicalArtifactsMutated: false,
      historicalLeaderboardMutationPolicy: "do not mutate historical leaderboard; publish superseding artifact",
      status: "issued",
      approvedBy: "demo-admin",
      createdAt: "2026-10-01T00:41:00.000Z",
    },
    scheduleStatusSnapshot: {
      id: "schedule-status-workflow-new",
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
      owner: "demo-admin",
      approvedBy: "demo-expert",
      supportsCompletionClaim: false,
      timestamp: "2026-10-01T00:42:00.000Z",
    },
  };
}

function completeInteractionWorkflowFixtures() {
  return {
    publicExamplePracticeSession: {
      id: "practice-session-workflow-new",
      raterId: "demo-rater",
      sourceAnchorExampleIds: ["source-anchor-ai-base-rate"],
      itemTextVersionIds: ["ptv-ai-prior-v1", "ctv-ai-base-rate-v1"],
      workflowProfileId: "rating-workflow-profile-workflow-new",
      attemptRatings: ["practice-rating-workflow-new"],
      lockedAt: "2026-10-01T00:43:00.000Z",
      feedbackArtifactId: "calibration-feedback-workflow-new",
      rubricAnchorUsageSummary: "Public anchors reviewed before feedback.",
      trainingExposureStatus: "training_exposure_recorded",
      excludedFromRatingDenominator: true,
      createdAt: "2026-10-01T00:43:00.000Z",
    },
    raterLearningPlan: {
      id: "rater-learning-plan-workflow-new",
      raterId: "demo-rater",
      rubricVersion: "appendix-f-operational-v1",
      certificationPackVersion: "pack-v1",
      practiceGoldDuplicatePerformanceSummaries: { centrality: "calibrated" },
      perDimensionDriftSummary: { correctness: "stable" },
      assignedRemediationModules: ["centrality-strength-product"],
      completedModules: ["centrality-strength-product"],
      currentAssignmentRestrictionsUnlocks: ["ordinary_live_allowed"],
      feedbackArtifactsShown: ["calibration-feedback-workflow-new"],
      protectedLabelExposureCheck: "no_protected_or_live_labels_shown",
      timestamp: "2026-10-01T00:44:00.000Z",
    },
    raterSession: {
      id: "rater-session-workflow-new",
      raterId: "demo-rater",
      sessionTarget: "ordinary_live_rating",
      startedAt: "2026-10-01T00:45:00.000Z",
      activeTimeSeconds: 900,
      completedAssignmentCount: 1,
      expectedEffortCompleted: "within_band",
      stopAfterCurrentItemState: "available",
      fatigueWarningState: "none",
      qaRoutingStatus: "no_fatigue_qa_route",
      timestamp: "2026-10-01T00:45:00.000Z",
    },
    assignmentDecline: {
      id: "assignment-decline-workflow-new",
      assignmentId: "assign-ai-base-rate",
      raterId: "demo-rater",
      itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
      reasonCode: "conflict_or_prior_exposure",
      reassignmentStatus: "reassigned_without_label",
      qaRoutingStatus: "monitor_only",
      sourcePeerModelGoldProtectedLabelVisibilityState: "all_hidden",
      excludedFromRatingDenominator: true,
      timestamp: "2026-10-01T00:46:00.000Z",
    },
    interpretationTargetMap: {
      id: "interpretation-target-map-workflow-new",
      itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
      assignmentId: "assign-ai-base-rate",
      positionTextVersionId: "ptv-ai-prior-v1",
      critiqueTextVersionId: "ctv-ai-base-rate-v1",
      candidateIntendedConclusionSpans: ["position-conclusion"],
      attackedClaimSpans: ["critique-attack"],
      plausiblePositionCritiqueInterpretations: ["central_forecast_attack"],
      plausibilityNotes: "Central forecast attack is release-relevant.",
      critiqueCoverageByInterpretation: { central_forecast_attack: "covered" },
      pricedInBackgroundAssumptionStatus: "not_priced_in",
      centralityTargetClaimSet: ["central_forecast"],
      strengthTargetClaimSet: ["base_rate_challenge"],
      productAllocationNote: "Centrality and strength product checked together.",
      visibilityState: "post_lock_or_adjudicator_only",
      createdBy: "demo-expert",
      timestamp: "2026-10-01T00:47:00.000Z",
    },
    verificationWorkspaceSession: {
      id: "verification-workspace-workflow-new",
      itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
      claimList: ["The critique says expert forecasts ignore base rates."],
      claimSpanRefs: ["claim-span-1"],
      claimType: "subjective_or_intuition_pump",
      verificationStatus: "not_practicable",
      evidenceMaterialRefs: ["adjudication-note"],
      exposureBlindingState: "post_lock_expert_only",
      verifierId: "demo-expert",
      verifierRole: "expert",
      timestamp: "2026-10-01T00:48:00.000Z",
    },
    adjudicatorPreRead: {
      id: "adjudicator-pre-read-workflow-new",
      adjudicatorId: "demo-expert",
      itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
      visibleMaterialPolicy: "rationales_without_peer_distribution",
      preReadNotes: "Potential target ambiguity identified.",
      preliminaryIssueTags: ["interpretation_dispute"],
      completedBeforePeerDistributionExposure: true,
      linkedAdjudicationMemoId: "adjudication-memo-workflow-new",
      timestamp: "2026-10-01T00:49:00.000Z",
    },
    postLockDiscussionSession: {
      id: "post-lock-discussion-workflow-new",
      discussionThreadId: "discussion-thread-workflow-new",
      itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
      participantIds: ["demo-rater", "demo-expert"],
      initialRatingLockCheck: "all_initial_ratings_locked",
      identityStagingPolicy: "role_neutral_handles_first",
      identityMaskPhaseStatus: "completed_before_role_reveal",
      roleRevealPolicy: "moderator_exception_logged",
      visibleMaterialPolicy: "peer_rationales_visible_post_lock_only",
      objectLevelCommentRecords: ["comment-workflow-new"],
      revisionProposalIds: ["revision-proposal-workflow-new"],
      transcriptArtifact: "discussion-transcript-workflow-new",
      discussionStatus: "object_level_discussion_complete",
      timestamp: "2026-10-01T00:50:00.000Z",
    },
    adjudicationReviewSession: {
      id: "adjudication-review-session-workflow-new",
      adjudicationId: "adjudication-workflow-new",
      discussionThreadId: "discussion-thread-workflow-new",
      itemKeys: ["pos-ai-prior::crit-ai-base-rate"],
      scoreSpreadHeatmapVersion: "spread-heatmap-v1",
      centXStrProductAllocationView: "product-allocation-v1",
      rationaleSpanOverlayRefs: ["rationale-span-workflow-new"],
      verificationConflictSummary: "subjective claim not practicable",
      siblingContextDifferenceSummary: "same-position sibling context checked",
      preSubmitLintSummary: "centrality-strength warning acknowledged",
      revisionTimelineRefs: ["revision-timeline-workflow-new"],
      targetMapIds: ["interpretation-target-map-workflow-new"],
      minorityRationaleFields: ["minority-strength-reading"],
      finalizationStatus: "ready_for_memo",
      adjudicatorIds: ["demo-expert"],
      timestamp: "2026-10-01T00:51:00.000Z",
    },
    calibrationFeedbackEvent: {
      id: "calibration-feedback-workflow-new",
      certificationRecordId: "certification-record-workflow-new",
      raterId: "demo-rater",
      goldItemId: "gold-item-workflow-new",
      attemptRatingId: "practice-rating-workflow-new",
      rubricVersion: "appendix-f-operational-v1",
      perDimensionDeviationSummary: { centrality: "within_band" },
      duplicateInconsistencySummary: "none",
      feedbackTextVersion: "feedback-v1",
      shownAfterLock: true,
      protectedSplitConflictCheck: "training_approved_no_protected_cluster_conflict",
      timestamp: "2026-10-01T00:52:00.000Z",
    },
    governanceApprovalRecord: {
      id: "governance-approval-workflow-new",
      actionKind: "release_manifest_activation",
      affectedArtifactIds: ["release-config-manifest-workflow-new"],
      proposedBy: "demo-admin",
      approver1: "independent-approver-a",
      approver2: "independent-approver-b",
      independenceSeparationOfDutiesStatus: "independent_two_person_approval",
      reasonCode: "manifest_activation",
      visibilitySplitMetricLeaderboardImpactSummary: "no broadening of protected visibility or metric eligibility",
      approvalTimestamp: "2026-10-01T00:53:00.000Z",
    },
    protectedArtifactRevalidation: {
      id: "protected-artifact-revalidation-workflow-new",
      protectedArtifactId: "protected-prompt-workflow-new",
      releaseConfigManifestId: "release-config-manifest-workflow-new",
      revalidationStatus: "passed_current_manifest_revalidation",
      staleSupersededBehavior: "fail_closed_if_stale_or_superseded",
      checkedBy: "demo-admin",
      checkedAt: "2026-10-01T00:54:00.000Z",
    },
    benchmarkSubmissionPolicy: {
      id: "benchmark-submission-policy-workflow-new",
      policyVersion: "benchmark-submission-rlhf88-v1",
      aggregateOnlyReport: true,
      submissionBudget: { monthly: 2 },
      cooldownPolicy: "cooldown_after_submission",
      hiddenIdExposureProhibited: true,
      perItemFeedbackProhibited: true,
      createdBy: "demo-admin",
      frozenAt: "2026-10-01T00:55:00.000Z",
    },
    benchmarkSubmission: {
      id: "benchmark-submission-workflow-new",
      benchmarkSubmissionPolicyId: "benchmark-submission-policy-workflow-new",
      releaseId: "october-2026-demo",
      submittedAggregateReportId: "benchmark-aggregate-report-workflow-new",
      perItemOutputIncluded: false,
      hiddenIdExposureIncluded: false,
      budgetConsumptionStatus: "within_budget",
      cooldownStatus: "cooldown_started",
      submittedAt: "2026-10-01T00:56:00.000Z",
    },
    screenFeatureParityCheck: {
      id: "screen-feature-parity-workflow-new",
      screenId: "rating",
      uxSimplificationPolicyId: "ux-policy-workflow-new",
      workflowProfileId: "rating-workflow-profile-workflow-new",
      requiredControlResults: { score_fields: "reachable", safe_decline: "reachable" },
      featureParityChecklistResults: { no_feature_loss: "passed" },
      noFeatureLoss: true,
      checkedBy: "ux-reviewer",
      checkedAt: "2026-10-01T00:57:00.000Z",
    },
    simplifiedCopyPreview: {
      id: "simplified-copy-preview-workflow-new",
      screenId: "rating",
      copyBundleId: "copy-bundle-workflow-new",
      glossaryTooltipIds: ["centrality", "strength"],
      exactRubricTermPreservation: true,
      hiddenFieldLeakageCheck: "passed",
      reviewerId: "ux-reviewer",
      reviewedAt: "2026-10-01T00:58:00.000Z",
    },
  };
}

test("Vercel function entrypoint serves API health without a long-running server", async () => {
  const response = await invokeVercelHandler(vercelHealthHandler, { method: "GET", url: "/api/health" });
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.auditMode, "local_jsonl_append_only");
});

test("Vercel API wrappers are importable", async () => {
  const files = apiModuleFiles();
  assert.ok(files.length >= 298);
  for (const file of files) {
    const module = await import(pathToFileURL(join(process.cwd(), file)));
    assert.equal(typeof module.default, "function", file);
  }
});

test("server policy accepts valid blind ratings and hashes audit payloads", () => {
  const rating = validBlindRating("rating-policy-test");
  const validation = validateRatingPayload(rating, "blind_initial_submitted");
  assert.equal(validation.ok, true);

  const event = createAuditEvent("blind_initial_submitted", "graduate", rating, { socket: { remoteAddress: "127.0.0.1" } });
  assert.equal(event.type, "blind_initial_submitted");
  assert.equal(event.actorRole, "graduate");
  assert.match(event.id, /^[0-9a-f-]{36}$/);
  assert.match(event.actorHash, /^sha256:/);
  assert.match(event.payloadHash, /^sha256:/);
  assert.equal(event.accessAudit.blindInitialMetadataWithheld, true);
  assert.equal(event.accessAudit.sourceMetadataAcceptedFromRater, false);
});

test("server policy signs, verifies, rejects tampered, and expires session tokens", () => {
  const secret = "unit-test-secret";
  const user = demoUsers.find((item) => item.id === "demo-rater");
  const token = signSessionToken(user, secret, { issuedAt: 1000, expiresAt: 2000, nonce: "fixed" });
  const verified = verifySessionToken(token, secret, 1500);
  assert.equal(verified.ok, true);
  assert.equal(verified.user.id, "demo-rater");

  assert.equal(verifySessionToken(`${token}x`, secret, 1500).ok, false);
  assert.equal(verifySessionToken(token, "wrong-secret", 1500).error, "invalid_session_signature");
  assert.equal(verifySessionToken(token, secret, 2500).error, "session_expired");
});

test("server policy refuses demo auth when real auth is required", () => {
  assert.throws(
    () => createAuthConfig({ authMode: "demo", requireRealAuth: true, sessionSecret: "unit-test-secret" }),
    /LMCA_REQUIRE_REAL_AUTH=true requires LMCA_AUTH_MODE=external_jwt/,
  );
});

test("server policy verifies external JWT roles and assignment claims", async () => {
  const { privateKey, jwk } = createTestJwksKey("unit-key");
  const auth = createAuthConfig({
    authMode: "external_jwt",
    authIssuer: "https://issuer.example.test",
    authAudience: "rlhf-conceptual-reasoning",
    authJwks: { keys: [jwk] },
    authRoleClaim: "app.role",
    authAssignmentsClaim: "app.assignments",
    authClockSkewSeconds: 0,
  });
  const token = signTestJwt(
    {
      iss: "https://issuer.example.test",
      aud: "rlhf-conceptual-reasoning",
      sub: "demo-rater",
      name: "External Graduate Rater",
      exp: Math.floor(Date.now() / 1000) + 300,
      app: {
        role: "graduate",
        assignments: ["assign-ai-base-rate"],
      },
    },
    privateKey,
    "unit-key",
  );

  const session = await authenticateRequest(requestFixture({ headers: { authorization: `Bearer ${token}` } }), auth);
  assert.equal(session.ok, true);
  assert.equal(session.user.id, "demo-rater");
  assert.equal(session.user.role, "graduate");
  assert.deepEqual(session.user.allowedAssignmentIds, ["assign-ai-base-rate"]);
  assert.equal(validateRatingActor(validBlindRating("rating-external-jwt"), session.user).ok, true);

  const unassigned = validateRatingActor({ ...validBlindRating("rating-external-jwt-unassigned"), assignmentId: "assign-mind-zombie" }, session.user);
  assert.equal(unassigned.ok, false);
  assert.match(unassigned.detail, /not assigned/);
});

test("server policy disables demo session endpoint in external JWT mode", async () => {
  const { jwk } = createTestJwksKey("unit-key");
  const context = createApiContext({
    authMode: "external_jwt",
    authIssuer: "https://issuer.example.test",
    authAudience: "rlhf-conceptual-reasoning",
    authJwks: { keys: [jwk] },
  });
  const response = await invokeApi(context, {
    method: "POST",
    url: "/api/sessions",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: "demo-rater" }),
  });
  assert.equal(response.status, 403);
  assert.equal(response.body.error, "demo_sessions_disabled");
});

test("server policy exposes public auth config for external JWT clients without secrets", async () => {
  const demoContext = createApiContext({ sessionSecret: "unit-test-secret" });
  const demoResponse = await invokeApi(demoContext, { method: "GET", url: "/api/auth/config" });
  assert.equal(demoResponse.status, 200);
  assert.equal(demoResponse.body.provider, "demo");
  assert.equal(demoResponse.body.demoSessionEndpointEnabled, true);
  assert.equal(demoResponse.body.clerkPublishableKey, null);

  const { jwk } = createTestJwksKey("unit-key");
  const externalContext = createApiContext({
    authMode: "external_jwt",
    authIssuer: "https://issuer.example.test",
    authAudience: "rlhf-conceptual-reasoning",
    authJwks: { keys: [jwk] },
    authRoleClaim: "app.role",
    authAssignmentsClaim: "app.assignments",
    clerkPublishableKey: "pk_test_public_config",
    clerkJwtTemplate: "lmca",
  });
  const externalResponse = await invokeApi(externalContext, { method: "GET", url: "/api/auth/config" });
  assert.equal(externalResponse.status, 200);
  assert.equal(externalResponse.body.provider, "clerk");
  assert.equal(externalResponse.body.authMode, "external_jwt_rbac");
  assert.equal(externalResponse.body.clerkPublishableKey, "pk_test_public_config");
  assert.equal(externalResponse.body.clerkJwtTemplate, "lmca");
  assert.equal(externalResponse.body.roleClaim, "app.role");
  assert.equal(externalResponse.body.assignmentsClaim, "app.assignments");
  assert.equal(externalResponse.body.demoSessionEndpointEnabled, false);
  assert.equal(externalResponse.body.clerkSecretKey, undefined);
  assert.equal(externalResponse.body.authJwks, undefined);
});

test("v1 assignment endpoint returns source-blind next assignment", async () => {
  const context = createApiContext({ sessionSecret: "unit-test-secret", auditStore: createMemoryAuditStore() });
  const token = signSessionToken(demoUsers.find((item) => item.id === "demo-rater"), "unit-test-secret");
  const response = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/assignments/next",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.assignment.id, "assign-ai-base-rate");
  assert.equal(response.body.assignment.positionTextVersionId, "ptv-ai-prior-v1");
  assert.equal(response.body.assignment.critiqueTextVersionId, "ctv-ai-base-rate-v1");
  assert.equal(response.body.assignment.ratingContextSnapshotId, "rc-target-only-1");
  assert.match(response.body.assignment.positionText, /alignment interpretability/);
  assert.match(response.body.assignment.critiqueText, /expert overconfidence/);
  assert.equal(response.body.assignment.queueType, undefined);
  assert.equal(response.body.assignment.sourceType, undefined);
  assert.equal(response.body.assignment.benchmarkStatus, undefined);
  assert.ok(response.body.assignment.hiddenBeforeInitialSubmission.includes("model-judge scores"));
  assert.equal(response.body.screenState.payloadSource, "server_derived");
  assert.equal(response.body.screenState.surface, "rating");
  assert.equal(response.body.screenState.sanitized, true);
  assert.ok(response.body.screenState.enabledActionAllowlist.includes("safe_decline"));
  assert.ok(response.body.screenState.enabledActionAllowlist.includes("source_recognition"));
  assert.ok(response.body.screenState.policyVersionProvenance.uxSimplificationPolicyId);
  assert.equal(
    response.body.screenState.visibleFieldAllowlist.some((field) => /sourceType|benchmarkStatus|modelJudgeScore|peerRatings/i.test(field)),
    false,
  );
});

test("v1 API surface from RLHF77 routes through auth instead of falling through", async () => {
  const context = createApiContext({ sessionSecret: "unit-test-secret", auditStore: createMemoryAuditStore() });
  const routes = [
    ["POST", "/api/v1/intake/positions"],
    ["POST", "/api/v1/intake/critiques"],
    ["POST", "/api/v1/rights/review"],
    ["POST", "/api/v1/releases/freeze"],
    ["POST", "/api/v1/certification-records"],
    ["GET", "/api/v1/certification-records/certification-record-smoke"],
    ["POST", "/api/v1/exposure-logs"],
    ["GET", "/api/v1/exposure-logs/exposure-log-smoke"],
    ["POST", "/api/v1/revisions"],
    ["GET", "/api/v1/revisions/revision-record-smoke"],
    ["POST", "/api/v1/item-text-versions"],
    ["GET", "/api/v1/item-text-versions/item-text-version-smoke"],
    ["POST", "/api/v1/rating-context-snapshots"],
    ["GET", "/api/v1/rating-context-snapshots/rating-context-smoke"],
    ["POST", "/api/v1/pairwise-comparison-snapshots"],
    ["GET", "/api/v1/pairwise-comparison-snapshots/pairwise-snapshot-smoke"],
    ["POST", "/api/v1/rater-reliability-weight-models"],
    ["GET", "/api/v1/rater-reliability-weight-models/reliability-weight-model-smoke"],
    ["POST", "/api/v1/raters"],
    ["GET", "/api/v1/raters/rater-smoke"],
    ["POST", "/api/v1/assignments"],
    ["GET", "/api/v1/assignments/assignment-smoke"],
    ["POST", "/api/v1/rater-sessions"],
    ["GET", "/api/v1/rater-sessions/rater-session-smoke"],
    ["PATCH", "/api/v1/rater-sessions/rater-session-smoke"],
    ["POST", "/api/v1/rater-sessions/rater-session-smoke/pause"],
    ["POST", "/api/v1/rater-sessions/rater-session-smoke/stop-after-current"],
    ["POST", "/api/v1/practice-sessions"],
    ["GET", "/api/v1/practice-sessions/practice-session-smoke"],
    ["POST", "/api/v1/rater-learning-plans"],
    ["GET", "/api/v1/rater-learning-plans/rater-learning-plan-smoke"],
    ["POST", "/api/v1/gold-items"],
    ["GET", "/api/v1/gold-items/gold-item-smoke"],
    ["POST", "/api/v1/source-anchor-examples"],
    ["GET", "/api/v1/source-anchor-examples/source-anchor-smoke"],
    ["POST", "/api/v1/benchmark-split-members"],
    ["GET", "/api/v1/benchmark-split-members/split-member-smoke"],
    ["POST", "/api/v1/rights-records"],
    ["GET", "/api/v1/rights-records/rights-record-smoke"],
    ["POST", "/api/v1/release-versions"],
    ["GET", "/api/v1/release-versions/release-version-smoke"],
    ["POST", "/api/v1/release-gate-profiles"],
    ["GET", "/api/v1/release-gate-profiles/release-gate-smoke"],
    ["POST", "/api/v1/primary-rater-anchor-policies"],
    ["GET", "/api/v1/primary-rater-anchor-policies/primary-rater-policy-smoke"],
    ["POST", "/api/v1/comparability-claims"],
    ["GET", "/api/v1/comparability-claims/comparability-claim-smoke"],
    ["POST", "/api/v1/candidate-batches"],
    ["GET", "/api/v1/candidate-batches/candidate-batch-smoke"],
    ["POST", "/api/v1/candidate-critiques"],
    ["GET", "/api/v1/candidate-critiques/candidate-critique-smoke"],
    ["POST", "/api/v1/model-judge-scores"],
    ["GET", "/api/v1/model-judge-scores/model-judge-score-smoke"],
    ["POST", "/api/v1/active-learning-selection-audits"],
    ["GET", "/api/v1/active-learning-selection-audits/selection-audit-smoke"],
    ["POST", "/api/v1/candidate-batches/candidate-batch-smoke/model-judge-scores"],
    ["POST", "/api/v1/candidates/candidate-smoke/review"],
    ["POST", "/api/v1/candidates/candidate-smoke/promote"],
    ["POST", "/api/v1/critique-generation-runs"],
    ["GET", "/api/v1/critique-generation-runs/generation-run-smoke"],
    ["POST", "/api/v1/generated-critiques"],
    ["GET", "/api/v1/generated-critiques/generated-critique-smoke"],
    ["POST", "/api/v1/generated-critiques/generated-critique-smoke/promote"],
    ["POST", "/api/v1/generation-evaluation-reports"],
    ["GET", "/api/v1/generation-evaluation-reports/generation-report-smoke"],
    ["GET", "/api/v1/assignments/next"],
    ["POST", "/api/v1/ratings"],
    ["POST", "/api/v1/ratings/rating-smoke/revise"],
    ["POST", "/api/v1/ratings/rating-smoke/check"],
    ["GET", "/api/v1/assignments/assign-ai-base-rate/screen-state"],
    ["POST", "/api/v1/assignments/assign-ai-base-rate/flag"],
    ["POST", "/api/v1/assignments/assign-ai-base-rate/self-screen"],
    ["POST", "/api/v1/assignments/assign-ai-base-rate/decline"],
    ["POST", "/api/v1/assignments/assign-ai-base-rate/defer"],
    ["POST", "/api/v1/assignments/assign-ai-base-rate/source-recognition-events"],
    ["POST", "/api/v1/discussions"],
    ["GET", "/api/v1/discussions/discussion-smoke"],
    ["GET", "/api/v1/discussions/discussion-thread-smoke/screen-state"],
    ["POST", "/api/v1/discussions/discussion-thread-smoke/post-lock-sessions"],
    ["GET", "/api/v1/discussions/discussion-thread-smoke/post-lock-sessions/post-lock-session-smoke"],
    ["POST", "/api/v1/discussions/discussion-thread-smoke/comments"],
    ["POST", "/api/v1/discussions/discussion-thread-smoke/revision-proposals"],
    ["POST", "/api/v1/discussion-threads"],
    ["GET", "/api/v1/discussion-threads/discussion-thread-smoke"],
    ["POST", "/api/v1/adjudications"],
    ["GET", "/api/v1/adjudications/adjudication-smoke/screen-state"],
    ["GET", "/api/v1/adjudications/adjudication-smoke/cockpit"],
    ["POST", "/api/v1/adjudications/adjudication-smoke/finalize"],
    ["POST", "/api/v1/adjudication-memos"],
    ["GET", "/api/v1/adjudication-memos/adjudication-memo-smoke"],
    ["POST", "/api/v1/adjudicator-pre-reads"],
    ["GET", "/api/v1/adjudicator-pre-reads/adjudicator-pre-read-smoke"],
    ["POST", "/api/v1/adjudication-review-sessions"],
    ["GET", "/api/v1/adjudication-review-sessions/adjudication-review-session-smoke"],
    ["POST", "/api/v1/verification-records"],
    ["GET", "/api/v1/verification-records/verification-smoke"],
    ["POST", "/api/v1/interpretation-target-maps"],
    ["GET", "/api/v1/interpretation-target-maps/interpretation-target-map-smoke"],
    ["POST", "/api/v1/verification-workspace-sessions"],
    ["GET", "/api/v1/verification-workspace-sessions/verification-workspace-smoke"],
    ["POST", "/api/v1/rating-checks"],
    ["GET", "/api/v1/rating-checks/rating-check-smoke"],
    ["POST", "/api/v1/calibration-feedback-events"],
    ["GET", "/api/v1/calibration-feedback-events/calibration-feedback-smoke"],
    ["POST", "/api/v1/certification/start"],
    ["GET", "/api/v1/certification/demo-rater/status"],
    ["GET", "/api/v1/qa/metrics"],
    ["GET", "/api/v1/qa/drift"],
    ["POST", "/api/v1/benchmark/candidates/freeze"],
    ["GET", "/api/v1/benchmark/exposure"],
    ["POST", "/api/v1/label-snapshots"],
    ["GET", "/api/v1/label-snapshots/snapshot-smoke"],
    ["POST", "/api/v1/corpus-manifests"],
    ["GET", "/api/v1/corpus-manifests/corpus-smoke"],
    ["POST", "/api/v1/exports/public"],
    ["POST", "/api/v1/exports/internal"],
    ["POST", "/api/v1/prompt-templates"],
    ["GET", "/api/v1/prompt-templates/prompt-smoke"],
    ["POST", "/api/v1/parser-configs"],
    ["GET", "/api/v1/parser-configs/parser-smoke"],
    ["POST", "/api/v1/metric-configs"],
    ["GET", "/api/v1/metric-configs/metric-config-smoke"],
    ["POST", "/api/v1/derived-utility-formulas"],
    ["GET", "/api/v1/derived-utility-formulas/derived-utility-smoke"],
    ["POST", "/api/v1/training-exports"],
    ["GET", "/api/v1/training-exports/training-smoke"],
    ["POST", "/api/v1/model-improvement-runs"],
    ["GET", "/api/v1/model-improvement-runs/model-improvement-smoke"],
    ["POST", "/api/v1/evaluations/run"],
    ["GET", "/api/v1/evaluations/eval-smoke"],
    ["POST", "/api/v1/evaluations/eval-smoke/predictions"],
    ["GET", "/api/v1/evaluations/eval-smoke/predictions"],
    ["GET", "/api/v1/model-evaluation-predictions/prediction-smoke"],
    ["POST", "/api/v1/evaluations/eval-smoke/calibrate"],
    ["GET", "/api/v1/calibration-runs/calibration-smoke"],
    ["POST", "/api/v1/artifact-probes/run"],
    ["GET", "/api/v1/artifact-probes/artifact-probe-smoke"],
    ["POST", "/api/v1/sycophancy-probes/run"],
    ["GET", "/api/v1/sycophancy-probes/sycophancy-probe-smoke"],
    ["POST", "/api/v1/obfuscation-stress-runs"],
    ["GET", "/api/v1/obfuscation-stress-runs/obfuscation-stress-smoke"],
    ["POST", "/api/v1/sanity-baselines/run"],
    ["GET", "/api/v1/sanity-baselines/sanity-baseline-smoke"],
    ["POST", "/api/v1/human-ceiling-runs"],
    ["GET", "/api/v1/human-ceiling-runs/human-ceiling-smoke"],
    ["POST", "/api/v1/leaderboards"],
    ["GET", "/api/v1/leaderboards/leaderboard-smoke"],
    ["POST", "/api/v1/evaluations/eval-smoke/failure-audits"],
    ["GET", "/api/v1/evaluations/eval-smoke/failure-audits"],
    ["POST", "/api/v1/ux-simplification-policies"],
    ["GET", "/api/v1/ux-simplification-policies/ux-policy-smoke"],
    ["POST", "/api/v1/ux-simplification-reviews"],
    ["GET", "/api/v1/ux-simplification-reviews/ux-review-smoke"],
    ["POST", "/api/v1/screen-state-payloads"],
    ["GET", "/api/v1/screen-state-payloads/screen-state-smoke"],
    ["POST", "/api/v1/state-transitions"],
    ["GET", "/api/v1/state/rating/rating-state-smoke"],
    ["GET", "/api/v1/raters/me/data-profile"],
    ["POST", "/api/v1/raters/me/data-consent"],
    ["POST", "/api/v1/raters/me/data-restriction-request"],
    ["POST", "/api/v1/raters/me/withdrawal-requests"],
    ["GET", "/api/v1/raters/me/withdrawal-requests/withdrawal-smoke"],
    ["GET", "/api/v1/raters/me/calibration-dashboard"],
    ["POST", "/api/v1/raters/me/remediation/module-smoke/complete"],
    ["POST", "/api/v1/visibility-policies"],
    ["GET", "/api/v1/visibility-policies/visibility-policy-smoke"],
    ["POST", "/api/v1/rating-workflow-profiles"],
    ["GET", "/api/v1/rating-workflow-profiles/rating-profile-smoke"],
    ["POST", "/api/v1/ui-experiment-policies"],
    ["GET", "/api/v1/ui-experiment-policies/ui-experiment-smoke"],
    ["POST", "/api/v1/pre-submit-assist-policies"],
    ["GET", "/api/v1/pre-submit-assist-policies/pre-submit-assist-smoke"],
    ["POST", "/api/v1/accessibility-conformance-reports"],
    ["GET", "/api/v1/accessibility-conformance-reports/accessibility-smoke"],
    ["POST", "/api/v1/volunteer-incentive-policies"],
    ["GET", "/api/v1/volunteer-incentive-policies/volunteer-incentive-smoke"],
    ["POST", "/api/v1/rater-qualification-records"],
    ["GET", "/api/v1/rater-qualification-records/rater-qualification-smoke"],
    ["POST", "/api/v1/language-artifact-assessments"],
    ["GET", "/api/v1/language-artifact-assessments/language-artifact-smoke"],
    ["POST", "/api/v1/source-recognition-events"],
    ["GET", "/api/v1/source-recognition-events/source-recognition-smoke"],
    ["POST", "/api/v1/model-provider-data-handling-policies"],
    ["GET", "/api/v1/model-provider-data-handling-policies/model-provider-policy-smoke"],
    ["POST", "/api/v1/task-output-eligibility-policies"],
    ["GET", "/api/v1/task-output-eligibility-policies/task-output-eligibility-smoke"],
    ["POST", "/api/v1/score-input-policies"],
    ["GET", "/api/v1/score-input-policies/score-input-policy-smoke"],
    ["POST", "/api/v1/rater-instruction-render-versions"],
    ["GET", "/api/v1/rater-instruction-render-versions/rater-instruction-render-smoke"],
    ["POST", "/api/v1/rubric-lint-configs"],
    ["GET", "/api/v1/rubric-lint-configs/rubric-lint-config-smoke"],
    ["POST", "/api/v1/rubric-lint-events"],
    ["GET", "/api/v1/rubric-lint-events/rubric-lint-event-smoke"],
    ["POST", "/api/v1/item-issues"],
    ["GET", "/api/v1/item-issues/item-issue-smoke"],
    ["POST", "/api/v1/item-issues/item-issue-smoke/triage"],
    ["POST", "/api/v1/item-issues/item-issue-smoke/resolve"],
    ["POST", "/api/v1/item-issues/item-issue-smoke/quarantine"],
    ["POST", "/api/v1/rating-draft-sessions"],
    ["GET", "/api/v1/rating-draft-sessions/rating-draft-session-smoke"],
    ["POST", "/api/v1/score-confidence-annotations"],
    ["GET", "/api/v1/score-confidence-annotations/score-confidence-annotation-smoke"],
    ["POST", "/api/v1/rater-score-confidences"],
    ["GET", "/api/v1/rater-score-confidences/rater-score-confidence-smoke"],
    ["POST", "/api/v1/rationale-evidence-spans"],
    ["GET", "/api/v1/rationale-evidence-spans/rationale-evidence-span-smoke"],
    ["POST", "/api/v1/same-position-scratchpads"],
    ["GET", "/api/v1/same-position-scratchpads/same-position-scratchpad-smoke"],
    ["POST", "/api/v1/same-position-batch-reviews"],
    ["GET", "/api/v1/same-position-batch-reviews/same-position-batch-review-smoke"],
    ["POST", "/api/v1/correctness-claim-weight-worksheets"],
    ["GET", "/api/v1/correctness-claim-weight-worksheets/correctness-claim-weight-worksheet-smoke"],
    ["POST", "/api/v1/external-assistance-declarations"],
    ["GET", "/api/v1/external-assistance-declarations/external-assistance-declaration-smoke"],
    ["POST", "/api/v1/protected-artifact-retention-records"],
    ["GET", "/api/v1/protected-artifact-retention-records/protected-artifact-retention-smoke"],
    ["POST", "/api/v1/blinding-preview-audits"],
    ["GET", "/api/v1/blinding-preview-audits/blinding-preview-smoke"],
    ["POST", "/api/v1/partial-task-outputs"],
    ["GET", "/api/v1/partial-task-outputs/partial-task-smoke"],
    ["GET", "/api/v1/raters/me/exposure-eligibility"],
    ["POST", "/api/v1/raters/demo-rater/position-cluster-exposures"],
    ["POST", "/api/v1/spot-checks"],
    ["GET", "/api/v1/spot-checks/spot-check-smoke"],
    ["POST", "/api/v1/adjudication-triage-items"],
    ["GET", "/api/v1/adjudication-triage-items/triage-smoke"],
    ["POST", "/api/v1/diagnostic-deferrals"],
    ["GET", "/api/v1/diagnostic-deferrals/diagnostic-deferral-smoke"],
    ["POST", "/api/v1/queue-policy-snapshots"],
    ["GET", "/api/v1/queue-policy-snapshots/queue-policy-smoke"],
    ["POST", "/api/v1/assignment-selection-audits"],
    ["GET", "/api/v1/assignment-selection-audits"],
    ["GET", "/api/v1/assignment-selection-audits/assignment-selection-smoke"],
    ["POST", "/api/v1/model-inference-configs"],
    ["GET", "/api/v1/model-inference-configs/model-inference-smoke"],
    ["POST", "/api/v1/model-run-environments"],
    ["GET", "/api/v1/model-run-environments/model-run-env-smoke"],
    ["POST", "/api/v1/rater-item-conflicts"],
    ["GET", "/api/v1/rater-item-conflicts/rater-conflict-smoke"],
    ["POST", "/api/v1/assignments/assign-ai-base-rate/conflict-screen"],
    ["POST", "/api/v1/rater-training-exposure-snapshots"],
    ["GET", "/api/v1/rater-training-exposure-snapshots/training-exposure-smoke"],
    ["GET", "/api/v1/assignments/assign-ai-base-rate/training-exposure-snapshot"],
    ["GET", "/api/v1/raters/me/training-exposure"],
    ["POST", "/api/v1/release-errata"],
    ["GET", "/api/v1/release-errata/release-erratum-smoke"],
    ["POST", "/api/v1/releases/october-2026-demo/supersede"],
    ["POST", "/api/v1/schedule-status-snapshots"],
    ["GET", "/api/v1/schedule-status-snapshots/schedule-status-smoke"],
    ["GET", "/api/v1/releases/october-2026-demo/schedule-status"],
    ["POST", "/api/v1/governance-approvals"],
    ["GET", "/api/v1/governance-approvals/governance-approval-smoke"],
    ["POST", "/api/v1/protected-artifacts/protected-artifact-smoke/revalidate"],
    ["GET", "/api/v1/protected-artifact-revalidations/protected-artifact-revalidation-smoke"],
    ["POST", "/api/v1/benchmark-submission-policies"],
    ["GET", "/api/v1/benchmark-submission-policies/benchmark-submission-policy-smoke"],
    ["POST", "/api/v1/benchmark-submissions"],
    ["GET", "/api/v1/benchmark-submissions/benchmark-submission-smoke"],
    ["GET", "/api/v1/benchmark-submissions/benchmark-submission-smoke/aggregate-report"],
    ["POST", "/api/v1/screens/rating/feature-parity-check"],
    ["GET", "/api/v1/screens/rating/simplified-copy-preview"],
    ["GET", "/api/v1/screen-feature-parity-checks/screen-feature-parity-smoke"],
    ["GET", "/api/v1/simplified-copy-previews/simplified-copy-preview-smoke"],
    ["POST", "/api/v1/governed-bundle-canonicalization-profiles"],
    ["GET", "/api/v1/governed-bundle-canonicalization-profiles/profile-smoke"],
    ["POST", "/api/v1/governed-bundles"],
    ["GET", "/api/v1/governed-bundles/bundle-smoke"],
    ["POST", "/api/v1/governed-bundles/bundle-smoke/verify"],
    ["POST", "/api/v1/release-config-manifests"],
    ["GET", "/api/v1/release-config-manifests/manifest-smoke"],
    ["POST", "/api/v1/release-config-manifests/manifest-smoke/verify"],
    ["POST", "/api/v1/releases/october-2026-demo/freeze-config-manifest"],
    ["GET", "/api/v1/releases/october-2026-demo/config-manifest"],
    ["GET", "/api/v1/evaluations/eval-smoke/release-config-manifest"],
    ["POST", "/api/v1/policy-action-kinds"],
    ["GET", "/api/v1/policy-action-kinds/policy-action-kind-smoke"],
    ["POST", "/api/v1/policy-decisions"],
    ["GET", "/api/v1/policy-decisions/policy-decision-smoke"],
    ["POST", "/api/v1/policy-decisions/policy-decision-smoke/consume"],
    ["POST", "/api/v1/implementation-phase-gate-bundles"],
    ["GET", "/api/v1/implementation-phase-gate-bundles/implementation-phase-smoke"],
    ["GET", "/api/v1/implementation-phase"],
    ["POST", "/api/v1/queue-freshness-policies"],
    ["GET", "/api/v1/queue-freshness-policies/queue-freshness-smoke"],
    ["POST", "/api/v1/queues/assignment/stale-by-delay-scan"],
    ["POST", "/api/v1/client-surface-integrity-policies"],
    ["GET", "/api/v1/client-surface-integrity-policies/client-surface-policy-smoke"],
    ["POST", "/api/v1/client-surfaces/client-surface-policy-smoke/integrity-check"],
    ["POST", "/api/v1/sensitive-audit-chain/events"],
    ["GET", "/api/v1/sensitive-audit-chain/events"],
    ["GET", "/api/v1/sensitive-audit-chain/events/audit-event-smoke"],
    ["POST", "/api/v1/sensitive-audit-chain/verify"],
    ["GET", "/api/v1/evaluations/eval-smoke/report"],
  ];

  for (const [method, url] of routes) {
    const response = await invokeApi(context, { method, url });
    assert.notEqual(response.status, 404, `${method} ${url}`);
    assert.equal(response.body.error, "missing_bearer_token", `${method} ${url}`);
  }
});

test("Workflow console exposes templates for RLHF77 operator action endpoints", () => {
  const appSource = readFileSync("src/app.mjs", "utf8");
  const requiredTemplateSnippets = [
    'id: "rights-review"',
    'endpoint: () => "/api/v1/rights/review"',
    'id: "release-freeze"',
    'endpoint: () => "/api/v1/releases/freeze"',
    'id: "candidate-batch-model-judge-scores"',
    'endpoint: () => "/api/v1/candidate-batches/candidate-batch-demo/model-judge-scores"',
    'id: "candidate-review"',
    'endpoint: () => "/api/v1/candidates/candidate-critique-demo/review"',
    'id: "candidate-promotion"',
    'endpoint: () => "/api/v1/candidates/candidate-critique-demo/promote"',
    'id: "critique-generation-run"',
    'endpoint: () => "/api/v1/critique-generation-runs"',
    'id: "generated-critique-promotion"',
    'endpoint: () => "/api/v1/generated-critiques/generated-critique-demo/promote"',
    'id: "generation-evaluation-report"',
    'endpoint: () => "/api/v1/generation-evaluation-reports"',
    'id: "adjudication"',
    'endpoint: () => "/api/v1/adjudications"',
    'id: "adjudication-finalization"',
    'endpoint: () => "/api/v1/adjudications/adjudication-demo/finalize"',
    'id: "rating-check-action"',
    'endpoint: () => "/api/v1/ratings/rating-seed-ai-base-rate-r1/check"',
    'id: "label-snapshot"',
    'endpoint: () => "/api/v1/label-snapshots"',
    'id: "corpus-manifest"',
    'endpoint: () => "/api/v1/corpus-manifests"',
    'id: "training-export-artifact"',
    'endpoint: () => "/api/v1/training-exports"',
    'id: "export-manifest"',
    'endpoint: () => "/api/v1/exports/public"',
    'id: "prompt-template"',
    'endpoint: () => "/api/v1/prompt-templates"',
    'id: "model-improvement-run"',
    'endpoint: () => "/api/v1/model-improvement-runs"',
    'id: "artifact-probe"',
    'endpoint: () => "/api/v1/artifact-probes/run"',
    'id: "sanity-baseline"',
    'endpoint: () => "/api/v1/sanity-baselines/run"',
    'id: "human-ceiling-run"',
    'endpoint: () => "/api/v1/human-ceiling-runs"',
    'id: "leaderboard"',
    'endpoint: () => "/api/v1/leaderboards"',
  ];
  for (const snippet of requiredTemplateSnippets) {
    assert.ok(appSource.includes(snippet), snippet);
  }
});

test("state transition endpoint records rejected illegal transitions without advancing state", async () => {
  const auditStore = createMemoryAuditStore();
  const context = createApiContext({ sessionSecret: "unit-test-secret", auditStore });
  const adminToken = signSessionToken(demoUsers.find((item) => item.id === "demo-admin"), "unit-test-secret");
  const response = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/state-transitions",
    headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      transition: {
        id: "illegal-rating-transition",
        entityType: "rating",
        entityId: "rating-illegal-state",
        priorState: "draft",
        requestedNextState: "revision_proposed",
        guardChecks: ["initial_rating_lock_missing"],
        sourceTagProtectedVisibilityState: "source_tag_protected_visibility_preserved",
      },
    }),
  });
  assert.equal(response.status, 409);
  assert.equal(response.body.acceptedNextState, "draft");
  assert.deepEqual(response.body.failedGuardReasons, ["transition_not_allowed:draft->revision_proposed"]);

  const events = await auditStore.readWorkflowEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "workflow_state_transition_rejected");
  assert.equal(events[0].payload.workflowStateTransitionLog.acceptedNextState, "draft");
});

test("rater data-governance endpoints expose profile, consent, restrictions, and withdrawals for the authenticated rater", async () => {
  const auditStore = createMemoryAuditStore();
  const context = createApiContext({ sessionSecret: "unit-test-secret", auditStore });
  const raterToken = signSessionToken(demoUsers.find((item) => item.id === "demo-rater"), "unit-test-secret");
  const headers = { authorization: `Bearer ${raterToken}`, "content-type": "application/json" };

  const profile = await invokeApi(context, { method: "GET", url: "/api/v1/raters/me/data-profile", headers });
  assert.equal(profile.status, 200);
  assert.equal(profile.body.raterId, "demo-rater");
  assert.equal(profile.body.deIdentificationPolicy.publicArtifactsDefault, "deidentified");
  assert.equal(profile.body.deIdentificationPolicy.privateLearningDataExcludedFromModelTrainingExports, true);

  const consent = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/raters/me/data-consent",
    headers,
    body: JSON.stringify({
      raterDataConsent: {
        id: "rater-data-consent-api",
        noticeVersion: "rater-data-use-v1",
        dataCategoriesCovered: raterDataCategories,
        useScopesAcknowledged: raterDataUseScopes,
        dataProfileVisible: true,
        publicArtifactsDeidentifiedByDefault: true,
        identifiableAccessRestriction: "approved operational or research role access only",
        privateLearningDataExcludedFromReleaseAndTraining: true,
      },
    }),
  });
  assert.equal(consent.status, 201);

  const impersonation = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/raters/me/data-consent",
    headers,
    body: JSON.stringify({
      raterDataConsent: {
        id: "rater-data-consent-impersonation",
        raterId: "demo-expert",
        noticeVersion: "rater-data-use-v1",
        dataCategoriesCovered: raterDataCategories,
        useScopesAcknowledged: raterDataUseScopes,
        dataProfileVisible: true,
        publicArtifactsDeidentifiedByDefault: true,
        privateLearningDataExcludedFromReleaseAndTraining: true,
      },
    }),
  });
  assert.equal(impersonation.status, 403);

  const restriction = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/raters/me/data-restriction-request",
    headers,
    body: JSON.stringify({
      raterDataRestrictionRequest: {
        id: "rater-data-restriction-api",
        requestType: "identifiable_access_review",
        affectedDataCategories: ["session_pacing", "safe_decline_reasons"],
        actionTaken: "review_opened",
        requesterNotificationStatus: "notified",
      },
    }),
  });
  assert.equal(restriction.status, 201);

  const withdrawal = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/raters/me/withdrawal-requests",
    headers,
    body: JSON.stringify({
      volunteerDataWithdrawalRequest: {
        id: "withdrawal-api",
        requestType: "future_training_export_exclusion",
        affectedDataCategories: ["private_learning_dashboard", "future_training_export"],
        actionTaken: "future_training_export_exclusion_recorded",
        futureTrainingExportExcluded: true,
        frozenSnapshotImpact: "already_frozen_deidentified_label_snapshots_preserved",
        requesterNotificationStatus: "notified",
      },
    }),
  });
  assert.equal(withdrawal.status, 201);

  const withdrawalById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/raters/me/withdrawal-requests/withdrawal-api",
    headers,
  });
  assert.equal(withdrawalById.status, 200);
  assert.equal(withdrawalById.body.raterId, "demo-rater");

  const updatedProfile = await invokeApi(context, { method: "GET", url: "/api/v1/raters/me/data-profile", headers });
  assert.equal(updatedProfile.body.consent.submittedCount, 1);
  assert.equal(updatedProfile.body.restrictionRequests.length, 1);
  assert.equal(updatedProfile.body.withdrawalRequests.length, 1);
});

test("v1 rating endpoints persist blind ratings and enforce revision route identity", async () => {
  const auditStore = createMemoryAuditStore();
  const context = createApiContext({ sessionSecret: "unit-test-secret", auditStore });
  const token = signSessionToken(demoUsers.find((item) => item.id === "demo-rater"), "unit-test-secret");
  const rating = validBlindRating("rating-v1-blind");
  const blindResponse = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/ratings",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ rating }),
  });
  assert.equal(blindResponse.status, 201);
  assert.equal(blindResponse.body.ratingId, "rating-v1-blind");
  assert.equal((await auditStore.readRatingEvents()).length, 1);

  const revision = {
    ...validBlindRating("rating-v1-revision"),
    kind: "revision",
    parentRatingId: "rating-v1-blind",
    revisionReasonCode: "human_only_self_check",
    revisionComment: "Route identity test revision.",
  };
  const mismatchResponse = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/ratings/other-rating/revise",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ rating: revision }),
  });
  assert.equal(mismatchResponse.status, 400);
  assert.equal(mismatchResponse.body.error, "revision_path_mismatch");

  const revisionResponse = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/ratings/rating-v1-blind/revise",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ rating: revision }),
  });
  assert.equal(revisionResponse.status, 201);
  assert.equal(revisionResponse.body.ratingId, "rating-v1-revision");
  assert.equal((await auditStore.readRatingEvents()).length, 2);
});

test("v1 artifact endpoints expose existing report artifacts with role checks", async () => {
  const context = createApiContext({ sessionSecret: "unit-test-secret", auditStore: createMemoryAuditStore() });
  const adminToken = signSessionToken(demoUsers.find((item) => item.id === "demo-admin"), "unit-test-secret");
  const raterToken = signSessionToken(demoUsers.find((item) => item.id === "demo-rater"), "unit-test-secret");
  const adminHeaders = { authorization: `Bearer ${adminToken}`, "content-type": "application/json" };

  const qaDenied = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/qa/metrics",
    headers: { authorization: `Bearer ${raterToken}` },
  });
  assert.equal(qaDenied.status, 403);

  const certificationStart = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/certification/start",
    headers: adminHeaders,
    body: JSON.stringify({ raterId: "demo-rater" }),
  });
  assert.equal(certificationStart.status, 200);
  assert.equal(certificationStart.body.pack.id, "cert-tier-zero-2026-10");

  const certificationStatus = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/certification/demo-rater/status",
    headers: adminHeaders,
  });
  assert.equal(certificationStatus.status, 200);
  assert.equal(certificationStatus.body.raterId, "demo-rater");

  const qaMetrics = await invokeApi(context, { method: "GET", url: "/api/v1/qa/metrics", headers: adminHeaders });
  assert.equal(qaMetrics.status, 200);
  assert.equal(qaMetrics.body.rubricQaCoverage.id, "rubric-qa-coverage-october-2026-demo");

  const qaDrift = await invokeApi(context, { method: "GET", url: "/api/v1/qa/drift", headers: adminHeaders });
  assert.equal(qaDrift.status, 200);
  assert.equal(qaDrift.body.rubricDrift.id, "rubric-version-drift-october-2026-demo");

  const freeze = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/benchmark/candidates/freeze",
    headers: adminHeaders,
  });
  assert.equal(freeze.status, 200);
  assert.equal(freeze.body.id, "hidden-benchmark-freeze-october-2026-demo");

  const exposure = await invokeApi(context, { method: "GET", url: "/api/v1/benchmark/exposure", headers: adminHeaders });
  assert.equal(exposure.status, 200);
  assert.ok(exposure.body.events.length >= 1);

  const snapshot = await invokeApi(context, { method: "POST", url: "/api/v1/label-snapshots", headers: adminHeaders });
  assert.equal(snapshot.status, 200);
  assert.equal(snapshot.body.id, "snapshot-oct-api");

  const snapshotById = await invokeApi(context, { method: "GET", url: "/api/v1/label-snapshots/snapshot-oct-api", headers: adminHeaders });
  assert.equal(snapshotById.status, 200);
  assert.equal(snapshotById.body.id, "snapshot-oct-api");

  const missingSnapshot = await invokeApi(context, { method: "GET", url: "/api/v1/label-snapshots/missing", headers: adminHeaders });
  assert.equal(missingSnapshot.status, 404);

  const corpusManifest = await invokeApi(context, { method: "POST", url: "/api/v1/corpus-manifests", headers: adminHeaders });
  assert.equal(corpusManifest.status, 200);
  assert.equal(corpusManifest.body.id, "corpus-composition-october-2026-demo");

  const publicExport = await invokeApi(context, { method: "POST", url: "/api/v1/exports/public", headers: adminHeaders });
  assert.equal(publicExport.status, 200);
  assert.equal(publicExport.body.kind, "public");

  const internalExport = await invokeApi(context, { method: "POST", url: "/api/v1/exports/internal", headers: adminHeaders });
  assert.equal(internalExport.status, 200);
  assert.equal(internalExport.body.kind, "internal");

  const trainingExport = await invokeApi(context, { method: "POST", url: "/api/v1/training-exports", headers: adminHeaders });
  assert.equal(trainingExport.status, 200);
  assert.equal(trainingExport.body.id, "training-export-october-2026-demo");

  const promptTemplate = await invokeApi(context, { method: "GET", url: "/api/v1/prompt-templates/project-full-rubric-v1", headers: adminHeaders });
  assert.equal(promptTemplate.status, 200);
  assert.equal(promptTemplate.body.id, "project-full-rubric-v1");

  const evaluation = await invokeApi(context, { method: "GET", url: "/api/v1/evaluations/eval-full-rubric-demo", headers: adminHeaders });
  assert.equal(evaluation.status, 200);
  assert.equal(evaluation.body.id, "eval-full-rubric-demo");

  const predictions = await invokeApi(context, { method: "GET", url: "/api/v1/evaluations/eval-full-rubric-demo/predictions", headers: adminHeaders });
  assert.equal(predictions.status, 200);
  assert.equal(predictions.body.predictions.length, 4);

  const evaluationReport = await invokeApi(context, { method: "GET", url: "/api/v1/evaluations/eval-full-rubric-demo/report", headers: adminHeaders });
  assert.equal(evaluationReport.status, 200);
  assert.equal(evaluationReport.body.evaluationRun.id, "eval-full-rubric-demo");

  const calibration = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/calibration-runs/calibration-october-2026-demo-eval-full-rubric-demo",
    headers: adminHeaders,
  });
  assert.equal(calibration.status, 200);
  assert.equal(calibration.body.id, "calibration-october-2026-demo-eval-full-rubric-demo");

  const humanCeiling = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/human-ceiling-runs/human-ceiling-saturation-october-2026-demo",
    headers: adminHeaders,
  });
  assert.equal(humanCeiling.status, 200);
  assert.equal(humanCeiling.body.id, "human-ceiling-saturation-october-2026-demo");

  const leaderboard = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/leaderboards/leaderboard-october-2026-demo-weighted_pairwise",
    headers: adminHeaders,
  });
  assert.equal(leaderboard.status, 200);
  assert.equal(leaderboard.body.id, "leaderboard-october-2026-demo-weighted_pairwise");

  const failureAudits = await invokeApi(context, { method: "GET", url: "/api/v1/evaluations/eval-full-rubric-demo/failure-audits", headers: adminHeaders });
  assert.equal(failureAudits.status, 200);
  assert.equal(failureAudits.body.audits.length, 1);
});

test("v1 workflow endpoints persist lifecycle events with role and assignment checks", async () => {
  const auditStore = createMemoryAuditStore();
  const context = createApiContext({ sessionSecret: "unit-test-secret", auditStore });
  const adminToken = signSessionToken(demoUsers.find((item) => item.id === "demo-admin"), "unit-test-secret");
  const raterToken = signSessionToken(demoUsers.find((item) => item.id === "demo-rater"), "unit-test-secret");
  const adminHeaders = { authorization: `Bearer ${adminToken}`, "content-type": "application/json" };
  const raterHeaders = { authorization: `Bearer ${raterToken}`, "content-type": "application/json" };

  const position = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/intake/positions",
    headers: adminHeaders,
    body: JSON.stringify({
      position: {
        id: "pos-workflow-new",
        text: "A release should not claim LMCA comparability unless the rater-visible position text and critique text are frozen before labels and model outputs are compared.",
        split: "public_train",
        topicFamily: "miscellaneous_topics",
        conceptualScope: "primarily_conceptual",
        groundTruthAvailability: "no_realistically_accessible_ground_truth",
        rightsStatus: "cleared_internal",
        adminTags: ["candidate-intake"],
      },
    }),
  });
  assert.equal(position.status, 201);
  assert.equal(position.body.resourceId, "pos-workflow-new");
  assert.equal(position.body.accessAudit.workflowAppendOnly, true);

  const critique = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/intake/critiques",
    headers: adminHeaders,
    body: JSON.stringify({
      critique: {
        id: "crit-workflow-new",
        positionId: "pos-workflow-new",
        text: "The position requires frozen text, but it does not by itself show that the same-position context was also frozen for both humans and models.",
        sourceType: "human_written",
        authorshipType: "expert",
        lengthBand: "medium",
        styleBand: "direct",
        marginalInformativeness: "new_objection_type",
      },
    }),
  });
  assert.equal(critique.status, 201);
  assert.equal(critique.body.resourceId, "crit-workflow-new");

  const rightsReview = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/rights/review",
    headers: adminHeaders,
    body: JSON.stringify({
      rightsReview: {
        id: "rights-review-workflow-new",
        itemId: "pos-workflow-new::crit-workflow-new",
        reviewerId: "demo-admin",
        rightsStatus: "cleared_internal",
        releaseScope: "internal_and_public_summary_allowed",
      },
    }),
  });
  assert.equal(rightsReview.status, 201);

  const releaseFreeze = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/releases/freeze",
    headers: adminHeaders,
    body: JSON.stringify({
      releaseFreeze: {
        id: "release-freeze-workflow-new",
        releaseId: "october-2026-demo",
        corpusManifestId: "corpus-composition-october-2026-demo",
        labelSnapshotId: "snapshot-oct-api",
        releaseGateProfileId: "release-gate-workflow-new",
        freezeStatus: "candidate_freeze_recorded",
        targetScaleStatus: "not_target_scale_until_120_positions_360_critiques_1440_blind_ratings",
        frozenBy: "demo-admin",
        frozenAt: "2026-10-01T00:00:00.000Z",
      },
    }),
  });
  assert.equal(releaseFreeze.status, 201);

  const emptyPosition = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/intake/positions",
    headers: adminHeaders,
    body: JSON.stringify({ position: { id: "pos-empty-intake" } }),
  });
  assert.equal(emptyPosition.status, 400);
  assert.match(emptyPosition.body.detail, /text/);

  const positionDenied = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/intake/positions",
    headers: raterHeaders,
    body: JSON.stringify({ position: { id: "pos-rater-denied" } }),
  });
  assert.equal(positionDenied.status, 403);

  const certificationRecord = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/certification-records",
    headers: adminHeaders,
    body: JSON.stringify({
      certificationRecord: {
        id: "certification-record-workflow-new",
        raterId: "demo-rater",
        packVersion: "cert-tier-zero-2026-10",
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
    }),
  });
  assert.equal(certificationRecord.status, 201);

  const certificationRecordById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/certification-records/certification-record-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(certificationRecordById.status, 200);
  assert.equal(certificationRecordById.body.id, "certification-record-workflow-new");

  const exposureLog = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/exposure-logs",
    headers: adminHeaders,
    body: JSON.stringify({
      exposureLog: {
        id: "exposure-log-workflow-new",
        userIdHash: "sha256-demo-admin",
        artifactId: "hidden-benchmark-freeze-october-2026-demo",
        splitName: "hidden_benchmark",
        action: "membership_view",
        purpose: "release_freeze",
        accessPhase: "pre_freeze",
      },
    }),
  });
  assert.equal(exposureLog.status, 201);

  const exposureLogById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/exposure-logs/exposure-log-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(exposureLogById.status, 200);
  assert.equal(exposureLogById.body.id, "exposure-log-workflow-new");

  const revisionRecord = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/revisions",
    headers: adminHeaders,
    body: JSON.stringify({
      revisionRecord: {
        id: "revision-record-workflow-new",
        ratingIdPrior: "rating-ai-base-rate-a",
        ratingIdNew: "rating-revision-workflow-new",
        reasonCode: "human_only_self_check",
        revisionComment: "Rater corrected a strength-centrality allocation after rereading the critique.",
        discussionThreadId: "discussion-thread-workflow-new",
      },
    }),
  });
  assert.equal(revisionRecord.status, 201);

  const revisionRecordById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/revisions/revision-record-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(revisionRecordById.status, 200);
  assert.equal(revisionRecordById.body.id, "revision-record-workflow-new");

  const itemTextVersion = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/item-text-versions",
    headers: adminHeaders,
    body: JSON.stringify({
      itemTextVersion: {
        id: "item-text-version-workflow-new",
        itemType: "critique",
        itemId: "crit-ai-base-rate",
        canonicalTextHash: "sha256-test-canonical",
        raterVisibleRenderedTextHash: "sha256-test-rater-visible",
        modelVisibleRenderedTextHash: "sha256-test-model-visible",
        textVersionStatus: "frozen_for_release_candidate",
      },
    }),
  });
  assert.equal(itemTextVersion.status, 201);

  const itemTextVersionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/item-text-versions/item-text-version-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(itemTextVersionById.status, 200);
  assert.equal(itemTextVersionById.body.id, "item-text-version-workflow-new");

  const ratingContextSnapshot = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/rating-context-snapshots",
    headers: adminHeaders,
    body: JSON.stringify({
      ratingContextSnapshot: {
        id: "rating-context-workflow-new",
        positionId: "pos-ai-prior",
        targetCritiqueId: "crit-ai-base-rate",
        contextPolicy: "prior_siblings_in_session",
        siblingCritiqueIdsShown: ["crit-ai-base-rate"],
        siblingItemTextVersionIds: ["ctv-crit-ai-base-rate-v1"],
        laterSiblingAbsent: true,
      },
    }),
  });
  assert.equal(ratingContextSnapshot.status, 201);

  const ratingContextSnapshotById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/rating-context-snapshots/rating-context-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(ratingContextSnapshotById.status, 200);
  assert.equal(ratingContextSnapshotById.body.id, "rating-context-workflow-new");

  const pairwiseComparisonSnapshot = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/pairwise-comparison-snapshots",
    headers: adminHeaders,
    body: JSON.stringify({
      pairwiseComparisonSnapshot: {
        id: "pairwise-snapshot-workflow-new",
        labelSnapshotId: "snapshot-oct-api",
        targetLabelVersion: "initial_mean",
        positionIds: ["pos-ai-prior"],
        critiqueIdsByPosition: { "pos-ai-prior": ["crit-ai-base-rate", "crit-ai-generic"] },
        itemTextVersionIds: ["ptv-pos-ai-prior-v1", "ctv-crit-ai-base-rate-v1", "ctv-ai-generic-v1"],
        tiePolicy: "exclude_human_ties_model_tie_half_margin",
        nonTiedComparisonEdges: [["crit-ai-base-rate", "crit-ai-generic"]],
      },
    }),
  });
  assert.equal(pairwiseComparisonSnapshot.status, 201);

  const pairwiseComparisonSnapshotById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/pairwise-comparison-snapshots/pairwise-snapshot-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(pairwiseComparisonSnapshotById.status, 200);
  assert.equal(pairwiseComparisonSnapshotById.body.id, "pairwise-snapshot-workflow-new");

  const raterReliabilityWeightModel = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/rater-reliability-weight-models",
    headers: adminHeaders,
    body: JSON.stringify({
      raterReliabilityWeightModel: {
        id: "reliability-weight-model-workflow-new",
        reliabilityWeightModelId: "uniform-v1-with-sensitivity",
        modelName: "october_demo_dimension_reliability",
        version: "v1",
        fitDataSource: "certification_and_adjudicated_training_mix",
        protectedSplitExclusions: ["hidden_benchmark", "internal_validation"],
        fittedAt: "2026-10-01T00:00:00.000Z",
        fittedBy: "demo-admin",
        raterWeightsByDimension: { "demo-rater": { overall: 0.45 }, "demo-expert": { overall: 0.55 } },
        weightCaps: { maxSingleRaterShare: 0.6 },
        effectiveSampleSizeByDimension: { overall: 18, clarity: 18, correctness: 16 },
        maximumSingleRaterWeightShare: 0.55,
        unweightedSensitivitySnapshotId: "snapshot-oct-api-unweighted",
        medianSensitivitySnapshotId: "snapshot-oct-api-median",
        freezeVersion: "october-2026-demo.1",
      },
    }),
  });
  assert.equal(raterReliabilityWeightModel.status, 201);

  const raterReliabilityWeightModelById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/rater-reliability-weight-models/reliability-weight-model-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(raterReliabilityWeightModelById.status, 200);
  assert.equal(raterReliabilityWeightModelById.body.id, "reliability-weight-model-workflow-new");

  const rater = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/raters",
    headers: adminHeaders,
    body: JSON.stringify({
      rater: {
        id: "rater-workflow-new",
        tier: "graduate",
        topicExpertise: { ai_safety: "strong", decision_theory: "working" },
        certificationStatus: "certified_for_live_blind_rating",
        activeReliabilityWeightModelId: "uniform-v1-with-sensitivity",
        conflictDisclosures: ["no_known_conflict"],
      },
    }),
  });
  assert.equal(rater.status, 201);

  const raterById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/raters/rater-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(raterById.status, 200);
  assert.equal(raterById.body.id, "rater-workflow-new");

  const assignment = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/assignments",
    headers: adminHeaders,
    body: JSON.stringify({
      assignment: {
        id: "assignment-workflow-new",
        raterId: "demo-rater",
        raterSessionId: "rater-session-workflow-new",
        positionId: "pos-ai-prior",
        critiqueId: "crit-ai-base-rate",
        assignmentType: "live",
        workflowProfileId: "rating-workflow-profile-workflow-new",
        workflowProfileVersion: "workflow-profile-rlhf88-v1",
        scoreInputPolicyId: "score-input-policy-workflow-new",
        requiredUiPanelSet: ["score_fields", "short_rationale", "safe_decline", "source_recognition", "item_issue_report"],
        optionalUiPanelSet: ["evidence_spans", "interpretation_target_map", "correctness_verification_workspace"],
        preRatingSelfScreenStatus: "passed",
        raterItemConflictCheckStatus: "no_conflict",
        independentBlindEligibilityStatus: "eligible",
        declineOrReassignmentStatus: "not_declined",
        declineReasonCode: null,
        blindState: "blind_initial",
        sourceTagVisibilityState: "hidden_before_initial_lock",
        topicRoutingBasisAdminOnly: "topic competence used without exposing source tags",
        validationMembershipBlindToRater: true,
        ratingContextSnapshotId: "rating-context-workflow-new",
        samePositionSessionId: "same-position-session-workflow-new",
        samePositionOrderPolicy: "counterbalanced",
        orderCounterbalanceBucket: "bucket-a",
        positionOrderIndex: 1,
        siblingCritiquesSeenPriorCount: 0,
        siblingCritiquesSeenPriorIds: [],
        laterSiblingCritiquesAbsentAtSubmission: true,
        positionLengthBand: "short",
        critiqueLengthBand: "short",
        expectedEffortBand: "ordinary_live",
        startedAt: "2026-10-01T00:24:00.000Z",
        submittedAt: null,
        activeTimeSeconds: 0,
        idleGapSummary: "not_started",
        interruptionCount: 0,
        draftAutosaveStatus: "not_started",
        lastAutosavedAt: "2026-10-01T00:24:00.000Z",
        draftDependencyStaleStatus: "current",
        resumeCount: 0,
        sessionPacingState: "within_target",
        fatigueWarningState: "none",
        uiMode: "task_first_simplified",
        rubricAnchorPanelVersion: "appendix-f-anchor-v1",
        preSubmitLintPolicyVersion: "rubric-lint-rlhf88-v1",
      },
    }),
  });
  assert.equal(assignment.status, 201);

  const assignmentById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/assignments/assignment-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(assignmentById.status, 200);
  assert.equal(assignmentById.body.id, "assignment-workflow-new");
  assert.equal(assignmentById.body.independentBlindEligibilityStatus, "eligible");
  assert.equal(assignmentById.body.validationMembershipBlindToRater, true);

  const incompleteAssignment = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/assignments",
    headers: adminHeaders,
    body: JSON.stringify({
      assignment: {
        id: "assignment-workflow-incomplete",
        raterId: "demo-rater",
        positionId: "pos-ai-prior",
        critiqueId: "crit-ai-base-rate",
      },
    }),
  });
  assert.equal(incompleteAssignment.status, 400);
  assert.equal(incompleteAssignment.body.error, "invalid_workflow_payload");
  assert.match(incompleteAssignment.body.detail, /raterSessionId/);

  const goldItem = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/gold-items",
    headers: adminHeaders,
    body: JSON.stringify({
      goldItem: {
        id: "gold-item-workflow-new",
        releaseId: "october-2026-demo",
        itemId: "pos-ai-prior::crit-ai-base-rate",
        positionId: "pos-ai-prior",
        critiqueId: "crit-ai-base-rate",
        rubricVersion: "lmca-seven-dim-v1",
        goldRole: "certification_and_drift_monitoring",
        adjudicatedScores: { overall: 0.72, centrality: 0.78, strength: 0.66, correctness: 0.7, clarity: 0.86, dead_weight: 0.18, single_issue: 0.76 },
        adjudicationRationale: "Representative conceptual critique with clear disagreement about base-rate relevance.",
        protectedEvaluationExclusion: true,
      },
    }),
  });
  assert.equal(goldItem.status, 201);

  const goldItemById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/gold-items/gold-item-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(goldItemById.status, 200);
  assert.equal(goldItemById.body.id, "gold-item-workflow-new");

  const sourceAnchorExample = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/source-anchor-examples",
    headers: adminHeaders,
    body: JSON.stringify({
      sourceAnchorExample: {
        id: "source-anchor-workflow-new",
        releaseId: "october-2026-demo",
        suiteVersion: "lmca-public-source-anchors-2026-10-workflow",
        sourceExampleFamily: "table4_model_failure",
        publicSourceReference: "Workflow public Table 4 model-failure anchor",
        itemId: "lmca-public::table4-model-failure-workflow",
        positionClusterId: "lmca-public-table4-model-failure",
        split: "public_training_qa_anchor",
        exposurePolicy: "public_training_qa_only",
        allowedUse: ["documentation", "training", "certification", "prompt_regression"],
        excludedFromProtectedEvaluation: true,
        promptRegressionEligible: true,
        certificationExposureEligible: true,
        intendedLesson: "model_failure",
        expectedLabelSummary: "over_crediting_generic_or_vague_critique",
        targetDimensions: ["centrality", "strength", "overall"],
      },
    }),
  });
  assert.equal(sourceAnchorExample.status, 201);

  const sourceAnchorExampleById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/source-anchor-examples/source-anchor-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(sourceAnchorExampleById.status, 200);
  assert.equal(sourceAnchorExampleById.body.id, "source-anchor-workflow-new");

  const benchmarkSplitMember = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/benchmark-split-members",
    headers: adminHeaders,
    body: JSON.stringify({
      benchmarkSplitMember: {
        id: "split-member-workflow-new",
        releaseId: "october-2026-demo",
        itemId: "pos-ai-prior::crit-ai-base-rate",
        split: "hidden_benchmark_candidate",
        leakPreventionStatus: "excluded_from_training_prompt_tuning_and_public_export",
      },
    }),
  });
  assert.equal(benchmarkSplitMember.status, 201);

  const benchmarkSplitMemberById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/benchmark-split-members/split-member-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(benchmarkSplitMemberById.status, 200);
  assert.equal(benchmarkSplitMemberById.body.id, "split-member-workflow-new");

  const rightsRecord = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/rights-records",
    headers: adminHeaders,
    body: JSON.stringify({
      rightsRecord: {
        id: "rights-record-workflow-new",
        releaseId: "october-2026-demo",
        artifactId: "pos-ai-prior::crit-ai-base-rate",
        artifactKind: "position_critique_item",
        rightsStatus: "hidden_benchmark_export_allowed",
        sourceLanguage: "en",
        translationRoute: "none_original_english",
        taskFormat: "short essay claim",
        sourceDomainSuitability: "suitable_conceptual",
      },
    }),
  });
  assert.equal(rightsRecord.status, 201);

  const rightsRecordById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/rights-records/rights-record-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(rightsRecordById.status, 200);
  assert.equal(rightsRecordById.body.id, "rights-record-workflow-new");

  const releaseVersion = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/release-versions",
    headers: adminHeaders,
    body: JSON.stringify({
      releaseVersion: {
        id: "release-version-workflow-new",
        releaseId: "october-2026-demo",
        version: "october-2026-demo.1",
        corpusManifestId: "corpus-composition-october-2026-demo",
        labelSnapshotId: "snapshot-oct-api",
        metricConfigId: "metric-config-workflow-new",
        gateProfileId: "release-gate-workflow-new",
        status: "method_preserving_demo_not_target_scale",
        releaseNotes: "Workflow release version is recorded but remains below October target scale.",
        frozenAt: "2026-10-01T00:00:00.000Z",
      },
    }),
  });
  assert.equal(releaseVersion.status, 201);

  const releaseVersionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/release-versions/release-version-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(releaseVersionById.status, 200);
  assert.equal(releaseVersionById.body.id, "release-version-workflow-new");

  const labelSnapshotArtifact = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/label-snapshots",
    headers: adminHeaders,
    body: JSON.stringify({
      labelSnapshot: {
        id: "label-snapshot-workflow-new",
        releaseId: "october-2026-demo",
        targetLabelVersion: "initial_mean",
        snapshotFamily: "initial_mean",
        itemTextVersionIds: ["ptv-pos-ai-prior-v1", "ctv-crit-ai-base-rate-v1"],
        pairwiseComparisonSnapshotId: "pairwise-snapshot-workflow-new",
        ratingCountDenominatorSummary: { blindInitialRatings: 6, revisions: 0, totalRows: 7 },
        createdBy: "demo-admin",
      },
    }),
  });
  assert.equal(labelSnapshotArtifact.status, 201);

  const labelSnapshotArtifactById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/label-snapshots/label-snapshot-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(labelSnapshotArtifactById.status, 200);
  assert.equal(labelSnapshotArtifactById.body.id, "label-snapshot-workflow-new");

  const corpusManifestArtifact = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/corpus-manifests",
    headers: adminHeaders,
    body: JSON.stringify({
      corpusManifest: {
        id: "corpus-manifest-workflow-new",
        releaseId: "october-2026-demo",
        positionCount: 4,
        critiqueCount: 6,
        blindInitialRatingCount: 6,
        ratingsIgnoringRevisionsCount: 7,
        sourceCompositionSummary: "demo corpus plus submitted workflow intake records",
        createdBy: "demo-admin",
      },
    }),
  });
  assert.equal(corpusManifestArtifact.status, 201);

  const corpusManifestArtifactById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/corpus-manifests/corpus-manifest-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(corpusManifestArtifactById.status, 200);
  assert.equal(corpusManifestArtifactById.body.id, "corpus-manifest-workflow-new");

  const trainingExportArtifact = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/training-exports",
    headers: adminHeaders,
    body: JSON.stringify({
      trainingExport: {
        id: "training-export-workflow-new",
        releaseId: "october-2026-demo",
        sourceLabelSnapshotId: "label-snapshot-workflow-new",
        sourceSplits: ["public_train"],
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        targetLabelVersion: "initial_mean",
        targetFields: ["overall", "centrality_x_strength"],
        promptTrackExposurePolicy: "project_full_rubric_training",
        createdBy: "demo-admin",
      },
    }),
  });
  assert.equal(trainingExportArtifact.status, 201);

  const trainingExportArtifactById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/training-exports/training-export-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(trainingExportArtifactById.status, 200);
  assert.equal(trainingExportArtifactById.body.id, "training-export-workflow-new");

  const exportManifestArtifact = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/exports/public",
    headers: adminHeaders,
    body: JSON.stringify({
      exportManifest: {
        id: "public-export-manifest-workflow-new",
        kind: "public",
        releaseId: "october-2026-demo",
        labelSnapshotId: "label-snapshot-workflow-new",
        includedSplits: ["public_train", "public_dev"],
        excludedSplits: ["internal_validation", "hidden_benchmark"],
        hiddenBenchmarkExcluded: true,
        rightsClearedOnly: true,
        counts: { positions: 2, critiques: 3 },
        createdBy: "demo-admin",
      },
    }),
  });
  assert.equal(exportManifestArtifact.status, 201);

  const releaseGateProfile = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/release-gate-profiles",
    headers: adminHeaders,
    body: JSON.stringify({
      releaseGateProfile: {
        id: "release-gate-workflow-new",
        releaseId: "october-2026-demo",
        sourceCriticalCoreGates: ["position_critique_units", "blind_initial"],
      },
    }),
  });
  assert.equal(releaseGateProfile.status, 201);

  const releaseGateProfileById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/release-gate-profiles/release-gate-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(releaseGateProfileById.status, 200);
  assert.equal(releaseGateProfileById.body.id, "release-gate-workflow-new");

  const primaryRaterAnchorPolicy = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/primary-rater-anchor-policies",
    headers: adminHeaders,
    body: JSON.stringify({
      primaryRaterAnchorPolicy: {
        id: "primary-rater-policy-workflow-new",
        releaseId: "october-2026-demo",
        selectionRule: "max_blind_initial_coverage_tie_break_rater_id",
        coverageThreshold: 0.2,
        prohibitedPostHocCriteria: ["agreement_with_model_outputs", "desired_leaderboard_effect", "post_hoc_target_label_switching"],
        predeclaredAt: "2026-09-30T12:00:00.000Z",
      },
    }),
  });
  assert.equal(primaryRaterAnchorPolicy.status, 201);

  const primaryRaterAnchorPolicyById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/primary-rater-anchor-policies/primary-rater-policy-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(primaryRaterAnchorPolicyById.status, 200);
  assert.equal(primaryRaterAnchorPolicyById.body.id, "primary-rater-policy-workflow-new");

  const comparabilityClaim = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/comparability-claims",
    headers: adminHeaders,
    body: JSON.stringify({
      comparabilityClaim: {
        id: "comparability-claim-workflow-new",
        releaseId: "october-2026-demo",
        methodPreservingStatus: "passes",
        corpusScaleStatus: "fails_until_target_loaded",
        validationDesignStatus: "fails_until_appendix_c_scale_validation_complete",
        targetLabelRaterStatus: "partial_primary_rater_anchor_policy_required",
        limitationsText: "Claim remains limited until target-scale corpus and target-identical labels are fully loaded.",
      },
    }),
  });
  assert.equal(comparabilityClaim.status, 201);

  const comparabilityClaimById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/comparability-claims/comparability-claim-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(comparabilityClaimById.status, 200);
  assert.equal(comparabilityClaimById.body.id, "comparability-claim-workflow-new");

  const candidateBatch = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/candidate-batches",
    headers: adminHeaders,
    body: JSON.stringify({
      candidateBatch: {
        id: "candidate-batch-workflow-new",
        positionId: "pos-ai-prior",
        generatorSourceDescription: "Mixed human and LLM-generated active-learning intake batch.",
        promptTemplateVersion: "critique-generator-v1",
        judgeModelSet: ["judge-model-a", "judge-model-b"],
        generatedOrIngestedCandidateCount: 20,
        judgedCandidateCount: 18,
        selectionPolicyVersion: "selection-policy-october-2026-v1",
        batchStatus: "judged_pending_selection_audit",
      },
    }),
  });
  assert.equal(candidateBatch.status, 201);

  const candidateBatchById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/candidate-batches/candidate-batch-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(candidateBatchById.status, 200);
  assert.equal(candidateBatchById.body.id, "candidate-batch-workflow-new");

  const candidateCritique = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/candidate-critiques",
    headers: adminHeaders,
    body: JSON.stringify({
      candidateCritique: {
        id: "candidate-critique-workflow-new",
        candidateBatchId: "candidate-batch-workflow-new",
        positionId: "pos-ai-prior",
        text: "The position underweights base-rate evidence from adjacent forecasting domains.",
        sourceType: "llm_generated",
        generationRoute: "critique_generation_run",
        selectionReason: "judge_disagreement_and_new_objection_type",
        reviewStatus: "pending_expert_review",
      },
    }),
  });
  assert.equal(candidateCritique.status, 201);

  const candidateCritiqueById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/candidate-critiques/candidate-critique-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(candidateCritiqueById.status, 200);
  assert.equal(candidateCritiqueById.body.id, "candidate-critique-workflow-new");

  const modelJudgeScore = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/model-judge-scores",
    headers: adminHeaders,
    body: JSON.stringify({
      modelJudgeScore: {
        id: "model-judge-score-workflow-new",
        candidateId: "candidate-critique-workflow-new",
        candidateBatchId: "candidate-batch-workflow-new",
        judgeRequestedModelAlias: "judge-model-a",
        judgeResolvedModelSnapshot: "judge-model-a-2026-10-01",
        promptVersion: "model-judge-v1",
        rawOutput: "{\"overall\":0.71}",
        parseStatus: "parsed",
        overallScore: 0.71,
        disagreementStatistics: { judgePairSpread: 0.18 },
        hiddenFromRatersBeforeInitialLock: true,
      },
    }),
  });
  assert.equal(modelJudgeScore.status, 201);

  const modelJudgeScoreById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/model-judge-scores/model-judge-score-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(modelJudgeScoreById.status, 200);
  assert.equal(modelJudgeScoreById.body.id, "model-judge-score-workflow-new");

  const candidateBatchModelJudgeScores = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/candidate-batches/candidate-batch-workflow-new/model-judge-scores",
    headers: adminHeaders,
    body: JSON.stringify({
      modelJudgeScores: {
        id: "candidate-batch-model-judge-scores-workflow-new",
        submittedScoreIds: ["model-judge-score-workflow-new"],
        batchCoveragePolicy: "all_candidates_judged_or_exclusion_recorded",
      },
    }),
  });
  assert.equal(candidateBatchModelJudgeScores.status, 201);
  assert.equal(candidateBatchModelJudgeScores.body.resourceId, "candidate-batch-model-judge-scores-workflow-new");

  const candidateReview = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/candidates/candidate-critique-workflow-new/review",
    headers: adminHeaders,
    body: JSON.stringify({
      candidateReview: {
        id: "candidate-review-workflow-new",
        reviewerId: "demo-expert",
        reviewStatus: "approved_for_live_queue",
        inclusionReason: "judge_disagreement_and_new_objection_type",
        benchmarkCandidatePolicy: "hidden_from_initial_raters",
      },
    }),
  });
  assert.equal(candidateReview.status, 201);
  assert.equal(candidateReview.body.resourceId, "candidate-review-workflow-new");

  const candidatePromotion = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/candidates/candidate-critique-workflow-new/promote",
    headers: adminHeaders,
    body: JSON.stringify({
      candidatePromotion: {
        id: "candidate-promotion-workflow-new",
        acceptedCritiqueId: "crit-workflow-new",
        promotionStatus: "promoted_to_blind_rating_queue",
        sourceMetadataHiddenFromRaters: true,
      },
    }),
  });
  assert.equal(candidatePromotion.status, 201);
  assert.equal(candidatePromotion.body.resourceId, "candidate-promotion-workflow-new");

  const activeLearningSelectionAudit = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/active-learning-selection-audits",
    headers: adminHeaders,
    body: JSON.stringify({
      activeLearningSelectionAudit: {
        id: "selection-audit-workflow-new",
        candidateBatchId: "candidate-batch-workflow-new",
        generatedOrIngestedCount: 20,
        judgedCount: 18,
        disagreementSelectedCount: 3,
        highRatedSelectedCount: 2,
        suspectedJudgeFalsePositiveCount: 1,
        humanSelectedForDiversityCount: 3,
        rejectedCountByReason: { near_duplicate: 5, low_marginal_informativeness: 3 },
        promotedToRatingCount: 4,
      },
    }),
  });
  assert.equal(activeLearningSelectionAudit.status, 201);

  const activeLearningSelectionAuditById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/active-learning-selection-audits/selection-audit-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(activeLearningSelectionAuditById.status, 200);
  assert.equal(activeLearningSelectionAuditById.body.id, "selection-audit-workflow-new");

  const assignmentFlag = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/assignments/assign-ai-base-rate/flag",
    headers: raterHeaders,
    body: JSON.stringify({
      assignmentFlag: {
        id: "flag-topic-fit",
        raterId: "demo-rater",
        reasonCode: "insufficient_topic_expertise",
        notes: "Topic-fit route without revealing source metadata.",
      },
    }),
  });
  assert.equal(assignmentFlag.status, 201);
  assert.equal(assignmentFlag.body.resourceId, "flag-topic-fit");

  const ratingCheckAction = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/ratings/rating-seed-ai-base-rate-r1/check",
    headers: raterHeaders,
    body: JSON.stringify({
      ratingCheck: {
        id: "rating-check-action-workflow-new",
        ratingId: "rating-seed-ai-base-rate-r1",
        assignmentId: "assign-ai-base-rate",
        raterId: "demo-rater",
        checkKind: "self_check",
        auxiliaryMaterialSeen: ["own_initial_rationale"],
        modelExposureTiming: "none",
      },
    }),
  });
  assert.equal(ratingCheckAction.status, 201);
  assert.equal(ratingCheckAction.body.resourceId, "rating-check-action-workflow-new");

  const hiddenAssignmentFlag = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/assignments/assign-ai-base-rate/flag",
    headers: raterHeaders,
    body: JSON.stringify({
      assignmentFlag: {
        id: "flag-hidden",
        raterId: "demo-rater",
        reasonCode: "insufficient_topic_expertise",
        adminTags: ["should-not-be-rater-visible"],
      },
    }),
  });
  assert.equal(hiddenAssignmentFlag.status, 400);
  assert.match(hiddenAssignmentFlag.body.detail, /hidden metadata/);

  const unassignedFlag = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/assignments/assign-mind-zombie/flag",
    headers: raterHeaders,
    body: JSON.stringify({
      assignmentFlag: {
        id: "flag-unassigned",
        raterId: "demo-rater",
        reasonCode: "insufficient_topic_expertise",
      },
    }),
  });
  assert.equal(unassignedFlag.status, 403);

  const discussion = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/discussions",
    headers: adminHeaders,
    body: JSON.stringify({
      discussion: {
        id: "discussion-workflow-new",
        itemId: "pos-workflow-new::crit-workflow-new",
        disagreementTaxonomy: ["strength_centrality_allocation"],
      },
    }),
  });
  assert.equal(discussion.status, 201);

  const discussionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/discussions/discussion-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(discussionById.status, 200);
  assert.equal(discussionById.body.id, "discussion-workflow-new");

  const discussionThread = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/discussion-threads",
    headers: adminHeaders,
    body: JSON.stringify({
      discussionThread: {
        id: "discussion-thread-workflow-new",
        itemId: "pos-workflow-new::crit-workflow-new",
        positionId: "pos-workflow-new",
        critiqueId: "crit-workflow-new",
        issueType: "strength_centrality_allocation",
        disagreementTaxonomyCodes: ["strength_centrality_allocation"],
        status: "open_for_expert_adjudication",
      },
    }),
  });
  assert.equal(discussionThread.status, 201);

  const discussionThreadById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/discussion-threads/discussion-thread-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(discussionThreadById.status, 200);
  assert.equal(discussionThreadById.body.id, "discussion-thread-workflow-new");

  const adjudication = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/adjudications",
    headers: adminHeaders,
    body: JSON.stringify({
      adjudication: {
        id: "adjudication-workflow-new",
        discussionThreadId: "discussion-thread-workflow-new",
        itemId: "pos-workflow-new::crit-workflow-new",
        adjudicatorIds: ["demo-expert"],
        decisionStatus: "memo_pending_finalization",
      },
    }),
  });
  assert.equal(adjudication.status, 201);

  const adjudicationMemo = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/adjudication-memos",
    headers: adminHeaders,
    body: JSON.stringify({
      adjudicationMemo: {
        id: "adjudication-memo-workflow-new",
        discussionThreadId: "discussion-thread-workflow-new",
        itemId: "pos-workflow-new::crit-workflow-new",
        contestedInterpretation: "Whether the critique attacks the central forecast or a side assumption.",
        plausibleInterpretationsConsidered: ["central_base_rate_attack", "side_assumption_only"],
        worstPlausibleInterpretationConsidered: "side_assumption_only",
        critiqueRefutesInterpretations: ["central_base_rate_attack"],
        adversarialPlausibilityWeightingDecision: "Treat the central forecast reading as the release-relevant interpretation.",
        disagreementTaxonomyCodes: ["strength_centrality_allocation"],
        postDiscussionResolutionStatus: "resolved_with_minor_residual_spread",
        unresolvedDisagreementClass: "resolved_with_minor_residual_spread",
        maxFinalRaterSpread: 0.18,
        splitDecision: "public_train",
        adjudicatorIds: ["demo-expert"],
        rubricVersionConsidered: "lmca-seven-dim-v1",
      },
    }),
  });
  assert.equal(adjudicationMemo.status, 201);

  const adjudicationMemoById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/adjudication-memos/adjudication-memo-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(adjudicationMemoById.status, 200);
  assert.equal(adjudicationMemoById.body.id, "adjudication-memo-workflow-new");

  const adjudicationFinalization = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/adjudications/adjudication-workflow-new/finalize",
    headers: adminHeaders,
    body: JSON.stringify({
      adjudicationFinalization: {
        id: "adjudication-finalization-workflow-new",
        memoId: "adjudication-memo-workflow-new",
        finalizationStatus: "finalized_for_release_candidate",
        finalizedBy: "demo-expert",
      },
    }),
  });
  assert.equal(adjudicationFinalization.status, 201);
  assert.equal(adjudicationFinalization.body.resourceId, "adjudication-finalization-workflow-new");

  const ratingCheck = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/rating-checks",
    headers: adminHeaders,
    body: JSON.stringify({
      ratingCheck: {
        id: "rating-check-workflow-new",
        ratingId: "rating-ai-base-rate-a",
        checkerId: "demo-rater",
        checkType: "model_assisted_check",
        auxiliaryMaterialSeen: ["own_initial_rationale", "assisting_model_commentary"],
        modelExposureTiming: "post_human_only_self_check_lock",
        assistingModelRequestedAlias: "gpt-demo-label-checker",
        assistingModelResolvedSnapshot: "gpt-demo-label-checker-2026-06-01",
        assistingModelFamily: "gpt_demo_family",
        assistingPromptTemplateId: "label-check-v1",
        humanOnlyCheckLockedBeforeModelExposure: true,
      },
    }),
  });
  assert.equal(ratingCheck.status, 201);

  const ratingCheckById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/rating-checks/rating-check-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(ratingCheckById.status, 200);
  assert.equal(ratingCheckById.body.id, "rating-check-workflow-new");

  const verification = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/verification-records",
    headers: adminHeaders,
    body: JSON.stringify({
      verificationRecord: {
        id: "verification-workflow-new",
        itemId: "pos-ai-prior::crit-ai-base-rate",
        verificationStatus: "not_practicable",
        verifierId: "demo-expert",
        verifierRole: "expert",
        verificationType: "subjective_or_intuition_pump",
        verificationResult: "Expert adjudicator marked the conceptual forecast claim as not practicable to externally verify.",
        createdAt: "2026-06-12T12:00:00.000Z",
      },
    }),
  });
  assert.equal(verification.status, 201);

  const verificationById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/verification-records/verification-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(verificationById.status, 200);
  assert.equal(verificationById.body.id, "verification-workflow-new");

  const promptTemplateWorkflow = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/prompt-templates",
    headers: adminHeaders,
    body: JSON.stringify({
      promptTemplate: {
        id: "prompt-template-workflow-new",
        promptFamily: "lmca_evaluation",
        promptTrack: "project_full_rubric",
        promptSourceScopeClass: "project_full_rubric",
        promptVersion: "workflow-v1",
        promptRole: "evaluation",
        promptBody: "Read the position and critique, then return the requested LMCA JSON fields.",
        promptTextHash: "sha256-test-prompt-body",
        renderedPromptChecksum: "sha256-test-prompt",
        requestedOutputSchema: "json-seven-dim-v2",
        protectedSplitExclusionPolicy: "exclude_hidden_and_validation_examples",
      },
    }),
  });
  assert.equal(promptTemplateWorkflow.status, 201);

  const promptTemplateWorkflowById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/prompt-templates/prompt-template-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(promptTemplateWorkflowById.status, 200);
  assert.equal(promptTemplateWorkflowById.body.id, "prompt-template-workflow-new");

  const parserConfig = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/parser-configs",
    headers: adminHeaders,
    body: JSON.stringify({
      parserConfig: {
        id: "parser-workflow-new",
        acceptedSchema: "json-seven-dim-v2",
        parserVersion: "parser-workflow-v1",
        scoreFieldRequirements: ["overall", "centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue"],
        retryPolicy: "repair_once_then_mark_invalid",
        repairPolicy: "single_json_repair_attempt",
        invalidScoreHandling: "mark_invalid_and_exclude_from_metrics",
        outOfRangeHandling: "reject_out_of_range_scores",
        missingFieldHandling: "mark_prediction_unparsed",
        protectedSplitRetryConstraints: "no_extra_protected_split_context_on_retry",
      },
    }),
  });
  assert.equal(parserConfig.status, 201);

  const parserConfigById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/parser-configs/parser-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(parserConfigById.status, 200);
  assert.equal(parserConfigById.body.id, "parser-workflow-new");

  const metricConfig = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/metric-configs",
    headers: adminHeaders,
    body: JSON.stringify({
      metricConfig: {
        id: "metric-config-workflow-new",
        metricFamily: "weighted_pairwise_and_custom_loss",
        metricVersion: "lmca-october-2026-workflow",
        scoreRoundingPolicy: "stored_exact",
        scoreQuantizationPolicy: "unit_interval_decimal_scores_no_bucket_quantization",
        pairwiseHumanTiePolicy: "exclude_human_ties",
        pairwiseModelTiePolicy: "model_tie_costs_half_margin",
        pairwiseTieTolerance: 0,
        unweightedPairwiseDiagnosticEnabled: true,
        derivedUtilityPairwiseEnabled: true,
        derivedUtilityFormulaId: "derived-utility-workflow-new",
      },
    }),
  });
  assert.equal(metricConfig.status, 201);

  const metricConfigById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/metric-configs/metric-config-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(metricConfigById.status, 200);
  assert.equal(metricConfigById.body.id, "metric-config-workflow-new");

  const derivedUtilityFormula = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/derived-utility-formulas",
    headers: adminHeaders,
    body: JSON.stringify({
      derivedUtilityFormula: {
        id: "derived-utility-workflow-new",
        formulaName: "default_full_rubric_utility",
        version: "v1",
        deadWeightDirectionHandling: "badness_field_normalized_as_one_minus_dead_weight",
        lowClarityPolicy: "if_target_clarity_below_0_5_use_only_overall_and_clarity",
      },
    }),
  });
  assert.equal(derivedUtilityFormula.status, 201);

  const derivedUtilityFormulaById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/derived-utility-formulas/derived-utility-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(derivedUtilityFormulaById.status, 200);
  assert.equal(derivedUtilityFormulaById.body.id, "derived-utility-workflow-new");

  const critiqueGenerationRun = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/critique-generation-runs",
    headers: adminHeaders,
    body: JSON.stringify({
      critiqueGenerationRun: {
        id: "critique-generation-run-workflow-new",
        generatorRequestedModelAlias: "generator-model-a",
        generatorResolvedModelSnapshot: "generator-model-a-2026-10-01",
        promptTemplateId: "prompt-template-workflow-new",
        sourceSplit: "public_train",
        generationBudgetPerPosition: 4,
        blindRatingBeforeScreening: true,
      },
    }),
  });
  assert.equal(critiqueGenerationRun.status, 201);

  const critiqueGenerationRunById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/critique-generation-runs/critique-generation-run-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(critiqueGenerationRunById.status, 200);
  assert.equal(critiqueGenerationRunById.body.id, "critique-generation-run-workflow-new");

  const generatedCritiqueSubmission = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/generated-critiques",
    headers: adminHeaders,
    body: JSON.stringify({
      generatedCritiqueSubmission: {
        id: "generated-critique-workflow-new",
        generationRunId: "critique-generation-run-workflow-new",
        positionId: "pos-ai-prior",
        rawGeneratedText: "The position should account for the base rate of failures in adjacent forecasting domains.",
        normalizedRaterVisibleText: "The position should account for the base rate of failures in adjacent forecasting domains.",
        generationIndex: 0,
        generatorMetadataHiddenFromRaters: true,
        generationOutputStatus: "generated",
        rightsStatus: "cleared_internal",
      },
    }),
  });
  assert.equal(generatedCritiqueSubmission.status, 201);

  const generatedCritiqueSubmissionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/generated-critiques/generated-critique-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(generatedCritiqueSubmissionById.status, 200);
  assert.equal(generatedCritiqueSubmissionById.body.id, "generated-critique-workflow-new");

  const generatedCritiquePromotion = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/generated-critiques/generated-critique-workflow-new/promote",
    headers: adminHeaders,
    body: JSON.stringify({
      generatedCritiquePromotion: {
        id: "generated-critique-promotion-workflow-new",
        promotedCritiqueId: "crit-workflow-new",
        promotionStatus: "promoted_after_human_review",
        generatorMetadataHiddenFromRaters: true,
      },
    }),
  });
  assert.equal(generatedCritiquePromotion.status, 201);
  assert.equal(generatedCritiquePromotion.body.resourceId, "generated-critique-promotion-workflow-new");

  const generationEvaluationReport = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/generation-evaluation-reports",
    headers: adminHeaders,
    body: JSON.stringify({
      generationEvaluationReport: {
        id: "generation-evaluation-report-workflow-new",
        generationRunIds: ["critique-generation-run-workflow-new"],
        labelSnapshotId: "snapshot-oct-api",
        commonGenerationBudgetPolicy: "budget_matched",
        uncuratedRandomSampleMetrics: { ratedCount: 1, meanOverall: 0.61 },
      },
    }),
  });
  assert.equal(generationEvaluationReport.status, 201);

  const generationEvaluationReportById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/generation-evaluation-reports/generation-evaluation-report-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(generationEvaluationReportById.status, 200);
  assert.equal(generationEvaluationReportById.body.id, "generation-evaluation-report-workflow-new");

  const modelImprovementRun = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/model-improvement-runs",
    headers: adminHeaders,
    body: JSON.stringify({
      modelImprovementRun: {
        id: "model-improvement-workflow-new",
        releaseId: "october-2026-demo",
        trainingExportId: "training-export-october-2026-demo",
        optimizedSurrogateObjectiveFamily: "pairwise_logistic",
        targetFields: ["overall", "centrality_x_strength"],
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        lmcaEvaluationMetricsSeparate: true,
      },
    }),
  });
  assert.equal(modelImprovementRun.status, 201);

  const modelImprovementRunById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/model-improvement-runs/model-improvement-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(modelImprovementRunById.status, 200);
  assert.equal(modelImprovementRunById.body.id, "model-improvement-workflow-new");

  const evaluationRun = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/evaluations/run",
    headers: adminHeaders,
    body: JSON.stringify({
      evaluationRun: {
        id: "eval-workflow-new",
        releaseId: "october-2026-demo",
        targetLabelSnapshotId: "snapshot-oct-api",
        targetLabelVersion: "initial_mean",
        promptTemplateId: "prompt-template-workflow-new",
        parserConfigId: "parser-workflow-new",
        metricFamilies: ["weighted_pairwise", "custom_weighted_loss"],
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
      },
    }),
  });
  assert.equal(evaluationRun.status, 201);

  const evaluationRunById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/evaluations/eval-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(evaluationRunById.status, 200);
  assert.equal(evaluationRunById.body.id, "eval-workflow-new");

  const modelEvaluationPrediction = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/evaluations/eval-workflow-new/predictions",
    headers: adminHeaders,
    body: JSON.stringify({
      modelEvaluationPrediction: {
        id: "prediction-workflow-new",
        releaseId: "october-2026-demo",
        positionId: "pos-ai-prior",
        critiqueId: "crit-ai-base-rate",
        positionTextVersionId: "ptv-pos-ai-prior-v1",
        critiqueTextVersionId: "ctv-crit-ai-base-rate-v1",
        renderedItemHash: "sha256-test-rendered-item",
        requestedModelAlias: "model-under-test",
        resolvedModelSnapshot: "model-under-test-2026-10-01",
        rawModelResponse: "{\"overall\":0.62}",
        ratingContextSnapshotId: "rating-context-workflow-new",
        parserConfigId: "parser-workflow-new",
        parseStatus: "parsed",
        parsedOverallScore: 0.62,
      },
    }),
  });
  assert.equal(modelEvaluationPrediction.status, 201);

  const modelEvaluationPredictionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/model-evaluation-predictions/prediction-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(modelEvaluationPredictionById.status, 200);
  assert.equal(modelEvaluationPredictionById.body.id, "prediction-workflow-new");
  assert.equal(modelEvaluationPredictionById.body.evaluationRunId, "eval-workflow-new");

  const evaluationPredictions = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/evaluations/eval-workflow-new/predictions",
    headers: adminHeaders,
  });
  assert.equal(evaluationPredictions.status, 200);
  assert.equal(evaluationPredictions.body.predictions.some((prediction) => prediction.id === "prediction-workflow-new"), true);

  const calibration = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/evaluations/eval-workflow-new/calibrate",
    headers: adminHeaders,
    body: JSON.stringify({
      calibrationRun: {
        id: "calibration-workflow-new",
        releaseId: "october-2026-demo",
        targetLabelSnapshotId: "snapshot-oct-api",
        transformation: "isotonic_regression",
        fitSplits: ["public_train"],
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        protectedLeakageCount: 0,
        rawAndCalibratedSeparate: true,
      },
    }),
  });
  assert.equal(calibration.status, 201);

  const calibrationById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/calibration-runs/calibration-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(calibrationById.status, 200);
  assert.equal(calibrationById.body.evaluationRunId, "eval-workflow-new");

  const failureAudit = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/evaluations/eval-workflow-new/failure-audits",
    headers: adminHeaders,
    body: JSON.stringify({
      modelFailureAudit: {
        id: "failure-audit-workflow-new",
        releaseId: "october-2026-demo",
        targetLabelSnapshotId: "snapshot-oct-api",
        largestErrorPolicy: "preserve_qualitative_diagnostic",
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        cannotReplaceAggregateMetrics: true,
      },
    }),
  });
  assert.equal(failureAudit.status, 201);

  const failureAuditsByRun = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/evaluations/eval-workflow-new/failure-audits",
    headers: adminHeaders,
  });
  assert.equal(failureAuditsByRun.status, 200);
  assert.equal(failureAuditsByRun.body.audits.length, 1);

  const persistedEvaluationReport = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/evaluations/eval-workflow-new/report",
    headers: adminHeaders,
  });
  assert.equal(persistedEvaluationReport.status, 200);
  assert.equal(persistedEvaluationReport.body.evaluationRun.id, "eval-workflow-new");
  assert.equal(persistedEvaluationReport.body.calibrationRuns.length, 1);
  assert.equal(persistedEvaluationReport.body.modelFailureAudits.length, 1);

  const artifactProbeRun = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/artifact-probes/run",
    headers: adminHeaders,
    body: JSON.stringify({
      artifactProbeRun: {
        id: "artifact-probe-workflow-new",
        releaseId: "october-2026-demo",
        splitEvaluated: "hidden_benchmark_candidate",
        targetLabelSnapshotId: "snapshot-oct-api",
        inputView: "critique_only",
        metricOutputs: { weightedPairwiseLoss: 0.24 },
        protectedMetadataHandling: "authorized_admin_only_probe",
      },
    }),
  });
  assert.equal(artifactProbeRun.status, 201);

  const artifactProbeRunById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/artifact-probes/artifact-probe-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(artifactProbeRunById.status, 200);
  assert.equal(artifactProbeRunById.body.id, "artifact-probe-workflow-new");

  const sycophancyProbeRun = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/sycophancy-probes/run",
    headers: adminHeaders,
    body: JSON.stringify({
      sycophancyProbeRun: {
        id: "sycophancy-probe-workflow-new",
        targetLabelSnapshotId: "snapshot-oct-api",
        pairedEvaluationRunIds: ["eval-full-rubric-demo"],
        cueTypesTested: ["no_cue_control", "user_endorses_position", "safety_or_orthodoxy_frame"],
      },
    }),
  });
  assert.equal(sycophancyProbeRun.status, 201);

  const sycophancyProbeRunById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/sycophancy-probes/sycophancy-probe-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(sycophancyProbeRunById.status, 200);
  assert.equal(sycophancyProbeRunById.body.id, "sycophancy-probe-workflow-new");

  const obfuscationStressRun = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/obfuscation-stress-runs",
    headers: adminHeaders,
    body: JSON.stringify({
      obfuscationStressRun: {
        id: "obfuscation-stress-workflow-new",
        targetLabelSnapshotId: "snapshot-oct-api",
        pairedEvaluationRunIds: ["eval-full-rubric-demo"],
        variantFamilies: ["fluent_jargon_heavy", "masked_fallacy"],
      },
    }),
  });
  assert.equal(obfuscationStressRun.status, 201);

  const obfuscationStressRunById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/obfuscation-stress-runs/obfuscation-stress-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(obfuscationStressRunById.status, 200);
  assert.equal(obfuscationStressRunById.body.id, "obfuscation-stress-workflow-new");

  const sanityBaselineRun = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/sanity-baselines/run",
    headers: adminHeaders,
    body: JSON.stringify({
      sanityBaselineRun: {
        id: "sanity-baseline-workflow-new",
        releaseId: "october-2026-demo",
        baselineType: "constant_mean",
        fitSplits: ["public_train"],
        excludedProtectedSplits: ["internal_validation", "hidden_benchmark"],
        targetLabelSnapshotId: "snapshot-oct-api",
        metricFamily: "custom_weighted_loss",
        metricOutputs: { customWeightedLoss: 0.31, coverage: { nItemsScored: 5 } },
      },
    }),
  });
  assert.equal(sanityBaselineRun.status, 201);

  const sanityBaselineRunById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/sanity-baselines/sanity-baseline-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(sanityBaselineRunById.status, 200);
  assert.equal(sanityBaselineRunById.body.id, "sanity-baseline-workflow-new");

  const humanCeilingRun = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/human-ceiling-runs",
    headers: adminHeaders,
    body: JSON.stringify({
      humanCeilingRun: {
        id: "human-ceiling-workflow-new",
        splitOrValidationSubset: "internal_validation",
        validationCritiqueCount: 52,
        validationPositionCount: 19,
        coreAllItemsRaterCount: 4,
        discussionHours: 7.5,
        appendixCComparabilityFlag: "appendix_c_scale_candidate",
        targetLabelSnapshotId: "snapshot-oct-api",
      },
    }),
  });
  assert.equal(humanCeilingRun.status, 201);

  const humanCeilingRunById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/human-ceiling-runs/human-ceiling-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(humanCeilingRunById.status, 200);
  assert.equal(humanCeilingRunById.body.id, "human-ceiling-workflow-new");

  const leaderboardWorkflow = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/leaderboards",
    headers: adminHeaders,
    body: JSON.stringify({
      leaderboard: {
        id: "leaderboard-workflow-new",
        releaseId: "october-2026-demo",
        metricFamily: "weighted_pairwise",
        targetLabelSnapshotId: "snapshot-oct-api",
        targetLabelVersion: "initial_mean",
        evaluationRunIds: ["eval-workflow-new"],
        commonSubsetPolicy: "common_item_set_required",
        uncertaintyPolicy: { intervalType: "paired_difference_interval", nominalLevel: 0.95 },
        superiorityClaimPolicy: "rank_claims_require_paired_intervals_and_practical_threshold",
        uncertaintySupportedRankTiers: [["eval-workflow-new"]],
      },
    }),
  });
  assert.equal(leaderboardWorkflow.status, 201);

  const leaderboardWorkflowById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/leaderboards/leaderboard-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(leaderboardWorkflowById.status, 200);
  assert.equal(leaderboardWorkflowById.body.id, "leaderboard-workflow-new");

  const uxPolicy = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/ux-simplification-policies",
    headers: adminHeaders,
    body: JSON.stringify({
      uxSimplificationPolicy: {
        id: "ux-policy-workflow-new",
        policyVersion: "rlhf88-feature-preserving-v1",
        enabledSurfaces: uxSimplificationSurfaces,
        taskFirstCopyRequired: true,
        progressiveDisclosureRequired: true,
        glossarySupportRequired: true,
        serverDerivedScreenStateRequired: true,
        exactRubricSemanticsPreserved: true,
        appendixFAnchorAccess: "one_click",
        protectedSplitVariantPolicy: "block or quarantine unregistered variants",
        hiddenMetadataLeakagePolicy: "forbid hidden metadata fields in sanitized payloads",
        noFeatureLossChecklist: uxNoFeatureLossKeys,
      },
    }),
  });
  assert.equal(uxPolicy.status, 201);

  const uxPolicyById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/ux-simplification-policies/ux-policy-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(uxPolicyById.status, 200);
  assert.equal(uxPolicyById.body.id, "ux-policy-workflow-new");

  const uxReview = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/ux-simplification-reviews",
    headers: adminHeaders,
    body: JSON.stringify({
      uxSimplificationReview: {
        id: "ux-review-workflow-new",
        policyId: "ux-policy-workflow-new",
        reviewedSurfaces: uxSimplificationSurfaces,
        reviewStatus: "passed",
        reviewerRole: "release_admin",
        noFeatureLossChecklist: uxNoFeatureLossKeys,
        exactRubricSemanticsPreserved: true,
        appendixFAnchorAccessVerified: true,
        serverDerivedScreenStateVerified: true,
        protectedLeakageReviewPassed: true,
      },
    }),
  });
  assert.equal(uxReview.status, 201);

  const uxReviewById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/ux-simplification-reviews/ux-review-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(uxReviewById.status, 200);
  assert.equal(uxReviewById.body.id, "ux-review-workflow-new");

  for (const surface of uxSimplificationSurfaces) {
    const screenState = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/screen-state-payloads",
      headers: adminHeaders,
      body: JSON.stringify({
        screenStatePayload: {
          id: `screen-state-workflow-${surface}`,
          surface,
          payloadSource: "server_derived",
          schemaVersion: "screen-state-lmca-v1",
          policyVersionProvenance: {
            uxSimplificationPolicyId: "ux-policy-workflow-new",
            visibilityPolicyId: "visibility-policy-workflow-new",
            workflowProfileId: `${surface}-workflow-profile`,
            assistPolicyId: "pre-submit-assist-workflow-new",
            uiExperimentPolicyId: "ui-experiment-policy-workflow-new",
          },
          visibleFieldAllowlist: ["taskStatement", "primaryNextAction", "completionState", "scoreFields", "issueReport", "appendixFAnchor"],
          enabledActionAllowlist: uxScreenControlKeys,
          requiredControlKeys: uxScreenControlKeys,
          hiddenFieldClasses: uxHiddenFieldClasses,
          rejectedUnknownKeys: true,
          sanitized: true,
        },
      }),
    });
    assert.equal(screenState.status, 201, surface);
  }

  const screenStateById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/screen-state-payloads/screen-state-workflow-rating",
    headers: adminHeaders,
  });
  assert.equal(screenStateById.status, 200);
  assert.equal(screenStateById.body.surface, "rating");

  for (const transition of workflowStateTransitionFixtures) {
    const transitionResponse = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/state-transitions",
      headers: adminHeaders,
      body: JSON.stringify({ transition }),
    });
    assert.equal(transitionResponse.status, 201, transition.entityType);
    assert.equal(transitionResponse.body.acceptedNextState, transition.acceptedNextState);
  }

  const ratingState = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/state/rating/rating-state-release",
    headers: adminHeaders,
  });
  assert.equal(ratingState.status, 200);
  assert.equal(ratingState.body.currentState, "locked_initial");
  assert.equal(ratingState.body.appendOnly, true);

  const raterDataConsent = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/raters/me/data-consent",
    headers: adminHeaders,
    body: JSON.stringify({
      raterDataConsent: {
        id: "rater-data-consent-workflow-new",
        raterId: "demo-rater",
        noticeVersion: "rater-data-use-v1",
        dataCategoriesCovered: raterDataCategories,
        useScopesAcknowledged: raterDataUseScopes,
        dataProfileVisible: true,
        publicArtifactsDeidentifiedByDefault: true,
        identifiableAccessRestriction: "approved operational or research role access only",
        privateLearningDataExcludedFromReleaseAndTraining: true,
        consentedAt: "2026-10-01T00:04:00.000Z",
      },
    }),
  });
  assert.equal(raterDataConsent.status, 201);

  const raterDataRestriction = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/raters/me/data-restriction-request",
    headers: adminHeaders,
    body: JSON.stringify({
      raterDataRestrictionRequest: {
        id: "rater-data-restriction-workflow-new",
        raterId: "demo-rater",
        requestType: "identifiable_access_review",
        affectedDataCategories: ["session_pacing", "safe_decline_reasons"],
        actionTaken: "review_opened",
        requesterNotificationStatus: "notified",
        timestamp: "2026-10-01T00:05:00.000Z",
      },
    }),
  });
  assert.equal(raterDataRestriction.status, 201);

  const volunteerWithdrawal = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/raters/me/withdrawal-requests",
    headers: adminHeaders,
    body: JSON.stringify({
      volunteerDataWithdrawalRequest: {
        id: "volunteer-withdrawal-workflow-new",
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
        timestamp: "2026-10-01T00:06:00.000Z",
      },
    }),
  });
  assert.equal(volunteerWithdrawal.status, 201);

  const policyBundle = completePolicyBundleFixtures();
  for (const [resourceKey, url] of [
    ["visibilityPolicy", "/api/v1/visibility-policies"],
    ["ratingWorkflowProfile", "/api/v1/rating-workflow-profiles"],
    ["uiExperimentPolicy", "/api/v1/ui-experiment-policies"],
    ["preSubmitAssistPolicy", "/api/v1/pre-submit-assist-policies"],
    ["accessibilityConformanceReport", "/api/v1/accessibility-conformance-reports"],
  ]) {
    const response = await invokeApi(context, {
      method: "POST",
      url,
      headers: adminHeaders,
      body: JSON.stringify({ [resourceKey]: policyBundle[resourceKey] }),
    });
    assert.equal(response.status, 201, resourceKey);
  }

  const ratingWorkflowProfileById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/rating-workflow-profiles/rating-workflow-profile-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(ratingWorkflowProfileById.status, 200);
  assert.equal(ratingWorkflowProfileById.body.safeDeclineAvailable, true);

  const visibilityPolicyById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/visibility-policies/visibility-policy-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(visibilityPolicyById.status, 200);
  assert.equal(visibilityPolicyById.body.backendEnforced, true);

  const participantSafeguards = completeParticipantSafeguardWorkflowFixtures();
  const volunteerIncentivePolicy = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/volunteer-incentive-policies",
    headers: adminHeaders,
    body: JSON.stringify({ volunteerIncentivePolicy: participantSafeguards.volunteerIncentivePolicy }),
  });
  assert.equal(volunteerIncentivePolicy.status, 201);

  const volunteerIncentivePolicyById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/volunteer-incentive-policies/volunteer-incentive-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(volunteerIncentivePolicyById.status, 200);
  assert.equal(volunteerIncentivePolicyById.body.privateProgressDashboardPolicy, "private non-gamified progress only");

  for (const raterQualificationRecord of participantSafeguards.raterQualificationRecords) {
    const response = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/rater-qualification-records",
      headers: adminHeaders,
      body: JSON.stringify({ raterQualificationRecord }),
    });
    assert.equal(response.status, 201, raterQualificationRecord.qualificationScope);
  }

  const qualificationById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/rater-qualification-records/rater-qualification-workflow-adjudicator",
    headers: adminHeaders,
  });
  assert.equal(qualificationById.status, 200);
  assert.deepEqual(qualificationById.body.approvedRoles, ["expert", "adjudicator"]);

  const languageAssessment = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/language-artifact-assessments",
    headers: adminHeaders,
    body: JSON.stringify({ languageArtifactAssessment: participantSafeguards.languageArtifactAssessment }),
  });
  assert.equal(languageAssessment.status, 201);

  const languageAssessmentById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/language-artifact-assessments/language-artifact-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(languageAssessmentById.status, 200);
  assert.equal(languageAssessmentById.body.automaticScorePenaltyApplied, false);

  const sourceRecognition = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/source-recognition-events",
    headers: adminHeaders,
    body: JSON.stringify({ sourceRecognitionEvent: participantSafeguards.sourceRecognitionEvent }),
  });
  assert.equal(sourceRecognition.status, 201);

  const sourceRecognitionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/source-recognition-events/source-recognition-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(sourceRecognitionById.status, 200);
  assert.equal(sourceRecognitionById.body.protectedStatusHiddenFromRater, true);

  for (const modelProviderDataHandlingPolicy of participantSafeguards.modelProviderDataHandlingPolicies) {
    const response = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/model-provider-data-handling-policies",
      headers: adminHeaders,
      body: JSON.stringify({ modelProviderDataHandlingPolicy }),
    });
    assert.equal(response.status, 201, modelProviderDataHandlingPolicy.coveredRunClass);
  }

  const providerPolicyById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/model-provider-data-handling-policies/model-provider-data-handling-workflow-model_evaluation",
    headers: adminHeaders,
  });
  assert.equal(providerPolicyById.status, 200);
  assert.equal(providerPolicyById.body.protectedContentEligible, true);

  const ratingExperience = completeRatingExperienceWorkflowFixtures();
  for (const [resourceKey, url] of [
    ["taskOutputEligibilityPolicy", "/api/v1/task-output-eligibility-policies"],
    ["scoreInputPolicy", "/api/v1/score-input-policies"],
    ["raterInstructionRenderVersion", "/api/v1/rater-instruction-render-versions"],
    ["rubricLintConfig", "/api/v1/rubric-lint-configs"],
    ["rubricLintEvent", "/api/v1/rubric-lint-events"],
    ["itemIssueReport", "/api/v1/item-issues"],
    ["ratingDraftSession", "/api/v1/rating-draft-sessions"],
    ["scoreConfidenceAnnotation", "/api/v1/score-confidence-annotations"],
    ["rationaleEvidenceSpan", "/api/v1/rationale-evidence-spans"],
    ["samePositionScratchpad", "/api/v1/same-position-scratchpads"],
    ["samePositionBatchReview", "/api/v1/same-position-batch-reviews"],
    ["correctnessClaimWeightWorksheet", "/api/v1/correctness-claim-weight-worksheets"],
    ["externalAssistanceDeclaration", "/api/v1/external-assistance-declarations"],
  ]) {
    const response = await invokeApi(context, {
      method: "POST",
      url,
      headers: adminHeaders,
      body: JSON.stringify({ [resourceKey]: ratingExperience[resourceKey] }),
    });
    assert.equal(response.status, 201, resourceKey);
  }

  for (const protectedArtifactRetentionRecord of ratingExperience.protectedArtifactRetentionRecords) {
    const response = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/protected-artifact-retention-records",
      headers: adminHeaders,
      body: JSON.stringify({ protectedArtifactRetentionRecord }),
    });
    assert.equal(response.status, 201, protectedArtifactRetentionRecord.artifactType);
  }

  const scoreInputPolicyById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/score-input-policies/score-input-policy-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(scoreInputPolicyById.status, 200);
  assert.equal(scoreInputPolicyById.body.initialDefaultState, "unset_required");

  const raterInstructionRenderById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/rater-instruction-render-versions/rater-instruction-render-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(raterInstructionRenderById.status, 200);
  assert.equal(raterInstructionRenderById.body.scoreInputPolicyId, "score-input-policy-workflow-new");

  const itemIssueById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/item-issues/item-issue-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(itemIssueById.status, 200);
  assert.equal(itemIssueById.body.labelVisibilityStateForTriage, "hidden");

  const scoreConfidenceById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/score-confidence-annotations/score-confidence-annotation-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(scoreConfidenceById.status, 200);
  assert.equal(scoreConfidenceById.body.excludedFromScoreComputation, true);

  const rationaleSpanById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/rationale-evidence-spans/rationale-evidence-span-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(rationaleSpanById.status, 200);
  assert.equal(rationaleSpanById.body.visibilityState, "locked_initial_hidden");
  assert.equal(rationaleSpanById.body.rawSelectedTextStored, false);

  const scratchpadById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/same-position-scratchpads/same-position-scratchpad-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(scratchpadById.status, 200);
  assert.equal(scratchpadById.body.visibilityState, "private_rater_only");

  const batchReviewById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/same-position-batch-reviews/same-position-batch-review-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(batchReviewById.status, 200);
  assert.equal(batchReviewById.body.nonIndependentEvidenceFlag, true);

  const worksheetById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/correctness-claim-weight-worksheets/correctness-claim-weight-worksheet-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(worksheetById.status, 200);
  assert.deepEqual(worksheetById.body.claimSignificanceWeights, [0.7, 0.3]);

  const externalAssistanceById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/external-assistance-declarations/external-assistance-declaration-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(externalAssistanceById.status, 200);
  assert.equal(externalAssistanceById.body.contaminationRouting, "excluded_from_blind_initial_denominator_and_quarantined");

  const protectedRetentionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/protected-artifact-retention-records/protected-artifact-retention-workflow-prompt",
    headers: adminHeaders,
  });
  assert.equal(protectedRetentionById.status, 200);
  assert.equal(protectedRetentionById.body.restoreTimeRevalidationStatus, "passed_current_manifest_revalidation");

  const auxiliaryWorkflow = completeAuxiliaryWorkflowFixtures();
  for (const [resourceKey, url] of [
    ["blindingPreviewAudit", "/api/v1/blinding-preview-audits"],
    ["raterPositionClusterExposure", "/api/v1/raters/demo-rater/position-cluster-exposures"],
    ["spotCheckQaItem", "/api/v1/spot-checks"],
    ["adjudicationTriageQueueItem", "/api/v1/adjudication-triage-items"],
    ["diagnosticDeferralRecord", "/api/v1/diagnostic-deferrals"],
    ["queuePolicySnapshot", "/api/v1/queue-policy-snapshots"],
    ["assignmentSelectionAudit", "/api/v1/assignment-selection-audits"],
    ["modelInferenceConfig", "/api/v1/model-inference-configs"],
    ["modelRunEnvironment", "/api/v1/model-run-environments"],
    ["raterItemConflict", "/api/v1/rater-item-conflicts"],
    ["raterTrainingExposureSnapshot", "/api/v1/rater-training-exposure-snapshots"],
    ["releaseErratum", "/api/v1/release-errata"],
    ["scheduleStatusSnapshot", "/api/v1/schedule-status-snapshots"],
  ]) {
    const response = await invokeApi(context, {
      method: "POST",
      url,
      headers: adminHeaders,
      body: JSON.stringify({ [resourceKey]: auxiliaryWorkflow[resourceKey] }),
    });
    assert.equal(response.status, 201, resourceKey);
  }

  for (const partialTaskOutput of auxiliaryWorkflow.partialTaskOutputs) {
    const response = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/partial-task-outputs",
      headers: adminHeaders,
      body: JSON.stringify({ partialTaskOutput }),
    });
    assert.equal(response.status, 201, partialTaskOutput.taskType);
  }

  const assignmentConflictScreen = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/assignments/assign-ai-base-rate/conflict-screen",
    headers: raterHeaders,
    body: JSON.stringify({ raterItemConflict: auxiliaryWorkflow.assignmentConflictScreen }),
  });
  assert.equal(assignmentConflictScreen.status, 201);

  const releaseSupersession = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/releases/october-2026-demo/supersede",
    headers: adminHeaders,
    body: JSON.stringify({
      releaseErratum: {
        ...auxiliaryWorkflow.releaseErratum,
        id: "release-erratum-supersede-workflow-new",
      },
    }),
  });
  assert.equal(releaseSupersession.status, 201);

  const blindingPreviewById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/blinding-preview-audits/blinding-preview-audit-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(blindingPreviewById.status, 200);
  assert.equal(blindingPreviewById.body.approvalStatus, "passed");

  const partialTaskById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/partial-task-outputs/partial-task-output-workflow-practice",
    headers: adminHeaders,
  });
  assert.equal(partialTaskById.status, 200);
  assert.equal(partialTaskById.body.countedAsFullRubricRating, false);

  const exposureEligibility = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/raters/me/exposure-eligibility",
    headers: raterHeaders,
  });
  assert.equal(exposureEligibility.status, 200);
  assert.deepEqual(exposureEligibility.body.blockedPositionClusterIds, ["lmca-public-is-ought-gap"]);

  const assignmentSelectionList = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/assignment-selection-audits",
    headers: adminHeaders,
  });
  assert.equal(assignmentSelectionList.status, 200);
  assert.equal(assignmentSelectionList.body.assignmentSelectionAudits.length, 1);

  const modelInferenceById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/model-inference-configs/model-inference-config-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(modelInferenceById.status, 200);
  assert.equal(modelInferenceById.body.modelSnapshot, "gpt-demo-2026-10-01");

  const trainingExposureForAssignment = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/assignments/assign-ai-base-rate/training-exposure-snapshot",
    headers: raterHeaders,
  });
  assert.equal(trainingExposureForAssignment.status, 200);
  assert.equal(trainingExposureForAssignment.body.protectedSplitConflictStatus, "no_conflict_for_current_assignment");

  const raterTrainingExposure = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/raters/me/training-exposure",
    headers: raterHeaders,
  });
  assert.equal(raterTrainingExposure.status, 200);
  assert.equal(raterTrainingExposure.body.trainingExposureSnapshots.length, 1);

  const releaseScheduleStatus = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/releases/october-2026-demo/schedule-status",
    headers: adminHeaders,
  });
  assert.equal(releaseScheduleStatus.status, 200);
  assert.equal(releaseScheduleStatus.body.scheduleStatusSnapshots.length, 1);

  const interactionWorkflow = completeInteractionWorkflowFixtures();
  for (const [resourceKey, url] of [
    ["publicExamplePracticeSession", "/api/v1/practice-sessions"],
    ["raterSession", "/api/v1/rater-sessions"],
    ["assignmentDecline", "/api/v1/assignments/assign-ai-base-rate/decline"],
    ["interpretationTargetMap", "/api/v1/interpretation-target-maps"],
    ["verificationWorkspaceSession", "/api/v1/verification-workspace-sessions"],
    ["adjudicatorPreRead", "/api/v1/adjudicator-pre-reads"],
    ["postLockDiscussionSession", "/api/v1/discussions/discussion-thread-workflow-new/post-lock-sessions"],
    ["adjudicationReviewSession", "/api/v1/adjudication-review-sessions"],
    ["calibrationFeedbackEvent", "/api/v1/calibration-feedback-events"],
    ["governanceApprovalRecord", "/api/v1/governance-approvals"],
    ["protectedArtifactRevalidation", "/api/v1/protected-artifacts/protected-prompt-workflow-new/revalidate"],
    ["benchmarkSubmissionPolicy", "/api/v1/benchmark-submission-policies"],
    ["benchmarkSubmission", "/api/v1/benchmark-submissions"],
    ["screenFeatureParityCheck", "/api/v1/screens/rating/feature-parity-check"],
    ["simplifiedCopyPreview", "/api/v1/screens/rating/simplified-copy-preview"],
  ]) {
    const response = await invokeApi(context, {
      method: "POST",
      url,
      headers: resourceKey === "assignmentDecline" ? raterHeaders : adminHeaders,
      body: JSON.stringify({ [resourceKey]: interactionWorkflow[resourceKey] }),
    });
    assert.equal(response.status, 201, resourceKey);
  }

  const remediationCompletion = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/raters/me/remediation/centrality-strength-product/complete",
    headers: raterHeaders,
    body: JSON.stringify({ raterLearningPlan: interactionWorkflow.raterLearningPlan }),
  });
  assert.equal(remediationCompletion.status, 201);

  const raterSessionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/rater-sessions/rater-session-workflow-new",
    headers: raterHeaders,
  });
  assert.equal(raterSessionById.status, 200);
  assert.equal(raterSessionById.body.expectedEffortCompleted, "within_band");

  const practiceSessionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/practice-sessions/practice-session-workflow-new",
    headers: raterHeaders,
  });
  assert.equal(practiceSessionById.status, 200);
  assert.equal(practiceSessionById.body.excludedFromRatingDenominator, true);

  const assignmentScreenState = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/assignments/assign-ai-base-rate/screen-state",
    headers: raterHeaders,
  });
  assert.equal(assignmentScreenState.status, 200);
  assert.equal(assignmentScreenState.body.sanitized, true);
  assert.ok(assignmentScreenState.body.enabledActionAllowlist.includes("safe_decline"));

  const postLockSessionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/discussions/discussion-thread-workflow-new/post-lock-sessions/post-lock-discussion-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(postLockSessionById.status, 200);
  assert.equal(postLockSessionById.body.initialRatingLockCheck, "all_initial_ratings_locked");

  const discussionScreenState = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/discussions/discussion-thread-workflow-new/screen-state",
    headers: adminHeaders,
  });
  assert.equal(discussionScreenState.status, 200);
  assert.equal(discussionScreenState.body.surface, "discussion");

  const adjudicationCockpit = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/adjudications/adjudication-workflow-new/cockpit",
    headers: adminHeaders,
  });
  assert.equal(adjudicationCockpit.status, 200);
  assert.equal(adjudicationCockpit.body.reviewSession.id, "adjudication-review-session-workflow-new");

  const calibrationDashboard = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/raters/me/calibration-dashboard",
    headers: raterHeaders,
  });
  assert.equal(calibrationDashboard.status, 200);
  assert.equal(calibrationDashboard.body.latestLearningPlan.id, "rater-learning-plan-workflow-new");
  assert.equal(calibrationDashboard.body.calibrationFeedbackEvents.length, 1);

  const benchmarkAggregate = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/benchmark-submissions/benchmark-submission-workflow-new/aggregate-report",
    headers: adminHeaders,
  });
  assert.equal(benchmarkAggregate.status, 200);
  assert.equal(benchmarkAggregate.body.aggregateOnly, true);
  assert.equal(benchmarkAggregate.body.perItemOutputIncluded, false);

  const simplifiedCopyPreview = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/screens/rating/simplified-copy-preview",
    headers: adminHeaders,
  });
  assert.equal(simplifiedCopyPreview.status, 200);
  assert.equal(simplifiedCopyPreview.body.exactRubricTermPreservation, true);

  const releaseConfig = completeReleaseConfigWorkflowFixtures();
  const canonicalizationProfile = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/governed-bundle-canonicalization-profiles",
    headers: adminHeaders,
    body: JSON.stringify({ governedBundleCanonicalizationProfile: releaseConfig.governedBundleCanonicalizationProfile }),
  });
  assert.equal(canonicalizationProfile.status, 201);

  const canonicalizationProfileById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/governed-bundle-canonicalization-profiles/canonicalization-profile-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(canonicalizationProfileById.status, 200);
  assert.equal(canonicalizationProfileById.body.hashAlgorithm, "sha256");

  for (const governedBundleRecord of releaseConfig.governedBundleRecords) {
    const governedBundle = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/governed-bundles",
      headers: adminHeaders,
      body: JSON.stringify({ governedBundleRecord }),
    });
    assert.equal(governedBundle.status, 201, governedBundleRecord.bundleFamily);
  }

  const governedBundleById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/governed-bundles/governed-bundle-workflow-rubric",
    headers: adminHeaders,
  });
  assert.equal(governedBundleById.status, 200);
  assert.equal(governedBundleById.body.bundleFamily, "rubric");

  const governedBundleVerification = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/governed-bundles/governed-bundle-workflow-rubric/verify",
    headers: adminHeaders,
    body: JSON.stringify({ governedBundleVerification: releaseConfig.governedBundleVerification }),
  });
  assert.equal(governedBundleVerification.status, 201);

  const releaseConfigManifest = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/release-config-manifests",
    headers: adminHeaders,
    body: JSON.stringify({ releaseConfigManifest: releaseConfig.releaseConfigManifest }),
  });
  assert.equal(releaseConfigManifest.status, 201);

  const releaseConfigManifestById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/release-config-manifests/release-config-manifest-workflow-new",
    headers: adminHeaders,
  });
  assert.equal(releaseConfigManifestById.status, 200);
  assert.equal(releaseConfigManifestById.body.releaseId, "october-2026-demo");

  const releaseConfigManifestVerification = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/release-config-manifests/release-config-manifest-workflow-new/verify",
    headers: adminHeaders,
    body: JSON.stringify({ releaseConfigManifestVerification: releaseConfig.releaseConfigManifestVerification }),
  });
  assert.equal(releaseConfigManifestVerification.status, 201);

  const manifestForRelease = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/releases/october-2026-demo/config-manifest",
    headers: adminHeaders,
  });
  assert.equal(manifestForRelease.status, 200);
  assert.equal(manifestForRelease.body.id, "release-config-manifest-workflow-new");

  const manifestForEvaluation = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/evaluations/eval-workflow-new/release-config-manifest",
    headers: adminHeaders,
  });
  assert.equal(manifestForEvaluation.status, 200);
  assert.equal(manifestForEvaluation.body.id, "release-config-manifest-workflow-new");

  const operationalControls = completeOperationalControlWorkflowFixtures();
  for (const policyActionKind of operationalControls.policyActionKindRecords) {
    const response = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/policy-action-kinds",
      headers: adminHeaders,
      body: JSON.stringify({ policyActionKind }),
    });
    assert.equal(response.status, 201, policyActionKind.actionKind);
  }

  const policyActionKindById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/policy-action-kinds/policy-action-kind-workflow-rating_lock",
    headers: adminHeaders,
  });
  assert.equal(policyActionKindById.status, 200);
  assert.equal(policyActionKindById.body.wrongScopeBehavior, "fail_closed");

  for (const policyDecisionRecord of operationalControls.policyDecisionRecords) {
    const response = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/policy-decisions",
      headers: adminHeaders,
      body: JSON.stringify({ policyDecisionRecord }),
    });
    assert.equal(response.status, 201, policyDecisionRecord.actionKind);
  }

  const policyDecisionById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/policy-decisions/policy-decision-workflow-rating_lock",
    headers: adminHeaders,
  });
  assert.equal(policyDecisionById.status, 200);
  assert.equal(policyDecisionById.body.manifestId, "release-config-manifest-workflow-new");

  const policyDecisionConsumption = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/policy-decisions/policy-decision-workflow-rating_lock/consume",
    headers: adminHeaders,
    body: JSON.stringify({ policyDecisionConsumption: operationalControls.policyDecisionConsumption }),
  });
  assert.equal(policyDecisionConsumption.status, 201);

  const policyDecisionReplay = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/policy-decisions/policy-decision-workflow-rating_lock/consume",
    headers: adminHeaders,
    body: JSON.stringify({
      policyDecisionConsumption: {
        ...operationalControls.policyDecisionConsumption,
        id: "policy-decision-consumption-replay",
      },
    }),
  });
  assert.equal(policyDecisionReplay.status, 409);
  assert.equal(policyDecisionReplay.body.error, "policy_decision_already_consumed");

  const implementationPhaseGate = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/implementation-phase-gate-bundles",
    headers: adminHeaders,
    body: JSON.stringify({ implementationPhaseGateBundle: operationalControls.implementationPhaseGateBundle }),
  });
  assert.equal(implementationPhaseGate.status, 201);

  const implementationPhase = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/implementation-phase",
    headers: adminHeaders,
  });
  assert.equal(implementationPhase.status, 200);
  assert.equal(implementationPhase.body.futurePhaseDefault, "blocked");
  assert.equal(implementationPhase.body.laneStates.length, phaseGateLaneKinds.length);

  for (const queueFreshnessPolicy of operationalControls.queueFreshnessPolicies) {
    const policyResponse = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/queue-freshness-policies",
      headers: adminHeaders,
      body: JSON.stringify({ queueFreshnessPolicy }),
    });
    assert.equal(policyResponse.status, 201, queueFreshnessPolicy.lane);

    const scan = operationalControls.queueStaleByDelayScans.find((item) => item.lane === queueFreshnessPolicy.lane);
    const scanResponse = await invokeApi(context, {
      method: "POST",
      url: `/api/v1/queues/${queueFreshnessPolicy.lane}/stale-by-delay-scan`,
      headers: adminHeaders,
      body: JSON.stringify({ queueStaleByDelayScan: scan }),
    });
    assert.equal(scanResponse.status, 201, queueFreshnessPolicy.lane);
  }

  const queueFreshnessById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/queue-freshness-policies/queue-freshness-workflow-assignment",
    headers: adminHeaders,
  });
  assert.equal(queueFreshnessById.status, 200);
  assert.equal(queueFreshnessById.body.workerConsumeRevalidationRequired, true);

  for (const clientSurfaceIntegrityPolicy of operationalControls.clientSurfaceIntegrityPolicies) {
    const policyResponse = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/client-surface-integrity-policies",
      headers: adminHeaders,
      body: JSON.stringify({ clientSurfaceIntegrityPolicy }),
    });
    assert.equal(policyResponse.status, 201, clientSurfaceIntegrityPolicy.surface);

    const check = operationalControls.clientSurfaceIntegrityChecks.find((item) => item.surface === clientSurfaceIntegrityPolicy.surface);
    const checkResponse = await invokeApi(context, {
      method: "POST",
      url: `/api/v1/client-surfaces/${clientSurfaceIntegrityPolicy.id}/integrity-check`,
      headers: adminHeaders,
      body: JSON.stringify({ clientSurfaceIntegrityCheck: check }),
    });
    assert.equal(checkResponse.status, 201, clientSurfaceIntegrityPolicy.surface);
  }

  const clientSurfacePolicyById = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/client-surface-integrity-policies/client-surface-integrity-workflow-rating",
    headers: adminHeaders,
  });
  assert.equal(clientSurfacePolicyById.status, 200);
  assert.equal(clientSurfacePolicyById.body.sessionReplayProhibited, true);

  for (const sensitiveAuditChainEvent of operationalControls.sensitiveAuditChainEvents) {
    const response = await invokeApi(context, {
      method: "POST",
      url: "/api/v1/sensitive-audit-chain/events",
      headers: adminHeaders,
      body: JSON.stringify({ sensitiveAuditChainEvent }),
    });
    assert.equal(response.status, 201, sensitiveAuditChainEvent.eventKind);
  }

  const auditChainEvents = await invokeApi(context, {
    method: "GET",
    url: "/api/v1/sensitive-audit-chain/events",
    headers: adminHeaders,
  });
  assert.equal(auditChainEvents.status, 200);
  assert.equal(auditChainEvents.body.events.length, auditChainEventKinds.length);

  const auditChainVerification = await invokeApi(context, {
    method: "POST",
    url: "/api/v1/sensitive-audit-chain/verify",
    headers: adminHeaders,
    body: JSON.stringify({ id: "sensitive-audit-chain-verification-workflow-new", verifiedAt: "2026-10-01T00:18:00.000Z" }),
  });
  assert.equal(auditChainVerification.status, 201);
  assert.equal(auditChainVerification.body.chainStatus, "passed");

  const releaseReport = await invokeApi(context, { method: "GET", url: "/api/release/report" });
  assert.equal(releaseReport.status, 200);
  assert.equal(releaseReport.body.corpusManifest.counts.positions, 4);
  assert.equal(releaseReport.body.corpusManifest.counts.critiques, 6);
  assert.equal(releaseReport.body.targetGaps.positionsRemaining, 116);
  assert.equal(releaseReport.body.targetGaps.critiquesRemaining, 354);
  assert.equal(releaseReport.body.certification.loadedGoldLibraryItems, 4);
  assert.equal(releaseReport.body.targetGaps.goldItemsRemaining, 56);
  assert.equal(releaseReport.body.protectedSplitIsolation.goldRows.some((row) => row.itemId === "gold-item-workflow-new"), true);
  assert.equal(releaseReport.body.validationDesign.status, "appendix_c_scale");
  assert.equal(releaseReport.body.validationDesign.submittedValidationEvidence.bestRunId, "human-ceiling-workflow-new");
  assert.equal(releaseReport.body.humanCeiling.releaseUseStatus, "human_ceiling_claims_allowed_with_declared_uncertainty");
  assert.equal(releaseReport.body.targetGaps.validationCritiquesRemaining, 0);
  assert.equal(releaseReport.body.targetGaps.validationPositionsRemaining, 0);
  assert.equal(releaseReport.body.targetGaps.validationCoreAllItemsRatersRemaining, 0);
  assert.equal(releaseReport.body.releaseVersionManifest.submittedReleaseVersionId, "release-version-workflow-new");
  assert.equal(releaseReport.body.releaseVersionManifest.submittedReleaseFreezeId, "release-freeze-workflow-new");
  assert.equal(releaseReport.body.releaseVersionManifest.linkedArtifactStatus, "release_manifest_links_current_artifacts");
  assert.equal(releaseReport.body.releaseVersionManifest.freezeEvidence.freezeStatus, "candidate_freeze_recorded");
  assert.equal(releaseReport.body.releaseVersionManifest.currentStatus, "incomplete_against_october_target");
  assert.equal(
    releaseReport.body.releaseVersionManifest.targetScaleStatus,
    "not_target_scale_until_120_positions_360_critiques_1440_blind_ratings",
  );
  assert.equal(releaseReport.body.releaseVersionManifest.releaseUseStatus, "submitted_release_manifest_recorded_but_target_scale_incomplete");
  assert.deepEqual(
    releaseReport.body.releaseVersionManifest.linkedArtifactChecks.map((check) => check.status),
    ["matches_current_artifact", "matches_current_artifact", "matches_current_artifact", "matches_current_artifact"],
  );
  assert.equal(releaseReport.body.releaseGateProfile.submittedProfileId, "release-gate-workflow-new");
  assert.equal(releaseReport.body.releaseGateProfile.profileCoverage.status, "submitted_profile_missing_required_gates");
  assert.equal(releaseReport.body.releaseGateEvaluation.missingRequiredProfileGateCount, 10);
  assert.equal(releaseReport.body.pairedTargetLabelSnapshots.primaryRaterAnchorPolicy.id, "primary-rater-policy-workflow-new");
  assert.equal(releaseReport.body.pairedTargetLabelSnapshots.primaryRaterAnchorPolicy.policyStatus, "submitted_anchor_policy_predeclared");
  assert.equal(
    releaseReport.body.pairedTargetLabelSnapshots.primaryRaterAnchorSnapshot.primaryRaterAnchor.selectionPolicyId,
    "primary-rater-policy-workflow-new",
  );
  assert.equal(releaseReport.body.pairedTargetLabelSnapshots.primaryRaterAnchorSnapshot.primaryRaterAnchor.coverageThresholdMet, true);
  assert.equal(releaseReport.body.comparabilityClaims.find((claim) => claim.tier === "method_preserving").submittedClaimId, "comparability-claim-workflow-new");
  assert.equal(releaseReport.body.comparabilityClaims.find((claim) => claim.tier === "method_preserving").statusSource, "submitted_comparability_claim");
  assert.equal(releaseReport.body.comparabilityClaims.find((claim) => claim.tier === "corpus_scale_comparable").submittedStatus, "fails_until_target_loaded");
  assert.equal(releaseReport.body.comparabilityClaims.find((claim) => claim.tier === "target_label_comparable").normalizedSubmittedStatus, "partial");
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.hiddenPositionCount, 2);
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.hiddenCritiqueCount, 3);
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.submittedSplitMembership.appliedHiddenPositionCount, 1);
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.rightsStatus.status, "pass");
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.rightsStatus.releaseScopeFailures.includes("pos-ai-prior"), false);
  assert.equal(releaseReport.body.positionIntakeReadiness.rows.some((row) => row.positionId === "pos-workflow-new"), true);
  assert.equal(releaseReport.body.workflowActionArtifacts.rightsReviews.length, 1);
  assert.equal(releaseReport.body.workflowActionArtifacts.releaseFreezes.length, 1);
  assert.equal(releaseReport.body.workflowActionArtifacts.assignmentFlags.length, 1);
  assert.equal(releaseReport.body.workflowActionArtifacts.discussions.length, 1);
  assert.equal(releaseReport.body.workflowActionArtifacts.adjudications.length, 1);
  assert.equal(releaseReport.body.workflowActionArtifacts.adjudicationFinalizations.length, 1);
  assert.equal(releaseReport.body.workflowActionArtifacts.verificationRecords.length, 1);
  const workflowVerificationRow = releaseReport.body.correctnessVerification.verificationRows.find((row) => row.itemId === "pos-ai-prior::crit-ai-base-rate");
  assert.equal(workflowVerificationRow.latestRecordId, "verification-workflow-new");
  assert.equal(workflowVerificationRow.latestRecordSource, "submitted_workflow_verification_record");
  assert.equal(workflowVerificationRow.verificationStatus, "not_practicable");
  assert.equal(workflowVerificationRow.verifierRole, "expert");
  assert.equal(releaseReport.body.workflowActionArtifacts.candidateBatchModelJudgeScoreSubmissions.length, 1);
  assert.equal(releaseReport.body.workflowActionArtifacts.candidateReviews.length, 1);
  assert.equal(releaseReport.body.workflowActionArtifacts.candidatePromotions.length, 1);
  assert.equal(releaseReport.body.workflowActionArtifacts.generatedCritiquePromotions.length, 1);
  assert.equal(releaseReport.body.workflowAuditTrailArtifacts.certificationRecords.length, 1);
  assert.equal(releaseReport.body.certification.certificationRecordEvidence.submittedRecordCount, 1);
  assert.equal(releaseReport.body.certification.certificationRecordEvidence.certifiedRecordCount, 1);
  assert.equal(releaseReport.body.certification.certificationRecordEvidence.rows[0].recordId, "certification-record-workflow-new");
  assert.equal(
    releaseReport.body.certification.certificationRecordEvidence.releaseUseStatus,
    "submitted_certification_records_gatekeeping_evidence_complete",
  );
  assert.equal(releaseReport.body.workflowAuditTrailArtifacts.exposureLogs.length, 1);
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.accessAudit.workflowExposureLogCount, 1);
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.accessAudit.actions.membership_view, 1);
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.accessAudit.byExposureSource.submitted_workflow_exposure_log, 1);
  assert.equal(releaseReport.body.workflowAuditTrailArtifacts.revisionRecords.length, 1);
  assert.equal(releaseReport.body.ratingRevisionAudit.submittedRevisionRecordEvidence.submittedRecordCount, 1);
  assert.equal(releaseReport.body.ratingRevisionAudit.submittedRevisionRecordEvidence.completeRecordCount, 1);
  assert.equal(releaseReport.body.ratingRevisionAudit.submittedRevisionRecordEvidence.rows[0].priorRatingFound, true);
  assert.equal(releaseReport.body.ratingRevisionAudit.submittedRevisionRecordEvidence.rows[0].recordStatus, "submitted_revision_record_complete");
  assert.equal(releaseReport.body.workflowAuditTrailArtifacts.discussionThreads.length, 1);
  assert.equal(releaseReport.body.workflowAuditTrailArtifacts.adjudicationMemos.length, 1);
  const workflowMemoRow = releaseReport.body.adjudicationMemoAudit.memoRows.find((row) => row.memoId === "adjudication-memo-workflow-new");
  assert.equal(workflowMemoRow.memoSource, "submitted_workflow_adjudication_memo");
  assert.deepEqual(workflowMemoRow.plausibleInterpretations, ["central_base_rate_attack", "side_assumption_only"]);
  assert.deepEqual(workflowMemoRow.disagreementTaxonomy, ["strength_centrality_allocation"]);
  assert.equal(releaseReport.body.workflowAuditTrailArtifacts.ratingChecks.length, 2);
  assert.equal(releaseReport.body.modelAssistedLabelOverlap.counts.submittedRatingCheckRows, 2);
  assert.equal(releaseReport.body.modelAssistedLabelOverlap.counts.submittedModelAssistedRatingCheckRows, 1);
  assert.equal(
    releaseReport.body.modelAssistedLabelOverlap.assistanceRows.some(
      (row) => row.ratingCheckId === "rating-check-workflow-new" && row.assistanceSource === "submitted_workflow_rating_check",
    ),
    true,
  );
  assert.equal(
    releaseReport.body.modelAssistedLabelOverlap.runRows.find((row) => row.evaluationRunId === "eval-full-rubric-demo").status,
    "model_assisted_label_overlap_sensitive",
  );
  assert.equal(releaseReport.body.workflowReproducibilityArtifacts.itemTextVersions.length, 1);
  assert.equal(releaseReport.body.workflowReproducibilityArtifacts.ratingContextSnapshots.length, 1);
  assert.equal(releaseReport.body.workflowReproducibilityArtifacts.pairwiseComparisonSnapshots.length, 1);
  assert.equal(releaseReport.body.workflowReproducibilityArtifacts.raterReliabilityWeightModels.length, 1);
  assert.equal(releaseReport.body.raterReliabilityWeightModelEvidence.submittedModelCount, 1);
  assert.equal(releaseReport.body.raterReliabilityWeightModelEvidence.activeSubmittedModelId, "reliability-weight-model-workflow-new");
  assert.equal(
    releaseReport.body.raterReliabilityWeightModelEvidence.activeSubmittedReliabilityWeightModelId,
    "uniform-v1-with-sensitivity",
  );
  assert.equal(releaseReport.body.raterReliabilityWeightModelEvidence.reviewRows.length, 0);
  assert.equal(releaseReport.body.raterReliabilityWeightModelEvidence.releaseUseStatus, "active_submitted_weight_model_provenance_complete");
  assert.equal(
    releaseReport.body.labelSnapshotReliability.raterReliabilityWeightModelEvidence.activeSubmittedModelId,
    "reliability-weight-model-workflow-new",
  );
  const workflowTrainingExample = releaseReport.body.trainingExport.pointwiseExamples.find((example) => example.critiqueId === "crit-ai-base-rate");
  assert.equal(workflowTrainingExample.critiqueTextVersionId, "item-text-version-workflow-new");
  assert.equal(workflowTrainingExample.critiqueCanonicalHash, "sha256-test-canonical");
  assert.equal(releaseReport.body.trainingExport.ratingContextSnapshots.some((snapshot) => snapshot.id === "rating-context-workflow-new"), true);
  assert.equal(releaseReport.body.trainingExport.pairwiseComparisonSnapshot.id, "pairwise-snapshot-workflow-new");
  assert.equal(releaseReport.body.trainingExport.pairwiseComparisonSnapshotSource, "submitted_workflow_pairwise_comparison_snapshot");
  assert.equal(releaseReport.body.trainingExport.pairwiseComparisonSnapshotStatus, "submitted_pairwise_snapshot_applied");
  assert.equal(releaseReport.body.trainingExport.submittedPairwiseComparisonSnapshotId, "pairwise-snapshot-workflow-new");
  assert.equal(releaseReport.body.workflowOperationalArtifacts.raters.length, 1);
  assert.equal(releaseReport.body.workflowOperationalArtifacts.assignments.length, 1);
  assert.equal(releaseReport.body.workflowOperationalArtifacts.candidateBatches.length, 1);
  assert.equal(releaseReport.body.workflowOperationalArtifacts.candidateCritiques.length, 1);
  assert.equal(releaseReport.body.workflowOperationalArtifacts.modelJudgeScores.length, 1);
  assert.equal(releaseReport.body.workflowOperationalArtifacts.generatedCritiqueSubmissions.length, 1);
  assert.equal(releaseReport.body.workflowOperationalArtifacts.modelEvaluationPredictions.length, 1);
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.critiqueGenerationRuns.length, 1);
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.generationEvaluationReports.length, 1);
  const submittedGenerationRun = releaseReport.body.critiqueGenerationEvaluation.runRows.find((row) => row.id === "critique-generation-run-workflow-new");
  assert.equal(submittedGenerationRun.runSource, "submitted_workflow_critique_generation_run");
  assert.deepEqual(submittedGenerationRun.submittedGenerationEvaluationReportIds, ["generation-evaluation-report-workflow-new"]);
  assert.equal(submittedGenerationRun.outputStatusCounts.promoted_to_rating, 1);
  assert.equal(submittedGenerationRun.outputRows.find((row) => row.promotedCritiqueId === "crit-workflow-new").adjudicated, true);
  assert.equal(submittedGenerationRun.counts.adjudicatedPromoted, 1);
  assert.equal(submittedGenerationRun.counts.blindHumanRatedPromoted, 0);
  assert.equal(releaseReport.body.critiqueGenerationEvaluation.aggregateCounts.generatedOutputs, 7);
  assert.equal(releaseReport.body.critiqueGenerationEvaluation.aggregateCounts.promotedToRating, 3);
  assert.equal(
    releaseReport.body.critiqueGenerationEvaluation.releaseUseStatus,
    "generation_evaluation_requires_blinding_or_rating_coverage_review",
  );
  assert.equal(releaseReport.body.promptTrackSeparation.rows.some((row) => row.runId === "critique-generation-run-workflow-new"), true);
  assert.equal(releaseReport.body.candidateIntakeQualityAudit.generatedOutputStatusCounts.promoted_to_rating, 3);
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.promptTemplates.length, 1);
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.parserConfigs.length, 1);
  assert.equal(releaseReport.body.promptParserProvenance.counts.submittedPromptTemplateCount, 1);
  assert.equal(releaseReport.body.promptParserProvenance.counts.submittedParserConfigCount, 1);
  assert.equal(releaseReport.body.promptParserProvenance.releaseUseStatus, "submitted_prompt_parser_provenance_complete");
  assert.equal(
    releaseReport.body.promptParserProvenance.promptReferenceRows.some(
      (row) => row.sourceId === "eval-workflow-new" && row.referenceSource === "submitted_workflow_prompt_template",
    ),
    true,
  );
  assert.equal(
    releaseReport.body.promptParserProvenance.parserReferenceRows.some(
      (row) => row.sourceId === "prediction-workflow-new" && row.referenceSource === "submitted_workflow_parser_config",
    ),
    true,
  );
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.modelImprovementRuns.length, 1);
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.evaluationRuns.length, 1);
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.modelEvaluationPredictions.length, 1);
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.calibrationRuns.length, 1);
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.artifactProbeRuns.length, 1);
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.artifactProbeDiagnostics.status, "partial");
  assert.deepEqual(releaseReport.body.hiddenBenchmarkFreeze.artifactProbeDiagnostics.completedProbeFamilies, ["critique_only"]);
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.artifactProbeDiagnostics.submittedRunRows[0].id, "artifact-probe-workflow-new");
  assert.equal(releaseReport.body.hiddenBenchmarkFreeze.artifactProbeDiagnostics.submittedRunRows[0].status, "submitted_artifact_probe_authorized");
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.sanityBaselineRuns.length, 1);
  assert.equal(releaseReport.body.sanityBaselines.submittedBaselineEvidence.submittedRunCount, 1);
  assert.equal(releaseReport.body.sanityBaselines.submittedBaselineEvidence.releaseUseStatus, "submitted_sanity_baselines_fit_policy_preserved");
  assert.equal(releaseReport.body.sanityBaselines.releaseUseStatus, "submitted_sanity_baselines_attached");
  assert.equal(
    releaseReport.body.sanityBaselines.baselines.some((baseline) => baseline.id === "sanity-baseline-workflow-new" && baseline.baselineSource === "submitted_workflow_sanity_baseline_run"),
    true,
  );
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.humanCeilingRuns.length, 1);
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.leaderboards.length, 1);
  assert.equal(releaseReport.body.workflowModelEvaluationArtifacts.modelFailureAudits.length, 1);
  assert.equal(
    releaseReport.body.modelEvaluationArtifactEvidence.releaseUseStatus,
    "submitted_model_evaluation_artifacts_release_evidence_complete",
  );
  assert.equal(
    releaseReport.body.modelEvaluationArtifactEvidence.modelImprovementRunEvidence.status,
    "submitted_model_improvement_run_preserves_surrogate_separation",
  );
  assert.equal(releaseReport.body.modelEvaluationArtifactEvidence.evaluationRunEvidence.submittedArtifactId, "eval-workflow-new");
  assert.equal(releaseReport.body.modelEvaluationArtifactEvidence.evaluationRunEvidence.status, "submitted_evaluation_run_matches_current_target");
  assert.equal(
    releaseReport.body.modelEvaluationArtifactEvidence.predictionEvidence.status,
    "submitted_model_evaluation_predictions_preserve_text_context_and_parser_provenance",
  );
  assert.equal(
    releaseReport.body.modelEvaluationArtifactEvidence.calibrationRunEvidence.status,
    "submitted_calibration_run_preserves_protected_fit_policy",
  );
  assert.equal(
    releaseReport.body.modelEvaluationArtifactEvidence.leaderboardEvidence.status,
    "submitted_leaderboard_declares_common_subset_uncertainty_policy",
  );
  assert.equal(
    releaseReport.body.modelEvaluationArtifactEvidence.failureAuditEvidence.status,
    "submitted_model_failure_audit_is_diagnostic_only",
  );
  assert.deepEqual(releaseReport.body.modelEvaluationArtifactEvidence.reviewSections, []);
  assert.equal(releaseReport.body.workflowUxArtifacts.uxSimplificationPolicies.length, 1);
  assert.equal(releaseReport.body.workflowUxArtifacts.uxSimplificationReviews.length, 1);
  assert.equal(releaseReport.body.workflowUxArtifacts.screenStatePayloads.length, uxSimplificationSurfaces.length);
  assert.equal(releaseReport.body.uxSimplification.releaseUseStatus, "submitted_ux_simplification_evidence_complete");
  assert.equal(releaseReport.body.uxSimplification.counts.passingSurfaceCount, uxSimplificationSurfaces.length);
  assert.deepEqual(releaseReport.body.uxSimplification.reviewSections, []);
  assert.equal(
    releaseReport.body.uxSimplification.surfaceRows.every((row) => row.status === "ux_surface_simplification_gate_passed"),
    true,
  );
  assert.equal(releaseReport.body.workflowStateArtifacts.workflowStateTransitionLogs.length, workflowStateTransitionFixtures.length);
  assert.equal(releaseReport.body.workflowStateMachineEvidence.releaseUseStatus, "submitted_workflow_state_machine_evidence_complete");
  assert.equal(releaseReport.body.workflowStateMachineEvidence.counts.passingEntityTypeCount, workflowStateTransitionFixtures.length);
  assert.deepEqual(releaseReport.body.workflowStateMachineEvidence.reviewSections, []);
  assert.equal(
    releaseReport.body.workflowStateMachineEvidence.entityRows.every((row) => row.status === "workflow_state_machine_entity_complete"),
    true,
  );
  assert.equal(releaseReport.body.workflowParticipantDataArtifacts.raterDataConsents.length, 1);
  assert.equal(releaseReport.body.workflowParticipantDataArtifacts.raterDataRestrictionRequests.length, 1);
  assert.equal(releaseReport.body.workflowParticipantDataArtifacts.volunteerDataWithdrawalRequests.length, 1);
  assert.equal(releaseReport.body.raterDataGovernance.releaseUseStatus, "submitted_rater_data_governance_evidence_complete");
  assert.equal(releaseReport.body.raterDataGovernance.counts.submittedConsentCount, 1);
  assert.equal(releaseReport.body.raterDataGovernance.counts.submittedWithdrawalRequestCount, 1);
  assert.deepEqual(releaseReport.body.raterDataGovernance.reviewSections, []);
  assert.equal(releaseReport.body.workflowPolicyArtifacts.visibilityPolicies.length, 1);
  assert.equal(releaseReport.body.workflowPolicyArtifacts.ratingWorkflowProfiles.length, 1);
  assert.equal(releaseReport.body.workflowPolicyArtifacts.uiExperimentPolicies.length, 1);
  assert.equal(releaseReport.body.workflowPolicyArtifacts.preSubmitAssistPolicies.length, 1);
  assert.equal(releaseReport.body.workflowPolicyArtifacts.accessibilityConformanceReports.length, 1);
  assert.equal(releaseReport.body.policyBundleEvidence.releaseUseStatus, "submitted_policy_bundle_evidence_complete");
  assert.equal(releaseReport.body.policyBundleEvidence.counts.completePolicyGroupCount, 5);
  assert.deepEqual(releaseReport.body.policyBundleEvidence.reviewSections, []);
  assert.equal(releaseReport.body.workflowParticipantSafeguardArtifacts.volunteerIncentivePolicies.length, 1);
  assert.equal(releaseReport.body.workflowParticipantSafeguardArtifacts.raterQualificationRecords.length, qualificationScopes.length);
  assert.equal(releaseReport.body.workflowParticipantSafeguardArtifacts.languageArtifactAssessments.length, 1);
  assert.equal(releaseReport.body.workflowParticipantSafeguardArtifacts.sourceRecognitionEvents.length, 1);
  assert.equal(releaseReport.body.workflowParticipantSafeguardArtifacts.modelProviderDataHandlingPolicies.length, modelProviderRunClasses.length);
  assert.equal(releaseReport.body.participantSafeguardEvidence.releaseUseStatus, "submitted_participant_safeguard_evidence_complete");
  assert.equal(releaseReport.body.participantSafeguardEvidence.counts.passingQualificationScopeCount, qualificationScopes.length);
  assert.equal(releaseReport.body.participantSafeguardEvidence.counts.passingModelProviderRunClassCount, modelProviderRunClasses.length);
  assert.deepEqual(releaseReport.body.participantSafeguardEvidence.reviewSections, []);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.taskOutputEligibilityPolicies.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.scoreInputPolicies.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.raterInstructionRenderVersions.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.rubricLintConfigs.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.rubricLintEvents.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.itemIssueReports.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.ratingDraftSessions.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.correctnessClaimWeightWorksheets.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.protectedArtifactRetentionRecords.length, protectedArtifactTypes.length);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.scoreConfidenceAnnotations.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.rationaleEvidenceSpans.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.samePositionScratchpads.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.samePositionBatchReviews.length, 1);
  assert.equal(releaseReport.body.workflowRatingExperienceArtifacts.externalAssistanceDeclarations.length, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.releaseUseStatus, "submitted_rating_experience_evidence_complete");
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedScoreInputPolicyCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedRaterInstructionRenderVersionCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedRubricLintEventCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedItemIssueReportCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedRatingDraftSessionCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedCorrectnessClaimWeightWorksheetCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedProtectedArtifactRetentionRecordCount, protectedArtifactTypes.length);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedScoreConfidenceAnnotationCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedRaterScoreConfidenceCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedRationaleEvidenceSpanCount, 1);
  assert.equal(
    releaseReport.body.ratingExperienceEvidence.rationaleEvidenceSpanRows.at(-1).normalizedSelectedTextHash,
    "sha256:workflow-rationale-evidence-span",
  );
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedSamePositionScratchpadCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedSamePositionBatchReviewCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.submittedExternalAssistanceDeclarationCount, 1);
  assert.equal(releaseReport.body.ratingExperienceEvidence.counts.passingProtectedArtifactTypeCount, protectedArtifactTypes.length);
  assert.deepEqual(releaseReport.body.ratingExperienceEvidence.reviewSections, []);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.blindingPreviewAudits.length, 1);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.partialTaskOutputs.length, partialTaskOutputTypes.length);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.raterPositionClusterExposures.length, 1);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.spotCheckQaItems.length, 1);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.adjudicationTriageQueueItems.length, 1);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.diagnosticDeferralRecords.length, 1);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.queuePolicySnapshots.length, 1);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.assignmentSelectionAudits.length, 1);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.modelInferenceConfigs.length, 1);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.modelRunEnvironments.length, 1);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.raterItemConflicts.length, 2);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.raterTrainingExposureSnapshots.length, 1);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.releaseErrata.length, 2);
  assert.equal(releaseReport.body.workflowAuxiliaryArtifacts.scheduleStatusSnapshots.length, 1);
  assert.equal(releaseReport.body.auxiliaryWorkflowEvidence.releaseUseStatus, "submitted_auxiliary_workflow_evidence_complete");
  assert.equal(releaseReport.body.auxiliaryWorkflowEvidence.counts.submittedPartialTaskOutputCount, partialTaskOutputTypes.length);
  assert.equal(releaseReport.body.auxiliaryWorkflowEvidence.counts.passingPartialTaskTypeCount, partialTaskOutputTypes.length);
  assert.equal(releaseReport.body.auxiliaryWorkflowEvidence.counts.passingQueuePolicyComponentCount, queuePolicyComponents.length);
  assert.equal(releaseReport.body.auxiliaryWorkflowEvidence.counts.passingModelRunProvenanceCount, 1);
  assert.equal(releaseReport.body.auxiliaryWorkflowEvidence.counts.submittedSpotCheckQAItemCount, 1);
  assert.equal(releaseReport.body.auxiliaryWorkflowEvidence.counts.submittedRaterItemConflictCount, 2);
  assert.equal(releaseReport.body.auxiliaryWorkflowEvidence.counts.submittedReleaseErratumCount, 2);
  assert.deepEqual(releaseReport.body.auxiliaryWorkflowEvidence.reviewSections, []);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.publicExamplePracticeSessions.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.raterLearningPlans.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.raterSessions.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.assignmentDeclines.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.interpretationTargetMaps.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.verificationWorkspaceSessions.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.adjudicatorPreReads.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.postLockDiscussionSessions.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.adjudicationReviewSessions.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.calibrationFeedbackEvents.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.governanceApprovalRecords.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.protectedArtifactRevalidations.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.benchmarkSubmissionPolicies.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.benchmarkSubmissions.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.screenFeatureParityChecks.length, 1);
  assert.equal(releaseReport.body.workflowInteractionArtifacts.simplifiedCopyPreviews.length, 1);
  assert.equal(releaseReport.body.interactionWorkflowEvidence.releaseUseStatus, "submitted_interaction_workflow_evidence_complete");
  assert.equal(releaseReport.body.interactionWorkflowEvidence.counts.submittedArtifactGroupCount, 16);
  assert.equal(releaseReport.body.interactionWorkflowEvidence.counts.completeArtifactGroupCount, 16);
  assert.equal(releaseReport.body.interactionWorkflowEvidence.counts.submittedBenchmarkSubmissionCount, 1);
  assert.equal(releaseReport.body.interactionWorkflowEvidence.counts.submittedSimplifiedCopyPreviewCount, 1);
  assert.deepEqual(releaseReport.body.interactionWorkflowEvidence.reviewSections, []);
  assert.equal(releaseReport.body.workflowReleaseConfigArtifacts.governedBundleCanonicalizationProfiles.length, 1);
  assert.equal(releaseReport.body.workflowReleaseConfigArtifacts.governedBundleRecords.length, governedBundleFamilies.length);
  assert.equal(releaseReport.body.workflowReleaseConfigArtifacts.releaseConfigManifests.length, 1);
  assert.equal(releaseReport.body.workflowReleaseConfigArtifacts.releaseConfigManifestVerifications.length, 1);
  assert.equal(releaseReport.body.releaseConfigManifestEvidence.releaseUseStatus, "submitted_release_config_manifest_evidence_complete");
  assert.equal(releaseReport.body.releaseConfigManifestEvidence.counts.passingBundleFamilyCount, governedBundleFamilies.length);
  assert.equal(releaseReport.body.releaseConfigManifestEvidence.activeManifestId, "release-config-manifest-workflow-new");
  assert.deepEqual(releaseReport.body.releaseConfigManifestEvidence.reviewSections, []);
  assert.equal(releaseReport.body.workflowOperationalControlArtifacts.policyActionKinds.length, policyActionKinds.length);
  assert.equal(releaseReport.body.workflowOperationalControlArtifacts.policyDecisionRecords.length, policyActionKinds.length);
  assert.equal(releaseReport.body.workflowOperationalControlArtifacts.policyDecisionConsumptions.length, 1);
  assert.equal(releaseReport.body.workflowOperationalControlArtifacts.implementationPhaseGateBundles.length, 1);
  assert.equal(releaseReport.body.workflowOperationalControlArtifacts.queueFreshnessPolicies.length, queueFreshnessLanes.length);
  assert.equal(releaseReport.body.workflowOperationalControlArtifacts.queueStaleByDelayScans.length, queueFreshnessLanes.length);
  assert.equal(releaseReport.body.workflowOperationalControlArtifacts.clientSurfaceIntegrityPolicies.length, clientSurfaces.length);
  assert.equal(releaseReport.body.workflowOperationalControlArtifacts.clientSurfaceIntegrityChecks.length, clientSurfaces.length);
  assert.equal(releaseReport.body.workflowOperationalControlArtifacts.sensitiveAuditChainEvents.length, auditChainEventKinds.length);
  assert.equal(releaseReport.body.workflowOperationalControlArtifacts.sensitiveAuditChainVerifications.length, 1);
  assert.equal(releaseReport.body.operationalControlEvidence.releaseUseStatus, "submitted_operational_control_evidence_complete");
  assert.equal(releaseReport.body.operationalControlEvidence.counts.passingPolicyActionKindCount, policyActionKinds.length);
  assert.equal(releaseReport.body.operationalControlEvidence.counts.passingPhaseLaneCount, phaseGateLaneKinds.length);
  assert.equal(releaseReport.body.operationalControlEvidence.counts.passingQueueFreshnessLaneCount, queueFreshnessLanes.length);
  assert.equal(releaseReport.body.operationalControlEvidence.counts.passingClientSurfaceCount, clientSurfaces.length);
  assert.equal(releaseReport.body.operationalControlEvidence.counts.passingAuditChainKindCount, auditChainEventKinds.length);
  assert.deepEqual(releaseReport.body.operationalControlEvidence.reviewSections, []);
  assert.equal(releaseReport.body.workflowReleaseArtifacts.labelSnapshots.length, 1);
  assert.equal(releaseReport.body.workflowReleaseArtifacts.corpusManifests.length, 1);
  assert.equal(releaseReport.body.workflowReleaseArtifacts.trainingExports.length, 1);
  assert.equal(releaseReport.body.workflowReleaseArtifacts.exportManifests.length, 1);
  assert.equal(releaseReport.body.releaseArtifactEvidence.releaseUseStatus, "submitted_release_artifacts_match_current_release");
  assert.equal(releaseReport.body.releaseArtifactEvidence.labelSnapshotEvidence.submittedArtifactId, "label-snapshot-workflow-new");
  assert.equal(releaseReport.body.releaseArtifactEvidence.labelSnapshotEvidence.status, "submitted_label_snapshot_matches_current_release_target");
  assert.equal(releaseReport.body.releaseArtifactEvidence.corpusManifestEvidence.submittedArtifactId, "corpus-manifest-workflow-new");
  assert.equal(releaseReport.body.releaseArtifactEvidence.corpusManifestEvidence.status, "submitted_corpus_manifest_matches_current_release_counts");
  assert.equal(releaseReport.body.releaseArtifactEvidence.trainingExportEvidence.submittedArtifactId, "training-export-workflow-new");
  assert.equal(releaseReport.body.releaseArtifactEvidence.trainingExportEvidence.status, "submitted_training_export_preserves_current_release_policy");
  assert.equal(releaseReport.body.releaseArtifactEvidence.exportManifestEvidence.submittedArtifactId, "public-export-manifest-workflow-new");
  assert.equal(releaseReport.body.releaseArtifactEvidence.exportManifestEvidence.status, "submitted_public_export_manifest_preserves_current_release_policy");
  assert.deepEqual(releaseReport.body.releaseArtifactEvidence.reviewSections, []);
  assert.equal(releaseReport.body.workflowReleaseArtifacts.goldItems.length, 1);
  assert.equal(releaseReport.body.workflowReleaseArtifacts.sourceAnchorExamples.length, 1);
  assert.equal(releaseReport.body.sourceExampleAnchors.counts.anchorCount, 5);
  assert.equal(releaseReport.body.sourceExampleAnchors.counts.submittedAnchorCount, 1);
  assert.equal(releaseReport.body.sourceExampleAnchors.counts.submittedExposureViolationCount, 0);
  assert.equal(releaseReport.body.sourceExampleAnchors.counts.promptRegressionEligibleCount, 5);
  assert.equal(
    releaseReport.body.sourceExampleAnchors.anchorRows.find((row) => row.anchorId === "source-anchor-workflow-new").anchorSource,
    "submitted_workflow_source_anchor_example",
  );
  assert.equal(releaseReport.body.sourceExampleAnchors.releaseUseStatus, "source_anchor_suite_public_training_only");
  assert.equal(releaseReport.body.workflowReleaseArtifacts.benchmarkSplitMembers.length, 1);
  assert.equal(releaseReport.body.workflowReleaseArtifacts.rightsRecords.length, 1);
  assert.equal(releaseReport.body.workflowReleaseArtifacts.releaseVersions.length, 1);
  assert.equal(releaseReport.body.workflowGovernanceArtifacts.releaseGateProfiles.length, 1);
  assert.equal(releaseReport.body.workflowGovernanceArtifacts.primaryRaterAnchorPolicies.length, 1);
  assert.equal(releaseReport.body.workflowGovernanceArtifacts.comparabilityClaims.length, 1);
  assert.equal(releaseReport.body.workflowGovernanceArtifacts.activeLearningSelectionAudits.length, 1);
  assert.equal(releaseReport.body.activeLearning.submittedSelectionAuditIds.includes("selection-audit-workflow-new"), true);
  assert.equal(releaseReport.body.activeLearning.candidateWorkflowEvidence.candidateBatchCount, 1);
  assert.equal(releaseReport.body.activeLearning.candidateWorkflowEvidence.hiddenMetadataViolationCount, 0);
  assert.equal(releaseReport.body.activeLearning.candidateWorkflowEvidence.rows[0].candidateBatchId, "candidate-batch-workflow-new");
  assert.equal(releaseReport.body.activeLearning.candidateWorkflowEvidence.rows[0].promoted, 1);
  assert.equal(releaseReport.body.activeLearning.derivedCandidateWorkflowBatchCount, 0);
  assert.equal(releaseReport.body.activeLearning.acceptedCritiqueIds.includes("crit-workflow-new"), true);
  assert.equal(releaseReport.body.activeLearning.totals.generated, 62);
  assert.equal(releaseReport.body.activeLearning.totals.judged, 30);
  assert.equal(releaseReport.body.activeLearning.totals.promoted, 9);
  assert.equal(releaseReport.body.activeLearning.selectionReasonCounts.judge_disagreement, 3);
  assert.equal(releaseReport.body.activeLearning.rejectionReasonCounts.near_duplicate, 5);
  assert.equal(releaseReport.body.workflowMetricArtifacts.metricConfigs.length, 1);
  assert.equal(releaseReport.body.workflowMetricArtifacts.derivedUtilityFormulas.length, 1);
  assert.equal(releaseReport.body.metricDirectionalityConfig.effectiveMetricConfig.submittedMetricConfigId, "metric-config-workflow-new");
  assert.equal(releaseReport.body.metricDirectionalityConfig.effectiveMetricConfig.metricVersion, "lmca-october-2026-workflow");
  assert.equal(releaseReport.body.metricDirectionalityConfig.derivedUtilityFormula.submittedFormulaId, "derived-utility-workflow-new");
  assert.equal(
    releaseReport.body.metricDirectionalityConfig.pairwiseConfigRows.find((row) => row.metricFamily === "derived_utility_pairwise_diagnostic").derivedUtilityFormulaId,
    "derived-utility-workflow-new",
  );
  assert.equal(releaseReport.body.claimGatedDiagnosticRuns.sycophancyProbeRuns.length, 1);
  assert.equal(releaseReport.body.claimGatedDiagnosticRuns.obfuscationStressRuns.length, 1);
  const fullRubricAudit = releaseReport.body.modelFailureAudits.find((audit) => audit.evaluationRunId === "eval-full-rubric-demo");
  assert.equal(fullRubricAudit.claimGatedDiagnostics.releaseUseStatus, "claim_gated_diagnostics_attached_no_robustness_claim");
  assert.equal(
    fullRubricAudit.claimGatedDiagnostics.suites.find((suite) => suite.id === "sycophancy_orthodoxy_sensitivity").status,
    "completed_diagnostic_attached",
  );
  assert.equal(
    fullRubricAudit.claimGatedDiagnostics.suites.find((suite) => suite.id === "obfuscated_argument_stress").status,
    "completed_diagnostic_attached",
  );

  const corpusManifest = await invokeApi(context, { method: "POST", url: "/api/v1/corpus-manifests", headers: adminHeaders });
  assert.equal(corpusManifest.status, 200);
  assert.equal(corpusManifest.body.counts.positions, 4);
  assert.equal(corpusManifest.body.counts.critiques, 6);

  const publicExport = await invokeApi(context, { method: "POST", url: "/api/v1/exports/public", headers: adminHeaders });
  assert.equal(publicExport.status, 200);
  assert.equal(publicExport.body.counts.positions, 2);
  assert.equal(publicExport.body.counts.critiques, 3);

  const submittedFreeze = await invokeApi(context, { method: "POST", url: "/api/v1/benchmark/candidates/freeze", headers: adminHeaders });
  assert.equal(submittedFreeze.status, 200);
  assert.equal(submittedFreeze.body.submittedSplitMembership.appliedHiddenPositionCount, 1);
  assert.deepEqual(submittedFreeze.body.restrictedItemRefs.hiddenPositionIds.sort(), ["pos-ai-prior", "pos-mind"]);
  assert.equal(submittedFreeze.body.rightsStatus.status, "pass");

  assert.equal((await auditStore.readWorkflowEvents()).length, 247);
});

test("server policy rejects hidden metadata in rater submissions", () => {
  const rating = {
    ...validBlindRating("rating-hidden-policy"),
    adminTags: ["hidden-benchmark-candidate"],
  };
  const validation = validateRatingPayload(rating, "blind_initial_submitted");
  assert.equal(validation.ok, false);
  assert.match(validation.detail, /hidden metadata/);
});

test("server policy rejects endpoint/kind mismatches and incomplete full-rubric scores", () => {
  const wrongKind = validateRatingPayload({ ...validBlindRating("rating-wrong-kind"), kind: "revision" }, "blind_initial_submitted");
  assert.equal(wrongKind.ok, false);
  assert.match(wrongKind.detail, /kind=blind_initial/);

  const missingScore = validBlindRating("rating-missing-score");
  missingScore.scores.strength = null;
  const validation = validateRatingPayload(missingScore, "blind_initial_submitted");
  assert.equal(validation.ok, false);
  assert.match(validation.detail, /full-rubric rating requires valid scores/);
});

test("server policy requires rating score-input provenance and raw scores", () => {
  const valid = validateRatingPayload(validBlindRating("rating-score-provenance-valid"), "blind_initial_submitted");
  assert.equal(valid.ok, true);

  const missingPolicy = validBlindRating("rating-score-provenance-missing-policy");
  delete missingPolicy.scoreInputPolicyId;
  const missingPolicyValidation = validateRatingPayload(missingPolicy, "blind_initial_submitted");
  assert.equal(missingPolicyValidation.ok, false);
  assert.match(missingPolicyValidation.detail, /scoreInputPolicyId/);

  const missingRawScores = validBlindRating("rating-score-provenance-missing-raw");
  delete missingRawScores.rawScores;
  const missingRawValidation = validateRatingPayload(missingRawScores, "blind_initial_submitted");
  assert.equal(missingRawValidation.ok, false);
  assert.match(missingRawValidation.detail, /rawScores/);

  const invalidExplicitness = {
    ...validBlindRating("rating-score-provenance-bad-explicitness"),
    scoreEntryExplicitnessStatus: "default_midpoint_used",
  };
  const invalidExplicitnessValidation = validateRatingPayload(invalidExplicitness, "blind_initial_submitted");
  assert.equal(invalidExplicitnessValidation.ok, false);
  assert.match(invalidExplicitnessValidation.detail, /unsupported scoreEntryExplicitnessStatus/);
});

test("server policy requires rating context snapshots to include the rated critique", () => {
  const unknownContext = validateRatingPayload({ ...validBlindRating("rating-context-unknown"), ratingContextSnapshotId: "missing-context" }, "blind_initial_submitted");
  assert.equal(unknownContext.ok, false);
  assert.match(unknownContext.detail, /unknown ratingContextSnapshotId/);

  const wrongCritiqueContext = validateRatingPayload(
    {
      ...validBlindRating("rating-context-wrong-critique"),
      assignmentId: "assign-ai-base-rate",
      critiqueId: "crit-ai-generic",
      critiqueTextVersionId: "ctv-ai-generic-v1",
      ratingContextSnapshotId: "rc-target-only-1",
    },
    "blind_initial_submitted",
  );
  assert.equal(wrongCritiqueContext.ok, false);
  assert.match(wrongCritiqueContext.detail, /include the rated critique/);
});

test("server policy requires valid rating effort telemetry", () => {
  const missingTelemetry = validBlindRating("rating-missing-effort");
  delete missingTelemetry.activeSeconds;
  const missingValidation = validateRatingPayload(missingTelemetry, "blind_initial_submitted");
  assert.equal(missingValidation.ok, false);
  assert.match(missingValidation.detail, /activeSeconds/);

  const invalidTelemetry = { ...validBlindRating("rating-invalid-effort"), idleGapSeconds: -1, interruptionCount: 0.5 };
  const invalidValidation = validateRatingPayload(invalidTelemetry, "blind_initial_submitted");
  assert.equal(invalidValidation.ok, false);
  assert.match(invalidValidation.detail, /idleGapSeconds/);
});

test("server policy validates optional structured correctness verification status", () => {
  const rating = {
    ...validBlindRating("rating-verification-status"),
    correctnessVerificationStatus: "unresolved",
    correctnessVerificationNote: "Needs a linked VerificationRecord before validation use.",
  };
  assert.equal(validateRatingPayload(rating, "blind_initial_submitted").ok, true);

  const invalidStatus = validateRatingPayload({ ...rating, id: "rating-verification-status-bad", correctnessVerificationStatus: "needs_check" }, "blind_initial_submitted");
  assert.equal(invalidStatus.ok, false);
  assert.match(invalidStatus.detail, /unsupported correctnessVerificationStatus/);
});

test("server policy validates structured rater issue flags", () => {
  const rating = {
    ...validBlindRating("rating-issue-flags"),
    flags: {
      needsVerification: true,
      correctnessNotAssessableDueToClarity: false,
      vagueGoodObjectionGesture: true,
      midRangeStrengthUncertainty: true,
      backgroundKnowledgeDependence: false,
    },
  };
  assert.equal(validateRatingPayload(rating, "blind_initial_submitted").ok, true);

  const unknownFlag = validateRatingPayload(
    { ...rating, id: "rating-issue-flags-unknown", flags: { ...rating.flags, sourceVisibleConcern: true } },
    "blind_initial_submitted",
  );
  assert.equal(unknownFlag.ok, false);
  assert.match(unknownFlag.detail, /unsupported rating flags/);

  const nonBooleanFlag = validateRatingPayload(
    { ...rating, id: "rating-issue-flags-nonboolean", flags: { ...rating.flags, needsVerification: "yes" } },
    "blind_initial_submitted",
  );
  assert.equal(nonBooleanFlag.ok, false);
  assert.match(nonBooleanFlag.detail, /rating flags must be boolean/);
});

test("server policy validates rating evidence-span references without raw protected text", () => {
  const validWithSpans = validateRatingPayload(
    {
      ...validBlindRating("rating-evidence-spans"),
      rationaleEvidenceSpanIds: ["rationale-evidence-span-rating-test"],
      attackedClaimSpanRefs: ["position-claim-span-1"],
      critiqueSupportSpanRefs: ["critique-support-span-1"],
      wrongClaimSpanRefs: [],
      deadWeightSpanRefs: [],
      sideIssueSpanRefs: [],
      unclearTextSpanRefs: [],
      lockedBeforePeerExposure: true,
      sourceTagVisibilityState: "hidden_from_initial_rater",
    },
    "blind_initial_submitted",
  );
  assert.equal(validWithSpans.ok, true);

  const rawTextLeak = validateRatingPayload(
    {
      ...validBlindRating("rating-evidence-raw-text"),
      positionText: "raw protected position text must never ride along with a rating payload",
    },
    "blind_initial_submitted",
  );
  assert.equal(rawTextLeak.ok, false);
  assert.match(rawTextLeak.detail, /raw protected item content/);

  const missingSpanIds = validateRatingPayload(
    {
      ...validBlindRating("rating-evidence-missing-span-id"),
      attackedClaimSpanRefs: ["position-claim-span-1"],
    },
    "blind_initial_submitted",
  );
  assert.equal(missingSpanIds.ok, false);
  assert.match(missingSpanIds.detail, /rationaleEvidenceSpanIds/);

  const malformedRefs = validateRatingPayload(
    {
      ...validBlindRating("rating-evidence-malformed-refs"),
      rationaleEvidenceSpanIds: ["rationale-evidence-span-rating-test"],
      critiqueSupportSpanRefs: "critique-support-span-1",
    },
    "blind_initial_submitted",
  );
  assert.equal(malformedRefs.ok, false);
  assert.match(malformedRefs.detail, /critiqueSupportSpanRefs must be an array/);
});

test("server policy accepts low-clarity branch with provisional non-clarity dimensions", () => {
  const rating = validBlindRating("rating-low-clarity");
  rating.scores = {
    centrality: null,
    strength: null,
    correctness: 0.5,
    clarity: 0.32,
    dead_weight: null,
    single_issue: null,
    overall: 0.12,
  };
  rating.rawScores = { ...rating.scores };
  rating.displayedScores = { ...rating.scores };
  rating.scoreEntryExplicitnessStatus = "low_clarity_branch_explicit";
  rating.scoreMissingFieldValidationStatus = "low_clarity_provisional_fields_allowed";
  rating.provisionalDimensions = ["centrality", "strength", "dead_weight", "single_issue"];
  const validation = validateRatingPayload(rating, "blind_initial_submitted");
  assert.equal(validation.ok, true);
});

test("server policy prevents rater impersonation and unassigned assignment writes", () => {
  const demoRater = demoUsers.find((item) => item.id === "demo-rater");
  const demoAdmin = demoUsers.find((item) => item.id === "demo-admin");
  assert.equal(validateRatingActor(validBlindRating("rating-actor-ok"), demoRater).ok, true);
  assert.equal(validateRatingActor({ ...validBlindRating("rating-actor-admin"), raterId: "someone-else" }, demoAdmin).ok, true);

  const impersonation = validateRatingActor({ ...validBlindRating("rating-actor-bad"), raterId: "another-rater" }, demoRater);
  assert.equal(impersonation.ok, false);
  assert.match(impersonation.detail, /must match/);

  const unassigned = validateRatingActor({ ...validBlindRating("rating-actor-unassigned"), assignmentId: "assign-mind-zombie" }, demoRater);
  assert.equal(unassigned.ok, false);
  assert.match(unassigned.detail, /not assigned/);
});

test("server policy accepts only post-lock diagnostic source/style audits", () => {
  const rating = validBlindRating("rating-source-style-lock");
  const audit = validSourceStyleAudit("source-style-policy-test", rating);
  assert.equal(validatePostLockSourceStyleAuditPayload(audit, [rating]).ok, true);

  const actor = demoUsers.find((item) => item.id === "demo-rater");
  assert.equal(validateSourceStyleAuditActor(audit, actor).ok, true);
  const event = createSourceStyleAuditEvent("post_lock_source_style_audit_submitted", actor, audit, { socket: { remoteAddress: "127.0.0.1" } });
  assert.equal(event.type, "post_lock_source_style_audit_submitted");
  assert.equal(event.accessAudit.diagnosticOnly, true);
  assert.equal(event.accessAudit.sourceMetadataAcceptedFromRater, false);
  assert.match(event.payloadHash, /^sha256:/);

  const preLock = validatePostLockSourceStyleAuditPayload({ ...audit, id: "source-style-prelock", collectedAt: "2026-06-11T13:59:00.000Z" }, [rating]);
  assert.equal(preLock.ok, false);
  assert.match(preLock.detail, /after the initial rating lock/);

  const hiddenMetadata = validatePostLockSourceStyleAuditPayload({ ...audit, id: "source-style-hidden", sourceType: "llm_generated" }, [rating]);
  assert.equal(hiddenMetadata.ok, false);
  assert.match(hiddenMetadata.detail, /hidden\/raw metadata/);

  const impersonation = validateSourceStyleAuditActor({ ...audit, raterId: "other-rater" }, actor);
  assert.equal(impersonation.ok, false);
  assert.match(impersonation.detail, /must match/);
});

test("server policy validates and audits certification attempts", () => {
  const attempt = validCertificationAttempt("cert-policy-attempt");
  const validation = validateCertificationAttemptPayload(attempt);
  assert.equal(validation.ok, true);
  const actor = demoUsers.find((item) => item.id === "demo-rater");
  const event = createCertificationAuditEvent("certification_attempt_submitted", actor, attempt, { status: "certified" }, { socket: { remoteAddress: "127.0.0.1" } });
  assert.equal(event.type, "certification_attempt_submitted");
  assert.match(event.payloadHash, /^sha256:/);
  assert.equal(event.accessAudit.trainingExposureOnly, true);
  assert.equal(event.accessAudit.protectedEvaluationUseAllowed, false);
});

test("server policy rejects malformed certification attempts", () => {
  const attempt = validCertificationAttempt("cert-policy-bad");
  attempt.itemResults[0].dimensionErrors.correctness = null;
  const validation = validateCertificationAttemptPayload(attempt);
  assert.equal(validation.ok, false);
  assert.match(validation.detail, /dimensionErrors/);
});

test("server policy validates benchmark exposure logs without accepting hidden content", () => {
  const exposure = {
    action: "artifact_probe_run",
    artifactId: "hidden-benchmark-freeze-october-2026-demo",
    purpose: "authorized_artifact_probe",
    probeFamilies: ["critique_only", "metadata_style_only"],
    notes: "Authorized pre-freeze artifact probe record.",
  };
  assert.equal(validateBenchmarkExposurePayload(exposure).ok, true);
  const actor = demoUsers.find((item) => item.id === "demo-admin");
  const event = createBenchmarkExposureEvent("benchmark_exposure_recorded", actor, exposure, { socket: { remoteAddress: "127.0.0.1" } });
  assert.equal(event.type, "benchmark_exposure_recorded");
  assert.equal(event.actorRole, "admin");
  assert.equal(event.action, "artifact_probe_run");
  assert.equal(event.accessAudit.rawHiddenContentAccepted, false);
  assert.match(event.payloadHash, /^sha256:/);

  const hiddenPayload = validateBenchmarkExposurePayload({
    ...exposure,
    positionText: "If two systems have exactly the same causal and functional organization...",
  });
  assert.equal(hiddenPayload.ok, false);
  assert.match(hiddenPayload.detail, /hidden\/raw content/);

  const metadataPayload = validateBenchmarkExposurePayload({ ...exposure, split: "hidden_benchmark" });
  assert.equal(metadataPayload.ok, false);
  assert.match(metadataPayload.detail, /hidden\/raw content|hidden metadata/);
});

function validBlindRating(id) {
  return {
    id,
    assignmentId: "assign-ai-base-rate",
    positionId: "pos-ai-prior",
    critiqueId: "crit-ai-base-rate",
    raterId: "demo-rater",
    raterTier: "graduate",
    kind: "blind_initial",
    rubricVersion: "lmca-app-f-2026-10",
    scoreInputPolicyId: "score-input-policy-workflow-new",
    positionTextVersionId: "ptv-ai-prior-v1",
    critiqueTextVersionId: "ctv-ai-base-rate-v1",
    ratingContextSnapshotId: "rc-target-only-1",
    scores: {
      centrality: 0.7,
      strength: 0.68,
      correctness: 0.9,
      clarity: 0.88,
      dead_weight: 0.05,
      single_issue: 0.92,
      overall: 0.62,
    },
    rawScores: {
      centrality: 0.7,
      strength: 0.68,
      correctness: 0.9,
      clarity: 0.88,
      dead_weight: 0.05,
      single_issue: 0.92,
      overall: 0.62,
    },
    displayedScores: {
      centrality: 0.7,
      strength: 0.68,
      correctness: 0.9,
      clarity: 0.88,
      dead_weight: 0.05,
      single_issue: 0.92,
      overall: 0.62,
    },
    scoreQuantizationPolicy: "raw_0_1_scores_stored_to_0.001_display_precision",
    scoreEntryExplicitnessStatus: "all_required_scores_explicit",
    scoreMissingFieldValidationStatus: "passed_no_missing_required_fields",
    provisionalDimensions: [],
    rationale: "Server-side audit policy test rating.",
    flags: {},
    activeSeconds: 620,
    idleGapSeconds: 10,
    interruptionCount: 0,
    submittedAt: "2026-06-11T14:00:00.000Z",
    lockedAt: "2026-06-11T14:00:00.000Z",
  };
}

function validCertificationAttempt(id) {
  return {
    id,
    raterId: "demo-rater",
    packId: "cert-tier-zero-2026-10",
    rubricVersion: "lmca-app-f-2026-10",
    submittedAt: "2026-06-11T14:00:00.000Z",
    goldItemsCompleted: 20,
    duplicateItemsCompleted: 5,
    hardAmbiguityItemsCompleted: 5,
    duplicateConsistencyMeanAbsDiff: 0.06,
    hardAmbiguityReviewPass: true,
    itemResults: [
      {
        itemId: "gold-ai-selectivity",
        dimensionErrors: {
          centrality: 0.08,
          strength: 0.1,
          correctness: 0.1,
          clarity: 0.04,
          dead_weight: 0.03,
          single_issue: 0.04,
          overall: 0.08,
        },
      },
    ],
  };
}

function validSourceStyleAudit(id, rating = validBlindRating("rating-source-style-lock")) {
  return {
    id,
    ratingId: rating.id,
    assignmentId: rating.assignmentId,
    positionId: rating.positionId,
    critiqueId: rating.critiqueId,
    raterId: rating.raterId,
    collectedAt: "2026-06-11T14:02:00.000Z",
    sourceGuess: "human_written",
    authorshipGuess: "expert",
    styleGuess: "direct",
    styleGuessConfidence: 0.72,
    collectionPhase: "post_initial_lock",
    shownBeforeInitialLock: false,
    usedForScoring: false,
    notes: "Policy test post-lock source/style guess.",
  };
}

function createTestJwksKey(kid) {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" });
  jwk.kid = kid;
  jwk.alg = "RS256";
  jwk.use = "sig";
  return { privateKey, jwk };
}

function signTestJwt(payload, privateKey, kid) {
  const header = { alg: "RS256", typ: "JWT", kid };
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const signature = signCrypto("RSA-SHA256", Buffer.from(signingInput), privateKey).toString("base64url");
  return `${signingInput}.${signature}`;
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
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

function apiModuleFiles(dir = "api") {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? apiModuleFiles(path) : path.endsWith(".mjs") ? [path] : [];
  });
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

async function invokeVercelHandler(handler, { method, url, body = "" }) {
  const request = requestFixture({ method, url, body });
  const response = responseFixture();
  await handler(request, response);
  return response.result();
}
