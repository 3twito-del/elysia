import type { Metadata } from "next";
import { MapPin, Phone, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { getPublicServiceProfile } from "~/server/services/service";

export const metadata: Metadata = {
  title: "שירות",
  description:
    "שירות Elysia אונליין ובטלפון, עם תצוגת מיקומים פיזיים רק לאחר אישור הפעלה.",
};

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const profile = await getPublicServiceProfile();

  if (
    !profile.settings.physicalBranchesEnabled ||
    profile.branches.length === 0
  ) {
    redirect("/service");
  }

  return (
    <main>
      <SiteHeader />
      <CommercePageHero
        description="מיקומי שירות מאושרים של Elysia, כולל פרטי קשר, שעות ותיאום לפני הגעה."
        eyebrow="Elysia Locations"
        title="סניפים ושירות"
        variant="content"
      />

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
                  <h2 className="mt-3 text-2xl font-semibold">{branch.name}</h2>
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
