import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const scoreNames = [
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "overall",
];

test("participant-facing staging layer explains the task, shows recoverable progress, and confirms irreversible submission", async ({ page }) => {
  await mkdir(".staging-evidence/browser", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/staging/");

  const assignmentMarkup = makeSyntheticAssignmentMarkup();
  await page.evaluate(({ markup }) => {
    sessionStorage.setItem("metaphilosophy-staging-force-submit-confirmation", "true");
    document.querySelector("#loading-panel").hidden = true;
    document.querySelector("#login-panel").hidden = true;
    document.querySelector("#workspace-panel").hidden = false;
    document.querySelector("#role-kicker").textContent = "Independent initial rating";
    document.querySelector("#workspace-title").textContent = "Rate contextualized critiques";
    document.querySelector("#workspace-subtitle").textContent = "Synthetic participant-readiness fixture.";
    document.querySelector("#identity-label").textContent = "Synthetic readiness rater · rater";
    document.querySelector("#workspace-content").innerHTML = markup;
    document.querySelector(".assignment-actions .primary-button").addEventListener("click", () => {
      document.body.dataset.originalSubmitHandler = "called";
    });
  }, { markup: assignmentMarkup });

  await expect(page.getByRole("heading", { name: "What this synthetic rehearsal will ask you to do" })).toBeVisible();
  await expect(page.getByText("60–90 minutes")).toBeVisible();
  await expect(page.getByText("4 of 4 ratings ready")).toBeVisible();
  await expect(page.getByText("All changes saved")).toBeVisible();
  await expect(page.locator(".progress-chip.is-complete")).toHaveCount(4);
  await expect(page.locator("details.assignment-integrity")).not.toHaveAttribute("open", "");
  await expect(page.locator(".critique-title").first()).toHaveText("Independent evaluation");
  await expect(page.locator('input[name="score_centrality"]').first()).toHaveAttribute("placeholder", "0.00–1.00");
  await expect(page.locator(".field-help").first()).toContainText("at least 40 characters");

  await page.locator(".skip-link").focus();
  await expect(page.locator(".skip-link")).toBeFocused();
  const skipBox = await page.locator(".skip-link").boundingBox();
  expect(skipBox?.y ?? -1).toBeGreaterThanOrEqual(0);

  await page.screenshot({
    path: ".staging-evidence/browser/participant-readiness-desktop.png",
    fullPage: true,
    animations: "disabled",
  });

  const submit = page.locator("button[data-readiness-submit='true']");
  await expect(submit).toHaveText("Review and submit four ratings");
  await submit.click();
  const desktopDialog = page.getByRole("dialog");
  await expect(desktopDialog.getByRole("heading", { name: "Submit and lock four ratings?" })).toBeVisible();
  await expect(desktopDialog).toContainText("immutable initial-rating records");
  await page.screenshot({
    path: ".staging-evidence/browser/participant-readiness-desktop-confirmation.png",
    animations: "disabled",
  });
  await desktopDialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.locator("body")).not.toHaveAttribute("data-original-submit-handler", "called");
  await expect(page.getByText("Submission cancelled. Your saved drafts remain editable.")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: ".staging-evidence/browser/participant-readiness-mobile.png",
    animations: "disabled",
  });

  await submit.scrollIntoViewIfNeeded();
  await submit.click();
  const mobileDialog = page.getByRole("dialog");
  await expect(mobileDialog.getByRole("button", { name: "Submit and lock" })).toBeVisible();
  await page.screenshot({
    path: ".staging-evidence/browser/participant-readiness-mobile-confirmation.png",
    animations: "disabled",
  });
  await mobileDialog.getByRole("button", { name: "Submit and lock" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-original-submit-handler", "called");
});

function makeSyntheticAssignmentMarkup() {
  const critiqueCards = Array.from({ length: 4 }, (_, index) => makeCritiqueCard(index + 1)).join("");
  return `
    <section class="panel assignment-panel" data-assignment-id="readiness-assignment-001">
      <div class="assignment-heading">
        <div>
          <p class="eyebrow">Blind initial rating</p>
          <h2>Synthetic readiness position</h2>
          <p class="muted">Assignment readiness-assignment-001 · status: <strong>assigned</strong></p>
        </div>
        <div class="packet-hash"><span>Packet commitment</span><code>1234567890abcdef…</code></div>
      </div>
      <article class="position-card">
        <p class="card-label">Position</p>
        <p>A synthetic philosophical position used only to verify whether the participant-facing workflow is understandable.</p>
        <aside><strong>Frozen context:</strong> This item is synthetic and excluded from research use.</aside>
      </article>
      <div class="critique-list">${critiqueCards}</div>
      <div class="assignment-actions">
        <button class="primary-button" type="button">Submit all four ratings</button>
        <div class="submit-status" role="status"></div>
      </div>
    </section>`;
}

function makeCritiqueCard(ordinal) {
  const scores = scoreNames.map((name) => `
    <label class="score-field">
      <span class="score-label">${name}</span>
      <input name="score_${name}" type="number" min="0" max="1" step="0.01" value="0.72" required>
      <small class="score-hint">Synthetic score guidance.</small>
    </label>`).join("");

  return `
    <article class="critique-card" data-critique-id="readiness-critique-${ordinal}">
      <header><p class="critique-number">Critique ${ordinal} of 4</p><h3 class="critique-title">readiness-critique-${ordinal}</h3></header>
      <blockquote class="critique-text">Synthetic critique ${ordinal}: a focused objection used to verify layout, progress, and submission safeguards.</blockquote>
      <details class="rubric-details"><summary>Open the full LMCA-derived scoring guidance</summary><div class="rubric-detail-content"></div></details>
      <form class="rating-form" data-assignment-id="readiness-assignment-001" data-critique-id="readiness-critique-${ordinal}">
        <fieldset class="score-grid"><legend>Seven LMCA dimensions</legend>${scores}</fieldset>
        <div class="structured-grid">
          <label><span>Assessability</span><select name="assessability"><option value="assessable" selected>Assessable</option></select></label>
          <label><span>Interpretation confidence</span><select name="interpretationConfidence"><option value="high" selected>High</option></select></label>
          <label><span>Rating confidence</span><select name="confidence"><option value="high" selected>High</option></select></label>
          <label><span>Correctness verification</span><select name="verificationStatus"><option value="not_needed" selected>Not needed</option></select></label>
          <label><span>Time spent on this critique (seconds)</span><input name="timeSpentSeconds" type="number" value="180"></label>
        </div>
        <label class="full-width"><span>Object-level rationale</span><textarea name="rationale">This synthetic rationale is deliberately longer than forty characters so the rating is complete.</textarea></label>
        <label class="full-width"><span>Relevant background assumptions or competing interpretations</span><textarea name="backgroundAssumptions">Synthetic assumption.</textarea></label>
        <fieldset class="issue-flags"><legend>Issue flags</legend><div class="issue-flag-grid"></div></fieldset>
        <label class="check-row"><input name="requestReview" type="checkbox"><span>Request adjudication even if no numerical trigger fires</span></label>
        <div class="form-status" data-kind="success" role="status">Saved · complete</div>
      </form>
    </article>`;
}
