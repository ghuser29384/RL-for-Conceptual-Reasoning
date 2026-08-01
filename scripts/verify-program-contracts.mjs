import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateHardSetSourceAllocation } from "./verify-hard-set-source-allocation.mjs";
import { validatePanelHonorariaPlan } from "./verify-panel-honoraria-plan.mjs";
import { validatePilot48Plan } from "./verify-pilot-48-plan.mjs";
import { validatePilotAssignmentContract } from "./verify-pilot-assignment-contract.mjs";
import { validatePilotMethodologyRecommendations } from "./verify-pilot-methodology-recommendations.mjs";
import { validatePilotReadinessLedger } from "./verify-pilot-readiness-ledger.mjs";
import { validatePilotRatingAnalysisContract } from "./verify-pilot-rating-analysis-contract.mjs";

const root = resolve(import.meta.dirname, "..");
const contractPath = resolve(root, "ops/next-steps-2026-07-23/release-contract.json");
const decisionsPath = resolve(root, "ops/next-steps-2026-07-23/decision-register.json");
const pilotPath = resolve(root, "ops/next-steps-2026-07-23/pilot-48-plan.json");
const methodologyPath = resolve(root, "ops/next-steps-2026-07-23/pilot-methodology-recommendations.json");
const readinessPath = resolve(root, "ops/next-steps-2026-07-23/pilot-readiness-ledger.json");
const assignmentContractPath = resolve(root, "ops/next-steps-2026-07-23/pilot-assignment-contract.json");
const assignmentBriefPath = resolve(root, "ops/next-steps-2026-07-23/pilot-assignment-contract.md");
const assignmentFixturePath = resolve(root, "test/fixtures/pilot-assignment-synthetic.json");
const assignmentImplementationPath = resolve(root, "scripts/pilot-assignment-generator.mjs");
const analysisContractPath = resolve(root, "ops/next-steps-2026-07-23/pilot-rating-analysis-contract.json");
const analysisImplementationPath = resolve(root, "scripts/pilot-rating-analysis.mjs");
const methodologyAuditPath = resolve(root, "ops/next-steps-2026-07-23/lmca-methodology-audit.md");
const methodologyBriefPath = resolve(root, "ops/next-steps-2026-07-23/pilot-methodology-recommendations.md");
const adviserBriefPath = resolve(root, "ops/next-steps-2026-07-23/methodological-adviser-brief.md");
const raterBriefPath = resolve(root, "ops/next-steps-2026-07-23/early-career-rater-brief.md");
const outreachPlanPath = resolve(root, "ops/next-steps-2026-07-23/outreach-plan.md");
const q006PacketPath = resolve(root, "ops/next-steps-2026-07-23/q-006-decision-packet.md");
const q006ApprovalPath = resolve(root, "ops/next-steps-2026-07-23/q-006a-owner-approval.md");
const allocationPath = resolve(root, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");
const panelPlanPath = resolve(root, "ops/next-steps-2026-07-23/panel-honoraria-plan.json");
const calculatorPath = resolve(root, "scripts/calculate-honoraria.mjs");
const closedPagePath = resolve(root, "reviewers/closed.html");
const vercelPath = resolve(root, "vercel.json");

const [
  contract,
  register,
  pilot,
  methodology,
  readiness,
  assignmentContract,
  assignmentBrief,
  assignmentFixture,
  assignmentImplementation,
  analysisContract,
  analysisImplementation,
  methodologyAudit,
  methodologyBrief,
  adviserBrief,
  raterBrief,
  outreachPlan,
  q006Packet,
  q006Approval,
  allocation,
  panelPlan,
  calculator,
  closedPage,
  vercel,
] = await Promise.all([
  readJson(contractPath),
  readJson(decisionsPath),
  readJson(pilotPath),
  readJson(methodologyPath),
  readJson(readinessPath),
  readJson(assignmentContractPath),
  readFile(assignmentBriefPath, "utf8"),
  readJson(assignmentFixturePath),
  readFile(assignmentImplementationPath, "utf8"),
  readJson(analysisContractPath),
  readFile(analysisImplementationPath, "utf8"),
  readFile(methodologyAuditPath, "utf8"),
  readFile(methodologyBriefPath, "utf8"),
  readFile(adviserBriefPath, "utf8"),
  readFile(raterBriefPath, "utf8"),
  readFile(outreachPlanPath, "utf8"),
  readFile(q006PacketPath, "utf8"),
  readFile(q006ApprovalPath, "utf8"),
  readJson(allocationPath),
  readJson(panelPlanPath),
  readFile(calculatorPath, "utf8"),
  readFile(closedPagePath, "utf8"),
  readJson(vercelPath),
]);

assert.equal(contract.contract_version, 1);
assert.equal(contract.artifact_classes.synthetic_unrated.release_id, "synthetic-1000-v1");
assert.equal(contract.artifact_classes.synthetic_unrated.expected.records, 1000);
assert.equal(contract.artifact_classes.synthetic_unrated.expected.positions, 250);
assert.equal(contract.artifact_classes.synthetic_unrated.expected.critiques, 1000);
assert.equal(contract.artifact_classes.synthetic_unrated.expected.critiques_per_position, 4);
assert.equal(contract.artifact_classes.synthetic_unrated.expected.domains, 25);
assert.match(contract.artifact_classes.synthetic_unrated.expected.source_sha256, /^[a-f0-9]{64}$/);

for (const [name, file] of Object.entries(contract.artifact_classes.synthetic_unrated.expected.files)) {
  assert.ok(name.endsWith(".json"));
  assert.ok(Number.isInteger(file.bytes) && file.bytes > 0);
  assert.match(file.sha256, /^[a-f0-9]{64}$/);
}

assert.ok(register.decisions.length > 0);
for (const decision of register.decisions) {
  assert.ok(decision.credence >= 0.9 && decision.credence <= 1, `${decision.id} violates the 90% decision threshold`);
}
assert.equal(register.pending_decision.status, "user_decision_required");
assert.equal(register.pending_decision.id, "Q-006");
assert.equal(register.decisions.find((decision) => decision.id === "D-006")?.contract_path, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");
for (const decisionId of ["D-007", "D-008", "D-009", "D-010", "D-011", "D-012", "D-013", "D-014", "D-015", "D-016", "D-017", "D-025"]) {
  assert.equal(
    register.decisions.find((decision) => decision.id === decisionId)?.contract_path,
    "ops/next-steps-2026-07-23/panel-honoraria-plan.json",
  );
}
for (const decisionId of ["D-018", "D-019", "D-020", "D-021", "D-022", "D-023", "D-024"]) {
  assert.equal(
    register.decisions.find((decision) => decision.id === decisionId)?.contract_path,
    "ops/next-steps-2026-07-23/pilot-48-plan.json",
  );
}
assert.equal(register.decisions.find((decision) => decision.id === "D-026")?.contract_path, "ops/next-steps-2026-07-23/hard-set-source-allocation.json");

const pilotReport = validatePilot48Plan(pilot);
assert.equal(pilotReport.status, "pass", pilotReport.errors.join("\n"));
assert.deepEqual(pilotReport.scope, {
  positions: 12,
  critiques_per_position: 4,
  critiques: 48,
  independent_initial_ratings_per_critique: 2,
  initial_ratings: 96,
  core_raters: 6,
  dedicated_adjudicators: 2,
  nominal_positions_per_core_rater: 4,
  nominal_initial_ratings_per_core_rater: 16,
  duration_days: 28,
});
assert.equal(pilotReport.numeric_thresholds_binding, false);
assert.equal(pilotReport.phase_2_status, "blocked_before_pilot_results_and_capacity");

const methodologyReport = validatePilotMethodologyRecommendations(methodology);
assert.equal(methodologyReport.status, "pass", methodologyReport.errors.join("\n"));
assert.equal(methodologyReport.slots, 12);
assert.equal(methodologyReport.unique_pairs, 12);
assert.deepEqual(methodologyReport.preferred_source_mix, {
  public_synthetic_with_new_expert_ratings: 6,
  protected_public_domain_derived: 6,
});
assert.equal(methodologyReport.shared_calibration_critiques, 8);
assert.equal(methodologyReport.binding_effect, false);

const readinessReport = validatePilotReadinessLedger(readiness);
assert.equal(readinessReport.status, "pass", readinessReport.errors.join("\n"));
assert.equal(readinessReport.q006a_status, "pending_project_owner_decision");
assert.equal(readinessReport.readiness_gate_count, 6);
assert.equal(readinessReport.blocked_gate_count, 6);
assert.equal(readinessReport.controlled_assignment_generation_authorized, false);
assert.equal(readinessReport.ready_to_start, false);

const assignmentReport = validatePilotAssignmentContract(assignmentContract, methodology, assignmentFixture);
assert.equal(assignmentReport.status, "pass", assignmentReport.errors.join("\n"));
assert.equal(assignmentReport.synthetic_feasible_mapping_count, 1);
assert.match(assignmentReport.synthetic_selected_mapping_hash, /^[a-f0-9]{64}$/);
assert.equal(assignmentReport.controlled_generation_authorized, false);
assert.equal(assignmentReport.rating_work_authorized, false);
assert.equal(assignmentReport.phase_2_authorized, false);
assert.match(assignmentImplementation, /export function validatePilotAssignmentInput/);
assert.match(assignmentImplementation, /export function generatePilotAssignments/);
assert.match(assignmentImplementation, /export function sanitizePilotAssignmentReport/);
assert.match(assignmentImplementation, /No feasible anonymous-slot mapping/);
assert.match(assignmentImplementation, /full controlled assignments are never printed to stdout/i);
assert.match(assignmentBrief, /no assignment/i);
assert.match(assignmentBrief, /approved coverage/i);
assert.match(assignmentBrief, /does not authorize rating work/i);
assert.match(assignmentBrief, /file mode `0600`/i);

const analysisContractReport = validatePilotRatingAnalysisContract(analysisContract);
assert.equal(analysisContractReport.status, "pass", analysisContractReport.errors.join("\n"));
assert.equal(analysisContractReport.numeric_thresholds_binding, false);
assert.equal(analysisContractReport.contains_rating_data, false);
assert.match(analysisImplementation, /export function validatePilotRatingDataset/);
assert.match(analysisImplementation, /export function lmcaCustomWeightedLoss/);
assert.match(analysisImplementation, /export function lmcaWeightedPairwiseRankingError/);
assert.match(analysisImplementation, /export function krippendorffAlphaInterval/);
assert.match(analysisImplementation, /approved_routes/);
assert.match(analysisImplementation, /phase_2_authorized: false/);
assert.match(analysisImplementation, /diagnostic_only: true/);

assert.match(methodologyAudit, /951 rated critiques/);
assert.match(methodologyAudit, /1,458 ratings/);
assert.match(methodologyAudit, /rater concentration/i);
assert.match(methodologyAudit, /source and style confounding/i);
assert.match(methodologyAudit, /clarity below 0\.5/i);
assert.match(methodologyAudit, /does not approve outreach/i);
assert.match(methodologyBrief, /twelve distinct rater pairs/i);
assert.match(methodologyBrief, /two public, non-protected positions/i);
assert.match(methodologyBrief, /use position, not individual critique, as the resampling unit/i);
assert.match(methodologyBrief, /No effect by itself:[^\n]*no outreach/i);

assert.match(adviserBrief, /Not sent\./);
assert.match(adviserBrief, /Not requested:[^\n]*bulk rating/i);
assert.match(adviserBrief, /approximately 20 minutes of asynchronous review/);
assert.match(adviserBrief, /12 distinct anonymous rater pairs/);
assert.match(adviserBrief, /clarity below 0\.5/);
assert.match(adviserBrief, /no continuing obligation/);
assert.doesNotMatch(adviserBrief, /we endorse/i);

assert.match(raterBrief, /Not published or sent/);
assert.match(raterBrief, /Recruitment remains closed until Q-006/);
assert.match(raterBrief, /USD 400/);
assert.match(raterBrief, /not represented as employment, a per-rating wage, or full compensation/i);
assert.match(raterBrief, /accepted blind initial ratings \/ 96/);
assert.match(raterBrief, /3–8 hours/);
assert.match(raterBrief, /calibration is not a paid unit/i);
assert.match(raterBrief, /Baseline eligibility is not assignment eligibility/);
assert.match(raterBrief, /approved coverage/);
assert.match(raterBrief, /no assignment is produced/i);

assert.match(outreachPlan, /No email has been sent/);
assert.match(outreachPlan, /No email may be sent until the project owner reviews and approves/i);
assert.match(outreachPlan, /Before methodological-adviser outreach/i);
assert.match(outreachPlan, /Before early-career rater or adjudicator outreach/i);
assert.match(outreachPlan, /Do not use Google Contacts to build the list/);
assert.match(outreachPlan, /project owner approves or edits the packet before Gmail/i);
assert.match(outreachPlan, /Public recruitment remains closed/);

assert.match(q006Packet, /Q-006A — approve the consultation design/);
assert.match(q006Packet, /Preferred source crossing/);
assert.match(q006Packet, /Shared calibration proposal/);
assert.match(q006Packet, /Assignment eligibility and failure rule/);
assert.match(q006Packet, /Assignment authorization boundary/);
assert.match(q006Packet, /does[^\n]*not[^\n]*authorize sending/i);
assert.match(q006Approval, /Pending project-owner decision/i);
assert.match(q006Approval, /Assignment eligibility/);
assert.match(q006Approval, /Does not authorize/i);
assert.match(q006Approval, /Silence is not approval/i);

const allocationReport = validateHardSetSourceAllocation(allocation);
assert.equal(allocationReport.status, "pass", allocationReport.errors.join("\n"));
assert.equal(allocationReport.execution_phase, "deferred_phase_2");
assert.equal(allocationReport.activation_status, "blocked");
assert.deepEqual(allocationReport.position_quotas, {
  lmca_expert_rated: 50,
  public_synthetic: 20,
  newly_hidden_public_domain: 30,
});

const panelReport = validatePanelHonorariaPlan(panelPlan);
assert.equal(panelReport.status, "pass", panelReport.errors.join("\n"));
assert.equal(panelReport.active_programme, "metaphilosophy-48-critique-pilot-v1-2026-07-30");
assert.deepEqual(panelReport.workload, {
  positions: 12,
  critiques_per_position: 4,
  critiques: 48,
  independent_initial_ratings_per_critique: 2,
  initial_ratings: 96,
  nominal_positions_per_core_rater: 4,
  nominal_initial_ratings_per_core_rater: 16,
});
assert.deepEqual(panelReport.panel, { core_raters: 6, dedicated_adjudicators: 2, total_people: 8 });
assert.deepEqual(panelReport.operations_owner, { name: "Ellen Sun", role: "project_owner" });
assert.deepEqual(panelReport.delivery_window, {
  duration_weeks: 4,
  duration_days: 28,
  start_rule: "first_monday_at_0000_utc_at_least_72_hours_after_readiness_signoff",
  calendar_start: null,
  calendar_end: null,
});
assert.deepEqual(panelReport.budget, {
  currency: "USD",
  ceiling: 500,
  model: "limited_honoraria_for_volunteer_expert_work",
  core_rater_completion_pool: 400,
  adjudication_reserve: 100,
});
assert.match(calculator, /REQUIRED_INITIAL_RATINGS = 96/);
assert.match(calculator, /pilot-honoraria-ledger-v1/);
assert.match(calculator, /owner_approved_early_closure/);
assert.doesNotMatch(calculator, /REQUIRED_INITIAL_RATINGS = 800/);

assert.match(closedPage, /The July 2026 intake window has closed\./);
assert.match(closedPage, /No deadline or paid assignment is currently being offered/);
assert.doesNotMatch(closedPage, /Submit calibration/);

const expectedClosedSources = ["/contribute", "/contribute/", "/reviewers", "/reviewers/", "/reviewers/index.html"];
for (const source of expectedClosedSources) {
  const rewrite = vercel.rewrites.find((candidate) => candidate.source === source);
  assert.equal(rewrite?.destination, "/reviewers/closed.html", `missing closed-intake rewrite for ${source}`);
}

console.log("Metaphilosophy pilot-first programme contracts verified.");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
