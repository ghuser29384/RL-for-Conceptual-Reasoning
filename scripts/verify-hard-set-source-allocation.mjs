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
  const target = value?.target && typeof value.target === "object" ? value.target : {};
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

  const rules = value?.public_manifest_rules && typeof value.public_manifest_rules === "object" ? value.public_manifest_rules : {};
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
  const hiddenSource = hidden.source_artifact && typeof hidden.source_artifact === "object" ? hidden.source_artifact : {};
  const forbiddenHiddenFields = ["position_ids", "critique_ids", "item_text", "critiques", "labels"];
  const leaked = forbiddenHiddenFields.filter((field) => Object.hasOwn(hiddenSource, field));
  if (leaked.length) errors.push(`Protected source_artifact exposes forbidden public fields: ${leaked.join(", ")}.`);

  const publicSynthetic = byClass.get("public_synthetic") ?? {};
  const publicSyntheticSource =
    publicSynthetic.source_artifact && typeof publicSynthetic.source_artifact === "object" ? publicSynthetic.source_artifact : {};
  for (const [label, hash] of [
    ["public_synthetic.source_sha256", publicSyntheticSource.source_sha256],
    ["newly_hidden_public_domain.canonical_jsonl_sha256", hiddenSource.canonical_jsonl_sha256],
  ]) {
    if (!/^[a-f0-9]{64}$/.test(String(hash ?? ""))) errors.push(`${label} must be a lowercase SHA-256 digest.`);
  }

  if (value?.decision_status !== "approved_position_allocation_item_selection_pending") {
    errors.push("decision_status must preserve that exact item selection remains pending.");
  }
  if (!Array.isArray(value?.unresolved_parameters) || value.unresolved_parameters.length === 0) {
    errors.push("unresolved_parameters must remain explicit.");
  }

  return {
    status: errors.length ? "fail" : "pass",
    allocation_id: value?.allocation_id ?? null,
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
