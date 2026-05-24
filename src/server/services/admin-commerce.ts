import type { Prisma } from "@prisma/client";
import type { z } from "zod";

import {
  createAdminCouponInputSchema,
  createAdminProductInputSchema,
  refundAdminOrderInputSchema,
  updateAdminAppointmentStatusInputSchema,
  updateAdminCouponStatusInputSchema,
  updateAdminInventoryInputSchema,
  updateAdminProductCommerceInputSchema,
  updateAdminProductStatusInputSchema,
  upsertAdminShipmentInputSchema,
} from "~/lib/admin-validation";
import { db } from "~/server/db";
import {
  canRefundOrderStatus,
  createSearchReindexEvent,
  releaseOutstandingReservationsForRefund,
  shouldRestockRefundedOrder,
  writeAdminAudit,
} from "~/server/services/admin-commerce-workflow";
import { revalidateCatalogMutation } from "~/server/services/catalog-revalidation";
import { normalizeCouponCode } from "~/server/services/coupons";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";

export {
  createAdminCouponInputSchema,
  createAdminProductInputSchema,
  refundAdminOrderInputSchema,
  updateAdminAppointmentStatusInputSchema,
  updateAdminCouponStatusInputSchema,
  updateAdminInventoryInputSchema,
  updateAdminProductCommerceInputSchema,
  updateAdminProductStatusInputSchema,
  upsertAdminShipmentInputSchema,
} from "~/lib/admin-validation";

export {
  getAdminOrderDetail,
  listAdminAppointments,
  listAdminCatalog,
  listAdminCustomers,
} from "~/server/services/admin-commerce-read";

export { canRefundOrderStatus, shouldRestockRefundedOrder };

export async function upsertAdminShipment(input: {
  data: z.infer<typeof upsertAdminShipmentInputSchema>;
  adminUserId: string;
}) {
  const parsed = upsertAdminShipmentInputSchema.parse(input.data);

  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: parsed.orderId },
      include: { shipments: true },
    });

    if (!order) throw new Error("Order not found.");
    if (order.fulfillmentMethod !== "DELIVERY") {
      throw new Error(
        "Shipment tracking is only available for delivery orders.",
      );
    }

    const status = parsed.status.toUpperCase();
    const existing = order.shipments[0];
    const shipment = existing
      ? await tx.shipment.update({
          where: { id: existing.id },
          data: {
            provider: parsed.provider ?? null,
            tracking: parsed.tracking ?? null,
            status,
            shippedAt:
              status === "SHIPPED" || status === "DELIVERED"
                ? (existing.shippedAt ?? new Date())
                : existing.shippedAt,
            deliveredAt:
              status === "DELIVERED" ? new Date() : existing.deliveredAt,
          },
        })
      : await tx.shipment.create({
          data: {
            orderId: order.id,
            provider: parsed.provider ?? null,
            tracking: parsed.tracking ?? null,
            status,
            shippedAt:
              status === "SHIPPED" || status === "DELIVERED"
                ? new Date()
                : null,
            deliveredAt: status === "DELIVERED" ? new Date() : null,
          },
        });

    const orderUpdate: Prisma.OrderUpdateInput = {};

    if (status === "SHIPPED" && order.status !== "SHIPPED") {
      orderUpdate.status = "SHIPPED";
      orderUpdate.shippedAt = new Date();
    }

    if (status === "DELIVERED") {
      orderUpdate.status = "COMPLETED";
      orderUpdate.completedAt = new Date();
    }

    if (Object.keys(orderUpdate).length > 0) {
      await tx.order.update({
        where: { id: order.id },
        data: orderUpdate,
      });
    }

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "shipment_upserted",
      entity: "Shipment",
      entityId: shipment.id,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        provider: shipment.provider,
        tracking: shipment.tracking,
        status: shipment.status,
      },
    });

    await createOutboxEvent(tx, {
      type: BUSINESS_EVENTS.emailRequested,
      aggregateType: "Order",
      aggregateId: order.id,
      idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:shipment:${order.id}:${shipment.status}:${Date.now()}`,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.email,
        template: "shipment_updated",
        status: shipment.status,
        tracking: shipment.tracking,
      },
    });

    return {
      id: shipment.id,
      orderId: order.id,
      status: shipment.status,
      tracking: shipment.tracking,
    };
  });
}

export async function refundAdminOrder(input: {
  data: z.infer<typeof refundAdminOrderInputSchema>;
  adminUserId: string;
}) {
  const parsed = refundAdminOrderInputSchema.parse(input.data);

  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: parsed.orderId },
      include: {
        branch: true,
        items: true,
        payments: true,
        returns: true,
      },
    });

    if (!order) throw new Error("Order not found.");
    if (!canRefundOrderStatus(order.status)) {
      throw new Error("Order status is not refundable.");
    }

    const returnRequest = parsed.returnRequestId
      ? await tx.returnRequest.update({
          where: { id: parsed.returnRequestId },
          data: {
            status: "REFUNDED",
            notes: parsed.notes,
          },
        })
      : await tx.returnRequest.create({
          data: {
            orderId: order.id,
            reason: parsed.reason,
            status: "REFUNDED",
            notes: parsed.notes,
          },
        });

    await releaseOutstandingReservationsForRefund(tx, {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    if (
      order.branchId &&
      shouldRestockRefundedOrder({
        status: order.status,
        restockItems: parsed.restockItems,
      })
    ) {
      for (const item of order.items) {
        await tx.inventoryItem.updateMany({
          where: {
            branchId: order.branchId,
            variantId: item.variantId,
          },
          data: {
            quantity: { increment: item.quantity },
          },
        });

        await tx.inventoryLedger.create({
          data: {
            branchId: order.branchId,
            variantId: item.variantId,
            delta: item.quantity,
            reason: "return_restocked",
            reference: order.orderNumber,
          },
        });
      }
    }

    await tx.payment.updateMany({
      where: { orderId: order.id },
      data: {
        status: "REFUNDED",
        providerStatus: "manual_refunded",
        refundedAt: new Date(),
      },
    });

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "order_refunded",
      entity: "Order",
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        reason: parsed.reason,
        restockItems: parsed.restockItems,
        returnRequestId: returnRequest.id,
      },
    });

    await createOutboxEvent(tx, {
      type: BUSINESS_EVENTS.emailRequested,
      aggregateType: "Order",
      aggregateId: order.id,
      idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:refund:${order.id}`,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.email,
        template: "order_refunded",
      },
    });

    return {
      orderId: updated.id,
      status: updated.status,
      returnRequestId: returnRequest.id,
    };
  });
}

export async function updateAdminAppointmentStatus(input: {
  data: z.infer<typeof updateAdminAppointmentStatusInputSchema>;
  adminUserId: string;
}) {
  const parsed = updateAdminAppointmentStatusInputSchema.parse(input.data);

  return db.$transaction(async (tx) => {
    const appointment = await tx.appointment.update({
      where: { id: parsed.appointmentId },
      data: {
        status: parsed.status,
        ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
      },
      include: { branch: true },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "appointment_status_updated",
      entity: "Appointment",
      entityId: appointment.id,
      metadata: {
        status: appointment.status,
        branch: appointment.branch.name,
      },
    });

    if (appointment.email) {
      await createOutboxEvent(tx, {
        type: BUSINESS_EVENTS.emailRequested,
        aggregateType: "Appointment",
        aggregateId: appointment.id,
        idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:appointment:${appointment.id}:${appointment.status}`,
        payload: {
          appointmentId: appointment.id,
          customerEmail: appointment.email,
          template: "appointment_status_updated",
          status: appointment.status,
        },
      });
    }

    return {
      id: appointment.id,
      status: appointment.status,
    };
  });
}

export async function createAdminProduct(input: {
  data: z.infer<typeof createAdminProductInputSchema>;
  adminUserId: string;
}) {
  const parsed = createAdminProductInputSchema.parse(input.data);
  const product = await db.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        slug: parsed.slug,
        sku: parsed.sku,
        name: parsed.name,
        shortDescription: parsed.shortDescription,
        description: parsed.description,
        status: "ACTIVE",
        categoryId: parsed.categoryId,
        materialId: parsed.materialId,
        stoneId: parsed.stoneId,
        basePrice: parsed.basePrice,
        availabilityMode: parsed.availabilityMode,
        commerceHighlights: parsed.commerceHighlights,
        deliveryPromise: parsed.deliveryPromise,
        returnPolicy: parsed.returnPolicy,
        careInstructions: parsed.careInstructions,
        warranty: parsed.warranty,
        tags: [],
        media: parsed.imageUrl
          ? {
              create: {
                url: parsed.imageUrl,
                alt: parsed.name,
                isPrimary: true,
              },
            }
          : undefined,
      },
      include: { category: true },
    });
    const variant = await tx.productVariant.create({
      data: {
        productId: created.id,
        sku: parsed.variantSku,
        name: parsed.variantName,
        size: parsed.variantSize,
        metalColor: parsed.variantMetalColor,
        stoneColor: parsed.variantStoneColor,
        isDefault: true,
        prices: {
          create: {
            amount: parsed.basePrice,
            compareAt: parsed.compareAt,
            currency: "ILS",
          },
        },
      },
    });

    if (parsed.branchInventory.length > 0) {
      await tx.inventoryItem.createMany({
        data: parsed.branchInventory.map((item) => ({
          branchId: item.branchId,
          variantId: variant.id,
          quantity: item.quantity,
          safetyStock: item.safetyStock,
        })),
      });
    }

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "product_created",
      entity: "Product",
      entityId: created.id,
      metadata: { slug: created.slug, sku: created.sku },
    });

    await createSearchReindexEvent(tx, {
      aggregateId: created.id,
      reason: "product_created",
    });

    return created;
  });

  revalidateCatalogMutation({
    productSlugs: [product.slug],
    categorySlugs: [product.category.slug],
  });

  return { id: product.id, slug: product.slug };
}

export async function updateAdminProductCommerce(input: {
  data: z.infer<typeof updateAdminProductCommerceInputSchema>;
  adminUserId: string;
}) {
  const parsed = updateAdminProductCommerceInputSchema.parse(input.data);
  const product = await db.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: parsed.productId },
      data: {
        availabilityMode: parsed.availabilityMode,
        commerceHighlights: parsed.commerceHighlights,
        deliveryPromise: parsed.deliveryPromise ?? null,
        returnPolicy: parsed.returnPolicy ?? null,
        careInstructions: parsed.careInstructions ?? null,
        warranty: parsed.warranty ?? null,
      },
      include: { category: true },
    });

    if (parsed.variantId) {
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: parsed.variantId },
        include: {
          prices: {
            orderBy: { validFrom: "desc" },
            take: 1,
          },
          product: true,
        },
      });

      await tx.productVariant.update({
        where: { id: parsed.variantId },
        data: {
          size: parsed.variantSize ?? null,
          metalColor: parsed.variantMetalColor ?? null,
          stoneColor: parsed.variantStoneColor ?? null,
        },
      });

      const latestPrice = variant.prices[0];

      if (latestPrice) {
        await tx.price.update({
          where: { id: latestPrice.id },
          data: { compareAt: parsed.compareAt ?? null },
        });
      } else if (parsed.compareAt) {
        await tx.price.create({
          data: {
            variantId: variant.id,
            amount:
              Number(variant.product.basePrice) + Number(variant.priceDelta),
            compareAt: parsed.compareAt,
            currency: "ILS",
          },
        });
      }
    }

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "product_commerce_updated",
      entity: "Product",
      entityId: updated.id,
      metadata: {
        availabilityMode: parsed.availabilityMode,
        commerceHighlightCount: parsed.commerceHighlights.length,
        variantId: parsed.variantId,
      },
    });

    await createSearchReindexEvent(tx, {
      aggregateId: updated.id,
      reason: "product_commerce_updated",
    });

    return updated;
  });

  revalidateCatalogMutation({
    productSlugs: [product.slug],
    categorySlugs: [product.category.slug],
  });

  return { id: product.id, slug: product.slug };
}

export async function updateAdminProductStatus(input: {
  data: z.infer<typeof updateAdminProductStatusInputSchema>;
  adminUserId: string;
}) {
  const parsed = updateAdminProductStatusInputSchema.parse(input.data);
  const product = await db.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: parsed.productId },
      data: { status: parsed.status },
      include: { category: true },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "product_status_updated",
      entity: "Product",
      entityId: updated.id,
      metadata: { status: parsed.status },
    });

    await createSearchReindexEvent(tx, {
      aggregateId: updated.id,
      reason: "product_status_updated",
    });

    return updated;
  });

  revalidateCatalogMutation({
    productSlugs: [product.slug],
    categorySlugs: [product.category.slug],
  });

  return { id: product.id, status: product.status };
}

export async function updateAdminInventory(input: {
  data: z.infer<typeof updateAdminInventoryInputSchema>;
  adminUserId: string;
}) {
  const parsed = updateAdminInventoryInputSchema.parse(input.data);
  const result = await db.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUniqueOrThrow({
      where: { id: parsed.variantId },
      include: { product: true },
    });
    const branch = await tx.branch.findUniqueOrThrow({
      where: { id: parsed.branchId },
    });
    const existing = await tx.inventoryItem.findUnique({
      where: {
        branchId_variantId: {
          branchId: parsed.branchId,
          variantId: parsed.variantId,
        },
      },
    });
    const delta = parsed.quantity - (existing?.quantity ?? 0);

    await tx.inventoryItem.upsert({
      where: {
        branchId_variantId: {
          branchId: parsed.branchId,
          variantId: parsed.variantId,
        },
      },
      update: {
        quantity: parsed.quantity,
        safetyStock: parsed.safetyStock,
      },
      create: {
        branchId: parsed.branchId,
        variantId: parsed.variantId,
        quantity: parsed.quantity,
        safetyStock: parsed.safetyStock,
      },
    });

    await tx.inventoryLedger.create({
      data: {
        branchId: parsed.branchId,
        variantId: parsed.variantId,
        delta,
        reason: "admin_inventory_adjustment",
        reference: input.adminUserId,
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "inventory_updated",
      entity: "InventoryItem",
      entityId: parsed.variantId,
      metadata: {
        branchId: parsed.branchId,
        quantity: parsed.quantity,
        safetyStock: parsed.safetyStock,
        delta,
      },
    });

    await createSearchReindexEvent(tx, {
      aggregateId: variant.productId,
      reason: "inventory_updated",
    });

    return {
      productSlug: variant.product.slug,
      branchSlug: branch.slug,
      variantId: variant.id,
    };
  });

  revalidateCatalogMutation({
    productSlugs: [result.productSlug],
    branchSlugs: [result.branchSlug],
  });

  return result;
}

export async function createAdminCoupon(input: {
  data: z.infer<typeof createAdminCouponInputSchema>;
  adminUserId: string;
}) {
  const parsed = createAdminCouponInputSchema.parse(input.data);
  const code = normalizeCouponCode(parsed.code);

  if (!code) throw new Error("Coupon code is required.");

  const coupon = await db.$transaction(async (tx) => {
    const created = await tx.coupon.create({
      data: {
        code,
        description: parsed.description,
        percentOff: parsed.percentOff,
        amountOff: parsed.amountOff,
        startsAt: parsed.startsAt,
        endsAt: parsed.endsAt,
        maxUses: parsed.maxUses,
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "coupon_created",
      entity: "Coupon",
      entityId: created.id,
      metadata: { code: created.code },
    });

    return created;
  });

  return { id: coupon.id, code: coupon.code };
}

export async function updateAdminCouponStatus(input: {
  data: z.infer<typeof updateAdminCouponStatusInputSchema>;
  adminUserId: string;
}) {
  const parsed = updateAdminCouponStatusInputSchema.parse(input.data);
  const coupon = await db.$transaction(async (tx) => {
    const updated = await tx.coupon.update({
      where: { id: parsed.couponId },
      data: { isActive: parsed.isActive },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "coupon_status_updated",
      entity: "Coupon",
      entityId: updated.id,
      metadata: { code: updated.code, isActive: parsed.isActive },
    });

    return updated;
  });

  return { id: coupon.id, isActive: coupon.isActive };
}
