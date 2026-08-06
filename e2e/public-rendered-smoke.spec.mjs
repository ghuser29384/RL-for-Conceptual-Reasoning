import { expect, test } from "@playwright/test";

function monitorPage(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    errors.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown"}`);
  });
  return errors;
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0,
    );
    return documentWidth - window.innerWidth;
  });
  expect(overflow).toBeLessThanOrEqual(2);
}

async function expectNoForbiddenPublicLinks(page) {
  const badLinks = await page.locator("a[href]").evaluateAll((links) =>
    links
      .map((link) => link.getAttribute("href") ?? "")
      .filter((href) => href === "/contribute" || href === "/contribute/" || href.includes("?section=rating")),
  );
  expect(badLinks).toEqual([]);
}

async function capture(page, testInfo, name) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

test("desktop homepage is truthful, authored, interactive, and free of broken public routes", async ({ page }, testInfo) => {
  const errors = monitorPage(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page).toHaveTitle(/expert ratings of philosophical arguments/iu);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Philosophers can disagree and still judge arguments.");
  await expect(page.getByText("Research study not yet open", { exact: true })).toBeVisible();
  await expect(page.getByText("0 research ratings collected", { exact: true })).toBeVisible();
  await expect(page.getByText("Demonstration only", { exact: true })).toBeVisible();
  await expect(page.getByText(/research project by Ellen Sun/iu).first()).toBeVisible();

  await page.getByRole("button", { name: /Clarity\s+Precision of meaning/iu }).click();
  await expect(page.locator("#mp-dimension-name")).toHaveText("Clarity");
  await expect(page.locator("#mp-dimension-copy")).toContainText("fixed precisely");

  await expectNoForbiddenPublicLinks(page);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "homepage-desktop");
  expect(errors).toEqual([]);
});

test("mobile homepage navigation and rubric remain usable", async ({ page }, testInfo) => {
  const errors = monitorPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });

  const menu = page.locator(".mpMenu");
  const navigation = page.locator(".mpNavigation");
  await expect(menu).toBeVisible();
  await expect(navigation).toHaveCSS("visibility", "hidden");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(navigation).toHaveClass(/isOpen/u);
  await expect(navigation).toHaveCSS("visibility", "visible");
  await expect(page.getByRole("link", { name: "What exists", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(navigation).not.toHaveClass(/isOpen/u);
  await expect(navigation).toHaveCSS("visibility", "hidden");

  await page.getByRole("button", { name: /Overall\s+All things considered/iu }).click();
  await expect(page.locator("#mp-dimension-name")).toHaveText("Overall");
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "homepage-mobile");
  expect(errors).toEqual([]);
});

test("public study plan renders its source and readiness boundaries", async ({ page }, testInfo) => {
  const errors = monitorPage(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/research/", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { level: 1 })).toContainText("A small test of whether philosophers can rate critiques");
  await expect(page.getByText("Draft study plan · research ratings have not begun", { exact: true })).toBeVisible();
  await expect(page.getByText(/Written and maintained by Ellen Sun/iu)).toBeVisible();
  await expect(page.getByText("Three bodies of work, kept separate.", { exact: true })).toBeVisible();
  await expect(page.getByText("The software is not the last gate.", { exact: true })).toBeVisible();
  await expect(page.getByText("Current status", { exact: true })).toBeVisible();
  await expect(page.locator(".heroMetrics .zero dd")).toHaveText("0");

  await expectNoForbiddenPublicLinks(page);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "research-desktop");
  expect(errors).toEqual([]);
});

test("public study plan remains readable on mobile", async ({ page }, testInfo) => {
  const errors = monitorPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/research/", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".boundaryGrid article")).toHaveCount(3);
  await expect(page.locator(".gateList li")).toHaveCount(6);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "research-mobile");
  expect(errors).toEqual([]);
});

test("synthetic library loads all records, filters, paginates, and downloads", async ({ page }, testInfo) => {
  const errors = monitorPage(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/arguments/", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Synthetic critique library");
  await expect(page.getByText("None has an expert rating.", { exact: false })).toBeVisible();
  await expect(page.locator("#result-count")).toHaveText("250 positions · 1,000 critiques", { timeout: 20_000 });
  await expect(page.locator(".positionItem")).toHaveCount(10);

  await page.locator("#query").fill("utilitarianism");
  await expect(page.locator("#result-count")).not.toHaveText("250 positions · 1,000 critiques");
  await expect(page.locator(".positionItem").first()).toBeVisible();

  await page.locator("#clear").click();
  await expect(page.locator("#result-count")).toHaveText("250 positions · 1,000 critiques");
  await page.locator("#domain").selectOption({ index: 1 });
  await expect(page.locator("#result-count")).not.toHaveText("250 positions · 1,000 critiques");

  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-download="jsonl"]').first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("metaphilosophy-synthetic-1000.jsonl");

  await expectNoForbiddenPublicLinks(page);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "library-desktop");
  expect(errors).toEqual([]);
});

test("synthetic library remains usable on mobile", async ({ page }, testInfo) => {
  const errors = monitorPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/arguments/", { waitUntil: "networkidle" });

  await expect(page.locator("#result-count")).toHaveText("250 positions · 1,000 critiques", { timeout: 20_000 });
  await page.locator("#query").fill("consciousness");
  await expect(page.locator(".positionItem").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "library-mobile");
  expect(errors).toEqual([]);
});

test("reviewer and contribution routes remain closed", async ({ page }, testInfo) => {
  const errors = monitorPage(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/contribute", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Research rating applications are closed.");
  await expect(page.getByText(/does not accept applications, ratings, calibration work, or payment details/iu)).toBeVisible();
  await expect(page.getByText(/Zero research ratings have been collected/iu)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "reviewer-intake-closed");
  expect(errors).toEqual([]);
});

test("legacy rating query resolves to public status instead of a blank workspace", async ({ page }) => {
  const errors = monitorPage(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?section=rating", { waitUntil: "networkidle" });

  await expect(page).toHaveURL(/\/#status$/u);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Philosophers can disagree and still judge arguments.");
  await expect(page.locator(".mpWorkspaceGate")).toHaveCount(0);
  expect(errors).toEqual([]);
});
