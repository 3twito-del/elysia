import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import { ChevronLeft, ChevronRight, Search, Sparkles, X } from "lucide-react";

import { SearchControls } from "~/app/search/_components/search-controls";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { db } from "~/server/db";
import {
  DEFAULT_SEARCH_PER_PAGE,
  searchProvider,
  type ProductSearchInput,
} from "~/server/adapters/search";
import {
  getCatalogBranches,
  getCatalogCategories,
  getCatalogFacets,
  formatPrice,
  type CatalogBranch,
  type CatalogCategory,
  type CatalogFacets,
} from "~/server/services/catalog";
import { removeGoldLanguage } from "~/lib/gold-free-copy";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    branch?: string;
    material?: string;
    stone?: string;
    collection?: string;
    maxPrice?: string;
    availableOnly?: string;
    page?: string;
    sort?: string;
  }>;
};

type ActiveSearchFilter = {
  key: keyof ProductSearchInput;
  label: string;
  href: string;
};

export const metadata = {
  title: "חיפוש",
};

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [categories, branches, facets] = await Promise.all([
    getCatalogCategories(),
    getCatalogBranches(),
    getCatalogFacets(),
  ]);
  const input = normalizeSearchInput(params, { branches, categories, facets });
  const displayCategories = categories.map((category) => ({
    ...category,
    description: removeGoldLanguage(category.description),
  }));
  const result = await searchProvider.searchProducts(input);
  const activeFilters = getActiveSearchFilters(input, categories, branches);
  const hasActiveFilters = activeFilters.length > 0;
  const firstCategory = categories[0];
  const visibleFacets = result.facets
    .flatMap((facet) =>
      facet.values
        .filter((value) => value.count > 0)
        .slice(0, 6)
        .map((value) => ({
          field: facet.field,
          ...value,
        })),
    )
    .slice(0, 10);
  const visibleStart =
    result.total > 0 ? (result.page - 1) * result.perPage + 1 : 0;
  const visibleEnd = Math.min(result.page * result.perPage, result.total);
  const resultSummary =
    result.total === 1
      ? "נמצאה תוצאה אחת"
      : result.total > 0
        ? `מציגים ${visibleStart}-${visibleEnd} מתוך ${result.total} תוצאות`
        : "לא נמצאו תוצאות";

  after(() => recordSearchEvent(input, result.total));

  return (
    <main>
      <SiteHeader />
      <RevealSection className="editorial-band signature-grid border-b border-[var(--glass-border)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:items-stretch">
            <div className="lg:self-center">
              <p className="editorial-eyebrow mb-3">Catalog search</p>
              <h1 className="editorial-title text-4xl font-semibold sm:text-5xl">
                חיפוש בקטלוג
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl leading-7 sm:mt-3">
                תוצאות הקטלוג נשארות נקיות ומדויקות, עם צבע שמגיע מהפריטים עצמם.
              </p>
            </div>
            {result.hits[0]?.image ? (
              <div className="bg-muted relative hidden h-44 overflow-hidden border border-[var(--glass-border)] lg:block">
                <Image
                  alt=""
                  className="media-mono object-cover"
                  fill
                  sizes="(min-width: 1024px) 440px, 100vw"
                  src={result.hits[0].image}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(255,255,255,0.58),rgba(255,255,255,0.04))]" />
              </div>
            ) : null}
          </div>
          <SearchControls
            activeFilterCount={activeFilters.length}
            branches={branches}
            categories={displayCategories}
            input={input}
          />

          {hasActiveFilters ? (
            <div
              aria-label="פילטרים פעילים"
              className="mt-5 flex flex-wrap items-center gap-2 text-sm"
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
                    <X className="size-3" />
                    <span className="sr-only">הסרת פילטר</span>
                  </Link>
                </Badge>
              ))}
              <Button asChild size="sm" variant="ghost">
                <Link href="/search" scroll={false}>
                  איפוס הכל
                </Link>
              </Button>
            </div>
          ) : null}

          {visibleFacets.length > 0 ? (
            <div className="mt-6 hidden flex-wrap gap-2 text-sm sm:flex">
              {visibleFacets.map((value, index) => {
                const displayValue = removeGoldLanguage(value.value);

                return (
                  <span
                    className="border border-[var(--glass-border)] px-3 py-1"
                    key={`${value.field}:${displayValue}:${index}`}
                  >
                    {displayValue} · {value.count}
                  </span>
                );
              })}
            </div>
          ) : null}

          <section
            aria-labelledby="search-results"
            className="commerce-command mt-8 rounded-md p-4"
            data-testid="search-results-summary"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-medium" id="search-results">
                  {resultSummary}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {input.query
                    ? `עבור "${removeGoldLanguage(input.query)}"`
                    : hasActiveFilters
                      ? "לפי הבחירה הפעילה"
                      : "כל התכשיטים שנמצאו בקטלוג"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hasActiveFilters ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/search" scroll={false}>
                      איפוס
                    </Link>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="outline">
                  <Link href="/ai">
                    <Sparkles className="size-3.5" />
                    התאמה אישית
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {result.hits.length === 0 ? (
            <EmptyState
              className="mt-10"
              description={
                <>
                  אפשר לנקות את הבחירה, לעבור לקטגוריה פתוחה, או לתת לסטייליסט
                  למצוא חלופה קרובה מתוך הקטלוג.
                </>
              }
              icon={Search}
              testId="search-empty-state"
              title="לא נמצאו תוצאות"
              actions={
                <>
                  {hasActiveFilters ? (
                    <Button asChild variant="outline">
                      <Link href="/search" scroll={false}>
                        איפוס חיפוש
                      </Link>
                    </Button>
                  ) : null}
                  {firstCategory ? (
                    <Button
                      asChild
                      variant={hasActiveFilters ? "outline" : "default"}
                    >
                      <Link href={`/category/${firstCategory.slug}`}>
                        {firstCategory.name}
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild>
                    <Link href="/ai">התאמה אישית</Link>
                  </Button>
                </>
              }
            />
          ) : (
            <>
              <RevealGrid
                className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
                data-testid="search-results-grid"
              >
                {result.hits.map((product, index) => (
                  <ProductCard
                    imagePriority={index < 4}
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
              />
            </>
          )}
        </div>
      </RevealSection>
    </main>
  );
}

function normalizeSearchInput(
  params: Awaited<SearchPageProps["searchParams"]>,
  options: {
    branches: CatalogBranch[];
    categories: CatalogCategory[];
    facets: CatalogFacets;
  },
): ProductSearchInput {
  const query = normalizeTextParam(params.q);
  const category = normalizeCatalogValue(
    params.category,
    options.categories.map((item) => item.slug),
  );
  const branch = normalizeCatalogValue(
    params.branch,
    options.branches.map((item) => item.slug),
  );
  const material = normalizeCatalogValue(
    params.material,
    options.facets.materials,
  );
  const stone = normalizeCatalogValue(params.stone, options.facets.stones);
  const collection = normalizeCatalogValue(
    params.collection,
    options.facets.collections,
  );
  const maxPrice = normalizeMaxPrice(params.maxPrice);

  return {
    query,
    category,
    branch,
    material,
    stone,
    collection,
    maxPrice,
    availableOnly: params.availableOnly === "1",
    page: normalizePage(params.page),
    perPage: DEFAULT_SEARCH_PER_PAGE,
    sort: normalizeSort(params.sort),
  };
}

function getActiveSearchFilters(
  input: ProductSearchInput,
  categories: CatalogCategory[],
  branches: CatalogBranch[],
) {
  const selectedCategory = categories.find(
    (category) => category.slug === input.category,
  );
  const selectedBranch = branches.find(
    (branch) => branch.slug === input.branch,
  );
  const filters: ActiveSearchFilter[] = [];

  if (input.query) {
    filters.push({
      key: "query",
      label: `חיפוש: ${removeGoldLanguage(input.query)}`,
      href: createSearchHref({ ...input, page: undefined, query: undefined }),
    });
  }

  if (selectedCategory) {
    filters.push({
      key: "category",
      label: `קטגוריה: ${selectedCategory.name}`,
      href: createSearchHref({
        ...input,
        category: undefined,
        page: undefined,
      }),
    });
  }

  if (selectedBranch) {
    filters.push({
      key: "branch",
      label: `סניף: ${selectedBranch.city}`,
      href: createSearchHref({ ...input, branch: undefined, page: undefined }),
    });
  }

  if (input.material) {
    filters.push({
      key: "material",
      label: `חומר: ${removeGoldLanguage(input.material)}`,
      href: createSearchHref({
        ...input,
        material: undefined,
        page: undefined,
      }),
    });
  }

  if (input.stone) {
    filters.push({
      key: "stone",
      label: `אבן: ${input.stone}`,
      href: createSearchHref({ ...input, page: undefined, stone: undefined }),
    });
  }

  if (input.collection) {
    filters.push({
      key: "collection",
      label: `קולקציה: ${removeGoldLanguage(input.collection)}`,
      href: createSearchHref({
        ...input,
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
        ...input,
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
        ...input,
        availableOnly: undefined,
        page: undefined,
      }),
    });
  }

  if (input.sort && input.sort !== "relevance") {
    filters.push({
      key: "sort",
      label: getSortLabel(input.sort),
      href: createSearchHref({ ...input, page: undefined, sort: undefined }),
    });
  }

  return filters;
}

function createSearchHref(input: ProductSearchInput) {
  const params = new URLSearchParams();

  if (input.query) params.set("q", input.query);
  if (input.category) params.set("category", input.category);
  if (input.branch) params.set("branch", input.branch);
  if (input.material) params.set("material", input.material);
  if (input.stone) params.set("stone", input.stone);
  if (input.collection) params.set("collection", input.collection);
  if (input.maxPrice) params.set("maxPrice", String(input.maxPrice));
  if (input.availableOnly) params.set("availableOnly", "1");
  if (input.sort && input.sort !== "relevance") params.set("sort", input.sort);
  if (input.page && input.page > 1) params.set("page", String(input.page));

  const query = params.toString();

  return query ? `/search?${query}` : "/search";
}

function SearchPagination({
  currentPage,
  input,
  totalPages,
}: {
  currentPage: number;
  input: ProductSearchInput;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);
  const pages = getPaginationPages(currentPage, totalPages);

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
            <Link href={createSearchHref({ ...input, page: previousPage })}>
              <ChevronRight className="size-3.5" />
              הקודם
            </Link>
          ) : (
            <span>הקודם</span>
          )}
        </Button>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span
              aria-hidden="true"
              className="text-muted-foreground px-2 text-sm"
              key={`ellipsis-${index}`}
            >
              ...
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
                href={createSearchHref({ ...input, page })}
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
            <Link href={createSearchHref({ ...input, page: nextPage })}>
              הבא
              <ChevronLeft className="size-3.5" />
            </Link>
          ) : (
            <span>הבא</span>
          )}
        </Button>
      </div>
    </nav>
  );
}

function getPaginationPages(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) {
      pages.add(page);
    }
  }

  const sortedPages = Array.from(pages).sort((first, second) => first - second);
  const result: Array<number | "ellipsis"> = [];

  for (const page of sortedPages) {
    const previous = result[result.length - 1];

    if (typeof previous === "number" && page - previous > 1) {
      result.push("ellipsis");
    }

    result.push(page);
  }

  return result;
}

function normalizeTextParam(value?: string) {
  const normalized = value?.trim();

  if (!normalized) return undefined;

  return normalized;
}

function normalizeCatalogValue(value: string | undefined, allowed: string[]) {
  const normalized = normalizeTextParam(value);

  return normalized && allowed.includes(normalized) ? normalized : undefined;
}

function normalizeMaxPrice(value?: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizePage(value?: string) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeSort(value?: string): ProductSearchInput["sort"] {
  if (
    value === "relevance" ||
    value === "price-asc" ||
    value === "price-desc" ||
    value === "newest" ||
    value === "popular"
  ) {
    return value;
  }

  return undefined;
}

function getSortLabel(sort: NonNullable<ProductSearchInput["sort"]>) {
  if (sort === "price-asc") return "מחיר עולה";
  if (sort === "price-desc") return "מחיר יורד";
  if (sort === "newest") return "חדש";
  if (sort === "popular") return "פופולרי";

  return "רלוונטיות";
}

async function recordSearchEvent(
  input: ProductSearchInput,
  resultCount: number,
) {
  if (!input.query && !input.category && !input.branch) return;

  await db.searchEvent
    .create({
      data: {
        query: input.query ?? "",
        filters: {
          category: input.category ?? null,
          branch: input.branch ?? null,
          material: input.material ?? null,
          stone: input.stone ?? null,
          collection: input.collection ?? null,
          maxPrice: input.maxPrice ?? null,
          availableOnly: input.availableOnly ?? false,
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
