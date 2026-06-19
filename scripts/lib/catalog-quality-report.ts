// Catalog quality report for master-plan item C-08.
//
// This turns a catalog-readiness audit artifact into an owner-facing rollup:
// blockers grouped by finding code and by product class, with the responsible
// owner role and the exact affected products. It is pure and deterministic and
// invents no facts; it only reorganizes findings the audit already produced.

export type CatalogQualitySeverity = "blocker" | "high" | "medium" | "info";

export type CatalogQualityIssue = {
  category?: string;
  code: string;
  field?: string;
  message?: string;
  productSlug?: string;
  severity: CatalogQualitySeverity;
};

export type CatalogQualityProduct = {
  productSlug: string;
  publishReady: boolean;
  source?: string;
  mediaCount?: number;
  variantCount?: number;
  issueCounts?: Record<CatalogQualitySeverity, number>;
};

export type CatalogQualityAudit = {
  issues: CatalogQualityIssue[];
  productCount: number;
  products: CatalogQualityProduct[];
  publishReadyCount: number;
  ready: boolean;
};

export type CatalogQualityFindingGroup = {
  affectedProducts: number;
  code: string;
  count: number;
  ownerRole: string;
  sampleProducts: string[];
  severity: CatalogQualitySeverity;
};

export type CatalogQualityClassGroup = {
  productClass: string;
  products: number;
  publishReady: number;
  blockers: number;
  high: number;
};

export type CatalogQualityReport = {
  classBreakdown: CatalogQualityClassGroup[];
  findingBreakdown: CatalogQualityFindingGroup[];
  productCount: number;
  publishReadyCount: number;
  ready: boolean;
  totalBlockers: number;
  totalHigh: number;
};

// Owner role per finding code, mirroring the remediation plan. Anything not
// listed falls back to a neutral "Catalog operations" so a new audit code never
// silently drops out of the report.
const ownerRoleByCode: Record<string, string> = {
  FACT_VERIFICATION_MISSING: "Merchandising / product truth owner",
  STRUCTURED_SPECIFICATIONS_MISSING: "Merchandising / product truth owner",
  POLICY_VERIFICATION_MISSING: "Legal / operations owner",
  LOCAL_MEDIA_FILE_MISSING: "Creative / catalog operations",
  MEDIA_ROLE_MISSING: "Creative / catalog operations",
  MEDIA_SET_INCOMPLETE: "Creative / catalog operations",
  MEDIA_URL_SHARED_ACROSS_PRODUCTS: "Creative / catalog operations",
  MEDIA_CONTENT_DUPLICATED_ACROSS_PRODUCTS: "Creative / catalog operations",
  CATALOG_EMPTY: "Engineering / catalog operations",
};

export function ownerRoleForCode(code: string): string {
  return ownerRoleByCode[code] ?? "Catalog operations";
}

// Product class is derived from the slug prefix (e.g. "ring-...", "bracelet-...").
// Named hero products keep their own class so they remain visible in the rollup.
export function productClassFromSlug(slug: string): string {
  const prefix = slug.split("-")[0];
  return prefix && prefix.length > 0 ? prefix : "unknown";
}

const severityRank: Record<CatalogQualitySeverity, number> = {
  blocker: 0,
  high: 1,
  medium: 2,
  info: 3,
};

export function buildCatalogQualityReport(
  audit: CatalogQualityAudit,
  options: { sampleSize?: number } = {},
): CatalogQualityReport {
  const sampleSize = options.sampleSize ?? 5;

  const byCode = new Map<
    string,
    {
      code: string;
      severity: CatalogQualitySeverity;
      count: number;
      products: Set<string>;
    }
  >();

  for (const issue of audit.issues) {
    const existing = byCode.get(issue.code);
    if (existing) {
      existing.count += 1;
      if (issue.productSlug) existing.products.add(issue.productSlug);
    } else {
      byCode.set(issue.code, {
        code: issue.code,
        severity: issue.severity,
        count: 1,
        products: new Set(issue.productSlug ? [issue.productSlug] : []),
      });
    }
  }

  const findingBreakdown: CatalogQualityFindingGroup[] = [...byCode.values()]
    .map((group) => ({
      affectedProducts: group.products.size,
      code: group.code,
      count: group.count,
      ownerRole: ownerRoleForCode(group.code),
      sampleProducts: [...group.products].sort().slice(0, sampleSize),
      severity: group.severity,
    }))
    .sort(
      (left, right) =>
        severityRank[left.severity] - severityRank[right.severity] ||
        right.count - left.count ||
        left.code.localeCompare(right.code),
    );

  const byClass = new Map<string, CatalogQualityClassGroup>();
  for (const product of audit.products) {
    const productClass = productClassFromSlug(product.productSlug);
    const entry = byClass.get(productClass) ?? {
      productClass,
      products: 0,
      publishReady: 0,
      blockers: 0,
      high: 0,
    };
    entry.products += 1;
    if (product.publishReady) entry.publishReady += 1;
    entry.blockers += product.issueCounts?.blocker ?? 0;
    entry.high += product.issueCounts?.high ?? 0;
    byClass.set(productClass, entry);
  }

  const classBreakdown = [...byClass.values()].sort(
    (left, right) =>
      right.blockers - left.blockers ||
      left.productClass.localeCompare(right.productClass),
  );

  return {
    classBreakdown,
    findingBreakdown,
    productCount: audit.productCount,
    publishReadyCount: audit.publishReadyCount,
    ready: audit.ready,
    totalBlockers: audit.products.reduce(
      (sum, product) => sum + (product.issueCounts?.blocker ?? 0),
      0,
    ),
    totalHigh: audit.products.reduce(
      (sum, product) => sum + (product.issueCounts?.high ?? 0),
      0,
    ),
  };
}

const severityLabel: Record<CatalogQualitySeverity, string> = {
  blocker: "Blocker",
  high: "High",
  medium: "Medium",
  info: "Info",
};

export function formatCatalogQualityReportMarkdown(input: {
  generatedAt: string;
  report: CatalogQualityReport;
  source: string;
}): string {
  const { report } = input;
  const lines: string[] = [
    "# Catalog Quality Report",
    "",
    `Generated: ${input.generatedAt}`,
    `Source: ${input.source}`,
    `Status: ${report.ready ? "PASS" : "FAIL"}`,
    "",
    "Owner-facing rollup of the catalog-readiness audit (master plan C-08). It",
    "reorganizes existing findings by owner and product class so blockers can be",
    "routed before a customer encounters them. It invents no facts.",
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Products audited | ${report.productCount} |`,
    `| Publish-ready products | ${report.publishReadyCount} |`,
    `| Product-level blockers | ${report.totalBlockers} |`,
    `| Product-level high findings | ${report.totalHigh} |`,
    "",
    "## Findings By Owner",
    "",
    "| Severity | Code | Count | Affected products | Owner role | Sample products |",
    "| --- | --- | ---: | ---: | --- | --- |",
  ];

  for (const finding of report.findingBreakdown) {
    const sample =
      finding.sampleProducts.length > 0
        ? finding.sampleProducts.map((slug) => `\`${slug}\``).join(", ")
        : "—";
    lines.push(
      `| ${severityLabel[finding.severity]} | \`${finding.code}\` | ${finding.count} | ${finding.affectedProducts} | ${finding.ownerRole} | ${sample} |`,
    );
  }

  lines.push(
    "",
    "## Findings By Product Class",
    "",
    "| Product class | Products | Publish-ready | Blockers | High |",
    "| --- | ---: | ---: | ---: | ---: |",
  );

  for (const group of report.classBreakdown) {
    lines.push(
      `| \`${group.productClass}\` | ${group.products} | ${group.publishReady} | ${group.blockers} | ${group.high} |`,
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}
