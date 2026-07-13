import { db } from "~/server/db";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";

/**
 * Loyalty program: points and tiers (CRM-LOY, Phase 2).
 *
 * Points are an append-only ledger (LoyaltyTransaction); the account caches the
 * redeemable balance, lifetime points (which never decrease) and the resolved
 * tier. Earning raises lifetime points and may promote the tier; redeeming only
 * affects the balance. The tier/earn math is pure and exported for testing.
 */

export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

const TIER_THRESHOLDS: Array<{ tier: LoyaltyTier; min: number }> = [
  { tier: "PLATINUM", min: 5000 },
  { tier: "GOLD", min: 1500 },
  { tier: "SILVER", min: 500 },
  { tier: "BRONZE", min: 0 },
];

/** The tier earned for a given lifetime points total. Pure. */
export function resolveTier(lifetimePoints: number): LoyaltyTier {
  for (const threshold of TIER_THRESHOLDS) {
    if (lifetimePoints >= threshold.min) return threshold.tier;
  }
  return "BRONZE";
}

/** Points earned for a purchase amount (default: 1 point per 10 currency). Pure. */
export function pointsForAmount(amount: number, pointsPerCurrency = 0.1): number {
  if (amount <= 0) return 0;
  return Math.floor(amount * pointsPerCurrency);
}

type ApplyInput = {
  customerId: string;
  points: number;
  type: "EARN" | "REDEEM" | "ADJUST";
  reason?: string;
  orderId?: string;
  /** Present only for admin-initiated movements (not order/POS side effects). */
  adminUserId?: string;
};

/** Applies a signed points movement atomically, updating balance/lifetime/tier. */
async function applyPoints(input: ApplyInput) {
  const delta = Math.trunc(input.points);

  return db.$transaction(async (tx) => {
    const account = await tx.loyaltyAccount.upsert({
      where: { customerId: input.customerId },
      create: { customerId: input.customerId },
      update: {},
    });

    const newBalance = account.pointsBalance + delta;
    if (newBalance < 0) throw new Error("אין מספיק נקודות לפדיון.");

    const newLifetime =
      delta > 0 ? account.lifetimePoints + delta : account.lifetimePoints;

    await tx.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        type: input.type,
        points: delta,
        reason: input.reason,
        orderId: input.orderId,
      },
    });

    const updated = await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        pointsBalance: newBalance,
        lifetimePoints: newLifetime,
        tier: resolveTier(newLifetime),
      },
    });

    if (input.adminUserId) {
      await writeAdminAudit(tx, {
        adminUserId: input.adminUserId,
        action: "loyalty_points_applied",
        entity: "LoyaltyAccount",
        entityId: account.id,
        metadata: { type: input.type, points: delta, reason: input.reason },
      });
    }

    return updated;
  });
}

export async function earnPoints(input: {
  customerId: string;
  points: number;
  reason?: string;
  orderId?: string;
  adminUserId?: string;
}) {
  if (input.points <= 0) throw new Error("מספר הנקודות לצבירה חייב להיות חיובי.");
  return applyPoints({ ...input, type: "EARN" });
}

export async function redeemPoints(input: {
  customerId: string;
  points: number;
  reason?: string;
  adminUserId?: string;
}) {
  if (input.points <= 0) throw new Error("מספר הנקודות לפדיון חייב להיות חיובי.");
  return applyPoints({ ...input, points: -input.points, type: "REDEEM" });
}

export async function adjustPoints(input: {
  customerId: string;
  points: number;
  reason?: string;
  adminUserId?: string;
}) {
  return applyPoints({ ...input, type: "ADJUST" });
}

/** Resolves an email to a customer and applies a points movement. */
export async function applyLoyaltyByEmail(input: {
  email: string;
  points: number;
  type: "EARN" | "REDEEM";
  reason?: string;
  adminUserId: string;
}) {
  const customer = await db.customer.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (!customer) {
    throw new Error(`לא נמצא לקוח עם הדוא"ל ${input.email}.`);
  }

  return input.type === "EARN"
    ? earnPoints({
        customerId: customer.id,
        points: input.points,
        reason: input.reason,
        adminUserId: input.adminUserId,
      })
    : redeemPoints({
        customerId: customer.id,
        points: input.points,
        reason: input.reason,
        adminUserId: input.adminUserId,
      });
}

/** Awards purchase points for an order (idempotent per order). */
export async function awardPointsForOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { customerId: true, total: true, orderNumber: true },
  });
  if (!order?.customerId) return { awarded: 0, reason: "no_customer" as const };

  const existing = await db.loyaltyTransaction.findFirst({
    where: { orderId, type: "EARN" },
    select: { id: true },
  });
  if (existing) return { awarded: 0, reason: "already_awarded" as const };

  const points = pointsForAmount(Number(order.total));
  if (points <= 0) return { awarded: 0, reason: "no_points" as const };

  await earnPoints({
    customerId: order.customerId,
    points,
    reason: `רכישה ${order.orderNumber}`,
    orderId,
  });

  return { awarded: points };
}

/** Members count, outstanding redeemable points, and per-tier counts. */
export async function getLoyaltySummary() {
  const [accounts, tierGroups] = await Promise.all([
    db.loyaltyAccount.aggregate({ _count: { _all: true }, _sum: { pointsBalance: true } }),
    db.loyaltyAccount.groupBy({ by: ["tier"], _count: { _all: true } }),
  ]);

  return {
    members: accounts._count._all,
    outstandingPoints: accounts._sum.pointsBalance ?? 0,
    byTier: tierGroups.map((group) => ({
      tier: group.tier,
      count: group._count._all,
    })),
  };
}

/** Top loyalty members by lifetime points. */
export async function listLoyaltyAccounts(limit = 20) {
  const accounts = await db.loyaltyAccount.findMany({
    orderBy: { lifetimePoints: "desc" },
    take: limit,
    select: {
      id: true,
      pointsBalance: true,
      lifetimePoints: true,
      tier: true,
      customer: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return accounts.map((account) => {
    const name = [account.customer?.firstName, account.customer?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: account.id,
      pointsBalance: account.pointsBalance,
      lifetimePoints: account.lifetimePoints,
      tier: account.tier,
      customerName:
        name.length > 0 ? name : (account.customer?.email ?? "לקוח ללא שם"),
    };
  });
}
