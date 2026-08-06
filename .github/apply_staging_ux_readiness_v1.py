#!/usr/bin/env python3
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_BLOBS = {
    "staging/index.html": "99ff8eb8cd825be2f5e6972e91ce739dcf036866",
    "staging/app.mjs": "8d8c31a03c0b94f0e35c25aca489dece0b47dbb0",
    "staging/styles.css": "795c4dd9dfdbac9cf58a85e2395ad1c0cce1eb1d",
    "e2e/human-workflow-staging.spec.mjs": "545882d923b7e18afd9619146bf20abcd034257a",
}


def git_blob(path: Path) -> str:
    return subprocess.check_output(
        ["git", "hash-object", str(path.relative_to(ROOT))],
        cwd=ROOT,
        text=True,
    ).strip()


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


for relative, expected in EXPECTED_BLOBS.items():
    path = ROOT / relative
    actual = git_blob(path)
    if actual != expected:
        raise SystemExit(f"{relative}: expected blob {expected}, found {actual}")

index = ROOT / "staging/index.html"
replace_once(
    index,
    '<body>\n  <header class="site-header">',
    '<body>\n  <a class="skip-link" href="#workspace-content">Skip to the rating workspace</a>\n  <header class="site-header">',
    "add keyboard skip link",
)
replace_once(
    index,
    '<label class="full-width"><span>Object-level rationale</span><textarea name="rationale" rows="7" maxlength="12000" required></textarea></label>',
    '<label class="full-width"><span>Object-level rationale</span><textarea name="rationale" rows="7" maxlength="12000" aria-describedby="rationale-help" required></textarea><small id="rationale-help" class="field-help">Explain the object-level reasoning in at least 40 characters. Drafts save automatically.</small></label>',
    "add rationale guidance",
)

app = ROOT / "staging/app.mjs"
replace_once(
    app,
    '  pendingSaves: new Map(),\n};',
    '  pendingSaves: new Map(),\n  lastSavedAt: new Map(),\n};',
    "track aggregate save times",
)
replace_once(
    app,
    '  elements.subtitle.textContent = "All four critiques of a position are shown together. Sources, model identities, provisional labels, other raters, and adjudication state are hidden.";\n\n  if (!state.workspace.assignments.length) {',
    '''  elements.subtitle.textContent = "All four critiques of a position are shown together. Sources, model identities, provisional labels, other raters, and adjudication state are hidden.";
  elements.workspaceContent.append(renderRaterSessionBrief());

  if (!state.workspace.assignments.length) {''',
    "render participant-facing session brief",
)
replace_once(
    app,
    '  for (const assignment of state.workspace.assignments) {\n    const section = document.createElement("section");',
    '''  for (const assignment of state.workspace.assignments) {
    const latestSavedAt = assignment.critiques
      .map((critique) => critique.draft?.updatedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    if (latestSavedAt) state.lastSavedAt.set(assignment.id, new Date(latestSavedAt));
    const initialCompleteCount = assignment.critiques.filter((critique) => isRatingCompleteForProgress(critique.draft?.rating)).length;
    const section = document.createElement("section");''',
    "initialize assignment progress",
)
replace_once(
    app,
    '''      <div class="assignment-heading">
        <div>
          <p class="eyebrow">${escapeHtml(assignment.kind === "rerating" ? "Object-level re-rating" : "Blind initial rating")}</p>
          <h2>${escapeHtml(assignment.position.title)}</h2>
          <p class="muted">Assignment ${escapeHtml(assignment.id)} · status: <strong>${escapeHtml(assignment.status)}</strong></p>
        </div>
        <div class="packet-hash"><span>Packet commitment</span><code>${escapeHtml(assignment.packetHash.slice(0, 16))}…</code></div>
      </div>
      <article class="position-card">''',
    '''      <div class="assignment-heading">
        <div>
          <p class="eyebrow">${escapeHtml(assignment.kind === "rerating" ? "Object-level re-rating" : "Blind initial rating")}</p>
          <h2>${escapeHtml(assignment.position.title)}</h2>
          <p class="muted">Four independent evaluations · status: <strong>${escapeHtml(assignment.status)}</strong></p>
        </div>
      </div>
      <details class="technical-integrity assignment-integrity">
        <summary>Technical integrity details</summary>
        <dl>
          <div><dt>Assignment ID</dt><dd><code>${escapeHtml(assignment.id)}</code></dd></div>
          <div><dt>Packet commitment</dt><dd><code>${escapeHtml(assignment.packetHash)}</code></dd></div>
        </dl>
      </details>
      <section class="assignment-progress" data-assignment-progress aria-label="Assignment progress">
        <div class="progress-heading">
          <div>
            <p class="eyebrow">Assignment progress</p>
            <strong class="progress-copy">${initialCompleteCount} of 4 ratings ready</strong>
          </div>
          <span class="autosave-summary" role="status">Drafts save automatically</span>
        </div>
        <progress class="progress-meter" max="4" value="${initialCompleteCount}">${initialCompleteCount} of 4</progress>
        <div class="progress-chips">
          ${assignment.critiques.map((critique) => {
            const complete = isRatingCompleteForProgress(critique.draft?.rating);
            return `<span class="progress-chip${complete ? " is-complete" : ""}" data-progress-critique="${escapeHtml(critique.id)}">Critique ${critique.ordinal} · ${complete ? "ready" : "incomplete"}</span>`;
          }).join("")}
        </div>
      </section>
      <article class="position-card">''',
    "replace technical-first header with participant progress",
)
replace_once(
    app,
    '''    renderAssignmentActions(section.querySelector(".assignment-actions"), assignment);
    elements.workspaceContent.append(section);
  }
}

function renderCritiqueCard(assignment, critique) {''',
    '''    renderAssignmentActions(section.querySelector(".assignment-actions"), assignment);
    elements.workspaceContent.append(section);
    updateAssignmentProgress(assignment.id);
  }
}

function renderRaterSessionBrief() {
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
      <span>If anything appears non-synthetic, another participant's information is visible, or access behaves unexpectedly, stop immediately and reply in the invitation thread. Do not paste personal, confidential, or payment information into rating fields.</span>
    </div>
    <details class="technical-integrity">
      <summary>Why the ratings are independent and immutable</summary>
      <p>Other raters, sources, provisional labels, and adjudication state are hidden. Initial ratings are preserved after submission. Any later object-level reconsideration is stored as a separate linked record rather than overwriting the original.</p>
    </details>
  `;
  return section;
}

function renderCritiqueCard(assignment, critique) {''',
    "add rater onboarding and support guidance",
)
replace_once(
    app,
    '''  card.querySelector(".critique-number").textContent = `Critique ${critique.ordinal} of 4`;
  card.querySelector(".critique-title").textContent = critique.id;
  card.querySelector(".critique-text").textContent = critique.text;
  card.querySelector(".rubric-detail-content").append(renderRubric(state.workspace.rubric));''',
    '''  card.querySelector(".critique-number").textContent = `Critique ${critique.ordinal} of 4`;
  card.querySelector(".critique-title").textContent = "Independent evaluation";
  card.querySelector(".critique-text").textContent = critique.text;
  const integrity = document.createElement("details");
  integrity.className = "technical-integrity critique-integrity";
  integrity.innerHTML = `<summary>Technical item details</summary><p>Critique ID <code>${escapeHtml(critique.id)}</code></p>`;
  card.querySelector(".critique-text").after(integrity);
  card.querySelector(".rubric-detail-content").append(renderRubric(state.workspace.rubric));''',
    "de-emphasize technical critique identifiers",
)
replace_once(
    app,
    '''  form.dataset.version = String(critique.draft?.version ?? 0);
  form.dataset.locked = String(assignment.status === "submitted" || assignment.status === "withdrawn");''',
    '''  form.dataset.version = String(critique.draft?.version ?? 0);
  form.dataset.locked = String(assignment.status === "submitted" || assignment.status === "withdrawn");
  form.dataset.complete = String(isRatingCompleteForProgress(critique.draft?.rating));''',
    "initialize per-critique completion state",
)
replace_once(
    app,
    '''    input.name = `score_${dimension}`;
    scoreGrid.append(field);''',
    '''    input.name = `score_${dimension}`;
    input.placeholder = "0.00–1.00";
    input.setAttribute("aria-label", `${definition.label} score from 0 to 1`);
    scoreGrid.append(field);''',
    "clarify score range",
)
replace_once(
    app,
    '''  const submit = button("Submit all four ratings", "primary-button", async () => {
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
  });''',
    '''  const submit = button("Review and submit four ratings", "primary-button", async () => {
    submit.disabled = true;
    status.classList.remove("error-message");
    status.textContent = "Saving drafts…";
    try {
      await flushAssignmentSaves(assignment.id);
      const completeCount = countCompleteAssignmentForms(assignment.id);
      if (completeCount !== 4) {
        status.textContent = `${completeCount} of 4 ratings are ready. Complete the remaining fields before submission.`;
        status.classList.add("error-message");
        return;
      }
      const confirmed = await openSubmitConfirmation(assignment);
      if (!confirmed) {
        status.textContent = "Submission cancelled. Your saved drafts remain editable.";
        return;
      }
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
  });''',
    "add irreversible-submission review step",
)
replace_once(
    app,
    '''  clearTimeout(state.autosaveTimers.get(key));
  setFormStatus(form, "Draft changed…", "pending");
  const timer = setTimeout(() => {''',
    '''  clearTimeout(state.autosaveTimers.get(key));
  setFormStatus(form, "Draft changed…", "pending");
  setAssignmentSaveSummary(form.dataset.assignmentId, "Unsaved changes…", "pending");
  const timer = setTimeout(() => {''',
    "surface aggregate unsaved state",
)
replace_once(
    app,
    '''  const response = await api("draft.save", { method: "PUT", body });
  form.dataset.version = String(response.draft.version);
  setFormStatus(form, response.complete ? "Saved · complete" : "Saved · incomplete", response.complete ? "success" : "pending");
  return response;''',
    '''  const response = await api("draft.save", { method: "PUT", body });
  form.dataset.version = String(response.draft.version);
  form.dataset.complete = String(response.complete);
  const savedAt = new Date(response.draft.updatedAt || Date.now());
  state.lastSavedAt.set(form.dataset.assignmentId, savedAt);
  setFormStatus(form, response.complete ? "Saved · complete" : "Saved · incomplete", response.complete ? "success" : "pending");
  updateAssignmentProgress(form.dataset.assignmentId);
  return response;''',
    "update progress after autosave",
)
replace_once(
    app,
    '''async function flushAssignmentSaves(assignmentId) {
  const forms = [...document.querySelectorAll(`.rating-form[data-assignment-id="${cssEscape(assignmentId)}"]`)];
  for (const form of forms) {
    const key = `${form.dataset.assignmentId}:${form.dataset.critiqueId}`;
    clearTimeout(state.autosaveTimers.get(key));
    if (state.pendingSaves.has(key)) await state.pendingSaves.get(key);
    await saveDraft(form);
  }
}

function readRatingForm(form) {''',
    '''async function flushAssignmentSaves(assignmentId) {
  const forms = [...document.querySelectorAll(`.rating-form[data-assignment-id="${cssEscape(assignmentId)}"]`)];
  for (const form of forms) {
    const key = `${form.dataset.assignmentId}:${form.dataset.critiqueId}`;
    clearTimeout(state.autosaveTimers.get(key));
    if (state.pendingSaves.has(key)) await state.pendingSaves.get(key);
    await saveDraft(form);
  }
}

function countCompleteAssignmentForms(assignmentId) {
  return [...document.querySelectorAll(`.rating-form[data-assignment-id="${cssEscape(assignmentId)}"]`)]
    .filter((form) => form.dataset.complete === "true").length;
}

function updateAssignmentProgress(assignmentId) {
  const section = document.querySelector(`.assignment-panel[data-assignment-id="${cssEscape(assignmentId)}"]`);
  if (!section) return;
  const forms = [...section.querySelectorAll(".rating-form")];
  const completeCount = forms.filter((form) => form.dataset.complete === "true").length;
  const copy = section.querySelector(".progress-copy");
  const meter = section.querySelector(".progress-meter");
  if (copy) copy.textContent = `${completeCount} of 4 ratings ready`;
  if (meter) {
    meter.value = completeCount;
    meter.textContent = `${completeCount} of 4`;
  }
  for (const form of forms) {
    const chip = section.querySelector(`[data-progress-critique="${cssEscape(form.dataset.critiqueId)}"]`);
    if (!chip) continue;
    const ordinal = forms.indexOf(form) + 1;
    const complete = form.dataset.complete === "true";
    chip.classList.toggle("is-complete", complete);
    chip.textContent = `Critique ${ordinal} · ${complete ? "ready" : "incomplete"}`;
  }
  const savedAt = state.lastSavedAt.get(assignmentId);
  if (savedAt) setAssignmentSaveSummary(assignmentId, `All changes saved · ${formatSavedTime(savedAt)}`, "success");
}

function setAssignmentSaveSummary(assignmentId, text, kind) {
  const summary = document.querySelector(`.assignment-panel[data-assignment-id="${cssEscape(assignmentId)}"] .autosave-summary`);
  if (!summary) return;
  summary.textContent = text;
  summary.dataset.kind = kind;
}

function formatSavedTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "saved";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function isRatingCompleteForProgress(rating) {
  if (!rating || typeof rating !== "object") return false;
  const dimensions = ["centrality", "strength", "correctness", "clarity", "dead_weight", "single_issue", "overall"];
  if (dimensions.some((dimension) => {
    const value = Number(rating.scores?.[dimension]);
    return !Number.isFinite(value) || value < 0 || value > 1;
  })) return false;
  if (!["assessable", "clearly_unsatisfactory", "not_meaningfully_assessable"].includes(rating.assessability)) return false;
  if (!["high", "medium", "low"].includes(rating.interpretationConfidence)) return false;
  if (!["high", "medium", "low"].includes(rating.confidence)) return false;
  if (!["not_needed", "checked", "partially_checked", "unable_to_check"].includes(rating.verificationStatus)) return false;
  if (String(rating.rationale ?? "").trim().length < 40) return false;
  const seconds = Number(rating.timeSpentSeconds);
  return Number.isInteger(seconds) && seconds >= 0 && seconds <= 86400;
}

function openSubmitConfirmation(assignment) {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "confirmation-dialog";
    dialog.innerHTML = `
      <form method="dialog">
        <p class="eyebrow">Final review</p>
        <h2>Submit and lock four ratings?</h2>
        <p>Your drafts have been saved and validated. Submission creates four immutable initial-rating records.</p>
        <ul class="confirmation-list">
          <li>You will receive a submission receipt.</li>
          <li>You will no longer be able to edit these initial ratings.</li>
          <li>A later correction requires a separate, predecessor-linked record.</li>
          <li>This rehearsal remains synthetic and excluded from research use.</li>
        </ul>
        <details class="technical-integrity">
          <summary>Technical submission details</summary>
          <p>Assignment <code>${escapeHtml(assignment.id)}</code></p>
          <p>Packet commitment <code>${escapeHtml(assignment.packetHash)}</code></p>
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
    dialog.querySelector('button[value="cancel"]').focus();
  });
}

function readRatingForm(form) {''',
    "add progress, completeness, and confirmation helpers",
)

styles = ROOT / "staging/styles.css"
with styles.open("a", encoding="utf-8") as handle:
    handle.write(r'''

/* Participant-readiness improvements: onboarding, progress, recoverability, and quieter technical detail. */
.skip-link {
  position: fixed;
  top: -64px;
  left: 18px;
  z-index: 100;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--ink);
  color: #fff;
  font-weight: 800;
  text-decoration: none;
  transition: top 120ms ease;
}
.skip-link:focus { top: 12px; }

.session-brief {
  overflow: hidden;
  background:
    radial-gradient(circle at 100% 0, rgba(15, 101, 94, .12), transparent 34%),
    var(--paper);
}
.session-brief-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}
.session-brief-heading > div:first-child { max-width: 760px; }
.session-brief-heading .muted { margin: 12px 0 0; }
.session-facts {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
  max-width: 360px;
}
.session-facts span {
  padding: 7px 10px;
  border: 1px solid #bfd5d2;
  border-radius: 999px;
  background: var(--accent-pale);
  color: var(--accent-dark);
  font-size: 11px;
  font-weight: 800;
}
.brief-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
  margin-top: 24px;
}
.brief-step {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, .82);
}
.brief-step > span {
  display: grid;
  flex: 0 0 29px;
  width: 29px;
  height: 29px;
  place-items: center;
  border-radius: 50%;
  background: var(--ink);
  color: #fff;
  font-size: 12px;
  font-weight: 850;
}
.brief-step h3 { margin: 1px 0 5px; font-size: 15px; }
.brief-step p { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.55; }
.support-callout {
  display: grid;
  grid-template-columns: minmax(160px, .35fr) minmax(0, 1fr);
  gap: 16px;
  margin-top: 18px;
  padding: 15px 17px;
  border: 1px solid #dfaaa5;
  border-radius: 11px;
  background: var(--danger-pale);
  color: #66302c;
  font-size: 12px;
  line-height: 1.55;
}

.technical-integrity {
  margin-top: 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fafcfc;
  color: var(--muted);
  font-size: 12px;
}
.technical-integrity summary {
  padding: 11px 13px;
  cursor: pointer;
  color: #45585d;
  font-weight: 750;
}
.technical-integrity > p,
.technical-integrity > dl,
.technical-integrity > ul {
  margin: 0;
  padding: 0 13px 13px;
}
.technical-integrity dl { display: grid; gap: 8px; }
.technical-integrity dl > div { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 10px; }
.technical-integrity dt { font-weight: 800; }
.technical-integrity dd { margin: 0; min-width: 0; }
.technical-integrity code { overflow-wrap: anywhere; }
.assignment-integrity { margin: 14px 0 0; }
.critique-integrity { margin: -4px 0 18px; background: transparent; }

.assignment-progress {
  margin: 22px 0 26px;
  padding: 17px;
  border: 1px solid #bfd5d2;
  border-radius: 12px;
  background: #f4faf9;
}
.progress-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.progress-heading .eyebrow { margin-bottom: 5px; }
.progress-copy { font-size: 18px; }
.autosave-summary { color: var(--muted); font-size: 12px; }
.autosave-summary[data-kind="pending"] { color: var(--warning); }
.autosave-summary[data-kind="success"] { color: var(--success); }
.progress-meter {
  width: 100%;
  height: 9px;
  margin: 14px 0 10px;
  border: 0;
  border-radius: 999px;
  overflow: hidden;
  background: #dce9e7;
}
.progress-meter::-webkit-progress-bar { background: #dce9e7; border-radius: 999px; }
.progress-meter::-webkit-progress-value { background: var(--accent); border-radius: 999px; }
.progress-meter::-moz-progress-bar { background: var(--accent); border-radius: 999px; }
.progress-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.progress-chip {
  padding: 6px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
}
.progress-chip.is-complete {
  border-color: #a9d0be;
  background: #edf8f2;
  color: var(--success);
}
.field-help { color: var(--muted); font-size: 11px; font-weight: 500; line-height: 1.45; }

.confirmation-dialog form { display: grid; gap: 15px; }
.confirmation-dialog h2 { margin-bottom: 0; }
.confirmation-dialog p { margin: 0; }
.confirmation-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 22px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}
.dialog-actions { justify-content: flex-end; margin-top: 4px; }

@media (max-width: 900px) {
  .session-brief-heading { flex-direction: column; }
  .session-facts { justify-content: flex-start; max-width: none; }
}

@media (max-width: 560px) {
  .brief-grid { grid-template-columns: 1fr; }
  .support-callout { grid-template-columns: 1fr; gap: 5px; }
  .progress-heading { align-items: flex-start; flex-direction: column; gap: 6px; }
  .technical-integrity dl > div { grid-template-columns: 1fr; gap: 2px; }
  .dialog-actions { align-items: stretch; flex-direction: column-reverse; }
  .dialog-actions button { width: 100%; }
}
''')

test = ROOT / "e2e/human-workflow-staging.spec.mjs"
replace_once(
    test,
    'import { expect, test } from "@playwright/test";',
    'import { mkdir } from "node:fs/promises";\n\nimport { expect, test } from "@playwright/test";',
    "add screenshot-directory dependency",
)
replace_once(
    test,
    '''test("complete synthetic human workflow preserves initial ratings across correction, withdrawal, rerating, and three adjudication closures", async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();''',
    '''test("complete synthetic human workflow preserves initial ratings across correction, withdrawal, rerating, and three adjudication closures", async ({ browser }) => {
  await mkdir(".staging-evidence/browser", { recursive: true });
  const contextA = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const pageA = await contextA.newPage();''',
    "prepare visual evidence",
)
replace_once(
    test,
    '''  await expect(pageA.getByRole("heading", { name: "Rate contextualized critiques" })).toBeVisible();
  await expect(pageA.locator(".critique-card")).toHaveCount(4);''',
    '''  await expect(pageA.getByRole("heading", { name: "Rate contextualized critiques" })).toBeVisible();
  await expect(pageA.getByRole("heading", { name: "What this synthetic rehearsal will ask you to do" })).toBeVisible();
  await expect(pageA.getByText("60–90 minutes")).toBeVisible();
  await expect(pageA.getByText("0 of 4 ratings ready")).toBeVisible();
  await pageA.screenshot({ path: ".staging-evidence/browser/desktop-rater-entry.png", animations: "disabled" });
  await expect(pageA.locator(".critique-card")).toHaveCount(4);''',
    "assert and capture rater onboarding",
)
replace_once(
    test,
    '''  await completeRating(firstCardA, { overall: 0.9, strength: 0.9, requestReview: true });
  await expect(firstCardA.locator(".form-status")).toContainText("Saved · complete");''',
    '''  await completeRating(firstCardA, { overall: 0.9, strength: 0.9, requestReview: true });
  await expect(firstCardA.locator(".form-status")).toContainText("Saved · complete");
  await expect(pageA.getByText("1 of 4 ratings ready")).toBeVisible();
  await firstCardA.screenshot({ path: ".staging-evidence/browser/desktop-first-critique-complete.png", animations: "disabled" });''',
    "capture completed critique state",
)
replace_once(
    test,
    '''  await resumedPageA.getByRole("button", { name: "Submit all four ratings" }).click();
  await expect(resumedPageA.getByText("Submitted and locked.")).toBeVisible();''',
    '''  await expect(resumedPageA.getByText("4 of 4 ratings ready")).toBeVisible();
  await resumedPageA.getByRole("button", { name: "Review and submit four ratings" }).click();
  const desktopConfirmation = resumedPageA.getByRole("dialog");
  await expect(desktopConfirmation.getByRole("heading", { name: "Submit and lock four ratings?" })).toBeVisible();
  await resumedPageA.screenshot({ path: ".staging-evidence/browser/desktop-submit-confirmation.png", animations: "disabled" });
  await desktopConfirmation.getByRole("button", { name: "Submit and lock" }).click();
  await expect(resumedPageA.getByText("Submitted and locked.")).toBeVisible();''',
    "verify desktop submission confirmation",
)
replace_once(
    test,
    '''  await redeemInBrowser(pageB, setup.raterB.inviteToken);
  await expect(pageB.getByText("Synthetic browser rater A")).toHaveCount(0);''',
    '''  await redeemInBrowser(pageB, setup.raterB.inviteToken);
  await expect(pageB.getByRole("heading", { name: "What this synthetic rehearsal will ask you to do" })).toBeVisible();
  await pageB.screenshot({ path: ".staging-evidence/browser/mobile-rater-entry.png", animations: "disabled" });
  await expect(pageB.getByText("Synthetic browser rater A")).toHaveCount(0);''',
    "capture narrow-mobile onboarding",
)
replace_once(
    test,
    '''  await pageB.getByRole("button", { name: "Submit all four ratings" }).click();
  await expect(pageB.getByText("Submitted and locked.")).toBeVisible();''',
    '''  await expect(pageB.getByText("4 of 4 ratings ready")).toBeVisible();
  await pageB.getByRole("button", { name: "Review and submit four ratings" }).click();
  const mobileConfirmation = pageB.getByRole("dialog");
  await expect(mobileConfirmation.getByRole("heading", { name: "Submit and lock four ratings?" })).toBeVisible();
  await pageB.screenshot({ path: ".staging-evidence/browser/mobile-submit-confirmation.png", animations: "disabled" });
  await mobileConfirmation.getByRole("button", { name: "Submit and lock" }).click();
  await expect(pageB.getByText("Submitted and locked.")).toBeVisible();''',
    "verify mobile submission confirmation",
)
replace_once(
    test,
    '''  await reratingPanel.getByRole("button", { name: "Submit all four ratings" }).click();
  await expect(reratingPanel.getByText("Submitted and locked.")).toBeVisible();''',
    '''  await reratingPanel.getByRole("button", { name: "Review and submit four ratings" }).click();
  const reratingConfirmation = resumedPageA.getByRole("dialog");
  await expect(reratingConfirmation.getByRole("heading", { name: "Submit and lock four ratings?" })).toBeVisible();
  await reratingConfirmation.getByRole("button", { name: "Submit and lock" }).click();
  await expect(reratingPanel.getByText("Submitted and locked.")).toBeVisible();''',
    "verify rerating submission confirmation",
)

for relative in EXPECTED_BLOBS:
    path = ROOT / relative
    if git_blob(path) == EXPECTED_BLOBS[relative]:
        raise SystemExit(f"{relative}: patch did not change the file")

print("Applied staging participant-readiness UX improvements.")
