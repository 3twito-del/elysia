import {
  resolveAiCatalogSearchIntent,
  type AiCatalogToolInput,
} from "~/lib/ai-catalog-intent";
import { AI_RUN_KIND } from "~/server/ai/constants";

export type AiRunKind = (typeof AI_RUN_KIND)[keyof typeof AI_RUN_KIND];

export type AiPlanningContext = {
  kind: AiRunKind;
  signals: string[];
  shouldUseCatalog: boolean;
  requiresApproval: boolean;
  safetyFlags: string[];
  confidence: "high" | "medium" | "low";
  missingFields: string[];
  clarificationRequired: boolean;
  catalogHints?: AiCatalogToolInput;
};

export type AiPlanningInput =
  | string
  | {
      latestUserText?: string;
      recentUserTexts?: string[];
    };

export function createAiPlanningContext(
  input?: AiPlanningInput,
): AiPlanningContext {
  const planningInput = normalizePlanningInput(input);
  const normalized = normalizePlanningText(planningInput.latestUserText);
  const normalizedContext = normalizePlanningText(
    planningInput.recentUserTexts.join(" "),
  );
  const signals = new Set<string>();
  const safetyFlags: string[] = [];

  if (hasAny(`${normalized} ${normalizedContext}`, promptInjectionTerms)) {
    safetyFlags.push("prompt_injection_attempt");
  }

  const orderSupportIntent =
    hasOrderSupportIntent(normalized) ||
    (hasAny(normalized, orderSupportActionTerms) &&
      hasAny(normalizedContext, orderIdentityTerms));
  const tryOnIntent = hasAny(normalized, tryOnTerms);
  const styleProfileIntent = hasAny(normalized, styleProfileTerms);
  const giftIntent = hasAny(normalized, giftTerms);
  const catalogIntent =
    hasCatalogIntent(normalized) ||
    (hasCatalogIntent(normalizedContext) &&
      hasAny(normalized, catalogFollowUpTerms));
  const catalogHints = createCatalogPlanningHints(planningInput);

  if (orderSupportIntent) signals.add("order_support");
  if (tryOnIntent) signals.add("try_on");
  if (styleProfileIntent) signals.add("style_profile");
  if (giftIntent) signals.add("gift");
  if (catalogIntent) signals.add("catalog");

  if (orderSupportIntent) {
    return createPlanningResult({
      kind: AI_RUN_KIND.orderSupport,
      signals: [...signals],
      shouldUseCatalog: false,
      requiresApproval: false,
      safetyFlags,
      normalized,
      normalizedContext,
    });
  }

  if (tryOnIntent) {
    return createPlanningResult({
      kind: AI_RUN_KIND.tryOn,
      signals: [...signals],
      shouldUseCatalog: true,
      requiresApproval: true,
      safetyFlags,
      catalogHints,
      normalized,
      normalizedContext,
    });
  }

  if (styleProfileIntent) {
    return createPlanningResult({
      kind: AI_RUN_KIND.styleProfile,
      signals: [...signals],
      shouldUseCatalog: true,
      requiresApproval: true,
      safetyFlags,
      catalogHints,
      normalized,
      normalizedContext,
    });
  }

  if (giftIntent) {
    return createPlanningResult({
      kind: AI_RUN_KIND.giftRecommendation,
      signals: [...signals],
      shouldUseCatalog: true,
      requiresApproval: false,
      safetyFlags,
      catalogHints,
      normalized,
      normalizedContext,
    });
  }

  if (catalogIntent) {
    return createPlanningResult({
      kind: AI_RUN_KIND.catalogSearch,
      signals: [...signals],
      shouldUseCatalog: true,
      requiresApproval: false,
      safetyFlags,
      catalogHints,
      normalized,
      normalizedContext,
    });
  }

  return createPlanningResult({
    kind: AI_RUN_KIND.chat,
    signals: [...signals],
    shouldUseCatalog: false,
    requiresApproval: false,
    safetyFlags,
    normalized,
    normalizedContext,
  });
}

export function extractRecentUserTexts(
  messages: Array<{ role?: string; parts?: unknown[]; content?: unknown }>,
  limit = 4,
) {
  const texts: string[] = [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;

    const text = extractMessageText(message);
    if (!text) continue;

    texts.unshift(text);
    if (texts.length >= limit) break;
  }

  return texts;
}

function normalizePlanningInput(input?: AiPlanningInput) {
  if (typeof input === "string" || input === undefined) {
    const latestUserText = input ?? "";

    return {
      latestUserText,
      recentUserTexts: latestUserText ? [latestUserText] : [],
    };
  }

  const latestUserText = input.latestUserText ?? "";
  const recentUserTexts =
    input.recentUserTexts && input.recentUserTexts.length > 0
      ? input.recentUserTexts
      : latestUserText
        ? [latestUserText]
        : [];

  return {
    latestUserText,
    recentUserTexts,
  };
}

function createCatalogPlanningHints(input: {
  latestUserText: string;
  recentUserTexts: string[];
}) {
  const latestIntent = resolveAiCatalogSearchIntent({
    query: input.latestUserText,
  });
  const contextQuery = buildCatalogContextQuery(input);
  const contextIntent = resolveAiCatalogSearchIntent({ query: contextQuery });
  const hints: AiCatalogToolInput = {
    query: trimToUndefined(contextQuery),
    category: latestIntent.category ?? contextIntent.category,
    material: latestIntent.material ?? contextIntent.material,
    maxPrice: latestIntent.maxPrice ?? contextIntent.maxPrice,
  };

  return compactCatalogHints(hints);
}

function buildCatalogContextQuery(input: {
  latestUserText: string;
  recentUserTexts: string[];
}) {
  const latest = input.latestUserText.trim();
  const priorTexts = input.recentUserTexts
    .slice(0, -1)
    .filter((text) => text.trim() && text.trim() !== latest)
    .slice(-3);

  return [...priorTexts, latest].filter(Boolean).join(" ");
}

function compactCatalogHints(input: AiCatalogToolInput) {
  const compacted = Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) =>
        value !== undefined && !(typeof value === "string" && !value.trim()),
    ),
  ) as AiCatalogToolInput;

  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

function createPlanningResult(input: {
  kind: AiRunKind;
  signals: string[];
  shouldUseCatalog: boolean;
  requiresApproval: boolean;
  safetyFlags: string[];
  catalogHints?: AiCatalogToolInput;
  normalized: string;
  normalizedContext: string;
}): AiPlanningContext {
  const missingFields = getMissingFields(input);
  const clarificationRequired = getClarificationRequired({
    kind: input.kind,
    missingFields,
  });
  const confidence = getPlanningConfidence({
    kind: input.kind,
    signals: input.signals,
    missingFields,
    catalogHints: input.catalogHints,
  });

  return {
    kind: input.kind,
    signals: input.signals,
    shouldUseCatalog: input.shouldUseCatalog,
    requiresApproval: input.requiresApproval,
    safetyFlags: input.safetyFlags,
    confidence,
    missingFields,
    clarificationRequired,
    ...(input.shouldUseCatalog && input.catalogHints
      ? { catalogHints: input.catalogHints }
      : {}),
  };
}

function getMissingFields(input: {
  kind: AiRunKind;
  catalogHints?: AiCatalogToolInput;
  normalized: string;
  normalizedContext: string;
}) {
  const combined = `${input.normalized} ${input.normalizedContext}`;

  if (input.kind === AI_RUN_KIND.orderSupport) {
    return [
      hasOrderReference(combined) ? null : "orderNumber",
      hasEmail(combined) ? null : "email",
    ].filter((field): field is string => Boolean(field));
  }

  if (input.kind === AI_RUN_KIND.tryOn) {
    return input.catalogHints?.category ? [] : ["product"];
  }

  if (input.kind === AI_RUN_KIND.styleProfile) {
    return hasExplicitStyleProfileDetails(combined, input.catalogHints)
      ? []
      : ["stylePreferences"];
  }

  if (input.kind === AI_RUN_KIND.giftRecommendation) {
    return [
      input.catalogHints?.maxPrice || hasBudgetMention(combined)
        ? null
        : "budget",
      hasAny(combined, giftRecipientTerms) ? null : "recipient",
      hasAny(combined, giftOccasionTerms) ? null : "occasion",
    ].filter((field): field is string => Boolean(field));
  }

  if (input.kind === AI_RUN_KIND.catalogSearch) {
    return input.catalogHints?.query || input.catalogHints?.category
      ? []
      : ["catalogPreference"];
  }

  return [];
}

function getPlanningConfidence(input: {
  kind: AiRunKind;
  signals: string[];
  missingFields: string[];
  catalogHints?: AiCatalogToolInput;
}) {
  if (input.missingFields.length >= 2) return "low";
  if (input.missingFields.length === 1) return "medium";
  if (input.kind === AI_RUN_KIND.chat) {
    return input.signals.length > 0 ? "medium" : "low";
  }
  if (
    input.kind === AI_RUN_KIND.orderSupport ||
    input.kind === AI_RUN_KIND.tryOn ||
    input.kind === AI_RUN_KIND.styleProfile
  ) {
    return "high";
  }
  if (
    input.catalogHints?.category ||
    input.catalogHints?.material ||
    input.catalogHints?.maxPrice
  ) {
    return "high";
  }
  if (input.catalogHints?.query) return "medium";

  return input.signals.length > 0 ? "medium" : "low";
}

function getClarificationRequired(input: {
  kind: AiRunKind;
  missingFields: string[];
}) {
  if (input.missingFields.length === 0) return false;

  return (
    input.kind === AI_RUN_KIND.orderSupport ||
    input.kind === AI_RUN_KIND.tryOn ||
    input.kind === AI_RUN_KIND.styleProfile
  );
}

function hasEmail(value: string) {
  return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(value);
}

function hasExplicitStyleProfileDetails(
  value: string,
  catalogHints: AiCatalogToolInput | undefined,
) {
  return (
    Boolean(catalogHints?.category ?? catalogHints?.material) ||
    hasAny(value, styleDescriptorTerms) ||
    /\b(?:size|מידה|מידת)\s*\d{1,2}\b/i.test(value)
  );
}

function hasCatalogIntent(value: string) {
  return (
    hasAny(value, catalogTerms) ||
    hasAny(value, styleDescriptorTerms) ||
    hasBudgetMention(value)
  );
}

function hasOrderSupportIntent(value: string) {
  if (!value) return false;
  if (hasOrderReference(value)) return true;
  if (hasAny(value, orderSupportPhrases)) return true;

  return (
    hasAny(value, orderSupportActionTerms) && hasAny(value, orderIdentityTerms)
  );
}

function hasOrderReference(value: string) {
  return (
    /\baph[-\s]?\d{4,}[\w-]*\b/i.test(value) ||
    /#\s?\d{4,}/.test(value) ||
    hasAny(value, orderReferenceTerms)
  );
}

function hasBudgetMention(value: string) {
  return (
    /(?:^|\s)(?:עד|תקציב|מקסימום|max|under|below|up to)\s*\d{2,5}\b/i.test(
      value,
    ) || /\b\d{2,5}\s*(?:שח|₪|nis|ils|shekel|shekels)\b/i.test(value)
  );
}

export function extractLatestUserText(
  messages: Array<{ role?: string; parts?: unknown[]; content?: unknown }>,
) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;

    const text = extractMessageText(message);

    if (text) return text;
  }

  return "";
}

function extractMessageText(message: { parts?: unknown[]; content?: unknown }) {
  const partsText = message.parts
    ?.map((part) =>
      typeof part === "object" &&
      part !== null &&
      "type" in part &&
      part.type === "text" &&
      "text" in part &&
      typeof part.text === "string"
        ? part.text
        : "",
    )
    .join(" ")
    .trim();

  if (partsText) return partsText;

  if (typeof message.content === "string") {
    return message.content.trim();
  }

  return "";
}

function trimToUndefined(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) return undefined;

  return trimmed;
}

function hasAny(value: string, terms: readonly string[]) {
  return terms.some((term) => value.includes(normalizePlanningText(term)));
}

function normalizePlanningText(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[״׳"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const giftTerms = [
  "gift",
  "present",
  "occasion",
  "birthday",
  "anniversary",
  "holiday",
  "wedding gift",
  "מתנה",
  "מתנות",
  "למתנה",
  "יום הולדת",
  "אירוע",
  "יום נישואין",
] as const;

const giftRecipientTerms = [
  "mom",
  "mother",
  "wife",
  "partner",
  "girlfriend",
  "friend",
  "bride",
  "אמא",
  "אמא שלי",
  "בת זוג",
  "אשתי",
  "חברה",
  "חברה שלי",
  "כלה",
  "אחות",
  "סבתא",
] as const;

const giftOccasionTerms = [
  "birthday",
  "anniversary",
  "wedding",
  "holiday",
  "יום הולדת",
  "יום נישואין",
  "חתונה",
  "אירוע",
  "חג",
  "לידה",
] as const;

const catalogTerms = [
  "ring",
  "rings",
  "necklace",
  "necklaces",
  "chain",
  "bracelet",
  "bracelets",
  "earring",
  "earrings",
  "jewelry",
  "jewellery",
  "jewel",
  "budget",
  "price",
  "gold",
  "white gold",
  "yellow gold",
  "diamond",
  "diamonds",
  "silver",
  "pearl",
  "engagement",
  "proposal",
  "wedding",
  "bridal",
  "bride",
  "טבעת",
  "טבעות",
  "שרשרת",
  "שרשראות",
  "תליון",
  "צמיד",
  "צמידים",
  "עגיל",
  "עגילים",
  "תכשיט",
  "תכשיטים",
  "תקציב",
  "מחיר",
  "שח",
  "₪",
  "זהב",
  "זהב לבן",
  "זהב צהוב",
  "יהלום",
  "יהלומים",
  "כסף",
  "פנינה",
  "פנינים",
  "כלה",
  "חתונה",
  "אירוסין",
  "הצעת נישואין",
  "יום יום",
] as const;

const styleDescriptorTerms = [
  "delicate",
  "soft",
  "subtle",
  "classic",
  "minimalist",
  "modern",
  "everyday",
  "elegant",
  "עדין",
  "עדינה",
  "עדינים",
  "עדינות",
  "קלאסי",
  "קלאסית",
  "מינימליסטי",
  "מינימליסטית",
  "מודרני",
  "מודרנית",
  "יומיומי",
  "יומיומית",
  "אלגנטי",
  "אלגנטית",
  "פחות כבד",
  "לא כבד",
] as const;

const catalogFollowUpTerms = [
  "similar",
  "another",
  "different",
  "more",
  "less",
  "instead",
  "option",
  "אפשר",
  "עוד",
  "דומה",
  "אחר",
  "אחרת",
  "אופציה",
  "חלופה",
  "יותר",
  "פחות",
  "במקום",
] as const;

const styleProfileTerms = [
  "style profile",
  "save my style",
  "save style",
  "remember my style",
  "save these preferences",
  "profile",
  "ring size",
  "פרופיל סגנון",
  "פרופיל סטייל",
  "שמור סגנון",
  "שמור לי סגנון",
  "שמרי לי סגנון",
  "תשמרי לי סגנון",
  "שמרי לי פרופיל",
  "זכרי את הסגנון",
  "שמרי העדפות",
  "מידת טבעת",
  "סגנון אישי",
] as const;

const tryOnTerms = [
  "try on",
  "try it on",
  "virtual try",
  "virtual try on",
  "virtual fitting",
  "webar",
  "measure",
  "מדידה",
  "למדוד",
  "לנסות",
  "נסה עלי",
  "נסה עליי",
  "נסי עליי",
  "אראה עלי",
  "אראה עליי",
  "וירטואלית",
] as const;

const orderSupportPhrases = [
  "order status",
  "track order",
  "track my order",
  "tracking order",
  "where is my order",
  "when will my order",
  "status of my order",
  "support for my order",
  "delivery status",
  "shipment status",
  "סטטוס הזמנה",
  "סטטוס ההזמנה",
  "מעקב הזמנה",
  "מעקב משלוח",
  "איפה ההזמנה",
  "איפה המשלוח",
  "ההזמנה שלי",
  "המשלוח שלי",
  "מתי ההזמנה",
  "מתי המשלוח",
] as const;

const orderSupportActionTerms = [
  "status",
  "track",
  "tracking",
  "support",
  "arrive",
  "arrival",
  "refund",
  "return",
  "cancel",
  "סטטוס",
  "מעקב",
  "איפה",
  "מתי",
  "הגיע",
  "מגיעה",
  "תמיכה",
  "שירות",
  "ביטול",
  "לבטל",
  "החזרה",
  "זיכוי",
] as const;

const orderIdentityTerms = [
  "order",
  "my order",
  "purchase",
  "shipment",
  "delivery",
  "הזמנה",
  "ההזמנה",
  "הזמנתי",
  "משלוח",
  "המשלוח",
  "איסוף",
] as const;

const orderReferenceTerms = [
  "order number",
  "order #",
  "מספר הזמנה",
  "מס הזמנה",
] as const;

const promptInjectionTerms = [
  "ignore previous",
  "ignore the previous",
  "ignore all previous",
  "disregard previous",
  "system prompt",
  "reveal prompt",
  "show system",
  "developer message",
  "התעלם מההוראות",
  "התעלמי מההוראות",
  "תתעלמי מההוראות",
  "פרומפט מערכת",
  "הוראות מערכת",
  "חשפי את ההנחיות",
  "גלי את ההנחיות",
] as const;
