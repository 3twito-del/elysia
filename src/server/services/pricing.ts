import { z } from "zod";

export const lineItemSchema = z.object({
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

export const couponSchema = z
  .object({
    percentOff: z.number().int().min(1).max(100).optional(),
    amountOff: z.number().nonnegative().optional(),
  })
  .optional();

export function calculateSubtotal(
  items: Array<z.infer<typeof lineItemSchema>>,
) {
  return items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );
}

export function calculateDiscount(
  subtotal: number,
  coupon: z.infer<typeof couponSchema>,
) {
  if (!coupon) return 0;

  const percentDiscount = coupon.percentOff
    ? subtotal * (coupon.percentOff / 100)
    : 0;
  const amountDiscount = coupon.amountOff ?? 0;

  return Math.min(subtotal, Math.max(percentDiscount, amountDiscount));
}

export function calculateOrderTotal(input: {
  items: Array<z.infer<typeof lineItemSchema>>;
  shipping: number;
  coupon?: z.infer<typeof couponSchema>;
}) {
  const subtotal = calculateSubtotal(input.items);
  const discount = calculateDiscount(subtotal, input.coupon);
  const shipping = Math.max(0, input.shipping);

  return {
    subtotal,
    discount,
    shipping,
    total: Math.max(0, subtotal - discount + shipping),
  };
}
