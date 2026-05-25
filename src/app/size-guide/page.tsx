import {
  BadgeCheck,
  ClipboardCheck,
  Gem,
  Ruler,
  ShieldCheck,
} from "lucide-react";

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

const confidenceSignals = [
  {
    description: "כיול לפי כרטיס אשראי או סרגל קיים לקבלת יחס מדויק במסך.",
    icon: Ruler,
    title: "כיול לפני מדידה",
  },
  {
    description: "בדיקת טווחים בזמן אמת לטבעות, צמידים, שרשראות ועגילים.",
    icon: BadgeCheck,
    title: "תקינות מיידית",
  },
  {
    description: "המידה נשמרת בדפדפן ומסתנכרנת לחשבון לקוחות מחובר.",
    icon: ShieldCheck,
    title: "שמירה רציפה",
  },
];

const preparationItems = [
  "כרטיס בגודל סטנדרטי או סרגל",
  "טבעת קיימת, חוט מדידה או שרשרת קיימת",
  "מסך עם בהירות נוחה ובלי זום חריג",
];

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
        description="מדידה אינטראקטיבית, בחירת מידה ידנית ושמירה חכמה כדי שכל עמוד מוצר יתחיל מההתאמה הנכונה."
        eyebrow="מידות והתאמה"
        metrics={[
          { label: "קטגוריות", value: "4" },
          { label: "שמירה", value: "מקומית + חשבון" },
          { label: "בדיקה", value: "בזמן אמת" },
        ]}
        metricsMode="inline"
        title="מדריך מידות"
        variant="checkout"
      />
      <RevealSection
        className="mx-auto grid max-w-7xl gap-5 px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-[var(--ui-page-x-wide)]"
        id="size-guide-tool"
        initialVisible
      >
        <SizeGuideTool initialKind={initialKind} />
        <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
          <section className="brand-surface rounded-md p-5">
            <div className="flex items-center gap-3">
              <div className="glass-inset grid size-11 place-items-center rounded-md border">
                <Gem aria-hidden="true" className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">מידה שנשארת איתך</h2>
                <p className="text-muted-foreground text-sm">
                  התאמה אחת לכל הקטלוג.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {confidenceSignals.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="glass-inset rounded-md border p-3"
                    key={item.title}
                  >
                    <div className="flex items-start gap-3">
                      <Icon aria-hidden="true" className="mt-0.5 size-4" />
                      <div className="grid gap-1">
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="text-muted-foreground text-sm leading-6">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="brand-surface rounded-md p-5">
            <div className="flex items-center gap-3">
              <div className="glass-inset grid size-11 place-items-center rounded-md border">
                <ClipboardCheck aria-hidden="true" className="size-5" />
              </div>
              <h2 className="text-base font-semibold">לפני שמתחילים</h2>
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6">
              {preparationItems.map((item) => (
                <li className="flex items-start gap-2" key={item}>
                  <span
                    aria-hidden="true"
                    className="bg-foreground mt-2 size-1.5 rounded-full"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </RevealSection>
    </main>
  );
}
