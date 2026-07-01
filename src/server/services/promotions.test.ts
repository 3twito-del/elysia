import { describe, expect, it } from "vitest";

import {
  bogoDiscount,
  categorySubtotal,
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
    categoryId: null,
    buyQuantity: 0,
    getQuantity: 0,
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

function discountInput(overrides: Partial<PromotionRule>) {
  const p = promo(overrides);
  return {
    type: p.type,
    value: p.value,
    categoryId: p.categoryId,
    buyQuantity: p.buyQuantity,
    getQuantity: p.getQuantity,
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
    expect(promotionDiscount(discountInput({ type: "PERCENT", value: 10 }), { subtotal: 1000, itemCount: 1 })).toBe(100);
    expect(promotionDiscount(discountInput({ type: "FIXED", value: 5000 }), { subtotal: 300, itemCount: 1 })).toBe(300);
    expect(promotionDiscount(discountInput({ type: "FREE_SHIPPING", value: 0 }), { subtotal: 300, itemCount: 1 })).toBe(0);
  });
});

describe("categorySubtotal + category-scoped discount", () => {
  const items = [
    { price: 100, quantity: 2, categoryId: "rings" },
    { price: 50, quantity: 1, categoryId: "gifts" },
  ];

  it("sums only the matching category", () => {
    expect(categorySubtotal(items, "rings")).toBe(200);
    expect(categorySubtotal(items, "gifts")).toBe(50);
  });

  it("scopes a percent discount to the category subtotal", () => {
    expect(
      promotionDiscount(discountInput({ type: "PERCENT", value: 10, categoryId: "rings" }), {
        subtotal: 250,
        itemCount: 3,
        items,
      }),
    ).toBe(20); // 10% of 200 (rings only), not of 250
  });
});

describe("bogoDiscount", () => {
  it("makes the cheapest units free per buy+get set", () => {
    // buy 2 get 1: 6 units → 2 sets → 2 free (cheapest)
    const items = [
      { price: 100, quantity: 2 },
      { price: 40, quantity: 4 },
    ];
    expect(bogoDiscount(items, 2, 1)).toBe(80); // two cheapest @40
  });

  it("returns 0 without a full set or invalid config", () => {
    expect(bogoDiscount([{ price: 100, quantity: 2 }], 2, 1)).toBe(0);
    expect(bogoDiscount([{ price: 100, quantity: 3 }], 0, 1)).toBe(0);
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
