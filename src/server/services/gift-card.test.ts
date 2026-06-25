import { describe, expect, it } from "vitest";

import {
  applyRedemption,
  splitRedemptionVat,
  summarizeGiftCards,
} from "./gift-card";

describe("applyRedemption", () => {
  it("redeems up to the available balance", () => {
    expect(applyRedemption(100, 30)).toEqual({ applied: 30, newBalance: 70 });
  });

  it("caps redemption at the balance", () => {
    expect(applyRedemption(50, 80)).toEqual({ applied: 50, newBalance: 0 });
  });
});

describe("splitRedemptionVat", () => {
  it("extracts VAT from a VAT-inclusive gross", () => {
    expect(splitRedemptionVat(118, 0.18)).toEqual({ net: 100, vat: 18 });
  });
});

describe("summarizeGiftCards", () => {
  it("totals the outstanding liability of active cards only", () => {
    expect(
      summarizeGiftCards([
        { status: "ACTIVE", balance: 70 },
        { status: "ACTIVE", balance: 30 },
        { status: "DEPLETED", balance: 0 },
        { status: "CANCELLED", balance: 999 },
      ]),
    ).toEqual({ activeCount: 2, outstandingBalance: 100 });
  });
});
