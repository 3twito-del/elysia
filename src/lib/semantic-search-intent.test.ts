import { describe, expect, it } from "vitest";

import {
  productMatchesSemanticExclusions,
  resolveDeterministicSemanticSearchIntent,
} from "./semantic-search-intent";

const categories = [
  { slug: "rings", name: "טבעות" },
  { slug: "earrings", name: "עגילים" },
  { slug: "necklaces", name: "שרשראות" },
  { slug: "sets", name: "סטים" },
];
const facets = {
  materials: ["זהב צהוב 14K", "זהב לבן 14K", "כסף סטרלינג 925"],
  stones: ["פנינה", "יהלום"],
};

const englishOptions = {
  categories: [
    { slug: "rings", name: "Rings" },
    { slug: "necklaces", name: "Necklaces" },
  ],
  facets: {
    materials: ["yellow gold", "white gold", "sterling silver"],
    stones: ["diamond", "pearl"],
  },
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
    expect(intent.hardFilters.stone).toBeUndefined();
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

  it("treats legacy gift wording as ordinary recipient context", () => {
    const intent = resolveDeterministicSemanticSearchIntent(
      {
        query: "מתנה לאמא עד 700",
      },
      { categories, facets },
    );

    expect(intent.hardFilters.maxPrice).toBe(700);
    expect(intent.recipient).toBe("אמא");
    expect(intent.softSignals).toContain("mother");
    expect(intent.softSignals).not.toContain("gift");
  });

  it("extracts English jewelry category material stone and price filters", () => {
    const intent = resolveDeterministicSemanticSearchIntent(
      {
        query: "white gold rings with diamond under 1500",
      },
      englishOptions,
    );

    expect(intent.hardFilters).toMatchObject({
      category: "rings",
      material: "white gold",
      maxPrice: 1500,
      stone: "diamond",
    });
    expect(intent.lexicalQuery).not.toContain("1500");
  });

  it("preserves mixed-script exclusions without losing relevant hard filters", () => {
    const intent = resolveDeterministicSemanticSearchIntent(
      {
        query: "rings עד 1500 diamond בלי pearl",
      },
      englishOptions,
    );

    expect(intent.hardFilters).toMatchObject({
      category: "rings",
      maxPrice: 1500,
      stone: "diamond",
    });
    expect(intent.hardFilters.material).toBeUndefined();
    expect(intent.excludedTerms).toContain("pearl");
    expect(
      productMatchesSemanticExclusions(
        {
          categorySlug: "rings",
          material: "white gold",
          name: "Diamond ring",
          stone: "diamond",
        },
        intent.excludedTerms,
      ),
    ).toBe(true);
  });

  it("keeps explicit hard filters when mixed-language query text is broader", () => {
    const intent = resolveDeterministicSemanticSearchIntent(
      {
        category: "rings",
        material: "white gold",
        query: "necklace gift without gold under 1000",
        stone: "diamond",
      },
      englishOptions,
    );

    expect(intent.hardFilters).toMatchObject({
      category: "rings",
      material: "white gold",
      maxPrice: 1000,
      stone: "diamond",
    });
    expect(intent.softSignals).not.toContain("gift");
  });

  it("does not add a gift signal to legacy set wording", () => {
    const intent = resolveDeterministicSemanticSearchIntent(
      {
        query: "סט תכשיטים למתנה",
      },
      { categories, facets },
    );

    expect(intent.hardFilters.category).toBe("sets");
    expect(intent.softSignals).not.toContain("gift");
  });
});
