import { db } from "~/server/db";

/**
 * Master Data Management (MDM): duplicate customer detection ("golden record").
 * Detection-only and read-only — it surfaces likely-duplicate pairs for manual
 * review; it never merges destructively. The normalisation + scoring are pure.
 */

export type MdmCustomer = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
};

/** Lowercased, trimmed email (empty → null). Pure. */
export function normalizeEmail(email: string | null): string | null {
  const value = (email ?? "").trim().toLowerCase();
  return value || null;
}

/** Digits-only phone, last 9 (IL local) for comparison (empty → null). Pure. */
export function normalizePhone(phone: string | null): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits.slice(-9) : null;
}

function nameTokens(customer: MdmCustomer): string[] {
  return `${customer.firstName ?? ""} ${customer.lastName ?? ""}`
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

/** Token-Jaccard name similarity 0..1. Pure. */
export function nameSimilarity(a: MdmCustomer, b: MdmCustomer): number {
  const setA = new Set(nameTokens(a));
  const setB = new Set(nameTokens(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  const union = new Set([...setA, ...setB]).size;
  return Math.round((intersection / union) * 100) / 100;
}

/** Duplicate confidence for a pair 0..1. Pure. */
export function duplicateScore(a: MdmCustomer, b: MdmCustomer): number {
  const emailA = normalizeEmail(a.email);
  if (emailA && emailA === normalizeEmail(b.email)) return 1;
  const phoneA = normalizePhone(a.phone);
  if (phoneA && phoneA === normalizePhone(b.phone)) return 0.95;
  const nameScore = nameSimilarity(a, b);
  return nameScore >= 1 ? 0.8 : Math.round(nameScore * 0.8 * 100) / 100;
}

export type DuplicatePair = {
  a: MdmCustomer;
  b: MdmCustomer;
  score: number;
  reason: string;
};

/** Finds likely-duplicate pairs above a threshold. Pure (O(n²), cap the input). */
export function findDuplicateCandidates(
  customers: MdmCustomer[],
  threshold = 0.8,
): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < customers.length; i += 1) {
    for (let j = i + 1; j < customers.length; j += 1) {
      const a = customers[i]!;
      const b = customers[j]!;
      const score = duplicateScore(a, b);
      if (score >= threshold) {
        const reason =
          score === 1
            ? "אותו דוא\"ל"
            : score === 0.95
              ? "אותו טלפון"
              : "שם דומה";
        pairs.push({ a, b, score, reason });
      }
    }
  }
  return pairs.sort((x, y) => y.score - x.score);
}

const MDM_SCAN_LIMIT = 2000;

export async function getDuplicateCustomerCandidates(limit = 40) {
  const customers = await db.customer.findMany({
    take: MDM_SCAN_LIMIT,
    select: { id: true, email: true, phone: true, firstName: true, lastName: true },
  });
  return findDuplicateCandidates(customers).slice(0, limit);
}

export async function getMdmSummary() {
  const candidates = await getDuplicateCustomerCandidates(1000);
  const customers = await db.customer.count();
  return { customers, duplicateCandidates: candidates.length };
}
