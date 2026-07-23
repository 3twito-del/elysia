export const ELYS_AI_STEPS = [
  { id: "jewelry", label: "סוג תכשיט" },
  { id: "occasion", label: "שימוש" },
  { id: "style", label: "סגנון" },
  { id: "budget", label: "תקציב" },
  { id: "size", label: "מידה" },
] as const;

import {
  PUBLIC_AI_JEWELRY_CATEGORIES,
  type PublicAiJewelryCategory,
} from "~/lib/ai-jewelry-categories";

export const JEWELRY_TYPE_OPTIONS = PUBLIC_AI_JEWELRY_CATEGORIES;

export const OCCASION_OPTIONS = [
  { value: "daily", label: "יום־יום" },
  { value: "work", label: "עבודה" },
  { value: "evening", label: "ערב" },
  { value: "special-event", label: "אירוע מיוחד" },
  { value: "no-preference", label: "ללא העדפה" },
] as const;

export const STYLE_OPTIONS = [
  { value: "delicate", label: "עדין" },
  { value: "minimal", label: "מינימליסטי" },
  { value: "classic", label: "קלאסי" },
  { value: "bold", label: "נועז" },
  { value: "romantic", label: "רומנטי" },
  { value: "no-preference", label: "ללא העדפה" },
] as const;

export const SIZE_OPTIONS = [
  { value: "known", label: "יש לי מידה" },
  { value: "needs-help", label: "צריכה עזרה" },
  { value: "not-relevant", label: "לא רלוונטי" },
  { value: "no-preference", label: "ללא העדפה" },
] as const;

export const BUDGET_OPTIONS = [500, 800, 1_200, 2_000] as const;

export type JewelryType = PublicAiJewelryCategory;
export type Occasion = (typeof OCCASION_OPTIONS)[number]["value"];
export type StylePreference = (typeof STYLE_OPTIONS)[number]["value"];
export type SizePreference = (typeof SIZE_OPTIONS)[number]["value"];

export type ConciergePreferences = {
  jewelryTypes: JewelryType[];
  combination: boolean;
  occasion?: Occasion;
  style?: StylePreference;
  budget?: number;
  size?: SizePreference;
  knownSize?: string;
};

export function createEmptyConciergePreferences(): ConciergePreferences {
  return {
    jewelryTypes: [],
    combination: false,
  };
}

export function toggleJewelryType(
  preferences: ConciergePreferences,
  jewelryType: JewelryType,
): ConciergePreferences {
  const isSelected = preferences.jewelryTypes.includes(jewelryType);

  return {
    ...preferences,
    jewelryTypes: isSelected
      ? preferences.jewelryTypes.filter((value) => value !== jewelryType)
      : [...preferences.jewelryTypes, jewelryType],
  };
}

export function buildConciergePrompt(preferences: ConciergePreferences) {
  const parts = [
    preferences.combination
      ? "בני לי שילוב מתכשיטים רגילים זמינים"
      : "עזרי לי לבחור תכשיט",
  ];
  const jewelryLabels = getSelectedLabels(
    JEWELRY_TYPE_OPTIONS,
    preferences.jewelryTypes,
  );

  if (jewelryLabels.length > 0) {
    parts.push(`סוגי תכשיטים: ${formatHebrewList(jewelryLabels)}`);
  }

  appendSelectedLabel(parts, "שימוש", OCCASION_OPTIONS, preferences.occasion);
  appendSelectedLabel(parts, "סגנון", STYLE_OPTIONS, preferences.style);

  if (preferences.budget) {
    parts.push(
      preferences.combination
        ? `תקציב כולל לכל הפריטים: עד ${formatSimplePrice(preferences.budget)}`
        : `תקציב: עד ${formatSimplePrice(preferences.budget)}`,
    );
  }

  if (preferences.size === "known") {
    parts.push(
      preferences.knownSize?.trim()
        ? `מידה ידועה: ${preferences.knownSize.trim()}`
        : "יש לי מידה ואמסור אותה לפי הצורך",
    );
  } else if (preferences.size === "needs-help") {
    parts.push("אני צריכה עזרה בבחירת מידה");
  } else if (preferences.size === "not-relevant") {
    parts.push("מידה אינה רלוונטית לבחירה");
  }

  return `${parts.join(". ")}.`;
}

export function getConciergeSummary(preferences: ConciergePreferences) {
  const rows: Array<{ label: string; value: string }> = [];
  const jewelryLabels = getSelectedLabels(
    JEWELRY_TYPE_OPTIONS,
    preferences.jewelryTypes,
  );

  rows.push({
    label: "תכשיטים",
    value:
      jewelryLabels.length > 0
        ? `${formatHebrewList(jewelryLabels)}${preferences.combination ? " · שילוב" : ""}`
        : preferences.combination
          ? "שילוב לבחירת elys-ai"
          : "ללא העדפה",
  });
  rows.push({
    label: "שימוש",
    value: getOptionLabel(OCCASION_OPTIONS, preferences.occasion),
  });
  rows.push({
    label: "סגנון",
    value: getOptionLabel(STYLE_OPTIONS, preferences.style),
  });
  rows.push({
    label: "תקציב",
    value: preferences.budget
      ? `עד ${formatSimplePrice(preferences.budget)}${preferences.combination ? " לכל השילוב" : ""}`
      : "ללא תקרה",
  });
  rows.push({
    label: "מידה",
    value:
      preferences.size === "known" && preferences.knownSize?.trim()
        ? preferences.knownSize.trim()
        : getOptionLabel(SIZE_OPTIONS, preferences.size),
  });

  return rows;
}

function appendSelectedLabel<
  T extends readonly { value: string; label: string }[],
>(
  parts: string[],
  prefix: string,
  options: T,
  value: T[number]["value"] | undefined,
) {
  if (!value || value === "no-preference") return;
  parts.push(`${prefix}: ${getOptionLabel(options, value)}`);
}

function getSelectedLabels<
  T extends readonly { value: string; label: string }[],
>(options: T, values: readonly string[]) {
  return options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label);
}

function getOptionLabel<T extends readonly { value: string; label: string }[]>(
  options: T,
  value: T[number]["value"] | undefined,
) {
  return options.find((option) => option.value === value)?.label ?? "ללא העדפה";
}

function formatHebrewList(values: string[]) {
  if (values.length < 2) return values[0] ?? "";
  return `${values.slice(0, -1).join(", ")} ו${values.at(-1)}`;
}

function formatSimplePrice(amount: number) {
  return `${amount.toLocaleString("en-US")}\u00a0₪`;
}
