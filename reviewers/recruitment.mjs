const DEADLINE = new Date("2026-07-16T23:59:00-07:00");
const GOAL = 100;
const form = document.querySelector("#reviewer-form");
const submitButton = document.querySelector("#submit-button");
const formAlert = document.querySelector("#form-alert");
const successPanel = document.querySelector("#success-panel");
const referralInput = document.querySelector("#referral-link");
const copyReferralButton = document.querySelector("#copy-referral");

function queryAttribution() {
  const params = new URLSearchParams(location.search);
  const source = params.get("utm_source") || params.get("source") || "direct";
  const medium = params.get("utm_medium") || "";
  const channel = [source, medium].filter(Boolean).join("_");
  form.elements.sourceChannel.value = channel || "direct";
  form.elements.campaign.value = params.get("utm_campaign") || "reviewer_sprint_july_2026";
  form.elements.referrerCode.value = params.get("ref") || "";
}

function updateCountdown() {
  const countdown = document.querySelector("#countdown");
  const remaining = DEADLINE.getTime() - Date.now();
  if (remaining <= 0) {
    countdown.textContent = "Intake closed";
    return;
  }
  const hours = Math.floor(remaining / 3_600_000);
  const days = Math.floor(hours / 24);
  const residualHours = hours % 24;
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  countdown.textContent = days > 0 ? `${days}d ${residualHours}h ${minutes}m` : `${hours}h ${minutes}m`;
}

async function updateProgress() {
  try {
    const response = await fetch("/api/reviewer-applications", { headers: { accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error("summary_unavailable");
    const summary = await response.json();
    const count = Math.max(0, Number(summary.activatedWorkingCount) || 0);
    const goal = Math.max(1, Number(summary.goal) || GOAL);
    const percent = Math.min(100, (count / goal) * 100);
    document.querySelector("#progress-count").textContent = `${count} / ${goal}`;
    document.querySelector("#progress-fill").style.width = `${percent}%`;
    const track = document.querySelector(".progress-track");
    track.setAttribute("aria-valuenow", String(count));
    track.setAttribute("aria-valuemax", String(goal));
  } catch {
    document.querySelector("#progress-count").textContent = "Intake open";
  }
}

function setError(key, message) {
  const target = document.querySelector(`[data-error-for="${CSS.escape(key)}"]`);
  if (target) target.textContent = message || "";

  const nameMap = {
    "calibration.centrality": "calibrationCentrality",
    "calibration.strength": "calibrationStrength",
    "calibration.correctness": "calibrationCorrectness",
    "calibration.clarity": "calibrationClarity",
    "calibration.overall": "calibrationOverall",
    "calibration.explanation": "calibrationExplanation",
  };
  const element = form.elements.namedItem(nameMap[key] || key);
  if (element && "setAttribute" in element) element.setAttribute("aria-invalid", message ? "true" : "false");
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((node) => { node.textContent = ""; });
  form.querySelectorAll('[aria-invalid="true"]').forEach((node) => node.removeAttribute("aria-invalid"));
  formAlert.hidden = true;
  formAlert.textContent = "";
}

function clientValidation() {
  clearErrors();
  if (form.checkValidity()) return true;
  const invalid = [...form.querySelectorAll(":invalid")];
  for (const element of invalid) {
    const key = element.name.startsWith("calibration")
      ? `calibration.${element.name.replace("calibration", "").toLowerCase()}`
      : element.name;
    setError(key, element.validationMessage || "Complete this field.");
  }
  invalid[0]?.focus();
  formAlert.textContent = "Complete the required fields before submitting.";
  formAlert.hidden = false;
  return false;
}

function formPayload() {
  const data = new FormData(form);
  return {
    name: data.get("name"),
    email: data.get("email"),
    roleTitle: data.get("roleTitle"),
    affiliation: data.get("affiliation"),
    profileUrl: data.get("profileUrl"),
    primaryField: data.get("primaryField"),
    secondaryFields: data.getAll("secondaryFields"),
    trainingLevel: data.get("trainingLevel"),
    expertiseSummary: data.get("expertiseSummary"),
    reviewerExperience: data.has("reviewerExperience"),
    availabilityHours: data.get("availabilityHours"),
    topicPreferences: data.getAll("topicPreferences"),
    sourceChannel: data.get("sourceChannel"),
    campaign: data.get("campaign"),
    referrerCode: data.get("referrerCode"),
    consentResearchUse: data.has("consentResearchUse"),
    consentFollowup: data.has("consentFollowup"),
    consentNoExternalAssistance: data.has("consentNoExternalAssistance"),
    consentAdult: data.has("consentAdult"),
    comments: data.get("comments"),
    website: data.get("website"),
    calibration: {
      centrality: data.get("calibrationCentrality"),
      strength: data.get("calibrationStrength"),
      correctness: data.get("calibrationCorrectness"),
      clarity: data.get("calibrationClarity"),
      overall: data.get("calibrationOverall"),
      explanation: data.get("calibrationExplanation"),
    },
  };
}

function successCopy(status) {
  if (status === "provisional_qualified") {
    return {
      title: "You meet the provisional calibration threshold.",
      message: "The team will verify your expertise record and contact you about payment and field-matched assignments. Preserve your referral link below.",
    };
  }
  if (status === "manual_review") {
    return {
      title: "Your application is queued for expert review.",
      message: "A team member will examine the calibration and expertise evidence before assignment or payment eligibility is determined.",
    };
  }
  return {
    title: "Your calibration has been recorded.",
    message: "It did not enter the immediate paid assignment queue. The team may retain the submission for quality analysis under the consent you provided.",
  };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!clientValidation()) return;

  submitButton.disabled = true;
  submitButton.textContent = "Saving…";
  clearErrors();

  try {
    const response = await fetch("/api/reviewer-applications", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(formPayload()),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (result.fields) {
        for (const [key, message] of Object.entries(result.fields)) setError(key, message);
        const firstError = Object.keys(result.fields)[0];
        const nameMap = {
          "calibration.centrality": "calibrationCentrality",
          "calibration.strength": "calibrationStrength",
          "calibration.correctness": "calibrationCorrectness",
          "calibration.clarity": "calibrationClarity",
          "calibration.overall": "calibrationOverall",
          "calibration.explanation": "calibrationExplanation",
        };
        form.elements.namedItem(nameMap[firstError] || firstError)?.focus?.();
      }
      throw new Error(result.message || "The application could not be saved.");
    }

    const copy = successCopy(result.qualificationStatus);
    document.querySelector("#success-title").textContent = copy.title;
    document.querySelector("#success-message").textContent = copy.message;
    const referralUrl = new URL("/reviewers/", location.origin);
    referralUrl.searchParams.set("ref", result.referralCode);
    referralUrl.searchParams.set("utm_source", "reviewer_referral");
    referralUrl.searchParams.set("utm_medium", "peer");
    referralUrl.searchParams.set("utm_campaign", "reviewer_sprint_july_2026");
    referralInput.value = referralUrl.toString();

    form.hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    await updateProgress();
  } catch (error) {
    formAlert.textContent = error?.message || "The application could not be saved. Try again or email caijun054+reviewers@gmail.com.";
    formAlert.hidden = false;
    formAlert.scrollIntoView({ behavior: "smooth", block: "center" });
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit calibration";
  }
});

copyReferralButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(referralInput.value);
    copyReferralButton.textContent = "Copied";
  } catch {
    referralInput.select();
    document.execCommand("copy");
    copyReferralButton.textContent = "Copied";
  }
  window.setTimeout(() => { copyReferralButton.textContent = "Copy link"; }, 1800);
});

queryAttribution();
updateCountdown();
updateProgress();
window.setInterval(updateCountdown, 60_000);
window.setInterval(updateProgress, 60_000);
