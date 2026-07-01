import { db } from "~/server/db";

/**
 * Israeli "מבנה אחיד" (uniform structure / SHAAM) export — FIN-TAX-003. Produces
 * the two-file BKMVDATA + INI structure from the GL for tax-audit handoff.
 *
 * REGULATORY CAVEAT: this implements the record STRUCTURE (A100 opening, B100
 * journal movements, Z900 closing + an INI summary) per directive 1.31 to the
 * best of this code. Exact field widths/codes and the full record set
 * (B110/C100/D110/M100) MUST be validated against the current רשות המסים spec
 * and your accountant before filing. The pure builders + control totals are
 * unit-tested; conformance is not guaranteed.
 */

export const SHAAM_VERSION = "&OF1.31&";

export type ShaamBusiness = {
  vatNumber: string;
  name: string;
  primaryKey: string;
};

export type ShaamMovement = {
  transactionNumber: string;
  lineNumber: number;
  batch: string;
  type: string;
  reference: string;
  details: string;
  date: Date;
  accountKey: string;
  counterAccountKey?: string;
  side: "DEBIT" | "CREDIT";
  currency: string;
  amount: number; // in shekels
  branch?: string;
};

/** Right-aligned, zero-padded numeric field (digits only). Pure. */
export function padNum(value: string | number, length: number): string {
  const digits = String(value).replace(/\D/g, "").slice(-length);
  return digits.padStart(length, "0");
}

/** Left-aligned, space-padded text field. Pure. */
export function padText(value: string, length: number): string {
  return value.slice(0, length).padEnd(length, " ");
}

/** SHAAM date encoding YYYYMMDD. Pure. */
export function shaamDate(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, "0");
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}${m}${d}`;
}

/** Signed amount in agorot: sign char + 14 digits. Pure. */
export function shaamAmount(value: number): string {
  const agorot = Math.round(Math.abs(value) * 100);
  const sign = value < 0 ? "-" : "+";
  return sign + padNum(agorot, 14);
}

/** A100 opening record. Pure. */
export function buildA100(input: {
  business: ShaamBusiness;
  recordNumber: number;
}): string {
  return (
    "A100" +
    padNum(input.recordNumber, 9) +
    padNum(input.business.vatNumber, 9) +
    padText(input.business.primaryKey, 15) +
    padText(SHAAM_VERSION, 8) +
    padText("", 50)
  );
}

/** B100 journal-movement record (core fields). Pure. */
export function buildB100(input: {
  movement: ShaamMovement;
  recordNumber: number;
  vatNumber: string;
}): string {
  const m = input.movement;
  return (
    "B100" +
    padNum(input.recordNumber, 9) +
    padNum(input.vatNumber, 9) +
    padNum(m.transactionNumber, 10) +
    padNum(m.lineNumber, 5) +
    padNum(m.batch, 8) +
    padText(m.type, 15) +
    padText(m.reference, 20) +
    padText(m.details, 50) +
    shaamDate(m.date) +
    padText(m.accountKey, 15) +
    padText(m.counterAccountKey ?? "", 15) +
    (m.side === "DEBIT" ? "1" : "2") +
    padText(m.currency, 3) +
    shaamAmount(m.amount) +
    padText(m.branch ?? "", 10)
  );
}

export type ShaamDocumentLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ShaamDocument = {
  docType: string;
  docNumber: string;
  date: Date;
  total: number;
  customerName?: string;
  lines: ShaamDocumentLine[];
};

/** C100 document header record (invoice/receipt). Pure. */
export function buildC100(input: {
  document: ShaamDocument;
  recordNumber: number;
  vatNumber: string;
}): string {
  const doc = input.document;
  return (
    "C100" +
    padNum(input.recordNumber, 9) +
    padNum(input.vatNumber, 9) +
    padText(doc.docType, 3) +
    padText(doc.docNumber, 20) +
    shaamDate(doc.date) +
    padText(doc.customerName ?? "", 50) +
    shaamAmount(doc.total)
  );
}

/** D110 document line record. Pure. */
export function buildD110(input: {
  line: ShaamDocumentLine;
  docNumber: string;
  lineNumber: number;
  recordNumber: number;
  vatNumber: string;
}): string {
  const line = input.line;
  return (
    "D110" +
    padNum(input.recordNumber, 9) +
    padNum(input.vatNumber, 9) +
    padText(input.docNumber, 20) +
    padNum(input.lineNumber, 4) +
    padText(line.description, 50) +
    padNum(Math.round(line.quantity), 12) +
    shaamAmount(line.unitPrice) +
    shaamAmount(line.lineTotal)
  );
}

/** Z900 closing record with the total record count. Pure. */
export function buildZ900(input: {
  recordNumber: number;
  vatNumber: string;
  totalRecords: number;
}): string {
  return (
    "Z900" +
    padNum(input.recordNumber, 9) +
    padNum(input.vatNumber, 9) +
    padNum(input.totalRecords, 15) +
    padText("", 50)
  );
}

export type UniformStructure = {
  bkmvdata: string;
  ini: string;
  summary: {
    recordCount: number;
    movementCount: number;
    documentCount: number;
    totalDebit: number;
    totalCredit: number;
  };
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Assembles the BKMVDATA file (A100 + B100×n + Z900) and a matching INI summary.
 * Pure — given the business + movements, output is deterministic.
 */
export function buildUniformStructure(input: {
  business: ShaamBusiness;
  movements: ShaamMovement[];
  documents?: ShaamDocument[];
}): UniformStructure {
  const documents = input.documents ?? [];
  const vatNumber = input.business.vatNumber;
  const lines: string[] = [];
  let recordNumber = 1;

  lines.push(buildA100({ business: input.business, recordNumber: recordNumber++ }));

  let totalDebit = 0;
  let totalCredit = 0;
  for (const movement of input.movements) {
    lines.push(buildB100({ movement, recordNumber: recordNumber++, vatNumber }));
    if (movement.side === "DEBIT") totalDebit += movement.amount;
    else totalCredit += movement.amount;
  }

  let documentLineCount = 0;
  for (const document of documents) {
    lines.push(buildC100({ document, recordNumber: recordNumber++, vatNumber }));
    document.lines.forEach((line, index) => {
      lines.push(
        buildD110({
          line,
          docNumber: document.docNumber,
          lineNumber: index + 1,
          recordNumber: recordNumber++,
          vatNumber,
        }),
      );
      documentLineCount += 1;
    });
  }

  const totalRecords = recordNumber; // A100 + movements + docs + this Z900
  lines.push(buildZ900({ recordNumber, vatNumber, totalRecords }));

  const ini = [
    "A100" + padNum(1, 15),
    "B100" + padNum(input.movements.length, 15),
    "C100" + padNum(documents.length, 15),
    "D110" + padNum(documentLineCount, 15),
    "Z900" + padNum(1, 15),
    "TOTAL" + padNum(totalRecords, 15),
  ].join("\r\n");

  return {
    bkmvdata: lines.join("\r\n"),
    ini,
    summary: {
      recordCount: totalRecords,
      movementCount: input.movements.length,
      documentCount: documents.length,
      totalDebit: round2(totalDebit),
      totalCredit: round2(totalCredit),
    },
  };
}

// ---- period gatherer (DB) ----

function monthRange(year: number, month: number) {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(month === 12 ? year + 1 : year, month % 12, 1));
  return { from, to };
}

/** Builds the uniform structure for a fiscal month from the GL. */
export async function getShaamExportForPeriod(input: {
  year: number;
  month: number;
}): Promise<UniformStructure> {
  const { from, to } = monthRange(input.year, input.month);

  const base = await db.legalEntity.findFirst({
    where: { isBase: true },
    select: { code: true, name: true },
  });
  const business: ShaamBusiness = {
    vatNumber: process.env.SHAAM_VAT_NUMBER ?? "000000000",
    name: base?.name ?? "Elysia",
    primaryKey: `${input.year}${String(input.month).padStart(2, "0")}`,
  };

  const lines = await db.journalLine.findMany({
    where: {
      journalEntry: { status: "POSTED", entryDate: { gte: from, lt: to } },
    },
    orderBy: { id: "asc" },
    select: {
      debit: true,
      credit: true,
      branchId: true,
      account: { select: { code: true } },
      journalEntry: {
        select: {
          entryNumber: true,
          entryDate: true,
          source: true,
          memo: true,
        },
      },
    },
  });

  const movements: ShaamMovement[] = lines.map((line, index) => {
    const debit = Number(line.debit);
    const credit = Number(line.credit);
    const isDebit = debit >= credit;
    return {
      transactionNumber: line.journalEntry.entryNumber,
      lineNumber: index + 1,
      batch: "1",
      type: line.journalEntry.source,
      reference: line.journalEntry.entryNumber,
      details: line.journalEntry.memo ?? "",
      date: line.journalEntry.entryDate,
      accountKey: line.account.code,
      side: isDebit ? "DEBIT" : "CREDIT",
      currency: "ILS",
      amount: isDebit ? debit : credit,
      branch: line.branchId ?? undefined,
    };
  });

  const invoiceRows = await db.customerInvoice.findMany({
    where: {
      status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID"] },
      invoiceDate: { gte: from, lt: to },
    },
    orderBy: { invoiceDate: "asc" },
    select: {
      invoiceNumber: true,
      invoiceDate: true,
      total: true,
      lines: {
        select: { description: true, quantity: true, unitPrice: true, lineTotal: true },
      },
    },
  });

  const documents: ShaamDocument[] = invoiceRows.map((invoice) => ({
    docType: "320", // tax invoice (חשבונית מס) — verify code
    docNumber: invoice.invoiceNumber,
    date: invoice.invoiceDate,
    total: Number(invoice.total),
    lines: invoice.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
      lineTotal: Number(line.lineTotal),
    })),
  }));

  return buildUniformStructure({ business, movements, documents });
}
