export const ADJUDICATION_ROUTE_IDS = Object.freeze([
  "insufficient_context",
  "item_integrity",
  "unresolved_verification",
  "low_clarity",
  "overall_gap",
  "strength_times_centrality_gap",
  "correctness_gap",
  "clarity_gap",
]);

export const NUMERIC_THRESHOLD_ROUTE_IDS = Object.freeze([
  "overall_gap",
  "strength_times_centrality_gap",
  "correctness_gap",
  "clarity_gap",
]);

export function validatePilotAnalysisPolicy(value = {}) {
  const errors = [];
  const policy = objectOrEmpty(value);
  const explicitPolicy = Object.keys(policy).length > 0;
  const status = cleanString(policy.status) || (explicitPolicy ? "diagnostic_only_no_routes_approved" : "implicit_diagnostic_default");

  if (policy.approved_routes !== undefined && !Array.isArray(policy.approved_routes)) {
    errors.push("approved_routes must be an array when supplied.");
  }
  const approvedRoutes = normalizeStrings(policy.approved_routes);
  if (new Set(approvedRoutes).size !== approvedRoutes.length) errors.push("approved_routes must not contain duplicates.");
  for (const route of approvedRoutes) {
    if (!ADJUDICATION_ROUTE_IDS.includes(route)) errors.push(`Unsupported approved route: ${route}.`);
  }

  if (
    policy.numeric_thresholds !== undefined &&
    (!policy.numeric_thresholds || typeof policy.numeric_thresholds !== "object" || Array.isArray(policy.numeric_thresholds))
  ) {
    errors.push("numeric_thresholds must be an object when supplied.");
  }
  const thresholds = objectOrEmpty(policy.numeric_thresholds);
  for (const route of Object.keys(thresholds)) {
    if (!NUMERIC_THRESHOLD_ROUTE_IDS.includes(route)) errors.push(`Unsupported numeric threshold route: ${route}.`);
  }
  for (const route of NUMERIC_THRESHOLD_ROUTE_IDS) {
    if (!Object.hasOwn(thresholds, route)) continue;
    const threshold = thresholds[route];
    if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
      errors.push(`numeric_thresholds.${route} must lie in (0, 1].`);
    }
  }

  const diagnosticMinimumMeanOverallGap = policy.diagnostic_minimum_mean_overall_gap ?? 0;
  if (!unitIntervalNumber(diagnosticMinimumMeanOverallGap)) {
    errors.push("diagnostic_minimum_mean_overall_gap must lie in [0, 1].");
  }

  const lowClarityBelow = policy.low_clarity_below === undefined || policy.low_clarity_below === null
    ? null
    : policy.low_clarity_below;
  if (lowClarityBelow !== null && !unitIntervalNumber(lowClarityBelow)) {
    errors.push("low_clarity_below must lie in [0, 1] when supplied.");
  }

  for (const route of approvedRoutes) {
    if (NUMERIC_THRESHOLD_ROUTE_IDS.includes(route) && !Object.hasOwn(thresholds, route)) {
      errors.push(`Approved numeric route ${route} requires a threshold.`);
    }
    if (route === "low_clarity" && lowClarityBelow === null) {
      errors.push("Approved low_clarity route requires low_clarity_below.");
    }
  }

  const governance = objectOrEmpty(policy.governance);
  const operational = approvedRoutes.length > 0;
  if (operational) {
    if (status !== "approved_for_operation") errors.push("Non-empty approved_routes require status approved_for_operation.");
    if (governance.q_006b_approved !== true) errors.push("Operational routes require governance.q_006b_approved=true.");
    if (!nonEmptyString(governance.approval_record)) errors.push("Operational routes require a versioned governance.approval_record.");
    if (!validIsoTimestamp(governance.approved_at)) errors.push("Operational routes require a valid governance.approved_at timestamp.");
    if (
      governance.operative_adjudication_routes !== undefined &&
      governance.operative_adjudication_routes !== approvedRoutes.length
    ) {
      errors.push("governance.operative_adjudication_routes must equal the number of approved routes.");
    }
  } else if (status === "approved_for_operation") {
    errors.push("approved_for_operation requires at least one approved route.");
  }

  if (status === "diagnostic_only_no_routes_approved" && approvedRoutes.length > 0) {
    errors.push("Diagnostic-only policy cannot approve operative routes.");
  }

  const normalizedThresholds = Object.fromEntries(
    NUMERIC_THRESHOLD_ROUTE_IDS
      .filter((route) => Object.hasOwn(thresholds, route) && Number.isFinite(thresholds[route]))
      .map((route) => [route, thresholds[route]]),
  );

  return {
    status: errors.length ? "fail" : "pass",
    policy_status: status,
    normalized_policy: {
      status,
      approved_routes: [...new Set(approvedRoutes)].sort(),
      numeric_thresholds: normalizedThresholds,
      diagnostic_minimum_mean_overall_gap: unitIntervalNumber(diagnosticMinimumMeanOverallGap)
        ? diagnosticMinimumMeanOverallGap
        : 0,
      low_clarity_below: lowClarityBelow,
      operational_authorization: operational,
    },
    errors,
  };
}

export function requireValidPilotAnalysisPolicy(value = {}) {
  const report = validatePilotAnalysisPolicy(value);
  if (report.status !== "pass") throw new Error(`Pilot analysis policy is invalid:\n${report.errors.join("\n")}`);
  return report.normalized_policy;
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeStrings(value) {
  return Array.isArray(value) ? value.map(cleanString).filter(Boolean) : [];
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function unitIntervalNumber(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validIsoTimestamp(value) {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}
