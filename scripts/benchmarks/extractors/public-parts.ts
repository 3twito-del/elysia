import type {
  BenchmarkExtractor,
  BenchmarkMetricDefinition,
  BenchmarkPartConfig,
} from "../core";

const genericMetricDefinitions: BenchmarkMetricDefinition[] = [
  { group: "chrome", key: "elementFound", type: "boolean" },
  { group: "chrome", key: "elementCount", type: "number" },
  { group: "chrome", key: "visibleElementCount", type: "number" },
  { group: "chrome", key: "semanticTag", type: "category" },
  { group: "chrome", key: "topPx", type: "number" },
  { group: "chrome", key: "heightPx", type: "number" },
  { group: "chrome", key: "widthRatio", type: "number" },
  { group: "chrome", key: "areaRatio", type: "number" },
  { group: "chrome", key: "fullBleed", type: "boolean" },
  { group: "chrome", key: "hasBorder", type: "boolean" },
  { group: "chrome", key: "hasShadow", type: "boolean" },
  { group: "chrome", key: "lowShadow", type: "boolean" },
  { group: "chrome", key: "isStickyOrFixed", type: "boolean" },
  { group: "visual-tone", key: "neutralBackground", type: "boolean" },
  { group: "visual-tone", key: "transparentBackground", type: "boolean" },
  { group: "visual-tone", key: "roundedControlCount", type: "number" },
  { group: "visual-tone", key: "pillLikeControlCount", type: "number" },
  { group: "visual-tone", key: "boxedControlRatio", type: "number" },
  { group: "visual-tone", key: "aquaAccentCount", type: "number" },
  { group: "visual-tone", key: "decorativeGradient", type: "boolean" },
  { group: "interaction", key: "linkCount", type: "number" },
  { group: "interaction", key: "buttonCount", type: "number" },
  { group: "interaction", key: "focusableCount", type: "number" },
  {
    group: "interaction",
    key: "minTapTargetPx",
    numericComparison: "higherIsBetter",
    type: "number",
  },
  {
    group: "interaction",
    key: "tapTargetPassRatio",
    numericComparison: "higherIsBetter",
    type: "number",
  },
  { group: "accessibility", key: "ariaLabelCount", type: "number" },
  {
    group: "accessibility",
    key: "namedControlRatio",
    numericComparison: "higherIsBetter",
    type: "number",
  },
  { group: "accessibility", key: "hasAriaCurrent", type: "boolean" },
  { group: "accessibility", key: "hasAriaExpanded", type: "boolean" },
  { group: "content", key: "textLength", type: "number" },
  { group: "content", key: "headingCount", type: "number" },
  { group: "content", key: "paragraphCount", type: "number" },
  { group: "content", key: "formControlCount", type: "number" },
  { group: "media", key: "imageCount", type: "number" },
  { group: "media", key: "videoCount", type: "number" },
  { group: "commerce", key: "productLinkCount", type: "number" },
  { group: "commerce", key: "priceTextPresent", type: "boolean" },
  { group: "commerce", key: "addToCartTextPresent", type: "boolean" },
  { group: "commerce", key: "checkoutTextPresent", type: "boolean" },
  { group: "density", key: "linksPer1000Px", type: "number" },
  { group: "density", key: "controlsPer1000Px", type: "number" },
];

const headerMetricDefinitions: BenchmarkMetricDefinition[] = [
  ...genericMetricDefinitions,
  { group: "chrome", key: "headerFound", type: "boolean" },
  { group: "chrome", key: "headerSemanticTag", type: "boolean" },
  { group: "chrome", key: "headerRoleBanner", type: "boolean" },
  { group: "chrome", key: "headerAtViewportTop", type: "boolean" },
  { group: "chrome", key: "headerFixedOrSticky", type: "boolean" },
  { group: "chrome", key: "headerSticky", type: "boolean" },
  { group: "chrome", key: "headerHeightPx", type: "number" },
  { group: "brand", key: "brandWordmarkOnly", type: "boolean" },
  { group: "brand", key: "brandUsesGenericIcon", type: "boolean" },
  { group: "navigation", key: "desktopNavVisible", type: "boolean" },
  { group: "navigation", key: "navVisibleLinkCount", type: "number" },
  { group: "utility", key: "hasSearchEntry", type: "boolean" },
  { group: "utility", key: "hasCartEntry", type: "boolean" },
  { group: "utility", key: "hasAccountEntry", type: "boolean" },
  { group: "utility", key: "hasLocationEntry", type: "boolean" },
  { group: "interaction", key: "mobileNavTriggerVisible", type: "boolean" },
];

const compactRouteHeroMetricDefinitions = genericMetricDefinitions
  .filter(
    (metric) =>
      !["commerce", "media", "density"].includes(metric.group) &&
      ![
        "fullBleed",
        "hasAriaCurrent",
        "hasAriaExpanded",
        "isStickyOrFixed",
      ].includes(metric.key),
  )
  .map((metric) =>
    [
      "areaRatio",
      "buttonCount",
      "elementCount",
      "focusableCount",
      "formControlCount",
      "headingCount",
      "heightPx",
      "linkCount",
      "paragraphCount",
      "roundedControlCount",
      "textLength",
      "visibleElementCount",
    ].includes(metric.key)
      ? { ...metric, numericComparison: "lowerIsBetter" as const }
      : metric,
  );

const listingMetricDefinitions = genericMetricDefinitions
  .filter(
    (metric) =>
      ![
        "addToCartTextPresent",
        "checkoutTextPresent",
        "fullBleed",
        "hasAriaCurrent",
        "hasAriaExpanded",
        "priceTextPresent",
        "semanticTag",
        "topPx",
        "transparentBackground",
      ].includes(metric.key),
  )
  .map((metric) =>
    [
      "imageCount",
      "minTapTargetPx",
      "namedControlRatio",
      "productLinkCount",
      "tapTargetPassRatio",
    ].includes(metric.key)
      ? { ...metric, numericComparison: "higherIsBetter" as const }
      : metric,
  );

const localTargetsByKey = {
  about: { label: "about", path: "/about" },
  account: { label: "account", path: "/account" },
  accessibility: { label: "accessibility", path: "/accessibility" },
  ai: { label: "ai", path: "/ai" },
  branches: { label: "branches", path: "/branches" },
  category: { label: "category", path: "/category/earrings" },
  checkout: { label: "checkout", path: "/checkout" },
  faq: { label: "faq", path: "/faq" },
  gifts: { label: "gifts", path: "/gifts" },
  global: { label: "home", path: "/" },
  home: { label: "home", path: "/" },
  legal: { label: "privacy", path: "/privacy" },
  privacy: { label: "privacy", path: "/privacy" },
  product: { label: "product", path: "/product/venus-line-ring" },
  search: { label: "search", path: "/search?q=venus" },
  service: { label: "service", path: "/service" },
  stylist: { label: "stylist", path: "/stylist" },
  terms: { label: "terms", path: "/terms" },
} as const;

export const publicSurfaceExtractor: BenchmarkExtractor = ({
  metricKeys,
  partId,
  siteName,
}) => {
  function findPartElements(targetPartId: string) {
    if (targetPartId === "header") {
      const matchedHeader = Array.from(
        document.querySelectorAll("header, [role='banner']"),
      ).filter(
        (element): element is HTMLElement => element instanceof HTMLElement,
      );

      if (matchedHeader.length > 0) return matchedHeader;

      const matchedNav = Array.from(document.querySelectorAll("nav")).filter(
        (element): element is HTMLElement => element instanceof HTMLElement,
      );

      if (matchedNav.length > 0) return matchedNav;
    }

    const selectors: Record<string, string> = {
      "ai-stylist": "main, [data-testid*='ai'], [data-testid*='stylist']",
      checkout: "[data-testid='cart-checkout-form'], main",
      "content-legal": "article, main",
      floating:
        ".public-floating-trigger, .public-floating-control, [data-public-floating-bar='true']",
      "floating-chrome":
        ".public-floating-trigger, .public-floating-control, [data-public-floating-bar='true']",
      footer: "footer",
      pdp: "[data-testid='product-gallery'], [data-testid='product-purchase-panel'], main",
      plp: "[data-testid='category-results-grid'], [data-testid='search-results-grid'], [data-testid='gift-results-grid'], main",
      "product-card":
        "[data-testid='product-card'], article, a[href*='/product/']",
      "route-hero":
        "[data-testid='cinematic-page-hero'], .commerce-page-hero, main > section:first-of-type",
      "search-control":
        "#search-controls, [data-testid='mobile-search-controls'], [data-testid='home-quick-search-form']",
      "service-account": "form, main",
    };
    const selector = selectors[targetPartId] ?? "main";
    const matched = Array.from(document.querySelectorAll(selector)).filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );

    if (matched.length > 0) return matched;

    if (
      targetPartId === "floating" ||
      targetPartId === "floating-chrome" ||
      targetPartId === "product-card"
    ) {
      return [];
    }

    const fallback = document.querySelector("main") ?? document.body;

    return fallback instanceof HTMLElement ? [fallback] : [];
  }

  function findBrandElement(root: HTMLElement, name: string) {
    const lowerName = name.toLowerCase();

    return (
      Array.from(root.querySelectorAll("a")).find((link) => {
        const href = link.getAttribute("href") ?? "";
        const text = normalizeText(link.textContent ?? "").toLowerCase();
        const aria = normalizeText(
          link.getAttribute("aria-label") ?? "",
        ).toLowerCase();

        return (
          href === "/" ||
          href.endsWith(".com/") ||
          text.includes(lowerName) ||
          aria.includes(lowerName)
        );
      }) ?? root.querySelector("a,img,svg")
    );
  }

  function normalizeText(value: string) {
    return value.replace(/\s+/gu, " ").trim();
  }

  function normalizeCommerceText(value: string) {
    return value
      .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, "")
      .replace(/[\u00a0\u202f]/gu, " ")
      .replace(/\s+/gu, " ")
      .trim();
  }

  function hasPriceText(value: string) {
    const normalized = normalizeCommerceText(value);

    return /(?:[$\u20ac\u00a3\u20aa]\s*\d)|(?:\d[\d\s,.'\u2019]*\s*(?:[$\u20ac\u00a3\u20aa]|usd|eur|ils|nis|shekel|shekels))/iu.test(
      normalized,
    );
  }

  function isVisibleElement(element: Element): element is HTMLElement {
    if (!(element instanceof HTMLElement)) return false;

    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      styles.display !== "none" &&
      styles.visibility !== "hidden" &&
      Number(styles.opacity) > 0.01
    );
  }

  function hasAccessibleName(element: Element) {
    const text = normalizeText(element.textContent ?? "");
    const aria = normalizeText(element.getAttribute("aria-label") ?? "");
    const title = normalizeText(element.getAttribute("title") ?? "");

    return text.length > 0 || aria.length > 0 || title.length > 0;
  }

  function isBoxedControl(element: Element) {
    if (!(element instanceof HTMLElement)) return false;

    const styles = window.getComputedStyle(element);

    return (
      parseCssPx(styles.borderTopWidth) > 0 ||
      parseCssPx(styles.borderBottomWidth) > 0 ||
      parseCssPx(styles.borderRadius) >= 8 ||
      styles.boxShadow !== "none"
    );
  }

  function hasVisibleDescendant(root: HTMLElement, selector: string) {
    return Array.from(root.querySelectorAll(selector)).some(isVisibleElement);
  }

  function parseCssPx(value: string) {
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  function parseCssColor(value: string) {
    if (value === "transparent") return { alpha: 0, blue: 0, green: 0, red: 0 };

    const rgba =
      /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/iu.exec(
        value,
      );

    if (rgba) {
      return {
        alpha: rgba[4] === undefined ? 1 : Number(rgba[4]),
        blue: Number(rgba[3]),
        green: Number(rgba[2]),
        red: Number(rgba[1]),
      };
    }

    const lab =
      /lab\(\s*([\d.]+%?)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/iu.exec(
        value,
      );

    if (!lab) return null;

    const lightnessRaw = parseCssColorNumber(lab[1] ?? "0");
    const lightness = lightnessRaw > 1 ? lightnessRaw / 100 : lightnessRaw;
    const channel = Math.max(0, Math.min(255, lightness * 255));
    const aChannel = Number(lab[2] ?? 0);
    const bChannel = Number(lab[3] ?? 0);

    return {
      alpha: lab[4] === undefined ? 1 : parseCssColorNumber(lab[4]),
      blue: channel + bChannel,
      green: channel - aChannel,
      red: channel + aChannel,
    };
  }

  function parseCssColorNumber(value: string) {
    if (value.endsWith("%")) return Number(value.slice(0, -1)) / 100;

    return Number(value);
  }

  function isNeutralColor(color: {
    alpha: number;
    blue: number;
    green: number;
    red: number;
  }) {
    return (
      Math.max(color.red, color.green, color.blue) -
        Math.min(color.red, color.green, color.blue) <=
      18
    );
  }

  function splitCssLayers(value: string) {
    return value.split(/,(?![^()]*\))/gu).map((layer) => layer.trim());
  }

  function isTransparentShadowLayer(layer: string) {
    return (
      layer === "" ||
      /\btransparent\b/iu.test(layer) ||
      /rgba?\([^)]*[,/]\s*0(?:\.0+)?\s*\)/iu.test(layer)
    );
  }

  function isEffectivelyNoShadow(value: string) {
    if (value === "none") return true;

    const layers = splitCssLayers(value);

    return layers.length > 0 && layers.every(isTransparentShadowLayer);
  }

  function round(value: number, precision = 0) {
    const multiplier = 10 ** precision;

    return Math.round(value * multiplier) / multiplier;
  }

  const viewportWidth = window.innerWidth || 1;
  const viewportHeight = window.innerHeight || 1;
  const metrics = Object.fromEntries(
    metricKeys.map((key) => [key, null]),
  ) as Record<string, boolean | number | string | null>;
  const elements = findPartElements(partId);
  const visibleElements = elements.filter(isVisibleElement);
  const primary = visibleElements[0] ?? elements[0] ?? null;

  if (!primary) {
    metrics.elementFound = false;
    if (partId === "header") metrics.headerFound = false;
    return { captured: false, enoughData: false, metrics };
  }

  const rect = primary.getBoundingClientRect();
  const styles = window.getComputedStyle(primary);
  const text = normalizeText(
    visibleElements.map((element) => element.textContent ?? "").join(" "),
  );
  const html = visibleElements.map((element) => element.outerHTML).join(" ");
  const lower = `${text} ${html}`.toLowerCase();
  const links = visibleElements.flatMap((element) =>
    Array.from(element.querySelectorAll("a")),
  );
  const buttons = visibleElements.flatMap((element) =>
    Array.from(
      element.querySelectorAll("button, [role='button'], [data-slot='button']"),
    ),
  );
  const focusableSelector =
    "a[href], button, input, select, textarea, summary, [role='button'], [tabindex]:not([tabindex='-1'])";
  const focusables = visibleElements.flatMap((element) =>
    [
      ...(element.matches(focusableSelector) ? [element] : []),
      ...Array.from(element.querySelectorAll(focusableSelector)),
    ].filter(
      (candidate, index, candidates): candidate is HTMLElement =>
        candidate instanceof HTMLElement &&
        candidates.indexOf(candidate) === index,
    ),
  );
  const visibleFocusables = focusables.filter(isVisibleElement);
  const tapSizes = visibleFocusables.map((element) => {
    const box = element.getBoundingClientRect();

    return Math.min(box.width, box.height);
  });
  const background = parseCssColor(styles.backgroundColor);
  const colorStrings = [
    styles.color,
    styles.backgroundColor,
    styles.borderColor,
    ...visibleFocusables.flatMap((element) => {
      const focusStyles = window.getComputedStyle(element);

      return [
        focusStyles.color,
        focusStyles.backgroundColor,
        focusStyles.borderColor,
      ];
    }),
  ].join(" ");

  metrics.elementFound = true;
  metrics.elementCount = elements.length;
  metrics.visibleElementCount = visibleElements.length;
  metrics.semanticTag = primary.tagName.toLowerCase();
  metrics.topPx = round(rect.top);
  metrics.heightPx = round(rect.height);
  metrics.widthRatio = round(rect.width / viewportWidth, 3);
  metrics.areaRatio = round(
    (rect.width * rect.height) / (viewportWidth * viewportHeight),
    4,
  );
  metrics.fullBleed = rect.width >= viewportWidth - 2;
  metrics.hasBorder =
    parseCssPx(styles.borderTopWidth) > 0 ||
    parseCssPx(styles.borderBottomWidth) > 0;
  metrics.hasShadow = !isEffectivelyNoShadow(styles.boxShadow);
  metrics.lowShadow =
    !metrics.hasShadow || splitCssLayers(styles.boxShadow).length <= 1;
  metrics.isStickyOrFixed =
    styles.position === "sticky" || styles.position === "fixed";
  metrics.neutralBackground = background ? isNeutralColor(background) : false;
  metrics.transparentBackground = (background?.alpha ?? 0) < 0.35;
  metrics.roundedControlCount = visibleFocusables.filter(
    (element) => parseCssPx(window.getComputedStyle(element).borderRadius) >= 6,
  ).length;
  metrics.pillLikeControlCount = visibleFocusables.filter((element) => {
    const box = element.getBoundingClientRect();
    const radius = parseCssPx(window.getComputedStyle(element).borderRadius);

    return box.height > 0 && radius >= box.height / 2 - 1;
  }).length;
  metrics.boxedControlRatio =
    visibleFocusables.length > 0
      ? round(
          visibleFocusables.filter(isBoxedControl).length /
            visibleFocusables.length,
          3,
        )
      : 0;
  metrics.aquaAccentCount = (
    colorStrings.match(/66,\s*201,\s*190|42c9be/giu) ?? []
  ).length;
  metrics.decorativeGradient = styles.backgroundImage.includes("gradient");
  metrics.linkCount = links.filter(isVisibleElement).length;
  metrics.buttonCount = buttons.filter(isVisibleElement).length;
  metrics.focusableCount = visibleFocusables.length;
  metrics.minTapTargetPx =
    tapSizes.length > 0 ? round(Math.min(...tapSizes), 2) : 0;
  metrics.tapTargetPassRatio =
    tapSizes.length > 0
      ? round(tapSizes.filter((size) => size >= 40).length / tapSizes.length, 3)
      : 1;
  metrics.ariaLabelCount = visibleElements.reduce(
    (sum, element) => sum + element.querySelectorAll("[aria-label]").length,
    0,
  );
  metrics.namedControlRatio =
    visibleFocusables.length > 0
      ? round(
          visibleFocusables.filter(hasAccessibleName).length /
            visibleFocusables.length,
          3,
        )
      : 1;
  metrics.hasAriaCurrent = hasVisibleDescendant(primary, "[aria-current]");
  metrics.hasAriaExpanded = hasVisibleDescendant(primary, "[aria-expanded]");
  metrics.textLength = text.length;
  metrics.headingCount = visibleElements.reduce(
    (sum, element) =>
      sum + element.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
    0,
  );
  metrics.paragraphCount = visibleElements.reduce(
    (sum, element) => sum + element.querySelectorAll("p").length,
    0,
  );
  metrics.formControlCount = visibleElements.reduce(
    (sum, element) =>
      sum +
      Array.from(element.querySelectorAll("input, select, textarea")).filter(
        isVisibleElement,
      ).length,
    0,
  );
  metrics.imageCount = visibleElements.reduce(
    (sum, element) => sum + element.querySelectorAll("img,picture").length,
    0,
  );
  metrics.videoCount = visibleElements.reduce(
    (sum, element) => sum + element.querySelectorAll("video").length,
    0,
  );
  metrics.productLinkCount = links.filter((link) =>
    (link.getAttribute("href") ?? "").includes("/product"),
  ).length;
  metrics.priceTextPresent = hasPriceText(lower);
  metrics.addToCartTextPresent =
    /add to bag|add to cart|checkout|cart|bag/iu.test(lower);
  metrics.checkoutTextPresent = /checkout|cart|bag/iu.test(lower);
  metrics.linksPer1000Px =
    rect.height > 0
      ? round((Number(metrics.linkCount) / rect.height) * 1000, 3)
      : 0;
  metrics.controlsPer1000Px =
    rect.height > 0
      ? round((visibleFocusables.length / rect.height) * 1000, 3)
      : 0;

  if (partId === "header") {
    const brand = findBrandElement(primary, siteName);
    const navs = Array.from(primary.querySelectorAll("nav")).filter(
      isVisibleElement,
    );

    metrics.headerFound = true;
    metrics.headerSemanticTag = primary.tagName.toLowerCase() === "header";
    metrics.headerRoleBanner = primary.getAttribute("role") === "banner";
    metrics.headerAtViewportTop = Math.abs(rect.top) <= 2;
    metrics.headerFixedOrSticky = Boolean(metrics.isStickyOrFixed);
    metrics.headerSticky = styles.position === "sticky";
    metrics.headerHeightPx = round(rect.height);
    metrics.brandWordmarkOnly =
      Boolean(brand && normalizeText(brand.textContent ?? "").length > 0) &&
      !brand?.querySelector("svg,img,picture");
    metrics.brandUsesGenericIcon = Boolean(
      brand?.querySelector("svg") &&
      /(gem|diamond|jewel|sparkle|star)/iu.test(brand.outerHTML),
    );
    metrics.desktopNavVisible =
      navs.length > 0 && Number(metrics.linkCount) >= 3;
    metrics.navVisibleLinkCount = Number(metrics.linkCount);
    metrics.hasSearchEntry = /search|\/search/iu.test(lower);
    metrics.hasCartEntry = /cart|bag|checkout|\/checkout/iu.test(lower);
    metrics.hasAccountEntry = /account|login|\/account/iu.test(lower);
    metrics.hasLocationEntry =
      /store|location|boutique|branch|\/branches/iu.test(lower);
    metrics.mobileNavTriggerVisible = buttons
      .filter(isVisibleElement)
      .some((button) =>
        /mobile-nav-trigger|nav-trigger|menu|navigation/iu.test(
          `${button.textContent ?? ""} ${
            button.getAttribute("aria-label") ?? ""
          } ${button.getAttribute("data-testid") ?? ""}`,
        ),
      );
  }

  return {
    captured: true,
    enoughData:
      rect.width > 0 &&
      rect.height > 0 &&
      (text.length > 0 || visibleFocusables.length > 0),
    metrics,
  };
};

export const benchmarkParts: BenchmarkPartConfig[] = [
  part(
    "header",
    "Header",
    ["global"],
    [
      "Header remains compact, utility-led, and measurable across three viewports.",
    ],
  ),
  part(
    "footer",
    "Footer",
    ["global"],
    [
      "Footer should expose support, legal, and brand recovery links without card-heavy chrome.",
    ],
  ),
  part(
    "floating-chrome",
    "Floating Chrome",
    ["product", "checkout"],
    [
      "Cookie, accessibility, and purchase chrome must avoid covering task controls.",
    ],
    { externalComparison: false },
  ),
  part(
    "route-hero",
    "Route Hero",
    ["category", "search", "service", "legal"],
    [
      "Task routes should keep heroes compact and avoid adjacent same-page CTA noise.",
    ],
  ),
  part(
    "plp",
    "PLP Search Gifts",
    ["category", "search", "gifts"],
    [
      "Listing routes should surface result summary, controls, and grids before editorial content.",
    ],
  ),
  part(
    "product-card",
    "Product Card",
    ["home", "category", "search", "gifts"],
    [
      "Product cards should keep media, product facts, price/status, and actions scannable.",
    ],
    { minReferenceSitesForConclusiveReport: 3 },
  ),
  part(
    "pdp",
    "PDP",
    ["product"],
    [
      "PDP should prioritize gallery, facts, availability, and purchasing controls.",
    ],
  ),
  part(
    "checkout",
    "Checkout",
    ["checkout"],
    [
      "Checkout is measured only through public cart and recovery surfaces, without payment submission.",
    ],
  ),
  part(
    "service-account",
    "Service Account",
    ["service", "account", "branches"],
    ["Service and account routes should expose task surfaces early."],
  ),
  part(
    "content-legal",
    "Content Legal",
    ["about", "faq", "privacy", "terms", "accessibility"],
    [
      "Content and legal routes should stay compact, readable, and recoverable.",
    ],
  ),
  part(
    "ai-stylist",
    "AI Stylist",
    ["ai", "stylist"],
    [
      "AI/stylist remains a demoted service capability with tool-first surfaces.",
    ],
  ),
];

function part(
  id: BenchmarkPartConfig["id"],
  title: string,
  targetKeys: Array<keyof typeof localTargetsByKey>,
  lessons: string[],
  options: Pick<
    BenchmarkPartConfig,
    "externalComparison" | "minReferenceSitesForConclusiveReport"
  > = {},
): BenchmarkPartConfig {
  return {
    externalComparison: options.externalComparison,
    extractor: publicSurfaceExtractor,
    id,
    lessons,
    localTargets: targetKeys.map((key) => localTargetsByKey[key]),
    metricDefinitions: getMetricDefinitionsForPart(id),
    minReferenceSitesForConclusiveReport:
      options.minReferenceSitesForConclusiveReport,
    recommendations: [
      "Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.",
      "Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.",
    ],
    resolveExternalUrl: (site) => site.sourceUrl,
    title,
  };
}

function getMetricDefinitionsForPart(id: BenchmarkPartConfig["id"]) {
  if (id === "header") return headerMetricDefinitions;
  if (id === "route-hero") return compactRouteHeroMetricDefinitions;
  if (id === "plp") return listingMetricDefinitions;

  return genericMetricDefinitions;
}
