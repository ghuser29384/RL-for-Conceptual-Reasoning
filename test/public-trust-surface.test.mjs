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
  const [
    index,
    siteEntry,
    home,
    baseCss,
    homeCss,
    workspace,
    research,
    researchCss,
    argumentsPage,
    reviewersPage,
    buildScript,
    vercelText,
  ] = await Promise.all([
    readFile(resolve(root, "index.html"), "utf8"),
    readFile(resolve(root, "src/site-entry.mjs"), "utf8"),
    readFile(resolve(root, "src/exact-reference-home.mjs"), "utf8"),
    readFile(resolve(root, "src/exact-reference.css"), "utf8"),
    readFile(resolve(root, "src/trust-home.css"), "utf8"),
    readFile(resolve(root, "src/app.mjs"), "utf8"),
    readFile(resolve(root, "research/index.html"), "utf8"),
    readFile(resolve(root, "research/styles.css"), "utf8"),
    readFile(resolve(root, "arguments/index.html"), "utf8"),
    readFile(resolve(root, "reviewers/closed.html"), "utf8"),
    readFile(resolve(root, "scripts/build-static.mjs"), "utf8"),
    readFile(resolve(root, "vercel.json"), "utf8"),
  ]);

  return {
    index,
    siteEntry,
    home,
    baseCss,
    homeCss,
    workspace,
    research,
    researchCss,
    argumentsPage,
    reviewersPage,
    buildScript,
    vercel: JSON.parse(vercelText),
  };
}

test("accepts the evidence-bound public surface while preserving the internal workspace", async () => {
  const report = await readAndValidatePublicTrustSurface(root);
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.public_home_recruitment_cta_removed, true);
  assert.equal(report.public_private_route_separation_verified, true);
  assert.equal(report.internal_workspace_preserved, true);
  assert.equal(report.research_protocol_published, true);
  assert.equal(report.synthetic_release_marked_unrated, true);
  assert.equal(report.reviewer_intake_closed, true);
  assert.equal(report.security_headers_present, true);
});

test("rejects reopening recruitment or breaking public-private route separation", async () => {
  const inputs = await loadInputs();
  inputs.home += '<a href="/contribute">Become a reviewer</a>';
  inputs.siteEntry = inputs.siteEntry.replace('rawPath === "/workspace"', 'rawPath === "/missing"');
  const report = validatePublicTrustSurface(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("/contribute")));
  assert.ok(report.errors.some((error) => error.includes("Become a reviewer")));
  assert.ok(report.errors.some((error) => error.includes('rawPath === "/workspace"')));
});

test("rejects replacing the internal research application with a thin placeholder", async () => {
  const inputs = await loadInputs();
  inputs.workspace = `const root = document.querySelector("#root"); root.innerHTML = "Not ready";`;
  const report = validatePublicTrustSurface(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("must remain substantial")));
  assert.ok(report.errors.some((error) => error.includes("workflowEvidenceCollections")));
  assert.ok(report.errors.some((error) => error.includes("sourceLeakageRedactionPolicy")));
});

test("rejects collapsing LMCA, synthetic, and pilot evidence classes", async () => {
  const inputs = await loadInputs();
  inputs.research += "Metaphilosophy has 951 rated critiques";
  inputs.argumentsPage = inputs.argumentsPage.replace(
    "This collection is synthetic and unrated",
    "This collection is expert-rated",
  );
  const report = validatePublicTrustSurface(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("prohibited claim")));
  assert.ok(report.errors.some((error) => error.includes("synthetic and unrated")));
});

test("rejects lost research routing or baseline browser protections", async () => {
  const inputs = await loadInputs();
  inputs.vercel.rewrites = inputs.vercel.rewrites.filter((entry) => entry.source !== "/research");
  inputs.vercel.headers = [];
  const report = validatePublicTrustSurface(inputs);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("route /research")));
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
