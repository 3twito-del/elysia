import { describe, expect, it } from "vitest";

import {
  createAiMatchReason,
  createCatalogSearchPlan,
  resolveAiCatalogSearchIntent,
} from "./ai-catalog-intent";

describe("AI catalog intent", () => {
  it("locks earring searches to the earrings category", () => {
    const intent = resolveAiCatalogSearchIntent({
      query: "עגילים לכלה שלא נראים כבדים",
    });

    expect(intent.category).toBe("earrings");
    expect(intent.categoryLocked).toBe(true);
    expect(intent.fallbackAllowed).toBe(false);
    expect(createCatalogSearchPlan(intent)).not.toContainEqual({});
  });

  it("extracts gift budgets from natural language", () => {
    const intent = resolveAiCatalogSearchIntent({
      query: "מתנה עד 900 שח בסגנון עדין",
    });

    expect(intent.maxPrice).toBe(900);
    expect(intent.category).toBeUndefined();
    expect(intent.fallbackAllowed).toBe(true);
  });

  it("detects white gold material without requiring a category", () => {
    const intent = resolveAiCatalogSearchIntent({
      query: "זהב לבן ליום יום",
    });

    expect(intent.material).toBe("זהב לבן 14K");
    expect(intent.query).toContain("זהב לבן");
  });

  it("keeps broad fallback available when no category is detected", () => {
    const intent = resolveAiCatalogSearchIntent({
      query: "משהו עדין לערב",
    });

    expect(intent.categoryLocked).toBe(false);
    expect(createCatalogSearchPlan(intent).at(-1)).toEqual({});
  });

  it("creates a readable match reason for product cards", () => {
    const intent = resolveAiCatalogSearchIntent({
      query: "עגילים לכלה שלא נראים כבדים עד 900 שח",
    });

    expect(
      createAiMatchReason(
        {
          categorySlug: "earrings",
          material: "זהב צהוב 14K",
          price: 690,
        },
        intent,
      ),
    ).toContain("סוג הפריט תואם לבקשה");
  });
});
