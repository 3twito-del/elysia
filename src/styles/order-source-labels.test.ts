import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("order source labels", () => {
  it("keeps account order cards source-specific", () => {
    const accountPage = read("src/app/account/page.tsx");
    const accountOrderDetail = read("src/app/account/orders/[id]/page.tsx");

    expect(accountPage).toContain('data-testid="account-local-order"');
    expect(accountPage).toContain('data-testid="account-shopify-mirror-order"');
    expect(accountPage).toContain('getOrderSourceLabel("LOCAL")');
    expect(accountPage).toContain('getOrderSourceLabel("SHOPIFY_MIRROR")');
    expect(accountPage).toContain("getShopifyFinancialStatusLabel");
    expect(accountPage).toContain("getShopifyFulfillmentStatusLabel");
    expect(accountOrderDetail).toContain('getOrderSourceLabel("LOCAL")');
    expect(accountOrderDetail).not.toContain("SHOPIFY_MIRROR");
  });

  it("keeps admin local actions separate from Shopify mirror rows", () => {
    const adminOrdersPage = read("src/app/admin/orders/page.tsx");
    const adminOrderDetail = read("src/app/admin/orders/[id]/page.tsx");

    expect(adminOrdersPage).toContain('data-testid="admin-local-order-row"');
    expect(adminOrdersPage).toContain('data-testid="admin-shopify-mirror-row"');
    expect(adminOrdersPage).toContain('data-testid="admin-shopify-mirrors"');
    expect(adminOrdersPage).toContain("shopifyMirrorsHiddenByLocalFilters");
    expect(adminOrdersPage).toContain("פתיחה ב-Shopify");
    expect(adminOrdersPage).toContain("לקריאה בלבד");
    expect(adminOrderDetail).toContain("פעולות תפעול מקומיות");
    expect(adminOrderDetail).toContain('getOrderSourceLabel("LOCAL")');
    expect(adminOrderDetail).not.toContain("SHOPIFY_MIRROR");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
