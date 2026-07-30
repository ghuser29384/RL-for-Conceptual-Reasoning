import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { analyzePublicPilotRatingSnapshots } from "./pilot-analysis-public-report.mjs";

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help") || process.argv.length < 3) {
    console.log("Usage: node scripts/run-pilot-rating-analysis.mjs <rating-dataset.json> [analysis-policy.json]");
    console.log("Outputs public-sanitized initial and latest-accepted snapshots.");
    console.log("Controlled item, rater, rating, and dataset identifiers are omitted.");
    console.log("Invalid or unapproved policy routes fail closed before analysis.");
  } else {
    const dataset = JSON.parse(await readFile(resolve(process.argv[2]), "utf8"));
    const policy = process.argv[3] ? JSON.parse(await readFile(resolve(process.argv[3]), "utf8")) : {};
    const report = analyzePublicPilotRatingSnapshots(dataset, { policy });
    console.log(JSON.stringify(report, null, 2));
  }
}
