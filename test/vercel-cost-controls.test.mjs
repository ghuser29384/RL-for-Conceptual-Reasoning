import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ALLOWED_VERCEL_BRANCHES,
  classifyVercelBuild,
  isKnownNonRuntimePath,
} from "../scripts/vercel-ignore-build.mjs";

test("only the designated release-preview branch is eligible through the ignored-build classifier", () => {
  assert.deepEqual(ALLOWED_VERCEL_BRANCHES, [
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
    true,
  );
  assert.equal(
    classifyVercelBuild({
      branch: "release/vercel-preview",
      changedFiles: ["index.html"],
    }).skip,
    false,
  );
});

test("repository-only changes skip Vercel without weakening approved Preview builds", () => {
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
      branch: "release/vercel-preview",
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
      branch: "release/vercel-preview",
      changedFiles: ["docs/release.md", "src/site-entry.mjs"],
    }).skip,
    false,
  );
});

test("vercel.json opens main only for the audited public editorial release", async () => {
  const [configText, index] = await Promise.all([
    readFile(new URL("../vercel.json", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
  ]);
  const config = JSON.parse(configText);

  assert.equal(config.git.deploymentEnabled["*"], false);
  assert.equal(config.git.deploymentEnabled.main, true);
  assert.equal(config.git.deploymentEnabled["release/vercel-preview"], true);
  assert.equal(config.buildCommand, "npm run build");
  assert.equal(Object.hasOwn(config, "ignoreCommand"), false);
  assert.match(index, /name="metaphilosophy-release-candidate" content="mp-public-voice-20260806-r1"/u);
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
