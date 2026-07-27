import assert from "node:assert/strict";
import test from "node:test";

import { calculatePilotHonorariaLedger } from "../scripts/calculate-pilot-honoraria.mjs";

function completeLedger() {
  return {
    mode: "normal_completion",
    core: {
      contributors: [
        { id: "rater-a", eligible: true, accepted_initial_ratings: 16, accepted_substantive_reratings: 0 },
        { id: "rater-b", eligible: true, accepted_initial_ratings: 16, accepted_substantive_reratings: 0 },
        { id: "rater-c", eligible: true, accepted_initial_ratings: 16, accepted_substantive_reratings: 0 },
        { id: "rater-d", eligible: true, accepted_initial_ratings: 16, accepted_substantive_reratings: 0 },
        { id: "rater-e", eligible: true, accepted_initial_ratings: 16, accepted_substantive_reratings: 0 },
        { id: "rater-f", eligible: true, accepted_initial_ratings: 16, accepted_substantive_reratings: 0 },
      ],
    },
    adjudication: {
      obligation_units: 4,
      contributors: [
        { id: "adviser-a", eligible: true, accepted_case_closures: 2, accepted_final_signoffs: 0 },
        { id: "adviser-b", eligible: true, accepted_case_closures: 1, accepted_final_signoffs: 1 },
      ],
    },
  };
}

test("distributes the complete USD 400 and USD 100 pilot pools", () => {
  const ledger = calculatePilotHonorariaLedger(completeLedger());
  assert.equal(ledger.core.accepted_initial_ratings, 96);
  assert.equal(ledger.core.paid_cents, 40_000);
  assert.equal(ledger.adjudication.paid_cents, 10_000);
  assert.equal(ledger.total.paid_cents, 50_000);
  assert.equal(ledger.total.unspent_cents, 0);
  assert.deepEqual(
    ledger.core.payouts.map((row) => row.amount_cents).sort((a, b) => a - b),
    [6666, 6666, 6667, 6667, 6667, 6667],
  );
});

test("scales released funds on an owner-approved early closure", () => {
  const input = completeLedger();
  input.mode = "owner_approved_early_closure";
  input.core.contributors = [
    { id: "rater-a", eligible: true, accepted_initial_ratings: 24, accepted_substantive_reratings: 0 },
    { id: "rater-b", eligible: true, accepted_initial_ratings: 24, accepted_substantive_reratings: 0 },
  ];
  input.adjudication.obligation_units = 4;
  input.adjudication.contributors = [
    { id: "adviser-a", eligible: true, accepted_case_closures: 1, accepted_final_signoffs: 0 },
  ];
  const ledger = calculatePilotHonorariaLedger(input);
  assert.equal(ledger.core.released_cents, 20_000);
  assert.equal(ledger.adjudication.released_cents, 2_500);
  assert.equal(ledger.total.unspent_cents, 27_500);
});

test("rejects normal completion without exactly 96 initial ratings", () => {
  const input = completeLedger();
  input.core.contributors[0].accepted_initial_ratings = 15;
  assert.throws(() => calculatePilotHonorariaLedger(input), /exactly 96/);
});

test("leaves the adjudication reserve unspent when no obligations open", () => {
  const input = completeLedger();
  input.adjudication.obligation_units = 0;
  input.adjudication.contributors = [];
  const ledger = calculatePilotHonorariaLedger(input);
  assert.equal(ledger.adjudication.paid_cents, 0);
  assert.equal(ledger.adjudication.unspent_cents, 10_000);
  assert.equal(ledger.total.paid_cents, 40_000);
});
