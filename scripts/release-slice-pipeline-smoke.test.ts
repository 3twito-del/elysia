import { describe, expect, it } from "vitest";

import {
  catalogOwnerIntakeHeader,
  parseCatalogOwnerIntakeRows,
  validateCatalogOwnerIntakeCsv,
  type CatalogOwnerIntakeColumn,
} from "./catalog-owner-intake";
import { createCatalogOwnerIntakeApplyPlan } from "./catalog-owner-intake-apply";
import { buildCatalogQualityReport } from "./lib/catalog-quality-report";
import {
  auditCatalogReadiness,
  type CatalogReadinessProduct,
} from "./lib/catalog-readiness";
import { buildReleaseScorecard } from "./lib/release-scorecard";
import { renderCsvRow } from "./lib/csv";
import { buildReleaseSliceGate } from "./release-slice-gate";

const generatedAt = "2026-06-21T00:00:00.000Z";

describe("release slice pipeline smoke", () => {
  it("can pass the full release-slice artifact chain with complete synthetic evidence", () => {
    const intakeCsv = createCompleteIntakeCsv();
    const validation = validateCatalogOwnerIntakeCsv(intakeCsv, {
      now: new Date(generatedAt),
    });
    const { rows } = parseCatalogOwnerIntakeRows(intakeCsv);
    const applyPlan = createCatalogOwnerIntakeApplyPlan({
      mode: "apply",
      products: [{ id: "prod_1", slug: "ring-alpha" }],
      replaceMedia: true,
      rows,
    });
    const product = createCompleteProduct();
    const readiness = auditCatalogReadiness([product], {
      mediaFiles: Object.fromEntries(
        product.media.map((media, index) => [
          media.url,
          { exists: true, sha256: `release-slice-hash-${index}` },
        ]),
      ),
      now: new Date(generatedAt),
    });
    const quality = buildCatalogQualityReport(readiness);
    const scorecard = buildReleaseScorecard({
      catalogReadiness: {
        productCount: readiness.productCount,
        publishReadyCount: readiness.publishReadyCount,
        ready: readiness.ready,
      },
      fields: createPassingScorecardFields(),
      generatedAt,
    });
    const gate = buildReleaseSliceGate({
      catalogQuality: {
        artifact: { report: quality },
        path: "catalog-quality-report.json",
      },
      catalogReadiness: {
        artifact: { audit: readiness },
        path: "catalog-readiness.json",
      },
      generatedAt,
      ownerIntakeApply: {
        artifact: { plan: applyPlan },
        path: "catalog-owner-intake-apply.json",
      },
      ownerIntakeValidation: {
        artifact: { validation },
        path: "catalog-owner-intake-validation.json",
      },
      releaseScorecard: {
        artifact: scorecard,
        path: "release-scorecard.json",
      },
    });

    expect(validation.ready).toBe(true);
    expect(applyPlan.ready).toBe(true);
    expect(readiness.ready).toBe(true);
    expect(quality.ready).toBe(true);
    expect(scorecard.ready).toBe(true);
    expect(gate.ready).toBe(true);
  });
});

function createCompleteIntakeCsv() {
  return [
    catalogOwnerIntakeHeader.join(","),
    renderCsvRow(catalogOwnerIntakeHeader.map((column) => intakeRow[column])),
  ].join("\n");
}

const intakeRow = {
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
} satisfies Record<CatalogOwnerIntakeColumn, string>;

function createCompleteProduct(): CatalogReadinessProduct {
  const mediaInputs = [
    {
      alt: intakeRow.primaryAltText,
      role: "primary",
      url: intakeRow.primaryMediaUrl,
    },
    {
      alt: intakeRow.alternateAltText,
      role: "alternate",
      url: intakeRow.alternateMediaUrl,
    },
    {
      alt: intakeRow.scaleAltText,
      role: "scale",
      url: intakeRow.scaleMediaUrl,
    },
    {
      alt: intakeRow.constructionAltText,
      role: "construction",
      url: intakeRow.constructionMediaUrl,
    },
    {
      alt: intakeRow.materialAltText,
      role: "material",
      url: intakeRow.materialMediaUrl,
    },
    {
      alt: intakeRow.contextAltText,
      role: "context",
      url: intakeRow.contextMediaUrl,
    },
  ] as const;

  return {
    availabilityMode: "READY_TO_ORDER",
    basePrice: 500,
    careInstructions: intakeRow.careInstructions,
    category: { name: "Rings", slug: "rings" },
    collections: [{ name: "Wave 0", slug: "wave-0" }],
    commerceHighlights: ["Verified before release"],
    deliveryPromise: intakeRow.deliveryPromise,
    description: "Verified complete release-slice product.",
    factVerification: {
      sourceReference: intakeRow.factSourceReference,
      verifiedAt: intakeRow.factVerifiedAt,
      verifiedBy: intakeRow.factVerifiedBy,
    },
    material: { name: "14K yellow gold", slug: "14k-yellow-gold" },
    media: mediaInputs.map(({ alt, role, url }, index) => ({
      alt,
      height: 1400,
      isPrimary: index === 0,
      kind: "IMAGE" as const,
      role,
      sortOrder: index,
      url,
      width: 1400,
    })),
    name: "Ring Alpha",
    policyVerification: {
      sourceReference: intakeRow.policySourceReference,
      verifiedAt: intakeRow.policyVerifiedAt,
      verifiedBy: intakeRow.policyVerifiedBy,
    },
    returnPolicy: intakeRow.returnPolicy,
    shortDescription: "Verified release-slice ring.",
    sku: "RING-ALPHA",
    slug: "ring-alpha",
    source: "OWN",
    specifications: {
      countryOfManufacture: intakeRow.countryOfManufacture,
      manufacturerOrImporter: intakeRow.manufacturerOrImporter,
      materialDetails: intakeRow.materialDetails,
      measurements: intakeRow.measurements,
      stoneDetails: intakeRow.stoneDetails,
    },
    stone: null,
    tags: ["ring", "wave-0"],
    variants: [
      {
        isDefault: true,
        name: "Size 52",
        prices: [{ amount: 500, currency: "ILS" }],
        size: "52",
        sku: "RING-ALPHA-52",
      },
    ],
    warranty: intakeRow.warranty,
  };
}

function createPassingScorecardFields() {
  return {
    cleanLogWindow: { status: "pass" as const },
    coreWebVitals: { status: "pass" as const },
    legalSignOff: { status: "pass" as const },
    ownPaidFlowProof: { status: "pass" as const },
    p0Blockers: { status: "pass" as const },
    productionSmoke: { status: "pass" as const },
    providerHealth: { status: "pass" as const },
    reconciliation: { status: "pass" as const },
    rollbackReadiness: { status: "pass" as const },
    security: { status: "pass" as const },
    supplierFulfillment: { status: "pass" as const },
    supplierPaidFlowProof: { status: "pass" as const },
    visualMatrix: { status: "pass" as const },
    wcag: { status: "pass" as const },
  };
}
