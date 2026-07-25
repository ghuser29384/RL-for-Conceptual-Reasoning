import assert from "node:assert/strict";
import test from "node:test";

import { calculateHonorariaLedger, distributeCents } from "../scripts/calculate-honoraria.mjs";

test("allocates the full completion pools exactly by accepted units", () => {
  const ledger = calculateHonorariaLedger({
    mode: "normal_completion",
    core: {
      contributors: [
        { id: "r1", eligible: true, accepted_initial_ratings: 134, accepted_substantive_reratings: 0 },
        { id: "r2", eligible: true, accepted_initial_ratings: 134, accepted_substantive_reratings: 0 },
        { id: "r3", eligible: true, accepted_initial_ratings: 133, accepted_substantive_reratings: 0 },
        { id: "r4", eligible: true, accepted_initial_ratings: 133, accepted_substantive_reratings: 0 },
        { id: "r5", eligible: true, accepted_initial_ratings: 133, accepted_substantive_reratings: 0 },
        { id: "r6", eligible: true, accepted_initial_ratings: 133, accepted_substantive_reratings: 0 },
      ],
    },
    adjudication: {
      obligation_units: 6,
      contributors: [
        { id: "a1", eligible: true, accepted_case_closures: 3, accepted_final_signoffs: 1 },
        { id: "a2", eligible: true, accepted_case_closures: 1, accepted_final_signoffs: 1 },
      ],
    },
  });

  assert.equal(ledger.core.paid_cents, 40_000);
  assert.equal(ledger.core.unspent_cents, 0);
  assert.deepEqual(
    Object.fromEntries(ledger.core.payouts.map((entry) => [entry.id, entry.amount_cents])),
    { r1: 6700, r2: 6700, r3: 6650, r4: 6650, r5: 6650, r6: 6650 },
  );
  assert.equal(ledger.adjudication.paid_cents, 10_000);
  assert.deepEqual(
    Object.fromEntries(ledger.adjudication.payouts.map((entry) => [entry.id, entry.amount_cents])),
    { a1: 6667, a2: 3333 },
  );
  assert.equal(ledger.total.paid_cents, 50_000);
  assert.equal(ledger.total.unspent_cents, 0);
});

test("scales released honoraria at an owner-approved early closure", () => {
  const ledger = calculateHonorariaLedger({
    mode: "owner_approved_early_closure",
    core: {
      contributors: [
        { id: "r1", eligible: true, accepted_initial_ratings: 250, accepted_substantive_reratings: 10 },
        { id: "r2", eligible: true, accepted_initial_ratings: 150, accepted_substantive_reratings: 10 },
      ],
    },
    adjudication: {
      obligation_units: 8,
      contributors: [
        { id: "a1", eligible: true, accepted_case_closures: 2, accepted_final_signoffs: 1 },
        { id: "a2", eligible: true, accepted_case_closures: 1, accepted_final_signoffs: 0 },
      ],
    },
  });

  assert.equal(ledger.core.released_cents, 20_000);
  assert.equal(ledger.core.unspent_cents, 20_000);
  assert.equal(ledger.adjudication.released_cents, 5_000);
  assert.equal(ledger.adjudication.unspent_cents, 5_000);
  assert.equal(ledger.total.released_cents, 25_000);
  assert.equal(ledger.total.unspent_cents, 25_000);
});

test("leaves the adjudication reserve unspent when there are no eligible units", () => {
  const ledger = calculateHonorariaLedger({
    mode: "owner_approved_early_closure",
    core: {
      contributors: [{ id: "r1", eligible: true, accepted_initial_ratings: 0, accepted_substantive_reratings: 0 }],
    },
    adjudication: {
      obligation_units: 0,
      contributors: [
        { id: "a1", eligible: true, accepted_case_closures: 0, accepted_final_signoffs: 0 },
        { id: "a2", eligible: true, accepted_case_closures: 0, accepted_final_signoffs: 0 },
      ],
    },
  });

  assert.equal(ledger.adjudication.paid_cents, 0);
  assert.equal(ledger.adjudication.unspent_cents, 10_000);
});

test("uses deterministic largest-remainder rounding", () => {
  const result = distributeCents(100, 100, [
    { id: "b", units: 1 },
    { id: "a", units: 1 },
    { id: "c", units: 1 },
  ]);
  assert.deepEqual(
    Object.fromEntries(result.payouts.map((entry) => [entry.id, entry.amount_cents])),
    { a: 34, b: 33, c: 33 },
  );
});

test("rejects duplicate ids, ineligible accepted units, and incomplete normal completion", () => {
  assert.throws(
    () =>
      calculateHonorariaLedger({
        mode: "normal_completion",
        core: {
          contributors: [
            { id: "r1", eligible: true, accepted_initial_ratings: 400, accepted_substantive_reratings: 0 },
            { id: "r1", eligible: true, accepted_initial_ratings: 400, accepted_substantive_reratings: 0 },
          ],
        },
        adjudication: { obligation_units: 0, contributors: [] },
      }),
    /duplicate contributor id/,
  );

  assert.throws(
    () =>
      calculateHonorariaLedger({
        mode: "owner_approved_early_closure",
        core: {
          contributors: [{ id: "r1", eligible: false, accepted_initial_ratings: 1, accepted_substantive_reratings: 0 }],
        },
        adjudication: { obligation_units: 0, contributors: [] },
      }),
    /ineligible contributor/,
  );

  assert.throws(
    () =>
      calculateHonorariaLedger({
        mode: "normal_completion",
        core: {
          contributors: [{ id: "r1", eligible: true, accepted_initial_ratings: 799, accepted_substantive_reratings: 0 }],
        },
        adjudication: { obligation_units: 0, contributors: [] },
      }),
    /requires exactly 800/,
  );
});
