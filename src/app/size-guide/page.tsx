import Link from "next/link";

import { SizeGuideTool } from "./_components/size-guide-tool";
import { getSafeSizeGuideReturnContext } from "./_lib/size-guide-return";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { sizeFitKinds, type SizeFitKind } from "~/lib/size-fit";

export const metadata = {
  title: "מדריך מידות",
};

const printRulerTicks = ["0", "1", "2", "3", "4", "5", "6"] as const;

const sizeMeasurementSteps = [
  "מדדו על משטח ישר ובלי למשוך את הסרט.",
  "השוו לטבלת המידה של טבעת, צמיד או שרשרת.",
  "אם אתם בין מידות, בחרו את הנוחה לשימוש יומי.",
] as const;

type SizeGuidePageProps = {
  searchParams?: Promise<{
    kind?: string | string[];
    product?: string | string[];
    returnTo?: string | string[];
  }>;
};

export default async function SizeGuidePage({
  searchParams,
}: SizeGuidePageProps) {
  const query = searchParams ? await searchParams : {};
  const requestedKind = Array.isArray(query.kind) ? query.kind[0] : query.kind;
  const requestedReturnTo = firstParam(query.returnTo);
  const requestedProduct = firstParam(query.product);
  const initialKind = sizeFitKinds.includes(requestedKind as SizeFitKind)
    ? (requestedKind as SizeFitKind)
    : "ring";
  const productName =
    requestedProduct && requestedProduct.length <= 120
      ? requestedProduct
      : undefined;
  const returnContext = getSafeSizeGuideReturnContext(
    requestedReturnTo,
    productName,
  );

  return (
    <main>
      <SiteHeader />
      <CommercePageHero
        description="מדידת טבעות, צמידים ושרשראות לפי טבלאות מידה."
        eyebrow="מידות והתאמה"
        title="מדריך מידות"
        variant="checkout"
      />
      <RevealSection
        className="mx-auto max-w-6xl px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:px-[var(--ui-page-x-wide)]"
        id="size-guide-tool"
        initialVisible
      >
        <section
          aria-labelledby="size-guide-measurement-title"
          className="mb-5 grid gap-4 border-y border-[var(--glass-border)] py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
          data-testid="size-guide-measurement-overview"
        >
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase">
              כיול ומדידה
            </p>
            <h2
              className="mt-2 text-lg font-medium text-balance"
              id="size-guide-measurement-title"
            >
              התחילו מסרגל בדיקה קצר
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">להדפסה, הגדירו קנה מידה 100% ובדקו מרווחים לפני השוואה.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.9fr)]">
            <ol className="text-muted-foreground grid gap-2 text-sm leading-6">
              {sizeMeasurementSteps.map((step) => (
                <li className="flex gap-2" key={step}>
                  <span aria-hidden="true">-</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div
              aria-label="סרגל הדפסה בסנטימטרים"
              className="rounded-md border border-[var(--glass-border)] p-3"
              data-testid="size-guide-print-ruler"
            >
              <div className="border-foreground/60 flex h-10 items-end justify-between border-b">
                {printRulerTicks.map((tick) => (
                  <span
                    className="border-foreground/60 relative flex h-6 min-w-0 items-start border-s ps-1 text-[0.7rem] tabular-nums"
                    key={tick}
                  >
                    {tick}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                סנטימטרים להצלבת קנה מידה לפני מדידה.
              </p>
            </div>
          </div>
        </section>
        {returnContext ? (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--glass-border)] px-4 py-3 text-sm"
            data-testid="size-guide-product-return-context"
          >
            <p className="text-muted-foreground leading-6">
              {returnContext.description}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={returnContext.href}>{returnContext.label}</Link>
            </Button>
          </div>
        ) : null}
        <SizeGuideTool initialKind={initialKind} />
      </RevealSection>
    </main>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
