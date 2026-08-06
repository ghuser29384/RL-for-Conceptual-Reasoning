import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  readAndValidatePublicTrustSurface,
  validatePublicTrustSurface,
} from "../scripts/verify-public-trust-surface.mjs";

const root = resolve(import.meta.dirname, "..");

async function loadInputs() {
  const read = (path) => readFile(resolve(root, path), "utf8");
  const [index, siteEntry, home, baseCss, homeCss, gate, internalWorkspace, research, researchCss, argumentsPage, reviewersPage, buildScript, vercelText] = await Promise.all([
    read("index.html"),
    read("src/site-entry.mjs"),
    read("src/exact-reference-home.mjs"),
    read("src/exact-reference.css"),
    read("src/trust-home.css"),
    read("src/workspace-gate.mjs"),
    read("src/app.mjs"),
    read("research/index.html"),
    read("research/styles.css"),
    read("arguments/index.html"),
    read("reviewers/closed.html"),
    read("scripts/build-static.mjs"),
    read("vercel.json"),
  ]);
  return {
    index,
    siteEntry,
    home,
    baseCss,
    homeCss,
    gate,
    internalWorkspace,
    research,
    researchCss,
    argumentsPage,
    reviewersPage,
    buildScript,
    vercel: JSON.parse(vercelText),
  };
}

test("accepts an authored public surface while preserving but not publishing internal source", async () => {
  const report = await readAndValidatePublicTrustSurface(root);
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.public_home_recruitment_cta_removed, true);
  assert.equal(report.public_workspace_gate_verified, true);
  assert.equal(report.internal_workspace_preserved, true);
  assert.equal(report.internal_workspace_excluded_from_public_build, true);
  assert.equal(report.research_protocol_published, true);
  assert.equal(report.synthetic_release_marked_unrated, true);
  assert.equal(report.reviewer_intake_closed, true);
  assert.equal(report.security_headers_present, true);
});

test("rejects reopening recruitment or importing the internal app from the public entry", async () => {
  const inputs = await loadInputs();
  inputs.home += '<a href="/contribute">Become a reviewer</a>';
  inputs.siteEntry += '\nawait import("./app.mjs");';
  const report = validatePublicTrustSurface(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("/contribute")));
  assert.ok(report.errors.some((error) => error.includes("Become a reviewer")));
  assert.ok(report.errors.some((error) => error.includes("must not import")));
});

test("rejects a blank gate or a gate containing internal execution structure", async () => {
  const inputs = await loadInputs();
  inputs.gate = "workflowEvidenceCollections";
  const report = validatePublicTrustSurface(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("substantive")));
  assert.ok(report.errors.some((error) => error.includes("workflowEvidenceCollections")));
  assert.ok(report.errors.some((error) => error.includes("workspace is closed")));
});

test("rejects deleting the internal workspace or adding it to the public build", async () => {
  const inputs = await loadInputs();
  inputs.internalWorkspace = "placeholder";
  inputs.buildScript = inputs.buildScript.replace('"trust-home.css",', '"trust-home.css",\n  "app.mjs",');
  const report = validatePublicTrustSurface(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("preserve the full internal")));
  assert.ok(report.errors.some((error) => error.includes("app.mjs")));
});

test("rejects collapsing LMCA, synthetic, and planned-study evidence", async () => {
  const inputs = await loadInputs();
  inputs.research += "Metaphilosophy has 951 rated critiques";
  inputs.argumentsPage = inputs.argumentsPage.replace(
    "None has an expert rating.",
    "Every item has an expert rating.",
  );
  const report = validatePublicTrustSurface(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("prohibited claim")));
  assert.ok(report.errors.some((error) => error.includes("None has an expert rating.")));
});

test("rejects lost workspace routing or baseline browser protections", async () => {
  const inputs = await loadInputs();
  inputs.vercel.rewrites = inputs.vercel.rewrites.filter((entry) => entry.source !== "/workspace");
  inputs.vercel.headers = [];
  const report = validatePublicTrustSurface(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("rewrite /workspace")));
  assert.ok(report.errors.some((error) => error.includes("X-Content-Type-Options")));
  assert.ok(report.errors.some((error) => error.includes("Permissions-Policy")));
});

test("rejects removal of homepage keyboard or reduced-motion controls", async () => {
  const inputs = await loadInputs();
  inputs.baseCss = inputs.baseCss
    .replace(".mpHome :focus-visible", ".mpHome :focus-disabled")
    .replace("@media (prefers-reduced-motion: reduce)", "@media (prefers-reduced-motion: no-preference)");
  const report = validatePublicTrustSurface(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes(".mpHome :focus-visible")));
  assert.ok(report.errors.some((error) => error.includes("prefers-reduced-motion")));
});
