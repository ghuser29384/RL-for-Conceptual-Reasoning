import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateRatings,
  adjudicationMemos,
  appendRatingRevision,
  buildAdjudicationMemoAuditReport,
  auditProvenanceRights,
  assignments,
  buildAdminTagBlindingReport,
  buildActiveLearningAudit,
  buildCandidateIntakeQualityAudit,
  buildCertificationAudit,
  buildComparabilityClaimMatrix,
  buildCorrectnessVerificationReport,
  buildCorpusCompositionManifest,
  buildCritiqueGenerationEvaluationReport,
  buildHiddenBenchmarkFreezeReport,
  buildHiddenBenchmarkInitialBlindingReport,
  buildItemTextViewParityReport,
  buildLabelChannelSeparationReport,
  buildLmcaSourceExampleAnchorReport,
  buildMetricFamilyEligibilityManifest,
  buildModelAssistedLabelOverlapReport,
  buildModelFailureAudit,
  buildOctoberReleaseReport,
  buildPairwiseComparisonSnapshot,
  buildPairedTargetLabelSnapshotReport,
  buildPositionIntakeReadinessReport,
  buildPostDiscussionDisagreementReport,
  buildPostLockSourceStyleAuditReport,
  buildProtectedSplitIsolationReport,
  buildPromptTrackSeparationReport,
  buildRaterCompositionConflictReport,
  buildRaterCertificationReport,
  buildReleaseGateProfile,
  buildRubricIssueFlagReport,
  buildRubricQaCoverageReport,
  buildRubricVersionDriftReport,
  buildHumanScoreDistributionReport,
  buildHumanCeilingAndSaturationReport,
  buildLmcaComparisonReport,
  buildReasoningModeSensitivityReport,
  buildMetricDirectionalityConfigReport,
  buildRecalibratedEvaluationReport,
  buildRatingRevisionAuditReport,
  buildSanityBaselineReport,
  buildSamePositionContextReport,
  buildUncertaintyAwareLeaderboardReport,
  buildRatingEffortQualityReport,
  buildTrainingExport,
  buildValidationTrancheReport,
  buildValidationDesignReport,
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
  certificationPacks,
  seedBenchmarkExposureEvents,
  seedCertificationAttempts,
  unweightedPairwiseErrorRateByPosition,
  verificationRecords,
  weightedPairwiseErrorRateByPosition,
  weightedPairwiseLossForPosition,
} from "../src/domain/core.mjs";

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
  });
  assert.equal(round(weightedPairwiseLossForPosition({ a: 0.8, b: 0.2 }, { a: 0.5, b: 0.5 }).loss), 0.3);
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

test("pairwise snapshots freeze comparison denominators and margin bins", () => {
  const snapshot = buildPairwiseComparisonSnapshot("snap", "labels", "adjudicated", {
    p1: { a: 0.9, b: 0.8, c: 0.5 },
    p2: { d: 0.5 },
  });
  assert.equal(snapshot.nonTiedEdges.length, 3);
  assert.deepEqual(snapshot.excludedNoPairPositions, ["p2"]);
  assert.deepEqual(pairwiseMarginDistribution(snapshot).bins, { low: 1, medium: 1, high: 1 });
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
  assert.equal(report.counts.observedIssueFlagFamilyCount, 10);
  assert.equal(report.counts.coveredIssueFlagCount, 10);
  assert.equal(report.counts.missingCoverageCount, 0);
  assert.equal(report.counts.productLevelDisagreementItemCount, 0);
  assert.equal(report.releaseUseStatus, "rubric_issue_flags_separated_from_product_disagreement");
  assert.equal(report.policy.requiredRaterFlags.includes("correctnessNotAssessableDueToClarity"), true);
  assert.equal(report.policy.requiredRaterFlags.includes("midRangeStrengthUncertainty"), true);
  assert.equal(report.policy.requiredRaterFlags.includes("vagueGoodObjectionGesture"), true);
  assert.equal(report.counts.byFlag.contentFreePseudoSubstance, 1);
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
  assert.equal(manifest.sourceDetailRows.find((row) => row.positionId === "pos-voting").sourceTaskFormat, "coursework prompt adaptation");
  assert.equal(manifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "DebateBench").lmcaCount, 18);
  assert.equal(manifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "VivesDebate").translationRoute, "machine_translated_catalan_to_english");
  assert.equal(manifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "LSAT-derived").sourceDomainSuitability, "usually_not_suitable_domains_unless_explicitly_labeled");
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
  assert.equal(report.unresolvedRequiredItems.length, 1);
  assert.equal(report.releaseBlockingItems[0].critiqueId, "crit-voting-bullet");
  assert.equal(report.releaseUseStatus, "verification_review_required_before_benchmark_or_public_release");
  assert.equal(report.byVerificationStatus.unresolved, 1);
  assert.equal(report.byVerificationStatus.not_practicable, 1);

  const resolvedRecords = verificationRecords.map((record) =>
    record.id === "verify-voting-bullet-strategy"
      ? { ...record, id: "verify-voting-bullet-resolved", verificationStatus: "verified", verificationResult: "Expert verified the logical incentive claim.", confidence: 0.85 }
      : record,
  );
  const resolvedReport = buildCorrectnessVerificationReport("release-test", seedRatings, positions, critiques, resolvedRecords);
  assert.equal(resolvedReport.releaseBlockingItems.length, 0);
  assert.equal(resolvedReport.releaseUseStatus, "pass");
});

test("same-position context report freezes sibling exposure and model-context parity", () => {
  const report = buildSamePositionContextReport("release-test", seedRatings, positions, critiques, ratingContextSnapshots, assignments);
  assert.equal(report.counts.totalRatings, seedRatings.length);
  assert.equal(report.counts.ratingsWithFrozenContext, seedRatings.length);
  assert.equal(report.counts.missingContextSnapshotCount, 0);
  assert.equal(report.counts.currentCritiqueVisibilityViolationCount, 0);
  assert.equal(report.counts.contextSensitiveRatingCount, 3);
  assert.equal(report.counts.counterbalancedReleaseCriticalRatingCount, 3);
  assert.equal(report.counts.absentSiblingDisclosureCount, 3);
  assert.equal(report.byPolicy.target_only, 4);
  assert.equal(report.byPolicy.counterbalanced_sibling_context, 3);
  assert.equal(report.releaseUseStatus, "rating_context_sensitive_model_prompt_matching_required");
  const votingStyle = report.contextRows.find((row) => row.ratingId === "rating-voting-style-a");
  assert.deepEqual(votingStyle.priorSiblingCritiqueIds, ["crit-voting-bullet"]);
  assert.deepEqual(votingStyle.absentSiblingCritiqueIds, []);
  assert.equal(votingStyle.cleanModelPromptRequirement, "model_prompt_must_match_frozen_sibling_context_or_restrict_target_snapshot");
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
  const trainingExport = buildTrainingExport("release-test", snapshot, positions, critiques, seedRatings, ratingContextSnapshots);
  assert.equal(trainingExport.protectedSplitPolicy.hiddenBenchmarkExcluded, true);
  assert.equal(trainingExport.protectedSplitPolicy.internalValidationExcluded, true);
  assert.deepEqual(trainingExport.protectedSplitPolicy.includedSplits, ["public_train"]);
  assert.equal(trainingExport.protectedSplitPolicy.positionClusterIsolationStatus, "pass");
  assert.equal(trainingExport.counts.pointwiseExamples, 2);
  assert.equal(trainingExport.counts.pairwisePreferenceExamples, 1);
  assert.equal(trainingExport.pointwiseExamples.every((example) => example.split === "public_train"), true);
  assert.equal(trainingExport.pointwiseExamples[0].labelStatus, "initial_only");
  assert.equal(trainingExport.pointwiseExamples[0].ratingContextSnapshotId, "rc-target-only-1");
  assert.equal(trainingExport.ratingContextSnapshots[0].humanModelParityStatus, "matchable_target_only");
  assert.equal(trainingExport.pairwisePreferenceExamples[0].preferredCritiqueId, "crit-ai-base-rate");
  assert.equal(trainingExport.pairwisePreferenceExamples[0].preferenceWeight, 0.46);
  assert.equal(trainingExport.optimizedSurrogateObjective.lmcaEvaluationMetricsSeparate, true);
  assert.match(trainingExport.scalarRewardTargets[0].rewardPolicy, /not_personal_agreement/);
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
  assert.equal(report.commonMetricConfig.scoreRoundingPolicy, "stored_exact");
  assert.equal(report.commonMetricConfig.scoreQuantizationPolicy, "unit_interval_decimal_scores_no_bucket_quantization");
  assert.equal(report.commonMetricConfig.humanTieTolerance, 0);
  assert.equal(report.commonMetricConfig.modelTiePolicy, "score_model_tied_predictions_as_half_error");
  assert.equal(report.commonMetricConfig.commonMetricConfigStatus, "declared_common_metric_config");
  assert.equal(report.modelAssistedLabelOverlap.releaseUseStatus, "clean_no_model_assisted_label_overlap");
  assert.equal(report.modelAssistedLabelOverlap.runRows[0].cleanClaimStatus, "clean_claim_allowed_no_model_assisted_label_exposure");
  assert.equal(report.reasoningModeSensitivity.status, "no_paired_reasoning_mode_run_deferred");
  assert.equal(report.reasoningModeSensitivity.table6SourceBaseline.length, 4);
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
  assert.equal(report.coverageOverlap.primaryScoredItemCount, 2);
  assert.equal(report.coverageOverlap.consensusScoredItemCount, 5);
  assert.deepEqual(report.coverageOverlap.overlapItemIds, ["pos-ai-prior::crit-ai-base-rate", "pos-ai-prior::crit-ai-generic"]);
  assert.equal(report.targetLabelDeltas[0].primaryMinusConsensusOverall, 0.02);
  assert.equal(report.modelScoreDeltas[0].commonOverlapItemCount, 2);
  assert.equal(report.modelScoreDeltas[0].primaryRaterAnchor.coverage.nPairsScored, 1);
  assert.equal(report.modelScoreDeltas[0].consensus.coverage.nPairsScored, 1);
  assert.equal(report.rankSensitivity.status, "no_point_estimate_order_change_on_overlap");
  assert.equal(report.claimPolicy.consensusSnapshotUse, "higher_quality_volunteer_label_not_target_identical_to_lmca_table_5");
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
  assert.equal(report.humanOnlyPreAssistanceTarget.excludedModelAssistedRows, 1);
  assert.equal(report.humanOnlyPreAssistanceTarget.denominatorCounts.modelAssistedChecks, 0);
  assert.equal(fullRubricRow.status, "model_assisted_label_overlap_sensitive");
  assert.equal(fullRubricRow.overlapRows[0].overlapBasis, "close_model_family");
  assert.equal(fullRubricRow.cleanClaimStatus, "clean_claim_requires_human_only_pre_assistance_target_or_overlap_sensitive_label");
  assert.deepEqual(fullRubricRow.overlapItemIds, ["pos-voting::crit-voting-bullet"]);
  assert.equal(overallOnlyRow.status, "model_assisted_rows_present_no_evaluated_model_overlap");
  assert.equal(report.releaseUseStatus, "model_assisted_overlap_sensitive_reports_require_human_only_target");
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

test("certification audit enforces gold-pack isolation without treating model judges as gold", () => {
  const audit = buildCertificationAudit();
  assert.equal(audit.targetGoldLibraryItems, 60);
  assert.equal(audit.goldLibraryStatus, "incomplete");
  assert.deepEqual(audit.modelJudgeGoldViolations, []);
  assert.ok(audit.trainingExposureOnly);
  assert.equal(audit.packs[0].totalRequiredItems, 30);
  assert.ok(audit.packs.every((pack) => pack.clusterIsolationStatus === "pass"));
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

test("active-learning audit reports denominator flow and preserves blinding", () => {
  const audit = buildActiveLearningAudit();
  assert.equal(audit.totals.generated, 42);
  assert.equal(audit.totals.judged, 12);
  assert.equal(audit.totals.promoted, 5);
  assert.equal(audit.blindingPass, true);
  assert.deepEqual(audit.acceptedCritiqueIds.sort(), ["crit-ai-generic", "crit-voting-style"]);
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
  assert.equal(report.runRows[0].qualityMetrics.ratedPromotedOverall.mean, 0.14);
  assert.equal(report.runRows[0].qualityMetrics.passAtThresholdRate, 0);
  assert.equal(report.runRows[0].qualityMetrics.bestOfNByPosition[0].budgetNormalized, true);
  assert.equal(report.releaseUseStatus, "generation_evaluation_separate_with_blind_rating_coverage");
});

test("metric-family eligibility keeps pairwise and pointwise denominators separate", () => {
  const snapshot = createLabelSnapshot(
    "snapshot-test",
    "release-test",
    seedRatings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
  );
  const manifest = buildMetricFamilyEligibilityManifest("release-test", snapshot, positions, critiques);
  assert.equal(manifest.pairwiseEligiblePairCount, 2);
  assert.deepEqual(
    manifest.pairwiseEligiblePositions.map((item) => item.positionId).sort(),
    ["pos-ai-prior", "pos-voting"],
  );
  assert.ok(manifest.pointwiseOnlyItems.includes("pos-mind::crit-mind-zombie"));
  assert.equal(manifest.metricFamilySpecificExclusions[0].reason, "fewer_than_two_labelled_critiques");
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
  assert.equal(report.rightsStatus.status, "pass");
  assert.equal(report.clusterIsolation.status, "pass");
  assert.equal(report.metricEligibility.pairwiseEligiblePairCount, 0);
  assert.ok(report.metricEligibility.pointwiseOnlyItems.includes("pos-mind::crit-mind-zombie"));
  assert.deepEqual(report.pairwiseComparisonSnapshot.excludedNoPairPositions, ["pos-mind"]);
  assert.equal(report.artifactBalance.counterbalanceStatus, "insufficient_seed_benchmark");
  assert.equal(report.artifactProbeDiagnostics.status, "not_run_documented");
  assert.equal(report.accessAudit.status, "pass");
  assert.equal(report.initialBlinding.releaseUseStatus, "hidden_benchmark_initial_rating_blinding_pass");
  assert.equal(report.initialBlinding.counts.sourceTagVisibleInitialRows, 0);
  assert.equal(report.freezeStatus, "not_ready_for_release_freeze");
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
  assert.equal(report.releaseUseStatus, "human_ceiling_claims_blocked_thinner_than_appendix_c");
  assert.equal(report.refreshQueue[0].itemId, "pos-voting::crit-voting-style");
  assert.ok(report.refreshQueue[0].refreshActions.includes("expert_double_check"));
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
  assert.equal(report.targetGaps.positionsRemaining, 117);
  assert.equal(report.corpusManifest.lmcaBaseline.corpusScale.ratedCritiques, 951);
  assert.equal(report.corpusManifest.counts.positionsWithAtLeastTwoCritiques, 2);
  assert.equal(report.corpusManifest.sourceDetailCoverage.status, "source_detail_metadata_declared");
  assert.equal(report.corpusManifest.sourceDetailRows.length, 3);
  assert.equal(report.corpusManifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "VivesDebate").lmcaCount, 6);
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
  assert.equal(report.samePositionContext.releaseUseStatus, "rating_context_sensitive_model_prompt_matching_required");
  assert.equal(report.leaderboardReport.unresolvedComparisonGroups.length, 1);
  assert.equal(report.leaderboardReport.releaseUseStatus, "point_estimate_ordering_only_unresolved_within_uncertainty");
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

test("rubric QA coverage report freezes Appendix-F edge cases as public-only fixtures", () => {
  const report = buildRubricQaCoverageReport("release-test");
  assert.equal(report.counts.requiredFamilyCount, 33);
  assert.equal(report.counts.coveredFamilyCount, 33);
  assert.equal(report.counts.fixtureCount, 15);
  assert.equal(report.counts.missingFamilyCount, 0);
  assert.equal(report.counts.protectedExposureViolationCount, 0);
  assert.equal(report.dimensionCoverage.centrality > 0, true);
  assert.equal(report.dimensionCoverage.dead_weight > 0, true);
  assert.equal(report.dimensionCoverage.single_issue > 0, true);
  assert.equal(report.familyCoverageRows.every((row) => row.status === "covered"), true);
  assert.equal(report.releaseUseStatus, "rubric_qa_pack_frozen_public_only");
  assert.ok(report.coveredFamilies.includes("vague_good_objection_not_steelmanned"));
  assert.ok(report.coveredFamilies.includes("content_free_pseudo_substance_dead_weight"));
  assert.ok(report.coveredFamilies.includes("high_score_multi_interpretation_coverage"));
});

test("position intake readiness preserves original text while keeping admin notes hidden from initial raters", () => {
  const report = buildPositionIntakeReadinessReport("release-test", positions);
  assert.equal(report.counts.positionsScreened, 3);
  assert.equal(report.counts.originalTextPreservedCount, 3);
  assert.equal(report.counts.adminNotesHiddenCount, 3);
  assert.equal(report.counts.normalizationRequiredCount, 1);
  assert.equal(report.counts.contextGapFlaggedPositionCount, 1);
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
  assert.deepEqual(row.adjudicationMemoIds, ["memo-mind-zombie"]);
  assert.ok(row.disagreementTaxonomy.includes("contentious_bottom_line_premise"));
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
  assert.equal(report.counts.topicExpertiseMissingItemCount, 0);
  assert.equal(report.counts.singleRaterDominatedReleaseCriticalItemCount, 2);
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
  assert.equal(comparison.sourceScaleComparison.find((row) => row.metric === "rated_critiques").releaseValue, 5);
  assert.equal(comparison.sourceScaleComparison.find((row) => row.metric === "rated_critiques").lmcaValue, 951);
  assert.equal(comparison.positionSourceComparison.find((row) => row.sourceCategory === "magazine_blog_forum_derived").status, "missing_from_seed");
  assert.equal(comparison.topicFamilyComparison.find((row) => row.topicFamily === "decision_theory").status, "missing_from_seed");
  assert.equal(comparison.raterCompositionComparison.status, "seed_rater_composition_not_comparable");
  assert.equal(comparison.modelDenominatorComparison.find((row) => row.metric === "custom_metric_dialogues").lmcaValue, 933);
  assert.equal(comparison.modelScoreAnchorComparison.anchorCount, 7);
  assert.equal(comparison.targetLabelComparison.status, "lmca_style_not_target_identical");
  assert.equal(comparison.validationHumanCeilingComparison.status, "numeric_baselines_declared_but_seed_validation_thin");
});

function round(value) {
  return Math.round(value * 1000) / 1000;
}
