import { expect, object, text, validTime } from "./helpers.mjs";
import {
  validateAuthorization,
  validatePeople,
  validateSelection,
} from "./validate-identity.mjs";
import {
  validateDefects,
  validatePrices,
  validateWork,
} from "./validate-work.mjs";

export function validateBlueDotTimingPriceEvidence(contract, evidence) {
  const errors = [];
  const candidate = object(evidence);

  expect(
    contract?.contract_id === "mp-bluedot-timing-price-validation-v1",
    "wrong protocol contract",
    errors,
  );
  expect(
    candidate.protocol_contract_id === contract?.contract_id,
    "evidence must bind the exact protocol",
    errors,
  );
  expect(
    candidate.input_version === 1 && text(candidate.evidence_id),
    "evidence identity/version is invalid",
    errors,
  );
  expect(
    ["simulation", "controlled_evidence_validation"].includes(candidate.mode),
    "unsupported evidence mode",
    errors,
  );
  expect(
    ["synthetic_test_fixture", "private_qualified_timing_price_evidence"].includes(candidate.data_class),
    "unsupported data class",
    errors,
  );
  expect(
    validTime(candidate.started_at)
      && validTime(candidate.completed_at)
      && Date.parse(candidate.completed_at) >= Date.parse(candidate.started_at),
    "evidence timestamps are invalid",
    errors,
  );

  if (candidate.mode === "simulation") {
    expect(
      candidate.data_class === "synthetic_test_fixture" && candidate.fixture_only === true,
      "simulation must be fixture-only synthetic data",
      errors,
    );
  } else {
    expect(
      candidate.data_class === "private_qualified_timing_price_evidence" && candidate.fixture_only === false,
      "controlled evidence must be private qualified evidence",
      errors,
    );
  }

  validateAuthorization(candidate, errors);
  const people = validatePeople(candidate, errors);
  const selection = validateSelection(candidate, errors);
  const work = validateWork(candidate, people, errors);
  const prices = validatePrices(candidate, people, errors);
  const defects = validateDefects(candidate, errors);

  return {
    status: errors.length ? "fail" : "pass",
    errors,
    people,
    selection,
    work,
    prices,
    defects,
  };
}
