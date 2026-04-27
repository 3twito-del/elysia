import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { searchProducts } from "~/lib/catalog";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export const metadata = {
  title: "חיפוש",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const products = searchProducts({
    query: params.q,
    category: params.category,
  });

  return (
    <main>
      <SiteHeader />
      <RevealSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-semibold">חיפוש בקטלוג</h1>
        <form
          aria-label="חיפוש בקטלוג"
          className="mt-6 grid gap-3 rounded-md border border-black/10 bg-white/65 p-3 shadow-none backdrop-blur sm:grid-cols-[1fr_auto]"
          role="search"
        >
          <Input
            aria-label="חיפוש מוצר, חומר, אבן, אירוע או תקציב"
            className="h-12"
            defaultValue={params.q}
            name="q"
            placeholder="חפשי לפי מוצר, חומר, אבן, אירוע או תקציב"
          />
          <Button className="h-12" type="submit">
            חיפוש
          </Button>
        </form>
        <RevealGrid className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </RevealGrid>
      </RevealSection>
    </main>
  );
}
