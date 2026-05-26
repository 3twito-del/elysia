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

function containsHebrew(value: string) {
  return /[\u0590-\u05ff]/u.test(value);
}

function containsInternalCheckoutTerm(value: string) {
  return /fixture|local cart|cart item|variant|session|database|prisma|trpc|mock/i.test(
    value,
  );
}
