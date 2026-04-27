export function getSellableQuantity(input: {
  quantity: number;
  reserved: number;
  safetyStock: number;
}) {
  return Math.max(0, input.quantity - input.reserved - input.safetyStock);
}

export function canReserveStock(input: {
  quantity: number;
  reserved: number;
  safetyStock: number;
  requested: number;
}) {
  return getSellableQuantity(input) >= input.requested;
}
