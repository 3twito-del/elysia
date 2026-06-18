import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("admin customer and order filter recovery", () => {
  it("keeps benchmark support evidence available", () => {
    const benchmark = read(
      "docs/qa/admin-customer-order-filter-recovery-benchmark.md",
    );

    expect(benchmark).toContain("I-041");
    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("admin-empty-state-contract");
    expect(benchmark).toContain("admin-service-queue-filter-state");
  });

  it("keeps order filters recoverable and distinct", () => {
    const ordersPage = read("src/app/admin/orders/page.tsx");

    expect(ordersPage).toContain("const activeFilterLabels = [");
    expect(ordersPage).toContain('data-testid="admin-order-active-filters"');
    expect(ordersPage).toContain("getOrderSortLabel");
    expect(ordersPage).toContain("אין הזמנות שמתאימות לסינון");
    expect(ordersPage).toContain("אין הזמנות");
    expect(ordersPage).toContain(
      '<Link href="/admin/orders">ניקוי סינון</Link>',
    );
    expect(ordersPage).toContain('basePath="/admin/orders"');
    expect(indexOf(ordersPage, 'action="/admin/orders"')).toBeLessThan(
      indexOf(ordersPage, 'data-testid="admin-order-active-filters"'),
    );
  });

  it("keeps customer filters recoverable and distinct", () => {
    const customersPage = read("src/app/admin/customers/page.tsx");

    expect(customersPage).toContain("const activeFilterLabels = [");
    expect(customersPage).toContain(
      'data-testid="admin-customer-active-filters"',
    );
    expect(customersPage).toContain("getCustomerSortLabel");
    expect(customersPage).toContain("אין לקוחות שמתאימים לסינון");
    expect(customersPage).toContain("אין לקוחות");
    expect(customersPage).toContain(
      '<Link href="/admin/customers">ניקוי סינון</Link>',
    );
    expect(customersPage).toContain('basePath="/admin/customers"');
    expect(indexOf(customersPage, 'action="/admin/customers"')).toBeLessThan(
      indexOf(customersPage, 'data-testid="admin-customer-active-filters"'),
    );
  });

  it("keeps service queue recovery covered by the shared admin pattern", () => {
    const servicePage = read("src/app/admin/service/page.tsx");

    expect(servicePage).toContain('data-testid="admin-service-active-filters"');
    expect(servicePage).toContain("const activeFilterLabels = [");
    expect(servicePage).toContain(
      '<Link href="/admin/service">ניקוי סינון</Link>',
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);

  expect(index, pattern).toBeGreaterThanOrEqual(0);

  return index;
}
