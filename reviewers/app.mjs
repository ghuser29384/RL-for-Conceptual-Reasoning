const form = document.querySelector("#reviewerForm");
const alertBox = document.querySelector("#formAlert");
const completionPanel = document.querySelector("#completionPanel");
const submitButton = document.querySelector("#submitButton");
const scoreGrid = document.querySelector("#scoreGrid");
const liveProgress = document.querySelector("#liveProgress");

const scoreDimensions = [
  ["centrality", "Centrality", "0 = peripheral; 1 = central"],
  ["strength", "Strength", "0 = no force; 1 = devastating"],
  ["correctness", "Correctness", "0 = wrong; 1 = fully correct"],
  ["clarity", "Clarity", "0 = unclear; 1 = very clear"],
  ["dead_weight", "Dead weight", "0 = none; 1 = mostly dead weight"],
  ["single_issue", "Single issue", "0 = many issues; 1 = one issue"],
  ["overall", "Overall", "0 = very poor; 1 = excellent"],
];

for (const [key, label, hint] of scoreDimensions) {
  const wrapper = document.createElement("label");
  wrapper.className = "scoreField";
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const select = document.createElement("select");
  select.name = `score_${key}`;
  select.required = true;
  select.setAttribute("aria-describedby", `hint-${key}`);
  select.append(new Option("Select", ""));
  for (let index = 0; index <= 10; index += 1) {
    const value = (index / 10).toFixed(1);
    select.append(new Option(value, value));
  }
  const hintNode = document.createElement("small");
  hintNode.id = `hint-${key}`;
  hintNode.textContent = hint;
  wrapper.append(labelNode, select, hintNode);
  scoreGrid.append(wrapper);
}

for (const button of document.querySelectorAll("[data-next-step]")) {
  button.addEventListener("click", () => {
    const current = Number(button.closest("[data-step]").dataset.step);
    if (validateStep(current)) showStep(Number(button.dataset.nextStep));
  });
}

for (const button of document.querySelectorAll("[data-previous-step]")) {
  button.addEventListener("click", () => showStep(Number(button.dataset.previousStep)));
}

form.elements.role.addEventListener("change", updateConditionalFields);
for (const checkbox of form.querySelectorAll('input[name="expertise"]')) {
  checkbox.addEventListener("change", updateConditionalFields);
}
updateConditionalFields();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();
  if (!validateStep(3)) return;

  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";

  try {
    const response = await fetch("/api/reviewer-recruitment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (result.fields) renderServerErrors(result.fields);
      throw new Error(result.detail || humanizeError(result.error));
    }
    showCompletion(result);
  } catch (error) {
    showAlert(error.message || "The application could not be submitted. No response was recorded; please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit calibration";
  }
});

document.querySelector("#copyReferralButton").addEventListener("click", async () => {
  const link = document.querySelector("#referralLink");
  try {
    await navigator.clipboard.writeText(link.value);
    document.querySelector("#copyReferralButton").textContent = "Copied";
  } catch {
    link.select();
    document.execCommand("copy");
  }
});

void loadProgress();

function buildPayload() {
  const params = new URLSearchParams(window.location.search);
  const expertise = [...form.querySelectorAll('input[name="expertise"]:checked')].map((input) => input.value);
  const scores = Object.fromEntries(scoreDimensions.map(([key]) => [key, form.elements[`score_${key}`].value]));
  return {
    displayName: form.elements.displayName.value,
    email: form.elements.email.value,
    role: form.elements.role.value,
    otherRole: form.elements.otherRole.value,
    affiliation: form.elements.affiliation.value,
    training: form.elements.training.value,
    profileUrl: form.elements.profileUrl.value,
    expertise,
    otherExpertise: form.elements.otherExpertise.value,
    availability: form.elements.availability.value,
    website: form.elements.website.value,
    consent: {
      age18: form.elements.age18.checked,
      expertiseAffirmation: form.elements.expertiseAffirmation.checked,
      researchUse: form.elements.researchUse.checked,
      contact: form.elements.contact.checked,
      compensationTerms: form.elements.compensationTerms.checked,
      publicAttribution: form.elements.publicAttribution.checked,
    },
    calibration: {
      itemId: form.elements.calibrationItemId.value,
      scores,
      confidence: form.elements.confidence.value,
      rationale: form.elements.rationale.value,
    },
    source: {
      source: params.get("source") || "direct",
      campaign: params.get("campaign") || "july-2026-expert-reviewer-sprint",
      referredBy: params.get("ref") || "",
      landingPath: `${window.location.pathname}${window.location.search}`,
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    },
  };
}

function validateStep(step) {
  clearErrors();
  const section = document.querySelector(`[data-step="${step}"]`);
  const controls = [...section.querySelectorAll("input, select, textarea")].filter(
    (control) => !control.disabled && !control.closest("[hidden]"),
  );
  let firstInvalid = null;

  for (const control of controls) {
    if (!control.checkValidity()) {
      firstInvalid ??= control;
      control.setAttribute("aria-invalid", "true");
    }
  }

  if (step === 1 && form.querySelectorAll('input[name="expertise"]:checked').length === 0) {
    const error = form.querySelector('[data-error-for="expertise"]');
    error.textContent = "Select at least one area of expertise.";
    firstInvalid ??= form.querySelector('input[name="expertise"]');
  }

  if (firstInvalid) {
    showAlert("Complete the highlighted fields before continuing.");
    firstInvalid.focus();
    return false;
  }
  return true;
}

function showStep(step) {
  clearErrors();
  for (const section of document.querySelectorAll("[data-step]")) {
    section.hidden = Number(section.dataset.step) !== step;
  }
  for (const indicator of document.querySelectorAll("[data-step-indicator]")) {
    const number = Number(indicator.dataset.stepIndicator);
    indicator.classList.toggle("active", number === step);
    indicator.classList.toggle("complete", number < step);
  }
  document.querySelector(`[data-step="${step}"] h3`).focus();
  window.scrollTo({ top: document.querySelector(".intakeShell").offsetTop - 16, behavior: "smooth" });
}

function updateConditionalFields() {
  const showOtherRole = form.elements.role.value === "other";
  const otherRole = document.querySelector('[data-show-when="role:other"]');
  otherRole.hidden = !showOtherRole;
  form.elements.otherRole.required = showOtherRole;

  const showOtherExpertise = form.querySelector('input[name="expertise"][value="other"]').checked;
  const otherExpertise = document.querySelector('[data-show-when="expertise:other"]');
  otherExpertise.hidden = !showOtherExpertise;
  form.elements.otherExpertise.required = showOtherExpertise;
}

function renderServerErrors(errors) {
  for (const [key, message] of Object.entries(errors)) {
    const control = form.elements[key];
    if (control) {
      control.setAttribute("aria-invalid", "true");
      control.title = message;
    }
  }
}

function showCompletion(result) {
  form.hidden = true;
  document.querySelector(".progressHeader").hidden = true;
  completionPanel.hidden = false;
  document.querySelector("#applicationReference").textContent = result.applicationReference || "Recorded";
  const referralUrl = new URL("/reviewers/", window.location.origin);
  referralUrl.searchParams.set("source", "referral");
  referralUrl.searchParams.set("campaign", "july-2026-expert-reviewer-sprint");
  if (result.referralCode) referralUrl.searchParams.set("ref", result.referralCode);
  document.querySelector("#referralLink").value = referralUrl.toString();
  completionPanel.focus();
  window.scrollTo({ top: document.querySelector(".intakeShell").offsetTop - 16, behavior: "smooth" });
  void loadProgress();
}

function showAlert(message) {
  alertBox.textContent = message;
  alertBox.hidden = false;
  alertBox.focus();
}

function clearErrors() {
  alertBox.hidden = true;
  alertBox.textContent = "";
  for (const control of form.querySelectorAll('[aria-invalid="true"]')) control.removeAttribute("aria-invalid");
  for (const error of form.querySelectorAll(".fieldError")) error.textContent = "";
}

function humanizeError(code) {
  const messages = {
    validation_failed: "Review the highlighted fields and submit again.",
    submission_rate_limited: "Too many submissions were received from this browser. Try again later.",
    recruitment_storage_not_configured: "The intake database is temporarily unavailable. No response was recorded.",
    cross_origin_submission_rejected: "Open the official intake page directly and submit again.",
  };
  return messages[code] || "The application could not be recorded. No response was saved; please try again.";
}

async function loadProgress() {
  try {
    const response = await fetch("/api/reviewer-recruitment?mode=stats", { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const stats = await response.json();
    if (Number(stats.calibrationsCompleted) > 0) {
      liveProgress.textContent = `${stats.calibrationsCompleted} calibration${stats.calibrationsCompleted === 1 ? "" : "s"} completed toward the 100-reviewer target.`;
      liveProgress.hidden = false;
    }
  } catch {
    // Progress is supplementary; the form remains fully usable without it.
  }
}
