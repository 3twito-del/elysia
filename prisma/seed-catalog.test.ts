import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  getSeedProducts,
  seedCategories,
  seedCollections,
  seedMaterials,
  seedStones,
} from "./seed-catalog";

describe("seed catalog generator", () => {
  const products = getSeedProducts();
  const expectedCountsByCategory = {
    bracelets: 20,
    earrings: 20,
    necklaces: 24,
    rings: 30,
    sets: 10,
  };

  it("creates the 104 Silver Israel products split by launch category", () => {
    expect(products).toHaveLength(104);

    const countsByCategory = products.reduce<Record<string, number>>(
      (counts, product) => {
        counts[product.categorySlug] = (counts[product.categorySlug] ?? 0) + 1;

        return counts;
      },
      {},
    );

    expect(countsByCategory).toMatchObject(expectedCountsByCategory);
  });

  it("creates unique product and variant identifiers", () => {
    expectUnique(
      products.map((product) => product.slug),
      "product slugs",
    );
    expectUnique(
      products.map((product) => product.sku),
      "product SKUs",
    );
    expectUnique(
      products.flatMap((product) =>
        product.variants.map((variant) => variant.sku),
      ),
      "variant SKUs",
    );
  });

  it("creates complete product data for the Prisma seed", () => {
    const categorySlugs = new Set(
      seedCategories.map((category) => category.slug),
    );
    const materialSlugs = new Set(
      seedMaterials.map((material) => material.slug),
    );
    const stoneSlugs = new Set(seedStones.map((stone) => stone.slug));
    const collectionSlugs = new Set(
      seedCollections.map((collection) => collection.slug),
    );

    for (const product of products) {
      expect(categorySlugs.has(product.categorySlug)).toBe(true);
      expect(materialSlugs.has(product.materialSlug)).toBe(true);
      expect(Number(product.basePrice)).toBeGreaterThan(0);
      expect(product.image).toMatch(
        /^\/brand\/silver-israel\/[a-z0-9-]+-\d{2}\.avif$/,
      );
      expect(product.images.length).toBeGreaterThanOrEqual(1);
      expect(product.media.length).toBe(product.images.length);
      expect(product.media[0]?.role).toBe("PRIMARY");
      expect(product.supplierKey).toBe("silver-israel");
      expect(product.sourceUrl).toMatch(/^https:\/\/silverisrael\.co\.il\//);
      expect(product.tags.length).toBeGreaterThan(0);
      expect(product.variants.length).toBeGreaterThan(0);

      if (product.categorySlug === "sets") {
        expect(product.sourceUrl).toMatch(
          /^https:\/\/silverisrael\.co\.il\/product\//,
        );
      }

      for (const image of product.images) {
        expect(image).toMatch(
          /^\/brand\/silver-israel\/[a-z0-9-]+-\d{2}\.avif$/,
        );
        expect(
          existsSync(path.join(process.cwd(), "public", image.slice(1))),
          `${image} should exist in public assets`,
        ).toBe(true);
      }

      if (product.stoneSlug) {
        expect(stoneSlugs.has(product.stoneSlug)).toBe(true);
      }

      for (const collectionSlug of product.collectionSlugs) {
        expect(collectionSlugs.has(collectionSlug)).toBe(true);
      }

      for (const variant of product.variants) {
        expect(variant.sku).toContain(product.sku);
        expect(variant.name.length).toBeGreaterThan(0);
        expect(Number(variant.priceDelta)).toBeGreaterThanOrEqual(0);
        expect(variant.quantityTlv).toBeGreaterThanOrEqual(0);
        expect(variant.quantityJerusalem).toBeGreaterThanOrEqual(0);
        expect(variant.safetyStock).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

function expectUnique(values: string[], label: string) {
  expect(new Set(values).size, `${label} should be unique`).toBe(values.length);
}
