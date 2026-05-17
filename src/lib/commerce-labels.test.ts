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
    expect(getProductAvailabilityLabel(1)).toBe("זמין אונליין");
    expect(getProductAvailabilityLabel(3)).toBe("זמין אונליין");
    expect(getStockQuantityLabel(0)).toBe("לא זמין");
    expect(getStockQuantityLabel(4)).toBe("4 במלאי");
    expect(getItemCountLabel(1)).toBe("מוצר אחד");
    expect(getItemCountLabel(3)).toBe("3 מוצרים");
  });
});
