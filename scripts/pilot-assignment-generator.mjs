import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";

export const ANONYMOUS_RATER_SLOTS = Object.freeze(["R1", "R2", "R3", "R4", "R5", "R6"]);
export const TOPIC_FAMILIES = Object.freeze([
  "normative_ethics",
  "political_philosophy",
  "epistemology_and_philosophy_of_science",
  "philosophy_of_mind_and_ai_consciousness",
  "decision_theory_and_social_choice",
  "metaphilosophy_and_ai_governance",
]);
export const SOURCE_CLASSES = Object.freeze([
  "public_synthetic_with_new_expert_ratings",
  "protected_public_domain_derived",
]);

const CONTROLLED_AUTHORIZATION_FIELDS = Object.freeze([
  "q_006b_approved",
  "q_006c_approved",
  "protected_manifest_frozen",
  "participants_confirmed",
  "conflict_and_exposure_checks_complete",
  "calibration_complete",
  "controlled_assignment_authorized",
]);
const FORBIDDEN_PUBLIC_KEYS = new Set([
  "participant_id",
  "participant_ids",
  "position_id",
  "position_ids",
  "critique_id",
  "critique_ids",
  "anonymous_slot_mapping",
  "position_assignments",
  "conflict_position_ids",
  "prior_exposure_position_ids",
]);

export class PilotAssignmentError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PilotAssignmentError";
    this.details = details;
  }
}

export function validatePilotAssignmentInput(methodology, input) {
  const errors = [];
  const assignment = objectOrEmpty(methodology?.preferred_assignment);
  const slots = Array.isArray(assignment.slots) ? assignment.slots : [];
  const inputPositions = Array.isArray(input?.positions) ? input.positions : [];
  const participants = Array.isArray(input?.participants) ? input.participants : [];
  const authorization = objectOrEmpty(input?.authorization);

  if (methodology?.recommendation_id !== "pilot-methodology-recommendations-v1-2026-07-30") {
    errors.push("methodology must identify pilot-methodology-recommendations-v1-2026-07-30.");
  }
  if (assignment.status !== "recommended_non_binding") {
    errors.push("methodology.preferred_assignment must remain recommended_non_binding.");
  }
  if (!sameStringSet(assignment.anonymous_raters, ANONYMOUS_RATER_SLOTS)) {
    errors.push("methodology must contain anonymous rater slots R1 through R6 exactly.");
  }
  if (slots.length !== 12) errors.push("methodology must contain exactly 12 assignment slots.");

  if (!nonEmptyString(input?.assignment_input_id)) errors.push("assignment_input_id is required.");
  if (input?.input_version !== 1) errors.push("input_version must equal 1.");
  if (input?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (!new Set(["synthetic_test_fixture", "private_controlled_assignment_input"]).has(input?.data_class)) {
    errors.push("data_class must be synthetic_test_fixture or private_controlled_assignment_input.");
  }
  if (!new Set(["simulation", "controlled_generation"]).has(input?.mode)) {
    errors.push("mode must be simulation or controlled_generation.");
  }
  if (!nonEmptyString(input?.seed)) errors.push("seed is required.");

  if (input?.mode === "simulation") {
    if (input?.data_class !== "synthetic_test_fixture") {
      errors.push("simulation mode is allowed only for synthetic_test_fixture data.");
    }
    for (const field of CONTROLLED_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== false) errors.push(`simulation authorization.${field} must remain false.`);
    }
    if (!emptyArray(authorization.approval_record_ids) || authorization.approved_at !== null) {
      errors.push("simulation mode must not contain approval records or an approval timestamp.");
    }
    if (authorization.private_controlled_storage_confirmed !== false) {
      errors.push("simulation authorization.private_controlled_storage_confirmed must remain false.");
    }
  }

  if (input?.mode === "controlled_generation") {
    if (input?.data_class !== "private_controlled_assignment_input") {
      errors.push("controlled_generation requires private_controlled_assignment_input data.");
    }
    for (const field of CONTROLLED_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== true) errors.push(`controlled authorization.${field} must equal true.`);
    }
    if (!Array.isArray(authorization.approval_record_ids) || authorization.approval_record_ids.length < 3) {
      errors.push("controlled generation requires at least three versioned approval record IDs.");
    }
    if (!validIsoTimestamp(authorization.approved_at)) {
      errors.push("controlled generation requires a valid authorization.approved_at timestamp.");
    }
    if (authorization.private_controlled_storage_confirmed !== true) {
      errors.push("controlled generation requires private_controlled_storage_confirmed=true.");
    }
  }

  const methodologySlotIds = slots.map((slot) => cleanId(slot?.slot_id));
  if (new Set(methodologySlotIds).size !== methodologySlotIds.length || methodologySlotIds.some((id) => !id)) {
    errors.push("methodology assignment slot IDs must be unique and non-empty.");
  }

  if (inputPositions.length !== 12) errors.push("positions must contain exactly 12 entries.");
  const positionIdSet = new Set();
  const critiqueIdSet = new Set();
  const positionBySlot = new Map();
  for (const [index, position] of inputPositions.entries()) {
    const prefix = `positions[${index}]`;
    const slotId = cleanId(position?.slot_id);
    const positionId = cleanId(position?.position_id);
    const critiqueIds = normalizeIds(position?.critique_ids);
    if (!methodologySlotIds.includes(slotId)) errors.push(`${prefix}.slot_id must reference a methodology assignment slot.`);
    if (positionBySlot.has(slotId)) errors.push(`Duplicate position slot: ${slotId}.`);
    positionBySlot.set(slotId, position);
    if (!controlledId(positionId)) errors.push(`${prefix}.position_id must be a controlled identifier without whitespace or @.`);
    if (positionIdSet.has(positionId)) errors.push(`${prefix}.position_id duplicates an earlier position ID.`);
    positionIdSet.add(positionId);
    if (critiqueIds.length !== 4) errors.push(`${prefix}.critique_ids must contain exactly four IDs.`);
    if (new Set(critiqueIds).size !== critiqueIds.length) errors.push(`${prefix}.critique_ids must be unique.`);
    for (const critiqueId of critiqueIds) {
      if (!controlledId(critiqueId)) errors.push(`${prefix}.critique_ids contains an invalid controlled identifier.`);
      if (critiqueIdSet.has(critiqueId)) errors.push(`${prefix}.critique_ids contains an ID already used elsewhere.`);
      critiqueIdSet.add(critiqueId);
    }
    const methodologySlot = slots.find((slot) => slot?.slot_id === slotId);
    if (methodologySlot) {
      if (position?.topic_family !== methodologySlot.topic_family) {
        errors.push(`${prefix}.topic_family must match methodology slot ${slotId}.`);
      }
      if (position?.source_class !== methodologySlot.source_class) {
        errors.push(`${prefix}.source_class must match methodology slot ${slotId}.`);
      }
    }
    if (input?.mode === "simulation") {
      if (!positionId.startsWith("SIM_")) errors.push(`${prefix}.position_id must start with SIM_ in simulation mode.`);
      if (critiqueIds.some((id) => !id.startsWith("SIM_"))) {
        errors.push(`${prefix}.critique_ids must start with SIM_ in simulation mode.`);
      }
    }
  }
  for (const slotId of methodologySlotIds) {
    if (!positionBySlot.has(slotId)) errors.push(`positions is missing methodology slot ${slotId}.`);
  }

  if (participants.length !== 6) errors.push("participants must contain exactly six confirmed core-rater records.");
  const participantIds = new Set();
  for (const [index, participant] of participants.entries()) {
    const prefix = `participants[${index}]`;
    const participantId = cleanId(participant?.participant_id);
    if (!controlledId(participantId)) errors.push(`${prefix}.participant_id must be a controlled pseudonymous identifier.`);
    if (participantIds.has(participantId)) errors.push(`${prefix}.participant_id duplicates an earlier participant ID.`);
    participantIds.add(participantId);
    if (input?.mode === "simulation" && !participantId.startsWith("SIM_")) {
      errors.push(`${prefix}.participant_id must start with SIM_ in simulation mode.`);
    }
    if (participant?.role !== "core_rater") errors.push(`${prefix}.role must equal core_rater.`);
    for (const field of ["qualified", "consented", "available"]) {
      if (participant?.[field] !== true) errors.push(`${prefix}.${field} must equal true before assignment.`);
    }
    if (participant?.calibration_status !== "passed") {
      errors.push(`${prefix}.calibration_status must equal passed before assignment.`);
    }
    const topics = normalizeStrings(participant?.approved_topic_families);
    if (!topics.length) errors.push(`${prefix}.approved_topic_families must not be empty.`);
    if (topics.some((topic) => !TOPIC_FAMILIES.includes(topic))) {
      errors.push(`${prefix}.approved_topic_families contains an unsupported topic family.`);
    }
    if (new Set(topics).size !== topics.length) errors.push(`${prefix}.approved_topic_families must be unique.`);
    for (const field of ["conflict_position_ids", "prior_exposure_position_ids"]) {
      const ids = normalizeIds(participant?.[field]);
      if (!Array.isArray(participant?.[field])) errors.push(`${prefix}.${field} must be an array.`);
      if (new Set(ids).size !== ids.length) errors.push(`${prefix}.${field} must be unique.`);
      if (ids.some((id) => !positionIdSet.has(id))) errors.push(`${prefix}.${field} must reference known position IDs.`);
    }
  }

  return {
    status: errors.length ? "fail" : "pass",
    mode: input?.mode ?? null,
    data_class: input?.data_class ?? null,
    positions: inputPositions.length,
    participants: participants.length,
    errors,
  };
}

export function generatePilotAssignments(methodology, input) {
  const validation = validatePilotAssignmentInput(methodology, input);
  if (validation.status !== "pass") {
    throw new PilotAssignmentError(`Pilot assignment input is invalid:\n${validation.errors.join("\n")}`, {
      validation,
    });
  }

  const slots = [...methodology.preferred_assignment.slots].sort((a, b) => a.slot_id.localeCompare(b.slot_id));
  const normalizedPositions = input.positions.map((position) => ({
    ...structuredClone(position),
    slot_id: cleanId(position.slot_id),
    position_id: cleanId(position.position_id),
    critique_ids: normalizeIds(position.critique_ids),
  }));
  const positionsBySlot = new Map(normalizedPositions.map((position) => [position.slot_id, position]));
  const participants = input.participants
    .map((participant) => ({
      ...structuredClone(participant),
      participant_id: cleanId(participant.participant_id),
      approved_topic_families: normalizeStrings(participant.approved_topic_families),
      conflict_position_ids: normalizeIds(participant.conflict_position_ids),
      prior_exposure_position_ids: normalizeIds(participant.prior_exposure_position_ids),
    }))
    .sort((a, b) => a.participant_id.localeCompare(b.participant_id));
  const feasible = [];

  for (const permutation of permutations(participants)) {
    const mapping = Object.fromEntries(ANONYMOUS_RATER_SLOTS.map((slot, index) => [slot, permutation[index]]));
    if (!mappingIsFeasible(slots, positionsBySlot, mapping)) continue;
    const publicMapping = Object.fromEntries(
      ANONYMOUS_RATER_SLOTS.map((slot) => [slot, mapping[slot].participant_id]),
    );
    const canonical = canonicalStringify(publicMapping);
    feasible.push({
      mapping,
      publicMapping,
      canonical,
      rank: sha256(`${input.seed}\n${canonical}`),
    });
  }

  if (!feasible.length) {
    throw new PilotAssignmentError(
      "No feasible anonymous-slot mapping satisfies topic competence, conflict, and prior-exposure constraints.",
      { feasible_mapping_count: 0 },
    );
  }

  feasible.sort((left, right) => left.rank.localeCompare(right.rank) || left.canonical.localeCompare(right.canonical));
  const selected = feasible[0];
  const positionAssignments = slots.map((slot) => {
    const position = positionsBySlot.get(slot.slot_id);
    return {
      slot_id: slot.slot_id,
      position_id: position.position_id,
      topic_family: slot.topic_family,
      source_class: slot.source_class,
      critique_ids: [...position.critique_ids],
      rater_ids: slot.rater_pair.map((anonymousSlot) => selected.mapping[anonymousSlot].participant_id).sort(),
    };
  });
  const invariants = verifyGeneratedAssignment(positionAssignments, input.participants);

  return {
    report_version: "pilot-assignment-v1",
    programme_id: input.programme_id,
    data_class: input.data_class,
    mode: input.mode,
    assignment_generated_under_controlled_authorization: input.mode === "controlled_generation",
    rating_work_authorized: false,
    phase_2_authorized: false,
    methodology_sha256: sha256(canonicalStringify(methodology.preferred_assignment)),
    assignment_input_sha256: sha256(canonicalStringify(redactSeed(input))),
    assignment_seed_sha256: sha256(input.seed),
    feasible_mapping_count: feasible.length,
    selected_mapping_hash: sha256(selected.canonical),
    anonymous_slot_mapping: ANONYMOUS_RATER_SLOTS.map((slot) => ({
      anonymous_slot: slot,
      participant_id: selected.mapping[slot].participant_id,
    })),
    position_assignments: positionAssignments,
    invariants,
    governance: {
      deterministic: true,
      input_order_independent: true,
      no_constraint_relaxation_fallback: true,
      conflicts_respected: true,
      prior_exposure_respected: true,
      topic_competence_respected: true,
      original_methodology_slots_preserved: true,
      assignment_does_not_start_rating_work: true,
    },
  };
}

export function sanitizePilotAssignmentReport(report) {
  const publicReport = {
    report_version: "pilot-assignment-public-summary-v1",
    programme_id: report.programme_id,
    data_class: report.data_class,
    mode: report.mode,
    assignment_generated_under_controlled_authorization:
      report.assignment_generated_under_controlled_authorization === true,
    rating_work_authorized: false,
    phase_2_authorized: false,
    methodology_sha256: report.methodology_sha256,
    assignment_input_sha256: report.assignment_input_sha256,
    assignment_seed_sha256: report.assignment_seed_sha256,
    feasibility: report.mode === "simulation"
      ? { feasible_mapping_count: report.feasible_mapping_count }
      : { at_least_one_feasible_mapping: report.feasible_mapping_count > 0, exact_count_withheld: true },
    selected_mapping_hash: report.selected_mapping_hash,
    invariants: report.invariants,
    governance: report.governance,
    privacy: {
      contains_participant_ids: false,
      contains_position_or_critique_ids: false,
      contains_assignment_pairs: false,
      controlled_assignment_withheld: true,
    },
  };
  assertPublicPilotAssignmentReport(publicReport);
  return publicReport;
}

export function assertPublicPilotAssignmentReport(report) {
  const forbidden = findKeys(report, FORBIDDEN_PUBLIC_KEYS);
  if (forbidden.length) {
    throw new PilotAssignmentError(`Public assignment summary exposes controlled fields: ${forbidden.join(", ")}`);
  }
  if (report?.rating_work_authorized !== false || report?.phase_2_authorized !== false) {
    throw new PilotAssignmentError("Public assignment summary cannot authorize rating work or Phase 2.");
  }
  for (const field of ["contains_participant_ids", "contains_position_or_critique_ids", "contains_assignment_pairs"]) {
    if (report?.privacy?.[field] !== false) {
      throw new PilotAssignmentError(`Public assignment privacy.${field} must equal false.`);
    }
  }
  return true;
}

function mappingIsFeasible(slots, positionsBySlot, mapping) {
  for (const slot of slots) {
    const position = positionsBySlot.get(slot.slot_id);
    for (const anonymousSlot of slot.rater_pair) {
      const participant = mapping[anonymousSlot];
      if (!participant.approved_topic_families.includes(slot.topic_family)) return false;
      if (participant.conflict_position_ids.includes(position.position_id)) return false;
      if (participant.prior_exposure_position_ids.includes(position.position_id)) return false;
    }
  }
  return true;
}

function verifyGeneratedAssignment(positionAssignments, participants) {
  const errors = [];
  const stats = new Map(
    participants.map((participant) => [
      participant.participant_id,
      {
        positions: 0,
        critiques: 0,
        partners: new Set(),
        topics: new Set(),
        sources: new Map(SOURCE_CLASSES.map((sourceClass) => [sourceClass, 0])),
      },
    ]),
  );
  const pairKeys = new Set();
  let critiqueCount = 0;

  for (const assignment of positionAssignments) {
    critiqueCount += assignment.critique_ids.length;
    if (assignment.rater_ids.length !== 2 || assignment.rater_ids[0] === assignment.rater_ids[1]) {
      errors.push(`${assignment.slot_id} must have two distinct raters.`);
      continue;
    }
    const pairKey = [...assignment.rater_ids].sort().join("::");
    if (pairKeys.has(pairKey)) errors.push(`Generated rater pair repeats: ${pairKey}.`);
    pairKeys.add(pairKey);
    for (const [raterId, partnerId] of [
      [assignment.rater_ids[0], assignment.rater_ids[1]],
      [assignment.rater_ids[1], assignment.rater_ids[0]],
    ]) {
      const row = stats.get(raterId);
      if (!row) {
        errors.push("Generated assignment references an unknown participant.");
        continue;
      }
      row.positions += 1;
      row.critiques += assignment.critique_ids.length;
      row.partners.add(partnerId);
      row.topics.add(assignment.topic_family);
      if (row.sources.has(assignment.source_class)) {
        row.sources.set(assignment.source_class, row.sources.get(assignment.source_class) + 1);
      }
    }
  }

  for (const row of stats.values()) {
    if (row.positions !== 4) errors.push("Every participant must receive four positions.");
    if (row.critiques !== 16) errors.push("Every participant must receive sixteen critiques.");
    if (row.partners.size !== 4) errors.push("Every participant must work with four distinct partners.");
    if (row.topics.size !== 4) errors.push("Every participant must receive four distinct topic families.");
    for (const sourceClass of SOURCE_CLASSES) {
      if (row.sources.get(sourceClass) !== 2) errors.push(`Every participant must receive two ${sourceClass} positions.`);
    }
  }

  if (errors.length) throw new PilotAssignmentError(`Generated assignment violated invariants:\n${errors.join("\n")}`);
  return {
    positions: positionAssignments.length,
    critiques: critiqueCount,
    core_raters: stats.size,
    raters_per_position: 2,
    positions_per_rater: 4,
    critiques_per_rater: 16,
    unique_rater_pairs: pairKeys.size,
    distinct_partners_per_rater: 4,
    distinct_topic_families_per_rater: 4,
    preferred_source_positions_per_rater: Object.fromEntries(SOURCE_CLASSES.map((sourceClass) => [sourceClass, 2])),
  };
}

function* permutations(values, prefix = []) {
  if (!values.length) {
    yield prefix;
    return;
  }
  for (let index = 0; index < values.length; index += 1) {
    const rest = [...values.slice(0, index), ...values.slice(index + 1)];
    yield* permutations(rest, [...prefix, values[index]]);
  }
}

function redactSeed(input) {
  return { ...structuredClone(input), seed: "[redacted-before-hash]" };
}

function canonicalStringify(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function findKeys(value, forbiddenKeys, path = "$") {
  const found = [];
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => found.push(...findKeys(entry, forbiddenKeys, `${path}[${index}]`)));
    return found;
  }
  for (const [key, entry] of Object.entries(value)) {
    const keyPath = `${path}.${key}`;
    if (forbiddenKeys.has(key)) found.push(keyPath);
    found.push(...findKeys(entry, forbiddenKeys, keyPath));
  }
  return found;
}

function sameStringSet(left, right) {
  const leftSet = new Set(normalizeStrings(left));
  const rightSet = new Set(normalizeStrings(right));
  return leftSet.size === rightSet.size && [...leftSet].every((entry) => rightSet.has(entry));
}

function controlledId(value) {
  return nonEmptyString(value) && !/\s|@/.test(value);
}

function validIsoTimestamp(value) {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeIds(value) {
  return Array.isArray(value) ? value.map(cleanId).filter(Boolean) : [];
}

function normalizeStrings(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean) : [];
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function emptyArray(value) {
  return Array.isArray(value) && value.length === 0;
}

function parseCliArgs(argv) {
  const positional = [];
  let controlledOutput = null;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--controlled-output") {
      controlledOutput = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    positional.push(value);
  }
  return { positional, controlledOutput };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const { positional, controlledOutput } = parseCliArgs(process.argv.slice(2));
  if (positional.includes("--help") || positional.length < 2) {
    console.log(
      "Usage: node scripts/pilot-assignment-generator.mjs <pilot-methodology-recommendations.json> <assignment-input.json> [--controlled-output <private-path>]",
    );
    console.log("Simulation prints only a public summary. Controlled generation requires --controlled-output and writes the full report with mode 0600.");
  } else {
    const methodology = JSON.parse(await readFile(resolve(positional[0]), "utf8"));
    const input = JSON.parse(await readFile(resolve(positional[1]), "utf8"));
    if (input.mode === "controlled_generation" && !controlledOutput) {
      throw new PilotAssignmentError("Controlled generation requires --controlled-output; full controlled assignments are never printed to stdout.");
    }
    const report = generatePilotAssignments(methodology, input);
    if (input.mode === "controlled_generation") {
      const outputPath = resolve(controlledOutput);
      const workingDirectory = resolve(process.cwd());
      if (outputPath === workingDirectory || outputPath.startsWith(`${workingDirectory}${sep}`)) {
        throw new PilotAssignmentError("Controlled assignment output must be outside the repository working directory.");
      }
      await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
      await chmod(outputPath, 0o600);
    }
    console.log(JSON.stringify(sanitizePilotAssignmentReport(report), null, 2));
  }
}
