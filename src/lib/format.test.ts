import { describe, expect, it } from "vitest";

import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats whole-shekel amounts for Hebrew commerce UI", () => {
    const formatted = formatPrice(1290);

    expect(formatted).toContain("1,290");
    expect(formatted).toContain("\u20aa");
    expect(formatted).not.toContain(".00");
  });
});
