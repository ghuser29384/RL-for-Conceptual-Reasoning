import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const REQUIRED_HOME_MARKERS = Object.freeze([
  "Pilot in preparation · expert ratings have not started",
  "No Metaphilosophy expert ratings claimed yet",
  "No production data loaded",
  "External prior work",
  "1,000 public synthetic critiques",
  "48-critique expert pilot planned",
  "Reviewer intake and adviser outreach remain closed",
]);

const REQUIRED_RESEARCH_MARKERS = Object.freeze([
  "Consultation phase · production ratings not started",
  "Three artifacts. Three different claims.",
  "951 rated critiques",
  "1,458 ratings",
  "1,000 unrated critiques",
  "48 critiques · 0 ratings",
  "Evaluate the critique—not agreement with its conclusion.",
  "One gate passed. Five remain blocked.",
  "Currently not authorized",
  "It cannot settle philosophical questions",
]);

const FORBIDDEN_PUBLIC_ROUTE_PATTERNS = Object.freeze([
  /href=["']\/contribute\/?["']/iu,
  /href=["'][^"']*\?section=rating/iu,
  />\s*(?:open|launch)\s+(?:the\s+)?workspace\s*</iu,
  />\s*(?:become|join)\s+(?:an?\s+)?(?:expert|reviewer|rater)/iu,
]);

export function validatePreOutreachPublicSite(files) {
  const errors = [];
  const {
    indexHtml = "",
    homeModule = "",
    siteEntry = "",
    appModule = "",
    trustCss = "",
    researchHtml = "",
    researchCss = "",
    argumentHtml = "",
    reviewerClosedHtml = "",
    buildScript = "",
  } = files ?? {};

  requireMarkers(errors, "homepage module", homeModule, REQUIRED_HOME_MARKERS);
  requireMarkers(errors, "research protocol", researchHtml, REQUIRED_RESEARCH_MARKERS);

  for (const pattern of FORBIDDEN_PUBLIC_ROUTE_PATTERNS) {
    for (const [name, text] of [
      ["homepage module", homeModule],
      ["research protocol", researchHtml],
      ["synthetic library", argumentHtml],
    ]) {
      if (pattern.test(text)) errors.push(`${name} contains a pre-outreach-forbidden route or call to action: ${pattern}.`);
    }
  }

  if (!indexHtml.includes("expert ratings have not started")) {
    errors.push("index.html metadata must state that expert ratings have not started.");
  }
  if (!indexHtml.includes("/src/trust-home.css")) {
    errors.push("index.html must load the public trust-surface stylesheet.");
  }

  for (const marker of ["const isRootSurface", "legacySectionTargets", "normalizeLegacyRootRoute", "#status"]) {
    if (!siteEntry.includes(marker)) errors.push(`site-entry.mjs must include ${marker}.`);
  }
  if (/const\s+isPublicHome\s*=.*!initialQuery\.has\(["']section["']\)/su.test(siteEntry)) {
    errors.push("Legacy query-string routes must not bypass the public homepage and load the workspace path.");
  }

  if (appModule.trim().length < 300) errors.push("The non-public workspace fallback must not be blank or trivial.");
  for (const marker of ["not publicly open", "has not started production expert ratings", "/research/", "/arguments/"]) {
    if (!appModule.includes(marker)) errors.push(`Workspace fallback must include ${marker}.`);
  }

  for (const marker of [
    "model-authored, unrated critiques",
    "None has been expert-rated by Metaphilosophy",
    "external LMCA expert-rated research release",
    "/research/",
  ]) {
    if (!argumentHtml.includes(marker)) errors.push(`Synthetic library must include ${marker}.`);
  }

  for (const marker of [
    "Reviewer intake is intentionally closed",
    "No application, calibration submission, deadline, or paid assignment",
    "zero production ratings",
    "/research/",
  ]) {
    if (!reviewerClosedHtml.includes(marker)) errors.push(`Closed reviewer page must include ${marker}.`);
  }

  if (!buildScript.includes('resolve(root, "research")')) {
    errors.push("Static build must copy the public research protocol directory.");
  }

  for (const marker of [":focus-visible", "@media", ".mpWorkspaceGate", ".mpProtocolCard", ".mpStateGrid"]) {
    if (!trustCss.includes(marker)) errors.push(`Public trust CSS must include ${marker}.`);
  }
  for (const marker of [":focus-visible", "@media", ".gateList", ".boundaryGrid", ".rubricGrid"]) {
    if (!researchCss.includes(marker)) errors.push(`Research protocol CSS must include ${marker}.`);
  }

  if (researchHtml.includes("Metaphilosophy’s expert-rated corpus")) {
    errors.push("Research protocol must not imply that Metaphilosophy already has an expert-rated corpus.");
  }
  if (argumentHtml.includes("Metaphilosophy’s expert-rated corpus")) {
    errors.push("Synthetic library must not imply that Metaphilosophy already has an expert-rated corpus.");
  }

  return {
    status: errors.length ? "fail" : "pass",
    checks: {
      truthful_homepage: REQUIRED_HOME_MARKERS.every((marker) => homeModule.includes(marker)),
      public_protocol_present: REQUIRED_RESEARCH_MARKERS.every((marker) => researchHtml.includes(marker)),
      legacy_blank_route_removed:
        siteEntry.includes("normalizeLegacyRootRoute") && appModule.trim().length >= 300,
      reviewer_intake_closed: reviewerClosedHtml.includes("Reviewer intake is intentionally closed"),
      synthetic_release_boundary_visible:
        argumentHtml.includes("None has been expert-rated by Metaphilosophy"),
      research_in_static_build: buildScript.includes('resolve(root, "research")'),
      responsive_and_keyboard_styles_present:
        trustCss.includes(":focus-visible") && researchCss.includes(":focus-visible"),
    },
    outreach_authorized: false,
    production_ready: false,
    errors,
  };
}

export async function readAndValidatePreOutreachPublicSite(root) {
  const resolvedRoot = resolve(root);
  const read = (path) => readFile(resolve(resolvedRoot, path), "utf8");
  const [
    indexHtml,
    homeModule,
    siteEntry,
    appModule,
    trustCss,
    researchHtml,
    researchCss,
    argumentHtml,
    reviewerClosedHtml,
    buildScript,
  ] = await Promise.all([
    read("index.html"),
    read("src/exact-reference-home.mjs"),
    read("src/site-entry.mjs"),
    read("src/app.mjs"),
    read("src/trust-home.css"),
    read("research/index.html"),
    read("research/styles.css"),
    read("arguments/index.html"),
    read("reviewers/closed.html"),
    read("scripts/build-static.mjs"),
  ]);

  return validatePreOutreachPublicSite({
    indexHtml,
    homeModule,
    siteEntry,
    appModule,
    trustCss,
    researchHtml,
    researchCss,
    argumentHtml,
    reviewerClosedHtml,
    buildScript,
  });
}

function requireMarkers(errors, name, text, markers) {
  for (const marker of markers) {
    if (!text.includes(marker)) errors.push(`${name} must include ${marker}.`);
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help")) {
    console.log("Usage: node scripts/verify-pre-outreach-public-site.mjs [repository-root]");
    console.log("Validates public claims, routes, evidence boundaries, closed intake, and static-build coverage. Passing never authorizes outreach or production promotion.");
  } else {
    const root = process.argv[2] ?? resolve(import.meta.dirname, "..");
    const report = await readAndValidatePreOutreachPublicSite(root);
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== "pass") process.exitCode = 1;
  }
}
