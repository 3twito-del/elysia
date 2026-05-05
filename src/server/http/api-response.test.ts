import { describe, expect, it } from "vitest";

import {
  badRequestJson,
  notFoundJson,
  okJson,
  rateLimitedJson,
} from "./api-response";

describe("api response helpers", () => {
  it("preserves successful JSON payloads", async () => {
    const response = okJson({ ok: true, value: 1 });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, value: 1 });
  });

  it("standardizes error JSON payloads", async () => {
    const badRequest = badRequestJson("Bad input.");
    const notFound = notFoundJson("Missing.");

    expect(badRequest.status).toBe(400);
    await expect(badRequest.json()).resolves.toEqual({
      ok: false,
      error: "Bad input.",
    });
    expect(notFound.status).toBe(404);
  });

  it("adds retry headers to rate-limit responses", () => {
    const response = rateLimitedJson(
      { retryAfterSeconds: 12 } as Parameters<typeof rateLimitedJson>[0],
      "Too many analytics events.",
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("12");
  });
});
