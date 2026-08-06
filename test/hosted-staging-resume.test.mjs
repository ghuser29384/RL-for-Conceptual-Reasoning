import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { FileEventStore, RemoteEventStore } from "../src/staging-event-store.mjs";
import { StagingWorkflowService } from "../src/staging-service.mjs";

test("RemoteEventStore retries a bounded transient OIDC verification rejection", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls < 3) {
      return new Response(JSON.stringify({ ok: false, error: { code: "oidc_token_rejected", message: "temporary verifier failure" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({
      ok: true,
      data: {
        chain: { ok: true, events: 0, headHash: "0".repeat(64) },
        metadata: { purpose: "synthetic_rehearsal_only" },
        researchRatingsAuthorized: false,
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const store = new RemoteEventStore({ gatewayUrl: "https://example.invalid/ledger", oidcToken: "synthetic-oidc" });
    const chain = await store.initialize();
    assert.equal(chain.events, 0);
    assert.equal(calls, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("explicit append-only acceptance bootstrap can preserve an earlier synthetic operator", async () => {
  const directory = await mkdtemp(join(tmpdir(), "metaphilosophy-resume-test-"));
  const store = new FileEventStore({ filePath: join(directory, "events.jsonl") });
  const service = new StagingWorkflowService({ store, now: () => new Date("2026-08-06T14:00:00.000Z") });
  await service.initialize();
  await service.bootstrap({ bootstrapToken: "first", expectedBootstrapToken: "first" });
  await assert.rejects(
    () => service.bootstrap({ bootstrapToken: "blocked", expectedBootstrapToken: "blocked" }),
    (error) => error.status === 409 && error.code === "bootstrap_already_completed",
  );
  const runId = "append-only-resume";
  await service.bootstrap({
    bootstrapToken: "second",
    expectedBootstrapToken: "second",
    allowExistingOperator: true,
    fixture: {
      position: { id: `${runId}-position`, version: "1", title: "Synthetic resume fixture", text: "A synthetic position used only to verify append-only acceptance recovery.", context: "No research use." },
      critiques: [1, 2, 3, 4].map((number) => ({ id: `${runId}-critique-${number}`, version: "1", text: `Synthetic critique ${number} for append-only recovery verification.` })),
    },
  });
  const state = await service.state();
  assert.equal(state.identities.filter((identity) => identity.role === "operator").length, 2);
  assert.equal(state.positions.length, 2);
  assert.equal(state.critiques.length, 8);
  assert.equal((await store.verifyChain()).ok, true);
});
