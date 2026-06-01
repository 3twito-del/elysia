import { resolveAiCatalogSearchIntent } from "~/lib/ai-catalog-intent";
import { formatInlinePrice } from "~/lib/format";

export type SearchMode = "semantic" | "classic";

export type SemanticSearchConfidence = "high" | "medium" | "low";

export type SemanticSearchIntent = {
  originalQuery?: string;
  semanticQuery?: string;
  lexicalQuery?: string;
  hardFilters: {
    category?: string;
    material?: string;
    stone?: string;
    maxPrice?: number;
  };
  softSignals: string[];
  excludedTerms: string[];
  occasion?: string;
  recipient?: string;
  confidence: SemanticSearchConfidence;
  source: "deterministic" | "ai";
};

export type SemanticSearchIntentInput = {
  query?: string;
  category?: string;
  material?: string;
  stone?: string;
  maxPrice?: number;
};

export type SemanticSearchIntentOptions = {
  categories?: Array<{ slug: string; name: string }>;
  facets?: {
    materials: string[];
    stones: string[];
    collections?: string[];
  };
};

export type SemanticSearchProductForReason = {
  categoryName?: string;
  categorySlug?: string;
  collection?: string;
  description?: string;
  material?: string;
  name: string;
  price?: number;
  shortDescription?: string;
  stone?: string;
  tags?: string[];
};

const defaultCategoryAliases = [
  {
    slug: "rings",
    terms: ["rings", "ring", "טבעות", "טבעת", "אירוסין"],
  },
  {
    slug: "necklaces",
    terms: ["necklaces", "necklace", "chain", "שרשראות", "שרשרת", "תליון"],
  },
  {
    slug: "earrings",
    terms: ["earrings", "earring", "עגילים", "עגיל"],
  },
  {
    slug: "bracelets",
    terms: ["bracelets", "bracelet", "צמידים", "צמיד"],
  },
] as const;

const semanticStopWords = [
  "אני",
  "רוצה",
  "צריך",
  "צריכה",
  "מחפש",
  "מחפשת",
  "אפשר",
  "עם",
  "של",
  "על",
  "עד",
  "שח",
  "שח״",
  "ש״ח",
  "ils",
  "gift",
  "present",
  "מתנה",
  "למתנה",
];

const softSignalRules = [
  {
    signal: "gift",
    terms: ["מתנה", "למתנה", "gift", "present"],
  },
  {
    signal: "bridal",
    terms: ["כלה", "לכלה", "חתונה", "bridal", "bride", "wedding"],
  },
  {
    signal: "daily",
    terms: ["יומי", "יומיומי", "יום יום", "everyday", "daily"],
  },
  {
    signal: "delicate",
    terms: ["עדין", "עדינה", "עדינים", "קלים", "קלות", "light", "delicate"],
  },
  {
    signal: "minimal",
    terms: ["מינימל", "נקי", "minimal", "clean"],
  },
  {
    signal: "evening",
    terms: ["ערב", "מאופק", "חגיגי", "evening", "luxury", "dressy"],
  },
  {
    signal: "mother",
    terms: ["אמא", "לאמא", "אמא שלי", "mother", "mom"],
  },
] as const;

const occasionRules = [
  { value: "חתונה", terms: ["חתונה", "כלה", "wedding", "bridal"] },
  { value: "יום יום", terms: ["יומי", "יומיומי", "everyday", "daily"] },
  { value: "ערב", terms: ["ערב", "evening"] },
] as const;

const recipientRules = [
  { value: "אמא", terms: ["אמא", "לאמא", "mother", "mom"] },
  { value: "כלה", terms: ["כלה", "לכלה", "bride"] },
  { value: "בת זוג", terms: ["בת זוג", "לאשתי", "wife", "partner"] },
] as const;

export function resolveDeterministicSemanticSearchIntent(
  input: SemanticSearchIntentInput,
  options: SemanticSearchIntentOptions = {},
): SemanticSearchIntent {
  const originalQuery = trimToUndefined(input.query);
  const aiIntent = resolveAiCatalogSearchIntent({
    category: input.category,
    material: input.material,
    maxPrice: input.maxPrice,
    query: originalQuery,
    stone: input.stone,
  });
  const excludedTerms = detectExcludedTerms(originalQuery, options);
  const hardFilters = {
    category:
      input.category ??
      aiIntent.category ??
      detectCategory(originalQuery, options.categories),
    material:
      input.material ??
      detectAllowedValue(
        originalQuery,
        options.facets?.materials,
        excludedTerms,
      ),
    stone:
      input.stone ??
      detectAllowedValue(originalQuery, options.facets?.stones, excludedTerms),
    maxPrice: input.maxPrice ?? aiIntent.maxPrice,
  };
  const softSignals = detectSoftSignals(originalQuery);
  const semanticQuery = buildSemanticQuery(originalQuery, {
    excludedTerms,
    maxPrice: hardFilters.maxPrice,
  });
  const lexicalQuery = buildLexicalQuery(semanticQuery, {
    categories: options.categories,
    facets: options.facets,
  });

  return {
    originalQuery,
    semanticQuery,
    lexicalQuery,
    hardFilters,
    softSignals,
    excludedTerms,
    occasion: detectFirstRuleValue(originalQuery, occasionRules),
    recipient: detectFirstRuleValue(originalQuery, recipientRules),
    confidence: getIntentConfidence({
      hardFilters,
      originalQuery,
      softSignals,
    }),
    source: "deterministic",
  };
}

export function mergeSemanticSearchIntent(
  base: SemanticSearchIntent,
  override: Partial<SemanticSearchIntent>,
  options: SemanticSearchIntentOptions = {},
): SemanticSearchIntent {
  return {
    ...base,
    ...override,
    hardFilters: {
      ...base.hardFilters,
      ...sanitizeHardFilters(override.hardFilters, options),
    },
    softSignals: uniqueStrings([
      ...base.softSignals,
      ...(override.softSignals ?? []),
    ]),
    excludedTerms: uniqueStrings([
      ...base.excludedTerms,
      ...(override.excludedTerms ?? []),
    ]),
    source: override.source ?? base.source,
  };
}

export function createSemanticMatchReason(
  product: SemanticSearchProductForReason,
  intent: SemanticSearchIntent,
) {
  const reasons: string[] = [];

  if (
    intent.hardFilters.category &&
    product.categorySlug === intent.hardFilters.category
  ) {
    reasons.push("סוג התכשיט תואם לחיפוש");
  }

  if (
    intent.hardFilters.material &&
    product.material === intent.hardFilters.material
  ) {
    reasons.push(`חומר מתאים: ${product.material.replace(" 14K", "")}`);
  }

  if (intent.hardFilters.stone && product.stone === intent.hardFilters.stone) {
    reasons.push(`אבן מתאימה: ${product.stone}`);
  }

  if (
    typeof intent.hardFilters.maxPrice === "number" &&
    typeof product.price === "number" &&
    product.price <= intent.hardFilters.maxPrice
  ) {
    reasons.push(`במחיר עד ${formatInlinePrice(intent.hardFilters.maxPrice)}`);
  }

  if (intent.softSignals.includes("bridal")) {
    reasons.push("מתאים למראה כלה או אירוע");
  } else if (intent.softSignals.includes("daily")) {
    reasons.push("מתאים לענידה יומיומית");
  } else if (intent.softSignals.includes("delicate")) {
    reasons.push("מראה עדין וקליל");
  } else if (intent.softSignals.includes("gift")) {
    reasons.push("בחירה טובה למתנה");
  }

  return reasons.length > 0
    ? reasons.slice(0, 2).join(" · ")
    : "התאמה עדינה מן הקולקציה";
}

export function productMatchesSemanticExclusions(
  product: SemanticSearchProductForReason,
  excludedTerms: string[],
) {
  if (excludedTerms.length === 0) return true;

  const searchable = normalizeText(
    [
      product.name,
      product.shortDescription,
      product.description,
      product.material,
      product.stone,
      product.collection,
      product.categoryName,
      ...(product.tags ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );

  return excludedTerms.every(
    (term) => !searchable.includes(normalizeText(term)),
  );
}

export function normalizeSemanticText(value?: string) {
  return normalizeText(value);
}

function detectCategory(
  query: string | undefined,
  categories: SemanticSearchIntentOptions["categories"],
) {
  const normalized = normalizeText(query);
  if (!normalized) return undefined;

  const aliases = categories?.length
    ? categories.map((category) => ({
        slug: category.slug,
        terms: [category.slug, category.name],
      }))
    : defaultCategoryAliases;

  return aliases.find(({ terms }) =>
    terms.some((term) => normalized.includes(normalizeText(term))),
  )?.slug;
}

function detectAllowedValue(
  query?: string,
  allowedValues: string[] = [],
  excludedValues: string[] = [],
) {
  const normalized = normalizeText(query);
  if (!normalized) return undefined;
  const normalizedExcludedValues = new Set(excludedValues.map(normalizeText));

  return allowedValues.find((value) => {
    const normalizedValue = normalizeText(value);

    return (
      !normalizedExcludedValues.has(normalizedValue) &&
      normalized.includes(normalizedValue)
    );
  });
}

function detectExcludedTerms(
  query: string | undefined,
  options: SemanticSearchIntentOptions,
) {
  const normalized = normalizeText(query);
  if (!normalized) return [];

  const knownValues = [
    ...(options.facets?.stones ?? []),
    ...(options.facets?.materials ?? []),
    ...(options.categories?.map((category) => category.name) ?? []),
    ...defaultCategoryAliases.flatMap((category) => category.terms),
  ];
  const excluded = knownValues.filter((value) => {
    const term = normalizeText(value);

    return [
      `בלי ${term}`,
      `ללא ${term}`,
      `לא ${term}`,
      `without ${term}`,
      `no ${term}`,
    ].some((pattern) => normalized.includes(pattern));
  });

  return uniqueStrings(excluded);
}

function detectSoftSignals(query?: string) {
  const normalized = normalizeText(query);
  if (!normalized) return [];

  return softSignalRules
    .filter((rule) =>
      rule.terms.some((term) => normalized.includes(normalizeText(term))),
    )
    .map((rule) => rule.signal);
}

function detectFirstRuleValue<
  T extends readonly { value: string; terms: readonly string[] }[],
>(query: string | undefined, rules: T) {
  const normalized = normalizeText(query);
  if (!normalized) return undefined;

  return rules.find((rule) =>
    rule.terms.some((term) => normalized.includes(normalizeText(term))),
  )?.value;
}

function buildSemanticQuery(
  query: string | undefined,
  input: {
    excludedTerms: string[];
    maxPrice?: number;
  },
) {
  const cleaned = stripBudgetPhrase(query, input.maxPrice);
  const withoutExclusions = input.excludedTerms.reduce((value, term) => {
    const escaped = escapeRegExp(term);

    return value.replace(
      new RegExp(`(?:בלי|ללא|לא|without|no)\\s+${escaped}`, "giu"),
      " ",
    );
  }, cleaned);

  return trimToUndefined(withoutExclusions.replace(/\s+/g, " "));
}

function buildLexicalQuery(
  query: string | undefined,
  options: SemanticSearchIntentOptions,
) {
  const normalized = normalizeText(query);
  if (!normalized) return undefined;

  const knownValues = [
    ...(options.categories?.map((category) => category.name) ?? []),
    ...(options.categories?.map((category) => category.slug) ?? []),
    ...(options.facets?.materials ?? []),
    ...(options.facets?.stones ?? []),
  ].map(normalizeText);
  const tokens = normalized
    .split(/\s+/)
    .filter((token) => token.length > 1)
    .filter((token) => !semanticStopWords.includes(token))
    .filter((token) => !knownValues.some((value) => value.includes(token)));

  return trimToUndefined(uniqueStrings(tokens).join(" "));
}

function stripBudgetPhrase(query?: string, maxPrice?: number) {
  if (!query) return "";

  const stripped = query
    .replace(
      /(?:\u05e2\u05d3|\u05ea\u05e7\u05e6\u05d9\u05d1|\u05de\u05e7\u05e1\u05d9\u05de\u05d5\u05dd|max|under|below)\s*\d{2,7}/gi,
      " ",
    )
    .replace(/\d{2,7}\s*(?:\u05e9["'\u05f3\u05f4]?\u05d7|\u20aa|ils)/gi, " ");

  if (!maxPrice) return stripped.trim();

  return stripped.replace(String(maxPrice), " ").trim();
}

function sanitizeHardFilters(
  hardFilters: SemanticSearchIntent["hardFilters"] | undefined,
  options: SemanticSearchIntentOptions,
) {
  if (!hardFilters) return {};

  return {
    category:
      hardFilters.category &&
      (!options.categories?.length ||
        options.categories.some(
          (category) => category.slug === hardFilters.category,
        ))
        ? hardFilters.category
        : undefined,
    material:
      hardFilters.material &&
      (!options.facets?.materials.length ||
        options.facets.materials.includes(hardFilters.material))
        ? hardFilters.material
        : undefined,
    stone:
      hardFilters.stone &&
      (!options.facets?.stones.length ||
        options.facets.stones.includes(hardFilters.stone))
        ? hardFilters.stone
        : undefined,
    maxPrice: hardFilters.maxPrice,
  };
}

function getIntentConfidence(input: {
  hardFilters: SemanticSearchIntent["hardFilters"];
  originalQuery?: string;
  softSignals: string[];
}): SemanticSearchConfidence {
  if (!input.originalQuery) return "low";
  if (
    input.hardFilters.category ||
    input.hardFilters.material ||
    input.hardFilters.stone ||
    input.hardFilters.maxPrice ||
    input.softSignals.length > 0
  ) {
    return "high";
  }

  return input.originalQuery.split(/\s+/).length > 1 ? "medium" : "low";
}

function trimToUndefined(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) return undefined;

  return trimmed;
}

function normalizeText(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[\u0591-\u05c7]/g, "")
    .replace(/[״׳´"']/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
