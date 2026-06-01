import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("admin inventory filter and low-stock recovery", () => {
  it("keeps inventory filters recoverable and low-stock context visible", () => {
    const inventoryPage = read("src/app/admin/inventory/page.tsx");

    expect(inventoryPage).toContain("const activeFilterLabels = [");
    expect(inventoryPage).toContain(
      'data-testid="admin-inventory-active-filters"',
    );
    expect(inventoryPage).toContain("getInventorySortLabel");
    expect(inventoryPage).toContain("const lowStockItems = data.items");
    expect(inventoryPage).toContain(
      'data-testid="admin-inventory-low-stock-recovery"',
    );
    expect(inventoryPage).toContain("אין פריטי מלאי שמתאימים לסינון");
    expect(inventoryPage).toContain(
      '<Link href="/admin/inventory">ניקוי סינון</Link>',
    );
    expect(inventoryPage).toContain('basePath="/admin/inventory"');
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
