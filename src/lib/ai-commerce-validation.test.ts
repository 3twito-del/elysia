import { describe, expect, it } from "vitest";

import { recommendGiftInputSchema } from "./ai-commerce-validation";
import { getZodFieldErrors } from "./form-validation";

describe("AI commerce validation", () => {
  it("accepts a valid gift recommendation input", () => {
    const parsed = recommendGiftInputSchema.parse({
      relation: "אמא",
      occasion: "יום הולדת",
      budget: 700,
      style: ["עדין", "יומיומי"],
    });

    expect(parsed.budget).toBe(700);
    expect(parsed.style).toEqual(["עדין", "יומיומי"]);
  });

  it("rejects missing context and non-positive budgets", () => {
    const parsed = recommendGiftInputSchema.safeParse({
      relation: "",
      occasion: "",
      budget: 0,
      style: [],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(getZodFieldErrors(parsed.error)).toMatchObject({
        budget: "יש להזין מחיר גדול מאפס.",
        occasion: "יש להזין אירוע.",
        relation: "יש להזין למי המתנה.",
      });
    }
  });
});
