import { describe, expect, it } from "vitest";

import { getProductPublishBlockers } from "./catalog-publish-readiness";

const now = new Date("2026-06-19T12:00:00.000Z");

function completeProduct() {
  return {
    basePrice: 1200,
    careInstructions: "Keep dry",
    countryOfManufacture: "Israel",
    deliveryPromise: "Delivered within seven business days",
    externalHandle: null,
    externalProductId: null,
    externalProvider: null,
    factSourceReference: "supplier-sheet-123",
    factVerifiedAt: new Date("2026-06-18T12:00:00.000Z"),
    factVerifiedBy: "admin-1",
    manufacturerOrImporter: "Elysia Ltd.",
    materialDetails: "14K solid gold",
    measurements: "18 mm by 12 mm",
    media: [
      {
        alt: "Gold ring front view",
        isPrimary: true,
        role: "PRIMARY",
        url: "/products/ring.avif",
      },
    ],
    policySourceReference: "policy-2026-06",
    policyVerifiedAt: new Date("2026-06-18T12:00:00.000Z"),
    policyVerifiedBy: "admin-1",
    returnPolicy: "Returns within 14 days",
    source: "OWN" as const,
    stoneId: null,
    stoneDetails: null,
    supplierKey: null,
    variants: [{ prices: [{ amount: 1200, validTo: null }] }],
    warranty: "One year manufacturing warranty",
  };
}

describe("product publish readiness", () => {
  it("allows a complete and verified product", () => {
    expect(getProductPublishBlockers(completeProduct(), now)).toEqual([]);
  });

  it("reports exact missing truth, policy, media, and price fields", () => {
    const product = completeProduct();

    expect(
      getProductPublishBlockers(
        {
          ...product,
          countryOfManufacture: null,
          factVerifiedAt: null,
          media: [],
          returnPolicy: null,
          variants: [],
        },
        now,
      ),
    ).toEqual([
      "COUNTRY_OF_MANUFACTURE_MISSING",
      "RETURN_POLICY_MISSING",
      "FACT_VERIFICATION_MISSING",
      "PRIMARY_MEDIA_MISSING",
      "VARIANT_PRICE_MISSING",
    ]);
  });

  it("requires stone facts and supplier mapping only when applicable", () => {
    const product = completeProduct();

    expect(
      getProductPublishBlockers(
        {
          ...product,
          source: "DROPSHIP_SHOPIFY",
          stoneId: "stone-1",
        },
        now,
      ),
    ).toEqual(["STONE_DETAILS_MISSING", "SHOPIFY_MAPPING_MISSING"]);
  });
});
