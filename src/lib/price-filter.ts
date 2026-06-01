export function normalizePositivePriceBound(
  value: number | string | null | undefined,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function normalizeAllowedPriceBound(
  value: number | string | null | undefined,
  allowedValues: readonly number[],
) {
  const normalized = normalizePositivePriceBound(value);

  return allowedValues.find((price) => price === normalized);
}
