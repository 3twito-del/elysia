import { db } from "~/server/db";
import { isValidCompanyId } from "~/server/services/israeli-validators";

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

/**
 * Whether an authorized buyer may place an order of `orderAmount`. A
 * non-positive spend limit means unlimited authority. Pure.
 */
export function buyerWithinLimit(
  spendLimit: number,
  orderAmount: number,
): boolean {
  if (spendLimit <= 0) return true;
  return orderAmount <= spendLimit;
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

  const taxId = input.taxId?.trim();
  if (taxId && !isValidCompanyId(taxId)) {
    throw new Error("מספר ח.פ/ע.מ אינו תקין (ספרת ביקורת).");
  }

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

/** Adds an authorized buyer to a B2B account. */
export async function addAuthorizedBuyer(input: {
  accountId: string;
  name: string;
  email: string;
  role?: string;
  spendLimit?: number;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) throw new Error("יש להזין שם רוכש.");
  if (!email) throw new Error('יש להזין דוא"ל רוכש.');

  const account = await db.b2bAccount.findUnique({
    where: { id: input.accountId },
    select: { id: true },
  });
  if (!account) throw new Error("חשבון B2B לא נמצא.");

  const existing = await db.b2bAuthorizedBuyer.findUnique({
    where: { accountId_email: { accountId: input.accountId, email } },
    select: { id: true },
  });
  if (existing) throw new Error("רוכש עם דוא\"ל זה כבר משויך לחשבון.");

  return db.b2bAuthorizedBuyer.create({
    data: {
      accountId: input.accountId,
      name,
      email,
      role: input.role?.trim() ? input.role.trim() : null,
      spendLimit: round2(Math.max(0, input.spendLimit ?? 0)),
    },
  });
}

export async function setAuthorizedBuyerStatus(input: {
  buyerId: string;
  status: "ACTIVE" | "SUSPENDED";
}) {
  return db.b2bAuthorizedBuyer.update({
    where: { id: input.buyerId },
    data: { status: input.status },
  });
}

export async function removeAuthorizedBuyer(input: { buyerId: string }) {
  return db.b2bAuthorizedBuyer.delete({ where: { id: input.buyerId } });
}

/** Authorized buyers grouped by account id. */
export async function listAuthorizedBuyersByAccount(accountIds: string[]) {
  if (accountIds.length === 0) return new Map<string, AuthorizedBuyerRow[]>();

  const buyers = await db.b2bAuthorizedBuyer.findMany({
    where: { accountId: { in: accountIds } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      accountId: true,
      name: true,
      email: true,
      role: true,
      spendLimit: true,
      status: true,
    },
  });

  const byAccount = new Map<string, AuthorizedBuyerRow[]>();
  for (const buyer of buyers) {
    const row: AuthorizedBuyerRow = {
      id: buyer.id,
      name: buyer.name,
      email: buyer.email,
      role: buyer.role,
      spendLimit: Number(buyer.spendLimit),
      status: buyer.status,
    };
    const list = byAccount.get(buyer.accountId);
    if (list) list.push(row);
    else byAccount.set(buyer.accountId, [row]);
  }
  return byAccount;
}

export type AuthorizedBuyerRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  spendLimit: number;
  status: string;
};

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
