import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";

export const SELF_CHECK_STAGE = "blind_self_check";
export const SELF_CHECK_SELECTED_POSITIONS = 6;
export const SELF_CHECK_SELECTED_CRITIQUES_PER_POSITION = 2;
export const SELF_CHECK_RECORDS = 24;
export const SELF_CHECKS_PER_CORE_RATER = 4;
export const SELF_CHECK_POSITIONS_PER_CORE_RATER = 2;

const TOPICS = Object.freeze([
  "normative_ethics",
  "political_philosophy",
  "epistemology_and_philosophy_of_science",
  "philosophy_of_mind_and_ai_consciousness",
  "decision_theory_and_social_choice",
  "metaphilosophy_and_ai_governance",
]);
const SOURCES = Object.freeze([
  "public_synthetic_with_new_expert_ratings",
  "protected_public_domain_derived",
]);
const CONTROLLED_AUTHORIZATION_FIELDS = Object.freeze([
  "q_006b_approved",
  "protected_manifest_frozen",
  "self_check_selection_authorized",
  "private_controlled_storage_confirmed",
]);
const FORBIDDEN_OUTCOME_KEYS = new Set([
  "rating",
  "ratings",
  "scores",
  "overall_score",
  "overall_scores",
  "mean_overall",
  "mean_overall_score",
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "disagreement",
  "disagreement_score",
  "adjudication",
  "adjudication_status",
  "model_judgment",
  "model_judgments",
  "model_score",
  "model_scores",
  "route_results",
  "latest_accepted",
]);
const FORBIDDEN_PUBLIC_IDENTIFIER_KEYS = new Set([
  "position_id",
  "position_ids",
  "critique_id",
  "critique_ids",
  "rater_id",
  "rater_ids",
  "slot_id",
  "self_check_record_id",
  "selected_position_details",
  "selected_critique_details",
  "self_check_record_details",
]);

export class PilotSelfCheckSelectionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PilotSelfCheckSelectionError";
    this.details = details;
  }
}

export function validatePilotSelfCheckSelectionInput(endpointContract, input) {
  const errors = [];
  const assignmentReport = objectOrEmpty(input?.assignment_report);
  const assignments = Array.isArray(assignmentReport.position_assignments)
    ? assignmentReport.position_assignments
    : [];
  const authorization = objectOrEmpty(input?.authorization);
  const d1 = endpointContract?.owner_decisions?.D1_blind_self_check_scope;

  if (endpointContract?.contract_id !== "mp-pilot-endpoint-design-amendment-v1") {
    errors.push("endpoint contract must identify mp-pilot-endpoint-design-amendment-v1.");
  }
  if (endpointContract?.status !== "approved_for_implementation_design_only") {
    errors.push("endpoint contract must remain approved_for_implementation_design_only.");
  }
  if (d1?.selected_option !== "B" || d1?.status !== "approved") {
    errors.push("D1 must remain approved option B.");
  }
  for (const [field, expected] of Object.entries({
    self_check_records: SELF_CHECK_RECORDS,
    selected_positions: SELF_CHECK_SELECTED_POSITIONS,
    selected_critiques_per_position: SELF_CHECK_SELECTED_CRITIQUES_PER_POSITION,
    self_checks_per_core_rater: SELF_CHECKS_PER_CORE_RATER,
    selected_positions_per_core_rater: SELF_CHECK_POSITIONS_PER_CORE_RATER,
  })) {
    if (d1?.[field] !== expected) errors.push(`D1 must preserve ${field}=${expected}.`);
  }
  if (d1?.selection_frozen_before_any_pilot_rating !== true) {
    errors.push("D1 selection must be frozen before any pilot rating.");
  }
  if (
    d1?.selection_independent_of_observed_human_scores !== true
    || d1?.selection_independent_of_human_disagreement !== true
    || d1?.selection_independent_of_post_rating_model_outputs !== true
  ) {
    errors.push("D1 selection must remain independent of human outcomes and post-rating model outputs.");
  }

  if (!nonEmptyString(input?.selection_input_id)) errors.push("selection_input_id is required.");
  if (input?.input_version !== 1) errors.push("input_version must equal 1.");
  if (input?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (!new Set(["synthetic_test_fixture", "private_controlled_selection_input"]).has(input?.data_class)) {
    errors.push("data_class must be synthetic_test_fixture or private_controlled_selection_input.");
  }
  if (!new Set(["simulation", "controlled_generation"]).has(input?.mode)) {
    errors.push("mode must be simulation or controlled_generation.");
  }
  if (!nonEmptyString(input?.seed)) errors.push("seed is required.");
  validateAuthorization(input?.mode, input?.data_class, authorization, errors);

  if (assignmentReport.report_version !== "pilot-assignment-v1") {
    errors.push("assignment_report must be a full pilot-assignment-v1 report.");
  }
  if (assignmentReport.programme_id !== input?.programme_id) {
    errors.push("assignment_report programme_id must match the selection input.");
  }
  if (assignmentReport.rating_work_authorized !== false || assignmentReport.phase_2_authorized !== false) {
    errors.push("assignment_report must not authorize rating work or Phase 2.");
  }
  if (assignments.length !== 12) errors.push("assignment_report must contain exactly 12 position assignments.");

  const outcomePaths = findKeys(assignments, FORBIDDEN_OUTCOME_KEYS);
  if (outcomePaths.length) {
    errors.push(`assignment_report contains forbidden outcome-dependent fields: ${outcomePaths.join(", ")}.`);
  }

  const slotIds = new Set();
  const positionIds = new Set();
  const critiqueIds = new Set();
  const allRaters = new Set();
  const topicCounts = new Map(TOPICS.map((topic) => [topic, 0]));
  const sourceCounts = new Map(SOURCES.map((sourceClass) => [sourceClass, 0]));

  assignments.forEach((assignment, index) => {
    const prefix = `assignment_report.position_assignments[${index}]`;
    const slotId = cleanId(assignment?.slot_id);
    const positionId = cleanId(assignment?.position_id);
    const critiques = normalizeIds(assignment?.critique_ids);
    const raters = normalizeIds(assignment?.rater_ids).sort();
    if (!controlledId(slotId)) errors.push(`${prefix}.slot_id must be a controlled identifier.`);
    if (slotIds.has(slotId)) errors.push(`${prefix}.slot_id must be unique.`);
    slotIds.add(slotId);
    if (!controlledId(positionId)) errors.push(`${prefix}.position_id must be a controlled identifier.`);
    if (positionIds.has(positionId)) errors.push(`${prefix}.position_id must be unique.`);
    positionIds.add(positionId);
    if (critiques.length !== 4 || new Set(critiques).size !== 4) {
      errors.push(`${prefix}.critique_ids must contain exactly four unique IDs.`);
    }
    for (const critiqueId of critiques) {
      if (!controlledId(critiqueId)) errors.push(`${prefix}.critique_ids contains an invalid ID.`);
      if (critiqueIds.has(critiqueId)) errors.push(`${prefix}.critique_ids contains a globally duplicated ID.`);
      critiqueIds.add(critiqueId);
    }
    if (raters.length !== 2 || new Set(raters).size !== 2 || raters.some((id) => !controlledId(id))) {
      errors.push(`${prefix}.rater_ids must contain exactly two unique controlled IDs.`);
    }
    raters.forEach((id) => allRaters.add(id));
    if (!topicCounts.has(assignment?.topic_family)) errors.push(`${prefix}.topic_family is unsupported.`);
    else topicCounts.set(assignment.topic_family, topicCounts.get(assignment.topic_family) + 1);
    if (!sourceCounts.has(assignment?.source_class)) errors.push(`${prefix}.source_class is unsupported.`);
    else sourceCounts.set(assignment.source_class, sourceCounts.get(assignment.source_class) + 1);
  });

  for (const [topic, count] of topicCounts) {
    if (count !== 2) errors.push(`assignment_report must contain exactly two positions in topic family ${topic}.`);
  }
  for (const [sourceClass, count] of sourceCounts) {
    if (count !== 6) errors.push(`assignment_report must contain exactly six positions in source class ${sourceClass}.`);
  }
  if (allRaters.size !== 6) errors.push("assignment_report must contain exactly six core raters.");

  return {
    status: errors.length ? "fail" : "pass",
    mode: input?.mode ?? null,
    data_class: input?.data_class ?? null,
    positions: assignments.length,
    core_raters: allRaters.size,
    errors,
  };
}

export function generatePilotSelfCheckSelection(endpointContract, input) {
  const validation = validatePilotSelfCheckSelectionInput(endpointContract, input);
  if (validation.status !== "pass") {
    throw new PilotSelfCheckSelectionError(`Pilot self-check selection input is invalid:\n${validation.errors.join("\n")}`, {
      validation,
    });
  }

  const assignments = input.assignment_report.position_assignments
    .map(normalizeAssignment)
    .sort((left, right) => left.slot_id.localeCompare(right.slot_id));
  const feasiblePositionSets = [];
  for (const positionSet of combinations(assignments, SELF_CHECK_SELECTED_POSITIONS)) {
    if (!positionSetIsFeasible(positionSet)) continue;
    const canonical = canonicalStringify(positionSet.map((row) => row.slot_id).sort());
    feasiblePositionSets.push({
      assignments: positionSet,
      canonical,
      rank: sha256(`${input.seed}\npositions\n${canonical}`),
    });
  }
  if (!feasiblePositionSets.length) {
    throw new PilotSelfCheckSelectionError(
      "No balanced six-position self-check subset satisfies topic, source, and per-rater incidence constraints.",
      { feasible_position_set_count: 0 },
    );
  }
  feasiblePositionSets.sort(compareRanked);
  const selectedPositionSet = feasiblePositionSets[0];

  const selectedPositions = selectedPositionSet.assignments.map((assignment) => {
    const critiquePairs = [...combinations(
      [...assignment.critique_ids].sort(),
      SELF_CHECK_SELECTED_CRITIQUES_PER_POSITION,
    )]
      .map((critiqueIds) => {
        const canonical = canonicalStringify(critiqueIds);
        return {
          critiqueIds,
          canonical,
          rank: sha256(`${input.seed}\ncritiques\n${assignment.slot_id}\n${canonical}`),
        };
      })
      .sort(compareRanked);
    return {
      ...assignment,
      selected_critique_ids: critiquePairs[0].critiqueIds,
      selected_critique_pair_hash: sha256(critiquePairs[0].canonical),
    };
  }).sort((left, right) => left.slot_id.localeCompare(right.slot_id));

  const selfCheckRecords = [];
  for (const position of selectedPositions) {
    for (const critiqueId of position.selected_critique_ids) {
      for (const raterId of position.rater_ids) {
        const canonicalKey = `${position.slot_id}|${position.position_id}|${critiqueId}|${raterId}`;
        selfCheckRecords.push({
          self_check_record_id: `SC_${sha256(canonicalKey).slice(0, 24)}`,
          slot_id: position.slot_id,
          position_id: position.position_id,
          critique_id: critiqueId,
          rater_id: raterId,
          predecessor_stage: "initial",
          required_stage: SELF_CHECK_STAGE,
          outcome_independent_selection: true,
        });
      }
    }
  }
  selfCheckRecords.sort((left, right) => left.self_check_record_id.localeCompare(right.self_check_record_id));
  const invariants = verifySelection(selectedPositions, selfCheckRecords);
  const controlledBody = { selected_positions: selectedPositions, self_check_records: selfCheckRecords };

  return {
    report_version: "pilot-self-check-selection-v1",
    programme_id: input.programme_id,
    data_class: input.data_class,
    mode: input.mode,
    controlled_selection_authorized: input.mode === "controlled_generation",
    rating_work_authorized: false,
    research_start_authorized: false,
    participant_access_authorized: false,
    recruitment_authorized: false,
    payment_authorized: false,
    phase_2_authorized: false,
    endpoint_contract_sha256: sha256(canonicalStringify(endpointContract)),
    assignment_report_sha256: sha256(canonicalStringify(selectionRelevantAssignmentView(input.assignment_report))),
    selection_input_sha256: sha256(canonicalStringify(redactSeed(input))),
    selection_seed_sha256: sha256(input.seed),
    feasible_position_set_count: feasiblePositionSets.length,
    selected_position_set_hash: sha256(selectedPositionSet.canonical),
    selected_critique_set_hash: sha256(canonicalStringify(selectedPositions.map((row) => [row.slot_id, row.selected_critique_ids]))),
    controlled_manifest_hash: sha256(canonicalStringify(controlledBody)),
    selected_positions: selectedPositions,
    self_check_records: selfCheckRecords,
    invariants,
    governance: {
      approved_option: "D1_B",
      deterministic: true,
      input_order_independent: true,
      frozen_before_any_pilot_rating: true,
      outcome_independent: true,
      selected_from_assignment_manifest_only: true,
      exact_ids_and_seed_require_controlled_manifest_freeze: true,
      self_check_occurs_after_initial_lock: true,
      self_check_occurs_before_peer_model_aggregate_cause_discussion_or_adjudication_exposure: true,
      initial_rating_preserved: true,
      self_check_does_not_start_rating_work: true,
    },
  };
}

export function sanitizePilotSelfCheckSelectionReport(report) {
  const publicReport = {
    report_version: "pilot-self-check-selection-public-summary-v1",
    programme_id: report.programme_id,
    data_class: report.data_class,
    mode: report.mode,
    controlled_selection_authorized: report.controlled_selection_authorized === true,
    rating_work_authorized: false,
    research_start_authorized: false,
    participant_access_authorized: false,
    recruitment_authorized: false,
    payment_authorized: false,
    phase_2_authorized: false,
    endpoint_contract_sha256: report.endpoint_contract_sha256,
    assignment_report_sha256: report.assignment_report_sha256,
    selection_input_sha256: report.selection_input_sha256,
    selection_seed_sha256: report.selection_seed_sha256,
    feasibility: report.mode === "simulation"
      ? { feasible_position_set_count: report.feasible_position_set_count }
      : { at_least_one_feasible_position_set: report.feasible_position_set_count > 0, exact_count_withheld: true },
    selected_position_set_hash: report.selected_position_set_hash,
    selected_critique_set_hash: report.selected_critique_set_hash,
    controlled_manifest_hash: report.controlled_manifest_hash,
    invariants: report.invariants,
    governance: report.governance,
    privacy: {
      contains_position_ids: false,
      contains_critique_ids: false,
      contains_rater_ids: false,
      contains_selected_slots: false,
      contains_self_check_records: false,
      controlled_selection_withheld: true,
    },
  };
  assertPublicPilotSelfCheckSelectionReport(publicReport);
  return publicReport;
}

export function assertPublicPilotSelfCheckSelectionReport(report) {
  const forbidden = findKeys(report, FORBIDDEN_PUBLIC_IDENTIFIER_KEYS);
  if (forbidden.length) {
    throw new PilotSelfCheckSelectionError(`Public self-check summary exposes controlled fields: ${forbidden.join(", ")}`);
  }
  for (const key of [
    "rating_work_authorized",
    "research_start_authorized",
    "participant_access_authorized",
    "recruitment_authorized",
    "payment_authorized",
    "phase_2_authorized",
  ]) {
    if (report?.[key] !== false) throw new PilotSelfCheckSelectionError(`Public summary ${key} must remain false.`);
  }
  for (const [key, value] of Object.entries(report?.privacy ?? {})) {
    if (key === "controlled_selection_withheld") {
      if (value !== true) throw new PilotSelfCheckSelectionError("Public summary must withhold the controlled selection.");
    } else if (value !== false) {
      throw new PilotSelfCheckSelectionError(`Public summary privacy.${key} must equal false.`);
    }
  }
  return true;
}

function validateAuthorization(mode, dataClass, authorization, errors) {
  if (mode === "simulation") {
    if (dataClass !== "synthetic_test_fixture") errors.push("simulation mode is allowed only for synthetic_test_fixture data.");
    for (const field of CONTROLLED_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== false) errors.push(`simulation authorization.${field} must remain false.`);
    }
    if (!emptyArray(authorization.approval_record_ids) || authorization.approved_at !== null) {
      errors.push("simulation mode must not contain approval records or an approval timestamp.");
    }
  }
  if (mode === "controlled_generation") {
    if (dataClass !== "private_controlled_selection_input") {
      errors.push("controlled_generation requires private_controlled_selection_input data.");
    }
    for (const field of CONTROLLED_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== true) errors.push(`controlled authorization.${field} must equal true.`);
    }
    if (!Array.isArray(authorization.approval_record_ids) || authorization.approval_record_ids.length < 2) {
      errors.push("controlled generation requires at least two versioned approval record IDs.");
    }
    if (!validIsoTimestamp(authorization.approved_at)) {
      errors.push("controlled generation requires a valid authorization.approved_at timestamp.");
    }
  }
}

function positionSetIsFeasible(positionSet) {
  const topics = countBy(positionSet, (row) => row.topic_family);
  const sources = countBy(positionSet, (row) => row.source_class);
  if (topics.size !== TOPICS.length || TOPICS.some((topic) => topics.get(topic) !== 1)) return false;
  if (SOURCES.some((sourceClass) => sources.get(sourceClass) !== 3)) return false;
  const raterCounts = new Map();
  for (const row of positionSet) {
    for (const raterId of row.rater_ids) raterCounts.set(raterId, (raterCounts.get(raterId) ?? 0) + 1);
  }
  return raterCounts.size === 6 && [...raterCounts.values()].every((count) => count === 2);
}

function verifySelection(selectedPositions, selfCheckRecords) {
  const errors = [];
  const topics = countBy(selectedPositions, (row) => row.topic_family);
  const sources = countBy(selectedPositions, (row) => row.source_class);
  const recordsByRater = countBy(selfCheckRecords, (row) => row.rater_id);
  const positionsByRater = new Map();
  const recordKeys = new Set();

  if (selectedPositions.length !== 6) errors.push("Selection must contain exactly six positions.");
  if (topics.size !== 6 || TOPICS.some((topic) => topics.get(topic) !== 1)) {
    errors.push("Selection must contain exactly one position per topic family.");
  }
  if (SOURCES.some((sourceClass) => sources.get(sourceClass) !== 3)) {
    errors.push("Selection must contain exactly three positions per source class.");
  }
  for (const position of selectedPositions) {
    if (position.selected_critique_ids.length !== 2) errors.push(`${position.slot_id} must contain exactly two selected critiques.`);
    for (const raterId of position.rater_ids) {
      if (!positionsByRater.has(raterId)) positionsByRater.set(raterId, new Set());
      positionsByRater.get(raterId).add(position.position_id);
    }
  }
  if (selfCheckRecords.length !== 24) errors.push("Selection must contain exactly 24 self-check records.");
  for (const record of selfCheckRecords) {
    const key = `${record.position_id}|${record.critique_id}|${record.rater_id}`;
    if (recordKeys.has(key)) errors.push(`Duplicate self-check record key: ${key}.`);
    recordKeys.add(key);
    if (record.required_stage !== SELF_CHECK_STAGE) errors.push("Every record must use the blind_self_check stage.");
    if (record.outcome_independent_selection !== true) errors.push("Every record must preserve outcome-independent selection provenance.");
  }
  if (recordsByRater.size !== 6 || [...recordsByRater.values()].some((count) => count !== 4)) {
    errors.push("Every core rater must receive exactly four self-check records.");
  }
  if (positionsByRater.size !== 6 || [...positionsByRater.values()].some((ids) => ids.size !== 2)) {
    errors.push("Every core rater must appear in exactly two selected positions.");
  }
  if (errors.length) throw new PilotSelfCheckSelectionError(`Generated self-check selection violated invariants:\n${errors.join("\n")}`);

  return {
    selected_positions: selectedPositions.length,
    selected_topic_families: topics.size,
    selected_positions_per_topic_family: 1,
    selected_positions_per_source_class: Object.fromEntries(SOURCES.map((sourceClass) => [sourceClass, sources.get(sourceClass)])),
    selected_critiques: selectedPositions.reduce((sum, row) => sum + row.selected_critique_ids.length, 0),
    selected_critiques_per_position: 2,
    self_check_records: selfCheckRecords.length,
    core_raters: recordsByRater.size,
    self_checks_per_core_rater: 4,
    selected_positions_per_core_rater: 2,
    both_original_raters_per_selected_critique: true,
  };
}

function compareRanked(left, right) {
  return left.rank.localeCompare(right.rank) || left.canonical.localeCompare(right.canonical);
}

function normalizeAssignment(assignment) {
  return {
    slot_id: cleanId(assignment.slot_id),
    position_id: cleanId(assignment.position_id),
    topic_family: String(assignment.topic_family ?? "").trim(),
    source_class: String(assignment.source_class ?? "").trim(),
    critique_ids: normalizeIds(assignment.critique_ids).sort(),
    rater_ids: normalizeIds(assignment.rater_ids).sort(),
  };
}

function selectionRelevantAssignmentView(report) {
  return {
    report_version: report.report_version,
    programme_id: report.programme_id,
    position_assignments: (Array.isArray(report.position_assignments) ? report.position_assignments : [])
      .map(normalizeAssignment)
      .sort((left, right) => left.slot_id.localeCompare(right.slot_id)),
  };
}

function redactSeed(input) {
  return {
    ...structuredClone(input),
    seed: "[redacted-before-hash]",
    assignment_report: selectionRelevantAssignmentView(input.assignment_report),
  };
}

function* combinations(values, size, start = 0, prefix = []) {
  if (prefix.length === size) {
    yield prefix;
    return;
  }
  const remaining = size - prefix.length;
  for (let index = start; index <= values.length - remaining; index += 1) {
    yield* combinations(values, size, index + 1, [...prefix, values[index]]);
  }
}

function countBy(values, keyFunction) {
  const counts = new Map();
  for (const value of values) {
    const key = keyFunction(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function canonicalStringify(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
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
  if (positional.includes("--help") || positional.length < 3) {
    console.log("Usage: node scripts/pilot-self-check-selection.mjs <endpoint-contract.json> <assignment-report.json> <selection-input.json> [--controlled-output <private-path>]");
    console.log("selection-input.json supplies metadata, mode, seed, and authorization; its assignment_report field is replaced by the assignment-report argument.");
  } else {
    const endpointContract = JSON.parse(await readFile(resolve(positional[0]), "utf8"));
    const assignmentReport = JSON.parse(await readFile(resolve(positional[1]), "utf8"));
    const input = JSON.parse(await readFile(resolve(positional[2]), "utf8"));
    input.assignment_report = assignmentReport;
    if (input.mode === "controlled_generation" && !controlledOutput) {
      throw new PilotSelfCheckSelectionError("Controlled generation requires --controlled-output; controlled selections are never printed to stdout.");
    }
    const report = generatePilotSelfCheckSelection(endpointContract, input);
    if (input.mode === "controlled_generation") {
      const outputPath = resolve(controlledOutput);
      const workingDirectory = resolve(process.cwd());
      if (outputPath === workingDirectory || outputPath.startsWith(`${workingDirectory}${sep}`)) {
        throw new PilotSelfCheckSelectionError("Controlled selection output must be outside the repository working directory.");
      }
      await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
      await chmod(outputPath, 0o600);
    }
    console.log(JSON.stringify(sanitizePilotSelfCheckSelectionReport(report), null, 2));
  }
}
