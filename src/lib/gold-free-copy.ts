const GOLD_FREE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/זהב\s+צהוב/gi, "מתכת בהירה"],
  [/זהב\s+לבן/gi, "מתכת בהירה"],
  [/זהב\s+ורוד/gi, "מתכת ורודה"],
  [/זהב/gi, "מתכת"],
  [/yellow\s+gold/gi, "polished metal"],
  [/white\s+gold/gi, "bright metal"],
  [/rose\s+gold/gi, "rose metal"],
  [/golden/gi, "metallic"],
  [/gold/gi, "metal"],
];

export function removeGoldLanguage(value: string): string;
export function removeGoldLanguage(
  value: string | undefined,
): string | undefined;
export function removeGoldLanguage(value: string | null): string | null;
export function removeGoldLanguage(value: undefined): undefined;
export function removeGoldLanguage(value: null): null;
export function removeGoldLanguage(
  value: string | null | undefined,
): string | null | undefined {
  if (value == null) return value;

  return GOLD_FREE_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}
