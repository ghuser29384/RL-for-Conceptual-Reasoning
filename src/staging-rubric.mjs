export const RUBRIC_VERSION = "lmca-pilot-rubric-v2-2026-08-05";

export const SCORE_DIMENSIONS = Object.freeze([
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "overall",
]);

export const ASSESSABILITY_OPTIONS = Object.freeze([
  "assessable",
  "clearly_unsatisfactory",
  "not_meaningfully_assessable",
]);

export const INTERPRETATION_CONFIDENCE_OPTIONS = Object.freeze(["high", "medium", "low"]);
export const RATING_CONFIDENCE_OPTIONS = Object.freeze(["high", "medium", "low"]);
export const VERIFICATION_OPTIONS = Object.freeze([
  "not_needed",
  "checked",
  "partially_checked",
  "unable_to_check",
]);

export const ISSUE_FLAG_OPTIONS = Object.freeze([
  "position_ambiguity",
  "critique_ambiguity",
  "insufficient_context",
  "source_fidelity",
  "scope_mismatch",
  "factual_verification_needed",
  "multiple_independent_issues",
  "possible_metadata_leak",
  "other",
]);

export const RUBRIC = Object.freeze({
  version: RUBRIC_VERSION,
  methodologicalBasis: "Adapted from A dataset of rated conceptual arguments (LMCA).",
  scoringRange: { minimum: 0, maximum: 1, increment: 0.01 },
  dimensions: {
    centrality: {
      label: "Centrality",
      question: "How important are the claims attacked by the critique to the stated position?",
      guidance: [
        "Treat centrality as the proportion by which the position would be weakened if the attacked claims were successfully refuted.",
        "A score near 1 means the position would substantially collapse. A score near 0 means the attacked point is immaterial to the position as written.",
        "Read the position relatively literally. Do not silently replace its stated conclusion with a broader conclusion often associated with it.",
        "When a critique attacks several claims, assess their combined centrality. Additional irrelevant attacks do not reduce centrality, although they may affect single issue, correctness, or dead weight.",
        "A critique can attack the stated conclusion while remaining below 1 if it addresses only a minor part or a narrow special case.",
      ],
      anchors: { "0": "Attacks only an immaterial point.", "0.5": "Would meaningfully weaken but not collapse the position.", "1": "Attacks claims necessary or critical to the position." },
    },
    strength: {
      label: "Strength",
      question: "How successfully does the critique refute the claims from which it receives its centrality?",
      guidance: [
        "Score the object-level force of the critique, not how confidently the critique describes itself.",
        "Assess strength relative to the claims that generate the centrality score. Refuting a peripheral claim does not earn high strength when the critique fails against the central claim it purports to attack.",
        "The product strength × centrality is the primary substantive-impact quantity. When allocation between strength and centrality is ambiguous, prioritize getting the product right.",
        "A generic assertion that the position is unjustified normally has little strength unless it identifies a specific, independently suspect claim.",
        "Appeals to authority do not contribute object-level strength by themselves.",
        "Additional erroneous material usually affects correctness more directly than strength, unless it changes or clarifies the critique into a weaker argument.",
      ],
      anchors: { "0": "Does not weaken the attacked claims.", "0.5": "Substantially but incompletely weakens them.", "1": "Successfully refutes the attacked claims." },
    },
    correctness: {
      label: "Correctness",
      question: "What proportion of the critique's substantive claims are correct?",
      guidance: [
        "Include claims that do not contribute strength. Weight errors by their significance within the critique, not by their importance to the position.",
        "A peripheral or weak critique can still be fully correct. A strong critique can contain errors and therefore score below 1 on correctness.",
        "Where correctness is uncertain, use the rater's considered credence. Verify logical or mathematical claims where practical; verify empirical claims where reasonably accessible.",
        "Do not count text too unclear to interpret when estimating the fraction correct. If the whole critique is uninterpretable, use the assessability field and explain the limitation.",
      ],
      anchors: { "0": "Substantive claims are entirely wrong.", "0.5": "Roughly half of the weighted substantive content is correct.", "1": "No material false claim identified." },
    },
    clarity: {
      label: "Clarity",
      question: "After careful reading, can the critique's intended argument be pinned down precisely enough to assess?",
      guidance: [
        "Difficulty is not the same as lack of clarity. A dense but precise argument can score highly.",
        "Reduce the score for material ambiguity, vagueness, or an inability to determine the intended implication.",
        "If clarity is below 0.5, downstream analysis gives special weight to clarity and overall because other dimensions may be unreliable.",
      ],
      anchors: { "0": "The intended argument cannot be discerned.", "0.5": "The direction is visible but materially vague or ambiguous.", "0.8": "Mostly understandable with nontrivial ambiguity.", "1": "Sufficiently precise and unambiguous after careful reading." },
    },
    dead_weight: {
      label: "Dead weight",
      question: "How much content neither advances nor meaningfully attempts to advance the critique?",
      guidance: [
        "Bad arguments are not automatically dead weight; they still attempt substantive criticism.",
        "Count material that conveys no useful information, is clearly irrelevant, or discusses tone without connecting it to an object-level defect.",
        "Mere verbosity or elaboration is not dead weight unless it ceases to contribute meaningfully.",
      ],
      anchors: { "0": "No dead weight.", "0.5": "Approximately half the critique is dead weight.", "1": "The critique is entirely dead weight." },
    },
    single_issue: {
      label: "Single issue",
      question: "Does the critique focus on one issue rather than several independent objections?",
      guidance: [
        "Multiple steps needed to defeat one argument can still constitute a single issue.",
        "Reduce the score when the critique introduces independent objections that could stand alone.",
        "A brief secondary point may justify an intermediate score rather than 0.",
      ],
      anchors: { "0": "Clearly advances multiple independent objections.", "1": "Focuses on one issue or one unified line of attack." },
    },
    overall: {
      label: "Overall",
      question: "How good is the critique, all things considered?",
      guidance: [
        "Anchor initially on strength × centrality: how much of a problem is this critique for the position?",
        "Then adjust for insight, precision, correctness, clarity, and extraneous material.",
        "Do not reward merely forceful prose, length, source prestige, or model-like fluency.",
        "A perfect substantive refutation can score materially below 1 if buried in severe ambiguity, error, or irrelevant material.",
      ],
      anchors: { "0": "No real problem for the position or too unclear to assess.", "0.5": "A significant problem without an obvious complete response, or a strong refutation with major presentation/correctness defects.", "1": "A high-quality critique that should refute the position." },
    },
  },
  generalGuidance: [
    "Rate the position and critique as written, with minimal charitable expansion. Do not import an unstated broader conclusion merely because it is common in the literature.",
    "Where the position has several plausible literal interpretations, primarily consider the plausible interpretation under which the critique fares worst, while still assigning weight to the comparative plausibility of each interpretation.",
    "A critique that is already fully 'priced in' to the position normally has little strength unless it identifies new information or a specific unaddressed consequence.",
    "Do not reduce strength merely because the rater already knew the objection. Consider the update for an otherwise informed reader who has not yet considered that critique.",
    "Record background assumptions and interpretation confidence explicitly rather than hiding them inside numeric scores.",
    "If the critique is clearly unsatisfactory or not meaningfully assessable, select the appropriate assessability category and explain why. Still provide scores where a reasoned score is possible; otherwise flag the item for review.",
    "Initial ratings are independent and immutable. A later object-level reconsideration creates a new version linked to the original; disagreement alone is not a sufficient revision reason.",
  ],
});

export function substantiveImpact(scores = {}) {
  const centrality = Number(scores.centrality);
  const strength = Number(scores.strength);
  if (!Number.isFinite(centrality) || !Number.isFinite(strength)) return null;
  return Number((centrality * strength).toFixed(4));
}

export function validateRatingPayload(payload, { requireComplete = true } = {}) {
  const errors = {};
  const scores = payload?.scores ?? {};
  for (const dimension of SCORE_DIMENSIONS) {
    const value = Number(scores[dimension]);
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      errors[`scores.${dimension}`] = `${dimension} must be a number from 0 to 1.`;
    }
  }

  if (!ASSESSABILITY_OPTIONS.includes(payload?.assessability)) errors.assessability = "Select an assessability category.";
  if (!INTERPRETATION_CONFIDENCE_OPTIONS.includes(payload?.interpretationConfidence)) {
    errors.interpretationConfidence = "Select interpretation confidence.";
  }
  if (!RATING_CONFIDENCE_OPTIONS.includes(payload?.confidence)) errors.confidence = "Select rating confidence.";
  if (!VERIFICATION_OPTIONS.includes(payload?.verificationStatus)) errors.verificationStatus = "Select a verification status.";

  const flags = Array.isArray(payload?.issueFlags) ? payload.issueFlags : [];
  if (flags.some((flag) => !ISSUE_FLAG_OPTIONS.includes(flag))) errors.issueFlags = "One or more issue flags are invalid.";
  if (requireComplete && String(payload?.rationale ?? "").trim().length < 40) errors.rationale = "Provide at least 40 characters of object-level reasoning.";
  if (String(payload?.backgroundAssumptions ?? "").length > 4000) errors.backgroundAssumptions = "Background assumptions are too long.";
  if (String(payload?.rationale ?? "").length > 12000) errors.rationale = "Rationale is too long.";
  const seconds = Number(payload?.timeSpentSeconds);
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 86400) errors.timeSpentSeconds = "Time spent must be an integer from 0 to 86400 seconds.";

  return { ok: Object.keys(errors).length === 0, errors, substantiveImpact: substantiveImpact(scores) };
}
