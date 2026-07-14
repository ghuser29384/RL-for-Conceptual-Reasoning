(() => {
  "use strict";

  const CONFIG = Object.freeze({
    campaign: "expert_reviewers_100_july_2026",
    deadlineUtc: "2026-07-17T07:00:00.000Z", // July 16, 11:59 PM PDT
    enforceDeadline: true,
    minHumanSeconds: 150,
    contactEmail: "caijun054@gmail.com",
    supabaseUrl: "https://jnpoxvalyjtdghnperyu.supabase.co",
    supabaseKey: "sb_publishable_Pcmy5vefKiaEhuYTOSU75Q_NklsZOrT",
    intakeTable: "webinar_rsvps",
    eventTable: "funnel_events",
    formVersion: "2026-07-14.1",
    calibrationItemId: "lmca_table2_critique1",
  });

  const STORAGE = Object.freeze({
    anonymousId: "crr_anonymous_id",
    draft: "crr_reviewer_draft_v1",
    queued: "crr_queued_submission_v1",
  });

  const memoryStore = new Map();
  const storage = Object.freeze({
    getItem(key) {
      try { return window.localStorage.getItem(key); }
      catch { return memoryStore.has(key) ? memoryStore.get(key) : null; }
    },
    setItem(key, value) {
      const stringValue = String(value);
      try { window.localStorage.setItem(key, stringValue); }
      catch { memoryStore.set(key, stringValue); }
    },
    removeItem(key) {
      try { window.localStorage.removeItem(key); }
      catch { memoryStore.delete(key); }
    },
  });

  const form = document.querySelector("#reviewer-form");
  const steps = [...document.querySelectorAll(".form-step")];
  const nextButton = document.querySelector("#next-button");
  const backButton = document.querySelector("#back-button");
  const submitButton = document.querySelector("#submit-button");
  const progressBar = document.querySelector("#progress-bar");
  const progressLabel = document.querySelector("#progress-label");
  const banner = document.querySelector("#status-banner");
  const completion = document.querySelector("#completion");
  const offlineRecovery = document.querySelector("#offline-recovery");
  const retryButton = document.querySelector("#retry-submit");
  const downloadBackupButton = document.querySelector("#download-backup");
  const ratingInputs = [...document.querySelectorAll('input[type="range"]')];
  const ratingTouched = new Set();
  let currentStep = 1;
  let pendingSubmission = null;

  const safeJsonParse = (value, fallback = null) => {
    try { return JSON.parse(value); } catch { return fallback; }
  };

  const makeId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  };

  const getAnonymousId = () => {
    let id = storage.getItem(STORAGE.anonymousId);
    if (!id) {
      id = makeId();
      storage.setItem(STORAGE.anonymousId, id);
    }
    return id;
  };

  const anonymousId = getAnonymousId();
  const params = new URLSearchParams(window.location.search);
  const attribution = Object.freeze({
    campaign: CONFIG.campaign,
    landing_url: window.location.href,
    referrer: document.referrer || null,
    ref: params.get("ref") || null,
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || CONFIG.campaign,
    utm_term: params.get("utm_term") || null,
    utm_content: params.get("utm_content") || null,
  });

  const showBanner = (message, kind = "") => {
    banner.textContent = message;
    banner.className = `status-banner${kind ? ` ${kind}` : ""}`;
    banner.hidden = false;
    banner.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const clearBanner = () => {
    banner.hidden = true;
    banner.textContent = "";
    banner.className = "status-banner";
  };

  const eventPayload = (eventType, metadata = {}) => ({
    anonymous_id: anonymousId,
    event_type: eventType,
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_term: attribution.utm_term,
    utm_content: attribution.utm_content,
    metadata: {
      campaign: CONFIG.campaign,
      form_version: CONFIG.formVersion,
      ...metadata,
    },
  });

  async function postToSupabase(table, body, { keepalive = false } = {}) {
    const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CONFIG.supabaseKey,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
      keepalive,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Submission failed (${response.status})${text ? `: ${text.slice(0, 240)}` : ""}`);
    }
  }

  const trackEvent = (eventType, metadata = {}) => {
    postToSupabase(CONFIG.eventTable, eventPayload(eventType, metadata), { keepalive: true }).catch(() => {
      // Funnel telemetry must never block the reviewer task.
    });
  };

  const deadlinePassed = () => Date.now() > new Date(CONFIG.deadlineUtc).getTime();

  function updateStep({ scroll = true } = {}) {
    steps.forEach((step) => {
      step.hidden = Number(step.dataset.step) !== currentStep;
    });
    backButton.hidden = currentStep === 1;
    nextButton.hidden = currentStep === steps.length;
    submitButton.hidden = currentStep !== steps.length;
    progressBar.style.width = `${(currentStep / steps.length) * 100}%`;
    progressLabel.textContent = `Step ${currentStep} of ${steps.length}`;
    if (scroll) document.querySelector(`[data-step="${currentStep}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    clearBanner();
    trackEvent("reviewer_step_view", { step: currentStep });
  }

  function checkedTopics() {
    return [...form.querySelectorAll('input[name="topics"]:checked')].map((input) => input.value);
  }

  function validateStep(stepNumber) {
    const step = document.querySelector(`[data-step="${stepNumber}"]`);
    const fields = [...step.querySelectorAll("input, select, textarea")].filter((field) => field.type !== "range");
    let firstInvalid = null;

    for (const field of fields) {
      field.dataset.touched = "true";
      if (!field.checkValidity() && !firstInvalid) firstInvalid = field;
    }

    if (stepNumber === 1 && checkedTopics().length === 0) {
      document.querySelector("#topics-error").hidden = false;
      firstInvalid ||= document.querySelector("#topic-grid input");
    } else if (stepNumber === 1) {
      document.querySelector("#topics-error").hidden = true;
    }

    if (stepNumber === 4 && ratingTouched.size < ratingInputs.length) {
      firstInvalid ||= ratingInputs.find((input) => !ratingTouched.has(input.name));
      showBanner("Move each rating control at least once, then confirm the final values.", "error");
    }

    if (firstInvalid) {
      if (banner.hidden) showBanner("Please complete the highlighted required fields before continuing.", "error");
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    return true;
  }

  function formState() {
    const data = new FormData(form);
    const state = {};
    for (const [key, value] of data.entries()) {
      if (key === "topics") continue;
      state[key] = value;
    }
    state.topics = checkedTopics();
    state.rating_touched = [...ratingTouched];
    state.current_step = currentStep;
    return state;
  }

  function persistDraft() {
    try {
      storage.setItem(STORAGE.draft, JSON.stringify(formState()));
    } catch {
      // A full or disabled localStorage should not block completion.
    }
  }

  function restoreDraft() {
    const state = safeJsonParse(storage.getItem(STORAGE.draft), null);
    if (!state || typeof state !== "object") return;

    Object.entries(state).forEach(([key, value]) => {
      if (["topics", "rating_touched", "current_step"].includes(key)) return;
      const field = form.elements.namedItem(key);
      if (!field) return;
      if (field instanceof RadioNodeList) return;
      if (field.type === "checkbox") field.checked = value === "on" || value === true;
      else field.value = value;
    });

    if (Array.isArray(state.topics)) {
      form.querySelectorAll('input[name="topics"]').forEach((input) => {
        input.checked = state.topics.includes(input.value);
      });
    }
    if (Array.isArray(state.rating_touched)) {
      state.rating_touched.forEach((name) => ratingTouched.add(name));
    }
    if (Number.isInteger(Number(state.current_step))) {
      currentStep = Math.min(Math.max(Number(state.current_step), 1), steps.length);
    }
  }

  function updateCharacterCount(id, outputId) {
    const field = document.querySelector(id);
    const output = document.querySelector(outputId);
    output.textContent = String(field.value.length);
  }

  function updateRatings() {
    for (const input of ratingInputs) {
      document.querySelector(`#${input.id}-output`).textContent = input.value;
    }
    const impact = (Number(document.querySelector("#centrality").value) * Number(document.querySelector("#strength").value)) / 100;
    document.querySelector("#impact-product").textContent = `${Math.round(impact)}%`;
  }

  function preliminaryCalibration(ratings, rationale) {
    const checks = {
      centrality_high: ratings.centrality >= 80,
      strength_low: ratings.strength <= 25,
      correctness_low: ratings.correctness <= 35,
      clarity_high: ratings.clarity >= 80,
      dead_weight_low: ratings.dead_weight <= 20,
      single_issue_high: ratings.single_issue >= 80,
      overall_low: ratings.overall <= 25,
      rationale_substantive: rationale.trim().length >= 180,
    };
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, broad_anchor_checks_passed: score, total_checks: Object.keys(checks).length };
  }

  function buildSubmission() {
    const data = new FormData(form);
    const startedAt = data.get("started_at") || new Date().toISOString();
    const completionSeconds = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
    const ratings = {
      centrality: Number(data.get("centrality")),
      strength: Number(data.get("strength")),
      correctness: Number(data.get("correctness")),
      clarity: Number(data.get("clarity")),
      dead_weight: Number(data.get("dead_weight")),
      single_issue: Number(data.get("single_issue")),
      overall: Number(data.get("overall")),
    };
    const rationale = String(data.get("rationale") || "");
    const preliminary = preliminaryCalibration(ratings, rationale);

    const record = {
      submission_id: makeId(),
      campaign: CONFIG.campaign,
      form_version: CONFIG.formVersion,
      submitted_at: new Date().toISOString(),
      started_at: startedAt,
      completion_seconds: completionSeconds,
      anonymous_id: anonymousId,
      eligibility: {
        adult_confirmed: Boolean(data.get("adult")),
        role: data.get("role"),
        affiliation: data.get("affiliation") || null,
        primary_field: data.get("primary_field"),
        topics: checkedTopics(),
        experience_years: data.get("experience_years"),
        profile_url: data.get("profile_url") || null,
        experience_summary: data.get("experience_summary"),
      },
      consent: {
        research_consent: Boolean(data.get("research_consent")),
        independent_no_ai: Boolean(data.get("good_faith")),
        follow_on: Boolean(data.get("follow_on")),
        acknowledgment_interest: Boolean(data.get("acknowledgment")),
        rubric_read: Boolean(data.get("rubric_read")),
      },
      calibration: {
        item_id: CONFIG.calibrationItemId,
        ratings,
        impact_product: Number(((ratings.centrality / 100) * (ratings.strength / 100)).toFixed(4)),
        rationale,
        confidence: Number(data.get("confidence")),
        preliminary,
      },
      acquisition: {
        referral: data.get("referral") || attribution.ref || null,
        nominations: data.get("nominations") || null,
        attribution,
      },
      quality_flags: {
        minimum_time_met: completionSeconds >= CONFIG.minHumanSeconds,
        all_ratings_touched: ratingTouched.size === ratingInputs.length,
        honeypot_empty: !String(data.get("website") || "").trim(),
        deadline_passed: deadlinePassed(),
        user_agent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      },
    };

    return {
      privateRecord: {
        email: String(data.get("email") || "").trim().toLowerCase(),
        display_name: String(data.get("display_name") || "").trim(),
        role: String(data.get("role") || ""),
        community: String(data.get("primary_field") || ""),
        session_preference: "async-calibration",
        notes: JSON.stringify(record),
        attribution,
        status: "calibration_submitted",
      },
      auditRecord: record,
    };
  }

  async function submitPayload(submission) {
    await postToSupabase(CONFIG.intakeTable, submission.privateRecord);
    trackEvent("reviewer_submit_success", {
      submission_id: submission.auditRecord.submission_id,
      completion_seconds: submission.auditRecord.completion_seconds,
      role: submission.auditRecord.eligibility.role,
      primary_field: submission.auditRecord.eligibility.primary_field,
      minimum_time_met: submission.auditRecord.quality_flags.minimum_time_met,
    });
  }

  function saveQueuedSubmission(submission) {
    pendingSubmission = submission;
    try { storage.setItem(STORAGE.queued, JSON.stringify(submission)); } catch {}
  }

  function clearSubmissionStorage() {
    storage.removeItem(STORAGE.draft);
    storage.removeItem(STORAGE.queued);
  }

  function showCompletion(email) {
    form.hidden = true;
    offlineRecovery.hidden = true;
    document.querySelector(".form-heading").hidden = true;
    completion.hidden = false;
    document.querySelector("#completion-email").textContent = email;

    const cleanUrl = `${window.location.origin}${window.location.pathname}?utm_source=referral&utm_medium=peer&utm_campaign=${encodeURIComponent(CONFIG.campaign)}`;
    const referralText = `Paid 10–15 minute expert review: evaluate one conceptual argument using a structured, blinded rubric. $25 calibration honorarium; no ongoing commitment. Current intake closes July 16. ${cleanUrl}`;
    document.querySelector("#referral-copy").textContent = referralText;
    document.querySelector("#mailto-referral").href = `mailto:?subject=${encodeURIComponent("Paid expert review of a conceptual argument")}&body=${encodeURIComponent(referralText)}`;
    completion.focus();
  }

  function showOfflineRecovery() {
    form.hidden = true;
    document.querySelector(".form-heading").hidden = true;
    completion.hidden = true;
    offlineRecovery.hidden = false;
    offlineRecovery.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function downloadBackup() {
    const submission = pendingSubmission || safeJsonParse(storage.getItem(STORAGE.queued), null);
    if (!submission) return;
    const blob = new Blob([JSON.stringify(submission, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `conceptual-reasoning-review-${submission.auditRecord?.submission_id || Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  nextButton.addEventListener("click", () => {
    clearBanner();
    if (!validateStep(currentStep)) return;
    trackEvent("reviewer_step_complete", { step: currentStep });
    currentStep += 1;
    persistDraft();
    updateStep();
  });

  backButton.addEventListener("click", () => {
    currentStep = Math.max(1, currentStep - 1);
    persistDraft();
    updateStep();
  });

  form.addEventListener("input", (event) => {
    if (event.target.matches('input[type="range"]')) ratingTouched.add(event.target.name);
    if (event.target.id === "experience-summary") updateCharacterCount("#experience-summary", "#experience-count");
    if (event.target.id === "rationale") updateCharacterCount("#rationale", "#rationale-count");
    if (event.target.name === "topics") document.querySelector("#topics-error").hidden = checkedTopics().length > 0;
    updateRatings();
    persistDraft();
  });

  form.addEventListener("change", persistDraft);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearBanner();

    if (!validateStep(4)) return;
    if (CONFIG.enforceDeadline && deadlinePassed() && params.get("preview") !== "1") {
      showBanner("This July 14–16 intake window has closed. Contact the research team for the next reviewer cohort.", "error");
      return;
    }

    const honeypot = String(new FormData(form).get("website") || "").trim();
    if (honeypot) {
      // Quietly reject automated submissions without revealing the trap.
      form.hidden = true;
      document.querySelector(".form-heading").hidden = true;
      completion.hidden = false;
      document.querySelector("#completion-email").textContent = "the address provided";
      return;
    }

    const submission = buildSubmission();
    saveQueuedSubmission(submission);
    submitButton.disabled = true;
    submitButton.textContent = "Submitting…";
    trackEvent("reviewer_submit_attempt", {
      completion_seconds: submission.auditRecord.completion_seconds,
      role: submission.auditRecord.eligibility.role,
      primary_field: submission.auditRecord.eligibility.primary_field,
    });

    try {
      await submitPayload(submission);
      clearSubmissionStorage();
      showCompletion(submission.privateRecord.email);
    } catch (error) {
      console.error(error);
      trackEvent("reviewer_submit_network_failure", { message: String(error?.message || "unknown").slice(0, 180) });
      showOfflineRecovery();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit calibration review";
    }
  });

  retryButton.addEventListener("click", async () => {
    const queued = pendingSubmission || safeJsonParse(storage.getItem(STORAGE.queued), null);
    if (!queued) {
      offlineRecovery.hidden = true;
      form.hidden = false;
      document.querySelector(".form-heading").hidden = false;
      showBanner("No saved submission was found. Please review the form and submit again.", "error");
      return;
    }

    retryButton.disabled = true;
    retryButton.textContent = "Retrying…";
    try {
      await submitPayload(queued);
      clearSubmissionStorage();
      showCompletion(queued.privateRecord.email);
    } catch (error) {
      console.error(error);
      retryButton.textContent = "Retry submission";
      retryButton.disabled = false;
    }
  });

  downloadBackupButton.addEventListener("click", downloadBackup);

  document.querySelector("#copy-referral").addEventListener("click", async () => {
    const text = document.querySelector("#referral-copy").textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      document.querySelector("#copy-referral").textContent = "Copied";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector("#referral-copy"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    trackEvent("reviewer_referral_copy");
  });

  document.querySelectorAll("[data-track]").forEach((element) => {
    element.addEventListener("click", () => trackEvent(element.dataset.track));
  });

  // Initialize form.
  const existingStartedAt = safeJsonParse(storage.getItem(STORAGE.draft), {})?.started_at;
  document.querySelector("#started-at").value = existingStartedAt || new Date().toISOString();
  restoreDraft();
  document.querySelector("#started-at").value ||= new Date().toISOString();
  if (!document.querySelector("#referral").value && attribution.ref) document.querySelector("#referral").value = attribution.ref;
  updateCharacterCount("#experience-summary", "#experience-count");
  updateCharacterCount("#rationale", "#rationale-count");
  updateRatings();
  updateStep({ scroll: false });

  const queued = safeJsonParse(storage.getItem(STORAGE.queued), null);
  if (queued) {
    pendingSubmission = queued;
    showBanner("A previously completed response is saved on this device. Finish the form to replace it, or submit again if the earlier network attempt failed.");
  }

  if (CONFIG.enforceDeadline && deadlinePassed() && params.get("preview") !== "1") {
    nextButton.disabled = true;
    submitButton.disabled = true;
    showBanner("This July 14–16 intake window has closed. Contact the research team for the next reviewer cohort.", "error");
  }

  trackEvent("reviewer_landing_view", { viewport_width: window.innerWidth });
})();
