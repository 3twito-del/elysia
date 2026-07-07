import Link from "next/link";
import { SearchX } from "lucide-react";

import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";

export default function CategoryNotFound() {
  return (
    <main data-testid="category-not-found-state">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="sr-only">הקטגוריה לא נמצאה</h1>
        <EmptyState
          actions={
            <>
              <Button asChild>
                <Link href="/search">לכל התכשיטים</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">חזרה לעמוד הבית</Link>
              </Button>
            </>
          }
          description="ייתכן שהקישור השתנה או שהקטגוריה אינה פעילה. אפשר להמשיך לחיפוש או לחזור לעמוד הבית."
          icon={SearchX}
          testId="category-not-found-empty-state"
          title="הקטגוריה לא נמצאה"
        />
      </section>
    </main>
  );
}
