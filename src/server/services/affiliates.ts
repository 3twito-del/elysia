import { db } from "~/server/db";

/**
 * Affiliate / referral program (DMK-005): partners earn a commission on referred
 * sales; approved commissions are payable through AP. Commission maths and the
 * referral roll-up are pure + unit-tested.
 */

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Commission on a referred amount at a percent rate. Pure. */
export function computeCommission(amount: number, percent: number): number {
  const base = Math.max(0, amount);
  const rate = Math.max(0, Math.min(100, percent));
  return round2((base * rate) / 100);
}

/** Counts + commission totals by referral status. Pure. */
export function summarizeReferrals(
  referrals: Array<{ status: string; commission: number }>,
) {
  let pending = 0;
  let approved = 0;
  let paid = 0;
  let pendingCommission = 0;
  let payableCommission = 0;

  for (const referral of referrals) {
    if (referral.status === "PAID") {
      paid += 1;
    } else if (referral.status === "APPROVED") {
      approved += 1;
      payableCommission = round2(payableCommission + referral.commission);
    } else {
      pending += 1;
      pendingCommission = round2(pendingCommission + referral.commission);
    }
  }

  return { pending, approved, paid, pendingCommission, payableCommission };
}

function slugifyCode(input: string): string {
  const base = input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 12);
  return base || "PARTNER";
}

export async function createAffiliatePartner(input: {
  name: string;
  code?: string;
  commissionPercent: number;
}) {
  if (!input.name.trim()) throw new Error("שם השותף הוא שדה חובה.");
  if (!(input.commissionPercent >= 0 && input.commissionPercent <= 100)) {
    throw new Error("עמלה חייבת להיות בין 0 ל-100.");
  }

  let code = input.code?.trim() ? slugifyCode(input.code) : slugifyCode(input.name);
  let suffix = 1;
  while (await db.affiliatePartner.findUnique({ where: { code } })) {
    suffix += 1;
    code = `${slugifyCode(input.name)}${suffix}`;
  }

  return db.affiliatePartner.create({
    data: {
      name: input.name.trim(),
      code,
      commissionPercent: round2(input.commissionPercent),
    },
  });
}

export async function setPartnerStatus(input: {
  partnerId: string;
  status: "ACTIVE" | "SUSPENDED";
}) {
  return db.affiliatePartner.update({
    where: { id: input.partnerId },
    data: { status: input.status },
  });
}

/** Records a referred sale and computes its commission from the partner's rate. */
export async function recordReferral(input: {
  partnerId: string;
  amount: number;
  orderId?: string;
}) {
  const partner = await db.affiliatePartner.findUnique({
    where: { id: input.partnerId },
    select: { commissionPercent: true, status: true },
  });
  if (!partner) throw new Error("שותף לא נמצא.");
  if (partner.status !== "ACTIVE") throw new Error("השותף אינו פעיל.");

  const amount = round2(Math.max(0, input.amount));
  const commission = computeCommission(amount, Number(partner.commissionPercent));

  return db.referral.create({
    data: {
      partnerId: input.partnerId,
      orderId: input.orderId,
      amount,
      commission,
    },
  });
}

/** Advances a referral PENDING → APPROVED → PAID. */
export async function setReferralStatus(input: {
  referralId: string;
  status: "APPROVED" | "PAID";
}) {
  return db.referral.update({
    where: { id: input.referralId },
    data: { status: input.status },
  });
}

export async function listAffiliatePartners(limit = 30) {
  const partners = await db.affiliatePartner.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      code: true,
      commissionPercent: true,
      status: true,
      _count: { select: { referrals: true } },
    },
  });

  return partners.map((partner) => ({
    id: partner.id,
    name: partner.name,
    code: partner.code,
    commissionPercent: Number(partner.commissionPercent),
    status: partner.status,
    referralCount: partner._count.referrals,
  }));
}

export async function listReferrals(limit = 20) {
  const referrals = await db.referral.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      commission: true,
      status: true,
      partner: { select: { name: true, code: true } },
    },
  });

  return referrals.map((referral) => ({
    id: referral.id,
    amount: Number(referral.amount),
    commission: Number(referral.commission),
    status: referral.status,
    partnerName: referral.partner.name,
    partnerCode: referral.partner.code,
  }));
}

export async function getAffiliateSummary() {
  const [partners, activePartners, referrals] = await Promise.all([
    db.affiliatePartner.count(),
    db.affiliatePartner.count({ where: { status: "ACTIVE" } }),
    db.referral.findMany({ select: { status: true, commission: true } }),
  ]);

  const totals = summarizeReferrals(
    referrals.map((referral) => ({
      status: referral.status,
      commission: Number(referral.commission),
    })),
  );

  return { partners, activePartners, referrals: referrals.length, ...totals };
}
