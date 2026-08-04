import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const DEFAULT_ORIGIN = "https://www.metaphilosophy.org";

const CHECKS = Object.freeze([
  {
    path: "/",
    name: "homepage shell",
    required: ["/src/site-entry.mjs", "/src/trust-home.css"],
  },
  {
    path: "/src/exact-reference-home.mjs",
    name: "homepage claims module",
    required: [
      "expert ratings have not started",
      "No Metaphilosophy expert ratings claimed yet",
      "Reviewer intake and adviser outreach remain closed",
    ],
  },
  {
    path: "/research/",
    name: "public pilot protocol",
    required: [
      "Consultation phase · production ratings not started",
      "Three artifacts. Three different claims.",
      "One gate passed. Five remain blocked.",
    ],
  },
  {
    path: "/arguments/",
    name: "synthetic library",
    required: [
      "model-authored, unrated critiques",
      "None has been expert-rated by Metaphilosophy",
      "external LMCA expert-rated research release",
    ],
  },
  {
    path: "/contribute",
    name: "closed reviewer intake",
    required: [
      "Reviewer intake is intentionally closed",
      "No application, calibration submission, deadline, or paid assignment",
    ],
  },
]);

export async function auditPreOutreachProduction(origin = DEFAULT_ORIGIN, fetchImpl = fetch) {
  const normalizedOrigin = String(origin).replace(/\/+$/u, "");
  const results = [];

  for (const check of CHECKS) {
    const url = `${normalizedOrigin}${check.path}`;
    try {
      const response = await fetchImpl(url, {
        redirect: "follow",
        headers: { "user-agent": "metaphilosophy-pre-outreach-audit/1.0" },
      });
      const text = await response.text();
      const vercelError = response.headers.get("x-vercel-error");
      const missingMarkers = check.required.filter((marker) => !text.includes(marker));
      const available = response.status >= 200 && response.status < 300 && !vercelError;
      results.push({
        name: check.name,
        path: check.path,
        status: response.status,
        available,
        vercel_error: vercelError,
        missing_markers: missingMarkers,
        passed: available && missingMarkers.length === 0,
      });
    } catch (error) {
      results.push({
        name: check.name,
        path: check.path,
        status: null,
        available: false,
        vercel_error: null,
        missing_markers: [...check.required],
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const passed = results.every((result) => result.passed);
  return {
    audit_id: "metaphilosophy-pre-outreach-production-v1",
    audited_origin: normalizedOrigin,
    status: passed ? "pass" : "fail",
    production_available: results.every((result) => result.available),
    public_claims_verified: passed,
    outreach_authorized: false,
    results,
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help")) {
    console.log("Usage: node scripts/audit-pre-outreach-production.mjs [origin]");
    console.log("Checks production availability, required public routes, closed intake, and evidence-boundary claims. Passing does not authorize email or outreach.");
  } else {
    const report = await auditPreOutreachProduction(process.argv[2] ?? DEFAULT_ORIGIN);
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== "pass") process.exitCode = 1;
  }
}
