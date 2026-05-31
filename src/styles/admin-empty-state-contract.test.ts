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

  it("keeps integrations outbox and job filters recoverable", () => {
    const source = read("src/app/admin/integrations/page.tsx");

    expect(source).toContain("const outboxStatuses = [");
    expect(source).toContain("const jobRunStatuses = [");
    expect(source).toContain("status: outboxStatusParam(query.outboxStatus)");
    expect(source).toContain("listAdminJobRuns(jobParams)");
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
