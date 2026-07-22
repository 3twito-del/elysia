import Link from "next/link";
import { Gem, LifeBuoy, RefreshCw, Ruler, Search } from "lucide-react";

import { Button } from "~/components/ui/button";

export const metadata = {
  title: "מצב לא מקוון",
};

const offlineRecoveryNotes = [
  "אם שליחה לא הושלמה, נסי שוב כשהחיבור יחזור.",
  "עגלת הקניות ופעולות החשבון יחזרו לפעולה מלאה אחרי רענון חיבור.",
  "עמודים שכבר נטענו עשויים להמשיך לעבוד מהמטמון של האפליקציה.",
] as const;

const offlineCapabilityGroups = [
  {
    title: "אפשר לנסות עכשיו",
    items: ["עמודים שכבר נפתחו", "מדריך מידות מקומי", "קריאת מדיניות ושירות"],
  },
  {
    title: "דורש חיבור",
    items: ["תשלום והזמנה", "כניסה לחשבון", "שליחת טופס או עדכון סל"],
  },
] as const;

export default function OfflinePage() {
  return (
    <main className="elysia-page bg-background text-foreground grid min-h-svh place-items-center px-4 py-12">
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
            ניתן לצפות בעמודים שכבר נטענו. הזמנה, חשבון ותשלום יחזרו כשהחיבור
            יתחדש.
          </p>
        </div>
        <ul
          className="text-muted-foreground grid gap-2 text-sm leading-6"
          data-testid="offline-retry-guidance"
        >
          {offlineRecoveryNotes.map((note) => (
            <li className="flex gap-2" key={note}>
              <RefreshCw aria-hidden="true" className="mt-1 size-3.5" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
        <div
          className="glass-inset rounded-md border p-4 text-sm leading-6"
          data-testid="offline-install-context"
        >
          <p className="font-medium">התקנה ושחזור מהיר</p>
          <p className="text-muted-foreground mt-1">
            באפליקציה מותקנת ניתן לפתוח עמודים ציבוריים שנטענו לאחרונה. הזמנה
            ותשלום דורשים חיבור.
          </p>
        </div>
        <div
          className="grid gap-3 sm:grid-cols-2"
          data-testid="offline-capability-split"
        >
          {offlineCapabilityGroups.map((group) => (
            <section
              className="rounded-md border border-[var(--glass-border)] p-4 text-sm"
              key={group.title}
            >
              <h2 className="font-medium">{group.title}</h2>
              <ul className="text-muted-foreground mt-2 grid gap-1.5 leading-6">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div
          className="flex flex-wrap gap-3"
          data-testid="offline-recovery-actions"
        >
          <Button asChild>
            <Link href="/search">
              <Search aria-hidden="true" className="size-4" />
              המבחר
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/size-guide">
              <Ruler aria-hidden="true" className="size-4" />
              מידות
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/service">
              <LifeBuoy aria-hidden="true" className="size-4" />
              שירות
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <RefreshCw aria-hidden="true" className="size-4" />
              ניסיון חוזר
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
