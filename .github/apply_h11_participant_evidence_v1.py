#!/usr/bin/env python3
from __future__ import annotations

import os
from pathlib import Path
from textwrap import dedent, indent

ROOT = Path(__file__).resolve().parents[1]
BRANCH = "agent/48-critique-pilot-20260730"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected exactly one anchor, found {count}: {old[:120]!r}")
    write(path, text.replace(old, new, 1))


def append_once(path: str, marker: str, content: str) -> None:
    text = read(path)
    if marker in text:
        return
    write(path, text.rstrip() + "\n\n" + content.strip() + "\n")


def ensure_absent(path: str, marker: str) -> None:
    if marker in read(path):
        raise RuntimeError(f"{path}: marker already present before patch: {marker}")


def main() -> None:
    if os.environ.get("GITHUB_REF_NAME") not in {None, BRANCH}:
        raise RuntimeError(f"Refusing to patch unexpected branch: {os.environ.get('GITHUB_REF_NAME')}")

    # Fail closed if a prior partial application is present.
    for path, marker in [
        ("api/staging.mjs", '"participant.evidence.record"'),
        ("src/staging-service.mjs", "participant.evidence.recorded"),
        ("staging/app.mjs", "Synthetic-session consent"),
    ]:
        ensure_absent(path, marker)

    # API action.
    replace_once(
        "api/staging.mjs",
        '  "assignment.submit",\n  "correction.request",',
        '  "assignment.submit",\n  "participant.evidence.record",\n  "correction.request",',
    )
    replace_once(
        "api/staging.mjs",
        '''        case "assignment.submit":
          requireMethod(req, "POST");
          result = await runtime.service.submitAssignment({ sessionToken, ...body });
          break;
        case "correction.request":''',
        '''        case "assignment.submit":
          requireMethod(req, "POST");
          result = await runtime.service.submitAssignment({ sessionToken, ...body });
          break;
        case "participant.evidence.record":
          requireMethod(req, "POST");
          result = await runtime.service.recordParticipantEvidence({ sessionToken, ...body });
          break;
        case "correction.request":''',
    )

    # Service constants.
    replace_once(
        "src/staging-service.mjs",
        '''const VALID_ROLES = new Set(["operator", "rater", "adjudicator"]);
const TERMINAL_ASSIGNMENT_STATES = new Set(["submitted", "withdrawn"]);''',
        '''const VALID_ROLES = new Set(["operator", "rater", "adjudicator"]);
const TERMINAL_ASSIGNMENT_STATES = new Set(["submitted", "withdrawn"]);
const PARTICIPANT_EVIDENCE_KINDS = new Set(["consent", "debrief"]);
const H11_CONSENT_VERSION = "H11-CONSENT-2026-08-07-V1";
const H11_DEBRIEF_VERSION = "H11-DEBRIEF-2026-08-07-V1";''',
    )

    service_method = indent(dedent(r'''
      async recordParticipantEvidence({ sessionToken, assignmentId, kind, payload }) {
        const authenticated = await this.requireRole(sessionToken, "rater");
        const state = await this.state();
        const assignment = ownedAssignment(state, assignmentId, authenticated.identity.id);
        if (assignment.kind !== "initial") {
          throw serviceError(400, "wrong_assignment_kind", "H-11 consent and debrief records attach to the initial synthetic assignment.");
        }
        if (!PARTICIPANT_EVIDENCE_KINDS.has(kind)) {
          throw serviceError(400, "invalid_evidence_kind", "Evidence kind must be consent or debrief.");
        }
        if (kind === "debrief" && !TERMINAL_ASSIGNMENT_STATES.has(assignment.status)) {
          throw serviceError(409, "assignment_not_terminal", "Submit or withdraw the synthetic assignment before recording the debrief.");
        }

        const normalized = normalizeParticipantEvidence(kind, payload);
        const existing = state.participantEvidence.find((record) => (
          record.assignmentId === assignmentId
          && record.identityId === authenticated.identity.id
          && record.kind === kind
        ));
        if (existing) {
          if (existing.version !== normalized.version || JSON.stringify(existing.payload) !== JSON.stringify(normalized.payload)) {
            throw serviceError(409, "participant_evidence_locked", "This participant evidence record is immutable and has already been submitted.");
          }
          return { record: publicParticipantEvidence(existing), replay: true };
        }

        const submittedAt = this.now().toISOString();
        const record = {
          id: randomUUID(),
          assignmentId,
          identityId: authenticated.identity.id,
          kind,
          version: normalized.version,
          payload: normalized.payload,
          submittedAt,
        };
        await this.store.appendMany([
          event("participant.evidence.recorded", record.id, authenticated.identity.id, record, submittedAt),
          event("audit.recorded", randomUUID(), authenticated.identity.id, {
            action: "participant.evidence.recorded",
            subjectId: record.id,
            assignmentId,
            kind,
            version: record.version,
          }, submittedAt),
        ]);
        return { record: publicParticipantEvidence(record), replay: false };
      }

    '''), "  ")
    replace_once(
        "src/staging-service.mjs",
        '''  async saveDraft({ sessionToken, assignmentId, critiqueId, expectedVersion, rating }) {''',
        service_method + '''  async saveDraft({ sessionToken, assignmentId, critiqueId, expectedVersion, rating }) {''',
    )

    # Workspace exposure is role-scoped. Public exports remain unchanged.
    replace_once(
        "src/staging-service.mjs",
        '''          withdrawalRequests: state.withdrawalRequests.filter((request) => request.assignmentId === assignment.id),
        };''',
        '''          withdrawalRequests: state.withdrawalRequests.filter((request) => request.assignmentId === assignment.id),
          participantEvidence: state.participantEvidence
            .filter((record) => record.assignmentId === assignment.id && record.identityId === identity.id)
            .map(publicParticipantEvidence),
        };''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''      adjudicationCases: state.adjudicationCases.map(publicAdjudicationCase),
      chain: state.chain,''',
        '''      adjudicationCases: state.adjudicationCases.map(publicAdjudicationCase),
      participantEvidence: state.participantEvidence.map(publicParticipantEvidence),
      chain: state.chain,''',
    )

    # Reducer.
    replace_once(
        "src/staging-service.mjs",
        '''    submissionReceipts: [], correctionRequests: [], withdrawalRequests: [], adjudicationCases: [], adjudicationReviews: [],
    labelSnapshots: [], auditEvents: [],''',
        '''    submissionReceipts: [], correctionRequests: [], withdrawalRequests: [], adjudicationCases: [], adjudicationReviews: [],
    participantEvidence: [], labelSnapshots: [], auditEvents: [],''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''      case "withdrawal.requested": upsert(state.withdrawalRequests, payload); break;
      case "adjudication.opened": upsert(state.adjudicationCases, payload); break;''',
        '''      case "withdrawal.requested": upsert(state.withdrawalRequests, payload); break;
      case "participant.evidence.recorded": upsert(state.participantEvidence, payload); break;
      case "adjudication.opened": upsert(state.adjudicationCases, payload); break;''',
    )

    evidence_normalizers = dedent(r'''
    function normalizeParticipantEvidence(kind, payload = {}) {
      if (kind === "consent") {
        const normalized = {
          scopeAndDataTermsRead: requireTrue(payload.scopeAndDataTermsRead, "Confirm that the scope and data terms were read."),
          syntheticScoresExcluded: requireTrue(payload.syntheticScoresExcluded, "Confirm that the synthetic scores are excluded from research use."),
          auditTrailAndNotesConsented: requireTrue(payload.auditTrailAndNotesConsented, "Consent to the private audit trail and de-identified internal usability notes."),
          voluntaryAndMayStop: requireTrue(payload.voluntaryAndMayStop, "Confirm that participation is voluntary and may be stopped."),
        };
        return { version: H11_CONSENT_VERSION, payload: normalized };
      }

      if (kind === "debrief") {
        const normalized = {
          centralityDefinition: requireText(payload.centralityDefinition, 20, 2000, "Centrality explanation"),
          strengthDefinition: requireText(payload.strengthDefinition, 20, 2000, "Strength explanation"),
          productImportance: requireText(payload.productImportance, 20, 2000, "Strength-times-centrality explanation"),
          lowClarityTreatment: requireText(payload.lowClarityTreatment, 20, 2000, "Low-clarity explanation"),
          immutableInitialsReason: requireText(payload.immutableInitialsReason, 20, 2000, "Immutable-initials explanation"),
          workflowClarity: requireScale(payload.workflowClarity, "Workflow clarity"),
          autosaveConfidence: requireScale(payload.autosaveConfidence, "Autosave confidence"),
          resumeConfidence: requireScale(payload.resumeConfidence, "Resume confidence"),
          lockedStateClarity: requireScale(payload.lockedStateClarity, "Locked-state clarity"),
          recoveryPathClarity: requireScale(payload.recoveryPathClarity, "Recovery-path clarity"),
          researchBoundaryClarity: requireScale(payload.researchBoundaryClarity, "Research-boundary clarity"),
          sawUnexpectedMetadata: requireBoolean(payload.sawUnexpectedMetadata, "Unexpected-metadata observation"),
          sawNonSyntheticMaterial: requireBoolean(payload.sawNonSyntheticMaterial, "Non-synthetic-material observation"),
          deviceClass: requireChoice(payload.deviceClass, ["desktop", "narrow_mobile", "tablet", "other"], "Device class"),
          browserFamily: requireChoice(payload.browserFamily, ["chrome", "safari", "firefox", "edge", "other"], "Browser"),
          recoveryPath: requireChoice(payload.recoveryPath, ["correction", "withdrawal", "controlled_failure", "none"], "Recovery path"),
          sessionDurationMinutes: requireInteger(payload.sessionDurationMinutes, 1, 240, "Session duration"),
          mostConfusing: optionalText(payload.mostConfusing, 4000),
          improvementSuggestion: requireText(payload.improvementSuggestion, 10, 4000, "Improvement suggestion"),
        };
        return { version: H11_DEBRIEF_VERSION, payload: normalized };
      }

      throw serviceError(400, "invalid_evidence_kind", "Evidence kind must be consent or debrief.");
    }

    function requireTrue(value, message) {
      if (value !== true) throw serviceError(400, "consent_incomplete", message);
      return true;
    }

    function requireBoolean(value, label) {
      if (typeof value !== "boolean") throw serviceError(400, "invalid_boolean", `${label} must be explicitly answered.`);
      return value;
    }

    function requireScale(value, label) {
      return requireInteger(value, 1, 5, label);
    }

    function requireInteger(value, minimum, maximum, label) {
      const number = Number(value);
      if (!Number.isInteger(number) || number < minimum || number > maximum) {
        throw serviceError(400, "invalid_integer", `${label} must be an integer from ${minimum} to ${maximum}.`);
      }
      return number;
    }

    function requireChoice(value, allowed, label) {
      const choice = String(value ?? "");
      if (!allowed.includes(choice)) throw serviceError(400, "invalid_choice", `${label} is invalid.`);
      return choice;
    }

    function optionalText(value, maximum) {
      return String(value ?? "").trim().slice(0, maximum);
    }

    ''')
    replace_once(
        "src/staging-service.mjs",
        '''function roundScore(value) {''',
        evidence_normalizers + '''function roundScore(value) {''',
    )
    replace_once(
        "src/staging-service.mjs",
        '''function publicAdjudicationCase(adjudicationCase) {
  return { id: adjudicationCase.id, positionId: adjudicationCase.positionId, trigger: adjudicationCase.trigger, reason: adjudicationCase.reason, triggerDetail: adjudicationCase.triggerDetail ?? [], status: adjudicationCase.status, createdAt: adjudicationCase.createdAt, closedAt: adjudicationCase.closedAt ?? null };
}

function publicCounts(state) {''',
        '''function publicAdjudicationCase(adjudicationCase) {
  return { id: adjudicationCase.id, positionId: adjudicationCase.positionId, trigger: adjudicationCase.trigger, reason: adjudicationCase.reason, triggerDetail: adjudicationCase.triggerDetail ?? [], status: adjudicationCase.status, createdAt: adjudicationCase.createdAt, closedAt: adjudicationCase.closedAt ?? null };
}

function publicParticipantEvidence(record) {
  return record ? {
    id: record.id,
    assignmentId: record.assignmentId,
    identityId: record.identityId,
    kind: record.kind,
    version: record.version,
    payload: structuredClone(record.payload),
    submittedAt: record.submittedAt,
  } : null;
}

function publicCounts(state) {''',
    )

    # Rater UI: consent gate, assignment, then debrief.
    replace_once(
        "staging/app.mjs",
        '''  for (const assignment of state.workspace.assignments) {
    const section = document.createElement("section");''',
        '''  for (const assignment of state.workspace.assignments) {
    if (assignment.kind === "initial") {
      const consentState = renderParticipantConsentPanel(assignment);
      elements.workspaceContent.append(consentState.panel);
      if (!consentState.recorded) continue;
    }

    const section = document.createElement("section");''',
    )

    rater_evidence_ui = dedent(r'''
    function renderParticipantConsentPanel(assignment) {
      const existing = (assignment.participantEvidence ?? []).find((record) => record.kind === "consent") ?? null;
      const panel = document.createElement("section");
      panel.className = "panel participant-evidence-panel participant-consent-panel";
      panel.dataset.assignmentId = assignment.id;
      panel.dataset.evidenceKind = "consent";

      if (existing) {
        panel.innerHTML = `
          <p class="eyebrow">Synthetic-session consent</p>
          <div class="evidence-complete">
            <div>
              <h2>Consent recorded</h2>
              <p>Your synthetic scores remain excluded from research, model training, evaluation, publication, and public attribution.</p>
            </div>
            <span>${escapeHtml(new Date(existing.submittedAt).toLocaleString())}</span>
          </div>`;
        return { panel, recorded: true };
      }

      panel.innerHTML = `
        <p class="eyebrow">Synthetic-session consent</p>
        <h2>Confirm the scope before opening the assignment</h2>
        <p class="muted">This protected exercise tests the workflow and your understanding of the rubric. It is not a research-rating task. Identifiable H-11 records follow the approved limited-retention rule; Metaphilosophy will not publicly name, quote, or attribute your feedback without separate permission.</p>
        <form class="participant-consent-form evidence-form" data-assignment-id="${escapeHtml(assignment.id)}">
          <label class="check-row"><input name="scopeAndDataTermsRead" type="checkbox" required><span>I have read the H-11 synthetic usability-session scope and data terms.</span></label>
          <label class="check-row"><input name="syntheticScoresExcluded" type="checkbox" required><span>I understand that my scores are synthetic test data and are excluded from research use.</span></label>
          <label class="check-row"><input name="auditTrailAndNotesConsented" type="checkbox" required><span>I consent to the private audit trail and de-identified internal usability notes described in the session terms.</span></label>
          <label class="check-row"><input name="voluntaryAndMayStop" type="checkbox" required><span>I understand that participation is voluntary and that I may stop or withdraw at any time.</span></label>
          <div class="evidence-actions">
            <button class="primary-button" type="submit">Record consent and open synthetic assignment</button>
            <p class="form-status" role="status"></p>
          </div>
        </form>`;

      const form = panel.querySelector(".participant-consent-form");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const status = form.querySelector(".form-status");
        const submit = form.querySelector('button[type="submit"]');
        const data = new FormData(form);
        const payload = {
          scopeAndDataTermsRead: data.get("scopeAndDataTermsRead") === "on",
          syntheticScoresExcluded: data.get("syntheticScoresExcluded") === "on",
          auditTrailAndNotesConsented: data.get("auditTrailAndNotesConsented") === "on",
          voluntaryAndMayStop: data.get("voluntaryAndMayStop") === "on",
        };
        submit.disabled = true;
        status.textContent = "Recording consent…";
        status.className = "form-status";
        try {
          await api("participant.evidence.record", {
            method: "POST",
            body: { assignmentId: assignment.id, kind: "consent", payload },
          });
          status.textContent = "Consent recorded.";
          await loadWorkspace();
        } catch (error) {
          status.textContent = error.message;
          status.className = "form-status error-message";
        } finally {
          submit.disabled = false;
        }
      });

      return { panel, recorded: false };
    }

    function renderParticipantDebriefPanel(assignment) {
      const existing = (assignment.participantEvidence ?? []).find((record) => record.kind === "debrief") ?? null;
      const panel = document.createElement("section");
      panel.className = "panel participant-evidence-panel participant-debrief-panel";
      panel.dataset.assignmentId = assignment.id;
      panel.dataset.evidenceKind = "debrief";

      if (existing) {
        panel.innerHTML = `
          <p class="eyebrow">Synthetic-session debrief</p>
          <div class="evidence-complete">
            <div>
              <h2>Debrief recorded</h2>
              <p>The private append-only evidence record now includes your rubric-comprehension and workflow-usability responses.</p>
            </div>
            <span>${escapeHtml(new Date(existing.submittedAt).toLocaleString())}</span>
          </div>`;
        return panel;
      }

      panel.innerHTML = `
        <p class="eyebrow">Synthetic-session debrief</p>
        <h2>Record what the workflow made clear—and what it did not</h2>
        <p class="muted">Answer in your own words. These responses are synthetic usability evidence, not research ratings. Report any hidden metadata or non-synthetic material immediately.</p>
        <form class="participant-debrief-form evidence-form" data-assignment-id="${escapeHtml(assignment.id)}">
          <fieldset>
            <legend>Rubric comprehension</legend>
            <label class="full-width"><span>What is centrality measuring?</span><textarea name="centralityDefinition" rows="3" minlength="20" maxlength="2000" required></textarea></label>
            <label class="full-width"><span>What is strength measuring?</span><textarea name="strengthDefinition" rows="3" minlength="20" maxlength="2000" required></textarea></label>
            <label class="full-width"><span>Why can the product of strength and centrality matter even when the two components are individually ambiguous?</span><textarea name="productImportance" rows="3" minlength="20" maxlength="2000" required></textarea></label>
            <label class="full-width"><span>What should happen when clarity is below 0.5?</span><textarea name="lowClarityTreatment" rows="3" minlength="20" maxlength="2000" required></textarea></label>
            <label class="full-width"><span>Why are initial ratings preserved after later reconsideration?</span><textarea name="immutableInitialsReason" rows="3" minlength="20" maxlength="2000" required></textarea></label>
          </fieldset>

          <fieldset>
            <legend>Workflow experience · 1 is poor, 5 is excellent</legend>
            <div class="evidence-scale-grid">
              ${renderScaleSelect("workflowClarity", "Clarity of what to do next")}
              ${renderScaleSelect("autosaveConfidence", "Confidence in autosave")}
              ${renderScaleSelect("resumeConfidence", "Confidence after close and resume")}
              ${renderScaleSelect("lockedStateClarity", "Clarity of the post-submit locked state")}
              ${renderScaleSelect("recoveryPathClarity", "Clarity of correction, withdrawal, or failure recovery")}
              ${renderScaleSelect("researchBoundaryClarity", "Clarity that this is not research")}
            </div>
          </fieldset>

          <fieldset>
            <legend>Session context and safety</legend>
            <div class="evidence-scale-grid">
              <label><span>Device class</span><select name="deviceClass" required><option value="">Select</option><option value="desktop">Desktop or laptop</option><option value="narrow_mobile">Narrow mobile viewport</option><option value="tablet">Tablet</option><option value="other">Other</option></select></label>
              <label><span>Browser</span><select name="browserFamily" required><option value="">Select</option><option value="chrome">Chrome / Chromium</option><option value="safari">Safari</option><option value="firefox">Firefox</option><option value="edge">Edge</option><option value="other">Other</option></select></label>
              <label><span>Recovery path exercised</span><select name="recoveryPath" required><option value="">Select</option><option value="correction">Correction request</option><option value="withdrawal">Withdrawal request</option><option value="controlled_failure">Controlled failure and retry</option><option value="none">None</option></select></label>
              <label><span>Session duration in minutes</span><input name="sessionDurationMinutes" type="number" min="1" max="240" step="1" required></label>
              <label><span>Did you see metadata, another participant, a source, a provisional label, or adjudication state that should have been hidden?</span><select name="sawUnexpectedMetadata" required><option value="">Select</option><option value="no">No</option><option value="yes">Yes</option></select></label>
              <label><span>Did any real, protected, or non-synthetic material appear?</span><select name="sawNonSyntheticMaterial" required><option value="">Select</option><option value="no">No</option><option value="yes">Yes</option></select></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Usability feedback</legend>
            <label class="full-width"><span>What was most confusing or cognitively burdensome?</span><textarea name="mostConfusing" rows="4" maxlength="4000"></textarea></label>
            <label class="full-width"><span>What single change would most improve the experience for an expert rater?</span><textarea name="improvementSuggestion" rows="4" minlength="10" maxlength="4000" required></textarea></label>
          </fieldset>

          <div class="support-callout evidence-stop-callout">
            <strong>Do not submit quietly if a stop condition occurred</strong>
            <span>If either safety question is “Yes,” stop and contact the operator in the invitation thread. The record will preserve the report, but the session must be treated as stopped pending review.</span>
          </div>

          <div class="evidence-actions">
            <button class="primary-button" type="submit">Submit synthetic-session debrief</button>
            <p class="form-status" role="status"></p>
          </div>
        </form>`;

      const form = panel.querySelector(".participant-debrief-form");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const status = form.querySelector(".form-status");
        const submit = form.querySelector('button[type="submit"]');
        const data = new FormData(form);
        const payload = {
          centralityDefinition: data.get("centralityDefinition") || "",
          strengthDefinition: data.get("strengthDefinition") || "",
          productImportance: data.get("productImportance") || "",
          lowClarityTreatment: data.get("lowClarityTreatment") || "",
          immutableInitialsReason: data.get("immutableInitialsReason") || "",
          workflowClarity: Number(data.get("workflowClarity")),
          autosaveConfidence: Number(data.get("autosaveConfidence")),
          resumeConfidence: Number(data.get("resumeConfidence")),
          lockedStateClarity: Number(data.get("lockedStateClarity")),
          recoveryPathClarity: Number(data.get("recoveryPathClarity")),
          researchBoundaryClarity: Number(data.get("researchBoundaryClarity")),
          sawUnexpectedMetadata: data.get("sawUnexpectedMetadata") === "yes",
          sawNonSyntheticMaterial: data.get("sawNonSyntheticMaterial") === "yes",
          deviceClass: data.get("deviceClass") || "",
          browserFamily: data.get("browserFamily") || "",
          recoveryPath: data.get("recoveryPath") || "",
          sessionDurationMinutes: Number(data.get("sessionDurationMinutes")),
          mostConfusing: data.get("mostConfusing") || "",
          improvementSuggestion: data.get("improvementSuggestion") || "",
        };
        submit.disabled = true;
        status.textContent = "Recording debrief…";
        status.className = "form-status";
        try {
          await api("participant.evidence.record", {
            method: "POST",
            body: { assignmentId: assignment.id, kind: "debrief", payload },
          });
          status.textContent = "Debrief recorded.";
          await loadWorkspace();
        } catch (error) {
          status.textContent = error.message;
          status.className = "form-status error-message";
        } finally {
          submit.disabled = false;
        }
      });

      return panel;
    }

    function renderScaleSelect(name, label) {
      return `<label><span>${escapeHtml(label)}</span><select name="${escapeHtml(name)}" required><option value="">Select</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>`;
    }

    ''')
    replace_once(
        "staging/app.mjs",
        '''    renderAssignmentActions(section.querySelector(".assignment-actions"), assignment);
    elements.workspaceContent.append(section);
  }
}

function renderCritiqueCard''',
        '''    renderAssignmentActions(section.querySelector(".assignment-actions"), assignment);
    elements.workspaceContent.append(section);
    if (assignment.kind === "initial" && ["submitted", "withdrawn"].includes(assignment.status)) {
      elements.workspaceContent.append(renderParticipantDebriefPanel(assignment));
    }
  }
}

''' + rater_evidence_ui + '''function renderCritiqueCard''',
    )

    # Operator evidence panel.
    replace_once(
        "staging/app.mjs",
        '''  renderOperatorCorrectionQueue();
  renderOperatorWithdrawalQueue();''',
        '''  renderOperatorParticipantEvidence();
  renderOperatorCorrectionQueue();
  renderOperatorWithdrawalQueue();''',
    )

    operator_evidence_ui = dedent(r'''
    function renderOperatorParticipantEvidence() {
      const panel = document.createElement("section");
      panel.className = "panel operator-queue participant-evidence-operator";
      panel.dataset.queue = "participant-evidence";
      panel.innerHTML = "<p class=\"eyebrow\">H-11 human evidence</p><h2>Consent and debrief records</h2><p class=\"muted\">These records are private synthetic-usability evidence. They do not authorize research use, participant access, payment, or H-12 sign-off.</p>";

      const initialAssignments = (state.workspace.assignments ?? []).filter((assignment) => assignment.kind === "initial");
      if (!initialAssignments.length) {
        panel.insertAdjacentHTML("beforeend", "<p class=\"muted\">No initial synthetic assignment has been created.</p>");
      }

      for (const assignment of initialAssignments) {
        const identity = state.workspace.identities.find((candidate) => candidate.id === assignment.identityId);
        const records = (state.workspace.participantEvidence ?? []).filter((record) => record.assignmentId === assignment.id);
        const consent = records.find((record) => record.kind === "consent") ?? null;
        const debrief = records.find((record) => record.kind === "debrief") ?? null;
        const card = document.createElement("article");
        card.className = "subpanel operator-evidence-card";
        card.dataset.assignmentId = assignment.id;
        card.innerHTML = `
          <div class="operator-evidence-heading">
            <div><p class="eyebrow">${escapeHtml(assignment.status)}</p><h3>${escapeHtml(identity?.displayName || assignment.identityId)}</h3></div>
            <div class="evidence-chip-row">
              <span class="evidence-chip ${consent ? "is-complete" : ""}">Consent ${consent ? "recorded" : "missing"}</span>
              <span class="evidence-chip ${debrief ? "is-complete" : ""}">Debrief ${debrief ? "recorded" : "missing"}</span>
            </div>
          </div>
          <p>Assignment <code>${escapeHtml(assignment.id)}</code></p>`;

        if (consent) {
          card.insertAdjacentHTML("beforeend", `<p class="status-banner"><strong>Consent record</strong><span>${escapeHtml(consent.version)} · ${escapeHtml(consent.submittedAt)}</span></p>`);
        }

        if (debrief) {
          const p = debrief.payload;
          const details = document.createElement("details");
          details.className = "technical-integrity operator-debrief-details";
          details.innerHTML = `
            <summary>Review synthetic-session debrief</summary>
            <dl>
              <div><dt>Centrality</dt><dd>${escapeHtml(p.centralityDefinition)}</dd></div>
              <div><dt>Strength</dt><dd>${escapeHtml(p.strengthDefinition)}</dd></div>
              <div><dt>Strength × centrality</dt><dd>${escapeHtml(p.productImportance)}</dd></div>
              <div><dt>Low clarity</dt><dd>${escapeHtml(p.lowClarityTreatment)}</dd></div>
              <div><dt>Immutable initials</dt><dd>${escapeHtml(p.immutableInitialsReason)}</dd></div>
              <div><dt>Workflow scales</dt><dd>${escapeHtml(JSON.stringify({
                workflow: p.workflowClarity,
                autosave: p.autosaveConfidence,
                resume: p.resumeConfidence,
                lockedState: p.lockedStateClarity,
                recovery: p.recoveryPathClarity,
                researchBoundary: p.researchBoundaryClarity,
              }))}</dd></div>
              <div><dt>Safety observations</dt><dd>Unexpected metadata: ${p.sawUnexpectedMetadata ? "YES — STOP" : "no"} · non-synthetic material: ${p.sawNonSyntheticMaterial ? "YES — STOP" : "no"}</dd></div>
              <div><dt>Session context</dt><dd>${escapeHtml(p.deviceClass)} · ${escapeHtml(p.browserFamily)} · ${escapeHtml(p.recoveryPath)} · ${escapeHtml(p.sessionDurationMinutes)} minutes</dd></div>
              <div><dt>Most confusing</dt><dd>${escapeHtml(p.mostConfusing || "No response.")}</dd></div>
              <div><dt>Suggested change</dt><dd>${escapeHtml(p.improvementSuggestion)}</dd></div>
            </dl>`;
          if (p.sawUnexpectedMetadata || p.sawNonSyntheticMaterial) {
            details.classList.add("has-stop-condition");
          }
          card.append(details);
        }

        panel.append(card);
      }
      elements.workspaceContent.append(panel);
    }

    ''')
    replace_once(
        "staging/app.mjs",
        '''function renderOperatorCorrectionQueue() {''',
        operator_evidence_ui + '''function renderOperatorCorrectionQueue() {''',
    )

    # CSS for evidence surfaces.
    append_once(
        "staging/participant-readiness.css",
        ".participant-evidence-panel {",
        dedent(r'''
        .participant-evidence-panel {
          border-color: #b8cfcc;
          background:
            linear-gradient(145deg, rgba(244, 250, 249, 0.96), rgba(255, 255, 255, 0.96)),
            var(--paper);
        }

        .participant-evidence-panel h2 {
          margin-bottom: 8px;
        }

        .evidence-form {
          display: grid;
          gap: 18px;
          margin-top: 22px;
        }

        .evidence-form fieldset {
          display: grid;
          gap: 14px;
          margin: 0;
          padding: 18px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.82);
        }

        .evidence-form legend {
          padding: 0 8px;
          color: var(--ink);
          font-size: 13px;
          font-weight: 850;
        }

        .participant-consent-form .check-row {
          align-items: flex-start;
          padding: 13px 14px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: #fff;
        }

        .participant-consent-form .check-row input {
          margin-top: 3px;
        }

        .evidence-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .evidence-actions .form-status {
          margin: 0;
        }

        .evidence-complete {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 18px;
          border: 1px solid #a9d0be;
          border-radius: 12px;
          background: #edf8f2;
        }

        .evidence-complete h2,
        .evidence-complete p {
          margin: 0;
        }

        .evidence-complete p {
          margin-top: 6px;
          color: #3f6153;
          font-size: 13px;
          line-height: 1.55;
        }

        .evidence-complete > span {
          flex: 0 0 auto;
          color: var(--success);
          font-size: 11px;
          font-weight: 800;
        }

        .evidence-scale-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .evidence-stop-callout {
          margin-top: 0;
        }

        .operator-evidence-card {
          margin-top: 14px;
        }

        .operator-evidence-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .operator-evidence-heading h3 {
          margin-bottom: 0;
        }

        .evidence-chip-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 7px;
        }

        .evidence-chip {
          padding: 6px 9px;
          border: 1px solid #d4a7a2;
          border-radius: 999px;
          background: #fff4f2;
          color: #7c3731;
          font-size: 10px;
          font-weight: 850;
        }

        .evidence-chip.is-complete {
          border-color: #a9d0be;
          background: #edf8f2;
          color: var(--success);
        }

        .operator-debrief-details dl > div {
          grid-template-columns: minmax(130px, 0.28fr) minmax(0, 1fr);
        }

        .operator-debrief-details.has-stop-condition {
          border-color: #d67b72;
          background: #fff4f2;
        }

        @media (max-width: 700px) {
          .evidence-scale-grid {
            grid-template-columns: 1fr;
          }

          .evidence-complete,
          .operator-evidence-heading {
            flex-direction: column;
          }

          .evidence-chip-row {
            justify-content: flex-start;
          }

          .evidence-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .evidence-actions button {
            width: 100%;
          }
        }
        '''),
    )

    # Contract test.
    consent_test = dedent(r'''
      const consentA = await harness.service.recordParticipantEvidence({
        sessionToken: raterA.sessionToken,
        assignmentId: assignmentA.assignment.id,
        kind: "consent",
        payload: makeConsentPayload(),
      });
      const consentB = await harness.service.recordParticipantEvidence({
        sessionToken: raterB.sessionToken,
        assignmentId: assignmentB.assignment.id,
        kind: "consent",
        payload: makeConsentPayload(),
      });
      assert.equal(consentA.replay, false);
      assert.equal(consentB.replay, false);
      assert.equal((await harness.service.recordParticipantEvidence({
        sessionToken: raterA.sessionToken,
        assignmentId: assignmentA.assignment.id,
        kind: "consent",
        payload: makeConsentPayload(),
      })).replay, true);
    ''')
    replace_once(
        "test/human-workflow-staging-contract.test.mjs",
        '''  const assignmentA = await harness.service.createAssignment({ actorSessionToken: operator.sessionToken, identityId: raterAIdentity.identity.id, positionId, kind: "initial" });
  const assignmentB = await harness.service.createAssignment({ actorSessionToken: operator.sessionToken, identityId: raterBIdentity.identity.id, positionId, kind: "initial" });

  const workspaceA''',
        '''  const assignmentA = await harness.service.createAssignment({ actorSessionToken: operator.sessionToken, identityId: raterAIdentity.identity.id, positionId, kind: "initial" });
  const assignmentB = await harness.service.createAssignment({ actorSessionToken: operator.sessionToken, identityId: raterBIdentity.identity.id, positionId, kind: "initial" });

''' + consent_test + '''

  const workspaceA''',
    )
    replace_once(
        "test/human-workflow-staging-contract.test.mjs",
        '''  const finalState = await harness.service.state();
  assert.equal(finalState.ratings.length, 12);
  assert.equal(finalState.labelSnapshots.length, 1);
  assert.equal(finalState.assignments.find((item) => item.id === assignmentB.assignment.id).status, "withdrawn");

  const publicExport''',
        '''  await harness.service.recordParticipantEvidence({
    sessionToken: raterA.sessionToken,
    assignmentId: assignmentA.assignment.id,
    kind: "debrief",
    payload: makeDebriefPayload({ recoveryPath: "correction", deviceClass: "desktop" }),
  });
  await harness.service.recordParticipantEvidence({
    sessionToken: raterB.sessionToken,
    assignmentId: assignmentB.assignment.id,
    kind: "debrief",
    payload: makeDebriefPayload({ recoveryPath: "withdrawal", deviceClass: "narrow_mobile" }),
  });
  await assert.rejects(
    () => harness.service.recordParticipantEvidence({
      sessionToken: raterB.sessionToken,
      assignmentId: assignmentB.assignment.id,
      kind: "debrief",
      payload: { ...makeDebriefPayload({ recoveryPath: "withdrawal", deviceClass: "narrow_mobile" }), improvementSuggestion: "A different suggestion must not overwrite the recorded debrief." },
    }),
    (error) => error.status === 409 && error.code === "participant_evidence_locked",
  );

  const finalState = await harness.service.state();
  assert.equal(finalState.ratings.length, 12);
  assert.equal(finalState.labelSnapshots.length, 1);
  assert.equal(finalState.participantEvidence.length, 4);
  assert.equal(finalState.assignments.find((item) => item.id === assignmentB.assignment.id).status, "withdrawn");

  const operatorWorkspace = await harness.service.getWorkspace(operator.sessionToken);
  assert.equal(operatorWorkspace.participantEvidence.length, 4);
  const publicExport''',
    )
    replace_once(
        "test/human-workflow-staging-contract.test.mjs",
        '''  assert.equal(JSON.stringify(publicExport).includes("a@example.invalid"), false);
  assert.ok(privateExport.events.length > 20);''',
        '''  assert.equal(JSON.stringify(publicExport).includes("a@example.invalid"), false);
  assert.equal(JSON.stringify(publicExport).includes("Centrality measures how much the attacked claim matters"), false);
  assert.equal(privateExport.state.participantEvidence.length, 4);
  assert.ok(JSON.stringify(privateExport).includes("Centrality measures how much the attacked claim matters"));
  assert.ok(privateExport.events.length > 20);''',
    )

    test_helpers = dedent(r'''
    function makeConsentPayload() {
      return {
        scopeAndDataTermsRead: true,
        syntheticScoresExcluded: true,
        auditTrailAndNotesConsented: true,
        voluntaryAndMayStop: true,
      };
    }

    function makeDebriefPayload(overrides = {}) {
      return {
        centralityDefinition: "Centrality measures how much the attacked claim matters to the position as it is actually stated.",
        strengthDefinition: "Strength measures how successfully the critique undermines the particular claims that it attacks.",
        productImportance: "The product tracks substantive impact even when some score mass could reasonably move between strength and centrality.",
        lowClarityTreatment: "When clarity falls below 0.5, the component scores become less dependable and clarity plus overall deserve special weight.",
        immutableInitialsReason: "Initial ratings stay immutable so later reconsideration cannot erase the original independent distribution of judgment.",
        workflowClarity: 5,
        autosaveConfidence: 5,
        resumeConfidence: 5,
        lockedStateClarity: 5,
        recoveryPathClarity: 4,
        researchBoundaryClarity: 5,
        sawUnexpectedMetadata: false,
        sawNonSyntheticMaterial: false,
        deviceClass: overrides.deviceClass ?? "desktop",
        browserFamily: "chrome",
        recoveryPath: overrides.recoveryPath ?? "none",
        sessionDurationMinutes: 72,
        mostConfusing: "The distinction between correctness and strength required the most careful attention.",
        improvementSuggestion: "Keep a compact rubric summary visible while the participant writes the object-level rationale.",
      };
    }

    ''')
    replace_once(
        "test/human-workflow-staging-contract.test.mjs",
        '''function makeRating(overall, strength, overrides = {}) {''',
        test_helpers + '''function makeRating(overall, strength, overrides = {}) {''',
    )

    # Browser test.
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''  await expect(pageA.getByRole("heading", { name: "Rate contextualized critiques" })).toBeVisible();
  await expect(pageA.locator(".critique-card")).toHaveCount(4);''',
        '''  await expect(pageA.getByRole("heading", { name: "Rate contextualized critiques" })).toBeVisible();
  await completeSyntheticConsent(pageA);
  await expect(pageA.locator(".critique-card")).toHaveCount(4);''',
    )
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''  await redeemInBrowser(pageB, setup.raterB.inviteToken);
  await expect(pageB.getByText("Synthetic browser rater A")).toHaveCount(0);''',
        '''  await redeemInBrowser(pageB, setup.raterB.inviteToken);
  await completeSyntheticConsent(pageB);
  await expect(pageB.getByText("Synthetic browser rater A")).toHaveCount(0);''',
    )
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''  await expect(pageB.locator(".withdrawal-request-status")).toContainText("Withdrawal recorded; assignment locked");
  await expect(pageB.locator(".withdrawal-request-status")).toContainText("remain in the private audit trail");

  const operatorContext''',
        '''  await expect(pageB.locator(".withdrawal-request-status")).toContainText("Withdrawal recorded; assignment locked");
  await expect(pageB.locator(".withdrawal-request-status")).toContainText("remain in the private audit trail");

  await completeSyntheticDebrief(resumedPageA, { recoveryPath: "correction", deviceClass: "desktop" });
  await completeSyntheticDebrief(pageB, { recoveryPath: "withdrawal", deviceClass: "narrow_mobile" });

  const operatorContext''',
    )
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''  await expect(operatorPage.getByRole("heading", { name: "Staging operator workspace" })).toBeVisible();
  await expect(operatorPage.locator('[data-queue="corrections"]')).toContainText("Synthetic browser rater A");''',
        '''  await expect(operatorPage.getByRole("heading", { name: "Staging operator workspace" })).toBeVisible();
  await expect(operatorPage.locator('[data-queue="participant-evidence"]')).toContainText("Synthetic browser rater A");
  await expect(operatorPage.locator('[data-queue="participant-evidence"]')).toContainText("Synthetic browser rater B");
  await expect(operatorPage.locator('[data-queue="participant-evidence"]')).toContainText("Consent recorded");
  await expect(operatorPage.locator('[data-queue="participant-evidence"]')).toContainText("Debrief recorded");
  await expect(operatorPage.locator('[data-queue="corrections"]')).toContainText("Synthetic browser rater A");''',
    )
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''  expect(privateExport.state.assignments.find((assignment) => assignment.id === setup.raterB.assignmentId).status).toBe("withdrawn");

  const snapshots''',
        '''  expect(privateExport.state.assignments.find((assignment) => assignment.id === setup.raterB.assignmentId).status).toBe("withdrawn");
  expect(privateExport.state.participantEvidence).toHaveLength(4);
  expect(privateExport.state.participantEvidence.filter((record) => record.kind === "consent")).toHaveLength(2);
  expect(privateExport.state.participantEvidence.filter((record) => record.kind === "debrief")).toHaveLength(2);

  const snapshots''',
    )
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''  expect(JSON.stringify(publicExport)).not.toContain("@staging.metaphilosophy.invalid");
  expect(publicExport.counts.ratings).toBe(12);''',
        '''  expect(JSON.stringify(publicExport)).not.toContain("@staging.metaphilosophy.invalid");
  expect(JSON.stringify(publicExport)).not.toContain("Centrality measures how much the attacked claim matters");
  expect(publicExport.counts.ratings).toBe(12);''',
    )

    e2e_helpers = dedent(r'''
    async function completeSyntheticConsent(page) {
      const form = page.locator(".participant-consent-form").first();
      await expect(form).toBeVisible();
      for (const name of [
        "scopeAndDataTermsRead",
        "syntheticScoresExcluded",
        "auditTrailAndNotesConsented",
        "voluntaryAndMayStop",
      ]) {
        await form.locator(`input[name="${name}"]`).check();
      }
      await form.getByRole("button", { name: "Record consent and open synthetic assignment" }).click();
      await expect(page.getByText("Consent recorded", { exact: true })).toBeVisible();
    }

    async function completeSyntheticDebrief(page, { recoveryPath, deviceClass }) {
      const form = page.locator(".participant-debrief-form").first();
      await expect(form).toBeVisible();
      await form.locator('textarea[name="centralityDefinition"]').fill("Centrality measures how much the attacked claim matters to the position as it is actually stated.");
      await form.locator('textarea[name="strengthDefinition"]').fill("Strength measures how successfully the critique undermines the particular claims that it attacks.");
      await form.locator('textarea[name="productImportance"]').fill("The product tracks substantive impact even when score mass can reasonably move between strength and centrality.");
      await form.locator('textarea[name="lowClarityTreatment"]').fill("When clarity is below 0.5, the component ratings become less dependable and clarity plus overall deserve special weight.");
      await form.locator('textarea[name="immutableInitialsReason"]').fill("Initial ratings remain immutable so later reconsideration cannot erase the original independent distribution.");
      for (const [name, value] of [
        ["workflowClarity", "5"],
        ["autosaveConfidence", "5"],
        ["resumeConfidence", "5"],
        ["lockedStateClarity", "5"],
        ["recoveryPathClarity", "4"],
        ["researchBoundaryClarity", "5"],
      ]) {
        await form.locator(`select[name="${name}"]`).selectOption(value);
      }
      await form.locator('select[name="deviceClass"]').selectOption(deviceClass);
      await form.locator('select[name="browserFamily"]').selectOption("chrome");
      await form.locator('select[name="recoveryPath"]').selectOption(recoveryPath);
      await form.locator('input[name="sessionDurationMinutes"]').fill("72");
      await form.locator('select[name="sawUnexpectedMetadata"]').selectOption("no");
      await form.locator('select[name="sawNonSyntheticMaterial"]').selectOption("no");
      await form.locator('textarea[name="mostConfusing"]').fill("The distinction between correctness and strength required the most careful attention.");
      await form.locator('textarea[name="improvementSuggestion"]').fill("Keep a compact rubric summary visible while the participant writes the object-level rationale.");
      await form.getByRole("button", { name: "Submit synthetic-session debrief" }).click();
      await expect(page.getByText("Debrief recorded", { exact: true })).toBeVisible();
    }

    ''')
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''async function redeemInBrowser(page, token) {''',
        e2e_helpers + '''async function redeemInBrowser(page, token) {''',
    )

    # Static verifier.
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''  "staging/app.mjs",
  "staging/styles.css",''',
        '''  "staging/app.mjs",
  "staging/styles.css",
  "staging/participant-readiness.mjs",
  "staging/participant-readiness.css",''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["api/staging.mjs"], /researchRatingsAuthorized: false/);''',
        '''assert.match(contents["api/staging.mjs"], /researchRatingsAuthorized: false/);
assert.match(contents["api/staging.mjs"], /participant\\.evidence\\.record/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["src/staging-service.mjs"], /assessabilityDisagreement/);''',
        '''assert.match(contents["src/staging-service.mjs"], /assessabilityDisagreement/);
assert.match(contents["src/staging-service.mjs"], /participant\\.evidence\\.recorded/);
assert.match(contents["src/staging-service.mjs"], /H11-CONSENT-2026-08-07-V1/);
assert.match(contents["src/staging-service.mjs"], /H11-DEBRIEF-2026-08-07-V1/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["staging/app.mjs"], /Explicitly unresolved/);''',
        '''assert.match(contents["staging/app.mjs"], /Explicitly unresolved/);
assert.match(contents["staging/app.mjs"], /Synthetic-session consent/);
assert.match(contents["staging/app.mjs"], /Record consent and open synthetic assignment/);
assert.match(contents["staging/app.mjs"], /Submit synthetic-session debrief/);
assert.match(contents["staging/app.mjs"], /Consent and debrief records/);
assert.match(contents["staging/participant-readiness.css"], /participant-evidence-panel/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /snapshot\\.reratingIds\\.length === 4/);''',
        '''assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /snapshot\\.reratingIds\\.length === 4/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /completeSyntheticConsent/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /completeSyntheticDebrief/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /participantEvidence/);''',
    )

    # Operational record.
    ops_path = ROOT / "ops/next-steps-2026-07-23/h11-integrated-consent-debrief-flow-2026-08-07.md"
    if ops_path.exists():
        raise RuntimeError(f"{ops_path.relative_to(ROOT)} already exists")
    ops_path.write_text(dedent(r'''
    # H-11 integrated consent and debrief flow — 2026-08-07

    **Status:** implementation candidate on the draft Pilot 01 branch; not deployed and not authorized for participant use
    **Scope:** synthetic H-11 usability evidence only
    **Research-use state:** `research_ratings_authorized=false`

    ## Product change

    Metaphilosophy Review now has an in-product, append-only evidence path for the two human checks that were previously dependent on email and manual notes:

    1. **Synthetic-session consent** before the initial assignment is displayed.
    2. **Rubric-comprehension and usability debrief** after the initial assignment is submitted or withdrawn.

    The consent record uses the approved H-11 statements: scope and terms read, synthetic scores excluded from research, consent to the private audit trail and de-identified internal notes, and voluntary participation with the right to stop.

    The debrief records:

    - centrality, strength, strength-times-centrality, low-clarity, and immutable-initials explanations;
    - six 1–5 workflow-confidence ratings;
    - explicit hidden-metadata and non-synthetic-material observations;
    - device, browser, recovery path, and duration;
    - the most confusing part and one prioritized improvement.

    ## Integrity and privacy

    - Evidence records are immutable and idempotent.
    - Records are bound to the authenticated rater and initial synthetic assignment.
    - Debrief submission is rejected until the initial assignment is submitted or withdrawn.
    - The protected operator workspace can inspect the evidence and receives a visible stop-condition warning.
    - Private exports contain the records.
    - Public-safe exports continue to omit participant evidence and free text.
    - No new database table or research authorization is introduced; records use the existing append-only synthetic event ledger.

    ## Release boundary

    This change invalidates none of the already accepted evidence because it is not yet on the accepted release branch. It must pass the complete contract, repository, build, synthetic lifecycle, disposable PostgreSQL, support-tabletop, and rendered Chromium gates before it can be considered as a successor candidate. It does not authorize contact, access, payment, research ratings, publication, or production deployment.
    ''').strip() + "\n", encoding="utf-8")

    # Remove one-shot helpers before the resulting product commit.
    (ROOT / ".github/apply_h11_participant_evidence_v1.py").unlink(missing_ok=True)
    (ROOT / ".github/workflows/apply-h11-participant-evidence-v1.yml").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
