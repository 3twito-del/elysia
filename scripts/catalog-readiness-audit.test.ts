import { describe, expect, it } from "vitest";

import type { CatalogReadinessProduct } from "./lib/catalog-readiness";
import {
  inspectLocalMediaFiles,
  parseCatalogReadinessArgs,
} from "./catalog-readiness-audit";

describe("catalog readiness audit CLI", () => {
  it("parses source, output, strict, and additional env files", () => {
    expect(
      parseCatalogReadinessArgs([
        "--source",
        "fixtures",
        "--out-dir",
        "artifacts/qa/catalog",
        "--env-file",
        ".env.audit",
        "--strict",
      ]),
    ).toEqual({
      envFiles: [".env", ".env.local", ".env.development.local", ".env.audit"],
      outDir: "artifacts/qa/catalog",
      source: "fixtures",
      strict: true,
    });
  });

  it("hashes existing public media and reports missing local media", () => {
    const product = createProductWithMedia([
      "/brand/boutique/lifestyle-hero.avif",
      "/brand/does-not-exist.avif",
      "https://cdn.example.com/product.avif",
    ]);
    const files = inspectLocalMediaFiles([product]);

    expect(files["/brand/boutique/lifestyle-hero.avif"]).toEqual(
      expect.objectContaining({ exists: true }),
    );
    expect(files["/brand/boutique/lifestyle-hero.avif"]?.sha256).toMatch(
      /^[a-f0-9]{64}$/u,
    );
    expect(files["/brand/does-not-exist.avif"]).toEqual({
      exists: false,
      sha256: undefined,
    });
    expect(files["https://cdn.example.com/product.avif"]).toBeUndefined();
  });
});

function createProductWithMedia(urls: string[]): CatalogReadinessProduct {
  return {
    availabilityMode: "READY_TO_ORDER",
    basePrice: 1,
    category: { name: "Test", slug: "test" },
    collections: [],
    commerceHighlights: [],
    description: "Test",
    material: { name: "Test", slug: "test" },
    media: urls.map((url, index) => ({
      alt: "Test",
      isPrimary: index === 0,
      kind: "IMAGE",
      sortOrder: index,
      url,
    })),
    name: "Test",
    shortDescription: "Test",
    sku: "TEST",
    slug: "test",
    source: "OWN",
    tags: [],
    variants: [],
  };
}
