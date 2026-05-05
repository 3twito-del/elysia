export function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: "ממתין לתשלום",
    PAID: "שולם ידנית",
    PREPARING: "בהכנה",
    READY_FOR_PICKUP: "מוכן לאיסוף",
    SHIPPED: "נשלח",
    COMPLETED: "הושלם",
    CANCELLED: "בוטל",
    REFUNDED: "זוכה",
  };

  return labels[status] ?? status;
}

export function getPaymentStatusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    PENDING: "ממתין",
    AUTHORIZED: "אושר",
    CAPTURED: "שולם",
    FAILED: "נכשל",
    REFUNDED: "זוכה",
  };

  return status ? (labels[status] ?? status) : "ממתין";
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
