import { describe, expect, it } from "vitest";

import {
  analyticsBatchInputSchema,
  hashAnalyticsIdentifier,
  recordAnalyticsEvent,
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
    });

    expect(payload).toEqual({
      safe: "value",
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
          type: "page_view",
          path: "/rings?utm_source=test",
          consentMode: "measurement",
          utm: { source: "test" },
          payload: { title: "Rings" },
        },
      ],
    });

    expect(parsed.events).toHaveLength(1);
  });

  it("skips behavioral events without measurement consent before touching the database", async () => {
    await expect(
      recordAnalyticsEvent({
        type: "page_view",
        path: "/",
        consentMode: "essential",
      }),
    ).resolves.toEqual({
      status: "skipped",
      eventId: null,
      reason: "missing_consent",
    });
  });
});
