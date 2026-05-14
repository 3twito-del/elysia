import { SlidersHorizontal } from "lucide-react";

import { SiteHeader } from "~/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <main data-testid="category-loading-state">
      <SiteHeader />

      <section
        aria-busy="true"
        aria-label="טוען קטגוריה"
        className="relative isolate min-h-[max(34rem,calc(100svh-4rem))] overflow-hidden bg-[var(--brand-aqua-deep)] px-4 py-24 text-white sm:px-6 lg:px-20"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
          <div className="max-w-2xl space-y-5">
            <Skeleton className="h-6 w-36 bg-white/15" />
            <Skeleton className="h-16 w-full max-w-xl bg-white/15" />
            <Skeleton className="h-6 w-4/5 bg-white/15" />
            <div className="flex flex-col gap-3 pt-6 sm:flex-row">
              <Skeleton className="h-12 w-full bg-white/15 sm:w-36" />
              <Skeleton className="h-12 w-full bg-white/15 sm:w-40" />
            </div>
          </div>
          <div className="hidden gap-3 lg:grid">
            <Skeleton className="h-24 w-full bg-white/10" />
            <Skeleton className="h-24 w-full bg-white/10" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[296px_1fr] lg:py-10">
        <aside className="hidden lg:block">
          <Card className="sticky top-24 rounded-md" size="sm">
            <CardHeader className="border-b border-[var(--glass-border)] pb-4">
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                פילטרים
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {Array.from({ length: 5 }, (_, index) => (
                <div className="grid gap-2" key={index}>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0">
          <div className="mb-7 border-y border-[var(--glass-border)] py-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Card
                className="h-full min-w-0 overflow-hidden rounded-md py-0"
                key={index}
              >
                <Skeleton className="aspect-[4/5] w-full rounded-none" />
                <CardContent className="flex min-h-52 flex-col gap-4 p-4">
                  <div className="grid min-h-[6.5rem] gap-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                  <div className="mt-auto grid gap-3">
                    <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_5.5rem] items-end gap-3">
                      <div className="grid gap-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-7 w-24" />
                      </div>
                      <Skeleton className="h-9 w-full" />
                    </div>
                    <Skeleton className="h-11 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
