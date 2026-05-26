import type { Metadata } from "next";
import {
  Clock3,
  Mail,
  MessageSquareText,
  Phone,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { ServiceRequestForm } from "./_components/service-request-form";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { getPublicServiceProfile } from "~/server/services/service";

export const metadata: Metadata = {
  title: "שירות אישי",
  description:
    "שירות אישי וטלפוני של Elysia להזמנות, תיקונים, החזרות, מידות, פרטיות ונגישות.",
};

export const dynamic = "force-dynamic";

const serviceTracks = [
  {
    icon: MessageSquareText,
    title: "פנייה כללית",
    text: "שאלות על תכשיט, מתנה, מידה או הזמנה.",
  },
  {
    icon: Wrench,
    title: "תיקון ואחריות",
    text: "פנייה בנושא תיקון, אחריות או בדיקת מוצר.",
  },
  {
    icon: RotateCcw,
    title: "החלפות והחזרות",
    text: "פנייה בנושא החלפה או החזרה לפי מדיניות האתר.",
  },
  {
    icon: Ruler,
    title: "מידות",
    text: "עזרה בבחירת מידה, אורך או התאמה.",
  },
] as const;

type ServicePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ServicePage({ searchParams }: ServicePageProps) {
  const query = searchParams ? await searchParams : {};
  const profile = await getPublicServiceProfile();
  const phoneHref = `tel:${profile.settings.phoneE164}`;
  const defaultProductReference = firstParam(query.productReference);

  return (
    <main>
      <SiteHeader />

      <CommercePageHero
        description="שירות להזמנות, מידות, החזרות ופניות נוספות במקום אחד."
        eyebrow="שירות Elysia"
        title="שירות אישי"
        variant="content"
      />

      <RevealSection className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <section className="grid gap-5" aria-labelledby="service-contact">
            <div>
              <Badge variant="secondary">שירות אישי</Badge>
              <h2 className="mt-3 text-2xl font-semibold" id="service-contact">
                כל הפניות במקום אחד
              </h2>
              <p className="text-muted-foreground mt-2 max-w-prose leading-7">
                הפעילות מתבצעת מרחוק או בטלפון, עם תיעוד מסודר לכל פנייה והמשך
                טיפול לפי הנושא.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                className="brand-surface interactive-lift flex min-h-16 items-center gap-3 rounded-md p-3.5"
                href={phoneHref}
              >
                <span className="glass-inset grid size-11 place-items-center rounded-full border">
                  <Phone aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">טלפון</span>
                  <span className="text-muted-foreground block text-sm">
                    {profile.settings.displayPhone}
                  </span>
                </span>
              </a>
              <a
                className="brand-surface interactive-lift flex min-h-16 items-center gap-3 rounded-md p-3.5"
                href={`mailto:${profile.settings.serviceEmail}`}
              >
                <span className="glass-inset grid size-11 place-items-center rounded-full border">
                  <Mail aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">אימייל</span>
                  <span className="text-muted-foreground block text-sm">
                    {profile.settings.serviceEmail}
                  </span>
                </span>
              </a>
            </div>

            <div className="brand-surface rounded-md p-4">
              <div className="grid gap-3">
                {serviceTracks.map((track) => {
                  const Icon = track.icon;

                  return (
                    <div
                      className="grid gap-3 border-b border-[var(--glass-border)] pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)]"
                      key={track.title}
                    >
                      <span className="glass-inset grid size-10 place-items-center rounded-full border">
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <div>
                        <h3 className="font-semibold">{track.title}</h3>
                        <p className="text-muted-foreground mt-1 text-sm leading-6">
                          {track.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Separator className="my-5" />
              <div className="grid gap-3 sm:grid-cols-3">
                <TrustItem icon={Clock3} label="מענה מסודר" />
                <TrustItem icon={ShieldCheck} label="תיעוד מאובטח" />
                <TrustItem icon={Sparkles} label="שירות אישי" />
              </div>
            </div>
          </section>

          <section aria-labelledby="service-form" id="service-form">
            <div className="mb-4">
              <Badge variant="outline">פנייה לשירות</Badge>
              <h2 className="mt-3 text-2xl font-semibold">פנייה לשירות</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                בחרו נושא והשאירו פרטים. נחזור אליכם בהתאם לפנייה.
              </p>
            </div>
            <ServiceRequestForm
              defaultProductReference={defaultProductReference}
              topics={profile.topics.map((topic) => ({
                description: topic.description,
                label: topic.label,
                slug: topic.slug,
              }))}
            />
          </section>
        </div>
      </RevealSection>
    </main>
  );
}

function TrustItem({
  icon: Icon,
  label,
}: {
  icon: typeof Clock3;
  label: string;
}) {
  return (
    <div className="glass-inset flex min-h-14 items-center gap-2 rounded-md border px-3 text-sm">
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}
