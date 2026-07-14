export const REVIEWER_CAMPAIGN_GOAL = 100;
export const REVIEWER_CAMPAIGN_DEADLINE_ISO = "2026-07-16T23:59:00-07:00";

export const ACCEPTED_PRIMARY_FIELDS = [
  "philosophy",
  "ai_safety",
  "ai_ethics",
  "decision_theory",
  "political_theory",
  "law",
  "economics",
  "cognitive_science",
  "computer_science",
  "other_relevant",
];

export const ACCEPTED_TRAINING_LEVELS = [
  "faculty",
  "postdoc",
  "phd_completed",
  "phd_student",
  "research_professional",
  "jd_or_legal_researcher",
  "masters_relevant",
  "independent_researcher",
  "undergraduate",
  "other",
];

const PROVISIONAL_EXPERTISE_LEVELS = new Set([
  "faculty",
  "postdoc",
  "phd_completed",
  "phd_student",
  "research_professional",
  "jd_or_legal_researcher",
]);

const MANUAL_EXPERTISE_LEVELS = new Set(["masters_relevant", "independent_researcher"]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REASONING_SIGNAL_PATTERN =
  /premise\s*(?:2|two)|second\s+premise|all\s+(?:of\s+)?(?:aunt\s+dahlia'?s\s+)?beliefs|truth(?:-value|\s+of)?\s+(?:her|the|aunt\s+dahlia'?s)?\s*beliefs|normative\s+(?:premise|claim)|beliefs?\s+(?:are|is)\s+true|ought\s+(?:claim|content).*truth/i;

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(1, Math.max(0, number));
}

function targetCloseness(value, target) {
  const score = clamp01(value);
  if (score === null) return 0;
  return 1 - Math.abs(score - target);
}

function cleanString(value, maximum = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maximum);
}

function cleanStringArray(value, maximumItems = 12, maximumLength = 80) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => cleanString(item, maximumLength)).filter(Boolean))].slice(0, maximumItems);
}

function safeUrl(value) {
  const cleaned = cleanString(value, 500);
  if (!cleaned) return "";
  try {
    const parsed = new URL(cleaned);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export function normalizeReviewerApplication(raw = {}) {
  const calibration = raw.calibration && typeof raw.calibration === "object" ? raw.calibration : {};
  const email = cleanString(raw.email, 254).toLowerCase();
  const primaryField = cleanString(raw.primaryField, 80);
  const trainingLevel = cleanString(raw.trainingLevel, 80);

  return {
    name: cleanString(raw.name, 120),
    email,
    roleTitle: cleanString(raw.roleTitle, 160),
    affiliation: cleanString(raw.affiliation, 200),
    profileUrl: safeUrl(raw.profileUrl),
    primaryField,
    secondaryFields: cleanStringArray(raw.secondaryFields),
    trainingLevel,
    expertiseSummary: cleanString(raw.expertiseSummary, 1200),
    reviewerExperience: Boolean(raw.reviewerExperience),
    availabilityHours: Math.min(40, Math.max(0, Number.parseInt(raw.availabilityHours, 10) || 0)),
    topicPreferences: cleanStringArray(raw.topicPreferences),
    sourceChannel: normalizeSourceChannel(raw.sourceChannel),
    referrerCode: cleanString(raw.referrerCode, 64).toUpperCase(),
    campaign: cleanString(raw.campaign, 120),
    consentResearchUse: raw.consentResearchUse === true,
    consentFollowup: raw.consentFollowup === true,
    consentNoExternalAssistance: raw.consentNoExternalAssistance === true,
    consentAdult: raw.consentAdult === true,
    comments: cleanString(raw.comments, 1200),
    website: cleanString(raw.website, 200),
    calibration: {
      centrality: clamp01(calibration.centrality),
      strength: clamp01(calibration.strength),
      correctness: clamp01(calibration.correctness),
      clarity: clamp01(calibration.clarity),
      overall: clamp01(calibration.overall),
      explanation: cleanString(calibration.explanation, 2000),
    },
  };
}

export function normalizeSourceChannel(value) {
  const cleaned = cleanString(value, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
  return cleaned || "direct";
}

export function validateReviewerApplication(raw = {}) {
  const application = normalizeReviewerApplication(raw);
  const errors = {};

  if (application.website) errors.website = "Submission rejected.";
  if (application.name.length < 2) errors.name = "Enter your name.";
  if (!EMAIL_PATTERN.test(application.email)) errors.email = "Enter a valid email address.";
  if (!ACCEPTED_PRIMARY_FIELDS.includes(application.primaryField)) errors.primaryField = "Select a primary field.";
  if (!ACCEPTED_TRAINING_LEVELS.includes(application.trainingLevel)) errors.trainingLevel = "Select your training level.";
  if (application.expertiseSummary.length < 80) {
    errors.expertiseSummary = "Describe your relevant expertise in at least 80 characters.";
  }
  if (!application.consentResearchUse) errors.consentResearchUse = "Research-use consent is required.";
  if (!application.consentFollowup) errors.consentFollowup = "Follow-up consent is required for reviewer activation.";
  if (!application.consentNoExternalAssistance) {
    errors.consentNoExternalAssistance = "Confirm that you completed the calibration without external assistance.";
  }
  if (!application.consentAdult) errors.consentAdult = "Confirm that you are at least 18.";

  for (const field of ["centrality", "strength", "correctness", "clarity", "overall"]) {
    if (application.calibration[field] === null) errors[`calibration.${field}`] = "Enter a score from 0 to 1.";
  }
  if (application.calibration.explanation.length < 120) {
    errors["calibration.explanation"] = "Give a justification of at least 120 characters.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    application,
  };
}

export function evaluateCalibration(calibration = {}) {
  const explanation = cleanString(calibration.explanation, 2000);
  const reasoningSignal = REASONING_SIGNAL_PATTERN.test(explanation);

  const components = {
    centrality: targetCloseness(calibration.centrality, 1),
    strength: targetCloseness(calibration.strength, 0),
    correctness: targetCloseness(calibration.correctness, 0),
    clarity: targetCloseness(calibration.clarity, 1),
    overall: targetCloseness(calibration.overall, 0),
    explanationDepth: Math.min(1, explanation.length / 500),
    reasoningSignal: reasoningSignal ? 1 : 0,
  };

  const score =
    components.centrality * 0.15 +
    components.strength * 0.2 +
    components.correctness * 0.2 +
    components.clarity * 0.1 +
    components.overall * 0.2 +
    components.explanationDepth * 0.05 +
    components.reasoningSignal * 0.1;

  const thresholdChecks = {
    centrality: Number(calibration.centrality) >= 0.75,
    strength: Number(calibration.strength) <= 0.35,
    correctness: Number(calibration.correctness) <= 0.45,
    clarity: Number(calibration.clarity) >= 0.7,
    overall: Number(calibration.overall) <= 0.35,
    explanation: explanation.length >= 120,
    reasoningSignal,
  };

  const hardPass = Object.values(thresholdChecks).every(Boolean) && score >= 0.72;
  const manualReview = !hardPass && score >= 0.55 && explanation.length >= 120;

  return {
    score: Number(score.toFixed(4)),
    components,
    thresholdChecks,
    status: hardPass ? "pass" : manualReview ? "manual_review" : "not_passed",
  };
}

export function evaluateExpertise(application = {}) {
  const profileEvidence = Boolean(application.profileUrl || application.affiliation);
  const relevantField = ACCEPTED_PRIMARY_FIELDS.includes(application.primaryField);
  const summaryEvidence = cleanString(application.expertiseSummary, 1200).length >= 80;

  if (PROVISIONAL_EXPERTISE_LEVELS.has(application.trainingLevel) && relevantField && summaryEvidence) {
    return { status: "pass", profileEvidence };
  }
  if (MANUAL_EXPERTISE_LEVELS.has(application.trainingLevel) && relevantField && summaryEvidence) {
    return { status: "manual_review", profileEvidence };
  }
  return { status: "not_passed", profileEvidence };
}

export function evaluateReviewerApplication(application = {}) {
  const calibration = evaluateCalibration(application.calibration);
  const expertise = evaluateExpertise(application);

  let qualificationStatus = "not_qualified";
  if (calibration.status === "pass" && expertise.status === "pass") {
    qualificationStatus = expertise.profileEvidence ? "provisional_qualified" : "manual_review";
  } else if (
    (calibration.status === "pass" && expertise.status === "manual_review") ||
    (calibration.status === "manual_review" && expertise.status !== "not_passed")
  ) {
    qualificationStatus = "manual_review";
  }

  return {
    qualificationStatus,
    calibration,
    expertise,
  };
}
