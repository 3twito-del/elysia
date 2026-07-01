import { db } from "~/server/db";

/**
 * B2B per-SKU price lists (POR-003). A price list holds negotiated per-variant
 * prices; a B2B account can be assigned one. `resolveContractPrice` (pure) is the
 * hook a future checkout uses to price a B2B cart line.
 */

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** The contract price for a variant, or the base price if not listed. Pure. */
export function resolveContractPrice(
  items: Array<{ variantId: string; price: number }>,
  variantId: string,
  basePrice: number,
): number {
  const match = items.find((item) => item.variantId === variantId);
  return match ? round2(match.price) : round2(basePrice);
}

export async function createPriceList(input: { name: string; currency?: string }) {
  if (!input.name.trim()) throw new Error("שם המחירון הוא שדה חובה.");
  return db.priceList.create({
    data: {
      name: input.name.trim(),
      currency: (input.currency ?? "ILS").trim() || "ILS",
    },
  });
}

export async function setPriceListActive(input: {
  priceListId: string;
  isActive: boolean;
}) {
  return db.priceList.update({
    where: { id: input.priceListId },
    data: { isActive: input.isActive },
  });
}

/** Upserts a per-variant price (by SKU) into a price list. */
export async function setPriceListItem(input: {
  priceListId: string;
  sku: string;
  price: number;
}) {
  const variant = await db.productVariant.findUnique({
    where: { sku: input.sku.trim() },
    select: { id: true },
  });
  if (!variant) throw new Error("לא נמצא וריאנט עם מק\"ט זה.");
  const price = round2(Math.max(0, input.price));

  return db.priceListItem.upsert({
    where: {
      priceListId_variantId: {
        priceListId: input.priceListId,
        variantId: variant.id,
      },
    },
    create: { priceListId: input.priceListId, variantId: variant.id, price },
    update: { price },
  });
}

export async function assignPriceListToAccount(input: {
  accountId: string;
  priceListId: string | null;
}) {
  return db.b2bAccount.update({
    where: { id: input.accountId },
    data: { priceListId: input.priceListId },
  });
}

export async function listPriceLists(limit = 30) {
  const lists = await db.priceList.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      currency: true,
      isActive: true,
      _count: { select: { items: true, accounts: true } },
    },
  });
  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    currency: list.currency,
    isActive: list.isActive,
    itemCount: list._count.items,
    accountCount: list._count.accounts,
  }));
}

/** Price-list items with SKU/name (for a chosen list). */
export async function listPriceListItems(priceListId: string, limit = 50) {
  const items = await db.priceListItem.findMany({
    where: { priceListId },
    take: limit,
    select: { id: true, price: true, variantId: true },
  });
  const variants = await db.productVariant.findMany({
    where: { id: { in: items.map((item) => item.variantId) } },
    select: { id: true, sku: true, name: true },
  });
  const variantById = new Map(variants.map((v) => [v.id, v]));
  return items.map((item) => ({
    id: item.id,
    price: Number(item.price),
    sku: variantById.get(item.variantId)?.sku ?? "—",
    variantName: variantById.get(item.variantId)?.name ?? "—",
  }));
}
