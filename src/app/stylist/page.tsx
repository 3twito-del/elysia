import Link from "next/link";
import { Sparkles, WandSparkles } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DeferredStylistChat } from "./_components/deferred-stylist-chat";

export const metadata = {
  title: "סטייליסט AI",
};

export default function StylistPage() {
  return (
    <main>
      <SiteHeader />
      <CompactPageIntro
        actions={
          <>
            <Button asChild>
              <Link href="#stylist-chat">להתחלת שיחה</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/search">חיפוש קטלוג</Link>
            </Button>
          </>
        }
        description="ייעוץ תכשיטים לפי סגנון, תקציב ואירוע, עם המלצות שנשארות בתוך קטלוג פעיל."
        eyebrow="Aphrodite Stylist"
        id="page-hero"
        metrics={[
          { label: "התאמה", value: "AI" },
          { label: "קטלוג", value: "זמין" },
          { label: "סגנון", value: "אישי" },
        ]}
        title="סטייליסט תכשיטים"
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
                  מה ה-AI יודע לעשות
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground grid gap-3 text-sm leading-7">
                <p>התאמת מתנה לפי קשר, אירוע, תקציב וסגנון.</p>
                <p>סינון לפי מוצרים זמינים וחומרים מתוך הקטלוג.</p>
                <p>הכנה למדידה וירטואלית דרך ספק מדידה פנימי.</p>
              </CardContent>
            </Card>
            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WandSparkles className="size-5" />
                  מדידה וירטואלית
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-7">
                בגרסה הראשונה נשמר חוזה למדידה. מנוע ראייה ממוחשבת עצמאי ייכנס
                דרך אותו חוזה בלי לשנות את מסכי המוצר או הלקוח.
              </CardContent>
            </Card>
          </RevealGrid>
        </aside>
      </RevealSection>
    </main>
  );
}
