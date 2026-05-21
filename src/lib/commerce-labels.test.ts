import { describe, expect, it } from "vitest";

import {
  getAppointmentStatusLabel,
  getCouponStatusLabel,
  getFulfillmentMethodLabel,
  getIntegrationStatusLabel,
  getItemCountLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getProductAvailabilityLabel,
  getPublicProductCommerceStatus,
  getPublicStockStatusLabel,
  getProductStatusLabel,
  getReturnStatusLabel,
  getShipmentStatusLabel,
  getStockQuantityLabel,
} from "./commerce-labels";

describe("commerce labels", () => {
  it("translates known operational statuses and preserves unknown values", () => {
    expect(getOrderStatusLabel("PENDING_PAYMENT")).toBe("ממתין לתשלום");
    expect(getOrderStatusLabel("CUSTOM_STATUS")).toBe("CUSTOM_STATUS");
    expect(getPaymentStatusLabel("CAPTURED")).toBe("שולם");
    expect(getPaymentStatusLabel(undefined)).toBe("ממתין");
    expect(getProductStatusLabel("ACTIVE")).toBe("פעיל");
    expect(getAppointmentStatusLabel("CONFIRMED")).toBe("מאושר");
    expect(getShipmentStatusLabel("IN_TRANSIT")).toBe("בדרך");
    expect(getReturnStatusLabel("REFUNDED")).toBe("זוכה");
    expect(getCouponStatusLabel(false)).toBe("כבוי");
    expect(getIntegrationStatusLabel("missing-config")).toBe("חסרה הגדרה");
    expect(getProductStatusLabel("CUSTOM_STATUS")).toBe("CUSTOM_STATUS");
  });

  it("formats fulfillment, availability, stock, and count labels", () => {
    expect(getFulfillmentMethodLabel("PICKUP")).toBe("אונליין");
    expect(getFulfillmentMethodLabel("DELIVERY")).toBe("משלוח");
    expect(getProductAvailabilityLabel(0)).toBe("בדיקת זמינות");
    expect(getProductAvailabilityLabel(1)).toBe("זמין להזמנה");
    expect(getProductAvailabilityLabel(3)).toBe("זמין להזמנה");
    expect(getPublicStockStatusLabel(0)).toBe("אזל זמנית");
    expect(getPublicStockStatusLabel(4)).toBe("זמין להזמנה");
    expect(getStockQuantityLabel(0)).toBe("לא זמין");
    expect(getStockQuantityLabel(4)).toBe("4 במלאי");
    expect(getItemCountLabel(1)).toBe("מוצר אחד");
    expect(getItemCountLabel(3)).toBe("3 מוצרים");
  });

  it("maps public commerce status from availability mode and quantity", () => {
    expect(
      getPublicProductCommerceStatus({
        availabilityMode: "READY_TO_ORDER",
        availableQuantity: 2,
      }),
    ).toMatchObject({
      canAddToCart: true,
      cardCtaLabel: "צפייה וקנייה",
      ctaLabel: "הוספה לסל",
      label: "זמין להזמנה",
    });
    expect(
      getPublicProductCommerceStatus({
        availabilityMode: "MADE_TO_ORDER",
        availableQuantity: 0,
      }),
    ).toMatchObject({
      canAddToCart: false,
      ctaLabel: "פתיחת בקשת התאמה",
      label: "בהזמנה אישית",
      serviceReason: "made-to-order",
    });
    expect(
      getPublicProductCommerceStatus({
        availabilityMode: "CONSULTATION",
        availableQuantity: 8,
      }),
    ).toMatchObject({
      canAddToCart: false,
      ctaLabel: "תיאום ייעוץ",
      label: "לתיאום ייעוץ",
      serviceReason: "consultation",
    });
  });
});
