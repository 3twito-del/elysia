import Link from "next/link";

import { SizeGuideTool } from "./_components/size-guide-tool";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { sizeFitKinds, type SizeFitKind } from "~/lib/size-fit";

export const metadata = {
  title: "מדריך מידות",
};

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
  const returnHref = getSafeSizeGuideReturnHref(requestedReturnTo);
  const productName =
    requestedProduct && requestedProduct.length <= 120
      ? requestedProduct
      : undefined;

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
        {returnHref ? (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--glass-border)] px-4 py-3 text-sm"
            data-testid="size-guide-product-return-context"
          >
            <p className="text-muted-foreground leading-6">
              {productName
                ? `הגעתם ממוצר: ${productName}. אפשר לשמור מידה ולחזור לעמוד המוצר.`
                : "הגעתם מעמוד מוצר. אפשר לשמור מידה ולחזור לעמוד המוצר."}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={returnHref}>חזרה למוצר</Link>
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

function getSafeSizeGuideReturnHref(value: string | undefined) {
  if (!value || value.length > 180) return undefined;
  if (!value.startsWith("/product/")) return undefined;
  if (value.startsWith("//") || value.includes("://")) return undefined;

  return value;
}
