import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const adminPagesWithFilterReset = [
  { file: "src/app/admin/orders/page.tsx", resetHref: "/admin/orders" },
  { file: "src/app/admin/catalog/page.tsx", resetHref: "/admin/catalog" },
  { file: "src/app/admin/service/page.tsx", resetHref: "/admin/service" },
  { file: "src/app/admin/inventory/page.tsx", resetHref: "/admin/inventory" },
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
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
