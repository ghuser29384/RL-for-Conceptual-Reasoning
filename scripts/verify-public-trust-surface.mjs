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
const LMCA_PUBLIC_PATH = "/src/assets/LMCA_dataset.pdf";
const LMCA_CANONICAL_URL = "https://arxiv.org/pdf/2607.27499";

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
    "A research project by Ellen Sun adapting the LMCA method",
    "https://www.metaphilosophy.org/",
    "/src/trust-home.css?v=1",
    "The first Metaphilosophy study has not begun",
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
  if (siteEntry.includes('import("./app.mjs")')) errors.push("Public site entry must not import the internal research workspace.");

  requirePhrases(home, [
    "Research study not yet open",
    "Philosophers can disagree and still judge arguments.",
    "Metaphilosophy is a research project by Ellen Sun",
    "1,000 synthetic critiques online",
    "48 critiques in the planned study",
    "0 research ratings collected",
    "Cooper et al.",
    "Those ratings belong to the LMCA project, not to Metaphilosophy.",
    "Research rating recruitment is closed.",
    LMCA_PUBLIC_PATH,
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
    "The research workspace is closed.",
    "Metaphilosophy is not assigning research ratings yet.",
    "two-person synthetic usability check",
    "There is no application, deadline, rating task, or research payment offer",
    "/research/",
    "/arguments/",
  ], "workspace gate", errors);
  if (gate.trim().length < 700) errors.push("Workspace gate must be substantive rather than blank or trivial.");
  for (const marker of INTERNAL_MARKERS) {
    if (gate.includes(marker)) errors.push(`Public workspace gate must not embed internal execution structure ${marker}.`);
  }

  if (Buffer.byteLength(internalWorkspace, "utf8") < 100_000) errors.push("Repository must preserve the full internal research workspace source.");
  requirePhrases(internalWorkspace, INTERNAL_MARKERS, "internal research workspace", errors);

  requirePhrases(research, [
    "Draft study plan · research ratings have not begun",
    "Written and maintained by Ellen Sun",
    "951 rated critiques",
    "1,000 synthetic critiques",
    "48 critiques · 0 ratings",
    "Seven separate judgments about each critique.",
    "The software is not the last gate.",
    "There is no open application",
    "What a twelve-position study cannot show.",
    "zero Metaphilosophy research ratings collected",
    LMCA_PUBLIC_PATH,
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
    "July 2026",
    "1,000 model-written critiques",
    "None has an expert rating.",
    "Their presence here does not mean that a philosopher has checked them",
    "/research/",
  ], "argument library", errors);
  for (const forbidden of ARGUMENT_LIBRARY_FORBIDDEN) {
    if (argumentsPage.includes(forbidden)) errors.push(`Argument library must not contain ${forbidden}.`);
  }

  requirePhrases(reviewersPage, [
    "Research rating applications are closed.",
    "The first Metaphilosophy study has not begun.",
    "There is no assignment to claim.",
    "does not accept applications, ratings, calibration work, or payment details",
    "Zero research ratings have been collected.",
    "/research/",
  ], "closed reviewer page", errors);

  requirePhrases(buildScript, [
    "const publicSrcFiles",
    '"site-entry.mjs"',
    '"workspace-gate.mjs"',
    '"exact-reference-home.mjs"',
    '"trust-home.css"',
    'resolve(root, "research")',
  ], "static build allowlist", errors);
  if (/cp\(resolve\(root, "src"\), resolve\(dist, "src"\), \{ recursive: true \}\)/u.test(buildScript)) errors.push("Static build must not copy the entire internal src directory.");
  if (buildScript.includes('"app.mjs"')) errors.push("Internal app.mjs must not appear in the public build allowlist.");
  if (/cp\(\s*resolve\(root,\s*"src\/assets"\)/u.test(buildScript)) errors.push("Public build must not depend on an untracked local LMCA asset directory.");

  const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : [];
  for (const source of ["/research", "/research/"]) expectRoute(rewrites, source, "/research/index.html", "rewrite", errors);
  for (const source of ["/workspace", "/workspace/", "/reference", "/reference/"]) expectRoute(rewrites, source, "/index.html", "rewrite", errors);
  for (const source of ["/contribute", "/contribute/", "/reviewers", "/reviewers/"]) expectRoute(rewrites, source, "/reviewers/closed.html", "rewrite", errors);

  const redirects = Array.isArray(vercel.redirects) ? vercel.redirects : [];
  const paperRedirect = redirects.find((entry) => entry?.source === LMCA_PUBLIC_PATH);
  if (paperRedirect?.destination !== LMCA_CANONICAL_URL || paperRedirect?.permanent !== false) {
    errors.push(`Vercel must temporarily redirect ${LMCA_PUBLIC_PATH} to the canonical arXiv PDF.`);
  }

  const headerEntries = (Array.isArray(vercel.headers) ? vercel.headers : []).flatMap((entry) => (Array.isArray(entry?.headers) ? entry.headers : []));
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
    "the study has started",
    "recruitment is open",
  ]) {
    if (publicText.toLowerCase().includes(prohibitedClaim.toLowerCase())) errors.push(`Public surfaces contain prohibited claim: ${prohibitedClaim}.`);
  }

  return {
    status: errors.length ? "fail" : "pass",
    public_home_recruitment_cta_removed: !HOME_FORBIDDEN.some((value) => home.includes(value)),
    public_workspace_gate_verified: siteEntry.includes('import("./workspace-gate.mjs")') && gate.includes("workspace is closed"),
    internal_workspace_preserved: Buffer.byteLength(internalWorkspace, "utf8") >= 100_000 && INTERNAL_MARKERS.every((marker) => internalWorkspace.includes(marker)),
    internal_workspace_excluded_from_public_build: buildScript.includes("const publicSrcFiles") && !buildScript.includes('"app.mjs"'),
    canonical_lmca_redirect_present: paperRedirect?.destination === LMCA_CANONICAL_URL,
    research_protocol_published: research.includes("48 critiques · 0 ratings"),
    synthetic_release_marked_unrated: argumentsPage.includes("None has an expert rating."),
    reviewer_intake_closed: reviewersPage.includes("Research rating applications are closed."),
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
  return validatePublicTrustSurface({ index, siteEntry, home, baseCss, homeCss, gate, internalWorkspace, research, researchCss, argumentsPage, reviewersPage, buildScript, vercel: JSON.parse(vercelText) });
}

function requirePhrases(text, phrases, label, errors) {
  for (const phrase of phrases) if (!text.includes(phrase)) errors.push(`${label} must contain ${phrase}.`);
}

function expectRoute(entries, source, destination, kind, errors) {
  const entry = entries.find((candidate) => candidate?.source === source);
  if (entry?.destination !== destination) errors.push(`Vercel must ${kind} ${source} to ${destination}.`);
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
