import { SiteHeader } from "~/components/site-header";
import { Skeleton } from "~/components/ui/skeleton";

const GIFTS_LOADING_CARD_COUNT = 8;

export default function GiftsLoading() {
  return (
    <main className="elysia-page">
      <SiteHeader />
      <div
        aria-busy="true"
        aria-label="מתנות נטענות"
        className="mx-auto max-w-7xl px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:px-[var(--ui-page-x-wide)] lg:py-[var(--ui-section-y)]"
        dir="rtl"
      >
        <Skeleton className="h-8 w-40 max-w-full" />
        <Skeleton className="mt-3 h-4 w-64 max-w-full" />
        <div className="mt-6 flex items-center justify-between border-b border-[var(--glass-border)] pb-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div
          className="ui-equal-grid mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
          data-testid="gift-loading-card-skeletons"
        >
          {Array.from({ length: GIFTS_LOADING_CARD_COUNT }).map(
            (_, index) => (
              <article
                aria-label="כרטיס מתנה נטען"
                className="grid gap-3"
                data-testid="gift-loading-card-skeleton"
                key={index}
              >
                <Skeleton className="aspect-[5/4] w-full rounded-md sm:aspect-[4/5]" />
                <div className="grid min-h-28 gap-2">
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="mt-auto grid gap-2 pt-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      </div>
    </main>
  );
}
