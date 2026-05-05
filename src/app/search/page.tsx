import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import { Search, Sparkles, X } from "lucide-react";

import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { Input } from "~/components/ui/input";
import { db } from "~/server/db";
import {
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
  const result = await searchProvider.searchProducts(input);
  const activeFilters = getActiveSearchFilters(input, categories, branches);
  const hasActiveFilters = activeFilters.length > 0;
  const firstCategory = categories[0];
  const visibleFacets = result.facets.flatMap((facet) =>
    facet.values
      .filter((value) => value.count > 0)
      .slice(0, 6)
      .map((value) => ({
        field: facet.field,
        ...value,
      })),
  );
  const resultSummary =
    result.hits.length === 1
      ? "נמצאה תוצאה אחת"
      : `נמצאו ${result.hits.length} תוצאות`;

  after(() => recordSearchEvent(input, result.hits.length));

  return (
    <main>
      <SiteHeader />
      <RevealSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold">חיפוש בקטלוג</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
              תוצאות הקטלוג נשארות נקיות ומדויקות, עם צבע שמגיע מהפריטים עצמם.
            </p>
          </div>
          {result.hits[0]?.image ? (
            <div className="glass-inset bg-muted relative hidden h-32 overflow-hidden rounded-md border lg:block">
              <Image
                alt=""
                className="media-mono object-cover"
                fill
                sizes="260px"
                src={result.hits[0].image}
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(255,255,255,0.58),rgba(255,255,255,0.04))]" />
            </div>
          ) : null}
        </div>
        <form
          aria-label="חיפוש בקטלוג"
          className="glass-panel mt-6 grid gap-3 rounded-md border p-3 lg:grid-cols-[1fr_repeat(4,160px)_120px]"
          data-testid="search-form"
          role="search"
        >
          <Input
            aria-label="חיפוש מוצר, חומר, אבן, אירוע או תקציב"
            className="h-12"
            defaultValue={input.query}
            name="q"
            placeholder="חיפוש מוצר, חומר, אבן, אירוע או תקציב"
          />
          <select
            aria-label="סינון לפי קטגוריה"
            className="glass-control h-12 rounded-md border px-3 text-sm"
            defaultValue={input.category}
            name="category"
          >
            <option value="">כל הקטגוריות</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            aria-label="סינון לפי סניף"
            className="glass-control h-12 rounded-md border px-3 text-sm"
            defaultValue={input.branch}
            name="branch"
          >
            <option value="">כל הסניפים</option>
            {branches.map((branch) => (
              <option key={branch.slug} value={branch.slug}>
                {branch.name}
              </option>
            ))}
          </select>
          <Input
            aria-label="מחיר מקסימלי"
            className="h-12"
            defaultValue={input.maxPrice}
            min={0}
            name="maxPrice"
            placeholder="מחיר עד"
            type="number"
          />
          <select
            aria-label="מיון תוצאות"
            className="glass-control h-12 rounded-md border px-3 text-sm"
            defaultValue={input.sort ?? "relevance"}
            name="sort"
          >
            <option value="relevance">רלוונטיות</option>
            <option value="price-asc">מחיר עולה</option>
            <option value="price-desc">מחיר יורד</option>
            <option value="newest">חדש</option>
            <option value="popular">פופולרי</option>
          </select>
          <Button className="h-12 gap-2" type="submit">
            <Search className="size-4" />
            חיפוש
          </Button>
        </form>

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
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {visibleFacets.map((value) => (
              <span
                className="glass-inset rounded-md border px-3 py-1"
                key={`${value.field}:${value.value}`}
              >
                {value.value} · {value.count}
              </span>
            ))}
          </div>
        ) : null}

        <section
          aria-labelledby="search-results"
          className="glass-chrome mt-8 rounded-md border p-3"
          data-testid="search-results-summary"
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
          <RevealGrid
            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            data-testid="search-results-grid"
          >
            {result.hits.map((product, index) => (
              <ProductCard
                imagePriority={index === 0}
                key={product.slug}
                product={product}
                searchContext={{ position: index, query: input.query }}
              />
            ))}
          </RevealGrid>
        )}
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
      label: `חיפוש: ${input.query}`,
      href: createSearchHref({ ...input, query: undefined }),
    });
  }

  if (selectedCategory) {
    filters.push({
      key: "category",
      label: `קטגוריה: ${selectedCategory.name}`,
      href: createSearchHref({ ...input, category: undefined }),
    });
  }

  if (selectedBranch) {
    filters.push({
      key: "branch",
      label: `סניף: ${selectedBranch.city}`,
      href: createSearchHref({ ...input, branch: undefined }),
    });
  }

  if (input.material) {
    filters.push({
      key: "material",
      label: `חומר: ${input.material}`,
      href: createSearchHref({ ...input, material: undefined }),
    });
  }

  if (input.stone) {
    filters.push({
      key: "stone",
      label: `אבן: ${input.stone}`,
      href: createSearchHref({ ...input, stone: undefined }),
    });
  }

  if (input.collection) {
    filters.push({
      key: "collection",
      label: `קולקציה: ${input.collection}`,
      href: createSearchHref({ ...input, collection: undefined }),
    });
  }

  if (input.maxPrice) {
    filters.push({
      key: "maxPrice",
      label: `עד ${formatPrice(input.maxPrice)}`,
      href: createSearchHref({ ...input, maxPrice: undefined }),
    });
  }

  if (input.availableOnly) {
    filters.push({
      key: "availableOnly",
      label: "זמין במלאי",
      href: createSearchHref({ ...input, availableOnly: undefined }),
    });
  }

  if (input.sort && input.sort !== "relevance") {
    filters.push({
      key: "sort",
      label: getSortLabel(input.sort),
      href: createSearchHref({ ...input, sort: undefined }),
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

  const query = params.toString();

  return query ? `/search?${query}` : "/search";
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
