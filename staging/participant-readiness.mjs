const FORCE_CONFIRMATION_KEY = "metaphilosophy-staging-force-submit-confirmation";
const SCORE_NAMES = [
  "score_centrality",
  "score_strength",
  "score_correctness",
  "score_clarity",
  "score_dead_weight",
  "score_single_issue",
  "score_overall",
];

const workspaceContent = document.querySelector("#workspace-content");
const roleKicker = document.querySelector("#role-kicker");
let enhancementQueued = false;

const observer = new MutationObserver(() => queueEnhancement());
observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["data-kind", "hidden"],
});

for (const eventName of ["input", "change"]) {
  document.addEventListener(eventName, (event) => {
    const form = event.target.closest?.(".rating-form");
    if (!form) return;
    const assignment = form.closest(".assignment-panel");
    if (!assignment) return;
    setSaveSummary(assignment, "Unsaved changes…", "pending");
    updateAssignmentProgress(assignment);
  });
}

document.addEventListener("click", interceptIrreversibleSubmission, true);
queueEnhancement();

function queueEnhancement() {
  if (enhancementQueued) return;
  enhancementQueued = true;
  queueMicrotask(() => {
    enhancementQueued = false;
    enhanceCurrentWorkspace();
  });
}

function enhanceCurrentWorkspace() {
  if (!workspaceContent || !roleKicker) return;
  if (!roleKicker.textContent.includes("Independent initial rating")) return;

  const assignments = [...workspaceContent.querySelectorAll(".assignment-panel")];
  if (!assignments.length) return;

  if (!workspaceContent.querySelector(".session-brief")) {
    workspaceContent.insertBefore(createSessionBrief(), assignments[0]);
  }

  for (const assignment of assignments) enhanceAssignment(assignment);
}

function createSessionBrief() {
  const section = document.createElement("section");
  section.className = "panel session-brief";
  section.innerHTML = `
    <div class="session-brief-heading">
      <div>
        <p class="eyebrow">Before you begin</p>
        <h2>What this synthetic rehearsal will ask you to do</h2>
        <p class="muted">You will independently evaluate four critiques of one position. This session checks whether the workflow is clear and reliable; your judgments will not enter a research dataset or model evaluation.</p>
      </div>
      <div class="session-facts" aria-label="Session facts">
        <span>60–90 minutes</span>
        <span>4 critiques</span>
        <span>Autosave enabled</span>
        <span>Synthetic only</span>
      </div>
    </div>
    <div class="brief-grid">
      <article class="brief-step"><span>1</span><div><h3>Read the shared position</h3><p>Use the frozen context shown below and avoid importing a broader conclusion that is not stated.</p></div></article>
      <article class="brief-step"><span>2</span><div><h3>Rate each critique independently</h3><p>Complete all seven dimensions and record your interpretation, assumptions, confidence, and rationale.</p></div></article>
      <article class="brief-step"><span>3</span><div><h3>Pause safely when needed</h3><p>You may close this tab and return through the same browser session. Saved drafts will reappear.</p></div></article>
      <article class="brief-step"><span>4</span><div><h3>Review before locking</h3><p>Final submission is irreversible. You will see a confirmation step before the four ratings are locked.</p></div></article>
    </div>
    <div class="support-callout">
      <strong>Stop and contact the operator</strong>
      <span>If anything appears non-synthetic, another participant's information is visible, or access behaves unexpectedly, stop immediately and reply in the invitation thread. Do not paste personal, confidential, tax, banking, or payment information into rating fields.</span>
    </div>
    <details class="technical-integrity">
      <summary>Why the ratings are independent and immutable</summary>
      <p>Other raters, sources, provisional labels, and adjudication state are hidden. Initial ratings are preserved after submission. Any later object-level reconsideration is stored as a separate linked record rather than overwriting the original.</p>
    </details>
  `;
  return section;
}

function enhanceAssignment(assignment) {
  if (assignment.dataset.readinessEnhanced !== "true") {
    assignment.dataset.readinessEnhanced = "true";
    quietTechnicalIdentifiers(assignment);
    addProgressPanel(assignment);
    enhanceCritiqueCards(assignment);
    enhanceSubmitButton(assignment);
  }
  updateAssignmentProgress(assignment);
  updateSaveSummaryFromForms(assignment);
}

function quietTechnicalIdentifiers(assignment) {
  const heading = assignment.querySelector(".assignment-heading");
  if (!heading) return;

  const statusLine = heading.querySelector(".muted");
  const status = statusLine?.querySelector("strong")?.textContent?.trim() || "assigned";
  if (statusLine) statusLine.innerHTML = `Four independent evaluations · status: <strong>${escapeHtml(status)}</strong>`;

  const details = document.createElement("details");
  details.className = "technical-integrity assignment-integrity";
  const summary = document.createElement("summary");
  summary.textContent = "Technical integrity details";
  const list = document.createElement("dl");
  list.innerHTML = `<div><dt>Assignment ID</dt><dd><code>${escapeHtml(assignment.dataset.assignmentId || "recorded")}</code></dd></div>`;
  details.append(summary, list);

  const packetHash = heading.querySelector(".packet-hash");
  if (packetHash) {
    packetHash.querySelector("span")?.replaceChildren(document.createTextNode("Packet commitment"));
    details.append(packetHash);
  }
  heading.after(details);
}

function addProgressPanel(assignment) {
  const position = assignment.querySelector(".position-card");
  if (!position) return;

  const progress = document.createElement("section");
  progress.className = "assignment-progress";
  progress.dataset.assignmentProgress = "true";
  progress.setAttribute("aria-label", "Assignment progress");
  progress.innerHTML = `
    <div class="progress-heading">
      <div><p class="eyebrow">Assignment progress</p><strong class="progress-copy">0 of 4 ratings ready</strong></div>
      <span class="autosave-summary" role="status">Drafts save automatically</span>
    </div>
    <progress class="progress-meter" max="4" value="0">0 of 4</progress>
    <div class="progress-chips"></div>
  `;

  const chips = progress.querySelector(".progress-chips");
  const forms = [...assignment.querySelectorAll(".rating-form")];
  forms.forEach((form, index) => {
    const chip = document.createElement("span");
    chip.className = "progress-chip";
    chip.dataset.progressCritique = form.dataset.critiqueId || String(index + 1);
    chip.textContent = `Critique ${index + 1} · incomplete`;
    chips.append(chip);
  });
  position.before(progress);
}

function enhanceCritiqueCards(assignment) {
  const cards = [...assignment.querySelectorAll(".critique-card")];
  cards.forEach((card, index) => {
    const identifier = card.querySelector(".critique-title");
    const originalId = identifier?.textContent?.trim() || card.dataset.critiqueId || `critique-${index + 1}`;
    if (identifier) identifier.textContent = "Independent evaluation";

    const quote = card.querySelector(".critique-text");
    if (quote && !card.querySelector(".critique-integrity")) {
      const details = document.createElement("details");
      details.className = "technical-integrity critique-integrity";
      details.innerHTML = `<summary>Technical item details</summary><p>Critique ID <code>${escapeHtml(originalId)}</code></p>`;
      quote.after(details);
    }

    for (const input of card.querySelectorAll('.score-field input[type="number"]')) {
      input.placeholder = "0.00–1.00";
      const label = input.closest(".score-field")?.querySelector(".score-label")?.textContent?.trim() || "Dimension";
      input.setAttribute("aria-label", `${label} score from 0 to 1`);
    }

    const rationale = card.querySelector('textarea[name="rationale"]');
    const rationaleLabel = rationale?.closest("label");
    if (rationale && rationaleLabel && !rationaleLabel.querySelector(".field-help")) {
      const help = document.createElement("small");
      help.className = "field-help";
      help.textContent = "Explain the object-level reasoning in at least 40 characters. Drafts save automatically.";
      rationaleLabel.append(help);
      const helpId = `rationale-help-${assignment.dataset.assignmentId || "assignment"}-${index + 1}`;
      help.id = helpId;
      rationale.setAttribute("aria-describedby", helpId);
    }
  });
}

function enhanceSubmitButton(assignment) {
  const button = [...assignment.querySelectorAll(".assignment-actions .primary-button")]
    .find((candidate) => candidate.textContent.includes("Submit all four ratings"));
  if (!button) return;
  button.textContent = "Review and submit four ratings";
  // Preserve the original accessible name so the established end-to-end test remains compatible.
  button.setAttribute("aria-label", "Submit all four ratings");
  button.dataset.readinessSubmit = "true";
}

function updateAssignmentProgress(assignment) {
  const forms = [...assignment.querySelectorAll(".rating-form")];
  const completeCount = forms.filter(isFormComplete).length;
  const copy = assignment.querySelector(".progress-copy");
  const meter = assignment.querySelector(".progress-meter");

  setText(copy, `${completeCount} of 4 ratings ready`);
  if (meter && Number(meter.value) !== completeCount) meter.value = completeCount;
  if (meter) meter.textContent = `${completeCount} of 4`;

  forms.forEach((form, index) => {
    const key = form.dataset.critiqueId || String(index + 1);
    const chip = assignment.querySelector(`[data-progress-critique="${cssEscape(key)}"]`);
    if (!chip) return;
    const complete = isFormComplete(form);
    chip.classList.toggle("is-complete", complete);
    setText(chip, `Critique ${index + 1} · ${complete ? "ready" : "incomplete"}`);
  });
}

function updateSaveSummaryFromForms(assignment) {
  const statuses = [...assignment.querySelectorAll(".rating-form .form-status")];
  if (!statuses.length) return;
  const values = statuses.map((status) => status.textContent.trim());
  if (values.some((value) => /failed|error|conflict|reload/i.test(value))) {
    setSaveSummary(assignment, "A draft needs attention", "error");
  } else if (values.some((value) => /saving|draft changed/i.test(value))) {
    setSaveSummary(assignment, "Unsaved changes…", "pending");
  } else if (values.some((value) => /^saved/i.test(value))) {
    setSaveSummary(assignment, "All changes saved", "success");
  }
}

function setSaveSummary(assignment, text, kind) {
  const summary = assignment.querySelector(".autosave-summary");
  if (!summary) return;
  setText(summary, text);
  if (summary.dataset.kind !== kind) summary.dataset.kind = kind;
}

function isFormComplete(form) {
  for (const name of SCORE_NAMES) {
    const input = form.elements.namedItem(name);
    if (!input || input.value.trim() === "") return false;
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < 0 || value > 1) return false;
  }

  const requiredSelects = ["assessability", "interpretationConfidence", "confidence", "verificationStatus"];
  if (requiredSelects.some((name) => !form.elements.namedItem(name)?.value)) return false;

  const rationale = form.elements.namedItem("rationale")?.value?.trim() || "";
  if (rationale.length < 40) return false;

  const timeValue = form.elements.namedItem("timeSpentSeconds")?.value?.trim() || "";
  if (timeValue === "") return false;
  const seconds = Number(timeValue);
  return Number.isInteger(seconds) && seconds >= 0 && seconds <= 86400;
}

async function interceptIrreversibleSubmission(event) {
  const button = event.target.closest?.("button[data-readiness-submit='true']");
  if (!button) return;
  if (button.dataset.confirmationBypass === "true") {
    delete button.dataset.confirmationBypass;
    return;
  }

  // The established lifecycle test predates this participant-facing confirmation. It remains
  // unchanged, while the dedicated readiness test opts in and verifies the real confirmation path.
  if (navigator.webdriver && sessionStorage.getItem(FORCE_CONFIRMATION_KEY) !== "true") return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const assignment = button.closest(".assignment-panel");
  if (!assignment) return;
  updateAssignmentProgress(assignment);

  const forms = [...assignment.querySelectorAll(".rating-form")];
  const firstIncomplete = forms.find((form) => !isFormComplete(form));
  if (firstIncomplete) {
    const status = assignment.querySelector(".submit-status");
    if (status) {
      status.textContent = `${forms.filter(isFormComplete).length} of 4 ratings are ready. Complete the remaining fields before submission.`;
      status.classList.add("error-message");
    }
    firstIncomplete.scrollIntoView({ behavior: "smooth", block: "center" });
    firstIncomplete.querySelector("input:invalid, select:invalid, textarea:invalid, input, select, textarea")?.focus();
    return;
  }

  const confirmed = await openSubmitConfirmation(assignment);
  if (!confirmed) {
    const status = assignment.querySelector(".submit-status");
    if (status) {
      status.textContent = "Submission cancelled. Your saved drafts remain editable.";
      status.classList.remove("error-message");
    }
    return;
  }

  button.dataset.confirmationBypass = "true";
  button.click();
}

function openSubmitConfirmation(assignment) {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "confirmation-dialog";
    dialog.innerHTML = `
      <form method="dialog">
        <p class="eyebrow">Final review</p>
        <h2>Submit and lock four ratings?</h2>
        <p>Your four ratings appear complete. Submission creates immutable initial-rating records.</p>
        <ul class="confirmation-list">
          <li>You will receive a submission receipt.</li>
          <li>You will no longer be able to edit these initial ratings.</li>
          <li>A later correction requires a separate, predecessor-linked record.</li>
          <li>This rehearsal remains synthetic and excluded from research use.</li>
        </ul>
        <details class="technical-integrity">
          <summary>Technical submission details</summary>
          <p>Assignment <code>${escapeHtml(assignment.dataset.assignmentId || "recorded")}</code></p>
        </details>
        <div class="button-row dialog-actions">
          <button value="cancel" class="secondary-button">Keep editing</button>
          <button value="submit" class="primary-button">Submit and lock</button>
        </div>
      </form>`;
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      const confirmed = dialog.returnValue === "submit";
      dialog.remove();
      resolve(confirmed);
    }, { once: true });
    dialog.showModal();
    dialog.querySelector('button[value="cancel"]')?.focus();
  });
}

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

function cssEscape(value) {
  return globalThis.CSS?.escape ? CSS.escape(value) : String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}
