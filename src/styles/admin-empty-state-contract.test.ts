import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const adminPagesWithFilterReset = [
  { file: "src/app/admin/orders/page.tsx", resetHref: "/admin/orders" },
  { file: "src/app/admin/catalog/page.tsx", resetHref: "/admin/catalog" },
  { file: "src/app/admin/service/page.tsx", resetHref: "/admin/service" },
  { file: "src/app/admin/inventory/page.tsx", resetHref: "/admin/inventory" },
  { file: "src/app/admin/audit/page.tsx", resetHref: "/admin/audit" },
] as const;

describe("admin empty-state clarity", () => {
  it("allows table empty states to expose a clear next action", () => {
    const component = read("src/components/ui/table-empty-row.tsx");

    expect(component).toContain("action?: ReactNode");
    expect(component).toContain("{action ? <div");
  });

  it.each(adminPagesWithFilterReset)(
    "keeps filter reset recovery in $file",
    ({ file, resetHref }) => {
      const source = read(file);

      expect(source).toContain("hasActiveFilters ? (");
      expect(source).toContain('size="sm"');
      expect(source).toContain('variant="outline"');
      expect(source).toContain(`href="${resetHref}"`);
    },
  );

  it("keeps audit empty states distinct for filtered and unfiltered data", () => {
    const source = read("src/app/admin/audit/page.tsx");

    expect(source).toContain("אין אירועי audit מתאימים");
    expect(source).toContain("אין אירועי audit");
    expect(source).toContain("שנו סינון או נקו");
    expect(source).toContain('<Link href="/admin/audit">ניקוי סינון</Link>');
  });

  it("keeps admin overview count freshness visible", () => {
    const source = read("src/app/admin/page.tsx");

    expect(source).toContain('data-testid="admin-overview-freshness"');
    expect(source).toContain("overview.freshness.generatedAt.toISOString()");
    expect(source).toContain(
      "formatHebrewDateTime(overview.freshness.generatedAt)",
    );
  });

  it("keeps admin order filters URL-backed and recoverable", () => {
    const source = read("src/app/admin/orders/page.tsx");

    expect(source).toContain('action="/admin/orders"');
    expect(source).toContain('name="query"');
    expect(source).toContain('name="status"');
    expect(source).toContain('name="branchId"');
    expect(source).toContain('name="fulfillmentMethod"');
    expect(source).toContain('name="sort"');
    expect(source).toContain("const activeFilterLabels = [");
    expect(source).toContain("hasActiveFilters");
    expect(source).toContain('<Link href="/admin/orders">');
    expect(source).toContain("activeFilterLabels.map");
  });

  it("keeps service queue empty states distinct for filtered and unfiltered data", () => {
    const source = read("src/app/admin/service/page.tsx");

    expect(source).toContain("אין פניות שירות מתאימות");
    expect(source).toContain("אין פניות שירות");
    expect(source).toContain("לא נמצאו פניות לפי הסינון הנוכחי");
    expect(source).toContain('data-testid="admin-service-active-filters"');
    expect(source).toContain('<Link href="/admin/service">ניקוי סינון</Link>');
  });

  it("keeps integrations outbox and job filters recoverable", () => {
    const source = read("src/app/admin/integrations/page.tsx");

    expect(source).toContain("const outboxStatuses = [");
    expect(source).toContain("const jobRunStatuses = [");
    expect(source).toContain("status: outboxStatusParam(query.outboxStatus)");
    expect(source).toContain("listAdminJobRuns(jobParams)");
    expect(source).toContain("outboxStatusRecoveryCopy");
    expect(source).toContain("jobRunStatusRecoveryCopy");
    expect(source).toContain('name="outboxStatus"');
    expect(source).toContain('name="jobQuery"');
    expect(source).toContain('name="jobStatus"');
    expect(source).toContain("hasActiveOutboxFilters ? (");
    expect(source).toContain("hasActiveJobFilters ? (");
    expect(source).toContain("אין אירועי outbox מתאימים");
    expect(source).toContain("אין ריצות jobs מתאימות");
    expect(source).toContain(
      '<Link href="/admin/integrations">ניקוי סינון</Link>',
    );
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
