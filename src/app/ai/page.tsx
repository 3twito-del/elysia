import Link from "next/link";
import { Gift, MessageSquare, Sparkles } from "lucide-react";

import { DeferredAiGiftPanel } from "./_components/deferred-ai-gift-panel";
import { DeferredStylistChat } from "~/app/stylist/_components/deferred-stylist-chat";
import { CompactPageIntro } from "~/components/compact-page-intro";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

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
      <CompactPageIntro
        actions={
          <>
            <Button asChild>
              <Link href="#ai-stylist">סטייליסט AI</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#ai-gifts">שאלון מתנה</Link>
            </Button>
          </>
        }
        description="כלי AI מחוברים לקטלוג Aphrodite ומציגים פריטים זמינים לפי כוונה, תקציב וסגנון."
        eyebrow="Aphrodite AI"
        id="page-hero"
        metrics={[
          { label: "כלים", value: "2" },
          { label: "קטלוג", value: "חי" },
          { label: "התאמה", value: "אישית" },
        ]}
        title="התאמה חכמה לתכשיט"
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
                  <h2 className="max-w-4xl text-xl font-semibold tracking-normal sm:text-2xl">
                    בחרו כלי
                  </h2>
                </div>
              </div>

              <TabsList
                className="h-auto w-fit justify-start gap-1 rounded-none border-0 bg-transparent p-0"
                dir="rtl"
                variant="line"
              >
                <TabsTrigger
                  className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground min-h-10 min-w-0 cursor-pointer gap-2 rounded-none border-0 bg-transparent px-1.5 pt-1 pb-2 text-sm font-semibold shadow-none hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  value="stylist"
                >
                  <MessageSquare aria-hidden="true" className="size-4" />
                  סטייליסט
                </TabsTrigger>
                <TabsTrigger
                  className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground min-h-10 min-w-0 cursor-pointer gap-2 rounded-none border-0 bg-transparent px-1.5 pt-1 pb-2 text-sm font-semibold shadow-none hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  value="gifts"
                >
                  <Gift aria-hidden="true" className="size-4" />
                  מתנות
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent className="mt-0" id="ai-stylist" value="stylist">
              <DeferredStylistChat compact />
            </TabsContent>

            <TabsContent className="mt-0" id="ai-gifts" value="gifts">
              <DeferredAiGiftPanel />
            </TabsContent>
          </Tabs>

          <section className="grid gap-3 text-sm leading-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="glass-inset flex size-10 items-center justify-center rounded-md border">
              <Sparkles aria-hidden="true" className="size-4" />
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
