import { describe, expect, it } from "vitest";

import {
  createAdminCouponClientInputSchema,
  createAdminCouponInputSchema,
  createAdminProductInputSchema,
  refundAdminOrderInputSchema,
  updateAdminProductCommerceInputSchema,
  updateAdminInventoryInputSchema,
  upsertAdminShipmentInputSchema,
} from "./admin-validation";
import { getZodFieldErrors } from "./form-validation";

describe("admin validation", () => {
  it("keeps coupon form validation free of client clock defaults", () => {
    const clientParsed = createAdminCouponClientInputSchema.parse({
      code: "WELCOME",
      percentOff: 10,
    });
    const serverParsed = createAdminCouponInputSchema.parse({
      code: "WELCOME",
      percentOff: 10,
    });

    expect(clientParsed).not.toHaveProperty("startsAt");
    expect(serverParsed.startsAt).toBeInstanceOf(Date);
  });

  it("requires either a percent or amount discount for coupons", () => {
    const parsed = createAdminCouponInputSchema.safeParse({
      code: "WELCOME",
      startsAt: new Date(),
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(getZodFieldErrors(parsed.error).percentOff).toBe(
        "יש להזין אחוז הנחה או סכום הנחה.",
      );
    }
  });

  it("rejects negative inventory updates with Hebrew copy", () => {
    const parsed = updateAdminInventoryInputSchema.safeParse({
      branchId: "branch_1",
      quantity: -1,
      safetyStock: -1,
      variantId: "variant_1",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(getZodFieldErrors(parsed.error)).toMatchObject({
        quantity: "יש להזין מלאי תקין.",
        safetyStock: "יש להזין מלאי ביטחון תקין.",
      });
    }
  });

  it("normalizes optional shipment fields", () => {
    const parsed = upsertAdminShipmentInputSchema.parse({
      orderId: "order_1",
      provider: "",
      status: "SHIPPED",
      tracking: "  ABC123  ",
    });

    expect(parsed.provider).toBeUndefined();
    expect(parsed.tracking).toBe("ABC123");
  });

  it("requires refund reasons", () => {
    const parsed = refundAdminOrderInputSchema.safeParse({
      orderId: "order_1",
      reason: "",
      restockItems: false,
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(getZodFieldErrors(parsed.error).reason).toBe(
        "יש להזין סיבת זיכוי.",
      );
    }
  });

  it("validates required product creation fields before mutation", () => {
    const parsed = createAdminProductInputSchema.safeParse({
      basePrice: 0,
      branchInventory: [],
      categoryId: "",
      description: "",
      materialId: "",
      name: "",
      shortDescription: "",
      sku: "",
      slug: "",
      variantName: "",
      variantSku: "",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(getZodFieldErrors(parsed.error)).toMatchObject({
        basePrice: "יש להזין מחיר גדול מאפס.",
        categoryId: "יש לבחור קטגוריה.",
        materialId: "יש לבחור חומר.",
        name: "יש להזין שם מוצר.",
      });
    }
  });

  it("requires compare-at prices to be above the sale price on product creation", () => {
    const parsed = createAdminProductInputSchema.safeParse({
      basePrice: 100,
      branchInventory: [],
      categoryId: "category_1",
      compareAt: 90,
      description: "Full product description",
      materialId: "material_1",
      name: "Product",
      shortDescription: "Short product copy",
      sku: "SKU-1",
      slug: "product",
      variantName: "Default",
      variantSku: "SKU-1-DEFAULT",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(getZodFieldErrors(parsed.error).compareAt).toBe(
        "מחיר לפני הנחה חייב להיות גבוה ממחיר המכירה.",
      );
    }
  });

  it("validates commerce updates and requires a variant for compare-at updates", () => {
    const parsed = updateAdminProductCommerceInputSchema.safeParse({
      availabilityMode: "READY_TO_ORDER",
      compareAt: 1200,
      commerceHighlights: [],
      productId: "product_1",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(getZodFieldErrors(parsed.error).compareAt).toBe(
        "יש לבחור וריאציה לעדכון מחיר לפני הנחה.",
      );
    }
  });
});
