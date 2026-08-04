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

test("accepts the Q-006A-approved but still non-binding methodology recommendation", async () => {
  const report = validatePilotMethodologyRecommendations(await loadRecommendations());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.slots, 12);
  assert.equal(report.unique_pairs, 12);
  assert.deepEqual(report.preferred_source_mix, {
    public_synthetic_with_new_expert_ratings: 6,
    protected_public_domain_derived: 6,
  });
  assert.equal(report.shared_calibration_critiques, 8);
  assert.equal(report.q006a_consultation_and_screening_approved, true);
  assert.equal(report.q006b_methodology_freeze_approved, false);
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

test("rejects silently binding Q-006A, authorizing outreach, or freezing Q-006B", async () => {
  const recommendations = await loadRecommendations();
  recommendations.status = "approved";
  recommendations.governance.binding_effect = true;
  recommendations.governance.no_outreach_authorization = false;
  recommendations.governance.q006b_methodology_freeze_approved = true;
  const report = validatePilotMethodologyRecommendations(recommendations);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("non-binding Q-006B boundary")));
  assert.ok(report.errors.some((error) => error.includes("binding_effect")));
  assert.ok(report.errors.some((error) => error.includes("must not authorize outreach")));
  assert.ok(report.errors.some((error) => error.includes("Q-006B methodology freeze")));
});

test("rejects erasing or falsifying the recorded Q-006A approval", async () => {
  const recommendations = await loadRecommendations();
  recommendations.governance.q006a_consultation_and_screening_approved = false;
  recommendations.governance.q006a_approved_at = "2026-08-02T00:00:00Z";
  recommendations.governance.q006a_approval_record = "wrong.md";
  recommendations.governance.consultation_packet_preparation_authorized = false;
  const report = validatePilotMethodologyRecommendations(recommendations);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("Q-006A consultation")));
  assert.ok(report.errors.some((error) => error.includes("approval timestamp")));
  assert.ok(report.errors.some((error) => error.includes("recorded owner approval")));
  assert.ok(report.errors.some((error) => error.includes("consultation_packet_preparation_authorized")));
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
