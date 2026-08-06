import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const DEFAULT_ORIGIN = "https://www.metaphilosophy.org";

const CHECKS = Object.freeze([
  {
    path: "/",
    name: "homepage shell",
    required: ["/src/site-entry.mjs", "/src/trust-home.css", "A research project by Ellen Sun"],
  },
  {
    path: "/src/exact-reference-home.mjs",
    name: "homepage claims module",
    required: [
      "Research study not yet open",
      "Philosophers can disagree and still judge arguments.",
      "0 research ratings collected",
      "Research rating recruitment is closed.",
    ],
  },
  {
    path: "/research/",
    name: "public study plan",
    required: [
      "Draft study plan · research ratings have not begun",
      "Written and maintained by Ellen Sun",
      "Three bodies of work, kept separate.",
      "The software is not the last gate.",
    ],
  },
  {
    path: "/arguments/",
    name: "synthetic library",
    required: [
      "1,000 model-written critiques",
      "None has an expert rating.",
      "separate from the expert-rated LMCA dataset",
    ],
  },
  {
    path: "/contribute",
    name: "closed reviewer intake",
    required: [
      "Research rating applications are closed.",
      "There is no assignment to claim.",
      "does not accept applications, ratings, calibration work, or payment details",
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
    audit_id: "metaphilosophy-pre-outreach-production-v2",
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
    console.log("Checks production availability, required public routes, closed intake, named authorship, and source-boundary claims. Passing does not authorize email or outreach.");
  } else {
    const report = await auditPreOutreachProduction(process.argv[2] ?? DEFAULT_ORIGIN);
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== "pass") process.exitCode = 1;
  }
}
