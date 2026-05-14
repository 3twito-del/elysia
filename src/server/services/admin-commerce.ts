import type { OrderStatus, Prisma } from "@prisma/client";
import type { z } from "zod";

import {
  createAdminCouponInputSchema,
  createAdminProductInputSchema,
  refundAdminOrderInputSchema,
  updateAdminAppointmentStatusInputSchema,
  updateAdminCouponStatusInputSchema,
  updateAdminInventoryInputSchema,
  updateAdminProductStatusInputSchema,
  upsertAdminShipmentInputSchema,
} from "~/lib/admin-validation";
import { db } from "~/server/db";
import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog";
import { revalidateCatalogMutation } from "~/server/services/catalog-revalidation";
import { normalizeCouponCode } from "~/server/services/coupons";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";

type TransactionClient = Prisma.TransactionClient;

export {
  createAdminCouponInputSchema,
  createAdminProductInputSchema,
  refundAdminOrderInputSchema,
  updateAdminAppointmentStatusInputSchema,
  updateAdminCouponStatusInputSchema,
  updateAdminInventoryInputSchema,
  updateAdminProductStatusInputSchema,
  upsertAdminShipmentInputSchema,
} from "~/lib/admin-validation";

export function canRefundOrderStatus(status: OrderStatus) {
  return [
    "PAID",
    "PREPARING",
    "READY_FOR_PICKUP",
    "SHIPPED",
    "COMPLETED",
  ].includes(status);
}

export function shouldRestockRefundedOrder(input: {
  status: OrderStatus;
  restockItems: boolean;
}) {
  return input.restockItems && ["SHIPPED", "COMPLETED"].includes(input.status);
}

export async function listAdminCatalog() {
  const [products, categories, materials, stones, branches, coupons] =
    await Promise.all([
      db.product.findMany({
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: {
          category: true,
          material: true,
          stone: true,
          variants: {
            include: {
              inventoryItems: { include: { branch: true } },
              prices: {
                orderBy: { validFrom: "desc" },
                take: 1,
              },
            },
          },
          media: {
            where: { kind: "IMAGE" },
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            select: { url: true },
            take: 1,
          },
        },
      }),
      db.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      db.material.findMany({ orderBy: { name: "asc" } }),
      db.stone.findMany({ orderBy: { name: "asc" } }),
      db.branch.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] }),
      db.coupon.findMany({ orderBy: { startsAt: "desc" }, take: 20 }),
    ]);

  return {
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      image: product.media[0]?.url ?? DEFAULT_CATALOG_IMAGE,
      status: product.status,
      categoryName: product.category.name,
      materialName: product.material.name,
      stoneName: product.stone?.name ?? null,
      basePrice: Number(product.basePrice),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: Number(variant.prices[0]?.amount ?? product.basePrice),
        inventory: variant.inventoryItems.map((item) => ({
          branchId: item.branchId,
          branchName: item.branch.name,
          quantity: item.quantity,
          reserved: item.reserved,
          safetyStock: item.safetyStock,
        })),
      })),
    })),
    categories: categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
    })),
    materials: materials.map((material) => ({
      id: material.id,
      slug: material.slug,
      name: material.name,
    })),
    stones: stones.map((stone) => ({
      id: stone.id,
      slug: stone.slug,
      name: stone.name,
    })),
    branches: branches.map((branch) => ({
      id: branch.id,
      slug: branch.slug,
      name: branch.name,
      city: branch.city,
    })),
    coupons: coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      percentOff: coupon.percentOff,
      amountOff: coupon.amountOff ? Number(coupon.amountOff) : null,
      startsAt: coupon.startsAt,
      endsAt: coupon.endsAt,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount,
      isActive: coupon.isActive,
    })),
  };
}

export async function listAdminCustomers(input: { limit?: number } = {}) {
  const customers = await db.customer.findMany({
    orderBy: { updatedAt: "desc" },
    take: input.limit ?? 50,
    include: {
      orders: { select: { id: true, total: true } },
      wishlist: { include: { items: true } },
      addresses: true,
    },
  });

  return customers.map((customer) => ({
    id: customer.id,
    email: customer.email,
    phone: customer.phone,
    name: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
    orders: customer.orders.length,
    lifetimeValue: customer.orders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    ),
    wishlistItems: customer.wishlist?.items.length ?? 0,
    addresses: customer.addresses.length,
    updatedAt: customer.updatedAt,
  }));
}

export async function listAdminAppointments(input: { limit?: number } = {}) {
  const appointments = await db.appointment.findMany({
    orderBy: { startsAt: "asc" },
    take: input.limit ?? 25,
    include: {
      branch: true,
      customer: true,
    },
  });

  return appointments.map((appointment) => ({
    id: appointment.id,
    topic: appointment.topic,
    name: appointment.name,
    email: appointment.email,
    phone: appointment.phone,
    startsAt: appointment.startsAt,
    status: appointment.status,
    notes: appointment.notes,
    branchName: appointment.branch.name,
    branchCity: appointment.branch.city,
    customerId: appointment.customerId,
  }));
}

export async function getAdminOrderDetail(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      branch: true,
      customer: true,
      items: true,
      payments: true,
      shipments: true,
      returns: true,
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    totals: {
      subtotal: Number(order.subtotal),
      discount: Number(order.discountTotal),
      shipping: Number(order.shippingTotal),
      total: Number(order.total),
    },
    customer: {
      id: order.customerId,
      email: order.email,
      phone: order.phone,
      name: order.recipientName,
    },
    branch: order.branch
      ? {
          id: order.branch.id,
          name: order.branch.name,
          city: order.branch.city,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
    payments: order.payments.map((payment) => ({
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      providerStatus: payment.providerStatus,
      amount: Number(payment.amount),
    })),
    shipments: order.shipments,
    returns: order.returns,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

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
        isDefault: true,
        prices: {
          create: {
            amount: parsed.basePrice,
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

async function writeAdminAudit(
  tx: TransactionClient,
  input: {
    adminUserId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await tx.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}

async function releaseOutstandingReservationsForRefund(
  tx: TransactionClient,
  input: {
    orderId: string;
    orderNumber: string;
  },
) {
  const reservations = await tx.inventoryReservation.findMany({
    where: {
      orderId: input.orderId,
      releasedAt: null,
    },
  });

  for (const reservation of reservations) {
    await tx.inventoryItem.updateMany({
      where: {
        branchId: reservation.branchId,
        variantId: reservation.variantId,
        reserved: { gte: reservation.quantity },
      },
      data: {
        reserved: { decrement: reservation.quantity },
      },
    });

    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { releasedAt: new Date() },
    });

    await tx.inventoryLedger.create({
      data: {
        branchId: reservation.branchId,
        variantId: reservation.variantId,
        delta: reservation.quantity,
        reason: "refund_reservation_released",
        reference: input.orderNumber,
      },
    });
  }
}

async function createSearchReindexEvent(
  tx: TransactionClient,
  input: { aggregateId: string; reason: string },
) {
  await createOutboxEvent(tx, {
    type: BUSINESS_EVENTS.searchReindexRequested,
    aggregateType: "Product",
    aggregateId: input.aggregateId,
    idempotencyKey: `${BUSINESS_EVENTS.searchReindexRequested}:${input.reason}:${input.aggregateId}:${Date.now()}`,
    payload: input,
  });
}
