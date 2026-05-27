import type { Metadata } from "next";
import Link from "next/link";
import {
  Headphones,
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
    "Elysia פועלת כרגע כחנות אונליין עם שירות אישי. מיקומי שירות יוצגו כאן כאשר סניפים פיזיים יהיו זמינים.",
};

export const dynamic = "force-dynamic";

const onlineServiceHighlights = [
  {
    title: "בחירה אונליין",
    text: "המבחר, המידות והחומרים זמינים לרכישה או לפנייה מכל עמוד מוצר.",
    icon: Search,
  },
  {
    title: "שירות אישי",
    text: "שאלות על מידה, מתנה או התאמה מטופלות דרך טופס השירות.",
    icon: Headphones,
  },
  {
    title: "משלוח ותיאום",
    text: "ההזמנה ממשיכה במסלול משלוח מקוון, ללא הגעה לסניף בשלב זה.",
    icon: PackageCheck,
  },
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
            ? "מיקומי שירות מאושרים של Elysia, כולל פרטי קשר, שעות ותיאום לפני הגעה."
            : "כרגע אין סניפים פיזיים. השירות והמכירה מתבצעים אונליין, ותשתית המיקומים תופעל כאן כאשר ייפתחו נקודות שירות."
        }
        eyebrow="שירות"
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
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <section>
              <Badge variant="secondary">אונליין בלבד</Badge>
              <h2 className="mt-4 text-3xl font-medium">
                אין סניפים פיזיים בשלב זה
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8">
                Elysia פועלת כרגע כחנות מקוונת. כאשר ייפתחו סניפים או נקודות
                שירות, הדף הזה יציג כתובות, שעות, טלפון ושירותים לכל מיקום.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild>
                  <Link href="/search">
                    למבחר
                    <Search aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/service">
                    לפנייה לשירות
                    <Headphones aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
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
