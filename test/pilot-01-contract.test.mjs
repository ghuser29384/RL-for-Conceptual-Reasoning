import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { validatePilot01 } from "../scripts/verify-pilot-01.mjs";

const root = resolve(import.meta.dirname, "..");

async function loadFixture() {
  const [contract, items, expansionGate, pageHtml, buildScript, vercel, evDraft, ltffDraft] = await Promise.all([
    readJson("ops/pilot-01/pilot-contract.json"),
    readJson("ops/pilot-01/pilot-items-public.json"),
    readJson("ops/pilot-01/full-hard-set-expansion-gate.json"),
    readFile(resolve(root, "pilot-raters/index.html"), "utf8"),
    readFile(resolve(root, "scripts/build-static.mjs"), "utf8"),
    readJson("vercel.json"),
    readFile(resolve(root, "funding/emergent-ventures-pilot-evidence-draft.md"), "utf8"),
    readFile(resolve(root, "funding/ltff-pilot-evidence-draft.md"), "utf8"),
  ]);
  return {
    contract,
    items,
    expansionGate,
    pageHtml,
    buildScript,
    vercel,
    fundingDrafts: { emergentVentures: evDraft, ltff: ltffDraft },
  };
}

test("accepts the approved 12-position, 48-critique Pilot 01 contract", async () => {
  const report = validatePilot01(await loadFixture());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.deepEqual(
    {
      positions: report.positions,
      critiques: report.critiques,
      ratings: report.required_initial_ratings,
    },
    { positions: 12, critiques: 48, ratings: 96 },
  );
});

test("rejects item-count drift or hidden-benchmark claims", async () => {
  const fixture = await loadFixture();
  fixture.contract.items.critiques = 52;
  fixture.items.future_hidden_test_eligibility = true;
  const report = validatePilot01(fixture);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("48 critiques")));
  assert.ok(report.errors.some((error) => error.includes("hidden-test")));
});

test("rejects bulk requests to senior advisers and premature full-set expansion", async () => {
  const fixture = await loadFixture();
  fixture.contract.senior_methodological_advisers.bulk_annotation_request_prohibited = false;
  fixture.expansionGate.current_status = "approved_to_launch";
  const report = validatePilot01(fixture);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("bulk-annotation")));
  assert.ok(report.errors.some((error) => error.includes("Full Hard Set")));
});

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
}
