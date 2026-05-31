import { formatPrice } from "~/lib/format";

export const checkoutPriceReviewLabel = "מחיר לאישור";
export const checkoutTotalReviewLabel = "סכום לאישור";
export const checkoutPricingReviewMessage =
  "אחד המחירים דורש אישור אישי לפני השלמת ההזמנה.";

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
    return "הבחירה שלך עדיין ריקה.";
  }

  if (/תכשיט.*לא נמצא|לא נמצא.*תכשיט/u.test(rawMessage)) {
    return "הבחירה הזו אינה פנויה כרגע. רעננו את העמוד ונסו שוב.";
  }

  if (/cart item|product variant/i.test(rawMessage)) {
    return "הבחירה הזו אינה פנויה כרגע. רעננו את העמוד ונסו שוב.";
  }

  if (/fixture cart|local cart|session/i.test(rawMessage)) {
    return "הבחירה שלך עדיין ריקה.";
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
  const localApprovalVerb = localItemCount === 1 ? "יאושר" : "יאושרו";
  const supplierContinuationVerb = dropshipItemCount === 1 ? "ימשיך" : "ימשיכו";

  if (hasOwnItems) {
    rows.push({
      detail: `${formatCheckoutItemTypeCount(localItemCount)} ${localApprovalVerb} באתר Elysia לפני סיום התשלום.`,
      key: "local",
      label: "פריטי החנות",
    });
  }

  if (hasDropshipItems) {
    rows.push({
      detail: hasOwnItems
        ? `${formatCheckoutItemTypeCount(dropshipItemCount)} ${supplierContinuationVerb} לקופת Shopify נפרדת מהפריטים המקומיים.`
        : `${formatCheckoutItemTypeCount(dropshipItemCount)} ${supplierContinuationVerb} לקופת Shopify; תשלום, כתובת וזמני מסירה ייקבעו שם.`,
      key: "supplier",
      label: "פריטי הספק",
    });
  }

  if (hasOwnItems && hasDropshipItems) {
    rows.push({
      detail:
        "מסירת פריטי החנות תתואם לפי הכתובת שתמלאו; פריטי הספק יקבלו פרטי מסירה בקופה הנפרדת.",
      key: "delivery",
      label: "מסירה",
    });
    rows.push({
      detail:
        "שני המסלולים נשארים נפרדים כדי שלא ליצור הבטחת תשלום או מסירה משותפת.",
      key: "confirmation",
      label: "אישור",
    });

    return rows;
  }

  if (hasOwnItems) {
    rows.push({
      detail: `מסירה עד הבית ${getShippingSummaryLabel(shippingLabel)} לפי הכתובת שתמלאו.`,
      key: "delivery",
      label: "מסירה",
    });
    rows.push({
      detail: "הפרטים והסכום יאומתו לפני שמירת ההזמנה וסיום התשלום.",
      key: "confirmation",
      label: "אישור",
    });
  }

  if (hasDropshipItems && !hasOwnItems) {
    rows.push({
      detail: "אין מילוי כתובת באתר; פרטי המסירה ייאספו בקופת Shopify.",
      key: "delivery",
      label: "מסירה",
    });
    rows.push({
      detail: "לא נוצרת כאן הזמנה מקומית עבור פריטי ספק בלבד.",
      key: "confirmation",
      label: "אישור",
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
