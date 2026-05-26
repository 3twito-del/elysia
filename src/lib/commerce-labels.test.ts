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
    expect(getFulfillmentMethodLabel("PICKUP")).toBe("שירות מרחוק");
    expect(getFulfillmentMethodLabel("DELIVERY")).toBe("מסירה עד הבית");
    expect(getProductAvailabilityLabel(0)).toBe("בירור התאמה");
    expect(getProductAvailabilityLabel(1)).toBe("זמין");
    expect(getProductAvailabilityLabel(3)).toBe("זמין");
    expect(getPublicStockStatusLabel(0)).toBe("לא פנוי כרגע");
    expect(getPublicStockStatusLabel(4)).toBe("זמין");
    expect(getStockQuantityLabel(0)).toBe("לא פנוי כרגע");
    expect(getStockQuantityLabel(4)).toBe("4 פנויים לבחירה");
    expect(getItemCountLabel(1)).toBe("תכשיט אחד");
    expect(getItemCountLabel(3)).toBe("3 תכשיטים");
  });

  it("maps public commerce status from availability mode and quantity", () => {
    expect(
      getPublicProductCommerceStatus({
        availabilityMode: "READY_TO_ORDER",
        availableQuantity: 2,
      }),
    ).toMatchObject({
      canAddToCart: true,
      cardCtaLabel: "לפרטי התכשיט",
      ctaLabel: "צירוף לבחירה",
      label: "זמין",
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
      label: "לייעוץ",
      serviceReason: "consultation",
    });
  });
});
