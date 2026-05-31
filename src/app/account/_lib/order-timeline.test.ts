import { describe, expect, it } from "vitest";

import {
  createAccountOrderTimeline,
  getCurrentOrderTimelineEvent,
} from "./order-timeline";

describe("account order timeline", () => {
  it("marks the next local order step as current", () => {
    const timeline = createAccountOrderTimeline({
      createdAt: new Date("2026-05-01T10:00:00Z"),
      paidAt: new Date("2026-05-01T10:05:00Z"),
      status: "PAID",
    });

    expect(timeline.map((event) => event.id)).toEqual([
      "created",
      "paid",
      "preparing",
      "handoff",
      "completed",
    ]);
    expect(getCurrentOrderTimelineEvent(timeline)?.id).toBe("preparing");
    expect(timeline.find((event) => event.id === "paid")?.state).toBe("done");
  });

  it("uses a terminal cancelled timeline without adding fulfillment steps", () => {
    const timeline = createAccountOrderTimeline({
      cancelledAt: new Date("2026-05-02T10:00:00Z"),
      createdAt: new Date("2026-05-01T10:00:00Z"),
      status: "CANCELLED",
    });

    expect(timeline.map((event) => event.id)).toEqual(["created", "cancelled"]);
    expect(getCurrentOrderTimelineEvent(timeline)?.id).toBe("cancelled");
  });

  it("falls back to the latest done event when no current event exists", () => {
    const timeline = createAccountOrderTimeline({
      completedAt: new Date("2026-05-04T10:00:00Z"),
      createdAt: new Date("2026-05-01T10:00:00Z"),
      paidAt: new Date("2026-05-01T10:05:00Z"),
      preparingAt: new Date("2026-05-02T10:00:00Z"),
      shippedAt: new Date("2026-05-03T10:00:00Z"),
      status: "COMPLETED",
    });

    expect(getCurrentOrderTimelineEvent(timeline)?.id).toBe("completed");
    expect(timeline.every((event) => event.state === "done")).toBe(true);
  });
});
