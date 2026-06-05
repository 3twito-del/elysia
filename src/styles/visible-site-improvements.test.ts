import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("visible site improvement affordances", () => {
  it("keeps the search query clear action visible and route-backed", () => {
    const page = read("src/app/search/page.tsx");
    const controls = read("src/app/search/_components/search-controls.tsx");

    expect(page).toContain("clearSearchHref");
    expect(page).toContain(
      "createSearchHref({ mode: input.mode, view: viewMode })",
    );
    expect(controls).toContain('data-testid="search-clear-query"');
    expect(controls).toContain('aria-label="ניקוי חיפוש"');
    expect(controls).toContain("SearchClearQueryLink");
    expect(controls).toContain("scroll={false}");
  });

  it("keeps search category narrowing and no-results suggestions route-backed", () => {
    const search = read("src/app/search/page.tsx");

    expect(search).toContain("SearchCategoryChips");
    expect(search).toContain('data-testid="search-category-chips"');
    expect(search).toContain("SearchNoResultsSuggestions");
    expect(search).toContain(
      'data-testid="search-no-results-category-suggestions"',
    );
    expect(search).toContain("category: category.slug");
  });

  it("keeps search history visible, capped, clearable, and route-backed", () => {
    const controls = read("src/app/search/_components/search-controls.tsx");
    const historyList = read(
      "src/app/search/_components/search-history-list.tsx",
    );
    const history = read("src/lib/search-history.ts");

    expect(controls).toContain("<SearchHistoryList");
    expect(historyList).toContain('data-testid="search-history-list"');
    expect(historyList).toContain('data-testid="search-history-query"');
    expect(historyList).toContain('data-testid="search-history-clear"');
    expect(historyList).toContain("saveSearchHistoryQuery");
    expect(historyList).toContain("clearSearchHistoryQueries");
    expect(historyList).toContain("createSearchHistoryHref");
    expect(history).toContain("SEARCH_HISTORY_LIMIT = 6");
    expect(history).toContain("SEARCH_HISTORY_STORAGE_KEY");
    expect(history).toContain("subscribeToSearchHistory");
  });

  it("keeps the search loading route dense and layout-stable", () => {
    const loading = read("src/app/search/loading.tsx");

    expect(loading).toContain("DEFAULT_SEARCH_PER_PAGE");
    expect(loading).toContain('data-testid="search-loading-controls-skeleton"');
    expect(loading).toContain('data-testid="search-loading-card-skeletons"');
    expect(loading).toContain('data-testid="search-loading-card-skeleton"');
    expect(loading).toContain("ui-equal-grid");
    expect(loading).toContain("aspect-[5/4]");
    expect(loading).toContain("sm:aspect-[4/5]");
  });

  it("keeps the gifts page discovery chips visible and routed to search", () => {
    const gifts = read("src/app/gifts/page.tsx");

    expect(gifts).toContain("giftBudgetChips");
    expect(gifts).toContain("giftRecipientChips");
    expect(gifts).toContain("giftOccasionChips");
    expect(gifts).toContain('data-testid="gift-discovery-chips"');
    expect(gifts).toContain("GiftChipGroup");
    expect(gifts).toContain("/search?q=%D7%9E%D7%AA%D7%A0%D7%94");
  });

  it("keeps the gifts empty state from dead-ending shoppers", () => {
    const gifts = read("src/app/gifts/page.tsx");

    expect(gifts).toContain("<EmptyState");
    expect(gifts).toContain('testId="gifts-empty-state"');
    expect(gifts).toContain('data-testid="gifts-empty-state-reset"');
    expect(gifts).toContain('href="/gifts"');
    expect(gifts).toContain("products.length > 0");
  });

  it("keeps gift product budget callouts visible when price data supports them", () => {
    const gifts = read("src/app/gifts/page.tsx");

    expect(gifts).toContain("giftBudgetThresholds");
    expect(gifts).toContain("getGiftBudgetContextLabel(product)");
    expect(gifts).toContain(
      "contextLabel={getGiftBudgetContextLabel(product)}",
    );
    expect(gifts).toContain("product.price <= budget");
    expect(gifts).toContain("formatInlinePrice(threshold)");
  });

  it("keeps gift bundle recommendations explicit and item-specific", () => {
    const gifts = read("src/app/gifts/page.tsx");

    expect(gifts).toContain("getGiftBundlePairs(products)");
    expect(gifts).toContain('data-testid="gift-bundle-recommendations"');
    expect(gifts).toContain('data-testid="gift-bundle-pair"');
    expect(gifts).toContain("products: [CatalogProduct, CatalogProduct]");
    expect(gifts).toContain('contextLabel="חלק משילוב מתנה"');
    expect(gifts).toContain("categoryProducts.length < 2");
  });

  it("keeps the home mobile hero and account entry readable without blocking browsing", () => {
    const accountPage = read("src/app/account/page.tsx");
    const home = read("src/app/page.tsx");
    const styles = read("src/styles/globals.css");

    expect(home).toContain("home-cinematic-hero");
    expect(styles).toContain(".home-cinematic-hero");
    expect(styles).toContain("clamp(36rem, 92svh, 54rem)");
    expect(home).toContain('data-testid="home-hero-copy"');
    expect(home).toContain('data-testid="home-hero-statement"');
    expect(home).toContain('data-testid="home-hero-primary-cta"');
    expect(home).toContain("prelaunch-hero");
    expect(home).toContain("max-w-[min(38rem,calc(100vw-2.5rem))]");
    expect(home).toContain("sm:max-w-[min(40rem,42vw)]");
    expect(home).toContain("home-hero-statement motion-copy-item");
    expect(home).toContain('data-testid="home-hero-cta-row"');
    expect(home).toContain('data-testid="home-hero-secondary-line"');
    expect(home).toContain('href="#waitlist"');
    expect(home).not.toContain('data-testid="home-hero-trust-notes"');
    expect(home).not.toContain("home-hero-help-cta");
    expect(accountPage).toContain('id="account-login"');
    expect(accountPage).toContain("<CustomerOtpForm />");
    expect(accountPage).toContain('id="account-benefits"');
    expect(accountPage).toContain("MetricCard");
    expect(accountPage).toContain("PackageCheck");
    expect(accountPage).toContain("Heart");
    expect(accountPage).toContain("Ruler");
    expect(accountPage).toContain("ShieldCheck");
  });

  it("keeps FAQ topic filters visible above grouped answers", () => {
    const faq = read("src/app/faq/page.tsx");

    expect(faq).toContain('data-testid="faq-topic-filter-list"');
    expect(faq).toContain("faqGroups.map((group, index)");
    expect(faq).toContain("#faq-group-${index + 1}");
    expect(faq).toContain('id="faq-groups"');
  });

  it("keeps the branches online-only status explicit", () => {
    const branches = read("src/app/branches/page.tsx");

    expect(branches).toContain('data-testid="branches-online-status-banner"');
    expect(branches).toContain('data-testid="branches-online-only-state"');
    expect(branches).toContain(
      'data-testid="branches-online-service-continuity"',
    );
    expect(branches).toContain('data-testid="branches-contact-channel-cards"');
    expect(branches).toContain('data-testid="branches-map-placeholder"');
    expect(branches).toContain("profile.settings.serviceEmail");
  });

  it("keeps the size guide measurement overview and print ruler visible", () => {
    const sizeGuide = read("src/app/size-guide/page.tsx");
    const sizeGuideTool = read(
      "src/app/size-guide/_components/size-guide-tool.tsx",
    );

    expect(sizeGuide).toContain("printRulerTicks");
    expect(sizeGuide).toContain("sizeMeasurementSteps");
    expect(sizeGuide).toContain(
      'data-testid="size-guide-measurement-overview"',
    );
    expect(sizeGuide).toContain('data-testid="size-guide-print-ruler"');
    expect(sizeGuideTool).toContain('data-testid="size-guide-unit-toggle"');
    expect(sizeGuideTool).toContain('data-testid="size-guide-unit-summary"');
    expect(sizeGuideTool).toContain("getSizeGuideUnitOptions");
    expect(sizeGuideTool).toContain("formatSizeGuideMeasurement");
    expect(sizeGuideTool).toContain("formatRingMeasurementAsUs");
  });

  it("keeps service topic cards and response expectations visible", () => {
    const service = read("src/app/service/page.tsx");
    const serviceActions = read("src/app/service/actions.ts");
    const serviceForm = read(
      "src/app/service/_components/service-request-form.tsx",
    );

    expect(service).toContain('data-testid="service-topic-cards"');
    expect(service).toContain('data-testid="service-response-time-note"');
    expect(service).toContain("/service?topic=${topic.slug}#service-form");
    expect(service).toContain("defaultTopicSlug");
    expect(service).toContain("serviceEmail={profile.settings.serviceEmail}");
    expect(serviceActions).toContain("requestReference");
    expect(serviceActions).toContain("createServiceRequestReference");
    expect(serviceForm).toContain(
      'data-testid="service-request-success-reference"',
    );
    expect(serviceForm).toContain(
      'data-testid="service-request-success-contact-link"',
    );
    expect(serviceForm).toContain("serviceReferenceMailto");
  });

  it("keeps about timeline, material facts, and care routing visible", () => {
    const about = read("src/app/about/page.tsx");

    expect(about).toContain("brandTimeline");
    expect(about).toContain("materialFacts");
    expect(about).toContain('data-testid="about-brand-timeline"');
    expect(about).toContain('data-testid="about-material-facts"');
    expect(about).toContain('data-testid="about-care-teaser"');
    expect(about).toContain("/faq#faq-group-2");
    expect(about).toContain("/service?topic=general");
  });

  it("keeps header split actions, footer policy, and social labels visible", () => {
    const cart = read("src/components/cart-count-link.tsx");
    const footer = read("src/components/site-footer.tsx");
    const header = read("src/components/site-header.tsx");
    const styles = read("src/styles/globals.css");

    expect(header).toContain('dir="rtl"');
    expect(header).toContain('triggerLabel="תפריט"');
    expect(header).toContain('aria-label="חיפוש"');
    expect(header).toContain('aria-label="צרו קשר"');
    expect(header).toContain('href="/account#account-wishlist"');
    expect(header).toContain("const prelaunchNavItems = [");
    expect(header).toContain('aria-label="Pre-launch navigation"');
    expect(header).toContain('data-home-prelaunch={isHome ? "true"');
    expect(header).toContain('data-icon-tooltip="מועדפים"');
    expect(header).toContain('data-icon-tooltip="אזור אישי"');
    expect(header).not.toContain("CartCountLink");
    expect(header).not.toContain("desktopNavItems");
    expect(header).toContain("HOME_HEADER_SOLID_SCROLL_Y");
    expect(header).toContain("setHasScrolled");
    expect(header).toContain('window.addEventListener("scroll"');
    expect(header).toContain("data-header-state={headerState}");
    expect(styles).toContain('.site-header[data-header-state="solid"]');
    expect(styles).toContain("background: var(--background);");
    expect(styles).toContain(".site-header .site-header-label-action");
    expect(cart).toContain(
      'data-cart-state={itemCount > 0 ? "filled" : "empty"}',
    );
    expect(cart).not.toContain('data-testid="cart-count-empty-state"');
    expect(cart).toContain("cart-count-badge");
    expect(cart).toContain('itemCount > 99 ? "99+" : itemCount');
    expect(footer).toContain('data-testid="footer-policy-heading"');
    expect(footer).toContain("min-h-10 items-center");
    expect(footer).toContain("data-icon-tooltip={item.label}");
    expect(footer).toContain("title={item.label}");
  });

  it("keeps mobile navigation grouped, active, and closable", () => {
    const mobileNav = read("src/components/mobile-nav.tsx");
    const sheet = read("src/components/ui/sheet.tsx");

    expect(mobileNav).toContain("const quickActions = [");
    expect(mobileNav).toContain("const spotlightActions = [");
    expect(mobileNav).toContain("const serviceActions = [");
    expect(mobileNav).toContain("mobile-nav-panel-luxury");
    expect(mobileNav).toContain('data-nav-variant="luxury-editorial"');
    expect(mobileNav).toContain("mobile-nav-quick-list");
    expect(mobileNav).toContain("const catalogItems = items.slice(0, 4)");
    expect(mobileNav).toContain("const editorialItems = items");
    expect(mobileNav).toContain("RECENTLY_VIEWED_STORAGE_KEY");
    expect(mobileNav).toContain("useCookieConsentValue");
    expect(mobileNav).toContain("getRecentlyViewedProductHref");
    expect(mobileNav).toContain(
      'data-testid="mobile-nav-recently-viewed-shortcut"',
    );
    expect(mobileNav).toContain('aria-current={isActive ? "page" : undefined}');
    expect(mobileNav).toContain("currentPathname === item.href");
    expect(mobileNav).toContain("currentPathname.startsWith(`${item.href}/`)");
    expect(mobileNav).toContain("after:h-px");
    expect(mobileNav).toContain('data-testid="mobile-nav-close"');
    expect(mobileNav).toContain('className="mobile-nav-close"');
    expect(mobileNav).toContain("<SheetClose asChild>");
    expect(mobileNav).toContain("closeOnMediaQuery");
    expect(mobileNav).toContain("const closeNav = () => setOpen(false)");
    expect(sheet).toContain("onOpenChange={handleOpenChange}");
  });

  it("keeps newsletter responses inline and footer-mounted", () => {
    const footer = read("src/components/site-footer.tsx");
    const newsletter = read("src/components/newsletter-form.tsx");

    expect(footer).toContain("<NewsletterForm />");
    expect(newsletter).toContain("newsletterStatusId");
    expect(newsletter).toContain("newsletterOfflineStatusId");
    expect(newsletter).toContain("aria-describedby={newsletterDescription}");
    expect(newsletter).toContain("const hasNewsletterError");
    expect(newsletter).toContain("if (hasNewsletterError)");
    expect(newsletter).toContain("state.message ? (");
    expect(newsletter).toContain("offlineState.message ? (");
    expect(newsletter).toContain("<StatusMessage");
    expect(newsletter).toContain('variant="plain"');
    expect(newsletter).toContain('tone={state.ok ? "success" : "error"}');
    expect(newsletter).toContain(
      'tone={offlineState.ok ? "success" : "error"}',
    );
  });

  it("keeps category browse, filter, empty, and editorial cues visible", () => {
    const category = read("src/app/category/[slug]/page.tsx");
    const filterPanel = read(
      "src/app/category/[slug]/_components/deferred-category-filter-panel.tsx",
    );
    const paginationLink = read(
      "src/app/category/[slug]/_components/category-pagination-link.tsx",
    );

    expect(category).toContain('data-testid="category-breadcrumbs"');
    expect(category).toContain('data-testid="category-result-count"');
    expect(category).toContain('data-testid="category-current-sort-label"');
    expect(category).toContain(
      'data-testid="category-active-refinement-summary"',
    );
    expect(category).toContain('data-testid="category-active-refinement-list"');
    expect(category).toContain('data-testid="category-filter-sheet-summary"');
    expect(category).toContain('testId="category-empty-state"');
    expect(category).toContain('data-testid="category-recovery-actions"');
    expect(category).toContain('data-testid="category-search-recovery-link"');
    expect(category).toContain('data-testid="category-editorial-care-note"');
    expect(filterPanel).toContain(
      'data-testid="category-filter-selection-summary"',
    );
    expect(filterPanel).toContain(
      'data-testid="category-filter-section-current"',
    );
    expect(filterPanel).toContain('data-testid="category-price-filter-labels"');
    expect(category).toContain("CategoryPaginationLink");
    expect(category).toContain('testId="category-pagination-next"');
    expect(paginationLink).toContain(
      'data-loading={isLoading ? "true" : "false"}',
    );
    expect(paginationLink).toContain("aria-busy={isLoading}");
    expect(paginationLink).toContain("setIsLoading(true)");
    expect(paginationLink).toContain("event.preventDefault()");
  });

  it("keeps PDP gallery, purchase, recommendations, and card stability visible", () => {
    const favorite = read("src/components/product-card-favorite-button.tsx");
    const gallery = read(
      "src/app/product/[slug]/_components/product-gallery.tsx",
    );
    const productCard = read("src/components/product-card.tsx");
    const productPage = read("src/app/product/[slug]/page.tsx");
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );
    const purchaseUtils = read(
      "src/app/product/[slug]/_components/product-purchase-utils.ts",
    );
    const recentlyViewed = read(
      "src/app/product/[slug]/_components/recently-viewed-products.tsx",
    );
    const recommendationRails = read(
      "src/app/product/[slug]/_lib/product-recommendation-rails.ts",
    );
    const styles = read("src/styles/globals.css");

    expect(gallery).toContain('thumbnailTestId: "product-gallery-thumbnail"');
    expect(gallery).toContain("data-gallery-selected=");
    expect(gallery).toContain("aria-current={activeImageIndex === index}");
    expect(gallery).toContain("aria-pressed={activeImageIndex === index}");
    expect(gallery).toContain(
      'data-testid="product-gallery-fullscreen-trigger"',
    );
    expect(gallery).toContain(
      'data-testid="product-gallery-touch-zoom-trigger"',
    );
    expect(gallery).toContain(
      'data-testid="product-gallery-fullscreen-dialog"',
    );
    expect(gallery).toContain('data-testid="product-gallery-fullscreen-stage"');
    expect(gallery).toContain(
      'data-testid="product-gallery-fullscreen-zoom-toggle"',
    );
    expect(gallery).toContain('testId: "product-gallery-thumbnail-rail"');
    expect(gallery).toContain('data-testid="product-gallery-previous"');
    expect(gallery).toContain('data-testid="product-gallery-next"');
    expect(gallery).toContain("data-gallery-zoomed=");
    expect(gallery).toContain("aria-pressed={isViewerZoomed}");
    expect(gallery).toContain("<DialogTrigger asChild>");
    expect(gallery).toContain("DialogContent");
    expect(gallery).toContain("מסך מלא");
    expect(gallery).not.toContain('data-testid="product-gallery-zoom-trigger"');
    expect(gallery).not.toContain('data-testid="product-gallery-zoom-dialog"');
    expect(gallery).toContain('"border-foreground ring-foreground ring-1"');
    expect(gallery).toContain("handleThumbnailKeyDown");
    expect(purchasePanel).toContain("getSizeGuideHref(sizeKind");
    expect(purchasePanel).toContain('data-testid="product-variant-feedback"');
    expect(purchasePanel).toContain('data-testid="product-cart-checkout-link"');
    expect(purchasePanel).toContain("getVariantButtonLabel(");
    expect(purchasePanel).toContain("variant.availableQuantity <= 0");
    expect(purchaseUtils).toContain("getPublicStockStatusLabel");
    expect(purchaseUtils).toContain("return `${getVariantDisplayName");
    expect(purchasePanel).toContain(
      'data-testid="product-sticky-add-to-cart-button"',
    );
    expect(purchasePanel).toContain('data-public-floating-bar="true"');
    expect(purchasePanel).toContain(
      "createPortal(stickyPurchaseBar, document.body)",
    );
    expect(favorite).toContain("aria-pressed={isSaved}");
    expect(favorite).toContain('isSaved && "fill-current"');
    expect(favorite).toContain("subscribeToGuestWishlist");
    expect(favorite).toContain("removeGuestWishlistItem(productSlug)");
    expect(favorite).toContain('data-testid="product-card-favorite-feedback"');
    expect(favorite).toContain("הוסר מהמועדפים בדפדפן זה");
    expect(productPage).toContain("createProductServiceHref");
    expect(productPage).toContain("getPublicProductName");
    expect(productPage).toContain("getPublicCollectionName");
    expect(productPage).toContain('data-testid="product-media-caption"');
    expect(productPage).toContain(
      'data-testid="product-price-availability-row"',
    );
    expect(productPage).toContain(
      'data-testid="product-delivery-estimate-badge"',
    );
    expect(productPage).toContain('data-testid="product-support-context-link"');
    expect(productPage).toContain("<details");
    expect(productPage).toContain("<summary");
    expect(productPage).toContain("group-open:rotate-180");
    expect(productPage).toContain("rail.reason");
    expect(productPage).toContain("contextLabel={rail.cardContextLabel}");
    expect(productPage).toContain(
      'data-testid="product-recommendation-rail-context"',
    );
    expect(recommendationRails).toContain("reason:");
    expect(recommendationRails).toContain("cardContextLabel:");
    expect(recentlyViewed).toContain('data-testid="recently-viewed-products"');
    expect(recentlyViewed).toContain(".filter((slug) => slug !== currentSlug)");
    expect(recentlyViewed).toContain(
      'data-layout-equal-group="recently-viewed-products"',
    );
    expect(productCard).toContain("relative aspect-[5/4] overflow-hidden");
    expect(productCard).toContain("sm:aspect-[4/5]");
    expect(productCard).toContain('data-testid="product-card-image-skeleton"');
    expect(productCard).toContain('data-testid="product-card-badge"');
    expect(productCard).toContain('data-testid="product-card-material-cues"');
    expect(productCard).toContain('data-testid="product-card-price"');
    expect(productCard).toContain("<ProductCardQuickAddButton");
    expect(productCard).toContain("product-card-hover-image");
    expect(productCard).toContain("ui-equal-item product-card-shell");
    expect(productCard).toContain("ui-text-slot product-card-title");
    expect(productCard).toContain('dir="auto"');
    expect(styles).toContain(
      ".product-card-title,\n.product-title-mixed-script",
    );
    expect(styles).toContain("overflow-wrap: anywhere;");
    expect(styles).toContain("unicode-bidi: plaintext;");
  });

  it("keeps checkout progress, editing, validation, mobile total, and recovery visible", () => {
    const checkoutDisplay = read(
      "src/app/checkout/_components/checkout-display.ts",
    );
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );
    const checkoutStatus = read(
      "src/app/checkout/_components/checkout-status.tsx",
    );

    expect(checkoutForm).toContain('data-testid="checkout-progress-steps"');
    expect(checkoutForm).toContain("checkoutProgressSteps.map");
    expect(checkoutForm).toContain('<CheckoutStepBadge value="1" />');
    expect(checkoutForm).toContain('<CheckoutStepBadge value="2" />');
    expect(checkoutForm).toContain('<CheckoutStepBadge value="3" />');
    expect(checkoutForm).toContain('<CheckoutStepBadge value="4" />');
    expect(checkoutForm).toContain("cart.updateItem");
    expect(checkoutForm).toContain("cart.removeItem");
    expect(checkoutForm).toContain('data-testid="checkout-line-total"');
    expect(checkoutForm).toContain('aria-live="polite"');
    expect(checkoutForm).toContain('id="city"');
    expect(checkoutForm).toContain('id="street"');
    expect(checkoutForm).toContain('autoComplete="address-level2"');
    expect(checkoutForm).toContain('autoComplete="street-address"');
    expect(checkoutForm).toContain(
      'data-testid="checkout-delivery-confidence-summary"',
    );
    expect(checkoutForm).toContain("getCheckoutFulfillmentSummaryRows");
    expect(checkoutDisplay).toContain('key: "delivery"');
    expect(checkoutDisplay).toContain('key: "supplier"');
    expect(checkoutForm).toContain("CheckoutPaymentStatus");
    expect(checkoutForm).toContain("checkoutPaymentStatusKind");
    expect(checkoutStatus).toContain('data-testid="checkout-payment-status"');
    expect(checkoutStatus).toContain("data-payment-status={status}");
    expect(checkoutStatus).toContain('"loading"');
    expect(checkoutStatus).toContain('"retry"');
    expect(checkoutStatus).toContain('"unavailable"');
    expect(checkoutForm).toContain("checkoutFieldFocusOrder");
    expect(checkoutForm).toContain("function focusFirstCheckoutError()");
    expect(checkoutForm).toContain('data-testid="checkout-validation-summary"');
    expect(checkoutForm).toContain("couponFeedbackMessage");
    expect(checkoutForm).toContain('testId="checkout-coupon-status"');
    expect(checkoutForm).toContain('id="checkout-coupon-status"');
    expect(checkoutForm).toContain("<FieldError");
    expect(checkoutForm).toContain('data-testid="mobile-checkout-summary"');
    expect(checkoutForm).toContain('data-public-floating-bar="true"');
    expect(checkoutForm).toContain(
      "createPortal(mobileCheckoutBar, document.body)",
    );
    expect(checkoutForm).toContain('data-testid="checkout-empty-cart"');
    expect(checkoutForm).toContain("checkoutEmptyLinks.map");
    expect(checkoutForm).toContain('href: "/category/rings"');
    expect(checkoutForm).toContain('href: "/gifts"');
    expect(checkoutForm).toContain('href="/search"');
    expect(checkoutForm).toContain('href="/service"');
    expect(checkoutForm).toContain('data-testid="checkout-order-note-hint"');
    expect(checkoutForm).toContain(
      'aria-describedby="checkout-order-note-hint"',
    );
  });

  it("keeps account order, privacy, and profile status surfaces visible", () => {
    const accountPage = read("src/app/account/page.tsx");
    const addressForm = read(
      "src/app/account/_components/customer-address-form.tsx",
    );
    const orderPage = read("src/app/account/orders/[id]/page.tsx");
    const privacyActions = read(
      "src/app/account/_components/customer-privacy-actions.tsx",
    );
    const privacyExportRoute = read("src/app/account/privacy/export/route.ts");
    const savedSizesForm = read(
      "src/app/account/_components/customer-saved-sizes-form.tsx",
    );

    expect(accountPage).toContain('data-testid="account-local-order"');
    expect(accountPage).toContain('data-testid="account-shopify-mirror-order"');
    expect(accountPage).toContain("getOrderStatusLabel(order.status)");
    expect(accountPage).toContain("formatPrice(Number(order.total))");
    expect(accountPage).toContain('data-testid="account-local-order-timeline"');
    expect(accountPage).toContain('data-testid="account-shopify-service-link"');
    expect(orderPage).toContain('data-testid="order-status-timeline"');
    expect(accountPage).toContain('testId="account-empty-orders"');
    expect(accountPage).toContain('href="/gifts"');
    expect(accountPage).toContain('href="/search"');
    expect(accountPage).toContain("<CustomerPrivacyActions />");
    expect(privacyActions).toContain(
      'data-testid="account-privacy-shortcut-context"',
    );
    expect(privacyActions).toContain('href="/account/privacy/export"');
    expect(privacyExportRoute).toContain("assertRateLimit");
    expect(privacyExportRoute).toContain("privacyExportUnauthorizedJson");
    expect(privacyExportRoute).toContain("customer_data_exported");
    expect(addressForm).toContain("<StatusMessage");
    expect(addressForm).toContain('variant="plain"');
    expect(savedSizesForm).toContain('data-testid="account-saved-sizes-form"');
    expect(savedSizesForm).toContain("<StatusMessage");
    expect(savedSizesForm).toContain('variant="plain"');
  });

  it("keeps service attachment guidance and FAQ handoff states visible", () => {
    const faq = read("src/app/faq/page.tsx");
    const serviceForm = read(
      "src/app/service/_components/service-request-form.tsx",
    );
    const serviceValidation = read("src/lib/service-validation.ts");

    expect(serviceForm).toContain("getServiceRequestAttachmentPolicy");
    expect(serviceForm).toContain("attachmentGuidanceId");
    expect(serviceForm).toContain("attachmentOfflineGuidanceId");
    expect(serviceForm).toContain('data-testid="service-attachment-review"');
    expect(serviceForm).toContain(
      'accept={attachmentPolicy.acceptedFileTypes.join(",")}',
    );
    expect(serviceForm).toContain("selectedAttachmentCount");
    expect(serviceValidation).toContain("acceptedFileTypes");
    expect(serviceValidation).toContain("maxFileSizeMb");
    expect(faq).toContain("<details");
    expect(faq).toContain("<summary");
    expect(faq).toContain("group-open:rotate-180");
    expect(faq).toContain("focus-visible:ring-3");
    expect(faq).toContain('data-testid="faq-service-recovery-link"');
    expect(faq).toContain('href="/service?topic=general"');
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
