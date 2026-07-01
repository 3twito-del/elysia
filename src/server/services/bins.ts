import { db } from "~/server/db";

/**
 * Storage bins / locations (WMS): physical bin codes per branch and the quantity
 * of each variant stored in them. Bin-code validation is pure + unit-tested.
 */

/** Validates a bin code like "A-01-3" (aisle-rack-level). Pure. */
export function validateBinCode(code: string): boolean {
  return /^[A-Z]{1,3}-\d{1,3}-\d{1,3}$/.test(code.trim().toUpperCase());
}

export async function createBin(input: {
  branchId: string;
  code: string;
  label?: string;
}) {
  const code = input.code.trim().toUpperCase();
  if (!input.branchId) throw new Error("יש לבחור סניף.");
  if (!validateBinCode(code)) {
    throw new Error("קוד מיקום לא תקין (פורמט: A-01-3).");
  }

  const existing = await db.storageBin.findUnique({
    where: { branchId_code: { branchId: input.branchId, code } },
    select: { id: true },
  });
  if (existing) throw new Error("קוד מיקום כבר קיים בסניף זה.");

  return db.storageBin.create({
    data: { branchId: input.branchId, code, label: input.label },
  });
}

export async function setBinActive(input: { binId: string; isActive: boolean }) {
  return db.storageBin.update({
    where: { id: input.binId },
    data: { isActive: input.isActive },
  });
}

/** Assigns (upserts) a quantity of a variant (by SKU) into a bin. */
export async function assignVariantToBin(input: {
  binId: string;
  sku: string;
  quantity: number;
}) {
  const variant = await db.productVariant.findUnique({
    where: { sku: input.sku.trim() },
    select: { id: true },
  });
  if (!variant) throw new Error("לא נמצא וריאנט עם מק\"ט זה.");

  const quantity = Math.max(0, Math.trunc(input.quantity));
  return db.binAssignment.upsert({
    where: { binId_variantId: { binId: input.binId, variantId: variant.id } },
    create: { binId: input.binId, variantId: variant.id, quantity },
    update: { quantity },
  });
}

async function branchNameMap(branchIds: string[]) {
  const branches = await db.branch.findMany({
    where: { id: { in: branchIds } },
    select: { id: true, name: true },
  });
  return new Map(branches.map((branch) => [branch.id, branch.name]));
}

export async function listBins(limit = 50) {
  const bins = await db.storageBin.findMany({
    orderBy: [{ branchId: "asc" }, { code: "asc" }],
    take: limit,
    select: {
      id: true,
      code: true,
      label: true,
      isActive: true,
      branchId: true,
      _count: { select: { assignments: true } },
    },
  });
  const names = await branchNameMap(bins.map((bin) => bin.branchId));
  return bins.map((bin) => ({
    id: bin.id,
    code: bin.code,
    label: bin.label,
    isActive: bin.isActive,
    branchName: names.get(bin.branchId) ?? "—",
    assignmentCount: bin._count.assignments,
  }));
}

export async function listBinAssignments(limit = 40) {
  const assignments = await db.binAssignment.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      quantity: true,
      variantId: true,
      bin: { select: { code: true, branchId: true } },
    },
  });

  const [variants, names] = await Promise.all([
    db.productVariant.findMany({
      where: { id: { in: assignments.map((a) => a.variantId) } },
      select: { id: true, sku: true, name: true },
    }),
    branchNameMap(assignments.map((a) => a.bin.branchId)),
  ]);
  const variantById = new Map(variants.map((v) => [v.id, v]));

  return assignments.map((assignment) => {
    const variant = variantById.get(assignment.variantId);
    return {
      id: assignment.id,
      quantity: assignment.quantity,
      binCode: assignment.bin.code,
      branchName: names.get(assignment.bin.branchId) ?? "—",
      sku: variant?.sku ?? "—",
      variantName: variant?.name ?? "—",
    };
  });
}

export async function getBinsSummary() {
  const [bins, active, assignments] = await Promise.all([
    db.storageBin.count(),
    db.storageBin.count({ where: { isActive: true } }),
    db.binAssignment.count(),
  ]);
  return { bins, active, assignments };
}
