"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";

export default function AccountError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-16 sm:px-6">
        <Card className="w-full rounded-md">
          <CardContent className="p-4 sm:p-6">
            <EmptyState
              actions={
                <Button className="gap-2" onClick={reset} type="button">
                  <RefreshCw aria-hidden="true" className="size-4" />
                  ניסיון חוזר
                </Button>
              }
              description="אזור הלקוח אינו זמין כרגע. אפשר לנסות שוב בלי לאבד את הסשן."
              icon={AlertTriangle}
              testId="account-error-boundary"
              title="אזור הלקוח אינו זמין"
              variant="inset"
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
