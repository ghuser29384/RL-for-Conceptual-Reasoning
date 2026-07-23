import assert from "node:assert/strict";
import test from "node:test";

import { recruitmentIntakeOpen } from "../api/reviewer-recruitment.mjs";

test("reviewer intake is closed by default", () => {
  assert.equal(recruitmentIntakeOpen({}), false);
});

test("reviewer intake requires an explicit true environment flag", () => {
  assert.equal(recruitmentIntakeOpen({ RECRUITMENT_INTAKE_OPEN: "true" }), true);
  assert.equal(recruitmentIntakeOpen({ RECRUITMENT_INTAKE_OPEN: "TRUE" }), true);
  assert.equal(recruitmentIntakeOpen({ RECRUITMENT_INTAKE_OPEN: "1" }), false);
  assert.equal(recruitmentIntakeOpen({ RECRUITMENT_INTAKE_OPEN: "false" }), false);
});
