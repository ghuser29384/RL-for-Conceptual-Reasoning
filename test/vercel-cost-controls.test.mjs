import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ALLOWED_VERCEL_BRANCHES,
  classifyVercelBuild,
  isKnownNonRuntimePath,
} from "../scripts/vercel-ignore-build.mjs";

test("only main and the designated release-preview branch may deploy", () => {
  assert.deepEqual(ALLOWED_VERCEL_BRANCHES, [
    "main",
    "release/vercel-preview",
  ]);

  assert.equal(
    classifyVercelBuild({
      branch: "agent/example",
      changedFiles: ["index.html"],
    }).skip,
    true,
  );
  assert.equal(
    classifyVercelBuild({
      branch: "main",
      changedFiles: ["index.html"],
    }).skip,
    false,
  );
});

test("repository-only changes skip Vercel without weakening runtime builds", () => {
  for (const path of [
    ".github/workflows/quality.yml",
    "docs/release.md",
    "e2e/public-rendered-smoke.spec.mjs",
    "ops/review-packet.md",
    "test/public-site.test.mjs",
    "README.md",
  ]) {
    assert.equal(isKnownNonRuntimePath(path), true, path);
  }

  for (const path of [
    "api/reviewer-applications.mjs",
    "arguments/index.html",
    "index.html",
    "package-lock.json",
    "reviewers/closed.html",
    "scripts/build-static.mjs",
    "src/site-entry.mjs",
    "vercel.json",
  ]) {
    assert.equal(isKnownNonRuntimePath(path), false, path);
  }

  assert.equal(
    classifyVercelBuild({
      branch: "main",
      changedFiles: [
        "docs/release.md",
        "ops/review-packet.md",
        "test/public-site.test.mjs",
      ],
    }).skip,
    true,
  );
  assert.equal(
    classifyVercelBuild({
      branch: "main",
      changedFiles: ["docs/release.md", "src/site-entry.mjs"],
    }).skip,
    false,
  );
});

test("vercel.json contains deployment controls and every required public route", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url)));
  assert.equal(config.git.deploymentEnabled["*"], false);
  assert.equal(config.git.deploymentEnabled.main, true);
  assert.equal(config.git.deploymentEnabled["release/vercel-preview"], true);
  assert.equal(config.ignoreCommand, "node scripts/vercel-ignore-build.mjs");

  const rewrites = new Map(
    config.rewrites.map((rule) => [rule.source, rule.destination]),
  );
  for (const source of ["/research", "/research/"]) {
    assert.equal(rewrites.get(source), "/research/index.html", source);
  }
  for (const source of ["/workspace", "/workspace/", "/reference", "/reference/"]) {
    assert.equal(rewrites.get(source), "/index.html", source);
  }
  for (const source of [
    "/contribute",
    "/contribute/",
    "/reviewers",
    "/reviewers/",
    "/reviewers/index.html",
  ]) {
    assert.equal(rewrites.get(source), "/reviewers/closed.html", source);
  }

  assert.deepEqual(config.redirects, [
    {
      source: "/src/assets/LMCA_dataset.pdf",
      destination: "https://arxiv.org/pdf/2607.27499",
      permanent: false,
    },
  ]);

  const headerMap = new Map(
    config.headers
      .find((entry) => entry.source === "/(.*)")
      .headers.map((entry) => [entry.key, entry.value]),
  );
  assert.equal(headerMap.get("X-Content-Type-Options"), "nosniff");
  assert.equal(headerMap.get("X-Frame-Options"), "DENY");
  assert.equal(headerMap.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(
    headerMap.get("Permissions-Policy"),
    "camera=(), microphone=(), geolocation=()",
  );
});

test("GitHub Actions performs QA but never creates automatic Vercel deployments", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/vercel-deploy.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /pull_request:/u);
  assert.match(workflow, /release\/vercel-preview/u);
  assert.match(workflow, /npm run check/u);
  assert.doesNotMatch(workflow, /\bvercel\s+(?:build|deploy|pull)\b/u);
  assert.doesNotMatch(workflow, /deploy-preview|deploy-production/u);
});
