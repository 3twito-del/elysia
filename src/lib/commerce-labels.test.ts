import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getAppointmentStatusLabel,
  getCouponStatusLabel,
  getFulfillmentMethodLabel,
  getIntegrationStatusLabel,
  getItemCountLabel,
  getOrderStatusLabel,
  getOrderSourceDescription,
  getOrderSourceLabel,
  getPaymentStatusLabel,
  getProductAvailabilityLabel,
  getPublicProductCommerceStatus,
  getPublicStockStatusLabel,
  getProductStatusLabel,
  getReturnStatusLabel,
  getShipmentStatusLabel,
  getShopifyFinancialStatusLabel,
  getShopifyFulfillmentStatusLabel,
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

  it("labels local and Shopify mirror order sources consistently", () => {
    expect(getOrderSourceLabel("LOCAL")).toBe("הזמנת חנות");
    expect(getOrderSourceLabel("SHOPIFY_MIRROR")).toBe("הזמנה נפרדת");
    expect(getOrderSourceDescription("SHOPIFY_MIRROR")).toContain(
      "לקריאה בלבד",
    );
    expect(getShopifyFinancialStatusLabel("paid")).toBe("שולם");
    expect(getShopifyFinancialStatusLabel(undefined)).toBe(
      "סטטוס תשלום לא דווח",
    );
    expect(getShopifyFulfillmentStatusLabel("fulfilled")).toBe("הושלם");
    expect(getShopifyFulfillmentStatusLabel(null)).toBe("ממתין לעדכון");
  });

  it("formats fulfillment, availability, stock, and count labels", () => {
    expect(getFulfillmentMethodLabel("PICKUP")).toBe("שירות מרחוק");
    expect(getFulfillmentMethodLabel("DELIVERY")).toBe("משלוח עד הבית");
    expect(getProductAvailabilityLabel(0)).toBe("אזל מהמלאי");
    expect(getProductAvailabilityLabel(1)).toBe("זמין");
    expect(getProductAvailabilityLabel(3)).toBe("זמין");
    expect(getPublicStockStatusLabel(0)).toBe("אזל מהמלאי");
    expect(getPublicStockStatusLabel(4)).toBe("זמין");
    expect(getStockQuantityLabel(0)).toBe("אזל מהמלאי");
    expect(getStockQuantityLabel(4)).toBe("4 זמינים במלאי");
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
      ctaLabel: "הוספה לסל",
      label: "זמין",
    });
    expect(
      getPublicProductCommerceStatus({
        availabilityMode: "MADE_TO_ORDER",
        availableQuantity: 0,
      }),
    ).toMatchObject({
      canAddToCart: false,
      ctaLabel: "יצירת קשר להזמנה",
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

  it("allows backorder purchase only when the product opted in (OMS-002)", () => {
    // Out of stock, backorder NOT enabled -> the original hard block.
    expect(
      getPublicProductCommerceStatus({
        availabilityMode: "READY_TO_ORDER",
        availableQuantity: 0,
      }),
    ).toMatchObject({
      canAddToCart: false,
      label: "אזל מהמלאי",
      serviceReason: "availability",
    });
    expect(
      getPublicProductCommerceStatus({
        availabilityMode: "READY_TO_ORDER",
        availableQuantity: 0,
        backorderEnabled: false,
      }),
    ).toMatchObject({ canAddToCart: false, serviceReason: "availability" });

    // Out of stock, backorder enabled -> purchasable, honest no-date label.
    expect(
      getPublicProductCommerceStatus({
        availabilityMode: "READY_TO_ORDER",
        availableQuantity: 0,
        backorderEnabled: true,
      }),
    ).toMatchObject({
      canAddToCart: true,
      label: "בהזמנה מראש",
      serviceReason: "backorder",
    });

    // In stock -> backorderEnabled is irrelevant, still the plain "available" status.
    expect(
      getPublicProductCommerceStatus({
        availabilityMode: "READY_TO_ORDER",
        availableQuantity: 3,
        backorderEnabled: true,
      }),
    ).toMatchObject({ canAddToCart: true, label: "זמין", serviceReason: "ready" });
  });

  it("keeps order source labels wired through customer, admin, checkout, and product surfaces", () => {
    const accountPage = read("src/app/account/page.tsx");
    const accountOrderPage = read("src/app/account/orders/[id]/page.tsx");
    const adminOrderPage = read("src/app/admin/orders/[id]/page.tsx");
    const adminOrdersPage = read("src/app/admin/orders/page.tsx");
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );
    const productCard = read("src/components/product-card.tsx");

    for (const source of [accountPage, accountOrderPage, adminOrderPage]) {
      expect(source).toContain("getOrderSourceLabel");
      expect(source).toContain("getOrderSourceDescription");
      expect(source).toContain('"LOCAL"');
    }

    expect(accountPage).toContain('"SHOPIFY_MIRROR"');
    expect(adminOrdersPage).toContain("sourceLabel");
    expect(adminOrdersPage).toContain("sourceDescription");
    expect(checkoutForm).toContain('source: "OWN"');
    expect(checkoutForm).toContain('source: "DROPSHIP_SHOPIFY"');
    expect(productCard).not.toContain("getPublicProductCommerceStatus");
    expect(productCard).toContain("getPublicProductName");
    expect(productCard).not.toContain('product.source === "DROPSHIP_SHOPIFY"');
    expect(productCard).not.toContain("sourceFact");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
