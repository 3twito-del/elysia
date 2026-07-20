import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, Landmark, ReceiptText } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { StatusMessage } from "~/components/ui/status-message";
import { formatOptionalHebrewDateTime, formatPrice } from "~/lib/format";
import { auth } from "~/server/auth";
import { getCustomerPortalData } from "~/server/services/customer-portal";

export const metadata = {
  title: "חשבוניות ומסמכים",
};

export const dynamic = "force-dynamic";

const invoiceStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  ISSUED: "הונפקה",
  PARTIALLY_PAID: "שולמה חלקית",
  PAID: "שולמה",
  CANCELLED: "בוטלה",
};

export default async function CustomerInvoicesPage() {
  const session = await auth();

  if (!session?.user || session.user.adminUserId) {
    redirect(`/account?callbackUrl=${encodeURIComponent("/account/invoices")}`);
  }

  const portal = await getCustomerPortalData(session.user.id);

  if (!portal) redirect("/account");

  const { invoices, documents, summary, b2b } = portal;

  return (
    <main className="elysia-page">
      <SiteHeader />
      <CompactPageIntro
        description="חשבוניות, מצב תשלום ומסמכים אישיים במקום אחד."
        eyebrow="אזור אישי"
        title="חשבוניות ומסמכים"
        variant="checkout"
      />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Button asChild className="mb-6 gap-2" variant="ghost">
          <Link href="/account">
            <ArrowRight aria-hidden="true" className="size-4" />
            אזור אישי
          </Link>
        </Button>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-md">
            <CardContent className="grid gap-1 p-5">
              <span className="text-muted-foreground text-sm">חשבוניות</span>
              <span className="text-2xl font-semibold tabular-nums">
                {summary.count}
              </span>
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardContent className="grid gap-1 p-5">
              <span className="text-muted-foreground text-sm">יתרה לתשלום</span>
              <span className="text-2xl font-semibold tabular-nums">
                {formatPrice(summary.outstanding)}
              </span>
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardContent className="grid gap-1 p-5">
              <span className="text-muted-foreground text-sm">שולם עד היום</span>
              <span className="text-2xl font-semibold tabular-nums">
                {formatPrice(summary.paid)}
              </span>
            </CardContent>
          </Card>
        </div>

        {b2b ? (
          <Card className="mb-6 rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark aria-hidden="true" className="size-5" />
                חשבון עסקי (B2B)
                {b2b.companyName ? ` · ${b2b.companyName}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-4">
              <div className="grid gap-1">
                <span className="text-muted-foreground">הנחה מסחרית</span>
                <span className="text-lg font-semibold">{b2b.discountPercent}%</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground">מסגרת אשראי</span>
                <span className="text-lg font-semibold">
                  {formatPrice(b2b.creditLimit)}
                </span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground">אשראי פנוי</span>
                <span className="text-lg font-semibold">
                  {formatPrice(b2b.available)}
                </span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground">תנאי תשלום</span>
                <span className="text-lg font-semibold">שוטף+{b2b.paymentTermsDays}</span>
              </div>
              {b2b.creditStatus !== "OK" ? (
                <p className="text-muted-foreground sm:col-span-4">
                  <Badge variant="outline">
                    {b2b.creditStatus === "OVER_LIMIT"
                      ? "חריגה ממסגרת האשראי"
                      : "קרוב למסגרת האשראי"}
                  </Badge>
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card className="mb-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText aria-hidden="true" className="size-5" />
              חשבוניות
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {invoices.length === 0 ? (
              <StatusMessage tone="neutral">
                אין חשבוניות להצגה כרגע.
              </StatusMessage>
            ) : (
              invoices.map((invoice) => (
                <div
                  className="glass-inset flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  key={invoice.id}
                >
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatOptionalHebrewDateTime(invoice.invoiceDate, "—")}
                      {invoice.allocationNumber
                        ? ` · מספר הקצאה ${invoice.allocationNumber}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">
                      {formatPrice(invoice.total)}
                    </span>
                    <Badge
                      variant={
                        invoice.status === "PAID"
                          ? "secondary"
                          : invoice.status === "CANCELLED"
                            ? "outline"
                            : "outline"
                      }
                    >
                      {invoiceStatusLabel[invoice.status] ?? invoice.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText aria-hidden="true" className="size-5" />
              מסמכים
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {documents.length === 0 ? (
              <StatusMessage tone="neutral" variant="plain">
                אין מסמכים משותפים איתך כרגע.
              </StatusMessage>
            ) : (
              documents.map((document) => (
                <div
                  className="glass-inset flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  key={document.id}
                >
                  <div className="flex items-center gap-2">
                    <Landmark
                      aria-hidden="true"
                      className="text-muted-foreground size-4"
                    />
                    <div>
                      <p className="font-medium">{document.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {document.category ?? "מסמך"}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <a href={document.url} rel="noopener noreferrer" target="_blank">
                      פתח
                    </a>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
