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
