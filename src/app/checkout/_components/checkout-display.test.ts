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
    ).toBe("הבחירה הזו אינה פנויה כרגע. רעננו את העמוד ונסו שוב.");

    expect(
      getFriendlyCheckoutErrorMessage({
        message: "אחד המחירים דורש אישור אישי לפני השלמת ההזמנה.",
      }),
    ).toBe("אחד המחירים דורש אישור אישי לפני השלמת ההזמנה.");
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
        detail: "2 סוגי תכשיטים יאושרו באתר Elysia לפני סיום התשלום.",
        key: "local",
        label: "פריטי החנות",
      },
      {
        detail: "מסירה עד הבית כלולה לפי הכתובת שתמלאו.",
        key: "delivery",
        label: "מסירה",
      },
      {
        detail: "הפרטים והסכום יאומתו לפני שמירת ההזמנה וסיום התשלום.",
        key: "confirmation",
        label: "אישור",
      },
    ]);
  });

  it("keeps Shopify-only delivery confidence scoped to the supplier checkout", () => {
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
          "סוג תכשיט אחד ימשיך לקופת Shopify; תשלום, כתובת וזמני מסירה ייקבעו שם.",
        key: "supplier",
        label: "פריטי הספק",
      },
      {
        detail: "אין מילוי כתובת באתר; פרטי המסירה ייאספו בקופת Shopify.",
        key: "delivery",
        label: "מסירה",
      },
      {
        detail: "לא נוצרת כאן הזמנה מקומית עבור פריטי ספק בלבד.",
        key: "confirmation",
        label: "אישור",
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
        detail: "סוג תכשיט אחד יאושר באתר Elysia לפני סיום התשלום.",
        key: "local",
        label: "פריטי החנות",
      },
      {
        detail: "2 סוגי תכשיטים ימשיכו לקופת Shopify נפרדת מהפריטים המקומיים.",
        key: "supplier",
        label: "פריטי הספק",
      },
      {
        detail:
          "מסירת פריטי החנות תתואם לפי הכתובת שתמלאו; פריטי הספק יקבלו פרטי מסירה בקופה הנפרדת.",
        key: "delivery",
        label: "מסירה",
      },
      {
        detail:
          "שני המסלולים נשארים נפרדים כדי שלא ליצור הבטחת תשלום או מסירה משותפת.",
        key: "confirmation",
        label: "אישור",
      },
    ]);
  });
});
