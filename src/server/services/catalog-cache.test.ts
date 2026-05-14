import { describe, expect, it } from "vitest";

import {
  CATALOG_CACHE_TAGS,
  categoryCacheTag,
  inventoryCacheTag,
  productCacheTag,
} from "./catalog-cache";

describe("catalog cache tags", () => {
  it("keeps stable tag names for shared catalog resources", () => {
    expect(CATALOG_CACHE_TAGS).toEqual({
      branches: "branches",
      categories: "categories",
      facets: "catalog:facets",
      products: "products",
    });
  });

  it("creates entity-scoped tags used by catalog invalidation", () => {
    expect(productCacheTag("venus-line-ring")).toBe("product:venus-line-ring");
    expect(categoryCacheTag("rings")).toBe("category:rings");
    expect(inventoryCacheTag("tel-aviv")).toBe("inventory:tel-aviv");
  });
});
