import { describe, expect, it } from "vitest";

import { createAiFallbackServiceHref, getAiFallbackCopy } from "./ai-fallback";

describe("AI fallback recovery copy", () => {
  it("maps quota and rate-limit failures to a quota recovery state", () => {
    expect(getAiFallbackCopy("429 quota exhausted").kind).toBe("quota");
    expect(getAiFallbackCopy("too many chat requests").kind).toBe("quota");
  });

  it("maps missing provider readiness to an unavailable recovery state", () => {
    expect(getAiFallbackCopy("Missing GOOGLE_GENERATIVE_AI_API_KEY").kind).toBe(
      "unavailable",
    );
    expect(getAiFallbackCopy("provider gateway unavailable").kind).toBe(
      "unavailable",
    );
  });

  it("keeps unknown failures generic and service-routable", () => {
    expect(getAiFallbackCopy("database failed").kind).toBe("unknown");
    expect(createAiFallbackServiceHref("database failed")).toContain(
      "/service?topic=general&message=",
    );
  });
});
