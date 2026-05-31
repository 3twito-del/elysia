import { TRPCError } from "@trpc/server";
import type { FulfillmentMethod, Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "~/server/db";
import { cartSessionKeySchema } from "~/server/services/cart";
import { revalidateCatalogMutation } from "~/server/services/catalog-revalidation";
import {
  getActiveCouponValue,
  isCouponUsable,
} from "~/server/services/coupons";
import {
  createCommerceOrderNumber,
  createOrderItemName,
  createOrderShippingAddress,
  getDeliveryShippingTotal,
  getReservationExpiresAt,
  hasReservableStock,
  shippingAddressSchema,
} from "~/server/services/order-workflow";
import { canReserveStock } from "~/server/services/inventory";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";
import { calculateOrderTotal } from "~/server/services/pricing";

const CART_CHECKOUT_RESERVATION_MINUTES = 30;
const CART_CHECKOUT_PAYMENT_PROVIDER = "manual";
const CART_CHECKOUT_RESERVATION_MS = CART_CHECKOUT_RESERVATION_MINUTES * 60_000;

type TransactionClient = Prisma.TransactionClient;

export { isCouponUsable };

export const cartCheckoutInputSchema = z
  .object({
    sessionKey: cartSessionKeySchema,
    fulfillmentMethod: z.literal("DELIVERY").default("DELIVERY"),
    branchSlug: z.string().trim().min(1).optional(),
    customer: z.object({
      name: z.string().trim().min(2),
      email: z.string().trim().email().toLowerCase(),
      phone: z.string().trim().min(7),
    }),
    shippingAddress: shippingAddressSchema.optional(),
    giftWrap: z.boolean().default(false),
    giftMessage: z.string().trim().max(500).optional(),
    couponCode: z.string().trim().max(64).optional(),
  })
  .superRefine(validateDeliveryAddressForSchema);

function validateDeliveryAddressForSchema(
  input: {
    fulfillmentMethod: "DELIVERY";
    shippingAddress?: {
      city: string;
      postalCode?: string;
      street: string;
    };
  },
  context: z.RefinementCtx,
) {
  if (input.fulfillmentMethod !== "DELIVERY" || input.shippingAddress) return;

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: "כתובת מסירה נדרשת לבחירה במסירה עד הבית.",
    path: ["shippingAddress"],
  });
}

type CartCheckoutInput = z.infer<typeof cartCheckoutInputSchema>;

export function createCartCheckoutOrderNumber(
  now = new Date(),
  suffix?: string,
) {
  return createCommerceOrderNumber(now, suffix);
}

export function getCartCheckoutReservationExpiresAt(now = new Date()) {
  return getReservationExpiresAt({
    now,
    durationMs: CART_CHECKOUT_RESERVATION_MS,
  });
}

export function getCartCheckoutShippingTotal(method: FulfillmentMethod) {
  return getDeliveryShippingTotal(method);
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
      message: "הבחירה אינה פנויה במלואה לשמירה.",
    });
  }
}

export function assertCartCheckoutPricesAvailable(
  items: Array<{ quantity: number; unitPrice: unknown }>,
) {
  const hasUnavailablePrice = items.some((item) => {
    const unitPrice = Number(item.unitPrice);

    return item.quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0;
  });

  if (hasUnavailablePrice) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "אחד המחירים דורש אישור אישי לפני השלמת ההזמנה.",
    });
  }
}

export function assertCartCheckoutOwnItems(
  items: Array<{
    variant: {
      product: {
        source: "OWN" | "DROPSHIP_SHOPIFY";
      };
    };
  }>,
) {
  if (items.some((item) => item.variant.product.source !== "OWN")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "פריטי ספק דורשים סיום הזמנה נפרד דרך קופת הספק.",
    });
  }
}

export function getCartCheckoutOwnItems<
  T extends {
    variant: {
      product: {
        source: "OWN" | "DROPSHIP_SHOPIFY";
      };
    };
  },
>(items: T[]) {
  return items.filter((item) => item.variant.product.source === "OWN");
}

export async function createCartCheckoutOrder(input: CartCheckoutInput) {
  const parsed = cartCheckoutInputSchema.parse(input);
  const result = await db.$transaction((tx) =>
    createCartCheckoutOrderInTransaction(tx, parsed),
  );
  const { inventoryBranchSlug, ...orderResult } = result;

  revalidateCatalogMutation({ branchSlugs: [inventoryBranchSlug] });

  return orderResult;
}

async function createCartCheckoutOrderInTransaction(
  tx: TransactionClient,
  input: CartCheckoutInput,
) {
  const cart = await getActiveCheckoutCart(tx, input.sessionKey);

  if (cart.items.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "הבחירה שלך עדיין ריקה.",
    });
  }

  const ownItems = getCartCheckoutOwnItems(cart.items);

  if (ownItems.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "אין פריטים מקומיים לסיום הזמנה באתר.",
    });
  }

  assertCartCheckoutPricesAvailable(ownItems);

  const branch = await resolveOnlineFulfillmentBranch(tx, input, {
    items: ownItems,
  });

  const coupon = await resolveCoupon(tx, input.couponCode ?? cart.couponCode);
  const items = ownItems.map((item) => ({
    cartItemId: item.id,
    variantId: item.variantId,
    name: createOrderItemName({
      productName: item.variant.product.name,
      variantName: item.variant.name,
    }),
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
  const shippingAddress = createOrderShippingAddress({
    customerName: input.customer.name,
    customerPhone: input.customer.phone,
    shippingAddress: input.shippingAddress,
  });

  for (const item of ownItems) {
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
        message: `${item.variant.product.name} אינו פנוי כרגע לבחירה.`,
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

  for (const item of ownItems) {
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
        message: "מצב הבחירה השתנה בזמן יצירת ההזמנה. נסו שוב.",
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
        mode: "cart_checkout",
        reservationExpiresAt: reservationExpiresAt.toISOString(),
      },
    },
  });

  if (ownItems.length === cart.items.length) {
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
          orderId: order.id,
        },
      },
    });
  } else {
    await tx.cartItem.deleteMany({
      where: {
        id: { in: ownItems.map((item) => item.id) },
      },
    });
    await tx.cart.update({
      where: { id: cart.id },
      data: {
        customerId: customer.id,
        giftWrap: input.giftWrap,
        giftMessage: input.giftMessage,
        couponCode: coupon?.code,
        mergeMetadata: {
          localCheckoutCompletedAt: new Date().toISOString(),
          localOrderId: order.id,
          remainingSource: "DROPSHIP_SHOPIFY",
        },
      },
    });
  }

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
    inventoryBranchSlug: branch.slug,
    reservationExpiresAt,
    totals,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

async function resolveOnlineFulfillmentBranch(
  tx: TransactionClient,
  input: Pick<CartCheckoutInput, "branchSlug">,
  cart: { items: Array<{ quantity: number; variantId: string }> },
) {
  if (input.branchSlug) {
    const selectedBranch = await tx.branch.findUnique({
      where: { slug: input.branchSlug },
    });

    if (selectedBranch) return selectedBranch;

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "מקור ההתאמה שנבחר לא נמצא.",
    });
  }

  const branches = await tx.branch.findMany({
    where: { isActive: true },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  const variantIds = cart.items.map((item) => item.variantId);

  for (const branch of branches) {
    const inventoryItems = await tx.inventoryItem.findMany({
      where: {
        branchId: branch.id,
        variantId: { in: variantIds },
      },
    });
    const inventoryByVariant = new Map(
      inventoryItems.map((item) => [item.variantId, item]),
    );
    const canFulfillCart = cart.items.every((item) => {
      const inventoryItem = inventoryByVariant.get(item.variantId);

      return inventoryItem
        ? hasReservableStock({
            quantity: inventoryItem.quantity,
            reserved: inventoryItem.reserved,
            safetyStock: inventoryItem.safetyStock,
            requested: item.quantity,
          })
        : false;
    });

    if (canFulfillCart) return branch;
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "הבחירה אינה פנויה במלואה לשמירה.",
  });
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
      message: "לא נמצאה בחירה פעילה לסיום ההזמנה.",
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
      message: "קוד ההטבה אינו תקף להזמנה הזו.",
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
