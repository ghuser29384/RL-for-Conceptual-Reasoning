import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "human-workflow-staging.spec.mjs",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["line"], ["html", { outputFolder: "../.staging-evidence/playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4175",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  outputDir: "../.staging-evidence/playwright-results",
  webServer: {
    command: "rm -rf .staging-e2e-data && mkdir -p .staging-e2e-data && PORT=4175 HOST=127.0.0.1 STAGING_DATA_DIR=.staging-e2e-data STAGING_BOOTSTRAP_TOKEN=synthetic-rehearsal-bootstrap-token-32-bytes-minimum STAGING_CSRF_SECRET=synthetic-rehearsal-csrf-secret-32-bytes-minimum npm run serve:staging",
    url: "http://127.0.0.1:4175/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
