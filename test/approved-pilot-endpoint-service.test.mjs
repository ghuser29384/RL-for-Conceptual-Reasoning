import assert from "node:assert/strict";
import test from "node:test";

import { ApprovedPilotEndpointWorkflowService } from "../src/approved-pilot-endpoint-service.mjs";
import { PilotEndpointServiceError } from "../src/pilot-endpoint-service.mjs";

class MemoryEventStore {
  constructor(events = []) {
    this.events = structuredClone(events);
  }

  async initialize() {}

  async verifyChain() {
    return { ok: true, events: this.events.length, headHash: "0".repeat(64) };
  }

  async loadEvents() {
    return structuredClone(this.events);
  }

  async append(event) {
    const stored = {
      sequence: this.events.length + 1,
      eventId: `EVENT_${this.events.length + 1}`,
      type: event.type,
      aggregateId: event.aggregateId,
      actorId: event.actorId,
      payload: structuredClone(event.payload),
      createdAt: event.createdAt,
    };
    this.events.push(stored);
    return stored;
  }
}

test("blocks the first pilot rating until the D1 selection manifest is frozen", async () => {
  const store = new MemoryEventStore();
  const service = new ApprovedPilotEndpointWorkflowService({
    store,
    now: () => new Date("2026-08-16T12:00:00.000Z"),
  });
  await service.registerAssignmentPacket({
    actorId: "SIM_OPERATOR",
    packet: {
      packetId: "SIM_PACKET",
      raterId: "SIM_RATER",
      positionId: "SIM_POSITION",
      critiqueIds: ["SIM_C1", "SIM_C2", "SIM_C3", "SIM_C4"],
    },
  });
  await service.lockPositionConclusion({
    actorId: "SIM_RATER",
    raterId: "SIM_RATER",
    positionId: "SIM_POSITION",
    summary: "The synthetic position advances one bounded conclusion for the timing-gate test.",
  });

  await assert.rejects(
    service.lockInitialRating({ actorId: "SIM_RATER", payload: {} }),
    (error) => error instanceof PilotEndpointServiceError && error.code === "self_check_selection_required_before_rating",
  );
});

test("blocks late D1 selection registration when any rating event already exists", async () => {
  const store = new MemoryEventStore([
    {
      type: "pilot_endpoint.initial_rating.locked",
      payload: {
        ratingId: "SIM_PREEXISTING_RATING",
        raterId: "SIM_RATER",
        positionId: "SIM_POSITION",
        critiqueId: "SIM_C1",
        stage: "initial",
      },
    },
  ]);
  const service = new ApprovedPilotEndpointWorkflowService({ store });

  await assert.rejects(
    service.registerSelfCheckSelection({ actorId: "SIM_OPERATOR", selectionReport: {} }),
    (error) => error instanceof PilotEndpointServiceError
      && error.code === "self_check_selection_too_late"
      && error.details.lockedRatingCount === 1,
  );
});
