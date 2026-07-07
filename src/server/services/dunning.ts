import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";

/**
 * AR dunning / collections (FIN-AR-001): builds a worklist of overdue customer
 * invoices with an escalation level, and logs follow-up actions. The overdue /
 * level maths are pure + unit-tested. Actual reminder delivery (email) is a
 * follow-up gated on an email provider — this layer is the internal worklist.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days an invoice is past due (0 if not due or no due date). Pure. */
export function daysOverdue(dueDate: Date | null, asOf: Date): number {
  if (!dueDate) return 0;
  const diff = asOf.getTime() - dueDate.getTime();
  return diff <= 0 ? 0 : Math.floor(diff / DAY_MS);
}

/**
 * Dunning escalation level from days overdue:
 * 0 current · 1 (1–30) · 2 (31–60) · 3 (61–90) · 4 (90+, collections). Pure.
 */
export function dunningLevel(days: number): 0 | 1 | 2 | 3 | 4 {
  if (days <= 0) return 0;
  if (days <= 30) return 1;
  if (days <= 60) return 2;
  if (days <= 90) return 3;
  return 4;
}

export type DunningInvoice = {
  id: string;
  invoiceNumber: string;
  total: number;
  paidTotal: number;
  dueDate: Date | null;
  status: string;
};

export type DunningEntry = {
  id: string;
  invoiceNumber: string;
  outstanding: number;
  daysOverdue: number;
  level: number;
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Builds the dunning worklist: open invoices with a positive outstanding balance
 * that are past due, with their escalation level, most-overdue first. Pure.
 */
export function buildDunningWorklist(
  invoices: DunningInvoice[],
  asOf: Date,
): DunningEntry[] {
  const entries: DunningEntry[] = [];
  for (const invoice of invoices) {
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") continue;
    const outstanding = round2(invoice.total - invoice.paidTotal);
    if (outstanding <= 0) continue;
    const overdue = daysOverdue(invoice.dueDate, asOf);
    if (overdue <= 0) continue;
    entries.push({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      outstanding,
      daysOverdue: overdue,
      level: dunningLevel(overdue),
    });
  }
  return entries.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/** Overdue-invoice worklist with customer labels and last dunning level. */
export async function getDunningWorklist(limit = 50) {
  const invoices = await db.customerInvoice.findMany({
    where: {
      status: { in: ["ISSUED", "PARTIALLY_PAID"] },
      dueDate: { lt: new Date() },
    },
    take: limit,
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      paidTotal: true,
      dueDate: true,
      status: true,
      customerId: true,
    },
  });

  const worklist = buildDunningWorklist(
    invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: Number(invoice.total),
      paidTotal: Number(invoice.paidTotal),
      dueDate: invoice.dueDate,
      status: invoice.status,
    })),
    new Date(),
  );

  const customerByInvoice = new Map(
    invoices.map((invoice) => [invoice.id, invoice.customerId]),
  );
  const customerIds = [
    ...new Set(
      invoices.map((invoice) => invoice.customerId).filter(Boolean),
    ),
  ] as string[];
  const customers =
    customerIds.length > 0
      ? await db.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
  const labelById = new Map(
    customers.map((customer) => {
      const name = [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      return [customer.id, name.length > 0 ? name : (customer.email ?? "לקוח")];
    }),
  );
  const emailById = new Map(
    customers.map((customer) => [customer.id, customer.email]),
  );

  const lastActions = await db.dunningAction.findMany({
    where: { customerInvoiceId: { in: worklist.map((entry) => entry.id) } },
    orderBy: { createdAt: "desc" },
    select: { customerInvoiceId: true, level: true, createdAt: true },
  });
  const lastActionByInvoice = new Map<string, { level: number; at: Date }>();
  for (const action of lastActions) {
    if (!lastActionByInvoice.has(action.customerInvoiceId)) {
      lastActionByInvoice.set(action.customerInvoiceId, {
        level: action.level,
        at: action.createdAt,
      });
    }
  }

  return worklist.map((entry) => {
    const customerId = customerByInvoice.get(entry.id);
    const lastAction = lastActionByInvoice.get(entry.id);
    return {
      ...entry,
      customerLabel: customerId
        ? (labelById.get(customerId) ?? "לקוח")
        : "—",
      customerEmail: customerId ? (emailById.get(customerId) ?? null) : null,
      lastContactLevel: lastAction?.level ?? null,
      lastContactAt: lastAction?.at ?? null,
    };
  });
}

/** Builds the reminder email subject + body for a dunning level. Pure. */
export function buildDunningEmail(input: {
  invoiceNumber: string;
  outstanding: number;
  daysOverdue: number;
  level: number;
}): { subject: string; body: string } {
  const tone =
    input.level >= 3
      ? "התראה לפני העברה לגבייה"
      : input.level === 2
        ? "תזכורת שנייה לתשלום"
        : "תזכורת לתשלום";
  const subject = `${tone} - חשבונית ${input.invoiceNumber}`;
  const body = [
    "שלום,",
    `חשבונית ${input.invoiceNumber} ביתרה של ₪${input.outstanding} נמצאת באיחור של ${input.daysOverdue} ימים.`,
    input.level >= 3
      ? "נבקש להסדיר את התשלום בהקדם כדי להימנע מהמשך הליכי גבייה."
      : "נשמח אם תסדירו את התשלום בהקדם. אם התשלום כבר בוצע, נא להתעלם מהודעה זו.",
    "בברכה,\nצוות Elysia",
  ].join("\n\n");
  return { subject, body };
}

/**
 * Sends a dunning reminder email for an overdue invoice to the customer and logs
 * the contact. Outbound email via the configured provider.
 */
export async function sendDunningReminder(input: { customerInvoiceId: string }) {
  const invoice = await db.customerInvoice.findUnique({
    where: { id: input.customerInvoiceId },
    select: {
      invoiceNumber: true,
      total: true,
      paidTotal: true,
      dueDate: true,
      status: true,
      customer: { select: { email: true } },
    },
  });
  if (!invoice) throw new Error("חשבונית לא נמצאה.");

  const email = invoice.customer?.email;
  if (!email) throw new Error("ללקוח אין כתובת דוא\"ל לשליחת תזכורת.");

  const outstanding = round2(Number(invoice.total) - Number(invoice.paidTotal));
  const overdue = daysOverdue(invoice.dueDate, new Date());
  const level = dunningLevel(overdue);

  const { subject, body } = buildDunningEmail({
    invoiceNumber: invoice.invoiceNumber,
    outstanding,
    daysOverdue: overdue,
    level,
  });

  await notificationProvider.sendEmail({ to: email, subject, body });

  return db.dunningAction.create({
    data: {
      customerInvoiceId: input.customerInvoiceId,
      level,
      note: `תזכורת נשלחה ל-${email}`,
    },
  });
}

/** Logs a dunning follow-up on an overdue invoice. */
export async function recordDunningContact(input: {
  customerInvoiceId: string;
  level: number;
  note?: string;
}) {
  if (!input.customerInvoiceId) throw new Error("חסר מזהה חשבונית.");
  const level = Math.max(1, Math.min(4, Math.trunc(input.level)));

  const invoice = await db.customerInvoice.findUnique({
    where: { id: input.customerInvoiceId },
    select: { id: true },
  });
  if (!invoice) throw new Error("חשבונית לא נמצאה.");

  return db.dunningAction.create({
    data: {
      customerInvoiceId: input.customerInvoiceId,
      level,
      note: input.note?.trim() ? input.note.trim() : null,
    },
  });
}

export async function getDunningSummary() {
  const invoices = await db.customerInvoice.findMany({
    where: { status: { in: ["ISSUED", "PARTIALLY_PAID"] } },
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      paidTotal: true,
      dueDate: true,
      status: true,
    },
  });
  const worklist = buildDunningWorklist(
    invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: Number(invoice.total),
      paidTotal: Number(invoice.paidTotal),
      dueDate: invoice.dueDate,
      status: invoice.status,
    })),
    new Date(),
  );
  const overdueTotal = worklist.reduce((sum, entry) => sum + entry.outstanding, 0);
  const escalations = worklist.filter((entry) => entry.level >= 3).length;
  return { overdueCount: worklist.length, overdueTotal: round2(overdueTotal), escalations };
}
