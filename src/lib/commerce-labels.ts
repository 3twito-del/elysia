const orderStatusLabels: Readonly<Record<string, string>> = {
  PENDING_PAYMENT: "ממתין לתשלום",
  PAID: "שולם ידנית",
  PREPARING: "בהכנה",
  READY_FOR_PICKUP: "מוכן למסירה",
  SHIPPED: "נשלח",
  COMPLETED: "הושלם",
  CANCELLED: "בוטל",
  REFUNDED: "זוכה",
};

const paymentStatusLabels: Readonly<Record<string, string>> = {
  PENDING: "ממתין",
  AUTHORIZED: "אושר",
  CAPTURED: "שולם",
  FAILED: "נכשל",
  REFUNDED: "זוכה",
};

const productStatusLabels: Readonly<Record<string, string>> = {
  DRAFT: "טיוטה",
  ACTIVE: "פעיל",
  ARCHIVED: "בארכיון",
};

const appointmentStatusLabels: Readonly<Record<string, string>> = {
  REQUESTED: "ממתין לאישור",
  CONFIRMED: "מאושר",
  COMPLETED: "הושלם",
  CANCELLED: "בוטל",
};

const shipmentStatusLabels: Readonly<Record<string, string>> = {
  SHIPPED: "נשלח",
  IN_TRANSIT: "בדרך",
  DELIVERED: "נמסר",
};

const returnStatusLabels: Readonly<Record<string, string>> = {
  REQUESTED: "בטיפול",
  APPROVED: "אושר",
  REJECTED: "נדחה",
  REFUNDED: "זוכה",
  CANCELLED: "בוטל",
};

const integrationStatusLabels: Readonly<Record<string, string>> = {
  active: "פעיל",
  disabled: "כבוי",
  "missing-key": "חסר מפתח",
  "missing-email": "חסר אימייל",
  "missing-config": "חסרה הגדרה",
  "local-dev-fallback": "מצב פיתוח",
};

const orderSourceLabels = {
  LOCAL: "הזמנת חנות",
  SHOPIFY_MIRROR: "הזמנת ספק",
} as const;

const orderSourceDescriptions = {
  LOCAL: "מטופלת במערכת המקומית של Elysia.",
  SHOPIFY_MIRROR: "רשומת Shopify לקריאה בלבד; טיפול ותשלום מתבצעים אצל הספק.",
} as const;

const shopifyFinancialStatusLabels: Readonly<Record<string, string>> = {
  authorized: "אושר ב-Shopify",
  paid: "שולם ב-Shopify",
  partially_paid: "שולם חלקית ב-Shopify",
  partially_refunded: "זוכה חלקית ב-Shopify",
  pending: "ממתין ב-Shopify",
  refunded: "זוכה ב-Shopify",
  voided: "בוטל ב-Shopify",
};

const shopifyFulfillmentStatusLabels: Readonly<Record<string, string>> = {
  fulfilled: "מולא על ידי הספק",
  in_progress: "בטיפול הספק",
  on_hold: "מושהה אצל הספק",
  open: "ממתין לספק",
  partial: "מולא חלקית על ידי הספק",
  pending: "ממתין לספק",
  restocked: "הוחזר למלאי הספק",
  scheduled: "מתוזמן אצל הספק",
  unfulfilled: "טרם מולא אצל הספק",
};

export type OrderSourceKind = keyof typeof orderSourceLabels;

export type PublicProductAvailabilityMode =
  | "READY_TO_ORDER"
  | "MADE_TO_ORDER"
  | "CONSULTATION";

type PublicProductCommerceStatusInput = {
  availabilityMode?: PublicProductAvailabilityMode;
  availableQuantity: number;
};

export function getOrderStatusLabel(status: string) {
  return getMappedLabel(orderStatusLabels, status);
}

export function getPaymentStatusLabel(status: string | null | undefined) {
  return status ? getMappedLabel(paymentStatusLabels, status) : "ממתין";
}

export function getProductStatusLabel(status: string) {
  return getMappedLabel(productStatusLabels, status);
}

export function getAppointmentStatusLabel(status: string) {
  return getMappedLabel(appointmentStatusLabels, status);
}

export function getShipmentStatusLabel(status: string) {
  return getMappedLabel(shipmentStatusLabels, status);
}

export function getReturnStatusLabel(status: string) {
  return getMappedLabel(returnStatusLabels, status);
}

export function getCouponStatusLabel(isActive: boolean) {
  return isActive ? "פעיל" : "כבוי";
}

export function getIntegrationStatusLabel(status: string) {
  return getMappedLabel(integrationStatusLabels, status);
}

export function getOrderSourceLabel(source: OrderSourceKind) {
  return orderSourceLabels[source];
}

export function getOrderSourceDescription(source: OrderSourceKind) {
  return orderSourceDescriptions[source];
}

export function getShopifyFinancialStatusLabel(
  status: string | null | undefined,
) {
  return status
    ? getMappedLabel(shopifyFinancialStatusLabels, status)
    : "סטטוס תשלום לא דווח";
}

export function getShopifyFulfillmentStatusLabel(
  status: string | null | undefined,
) {
  return status
    ? getMappedLabel(shopifyFulfillmentStatusLabels, status)
    : "ממתין למילוי ספק";
}

export function getFulfillmentMethodLabel(method: string) {
  return method === "PICKUP" ? "שירות מרחוק" : "מסירה עד הבית";
}

export function getProductAvailabilityLabel(availableQuantity: number) {
  return getPublicProductCommerceStatus({
    availableQuantity,
    availabilityMode: "READY_TO_ORDER",
  }).label;
}

export function getPublicStockStatusLabel(quantity: number) {
  return quantity > 0 ? "זמין" : "לא פנוי כרגע";
}

export function getPublicProductCommerceStatus({
  availabilityMode = "READY_TO_ORDER",
  availableQuantity,
}: PublicProductCommerceStatusInput) {
  if (availabilityMode === "MADE_TO_ORDER") {
    return {
      canAddToCart: false,
      cardCtaLabel: "הזמנה אישית",
      ctaLabel: "פתיחת בקשת התאמה",
      label: "בהזמנה אישית",
      serviceReason: "made-to-order",
    } as const;
  }

  if (availabilityMode === "CONSULTATION") {
    return {
      canAddToCart: false,
      cardCtaLabel: "תיאום ייעוץ",
      ctaLabel: "תיאום ייעוץ",
      label: "לייעוץ",
      serviceReason: "consultation",
    } as const;
  }

  if (availableQuantity <= 0) {
    return {
      canAddToCart: false,
      cardCtaLabel: "בירור התאמה",
      ctaLabel: "בירור התאמה",
      label: "בירור התאמה",
      serviceReason: "availability",
    } as const;
  }

  return {
    canAddToCart: true,
    cardCtaLabel: "לפרטי התכשיט",
    ctaLabel: "צירוף לבחירה",
    label: "זמין",
    serviceReason: "ready",
  } as const;
}

export function getStockQuantityLabel(quantity: number) {
  return quantity > 0 ? `${quantity} פנויים לבחירה` : "לא פנוי כרגע";
}

export function getItemCountLabel(count: number, singular = "תכשיט") {
  if (count === 1) return `${singular} אחד`;

  return `${count} ${singular}ים`;
}

function getMappedLabel(
  labels: Readonly<Record<string, string>>,
  value: string,
) {
  return labels[value] ?? value;
}
