import Link from "next/link";
import { SearchX } from "lucide-react";

import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";

/**
 * Shared 404/recovery screen for every "not found" route (global, category,
 * product). Keeps the framing and the single recovery CTA identical
 * everywhere instead of each route re-implementing its own variant.
 */
export function NotFoundState({
  description,
  hiddenTitle,
  testId,
  title,
}: {
  description: string;
  hiddenTitle: string;
  testId: string;
  title: string;
}) {
  return (
    <main data-testid={testId}>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="sr-only">{hiddenTitle}</h1>
        <EmptyState
          actions={
            <Button asChild>
              <Link href="/search">לכל התכשיטים</Link>
            </Button>
          }
          description={description}
          icon={SearchX}
          testId={`${testId}-empty-state`}
          title={title}
        />
      </section>
    </main>
  );
}
