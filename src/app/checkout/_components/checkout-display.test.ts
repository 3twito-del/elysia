import { describe, expect, it } from "vitest";

import {
  checkoutPriceReviewLabel,
  checkoutTotalReviewLabel,
  getCheckoutFulfillmentSummaryRows,
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
    ).toBe("התכשיט אינו פנוי כרגע. רעננו ונסו שוב.");

    expect(
      getFriendlyCheckoutErrorMessage({
        message: "אחד המחירים דורש בדיקה לפני שתמשיכי לתשלום.",
      }),
    ).toBe("אחד המחירים דורש בדיקה לפני שתמשיכי לתשלום.");
  });

  it("summarizes local delivery confidence without exact fulfillment promises", () => {
    expect(
      getCheckoutFulfillmentSummaryRows({
        dropshipItemCount: 0,
        hasDropshipItems: false,
        hasOwnItems: true,
        localItemCount: 2,
        shippingLabel: "כלול",
      }),
    ).toEqual([
      {
        detail: "2 סוגי תכשיטים מוצגים באתר Elysia לפני תשלום.",
        key: "local",
        label: "פריטי החנות",
      },
      {
        detail: "מסירה עד הבית כלולה לפי הכתובת.",
        key: "delivery",
        label: "מסירה",
      },
      {
        detail: "הסיכום נשמר לפני המעבר לתשלום.",
        key: "confirmation",
        label: "תשלום",
      },
    ]);
  });

  it("keeps separate-checkout delivery confidence scoped to the separate checkout", () => {
    const rows = getCheckoutFulfillmentSummaryRows({
      dropshipItemCount: 1,
      hasDropshipItems: true,
      hasOwnItems: false,
      localItemCount: 0,
      shippingLabel: "כלול",
    });

    expect(rows).toEqual([
      {
        detail:
          "סוג תכשיט אחד ימשיך לקופה נפרדת; תשלום ומסירה ייקבעו שם.",
        key: "supplier",
        label: "פריטים נפרדים",
      },
      {
        detail: "אין מילוי כתובת באתר; פרטי המסירה ייאספו בקופה הנפרדת.",
        key: "delivery",
        label: "מסירה",
      },
      {
        detail: "ההזמנה תמשיך במסלול התשלום הנפרד.",
        key: "confirmation",
        label: "תשלום",
      },
    ]);
    expect(rows.map((row) => row.detail).join(" ")).not.toMatch(/יסופק|יישלח/u);
  });

  it("keeps mixed cart confidence split by fulfillment source", () => {
    expect(
      getCheckoutFulfillmentSummaryRows({
        dropshipItemCount: 2,
        hasDropshipItems: true,
        hasOwnItems: true,
        localItemCount: 1,
        shippingLabel: "₪29",
      }),
    ).toEqual([
      {
        detail: "סוג תכשיט אחד מוצג באתר Elysia לפני תשלום.",
        key: "local",
        label: "פריטי החנות",
      },
      {
        detail: "2 סוגי תכשיטים ימשיכו לקופה נפרדת.",
        key: "supplier",
        label: "פריטים נפרדים",
      },
      {
        detail:
          "מסירת פריטי חנות תתואם לפי הכתובת; פריטים נפרדים יקבלו מסירה בקופה נפרדת.",
        key: "delivery",
        label: "מסירה",
      },
      {
        detail:
          "שני מסלולי התשלום נשארים נפרדים וברורים.",
        key: "confirmation",
        label: "תשלום",
      },
    ]);
  });
});
