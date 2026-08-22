import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BLUEDOT_TIMING_PRICE_CONTRACT_PATH } from "./verify-bluedot-timing-price-validation.mjs";
import {
  ROLES,
  STAGES,
  PRICE_STATUSES,
} from "./bluedot-timing-price-readback/constants.mjs";
import {
  buildSanitizedPublicReadback,
  readinessState,
} from "./bluedot-timing-price-readback/sanitize.mjs";
import { validateBlueDotTimingPriceEvidence } from "./bluedot-timing-price-readback/validate.mjs";

export { ROLES, STAGES, PRICE_STATUSES, validateBlueDotTimingPriceEvidence };

export function buildBlueDotTimingPriceReadback(contract, evidence) {
  const validation = validateBlueDotTimingPriceEvidence(contract, evidence);
  if (validation.status !== "pass") {
    return {
      status: "fail",
      readiness_state: "not_ready_to_price",
      errors: validation.errors,
      public_readback: null,
    };
  }

  const readiness = readinessState(contract, evidence, validation);
  const publicReadback = buildSanitizedPublicReadback(
    contract,
    evidence,
    validation,
    readiness,
  );
  return {
    status: "pass",
    readiness_state: readiness,
    errors: [],
    public_readback: publicReadback,
  };
}

async function main() {
  if (process.argv.includes("--help") || process.argv.length < 3) {
    console.log("Usage: node scripts/bluedot-timing-price-readback.mjs <evidence.json>");
    return;
  }

  const root = resolve(import.meta.dirname, "..");
  const [contractText, evidenceText] = await Promise.all([
    readFile(resolve(root, BLUEDOT_TIMING_PRICE_CONTRACT_PATH), "utf8"),
    readFile(resolve(process.argv[2]), "utf8"),
  ]);
  const result = buildBlueDotTimingPriceReadback(
    JSON.parse(contractText),
    JSON.parse(evidenceText),
  );
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "pass") process.exitCode = 1;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) await main();
