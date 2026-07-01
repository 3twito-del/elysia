"use server";

import type { AdminPermission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import {
  approveVendorInvoice,
  createVendorInvoice,
  parseInvoiceLines,
  recordVendorPayment,
} from "~/server/services/accounts-payable";
import {
  cancelInventoryCount,
  completeInventoryCount,
  createInventoryCount,
  parseCountLines,
} from "~/server/services/cycle-count";
import {
  cancelWorkOrder,
  completeWorkOrder,
  createBom,
  createWorkOrder,
} from "~/server/services/manufacturing";
import {
  createCarrier,
  createShippingRate,
} from "~/server/services/shipping-rates";
import {
  cancelStockTransfer,
  completeStockTransfer,
  createStockTransfer,
  parseTransferLines,
} from "~/server/services/stock-transfer";
import {
  issueVendorPortalToken,
  revokeVendorPortalToken,
} from "~/server/services/vendor-portal";

export async function issueVendorPortalTokenAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const vendorId = stringValue(formData.get("vendorId"));
  if (!vendorId) throw new Error("יש לבחור ספק.");

  await issueVendorPortalToken({ vendorId });

  revalidatePath("/admin/erp");
}

export async function revokeVendorPortalTokenAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const tokenId = stringValue(formData.get("tokenId"));
  if (!tokenId) throw new Error("חסר מזהה קישור.");

  await revokeVendorPortalToken({ tokenId });

  revalidatePath("/admin/erp");
}

export async function createVendorInvoiceAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const vendorId = stringValue(formData.get("vendorId"));
  if (!vendorId) throw new Error("יש לבחור ספק.");

  const invoiceNumber = stringValue(formData.get("invoiceNumber")).trim();
  if (!invoiceNumber) throw new Error("חסר מספר חשבונית ספק.");

  const lines = parseInvoiceLines(stringValue(formData.get("lines")));
  if (lines.length === 0) {
    throw new Error("יש להזין לפחות שורה אחת (תיאור | כמות | עלות).");
  }

  const dueDate = optionalString(formData.get("dueDate"));

  await createVendorInvoice({
    vendorId,
    invoiceNumber,
    invoiceDate: new Date(),
    dueDate: dueDate ? new Date(dueDate) : undefined,
    lines,
  });

  revalidatePath("/admin/erp");
}

export async function approveVendorInvoiceAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  await approveVendorInvoice({
    invoiceId: stringValue(formData.get("invoiceId")),
    postedById: admin.id,
    force: formData.get("force") === "1",
  });

  revalidatePath("/admin/erp");
}

export async function recordVendorPaymentAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const invoiceId = stringValue(formData.get("invoiceId"));
  const vendorId = stringValue(formData.get("vendorId"));
  const amount = Number(formData.get("amount") ?? 0) || 0;
  if (!invoiceId || !vendorId) throw new Error("חסרים פרטי חשבונית לתשלום.");
  if (amount <= 0) throw new Error("יש להזין סכום תשלום חיובי.");

  await recordVendorPayment({
    vendorId,
    amount,
    withheldTax: Number(formData.get("withheldTax") ?? 0) || 0,
    postedById: admin.id,
    allocations: [{ vendorInvoiceId: invoiceId, amount }],
  });

  revalidatePath("/admin/erp");
}

export async function createStockTransferAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const sourceBranchId = stringValue(formData.get("sourceBranchId"));
  const destBranchId = stringValue(formData.get("destBranchId"));
  if (!sourceBranchId || !destBranchId) {
    throw new Error("יש לבחור סניף מקור ויעד.");
  }

  const lines = parseTransferLines(stringValue(formData.get("lines")));
  if (lines.length === 0) {
    throw new Error('יש להזין לפחות שורה אחת (מק"ט | כמות).');
  }

  await createStockTransfer({
    sourceBranchId,
    destBranchId,
    lines,
    notes: optionalString(formData.get("notes")),
    createdById: admin.id,
  });

  revalidatePath("/admin/erp");
}

export async function completeStockTransferAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const transferId = stringValue(formData.get("transferId"));
  if (!transferId) throw new Error("חסר מזהה העברה.");

  await completeStockTransfer({ transferId });
  revalidatePath("/admin/erp");
}

export async function cancelStockTransferAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const transferId = stringValue(formData.get("transferId"));
  if (!transferId) throw new Error("חסר מזהה העברה.");

  await cancelStockTransfer({ transferId });
  revalidatePath("/admin/erp");
}

export async function createInventoryCountAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const branchId = stringValue(formData.get("branchId"));
  if (!branchId) throw new Error("יש לבחור סניף לספירה.");

  const lines = parseCountLines(stringValue(formData.get("lines")));
  if (lines.length === 0) {
    throw new Error('יש להזין לפחות שורת ספירה אחת (מק"ט | כמות).');
  }

  await createInventoryCount({
    branchId,
    lines,
    notes: optionalString(formData.get("notes")),
    countedById: admin.id,
  });

  revalidatePath("/admin/erp");
}

export async function completeInventoryCountAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const countId = stringValue(formData.get("countId"));
  if (!countId) throw new Error("חסר מזהה ספירה.");

  await completeInventoryCount({ countId });
  revalidatePath("/admin/erp");
}

export async function cancelInventoryCountAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const countId = stringValue(formData.get("countId"));
  if (!countId) throw new Error("חסר מזהה ספירה.");

  await cancelInventoryCount({ countId });
  revalidatePath("/admin/erp");
}

export async function createBomAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const finishedSku = stringValue(formData.get("finishedSku")).trim();
  if (!finishedSku) throw new Error('יש להזין מק"ט מוצר מוגמר.');

  const components = parseTransferLines(stringValue(formData.get("components")));
  if (components.length === 0) {
    throw new Error('יש להזין לפחות רכיב אחד (מק"ט | כמות).');
  }

  await createBom({
    finishedSku,
    name: optionalString(formData.get("name")),
    components,
  });

  revalidatePath("/admin/erp");
}

export async function createWorkOrderAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const bomId = stringValue(formData.get("bomId"));
  const branchId = stringValue(formData.get("branchId"));
  if (!bomId || !branchId) throw new Error("יש לבחור עץ מוצר וסניף.");

  await createWorkOrder({
    bomId,
    branchId,
    quantity: Number(formData.get("quantity") ?? 0) || 0,
    createdById: admin.id,
  });

  revalidatePath("/admin/erp");
}

export async function completeWorkOrderAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const workOrderId = stringValue(formData.get("workOrderId"));
  if (!workOrderId) throw new Error("חסר מזהה הוראת עבודה.");

  await completeWorkOrder({ workOrderId });

  revalidatePath("/admin/erp");
}

export async function cancelWorkOrderAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const workOrderId = stringValue(formData.get("workOrderId"));
  if (!workOrderId) throw new Error("חסר מזהה הוראת עבודה.");

  await cancelWorkOrder({ workOrderId });

  revalidatePath("/admin/erp");
}

export async function createCarrierAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם המוביל הוא שדה חובה.");

  await createCarrier({ name });

  revalidatePath("/admin/erp");
}

export async function createShippingRateAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const carrierId = stringValue(formData.get("carrierId"));
  const zone = stringValue(formData.get("zone")).trim();
  if (!carrierId || !zone) throw new Error("יש לבחור מוביל ולהזין אזור.");

  await createShippingRate({
    carrierId,
    zone,
    maxWeightKg: Number(formData.get("maxWeightKg") ?? 0) || 0,
    price: Number(formData.get("price") ?? 0) || 0,
  });

  revalidatePath("/admin/erp");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/erp");
  }

  const admin = await getAdminFromSession(session);

  if (!admin || !hasAdminPermission(admin, permission)) {
    throw new Error("אין הרשאה לבצע את הפעולה המבוקשת.");
  }

  return admin;
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
