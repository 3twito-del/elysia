import { db } from "~/server/db";

/**
 * B2B trade accounts (POR-003): a customer gets a negotiated discount, a credit
 * limit and payment terms. Pricing/credit maths are pure + unit-tested; full
 * per-SKU price lists are a future extension on top of this.
 */

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Net price after a B2B discount percent. Pure. */
export function b2bPrice(basePrice: number, discountPercent: number): number {
  const base = Math.max(0, basePrice);
  const pct = Math.max(0, Math.min(100, discountPercent));
  return round2(base * (1 - pct / 100));
}

/** Remaining credit headroom. Pure. */
export function availableCredit(creditLimit: number, outstanding: number): number {
  return round2(Math.max(0, creditLimit - Math.max(0, outstanding)));
}

/** Credit posture relative to the limit. Pure. */
export function creditStatus(
  creditLimit: number,
  outstanding: number,
): "OK" | "NEAR_LIMIT" | "OVER_LIMIT" {
  if (creditLimit <= 0) return "OK";
  if (outstanding > creditLimit) return "OVER_LIMIT";
  return outstanding >= creditLimit * 0.85 ? "NEAR_LIMIT" : "OK";
}

export async function createB2bAccount(input: {
  customerEmail: string;
  companyName?: string;
  taxId?: string;
  discountPercent?: number;
  creditLimit?: number;
  paymentTermsDays?: number;
}) {
  const email = input.customerEmail.trim().toLowerCase();
  if (!email) throw new Error('יש להזין דוא"ל לקוח.');

  const customer = await db.customer.findFirst({
    where: { email },
    select: { id: true },
  });
  if (!customer) throw new Error("לא נמצא לקוח עם כתובת זו.");

  const existing = await db.b2bAccount.findUnique({
    where: { customerId: customer.id },
    select: { id: true },
  });
  if (existing) throw new Error("ללקוח כבר קיים חשבון B2B.");

  return db.b2bAccount.create({
    data: {
      customerId: customer.id,
      companyName: input.companyName,
      taxId: input.taxId,
      discountPercent: round2(Math.max(0, Math.min(100, input.discountPercent ?? 0))),
      creditLimit: round2(Math.max(0, input.creditLimit ?? 0)),
      paymentTermsDays: Math.max(0, Math.trunc(input.paymentTermsDays ?? 30)),
    },
  });
}

export async function updateB2bAccount(input: {
  accountId: string;
  discountPercent?: number;
  creditLimit?: number;
  paymentTermsDays?: number;
}) {
  return db.b2bAccount.update({
    where: { id: input.accountId },
    data: {
      ...(input.discountPercent != null
        ? { discountPercent: round2(Math.max(0, Math.min(100, input.discountPercent))) }
        : {}),
      ...(input.creditLimit != null
        ? { creditLimit: round2(Math.max(0, input.creditLimit)) }
        : {}),
      ...(input.paymentTermsDays != null
        ? { paymentTermsDays: Math.max(0, Math.trunc(input.paymentTermsDays)) }
        : {}),
    },
  });
}

export async function setB2bAccountStatus(input: {
  accountId: string;
  status: "ACTIVE" | "SUSPENDED";
}) {
  return db.b2bAccount.update({
    where: { id: input.accountId },
    data: { status: input.status },
  });
}

/** The B2B account for a customer id, if any (for the portal). */
export async function getB2bAccountForCustomer(customerId: string) {
  const account = await db.b2bAccount.findUnique({
    where: { customerId },
    select: {
      companyName: true,
      discountPercent: true,
      creditLimit: true,
      paymentTermsDays: true,
      status: true,
    },
  });
  if (!account) return null;
  return {
    companyName: account.companyName,
    discountPercent: Number(account.discountPercent),
    creditLimit: Number(account.creditLimit),
    paymentTermsDays: account.paymentTermsDays,
    status: account.status,
  };
}

export async function listB2bAccounts(limit = 30) {
  const accounts = await db.b2bAccount.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      customerId: true,
      companyName: true,
      discountPercent: true,
      creditLimit: true,
      paymentTermsDays: true,
      status: true,
    },
  });

  const customers = await db.customer.findMany({
    where: { id: { in: accounts.map((account) => account.customerId) } },
    select: { id: true, email: true },
  });
  const emailById = new Map(customers.map((customer) => [customer.id, customer.email]));

  return accounts.map((account) => ({
    id: account.id,
    customerEmail: emailById.get(account.customerId) ?? "—",
    companyName: account.companyName,
    discountPercent: Number(account.discountPercent),
    creditLimit: Number(account.creditLimit),
    paymentTermsDays: account.paymentTermsDays,
    status: account.status,
  }));
}

export async function getB2bSummary() {
  const accounts = await db.b2bAccount.findMany({
    select: { status: true, creditLimit: true },
  });
  let active = 0;
  let totalCredit = 0;
  for (const account of accounts) {
    if (account.status === "ACTIVE") active += 1;
    totalCredit += Number(account.creditLimit);
  }
  return { total: accounts.length, active, totalCredit: round2(totalCredit) };
}
