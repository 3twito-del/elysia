import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";

export const metadata = {
  title: "התשלום התקבל",
};

type MockPaymentPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function MockPaymentPage({
  searchParams,
}: MockPaymentPageProps) {
  const { order } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="elysia-page account-boutique-page" dir="rtl">
        <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]">
          <Card className="account-boutique-panel w-full rounded-md">
            <CardContent className="p-4 sm:p-6">
              <EmptyState
                actions={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button asChild>
                      <Link href="/account">אזור אישי</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/">המשך לקולקציה</Link>
                    </Button>
                  </div>
                }
                description={
                  order
                    ? `מספר ההזמנה הוא ${order}. נשלח אישור למייל ברגע שהתשלום יאושר סופית.`
                    : "נשלח אישור למייל ברגע שהתשלום יאושר סופית."
                }
                icon={CheckCircle2}
                testId="checkout-mock-payment-return"
                title="התשלום התקבל לעיבוד"
                variant="inset"
              />
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
