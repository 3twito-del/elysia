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

  it("flags low-resolution, extreme aspect ratio, and unsupported media formats", () => {
    const product = createCompleteProduct({
      media: [
        {
          alt: "primary",
          height: 640,
          isPrimary: true,
          kind: "IMAGE",
          role: "primary",
          sortOrder: 0,
          url: "/media/tiny.avif",
          width: 640,
        },
        {
          alt: "banner",
          height: 400,
          isPrimary: false,
          kind: "IMAGE",
          role: "alternate",
          sortOrder: 1,
          url: "/media/wide.webp",
          width: 2000,
        },
        {
          alt: "legacy",
          height: 1400,
          isPrimary: false,
          kind: "IMAGE",
          role: "scale",
          sortOrder: 2,
          url: "/media/legacy.gif",
          width: 1400,
        },
      ],
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: {
        "/media/tiny.avif": { exists: true },
        "/media/wide.webp": { exists: true },
        "/media/legacy.gif": { exists: true },
      },
    });
    const codes = audit.issues.map((issue) => issue.code);

    expect(codes).toEqual(
      expect.arrayContaining([
        "MEDIA_LOW_RESOLUTION",
        "MEDIA_ASPECT_RATIO_EXTREME",
        "MEDIA_UNSUPPORTED_FORMAT",
      ]),
    );
  });

  it("accepts a remote CDN URL without a file extension", () => {
    const product = createCompleteProduct({
      media: createCompleteProduct().media.map((media, index) => ({
        ...media,
        url: index === 0 ? "https://cdn.example.com/render?id=1" : media.url,
      })),
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
    });

    expect(
      audit.issues.some((issue) => issue.code === "MEDIA_UNSUPPORTED_FORMAT"),
    ).toBe(false);
  });

  it("flags media with no recorded provenance or license status", () => {
    const product = createCompleteProduct({
      media: createCompleteProduct().media.map((media) => ({
        ...media,
        licenseStatus: undefined,
        provenance: undefined,
      })),
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
    });
    const codes = audit.issues.map((issue) => issue.code);

    expect(codes.filter((code) => code === "MEDIA_PROVENANCE_UNKNOWN")).toHaveLength(
      product.media.length,
    );
    expect(
      codes.filter((code) => code === "MEDIA_LICENSE_STATUS_UNKNOWN"),
    ).toHaveLength(product.media.length);
  });

  it("blocks a license flagged NEEDS_REVIEW and an expired license", () => {
    const complete = createCompleteProduct();
    const product = createCompleteProduct({
      media: complete.media.map((media, index) => ({
        ...media,
        licenseExpiresAt:
          index === 1 ? "2026-01-01T00:00:00.000Z" : undefined,
        licenseStatus: index === 0 ? "NEEDS_REVIEW" : media.licenseStatus,
      })),
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
      now: new Date("2026-06-19T00:00:00.000Z"),
    });

    expect(audit.ready).toBe(false);
    expect(audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MEDIA_LICENSE_NEEDS_REVIEW",
          severity: "high",
        }),
        expect.objectContaining({
          code: "MEDIA_LICENSE_EXPIRED",
          severity: "blocker",
        }),
      ]),
    );
  });

  it("blocks a generated asset that has not been explicitly approved", () => {
    const complete = createCompleteProduct();
    const product = createCompleteProduct({
      media: complete.media.map((media, index) => ({
        ...media,
        isGenerated: index === 0,
      })),
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
    });

    expect(audit.ready).toBe(false);
    expect(audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MEDIA_GENERATED_UNAPPROVED",
          severity: "blocker",
        }),
      ]),
    );
  });

  it("accepts a generated asset once it carries an explicit approval", () => {
    const complete = createCompleteProduct();
    const product = createCompleteProduct({
      media: complete.media.map((media, index) => ({
        ...media,
        approvedAt: index === 0 ? "2026-06-01T00:00:00.000Z" : media.approvedAt,
        isGenerated: index === 0,
      })),
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
    });

    expect(
      audit.issues.some((issue) => issue.code === "MEDIA_GENERATED_UNAPPROVED"),
    ).toBe(false);
  });

  it("flags a fact/policy verification with no expiration date", () => {
    const complete = createCompleteProduct();
    const product = createCompleteProduct({
      factVerification: {
        ...complete.factVerification!,
        expiresAt: undefined,
      },
      policyVerification: {
        ...complete.policyVerification!,
        expiresAt: undefined,
      },
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
    });
    const codes = audit.issues.map((issue) => issue.code);

    expect(codes).toEqual(
      expect.arrayContaining([
        "FACT_VERIFICATION_EXPIRATION_MISSING",
        "POLICY_VERIFICATION_EXPIRATION_MISSING",
      ]),
    );
  });

  it("blocks an expired fact/policy verification -- the J-10 rollback behavior", () => {
    const complete = createCompleteProduct();
    const product = createCompleteProduct({
      factVerification: {
        ...complete.factVerification!,
        expiresAt: "2026-01-01T00:00:00.000Z",
      },
      policyVerification: {
        ...complete.policyVerification!,
        expiresAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
      now: new Date("2026-06-19T00:00:00.000Z"),
    });

    expect(audit.ready).toBe(false);
    expect(audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "FACT_VERIFICATION_EXPIRED",
          severity: "blocker",
        }),
        expect.objectContaining({
          code: "POLICY_VERIFICATION_EXPIRED",
          severity: "blocker",
        }),
      ]),
    );
  });

  it("accepts a fact verification that has not yet expired", () => {
    const complete = createCompleteProduct();
    const product = createCompleteProduct({
      factVerification: {
        ...complete.factVerification!,
        expiresAt: "2027-01-01T00:00:00.000Z",
      },
    });
    const audit = auditCatalogReadiness([product], {
      mediaFiles: createMediaFiles(product),
      now: new Date("2026-06-19T00:00:00.000Z"),
    });

    expect(
      audit.issues.some((issue) => issue.code === "FACT_VERIFICATION_EXPIRED"),
    ).toBe(false);
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
      expiresAt: "2027-06-18T00:00:00.000Z",
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
      isGenerated: false,
      isPrimary: index === 0,
      kind: "IMAGE" as const,
      licenseStatus: "OWNED" as const,
      provenance: "OWNER_UPLOAD" as const,
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
      expiresAt: "2027-06-18T00:00:00.000Z",
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
