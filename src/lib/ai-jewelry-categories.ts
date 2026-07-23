export const PUBLIC_AI_JEWELRY_CATEGORIES = [
  {
    value: "rings",
    label: "טבעות",
    terms: ["rings", "ring", "טבעות", "טבעת", "אירוסין"],
  },
  {
    value: "earrings",
    label: "עגילים",
    terms: ["earrings", "earring", "עגילים", "עגיל"],
  },
  {
    value: "necklaces",
    label: "שרשראות",
    terms: ["necklaces", "necklace", "chain", "שרשראות", "שרשרת", "תליון"],
  },
  {
    value: "bracelets",
    label: "צמידים",
    terms: ["bracelets", "bracelet", "צמידים", "צמיד"],
  },
] as const satisfies readonly {
  value: string;
  label: string;
  terms: readonly string[];
}[];

export type PublicAiJewelryCategory =
  (typeof PUBLIC_AI_JEWELRY_CATEGORIES)[number]["value"];

export const PUBLIC_AI_JEWELRY_CATEGORY_VALUES =
  PUBLIC_AI_JEWELRY_CATEGORIES.map(({ value }) => value) as [
    PublicAiJewelryCategory,
    ...PublicAiJewelryCategory[],
  ];

export function detectPublicAiJewelryCategories(query: string) {
  return PUBLIC_AI_JEWELRY_CATEGORIES.filter(({ terms }) =>
    terms.some((term) => queryIncludesCategoryTerm(query, term)),
  ).map(({ value }) => value);
}

export function isPublicAiJewelryCategory(
  value: string,
): value is PublicAiJewelryCategory {
  return PUBLIC_AI_JEWELRY_CATEGORY_VALUES.some(
    (category) => category === value,
  );
}

function queryIncludesCategoryTerm(query: string, term: string) {
  const normalizedQuery = query.toLowerCase();
  const normalizedTerm = term.toLowerCase();

  if (/^[a-z]+$/u.test(normalizedTerm)) {
    return new RegExp(`\\b${escapeRegex(normalizedTerm)}\\b`, "u").test(
      normalizedQuery,
    );
  }

  return normalizedQuery.includes(normalizedTerm);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
