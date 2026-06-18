import Link from "next/link";
import { SearchX } from "lucide-react";

import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";

export default function ProductNotFound() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="sr-only">התכשיט לא נמצא</h1>
        <EmptyState
          actions={
            <>
              <Button asChild>
                <Link href="/search">חיפוש במבחר</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">חזרה לעמוד הבית</Link>
              </Button>
            </>
          }
          description="ייתכן שהקישור השתנה או שהתכשיט אינו פעיל. ניתן להמשיך לחיפוש או לקולקציות."
          icon={SearchX}
          testId="product-not-found-empty-state"
          title="התכשיט לא נמצא"
        />
      </section>
    </main>
  );
}
