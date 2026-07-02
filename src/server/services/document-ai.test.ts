import { describe, expect, it } from "vitest";

import { extractionToLinesText } from "./document-ai";

describe("extractionToLinesText", () => {
  it("formats lines as 'description | quantity | unitCost'", () => {
    expect(
      extractionToLinesText([
        { description: "ייעוץ", quantity: 2, unitCost: 500 },
        { description: "רישוי", quantity: 1, unitCost: 1200 },
      ]),
    ).toBe("ייעוץ | 2 | 500\nרישוי | 1 | 1200");
  });

  it("is empty for no lines", () => {
    expect(extractionToLinesText([])).toBe("");
  });
});
