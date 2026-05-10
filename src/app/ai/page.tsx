import Link from "next/link";
import { Gift, MessageSquare, Sparkles } from "lucide-react";

import { AiGiftRecommender } from "./_components/ai-gift-recommender";
import { StylistChat } from "~/app/stylist/_components/stylist-chat";
import { BrandMediaPanel } from "~/components/brand-media-panel";
import { CinematicPageHero } from "~/components/cinematic-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { brandMedia, cinematicRouteMedia } from "~/lib/brand-media";
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

export default async function AiPage({ searchParams }: AiPageProps) {
  const search = searchParams ? await searchParams : {};
  const defaultTab =
    search.tab === "gifts" || search.tool === "gifts" ? "gifts" : "stylist";
  const aiAnchors = [
    { id: "page-hero", label: "פתיחה" },
    { id: "ai-tools", label: "כלים" },
    { id: "ai-stylist", label: "סטייליסט" },
    { id: "ai-gifts", label: "מתנות" },
  ];

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <CinematicPageHero
        actions={
          <>
            <Button asChild size="lg">
              <Link href="#ai-stylist">סטייליסט AI</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#ai-gifts">שאלון מתנה</Link>
            </Button>
          </>
        }
        anchors={aiAnchors}
        description="כלי AI מחוברים לקטלוג Aphrodite ומציגים פריטים זמינים לפי כוונה, תקציב וסגנון."
        eyebrow="Aphrodite AI"
        slides={cinematicRouteMedia.ai}
        stats={[
          { label: "כלים", value: "2" },
          { label: "קטלוג", value: "חי" },
          { label: "התאמה", value: "אישית" },
        ]}
        title="התאמה חכמה לתכשיט"
        variant="commerce"
      />
      <RevealSection
        className="liquid-section border-b border-[var(--glass-border)]"
        id="ai-tools"
      >
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:py-8">
          <Tabs className="gap-4" defaultValue={defaultTab} dir="rtl">
            <div className="glass-panel grid gap-5 rounded-md border p-4 sm:p-5">
              <div className="grid gap-4">
                <Badge className="w-fit" variant="secondary">
                  Aphrodite AI
                </Badge>
                <div className="grid gap-3">
                  <h1 className="max-w-4xl text-2xl font-semibold tracking-normal sm:text-3xl">
                    התאמה חכמה לתכשיט, מתנה וסגנון
                  </h1>
                  <p className="text-muted-foreground max-w-3xl leading-7">
                    כלי ה־AI מחוברים לקטלוג Aphrodite ומציגים פריטים זמינים מתוך
                    המלאי, עם התאמה לפי כוונה, תקציב וסגנון.
                  </p>
                </div>
              </div>

              <BrandMediaPanel
                alt="Aqua AI stylist jewelry scene"
                className="h-44 sm:h-52"
                priority
                slides={brandMedia.ai}
                variant="compact"
              />

              <TabsList
                className="h-auto w-fit justify-start gap-1 rounded-none border-0 bg-transparent p-0"
                dir="rtl"
                variant="line"
              >
                <TabsTrigger
                  className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground min-h-10 min-w-0 cursor-pointer gap-2 rounded-none border-0 bg-transparent px-1.5 pt-1 pb-2 text-sm font-semibold shadow-none hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  value="stylist"
                >
                  <MessageSquare className="size-4" />
                  סטייליסט
                </TabsTrigger>
                <TabsTrigger
                  className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground min-h-10 min-w-0 cursor-pointer gap-2 rounded-none border-0 bg-transparent px-1.5 pt-1 pb-2 text-sm font-semibold shadow-none hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  value="gifts"
                >
                  <Gift className="size-4" />
                  מתנות
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent className="mt-0" id="ai-stylist" value="stylist">
              <StylistChat compact />
            </TabsContent>

            <TabsContent className="mt-0" id="ai-gifts" value="gifts">
              <TRPCReactProvider>
                <AiGiftRecommender />
              </TRPCReactProvider>
            </TabsContent>
          </Tabs>

          <section className="grid gap-3 text-sm leading-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="glass-inset flex size-10 items-center justify-center rounded-md border">
              <Sparkles className="size-4" />
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
