import { describe, expect, it } from "vitest";

import {
  checkoutPriceReviewLabel,
  checkoutTotalReviewLabel,
  getCheckoutAmountLabel,
  getFriendlyCheckoutErrorMessage,
  hasCheckoutPricingReview,
} from "./checkout-display";

describe("checkout display helpers", () => {
  it("marks cart items with zero pricing for review instead of formatting zero shekels", () => {
    expect(
      hasCheckoutPricingReview({
        items: [{ lineTotal: 0, quantity: 1, unitPrice: 0 }],
        subtotal: 0,
        total: 29,
      }),
    ).toBe(true);

    expect(
      getCheckoutAmountLabel(0, {
        requiresPositive: true,
      }),
    ).toBe(checkoutPriceReviewLabel);
  });

  it("keeps valid checkout totals formatted", () => {
    expect(
      hasCheckoutPricingReview({
        items: [{ lineTotal: 1290, quantity: 1, unitPrice: 1290 }],
        subtotal: 1290,
        total: 1319,
      }),
    ).toBe(false);

    expect(
      getCheckoutAmountLabel(0, {
        requiresPositive: true,
        reviewLabel: checkoutTotalReviewLabel,
      }),
    ).toBe(checkoutTotalReviewLabel);
  });

  it("replaces internal checkout errors with friendly Hebrew copy", () => {
    expect(
      getFriendlyCheckoutErrorMessage({
        message: "Fixture cart item was not found.",
      }),
    ).toBe("הפריט כבר לא זמין בסל. רעננו את העמוד ונסו שוב.");

    expect(
      getFriendlyCheckoutErrorMessage({
        message: "מחיר אחד הפריטים דורש בדיקה לפני שמירת ההזמנה.",
      }),
    ).toBe("מחיר אחד הפריטים דורש בדיקה לפני שמירת ההזמנה.");
  });
});
