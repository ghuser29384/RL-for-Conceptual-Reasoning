import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const scriptUrl = new URL("../scripts/vercel-ignore-build.mjs", import.meta.url);

test("only the designated release-preview branch may deploy", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url)));
  assert.equal(config.git.deploymentEnabled["*"], false);
  assert.equal(config.git.deploymentEnabled.main, false);
  assert.equal(config.git.deploymentEnabled["release/vercel-preview"], true);
  assert.equal(config.ignoreCommand, "node scripts/vercel-ignore-build.mjs");
});

test("unapproved branches skip before any Git comparison", () => {
  for (const branch of ["agent/48-critique-pilot-20260730", "main"]) {
    const result = spawnSync(process.execPath, [scriptUrl.pathname], {
      encoding: "utf8",
      env: {
        ...process.env,
        VERCEL_GIT_COMMIT_REF: branch,
        VERCEL_GIT_PREVIOUS_SHA: "invalid",
        VERCEL_GIT_COMMIT_SHA: "invalid",
      },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"skip":true/u);
  }
});

test("uncertainty on the approved Preview branch builds conservatively", () => {
  const result = spawnSync(process.execPath, [scriptUrl.pathname], {
    encoding: "utf8",
    env: {
      ...process.env,
      VERCEL_GIT_COMMIT_REF: "release/vercel-preview",
      VERCEL_GIT_PREVIOUS_SHA: "invalid",
      VERCEL_GIT_COMMIT_SHA: "invalid",
    },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /"skip":false/u);
});

test("GitHub Actions keeps QA but contains no Vercel deployment jobs", async () => {
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
