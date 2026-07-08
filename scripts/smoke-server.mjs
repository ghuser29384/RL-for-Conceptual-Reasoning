import assert from "node:assert/strict";
import { request } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { scoreExplanationOverallProductDiagnostic } from "../src/domain/core.mjs";
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

    const releaseReportSnapshot = await requestJson(`${baseUrl}/api/v1/release-reports`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(releaseReportSnapshot.status, 201);
    assert.equal(releaseReportSnapshot.body.resourceKey, "releaseReport");

    const releaseReportCollection = await requestJson(`${baseUrl}/api/v1/release-reports`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(releaseReportCollection.status, 200);
    assert.equal(releaseReportCollection.body.resourceKey, "releaseReport");
    assert.equal(releaseReportCollection.body.count, 1);
    assert.equal(releaseReportCollection.body.items[0].id, releaseReportSnapshot.body.releaseReportId);

    const operatorActionItems = await requestJson(`${baseUrl}/api/v1/operator-action-items`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(operatorActionItems.status, 200);
    assert.equal(operatorActionItems.body.resourceKey, "operatorActionItem");
    assert.equal(operatorActionItems.body.releaseUseStatus, "operator_evidence_submission_plan_open");
    assert.equal(operatorActionItems.body.counts.collectDataActionItems, 11);
    assert.equal(operatorActionItems.body.counts.submitArtifactActionItems, 29);
    assert.equal(
      operatorActionItems.body.items.find((item) => item.artifactKind === "artifact_probe")?.writeRoute,
      "/api/v1/artifact-probes/run",
    );
    assert.equal(operatorActionItems.body.items[0].targetGapId, "positions");
    assert.equal(operatorActionItems.body.items[0].targetGapReadbackItemRoute, "/api/v1/target-gaps/positions");
    assert.equal(operatorActionItems.body.items[0].targetDataTemplateReadbackRoute, "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions");
    assert.equal(
      operatorActionItems.body.items[0].targetDataExpandedTemplateReadbackRoute,
      "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&expand=remaining",
    );
    assert.equal(
      operatorActionItems.body.items[0].targetDataCappedExpandedTemplateReadbackRoute,
      "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&expand=remaining&maxExpandedRecords=100",
    );
    assert.deepEqual(operatorActionItems.body.items[0].templateReadbackRoutes, [
      "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions",
      "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&expand=remaining",
      "/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&expand=remaining&maxExpandedRecords=100",
    ]);
    assert.equal(
      operatorActionItems.body.items.find((item) => item.artifactKind === "label_snapshot").payloadTemplateReadbackRoute,
      "/api/v1/operator-action-items/payload-template?checklistRowId=release_artifact_submission_package&actionType=submit_artifact&artifactKind=label_snapshot",
    );
    assert.deepEqual(
      operatorActionItems.body.items.find((item) => item.actionType === "review_artifact" && item.artifactId === "leaderboard_model_run_provenance")
        .relatedSubmitActionIds,
      ["model_evaluation_reproducibility:submit:leaderboard_model_run_provenance"],
    );
    assert.equal(
      operatorActionItems.body.items.find((item) => item.actionType === "review_artifact" && item.artifactId === "leaderboard_model_run_provenance")
        .readbackItemRoute,
      "/api/v1/release-report-sections/model-evaluation-reproducibility-checklist-october-2026-demo",
    );
    const exactLeaderboardSubmitAction = await requestJson(
      `${baseUrl}/api/v1/operator-action-items?actionId=model_evaluation_reproducibility%3Asubmit%3Aleaderboard_model_run_provenance`,
      { headers: { authorization: `Bearer ${adminSession.body.token}` } },
    );
    assert.equal(exactLeaderboardSubmitAction.status, 200);
    assert.equal(exactLeaderboardSubmitAction.body.count, 1);
    assert.equal(exactLeaderboardSubmitAction.body.items[0].artifactKind, "leaderboard_model_run_provenance");
    const leaderboardReviewSummary = await requestJson(
      `${baseUrl}/api/v1/operator-review-artifact-summaries?artifactId=leaderboard_model_run_provenance`,
      { headers: { authorization: `Bearer ${adminSession.body.token}` } },
    );
    assert.equal(leaderboardReviewSummary.status, 200);
    assert.deepEqual(leaderboardReviewSummary.body.items[0].relatedSubmitActionIds, [
      "model_evaluation_reproducibility:submit:leaderboard_model_run_provenance",
    ]);
    const runEnvironmentReviewSummary = await requestJson(
      `${baseUrl}/api/v1/operator-review-artifact-summaries?relatedArtifactKind=model_run_environment`,
      { headers: { authorization: `Bearer ${adminSession.body.token}` } },
    );
    assert.equal(runEnvironmentReviewSummary.status, 200);
    assert.equal(runEnvironmentReviewSummary.body.count, 1);
    assert.equal(runEnvironmentReviewSummary.body.items[0].artifactId, "submitted_run_inference_environment_provenance");

    const raterOperatorActionItems = await requestJson(`${baseUrl}/api/v1/operator-action-items`, {
      headers: { authorization: `Bearer ${graduateSession.body.token}` },
    });
    assert.equal(raterOperatorActionItems.status, 403);

    const targetGaps = await requestJson(`${baseUrl}/api/v1/target-gaps`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(targetGaps.status, 200);
    assert.equal(targetGaps.body.resourceKey, "targetGap");
    assert.equal(targetGaps.body.count, 7);
    assert.equal(targetGaps.body.filteredCounts.remainingTotal, 2034);
    assert.equal(targetGaps.body.items.find((item) => item.id === "positions").remaining, 117);

    const lmcaComparison = await requestJson(`${baseUrl}/api/v1/lmca-comparison?section=model_score_anchor`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(lmcaComparison.status, 200);
    assert.equal(lmcaComparison.body.resourceKey, "lmcaComparisonRow");
    assert.equal(lmcaComparison.body.count, 7);
    assert.equal(lmcaComparison.body.filteredCounts.modelScoreAnchors, 7);

    const octoberOperatingPlan = await requestJson(`${baseUrl}/api/v1/october-operating-plan?section=workstream&targetGapId=blind_initial_ratings`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(octoberOperatingPlan.status, 200);
    assert.equal(octoberOperatingPlan.body.resourceKey, "octoberOperatingPlanRow");
    assert.equal(octoberOperatingPlan.body.count, 5);
    assert.equal(octoberOperatingPlan.body.filteredCounts.blockedWorkstreams, 5);

    const octoberCompletionChecklist = await requestJson(
      `${baseUrl}/api/v1/october-completion-checklist?status=data_collection_required`,
      {
        headers: { authorization: `Bearer ${adminSession.body.token}` },
      },
    );
    assert.equal(octoberCompletionChecklist.status, 200);
    assert.equal(octoberCompletionChecklist.body.resourceKey, "octoberCompletionChecklistRow");
    assert.equal(octoberCompletionChecklist.body.count, 3);
    assert.equal(octoberCompletionChecklist.body.filteredCounts.dataCollectionRequired, 3);
    assert.equal(octoberCompletionChecklist.body.items[0].operatorActionRoute, "/api/v1/operator-action-items?checklistRowId=target_scale_and_data_collection");
    assert.equal(octoberCompletionChecklist.body.items[0].nextOperatorActionSummary.targetGapId, "positions");
    assert.equal(octoberCompletionChecklist.body.items[0].nextOperatorActionSummary.dryRunImportRoute, "/api/v1/intake/positions/import-jsonl?dryRun=true");
    assert.ok(octoberCompletionChecklist.body.items[0].templateReadbackRoutes.includes("/api/v1/target-gaps/import-jsonl-template?targetGapId=positions"));

    const blindRatingRunbook = await requestJson(`${baseUrl}/api/v1/october-completion-runbook?phase=collect_data&targetGapId=blind_initial_ratings`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(blindRatingRunbook.status, 200);
    assert.equal(blindRatingRunbook.body.resourceKey, "octoberCompletionRunbookStep");
    assert.deepEqual(
      blindRatingRunbook.body.items.map((item) => item.stepKind),
      ["setup_data_import", "setup_data_import", "primary_data_import"],
    );
    assert.equal(blindRatingRunbook.body.items[0].importRoute, "/api/v1/assignments/import-jsonl");
    assert.equal(blindRatingRunbook.body.items[0].packageImportRoute, "/api/v1/target-gaps/import-jsonl-package");
    assert.equal(blindRatingRunbook.body.items[0].packageDryRunImportRoute, "/api/v1/target-gaps/import-jsonl-package?dryRun=true");
    assert.equal(blindRatingRunbook.body.items[1].importRoute, "/api/v1/rating-context-snapshots/import-jsonl");
    assert.equal(blindRatingRunbook.body.items[1].resourceKey, "ratingContextSnapshot");
    assert.equal(blindRatingRunbook.body.items[2].importRoute, "/api/v1/ratings/import-jsonl");
    assert.equal(blindRatingRunbook.body.items[2].packageValidateOnlyImportRoute, "/api/v1/target-gaps/import-jsonl-package?validateOnly=true");

    const releaseArtifactRunbook = await requestJson(
      `${baseUrl}/api/v1/october-completion-runbook?phase=submit_operator_evidence&checklistRowId=release_artifact_submission_package`,
      { headers: { authorization: `Bearer ${adminSession.body.token}` } },
    );
    assert.equal(releaseArtifactRunbook.status, 200);
    const corpusManifestRunbookStep = releaseArtifactRunbook.body.items.find((item) => item.artifactKind === "corpus_manifest");
    assert.ok(corpusManifestRunbookStep);
    assert.equal(corpusManifestRunbookStep.importRoute, "/api/v1/operator-evidence/import-jsonl");
    assert.equal(corpusManifestRunbookStep.packageImportRoute, "/api/v1/operator-evidence/import-jsonl");
    assert.equal(corpusManifestRunbookStep.packageDryRunImportRoute, "/api/v1/operator-evidence/import-jsonl?dryRun=true");

    const releaseReportSections = await requestJson(
      `${baseUrl}/api/v1/release-report-sections/model-evaluation-reproducibility-checklist-october-2026-demo`,
      {
        headers: { authorization: `Bearer ${adminSession.body.token}` },
      },
    );
    assert.equal(releaseReportSections.status, 200);
    assert.equal(releaseReportSections.body.resourceKey, "releaseReportSection");
    assert.equal(releaseReportSections.body.count, 1);
    assert.equal(releaseReportSections.body.item.sourceEvidenceId, "model-evaluation-reproducibility-checklist-october-2026-demo");
    assert.ok(releaseReportSections.body.item.sectionKeys.includes("modelEvaluationReproducibilityChecklist"));

    const blindRatingCollectionPlan = await requestJson(`${baseUrl}/api/v1/target-gaps/collection-plan?targetGapId=blind_initial_ratings`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(blindRatingCollectionPlan.status, 200);
    assert.equal(blindRatingCollectionPlan.body.resourceKey, "targetGapCollectionPlan");
    assert.equal(blindRatingCollectionPlan.body.packageImportRoute, "/api/v1/target-gaps/import-jsonl-package");
    assert.equal(blindRatingCollectionPlan.body.count, 1);
    assert.equal(blindRatingCollectionPlan.body.items[0].targetGapId, "blind_initial_ratings");
    assert.equal(blindRatingCollectionPlan.body.items[0].packageImportRoute, "/api/v1/target-gaps/import-jsonl-package");
    assert.equal(blindRatingCollectionPlan.body.items[0].packageDryRunImportRoute, "/api/v1/target-gaps/import-jsonl-package?dryRun=true");
    assert.deepEqual(
      blindRatingCollectionPlan.body.items[0].importSequence.map((step) => step.stepKind),
      ["setup_data_import", "setup_data_import", "primary_data_import"],
    );
    assert.equal(blindRatingCollectionPlan.body.items[0].setupBulkImportRoute, "/api/v1/assignments/import-jsonl");
    assert.equal(blindRatingCollectionPlan.body.items[0].importSequence[1].importRoute, "/api/v1/rating-context-snapshots/import-jsonl");
    assert.equal(blindRatingCollectionPlan.body.items[0].bulkImportRoute, "/api/v1/ratings/import-jsonl");

    const targetDataTemplate = await requestJson(
      `${baseUrl}/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&checklistRowId=target_scale_and_data_collection`,
      { headers: { authorization: `Bearer ${adminSession.body.token}` } },
    );
    assert.equal(targetDataTemplate.status, 200);
    assert.equal(targetDataTemplate.body.resourceKey, "targetDataCollectionJsonlTemplate");
    assert.equal(targetDataTemplate.body.packageImportRoute, "/api/v1/target-gaps/import-jsonl-package");
    assert.equal(targetDataTemplate.body.packageDryRunImportRoute, "/api/v1/target-gaps/import-jsonl-package?dryRun=true");
    assert.equal(targetDataTemplate.body.count, 1);
    assert.equal(targetDataTemplate.body.items[0].targetGapId, "positions");
    assert.equal(targetDataTemplate.body.items[0].importRoute, "/api/v1/intake/positions/import-jsonl");
    assert.equal(targetDataTemplate.body.items[0].packageImportRoute, "/api/v1/target-gaps/import-jsonl-package");
    assert.equal(targetDataTemplate.body.items[0].record.templateOnly, true);
    assert.equal(targetDataTemplate.body.items[0].record.position.templateOnly, true);
    assert.equal(targetDataTemplate.body.items[0].importImpact.remaining, 117);

    const expandedTargetDataTemplate = await requestJson(
      `${baseUrl}/api/v1/target-gaps/import-jsonl-template?targetGapId=positions&checklistRowId=target_scale_and_data_collection&expand=remaining&maxExpandedRecords=3`,
      { headers: { authorization: `Bearer ${adminSession.body.token}` } },
    );
    assert.equal(expandedTargetDataTemplate.status, 200);
    assert.equal(expandedTargetDataTemplate.body.expansion.mode, "remaining");
    assert.equal(expandedTargetDataTemplate.body.count, 3);
    assert.equal(expandedTargetDataTemplate.body.items[0].expandedRecordCapApplied, true);
    assert.equal(JSON.parse(expandedTargetDataTemplate.body.jsonl.split("\n")[2]).templateOnly, true);

    const unchangedTargetTemplateImport = await requestJson(`${baseUrl}${targetDataTemplate.body.items[0].importRoute}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({ jsonl: JSON.stringify(targetDataTemplate.body.items[0].record) }),
    });
    assert.equal(unchangedTargetTemplateImport.status, 400);
    assert.equal(unchangedTargetTemplateImport.body.error, "target_data_collection_template_record");

    const unchangedTargetTemplatePackageImport = await requestJson(`${baseUrl}${targetDataTemplate.body.packageImportRoute}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({ jsonl: JSON.stringify(targetDataTemplate.body.items[0].record) }),
    });
    assert.equal(unchangedTargetTemplatePackageImport.status, 400);
    assert.equal(unchangedTargetTemplatePackageImport.body.error, "target_data_collection_package_template_record");

    const replacedPositionDryRun = await requestJson(`${baseUrl}${targetDataTemplate.body.items[0].importRoute}?dryRun=true`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({
        jsonl: JSON.stringify({
          targetGapId: "positions",
          importKind: "primary_data_import",
          importImpact: {
            targetGapId: "positions",
            importKind: "primary_data_import",
            importRoute: "/api/v1/intake/positions/import-jsonl",
          },
          position: {
            id: "pos-smoke-target-impact",
            text: "A smoke-test replacement position validates target-gap impact readback before any live append.",
            split: "public_train",
            topicFamily: "miscellaneous_topics",
            conceptualScope: "primarily_conceptual",
            groundTruthAvailability: "no_realistically_accessible_ground_truth",
            acceptedMethodologyStatus: "no_widely_accepted_resolution_methodology",
            nonConceptualDependencyNotes: "No central empirical dependency.",
            contextSufficiency: "sufficient",
            assumedBackgroundPolicy: "Assume only the rater-visible release terms.",
            pricedInContextNotes: "No hidden source context is priced in.",
            intakeScreening: {
              originalTextPreserved: true,
              raterVisibleTextVersionId: "ptv-pos-smoke-target-impact-v1",
              normalizationStatus: "not_needed",
              expertNormalizationRequired: false,
              adminOnlyAmbiguityNotes: [],
              adminOnlyIntendedConclusionNotes: [],
              notesVisibleToInitialRaters: false,
              contextGapFlags: [],
              ordinaryHeadlineEligibility: "eligible",
            },
            rightsStatus: "cleared_internal",
          },
        }),
      }),
    });
    assert.equal(replacedPositionDryRun.status, 200);
    assert.equal(replacedPositionDryRun.body.dryRun, true);
    assert.equal(replacedPositionDryRun.body.noSideEffects, true);
    assert.equal(replacedPositionDryRun.body.targetGapImpactSummary.releaseReportVerificationRoute, "/api/release/report");
    assert.equal(replacedPositionDryRun.body.targetGapImpactSummary.scopedTargetGapCount, 1);
    assert.equal(replacedPositionDryRun.body.targetGapImpactSummary.rows[0].targetGapId, "positions");
    assert.equal(replacedPositionDryRun.body.targetGapImpactSummary.rows[0].expectedResourceDeltaFromPackageRecords, 1);
    assert.equal(replacedPositionDryRun.body.validatedResources[0].route, "/api/v1/intake/positions/import-jsonl");
    assert.equal(replacedPositionDryRun.body.validatedResources[0].targetGapId, "positions");

    const operatorEvidenceTemplate = await requestJson(`${baseUrl}/api/v1/operator-evidence/import-jsonl-template?artifactKind=corpus_manifest`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(operatorEvidenceTemplate.status, 200);
    assert.equal(operatorEvidenceTemplate.body.resourceKey, "operatorEvidencePackageJsonlTemplate");
    assert.equal(operatorEvidenceTemplate.body.importRoute, "/api/v1/operator-evidence/import-jsonl");
    assert.equal(operatorEvidenceTemplate.body.count, 1);
    assert.equal(operatorEvidenceTemplate.body.items[0].artifactKind, "corpus_manifest");
    assert.equal(operatorEvidenceTemplate.body.items[0].record.templateOnly, true);
    assert.equal(operatorEvidenceTemplate.body.items[0].record.payload.corpusManifest.releaseId, "october-2026-demo");

    const unchangedOperatorEvidenceImport = await requestJson(`${baseUrl}${operatorEvidenceTemplate.body.importRoute}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({ jsonl: JSON.stringify(operatorEvidenceTemplate.body.items[0].record) }),
    });
    assert.equal(unchangedOperatorEvidenceImport.status, 400);
    assert.equal(unchangedOperatorEvidenceImport.body.error, "operator_evidence_package_template_record");

    const payloadTemplate = await requestJson(`${baseUrl}/api/v1/operator-action-items/payload-template?artifactKind=label_snapshot`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(payloadTemplate.status, 200);
    assert.equal(payloadTemplate.body.resourceKey, "operatorActionPayloadTemplate");
    assert.equal(payloadTemplate.body.count, 1);
    assert.equal(payloadTemplate.body.items[0].artifactKind, "label_snapshot");
    assert.equal(payloadTemplate.body.items[0].policyGated, true);
    assert.equal(payloadTemplate.body.items[0].policyActionKind, "label_snapshot_freeze");
    assert.equal(payloadTemplate.body.items[0].requestBody.labelSnapshot.templateOnly, true);

    const unchangedPayloadTemplateWrite = await requestJson(`${baseUrl}${payloadTemplate.body.items[0].route}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify(payloadTemplate.body.items[0].requestBody),
    });
    assert.equal(unchangedPayloadTemplateWrite.status, 400);
    assert.equal(unchangedPayloadTemplateWrite.body.error, "workflow_template_record");
    assert.equal(unchangedPayloadTemplateWrite.body.resourceKey, "labelSnapshot");

    const discussionSubmissionChecklist = await requestJson(
      `${baseUrl}/api/v1/operator-submission-checklist?checklistRowId=discussion_and_adjudication_workflows&artifactKind=discussion`,
      { headers: { authorization: `Bearer ${adminSession.body.token}` } },
    );
    assert.equal(discussionSubmissionChecklist.status, 200);
    assert.equal(discussionSubmissionChecklist.body.count, 1);
    assert.equal(
      discussionSubmissionChecklist.body.items[0].payloadTemplateReadbackRoute,
      "/api/v1/operator-action-items/payload-template?checklistRowId=discussion_and_adjudication_workflows&actionType=submit_artifact&artifactKind=discussion",
    );
    assert.deepEqual(discussionSubmissionChecklist.body.items[0].templateReadbackRoutes, [
      discussionSubmissionChecklist.body.items[0].payloadTemplateReadbackRoute,
    ]);

    const sourceWorkbenchTemplate = await requestJson(`${baseUrl}/api/v1/metaphilosophy/source-workbench-template`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(sourceWorkbenchTemplate.status, 200);
    assert.equal(sourceWorkbenchTemplate.body.resourceKey, "metaphilosophySourceWorkbenchTemplate");
    assert.equal(sourceWorkbenchTemplate.body.count, 8);
    assert.equal(sourceWorkbenchTemplate.body.counts.byTemplateKind.source_card_write, 1);
    assert.equal(sourceWorkbenchTemplate.body.counts.byTemplateKind.source_span_write, 1);
    assert.equal(sourceWorkbenchTemplate.body.counts.byTemplateKind.extraction_jsonl_import, 1);
    assert.equal(sourceWorkbenchTemplate.body.counts.byTemplateKind.argument_extraction_review, 1);
    assert.equal(sourceWorkbenchTemplate.body.counts.byTemplateKind.prepared_position_draft_create, 1);
    assert.equal(sourceWorkbenchTemplate.body.counts.byTemplateKind.prepared_critique_draft_create, 1);
    assert.equal(sourceWorkbenchTemplate.body.counts.byTemplateKind.prepared_draft_review, 1);
    assert.equal(sourceWorkbenchTemplate.body.counts.byTemplateKind.prepared_draft_promote, 1);
    assert.match(sourceWorkbenchTemplate.body.policy.templateOnly, /reject unchanged template records/);

    const sourceCardTemplate = sourceWorkbenchTemplate.body.items.find((item) => item.templateKind === "source_card_write");
    assert.ok(sourceCardTemplate);
    assert.equal(sourceCardTemplate.route, "/api/v1/admin/sources");
    assert.equal(sourceCardTemplate.requestBody.sourceCard.templateOnly, true);
    assert.equal(sourceCardTemplate.requestBody.sourceCard.sourceVisibility, "admin_only_not_rater_visible");

    const extractionTemplate = sourceWorkbenchTemplate.body.items.find((item) => item.templateKind === "extraction_jsonl_import");
    assert.ok(extractionTemplate);
    assert.equal(extractionTemplate.routeTemplate, "/api/v1/admin/sources/{id}/extract");
    const preparedDraftPromoteTemplate = sourceWorkbenchTemplate.body.items.find((item) => item.templateKind === "prepared_draft_promote");
    assert.ok(preparedDraftPromoteTemplate);
    assert.equal(preparedDraftPromoteTemplate.routeTemplate, "/api/v1/admin/prepared-drafts/{id}/promote");
    assert.equal(preparedDraftPromoteTemplate.requestBody.promotion.templateOnly, true);
    assert.equal(extractionTemplate.dryRunImportRoute, "/api/v1/admin/sources/TODO_SOURCE_CARD_ID/extract?dryRun=true");
    assert.equal(extractionTemplate.validateOnlyImportRoute, "/api/v1/admin/sources/TODO_SOURCE_CARD_ID/extract?validateOnly=true");
    assert.equal(extractionTemplate.requestBody.templateOnly, true);
    assert.equal(extractionTemplate.requestBody.extractionBatch.templateOnly, true);
    assert.equal(JSON.parse(extractionTemplate.requestBody.jsonl.trim()).templateOnly, true);

    const raterSourceWorkbenchTemplate = await requestJson(`${baseUrl}/api/v1/metaphilosophy/source-workbench-template`, {
      headers: { authorization: `Bearer ${graduateSession.body.token}` },
    });
    assert.equal(raterSourceWorkbenchTemplate.status, 403);

    const templateOnlySourceCard = await requestJson(`${baseUrl}${sourceCardTemplate.route}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify(sourceCardTemplate.requestBody),
    });
    assert.equal(templateOnlySourceCard.status, 400);
    assert.equal(templateOnlySourceCard.body.error, "workflow_template_record");

    const templateOnlyExtractionImport = await requestJson(`${baseUrl}${extractionTemplate.dryRunImportRoute}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify(extractionTemplate.requestBody),
    });
    assert.equal(templateOnlyExtractionImport.status, 400);
    assert.equal(templateOnlyExtractionImport.body.error, "source_intake_template_record");

    const sourceCard = {
      id: "source-card-smoke-server",
      title: "Smoke source-to-position excerpt",
      sourceAuthor: "Smoke seminar instructor",
      sourceWork: "Smoke argument-quality reader",
      sourcePublisherOrSite: "Internal smoke fixture",
      publicationYear: "2026",
      uploadedFileId: null,
      sourceType: "coursework",
      sourceLocator: "smoke-reader:argument-quality:section-1",
      sourceProvenanceSummary: "Admin-created smoke source card for Phase 1 source intake.",
      rightsStatus: "internal_review_allowed",
      sourceLanguage: "en",
      translationStatus: "original_language",
      taskFormat: "mixed_position_and_critique_source",
      adminNotes: "Smoke-test source metadata remains admin-only and hidden from ordinary raters.",
      sourceAccessPolicy: "internal_review_allowed",
      releasePolicy: "prepared_text_only_after_review",
      sourceVisibility: "admin_only_not_rater_visible",
      createdBy: "demo-admin",
      createdAt: "2026-10-01T00:40:00.000Z",
    };
    const sourceCardResponse = await requestJson(`${baseUrl}/api/v1/source-cards`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({ sourceCard }),
    });
    assert.equal(sourceCardResponse.status, 201);

    const sourceCardCollection = await requestJson(`${baseUrl}/api/v1/source-cards`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(sourceCardCollection.status, 200);
    assert.equal(sourceCardCollection.body.resourceKey, "sourceCard");
    assert.equal(sourceCardCollection.body.count, 1);
    assert.equal(sourceCardCollection.body.items[0].id, sourceCard.id);

    const sourceSpan = {
      id: "source-span-smoke-server",
      sourceCardId: sourceCard.id,
      spanLocator: "chars:0-220",
      boundedLocator: "smoke reader section 1, chars 0-220",
      spanKind: "argumentative_claim",
      textHash: "sha256:source-span-smoke-server",
      adminExcerpt: "Smoke-test span text remains admin-only and is represented by a hash for raters.",
      excerptStoragePolicy: "store_hash_and_admin_excerpt_only_not_rater_visible",
      segmentationStatus: "manually_selected",
      extractionStatus: "selected_for_extraction",
      adminSelectionNotes: "Smoke-test selected span with source metadata hidden from raters.",
      sourceVisibility: "admin_only_not_rater_visible",
      createdBy: "demo-admin",
      createdAt: "2026-10-01T00:41:00.000Z",
    };
    const sourceSpanResponse = await requestJson(`${baseUrl}/api/v1/source-spans`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({ sourceSpan }),
    });
    assert.equal(sourceSpanResponse.status, 201);

    const extractionBatch = {
      id: "extraction-batch-smoke-server",
      sourceCardId: sourceCard.id,
      importFormat: "jsonl",
      importedBy: "demo-admin",
      importedAt: "2026-10-01T00:42:00.000Z",
      extractionCount: 1,
      parserVersion: "source-intake-jsonl-v1",
      importRoute: "admin_jsonl_extraction_import",
      extractionExecutionMode: "manual_jsonl_import_no_platform_ai_execution",
      downstreamIntegrationStatus: "not_integrated_phase_1",
      createsPreparedDraft: false,
      createsCandidateItem: false,
      createsCandidateBatch: false,
      liveQueueIntegration: false,
      aiExtractionExecuted: false,
    };
    const argumentExtraction = {
      id: "argument-extraction-smoke-server",
      sourceSpanIds: [sourceSpan.id],
      argumentRole: "mixed_position_and_critique",
      intendedConclusion: "A good philosophical argument should make its inferential burden explicit.",
      keyPremises: [
        "Hidden burdens make arguments hard to assess.",
        "Explicit burdens help reviewers separate position preparation from critique preparation.",
      ],
      argumentSummary: "The source span provides a possible prepared position and a possible critique of vague plausibility gestures.",
      implicitAssumptions: ["Argument quality depends on inspectable inferential structure."],
      critiqueTarget: "Critiques that sound plausible without identifying the burden they satisfy.",
      contextNeeded: "Reviewer needs the local source context before any later preparation phase.",
      conceptualScopeNotes: "Primarily conceptual methodology claim.",
      suitabilityNotes: "Suitable for future manual source-to-position or source-to-critique preparation.",
      possiblePreparedPositionText: "A good philosophical argument should make its inferential burden explicit.",
      possiblePreparedCritiqueText: "A critique is weak if it sounds plausible but does not identify which inferential burden the position fails to meet.",
      extractedPositionText: "A good philosophical argument should make its inferential burden explicit.",
      extractionRationale: "The source span contains a candidate position about argument quality.",
      extractionMethod: "manual_jsonl_import",
    };
    const extractionImport = await requestJson(`${baseUrl}/api/v1/extraction-batches/import-jsonl`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({ extractionBatch, jsonl: `${JSON.stringify(argumentExtraction)}\n` }),
    });
    assert.equal(extractionImport.status, 201);
    assert.equal(extractionImport.body.importedExtractionCount, 1);
    assert.equal(extractionImport.body.safety.createdPreparedDrafts, false);
    assert.equal(extractionImport.body.safety.createdCandidateItems, false);
    assert.equal(extractionImport.body.safety.createdCandidateBatches, false);
    assert.equal(extractionImport.body.safety.liveQueueIntegrated, false);
    assert.equal(extractionImport.body.safety.aiExtractionExecuted, false);

    const argumentExtractionCollection = await requestJson(`${baseUrl}/api/v1/argument-extractions`, {
      headers: { authorization: `Bearer ${adminSession.body.token}` },
    });
    assert.equal(argumentExtractionCollection.status, 200);
    assert.equal(argumentExtractionCollection.body.resourceKey, "argumentExtraction");
    assert.equal(argumentExtractionCollection.body.count, 1);
    assert.equal(argumentExtractionCollection.body.items[0].id, argumentExtraction.id);

    const extractionReview = await requestJson(`${baseUrl}/api/v1/argument-extractions/${argumentExtraction.id}/review`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({
        argumentExtractionReview: {
          reviewStatus: "accepted_for_position_intake",
          reviewNotes: "Accepted in smoke test for future preparation; Phase 1 does not promote downstream artifacts.",
          reviewedBy: "demo-admin",
          reviewedAt: "2026-10-01T00:43:00.000Z",
        },
      }),
    });
    assert.equal(extractionReview.status, 201);
    assert.equal(extractionReview.body.safety.createdPreparedDrafts, false);
    assert.equal(extractionReview.body.safety.createdCandidateItems, false);
    assert.equal(extractionReview.body.safety.createdCandidateBatches, false);

    const extractionReviewSignal = await requestJson(`${baseUrl}/api/v1/admin/review-signals`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminSession.body.token}` },
      body: JSON.stringify({
        reviewSignal: {
          id: "review-signal-smoke-server",
          signalType: "context_sufficiency_reviewed",
          source: "admin",
          confidence: 0.9,
          explanation: "Smoke reviewer recorded source-intake evidence without creating a gate decision or downstream artifact.",
          affectedObjectType: "ArgumentExtraction",
          affectedObjectId: argumentExtraction.id,
          relatedGateIds: ["context_sufficiency_gate"],
        },
      }),
    });
    assert.equal(extractionReviewSignal.status, 201);
    assert.equal(extractionReviewSignal.body.safety.createdGateDecision, false);
    assert.equal(extractionReviewSignal.body.safety.createdPreparedDraft, false);
    assert.equal(extractionReviewSignal.body.safety.createdCandidateItem, false);

    const externalAssistanceDeclaration = await requestJson(`${baseUrl}/api/v1/external-assistance-declarations`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${graduateSession.body.token}` },
      body: JSON.stringify({
        externalAssistanceDeclaration: validExternalAssistanceDeclaration(
          "external-assistance-declaration-rating-smoke-server",
          "rating-smoke-server",
        ),
      }),
    });
    assert.equal(externalAssistanceDeclaration.status, 201);

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
          probeFamilies: ["full_context", "critique_only", "metadata_style_only"],
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
    const releaseArtifactChecklistRow = report.body.octoberCompletionChecklist.rows.find(
      (row) => row.id === "release_artifact_submission_package",
    );
    assert.ok(releaseArtifactChecklistRow);
    assert.deepEqual(releaseArtifactChecklistRow.bulkImportRoutes, ["/api/v1/operator-evidence/import-jsonl"]);
    assert.deepEqual(releaseArtifactChecklistRow.dryRunImportRoutes, ["/api/v1/operator-evidence/import-jsonl?dryRun=true"]);
    assert.ok(
      releaseArtifactChecklistRow.templateReadbackRoutes.includes(
        "/api/v1/operator-evidence/import-jsonl-template?checklistRowId=release_artifact_submission_package&artifactKind=corpus_manifest",
      ),
    );
    const targetScaleChecklistRow = report.body.octoberCompletionChecklist.rows.find((row) => row.id === "target_scale_and_data_collection");
    assert.ok(targetScaleChecklistRow.packageImportRoutes.includes("/api/v1/target-gaps/import-jsonl-package"));
    assert.ok(targetScaleChecklistRow.setupBulkImportRoutes.includes("/api/v1/assignments/import-jsonl"));
    const validationChecklistRow = report.body.octoberCompletionChecklist.rows.find((row) => row.id === "validation_hidden_benchmark_and_claims");
    assert.deepEqual(validationChecklistRow.bulkImportRoutes, ["/api/v1/validation-tranche-evidence/import-jsonl"]);
    assert.equal(validationChecklistRow.bulkImportRoutes.includes("/api/v1/operator-evidence/import-jsonl"), false);
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
    assert.equal(report.body.labelAggregationReliabilityChecklist.releaseUseStatus, "label_aggregation_reliability_requirements_evidenced");
    assert.equal(report.body.labelAggregationReliabilityChecklist.counts.checklistRows, 9);
    assert.equal(report.body.labelAggregationReliabilityChecklist.counts.reviewRequiredRows, 0);
    assert.equal(report.body.labelAggregationReliabilityChecklist.counts.maxSingleRaterContributionShare, 1);
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
    assert.equal(report.body.candidateGenerationIntakeChecklist.releaseUseStatus, "candidate_generation_intake_requirements_evidenced");
    assert.equal(report.body.candidateGenerationIntakeChecklist.counts.checklistRows, 8);
    assert.equal(report.body.candidateGenerationIntakeChecklist.counts.reviewRequiredRows, 0);
    assert.equal(
      report.body.candidateGenerationIntakeChecklist.rows.find((row) => row.id === "model_judges_not_gold_role_separation").status,
      "complete",
    );
    assert.equal(report.body.targetGaps.rows.length, 7);
    assert.equal(report.body.targetGaps.counts.targetRows, 7);
    assert.equal(report.body.targetGaps.rows.find((row) => row.id === "positions").sourceEvidenceId, report.body.corpusManifest.id);
    assert.equal(report.body.targetGaps.rows.find((row) => row.id === "gold_library_items").sourceEvidenceId, report.body.certification.id);
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
    assert.equal(report.body.samePositionContext.releaseUseStatus, "same_position_context_parity_preserved");
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
    assert.equal(report.body.sourceIntakeEvidence.counts.sourceCards, 1);
    assert.equal(report.body.sourceIntakeEvidence.counts.sourceSpans, 1);
    assert.equal(report.body.sourceIntakeEvidence.counts.extractionBatches, 1);
    assert.equal(report.body.sourceIntakeEvidence.counts.argumentExtractions, 1);
    assert.equal(report.body.sourceIntakeEvidence.byArgumentRole.mixed_position_and_critique, 1);
    assert.equal(report.body.sourceIntakeEvidence.releaseUseStatus, "phase1_source_intake_ready_for_future_source_preparation");
    assert.equal(report.body.workflowSourceIntakeArtifacts.argumentExtractions[0].reviewStatus, "accepted_for_position_intake");
    assert.equal(report.body.workflowSourceIntakeArtifacts.argumentExtractions[0].possiblePreparedCritiqueText, argumentExtraction.possiblePreparedCritiqueText);
    assert.equal(report.body.sourcePreparationEvidence.releaseUseStatus, "source_preparation_not_started");
    assert.equal(report.body.sourcePreparationEvidence.counts.preparedDrafts, 0);
    assert.equal(report.body.sourcePreparationEvidence.counts.candidateItems, 0);
    assert.equal(report.body.sourcePreparationEvidence.counts.promotionRecords, 0);
    assert.equal(Object.hasOwn(report.body, "workflowSourcePreparationArtifacts"), false);

    const auditLog = await readFile(join(auditDir, "rating-events.jsonl"), "utf8");
    assert.equal(auditLog.trim().split("\n").length, 1);
    const sourceStyleLog = await readFile(join(auditDir, "source-style-audit-events.jsonl"), "utf8");
    assert.equal(sourceStyleLog.trim().split("\n").length, 1);
    const benchmarkLog = await readFile(join(auditDir, "benchmark-exposure-events.jsonl"), "utf8");
    assert.equal(benchmarkLog.trim().split("\n").length, 4);
    console.log(
      "Server smoke passed: health, operator unblocker readbacks/templates, source-workbench template readback, source-intake import/review boundaries, rating and source/style audit appends, certification workflow, benchmark access logging, hidden metadata rejection, admin audit readback, and dynamic report.",
    );
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
    scoreInputPolicyId: "score-input-policy-workflow-new",
    workflowProfileId: "rating-workflow-profile-workflow-new",
    scoreExplanationPolicyId: "score-explanation-policy-october-2026-demo",
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
    scoreConfidenceJudgment: "medium",
    generalRatingNote: "Optional smoke-test note.",
    scoreExplanation: "",
    scoreExplanationRequired: false,
    scoreExplanationTriggers: [],
    scoreExplanationRequiredReasons: [],
    scoreExplanationPromptShown: false,
    scoreExplanationPromptVisibility: "label_source_protected_status_blind",
    scoreExplanationCompletionStatus: "ordinary_note_optional",
    externalAssistanceDeclarationId: `external-assistance-declaration-${id}`,
    externalAssistanceDeclarationStatus: "no_external_assistance_or_protected_text_event_attested",
    overallVsCentralityStrengthDiagnostic: scoreExplanationOverallProductDiagnostic({
      centrality: 0.7,
      strength: 0.68,
      correctness: 0.9,
      clarity: 0.88,
      dead_weight: 0.05,
      single_issue: 0.92,
      overall: 0.62,
    }),
    scoreEntryExplicitnessStatus: "all_required_scores_explicit",
    scoreMissingFieldValidationStatus: "passed_no_missing_required_fields",
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

function validExternalAssistanceDeclaration(id, ratingId) {
  return {
    id,
    assignmentId: "assign-ai-base-rate",
    ratingId,
    raterId: "demo-rater",
    assistanceType: "none",
    protectedTextEventFlag: false,
    outsideSystemDescription: "",
    contaminationRouting: "none_recorded",
    accessibilityExceptionStatus: "not_applicable",
    timestamp: "2026-06-11T13:59:30.000Z",
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
