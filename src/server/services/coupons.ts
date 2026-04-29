import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import type { couponSchema } from "~/server/services/pricing";
import type { z } from "zod";

type CouponValue = z.infer<typeof couponSchema>;
type CouponClient = Pick<Prisma.TransactionClient, "coupon">;

export function normalizeCouponCode(code?: string | null) {
  const normalized = code?.trim().toUpperCase();

  return normalized && normalized.length > 0 ? normalized : null;
}

export function isCouponUsable(input: {
  isActive: boolean;
  startsAt: Date;
  endsAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();

  if (!input.isActive) return false;
  if (input.startsAt > now) return false;
  if (input.endsAt && input.endsAt <= now) return false;
  if (input.maxUses !== null && input.usedCount >= input.maxUses) return false;

  return true;
}

export async function getActiveCouponValue(
  code?: string | null,
  client: CouponClient = db,
): Promise<{
  id: string;
  code: string;
  value: CouponValue;
} | null> {
  const normalized = normalizeCouponCode(code);

  if (!normalized) return null;

  const coupon = await client.coupon.findUnique({
    where: { code: normalized },
  });

  if (!coupon || !isCouponUsable(coupon)) return null;

  return {
    id: coupon.id,
    code: coupon.code,
    value: {
      percentOff: coupon.percentOff ?? undefined,
      amountOff: coupon.amountOff ? Number(coupon.amountOff) : undefined,
    },
  };
}
