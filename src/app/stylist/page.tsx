import { Sparkles, WandSparkles } from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DeferredStylistChat } from "./_components/deferred-stylist-chat";

export const metadata = {
  title: "עזרה בבחירה",
};

export default function StylistPage() {
  return (
    <main>
      <SiteHeader />
      <CommercePageHero
        description="ייעוץ תכשיטים לפי סגנון, מחיר ואירוע, עם המלצות שנשארות בתוך המבחר הפעיל."
        eyebrow="ייעוץ אישי"
        id="page-hero"
        title="עזרה בבחירה"
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
                  אפשרויות ייעוץ
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground grid gap-3 text-sm leading-7">
                <p>התאמת מתנה לפי קשר, אירוע, מחיר וסגנון.</p>
                <p>סינון לפי קטגוריה, חומר וזמינות.</p>
                <p>סיוע ראשוני בבחירת מידה.</p>
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
                אפשר לפתוח בקשת מדידה מתמונת תכשיט או מפרטי מידה, ולקבל הכוונה
                לפני אישור הבחירה.
              </CardContent>
            </Card>
          </RevealGrid>
        </aside>
      </RevealSection>
    </main>
  );
}
