import type { Metadata } from "next";
import Link from "next/link";
import { AphroditeIcon } from "~/components/icon";

import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { categories, getProductsByCategory } from "~/lib/catalog";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  return {
    title: category?.name ?? "קטגוריה",
    description: category?.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  const products = getProductsByCategory(slug);

  return (
    <main>
      <SiteHeader />
      <RevealSection className="border-b border-black/10 bg-black/[0.03] backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Badge className="mb-4 shadow-none" variant="secondary">
            קטלוג Aphrodite
          </Badge>
          <h1 className="text-4xl font-semibold">
            {category?.name ?? "קטגוריה"}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            {category?.description ??
              "בחירה מסוננת מתוך קטלוג התכשיטים, עם זמינות סניפים ומחירים בשקלים."}
          </p>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <Card className="sticky top-24 rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AphroditeIcon name="sliders" className="size-4" />
                פילטרים
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm">
              <div>
                <p className="mb-2 font-medium">קטגוריה</p>
                <div className="grid gap-1">
                  {categories.map((item) => (
                    <Button
                      asChild
                      className="justify-start"
                      key={item.slug}
                      variant={item.slug === slug ? "secondary" : "ghost"}
                    >
                      <Link href={`/category/${item.slug}`}>{item.name}</Link>
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-2 font-medium">זמינות</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">תל אביב</Badge>
                  <Badge variant="outline">ירושלים</Badge>
                  <Badge variant="outline">איסוף היום</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-2 font-medium">חומר</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">זהב צהוב</Badge>
                  <Badge variant="secondary">זהב לבן</Badge>
                  <Badge variant="secondary">יהלום</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {products.length} מוצרים
            </p>
            <Button asChild variant="outline">
              <Link href="/stylist">התאמה אישית</Link>
            </Button>
          </div>
          <RevealGrid className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </RevealGrid>
        </div>
      </RevealSection>
    </main>
  );
}
