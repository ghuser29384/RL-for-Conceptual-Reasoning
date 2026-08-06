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
  assert.equal(report.files_checked, 6);
  assert.ok(report.author_mentions >= 5);
  assert.deepEqual(report.excluded_phrase_findings, []);
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
