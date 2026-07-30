import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { validatePilotMethodologyRecommendations } from "../scripts/verify-pilot-methodology-recommendations.mjs";

const recommendationPath = resolve(
  import.meta.dirname,
  "../ops/next-steps-2026-07-23/pilot-methodology-recommendations.json",
);

async function loadRecommendations() {
  return JSON.parse(await readFile(recommendationPath, "utf8"));
}

test("accepts the balanced non-binding methodology recommendation", async () => {
  const report = validatePilotMethodologyRecommendations(await loadRecommendations());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.slots, 12);
  assert.equal(report.unique_pairs, 12);
  assert.deepEqual(report.preferred_source_mix, {
    public_synthetic_with_new_expert_ratings: 6,
    protected_public_domain_derived: 6,
  });
  assert.equal(report.shared_calibration_critiques, 8);
  assert.equal(report.binding_effect, false);
});

test("rejects a repeated rater pair and per-rater source imbalance", async () => {
  const recommendations = await loadRecommendations();
  recommendations.preferred_assignment.slots[1].rater_pair = ["R1", "R3"];
  const report = validatePilotMethodologyRecommendations(recommendations);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("pair is repeated")));
  assert.ok(report.errors.some((error) => error.includes("exactly four positions") || error.includes("exactly two")));
});

test("rejects loss of topic-source crossing", async () => {
  const recommendations = await loadRecommendations();
  recommendations.preferred_assignment.slots[1].source_class = "public_synthetic_with_new_expert_ratings";
  const report = validatePilotMethodologyRecommendations(recommendations);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("one position from each source class")));
  assert.ok(report.errors.some((error) => error.includes("exactly six position slots")));
});

test("rejects silently binding the recommendation or authorizing outreach", async () => {
  const recommendations = await loadRecommendations();
  recommendations.status = "approved";
  recommendations.governance.binding_effect = true;
  recommendations.governance.no_outreach_authorization = false;
  const report = validatePilotMethodologyRecommendations(recommendations);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("non-binding")));
  assert.ok(report.errors.some((error) => error.includes("binding_effect")));
  assert.ok(report.errors.some((error) => error.includes("must not authorize outreach")));
});

test("rejects removal of shared calibration and low-clarity review", async () => {
  const recommendations = await loadRecommendations();
  recommendations.shared_calibration.shared_calibration_critiques = 4;
  recommendations.adjudication_additions.required_item_review_candidates = [];
  recommendations.analysis_safeguards.low_clarity_branch.human_clarity_below = 0.4;
  const report = validatePilotMethodologyRecommendations(recommendations);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("eight critiques total")));
  assert.ok(report.errors.some((error) => error.includes("clarity score is below 0.5")));
  assert.ok(report.errors.some((error) => error.includes("low-clarity branch")));
});

test("rejects representing LMCA rows as directly reusable", async () => {
  const recommendations = await loadRecommendations();
  recommendations.source_basis.primary_reference.direct_row_reuse = true;
  const report = validatePilotMethodologyRecommendations(recommendations);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("Direct LMCA row reuse")));
});
