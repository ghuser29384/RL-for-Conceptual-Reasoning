import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { verifyPilotAdjudicationIntegration } from "./verify-pilot-adjudication-integration.mjs";

export async function validatePilotAdjudicationContract() {
  return verifyPilotAdjudicationIntegration();
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await validatePilotAdjudicationContract();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
