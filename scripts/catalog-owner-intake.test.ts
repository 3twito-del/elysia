import { describe, expect, it } from "vitest";

import {
  createCatalogOwnerIntakeCsv,
  parseCatalogOwnerIntakeArgs,
  selectCatalogOwnerIntakeSlugs,
} from "./catalog-owner-intake";

describe("catalog owner intake CLI", () => {
  it("parses audit path, output, selection, and release scope", () => {
    expect(
      parseCatalogOwnerIntakeArgs([
        "--audit",
        "artifacts/qa/run/catalog-readiness.json",
        "--per-class",
        "2",
        "--include-named",
        "--slugs",
        "custom-one, custom-two",
        "--release-scope",
        "wave-0-priority",
        "--out",
        "artifacts/qa/intake/catalog-owner-intake.csv",
      ]),
    ).toEqual({
      auditPath: "artifacts/qa/run/catalog-readiness.json",
      includeAll: false,
      includeNamed: true,
      outPath: "artifacts/qa/intake/catalog-owner-intake.csv",
      perClass: 2,
      releaseScope: "wave-0-priority",
      slugs: ["custom-one", "custom-two"],
    });
  });

  it("selects named products and a bounded per-class seed without approving the slice", () => {
    expect(
      selectCatalogOwnerIntakeSlugs(createProducts(), {
        includeAll: false,
        includeNamed: true,
        perClass: 2,
        slugs: [],
      }),
    ).toEqual([
      "bracelet-alpha",
      "bracelet-beta",
      "earrings-alpha",
      "earrings-beta",
      "hera-bracelet",
      "muse-necklace",
      "ring-alpha",
      "ring-beta",
      "venus-line-ring",
    ]);
  });

  it("renders CSV rows with residual audit risk and escaped values", () => {
    const csv = createCatalogOwnerIntakeCsv({
      products: createProducts(),
      releaseScope: "wave-0,priority",
      selectedSlugs: ["ring-alpha", "missing-slug"],
    });

    expect(csv.split(/\r?\n/u)[0]).toContain(
      "productSlug,priorityTier,releaseScope",
    );
    expect(csv).toContain(
      'ring-alpha,,"wave-0,priority",,,3 blockers; 8 high findings; 1 media; 2 variants; OWN',
    );
    expect(csv).toContain(
      'missing-slug,,"wave-0,priority",,,slug not found in audit',
    );
  });
});

function createProducts() {
  return [
    createProduct("bracelet-alpha"),
    createProduct("bracelet-beta"),
    createProduct("bracelet-gamma"),
    createProduct("earrings-alpha"),
    createProduct("earrings-beta"),
    createProduct("hera-bracelet"),
    createProduct("muse-necklace"),
    createProduct("ring-alpha"),
    createProduct("ring-beta"),
    createProduct("ring-gamma"),
    createProduct("venus-line-ring"),
  ];
}

function createProduct(productSlug: string) {
  return {
    issueCounts: {
      blocker: 3,
      high: 8,
      info: 0,
      medium: 0,
    },
    mediaCount: 1,
    productSlug,
    publishReady: false,
    source: "OWN" as const,
    variantCount: 2,
  };
}
