import { describe, expect, it } from "vitest";

import {
  analyticsBatchInputSchema,
  hashAnalyticsIdentifier,
  redactAnalyticsPayload,
} from "./analytics";

describe("analytics service", () => {
  it("redacts sensitive payload keys recursively", () => {
    const payload = redactAnalyticsPayload({
      safe: "value",
      email: "customer@example.com",
      nested: {
        phone: "0500000000",
        query: "rings",
        token: "secret",
      },
      freeText: "contact me at customer@example.com",
    });

    expect(payload).toEqual({
      safe: "value",
      freeText: "[redacted]",
      nested: {
        query: "rings",
      },
    });
  });

  it("hashes identifiers deterministically and case-insensitively", () => {
    expect(hashAnalyticsIdentifier(" Session-Key ")).toBe(
      hashAnalyticsIdentifier("session-key"),
    );
    expect(hashAnalyticsIdentifier("session-key")).toHaveLength(64);
  });

  it("accepts a bounded analytics batch schema", () => {
    const parsed = analyticsBatchInputSchema.parse({
      events: [
        {
          type: "route_change",
          path: "/rings?utm_source=test",
          visitorKey: "visitor-key-123",
          sessionKey: "session-key-123",
          source: "client",
          sequence: 1,
          url: "https://elysia.local/rings?utm_source=test",
          title: "Rings",
          consentMode: "essential",
          utm: { source: "test" },
          viewport: { width: 1440, height: 900, devicePixelRatio: 1 },
          attribution: { source: "test", medium: "cpc" },
          payload: { scrollDepth: 50 },
        },
      ],
    });

    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0]?.source).toBe("client");
  });
});
