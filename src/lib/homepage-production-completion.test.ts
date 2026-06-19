import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getProductCardMeta,
  getProductCardSale,
  isDisplayableProductDetail,
} from "~/components/product-card";
import { legalPlaceholder } from "~/lib/legal-content";
import {
  getPublicCategoryName,
  getPublicCollectionName,
  getPublicMaterialName,
  getPublicProductName,
} from "~/lib/product-display";
import {
  getFixtureCatalogCategories,
  getFixtureFeaturedCatalogProducts,
} from "~/server/services/catalog-fixtures";

// Hard regression guard for the homepage production-completion pass. It must
// fail if a placeholder, bracketed CMS fallback, duplicated category label, or
// fabricated sale state can reach the homepage-rendered output.

const FORBIDDEN_DETAIL_VALUES = [
  legalPlaceholder,
  "[להשלמה]",
  "[שם משפטי להשלמה]",
  "ע.מ/ח.פ: [להשלמה]",
  "",
  "   ",
  "[placeholder]",
];

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("homepage production completion", () => {
  it("never treats placeholder/bracketed values as displayable product detail", () => {
    for (const value of FORBIDDEN_DETAIL_VALUES) {
      expect(isDisplayableProductDetail(value)).toBe(false);
    }

    expect(isDisplayableProductDetail(null)).toBe(false);
    expect(isDisplayableProductDetail(undefined)).toBe(false);
    expect(isDisplayableProductDetail("כסף 925")).toBe(true);
    expect(isDisplayableProductDetail("ציפוי זהב")).toBe(true);
  });

  it("drops placeholder material without leaving brackets or a dangling separator", () => {
    const withCollection = getProductCardMeta(
      { material: "[להשלמה]" },
      "Signature edit",
    );

    expect(withCollection.productMeta).toBe("Signature edit");
    expect(withCollection.productMeta).not.toContain("·");

    const withoutAnything = getProductCardMeta({ material: "[להשלמה]" });

    expect(withoutAnything.productMeta).toBe("");

    const realMaterial = getProductCardMeta(
      { material: "כסף 925" },
      "Signature edit",
    );

    expect(realMaterial.productMeta).toBe("כסף 925 · Signature edit");
  });

  it("contains the getPublicMaterialName CMS-fallback so it cannot reach the card", () => {
    // getPublicMaterialName may legitimately fall back to the placeholder for
    // products with no verified material; the card layer must neutralise it.
    const fallback = getPublicMaterialName("", null);
    const meta = getProductCardMeta({ material: fallback }, undefined);

    expect(meta.productMeta).not.toContain("[");
    expect(meta.productMeta).not.toContain("]");
  });

  it("only marks a product on sale with a real compare-at price above the price", () => {
    expect(getProductCardSale({ price: 100 })).toBeNull();
    expect(getProductCardSale({ price: 100, compareAt: 100 })).toBeNull();
    expect(getProductCardSale({ price: 100, compareAt: 80 })).toBeNull();
    expect(getProductCardSale({ price: 100, compareAt: 150 })).toEqual({
      compareAt: 150,
    });
  });

  it("renders clean homepage product-card text from the catalog pipeline", () => {
    const featured = getFixtureFeaturedCatalogProducts(12);

    expect(featured.length).toBeGreaterThan(0);

    for (const product of featured) {
      const name = getPublicProductName(product.name);
      const { productMeta } = getProductCardMeta(
        product,
        getPublicCollectionName(product.collection),
      );

      for (const text of [name, productMeta]) {
        expect(text).not.toContain("[");
        expect(text).not.toContain("]");
        expect(text).not.toContain("להשלמה");
        expect(text).not.toContain("· ·");
      }

      // No dangling separator at either edge of the metadata line.
      expect(productMeta.trim().startsWith("·")).toBe(false);
      expect(productMeta.trim().endsWith("·")).toBe(false);
    }
  });

  it("keeps category accessible labels single-mention and non-duplicated", () => {
    const categories = getFixtureCatalogCategories();

    expect(categories.length).toBeGreaterThan(0);

    for (const category of categories) {
      const name = getPublicCategoryName(category.slug, category.name);
      // Mirrors the homepage category-card aria-label.
      const accessibleLabel = `לגלות את קטגוריית ${name}`;

      expect(accessibleLabel).not.toContain(`${name} ${name}`);

      for (const duplicate of [
        "טבעות טבעות",
        "שרשראות שרשראות",
        "עגילים עגילים",
        "צמידים צמידים",
      ]) {
        expect(accessibleLabel).not.toContain(duplicate);
      }
    }
  });

  it("ships no placeholder or filler text in homepage-rendered components", () => {
    const homepageSources = [
      "src/app/page.tsx",
      "src/components/product-card.tsx",
      "src/components/site-footer.tsx",
      "src/components/newsletter-form.tsx",
    ];
    const forbiddenLiterals = [
      "להשלמה",
      "[שם משפטי",
      "ע.מ/ח.פ",
      "lorem",
      "Lorem",
      "ipsum",
      "TBD",
    ];

    for (const file of homepageSources) {
      const source = read(file);

      for (const literal of forbiddenLiterals) {
        expect(source.includes(literal)).toBe(false);
      }
    }
  });

  it("guards the public homepage footer against bracketed legal placeholders", () => {
    const footer = read("src/components/site-footer.tsx");

    expect(footer).toContain('footerBusinessDetails.includes("[")');
  });
});
