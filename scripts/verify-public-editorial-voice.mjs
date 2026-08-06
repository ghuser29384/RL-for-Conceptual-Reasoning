import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const PUBLIC_EDITORIAL_FILES = Object.freeze([
  "index.html",
  "src/exact-reference-home.mjs",
  "research/index.html",
  "arguments/index.html",
  "reviewers/closed.html",
  "src/workspace-gate.mjs",
]);

const FORBIDDEN_PATTERNS = Object.freeze([
  [/\bevidence layer\b/giu, "evidence layer"],
  [/\bartifact classes?\b/giu, "artifact class"],
  [/\btruth before scale\b/giu, "truth before scale"],
  [/\bfail(?:s|ed|ing)? closed\b/giu, "fail closed"],
  [/\bwhat exists[—-]and what does not\b/giu, "what exists—and what does not"],
  [/\bpre-outreach quality gate\b/giu, "pre-outreach quality gate"],
  [/\bcurrent operating status\b/giu, "current operating status"],
  [/\bone gate passed\b/giu, "one gate passed"],
  [/\bfive remain blocked\b/giu, "five remain blocked"],
  [/\bhuman judgment infrastructure\b/giu, "human judgment infrastructure"],
  [/\b(?:robust|seamless|transformative|cutting-edge|revolutionary)\b/giu, "generic marketing adjective"],
  [/\b(?:leverage|unlock|empower|foster)\b/giu, "generic marketing verb"],
  [/\bnavigat(?:e|ing) the complexities\b/giu, "navigate the complexities"],
  [/\bin today[’']s rapidly changing landscape\b/giu, "in today's rapidly changing landscape"],
]);

const GENERIC_HEADINGS = Object.freeze([
  "How it works",
  "Why it matters",
  "What happens next",
  "Our approach",
  "The future of philosophy",
  "Built for trust",
]);

const REQUIRED_AUTHORED_MARKERS = Object.freeze({
  "index.html": ["A research project by Ellen Sun"],
  "src/exact-reference-home.mjs": [
    "Metaphilosophy is a research project by Ellen Sun",
    "Philosophers can disagree and still judge arguments.",
  ],
  "research/index.html": [
    "Written and maintained by Ellen Sun",
    "revised 6 August 2026",
  ],
  "arguments/index.html": ["published by Ellen Sun for inspection"],
  "reviewers/closed.html": ["Metaphilosophy is a research project by Ellen Sun"],
  "src/workspace-gate.mjs": ["The research workspace is closed."],
});

export function validatePublicEditorialVoice(files) {
  const errors = [];
  const findings = [];
  const normalizedFiles = Object.fromEntries(
    PUBLIC_EDITORIAL_FILES.map((path) => [path, String(files?.[path] ?? "")]),
  );

  for (const path of PUBLIC_EDITORIAL_FILES) {
    const text = normalizedFiles[path];
    if (!text.trim()) {
      errors.push(`${path} is missing or empty.`);
      continue;
    }

    for (const marker of REQUIRED_AUTHORED_MARKERS[path] ?? []) {
      if (!text.includes(marker)) errors.push(`${path} must contain authored marker: ${marker}.`);
    }

    for (const [pattern, label] of FORBIDDEN_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = [...text.matchAll(pattern)];
      if (matches.length) {
        findings.push({ path, label, count: matches.length });
        errors.push(`${path} contains excluded public-copy phrase (${label}).`);
      }
    }

    for (const heading of GENERIC_HEADINGS) {
      const headingPattern = new RegExp(`<h[1-3][^>]*>\\s*${escapeRegExp(heading)}\\s*</h[1-3]>`, "iu");
      if (headingPattern.test(text)) errors.push(`${path} uses generic heading: ${heading}.`);
    }
  }

  const publicCopy = Object.values(normalizedFiles).join("\n");
  const authorMentions = (publicCopy.match(/Ellen Sun/gu) ?? []).length;
  if (authorMentions < 5) errors.push("Public surfaces must identify Ellen Sun often enough to establish a clear human author and owner.");

  const inflatedClaims = [
    /\bwill improve AI(?: systems)?\b/iu,
    /\bwill make AI better\b/iu,
    /\bthe benefits? (?:will|would) be astronomical\b/iu,
    /\bsettle philosophy\b/iu,
    /\bobjective philosophical ground truth\b/iu,
  ];
  for (const pattern of inflatedClaims) {
    if (pattern.test(publicCopy)) errors.push(`Public copy contains an unsupported outcome claim: ${pattern}.`);
  }

  return {
    status: errors.length ? "fail" : "pass",
    files_checked: PUBLIC_EDITORIAL_FILES.length,
    author_mentions: authorMentions,
    excluded_phrase_findings: findings,
    errors,
  };
}

export async function readAndValidatePublicEditorialVoice(root = resolve(import.meta.dirname, "..")) {
  const entries = await Promise.all(
    PUBLIC_EDITORIAL_FILES.map(async (path) => [path, await readFile(resolve(root, path), "utf8")]),
  );
  return validatePublicEditorialVoice(Object.fromEntries(entries));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await readAndValidatePublicEditorialVoice();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
