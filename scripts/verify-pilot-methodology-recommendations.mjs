import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const REQUIRED_ANONYMOUS_RATERS = Object.freeze(["R1", "R2", "R3", "R4", "R5", "R6"]);
export const REQUIRED_TOPIC_FAMILIES = Object.freeze([
  "normative_ethics",
  "political_philosophy",
  "epistemology_and_philosophy_of_science",
  "philosophy_of_mind_and_ai_consciousness",
  "decision_theory_and_social_choice",
  "metaphilosophy_and_ai_governance",
]);
export const REQUIRED_SOURCE_CLASSES = Object.freeze([
  "public_synthetic_with_new_expert_ratings",
  "protected_public_domain_derived",
]);

export function validatePilotMethodologyRecommendations(value) {
  const errors = [];
  const sourceBasis = objectOrEmpty(value?.source_basis);
  const primaryReference = objectOrEmpty(sourceBasis.primary_reference);
  const assignment = objectOrEmpty(value?.preferred_assignment);
  const candidateControls = objectOrEmpty(value?.candidate_selection_controls);
  const calibration = objectOrEmpty(value?.shared_calibration);
  const adjudication = objectOrEmpty(value?.adjudication_additions);
  const analysis = objectOrEmpty(value?.analysis_safeguards);
  const governance = objectOrEmpty(value?.governance);

  if (value?.recommendation_id !== "pilot-methodology-recommendations-v1-2026-07-30") {
    errors.push("recommendation_id must identify the 2026-07-30 pilot methodology recommendations.");
  }
  if (value?.recommendation_version !== 1) errors.push("recommendation_version must equal 1.");
  if (value?.status !== "non_binding_pending_q_006a_and_q_006b") {
    errors.push("status must preserve the non-binding Q-006A/Q-006B boundary.");
  }

  if (primaryReference.title !== "A dataset of rated conceptual arguments") {
    errors.push("source_basis must identify A dataset of rated conceptual arguments.");
  }
  if (primaryReference.role !== "methodological_prior_art_and_external_benchmark") {
    errors.push("The LMCA reference must remain methodological prior art and an external benchmark.");
  }
  if (primaryReference.direct_row_reuse !== false) errors.push("Direct LMCA row reuse must remain false.");
  const sourceObservations = normalizeStrings(sourceBasis.observations).join(" ").toLowerCase();
  for (const required of ["951", "1458", "source", "interpretation", "strength multiplied by centrality", "clarity is below 0.5", "original ratings"]) {
    if (!sourceObservations.includes(required)) errors.push(`source_basis.observations must include ${required}.`);
  }

  if (assignment.status !== "recommended_non_binding") errors.push("preferred_assignment.status must remain recommended_non_binding.");
  if (!sameStringSet(assignment.anonymous_raters, REQUIRED_ANONYMOUS_RATERS)) {
    errors.push("preferred_assignment.anonymous_raters must contain R1 through R6 exactly.");
  }
  if (!sameStringSet(assignment.source_classes, REQUIRED_SOURCE_CLASSES)) {
    errors.push("preferred_assignment.source_classes must contain the two eligible source classes exactly.");
  }
  const preferredSourceMix = objectOrEmpty(assignment.preferred_source_mix);
  for (const sourceClass of REQUIRED_SOURCE_CLASSES) {
    if (preferredSourceMix[sourceClass] !== 6) errors.push(`preferred_source_mix.${sourceClass} must equal 6.`);
  }
  const fallbackText = String(assignment.fallback_rule ?? "").toLowerCase();
  for (const required of ["at least four", "document", "q-006b"]) {
    if (!fallbackText.includes(required)) errors.push(`preferred_assignment.fallback_rule must include ${required}.`);
  }

  const slots = Array.isArray(assignment.slots) ? assignment.slots : [];
  if (slots.length !== 12) errors.push("preferred_assignment.slots must contain exactly 12 positions.");
  const slotIds = slots.map((slot) => String(slot?.slot_id ?? ""));
  if (slotIds.some((slotId) => !slotId)) errors.push("Every assignment slot requires slot_id.");
  if (new Set(slotIds).size !== slotIds.length) errors.push("Assignment slot IDs must be unique.");

  const topicCounts = new Map(REQUIRED_TOPIC_FAMILIES.map((topic) => [topic, 0]));
  const topicSources = new Map(REQUIRED_TOPIC_FAMILIES.map((topic) => [topic, new Set()]));
  const sourceCounts = new Map(REQUIRED_SOURCE_CLASSES.map((sourceClass) => [sourceClass, 0]));
  const raterStats = new Map(
    REQUIRED_ANONYMOUS_RATERS.map((rater) => [
      rater,
      { positions: 0, partners: new Set(), topics: new Set(), sources: new Map(REQUIRED_SOURCE_CLASSES.map((sourceClass) => [sourceClass, 0])) },
    ]),
  );
  const pairKeys = new Set();

  for (const slot of slots) {
    const topic = String(slot?.topic_family ?? "");
    const sourceClass = String(slot?.source_class ?? "");
    const pair = Array.isArray(slot?.rater_pair) ? slot.rater_pair.map((entry) => String(entry)) : [];

    if (!topicCounts.has(topic)) errors.push(`Unexpected topic family: ${topic || "<missing>"}.`);
    else {
      topicCounts.set(topic, topicCounts.get(topic) + 1);
      topicSources.get(topic).add(sourceClass);
    }
    if (!sourceCounts.has(sourceClass)) errors.push(`Unexpected source class: ${sourceClass || "<missing>"}.`);
    else sourceCounts.set(sourceClass, sourceCounts.get(sourceClass) + 1);

    if (pair.length !== 2 || pair[0] === pair[1]) {
      errors.push(`Slot ${slot?.slot_id ?? "<missing>"} must have two distinct raters.`);
      continue;
    }
    if (pair.some((rater) => !raterStats.has(rater))) {
      errors.push(`Slot ${slot?.slot_id ?? "<missing>"} contains an unknown anonymous rater.`);
      continue;
    }
    const pairKey = [...pair].sort().join("::");
    if (pairKeys.has(pairKey)) errors.push(`Anonymous rater pair is repeated: ${pairKey}.`);
    pairKeys.add(pairKey);

    for (const [rater, partner] of [
      [pair[0], pair[1]],
      [pair[1], pair[0]],
    ]) {
      const stats = raterStats.get(rater);
      stats.positions += 1;
      stats.partners.add(partner);
      stats.topics.add(topic);
      if (stats.sources.has(sourceClass)) stats.sources.set(sourceClass, stats.sources.get(sourceClass) + 1);
    }
  }

  for (const topic of REQUIRED_TOPIC_FAMILIES) {
    if (topicCounts.get(topic) !== 2) errors.push(`Topic ${topic} must have exactly two position slots.`);
    if (!sameStringSet([...topicSources.get(topic)], REQUIRED_SOURCE_CLASSES)) {
      errors.push(`Topic ${topic} must contain one position from each source class.`);
    }
  }
  for (const sourceClass of REQUIRED_SOURCE_CLASSES) {
    if (sourceCounts.get(sourceClass) !== 6) errors.push(`Source class ${sourceClass} must have exactly six position slots.`);
  }
  if (pairKeys.size !== 12) errors.push("The preferred assignment must use 12 unique rater pairs.");

  for (const [rater, stats] of raterStats) {
    if (stats.positions !== 4) errors.push(`${rater} must receive exactly four positions.`);
    if (stats.partners.size !== 4) errors.push(`${rater} must work with four distinct partners.`);
    if (stats.topics.size !== 4) errors.push(`${rater} must receive four distinct topic families.`);
    for (const sourceClass of REQUIRED_SOURCE_CLASSES) {
      if (stats.sources.get(sourceClass) !== 2) errors.push(`${rater} must receive exactly two ${sourceClass} positions.`);
    }
  }

  if (candidateControls.status !== "recommended_non_binding") {
    errors.push("candidate_selection_controls.status must remain recommended_non_binding.");
  }
  if (integerOrZero(candidateControls.minimum_candidates_per_position) < 8) {
    errors.push("Candidate selection must recommend at least eight candidates per position.");
  }
  if (candidateControls.selected_per_position !== 4) errors.push("Candidate selection must select four critiques per position.");
  const diagnostics = normalizeStrings(candidateControls.required_preselection_diagnostics).join(" ").toLowerCase();
  for (const required of ["word count", "formatting", "source", "judge", "attack-family", "style cue"]) {
    if (!diagnostics.includes(required)) errors.push(`Candidate diagnostics must include ${required}.`);
  }
  const candidateRules = normalizeStrings(candidateControls.rules).join(" ").toLowerCase();
  for (const required of ["never treat them as labels", "trivially predictable", "do not rewrite", "freeze"]) {
    if (!candidateRules.includes(required)) errors.push(`Candidate-selection rules must include ${required}.`);
  }

  if (calibration.status !== "recommended_non_binding") errors.push("shared_calibration.status must remain recommended_non_binding.");
  if (calibration.public_positions !== 2 || calibration.critiques_per_position !== 4 || calibration.shared_calibration_critiques !== 8) {
    errors.push("Shared calibration must recommend two public positions, four critiques each, and eight critiques total.");
  }
  if (!sameStringSet(calibration.participants, ["all_six_core_raters", "both_dedicated_adjudicators"])) {
    errors.push("Shared calibration must include all six core raters and both adjudicators.");
  }
  const issueCoverage = normalizeStrings(calibration.issue_coverage).join(" ").toLowerCase();
  for (const required of ["interpretation", "priced in", "strength-centrality", "low-clarity", "verification", "dead weight", "single-issue"]) {
    if (!issueCoverage.includes(required)) errors.push(`Calibration issue coverage must include ${required}.`);
  }
  const sequence = normalizeStrings(calibration.sequence).join(" ").toLowerCase();
  for (const required of ["independent blind", "preserve", "considerations dossier", "object-level", "pass", "remediation", "non-selection"]) {
    if (!sequence.includes(required)) errors.push(`Calibration sequence must include ${required}.`);
  }
  const qualificationBoundary = String(calibration.qualification_boundary ?? "").toLowerCase();
  for (const required of ["no numerical", "methodological-adviser", "explicit project-owner approval"]) {
    if (!qualificationBoundary.includes(required)) errors.push(`Calibration qualification boundary must include ${required}.`);
  }
  const calibrationExclusion = String(calibration.exclusion ?? "").toLowerCase();
  for (const required of ["public", "non-protected", "excluded from the 48-critique pilot", "excluded from the pilot outcome analysis"]) {
    if (!calibrationExclusion.includes(required)) errors.push(`Calibration exclusion must include ${required}.`);
  }

  if (adjudication.status !== "recommended_non_binding") errors.push("adjudication_additions.status must remain recommended_non_binding.");
  const reviewCandidates = Array.isArray(adjudication.required_item_review_candidates)
    ? adjudication.required_item_review_candidates
    : [];
  const clarityCandidate = reviewCandidates.find((candidate) => candidate?.field === "clarity");
  if (!clarityCandidate || !String(clarityCandidate.condition ?? "").includes("below_0_5")) {
    errors.push("Adjudication additions must include item review when either clarity score is below 0.5.");
  }
  const verificationCandidate = reviewCandidates.find((candidate) => candidate?.field === "verification_status");
  if (!verificationCandidate || !String(verificationCandidate.condition ?? "").includes("unresolved_correctness_sensitive_claim")) {
    errors.push("Adjudication additions must include unresolved correctness-sensitive verification review.");
  }
  if (!String(adjudication.routing_rule ?? "").toLowerCase().includes("original ratings remain preserved")) {
    errors.push("Adjudication routing must preserve original ratings.");
  }

  if (analysis.status !== "recommended_non_binding") errors.push("analysis_safeguards.status must remain recommended_non_binding.");
  if (!sameStringSet(analysis.do_not_treat_as_standalone_quality_targets, ["strength", "centrality"])) {
    errors.push("Strength and centrality must not be standalone quality targets.");
  }
  const lowClarity = objectOrEmpty(analysis.low_clarity_branch);
  if (lowClarity.human_clarity_below !== 0.5 || !sameStringSet(lowClarity.dimensions_retained_for_custom_discrepancy_summary, ["clarity", "overall"])) {
    errors.push("The low-clarity branch must use threshold 0.5 and retain clarity plus overall.");
  }
  const uncertainty = normalizeStrings(analysis.uncertainty_and_sensitivity).join(" ").toLowerCase();
  for (const required of ["12 position-level", "position as the resampling", "leave-one-position-out", "exploratory", "pre-adjudication"]) {
    if (!uncertainty.includes(required)) errors.push(`Analysis uncertainty safeguards must include ${required}.`);
  }
  const limits = normalizeStrings(analysis.small_sample_limits).join(" ").toLowerCase();
  for (const required of ["causal claim", "individual raters", "phase 2 automatically"]) {
    if (!limits.includes(required)) errors.push(`Small-sample limits must include ${required}.`);
  }
  const baselineBoundary = String(analysis.model_baseline_boundary ?? "").toLowerCase();
  for (const required of ["versions", "prompts", "sampling parameters", "before protected human ratings", "not labels or adjudicators"]) {
    if (!baselineBoundary.includes(required)) errors.push(`Model baseline boundary must include ${required}.`);
  }

  if (governance.binding_effect !== false) errors.push("governance.binding_effect must remain false.");
  if (governance.no_outreach_authorization !== true) errors.push("The recommendations must not authorize outreach.");
  if (governance.no_protected_item_freeze !== true) errors.push("The recommendations must not freeze protected items.");
  if (governance.no_phase_2_activation !== true) errors.push("The recommendations must not activate Phase 2.");
  const approvalSequence = normalizeStrings(governance.approval_sequence).join(" ").toLowerCase();
  for (const required of ["q-006a", "methodological-adviser", "q-006b"]) {
    if (!approvalSequence.includes(required)) errors.push(`Governance approval sequence must include ${required}.`);
  }
  if (!Array.isArray(value?.unresolved_parameters) || value.unresolved_parameters.length < 5) {
    errors.push("unresolved_parameters must preserve at least five open methodological decisions.");
  }

  return {
    status: errors.length ? "fail" : "pass",
    recommendation_id: value?.recommendation_id ?? null,
    slots: slots.length,
    unique_pairs: pairKeys.size,
    preferred_source_mix: Object.fromEntries(REQUIRED_SOURCE_CLASSES.map((sourceClass) => [sourceClass, sourceCounts.get(sourceClass) ?? 0])),
    shared_calibration_critiques: calibration.shared_calibration_critiques ?? null,
    binding_effect: governance.binding_effect ?? null,
    errors,
  };
}

export async function readAndValidatePilotMethodologyRecommendations(path) {
  return validatePilotMethodologyRecommendations(JSON.parse(await readFile(path, "utf8")));
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function integerOrZero(value) {
  return Number.isInteger(value) ? value : 0;
}

function normalizeStrings(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean) : [];
}

function sameStringSet(left, right) {
  const leftSet = new Set(normalizeStrings(left));
  const rightSet = new Set(normalizeStrings(right));
  return leftSet.size === rightSet.size && [...leftSet].every((entry) => rightSet.has(entry));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const path = resolve(
    process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/pilot-methodology-recommendations.json`,
  );
  const report = await readAndValidatePilotMethodologyRecommendations(path);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
