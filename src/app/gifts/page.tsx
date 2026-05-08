import Link from "next/link";
import Image from "next/image";
import { Gift, MapPin, Sparkles, WalletCards } from "lucide-react";

import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  getFeaturedCatalogProducts,
  searchCatalogProducts,
} from "~/server/services/catalog";

export const metadata = {
  title: "מתנות",
};

const giftHighlights = [
  { icon: WalletCards, label: "לפי תקציב", value: "עד 700 ומעלה" },
  { icon: Gift, label: "אריזה", value: "מוכנה למסירה" },
  { icon: MapPin, label: "איסוף", value: "לפי זמינות סניף" },
];

export default async function GiftsPage() {
  const giftProducts = await searchCatalogProducts({ query: "מתנה" });
  const products =
    giftProducts.length > 0
      ? giftProducts
      : await getFeaturedCatalogProducts(8);

  return (
    <main>
      <SiteHeader />
      <RevealSection className="editorial-band signature-grid border-b border-[var(--glass-border)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:items-stretch lg:py-14">
          <div className="flex min-w-0 flex-col justify-center">
            <Badge className="mb-4 w-fit" variant="secondary">
              מתנות Aphrodite
            </Badge>
            <h1 className="editorial-title max-w-2xl text-3xl font-semibold text-balance sm:text-4xl">
              בחירה מהירה למתנה שנראית אישית
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
              מסלול קצר לפי תקציב, סגנון וזמינות בסניף, עם פריטים שנראים טוב גם
              כמתנה ראשונה וגם כתוספת מדויקת לאירוע.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {giftHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="commerce-command flex min-w-0 items-center gap-3 rounded-md px-3 py-3"
                    key={item.label}
                  >
                    <span className="bg-background grid size-9 shrink-0 place-items-center rounded-md border border-[var(--glass-border)]">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="text-muted-foreground block text-xs">
                        {item.label}
                      </span>
                      <span className="block truncate text-sm font-medium">
                        {item.value}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/ai?tool=gifts">
                  שאלון מתנה חכם
                  <Sparkles className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/search?maxPrice=700">מתנות עד 700</Link>
              </Button>
            </div>
          </div>

          {products[0]?.image ? (
            <div className="maison-frame product-tile-image overflow-hidden">
              <div className="bg-muted relative aspect-[4/3] min-h-64 overflow-hidden">
                <Image
                  alt=""
                  className="media-color object-cover"
                  fill
                  priority
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  src={products[0].image}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.46),rgba(0,0,0,0.04)_58%)]" />
                <Badge className="bg-background/95 absolute right-4 bottom-4">
                  בחירה מובילה
                </Badge>
              </div>
            </div>
          ) : null}
        </div>
      </RevealSection>

      <RevealSection className="product-spotlight px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-start">
            <div className="max-w-2xl">
              <p className="text-muted-foreground text-sm">נבחרים למתנה</p>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                פריטים שקל לבחור ולמסור
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                תכשיטים עם מחיר ברור, חומר, אבן וזמינות לפני הכניסה לעמוד המוצר.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/search?maxPrice=1000">כל מתנות התקציב</Link>
            </Button>
          </div>
          <RevealGrid className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard
                imagePriority={index === 0}
                key={product.slug}
                product={product}
              />
            ))}
          </RevealGrid>
        </div>
      </RevealSection>
    </main>
  );
}
