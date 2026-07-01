import { db } from "~/server/db";

/**
 * EDI (X12) document builders (IPL-003). Produces structurally-representative
 * 850 (Purchase Order) and 810 (Invoice) transaction sets wrapped in an
 * ISA/GS…GE/IEA envelope. The segment assembly + control counts are pure and
 * unit-tested.
 *
 * CAVEAT: X12 conformance is trading-partner-specific. Field widths, qualifiers
 * and segment sets here follow the 004010 baseline — validate against each
 * partner's implementation guide before transmitting.
 */

const ELEMENT = "*";
const SEGMENT = "~";

/** Joins elements into an X12 segment. Pure. */
export function ediSegment(...elements: Array<string | number>): string {
  return elements.map((el) => String(el)).join(ELEMENT) + SEGMENT;
}

function pad(value: string, len: number): string {
  return value.slice(0, len).padEnd(len, " ");
}

function padNum(value: string | number, len: number): string {
  return String(value).replace(/\D/g, "").slice(-len).padStart(len, "0");
}

/** X12 long date YYYYMMDD. Pure. */
export function x12Date(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/** X12 short date YYMMDD. Pure. */
export function x12DateShort(date: Date): string {
  return x12Date(date).slice(2);
}

/** X12 time HHMM. Pure. */
export function x12Time(date: Date): string {
  return date.toISOString().slice(11, 16).replace(":", "");
}

type EnvelopeOptions = {
  senderId: string;
  receiverId: string;
  controlNumber: number;
  functionalCode: string; // "PO" for 850, "IN" for 810
  date: Date;
};

/** Wraps a transaction set (ST…SE segments) in an ISA/GS…GE/IEA envelope. Pure. */
export function wrapEnvelope(
  transactionSet: string[],
  opts: EnvelopeOptions,
): string {
  const control = padNum(opts.controlNumber, 9);
  const isa = [
    "ISA", "00", pad("", 10), "00", pad("", 10),
    "ZZ", pad(opts.senderId.toUpperCase(), 15),
    "ZZ", pad(opts.receiverId.toUpperCase(), 15),
    x12DateShort(opts.date), x12Time(opts.date),
    "U", "00401", control, "0", "P", ">",
  ].join(ELEMENT) + SEGMENT;
  const gs = ediSegment(
    "GS", opts.functionalCode, opts.senderId.toUpperCase(), opts.receiverId.toUpperCase(),
    x12Date(opts.date), x12Time(opts.date), opts.controlNumber, "X", "004010",
  );
  const ge = ediSegment("GE", 1, opts.controlNumber);
  const iea = ediSegment("IEA", 1, control);
  return [isa, gs, ...transactionSet, ge, iea].join("\n");
}

export type Edi850Input = {
  poNumber: string;
  poDate: Date;
  vendorName: string;
  senderId: string;
  receiverId: string;
  controlNumber: number;
  lines: Array<{ sku: string; description: string; quantity: number; unitCost: number }>;
};

/** Builds a complete X12 850 (Purchase Order). Pure. */
export function build850(input: Edi850Input): string {
  const setControl = padNum(1, 4);
  const body = [
    ediSegment("BEG", "00", "SA", input.poNumber, "", x12Date(input.poDate)),
    ediSegment("DTM", "004", x12Date(input.poDate)),
    ediSegment("N1", "VN", input.vendorName),
    ...input.lines.map((line, index) =>
      ediSegment(
        "PO1", index + 1, line.quantity, "EA", line.unitCost.toFixed(2), "",
        "SK", line.sku || `LINE${index + 1}`,
      ),
    ),
    ediSegment("CTT", input.lines.length),
  ];
  const st = ediSegment("ST", "850", setControl);
  const se = ediSegment("SE", body.length + 2, setControl);
  return wrapEnvelope([st, ...body, se], {
    senderId: input.senderId,
    receiverId: input.receiverId,
    controlNumber: input.controlNumber,
    functionalCode: "PO",
    date: input.poDate,
  });
}

export type Edi810Input = {
  invoiceNumber: string;
  invoiceDate: Date;
  vendorName: string;
  senderId: string;
  receiverId: string;
  controlNumber: number;
  total: number;
  lines: Array<{ sku: string; quantity: number; unitPrice: number }>;
};

/** Builds a complete X12 810 (Invoice). Pure. */
export function build810(input: Edi810Input): string {
  const setControl = padNum(1, 4);
  const body = [
    ediSegment("BIG", x12Date(input.invoiceDate), input.invoiceNumber),
    ediSegment("N1", "VN", input.vendorName),
    ...input.lines.map((line, index) =>
      ediSegment(
        "IT1", index + 1, line.quantity, "EA", line.unitPrice.toFixed(2), "",
        "SK", line.sku || `LINE${index + 1}`,
      ),
    ),
    ediSegment("TDS", Math.round(input.total * 100)),
    ediSegment("CTT", input.lines.length),
  ];
  const st = ediSegment("ST", "810", setControl);
  const se = ediSegment("SE", body.length + 2, setControl);
  return wrapEnvelope([st, ...body, se], {
    senderId: input.senderId,
    receiverId: input.receiverId,
    controlNumber: input.controlNumber,
    functionalCode: "IN",
    date: input.invoiceDate,
  });
}

export type Edi856Input = {
  shipmentId: string;
  shipDate: Date;
  orderNumber: string;
  shipToName: string;
  carrier?: string;
  tracking?: string;
  senderId: string;
  receiverId: string;
  controlNumber: number;
  lines: Array<{ sku: string; quantity: number }>;
};

/**
 * Builds a complete X12 856 (Advance Ship Notice) with the standard
 * Shipment→Order→Item HL hierarchy. Pure.
 */
export function build856(input: Edi856Input): string {
  const setControl = padNum(1, 4);
  const body: string[] = [
    ediSegment(
      "BSN",
      "00",
      input.shipmentId,
      x12Date(input.shipDate),
      x12Time(input.shipDate),
    ),
    // Shipment level
    ediSegment("HL", 1, "", "S"),
    ediSegment("TD1", "CTN", input.lines.length),
    ediSegment("TD5", "", "", input.carrier ?? "", ""),
    ediSegment("REF", "CN", input.tracking ?? ""),
    ediSegment("DTM", "011", x12Date(input.shipDate)),
    ediSegment("N1", "ST", input.shipToName),
    // Order level
    ediSegment("HL", 2, 1, "O"),
    ediSegment("PRF", input.orderNumber),
  ];

  let hlCounter = 2;
  for (const line of input.lines) {
    hlCounter += 1;
    body.push(
      ediSegment("HL", hlCounter, 2, "I"),
      ediSegment("LIN", "", "SK", line.sku || `LINE${hlCounter}`),
      ediSegment("SN1", "", line.quantity, "EA"),
    );
  }

  body.push(ediSegment("CTT", hlCounter));

  const st = ediSegment("ST", "856", setControl);
  const se = ediSegment("SE", body.length + 2, setControl);
  return wrapEnvelope([st, ...body, se], {
    senderId: input.senderId,
    receiverId: input.receiverId,
    controlNumber: input.controlNumber,
    functionalCode: "SH",
    date: input.shipDate,
  });
}

// ---- persistence ----

function partnerSender() {
  return process.env.EDI_SENDER_ID ?? "ELYSIA";
}

async function nextControlNumber() {
  return (await db.ediDocument.count()) + 1;
}

/** Generates + stores an 850 from a purchase order. */
export async function generateEdi850ForPo(purchaseOrderId: string) {
  const po = await db.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    select: {
      poNumber: true,
      createdAt: true,
      vendor: { select: { name: true, key: true } },
      items: { select: { sku: true, description: true, quantity: true, unitCost: true } },
    },
  });
  if (!po) throw new Error("הזמנת רכש לא נמצאה.");

  const payload = build850({
    poNumber: po.poNumber,
    poDate: po.createdAt,
    vendorName: po.vendor.name,
    senderId: partnerSender(),
    receiverId: po.vendor.key,
    controlNumber: await nextControlNumber(),
    lines: po.items.map((item) => ({
      sku: item.sku ?? "",
      description: item.description,
      quantity: item.quantity,
      unitCost: Number(item.unitCost),
    })),
  });

  return db.ediDocument.create({
    data: {
      docType: "850",
      direction: "OUTBOUND",
      partner: po.vendor.name,
      reference: po.poNumber,
      payload,
    },
  });
}

/** Generates + stores an 856 (ASN) from a shipment. */
export async function generateEdi856ForShipment(shipmentId: string) {
  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    select: {
      id: true,
      provider: true,
      tracking: true,
      shippedAt: true,
      order: {
        select: {
          orderNumber: true,
          recipientName: true,
          createdAt: true,
          items: { select: { sku: true, quantity: true } },
        },
      },
    },
  });
  if (!shipment) throw new Error("משלוח לא נמצא.");

  const payload = build856({
    shipmentId: shipment.id,
    shipDate: shipment.shippedAt ?? shipment.order.createdAt,
    orderNumber: shipment.order.orderNumber,
    shipToName: shipment.order.recipientName,
    carrier: shipment.provider ?? undefined,
    tracking: shipment.tracking ?? undefined,
    senderId: partnerSender(),
    receiverId: shipment.order.orderNumber,
    controlNumber: await nextControlNumber(),
    lines: shipment.order.items.map((item) => ({
      sku: item.sku,
      quantity: item.quantity,
    })),
  });

  return db.ediDocument.create({
    data: {
      docType: "856",
      direction: "OUTBOUND",
      partner: shipment.order.recipientName,
      reference: shipment.order.orderNumber,
      payload,
    },
  });
}

/** Recent shipments eligible for an ASN (856). */
export async function listShipmentsForEdi(limit = 20) {
  const shipments = await db.shipment.findMany({
    orderBy: { shippedAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      tracking: true,
      provider: true,
      order: { select: { orderNumber: true, recipientName: true } },
    },
  });
  return shipments.map((shipment) => ({
    id: shipment.id,
    status: shipment.status,
    tracking: shipment.tracking,
    provider: shipment.provider,
    orderNumber: shipment.order.orderNumber,
    recipientName: shipment.order.recipientName,
  }));
}

export async function listPurchaseOrdersForEdi(limit = 20) {
  const pos = await db.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      poNumber: true,
      status: true,
      total: true,
      vendor: { select: { name: true } },
    },
  });
  return pos.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    status: po.status,
    total: Number(po.total),
    vendorName: po.vendor.name,
  }));
}

export async function listEdiDocuments(limit = 20) {
  const docs = await db.ediDocument.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      docType: true,
      direction: true,
      partner: true,
      reference: true,
      status: true,
      createdAt: true,
    },
  });
  return docs;
}

export async function getEdiDocumentPayload(id: string) {
  return db.ediDocument.findUnique({ where: { id }, select: { payload: true, reference: true, docType: true } });
}

export async function getEdiSummary() {
  const [documents, outbound] = await Promise.all([
    db.ediDocument.count(),
    db.ediDocument.count({ where: { direction: "OUTBOUND" } }),
  ]);
  return { documents, outbound };
}
