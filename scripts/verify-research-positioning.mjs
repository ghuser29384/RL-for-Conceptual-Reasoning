import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const RESEARCH_POSITIONING_CONTRACT_PATH = "ops/research-positioning-v1.json";
export const RESEARCH_POSITIONING_DOCUMENT_PATH = "docs/research-positioning-v1.md";

const REQUIRED_DOCUMENT_MARKERS = Object.freeze([
  "Metaphilosophy is an **auditable expert-judgment system for philosophical and conceptual reasoning**.",
  "Its primary output should be a robustness and disagreement report, not a model leaderboard.",
  "build an ordinary LMCA-style model leaderboard as its core direction",
  "This document does not modify public copy",
]);

const REQUIRED_RESEARCH_TERMS = Object.freeze([
  "disagree",
  "interpretation",
  "revision",
  "robust",
]);

const REQUIRED_PILOT_CONSTRAINTS = Object.freeze([
  "primary estimands must concern expert-judgment robustness",
  "Blind initial ratings must remain immutable",
  "report unresolved disagreements",
  "Interpretation disagreements must be recorded separately",
  "model ranking must remain a secondary diagnostic",
  "must be frozen in a separate design amendment before research use",
]);

export function validateResearchPositioning({ contract, document }) {
  const errors = [];
  const normalizedContract = contract && typeof contract === "object" ? contract : {};
  const normalizedDocument = String(document ?? "");

  if (normalizedContract.contract_id !== "mp-research-positioning-v1") {
    errors.push("The positioning contract id must remain mp-research-positioning-v1.");
  }
  if (normalizedContract.status !== "approved") {
    errors.push("The positioning contract must remain approved.");
  }
  if (normalizedContract.approved_at !== "2026-08-15") {
    errors.push("The positioning approval date must remain 2026-08-15.");
  }
  if (normalizedContract.approved_by !== "Ellen Sun") {
    errors.push("The positioning contract must preserve Ellen Sun as the approving owner.");
  }

  const primaryPositioning = String(normalizedContract.primary_positioning ?? "");
  const primaryGoal = String(normalizedContract.primary_research_goal ?? "");
  if (!primaryPositioning.includes("auditable expert-judgment system")) {
    errors.push("The primary positioning must remain an auditable expert-judgment system.");
  }
  if (!primaryGoal.includes("stable, interpretable, revisable, and robust")) {
    errors.push("The primary research goal must preserve stability, interpretability, revision, and robustness.");
  }
  if (/leaderboard/iu.test(`${primaryPositioning}\n${primaryGoal}`)) {
    errors.push("A model leaderboard cannot become the primary positioning or research goal.");
  }

  const researchQuestions = arrayOfStrings(normalizedContract.research_questions);
  if (researchQuestions.length < 4) {
    errors.push("The positioning contract must preserve at least four research questions.");
  }
  const researchQuestionText = researchQuestions.join("\n").toLowerCase();
  for (const term of REQUIRED_RESEARCH_TERMS) {
    if (!researchQuestionText.includes(term)) {
      errors.push(`The research questions must preserve the ${term} research object.`);
    }
  }

  const pilotRole = String(normalizedContract.current_pilot_role ?? "");
  if (!/measurement and workflow feasibility pilot/iu.test(pilotRole)) {
    errors.push("The 48-critique study must remain a measurement and workflow feasibility pilot.");
  }
  if (!/not a validated benchmark or model-ranking release/iu.test(pilotRole)) {
    errors.push("The pilot role must reject validated-benchmark and model-ranking-release claims.");
  }

  const orderedOutputs = arrayOfStrings(normalizedContract.ordered_outputs);
  if (!orderedOutputs[0]?.toLowerCase().includes("robustness and disagreement report")) {
    errors.push("The first ordered output must remain the expert-judgment robustness and disagreement report.");
  }
  const modelDiagnosticIndex = orderedOutputs.findIndex((item) => /model-evaluation diagnostics/iu.test(item));
  if (modelDiagnosticIndex < 1) {
    errors.push("Model-evaluation diagnostics must remain secondary to the human-judgment report.");
  }

  const nonGoals = arrayOfStrings(normalizedContract.explicit_non_goals);
  if (!nonGoals.some((item) => /ordinary LMCA-style model leaderboard/iu.test(item))) {
    errors.push("The contract must explicitly reject an ordinary LMCA-style leaderboard as the core direction.");
  }
  if (!nonGoals.some((item) => /objective ground truth/iu.test(item))) {
    errors.push("The contract must reject treating expert ratings as objective philosophical ground truth.");
  }
  if (!nonGoals.some((item) => /Relabel LMCA ratings/iu.test(item))) {
    errors.push("The contract must reject relabelling LMCA outputs as Metaphilosophy outputs.");
  }

  const constraints = arrayOfStrings(normalizedContract.pilot_design_constraints);
  const constraintText = constraints.join("\n");
  for (const fragment of REQUIRED_PILOT_CONSTRAINTS) {
    if (!constraintText.includes(fragment)) {
      errors.push(`The pilot-design constraints must preserve: ${fragment}.`);
    }
  }

  const authorization = normalizedContract.authorization;
  if (!authorization || typeof authorization !== "object") {
    errors.push("The positioning contract must contain an explicit authorization boundary.");
  } else {
    for (const [key, value] of Object.entries(authorization)) {
      if (value !== false) errors.push(`Positioning approval must not authorize ${key}.`);
    }
    for (const key of [
      "changes_public_copy",
      "changes_current_pilot_endpoints",
      "authorizes_participant_access",
      "authorizes_recruitment",
      "authorizes_research_start",
      "authorizes_merge",
      "authorizes_deployment",
    ]) {
      if (!(key in authorization)) errors.push(`Authorization boundary is missing ${key}.`);
    }
  }

  if (!normalizedDocument.trim()) {
    errors.push("The human-readable positioning document is missing or empty.");
  }
  for (const marker of REQUIRED_DOCUMENT_MARKERS) {
    if (!normalizedDocument.includes(marker)) {
      errors.push(`The positioning document must preserve marker: ${marker}.`);
    }
  }

  return {
    status: errors.length ? "fail" : "pass",
    contract_id: normalizedContract.contract_id ?? null,
    research_question_count: researchQuestions.length,
    ordered_output_count: orderedOutputs.length,
    authorization_keys: authorization && typeof authorization === "object" ? Object.keys(authorization).sort() : [],
    errors,
  };
}

export async function readAndValidateResearchPositioning(root = resolve(import.meta.dirname, "..")) {
  const [contractText, document] = await Promise.all([
    readFile(resolve(root, RESEARCH_POSITIONING_CONTRACT_PATH), "utf8"),
    readFile(resolve(root, RESEARCH_POSITIONING_DOCUMENT_PATH), "utf8"),
  ]);
  return validateResearchPositioning({ contract: JSON.parse(contractText), document });
}

function arrayOfStrings(value) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await readAndValidateResearchPositioning();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
