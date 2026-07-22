const shekelPriceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export const HEBREW_COMMERCE_TIME_ZONE = "Asia/Jerusalem";

const hebrewDateFormatter = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeZone: HEBREW_COMMERCE_TIME_ZONE,
});

const hebrewDateTimeFormatter = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: HEBREW_COMMERCE_TIME_ZONE,
});

export function formatPrice(amount: number) {
  return shekelPriceFormatter.format(amount);
}

export function isolateBidiText(value: string | number) {
  return `\u2068${String(value)}\u2069`;
}

export function formatInlinePrice(amount: number) {
  return isolateBidiText(formatPrice(amount));
}

/** Shared PLP result-count phrasing for search and category pages. */
export function formatPlpResultCount(count: number) {
  return count === 1 ? "תוצאה אחת" : `${count} תוצאות`;
}

export function formatHebrewDate(date: Date | string | number) {
  return hebrewDateFormatter.format(new Date(date));
}

export function formatHebrewDateTime(date: Date | string | number) {
  return hebrewDateTimeFormatter.format(new Date(date));
}

export function formatOptionalHebrewDateTime(
  date: Date | string | number | null | undefined,
  fallback = "-",
) {
  return date == null ? fallback : formatHebrewDateTime(date);
}
