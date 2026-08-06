import { expect, test } from "@playwright/test";

const bootstrapToken = "synthetic-rehearsal-bootstrap-token-32-bytes-minimum";

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

test("two isolated browser raters autosave, resume, submit, and hand off an unresolved case", async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await redeemInBrowser(pageA, setup.raterA.inviteToken);
  await expect(pageA.getByRole("heading", { name: "Rate contextualized critiques" })).toBeVisible();
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

  const operatorWorkspace = await api(operatorRequest, "workspace");
  expect(operatorWorkspace.counts.ratings).toBe(8);
  expect(operatorWorkspace.counts.openAdjudicationCases).toBe(1);

  const contextAdjudicator = await browser.newContext();
  const adjudicatorPage = await contextAdjudicator.newPage();
  await redeemInBrowser(adjudicatorPage, setup.adjudicator.inviteToken);
  await expect(adjudicatorPage.getByRole("heading", { name: "Review triggered disagreement" })).toBeVisible();
  await expect(adjudicatorPage.locator(".adjudication-card")).toHaveCount(1);
  await adjudicatorPage.locator('select[name="disposition"]').selectOption("unresolved");
  await adjudicatorPage.locator('textarea[name="explanation"]').fill("The two literal readings remain sufficiently plausible that the synthetic disagreement should be represented explicitly instead of forced into consensus.");
  await adjudicatorPage.getByRole("button", { name: "Submit independent review" }).click();
  await expect(adjudicatorPage.getByText("Your independent review is locked: unresolved")).toBeVisible();

  const refreshedOperator = await api(operatorRequest, "workspace");
  const caseId = refreshedOperator.adjudicationCases.find((item) => item.status === "open").id;
  const closed = await api(operatorRequest, "adjudication.close", {
    method: "POST",
    headers: setup.operator.headers,
    data: { caseId, status: "unresolved", notes: "Synthetic browser rehearsal closure: preserve both immutable initial judgments and the unresolved interpretation." },
  });
  expect(closed.snapshot.status).toBe("unresolved");
  expect(closed.snapshot.initialRatingIds).toHaveLength(8);

  const publicExport = await api(operatorRequest, "export.public");
  expect(JSON.stringify(publicExport)).not.toContain("@staging.metaphilosophy.invalid");
  expect(publicExport.counts.ratings).toBe(8);

  await contextA.close();
  await contextB.close();
  await contextAdjudicator.close();
});

async function redeemInBrowser(page, token) {
  await page.goto(`/staging/?invite=${encodeURIComponent(token)}`);
  await expect(page.locator("#invite-token")).toHaveValue(token);
  await page.getByRole("button", { name: "Redeem invitation" }).click();
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
