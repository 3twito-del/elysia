import { describe, expect, it } from "vitest";

import {
  analyticsReplayChunkInputSchema,
  containsUnmaskedSensitiveData,
  maskReplayEvents,
} from "./analytics-replay";

describe("analytics replay service", () => {
  it("validates bounded replay chunks", () => {
    const parsed = analyticsReplayChunkInputSchema.parse({
      sessionKey: "session-key-123",
      visitorKey: "visitor-key-123",
      sequence: 1,
      startedAt: new Date("2026-06-23T10:00:00.000Z"),
      endedAt: new Date("2026-06-23T10:00:05.000Z"),
      path: "/product/ring",
      masked: true,
      checksum: "client-unavailable",
      events: [{ type: 2, data: { source: 0 } }],
    });

    expect(parsed.events).toHaveLength(1);
    expect(parsed.masked).toBe(true);
  });

  it("detects unmasked sensitive replay strings", () => {
    expect(
      containsUnmaskedSensitiveData({
        type: 3,
        data: { textContent: "customer@example.com" },
      }),
    ).toBe(true);
  });

  it("masks sensitive route text before storage", () => {
    expect(
      maskReplayEvents([{ data: { textContent: "Private account content" } }], {
        forceMaskText: true,
      }),
    ).toEqual([{ data: { textContent: "[masked]" } }]);
  });
});
