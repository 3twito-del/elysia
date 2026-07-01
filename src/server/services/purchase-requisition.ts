import { db } from "~/server/db";
import { createPurchaseOrder } from "~/server/services/erp";

/**
 * Purchase requisitions (P2P-001): an internal request to buy, approved before
 * it becomes a PO. Requisitions at/above an approval threshold require explicit
 * sign-off; below it they auto-approve on submission. An approved requisition
 * converts into a PurchaseOrder. Totals + threshold logic are pure + tested.
 */

/** Default approval threshold in ₪ (override via env PROCUREMENT_APPROVAL_THRESHOLD). */
export const DEFAULT_APPROVAL_THRESHOLD = 5000;

export type RequisitionLineInput = {
  description: string;
  sku?: string;
  quantity: number;
  unitCost: number;
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Sum of line totals (quantity × unitCost). Pure. */
export function computeRequisitionTotal(
  lines: Array<{ quantity: number; unitCost: number }>,
): number {
  return round2(
    lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0),
  );
}

/** Whether an estimated total needs explicit approval. Pure. */
export function requiresApproval(
  estimatedTotal: number,
  threshold: number = DEFAULT_APPROVAL_THRESHOLD,
): boolean {
  return estimatedTotal >= threshold;
}

/** Parses free-text lines "description | quantity | unitCost" (one per line). Pure. */
export function parseRequisitionLines(input: string): RequisitionLineInput[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [description, qtyRaw, costRaw] = line
        .split("|")
        .map((part) => part.trim());
      const quantity = Math.trunc(Number(qtyRaw ?? 0) || 0);
      const unitCost = Number(costRaw ?? 0) || 0;

      if (!description) throw new Error(`שורה ללא תיאור: "${line}"`);
      if (quantity <= 0) throw new Error(`כמות לא תקינה: "${line}"`);
      if (unitCost < 0) throw new Error(`עלות לא תקינה: "${line}"`);

      return { description, quantity, unitCost };
    });
}

function approvalThreshold() {
  const raw = Number(process.env.PROCUREMENT_APPROVAL_THRESHOLD);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_APPROVAL_THRESHOLD;
}

async function createNextRequisitionNumber() {
  const today = new Date();
  const prefix = `PR-${today.getUTCFullYear()}${String(
    today.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const count = await db.purchaseRequisition.count({
    where: { requisitionNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/** Creates a DRAFT requisition with its line items. */
export async function createPurchaseRequisition(input: {
  vendorId?: string;
  category?: string;
  notes?: string;
  lines: RequisitionLineInput[];
  requestedById?: string;
}) {
  if (input.lines.length === 0) {
    throw new Error("נדרשת לפחות שורה אחת לדרישת רכש.");
  }

  const estimatedTotal = computeRequisitionTotal(input.lines);

  return db.purchaseRequisition.create({
    data: {
      requisitionNumber: await createNextRequisitionNumber(),
      vendorId: input.vendorId,
      category: input.category,
      notes: input.notes,
      estimatedTotal,
      requestedById: input.requestedById,
      lines: {
        create: input.lines.map((line) => ({
          description: line.description,
          sku: line.sku,
          quantity: line.quantity,
          unitCost: line.unitCost,
          totalCost: round2(line.quantity * line.unitCost),
        })),
      },
    },
    include: { lines: true },
  });
}

/**
 * Submits a DRAFT requisition. Auto-approves when below the approval threshold;
 * otherwise moves to PENDING_APPROVAL.
 */
export async function submitPurchaseRequisition(input: { requisitionId: string }) {
  const requisition = await db.purchaseRequisition.findUnique({
    where: { id: input.requisitionId },
    select: { status: true, estimatedTotal: true },
  });
  if (!requisition) throw new Error("דרישת רכש לא נמצאה.");
  if (requisition.status !== "DRAFT") {
    throw new Error("ניתן להגיש רק דרישה בטיוטה.");
  }

  const needsApproval = requiresApproval(
    Number(requisition.estimatedTotal),
    approvalThreshold(),
  );

  return db.purchaseRequisition.update({
    where: { id: input.requisitionId },
    data: needsApproval
      ? { status: "PENDING_APPROVAL" }
      : { status: "APPROVED", approvedAt: new Date() },
  });
}

/** Approves a pending requisition. */
export async function approvePurchaseRequisition(input: {
  requisitionId: string;
  approvedById?: string;
}) {
  const requisition = await db.purchaseRequisition.findUnique({
    where: { id: input.requisitionId },
    select: { status: true },
  });
  if (!requisition) throw new Error("דרישת רכש לא נמצאה.");
  if (requisition.status !== "PENDING_APPROVAL") {
    throw new Error("ניתן לאשר רק דרישה הממתינה לאישור.");
  }

  return db.purchaseRequisition.update({
    where: { id: input.requisitionId },
    data: {
      status: "APPROVED",
      approvedById: input.approvedById,
      approvedAt: new Date(),
    },
  });
}

/** Rejects a pending requisition with a reason. */
export async function rejectPurchaseRequisition(input: {
  requisitionId: string;
  reason?: string;
}) {
  const requisition = await db.purchaseRequisition.findUnique({
    where: { id: input.requisitionId },
    select: { status: true },
  });
  if (!requisition) throw new Error("דרישת רכש לא נמצאה.");
  if (requisition.status !== "PENDING_APPROVAL") {
    throw new Error("ניתן לדחות רק דרישה הממתינה לאישור.");
  }

  return db.purchaseRequisition.update({
    where: { id: input.requisitionId },
    data: {
      status: "REJECTED",
      rejectedReason: input.reason?.trim() ? input.reason.trim() : "נדחה",
    },
  });
}

/** Converts an APPROVED requisition into a PurchaseOrder (P2P-001 → P2P-002). */
export async function convertRequisitionToPo(input: { requisitionId: string }) {
  const requisition = await db.purchaseRequisition.findUnique({
    where: { id: input.requisitionId },
    include: { lines: true },
  });
  if (!requisition) throw new Error("דרישת רכש לא נמצאה.");
  if (requisition.status !== "APPROVED") {
    throw new Error("ניתן להמיר להזמנת רכש רק דרישה מאושרת.");
  }
  if (!requisition.vendorId) {
    throw new Error("יש לשייך ספק לדרישה לפני המרה להזמנת רכש.");
  }

  const po = await createPurchaseOrder({
    vendorId: requisition.vendorId,
    notes: `דרישת רכש ${requisition.requisitionNumber}`,
    items: requisition.lines.map((line) => ({
      description: line.description,
      sku: line.sku ?? undefined,
      quantity: line.quantity,
      unitCost: Number(line.unitCost),
    })),
  });

  await db.purchaseRequisition.update({
    where: { id: requisition.id },
    data: { status: "CONVERTED", purchaseOrderId: po.id },
  });

  return po;
}

/** Active vendors for the requisition vendor select. */
export async function listVendorsForRequisition() {
  return db.vendor.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** Recent requisitions with vendor name and line totals. */
export async function listPurchaseRequisitions(limit = 20) {
  const requisitions = await db.purchaseRequisition.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      requisitionNumber: true,
      status: true,
      category: true,
      estimatedTotal: true,
      vendor: { select: { name: true } },
      lines: { select: { quantity: true } },
    },
  });

  return requisitions.map((requisition) => ({
    id: requisition.id,
    requisitionNumber: requisition.requisitionNumber,
    status: requisition.status,
    category: requisition.category,
    estimatedTotal: Number(requisition.estimatedTotal),
    vendorName: requisition.vendor?.name ?? null,
    lineCount: requisition.lines.length,
  }));
}

export async function getPurchaseRequisitionSummary() {
  const requisitions = await db.purchaseRequisition.findMany({
    select: { status: true },
  });
  let pending = 0;
  let approved = 0;
  for (const requisition of requisitions) {
    if (requisition.status === "PENDING_APPROVAL") pending += 1;
    if (requisition.status === "APPROVED") approved += 1;
  }
  return { total: requisitions.length, pending, approved };
}
