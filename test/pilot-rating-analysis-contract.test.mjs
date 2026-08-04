import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { validatePilotRatingAnalysisContract } from "../scripts/verify-pilot-rating-analysis-contract.mjs";

const contractPath = resolve(import.meta.dirname, "../ops/next-steps-2026-07-23/pilot-rating-analysis-contract.json");

async function loadContract() {
  return JSON.parse(await readFile(contractPath, "utf8"));
}

test("accepts the source-faithful, non-binding analysis contract", async () => {
  const report = validatePilotRatingAnalysisContract(await loadContract());
  assert.equal(report.status, "pass", report.errors.join("\n"));
  assert.equal(report.numeric_thresholds_binding, false);
  assert.equal(report.contains_rating_data, false);
});

test("rejects drift in LMCA custom-loss weights or low-clarity branch", async () => {
  const contract = await loadContract();
  contract.source_basis.source_derived_rules.low_clarity_custom_loss_branch.reference_clarity_below = 0.4;
  contract.source_basis.source_derived_rules.ordinary_custom_loss_branch.weights.overall_absolute_difference = 0.4;
  const report = validatePilotRatingAnalysisContract(contract);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("below 0.5")));
  assert.ok(report.errors.some((error) => error.includes("ordinary custom-loss weights")));
});

test("rejects binding thresholds or execution authorization", async () => {
  const contract = await loadContract();
  contract.threshold_governance.numeric_adjudication_thresholds_binding = true;
  contract.authorization_boundary.authorizes_item_screening = true;
  contract.authorization_boundary.authorizes_phase_2 = true;
  const report = validatePilotRatingAnalysisContract(contract);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("numeric_adjudication_thresholds_binding")));
  assert.ok(report.errors.some((error) => error.includes("authorizes_item_screening")));
  assert.ok(report.errors.some((error) => error.includes("authorizes_phase_2")));
});

test("rejects claims that the public contract contains protected or participant data", async () => {
  const contract = await loadContract();
  contract.privacy_and_exposure.contract_contains_rating_records = true;
  contract.privacy_and_exposure.contract_contains_participant_names_or_email_addresses = true;
  contract.ratings = [{ rating_id: "not-allowed" }];
  const report = validatePilotRatingAnalysisContract(contract);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("contract_contains_rating_records")));
  assert.ok(report.errors.some((error) => error.includes("contract_contains_participant_names_or_email_addresses")));
  assert.ok(report.errors.some((error) => error.includes("top-level ratings")));
});
