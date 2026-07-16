import { db } from "~/server/db";
import { violatesSoD } from "~/server/services/accounts-payable";
import {
  ACCOUNT,
  buildVendorPaymentJournalLines,
  postJournalEntry,
} from "~/server/services/ledger";

/**
 * Batched vendor payment runs (P2P-007): group several vendor invoices —
 * across one or more vendors — into a single approval + execution unit.
 *
 * Flow: addInvoiceToPaymentRun (creates a DRAFT run on first call, or appends
 * to one) → submitPaymentRun (auto-approves below threshold, else
 * PENDING_APPROVAL) → approvePaymentRun (SoD: creator ≠ approver, mirrors
 * P2P-009) → executePaymentRun (one VendorPayment + GL entry per vendor,
 * atomic — the whole run posts or none of it does).
 */

/** Default approval threshold in ₪ (override via env PAYMENT_RUN_APPROVAL_THRESHOLD). */
export const DEFAULT_PAYMENT_RUN_APPROVAL_THRESHOLD = 10000;

/** Statuses in which a run still "holds" its invoices against double payment. */
const OPEN_RUN_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED"] as const;

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Whether a run's total needs explicit approval. Pure. */
export function requiresPaymentRunApproval(
  totalAmount: number,
  threshold: number = DEFAULT_PAYMENT_RUN_APPROVAL_THRESHOLD,
): boolean {
  return totalAmount >= threshold;
}

function paymentRunApprovalThreshold() {
  const raw = Number(process.env.PAYMENT_RUN_APPROVAL_THRESHOLD);
  return Number.isFinite(raw) && raw > 0
    ? raw
    : DEFAULT_PAYMENT_RUN_APPROVAL_THRESHOLD;
}

async function createNextPaymentRunNumber() {
  const today = new Date();
  const prefix = `PMT-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await db.paymentRun.count({
    where: { runNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/**
 * Adds a vendor invoice to a payment run, creating a new DRAFT run when
 * `paymentRunId` is omitted. Rejects invoices that are already fully paid or
 * already held by another open run (draft/pending/approved).
 */
export async function addInvoiceToPaymentRun(input: {
  paymentRunId?: string;
  vendorInvoiceId: string;
  withheldTax?: number;
  createdById?: string;
  notes?: string;
}) {
  const withheldTax = round2(Math.max(0, input.withheldTax ?? 0));

  return db.$transaction(async (tx) => {
    const invoice = await tx.vendorInvoice.findUnique({
      where: { id: input.vendorInvoiceId },
      select: {
        id: true,
        vendorId: true,
        status: true,
        total: true,
        paidTotal: true,
      },
    });
    if (!invoice) throw new Error("חשבונית ספק לא נמצאה.");
    if (!["APPROVED", "PARTIALLY_PAID"].includes(invoice.status)) {
      throw new Error("ניתן להוסיף לריצת תשלום רק חשבונית מאושרת שטרם שולמה במלואה.");
    }

    const outstanding = round2(Number(invoice.total) - Number(invoice.paidTotal));
    if (outstanding <= 0) throw new Error("לחשבונית זו אין יתרה לתשלום.");
    if (withheldTax > outstanding) {
      throw new Error("ניכוי מס במקור לא יכול לעלות על יתרת החשבונית.");
    }

    const existingLine = await tx.paymentRunLine.findFirst({
      where: {
        vendorInvoiceId: invoice.id,
        paymentRun: { status: { in: [...OPEN_RUN_STATUSES] } },
      },
      select: { id: true },
    });
    if (existingLine) {
      throw new Error("חשבונית זו כבר משויכת לריצת תשלומים פתוחה אחרת.");
    }

    let paymentRunId = input.paymentRunId;
    if (!paymentRunId) {
      const created = await tx.paymentRun.create({
        data: {
          runNumber: await createNextPaymentRunNumber(),
          createdById: input.createdById,
          notes: input.notes,
        },
      });
      paymentRunId = created.id;
    } else {
      const run = await tx.paymentRun.findUnique({
        where: { id: paymentRunId },
        select: { status: true },
      });
      if (!run) throw new Error("ריצת תשלום לא נמצאה.");
      if (run.status !== "DRAFT") {
        throw new Error("ניתן להוסיף חשבוניות רק לריצה בטיוטה.");
      }
    }

    await tx.paymentRunLine.create({
      data: {
        paymentRunId,
        vendorId: invoice.vendorId,
        vendorInvoiceId: invoice.id,
        amount: outstanding,
        withheldTax,
      },
    });

    return tx.paymentRun.update({
      where: { id: paymentRunId },
      data: {
        totalAmount: { increment: outstanding },
        totalWithheld: { increment: withheldTax },
      },
      include: { lines: true },
    });
  });
}

/** Removes a line from a DRAFT run and re-totals it. */
export async function removePaymentRunLine(input: { lineId: string }) {
  return db.$transaction(async (tx) => {
    const line = await tx.paymentRunLine.findUnique({
      where: { id: input.lineId },
      include: { paymentRun: { select: { id: true, status: true } } },
    });
    if (!line) throw new Error("שורת תשלום לא נמצאה.");
    if (line.paymentRun.status !== "DRAFT") {
      throw new Error("ניתן להסיר שורות רק מריצה בטיוטה.");
    }

    await tx.paymentRunLine.delete({ where: { id: line.id } });

    return tx.paymentRun.update({
      where: { id: line.paymentRun.id },
      data: {
        totalAmount: { decrement: Number(line.amount) },
        totalWithheld: { decrement: Number(line.withheldTax) },
      },
    });
  });
}

/** Submits a DRAFT run. Auto-approves below the approval threshold. */
export async function submitPaymentRun(input: { paymentRunId: string }) {
  const run = await db.paymentRun.findUnique({
    where: { id: input.paymentRunId },
    include: { _count: { select: { lines: true } } },
  });
  if (!run) throw new Error("ריצת תשלום לא נמצאה.");
  if (run.status !== "DRAFT") throw new Error("ניתן להגיש רק ריצה בטיוטה.");
  if (run._count.lines === 0) {
    throw new Error("יש להוסיף לפחות חשבונית אחת לריצה לפני ההגשה.");
  }

  const needsApproval = requiresPaymentRunApproval(
    Number(run.totalAmount),
    paymentRunApprovalThreshold(),
  );

  return db.paymentRun.update({
    where: { id: input.paymentRunId },
    data: needsApproval
      ? { status: "PENDING_APPROVAL" }
      : { status: "APPROVED", approvedAt: new Date() },
  });
}

/** Approves a pending run. SoD: the creator may not approve their own run (P2P-009). */
export async function approvePaymentRun(input: {
  paymentRunId: string;
  approvedById?: string;
}) {
  const run = await db.paymentRun.findUnique({
    where: { id: input.paymentRunId },
    select: { status: true, createdById: true },
  });
  if (!run) throw new Error("ריצת תשלום לא נמצאה.");
  if (run.status !== "PENDING_APPROVAL") {
    throw new Error("ניתן לאשר רק ריצה הממתינה לאישור.");
  }
  if (violatesSoD(run.createdById, input.approvedById)) {
    throw new Error(
      "הפרדת תפקידים (SoD): מי שיצר את ריצת התשלום אינו רשאי לאשר אותה.",
    );
  }

  return db.paymentRun.update({
    where: { id: input.paymentRunId },
    data: {
      status: "APPROVED",
      approvedById: input.approvedById,
      approvedAt: new Date(),
    },
  });
}

/** Rejects a pending run with a reason. */
export async function rejectPaymentRun(input: {
  paymentRunId: string;
  reason?: string;
}) {
  const run = await db.paymentRun.findUnique({
    where: { id: input.paymentRunId },
    select: { status: true },
  });
  if (!run) throw new Error("ריצת תשלום לא נמצאה.");
  if (run.status !== "PENDING_APPROVAL") {
    throw new Error("ניתן לדחות רק ריצה הממתינה לאישור.");
  }

  return db.paymentRun.update({
    where: { id: input.paymentRunId },
    data: {
      status: "REJECTED",
      rejectedReason: input.reason?.trim() ? input.reason.trim() : "נדחה",
    },
  });
}

/** Cancels a run before execution, freeing its invoices for payment elsewhere. */
export async function cancelPaymentRun(input: { paymentRunId: string }) {
  const run = await db.paymentRun.findUnique({
    where: { id: input.paymentRunId },
    select: { status: true },
  });
  if (!run) throw new Error("ריצת תשלום לא נמצאה.");
  if (!(["DRAFT", "PENDING_APPROVAL", "APPROVED"] as string[]).includes(run.status)) {
    throw new Error("לא ניתן לבטל ריצה ששולמה כבר או שבוטלה/נדחתה.");
  }

  return db.paymentRun.update({
    where: { id: input.paymentRunId },
    data: { status: "CANCELLED" },
  });
}

/**
 * Executes an APPROVED run: one VendorPayment (+ GL entry) per vendor in the
 * run, all in a single transaction. Re-validates every invoice is still
 * payable at the approved amount; if any line has gone stale (paid/cancelled
 * by another route since approval) the whole run is rejected rather than
 * silently paying a different amount than what was approved.
 */
export async function executePaymentRun(input: {
  paymentRunId: string;
  postedById?: string;
}) {
  return db.$transaction(async (tx) => {
    const run = await tx.paymentRun.findUnique({
      where: { id: input.paymentRunId },
      include: { lines: true },
    });
    if (!run) throw new Error("ריצת תשלום לא נמצאה.");
    if (run.status !== "APPROVED") {
      throw new Error("ניתן לבצע רק ריצה מאושרת.");
    }
    if (run.lines.length === 0) {
      throw new Error("לריצה זו אין שורות תשלום.");
    }

    const linesByVendor = new Map<string, typeof run.lines>();
    for (const line of run.lines) {
      const group = linesByVendor.get(line.vendorId) ?? [];
      group.push(line);
      linesByVendor.set(line.vendorId, group);
    }

    for (const [vendorId, lines] of linesByVendor) {
      const vendorAmount = round2(
        lines.reduce((sum, line) => sum + Number(line.amount), 0),
      );
      const vendorWithheld = round2(
        lines.reduce((sum, line) => sum + Number(line.withheldTax), 0),
      );

      const payment = await tx.vendorPayment.create({
        data: {
          vendorId,
          amount: vendorAmount,
          withheldTax: vendorWithheld,
          currency: run.currency,
          method: "bank_transfer",
          reference: run.runNumber,
          paidAt: new Date(),
          notes: `ריצת תשלום מקובצת ${run.runNumber}`,
          allocations: {
            create: lines.map((line) => ({
              vendorInvoiceId: line.vendorInvoiceId,
              amount: Number(line.amount),
            })),
          },
        },
      });

      for (const line of lines) {
        const invoice = await tx.vendorInvoice.findUnique({
          where: { id: line.vendorInvoiceId },
          select: { id: true, status: true, total: true, paidTotal: true },
        });
        if (!invoice) {
          throw new Error(`חשבונית ${line.vendorInvoiceId} לא נמצאה — יש לבטל את הריצה וליצור מחדש.`);
        }
        if (!["APPROVED", "PARTIALLY_PAID"].includes(invoice.status)) {
          throw new Error(
            `חשבונית ${invoice.id} כבר אינה זמינה לתשלום (סטטוס ${invoice.status}) — יש לבטל את הריצה וליצור מחדש.`,
          );
        }
        const outstanding = round2(Number(invoice.total) - Number(invoice.paidTotal));
        if (outstanding + 0.005 < Number(line.amount)) {
          throw new Error(
            `יתרת חשבונית ${invoice.id} השתנתה מאז אישור הריצה — יש לבטל את הריצה וליצור מחדש.`,
          );
        }

        const newPaidTotal = round2(
          Number(invoice.paidTotal) + Number(line.amount),
        );
        const fullyPaid = newPaidTotal >= Number(invoice.total) - 0.005;

        await tx.vendorInvoice.update({
          where: { id: invoice.id },
          data: {
            paidTotal: newPaidTotal,
            status: fullyPaid ? "PAID" : "PARTIALLY_PAID",
          },
        });

        await tx.paymentRunLine.update({
          where: { id: line.id },
          data: { vendorPaymentId: payment.id },
        });
      }

      const requiredCodes =
        vendorWithheld > 0
          ? [ACCOUNT.ACCOUNTS_PAYABLE, ACCOUNT.CASH, ACCOUNT.WITHHOLDING_TAX_PAYABLE]
          : [ACCOUNT.ACCOUNTS_PAYABLE, ACCOUNT.CASH];
      const ledgerReady = await tx.ledgerAccount.count({
        where: { code: { in: requiredCodes } },
      });
      if (ledgerReady >= requiredCodes.length && vendorAmount > 0) {
        await postJournalEntry(
          {
            entryDate: new Date(),
            memo: `תשלום לספק — ריצה מקובצת ${run.runNumber}`,
            source: "vendor_payment",
            currency: run.currency,
            aggregateType: "VendorPayment",
            aggregateId: payment.id,
            postedById: input.postedById,
            lines: buildVendorPaymentJournalLines({
              amount: vendorAmount,
              withheldTax: vendorWithheld,
            }),
          },
          tx,
        );
      }
    }

    return tx.paymentRun.update({
      where: { id: run.id },
      data: { status: "PAID", paidAt: new Date() },
      include: { lines: true },
    });
  });
}

/** Recent payment runs with line count + distinct vendor names, for the P2P workbench. */
export async function listPaymentRuns(limit = 20) {
  const runs = await db.paymentRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      lines: {
        select: { vendor: { select: { name: true } } },
      },
    },
  });

  return runs.map((run) => {
    const vendorNames = [...new Set(run.lines.map((line) => line.vendor.name))];
    return {
      id: run.id,
      runNumber: run.runNumber,
      status: run.status,
      currency: run.currency,
      totalAmount: Number(run.totalAmount),
      totalWithheld: Number(run.totalWithheld),
      lineCount: run.lines.length,
      vendorNames,
      scheduledAt: run.scheduledAt,
      createdAt: run.createdAt,
      rejectedReason: run.rejectedReason,
    };
  });
}

/** Full line detail for a single run (vendor/invoice names, per-line amounts). */
export async function getPaymentRunDetail(paymentRunId: string) {
  const run = await db.paymentRun.findUnique({
    where: { id: paymentRunId },
    include: {
      lines: {
        include: {
          vendor: { select: { name: true } },
          vendorInvoice: { select: { invoiceNumber: true } },
        },
      },
    },
  });
  if (!run) return null;

  return {
    id: run.id,
    runNumber: run.runNumber,
    status: run.status,
    lines: run.lines.map((line) => ({
      id: line.id,
      vendorName: line.vendor.name,
      invoiceNumber: line.vendorInvoice.invoiceNumber,
      amount: Number(line.amount),
      withheldTax: Number(line.withheldTax),
    })),
  };
}

/** Open (DRAFT) runs for the "add invoice to run" select. */
export async function listDraftPaymentRunsForSelect() {
  const runs = await db.paymentRun.findMany({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    select: { id: true, runNumber: true },
  });
  return runs;
}

/** IDs of vendor invoices currently held by a non-terminal run (draft/pending/approved). */
export async function listOpenPaymentRunInvoiceIds(): Promise<Set<string>> {
  const lines = await db.paymentRunLine.findMany({
    where: { paymentRun: { status: { in: [...OPEN_RUN_STATUSES] } } },
    select: { vendorInvoiceId: true },
  });
  return new Set(lines.map((line) => line.vendorInvoiceId));
}
