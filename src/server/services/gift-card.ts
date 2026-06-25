import { randomBytes } from "node:crypto";

import { db } from "~/server/db";
import { DEFAULT_VAT_RATE } from "~/server/services/erp";
import {
  ACCOUNT,
  type JournalLineInput,
  postJournalEntry,
} from "~/server/services/ledger";

/**
 * Gift cards / store credit (WAL, Phase 8).
 *
 * Issuing a card books Dr Cash / Cr Gift Card Liability. Redeeming recognises the
 * sale funded by the card: Dr Gift Card Liability / Cr Revenue / Cr Output VAT
 * (gross is VAT-inclusive). Redemption is capped at the remaining balance. The
 * balance/VAT math is pure and exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** How much of `requested` can be redeemed against `balance`, and the rest. Pure. */
export function applyRedemption(balance: number, requested: number) {
  const applied = round2(Math.min(Math.max(0, balance), Math.max(0, requested)));
  return { applied, newBalance: round2(balance - applied) };
}

/** Splits a VAT-inclusive gross redemption into net + VAT. Pure. */
export function splitRedemptionVat(gross: number, vatRate = DEFAULT_VAT_RATE) {
  const vat = round2(gross - gross / (1 + vatRate));
  return { net: round2(gross - vat), vat };
}

export type GiftCardSummaryInput = { status: string; balance: number };

/** Active card count and total outstanding liability. Pure. */
export function summarizeGiftCards(cards: GiftCardSummaryInput[]) {
  let activeCount = 0;
  let outstandingBalance = 0;

  for (const card of cards) {
    if (card.status === "ACTIVE") {
      activeCount += 1;
      outstandingBalance = round2(outstandingBalance + card.balance);
    }
  }

  return { activeCount, outstandingBalance };
}

function generateCode() {
  return `GC-${randomBytes(5).toString("hex").toUpperCase()}`;
}

/** Issues a gift card and books the cash / liability entry. */
export async function issueGiftCard(input: {
  amount: number;
  customerId?: string;
  issuedById?: string;
}) {
  const amount = round2(input.amount);
  if (amount <= 0) throw new Error("סכום השובר חייב להיות חיובי.");

  return db.$transaction(async (tx) => {
    await tx.ledgerAccount.upsert({
      where: { code: ACCOUNT.GIFT_CARD_LIABILITY },
      create: {
        code: ACCOUNT.GIFT_CARD_LIABILITY,
        name: "התחייבות שוברי מתנה",
        type: "LIABILITY",
        normalSide: "CREDIT",
      },
      update: {},
    });

    const card = await tx.giftCard.create({
      data: {
        code: generateCode(),
        initialBalance: amount,
        balance: amount,
        customerId: input.customerId,
        issuedById: input.issuedById,
        transactions: {
          create: { type: "ISSUE", amount, reason: "הנפקת שובר" },
        },
      },
    });

    const cashReady = await tx.ledgerAccount.count({
      where: { code: ACCOUNT.CASH },
    });
    if (cashReady > 0) {
      await postJournalEntry(
        {
          entryDate: new Date(),
          memo: `הנפקת שובר מתנה ${card.code}`,
          source: "gift_card_issue",
          aggregateType: "GiftCard",
          aggregateId: card.id,
          postedById: input.issuedById,
          lines: [
            { accountCode: ACCOUNT.CASH, debit: amount, credit: 0, memo: "תקבול שובר" },
            {
              accountCode: ACCOUNT.GIFT_CARD_LIABILITY,
              debit: 0,
              credit: amount,
              memo: "התחייבות שובר",
            },
          ],
        },
        tx,
      );
    }

    return card;
  });
}

/** Redeems an amount from a gift card and recognises the funded sale. */
export async function redeemGiftCard(input: {
  code: string;
  amount: number;
  postedById?: string;
}) {
  return db.$transaction(async (tx) => {
    const card = await tx.giftCard.findUnique({ where: { code: input.code } });
    if (!card) throw new Error("שובר לא נמצא.");
    if (card.status !== "ACTIVE") throw new Error("השובר אינו פעיל.");

    const { applied, newBalance } = applyRedemption(
      Number(card.balance),
      input.amount,
    );
    if (applied <= 0) throw new Error("אין יתרה לפדיון.");

    await tx.giftCardTransaction.create({
      data: { giftCardId: card.id, type: "REDEEM", amount: -applied, reason: "פדיון שובר" },
    });
    await tx.giftCard.update({
      where: { id: card.id },
      data: { balance: newBalance, status: newBalance <= 0.005 ? "DEPLETED" : "ACTIVE" },
    });

    const ready = await tx.ledgerAccount.count({
      where: {
        code: { in: [ACCOUNT.GIFT_CARD_LIABILITY, ACCOUNT.SALES_REVENUE] },
      },
    });
    if (ready >= 2) {
      const { net, vat } = splitRedemptionVat(applied);
      const lines: JournalLineInput[] = [
        {
          accountCode: ACCOUNT.GIFT_CARD_LIABILITY,
          debit: applied,
          credit: 0,
          memo: "פדיון שובר",
        },
        {
          accountCode: ACCOUNT.SALES_REVENUE,
          debit: 0,
          credit: net,
          memo: "הכנסה (פדיון שובר)",
        },
      ];
      if (vat > 0) {
        lines.push({
          accountCode: ACCOUNT.VAT_OUTPUT,
          debit: 0,
          credit: vat,
          memo: 'מע"מ עסקאות',
        });
      }

      await postJournalEntry(
        {
          entryDate: new Date(),
          memo: `פדיון שובר ${card.code}`,
          source: "gift_card_redeem",
          aggregateType: "GiftCard",
          aggregateId: card.id,
          postedById: input.postedById,
          lines,
        },
        tx,
      );
    }

    return { applied, newBalance };
  });
}

/** Recent gift cards. */
export async function listGiftCards(limit = 20) {
  const cards = await db.giftCard.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      code: true,
      initialBalance: true,
      balance: true,
      status: true,
    },
  });

  return cards.map((card) => ({
    id: card.id,
    code: card.code,
    initialBalance: Number(card.initialBalance),
    balance: Number(card.balance),
    status: card.status,
  }));
}

/** Gift card liability summary. */
export async function getGiftCardSummary() {
  const cards = await db.giftCard.findMany({
    select: { status: true, balance: true },
  });
  return summarizeGiftCards(
    cards.map((card) => ({ status: card.status, balance: Number(card.balance) })),
  );
}
