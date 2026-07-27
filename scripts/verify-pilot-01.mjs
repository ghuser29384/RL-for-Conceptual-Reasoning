import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const EXPECTED_POSITION_IDS = ["P001", "P011", "P021", "P031", "P041", "P051", "P061", "P071", "P081", "P091", "P101", "P208"];

export function validatePilot01({ contract, items, expansionGate, pageHtml, buildScript, vercel, fundingDrafts }) {
  const errors = [];

  if (contract?.pilot_id !== "metaphilosophy-pilot-01-2026-07-27") errors.push("Unexpected pilot_id.");
  if (contract?.decision_status !== "approved_definition_recruitment_open_results_pending") {
    errors.push("Pilot status must preserve that recruitment is open and results are pending.");
  }
  if (contract?.items?.positions !== 12) errors.push("Pilot must contain exactly 12 positions.");
  if (contract?.items?.critiques_per_position !== 4) errors.push("Pilot must contain four critiques per position.");
  if (contract?.items?.critiques !== 48) errors.push("Pilot must contain exactly 48 critiques.");
  if (contract?.items?.required_initial_ratings !== 96) errors.push("Pilot must require exactly 96 initial ratings.");
  if (contract?.items?.independent_initial_ratings_per_critique !== 2) errors.push("Every critique must receive two independent ratings.");
  if (contract?.items?.future_hidden_test_eligibility !== false) errors.push("Public pilot items cannot be eligible for a future hidden test set.");
  if (contract?.senior_methodological_advisers?.bulk_annotation_request_prohibited !== true) {
    errors.push("Senior methodological advisers must not receive bulk-annotation requests.");
  }
  const hours = contract?.senior_methodological_advisers?.bounded_request?.expected_total_hours_per_person ?? {};
  if (hours.minimum !== 1 || hours.maximum !== 3) errors.push("Senior adviser requests must remain bounded to one to three hours.");
  const panel = contract?.early_career_panel ?? {};
  if (panel.minimum_core_raters !== 4 || panel.target_core_raters !== 6 || panel.maximum_core_raters !== 8) {
    errors.push("Early-career panel bounds must remain 4 / 6 / 8.");
  }
  if (panel.target_prequalified_alternates !== 2) errors.push("Pilot must target two prequalified alternates.");
  if (contract?.budget?.ceiling !== 500 || contract?.budget?.core_rater_pool !== 400 || contract?.budget?.adjudication_reserve !== 100) {
    errors.push("Pilot honoraria envelopes must remain USD 400 / USD 100 under a USD 500 ceiling.");
  }
  if (contract?.measurement?.automatic_success_thresholds !== false) {
    errors.push("Pilot results must not trigger automatic expansion thresholds.");
  }

  const positions = Array.isArray(items?.positions) ? items.positions : [];
  if (positions.length !== 12) errors.push("Public item manifest must contain 12 positions.");
  const positionIds = positions.map((item) => item.position_id);
  if (new Set(positionIds).size !== positionIds.length) errors.push("Position IDs must be unique.");
  if (JSON.stringify(positionIds) !== JSON.stringify(EXPECTED_POSITION_IDS)) errors.push("Public pilot position IDs drifted from the approved manifest.");
  if (new Set(positions.map((item) => item.domain)).size !== 12) errors.push("Pilot must preserve 12 distinct domains.");

  const critiqueIds = [];
  for (const position of positions) {
    if (!Array.isArray(position.critique_ids) || position.critique_ids.length !== 4) {
      errors.push(`${position.position_id ?? "unknown"} must have exactly four critique IDs.`);
      continue;
    }
    critiqueIds.push(...position.critique_ids);
  }
  if (critiqueIds.length !== 48 || new Set(critiqueIds).size !== 48) errors.push("Pilot must contain 48 unique critique IDs.");
  for (const id of critiqueIds) if (!/^C\d{4}$/.test(String(id))) errors.push(`Invalid critique ID: ${id}.`);
  if (items?.future_hidden_test_eligibility !== false) errors.push("Item manifest must prohibit future hidden-test use.");

  if (expansionGate?.current_status !== "blocked_pending_pilot_results_and_resource_gate") {
    errors.push("Full Hard Set must remain blocked pending pilot evidence and resources.");
  }
  if (expansionGate?.necessary_conditions?.resource_gate?.model !== "external_funding_or_substantial_committed_volunteer_capacity") {
    errors.push("Expansion resource gate must require funding or substantial committed volunteer capacity.");
  }
  const prohibited = JSON.stringify(expansionGate?.prohibited_shortcuts ?? []).toLowerCase();
  for (const phrase of ["usd 500 pilot", "senior methodological advisers", "full-set start date"]) {
    if (!prohibited.includes(phrase)) errors.push(`Expansion gate must explicitly address ${phrase}.`);
  }

  if (!pageHtml.includes("Pilot 01 expert-rater expression of interest")) errors.push("Pilot-rater page title is missing.");
  if (!pageHtml.includes("No assignment or individual payment is guaranteed")) errors.push("Non-binding application disclosure is missing.");
  if (!pageHtml.includes("48 public critiques")) errors.push("Pilot size disclosure is missing.");
  if (!pageHtml.includes("external AI assistance")) errors.push("No-AI calibration disclosure is missing.");
  if (!buildScript.includes('resolve(root, "pilot-raters")')) errors.push("Static build does not include pilot-raters.");
  for (const route of ["/pilot-raters", "/pilot-raters/"]) {
    const rewrite = vercel?.rewrites?.find((candidate) => candidate.source === route);
    if (rewrite?.destination !== "/pilot-raters/index.html") errors.push(`Missing Pilot 01 rewrite for ${route}.`);
  }

  for (const [name, text] of Object.entries(fundingDrafts ?? {})) {
    if (!text.includes("submission blocked pending Pilot 01 results")) errors.push(`${name} must remain blocked pending pilot results.`);
    if (!text.includes("[PILOT_")) errors.push(`${name} must retain explicit pilot-evidence placeholders.`);
    if (!text.includes("senior methodological")) errors.push(`${name} must require senior methodological feedback.`);
  }

  return {
    status: errors.length ? "fail" : "pass",
    pilot_id: contract?.pilot_id ?? null,
    positions: positions.length,
    critiques: critiqueIds.length,
    required_initial_ratings: contract?.items?.required_initial_ratings ?? null,
    errors,
  };
}

export async function readAndValidatePilot01(root) {
  const [contract, items, expansionGate, pageHtml, buildScript, vercel, evDraft, ltffDraft] = await Promise.all([
    readJson(resolve(root, "ops/pilot-01/pilot-contract.json")),
    readJson(resolve(root, "ops/pilot-01/pilot-items-public.json")),
    readJson(resolve(root, "ops/pilot-01/full-hard-set-expansion-gate.json")),
    readFile(resolve(root, "pilot-raters/index.html"), "utf8"),
    readFile(resolve(root, "scripts/build-static.mjs"), "utf8"),
    readJson(resolve(root, "vercel.json")),
    readFile(resolve(root, "funding/emergent-ventures-pilot-evidence-draft.md"), "utf8"),
    readFile(resolve(root, "funding/ltff-pilot-evidence-draft.md"), "utf8"),
  ]);
  return validatePilot01({
    contract,
    items,
    expansionGate,
    pageHtml,
    buildScript,
    vercel,
    fundingDrafts: { emergentVentures: evDraft, ltff: ltffDraft },
  });
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const report = await readAndValidatePilot01(root);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
