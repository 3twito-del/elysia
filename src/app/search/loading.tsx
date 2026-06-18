import { Search } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { SiteHeader } from "~/components/site-header";
import { Skeleton } from "~/components/ui/skeleton";
import { DEFAULT_SEARCH_PER_PAGE } from "~/server/adapters/search";

export default function SearchLoading() {
  return (
    <main>
      <SiteHeader />
      <CompactPageIntro
        description="טוענים תוצאות, ואז אפשר לפתוח חיפוש וסינון לפי צורך."
        eyebrow="חיפוש"
        title="חיפוש תכשיטים"
        variant="catalog"
      />
      <section
        aria-busy="true"
        aria-label="תוצאות החיפוש נטענות"
        className="mx-auto w-full max-w-[96rem] px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:px-[var(--ui-page-x-wide)] lg:py-[var(--ui-section-y)]"
        dir="rtl"
      >
        <div
          className="border-y border-[var(--glass-border)] py-4"
          data-testid="search-loading-controls-skeleton"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1.45fr)_repeat(3,minmax(9rem,1fr))_auto]">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="hidden h-11 w-full lg:block" />
            <Skeleton className="hidden h-11 w-full lg:block" />
            <Skeleton className="hidden h-11 w-full lg:block" />
            <Skeleton className="h-11 w-28" />
          </div>
        </div>
        <div className="mt-4 border-b border-[var(--glass-border)] pb-4 sm:mt-6">
          <div className="flex items-center gap-2">
            <Search aria-hidden="true" className="size-4" />
            <p className="text-base font-medium">טוענים תוצאות</p>
          </div>
          <Skeleton className="mt-2 h-4 w-56 max-w-full" />
        </div>
        <div
          className="ui-equal-grid mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
          data-testid="search-loading-card-skeletons"
        >
          {Array.from({ length: DEFAULT_SEARCH_PER_PAGE }).map((_, index) => (
            <article
              aria-label="כרטיס מוצר נטען"
              className="grid gap-3"
              data-testid="search-loading-card-skeleton"
              key={index}
            >
              <Skeleton className="aspect-[4/5] w-full rounded-md" />
              <div className="grid min-h-28 gap-2">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-auto grid gap-2 pt-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
