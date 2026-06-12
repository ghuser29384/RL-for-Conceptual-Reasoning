import assert from "node:assert/strict";
import { request } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { createLmcaServer } from "../src/server.mjs";

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const auditDir = await mkdtemp(join(tmpdir(), "rlhf-audit-smoke-"));
  const server = createLmcaServer({ rootDir: resolve("."), auditDir });

  try {
    await listen(server);
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const health = await requestJson(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.equal(health.body.status, "ok");
    assert.equal(health.body.authMode, "signed_demo_sessions");

    const graduateSession = await requestJson(`${baseUrl}/api/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "demo-rater" }),
    });
    assert.equal(graduateSession.status, 201);
    assert.match(graduateSession.body.token, /^[^.]+\.[^.]+$/);

    const adminSession = await requestJson(`${baseUrl}/api/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "demo-admin" }),
    });
    assert.equal(adminSession.status, 201);

    const created = await requestJson(`${baseUrl}/api/ratings/blind`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${graduateSession.body.token}` },
      body: JSON.stringify({ rating: validBlindRating("rating-smoke-server") }),
    });
    assert.equal(created.status, 201);
    assert.match(created.body.payloadHash, /^sha256:/);

    const sourceStyleAudit = await requestJson(`${baseUrl}/api/source-style/audits`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${graduateSession.body.token}` },
      body: JSON.stringify({ audit: validSourceStyleAudit("source-style-smoke-server", "rating-smoke-server") }),
    });
    assert.equal(sourceStyleAudit.status, 201);
    assert.match(sourceStyleAudit.body.payloadHash, /^sha256:/);

    const hiddenMetadata = await requestJson(`${baseUrl}/api/ratings/blind`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${graduateSession.body.token}` },
      body: JSON.stringify({ rating: { ...validBlindRating("rating-smoke-hidden"), adminTags: ["hidden"] } }),
    });
    assert.equal(hiddenMetadata.status, 400);

    const impersonation = await requestJson(`${baseUrl}/api/ratings/blind`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${graduateSession.body.token}` },
      body: JSON.stringify({ rating: { ...validBlindRating("rating-smoke-impersonation"), raterId: "other-rater" } }),
    });
    assert.equal(impersonation.status, 403);

    const preLockSourceStyleAudit = await requestJson(`${baseUrl}/api/source-style/audits`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${graduateSession.body.token}` },
      body: JSON.stringify({
        audit: {
          ...validSourceStyleAudit("source-style-smoke-prelock", "rating-smoke-server"),
          collectedAt: "2026-06-11T13:59:00.000Z",
        },
      }),
    });
    assert.equal(preLockSourceStyleAudit.status, 400);

    const hiddenSourceStyleAudit = await requestJson(`${baseUrl}/api/source-style/audits`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${graduateSession.body.token}` },
      body: JSON.stringify({
        audit: {
          ...validSourceStyleAudit("source-style-smoke-hidden", "rating-smoke-server"),
          sourceType: "llm_generated",
        },
      }),
    });
    assert.equal(hiddenSourceStyleAudit.status, 400);

    const certificationStatus = await requestJson(`${baseUrl}/api/certification/status`, {
      headers: { authorization: `Bearer ${graduateSession.body.token}` },
    });
    assert.equal(certificationStatus.status, 200);
    assert.equal(certificationStatus.body.raterId, "demo-rater");

    const certificationAttempt = await requestJson(`${baseUrl}/api/certification/attempts`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${graduateSession.body.token}` },
      body: JSON.stringify({ attempt: validCertificationAttempt("cert-smoke-server") }),
    });
    assert.equal(certificationAttempt.status, 201);
    assert.equal(certificationAttempt.body.scoredAttempt.status, "certified");

    const certificationImpersonation = await requestJson(`${baseUrl}/api/certification/attempts`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${graduateSession.body.token}` },
      body: JSON.stringify({ attempt: { ...validCertificationAttempt("cert-smoke-impersonation"), raterId: "other-rater" } }),
    });
    assert.equal(certificationImpersonation.status, 403);

    const benchmarkReport = await requestJson(`${baseUrl}/api/benchmark/freeze-report`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(benchmarkReport.status, 200);
    assert.equal(benchmarkReport.body.restrictedItemRefs.hiddenPositionIds.length, 1);
    assert.equal(benchmarkReport.body.accessAudit.authorizedAccessCount >= 2, true);

    const benchmarkExposure = await requestJson(`${baseUrl}/api/benchmark/exposures`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({
        exposure: {
          action: "artifact_probe_run",
          artifactId: "hidden-benchmark-freeze-october-2026-demo",
          purpose: "authorized_artifact_probe",
          probeFamilies: ["critique_only", "metadata_style_only"],
          notes: "Smoke-test authorized artifact probe record.",
        },
      }),
    });
    assert.equal(benchmarkExposure.status, 201);
    assert.equal(benchmarkExposure.body.report.artifactProbeDiagnostics.status, "pass");

    const hiddenBenchmarkContent = await requestJson(`${baseUrl}/api/benchmark/exposures`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({
        exposure: {
          action: "membership_view",
          artifactId: "hidden-benchmark-freeze-october-2026-demo",
          purpose: "access_audit_review",
          positionText: "If two systems have exactly the same causal and functional organization...",
        },
      }),
    });
    assert.equal(hiddenBenchmarkContent.status, 400);

    const forbiddenBenchmark = await requestJson(`${baseUrl}/api/benchmark/freeze-report`, {
      headers: { authorization: `Bearer ${graduateSession.body.token}` },
    });
    assert.equal(forbiddenBenchmark.status, 403);

    const benchmarkReportAfterDenial = await requestJson(`${baseUrl}/api/benchmark/freeze-report`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(benchmarkReportAfterDenial.status, 200);
    assert.equal(benchmarkReportAfterDenial.body.accessAudit.unauthorizedAccessCount, 1);

    const trainingExportForbidden = await requestJson(`${baseUrl}/api/training/export`, {
      headers: { authorization: `Bearer ${graduateSession.body.token}` },
    });
    assert.equal(trainingExportForbidden.status, 403);

    const trainingExport = await requestJson(`${baseUrl}/api/training/export`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(trainingExport.status, 200);
    assert.equal(trainingExport.body.protectedSplitPolicy.hiddenBenchmarkExcluded, true);
    assert.equal(trainingExport.body.protectedSplitPolicy.internalValidationExcluded, true);
    assert.equal(trainingExport.body.counts.pointwiseExamples, 2);
    assert.equal(trainingExport.body.counts.pairwisePreferenceExamples, 1);
    assert.equal(trainingExport.body.pointwiseExamples.every((example) => example.split === "public_train"), true);
    assert.equal(trainingExport.body.optimizedSurrogateObjective.lmcaEvaluationMetricsSeparate, true);

    const forbidden = await requestJson(`${baseUrl}/api/audit/events`, { headers: { authorization: `Bearer ${graduateSession.body.token}` } });
    assert.equal(forbidden.status, 403);

    const audit = await requestJson(`${baseUrl}/api/audit/events`, { headers: { authorization: `Bearer ${adminSession.body.token}` } });
    assert.equal(audit.status, 200);
    assert.equal(audit.body.events.length, 1);

    const report = await requestJson(`${baseUrl}/api/release/report`);
    assert.equal(report.status, 200);
    assert.equal(report.body.corpusManifest.counts.blindInitialRatings, 7);
    assert.equal(report.body.corpusManifest.adminTagRisk.tagCount, 3);
    assert.equal(report.body.corpusManifest.adminTagRisk.byConfounderRiskClass.known_rating_confounder, 1);
    assert.equal(report.body.corpusManifest.sourceDetailCoverage.status, "source_detail_metadata_declared");
    assert.equal(report.body.corpusManifest.sourceDetailRows.length, 3);
    assert.equal(report.body.corpusManifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "DebateBench").lmcaCount, 18);
    assert.equal(report.body.corpusManifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "VivesDebate").translationRoute, "machine_translated_catalan_to_english");
    assert.equal(report.body.itemTextViewParity.counts.ratingRows >= 7, true);
    assert.equal(report.body.itemTextViewParity.counts.frozenRatingTextVersionRows, report.body.itemTextViewParity.counts.ratingRows);
    assert.equal(report.body.itemTextViewParity.counts.evaluationRowsWithViewParity, 8);
    assert.equal(report.body.itemTextViewParity.releaseUseStatus, "item_text_versions_frozen_with_human_model_view_parity");
    assert.equal(report.body.adminTagBlinding.counts.preLockVisibilityViolationCount, 0);
    assert.equal(report.body.adminTagBlinding.releaseUseStatus, "admin_tag_confounder_risk_disclosed_hidden_before_lock");
    assert.equal(report.body.humanScoreDistribution.overall.overall.mean, 0.462);
    assert.equal(report.body.labelSnapshotReliability.reliabilityWeightModel.fitDataProvenance.protectedRatingsUsedForFit, 0);
    assert.equal(report.body.labelSnapshotReliability.reliabilityWeightModel.effectiveContribution.maxSingleRaterContributionShare, 1);
    assert.equal(report.body.labelSnapshotReliability.reliabilityWeightModel.releaseUseStatus, "uniform_weights_frozen_with_sensitivity_report");
    assert.equal(report.body.promptArtifacts.length, 4);
    assert.equal(report.body.promptArtifacts.find((artifact) => artifact.id === "project-full-rubric-v1").renderedPromptChecksum, "sha256:project-full-rubric-v1:rendered");
    assert.equal(report.body.promptTrackSeparation.counts.promptTrackRows, 4);
    assert.equal(report.body.promptTrackSeparation.counts.appendixGExactRows, 1);
    assert.equal(report.body.promptTrackSeparation.counts.protectedExampleViolationCount, 0);
    assert.equal(report.body.promptTrackSeparation.releaseUseStatus, "appendix_g_baseline_separated_from_project_prompt_tracks");
    assert.equal(report.body.sanityBaselines.protectedSplitPolicy.hiddenBenchmarkFitExcluded, true);
    assert.equal(report.body.sanityBaselines.baselines.find((baseline) => baseline.baselineType === "random_pairwise").metricOutputs.loss, 0.5);
    const fullRubricAudit = report.body.modelFailureAudits.find((audit) => audit.evaluationRunId === "eval-full-rubric-demo");
    assert.equal(fullRubricAudit.protectedSplitHandling.protectedPredictionCount, 2);
    assert.equal(fullRubricAudit.topCustomLossRows[0].itemId, "pos-ai-prior::crit-ai-generic");
    assert.equal(fullRubricAudit.promptArtifact.id, "project-full-rubric-v1");
    assert.equal(fullRubricAudit.topCustomLossRows[0].renderedPromptChecksum, "sha256:project-full-rubric-v1:rendered");
    assert.equal(fullRubricAudit.claimGatedDiagnostics.releaseUseStatus, "claim_gated_diagnostics_deferred_no_robustness_claim");
    assert.equal(fullRubricAudit.claimGatedDiagnostics.suites[0].status, "deferred_no_robustness_claim");
    assert.equal(fullRubricAudit.diagnosticOnly, true);
    assert.equal(report.body.lmcaComparison.sourceScaleComparison.find((row) => row.metric === "rated_critiques").lmcaValue, 951);
    assert.equal(report.body.lmcaComparison.modelScoreAnchorComparison.anchorCount, 7);
    assert.equal(report.body.lmcaComparison.targetLabelComparison.status, "lmca_style_not_target_identical");
    assert.equal(report.body.positionIntakeReadiness.counts.positionsScreened, 3);
    assert.equal(report.body.positionIntakeReadiness.counts.normalizationRequiredCount, 1);
    assert.equal(report.body.positionIntakeReadiness.counts.hiddenBenchmarkContextBlockedCount, 0);
    assert.equal(report.body.positionIntakeReadiness.releaseUseStatus, "position_intake_limitations_disclosed");
    assert.equal(report.body.rubricQaCoverage.counts.requiredFamilyCount, 33);
    assert.equal(report.body.rubricQaCoverage.counts.missingFamilyCount, 0);
    assert.equal(report.body.rubricQaCoverage.counts.protectedExposureViolationCount, 0);
    assert.equal(report.body.rubricQaCoverage.releaseUseStatus, "rubric_qa_pack_frozen_public_only");
    assert.equal(report.body.sourceExampleAnchors.counts.anchorCount, 4);
    assert.equal(report.body.sourceExampleAnchors.counts.exposureViolationCount, 0);
    assert.equal(report.body.sourceExampleAnchors.counts.humanCeilingEligibleCount, 0);
    assert.equal(report.body.sourceExampleAnchors.releaseUseStatus, "source_anchor_suite_public_training_only");
    assert.equal(report.body.protectedSplitIsolation.counts.positionClusterCount, 3);
    assert.equal(report.body.protectedSplitIsolation.counts.protectedCrossSplitClusterCount, 0);
    assert.equal(report.body.protectedSplitIsolation.counts.certificationPackOverlapCount, 0);
    assert.equal(report.body.protectedSplitIsolation.counts.goldProtectedOverlapCount, 0);
    assert.equal(report.body.protectedSplitIsolation.releaseUseStatus, "protected_split_cluster_isolation_pass");
    assert.equal(report.body.hiddenBenchmarkFreeze.initialBlinding.releaseUseStatus, "hidden_benchmark_initial_rating_blinding_pass");
    assert.equal(report.body.hiddenBenchmarkFreeze.initialBlinding.counts.undisclosedIncludedRows, 0);
    assert.equal(report.body.rubricDrift.mixedRubricSnapshotStatus, "single_rubric_version_current");
    assert.equal(report.body.rubricDrift.counts.recertificationOrGrandfatheringReviewCount, 0);
    assert.equal(report.body.rubricDrift.counts.ratersWithTargetedRetrainingFlags, 1);
    assert.equal(report.body.rubricDrift.releaseUseStatus, "rater_retraining_or_restriction_flags_active");
    assert.equal(report.body.ratingEffortQuality.telemetryCoverage.missingTelemetryRows, 0);
    assert.equal(report.body.ratingEffortQuality.qaRoutedRatings.length, 1);
    assert.equal(report.body.ratingEffortQuality.releaseUseStatus, "qa_routing_required_before_sensitive_use");
    assert.equal(report.body.rubricIssueFlags.counts.strengthCentralityAllocationAmbiguityCount, 1);
    assert.equal(report.body.rubricIssueFlags.counts.correctnessWeightingIssueCount, 1);
    assert.equal(report.body.rubricIssueFlags.counts.clarityAfterEffortIssueCount, 1);
    assert.equal(report.body.rubricIssueFlags.counts.midRangeStrengthUncertaintyCount, 1);
    assert.equal(report.body.rubricIssueFlags.counts.observedIssueFlagFamilyCount, 10);
    assert.equal(report.body.rubricIssueFlags.counts.coveredIssueFlagCount, 10);
    assert.equal(report.body.rubricIssueFlags.counts.byFlag.correctnessNotAssessableDueToClarity, 1);
    assert.equal(report.body.rubricIssueFlags.counts.byFlag.midRangeStrengthUncertainty, 1);
    assert.equal(report.body.rubricIssueFlags.releaseUseStatus, "rubric_issue_flags_separated_from_product_disagreement");
    assert.equal(report.body.sourceStyleAudit.counts.totalAudits, 4);
    assert.equal(report.body.sourceStyleAudit.counts.postLockAudits, 4);
    assert.equal(report.body.sourceStyleAudit.diagnosticOnly, true);
    assert.equal(report.body.sourceStyleAudit.releaseUseStatus, "residual_unblinding_disclosure_required");
    assert.equal(report.body.correctnessVerification.requiredItemCount, 1);
    assert.equal(report.body.correctnessVerification.unresolvedRequiredItems.length, 1);
    assert.equal(report.body.correctnessVerification.releaseUseStatus, "verification_review_required_before_benchmark_or_public_release");
    assert.equal(report.body.adjudicationMemoAudit.counts.memoCount, 2);
    assert.equal(report.body.adjudicationMemoAudit.counts.completeAmbiguityMemoCount, 2);
    assert.equal(report.body.adjudicationMemoAudit.counts.bottomLineDependentItemCount, 1);
    assert.equal(report.body.adjudicationMemoAudit.releaseUseStatus, "adjudication_limitations_preserved");
    assert.equal(report.body.postDiscussionDisagreement.counts.releaseCriticalItemCount, 3);
    assert.equal(report.body.postDiscussionDisagreement.counts.highSpreadItemCount, 0);
    assert.equal(report.body.postDiscussionDisagreement.counts.missingMemoHighSpreadItemCount, 0);
    assert.equal(report.body.postDiscussionDisagreement.releaseUseStatus, "post_discussion_spread_check_thin_no_high_spread_observed");
    assert.equal(report.body.humanCeiling.validationScope.appendixCScaleStatus, "thinner_than_appendix_c");
    assert.equal(report.body.humanCeiling.raterItemCoverage.commonOverlapItemIds.length, 1);
    assert.equal(report.body.humanCeiling.checkSeparation.modelAssistedTreatedAsIndependentHuman, false);
    assert.equal(report.body.humanCeiling.saturationRisk.status, "not_assessable_thin_validation");
    assert.equal(report.body.humanCeiling.refreshQueue[0].itemId, "pos-voting::crit-voting-style");
    assert.equal(report.body.humanCeiling.releaseUseStatus, "human_ceiling_claims_blocked_thinner_than_appendix_c");
    assert.equal(report.body.validationTrancheReport.releaseUseStatus, "validation_tranches_separated_seed_thin");
    assert.deepEqual(report.body.validationTrancheReport.randomSentinel.itemIds, ["pos-voting::crit-voting-bullet"]);
    assert.deepEqual(report.body.validationTrancheReport.hardCaseStress.itemIds, ["pos-voting::crit-voting-style"]);
    assert.equal(report.body.validationTrancheReport.randomSentinel.initialVsFinal.meanAbsOverallDiff, 0.03);
    assert.equal(report.body.critiqueGenerationEvaluation.aggregateCounts.generatedOutputs, 6);
    assert.equal(report.body.critiqueGenerationEvaluation.aggregateCounts.promotedToRating, 2);
    assert.equal(report.body.critiqueGenerationEvaluation.runRows[0].promptArtifact.id, "candidate-gen-v3");
    assert.equal(report.body.critiqueGenerationEvaluation.runRows[0].modelJudgeScreening.promptArtifact.id, "candidate-judge-v2");
    assert.equal(report.body.critiqueGenerationEvaluation.runRows[0].blindRatingCoverage.promotedCoverageShare, 1);
    assert.equal(report.body.critiqueGenerationEvaluation.generationVsJudgingSeparation.modelJudgeScoresAcceptedAsGoldLabels, false);
    assert.equal(report.body.critiqueGenerationEvaluation.releaseUseStatus, "generation_evaluation_separate_with_blind_rating_coverage");
    assert.equal(report.body.candidateIntakeQualityAudit.counts.unqualifiedScaleEligibleCritiques, 3);
    assert.equal(report.body.candidateIntakeQualityAudit.counts.duplicateGeneratedOutputs, 1);
    assert.equal(report.body.candidateIntakeQualityAudit.releaseUseStatus, "marginal_informativeness_audit_disclosed_low_redundancy_controls");
    assert.equal(report.body.raterCompositionConflicts.counts.includedRaterCount, 5);
    assert.equal(report.body.raterCompositionConflicts.counts.releaseCriticalItemCount, 3);
    assert.equal(report.body.raterCompositionConflicts.counts.conflictFlagCount, 0);
    assert.equal(report.body.raterCompositionConflicts.counts.singleRaterDominatedReleaseCriticalItemCount, 2);
    assert.equal(report.body.raterCompositionConflicts.releaseUseStatus, "rater_composition_limitations_disclosed");
    assert.equal(report.body.ratingRevisionAudit.counts.blindInitialRows, 7);
    assert.equal(report.body.ratingRevisionAudit.counts.revisionRows, 0);
    assert.equal(report.body.ratingRevisionAudit.counts.expertCheckRows, 1);
    assert.equal(report.body.ratingRevisionAudit.counts.denominatorInflationExcludedRows, 1);
    assert.equal(report.body.ratingRevisionAudit.releaseUseStatus, "revision_and_check_denominators_separated");
    assert.equal(report.body.labelChannelSeparation.counts.auditedSurfaces, 5);
    assert.equal(report.body.labelChannelSeparation.counts.violationCount, 0);
    assert.equal(report.body.labelChannelSeparation.counts.forbiddenTrainingChannelRows, 0);
    assert.equal(report.body.labelChannelSeparation.releaseUseStatus, "lmca_argumentative_quality_channel_separated");
    assert.equal(report.body.recalibratedEvaluation.calibrationArtifact.fitSplits[0], "public_train");
    assert.equal(report.body.recalibratedEvaluation.calibrationArtifact.protectedRowsExcludedFromFit, 2);
    assert.equal(report.body.recalibratedEvaluation.calibrationArtifact.protectedLeakageCount, 0);
    assert.equal(report.body.recalibratedEvaluation.calibrationArtifact.fittedParameters.overall.intercept, -0.03);
    assert.equal(report.body.recalibratedEvaluation.releaseUseStatus, "recalibrated_report_protected_fit_excluded");
    assert.equal(report.body.samePositionContext.counts.currentCritiqueVisibilityViolationCount, 0);
    assert.equal(report.body.samePositionContext.counts.contextSensitiveRatingCount, 3);
    assert.equal(report.body.samePositionContext.releaseUseStatus, "rating_context_sensitive_model_prompt_matching_required");
    assert.equal(report.body.leaderboardReport.rows.length, 2);
    assert.equal(report.body.leaderboardReport.pairwiseComparisonSnapshot.nonTiedEdges.length, 2);
    assert.equal(report.body.leaderboardReport.unresolvedComparisonGroups.length, 1);
    assert.equal(report.body.leaderboardReport.releaseUseStatus, "point_estimate_ordering_only_unresolved_within_uncertainty");
    assert.equal(report.body.leaderboardReport.commonMetricConfig.commonMetricConfigStatus, "declared_common_metric_config");
    assert.equal(report.body.metricDirectionalityConfig.counts.pairwiseConfigRows, 3);
    assert.equal(report.body.metricDirectionalityConfig.counts.configViolationCount, 0);
    assert.equal(report.body.metricDirectionalityConfig.directionalityRows[0].callSignature, "customWeightedLoss(targetLabel, modelPrediction)");
    assert.equal(report.body.metricDirectionalityConfig.releaseUseStatus, "metric_config_and_directionality_declared");
    assert.equal(report.body.leaderboardReport.modelAssistedLabelOverlap.releaseUseStatus, "clean_no_model_assisted_label_overlap");
    assert.equal(report.body.modelAssistedLabelOverlap.releaseUseStatus, "clean_no_model_assisted_label_overlap");
    assert.equal(report.body.modelAssistedLabelOverlap.runRows[0].cleanClaimStatus, "clean_claim_allowed_no_model_assisted_label_exposure");
    assert.equal(report.body.modelAssistedLabelOverlap.humanOnlyPreAssistanceTarget.sameAsTargetLabelSnapshot, true);
    assert.equal(report.body.reasoningModeSensitivity.status, "no_paired_reasoning_mode_run_deferred");
    assert.equal(report.body.reasoningModeSensitivity.table6SourceBaseline.length, 4);
    assert.equal(report.body.reasoningModeSensitivity.runRows[1].itemRoleTerminology, "legacy_argument_wording");
    assert.equal(fullRubricAudit.leaderboardReportId, report.body.leaderboardReport.id);
    assert.equal(report.body.pairedTargetLabelSnapshots.primaryRaterAnchorSnapshot.primaryRaterAnchor.raterId, "rater-a");
    assert.equal(report.body.pairedTargetLabelSnapshots.coverageOverlap.overlapItemCount, 2);
    assert.equal(report.body.pairedTargetLabelSnapshots.modelScoreDeltas[0].primaryRaterAnchor.coverage.nPairsScored, 1);
    assert.equal(report.body.pairedTargetLabelSnapshots.rankSensitivity.status, "no_point_estimate_order_change_on_overlap");

    const auditLog = await readFile(join(auditDir, "rating-events.jsonl"), "utf8");
    assert.equal(auditLog.trim().split("\n").length, 1);
    const sourceStyleLog = await readFile(join(auditDir, "source-style-audit-events.jsonl"), "utf8");
    assert.equal(sourceStyleLog.trim().split("\n").length, 1);
    const benchmarkLog = await readFile(join(auditDir, "benchmark-exposure-events.jsonl"), "utf8");
    assert.equal(benchmarkLog.trim().split("\n").length, 4);
    console.log("Server smoke passed: health, rating and source/style audit appends, certification workflow, benchmark access logging, hidden metadata rejection, admin audit readback, and dynamic report.");
  } finally {
    if (server.listening) {
      await new Promise((resolveClose, rejectClose) => server.close((error) => (error ? rejectClose(error) : resolveClose())));
    }
    await rm(auditDir, { recursive: true, force: true });
  }
}

function listen(server) {
  return new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });
}

function requestJson(url, options = {}) {
  return new Promise((resolveRequest, rejectRequest) => {
    const body = options.body ?? "";
    const req = request(
      url,
      {
        method: options.method ?? "GET",
        headers: {
          ...(options.headers ?? {}),
          ...(body ? { "content-length": Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolveRequest({
            status: res.statusCode,
            body: text ? JSON.parse(text) : null,
          });
        });
      },
    );
    req.on("error", rejectRequest);
    if (body) req.write(body);
    req.end();
  });
}

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
    provisionalDimensions: [],
    rationale: "Server smoke test rating.",
    flags: {},
    activeSeconds: 620,
    idleGapSeconds: 10,
    interruptionCount: 0,
    submittedAt: "2026-06-11T14:00:00.000Z",
    lockedAt: "2026-06-11T14:00:00.000Z",
  };
}

function validSourceStyleAudit(id, ratingId) {
  return {
    id,
    ratingId,
    assignmentId: "assign-ai-base-rate",
    positionId: "pos-ai-prior",
    critiqueId: "crit-ai-base-rate",
    raterId: "demo-rater",
    collectedAt: "2026-06-11T14:02:00.000Z",
    sourceGuess: "human_written",
    authorshipGuess: "expert",
    styleGuess: "direct",
    styleGuessConfidence: 0.72,
    collectionPhase: "post_initial_lock",
    shownBeforeInitialLock: false,
    usedForScoring: false,
    notes: "Smoke-test post-lock source/style guess.",
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
