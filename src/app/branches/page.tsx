import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, MapPin, MessageCircle, Store } from "lucide-react";

import { BranchCard } from "~/components/branch-card";
import { AppointmentBookingForm } from "./_components/appointment-booking-form";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { brandMedia } from "~/lib/brand-media";
import { getCatalogBranches } from "~/server/services/catalog";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "סניפים",
};

const branchHeroImage = brandMedia.branchesHero.url;

export default async function BranchesPage() {
  const branches = await getCatalogBranches();
  const serviceCount = new Set(branches.flatMap((branch) => branch.services))
    .size;
  const firstBranch = branches[0];

  return (
    <main>
      <SiteHeader />
      <RevealSection className="editorial-band signature-grid border-b border-[var(--glass-border)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.76fr)] lg:items-stretch lg:py-14">
          <div className="flex min-w-0 flex-col justify-center">
            <Badge className="mb-4 w-fit" variant="secondary">
              סניפים ושירות
            </Badge>
            <h1 className="editorial-title max-w-2xl text-3xl font-semibold text-balance sm:text-4xl">
              מדידה, איסוף ושירות קרוב לפני שיוצאים מהבית
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
              זמינות מוצרים, איסוף מהחנות, שינוי מידה, ייעוץ מתנות ופגישות כלה
              מרוכזים לפי סניף כדי לקצר את הדרך מהקטלוג למדידה.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Store,
                  label: "סניפים",
                  value: String(branches.length),
                },
                {
                  icon: CalendarCheck,
                  label: "תיאום",
                  value: "פגישה בסניף",
                },
                {
                  icon: MapPin,
                  label: "שירותים",
                  value: `${serviceCount}+ זמינים`,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="commerce-command flex min-w-0 items-center gap-3 rounded-md px-3 py-3"
                    key={item.label}
                  >
                    <span className="bg-background grid size-9 shrink-0 place-items-center rounded-md border border-[var(--glass-border)]">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="text-muted-foreground block text-xs">
                        {item.label}
                      </span>
                      <span className="block truncate text-sm font-medium">
                        {item.value}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="#appointment-booking">
                  תיאום פגישה
                  <CalendarCheck className="size-4" />
                </Link>
              </Button>
              {firstBranch ? (
                <Button asChild variant="outline">
                  <a
                    href={`https://wa.me/${firstBranch.whatsapp}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    WhatsApp
                    <MessageCircle className="size-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="maison-frame product-tile-image overflow-hidden">
            <div className="bg-muted relative aspect-[4/3] min-h-64 overflow-hidden">
              <Image
                alt=""
                className="media-color object-cover"
                fill
                priority
                sizes="(min-width: 1024px) 38vw, 100vw"
                src={branchHeroImage}
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.52),rgba(0,0,0,0.06)_58%)]" />
              {firstBranch ? (
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <p className="text-sm text-white/76">סניף ראשון לתיאום</p>
                  <p className="text-xl font-semibold">{firstBranch.name}</p>
                  <p className="mt-1 text-sm text-white/78">
                    {firstBranch.address}, {firstBranch.city}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-start">
          <div className="max-w-2xl">
            <p className="text-muted-foreground text-sm">רשימת סניפים</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              כתובות, שעות וערוצי קשר
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/search">בדיקת זמינות בקטלוג</Link>
          </Button>
        </div>
        <RevealGrid className="grid gap-5 lg:grid-cols-2">
          {branches.map((branch) => (
            <BranchCard branch={branch} key={branch.slug} />
          ))}
        </RevealGrid>

        <Card
          className="checkout-ledger mt-8 rounded-md"
          id="appointment-booking"
        >
          <CardHeader>
            <CardTitle>תיאום פגישה בסניף</CardTitle>
          </CardHeader>
          <CardContent>
            <TRPCReactProvider>
              <AppointmentBookingForm branches={branches} />
            </TRPCReactProvider>
          </CardContent>
        </Card>
      </RevealSection>
    </main>
  );
}
