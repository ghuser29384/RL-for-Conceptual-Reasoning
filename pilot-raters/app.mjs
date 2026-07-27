const form = document.querySelector("#pilotRaterForm");
const alertBox = document.querySelector("#formAlert");
const completionPanel = document.querySelector("#completionPanel");
const submitButton = document.querySelector("#submitButton");
const liveProgress = document.querySelector("#liveProgress");

form.elements.careerStage.addEventListener("change", updateConditionalFields);
for (const checkbox of form.querySelectorAll('input[name="expertise"]')) checkbox.addEventListener("change", updateConditionalFields);
updateConditionalFields();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();
  if (!validateForm()) return;

  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";

  try {
    const response = await fetch("/api/pilot-rater-eoi", {
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
    showAlert(error.message || "The expression of interest could not be recorded. No application status was created.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit expression of interest";
  }
});

void loadProgress();

function buildPayload() {
  const params = new URLSearchParams(window.location.search);
  const expertise = [...form.querySelectorAll('input[name="expertise"]:checked')].map((input) => input.value);
  return {
    displayName: form.elements.displayName.value,
    email: form.elements.email.value,
    careerStage: form.elements.careerStage.value,
    otherCareerStage: form.elements.otherCareerStage.value,
    affiliation: form.elements.affiliation.value,
    profileUrl: form.elements.profileUrl.value,
    expertise,
    otherExpertise: form.elements.otherExpertise.value,
    relevantExperience: form.elements.relevantExperience.value,
    motivation: form.elements.motivation.value,
    availableHours: form.elements.availableHours.value,
    timezone: form.elements.timezone.value,
    conflictDisclosure: form.elements.conflictDisclosure.value,
    website: form.elements.website.value,
    consent: {
      age18: form.elements.age18.checked,
      accuracy: form.elements.accuracy.checked,
      contact: form.elements.contact.checked,
      researchOperations: form.elements.researchOperations.checked,
      nonbinding: form.elements.nonbinding.checked,
      noAiCalibration: form.elements.noAiCalibration.checked,
    },
    source: {
      source: params.get("source") || "direct",
      campaign: params.get("campaign") || "metaphilosophy-pilot-01",
      referredBy: params.get("ref") || "",
      landingPath: `${window.location.pathname}${window.location.search}`,
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    },
  };
}

function validateForm() {
  const controls = [...form.querySelectorAll("input, select, textarea")].filter(
    (control) => !control.disabled && !control.closest("[hidden]"),
  );
  let firstInvalid = null;

  for (const control of controls) {
    if (!control.checkValidity()) {
      firstInvalid ??= control;
      control.setAttribute("aria-invalid", "true");
    }
  }

  if (form.querySelectorAll('input[name="expertise"]:checked').length === 0) {
    form.querySelector('[data-error-for="expertise"]').textContent = "Select at least one relevant area.";
    firstInvalid ??= form.querySelector('input[name="expertise"]');
  }

  if (firstInvalid) {
    showAlert("Complete the highlighted fields before submitting.");
    firstInvalid.focus();
    return false;
  }
  return true;
}

function updateConditionalFields() {
  const otherCareerStage = document.querySelector('[data-show-when="careerStage:other"]');
  const showOtherCareerStage = form.elements.careerStage.value === "other";
  otherCareerStage.hidden = !showOtherCareerStage;
  form.elements.otherCareerStage.required = showOtherCareerStage;

  const otherExpertise = document.querySelector('[data-show-when="expertise:other"]');
  const showOtherExpertise = form.querySelector('input[name="expertise"][value="other"]').checked;
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
  completionPanel.hidden = false;
  document.querySelector("#applicationReference").textContent = result.applicationReference || "Recorded";
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
    pilot_rater_storage_not_configured: "The application database is temporarily unavailable. No expression of interest was recorded.",
    pilot_rater_eoi_closed: "Pilot 01 expressions of interest are currently closed.",
    cross_origin_submission_rejected: "Open the official Pilot 01 application page directly and submit again.",
  };
  return messages[code] || "The expression of interest could not be recorded. No application status was created.";
}

async function loadProgress() {
  try {
    const response = await fetch("/api/pilot-rater-eoi?mode=stats", { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const stats = await response.json();
    if (Number(stats.applications) > 0) {
      liveProgress.textContent = `${stats.applications} expression${stats.applications === 1 ? "" : "s"} of interest received; every qualification decision remains human-reviewed.`;
      liveProgress.hidden = false;
    }
  } catch {
    // Aggregate progress is supplementary; the form remains usable without it.
  }
}
