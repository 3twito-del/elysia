import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { z } from "zod";

import { canReserveStock } from "~/server/services/inventory";
import { calculateOrderTotal } from "~/server/services/pricing";

export const shippingAddressSchema = z.object({
  city: z.string().trim().min(2),
  street: z.string().trim().min(2),
  postalCode: z.string().trim().optional(),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

type ReservationAvailabilityInput = {
  quantity: number;
  reserved: number;
  safetyStock: number;
  requested: number;
};

export function addMissingDeliveryAddressIssue(
  input: {
    fulfillmentMethod: string;
    shippingAddress?: ShippingAddressInput;
  },
  context: z.RefinementCtx,
  message: string,
) {
  if (input.fulfillmentMethod !== "DELIVERY" || input.shippingAddress) return;

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path: ["shippingAddress"],
  });
}

export function createCommerceOrderNumber(
  now = new Date(),
  suffix = nanoid(6),
) {
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");

  return `ELY-${datePart}-${suffix.toUpperCase()}`;
}

export function getReservationExpiresAt(input: {
  now?: Date;
  durationMs: number;
}) {
  const now = input.now ?? new Date();

  return new Date(now.getTime() + input.durationMs);
}

export function getDeliveryShippingTotal(fulfillmentMethod: string) {
  return fulfillmentMethod === "DELIVERY" ? 29 : 0;
}

export function calculateSingleItemOrderTotals(input: {
  unitPrice: number;
  quantity: number;
  fulfillmentMethod: string;
}) {
  return calculateOrderTotal({
    items: [{ unitPrice: input.unitPrice, quantity: input.quantity }],
    shipping: getDeliveryShippingTotal(input.fulfillmentMethod),
  });
}

export function hasReservableStock(input: ReservationAvailabilityInput) {
  return canReserveStock(input);
}

export function assertReservationAvailable(
  input: ReservationAvailabilityInput,
  message: string,
) {
  if (hasReservableStock(input)) return;

  throw new TRPCError({
    code: "BAD_REQUEST",
    message,
  });
}

export function createOrderShippingAddress(input: {
  customerName: string;
  customerPhone: string;
  shippingAddress?: ShippingAddressInput;
}) {
  if (!input.shippingAddress) return undefined;

  return {
    recipient: input.customerName,
    phone: input.customerPhone,
    city: input.shippingAddress.city,
    street: input.shippingAddress.street,
    postalCode: input.shippingAddress.postalCode ?? null,
  } satisfies Prisma.InputJsonObject;
}

export function createOrderItemName(input: {
  productName: string;
  variantName?: string | null;
}) {
  return input.variantName && input.variantName !== input.productName
    ? `${input.productName} - ${input.variantName}`
    : input.productName;
}
