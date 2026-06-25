import { db } from "~/server/db";

/**
 * Pricing / discount rules (PRC, CPQ — §4.X).
 *
 * Rules apply at quote time; applyPriceRules picks the rule that yields the
 * lowest line total for a given unit price and quantity. Pure and tested.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type PriceRuleLite = {
  code: string;
  type: string;
  value: number;
  minQuantity: number;
};

/** Applies the best (lowest-total) eligible rule to a line. Pure. */
export function applyPriceRules(input: {
  unitPrice: number;
  quantity: number;
  rules: PriceRuleLite[];
}) {
  const originalTotal = round2(input.unitPrice * input.quantity);

  let bestTotal = originalTotal;
  let bestRuleCode: string | null = null;

  for (const rule of input.rules) {
    if (input.quantity < rule.minQuantity) continue;

    const discount =
      rule.type === "PERCENT"
        ? originalTotal * (rule.value / 100)
        : rule.value;
    const total = round2(Math.max(0, originalTotal - discount));

    if (total < bestTotal) {
      bestTotal = total;
      bestRuleCode = rule.code;
    }
  }

  return {
    originalTotal,
    discountedTotal: bestTotal,
    discount: round2(originalTotal - bestTotal),
    bestRuleCode,
  };
}

/** Creates a price rule. */
export async function createPriceRule(input: {
  code: string;
  name: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minQuantity?: number;
}) {
  if (input.value <= 0) throw new Error("ערך ההנחה חייב להיות חיובי.");

  return db.priceRule.create({
    data: {
      code: input.code,
      name: input.name,
      type: input.type,
      value: input.value,
      minQuantity: Math.max(1, Math.trunc(input.minQuantity ?? 1)),
    },
  });
}

/** Toggles a rule's active flag. */
export async function setPriceRuleActive(input: {
  ruleId: string;
  isActive: boolean;
}) {
  return db.priceRule.update({
    where: { id: input.ruleId },
    data: { isActive: input.isActive },
  });
}

/** Active rules for the rules list and quoting. */
export async function listPriceRules() {
  const rules = await db.priceRule.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      value: true,
      minQuantity: true,
      isActive: true,
    },
  });

  return rules.map((rule) => ({
    id: rule.id,
    code: rule.code,
    name: rule.name,
    type: rule.type,
    value: Number(rule.value),
    minQuantity: rule.minQuantity,
    isActive: rule.isActive,
  }));
}

/** Best price for a unit price + quantity using the active rules. */
export async function quotePrice(input: { unitPrice: number; quantity: number }) {
  const rules = await db.priceRule.findMany({
    where: { isActive: true },
    select: { code: true, type: true, value: true, minQuantity: true },
  });

  return applyPriceRules({
    unitPrice: input.unitPrice,
    quantity: input.quantity,
    rules: rules.map((rule) => ({
      code: rule.code,
      type: rule.type,
      value: Number(rule.value),
      minQuantity: rule.minQuantity,
    })),
  });
}
