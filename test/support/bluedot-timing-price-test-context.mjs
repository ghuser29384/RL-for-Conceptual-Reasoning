import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  BLUEDOT_TIMING_PRICE_CONTRACT_PATH,
  BLUEDOT_TIMING_PRICE_DOCUMENT_PATH,
  PANEL_HONORARIA_PLAN_PATH,
  readAndValidateBlueDotTimingPriceProtocol,
  validateBlueDotTimingPriceProtocol,
} from "../../scripts/verify-bluedot-timing-price-validation.mjs";
import {
  buildBlueDotTimingPriceReadback,
  validateBlueDotTimingPriceEvidence,
} from "../../scripts/bluedot-timing-price-readback.mjs";
import { createSyntheticBlueDotTimingPriceEvidence } from "../fixtures/bluedot-timing-price-validation-synthetic.mjs";

export {
  buildBlueDotTimingPriceReadback,
  createSyntheticBlueDotTimingPriceEvidence,
  readAndValidateBlueDotTimingPriceProtocol,
  validateBlueDotTimingPriceEvidence,
  validateBlueDotTimingPriceProtocol,
};

export const root = resolve(import.meta.dirname, "../..");

export async function loadProtocol() {
  const [contractText, document, panelText] = await Promise.all([
    readFile(resolve(root, BLUEDOT_TIMING_PRICE_CONTRACT_PATH), "utf8"),
    readFile(resolve(root, BLUEDOT_TIMING_PRICE_DOCUMENT_PATH), "utf8"),
    readFile(resolve(root, PANEL_HONORARIA_PLAN_PATH), "utf8"),
  ]);
  return {
    contract: JSON.parse(contractText),
    document,
    panelPlan: JSON.parse(panelText),
  };
}

export function allKeys(value, out = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => allKeys(item, out));
    return out;
  }
  if (!value || typeof value !== "object") return out;
  for (const [key, child] of Object.entries(value)) {
    out.push(key);
    allKeys(child, out);
  }
  return out;
}
