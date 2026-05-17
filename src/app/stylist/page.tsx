import Link from "next/link";
import { Sparkles, WandSparkles } from "lucide-react";

import { CinematicPageHero } from "~/components/cinematic-page-hero";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cinematicRouteMedia } from "~/lib/brand-media";
import { DeferredStylistChat } from "./_components/deferred-stylist-chat";

export const metadata = {
  title: "סטייליסט AI",
};

export default function StylistPage() {
  return (
    <main>
      <SiteHeader />
      <CinematicPageHero
        actions={
          <>
            <Button asChild size="lg">
              <Link href="#stylist-chat">להתחלת שיחה</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/search">חיפוש קטלוג</Link>
            </Button>
          </>
        }
        description="ייעוץ תכשיטים לפי סגנון, תקציב ואירוע, עם המלצות שנשארות בתוך קטלוג פעיל."
        eyebrow="Aphrodite Stylist"
        scrollCue={{ href: "#stylist-chat", label: "לשיחה" }}
        slides={cinematicRouteMedia.stylist}
        stats={[
          { label: "התאמה", value: "AI" },
          { label: "קטלוג", value: "זמין" },
          { label: "סגנון", value: "אישי" },
        ]}
        title="סטייליסט תכשיטים"
        variant="commerce"
      />
      <RevealSection
        className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]"
        id="stylist-chat"
      >
        <div>
          <Badge className="mb-4" variant="secondary">
            התאמה חכמה
          </Badge>
          <h2 className="text-4xl font-semibold">
            ייעוץ תכשיטים לפי סגנון, תקציב ואירוע
          </h2>
          <p className="text-muted-foreground mt-3 max-w-3xl leading-7">
            שכבת ה-AI מחוברת לקטלוג Aphrodite דרך כלי פנימי, כך שההמלצות נשארות
            בתוך מוצרים קיימים ומוכנים להמשך עם חיפוש סמנטי ומדידה וירטואלית.
          </p>
          <div className="mt-8">
            <DeferredStylistChat />
          </div>
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
