import { expect, test } from "@playwright/test";

const bootstrapToken = "synthetic-rehearsal-bootstrap-token-32-bytes-minimum";
const positionId = "synthetic-rehearsal-position-001";

let operatorRequest;
let setup;

test.beforeAll(async ({ playwright }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL;
  if (typeof baseURL !== "string" || !baseURL) {
    throw new Error("The staging Chromium rehearsal requires a configured baseURL.");
  }
  operatorRequest = await playwright.request.newContext({ baseURL });

  const bootstrap = await api(operatorRequest, "bootstrap", {
    method: "POST",
    headers: { "x-staging-bootstrap-token": bootstrapToken },
    data: { operatorEmail: "operator@staging.metaphilosophy.invalid" },
  });
  const operator = await api(operatorRequest, "invite.redeem", { method: "POST", data: { token: bootstrap.inviteToken } });
  const csrf = operator.csrfToken;
  const headers = { "x-staging-csrf": csrf, "sec-fetch-site": "same-origin" };

  const raterA = await api(operatorRequest, "identity.create", { method: "POST", headers, data: { role: "rater", displayName: "Synthetic browser rater A", email: "browser-a@staging.metaphilosophy.invalid" } });
  const raterB = await api(operatorRequest, "identity.create", { method: "POST", headers, data: { role: "rater", displayName: "Synthetic browser rater B", email: "browser-b@staging.metaphilosophy.invalid" } });
  const adjudicator = await api(operatorRequest, "identity.create", { method: "POST", headers, data: { role: "adjudicator", displayName: "Synthetic browser adjudicator", email: "browser-adjudicator@staging.metaphilosophy.invalid" } });

  const inviteA = await api(operatorRequest, "invite.create", { method: "POST", headers, data: { identityId: raterA.identity.id, expiresInHours: 24 } });
  const inviteB = await api(operatorRequest, "invite.create", { method: "POST", headers, data: { identityId: raterB.identity.id, expiresInHours: 24 } });
  const inviteAdjudicator = await api(operatorRequest, "invite.create", { method: "POST", headers, data: { identityId: adjudicator.identity.id, expiresInHours: 24 } });
  const assignmentA = await api(operatorRequest, "assignment.create", { method: "POST", headers, data: { identityId: raterA.identity.id, positionId: bootstrap.positionId, kind: "initial" } });
  const assignmentB = await api(operatorRequest, "assignment.create", { method: "POST", headers, data: { identityId: raterB.identity.id, positionId: bootstrap.positionId, kind: "initial" } });

  setup = {
    operator: { csrf, headers },
    raterA: { ...raterA.identity, inviteToken: inviteA.token, assignmentId: assignmentA.assignment.id },
    raterB: { ...raterB.identity, inviteToken: inviteB.token, assignmentId: assignmentB.assignment.id },
    adjudicator: { ...adjudicator.identity, inviteToken: inviteAdjudicator.token },
  };
});

test.afterAll(async () => {
  await operatorRequest?.dispose();
});

test("complete synthetic human workflow preserves initial ratings across correction, withdrawal, rerating, and three adjudication closures", async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await redeemInBrowser(pageA, setup.raterA.inviteToken);
  await expect(pageA.getByRole("heading", { name: "Rate contextualized critiques" })).toBeVisible();
  await completeSyntheticConsent(pageA);
  await expect(pageA.locator(".critique-card")).toHaveCount(4);
  await expect(pageA.getByText("Synthetic browser rater B")).toHaveCount(0);
  await expect(pageA.getByText("Source", { exact: true })).toHaveCount(0);
  const dimensionLegends = pageA.getByText("Seven LMCA dimensions", { exact: true });
  await expect(dimensionLegends).toHaveCount(4);
  await expect(dimensionLegends.first()).toBeVisible();

  const firstCardA = pageA.locator(".critique-card").first();
  await completeRating(firstCardA, { overall: 0.9, strength: 0.9, requestReview: true });
  await expect(firstCardA.locator(".form-status")).toContainText("Saved · complete");

  await pageA.close();
  const resumedPageA = await contextA.newPage();
  await resumedPageA.goto("/staging/");
  await expect(resumedPageA.getByRole("heading", { name: "Rate contextualized critiques" })).toBeVisible();
  await expect(resumedPageA.locator('.critique-card').first().locator('input[name="score_overall"]')).toHaveValue("0.9");
  for (let index = 1; index < 4; index += 1) {
    await completeRating(resumedPageA.locator(".critique-card").nth(index), { overall: 0.65 - index * 0.12, strength: 0.75 });
  }
  await resumedPageA.getByRole("button", { name: "Submit all four ratings" }).click();
  await expect(resumedPageA.getByText("Submitted and locked.")).toBeVisible();
  await expect(resumedPageA.locator(".rating-form").first().locator("input").first()).toBeDisabled();

  const contextB = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageB = await contextB.newPage();
  await redeemInBrowser(pageB, setup.raterB.inviteToken);
  await completeSyntheticConsent(pageB);
  await expect(pageB.getByText("Synthetic browser rater A")).toHaveCount(0);
  const overflow = await pageB.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  for (let index = 0; index < 4; index += 1) {
    await completeRating(pageB.locator(".critique-card").nth(index), {
      overall: index === 0 ? 0.1 : 0.65 - index * 0.12,
      strength: index === 0 ? 0.2 : 0.75,
      interpretationConfidence: index === 0 ? "low" : "high",
      ambiguityFlag: index === 0,
    });
  }

  const forbidden = await pageB.evaluate(async ({ assignmentId, critiqueId }) => {
    const rating = {
      scores: { centrality: 0.9, strength: 0.5, correctness: 0.9, clarity: 0.9, dead_weight: 0.1, single_issue: 0.9, overall: 0.5 },
      rationale: "This attempted write deliberately targets another rater's assignment and must be denied before any event is appended.",
      confidence: "high",
      timeSpentSeconds: 120,
      interpretationConfidence: "high",
      backgroundAssumptions: "Synthetic access-control test.",
      assessability: "assessable",
      issueFlags: [],
      verificationStatus: "not_needed",
      requestReview: false,
    };
    const response = await fetch("/api/staging?action=draft.save", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Staging-CSRF": sessionStorage.getItem("metaphilosophy-staging-csrf"), "Sec-Fetch-Site": "same-origin" },
      body: JSON.stringify({ assignmentId, critiqueId, expectedVersion: 0, rating }),
    });
    return { status: response.status, body: await response.json() };
  }, {
    assignmentId: setup.raterA.assignmentId,
    critiqueId: await pageB.locator(".critique-card").first().getAttribute("data-critique-id"),
  });
  expect(forbidden.status).toBe(403);
  expect(forbidden.body.error.code).toBe("assignment_forbidden");

  await pageB.getByRole("button", { name: "Submit all four ratings" }).click();
  await expect(pageB.getByText("Submitted and locked.")).toBeVisible();

  let operatorWorkspace = await api(operatorRequest, "workspace");
  expect(operatorWorkspace.counts.ratings).toBe(8);
  expect(operatorWorkspace.counts.openAdjudicationCases).toBe(1);

  await requestPostSubmissionAction(resumedPageA, "Request correction", "Synthetic object-level correction request: the first rating used an interpretation that should be reconsidered without overwriting the immutable initial record.");
  await expect(resumedPageA.locator(".correction-request-status")).toContainText("Correction request: open");
  await expect(resumedPageA.locator(".correction-request-status")).toContainText("Original ratings remain immutable");

  await requestPostSubmissionAction(pageB, "Request withdrawal", "Synthetic withdrawal request after submission, used only to verify retained records and a locked assignment state.");
  await expect(pageB.locator(".withdrawal-request-status")).toContainText("Withdrawal recorded; assignment locked");
  await expect(pageB.locator(".withdrawal-request-status")).toContainText("remain in the private audit trail");

  await completeSyntheticDebrief(resumedPageA, { recoveryPath: "correction", deviceClass: "desktop" });
  await completeSyntheticDebrief(pageB, { recoveryPath: "withdrawal", deviceClass: "narrow_mobile" });

  const operatorContext = await browser.newContext({ storageState: await operatorRequest.storageState() });
  const operatorPage = await operatorContext.newPage();
  await operatorPage.goto("/staging/");
  await expect(operatorPage.getByRole("heading", { name: "Staging operator workspace" })).toBeVisible();
  await expect(operatorPage.locator('[data-queue="participant-evidence"]')).toContainText("Synthetic browser rater A");
  await expect(operatorPage.locator('[data-queue="participant-evidence"]')).toContainText("Synthetic browser rater B");
  await expect(operatorPage.locator('[data-queue="participant-evidence"]')).toContainText("Consent recorded");
  await expect(operatorPage.locator('[data-queue="participant-evidence"]')).toContainText("Debrief recorded");
  await expect(operatorPage.locator('[data-queue="corrections"]')).toContainText("Synthetic browser rater A");
  await expect(operatorPage.locator('[data-queue="withdrawals"]')).toContainText("Synthetic browser rater B");
  await expect(operatorPage.locator('[data-queue="withdrawals"]')).toContainText("Accepted records remain retained");

  const adjudicatorContext = await browser.newContext();
  const adjudicatorPage = await adjudicatorContext.newPage();
  await redeemInBrowser(adjudicatorPage, setup.adjudicator.inviteToken);
  await submitLatestAdjudicationReview(adjudicatorPage, "unresolved", "The two literal readings remain sufficiently plausible that the synthetic disagreement should be represented explicitly instead of forced into consensus.");
  await closeLatestCase(operatorPage, "Close unresolved", "Synthetic unresolved closure preserves both immutable initial judgments and the competing interpretation.");

  await openOperatorCase(operatorPage, "Second synthetic case verifies closure without any predecessor-linked re-rating.");
  await adjudicatorPage.reload();
  await submitLatestAdjudicationReview(adjudicatorPage, "confirm_initials", "Independent review finds the initial disagreement adequately represented; this case should close resolved without requesting or accepting a re-rating.");
  await closeLatestCase(operatorPage, "Close resolved", "Resolved without re-rating after independent review; retain all eight immutable initial ratings.");

  const openCorrection = operatorPage.locator('[data-queue="corrections"] .queue-item').filter({ hasText: "Synthetic browser rater A" });
  await openCorrection.locator('textarea[name="correctionNotes"]').fill("Approved because the rater identified a concrete object-level interpretation issue; create a predecessor-linked re-rating and preserve the original.");
  await openCorrection.getByRole("button", { name: "Approve predecessor-linked re-rating" }).click();
  await expect(operatorPage.locator('[data-queue="corrections"]')).toContainText("Operator response: approve_rerating");

  await resumedPageA.reload();
  await expect(resumedPageA.locator(".correction-request-status")).toContainText("Correction request: approved");
  await expect(resumedPageA.locator(".correction-request-status")).toContainText("Operator response: approve_rerating");
  const reratingPanel = resumedPageA.locator(".assignment-panel").filter({ hasText: "Object-level re-rating" });
  await expect(reratingPanel).toHaveCount(1);
  for (let index = 0; index < 4; index += 1) {
    await completeRating(reratingPanel.locator(".critique-card").nth(index), {
      overall: index === 0 ? 0.72 : 0.58 - index * 0.08,
      strength: index === 0 ? 0.8 : 0.68,
      interpretationConfidence: "high",
    });
  }
  await reratingPanel.getByRole("button", { name: "Submit all four ratings" }).click();
  await expect(reratingPanel.getByText("Submitted and locked.")).toBeVisible();

  operatorWorkspace = await api(operatorRequest, "workspace");
  expect(operatorWorkspace.counts.ratings).toBe(12);
  expect(operatorWorkspace.counts.openAdjudicationCases).toBe(1);

  await adjudicatorPage.reload();
  await submitLatestAdjudicationReview(adjudicatorPage, "confirm_initials", "The predecessor-linked re-rating is object-level, properly linked, and preserves the initial distribution; the case can close resolved with both versions retained.");
  await operatorPage.reload();
  await closeLatestCase(operatorPage, "Close resolved", "Resolved after a valid predecessor-linked re-rating; preserve the eight initial and four re-rating records in the signed snapshot.");

  const privateExport = await api(operatorRequest, "export.private");
  expect(privateExport.state.ratings).toHaveLength(12);
  expect(privateExport.state.ratings.filter((rating) => rating.eventType === "initial")).toHaveLength(8);
  expect(privateExport.state.ratings.filter((rating) => rating.eventType === "rerating")).toHaveLength(4);
  expect(privateExport.state.assignments.filter((assignment) => assignment.kind === "rerating")).toHaveLength(1);
  expect(privateExport.state.assignments.find((assignment) => assignment.kind === "rerating").predecessorAssignmentId).toBe(setup.raterA.assignmentId);
  expect(privateExport.state.assignments.find((assignment) => assignment.id === setup.raterB.assignmentId).status).toBe("withdrawn");
  expect(privateExport.state.participantEvidence).toHaveLength(4);
  expect(privateExport.state.participantEvidence.filter((record) => record.kind === "consent")).toHaveLength(2);
  expect(privateExport.state.participantEvidence.filter((record) => record.kind === "debrief")).toHaveLength(2);

  const snapshots = privateExport.state.labelSnapshots;
  expect(snapshots).toHaveLength(3);
  expect(snapshots.filter((snapshot) => snapshot.status === "unresolved")).toHaveLength(1);
  expect(snapshots.filter((snapshot) => snapshot.status === "resolved" && snapshot.reratingIds.length === 0)).toHaveLength(1);
  expect(snapshots.filter((snapshot) => snapshot.status === "resolved" && snapshot.reratingIds.length === 4)).toHaveLength(1);
  for (const snapshot of snapshots) expect(snapshot.initialRatingIds).toHaveLength(8);

  const publicExport = await api(operatorRequest, "export.public");
  expect(JSON.stringify(publicExport)).not.toContain("@staging.metaphilosophy.invalid");
  expect(JSON.stringify(publicExport)).not.toContain("Centrality measures how much the attacked claim matters");
  expect(publicExport.counts.ratings).toBe(12);
  expect(publicExport.snapshots).toHaveLength(3);

  await contextA.close();
  await contextB.close();
  await adjudicatorContext.close();
  await operatorContext.close();
});


async function completeSyntheticConsent(page) {
  const form = page.locator(".participant-consent-form").first();
  await expect(form).toBeVisible();
  for (const name of [
    "scopeAndDataTermsRead",
    "syntheticScoresExcluded",
    "auditTrailAndNotesConsented",
    "voluntaryAndMayStop",
  ]) {
    await form.locator(`input[name="${name}"]`).check();
  }
  await form.getByRole("button", { name: "Record consent and open synthetic assignment" }).click();
  await expect(page.getByText("Consent recorded", { exact: true })).toBeVisible();
}

async function completeSyntheticDebrief(page, { recoveryPath, deviceClass }) {
  const form = page.locator(".participant-debrief-form").first();
  await expect(form).toBeVisible();
  await form.locator('textarea[name="centralityDefinition"]').fill("Centrality measures how much the attacked claim matters to the position as it is actually stated.");
  await form.locator('textarea[name="strengthDefinition"]').fill("Strength measures how successfully the critique undermines the particular claims that it attacks.");
  await form.locator('textarea[name="productImportance"]').fill("The product tracks substantive impact even when score mass can reasonably move between strength and centrality.");
  await form.locator('textarea[name="lowClarityTreatment"]').fill("When clarity is below 0.5, the component ratings become less dependable and clarity plus overall deserve special weight.");
  await form.locator('textarea[name="immutableInitialsReason"]').fill("Initial ratings remain immutable so later reconsideration cannot erase the original independent distribution.");
  for (const [name, value] of [
    ["workflowClarity", "5"],
    ["autosaveConfidence", "5"],
    ["resumeConfidence", "5"],
    ["lockedStateClarity", "5"],
    ["recoveryPathClarity", "4"],
    ["researchBoundaryClarity", "5"],
  ]) {
    await form.locator(`select[name="${name}"]`).selectOption(value);
  }
  await form.locator('select[name="deviceClass"]').selectOption(deviceClass);
  await form.locator('select[name="browserFamily"]').selectOption("chrome");
  await form.locator('select[name="recoveryPath"]').selectOption(recoveryPath);
  await form.locator('input[name="sessionDurationMinutes"]').fill("72");
  await form.locator('select[name="sawUnexpectedMetadata"]').selectOption("no");
  await form.locator('select[name="sawNonSyntheticMaterial"]').selectOption("no");
  await form.locator('textarea[name="mostConfusing"]').fill("The distinction between correctness and strength required the most careful attention.");
  await form.locator('textarea[name="improvementSuggestion"]').fill("Keep a compact rubric summary visible while the participant writes the object-level rationale.");
  await form.getByRole("button", { name: "Submit synthetic-session debrief" }).click();
  await expect(page.getByText("Debrief recorded", { exact: true })).toBeVisible();
}

async function redeemInBrowser(page, token) {
  await page.goto(`/staging/?invite=${encodeURIComponent(token)}`);
  await expect(page.locator("#invite-token")).toHaveValue(token);
  await page.getByRole("button", { name: "Redeem invitation" }).click();
}

async function requestPostSubmissionAction(page, buttonName, reason) {
  await page.getByRole("button", { name: buttonName }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  await dialog.locator('textarea[name="reason"]').fill(reason);
  await dialog.getByRole("button", { name: "Submit request" }).click();
}

async function openOperatorCase(operatorPage, reason) {
  const form = operatorPage.locator(".operator-open-case-form");
  await form.locator('select[name="positionId"]').selectOption(positionId);
  await form.locator('textarea[name="reason"]').fill(reason);
  await form.getByRole("button", { name: "Open adjudication case" }).click();
  await expect(operatorPage.locator('.adjudication-operator-card textarea[name="closureNotes"]')).toHaveCount(1);
}

async function submitLatestAdjudicationReview(page, disposition, explanation) {
  await expect(page.getByRole("heading", { name: "Review triggered disagreement" })).toBeVisible();
  const form = page.locator(".adjudication-form").last();
  await expect(form).toBeVisible();
  await form.locator('select[name="disposition"]').selectOption(disposition);
  await form.locator('textarea[name="explanation"]').fill(explanation);
  await form.getByRole("button", { name: "Submit independent review" }).click();
  await expect(page.getByText(`Your independent review is locked: ${disposition}`)).toBeVisible();
}

async function closeLatestCase(operatorPage, buttonName, notes) {
  await operatorPage.reload();
  const openCard = operatorPage.locator('.adjudication-operator-card:has(textarea[name="closureNotes"])').last();
  await expect(openCard).toBeVisible();
  await openCard.locator('textarea[name="closureNotes"]').fill(notes);
  await openCard.getByRole("button", { name: buttonName }).click();
  await expect(operatorPage.locator('.adjudication-operator-card:has(textarea[name="closureNotes"])')).toHaveCount(0);
}

async function completeRating(card, {
  overall,
  strength,
  interpretationConfidence = "high",
  requestReview = false,
  ambiguityFlag = false,
}) {
  const scores = {
    centrality: 0.9,
    strength,
    correctness: 0.9,
    clarity: 0.95,
    dead_weight: 0.05,
    single_issue: 0.95,
    overall,
  };
  for (const [dimension, value] of Object.entries(scores)) {
    await card.locator(`input[name="score_${dimension}"]`).fill(String(Number(value.toFixed(2))));
  }
  await card.locator('select[name="assessability"]').selectOption("assessable");
  await card.locator('select[name="interpretationConfidence"]').selectOption(interpretationConfidence);
  await card.locator('select[name="confidence"]').selectOption("high");
  await card.locator('select[name="verificationStatus"]').selectOption("not_needed");
  await card.locator('input[name="timeSpentSeconds"]').fill("420");
  await card.locator('textarea[name="rationale"]').fill("This synthetic browser rationale identifies the attacked claim, assesses its centrality and the objection's object-level force, and does not infer quality from provenance or prose style.");
  await card.locator('textarea[name="backgroundAssumptions"]').fill("Read the stated position literally and do not import an unstated reply or a broader conclusion.");
  if (ambiguityFlag) await card.locator('input[name="issueFlags"][value="position_ambiguity"]').check();
  if (requestReview) await card.locator('input[name="requestReview"]').check();
  await expect(card.locator(".form-status")).toContainText("Saved", { timeout: 12_000 });
}

async function api(request, action, { method = "GET", headers = {}, data } = {}) {
  const response = await request.fetch(`/api/staging?action=${encodeURIComponent(action)}`, {
    method,
    headers: { Accept: "application/json", ...headers },
    data,
    failOnStatusCode: false,
  });
  const payload = await response.json();
  if (!response.ok() || !payload.ok) {
    throw new Error(`${action} failed (${response.status()}): ${payload.error?.code} ${payload.error?.message}`);
  }
  return payload.data;
}
