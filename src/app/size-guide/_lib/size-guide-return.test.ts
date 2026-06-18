import { describe, expect, it } from "vitest";

import { getSafeSizeGuideReturnContext } from "./size-guide-return";

describe("size guide return context", () => {
  it("keeps safe product and category return paths with query context", () => {
    expect(
      getSafeSizeGuideReturnContext(
        "/product/elysia-supplier-silver-halo-ring?q=ring",
        "Elysia Supplier Silver Halo Ring",
      ),
    ).toMatchObject({
      href: "/product/elysia-supplier-silver-halo-ring?q=ring",
      label: "חזרה למוצר",
      surface: "product",
    });

    expect(
      getSafeSizeGuideReturnContext("/category/rings?sort=recommended"),
    ).toMatchObject({
      href: "/category/rings?sort=recommended",
      label: "חזרה לקטגוריה",
      surface: "category",
    });
  });

  it("rejects external, malformed, and unsupported return paths", () => {
    expect(getSafeSizeGuideReturnContext("https://example.com/product/a")).toBe(
      undefined,
    );
    expect(getSafeSizeGuideReturnContext("//example.com/product/a")).toBe(
      undefined,
    );
    expect(getSafeSizeGuideReturnContext("/admin/orders")).toBeUndefined();
    expect(getSafeSizeGuideReturnContext("/product")).toBeUndefined();
    expect(getSafeSizeGuideReturnContext("/product/ring#details")).toBe(
      undefined,
    );
  });
});
