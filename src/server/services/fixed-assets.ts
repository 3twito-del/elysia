import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { ACCOUNT, postJournalEntry } from "~/server/services/ledger";

/**
 * Fixed assets and straight-line depreciation (FIN-FA, Phase 5).
 *
 * Acquiring an asset capitalises it (Dr Fixed Assets / Cr Cash, source
 * "asset_acquisition" so it lands in investing cash flow). Running depreciation
 * for a month posts Dr Depreciation Expense / Cr Accumulated Depreciation per
 * active asset, idempotent per period, never charging below the salvage floor.
 * The schedule math is pure and exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Straight-line monthly charge: (cost − salvage) / useful life months. Pure. */
export function monthlyDepreciation(input: {
  acquisitionCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
}): number {
  if (input.usefulLifeMonths <= 0) return 0;
  return round2(
    (input.acquisitionCost - input.salvageValue) / input.usefulLifeMonths,
  );
}

/**
 * The charge for one period, capped so accumulated depreciation never exceeds
 * the depreciable base (handles the final stub period). Pure.
 */
export function depreciationForPeriod(input: {
  acquisitionCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  accumulatedDepreciation: number;
}): number {
  const base = round2(input.acquisitionCost - input.salvageValue);
  const remaining = round2(base - input.accumulatedDepreciation);
  if (remaining <= 0) return 0;

  return Math.min(monthlyDepreciation(input), remaining);
}

/** Net book value and gain/loss for a disposal at the given proceeds. Pure. */
export function disposalResult(input: {
  acquisitionCost: number;
  accumulatedDepreciation: number;
  proceeds: number;
}) {
  const netBookValue = round2(
    input.acquisitionCost - input.accumulatedDepreciation,
  );
  const gainLoss = round2(input.proceeds - netBookValue);

  return { netBookValue, gainLoss };
}

/** Current accounting period as "YYYY-MM" (UTC). */
export function currentPeriod(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function periodEndDate(period: string): Date {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year ?? 2000, month ?? 1, 0));
}

/** Idempotently seeds the fixed-asset chart accounts (self-heal on prod). */
async function ensureFixedAssetAccounts(client: Prisma.TransactionClient) {
  const accounts = [
    { code: ACCOUNT.FIXED_ASSETS, name: "רכוש קבוע", type: "ASSET", normalSide: "DEBIT" },
    {
      code: ACCOUNT.ACCUMULATED_DEPRECIATION,
      name: "פחת נצבר",
      type: "ASSET",
      normalSide: "DEBIT",
    },
    {
      code: ACCOUNT.DEPRECIATION_EXPENSE,
      name: "הוצאות פחת",
      type: "EXPENSE",
      normalSide: "DEBIT",
    },
    {
      code: ACCOUNT.DISPOSAL_GAIN_LOSS,
      name: "רווח/הפסד ממימוש רכוש קבוע",
      type: "REVENUE",
      normalSide: "CREDIT",
    },
  ];

  for (const account of accounts) {
    await client.ledgerAccount.upsert({
      where: { code: account.code },
      create: account,
      update: {},
    });
  }
}

async function nextAssetNumber(client: Prisma.TransactionClient) {
  const count = await client.fixedAsset.count();
  return `FA-${String(count + 1).padStart(5, "0")}`;
}

/** Capitalises a new asset and posts the acquisition entry. */
export async function createFixedAsset(input: {
  name: string;
  category?: string;
  acquisitionCost: number;
  salvageValue?: number;
  usefulLifeMonths: number;
  acquiredAt?: Date;
  branchId?: string;
  notes?: string;
  postedById?: string;
}) {
  const acquisitionCost = round2(input.acquisitionCost);
  if (acquisitionCost <= 0) throw new Error("עלות רכישה חייבת להיות חיובית.");
  if (!Number.isInteger(input.usefulLifeMonths) || input.usefulLifeMonths <= 0) {
    throw new Error("אורך חיים שימושי (בחודשים) חייב להיות מספר שלם חיובי.");
  }

  const acquiredAt = input.acquiredAt ?? new Date();

  return db.$transaction(async (tx) => {
    await ensureFixedAssetAccounts(tx);

    const asset = await tx.fixedAsset.create({
      data: {
        assetNumber: await nextAssetNumber(tx),
        name: input.name,
        category: input.category,
        acquisitionCost,
        salvageValue: round2(input.salvageValue ?? 0),
        usefulLifeMonths: input.usefulLifeMonths,
        acquiredAt,
        branchId: input.branchId,
        notes: input.notes,
      },
    });

    const cashReady = await tx.ledgerAccount.count({
      where: { code: ACCOUNT.CASH },
    });
    if (cashReady > 0) {
      await postJournalEntry(
        {
          entryDate: acquiredAt,
          memo: `רכישת רכוש קבוע ${asset.assetNumber} — ${asset.name}`,
          source: "asset_acquisition",
          aggregateType: "FixedAsset",
          aggregateId: asset.id,
          postedById: input.postedById,
          lines: [
            {
              accountCode: ACCOUNT.FIXED_ASSETS,
              debit: acquisitionCost,
              credit: 0,
              memo: "היוון רכוש קבוע",
            },
            {
              accountCode: ACCOUNT.CASH,
              debit: 0,
              credit: acquisitionCost,
              memo: "תשלום עבור רכוש קבוע",
            },
          ],
        },
        tx,
      );
    }

    return asset;
  });
}

/**
 * Runs depreciation for a period across all active assets (idempotent per
 * asset+period). Returns how many assets were charged and the total amount.
 */
export async function runDepreciation(
  input: { period?: string; postedById?: string } = {},
) {
  const period = input.period ?? currentPeriod();
  const assets = await db.fixedAsset.findMany({ where: { status: "ACTIVE" } });

  let count = 0;
  let total = 0;

  for (const asset of assets) {
    const existing = await db.fixedAssetDepreciation.findUnique({
      where: { fixedAssetId_period: { fixedAssetId: asset.id, period } },
      select: { id: true },
    });
    if (existing) continue;

    const acquisitionCost = Number(asset.acquisitionCost);
    const salvageValue = Number(asset.salvageValue);
    const accumulatedDepreciation = Number(asset.accumulatedDepreciation);

    const amount = depreciationForPeriod({
      acquisitionCost,
      salvageValue,
      usefulLifeMonths: asset.usefulLifeMonths,
      accumulatedDepreciation,
    });

    if (amount <= 0) {
      await db.fixedAsset.update({
        where: { id: asset.id },
        data: { status: "FULLY_DEPRECIATED" },
      });
      continue;
    }

    const base = round2(acquisitionCost - salvageValue);
    const newAccumulated = round2(accumulatedDepreciation + amount);

    await db.$transaction(async (tx) => {
      await ensureFixedAssetAccounts(tx);

      let journalEntryId: string | undefined;
      const ready = await tx.ledgerAccount.count({
        where: {
          code: {
            in: [ACCOUNT.DEPRECIATION_EXPENSE, ACCOUNT.ACCUMULATED_DEPRECIATION],
          },
        },
      });
      if (ready >= 2) {
        const entry = await postJournalEntry(
          {
            entryDate: periodEndDate(period),
            memo: `פחת ${period} — ${asset.assetNumber}`,
            source: "depreciation",
            aggregateType: "FixedAsset",
            aggregateId: asset.id,
            postedById: input.postedById,
            lines: [
              {
                accountCode: ACCOUNT.DEPRECIATION_EXPENSE,
                debit: amount,
                credit: 0,
                memo: "הוצאות פחת",
              },
              {
                accountCode: ACCOUNT.ACCUMULATED_DEPRECIATION,
                debit: 0,
                credit: amount,
                memo: "פחת נצבר",
              },
            ],
          },
          tx,
        );
        journalEntryId = entry.id;
      }

      await tx.fixedAssetDepreciation.create({
        data: { fixedAssetId: asset.id, period, amount, journalEntryId },
      });

      await tx.fixedAsset.update({
        where: { id: asset.id },
        data: {
          accumulatedDepreciation: newAccumulated,
          lastDepreciatedPeriod: period,
          status: newAccumulated >= base - 0.005 ? "FULLY_DEPRECIATED" : "ACTIVE",
        },
      });
    });

    count += 1;
    total = round2(total + amount);
  }

  return { period, count, total };
}

/**
 * Disposes an asset: removes its cost and accumulated depreciation, books the
 * cash proceeds, and recognises the gain/loss on disposal. Posts under source
 * "asset_disposal" (investing cash flow).
 */
export async function disposeFixedAsset(input: {
  fixedAssetId: string;
  proceeds: number;
  postedById?: string;
}) {
  const proceeds = round2(Math.max(0, input.proceeds));

  return db.$transaction(async (tx) => {
    const asset = await tx.fixedAsset.findUnique({
      where: { id: input.fixedAssetId },
    });
    if (!asset) throw new Error("נכס לא נמצא.");
    if (asset.status === "DISPOSED") throw new Error("הנכס כבר נגרע.");

    await ensureFixedAssetAccounts(tx);

    const acquisitionCost = Number(asset.acquisitionCost);
    const accumulatedDepreciation = Number(asset.accumulatedDepreciation);
    const { gainLoss } = disposalResult({
      acquisitionCost,
      accumulatedDepreciation,
      proceeds,
    });

    const lines = [];
    if (proceeds > 0) {
      lines.push({ accountCode: ACCOUNT.CASH, debit: proceeds, credit: 0, memo: "תמורת מימוש" });
    }
    if (accumulatedDepreciation > 0) {
      lines.push({
        accountCode: ACCOUNT.ACCUMULATED_DEPRECIATION,
        debit: accumulatedDepreciation,
        credit: 0,
        memo: "גריעת פחת נצבר",
      });
    }
    lines.push({
      accountCode: ACCOUNT.FIXED_ASSETS,
      debit: 0,
      credit: acquisitionCost,
      memo: "גריעת עלות הנכס",
    });
    if (gainLoss > 0) {
      lines.push({
        accountCode: ACCOUNT.DISPOSAL_GAIN_LOSS,
        debit: 0,
        credit: gainLoss,
        memo: "רווח ממימוש",
      });
    } else if (gainLoss < 0) {
      lines.push({
        accountCode: ACCOUNT.DISPOSAL_GAIN_LOSS,
        debit: -gainLoss,
        credit: 0,
        memo: "הפסד ממימוש",
      });
    }

    const cashReady = await tx.ledgerAccount.count({
      where: { code: ACCOUNT.CASH },
    });
    if (cashReady > 0 && lines.length >= 2) {
      await postJournalEntry(
        {
          entryDate: new Date(),
          memo: `מימוש רכוש קבוע ${asset.assetNumber}`,
          source: "asset_disposal",
          aggregateType: "FixedAsset",
          aggregateId: asset.id,
          postedById: input.postedById,
          lines,
        },
        tx,
      );
    }

    return tx.fixedAsset.update({
      where: { id: asset.id },
      data: { status: "DISPOSED" },
    });
  });
}

/** Register totals: count, cost, accumulated depreciation, net book value. */
export async function getFixedAssetsSummary() {
  const assets = await db.fixedAsset.findMany({
    where: { status: { not: "DISPOSED" } },
    select: { acquisitionCost: true, accumulatedDepreciation: true },
  });

  const totalCost = round2(
    assets.reduce((sum, asset) => sum + Number(asset.acquisitionCost), 0),
  );
  const totalAccumulated = round2(
    assets.reduce((sum, asset) => sum + Number(asset.accumulatedDepreciation), 0),
  );

  return {
    count: assets.length,
    totalCost,
    totalAccumulated,
    netBookValue: round2(totalCost - totalAccumulated),
  };
}

/** Recent assets with net book value for the register table. */
export async function listFixedAssets(limit = 20) {
  const assets = await db.fixedAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      assetNumber: true,
      name: true,
      category: true,
      acquisitionCost: true,
      accumulatedDepreciation: true,
      usefulLifeMonths: true,
      status: true,
    },
  });

  return assets.map((asset) => ({
    id: asset.id,
    assetNumber: asset.assetNumber,
    name: asset.name,
    category: asset.category,
    acquisitionCost: Number(asset.acquisitionCost),
    accumulatedDepreciation: Number(asset.accumulatedDepreciation),
    netBookValue: round2(
      Number(asset.acquisitionCost) - Number(asset.accumulatedDepreciation),
    ),
    usefulLifeMonths: asset.usefulLifeMonths,
    status: asset.status,
  }));
}
