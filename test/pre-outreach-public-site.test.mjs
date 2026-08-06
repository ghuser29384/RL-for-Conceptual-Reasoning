import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { validatePreOutreachPublicSite } from "../scripts/verify-pre-outreach-public-site.mjs";

const root = resolve(import.meta.dirname, "..");

async function loadFiles() {
  const read = (path) => readFile(resolve(root, path), "utf8");
  const [indexHtml, homeModule, siteEntry, gateModule, appModule, exactCss, trustCss, researchHtml, researchCss, argumentHtml, reviewerClosedHtml, buildScript] = await Promise.all([
    read("index.html"),
    read("src/exact-reference-home.mjs"),
    read("src/site-entry.mjs"),
    read("src/workspace-gate.mjs"),
    read("src/app.mjs"),
    read("src/exact-reference.css"),
    read("src/trust-home.css"),
    read("research/index.html"),
    read("research/styles.css"),
    read("arguments/index.html"),
    read("reviewers/closed.html"),
    read("scripts/build-static.mjs"),
  ]);
  return {
    indexHtml,
    homeModule,
    siteEntry,
    gateModule,
    appModule,
    exactCss,
    trustCss,
    researchHtml,
    researchCss,
    argumentHtml,
    reviewerClosedHtml,
    buildScript,
  };
}

test("accepts the authored public site, gated workspace, and excluded internal bundle", async () => {
  const report = validatePreOutreachPublicSite(await loadFiles());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.deepEqual(report.checks, {
    truthful_homepage: true,
    public_protocol_present: true,
    workspace_route_gated: true,
    internal_workspace_preserved_and_excluded: true,
    reviewer_intake_closed: true,
    synthetic_release_boundary_visible: true,
    research_in_static_build: true,
    responsive_and_keyboard_styles_present: true,
  });
  assert.equal(report.outreach_authorized, false);
  assert.equal(report.production_ready, false);
});

test("rejects reopening recruitment or linking directly to a rating surface", async () => {
  const files = await loadFiles();
  files.homeModule += '<a href="/contribute">Become a reviewer</a>';
  files.argumentHtml += '<a href="/?section=rating">Open workspace</a>';
  const report = validatePreOutreachPublicSite(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("pre-outreach-forbidden route")));
});

test("rejects importing the internal app or replacing the public gate with internal structure", async () => {
  const files = await loadFiles();
  files.siteEntry += '\nawait import("./app.mjs");';
  files.gateModule = "workflowEvidenceCollections";
  const report = validatePreOutreachPublicSite(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("must not import")));
  assert.ok(report.errors.some((error) => error.includes("workspace gate must include")));
  assert.ok(report.errors.some((error) => error.includes("must not include internal marker")));
});

test("rejects deleting the internal workspace or copying it into the public build", async () => {
  const files = await loadFiles();
  files.appModule = "";
  files.buildScript = files.buildScript.replace('"trust-home.css",', '"trust-home.css",\n  "app.mjs",');
  const report = validatePreOutreachPublicSite(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("preserve the full internal")));
  assert.ok(report.errors.some((error) => error.includes("must not be copied")));
});

test("rejects blurring LMCA, synthetic, and future Metaphilosophy ratings", async () => {
  const files = await loadFiles();
  files.researchHtml = files.researchHtml
    .replace("Three bodies of work, kept separate.", "One combined dataset")
    .replace("48 critiques · 0 ratings", "48 expert-rated critiques");
  files.argumentHtml = files.argumentHtml.replace(
    "None has an expert rating.",
    "This collection is part of Metaphilosophy’s expert-rated corpus.",
  );
  const report = validatePreOutreachPublicSite(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("Three bodies of work, kept separate.")));
  assert.ok(report.errors.some((error) => error.includes("48 critiques · 0 ratings")));
  assert.ok(report.errors.some((error) => error.includes("must not imply")));
});

test("rejects dropping the protocol from the static build or accessibility styles", async () => {
  const files = await loadFiles();
  files.buildScript = files.buildScript.replace('resolve(root, "research")', 'resolve(root, "missing-research")');
  files.exactCss = files.exactCss.replaceAll(":focus-visible", ":focus-disabled");
  files.researchCss = files.researchCss.replaceAll(":focus-visible", ":focus-disabled");
  const report = validatePreOutreachPublicSite(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("resolve(root, \"research\")")));
  assert.ok(report.errors.some((error) => error.includes("Base public CSS must include :focus-visible")));
  assert.ok(report.errors.some((error) => error.includes("Research protocol CSS must include :focus-visible")));
});
