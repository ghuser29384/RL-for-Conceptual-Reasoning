import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { PilotEndpointWorkflowService } from "../src/pilot-endpoint-service.mjs";
import { FileEventStore } from "../src/staging-event-store.mjs";

test("diagnostic: identify the exact endpoint event-store failure stage", async () => {
  const directory = await mkdtemp(join(tmpdir(), "endpoint-diagnostic-"));
  try {
    const store = new FileEventStore({ filePath: join(directory, "events.ndjson") });
    const service = new PilotEndpointWorkflowService({
      store,
      now: () => new Date("2026-08-16T10:00:00.000Z"),
    });
    try {
      await service.initialize();
    } catch (error) {
      throw new Error(`service.initialize failed:\n${error?.stack ?? error}`);
    }
    try {
      await service.registerAssignmentPacket({
        actorId: "SIM_OPERATOR",
        packet: {
          packetId: "SIM_PACKET_DIAGNOSTIC",
          raterId: "SIM_RATER_DIAGNOSTIC",
          positionId: "SIM_POSITION_DIAGNOSTIC",
          critiqueIds: ["SIM_C1", "SIM_C2", "SIM_C3", "SIM_C4"],
        },
      });
    } catch (error) {
      throw new Error(`registerAssignmentPacket failed:\n${error?.stack ?? error}`);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
