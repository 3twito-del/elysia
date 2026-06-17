import { describe, expect, it } from "vitest";

import { getAdminCatalogImageValidationSummary } from "~/server/adapters/media";
import {
  filterCatalogProducts,
  getCatalogAvailability,
  getCatalogBranchAvailability,
  type CatalogBranch,
  type CatalogProduct,
} from "./catalog";

describe("catalog filtering", () => {
  it("filters by query, facets, branch availability, max price, and stock", () => {
    const products = [
      makeProduct({
        collections: ["bridal"],
        description: "Diamond ring for a refined gift",
        inventory: { "tel-aviv": 2, jerusalem: 0 },
        material: "זהב לבן 14K",
        metalColors: ["זהב לבן"],
        name: "Venus Line Ring",
        price: 1290,
        slug: "venus-line-ring",
        stone: "יהלום",
        tags: ["gift"],
      }),
      makeProduct({
        collections: ["classic"],
        description: "Everyday pearl earrings",
        inventory: { "tel-aviv": 0, jerusalem: 4 },
        material: "כסף",
        name: "Noor Pearl Earrings",
        price: 690,
        slug: "noor-pearl-earrings",
        stone: "פנינה",
        tags: ["daily"],
      }),
      makeProduct({
        collections: ["bridal"],
        description: "Out of stock diamond bracelet",
        inventory: { "tel-aviv": 0, jerusalem: 0 },
        material: "זהב לבן 14K",
        name: "Mika Bracelet",
        price: 850,
        slug: "mika-bracelet",
        stone: "יהלום",
        tags: ["gift"],
      }),
    ];

    expect(
      filterCatalogProducts(products, {
        availableOnly: true,
        branch: "tel-aviv",
        collection: "bridal",
        color: "זהב לבן",
        gift: "מתאים למתנה",
        material: "זהב לבן 14K",
        maxPrice: 1500,
        query: "gift",
        stone: "יהלום",
        style: "bridal",
      }).map((product) => product.slug),
    ).toEqual(["venus-line-ring"]);
  });

  it("keeps empty searches broad and excludes unavailable products only when requested", () => {
    const products = [
      makeProduct({
        inventory: { "tel-aviv": 0 },
        name: "Unavailable",
        slug: "unavailable",
      }),
      makeProduct({
        inventory: { "tel-aviv": 1 },
        name: "Available",
        slug: "available",
      }),
    ];

    expect(
      filterCatalogProducts(products).map((product) => product.slug),
    ).toEqual(["unavailable", "available"]);
    expect(
      filterCatalogProducts(products, { availableOnly: true }).map(
        (product) => product.slug,
      ),
    ).toEqual(["available"]);
  });
});

describe("catalog availability helpers", () => {
  it("maps product and branch availability from inventory quantities", () => {
    const product = makeProduct({
      inventory: { "tel-aviv": 2, jerusalem: 0 },
      slug: "venus-line-ring",
    });
    const branches: CatalogBranch[] = [
      makeBranch("tel-aviv"),
      makeBranch("jerusalem"),
      makeBranch("haifa"),
    ];

    expect(getCatalogAvailability(product)).toEqual([
      { available: true, branchSlug: "tel-aviv", quantity: 2 },
      { available: false, branchSlug: "jerusalem", quantity: 0 },
    ]);
    expect(getCatalogBranchAvailability({ branches, product })).toEqual([
      { available: true, branch: branches[0], quantity: 2 },
      { available: false, branch: branches[1], quantity: 0 },
      { available: false, branch: branches[2], quantity: 0 },
    ]);
  });
});

describe("admin catalog image validation", () => {
  it("summarizes image format alt and size failures before save", () => {
    expect(
      getAdminCatalogImageValidationSummary({
        alt: "",
        bytes: 6 * 1024 * 1024,
        url: "https://cdn.example.invalid/product.bmp",
      }),
    ).toMatchObject({
      ok: false,
      issues: [
        { code: "missing-alt" },
        { code: "unsupported-format" },
        { code: "oversized" },
      ],
    });
    expect(
      getAdminCatalogImageValidationSummary({
        alt: "Venus ring",
        contentType: "image/webp",
        url: "https://cdn.example.invalid/product.webp",
      }).ok,
    ).toBe(true);
  });
});

function makeProduct(
  overrides: Partial<CatalogProduct> &
    Pick<CatalogProduct, "inventory" | "slug">,
): CatalogProduct {
  return {
    availabilityMode: overrides.availabilityMode ?? "READY_TO_ORDER",
    categoryName: "טבעות",
    categorySlug: "rings",
    collection: overrides.collections?.[0] ?? "classic",
    collections: overrides.collections ?? ["classic"],
    commerceHighlights: overrides.commerceHighlights ?? [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    deliveryPromise: overrides.deliveryPromise,
    description: overrides.description ?? "Description",
    image: "/product.png",
    images: ["/product.png"],
    inventory: overrides.inventory,
    material: overrides.material ?? "זהב",
    metalColors: overrides.metalColors ?? [],
    name: overrides.name ?? "Product",
    popularityScore: 0,
    price: overrides.price ?? 1000,
    returnPolicy: overrides.returnPolicy,
    shortDescription: overrides.shortDescription ?? "Short description",
    sizes: [],
    sku: overrides.sku ?? "SKU",
    slug: overrides.slug,
    requiresSeparateCheckout: overrides.requiresSeparateCheckout ?? false,
    stone: overrides.stone,
    tags: overrides.tags ?? [],
    variants: overrides.variants ?? [],
  };
}

function makeBranch(slug: string): CatalogBranch {
  return {
    address: `${slug} address`,
    city: slug,
    name: slug,
    openingHours: {
      friday: "",
      saturday: "",
      sundayThursday: "",
    },
    phone: "",
    services: [],
    slug,
    whatsapp: "",
  };
}
