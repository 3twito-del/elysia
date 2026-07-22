import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock3,
  Mail,
  MessageCircle,
  MessageSquareText,
  PackageCheck,
  Phone,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { ServiceRequestForm } from "./_components/service-request-form";
import { CompactPageIntro } from "~/components/compact-page-intro";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  getPublicContactSettings,
  getPublicServiceProfile,
} from "~/server/services/service";

export const metadata: Metadata = {
  title: "שירות לקוחות",
  description:
    "שירות הלקוחות של Elysia להזמנות, מידות, התאמות, החזרות, פרטיות ונגישות, עם מענה עד יום עסקים.",
};

export const dynamic = "force-dynamic";

const serviceTracks = [
  {
    icon: MessageSquareText,
    title: "שאלה על מוצר",
    text: "שאלות על התאמה, חומר או מידה.",
  },
  {
    icon: Wrench,
    title: "תיקון ואחריות",
    text: "תיקונים, אחריות והוראות טיפול.",
  },
  {
    icon: RotateCcw,
    title: "החלפות והחזרות",
    text: "בקשות החלפה או החזרה.",
  },
  {
    icon: Ruler,
    title: "מידה והתאמה",
    text: "עזרה בבחירת אורך ומידה מתאימים.",
  },
] as const;

const serviceResponseExpectations = [
  {
    title: "מענה עד יום עסקים",
    text: "עד 24 שעות, בימי עסקים.",
  },
  {
    title: "פרטים שכדאי לצרף",
    text: "מספר הזמנה, שם המוצר ותמונה, אם רלוונטי.",
  },
] as const;

const servicePriorityActions = [
  {
    href: "/service?topic=sizing#service-form",
    icon: Ruler,
    label: "לפני קנייה",
    text: "שאלות על מידה, חומר והתאמה.",
  },
  {
    href: "/service?topic=order#service-form",
    icon: PackageCheck,
    label: "הזמנה קיימת",
    text: "בירור סטטוס, עדכון פרטים ומשלוח.",
  },
  {
    href: "/service?topic=returns#service-form",
    icon: RotateCcw,
    label: "החלפה או החזרה",
    text: "מדיניות החזרות, זיכוי או החלפה.",
  },
  {
    href: "/service?topic=repair#service-form",
    icon: Wrench,
    label: "תיקון ואחריות",
    text: "תיקון ואחריות לאחר קנייה.",
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
  const [profile, contact] = await Promise.all([
    getPublicServiceProfile(),
    getPublicContactSettings(),
  ]);
  const defaultMessage = firstParam(query.message);
  const defaultOrderNumber = firstParam(query.orderNumber);
  const defaultProductReference = firstParam(query.productReference);
  const defaultTopicSlug = firstParam(query.topic);

  return (
    <main className="elysia-page">
      <SiteHeader />

      <CompactPageIntro
        description="מענה לכל שאלה על הזמנות, מידות, התאמות, החלפות ואחריות."
        eyebrow="שירות"
        title="שירות לקוחות"
        variant="content"
      />

      <RevealSection className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
        <ServicePriorityTriage />

        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <section className="grid gap-5" aria-labelledby="service-contact">
            <div>
              <Badge variant="secondary">שירות</Badge>
              <h2 className="mt-3 text-2xl font-semibold" id="service-contact">
                דרכי יצירת קשר
              </h2>
              <p className="text-muted-foreground mt-2 max-w-prose leading-7">
                כל פנייה מתועדת ומקבלת מענה בתוך יום עסקים.
              </p>
            </div>

            <div className="grid gap-2">
              <a
                className="brand-surface interactive-lift flex items-center gap-3 rounded-md px-4 py-3"
                href={contact.phoneHref}
              >
                <span className="glass-inset grid size-10 shrink-0 place-items-center rounded-full border">
                  <Phone aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">טלפון</span>
                  <span className="text-muted-foreground block text-sm">
                    {contact.phoneDisplay}
                  </span>
                </span>
              </a>
              <a
                className="brand-surface interactive-lift flex items-center gap-3 rounded-md px-4 py-3"
                href={`mailto:${contact.email}`}
              >
                <span className="glass-inset grid size-10 shrink-0 place-items-center rounded-full border">
                  <Mail aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">אימייל</span>
                  <span className="text-muted-foreground block text-sm break-all">
                    {contact.email}
                  </span>
                </span>
              </a>
              {contact.whatsappHref ? (
                <a
                  className="brand-surface interactive-lift flex items-center gap-3 rounded-md px-4 py-3"
                  data-testid="service-whatsapp-link"
                  href={contact.whatsappHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="glass-inset grid size-10 shrink-0 place-items-center rounded-full border">
                    <MessageCircle aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      WhatsApp Elysia
                    </span>
                    <span className="text-muted-foreground block text-sm">
                      מענה מהיר בוואטסאפ
                    </span>
                  </span>
                </a>
              ) : null}
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
              <ul
                className="grid gap-2 text-sm leading-6"
                data-testid="service-response-expectations"
              >
                {serviceResponseExpectations.map((item) => (
                  <li className="grid gap-0.5" key={item.title}>
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-5" />
              <div className="grid gap-3 sm:grid-cols-3">
                <TrustItem icon={Clock3} label="מענה אישי" />
                <TrustItem icon={ShieldCheck} label="תיעוד מאובטח" />
                <TrustItem icon={Sparkles} label="לפני ואחרי הזמנה" />
              </div>
            </div>
          </section>

          <section aria-labelledby="service-form" id="service-form">
            <div className="mb-4">
              <Badge variant="outline">פנייה לשירות</Badge>
              <h2 className="mt-3 text-2xl font-semibold">טופס פנייה</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                בחרי נושא, מלאי את הפרטים ונחזור אלייך.
              </p>
            </div>
            <section
              aria-labelledby="service-topic-cards-title"
              className="mb-4 grid gap-3 rounded-md border border-[var(--glass-border)] p-4"
              data-testid="service-topic-cards"
            >
              <div>
                <h3 className="font-medium" id="service-topic-cards-title">
                  בחירת נושא
                </h3>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  לחיצה על נושא תמלא אותו בטופס.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {profile.topics.slice(0, 6).map((topic) => (
                  <Link
                    className="border-border rounded-md border p-3 text-sm transition hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-hover-overlay)]"
                    href={`/service?topic=${topic.slug}#service-form`}
                    key={topic.slug}
                  >
                    <span className="font-medium">{topic.label}</span>
                    {topic.description ? (
                      <span className="text-muted-foreground mt-1 block leading-6">
                        {topic.description}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
            <div
              className="text-muted-foreground mb-4 flex gap-2 rounded-md border border-[var(--glass-border)] px-4 py-3 text-sm leading-6"
              data-testid="service-response-time-note"
            >
              <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                פניות מטופלות לפי סדר קבלתן. זמן מענה רגיל: עד 24 שעות ביום
                עסקים. מספר הזמנה או שם המוצר יעזרו לנו לתת תשובה מדויקת יותר.
              </p>
            </div>
            <ServiceRequestForm
              defaultMessage={defaultMessage}
              defaultOrderNumber={defaultOrderNumber}
              defaultProductReference={defaultProductReference}
              defaultTopicSlug={defaultTopicSlug}
              serviceEmail={contact.email}
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

function ServicePriorityTriage() {
  return (
    <section
      aria-labelledby="service-priority-triage-title"
      className="mb-6 grid gap-3 border-y border-[var(--glass-border)] py-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:items-center"
      data-testid="service-priority-triage"
    >
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase">
          מסלול מהיר
        </p>
        <h2
          className="mt-2 text-xl font-semibold"
          id="service-priority-triage-title"
        >
          בחרי את סוג הפנייה
        </h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {servicePriorityActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              className="border-border grid min-h-28 rounded-md border p-3 text-sm transition hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-hover-overlay)]"
              href={action.href}
              key={action.href}
            >
              <Icon aria-hidden="true" className="size-4" />
              <span className="mt-3 font-medium">{action.label}</span>
              <span className="text-muted-foreground mt-1 leading-5">
                {action.text}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
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
