import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTagMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
}));

import {
  getCatalogMutationRevalidationTags,
  revalidateCatalogMutation,
  revalidateCatalogTags,
} from "./catalog-revalidation";

describe("catalog revalidation", () => {
  beforeEach(() => {
    revalidateTagMock.mockClear();
  });

  it("deduplicates tags and revalidates with the max cache profile", () => {
    revalidateCatalogTags(["products", "products", "category:rings"]);

    expect(revalidateTagMock).toHaveBeenCalledTimes(2);
    expect(revalidateTagMock).toHaveBeenNthCalledWith(1, "products", "max");
    expect(revalidateTagMock).toHaveBeenNthCalledWith(
      2,
      "category:rings",
      "max",
    );
  });

  it("returns global, product, category, branch, and inventory tags for mutations", () => {
    expect(
      getCatalogMutationRevalidationTags({
        branchSlugs: ["tel-aviv", "tel-aviv"],
        categorySlugs: ["rings"],
        productSlugs: ["venus-line-ring"],
      }),
    ).toEqual([
      "products",
      "catalog:facets",
      "categories",
      "branches",
      "product:venus-line-ring",
      "category:rings",
      "inventory:tel-aviv",
      "inventory:tel-aviv",
    ]);
  });

  it("revalidates global, product, category, and inventory tags for mutations", () => {
    revalidateCatalogMutation({
      branchSlugs: ["tel-aviv", "tel-aviv"],
      categorySlugs: ["rings"],
      productSlugs: ["venus-line-ring"],
    });

    expect(revalidateTagMock.mock.calls).toEqual([
      ["products", "max"],
      ["catalog:facets", "max"],
      ["categories", "max"],
      ["branches", "max"],
      ["product:venus-line-ring", "max"],
      ["category:rings", "max"],
      ["inventory:tel-aviv", "max"],
    ]);
  });
});
