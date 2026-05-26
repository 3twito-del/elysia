const orderStatusLabels: Readonly<Record<string, string>> = {
  PENDING_PAYMENT: "ממתין לתשלום",
  PAID: "שולם ידנית",
  PREPARING: "בהכנה",
  READY_FOR_PICKUP: "מוכן למשלוח",
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
  REQUESTED: "בבדיקה",
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
  "local-dev-fallback": "מצב בדיקה",
};

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

export function getFulfillmentMethodLabel(method: string) {
  return method === "PICKUP" ? "אונליין" : "משלוח";
}

export function getProductAvailabilityLabel(availableQuantity: number) {
  return getPublicProductCommerceStatus({
    availableQuantity,
    availabilityMode: "READY_TO_ORDER",
  }).label;
}

export function getPublicStockStatusLabel(quantity: number) {
  return quantity > 0 ? "זמין במלאי" : "אזל זמנית";
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
      label: "לתיאום ייעוץ",
      serviceReason: "consultation",
    } as const;
  }

  if (availableQuantity <= 0) {
    return {
      canAddToCart: false,
      cardCtaLabel: "בדיקת זמינות",
      ctaLabel: "בדיקת זמינות",
      label: "בדיקת זמינות",
      serviceReason: "availability",
    } as const;
  }

  return {
    canAddToCart: true,
    cardCtaLabel: "לפרטי הפריט",
    ctaLabel: "הוספה לסל",
    label: "זמין במלאי",
    serviceReason: "ready",
  } as const;
}

export function getStockQuantityLabel(quantity: number) {
  return quantity > 0 ? `${quantity} במלאי` : "לא זמין";
}

export function getItemCountLabel(count: number, singular = "פריט") {
  if (count === 1) return `${singular} אחד`;

  return `${count} ${singular}ים`;
}

function getMappedLabel(
  labels: Readonly<Record<string, string>>,
  value: string,
) {
  return labels[value] ?? value;
}
