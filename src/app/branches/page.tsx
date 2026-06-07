import type { Metadata } from "next";
import Link from "next/link";
import {
  Headphones,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { getPublicServiceProfile } from "~/server/services/service";

export const metadata: Metadata = {
  title: "חנות אונליין ושירות",
  description:
    "Elysia פועלת כחנות אונליין. מיקומי שירות יופיעו כאן כשייפתחו.",
};

export const dynamic = "force-dynamic";

const onlineServiceHighlights = [
  {
    title: "קונים אונליין",
    text: "המבחר, המידות והחומרים מופיעים בכל עמוד מוצר.",
    icon: Search,
  },
  {
    title: "שירות",
    text: "שאלות על מידה, מתנה או התאמה עוברות דרך השירות.",
    icon: Headphones,
  },
  {
    title: "משלוח ותיאום",
    text: "ההזמנה ממשיכה למסלול משלוח מקוון.",
    icon: PackageCheck,
  },
] as const;

const onlineContinuitySteps = [
  "מוצאים תכשיט דרך הקטלוג, החיפוש או מדריך המידות.",
  "שאלות על התאמה, מתנה או הזמנה נשלחות לשירות.",
  "נקודות שירות פיזיות יופיעו כאן לפני פתיחתן.",
] as const;

export default async function BranchesPage() {
  const profile = await getPublicServiceProfile();
  const hasPhysicalBranches =
    profile.settings.physicalBranchesEnabled && profile.branches.length > 0;

  return (
    <main>
      <SiteHeader />
      <CommercePageHero
        description={
          hasPhysicalBranches
            ? "מיקומי שירות מאושרים של Elysia, כולל קשר, שעות ותיאום."
            : "אין סניפים פיזיים כרגע. קנייה ושירות מתבצעים אונליין."
        }
        eyebrow="אונליין"
        title={hasPhysicalBranches ? "שירות ומיקומים" : "חנות אונליין"}
        variant="content"
      />

      {hasPhysicalBranches ? (
        <RevealSection
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
          id="branches-list"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {profile.branches.map((branch) => (
              <article className="brand-surface rounded-md p-5" key={branch.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary">{branch.city}</Badge>
                    <h2 className="mt-3 text-2xl font-semibold">
                      {branch.name}
                    </h2>
                  </div>
                  <ShieldCheck aria-hidden="true" className="size-5" />
                </div>

                <div className="mt-5 grid gap-3 text-sm">
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin aria-hidden="true" className="size-4" />
                    {branch.address}
                  </p>
                  <a
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                    href={`tel:${branch.phone}`}
                  >
                    <Phone aria-hidden="true" className="size-4" />
                    {branch.phone}
                  </a>
                </div>

                <div className="mt-5 grid gap-2">
                  <h3 className="font-semibold">שירותים</h3>
                  <div className="flex flex-wrap gap-2">
                    {branch.services.map((service) => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-muted-foreground mt-5 text-sm leading-7">
                  {formatOpeningHours(branch.openingHours)}
                </p>
              </article>
            ))}
          </div>
        </RevealSection>
      ) : (
        <RevealSection
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
          data-testid="branches-online-only-state"
        >
          <section
            aria-label="סטטוס שירות"
            className="mb-6 flex flex-col gap-3 border-y border-[var(--glass-border)] py-4 sm:flex-row sm:items-center sm:justify-between"
            data-testid="branches-online-status-banner"
          >
            <div>
              <p className="text-sm font-medium">שירות אונליין בלבד</p>
              <p className="text-muted-foreground text-sm">אין קבלת קהל או איסוף מסניף כרגע; קנייה ושירות מתבצעים באתר.</p>
            </div>
            <Badge variant="secondary">מעודכן לעכשיו</Badge>
          </section>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <section>
              <Badge variant="secondary">אונליין בלבד</Badge>
              <h2 className="mt-4 text-3xl font-medium">
                אין סניפים פיזיים בשלב זה
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8">Elysia פועלת כחנות מקוונת. כשייפתחו סניפים או נקודות שירות, הם יופיעו כאן עם שעות וקשר.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild>
                  <Link href="/search">
                    לכל התכשיטים
                    <Search aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/service">
                    שאלה לשירות
                    <Headphones aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
              <div
                className="mt-6 grid gap-3 rounded-md border border-[var(--glass-border)] p-4 text-sm"
                data-testid="branches-online-service-continuity"
              >
                <h3 className="font-medium">מה אפשר לעשות אונליין</h3>
                <ul className="text-muted-foreground grid gap-2 leading-6">
                  {onlineContinuitySteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <div
                  className="flex flex-wrap gap-2"
                  data-testid="branches-online-recovery-links"
                >
                  <Button asChild size="sm" variant="outline">
                    <Link href="/size-guide">מדריך מידות</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/service?topic=general">שאלה לשירות</Link>
                  </Button>
                </div>
              </div>
            </section>

            <div className="grid gap-5">
              <section
                aria-labelledby="branches-contact-channels"
                className="grid gap-3 rounded-md border border-[var(--glass-border)] p-4"
                data-testid="branches-contact-channel-cards"
              >
                <div>
                  <h3 className="font-medium" id="branches-contact-channels">
                    ערוצי קשר זמינים
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">בחרו את הדרך הכי נוחה לשאלה, הזמנה או התאמה.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <a
                    className="border-border hover:border-foreground/50 hover:bg-muted/60 rounded-md border p-3 text-sm transition"
                    href={`tel:${profile.settings.phoneE164}`}
                  >
                    <Phone aria-hidden="true" className="mb-3 size-4" />
                    <span className="block font-medium">טלפון</span>
                    <span className="text-muted-foreground mt-1 block">
                      {profile.settings.displayPhone}
                    </span>
                  </a>
                  <a
                    className="border-border hover:border-foreground/50 hover:bg-muted/60 rounded-md border p-3 text-sm transition"
                    href={`mailto:${profile.settings.serviceEmail}`}
                  >
                    <Mail aria-hidden="true" className="mb-3 size-4" />
                    <span className="block font-medium">אימייל</span>
                    <span className="text-muted-foreground mt-1 block break-all">
                      {profile.settings.serviceEmail}
                    </span>
                  </a>
                  <Link
                    className="border-border hover:border-foreground/50 hover:bg-muted/60 rounded-md border p-3 text-sm transition"
                    href="/service?topic=general"
                  >
                    <Headphones aria-hidden="true" className="mb-3 size-4" />
                    <span className="block font-medium">שאלה לשירות</span>
                    <span className="text-muted-foreground mt-1 block">
                      טופס קצר באתר
                    </span>
                  </Link>
                </div>
              </section>

              <section
                aria-labelledby="branches-map-placeholder-title"
                className="rounded-md border border-dashed border-[var(--glass-border)] p-5"
                data-testid="branches-map-placeholder"
              >
                <MapPin aria-hidden="true" className="size-5" />
                <h3
                  className="mt-4 text-lg font-medium"
                  id="branches-map-placeholder-title"
                >
                  מפת סניפים תופיע כשייפתחו נקודות שירות
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-7">עד אז, חיפוש תכשיט, מדידה ושירות מתבצעים באתר.</p>
                <Button asChild className="mt-4" size="sm" variant="outline">
                  <Link href="/service?topic=general">שאלה לשירות</Link>
                </Button>
              </section>

              <div className="grid gap-4 sm:grid-cols-3">
                {onlineServiceHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <section
                      className="border-t border-[var(--glass-border)] pt-4"
                      key={item.title}
                    >
                      <Icon aria-hidden="true" className="size-5" />
                      <h3 className="mt-4 text-lg font-medium">{item.title}</h3>
                      <p className="text-muted-foreground mt-2 text-sm leading-7">
                        {item.text}
                      </p>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </RevealSection>
      )}
    </main>
  );
}

function formatOpeningHours(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "יש לתאם מראש לפני הגעה.";
  }

  const record = value as Record<string, unknown>;

  if (typeof record.note === "string") return record.note;

  return Object.values(record)
    .filter((item): item is string => typeof item === "string")
    .join(" | ");
}
