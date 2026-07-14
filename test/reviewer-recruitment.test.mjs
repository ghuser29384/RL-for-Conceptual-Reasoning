import assert from "node:assert/strict";
import test from "node:test";

import {
  CALIBRATION_ITEM_ID,
  evaluateCalibration,
  normalizeRecruitmentSubmission,
  validateRecruitmentSubmission,
} from "../src/recruitment/reviewer-recruitment.mjs";

function validPayload() {
  return {
    displayName: "Ada Reviewer",
    email: "ADA@example.org ",
    role: "faculty",
    affiliation: "Example University",
    training: "completed_doctorate",
    profileUrl: "https://example.org/ada",
    expertise: ["normative_ethics", "philosophy_of_ai"],
    availability: "2_to_5_hours",
    consent: {
      age18: true,
      expertiseAffirmation: true,
      researchUse: true,
      contact: true,
      compensationTerms: true,
      publicAttribution: false,
    },
    calibration: {
      itemId: CALIBRATION_ITEM_ID,
      scores: {
        centrality: 0.9,
        strength: 0.1,
        correctness: 0.1,
        clarity: 0.9,
        dead_weight: 0.1,
        single_issue: 0.9,
        overall: 0.1,
      },
      confidence: "high",
      rationale:
        "The critique is central and clearly expressed, but it is incorrect because the first premise already contains the normative word ought; the alleged is-ought gap is not present.",
    },
    source: { source: "connector", campaign: "july-2026", referredBy: "r-abc" },
  };
}

test("normalizes and validates a complete submission", () => {
  const submission = normalizeRecruitmentSubmission(validPayload());
  assert.equal(submission.applicant.emailNormalized, "ada@example.org");
  assert.equal(validateRecruitmentSubmission(submission).ok, true);
});

test("requires consent and all seven scores", () => {
  const payload = validPayload();
  payload.consent.researchUse = false;
  payload.calibration.scores.overall = "";
  const result = validateRecruitmentSubmission(normalizeRecruitmentSubmission(payload));
  assert.equal(result.ok, false);
  assert.equal(result.errors.researchUse.length > 0, true);
  assert.equal(result.errors.score_overall.length > 0, true);
});

test("rejects non-http profile URLs", () => {
  const payload = validPayload();
  payload.profileUrl = "javascript:alert(1)";
  const result = validateRecruitmentSubmission(normalizeRecruitmentSubmission(payload));
  assert.equal(result.ok, false);
  assert.equal(result.errors.profileUrl.length > 0, true);
});

test("strong calibration pattern remains subject to human review", () => {
  const submission = normalizeRecruitmentSubmission(validPayload());
  const evaluation = evaluateCalibration(submission.calibration);
  assert.equal(evaluation.signal, "strong_pattern_match");
  assert.equal(evaluation.manualReviewRequired, true);
});

test("a directionally wrong score pattern is routed to manual review", () => {
  const payload = validPayload();
  Object.keys(payload.calibration.scores).forEach((dimension) => {
    payload.calibration.scores[dimension] = 0.9;
  });
  payload.calibration.rationale =
    "This critique appears sound and decisive because it identifies a missing moral bridge, so I would accept it without reservation.";
  const submission = normalizeRecruitmentSubmission(payload);
  const evaluation = evaluateCalibration(submission.calibration);
  assert.equal(evaluation.signal, "manual_review");
  assert.equal(evaluation.manualReviewRequired, true);
});
