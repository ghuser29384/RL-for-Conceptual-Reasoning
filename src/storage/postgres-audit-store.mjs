const streams = {
  rating: "rating",
  certification: "certification",
  benchmark: "benchmark_exposure",
  sourceStyleAudit: "source_style_audit",
  workflow: "workflow",
};

const ratingScoreDimensions = ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"];

const ratingExperienceProjectionTables = Object.freeze({
  raterInstructionCompatibilityPolicy: "rater_instruction_compatibility_policies",
  raterInstructionRenderVersion: "rater_instruction_render_versions",
  rubricCopyTraceabilityMap: "rubric_copy_traceability_maps",
  raterInstructionComprehensionAudit: "rater_instruction_comprehension_audits",
});

const ratingExperienceProjectionTableNames = new Set(Object.values(ratingExperienceProjectionTables));

const interactionUxProjectionTables = Object.freeze({
  sessionPacingPolicy: "session_pacing_policies",
  raterSession: "rater_sessions",
  publicExamplePracticeSession: "public_example_practice_sessions",
  practiceSandboxPolicy: "practice_sandbox_policies",
  raterDashboardPolicy: "rater_dashboard_policies",
  raterLearningPlan: "rater_learning_plans",
  sourceAnchorExample: "source_anchor_examples",
  uxSimplificationPolicy: "ux_simplification_policies",
  uxSimplificationReview: "ux_simplification_reviews",
  itemIssueQuarantinePolicy: "item_issue_quarantine_policies",
  itemIssueReport: "item_issue_reports",
  itemIssueAction: "item_issue_actions",
  screenFeatureParityCheck: "screen_feature_parity_checks",
  simplifiedCopyPreview: "simplified_copy_previews",
});

const interactionUxProjectionTableNames = new Set(Object.values(interactionUxProjectionTables));

const expertReadableInteractionUxResourceKeys = new Set(["itemIssueReport", "itemIssueAction"]);

const metricGovernanceProjectionTables = Object.freeze({
  metricConfig: "metric_configs",
  derivedUtilityFormula: "derived_utility_formulas",
  pairwiseComparisonSnapshot: "pairwise_comparison_snapshots",
  governanceApprovalRecord: "governance_approval_records",
  protectedArtifactRevalidation: "protected_artifact_revalidations",
});

const metricGovernanceProjectionTableNames = new Set(Object.values(metricGovernanceProjectionTables));

const operatorEvidenceProjectionTables = Object.freeze({
  corpusManifest: "corpus_manifests",
  trainingExport: "training_exports",
  exportManifest: "export_manifests",
  modelImprovementPolicy: "model_improvement_policies",
  modelImprovementRun: "model_improvement_runs",
  evaluationRun: "evaluation_runs",
  modelEvaluationPrediction: "model_evaluation_predictions",
  calibrationRun: "calibration_runs",
  leaderboard: "leaderboards",
  modelFailureAudit: "model_failure_audits",
  artifactProbeRun: "artifact_probe_runs",
  sycophancyProbeRun: "sycophancy_probe_runs",
  obfuscationStressRun: "obfuscation_stress_runs",
  sanityBaselineRun: "sanity_baseline_runs",
  modelRunReproducibilityPolicy: "model_run_reproducibility_policies",
  modelInferenceConfig: "model_inference_configs",
  modelRunEnvironment: "model_run_environments",
  modelProviderDataHandlingPolicy: "model_provider_data_handling_policies",
  promptTemplate: "prompt_templates",
  parserConfig: "parser_configs",
});

const operatorEvidenceProjectionTableNames = new Set(Object.values(operatorEvidenceProjectionTables));

const discussionAdjudicationProjectionTables = Object.freeze({
  discussion: "discussions",
  discussionThread: "discussion_threads",
  discussionComment: "discussion_comments",
  discussionRevisionProposal: "discussion_revision_proposals",
  postLockDiscussionSession: "post_lock_discussion_sessions",
  adjudication: "adjudications",
  adjudicationReviewSession: "adjudication_review_sessions",
  adjudicationMemo: "adjudication_memos",
  adjudicationFinalization: "adjudication_finalizations",
});

const discussionAdjudicationProjectionTableNames = new Set(Object.values(discussionAdjudicationProjectionTables));

const verificationAdjudicationProjectionTables = Object.freeze({
  verificationRecord: "verification_records",
  verificationEvidenceArtifact: "verification_evidence_artifacts",
  adjudicatorPreReadRequirednessPolicy: "adjudicator_pre_read_requiredness_policies",
  adjudicatorPreRead: "adjudicator_pre_reads",
  adjudicationCockpitSignoffPolicy: "adjudication_cockpit_signoff_policies",
  interpretationTargetMapRequirednessPolicy: "interpretation_target_map_requiredness_policies",
  interpretationTargetMap: "interpretation_target_maps",
  verificationClaimGranularityPolicy: "verification_claim_granularity_policies",
  verificationWorkspaceSession: "verification_workspace_sessions",
  calibrationFeedbackEvent: "calibration_feedback_events",
});

const verificationAdjudicationProjectionTableNames = new Set(Object.values(verificationAdjudicationProjectionTables));

const adminOnlyVerificationAdjudicationResourceKeys = new Set([
  "adjudicatorPreReadRequirednessPolicy",
  "adjudicationCockpitSignoffPolicy",
  "interpretationTargetMapRequirednessPolicy",
  "verificationClaimGranularityPolicy",
]);

const releaseReadinessProjectionTables = Object.freeze({
  certificationThresholdPolicy: "certification_threshold_policies",
  certificationRecord: "certification_records",
  goldItem: "gold_items",
  benchmarkSplitMember: "benchmark_split_members",
  benchmarkFreezeReport: "benchmark_freeze_reports",
  rightsClearancePolicy: "rights_clearance_policies",
  rightsRecord: "rights_records",
  benchmarkRefreshPolicy: "benchmark_refresh_policies",
  validationTrancheEvidence: "validation_tranche_evidence",
  humanCeilingRun: "human_ceiling_runs",
  comparabilityTierPolicy: "comparability_tier_policies",
  comparabilityClaim: "comparability_claims",
  releaseErratumDisclosurePolicy: "release_erratum_disclosure_policies",
  releaseErratum: "release_errata",
  benchmarkSubmissionPolicy: "benchmark_submission_policies",
  benchmarkSubmission: "benchmark_submissions",
});

const releaseReadinessProjectionTableNames = new Set(Object.values(releaseReadinessProjectionTables));

const safeguardAuxiliaryProjectionTables = Object.freeze({
  sourceRecognitionEvent: "source_recognition_events",
  externalAssistanceContaminationPolicy: "external_assistance_contamination_policies",
  externalAssistanceDeclaration: "external_assistance_declarations",
  spotCheckSamplingPolicy: "spot_check_sampling_policies",
  spotCheckQaItem: "spot_check_qa_items",
  adjudicationTriageQueueItem: "adjudication_triage_queue_items",
  diagnosticDeferralVisibilityPolicy: "diagnostic_deferral_visibility_policies",
  diagnosticDeferralRecord: "diagnostic_deferral_records",
});

const safeguardAuxiliaryProjectionTableNames = new Set(Object.values(safeguardAuxiliaryProjectionTables));

const adminOnlySafeguardAuxiliaryResourceKeys = new Set([
  "externalAssistanceContaminationPolicy",
  "spotCheckSamplingPolicy",
  "diagnosticDeferralVisibilityPolicy",
]);

const releaseConfigProjectionTables = Object.freeze({
  releaseVersion: "release_versions",
  releaseFreeze: "release_freezes",
  releaseGateProfile: "release_gate_profiles",
  governedBundleCanonicalizationProfile: "governed_bundle_canonicalization_profiles",
  governedBundleRecord: "governed_bundle_records",
  governedBundleVerification: "governed_bundle_verifications",
  releaseConfigManifest: "release_config_manifests",
  releaseConfigManifestVerification: "release_config_manifest_verifications",
});

const releaseConfigProjectionTableNames = new Set(Object.values(releaseConfigProjectionTables));

const metaphilosophyProjectionTables = Object.freeze({
  metaphilosophyArchitectureLayer: "metaphilosophy_architecture_layers",
  metaphilosophyTaskTrack: "metaphilosophy_task_tracks",
  metaphilosophyResearchBacklogItem: "metaphilosophy_research_backlog_items",
});

const metaphilosophyProjectionTableNames = new Set(Object.values(metaphilosophyProjectionTables));

export async function createPostgresAuditStore(options = {}) {
  const connectionString = options.connectionString ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL or DATABASE_URL is required when LMCA_AUDIT_STORE=postgres");
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(connectionString, {
    max: Number(process.env.POSTGRES_CONNECTION_LIMIT ?? 5),
    ssl: process.env.POSTGRES_SSL === "disable" ? false : "require",
  });
  const rlsRole = options.rlsRole ?? process.env.POSTGRES_RLS_ROLE ?? "service";
  const rlsExternalAuthId = options.rlsExternalAuthId ?? process.env.POSTGRES_RLS_EXTERNAL_AUTH_ID ?? "server";

  async function readEvents(stream) {
    const rows = await withRlsContext(async (db) => db`
        select event_json
        from audit_events
        where stream = ${stream}
        order by sequence_id asc
      `);
    return rows.map((row) => row.event_json);
  }

  async function appendEvent(stream, event) {
    await withRlsContext(async (db) => {
      await db`
        insert into audit_events (
          stream,
          event_id,
          event_type,
          actor_hash,
          payload_hash,
          event_json
        )
        values (
          ${stream},
          ${event.id ?? event.eventId ?? null},
          ${event.type ?? null},
          ${event.actorHash ?? null},
          ${event.payloadHash ?? null},
          ${db.json(event)}
        )
      `;
      if (stream === streams.rating) {
        await appendRatingProjection(db, event);
      }
      if (stream === streams.workflow) {
        await appendWorkflowResourceProjection(db, event);
      }
    });
  }

  async function withRlsContext(callback) {
    return sql.begin(async (db) => {
      await db`select set_config('app.current_role', ${rlsRole}, true)`;
      await db`select set_config('app.current_external_auth_id', ${rlsExternalAuthId}, true)`;
      return callback(db);
    });
  }

  return {
    storageMode: "postgres_append_only",
    async readRatingEvents() {
      return readEvents(streams.rating);
    },
    async appendRatingEvent(event) {
      await appendEvent(streams.rating, event);
    },
    async readCertificationEvents() {
      return readEvents(streams.certification);
    },
    async appendCertificationEvent(event) {
      await appendEvent(streams.certification, event);
    },
    async readBenchmarkExposureEvents() {
      return readEvents(streams.benchmark);
    },
    async appendBenchmarkExposureEvent(event) {
      await appendEvent(streams.benchmark, event);
    },
    async readSourceStyleAuditEvents() {
      return readEvents(streams.sourceStyleAudit);
    },
    async appendSourceStyleAuditEvent(event) {
      await appendEvent(streams.sourceStyleAudit, event);
    },
    async readWorkflowEvents() {
      return readEvents(streams.workflow);
    },
    async appendWorkflowEvent(event) {
      await appendEvent(streams.workflow, event);
    },
  };
}

export function ratingProjectionForAuditEvent(event) {
  const rating = event?.payload?.rating;
  if (!rating || typeof rating !== "object" || Array.isArray(rating)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  const provisionalDimensions = rating.provisionalDimensions ?? [];
  return {
    table: "ratings",
    values: {
      id: rating.id,
      assignment_id: rating.assignmentId,
      position_id: rating.positionId,
      critique_id: rating.critiqueId,
      rater_id: rating.raterId,
      rater_tier: rating.raterTier ?? null,
      kind: rating.kind,
      parent_rating_id: rating.parentRatingId ?? null,
      rubric_version: rating.rubricVersion,
      score_input_policy_id: rating.scoreInputPolicyId,
      workflow_profile_id: rating.workflowProfileId ?? null,
      score_explanation_policy_id: rating.scoreExplanationPolicyId,
      position_text_version_id: rating.positionTextVersionId,
      critique_text_version_id: rating.critiqueTextVersionId,
      rating_context_snapshot_id: rating.ratingContextSnapshotId,
      scores_json: rating.scores ?? {},
      raw_scores_json: rating.rawScores ?? {},
      displayed_scores_json: rating.displayedScores ?? {},
      score_quantization_policy: rating.scoreQuantizationPolicy,
      score_confidence_judgment: rating.scoreConfidenceJudgment,
      general_rating_note: rating.generalRatingNote ?? null,
      score_explanation: rating.scoreExplanation ?? null,
      score_explanation_required: rating.scoreExplanationRequired,
      score_explanation_required_reasons: rating.scoreExplanationRequiredReasons ?? [],
      score_explanation_triggers: rating.scoreExplanationTriggers ?? [],
      score_explanation_prompt_visibility: rating.scoreExplanationPromptVisibility ?? null,
      score_explanation_prompt_shown: rating.scoreExplanationPromptShown,
      score_explanation_completion_status: rating.scoreExplanationCompletionStatus,
      overall_vs_centrality_strength_diagnostic: rating.overallVsCentralityStrengthDiagnostic ?? {},
      score_entry_explicitness_status: rating.scoreEntryExplicitnessStatus,
      score_missing_field_validation_status: rating.scoreMissingFieldValidationStatus,
      provisional_dimensions: provisionalDimensions,
      rationale: rating.rationale ?? null,
      rationale_evidence_span_ids: rating.rationaleEvidenceSpanIds ?? rating.rationale_evidence_span_ids ?? [],
      locked_before_peer_exposure: rating.lockedBeforePeerExposure ?? rating.locked_before_peer_exposure ?? null,
      source_tag_visibility_state: rating.sourceTagVisibilityState ?? rating.source_tag_visibility_state ?? null,
      active_seconds: rating.activeSeconds,
      idle_gap_seconds: rating.idleGapSeconds,
      interruption_count: rating.interruptionCount,
      submitted_at: rating.submittedAt,
      locked_at: rating.lockedAt,
      policy_action_kind: rating.policyActionKind ?? null,
      policy_decision_id: rating.policyDecisionId ?? null,
      policy_decision_consumption_id: rating.policyDecisionConsumptionId ?? null,
      policy_decision_idempotency_key: rating.policyDecisionIdempotencyKey ?? null,
      event_id: eventId,
      payload_hash: event.payloadHash ?? null,
      actor_hash: event.actorHash ?? null,
      received_at: event.receivedAt ?? null,
      score_rows: ratingScoreDimensions.map((dimension) => ({
        rating_id: rating.id,
        dimension,
        score_value: rating.scores?.[dimension] ?? null,
        raw_score_value: rating.rawScores?.[dimension] ?? null,
        displayed_score_value: rating.displayedScores?.[dimension] ?? null,
        low_clarity_provisional: provisionalDimensions.includes(dimension),
        event_id: eventId,
        record_json: recordJson,
      })),
      record_json: recordJson,
    },
  };
}

export function ratingExperienceProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!ratingExperienceProjectionTables[resourceKey] || !resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  if (resourceKey === "raterInstructionCompatibilityPolicy") {
    return {
      table: ratingExperienceProjectionTables[resourceKey],
      values: {
        id: resource.id,
        release_id: resource.releaseId ?? resource.release_id ?? null,
        resource_key: resourceKey,
        policy_version: resource.policyVersion ?? resource.policy_version,
        covered_workflow_split_classes: Array.isArray(resource.coveredWorkflowSplitClasses) ? resource.coveredWorkflowSplitClasses : [],
        compatible_render_classes: Array.isArray(resource.compatibleRenderClasses) ? resource.compatibleRenderClasses : [],
        required_shared_policy_fields: Array.isArray(resource.requiredSharedPolicyFields) ? resource.requiredSharedPolicyFields : [],
        thresholds_json: resource.thresholds ?? {},
        compatibility_rules_json: resource.compatibilityRules ?? {},
        protected_split_merge_policy: resource.protectedSplitMergePolicy ?? null,
        sensitivity_snapshot_policy: resource.sensitivitySnapshotPolicy ?? null,
        lmca_source_boundary: resource.lmcaSourceBoundary ?? null,
        artifact_status: resource.artifactStatus ?? resource.status ?? `${resourceKey}_submitted`,
        artifact_json: resource,
        event_id: eventId,
        record_json: recordJson,
        frozen_at: resource.frozenAt ?? resource.frozen_at ?? null,
        created_at: resource.createdAt ?? resource.created_at ?? resource.frozenAt ?? resource.frozen_at ?? event.receivedAt ?? null,
      },
    };
  }
  if (resourceKey === "raterInstructionRenderVersion") {
    return {
      table: ratingExperienceProjectionTables[resourceKey],
      values: {
        id: resource.id,
        release_id: resource.releaseId ?? resource.release_id ?? null,
        resource_key: resourceKey,
        rubric_version: resource.rubricVersion ?? resource.rubric_version,
        workflow_profile_id: resource.workflowProfileId ?? resource.workflow_profile_id,
        rendered_rubric_anchor_checksum: resource.renderedRubricAnchorChecksum ?? resource.rendered_rubric_anchor_checksum,
        score_input_policy_id: resource.scoreInputPolicyId ?? resource.score_input_policy_id,
        ux_simplification_policy_id: resource.uxSimplificationPolicyId ?? resource.ux_simplification_policy_id,
        score_control_mode: resource.scoreControlMode ?? resource.score_control_mode,
        score_default_policy: resource.scoreDefaultPolicy ?? resource.score_default_policy ?? null,
        workflow_banner_text_version: resource.workflowBannerTextVersion ?? resource.workflow_banner_text_version,
        issue_panel_copy_version: resource.issuePanelCopyVersion ?? resource.issue_panel_copy_version,
        pre_submit_assist_policy_id: resource.preSubmitAssistPolicyId ?? resource.pre_submit_assist_policy_id,
        rubric_lint_config_id: resource.rubricLintConfigId ?? resource.rubric_lint_config_id,
        accessibility_visual_variant: resource.accessibilityVisualVariant ?? resource.accessibility_visual_variant,
        ui_experiment_policy_id: resource.uiExperimentPolicyId ?? resource.ui_experiment_policy_id,
        rater_instruction_compatibility_policy_id:
          resource.raterInstructionCompatibilityPolicyId ?? resource.rater_instruction_compatibility_policy_id,
        render_compatibility_class: resource.renderCompatibilityClass ?? resource.render_compatibility_class,
        compatibility_evidence_status: resource.compatibilityEvidenceStatus ?? resource.compatibility_evidence_status,
        protected_split_eligibility_policy: resource.protectedSplitEligibilityPolicy ?? resource.protected_split_eligibility_policy,
        sensitivity_snapshot_policy: resource.sensitivitySnapshotPolicy ?? resource.sensitivity_snapshot_policy,
        artifact_status: resource.artifactStatus ?? resource.status ?? resource.compatibilityEvidenceStatus ?? `${resourceKey}_submitted`,
        artifact_json: resource,
        event_id: eventId,
        record_json: recordJson,
        frozen_at: resource.frozenAt ?? resource.frozen_at ?? null,
        created_at: resource.createdAt ?? resource.created_at ?? resource.frozenAt ?? resource.frozen_at ?? event.receivedAt ?? null,
      },
    };
  }
  if (resourceKey === "rubricCopyTraceabilityMap") {
    return {
      table: ratingExperienceProjectionTables[resourceKey],
      values: {
        id: resource.id,
        release_id: resource.releaseId ?? resource.release_id ?? null,
        resource_key: resourceKey,
        map_version: resource.mapVersion ?? resource.map_version,
        rubric_version: resource.rubricVersion ?? resource.rubric_version,
        copy_bundle_id: resource.copyBundleId ?? resource.copy_bundle_id,
        covered_screen_ids: Array.isArray(resource.coveredScreenIds) ? resource.coveredScreenIds : [],
        simplified_copy_entry_ids: Array.isArray(resource.simplifiedCopyEntryIds) ? resource.simplifiedCopyEntryIds : [],
        mapped_rubric_clause_ids: Array.isArray(resource.mappedRubricClauseIds) ? resource.mappedRubricClauseIds : [],
        semantic_drift_test_ids: Array.isArray(resource.semanticDriftTestIds) ? resource.semanticDriftTestIds : [],
        clause_map_json: resource.clauseMap ?? {},
        semantic_drift_test_status: resource.semanticDriftTestStatus ?? null,
        appendix_f_anchor_access: resource.appendixFAnchorAccess ?? null,
        hidden_field_leakage_check: resource.hiddenFieldLeakageCheck ?? null,
        release_critical_use_status: resource.releaseCriticalUseStatus ?? null,
        release_config_manifest_id: resource.releaseConfigManifestId ?? resource.release_config_manifest_id ?? null,
        reviewer_id: resource.reviewerId ?? null,
        reviewed_at: resource.reviewedAt ?? resource.reviewed_at ?? null,
        frozen_at: resource.frozenAt ?? resource.frozen_at ?? null,
        artifact_status:
          resource.artifactStatus ??
          resource.status ??
          resource.releaseCriticalUseStatus ??
          resource.semanticDriftTestStatus ??
          `${resourceKey}_submitted`,
        artifact_json: resource,
        event_id: eventId,
        record_json: recordJson,
        created_at: resource.createdAt ?? resource.created_at ?? resource.frozenAt ?? resource.frozen_at ?? event.receivedAt ?? null,
      },
    };
  }
  return {
    table: ratingExperienceProjectionTables[resourceKey],
    values: {
      id: resource.id,
      release_id: resource.releaseId ?? resource.release_id ?? null,
      resource_key: resourceKey,
      audit_version: resource.auditVersion ?? resource.version,
      rater_instruction_render_version_id:
        resource.raterInstructionRenderVersionId ?? resource.rater_instruction_render_version_id,
      rater_instruction_compatibility_policy_id:
        resource.raterInstructionCompatibilityPolicyId ?? resource.rater_instruction_compatibility_policy_id,
      rubric_copy_traceability_map_id: resource.rubricCopyTraceabilityMapId ?? resource.rubric_copy_traceability_map_id,
      covered_screen_ids: Array.isArray(resource.coveredScreenIds) ? resource.coveredScreenIds : [],
      comprehension_methods: Array.isArray(resource.comprehensionMethods) ? resource.comprehensionMethods : [],
      comprehension_check_ids: Array.isArray(resource.comprehensionCheckIds) ? resource.comprehensionCheckIds : [],
      glossary_term_ids: Array.isArray(resource.glossaryTermIds) ? resource.glossaryTermIds : [],
      disclosure_depths: Array.isArray(resource.disclosureDepths) ? resource.disclosureDepths : [],
      clause_traceability_review_status: resource.clauseTraceabilityReviewStatus ?? null,
      screen_copy_mapping_review_status: resource.screenCopyMappingReviewStatus ?? null,
      comprehension_test_status: resource.comprehensionTestStatus ?? null,
      semantic_drift_blocker: resource.semanticDriftBlocker === true,
      no_feature_loss_blocker: resource.noFeatureLossBlocker === true,
      protected_leakage_review_passed: resource.protectedLeakageReviewPassed === true,
      excluded_from_score_computation: resource.excludedFromScoreComputation === true,
      excluded_from_independent_blind_denominator: resource.excludedFromIndependentBlindDenominator === true,
      source_boundary: resource.sourceBoundary ?? null,
      reviewer_id: resource.reviewerId ?? null,
      frozen_at: resource.frozenAt ?? resource.frozen_at ?? null,
      artifact_status:
        resource.artifactStatus ??
        resource.status ??
        resource.comprehensionTestStatus ??
        `${resourceKey}_submitted`,
      artifact_json: resource,
      event_id: eventId,
      record_json: recordJson,
      created_at: resource.createdAt ?? resource.created_at ?? resource.frozenAt ?? resource.frozen_at ?? event.receivedAt ?? null,
    },
  };
}

export function interactionUxProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!interactionUxProjectionTables[resourceKey] || !resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  return {
    table: interactionUxProjectionTables[resourceKey],
    values: interactionUxProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event),
  };
}

function interactionUxProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event) {
  const expertReadable = expertReadableInteractionUxResourceKeys.has(resourceKey);
  return {
    id: resource.id,
    release_id: resource.releaseId ?? resource.release_id ?? null,
    resource_key: resourceKey,
    assignment_id: resource.assignmentId ?? resource.assignment_id ?? null,
    rating_id: resource.ratingId ?? resource.rating_id ?? resource.attemptRatingId ?? resource.attempt_rating_id ?? null,
    rater_id: resource.raterId ?? resource.rater_id ?? resource.reporterId ?? resource.reporter_id ?? null,
    item_id: resource.itemId ?? resource.item_id ?? firstArrayValue(resource.itemKeys ?? resource.item_keys) ?? null,
    position_id: resource.positionId ?? resource.position_id ?? null,
    critique_id: resource.critiqueId ?? resource.critique_id ?? null,
    policy_id:
      resource.policyId ??
      resource.policy_id ??
      resource.sessionPacingPolicyId ??
      resource.session_pacing_policy_id ??
      resource.practiceSandboxPolicyId ??
      resource.practice_sandbox_policy_id ??
      resource.raterDashboardPolicyId ??
      resource.rater_dashboard_policy_id ??
      resource.uxSimplificationPolicyId ??
      resource.ux_simplification_policy_id ??
      resource.itemIssueQuarantinePolicyId ??
      resource.item_issue_quarantine_policy_id ??
      (resourceKey.endsWith("Policy") ? resource.id : null),
    screen_id: resource.screenId ?? resource.screen_id ?? null,
    issue_id: resource.itemIssueId ?? resource.item_issue_id ?? resource.issueId ?? resource.issue_id ?? null,
    practice_session_id:
      resource.practiceSessionId ?? resource.practice_session_id ?? (resourceKey === "publicExamplePracticeSession" ? resource.id : null),
    action_kind: resource.actionKind ?? resource.action_kind ?? resource.action ?? null,
    workflow_status: interactionUxWorkflowStatus(resourceKey, resource),
    visibility_class: expertReadable ? "expert_admin_audit_only" : "admin_audit_only",
    protected_label_visibility_state:
      resource.protectedLabelBoundary ??
      resource.protected_label_boundary ??
      resource.protectedLabelExposureCheck ??
      resource.protected_label_exposure_check ??
      resource.protectedSplitConflictCheck ??
      resource.protected_split_conflict_check ??
      null,
    hidden_metadata_leakage_check:
      resource.hiddenMetadataLeakagePolicy ??
      resource.hidden_metadata_leakage_policy ??
      resource.hiddenFieldLeakageCheck ??
      resource.hidden_field_leakage_check ??
      resource.blindingProtectedLabelLeakageResult ??
      resource.blinding_protected_label_leakage_result ??
      null,
    artifact_status: interactionUxArtifactStatus(resourceKey, resource),
    input_hash:
      resource.inputHash ??
      resource.input_hash ??
      resource.artifactHash ??
      resource.artifact_hash ??
      resource.policyHash ??
      resource.policy_hash ??
      event.payloadHash ??
      `sha256:${resourceKey}:${resource.id}`,
    artifact_json: resource,
    event_id: eventId,
    record_json: recordJson,
    created_at: resource.createdAt ?? resource.created_at ?? resource.checkedAt ?? resource.reviewedAt ?? resource.frozenAt ?? resource.timestamp ?? event.receivedAt ?? null,
  };
}

function interactionUxWorkflowStatus(resourceKey, resource) {
  return (
    resource.status ??
    resource.reviewStatus ??
    resource.qaRoutingStatus ??
    resource.dashboardVisibilityStatus ??
    resource.remediationRoutingStatus ??
    resource.practiceCompletionStatus ??
    resource.completionStatus ??
    resource.triageState ??
    resource.resolutionStatus ??
    resource.quarantineStalePropagationState ??
    resource.promotionDecision ??
    resource.protectedSplitVariantDisposition ??
    resource.protectedSplitConflictCheck ??
    resource.expectedEffortCompleted ??
    (resource.noFeatureLoss === true ? "no_feature_loss_passed" : null) ??
    `${resourceKey}_submitted`
  );
}

function interactionUxArtifactStatus(resourceKey, resource) {
  return (
    resource.artifactStatus ??
    resource.releaseUseStatus ??
    resource.reviewStatus ??
    resource.triageState ??
    resource.resolutionStatus ??
    resource.quarantineStalePropagationState ??
    resource.hiddenFieldLeakageCheck ??
    resource.protectedSplitConflictCheck ??
    resource.qaRoutingStatus ??
    resource.dashboardVisibilityStatus ??
    resource.remediationRoutingStatus ??
    interactionUxWorkflowStatus(resourceKey, resource)
  );
}

export function metricGovernanceProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!metricGovernanceProjectionTables[resourceKey] || !resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  return {
    table: metricGovernanceProjectionTables[resourceKey],
    values: metricGovernanceProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event),
  };
}

function metricGovernanceProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event) {
  const affectedArtifactIds = Array.isArray(resource.affectedArtifactIds)
    ? resource.affectedArtifactIds
    : Array.isArray(resource.affected_artifact_ids)
      ? resource.affected_artifact_ids
      : [];
  return {
    id: resource.id,
    release_id: resource.releaseId ?? resource.release_id ?? null,
    resource_key: resourceKey,
    target_label_snapshot_id:
      resource.targetLabelSnapshotId ??
      resource.target_label_snapshot_id ??
      resource.labelSnapshotId ??
      resource.label_snapshot_id ??
      null,
    metric_config_id: resource.metricConfigId ?? resource.metric_config_id ?? (resourceKey === "metricConfig" ? resource.id : null),
    derived_utility_formula_id:
      resource.derivedUtilityFormulaId ??
      resource.derived_utility_formula_id ??
      (resourceKey === "derivedUtilityFormula" ? resource.id : null),
    pairwise_comparison_snapshot_id:
      resource.pairwiseComparisonSnapshotId ??
      resource.pairwise_comparison_snapshot_id ??
      (resourceKey === "pairwiseComparisonSnapshot" ? resource.id : null),
    release_config_manifest_id: resource.releaseConfigManifestId ?? resource.release_config_manifest_id ?? null,
    protected_artifact_id:
      resource.protectedArtifactId ??
      resource.protected_artifact_id ??
      firstArrayValue(affectedArtifactIds) ??
      null,
    metric_family: resource.metricFamily ?? resource.metric_family ?? null,
    metric_version: resource.metricVersion ?? resource.metric_version ?? null,
    formula_name: resource.formulaName ?? resource.formula_name ?? null,
    formula_version: resource.formulaVersion ?? resource.formula_version ?? (resourceKey === "derivedUtilityFormula" ? resource.version : null),
    action_kind: resource.actionKind ?? resource.action_kind ?? null,
    policy_action_kind: resource.policyActionKind ?? resource.policy_action_kind ?? resource.actionKind ?? resource.action_kind ?? null,
    policy_decision_id: resource.policyDecisionId ?? resource.policy_decision_id ?? null,
    policy_decision_consumption_id: resource.policyDecisionConsumptionId ?? resource.policy_decision_consumption_id ?? null,
    affected_artifact_ids: affectedArtifactIds,
    approval_status:
      resource.independenceSeparationOfDutiesStatus ??
      resource.independence_separation_of_duties_status ??
      resource.approvalStatus ??
      resource.approval_status ??
      resource.revalidationStatus ??
      resource.revalidation_status ??
      null,
    workflow_status: metricGovernanceWorkflowStatus(resourceKey, resource),
    visibility_class: "admin_audit_only",
    input_hash:
      event.payloadHash ??
      resource.inputHash ??
      resource.input_hash ??
      resource.artifactHash ??
      resource.artifact_hash ??
      resource.scoringCodeArtifactChecksum ??
      resource.scoring_code_artifact_checksum ??
      resource.formulaChecksum ??
      resource.formula_checksum ??
      resource.snapshotHash ??
      resource.snapshot_hash ??
      resource.eventHash ??
      resource.event_hash ??
      `sha256:${resourceKey}:${resource.id}`,
    artifact_json: resource,
    event_id: eventId,
    record_json: recordJson,
    created_at:
      resource.createdAt ??
      resource.created_at ??
      resource.timestamp ??
      resource.approvalTimestamp ??
      resource.approval_timestamp ??
      resource.checkedAt ??
      resource.checked_at ??
      resource.frozenAt ??
      resource.frozen_at ??
      event.receivedAt ??
      null,
  };
}

function metricGovernanceWorkflowStatus(resourceKey, resource) {
  return (
    resource.artifactStatus ??
    resource.releaseUseStatus ??
    resource.workflowStatus ??
    resource.status ??
    resource.approvalStatus ??
    resource.revalidationStatus ??
    resource.independenceSeparationOfDutiesStatus ??
    resource.pairwiseComparisonSnapshotStatus ??
    resource.commonMetricConfigStatus ??
    (resourceKey === "governanceApprovalRecord" ? "approved_governance_action" : null) ??
    `${resourceKey}_submitted`
  );
}

export function sourceIntakeProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  if (resourceKey === "sourceCard") {
    return {
      table: "source_cards",
      values: {
        id: resource.id,
        title: resource.title,
        source_author: resource.sourceAuthor,
        source_work: resource.sourceWork,
        source_publisher_or_site: resource.sourcePublisherOrSite ?? "unknown",
        publication_year: resource.publicationYear ?? "unknown",
        uploaded_file_id: resource.uploadedFileId ?? null,
        source_type: resource.sourceType,
        source_locator: resource.sourceLocator,
        source_provenance_summary: resource.sourceProvenanceSummary,
        rights_status: resource.rightsStatus,
        source_language: resource.sourceLanguage,
        translation_status: resource.translationStatus,
        translation_route: resource.translationRoute,
        task_format: resource.taskFormat,
        source_dataset_name: resource.sourceDatasetName,
        source_subsource: resource.sourceSubsource,
        source_domain_suitability: resource.sourceDomainSuitability,
        source_domain_concentration: resource.sourceDomainConcentration,
        lsat_derived: resource.lsatDerived,
        admin_notes: resource.adminNotes,
        source_access_policy: resource.sourceAccessPolicy,
        release_policy: resource.releasePolicy,
        source_visibility: resource.sourceVisibility,
        created_by: resource.createdBy,
        created_at: resource.createdAt,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "sourceSpan") {
    return {
      table: "source_spans",
      values: {
        id: resource.id,
        source_card_id: resource.sourceCardId,
        span_locator: resource.spanLocator,
        bounded_locator: resource.boundedLocator,
        span_kind: resource.spanKind,
        text_hash: resource.textHash,
        admin_excerpt: resource.adminExcerpt ?? null,
        excerpt_storage_policy: resource.excerptStoragePolicy,
        segmentation_status: resource.segmentationStatus,
        extraction_status: resource.extractionStatus ?? "selected_for_extraction",
        admin_selection_notes: resource.adminSelectionNotes,
        source_visibility: resource.sourceVisibility,
        created_by: resource.createdBy,
        created_at: resource.createdAt,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "extractionBatch") {
    return {
      table: "extraction_batches",
      values: {
        id: resource.id,
        source_card_id: resource.sourceCardId,
        import_format: resource.importFormat,
        imported_by: resource.importedBy,
        imported_at: resource.importedAt,
        extraction_count: resource.extractionCount,
        parser_version: resource.parserVersion,
        import_route: resource.importRoute,
        extraction_execution_mode: resource.extractionExecutionMode,
        downstream_integration_status: resource.downstreamIntegrationStatus,
        creates_prepared_draft: resource.createsPreparedDraft,
        creates_candidate_item: resource.createsCandidateItem,
        creates_candidate_batch: resource.createsCandidateBatch,
        live_queue_integration: resource.liveQueueIntegration,
        ai_extraction_executed: resource.aiExtractionExecuted,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "argumentExtraction") {
    const sourceSpanIds = resource.sourceSpanIds ?? [];
    return {
      table: "argument_extractions",
      values: {
        id: resource.id,
        extraction_batch_id: resource.extractionBatchId,
        source_card_id: resource.sourceCardId,
        source_span_ids: sourceSpanIds,
        source_span_links: sourceSpanIds.map((sourceSpanId, positionIndex) => ({
          argument_extraction_id: resource.id,
          source_span_id: sourceSpanId,
          source_card_id: resource.sourceCardId,
          position_index: positionIndex,
          event_id: eventId,
          record_json: recordJson,
        })),
        argument_role: resource.argumentRole,
        intended_conclusion: resource.intendedConclusion,
        key_premises: resource.keyPremises ?? [],
        argument_summary: resource.argumentSummary,
        implicit_assumptions: resource.implicitAssumptions ?? [],
        critique_target: resource.critiqueTarget ?? null,
        context_needed: resource.contextNeeded,
        conceptual_scope_notes: resource.conceptualScopeNotes,
        suitability_notes: resource.suitabilityNotes,
        possible_prepared_position_text: resource.possiblePreparedPositionText ?? resource.extractedPositionText ?? null,
        possible_prepared_critique_text: resource.possiblePreparedCritiqueText ?? null,
        model_prompt_provenance: resource.modelPromptProvenance ?? {},
        extracted_position_text: resource.extractedPositionText ?? resource.possiblePreparedPositionText ?? "",
        extraction_rationale: resource.extractionRationale,
        extraction_method: resource.extractionMethod,
        review_status: resource.reviewStatus,
        review_notes: resource.reviewNotes ?? null,
        reviewed_by: resource.reviewedBy ?? null,
        reviewed_at: resource.reviewedAt ?? null,
        downstream_integration_status: resource.downstreamIntegrationStatus,
        source_visibility: resource.sourceVisibility,
        imported_at: resource.importedAt,
        creates_prepared_draft: resource.createsPreparedDraft,
        creates_candidate_item: resource.createsCandidateItem,
        creates_candidate_batch: resource.createsCandidateBatch,
        live_queue_integration: resource.liveQueueIntegration,
        ai_extraction_executed: resource.aiExtractionExecuted,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  return null;
}

export function sourcePreparationProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  if (resourceKey === "preparedDraft") {
    return {
      table: "prepared_drafts",
      values: {
        id: resource.id,
        source_contribution_part_id: resource.sourceContributionPartId ?? null,
        source_submission_id: resource.sourceSubmissionId ?? null,
        source_argument_extraction_id: resource.sourceArgumentExtractionId ?? null,
        source_extraction_batch_id: resource.sourceExtractionBatchId ?? null,
        source_card_id: resource.sourceCardId ?? null,
        source_span_ids: Array.isArray(resource.sourceSpanIds) ? resource.sourceSpanIds : [],
        draft_type: resource.draftType,
        prepared_text: resource.preparedText ?? null,
        prepared_source_card_content: resource.preparedSourceCardContent ?? null,
        candidate_rater_visible_text: resource.candidateRaterVisibleText ?? null,
        blinding_review_status: resource.blindingReviewStatus,
        source_leakage_review_status: resource.sourceLeakageReviewStatus,
        gate_readiness_status: resource.gateReadinessStatus,
        candidate_item_readiness: resource.candidateItemReadiness,
        prepared_draft_status: resource.preparedDraftStatus,
        target_prepared_draft_id: resource.targetPreparedDraftId ?? null,
        target_candidate_item_id: resource.targetCandidateItemId ?? null,
        target_position_id: resource.targetPositionId ?? null,
        source_preparation_phase: resource.sourcePreparationPhase ?? null,
        source_preparation_review_status: resource.sourcePreparationReviewStatus ?? null,
        audit_trail: resource.auditTrail ?? {},
        visibility_classes: resource.visibilityClasses ?? {},
        created_by: resource.createdBy ?? null,
        created_at: resource.createdAt ?? null,
        updated_at: resource.updatedAt ?? null,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "reviewSignal") {
    return {
      table: "review_signals",
      values: {
        id: resource.id,
        signal_type: resource.signalType,
        source: resource.source,
        confidence: resource.confidence ?? null,
        explanation: resource.explanation,
        affected_object_type: resource.affectedObjectType,
        affected_object_id: resource.affectedObjectId,
        reviewer_id: resource.reviewerId ?? null,
        related_gate_ids: Array.isArray(resource.relatedGateIds) ? resource.relatedGateIds : [],
        visibility_class: resource.visibilityClass,
        created_at: resource.createdAt ?? null,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "gateDecision") {
    return {
      table: "gate_decisions",
      values: {
        id: resource.id,
        gate_id: resource.gateId,
        workflow_policy_id: resource.workflowPolicyId,
        object_type: resource.objectType ?? null,
        object_id: resource.objectId,
        gate_status: resource.gateStatus,
        decision_source: resource.decisionSource,
        cited_review_signal_ids: Array.isArray(resource.citedReviewSignalIds) ? resource.citedReviewSignalIds : [],
        decision_note: resource.decisionNote ?? "",
        waiver_reason: resource.waiverReason ?? null,
        reviewer_id: resource.reviewerId ?? null,
        visibility_class: resource.visibilityClass,
        timestamp: resource.timestamp ?? null,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "candidateItem") {
    return {
      table: "candidate_items",
      values: {
        id: resource.id,
        item_type: resource.itemType,
        source_prepared_draft_id: resource.sourcePreparedDraftId,
        source_contribution_part_id: resource.sourceContributionPartId ?? null,
        source_argument_extraction_id: resource.sourceArgumentExtractionId ?? null,
        source_extraction_batch_id: resource.sourceExtractionBatchId ?? null,
        source_card_id: resource.sourceCardId ?? null,
        source_span_ids: Array.isArray(resource.sourceSpanIds) ? resource.sourceSpanIds : [],
        target_prepared_draft_id: resource.targetPreparedDraftId ?? null,
        target_candidate_item_id: resource.targetCandidateItemId ?? null,
        target_position_id: resource.targetPositionId ?? null,
        candidate_rater_visible_text: resource.candidateRaterVisibleText ?? null,
        candidate_source_card_content: resource.candidateSourceCardContent ?? null,
        candidate_item_status: resource.candidateItemStatus,
        downstream_promotion_status: resource.downstreamPromotionStatus,
        public_release_eligibility_status: resource.publicReleaseEligibilityStatus,
        model_training_export_eligibility_status: resource.modelTrainingExportEligibilityStatus,
        validation_use_eligibility_status: resource.validationUseEligibilityStatus,
        hidden_benchmark_eligibility_status: resource.hiddenBenchmarkEligibilityStatus,
        assignment_exclusion_required: resource.assignmentExclusionRequired === true,
        visibility_classes: resource.visibilityClasses ?? {},
        created_by: resource.createdBy ?? null,
        created_at: resource.createdAt ?? null,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "promotionRecord") {
    return {
      table: "promotion_records",
      values: {
        id: resource.id,
        source_prepared_draft_id: resource.sourcePreparedDraftId,
        target_candidate_item_id: resource.targetCandidateItemId,
        target_type: resource.targetType,
        promoted_by: resource.promotedBy ?? null,
        promoted_at: resource.promotedAt ?? null,
        created_live_record: resource.createdLiveRecord === true,
        created_candidate_batch: resource.createdCandidateBatch === true,
        audit_trail: resource.auditTrail ?? {},
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  return null;
}

export function releaseArtifactProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  if (resourceKey === "labelSnapshot") {
    return {
      table: "label_snapshots",
      values: {
        id: resource.id,
        release_id: resource.releaseId ?? resource.release_id,
        target_label_version: resource.targetLabelVersion ?? resource.target_label_version ?? resource.snapshotFamily ?? resource.status,
        input_hash: resource.inputHash ?? resource.input_hash ?? resource.snapshotHash ?? resource.snapshotContentHash ?? event.payloadHash,
        snapshot_json: resource,
        created_at: resource.createdAt ?? resource.created_at ?? resource.frozenAt ?? resource.timestamp ?? event.receivedAt ?? null,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "releaseReport") {
    const report = resource.report ?? resource.reportJson ?? resource.report_json ?? resource;
    return {
      table: "release_reports",
      values: {
        id: resource.id,
        release_id: resource.releaseId ?? resource.release_id ?? report.releaseId ?? report.release_id,
        input_hash: resource.inputHash ?? resource.input_hash ?? resource.reportHash ?? resource.report_hash ?? event.payloadHash,
        report_json: report,
        created_at: resource.createdAt ?? resource.created_at ?? resource.generatedAt ?? resource.generated_at ?? report.generatedAt ?? event.receivedAt ?? null,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (operatorEvidenceProjectionTables[resourceKey]) {
    return {
      table: operatorEvidenceProjectionTables[resourceKey],
      values: operatorEvidenceProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event),
    };
  }
  return null;
}

function operatorEvidenceProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event) {
  return {
    id: resource.id,
    release_id: resource.releaseId ?? resource.release_id ?? resource.releaseVersionId ?? resource.release_version_id ?? null,
    resource_key: resourceKey,
    related_release_artifact_id:
      resource.relatedReleaseArtifactId ??
      resource.labelSnapshotId ??
      resource.label_snapshot_id ??
      resource.trainingExportId ??
      resource.training_export_id ??
      resource.corpusManifestId ??
      resource.corpus_manifest_id ??
      resource.exportManifestId ??
      resource.export_manifest_id ??
      null,
    related_evaluation_run_id:
      resource.evaluationRunId ??
      resource.evaluation_run_id ??
      resource.linkedEvaluationRunId ??
      resource.linked_evaluation_run_id ??
      (Array.isArray(resource.pairedEvaluationRunIds) ? resource.pairedEvaluationRunIds[0] : null) ??
      (Array.isArray(resource.paired_evaluation_run_ids) ? resource.paired_evaluation_run_ids[0] : null) ??
      (resourceKey === "evaluationRun" ? resource.id : null),
    target_label_snapshot_id: resource.targetLabelSnapshotId ?? resource.target_label_snapshot_id ?? resource.labelSnapshotId ?? resource.label_snapshot_id ?? null,
    artifact_status:
      resource.artifactStatus ??
      resource.releaseUseStatus ??
      resource.status ??
      resource.reviewStatus ??
      resource.parseStatus ??
      resource.approvalStatus ??
      "submitted_workflow_operator_evidence",
    input_hash:
      resource.inputHash ??
      resource.input_hash ??
      resource.artifactHash ??
      resource.artifact_hash ??
      resource.manifestHash ??
      resource.manifest_hash ??
      resource.exportHash ??
      resource.export_hash ??
      resource.runHash ??
      resource.run_hash ??
      resource.promptTextHash ??
      resource.prompt_text_hash ??
      resource.renderedPromptChecksum ??
      resource.rendered_prompt_checksum ??
      resource.parserConfigHash ??
      resource.parser_config_hash ??
      event.payloadHash ??
      `sha256:${resourceKey}:${resource.id}`,
    artifact_json: resource,
    event_id: eventId,
    record_json: recordJson,
    created_at: resource.createdAt ?? resource.created_at ?? resource.generatedAt ?? resource.generated_at ?? resource.frozenAt ?? resource.timestamp ?? event.receivedAt ?? null,
  };
}

export function releaseConfigProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!releaseConfigProjectionTables[resourceKey] || !resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  return {
    table: releaseConfigProjectionTables[resourceKey],
    values: releaseConfigProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event),
  };
}

function releaseConfigProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event) {
  const releaseConfigManifestId =
    resource.releaseConfigManifestId ??
    resource.release_config_manifest_id ??
    resource.manifestId ??
    resource.manifest_id ??
    (resourceKey === "releaseConfigManifest" ? resource.id : null);
  const governedBundleId =
    resource.governedBundleId ?? resource.governed_bundle_id ?? (resourceKey === "governedBundleRecord" ? resource.id : null);
  return {
    id: resource.id,
    release_id: resource.releaseId ?? resource.release_id ?? resource.releaseVersionId ?? resource.release_version_id ?? null,
    resource_key: resourceKey,
    release_version: resource.version ?? resource.releaseVersion ?? resource.release_version ?? null,
    release_gate_profile_id:
      resource.releaseGateProfileId ??
      resource.release_gate_profile_id ??
      resource.gateProfileId ??
      resource.gate_profile_id ??
      (resourceKey === "releaseGateProfile" ? resource.id : null),
    phase_gate_bundle_id: resource.phaseGateBundleId ?? resource.phase_gate_bundle_id ?? null,
    phase_gate_bundle_hash: resource.phaseGateBundleHash ?? resource.phase_gate_bundle_hash ?? null,
    release_config_manifest_id: releaseConfigManifestId,
    governed_bundle_id: governedBundleId,
    governed_bundle_family: resource.bundleFamily ?? resource.bundle_family ?? null,
    canonicalization_profile_id: resource.canonicalizationProfileId ?? resource.canonicalization_profile_id ?? null,
    artifact_status:
      resource.artifactStatus ??
      resource.status ??
      resource.freezeStatus ??
      resource.verificationStatus ??
      resource.appendOnlyActivationStatus ??
      `${resourceKey}_submitted`,
    input_hash:
      resource.inputHash ??
      resource.input_hash ??
      resource.canonicalManifestHash ??
      resource.canonical_manifest_hash ??
      resource.releaseConfigManifestHash ??
      resource.release_config_manifest_hash ??
      resource.phaseGateBundleHash ??
      resource.phase_gate_bundle_hash ??
      resource.canonicalContentHash ??
      resource.canonical_content_hash ??
      resource.expectedHash ??
      resource.expected_hash ??
      resource.observedHash ??
      resource.observed_hash ??
      event.payloadHash ??
      `sha256:${resourceKey}:${resource.id}`,
    artifact_json: resource,
    event_id: eventId,
    record_json: recordJson,
    created_at:
      resource.createdAt ??
      resource.created_at ??
      resource.frozenAt ??
      resource.frozen_at ??
      resource.activatedAt ??
      resource.activated_at ??
      resource.verifiedAt ??
      resource.verified_at ??
      resource.timestamp ??
      event.receivedAt ??
      null,
  };
}

export function metaphilosophyProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!metaphilosophyProjectionTables[resourceKey] || !resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  return {
    table: metaphilosophyProjectionTables[resourceKey],
    values: metaphilosophyProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event),
  };
}

function metaphilosophyProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event) {
  return {
    id: resource.id,
    release_id: resource.releaseId ?? resource.release_id ?? null,
    resource_key: resourceKey,
    architecture_layer_id:
      resource.architectureLayerId ?? resource.architecture_layer_id ?? (resourceKey === "metaphilosophyArchitectureLayer" ? resource.id : null),
    track_id: resource.trackId ?? resource.track_id ?? (resourceKey === "metaphilosophyTaskTrack" ? resource.id : null),
    lmca_relationship: resource.lmcaRelationship ?? resource.lmca_relationship ?? null,
    experiment_type: resource.experimentType ?? resource.experiment_type ?? null,
    release_gate_status: resource.releaseGateStatus ?? resource.release_gate_status ?? null,
    release_claim_role: resource.releaseClaimRole ?? resource.release_claim_role ?? null,
    boundary_rule: resource.boundaryRule ?? resource.boundary_rule ?? null,
    direct_requirement:
      resource.directRequirement === true || resource.direct_requirement === true
        ? true
        : resource.directRequirement === false || resource.direct_requirement === false
          ? false
          : null,
    pilot_evidence_requirement: resource.pilotEvidenceRequirement ?? resource.pilot_evidence_requirement ?? null,
    promotion_governance: resource.promotionGovernance ?? resource.promotion_governance ?? null,
    artifact_status:
      resource.artifactStatus ??
      resource.status ??
      resource.reviewStatus ??
      resource.releaseGateStatus ??
      `${resourceKey}_submitted`,
    input_hash:
      resource.inputHash ??
      resource.input_hash ??
      resource.artifactHash ??
      resource.artifact_hash ??
      resource.taskTrackHash ??
      resource.task_track_hash ??
      resource.backlogItemHash ??
      resource.backlog_item_hash ??
      event.payloadHash ??
      `sha256:${resourceKey}:${resource.id}`,
    artifact_json: resource,
    event_id: eventId,
    record_json: recordJson,
    created_at: resource.createdAt ?? resource.created_at ?? resource.updatedAt ?? resource.updated_at ?? resource.timestamp ?? event.receivedAt ?? null,
  };
}

export function discussionAdjudicationProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!discussionAdjudicationProjectionTables[resourceKey] || !resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  return {
    table: discussionAdjudicationProjectionTables[resourceKey],
    values: {
      id: resource.id,
      release_id: resource.releaseId ?? resource.release_id ?? null,
      resource_key: resourceKey,
      item_id: resource.itemId ?? resource.item_id ?? firstArrayValue(resource.itemKeys ?? resource.item_keys) ?? null,
      position_id: resource.positionId ?? resource.position_id ?? null,
      critique_id: resource.critiqueId ?? resource.critique_id ?? null,
      discussion_thread_id:
        resource.discussionThreadId ?? resource.discussion_thread_id ?? (resourceKey === "discussionThread" ? resource.id : null),
      adjudication_id: resource.adjudicationId ?? resource.adjudication_id ?? (resourceKey === "adjudication" ? resource.id : null),
      workflow_status: discussionAdjudicationWorkflowStatus(resourceKey, resource),
      visibility_class: "expert_admin_audit_only",
      artifact_json: resource,
      event_id: eventId,
      record_json: recordJson,
      created_at: resource.createdAt ?? resource.created_at ?? resource.updatedAt ?? resource.updated_at ?? resource.timestamp ?? event.receivedAt ?? null,
    },
  };
}

export function verificationAdjudicationProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!verificationAdjudicationProjectionTables[resourceKey] || !resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  return {
    table: verificationAdjudicationProjectionTables[resourceKey],
    values: verificationAdjudicationProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event),
  };
}

function verificationAdjudicationProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event) {
  const adminOnly = adminOnlyVerificationAdjudicationResourceKeys.has(resourceKey);
  return {
    id: resource.id,
    release_id: resource.releaseId ?? resource.release_id ?? null,
    resource_key: resourceKey,
    item_id: resource.itemId ?? resource.item_id ?? firstArrayValue(resource.itemKeys ?? resource.item_keys) ?? null,
    position_id: resource.positionId ?? resource.position_id ?? null,
    critique_id: resource.critiqueId ?? resource.critique_id ?? null,
    rating_id: resource.ratingId ?? resource.rating_id ?? resource.attemptRatingId ?? resource.attempt_rating_id ?? null,
    rater_id: resource.raterId ?? resource.rater_id ?? null,
    policy_id:
      resource.policyId ??
      resource.policy_id ??
      resource.interpretationTargetMapRequirednessPolicyId ??
      resource.interpretation_target_map_requiredness_policy_id ??
      resource.verificationClaimGranularityPolicyId ??
      resource.verification_claim_granularity_policy_id ??
      resource.adjudicatorPreReadRequirednessPolicyId ??
      resource.adjudicator_pre_read_requiredness_policy_id ??
      resource.adjudicationCockpitSignoffPolicyId ??
      resource.adjudication_cockpit_signoff_policy_id ??
      (resourceKey.endsWith("Policy") ? resource.id : null),
    verification_record_id: resource.verificationRecordId ?? resource.verification_record_id ?? null,
    verification_workspace_id:
      resource.verificationWorkspaceId ??
      resource.verification_workspace_id ??
      (resourceKey === "verificationWorkspaceSession" ? resource.id : null),
    interpretation_target_map_id: resource.interpretationTargetMapId ?? resource.interpretation_target_map_id ?? null,
    adjudication_id: resource.adjudicationId ?? resource.adjudication_id ?? null,
    discussion_thread_id: resource.discussionThreadId ?? resource.discussion_thread_id ?? null,
    adjudication_memo_id: resource.adjudicationMemoId ?? resource.adjudication_memo_id ?? resource.linkedAdjudicationMemoId ?? null,
    workflow_status:
      resource.verificationStatus ??
      resource.blindingImpactStatus ??
      resource.requirednessDecisionStatus ??
      resource.claimGranularityReviewStatus ??
      resource.cockpitSignoffStatus ??
      resource.protectedSplitConflictCheck ??
      resource.status ??
      resource.reviewStatus ??
      `${resourceKey}_submitted`,
    visibility_class: adminOnly ? "admin_audit_only" : "expert_admin_audit_only",
    source_exposure_status: resource.sourceExposureStatus ?? resource.source_exposure_status ?? resource.exposureStatus ?? resource.exposure_status ?? null,
    protected_content_status:
      resource.protectedContentExposureStatus ?? resource.protected_content_exposure_status ?? resource.protectedContentStatus ?? null,
    model_assistance_status: resource.modelAssistanceStatus ?? resource.model_assistance_status ?? null,
    nonblind_evidence_flag: resource.nonblindEvidenceFlag === true,
    source_assisted_flag: resource.sourceAssistedFlag === true,
    artifact_status:
      resource.artifactStatus ??
      resource.blindingImpactStatus ??
      resource.verificationResult ??
      resource.verificationStatus ??
      resource.requirednessDecisionStatus ??
      resource.claimGranularityReviewStatus ??
      resource.cockpitSignoffStatus ??
      resource.protectedSplitConflictCheck ??
      resource.status ??
      resource.reviewStatus ??
      `${resourceKey}_submitted`,
    input_hash:
      resource.inputHash ??
      resource.input_hash ??
      resource.artifactHash ??
      resource.artifact_hash ??
      resource.snapshotContentHash ??
      resource.snapshot_content_hash ??
      resource.policyHash ??
      resource.policy_hash ??
      event.payloadHash ??
      `sha256:${resourceKey}:${resource.id}`,
    artifact_json: resource,
    event_id: eventId,
    record_json: recordJson,
    created_at: resource.createdAt ?? resource.created_at ?? resource.frozenAt ?? resource.timestamp ?? resource.retrievedAt ?? event.receivedAt ?? null,
  };
}

export function releaseReadinessProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!releaseReadinessProjectionTables[resourceKey] || !resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  return {
    table: releaseReadinessProjectionTables[resourceKey],
    values: releaseReadinessProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event),
  };
}

function releaseReadinessProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event) {
  return {
    id: resource.id,
    release_id: resource.releaseId ?? resource.release_id ?? resource.releaseVersionId ?? resource.release_version_id ?? null,
    resource_key: resourceKey,
    item_id:
      resource.itemId ??
      resource.item_id ??
      resource.artifactId ??
      resource.artifact_id ??
      firstArrayValue(resource.itemIds ?? resource.item_ids) ??
      null,
    position_id: resource.positionId ?? resource.position_id ?? null,
    critique_id: resource.critiqueId ?? resource.critique_id ?? null,
    policy_id:
      resource.policyId ??
      resource.policy_id ??
      resource.certificationThresholdPolicyId ??
      resource.certification_threshold_policy_id ??
      resource.benchmarkRefreshPolicyId ??
      resource.benchmark_refresh_policy_id ??
      resource.comparabilityTierPolicyId ??
      resource.comparability_tier_policy_id ??
      resource.releaseErratumDisclosurePolicyId ??
      resource.release_erratum_disclosure_policy_id ??
      resource.benchmarkSubmissionPolicyId ??
      resource.benchmark_submission_policy_id ??
      resource.rightsClearancePolicyId ??
      resource.rights_clearance_policy_id ??
      (resourceKey.endsWith("Policy") ? resource.id : null),
    target_label_snapshot_id: resource.targetLabelSnapshotId ?? resource.target_label_snapshot_id ?? resource.labelSnapshotId ?? resource.label_snapshot_id ?? null,
    split_name: resource.splitName ?? resource.split_name ?? resource.split ?? resource.splitOrValidationSubset ?? resource.split_or_validation_subset ?? null,
    release_gate_profile_id: resource.releaseGateProfileId ?? resource.release_gate_profile_id ?? null,
    evaluation_run_id: resource.evaluationRunId ?? resource.evaluation_run_id ?? resource.linkedEvaluationRunId ?? resource.linked_evaluation_run_id ?? null,
    artifact_status:
      resource.artifactStatus ??
      resource.releaseUseStatus ??
      resource.validationDesignStatus ??
      resource.appendixCComparabilityStatus ??
      resource.humanCeilingStatus ??
      resource.saturationStatus ??
      resource.certificationStatus ??
      resource.budgetConsumptionStatus ??
      resource.cooldownStatus ??
      resource.duplicateRunStatus ??
      resource.trainingExposureStatus ??
      resource.leakPreventionStatus ??
      resource.freezeStatus ??
      resource.rightsStatus ??
      resource.rights_status ??
      resource.status ??
      resource.reviewStatus ??
      `${resourceKey}_submitted`,
    visibility_class: "admin_audit_only",
    input_hash:
      resource.inputHash ??
      resource.input_hash ??
      resource.artifactHash ??
      resource.artifact_hash ??
      resource.manifestHash ??
      resource.manifest_hash ??
      resource.runHash ??
      resource.run_hash ??
      resource.policyHash ??
      resource.policy_hash ??
      event.payloadHash ??
      `sha256:${resourceKey}:${resource.id}`,
    artifact_json: resource,
    event_id: eventId,
    record_json: recordJson,
    created_at: resource.createdAt ?? resource.created_at ?? resource.frozenAt ?? resource.timestamp ?? resource.reviewedAt ?? event.receivedAt ?? null,
  };
}

export function safeguardAuxiliaryProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!safeguardAuxiliaryProjectionTables[resourceKey] || !resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  return {
    table: safeguardAuxiliaryProjectionTables[resourceKey],
    values: safeguardAuxiliaryProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event),
  };
}

function safeguardAuxiliaryProjectionValuesForWorkflowResource(resourceKey, resource, eventId, recordJson, event) {
  const adminOnly = adminOnlySafeguardAuxiliaryResourceKeys.has(resourceKey);
  return {
    id: resource.id,
    release_id: resource.releaseId ?? resource.release_id ?? null,
    resource_key: resourceKey,
    assignment_id: resource.assignmentId ?? resource.assignment_id ?? null,
    rating_id: resource.ratingId ?? resource.rating_id ?? null,
    item_id: resource.itemId ?? resource.item_id ?? firstArrayValue(resource.itemKeys ?? resource.item_keys) ?? null,
    position_id: resource.positionId ?? resource.position_id ?? null,
    critique_id: resource.critiqueId ?? resource.critique_id ?? null,
    policy_id:
      resource.policyId ??
      resource.policy_id ??
      resource.externalAssistanceContaminationPolicyId ??
      resource.external_assistance_contamination_policy_id ??
      resource.spotCheckSamplingPolicyId ??
      resource.spot_check_sampling_policy_id ??
      resource.diagnosticDeferralVisibilityPolicyId ??
      resource.diagnostic_deferral_visibility_policy_id ??
      (resourceKey.endsWith("Policy") ? resource.id : null),
    artifact_status:
      resource.artifactStatus ??
      resource.releaseUseStatus ??
      resource.reviewStatus ??
      resource.status ??
      resource.sourceRecognitionReviewStatus ??
      resource.contaminationRouting ??
      resource.ordinaryRatingStatus ??
      resource.reviewDecision ??
      resource.triageStatus ??
      resource.diagnosticDeferralReviewStatus ??
      resource.publicClaimEligibility ??
      `${resourceKey}_submitted`,
    visibility_class: adminOnly ? "admin_audit_only" : "expert_admin_audit_only",
    input_hash:
      resource.inputHash ??
      resource.input_hash ??
      resource.artifactHash ??
      resource.artifact_hash ??
      resource.policyHash ??
      resource.policy_hash ??
      event.payloadHash ??
      `sha256:${resourceKey}:${resource.id}`,
    artifact_json: resource,
    event_id: eventId,
    record_json: recordJson,
    created_at: resource.createdAt ?? resource.created_at ?? resource.frozenAt ?? resource.timestamp ?? resource.reviewedAt ?? event.receivedAt ?? null,
  };
}

function firstArrayValue(value) {
  return Array.isArray(value) && value.length ? value[0] : null;
}

function discussionAdjudicationWorkflowStatus(resourceKey, resource) {
  return (
    resource.status ??
    resource.discussionStatus ??
    resource.decisionStatus ??
    resource.finalizationStatus ??
    resource.objectLevelStatus ??
    resource.revisionReasonCode ??
    resource.cockpitSignoffStatus ??
    resource.postDiscussionResolutionStatus ??
    `${resourceKey}_submitted`
  );
}

export function workflowStateTransitionProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const transition = event?.payload?.[resourceKey];
  if (resourceKey !== "workflowStateTransitionLog" || !transition || typeof transition !== "object" || Array.isArray(transition)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  const failedGuardReasons = transition.failedGuardReasons ?? transition.failed_guard_reasons ?? [];
  const transitionRejected =
    event.type === "workflow_state_transition_rejected" ||
    failedGuardReasons.length > 0 ||
    transition.requestedNextState !== transition.acceptedNextState;
  return {
    table: "workflow_state_transition_logs",
    values: {
      id: transition.id ?? transition.transitionId ?? transition.transition_id,
      entity_type: transition.entityType ?? transition.entity_type,
      entity_id: transition.entityId ?? transition.entity_id,
      assignment_id: transition.assignmentId ?? transition.assignment_id ?? null,
      prior_state: transition.priorState ?? transition.prior_state,
      requested_next_state: transition.requestedNextState ?? transition.requested_next_state,
      accepted_next_state: transition.acceptedNextState ?? transition.accepted_next_state,
      actor_id: transition.actorId ?? transition.transitionActorId ?? transition.transition_actor_id,
      actor_role: transition.actorRole ?? transition.transitionActorRole ?? transition.transition_actor_role,
      guard_checks: transition.guardChecks ?? transition.guard_checks ?? transition.guardChecksEvaluated ?? [],
      failed_guard_reasons: failedGuardReasons,
      lock_freeze_artifact_ids: transition.lockFreezeArtifactIds ?? transition.lock_freeze_artifact_ids ?? [],
      source_tag_protected_visibility_state:
        transition.sourceTagProtectedVisibilityState ?? transition.source_tag_protected_visibility_state,
      transition_status: transitionRejected ? "rejected_guarded_transition" : "accepted_guarded_transition",
      timestamp: transition.timestamp ?? transition.createdAt ?? transition.created_at,
      event_type: event.type ?? "workflow_state_transition_unknown",
      event_id: eventId,
      payload_hash: event.payloadHash ?? null,
      actor_hash: event.actorHash ?? null,
      received_at: event.receivedAt ?? null,
      record_json: recordJson,
    },
  };
}

export function workUnitProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  if (resourceKey === "position") {
    return {
      table: "positions",
      values: {
        id: resource.id,
        split: resource.split,
        topic_family: resource.topicFamily,
        conceptual_scope: resource.conceptualScope,
        ground_truth_availability: resource.groundTruthAvailability,
        event_id: eventId,
        record_json: recordJson,
        text_version_rows: textVersionRowsForWorkflowResource(resource, "position", eventId, recordJson),
      },
    };
  }
  if (resourceKey === "critique") {
    return {
      table: "critiques",
      values: {
        id: resource.id,
        position_id: resource.positionId,
        split: resource.split ?? "workflow_submitted",
        authorship_type: resource.authorshipType ?? resource.sourceType ?? "unspecified",
        event_id: eventId,
        record_json: recordJson,
        text_version_rows: textVersionRowsForWorkflowResource(resource, "critique", eventId, recordJson),
      },
    };
  }
  if (resourceKey === "itemTextVersion") {
    const itemType = resource.itemType;
    const table = itemType === "position" ? "position_text_versions" : itemType === "critique" ? "critique_text_versions" : null;
    if (!table) return null;
    return {
      table,
      values: itemTextVersionRow(resource, eventId, recordJson),
    };
  }
  if (resourceKey === "ratingContextSnapshot") {
    return {
      table: "rating_context_snapshots",
      values: {
        id: resource.id,
        position_id: resource.positionId,
        target_critique_id: resource.targetCritiqueId ?? null,
        context_json: resource,
        canonical_hash: resource.canonicalHash ?? resource.modelVisibleContextHash,
        model_visible_context_hash: resource.modelVisibleContextHash ?? null,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "assignment") {
    return {
      table: "assignments",
      values: {
        id: resource.id,
        position_id: resource.positionId,
        critique_id: resource.critiqueId,
        rater_external_id: resource.raterId ?? resource.assignedTo ?? resource.assigned_to ?? null,
        queue_type: resource.assignmentType ?? resource.queueType,
        status: resource.status ?? resource.blindState ?? "assigned",
        workflow_profile_id: resource.workflowProfileId ?? null,
        rating_context_snapshot_id: resource.ratingContextSnapshotId ?? null,
        blind_state: resource.blindState ?? null,
        source_tag_visibility_state: resource.sourceTagVisibilityState ?? null,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  return null;
}

function textVersionRowsForWorkflowResource(resource, itemType, eventId, recordJson) {
  const submittedRows = Array.isArray(resource.textVersions)
    ? resource.textVersions.map((version, index) =>
        itemTextVersionRow(
          {
            ...version,
            itemType,
            itemId: resource.id,
            id: version.id ?? `${resource.id}-text-v${index + 1}`,
          },
          eventId,
          recordJson,
        ),
      )
    : [];
  if (submittedRows.length) return submittedRows;
  if (typeof resource.text !== "string" || resource.text.trim() === "") return [];
  const fallbackVersionId = resource.intakeScreening?.raterVisibleTextVersionId ?? resource.raterVisibleTextVersionId ?? `${resource.id}-text-v1`;
  return [
    itemTextVersionRow(
      {
        id: fallbackVersionId,
        itemType,
        itemId: resource.id,
        canonicalTextHash: resource.canonicalTextHash ?? resource.canonicalHash ?? `sha256:${fallbackVersionId}:canonical`,
        raterVisibleRenderedTextHash:
          resource.raterVisibleRenderedTextHash ?? resource.raterVisibleHash ?? resource.renderedHash ?? `sha256:${fallbackVersionId}:rendered`,
        modelVisibleRenderedTextHash: resource.modelVisibleRenderedTextHash ?? null,
        createdAt: resource.createdAt,
      },
      eventId,
      recordJson,
    ),
  ];
}

function itemTextVersionRow(resource, eventId, recordJson) {
  return {
    id: resource.id ?? resource.itemTextVersionId,
    item_id: resource.itemId,
    canonical_hash: resource.canonicalTextHash ?? resource.canonicalHash,
    rater_visible_hash: resource.raterVisibleRenderedTextHash ?? resource.raterVisibleRenderedHash ?? resource.renderedHash,
    model_visible_hash: resource.modelVisibleRenderedTextHash ?? resource.modelVisibleRenderedHash ?? null,
    created_at: resource.createdAt ?? resource.timestamp ?? null,
    event_id: eventId,
    record_json: recordJson,
  };
}

export function operationalControlProjectionForWorkflowEvent(event) {
  const resourceKey = event?.resourceKey;
  const resource = event?.payload?.[resourceKey];
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return null;
  const eventId = event.id ?? event.eventId ?? null;
  const recordJson = event;
  if (resourceKey === "policyActionKind") {
    return {
      table: "policy_action_kinds",
      values: {
        id: resource.id,
        action_kind: resource.actionKind,
        requires_current_decision: resource.requiresCurrentDecision,
        requires_manifest_binding: resource.requiresManifestBinding,
        requires_actor_binding: resource.requiresActorBinding,
        requires_output_schema_binding: resource.requiresOutputSchemaBinding,
        requires_phase_gate_binding: resource.requiresPhaseGateBinding,
        requires_idempotency_binding: resource.requiresIdempotencyBinding,
        replay_protection: resource.replayProtection,
        wrong_scope_behavior: resource.wrongScopeBehavior,
        activated_at: resource.activatedAt,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "policyDecisionRecord") {
    return {
      table: "policy_decisions",
      values: {
        id: resource.id,
        action_kind_id: resource.actionKindId,
        action_kind: resource.actionKind,
        decision_status: resource.decisionStatus,
        actor_id: resource.actorId,
        actor_role: resource.actorRole ?? null,
        manifest_id: resource.manifestId,
        manifest_hash: resource.manifestHash,
        phase_gate_bundle_id: resource.phaseGateBundleId,
        phase_gate_bundle_hash: resource.phaseGateBundleHash,
        release_id: resource.releaseId,
        output_schema_version: resource.outputSchemaVersion,
        output_schema_hash: resource.outputSchemaHash,
        target_artifact_ids: resource.targetArtifactIds ?? [],
        idempotency_key: resource.idempotencyKey ?? null,
        single_use: resource.singleUse ?? null,
        replay_status: resource.replayStatus,
        manifest_binding_status: resource.manifestBindingStatus,
        output_schema_binding_status: resource.outputSchemaBindingStatus,
        phase_gate_binding_status: resource.phaseGateBindingStatus,
        idempotency_binding_status: resource.idempotencyBindingStatus,
        expires_at: resource.expiresAt,
        decided_at: resource.decidedAt,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "policyDecisionConsumption") {
    return {
      table: "policy_decision_consumptions",
      values: {
        id: resource.id,
        decision_id: resource.decisionId,
        action_kind: resource.actionKind,
        manifest_id: resource.manifestId,
        manifest_hash: resource.manifestHash,
        phase_gate_bundle_id: resource.phaseGateBundleId,
        phase_gate_bundle_hash: resource.phaseGateBundleHash,
        output_schema_version: resource.outputSchemaVersion,
        output_schema_hash: resource.outputSchemaHash,
        idempotency_key: resource.idempotencyKey,
        replay_rejected: resource.replayRejected,
        scope_matched: resource.scopeMatched,
        consumed_at: resource.consumedAt,
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  if (resourceKey === "implementationPhaseGateBundle") {
    const laneStates = resource.laneStates ?? [];
    return {
      table: "implementation_phase_gate_bundles",
      values: {
        id: resource.id,
        release_id: resource.releaseId,
        manifest_id: resource.manifestId,
        version: resource.version,
        future_phase_default: resource.futurePhaseDefault,
        broadening_requires_manifest_activation: resource.broadeningRequiresManifestActivation,
        frozen_at: resource.frozenAt,
        lane_rows: laneStates.map((lane, positionIndex) => ({
          bundle_id: resource.id,
          lane_kind: lane.laneKind,
          phase_state: lane.phaseState,
          allowed_action_kinds: lane.allowedActionKinds ?? [],
          required_feature_flags: lane.requiredFeatureFlags ?? [],
          unavailable_response_class: lane.unavailableResponseClass ?? null,
          rollout_owner: lane.rolloutOwner ?? null,
          fail_closed: lane.failClosed,
          no_side_effects_when_disabled: lane.noSideEffectsWhenDisabled,
          labels_exposed_when_disabled: lane.labelsExposedWhenDisabled,
          supports_release_claims_when_disabled: lane.supportsReleaseClaimsWhenDisabled,
          position_index: positionIndex,
          event_id: eventId,
          record_json: recordJson,
        })),
        event_id: eventId,
        record_json: recordJson,
      },
    };
  }
  return null;
}

async function appendRatingProjection(db, event) {
  const projection = ratingProjectionForAuditEvent(event);
  if (!projection) return;
  const { values } = projection;
  await db`
    insert into ratings (
      id,
      assignment_id,
      position_id,
      critique_id,
      rater_id,
      rater_tier,
      kind,
      parent_rating_id,
      rubric_version,
      score_input_policy_id,
      workflow_profile_id,
      score_explanation_policy_id,
      position_text_version_id,
      critique_text_version_id,
      rating_context_snapshot_id,
      scores_json,
      raw_scores_json,
      displayed_scores_json,
      score_quantization_policy,
      score_confidence_judgment,
      general_rating_note,
      score_explanation,
      score_explanation_required,
      score_explanation_required_reasons,
      score_explanation_triggers,
      score_explanation_prompt_visibility,
      score_explanation_prompt_shown,
      score_explanation_completion_status,
      overall_vs_centrality_strength_diagnostic,
      score_entry_explicitness_status,
      score_missing_field_validation_status,
      provisional_dimensions,
      rationale,
      rationale_evidence_span_ids,
      locked_before_peer_exposure,
      source_tag_visibility_state,
      active_seconds,
      idle_gap_seconds,
      interruption_count,
      submitted_at,
      locked_at,
      policy_action_kind,
      policy_decision_id,
      policy_decision_consumption_id,
      policy_decision_idempotency_key,
      event_id,
      payload_hash,
      actor_hash,
      received_at,
      record_json
    )
    values (
      ${values.id},
      ${values.assignment_id},
      ${values.position_id},
      ${values.critique_id},
      ${values.rater_id},
      ${values.rater_tier},
      ${values.kind},
      ${values.parent_rating_id},
      ${values.rubric_version},
      ${values.score_input_policy_id},
      ${values.workflow_profile_id},
      ${values.score_explanation_policy_id},
      ${values.position_text_version_id},
      ${values.critique_text_version_id},
      ${values.rating_context_snapshot_id},
      ${db.json(values.scores_json)},
      ${db.json(values.raw_scores_json)},
      ${db.json(values.displayed_scores_json)},
      ${values.score_quantization_policy},
      ${values.score_confidence_judgment},
      ${values.general_rating_note},
      ${values.score_explanation},
      ${values.score_explanation_required},
      ${db.json(values.score_explanation_required_reasons)},
      ${db.json(values.score_explanation_triggers)},
      ${values.score_explanation_prompt_visibility},
      ${values.score_explanation_prompt_shown},
      ${values.score_explanation_completion_status},
      ${db.json(values.overall_vs_centrality_strength_diagnostic)},
      ${values.score_entry_explicitness_status},
      ${values.score_missing_field_validation_status},
      ${db.json(values.provisional_dimensions)},
      ${values.rationale},
      ${db.json(values.rationale_evidence_span_ids)},
      ${values.locked_before_peer_exposure},
      ${values.source_tag_visibility_state},
      ${values.active_seconds},
      ${values.idle_gap_seconds},
      ${values.interruption_count},
      ${values.submitted_at},
      ${values.locked_at},
      ${values.policy_action_kind},
      ${values.policy_decision_id},
      ${values.policy_decision_consumption_id},
      ${values.policy_decision_idempotency_key},
      ${values.event_id},
      ${values.payload_hash},
      ${values.actor_hash},
      ${values.received_at},
      ${db.json(values.record_json)}
    )
    on conflict (id) do nothing
  `;
  for (const scoreRow of values.score_rows ?? []) {
    await db`
      insert into rating_score_values (
        rating_id,
        dimension,
        score_value,
        raw_score_value,
        displayed_score_value,
        low_clarity_provisional,
        event_id,
        record_json
      )
      values (
        ${scoreRow.rating_id},
        ${scoreRow.dimension},
        ${scoreRow.score_value},
        ${scoreRow.raw_score_value},
        ${scoreRow.displayed_score_value},
        ${scoreRow.low_clarity_provisional},
        ${scoreRow.event_id},
        ${db.json(scoreRow.record_json)}
      )
      on conflict (rating_id, dimension) do nothing
    `;
  }
}

async function appendWorkflowResourceProjection(db, event) {
  await appendWorkUnitWorkflowProjection(db, event);
  await appendReleaseArtifactWorkflowProjection(db, event);
  await appendReleaseConfigWorkflowProjection(db, event);
  await appendMetaphilosophyWorkflowProjection(db, event);
  await appendDiscussionAdjudicationWorkflowProjection(db, event);
  await appendVerificationAdjudicationWorkflowProjection(db, event);
  await appendReleaseReadinessWorkflowProjection(db, event);
  await appendSafeguardAuxiliaryWorkflowProjection(db, event);
  await appendSourceIntakeWorkflowProjection(db, event);
  await appendSourcePreparationWorkflowProjection(db, event);
  await appendRatingExperienceWorkflowProjection(db, event);
  await appendInteractionUxWorkflowProjection(db, event);
  await appendMetricGovernanceWorkflowProjection(db, event);
  await appendWorkflowStateTransitionProjection(db, event);
  await appendOperationalControlWorkflowProjection(db, event);
}

async function appendWorkUnitWorkflowProjection(db, event) {
  const projection = workUnitProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (projection.table === "positions") {
    await db`
      insert into positions (
        id,
        split,
        topic_family,
        conceptual_scope,
        ground_truth_availability,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.split},
        ${values.topic_family},
        ${values.conceptual_scope},
        ${values.ground_truth_availability},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        split = excluded.split,
        topic_family = excluded.topic_family,
        conceptual_scope = excluded.conceptual_scope,
        ground_truth_availability = excluded.ground_truth_availability,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    for (const textVersionRow of values.text_version_rows ?? []) {
      await appendPositionTextVersionProjection(db, textVersionRow);
    }
    return;
  }
  if (projection.table === "critiques") {
    await db`
      insert into critiques (
        id,
        position_id,
        split,
        authorship_type,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.position_id},
        ${values.split},
        ${values.authorship_type},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        position_id = excluded.position_id,
        split = excluded.split,
        authorship_type = excluded.authorship_type,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    for (const textVersionRow of values.text_version_rows ?? []) {
      await appendCritiqueTextVersionProjection(db, textVersionRow);
    }
    return;
  }
  if (projection.table === "position_text_versions") {
    await appendPositionTextVersionProjection(db, values);
    return;
  }
  if (projection.table === "critique_text_versions") {
    await appendCritiqueTextVersionProjection(db, values);
    return;
  }
  if (projection.table === "rating_context_snapshots") {
    await db`
      insert into rating_context_snapshots (
        id,
        position_id,
        target_critique_id,
        context_json,
        canonical_hash,
        model_visible_context_hash,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.position_id},
        ${values.target_critique_id},
        ${db.json(values.context_json)},
        ${values.canonical_hash},
        ${values.model_visible_context_hash},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do nothing
    `;
    return;
  }
  if (projection.table === "assignments") {
    await db`
      insert into assignments (
        id,
        position_id,
        critique_id,
        rater_external_id,
        queue_type,
        status,
        workflow_profile_id,
        rating_context_snapshot_id,
        blind_state,
        source_tag_visibility_state,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.position_id},
        ${values.critique_id},
        ${values.rater_external_id},
        ${values.queue_type},
        ${values.status},
        ${values.workflow_profile_id},
        ${values.rating_context_snapshot_id},
        ${values.blind_state},
        ${values.source_tag_visibility_state},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        position_id = excluded.position_id,
        critique_id = excluded.critique_id,
        rater_external_id = excluded.rater_external_id,
        queue_type = excluded.queue_type,
        status = excluded.status,
        workflow_profile_id = excluded.workflow_profile_id,
        rating_context_snapshot_id = excluded.rating_context_snapshot_id,
        blind_state = excluded.blind_state,
        source_tag_visibility_state = excluded.source_tag_visibility_state,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
  }
}

async function appendPositionTextVersionProjection(db, values) {
  await db`
    insert into position_text_versions (
      id,
      position_id,
      canonical_hash,
      rater_visible_hash,
      model_visible_hash,
      created_at,
      event_id,
      record_json
    )
    values (
      ${values.id},
      ${values.item_id},
      ${values.canonical_hash},
      ${values.rater_visible_hash},
      ${values.model_visible_hash},
      coalesce(${values.created_at}::timestamptz, now()),
      ${values.event_id},
      ${db.json(values.record_json)}
    )
    on conflict (id) do nothing
  `;
}

async function appendCritiqueTextVersionProjection(db, values) {
  await db`
    insert into critique_text_versions (
      id,
      critique_id,
      canonical_hash,
      rater_visible_hash,
      model_visible_hash,
      created_at,
      event_id,
      record_json
    )
    values (
      ${values.id},
      ${values.item_id},
      ${values.canonical_hash},
      ${values.rater_visible_hash},
      ${values.model_visible_hash},
      coalesce(${values.created_at}::timestamptz, now()),
      ${values.event_id},
      ${db.json(values.record_json)}
    )
    on conflict (id) do nothing
  `;
}

async function appendSourceIntakeWorkflowProjection(db, event) {
  const projection = sourceIntakeProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (projection.table === "source_cards") {
    await db`
      insert into source_cards (
        id,
        title,
        source_author,
        source_work,
        source_publisher_or_site,
        publication_year,
        uploaded_file_id,
        source_type,
        source_locator,
        source_provenance_summary,
        rights_status,
        source_language,
        translation_status,
        translation_route,
        task_format,
        source_dataset_name,
        source_subsource,
        source_domain_suitability,
        source_domain_concentration,
        lsat_derived,
        admin_notes,
        source_access_policy,
        release_policy,
        source_visibility,
        created_by,
        created_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.title},
        ${values.source_author},
        ${values.source_work},
        ${values.source_publisher_or_site},
        ${values.publication_year},
        ${values.uploaded_file_id},
        ${values.source_type},
        ${values.source_locator},
        ${values.source_provenance_summary},
        ${values.rights_status},
        ${values.source_language},
        ${values.translation_status},
        ${values.translation_route},
        ${values.task_format},
        ${values.source_dataset_name},
        ${values.source_subsource},
        ${values.source_domain_suitability},
        ${values.source_domain_concentration},
        ${values.lsat_derived},
        ${values.admin_notes},
        ${values.source_access_policy},
        ${values.release_policy},
        ${values.source_visibility},
        ${values.created_by},
        ${values.created_at},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        title = excluded.title,
        source_author = excluded.source_author,
        source_work = excluded.source_work,
        source_publisher_or_site = excluded.source_publisher_or_site,
        publication_year = excluded.publication_year,
        uploaded_file_id = excluded.uploaded_file_id,
        source_type = excluded.source_type,
        source_locator = excluded.source_locator,
        source_provenance_summary = excluded.source_provenance_summary,
        rights_status = excluded.rights_status,
        source_language = excluded.source_language,
        translation_status = excluded.translation_status,
        translation_route = excluded.translation_route,
        task_format = excluded.task_format,
        source_dataset_name = excluded.source_dataset_name,
        source_subsource = excluded.source_subsource,
        source_domain_suitability = excluded.source_domain_suitability,
        source_domain_concentration = excluded.source_domain_concentration,
        lsat_derived = excluded.lsat_derived,
        admin_notes = excluded.admin_notes,
        source_access_policy = excluded.source_access_policy,
        release_policy = excluded.release_policy,
        source_visibility = excluded.source_visibility,
        created_by = excluded.created_by,
        created_at = excluded.created_at,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (projection.table === "source_spans") {
    await db`
      insert into source_spans (
        id,
        source_card_id,
        span_locator,
        bounded_locator,
        span_kind,
        text_hash,
        admin_excerpt,
        excerpt_storage_policy,
        segmentation_status,
        extraction_status,
        admin_selection_notes,
        source_visibility,
        created_by,
        created_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.source_card_id},
        ${values.span_locator},
        ${values.bounded_locator},
        ${values.span_kind},
        ${values.text_hash},
        ${values.admin_excerpt},
        ${values.excerpt_storage_policy},
        ${values.segmentation_status},
        ${values.extraction_status},
        ${values.admin_selection_notes},
        ${values.source_visibility},
        ${values.created_by},
        ${values.created_at},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        source_card_id = excluded.source_card_id,
        span_locator = excluded.span_locator,
        bounded_locator = excluded.bounded_locator,
        span_kind = excluded.span_kind,
        text_hash = excluded.text_hash,
        admin_excerpt = excluded.admin_excerpt,
        excerpt_storage_policy = excluded.excerpt_storage_policy,
        segmentation_status = excluded.segmentation_status,
        extraction_status = excluded.extraction_status,
        admin_selection_notes = excluded.admin_selection_notes,
        source_visibility = excluded.source_visibility,
        created_by = excluded.created_by,
        created_at = excluded.created_at,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (projection.table === "extraction_batches") {
    await db`
      insert into extraction_batches (
        id,
        source_card_id,
        import_format,
        imported_by,
        imported_at,
        extraction_count,
        parser_version,
        import_route,
        extraction_execution_mode,
        downstream_integration_status,
        creates_prepared_draft,
        creates_candidate_item,
        creates_candidate_batch,
        live_queue_integration,
        ai_extraction_executed,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.source_card_id},
        ${values.import_format},
        ${values.imported_by},
        ${values.imported_at},
        ${values.extraction_count},
        ${values.parser_version},
        ${values.import_route},
        ${values.extraction_execution_mode},
        ${values.downstream_integration_status},
        ${values.creates_prepared_draft},
        ${values.creates_candidate_item},
        ${values.creates_candidate_batch},
        ${values.live_queue_integration},
        ${values.ai_extraction_executed},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        source_card_id = excluded.source_card_id,
        import_format = excluded.import_format,
        imported_by = excluded.imported_by,
        imported_at = excluded.imported_at,
        extraction_count = excluded.extraction_count,
        parser_version = excluded.parser_version,
        import_route = excluded.import_route,
        extraction_execution_mode = excluded.extraction_execution_mode,
        downstream_integration_status = excluded.downstream_integration_status,
        creates_prepared_draft = excluded.creates_prepared_draft,
        creates_candidate_item = excluded.creates_candidate_item,
        creates_candidate_batch = excluded.creates_candidate_batch,
        live_queue_integration = excluded.live_queue_integration,
        ai_extraction_executed = excluded.ai_extraction_executed,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (projection.table === "argument_extractions") {
    await db`
      insert into argument_extractions (
        id,
        extraction_batch_id,
        source_card_id,
        source_span_ids,
        argument_role,
        intended_conclusion,
        key_premises,
        argument_summary,
        implicit_assumptions,
        critique_target,
        context_needed,
        conceptual_scope_notes,
        suitability_notes,
        possible_prepared_position_text,
        possible_prepared_critique_text,
        model_prompt_provenance,
        extracted_position_text,
        extraction_rationale,
        extraction_method,
        review_status,
        review_notes,
        reviewed_by,
        reviewed_at,
        downstream_integration_status,
        source_visibility,
        imported_at,
        creates_prepared_draft,
        creates_candidate_item,
        creates_candidate_batch,
        live_queue_integration,
        ai_extraction_executed,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.extraction_batch_id},
        ${values.source_card_id},
        ${db.array(values.source_span_ids)},
        ${values.argument_role},
        ${values.intended_conclusion},
        ${db.array(values.key_premises)},
        ${values.argument_summary},
        ${db.array(values.implicit_assumptions)},
        ${values.critique_target},
        ${values.context_needed},
        ${values.conceptual_scope_notes},
        ${values.suitability_notes},
        ${values.possible_prepared_position_text},
        ${values.possible_prepared_critique_text},
        ${db.json(values.model_prompt_provenance)},
        ${values.extracted_position_text},
        ${values.extraction_rationale},
        ${values.extraction_method},
        ${values.review_status},
        ${values.review_notes},
        ${values.reviewed_by},
        ${values.reviewed_at},
        ${values.downstream_integration_status},
        ${values.source_visibility},
        ${values.imported_at},
        ${values.creates_prepared_draft},
        ${values.creates_candidate_item},
        ${values.creates_candidate_batch},
        ${values.live_queue_integration},
        ${values.ai_extraction_executed},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        extraction_batch_id = excluded.extraction_batch_id,
        source_card_id = excluded.source_card_id,
        source_span_ids = excluded.source_span_ids,
        argument_role = excluded.argument_role,
        intended_conclusion = excluded.intended_conclusion,
        key_premises = excluded.key_premises,
        argument_summary = excluded.argument_summary,
        implicit_assumptions = excluded.implicit_assumptions,
        critique_target = excluded.critique_target,
        context_needed = excluded.context_needed,
        conceptual_scope_notes = excluded.conceptual_scope_notes,
        suitability_notes = excluded.suitability_notes,
        possible_prepared_position_text = excluded.possible_prepared_position_text,
        possible_prepared_critique_text = excluded.possible_prepared_critique_text,
        model_prompt_provenance = excluded.model_prompt_provenance,
        extracted_position_text = excluded.extracted_position_text,
        extraction_rationale = excluded.extraction_rationale,
        extraction_method = excluded.extraction_method,
        review_status = excluded.review_status,
        review_notes = excluded.review_notes,
        reviewed_by = excluded.reviewed_by,
        reviewed_at = excluded.reviewed_at,
        downstream_integration_status = excluded.downstream_integration_status,
        source_visibility = excluded.source_visibility,
        imported_at = excluded.imported_at,
        creates_prepared_draft = excluded.creates_prepared_draft,
        creates_candidate_item = excluded.creates_candidate_item,
        creates_candidate_batch = excluded.creates_candidate_batch,
        live_queue_integration = excluded.live_queue_integration,
        ai_extraction_executed = excluded.ai_extraction_executed,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    await db`delete from argument_extraction_source_spans where argument_extraction_id = ${values.id}`;
    for (const sourceSpanLink of values.source_span_links ?? []) {
      await db`
        insert into argument_extraction_source_spans (
          argument_extraction_id,
          source_span_id,
          source_card_id,
          position_index,
          event_id,
          record_json
        )
        values (
          ${sourceSpanLink.argument_extraction_id},
          ${sourceSpanLink.source_span_id},
          ${sourceSpanLink.source_card_id},
          ${sourceSpanLink.position_index},
          ${sourceSpanLink.event_id},
          ${db.json(sourceSpanLink.record_json)}
        )
        on conflict (argument_extraction_id, source_span_id) do update set
          source_card_id = excluded.source_card_id,
          position_index = excluded.position_index,
          event_id = excluded.event_id,
          record_json = excluded.record_json
      `;
    }
  }
}

async function appendSourcePreparationWorkflowProjection(db, event) {
  const projection = sourcePreparationProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (projection.table === "prepared_drafts") {
    await db`
      insert into prepared_drafts (
        id,
        source_contribution_part_id,
        source_submission_id,
        source_argument_extraction_id,
        source_extraction_batch_id,
        source_card_id,
        source_span_ids,
        draft_type,
        prepared_text,
        prepared_source_card_content,
        candidate_rater_visible_text,
        blinding_review_status,
        source_leakage_review_status,
        gate_readiness_status,
        candidate_item_readiness,
        prepared_draft_status,
        target_prepared_draft_id,
        target_candidate_item_id,
        target_position_id,
        source_preparation_phase,
        source_preparation_review_status,
        audit_trail,
        visibility_classes,
        created_by,
        created_at,
        updated_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.source_contribution_part_id},
        ${values.source_submission_id},
        ${values.source_argument_extraction_id},
        ${values.source_extraction_batch_id},
        ${values.source_card_id},
        ${db.array(values.source_span_ids)},
        ${values.draft_type},
        ${values.prepared_text},
        ${values.prepared_source_card_content ? db.json(values.prepared_source_card_content) : null},
        ${values.candidate_rater_visible_text},
        ${values.blinding_review_status},
        ${values.source_leakage_review_status},
        ${values.gate_readiness_status},
        ${values.candidate_item_readiness},
        ${values.prepared_draft_status},
        ${values.target_prepared_draft_id},
        ${values.target_candidate_item_id},
        ${values.target_position_id},
        ${values.source_preparation_phase},
        ${values.source_preparation_review_status},
        ${db.json(values.audit_trail)},
        ${db.json(values.visibility_classes)},
        ${values.created_by},
        ${values.created_at},
        ${values.updated_at},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        source_contribution_part_id = excluded.source_contribution_part_id,
        source_submission_id = excluded.source_submission_id,
        source_argument_extraction_id = excluded.source_argument_extraction_id,
        source_extraction_batch_id = excluded.source_extraction_batch_id,
        source_card_id = excluded.source_card_id,
        source_span_ids = excluded.source_span_ids,
        draft_type = excluded.draft_type,
        prepared_text = excluded.prepared_text,
        prepared_source_card_content = excluded.prepared_source_card_content,
        candidate_rater_visible_text = excluded.candidate_rater_visible_text,
        blinding_review_status = excluded.blinding_review_status,
        source_leakage_review_status = excluded.source_leakage_review_status,
        gate_readiness_status = excluded.gate_readiness_status,
        candidate_item_readiness = excluded.candidate_item_readiness,
        prepared_draft_status = excluded.prepared_draft_status,
        target_prepared_draft_id = excluded.target_prepared_draft_id,
        target_candidate_item_id = excluded.target_candidate_item_id,
        target_position_id = excluded.target_position_id,
        source_preparation_phase = excluded.source_preparation_phase,
        source_preparation_review_status = excluded.source_preparation_review_status,
        audit_trail = excluded.audit_trail,
        visibility_classes = excluded.visibility_classes,
        created_by = excluded.created_by,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (projection.table === "review_signals") {
    await db`
      insert into review_signals (
        id,
        signal_type,
        source,
        confidence,
        explanation,
        affected_object_type,
        affected_object_id,
        reviewer_id,
        related_gate_ids,
        visibility_class,
        created_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.signal_type},
        ${values.source},
        ${values.confidence},
        ${values.explanation},
        ${values.affected_object_type},
        ${values.affected_object_id},
        ${values.reviewer_id},
        ${db.array(values.related_gate_ids)},
        ${values.visibility_class},
        ${values.created_at},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        signal_type = excluded.signal_type,
        source = excluded.source,
        confidence = excluded.confidence,
        explanation = excluded.explanation,
        affected_object_type = excluded.affected_object_type,
        affected_object_id = excluded.affected_object_id,
        reviewer_id = excluded.reviewer_id,
        related_gate_ids = excluded.related_gate_ids,
        visibility_class = excluded.visibility_class,
        created_at = excluded.created_at,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (projection.table === "gate_decisions") {
    await db`
      insert into gate_decisions (
        id,
        gate_id,
        workflow_policy_id,
        object_type,
        object_id,
        gate_status,
        decision_source,
        cited_review_signal_ids,
        decision_note,
        waiver_reason,
        reviewer_id,
        visibility_class,
        timestamp,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.gate_id},
        ${values.workflow_policy_id},
        ${values.object_type},
        ${values.object_id},
        ${values.gate_status},
        ${values.decision_source},
        ${db.array(values.cited_review_signal_ids)},
        ${values.decision_note},
        ${values.waiver_reason},
        ${values.reviewer_id},
        ${values.visibility_class},
        ${values.timestamp},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        gate_id = excluded.gate_id,
        workflow_policy_id = excluded.workflow_policy_id,
        object_type = excluded.object_type,
        object_id = excluded.object_id,
        gate_status = excluded.gate_status,
        decision_source = excluded.decision_source,
        cited_review_signal_ids = excluded.cited_review_signal_ids,
        decision_note = excluded.decision_note,
        waiver_reason = excluded.waiver_reason,
        reviewer_id = excluded.reviewer_id,
        visibility_class = excluded.visibility_class,
        timestamp = excluded.timestamp,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (projection.table === "candidate_items") {
    await db`
      insert into candidate_items (
        id,
        item_type,
        source_prepared_draft_id,
        source_contribution_part_id,
        source_argument_extraction_id,
        source_extraction_batch_id,
        source_card_id,
        source_span_ids,
        target_prepared_draft_id,
        target_candidate_item_id,
        target_position_id,
        candidate_rater_visible_text,
        candidate_source_card_content,
        candidate_item_status,
        downstream_promotion_status,
        public_release_eligibility_status,
        model_training_export_eligibility_status,
        validation_use_eligibility_status,
        hidden_benchmark_eligibility_status,
        assignment_exclusion_required,
        visibility_classes,
        created_by,
        created_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.item_type},
        ${values.source_prepared_draft_id},
        ${values.source_contribution_part_id},
        ${values.source_argument_extraction_id},
        ${values.source_extraction_batch_id},
        ${values.source_card_id},
        ${db.array(values.source_span_ids)},
        ${values.target_prepared_draft_id},
        ${values.target_candidate_item_id},
        ${values.target_position_id},
        ${values.candidate_rater_visible_text},
        ${values.candidate_source_card_content ? db.json(values.candidate_source_card_content) : null},
        ${values.candidate_item_status},
        ${values.downstream_promotion_status},
        ${values.public_release_eligibility_status},
        ${values.model_training_export_eligibility_status},
        ${values.validation_use_eligibility_status},
        ${values.hidden_benchmark_eligibility_status},
        ${values.assignment_exclusion_required},
        ${db.json(values.visibility_classes)},
        ${values.created_by},
        ${values.created_at},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        item_type = excluded.item_type,
        source_prepared_draft_id = excluded.source_prepared_draft_id,
        source_contribution_part_id = excluded.source_contribution_part_id,
        source_argument_extraction_id = excluded.source_argument_extraction_id,
        source_extraction_batch_id = excluded.source_extraction_batch_id,
        source_card_id = excluded.source_card_id,
        source_span_ids = excluded.source_span_ids,
        target_prepared_draft_id = excluded.target_prepared_draft_id,
        target_candidate_item_id = excluded.target_candidate_item_id,
        target_position_id = excluded.target_position_id,
        candidate_rater_visible_text = excluded.candidate_rater_visible_text,
        candidate_source_card_content = excluded.candidate_source_card_content,
        candidate_item_status = excluded.candidate_item_status,
        downstream_promotion_status = excluded.downstream_promotion_status,
        public_release_eligibility_status = excluded.public_release_eligibility_status,
        model_training_export_eligibility_status = excluded.model_training_export_eligibility_status,
        validation_use_eligibility_status = excluded.validation_use_eligibility_status,
        hidden_benchmark_eligibility_status = excluded.hidden_benchmark_eligibility_status,
        assignment_exclusion_required = excluded.assignment_exclusion_required,
        visibility_classes = excluded.visibility_classes,
        created_by = excluded.created_by,
        created_at = excluded.created_at,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (projection.table === "promotion_records") {
    await db`
      insert into promotion_records (
        id,
        source_prepared_draft_id,
        target_candidate_item_id,
        target_type,
        promoted_by,
        promoted_at,
        created_live_record,
        created_candidate_batch,
        audit_trail,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.source_prepared_draft_id},
        ${values.target_candidate_item_id},
        ${values.target_type},
        ${values.promoted_by},
        ${values.promoted_at},
        ${values.created_live_record},
        ${values.created_candidate_batch},
        ${db.json(values.audit_trail)},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        source_prepared_draft_id = excluded.source_prepared_draft_id,
        target_candidate_item_id = excluded.target_candidate_item_id,
        target_type = excluded.target_type,
        promoted_by = excluded.promoted_by,
        promoted_at = excluded.promoted_at,
        created_live_record = excluded.created_live_record,
        created_candidate_batch = excluded.created_candidate_batch,
        audit_trail = excluded.audit_trail,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
  }
}

async function appendRatingExperienceWorkflowProjection(db, event) {
  const projection = ratingExperienceProjectionForWorkflowEvent(event);
  if (!projection || !ratingExperienceProjectionTableNames.has(projection.table)) return;
  const { values } = projection;
  if (projection.table === "rater_instruction_compatibility_policies") {
    await db`
      insert into rater_instruction_compatibility_policies (
        id,
        release_id,
        resource_key,
        policy_version,
        covered_workflow_split_classes,
        compatible_render_classes,
        required_shared_policy_fields,
        thresholds_json,
        compatibility_rules_json,
        protected_split_merge_policy,
        sensitivity_snapshot_policy,
        lmca_source_boundary,
        artifact_status,
        artifact_json,
        event_id,
        record_json,
        frozen_at,
        created_at
      )
      values (
        ${values.id},
        ${values.release_id},
        ${values.resource_key},
        ${values.policy_version},
        ${db.array(values.covered_workflow_split_classes)},
        ${db.array(values.compatible_render_classes)},
        ${db.array(values.required_shared_policy_fields)},
        ${db.json(values.thresholds_json)},
        ${db.json(values.compatibility_rules_json)},
        ${values.protected_split_merge_policy},
        ${values.sensitivity_snapshot_policy},
        ${values.lmca_source_boundary},
        ${values.artifact_status},
        ${db.json(values.artifact_json)},
        ${values.event_id},
        ${db.json(values.record_json)},
        coalesce(${values.frozen_at}::timestamptz, now()),
        coalesce(${values.created_at}::timestamptz, now())
      )
      on conflict (id) do update set
        release_id = excluded.release_id,
        resource_key = excluded.resource_key,
        policy_version = excluded.policy_version,
        covered_workflow_split_classes = excluded.covered_workflow_split_classes,
        compatible_render_classes = excluded.compatible_render_classes,
        required_shared_policy_fields = excluded.required_shared_policy_fields,
        thresholds_json = excluded.thresholds_json,
        compatibility_rules_json = excluded.compatibility_rules_json,
        protected_split_merge_policy = excluded.protected_split_merge_policy,
        sensitivity_snapshot_policy = excluded.sensitivity_snapshot_policy,
        lmca_source_boundary = excluded.lmca_source_boundary,
        artifact_status = excluded.artifact_status,
        artifact_json = excluded.artifact_json,
        event_id = excluded.event_id,
        record_json = excluded.record_json,
        frozen_at = excluded.frozen_at,
        created_at = excluded.created_at
    `;
    return;
  }
  if (projection.table === "rater_instruction_render_versions") {
    await db`
      insert into rater_instruction_render_versions (
        id,
        release_id,
        resource_key,
        rubric_version,
        workflow_profile_id,
        rendered_rubric_anchor_checksum,
        score_input_policy_id,
        ux_simplification_policy_id,
        score_control_mode,
        score_default_policy,
        workflow_banner_text_version,
        issue_panel_copy_version,
        pre_submit_assist_policy_id,
        rubric_lint_config_id,
        accessibility_visual_variant,
        ui_experiment_policy_id,
        rater_instruction_compatibility_policy_id,
        render_compatibility_class,
        compatibility_evidence_status,
        protected_split_eligibility_policy,
        sensitivity_snapshot_policy,
        artifact_status,
        artifact_json,
        event_id,
        record_json,
        frozen_at,
        created_at
      )
      values (
        ${values.id},
        ${values.release_id},
        ${values.resource_key},
        ${values.rubric_version},
        ${values.workflow_profile_id},
        ${values.rendered_rubric_anchor_checksum},
        ${values.score_input_policy_id},
        ${values.ux_simplification_policy_id},
        ${values.score_control_mode},
        ${values.score_default_policy},
        ${values.workflow_banner_text_version},
        ${values.issue_panel_copy_version},
        ${values.pre_submit_assist_policy_id},
        ${values.rubric_lint_config_id},
        ${values.accessibility_visual_variant},
        ${values.ui_experiment_policy_id},
        ${values.rater_instruction_compatibility_policy_id},
        ${values.render_compatibility_class},
        ${values.compatibility_evidence_status},
        ${values.protected_split_eligibility_policy},
        ${values.sensitivity_snapshot_policy},
        ${values.artifact_status},
        ${db.json(values.artifact_json)},
        ${values.event_id},
        ${db.json(values.record_json)},
        coalesce(${values.frozen_at}::timestamptz, now()),
        coalesce(${values.created_at}::timestamptz, now())
      )
      on conflict (id) do update set
        release_id = excluded.release_id,
        resource_key = excluded.resource_key,
        rubric_version = excluded.rubric_version,
        workflow_profile_id = excluded.workflow_profile_id,
        rendered_rubric_anchor_checksum = excluded.rendered_rubric_anchor_checksum,
        score_input_policy_id = excluded.score_input_policy_id,
        ux_simplification_policy_id = excluded.ux_simplification_policy_id,
        score_control_mode = excluded.score_control_mode,
        score_default_policy = excluded.score_default_policy,
        workflow_banner_text_version = excluded.workflow_banner_text_version,
        issue_panel_copy_version = excluded.issue_panel_copy_version,
        pre_submit_assist_policy_id = excluded.pre_submit_assist_policy_id,
        rubric_lint_config_id = excluded.rubric_lint_config_id,
        accessibility_visual_variant = excluded.accessibility_visual_variant,
        ui_experiment_policy_id = excluded.ui_experiment_policy_id,
        rater_instruction_compatibility_policy_id = excluded.rater_instruction_compatibility_policy_id,
        render_compatibility_class = excluded.render_compatibility_class,
        compatibility_evidence_status = excluded.compatibility_evidence_status,
        protected_split_eligibility_policy = excluded.protected_split_eligibility_policy,
        sensitivity_snapshot_policy = excluded.sensitivity_snapshot_policy,
        artifact_status = excluded.artifact_status,
        artifact_json = excluded.artifact_json,
        event_id = excluded.event_id,
        record_json = excluded.record_json,
        frozen_at = excluded.frozen_at,
        created_at = excluded.created_at
    `;
    return;
  }
  if (projection.table === "rubric_copy_traceability_maps") {
    await db`
      insert into rubric_copy_traceability_maps (
        id,
        release_id,
        resource_key,
        map_version,
        rubric_version,
        copy_bundle_id,
        covered_screen_ids,
        simplified_copy_entry_ids,
        mapped_rubric_clause_ids,
        semantic_drift_test_ids,
        clause_map_json,
        semantic_drift_test_status,
        appendix_f_anchor_access,
        hidden_field_leakage_check,
        release_critical_use_status,
        release_config_manifest_id,
        reviewer_id,
        reviewed_at,
        frozen_at,
        artifact_status,
        artifact_json,
        event_id,
        record_json,
        created_at
      )
      values (
        ${values.id},
        ${values.release_id},
        ${values.resource_key},
        ${values.map_version},
        ${values.rubric_version},
        ${values.copy_bundle_id},
        ${db.array(values.covered_screen_ids)},
        ${db.array(values.simplified_copy_entry_ids)},
        ${db.array(values.mapped_rubric_clause_ids)},
        ${db.array(values.semantic_drift_test_ids)},
        ${db.json(values.clause_map_json)},
        ${values.semantic_drift_test_status},
        ${values.appendix_f_anchor_access},
        ${values.hidden_field_leakage_check},
        ${values.release_critical_use_status},
        ${values.release_config_manifest_id},
        ${values.reviewer_id},
        coalesce(${values.reviewed_at}::timestamptz, now()),
        coalesce(${values.frozen_at}::timestamptz, now()),
        ${values.artifact_status},
        ${db.json(values.artifact_json)},
        ${values.event_id},
        ${db.json(values.record_json)},
        coalesce(${values.created_at}::timestamptz, now())
      )
      on conflict (id) do update set
        release_id = excluded.release_id,
        resource_key = excluded.resource_key,
        map_version = excluded.map_version,
        rubric_version = excluded.rubric_version,
        copy_bundle_id = excluded.copy_bundle_id,
        covered_screen_ids = excluded.covered_screen_ids,
        simplified_copy_entry_ids = excluded.simplified_copy_entry_ids,
        mapped_rubric_clause_ids = excluded.mapped_rubric_clause_ids,
        semantic_drift_test_ids = excluded.semantic_drift_test_ids,
        clause_map_json = excluded.clause_map_json,
        semantic_drift_test_status = excluded.semantic_drift_test_status,
        appendix_f_anchor_access = excluded.appendix_f_anchor_access,
        hidden_field_leakage_check = excluded.hidden_field_leakage_check,
        release_critical_use_status = excluded.release_critical_use_status,
        release_config_manifest_id = excluded.release_config_manifest_id,
        reviewer_id = excluded.reviewer_id,
        reviewed_at = excluded.reviewed_at,
        frozen_at = excluded.frozen_at,
        artifact_status = excluded.artifact_status,
        artifact_json = excluded.artifact_json,
        event_id = excluded.event_id,
        record_json = excluded.record_json,
        created_at = excluded.created_at
    `;
    return;
  }
  await db`
    insert into rater_instruction_comprehension_audits (
      id,
      release_id,
      resource_key,
      audit_version,
      rater_instruction_render_version_id,
      rater_instruction_compatibility_policy_id,
      rubric_copy_traceability_map_id,
      covered_screen_ids,
      comprehension_methods,
      comprehension_check_ids,
      glossary_term_ids,
      disclosure_depths,
      clause_traceability_review_status,
      screen_copy_mapping_review_status,
      comprehension_test_status,
      semantic_drift_blocker,
      no_feature_loss_blocker,
      protected_leakage_review_passed,
      excluded_from_score_computation,
      excluded_from_independent_blind_denominator,
      source_boundary,
      reviewer_id,
      frozen_at,
      artifact_status,
      artifact_json,
      event_id,
      record_json,
      created_at
    )
    values (
      ${values.id},
      ${values.release_id},
      ${values.resource_key},
      ${values.audit_version},
      ${values.rater_instruction_render_version_id},
      ${values.rater_instruction_compatibility_policy_id},
      ${values.rubric_copy_traceability_map_id},
      ${db.array(values.covered_screen_ids)},
      ${db.array(values.comprehension_methods)},
      ${db.array(values.comprehension_check_ids)},
      ${db.array(values.glossary_term_ids)},
      ${db.array(values.disclosure_depths)},
      ${values.clause_traceability_review_status},
      ${values.screen_copy_mapping_review_status},
      ${values.comprehension_test_status},
      ${values.semantic_drift_blocker},
      ${values.no_feature_loss_blocker},
      ${values.protected_leakage_review_passed},
      ${values.excluded_from_score_computation},
      ${values.excluded_from_independent_blind_denominator},
      ${values.source_boundary},
      ${values.reviewer_id},
      coalesce(${values.frozen_at}::timestamptz, now()),
      ${values.artifact_status},
      ${db.json(values.artifact_json)},
      ${values.event_id},
      ${db.json(values.record_json)},
      coalesce(${values.created_at}::timestamptz, now())
    )
    on conflict (id) do update set
      release_id = excluded.release_id,
      resource_key = excluded.resource_key,
      audit_version = excluded.audit_version,
      rater_instruction_render_version_id = excluded.rater_instruction_render_version_id,
      rater_instruction_compatibility_policy_id = excluded.rater_instruction_compatibility_policy_id,
      rubric_copy_traceability_map_id = excluded.rubric_copy_traceability_map_id,
      covered_screen_ids = excluded.covered_screen_ids,
      comprehension_methods = excluded.comprehension_methods,
      comprehension_check_ids = excluded.comprehension_check_ids,
      glossary_term_ids = excluded.glossary_term_ids,
      disclosure_depths = excluded.disclosure_depths,
      clause_traceability_review_status = excluded.clause_traceability_review_status,
      screen_copy_mapping_review_status = excluded.screen_copy_mapping_review_status,
      comprehension_test_status = excluded.comprehension_test_status,
      semantic_drift_blocker = excluded.semantic_drift_blocker,
      no_feature_loss_blocker = excluded.no_feature_loss_blocker,
      protected_leakage_review_passed = excluded.protected_leakage_review_passed,
      excluded_from_score_computation = excluded.excluded_from_score_computation,
      excluded_from_independent_blind_denominator = excluded.excluded_from_independent_blind_denominator,
      source_boundary = excluded.source_boundary,
      reviewer_id = excluded.reviewer_id,
      frozen_at = excluded.frozen_at,
      artifact_status = excluded.artifact_status,
      artifact_json = excluded.artifact_json,
      event_id = excluded.event_id,
      record_json = excluded.record_json,
      created_at = excluded.created_at
  `;
}

async function appendInteractionUxWorkflowProjection(db, event) {
  const projection = interactionUxProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (!interactionUxProjectionTableNames.has(projection.table)) return;
  const table = db(projection.table);
  await db`
    insert into ${table} (
      id,
      release_id,
      resource_key,
      assignment_id,
      rating_id,
      rater_id,
      item_id,
      position_id,
      critique_id,
      policy_id,
      screen_id,
      issue_id,
      practice_session_id,
      action_kind,
      workflow_status,
      visibility_class,
      protected_label_visibility_state,
      hidden_metadata_leakage_check,
      artifact_status,
      input_hash,
      artifact_json,
      event_id,
      record_json,
      created_at
    )
    values (
      ${values.id},
      ${values.release_id},
      ${values.resource_key},
      ${values.assignment_id},
      ${values.rating_id},
      ${values.rater_id},
      ${values.item_id},
      ${values.position_id},
      ${values.critique_id},
      ${values.policy_id},
      ${values.screen_id},
      ${values.issue_id},
      ${values.practice_session_id},
      ${values.action_kind},
      ${values.workflow_status},
      ${values.visibility_class},
      ${values.protected_label_visibility_state},
      ${values.hidden_metadata_leakage_check},
      ${values.artifact_status},
      ${values.input_hash},
      ${db.json(values.artifact_json)},
      ${values.event_id},
      ${db.json(values.record_json)},
      coalesce(${values.created_at}::timestamptz, now())
    )
    on conflict (id) do update set
      release_id = excluded.release_id,
      resource_key = excluded.resource_key,
      assignment_id = excluded.assignment_id,
      rating_id = excluded.rating_id,
      rater_id = excluded.rater_id,
      item_id = excluded.item_id,
      position_id = excluded.position_id,
      critique_id = excluded.critique_id,
      policy_id = excluded.policy_id,
      screen_id = excluded.screen_id,
      issue_id = excluded.issue_id,
      practice_session_id = excluded.practice_session_id,
      action_kind = excluded.action_kind,
      workflow_status = excluded.workflow_status,
      visibility_class = excluded.visibility_class,
      protected_label_visibility_state = excluded.protected_label_visibility_state,
      hidden_metadata_leakage_check = excluded.hidden_metadata_leakage_check,
      artifact_status = excluded.artifact_status,
      input_hash = excluded.input_hash,
      artifact_json = excluded.artifact_json,
      event_id = excluded.event_id,
      record_json = excluded.record_json,
      created_at = excluded.created_at
  `;
}

async function appendMetricGovernanceWorkflowProjection(db, event) {
  const projection = metricGovernanceProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (!metricGovernanceProjectionTableNames.has(projection.table)) return;
  const table = db(projection.table);
  await db`
    insert into ${table} (
      id,
      release_id,
      resource_key,
      target_label_snapshot_id,
      metric_config_id,
      derived_utility_formula_id,
      pairwise_comparison_snapshot_id,
      release_config_manifest_id,
      protected_artifact_id,
      metric_family,
      metric_version,
      formula_name,
      formula_version,
      action_kind,
      policy_action_kind,
      policy_decision_id,
      policy_decision_consumption_id,
      affected_artifact_ids,
      approval_status,
      workflow_status,
      visibility_class,
      input_hash,
      artifact_json,
      event_id,
      record_json,
      created_at
    )
    values (
      ${values.id},
      ${values.release_id},
      ${values.resource_key},
      ${values.target_label_snapshot_id},
      ${values.metric_config_id},
      ${values.derived_utility_formula_id},
      ${values.pairwise_comparison_snapshot_id},
      ${values.release_config_manifest_id},
      ${values.protected_artifact_id},
      ${values.metric_family},
      ${values.metric_version},
      ${values.formula_name},
      ${values.formula_version},
      ${values.action_kind},
      ${values.policy_action_kind},
      ${values.policy_decision_id},
      ${values.policy_decision_consumption_id},
      ${values.affected_artifact_ids},
      ${values.approval_status},
      ${values.workflow_status},
      ${values.visibility_class},
      ${values.input_hash},
      ${db.json(values.artifact_json)},
      ${values.event_id},
      ${db.json(values.record_json)},
      coalesce(${values.created_at}::timestamptz, now())
    )
    on conflict (id) do update set
      release_id = excluded.release_id,
      resource_key = excluded.resource_key,
      target_label_snapshot_id = excluded.target_label_snapshot_id,
      metric_config_id = excluded.metric_config_id,
      derived_utility_formula_id = excluded.derived_utility_formula_id,
      pairwise_comparison_snapshot_id = excluded.pairwise_comparison_snapshot_id,
      release_config_manifest_id = excluded.release_config_manifest_id,
      protected_artifact_id = excluded.protected_artifact_id,
      metric_family = excluded.metric_family,
      metric_version = excluded.metric_version,
      formula_name = excluded.formula_name,
      formula_version = excluded.formula_version,
      action_kind = excluded.action_kind,
      policy_action_kind = excluded.policy_action_kind,
      policy_decision_id = excluded.policy_decision_id,
      policy_decision_consumption_id = excluded.policy_decision_consumption_id,
      affected_artifact_ids = excluded.affected_artifact_ids,
      approval_status = excluded.approval_status,
      workflow_status = excluded.workflow_status,
      visibility_class = excluded.visibility_class,
      input_hash = excluded.input_hash,
      artifact_json = excluded.artifact_json,
      event_id = excluded.event_id,
      record_json = excluded.record_json,
      created_at = excluded.created_at
  `;
}

async function appendReleaseArtifactWorkflowProjection(db, event) {
  const projection = releaseArtifactProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (projection.table === "label_snapshots") {
    await db`
      insert into label_snapshots (
        id,
        release_id,
        target_label_version,
        input_hash,
        snapshot_json,
        created_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.release_id},
        ${values.target_label_version},
        ${values.input_hash},
        ${db.json(values.snapshot_json)},
        coalesce(${values.created_at}::timestamptz, now()),
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do nothing
    `;
    return;
  }
  if (projection.table === "release_reports") {
    await db`
      insert into release_reports (
        id,
        release_id,
        input_hash,
        report_json,
        created_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.release_id},
        ${values.input_hash},
        ${db.json(values.report_json)},
        coalesce(${values.created_at}::timestamptz, now()),
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do nothing
    `;
  }
}

async function appendReleaseConfigWorkflowProjection(db, event) {
  const projection = releaseConfigProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (!releaseConfigProjectionTableNames.has(projection.table)) return;
  const table = db(projection.table);
  await db`
    insert into ${table} (
      id,
      release_id,
      resource_key,
      release_version,
      release_gate_profile_id,
      phase_gate_bundle_id,
      phase_gate_bundle_hash,
      release_config_manifest_id,
      governed_bundle_id,
      governed_bundle_family,
      canonicalization_profile_id,
      artifact_status,
      input_hash,
      artifact_json,
      event_id,
      record_json,
      created_at
    )
    values (
      ${values.id},
      ${values.release_id},
      ${values.resource_key},
      ${values.release_version},
      ${values.release_gate_profile_id},
      ${values.phase_gate_bundle_id},
      ${values.phase_gate_bundle_hash},
      ${values.release_config_manifest_id},
      ${values.governed_bundle_id},
      ${values.governed_bundle_family},
      ${values.canonicalization_profile_id},
      ${values.artifact_status},
      ${values.input_hash},
      ${db.json(values.artifact_json)},
      ${values.event_id},
      ${db.json(values.record_json)},
      coalesce(${values.created_at}::timestamptz, now())
    )
    on conflict (id) do update set
      release_id = excluded.release_id,
      resource_key = excluded.resource_key,
      release_version = excluded.release_version,
      release_gate_profile_id = excluded.release_gate_profile_id,
      phase_gate_bundle_id = excluded.phase_gate_bundle_id,
      phase_gate_bundle_hash = excluded.phase_gate_bundle_hash,
      release_config_manifest_id = excluded.release_config_manifest_id,
      governed_bundle_id = excluded.governed_bundle_id,
      governed_bundle_family = excluded.governed_bundle_family,
      canonicalization_profile_id = excluded.canonicalization_profile_id,
      artifact_status = excluded.artifact_status,
      input_hash = excluded.input_hash,
      artifact_json = excluded.artifact_json,
      event_id = excluded.event_id,
      record_json = excluded.record_json,
      created_at = excluded.created_at
  `;
}

async function appendMetaphilosophyWorkflowProjection(db, event) {
  const projection = metaphilosophyProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (!metaphilosophyProjectionTableNames.has(projection.table)) return;
  const table = db(projection.table);
  await db`
    insert into ${table} (
      id,
      release_id,
      resource_key,
      architecture_layer_id,
      track_id,
      lmca_relationship,
      experiment_type,
      release_gate_status,
      release_claim_role,
      boundary_rule,
      direct_requirement,
      pilot_evidence_requirement,
      promotion_governance,
      artifact_status,
      input_hash,
      artifact_json,
      event_id,
      record_json,
      created_at
    )
    values (
      ${values.id},
      ${values.release_id},
      ${values.resource_key},
      ${values.architecture_layer_id},
      ${values.track_id},
      ${values.lmca_relationship},
      ${values.experiment_type},
      ${values.release_gate_status},
      ${values.release_claim_role},
      ${values.boundary_rule},
      ${values.direct_requirement},
      ${values.pilot_evidence_requirement},
      ${values.promotion_governance},
      ${values.artifact_status},
      ${values.input_hash},
      ${db.json(values.artifact_json)},
      ${values.event_id},
      ${db.json(values.record_json)},
      coalesce(${values.created_at}::timestamptz, now())
    )
    on conflict (id) do update set
      release_id = excluded.release_id,
      resource_key = excluded.resource_key,
      architecture_layer_id = excluded.architecture_layer_id,
      track_id = excluded.track_id,
      lmca_relationship = excluded.lmca_relationship,
      experiment_type = excluded.experiment_type,
      release_gate_status = excluded.release_gate_status,
      release_claim_role = excluded.release_claim_role,
      boundary_rule = excluded.boundary_rule,
      direct_requirement = excluded.direct_requirement,
      pilot_evidence_requirement = excluded.pilot_evidence_requirement,
      promotion_governance = excluded.promotion_governance,
      artifact_status = excluded.artifact_status,
      input_hash = excluded.input_hash,
      artifact_json = excluded.artifact_json,
      event_id = excluded.event_id,
      record_json = excluded.record_json,
      created_at = excluded.created_at
  `;
}

async function appendDiscussionAdjudicationWorkflowProjection(db, event) {
  const projection = discussionAdjudicationProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (!discussionAdjudicationProjectionTableNames.has(projection.table)) return;
  const table = db(projection.table);
  await db`
    insert into ${table} (
      id,
      release_id,
      resource_key,
      item_id,
      position_id,
      critique_id,
      discussion_thread_id,
      adjudication_id,
      workflow_status,
      visibility_class,
      artifact_json,
      event_id,
      record_json,
      created_at
    )
    values (
      ${values.id},
      ${values.release_id},
      ${values.resource_key},
      ${values.item_id},
      ${values.position_id},
      ${values.critique_id},
      ${values.discussion_thread_id},
      ${values.adjudication_id},
      ${values.workflow_status},
      ${values.visibility_class},
      ${db.json(values.artifact_json)},
      ${values.event_id},
      ${db.json(values.record_json)},
      coalesce(${values.created_at}::timestamptz, now())
    )
    on conflict (id) do update set
      release_id = excluded.release_id,
      resource_key = excluded.resource_key,
      item_id = excluded.item_id,
      position_id = excluded.position_id,
      critique_id = excluded.critique_id,
      discussion_thread_id = excluded.discussion_thread_id,
      adjudication_id = excluded.adjudication_id,
      workflow_status = excluded.workflow_status,
      visibility_class = excluded.visibility_class,
      artifact_json = excluded.artifact_json,
      event_id = excluded.event_id,
      record_json = excluded.record_json,
      created_at = excluded.created_at
  `;
}

async function appendVerificationAdjudicationWorkflowProjection(db, event) {
  const projection = verificationAdjudicationProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (!verificationAdjudicationProjectionTableNames.has(projection.table)) return;
  const table = db(projection.table);
  await db`
    insert into ${table} (
      id,
      release_id,
      resource_key,
      item_id,
      position_id,
      critique_id,
      rating_id,
      rater_id,
      policy_id,
      verification_record_id,
      verification_workspace_id,
      interpretation_target_map_id,
      adjudication_id,
      discussion_thread_id,
      adjudication_memo_id,
      workflow_status,
      visibility_class,
      source_exposure_status,
      protected_content_status,
      model_assistance_status,
      nonblind_evidence_flag,
      source_assisted_flag,
      artifact_status,
      input_hash,
      artifact_json,
      event_id,
      record_json,
      created_at
    )
    values (
      ${values.id},
      ${values.release_id},
      ${values.resource_key},
      ${values.item_id},
      ${values.position_id},
      ${values.critique_id},
      ${values.rating_id},
      ${values.rater_id},
      ${values.policy_id},
      ${values.verification_record_id},
      ${values.verification_workspace_id},
      ${values.interpretation_target_map_id},
      ${values.adjudication_id},
      ${values.discussion_thread_id},
      ${values.adjudication_memo_id},
      ${values.workflow_status},
      ${values.visibility_class},
      ${values.source_exposure_status},
      ${values.protected_content_status},
      ${values.model_assistance_status},
      ${values.nonblind_evidence_flag},
      ${values.source_assisted_flag},
      ${values.artifact_status},
      ${values.input_hash},
      ${db.json(values.artifact_json)},
      ${values.event_id},
      ${db.json(values.record_json)},
      coalesce(${values.created_at}::timestamptz, now())
    )
    on conflict (id) do update set
      release_id = excluded.release_id,
      resource_key = excluded.resource_key,
      item_id = excluded.item_id,
      position_id = excluded.position_id,
      critique_id = excluded.critique_id,
      rating_id = excluded.rating_id,
      rater_id = excluded.rater_id,
      policy_id = excluded.policy_id,
      verification_record_id = excluded.verification_record_id,
      verification_workspace_id = excluded.verification_workspace_id,
      interpretation_target_map_id = excluded.interpretation_target_map_id,
      adjudication_id = excluded.adjudication_id,
      discussion_thread_id = excluded.discussion_thread_id,
      adjudication_memo_id = excluded.adjudication_memo_id,
      workflow_status = excluded.workflow_status,
      visibility_class = excluded.visibility_class,
      source_exposure_status = excluded.source_exposure_status,
      protected_content_status = excluded.protected_content_status,
      model_assistance_status = excluded.model_assistance_status,
      nonblind_evidence_flag = excluded.nonblind_evidence_flag,
      source_assisted_flag = excluded.source_assisted_flag,
      artifact_status = excluded.artifact_status,
      input_hash = excluded.input_hash,
      artifact_json = excluded.artifact_json,
      event_id = excluded.event_id,
      record_json = excluded.record_json,
      created_at = excluded.created_at
  `;
}

async function appendReleaseReadinessWorkflowProjection(db, event) {
  const projection = releaseReadinessProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (!releaseReadinessProjectionTableNames.has(projection.table)) return;
  const table = db(projection.table);
  await db`
    insert into ${table} (
      id,
      release_id,
      resource_key,
      item_id,
      position_id,
      critique_id,
      policy_id,
      target_label_snapshot_id,
      split_name,
      release_gate_profile_id,
      evaluation_run_id,
      artifact_status,
      visibility_class,
      input_hash,
      artifact_json,
      event_id,
      record_json,
      created_at
    )
    values (
      ${values.id},
      ${values.release_id},
      ${values.resource_key},
      ${values.item_id},
      ${values.position_id},
      ${values.critique_id},
      ${values.policy_id},
      ${values.target_label_snapshot_id},
      ${values.split_name},
      ${values.release_gate_profile_id},
      ${values.evaluation_run_id},
      ${values.artifact_status},
      ${values.visibility_class},
      ${values.input_hash},
      ${db.json(values.artifact_json)},
      ${values.event_id},
      ${db.json(values.record_json)},
      coalesce(${values.created_at}::timestamptz, now())
    )
    on conflict (id) do update set
      release_id = excluded.release_id,
      resource_key = excluded.resource_key,
      item_id = excluded.item_id,
      position_id = excluded.position_id,
      critique_id = excluded.critique_id,
      policy_id = excluded.policy_id,
      target_label_snapshot_id = excluded.target_label_snapshot_id,
      split_name = excluded.split_name,
      release_gate_profile_id = excluded.release_gate_profile_id,
      evaluation_run_id = excluded.evaluation_run_id,
      artifact_status = excluded.artifact_status,
      visibility_class = excluded.visibility_class,
      input_hash = excluded.input_hash,
      artifact_json = excluded.artifact_json,
      event_id = excluded.event_id,
      record_json = excluded.record_json,
      created_at = excluded.created_at
  `;
}

async function appendSafeguardAuxiliaryWorkflowProjection(db, event) {
  const projection = safeguardAuxiliaryProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (!safeguardAuxiliaryProjectionTableNames.has(projection.table)) return;
  const table = db(projection.table);
  await db`
    insert into ${table} (
      id,
      release_id,
      resource_key,
      assignment_id,
      rating_id,
      item_id,
      position_id,
      critique_id,
      policy_id,
      artifact_status,
      visibility_class,
      input_hash,
      artifact_json,
      event_id,
      record_json,
      created_at
    )
    values (
      ${values.id},
      ${values.release_id},
      ${values.resource_key},
      ${values.assignment_id},
      ${values.rating_id},
      ${values.item_id},
      ${values.position_id},
      ${values.critique_id},
      ${values.policy_id},
      ${values.artifact_status},
      ${values.visibility_class},
      ${values.input_hash},
      ${db.json(values.artifact_json)},
      ${values.event_id},
      ${db.json(values.record_json)},
      coalesce(${values.created_at}::timestamptz, now())
    )
    on conflict (id) do update set
      release_id = excluded.release_id,
      resource_key = excluded.resource_key,
      assignment_id = excluded.assignment_id,
      rating_id = excluded.rating_id,
      item_id = excluded.item_id,
      position_id = excluded.position_id,
      critique_id = excluded.critique_id,
      policy_id = excluded.policy_id,
      artifact_status = excluded.artifact_status,
      visibility_class = excluded.visibility_class,
      input_hash = excluded.input_hash,
      artifact_json = excluded.artifact_json,
      event_id = excluded.event_id,
      record_json = excluded.record_json,
      created_at = excluded.created_at
  `;
}

async function appendWorkflowStateTransitionProjection(db, event) {
  const projection = workflowStateTransitionProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  await db`
    insert into workflow_state_transition_logs (
      id,
      entity_type,
      entity_id,
      assignment_id,
      prior_state,
      requested_next_state,
      accepted_next_state,
      actor_id,
      actor_role,
      guard_checks,
      failed_guard_reasons,
      lock_freeze_artifact_ids,
      source_tag_protected_visibility_state,
      transition_status,
      timestamp,
      event_type,
      event_id,
      payload_hash,
      actor_hash,
      received_at,
      record_json
    )
    values (
      ${values.id},
      ${values.entity_type},
      ${values.entity_id},
      ${values.assignment_id},
      ${values.prior_state},
      ${values.requested_next_state},
      ${values.accepted_next_state},
      ${values.actor_id},
      ${values.actor_role},
      ${db.json(values.guard_checks)},
      ${db.json(values.failed_guard_reasons)},
      ${db.json(values.lock_freeze_artifact_ids)},
      ${values.source_tag_protected_visibility_state},
      ${values.transition_status},
      ${values.timestamp},
      ${values.event_type},
      ${values.event_id},
      ${values.payload_hash},
      ${values.actor_hash},
      ${values.received_at},
      ${db.json(values.record_json)}
    )
    on conflict (id) do nothing
  `;
}

async function appendOperationalControlWorkflowProjection(db, event) {
  const projection = operationalControlProjectionForWorkflowEvent(event);
  if (!projection) return;
  const { values } = projection;
  if (projection.table === "policy_action_kinds") {
    await db`
      insert into policy_action_kinds (
        id,
        action_kind,
        requires_current_decision,
        requires_manifest_binding,
        requires_actor_binding,
        requires_output_schema_binding,
        requires_phase_gate_binding,
        requires_idempotency_binding,
        replay_protection,
        wrong_scope_behavior,
        activated_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.action_kind},
        ${values.requires_current_decision},
        ${values.requires_manifest_binding},
        ${values.requires_actor_binding},
        ${values.requires_output_schema_binding},
        ${values.requires_phase_gate_binding},
        ${values.requires_idempotency_binding},
        ${values.replay_protection},
        ${values.wrong_scope_behavior},
        ${values.activated_at},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        action_kind = excluded.action_kind,
        requires_current_decision = excluded.requires_current_decision,
        requires_manifest_binding = excluded.requires_manifest_binding,
        requires_actor_binding = excluded.requires_actor_binding,
        requires_output_schema_binding = excluded.requires_output_schema_binding,
        requires_phase_gate_binding = excluded.requires_phase_gate_binding,
        requires_idempotency_binding = excluded.requires_idempotency_binding,
        replay_protection = excluded.replay_protection,
        wrong_scope_behavior = excluded.wrong_scope_behavior,
        activated_at = excluded.activated_at,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (projection.table === "policy_decisions") {
    await db`
      insert into policy_decisions (
        id,
        action_kind_id,
        action_kind,
        decision_status,
        actor_id,
        actor_role,
        manifest_id,
        manifest_hash,
        phase_gate_bundle_id,
        phase_gate_bundle_hash,
        release_id,
        output_schema_version,
        output_schema_hash,
        target_artifact_ids,
        idempotency_key,
        single_use,
        replay_status,
        manifest_binding_status,
        output_schema_binding_status,
        phase_gate_binding_status,
        idempotency_binding_status,
        expires_at,
        decided_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.action_kind_id},
        ${values.action_kind},
        ${values.decision_status},
        ${values.actor_id},
        ${values.actor_role},
        ${values.manifest_id},
        ${values.manifest_hash},
        ${values.phase_gate_bundle_id},
        ${values.phase_gate_bundle_hash},
        ${values.release_id},
        ${values.output_schema_version},
        ${values.output_schema_hash},
        ${db.json(values.target_artifact_ids)},
        ${values.idempotency_key},
        ${values.single_use},
        ${values.replay_status},
        ${values.manifest_binding_status},
        ${values.output_schema_binding_status},
        ${values.phase_gate_binding_status},
        ${values.idempotency_binding_status},
        ${values.expires_at},
        ${values.decided_at},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        action_kind_id = excluded.action_kind_id,
        action_kind = excluded.action_kind,
        decision_status = excluded.decision_status,
        actor_id = excluded.actor_id,
        actor_role = excluded.actor_role,
        manifest_id = excluded.manifest_id,
        manifest_hash = excluded.manifest_hash,
        phase_gate_bundle_id = excluded.phase_gate_bundle_id,
        phase_gate_bundle_hash = excluded.phase_gate_bundle_hash,
        release_id = excluded.release_id,
        output_schema_version = excluded.output_schema_version,
        output_schema_hash = excluded.output_schema_hash,
        target_artifact_ids = excluded.target_artifact_ids,
        idempotency_key = excluded.idempotency_key,
        single_use = excluded.single_use,
        replay_status = excluded.replay_status,
        manifest_binding_status = excluded.manifest_binding_status,
        output_schema_binding_status = excluded.output_schema_binding_status,
        phase_gate_binding_status = excluded.phase_gate_binding_status,
        idempotency_binding_status = excluded.idempotency_binding_status,
        expires_at = excluded.expires_at,
        decided_at = excluded.decided_at,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (projection.table === "policy_decision_consumptions") {
    await db`
      insert into policy_decision_consumptions (
        id,
        decision_id,
        action_kind,
        manifest_id,
        manifest_hash,
        phase_gate_bundle_id,
        phase_gate_bundle_hash,
        output_schema_version,
        output_schema_hash,
        idempotency_key,
        replay_rejected,
        scope_matched,
        consumed_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.decision_id},
        ${values.action_kind},
        ${values.manifest_id},
        ${values.manifest_hash},
        ${values.phase_gate_bundle_id},
        ${values.phase_gate_bundle_hash},
        ${values.output_schema_version},
        ${values.output_schema_hash},
        ${values.idempotency_key},
        ${values.replay_rejected},
        ${values.scope_matched},
        ${values.consumed_at},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        decision_id = excluded.decision_id,
        action_kind = excluded.action_kind,
        manifest_id = excluded.manifest_id,
        manifest_hash = excluded.manifest_hash,
        phase_gate_bundle_id = excluded.phase_gate_bundle_id,
        phase_gate_bundle_hash = excluded.phase_gate_bundle_hash,
        output_schema_version = excluded.output_schema_version,
        output_schema_hash = excluded.output_schema_hash,
        idempotency_key = excluded.idempotency_key,
        replay_rejected = excluded.replay_rejected,
        scope_matched = excluded.scope_matched,
        consumed_at = excluded.consumed_at,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (projection.table === "implementation_phase_gate_bundles") {
    await db`
      insert into implementation_phase_gate_bundles (
        id,
        release_id,
        manifest_id,
        version,
        future_phase_default,
        broadening_requires_manifest_activation,
        frozen_at,
        event_id,
        record_json
      )
      values (
        ${values.id},
        ${values.release_id},
        ${values.manifest_id},
        ${values.version},
        ${values.future_phase_default},
        ${values.broadening_requires_manifest_activation},
        ${values.frozen_at},
        ${values.event_id},
        ${db.json(values.record_json)}
      )
      on conflict (id) do update set
        release_id = excluded.release_id,
        manifest_id = excluded.manifest_id,
        version = excluded.version,
        future_phase_default = excluded.future_phase_default,
        broadening_requires_manifest_activation = excluded.broadening_requires_manifest_activation,
        frozen_at = excluded.frozen_at,
        event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    await db`delete from implementation_phase_gate_lanes where bundle_id = ${values.id}`;
    for (const laneRow of values.lane_rows ?? []) {
      await db`
        insert into implementation_phase_gate_lanes (
          bundle_id,
          lane_kind,
          phase_state,
          allowed_action_kinds,
          required_feature_flags,
          unavailable_response_class,
          rollout_owner,
          fail_closed,
          no_side_effects_when_disabled,
          labels_exposed_when_disabled,
          supports_release_claims_when_disabled,
          position_index,
          event_id,
          record_json
        )
        values (
          ${laneRow.bundle_id},
          ${laneRow.lane_kind},
          ${laneRow.phase_state},
          ${db.json(laneRow.allowed_action_kinds)},
          ${db.json(laneRow.required_feature_flags)},
          ${laneRow.unavailable_response_class},
          ${laneRow.rollout_owner},
          ${laneRow.fail_closed},
          ${laneRow.no_side_effects_when_disabled},
          ${laneRow.labels_exposed_when_disabled},
          ${laneRow.supports_release_claims_when_disabled},
          ${laneRow.position_index},
          ${laneRow.event_id},
          ${db.json(laneRow.record_json)}
        )
        on conflict (bundle_id, lane_kind) do update set
          phase_state = excluded.phase_state,
          allowed_action_kinds = excluded.allowed_action_kinds,
          required_feature_flags = excluded.required_feature_flags,
          unavailable_response_class = excluded.unavailable_response_class,
          rollout_owner = excluded.rollout_owner,
          fail_closed = excluded.fail_closed,
          no_side_effects_when_disabled = excluded.no_side_effects_when_disabled,
          labels_exposed_when_disabled = excluded.labels_exposed_when_disabled,
          supports_release_claims_when_disabled = excluded.supports_release_claims_when_disabled,
          position_index = excluded.position_index,
          event_id = excluded.event_id,
        record_json = excluded.record_json
    `;
    return;
  }
  if (operatorEvidenceProjectionTableNames.has(projection.table)) {
    const table = db(projection.table);
    await db`
      insert into ${table} (
        id,
        release_id,
        resource_key,
        related_release_artifact_id,
        related_evaluation_run_id,
        target_label_snapshot_id,
        artifact_status,
        input_hash,
        artifact_json,
        event_id,
        record_json,
        created_at
      )
      values (
        ${values.id},
        ${values.release_id},
        ${values.resource_key},
        ${values.related_release_artifact_id},
        ${values.related_evaluation_run_id},
        ${values.target_label_snapshot_id},
        ${values.artifact_status},
        ${values.input_hash},
        ${db.json(values.artifact_json)},
        ${values.event_id},
        ${db.json(values.record_json)},
        coalesce(${values.created_at}::timestamptz, now())
      )
      on conflict (id) do update set
        release_id = excluded.release_id,
        resource_key = excluded.resource_key,
        related_release_artifact_id = excluded.related_release_artifact_id,
        related_evaluation_run_id = excluded.related_evaluation_run_id,
        target_label_snapshot_id = excluded.target_label_snapshot_id,
        artifact_status = excluded.artifact_status,
        input_hash = excluded.input_hash,
        artifact_json = excluded.artifact_json,
        event_id = excluded.event_id,
        record_json = excluded.record_json,
        created_at = excluded.created_at
    `;
  }
}
}
