import {
  RATER_ISSUE_FLAG_DEFINITIONS,
  RUBRIC_DIMENSIONS,
  adjudicationMemos,
  appendRatingRevision,
  assignments,
  buildCommonMaps,
  buildAdjudicationMemoAuditReport,
  buildOctoberReleaseReport,
  buildPairwiseComparisonSnapshot,
  buildReleaseGateProfile,
  createBlindRatingView,
  createExportManifest,
  createLabelSnapshot,
  critiques,
  customWeightedLossForDataset,
  detectEscalations,
  derivedUtilityPairwiseErrorRateByPosition,
  dimensionGuidance,
  evaluateReleaseGateProfile,
  fullRubricEvaluationRun,
  overallOnlyEvaluationRun,
  pairwiseMarginDistribution,
  positions,
  postLockSourceStyleAudits,
  ratingContextSnapshots,
  seedRatings,
  summarizeAdjudication,
  unweightedPairwiseErrorRateByPosition,
  verificationRecords,
  weightedPairwiseErrorRateByPosition,
} from "./domain/core.mjs";

const releaseId = "october-2026-demo";
const root = document.getElementById("root");
const initialSection = new URLSearchParams(window.location.search).get("section") ?? "rating";

const state = {
  section: initialSection,
  selectedAssignmentId: assignments[0].id,
  ratings: structuredClone(seedRatings),
  sourceStyleAudits: structuredClone(postLockSourceStyleAudits),
  draftScores: {
    centrality: 0.5,
    strength: 0.5,
    correctness: 0.75,
    clarity: 0.8,
    dead_weight: 0.1,
    single_issue: 0.85,
    overall: 0.5,
  },
  draftFlags: {
    needsVerification: false,
    correctnessNotAssessableDueToClarity: false,
    insufficientTopicExpertise: false,
    strengthCentralityAllocationAmbiguity: false,
    correctnessWeightingIssue: false,
    clarityAfterEffortIssue: false,
    clearlyUnsatisfactoryImprecision: false,
    contentFreePseudoSubstance: false,
    obfuscatedArgumentRisk: false,
    strengthCentralityProductInvariance: false,
    inBetweenSingleIssueSideIssue: false,
    bottomLineDependence: false,
    midRangeStrengthUncertainty: false,
    backgroundKnowledgeDependence: false,
    vagueGoodObjectionGesture: false,
    disagreementTaxonomyReview: false,
  },
  draftVerification: {
    status: "not_needed",
    note: "No separate check needed.",
  },
  session: null,
  adminSession: null,
  sessionStatus: { tone: "warn", title: "Demo session pending", detail: "Requesting a signed local session." },
  certificationStatus: null,
  lastCertificationStatus: null,
  hiddenBenchmarkFreezeReport: null,
  lastBenchmarkStatus: null,
  lastPersistenceStatus: null,
  lastSourceStyleAuditStatus: null,
};

const navItems = [
  ["queue", "Queue", "clipboard"],
  ["rating", "Blind Rating", "eye"],
  ["adjudication", "Adjudication", "scale"],
  ["releases", "Releases", "shield"],
  ["evaluation", "Evaluation", "chart"],
  ["governance", "Governance", "database"],
  ["exports", "Exports", "download"],
];

const raterIssueFlags = RATER_ISSUE_FLAG_DEFINITIONS;

function render() {
  const selectedAssignment = assignments.find((assignment) => assignment.id === state.selectedAssignmentId) ?? assignments[0];
  const labelSnapshot = createLabelSnapshot(
    "snapshot-oct-demo",
    releaseId,
    state.ratings,
    critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
    "initial_only",
  );
  const releaseGateProfile = buildReleaseGateProfile(releaseId);
  const gateSummary = evaluateReleaseGateProfile(releaseGateProfile);
  const commonMaps = buildCommonMaps(labelSnapshot, fullRubricEvaluationRun);
  const pairwiseSnapshot = buildPairwiseComparisonSnapshot(
    "pairwise-oct-demo",
    labelSnapshot.id,
    labelSnapshot.targetLabelVersion,
    commonMaps.humanOveralls,
  );
  const marginDistribution = pairwiseMarginDistribution(pairwiseSnapshot);
  const weightedPairwise = weightedPairwiseErrorRateByPosition(commonMaps.humanOveralls, commonMaps.modelOveralls);
  const unweightedPairwise = unweightedPairwiseErrorRateByPosition(commonMaps.humanOveralls, commonMaps.modelOveralls);
  const customLoss = customWeightedLossForDataset(commonMaps.humanFullRatings, commonMaps.modelFullRatings);
  const derivedUtility = derivedUtilityPairwiseErrorRateByPosition(commonMaps.humanFullByPosition, commonMaps.modelFullByPosition);
  const manifests = ["public", "internal", "hidden_benchmark", "training"].map((kind) =>
    createExportManifest(kind, releaseId, positions, critiques, labelSnapshot),
  );
  const releaseReport = buildOctoberReleaseReport(releaseId, labelSnapshot, state.ratings, positions, critiques, undefined, undefined, state.sourceStyleAudits);

  root.innerHTML = `
    <div class="appShell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brandMark">L</div>
          <div><strong>LMCA Ops</strong><span>Volunteer annotation</span></div>
        </div>
        <nav>${navItems.map(([id, label, iconName]) => navButton(id, label, iconName)).join("")}</nav>
        <div class="sidebarFooter">${icon("lock")}<span>Hidden benchmark metadata stays admin-only before lock.</span></div>
      </aside>
      <main class="workspace">
        ${header(gateSummary, labelSnapshot)}
        ${sectionHtml(state.section, {
          selectedAssignment,
          labelSnapshot,
          releaseGateProfile,
          gateSummary,
          marginDistribution,
          weightedPairwise,
          unweightedPairwise,
          customLoss,
          derivedUtility,
          pairwiseSnapshot,
          manifests,
          releaseReport,
        })}
      </main>
    </div>
  `;
  bindEvents({ selectedAssignment, labelSnapshot, manifests, releaseReport });
}

function sectionHtml(section, context) {
  if (section === "queue") return queuePanel();
  if (section === "rating") {
    return ratingPanel(
      context.selectedAssignment,
      context.labelSnapshot,
      context.releaseGateProfile.sourceCriticalCore,
      state.lastPersistenceStatus,
      state.sessionStatus,
      state.lastSourceStyleAuditStatus,
    );
  }
  if (section === "adjudication") return adjudicationPanel(context.releaseReport.adjudicationMemoAudit);
  if (section === "releases") return releasePanel(context.releaseGateProfile, context.labelSnapshot, context.marginDistribution, context.releaseReport);
  if (section === "evaluation") {
    return evaluationPanel(
      context.weightedPairwise,
      context.unweightedPairwise,
      context.customLoss,
      context.derivedUtility,
      context.pairwiseSnapshot,
      context.marginDistribution,
      context.releaseReport,
    );
  }
  if (section === "governance") {
    return governancePanel(
      context.releaseReport,
      state.certificationStatus,
      state.lastCertificationStatus,
      state.hiddenBenchmarkFreezeReport,
      state.lastBenchmarkStatus,
    );
  }
  return exportsPanel(
    context.manifests,
    context.labelSnapshot,
    context.releaseReport.trainingExport,
    context.releaseReport.labelChannelSeparation,
    context.releaseReport.rubricQaCoverage,
    context.releaseReport.sourceExampleAnchors,
  );
}

function header(gateSummary, labelSnapshot) {
  return `
    <header class="topbar">
      <div>
        <h1>October 2026 Method-Preserving Release</h1>
        <p>Claim-gated LMCA volunteer platform with blind ratings, frozen snapshots, and separate metric families.</p>
      </div>
      <div class="topbarStats">
        ${stat("Core gates", `${gateSummary.passCount} pass`, "good")}
        ${stat("Snapshot", humanize(labelSnapshot.targetLabelVersion))}
        ${stat("Deferred diagnostics", String(gateSummary.deferredCount), "warn")}
      </div>
    </header>
  `;
}

function queuePanel() {
  return `
    <section class="panel">
      ${panelTitle("clipboard", "Queue Mix", "Conservative seed mix with live, validation, duplicate, gold, and benchmark-candidate routes.")}
      <div class="queueGrid">
        ${queueMixCard("Early queue default", ["70% live", "20% gold", "10% duplicate"])}
        ${queueMixCard("Recertified default", ["80% live", "10% gold", "10% duplicate"])}
        ${queueMixCard("Tier-zero certification", ["20 gold", "5 duplicate", "5 hard-ambiguity"])}
      </div>
      ${assignmentTable()}
    </section>
  `;
}

function ratingPanel(assignment, labelSnapshot, gateChecks, persistenceStatus, sessionStatus, sourceStyleStatus) {
  const activeView = createBlindRatingView(assignment, positions, critiques);
  const itemRatings = state.ratings.filter((rating) => rating.positionId === assignment.positionId && rating.critiqueId === assignment.critiqueId);
  const triggers = detectEscalations(itemRatings);
  const itemLabel = labelSnapshot.itemLabels[`${assignment.positionId}::${assignment.critiqueId}`];
  const lockedInitialRating = lockedInitialRatingForAssignment(assignment);
  const sourceStyleAuditRows = state.sourceStyleAudits.filter((audit) => audit.ratingId === lockedInitialRating?.id);
  const itemVerification = verificationRecordForAssignment(assignment);
  const itemContext = contextSnapshotForAssignment(assignment);
  return `
    <div class="ratingLayout">
      <section class="panel ratingEditor">
        ${panelTitle("eye", "Blind Rating Workspace", "Rater-visible text excludes source, tags, benchmark status, peer ratings, model-judge scores, and intake reasons.")}
        <div class="blindNotice">${icon("eye")}<span>Hidden before initial submission: ${escapeHtml(activeView.hiddenMetadata.join(", "))}.</span></div>
        ${statusLine(sessionStatus, "sessionLine")}
        <div class="textPair">
          <article><h2>Position</h2><p>${escapeHtml(activeView.positionText)}</p></article>
          <article><h2>Critique</h2><p>${escapeHtml(activeView.critiqueText)}</p></article>
        </div>
        <div class="rubricGrid">${RUBRIC_DIMENSIONS.map(sliderRow).join("")}</div>
        ${issueFlagControls()}
        ${verificationControls()}
        <div class="actionRow">
          <button class="primaryButton" id="submitRating" type="button">${icon("check")}Submit blind rating</button>
          <button class="secondaryButton" id="appendRevision" type="button">${icon("branch")}Append self-check revision</button>
        </div>
        ${persistenceLine(persistenceStatus)}
      </section>
      <aside class="rightRail">
        <section class="panel compactPanel">
          ${panelTitle("shield", "Item Status", `${itemRatings.length} rating rows, originals preserved`)}
          ${metricList([
            ["Label status", humanize(itemLabel?.finalLabelStatus ?? "pending")],
            ["Raters", String(itemLabel?.raterCount ?? 0)],
            ["Expert count", String(itemLabel?.expertCount ?? 0)],
            ["Initial spread", formatNumber(itemLabel?.spreadPreDiscussion)],
            ["Post-discussion spread", formatNumber(itemLabel?.spreadPostDiscussion)],
            ["Verification", humanize(itemVerification?.verificationStatus ?? "not_needed")],
            ["Context", humanize(itemContext?.policy ?? "missing")],
            ["Sibling exposure", humanize(itemContext?.siblingExposurePattern ?? "missing")],
          ])}
          ${
            triggers.length
              ? `<div class="warningList">${triggers.map((trigger) => `<div>${icon("alert")}<span>${escapeHtml(trigger)}</span></div>`).join("")}</div>`
              : `<div class="okLine">${icon("check")}No automatic escalation trigger.</div>`
          }
        </section>
        ${postLockSourceStylePanel(lockedInitialRating, sourceStyleAuditRows, sourceStyleStatus)}
        <section class="panel compactPanel">
          ${panelTitle("key", "Source-Critical Gates", "Must pass for method-preserving claims")}
          <div class="gateList">${gateChecks.map((check) => `<div>${statusChip(check.status)}<span>${escapeHtml(check.label)}</span></div>`).join("")}</div>
        </section>
      </aside>
    </div>
  `;
}

function lockedInitialRatingForAssignment(assignment) {
  const actorId = state.session?.user?.id ?? "demo-rater";
  return state.ratings
    .filter(
      (rating) =>
        rating.assignmentId === assignment.id &&
        rating.positionId === assignment.positionId &&
        rating.critiqueId === assignment.critiqueId &&
        rating.raterId === actorId &&
        rating.kind === "blind_initial" &&
        rating.lockedAt,
    )
    .sort((left, right) => String(left.lockedAt).localeCompare(String(right.lockedAt)))
    .at(-1);
}

function verificationRecordForAssignment(assignment) {
  return verificationRecords
    .filter((record) => record.positionId === assignment.positionId && record.critiqueId === assignment.critiqueId)
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)) || String(left.id).localeCompare(String(right.id)))
    .at(-1);
}

function contextSnapshotForAssignment(assignment) {
  return (
    ratingContextSnapshots.find(
      (snapshot) => snapshot.positionId === assignment.positionId && snapshot.visibleCritiqueIds.includes(assignment.critiqueId),
    ) ?? null
  );
}

function postLockSourceStylePanel(lockedInitialRating, sourceStyleAuditRows, sourceStyleStatus) {
  if (!lockedInitialRating) return "";
  const latestAudit = sourceStyleAuditRows.at(-1);
  return `
    <section class="panel compactPanel">
      ${panelTitle("eye", "Post-Lock Source/Style Audit", "Optional source, authorship, and style guesses are diagnostic-only after rating lock.")}
      ${metricList([
        ["Locked rating", lockedInitialRating.id],
        ["Collected audits", String(sourceStyleAuditRows.length)],
        ["Last source guess", latestAudit?.sourceGuess ? humanize(latestAudit.sourceGuess) : "not submitted"],
        ["Scoring use", latestAudit?.usedForScoring === false ? "blocked" : "diagnostic-only"],
      ])}
      <div class="actionRow">
        <button class="secondaryButton" id="submitSourceStyleAudit" type="button">${icon("eye")}Submit source/style audit</button>
      </div>
      ${statusLine(sourceStyleStatus, "persistenceLine")}
    </section>
  `;
}

function adjudicationPanel(adjudicationAudit) {
  adjudicationAudit ??= buildAdjudicationMemoAuditReport(
    releaseId,
    createLabelSnapshot(
      "snapshot-oct-demo",
      releaseId,
      state.ratings,
      critiques.map((critique) => ({ positionId: critique.positionId, critiqueId: critique.id })),
      "initial_only",
    ),
    state.ratings,
    positions,
    critiques,
  );
  const taxonomy = summarizeAdjudication(adjudicationMemos);
  return `
    <div class="twoColumn">
      <section class="panel">
        ${panelTitle("scale", "Escalation And Adjudication", "Disagreement is preserved with structured taxonomy instead of hidden by averaging.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Memos", String(adjudicationAudit.counts.memoCount), humanize(adjudicationAudit.releaseUseStatus))}
          ${metricCard("Ambiguity complete", `${adjudicationAudit.counts.completeAmbiguityMemoCount}/${adjudicationAudit.counts.ambiguousMemoCount}`, "worst-plausible fields")}
          ${metricCard("Bottom-line items", String(adjudicationAudit.counts.bottomLineDependentItemCount), `${adjudicationAudit.counts.minorityRationaleCount} minority rationales`)}
          ${metricCard("Imprecision/obfuscation", `${adjudicationAudit.counts.clearlyUnsatisfactoryImprecisionItemCount}/${adjudicationAudit.counts.obfuscatedOrMaskedFallacyItemCount}`, "reported separately")}
        </div>
        <div class="memoList">
          ${adjudicationMemos
            .map(
              (memo) => `
                <article class="memo">
                  <header><strong>${escapeHtml(memo.id)}</strong>${statusChip(memo.benchmarkEligibilityDecision)}</header>
                  <p>${escapeHtml(memo.contestedInterpretation)}</p>
                  <dl>
                    <dt>Plausible interpretations</dt><dd>${escapeHtml(memo.plausibleInterpretations.join("; "))}</dd>
                    <dt>Worst plausible</dt><dd>${escapeHtml(memo.worstPlausibleInterpretationConsidered ?? "not recorded")}</dd>
                    <dt>Critique refutes</dt><dd>${escapeHtml((memo.critiqueRefutesInterpretations ?? []).join("; ") || "none recorded")}</dd>
                    <dt>Adversarial weighting</dt><dd>${escapeHtml(memo.adversarialPlausibilityWeightingDecision)}</dd>
                    <dt>Minority rationales</dt><dd>${escapeHtml((memo.minorityRationales ?? []).map((row) => row.rationale).join("; ") || "none")}</dd>
                    <dt>Verification</dt><dd>${escapeHtml(memo.correctnessVerificationSummary)}</dd>
                  </dl>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("alert", "Routing Triggers", "Default thresholds are configurable project policies, not hidden hard-coded LMCA claims.")}
        <div class="triggerTable">
          ${critiques
            .map((critique) => {
              const itemRatings = state.ratings.filter((rating) => rating.critiqueId === critique.id);
              const triggers = detectEscalations(itemRatings);
              return `<div class="triggerRow"><span>${escapeHtml(critique.id)}</span><strong>${triggers.length}</strong><em>${escapeHtml(triggers[0] ?? "no trigger")}</em></div>`;
            })
            .join("")}
        </div>
        <div class="taxonomyBox">
          <h3>Disagreement Taxonomy</h3>
          ${Object.entries(taxonomy).map(([key, value]) => `<div><span>${humanize(key)}</span><strong>${value}</strong></div>`).join("")}
        </div>
      </section>
    </div>
  `;
}

function releasePanel(profile, labelSnapshot, marginDistribution, releaseReport) {
  const checks = [...profile.sourceCriticalCore, ...profile.benchmarkQualitySafeguards, ...profile.claimGatedDiagnostics];
  const reliability = labelSnapshot.reliabilityWeightModel;
  const corpusManifest = releaseReport.corpusManifest;
  const composition = corpusManifest.positionSourceCategory;
  const sourceDetail = corpusManifest.sourceDetailCoverage;
  const itemText = releaseReport.itemTextViewParity;
  const debateBench = corpusManifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "DebateBench");
  const vivesDebate = corpusManifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "VivesDebate");
  const lsat = corpusManifest.knownAdaptedSubsourceRows.find((row) => row.subsource === "LSAT-derived");
  return `
    <div class="releaseLayout">
      <section class="panel">
        ${panelTitle("shield", "Release Gate Profile", "Source-critical core, benchmark-quality safeguards, and claim-gated diagnostics are tracked separately.")}
        <div class="gateGrid">
          ${checks
            .map(
              (check) => `
                <article class="gateCard">
                  ${statusChip(check.status)}
                  <h3>${escapeHtml(check.label)}</h3>
                  <p>${escapeHtml(check.evidence)}</p>
                  ${check.notRunRationale ? `<small>${escapeHtml(check.notRunRationale)}</small>` : ""}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <aside class="rightRail">
        <section class="panel compactPanel">
          ${panelTitle("database", "Denominators", "Revisions and checks cannot inflate blind-rater coverage")}
          ${metricList([
            ["Blind initial", String(labelSnapshot.denominatorCounts.blindInitialRatings)],
            ["Revisions", String(labelSnapshot.denominatorCounts.revisions)],
            ["Self-checks", String(labelSnapshot.denominatorCounts.selfChecks)],
            ["Expert checks", String(labelSnapshot.denominatorCounts.expertChecks)],
            ["Model-assisted checks", String(labelSnapshot.denominatorCounts.modelAssistedChecks)],
            ["Adjudication labels", String(labelSnapshot.denominatorCounts.adjudicationLabels)],
          ])}
        </section>
        <section class="panel compactPanel">
          ${panelTitle("key", "Label Reliability", "Uniform rater weights are frozen with protected-fit exclusion and median sensitivity.")}
          ${metricList([
            ["Weight model", humanize(reliability.modelFamily)],
            ["Fit ratings", String(reliability.fitDataProvenance.fitRatingCount)],
            ["Protected fit use", String(reliability.fitDataProvenance.protectedRatingsUsedForFit)],
            ["Max rater share", formatNumber(reliability.effectiveContribution.maxSingleRaterContributionShare)],
            ["Max median delta", `${formatNumber(reliability.sensitivitySummary.maxOverallMeanMedianDelta)} on ${reliability.sensitivitySummary.maxOverallMeanMedianDeltaItemId}`],
            ["Release use", humanize(reliability.releaseUseStatus)],
          ])}
        </section>
        <section class="panel compactPanel">
          ${panelTitle("archive", "Corpus Manifest", "LMCA source-scale comparison fields are first-class")}
          ${metricList([
            ["Positions loaded", String(positions.length)],
            ["Critiques loaded", String(critiques.length)],
            ["Hidden benchmark positions", String(positions.filter((position) => position.split === "hidden_benchmark").length)],
            ["Low-margin pair share", `${Math.round(marginDistribution.lowMarginPairShare * 100)}%`],
          ])}
          <div class="composition">${Object.entries(composition).map(([key, value]) => `<div><span>${humanize(key)}</span><strong>${value}</strong></div>`).join("")}</div>
        </section>
        <section class="panel compactPanel">
          ${panelTitle("archive", "Source Detail Manifest", "Adapted-source language, translation, task format, and suitability metadata are declared.")}
          ${metricList([
            ["Detail rows", `${sourceDetail.completeRows}/${sourceDetail.rowCount}`],
            ["Coverage status", humanize(sourceDetail.status)],
            ["Source language", Object.entries(sourceDetail.bySourceLanguage).map(([key, value]) => `${humanize(key)} ${value}`).join(", ")],
            ["Translation", Object.entries(sourceDetail.byTranslationStatus).map(([key, value]) => `${humanize(key)} ${value}`).join(", ")],
            ["DebateBench", `${debateBench?.releaseCount ?? 0}/${debateBench?.lmcaCount ?? 0} release/LMCA`],
            ["VivesDebate", humanize(vivesDebate?.translationRoute ?? "missing")],
            ["LSAT-derived", humanize(lsat?.sourceDomainSuitability ?? "missing")],
          ])}
        </section>
        <section class="panel compactPanel">
          ${panelTitle("key", "Item Text View Parity", "Human ratings and model predictions bind to the same frozen text-version hashes.")}
          ${metricList([
            ["Rating rows", `${itemText.counts.frozenRatingTextVersionRows}/${itemText.counts.ratingRows}`],
            ["Model rows", `${itemText.counts.evaluationRowsWithViewParity}/${itemText.counts.evaluationPredictionRows}`],
            ["Sensitive rows", String(itemText.counts.textViewSensitiveRows)],
            ["Release use", humanize(itemText.releaseUseStatus)],
            ["Rating rule", itemText.policy.ratingRule],
          ])}
        </section>
      </aside>
    </div>
  `;
}

function evaluationPanel(weightedPairwise, unweightedPairwise, customLoss, derivedUtility, pairwiseSnapshot, marginDistribution, releaseReport) {
  const distribution = releaseReport.humanScoreDistribution;
  const baselines = releaseReport.sanityBaselines;
  const leaderboard = releaseReport.leaderboardReport;
  const metricConfig = releaseReport.metricDirectionalityConfig;
  const modelAssistedOverlap = releaseReport.modelAssistedLabelOverlap ?? leaderboard.modelAssistedLabelOverlap;
  const pairedTargets = releaseReport.pairedTargetLabelSnapshots;
  const generationEvaluation = releaseReport.critiqueGenerationEvaluation;
  const calibration = releaseReport.recalibratedEvaluation;
  const promptTrack = releaseReport.promptTrackSeparation;
  const generationRun = generationEvaluation.runRows[0];
  const failureAudit = releaseReport.modelFailureAudits.find((audit) => audit.evaluationRunId === fullRubricEvaluationRun.id) ?? releaseReport.modelFailureAudits[0];
  const randomPairwise = baselines.baselines.find((baseline) => baseline.baselineType === "random_pairwise");
  const priorOnly = baselines.baselines.find((baseline) => baseline.baselineType === "prior_only_train_dev");
  const topFailure = failureAudit?.topCustomLossRows[0] ?? failureAudit?.largestOverallDisagreements[0];
  const claimDiagnostics = failureAudit?.claimGatedDiagnostics;
  const sycophancyDiagnostic = claimDiagnostics?.suites.find((suite) => suite.id === "sycophancy_orthodoxy_sensitivity");
  const obfuscationDiagnostic = claimDiagnostics?.suites.find((suite) => suite.id === "obfuscated_argument_stress");
  return `
    <div class="evaluationLayout">
      <section class="panel">
        ${panelTitle("chart", "Metric Families", "Weighted pairwise, custom weighted loss, unweighted pairwise, and derived-utility diagnostics remain separate.")}
        <div class="metricCards">
          ${metricCard("Weighted pairwise", formatNumber(weightedPairwise.loss), `${weightedPairwise.coverage.nPairsScored} scored pairs`)}
          ${metricCard("Custom weighted loss", formatNumber(customLoss.loss), `${customLoss.coverage.nItemsScored} item-level labels`)}
          ${metricCard("Unweighted diagnostic", formatNumber(unweightedPairwise.loss), "Appendix-B/Kendall-style only")}
          ${metricCard("Derived utility diagnostic", formatNumber(derivedUtility.loss), "Full-rubric sensitivity only")}
        </div>
        <div class="metricTable">
          <div><span>Pairwise snapshot</span><strong>${escapeHtml(pairwiseSnapshot.id)}</strong></div>
          <div><span>Tie policy</span><strong>${humanize(pairwiseSnapshot.scoreRoundingPolicy)}, tolerance ${pairwiseSnapshot.tieTolerance}</strong></div>
          <div><span>No-pair exclusions</span><strong>${escapeHtml(pairwiseSnapshot.excludedNoPairPositions.join(", ") || "none")}</strong></div>
          <div><span>Low-margin share</span><strong>${Math.round(marginDistribution.lowMarginPairShare * 100)}% of pairs / ${Math.round(marginDistribution.lowMarginWeightShare * 100)}% of weight</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("flask", "Evaluation Provenance", "Overall-only runs never fabricate full-rubric subscores.")}
        ${runCard(overallOnlyEvaluationRun, false)}
        ${runCard(fullRubricEvaluationRun, true)}
      </section>
      <section class="panel">
        ${panelTitle("sliders", "Metric Config & Directionality", "Pairwise ranking, leaderboard, and custom-loss reports declare score handling before comparison claims.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Config rows", String(metricConfig.counts.pairwiseConfigRows), `${metricConfig.counts.configViolationCount} violations`)}
          ${metricCard("Direction rows", String(metricConfig.counts.directionalityRows), `${metricConfig.counts.directionalityViolationCount} violations`)}
          ${metricCard("Release use", humanize(metricConfig.releaseUseStatus), humanize(metricConfig.pairwiseConfigRows[0]?.commonMetricConfigStatus ?? "missing"))}
          ${metricCard("Human ties", String(metricConfig.pairwiseConfigRows[0]?.humanTieTolerance ?? "n/a"), humanize(metricConfig.pairwiseConfigRows[0]?.humanTiePolicy ?? "missing"))}
        </div>
        <div class="metricTable">
          <div><span>Score rounding</span><strong>${humanize(metricConfig.pairwiseConfigRows[0]?.scoreRoundingPolicy ?? "missing")}</strong></div>
          <div><span>Score quantization</span><strong>${humanize(metricConfig.pairwiseConfigRows[0]?.scoreQuantizationPolicy ?? "missing")}</strong></div>
          <div><span>Model ties</span><strong>${metricConfig.pairwiseConfigRows[0]?.modelTieTolerance ?? "n/a"} / ${humanize(metricConfig.pairwiseConfigRows[0]?.modelTiePolicy ?? "missing")}</strong></div>
          <div><span>Custom-loss direction</span><strong>${humanize(metricConfig.directionalityRows[0]?.directionality ?? "missing")}</strong></div>
          <div><span>Final-average target</span><strong>${metricConfig.policy.finalAverageRule}</strong></div>
        </div>
        <div class="failureList">
          ${metricConfig.pairwiseConfigRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.commonMetricConfigStatus)}<strong>${humanize(row.surface)}</strong></header>
                  ${metricList([
                    ["Metric", humanize(row.metricFamily)],
                    ["Rounding", humanize(row.scoreRoundingPolicy)],
                    ["Quantization", humanize(row.scoreQuantizationPolicy)],
                    ["Tie tolerance", `${row.humanTieTolerance} human / ${row.modelTieTolerance} model`],
                    ["Evidence", row.evidence],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("key", "Prompt Track Separation", "Appendix-G exact baseline, project full-rubric, generation, and model-judge prompts are reported as separate tracks.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Prompt rows", String(promptTrack.counts.promptTrackRows), `${promptTrack.counts.evaluationPromptTrackRows} evaluation tracks`)}
          ${metricCard("Appendix-G exact", String(promptTrack.counts.appendixGExactRows), "source-comparable baseline")}
          ${metricCard("Project extensions", String(promptTrack.counts.projectExtensionRows), humanize(promptTrack.releaseUseStatus))}
          ${metricCard("Protected examples", String(promptTrack.counts.protectedExampleViolationCount), `${promptTrack.counts.promptExampleRows} example rows`)}
        </div>
        <div class="metricTable">
          <div><span>Appendix-G rule</span><strong>${promptTrack.policy.appendixGRule}</strong></div>
          <div><span>Protected-example rule</span><strong>${promptTrack.policy.protectedExampleRule}</strong></div>
          <div><span>Prompt scopes</span><strong>${Object.entries(promptTrack.byPromptScope)
            .map(([scope, count]) => `${humanize(scope)} ${count}`)
            .join(", ")}</strong></div>
        </div>
        <div class="failureList">
          ${promptTrack.rows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.sourceComparable ? "source_comparable" : "project_extension")}<strong>${escapeHtml(row.promptArtifactId)}</strong></header>
                  ${metricList([
                    ["Track", humanize(row.trackKind)],
                    ["Scope", humanize(row.promptScope)],
                    ["Checksum", row.renderedPromptChecksum],
                    ["Examples", humanize(row.promptExampleStatus)],
                    ["Protected exclusion", row.hiddenBenchmarkExamplesExcluded && row.protectedValidationExamplesExcluded ? "pass" : "review"],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("sliders", "Reasoning-Mode Sensitivity", "LMCA Table 6 anchors are preserved, but seed reasoning-mode claims require paired same-model runs.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Run rows", String(releaseReport.reasoningModeSensitivity.runRows.length), "reasoning metadata preserved")}
          ${metricCard("Table 6 anchors", String(releaseReport.reasoningModeSensitivity.table6SourceBaseline.length), humanize(releaseReport.reasoningModeSensitivity.table6BaselineComparabilityStatus))}
          ${metricCard("Paired comparisons", String(releaseReport.reasoningModeSensitivity.pairedComparisons.length), humanize(releaseReport.reasoningModeSensitivity.status))}
          ${metricCard("Release use", humanize(releaseReport.reasoningModeSensitivity.releaseUseStatus), "no unpaired thinking claim")}
        </div>
        <div class="metricTable">
          <div><span>Full-rubric mode</span><strong>${humanize(releaseReport.reasoningModeSensitivity.runRows[0]?.reasoningMode ?? "unknown")}</strong></div>
          <div><span>Overall-only mode</span><strong>${humanize(releaseReport.reasoningModeSensitivity.runRows[1]?.reasoningMode ?? "unknown")}</strong></div>
          <div><span>Overall item role</span><strong>${humanize(releaseReport.reasoningModeSensitivity.runRows[1]?.itemRoleTerminology ?? "unknown")}</strong></div>
          <div><span>Deferred rationale</span><strong>${releaseReport.reasoningModeSensitivity.deferredRationale ?? "paired report available"}</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("archive", "Critique-Generation Evaluation", "Generator performance is reported separately from critique-rating and model-judge screening, with all output statuses counted.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Generated", String(generationEvaluation.aggregateCounts.generatedOutputs), `${generationRun.generationBudgetPerPosition} per position`)}
          ${metricCard("Promoted", `${generationEvaluation.aggregateCounts.promotedToRating}/${generationEvaluation.aggregateCounts.generatedOutputs}`, `${generationEvaluation.aggregateCounts.blindHumanRatedPromoted} blind-rated`)}
          ${metricCard("Failures/filters", String(generationEvaluation.aggregateCounts.emptyOrRefusal + generationEvaluation.aggregateCounts.duplicatesFiltered + generationEvaluation.aggregateCounts.filteredBeforeRating), "empty, duplicate, filtered")}
          ${metricCard("Release use", humanize(generationEvaluation.releaseUseStatus), "generation vs judging separated")}
        </div>
        <div class="metricTable">
          <div><span>Generator snapshot</span><strong>${escapeHtml(generationRun.resolvedModelSnapshot)}</strong></div>
          <div><span>Prompt artifact</span><strong>${escapeHtml(generationRun.promptArtifact?.id ?? "missing")}</strong></div>
          <div><span>Prompt checksum</span><strong>${generationRun.renderedPromptChecksum}</strong></div>
          <div><span>Prompt policy</span><strong>${humanize(generationRun.promptPolicyComparabilityStatus)}</strong></div>
          <div><span>Mean rated overall</span><strong>${formatNumber(generationRun.qualityMetrics.ratedPromotedOverall.mean)}</strong></div>
          <div><span>Model-judge scores</span><strong>${generationEvaluation.generationVsJudgingSeparation.modelJudgeScoresDiagnosticOnly ? "diagnostic only" : "release-label risk"}</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("rank", "Uncertainty-Aware Leaderboard", "Cross-model ordering is reported on a common item set with paired-difference intervals before any rank claim.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Runs", String(leaderboard.rows.length), leaderboard.metricFamily)}
          ${metricCard("Common items", String(leaderboard.commonItemIds.length), `${leaderboard.commonPositionIds.length} positions`)}
          ${metricCard("Rank tiers", String(leaderboard.uncertaintySupportedRankTiers.length), humanize(leaderboard.uncertaintySupportedRankTiers[0]?.status ?? "none"))}
          ${metricCard("Release use", humanize(leaderboard.releaseUseStatus), `${leaderboard.unresolvedComparisonGroups.length} unresolved groups`)}
        </div>
        <div class="metricTable">
          <div><span>Pairwise snapshot</span><strong>${escapeHtml(leaderboard.pairwiseComparisonSnapshot.id)}</strong></div>
          <div><span>Paired interval</span><strong>${humanize(leaderboard.uncertaintyPolicy.intervalType)}, ${Math.round(leaderboard.uncertaintyPolicy.nominalLevel * 100)}%</strong></div>
          <div><span>Practical threshold</span><strong>${formatNumber(leaderboard.commonMetricConfig.practicalDifferenceThreshold)}</strong></div>
          <div><span>Prompt comparability</span><strong>${humanize(leaderboard.promptComparability.status)}</strong></div>
        </div>
        <div class="failureList">
          ${leaderboard.rows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip("point_estimate")}<strong>${escapeHtml(row.requestedModelAlias)}</strong></header>
                  ${metricList([
                    ["Point estimate", formatNumber(row.pointEstimate)],
                    ["Interval", `${formatNumber(row.interval.lower)} to ${formatNumber(row.interval.upper)}`],
                    ["Common pairs", String(row.coverage.nPairsScored)],
                    ["Prompt scope", humanize(row.promptScope)],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("shield", "Model-Assisted Label Overlap", "Evaluation reports flag whether any judged model or close family helped produce the target labels.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Assisted target rows", String(modelAssistedOverlap.counts.targetModelAssistedRatingRows), `${modelAssistedOverlap.counts.overlapSensitiveRunCount} overlap-sensitive runs`)}
          ${metricCard("Release use", humanize(modelAssistedOverlap.releaseUseStatus), "clean-claim gate")}
          ${metricCard("Human-only target", escapeHtml(modelAssistedOverlap.humanOnlyPreAssistanceTarget.id), `${modelAssistedOverlap.humanOnlyPreAssistanceTarget.excludedModelAssistedRows} assisted rows excluded`)}
          ${metricCard("Same as target", modelAssistedOverlap.humanOnlyPreAssistanceTarget.sameAsTargetLabelSnapshot ? "yes" : "no", "pre-assistance snapshot")}
        </div>
        <div class="metricTable">
          <div><span>Close-family rule</span><strong>${modelAssistedOverlap.policy.closeModelFamilyDefinition}</strong></div>
          <div><span>Independent evidence</span><strong>${modelAssistedOverlap.policy.modelAssistedRowsIndependentHumanEvidence ? "yes" : "no"}</strong></div>
          <div><span>Pre-assistance policy</span><strong>${modelAssistedOverlap.policy.preAssistanceTargetPolicy}</strong></div>
        </div>
        <div class="failureList">
          ${modelAssistedOverlap.runRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.status)}<strong>${escapeHtml(row.requestedModelAlias)}</strong></header>
                  ${metricList([
                    ["Family", humanize(row.modelFamily ?? "unknown")],
                    ["Overlap rows", String(row.overlappingAssistedRatingCount)],
                    ["Clean claim", humanize(row.cleanClaimStatus)],
                    ["Human-only target", row.humanOnlyPreAssistanceTargetSnapshotId],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("key", "Paired Target Labels", "Primary-rater-anchor and consensus snapshots are reported side by side so LMCA Table-5-style target claims stay distinct.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Primary anchor", pairedTargets.primaryRaterAnchorSnapshot.primaryRaterAnchor.raterId, humanize(pairedTargets.primaryRaterAnchorSnapshot.primaryRaterAnchor.selectionPolicy))}
          ${metricCard("Overlap", `${pairedTargets.coverageOverlap.overlapItemCount}/${pairedTargets.coverageOverlap.consensusScoredItemCount}`, "primary vs consensus scored items")}
          ${metricCard("Rank sensitivity", humanize(pairedTargets.rankSensitivity.status), humanize(pairedTargets.rankSensitivity.itemSubsetPolicy))}
          ${metricCard("Post-hoc switch", pairedTargets.claimPolicy.postHocAnchorSwitchingAllowed ? "allowed" : "blocked", "target-identical claims")}
        </div>
        <div class="metricTable">
          <div><span>Primary snapshot</span><strong>${escapeHtml(pairedTargets.primaryRaterAnchorSnapshot.id)}</strong></div>
          <div><span>Consensus snapshot</span><strong>${escapeHtml(pairedTargets.consensusSnapshot.id)}</strong></div>
          <div><span>Consensus use</span><strong>${humanize(pairedTargets.claimPolicy.consensusSnapshotUse)}</strong></div>
          <div><span>Forbidden anchor criteria</span><strong>${pairedTargets.primaryRaterAnchorSnapshot.primaryRaterAnchor.prohibitedPostHocCriteria.map(humanize).join(", ")}</strong></div>
        </div>
        <div class="failureList">
          ${pairedTargets.targetLabelDeltas
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip("target_delta")}<strong>${escapeHtml(row.itemId)}</strong></header>
                  ${metricList([
                    ["Primary overall", formatNumber(row.primaryOverall)],
                    ["Consensus overall", formatNumber(row.consensusOverall)],
                    ["Delta", formatNumber(row.primaryMinusConsensusOverall)],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("database", "Human Score Distribution", "Human-label priors are reported by split and strata so calibration-sensitive losses remain interpretable.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Overall mean", formatNumber(distribution.overall.overall.mean), `${distribution.overall.itemCount} labelled items`)}
          ${metricCard("Overall median", formatNumber(distribution.overall.overall.median), `spread ${formatNumber(distribution.overall.overall.spread)}`)}
          ${metricCard("Public-train items", String(distribution.bySplit.public_train?.itemCount ?? 0), "fit-eligible split")}
          ${metricCard("Protected items", String((distribution.bySplit.internal_validation?.itemCount ?? 0) + (distribution.bySplit.hidden_benchmark?.itemCount ?? 0)), "reported, not fit")}
        </div>
        <div class="metricTable">
          <div><span>Correctness 0.8-1.0 bin</span><strong>${distribution.overall.dimensions.correctness.histogram["0.8-1.0"]}</strong></div>
          <div><span>Clarity low bin</span><strong>${distribution.overall.dimensions.clarity.histogram["0.2-0.4"]}</strong></div>
          <div><span>By source categories</span><strong>${Object.keys(distribution.bySourceCategory).join(", ")}</strong></div>
          <div><span>By topic families</span><strong>${Object.keys(distribution.byTopicFamily).join(", ")}</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("sliders", "Calibration Provenance", "Raw and recalibrated metrics stay separate, with protected validation and hidden benchmark excluded from fitting.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Fit split", calibration.calibrationArtifact.fitSplits.join(", "), `${calibration.calibrationArtifact.fitRows.length} fit rows`)}
          ${metricCard("Protected excluded", String(calibration.calibrationArtifact.protectedRowsExcludedFromFit), `${calibration.calibrationArtifact.protectedLeakageCount} fit leaks`)}
          ${metricCard("Raw custom loss", formatNumber(calibration.rawMetrics.customWeightedLoss.loss), `${calibration.rawMetrics.coverage.commonItems} common items`)}
          ${metricCard("Recalibrated loss", formatNumber(calibration.recalibratedMetrics.customWeightedLoss.loss), `delta ${formatNumber(calibration.metricDeltas.customWeightedLoss)}`)}
        </div>
        <div class="metricTable">
          <div><span>Transform</span><strong>${humanize(calibration.calibrationArtifact.transformationFamily)}</strong></div>
          <div><span>Overall intercept</span><strong>${formatNumber(calibration.calibrationArtifact.fittedParameters.overall.intercept)}</strong></div>
          <div><span>Target dimensions</span><strong>${String(calibration.calibrationArtifact.targetDimensions.length)} rubric dimensions</strong></div>
          <div><span>Release use</span><strong>${humanize(calibration.releaseUseStatus)}</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("archive", "Sanity Baselines", "Random, constant, and prior-only baselines are separate from conceptual-reasoning model runs.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Random pairwise", formatNumber(randomPairwise?.metricOutputs.loss), `${randomPairwise?.metricOutputs.coverage.nPairsScored ?? 0} pairs`)}
          ${metricCard("Prior-only loss", formatNumber(priorOnly?.metricOutputs.loss), `${priorOnly?.metricOutputs.coverage.nItemsScored ?? 0} scored labels`)}
          ${metricCard("Fit split", baselines.protectedSplitPolicy.fitSplits.join(", "), "protected splits excluded")}
          ${metricCard("Fit labels", String(baselines.fitDistribution.itemCount), `scored ${baselines.scoredDistribution.itemCount}`)}
        </div>
        <div class="metricTable">
          <div><span>Hidden fit excluded</span><strong>${baselines.protectedSplitPolicy.hiddenBenchmarkFitExcluded ? "yes" : "no"}</strong></div>
          <div><span>Validation fit excluded</span><strong>${baselines.protectedSplitPolicy.internalValidationFitExcluded ? "yes" : "no"}</strong></div>
          <div><span>Constant mean loss</span><strong>${formatNumber(baselines.baselines.find((baseline) => baseline.baselineType === "constant_mean")?.metricOutputs.loss)}</strong></div>
          <div><span>Constant median loss</span><strong>${formatNumber(baselines.baselines.find((baseline) => baseline.baselineType === "constant_median")?.metricOutputs.loss)}</strong></div>
        </div>
      </section>
      <section class="panel claimPanel">
        ${panelTitle("alert", "Model-Failure Audit", "Largest-error rows preserve raw outputs, parsed scores, prompt provenance, and protected-split exclusions without replacing aggregate metrics.")}
        <div class="metricCards">
          ${metricCard("Audited run", humanize(failureAudit.evaluationRunId), failureAudit.promptFamily)}
          ${metricCard("Top custom loss", formatNumber(topFailure?.errorMagnitude.customWeightedLoss), topFailure?.itemId ?? "none")}
          ${metricCard("Protected excluded", String(failureAudit.protectedSplitHandling.protectedPredictionCount), failureAudit.protectedSplitHandling.excludedProtectedSplits.join(", "))}
          ${metricCard("Parser failures", String(failureAudit.parserAudit.parseFailureCount), `${failureAudit.parserAudit.retryCount} retries`)}
        </div>
        <div class="metricTable">
          <div><span>Claim-Gated Diagnostics</span><strong>${humanize(claimDiagnostics?.releaseUseStatus ?? "missing")}</strong></div>
          <div><span>Sycophancy/orthodoxy</span><strong>${humanize(sycophancyDiagnostic?.status ?? "missing")}</strong></div>
          <div><span>Obfuscation stress</span><strong>${humanize(obfuscationDiagnostic?.status ?? "missing")}</strong></div>
          <div><span>Required cue families</span><strong>${(sycophancyDiagnostic?.cueFamilies ?? []).map(humanize).join(", ")}</strong></div>
        </div>
        <div class="failureList">
          ${failureAudit.topCustomLossRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip("diagnostic")}<strong>${escapeHtml(row.itemId)}</strong></header>
                  ${metricList([
                    ["Custom loss", formatNumber(row.errorMagnitude.customWeightedLoss)],
                    ["Overall error", formatNumber(row.errorMagnitude.overallAbsError)],
                    ["Prompt", row.promptTemplateId],
                    ["Failure tags", row.failureTaxonomyCodes.join(", ")],
                  ])}
                  <p>${escapeHtml(row.failureSummary)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function governancePanel(report, certificationStatus, lastCertificationStatus, hiddenBenchmarkFreezeReport, lastBenchmarkStatus) {
  const claimsByTier = report.comparabilityClaims;
  const cert = certificationStatus ?? report.certificationReports.find((item) => item.raterId === "demo-rater");
  const hiddenFreeze = hiddenBenchmarkFreezeReport ?? report.hiddenBenchmarkFreeze;
  const lmcaComparison = report.lmcaComparison;
  const scaleRows = Object.fromEntries(lmcaComparison.sourceScaleComparison.map((row) => [row.metric, row]));
  const pairwisePairs = lmcaComparison.modelDenominatorComparison.find((row) => row.metric === "weighted_pairwise_critique_pairs");
  const customDialogues = lmcaComparison.modelDenominatorComparison.find((row) => row.metric === "custom_metric_dialogues");
  const missingSources = lmcaComparison.positionSourceComparison.filter((row) => row.status === "missing_from_seed").map((row) => humanize(row.sourceCategory));
  const missingTopics = lmcaComparison.topicFamilyComparison.filter((row) => row.status === "missing_from_seed").map((row) => humanize(row.topicFamily));
  const raterComparison = lmcaComparison.raterCompositionComparison;
  const raterCompositionConflicts = report.raterCompositionConflicts;
  const ratingRevisionAudit = report.ratingRevisionAudit;
  const ratingEffort = report.ratingEffortQuality;
  const rubricIssueFlags = report.rubricIssueFlags;
  const effortBlocks = ratingEffort.protectedUseBlockSummary;
  const sourceStyleAudit = report.sourceStyleAudit;
  const sourceStyleRisk = sourceStyleAudit.residualUnblindingRisk;
  const sourceAccuracy = sourceStyleAudit.accuracySummary.sourceGuess;
  const highConfidenceSourceAccuracy = sourceStyleAudit.accuracySummary.highConfidenceSourceGuess;
  const adminTagBlinding = report.adminTagBlinding;
  const positionIntake = report.positionIntakeReadiness;
  const correctnessVerification = report.correctnessVerification;
  const adjudicationAudit = report.adjudicationMemoAudit;
  const postDiscussionDisagreement = report.postDiscussionDisagreement;
  const humanCeiling = report.humanCeiling;
  const validationTranche = report.validationTrancheReport;
  const candidateIntake = report.candidateIntakeQualityAudit;
  const rubricDrift = report.rubricDrift;
  const protectedSplitIsolation = report.protectedSplitIsolation;
  const blindInitialCeiling = humanCeiling.comparisonRows.find((row) => row.ratingKind === "blind_initial");
  const expertCheckCeiling = humanCeiling.comparisonRows.find((row) => row.ratingKind === "expert_check");
  const samePositionContext = report.samePositionContext;
  return `
    <div class="governanceLayout">
      <section class="panel">
        ${panelTitle("database", "October Completion Audit", "Current evidence is compared against the full October target without upgrading partial work into completion claims.")}
        <div class="metricCards">
          ${metricCard("Positions", `${report.corpusManifest.counts.positions}/${report.octoberTargets.positions}`, `${report.targetGaps.positionsRemaining} remaining`)}
          ${metricCard("Critiques", `${report.corpusManifest.counts.critiques}/${report.octoberTargets.critiques}`, `${report.targetGaps.critiquesRemaining} remaining`)}
          ${metricCard("Blind ratings", `${report.corpusManifest.counts.blindInitialRatings}/${report.octoberTargets.blindInitialRatings}`, `${report.targetGaps.blindInitialRatingsRemaining} remaining`)}
          ${metricCard("Gold library", `${report.certification.loadedGoldLibraryItems}/${report.octoberTargets.goldLibraryItems}`, `${report.targetGaps.goldItemsRemaining} remaining`)}
        </div>
        <div class="actionRow">
          <button class="secondaryButton" id="downloadReleaseReport" type="button">${icon("download")}Download release report</button>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("sliders", "Rating Effort QA", "Length-adjusted active time, idle gaps, and interruptions are audited before sensitive release use.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Telemetry coverage", `${ratingEffort.telemetryCoverage.completeTelemetryRows}/${ratingEffort.telemetryCoverage.totalRows}`, `${ratingEffort.telemetryCoverage.missingTelemetryRows} missing`)}
          ${metricCard("QA routed", String(ratingEffort.qaRoutedRatings.length), humanize(ratingEffort.releaseUseStatus))}
          ${metricCard("Validation blocks", String(effortBlocks.validationBlockedCount), "before validation denominators")}
          ${metricCard("Hidden blocks", String(effortBlocks.hiddenBenchmarkBlockedCount), "before benchmark use")}
        </div>
        <div class="metricTable">
          <div><span>Short expected band</span><strong>${ratingEffort.byExpectedEffortBand.short_pair_5_to_15_minutes ?? 0} rows</strong></div>
          <div><span>Medium expected band</span><strong>${ratingEffort.byExpectedEffortBand.medium_pair_10_to_25_minutes ?? 0} rows</strong></div>
          <div><span>Idle policy</span><strong>${ratingEffort.policy.idleGapPolicy}</strong></div>
          <div><span>Protected-use policy</span><strong>QA-routed rows blocked until reviewed</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("branch", "Revision & Check Audit", "Revisions and checks preserve first blind ratings and stay out of independent-rater denominators.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Blind initials", String(ratingRevisionAudit.counts.blindInitialRows), `${ratingRevisionAudit.counts.totalRatingRows} total rows`)}
          ${metricCard("Revisions", String(ratingRevisionAudit.counts.revisionRows), `${ratingRevisionAudit.counts.incompleteRevisionMetadataRows} metadata gaps`)}
          ${metricCard("Checks", `${ratingRevisionAudit.counts.selfCheckRows}/${ratingRevisionAudit.counts.expertCheckRows}/${ratingRevisionAudit.counts.modelAssistedCheckRows}`, "self / expert / model")}
          ${metricCard("Release use", humanize(ratingRevisionAudit.releaseUseStatus), `${ratingRevisionAudit.counts.denominatorInflationExcludedRows} excluded rows`)}
        </div>
        <div class="metricTable">
          <div><span>Immutable-original rule</span><strong>${ratingRevisionAudit.policy.immutableOriginalRule}</strong></div>
          <div><span>Revision metadata rule</span><strong>${ratingRevisionAudit.policy.reasonMetadataRule}</strong></div>
          <div><span>Denominator rule</span><strong>${ratingRevisionAudit.policy.denominatorRule}</strong></div>
        </div>
        <div class="failureList">
          ${(ratingRevisionAudit.revisionRows.length ? ratingRevisionAudit.revisionRows : ratingRevisionAudit.denominatorInflationRows)
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.metadataStatus ?? row.denominatorPolicy ?? row.kind)}<strong>${escapeHtml(row.ratingId)}</strong></header>
                  ${metricList([
                    ["Item", row.itemId],
                    ["Kind", humanize(row.kind ?? "revision")],
                    ["Parent", row.parentRatingId ?? "n/a"],
                    ["Reason", humanize(row.revisionReasonCode ?? "not a revision")],
                    ["Denominator", row.denominatorPolicy ?? "independent blind initial"],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("scale", "Rubric Issue Flags", "Structured rater flags are validated and reported separately from LMCA scores and product-level disagreement.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Flagged ratings", `${rubricIssueFlags.counts.flaggedRatingRowCount}/${rubricIssueFlags.counts.ratingRowCount}`, `${rubricIssueFlags.counts.issueFlagRowCount} issue flags`)}
          ${metricCard("Strength/centrality", String(rubricIssueFlags.counts.strengthCentralityAllocationAmbiguityCount), "allocation ambiguity")}
          ${metricCard("Correctness/clarity", `${rubricIssueFlags.counts.correctnessWeightingIssueCount}/${rubricIssueFlags.counts.clarityAfterEffortIssueCount}`, "weighting / after effort")}
          ${metricCard("Release use", humanize(rubricIssueFlags.releaseUseStatus), `${rubricIssueFlags.counts.productLevelDisagreementItemCount} product-spread items`)}
        </div>
        <div class="metricTable">
          <div><span>Separation rule</span><strong>${rubricIssueFlags.policy.separationRule}</strong></div>
          <div><span>Product rule</span><strong>${rubricIssueFlags.policy.productDisagreementRule}</strong></div>
          <div><span>Coverage</span><strong>${rubricIssueFlags.counts.coveredIssueFlagCount}/${rubricIssueFlags.counts.observedIssueFlagFamilyCount} observed issue families covered</strong></div>
        </div>
        <div class="failureList">
          ${rubricIssueFlags.flagCoverageRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.coverageStatus)}<strong>${escapeHtml(row.label)}</strong></header>
                  ${metricList([
                    ["Rating flags", String(row.ratingFlagCount)],
                    ["Release-critical flags", String(row.releaseCriticalRatingFlagCount)],
                    ["Coverage", humanize(row.coverageStatus)],
                    ["Policy", row.policy],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("eye", "Source/Style Blind Audit", "Post-lock guesses diagnose residual source, authorship, and style identifiability without feeding ordinary scores.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Post-lock audits", `${sourceStyleAudit.counts.postLockAudits}/${sourceStyleAudit.counts.totalAudits}`, `${sourceStyleAudit.counts.preLockViolationCount} timing violations`)}
          ${metricCard("Source accuracy", formatPercent(sourceAccuracy.accuracy), `${sourceAccuracy.correctCount}/${sourceAccuracy.eligibleCount} exact guesses`)}
          ${metricCard("High-confidence source", formatPercent(highConfidenceSourceAccuracy.accuracy), `${sourceStyleAudit.counts.highConfidenceAuditCount} high-confidence rows`)}
          ${metricCard("Release use", humanize(sourceStyleAudit.releaseUseStatus), humanize(sourceStyleRisk.status))}
        </div>
        <div class="metricTable">
          <div><span>Diagnostic only</span><strong>${sourceStyleAudit.diagnosticOnly ? "yes" : "no"}</strong></div>
          <div><span>Scoring-use violations</span><strong>${sourceStyleAudit.counts.scoringUseViolationCount}</strong></div>
          <div><span>Quality association</span><strong>${humanize(sourceStyleAudit.qualityCorrelationDiagnostic.status)}</strong></div>
          <div><span>Countermeasure</span><strong>${sourceStyleRisk.countermeasure}</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("lock", "Admin Tag Blinding", "Tag-risk classes and visibility history are reported without exposing admin tags before initial lock.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Tagged positions", `${adminTagBlinding.counts.taggedPositionCount}/${report.corpusManifest.counts.positions}`, `${adminTagBlinding.counts.tagCount} tags`)}
          ${metricCard("Confounder-risk tags", String(adminTagBlinding.counts.confounderRiskTagCount), humanize(adminTagBlinding.releaseUseStatus))}
          ${metricCard("Pre-lock violations", String(adminTagBlinding.counts.preLockVisibilityViolationCount), "must remain zero")}
          ${metricCard("Known confounders", String(adminTagBlinding.counts.knownRatingConfounderTagCount), "hidden before lock")}
        </div>
        <div class="metricTable">
          <div><span>Visibility rule</span><strong>${adminTagBlinding.policy.visibilityRule}</strong></div>
          <div><span>Manifest rule</span><strong>${adminTagBlinding.policy.manifestRule}</strong></div>
          <div><span>Risk mix</span><strong>${Object.entries(adminTagBlinding.byConfounderRiskClass)
            .map(([risk, count]) => `${humanize(risk)} ${count}`)
            .join(", ")}</strong></div>
        </div>
        <div class="failureList">
          ${adminTagBlinding.visibilityHistoryRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.confounderRiskClass)}<strong>${escapeHtml(row.positionId)}</strong></header>
                  ${metricList([
                    ["Tag", row.tag],
                    ["Split", humanize(row.split)],
                    ["Visibility", humanize(row.visibilityHistoryStatus)],
                    ["Reason", row.reason ?? "not recorded"],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("clipboard", "Position Intake Readiness", "Scope, context, original text, and admin-only normalization notes are screened before rating and release use.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Screened", String(positionIntake.counts.positionsScreened), `${positionIntake.counts.originalTextPreservedCount} original texts preserved`)}
          ${metricCard("Admin notes hidden", `${positionIntake.counts.adminNotesHiddenCount}/${positionIntake.counts.positionsScreened}`, "before initial ratings")}
          ${metricCard("Normalization required", String(positionIntake.counts.normalizationRequiredCount), humanize(positionIntake.releaseUseStatus))}
          ${metricCard("Headline eligible", String(positionIntake.counts.ordinaryHeadlineEligibleCount), `${positionIntake.counts.nonHeadlinePositionCount} held out or limited`)}
        </div>
        <div class="metricTable">
          <div><span>Blind boundary</span><strong>${positionIntake.policy.blindRaterBoundary}</strong></div>
          <div><span>Context mix</span><strong>${Object.entries(positionIntake.byContextSufficiency)
            .map(([status, count]) => `${humanize(status)} ${count}`)
            .join(", ")}</strong></div>
          <div><span>Hidden benchmark context blocks</span><strong>${positionIntake.counts.hiddenBenchmarkContextBlockedCount}</strong></div>
        </div>
        <div class="failureList">
          ${positionIntake.nonHeadlineRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.expertNormalizationRequired ? "normalization_required" : "limited")}<strong>${escapeHtml(row.positionId)}</strong></header>
                  ${metricList([
                    ["Scope", humanize(row.conceptualScope)],
                    ["Ground truth", humanize(row.groundTruthAvailability)],
                    ["Context", humanize(row.contextSufficiency)],
                    ["Context gaps", row.contextGapFlags.map(humanize).join(", ") || "none"],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("check", "Correctness Verification", "Structured VerificationRecords preserve correctness-check evidence without overwriting blind ratings.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Required items", String(correctnessVerification.requiredItemCount), `${correctnessVerification.linkedRecordCount} linked records`)}
          ${metricCard("Unresolved", String(correctnessVerification.unresolvedRequiredItems.length), "requires review")}
          ${metricCard("Release blocks", String(correctnessVerification.releaseBlockingItems.length), humanize(correctnessVerification.releaseUseStatus))}
          ${metricCard("Verified/not needed", String((correctnessVerification.byVerificationStatus.verified ?? 0) + (correctnessVerification.byVerificationStatus.not_needed ?? 0)), "resolved statuses")}
        </div>
        <div class="metricTable">
          <div><span>Status mix</span><strong>${Object.entries(correctnessVerification.byVerificationStatus)
            .map(([status, count]) => `${humanize(status)} ${count}`)
            .join(", ")}</strong></div>
          <div><span>Exposure status</span><strong>${Object.keys(correctnessVerification.byExposureStatus).map(humanize).join(", ")}</strong></div>
          <div><span>Release rule</span><strong>${correctnessVerification.policy.releaseRule}</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("flask", "Human Ceiling & Saturation", "Validation ceiling evidence tracks rater overlap, check type, model proximity, and refresh priorities without upgrading a thin seed run.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Validation scope", `${humanCeiling.validationScope.validationCritiqueCount}/${report.validationDesign.requiredScale.critiqueCount}`, humanize(humanCeiling.validationScope.appendixCScaleStatus))}
          ${metricCard("Common overlap", String(humanCeiling.raterItemCoverage.commonOverlapItemIds.length), `${humanCeiling.raterItemCoverage.fullCoverageRaterIds.length} full-coverage raters`)}
          ${metricCard("Saturation", humanize(humanCeiling.saturationRisk.status), humanize(humanCeiling.releaseUseStatus))}
          ${metricCard("Refresh queue", String(humanCeiling.refreshQueue.length), "harder, double-rated, checked, adjudicated")}
        </div>
        <div class="metricTable">
          <div><span>Blind initial ceiling</span><strong>${formatNumber(blindInitialCeiling?.meanAbsOverallDiff)} mean abs overall</strong></div>
          <div><span>Expert check ceiling</span><strong>${formatNumber(expertCheckCeiling?.meanAbsOverallDiff)} mean abs overall</strong></div>
          <div><span>Model-assisted rows</span><strong>${humanCeiling.checkSeparation.modelAssistedCheckRows}</strong></div>
          <div><span>Final-average policy</span><strong>Approximation target, not ground truth</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("branch", "Validation Tranches", "Random sentinel and hard-case stress validation metrics remain separate before any release claim.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Random sentinel", String(validationTranche.randomSentinel.critiqueCount), `${validationTranche.randomSentinel.positionCount} positions`)}
          ${metricCard("Initial-vs-final", formatNumber(validationTranche.randomSentinel.initialVsFinal.meanAbsOverallDiff), humanize(validationTranche.randomSentinel.membershipBlindingStatus))}
          ${metricCard("Hard-case stress", String(validationTranche.hardCaseStress.critiqueCount), `${validationTranche.hardCaseStress.unresolvedPostDiscussionRows.length} unresolved rows`)}
          ${metricCard("Release use", humanize(validationTranche.releaseUseStatus), "tranches separated")}
        </div>
        <div class="metricTable">
          <div><span>Random membership</span><strong>${humanize(validationTranche.randomSentinel.membershipBlindingStatus)}</strong></div>
          <div><span>Hard-case membership</span><strong>${humanize(validationTranche.hardCaseStress.membershipBlindingStatus)}</strong></div>
          <div><span>Model-assist delta</span><strong>${humanize(validationTranche.randomSentinel.incrementalPostModelAssistanceDelta.status)}</strong></div>
          <div><span>Required rows</span><strong>${validationTranche.policy.requiredComparisonRows.map(humanize).join(", ")}</strong></div>
        </div>
        <div class="failureList">
          ${validationTranche.trancheRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.tranche)}<strong>${humanize(row.tranche)}</strong></header>
                  ${metricList([
                    ["Items", row.itemIds.join(", ") || "none"],
                    ["Blind rows", String(row.initialVsFinal.rowCount)],
                    ["Expert rows", String(row.expertCheckedVsFinal.rowCount)],
                    ["Model-assisted rows", String(row.modelAssistedCheckedVsFinal.rowCount)],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("scale", "Adjudication Memo Audit", "Ambiguous and bottom-line-dependent cases preserve interpretation coverage, minority rationales, and low-clarity diagnostics.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Memos", String(adjudicationAudit.counts.memoCount), `${adjudicationAudit.counts.releaseCriticalMemoCount} release-critical`)}
          ${metricCard("Ambiguity complete", `${adjudicationAudit.counts.completeAmbiguityMemoCount}/${adjudicationAudit.counts.ambiguousMemoCount}`, humanize(adjudicationAudit.releaseUseStatus))}
          ${metricCard("Bottom-line items", String(adjudicationAudit.counts.bottomLineDependentItemCount), `${adjudicationAudit.counts.minorityRationaleCount} minority rationales`)}
          ${metricCard("Imprecision/obfuscation", `${adjudicationAudit.counts.clearlyUnsatisfactoryImprecisionItemCount}/${adjudicationAudit.counts.obfuscatedOrMaskedFallacyItemCount}`, "separate flags")}
        </div>
        <div class="metricTable">
          <div><span>Ambiguity rule</span><strong>${adjudicationAudit.policy.ambiguityRule}</strong></div>
          <div><span>Bottom-line rule</span><strong>${adjudicationAudit.policy.bottomLineRule}</strong></div>
          <div><span>Incomplete critical memos</span><strong>${adjudicationAudit.counts.incompleteReleaseCriticalAmbiguityMemoCount}</strong></div>
        </div>
        <div class="failureList adjudicationAuditList">
          ${adjudicationAudit.memoRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.bottomLineDependence ? "minority_rationale" : row.clearlyUnsatisfactoryImprecision ? "imprecision_flag" : "adjudicated")}<strong>${escapeHtml(row.itemId)}</strong></header>
                  ${metricList([
                    ["Stable judgment", humanize(row.stableJudgment ?? "not recorded")],
                    ["Worst plausible", row.worstPlausibleInterpretationConsidered ?? "not recorded"],
                    ["Refutes", row.critiqueRefutesInterpretations.join(", ") || "none recorded"],
                    ["Minority rationales", String(row.minorityRationaleCount)],
                    ["Taxonomy", row.disagreementTaxonomy.map(humanize).join(", ")],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("branch", "Post-Discussion Disagreement", "Residual high-spread release-critical items are classified rather than forced into silent consensus.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Release-critical items", String(postDiscussionDisagreement.counts.releaseCriticalItemCount), `${postDiscussionDisagreement.counts.insufficientFinalOverlapItemCount} thin overlap`)}
          ${metricCard("High final spread", String(postDiscussionDisagreement.counts.highSpreadItemCount), `threshold ${postDiscussionDisagreement.policy.maxSpreadThreshold}`)}
          ${metricCard("Memo coverage", `${postDiscussionDisagreement.counts.classifiedHighSpreadItemCount}/${postDiscussionDisagreement.counts.highSpreadItemCount}`, humanize(postDiscussionDisagreement.releaseUseStatus))}
          ${metricCard("Missing memos", String(postDiscussionDisagreement.counts.missingMemoHighSpreadItemCount), "release-blocking if nonzero")}
        </div>
        <div class="metricTable">
          <div><span>Release rule</span><strong>${postDiscussionDisagreement.policy.releaseRule}</strong></div>
          <div><span>Thin-overlap rule</span><strong>${postDiscussionDisagreement.policy.thinOverlapRule}</strong></div>
          <div><span>Classifications</span><strong>${Object.entries(postDiscussionDisagreement.byClassification)
            .map(([classification, count]) => `${humanize(classification)} ${count}`)
            .join(", ")}</strong></div>
        </div>
        <div class="failureList">
          ${postDiscussionDisagreement.itemRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.classification)}<strong>${escapeHtml(row.itemId)}</strong></header>
                  ${metricList([
                    ["Max final spread", row.maxFinalSpread === null ? "not enough raters" : `${row.maxFinalSpreadDimension} ${row.maxFinalSpread}`],
                    ["Pre/post overall spread", `${row.spreadPreDiscussionOverall ?? "n/a"} / ${row.spreadPostDiscussionOverall ?? "n/a"}`],
                    ["Final raters", row.finalRaterIds.join(", ") || "none"],
                    ["Memos", row.adjudicationMemoIds.join(", ") || "none"],
                    ["Release action", humanize(row.releaseAction)],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("branch", "Same-Position Context", "Frozen rating-context snapshots track sibling exposure, order policy, later-added critiques, and model-prompt parity.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Frozen contexts", `${samePositionContext.counts.ratingsWithFrozenContext}/${samePositionContext.counts.totalRatings}`, `${samePositionContext.counts.missingContextSnapshotCount} missing`)}
          ${metricCard("Context-sensitive", String(samePositionContext.counts.contextSensitiveRatingCount), humanize(samePositionContext.releaseUseStatus))}
          ${metricCard("Counterbalanced", `${samePositionContext.counts.counterbalancedReleaseCriticalRatingCount}/${samePositionContext.counts.releaseCriticalRatingCount}`, "release-critical ratings")}
          ${metricCard("Absent siblings", String(samePositionContext.counts.absentSiblingDisclosureCount), "disclosed at submission")}
        </div>
        <div class="metricTable">
          <div><span>Policy mix</span><strong>${Object.entries(samePositionContext.byPolicy)
            .map(([policy, count]) => `${humanize(policy)} ${count}`)
            .join(", ")}</strong></div>
          <div><span>Order policy</span><strong>${Object.entries(samePositionContext.byOrderPolicy)
            .map(([policy, count]) => `${humanize(policy)} ${count}`)
            .join(", ")}</strong></div>
          <div><span>Parity status</span><strong>${Object.keys(samePositionContext.byHumanModelParityStatus).map(humanize).join(", ")}</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("chart", "LMCA Source-Scale Baselines", "Source LMCA counts are tracked separately from the compressed October release target.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Rated critiques", `${scaleRows.rated_critiques.releaseValue}/${scaleRows.rated_critiques.lmcaValue}`, `${formatPercent(scaleRows.rated_critiques.releaseToLmcaRatio)} of LMCA`)}
          ${metricCard("Ratings", `${scaleRows.ratings_ignoring_revisions.releaseValue}/${scaleRows.ratings_ignoring_revisions.lmcaValue}`, "ignoring revisions")}
          ${metricCard("Model-written critiques", `${scaleRows.model_written_critiques.releaseValue}/${scaleRows.model_written_critiques.lmcaValue}`, "authorship comparable only when sources match")}
          ${metricCard("Two-critique positions", `${scaleRows.positions_with_at_least_two_critiques.releaseValue}/${scaleRows.positions_with_at_least_two_critiques.lmcaValue}`, "pairwise coverage baseline")}
        </div>
        <div class="metricTable">
          <div><span>Missing source categories</span><strong>${missingSources.join(", ") || "none"}</strong></div>
          <div><span>Known LMCA other-dataset subsources</span><strong>${Object.entries(lmcaComparison.knownOtherDatasetSubsources)
            .map(([name, count]) => `${name} ${count}`)
            .join(", ")}</strong></div>
          <div><span>Missing topic families</span><strong>${missingTopics.join(", ") || "none"}</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("key", "Target, Rater, And Score Anchors", "Target-label and rater-composition claims are gated independently from method-preserving workflow claims.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Target label", humanize(lmcaComparison.targetLabelComparison.currentTargetLabelVersion), humanize(lmcaComparison.targetLabelComparison.status))}
          ${metricCard("Largest rater share", formatPercent(raterComparison.releaseLargestRaterShare), humanize(raterComparison.status))}
          ${metricCard("Pairwise pairs", `${pairwisePairs.releaseValue}/${pairwisePairs.lmcaValue}`, "LMCA Table 5 denominator")}
          ${metricCard("Score anchors", String(lmcaComparison.modelScoreAnchorComparison.anchorCount), humanize(lmcaComparison.modelScoreAnchorComparison.status))}
        </div>
        <div class="metricTable">
          <div><span>Table 5 target</span><strong>${lmcaComparison.targetLabelComparison.lmcaTable5Target}</strong></div>
          <div><span>Custom metric dialogues</span><strong>${customDialogues.releaseValue}/${customDialogues.lmcaValue}</strong></div>
          <div><span>Validation ceiling status</span><strong>${humanize(lmcaComparison.validationHumanCeilingComparison.status)}</strong></div>
          <div><span>Overclaim guardrail</span><strong>Descriptive only until all gates pass</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("users", "Rater Composition & Conflicts", "Release-critical label snapshots disclose rater tier, topic fit, dominance, and prior-exposure conflicts before headline use.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Included raters", String(raterCompositionConflicts.counts.includedRaterCount), `${raterCompositionConflicts.counts.includedRatingRows} rating rows`)}
          ${metricCard("Release-critical items", String(raterCompositionConflicts.counts.releaseCriticalItemCount), `${raterCompositionConflicts.counts.releaseCriticalRatingRows} rating rows`)}
          ${metricCard("Single-rater dominated", String(raterCompositionConflicts.counts.singleRaterDominatedReleaseCriticalItemCount), humanize(raterCompositionConflicts.releaseUseStatus))}
          ${metricCard("Conflicts", String(raterCompositionConflicts.counts.conflictFlagCount), `${raterCompositionConflicts.counts.topicExpertiseMissingItemCount} topic gaps`)}
        </div>
        <div class="metricTable">
          <div><span>Release-critical tier mix</span><strong>${Object.entries(raterCompositionConflicts.releaseCriticalRaterTierDistribution)
            .map(([tier, count]) => `${humanize(tier)} ${count}`)
            .join(", ")}</strong></div>
          <div><span>Conflict rule</span><strong>${raterCompositionConflicts.policy.conflictRule}</strong></div>
          <div><span>Topic-expertise rule</span><strong>${raterCompositionConflicts.policy.topicExpertiseRule}</strong></div>
        </div>
        <div class="failureList">
          ${raterCompositionConflicts.singleRaterDominatedReleaseCriticalRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip("review_required")}<strong>${escapeHtml(row.itemId)}</strong></header>
                  ${metricList([
                    ["Split", humanize(row.split)],
                    ["Raters", `${row.raterCount} (${row.raterIds.join(", ")})`],
                    ["Topic experts", row.topicExpertRaterIds.join(", ") || "none"],
                    ["Largest share", formatPercent(row.largestSingleRaterContributionShare)],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("shield", "Certification, Rights, And Intake", "Project-level safeguards are explicit and kept separate from source-stated LMCA requirements.")}
        <div class="auditGrid">
          ${auditCard("Certification packs", report.certification.packs.length, report.certification.goldLibraryStatus, `${report.certification.packs[0].totalRequiredItems} item tier-zero pack`)}
          ${auditCard("Demo rater status", cert?.attemptCount ?? 0, cert?.currentStatus ?? "not_started", `${cert?.latestAttempt?.targetedRetrainingFlags?.join(", ") || "no active retraining flag"}`)}
          ${auditCard("Public rights", report.provenanceRights.public.checkedPositionCount, report.provenanceRights.public.status, "split-aware provenance/rights audit")}
          ${auditCard("Hidden rights", report.provenanceRights.hidden_benchmark.checkedPositionCount, report.provenanceRights.hidden_benchmark.status, "restricted benchmark scope checked")}
          ${auditCard("Active-learning promoted", report.activeLearning.totals.promoted, report.activeLearning.blindingPass ? "pass" : "blocked", `${report.activeLearning.totals.generated} generated / ${report.activeLearning.totals.judged} judged`)}
        </div>
        <div class="actionRow">
          <button class="secondaryButton" id="submitCertificationAttempt" type="button">${icon("check")}Submit demo certification attempt</button>
        </div>
        ${statusLine(lastCertificationStatus, "persistenceLine")}
      </section>
      <section class="panel">
        ${panelTitle("lock", "Protected Split Isolation", "Gold, certification, hidden-benchmark, and protected-validation clusters are checked before ordinary hidden-benchmark claims.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Position clusters", String(protectedSplitIsolation.counts.positionClusterCount), `${protectedSplitIsolation.counts.crossSplitClusterCount} cross-split`)}
          ${metricCard("Protected overlaps", String(protectedSplitIsolation.counts.protectedCrossSplitClusterCount), `${protectedSplitIsolation.counts.unloggedProtectedCrossSplitClusterCount} unlogged`)}
          ${metricCard("Deprotection exceptions", String(protectedSplitIsolation.counts.deprotectionExceptionCount), `${protectedSplitIsolation.counts.ordinaryClaimExcludedCount} ordinary exclusions`)}
          ${metricCard("Release use", humanize(protectedSplitIsolation.releaseUseStatus), "hidden-benchmark claim guard")}
        </div>
        <div class="metricTable">
          <div><span>Protected split rule</span><strong>${protectedSplitIsolation.policy.protectedSplitRule}</strong></div>
          <div><span>Gold/cert rule</span><strong>${protectedSplitIsolation.policy.goldCertificationExposureRule}</strong></div>
          <div><span>Ordinary claim rule</span><strong>${protectedSplitIsolation.policy.ordinaryClaimExclusionRule}</strong></div>
        </div>
        <div class="failureList">
          ${(protectedSplitIsolation.protectedCrossSplitRows.length
            ? protectedSplitIsolation.protectedCrossSplitRows
            : protectedSplitIsolation.clusterRows
          )
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.isolationStatus)}<strong>${escapeHtml(row.clusterId)}</strong></header>
                  ${metricList([
                    ["Splits", row.splits.map(humanize).join(", ")],
                    ["Positions", row.positionIds.join(", ")],
                    ["Protected splits", row.protectedSplits.map(humanize).join(", ") || "none"],
                    ["Exception ids", row.deprotectionExceptionIds.join(", ") || "none"],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("branch", "Rubric Drift & Recertification", "Material rubric-version changes trigger recertification or grandfathering review for packs, gold items, and raters.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Current rubric", rubricDrift.currentRubricVersion, humanize(rubricDrift.mixedRubricSnapshotStatus))}
          ${metricCard("Rating versions", String(rubricDrift.counts.ratingRubricVersionCount), `${rubricDrift.counts.ratingRowCount} rating rows`)}
          ${metricCard("Review queue", String(rubricDrift.counts.recertificationOrGrandfatheringReviewCount), humanize(rubricDrift.releaseUseStatus))}
          ${metricCard("Rater flags", `${rubricDrift.counts.ratersWithTargetedRetrainingFlags}/${rubricDrift.counts.ratersWithRestrictionFlags}`, "retraining / restriction")}
        </div>
        <div class="metricTable">
          <div><span>Material-change rule</span><strong>${rubricDrift.policy.materialChangeRule}</strong></div>
          <div><span>Mixed-rubric rule</span><strong>${rubricDrift.policy.mixedRubricRule}</strong></div>
          <div><span>Pack policies</span><strong>${rubricDrift.packRows.map((row) => `${row.packId}: ${humanize(row.recertificationPolicy)}`).join("; ")}</strong></div>
        </div>
        <div class="failureList">
          ${rubricDrift.raterCalibrationRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.status)}<strong>${escapeHtml(row.raterId)}</strong></header>
                  ${metricList([
                    ["Attempt", row.attemptId],
                    ["Mean abs error", formatNumber(row.meanAbsError)],
                    ["Targeted retraining", row.targetedRetrainingFlags.map(humanize).join(", ") || "none"],
                    ["Restrictions", row.restrictionFlags.map(humanize).join(", ") || "none"],
                    ["Review action", humanize(row.reviewAction)],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("eye", "Candidate Intake Quality", "Marginal-informativeness and redundancy audits prevent critique counts from inflating benchmark quality claims.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Total critiques", String(candidateIntake.counts.totalCritiques), `${candidateIntake.counts.unqualifiedScaleEligibleCritiques} unqualified-scale eligible`)}
          ${metricCard("Low-info controls", String(candidateIntake.counts.lowInformationOrArtifactControlCritiques), "artifact or redundancy disclosed")}
          ${metricCard("Accepted low-info", `${candidateIntake.counts.acceptedLowInformationOrArtifactControlCritiques}/${candidateIntake.counts.activeLearningAcceptedCritiques}`, "active-learning accepted rows")}
          ${metricCard("Duplicate outputs", String(candidateIntake.counts.duplicateGeneratedOutputs), humanize(candidateIntake.releaseUseStatus))}
        </div>
        <div class="metricTable">
          <div><span>Scale rule</span><strong>${candidateIntake.policy.unqualifiedScaleRule}</strong></div>
          <div><span>Duplicate policy</span><strong>${candidateIntake.policy.duplicatePolicy}</strong></div>
          <div><span>Risk mix</span><strong>${Object.entries(candidateIntake.redundancyRiskCounts)
            .map(([risk, count]) => `${humanize(risk)} ${count}`)
            .join(", ")}</strong></div>
        </div>
        <div class="failureList">
          ${candidateIntake.lowInformationRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.redundancyRisk)}<strong>${escapeHtml(row.critiqueId)}</strong></header>
                  ${metricList([
                    ["Marginal info", humanize(row.marginalInformativeness)],
                    ["Risk", humanize(row.redundancyRisk)],
                    ["Split", humanize(row.split)],
                    ["Scale policy", humanize(row.scaleClaimPolicy)],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("lock", "Hidden Benchmark Freeze", "Restricted membership, metric-family gates, artifact balance, probes, and exposure logs are audited before release claims.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Hidden positions", String(hiddenFreeze.hiddenPositionCount), `${hiddenFreeze.hiddenCritiqueCount} critiques`)}
          ${metricCard("Freeze status", humanize(hiddenFreeze.freezeStatus), humanize(hiddenFreeze.artifactBalance.counterbalanceStatus))}
          ${metricCard("Access events", String(hiddenFreeze.accessAudit.totalEvents), `${hiddenFreeze.accessAudit.unauthorizedAccessCount} unauthorized`)}
          ${metricCard("Artifact probes", humanize(hiddenFreeze.artifactProbeDiagnostics.status), hiddenFreeze.artifactProbeDiagnostics.completedProbeFamilies.join(", ") || "documented pending")}
          ${metricCard("Initial blinding", String(hiddenFreeze.initialBlinding.counts.sourceTagVisibleInitialRows), humanize(hiddenFreeze.initialBlinding.releaseUseStatus))}
        </div>
        <div class="metricTable">
          <div><span>Rights</span><strong>${humanize(hiddenFreeze.rightsStatus.status)}</strong></div>
          <div><span>Cluster isolation</span><strong>${humanize(hiddenFreeze.clusterIsolation.status)}</strong></div>
          <div><span>Blind aggregation exclusions</span><strong>${hiddenFreeze.initialBlinding.counts.excludedFromBlindAggregationRows}</strong></div>
          <div><span>Pairwise pairs</span><strong>${hiddenFreeze.metricEligibility.pairwiseEligiblePairCount}</strong></div>
          <div><span>Pointwise-only</span><strong>${hiddenFreeze.metricEligibility.pointwiseOnlyItems.length}</strong></div>
          <div><span>Low-margin share</span><strong>${Math.round(hiddenFreeze.pairwiseMarginDistribution.lowMarginPairShare * 100)}%</strong></div>
          <div><span>Access role</span><strong>${humanize(hiddenFreeze.accessAudit.requiredRole)}</strong></div>
        </div>
        <div class="actionRow">
          <button class="secondaryButton" id="recordBenchmarkAccess" type="button">${icon("lock")}Record benchmark access</button>
        </div>
        ${statusLine(lastBenchmarkStatus, "persistenceLine")}
      </section>
      <section class="panel">
        ${panelTitle("chart", "Metric-Family Eligibility", "Pairwise headline denominators and pointwise custom-loss denominators are generated independently.")}
        <div class="metricTable">
          <div><span>Pairwise positions</span><strong>${report.metricEligibility.pairwiseEligiblePositions.length}</strong></div>
          <div><span>Pairwise pairs</span><strong>${report.metricEligibility.pairwiseEligiblePairCount}</strong></div>
          <div><span>Custom-loss items</span><strong>${report.metricEligibility.customLossEligibleItems.length}</strong></div>
          <div><span>Pointwise-only items</span><strong>${report.metricEligibility.pointwiseOnlyItems.join(", ") || "none"}</strong></div>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("flask", "Appendix-C Validation Floor", "Validation reports must label this seed run as thinner than Appendix C until the full floor is met.")}
        <div class="metricCards">
          ${metricCard("Validation critiques", `${report.validationDesign.currentScale.critiqueCount}/${report.validationDesign.requiredScale.critiqueCount}`, humanize(report.validationDesign.status))}
          ${metricCard("Validation positions", `${report.validationDesign.currentScale.positionCount}/${report.validationDesign.requiredScale.positionCount}`, "required scale floor")}
          ${metricCard("Full-coverage raters", `${report.validationDesign.currentScale.fullCoverageRaterCount}/${report.validationDesign.requiredScale.coreAllItemsRaters}`, "core all-items raters")}
        </div>
      </section>
      <section class="panel claimPanel">
        ${panelTitle("key", "LMCA Comparability Claims", "A release cannot use one vague LMCA-comparable label; every claim tier carries separate evidence.")}
        <div class="claimList">
          ${claimsByTier
            .map(
              (claim) => `
                <article class="claimRow">
                  <header>${statusChip(claim.status)}<strong>${humanize(claim.tier)}</strong></header>
                  <p>${escapeHtml(claim.evidence)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function exportsPanel(manifests, labelSnapshot, trainingExport, labelChannelSeparation, rubricQaCoverage, sourceExampleAnchors) {
  return `
    <div class="exportsLayout">
      <section class="panel">
        ${panelTitle("download", "Release Exports", "Public, internal, hidden-benchmark, and training manifests use different split and exposure rules.")}
        <div class="manifestGrid">
          ${manifests
            .map(
              (manifest) => `
                <article class="manifestCard">
                  <header>${statusChip(manifest.kind)}<button class="iconButton downloadManifest" data-manifest-id="${escapeHtml(manifest.id)}" title="Download manifest" type="button">${icon("download")}</button></header>
                  <h3>${humanize(manifest.kind)} manifest</h3>
                  ${metricList([
                    ["Positions", String(manifest.counts.positions)],
                    ["Critiques", String(manifest.counts.critiques)],
                    ["Hidden excluded", manifest.hiddenBenchmarkExcluded ? "yes" : "restricted"],
                    ["Rights cleared only", manifest.rightsClearedOnly ? "yes" : "no"],
                  ])}
                  <p>${escapeHtml(manifest.notes.join(" "))}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("branch", "Model-Improvement Export", "Training artifacts preserve uncertainty and preference weights while excluding hidden benchmark and protected validation splits.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Pointwise examples", String(trainingExport.counts.pointwiseExamples), `${trainingExport.counts.includedRatings} source ratings`)}
          ${metricCard("Pairwise preferences", String(trainingExport.counts.pairwisePreferenceExamples), humanize(trainingExport.optimizedSurrogateObjective.pairwise))}
          ${metricCard("Protected exclusion", humanize(trainingExport.protectedSplitPolicy.positionClusterIsolationStatus), trainingExport.protectedSplitPolicy.excludedSplits.join(", "))}
          ${metricCard("Prompt track", humanize(trainingExport.promptTrackExposure), "training exposure")}
        </div>
        ${metricList([
          ["Label snapshot", trainingExport.labelSnapshotId],
          ["Target label", humanize(trainingExport.targetLabelVersion)],
          ["Hidden excluded", trainingExport.protectedSplitPolicy.hiddenBenchmarkExcluded ? "yes" : "no"],
          ["Validation excluded", trainingExport.protectedSplitPolicy.internalValidationExcluded ? "yes" : "no"],
          ["Pairwise snapshot", trainingExport.pairwiseComparisonSnapshot.id],
        ])}
        <div class="actionRow">
          <button class="secondaryButton" id="downloadTrainingExport" type="button">${icon("download")}Download training export</button>
        </div>
      </section>
      <section class="panel">
        ${panelTitle("shield", "Label Channel Separation", "Argumentative-quality labels stay separate from personal agreement, preference, and persuasion channels.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Surfaces", String(labelChannelSeparation.counts.auditedSurfaces), `${labelChannelSeparation.counts.violationCount} violations`)}
          ${metricCard("Snapshot rows", String(labelChannelSeparation.counts.itemLabelRows), `${labelChannelSeparation.counts.nonLmcaSnapshotFieldRows} non-LMCA fields`)}
          ${metricCard("Training rows", String(labelChannelSeparation.counts.trainingRows), `${labelChannelSeparation.counts.forbiddenTrainingChannelRows} forbidden channels`)}
          ${metricCard("Release use", humanize(labelChannelSeparation.releaseUseStatus), humanize(labelChannelSeparation.policy.allowedChannel))}
        </div>
        <div class="metricTable">
          <div><span>Separation rule</span><strong>${labelChannelSeparation.policy.separationRule}</strong></div>
          <div><span>Training rule</span><strong>${labelChannelSeparation.policy.trainingRule}</strong></div>
          <div><span>Forbidden channels</span><strong>${labelChannelSeparation.policy.forbiddenChannels.map(humanize).join(", ")}</strong></div>
        </div>
        <div class="failureList">
          ${labelChannelSeparation.surfaceRows
            .map(
              (row) => `
                <article class="claimRow">
                  <header>${statusChip(row.status)}<strong>${humanize(row.surface)}</strong></header>
                  ${metricList([
                    ["Channel", humanize(row.labelChannel)],
                    ["Evidence", row.evidence],
                    ["Status", humanize(row.status)],
                  ])}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        ${panelTitle("sliders", "Rubric QA Pack", "Appendix-F edge cases are versioned as public training and QA fixtures.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Fixture families", `${rubricQaCoverage.counts.coveredFamilyCount}/${rubricQaCoverage.counts.requiredFamilyCount}`, humanize(rubricQaCoverage.releaseUseStatus))}
          ${metricCard("Fixtures", String(rubricQaCoverage.counts.fixtureCount), `${rubricQaCoverage.counts.missingFamilyCount} missing families`)}
          ${metricCard("Protected exposure", String(rubricQaCoverage.counts.protectedExposureViolationCount), "public QA only")}
          ${metricCard("Rubric version", rubricQaCoverage.rubricVersion, "frozen pack")}
        </div>
        <div class="metricTable">
          <div><span>Protection boundary</span><strong>${rubricQaCoverage.policy.protectionBoundary}</strong></div>
          <div><span>Dimension coverage</span><strong>${Object.entries(rubricQaCoverage.dimensionCoverage)
            .map(([dimension, count]) => `${humanize(dimension)} ${count}`)
            .join(", ")}</strong></div>
          <div><span>Missing families</span><strong>${rubricQaCoverage.missingFamilies.map(humanize).join(", ") || "none"}</strong></div>
        </div>
        <div class="fixtureList">${rubricQaCoverage.fixtureRows
          .map(
            (fixture) => `
              <article>
                <strong>${escapeHtml(fixture.title)}</strong>
                <span>${escapeHtml(fixture.invariant)}</span>
                <em>${escapeHtml(fixture.coveredFamilies.map(humanize).join(", "))}</em>
              </article>
            `,
          )
          .join("")}</div>
        <button class="secondaryButton" id="downloadSnapshot" type="button">${icon("download")}Download label snapshot</button>
      </section>
      <section class="panel">
        ${panelTitle("key", "LMCA Source Anchors", "Public LMCA examples are versioned training and prompt-regression anchors, not protected evaluation rows.")}
        <div class="metricCards benchmarkMetricCards">
          ${metricCard("Anchors", String(sourceExampleAnchors.counts.anchorCount), `${sourceExampleAnchors.counts.coveredFamilyCount}/${sourceExampleAnchors.counts.requiredFamilyCount} families`)}
          ${metricCard("Suite version", sourceExampleAnchors.suiteVersions.join(", "), humanize(sourceExampleAnchors.releaseUseStatus))}
          ${metricCard("Protected leakage", String(sourceExampleAnchors.counts.exposureViolationCount), "hidden/validation/human-ceiling excluded")}
          ${metricCard("Prompt regression", String(sourceExampleAnchors.counts.promptRegressionEligibleCount), "public examples only")}
        </div>
        <div class="metricTable">
          <div><span>Source-anchor rule</span><strong>${sourceExampleAnchors.policy.sourceAnchorRule}</strong></div>
          <div><span>Required families</span><strong>${sourceExampleAnchors.policy.requiredFamiliesRule}</strong></div>
          <div><span>Denominator rule</span><strong>${sourceExampleAnchors.policy.denominatorExclusionRule}</strong></div>
        </div>
        <div class="fixtureList">${sourceExampleAnchors.anchorRows
          .map(
            (anchor) => `
              <article>
                <strong>${escapeHtml(anchor.anchorId)}</strong>
                <span>${escapeHtml(anchor.publicSourceReference)}</span>
                <em>${escapeHtml(`${humanize(anchor.sourceExampleFamily)} | ${anchor.itemId} | ${anchor.positionClusterId}`)}</em>
              </article>
            `,
          )
          .join("")}</div>
      </section>
    </div>
  `;
}

function assignmentTable() {
  return `
    <div class="tableWrap">
      <table>
        <thead><tr><th>Assignment</th><th>Queue</th><th>Exposure</th><th>Topic fit</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${assignments
            .map(
              (assignment) => `
                <tr class="${state.selectedAssignmentId === assignment.id ? "selectedRow" : ""}">
                  <td>${escapeHtml(assignment.id)}</td>
                  <td>${humanize(assignment.queueType)}</td>
                  <td>${humanize(assignment.exposure)}</td>
                  <td>${humanize(assignment.topicFit)}</td>
                  <td>${statusChip(assignment.status)}</td>
                  <td><button class="rowButton openAssignment" data-assignment-id="${escapeHtml(assignment.id)}" type="button">Open ${icon("chevron")}</button></td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindEvents({ selectedAssignment, labelSnapshot, manifests, releaseReport }) {
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
      state.section = button.getAttribute("data-section");
      render();
    });
  });
  document.querySelectorAll(".openAssignment").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedAssignmentId = button.getAttribute("data-assignment-id");
      state.section = "rating";
      render();
    });
  });
  document.querySelectorAll("[data-dimension]").forEach((input) => {
    input.addEventListener("input", () => {
      const dimension = input.getAttribute("data-dimension");
      state.draftScores[dimension] = Number(input.value);
      const output = document.querySelector(`[data-output="${dimension}"]`);
      if (output) output.textContent = Number(input.value).toFixed(2);
    });
  });
  document.querySelectorAll("[data-flag]").forEach((input) => {
    input.addEventListener("change", () => {
      state.draftFlags[input.getAttribute("data-flag")] = input.checked;
    });
  });
  document.getElementById("verificationStatus")?.addEventListener("change", (event) => {
    state.draftVerification.status = event.target.value;
  });
  document.getElementById("verificationNote")?.addEventListener("input", (event) => {
    state.draftVerification.note = event.target.value;
  });
  document.getElementById("submitRating")?.addEventListener("click", async () => {
    const position = positions.find((item) => item.id === selectedAssignment.positionId);
    const critique = critiques.find((item) => item.id === selectedAssignment.critiqueId);
    const clarity = state.draftScores.clarity ?? 1;
    const actor = state.session?.user ?? { id: "demo-rater", role: "graduate" };
    const newRating = {
      id: `rating-demo-${Date.now()}`,
      assignmentId: selectedAssignment.id,
      positionId: selectedAssignment.positionId,
      critiqueId: selectedAssignment.critiqueId,
      raterId: actor.id,
      raterTier: actor.role,
      kind: "blind_initial",
      rubricVersion: "lmca-app-f-2026-10",
      positionTextVersionId: position?.textVersions.at(-1)?.id ?? "",
      critiqueTextVersionId: critique?.textVersions.at(-1)?.id ?? "",
      ratingContextSnapshotId: contextSnapshotForAssignment(selectedAssignment)?.id ?? "rc-target-only-1",
      scores: { ...state.draftScores },
      provisionalDimensions: clarity < 0.5 ? RUBRIC_DIMENSIONS.filter((dimension) => !["clarity", "overall", "correctness"].includes(dimension)) : [],
      correctnessVerificationStatus: state.draftVerification.status,
      correctnessVerificationNote: state.draftVerification.note,
      rationale: "Demo submission from the local blind-rating workspace.",
      flags: { ...state.draftFlags },
      activeSeconds: 620,
      idleGapSeconds: 20,
      interruptionCount: 0,
      submittedAt: new Date().toISOString(),
      lockedAt: new Date().toISOString(),
    };
    state.ratings.push(newRating);
    state.lastPersistenceStatus = { tone: "warn", title: "Audit persistence pending", detail: "Submitting append-only rating event." };
    render();
    state.lastPersistenceStatus = await persistRating("/api/ratings/blind", newRating);
    render();
  });
  document.getElementById("appendRevision")?.addEventListener("click", async () => {
    const original = state.ratings.find((rating) => rating.positionId === selectedAssignment.positionId && rating.critiqueId === selectedAssignment.critiqueId);
    if (!original) return;
    const overall = original.scores.overall;
    const revision = appendRatingRevision(original, {
      id: `${original.id}-self-check-${Date.now()}`,
      scores: { ...original.scores, overall: typeof overall === "number" ? Math.min(1, Math.round((overall + 0.02) * 100) / 100) : overall },
      revisionReasonCode: "human_only_self_check",
      revisionComment: "Locked first rating preserved; self-check appends a separate revision.",
    });
    state.ratings.push(revision);
    state.lastPersistenceStatus = { tone: "warn", title: "Audit persistence pending", detail: "Submitting append-only revision event." };
    render();
    state.lastPersistenceStatus = await persistRating("/api/ratings/revisions", revision);
    render();
  });
  document.getElementById("submitSourceStyleAudit")?.addEventListener("click", async () => {
    const lockedInitialRating = lockedInitialRatingForAssignment(selectedAssignment);
    if (!lockedInitialRating) return;
    const audit = createDemoSourceStyleAudit(selectedAssignment, lockedInitialRating);
    state.sourceStyleAudits.push(audit);
    state.lastSourceStyleAuditStatus = { tone: "warn", title: "Source/style audit pending", detail: "Submitting post-lock diagnostic event." };
    render();
    state.lastSourceStyleAuditStatus = await persistSourceStyleAudit(audit);
    render();
  });
  document.querySelectorAll(".downloadManifest").forEach((button) => {
    button.addEventListener("click", () => {
      const manifest = manifests.find((item) => item.id === button.getAttribute("data-manifest-id"));
      if (manifest) downloadJson(`${manifest.id}.json`, manifest);
    });
  });
  document.getElementById("downloadReleaseReport")?.addEventListener("click", () => downloadJson(`${releaseReport.id}.json`, releaseReport));
  document.getElementById("downloadTrainingExport")?.addEventListener("click", () => downloadJson(`${releaseReport.trainingExport.id}.json`, releaseReport.trainingExport));
  document.getElementById("downloadSnapshot")?.addEventListener("click", () => downloadJson("label-snapshot-demo.json", labelSnapshot));
  document.getElementById("submitCertificationAttempt")?.addEventListener("click", async () => {
    state.lastCertificationStatus = { tone: "warn", title: "Certification persistence pending", detail: "Submitting signed certification attempt." };
    render();
    const result = await persistCertificationAttempt(createDemoCertificationAttempt());
    state.lastCertificationStatus = result.status;
    if (result.report) state.certificationStatus = result.report;
    render();
  });
  document.getElementById("recordBenchmarkAccess")?.addEventListener("click", async () => {
    state.lastBenchmarkStatus = { tone: "warn", title: "Benchmark access pending", detail: "Submitting signed admin exposure event." };
    render();
    const result = await persistBenchmarkExposure(createDemoBenchmarkExposure());
    state.lastBenchmarkStatus = result.status;
    if (result.report) state.hiddenBenchmarkFreezeReport = result.report;
    render();
  });
}

function navButton(id, label, iconName) {
  return `<button class="navItem ${state.section === id ? "active" : ""}" data-section="${id}" type="button">${icon(iconName)}${escapeHtml(label)}</button>`;
}

function sliderRow(dimension) {
  const value = state.draftScores[dimension];
  return `
    <label class="sliderRow">
      <span><strong>${humanize(dimension)}</strong><em>${escapeHtml(dimensionGuidance[dimension])}</em></span>
      <input data-dimension="${dimension}" max="1" min="0" step="0.01" type="range" value="${typeof value === "number" ? value : 0}" />
      <output data-output="${dimension}">${typeof value === "number" ? value.toFixed(2) : "null"}</output>
    </label>
  `;
}

function issueFlagControls() {
  return `<div class="flagGrid">${raterIssueFlags.map(checkRow).join("")}</div>`;
}

function checkRow(flag) {
  const value = state.draftFlags[flag.key] ?? false;
  return `
    <label class="checkRow">
      <input data-flag="${escapeHtml(flag.key)}" ${value ? "checked" : ""} type="checkbox" />
      <span><strong>${escapeHtml(flag.label)}</strong><em>${escapeHtml(flag.detail)}</em></span>
    </label>
  `;
}

function verificationControls() {
  const statuses = ["not_needed", "verified", "not_practicable", "unresolved"];
  return `
    <div class="verificationControls">
      <label>
        <span>Correctness verification</span>
        <select id="verificationStatus">
          ${statuses.map((status) => `<option ${state.draftVerification.status === status ? "selected" : ""} value="${escapeHtml(status)}">${humanize(status)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Verification note</span>
        <input id="verificationNote" type="text" value="${escapeHtml(state.draftVerification.note)}" />
      </label>
    </div>
  `;
}

function queueMixCard(label, values) {
  return `<article class="queueMixCard"><strong>${escapeHtml(label)}</strong><div>${values.map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div></article>`;
}

function persistenceLine(status) {
  return statusLine(status, "persistenceLine");
}

function statusLine(status, className) {
  if (!status) return "";
  return `
    <div class="${escapeHtml(className)} ${escapeHtml(status.tone)}">
      ${icon(status.tone === "good" ? "check" : status.tone === "bad" ? "alert" : "database")}
      <span><strong>${escapeHtml(status.title)}</strong>${escapeHtml(status.detail)}</span>
    </div>
  `;
}

async function bootstrapSession() {
  try {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "demo-rater" }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "session request failed");
    state.session = { token: body.token, user: body.user };
    state.sessionStatus = {
      tone: "good",
      title: "Signed demo session",
      detail: `${body.user.displayName} (${body.user.role})`,
    };
    await refreshCertificationStatus();
  } catch {
    state.session = null;
    state.sessionStatus = {
      tone: "warn",
      title: "Static fallback session",
      detail: "Server session unavailable; writes remain local until the Node server is running.",
    };
  }
}

async function refreshCertificationStatus() {
  if (!state.session?.token) return;
  try {
    const response = await fetch("/api/certification/status", {
      headers: { authorization: `Bearer ${state.session.token}` },
    });
    if (!response.ok) return;
    state.certificationStatus = await response.json();
  } catch {
    state.certificationStatus = null;
  }
}

async function ensureSession() {
  if (state.session?.token) return state.session;
  await bootstrapSession();
  return state.session;
}

async function ensureAdminSession() {
  if (state.adminSession?.token) return state.adminSession;
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: "demo-admin" }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "admin session request failed");
  state.adminSession = { token: body.token, user: body.user };
  return state.adminSession;
}

async function persistRating(endpoint, rating) {
  try {
    const session = await ensureSession();
    if (!session?.token) throw new Error("session unavailable");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ rating }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        tone: "bad",
        title: "Audit persistence rejected",
        detail: body.detail ?? body.error ?? "Server rejected the rating event.",
      };
    }
    return {
      tone: "good",
      title: "Audit event persisted",
      detail: `${body.eventId.slice(0, 8)} recorded with ${body.payloadHash.slice(0, 18)}...`,
    };
  } catch {
    return {
      tone: "warn",
      title: "Local session only",
      detail: "Server API unavailable; this event remains in browser memory.",
    };
  }
}

async function persistSourceStyleAudit(audit) {
  try {
    const session = await ensureSession();
    if (!session?.token) throw new Error("session unavailable");
    const response = await fetch("/api/source-style/audits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ audit }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        tone: "bad",
        title: "Source/style audit rejected",
        detail: body.detail ?? body.error ?? "Server rejected the source/style audit event.",
      };
    }
    return {
      tone: "good",
      title: "Source/style audit persisted",
      detail: `${body.eventId.slice(0, 8)} recorded with ${body.payloadHash.slice(0, 18)}...`,
    };
  } catch {
    return {
      tone: "warn",
      title: "Local source/style audit only",
      detail: "Server API unavailable; this diagnostic remains in browser memory.",
    };
  }
}

async function persistCertificationAttempt(attempt) {
  try {
    const session = await ensureSession();
    if (!session?.token) throw new Error("session unavailable");
    const response = await fetch("/api/certification/attempts", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ attempt }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        status: {
          tone: "bad",
          title: "Certification rejected",
          detail: body.detail ?? body.error ?? "Server rejected the certification attempt.",
        },
      };
    }
    return {
      report: body.report,
      status: {
        tone: body.scoredAttempt.status === "certified" ? "good" : "warn",
        title: "Certification attempt persisted",
        detail: `${body.scoredAttempt.status}; ${body.payloadHash.slice(0, 18)}...`,
      },
    };
  } catch {
    return {
      status: {
        tone: "warn",
        title: "Local certification only",
        detail: "Server API unavailable; certification status is not persisted.",
      },
    };
  }
}

async function persistBenchmarkExposure(exposure) {
  try {
    const session = await ensureAdminSession();
    if (!session?.token) throw new Error("admin session unavailable");
    const response = await fetch("/api/benchmark/exposures", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ exposure }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        status: {
          tone: "bad",
          title: "Benchmark access rejected",
          detail: body.detail ?? body.error ?? "Server rejected the benchmark exposure event.",
        },
      };
    }
    return {
      report: body.report,
      status: {
        tone: "good",
        title: "Benchmark access logged",
        detail: `${body.eventId.slice(0, 8)} recorded with ${body.payloadHash.slice(0, 18)}...`,
      },
    };
  } catch {
    return {
      status: {
        tone: "warn",
        title: "Local freeze report only",
        detail: "Server API unavailable; benchmark access was not persisted.",
      },
    };
  }
}

function createDemoCertificationAttempt() {
  return {
    id: `cert-demo-${Date.now()}`,
    raterId: state.session?.user?.id ?? "demo-rater",
    packId: "cert-tier-zero-2026-10",
    rubricVersion: "lmca-app-f-2026-10",
    submittedAt: new Date().toISOString(),
    goldItemsCompleted: 20,
    duplicateItemsCompleted: 5,
    hardAmbiguityItemsCompleted: 5,
    duplicateConsistencyMeanAbsDiff: 0.06,
    hardAmbiguityReviewPass: true,
    itemResults: [
      {
        itemId: "gold-ai-selectivity",
        dimensionErrors: Object.fromEntries(RUBRIC_DIMENSIONS.map((dimension) => [dimension, dimension === "correctness" ? 0.1 : 0.07])),
      },
    ],
  };
}

function createDemoSourceStyleAudit(assignment, lockedInitialRating) {
  const critique = critiques.find((item) => item.id === assignment.critiqueId);
  const sourceGuess =
    critique?.sourceType === "llm_generated" ? "llm_generated" : critique?.sourceType === "expert_written" ? "expert_written" : "human_written";
  const authorshipGuess = critique?.authorshipType === "model" ? "model" : critique?.authorshipType === "expert" ? "expert" : "volunteer";
  const styleGuess = critique?.styleBand ?? "unknown";
  return {
    id: `source-style-demo-${Date.now()}`,
    ratingId: lockedInitialRating.id,
    assignmentId: assignment.id,
    positionId: assignment.positionId,
    critiqueId: assignment.critiqueId,
    raterId: lockedInitialRating.raterId,
    collectedAt: new Date().toISOString(),
    sourceGuess,
    authorshipGuess,
    styleGuess,
    styleGuessConfidence: styleGuess === "fluent_obfuscated_risk" ? 0.88 : 0.72,
    collectionPhase: "post_initial_lock",
    shownBeforeInitialLock: false,
    usedForScoring: false,
    notes: "Demo post-lock diagnostic source/style guess.",
  };
}

function createDemoBenchmarkExposure() {
  return {
    action: "membership_view",
    artifactId: "hidden-benchmark-freeze-october-2026-demo",
    purpose: "access_audit_review",
    accessPhase: "pre_freeze",
    notes: "Demo admin reviewed the restricted freeze report summary.",
  };
}

function auditCard(title, value, status, detail) {
  return `<article class="auditCard"><header>${statusChip(status)}<strong>${escapeHtml(title)}</strong></header><div>${escapeHtml(value)}</div><p>${escapeHtml(detail)}</p></article>`;
}

function runCard(run, customLossAvailable) {
  return `
    <article class="runCard">
      <header><strong>${escapeHtml(run.requestedModelAlias)}</strong>${statusChip(run.mode)}</header>
      ${metricList([
        ["Resolved snapshot", run.resolvedModelSnapshot],
        ["Prompt family", humanize(run.promptFamily)],
        ["Prompt scope", humanize(run.promptScope)],
        ["Prompt artifact", run.promptArtifact?.id ?? "missing"],
        ["Rendered checksum", run.renderedPromptChecksum ?? "missing"],
        ["Prompt policy", humanize(run.promptPolicyComparabilityStatus ?? "missing")],
        ["Output format", humanize(run.promptArtifact?.outputFormatPolicy ?? "unknown")],
        ["Parser", run.parserConfigId],
        ["Parse failures", String(run.parseFailureCount)],
        ["Custom loss", customLossAvailable ? "available" : "unavailable, not imputed"],
      ])}
    </article>
  `;
}

function panelTitle(iconName, title, detail) {
  return `<div class="panelTitle">${icon(iconName)}<div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(detail)}</p></div></div>`;
}

function metricCard(title, value, detail) {
  return `<article class="metricCard"><span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong><em>${escapeHtml(detail)}</em></article>`;
}

function metricList(rows) {
  return `<dl class="metricList">${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`;
}

function stat(label, value, tone = "") {
  return `<div class="stat ${tone}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function statusChip(value) {
  const normalized = String(value).toLowerCase();
  const tone =
    normalized.includes("pass") || normalized.includes("eligible") || normalized.includes("locked") || normalized.includes("parsed")
      ? "good"
      : normalized.includes("fail") || normalized.includes("blocked")
        ? "bad"
        : normalized.includes("partial") ||
            normalized.includes("deferred") ||
            normalized.includes("escalated") ||
            normalized.includes("incomplete") ||
            normalized.includes("restricted") ||
            normalized.includes("pending")
          ? "warn"
          : "neutral";
  return `<span class="statusChip ${tone}">${humanize(value)}</span>`;
}

function icon(name) {
  const icons = {
    clipboard: '<path d="M9 3h6l1 2h3v16H5V5h3l1-2Z"/><path d="M9 9h6M9 13h6M9 17h4"/>',
    eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    scale: '<path d="M12 3v18M6 6h12M6 6l-4 7h8L6 6Zm12 0-4 7h8l-4-7Z"/>',
    shield: '<path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>',
    chart: '<path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-9"/>',
    download: '<path d="M12 3v12M8 11l4 4 4-4M4 21h16"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    branch: '<path d="M6 3v6a3 3 0 0 0 3 3h9"/><circle cx="6" cy="3" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="21" r="2"/><path d="M6 19v-8"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
    alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    archive: '<path d="M3 5h18v4H3zM5 9v11h14V9M10 13h4"/>',
    flask: '<path d="M9 3h6M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3"/><path d="M8 15h8"/>',
    rank: '<path d="M5 19h14M7 15l3-3 3 3 4-6"/><path d="M6 11h3v8H6zM11 8h3v11h-3zM16 5h3v14h-3z"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="14" cy="18" r="2"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
  };
  return `<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name] ?? icons.clipboard}</svg>`;
}

function downloadJson(fileName, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function humanize(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return value.toFixed(3);
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return `${Math.round(value * 100)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
void bootstrapSession().then(render);
