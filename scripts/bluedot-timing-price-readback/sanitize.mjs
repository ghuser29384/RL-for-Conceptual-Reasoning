import {
  EXPECTED,
  FORBIDDEN_PUBLIC_KEYS,
} from "./constants.mjs";
import {
  clean,
  findForbidden,
  hash,
  median,
  sum,
} from "./helpers.mjs";

export function readinessState(contract, evidence, validation) {
  if (validation.defects.unresolvedSerious) {
    return "blocked_by_unresolved_serious_defect";
  }
  if (evidence.mode === "simulation") {
    return contract.readiness_states.synthetic_complete_state;
  }

  const redesign = (validation.prices.statusCounts.get("declines_fixed_honorarium_model") ?? 0)
    + (validation.prices.statusCounts.get("needs_scope_revision") ?? 0);
  return redesign
    ? contract.readiness_states.controlled_complete_decline_or_scope_revision_state
    : contract.readiness_states.controlled_complete_usable_price_state;
}

export function buildSanitizedPublicReadback(contract, evidence, validation, readiness) {
  const timingSummaries = [];
  const minimumCell = contract.privacy_and_publication.minimum_public_cell_size;

  for (const [role, stages] of Object.entries(EXPECTED)) {
    for (const stage of Object.keys(stages)) {
      const values = validation.work.rows
        .filter((row) => (
          validation.people.byId.get(clean(row.evidence_person_id))?.role === role
            && row.stage === stage
        ))
        .map((row) => row.active_seconds)
        .sort((a, b) => a - b);

      const summary = {
        role,
        stage,
        record_count: values.length,
        suppressed_small_cell: values.length < minimumCell,
      };
      if (values.length >= minimumCell) {
        Object.assign(summary, {
          total_active_seconds: sum(values),
          minimum_active_seconds: values[0],
          median_active_seconds: median(values),
          maximum_active_seconds: values.at(-1),
        });
      }
      timingSummaries.push(summary);
    }
  }

  const publicReadback = {
    report_id: "mp-bluedot-timing-price-public-readback-v1",
    protocol_contract_id: contract.contract_id,
    evidence_commitment_sha256: hash(evidence),
    evidence_class: evidence.mode === "simulation"
      ? "synthetic_fixture_only"
      : "private_qualified_evidence_sanitized",
    readiness_state: readiness,
    counts: {
      distinct_people: validation.people.rows.length,
      rater_role_people: validation.people.roles.get("rater"),
      cause_coder_role_people: validation.people.roles.get("cause_coder"),
      timed_work_unit_records: validation.work.rows.length,
      complete_nonbinding_price_records_by_role: {
        rater: validation.prices.rows.filter((row) => row.role === "rater").length,
        cause_coder: validation.prices.rows.filter((row) => row.role === "cause_coder").length,
      },
      unresolved_p0_or_p1_defects: validation.defects.unresolvedSerious,
    },
    timing_summaries: timingSummaries,
    price_evidence_boundary: {
      individual_amounts_public: false,
      role_level_two_person_ranges_public: false,
      bluedot_request_amount_usd: null,
      individual_role_allocations_usd: null,
      automatic_amount_selection: false,
      owner_decision_required: true,
    },
    claim_boundary: {
      expert_usability_validation: false,
      completed_research_study: false,
      metaphilosophy_research_ratings_created: false,
      benchmark_validated: false,
      expert_reliability_established: false,
      model_improvement_established: false,
      payment_promised: false,
    },
    authorization: {
      external_outreach_authorized: false,
      participant_access_authorized: false,
      research_start_authorized: false,
      payment_authorized: false,
      grant_submission_authorized: false,
      deployment_authorized: false,
      production_or_staging_mutation_authorized: false,
    },
    private_details_included: false,
  };

  const forbidden = findForbidden(publicReadback, FORBIDDEN_PUBLIC_KEYS);
  if (forbidden.length) {
    throw new Error(`public readback leaked private fields: ${forbidden.join(", ")}`);
  }
  return publicReadback;
}
