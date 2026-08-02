import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: /public-(?:rendered-smoke|production-gate)\.spec\.mjs/u,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  outputDir: "../test-results/playwright",
  reporter: [["line"]],
  use: {
    baseURL: process.env.PUBLIC_SITE_BASE_URL ?? "http://127.0.0.1:4173",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
