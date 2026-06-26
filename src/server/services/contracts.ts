import { db } from "~/server/db";

/**
 * Contract lifecycle management (LGL / CLM, §4.AA).
 *
 * Contracts move DRAFT → ACTIVE → EXPIRED/TERMINATED, with optional value and
 * end date. The expiry test and roll-up are pure and exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

const dayMs = 24 * 60 * 60 * 1000;

/** Whether a contract ends within `withinDays` of `now` (and not past). Pure. */
export function isExpiringSoon(
  endsAt: Date | null,
  now: Date = new Date(),
  withinDays = 30,
): boolean {
  if (!endsAt) return false;
  const diff = endsAt.getTime() - now.getTime();
  return diff >= 0 && diff <= withinDays * dayMs;
}

export type ContractSummaryInput = {
  status: string;
  value: number | null;
  endsAt: Date | null;
};

/** Active count, soon-to-expire count, and total active value. Pure. */
export function summarizeContracts(
  contracts: ContractSummaryInput[],
  now: Date = new Date(),
) {
  let active = 0;
  let expiringSoon = 0;
  let totalActiveValue = 0;

  for (const contract of contracts) {
    if (contract.status !== "ACTIVE") continue;
    active += 1;
    totalActiveValue = round2(totalActiveValue + (contract.value ?? 0));
    if (isExpiringSoon(contract.endsAt, now)) expiringSoon += 1;
  }

  return { active, expiringSoon, totalActiveValue };
}

async function nextContractNumber() {
  const count = await db.contract.count();
  return `CT-${String(count + 1).padStart(5, "0")}`;
}

/** Creates a DRAFT contract. */
export async function createContract(input: {
  title: string;
  counterparty: string;
  type?: string;
  value?: number;
  startsAt?: Date;
  endsAt?: Date;
  autoRenew?: boolean;
  notes?: string;
}) {
  if (!input.title.trim() || !input.counterparty.trim()) {
    throw new Error("כותרת וצד נגדי הם שדות חובה.");
  }

  return db.contract.create({
    data: {
      contractNumber: await nextContractNumber(),
      title: input.title.trim(),
      counterparty: input.counterparty.trim(),
      type: input.type,
      value: input.value != null ? round2(input.value) : null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      autoRenew: input.autoRenew ?? false,
      notes: input.notes,
    },
  });
}

/** Sets a contract's lifecycle status. */
export async function setContractStatus(input: {
  contractId: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";
}) {
  return db.contract.update({
    where: { id: input.contractId },
    data: { status: input.status },
  });
}

/** Recent contracts with an expiring-soon flag. */
export async function listContracts(limit = 30) {
  const now = new Date();
  const contracts = await db.contract.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      contractNumber: true,
      title: true,
      counterparty: true,
      type: true,
      value: true,
      status: true,
      endsAt: true,
    },
  });

  return contracts.map((contract) => ({
    id: contract.id,
    contractNumber: contract.contractNumber,
    title: contract.title,
    counterparty: contract.counterparty,
    type: contract.type,
    value: contract.value != null ? Number(contract.value) : null,
    status: contract.status,
    endsAt: contract.endsAt,
    expiringSoon: isExpiringSoon(contract.endsAt, now),
  }));
}

/** Contract portfolio summary. */
export async function getContractsSummary() {
  const contracts = await db.contract.findMany({
    select: { status: true, value: true, endsAt: true },
  });

  return summarizeContracts(
    contracts.map((contract) => ({
      status: contract.status,
      value: contract.value != null ? Number(contract.value) : null,
      endsAt: contract.endsAt,
    })),
  );
}
