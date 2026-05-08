import { TRPCError } from "@trpc/server";
import type { FulfillmentMethod, Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { z } from "zod";

import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
} from "~/lib/legal-acceptance";
import { db } from "~/server/db";
import { cartSessionKeySchema } from "~/server/services/cart";
import { revalidateCatalogMutation } from "~/server/services/catalog-revalidation";
import {
  getActiveCouponValue,
  isCouponUsable,
} from "~/server/services/coupons";
import { canReserveStock } from "~/server/services/inventory";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";
import { calculateOrderTotal } from "~/server/services/pricing";

const CART_CHECKOUT_RESERVATION_MINUTES = 30;
const CART_CHECKOUT_PAYMENT_PROVIDER = "manual";

type TransactionClient = Prisma.TransactionClient;

export { isCouponUsable };

const legalAcceptanceInputSchema = z.object({
  acceptedAt: z.string().datetime(),
  privacyVersion: z.literal(LEGAL_PRIVACY_VERSION),
  termsVersion: z.literal(LEGAL_TERMS_VERSION),
});

export const cartCheckoutInputSchema = z.object({
  sessionKey: cartSessionKeySchema,
  fulfillmentMethod: z.enum(["DELIVERY", "PICKUP"]),
  branchSlug: z.string().trim().min(1),
  customer: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().min(7),
  }),
  shippingAddress: z
    .object({
      city: z.string().trim().min(2),
      street: z.string().trim().min(2),
      postalCode: z.string().trim().optional(),
    })
    .optional(),
  giftWrap: z.boolean().default(false),
  giftMessage: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().max(64).optional(),
  legalAcceptance: legalAcceptanceInputSchema.optional(),
});

type CartCheckoutInput = z.infer<typeof cartCheckoutInputSchema>;

export function createCartCheckoutOrderNumber(
  now = new Date(),
  suffix = nanoid(6),
) {
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");

  return `APH-${datePart}-${suffix.toUpperCase()}`;
}

export function getCartCheckoutReservationExpiresAt(now = new Date()) {
  return new Date(now.getTime() + CART_CHECKOUT_RESERVATION_MINUTES * 60_000);
}

export function getCartCheckoutShippingTotal(method: FulfillmentMethod) {
  return method === "DELIVERY" ? 29 : 0;
}

export function assertCartReservationAvailable(input: {
  quantity: number;
  reserved: number;
  safetyStock: number;
  requested: number;
}) {
  if (!canReserveStock(input)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "אין מספיק מלאי זמין לשמירת כל הפריטים בסניף שנבחר.",
    });
  }
}

export async function createCartCheckoutOrder(input: CartCheckoutInput) {
  const parsed = cartCheckoutInputSchema.parse(input);
  const result = await db.$transaction((tx) =>
    createCartCheckoutOrderInTransaction(tx, parsed),
  );

  revalidateCatalogMutation({ branchSlugs: [parsed.branchSlug] });

  return result;
}

async function createCartCheckoutOrderInTransaction(
  tx: TransactionClient,
  input: CartCheckoutInput,
) {
  const cart = await getActiveCheckoutCart(tx, input.sessionKey);

  if (cart.items.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "הסל ריק. יש להוסיף פריטים לפני מעבר לקופה.",
    });
  }

  const branch = await tx.branch.findUnique({
    where: { slug: input.branchSlug },
  });

  if (!branch) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "הסניף שנבחר לא נמצא.",
    });
  }

  const coupon = await resolveCoupon(tx, input.couponCode ?? cart.couponCode);
  const items = cart.items.map((item) => ({
    cartItemId: item.id,
    variantId: item.variantId,
    name:
      item.variant.name && item.variant.name !== item.variant.product.name
        ? `${item.variant.product.name} - ${item.variant.name}`
        : item.variant.product.name,
    sku: item.variant.sku,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
  }));
  const totals = calculateOrderTotal({
    items,
    shipping: getCartCheckoutShippingTotal(input.fulfillmentMethod),
    coupon: coupon?.value,
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
  const orderNumber = createCartCheckoutOrderNumber();
  const reservationExpiresAt = getCartCheckoutReservationExpiresAt();
  const shippingAddress = input.shippingAddress
    ? ({
        recipient: input.customer.name,
        phone: input.customer.phone,
        city: input.shippingAddress.city,
        street: input.shippingAddress.street,
        postalCode: input.shippingAddress.postalCode ?? null,
      } satisfies Prisma.InputJsonObject)
    : undefined;

  for (const item of cart.items) {
    const inventoryItem = await tx.inventoryItem.findUnique({
      where: {
        branchId_variantId: {
          branchId: branch.id,
          variantId: item.variantId,
        },
      },
    });

    if (!inventoryItem) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `אין מלאי מוגדר עבור ${item.variant.product.name} בסניף שנבחר.`,
      });
    }

    assertCartReservationAvailable({
      quantity: inventoryItem.quantity,
      reserved: inventoryItem.reserved,
      safetyStock: inventoryItem.safetyStock,
      requested: item.quantity,
    });
  }

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
        create: items.map((item) => ({
          variantId: item.variantId,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
  });

  for (const item of cart.items) {
    const reserved = await tx.inventoryItem.updateMany({
      where: {
        branchId: branch.id,
        variantId: item.variantId,
        reserved: {
          lte: item.variant.inventoryItems.reduce(
            (minimum, inventoryItem) =>
              inventoryItem.branchId === branch.id
                ? inventoryItem.quantity -
                  inventoryItem.safetyStock -
                  item.quantity
                : minimum,
            0,
          ),
        },
      },
      data: {
        reserved: { increment: item.quantity },
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
        variantId: item.variantId,
        quantity: item.quantity,
        cartId: cart.id,
        orderId: order.id,
        expiresAt: reservationExpiresAt,
      },
    });

    await tx.inventoryLedger.create({
      data: {
        branchId: branch.id,
        variantId: item.variantId,
        delta: -item.quantity,
        reason: "cart_checkout_reserved",
        reference: order.orderNumber,
      },
    });
  }

  await tx.payment.create({
    data: {
      orderId: order.id,
      provider: CART_CHECKOUT_PAYMENT_PROVIDER,
      status: "PENDING",
      amount: totals.total,
      currency: "ILS",
      idempotencyKey: `cart_checkout_${order.id}`,
      rawPayload: {
        legalAcceptance: input.legalAcceptance ?? null,
        mode: "cart_checkout",
        reservationExpiresAt: reservationExpiresAt.toISOString(),
      },
    },
  });

  await tx.cart.update({
    where: { id: cart.id },
    data: {
      customerId: customer.id,
      status: "CONVERTED",
      giftWrap: input.giftWrap,
      giftMessage: input.giftMessage,
      couponCode: coupon?.code,
      mergeMetadata: {
        checkedOutAt: new Date().toISOString(),
        legalAcceptance: input.legalAcceptance ?? null,
        orderId: order.id,
      },
    },
  });

  if (coupon) {
    await tx.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });
  }

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
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    },
  });

  await createOutboxEvent(tx, {
    type: BUSINESS_EVENTS.inventoryReserved,
    aggregateType: "Order",
    aggregateId: order.id,
    idempotencyKey: `${BUSINESS_EVENTS.inventoryReserved}:${order.id}`,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      branchId: branch.id,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
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
    idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:cart-checkout:${order.id}`,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: input.customer.email,
      template: "cart_checkout_created",
    },
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    reservationExpiresAt,
    totals,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

async function getActiveCheckoutCart(
  tx: TransactionClient,
  sessionKey: string,
) {
  const cart = await tx.cart.findFirst({
    where: {
      sessionKey,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: checkoutCartInclude,
  });

  if (!cart) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "לא נמצא סל פעיל לקופה.",
    });
  }

  return cart;
}

async function resolveCoupon(
  tx: TransactionClient,
  rawCode?: string | null,
): ReturnType<typeof getActiveCouponValue> {
  const coupon = await getActiveCouponValue(rawCode, tx);

  if (rawCode && !coupon) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "קוד הקופון אינו תקף להזמנה הזו.",
    });
  }

  return coupon;
}

const checkoutCartInclude = {
  items: {
    orderBy: { id: "asc" },
    include: {
      variant: {
        include: {
          product: true,
          inventoryItems: true,
        },
      },
    },
  },
} satisfies Prisma.CartInclude;
