import { BranchCard } from "~/components/branch-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { branches } from "~/lib/catalog";

export const metadata = {
  title: "סניפים",
};

export default function BranchesPage() {
  return (
    <main>
      <SiteHeader />
      <RevealSection className="border-b border-black/10 bg-black/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <h1 className="text-4xl font-semibold">סניפי Aphrodite</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            זמינות מוצרים, איסוף מהחנות, שינוי מידה, ייעוץ מתנות ופגישות כלה
            בסניפים.
          </p>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <RevealGrid className="grid gap-5 lg:grid-cols-2">
          {branches.map((branch) => (
            <BranchCard branch={branch} key={branch.slug} />
          ))}
        </RevealGrid>
      </RevealSection>
    </main>
  );
}
