import { describe, expect, it } from "vitest";

import {
  badRequestJson,
  forbiddenJson,
  notFoundJson,
  okJson,
  rateLimitedJson,
  serviceUnavailableJson,
  unauthorizedJson,
} from "./api-response";

describe("api response helpers", () => {
  it("preserves successful JSON payloads", async () => {
    const response = okJson({ ok: true, value: 1 });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, value: 1 });
  });

  it("standardizes error JSON payloads", async () => {
    const badRequest = badRequestJson("Bad input.");
    const forbidden = forbiddenJson("Forbidden.");
    const notFound = notFoundJson("Missing.");
    const serviceUnavailable = serviceUnavailableJson("Down.");
    const unauthorized = unauthorizedJson("No session.");

    expect(badRequest.status).toBe(400);
    await expect(badRequest.json()).resolves.toEqual({
      ok: false,
      error: "Bad input.",
    });
    expect(unauthorized.status).toBe(401);
    expect(forbidden.status).toBe(403);
    expect(notFound.status).toBe(404);
    expect(serviceUnavailable.status).toBe(503);
  });

  it("adds retry headers to rate-limit responses", () => {
    const response = rateLimitedJson(
      { retryAfterSeconds: 12 } as Parameters<typeof rateLimitedJson>[0],
      "Too many analytics events.",
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("12");
  });

  it("standardizes rate-limit JSON payloads", async () => {
    const response = rateLimitedJson(
      { retryAfterSeconds: 12 } as Parameters<typeof rateLimitedJson>[0],
      "Too many analytics events.",
    );

    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Too many analytics events.",
    });
  });
});
