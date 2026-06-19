import { describe, expect, it } from "vitest";

import {
  auditCatalogReadiness,
  formatCatalogReadinessMarkdown,
  type CatalogReadinessProduct,
} from "./lib/catalog-readiness";

describe("catalog readiness", () => {
  it("passes a complete own-product record", () => {
    const product = createCompleteProduct();
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
      now: new Date("2026-06-19T00:00:00.000Z"),
    });

    expect(audit.ready).toBe(true);
    expect(audit.publishReadyCount).toBe(1);
    expect(audit.issues).toEqual([]);
  });

  it("blocks placeholders, invalid pricing, missing variants, and missing media", () => {
    const product = createCompleteProduct({
      basePrice: 0,
      material: { name: "[להשלמה]", slug: "unknown" },
      media: [],
      variants: [],
    });
    const audit = auditCatalogReadiness([product]);
    const codes = audit.issues.map((issue) => issue.code);

    expect(audit.ready).toBe(false);
    expect(codes).toEqual(
      expect.arrayContaining([
        "BASE_PRICE_INVALID",
        "MEDIA_MISSING",
        "PLACEHOLDER_VALUE",
        "VARIANTS_MISSING",
      ]),
    );
  });

  it("requires complete Shopify product and variant mappings", () => {
    const product = createCompleteProduct({
      externalHandle: null,
      externalProductId: null,
      externalProvider: "shopify",
      source: "DROPSHIP_SHOPIFY",
      supplierKey: null,
      variants: [
        {
          externalVariantId: null,
          isDefault: true,
          metalColor: "כסף",
          name: "יחידה",
          prices: [{ amount: 500, currency: "ILS" }],
          size: null,
          sku: "SUP-1",
          stoneColor: null,
        },
      ],
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
    });

    expect(
      audit.issues.filter((issue) => issue.severity === "blocker"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SHOPIFY_PRODUCT_MAPPING_MISSING",
          field: "externalProductId",
        }),
        expect.objectContaining({
          code: "SHOPIFY_VARIANT_MAPPING_MISSING",
        }),
      ]),
    );
  });

  it("reports duplicate URLs and duplicate file content across products", () => {
    const first = createCompleteProduct({ slug: "first" });
    const second = createCompleteProduct({
      media: createCompleteProduct().media.map((media, index) => ({
        ...media,
        url: index === 0 ? media.url : `/media/second-${index}.avif`,
      })),
      slug: "second",
    });
    const mediaFiles = {
      ...createMediaFiles(first),
      ...createMediaFiles(second),
      "/media/second-1.avif": { exists: true, sha256: "hash-1" },
      "/media/product-1.avif": { exists: true, sha256: "hash-1" },
    };
    const audit = auditCatalogReadiness([first, second], { mediaFiles });

    expect(audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MEDIA_URL_SHARED_ACROSS_PRODUCTS",
          productSlug: "first",
        }),
        expect.objectContaining({
          code: "MEDIA_CONTENT_DUPLICATED_ACROSS_PRODUCTS",
          productSlug: "second",
        }),
      ]),
    );
  });

  it("checks scoped products for duplicate media against a reference catalog", () => {
    const scoped = createCompleteProduct({ slug: "scoped-product" });
    const outsideScope = createCompleteProduct({
      media: scoped.media,
      slug: "outside-scope-product",
    });
    const audit = auditCatalogReadiness([scoped], {
      duplicateMediaReferenceProducts: [scoped, outsideScope],
      mediaFiles: createMediaFiles(scoped),
    });

    expect(audit.productCount).toBe(1);
    expect(audit.products.map((product) => product.productSlug)).toEqual([
      "scoped-product",
    ]);
    expect(audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MEDIA_URL_SHARED_ACROSS_PRODUCTS",
          productSlug: "scoped-product",
        }),
      ]),
    );
    expect(
      audit.issues.some(
        (issue) => issue.productSlug === "outside-scope-product",
      ),
    ).toBe(false);
  });

  it("separates an incomplete media count from unverified media roles", () => {
    const product = createCompleteProduct({
      media: [
        {
          alt: "מוצר",
          height: 1400,
          isPrimary: true,
          kind: "IMAGE",
          sortOrder: 0,
          url: "/media/only.avif",
          width: 1400,
        },
      ],
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: { "/media/only.avif": { exists: true } },
    });

    expect(audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MEDIA_SET_INCOMPLETE" }),
        expect.objectContaining({ code: "MEDIA_ROLES_UNVERIFIABLE" }),
      ]),
    );
  });

  it("writes a deterministic markdown summary", () => {
    const product = createCompleteProduct();
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
    });
    const markdown = formatCatalogReadinessMarkdown({
      audit,
      generatedAt: "2026-06-19T00:00:00.000Z",
      source: "fixtures",
    });

    expect(markdown).toContain("Status: PASS");
    expect(markdown).toContain("| Active products | 1 |");
    expect(markdown).toContain("`complete-product`");
  });
});

function createCompleteProduct(
  overrides: Partial<CatalogReadinessProduct> = {},
): CatalogReadinessProduct {
  return {
    availabilityMode: "READY_TO_ORDER",
    basePrice: 500,
    careInstructions: "יש להימנע ממגע עם חומרי ניקוי.",
    category: { name: "טבעות", slug: "rings" },
    collections: [{ name: "אור רך", slug: "studio-light" }],
    commerceHighlights: ["פרטים מאומתים לפני הזמנה"],
    deliveryPromise: "מסירה לאחר אישור הפרטים.",
    description: "תיאור מלא ומאומת של המוצר.",
    externalHandle: null,
    externalProductId: null,
    externalProvider: null,
    factVerification: {
      sourceReference: "supplier-spec-sheet:OWN-1",
      verifiedAt: "2026-06-18T00:00:00.000Z",
      verifiedBy: "catalog-owner",
    },
    material: { name: "זהב צהוב 14K", slug: "yellow-gold" },
    media: [
      "primary",
      "alternate",
      "scale",
      "construction",
      "material",
      "context",
    ].map((role, index) => ({
      alt: `מוצר - ${role}`,
      height: 1400,
      isPrimary: index === 0,
      kind: "IMAGE" as const,
      role: role as
        | "primary"
        | "alternate"
        | "scale"
        | "construction"
        | "material"
        | "context",
      sortOrder: index,
      url: `/media/product-${index}.avif`,
      width: 1400,
    })),
    name: "טבעת שלמה",
    returnPolicy: "החזרה לפי המדיניות המאושרת.",
    shortDescription: "תיאור קצר ומאומת.",
    sku: "OWN-1",
    slug: "complete-product",
    source: "OWN",
    specifications: {
      countryOfManufacture: "ישראל",
      manufacturerOrImporter: "Elysia",
      materialDetails: "זהב צהוב 14K",
      measurements: "רוחב 2 מ״מ",
      stoneDetails: "יהלום טבעי, 0.05 קראט",
    },
    stone: { name: "יהלום", slug: "diamond" },
    supplierKey: null,
    tags: ["טבעת", "מתנה"],
    variants: [
      {
        externalVariantId: null,
        isDefault: true,
        metalColor: "זהב צהוב",
        name: "מידה 52",
        prices: [{ amount: 500, currency: "ILS" }],
        size: "52",
        sku: "OWN-1-52",
        stoneColor: "לבן",
      },
    ],
    warranty: "אחריות לפי המדיניות המאושרת.",
    policyVerification: {
      sourceReference: "policy:2026-06-18",
      verifiedAt: "2026-06-18T00:00:00.000Z",
      verifiedBy: "policy-owner",
    },
    ...overrides,
  };
}

function createMediaFiles(product: CatalogReadinessProduct) {
  return Object.fromEntries(
    product.media.map((media, index) => [
      media.url,
      { exists: true, sha256: `hash-${index}` },
    ]),
  );
}
