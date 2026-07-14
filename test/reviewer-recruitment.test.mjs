import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateReviewerApplication,
  normalizeReviewerApplication,
  validateReviewerApplication,
} from "../src/domain/reviewer-recruitment.mjs";

const baseApplication = {
  name: "Ada Reviewer",
  email: "ada@example.org",
  roleTitle: "Doctoral researcher",
  affiliation: "Example University",
  profileUrl: "https://example.org/ada",
  primaryField: "philosophy",
  secondaryFields: ["ai_safety"],
  trainingLevel: "phd_student",
  expertiseSummary:
    "I work on metaethics and formal epistemology, have taught argument analysis, and have reviewed academic manuscripts.",
  reviewerExperience: true,
  availabilityHours: 4,
  topicPreferences: ["normative_ethics"],
  sourceChannel: "direct_email",
  consentResearchUse: true,
  consentFollowup: true,
  consentNoExternalAssistance: true,
  consentAdult: true,
  calibration: {
    centrality: 1,
    strength: 0.05,
    correctness: 0.05,
    clarity: 1,
    overall: 0.05,
    explanation:
      "The critique targets the core conclusion, but it misidentifies the relevant normative commitment. Premise 1 reports the content of a belief. The second premise, that all of Aunt Dahlia's beliefs are true, is what must carry the normative content needed for the conclusion.",
  },
};

test("normalization removes unsafe URLs and normalizes channels", () => {
  const normalized = normalizeReviewerApplication({
    ...baseApplication,
    email: "  ADA@EXAMPLE.ORG ",
    profileUrl: "javascript:alert(1)",
    sourceChannel: "EA Forum / post",
  });
  assert.equal(normalized.email, "ada@example.org");
  assert.equal(normalized.profileUrl, "");
  assert.equal(normalized.sourceChannel, "ea_forum_post");
});

test("valid expert application passes validation and calibration", () => {
  const validation = validateReviewerApplication(baseApplication);
  assert.equal(validation.ok, true);
  const evaluation = evaluateReviewerApplication(validation.application);
  assert.equal(evaluation.qualificationStatus, "provisional_qualified");
  assert.equal(evaluation.calibration.status, "pass");
});

test("high scores for the weak calibration critique do not qualify", () => {
  const validation = validateReviewerApplication({
    ...baseApplication,
    calibration: {
      centrality: 1,
      strength: 0.9,
      correctness: 1,
      clarity: 1,
      overall: 0.9,
      explanation:
        "This is a decisive critique because the first premise visibly contains the word ought, so the argument cannot establish anything important about the is-ought distinction. The wording alone resolves the issue completely.",
    },
  });
  assert.equal(validation.ok, true);
  const evaluation = evaluateReviewerApplication(validation.application);
  assert.equal(evaluation.qualificationStatus, "not_qualified");
});

test("missing consent and shallow explanation are rejected", () => {
  const validation = validateReviewerApplication({
    ...baseApplication,
    consentResearchUse: false,
    calibration: { ...baseApplication.calibration, explanation: "Too short." },
  });
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.consentResearchUse);
  assert.ok(validation.errors["calibration.explanation"]);
});
