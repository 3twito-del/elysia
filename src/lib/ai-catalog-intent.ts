import { formatPrice } from "./format";

export type AiCatalogToolInput = {
  query?: string;
  category?: string;
  material?: string;
  stone?: string;
  maxPrice?: number;
};

export type AiCatalogSearchIntent = {
  originalQuery?: string;
  query?: string;
  category?: string;
  material?: string;
  stone?: string;
  maxPrice?: number;
  categoryLocked: boolean;
  fallbackAllowed: boolean;
};

type ProductForMatchReason = {
  categorySlug?: string;
  category?: string;
  material?: string;
  stone?: string;
  price?: number;
};

const categoryAliases = [
  {
    slug: "earrings",
    terms: ["earrings", "earring", "עגילים", "עגיל"],
  },
  {
    slug: "necklaces",
    terms: ["necklaces", "necklace", "chain", "שרשראות", "שרשרת", "תליון"],
  },
  {
    slug: "rings",
    terms: ["rings", "ring", "טבעות", "טבעת", "אירוסין"],
  },
  {
    slug: "bracelets",
    terms: ["bracelets", "bracelet", "צמידים", "צמיד"],
  },
] as const;

const materialAliases = [
  {
    material: "זהב לבן 14K",
    terms: ["זהב לבן", "white gold", "white-gold"],
  },
  {
    material: "זהב צהוב 14K",
    terms: ["זהב צהוב", "זהב", "yellow gold", "yellow-gold"],
  },
] as const;

const stopWords = [
  "אני",
  "רוצה",
  "צריך",
  "צריכה",
  "מחפש",
  "מחפשת",
  "מנסה",
  "אפשר",
  "אשמח",
  "עם",
  "של",
  "על",
  "לא",
  "בלי",
  "שלא",
  "נראה",
  "נראים",
  "נראות",
  "כבדים",
  "כבד",
  "כבדות",
  "כבדה",
  "תחושה",
  "מתאים",
  "מתאימה",
  "לכלה",
  "כלה",
  "מתנה",
  "עד",
  "שח",
  'ש"ח',
  "₪",
];

export function resolveAiCatalogSearchIntent(
  input: AiCatalogToolInput,
): AiCatalogSearchIntent {
  const originalQuery = trimToUndefined(input.query);
  const category =
    normalizeCategory(input.category) ?? detectCategory(originalQuery);
  const material =
    normalizeMaterial(input.material) ?? detectMaterial(originalQuery);
  const maxPrice = input.maxPrice ?? detectMaxPrice(originalQuery);
  const query = buildFocusedQuery(originalQuery, {
    category,
    material,
    maxPrice,
  });

  return {
    originalQuery,
    query,
    category,
    material,
    stone: trimToUndefined(input.stone),
    maxPrice,
    categoryLocked: Boolean(category),
    fallbackAllowed: !category,
  };
}

export function createCatalogSearchPlan(intent: AiCatalogSearchIntent) {
  const base = {
    category: intent.category,
    material: intent.material,
    maxPrice: intent.maxPrice,
    stone: intent.stone,
  };

  const scoped = compactSearchInput(base);
  const exact = compactSearchInput({ ...base, query: intent.query });
  const original = compactSearchInput({ ...base, query: intent.originalQuery });
  const budgetOnly = compactSearchInput({
    category: intent.category,
    maxPrice: intent.maxPrice,
  });

  const plan = [exact, original, scoped, budgetOnly];

  if (intent.fallbackAllowed) {
    plan.push(
      compactSearchInput({
        material: intent.material,
        maxPrice: intent.maxPrice,
        stone: intent.stone,
      }),
      compactSearchInput({
        maxPrice: intent.maxPrice,
      }),
      {},
    );
  }

  return dedupeSearchPlan(plan);
}

export function createAiMatchReason(
  product: ProductForMatchReason,
  intent: AiCatalogSearchIntent,
) {
  const reasons: string[] = [];
  const productCategory =
    product.categorySlug ?? normalizeCategory(product.category);

  if (intent.category && productCategory === intent.category) {
    reasons.push("סוג התכשיט תואם לבקשה");
  }

  if (intent.material && product.material === intent.material) {
    reasons.push(`החומר מתאים: ${intent.material.replace(" 14K", "")}`);
  }

  if (
    typeof intent.maxPrice === "number" &&
    typeof product.price === "number" &&
    product.price <= intent.maxPrice
  ) {
    reasons.push(`נשאר במחיר עד ${formatBudget(intent.maxPrice)}`);
  }

  if (
    intent.category === "earrings" &&
    mentionsSoftWeight(intent.originalQuery)
  ) {
    reasons.push("מראה עדין שלא מרגיש כבד");
  }

  return reasons.length > 0
    ? reasons.slice(0, 2).join(" · ")
    : "חלופה קרובה מן הקולקציה";
}

function normalizeCategory(value?: string) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;

  return categoryAliases.find(({ slug, terms }) => {
    if (normalized === slug) return true;
    return terms.some((term) => normalized.includes(normalizeText(term)));
  })?.slug;
}

function detectCategory(query?: string) {
  return normalizeCategory(query);
}

function normalizeMaterial(value?: string) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;

  return materialAliases.find(({ material, terms }) => {
    if (normalized === normalizeText(material)) return true;
    return terms.some((term) => normalized.includes(normalizeText(term)));
  })?.material;
}

function detectMaterial(query?: string) {
  return normalizeMaterial(query);
}

function detectMaxPrice(query?: string) {
  const normalized = normalizeText(query);
  if (!normalized) return undefined;

  const budgetPattern =
    /(?:\u05E2\u05D3|\u05EA\u05E7\u05E6\u05D9\u05D1|\u05DE\u05E7\u05E1\u05D9\u05DE\u05D5\u05DD|max|under|below)\s*(\d{2,5})/;
  const currencyPattern = /(\d{2,5})\s*(?:\u05E9\u05D7|₪|ils)/;
  const budgetMatch = budgetPattern.exec(normalized);
  const currencyMatch = currencyPattern.exec(normalized);
  const value = budgetMatch?.[1] ?? currencyMatch?.[1];

  return value ? Number(value) : undefined;
}

function buildFocusedQuery(
  query: string | undefined,
  detected: Pick<AiCatalogSearchIntent, "category" | "material" | "maxPrice">,
) {
  const normalized = normalizeText(query);
  if (!normalized) return undefined;

  const tokens = normalized
    .replace(/\d{2,5}/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !stopWords.includes(token))
    .filter((token) => token.length > 1)
    .filter(
      (token) =>
        !categoryAliases.some((category) =>
          category.terms.some((term) => normalizeText(term).includes(token)),
        ),
    );

  if (detected.material) {
    tokens.push(detected.material.replace(" 14K", ""));
  }

  if (detected.category === "earrings" && mentionsSoftWeight(query)) {
    tokens.push("עדין");
  }

  const focused = Array.from(new Set(tokens)).join(" ").trim();

  return focused || undefined;
}

function compactSearchInput(input: AiCatalogToolInput) {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as AiCatalogToolInput;
}

function dedupeSearchPlan(plan: AiCatalogToolInput[]) {
  const seen = new Set<string>();

  return plan.filter((input) => {
    const key = JSON.stringify(input);
    if (seen.has(key)) return false;
    seen.add(key);

    return Object.keys(input).length > 0 || key === "{}";
  });
}

function mentionsSoftWeight(query?: string) {
  const normalized = normalizeText(query);

  return (
    normalized.includes("כבד") ||
    normalized.includes("כבדים") ||
    normalized.includes("כבדות") ||
    normalized.includes("עדין") ||
    normalized.includes("עדינים") ||
    normalized.includes("קל") ||
    normalized.includes("קלים")
  );
}

function trimToUndefined(value?: string) {
  const trimmed = value?.trim();

  if (trimmed === "") return undefined;

  return trimmed;
}

function normalizeText(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[״"׳']/g, "")
    .replace(/[^\p{L}\p{N}\s₪-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBudget(amount: number) {
  return formatPrice(amount);
}
