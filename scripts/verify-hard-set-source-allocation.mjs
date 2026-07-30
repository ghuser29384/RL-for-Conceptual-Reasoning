import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const EXPECTED_POSITION_QUOTAS = Object.freeze({
  lmca_expert_rated: 50,
  public_synthetic: 20,
  newly_hidden_public_domain: 30,
});

export function validateHardSetSourceAllocation(value) {
  const errors = [];
  const target = objectOrEmpty(value?.target);
  const operational = objectOrEmpty(value?.current_operational_commitment);
  const activationGate = objectOrEmpty(value?.phase_2_activation_gate);
  const positionsTarget = integerOrZero(target.positions);
  const critiquesPerPosition = integerOrZero(target.critiques_per_position);
  const critiquesTarget = integerOrZero(target.critiques);
  const components = Array.isArray(value?.components) ? value.components : [];
  const byClass = new Map();

  for (const component of components) {
    if (!component || typeof component !== "object" || Array.isArray(component)) {
      errors.push("Every component must be an object.");
      continue;
    }
    const sourceClass = String(component.source_class ?? "").trim();
    if (!sourceClass) {
      errors.push("Every component requires source_class.");
      continue;
    }
    if (byClass.has(sourceClass)) errors.push(`Duplicate source_class: ${sourceClass}.`);
    byClass.set(sourceClass, component);
  }

  const expectedClasses = Object.keys(EXPECTED_POSITION_QUOTAS);
  for (const sourceClass of expectedClasses) {
    if (!byClass.has(sourceClass)) errors.push(`Missing source_class: ${sourceClass}.`);
  }
  for (const sourceClass of byClass.keys()) {
    if (!Object.hasOwn(EXPECTED_POSITION_QUOTAS, sourceClass)) errors.push(`Unexpected source_class: ${sourceClass}.`);
  }

  let positions = 0;
  let critiques = 0;
  for (const [sourceClass, expectedPositions] of Object.entries(EXPECTED_POSITION_QUOTAS)) {
    const component = byClass.get(sourceClass);
    if (!component) continue;
    const observedPositions = integerOrZero(component.positions);
    const observedCritiques = integerOrZero(component.critiques);
    positions += observedPositions;
    critiques += observedCritiques;

    if (observedPositions !== expectedPositions) {
      errors.push(`${sourceClass}.positions must equal approved quota ${expectedPositions}; found ${observedPositions}.`);
    }
    if (observedCritiques !== observedPositions * critiquesPerPosition) {
      errors.push(
        `${sourceClass}.critiques must equal positions × critiques_per_position ` +
          `(${observedPositions * critiquesPerPosition}); found ${observedCritiques}.`,
      );
    }
    if (!String(component.selection_status ?? "").startsWith("deferred")) {
      errors.push(`${sourceClass}.selection_status must identify the component as deferred.`);
    }
    const promotionGates = Array.isArray(component.promotion_gates) ? component.promotion_gates : [];
    if (!promotionGates.some((gate) => String(gate).includes("Phase 2 activation gate passed"))) {
      errors.push(`${sourceClass}.promotion_gates must require Phase 2 activation first.`);
    }
  }

  if (positionsTarget !== 100) errors.push(`target.positions must equal 100; found ${positionsTarget}.`);
  if (critiquesPerPosition !== 4) errors.push(`target.critiques_per_position must equal 4; found ${critiquesPerPosition}.`);
  if (critiquesTarget !== 400) errors.push(`target.critiques must equal 400; found ${critiquesTarget}.`);
  if (positions !== positionsTarget) errors.push(`Component positions sum to ${positions}; target is ${positionsTarget}.`);
  if (critiques !== critiquesTarget) errors.push(`Component critiques sum to ${critiques}; target is ${critiquesTarget}.`);
  if (critiquesTarget !== positionsTarget * critiquesPerPosition) {
    errors.push("Target critiques must equal positions × critiques_per_position.");
  }
  if (integerOrZero(target.minimum_independent_expert_ratings_per_critique) < 2) {
    errors.push("At least two independent expert ratings per critique are required.");
  }
  if (integerOrZero(target.minimum_initial_ratings) < critiquesTarget * 2) {
    errors.push("minimum_initial_ratings must cover two ratings for every critique.");
  }

  if (value?.decision_status !== "approved_source_allocation_deferred_phase_2_activation_blocked") {
    errors.push("decision_status must preserve the approved allocation as deferred and activation-blocked.");
  }
  if (value?.execution_phase !== "deferred_phase_2") errors.push("execution_phase must equal deferred_phase_2.");
  for (const field of ["item_acquisition_active", "bulk_rating_active", "funding_committed", "automatic_activation_after_pilot"]) {
    if (operational[field] !== false) errors.push(`current_operational_commitment.${field} must be false.`);
  }
  if (activationGate.status !== "blocked") errors.push("phase_2_activation_gate.status must equal blocked.");
  if (activationGate.no_automatic_rollover !== true) errors.push("Phase 2 must have no automatic rollover.");
  const activationText = (Array.isArray(activationGate.required_before_activation) ? activationGate.required_before_activation : [])
    .join(" ")
    .toLowerCase();
  for (const required of ["48-critique pilot", "methodological", "external funding", "volunteer", "project owner"]) {
    if (!activationText.includes(required)) errors.push(`Phase 2 activation requirements must include ${required}.`);
  }

  const rules = objectOrEmpty(value?.public_manifest_rules);
  if (rules.publish_component_counts !== true) errors.push("publish_component_counts must be true.");
  for (const field of [
    "publish_hidden_item_ids",
    "publish_hidden_item_text",
    "publish_hidden_critiques",
    "publish_hidden_labels",
  ]) {
    if (rules[field] !== false) errors.push(`${field} must be false.`);
  }

  const hidden = byClass.get("newly_hidden_public_domain") ?? {};
  const hiddenSource = objectOrEmpty(hidden.source_artifact);
  const forbiddenHiddenFields = ["position_ids", "critique_ids", "item_text", "critiques", "labels"];
  const leaked = forbiddenHiddenFields.filter((field) => Object.hasOwn(hiddenSource, field));
  if (leaked.length) errors.push(`Protected source_artifact exposes forbidden public fields: ${leaked.join(", ")}.`);

  const publicSynthetic = byClass.get("public_synthetic") ?? {};
  const publicSyntheticSource = objectOrEmpty(publicSynthetic.source_artifact);
  for (const [label, hash] of [
    ["public_synthetic.source_sha256", publicSyntheticSource.source_sha256],
    ["newly_hidden_public_domain.canonical_jsonl_sha256", hiddenSource.canonical_jsonl_sha256],
  ]) {
    if (!/^[a-f0-9]{64}$/.test(String(hash ?? ""))) errors.push(`${label} must be a lowercase SHA-256 digest.`);
  }

  if (!Array.isArray(value?.unresolved_parameters) || value.unresolved_parameters.length < 5) {
    errors.push("unresolved_parameters must preserve the remaining Phase 2 dependencies.");
  }
  const unresolvedText = (value?.unresolved_parameters ?? []).join(" ").toLowerCase();
  for (const required of ["lmca", "public-synthetic", "authorship", "funding", "panel"]) {
    if (!unresolvedText.includes(required)) errors.push(`unresolved_parameters must include ${required}.`);
  }

  return {
    status: errors.length ? "fail" : "pass",
    allocation_id: value?.allocation_id ?? null,
    execution_phase: value?.execution_phase ?? null,
    activation_status: activationGate.status ?? null,
    positions,
    critiques,
    position_quotas: Object.fromEntries(
      Object.keys(EXPECTED_POSITION_QUOTAS)
        .filter((sourceClass) => byClass.has(sourceClass))
        .map((sourceClass) => [sourceClass, integerOrZero(byClass.get(sourceClass).positions)]),
    ),
    errors,
  };
}

export async function readAndValidateHardSetSourceAllocation(path) {
  const value = JSON.parse(await readFile(path, "utf8"));
  return validateHardSetSourceAllocation(value);
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function integerOrZero(value) {
  return Number.isInteger(value) ? value : 0;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const path = resolve(process.argv[2] ?? `${root}/ops/next-steps-2026-07-23/hard-set-source-allocation.json`);
  const report = await readAndValidateHardSetSourceAllocation(path);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
