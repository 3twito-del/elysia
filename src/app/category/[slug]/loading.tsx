import { SiteHeader } from "~/components/site-header";

const previewRows = 3;

export default function CategoryLoading() {
  return (
    <main data-testid="category-loading-state">
      <SiteHeader />

      <section
        aria-busy="true"
        aria-label="טוען קטגוריה"
        className="bg-background relative overflow-hidden border-b border-[var(--glass-border)]"
      >
        <span className="sr-only">טוען קטגוריה</span>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px overflow-hidden bg-[var(--glass-border)]"
        >
          <div className="category-loading-progress h-full w-1/3 bg-[var(--brand-aqua)]" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:py-10">
          <div className="max-w-2xl">
            <div className="bg-foreground/10 h-3 w-28 rounded-full" />
            <div className="bg-foreground/[0.08] mt-5 h-10 w-[min(100%,28rem)] rounded-md" />
            <div className="bg-foreground/[0.07] mt-3 h-4 w-[min(80%,34rem)] rounded-full" />
            <div className="mt-7 flex gap-2">
              <div className="h-9 w-28 rounded-md bg-[var(--brand-aqua)]/35" />
              <div className="bg-background/60 h-9 w-24 rounded-md border border-[var(--glass-border)]" />
            </div>
          </div>

          <div className="hidden gap-2 lg:grid">
            <div className="bg-foreground/[0.04] h-8 rounded-md border border-[var(--glass-border)]" />
            <div className="bg-foreground/[0.04] h-8 rounded-md border border-[var(--glass-border)]" />
            <div className="bg-foreground/[0.04] h-8 rounded-md border border-[var(--glass-border)]" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="border-y border-[var(--glass-border)] py-4">
          <div className="bg-foreground/[0.08] h-4 w-40 rounded-full" />
          <div className="bg-foreground/[0.06] mt-2 h-3 w-56 max-w-full rounded-full" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: previewRows }, (_, index) => (
            <div
              aria-hidden="true"
              className="bg-background rounded-md border border-[var(--glass-border)] p-4"
              key={index}
            >
              <div className="bg-foreground/[0.07] h-3 w-24 rounded-full" />
              <div className="bg-foreground/[0.08] mt-4 h-4 w-3/4 rounded-full" />
              <div className="bg-foreground/[0.05] mt-2 h-3 w-full rounded-full" />
              <div className="mt-5 h-px bg-[var(--glass-border)]" />
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="bg-foreground/[0.08] h-4 w-20 rounded-full" />
                <div className="bg-foreground/[0.06] h-7 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
