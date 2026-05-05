import { describe, expect, it } from "vitest";

import {
  getFulfillmentMethodLabel,
  getItemCountLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getProductAvailabilityLabel,
  getStockQuantityLabel,
} from "./commerce-labels";

describe("commerce labels", () => {
  it("translates known operational statuses and preserves unknown values", () => {
    expect(getOrderStatusLabel("PENDING_PAYMENT")).toBe("ממתין לתשלום");
    expect(getOrderStatusLabel("CUSTOM_STATUS")).toBe("CUSTOM_STATUS");
    expect(getPaymentStatusLabel("CAPTURED")).toBe("שולם");
    expect(getPaymentStatusLabel(undefined)).toBe("ממתין");
  });

  it("formats fulfillment, availability, stock, and count labels", () => {
    expect(getFulfillmentMethodLabel("PICKUP")).toBe("איסוף");
    expect(getFulfillmentMethodLabel("DELIVERY")).toBe("משלוח");
    expect(getProductAvailabilityLabel(0)).toBe("בדיקת זמינות");
    expect(getProductAvailabilityLabel(1)).toBe("זמין בסניף אחד");
    expect(getProductAvailabilityLabel(3)).toBe("זמין ב-3 סניפים");
    expect(getStockQuantityLabel(0)).toBe("לא זמין");
    expect(getStockQuantityLabel(4)).toBe("4 במלאי");
    expect(getItemCountLabel(1)).toBe("מוצר אחד");
    expect(getItemCountLabel(3)).toBe("3 מוצרים");
  });
});
