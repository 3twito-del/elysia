import { db } from "~/server/db";

/**
 * Quality management (MFG-004): incoming/produced-batch inspections. The batch
 * passes when its defect rate is at or below the acceptable quality limit (AQL).
 * The maths are pure + unit-tested.
 */

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Defect rate as a percentage of the sample. Pure. */
export function defectRate(defectsFound: number, sampleSize: number): number {
  if (sampleSize <= 0) return 0;
  return round2((Math.max(0, defectsFound) / sampleSize) * 100);
}

/** PASS when defect rate ≤ AQL, else FAIL. Pure. */
export function evaluateInspection(
  defectsFound: number,
  sampleSize: number,
  aqlPercent: number,
): "PASS" | "FAIL" {
  return defectRate(defectsFound, sampleSize) <= Math.max(0, aqlPercent)
    ? "PASS"
    : "FAIL";
}

/** Records an inspection, deriving PASS/FAIL from the defect rate vs AQL. */
export async function createQualityInspection(input: {
  reference: string;
  sku?: string;
  sampleSize: number;
  defectsFound: number;
  aqlPercent?: number;
  inspectorId?: string;
  notes?: string;
}) {
  const reference = input.reference.trim();
  if (!reference) throw new Error("יש להזין אסמכתא לבדיקה.");
  const sampleSize = Math.trunc(input.sampleSize);
  if (sampleSize <= 0) throw new Error("גודל המדגם חייב להיות חיובי.");
  const defectsFound = Math.max(0, Math.trunc(input.defectsFound));
  if (defectsFound > sampleSize) {
    throw new Error("מספר הפגמים גדול מגודל המדגם.");
  }
  const aqlPercent = Math.max(0, input.aqlPercent ?? 1);

  return db.qualityInspection.create({
    data: {
      reference,
      sku: input.sku?.trim() ? input.sku.trim() : null,
      sampleSize,
      defectsFound,
      aqlPercent: round2(aqlPercent),
      result: evaluateInspection(defectsFound, sampleSize, aqlPercent),
      inspectorId: input.inspectorId,
      notes: input.notes,
    },
  });
}

export async function listQualityInspections(limit = 30) {
  const inspections = await db.qualityInspection.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      reference: true,
      sku: true,
      sampleSize: true,
      defectsFound: true,
      aqlPercent: true,
      result: true,
      createdAt: true,
    },
  });
  return inspections.map((inspection) => ({
    id: inspection.id,
    reference: inspection.reference,
    sku: inspection.sku,
    sampleSize: inspection.sampleSize,
    defectsFound: inspection.defectsFound,
    aqlPercent: Number(inspection.aqlPercent),
    defectRate: defectRate(inspection.defectsFound, inspection.sampleSize),
    result: inspection.result,
    createdAt: inspection.createdAt,
  }));
}

export async function getQualitySummary() {
  const [total, passed, failed] = await Promise.all([
    db.qualityInspection.count(),
    db.qualityInspection.count({ where: { result: "PASS" } }),
    db.qualityInspection.count({ where: { result: "FAIL" } }),
  ]);
  return { total, passed, failed };
}
