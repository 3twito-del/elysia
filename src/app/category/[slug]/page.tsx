import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Filter, Gem, SlidersHorizontal, X } from "lucide-react";

import { CategoryFilterSheet } from "./_components/category-filter-sheet";
import { DeferredCategoryFilterPanel } from "./_components/deferred-category-filter-panel";
import {
  createCategoryPageHref,
  getCategoryRouteState,
  getFirstParam as getCategoryFirstParam,
  getValidPage as getValidCategoryPage,
  productsPerPage,
  sortCategoryProducts as sortCategoryRouteProducts,
  toCategoryFilterPayload,
  type CategoryFilters,
  type CategorySearchParams,
} from "./_lib/category-filter-state";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { getCategoryBrandSlides } from "~/lib/brand-media";
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

type CategoryLuxuryCopy = {
  description: string;
  intro: string;
  title: string;
};

export const revalidate = 3600;

const categoryLuxuryCopyBySlug: Record<string, CategoryLuxuryCopy> = {
  bracelets: {
    description:
      "קווים נקיים, חוליות דקות ונוכחות מאוזנת על היד. כל צמיד מוצג עם חומר, מידה ומחיר כדי לאפשר בחירה שקטה ובטוחה.",
    intro: "צמידים לענידה יומיומית, שכבה עדינה ומתנה אישית.",
    title: "צמידים",
  },
  earrings: {
    description:
      "עגילים שנבחרו לפי אור סביב הפנים, משקל נוח וגימור מוקפד. המבחר נע בין נקודת אור קטנה לבין נוכחות אלגנטית לערב.",
    intro: "עגילים ליום, לערב ולרגעים שמבקשים דיוק קטן.",
    title: "עגילים",
  },
  necklaces: {
    description:
      "שרשראות ותליונים בקו מאופק, לענידה יחידה או בשכבות. הדגש הוא על אורך, חומר ואבן שנשארים קרובים בלי להעמיס.",
    intro: "שרשראות עדינות שמחזיקות קו נקי לאורך זמן.",
    title: "שרשראות",
  },
  rings: {
    description:
      "טבעות זהב, יהלומים ואבני חן שנבחרו לפי פרופורציה, נוחות ונוכחות שקטה. כל פריט מוביל לבחירה ברורה לפני ההזמנה.",
    intro: "טבעות ליום, לערב, להצעה ולמתנה אישית.",
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
  const copy = categoryLuxuryCopyBySlug[slug];

  return {
    title: copy?.title ?? "קולקציית Elysia",
    description: copy?.description,
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

  const categoryCopy = categoryLuxuryCopyBySlug[slug] ?? {
    description:
      category.description ||
      "בחירות מתוך הקולקציה, עם חומר ברור, פרטים מדויקים ושירות אישי לפני ההזמנה.",
    intro: "בחירות מתוך הקולקציה של Elysia.",
    title: category.name,
  };
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
  const filterPayload = toCategoryFilterPayload(categoryState);
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
      ? `${visibleStart}–${visibleEnd} מתוך ${sortedProducts.length} פריטים`
      : "0 פריטים";

  return (
    <>
      <SiteHeader />

      <main dir="rtl">
        <CategoryBreadcrumbs categoryName={categoryCopy.title} />

        <CommercePageHero
          description={
            <>
              <span>{categoryCopy.intro}</span>
              <br />
              <span>{categoryCopy.description}</span>
            </>
          }
          eyebrow="בחירות מתוך הקולקציה"
          id="page-hero"
          media={{
            alt: `${categoryCopy.title} מתוך קולקציית Elysia`,
            priority: true,
            sizes:
              "(min-width: 1024px) 34vw, (min-width: 640px) 60vw, 100vw",
            slides: getCategoryBrandSlides(slug),
          }}
          metrics={[
            { label: "פריטים", value: baseProducts.length },
            { label: "חומרים", value: facets.materials.length },
            { label: "קולקציות", value: facets.collections.length },
          ]}
          metricsMode="inline"
          showMediaOnMobile
          title={categoryCopy.title}
          variant="catalog"
        />

        <div className="bg-background sticky top-16 z-30 border-b border-[var(--glass-border)] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-[var(--ui-page-x)] py-3 sm:px-[var(--ui-page-x-wide)]">
            <div className="text-sm">
              <p className="font-medium">{pageRangeLabel}</p>
              <p className="text-muted-foreground text-xs">
                {hasActiveFilters
                  ? `${activeFilterCount} סינונים פעילים`
                  : hasCategoryProducts
                    ? "כל הפריטים בקטגוריה"
                    : "הקטגוריה מתעדכנת"}
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
                סינון
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
                <SheetHeader className="border-b border-[var(--glass-border)] p-[var(--ui-panel-padding)]">
                  <SheetTitle className="flex items-center gap-2">
                    <SlidersHorizontal aria-hidden="true" className="size-4" />
                    סינון
                  </SheetTitle>
                  <SheetDescription>
                    קטגוריה, חומר, אבן, מחיר, סגנון, אירוע וקולקציה.
                  </SheetDescription>
                </SheetHeader>
                <div className="p-[var(--ui-panel-padding)]">
                  <DeferredCategoryFilterPanel
                    closeOnSelect
                    data={filterPayload}
                  />
                </div>
                <div className="bg-popover sticky bottom-0 grid grid-cols-2 gap-2 border-t border-[var(--glass-border)] p-[var(--ui-panel-padding)]">
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
                    <Button type="button" variant="secondary">
                      סגירה
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </CategoryFilterSheet>
          </div>
        </div>

        <div className="h-px" id="category-filters" />

        <RevealSection className="mx-auto grid w-full max-w-[96rem] gap-8 px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:grid-cols-[270px_1fr] lg:px-[var(--ui-page-x-wide)] lg:py-[var(--ui-section-y)]">
          <aside
            className="hidden lg:block"
            data-testid="category-filter-panel"
          >
            <div className="sticky top-24 border-y border-[var(--glass-border)] py-5">
              <div className="pb-4">
                <h2 className="flex items-center gap-2 text-base font-medium">
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                  סינון
                </h2>
              </div>
              <DeferredCategoryFilterPanel data={filterPayload} />
            </div>
          </aside>

          <section
            aria-labelledby="category-results"
            className="min-w-0"
            id="category-products"
          >
            <div className="mb-5 hidden border-b border-[var(--glass-border)] pb-4 lg:block">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-medium" id="category-results">
                    {pageRangeLabel}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {!hasCategoryProducts
                      ? "נעדכן את הקטגוריה בקרוב"
                      : filteredProducts.length > productsPerPage
                        ? `עמוד ${currentPage} מתוך ${totalPages}`
                        : hasActiveFilters
                          ? "התוצאות מסוננות לפי הבחירה שלך"
                          : "בחירות פתוחות מתוך הקולקציה"}
                    <span className="mx-2">·</span>
                    <span>מיון: {currentSortLabel}</span>
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={resetHref} scroll={false}>
                      איפוס
                    </Link>
                  </Button>
                )}
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
                  className="ui-equal-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  data-layout-equal-group="category-products"
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
    </>
  );
}

function CategoryBreadcrumbs({ categoryName }: { categoryName: string }) {
  return (
    <nav
      aria-label="פירורי לחם"
      className="mx-auto flex w-full max-w-[96rem] items-center gap-2 px-[var(--ui-page-x)] pt-6 text-xs text-muted-foreground sm:px-[var(--ui-page-x-wide)]"
      dir="rtl"
    >
      <Link className="hover:text-foreground transition-colors" href="/">
        בית
      </Link>
      <span aria-hidden="true">›</span>
      <Link className="hover:text-foreground transition-colors" href="/search">
        קולקציות
      </Link>
      <span aria-hidden="true">›</span>
      <span className="text-foreground">{categoryName}</span>
    </nav>
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
          <Button asChild variant="outline">
            <Link href="/search">חיפוש בכל המבחר</Link>
          </Button>
        }
        description="הקטגוריה קיימת, אך אין בה כרגע פריטים פתוחים. אפשר לעבור לחיפוש הרחב או לבחור קטגוריה אחרת."
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
                איפוס סינונים
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/search">חיפוש בכל המבחר</Link>
          </Button>
        </>
      }
      description="אפשר לנקות את הבחירה או להרחיב את החיפוש בכל המבחר."
      icon={Gem}
      testId="category-empty-state"
      title="לא נמצאה התאמה לבחירה הזו"
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
      aria-label="עמודי פריטים"
      className="mt-10 flex flex-col items-center justify-between gap-3 sm:flex-row"
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
