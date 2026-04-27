import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Gem,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { BranchCard } from "~/components/branch-card";
import { MetricCard } from "~/components/metric-card";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { branches, categories, getFeaturedProducts } from "~/lib/catalog";

export default function Home() {
  const featuredProducts = getFeaturedProducts();

  return (
    <main>
      <SiteHeader />

      <RevealSection className="relative min-h-[78vh] overflow-hidden">
        <Image
          alt="תכשיטי זהב ויהלומים על משטח סטודיו נקי"
          className="object-cover grayscale"
          fill
          priority
          sizes="100vw"
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=2200&q=85"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-4 pt-24 pb-12 sm:px-6 lg:pb-16">
          <div className="max-w-2xl text-white">
            <Badge className="text-foreground mb-5 bg-white/75 shadow-none backdrop-blur">
              יוקרה נגישה | איסוף מסניף | מדידה בתיאום
            </Badge>
            <h1 className="text-5xl leading-[1.05] font-semibold tracking-normal sm:text-6xl lg:text-7xl">
              Aphrodite
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/90">
              רשת תכשיטים ישראלית עם קו סטודיו מודרני, קטלוג אונליין מלא, זמינות
              לפי סניף וייעוץ אישי לבחירת מתנה, טבעת או סט יומיומי.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/category/rings">
                  לקולקציה
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="border-white/35 bg-white/15 text-white backdrop-blur hover:bg-white/25"
                size="lg"
                variant="outline"
              >
                <Link href="/stylist">
                  ייעוץ סטייליסט AI
                  <Sparkles className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                { icon: MapPin, label: "זמינות לפי סניף" },
                { icon: Sparkles, label: "ייעוץ אישי" },
                { icon: ShieldCheck, label: "קופה מאובטחת" },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="flex min-h-16 items-center gap-3 rounded-md border border-white/20 bg-white/15 px-4 py-3 text-sm font-medium text-white shadow-none backdrop-blur"
                    key={item.label}
                  >
                    <Icon className="size-5" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="border-b border-black/10 bg-white/65 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-muted-foreground text-sm">חיפוש מהיר</p>
            <h2 className="text-2xl font-semibold">מה תרצי למצוא היום?</h2>
          </div>
          <form
            action="/search"
            aria-label="חיפוש בקטלוג"
            className="grid gap-3 sm:grid-cols-[1fr_auto]"
            role="search"
          >
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              <Input
                className="h-12 pr-10"
                name="q"
                placeholder="טבעת זהב, עגילי פנינה, מתנה עד 700..."
              />
            </div>
            <Button className="h-12 gap-2" type="submit">
              חיפוש
              <Search className="size-4" />
            </Button>
          </form>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-muted-foreground text-sm">קטגוריות</p>
            <h2 className="text-3xl font-semibold">מסלול קצר למוצר הנכון</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/search">כל הקטלוג</Link>
          </Button>
        </div>
        <RevealGrid className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              className="group flex min-h-[220px] w-full flex-col rounded-md border border-black/10 bg-white/65 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-white/85 hover:shadow-lg hover:shadow-black/[0.04]"
              href={`/category/${category.slug}`}
              key={category.slug}
            >
              <div className="mb-5 flex size-11 items-center justify-center rounded-md border border-black/10 bg-black/[0.04]">
                <Gem className="text-foreground size-5" />
              </div>
              <h3 className="text-xl font-medium">{category.name}</h3>
              <p className="text-muted-foreground mt-2 min-h-12 text-sm leading-6">
                {category.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium group-hover:underline">
                צפייה
                <ArrowLeft className="size-4" />
              </span>
            </Link>
          ))}
        </RevealGrid>
      </RevealSection>

      <RevealSection className="bg-black/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-muted-foreground text-sm">נבחרים</p>
              <h2 className="text-3xl font-semibold">תכשיטים זמינים לקנייה</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/category/rings">טבעות מובילות</Link>
            </Button>
          </div>
          <RevealGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </RevealGrid>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <RevealGrid className="grid gap-5 lg:grid-cols-4">
          <MetricCard
            detail="זמינות לפי סניף לפני הגעה"
            icon={MapPin}
            label="סניפים"
            variant="soft"
            value="2"
          />
          <MetricCard
            detail="איסוף, משלוח או החזרה בסניף"
            icon={ShieldCheck}
            label="אומניצ׳אנל"
            variant="soft"
            value="מלא"
          />
          <MetricCard
            detail="מתנות, אירועים ותקציב"
            icon={Sparkles}
            label="סטייליסט AI"
            variant="soft"
            value="פעיל"
          />
          <MetricCard
            detail="מדידה וייעוץ אישי"
            icon={CalendarCheck}
            label="תורים"
            variant="soft"
            value="בתיאום"
          />
        </RevealGrid>
      </RevealSection>

      <Separator />

      <RevealSection className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8">
          <p className="text-muted-foreground text-sm">סניפים</p>
          <h2 className="text-3xl font-semibold">איסוף, מדידה ושירות קרוב</h2>
        </div>
        <RevealGrid className="grid gap-5 lg:grid-cols-2">
          {branches.map((branch) => (
            <BranchCard branch={branch} key={branch.slug} />
          ))}
        </RevealGrid>
      </RevealSection>
    </main>
  );
}
