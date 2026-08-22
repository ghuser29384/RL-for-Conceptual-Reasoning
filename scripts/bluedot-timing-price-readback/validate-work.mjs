import {
  EXPECTED,
  PRICE_STATUSES,
  STAGES,
} from "./constants.mjs";
import {
  clean,
  controlledId,
  expect,
  nonnegativeNumber,
  positiveNumber,
  validTime,
} from "./helpers.mjs";

export function validateWork(evidence, people, errors) {
  const rows = Array.isArray(evidence.work_units) ? evidence.work_units : [];
  expect(rows.length === 72, "exactly 72 timing records are required", errors);

  const ids = new Set();
  const counts = new Map();
  for (const [index, row] of rows.entries()) {
    const prefix = `work_units[${index}]`;
    const id = clean(row?.work_unit_id);
    const personId = clean(row?.evidence_person_id);
    const role = people.byId.get(personId)?.role;

    expect(controlledId(id) && !ids.has(id), `${prefix} needs a unique controlled id`, errors);
    ids.add(id);
    expect(people.ids.has(personId), `${prefix} references an unknown person`, errors);
    expect(
      STAGES.includes(row?.stage) && EXPECTED[role]?.[row.stage] !== undefined,
      `${prefix} stage is invalid for ${role ?? "unknown role"}`,
      errors,
    );
    expect(
      validTime(row?.started_at)
        && validTime(row?.completed_at)
        && Date.parse(row.completed_at) >= Date.parse(row.started_at),
      `${prefix} timestamps are invalid`,
      errors,
    );
    expect(
      nonnegativeNumber(row?.active_seconds)
        && nonnegativeNumber(row?.paused_seconds)
        && Number.isInteger(row?.interruption_count)
        && row.interruption_count >= 0,
      `${prefix} timing fields are invalid`,
      errors,
    );
    expect(
      row?.complete === true
        && row?.excluded === false
        && row?.exclusion_reason === null,
      `${prefix} must be complete and nonexcluded`,
      errors,
    );

    if (role && STAGES.includes(row?.stage)) {
      const key = `${role}/${row.stage}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  for (const [role, stages] of Object.entries(EXPECTED)) {
    for (const [stage, count] of Object.entries(stages)) {
      expect(
        (counts.get(`${role}/${stage}`) ?? 0) === count,
        `${role}/${stage} must contain ${count} records`,
        errors,
      );
    }
  }
  return { rows, counts };
}

export function validatePrices(evidence, people, errors) {
  const rows = Array.isArray(evidence.price_records) ? evidence.price_records : [];
  expect(rows.length === 4, "exactly four post-task price records are required", errors);

  const seen = new Set();
  const statusCounts = new Map(PRICE_STATUSES.map((status) => [status, 0]));
  for (const [index, row] of rows.entries()) {
    const prefix = `price_records[${index}]`;
    const personId = clean(row?.evidence_person_id);
    const person = people.byId.get(personId);
    expect(
      controlledId(clean(row?.price_record_id)) && person && !seen.has(personId),
      `${prefix} must bind uniquely to one person`,
      errors,
    );
    seen.add(personId);
    expect(row?.role === person?.role && row?.currency === "USD", `${prefix} role/currency mismatch`, errors);
    expect(
      row?.scope_reviewed === true
        && row?.post_task === true
        && row?.nonbinding === true
        && validTime(row?.recorded_at)
        && Date.parse(row.recorded_at) >= Date.parse(evidence.completed_at),
      `${prefix} must be post-task and nonbinding`,
      errors,
    );
    expect(PRICE_STATUSES.includes(row?.response_status), `${prefix}.response_status is invalid`, errors);
    if (PRICE_STATUSES.includes(row?.response_status)) {
      statusCounts.set(row.response_status, statusCounts.get(row.response_status) + 1);
    }

    if (row?.response_status === "usable_amount_evidence") {
      expect(
        nonnegativeNumber(row?.minimum_acceptable_fixed_honorarium_usd)
          && nonnegativeNumber(row?.preferred_fixed_honorarium_usd)
          && row.preferred_fixed_honorarium_usd >= row.minimum_acceptable_fixed_honorarium_usd
          && positiveNumber(row?.maximum_acceptable_workload_hours),
        `${prefix} usable amount fields are invalid`,
        errors,
      );
    } else {
      expect(
        row?.minimum_acceptable_fixed_honorarium_usd === null
          && row?.preferred_fixed_honorarium_usd === null,
        `${prefix} non-amount response must keep amounts null`,
        errors,
      );
    }
  }

  expect(seen.size === people.ids.size, "every person needs one price record", errors);
  return { rows, statusCounts };
}

export function validateDefects(evidence, errors) {
  const rows = Array.isArray(evidence.defects) ? evidence.defects : [];
  const ids = new Set();
  let unresolvedSerious = 0;
  for (const [index, row] of rows.entries()) {
    const id = clean(row?.defect_id);
    expect(controlledId(id) && !ids.has(id), `defects[${index}] needs a unique controlled id`, errors);
    ids.add(id);
    expect(
      ["P0", "P1", "P2", "P3"].includes(row?.severity)
        && typeof row?.resolved === "boolean",
      `defects[${index}] is invalid`,
      errors,
    );
    if (["P0", "P1"].includes(row?.severity) && row?.resolved === false) {
      unresolvedSerious += 1;
    }
  }
  return { rows, unresolvedSerious };
}
