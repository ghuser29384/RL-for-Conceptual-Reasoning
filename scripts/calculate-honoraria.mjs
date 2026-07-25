import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const HONORARIA_POOLS_CENTS = Object.freeze({ core: 40_000, adjudication: 10_000 });
export const REQUIRED_INITIAL_RATINGS = 800;

/**
 * Calculate an auditable honoraria ledger from accepted contribution units.
 *
 * Input shape:
 * {
 *   mode: "normal_completion" | "owner_approved_early_closure",
 *   core: {
 *     contributors: [{ id, eligible, accepted_initial_ratings, accepted_substantive_reratings }]
 *   },
 *   adjudication: {
 *     obligation_units,
 *     contributors: [{ id, eligible, accepted_case_closures, accepted_final_signoffs }]
 *   }
 * }
 */
export function calculateHonorariaLedger(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("ledger input must be an object");
  const mode = String(input.mode ?? "");
  if (!new Set(["normal_completion", "owner_approved_early_closure"]).has(mode)) {
    throw new Error("mode must be normal_completion or owner_approved_early_closure");
  }

  const coreContributors = normalizeContributors(input.core?.contributors, {
    accepted_initial_ratings: "accepted_initial_ratings",
    accepted_substantive_reratings: "accepted_substantive_reratings",
  });
  const acceptedInitialRatings = sum(coreContributors, "accepted_initial_ratings");
  const acceptedReratings = sum(coreContributors, "accepted_substantive_reratings");

  if (mode === "normal_completion" && acceptedInitialRatings !== REQUIRED_INITIAL_RATINGS) {
    throw new Error(`normal completion requires exactly ${REQUIRED_INITIAL_RATINGS} accepted initial ratings`);
  }
  if (mode === "owner_approved_early_closure" && acceptedInitialRatings > REQUIRED_INITIAL_RATINGS) {
    throw new Error(`early-closure accepted initial ratings cannot exceed ${REQUIRED_INITIAL_RATINGS}`);
  }

  const coreReleasedCents =
    mode === "normal_completion"
      ? HONORARIA_POOLS_CENTS.core
      : Math.floor((HONORARIA_POOLS_CENTS.core * acceptedInitialRatings) / REQUIRED_INITIAL_RATINGS);
  const coreEntries = coreContributors.map((contributor) => ({
    id: contributor.id,
    units: contributor.eligible
      ? contributor.accepted_initial_ratings + contributor.accepted_substantive_reratings
      : 0,
  }));
  const coreDistribution = distributeCents(HONORARIA_POOLS_CENTS.core, coreReleasedCents, coreEntries);

  const adjudicationContributors = normalizeContributors(input.adjudication?.contributors, {
    accepted_case_closures: "accepted_case_closures",
    accepted_final_signoffs: "accepted_final_signoffs",
  });
  const adjudicationObligationUnits = nonNegativeInteger(input.adjudication?.obligation_units, "adjudication.obligation_units");
  const acceptedAdjudicationUnits = adjudicationContributors.reduce(
    (total, contributor) =>
      total + (contributor.eligible ? contributor.accepted_case_closures + contributor.accepted_final_signoffs : 0),
    0,
  );
  if (acceptedAdjudicationUnits > adjudicationObligationUnits) {
    throw new Error("accepted adjudication units cannot exceed opened obligation units");
  }
  if (mode === "normal_completion" && acceptedAdjudicationUnits !== adjudicationObligationUnits) {
    throw new Error("normal completion requires every adjudication obligation unit to be accepted");
  }

  const adjudicationReleasedCents =
    adjudicationObligationUnits === 0
      ? 0
      : mode === "normal_completion"
        ? HONORARIA_POOLS_CENTS.adjudication
        : Math.floor((HONORARIA_POOLS_CENTS.adjudication * acceptedAdjudicationUnits) / adjudicationObligationUnits);
  const adjudicationEntries = adjudicationContributors.map((contributor) => ({
    id: contributor.id,
    units: contributor.eligible ? contributor.accepted_case_closures + contributor.accepted_final_signoffs : 0,
  }));
  const adjudicationDistribution = distributeCents(
    HONORARIA_POOLS_CENTS.adjudication,
    adjudicationReleasedCents,
    adjudicationEntries,
  );

  return {
    version: "honoraria-ledger-v1",
    currency: "USD",
    mode,
    core: {
      accepted_initial_ratings: acceptedInitialRatings,
      accepted_substantive_reratings: acceptedReratings,
      ...coreDistribution,
    },
    adjudication: {
      obligation_units: adjudicationObligationUnits,
      accepted_units: acceptedAdjudicationUnits,
      ...adjudicationDistribution,
    },
    total: {
      pool_cents: HONORARIA_POOLS_CENTS.core + HONORARIA_POOLS_CENTS.adjudication,
      released_cents: coreDistribution.released_cents + adjudicationDistribution.released_cents,
      paid_cents: coreDistribution.paid_cents + adjudicationDistribution.paid_cents,
      unspent_cents: coreDistribution.unspent_cents + adjudicationDistribution.unspent_cents,
    },
    note: "This allocates capped volunteer honoraria; it is not a wage or per-rating compensation schedule.",
  };
}

export function distributeCents(poolCents, releasedCents, entries) {
  const pool = nonNegativeInteger(poolCents, "poolCents");
  const released = nonNegativeInteger(releasedCents, "releasedCents");
  if (released > pool) throw new Error("releasedCents cannot exceed poolCents");
  if (!Array.isArray(entries)) throw new TypeError("entries must be an array");

  const normalized = entries.map((entry, index) => {
    const id = String(entry?.id ?? "").trim();
    if (!id) throw new Error(`entries[${index}].id is required`);
    return { id, units: nonNegativeInteger(entry?.units, `entries[${index}].units`) };
  });
  if (new Set(normalized.map((entry) => entry.id)).size !== normalized.length) throw new Error("contributor ids must be unique");

  const totalUnits = normalized.reduce((total, entry) => total + entry.units, 0);
  if (released === 0 || totalUnits === 0) {
    return {
      pool_cents: pool,
      released_cents: 0,
      paid_cents: 0,
      unspent_cents: pool,
      total_units: totalUnits,
      payouts: normalized.map((entry) => ({ id: entry.id, units: entry.units, amount_cents: 0 })),
    };
  }

  const provisional = normalized.map((entry) => {
    const numerator = released * entry.units;
    return {
      id: entry.id,
      units: entry.units,
      amount_cents: Math.floor(numerator / totalUnits),
      remainder: numerator % totalUnits,
    };
  });
  let centsRemaining = released - provisional.reduce((total, entry) => total + entry.amount_cents, 0);
  const remainderOrder = [...provisional].sort((left, right) => right.remainder - left.remainder || left.id.localeCompare(right.id));
  for (let index = 0; index < centsRemaining; index += 1) remainderOrder[index].amount_cents += 1;

  const payouts = provisional
    .map(({ id, units, amount_cents }) => ({ id, units, amount_cents }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const paidCents = payouts.reduce((total, entry) => total + entry.amount_cents, 0);
  return {
    pool_cents: pool,
    released_cents: released,
    paid_cents: paidCents,
    unspent_cents: pool - paidCents,
    total_units: totalUnits,
    payouts,
  };
}

function normalizeContributors(value, fields) {
  if (!Array.isArray(value)) throw new TypeError("contributors must be an array");
  const seen = new Set();
  return value.map((contributor, index) => {
    const id = String(contributor?.id ?? "").trim();
    if (!id) throw new Error(`contributors[${index}].id is required`);
    if (seen.has(id)) throw new Error(`duplicate contributor id: ${id}`);
    seen.add(id);
    const normalized = { id, eligible: contributor?.eligible !== false };
    for (const [inputField, outputField] of Object.entries(fields)) {
      normalized[outputField] = nonNegativeInteger(contributor?.[inputField], `contributors[${index}].${inputField}`);
    }
    if (!normalized.eligible && Object.values(fields).some((field) => normalized[field] > 0)) {
      throw new Error(`ineligible contributor ${id} cannot have accepted units`);
    }
    return normalized;
  });
}

function nonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer`);
  return value;
}

function sum(rows, field) {
  return rows.reduce((total, row) => total + row[field], 0);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help") || process.argv.length < 3) {
    console.log("Usage: node scripts/calculate-honoraria.mjs <accepted-unit-ledger.json>");
  } else {
    const input = JSON.parse(await readFile(resolve(process.argv[2]), "utf8"));
    console.log(JSON.stringify(calculateHonorariaLedger(input), null, 2));
  }
}
