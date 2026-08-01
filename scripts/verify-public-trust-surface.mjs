import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const HOME_FORBIDDEN = Object.freeze([
  "/contribute",
  "?section=rating",
  "Become a reviewer",
  "Open workspace",
  "Illustrative expert mean",
  "Critique C-1278",
]);
const ARGUMENT_LIBRARY_FORBIDDEN = Object.freeze([
  "?section=rating",
  ">Workspace<",
  "Human-rated philosophical reasoning for AI.",
]);
const INTERNAL_MARKERS = Object.freeze([
  "workflowEvidenceCollections",
  "sourceLeakageRedactionPolicy",
  "releaseReportReadbackItems",
]);
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu;

export function validatePublicTrustSurface(files) {
  const errors = [];
  const index = String(files?.index ?? "");
  const siteEntry = String(files?.siteEntry ?? "");
  const home = String(files?.home ?? "");
  const baseCss = String(files?.baseCss ?? "");
  const homeCss = String(files?.homeCss ?? "");
  const gate = String(files?.gate ?? "");
  const internalWorkspace = String(files?.internalWorkspace ?? "");
  const research = String(files?.research ?? "");
  const researchCss = String(files?.researchCss ?? "");
  const argumentsPage = String(files?.argumentsPage ?? "");
  const reviewersPage = String(files?.reviewersPage ?? "");
  const buildScript = String(files?.buildScript ?? "");
  const vercel = objectOrEmpty(files?.vercel);

  requirePhrases(index, [
    "Metaphilosophy is preparing an auditable human-expert pilot",
    "https://www.metaphilosophy.org/",
    "/src/trust-home.css?v=1",
    "Expert ratings have not started",
  ], "index.html", errors);

  requirePhrases(siteEntry, [
    "const isRootSurface",
    "const isWorkspaceGateSurface",
    "legacySectionTargets",
    "normalizeLegacyRootRoute",
    'await import("./exact-reference-home.mjs")',
    'await import("./workspace-gate.mjs")',
    "root.innerHTML = publicHomePage()",
    "bindPublicHomeEvents()",
    'window.location.replace("/")',
  ], "site-entry public route separation", errors);
  if (siteEntry.includes('import("./app.mjs")')) {
    errors.push("Public site entry must not import the internal research workspace.");
  }

  requirePhrases(home, [
    "Pilot in preparation · expert ratings have not started",
    "No Metaphilosophy expert ratings claimed yet",
    "1,000 public synthetic critiques",
    "48-critique expert pilot planned",
    "External prior work",
    "does not present those ratings as its own",
    "Reviewer intake and adviser outreach remain closed",
    "/research/",
    "/arguments/",
  ], "public homepage", errors);
  for (const forbidden of HOME_FORBIDDEN) {
    if (home.includes(forbidden)) errors.push(`Public homepage must not contain ${forbidden}.`);
  }

  requirePhrases(baseCss, [".mpHome :focus-visible", "@media (prefers-reduced-motion: reduce)"], "exact-reference.css", errors);
  requirePhrases(homeCss, [
    ".mpProtocolCard",
    ".mpStateGrid",
    ".mpBoundaryNote",
    ".mpWorkspaceGate",
    "@media (max-width: 760px)",
    "@media (prefers-reduced-motion: reduce)",
  ], "trust-home.css", errors);

  requirePhrases(gate, [
    "The rating workspace is gated until the pilot is ready",
    "This workspace is not publicly open",
    "has not started production expert ratings",
    "No application, assignment, rating task, deadline, payment commitment, or expert-result claim",
    "/research/",
    "/arguments/",
  ], "workspace gate", errors);
  if (gate.trim().length < 700) errors.push("Workspace gate must be substantive rather than blank or trivial.");
  for (const marker of INTERNAL_MARKERS) {
    if (gate.includes(marker)) errors.push(`Public workspace gate must not embed internal execution structure ${marker}.`);
  }

  if (Buffer.byteLength(internalWorkspace, "utf8") < 100_000) {
    errors.push("Repository must preserve the full internal research workspace source.");
  }
  requirePhrases(internalWorkspace, INTERNAL_MARKERS, "internal research workspace", errors);

  requirePhrases(research, [
    "Consultation phase · production ratings not started",
    "Ratings collected</dt><dd>0",
    "951 rated critiques",
    "1,000 unrated critiques",
    "48 critiques · 0 ratings",
    "One gate passed. Five remain blocked.",
    "Currently not authorized",
    "What this pilot cannot establish",
    "zero production expert ratings collected",
  ], "research protocol", errors);
  if (EMAIL_PATTERN.test(research)) errors.push("Public research protocol must not contain an email address.");
  requirePhrases(researchCss, [
    ".boundaryGrid",
    ".designGrid",
    ".gateList",
    ".restraint",
    "@media (max-width: 800px)",
    "@media (prefers-reduced-motion: reduce)",
  ], "research styles", errors);

  requirePhrases(argumentsPage, [
    "07 / 2026",
    "None has been expert-rated by Metaphilosophy",
    "This collection is synthetic and unrated",
    "Inclusion here is not expert endorsement",
    "/research/",
  ], "argument library", errors);
  for (const forbidden of ARGUMENT_LIBRARY_FORBIDDEN) {
    if (argumentsPage.includes(forbidden)) errors.push(`Argument library must not contain ${forbidden}.`);
  }

  requirePhrases(reviewersPage, [
    "Reviewer intake is intentionally closed",
    "The July 2026 intake window has closed",
    "No application, calibration submission, deadline, or paid assignment",
    "Nothing to submit yet",
    "zero production ratings",
    "/research/",
  ], "closed reviewer page", errors);

  requirePhrases(buildScript, [
    "const publicSrcFiles",
    '"site-entry.mjs"',
    '"workspace-gate.mjs"',
    '"exact-reference-home.mjs"',
    '"trust-home.css"',
    'resolve(root, "src/assets")',
    'resolve(root, "research")',
  ], "static build allowlist", errors);
  if (/cp\(resolve\(root, "src"\), resolve\(dist, "src"\), \{ recursive: true \}\)/u.test(buildScript)) {
    errors.push("Static build must not copy the entire internal src directory.");
  }
  if (buildScript.includes('"app.mjs"')) errors.push("Internal app.mjs must not appear in the public build allowlist.");

  const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : [];
  for (const source of ["/research", "/research/"]) expectRewrite(rewrites, source, "/research/index.html", errors);
  for (const source of ["/workspace", "/workspace/", "/reference", "/reference/"]) expectRewrite(rewrites, source, "/index.html", errors);
  for (const source of ["/contribute", "/contribute/", "/reviewers", "/reviewers/"]) expectRewrite(rewrites, source, "/reviewers/closed.html", errors);

  const headerEntries = (Array.isArray(vercel.headers) ? vercel.headers : [])
    .flatMap((entry) => (Array.isArray(entry?.headers) ? entry.headers : []));
  const headerMap = new Map(headerEntries.map((entry) => [entry?.key, entry?.value]));
  for (const [key, expected] of [
    ["X-Content-Type-Options", "nosniff"],
    ["X-Frame-Options", "DENY"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
  ]) {
    if (headerMap.get(key) !== expected) errors.push(`Vercel header ${key} must equal ${expected}.`);
  }

  const publicText = [index, home, gate, research, argumentsPage, reviewersPage].join("\n");
  for (const prohibitedClaim of [
    "Metaphilosophy has 951 rated critiques",
    "Metaphilosophy has collected 1,458 expert ratings",
    "the pilot has started",
    "recruitment is open",
  ]) {
    if (publicText.toLowerCase().includes(prohibitedClaim.toLowerCase())) errors.push(`Public surfaces contain prohibited claim: ${prohibitedClaim}.`);
  }

  return {
    status: errors.length ? "fail" : "pass",
    public_home_recruitment_cta_removed: !HOME_FORBIDDEN.some((value) => home.includes(value)),
    public_workspace_gate_verified:
      siteEntry.includes('import("./workspace-gate.mjs")') && gate.includes("workspace is gated"),
    internal_workspace_preserved:
      Buffer.byteLength(internalWorkspace, "utf8") >= 100_000 && INTERNAL_MARKERS.every((marker) => internalWorkspace.includes(marker)),
    internal_workspace_excluded_from_public_build:
      buildScript.includes("const publicSrcFiles") && !buildScript.includes('"app.mjs"'),
    research_protocol_published: research.includes("48-critique pilot"),
    synthetic_release_marked_unrated: argumentsPage.includes("synthetic and unrated"),
    reviewer_intake_closed: reviewersPage.includes("intake is intentionally closed"),
    security_headers_present: headerMap.size >= 4,
    errors,
  };
}

export async function readAndValidatePublicTrustSurface(root = resolve(import.meta.dirname, "..")) {
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
  return validatePublicTrustSurface({
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
  });
}

function requirePhrases(text, phrases, label, errors) {
  for (const phrase of phrases) if (!text.includes(phrase)) errors.push(`${label} must contain ${phrase}.`);
}

function expectRewrite(rewrites, source, destination, errors) {
  const rewrite = rewrites.find((entry) => entry?.source === source);
  if (rewrite?.destination !== destination) errors.push(`Vercel must route ${source} to ${destination}.`);
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await readAndValidatePublicTrustSurface();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
