import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Gem,
  MessageSquare,
  Ruler,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { brandMedia } from "~/lib/brand-media";
import { StylistChat } from "./_components/stylist-chat";

export const metadata = {
  title: "סטייליסט AI",
};

const stylistHeroImage = brandMedia.stylistHero.url;

const stylistHighlights = [
  { icon: Gem, label: "חומר", value: "כסף, פנינים ואבנים" },
  { icon: Ruler, label: "התאמה", value: "מידה, שימוש ותחושה" },
  { icon: Sparkles, label: "סגנון", value: "עדין, חגיגי או יומיומי" },
];

export default function StylistPage() {
  return (
    <main>
      <SiteHeader />

      <RevealSection className="editorial-band signature-grid border-b border-[var(--glass-border)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-12">
          <div className="grid gap-5">
            <Badge className="w-fit" variant="secondary">
              התאמה חכמה
            </Badge>
            <div className="grid gap-3">
              <h1 className="editorial-title max-w-4xl text-3xl font-semibold tracking-normal text-balance sm:text-4xl lg:text-5xl">
                ייעוץ תכשיטים לפי סגנון, תקציב ואירוע
              </h1>
              <p className="text-muted-foreground max-w-3xl leading-7">
                שכבת ה-AI מחוברת לקטלוג Aphrodite, כך שההמלצות נשארות בתוך
                מוצרים קיימים ומוכנים להמשך עם חיפוש סמנטי ומדידה וירטואלית.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stylistHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="glass-inset grid grid-cols-[auto_1fr] items-center gap-3 rounded-md border p-4"
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

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full gap-2 sm:w-fit">
                <Link href="#stylist-chat">
                  התחלת ייעוץ
                  <MessageSquare className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="w-full gap-2 sm:w-fit"
                variant="outline"
              >
                <Link href="/ai?tool=gifts">
                  שאלון מתנה
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="product-tile-image media-color relative min-h-[270px] overflow-hidden sm:min-h-[340px]">
            <Image
              alt="טבעת עם אבן כחולה על רקע סטודיו"
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 420px, 100vw"
              src={stylistHeroImage}
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-x-4 bottom-4 grid gap-3 text-white">
              <Badge className="w-fit border-white/30 bg-white/90 text-black hover:bg-white">
                התאמה מהקטלוג
              </Badge>
              <div className="rounded-md border border-white/25 bg-black/45 p-4 backdrop-blur">
                <p className="text-lg font-semibold">פריטים לפי כוונה</p>
                <p className="mt-1 text-sm leading-6 text-white/85">
                  שיחה קצרה שמחזירה מוצרים אמיתיים ולא רשימת השראה כללית.
                </p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-10"
        id="stylist-chat"
      >
        <div className="grid gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Aphrodite AI</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">
              שיחה שמחזירה מוצרים מהקטלוג
            </h2>
          </div>
          <StylistChat />
        </div>

        <aside className="grid content-start gap-5">
          <RevealGrid className="grid gap-5">
            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-5" />
                  מה ה-AI יודע לעשות
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground grid gap-3 text-sm leading-7">
                <p>התאמת מתנה לפי קשר, אירוע, תקציב וסגנון.</p>
                <p>סינון לפי מוצרים זמינים וחומרים מתוך הקטלוג.</p>
                <p>הכנה למדידה וירטואלית דרך TryOnProvider פנימי.</p>
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
