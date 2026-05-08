import type { Metadata } from "next";
import Link from "next/link";
import { MailX } from "lucide-react";

import { UnsubscribeForm } from "./_components/unsubscribe-form";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

export const metadata: Metadata = {
  title: "הסרה מדיוור",
  description: "הסרת כתובת אימייל מדיוור שיווקי של Aphrodite.",
};

export default function NewsletterUnsubscribePage() {
  return (
    <main>
      <SiteHeader />

      <RevealSection className="editorial-band signature-grid min-h-[72vh] border-b border-[var(--glass-border)]">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-center lg:py-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="editorial-eyebrow">Aphrodite</p>
              <h1 className="editorial-title mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
                הסרה מדיוור
              </h1>
              <p className="text-muted-foreground mt-4 leading-8">
                ניתן להסיר כתובת אימייל מדיוור שיווקי בכל עת. ההסרה אינה מונעת
                שליחת הודעות תפעוליות הנדרשות להזמנות, שירות לקוחות או אבטחה.
              </p>
            </div>
            <div className="atelier-panel hidden p-4 sm:block">
              <MailX className="size-8" aria-hidden="true" />
            </div>
          </div>

          <div className="atelier-panel p-6 sm:p-8">
            <UnsubscribeForm />
            <Separator className="my-8" />
            <Button asChild variant="outline">
              <Link href="/privacy">למדיניות הפרטיות</Link>
            </Button>
          </div>
        </div>
      </RevealSection>
    </main>
  );
}
