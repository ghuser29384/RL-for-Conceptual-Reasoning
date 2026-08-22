import {
  ALWAYS_FALSE,
  CONTROLLED_AUTH,
  PERSON_READY,
  ROLES,
} from "./constants.mjs";
import {
  clean,
  controlledId,
  expect,
  object,
  sameSet,
  validTime,
} from "./helpers.mjs";

export function validateAuthorization(evidence, errors) {
  const authorization = object(evidence.authorization);
  if (evidence.mode === "simulation") {
    for (const key of CONTROLLED_AUTH) {
      expect(authorization[key] === false, `simulation authorization.${key} must be false`, errors);
    }
    expect(
      Array.isArray(authorization.approval_record_ids)
        && authorization.approval_record_ids.length === 0
        && authorization.approved_at === null,
      "simulation must not carry approvals",
      errors,
    );
  } else {
    for (const key of CONTROLLED_AUTH) {
      expect(authorization[key] === true, `controlled authorization.${key} must be true`, errors);
    }
    expect(
      Array.isArray(authorization.approval_record_ids)
        && authorization.approval_record_ids.length >= 4
        && validTime(authorization.approved_at),
      "controlled evidence needs versioned approvals",
      errors,
    );
  }

  for (const key of ALWAYS_FALSE) {
    expect(evidence[key] === false, `${key} must remain false`, errors);
  }
}

export function validatePeople(evidence, errors) {
  const rows = Array.isArray(evidence.people) ? evidence.people : [];
  expect(rows.length === 4, "exactly four people are required", errors);

  const ids = new Set();
  const roles = new Map(ROLES.map((role) => [role, 0]));
  for (const [index, row] of rows.entries()) {
    const prefix = `people[${index}]`;
    const id = clean(row?.evidence_person_id);
    expect(controlledId(id) && !ids.has(id), `${prefix} needs a unique controlled pseudonym`, errors);
    ids.add(id);
    expect(ROLES.includes(row?.role), `${prefix}.role is invalid`, errors);
    if (ROLES.includes(row?.role)) roles.set(row.role, roles.get(row.role) + 1);
    expect(
      evidence.mode === "simulation"
        ? id.startsWith("SIM_") && row?.simulated === true
        : !id.startsWith("SIM_") && row?.simulated === false,
      `${prefix} simulation marker is inconsistent`,
      errors,
    );
    for (const field of PERSON_READY) {
      expect(row?.[field] === true, `${prefix}.${field} must be complete`, errors);
    }
  }

  for (const role of ROLES) {
    expect(roles.get(role) === 2, `exactly two ${role} people are required`, errors);
  }

  return {
    rows,
    ids,
    roles,
    byId: new Map(rows.map((row) => [clean(row.evidence_person_id), row])),
  };
}

export function validateSelection(evidence, errors) {
  const selection = object(evidence.self_check_selection);
  expect(
    validTime(selection.frozen_at)
      && Date.parse(selection.frozen_at) <= Date.parse(evidence.started_at),
    "self-check selection must be frozen before timed work",
    errors,
  );
  expect(
    sameSet(selection.selected_slots, ["P1/C1", "P2/C1"]),
    "self-check selection must contain one frozen critique per position",
    errors,
  );
  return selection;
}
