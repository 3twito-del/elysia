import { describe, expect, it } from "vitest";

import {
  catalogOwnerIntakeHeader,
  createCatalogOwnerIntakeCsv,
  formatCatalogOwnerIntakeValidationMarkdown,
  parseCatalogOwnerIntakeArgs,
  selectCatalogOwnerIntakeSlugs,
  validateCatalogOwnerIntakeCsv,
} from "./catalog-owner-intake";
import { renderCsvRow } from "./lib/csv";

describe("catalog owner intake CLI", () => {
  it("parses audit path, output, selection, and release scope", () => {
    expect(
      parseCatalogOwnerIntakeArgs([
        "--audit",
        "artifacts/qa/run/catalog-readiness.json",
        "--per-class",
        "2",
        "--include-named",
        "--slugs",
        "custom-one, custom-two",
        "--release-scope",
        "wave-0-priority",
        "--out",
        "artifacts/qa/intake/catalog-owner-intake.csv",
      ]),
    ).toEqual({
      auditPath: "artifacts/qa/run/catalog-readiness.json",
      includeAll: false,
      includeNamed: true,
      outPath: "artifacts/qa/intake/catalog-owner-intake.csv",
      perClass: 2,
      releaseScope: "wave-0-priority",
      slugs: ["custom-one", "custom-two"],
    });
  });

  it("selects named products and a bounded per-class seed without approving the slice", () => {
    expect(
      selectCatalogOwnerIntakeSlugs(createProducts(), {
        includeAll: false,
        includeNamed: true,
        perClass: 2,
        slugs: [],
      }),
    ).toEqual([
      "bracelet-alpha",
      "bracelet-beta",
      "earrings-alpha",
      "earrings-beta",
      "hera-bracelet",
      "muse-necklace",
      "ring-alpha",
      "ring-beta",
      "venus-line-ring",
    ]);
  });

  it("renders CSV rows with residual audit risk and escaped values", () => {
    const csv = createCatalogOwnerIntakeCsv({
      products: createProducts(),
      releaseScope: "wave-0,priority",
      selectedSlugs: ["ring-alpha", "missing-slug"],
    });

    expect(csv.split(/\r?\n/u)[0]).toContain(
      "productSlug,priorityTier,releaseScope",
    );
    expect(csv).toContain(
      'ring-alpha,,"wave-0,priority",,,3 blockers; 8 high findings; 1 media; 2 variants; OWN',
    );
    expect(csv).toContain(
      'missing-slug,,"wave-0,priority",,,slug not found in audit',
    );
  });

  it("passes a complete owner intake row without treating warnings as blockers", () => {
    const validation = validateCatalogOwnerIntakeCsv(
      createCompleteIntakeCsv(),
      {
        now: new Date("2026-06-19T00:00:00.000Z"),
      },
    );

    expect(validation.ready).toBe(true);
    expect(validation.issueCounts.error).toBe(0);
    expect(validation.productCount).toBe(1);
  });

  it("fails generated scaffolds until owners fill the required evidence fields", () => {
    const csv = createCatalogOwnerIntakeCsv({
      products: createProducts(),
      releaseScope: "wave-0-priority",
      selectedSlugs: ["ring-alpha"],
    });
    const validation = validateCatalogOwnerIntakeCsv(csv, {
      now: new Date("2026-06-19T00:00:00.000Z"),
    });

    expect(validation.ready).toBe(false);
    expect(validation.issueCounts.error).toBeGreaterThan(20);
    expect(validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "REQUIRED_FIELD_MISSING",
          field: "directOwner",
        }),
      ]),
    );
  });

  it("rejects duplicate products, future dates, invalid URLs, and repeated media", () => {
    const validRow = createCompleteIntakeRow();
    const badRow = {
      ...validRow,
      factVerifiedAt: "2030-01-01",
      primaryMediaUrl: "not-a-url",
      productSlug: "ring-alpha",
      scaleMediaUrl: validRow.alternateMediaUrl,
    };
    const validation = validateCatalogOwnerIntakeCsv(
      [
        catalogOwnerIntakeHeader.join(","),
        renderCatalogOwnerIntakeTestRow(validRow),
        renderCatalogOwnerIntakeTestRow(badRow),
      ].join("\n"),
      { now: new Date("2026-06-19T00:00:00.000Z") },
    );

    expect(validation.ready).toBe(false);
    expect(validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "PRODUCT_SLUG_DUPLICATE" }),
        expect.objectContaining({
          code: "DATE_FUTURE",
          field: "factVerifiedAt",
        }),
        expect.objectContaining({
          code: "MEDIA_URL_INVALID",
          field: "primaryMediaUrl",
        }),
        expect.objectContaining({
          code: "MEDIA_URL_REPEATED_WITHIN_ROW",
          field: "scaleMediaUrl",
        }),
      ]),
    );
  });

  it("formats a validation markdown artifact", () => {
    const validation = validateCatalogOwnerIntakeCsv(
      createCompleteIntakeCsv(),
      {
        now: new Date("2026-06-19T00:00:00.000Z"),
      },
    );

    expect(
      formatCatalogOwnerIntakeValidationMarkdown({
        generatedAt: "2026-06-19T00:00:00.000Z",
        sourcePath: "artifacts/qa/catalog-owner-intake.csv",
        validation,
      }),
    ).toContain("Status: PASS");
  });
});

function createProducts() {
  return [
    createProduct("bracelet-alpha"),
    createProduct("bracelet-beta"),
    createProduct("bracelet-gamma"),
    createProduct("earrings-alpha"),
    createProduct("earrings-beta"),
    createProduct("hera-bracelet"),
    createProduct("muse-necklace"),
    createProduct("ring-alpha"),
    createProduct("ring-beta"),
    createProduct("ring-gamma"),
    createProduct("venus-line-ring"),
  ];
}

function createProduct(productSlug: string) {
  return {
    issueCounts: {
      blocker: 3,
      high: 8,
      info: 0,
      medium: 0,
    },
    mediaCount: 1,
    productSlug,
    publishReady: false,
    source: "OWN" as const,
    variantCount: 2,
  };
}

function createCompleteIntakeCsv() {
  return [
    catalogOwnerIntakeHeader.join(","),
    renderCatalogOwnerIntakeTestRow(createCompleteIntakeRow()),
    "",
  ].join("\n");
}

function createCompleteIntakeRow() {
  return {
    acceptanceOwner: "founder",
    altTextOwner: "content-owner",
    alternateAltText: "Alternate angle of the verified ring profile.",
    alternateMediaUrl: "/media/ring-alpha-alternate.avif",
    careInstructions: "Avoid perfume, chlorine, and abrasive cleaning.",
    constructionAltText: "Close construction detail of the ring setting.",
    constructionMediaUrl: "/media/ring-alpha-construction.avif",
    contextAltText: "Verified ring shown in approved packaging context.",
    contextMediaUrl: "/media/ring-alpha-context.avif",
    countryOfManufacture: "Israel",
    deliveryPromise: "Ships after verification and quality approval.",
    directOwner: "catalog-owner",
    factSourceReference: "spec-sheet:ring-alpha:2026-06",
    factVerifiedAt: "2026-06-18",
    factVerifiedBy: "merchandising-owner",
    manufacturerOrImporter: "Elysia",
    materialAltText: "Macro view of the approved polished gold finish.",
    materialDetails: "14K yellow gold.",
    materialMediaUrl: "/media/ring-alpha-material.avif",
    measurements: "Band width 2 mm.",
    mediaApprovedAt: "2026-06-18",
    mediaApprovedBy: "creative-owner",
    mediaSourceReference: "shoot:ring-alpha:2026-06",
    policySourceReference: "policy:2026-06",
    policyVerifiedAt: "2026-06-18",
    policyVerifiedBy: "legal-owner",
    primaryAltText: "Primary view of the verified ring front.",
    primaryMediaUrl: "/media/ring-alpha-primary.avif",
    priorityTier: "hero",
    productSlug: "ring-alpha",
    releaseScope: "wave-0-priority",
    residualRisk: "OWN",
    returnPolicy: "Returns follow the approved public policy.",
    scaleAltText: "Ring shown with measured scale reference.",
    scaleMediaUrl: "/media/ring-alpha-scale.avif",
    stoneDetails: "No stones.",
    supplierOrderException: "",
    variantSkuMap: "ring-alpha-52=RING-ALPHA-52",
    warranty: "Warranty follows the approved public policy.",
  } satisfies Record<(typeof catalogOwnerIntakeHeader)[number], string>;
}

function renderCatalogOwnerIntakeTestRow(
  row: Record<(typeof catalogOwnerIntakeHeader)[number], string>,
) {
  return renderCsvRow(catalogOwnerIntakeHeader.map((column) => row[column]));
}
