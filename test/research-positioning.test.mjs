import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  RESEARCH_POSITIONING_CONTRACT_PATH,
  RESEARCH_POSITIONING_DOCUMENT_PATH,
  readAndValidateResearchPositioning,
  validateResearchPositioning,
} from "../scripts/verify-research-positioning.mjs";

const root = resolve(import.meta.dirname, "..");

async function loadPositioning() {
  const [contractText, document] = await Promise.all([
    readFile(resolve(root, RESEARCH_POSITIONING_CONTRACT_PATH), "utf8"),
    readFile(resolve(root, RESEARCH_POSITIONING_DOCUMENT_PATH), "utf8"),
  ]);
  return { contract: JSON.parse(contractText), document };
}

test("accepts the approved auditable expert-judgment positioning", async () => {
  const report = await readAndValidateResearchPositioning(root);
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.contract_id, "mp-research-positioning-v1");
  assert.equal(report.research_question_count, 5);
  assert.equal(report.ordered_output_count, 3);
});

test("rejects making a model leaderboard the primary direction", async () => {
  const positioning = await loadPositioning();
  positioning.contract.primary_positioning = "Metaphilosophy is a model leaderboard for conceptual reasoning.";
  const report = validateResearchPositioning(positioning);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("leaderboard cannot become the primary")));
});

test("rejects using the strategy approval as research authorization", async () => {
  const positioning = await loadPositioning();
  positioning.contract.authorization.authorizes_research_start = true;
  const report = validateResearchPositioning(positioning);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("authorizes_research_start")));
});

test("rejects removal of the immutable blind-initial-rating constraint", async () => {
  const positioning = await loadPositioning();
  positioning.contract.pilot_design_constraints = positioning.contract.pilot_design_constraints.filter(
    (item) => !item.includes("Blind initial ratings must remain immutable"),
  );
  const report = validateResearchPositioning(positioning);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("Blind initial ratings must remain immutable")));
});

test("rejects a positioning document that hides the leaderboard non-goal", async () => {
  const positioning = await loadPositioning();
  positioning.document = positioning.document.replace(
    "build an ordinary LMCA-style model leaderboard as its core direction",
    "build a broad evaluation product",
  );
  const report = validateResearchPositioning(positioning);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("positioning document must preserve marker")));
});
