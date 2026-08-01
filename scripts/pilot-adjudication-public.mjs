export class PilotAdjudicationPublicError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PilotAdjudicationPublicError";
    this.details = details;
  }
}

const FORBIDDEN_PUBLIC_KEYS = new Set([
  "adjudicator_id",
  "adjudicator_ids",
  "rater_id",
  "rater_ids",
  "participant_id",
  "participant_ids",
  "position_id",
  "position_ids",
  "critique_id",
  "critique_ids",
  "rating_id",
  "rating_ids",
  "initial_rating_ids",
  "latest_accepted_rating_ids",
  "case_id",
  "case_ids",
  "resolution_id",
  "resolution_ids",
  "signoff_id",
  "signoff_ids",
  "operator_id",
  "operator_ids",
  "initial_ratings",
  "case_records",
  "resolution_records",
  "signoff_records",
  "critique_records",
  "object_level_considerations",
  "residual_disagreement_summary",
  "route_dispositions",
  "case_packet_sha256",
  "individual_case_packet_hashes",
]);

export function sanitizePilotAdjudicationCaseSummary(caseSet) {
  const summary = {
    report_version: "pilot-adjudication-case-public-summary-v1",
    programme_id: caseSet?.programme_id ?? null,
    data_class: caseSet?.data_class ?? null,
    mode: caseSet?.mode ?? null,
    initial_snapshot_sha256: caseSet?.initial_snapshot_sha256 ?? null,
    analysis_policy_sha256: caseSet?.analysis_policy_sha256 ?? null,
    case_set_commitment_sha256: caseSet?.case_set_commitment_sha256 ?? null,
    counts: {
      case_count: Number(caseSet?.case_count ?? 0),
      assigned_to_two_dedicated_adjudicators:
        Object.keys(caseSet?.assignment_counts ?? {}).length === 2,
      maximum_assignment_imbalance: assignmentImbalance(caseSet?.assignment_counts),
    },
    case_kinds: countBy(caseSet?.cases ?? [], (entry) => entry.case_kind),
    distribution_authorized: false,
    adjudication_work_authorized: false,
    rerating_work_authorized: false,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    privacy: {
      contains_adjudicator_or_rater_ids: false,
      contains_position_or_critique_ids: false,
      contains_rating_ids_or_content: false,
      contains_case_ids_or_packet_hashes: false,
      contains_object_level_notes: false,
      controlled_case_packets_withheld: true,
    },
  };
  assertPublicAdjudicationSummary(summary);
  return summary;
}

export function sanitizePilotAdjudicationResolutionSummary(report) {
  const summary = {
    report_version: "pilot-adjudication-resolution-public-summary-v1",
    case_set_commitment_sha256: report?.case_set_commitment_sha256 ?? null,
    dataset_sha256: report?.dataset_sha256 ?? null,
    resolution_set_commitment_sha256: report?.resolution_set_commitment_sha256 ?? null,
    counts: {
      required_case_count: Number(report?.required_case_count ?? 0),
      accepted_closure_count: Number(report?.accepted_closure_count ?? 0),
      rejected_record_count: Number(report?.rejected_record_count ?? 0),
      open_case_count: Number(report?.open_case_count ?? 0),
      unresolved_case_count: Number(report?.unresolved_case_count ?? 0),
      candidate_adjudication_unit_count:
        report?.accepted_adjudication_unit_events?.length ?? 0,
    },
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    privacy: {
      contains_case_or_resolution_ids: false,
      contains_adjudicator_or_operator_ids: false,
      contains_item_or_rating_ids: false,
      contains_object_level_notes: false,
      controlled_resolution_records_withheld: true,
    },
  };
  assertPublicAdjudicationSummary(summary);
  return summary;
}

export function sanitizePilotFinalLabelSnapshotSummary(snapshot) {
  const summary = {
    report_version: "pilot-final-label-snapshot-public-summary-v1",
    snapshot_body_sha256: snapshot?.snapshot_body_sha256 ?? null,
    signoff_commitment_sha256: snapshot?.signoff_commitment_sha256 ?? null,
    final_snapshot_sha256: snapshot?.final_snapshot_sha256 ?? null,
    dataset_sha256: snapshot?.body?.dataset_sha256 ?? null,
    initial_snapshot_sha256: snapshot?.body?.initial_snapshot_sha256 ?? null,
    case_set_commitment_sha256: snapshot?.body?.case_set_commitment_sha256 ?? null,
    resolution_set_commitment_sha256:
      snapshot?.body?.resolution_set_commitment_sha256 ?? null,
    counts: {
      position_count: Number(snapshot?.body?.positions ?? 0),
      critique_count: Number(snapshot?.body?.critiques ?? 0),
      accepted_initial_rating_count:
        Number(snapshot?.body?.accepted_initial_ratings ?? 0),
      latest_accepted_rating_count:
        Number(snapshot?.body?.latest_accepted_ratings ?? 0),
      accepted_rerating_count: Number(snapshot?.body?.accepted_reratings ?? 0),
      required_case_count: Number(snapshot?.body?.required_cases ?? 0),
      accepted_case_closure_count:
        Number(snapshot?.body?.accepted_case_closures ?? 0),
      unresolved_case_count: Number(snapshot?.body?.unresolved_cases ?? 0),
      accepted_adjudicator_signoff_count: snapshot?.signoffs?.length ?? 0,
      candidate_signoff_unit_count:
        snapshot?.accepted_signoff_unit_events?.length ?? 0,
    },
    label_semantics: snapshot?.body?.label_semantics ?? null,
    consensus_score_created: false,
    original_initial_ratings_preserved: true,
    publication_authorized: false,
    payment_authorized: false,
    funding_submission_authorized: false,
    phase_2_authorized: false,
    privacy: {
      contains_adjudicator_rater_or_operator_ids: false,
      contains_item_rating_case_resolution_or_signoff_ids: false,
      contains_scores_rationales_or_object_level_notes: false,
      controlled_snapshot_and_signoffs_withheld: true,
    },
  };
  assertPublicAdjudicationSummary(summary);
  return summary;
}

export function assertPublicAdjudicationSummary(summary) {
  const forbidden = findKeys(summary, FORBIDDEN_PUBLIC_KEYS);
  if (forbidden.length) {
    throw new PilotAdjudicationPublicError(
      `Public adjudication output exposes controlled fields: ${forbidden.join(", ")}`,
    );
  }
  for (const field of [
    "payment_authorized",
    "funding_submission_authorized",
    "phase_2_authorized",
  ]) {
    if (summary?.[field] !== false) {
      throw new PilotAdjudicationPublicError(
        `${field} must remain false in public adjudication output.`,
      );
    }
  }
  return true;
}

function assignmentImbalance(counts) {
  const values = Object.values(counts ?? {}).filter(Number.isFinite);
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
}

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows ?? []) {
    const key = String(keyFn(row) ?? "unknown");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function findKeys(value, forbiddenKeys, path = "$") {
  const found = [];
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      found.push(...findKeys(entry, forbiddenKeys, `${path}[${index}]`));
    });
    return found;
  }
  for (const [key, entry] of Object.entries(value)) {
    const keyPath = `${path}.${key}`;
    if (forbiddenKeys.has(key)) found.push(keyPath);
    found.push(...findKeys(entry, forbiddenKeys, keyPath));
  }
  return found;
}
