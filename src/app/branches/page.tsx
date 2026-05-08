import { BranchCard } from "~/components/branch-card";
import { AppointmentBookingForm } from "./_components/appointment-booking-form";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
      <RevealSection className="liquid-section border-b border-[var(--glass-border)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <h1 className="text-4xl font-semibold">סניפי Aphrodite</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            זמינות מוצרים, איסוף מהחנות, שינוי מידה, ייעוץ מתנות ופגישות כלה
            בסניפים.
          </p>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <RevealGrid className="grid gap-5 lg:grid-cols-2" variant="cards">
          {branches.map((branch) => (
            <BranchCard branch={branch} key={branch.slug} />
          ))}
        </RevealGrid>

        <Card className="mt-8 rounded-md">
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
