import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const authMock = vi.hoisted(() => vi.fn().mockResolvedValue(null));

vi.mock("~/env", () => ({
  env: {
    AI_CHAT_MODEL: "google:gemini-2.5-flash-lite",
    AI_GATEWAY_API_KEY: undefined,
    GOOGLE_GENERATIVE_AI_API_KEY: undefined,
    VERCEL_OIDC_TOKEN: undefined,
  },
}));

vi.mock("~/server/auth", () => ({
  auth: authMock,
}));

import { POST } from "./route";

describe("chat route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();
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

  it("returns 400 for an empty message array", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid request body.",
    });
  });

  it("returns 400 when no user text message is present", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              id: "message_1",
              role: "assistant",
              parts: [{ type: "text", text: "hello" }],
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(authMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "A text message from the user is required.",
    });
  });

  it("returns 400 when the latest user message is too long", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              id: "message_1",
              role: "user",
              parts: [{ type: "text", text: "x".repeat(2_001) }],
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(authMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "The latest user message is too long.",
    });
  });

  it("returns 400 when too many messages are submitted", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: Array.from({ length: 25 }, (_, index) => ({
            id: `message_${index}`,
            role: "user",
            parts: [{ type: "text", text: "hello" }],
          })),
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid request body.",
    });
  });

  it("returns 503 for a configured Google model without an API key", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              id: "message_1",
              role: "user",
              parts: [{ type: "text", text: "hello" }],
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(503);
    expect(authMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error:
        "Missing GOOGLE_GENERATIVE_AI_API_KEY for the configured Google chat model.",
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
