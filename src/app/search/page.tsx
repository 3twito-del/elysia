import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { db } from "~/server/db";
import {
  searchProvider,
  type ProductSearchInput,
} from "~/server/adapters/search";
import {
  getCatalogBranches,
  getCatalogCategories,
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
    sort?: ProductSearchInput["sort"];
  }>;
};

export const metadata = {
  title: "חיפוש",
};

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const input: ProductSearchInput = {
    query: params.q,
    category: params.category,
    branch: params.branch,
    material: params.material,
    stone: params.stone,
    collection: params.collection,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    availableOnly: params.availableOnly === "1",
    sort: params.sort,
  };
  const [result, categories, branches] = await Promise.all([
    searchProvider.searchProducts(input),
    getCatalogCategories(),
    getCatalogBranches(),
  ]);

  await recordSearchEvent(input, result.hits.length);

  return (
    <main>
      <SiteHeader />
      <RevealSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-semibold">חיפוש בקטלוג</h1>
        <form
          aria-label="חיפוש בקטלוג"
          className="glass-panel mt-6 grid gap-3 rounded-md border p-3 lg:grid-cols-[1fr_repeat(4,160px)_120px]"
          role="search"
        >
          <Input
            aria-label="חיפוש מוצר, חומר, אבן, אירוע או תקציב"
            className="h-12"
            defaultValue={params.q}
            name="q"
            placeholder="חיפוש מוצר, חומר, אבן, אירוע או תקציב"
          />
          <select
            className="glass-control h-12 rounded-md border px-3 text-sm"
            defaultValue={params.category}
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
            className="glass-control h-12 rounded-md border px-3 text-sm"
            defaultValue={params.branch}
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
            className="h-12"
            defaultValue={params.maxPrice}
            min={0}
            name="maxPrice"
            placeholder="מחיר עד"
            type="number"
          />
          <select
            className="glass-control h-12 rounded-md border px-3 text-sm"
            defaultValue={params.sort ?? "relevance"}
            name="sort"
          >
            <option value="relevance">רלוונטיות</option>
            <option value="price-asc">מחיר עולה</option>
            <option value="price-desc">מחיר יורד</option>
            <option value="newest">חדש</option>
            <option value="popular">פופולרי</option>
          </select>
          <Button className="h-12" type="submit">
            חיפוש
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {result.facets.flatMap((facet) =>
            facet.values.slice(0, 6).map((value) => (
              <span
                className="glass-inset rounded-md border px-3 py-1"
                key={`${facet.field}:${value.value}`}
              >
                {value.value} · {value.count}
              </span>
            )),
          )}
        </div>

        {result.hits.length === 0 ? (
          <div className="glass-inset mt-10 rounded-md border p-8">
            <p className="text-lg font-medium">לא נמצאו תוצאות</p>
            <p className="text-muted-foreground mt-2 text-sm">
              נסו להסיר מסנן או לחפש לפי שם קולקציה, חומר או סניף.
            </p>
          </div>
        ) : (
          <RevealGrid className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {result.hits.map((product, index) => (
              <ProductCard
                key={product.slug}
                product={product}
                searchContext={{ position: index, query: params.q }}
              />
            ))}
          </RevealGrid>
        )}
      </RevealSection>
    </main>
  );
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
