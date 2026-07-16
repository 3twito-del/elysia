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
  updateAdminProductMediaInputSchema,
  updateAdminProductStatusInputSchema,
  upsertAdminShipmentInputSchema,
} from "~/lib/admin-validation";
import { getAdminAppointmentTransitionError } from "~/lib/appointment-validation";
import { db } from "~/server/db";
import {
  canRefundOrderStatus,
  createSearchReindexEvent,
  releaseOutstandingReservationsForRefund,
  resolveRefundLines,
  shouldRestockRefundedOrder,
  writeAdminAudit,
} from "~/server/services/admin-commerce-workflow";
import { revalidateCatalogMutation } from "~/server/services/catalog-revalidation";
import {
  formatProductPublishBlockers,
  getProductPublishBlockers,
} from "~/server/services/catalog-publish-readiness";
import { normalizeCouponCode } from "~/server/services/coupons";
import { postOrderRefundToLedger } from "~/server/services/finance";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";
import {
  isOwnCommerceEnabled,
  ownProductPublicationBlockReason,
} from "~/server/services/own-commerce";

export {
  createAdminCouponInputSchema,
  createAdminProductInputSchema,
  refundAdminOrderInputSchema,
  updateAdminAppointmentStatusInputSchema,
  updateAdminCouponStatusInputSchema,
  updateAdminInventoryInputSchema,
  updateAdminProductCommerceInputSchema,
  updateAdminProductMediaInputSchema,
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
      idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:shipment:${order.id}:${shipment.status}`,
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

    // OMS-006: an explicit `lines` selection refunds only those items/
    // quantities; omitting it refunds every item's remaining unrefunded
    // quantity — the exact previous full-order behavior.
    const refundLines = resolveRefundLines({
      items: order.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        refundedQuantity: item.refundedQuantity,
        unitPrice: Number(item.unitPrice),
      })),
      requestedLines: parsed.lines,
    });

    if (refundLines.length === 0) {
      throw new Error("אין פריטים לזיכוי — כל הפריטים כבר זוכו במלואם.");
    }

    const refundGrossTotal = round2(
      refundLines.reduce(
        (sum, line) => sum + line.quantity * line.unitPrice,
        0,
      ),
    );

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

    await tx.returnRequestLine.createMany({
      data: refundLines.map((line) => ({
        returnRequestId: returnRequest.id,
        orderItemId: line.orderItemId,
        quantity: line.quantity,
        amount: round2(line.quantity * line.unitPrice),
      })),
    });

    for (const line of refundLines) {
      await tx.orderItem.update({
        where: { id: line.orderItemId },
        data: { refundedQuantity: { increment: line.quantity } },
      });
    }

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
      for (const line of refundLines) {
        await tx.inventoryItem.updateMany({
          where: {
            branchId: order.branchId,
            variantId: line.variantId,
          },
          data: {
            quantity: { increment: line.quantity },
          },
        });

        await tx.inventoryLedger.create({
          data: {
            branchId: order.branchId,
            variantId: line.variantId,
            delta: line.quantity,
            reason: "return_restocked",
            reference: order.orderNumber,
          },
        });
      }
    }

    // Allocate the refund across payments in creation order, capping each
    // payment at its own remaining refundable balance — supports multiple
    // partial refunds against the same payment over time.
    let remainingToAllocate = refundGrossTotal;
    const paymentsOldestFirst = [...order.payments].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    for (const payment of paymentsOldestFirst) {
      if (remainingToAllocate <= 0) break;

      const remainingOnPayment = round2(
        Number(payment.amount) - Number(payment.refundedAmount),
      );
      if (remainingOnPayment <= 0) continue;

      const allocate = round2(Math.min(remainingOnPayment, remainingToAllocate));
      const newRefundedAmount = round2(
        Number(payment.refundedAmount) + allocate,
      );
      const paymentFullyRefunded = newRefundedAmount >= Number(payment.amount);

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: newRefundedAmount,
          ...(paymentFullyRefunded
            ? {
                status: "REFUNDED",
                providerStatus: "manual_refunded",
                refundedAt: new Date(),
              }
            : {}),
        },
      });

      remainingToAllocate = round2(remainingToAllocate - allocate);
    }

    // Only the order's own terminal status flips to REFUNDED once every
    // item is fully refunded — a partial return leaves the order in its
    // current status, which is the correct real-world shape (a partial
    // return doesn't cancel the whole order).
    const allItemsFullyRefunded = order.items.every((item) => {
      const refundedThisPass =
        refundLines.find((line) => line.orderItemId === item.id)?.quantity ??
        0;
      return item.refundedQuantity + refundedThisPass >= item.quantity;
    });

    const updated = allItemsFullyRefunded
      ? await tx.order.update({
          where: { id: order.id },
          data: { status: "REFUNDED", refundedAt: new Date() },
        })
      : order;

    // Reverse the recognised revenue/VAT/COGS in the GL, scoped to exactly
    // these lines (best-effort, mirrors the graceful sale posting — a
    // ledger gap must not block the operational refund).
    try {
      await postOrderRefundToLedger(order.id, tx, {
        lines: refundLines.map((line) => ({
          orderItemId: line.orderItemId,
          quantity: line.quantity,
        })),
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[admin] failed to post refund to ledger", error);
      }
    }

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
        partial: !allItemsFullyRefunded,
        refundedGross: refundGrossTotal,
        lines: refundLines.map((line) => ({
          orderItemId: line.orderItemId,
          quantity: line.quantity,
        })),
      },
    });

    // Keyed per return request (not per order): a partial refund is a new,
    // distinct customer-facing event each time, not a one-time-ever email.
    await createOutboxEvent(tx, {
      type: BUSINESS_EVENTS.emailRequested,
      aggregateType: "Order",
      aggregateId: order.id,
      idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:refund:${order.id}:${returnRequest.id}`,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.email,
        template: "order_refunded",
        partial: !allItemsFullyRefunded,
        refundedGross: refundGrossTotal,
      },
    });

    return {
      orderId: updated.id,
      status: updated.status,
      returnRequestId: returnRequest.id,
      refundedGross: refundGrossTotal,
      partial: !allItemsFullyRefunded,
    };
  });
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export async function updateAdminAppointmentStatus(input: {
  data: z.infer<typeof updateAdminAppointmentStatusInputSchema>;
  adminUserId: string;
}) {
  const parsed = updateAdminAppointmentStatusInputSchema.parse(input.data);

  return db.$transaction(async (tx) => {
    const current = await tx.appointment.findUnique({
      where: { id: parsed.appointmentId },
      select: { status: true },
    });

    if (!current) throw new Error("Appointment not found.");

    const transitionError = getAdminAppointmentTransitionError({
      from: current.status,
      to: parsed.status,
    });

    if (transitionError) throw new Error(transitionError);

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
    const verifiedAt = new Date();
    const created = await tx.product.create({
      data: {
        slug: parsed.slug,
        sku: parsed.sku,
        name: parsed.name,
        shortDescription: parsed.shortDescription,
        description: parsed.description,
        status: "DRAFT",
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
        countryOfManufacture: parsed.countryOfManufacture,
        manufacturerOrImporter: parsed.manufacturerOrImporter,
        materialDetails: parsed.materialDetails,
        measurements: parsed.measurements,
        stoneDetails: parsed.stoneDetails,
        factSourceReference: parsed.factSourceReference,
        factVerifiedAt: parsed.verifyFacts ? verifiedAt : null,
        factVerifiedBy: parsed.verifyFacts ? input.adminUserId : null,
        policySourceReference: parsed.policySourceReference,
        policyVerifiedAt: parsed.verifyPolicies ? verifiedAt : null,
        policyVerifiedBy: parsed.verifyPolicies ? input.adminUserId : null,
        tags: [],
        media: parsed.imageUrl
          ? {
              create: {
                url: parsed.imageUrl,
                alt: parsed.name,
                isPrimary: true,
                role: "PRIMARY",
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
      metadata: {
        slug: created.slug,
        sku: created.sku,
        factVerified: parsed.verifyFacts,
        policyVerified: parsed.verifyPolicies,
      },
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
    const verifiedAt = new Date();
    const updated = await tx.product.update({
      where: { id: parsed.productId },
      data: {
        availabilityMode: parsed.availabilityMode,
        commerceHighlights: parsed.commerceHighlights,
        deliveryPromise: parsed.deliveryPromise ?? null,
        returnPolicy: parsed.returnPolicy ?? null,
        careInstructions: parsed.careInstructions ?? null,
        warranty: parsed.warranty ?? null,
        countryOfManufacture: parsed.countryOfManufacture ?? null,
        manufacturerOrImporter: parsed.manufacturerOrImporter ?? null,
        materialDetails: parsed.materialDetails ?? null,
        measurements: parsed.measurements ?? null,
        stoneDetails: parsed.stoneDetails ?? null,
        factSourceReference: parsed.factSourceReference ?? null,
        factVerifiedAt: parsed.verifyFacts ? verifiedAt : null,
        factVerifiedBy: parsed.verifyFacts ? input.adminUserId : null,
        policySourceReference: parsed.policySourceReference ?? null,
        policyVerifiedAt: parsed.verifyPolicies ? verifiedAt : null,
        policyVerifiedBy: parsed.verifyPolicies ? input.adminUserId : null,
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
        factVerified: parsed.verifyFacts,
        policyVerified: parsed.verifyPolicies,
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

// B-07 residual: the manifest and catalog-readiness enforcement engine
// shipped 2026-07-14 without an admin surface — provenance/license fields
// could only be set by direct DB/script access. This is that surface.
export async function updateAdminProductMediaAsset(input: {
  data: z.infer<typeof updateAdminProductMediaInputSchema>;
  adminUserId: string;
}) {
  const parsed = updateAdminProductMediaInputSchema.parse(input.data);

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.productMedia.findUniqueOrThrow({
      where: { id: parsed.mediaId },
      include: { product: { include: { category: true } } },
    });

    const updated = await tx.productMedia.update({
      where: { id: parsed.mediaId },
      data: {
        provenance: parsed.provenance,
        licenseStatus: parsed.licenseStatus,
        licenseExpiresAt: parsed.licenseExpiresAt ?? null,
        isGenerated: parsed.isGenerated,
        // Unchecking "approve" explicitly revokes a stale approval rather
        // than leaving it in place — the same all-or-nothing pattern as
        // verifyFacts/verifyPolicies above.
        approvedAt: parsed.approve ? new Date() : null,
        approvedBy: parsed.approve ? input.adminUserId : null,
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "product_media_governance_updated",
      entity: "ProductMedia",
      entityId: updated.id,
      metadata: {
        productId: existing.productId,
        provenance: parsed.provenance,
        licenseStatus: parsed.licenseStatus,
        isGenerated: parsed.isGenerated,
        approved: parsed.approve,
      },
    });

    return {
      id: updated.id,
      categorySlug: existing.product.category.slug,
      productSlug: existing.product.slug,
    };
  });

  revalidateCatalogMutation({
    productSlugs: [result.productSlug],
    categorySlugs: [result.categorySlug],
  });

  return { id: result.id };
}

export async function updateAdminProductStatus(input: {
  data: z.infer<typeof updateAdminProductStatusInputSchema>;
  adminUserId: string;
}) {
  const parsed = updateAdminProductStatusInputSchema.parse(input.data);
  const product = await db.$transaction(async (tx) => {
    const current = await tx.product.findUniqueOrThrow({
      where: { id: parsed.productId },
      include: {
        media: true,
        variants: { include: { prices: true } },
      },
    });

    // ADR 0013 Gate L2 — a visible OWN product implies a purchasable OWN
    // product. Publication stays blocked until own commerce is activated.
    const gateBlock = ownProductPublicationBlockReason({
      nextStatus: parsed.status,
      ownCommerceEnabled: isOwnCommerceEnabled(),
      source: current.source,
    });
    if (gateBlock) {
      throw new Error(
        "לא ניתן לפרסם מוצר OWN: מסחר עצמי מושבת עד השלמת שער L2 (OWN_COMMERCE_ENABLED).",
      );
    }

    if (parsed.status === "ACTIVE") {
      const blockers = getProductPublishBlockers({
        ...current,
        basePrice: Number(current.basePrice),
        variants: current.variants.map((variant) => ({
          prices: variant.prices.map((price) => ({
            amount: Number(price.amount),
            validTo: price.validTo,
          })),
        })),
      });

      if (blockers.length > 0) {
        throw new Error(
          `לא ניתן לפרסם את המוצר. חסרים: ${formatProductPublishBlockers(blockers).join(", ")}.`,
        );
      }
    }

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

    // K-05 invariant: dropship (Shopify-sourced) stock is owned by the
    // supplier and must never enter the local ownership ledger. Only OWN
    // products carry local InventoryItem / InventoryLedger rows.
    if (variant.product.source !== "OWN") {
      throw new Error(
        "לא ניתן לנהל מלאי מקומי לפריט דרופשיפינג של ספק חיצוני.",
      );
    }

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
