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
    <main>
      <SiteHeader />
      <RevealSection className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6">
        <div>
          <Badge className="mb-4" variant="secondary">
            Aphrodite AI
          </Badge>
          <h1 className="text-4xl font-semibold">
            התאמה חכמה לתכשיט, מתנה וסגנון
          </h1>
          <p className="text-muted-foreground mt-3 max-w-3xl leading-7">
            כלי ה-AI מחוברים לקטלוג Aphrodite ומציגים מוצרים קיימים כלחיצים,
            עם מחיר וזמינות מתוך המלאי.
          </p>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full justify-start overflow-x-auto" dir="rtl">
            <TabsTrigger className="min-w-36 gap-2" value="stylist">
              <MessageSquare className="size-4" />
              סטייליסט
            </TabsTrigger>
            <TabsTrigger className="min-w-36 gap-2" value="gifts">
              <Gift className="size-4" />
              מתנות
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6" value="stylist">
            <StylistChat />
          </TabsContent>

          <TabsContent className="mt-6" value="gifts">
            <TRPCReactProvider>
              <AiGiftRecommender />
            </TRPCReactProvider>
          </TabsContent>
        </Tabs>

        <section className="glass-inset grid gap-3 rounded-md border p-4 text-sm leading-6">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="size-4" />
            כלים נוספים
          </div>
          <p className="text-muted-foreground">
            תמיכה בהזמנה, שמירת פרופיל סגנון ומדידה וירטואלית נשארים זמינים דרך
            אזור הלקוח ועמודי המוצר. כלים אלה אינם מחזירים רשימת מוצרים ולכן לא
            מציגים כרטיסי המלצה.
          </p>
        </section>
      </RevealSection>
    </main>
  );
}
