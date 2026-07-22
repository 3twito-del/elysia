import { LockKeyhole } from "lucide-react";

import { DeferredStylistChat } from "~/app/stylist/_components/deferred-stylist-chat";
import { CompactPageIntro } from "~/components/compact-page-intro";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";

export const metadata = {
  title: "elys-ai | התאמת תכשיטים אישית",
  description:
    "elys-ai עוזרת לבחור תכשיט לפי סגנון, אירוע, מחיר ומידה מתוך הקולקציה הזמינה של Elysia.",
};

export default function ElysAiPage() {
  return (
    <main className="elysia-page min-h-screen">
      <SiteHeader />
      <CompactPageIntro
        description="ספרי ל־elys-ai מה הסגנון, האירוע, המחיר או המידה שחשובים לך, וקבלי הצעות מתוך הפריטים הזמינים."
        eyebrow="העוזרת החכמה של Elysia"
        id="page-hero"
        title="elys-ai"
        variant="content"
      />
      <RevealSection
        className="mx-auto grid max-w-6xl gap-5 px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:grid-cols-[minmax(0,1fr)_17rem] lg:px-[var(--ui-page-x-wide)]"
        id="elys-ai-chat"
      >
        <section className="min-w-0" aria-label="שיחה עם elys-ai">
          <DeferredStylistChat compact />
        </section>
        <aside className="grid content-start gap-4">
          <section className="flex gap-3 border-y border-[var(--glass-border)] py-4 text-xs leading-6">
            <LockKeyhole aria-hidden="true" className="mt-1 size-4 shrink-0" />
            <p className="text-muted-foreground">
              אין צורך בחשבון. אל תשלחי בשיחה פרטי תשלום או מידע אישי רגיש.
            </p>
          </section>
        </aside>
      </RevealSection>
    </main>
  );
}
