import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  PILOT_ENDPOINT_CONTRACT_PATH,
  PILOT_ENDPOINT_DOCUMENT_PATH,
  readAndValidatePilotEndpointDesign,
  validatePilotEndpointDesign,
} from "../scripts/verify-pilot-endpoint-design-amendment.mjs";

const root = resolve(import.meta.dirname, "..");

async function loadApprovedDesign() {
  const [contractText, document] = await Promise.all([
    readFile(resolve(root, PILOT_ENDPOINT_CONTRACT_PATH), "utf8"),
    readFile(resolve(root, PILOT_ENDPOINT_DOCUMENT_PATH), "utf8"),
  ]);
  return { contract: JSON.parse(contractText), document };
}

test("accepts the owner-approved pilot endpoint amendment", async () => {
  const report = await readAndValidatePilotEndpointDesign(root);
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.contract_id, "mp-pilot-endpoint-design-amendment-v1");
  assert.equal(report.d1_selected_option, "B");
  assert.equal(report.d2_selected_option, "A");
  assert.equal(report.primary_endpoint_count, 3);
});

test("rejects replacing D1 option B with full or absent self-checking", async () => {
  const design = await loadApprovedDesign();
  design.contract.owner_decisions.D1_blind_self_check_scope.selected_option = "A";
  design.contract.owner_decisions.D1_blind_self_check_scope.self_check_records = 96;
  const report = validatePilotEndpointDesign(design);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("D1 must remain option B")));
  assert.ok(report.errors.some((error) => error.includes("self_check_records=24")));
});

test("rejects triggered-only or partial interpretation-cause coding", async () => {
  const design = await loadApprovedDesign();
  design.contract.owner_decisions.D2_interpretation_cause_coding_coverage.selected_option = "C";
  design.contract.owner_decisions.D2_interpretation_cause_coding_coverage.all_pairs_dual_coded = false;
  design.contract.primary_endpoints.find((endpoint) => endpoint.id === "P2_interpretation_linkage").coding_coverage = "triggered_only";
  const report = validatePilotEndpointDesign(design);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("D2 must remain option A")));
  assert.ok(report.errors.some((error) => error.includes("all 48 pairs")));
});

test("rejects revealing numeric gaps before dual cause codes lock", async () => {
  const design = await loadApprovedDesign();
  design.contract.owner_decisions.D2_interpretation_cause_coding_coverage.numeric_scores_and_gaps_hidden_until_both_initial_codes_lock = false;
  const report = validatePilotEndpointDesign(design);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("numeric_scores_and_gaps_hidden_until_both_initial_codes_lock")));
});

test("rejects changing position-first aggregation or treating critique pairs as independent", async () => {
  const design = await loadApprovedDesign();
  design.contract.study_geometry.primary_aggregation_unit = "critique";
  design.contract.study_geometry.critique_units_are_independent_top_level_observations = true;
  const report = validatePilotEndpointDesign(design);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("Position must remain the primary aggregation unit")));
  assert.ok(report.errors.some((error) => error.includes("Critique units must not be treated as independent")));
});

test("rejects turning the endpoint approval into research, payment, merge, or deployment authorization", async () => {
  const design = await loadApprovedDesign();
  design.contract.authorization.authorizes_research_start = true;
  design.contract.authorization.authorizes_payment = true;
  design.contract.authorization.authorizes_merge = true;
  design.contract.authorization.authorizes_deployment = true;
  const report = validatePilotEndpointDesign(design);
  assert.equal(report.status, "fail");
  for (const key of ["authorizes_research_start", "authorizes_payment", "authorizes_merge", "authorizes_deployment"]) {
    assert.ok(report.errors.some((error) => error.includes(key)), `missing rejection for ${key}`);
  }
});

test("rejects a scientific pass threshold, reliability weighting, or primary model result", async () => {
  const design = await loadApprovedDesign();
  design.contract.decision_rules.scientific_numerical_pass_fail_threshold = 0.75;
  design.contract.secondary_endpoints.find((endpoint) => endpoint.id === "S4_composition_and_aggregation_sensitivity").reliability_weighting = true;
  design.contract.model_evaluation.headline_or_primary = true;
  const report = validatePilotEndpointDesign(design);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("scientific numerical pass/fail threshold")));
  assert.ok(report.errors.some((error) => error.includes("reliability weights")));
  assert.ok(report.errors.some((error) => error.includes("headline or primary")));
});
