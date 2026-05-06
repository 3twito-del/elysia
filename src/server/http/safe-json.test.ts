import { describe, expect, it } from "vitest";

import { readSafeJson } from "./safe-json";

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
});
