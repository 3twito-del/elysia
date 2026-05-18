import { describe, expect, it } from "vitest";

import { applyCatalogPlanningHints } from "~/server/ai/commerce-tools";
import {
  createTryOnSessionOutputSchema,
  orderSupportOutputSchema,
  saveStyleProfileOutputSchema,
  searchCatalogToolOutputSchema,
} from "~/server/ai/commerce-actions";

describe("AI commerce tools", () => {
  it("applies deterministic catalog hints as search defaults", () => {
    expect(
      applyCatalogPlanningHints(
        { query: "עדין" },
        {
          query: "עגילים לכלה עד 700 שח",
          category: "earrings",
          material: "זהב לבן 14K",
          maxPrice: 700,
        },
      ),
    ).toEqual({
      query: "עגילים לכלה עד 700 שח עדין",
      category: "earrings",
      material: "זהב לבן 14K",
      maxPrice: 700,
    });
  });

  it("keeps explicit model fields when no deterministic hint exists", () => {
    expect(
      applyCatalogPlanningHints({ stone: "יהלום" }, { query: "טבעת אירוסין" }),
    ).toEqual({
      query: "טבעת אירוסין",
      stone: "יהלום",
    });
  });

  it("validates structured tool outputs", () => {
    expect(() =>
      searchCatalogToolOutputSchema.parse([
        {
          slug: "venus-ring",
          url: "/product/venus-ring",
          name: "טבעת ונוס",
          price: 690,
          formattedPrice: "690 ₪",
          image: "https://example.com/ring.jpg",
          matchReason: "סוג הפריט תואם לבקשה",
          category: "טבעות",
          material: "זהב צהוב 14K",
          description: "טבעת עדינה",
          availableOnline: true,
        },
      ]),
    ).not.toThrow();

    expect(() =>
      saveStyleProfileOutputSchema.parse({
        saved: true,
        summary: "נשמר",
      }),
    ).not.toThrow();

    expect(() =>
      createTryOnSessionOutputSchema.parse({
        id: "tryon_123",
        status: "queued",
        provider: "internal-webar",
        message: "נוצר",
      }),
    ).not.toThrow();

    expect(() =>
      orderSupportOutputSchema.parse({
        found: false,
        summary: "לא נמצאה הזמנה",
        nextStep: "בדקו פרטים",
      }),
    ).not.toThrow();
  });
});
