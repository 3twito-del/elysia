import { TRPCError } from "@trpc/server";
import type { FulfillmentMethod, Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "~/server/db";
import { recordAnalyticsEvent } from "~/server/services/analytics";
import { cartSessionKeySchema } from "~/server/services/cart";
import { revalidateCatalogMutation } from "~/server/services/catalog-revalidation";
import {
  evaluateCouponCode,
  getActiveCouponValue,
  isCouponUsable,
} from "~/server/services/coupons";
import {
  createCommerceOrderNumber,
  createOrderItemName,
  createOrderShippingAddress,
  getDeliveryShippingTotal,
  getReservationExpiresAt,
  shippingAddressSchema,
} from "~/server/services/order-workflow";
import {
  resolveItemFulfillment,
  type ItemFulfillmentPlan,
} from "~/server/services/inventory";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";
import { calculateOrderTotal } from "~/server/services/pricing";

// UX15: aligned with the manual-order reservation window
// (manual-order-contract.ts's MANUAL_ORDER_RESERVATION_HOURS) and the
// documented "InventoryReservation holds stock for 24h on checkout"
// contract -- this used to be 30 minutes, a much tighter window than the
// rest of the architecture assumes, especially before checkout.createPayment
// had a client-side "pay now" step wired up.
const CART_CHECKOUT_RESERVATION_HOURS = 24;
const CART_CHECKOUT_PAYMENT_PROVIDER = "manual";
const CART_CHECKOUT_RESERVATION_MS =
  CART_CHECKOUT_RESERVATION_HOURS * 60 * 60_000;

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
    message: "כתובת מסירה נדרשת למסירה עד הבית.",
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
      message: "אחד המחירים דורש בדיקה לפני שתמשיכי לתשלום.",
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
      message: "פריטים אלה דורשים סיום הזמנה נפרד.",
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
  const { analyticsCustomerId, inventoryBranchSlug, ...orderResult } = result;

  revalidateCatalogMutation({ branchSlugs: [inventoryBranchSlug] });
  await recordCheckoutAnalyticsSafely([
    {
      type: "checkout_started",
      sessionKey: parsed.sessionKey,
      customerId: analyticsCustomerId,
      orderId: orderResult.orderId,
      consentMode: "business",
      payload: {
        itemCount: orderResult.itemCount,
        total: orderResult.totals.total,
        fulfillmentMethod: parsed.fulfillmentMethod,
      },
      idempotencyKey: `checkout_started:${orderResult.orderId}`,
    },
    {
      type: "order_created",
      sessionKey: parsed.sessionKey,
      customerId: analyticsCustomerId,
      orderId: orderResult.orderId,
      consentMode: "business",
      payload: {
        itemCount: orderResult.itemCount,
        total: orderResult.totals.total,
        currency: "ILS",
        fulfillmentMethod: parsed.fulfillmentMethod,
      },
      idempotencyKey: `order_created:${orderResult.orderId}`,
    },
  ]);

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
      message: "הסל עדיין ריק.",
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
    items: ownItems.map((item) => ({
      quantity: item.quantity,
      variantId: item.variantId,
      backorderEnabled: item.variant.product.backorderEnabled,
    })),
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
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
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

  // OMS-002: resolved once per variant here (not re-derived after order
  // creation), so the exact same snapshot drives both the OrderItem's
  // backorderedQuantity and the reservation/backorder split below.
  const fulfillmentPlans = new Map<string, ItemFulfillmentPlan>();

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
        message: `${item.variant.product.name} אינו פנוי כרגע להזמנה.`,
      });
    }

    const plan = resolveItemFulfillment({
      quantity: inventoryItem.quantity,
      reserved: inventoryItem.reserved,
      safetyStock: inventoryItem.safetyStock,
      requested: item.quantity,
      backorderEnabled: item.variant.product.backorderEnabled,
    });

    if (!plan) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `${item.variant.product.name} אינו פנוי בכמות המבוקשת. עדכני את הכמות בסל ונסי שוב.`,
      });
    }

    fulfillmentPlans.set(item.variantId, plan);
  }

  const order = await tx.order.create({
    include: { items: true },
    data: {
      orderNumber,
      cartId: cart.id,
      customerId: customer.id,
      branchId: branch.id,
      status: "PENDING_PAYMENT",
      financialTreatment: "OWN_SALE",
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
          backorderedQuantity:
            fulfillmentPlans.get(item.variantId)?.backorder ?? 0,
        })),
      },
    },
  });
  const orderItemIdByVariant = new Map(
    order.items.map((orderItem) => [orderItem.variantId, orderItem.id]),
  );

  for (const item of ownItems) {
    const plan = fulfillmentPlans.get(item.variantId)!;

    // OMS-002: only reserve real stock for the part that isn't backordered
    // -- the CAS threshold and increment both use `reserveNow`, not the
    // full requested quantity, so a fully-backordered line (reserveNow=0)
    // correctly touches no inventory at all.
    if (plan.reserveNow > 0) {
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
                    plan.reserveNow
                  : minimum,
              0,
            ),
          },
        },
        data: {
          reserved: { increment: plan.reserveNow },
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
          variantId: item.variantId,
          quantity: plan.reserveNow,
          cartId: cart.id,
          orderId: order.id,
          expiresAt: reservationExpiresAt,
        },
      });

      await tx.inventoryLedger.create({
        data: {
          branchId: branch.id,
          variantId: item.variantId,
          delta: -plan.reserveNow,
          reason: "cart_checkout_reserved",
          reference: order.orderNumber,
        },
      });
    }

    if (plan.backorder > 0) {
      await tx.backorder.create({
        data: {
          branchId: branch.id,
          variantId: item.variantId,
          orderId: order.id,
          orderItemId: orderItemIdByVariant.get(item.variantId)!,
          quantity: plan.backorder,
        },
      });
    }
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
        giftWrap: false,
        giftMessage: null,
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
        giftWrap: false,
        giftMessage: null,
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
      itemCount,
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
      discount: totals.discount,
      estimatedDelivery:
        "מסירה עד הבית לאחר השלמת התשלום, לפי מדיניות המשלוחים.",
      items: items.map((item) => ({
        lineTotal: item.unitPrice * item.quantity,
        name: item.name,
        quantity: item.quantity,
        sku: item.sku,
        unitPrice: item.unitPrice,
      })),
      shipping: totals.shipping,
      subtotal: totals.subtotal,
      template: "cart_checkout_created",
      total: totals.total,
    },
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    analyticsCustomerId: customer.id,
    inventoryBranchSlug: branch.slug,
    reservationExpiresAt,
    totals,
    itemCount,
    estimatedDelivery: "מסירה עד הבית לאחר השלמת התשלום, לפי מדיניות המשלוחים.",
    items: items.map((item) => ({
      lineTotal: item.unitPrice * item.quantity,
      name: item.name,
      quantity: item.quantity,
      sku: item.sku,
      unitPrice: item.unitPrice,
    })),
  };
}

async function resolveOnlineFulfillmentBranch(
  tx: TransactionClient,
  input: Pick<CartCheckoutInput, "branchSlug">,
  cart: {
    items: Array<{
      quantity: number;
      variantId: string;
      backorderEnabled: boolean;
    }>;
  },
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
    // OMS-002: a branch is viable if every item can either be fully
    // reserved from real stock, or (when the product opted in) the
    // shortfall can go on backorder. An absent InventoryItem row (never
    // stocked at this branch at all) still rules the branch out entirely,
    // backorder or not -- there's nothing to check a safety threshold
    // against.
    const canFulfillCart = cart.items.every((item) => {
      const inventoryItem = inventoryByVariant.get(item.variantId);
      if (!inventoryItem) return false;

      return (
        resolveItemFulfillment({
          quantity: inventoryItem.quantity,
          reserved: inventoryItem.reserved,
          safetyStock: inventoryItem.safetyStock,
          requested: item.quantity,
          backorderEnabled: item.backorderEnabled,
        }) !== null
      );
    });

    if (canFulfillCart) return branch;
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "הסל אינו פנוי במלואו לשמירה.",
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
      message: "לא נמצא סל פעיל לסיום ההזמנה.",
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
    // UX19: reuse the same evaluator the cart-review "apply" step uses, so
    // a coupon that lapsed between review and final submit reports the
    // same specific reason (expired / unknown / ineligible) instead of a
    // single generic message.
    const evaluation = await evaluateCouponCode(rawCode, tx);

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: evaluation.message ?? "קוד ההטבה אינו תקף להזמנה הזו.",
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

async function recordCheckoutAnalyticsSafely(
  events: Array<Parameters<typeof recordAnalyticsEvent>[0]>,
) {
  for (const event of events) {
    try {
      await recordAnalyticsEvent(event);
    } catch (error) {
      console.error("[cart-checkout:analytics-failed]", error);
    }
  }
}

export const orderConfirmationLookupInputSchema = z.object({
  orderNumber: z.string().trim().min(3).max(64),
  email: z.string().trim().email().toLowerCase(),
});

// UX13: lets the checkout page restore the confirmation screen after a
// refresh or back-navigation, when the in-memory mutation result is gone
// but the order (and its own-store items) still exist. Scoped to
// orderNumber + email together -- the same guest-lookup contract already
// used by the AI order-support tool -- so a bare orderNumber can't be
// brute-forced into someone else's order details.
export async function getOrderConfirmationByOrderNumber(
  input: z.infer<typeof orderConfirmationLookupInputSchema>,
) {
  const order = await db.order.findFirst({
    where: {
      orderNumber: input.orderNumber,
      email: input.email,
    },
    include: {
      items: { orderBy: { id: "asc" } },
    },
  });

  if (!order) return null;

  const activeReservation = await db.inventoryReservation.findFirst({
    where: {
      orderId: order.id,
      releasedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    reservationExpiresAt: activeReservation?.expiresAt ?? null,
    totals: {
      subtotal: Number(order.subtotal),
      discount: Number(order.discountTotal),
      shipping: Number(order.shippingTotal),
      total: Number(order.total),
    },
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    estimatedDelivery: "מסירה עד הבית לאחר השלמת התשלום, לפי מדיניות המשלוחים.",
    items: order.items.map((item) => ({
      lineTotal: Number(item.unitPrice) * item.quantity,
      name: item.name,
      quantity: item.quantity,
      sku: item.sku,
      unitPrice: Number(item.unitPrice),
    })),
  };
}
