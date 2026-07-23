import { describe, expect, it } from "vitest";

import {
  ELYS_AI_STEPS,
  buildConciergePrompt,
  createEmptyConciergePreferences,
  toggleJewelryType,
} from "~/app/elys-ai/_lib/concierge";

describe("elys-ai concierge", () => {
  it("defines the five optional guided steps", () => {
    expect(ELYS_AI_STEPS.map((step) => step.id)).toEqual([
      "jewelry",
      "occasion",
      "style",
      "budget",
      "size",
    ]);
  });

  it("supports selecting more than one jewelry category", () => {
    const initial = createEmptyConciergePreferences();
    const withRing = toggleJewelryType(initial, "rings");
    const withBoth = toggleJewelryType(withRing, "earrings");

    expect(withBoth.jewelryTypes).toEqual(["rings", "earrings"]);
    expect(toggleJewelryType(withBoth, "rings").jewelryTypes).toEqual([
      "earrings",
    ]);
  });

  it("builds a combination request whose budget is explicitly total", () => {
    const prompt = buildConciergePrompt({
      jewelryTypes: ["rings", "necklaces"],
      combination: true,
      occasion: "special-event",
      style: "delicate",
      budget: 1_500,
      size: "needs-help",
    });

    expect(prompt).toContain("בני לי שילוב");
    expect(prompt).toContain("טבעות ושרשראות");
    expect(prompt).toContain("תקציב כולל לכל הפריטים: עד 1,500 ₪");
    expect(prompt).toContain("אני צריכה עזרה בבחירת מידה");
    expect(prompt).not.toContain("sets");
  });
});
