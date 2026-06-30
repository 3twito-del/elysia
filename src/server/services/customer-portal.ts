import { db } from "~/server/db";

/**
 * Customer self-service portal (POR-001): surfaces the signed-in customer's own
 * invoices (from AR) and documents (from DMS), read-only. Always scoped to the
 * authenticated customer's id — never accepts a customerId from the client. The
 * invoice roll-up is pure + unit-tested.
 */

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type PortalInvoice = {
  status: string;
  total: number;
  paidTotal: number;
};

/** Outstanding / paid roll-up for a customer's invoices. Pure. */
export function summarizeCustomerInvoices(invoices: PortalInvoice[]) {
  let outstanding = 0;
  let paid = 0;
  for (const invoice of invoices) {
    paid = round2(paid + invoice.paidTotal);
    if (invoice.status === "ISSUED" || invoice.status === "PARTIALLY_PAID") {
      outstanding = round2(outstanding + (invoice.total - invoice.paidTotal));
    }
  }
  return { count: invoices.length, outstanding, paid };
}

/**
 * Loads the portal payload for a signed-in customer (by their auth user id), or
 * null if the user isn't a customer. Only ever reads that customer's own rows.
 */
export async function getCustomerPortalData(userId: string) {
  const customer = await db.customer.findUnique({
    where: { userId },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  if (!customer) return null;

  const [invoiceRows, documentRows] = await Promise.all([
    db.customerInvoice.findMany({
      where: { customerId: customer.id },
      orderBy: { invoiceDate: "desc" },
      take: 50,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        paidTotal: true,
        invoiceDate: true,
        allocationNumber: true,
      },
    }),
    db.document.findMany({
      where: { entityType: "customer", entityId: customer.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        url: true,
        category: true,
        signatureStatus: true,
        createdAt: true,
      },
    }),
  ]);

  const invoices = invoiceRows.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    total: Number(invoice.total),
    paidTotal: Number(invoice.paidTotal),
    invoiceDate: invoice.invoiceDate,
    allocationNumber: invoice.allocationNumber,
  }));

  return {
    customer,
    invoices,
    documents: documentRows,
    summary: summarizeCustomerInvoices(invoices),
  };
}
