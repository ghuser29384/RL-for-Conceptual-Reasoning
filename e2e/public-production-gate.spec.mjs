import { expect, test } from "@playwright/test";

const RELEASE_MARKER = "mp-preoutreach-20260802-r1";
const REQUIRED_HEADERS = Object.freeze({
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
});

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

for (const path of ["/workspace", "/reference"]) {
  test(`${path} renders the public readiness gate without internal execution UI`, async ({ page }, testInfo) => {
    const errors = monitorPage(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(path, { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The rating workspace is gated until the pilot is ready.");
    await expect(page.getByText("This workspace is not publicly open", { exact: true })).toBeVisible();
    await expect(page.getByText(/No application, assignment, rating task, deadline, payment commitment, or expert-result claim/iu)).toBeVisible();
    await expect(page.locator(".appShell")).toHaveCount(0);
    await expect(page.locator(".mpWorkspaceGate")).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`${path.slice(1)}-gate.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("root document is the marked release and carries baseline security headers", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain(`name="metaphilosophy-release-candidate" content="${RELEASE_MARKER}"`);
  for (const [name, value] of Object.entries(REQUIRED_HEADERS)) {
    expect(response.headers()[name]).toBe(value);
  }
});

test("internal workspace source is not publicly retrievable", async ({ request }) => {
  const response = await request.get("/src/app.mjs", { maxRedirects: 0 });
  expect(response.status()).toBe(404);
  const text = await response.text();
  expect(text).not.toContain("workflowEvidenceCollections");
  expect(text).not.toContain("sourceLeakageRedactionPolicy");
  expect(text).not.toContain("releaseReportReadbackItems");
});

test("LMCA source path remains a temporary redirect to the canonical arXiv PDF", async ({ request }) => {
  const response = await request.get("/src/assets/LMCA_dataset.pdf", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  const location = response.headers().location ?? "";
  expect(location).toMatch(/^https:\/\/arxiv\.org\/pdf\/2607\.27499(?:[?#].*)?$/u);
});
