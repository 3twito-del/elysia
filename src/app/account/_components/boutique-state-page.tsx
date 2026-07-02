import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { SiteHeader } from "~/components/site-header";
import { Card, CardContent } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { cn } from "~/lib/utils";

/**
 * The centered single-card "state" screen shared by the account and wishlist
 * pages (e.g. signed-out, admin-session or load-error states). Keeps the
 * boutique framing (header, panel, empty state) identical across both.
 */
export function BoutiqueStatePage({
  actions,
  description,
  icon,
  testId,
  title,
  className,
}: {
  actions?: ReactNode;
  description: ReactNode;
  icon: LucideIcon;
  testId: string;
  title: ReactNode;
  className?: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className={cn("elysia-page account-boutique-page", className)}>
        <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]">
          <Card className="account-boutique-panel w-full rounded-md">
            <CardContent className="p-4 sm:p-6">
              <EmptyState
                actions={actions}
                description={description}
                icon={icon}
                testId={testId}
                title={title}
                variant="inset"
              />
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
