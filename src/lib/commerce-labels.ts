const orderStatusLabels: Readonly<Record<string, string>> = {
  PENDING_PAYMENT: "ממתין לתשלום",
  PAID: "שולם ידנית",
  PREPARING: "בהכנה",
  READY_FOR_PICKUP: "מוכן לאיסוף",
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
  "local-dev-fallback": "Fallback מקומי",
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
  return method === "PICKUP" ? "איסוף" : "משלוח";
}

export function getProductAvailabilityLabel(availableBranches: number) {
  if (availableBranches === 0) return "בדיקת זמינות";
  if (availableBranches === 1) return "זמין בסניף אחד";

  return `זמין ב-${availableBranches} סניפים`;
}

export function getStockQuantityLabel(quantity: number) {
  return quantity > 0 ? `${quantity} במלאי` : "לא זמין";
}

export function getItemCountLabel(count: number, singular = "מוצר") {
  if (count === 1) return `${singular} אחד`;

  return `${count} ${singular}ים`;
}

function getMappedLabel(
  labels: Readonly<Record<string, string>>,
  value: string,
) {
  return labels[value] ?? value;
}
