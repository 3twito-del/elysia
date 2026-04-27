import Link from "next/link";

import { ProductCard } from "~/components/product-card";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { products } from "~/lib/catalog";

export const metadata = {
  title: "מתנות",
};

export default function GiftsPage() {
  const giftProducts = products.filter((product) =>
    product.tags.includes("מתנה"),
  );

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-semibold">מתנות תכשיטים</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
              בחירות קלות לקנייה עם אריזת מתנה, ברכה אישית והתאמה לפי תקציב.
            </p>
          </div>
          <Button asChild>
            <Link href="/stylist">שאלון מתנה חכם</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {giftProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
