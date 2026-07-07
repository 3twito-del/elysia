import { Sparkles, WandSparkles } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DeferredStylistChat } from "./_components/deferred-stylist-chat";

export const metadata = {
  title: "סטיילינג אישי",
};

export default function StylistPage() {
  return (
    <main className="elysia-page">
      <SiteHeader />
      <CompactPageIntro
        description="ספרי לנו על האירוע, התקציב והסגנון, וקבלי המלצות לבחירת תכשיט."
        eyebrow="סטיילינג אישי"
        id="page-hero"
        title="ייעוץ לבחירת תכשיט"
        variant="content"
      />
      <RevealSection
        className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px] lg:py-8"
        id="stylist-chat"
      >
        <div className="min-w-0">
          <DeferredStylistChat />
        </div>

        <aside className="grid content-start gap-5" id="stylist-capabilities">
          <RevealGrid className="grid gap-5" variant="compact">
            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles aria-hidden="true" className="size-5" />
                  מה אפשר לבקש?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground grid gap-3 text-sm leading-7">
                <p>המלצות למתנה לפי נמענת, אירוע, מחיר וסגנון.</p>
                <p>חיפוש פריטים לפי קטגוריה, חומר וזמינות.</p>
                <p>הכוונה ראשונית לבחירת מידה לפני ההזמנה.</p>
              </CardContent>
            </Card>
            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WandSparkles className="size-5" />
                  מידה
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-7">
                אפשר לקבל עזרה בבחירת מידה מתמונה או מפרטי מידה קיימים.
              </CardContent>
            </Card>
          </RevealGrid>
        </aside>
      </RevealSection>
    </main>
  );
}
