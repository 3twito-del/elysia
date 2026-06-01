import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import {
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { SearchControls } from "~/app/search/_components/search-controls";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { getPublicProductCommerceStatus } from "~/lib/commerce-labels";
import { formatInlinePrice, formatPrice } from "~/lib/format";
import { cn } from "~/lib/utils";
import { db } from "~/server/db";
import {
  DEFAULT_SEARCH_PER_PAGE,
  searchProvider,
  type ProductSearchInput,
} from "~/server/adapters/search";
import {
  getCatalogCategories,
  getCatalogFacets,
  type CatalogCategory,
  type CatalogProduct,
} from "~/server/services/catalog";
import { shouldUseCatalogFixtures } from "~/server/services/catalog-fixtures";
import {
  createProductSearchHref,
  createSearchHref,
  dedupeRecoveryCandidates,
  getActiveSearchRefinementCount,
  getPaginationPages,
  normalizeSearchInput,
  normalizeSearchView,
  type SearchHrefInput,
  type SearchParams,
  type SearchViewMode,
} from "./_lib/search-state";

type SearchPageProps = {
  searchParams: Promise<SearchParams>;
};

type ActiveSearchFilter = {
  key: keyof ProductSearchInput;
  label: string;
  href: string;
};

type SearchRecoveryAction = {
  description: string;
  href: string;
  label: string;
  total: number;
};

const SEARCH_RESULT_IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='10'%20height='8'%20viewBox='0%200%2010%208'%3E%3Crect%20width='10'%20height='8'%20fill='%23eef6f7'/%3E%3C/svg%3E";

export const metadata = {
  title: "חיפוש במבחר",
  description: "חיפוש תכשיטי Elysia לפי קטגוריה, חומר, מחיר וזמינות.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Elysia | חיפוש תכשיטים",
    description: "סינון וחיפוש במבחר התכשיטים של Elysia.",
    url: "/search",
    images: [{ url: "/brand/v2/editorial-home.avif" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia | חיפוש תכשיטים",
    description: "סינון וחיפוש במבחר התכשיטים של Elysia.",
    images: ["/brand/v2/editorial-home.avif"],
  },
};

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [categories, facets] = await Promise.all([
    getCatalogCategories(),
    getCatalogFacets(),
  ]);
  const input = normalizeSearchInput(params, { categories, facets });
  const viewMode = normalizeSearchView(params.view);
  const result = await searchProvider.searchProducts(input);
  const activeFilters = getActiveSearchFilters(input, categories, viewMode);
  const hasActiveFilters = activeFilters.length > 0;
  const activeRefinementCount = getActiveSearchRefinementCount(input);
  const hasActiveRefinements = activeRefinementCount > 0;
  const clearFiltersHref = createSearchHref({
    query: input.query,
    mode: input.mode,
    page: undefined,
    view: viewMode,
  });
  const resetAllHref = createSearchHref({ mode: input.mode, view: viewMode });
  const recoveryActions =
    result.total === 0 ? await getSearchRecoveryActions(input, viewMode) : [];
  const firstCategory = categories[0];
  const visibleStart =
    result.total > 0 ? (result.page - 1) * result.perPage + 1 : 0;
  const visibleEnd = Math.min(result.page * result.perPage, result.total);
  const resultSummary =
    result.total === 1
      ? "נמצאה תוצאה אחת"
      : result.total > 0
        ? `מציגים ${visibleStart}-${visibleEnd} מתוך ${result.total} תוצאות`
        : "לא נמצאו תוצאות";

  const resultDetail =
    result.total > 0
      ? `עמוד ${result.page} מתוך ${result.totalPages} · ${result.perPage} תוצאות בעמוד`
      : recoveryActions.length > 0
        ? "נמצאו כיוונים פתוחים יותר"
        : "אפשר לנקות בחירות או לעבור למבחר המלא";
  after(() => recordSearchEvent(input, result.total));

  return (
    <>
      <SiteHeader />

      <main>
        <CommercePageHero
          description="חיפוש במבחר עם סינון לפי קטגוריה, חומר, אבן, מחיר ורלוונטיות."
          eyebrow="מבחר Elysia"
          title="חיפוש במבחר"
          variant="catalog"
        />
        <RevealSection
          className="mx-auto w-full max-w-[96rem] px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:px-[var(--ui-page-x-wide)] lg:py-[var(--ui-section-y)]"
          id="search-controls"
        >
          <SearchControls
            activeFilterCount={activeRefinementCount}
            categories={categories}
            clearFiltersHref={clearFiltersHref}
            facets={facets}
            input={input}
            viewMode={viewMode}
          />

          {hasActiveFilters ? (
            <section
              aria-label="סינונים פעילים"
              className="mt-4 border-y border-[var(--glass-border)] py-3 text-sm"
              data-testid="search-active-refinement-summary"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">
                    {formatActiveSelectionCount(activeFilters.length)}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {formatActiveSelectionPreview(activeFilters)}
                  </p>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href={resetAllHref} scroll={false}>
                    {"\u05d0\u05d9\u05e4\u05d5\u05e1 \u05d4\u05db\u05dc"}
                  </Link>
                </Button>
              </div>
              <div
                className="mt-3 flex flex-wrap items-center gap-1.5"
                data-testid="search-active-refinement-list"
              >
                {activeFilters.map((filter) => (
                  <Badge
                    asChild
                    className="h-8 max-w-full gap-1 pr-3 pl-2"
                    key={filter.key}
                    variant="outline"
                  >
                    <Link href={filter.href} scroll={false}>
                      <span className="min-w-0 truncate">{filter.label}</span>
                      <X aria-hidden="true" className="size-3 shrink-0" />
                      <span className="sr-only">הסרת סינון</span>
                    </Link>
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          <section
            aria-labelledby="search-results"
            className="mt-4 border-b border-[var(--glass-border)] pb-4 sm:mt-6"
            data-testid="search-results-summary"
            id="search-results-section"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-medium" id="search-results">
                  {resultSummary}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {input.query
                    ? `עבור "${input.query}"`
                    : hasActiveFilters
                      ? "לפי הבחירה הפעילה"
                      : "כל התוצאות במבחר."}
                </p>
                <p
                  className="text-muted-foreground mt-1 text-xs"
                  data-testid="search-result-count"
                >
                  {resultDetail}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  מיון: {getSortLabel(input.sort ?? "relevance")} · תצוגה:{" "}
                  {getSearchViewLabel(viewMode)} ·{" "}
                  {result.mode === "semantic"
                    ? "\u05d7\u05d9\u05e4\u05d5\u05e9 \u05d7\u05db\u05dd"
                    : "\u05d7\u05d9\u05e4\u05d5\u05e9 \u05e7\u05dc\u05d0\u05e1\u05d9"}
                </p>
                {result.activeSemanticSignals.length > 0 ? (
                  <div
                    aria-label="\u05e4\u05d9\u05e8\u05d5\u05e9 \u05d7\u05d9\u05e4\u05d5\u05e9 \u05d7\u05db\u05dd"
                    className="mt-3 flex flex-wrap gap-2"
                    data-testid="semantic-search-signals"
                  >
                    {result.activeSemanticSignals.slice(0, 6).map((signal) => (
                      <Badge className="gap-1" key={signal} variant="secondary">
                        <Sparkles aria-hidden="true" className="size-3" />
                        <span>{signal}</span>
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SearchModeToggle input={input} viewMode={viewMode} />
                <SearchViewToggle input={input} viewMode={viewMode} />
                {hasActiveFilters ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      href={
                        hasActiveRefinements ? clearFiltersHref : resetAllHref
                      }
                      scroll={false}
                    >
                      איפוס
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          {result.hits.length === 0 ? (
            <EmptyState
              className="mt-6 sm:mt-10"
              description={
                <>
                  אפשר לנקות את הבחירה, לעבור למשפחת תכשיטים פתוחה, או להרחיב את
                  החיפוש בכל המבחר.
                </>
              }
              icon={Search}
              testId="search-empty-state"
              title="לא נמצאו תוצאות"
              actions={
                <>
                  {recoveryActions.length > 0 ? (
                    <>
                      <div
                        className="text-muted-foreground mx-auto mb-2 grid max-w-md basis-full gap-2 text-sm leading-6 sm:text-start"
                        data-testid="search-guided-recovery"
                      >
                        <p className="text-foreground font-medium">
                          כיווני המשך עם תוצאות
                        </p>
                        <ul className="grid gap-1.5">
                          {recoveryActions.map((action) => (
                            <li
                              className="grid gap-0.5"
                              key={`${action.href}-guidance`}
                            >
                              <span className="text-foreground font-medium">
                                {action.label}
                              </span>
                              <span>{action.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <span
                        className="contents"
                        data-testid="search-recovery-actions"
                      >
                        {recoveryActions.map((action) => (
                          <Button asChild key={action.href} variant="outline">
                            <Link href={action.href} scroll={false}>
                              <span>{action.label}</span>
                              <span className="text-xs opacity-75">
                                {formatSearchResultCount(action.total)}
                              </span>
                            </Link>
                          </Button>
                        ))}
                      </span>
                    </>
                  ) : null}
                  {hasActiveFilters ? (
                    <Button asChild variant="outline">
                      <Link href={resetAllHref} scroll={false}>
                        איפוס חיפוש
                      </Link>
                    </Button>
                  ) : null}
                  {firstCategory ? (
                    <Button asChild variant="outline">
                      <Link href={`/category/${firstCategory.slug}`}>
                        {firstCategory.name}
                      </Link>
                    </Button>
                  ) : null}
                </>
              }
            />
          ) : viewMode === "list" ? (
            <>
              <RevealGrid
                className="mt-5 grid gap-3 sm:mt-8"
                data-testid="search-results-list"
                variant="compact"
              >
                {result.hits.map((product, index) => (
                  <SearchResultListItem
                    imagePriority={index < 2}
                    key={product.slug}
                    product={product}
                    searchContext={{
                      position: (result.page - 1) * result.perPage + index,
                      query: input.query,
                    }}
                  />
                ))}
              </RevealGrid>

              <SearchPagination
                currentPage={result.page}
                input={input}
                totalPages={result.totalPages}
                viewMode={viewMode}
              />
            </>
          ) : (
            <>
              <RevealGrid
                className="mt-5 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4"
                data-testid="search-results-grid"
                variant="cards"
              >
                {result.hits.map((product, index) => (
                  <ProductCard
                    imagePriority={index < 4}
                    imageSizes="(min-width: 1280px) 18rem, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    key={product.slug}
                    product={product}
                    searchContext={{
                      position: (result.page - 1) * result.perPage + index,
                      query: input.query,
                    }}
                  />
                ))}
              </RevealGrid>

              <SearchPagination
                currentPage={result.page}
                input={input}
                totalPages={result.totalPages}
                viewMode={viewMode}
              />
            </>
          )}
        </RevealSection>
      </main>
    </>
  );
}

function SearchModeToggle({
  input,
  viewMode,
}: {
  input: ProductSearchInput;
  viewMode: SearchViewMode;
}) {
  const isClassic = input.mode === "classic";
  const nextMode = isClassic ? "semantic" : "classic";
  const href = createSearchHref({
    ...input,
    mode: nextMode === "classic" ? "classic" : undefined,
    page: undefined,
    view: viewMode,
  });

  return (
    <Button asChild size="sm" variant={isClassic ? "outline" : "secondary"}>
      <Link
        aria-label={
          isClassic
            ? "\u05de\u05e2\u05d1\u05e8 \u05dc\u05d7\u05d9\u05e4\u05d5\u05e9 \u05d7\u05db\u05dd"
            : "\u05de\u05e2\u05d1\u05e8 \u05dc\u05d7\u05d9\u05e4\u05d5\u05e9 \u05e7\u05dc\u05d0\u05e1\u05d9"
        }
        className="gap-1.5"
        href={href}
        scroll={false}
      >
        <Sparkles aria-hidden="true" className="size-3.5" />
        <span>
          {isClassic
            ? "\u05d7\u05d9\u05e4\u05d5\u05e9 \u05e7\u05dc\u05d0\u05e1\u05d9"
            : "\u05d7\u05d9\u05e4\u05d5\u05e9 \u05d7\u05db\u05dd"}
        </span>
      </Link>
    </Button>
  );
}

function SearchViewToggle({
  input,
  viewMode,
}: {
  input: ProductSearchInput;
  viewMode: SearchViewMode;
}) {
  const views = [
    {
      href: createSearchHref({ ...input, page: undefined, view: "grid" }),
      icon: Grid2X2,
      label: "תמונות",
      value: "grid" as const,
    },
    {
      href: createSearchHref({ ...input, page: undefined, view: "list" }),
      icon: List,
      label: "רשימה",
      value: "list" as const,
    },
  ];

  return (
    <div
      aria-label="מצב תצוגה"
      className="glass-control flex h-8 items-center gap-1 rounded-md border p-1"
      role="group"
    >
      {views.map((view) => {
        const Icon = view.icon;
        const active = viewMode === view.value;

        return (
          <Button
            asChild
            className="h-6 gap-1 px-2"
            key={view.value}
            size="sm"
            variant={active ? "secondary" : "ghost"}
          >
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={`תצוגת ${view.label}`}
              aria-pressed={active}
              href={view.href}
              scroll={false}
            >
              <Icon aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">{view.label}</span>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

function SearchResultListItem({
  imagePriority,
  product,
  searchContext,
}: {
  imagePriority?: boolean;
  product: CatalogProduct;
  searchContext?: {
    query?: string;
    position?: number;
  };
}) {
  const onlineStockQuantity = Object.values(product.inventory).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const commerceStatus = getPublicProductCommerceStatus({
    availabilityMode: product.availabilityMode,
    availableQuantity: onlineStockQuantity,
  });
  const isAvailable = commerceStatus.canAddToCart;
  const isUnavailable =
    product.availabilityMode === "READY_TO_ORDER" && !isAvailable;
  const href = createProductSearchHref(product.slug, searchContext);
  const productDetails = [product.material, product.stone].filter(
    (detail): detail is string => Boolean(detail),
  );
  const shouldShowAvailability =
    isUnavailable || product.availabilityMode !== "READY_TO_ORDER";

  return (
    <Link
      aria-label={product.name}
      className={cn(
        "product-card-shell group/list grid min-h-full overflow-hidden rounded-md border-y border-[var(--glass-border)] bg-transparent shadow-none transition focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none md:grid-cols-[minmax(10rem,14rem)_1fr]",
        isUnavailable && "bg-muted/30",
      )}
      data-testid="search-result-list-item"
      href={href}
      prefetch={false}
    >
      <div className="brand-product-media glass-inset relative block aspect-[5/4] overflow-hidden md:aspect-square">
        <Image
          alt={product.name}
          blurDataURL={SEARCH_RESULT_IMAGE_BLUR_DATA_URL}
          className="media-color object-cover transition duration-[700ms] ease-[var(--ease-motion-standard)] group-hover/list:scale-[1.015]"
          fill
          placeholder="blur"
          priority={imagePriority}
          sizes="(min-width: 1024px) 14rem, (min-width: 768px) 28vw, 100vw"
          src={product.image}
        />
        {isUnavailable ? (
          <div className="absolute top-2.5 left-2.5 flex items-start gap-2">
            <Badge variant="destructive">לא פנוי כרגע</Badge>
          </div>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-4 py-[var(--ui-card-padding)] md:grid-cols-[minmax(0,1fr)_minmax(11rem,auto)] md:pe-[var(--ui-card-padding)]">
        <div className="min-w-0">
          <h3
            className="group-hover/list:text-muted-foreground group-focus-visible/list:text-muted-foreground line-clamp-2 text-lg leading-7 font-medium transition-colors duration-[var(--motion-fast)] ease-[var(--ease-motion-standard)]"
            dir="auto"
          >
            {product.name}
          </h3>
          <div
            className="text-muted-foreground mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5"
            data-testid="search-result-list-attributes"
          >
            {productDetails.map((detail, index) => (
              <span
                className="max-w-full min-w-0 truncate"
                key={`${detail}-${index}`}
              >
                {detail}
                {index < productDetails.length - 1 ? (
                  <span className="mx-2 text-[var(--glass-border-strong)]">
                    ·
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </div>

        <div className="grid content-between gap-3 md:min-w-44 md:text-end">
          <div>
            <span className="block text-xl leading-7 font-semibold">
              {formatPrice(product.price)}
            </span>
            {shouldShowAvailability ? (
              <span
                className={cn(
                  "mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--glass-border)] px-2.5 py-1.5 text-xs",
                  isAvailable ? "text-muted-foreground" : "text-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    isAvailable ? "bg-emerald-500" : "bg-muted-foreground",
                  )}
                />
                <span className="truncate">{commerceStatus.label}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

function getActiveSearchFilters(
  input: ProductSearchInput,
  categories: CatalogCategory[],
  viewMode: SearchViewMode,
) {
  const hrefInput: SearchHrefInput = { ...input, view: viewMode };
  const selectedCategory = categories.find(
    (category) => category.slug === input.category,
  );
  const filters: ActiveSearchFilter[] = [];

  if (input.query) {
    filters.push({
      key: "query",
      label: `חיפוש: ${input.query}`,
      href: createSearchHref({
        ...hrefInput,
        page: undefined,
        query: undefined,
      }),
    });
  }

  if (selectedCategory) {
    filters.push({
      key: "category",
      label: `קטגוריה: ${selectedCategory.name}`,
      href: createSearchHref({
        ...hrefInput,
        category: undefined,
        page: undefined,
      }),
    });
  }

  if (input.material) {
    filters.push({
      key: "material",
      label: `חומר: ${input.material}`,
      href: createSearchHref({
        ...hrefInput,
        material: undefined,
        page: undefined,
      }),
    });
  }

  if (input.stone) {
    filters.push({
      key: "stone",
      label: `אבן: ${input.stone}`,
      href: createSearchHref({
        ...hrefInput,
        page: undefined,
        stone: undefined,
      }),
    });
  }

  if (input.collection) {
    filters.push({
      key: "collection",
      label: `קולקציה: ${input.collection}`,
      href: createSearchHref({
        ...hrefInput,
        collection: undefined,
        page: undefined,
      }),
    });
  }

  if (input.maxPrice) {
    filters.push({
      key: "maxPrice",
      label: `עד ${formatInlinePrice(input.maxPrice)}`,
      href: createSearchHref({
        ...hrefInput,
        maxPrice: undefined,
        page: undefined,
      }),
    });
  }

  if (input.availableOnly) {
    filters.push({
      key: "availableOnly",
      label: "זמין",
      href: createSearchHref({
        ...hrefInput,
        availableOnly: undefined,
        page: undefined,
      }),
    });
  }

  if (input.sort && input.sort !== "relevance") {
    filters.push({
      key: "sort",
      label: getSortLabel(input.sort),
      href: createSearchHref({
        ...hrefInput,
        page: undefined,
        sort: undefined,
      }),
    });
  }

  if (input.mode === "classic") {
    filters.push({
      key: "mode",
      label: "\u05d7\u05d9\u05e4\u05d5\u05e9 \u05e7\u05dc\u05d0\u05e1\u05d9",
      href: createSearchHref({
        ...hrefInput,
        mode: undefined,
        page: undefined,
      }),
    });
  }

  return filters;
}

async function getSearchRecoveryActions(
  input: ProductSearchInput,
  viewMode: SearchViewMode,
) {
  const candidates: Array<{
    description: string;
    href: string;
    input: ProductSearchInput;
    label: string;
  }> = [];
  const hasRefinements = getActiveSearchRefinementCount(input) > 0;

  if (input.query && hasRefinements) {
    const queryOnlyInput: ProductSearchInput = {
      query: input.query,
      page: undefined,
      perPage: DEFAULT_SEARCH_PER_PAGE,
    };

    candidates.push({
      description:
        "שומר את מילת החיפוש ומסיר משפחת תכשיט, חומר, אבן, מחיר ומיון.",
      href: createSearchHref({ ...queryOnlyInput, view: viewMode }),
      input: queryOnlyInput,
      label: "ניקוי סינונים",
    });
  }

  if (input.query) {
    const withoutQueryInput: ProductSearchInput = {
      ...input,
      query: undefined,
      page: undefined,
      perPage: DEFAULT_SEARCH_PER_PAGE,
    };

    candidates.push({
      description: "שומר את הבחירות הפעילות ומסיר רק את מילת החיפוש.",
      href: createSearchHref({ ...withoutQueryInput, view: viewMode }),
      input: withoutQueryInput,
      label: "בלי מילת החיפוש",
    });
  }

  if (input.query || hasRefinements) {
    const allCatalogInput: ProductSearchInput = {
      page: undefined,
      perPage: DEFAULT_SEARCH_PER_PAGE,
    };

    candidates.push({
      description: "פותח את המבט המלא על המבחר, בלי חיפוש וסינונים.",
      href: createSearchHref({ ...allCatalogInput, view: viewMode }),
      input: allCatalogInput,
      label: "כל המבחר",
    });
  }

  const uniqueCandidates = dedupeRecoveryCandidates(candidates);
  const totals = await Promise.all(
    uniqueCandidates.map((candidate) =>
      countSearchResults({
        ...candidate.input,
        page: 1,
        perPage: 1,
      }),
    ),
  );

  return uniqueCandidates
    .map((candidate, index): SearchRecoveryAction => {
      const total = totals[index] ?? 0;

      return {
        description: candidate.description,
        href: candidate.href,
        label: candidate.label,
        total,
      };
    })
    .filter((action) => action.total > 0);
}

async function countSearchResults(input: ProductSearchInput) {
  const result = await searchProvider.searchProducts(input);

  return result.total;
}

function SearchPagination({
  currentPage,
  input,
  totalPages,
  viewMode,
}: {
  currentPage: number;
  input: ProductSearchInput;
  totalPages: number;
  viewMode: SearchViewMode;
}) {
  if (totalPages <= 1) return null;

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);
  const pages = getPaginationPages(currentPage, totalPages);
  const hrefInput: SearchHrefInput = { ...input, view: viewMode };

  return (
    <nav
      aria-label="עמודי תוצאות חיפוש"
      className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-muted-foreground text-sm">
        עמוד {currentPage} מתוך {totalPages}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          asChild={currentPage > 1}
          disabled={currentPage <= 1}
          size="sm"
          variant="outline"
        >
          {currentPage > 1 ? (
            <Link href={createSearchHref({ ...hrefInput, page: previousPage })}>
              <ChevronRight aria-hidden="true" className="size-3.5" />
              הקודם
            </Link>
          ) : (
            <span>הקודם</span>
          )}
        </Button>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span
              aria-label="עמודים נוספים"
              className="text-muted-foreground grid h-8 min-w-8 place-items-center rounded-md border border-transparent px-2 text-sm"
              key={`ellipsis-${index}`}
            >
              …
            </span>
          ) : (
            <Button
              asChild
              key={page}
              size="sm"
              variant={page === currentPage ? "secondary" : "outline"}
            >
              <Link
                aria-current={page === currentPage ? "page" : undefined}
                href={createSearchHref({ ...hrefInput, page })}
              >
                {page}
              </Link>
            </Button>
          ),
        )}

        <Button
          asChild={currentPage < totalPages}
          disabled={currentPage >= totalPages}
          size="sm"
          variant="outline"
        >
          {currentPage < totalPages ? (
            <Link href={createSearchHref({ ...hrefInput, page: nextPage })}>
              הבא
              <ChevronLeft aria-hidden="true" className="size-3.5" />
            </Link>
          ) : (
            <span>הבא</span>
          )}
        </Button>
      </div>
    </nav>
  );
}

function getSortLabel(sort: NonNullable<ProductSearchInput["sort"]>) {
  if (sort === "price-asc") return "מחיר: נמוך לגבוה";
  if (sort === "price-desc") return "מחיר: גבוה לנמוך";
  if (sort === "newest") return "חדש";
  if (sort === "popular") return "פופולרי";

  return "רלוונטיות";
}

function getSearchViewLabel(viewMode: SearchViewMode) {
  return viewMode === "list" ? "רשימה" : "תמונות";
}

function formatActiveSelectionCount(count: number) {
  return count === 1
    ? "\u05d1\u05d7\u05d9\u05e8\u05d4 \u05e4\u05e2\u05d9\u05dc\u05d4 \u05d0\u05d7\u05ea"
    : `${count} \u05d1\u05d7\u05d9\u05e8\u05d5\u05ea \u05e4\u05e2\u05d9\u05dc\u05d5\u05ea`;
}

function formatActiveSelectionPreview(filters: ActiveSearchFilter[]) {
  const labels = filters.slice(0, 3).map((filter) => filter.label);
  const hidden = Math.max(filters.length - labels.length, 0);
  const compact = labels.join(" \u00b7 ");

  return hidden > 0 ? `${compact} +${hidden}` : compact;
}

function formatSearchResultCount(count: number) {
  if (count === 1) return "תוצאה אחת";

  return `${count} תוצאות`;
}

async function recordSearchEvent(
  input: ProductSearchInput,
  resultCount: number,
) {
  if (shouldUseCatalogFixtures()) return;
  if (!input.query && !input.category) return;

  await db.searchEvent
    .create({
      data: {
        query: input.query ?? "",
        filters: {
          category: input.category ?? null,
          material: input.material ?? null,
          stone: input.stone ?? null,
          collection: input.collection ?? null,
          maxPrice: input.maxPrice ?? null,
          availableOnly: input.availableOnly ?? false,
          mode: input.mode ?? "semantic",
          sort: input.sort ?? "relevance",
        },
        resultCount,
      },
    })
    .catch((error: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[search:event]", error);
      }
    });
}
