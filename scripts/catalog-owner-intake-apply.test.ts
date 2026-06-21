import { describe, expect, it } from "vitest";

import {
  catalogOwnerIntakeHeader,
  parseCatalogOwnerIntakeRows,
  type CatalogOwnerIntakeColumn,
} from "./catalog-owner-intake";
import {
  createCatalogOwnerIntakeApplyPlan,
  formatCatalogOwnerIntakeApplyPlanMarkdown,
  parseCatalogOwnerIntakeApplyArgs,
} from "./catalog-owner-intake-apply";
import { renderCsvRow } from "./lib/csv";

describe("catalog owner intake apply plan", () => {
  it("parses dry-run, apply, media, env, and warning options", () => {
    expect(
      parseCatalogOwnerIntakeApplyArgs([
        "--file",
        "artifacts/qa/catalog-owner-intake.csv",
        "--out-dir",
        "artifacts/qa/catalog-owner-intake-apply",
        "--env-file",
        ".env.audit",
        "--apply",
        "--replace-media",
        "--warnings-as-errors",
      ]),
    ).toEqual({
      apply: true,
      envFiles: [".env", ".env.local", ".env.development.local", ".env.audit"],
      filePath: "artifacts/qa/catalog-owner-intake.csv",
      outDir: "artifacts/qa/catalog-owner-intake-apply",
      replaceMedia: true,
      warningsAsErrors: true,
    });
  });

  it("creates a ready product and media replacement plan", () => {
    const { rows } = parseCatalogOwnerIntakeRows(createCompleteCsv());
    const plan = createCatalogOwnerIntakeApplyPlan({
      mode: "dry-run",
      products: [{ id: "prod_1", slug: "ring-alpha" }],
      replaceMedia: true,
      rows,
    });

    expect(plan.ready).toBe(true);
    expect(plan.products[0]).toEqual(
      expect.objectContaining({
        productFound: true,
        productId: "prod_1",
        productSlug: "ring-alpha",
      }),
    );
    expect(plan.products[0]?.productUpdate.factVerifiedAt).toBe(
      "2026-06-18T00:00:00.000Z",
    );
    expect(plan.products[0]?.mediaReplacement).toHaveLength(6);
    expect(plan.products[0]?.mediaReplacement[0]).toEqual(
      expect.objectContaining({
        isPrimary: true,
        role: "PRIMARY",
        url: "/media/ring-alpha-primary.avif",
      }),
    );
  });

  it("blocks rows whose product slug is not in the database lookup", () => {
    const { rows } = parseCatalogOwnerIntakeRows(createCompleteCsv());
    const plan = createCatalogOwnerIntakeApplyPlan({
      mode: "dry-run",
      products: [],
      replaceMedia: true,
      rows,
    });

    expect(plan.ready).toBe(false);
    expect(plan.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "PRODUCT_NOT_FOUND",
          productSlug: "ring-alpha",
        }),
      ]),
    );
  });

  it("warns when media replacement is not selected", () => {
    const { rows } = parseCatalogOwnerIntakeRows(createCompleteCsv());
    const plan = createCatalogOwnerIntakeApplyPlan({
      mode: "dry-run",
      products: [{ id: "prod_1", slug: "ring-alpha" }],
      replaceMedia: false,
      rows,
    });

    expect(plan.ready).toBe(true);
    expect(plan.issueCounts.warning).toBe(1);
    expect(plan.issues[0]).toEqual(
      expect.objectContaining({ code: "MEDIA_REPLACEMENT_NOT_SELECTED" }),
    );
  });

  it("formats a markdown apply artifact", () => {
    const { rows } = parseCatalogOwnerIntakeRows(createCompleteCsv());
    const plan = createCatalogOwnerIntakeApplyPlan({
      mode: "dry-run",
      products: [{ id: "prod_1", slug: "ring-alpha" }],
      replaceMedia: true,
      rows,
    });

    expect(
      formatCatalogOwnerIntakeApplyPlanMarkdown({
        generatedAt: "2026-06-19T00:00:00.000Z",
        plan,
        sourcePath: "artifacts/qa/catalog-owner-intake.csv",
      }),
    ).toContain("Status: READY");
  });
});

function createCompleteCsv() {
  return [
    catalogOwnerIntakeHeader.join(","),
    renderCsvRow(catalogOwnerIntakeHeader.map((column) => completeRow[column])),
  ].join("\n");
}

const completeRow = {
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
