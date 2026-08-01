import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, cp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { verifyQ006aApprovedTransition } from "../scripts/verify-q006a-approved-transition.mjs";

const root = resolve(import.meta.dirname, "..");

test("records Q-006A approval while keeping every send and execution gate closed", async () => {
  const report = await verifyQ006aApprovedTransition(root);
  assert.deepEqual(report, {
    status: "pass",
    historical_ledger_retained: true,
    effective_ledger_id: "metaphilosophy-pilot-readiness-v2-2026-08-01",
    q006a_status: "approved",
    r01_status: "passed",
    blocked_remaining_gates: 5,
    preparation_authorizations_true: 4,
    execution_authorizations_false: 18,
    adviser_candidates: 4,
    outreach_authorized: false,
    pilot_ready_to_start: false,
    phase_2_authorized: false,
  });
});

test("fails if outreach or downstream execution is silently authorized", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "metaphilosophy-q006a-"));
  await mkdir(resolve(tempRoot, "ops/next-steps-2026-07-23"), { recursive: true });
  await cp(resolve(root, "ops/next-steps-2026-07-23"), resolve(tempRoot, "ops/next-steps-2026-07-23"), {
    recursive: true,
  });
  const path = resolve(tempRoot, "ops/next-steps-2026-07-23/pilot-readiness-ledger-v2.json");
  const ledger = JSON.parse(await readFile(path, "utf8"));
  ledger.authorization_state.methodological_adviser_outreach_authorized = true;
  ledger.authorization_state.phase_2_activation_authorized = true;
  await writeFile(path, `${JSON.stringify(ledger, null, 2)}\n`);
  await assert.rejects(
    verifyQ006aApprovedTransition(tempRoot),
    (error) =>
      error instanceof assert.AssertionError &&
      /methodological_adviser_outreach_authorized|phase_2_activation_authorized/.test(error.message),
  );
});

test("fails if R-02 or a later gate is passed without evidence", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "metaphilosophy-q006a-gate-"));
  await mkdir(resolve(tempRoot, "ops/next-steps-2026-07-23"), { recursive: true });
  await cp(resolve(root, "ops/next-steps-2026-07-23"), resolve(tempRoot, "ops/next-steps-2026-07-23"), {
    recursive: true,
  });
  const path = resolve(tempRoot, "ops/next-steps-2026-07-23/pilot-readiness-ledger-v2.json");
  const ledger = JSON.parse(await readFile(path, "utf8"));
  ledger.readiness_gates.find((gate) => gate.id === "R-02").status = "passed";
  await writeFile(path, `${JSON.stringify(ledger, null, 2)}\n`);
  await assert.rejects(
    verifyQ006aApprovedTransition(tempRoot),
    (error) => error instanceof assert.AssertionError && /R-02 must remain blocked/.test(error.message),
  );
});
