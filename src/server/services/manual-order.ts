import { TRPCError } from "@trpc/server";
import type { OrderStatus, Prisma } from "@prisma/client";

import { env } from "~/env";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";
import {
  createOrderItemName,
  createOrderShippingAddress,
} from "./order-workflow";
import {
  assertManualOrderTransitionAllowed,
  assertManualReservationAvailable,
  calculateManualOrderTotals,
  createManualOrderNumber,
  createManualOrderStatusAuditMetadata,
  getManualOrderReservationExpiresAt,
  MANUAL_PAYMENT_PROVIDER,
  type AdminOrderStatusInput,
  type CreateManualOrderInput,
} from "./manual-order-contract";
import {
  sendManualOrderNotifications,
  type ManualOrderNotificationContext,
} from "./manual-order-notifications";
import { BUSINESS_EVENTS, createOutboxEvent } from "./outbox";

export {
  adminOrderStatusSchema,
  assertManualOrderTransitionAllowed,
  assertManualReservationAvailable,
  calculateManualOrderTotals,
  createManualOrderInputSchema,
  createManualOrderNumber,
  createManualOrderStatusAuditMetadata,
  getManualOrderReservationExpiresAt,
  getManualOrderShippingTotal,
  shippingAddressSchema,
} from "./manual-order-contract";
export {
  createManualOrderCustomerMessage,
  createManualOrderOperationsMessage,
  formatManualOrderAmount,
  redactManualOrderNotificationRecipient,
} from "./manual-order-notifications";
export type {
  AdminOrderStatusInput,
  CreateManualOrderInput,
} from "./manual-order-contract";
export type { ManualOrderNotificationContext } from "./manual-order-notifications";

type TransactionClient = Prisma.TransactionClient;

type ManualOrderTransactionResult = {
  response: {
    orderId: string;
    orderNumber: string;
    status: OrderStatus;
    reservationExpiresAt: Date;
    totals: ReturnType<typeof calculateManualOrderTotals>;
  };
  notification: ManualOrderNotificationContext;
};

export async function createManualOrder(input: CreateManualOrderInput) {
  const result = await db.$transaction((tx) =>
    createManualOrderInTransaction(tx, input),
  );

  await sendManualOrderNotifications(result.notification);

  return result.response;
}

async function createManualOrderInTransaction(
  tx: TransactionClient,
  input: CreateManualOrderInput,
): Promise<ManualOrderTransactionResult> {
  const branch = await tx.branch.findUnique({
    where: { slug: input.branchSlug },
  });

  if (!branch) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ערוץ השירות שנבחר לא נמצא.",
    });
  }

  const product = await tx.product.findFirst({
    where: { slug: input.productSlug, status: "ACTIVE" },
    include: {
      variants: {
        orderBy: { isDefault: "desc" },
        include: {
          prices: {
            where: {
              currency: "ILS",
              OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
            },
            orderBy: { validFrom: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "התכשיט לא נמצא או אינו פתוח להזמנה.",
    });
  }

  const variant = input.variantSku
    ? product.variants.find((item) => item.sku === input.variantSku)
    : product.variants[0];

  if (!variant) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "לתכשיט אין התאמה פנויה להזמנה.",
    });
  }

  const price = variant.prices[0];

  if (!price) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "לתכשיט אין פרטי מחיר פעילים בשקלים.",
    });
  }

  const inventoryItem = await tx.inventoryItem.findUnique({
    where: {
      branchId_variantId: {
        branchId: branch.id,
        variantId: variant.id,
      },
    },
  });

  if (!inventoryItem) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "אין התאמה מוגדרת לתכשיט בערוץ שנבחר.",
    });
  }

  assertManualReservationAvailable({
    quantity: inventoryItem.quantity,
    reserved: inventoryItem.reserved,
    safetyStock: inventoryItem.safetyStock,
    requested: input.quantity,
  });

  const unitPrice = Number(price.amount) + Number(variant.priceDelta);
  const totals = calculateManualOrderTotals({
    unitPrice,
    quantity: input.quantity,
    fulfillmentMethod: input.fulfillmentMethod,
  });

  const customer = await tx.customer.upsert({
    where: { email: input.customer.email },
    update: {
      phone: input.customer.phone,
      firstName: input.customer.name,
    },
    create: {
      email: input.customer.email,
      phone: input.customer.phone,
      firstName: input.customer.name,
    },
  });

  const cart = await tx.cart.create({
    data: {
      customerId: customer.id,
      status: "CONVERTED",
      currency: "ILS",
      giftWrap: input.giftWrap,
      giftMessage: input.giftMessage,
      items: {
        create: {
          variantId: variant.id,
          branchId: branch.id,
          quantity: input.quantity,
          unitPrice,
        },
      },
    },
  });

  const orderNumber = createManualOrderNumber();
  const reservationExpiresAt = getManualOrderReservationExpiresAt();
  const shippingAddress = createOrderShippingAddress({
    customerName: input.customer.name,
    customerPhone: input.customer.phone,
    shippingAddress: input.shippingAddress,
  });

  const order = await tx.order.create({
    data: {
      orderNumber,
      cartId: cart.id,
      customerId: customer.id,
      branchId: branch.id,
      status: "PENDING_PAYMENT",
      fulfillmentMethod: input.fulfillmentMethod,
      currency: "ILS",
      subtotal: totals.subtotal,
      discountTotal: totals.discount,
      shippingTotal: totals.shipping,
      total: totals.total,
      email: input.customer.email,
      phone: input.customer.phone,
      recipientName: input.customer.name,
      shippingAddress,
      items: {
        create: {
          variantId: variant.id,
          name: createOrderItemName({
            productName: product.name,
            variantName: variant.name,
          }),
          sku: variant.sku,
          quantity: input.quantity,
          unitPrice,
        },
      },
    },
  });

  const reserved = await tx.inventoryItem.updateMany({
    where: {
      id: inventoryItem.id,
      reserved: {
        lte:
          inventoryItem.quantity - inventoryItem.safetyStock - input.quantity,
      },
    },
    data: {
      reserved: { increment: input.quantity },
    },
  });

  if (reserved.count !== 1) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "מצב הסל השתנה בזמן יצירת ההזמנה. נסו שוב.",
    });
  }

  await tx.inventoryReservation.create({
    data: {
      branchId: branch.id,
      variantId: variant.id,
      quantity: input.quantity,
      cartId: cart.id,
      orderId: order.id,
      expiresAt: reservationExpiresAt,
    },
  });

  await tx.inventoryLedger.create({
    data: {
      branchId: branch.id,
      variantId: variant.id,
      delta: -input.quantity,
      reason: "manual_order_reserved",
      reference: order.orderNumber,
    },
  });

  await tx.payment.create({
    data: {
      orderId: order.id,
      provider: MANUAL_PAYMENT_PROVIDER,
      status: "PENDING",
      amount: totals.total,
      currency: "ILS",
      idempotencyKey: `manual_${order.id}`,
      rawPayload: {
        mode: "manual_order_request",
        reservationExpiresAt: reservationExpiresAt.toISOString(),
      },
    },
  });

  await createOutboxEvent(tx, {
    type: BUSINESS_EVENTS.orderCreated,
    aggregateType: "Order",
    aggregateId: order.id,
    idempotencyKey: `${BUSINESS_EVENTS.orderCreated}:${order.id}`,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: customer.id,
      total: totals.total,
      fulfillmentMethod: input.fulfillmentMethod,
    },
  });

  await createOutboxEvent(tx, {
    type: BUSINESS_EVENTS.inventoryReserved,
    aggregateType: "Order",
    aggregateId: order.id,
    idempotencyKey: `${BUSINESS_EVENTS.inventoryReserved}:${order.id}:${variant.id}:${branch.id}`,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      branchId: branch.id,
      variantId: variant.id,
      quantity: input.quantity,
      reservationExpiresAt: reservationExpiresAt.toISOString(),
    },
  });

  await createOutboxEvent(tx, {
    type: BUSINESS_EVENTS.inventoryReservationExpired,
    aggregateType: "Order",
    aggregateId: order.id,
    idempotencyKey: `${BUSINESS_EVENTS.inventoryReservationExpired}:${order.id}`,
    availableAt: reservationExpiresAt,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reservationExpiresAt: reservationExpiresAt.toISOString(),
    },
  });

  await createOutboxEvent(tx, {
    type: BUSINESS_EVENTS.emailRequested,
    aggregateType: "Order",
    aggregateId: order.id,
    idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:manual-order:${order.id}`,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: input.customer.email,
      operationsEmail: env.OPERATIONS_EMAIL ?? null,
      template: "manual_order_created",
    },
  });

  return {
    response: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      reservationExpiresAt,
      totals,
    },
    notification: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      customerPhone: input.customer.phone,
      branchName: branch.name,
      branchPhone: branch.phone,
      productName: product.name,
      sku: variant.sku,
      quantity: input.quantity,
      total: totals.total,
      fulfillmentMethod: input.fulfillmentMethod,
      reservationExpiresAt,
    },
  };
}

export async function listAdminOrders(input: { limit?: number } = {}) {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 20,
    include: {
      branch: true,
      customer: true,
      items: true,
      payments: true,
      returns: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      shipments: {
        orderBy: { shippedAt: "desc" },
        take: 1,
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    total: Number(order.total),
    email: order.email,
    phone: order.phone,
    recipientName: order.recipientName,
    branchName: order.branch?.name ?? "שירות מרחוק",
    branchCity: order.branch?.city ?? "",
    createdAt: order.createdAt,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    paymentStatus: order.payments[0]?.status ?? "PENDING",
    returns: order.returns.map((request) => ({
      id: request.id,
      reason: request.reason,
      status: request.status,
      notes: request.notes,
      createdAt: request.createdAt,
    })),
    shipment: order.shipments[0]
      ? {
          id: order.shipments[0].id,
          provider: order.shipments[0].provider,
          tracking: order.shipments[0].tracking,
          status: order.shipments[0].status,
          shippedAt: order.shipments[0].shippedAt,
          deliveredAt: order.shipments[0].deliveredAt,
        }
      : null,
  }));
}

export async function getAdminOverview() {
  const [
    products,
    activeProducts,
    branches,
    inventory,
    pendingAppointments,
    openOrders,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.branch.count(),
    db.inventoryItem.aggregate({ _sum: { quantity: true } }),
    db.appointment.count({ where: { status: "REQUESTED" } }),
    db.order.count({
      where: {
        status: {
          in: ["PENDING_PAYMENT", "PAID", "PREPARING", "READY_FOR_PICKUP"],
        },
      },
    }),
  ]);

  return {
    products,
    activeProducts,
    branches,
    inventoryUnits: inventory._sum.quantity ?? 0,
    pendingAppointments,
    openOrders,
    integrations: [
      { name: "Manual orders", status: "active" },
      { name: "CardCom", status: "disabled" },
      {
        name: `${notificationProvider.providerName()} transactional email`,
        status: notificationProvider.isOperational() ? "active" : "missing-key",
      },
      {
        name: "Operations inbox",
        status: env.OPERATIONS_EMAIL ? "active" : "missing-email",
      },
      {
        name: "Typesense",
        status:
          env.TYPESENSE_HOST && env.TYPESENSE_API_KEY
            ? "active"
            : env.NODE_ENV === "production"
              ? "missing-config"
              : "local-dev-fallback",
      },
    ],
  };
}

export async function updateManualOrderStatus(input: {
  orderId: string;
  status: AdminOrderStatusInput;
  adminUserId: string;
}) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: {
        payments: true,
      },
    });

    if (!order) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ההזמנה לא נמצאה.",
      });
    }

    assertManualOrderTransitionAllowed({
      currentStatus: order.status,
      nextStatus: input.status,
      fulfillmentMethod: order.fulfillmentMethod,
    });

    if (input.status === "CANCELLED") {
      await releaseManualOrderReservations(tx, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason: "manual_order_cancelled",
        ledgerDeltaDirection: 1,
        decrementPhysicalStock: false,
      });

      await tx.payment.updateMany({
        where: { orderId: order.id, provider: MANUAL_PAYMENT_PROVIDER },
        data: { status: "FAILED" },
      });
    }

    if (input.status === "COMPLETED") {
      await releaseManualOrderReservations(tx, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason: "manual_order_completed",
        ledgerDeltaDirection: -1,
        decrementPhysicalStock: true,
      });
    }

    if (input.status === "PAID") {
      await tx.payment.updateMany({
        where: { orderId: order.id, provider: MANUAL_PAYMENT_PROVIDER },
        data: {
          status: "CAPTURED",
          providerStatus: "manual_confirmed",
          capturedAt: new Date(),
        },
      });
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        ...getManualOrderStatusTimestampUpdate(input.status),
      },
    });

    await tx.auditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: "manual_order_status_updated",
        entity: "Order",
        entityId: order.id,
        metadata: createManualOrderStatusAuditMetadata({
          orderNumber: order.orderNumber,
          oldStatus: order.status,
          newStatus: input.status,
        }),
      },
    });

    if (input.status === "PAID") {
      await createOutboxEvent(tx, {
        type: BUSINESS_EVENTS.paymentCaptured,
        aggregateType: "Order",
        aggregateId: order.id,
        idempotencyKey: `${BUSINESS_EVENTS.paymentCaptured}:${order.id}`,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          provider: MANUAL_PAYMENT_PROVIDER,
        },
      });
    }

    await createOutboxEvent(tx, {
      type: BUSINESS_EVENTS.emailRequested,
      aggregateType: "Order",
      aggregateId: order.id,
      idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:order-status:${order.id}:${input.status}`,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.email,
        template: "order_status_updated",
        status: input.status,
      },
    });

    return {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    };
  });
}

function getManualOrderStatusTimestampUpdate(
  status: AdminOrderStatusInput,
): Prisma.OrderUpdateInput {
  const now = new Date();

  switch (status) {
    case "PAID":
      return { paidAt: now };
    case "PREPARING":
      return { preparingAt: now };
    case "READY_FOR_PICKUP":
      return { readyForPickupAt: now };
    case "SHIPPED":
      return { shippedAt: now };
    case "COMPLETED":
      return { completedAt: now };
    case "CANCELLED":
      return { cancelledAt: now };
  }

  return {};
}

async function releaseManualOrderReservations(
  tx: TransactionClient,
  input: {
    orderId: string;
    orderNumber: string;
    reason: string;
    ledgerDeltaDirection: 1 | -1;
    decrementPhysicalStock: boolean;
  },
) {
  const reservations = await tx.inventoryReservation.findMany({
    where: {
      orderId: input.orderId,
      releasedAt: null,
    },
  });

  for (const reservation of reservations) {
    await tx.inventoryItem.update({
      where: {
        branchId_variantId: {
          branchId: reservation.branchId,
          variantId: reservation.variantId,
        },
      },
      data: {
        reserved: { decrement: reservation.quantity },
        ...(input.decrementPhysicalStock
          ? { quantity: { decrement: reservation.quantity } }
          : {}),
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
        delta: input.ledgerDeltaDirection * reservation.quantity,
        reason: input.reason,
        reference: input.orderNumber,
      },
    });
  }
}
