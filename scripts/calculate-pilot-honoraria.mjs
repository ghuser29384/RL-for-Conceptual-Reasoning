import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { distributeCents } from "./calculate-honoraria.mjs";

export const PILOT_REQUIRED_INITIAL_RATINGS = 96;
export const PILOT_HONORARIA_POOLS_CENTS = Object.freeze({ core: 40_000, adjudication: 10_000 });

export function calculatePilotHonorariaLedger(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("ledger input must be an object");
  const mode = String(input.mode ?? "");
  if (!new Set(["normal_completion", "owner_approved_early_closure"]).has(mode)) {
    throw new Error("mode must be normal_completion or owner_approved_early_closure");
  }

  const core = normalizeContributors(input.core?.contributors, ["accepted_initial_ratings", "accepted_substantive_reratings"]);
  const acceptedInitialRatings = sum(core, "accepted_initial_ratings");
  if (mode === "normal_completion" && acceptedInitialRatings !== PILOT_REQUIRED_INITIAL_RATINGS) {
    throw new Error(`normal completion requires exactly ${PILOT_REQUIRED_INITIAL_RATINGS} accepted initial ratings`);
  }
  if (acceptedInitialRatings > PILOT_REQUIRED_INITIAL_RATINGS) {
    throw new Error(`accepted initial ratings cannot exceed ${PILOT_REQUIRED_INITIAL_RATINGS}`);
  }

  const coreReleasedCents =
    mode === "normal_completion"
      ? PILOT_HONORARIA_POOLS_CENTS.core
      : Math.floor((PILOT_HONORARIA_POOLS_CENTS.core * acceptedInitialRatings) / PILOT_REQUIRED_INITIAL_RATINGS);
  const coreDistribution = distributeCents(
    PILOT_HONORARIA_POOLS_CENTS.core,
    coreReleasedCents,
    core.map((row) => ({
      id: row.id,
      units: row.eligible ? row.accepted_initial_ratings + row.accepted_substantive_reratings : 0,
    })),
  );

  const adjudicators = normalizeContributors(input.adjudication?.contributors, ["accepted_case_closures", "accepted_final_signoffs"]);
  const obligationUnits = nonNegativeInteger(input.adjudication?.obligation_units, "adjudication.obligation_units");
  const acceptedAdjudicationUnits = adjudicators.reduce(
    (total, row) => total + (row.eligible ? row.accepted_case_closures + row.accepted_final_signoffs : 0),
    0,
  );
  if (acceptedAdjudicationUnits > obligationUnits) throw new Error("accepted adjudication units cannot exceed obligation units");
  if (mode === "normal_completion" && acceptedAdjudicationUnits !== obligationUnits) {
    throw new Error("normal completion requires every adjudication obligation unit to be accepted");
  }
  const adjudicationReleasedCents =
    obligationUnits === 0
      ? 0
      : mode === "normal_completion"
        ? PILOT_HONORARIA_POOLS_CENTS.adjudication
        : Math.floor((PILOT_HONORARIA_POOLS_CENTS.adjudication * acceptedAdjudicationUnits) / obligationUnits);
  const adjudicationDistribution = distributeCents(
    PILOT_HONORARIA_POOLS_CENTS.adjudication,
    adjudicationReleasedCents,
    adjudicators.map((row) => ({
      id: row.id,
      units: row.eligible ? row.accepted_case_closures + row.accepted_final_signoffs : 0,
    })),
  );

  return {
    version: "pilot-01-honoraria-ledger-v1",
    pilot_id: "metaphilosophy-pilot-01-2026-07-27",
    currency: "USD",
    mode,
    core: {
      accepted_initial_ratings: acceptedInitialRatings,
      accepted_substantive_reratings: sum(core, "accepted_substantive_reratings"),
      ...coreDistribution,
    },
    adjudication: {
      obligation_units: obligationUnits,
      accepted_units: acceptedAdjudicationUnits,
      ...adjudicationDistribution,
    },
    total: {
      pool_cents: PILOT_HONORARIA_POOLS_CENTS.core + PILOT_HONORARIA_POOLS_CENTS.adjudication,
      released_cents: coreDistribution.released_cents + adjudicationDistribution.released_cents,
      paid_cents: coreDistribution.paid_cents + adjudicationDistribution.paid_cents,
      unspent_cents: coreDistribution.unspent_cents + adjudicationDistribution.unspent_cents,
    },
    note: "This allocates capped Pilot 01 volunteer honoraria; it is not a wage or per-rating compensation schedule.",
  };
}

function normalizeContributors(value, fields) {
  if (!Array.isArray(value)) throw new TypeError("contributors must be an array");
  const seen = new Set();
  return value.map((row, index) => {
    const id = String(row?.id ?? "").trim();
    if (!id) throw new Error(`contributors[${index}].id is required`);
    if (seen.has(id)) throw new Error(`duplicate contributor id: ${id}`);
    seen.add(id);
    const normalized = { id, eligible: row?.eligible !== false };
    for (const field of fields) normalized[field] = nonNegativeInteger(row?.[field], `contributors[${index}].${field}`);
    if (!normalized.eligible && fields.some((field) => normalized[field] > 0)) {
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
    console.log("Usage: node scripts/calculate-pilot-honoraria.mjs <accepted-unit-ledger.json>");
  } else {
    const input = JSON.parse(await readFile(resolve(process.argv[2]), "utf8"));
    console.log(JSON.stringify(calculatePilotHonorariaLedger(input), null, 2));
  }
}
