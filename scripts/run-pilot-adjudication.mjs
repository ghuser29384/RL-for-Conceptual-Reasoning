import { chmod, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";

import {
  generatePilotAdjudicationCases,
  PilotAdjudicationError,
} from "./pilot-adjudication.mjs";
import { sanitizePilotAdjudicationCaseSummary } from "./pilot-adjudication-public.mjs";

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help") || process.argv.length < 5) {
    console.log(
      "Usage: node scripts/run-pilot-adjudication.mjs <rating-dataset.json> <analysis-policy.json> <adjudication-control.json> [--controlled-output <private-path>]",
    );
    console.log(
      "Simulation prints only a privacy-safe aggregate case summary. Controlled case generation writes the full private case set outside the repository with mode 0600.",
    );
    console.log(
      "Case generation never authorizes distribution, adjudication work, rerating, payment, funding submission, or Phase 2.",
    );
  } else {
    const root = resolve(import.meta.dirname, "..");
    const [dataset, policy, control] = await Promise.all([
      readJson(resolve(process.argv[2])),
      readJson(resolve(process.argv[3])),
      readJson(resolve(process.argv[4])),
    ]);
    const flagIndex = process.argv.indexOf("--controlled-output");
    const outputPath = flagIndex >= 0 ? process.argv[flagIndex + 1] : null;
    const caseSet = generatePilotAdjudicationCases(dataset, policy, control);

    if (caseSet.mode === "controlled_case_generation") {
      if (!outputPath) {
        throw new PilotAdjudicationError(
          "Controlled case generation requires --controlled-output.",
        );
      }
      const resolvedOutput = resolve(outputPath);
      if (pathInside(root, resolvedOutput)) {
        throw new PilotAdjudicationError(
          "Controlled adjudication case output must be outside the repository.",
        );
      }
      await writeFile(resolvedOutput, `${JSON.stringify(caseSet, null, 2)}\n`, {
        mode: 0o600,
      });
      await chmod(resolvedOutput, 0o600);
    } else if (outputPath) {
      throw new PilotAdjudicationError(
        "Simulation mode does not write controlled adjudication case files.",
      );
    }

    console.log(
      JSON.stringify(sanitizePilotAdjudicationCaseSummary(caseSet), null, 2),
    );
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function pathInside(root, candidate) {
  const normalizedRoot = resolve(root);
  const normalizedCandidate = resolve(candidate);
  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}${sep}`)
  );
}
