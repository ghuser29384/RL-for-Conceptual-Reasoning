import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  readAndValidatePublicCssDependencyGraph,
  validatePublicCssDependencyGraph,
} from "../scripts/verify-public-css-dependencies.mjs";

const root = resolve(import.meta.dirname, "..");

async function loadInputs() {
  const src = resolve(root, "src");
  const [indexHtml, buildScript, entries] = await Promise.all([
    readFile(resolve(root, "index.html"), "utf8"),
    readFile(resolve(root, "scripts/build-static.mjs"), "utf8"),
    readdir(src, { withFileTypes: true }),
  ]);
  const cssNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
    .map((entry) => entry.name);
  const cssByName = new Map(
    await Promise.all(cssNames.map(async (name) => [name, await readFile(resolve(src, name), "utf8")])),
  );
  return { indexHtml, buildScript, cssByName };
}

test("resolves every transitive public stylesheet into the static build", async () => {
  const report = await readAndValidatePublicCssDependencyGraph(root);
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.ok(report.root_stylesheets >= 7);
  assert.ok(report.resolved_local_stylesheets >= 12);
  assert.equal(report.mobile_navigation_fail_closed, true);
  assert.equal(report.internal_workspace_excluded, true);
});

test("rejects an imported stylesheet omitted from the public allowlist", async () => {
  const inputs = await loadInputs();
  inputs.buildScript = inputs.buildScript.replace('  "epoch-core.css",\n', "");
  const report = validatePublicCssDependencyGraph(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("epoch-core.css is not in publicSrcFiles")));
});

test("rejects a missing imported stylesheet", async () => {
  const inputs = await loadInputs();
  inputs.cssByName.delete("epoch-impact.css");
  const report = validatePublicCssDependencyGraph(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("epoch-impact.css does not exist")));
});

test("rejects a mobile menu that remains visible or interactive while closed", async () => {
  const inputs = await loadInputs();
  inputs.cssByName.set(
    "mobile-navigation.css",
    inputs.cssByName.get("mobile-navigation.css")
      .replace("visibility: hidden", "visibility: visible")
      .replace("pointer-events: none", "pointer-events: auto"),
  );
  const report = validatePublicCssDependencyGraph(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("visibility: hidden")));
  assert.ok(report.errors.some((error) => error.includes("pointer-events: none")));
});
