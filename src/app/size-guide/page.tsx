import { Ruler } from "lucide-react";

import { SizeGuideTool } from "./_components/size-guide-tool";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Card, CardContent } from "~/components/ui/card";
import { sizeFitKinds, type SizeFitKind } from "~/lib/size-fit";

export const metadata = {
  title: "מדריך מידות",
};

type SizeGuidePageProps = {
  searchParams?: Promise<{ kind?: string | string[] }>;
};

export default async function SizeGuidePage({
  searchParams,
}: SizeGuidePageProps) {
  const query = searchParams ? await searchParams : {};
  const requestedKind = Array.isArray(query.kind) ? query.kind[0] : query.kind;
  const initialKind = sizeFitKinds.includes(requestedKind as SizeFitKind)
    ? (requestedKind as SizeFitKind)
    : "ring";

  return (
    <main>
      <SiteHeader />
      <CommercePageHero
        description="שמירת מידות מקומית לטבעות, צמידים, שרשראות ועגילים, עם סנכרון לחשבון לקוח כשמחוברים."
        eyebrow="מידות והתאמה"
        title="מדריך מידות"
        variant="checkout"
      />
      <RevealSection
        className="mx-auto grid max-w-7xl gap-5 px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-[var(--ui-page-x-wide)]"
        id="size-guide-tool"
        initialVisible
      >
        <SizeGuideTool initialKind={initialKind} />
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="rounded-md" size="sm">
            <CardContent className="grid gap-4">
              <div className="glass-inset grid size-12 place-items-center rounded-md border">
                <Ruler aria-hidden="true" className="size-5" />
              </div>
              <div className="grid gap-2">
                <h2 className="text-lg font-semibold">מידה שנשארת איתך</h2>
                <p className="text-muted-foreground text-sm leading-6">
                  הבחירה נשמרת בדפדפן ומשפיעה על עמודי מוצר מתאימים. לקוחות
                  מחוברים מסנכרנים את אותה מידה גם לאזור הלקוח.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </RevealSection>
    </main>
  );
}
