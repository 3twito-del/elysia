const shekelPriceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return shekelPriceFormatter.format(amount);
}
