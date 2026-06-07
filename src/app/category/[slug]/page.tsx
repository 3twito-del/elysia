import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Filter, Gem, SlidersHorizontal, X } from "lucide-react";

import { CategoryFilterSheet } from "./_components/category-filter-sheet";
import { CategoryPaginationLink } from "./_components/category-pagination-link";
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
  type CategoryNoResultRecoveryAction,
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
  getCatalogCategoryBySlugCachedRequest,
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
    description: "צמידים דקים לשכבות, למתנה או לברק קטן על היד.",
    intro: "ליום רגיל, לחופשה ולערב שמבקש עוד נקודת אור.",
    title: "צמידים",
  },
  earrings: {
    description: "עגילים קטנים או נוכחים לפי משקל, גימור ונוחות ענידה.",
    intro: "ליום, לערב, למשרד ולמתנה שנפתחת מיד.",
    title: "עגילים",
  },
  necklaces: {
    description:
      "שרשראות ותליונים שנראים טוב לבד או בשכבות, לפי אורך, חומר ואבן.",
    intro: "קו על הצוואר שמשנה חולצה פשוטה, שמלה או לוק חופשה.",
    title: "שרשראות",
  },
  rings: {
    description: "טבעות זהב, יהלומים ואבני חן לפי פרופורציה, נוחות ומידה.",
    intro: "טבעת אחת עם נוכחות, או כמה יחד כשבא יותר אור על היד.",
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
  const category = copy
    ? null
    : await getCatalogCategoryBySlugCachedRequest(slug);

  if (!copy && !category) {
    return {
      title: "המשפחה לא נמצאה",
      description:
        "הקישור לקולקציה אינו פעיל. אפשר להמשיך לחיפוש או לחזור לעמוד הבית.",
      alternates: {
        canonical: `/category/${slug}`,
      },
      robots: {
        follow: false,
        index: false,
      },
    };
  }

  return {
    title: copy?.title ?? category?.name ?? "קולקציית Elysia",
    description: copy?.description ?? category?.description,
    alternates: {
      canonical: `/category/${slug}`,
    },
    openGraph: {
      title: copy?.title ?? category?.name ?? "Elysia",
      description: copy?.description ?? category?.description,
      url: `/category/${slug}`,
      images: [
        {
          url:
            getCategoryBrandSlides(slug)[0]?.src ??
            "/brand/boutique/lifestyle-hero.avif",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy?.title ?? category?.name ?? "Elysia",
      description: copy?.description ?? category?.description,
      images: [
        getCategoryBrandSlides(slug)[0]?.src ??
          "/brand/boutique/lifestyle-hero.avif",
      ],
    },
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
      "פריטים מתוך הקולקציה של Elysia, עם חומר, מידה ומחיר לפני הזמנה.",
    intro: "תכשיטים שאפשר לפתוח מהם לוק, מתנה או ערב.",
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
    noResultRecoveryActions,
    resetHref,
    searchRecoveryHref,
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
  const hasCategoryProducts = baseProducts.length > 0;
  const hasActiveFilters = activeFilterCount > 0;
  const pageRangeLabel =
    sortedProducts.length > 0 ? "כל התכשיטים" : "הקטגוריה מתעדכנת";

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
          eyebrow="קולקציה"
          id="page-hero"
          media={{
            alt: `${categoryCopy.title} מתוך קולקציית Elysia`,
            priority: true,
            sizes: "(min-width: 1024px) 34vw, (min-width: 640px) 60vw, 100vw",
            slides: getCategoryBrandSlides(slug),
          }}
          showMediaOnMobile
          title={categoryCopy.title}
          variant="catalog"
        />

        <div className="bg-background sticky top-16 z-30 border-b border-[var(--glass-border)] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-[var(--ui-page-x)] py-3 sm:px-[var(--ui-page-x-wide)]">
            <div className="text-sm">
              <p className="font-medium">{pageRangeLabel}</p>
              <p
                className="text-muted-foreground text-xs"
                data-testid="category-mobile-filter-sort-summary"
              >
                {hasActiveFilters
                  ? `${activeFilterCount} סינונים פעילים · מיון: ${currentSortLabel}`
                  : hasCategoryProducts
                    ? `כל התכשיטים · מיון: ${currentSortLabel}`
                    : "הקטגוריה מתעדכנת"}
              </p>
              {hasActiveFilters ? (
                <p
                  className="text-muted-foreground max-w-[13rem] truncate text-xs"
                  data-testid="category-mobile-active-refinement-summary"
                >
                  {formatCategoryActiveSelectionPreview(activeFilters)}
                </p>
              ) : null}
            </div>
            <CategoryFilterSheet activeFilterCount={activeFilterCount}>
              <Button
                className="gap-2"
                data-testid="category-filter-trigger"
                type="button"
                variant="outline"
              >
                <Filter aria-hidden="true" className="size-4" />
                סינון לפי לוק
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
                    סינון לפי לוק
                  </SheetTitle>
                  <SheetDescription>
                    בחרו חומר, אבן, מחיר או קולקציה מתוך מה שזמין עכשיו.
                  </SheetDescription>
                  <p
                    className="text-muted-foreground text-xs leading-5"
                    data-testid="category-filter-sheet-summary"
                  >
                    {pageRangeLabel} · מיון: {currentSortLabel}
                    {hasActiveFilters
                      ? ` · ${activeFilterCount} סינונים פעילים`
                      : ""}
                  </p>
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
                        איפוס הכל
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled type="button" variant="outline">
                      איפוס הכל
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

        <RevealSection className="mx-auto grid w-full max-w-[96rem] gap-10 px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:grid-cols-[minmax(13rem,16rem)_1fr] lg:px-[var(--ui-page-x-wide)] lg:py-[var(--ui-section-y)]">
          <aside
            className="hidden lg:block"
            data-testid="category-filter-panel"
          >
            <div className="sticky top-24 border-y border-[var(--glass-border)] py-5">
              <div className="pb-4">
                <h2 className="flex items-center gap-2 text-base font-medium">
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                  סינון לפי לוק
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
                    <span data-testid="category-result-count">
                      {pageRangeLabel}
                    </span>
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {!hasCategoryProducts
                      ? "נעדכן את הקטגוריה בקרוב"
                      : filteredProducts.length > productsPerPage
                        ? `עמוד ${currentPage}`
                        : hasActiveFilters
                          ? "התוצאות מסוננות לפי מה שבחרתם"
                          : "פריטים פתוחים מתוך הקולקציה"}
                    <span className="mx-2">·</span>
                    <span data-testid="category-current-sort-label">
                      מיון: {currentSortLabel}
                    </span>
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={resetHref} scroll={false}>
                      איפוס הכל
                    </Link>
                  </Button>
                )}
              </div>
              {activeFilters.length > 0 && (
                <section
                  aria-label="סינונים פעילים"
                  className="mt-4 border-y border-[var(--glass-border)] py-3"
                  data-testid="category-active-refinement-summary"
                >
                  <div className="mb-3 min-w-0 text-sm">
                    <p className="font-medium">
                      {formatCategoryActiveSelectionCount(activeFilterCount)}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {formatCategoryActiveSelectionPreview(activeFilters)}
                    </p>
                    <p
                      className="text-muted-foreground mt-1 text-xs"
                      data-testid="category-active-sort-summary"
                    >
                      מיון: {currentSortLabel}
                    </p>
                  </div>
                  <div
                    className="flex flex-wrap gap-1.5"
                    data-testid="category-active-refinement-list"
                  >
                    {activeFilters.map((filter) => (
                      <Badge
                        asChild
                        className="h-7 max-w-full gap-1 pr-2 pl-1"
                        key={filter.key}
                        variant="outline"
                      >
                        <Link href={filter.href} scroll={false}>
                          <span className="min-w-0 truncate">
                            {filter.label}
                          </span>
                          <X aria-hidden="true" className="size-3" />
                          <span className="sr-only">הסרת סינון</span>
                        </Link>
                      </Badge>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <>
                <RevealGrid
                  className="ui-equal-grid grid gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3"
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
                <CategoryEditorialNote
                  categoryName={categoryCopy.title}
                  description={categoryCopy.description}
                />
              </>
            ) : (
              <CategoryEmptyState
                hasActiveFilters={hasActiveFilters}
                hasCategoryProducts={hasCategoryProducts}
                recoveryActions={noResultRecoveryActions}
                resetHref={resetHref}
                searchRecoveryHref={searchRecoveryHref}
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
      className="text-muted-foreground mx-auto flex w-full max-w-[96rem] items-center gap-2 px-[var(--ui-page-x)] pt-6 text-xs sm:px-[var(--ui-page-x-wide)]"
      data-testid="category-breadcrumbs"
      dir="rtl"
    >
      <Link className="hover:text-foreground transition-colors" href="/">
        עמוד הבית
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

function CategoryEditorialNote({
  categoryName,
  description,
}: {
  categoryName: string;
  description: string;
}) {
  return (
    <details
      className="mt-8 border-y border-[var(--glass-border)] py-4 text-sm"
      data-testid="category-editorial-care-note"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-3 font-medium">
        <span>טיפ קטן לפני ענידה</span>
        <span className="text-muted-foreground text-xs">{categoryName}</span>
      </summary>
      <p className="text-muted-foreground mt-3 max-w-3xl leading-7">
        {description} מומלץ לשמור בנפרד, להימנע ממים ובושם, ולבחור מידה לפי שימוש
        יומי.
      </p>
    </details>
  );
}

function CategoryEmptyState({
  hasActiveFilters,
  hasCategoryProducts,
  recoveryActions,
  resetHref,
  searchRecoveryHref,
}: {
  hasActiveFilters: boolean;
  hasCategoryProducts: boolean;
  recoveryActions: CategoryNoResultRecoveryAction[];
  resetHref: string;
  searchRecoveryHref: string;
}) {
  if (!hasCategoryProducts) {
    return (
      <EmptyState
        actions={
          <>
            <CategoryRecoveryGuidance actions={recoveryActions} />
            <CategoryRecoveryActions actions={recoveryActions} />
            <Button asChild variant="outline">
              <Link
                data-testid="category-search-recovery-link"
                href={searchRecoveryHref}
              >
                חיפוש בכל התכשיטים
              </Link>
            </Button>
          </>
        }
        description="הקטגוריה קיימת, אך אין בה כרגע פריטים פתוחים. ניתן לעבור לחיפוש או לבחור קטגוריה אחרת."
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
          <CategoryRecoveryGuidance actions={recoveryActions} />
          <CategoryRecoveryActions actions={recoveryActions} />
          <Button asChild variant="outline">
            <Link
              data-testid="category-search-recovery-link"
              href={searchRecoveryHref}
              scroll={false}
            >
              המשך בחיפוש
            </Link>
          </Button>
        </>
      }
      description="אפשר לנקות סינונים, לעבור לקטגוריה קרובה או להרחיב את החיפוש."
      icon={Gem}
      testId="category-empty-state"
      title="לא מצאנו התאמה לסינון הזה"
    />
  );
}

function CategoryRecoveryGuidance({
  actions,
}: {
  actions: CategoryNoResultRecoveryAction[];
}) {
  if (actions.length === 0) return null;

  return (
    <div
      className="text-muted-foreground mx-auto mb-2 grid max-w-md basis-full gap-2 text-sm leading-6 sm:text-start"
      data-testid="category-no-result-recovery"
    >
      <p className="text-foreground font-medium">קטגוריות עם התאמה לסינון</p>
      <ul className="grid gap-1.5">
        {actions.map((action) => (
          <li className="grid gap-0.5" key={`${action.href}-guidance`}>
            <span className="text-foreground font-medium">{action.label}</span>
            <span>{action.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryRecoveryActions({
  actions,
}: {
  actions: CategoryNoResultRecoveryAction[];
}) {
  if (actions.length === 0) return null;

  return (
    <span className="contents" data-testid="category-recovery-actions">
      {actions.map((action) => (
        <Button asChild key={action.href} variant="outline">
          <Link href={action.href} scroll={false}>
            <span>{action.label}</span>
            <span className="text-xs opacity-75">
              {formatCategoryRecoveryResultCount(action.total)}
            </span>
          </Link>
        </Button>
      ))}
    </span>
  );
}

function formatCategoryRecoveryResultCount(total: number) {
  return total === 1 ? "התאמה אחת" : "התאמות";
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
      <p className="text-muted-foreground text-sm">עמוד {currentPage}</p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          asChild={currentPage > 1}
          disabled={currentPage <= 1}
          size="sm"
          variant="outline"
        >
          {currentPage > 1 ? (
            <CategoryPaginationLink
              href={createCategoryPageHref(slug, filters, previousPage)}
              testId="category-pagination-previous"
            >
              הקודם
            </CategoryPaginationLink>
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
              <CategoryPaginationLink
                aria-current={page === currentPage ? "page" : undefined}
                href={createCategoryPageHref(slug, filters, page)}
                testId="category-pagination-page"
              >
                {page}
              </CategoryPaginationLink>
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
            <CategoryPaginationLink
              href={createCategoryPageHref(slug, filters, nextPage)}
              testId="category-pagination-next"
            >
              הבא
            </CategoryPaginationLink>
          ) : (
            <span>הבא</span>
          )}
        </Button>
      </div>
    </nav>
  );
}

function formatCategoryActiveSelectionCount(count: number) {
  return count === 1 ? "סינון פעיל אחד" : `${count} סינונים פעילים`;
}

function formatCategoryActiveSelectionPreview(
  filters: Array<{ label: string }>,
) {
  const labels = filters.slice(0, 3).map((filter) => filter.label);
  const hiddenCount = Math.max(filters.length - labels.length, 0);
  const preview = labels.join(" \u00b7 ");

  return hiddenCount > 0 ? `${preview} +${hiddenCount}` : preview;
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
