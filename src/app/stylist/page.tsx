import { AphroditeIcon } from "~/components/icon";

import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { StylistChat } from "./_components/stylist-chat";

export const metadata = {
  title: "סטייליסט AI",
};

export default function StylistPage() {
  return (
    <main>
      <SiteHeader />
      <RevealSection className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div>
          <Badge className="mb-4 shadow-none" variant="secondary">
            התאמה חכמה
          </Badge>
          <h1 className="text-4xl font-semibold">
            ייעוץ תכשיטים לפי סגנון, תקציב ואירוע
          </h1>
          <p className="text-muted-foreground mt-3 max-w-3xl leading-7">
            שכבת ה-AI מחוברת לקטלוג Aphrodite דרך tool פנימי, כך שההמלצות נשארות
            בתוך מוצרים קיימים ומוכנים להמשך עם חיפוש סמנטי ומדידה וירטואלית.
          </p>
          <div className="mt-8">
            <StylistChat />
          </div>
        </div>

        <aside className="grid content-start gap-5">
          <RevealGrid className="grid gap-5">
            <Card className="rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AphroditeIcon name="sparkle" className="size-5" />
                  מה ה-AI יודע לעשות
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground grid gap-3 text-sm leading-7">
                <p>התאמת מתנה לפי קשר, אירוע, תקציב וסגנון.</p>
                <p>סינון לפי מוצרים זמינים וחומרים מתוך הקטלוג.</p>
                <p>הכנה למדידה וירטואלית דרך TryOnProvider פנימי.</p>
              </CardContent>
            </Card>
            <Card className="rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AphroditeIcon name="magicWand" className="size-5" />
                  מדידה וירטואלית
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-7">
                ב-v1 נשמר interface למדידה. WebAR/Computer Vision עצמאי ייכנס
                דרך אותו חוזה בלי לשנות את מסכי המוצר או הלקוח.
              </CardContent>
            </Card>
          </RevealGrid>
        </aside>
      </RevealSection>
    </main>
  );
}
