import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";

export const INTERPRETATION_CAUSE_CODES = Object.freeze([
  "compatible_interpretations",
  "material_position_conclusion_difference",
  "material_critique_target_or_claim_difference",
  "priced_in_disagreement",
  "background_assumption_disagreement",
  "score_calibration_or_rubric_allocation_only",
  "substantive_object_level_disagreement",
  "mixed_cause",
  "unresolved_or_indeterminate",
]);
export const INTERPRETATION_ROLE_MASKS = Object.freeze(["RATER_A", "RATER_B"]);
export const PRICED_IN_ASSESSMENTS = Object.freeze(["no", "partly", "yes", "uncertain"]);
export const INTERPRETATION_CONFIDENCE_OPTIONS = Object.freeze(["high", "medium", "low"]);
export const CAUSE_CODE_STAGE = "initial_interpretation_cause_code";
export const RECONCILIATION_DISPOSITIONS = Object.freeze([
  "shared_classification",
  "coding_disagreement_preserved",
  "unresolved_classification",
]);

const EXPECTED_TOPIC_FAMILIES = Object.freeze([
  "normative_ethics",
  "political_philosophy",
  "epistemology_and_philosophy_of_science",
  "philosophy_of_mind_and_ai_consciousness",
  "decision_theory_and_social_choice",
  "metaphilosophy_and_ai_governance",
]);
const VISIBILITY_FIELDS = Object.freeze([
  "numeric_scores_visible",
  "score_gaps_visible",
  "other_adjudicator_code_visible",
  "model_judgments_visible",
  "acquisition_strata_visible",
  "aggregate_pilot_results_visible",
  "adjudication_outcomes_visible",
  "rater_identity_visible",
  "rater_seniority_visible",
]);
const CONTROLLED_AUTHORIZATION_FIELDS = Object.freeze([
  "q_006b_approved",
  "participants_confirmed",
  "cause_coding_authorized",
  "workload_and_honorarium_readback_complete",
  "private_controlled_storage_confirmed",
]);
const FORBIDDEN_BLIND_INPUT_KEYS = new Set([
  "rater_id",
  "rater_ids",
  "participant_id",
  "participant_ids",
  "scores",
  "score_vector",
  "score_vectors",
  "overall",
  "centrality",
  "strength",
  "correctness",
  "clarity",
  "dead_weight",
  "single_issue",
  "substantive_impact",
  "score_gap",
  "score_gaps",
  "overall_gap",
  "impact_gap",
  "model_judgment",
  "model_judgments",
  "model_scores",
  "acquisition_strata",
  "aggregate_results",
  "adjudication_outcome",
  "adjudication_outcomes",
]);
const FORBIDDEN_CODE_KEYS = new Set([
  ...FORBIDDEN_BLIND_INPUT_KEYS,
  "other_adjudicator_code",
  "other_adjudicator_rationale",
]);
const FORBIDDEN_RECONCILIATION_KEYS = new Set([
  "overwrite_initial_code",
  "overwrite_initial_codes",
  "replacement_code_id",
  "replacement_code_ids",
  "delete_initial_code",
  "delete_initial_codes",
  "winning_adjudicator",
  "majority_vote",
  "forced_consensus",
]);
const FORBIDDEN_PUBLIC_KEYS = new Set([
  "adjudicator_id",
  "adjudicator_ids",
  "position_id",
  "position_ids",
  "critique_id",
  "critique_ids",
  "pair_id",
  "pair_ids",
  "packet_id",
  "packet_ids",
  "code_id",
  "code_ids",
  "fingerprint_id",
  "fingerprint_ids",
  "reconciliation_id",
  "reconciliation_ids",
  "position_text",
  "critique_text",
  "position_conclusion_summary",
  "critique_target_summary",
  "background_assumptions",
  "rationale",
  "fingerprints",
  "packets",
  "initial_codes",
  "reconciliations",
  "packet_sha256",
  "individual_packet_hashes",
]);

export class PilotInterpretationCauseCodingError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PilotInterpretationCauseCodingError";
    this.details = details;
  }
}

export function validateInterpretationCauseCodingControl(endpointContract, control) {
  const errors = [];
  const d2 = endpointContract?.owner_decisions?.D2_interpretation_cause_coding_coverage;
  const pairs = Array.isArray(control?.pairs) ? control.pairs : [];
  const adjudicators = Array.isArray(control?.adjudicators) ? control.adjudicators : [];
  const authorization = objectOrEmpty(control?.authorization);

  if (endpointContract?.contract_id !== "mp-pilot-endpoint-design-amendment-v1") {
    errors.push("endpoint contract must identify mp-pilot-endpoint-design-amendment-v1.");
  }
  if (endpointContract?.status !== "approved_for_implementation_design_only") {
    errors.push("endpoint contract must remain approved_for_implementation_design_only.");
  }
  if (d2?.selected_option !== "A" || d2?.status !== "approved") {
    errors.push("D2 must remain approved option A.");
  }
  if (d2?.paired_fingerprints !== 48 || d2?.independent_adjudicators_per_pair !== 2 || d2?.all_pairs_dual_coded !== true) {
    errors.push("D2 must preserve 48 paired fingerprints and two independent adjudicators per pair.");
  }
  for (const field of [
    "numeric_scores_and_gaps_hidden_until_both_initial_codes_lock",
    "other_adjudicator_code_hidden_until_both_initial_codes_lock",
    "model_judgments_and_acquisition_strata_hidden",
    "aggregate_pilot_results_hidden",
    "adjudication_outcomes_hidden",
    "initial_codes_immutable",
    "later_reconciliation_may_not_overwrite_initial_codes",
  ]) {
    if (d2?.[field] !== true) errors.push(`D2 must preserve ${field}=true.`);
  }

  if (!nonEmptyString(control?.coding_request_id)) errors.push("coding_request_id is required.");
  if (control?.input_version !== 1) errors.push("input_version must equal 1.");
  if (control?.programme_id !== "metaphilosophy-48-critique-pilot-v1-2026-07-30") {
    errors.push("programme_id must identify the 48-critique pilot.");
  }
  if (!new Set(["synthetic_test_fixture", "private_controlled_cause_coding_input"]).has(control?.data_class)) {
    errors.push("data_class must be synthetic_test_fixture or private_controlled_cause_coding_input.");
  }
  if (!new Set(["simulation", "controlled_packet_generation"]).has(control?.mode)) {
    errors.push("mode must be simulation or controlled_packet_generation.");
  }
  if (!validIsoTimestamp(control?.opened_at)) errors.push("opened_at must be a valid ISO-8601 timestamp.");

  if (control?.mode === "simulation") {
    if (control?.data_class !== "synthetic_test_fixture") {
      errors.push("simulation mode is allowed only for synthetic_test_fixture data.");
    }
    for (const field of CONTROLLED_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== false) errors.push(`simulation authorization.${field} must remain false.`);
    }
    if (!emptyArray(authorization.approval_record_ids) || authorization.approved_at !== null) {
      errors.push("simulation mode must not contain approval records or an approval timestamp.");
    }
  }
  if (control?.mode === "controlled_packet_generation") {
    if (control?.data_class !== "private_controlled_cause_coding_input") {
      errors.push("controlled_packet_generation requires private_controlled_cause_coding_input data.");
    }
    for (const field of CONTROLLED_AUTHORIZATION_FIELDS) {
      if (authorization[field] !== true) errors.push(`controlled authorization.${field} must equal true.`);
    }
    if (!Array.isArray(authorization.approval_record_ids) || authorization.approval_record_ids.length < 3) {
      errors.push("controlled packet generation requires at least three versioned approval record IDs.");
    }
    if (!validIsoTimestamp(authorization.approved_at)) {
      errors.push("controlled packet generation requires a valid authorization.approved_at timestamp.");
    }
  }

  if (control?.rating_work_authorized !== false || control?.research_start_authorized !== false) {
    errors.push("Cause-coding control must not authorize rating work or research start.");
  }
  for (const field of ["participant_access_authorized", "recruitment_authorized", "payment_authorized", "phase_2_authorized"]) {
    if (control?.[field] !== false) errors.push(`${field} must remain false.`);
  }

  if (adjudicators.length !== 2) errors.push("Cause coding requires exactly two dedicated adjudicators.");
  const adjudicatorIds = new Set();
  for (const [index, adjudicator] of adjudicators.entries()) {
    const prefix = `adjudicators[${index}]`;
    const adjudicatorId = cleanId(adjudicator?.adjudicator_id);
    if (!controlledId(adjudicatorId)) errors.push(`${prefix}.adjudicator_id must be a controlled identifier.`);
    if (adjudicatorIds.has(adjudicatorId)) errors.push(`${prefix}.adjudicator_id must be unique.`);
    adjudicatorIds.add(adjudicatorId);
    if (control?.mode === "simulation" && !adjudicatorId.startsWith("SIM_")) {
      errors.push(`${prefix}.adjudicator_id must start with SIM_ in simulation mode.`);
    }
    for (const field of ["qualified", "consented", "calibrated", "available"]) {
      if (adjudicator?.[field] !== true) errors.push(`${prefix}.${field} must equal true.`);
    }
    const topics = normalizeStrings(adjudicator?.approved_topic_families);
    if (!sameStringSet(topics, EXPECTED_TOPIC_FAMILIES)) {
      errors.push(`${prefix}.approved_topic_families must contain all six topic families for all-48 coding.`);
    }
    for (const field of ["conflict_position_ids", "conflict_critique_ids", "prior_label_exposure_position_ids"]) {
      if (!Array.isArray(adjudicator?.[field])) errors.push(`${prefix}.${field} must be an array.`);
    }
  }

  if (pairs.length !== 48) errors.push("Cause coding requires exactly 48 paired interpretation fingerprints.");
  const pairIds = new Set();
  const critiqueIds = new Set();
  const positionToCritiques = new Map();
  const topicCounts = new Map(EXPECTED_TOPIC_FAMILIES.map((topic) => [topic, 0]));
  const fingerprintIds = new Set();
  for (const [index, pair] of pairs.entries()) {
    const prefix = `pairs[${index}]`;
    const pairId = cleanId(pair?.pair_id);
    const positionId = cleanId(pair?.position_id);
    const critiqueId = cleanId(pair?.critique_id);
    if (!controlledId(pairId)) errors.push(`${prefix}.pair_id must be a controlled identifier.`);
    if (pairIds.has(pairId)) errors.push(`${prefix}.pair_id must be unique.`);
    pairIds.add(pairId);
    if (!controlledId(positionId)) errors.push(`${prefix}.position_id must be a controlled identifier.`);
    if (!controlledId(critiqueId)) errors.push(`${prefix}.critique_id must be a controlled identifier.`);
    if (critiqueIds.has(critiqueId)) errors.push(`${prefix}.critique_id must be unique across pairs.`);
    critiqueIds.add(critiqueId);
    if (!positionToCritiques.has(positionId)) positionToCritiques.set(positionId, new Set());
    positionToCritiques.get(positionId).add(critiqueId);
    if (!topicCounts.has(pair?.topic_family)) errors.push(`${prefix}.topic_family is unsupported.`);
    else topicCounts.set(pair.topic_family, topicCounts.get(pair.topic_family) + 1);
    if (!nonEmptyString(pair?.position_text)) errors.push(`${prefix}.position_text is required.`);
    if (!nonEmptyString(pair?.critique_text)) errors.push(`${prefix}.critique_text is required.`);

    const blindPaths = findKeys(pair, FORBIDDEN_BLIND_INPUT_KEYS);
    if (blindPaths.length) errors.push(`${prefix} exposes forbidden blind-coding fields: ${blindPaths.join(", ")}.`);

    const fingerprints = Array.isArray(pair?.fingerprints) ? pair.fingerprints : [];
    if (fingerprints.length !== 2) errors.push(`${prefix}.fingerprints must contain exactly two role-masked records.`);
    const masks = new Set();
    for (const [fingerprintIndex, fingerprint] of fingerprints.entries()) {
      const fingerprintPrefix = `${prefix}.fingerprints[${fingerprintIndex}]`;
      const fingerprintId = cleanId(fingerprint?.fingerprint_id);
      if (!controlledId(fingerprintId)) errors.push(`${fingerprintPrefix}.fingerprint_id must be a controlled identifier.`);
      if (fingerprintIds.has(fingerprintId)) errors.push(`${fingerprintPrefix}.fingerprint_id must be globally unique.`);
      fingerprintIds.add(fingerprintId);
      if (!INTERPRETATION_ROLE_MASKS.includes(fingerprint?.role_mask)) {
        errors.push(`${fingerprintPrefix}.role_mask must be RATER_A or RATER_B.`);
      }
      if (masks.has(fingerprint?.role_mask)) errors.push(`${fingerprintPrefix}.role_mask must be unique within the pair.`);
      masks.add(fingerprint?.role_mask);
      if (!textWithin(fingerprint?.position_conclusion_summary, 10, 2000)) {
        errors.push(`${fingerprintPrefix}.position_conclusion_summary must contain 10-2000 characters.`);
      }
      if (!textWithin(fingerprint?.critique_target_summary, 10, 2000)) {
        errors.push(`${fingerprintPrefix}.critique_target_summary must contain 10-2000 characters.`);
      }
      if (!PRICED_IN_ASSESSMENTS.includes(fingerprint?.priced_in_assessment)) {
        errors.push(`${fingerprintPrefix}.priced_in_assessment is unsupported.`);
      }
      if (!INTERPRETATION_CONFIDENCE_OPTIONS.includes(fingerprint?.interpretation_confidence)) {
        errors.push(`${fingerprintPrefix}.interpretation_confidence is unsupported.`);
      }
      const background = String(fingerprint?.background_assumptions ?? "").trim();
      if (background.length > 4000) errors.push(`${fingerprintPrefix}.background_assumptions exceeds 4000 characters.`);
      if (
        (fingerprint?.interpretation_confidence === "low" || fingerprint?.priced_in_assessment === "uncertain")
        && background.length < 10
      ) {
        errors.push(`${fingerprintPrefix}.background_assumptions is required for low confidence or uncertain priced-in status.`);
      }
      for (const field of ["position_ambiguity", "critique_ambiguity", "insufficient_context"]) {
        if (typeof fingerprint?.[field] !== "boolean") errors.push(`${fingerprintPrefix}.${field} must be boolean.`);
      }
      if (!validIsoTimestamp(fingerprint?.locked_at)) errors.push(`${fingerprintPrefix}.locked_at must be a valid ISO timestamp.`);
      if (validIsoTimestamp(fingerprint?.locked_at) && validIsoTimestamp(control?.opened_at)) {
        if (Date.parse(fingerprint.locked_at) > Date.parse(control.opened_at)) {
          errors.push(`${fingerprintPrefix}.locked_at must not be after cause-coding opened_at.`);
        }
      }
      if (fingerprint?.immutable !== true) errors.push(`${fingerprintPrefix}.immutable must equal true.`);
    }
    if (!sameStringSet([...masks], INTERPRETATION_ROLE_MASKS)) {
      errors.push(`${prefix}.fingerprints must contain RATER_A and RATER_B exactly.`);
    }
  }

  if (positionToCritiques.size !== 12) errors.push("Cause coding must cover exactly 12 positions.");
  for (const [positionId, ids] of positionToCritiques) {
    if (ids.size !== 4) errors.push(`${positionId} must contribute exactly four critique pairs.`);
  }
  for (const [topic, count] of topicCounts) {
    if (count !== 8) errors.push(`Topic family ${topic} must contribute exactly eight critique pairs.`);
  }

  for (const [index, adjudicator] of adjudicators.entries()) {
    const conflicts = new Set([
      ...normalizeIds(adjudicator?.conflict_position_ids),
      ...normalizeIds(adjudicator?.conflict_critique_ids),
      ...normalizeIds(adjudicator?.prior_label_exposure_position_ids),
    ]);
    for (const pair of pairs) {
      if (conflicts.has(pair.position_id) || conflicts.has(pair.critique_id)) {
        errors.push(`adjudicators[${index}] is ineligible for all-48 coding because of a conflict or prior label exposure.`);
        break;
      }
    }
  }

  return {
    status: errors.length ? "fail" : "pass",
    mode: control?.mode ?? null,
    data_class: control?.data_class ?? null,
    pairs: pairs.length,
    positions: positionToCritiques.size,
    adjudicators: adjudicators.length,
    errors,
  };
}

export function generateInterpretationCauseCodingPackets(endpointContract, control) {
  const validation = validateInterpretationCauseCodingControl(endpointContract, control);
  if (validation.status !== "pass") {
    throw new PilotInterpretationCauseCodingError(`Interpretation cause-coding control is invalid:\n${validation.errors.join("\n")}`, {
      validation,
    });
  }

  const adjudicators = control.adjudicators
    .map((row) => ({ ...structuredClone(row), adjudicator_id: cleanId(row.adjudicator_id) }))
    .sort((left, right) => left.adjudicator_id.localeCompare(right.adjudicator_id));
  const pairs = control.pairs.map(normalizePair).sort((left, right) => left.pair_id.localeCompare(right.pair_id));
  const packets = [];

  for (const pair of pairs) {
    const pairCommitment = sha256(canonicalStringify(pair));
    for (const adjudicator of adjudicators) {
      const packetBody = {
        packet_id: `IC_${sha256(`${pair.pair_id}|${adjudicator.adjudicator_id}`).slice(0, 24)}`,
        pair_id: pair.pair_id,
        position_id: pair.position_id,
        critique_id: pair.critique_id,
        topic_family: pair.topic_family,
        position_text: pair.position_text,
        critique_text: pair.critique_text,
        fingerprints: pair.fingerprints,
        adjudicator_id: adjudicator.adjudicator_id,
        pair_commitment_sha256: pairCommitment,
        opened_at: control.opened_at,
        required_stage: CAUSE_CODE_STAGE,
        visibility: Object.fromEntries(VISIBILITY_FIELDS.map((field) => [field, false])),
      };
      packets.push({ ...packetBody, packet_sha256: sha256(canonicalStringify(packetBody)) });
    }
  }
  packets.sort((left, right) => left.packet_id.localeCompare(right.packet_id));

  return {
    report_version: "pilot-interpretation-cause-coding-packets-v1",
    programme_id: control.programme_id,
    data_class: control.data_class,
    mode: control.mode,
    controlled_packet_generation_authorized: control.mode === "controlled_packet_generation",
    coding_work_authorized: false,
    rating_work_authorized: false,
    research_start_authorized: false,
    participant_access_authorized: false,
    recruitment_authorized: false,
    payment_authorized: false,
    phase_2_authorized: false,
    endpoint_contract_sha256: sha256(canonicalStringify(endpointContract)),
    control_sha256: sha256(canonicalStringify(redactControlledSecrets(control))),
    packet_set_sha256: sha256(canonicalStringify(packets.map((packet) => packet.packet_sha256).sort())),
    pair_count: pairs.length,
    adjudicator_count: adjudicators.length,
    packet_count: packets.length,
    packets,
    invariants: {
      paired_fingerprints: 48,
      positions: 12,
      critiques_per_position: 4,
      independent_adjudicators_per_pair: 2,
      initial_code_records_required: 96,
      all_pairs_dual_coded: true,
      role_masked: true,
      numeric_scores_and_gaps_hidden: true,
      other_adjudicator_code_hidden: true,
      model_judgments_and_acquisition_strata_hidden: true,
      aggregate_results_hidden: true,
      adjudication_outcomes_hidden: true,
    },
    governance: {
      approved_option: "D2_A",
      initial_codes_immutable: true,
      reconciliation_may_not_overwrite_initial_codes: true,
      complete_all_48_denominator_required: true,
      coding_packets_do_not_start_work: true,
      workload_and_honorarium_readback_required_before_named_commitments: true,
      current_adjudication_reserve_changed: false,
    },
  };
}

export function validateInterpretationCauseCodeDataset(packetReport, dataset, options = {}) {
  const requireComplete = options.requireComplete !== false;
  const errors = [];
  const packets = Array.isArray(packetReport?.packets) ? packetReport.packets : [];
  const codes = Array.isArray(dataset?.initial_codes) ? dataset.initial_codes : [];
  const packetById = new Map(packets.map((packet) => [packet.packet_id, packet]));
  const pairIds = new Set(packets.map((packet) => packet.pair_id));
  const packetIdsSeen = new Set();
  const codeIds = new Set();
  const codesByPair = new Map();

  if (packetReport?.report_version !== "pilot-interpretation-cause-coding-packets-v1") {
    errors.push("packetReport must identify pilot-interpretation-cause-coding-packets-v1.");
  }
  if (packetReport?.coding_work_authorized !== false || packetReport?.research_start_authorized !== false) {
    errors.push("packetReport must not authorize coding work or research start.");
  }
  if (!nonEmptyString(dataset?.dataset_id)) errors.push("dataset_id is required.");
  if (dataset?.dataset_version !== 1) errors.push("dataset_version must equal 1.");
  if (dataset?.programme_id !== packetReport?.programme_id) errors.push("dataset programme_id must match packetReport.");
  if (dataset?.data_class !== packetReport?.data_class) errors.push("dataset data_class must match packetReport.");
  if (dataset?.initial_codes_immutable !== true) errors.push("dataset initial_codes_immutable must equal true.");
  if (dataset?.rating_work_authorized !== false || dataset?.research_start_authorized !== false) {
    errors.push("dataset must not authorize rating work or research start.");
  }

  for (const [index, code] of codes.entries()) {
    const prefix = `initial_codes[${index}]`;
    const codeId = cleanId(code?.code_id);
    const packetId = cleanId(code?.packet_id);
    const pairId = cleanId(code?.pair_id);
    const adjudicatorId = cleanId(code?.adjudicator_id);
    const packet = packetById.get(packetId);
    if (!controlledId(codeId)) errors.push(`${prefix}.code_id must be a controlled identifier.`);
    if (codeIds.has(codeId)) errors.push(`${prefix}.code_id must be unique.`);
    codeIds.add(codeId);
    if (!packet) errors.push(`${prefix}.packet_id must reference a known packet.`);
    if (packetIdsSeen.has(packetId)) errors.push(`${prefix}.packet_id already has an initial code.`);
    packetIdsSeen.add(packetId);
    if (!pairIds.has(pairId)) errors.push(`${prefix}.pair_id must reference a known pair.`);
    if (packet && packet.pair_id !== pairId) errors.push(`${prefix}.pair_id must match its packet.`);
    if (packet && packet.adjudicator_id !== adjudicatorId) errors.push(`${prefix}.adjudicator_id must match its packet.`);
    if (code?.stage !== CAUSE_CODE_STAGE) errors.push(`${prefix}.stage must equal ${CAUSE_CODE_STAGE}.`);
    if (code?.version !== 1) errors.push(`${prefix}.version must equal 1.`);
    if (code?.predecessor_code_id !== null) errors.push(`${prefix}.predecessor_code_id must be null.`);
    if (code?.immutable !== true) errors.push(`${prefix}.immutable must equal true.`);
    const selectedCodes = normalizeStrings(code?.cause_codes);
    if (!Array.isArray(code?.cause_codes) || selectedCodes.length === 0) errors.push(`${prefix}.cause_codes must be a non-empty array.`);
    if (new Set(selectedCodes).size !== selectedCodes.length) errors.push(`${prefix}.cause_codes must be unique.`);
    if (selectedCodes.some((value) => !INTERPRETATION_CAUSE_CODES.includes(value))) {
      errors.push(`${prefix}.cause_codes contains an unsupported value.`);
    }
    if (selectedCodes.includes("compatible_interpretations") && selectedCodes.length !== 1) {
      errors.push(`${prefix}.compatible_interpretations cannot be combined with another cause code.`);
    }
    if (selectedCodes.includes("unresolved_or_indeterminate") && selectedCodes.length !== 1) {
      errors.push(`${prefix}.unresolved_or_indeterminate cannot be combined with another cause code.`);
    }
    if (!textWithin(code?.rationale, 20, 8000)) errors.push(`${prefix}.rationale must contain 20-8000 characters.`);
    if (!validIsoTimestamp(code?.locked_at)) errors.push(`${prefix}.locked_at must be a valid ISO timestamp.`);
    if (packet && validIsoTimestamp(code?.locked_at) && Date.parse(code.locked_at) < Date.parse(packet.opened_at)) {
      errors.push(`${prefix}.locked_at must not precede packet opened_at.`);
    }
    for (const field of VISIBILITY_FIELDS) {
      if (code?.visibility_attestation?.[field] !== false) {
        errors.push(`${prefix}.visibility_attestation.${field} must equal false.`);
      }
    }
    const forbiddenPaths = findKeys(code, FORBIDDEN_CODE_KEYS);
    if (forbiddenPaths.length) errors.push(`${prefix} exposes forbidden blind-coding fields: ${forbiddenPaths.join(", ")}.`);
    if (!codesByPair.has(pairId)) codesByPair.set(pairId, []);
    codesByPair.get(pairId).push({ ...code, cause_codes: selectedCodes });
  }

  if (requireComplete) {
    if (packets.length !== 96) errors.push("Complete packet report must contain exactly 96 packets.");
    if (codes.length !== 96) errors.push("Complete cause-code dataset must contain exactly 96 initial codes.");
    if (packetIdsSeen.size !== packets.length) errors.push("Every packet must have exactly one initial cause code.");
    if (codesByPair.size !== 48) errors.push("Complete cause-code dataset must cover all 48 pairs.");
    for (const pairId of pairIds) {
      const rows = codesByPair.get(pairId) ?? [];
      if (rows.length !== 2) errors.push(`${pairId} must have exactly two initial cause codes.`);
      if (new Set(rows.map((row) => row.adjudicator_id)).size !== 2) {
        errors.push(`${pairId} must be coded by two distinct adjudicators.`);
      }
    }
  }

  return {
    status: errors.length ? "fail" : "pass",
    dataset_id: dataset?.dataset_id ?? null,
    initial_codes: codes.length,
    covered_pairs: codesByPair.size,
    complete_required: requireComplete,
    errors,
  };
}

export function validateInterpretationCauseReconciliations(packetReport, codeDataset, reconciliations) {
  const errors = [];
  const codes = Array.isArray(codeDataset?.initial_codes) ? codeDataset.initial_codes : [];
  const rows = Array.isArray(reconciliations) ? reconciliations : [];
  const codeById = new Map(codes.map((code) => [code.code_id, code]));
  const codesByPair = groupBy(codes, (code) => code.pair_id);
  const pairIds = new Set((packetReport?.packets ?? []).map((packet) => packet.pair_id));
  const reconciliationIds = new Set();
  const reconciledPairs = new Set();

  for (const [index, row] of rows.entries()) {
    const prefix = `reconciliations[${index}]`;
    const reconciliationId = cleanId(row?.reconciliation_id);
    const pairId = cleanId(row?.pair_id);
    if (!controlledId(reconciliationId)) errors.push(`${prefix}.reconciliation_id must be a controlled identifier.`);
    if (reconciliationIds.has(reconciliationId)) errors.push(`${prefix}.reconciliation_id must be unique.`);
    reconciliationIds.add(reconciliationId);
    if (!pairIds.has(pairId)) errors.push(`${prefix}.pair_id must reference a known pair.`);
    if (reconciledPairs.has(pairId)) errors.push(`${prefix}.pair_id may have at most one accepted reconciliation record.`);
    reconciledPairs.add(pairId);
    const initialCodeIds = normalizeIds(row?.initial_code_ids).sort();
    const expectedCodeIds = (codesByPair.get(pairId) ?? []).map((code) => code.code_id).sort();
    if (initialCodeIds.length !== 2 || !sameStringArray(initialCodeIds, expectedCodeIds)) {
      errors.push(`${prefix}.initial_code_ids must reference both immutable initial codes for the pair exactly.`);
    }
    if (initialCodeIds.some((codeId) => !codeById.has(codeId))) errors.push(`${prefix}.initial_code_ids contains an unknown code.`);
    if (!RECONCILIATION_DISPOSITIONS.includes(row?.disposition)) errors.push(`${prefix}.disposition is unsupported.`);
    const reconciledCodes = normalizeStrings(row?.cause_codes);
    if (row?.disposition === "shared_classification") {
      if (reconciledCodes.length === 0) errors.push(`${prefix}.cause_codes is required for shared_classification.`);
      if (reconciledCodes.some((value) => !INTERPRETATION_CAUSE_CODES.includes(value))) {
        errors.push(`${prefix}.cause_codes contains an unsupported value.`);
      }
    } else if (reconciledCodes.length !== 0) {
      errors.push(`${prefix}.cause_codes must be empty when disagreement or unresolved classification is preserved.`);
    }
    if (!textWithin(row?.rationale, 20, 8000)) errors.push(`${prefix}.rationale must contain 20-8000 characters.`);
    if (!validIsoTimestamp(row?.locked_at)) errors.push(`${prefix}.locked_at must be a valid ISO timestamp.`);
    const pairCodes = codesByPair.get(pairId) ?? [];
    const latestCodeLock = maximumTimestamp(pairCodes.map((code) => code.locked_at));
    if (latestCodeLock && validIsoTimestamp(row?.locked_at) && Date.parse(row.locked_at) <= latestCodeLock) {
      errors.push(`${prefix}.locked_at must be after both initial cause codes.`);
    }
    if (row?.initial_codes_preserved !== true) errors.push(`${prefix}.initial_codes_preserved must equal true.`);
    if (row?.overwrites_initial_codes !== false) errors.push(`${prefix}.overwrites_initial_codes must equal false.`);
    if (row?.forced_consensus_prohibited !== true) errors.push(`${prefix}.forced_consensus_prohibited must equal true.`);
    const forbiddenPaths = findKeys(row, FORBIDDEN_RECONCILIATION_KEYS);
    if (forbiddenPaths.length) errors.push(`${prefix} contains forbidden overwrite or consensus fields: ${forbiddenPaths.join(", ")}.`);
  }

  return {
    status: errors.length ? "fail" : "pass",
    reconciliation_records: rows.length,
    errors,
  };
}

export function analyzeInterpretationCauseCodes(packetReport, codeDataset, reconciliations = []) {
  const codeValidation = validateInterpretationCauseCodeDataset(packetReport, codeDataset, { requireComplete: true });
  if (codeValidation.status !== "pass") {
    throw new PilotInterpretationCauseCodingError(`Interpretation cause-code dataset is invalid:\n${codeValidation.errors.join("\n")}`, {
      codeValidation,
    });
  }
  const reconciliationValidation = validateInterpretationCauseReconciliations(packetReport, codeDataset, reconciliations);
  if (reconciliationValidation.status !== "pass") {
    throw new PilotInterpretationCauseCodingError(
      `Interpretation cause-code reconciliations are invalid:\n${reconciliationValidation.errors.join("\n")}`,
      { reconciliationValidation },
    );
  }

  const codesByPair = groupBy(codeDataset.initial_codes, (code) => code.pair_id);
  const reconciliationByPair = new Map(reconciliations.map((row) => [row.pair_id, row]));
  const adjudicatorIds = [...new Set(codeDataset.initial_codes.map((code) => code.adjudicator_id))].sort();
  const coderRoleById = new Map(adjudicatorIds.map((id, index) => [id, `coder_${index + 1}`]));
  const countsByCoderRole = Object.fromEntries(adjudicatorIds.map((id) => [coderRoleById.get(id), emptyCauseCount()]));
  const pairAnyCauseCounts = emptyCauseCount();
  const reconciliationDispositionCounts = Object.fromEntries(RECONCILIATION_DISPOSITIONS.map((value) => [value, 0]));
  let exactAgreement = 0;
  let rawDisagreement = 0;
  let rawUnresolved = 0;
  let finalUnresolved = 0;

  for (const [pairId, pairCodes] of codesByPair) {
    const sortedRows = [...pairCodes].sort((left, right) => left.adjudicator_id.localeCompare(right.adjudicator_id));
    const leftSet = normalizeStrings(sortedRows[0].cause_codes).sort();
    const rightSet = normalizeStrings(sortedRows[1].cause_codes).sort();
    const agrees = sameStringArray(leftSet, rightSet);
    if (agrees) exactAgreement += 1;
    else rawDisagreement += 1;
    if (!agrees || leftSet.includes("unresolved_or_indeterminate") || rightSet.includes("unresolved_or_indeterminate")) {
      rawUnresolved += 1;
    }
    for (const row of sortedRows) {
      const roleCounts = countsByCoderRole[coderRoleById.get(row.adjudicator_id)];
      for (const cause of normalizeStrings(row.cause_codes)) roleCounts[cause] += 1;
    }
    for (const cause of new Set([...leftSet, ...rightSet])) pairAnyCauseCounts[cause] += 1;

    const reconciliation = reconciliationByPair.get(pairId);
    if (reconciliation) {
      reconciliationDispositionCounts[reconciliation.disposition] += 1;
      if (reconciliation.disposition !== "shared_classification") finalUnresolved += 1;
    } else if (!agrees || leftSet.includes("unresolved_or_indeterminate") || rightSet.includes("unresolved_or_indeterminate")) {
      finalUnresolved += 1;
    }
  }

  const controlledAnalysis = {
    pair_count: codesByPair.size,
    initial_code_count: codeDataset.initial_codes.length,
    exact_agreement_pairs: exactAgreement,
    raw_disagreement_pairs: rawDisagreement,
    raw_unresolved_or_disagreed_pairs: rawUnresolved,
    exact_agreement_rate: exactAgreement / codesByPair.size,
    raw_disagreement_rate: rawDisagreement / codesByPair.size,
    cause_code_counts_by_coder_role: countsByCoderRole,
    pair_any_cause_counts: pairAnyCauseCounts,
    reconciliation_records: reconciliations.length,
    reconciliation_disposition_counts: reconciliationDispositionCounts,
    final_unresolved_pairs: finalUnresolved,
    final_unresolved_rate: finalUnresolved / codesByPair.size,
  };

  return {
    report_version: "pilot-interpretation-cause-coding-analysis-v1",
    programme_id: codeDataset.programme_id,
    data_class: codeDataset.data_class,
    diagnostic_only: true,
    rating_work_authorized: false,
    research_start_authorized: false,
    payment_authorized: false,
    phase_2_authorized: false,
    packet_set_sha256: packetReport.packet_set_sha256,
    code_dataset_sha256: sha256(canonicalStringify(codeDataset)),
    reconciliation_set_sha256: sha256(canonicalStringify(reconciliations)),
    analysis: controlledAnalysis,
    workload_readback: {
      paired_fingerprints: 48,
      independent_initial_cause_code_records: 96,
      source_derived_minutes_per_cause_code: null,
      source_derived_total_cause_coding_hours: null,
      reason_duration_not_estimated: "LMCA does not report a time-per-interpretation-cause-code estimate.",
      current_adjudication_reserve_usd: 100,
      current_reserve_changed: false,
      current_reserve_shown_sufficient: false,
      workload_and_honorarium_reestimate_required_before_named_commitments: true,
    },
    governance: {
      all_48_denominator_reported: true,
      dual_independent_initial_codes_preserved: true,
      raw_agreement_and_disagreement_reported: true,
      unresolved_classification_preserved: true,
      no_forced_consensus: true,
      no_initial_code_overwrite: true,
    },
  };
}

export function sanitizeInterpretationCauseCodingPacketReport(report) {
  const publicReport = {
    report_version: "pilot-interpretation-cause-coding-packets-public-summary-v1",
    programme_id: report.programme_id,
    data_class: report.data_class,
    mode: report.mode,
    controlled_packet_generation_authorized: report.controlled_packet_generation_authorized === true,
    coding_work_authorized: false,
    rating_work_authorized: false,
    research_start_authorized: false,
    participant_access_authorized: false,
    recruitment_authorized: false,
    payment_authorized: false,
    phase_2_authorized: false,
    endpoint_contract_sha256: report.endpoint_contract_sha256,
    control_sha256: report.control_sha256,
    packet_set_sha256: report.packet_set_sha256,
    pair_count: report.pair_count,
    adjudicator_count: report.adjudicator_count,
    packet_count: report.packet_count,
    invariants: report.invariants,
    governance: report.governance,
    privacy: {
      contains_item_ids_or_text: false,
      contains_fingerprints: false,
      contains_adjudicator_ids: false,
      contains_individual_packet_hashes: false,
      controlled_packets_withheld: true,
    },
  };
  assertPublicInterpretationCauseCodingReport(publicReport);
  return publicReport;
}

export function sanitizeInterpretationCauseCodingAnalysis(report) {
  const publicReport = {
    report_version: "pilot-interpretation-cause-coding-analysis-public-v1",
    programme_id: report.programme_id,
    data_class: report.data_class,
    diagnostic_only: true,
    rating_work_authorized: false,
    research_start_authorized: false,
    payment_authorized: false,
    phase_2_authorized: false,
    packet_set_sha256: report.packet_set_sha256,
    code_dataset_sha256: report.code_dataset_sha256,
    reconciliation_set_sha256: report.reconciliation_set_sha256,
    analysis: report.analysis,
    workload_readback: report.workload_readback,
    governance: report.governance,
    privacy: {
      contains_item_ids_or_text: false,
      contains_fingerprints: false,
      contains_adjudicator_ids: false,
      contains_individual_codes_or_rationales: false,
      contains_reconciliation_rationales: false,
    },
  };
  assertPublicInterpretationCauseCodingReport(publicReport);
  return publicReport;
}

export function assertPublicInterpretationCauseCodingReport(report) {
  const forbidden = findKeys(report, FORBIDDEN_PUBLIC_KEYS);
  if (forbidden.length) {
    throw new PilotInterpretationCauseCodingError(`Public interpretation-coding report exposes controlled fields: ${forbidden.join(", ")}`);
  }
  for (const key of ["rating_work_authorized", "research_start_authorized", "payment_authorized", "phase_2_authorized"]) {
    if (report?.[key] !== false) throw new PilotInterpretationCauseCodingError(`Public report ${key} must remain false.`);
  }
  return true;
}

function normalizePair(pair) {
  return {
    pair_id: cleanId(pair.pair_id),
    position_id: cleanId(pair.position_id),
    critique_id: cleanId(pair.critique_id),
    topic_family: String(pair.topic_family ?? "").trim(),
    position_text: String(pair.position_text ?? "").trim(),
    critique_text: String(pair.critique_text ?? "").trim(),
    fingerprints: pair.fingerprints
      .map((fingerprint) => ({
        fingerprint_id: cleanId(fingerprint.fingerprint_id),
        role_mask: fingerprint.role_mask,
        position_conclusion_summary: String(fingerprint.position_conclusion_summary ?? "").trim(),
        critique_target_summary: String(fingerprint.critique_target_summary ?? "").trim(),
        priced_in_assessment: fingerprint.priced_in_assessment,
        interpretation_confidence: fingerprint.interpretation_confidence,
        background_assumptions: String(fingerprint.background_assumptions ?? "").trim(),
        position_ambiguity: fingerprint.position_ambiguity,
        critique_ambiguity: fingerprint.critique_ambiguity,
        insufficient_context: fingerprint.insufficient_context,
        locked_at: fingerprint.locked_at,
        immutable: fingerprint.immutable,
      }))
      .sort((left, right) => left.role_mask.localeCompare(right.role_mask)),
  };
}

function redactControlledSecrets(control) {
  return {
    ...structuredClone(control),
    adjudicators: control.adjudicators.map((row) => ({ ...row, adjudicator_id: "[controlled-id-redacted]" })),
    pairs: control.pairs.map(normalizePair),
  };
}

function emptyCauseCount() {
  return Object.fromEntries(INTERPRETATION_CAUSE_CODES.map((cause) => [cause, 0]));
}

function maximumTimestamp(values) {
  const timestamps = values.filter(validIsoTimestamp).map((value) => Date.parse(value));
  return timestamps.length ? Math.max(...timestamps) : null;
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

function groupBy(values, keyFunction) {
  const groups = new Map();
  for (const value of values) {
    const key = keyFunction(value);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(value);
  }
  return groups;
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

function sameStringArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function textWithin(value, minimum, maximum) {
  return typeof value === "string" && value.trim().length >= minimum && value.trim().length <= maximum;
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
    console.log("Usage: node scripts/pilot-interpretation-cause-coding.mjs <endpoint-contract.json> <cause-coding-control.json> [--controlled-output <private-path>]");
  } else {
    const endpointContract = JSON.parse(await readFile(resolve(positional[0]), "utf8"));
    const control = JSON.parse(await readFile(resolve(positional[1]), "utf8"));
    if (control.mode === "controlled_packet_generation" && !controlledOutput) {
      throw new PilotInterpretationCauseCodingError("Controlled packet generation requires --controlled-output; controlled packets are never printed to stdout.");
    }
    const report = generateInterpretationCauseCodingPackets(endpointContract, control);
    if (control.mode === "controlled_packet_generation") {
      const outputPath = resolve(controlledOutput);
      const workingDirectory = resolve(process.cwd());
      if (outputPath === workingDirectory || outputPath.startsWith(`${workingDirectory}${sep}`)) {
        throw new PilotInterpretationCauseCodingError("Controlled packet output must be outside the repository working directory.");
      }
      await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
      await chmod(outputPath, 0o600);
    }
    console.log(JSON.stringify(sanitizeInterpretationCauseCodingPacketReport(report), null, 2));
  }
}
