import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const appPath = resolve(root, "staging/app.mjs");
let source = await readFile(appPath, "utf8");

const assignmentActions = templateSource(String.raw`function renderAssignmentActions(container, assignment) {
  const correctionRequests = assignment.correctionRequests ?? [];
  const withdrawalRequests = assignment.withdrawalRequests ?? [];
  const latestCorrection = correctionRequests.at(-1) ?? null;
  const latestWithdrawal = withdrawalRequests.at(-1) ?? null;

  if (assignment.status === "submitted") {
    const receipt = assignment.receipt;
    container.innerHTML = \`<div class="receipt"><strong>Submitted and locked.</strong><span>Receipt \${escapeHtml(receipt?.id || "recorded")}</span><span>Payload \${escapeHtml(receipt?.payloadHash?.slice(0, 16) || "")}…</span></div>\`;

    if (latestCorrection) {
      const correctionStatus = document.createElement("div");
      correctionStatus.className = "status-banner correction-request-status";
      correctionStatus.innerHTML = \`<strong>Correction request: \${escapeHtml(latestCorrection.status)}</strong><span>Original ratings remain immutable.</span><span>Reason: \${escapeHtml(latestCorrection.reason)}</span>\`;
      if (latestCorrection.resolution) {
        correctionStatus.insertAdjacentHTML("beforeend", \`<span>Operator response: \${escapeHtml(latestCorrection.resolution.action)}</span><span>Notes: \${escapeHtml(latestCorrection.resolution.notes || "No additional notes.")}</span>\`);
      }
      container.append(correctionStatus);
    }

    if (!latestCorrection || latestCorrection.status === "rejected") {
      container.append(button("Request correction", "secondary-button", () => openReasonDialog("Correction request", "Explain the object-level or operational mistake. The initial rating will remain immutable.", async (reason) => {
        await api("correction.request", { method: "POST", body: { assignmentId: assignment.id, reason } });
        await loadWorkspace();
      })));
    }

    if (!latestWithdrawal) {
      container.append(button("Request withdrawal", "danger-button", () => openReasonDialog("Withdrawal request", "Explain the request. Existing accepted records remain in the audit trail under the approved retention policy.", async (reason) => {
        await api("withdrawal.request", { method: "POST", body: { assignmentId: assignment.id, reason } });
        await loadWorkspace();
      })));
    }
    return;
  }

  if (assignment.status === "withdrawn") {
    const receipt = assignment.receipt;
    container.innerHTML = \`<div class="status-banner withdrawal-request-status"><strong>Withdrawal recorded; assignment locked.</strong><span>The original accepted ratings\${receipt?.id ? \` and receipt \${escapeHtml(receipt.id)}\` : ""} remain in the private audit trail under the approved retention policy.</span>\${latestWithdrawal ? \`<span>Reason: \${escapeHtml(latestWithdrawal.reason)}</span>\` : ""}</div>\`;
    return;
  }

  const status = document.createElement("div");
  status.className = "submit-status";
  const submit = button("Submit all four ratings", "primary-button", async () => {
    submit.disabled = true;
    status.textContent = "Saving drafts…";
    try {
      await flushAssignmentSaves(assignment.id);
      status.textContent = "Validating and locking initial ratings…";
      const idempotencyKey = \`submit:\${assignment.id}:\${crypto.randomUUID()}\`;
      const response = await api("assignment.submit", {
        method: "POST",
        body: { assignmentId: assignment.id, idempotencyKey, packetHash: assignment.packetHash },
      });
      status.textContent = response.replay ? "The prior receipt was returned safely." : \`Submitted. Receipt \${response.receipt.id}\`;
      await loadWorkspace();
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("error-message");
    } finally {
      submit.disabled = false;
    }
  });
  container.append(submit, status);
}`);

source = replaceBetweenOnce(
  source,
  "function renderAssignmentActions(container, assignment) {",
  "\n\nfunction scheduleAutosave(form) {",
  assignmentActions,
);

const exportListeners = `  document.querySelector("#private-export-button").addEventListener("click", () => downloadExport("export.private", "metaphilosophy-staging-private.json"));\n  document.querySelector("#public-export-button").addEventListener("click", () => downloadExport("export.public", "metaphilosophy-staging-public.json"));`;
source = replaceOnce(source, exportListeners, `${exportListeners}\n\n  renderOperatorCorrectionQueue();\n  renderOperatorWithdrawalQueue();\n  renderOperatorAdjudicationQueue();`);

const operatorQueues = templateSource(String.raw`function renderOperatorCorrectionQueue() {
  const panel = document.createElement("section");
  panel.className = "panel operator-queue";
  panel.dataset.queue = "corrections";
  panel.innerHTML = "<p class=\"eyebrow\">Immutable-history controls</p><h2>Correction requests</h2><p class=\"muted\">Approving a request creates a predecessor-linked re-rating assignment. It never edits the original ratings.</p>";
  const requests = state.workspace.correctionRequests ?? [];
  if (!requests.length) panel.insertAdjacentHTML("beforeend", "<p class=\"muted\">No correction request has been recorded.</p>");
  for (const request of requests) {
    const identity = state.workspace.identities.find((candidate) => candidate.id === request.identityId);
    const item = document.createElement("article");
    item.className = "subpanel queue-item";
    item.dataset.correctionRequestId = request.id;
    item.innerHTML = \`<p class="eyebrow">\${escapeHtml(request.status)}</p><h3>\${escapeHtml(identity?.displayName || request.identityId)}</h3><p>Assignment <code>\${escapeHtml(request.assignmentId)}</code></p><p>\${escapeHtml(request.reason)}</p>\`;
    if (request.resolution) {
      item.insertAdjacentHTML("beforeend", \`<p class="status-banner">Operator response: \${escapeHtml(request.resolution.action)} · \${escapeHtml(request.resolution.notes || "No additional notes.")}</p>\`);
    } else {
      const notes = document.createElement("textarea");
      notes.name = "correctionNotes";
      notes.rows = 3;
      notes.maxLength = 4000;
      notes.placeholder = "Operator note retained with the resolution";
      const status = document.createElement("p");
      status.className = "form-status";
      status.setAttribute("role", "status");
      const row = document.createElement("div");
      row.className = "button-row";
      row.append(
        button("Approve predecessor-linked re-rating", "primary-button", () => operatorAction("correction.resolve", { requestId: request.id, action: "approve_rerating", notes: notes.value }, status)),
        button("Reject correction request", "secondary-button", () => operatorAction("correction.resolve", { requestId: request.id, action: "reject", notes: notes.value }, status)),
      );
      item.append(notes, row, status);
    }
    panel.append(item);
  }
  elements.workspaceContent.append(panel);
}

function renderOperatorWithdrawalQueue() {
  const panel = document.createElement("section");
  panel.className = "panel operator-queue";
  panel.dataset.queue = "withdrawals";
  panel.innerHTML = "<p class=\"eyebrow\">Retention evidence</p><h2>Withdrawal requests</h2><p class=\"muted\">Withdrawal immediately locks the assignment while preserving accepted records in the private audit trail.</p>";
  const requests = state.workspace.withdrawalRequests ?? [];
  if (!requests.length) panel.insertAdjacentHTML("beforeend", "<p class=\"muted\">No withdrawal request has been recorded.</p>");
  for (const request of requests) {
    const identity = state.workspace.identities.find((candidate) => candidate.id === request.identityId);
    const assignment = state.workspace.assignments.find((candidate) => candidate.id === request.assignmentId);
    const item = document.createElement("article");
    item.className = "subpanel queue-item";
    item.dataset.withdrawalRequestId = request.id;
    item.innerHTML = \`<p class="eyebrow">recorded</p><h3>\${escapeHtml(identity?.displayName || request.identityId)}</h3><p>Assignment <code>\${escapeHtml(request.assignmentId)}</code> · status: <strong>\${escapeHtml(assignment?.status || "unknown")}</strong></p><p>\${escapeHtml(request.reason)}</p><p class="status-banner">Accepted records remain retained; no accepted rating was overwritten or deleted.</p>\`;
    panel.append(item);
  }
  elements.workspaceContent.append(panel);
}

function renderOperatorAdjudicationQueue() {
  const panel = document.createElement("section");
  panel.className = "panel operator-queue";
  panel.dataset.queue = "adjudication";
  panel.innerHTML = "<p class=\"eyebrow\">Distribution-preserving handoff</p><h2>Adjudication cases</h2><p class=\"muted\">At least one independent adjudicator review is required before closure. Initial ratings remain immutable in every path.</p>";

  const openForm = document.createElement("form");
  openForm.className = "subpanel operator-open-case-form";
  const positionIds = [...new Set(state.workspace.assignments.map((assignment) => assignment.positionId))];
  openForm.innerHTML = \`<h3>Open a synthetic case</h3><label><span>Position</span><select name="positionId" required><option value="">Select</option>\${positionIds.map((positionId) => \`<option value="\${escapeHtml(positionId)}">\${escapeHtml(positionId)}</option>\`).join("")}</select></label><label class="full-width"><span>Reason</span><textarea name="reason" rows="3" minlength="10" maxlength="4000" required></textarea></label><button class="secondary-button" type="submit">Open adjudication case</button><p class="form-status" role="status"></p>\`;
  openForm.addEventListener("submit", operatorFormHandler("adjudication.open", (form) => ({ ...Object.fromEntries(new FormData(form)), trigger: "operator_request" }), loadWorkspace));
  panel.append(openForm);

  const cases = state.workspace.adjudicationCases ?? [];
  if (!cases.length) panel.insertAdjacentHTML("beforeend", "<p class=\"muted\">No adjudication case has been recorded.</p>");
  for (const item of cases) {
    const card = document.createElement("article");
    card.className = "subpanel queue-item adjudication-operator-card";
    card.dataset.caseId = item.id;
    card.innerHTML = \`<p class="eyebrow">\${escapeHtml(item.status)}</p><h3>\${escapeHtml(item.positionId)}</h3><p>\${escapeHtml(item.reason)}</p><p>Trigger: \${escapeHtml(item.trigger)}</p>\`;
    if (item.status === "open") {
      const notes = document.createElement("textarea");
      notes.name = "closureNotes";
      notes.rows = 3;
      notes.maxLength = 8000;
      notes.placeholder = "Object-level closure notes (required)";
      const status = document.createElement("p");
      status.className = "form-status";
      status.setAttribute("role", "status");
      const row = document.createElement("div");
      row.className = "button-row";
      for (const [closureStatus, label, className] of [
        ["resolved", "Close resolved", "primary-button"],
        ["unresolved", "Close unresolved", "secondary-button"],
        ["item_defective", "Close item defective", "danger-button"],
      ]) {
        row.append(button(label, className, () => operatorAction("adjudication.close", { caseId: item.id, status: closureStatus, notes: notes.value }, status)));
      }
      card.append(notes, row, status);
    } else {
      card.insertAdjacentHTML("beforeend", \`<p class="status-banner">Closed as \${escapeHtml(item.status)}.</p>\`);
    }
    panel.append(card);
  }
  elements.workspaceContent.append(panel);
}

async function operatorAction(action, body, status) {
  status.textContent = "Working…";
  status.className = "form-status";
  try {
    await api(action, { method: "POST", body });
    status.textContent = "Completed.";
    await loadWorkspace();
  } catch (error) {
    status.textContent = error.message;
    status.className = "form-status error-message";
  }
}
`);

source = insertBeforeOnce(source, "function operatorFormHandler(action, makeBody, onSuccess) {", operatorQueues);

await writeFile(appPath, source, "utf8");
console.log(JSON.stringify({ status: "patched", file: "staging/app.mjs" }));

function templateSource(value) {
  return value.replaceAll("\\`", "`").replaceAll("\\${", "${");
}

function replaceBetweenOnce(input, startMarker, endMarker, replacement) {
  const start = uniqueIndex(input, startMarker);
  const end = input.indexOf(endMarker, start + startMarker.length);
  if (end === -1) throw new Error(`End marker not found: ${endMarker}`);
  return `${input.slice(0, start)}${replacement}${input.slice(end)}`;
}

function insertBeforeOnce(input, marker, insertion) {
  const index = uniqueIndex(input, marker);
  return `${input.slice(0, index)}${insertion}\n${input.slice(index)}`;
}

function replaceOnce(input, before, after) {
  const index = uniqueIndex(input, before);
  return `${input.slice(0, index)}${after}${input.slice(index + before.length)}`;
}

function uniqueIndex(input, marker) {
  const first = input.indexOf(marker);
  if (first === -1) throw new Error(`Required marker not found: ${marker}`);
  if (input.indexOf(marker, first + marker.length) !== -1) throw new Error(`Required marker is not unique: ${marker}`);
  return first;
}
