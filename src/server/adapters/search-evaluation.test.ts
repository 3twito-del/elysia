import { describe, expect, it } from "vitest";

import type { CatalogProduct } from "~/server/services/catalog-types";

import {
  evaluateLexicalRetrieval,
  type SearchEvaluationCase,
} from "./search-evaluation";

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    slug: "slug",
    sku: "SKU",
    requiresSeparateCheckout: false,
    name: "מוצר",
    categorySlug: "rings",
    categoryName: "טבעות",
    shortDescription: "",
    description: "",
    availabilityMode: "READY_TO_ORDER",
    commerceHighlights: [],
    price: 500,
    createdAt: "2026-01-01T00:00:00.000Z",
    popularityScore: 0,
    material: "כסף 925",
    collection: "studio-light",
    collections: ["studio-light"],
    image: "/media/x.avif",
    images: ["/media/x.avif"],
    variants: [],
    metalColors: [],
    sizes: [],
    tags: [],
    inventory: { central: 3 },
    ...overrides,
  };
}

// A small but representative Hebrew jewelry corpus with distinct vocabulary so
// exact single-term retrieval is unambiguous.
const corpus: CatalogProduct[] = [
  product({
    slug: "ring-gold-diamond",
    name: "טבעת יהלום זהב",
    categorySlug: "rings",
    categoryName: "טבעות",
    material: "זהב צהוב 14K",
    stone: "יהלום",
    price: 4200,
    tags: ["טבעת", "מתנה"],
  }),
  product({
    slug: "ring-silver",
    name: "טבעת כסף",
    categorySlug: "rings",
    categoryName: "טבעות",
    material: "כסף 925",
    price: 320,
    tags: ["טבעת"],
  }),
  product({
    slug: "necklace-gold-pearl",
    name: "שרשרת פנינה",
    categorySlug: "necklaces",
    categoryName: "שרשראות",
    material: "זהב צהוב 14K",
    stone: "פנינה",
    price: 890,
    tags: ["שרשרת", "מתנה"],
  }),
  product({
    slug: "earrings-silver-topaz",
    name: "עגילי כסף טופז",
    categorySlug: "earrings",
    categoryName: "עגילים",
    material: "כסף 925",
    stone: "טופז",
    price: 260,
  }),
  product({
    slug: "necklace-silver",
    name: "שרשרת כסף",
    categorySlug: "necklaces",
    categoryName: "שרשראות",
    material: "כסף 925",
    price: 210,
  }),
  product({
    slug: "ring-rose-gold-sapphire",
    name: "טבעת ספיר זהב ורוד",
    categorySlug: "rings",
    categoryName: "טבעות",
    material: "זהב ורוד 14K",
    stone: "ספיר",
    price: 5200,
  }),
  product({
    slug: "earrings-gold-diamond",
    name: "עגילי יהלום זהב",
    categorySlug: "earrings",
    categoryName: "עגילים",
    material: "זהב צהוב 14K",
    stone: "יהלום",
    price: 3100,
  }),
];

const cases: SearchEvaluationCase[] = [
  {
    label: "exact stone term (diamond)",
    input: { query: "יהלום" },
    relevantSlugs: ["ring-gold-diamond", "earrings-gold-diamond"],
  },
  {
    label: "material term (silver) via query",
    input: { query: "כסף" },
    relevantSlugs: ["ring-silver", "earrings-silver-topaz", "necklace-silver"],
  },
  {
    label: "single stone term (pearl)",
    input: { query: "פנינה" },
    relevantSlugs: ["necklace-gold-pearl"],
  },
  {
    label: "material facet filter (silver 925)",
    input: { material: "כסף 925" },
    relevantSlugs: ["ring-silver", "earrings-silver-topaz", "necklace-silver"],
  },
  {
    label: "category facet filter (rings)",
    input: { category: "rings" },
    relevantSlugs: [
      "ring-gold-diamond",
      "ring-silver",
      "ring-rose-gold-sapphire",
    ],
  },
  {
    label: "budget filter under 300",
    input: { maxPrice: 300 },
    relevantSlugs: ["earrings-silver-topaz", "necklace-silver"],
  },
  {
    label: "query plus budget (earrings under 300)",
    input: { query: "עגילי", maxPrice: 300 },
    relevantSlugs: ["earrings-silver-topaz"],
  },
  {
    label: "misspelling returns nothing",
    input: { query: "יהלים" },
    expectZeroResults: true,
  },
  {
    label: "out-of-vocabulary term returns nothing",
    input: { query: "אמרלד" },
    expectZeroResults: true,
  },
  {
    // Known limitation: the deterministic path is a whole-query substring match,
    // so reversed word order misses a semantically obvious result. The AI /
    // semantic path (evaluated separately) is what recovers these.
    label: "reversed multi-token query misses (documented limitation)",
    input: { query: "יהלום טבעת" },
    expectZeroResults: true,
  },
];

describe("deterministic lexical search evaluation (E-02)", () => {
  const report = evaluateLexicalRetrieval(corpus, cases);

  it("retrieves in-vocabulary single-term and facet queries exactly", () => {
    expect(report.meanRecall).toBe(1);
    expect(report.meanPrecision).toBe(1);
  });

  it("correctly returns nothing for misspellings, out-of-vocabulary, and reversed queries", () => {
    expect(report.zeroResultAccuracy).toBe(1);
  });

  it("retrieves exactly the labeled set for a representative case", () => {
    const diamond = report.cases.find(
      (result) => result.label === "exact stone term (diamond)",
    );

    expect(diamond?.retrievedSlugs).toEqual([
      "earrings-gold-diamond",
      "ring-gold-diamond",
    ]);
  });

  it("scores precision below 1 when retrieval is broader than the labeled set", () => {
    // "טבעת" also matches every ring via its category name ("טבעות"), so a
    // single-product label under-covers the true retrieval — this asserts the
    // metric math against the real filter.
    const broad = evaluateLexicalRetrieval(corpus, [
      {
        label: "broad term with narrow label",
        input: { query: "טבעת" },
        relevantSlugs: ["ring-gold-diamond"],
      },
    ]);

    expect(broad.cases[0]?.retrievedSlugs).toEqual([
      "ring-gold-diamond",
      "ring-rose-gold-sapphire",
      "ring-silver",
    ]);
    expect(broad.meanPrecision).toBeCloseTo(1 / 3, 5);
    expect(broad.meanRecall).toBe(1);
  });
});
