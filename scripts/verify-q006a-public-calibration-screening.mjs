import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const REQUIRED_CANDIDATES = Object.freeze([
  "LMCA-PUBLIC-T2-C1",
  "LMCA-PUBLIC-T2-C3",
  "LMCA-PUBLIC-T3-C4",
  "LMCA-PUBLIC-T8-C1",
  "LMCA-PUBLIC-T9-C2",
]);
const REQUIRED_GAPS = Object.freeze([
  "genuinely low-clarity critique near or below the 0.5 branch",
  "practical verification of a correctness-sensitive factual or logical claim",
  "dead weight versus unsuccessful substantive argument",
  "single issue versus multiple independent issues without published labels",
  "examples whose expected evaluation has not been disclosed",
]);
const FORBIDDEN_RECORD_KEYS = new Set([
  "position_text",
  "critique_text",
  "human_rating_values",
  "rating_scores",
  "position_id",
  "critique_id",
]);

export function validateQ006aPublicCalibrationScreening(value) {
  const errors = [];
  const source = objectOrEmpty(value?.source_reference);
  const scope = objectOrEmpty(value?.screening_scope);
  const authorization = objectOrEmpty(value?.authorization_basis);
  const conclusion = objectOrEmpty(value?.screening_conclusion);
  const candidates = Array.isArray(value?.candidates) ? value.candidates : [];

  if (value?.screening_id !== "q006a-public-calibration-screening-v1-2026-08-01") errors.push("screening_id must identify the Q-006A public calibration screening.");
  if (value?.screening_version !== 1) errors.push("screening_version must equal 1.");
  if (value?.status !== "completed_external_example_screening_zero_selected") errors.push("status must record completed external-example screening with zero selected materials.");
  if (value?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") errors.push("programme_id must identify the 48-critique pilot.");

  if (authorization.decision !== "Q-006A" || authorization.approved_at !== "2026-08-01T11:34:32Z") errors.push("Screening must be bound to the recorded Q-006A approval.");
  if (authorization.permits_public_nonprotected_calibration_screening !== true) errors.push("Public non-protected screening permission must be true.");
  if (authorization.permits_calibration_material_freeze !== false || authorization.permits_calibration_or_rating_work !== false) errors.push("Q-006A screening must not authorize a material freeze or participant work.");

  if (source.title !== "A dataset of rated conceptual arguments" || source.arxiv_id !== "2607.27499") errors.push("Source reference must identify the LMCA paper and canonical arXiv record.");
  if (source.role !== "methodological_prior_art_and_external_benchmark") errors.push("LMCA must remain methodological prior art and an external benchmark.");
  if (source.direct_row_reuse_approved !== false || source.redistribution_approval_recorded !== false) errors.push("Direct LMCA row reuse and redistribution approval must remain false.");

  if (scope.public_examples_reviewed !== 5 || candidates.length !== 5) errors.push("Exactly five public LMCA examples must be screened.");
  if (scope.selected_for_metaphilosophy_calibration !== 0 || scope.selected_for_metaphilosophy_production !== 0) errors.push("No exposed LMCA example may be selected for calibration or production.");
  if (scope.copied_position_or_critique_text !== false || scope.copied_human_rating_values !== false) errors.push("The screening record must copy neither item text nor human rating values.");

  const observedIds = candidates.map((candidate) => String(candidate?.candidate_id ?? ""));
  if (!sameStringSet(observedIds, REQUIRED_CANDIDATES)) errors.push("Candidate IDs must cover the five named LMCA public examples exactly.");
  for (const candidate of candidates) {
    if (candidate.human_ratings_publicly_visible !== true) errors.push(`${candidate.candidate_id} must record visible human ratings.`);
    if (candidate.prior_discussion_or_exposure_risk !== true) errors.push(`${candidate.candidate_id} must record prior exposure risk.`);
    if (candidate.disposition !== "exclude_from_calibration_and_production") errors.push(`${candidate.candidate_id} must remain excluded.`);
    if (candidate.permitted_use !== "link_only_prior_work_illustration_for_methodological_advisers") errors.push(`${candidate.candidate_id} may be used only as a linked prior-work illustration.`);
    const reasons = normalizeStrings(candidate.reasons).join(" ").toLowerCase();
    for (const required of ["ratings", "reuse", "approved"]) {
      if (!reasons.includes(required)) errors.push(`${candidate.candidate_id} exclusion reasons must mention ${required}.`);
    }
  }

  const gaps = normalizeStrings(value?.coverage_gaps_requiring_new_public_candidates);
  for (const gap of REQUIRED_GAPS) if (!gaps.includes(gap)) errors.push(`Coverage gaps must include ${gap}.`);

  if (conclusion.selected_materials_sha256 !== null || conclusion.qualification_rule !== null) errors.push("No calibration hash or qualification rule may be frozen by screening.");
  for (const field of [
    "no_contact_or_sending_authorized",
    "no_calibration_work_authorized",
    "no_protected_manifest_freeze_authorized",
    "no_production_item_selection_authorized",
    "no_phase_2_authorized",
  ]) {
    if (conclusion[field] !== true) errors.push(`screening_conclusion.${field} must equal true.`);
  }

  for (const path of findForbiddenPopulatedKeys(value)) errors.push(`Forbidden screening field populated: ${path}.`);

  return {
    status: errors.length ? "fail" : "pass",
    screening_id: value?.screening_id ?? null,
    public_examples_reviewed: scope.public_examples_reviewed ?? null,
    selected_for_calibration: scope.selected_for_metaphilosophy_calibration ?? null,
    selected_for_production: scope.selected_for_metaphilosophy_production ?? null,
    link_only_examples: candidates.filter((candidate) => candidate?.permitted_use === "link_only_prior_work_illustration_for_methodological_advisers").length,
    uncovered_issue_types: gaps.length,
    contact_authorized: false,
    calibration_work_authorized: false,
    errors,
  };
}

export async function readAndValidateQ006aPublicCalibrationScreening(path) {
  return validateQ006aPublicCalibrationScreening(JSON.parse(await readFile(path, "utf8")));
}

function findForbiddenPopulatedKeys(value, path = "$") {
  const found = [];
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => found.push(...findForbiddenPopulatedKeys(entry, `${path}[${index}]`)));
    return found;
  }
  for (const [key, entry] of Object.entries(value)) {
    const keyPath = `${path}.${key}`;
    if (FORBIDDEN_RECORD_KEYS.has(key) && entry !== null && entry !== "" && (!Array.isArray(entry) || entry.length)) found.push(keyPath);
    found.push(...findForbiddenPopulatedKeys(entry, keyPath));
  }
  return found;
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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
  const path = resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/q-006a-public-calibration-screening.json`);
  const report = await readAndValidateQ006aPublicCalibrationScreening(path);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
