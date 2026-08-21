import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  PUBLIC_EDITORIAL_FILES,
  readAndValidatePublicEditorialVoice,
  validatePublicEditorialVoice,
} from "../scripts/verify-public-editorial-voice.mjs";

const root = resolve(import.meta.dirname, "..");

async function loadFiles() {
  return Object.fromEntries(
    await Promise.all(
      PUBLIC_EDITORIAL_FILES.map(async (path) => [path, await readFile(resolve(root, path), "utf8")]),
    ),
  );
}

test("accepts the named, plain-language public editorial voice", async () => {
  const report = await readAndValidatePublicEditorialVoice(root);
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.files_checked, 7);
  assert.ok(report.author_mentions >= 5);
  assert.deepEqual(report.excluded_phrase_findings, []);
  assert.deepEqual(report.lmca_attribution_findings, []);
  assert.deepEqual(report.study_status_findings, []);
  assert.equal(report.legacy_home_single_sourced, true);
});

test("rejects generic AI and platform-marketing diction", async () => {
  const files = await loadFiles();
  files["src/exact-reference-home.mjs"] += " We leverage a robust evidence layer to unlock transformative impact.";
  const report = validatePublicEditorialVoice(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("evidence layer")));
  assert.ok(report.errors.some((error) => error.includes("generic marketing adjective")));
  assert.ok(report.errors.some((error) => error.includes("generic marketing verb")));
});

test("rejects generic template headings", async () => {
  const files = await loadFiles();
  files["research/index.html"] += "<h2>Why it matters</h2>";
  const report = validatePublicEditorialVoice(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("generic heading")));
});

test("rejects removal of the named human author", async () => {
  const files = await loadFiles();
  for (const path of PUBLIC_EDITORIAL_FILES) files[path] = files[path].replaceAll("Ellen Sun", "the project owner");
  const report = validatePublicEditorialVoice(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("authored marker")));
  assert.ok(report.errors.some((error) => error.includes("clear human author")));
});

test("rejects unsupported success claims", async () => {
  const files = await loadFiles();
  files["index.html"] += "<p>This project will improve AI systems.</p>";
  const report = validatePublicEditorialVoice(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("unsupported outcome claim")));
});

test("rejects relabelling LMCA as a Metaphilosophy dataset", async () => {
  const files = await loadFiles();
  files["src/exact-reference-home.mjs"] += "<p>LMCA — a Metaphilosophy dataset.</p>";
  const report = validatePublicEditorialVoice(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("LMCA misattribution")));
  assert.ok(report.lmca_attribution_findings.some((finding) => finding.path === "src/exact-reference-home.mjs"));
});

test("rejects claims that Metaphilosophy has already collected research ratings", async () => {
  const files = await loadFiles();
  files["reviewers/closed.html"] += "<p>Metaphilosophy has collected research ratings.</p>";
  const report = validatePublicEditorialVoice(files);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("false Metaphilosophy study-status claim")));
  assert.ok(report.study_status_findings.some((finding) => finding.path === "reviewers/closed.html"));
});

test("rejects a second, stale implementation of the public homepage", async () => {
  const files = await loadFiles();
  files["src/public-home.mjs"] += "\nexport function staleHomepage() { return `Teaching AI to do philosophy.`; }\n";
  const report = validatePublicEditorialVoice(files);
  assert.equal(report.status, "fail");
  assert.equal(report.legacy_home_single_sourced, false);
  assert.ok(report.errors.some((error) => error.includes("one source of truth")));
});
