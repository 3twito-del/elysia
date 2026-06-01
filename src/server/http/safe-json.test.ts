import { describe, expect, it } from "vitest";

import {
  getSafeJsonFailureContract,
  readSafeJson,
  readSafeText,
} from "./safe-json";

describe("readSafeJson", () => {
  it("rejects empty bodies without throwing", async () => {
    await expect(
      readSafeJson(new Request("http://localhost")),
    ).resolves.toEqual({
      ok: false,
      error: "empty",
    });
  });

  it("rejects malformed JSON without throwing", async () => {
    await expect(
      readSafeJson(
        new Request("http://localhost", {
          method: "POST",
          body: "{not-json",
        }),
      ),
    ).resolves.toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("returns parsed JSON as unknown data", async () => {
    await expect(
      readSafeJson(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({ value: 1 }),
        }),
      ),
    ).resolves.toEqual({
      ok: true,
      data: { value: 1 },
    });
  });

  it("parses Date-shaped strings and nested unknown values without coercion", async () => {
    await expect(
      readSafeJson(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({
            createdAt: new Date("2026-06-01T00:00:00.000Z"),
            nested: { values: [1, null, false] },
            omitted: undefined,
          }),
        }),
      ),
    ).resolves.toEqual({
      ok: true,
      data: {
        createdAt: "2026-06-01T00:00:00.000Z",
        nested: { values: [1, null, false] },
      },
    });
  });

  it("rejects unsupported BigInt and undefined JSON tokens as invalid bodies", async () => {
    await expect(
      readSafeJson(
        new Request("http://localhost", {
          method: "POST",
          body: '{"id": 1n}',
        }),
      ),
    ).resolves.toEqual({
      ok: false,
      error: "invalid",
    });
    await expect(
      readSafeJson(
        new Request("http://localhost", {
          method: "POST",
          body: '{"value": undefined}',
        }),
      ),
    ).resolves.toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("rejects bodies that exceed the configured byte limit", async () => {
    await expect(
      readSafeJson(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({ value: "too-large" }),
        }),
        { maxBytes: 8 },
      ),
    ).resolves.toEqual({
      ok: false,
      error: "too-large",
    });
  });
});

describe("readSafeText", () => {
  it("returns raw text within the configured byte limit", async () => {
    await expect(
      readSafeText(
        new Request("http://localhost", {
          method: "POST",
          body: "hello",
        }),
      ),
    ).resolves.toEqual({
      ok: true,
      text: "hello",
    });
  });
});

describe("getSafeJsonFailureContract", () => {
  it("maps empty and invalid bodies to the same redacted bad-request shape", () => {
    expect(getSafeJsonFailureContract("empty")).toEqual({
      status: 400,
      body: {
        ok: false,
        error: "Invalid request body.",
      },
    });
    expect(getSafeJsonFailureContract("invalid")).toEqual({
      status: 400,
      body: {
        ok: false,
        error: "Invalid request body.",
      },
    });
  });

  it("maps oversized bodies to a redacted payload-too-large shape", () => {
    expect(getSafeJsonFailureContract("too-large")).toEqual({
      status: 413,
      body: {
        ok: false,
        error: "Request body is too large.",
      },
    });
  });

  it("supports endpoint-specific safe copy without exposing parser internals", () => {
    expect(
      getSafeJsonFailureContract("invalid", {
        invalid: "Chat request body is invalid.",
      }),
    ).toEqual({
      status: 400,
      body: {
        ok: false,
        error: "Chat request body is invalid.",
      },
    });
  });
});
