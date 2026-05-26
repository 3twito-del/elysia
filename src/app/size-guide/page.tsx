import { SizeGuideTool } from "./_components/size-guide-tool";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
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
        description="מדידה פשוטה לפי תכשיט, טבלת עזר קצרה ושמירה אחת שמלווה אותך בעמודי הפריט."
        eyebrow="מידות והתאמה"
        title="מדריך מידות"
        variant="checkout"
      />
      <RevealSection
        className="mx-auto max-w-6xl px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:px-[var(--ui-page-x-wide)]"
        id="size-guide-tool"
        initialVisible
      >
        <SizeGuideTool initialKind={initialKind} />
      </RevealSection>
    </main>
  );
}
