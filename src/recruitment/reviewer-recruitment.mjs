export const RECRUITMENT_APPLICATION_VERSION = "reviewer-recruitment-v1";
export const CALIBRATION_ITEM_ID = "public-calibration-is-ought-v1";

export const SCORE_DIMENSIONS = [
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "overall",
];

export const ROLE_OPTIONS = [
  "doctoral_student",
  "postdoctoral_researcher",
  "faculty",
  "independent_researcher",
  "research_staff",
  "legal_or_policy_researcher",
  "industry_researcher",
  "other",
];

export const TRAINING_OPTIONS = [
  "current_doctoral_training",
  "completed_doctorate",
  "professional_research_equivalent",
  "masters_plus_research_experience",
  "other_relevant_expertise",
];

export const EXPERTISE_OPTIONS = [
  "ai_safety",
  "decision_theory",
  "normative_ethics",
  "philosophy_of_mind",
  "epistemology",
  "social_political_philosophy",
  "philosophy_of_ai",
  "law_and_legal_theory",
  "economics",
  "cognitive_science",
  "formal_methods",
  "other",
];

const CONFIDENCE_OPTIONS = ["low", "medium", "high"];
const AVAILABILITY_OPTIONS = ["calibration_only", "under_2_hours", "2_to_5_hours", "over_5_hours"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CALIBRATION_TARGETS = Object.freeze({
  centrality: 0.9,
  strength: 0.1,
  correctness: 0.1,
  clarity: 0.9,
  dead_weight: 0.1,
  single_issue: 0.9,
  overall: 0.1,
});

export function normalizeRecruitmentSubmission(raw = {}) {
  const emailNormalized = cleanText(raw.email, 254).toLowerCase();
  const expertise = uniqueAllowed(raw.expertise, EXPERTISE_OPTIONS);
  const scores = Object.fromEntries(
    SCORE_DIMENSIONS.map((dimension) => [dimension, normalizeScore(raw.calibration?.scores?.[dimension])]),
  );

  return {
    applicationVersion: RECRUITMENT_APPLICATION_VERSION,
    applicant: {
      displayName: cleanText(raw.displayName, 120),
      emailNormalized,
      role: allowedValue(raw.role, ROLE_OPTIONS),
      otherRole: cleanText(raw.otherRole, 120),
      affiliation: cleanText(raw.affiliation, 180),
      training: allowedValue(raw.training, TRAINING_OPTIONS),
      profileUrl: cleanUrl(raw.profileUrl),
      expertise,
      otherExpertise: cleanText(raw.otherExpertise, 160),
      availability: allowedValue(raw.availability, AVAILABILITY_OPTIONS),
    },
    consent: {
      age18: raw.consent?.age18 === true,
      expertiseAffirmation: raw.consent?.expertiseAffirmation === true,
      researchUse: raw.consent?.researchUse === true,
      contact: raw.consent?.contact === true,
      compensationTerms: raw.consent?.compensationTerms === true,
      publicAttribution: raw.consent?.publicAttribution === true,
    },
    calibration: {
      itemId: cleanText(raw.calibration?.itemId, 100),
      scores,
      confidence: allowedValue(raw.calibration?.confidence, CONFIDENCE_OPTIONS),
      rationale: cleanText(raw.calibration?.rationale, 2400),
    },
    source: {
      source: cleanSlug(raw.source?.source, 80) || "direct",
      campaign: cleanSlug(raw.source?.campaign, 80) || "july-2026-expert-reviewer-sprint",
      referredBy: cleanSlug(raw.source?.referredBy, 80),
      landingPath: cleanText(raw.source?.landingPath, 240),
      timezoneOffsetMinutes: normalizeInteger(raw.source?.timezoneOffsetMinutes, -840, 840),
    },
    website: cleanText(raw.website, 200),
  };
}

export function validateRecruitmentSubmission(submission) {
  const errors = {};
  const { applicant, consent, calibration } = submission;

  if (applicant.displayName.length < 2) errors.displayName = "Enter your name.";
  if (!EMAIL_PATTERN.test(applicant.emailNormalized)) errors.email = "Enter a valid email address.";
  if (!ROLE_OPTIONS.includes(applicant.role)) errors.role = "Select your current role.";
  if (applicant.role === "other" && applicant.otherRole.length < 2) errors.otherRole = "Describe your role.";
  if (applicant.affiliation.length < 2) errors.affiliation = "Enter an affiliation or ‘Independent’.";
  if (!TRAINING_OPTIONS.includes(applicant.training)) errors.training = "Select the most relevant training level.";
  if (applicant.profileUrl && !isHttpUrl(applicant.profileUrl)) errors.profileUrl = "Use a valid http(s) profile URL.";
  if (applicant.expertise.length === 0) errors.expertise = "Select at least one area of expertise.";
  if (applicant.expertise.includes("other") && applicant.otherExpertise.length < 2) {
    errors.otherExpertise = "Describe the additional expertise.";
  }
  if (!AVAILABILITY_OPTIONS.includes(applicant.availability)) errors.availability = "Select your availability.";

  if (!consent.age18) errors.age18 = "You must confirm that you are at least 18.";
  if (!consent.expertiseAffirmation) errors.expertiseAffirmation = "Confirm that the background information is accurate.";
  if (!consent.researchUse) errors.researchUse = "Consent is required to use the calibration response for research operations.";
  if (!consent.contact) errors.contact = "Consent is required so the team can contact you about qualification and payment.";
  if (!consent.compensationTerms) errors.compensationTerms = "Confirm the compensation and eligibility terms.";

  if (calibration.itemId !== CALIBRATION_ITEM_ID) errors.calibrationItem = "The calibration item version is invalid.";
  for (const dimension of SCORE_DIMENSIONS) {
    const score = calibration.scores[dimension];
    if (!Number.isFinite(score) || score < 0 || score > 1) {
      errors[`score_${dimension}`] = `Enter a ${dimension.replaceAll("_", " ")} score from 0 to 1.`;
    }
  }
  if (!CONFIDENCE_OPTIONS.includes(calibration.confidence)) errors.confidence = "Select a confidence level.";
  if (calibration.rationale.length < 60) errors.rationale = "Explain your judgment in at least 60 characters.";

  return { ok: Object.keys(errors).length === 0, errors };
}

export function evaluateCalibration(calibration) {
  const scores = calibration?.scores ?? {};
  const normalizedError = SCORE_DIMENSIONS.reduce((sum, dimension) => {
    const score = Number(scores[dimension]);
    if (!Number.isFinite(score)) return sum + 1;
    return sum + Math.abs(score - CALIBRATION_TARGETS[dimension]);
  }, 0) / SCORE_DIMENSIONS.length;

  const rationale = String(calibration?.rationale ?? "").toLowerCase();
  const rationaleSignals = [
    /premise.{0,35}(already|explicitly).{0,35}ought/,
    /(first|major) premise.{0,45}(normative|moral bridge|ought)/,
    /(no|not an?) (is[- ]?ought|fact[- ]?value) (gap|fallacy|problem)/,
    /critique.{0,40}(misread|overlook|ignore|mistaken)/,
    /(ought|normative).{0,35}(is present|appears in|contained in).{0,35}premise/,
  ];
  const rationaleMatch = rationaleSignals.some((pattern) => pattern.test(rationale));

  let signal = "manual_review";
  if (normalizedError <= 0.22 && rationaleMatch) signal = "strong_pattern_match";
  else if (normalizedError <= 0.34 || rationaleMatch) signal = "partial_pattern_match";

  return {
    signal,
    normalizedError: Number(normalizedError.toFixed(4)),
    rationaleMatch,
    manualReviewRequired: true,
    policy: "Calibration signals prioritize the queue; a human reviewer makes every qualification decision.",
  };
}

export function makeReferralCode(applicationId) {
  const compact = String(applicationId ?? "").replaceAll("-", "").toLowerCase();
  return compact ? `r-${compact.slice(0, 10)}` : "";
}

function cleanText(value, maxLength) {
  return String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}

function cleanSlug(value, maxLength) {
  return cleanText(value, maxLength).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function cleanUrl(value) {
  const text = cleanText(value, 500);
  if (!text) return "";
  return text;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function uniqueAllowed(value, allowed) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item ?? "")).filter((item) => allowed.includes(item)))];
}

function allowedValue(value, allowed) {
  const text = String(value ?? "");
  return allowed.includes(text) ? text : "";
}

function normalizeScore(value) {
  if (value === "" || value === null || value === undefined) return Number.NaN;
  const score = Number(value);
  return Number.isFinite(score) ? score : Number.NaN;
}

function normalizeInteger(value, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number)) return null;
  return Math.min(max, Math.max(min, number));
}
