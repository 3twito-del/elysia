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

  it("accepts a realistic full-snapshot chunk with a large inlined stylesheet and long childNodes", () => {
    const inlinedStylesheet = `body{color:#111}`.repeat(2_000); // ~30 KB single string
    const longChildNodes = Array.from({ length: 5_000 }, (_, index) => ({
      type: 3,
      id: index,
      textContent: "•",
    }));

    expect(() =>
      analyticsReplayChunkInputSchema.parse({
        sessionKey: "session-key-123",
        sequence: 0,
        startedAt: new Date("2026-06-23T10:00:00.000Z"),
        endedAt: new Date("2026-06-23T10:00:05.000Z"),
        path: "/",
        checksum: "client-unavailable",
        events: [
          {
            type: 2,
            data: {
              node: {
                type: 1,
                childNodes: [
                  { type: 2, tagName: "style", textContent: inlinedStylesheet },
                  { type: 1, tagName: "ul", childNodes: longChildNodes },
                ],
              },
            },
          },
        ],
      }),
    ).not.toThrow();
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
