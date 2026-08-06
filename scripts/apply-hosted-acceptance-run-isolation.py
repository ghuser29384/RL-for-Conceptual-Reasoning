from pathlib import Path


def replace_once(path: str, before: str, after: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(before)
    if count != 1:
        raise SystemExit(f"{path}: expected one occurrence, found {count}: {before[:160]!r}")
    file.write_text(text.replace(before, after, 1))


path = "scripts/run-hosted-staging-acceptance.mjs"
replace_once(
    path,
    '  operatorEmail: "operator@hosted-acceptance.metaphilosophy.invalid",',
    '  operatorEmail: syntheticEmail("operator"),',
)
for label, old in [
    ("rater-a", '  email: "rater-a@hosted-acceptance.metaphilosophy.invalid",'),
    ("rater-b", '  email: "rater-b@hosted-acceptance.metaphilosophy.invalid",'),
    ("adjudicator", '  email: "adjudicator@hosted-acceptance.metaphilosophy.invalid",'),
    ("recovery", '  email: "recovery@hosted-acceptance.metaphilosophy.invalid",'),
    ("expiry", '  email: "expiry@hosted-acceptance.metaphilosophy.invalid",'),
]:
    replace_once(path, old, f'  email: syntheticEmail("{label}"),')

replace_once(
    path,
    '''assert.equal(workspaceA.assignments.length, 1);
assert.equal(workspaceB.assignments.length, 1);
assert.equal(workspaceA.assignments[0].critiques.length, 4);
assert.equal(workspaceA.assignments[0].position.status, "synthetic_rehearsal_only");
assert.equal(Object.keys(workspaceA.rubric.dimensions).length, 7);
assert.equal(JSON.stringify(workspaceA).includes(raterBIdentity.identity.id), false);
assert.equal(JSON.stringify(workspaceB).includes(raterAIdentity.identity.id), false);
timeline.push("two_rater_blinding_four_siblings_and_complete_lmca_rubric_passed");

const critiqueIds = workspaceA.assignments[0].critiques.map((critique) => critique.id);
''',
    '''const assignmentViewA = workspaceA.assignments.find((assignment) => assignment.id === assignmentA.assignment.id);
const assignmentViewB = workspaceB.assignments.find((assignment) => assignment.id === assignmentB.assignment.id);
assert.ok(assignmentViewA);
assert.ok(assignmentViewB);
assert.equal(assignmentViewA.critiques.length, 4);
assert.equal(assignmentViewB.critiques.length, 4);
assert.equal(assignmentViewA.position.id, bootstrap.positionId);
assert.equal(assignmentViewA.position.status, "synthetic_rehearsal_only");
assert.equal(Object.keys(workspaceA.rubric.dimensions).length, 7);
assert.equal(JSON.stringify(assignmentViewA).includes(raterBIdentity.identity.id), false);
assert.equal(JSON.stringify(assignmentViewB).includes(raterAIdentity.identity.id), false);
timeline.push("two_rater_blinding_four_siblings_and_complete_lmca_rubric_passed");

const critiqueIds = assignmentViewA.critiques.map((critique) => critique.id);
const currentCritiqueIds = new Set(critiqueIds);
''',
)
replace_once(
    path,
    '''const resumedWorkspaceA = await restartedService.getWorkspace(raterA.sessionToken);
assert.equal(resumedWorkspaceA.assignments[0].critiques.every((critique) => critique.draft?.version === 1), true);
''',
    '''const resumedWorkspaceA = await restartedService.getWorkspace(raterA.sessionToken);
const resumedAssignmentA = resumedWorkspaceA.assignments.find((assignment) => assignment.id === assignmentA.assignment.id);
assert.ok(resumedAssignmentA);
assert.equal(resumedAssignmentA.critiques.every((critique) => critique.draft?.version === 1), true);
''',
)
replace_once(
    path,
    '''let afterInitials = await restartedService.state();
assert.equal(afterInitials.ratings.filter((rating) => rating.eventType === "initial").length, 8);
assert.equal(afterInitials.adjudicationCases.filter((item) => item.status === "open").length, 1);
''',
    '''let afterInitials = await restartedService.state();
const currentInitialRatings = afterInitials.ratings.filter((rating) =>
  rating.eventType === "initial" && currentCritiqueIds.has(rating.critiqueId)
);
const currentOpenCases = afterInitials.adjudicationCases.filter((item) =>
  item.positionId === bootstrap.positionId && item.status === "open"
);
assert.equal(currentInitialRatings.length, 8);
assert.equal(currentOpenCases.length, 1);
''',
)
replace_once(
    path,
    'const reratingAssignment = reratingWorkspace.assignments.find((assignment) => assignment.kind === "rerating");',
    'const reratingAssignment = reratingWorkspace.assignments.find((assignment) => assignment.kind === "rerating" && assignment.predecessorAssignmentId === assignmentA.assignment.id);',
)
replace_once(
    path,
    '''const adjudicatorWorkspace = await restartedService.getWorkspace(adjudicator.sessionToken);
assert.equal(adjudicatorWorkspace.cases.length, 1);
const caseId = adjudicatorWorkspace.cases[0].id;
''',
    '''const adjudicatorWorkspace = await restartedService.getWorkspace(adjudicator.sessionToken);
const currentAdjudicationCases = adjudicatorWorkspace.cases.filter((item) =>
  item.positionId === bootstrap.positionId && item.status === "open"
);
assert.equal(currentAdjudicationCases.length, 1);
const caseId = currentAdjudicationCases[0].id;
''',
)
replace_once(
    path,
    '''const afterWithdrawal = await restartedService.state();
assert.equal(afterWithdrawal.ratings.length, 12);
assert.equal(afterWithdrawal.labelSnapshots.length, 1);
assert.equal(afterWithdrawal.assignments.find((assignment) => assignment.id === assignmentB.assignment.id).status, "withdrawn");
''',
    '''const afterWithdrawal = await restartedService.state();
const currentRatingsAfterWithdrawal = afterWithdrawal.ratings.filter((rating) => currentCritiqueIds.has(rating.critiqueId));
const currentSnapshotsAfterWithdrawal = afterWithdrawal.labelSnapshots.filter((snapshot) => snapshot.positionId === bootstrap.positionId);
assert.equal(currentRatingsAfterWithdrawal.length, 12);
assert.equal(currentSnapshotsAfterWithdrawal.length, 1);
assert.equal(afterWithdrawal.assignments.find((assignment) => assignment.id === assignmentB.assignment.id).status, "withdrawn");
''',
)
replace_once(
    path,
    '''assert.equal(JSON.stringify(publicExport).includes("@hosted-acceptance.metaphilosophy.invalid"), false);
assert.equal(publicExport.counts.ratings, 12);
assert.ok(privateExport.events.length > 30);
''',
    '''assert.equal(JSON.stringify(publicExport).includes("@hosted-acceptance.metaphilosophy.invalid"), false);
assert.equal(publicExport.ratings.filter((rating) => currentCritiqueIds.has(rating.critiqueId)).length, 12);
assert.ok(privateExport.events.length > startingPrimary.eventCount);
''',
)
replace_once(
    path,
    '''const finalState = await secondRestartService.state();
const finalWorkspaceA = await secondRestartService.getWorkspace(raterA.sessionToken);
assert.equal(finalState.ratings.filter((rating) => rating.eventType === "initial").length, 8);
assert.equal(finalState.ratings.filter((rating) => rating.eventType === "rerating").length, 4);
assert.equal(finalState.labelSnapshots.length, 1);
assert.equal(finalWorkspaceA.assignments.some((assignment) => assignment.kind === "rerating" && assignment.status === "submitted"), true);
timeline.push("second_runtime_restart_preserved_sessions_ratings_receipts_and_snapshot");

const report = {
  schemaVersion: "metaphilosophy-protected-hosted-synthetic-acceptance-v1",
''',
    '''const finalState = await secondRestartService.state();
const finalWorkspaceA = await secondRestartService.getWorkspace(raterA.sessionToken);
const finalInitialRatings = finalState.ratings.filter((rating) =>
  rating.eventType === "initial" && currentCritiqueIds.has(rating.critiqueId)
);
const finalReratings = finalState.ratings.filter((rating) =>
  rating.eventType === "rerating" && currentCritiqueIds.has(rating.critiqueId)
);
const finalRunSnapshots = finalState.labelSnapshots.filter((snapshot) => snapshot.positionId === bootstrap.positionId);
const finalReratingAssignment = finalWorkspaceA.assignments.find((assignment) => assignment.id === reratingAssignment.id);
assert.equal(finalInitialRatings.length, 8);
assert.equal(finalReratings.length, 4);
assert.equal(finalRunSnapshots.length, 1);
assert.equal(finalReratingAssignment?.status, "submitted");
timeline.push("second_runtime_restart_preserved_sessions_ratings_receipts_and_snapshot");

const runIdentityIds = new Set([
  operator.identity.id,
  raterAIdentity.identity.id,
  raterBIdentity.identity.id,
  adjudicatorIdentity.identity.id,
  recoveryIdentity.identity.id,
  expiringIdentity.identity.id,
]);
const runAssignments = finalState.assignments.filter((assignment) => assignment.positionId === bootstrap.positionId);
const report = {
  schemaVersion: "metaphilosophy-protected-hosted-synthetic-acceptance-v2",
''',
)
replace_once(
    path,
    '''  counts: {
    identities: finalState.identities.length,
    assignments: finalState.assignments.length,
    initialRatings: finalState.ratings.filter((rating) => rating.eventType === "initial").length,
    reratings: finalState.ratings.filter((rating) => rating.eventType === "rerating").length,
    labelSnapshots: finalState.labelSnapshots.length,
    primaryEvents: finalEvents.length,
    restoredEvents: restoreEvidence.databaseReadback.eventCount,
  },
''',
    '''  counts: {
    runIdentities: finalState.identities.filter((identity) => runIdentityIds.has(identity.id)).length,
    totalIdentities: finalState.identities.length,
    runAssignments: runAssignments.length,
    totalAssignments: finalState.assignments.length,
    runInitialRatings: finalInitialRatings.length,
    runReratings: finalReratings.length,
    runLabelSnapshots: finalRunSnapshots.length,
    totalPrimaryEvents: finalEvents.length,
    preservedPriorEvents: startingPrimary.eventCount,
    appendedRunEvents: finalEvents.length - startingPrimary.eventCount,
    restoredEvents: restoreEvidence.databaseReadback.eventCount,
  },
''',
)
replace_once(
    path,
    '''function hostedRehearsalFixture(runId) {
''',
    '''function syntheticEmail(label) {
  return `${label}-${acceptanceRunId}@hosted-acceptance.metaphilosophy.invalid`;
}

function hostedRehearsalFixture(runId) {
''',
)

contract_path = "test/hosted-staging-gateway-contract.test.mjs"
replace_once(
    contract_path,
    '''  assert.match(acceptance, /second_runtime_restart_preserved_sessions_ratings_receipts_and_snapshot/u);
  assert.match(acceptance, /realPersonContacted: false/u);
''',
    '''  assert.match(acceptance, /second_runtime_restart_preserved_sessions_ratings_receipts_and_snapshot/u);
  assert.match(acceptance, /syntheticEmail/u);
  assert.match(acceptance, /assignment\.id === assignmentA\.assignment\.id/u);
  assert.match(acceptance, /currentCritiqueIds\.has/u);
  assert.match(acceptance, /prior_failed_attempt_chain_preserved_append_only/u);
  assert.match(acceptance, /preservedPriorEvents/u);
  assert.match(acceptance, /realPersonContacted: false/u);
''',
)
