import { BranchCard } from "~/components/branch-card";
import { SiteHeader } from "~/components/site-header";
import { branches } from "~/lib/catalog";

export const metadata = {
  title: "סניפים",
};

export default function BranchesPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-semibold">סניפי Aphrodite</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
          זמינות מוצרים, איסוף מהחנות, שינוי מידה, ייעוץ מתנות ופגישות כלה
          בסניפים.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {branches.map((branch) => (
            <BranchCard branch={branch} key={branch.slug} />
          ))}
        </div>
      </section>
    </main>
  );
}
