import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const contract = JSON.parse(
  await readFile(resolve(root, "ops/next-steps-2026-07-23/release-contract.json"), "utf8"),
);
const origin = String(process.env.METAPHILOSOPHY_ORIGIN ?? contract.production.origin).replace(/\/$/, "");
const synthetic = contract.artifact_classes.synthetic_unrated;

const [manifestResponse, libraryResponse, positionsResponse, critiquesResponse, intakeResponse] = await Promise.all([
  fetchOk(`${origin}${synthetic.manifest_path}`),
  fetchOk(`${origin}${synthetic.library_path}`),
  fetchOk(`${origin}/arguments/data/positions.json`),
  fetchOk(`${origin}/arguments/data/critiques.json`),
  fetchOk(`${origin}/contribute`),
]);

const [manifestText, libraryHtml, positionsText, critiquesText, intakeHtml] = await Promise.all([
  manifestResponse.text(),
  libraryResponse.text(),
  positionsResponse.text(),
  critiquesResponse.text(),
  intakeResponse.text(),
]);
const manifest = JSON.parse(manifestText);
const positions = JSON.parse(positionsText);
const critiques = JSON.parse(critiquesText);

assert.equal(manifest.release_id, synthetic.release_id);
for (const key of ["records", "positions", "critiques", "critiques_per_position", "domains", "source_chunks", "source_sha256"]) {
  assert.deepEqual(manifest[key], synthetic.expected[key], `manifest mismatch: ${key}`);
}
assert.deepEqual(manifest.files, synthetic.expected.files);
assert.match(libraryHtml, new RegExp(escapeRegExp(synthetic.required_public_boundary_text)));
for (const forbidden of synthetic.forbidden_claims) assert.doesNotMatch(libraryHtml, new RegExp(escapeRegExp(forbidden), "i"));

assert.equal(byteLength(positionsText), synthetic.expected.files["positions.json"].bytes);
assert.equal(byteLength(critiquesText), synthetic.expected.files["critiques.json"].bytes);
assert.equal(sha256(positionsText), synthetic.expected.files["positions.json"].sha256);
assert.equal(sha256(critiquesText), synthetic.expected.files["critiques.json"].sha256);

assert.equal(positions.length, synthetic.expected.positions);
assert.equal(critiques.length, synthetic.expected.critiques);
assert.equal(new Set(positions.map((item) => item.position_id)).size, positions.length);
assert.equal(new Set(critiques.map((item) => item.critique_id)).size, critiques.length);
assert.equal(new Set(positions.map((item) => item.domain)).size, synthetic.expected.domains);

const counts = new Map();
for (const critique of critiques) counts.set(critique.position_id, (counts.get(critique.position_id) ?? 0) + 1);
assert.equal(counts.size, positions.length);
for (const position of positions) assert.equal(counts.get(position.position_id), synthetic.expected.critiques_per_position);

assert.match(intakeHtml, /The July 2026 intake window has closed\./);
assert.doesNotMatch(intakeHtml, /Submit calibration/);

console.log(
  JSON.stringify(
    {
      status: "pass",
      origin,
      releaseId: manifest.release_id,
      positions: positions.length,
      critiques: critiques.length,
      domains: new Set(positions.map((item) => item.domain)).size,
      auditedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function byteLength(text) {
  return Buffer.byteLength(text, "utf8");
}

async function fetchOk(url) {
  const response = await fetch(url, { headers: { "user-agent": "metaphilosophy-release-audit/1" } });
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
