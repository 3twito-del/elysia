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
  });

  it("returns 400 for a structurally invalid chat request", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: "not-an-array" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
