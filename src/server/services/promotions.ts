import { db } from "~/server/db";

/**
 * Automatic cart-level promotions engine (CMS-002). Promotions are condition-
 * gated (min cart total / quantity / date window). Non-stackable promotions
 * compete (best one wins); stackable ones add on top. The evaluator is pure and
 * unit-tested so it can later drive live checkout without behaviour surprises.
 */

export const PROMOTION_TYPES = ["PERCENT", "FIXED", "FREE_SHIPPING", "BOGO"] as const;
export type PromotionType = (typeof PROMOTION_TYPES)[number];

export type PromotionRule = {
  id: string;
  name: string;
  type: string;
  value: number;
  categoryId: string | null;
  buyQuantity: number;
  getQuantity: number;
  minCartTotal: number;
  minQuantity: number;
  priority: number;
  stackable: boolean;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type PromotionCartItem = {
  price: number;
  quantity: number;
  categoryId?: string | null;
};

export type PromotionCart = {
  subtotal: number;
  itemCount: number;
  items?: PromotionCartItem[];
};

/** Subtotal of items in one category. Pure. */
export function categorySubtotal(
  items: PromotionCartItem[],
  categoryId: string,
): number {
  return round2(
    items
      .filter((item) => item.categoryId === categoryId)
      .reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
}

/** BOGO discount: cheapest free units across each buy+get set. Pure. */
export function bogoDiscount(
  items: PromotionCartItem[],
  buyQuantity: number,
  getQuantity: number,
): number {
  if (buyQuantity <= 0 || getQuantity <= 0) return 0;
  const units: number[] = [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i += 1) units.push(item.price);
  }
  units.sort((a, b) => a - b);
  const setSize = buyQuantity + getQuantity;
  const freeUnits = Math.floor(units.length / setSize) * getQuantity;
  return round2(units.slice(0, freeUnits).reduce((sum, price) => sum + price, 0));
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Whether a promotion is active in its date window. Pure. */
export function isPromotionActive(
  promo: Pick<PromotionRule, "isActive" | "startsAt" | "endsAt">,
  now: Date = new Date(),
): boolean {
  if (!promo.isActive) return false;
  if (promo.startsAt && promo.startsAt.getTime() > now.getTime()) return false;
  if (promo.endsAt && promo.endsAt.getTime() <= now.getTime()) return false;
  return true;
}

/** Whether a cart meets a promotion's thresholds. Pure. */
export function meetsConditions(
  promo: Pick<PromotionRule, "minCartTotal" | "minQuantity">,
  cart: PromotionCart,
): boolean {
  return cart.subtotal >= promo.minCartTotal && cart.itemCount >= promo.minQuantity;
}

/** The monetary discount a single promotion yields on a cart. Pure. */
export function promotionDiscount(
  promo: Pick<
    PromotionRule,
    "type" | "value" | "categoryId" | "buyQuantity" | "getQuantity"
  >,
  cart: PromotionCart,
): number {
  const items = cart.items ?? [];

  if (promo.type === "BOGO") {
    const scoped = promo.categoryId
      ? items.filter((item) => item.categoryId === promo.categoryId)
      : items;
    return bogoDiscount(scoped, promo.buyQuantity, promo.getQuantity);
  }

  const base = promo.categoryId
    ? categorySubtotal(items, promo.categoryId)
    : cart.subtotal;

  if (promo.type === "PERCENT") {
    return round2((base * Math.max(0, Math.min(100, promo.value))) / 100);
  }
  if (promo.type === "FIXED") {
    return round2(Math.min(Math.max(0, promo.value), base));
  }
  return 0; // FREE_SHIPPING carries no line discount
}

export type PromotionEvaluation = {
  applied: Array<{ id: string; name: string; discount: number }>;
  totalDiscount: number;
  freeShipping: boolean;
};

/**
 * Evaluates all promotions against a cart. Eligible = active + conditions met.
 * All stackable eligible promos apply; among non-stackable, only the single
 * best-value one applies. Total discount is capped at the subtotal. Pure.
 */
export function evaluatePromotions(input: {
  cart: PromotionCart;
  promotions: PromotionRule[];
  now?: Date;
}): PromotionEvaluation {
  const now = input.now ?? new Date();
  const eligible = input.promotions
    .filter((promo) => isPromotionActive(promo, now) && meetsConditions(promo, input.cart))
    .sort((a, b) => a.priority - b.priority);

  const applied: Array<{ id: string; name: string; discount: number }> = [];
  let freeShipping = false;
  let bestNonStackable: { id: string; name: string; discount: number } | null = null;

  for (const promo of eligible) {
    if (promo.type === "FREE_SHIPPING") freeShipping = true;
    const discount = promotionDiscount(promo, input.cart);
    if (promo.stackable) {
      if (discount > 0 || promo.type === "FREE_SHIPPING") {
        applied.push({ id: promo.id, name: promo.name, discount });
      }
    } else if (
      discount > 0 &&
      (bestNonStackable === null || discount > bestNonStackable.discount)
    ) {
      bestNonStackable = { id: promo.id, name: promo.name, discount };
    }
  }

  if (bestNonStackable) applied.push(bestNonStackable);

  const totalDiscount = round2(
    Math.min(
      input.cart.subtotal,
      applied.reduce((sum, entry) => sum + entry.discount, 0),
    ),
  );

  return { applied, totalDiscount, freeShipping };
}

function normalizeType(value: string | undefined): PromotionType {
  return value && (PROMOTION_TYPES as readonly string[]).includes(value)
    ? (value as PromotionType)
    : "PERCENT";
}

// ---- persistence ----

export async function createPromotion(input: {
  name: string;
  type?: string;
  value?: number;
  categoryId?: string;
  buyQuantity?: number;
  getQuantity?: number;
  minCartTotal?: number;
  minQuantity?: number;
  priority?: number;
  stackable?: boolean;
  startsAt?: Date;
  endsAt?: Date;
}) {
  if (!input.name.trim()) throw new Error("שם המבצע הוא שדה חובה.");
  return db.promotion.create({
    data: {
      name: input.name.trim(),
      type: normalizeType(input.type),
      value: round2(Math.max(0, input.value ?? 0)),
      categoryId: input.categoryId,
      buyQuantity: Math.max(0, Math.trunc(input.buyQuantity ?? 0)),
      getQuantity: Math.max(0, Math.trunc(input.getQuantity ?? 0)),
      minCartTotal: round2(Math.max(0, input.minCartTotal ?? 0)),
      minQuantity: Math.max(0, Math.trunc(input.minQuantity ?? 0)),
      priority: Math.trunc(input.priority ?? 100),
      stackable: input.stackable ?? false,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    },
  });
}

export async function setPromotionActive(input: {
  promotionId: string;
  isActive: boolean;
}) {
  return db.promotion.update({
    where: { id: input.promotionId },
    data: { isActive: input.isActive },
  });
}

export async function deletePromotion(input: { promotionId: string }) {
  return db.promotion.delete({ where: { id: input.promotionId } });
}

function mapPromotion(promo: {
  id: string;
  name: string;
  type: string;
  value: unknown;
  categoryId: string | null;
  buyQuantity: number;
  getQuantity: number;
  minCartTotal: unknown;
  minQuantity: number;
  priority: number;
  stackable: boolean;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}): PromotionRule {
  return {
    id: promo.id,
    name: promo.name,
    type: promo.type,
    value: Number(promo.value),
    categoryId: promo.categoryId,
    buyQuantity: promo.buyQuantity,
    getQuantity: promo.getQuantity,
    minCartTotal: Number(promo.minCartTotal),
    minQuantity: promo.minQuantity,
    priority: promo.priority,
    stackable: promo.stackable,
    isActive: promo.isActive,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
  };
}

export async function listPromotions(limit = 40): Promise<PromotionRule[]> {
  const promos = await db.promotion.findMany({
    orderBy: [{ isActive: "desc" }, { priority: "asc" }],
    take: limit,
  });
  return promos.map(mapPromotion);
}

/** Active promotions only (for the live cart evaluator). */
export async function getActivePromotions(): Promise<PromotionRule[]> {
  const promos = await db.promotion.findMany({ where: { isActive: true } });
  return promos.map(mapPromotion);
}

export async function getPromotionsSummary() {
  const [total, active] = await Promise.all([
    db.promotion.count(),
    db.promotion.count({ where: { isActive: true } }),
  ]);
  return { total, active };
}
