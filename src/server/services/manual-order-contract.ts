import { TRPCError } from "@trpc/server";
import type { FulfillmentMethod, OrderStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { canReserveStock } from "./inventory";
import {
  calculateSingleItemOrderTotals,
  createCommerceOrderNumber,
  getDeliveryShippingTotal,
  getReservationExpiresAt,
  shippingAddressSchema as orderShippingAddressSchema,
} from "./order-workflow";

const MANUAL_ORDER_RESERVATION_HOURS = 24;
const MANUAL_ORDER_RESERVATION_MS =
  MANUAL_ORDER_RESERVATION_HOURS * 60 * 60_000;

export const MANUAL_PAYMENT_PROVIDER = "manual";
export const shippingAddressSchema = orderShippingAddressSchema;

export const createManualOrderInputSchema = z
  .object({
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
  })
  .superRefine(validateDeliveryAddressForSchema);

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
  return getDeliveryShippingTotal(fulfillmentMethod);
}

export function getManualOrderReservationExpiresAt(now = new Date()) {
  return getReservationExpiresAt({
    now,
    durationMs: MANUAL_ORDER_RESERVATION_MS,
  });
}

export function createManualOrderNumber(now = new Date(), suffix?: string) {
  return createCommerceOrderNumber(now, suffix);
}

export function calculateManualOrderTotals(input: {
  unitPrice: number;
  quantity: number;
  fulfillmentMethod: string;
}) {
  return calculateSingleItemOrderTotals(input);
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
      message:
        "׳׳™׳ ׳׳¡׳₪׳™׳§ ׳׳׳׳™ ׳–׳׳™׳ ׳׳©׳׳™׳¨׳× ׳”׳”׳–׳׳ ׳” ׳‘׳¢׳¨׳•׳¥ ׳©׳ ׳‘׳—׳¨.",
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
      message:
        "׳׳ ׳ ׳™׳×׳ ׳׳‘׳¦׳¢ ׳׳¢׳‘׳¨ ׳¡׳˜׳˜׳•׳¡ ׳–׳” ׳׳”׳–׳׳ ׳” ׳™׳“׳ ׳™׳×.",
    });
  }

  if (
    input.nextStatus === "READY_FOR_PICKUP" &&
    input.fulfillmentMethod !== "PICKUP"
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "׳”׳–׳׳ ׳× ׳׳©׳׳•׳— ׳׳ ׳™׳›׳•׳׳” ׳׳¢׳‘׳•׳¨ ׳׳¡׳˜׳˜׳•׳¡ ׳׳•׳›׳ ׳׳×׳™׳׳•׳.",
    });
  }

  if (
    input.nextStatus === "SHIPPED" &&
    input.fulfillmentMethod !== "DELIVERY"
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "׳”׳–׳׳ ׳× ׳×׳™׳׳•׳ ׳׳™׳ ׳” ׳™׳›׳•׳׳” ׳׳¢׳‘׳•׳¨ ׳׳¡׳˜׳˜׳•׳¡ ׳ ׳©׳׳—׳”.",
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

function validateDeliveryAddressForSchema(
  input: {
    fulfillmentMethod: "DELIVERY" | "PICKUP";
    shippingAddress?: z.infer<typeof shippingAddressSchema>;
  },
  context: z.RefinementCtx,
) {
  if (input.fulfillmentMethod !== "DELIVERY" || input.shippingAddress) return;

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: "׳›׳×׳•׳‘׳× ׳׳©׳׳•׳— ׳ ׳“׳¨׳©׳× ׳׳”׳–׳׳ ׳× ׳׳©׳׳•׳—.",
    path: ["shippingAddress"],
  });
}
