export function getSellableQuantity(input: {
  quantity: number;
  reserved: number;
  safetyStock: number;
}) {
  return Math.max(0, input.quantity - input.reserved - input.safetyStock);
}

export function isInventoryLowStock(input: {
  quantity: number;
  reserved: number;
  safetyStock: number;
}) {
  return getSellableQuantity(input) <= input.safetyStock;
}

export const PUBLIC_LOW_STOCK_MAX_SELLABLE_QUANTITY = 2;

export function isPublicSellableQuantityLowStock(availableQuantity: number) {
  return (
    availableQuantity > 0 &&
    availableQuantity <= PUBLIC_LOW_STOCK_MAX_SELLABLE_QUANTITY
  );
}

export function getInventoryLowStockThresholdCopy(input: {
  safetyStock: number;
}) {
  return `סף בדיקה: זמין קטן או שווה למלאי הביטחון (${input.safetyStock}).`;
}

export function canReserveStock(input: {
  quantity: number;
  reserved: number;
  safetyStock: number;
  requested: number;
}) {
  return getSellableQuantity(input) >= input.requested;
}

export type ItemFulfillmentPlan = {
  reserveNow: number;
  backorder: number;
};

/**
 * OMS-002 (managed backorder): resolves how much of a requested quantity
 * can be reserved from real sellable stock right now vs. how much would
 * have to go on backorder. Returns `null` when the shortfall can't be
 * covered at all -- the product isn't `backorderEnabled` -- so the caller
 * must reject the request, preserving the original all-or-nothing
 * behavior exactly for every product that hasn't opted in.
 */
export function resolveItemFulfillment(input: {
  quantity: number;
  reserved: number;
  safetyStock: number;
  requested: number;
  backorderEnabled: boolean;
}): ItemFulfillmentPlan | null {
  const sellable = getSellableQuantity(input);
  const reserveNow = Math.min(sellable, input.requested);
  const shortfall = input.requested - reserveNow;

  if (shortfall <= 0) return { reserveNow, backorder: 0 };
  if (!input.backorderEnabled) return null;

  return { reserveNow, backorder: shortfall };
}

export function simulateInventoryReservations(input: {
  quantity: number;
  reserved: number;
  safetyStock: number;
  requests: number[];
}) {
  let reserved = input.reserved;

  return input.requests.map((requested, index) => {
    const accepted = canReserveStock({
      quantity: input.quantity,
      reserved,
      safetyStock: input.safetyStock,
      requested,
    });
    const beforeReserved = reserved;

    if (accepted) {
      reserved += requested;
    }

    return {
      accepted,
      beforeReserved,
      index,
      requested,
      reservedAfter: reserved,
      sellableAfter: getSellableQuantity({
        quantity: input.quantity,
        reserved,
        safetyStock: input.safetyStock,
      }),
    };
  });
}
