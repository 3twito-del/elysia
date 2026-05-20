import { describe, expect, it } from "vitest";

import {
  productMatchesSemanticExclusions,
  resolveDeterministicSemanticSearchIntent,
} from "./semantic-search-intent";

const categories = [
  { slug: "rings", name: "טבעות" },
  { slug: "earrings", name: "עגילים" },
  { slug: "necklaces", name: "שרשראות" },
];
const facets = {
  materials: ["זהב צהוב 14K", "זהב לבן 14K", "כסף סטרלינג 925"],
  stones: ["פנינה", "יהלום"],
};

describe("semantic search intent", () => {
  it("extracts hard filters and soft signals from bridal budget searches", () => {
    const intent = resolveDeterministicSemanticSearchIntent(
      {
        query: "עגילים קלים לכלה עד 700",
      },
      { categories, facets },
    );

    expect(intent.hardFilters).toMatchObject({
      category: "earrings",
      maxPrice: 700,
    });
    expect(intent.softSignals).toEqual(
      expect.arrayContaining(["bridal", "delicate"]),
    );
    expect(intent.lexicalQuery).not.toContain("700");
    expect(intent.confidence).toBe("high");
  });

  it("tracks explicit exclusions without turning them into required facets", () => {
    const intent = resolveDeterministicSemanticSearchIntent(
      {
        query: "טבעת זהב בלי פנינה",
      },
      { categories, facets },
    );

    expect(intent.hardFilters.category).toBe("rings");
    expect(intent.hardFilters.material).toBeUndefined();
    expect(intent.excludedTerms).toContain("פנינה");
    expect(
      productMatchesSemanticExclusions(
        {
          name: "טבעת עדינה",
          stone: "פנינה",
        },
        intent.excludedTerms,
      ),
    ).toBe(false);
  });

  it("keeps gift and recipient meaning for broad gift searches", () => {
    const intent = resolveDeterministicSemanticSearchIntent(
      {
        query: "מתנה לאמא עד 700",
      },
      { categories, facets },
    );

    expect(intent.hardFilters.maxPrice).toBe(700);
    expect(intent.recipient).toBe("אמא");
    expect(intent.softSignals).toEqual(
      expect.arrayContaining(["gift", "mother"]),
    );
  });
});
