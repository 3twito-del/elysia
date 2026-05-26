import Link from "next/link";
import { Gem, RefreshCw, Search } from "lucide-react";

import { Button } from "~/components/ui/button";

export const metadata = {
  title: "מצב לא מקוון",
};

export default function OfflinePage() {
  return (
    <main className="bg-background text-foreground grid min-h-svh place-items-center px-4 py-12">
      <section
        className="grid w-full max-w-2xl gap-6 text-right"
        dir="rtl"
        aria-labelledby="offline-title"
      >
        <div className="glass-inset grid size-14 place-items-center rounded-md border">
          <Gem aria-hidden="true" className="size-7" />
        </div>
        <div className="grid gap-3">
          <p className="text-muted-foreground text-sm font-medium">
            Elysia PWA
          </p>
          <h1
            className="text-3xl font-semibold tracking-normal sm:text-4xl"
            id="offline-title"
          >
            אין חיבור פעיל כרגע
          </h1>
          <p className="text-muted-foreground max-w-xl leading-7">
            אפשר להמשיך לצפות בעמודים ובתכשיטים שכבר נטענו. הבחירה האישית, סיום
            ההזמנה, החשבון והתשלום יחזרו לפעולה מלאה כשהחיבור יתחדש.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">
              <RefreshCw aria-hidden="true" className="size-4" />
              ניסיון חוזר
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">
              <Search aria-hidden="true" className="size-4" />
              המבחר
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
