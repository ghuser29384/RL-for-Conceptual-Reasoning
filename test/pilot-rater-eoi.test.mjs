import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePilotRaterEoi,
  publicPilotRaterEoiSummary,
  validatePilotRaterEoi,
} from "../src/recruitment/pilot-rater-eoi.mjs";

function validPayload() {
  return {
    displayName: "Ada Philosopher",
    email: "ADA@example.org ",
    careerStage: "doctoral_student",
    affiliation: "Example University",
    profileUrl: "https://example.org/ada",
    expertise: ["epistemology", "philosophy_of_ai"],
    relevantExperience:
      "I am a doctoral researcher working on epistemology and philosophy of artificial intelligence, with experience teaching and assessing philosophical arguments.",
    motivation:
      "I would like to help test a transparent expert-rating process and provide careful feedback on the rubric and workflow.",
    availableHours: 8,
    timezone: "UTC+1",
    conflictDisclosure: "None known.",
    consent: {
      age18: true,
      accuracy: true,
      contact: true,
      researchOperations: true,
      nonbinding: true,
      noAiCalibration: true,
    },
    source: { source: "adviser-referral", campaign: "metaphilosophy-pilot-01", referredBy: "ref-001" },
  };
}

test("normalizes and validates a complete Pilot 01 expression of interest", () => {
  const submission = normalizePilotRaterEoi(validPayload());
  assert.equal(submission.applicant.emailNormalized, "ada@example.org");
  assert.equal(validatePilotRaterEoi(submission).ok, true);
  assert.deepEqual(publicPilotRaterEoiSummary(submission).applicant.expertise, ["epistemology", "philosophy_of_ai"]);
});

test("requires relevant experience, availability, consent, and at least one expertise area", () => {
  const payload = validPayload();
  payload.expertise = [];
  payload.relevantExperience = "Too short";
  payload.availableHours = 0;
  payload.consent.noAiCalibration = false;
  const result = validatePilotRaterEoi(normalizePilotRaterEoi(payload));
  assert.equal(result.ok, false);
  assert.ok(result.errors.expertise);
  assert.ok(result.errors.relevantExperience);
  assert.ok(result.errors.availableHours);
  assert.ok(result.errors.noAiCalibration);
});

test("rejects non-http profile URLs and requires other-field detail", () => {
  const payload = validPayload();
  payload.careerStage = "other";
  payload.profileUrl = "javascript:alert(1)";
  payload.expertise = ["other"];
  const result = validatePilotRaterEoi(normalizePilotRaterEoi(payload));
  assert.equal(result.ok, false);
  assert.ok(result.errors.otherCareerStage);
  assert.ok(result.errors.profileUrl);
  assert.ok(result.errors.otherExpertise);
});

test("does not place identifying text in the public summary", () => {
  const submission = normalizePilotRaterEoi(validPayload());
  const summary = JSON.stringify(publicPilotRaterEoiSummary(submission));
  assert.doesNotMatch(summary, /Ada Philosopher/);
  assert.doesNotMatch(summary, /ada@example\.org/);
  assert.doesNotMatch(summary, /Example University/);
});
