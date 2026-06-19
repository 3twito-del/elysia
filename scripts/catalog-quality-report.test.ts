import { describe, expect, it } from "vitest";

import {
  buildCatalogQualityReport,
  formatCatalogQualityReportMarkdown,
  ownerRoleForCode,
  productClassFromSlug,
  type CatalogQualityAudit,
} from "./lib/catalog-quality-report";
import {
  parseCatalogQualityReportArgs,
  readCatalogQualityAudit,
} from "./catalog-quality-report";

const audit: CatalogQualityAudit = {
  productCount: 3,
  publishReadyCount: 1,
  ready: false,
  issues: [
    {
      code: "FACT_VERIFICATION_MISSING",
      severity: "blocker",
      productSlug: "ring-b",
    },
    {
      code: "FACT_VERIFICATION_MISSING",
      severity: "blocker",
      productSlug: "necklace-a",
    },
    {
      code: "MEDIA_ROLE_MISSING",
      severity: "high",
      productSlug: "ring-b",
    },
  ],
  products: [
    {
      productSlug: "ring-b",
      publishReady: false,
      issueCounts: { blocker: 1, high: 1, medium: 0, info: 0 },
    },
    {
      productSlug: "necklace-a",
      publishReady: false,
      issueCounts: { blocker: 1, high: 0, medium: 0, info: 0 },
    },
    {
      productSlug: "ring-c",
      publishReady: true,
      issueCounts: { blocker: 0, high: 0, medium: 0, info: 0 },
    },
  ],
};

describe("catalog quality report model", () => {
  it("maps owner roles and falls back for unknown codes", () => {
    expect(ownerRoleForCode("FACT_VERIFICATION_MISSING")).toContain(
      "product truth",
    );
    expect(ownerRoleForCode("POLICY_VERIFICATION_MISSING")).toContain("Legal");
    expect(ownerRoleForCode("SOMETHING_NEW")).toBe("Catalog operations");
  });

  it("derives product class from slug prefix", () => {
    expect(productClassFromSlug("ring-alma-1")).toBe("ring");
    expect(productClassFromSlug("muse-necklace")).toBe("muse");
    expect(productClassFromSlug("")).toBe("unknown");
  });

  it("groups findings by code with affected product counts", () => {
    const report = buildCatalogQualityReport(audit);

    const fact = report.findingBreakdown.find(
      (group) => group.code === "FACT_VERIFICATION_MISSING",
    );
    expect(fact?.count).toBe(2);
    expect(fact?.affectedProducts).toBe(2);
    expect(fact?.sampleProducts).toEqual(["necklace-a", "ring-b"]);

    // Blockers are ordered before high findings.
    expect(report.findingBreakdown[0]?.severity).toBe("blocker");
  });

  it("rolls up by product class and totals", () => {
    const report = buildCatalogQualityReport(audit);

    expect(report.totalBlockers).toBe(2);
    expect(report.totalHigh).toBe(1);
    const ring = report.classBreakdown.find(
      (group) => group.productClass === "ring",
    );
    expect(ring?.products).toBe(2);
    expect(ring?.publishReady).toBe(1);
    expect(ring?.blockers).toBe(1);
  });

  it("renders markdown with owner table", () => {
    const markdown = formatCatalogQualityReportMarkdown({
      generatedAt: "2026-06-19T00:00:00.000Z",
      report: buildCatalogQualityReport(audit),
      source: "catalog-readiness.json",
    });

    expect(markdown).toContain("Status: FAIL");
    expect(markdown).toContain("FACT_VERIFICATION_MISSING");
    expect(markdown).toContain("Findings By Product Class");
  });
});

describe("catalog quality report CLI", () => {
  it("parses audit, output, sample, and strict flags", () => {
    expect(
      parseCatalogQualityReportArgs([
        "--audit",
        "catalog-readiness.json",
        "--out-dir",
        "artifacts/quality",
        "--sample-size",
        "8",
        "--strict",
      ]),
    ).toEqual({
      auditPath: "catalog-readiness.json",
      outDir: "artifacts/quality",
      sampleSize: 8,
      strict: true,
    });
  });

  it("reads an audit artifact and rejects malformed input", () => {
    expect(
      readCatalogQualityAudit(JSON.stringify({ audit })).productCount,
    ).toBe(3);
    expect(() => readCatalogQualityAudit("{}")).toThrow(/audit/u);
  });
});
