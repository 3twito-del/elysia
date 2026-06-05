import {
  PUBLIC_BENCHMARK_KEEP_THRESHOLD,
  PUBLIC_BENCHMARK_TOTAL_WEIGHT,
  publicBenchmarkCorpus,
  type PublicMandatoryException,
} from "./public-design-policy";

export const PUBLIC_STRUCTURE_BENCHMARK_V4 = "PUBLIC_STRUCTURE_BENCHMARK_V4";
export const PUBLIC_STRUCTURE_BENCHMARK_TOTAL_WEIGHT =
  PUBLIC_BENCHMARK_TOTAL_WEIGHT;
export const PUBLIC_STRUCTURE_KEEP_THRESHOLD = PUBLIC_BENCHMARK_KEEP_THRESHOLD;

export type PublicRouteArchetype =
  | "home"
  | "plp"
  | "pdp"
  | "checkout"
  | "service"
  | "account"
  | "content"
  | "legal"
  | "ai";

export type PublicStructureDecisionStatus =
  | "allow"
  | "demote"
  | "remove"
  | "mandatory";

export type PublicStructureDecision = {
  benchmarkEvidenceUrl: string[];
  benchmarkScore: number;
  denominator: typeof PUBLIC_STRUCTURE_BENCHMARK_TOTAL_WEIGHT;
  mandatoryExceptionReason?: PublicMandatoryException;
  publicRule: string;
  status: PublicStructureDecisionStatus;
  threshold: typeof PUBLIC_STRUCTURE_KEEP_THRESHOLD;
};

export type PublicStructuralElementKey = keyof typeof publicStructurePolicy;
export type PublicAnchorCtaKey = keyof typeof anchorCtaPolicy;
export type PublicRouteStructureKey = keyof typeof routeStructurePolicy;

const evidence = {
  baymardJewelry: "https://baymard.com/blog/jewelry-and-watches-2025-benchmark",
  bulgariGifts: "https://www.bulgari.com/en-us/gifts",
  chopardRings: "https://www.chopard.com/en-us/jewellery-rings",
  tiffanyRings: "https://www.tiffany.com/jewelry/rings/",
  vanCleefRings:
    "https://www.vancleefarpels.com/us/en/e-boutique/category/rings.html",
  mejuriRings: "https://mejuri.com/collections/rings",
  blueNileRings: "https://www.bluenile.com/jewelry/rings",
  wcag22: "https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/",
  webVitals: "https://web.dev/articles/vitals",
} as const;

export const publicStructureBenchmarkCorpus = publicBenchmarkCorpus;

export const publicStructurePolicy = {
  homeBrandHeroThenCommerceEntry: allow(
    25,
    [evidence.baymardJewelry, evidence.tiffanyRings, evidence.vanCleefRings],
    "Home may open with one pre-launch brand world before any category, search, or product entry appears.",
  ),
  plpTitleControlsGridFirst: allow(
    32,
    [
      evidence.bulgariGifts,
      evidence.tiffanyRings,
      evidence.vanCleefRings,
      evidence.chopardRings,
      evidence.mejuriRings,
      evidence.blueNileRings,
    ],
    "PLP, search, and gifts routes prioritize title, count, filters/sort, and product grid before decorative content.",
  ),
  giftsAsProductListing: allow(
    26,
    [evidence.bulgariGifts, evidence.tiffanyRings, evidence.mejuriRings],
    "Gift routes behave as product listings, not landing pages with a local jump button.",
  ),
  adjacentSamePageHeroCta: remove(
    3,
    [
      evidence.bulgariGifts,
      evidence.tiffanyRings,
      evidence.vanCleefRings,
      evidence.mejuriRings,
    ],
    "Hero actions that only scroll to the next adjacent section are removed.",
  ),
  heroCtaToRealControl: allow(
    22,
    [evidence.chopardRings, evidence.mejuriRings, evidence.blueNileRings],
    "A hero or top-strip action may stay only when it opens a real control such as search, filters, login, or checkout.",
  ),
  crossRouteHeroAction: allow(
    24,
    [evidence.tiffanyRings, evidence.vanCleefRings, evidence.blueNileRings],
    "Hero actions may navigate to a different task or page.",
  ),
  pdpGalleryPurchaseFirst: allow(
    31,
    [evidence.chopardRings, evidence.baymardJewelry],
    "PDP structure starts with product gallery and purchase panel; service and related products follow.",
  ),
  checkoutTaskFirst: allow(
    28,
    [evidence.baymardJewelry, evidence.webVitals],
    "Checkout starts with cart and form content; reassurance stays near submit/payment context.",
  ),
  serviceAccountTaskFirst: allow(
    25,
    [evidence.baymardJewelry, evidence.tiffanyRings, evidence.blueNileRings],
    "Service and account routes start with the task surface, not decorative media or anchor menus.",
  ),
  legalCompactReadableContent: allow(
    30,
    [evidence.wcag22],
    "Legal and accessibility routes use a compact header and readable content flow.",
  ),
  floatingChromeNoCommerceOverlap: mandatory(
    "accessibility",
    [evidence.wcag22],
    "Cookie, accessibility, filter, and purchase chrome must not cover focusable commerce controls or product facts.",
  ),
} as const;

export const anchorCtaPolicy = {
  samePageHeroAnchor: remove(
    3,
    [evidence.bulgariGifts, evidence.tiffanyRings, evidence.mejuriRings],
    "Same-page anchor links are not allowed in public route heroes.",
  ),
  adjacentSectionJump: remove(
    3,
    [evidence.bulgariGifts, evidence.vanCleefRings],
    "Adjacent-section jumps such as gifts/results/products buttons are removed.",
  ),
  crossRouteHeroAction: publicStructurePolicy.crossRouteHeroAction,
  realControlTrigger: publicStructurePolicy.heroCtaToRealControl,
  legalInlineToc: demote(
    12,
    [evidence.wcag22],
    "Long legal pages may use inline table-of-contents links inside content, not as hero CTAs.",
  ),
} as const;

export const routeStructurePolicy = {
  "/": route(
    "home",
    publicStructurePolicy.homeBrandHeroThenCommerceEntry,
    "Brand hero, then immediate category/search/product entry.",
  ),
  "/gifts": route(
    "plp",
    publicStructurePolicy.giftsAsProductListing,
    "Compact title/control strip and gift product grid.",
  ),
  "/category/[slug]": route(
    "plp",
    publicStructurePolicy.plpTitleControlsGridFirst,
    "Title, count, filters, sort, active filters, product grid.",
  ),
  "/search": route(
    "plp",
    publicStructurePolicy.plpTitleControlsGridFirst,
    "Search controls and result grid first.",
  ),
  "/product/[slug]": route(
    "pdp",
    publicStructurePolicy.pdpGalleryPurchaseFirst,
    "Gallery and purchase panel first.",
  ),
  "/checkout": route(
    "checkout",
    publicStructurePolicy.checkoutTaskFirst,
    "Cart and checkout form first.",
  ),
  "/service": route(
    "service",
    publicStructurePolicy.serviceAccountTaskFirst,
    "Contact channels and service form first.",
  ),
  "/account": route(
    "account",
    publicStructurePolicy.serviceAccountTaskFirst,
    "Login or customer dashboard first.",
  ),
  "/account/orders/[id]": route(
    "account",
    publicStructurePolicy.serviceAccountTaskFirst,
    "Order details and support actions first.",
  ),
  "/ai": route(
    "ai",
    publicStructurePolicy.serviceAccountTaskFirst,
    "AI remains a demoted service capability, with tool tabs first.",
  ),
  "/stylist": route(
    "ai",
    publicStructurePolicy.serviceAccountTaskFirst,
    "Stylist tool first, explanatory content second.",
  ),
  "/about": route(
    "content",
    publicStructurePolicy.legalCompactReadableContent,
    "Readable brand content with cross-route commerce actions only.",
  ),
  "/branches": route(
    "service",
    publicStructurePolicy.serviceAccountTaskFirst,
    "Branch list first when enabled.",
  ),
  "/faq": route(
    "content",
    publicStructurePolicy.legalCompactReadableContent,
    "FAQ content and service recovery links.",
  ),
  "/terms": route(
    "legal",
    publicStructurePolicy.legalCompactReadableContent,
    "Legal text without commerce-style hero anchors.",
  ),
  "/privacy": route(
    "legal",
    publicStructurePolicy.legalCompactReadableContent,
    "Privacy text and cookie preferences without hero anchors.",
  ),
  "/accessibility": route(
    "legal",
    publicStructurePolicy.legalCompactReadableContent,
    "Accessibility statement and contact content without hero anchors.",
  ),
} as const;

export function getPublicStructureDecision(key: PublicStructuralElementKey) {
  return publicStructurePolicy[key];
}

export function shouldRenderStructuralElement(key: PublicStructuralElementKey) {
  const decision = getPublicStructureDecision(key);

  return decision.status === "allow" || decision.status === "mandatory";
}

export function getRouteStructureDecision(routeKey: PublicRouteStructureKey) {
  return routeStructurePolicy[routeKey];
}

function route(
  archetype: PublicRouteArchetype,
  decision: PublicStructureDecision,
  publicRule: string,
) {
  return {
    archetype,
    decision,
    publicRule,
  } as const;
}

function allow(
  benchmarkScore: number,
  benchmarkEvidenceUrl: string[],
  publicRule: string,
): PublicStructureDecision {
  return decision(benchmarkScore, "allow", benchmarkEvidenceUrl, publicRule);
}

function demote(
  benchmarkScore: number,
  benchmarkEvidenceUrl: string[],
  publicRule: string,
): PublicStructureDecision {
  return decision(benchmarkScore, "demote", benchmarkEvidenceUrl, publicRule);
}

function remove(
  benchmarkScore: number,
  benchmarkEvidenceUrl: string[],
  publicRule: string,
): PublicStructureDecision {
  return decision(benchmarkScore, "remove", benchmarkEvidenceUrl, publicRule);
}

function mandatory(
  mandatoryExceptionReason: PublicMandatoryException,
  benchmarkEvidenceUrl: string[],
  publicRule: string,
): PublicStructureDecision {
  return {
    benchmarkEvidenceUrl,
    benchmarkScore: PUBLIC_STRUCTURE_BENCHMARK_TOTAL_WEIGHT,
    denominator: PUBLIC_STRUCTURE_BENCHMARK_TOTAL_WEIGHT,
    mandatoryExceptionReason,
    publicRule,
    status: "mandatory",
    threshold: PUBLIC_STRUCTURE_KEEP_THRESHOLD,
  };
}

function decision(
  benchmarkScore: number,
  status: PublicStructureDecisionStatus,
  benchmarkEvidenceUrl: string[],
  publicRule: string,
): PublicStructureDecision {
  return {
    benchmarkEvidenceUrl,
    benchmarkScore,
    denominator: PUBLIC_STRUCTURE_BENCHMARK_TOTAL_WEIGHT,
    publicRule,
    status,
    threshold: PUBLIC_STRUCTURE_KEEP_THRESHOLD,
  };
}
