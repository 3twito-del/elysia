import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import type { couponSchema } from "~/server/services/pricing";
import type { z } from "zod";

type CouponValue = z.infer<typeof couponSchema>;
type CouponClient = Pick<Prisma.TransactionClient, "coupon">;

export type CouponEvaluationStatus =
  | "expired"
  | "ineligible"
  | "none"
  | "success"
  | "unknown";

export type CouponEvaluation = {
  code: string | null;
  id?: string;
  message?: string;
  status: CouponEvaluationStatus;
  value?: CouponValue;
};

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

export async function evaluateCouponCode(
  code?: string | null,
  client: CouponClient = db,
): Promise<CouponEvaluation> {
  const normalized = normalizeCouponCode(code);

  if (!normalized) {
    return { code: null, status: "none" };
  }

  const coupon = await client.coupon.findUnique({
    where: { code: normalized },
  });

  if (!coupon) {
    return {
      code: normalized,
      message: "קוד ההטבה לא נמצא. בדקו את האיות או נסו קוד אחר.",
      status: "unknown",
    };
  }

  const status = getCouponEvaluationStatus(coupon);

  if (status !== "success") {
    return {
      code: normalized,
      id: coupon.id,
      message: getPublicCouponStatusMessage(status),
      status,
    };
  }

  return {
    code: coupon.code,
    id: coupon.id,
    message: getPublicCouponStatusMessage("success"),
    status,
    value: {
      percentOff: coupon.percentOff ?? undefined,
      amountOff: coupon.amountOff ? Number(coupon.amountOff) : undefined,
    },
  };
}

export async function getActiveCouponValue(
  code?: string | null,
  client: CouponClient = db,
): Promise<{
  id: string;
  code: string;
  value: CouponValue;
} | null> {
  const evaluation = await evaluateCouponCode(code, client);

  if (evaluation.status !== "success" || !evaluation.value || !evaluation.id) {
    return null;
  }

  return {
    code: evaluation.code ?? "",
    id: evaluation.id,
    value: evaluation.value,
  };
}

export function getPublicCouponStatusMessage(
  status: Exclude<CouponEvaluationStatus, "none">,
) {
  if (status === "success") {
    return "קוד ההטבה נקלט והסכום עודכן בסיכום.";
  }

  if (status === "expired") {
    return "קוד ההטבה פג תוקף ואינו זמין להזמנה הזו.";
  }

  if (status === "unknown") {
    return "קוד ההטבה לא נמצא. בדקו את האיות או נסו קוד אחר.";
  }

  return "קוד ההטבה אינו מתאים להזמנה הזו.";
}

function getCouponEvaluationStatus(input: {
  endsAt: Date | null;
  isActive: boolean;
  maxUses: number | null;
  startsAt: Date;
  usedCount: number;
}): Exclude<CouponEvaluationStatus, "none" | "unknown"> {
  const now = new Date();

  if (input.endsAt && input.endsAt <= now) return "expired";
  if (!input.isActive) return "ineligible";
  if (input.startsAt > now) return "ineligible";
  if (input.maxUses !== null && input.usedCount >= input.maxUses) {
    return "ineligible";
  }

  return "success";
}
