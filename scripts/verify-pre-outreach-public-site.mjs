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
const REQUIRED_GATE_MARKERS = Object.freeze([
  "The rating workspace is gated until the pilot is ready",
  "This workspace is not publicly open",
  "has not started production expert ratings",
  "No application, assignment, rating task, deadline, payment commitment, or expert-result claim",
  "/research/",
  "/arguments/",
]);
const REQUIRED_INTERNAL_WORKSPACE_MARKERS = Object.freeze([
  "workflowEvidenceCollections",
  "sourceLeakageRedactionPolicy",
  "releaseReportReadbackItems",
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
    gateModule = "",
    appModule = "",
    exactCss = "",
    trustCss = "",
    researchHtml = "",
    researchCss = "",
    argumentHtml = "",
    reviewerClosedHtml = "",
    buildScript = "",
  } = files ?? {};

  requireMarkers(errors, "homepage module", homeModule, REQUIRED_HOME_MARKERS);
  requireMarkers(errors, "research protocol", researchHtml, REQUIRED_RESEARCH_MARKERS);
  requireMarkers(errors, "workspace gate", gateModule, REQUIRED_GATE_MARKERS);

  for (const pattern of FORBIDDEN_PUBLIC_ROUTE_PATTERNS) {
    for (const [name, text] of [
      ["homepage module", homeModule],
      ["research protocol", researchHtml],
      ["synthetic library", argumentHtml],
    ]) {
      if (pattern.test(text)) errors.push(`${name} contains a pre-outreach-forbidden route or call to action: ${pattern}.`);
    }
  }

  if (!/expert ratings have not started/iu.test(indexHtml)) errors.push("index.html metadata must state that expert ratings have not started.");
  if (!indexHtml.includes("/src/trust-home.css")) errors.push("index.html must load the public trust-surface stylesheet.");

  for (const marker of [
    "const isRootSurface",
    "const isWorkspaceGateSurface",
    "legacySectionTargets",
    "normalizeLegacyRootRoute",
    "root.innerHTML = publicHomePage()",
    'await import("./workspace-gate.mjs")',
    'window.location.replace("/")',
    "#status",
  ]) {
    if (!siteEntry.includes(marker)) errors.push(`site-entry.mjs must include ${marker}.`);
  }
  if (siteEntry.includes('import("./app.mjs")')) errors.push("Public site entry must not import the internal workspace.");

  if (Buffer.byteLength(appModule, "utf8") < 100_000) errors.push("The repository must preserve the full internal research workspace source.");
  requireMarkers(errors, "internal research workspace", appModule, REQUIRED_INTERNAL_WORKSPACE_MARKERS);
  for (const marker of REQUIRED_INTERNAL_WORKSPACE_MARKERS) {
    if (gateModule.includes(marker)) errors.push(`Public workspace gate must not include internal marker ${marker}.`);
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
    "The July 2026 intake window has closed",
    "No application, calibration submission, deadline, or paid assignment",
    "zero production ratings",
    "/research/",
  ]) {
    if (!reviewerClosedHtml.includes(marker)) errors.push(`Closed reviewer page must include ${marker}.`);
  }

  for (const marker of [
    "const publicSrcFiles",
    '"workspace-gate.mjs"',
    'resolve(root, "research")',
  ]) {
    if (!buildScript.includes(marker)) errors.push(`Static build must include ${marker}.`);
  }
  if (/cp\(resolve\(root, "src"\), resolve\(dist, "src"\), \{ recursive: true \}\)/u.test(buildScript)) {
    errors.push("Static build must not copy the entire internal src directory.");
  }
  if (buildScript.includes('"app.mjs"')) errors.push("Internal app.mjs must not be copied into the public build.");

  for (const marker of [":focus-visible", "prefers-reduced-motion"]) {
    if (!exactCss.includes(marker)) errors.push(`Base public CSS must include ${marker}.`);
  }
  for (const marker of ["@media", ".mpWorkspaceGate", ".mpProtocolCard", ".mpStateGrid"]) {
    if (!trustCss.includes(marker)) errors.push(`Public trust CSS must include ${marker}.`);
  }
  for (const marker of [":focus-visible", "@media", ".gateList", ".boundaryGrid", ".rubricGrid"]) {
    if (!researchCss.includes(marker)) errors.push(`Research protocol CSS must include ${marker}.`);
  }

  if (researchHtml.includes("Metaphilosophy’s expert-rated corpus")) errors.push("Research protocol must not imply that Metaphilosophy already has an expert-rated corpus.");
  if (argumentHtml.includes("Metaphilosophy’s expert-rated corpus")) errors.push("Synthetic library must not imply that Metaphilosophy already has an expert-rated corpus.");

  return {
    status: errors.length ? "fail" : "pass",
    checks: {
      truthful_homepage: REQUIRED_HOME_MARKERS.every((marker) => homeModule.includes(marker)),
      public_protocol_present: REQUIRED_RESEARCH_MARKERS.every((marker) => researchHtml.includes(marker)),
      workspace_route_gated: REQUIRED_GATE_MARKERS.every((marker) => gateModule.includes(marker)),
      internal_workspace_preserved_and_excluded:
        Buffer.byteLength(appModule, "utf8") >= 100_000 &&
        REQUIRED_INTERNAL_WORKSPACE_MARKERS.every((marker) => appModule.includes(marker)) &&
        !buildScript.includes('"app.mjs"'),
      reviewer_intake_closed: reviewerClosedHtml.includes("Reviewer intake is intentionally closed"),
      synthetic_release_boundary_visible: argumentHtml.includes("None has been expert-rated by Metaphilosophy"),
      research_in_static_build: buildScript.includes('resolve(root, "research")'),
      responsive_and_keyboard_styles_present:
        exactCss.includes(":focus-visible") &&
        exactCss.includes("prefers-reduced-motion") &&
        trustCss.includes("@media") &&
        researchCss.includes(":focus-visible"),
    },
    outreach_authorized: false,
    production_ready: false,
    errors,
  };
}

export async function readAndValidatePreOutreachPublicSite(root) {
  const resolvedRoot = resolve(root);
  const read = (path) => readFile(resolve(resolvedRoot, path), "utf8");
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
  return validatePreOutreachPublicSite({
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
  });
}

function requireMarkers(errors, name, text, markers) {
  for (const marker of markers) if (!text.includes(marker)) errors.push(`${name} must include ${marker}.`);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help")) {
    console.log("Usage: node scripts/verify-pre-outreach-public-site.mjs [repository-root]");
    console.log("Validates public claims, gated workspace routes, evidence boundaries, closed intake, and static-build allowlisting. Passing never authorizes outreach or production promotion.");
  } else {
    const root = process.argv[2] ?? resolve(import.meta.dirname, "..");
    const report = await readAndValidatePreOutreachPublicSite(root);
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== "pass") process.exitCode = 1;
  }
}
