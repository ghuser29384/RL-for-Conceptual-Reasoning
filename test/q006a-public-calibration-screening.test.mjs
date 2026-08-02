import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  readAndValidateQ006aPublicCalibrationScreening,
  validateQ006aPublicCalibrationScreening,
} from "../scripts/verify-q006a-public-calibration-screening.mjs";

const root = resolve(import.meta.dirname, "..");
const screeningPath = resolve(
  root,
  "ops/next-steps-2026-07-23/q-006a-public-calibration-screening.json",
);

async function loadScreening() {
  return JSON.parse(await readFile(screeningPath, "utf8"));
}

test("accepts the public LMCA screening while selecting and authorizing nothing", async () => {
  const report = await readAndValidateQ006aPublicCalibrationScreening(screeningPath);
  assert.deepEqual(report, {
    status: "pass",
    screening_id: "q006a-public-calibration-screening-v1-2026-08-01",
    public_examples_reviewed: 5,
    selected_for_calibration: 0,
    selected_for_production: 0,
    link_only_examples: 5,
    uncovered_issue_types: 5,
    contact_authorized: false,
    calibration_work_authorized: false,
    errors: [],
  });
});

test("rejects selecting an exposed LMCA row or freezing calibration through screening", async () => {
  const screening = await loadScreening();
  screening.screening_scope.selected_for_metaphilosophy_calibration = 1;
  screening.screening_conclusion.selected_materials_sha256 = "a".repeat(64);
  screening.screening_conclusion.qualification_rule = "silent-threshold";

  const report = validateQ006aPublicCalibrationScreening(screening);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("No exposed LMCA example")));
  assert.ok(report.errors.some((error) => error.includes("No calibration hash")));
});

test("rejects copied item text, copied ratings, or widened permitted use", async () => {
  const screening = await loadScreening();
  screening.candidates[0].position_text = "copied source text";
  screening.candidates[0].human_rating_values = [1, 0, 1];
  screening.candidates[0].permitted_use = "participant_calibration";

  const report = validateQ006aPublicCalibrationScreening(screening);
  assert.equal(report.status, "fail");
  assert.ok(report.errors.some((error) => error.includes("may be used only")));
  assert.ok(report.errors.some((error) => error.includes("position_text")));
  assert.ok(report.errors.some((error) => error.includes("human_rating_values")));
});

test("rejects silent outreach, calibration work, manifest freeze, production selection, or Phase 2", async () => {
  const screening = await loadScreening();
  for (const field of [
    "no_contact_or_sending_authorized",
    "no_calibration_work_authorized",
    "no_protected_manifest_freeze_authorized",
    "no_production_item_selection_authorized",
    "no_phase_2_authorized",
  ]) {
    screening.screening_conclusion[field] = false;
  }

  const report = validateQ006aPublicCalibrationScreening(screening);
  assert.equal(report.status, "fail");
  for (const field of Object.keys(screening.screening_conclusion).filter((key) => key.startsWith("no_"))) {
    assert.ok(report.errors.some((error) => error.includes(field)), `${field} must fail closed`);
  }
});
