import { describe, expect, it } from "vitest";

import {
  assertOwnCommerceEnabled,
  isOwnCommerceEnabled,
  isOwnCommerceFlagEnabled,
  orderSalePostingBlockReason,
  OwnCommerceDisabledError,
  ownProductPublicationBlockReason,
} from "./own-commerce";

describe("own-commerce gate flag (ADR 0013)", () => {
  it("is disabled unless explicitly enabled", () => {
    expect(isOwnCommerceFlagEnabled(undefined)).toBe(false);
    expect(isOwnCommerceFlagEnabled("")).toBe(false);
    expect(isOwnCommerceFlagEnabled("0")).toBe(false);
    expect(isOwnCommerceFlagEnabled("false")).toBe(false);
    expect(isOwnCommerceFlagEnabled("no")).toBe(false);

    expect(isOwnCommerceFlagEnabled("1")).toBe(true);
    expect(isOwnCommerceFlagEnabled("true")).toBe(true);
    expect(isOwnCommerceFlagEnabled("TRUE")).toBe(true);
  });

  // The test environment does not set OWN_COMMERCE_ENABLED, which is exactly
  // the launch default: fail closed.
  it("defaults to disabled and the assertion throws with the gate context", () => {
    expect(isOwnCommerceEnabled()).toBe(false);
    expect(() => assertOwnCommerceEnabled("POS sale")).toThrow(
      OwnCommerceDisabledError,
    );
    expect(() => assertOwnCommerceEnabled("POS sale")).toThrow(/POS sale/);
    expect(() => assertOwnCommerceEnabled("POS sale")).toThrow(/0013/);
  });
});

describe("ownProductPublicationBlockReason (ADR 0013)", () => {
  it("blocks publishing an OWN product while own commerce is disabled", () => {
    expect(
      ownProductPublicationBlockReason({
        nextStatus: "ACTIVE",
        ownCommerceEnabled: false,
        source: "OWN",
      }),
    ).toBe("own_commerce_disabled");
  });

  it("allows OWN publication once the gate is open", () => {
    expect(
      ownProductPublicationBlockReason({
        nextStatus: "ACTIVE",
        ownCommerceEnabled: true,
        source: "OWN",
      }),
    ).toBeNull();
  });

  it("never blocks supplier (dropship) products or non-publishing transitions", () => {
    expect(
      ownProductPublicationBlockReason({
        nextStatus: "ACTIVE",
        ownCommerceEnabled: false,
        source: "DROPSHIP_SHOPIFY",
      }),
    ).toBeNull();
    expect(
      ownProductPublicationBlockReason({
        nextStatus: "DRAFT",
        ownCommerceEnabled: false,
        source: "OWN",
      }),
    ).toBeNull();
    expect(
      ownProductPublicationBlockReason({
        nextStatus: "ARCHIVED",
        ownCommerceEnabled: false,
        source: "OWN",
      }),
    ).toBeNull();
  });
});

describe("orderSalePostingBlockReason (ADR 0009)", () => {
  it("allows only OWN_SALE orders into the books", () => {
    expect(orderSalePostingBlockReason("OWN_SALE")).toBeNull();
  });

  it("blocks every non-OWN_SALE treatment, including the fail-closed default", () => {
    for (const treatment of [
      "AGENCY_DROPSHIP",
      "SUPPLIER_MOR_REFERENCE",
      "COMMISSION_ONLY",
      "UNKNOWN_BLOCKED",
    ] as const) {
      expect(orderSalePostingBlockReason(treatment)).toBe(
        "not_own_sale_financial_treatment",
      );
    }
  });
});
