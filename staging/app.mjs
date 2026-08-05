const API = "/api/staging";
const csrfStorageKey = "metaphilosophy-staging-csrf";
const issueFlags = [
  ["position_ambiguity", "Position ambiguity"],
  ["critique_ambiguity", "Critique ambiguity"],
  ["insufficient_context", "Insufficient context"],
  ["source_fidelity", "Source-fidelity concern"],
  ["scope_mismatch", "Scope mismatch"],
  ["factual_verification_needed", "Factual verification needed"],
  ["multiple_independent_issues", "Multiple independent issues"],
  ["possible_metadata_leak", "Possible metadata leak"],
  ["other", "Other"],
];

const state = {
  identity: null,
  session: null,
  workspace: null,
  csrfToken: sessionStorage.getItem(csrfStorageKey) || "",
  autosaveTimers: new Map(),
  pendingSaves: new Map(),
};

const elements = {
  loading: document.querySelector("#loading-panel"),
  login: document.querySelector("#login-panel"),
  loginForm: document.querySelector("#invite-form"),
  inviteToken: document.querySelector("#invite-token"),
  loginError: document.querySelector("#login-error"),
  workspace: document.querySelector("#workspace-panel"),
  workspaceContent: document.querySelector("#workspace-content"),
  roleKicker: document.querySelector("#role-kicker"),
  title: document.querySelector("#workspace-title"),
  subtitle: document.querySelector("#workspace-subtitle"),
  identityLabel: document.querySelector("#identity-label"),
  refresh: document.querySelector("#refresh-button"),
  logout: document.querySelector("#logout-button"),
};

init().catch(showFatalError);

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.loginError.hidden = true;
  const token = elements.inviteToken.value.trim();
  if (!token) return showLoginError("Enter the one-time invitation token.");
  try {
    const response = await api("invite.redeem", { method: "POST", body: { token }, csrf: false });
    state.identity = response.identity;
    state.session = response.session;
    state.csrfToken = response.csrfToken;
    sessionStorage.setItem(csrfStorageKey, state.csrfToken);
    elements.inviteToken.value = "";
    await loadWorkspace();
  } catch (error) {
    showLoginError(error.message);
  }
});

elements.refresh.addEventListener("click", () => loadWorkspace().catch(showFatalError));
elements.logout.addEventListener("click", async () => {
  try {
    await api("logout", { method: "POST" });
  } finally {
    sessionStorage.removeItem(csrfStorageKey);
    state.csrfToken = "";
    state.identity = null;
    state.workspace = null;
    showLogin();
  }
});

async function init() {
  const inviteFromUrl = new URL(location.href).searchParams.get("invite");
  if (inviteFromUrl) {
    history.replaceState(null, "", location.pathname);
    elements.inviteToken.value = inviteFromUrl;
  }

  try {
    const response = await api("me", { csrf: false });
    state.identity = response.identity;
    state.session = response.session;
    state.csrfToken = response.csrfToken;
    sessionStorage.setItem(csrfStorageKey, state.csrfToken);
    await loadWorkspace();
  } catch (error) {
    if (error.status === 401) showLogin();
    else throw error;
  }
}

async function loadWorkspace() {
  elements.loading.hidden = false;
  elements.login.hidden = true;
  elements.workspace.hidden = true;
  const workspace = await api("workspace", { csrf: false });
  state.workspace = workspace;
  renderWorkspace();
}

function renderWorkspace() {
  elements.loading.hidden = true;
  elements.login.hidden = true;
  elements.workspace.hidden = false;
  elements.identityLabel.textContent = `${state.identity.displayName} · ${state.identity.role}`;
  elements.workspaceContent.replaceChildren();

  if (state.workspace.role === "rater") renderRaterWorkspace();
  else if (state.workspace.role === "operator") renderOperatorWorkspace();
  else if (state.workspace.role === "adjudicator") renderAdjudicatorWorkspace();
}

function renderRaterWorkspace() {
  elements.roleKicker.textContent = "Independent initial rating";
  elements.title.textContent = "Rate contextualized critiques";
  elements.subtitle.textContent = "All four critiques of a position are shown together. Sources, model identities, provisional labels, other raters, and adjudication state are hidden.";

  if (!state.workspace.assignments.length) {
    elements.workspaceContent.append(emptyPanel("No assignment is currently available", "The operator has not assigned a synthetic rehearsal packet to this identity."));
    return;
  }

  for (const assignment of state.workspace.assignments) {
    const section = document.createElement("section");
    section.className = "panel assignment-panel";
    section.dataset.assignmentId = assignment.id;
    section.innerHTML = `
      <div class="assignment-heading">
        <div>
          <p class="eyebrow">${escapeHtml(assignment.kind === "rerating" ? "Object-level re-rating" : "Blind initial rating")}</p>
          <h2>${escapeHtml(assignment.position.title)}</h2>
          <p class="muted">Assignment ${escapeHtml(assignment.id)} · status: <strong>${escapeHtml(assignment.status)}</strong></p>
        </div>
        <div class="packet-hash"><span>Packet commitment</span><code>${escapeHtml(assignment.packetHash.slice(0, 16))}…</code></div>
      </div>
      <article class="position-card">
        <p class="card-label">Position</p>
        <p>${escapeHtml(assignment.position.text)}</p>
        <aside><strong>Frozen context:</strong> ${escapeHtml(assignment.position.context || "No additional context supplied.")}</aside>
      </article>
      <div class="critique-list"></div>
      <div class="assignment-actions"></div>
    `;
    const critiqueList = section.querySelector(".critique-list");
    for (const critique of assignment.critiques) critiqueList.append(renderCritiqueCard(assignment, critique));
    renderAssignmentActions(section.querySelector(".assignment-actions"), assignment);
    elements.workspaceContent.append(section);
  }
}

function renderCritiqueCard(assignment, critique) {
  const fragment = document.querySelector("#critique-card-template").content.cloneNode(true);
  const card = fragment.querySelector(".critique-card");
  card.dataset.critiqueId = critique.id;
  card.querySelector(".critique-number").textContent = `Critique ${critique.ordinal} of 4`;
  card.querySelector(".critique-title").textContent = critique.id;
  card.querySelector(".critique-text").textContent = critique.text;
  card.querySelector(".rubric-detail-content").append(renderRubric(state.workspace.rubric));

  const form = card.querySelector(".rating-form");
  form.dataset.assignmentId = assignment.id;
  form.dataset.critiqueId = critique.id;
  form.dataset.version = String(critique.draft?.version ?? 0);
  form.dataset.locked = String(assignment.status === "submitted" || assignment.status === "withdrawn");

  const scoreGrid = form.querySelector(".score-grid");
  const scoreTemplate = document.querySelector("#score-field-template");
  for (const [dimension, definition] of Object.entries(state.workspace.rubric.dimensions)) {
    const field = scoreTemplate.content.cloneNode(true);
    const label = field.querySelector(".score-field");
    const input = field.querySelector("input");
    label.dataset.dimension = dimension;
    field.querySelector(".score-label").textContent = definition.label;
    field.querySelector(".score-hint").textContent = definition.question;
    input.name = `score_${dimension}`;
    scoreGrid.append(field);
  }

  const flagGrid = form.querySelector(".issue-flag-grid");
  for (const [value, label] of issueFlags) {
    const flag = document.createElement("label");
    flag.className = "flag-option";
    flag.innerHTML = `<input type="checkbox" name="issueFlags" value="${escapeHtml(value)}"><span>${escapeHtml(label)}</span>`;
    flagGrid.append(flag);
  }

  if (critique.draft) populateRatingForm(form, critique.draft.rating);
  if (form.dataset.locked === "true") disableForm(form);
  else {
    form.addEventListener("input", () => scheduleAutosave(form));
    form.addEventListener("change", () => scheduleAutosave(form));
  }
  return card;
}

function renderRubric(rubric) {
  const container = document.createElement("div");
  container.className = "rubric-full";
  for (const [key, definition] of Object.entries(rubric.dimensions)) {
    const block = document.createElement("section");
    block.innerHTML = `<h4>${escapeHtml(definition.label)} <code>${escapeHtml(key)}</code></h4><p><strong>${escapeHtml(definition.question)}</strong></p>`;
    const list = document.createElement("ul");
    definition.guidance.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });
    block.append(list);
    const anchors = document.createElement("p");
    anchors.className = "anchor-line";
    anchors.textContent = Object.entries(definition.anchors).map(([score, text]) => `${score}: ${text}`).join(" · ");
    block.append(anchors);
    container.append(block);
  }
  const general = document.createElement("section");
  general.innerHTML = "<h4>General guidance</h4>";
  const list = document.createElement("ul");
  rubric.generalGuidance.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  });
  general.append(list);
  container.append(general);
  return container;
}

function renderAssignmentActions(container, assignment) {
  if (assignment.status === "submitted") {
    const receipt = assignment.receipt;
    container.innerHTML = `<div class="receipt"><strong>Submitted and locked.</strong><span>Receipt ${escapeHtml(receipt?.id || "recorded")}</span><span>Payload ${escapeHtml(receipt?.payloadHash?.slice(0, 16) || "")}…</span></div>`;
    const correction = button("Request correction", "secondary-button", () => openReasonDialog("Correction request", "Explain the object-level or operational mistake. The initial rating will remain immutable.", async (reason) => {
      await api("correction.request", { method: "POST", body: { assignmentId: assignment.id, reason } });
      await loadWorkspace();
    }));
    const withdrawal = button("Request withdrawal", "danger-button", () => openReasonDialog("Withdrawal request", "Explain the request. Existing accepted records remain in the audit trail under the approved retention policy.", async (reason) => {
      await api("withdrawal.request", { method: "POST", body: { assignmentId: assignment.id, reason } });
      await loadWorkspace();
    }));
    container.append(correction, withdrawal);
    return;
  }
  if (assignment.status === "withdrawn") {
    container.innerHTML = "<p class=\"status-banner\">This assignment is withdrawn and locked.</p>";
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
      const idempotencyKey = `submit:${assignment.id}:${crypto.randomUUID()}`;
      const response = await api("assignment.submit", {
        method: "POST",
        body: { assignmentId: assignment.id, idempotencyKey, packetHash: assignment.packetHash },
      });
      status.textContent = response.replay ? "The prior receipt was returned safely." : `Submitted. Receipt ${response.receipt.id}`;
      await loadWorkspace();
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("error-message");
    } finally {
      submit.disabled = false;
    }
  });
  container.append(submit, status);
}

function scheduleAutosave(form) {
  const key = `${form.dataset.assignmentId}:${form.dataset.critiqueId}`;
  clearTimeout(state.autosaveTimers.get(key));
  setFormStatus(form, "Draft changed…", "pending");
  const timer = setTimeout(() => {
    const promise = saveDraft(form).catch((error) => {
      setFormStatus(form, error.message, "error");
      throw error;
    }).finally(() => state.pendingSaves.delete(key));
    state.pendingSaves.set(key, promise);
  }, 650);
  state.autosaveTimers.set(key, timer);
}

async function saveDraft(form) {
  const body = {
    assignmentId: form.dataset.assignmentId,
    critiqueId: form.dataset.critiqueId,
    expectedVersion: Number(form.dataset.version),
    rating: readRatingForm(form),
  };
  setFormStatus(form, "Saving…", "pending");
  const response = await api("draft.save", { method: "PUT", body });
  form.dataset.version = String(response.draft.version);
  setFormStatus(form, response.complete ? "Saved · complete" : "Saved · incomplete", response.complete ? "success" : "pending");
  return response;
}

async function flushAssignmentSaves(assignmentId) {
  const forms = [...document.querySelectorAll(`.rating-form[data-assignment-id="${cssEscape(assignmentId)}"]`)];
  for (const form of forms) {
    const key = `${form.dataset.assignmentId}:${form.dataset.critiqueId}`;
    clearTimeout(state.autosaveTimers.get(key));
    if (state.pendingSaves.has(key)) await state.pendingSaves.get(key);
    await saveDraft(form);
  }
}

function readRatingForm(form) {
  const data = new FormData(form);
  const scores = {};
  for (const dimension of Object.keys(state.workspace.rubric.dimensions)) scores[dimension] = numericOrNull(data.get(`score_${dimension}`));
  return {
    scores,
    rationale: data.get("rationale") || "",
    confidence: data.get("confidence") || "",
    timeSpentSeconds: Number(data.get("timeSpentSeconds") || 0),
    interpretationConfidence: data.get("interpretationConfidence") || "",
    backgroundAssumptions: data.get("backgroundAssumptions") || "",
    assessability: data.get("assessability") || "",
    issueFlags: data.getAll("issueFlags"),
    verificationStatus: data.get("verificationStatus") || "",
    requestReview: data.get("requestReview") === "on",
  };
}

function populateRatingForm(form, rating) {
  for (const [dimension, score] of Object.entries(rating.scores || {})) {
    const input = form.elements.namedItem(`score_${dimension}`);
    if (input && score !== null && score !== undefined) input.value = String(score);
  }
  for (const name of ["rationale", "confidence", "timeSpentSeconds", "interpretationConfidence", "backgroundAssumptions", "assessability", "verificationStatus"]) {
    const input = form.elements.namedItem(name);
    if (input && rating[name] !== undefined && rating[name] !== null) input.value = String(rating[name]);
  }
  for (const checkbox of form.querySelectorAll('input[name="issueFlags"]')) checkbox.checked = (rating.issueFlags || []).includes(checkbox.value);
  form.elements.namedItem("requestReview").checked = Boolean(rating.requestReview);
}

function renderOperatorWorkspace() {
  elements.roleKicker.textContent = "Controlled operations";
  elements.title.textContent = "Staging operator workspace";
  elements.subtitle.textContent = "Issue expiring invitations, assign only synthetic rehearsal material, inspect append-only evidence, and keep all failures closed.";
  const fragment = document.querySelector("#operator-template").content.cloneNode(true);
  elements.workspaceContent.append(fragment);

  const counts = document.querySelector("#operator-counts");
  for (const [label, value] of Object.entries(state.workspace.counts)) counts.append(metric(label, value));
  const identityBody = document.querySelector("#identity-table-body");
  for (const identity of state.workspace.identities) {
    identityBody.insertAdjacentHTML("beforeend", `<tr><td>${escapeHtml(identity.displayName)}</td><td>${escapeHtml(identity.role)}</td><td>${escapeHtml(identity.status)}</td><td><code>${escapeHtml(identity.id)}</code></td></tr>`);
  }
  const assignmentBody = document.querySelector("#assignment-table-body");
  for (const assignment of state.workspace.assignments) {
    const identity = state.workspace.identities.find((candidate) => candidate.id === assignment.identityId);
    assignmentBody.insertAdjacentHTML("beforeend", `<tr><td>${escapeHtml(identity?.displayName || assignment.identityId)}</td><td>${escapeHtml(assignment.kind)}</td><td>${escapeHtml(assignment.status)}</td><td>${escapeHtml(assignment.positionId)}</td><td><code>${escapeHtml(assignment.id)}</code></td></tr>`);
  }

  const allIdentitySelects = document.querySelectorAll('select[name="identityId"]');
  for (const select of allIdentitySelects) {
    const requiredRole = select.closest("#create-assignment-form") ? "rater" : null;
    for (const identity of state.workspace.identities.filter((candidate) => !requiredRole || candidate.role === requiredRole)) {
      select.add(new Option(`${identity.displayName} · ${identity.role}`, identity.id));
    }
  }

  document.querySelector("#create-identity-form").addEventListener("submit", operatorFormHandler("identity.create", (form) => Object.fromEntries(new FormData(form)), loadWorkspace));
  document.querySelector("#create-invite-form").addEventListener("submit", operatorFormHandler("invite.create", (form) => {
    const data = Object.fromEntries(new FormData(form));
    data.expiresInHours = Number(data.expiresInHours);
    return data;
  }, async (response) => {
    document.querySelector("#issued-token").value = response.token;
    await loadWorkspace();
  }));
  document.querySelector("#create-assignment-form").addEventListener("submit", operatorFormHandler("assignment.create", (form) => ({ ...Object.fromEntries(new FormData(form)), kind: "initial" }), loadWorkspace));
  document.querySelector("#private-export-button").addEventListener("click", () => downloadExport("export.private", "metaphilosophy-staging-private.json"));
  document.querySelector("#public-export-button").addEventListener("click", () => downloadExport("export.public", "metaphilosophy-staging-public.json"));
}

function operatorFormHandler(action, makeBody, onSuccess) {
  return async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector(".form-status");
    const buttonElement = form.querySelector("button[type=submit]");
    buttonElement.disabled = true;
    status.textContent = "Working…";
    try {
      const response = await api(action, { method: "POST", body: makeBody(form) });
      status.textContent = "Completed.";
      await onSuccess(response);
    } catch (error) {
      status.textContent = error.message;
      status.className = "form-status error-message";
    } finally {
      buttonElement.disabled = false;
    }
  };
}

function renderAdjudicatorWorkspace() {
  elements.roleKicker.textContent = "Independent adjudication";
  elements.title.textContent = "Review triggered disagreement";
  elements.subtitle.textContent = "Initial records remain immutable. Competing interpretations and unresolved cases must be represented rather than forced into consensus.";
  const fragment = document.querySelector("#adjudicator-template").content.cloneNode(true);
  elements.workspaceContent.append(fragment);
  const list = document.querySelector("#adjudication-case-list");
  if (!state.workspace.cases.length) {
    list.append(emptyPanel("No adjudication case is open", "Cases appear only after a pre-registered trigger or an operator request."));
    return;
  }
  for (const item of state.workspace.cases) {
    const card = document.createElement("article");
    card.className = "adjudication-card subpanel";
    card.innerHTML = `
      <p class="eyebrow">${escapeHtml(item.trigger)}</p>
      <h3>${escapeHtml(item.position.title)}</h3>
      <p>${escapeHtml(item.reason)}</p>
      <details><summary>Position and ratings</summary><div class="adjudication-evidence"></div></details>
    `;
    const evidence = card.querySelector(".adjudication-evidence");
    const position = document.createElement("p");
    position.textContent = item.position.text;
    evidence.append(position);
    for (const critique of item.critiques) {
      const block = document.createElement("section");
      block.className = "evidence-critique";
      block.innerHTML = `<h4>${escapeHtml(critique.id)}</h4><blockquote>${escapeHtml(critique.text)}</blockquote>`;
      for (const rating of critique.ratings) {
        const pre = document.createElement("pre");
        pre.textContent = JSON.stringify({ scores: rating.rating.scores, substantiveImpact: rating.substantiveImpact, rationale: rating.rating.rationale, interpretationConfidence: rating.rating.interpretationConfidence, assessability: rating.rating.assessability, issueFlags: rating.rating.issueFlags }, null, 2);
        block.append(pre);
      }
      evidence.append(block);
    }
    if (item.ownReview) {
      card.insertAdjacentHTML("beforeend", `<p class="status-banner">Your independent review is locked: ${escapeHtml(item.ownReview.disposition)}</p>`);
    } else if (item.status === "open") {
      const form = document.createElement("form");
      form.className = "adjudication-form";
      form.innerHTML = `
        <label><span>Disposition</span><select name="disposition" required><option value="">Select</option><option value="confirm_initials">Confirm initials</option><option value="request_rerating">Request object-level re-rating</option><option value="unresolved">Explicitly unresolved</option><option value="item_defective">Item/context defective</option></select></label>
        <label class="full-width"><span>Object-level explanation</span><textarea name="explanation" rows="8" maxlength="12000" required></textarea></label>
        <label class="check-row"><input name="requiresRerating" type="checkbox"><span>A predecessor-linked re-rating is required</span></label>
        <button class="primary-button" type="submit">Submit independent review</button><div class="form-status" role="status"></div>`;
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const status = form.querySelector(".form-status");
        try {
          await api("adjudication.review", { method: "POST", body: { caseId: item.id, disposition: data.get("disposition"), explanation: data.get("explanation"), requiresRerating: data.get("requiresRerating") === "on" } });
          await loadWorkspace();
        } catch (error) {
          status.textContent = error.message;
          status.className = "form-status error-message";
        }
      });
      card.append(form);
    }
    list.append(card);
  }
}

async function downloadExport(action, fileName) {
  const response = await fetch(`${API}?action=${encodeURIComponent(action)}`, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error((await response.json()).error?.message || "Export failed.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function api(action, { method = "GET", body, csrf = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (csrf && method !== "GET") headers["X-Staging-CSRF"] = state.csrfToken;
  const response = await fetch(`${API}?action=${encodeURIComponent(action)}`, {
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({ ok: false, error: { message: `HTTP ${response.status}` } }));
  if (!response.ok || !payload.ok) {
    const error = new Error(payload.error?.message || `Request failed with status ${response.status}.`);
    error.status = response.status;
    error.code = payload.error?.code;
    error.detail = payload.error?.detail;
    throw error;
  }
  return payload.data;
}

function showLogin() {
  elements.loading.hidden = true;
  elements.workspace.hidden = true;
  elements.login.hidden = false;
  elements.inviteToken.focus();
}

function showLoginError(message) {
  elements.loginError.textContent = message;
  elements.loginError.hidden = false;
}

function showFatalError(error) {
  console.error(error);
  elements.loading.hidden = false;
  elements.loading.innerHTML = `<p class="eyebrow">Staging unavailable</p><h1>The controlled workspace could not load.</h1><p class="error-message">${escapeHtml(error.message)}</p><p class="muted">Do not enter research data. Contact the operator and retain the exact error time.</p>`;
}

function setFormStatus(form, text, kind) {
  const status = form.querySelector(".form-status");
  status.textContent = text;
  status.dataset.kind = kind;
}

function disableForm(form) {
  for (const control of form.elements) control.disabled = true;
  setFormStatus(form, "Locked after submission", "success");
}

function emptyPanel(title, text) {
  const panel = document.createElement("section");
  panel.className = "panel compact-panel";
  panel.innerHTML = `<p class="eyebrow">No active work</p><h2>${escapeHtml(title)}</h2><p class="muted">${escapeHtml(text)}</p>`;
  return panel;
}

function metric(label, value) {
  const item = document.createElement("div");
  item.className = "metric";
  item.innerHTML = `<strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label.replaceAll(/([A-Z])/g, " $1"))}</span>`;
  return item;
}

function button(label, className, handler) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  element.addEventListener("click", handler);
  return element;
}

function openReasonDialog(title, description, onSubmit) {
  const dialog = document.createElement("dialog");
  dialog.innerHTML = `<form method="dialog"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><label class="full-width"><span>Reason</span><textarea name="reason" rows="6" required></textarea></label><div class="button-row"><button value="cancel" class="secondary-button">Cancel</button><button value="submit" class="primary-button">Submit request</button></div><p class="form-status" role="status"></p></form>`;
  document.body.append(dialog);
  dialog.addEventListener("close", async () => {
    if (dialog.returnValue === "submit") {
      const reason = new FormData(dialog.querySelector("form")).get("reason");
      try { await onSubmit(reason); } catch (error) { alert(error.message); }
    }
    dialog.remove();
  });
  dialog.showModal();
}

function numericOrNull(value) {
  if (value === "" || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function cssEscape(value) {
  return globalThis.CSS?.escape ? CSS.escape(value) : String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}
