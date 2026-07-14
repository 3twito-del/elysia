// Live catalog-quality rollup for the admin surface (master plan C-08).
//
// The rollup itself (severity grouping, owner routing, product-class breakdown)
// is the code-complete `pnpm catalog:quality` data layer. This service only
// wires the same pure functions to the live database so the admin dashboard
// renders the current catalog instead of an offline artifact. It invents no
// facts; it reshapes governed columns and reorganizes findings the readiness
// audit already produces.

import {
  auditCatalogReadiness,
  type CatalogReadinessSeverity,
} from "../../../scripts/lib/catalog-readiness";
import {
  catalogReadinessProductInclude,
  mapPrismaProductToCatalogReadiness,
} from "../../../scripts/lib/catalog-readiness-prisma";
import {
  buildCatalogQualityReport,
  type CatalogQualityReport,
  type CatalogQualitySeverity,
} from "../../../scripts/lib/catalog-quality-report";
import { db } from "~/server/db";

export type { CatalogQualityReport, CatalogQualitySeverity };

export type CatalogQualitySnapshot = {
  generatedAt: Date;
  report: CatalogQualityReport;
  severityTotals: Record<CatalogReadinessSeverity, number>;
};

export async function getCatalogQualitySnapshot(): Promise<CatalogQualitySnapshot> {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE" },
    include: catalogReadinessProductInclude,
    orderBy: [{ slug: "asc" }],
  });

  const products = rows.map(mapPrismaProductToCatalogReadiness);
  // Live media lives on Cloudinary, so local-file existence and content-hash
  // duplicate checks (offline-only concerns) are skipped; the URL-based
  // cross-product duplicate check still runs against the full active catalog.
  const audit = auditCatalogReadiness(products, {
    duplicateMediaReferenceProducts: products,
  });

  return {
    generatedAt: new Date(),
    report: buildCatalogQualityReport(audit),
    severityTotals: audit.issueCounts,
  };
}
