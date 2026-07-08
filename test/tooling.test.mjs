import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const detectScript = "scripts/detect_latest_version.py";

function runDetector(args) {
  return execFileSync("python3", [detectScript, ...args], { encoding: "utf8" });
}

test("latest RLHF version detector finds the current repo spec", () => {
  const version = Number(runDetector(["--plain", "."]).trim());
  assert.ok(version >= 93);
});

test("latest RLHF version detector handles recursive URL-encoded filenames", () => {
  const root = mkdtempSync(join(tmpdir(), "rlhf-version-detect-"));
  const nested = join(root, "nested");
  mkdirSync(nested);
  writeFileSync(join(root, "RLHF Conceptual Reasoning91.md"), "v91\n");
  writeFileSync(join(nested, "RLHF%20Conceptual%20Reasoning94.md"), "v94\n");
  writeFileSync(join(nested, "not-the-spec.md"), "ignore\n");

  const result = JSON.parse(runDetector(["--recursive", root]));
  assert.equal(result.found, true);
  assert.equal(result.version, 94);
  assert.equal(result.filename, "RLHF%20Conceptual%20Reasoning94.md");
  assert.equal(result.next_version, 95);
  assert.equal(result.next_filename, "RLHF Conceptual Reasoning95.md");
  assert.equal(result.matches.length, 2);
});
