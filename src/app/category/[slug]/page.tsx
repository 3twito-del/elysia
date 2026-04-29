import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Filter,
  Gem,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  formatPrice,
  getCatalogBranches,
  getCatalogCategories,
  getCatalogCategoryBySlug,
  getCatalogFacets,
  searchCatalogProducts,
  type CatalogBranch,
  type CatalogCategory,
} from "~/server/services/catalog";
import { cn } from "~/lib/utils";

type CategoryRouteProps = {
  params: Promise<{ slug: string }>;
};

type CategorySearchParams = {
  branch?: string | string[];
  material?: string | string[];
  stone?: string | string[];
  maxPrice?: string | string[];
  page?: string | string[];
};

type CategoryPageProps = CategoryRouteProps & {
  searchParams: Promise<CategorySearchParams>;
};

type CategoryFilters = {
  branch?: string;
  material?: string;
  stone?: string;
  maxPrice?: number;
};

type ActiveFilter = {
  key: keyof CategoryFilters;
  label: string;
  href: string;
};

const productsPerPage = 9;
const priceOptions = [750, 1000, 1500] as const;

export async function generateStaticParams() {
  const categories = await getCatalogCategories();

  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCatalogCategoryBySlug(slug);

  return {
    title: category?.name ?? "קטגוריה",
    description: category?.description,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const [categories, branches, category, facets] = await Promise.all([
    getCatalogCategories(),
    getCatalogBranches(),
    getCatalogCategoryBySlug(slug),
    getCatalogFacets(),
  ]);
  const filters = parseCategoryFilters(query, {
    branches,
    materialOptions: facets.materials,
    stoneOptions: facets.stones,
  });
  const [baseProducts, filteredProducts, categoryCounts] = await Promise.all([
    searchCatalogProducts({ category: slug }),
    searchCatalogProducts({
      category: slug,
      branch: filters.branch,
      material: filters.material,
      stone: filters.stone,
      maxPrice: filters.maxPrice,
    }),
    getCategoryCounts(categories),
  ]);
  const activeFilters = getActiveFilters(slug, filters, branches);
  const activeFilterCount = activeFilters.length;
  const resetHref = createCategoryHref(slug, {});
  const requestedPage = getValidPage(getFirstParam(query.page));
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage),
  );
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStartIndex = (currentPage - 1) * productsPerPage;
  const pageProducts = filteredProducts.slice(
    pageStartIndex,
    pageStartIndex + productsPerPage,
  );
  const visibleStart = filteredProducts.length > 0 ? pageStartIndex + 1 : 0;
  const visibleEnd = Math.min(
    pageStartIndex + pageProducts.length,
    filteredProducts.length,
  );
  const pageRangeLabel =
    filteredProducts.length > 0
      ? `${visibleStart}-${visibleEnd} מתוך ${filteredProducts.length} מוצרים`
      : "0 מוצרים";

  return (
    <main>
      <SiteHeader />

      <RevealSection className="liquid-section border-b border-[var(--glass-border)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <div className="glass-panel grid gap-6 rounded-md border p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch">
            <div>
              <Badge className="mb-4" variant="secondary">
                קטלוג Aphrodite
              </Badge>
              <div className="flex flex-wrap items-end gap-3">
                <h1 className="text-3xl font-semibold sm:text-4xl">
                  {category?.name ?? "קטגוריה"}
                </h1>
                <span className="text-muted-foreground pb-1 text-sm">
                  {filteredProducts.length} מתוך {baseProducts.length} מוצרים
                </span>
              </div>
              <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
                {category?.description ??
                  "בחירה מסוננת מתוך קטלוג התכשיטים, עם זמינות סניפים ומחירים בשקלים."}
              </p>
            </div>

            <div className="grid gap-4">
              {category?.image ? (
                <div className="relative h-36 overflow-hidden rounded-md border border-[var(--glass-border)] bg-white/35">
                  <Image
                    alt=""
                    className="media-mono object-cover"
                    fill
                    sizes="280px"
                    src={category.image}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(255,255,255,0.56),rgba(255,255,255,0.04))]" />
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {activeFilters.length > 0 ? (
                  activeFilters.map((filter) => (
                    <Badge
                      asChild
                      className="h-7 gap-1 pr-2 pl-1"
                      key={filter.key}
                      variant="outline"
                    >
                      <Link href={filter.href} scroll={false}>
                        <span>{filter.label}</span>
                        <X className="size-3" />
                        <span className="sr-only">הסרת פילטר</span>
                      </Link>
                    </Badge>
                  ))
                ) : (
                  <Badge className="h-7" variant="outline">
                    ללא פילטרים פעילים
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      <div className="glass-chrome sticky top-16 z-30 border-b lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="text-sm">
            <p className="font-medium">{pageRangeLabel}</p>
            <p className="text-muted-foreground text-xs">
              {activeFilterCount > 0
                ? `${activeFilterCount} פילטרים פעילים`
                : "כל הפריטים בקטגוריה"}
            </p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="gap-2" type="button" variant="outline">
                <Filter className="size-4" />
                פילטרים
                {activeFilterCount > 0 && (
                  <Badge className="h-5 px-1.5" variant="secondary">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              className="w-[min(92vw,390px)] overflow-y-auto p-0"
              side="right"
            >
              <SheetHeader className="border-b border-[var(--glass-border)] p-4">
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4" />
                  פילטרים
                </SheetTitle>
                <SheetDescription>
                  בחירה מהירה לפי זמינות, חומר, אבן ומחיר.
                </SheetDescription>
              </SheetHeader>
              <div className="p-4">
                <FilterPanel
                  activeFilterCount={activeFilterCount}
                  branches={branches}
                  categories={categories}
                  categoryCounts={categoryCounts}
                  closeOnSelect
                  filters={filters}
                  materialOptions={facets.materials}
                  resetHref={resetHref}
                  slug={slug}
                  stoneOptions={facets.stones}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <RevealSection className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[296px_1fr] lg:py-10">
        <aside className="hidden lg:block">
          <Card className="sticky top-24 rounded-md" size="sm">
            <CardHeader className="border-b border-[var(--glass-border)] pb-4">
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                פילטרים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FilterPanel
                activeFilterCount={activeFilterCount}
                branches={branches}
                categories={categories}
                categoryCounts={categoryCounts}
                filters={filters}
                materialOptions={facets.materials}
                resetHref={resetHref}
                slug={slug}
                stoneOptions={facets.stones}
              />
            </CardContent>
          </Card>
        </aside>

        <section aria-labelledby="category-results" className="min-w-0">
          <div className="glass-chrome sticky top-20 z-20 mb-5 rounded-md border p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-medium" id="category-results">
                  {pageRangeLabel}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {filteredProducts.length > productsPerPage
                    ? `עמוד ${currentPage} מתוך ${totalPages}`
                    : activeFilterCount > 0
                      ? "התוצאות מסוננות לפי הבחירה שלך"
                      : "כל הפריטים הזמינים בקטגוריה"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilterCount > 0 && (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={resetHref} scroll={false}>
                      איפוס
                    </Link>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline">
                  <Link href="/ai">
                    <Sparkles className="size-3.5" />
                    התאמה אישית
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <RevealGrid className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pageProducts.map((product) => (
                  <ProductCard key={product.slug} product={product} />
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
            <div className="glass-panel grid min-h-80 place-items-center rounded-md border p-8 text-center">
              <div className="max-w-md">
                <div className="glass-inset mx-auto mb-4 flex size-12 items-center justify-center rounded-md border">
                  <Gem className="size-5" />
                </div>
                <h3 className="text-xl font-semibold">
                  לא נמצאו מוצרים בהתאמה הזו
                </h3>
                <p className="text-muted-foreground mt-2 leading-7">
                  אפשר לרענן את הבחירה או לתת לסטייליסט למצוא עבורך שילוב מדויק.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button asChild variant="outline">
                    <Link href={resetHref} scroll={false}>
                      איפוס פילטרים
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/ai">התאמה אישית</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </RevealSection>
    </main>
  );
}

function FilterPanel({
  slug,
  filters,
  categories,
  branches,
  materialOptions,
  stoneOptions,
  categoryCounts,
  activeFilterCount,
  resetHref,
  closeOnSelect = false,
}: {
  slug: string;
  filters: CategoryFilters;
  categories: CatalogCategory[];
  branches: CatalogBranch[];
  materialOptions: string[];
  stoneOptions: string[];
  categoryCounts: Map<string, number>;
  activeFilterCount: number;
  resetHref: string;
  closeOnSelect?: boolean;
}) {
  return (
    <div className="grid gap-5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {activeFilterCount > 0
            ? `${activeFilterCount} בחירות פעילות`
            : "בחירה נקייה"}
        </p>
        {activeFilterCount > 0 && (
          <FilterActionLink
            closeOnSelect={closeOnSelect}
            href={resetHref}
            variant="ghost"
          >
            איפוס
          </FilterActionLink>
        )}
      </div>

      <FilterSection title="קטגוריה">
        {categories.map((item) => (
          <FilterOptionLink
            active={item.slug === slug}
            closeOnSelect={closeOnSelect}
            href={createCategoryHref(item.slug, filters)}
            key={item.slug}
            label={item.name}
            meta={`${categoryCounts.get(item.slug) ?? 0} מוצרים`}
          />
        ))}
      </FilterSection>

      <Separator />

      <FilterSection title="זמינות">
        {branches.map((branch) => {
          const active = filters.branch === branch.slug;
          return (
            <FilterOptionLink
              active={active}
              closeOnSelect={closeOnSelect}
              href={createCategoryHref(slug, {
                ...filters,
                branch: active ? undefined : branch.slug,
              })}
              icon={<MapPin className="size-3.5" />}
              key={branch.slug}
              label={branch.city}
              meta="מלאי בסניף"
            />
          );
        })}
      </FilterSection>

      <Separator />

      <FilterSection title="חומר">
        {materialOptions.map((material) => {
          const active = filters.material === material;
          return (
            <FilterOptionLink
              active={active}
              closeOnSelect={closeOnSelect}
              href={createCategoryHref(slug, {
                ...filters,
                material: active ? undefined : material,
              })}
              key={material}
              label={material}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="אבן">
        {stoneOptions.map((stone) => {
          const active = filters.stone === stone;
          return (
            <FilterOptionLink
              active={active}
              closeOnSelect={closeOnSelect}
              href={createCategoryHref(slug, {
                ...filters,
                stone: active ? undefined : stone,
              })}
              key={stone}
              label={stone}
            />
          );
        })}
      </FilterSection>

      <Separator />

      <FilterSection title="מחיר">
        {priceOptions.map((price) => {
          const active = filters.maxPrice === price;
          return (
            <FilterOptionLink
              active={active}
              closeOnSelect={closeOnSelect}
              href={createCategoryHref(slug, {
                ...filters,
                maxPrice: active ? undefined : price,
              })}
              key={price}
              label={`עד ${formatPrice(price)}`}
            />
          );
        })}
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-2" aria-label={title}>
      <p className="font-medium">{title}</p>
      <div className="grid gap-1">{children}</div>
    </section>
  );
}

function FilterOptionLink({
  href,
  label,
  meta,
  icon,
  active,
  closeOnSelect,
}: {
  href: string;
  label: string;
  meta?: string;
  icon?: ReactNode;
  active?: boolean;
  closeOnSelect?: boolean;
}) {
  const link = (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        buttonVariants({
          size: "sm",
          variant: active ? "secondary" : "ghost",
        }),
        "h-auto min-h-10 w-full justify-between px-3 py-2 text-right whitespace-normal",
        active && "border-[var(--glass-border-strong)]",
      )}
      href={href}
      scroll={false}
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="min-w-0 truncate">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {meta && <span className="text-muted-foreground text-xs">{meta}</span>}
        {active && <Check className="size-3.5" />}
      </span>
    </Link>
  );

  if (closeOnSelect) {
    return <SheetClose asChild>{link}</SheetClose>;
  }

  return link;
}

function FilterActionLink({
  href,
  children,
  closeOnSelect,
  variant = "outline",
}: {
  href: string;
  children: ReactNode;
  closeOnSelect?: boolean;
  variant?: "outline" | "ghost";
}) {
  const link = (
    <Link
      className={cn(buttonVariants({ size: "sm", variant }))}
      href={href}
      scroll={false}
    >
      {children}
    </Link>
  );

  if (closeOnSelect) {
    return <SheetClose asChild>{link}</SheetClose>;
  }

  return link;
}

function parseCategoryFilters(
  searchParams: CategorySearchParams,
  options: {
    branches: CatalogBranch[];
    materialOptions: string[];
    stoneOptions: string[];
  },
): CategoryFilters {
  const branch = getFirstParam(searchParams.branch);
  const material = getFirstParam(searchParams.material);
  const stone = getFirstParam(searchParams.stone);
  const maxPrice = getFirstParam(searchParams.maxPrice);

  return {
    branch: options.branches.some((item) => item.slug === branch)
      ? branch
      : undefined,
    material:
      material && options.materialOptions.includes(material)
        ? material
        : undefined,
    stone: stone && options.stoneOptions.includes(stone) ? stone : undefined,
    maxPrice: getValidMaxPrice(maxPrice),
  };
}

function getActiveFilters(
  slug: string,
  filters: CategoryFilters,
  branches: CatalogBranch[],
) {
  const selectedBranch = branches.find(
    (branch) => branch.slug === filters.branch,
  );
  const activeFilters: ActiveFilter[] = [];

  if (selectedBranch) {
    activeFilters.push({
      key: "branch",
      label: `זמינות: ${selectedBranch.city}`,
      href: createCategoryHref(slug, { ...filters, branch: undefined }),
    });
  }

  if (filters.material) {
    activeFilters.push({
      key: "material",
      label: `חומר: ${filters.material}`,
      href: createCategoryHref(slug, { ...filters, material: undefined }),
    });
  }

  if (filters.stone) {
    activeFilters.push({
      key: "stone",
      label: `אבן: ${filters.stone}`,
      href: createCategoryHref(slug, { ...filters, stone: undefined }),
    });
  }

  if (filters.maxPrice) {
    activeFilters.push({
      key: "maxPrice",
      label: `עד ${formatPrice(filters.maxPrice)}`,
      href: createCategoryHref(slug, { ...filters, maxPrice: undefined }),
    });
  }

  return activeFilters;
}

function createCategoryHref(slug: string, filters: CategoryFilters) {
  const params = new URLSearchParams();

  if (filters.branch) params.set("branch", filters.branch);
  if (filters.material) params.set("material", filters.material);
  if (filters.stone) params.set("stone", filters.stone);
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));

  const query = params.toString();

  return query ? `/category/${slug}?${query}` : `/category/${slug}`;
}

function createCategoryPageHref(
  slug: string,
  filters: CategoryFilters,
  page: number,
) {
  const params = new URLSearchParams();

  if (filters.branch) params.set("branch", filters.branch);
  if (filters.material) params.set("material", filters.material);
  if (filters.stone) params.set("stone", filters.stone);
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/category/${slug}?${query}` : `/category/${slug}`;
}

function getFirstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];

  return value;
}

function getValidMaxPrice(value?: string) {
  const parsed = Number(value);

  return priceOptions.find((price) => price === parsed);
}

function getValidPage(value?: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) return 1;

  return parsed;
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
              <ChevronRight className="size-4" />
              הקודם
            </Link>
          ) : (
            <span>
              <ChevronRight className="size-4" />
              הקודם
            </span>
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
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span>
              הבא
              <ChevronLeft className="size-4" />
            </span>
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

async function getCategoryCounts(categories: CatalogCategory[]) {
  const entries = await Promise.all(
    categories.map(async (category) => {
      const products = await searchCatalogProducts({ category: category.slug });

      return [category.slug, products.length] as const;
    }),
  );

  return new Map(entries);
}
