import { Gift, MessageSquare, Sparkles } from "lucide-react";

import { AiGiftRecommender } from "./_components/ai-gift-recommender";
import { StylistChat } from "~/app/stylist/_components/stylist-chat";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
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

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <RevealSection className="liquid-section border-b border-[var(--glass-border)]">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:py-10">
          <Tabs className="gap-6" defaultValue={defaultTab}>
            <div className="glass-panel grid gap-5 rounded-md border p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid gap-4">
                <Badge className="w-fit" variant="secondary">
                  Aphrodite AI
                </Badge>
                <div className="grid gap-3">
                  <h1 className="max-w-4xl text-3xl font-semibold tracking-normal sm:text-4xl">
                    התאמה חכמה לתכשיט, מתנה וסגנון
                  </h1>
                  <p className="text-muted-foreground max-w-3xl leading-7">
                    כלי ה־AI מחוברים לקטלוג Aphrodite ומציגים פריטים זמינים
                    מתוך המלאי, עם התאמה לפי כוונה, תקציב וסגנון.
                  </p>
                </div>
              </div>

              <TabsList
                className="glass-control !grid h-auto w-full grid-cols-2 overflow-visible rounded-md p-1 sm:w-[360px]"
                dir="rtl"
              >
                <TabsTrigger
                  className="min-h-11 min-w-0 gap-2 px-3 data-active:bg-white/70"
                  value="stylist"
                >
                  <MessageSquare className="size-4" />
                  סטייליסט
                </TabsTrigger>
                <TabsTrigger
                  className="min-h-11 min-w-0 gap-2 px-3 data-active:bg-white/70"
                  value="gifts"
                >
                  <Gift className="size-4" />
                  מתנות
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent className="mt-0" value="stylist">
              <StylistChat />
            </TabsContent>

            <TabsContent className="mt-0" value="gifts">
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
