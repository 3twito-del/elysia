import Link from "next/link";

import { BrandMediaPanel } from "~/components/brand-media-panel";
import { BranchCard } from "~/components/branch-card";
import { AppointmentBookingForm } from "./_components/appointment-booking-form";
import { CinematicPageHero } from "~/components/cinematic-page-hero";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { brandMedia, cinematicRouteMedia } from "~/lib/brand-media";
import { getCatalogBranches } from "~/server/services/catalog";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "סניפים",
};

export default async function BranchesPage() {
  const branches = await getCatalogBranches();

  return (
    <main>
      <SiteHeader />
      <CinematicPageHero
        actions={
          <>
            <Button asChild size="lg">
              <Link href="#branches-list">לסניפים</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#appointment">תיאום פגישה</Link>
            </Button>
          </>
        }
        description="זמינות מוצרים, איסוף מהחנות, שינוי מידה, ייעוץ מתנות ופגישות כלה בסניפים."
        eyebrow="Aphrodite Service"
        scrollCue={{ href: "#branches-list", label: "לסניפים" }}
        slides={cinematicRouteMedia.branches}
        stats={[
          { label: "סניפים", value: String(branches.length) },
          { label: "איסוף", value: "זמין" },
          { label: "ייעוץ", value: "בתיאום" },
        ]}
        title="סניפי Aphrodite"
        variant="service"
      />

      <RevealSection aria-hidden="true" className="hidden" variant="none">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <h1 className="text-4xl font-semibold">סניפי Aphrodite</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            זמינות מוצרים, איסוף מהחנות, שינוי מידה, ייעוץ מתנות ופגישות כלה
            בסניפים.
          </p>
          <BrandMediaPanel
            alt="Aqua jewelry boutique counter"
            className="mt-6 h-52 lg:h-64"
            priority
            slides={brandMedia.branches}
            variant="compact"
          />
        </div>
      </RevealSection>

      <RevealSection
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
        id="branches-list"
      >
        <RevealGrid className="grid gap-5 lg:grid-cols-2" variant="cards">
          {branches.map((branch) => (
            <BranchCard branch={branch} key={branch.slug} />
          ))}
        </RevealGrid>

        <Card className="mt-8 rounded-md" id="appointment">
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
