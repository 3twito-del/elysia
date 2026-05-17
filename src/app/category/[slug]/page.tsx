import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Filter, Gem, SlidersHorizontal, Sparkles, X } from "lucide-react";

import { CategoryFilterSheet } from "./_components/category-filter-sheet";
import { DeferredCategoryFilterPanel } from "./_components/deferred-category-filter-panel";
import {
  createCategoryFilterQueryString,
  createCategoryPageHref,
  getCategoryRouteState,
  getFirstParam as getCategoryFirstParam,
  getValidPage as getValidCategoryPage,
  productsPerPage,
  sortCategoryProducts as sortCategoryRouteProducts,
  type CategoryFilters,
  type CategorySearchParams,
} from "./_lib/category-filter-state";
import { CinematicPageHero } from "~/components/cinematic-page-hero";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { getCategoryBrandSlides } from "~/lib/brand-media";
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import {
  getCatalogCategories,
  getCatalogFacetsFromProducts,
  listCatalogProductsCachedRequest,
} from "~/server/services/catalog";

type CategoryRouteProps = {
  params: Promise<{ slug: string }>;
};

type CategoryPageProps = CategoryRouteProps & {
  searchParams: Promise<CategorySearchParams>;
};

export const revalidate = 3600;
const categoryMetadataBySlug: Record<
  string,
  { description: string; title: string }
> = {
  bracelets: {
    description: "צמידים וצמידי טניס מודרניים, בזהב, כסף ופנינים.",
    title: "צמידים",
  },
  earrings: {
    description: "עגילים עדינים, תלויים וסטים משלימים לכל יום ולאירועים.",
    title: "עגילים",
  },
  necklaces: {
    description: "שרשראות עדינות, תליונים וסטים משלימים.",
    title: "שרשראות",
  },
  rings: {
    description: "טבעות זהב, יהלומים ואבני חן ליום יום ולאירועים.",
    title: "טבעות",
  },
};
export async function generateStaticParams() {
  const categories = await getCatalogCategories();

  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryMetadataBySlug[slug];

  return {
    title: category?.title ?? "קטגוריה",
    description: category?.description,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const [categories, catalogProducts] = await Promise.all([
    getCatalogCategories(),
    listCatalogProductsCachedRequest(),
  ]);
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const facets = getCatalogFacetsFromProducts(catalogProducts);
  const categoryState = getCategoryRouteState({
    catalogProducts,
    categories,
    facets,
    query,
    slug,
  });
  const {
    activeFilterCount,
    activeFilters,
    baseProducts,
    currentSortLabel,
    filteredProducts,
    filters,
    resetHref,
  } = categoryState;
  const filterQueryString = createCategoryFilterQueryString(query);
  const requestedPage = getValidCategoryPage(getCategoryFirstParam(query.page));
  const sortedProducts = sortCategoryRouteProducts(
    filteredProducts,
    filters.sort,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / productsPerPage),
  );
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStartIndex = (currentPage - 1) * productsPerPage;
  const pageProducts = sortedProducts.slice(
    pageStartIndex,
    pageStartIndex + productsPerPage,
  );
  const visibleStart = sortedProducts.length > 0 ? pageStartIndex + 1 : 0;
  const visibleEnd = Math.min(
    pageStartIndex + pageProducts.length,
    sortedProducts.length,
  );
  const hasCategoryProducts = baseProducts.length > 0;
  const hasActiveFilters = activeFilterCount > 0;
  const pageRangeLabel =
    sortedProducts.length > 0
      ? `${visibleStart}-${visibleEnd} מתוך ${sortedProducts.length} מוצרים`
      : "0 מוצרים";

  return (
    <main>
      <SiteHeader />

      <CinematicPageHero
        className="category-page-hero"
        actions={
          <>
            <Button asChild size="lg">
              <Link href="#category-products">לצפייה במוצרים</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#category-filters">סינון מדויק</Link>
            </Button>
          </>
        }
        description={
          category.description ??
          "בחירה מסוננת מתוך קטלוג התכשיטים, עם רכישה אונליין ומחירים בשקלים."
        }
        eyebrow="קטלוג Aphrodite"
        mediaParallax={false}
        mediaScrollMotion={false}
        scrollCue={{ href: "#category-products", label: "למוצרים" }}
        slides={getCategoryBrandSlides(slug)}
        stats={[
          {
            label: "מוצרים מוצגים",
            value: `${filteredProducts.length}/${baseProducts.length}`,
          },
          { label: "אונליין", value: "זמין" },
          { label: "מיון", value: currentSortLabel },
        ]}
        title={category.name}
        variant="commerce"
      />

      <div className="glass-chrome sticky top-16 z-30 border-b lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="text-sm">
            <p className="font-medium">{pageRangeLabel}</p>
            <p className="text-muted-foreground text-xs">
              {hasActiveFilters
                ? `${activeFilterCount} פילטרים פעילים`
                : hasCategoryProducts
                  ? "כל הפריטים בקטגוריה"
                  : "הקטגוריה בעדכון"}
            </p>
          </div>
          <CategoryFilterSheet activeFilterCount={activeFilterCount}>
            <Button
              className="gap-2"
              data-testid="category-filter-trigger"
              type="button"
              variant="outline"
            >
              <Filter aria-hidden="true" className="size-4" />
              פילטרים
              {activeFilterCount > 0 && (
                <Badge className="h-5 px-1.5" variant="secondary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <SheetContent
              className="w-[min(92vw,390px)] overflow-y-auto p-0"
              data-testid="category-filter-sheet"
              side="right"
            >
              <SheetHeader className="border-b border-[var(--glass-border)] p-4">
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                  פילטרים
                </SheetTitle>
                <SheetDescription>
                  בחירה מהירה לפי מיון, זמינות, חומר, אבן ומחיר.
                </SheetDescription>
              </SheetHeader>
              <div className="p-4">
                <DeferredCategoryFilterPanel
                  activeFilterCount={activeFilterCount}
                  closeOnSelect
                  queryString={filterQueryString}
                  resetHref={resetHref}
                  slug={slug}
                />
              </div>
              <div className="bg-popover sticky bottom-0 grid grid-cols-2 gap-2 border-t border-[var(--glass-border)] p-4">
                {hasActiveFilters ? (
                  <Button asChild variant="outline">
                    <Link href={resetHref} scroll={false}>
                      איפוס
                    </Link>
                  </Button>
                ) : (
                  <Button disabled type="button" variant="outline">
                    איפוס
                  </Button>
                )}
                <SheetClose asChild>
                  <Button type="button">סגירה</Button>
                </SheetClose>
              </div>
            </SheetContent>
          </CategoryFilterSheet>
        </div>
      </div>

      <div className="h-px" id="category-filters" />

      <RevealSection className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[296px_1fr] lg:py-10">
        <aside className="hidden lg:block" data-testid="category-filter-panel">
          <Card className="sticky top-24 rounded-md" size="sm">
            <CardHeader className="border-b border-[var(--glass-border)] pb-4">
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                פילטרים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeferredCategoryFilterPanel
                activeFilterCount={activeFilterCount}
                queryString={filterQueryString}
                resetHref={resetHref}
                slug={slug}
              />
            </CardContent>
          </Card>
        </aside>

        <section
          aria-labelledby="category-results"
          className="min-w-0"
          id="category-products"
        >
          <div className="mb-7 border-y border-[var(--glass-border)] py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-medium" id="category-results">
                  {pageRangeLabel}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {!hasCategoryProducts
                    ? "נעדכן את הבחירה בקרוב"
                    : filteredProducts.length > productsPerPage
                      ? `עמוד ${currentPage} מתוך ${totalPages}`
                      : hasActiveFilters
                        ? "התוצאות מסוננות לפי הבחירה שלך"
                        : "כל הפריטים הזמינים בקטגוריה"}
                  <span className="mx-2">·</span>
                  <span>מיון: {currentSortLabel}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hasActiveFilters && (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={resetHref} scroll={false}>
                      איפוס
                    </Link>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline">
                  <Link href="/ai">
                    <Sparkles aria-hidden="true" className="size-3.5" />
                    התאמה אישית
                  </Link>
                </Button>
              </div>
            </div>
            {activeFilters.length > 0 && (
              <div
                aria-label="בחירות פעילות"
                className="mt-4 flex flex-wrap gap-2"
              >
                {activeFilters.map((filter) => (
                  <Badge
                    asChild
                    className="h-7 max-w-full gap-1 pr-2 pl-1"
                    key={filter.key}
                    variant="outline"
                  >
                    <Link href={filter.href} scroll={false}>
                      <span className="min-w-0 truncate">{filter.label}</span>
                      <X aria-hidden="true" className="size-3" />
                      <span className="sr-only">הסרת בחירה</span>
                    </Link>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <RevealGrid
                className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                data-testid="category-results-grid"
                variant="cards"
              >
                {pageProducts.map((product, index) => (
                  <ProductCard
                    imagePriority={index === 0}
                    imageSizes="(min-width: 1280px) 18rem, (min-width: 1024px) calc((100vw - 24rem) / 2), (min-width: 640px) 50vw, 100vw"
                    key={product.slug}
                    product={product}
                  />
                ))}
              </RevealGrid>

              {totalPages > 1 && (
                <CategoryPagination
                  currentPage={currentPage}
                  filters={filters}
                  slug={slug}
                  totalPages={totalPages}
                />
              )}
            </>
          ) : (
            <CategoryEmptyState
              hasActiveFilters={hasActiveFilters}
              hasCategoryProducts={hasCategoryProducts}
              resetHref={resetHref}
            />
          )}
        </section>
      </RevealSection>
    </main>
  );
}

function CategoryEmptyState({
  hasActiveFilters,
  hasCategoryProducts,
  resetHref,
}: {
  hasActiveFilters: boolean;
  hasCategoryProducts: boolean;
  resetHref: string;
}) {
  if (!hasCategoryProducts) {
    return (
      <EmptyState
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/search">חיפוש בכל הקטלוג</Link>
            </Button>
            <Button asChild>
              <Link href="/ai">התאמה אישית</Link>
            </Button>
          </>
        }
        description="הקטגוריה קיימת, אבל אין בה כרגע פריטים פעילים. אפשר לעבור לחיפוש הרחב או לקבל המלצה מתוך קטגוריות זמינות."
        icon={Gem}
        testId="category-empty-state"
        title="הקטגוריה מתעדכנת"
      />
    );
  }

  return (
    <EmptyState
      actions={
        <>
          {hasActiveFilters ? (
            <Button asChild variant="outline">
              <Link href={resetHref} scroll={false}>
                איפוס פילטרים
              </Link>
            </Button>
          ) : null}
          <Button asChild variant={hasActiveFilters ? "default" : "outline"}>
            <Link href="/search">חיפוש בכל הקטלוג</Link>
          </Button>
          <Button asChild>
            <Link href="/ai">התאמה אישית</Link>
          </Button>
        </>
      }
      description="אפשר לנקות את הבחירה, להרחיב את החיפוש, או לתת לסטייליסט למצוא עבורך שילוב קרוב מתוך הקטלוג."
      icon={Gem}
      testId="category-empty-state"
      title="לא נמצאו מוצרים בהתאמה הזו"
    />
  );
}

function CategoryPagination({
  slug,
  filters,
  currentPage,
  totalPages,
}: {
  slug: string;
  filters: CategoryFilters;
  currentPage: number;
  totalPages: number;
}) {
  const pages = getPaginationPages(currentPage, totalPages);
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav
      aria-label="עמודי מוצרים"
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
            <Link href={createCategoryPageHref(slug, filters, previousPage)}>
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
                href={createCategoryPageHref(slug, filters, page)}
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
            <Link href={createCategoryPageHref(slug, filters, nextPage)}>
              הבא
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
