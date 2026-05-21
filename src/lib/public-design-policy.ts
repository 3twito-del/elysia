export const PUBLIC_BENCHMARK_TOTAL_WEIGHT = 37.5;
export const PUBLIC_BENCHMARK_KEEP_THRESHOLD = 18.75;

export type PublicBenchmarkTier = "luxury-house" | "commerce-leader";
export type PublicRouteIntent =
  | "home"
  | "plp"
  | "pdp"
  | "checkout"
  | "service"
  | "account"
  | "legal"
  | "ai";
export type PublicElementDecisionStatus =
  | "allow"
  | "demote"
  | "remove"
  | "mandatory";
export type PublicMandatoryException =
  | "accessibility"
  | "legal"
  | "payment"
  | "seo"
  | "cookie"
  | "backend-correctness";

export type PublicBenchmarkSite = {
  name: string;
  tier: PublicBenchmarkTier;
  weight: 1 | 1.5;
};

export type PublicElementDecision = {
  benchmarkScore: number;
  denominator: typeof PUBLIC_BENCHMARK_TOTAL_WEIGHT;
  exception?: PublicMandatoryException;
  publicRule: string;
  status: PublicElementDecisionStatus;
  threshold: typeof PUBLIC_BENCHMARK_KEEP_THRESHOLD;
};

export type PublicElementKey = keyof typeof publicElementPolicy;

const tierALuxuryHouses = [
  "Cartier",
  "Tiffany & Co.",
  "Van Cleef & Arpels",
  "Bulgari",
  "Harry Winston",
  "Graff",
  "Chopard",
  "Boucheron",
  "Chaumet",
  "Piaget",
  "Mikimoto",
  "Messika",
  "Buccellati",
  "De Beers",
  "Pomellato",
] as const;

const tierBCommerceLeaders = [
  "David Yurman",
  "Pandora",
  "Swarovski",
  "Mejuri",
  "Brilliant Earth",
  "Blue Nile",
  "James Allen",
  "Kay Jewelers",
  "Zales",
  "Jared",
  "VRAI",
  "Catbird",
  "Aurate",
  "Monica Vinader",
  "Kendra Scott",
] as const;

export const publicBenchmarkCorpus: PublicBenchmarkSite[] = [
  ...tierALuxuryHouses.map((name) => ({
    name,
    tier: "luxury-house" as const,
    weight: 1.5 as const,
  })),
  ...tierBCommerceLeaders.map((name) => ({
    name,
    tier: "commerce-leader" as const,
    weight: 1 as const,
  })),
];

export const publicElementPolicy = {
  homeEditorialHero: allow(
    24.5,
    "Home may keep one product-led editorial hero.",
  ),
  editorialFirstViewport: allow(
    27,
    "The home first viewport is campaign-led with one hero story and minimal actions.",
  ),
  homeFirstViewportSearch: remove(
    9,
    "Search forms are moved below the first editorial viewport on mobile.",
  ),
  defaultAquaCta: remove(
    8,
    "Aqua is not the default public CTA treatment; it is explicit accent-only.",
  ),
  routeHeroMedia: remove(
    17.5,
    "Non-home route heroes are text/task first; route media is hidden.",
  ),
  heroMetrics: remove(
    6.5,
    "Hero metric tiles and product-ratio blocks are removed.",
  ),
  categoryProductCount: allow(
    29,
    "PLP/search may show result range/count near the grid.",
  ),
  exactInventoryQuantity: remove(
    5.5,
    "Exact stock counts are not customer-facing.",
  ),
  genericAvailability: allow(
    31,
    "Use generic availability language for purchase confidence.",
  ),
  filterOptionCounts: remove(12, "Facet options do not expose result counts."),
  activeFilterChips: allow(22, "Active refinements may be removable chips."),
  sortControl: allow(28, "Sort remains near result controls."),
  collectionBadgePill: remove(
    13,
    "Repeated collection badges are removed from product cards/media.",
  ),
  saleBadge: allow(21, "Sale badges are allowed when backed by price data."),
  wishlist: allow(21, "Wishlist is allowed as a secondary action."),
  aiStylistPrimary: remove(
    1,
    "AI/stylist is removed from primary nav, hero CTAs, PLP CTAs, and PDP CTAs.",
  ),
  aiStylistServiceEntry: demote(
    7,
    "AI may exist only as a non-primary service/help path.",
  ),
  trustNearPurchase: allow(
    24,
    "Trust copy may sit near purchase or submit actions.",
  ),
  serviceLinks: allow(30, "Service/help links remain discoverable."),
  footerDenseServiceLinks: allow(23, "Footer may keep compact service links."),
  cookieAccessibilityChrome: mandatory(
    "accessibility",
    "Cookie and accessibility controls remain with collision rules.",
  ),
  motionEnhancedMedia: remove(
    10,
    "Motion outside the home hero is minimal and never continuous.",
  ),
  relatedProducts: allow(
    24,
    "Related product rails may remain after PDP purchase.",
  ),
  checkoutReassurance: allow(
    26,
    "Checkout reassurance is allowed near submit/payment context.",
  ),
} as const;

export function getPublicElementDecision(key: PublicElementKey) {
  return publicElementPolicy[key];
}

export function shouldRenderPublicElement(key: PublicElementKey) {
  const decision = getPublicElementDecision(key);

  return decision.status === "allow" || decision.status === "mandatory";
}

function allow(score: number, publicRule: string): PublicElementDecision {
  return decision(score, "allow", publicRule);
}

function demote(score: number, publicRule: string): PublicElementDecision {
  return decision(score, "demote", publicRule);
}

function remove(score: number, publicRule: string): PublicElementDecision {
  return decision(score, "remove", publicRule);
}

function mandatory(
  exception: PublicMandatoryException,
  publicRule: string,
): PublicElementDecision {
  return {
    benchmarkScore: PUBLIC_BENCHMARK_TOTAL_WEIGHT,
    denominator: PUBLIC_BENCHMARK_TOTAL_WEIGHT,
    exception,
    publicRule,
    status: "mandatory",
    threshold: PUBLIC_BENCHMARK_KEEP_THRESHOLD,
  };
}

function decision(
  benchmarkScore: number,
  status: PublicElementDecisionStatus,
  publicRule: string,
): PublicElementDecision {
  return {
    benchmarkScore,
    denominator: PUBLIC_BENCHMARK_TOTAL_WEIGHT,
    publicRule,
    status,
    threshold: PUBLIC_BENCHMARK_KEEP_THRESHOLD,
  };
}
