"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";

export default function CategoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main data-testid="category-error-state">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <EmptyState
          actions={
            <>
              <Button onClick={reset} type="button">
                ניסיון נוסף
              </Button>
              <Button asChild variant="outline">
                <Link href="/search">לכל התכשיטים</Link>
              </Button>
            </>
          }
          description="אירעה שגיאה בטעינת הקטגוריה. אפשר לנסות שוב או לעבור לחיפוש."
          icon={AlertTriangle}
          testId="category-error-empty-state"
          title="הקטגוריה אינה זמינה כרגע"
        />
      </section>
    </main>
  );
}
