import { randomBytes } from "node:crypto";

import { db } from "~/server/db";

/**
 * Vendor self-service portal (POR-002). Vendors have no login, so access is via
 * a revocable magic-link token (32 random bytes). The portal is strictly
 * read-only and scoped to the token's own vendor — POs, vendor invoices and
 * payment status. Token validity + the delivery scorecard are pure + tested.
 */

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Whether a token is currently usable (active + unexpired). Pure. */
export function isTokenValid(
  token: { isActive: boolean; expiresAt: Date | null },
  now: Date = new Date(),
): boolean {
  if (!token.isActive) return false;
  return token.expiresAt === null || token.expiresAt.getTime() > now.getTime();
}

export type ScorecardPo = {
  status: string;
  total: number;
  expectedAt: Date | null;
  receivedAt: Date | null;
};

/** Vendor delivery scorecard: volume, value and on-time rate. Pure. */
export function computeVendorScorecard(pos: ScorecardPo[]) {
  let totalValue = 0;
  let receivedCount = 0;
  let onTimeCount = 0;
  for (const po of pos) {
    totalValue = round2(totalValue + po.total);
    if (po.receivedAt) {
      receivedCount += 1;
      if (!po.expectedAt || po.receivedAt.getTime() <= po.expectedAt.getTime()) {
        onTimeCount += 1;
      }
    }
  }
  return {
    poCount: pos.length,
    totalValue,
    receivedCount,
    onTimePercent:
      receivedCount > 0 ? round2((onTimeCount / receivedCount) * 100) : 0,
  };
}

/** Issues a fresh magic-link token for a vendor. */
export async function issueVendorPortalToken(input: {
  vendorId: string;
  label?: string;
  expiresAt?: Date;
}) {
  const token = randomBytes(32).toString("hex");
  return db.vendorPortalToken.create({
    data: {
      vendorId: input.vendorId,
      token,
      label: input.label,
      expiresAt: input.expiresAt,
    },
  });
}

export async function revokeVendorPortalToken(input: { tokenId: string }) {
  return db.vendorPortalToken.update({
    where: { id: input.tokenId },
    data: { isActive: false },
  });
}

/** Active portal tokens per vendor (for admin issuance/revocation). */
export async function listVendorPortalTokens() {
  const tokens = await db.vendorPortalToken.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      expiresAt: true,
      lastUsedAt: true,
      vendor: { select: { id: true, name: true } },
    },
  });
  return tokens.map((token) => ({
    id: token.id,
    token: token.token,
    vendorId: token.vendor.id,
    vendorName: token.vendor.name,
    expiresAt: token.expiresAt,
    lastUsedAt: token.lastUsedAt,
  }));
}

/**
 * Resolves a portal token to its vendor's read-only data, or null if the token
 * is missing/revoked/expired. Touches lastUsedAt on a valid hit.
 */
export async function resolveVendorPortalByToken(token: string) {
  if (!token || token.length < 16) return null;

  const record = await db.vendorPortalToken.findUnique({
    where: { token },
    select: { id: true, isActive: true, expiresAt: true, vendorId: true },
  });
  if (!record || !isTokenValid(record)) return null;

  const [vendor, purchaseOrders, invoices] = await Promise.all([
    db.vendor.findUnique({
      where: { id: record.vendorId },
      select: { name: true, paymentTerms: true, leadTimeDays: true },
    }),
    db.purchaseOrder.findMany({
      where: { vendorId: record.vendorId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        poNumber: true,
        status: true,
        total: true,
        orderedAt: true,
        expectedAt: true,
        receivedAt: true,
      },
    }),
    db.vendorInvoice.findMany({
      where: { vendorId: record.vendorId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        paidTotal: true,
      },
    }),
  ]);
  if (!vendor) return null;

  await db.vendorPortalToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  const scorecard = computeVendorScorecard(
    purchaseOrders.map((po) => ({
      status: po.status,
      total: Number(po.total),
      expectedAt: po.expectedAt,
      receivedAt: po.receivedAt,
    })),
  );

  return {
    vendor,
    purchaseOrders: purchaseOrders.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      total: Number(po.total),
      orderedAt: po.orderedAt,
      expectedAt: po.expectedAt,
    })),
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      total: Number(invoice.total),
      paidTotal: Number(invoice.paidTotal),
      outstanding: round2(Number(invoice.total) - Number(invoice.paidTotal)),
    })),
    scorecard,
  };
}
