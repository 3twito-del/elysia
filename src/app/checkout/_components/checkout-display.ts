import { formatPrice } from "~/lib/format";

export const checkoutPriceReviewLabel = "מחיר בבדיקה";
export const checkoutTotalReviewLabel = "סכום בבדיקה";
export const checkoutPricingReviewMessage =
  "מחיר אחד הפריטים דורש בדיקה לפני שמירת ההזמנה. נציג יאשר את הפרטים לפני חיוב.";

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
  fallback = "לא הצלחנו להשלים את הפעולה כרגע. נסו שוב בעוד רגע.",
) {
  const rawMessage = error?.message?.trim();

  if (!rawMessage) return fallback;

  if (/סל.*ריק/u.test(rawMessage) || rawMessage.includes("לא נמצא סל")) {
    return "הסל שלך עדיין ריק.";
  }

  if (/פריט.*לא נמצא|לא נמצא.*פריט/u.test(rawMessage)) {
    return "הפריט כבר לא זמין בסל. רעננו את העמוד ונסו שוב.";
  }

  if (/cart item|product variant/i.test(rawMessage)) {
    return "הפריט כבר לא זמין בסל. רעננו את העמוד ונסו שוב.";
  }

  if (/fixture cart|local cart|session/i.test(rawMessage)) {
    return "הסל שלך עדיין ריק.";
  }

  if (/מחיר|מלאי|קופון|כתובת/u.test(rawMessage)) {
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
