import { beforeEach, describe, expect, it } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

import { POST } from "./route";

describe("chat route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
  });

  it("returns 400 for an empty body", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: "",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid request body.",
    });
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: "{not-json",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid request body.",
    });
  });

  it("returns 400 for a structurally invalid chat request", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: "not-an-array" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid request body.",
    });
  });

  it("returns a standardized rate-limit response", async () => {
    let response: Response | null = null;

    for (let index = 0; index < 31; index += 1) {
      response = await POST(
        new Request("http://localhost/api/chat", {
          method: "POST",
          body: "",
        }),
      );
    }

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBeTruthy();
    await expect(response?.json()).resolves.toEqual({
      ok: false,
      error: "Too many chat requests.",
    });
  });
});
