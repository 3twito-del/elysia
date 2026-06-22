import { formatPrice } from "~/lib/format";

export const checkoutPriceReviewLabel = "מחיר לבדיקה";
export const checkoutTotalReviewLabel = "סכום לבדיקה";
export const checkoutPricingReviewMessage =
  "אחד המחירים דורש בדיקה לפני שתמשיכי לתשלום.";

type CheckoutDisplayError = {
  message?: string;
};

export type CheckoutPricedItem = {
  lineTotal: number;
  quantity: number;
  unitPrice: number;
};

export type CheckoutFulfillmentSummaryInput = {
  dropshipItemCount: number;
  hasDropshipItems: boolean;
  hasOwnItems: boolean;
  localItemCount: number;
  shippingLabel: string;
};

export type CheckoutFulfillmentSummaryRow = {
  detail: string;
  key: "local" | "supplier" | "delivery" | "confirmation";
  label: string;
};

export function isPositiveCheckoutAmount(amount: number) {
  return Number.isFinite(amount) && amount > 0;
}

export function isCheckoutItemPriceReady(item: CheckoutPricedItem) {
  return (
    item.quantity > 0 &&
    isPositiveCheckoutAmount(item.unitPrice) &&
    isPositiveCheckoutAmount(item.lineTotal)
  );
}

export function hasCheckoutPricingReview(input: {
  items: CheckoutPricedItem[];
  subtotal: number;
  total: number;
}) {
  if (input.items.length === 0) return false;

  return (
    input.items.some((item) => !isCheckoutItemPriceReady(item)) ||
    !isPositiveCheckoutAmount(input.subtotal) ||
    !isPositiveCheckoutAmount(input.total)
  );
}

export function getCheckoutAmountLabel(
  amount: number,
  options: {
    requiresPositive?: boolean;
    reviewLabel?: string;
  } = {},
) {
  if (options.requiresPositive && !isPositiveCheckoutAmount(amount)) {
    return options.reviewLabel ?? checkoutPriceReviewLabel;
  }

  return formatPrice(amount);
}

export function getFriendlyCheckoutErrorMessage(
  error: CheckoutDisplayError | null | undefined,
  fallback = "לא הצלחנו להשלים את הבקשה כרגע. נסו שוב בעוד רגע.",
) {
  const rawMessage = error?.message?.trim();

  if (!rawMessage) return fallback;

  if (/סל.*ריק/u.test(rawMessage) || rawMessage.includes("לא נמצא סל")) {
    return "הסל עדיין ריק.";
  }

  if (/תכשיט.*לא נמצא|לא נמצא.*תכשיט/u.test(rawMessage)) {
    return "התכשיט אינו פנוי כרגע. רעננו ונסו שוב.";
  }

  if (/cart item|product variant/i.test(rawMessage)) {
    return "התכשיט אינו פנוי כרגע. רעננו ונסו שוב.";
  }

  if (/fixture cart|local cart|session/i.test(rawMessage)) {
    return "הסל עדיין ריק.";
  }

  if (/מחיר|הטבה|כתובת/u.test(rawMessage)) {
    return rawMessage;
  }

  if (containsInternalCheckoutTerm(rawMessage) || !containsHebrew(rawMessage)) {
    return fallback;
  }

  return rawMessage;
}

export function getCheckoutFulfillmentSummaryRows({
  dropshipItemCount,
  hasDropshipItems,
  hasOwnItems,
  localItemCount,
  shippingLabel,
}: CheckoutFulfillmentSummaryInput): CheckoutFulfillmentSummaryRow[] {
  const rows: CheckoutFulfillmentSummaryRow[] = [];
  const localDisplayVerb = localItemCount === 1 ? "מוצג" : "מוצגים";
  const supplierContinuationVerb = dropshipItemCount === 1 ? "ימשיך" : "ימשיכו";

  if (hasOwnItems) {
    rows.push({
      detail: `${formatCheckoutItemTypeCount(localItemCount)} ${localDisplayVerb} באתר Elysia לפני תשלום.`,
      key: "local",
      label: "פריטי החנות",
    });
  }

  if (hasDropshipItems) {
    rows.push({
      detail: hasOwnItems
        ? `${formatCheckoutItemTypeCount(dropshipItemCount)} ${supplierContinuationVerb} לקופה נפרדת.`
        : `${formatCheckoutItemTypeCount(dropshipItemCount)} ${supplierContinuationVerb} לקופה נפרדת; תשלום ומסירה ייקבעו שם.`,
      key: "supplier",
      label: "פריטים נפרדים",
    });
  }

  if (hasOwnItems && hasDropshipItems) {
    rows.push({
      detail:
        "מסירת פריטי חנות תתואם לפי הכתובת; פריטים נפרדים יקבלו מסירה בקופה נפרדת.",
      key: "delivery",
      label: "מסירה",
    });
    rows.push({
      detail: "שני מסלולי התשלום נשארים נפרדים וברורים.",
      key: "confirmation",
      label: "תשלום",
    });

    return rows;
  }

  if (hasOwnItems) {
    rows.push({
      detail: `מסירה עד הבית ${getShippingSummaryLabel(shippingLabel)} לפי הכתובת.`,
      key: "delivery",
      label: "מסירה",
    });
    rows.push({
      detail: "הסיכום נשמר לפני המעבר לתשלום.",
      key: "confirmation",
      label: "תשלום",
    });
  }

  if (hasDropshipItems && !hasOwnItems) {
    rows.push({
      detail: "אין מילוי כתובת באתר; פרטי המסירה ייאספו בקופה הנפרדת.",
      key: "delivery",
      label: "מסירה",
    });
    rows.push({
      detail: "ההזמנה תמשיך במסלול התשלום הנפרד.",
      key: "confirmation",
      label: "תשלום",
    });
  }

  return rows;
}

function containsHebrew(value: string) {
  return /[\u0590-\u05ff]/u.test(value);
}

function containsInternalCheckoutTerm(value: string) {
  return /fixture|local cart|cart item|variant|session|database|prisma|trpc|mock/i.test(
    value,
  );
}

function formatCheckoutItemTypeCount(count: number) {
  if (count === 1) return "סוג תכשיט אחד";

  return `${count} סוגי תכשיטים`;
}

function getShippingSummaryLabel(shippingLabel: string) {
  if (shippingLabel === "כלול") return "כלולה";

  return `תחושב כ-${shippingLabel}`;
}
