import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { FileEventStore, verifyEventChain } from "../src/staging-event-store.mjs";

test("event hashes survive recursive JSON object-key reordering without tolerating content changes", async () => {
  const root = await mkdtemp(join(tmpdir(), "metaphilosophy-canonical-hash-"));
  const store = new FileEventStore({ filePath: join(root, "events.jsonl") });
  await store.initialize();
  await store.append({
    eventId: "00000000-0000-4000-8000-000000000001",
    type: "canonicalization.test",
    payload: {
      zeta: 1,
      alpha: {
        delta: 4,
        beta: 2,
      },
      list: [{ z: 3, a: 1 }, { y: 2, b: 0 }],
    },
    createdAt: "2026-08-06T00:00:00.000Z",
  });

  const [event] = await store.loadEvents();
  const reordered = {
    ...event,
    payload: {
      alpha: { beta: 2, delta: 4 },
      list: [{ a: 1, z: 3 }, { b: 0, y: 2 }],
      zeta: 1,
    },
  };

  assert.equal(verifyEventChain([reordered]), true);
  assert.throws(
    () => verifyEventChain([{ ...reordered, payload: { ...reordered.payload, zeta: 2 } }]),
    /Event hash mismatch at sequence 1/u,
  );
});
