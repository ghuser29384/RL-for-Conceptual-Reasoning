export const PILOT_RATER_EOI_VERSION = "pilot-rater-eoi-v1";

export const CAREER_STAGE_OPTIONS = [
  "doctoral_student",
  "postdoctoral_researcher",
  "recent_doctorate",
  "research_staff",
  "independent_early_career_researcher",
  "advanced_masters_with_research",
  "other",
];

export const EXPERTISE_OPTIONS = [
  "metaphilosophy",
  "epistemology",
  "logic_and_argumentation",
  "philosophy_of_science",
  "philosophy_of_language",
  "metaphysics",
  "philosophy_of_mind",
  "personal_identity",
  "free_will",
  "normative_ethics",
  "metaethics",
  "social_political_philosophy",
  "decision_theory",
  "philosophy_of_ai",
  "ai_safety",
  "other",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePilotRaterEoi(raw = {}) {
  return {
    applicationVersion: PILOT_RATER_EOI_VERSION,
    applicant: {
      displayName: cleanText(raw.displayName, 120),
      emailNormalized: cleanText(raw.email, 254).toLowerCase(),
      careerStage: allowedValue(raw.careerStage, CAREER_STAGE_OPTIONS),
      otherCareerStage: cleanText(raw.otherCareerStage, 160),
      affiliation: cleanText(raw.affiliation, 180),
      profileUrl: cleanUrl(raw.profileUrl),
      expertise: uniqueAllowed(raw.expertise, EXPERTISE_OPTIONS),
      otherExpertise: cleanText(raw.otherExpertise, 180),
      relevantExperience: cleanText(raw.relevantExperience, 2400),
      motivation: cleanText(raw.motivation, 1800),
      availableHours: normalizeInteger(raw.availableHours, 1, 60),
      timezone: cleanText(raw.timezone, 100),
      conflictDisclosure: cleanText(raw.conflictDisclosure, 1400),
    },
    consent: {
      age18: raw.consent?.age18 === true,
      accuracy: raw.consent?.accuracy === true,
      contact: raw.consent?.contact === true,
      researchOperations: raw.consent?.researchOperations === true,
      nonbinding: raw.consent?.nonbinding === true,
      noAiCalibration: raw.consent?.noAiCalibration === true,
    },
    source: {
      source: cleanSlug(raw.source?.source, 80) || "direct",
      campaign: cleanSlug(raw.source?.campaign, 80) || "metaphilosophy-pilot-01",
      referredBy: cleanSlug(raw.source?.referredBy, 100),
      landingPath: cleanText(raw.source?.landingPath, 300),
      timezoneOffsetMinutes: normalizeInteger(raw.source?.timezoneOffsetMinutes, -840, 840),
    },
    website: cleanText(raw.website, 200),
  };
}

export function validatePilotRaterEoi(submission) {
  const errors = {};
  const applicant = submission?.applicant ?? {};
  const consent = submission?.consent ?? {};

  if (applicant.displayName.length < 2) errors.displayName = "Enter your name.";
  if (!EMAIL_PATTERN.test(applicant.emailNormalized)) errors.email = "Enter a valid email address.";
  if (!CAREER_STAGE_OPTIONS.includes(applicant.careerStage)) errors.careerStage = "Select your current career stage.";
  if (applicant.careerStage === "other" && applicant.otherCareerStage.length < 2) {
    errors.otherCareerStage = "Describe your current career stage.";
  }
  if (applicant.profileUrl && !isHttpUrl(applicant.profileUrl)) errors.profileUrl = "Use a valid http(s) profile URL.";
  if (applicant.expertise.length === 0) errors.expertise = "Select at least one area of expertise.";
  if (applicant.expertise.includes("other") && applicant.otherExpertise.length < 2) {
    errors.otherExpertise = "Describe the additional expertise.";
  }
  if (applicant.relevantExperience.length < 80) {
    errors.relevantExperience = "Describe relevant research or argument-evaluation experience in at least 80 characters.";
  }
  if (applicant.motivation.length < 60) errors.motivation = "Explain your interest in at least 60 characters.";
  if (!Number.isInteger(applicant.availableHours) || applicant.availableHours < 1 || applicant.availableHours > 60) {
    errors.availableHours = "Enter an integer from 1 to 60 for total availability over four weeks.";
  }
  if (applicant.timezone.length < 2) errors.timezone = "Enter your time zone or UTC offset.";

  if (!consent.age18) errors.age18 = "You must confirm that you are at least 18.";
  if (!consent.accuracy) errors.accuracy = "Confirm that the application information is accurate.";
  if (!consent.contact) errors.contact = "Consent is required so Metaphilosophy can contact you about this application.";
  if (!consent.researchOperations) {
    errors.researchOperations = "Consent is required to use the application and any later calibration for recruitment and research operations.";
  }
  if (!consent.nonbinding) errors.nonbinding = "Confirm that this is a non-binding expression of interest.";
  if (!consent.noAiCalibration) errors.noAiCalibration = "Confirm that you will not use external AI assistance on the calibration or rating work.";

  return { ok: Object.keys(errors).length === 0, errors };
}

export function publicPilotRaterEoiSummary(submission) {
  return {
    applicationVersion: submission.applicationVersion,
    applicant: {
      careerStage: submission.applicant.careerStage,
      expertise: submission.applicant.expertise,
      availableHours: submission.applicant.availableHours,
      timezone: submission.applicant.timezone,
    },
    source: submission.source,
  };
}

function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function cleanSlug(value, maxLength) {
  return cleanText(value, maxLength)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanUrl(value) {
  return cleanText(value, 500);
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

function normalizeInteger(value, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number)) return null;
  return Math.min(max, Math.max(min, number));
}
