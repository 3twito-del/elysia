import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import {
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  Search,
  ShoppingBag,
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
  formatPrice,
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
  title: "חיפוש",
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
        ? "נמצאו דרכי הרחבה עם תוצאות זמינות"
        : "אפשר לנקות בחירות או לעבור לקטלוג המלא";
  after(() => recordSearchEvent(input, result.total));

  return (
    <main>
      <SiteHeader />
      <CommercePageHero
        description="חיפוש קטלוג עם סינון לפי קטגוריה, חומר, אבן, תקציב וזמינות."
        eyebrow="קטלוג Elysia"
        title="חיפוש בקטלוג"
        variant="catalog"
      />
      <RevealSection
        className="mx-auto max-w-7xl px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:px-[var(--ui-page-x-wide)] lg:py-[var(--ui-section-y-wide)]"
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
          <div
            aria-label="פילטרים פעילים"
            className="mt-4 flex flex-wrap items-center gap-2 text-sm"
          >
            {activeFilters.map((filter) => (
              <Badge
                asChild
                className="h-8 gap-1 pr-3 pl-2"
                key={filter.key}
                variant="outline"
              >
                <Link href={filter.href} scroll={false}>
                  <span>{filter.label}</span>
                  <X aria-hidden="true" className="size-3" />
                  <span className="sr-only">הסרת פילטר</span>
                </Link>
              </Badge>
            ))}
            <Button asChild size="sm" variant="ghost">
              <Link href={resetAllHref} scroll={false}>
                איפוס הכל
              </Link>
            </Button>
          </div>
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
                    : "כל התכשיטים שנמצאו בקטלוג"}
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
                אפשר לנקות את הבחירה, לעבור לקטגוריה פתוחה, או להרחיב את החיפוש
                בכל הקטלוג.
              </>
            }
            icon={Search}
            testId="search-empty-state"
            title="לא נמצאו תוצאות"
            actions={
              <>
                {recoveryActions.length > 0 ? (
                  <span
                    className="contents"
                    data-testid="search-recovery-actions"
                  >
                    {recoveryActions.map((action) => (
                      <Button asChild key={action.href} variant="outline">
                        <Link
                          href={action.href}
                          scroll={false}
                          title={action.description}
                        >
                          <span>{action.label}</span>
                          <span className="text-xs opacity-75">
                            {formatSearchResultCount(action.total)}
                          </span>
                        </Link>
                      </Button>
                    ))}
                  </span>
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
                  matchReason={result.hitMetaBySlug[product.slug]?.matchReason}
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
              className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
              data-testid="search-results-grid"
              variant="cards"
            >
              {result.hits.map((product, index) => (
                <ProductCard
                  imagePriority={index < 4}
                  imageSizes="(min-width: 1280px) 18rem, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  key={product.slug}
                  matchReason={result.hitMetaBySlug[product.slug]?.matchReason}
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
      label: "גריד",
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
  matchReason,
  product,
  searchContext,
}: {
  imagePriority?: boolean;
  matchReason?: string;
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
  const compareAt =
    typeof product.compareAt === "number" && product.compareAt > product.price
      ? product.compareAt
      : undefined;
  const discountPercent = compareAt
    ? Math.round(((compareAt - product.price) / compareAt) * 100)
    : undefined;
  const href = createProductSearchHref(product.slug, searchContext);
  const actionHref = commerceStatus.canAddToCart
    ? href
    : createProductServiceHref(product, commerceStatus.serviceReason);
  const commerceHighlights = (product.commerceHighlights ?? []).slice(0, 2);
  const productDetails = [
    product.categoryName,
    product.material,
    product.stone,
    product.collection,
  ].filter((detail): detail is string => Boolean(detail));

  return (
    <article
      aria-label={product.name}
      className={cn(
        "product-card-shell group/list grid min-h-full overflow-hidden rounded-md border border-[var(--glass-border)] bg-[var(--glass-panel-bg)] shadow-none transition focus-within:ring-3 focus-within:ring-[var(--glass-focus)] md:grid-cols-[minmax(10rem,14rem)_1fr]",
        isUnavailable && "bg-muted/30",
      )}
      data-testid="search-result-list-item"
    >
      <Link
        aria-label={`צפייה במוצר ${product.name}`}
        className="brand-product-media glass-inset relative block aspect-[5/4] overflow-hidden focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none md:aspect-square"
        href={href}
      >
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
        {discountPercent || isUnavailable ? (
          <div className="absolute top-2.5 left-2.5 flex items-start gap-2">
            {discountPercent ? (
              <Badge className="font-semibold" dir="ltr" variant="default">
                -{discountPercent}%
              </Badge>
            ) : isUnavailable ? (
              <Badge variant="destructive">לא זמין</Badge>
            ) : null}
          </div>
        ) : null}
      </Link>

      <div className="grid min-w-0 gap-4 p-[var(--ui-card-padding)] md:grid-cols-[minmax(0,1fr)_minmax(11rem,auto)]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="outline">{product.categoryName}</Badge>
            {product.material ? (
              <Badge variant="secondary">{product.material}</Badge>
            ) : null}
          </div>
          <Link
            className="line-clamp-2 text-lg leading-7 font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
            dir="auto"
            href={href}
          >
            {product.name}
          </Link>
          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-6">
            {product.shortDescription}
          </p>
          {matchReason ? (
            <p
              className="text-muted-foreground mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--glass-border)] bg-[var(--glass-inset-bg)] px-2.5 py-1.5 text-xs"
              data-testid="search-result-match-reason"
            >
              <Sparkles aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">{matchReason}</span>
            </p>
          ) : null}
          <div
            className="text-muted-foreground mt-3 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5"
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
          {commerceHighlights.length > 0 ? (
            <ul className="text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs">
              {commerceHighlights.map((highlight) => (
                <li
                  className="rounded-md border border-[var(--glass-border)] bg-[var(--glass-inset-bg)] px-2.5 py-1"
                  key={highlight}
                >
                  {highlight}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="grid content-between gap-3 md:min-w-44 md:text-end">
          <div>
            <p className="text-muted-foreground text-xs">מחיר</p>
            {compareAt ? (
              <span className="text-muted-foreground mt-1 block text-xs line-through">
                {formatPrice(compareAt)}
              </span>
            ) : null}
            <span className="block text-xl leading-7 font-semibold">
              {formatPrice(product.price)}
            </span>
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
          </div>
          <Button
            asChild
            className="product-card-cta min-h-10 w-full gap-2"
            variant="outline"
          >
            <Link
              aria-label={`${commerceStatus.cardCtaLabel}: ${product.name}`}
              href={actionHref}
            >
              <ShoppingBag aria-hidden="true" className="size-4" />
              {commerceStatus.cardCtaLabel}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function createProductServiceHref(
  product: Pick<CatalogProduct, "name" | "sku">,
  reason: string,
) {
  const productReference = `${product.name} (${product.sku})`;

  return `/service?productReference=${encodeURIComponent(productReference)}&reason=${encodeURIComponent(reason)}`;
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
      label: `עד ${formatPrice(input.maxPrice)}`,
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
      label: "זמין במלאי",
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
      description: "שומר את מילת החיפוש ומסיר קטגוריה, חומר, אבן, תקציב ומיון.",
      href: createSearchHref({ ...queryOnlyInput, view: viewMode }),
      input: queryOnlyInput,
      label: "ניקוי פילטרים",
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
      description: "פותח את כל מוצרי הקטלוג ללא חיפוש ופילטרים.",
      href: createSearchHref({ ...allCatalogInput, view: viewMode }),
      input: allCatalogInput,
      label: "כל הקטלוג",
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
  if (sort === "price-asc") return "מחיר עולה";
  if (sort === "price-desc") return "מחיר יורד";
  if (sort === "newest") return "חדש";
  if (sort === "popular") return "פופולרי";

  return "רלוונטיות";
}

function getSearchViewLabel(viewMode: SearchViewMode) {
  return viewMode === "list" ? "רשימה" : "גריד";
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
