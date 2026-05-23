import { describe, expect, it } from "vitest";

import { assertInternalPushTargetUrl } from "./push";

describe("push target URL guard", () => {
  it("normalizes same-origin relative URLs", () => {
    expect(assertInternalPushTargetUrl("/search?q=rings")).toBe(
      "/search?q=rings",
    );
  });

  it("rejects external campaign URLs", () => {
    expect(() =>
      assertInternalPushTargetUrl("https://example.invalid/phishing"),
    ).toThrow("Push target URL is invalid.");
  });
});
