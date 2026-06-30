import { db } from "~/server/db";
import {
  consolidateTrialBalances,
  summarizeIntercompany,
  type EntityTrialBalance,
} from "~/server/services/consolidation";

/**
 * Multi-entity service (ENT, §4.AD). Manages legal entities, intercompany
 * transactions, and builds per-entity trial balances from the shared GL (journal
 * entries are attributed to an entity via JournalEntry.entityId; unattributed
 * history rolls up to the base entity). Consolidation maths lives in the pure
 * consolidation.ts engine.
 */

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Guards against an intercompany transaction with one entity on both sides. Pure. */
export function assertDistinctEntities(fromId: string, toId: string): void {
  if (!fromId || !toId) throw new Error("יש לבחור שתי ישויות.");
  if (fromId === toId) {
    throw new Error("עסקה בין-חברתית מחייבת שתי ישויות שונות.");
  }
}

/** Creates a legal entity; promoting one to base demotes the others. */
export async function createEntity(input: {
  code: string;
  name: string;
  functionalCurrency?: string;
  fxRateToBase?: number;
  isBase?: boolean;
  parentId?: string;
}) {
  const code = input.code.trim();
  const name = input.name.trim();
  if (!code || !name) throw new Error("קוד ושם הם שדות חובה.");

  const fxRateToBase = input.fxRateToBase ?? 1;
  if (!(fxRateToBase > 0)) throw new Error("שער חליפין חייב להיות חיובי.");

  return db.$transaction(async (tx) => {
    if (input.isBase) {
      await tx.legalEntity.updateMany({ data: { isBase: false } });
    }
    return tx.legalEntity.create({
      data: {
        code,
        name,
        functionalCurrency: (input.functionalCurrency ?? "ILS").trim() || "ILS",
        fxRateToBase,
        isBase: input.isBase ?? false,
        parentId: input.parentId,
      },
    });
  });
}

export async function setEntityActive(input: {
  entityId: string;
  isActive: boolean;
}) {
  return db.legalEntity.update({
    where: { id: input.entityId },
    data: { isActive: input.isActive },
  });
}

/** Updates an entity's FX rate to the base currency (used in consolidation). */
export async function setEntityFxRate(input: {
  entityId: string;
  fxRateToBase: number;
}) {
  if (!(input.fxRateToBase > 0)) throw new Error("שער חליפין חייב להיות חיובי.");
  return db.legalEntity.update({
    where: { id: input.entityId },
    data: { fxRateToBase: input.fxRateToBase },
  });
}

async function nextIntercompanyNumber() {
  const prefix = `IC-${new Date().getUTCFullYear()}`;
  const count = await db.intercompanyTransaction.count({
    where: { transactionNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

export async function createIntercompanyTransaction(input: {
  fromEntityId: string;
  toEntityId: string;
  amount: number;
  currency?: string;
  description?: string;
  occurredAt?: Date;
}) {
  assertDistinctEntities(input.fromEntityId, input.toEntityId);
  const amount = round2(input.amount);
  if (!(amount > 0)) throw new Error("סכום העסקה חייב להיות חיובי.");

  return db.intercompanyTransaction.create({
    data: {
      transactionNumber: await nextIntercompanyNumber(),
      fromEntityId: input.fromEntityId,
      toEntityId: input.toEntityId,
      amount,
      currency: (input.currency ?? "ILS").trim() || "ILS",
      description: input.description,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

export async function eliminateIntercompanyTransaction(input: {
  transactionId: string;
}) {
  return db.intercompanyTransaction.update({
    where: { id: input.transactionId },
    data: { status: "ELIMINATED" },
  });
}

export async function listEntities() {
  const entities = await db.legalEntity.findMany({
    orderBy: [{ isBase: "desc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      functionalCurrency: true,
      fxRateToBase: true,
      isBase: true,
      isActive: true,
      _count: { select: { journalEntries: true } },
    },
  });

  return entities.map((entity) => ({
    id: entity.id,
    code: entity.code,
    name: entity.name,
    currency: entity.functionalCurrency,
    fxRateToBase: Number(entity.fxRateToBase),
    isBase: entity.isBase,
    isActive: entity.isActive,
    journalEntryCount: entity._count.journalEntries,
  }));
}

export async function listIntercompany(limit = 20) {
  const transactions = await db.intercompanyTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      transactionNumber: true,
      amount: true,
      currency: true,
      status: true,
      description: true,
      fromEntity: { select: { code: true } },
      toEntity: { select: { code: true } },
    },
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    transactionNumber: transaction.transactionNumber,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    status: transaction.status,
    description: transaction.description,
    from: transaction.fromEntity.code,
    to: transaction.toEntity.code,
  }));
}

/**
 * Builds each active entity's trial balance from the GL. Journal entries with no
 * entityId (all historic single-company activity) roll up to the base entity.
 */
export async function getPerEntityTrialBalances(): Promise<EntityTrialBalance[]> {
  const entities = await db.legalEntity.findMany({ where: { isActive: true } });
  if (entities.length === 0) return [];
  const baseEntity = entities.find((entity) => entity.isBase) ?? entities[0]!;

  const [accounts, lines] = await Promise.all([
    db.ledgerAccount.findMany({
      select: { id: true, code: true, name: true, type: true, normalSide: true },
    }),
    db.journalLine.findMany({
      where: { journalEntry: { status: "POSTED" } },
      select: {
        accountId: true,
        debit: true,
        credit: true,
        journalEntry: { select: { entityId: true } },
      },
    }),
  ]);
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  const buckets = new Map<string, Map<string, { debit: number; credit: number }>>();
  for (const entity of entities) buckets.set(entity.id, new Map());

  for (const line of lines) {
    const rawEntityId = line.journalEntry.entityId;
    const entityId =
      rawEntityId && buckets.has(rawEntityId) ? rawEntityId : baseEntity.id;
    const accountMap = buckets.get(entityId)!;
    const current = accountMap.get(line.accountId) ?? { debit: 0, credit: 0 };
    current.debit += Number(line.debit);
    current.credit += Number(line.credit);
    accountMap.set(line.accountId, current);
  }

  return entities.map((entity) => ({
    entityId: entity.id,
    entityCode: entity.code,
    entityName: entity.name,
    currency: entity.functionalCurrency,
    fxRate: Number(entity.fxRateToBase),
    rows: [...buckets.get(entity.id)!.entries()].map(([accountId, sums]) => {
      const account = accountById.get(accountId);
      return {
        accountCode: account?.code ?? "?",
        accountName: account?.name ?? "Unknown",
        accountType: account?.type ?? "?",
        normalSide: account?.normalSide ?? "DEBIT",
        debit: round2(sums.debit),
        credit: round2(sums.credit),
      };
    }),
  }));
}

/** Consolidated trial balance (base currency) + intercompany summary. */
export async function getConsolidatedReport() {
  const entityTBs = await getPerEntityTrialBalances();
  const consolidated = consolidateTrialBalances(entityTBs);

  const transactions = await db.intercompanyTransaction.findMany({
    select: { status: true, amount: true },
  });
  const intercompany = summarizeIntercompany(
    transactions.map((transaction) => ({
      status: transaction.status,
      amount: Number(transaction.amount),
    })),
  );

  return {
    entities: entityTBs.map((tb) => ({
      entityId: tb.entityId,
      entityCode: tb.entityCode,
      entityName: tb.entityName,
      currency: tb.currency,
      fxRate: tb.fxRate,
      lineCount: tb.rows.length,
    })),
    consolidated,
    intercompany,
  };
}

/** The base (reporting) entity's id, or the first active entity, or null. */
export async function getBaseEntityId(): Promise<string | null> {
  const base = await db.legalEntity.findFirst({
    where: { isBase: true, isActive: true },
    select: { id: true },
  });
  if (base) return base.id;
  const fallback = await db.legalEntity.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return fallback?.id ?? null;
}

/**
 * Resolves the legal entity a GL posting belongs to: the source branch's entity
 * if set, otherwise the base entity. Resilient — returns undefined (→ null,
 * i.e. base rollup) rather than throwing if entities aren't configured.
 */
export async function resolvePostingEntityId(
  branchId?: string | null,
): Promise<string | undefined> {
  try {
    if (branchId) {
      const branch = await db.branch.findUnique({
        where: { id: branchId },
        select: { entityId: true },
      });
      if (branch?.entityId) return branch.entityId;
    }
    return (await getBaseEntityId()) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Assigns (or clears) the legal entity that owns a branch's books. */
export async function setBranchEntity(input: {
  branchId: string;
  entityId: string | null;
}) {
  return db.branch.update({
    where: { id: input.branchId },
    data: { entityId: input.entityId },
  });
}

/** Branches with their assigned legal entity, for the assignment UI. */
export async function listBranchEntityAssignments() {
  const branches = await db.branch.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, entityId: true },
  });
  return branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    entityId: branch.entityId,
  }));
}

/** Active entities for posting/selection dropdowns. */
export async function listEntityOptions() {
  const entities = await db.legalEntity.findMany({
    where: { isActive: true },
    orderBy: [{ isBase: "desc" }, { code: "asc" }],
    select: { id: true, code: true, name: true, isBase: true },
  });
  return entities.map((entity) => ({
    id: entity.id,
    code: entity.code,
    name: entity.name,
    isBase: entity.isBase,
  }));
}

export async function getEntitiesSummary() {
  const [total, active, base] = await Promise.all([
    db.legalEntity.count(),
    db.legalEntity.count({ where: { isActive: true } }),
    db.legalEntity.findFirst({ where: { isBase: true }, select: { code: true } }),
  ]);

  const openIntercompany = await db.intercompanyTransaction.count({
    where: { status: "OPEN" },
  });

  return { total, active, baseCode: base?.code ?? null, openIntercompany };
}
