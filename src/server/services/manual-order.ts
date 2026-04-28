import { TRPCError } from "@trpc/server";
import type { FulfillmentMethod, OrderStatus, Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { z } from "zod";

import { env } from "~/env";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";
import { canReserveStock } from "./inventory";
import { calculateOrderTotal } from "./pricing";

const MANUAL_ORDER_RESERVATION_HOURS = 24;
const MANUAL_PAYMENT_PROVIDER = "manual";

type TransactionClient = Prisma.TransactionClient;

export const shippingAddressSchema = z.object({
  city: z.string().trim().min(2),
  street: z.string().trim().min(2),
  postalCode: z.string().trim().optional(),
});

export const createManualOrderInputSchema = z.object({
  productSlug: z.string().trim().min(1),
  variantSku: z.string().trim().min(1).optional(),
  quantity: z.number().int().positive().max(10).default(1),
  fulfillmentMethod: z.enum(["DELIVERY", "PICKUP"]),
  branchSlug: z.string().trim().min(1),
  customer: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().min(7),
  }),
  shippingAddress: shippingAddressSchema.optional(),
  giftWrap: z.boolean().default(false),
  giftMessage: z.string().trim().max(500).optional(),
});

export const adminOrderStatusSchema = z.enum([
  "PAID",
  "PREPARING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
]);

export type CreateManualOrderInput = z.infer<
  typeof createManualOrderInputSchema
>;

export type AdminOrderStatusInput = z.infer<typeof adminOrderStatusSchema>;

type ManualOrderNotificationContext = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  branchName: string;
  branchPhone: string;
  productName: string;
  sku: string;
  quantity: number;
  total: number;
  fulfillmentMethod: FulfillmentMethod;
  reservationExpiresAt: Date;
};

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

const manualOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "SHIPPED", "CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function getManualOrderShippingTotal(fulfillmentMethod: string) {
  return fulfillmentMethod === "DELIVERY" ? 29 : 0;
}

export function getManualOrderReservationExpiresAt(now = new Date()) {
  return new Date(now.getTime() + MANUAL_ORDER_RESERVATION_HOURS * 60 * 60_000);
}

export function createManualOrderNumber(now = new Date(), suffix = nanoid(6)) {
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `APH-${datePart}-${suffix.toUpperCase()}`;
}

export function calculateManualOrderTotals(input: {
  unitPrice: number;
  quantity: number;
  fulfillmentMethod: string;
}) {
  return calculateOrderTotal({
    items: [{ unitPrice: input.unitPrice, quantity: input.quantity }],
    shipping: getManualOrderShippingTotal(input.fulfillmentMethod),
  });
}

export function assertManualReservationAvailable(input: {
  quantity: number;
  reserved: number;
  safetyStock: number;
  requested: number;
}) {
  if (!canReserveStock(input)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "אין מספיק מלאי זמין לשמירת ההזמנה בסניף שנבחר.",
    });
  }
}

export function assertManualOrderTransitionAllowed(input: {
  currentStatus: OrderStatus;
  nextStatus: AdminOrderStatusInput;
  fulfillmentMethod: FulfillmentMethod;
}) {
  if (input.currentStatus === input.nextStatus) return;

  const allowedStatuses = manualOrderTransitions[input.currentStatus];
  const nextStatus = input.nextStatus as OrderStatus;

  if (!allowedStatuses.includes(nextStatus)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "לא ניתן לבצע מעבר סטטוס זה להזמנה ידנית.",
    });
  }

  if (
    input.nextStatus === "READY_FOR_PICKUP" &&
    input.fulfillmentMethod !== "PICKUP"
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "הזמנת משלוח לא יכולה לעבור לסטטוס מוכן לאיסוף.",
    });
  }

  if (
    input.nextStatus === "SHIPPED" &&
    input.fulfillmentMethod !== "DELIVERY"
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "הזמנת איסוף לא יכולה לעבור לסטטוס נשלחה.",
    });
  }
}

export function createManualOrderStatusAuditMetadata(input: {
  orderNumber: string;
  oldStatus: OrderStatus;
  newStatus: AdminOrderStatusInput;
}) {
  return {
    orderNumber: input.orderNumber,
    oldStatus: input.oldStatus,
    newStatus: input.newStatus,
  } satisfies Prisma.InputJsonObject;
}

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
      message: "הסניף שנבחר לא נמצא.",
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
      message: "המוצר לא נמצא או אינו פעיל.",
    });
  }

  const variant = input.variantSku
    ? product.variants.find((item) => item.sku === input.variantSku)
    : product.variants[0];

  if (!variant) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "למוצר אין וריאציה זמינה להזמנה.",
    });
  }

  const price = variant.prices[0];

  if (!price) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "למוצר אין מחיר פעיל בשקלים.",
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
      message: "אין מלאי מוגדר למוצר בסניף שנבחר.",
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
  const shippingAddress = input.shippingAddress
    ? ({
        recipient: input.customer.name,
        phone: input.customer.phone,
        city: input.shippingAddress.city,
        street: input.shippingAddress.street,
        postalCode: input.shippingAddress.postalCode ?? null,
      } satisfies Prisma.InputJsonObject)
    : undefined;

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
          name:
            variant.name && variant.name !== product.name
              ? `${product.name} - ${variant.name}`
              : product.name,
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
      message: "המלאי השתנה בזמן יצירת ההזמנה. נסו שוב.",
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

export function formatManualOrderAmount(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function createManualOrderCustomerMessage(
  input: ManualOrderNotificationContext,
) {
  const fulfillmentText =
    input.fulfillmentMethod === "PICKUP"
      ? `איסוף מסניף ${input.branchName}`
      : "משלוח לכתובת שנמסרה";

  return {
    to: input.customerEmail,
    toName: input.customerName,
    subject: `בקשת ההזמנה ${input.orderNumber} התקבלה`,
    body: [
      `${input.customerName} שלום,`,
      `בקשת ההזמנה שלך ב-Aphrodite התקבלה ונשמרה לטיפול נציג.`,
      `מספר הזמנה: ${input.orderNumber}`,
      `פריט: ${input.productName}`,
      `כמות: ${input.quantity}`,
      `סכום לתשלום באישור ידני: ${formatManualOrderAmount(input.total)}`,
      `אופן קבלה: ${fulfillmentText}`,
      `המלאי נשמר עד ${input.reservationExpiresAt.toLocaleString("he-IL")}.`,
      `צוות Aphrodite יחזור אליך לאישור סופי והמשך טיפול.`,
    ].join("\n\n"),
  };
}

export function createManualOrderOperationsMessage(
  input: ManualOrderNotificationContext,
) {
  return {
    to: env.OPERATIONS_EMAIL ?? "",
    subject: `בקשת הזמנה חדשה ${input.orderNumber}`,
    body: [
      `נוצרה בקשת הזמנה חדשה לטיפול ידני.`,
      `מספר הזמנה: ${input.orderNumber}`,
      `לקוח: ${input.customerName}`,
      `אימייל: ${input.customerEmail}`,
      `טלפון: ${input.customerPhone}`,
      `פריט: ${input.productName}`,
      `SKU: ${input.sku}`,
      `כמות: ${input.quantity}`,
      `סכום: ${formatManualOrderAmount(input.total)}`,
      `סניף: ${input.branchName}`,
      `טלפון סניף: ${input.branchPhone}`,
      `Fulfillment: ${input.fulfillmentMethod}`,
      `שמירת מלאי עד: ${input.reservationExpiresAt.toISOString()}`,
    ].join("\n"),
  };
}

async function sendManualOrderNotifications(
  input: ManualOrderNotificationContext,
) {
  if (!notificationProvider.isOperational()) {
    await recordManualOrderNotificationJob({
      input,
      jobType: "manual_order_notification",
      recipient: input.customerEmail,
      status: "FAILED",
      lastError: "No transactional email provider is configured.",
    });
    return;
  }

  await sendManualOrderNotificationMessage({
    input,
    jobType: "manual_order_customer_confirmation",
    recipient: input.customerEmail,
    message: createManualOrderCustomerMessage(input),
  });

  if (!env.OPERATIONS_EMAIL) {
    await recordManualOrderNotificationJob({
      input,
      jobType: "manual_order_operations_notification",
      recipient: null,
      status: "FAILED",
      lastError: "OPERATIONS_EMAIL is not configured.",
    });
    return;
  }

  await sendManualOrderNotificationMessage({
    input,
    jobType: "manual_order_operations_notification",
    recipient: env.OPERATIONS_EMAIL,
    message: createManualOrderOperationsMessage(input),
  });
}

async function sendManualOrderNotificationMessage(input: {
  input: ManualOrderNotificationContext;
  jobType: string;
  recipient: string;
  message: Parameters<typeof notificationProvider.sendEmail>[0];
}) {
  try {
    const result = await notificationProvider.sendEmail(input.message);
    await recordManualOrderNotificationJob({
      input: input.input,
      jobType: input.jobType,
      recipient: input.recipient,
      status: "COMPLETED",
      providerMessageId: result.id,
    });
  } catch (error) {
    await recordManualOrderNotificationJob({
      input: input.input,
      jobType: input.jobType,
      recipient: input.recipient,
      status: "FAILED",
      lastError: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function recordManualOrderNotificationJob(input: {
  input: ManualOrderNotificationContext;
  jobType: string;
  recipient: string | null;
  status: "COMPLETED" | "FAILED";
  providerMessageId?: string;
  lastError?: string;
}) {
  try {
    await db.integrationJob.create({
      data: {
        provider: notificationProvider.providerName(),
        jobType: input.jobType,
        status: input.status,
        attempts: input.status === "COMPLETED" ? 1 : 0,
        lastError: input.lastError,
        finishedAt: new Date(),
        payload: {
          orderId: input.input.orderId,
          orderNumber: input.input.orderNumber,
          recipient: input.recipient,
          providerMessageId: input.providerMessageId,
        },
      },
    });
  } catch (error) {
    console.error("[manual-order:notification-job]", error);
  }
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
    branchName: order.branch?.name ?? "ללא סניף",
    branchCity: order.branch?.city ?? "",
    createdAt: order.createdAt,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    paymentStatus: order.payments[0]?.status ?? "PENDING",
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
        name: "Brevo transactional email",
        status: notificationProvider.isOperational() ? "active" : "missing-key",
      },
      {
        name: "Operations inbox",
        status: env.OPERATIONS_EMAIL ? "active" : "missing-email",
      },
      { name: "Typesense", status: "local-fallback" },
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
        data: { status: "CAPTURED" },
      });
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: input.status },
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

    return {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    };
  });
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
