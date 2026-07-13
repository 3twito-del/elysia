import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";
import { ACCOUNT, DEFAULT_CHART_OF_ACCOUNTS } from "./ledger-accounts";

export {
  ACCOUNT,
  DEFAULT_CHART_OF_ACCOUNTS,
  type AccountType,
  type ChartOfAccountsEntry,
  type NormalSide,
} from "./ledger-accounts";

/**
 * Double-entry general ledger (FIN-GL-001).
 *
 * Invariants enforced here:
 *  - INV-A: every journal entry balances (Σdebit = Σcredit).
 *  - PRIN-003: entries are append-only; corrections are posted as reversals.
 *
 * The pure builders/validators are exported for unit testing; the DB-backed
 * functions accept an optional transaction client so callers can post a
 * journal entry inside the same transaction that mutates the source aggregate.
 */

export type JournalLineInput = {
  accountCode: string;
  debit: number;
  credit: number;
  memo?: string;
  branchId?: string;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Penny tolerance for floating-point rounding when checking balance. */
const balanceEpsilon = 0.005;

export function summarizeJournalLines(
  lines: Array<{ debit: number; credit: number }>,
) {
  const totalDebit = round2(lines.reduce((sum, line) => sum + line.debit, 0));
  const totalCredit = round2(lines.reduce((sum, line) => sum + line.credit, 0));

  return {
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < balanceEpsilon,
  };
}

/** Throws unless the lines balance (INV-A). Returns the summary on success. */
export function assertBalanced(
  lines: Array<{ debit: number; credit: number }>,
) {
  const summary = summarizeJournalLines(lines);

  if (!summary.balanced) {
    throw new Error(
      `Journal entry is not balanced: debit ${summary.totalDebit} ≠ credit ${summary.totalCredit}`,
    );
  }

  return summary;
}

/**
 * Lines for a sale whose gross total INCLUDES VAT (typical B2C Israeli pricing).
 * Debits AR for the gross; credits Sales (net) + VAT output; optionally relieves
 * inventory into COGS. Always balances.
 */
export function buildSaleJournalLines(input: {
  grossTotal: number;
  vatRate?: number;
  vatTotal?: number;
  cogs?: number;
  branchId?: string;
}): JournalLineInput[] {
  const gross = round2(input.grossTotal);
  const vat = round2(
    input.vatTotal ?? (input.vatRate ? gross - gross / (1 + input.vatRate) : 0),
  );
  const net = round2(gross - vat);
  const branchId = input.branchId;

  const lines: JournalLineInput[] = [
    {
      accountCode: ACCOUNT.ACCOUNTS_RECEIVABLE,
      debit: gross,
      credit: 0,
      memo: "מכירה (ברוטו)",
      branchId,
    },
    {
      accountCode: ACCOUNT.SALES_REVENUE,
      debit: 0,
      credit: net,
      memo: "הכנסה (נטו)",
      branchId,
    },
  ];

  if (vat > 0) {
    lines.push({
      accountCode: ACCOUNT.VAT_OUTPUT,
      debit: 0,
      credit: vat,
      memo: 'מע"מ עסקאות',
      branchId,
    });
  }

  const cogs = round2(input.cogs ?? 0);
  if (cogs > 0) {
    lines.push({
      accountCode: ACCOUNT.COGS,
      debit: cogs,
      credit: 0,
      memo: "עלות המכר",
      branchId,
    });
    lines.push({
      accountCode: ACCOUNT.INVENTORY,
      debit: 0,
      credit: cogs,
      memo: "גריעת מלאי",
      branchId,
    });
  }

  return lines;
}

/**
 * Lines for a sales return / refund — the mirror of buildSaleJournalLines. The
 * gross (VAT-inclusive) is credited back to AR, net revenue and output VAT are
 * reversed, and any returned cost is moved back from COGS into inventory. A
 * sales return is a NEW event (not a reversal of the original sale entry), so it
 * is posted under its own source. Always balances.
 */
export function buildSalesReturnJournalLines(input: {
  grossTotal: number;
  vatRate?: number;
  vatTotal?: number;
  cogs?: number;
  branchId?: string;
}): JournalLineInput[] {
  const gross = round2(input.grossTotal);
  const vat = round2(
    input.vatTotal ?? (input.vatRate ? gross - gross / (1 + input.vatRate) : 0),
  );
  const net = round2(gross - vat);
  const branchId = input.branchId;

  const lines: JournalLineInput[] = [
    {
      accountCode: ACCOUNT.SALES_REVENUE,
      debit: net,
      credit: 0,
      memo: "החזרת מכר (נטו)",
      branchId,
    },
    {
      accountCode: ACCOUNT.ACCOUNTS_RECEIVABLE,
      debit: 0,
      credit: gross,
      memo: "זיכוי לקוח (ברוטו)",
      branchId,
    },
  ];

  if (vat > 0) {
    lines.push({
      accountCode: ACCOUNT.VAT_OUTPUT,
      debit: vat,
      credit: 0,
      memo: 'ביטול מע"מ עסקאות',
      branchId,
    });
  }

  const cogs = round2(input.cogs ?? 0);
  if (cogs > 0) {
    lines.push({
      accountCode: ACCOUNT.INVENTORY,
      debit: cogs,
      credit: 0,
      memo: "החזרת מלאי",
      branchId,
    });
    lines.push({
      accountCode: ACCOUNT.COGS,
      debit: 0,
      credit: cogs,
      memo: "ביטול עלות המכר",
      branchId,
    });
  }

  return lines;
}

/** Lines for receiving purchased goods: Inventory (debit) / GRNI (credit). */
export function buildPurchaseReceiptJournalLines(input: {
  cost: number;
  branchId?: string;
}): JournalLineInput[] {
  const cost = round2(input.cost);

  return [
    {
      accountCode: ACCOUNT.INVENTORY,
      debit: cost,
      credit: 0,
      memo: "קליטת סחורה",
      branchId: input.branchId,
    },
    {
      accountCode: ACCOUNT.GRNI,
      debit: 0,
      credit: cost,
      memo: "התחייבות לסחורה שהתקבלה",
      branchId: input.branchId,
    },
  ];
}

/**
 * Lines for capitalizing a landed cost into inventory: Inventory (debit) /
 * Landed-cost clearing (credit). The clearing liability is settled when the
 * freight/customs invoice is paid.
 */
export function buildLandedCostJournalLines(input: {
  amount: number;
  branchId?: string;
}): JournalLineInput[] {
  const amount = round2(input.amount);

  return [
    {
      accountCode: ACCOUNT.INVENTORY,
      debit: amount,
      credit: 0,
      memo: "היוון עלות נלווית למלאי",
      branchId: input.branchId,
    },
    {
      accountCode: ACCOUNT.LANDED_COST_CLEARING,
      debit: 0,
      credit: amount,
      memo: "סליקת עלות נלווית",
      branchId: input.branchId,
    },
  ];
}

/**
 * Lines for approving a PO-matched vendor invoice: clears the GRNI accrual and
 * recognises recoverable VAT against Accounts Payable. Balances by construction
 * (GRNI goods value + VAT input = AP total).
 */
export function buildVendorInvoiceJournalLines(input: {
  goodsValue: number;
  taxTotal?: number;
  branchId?: string;
}): JournalLineInput[] {
  const goodsValue = round2(input.goodsValue);
  const taxTotal = Math.max(0, round2(input.taxTotal ?? 0));
  const branchId = input.branchId;

  const lines: JournalLineInput[] = [
    {
      accountCode: ACCOUNT.GRNI,
      debit: goodsValue,
      credit: 0,
      memo: "סגירת התחייבות לסחורה שהתקבלה",
      branchId,
    },
  ];

  if (taxTotal > 0) {
    lines.push({
      accountCode: ACCOUNT.VAT_INPUT,
      debit: taxTotal,
      credit: 0,
      memo: 'מע"מ תשומות',
      branchId,
    });
  }

  lines.push({
    accountCode: ACCOUNT.ACCOUNTS_PAYABLE,
    debit: 0,
    credit: round2(goodsValue + taxTotal),
    memo: "זכות ספק",
    branchId,
  });

  return lines;
}

/** Lines for paying a vendor: Accounts Payable (debit) / Cash (credit). */
export function buildVendorPaymentJournalLines(input: {
  amount: number;
  branchId?: string;
}): JournalLineInput[] {
  const amount = round2(input.amount);

  return [
    {
      accountCode: ACCOUNT.ACCOUNTS_PAYABLE,
      debit: amount,
      credit: 0,
      memo: "תשלום לספק",
      branchId: input.branchId,
    },
    {
      accountCode: ACCOUNT.CASH,
      debit: 0,
      credit: amount,
      memo: "תשלום לספק",
      branchId: input.branchId,
    },
  ];
}

/** Lines for a customer receipt: Cash (debit) / Accounts Receivable (credit). */
export function buildCustomerReceiptJournalLines(input: {
  amount: number;
  branchId?: string;
}): JournalLineInput[] {
  const amount = round2(input.amount);

  return [
    {
      accountCode: ACCOUNT.CASH,
      debit: amount,
      credit: 0,
      memo: "תקבול מלקוח",
      branchId: input.branchId,
    },
    {
      accountCode: ACCOUNT.ACCOUNTS_RECEIVABLE,
      debit: 0,
      credit: amount,
      memo: "תקבול מלקוח",
      branchId: input.branchId,
    },
  ];
}

/**
 * Guards against posting into a CLOSED fiscal period (FIN-RPT-002 / PRIN-003).
 * No-op when no FiscalPeriod row exists for the date or it is still OPEN, so the
 * GL behaves normally until periods are actively closed. Defined here (not in
 * period-close) to keep the dependency one-way and avoid an import cycle.
 */
export async function assertPostingPeriodOpen(
  date: Date,
  client: Prisma.TransactionClient = db,
) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  const period = await client.fiscalPeriod.findUnique({
    where: { year_month: { year, month } },
    select: { status: true },
  });

  if (period?.status === "CLOSED") {
    throw new Error(
      `התקופה ${month}/${year} סגורה — לא ניתן לרשום תנועה בתאריך זה.`,
    );
  }
}

/** Idempotently upserts the default chart of accounts. */
export async function seedChartOfAccounts(input: { adminUserId: string }) {
  for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
    await db.ledgerAccount.upsert({
      where: { code: account.code },
      create: account,
      update: {
        name: account.name,
        type: account.type,
        normalSide: account.normalSide,
      },
    });
  }

  const count = await db.ledgerAccount.count();

  await writeAdminAudit(db, {
    adminUserId: input.adminUserId,
    action: "chart_of_accounts_seeded",
    entity: "LedgerAccount",
    metadata: { accountCount: DEFAULT_CHART_OF_ACCOUNTS.length },
  });

  return count;
}

async function createNextJournalEntryNumber(
  client: Prisma.TransactionClient,
  date: Date,
) {
  const prefix = `JE-${date.getUTCFullYear()}${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await client.journalEntry.count({
    where: { entryNumber: { startsWith: prefix } },
  });

  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/**
 * Posts a balanced journal entry. Validates balance and resolves account codes
 * to ids. Pass a transaction client to post within an existing transaction.
 */
export async function postJournalEntry(
  input: {
    entryDate: Date;
    memo?: string;
    source: string;
    currency?: string;
    aggregateType?: string;
    aggregateId?: string;
    orderId?: string;
    purchaseOrderId?: string;
    postedById?: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    lines: JournalLineInput[];
  },
  client: Prisma.TransactionClient = db,
) {
  if (input.lines.length < 2) {
    throw new Error("A journal entry requires at least two lines.");
  }
  assertBalanced(input.lines);
  await assertPostingPeriodOpen(input.entryDate, client);

  const codes = Array.from(
    new Set(input.lines.map((line) => line.accountCode)),
  );
  const accounts = await client.ledgerAccount.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true },
  });
  const accountIdByCode = new Map(
    accounts.map((account) => [account.code, account.id]),
  );
  const missing = codes.filter((code) => !accountIdByCode.has(code));
  if (missing.length > 0) {
    throw new Error(
      `Unknown ledger account code(s): ${missing.join(
        ", ",
      )}. Seed the chart of accounts first.`,
    );
  }

  const entryNumber = await createNextJournalEntryNumber(
    client,
    input.entryDate,
  );

  return client.journalEntry.create({
    data: {
      entryNumber,
      entryDate: input.entryDate,
      memo: input.memo,
      source: input.source,
      currency: input.currency ?? "ILS",
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      orderId: input.orderId,
      purchaseOrderId: input.purchaseOrderId,
      postedById: input.postedById,
      entityId: input.entityId,
      metadata: input.metadata,
      lines: {
        create: input.lines.map((line) => {
          const accountId = accountIdByCode.get(line.accountCode);
          if (!accountId) {
            throw new Error(`Unknown ledger account code: ${line.accountCode}`);
          }

          return {
            accountId,
            debit: round2(line.debit),
            credit: round2(line.credit),
            memo: line.memo,
            branchId: line.branchId,
          };
        }),
      },
    },
    include: { lines: true },
  });
}

/** Posts the GL entry for a sale (revenue + VAT + optional COGS). */
export async function postSaleJournalEntry(
  input: {
    orderId: string;
    orderNumber: string;
    entryDate: Date;
    grossTotal: number;
    vatRate?: number;
    vatTotal?: number;
    cogs?: number;
    branchId?: string;
    currency?: string;
    postedById?: string;
    entityId?: string;
  },
  client: Prisma.TransactionClient = db,
) {
  return postJournalEntry(
    {
      entryDate: input.entryDate,
      memo: `מכירה — הזמנה ${input.orderNumber}`,
      source: "sale",
      currency: input.currency,
      aggregateType: "Order",
      aggregateId: input.orderId,
      orderId: input.orderId,
      postedById: input.postedById,
      entityId: input.entityId,
      lines: buildSaleJournalLines({
        grossTotal: input.grossTotal,
        vatRate: input.vatRate,
        vatTotal: input.vatTotal,
        cogs: input.cogs,
        branchId: input.branchId,
      }),
    },
    client,
  );
}

/** Posts the GL entry for a goods receipt (Inventory / GRNI). */
export async function postPurchaseReceiptJournalEntry(
  input: {
    purchaseOrderId: string;
    poNumber: string;
    entryDate: Date;
    cost: number;
    branchId?: string;
    currency?: string;
    postedById?: string;
    entityId?: string;
  },
  client: Prisma.TransactionClient = db,
) {
  return postJournalEntry(
    {
      entryDate: input.entryDate,
      memo: `קליטת סחורה — ${input.poNumber}`,
      source: "purchase_receipt",
      currency: input.currency,
      aggregateType: "PurchaseOrder",
      aggregateId: input.purchaseOrderId,
      purchaseOrderId: input.purchaseOrderId,
      postedById: input.postedById,
      entityId: input.entityId,
      lines: buildPurchaseReceiptJournalLines({
        cost: input.cost,
        branchId: input.branchId,
      }),
    },
    client,
  );
}

/** Posts the GL entry capitalizing a landed cost (Inventory / clearing). */
export async function postLandedCostJournalEntry(
  input: {
    purchaseOrderId: string;
    reference: string;
    entryDate: Date;
    amount: number;
    branchId?: string;
    currency?: string;
    postedById?: string;
  },
  client: Prisma.TransactionClient = db,
) {
  // Self-heal the clearing account so applying a landed cost never hard-fails
  // on a chart that predates it.
  await client.ledgerAccount.upsert({
    where: { code: ACCOUNT.LANDED_COST_CLEARING },
    create: {
      code: ACCOUNT.LANDED_COST_CLEARING,
      name: "סליקת עלויות נלוות",
      type: "LIABILITY",
      normalSide: "CREDIT",
    },
    update: {},
  });

  return postJournalEntry(
    {
      entryDate: input.entryDate,
      memo: `עלות נלווית — ${input.reference}`,
      source: "landed_cost",
      currency: input.currency,
      aggregateType: "PurchaseOrder",
      aggregateId: input.purchaseOrderId,
      purchaseOrderId: input.purchaseOrderId,
      postedById: input.postedById,
      lines: buildLandedCostJournalLines({
        amount: input.amount,
        branchId: input.branchId,
      }),
    },
    client,
  );
}

/**
 * Reverses a posted entry by booking the mirror lines and marking the original
 * REVERSED (PRIN-003 — no mutation/deletion of financial documents).
 */
export async function reverseJournalEntry(
  input: {
    journalEntryId: string;
    entryDate?: Date;
    memo?: string;
    postedById?: string;
  },
  client: Prisma.TransactionClient = db,
) {
  const original = await client.journalEntry.findUnique({
    where: { id: input.journalEntryId },
    include: { lines: true },
  });
  if (!original) throw new Error("Journal entry not found.");
  if (original.status === "REVERSED") {
    throw new Error("Journal entry already reversed.");
  }

  const entryDate = input.entryDate ?? new Date();
  await assertPostingPeriodOpen(entryDate, client);
  const entryNumber = await createNextJournalEntryNumber(client, entryDate);

  const reversal = await client.journalEntry.create({
    data: {
      entryNumber,
      entryDate,
      memo: input.memo ?? `ביטול תנועה ${original.entryNumber}`,
      source: "reversal",
      currency: original.currency,
      aggregateType: original.aggregateType,
      aggregateId: original.aggregateId,
      orderId: original.orderId,
      purchaseOrderId: original.purchaseOrderId,
      postedById: input.postedById,
      reversalOfId: original.id,
      lines: {
        create: original.lines.map((line) => ({
          accountId: line.accountId,
          debit: line.credit,
          credit: line.debit,
          memo: line.memo,
          branchId: line.branchId,
        })),
      },
    },
    include: { lines: true },
  });

  await client.journalEntry.update({
    where: { id: original.id },
    data: { status: "REVERSED" },
  });

  return reversal;
}

/** Trial balance: per-account debit/credit totals; must net to zero (INV-A). */
export async function computeTrialBalance(
  input: { from?: Date; to?: Date } = {},
) {
  const where: Prisma.JournalLineWhereInput = {};
  if (input.from ?? input.to) {
    where.journalEntry = {
      entryDate: {
        ...(input.from ? { gte: input.from } : {}),
        ...(input.to ? { lt: input.to } : {}),
      },
    };
  }

  const [grouped, accounts] = await Promise.all([
    db.journalLine.groupBy({
      by: ["accountId"],
      where,
      _sum: { debit: true, credit: true },
    }),
    db.ledgerAccount.findMany({
      select: { id: true, code: true, name: true, type: true, normalSide: true },
    }),
  ]);
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  const rows = grouped
    .map((row) => {
      const account = accountById.get(row.accountId);
      const debit = Number(row._sum.debit ?? 0);
      const credit = Number(row._sum.credit ?? 0);
      const balance =
        account?.normalSide === "CREDIT" ? credit - debit : debit - credit;

      return {
        accountId: row.accountId,
        code: account?.code ?? "?",
        name: account?.name ?? "Unknown account",
        type: account?.type ?? "?",
        debit: round2(debit),
        credit: round2(credit),
        balance: round2(balance),
      };
    })
    .sort((first, second) => first.code.localeCompare(second.code));

  const totalDebit = round2(rows.reduce((sum, row) => sum + row.debit, 0));
  const totalCredit = round2(rows.reduce((sum, row) => sum + row.credit, 0));

  return {
    rows,
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < balanceEpsilon,
    generatedAt: new Date(),
  };
}
