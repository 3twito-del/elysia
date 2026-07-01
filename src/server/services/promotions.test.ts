import { describe, expect, it } from "vitest";

import {
  evaluatePromotions,
  isPromotionActive,
  meetsConditions,
  promotionDiscount,
  type PromotionRule,
} from "./promotions";

const now = new Date("2026-06-27T00:00:00Z");

function promo(overrides: Partial<PromotionRule>): PromotionRule {
  return {
    id: "p",
    name: "promo",
    type: "PERCENT",
    value: 10,
    minCartTotal: 0,
    minQuantity: 0,
    priority: 100,
    stackable: false,
    isActive: true,
    startsAt: null,
    endsAt: null,
    ...overrides,
  };
}

describe("isPromotionActive", () => {
  it("respects the active flag and date window", () => {
    expect(isPromotionActive(promo({}), now)).toBe(true);
    expect(isPromotionActive(promo({ isActive: false }), now)).toBe(false);
    expect(
      isPromotionActive(promo({ startsAt: new Date("2026-07-01") }), now),
    ).toBe(false);
    expect(
      isPromotionActive(promo({ endsAt: new Date("2026-06-01") }), now),
    ).toBe(false);
  });
});

describe("meetsConditions + promotionDiscount", () => {
  it("gates by cart total and quantity", () => {
    expect(meetsConditions(promo({ minCartTotal: 500 }), { subtotal: 400, itemCount: 1 })).toBe(false);
    expect(meetsConditions(promo({ minQuantity: 2 }), { subtotal: 999, itemCount: 2 })).toBe(true);
  });

  it("computes percent, fixed (capped) and free-shipping discounts", () => {
    expect(promotionDiscount({ type: "PERCENT", value: 10 }, { subtotal: 1000, itemCount: 1 })).toBe(100);
    expect(promotionDiscount({ type: "FIXED", value: 5000 }, { subtotal: 300, itemCount: 1 })).toBe(300);
    expect(promotionDiscount({ type: "FREE_SHIPPING", value: 0 }, { subtotal: 300, itemCount: 1 })).toBe(0);
  });
});

describe("evaluatePromotions", () => {
  it("picks the best non-stackable and adds stackable ones", () => {
    const result = evaluatePromotions({
      cart: { subtotal: 1000, itemCount: 3 },
      now,
      promotions: [
        promo({ id: "a", name: "10%", type: "PERCENT", value: 10, priority: 10 }),
        promo({ id: "b", name: "₪150", type: "FIXED", value: 150, priority: 20 }),
        promo({ id: "c", name: "stack ₪50", type: "FIXED", value: 50, stackable: true, priority: 30 }),
        promo({ id: "d", name: "ship", type: "FREE_SHIPPING", value: 0, stackable: true, priority: 5 }),
      ],
    });
    // best non-stackable = ₪150 (vs 10%→100); + stackable ₪50; free shipping flagged
    expect(result.freeShipping).toBe(true);
    expect(result.totalDiscount).toBe(200);
    expect(result.applied.map((a) => a.id).sort()).toEqual(["b", "c", "d"]);
  });

  it("excludes ineligible promotions and caps at subtotal", () => {
    const result = evaluatePromotions({
      cart: { subtotal: 100, itemCount: 1 },
      now,
      promotions: [
        promo({ id: "big", type: "FIXED", value: 500, stackable: true }),
        promo({ id: "gated", type: "PERCENT", value: 50, minCartTotal: 1000 }),
      ],
    });
    expect(result.applied.map((a) => a.id)).toEqual(["big"]);
    expect(result.totalDiscount).toBe(100); // capped at subtotal
  });
});
