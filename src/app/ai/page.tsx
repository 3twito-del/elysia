import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Gift,
  MessageSquare,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { AiGiftRecommender } from "./_components/ai-gift-recommender";
import { StylistChat } from "~/app/stylist/_components/stylist-chat";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { brandMedia } from "~/lib/brand-media";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "כלי AI",
};

type AiPageProps = {
  searchParams?: Promise<{
    tab?: string;
    tool?: string;
  }>;
};

const aiHeroImage = brandMedia.aiHero.url;

const aiHighlights = [
  {
    icon: MessageSquare,
    label: "שיחה אישית",
    value: "תקציב, אירוע וסגנון",
  },
  {
    icon: Gift,
    label: "מתנות",
    value: "בחירה מהירה לפי קשר",
  },
  {
    icon: Search,
    label: "קטלוג חי",
    value: "פריטים זמינים לפתיחה",
  },
];

export default async function AiPage({ searchParams }: AiPageProps) {
  const search = searchParams ? await searchParams : {};
  const defaultTab =
    search.tab === "gifts" || search.tool === "gifts" ? "gifts" : "stylist";

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <RevealSection className="editorial-band signature-grid border-b border-[var(--glass-border)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
          <Tabs className="grid gap-6" defaultValue={defaultTab} dir="rtl">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
              <div className="grid gap-5">
                <Badge className="w-fit" variant="secondary">
                  Aphrodite AI
                </Badge>
                <div className="grid gap-3">
                  <h1 className="editorial-title max-w-4xl text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
                    התאמה חכמה לתכשיט, מתנה וסגנון
                  </h1>
                  <p className="text-muted-foreground max-w-3xl leading-7">
                    כלי ה-AI מחוברים לקטלוג Aphrodite ומציגים פריטים זמינים מתוך
                    המלאי, עם התאמה לפי כוונה, תקציב וסגנון.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {aiHighlights.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        className="commerce-command grid grid-cols-[auto_1fr] items-center gap-3 rounded-md p-4"
                        key={item.label}
                      >
                        <div className="glass-card flex size-10 items-center justify-center rounded-md border">
                          <Icon className="size-4" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            {item.label}
                          </p>
                          <p className="text-sm font-semibold">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <TabsList
                    className="h-auto w-full justify-start gap-1 rounded-none border-0 bg-transparent p-0 sm:w-fit"
                    dir="rtl"
                    variant="line"
                  >
                    <TabsTrigger
                      className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground min-h-10 min-w-0 flex-1 cursor-pointer gap-2 rounded-none border-0 bg-transparent px-1.5 pt-1 pb-2 text-sm font-semibold shadow-none hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:flex-none"
                      value="stylist"
                    >
                      <MessageSquare className="size-4" />
                      סטייליסט
                    </TabsTrigger>
                    <TabsTrigger
                      className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground min-h-10 min-w-0 flex-1 cursor-pointer gap-2 rounded-none border-0 bg-transparent px-1.5 pt-1 pb-2 text-sm font-semibold shadow-none hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:flex-none"
                      value="gifts"
                    >
                      <Gift className="size-4" />
                      מתנות
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    asChild
                    className="w-full gap-2 sm:w-fit"
                    variant="outline"
                  >
                    <Link href="/search">
                      קטלוג מלא
                      <ArrowLeft className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="maison-frame product-tile-image media-color relative min-h-[260px] overflow-hidden rounded-md sm:min-h-[320px]">
                <Image
                  alt="תכשיט עדין על רקע סטודיו"
                  className="object-cover"
                  fill
                  priority
                  sizes="(min-width: 1024px) 420px, 100vw"
                  src={aiHeroImage}
                />
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute inset-x-4 bottom-4 grid gap-3 text-white">
                  <Badge className="w-fit border-white/30 bg-white/90 text-black hover:bg-white">
                    התאמות מהקטלוג
                  </Badge>
                  <div className="grid gap-2 rounded-md border border-white/25 bg-black/45 p-4 backdrop-blur">
                    <p className="text-lg font-semibold">תכשיט שנראה מדויק</p>
                    <p className="text-sm leading-6 text-white/85">
                      מתחילים בכוונה, ממשיכים לפריטים שאפשר לפתוח ולרכוש.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <TabsContent className="mt-0" value="stylist">
              <StylistChat compact />
            </TabsContent>

            <TabsContent className="mt-0" value="gifts">
              <TRPCReactProvider>
                <AiGiftRecommender />
              </TRPCReactProvider>
            </TabsContent>
          </Tabs>

          <section className="commerce-command mt-6 grid gap-3 rounded-md p-4 text-sm leading-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="glass-card flex size-10 items-center justify-center rounded-md border">
              <SlidersHorizontal className="size-4" />
            </div>
            <p className="text-muted-foreground max-w-4xl">
              תמיכה בהזמנה, שמירת פרופיל סגנון ומדידה וירטואלית נשארים זמינים
              דרך אזור הלקוח ועמודי המוצר. ההמלצות כאן מתמקדות בפריטים שאפשר
              לפתוח, לבדוק ולרכוש מתוך הקטלוג.
            </p>
          </section>
        </div>
      </RevealSection>
    </main>
  );
}
