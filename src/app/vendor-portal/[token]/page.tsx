import { Building2, ClipboardList, Clock, ReceiptText } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { StatusMessage } from "~/components/ui/status-message";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableEmptyRow } from "~/components/ui/table-empty-row";
import { formatOptionalHebrewDateTime, formatPrice } from "~/lib/format";
import { resolveVendorPortalByToken } from "~/server/services/vendor-portal";

export const metadata = {
  title: "פורטל ספק",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

const poStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  ORDERED: "הוזמן",
  PARTIALLY_RECEIVED: "התקבל חלקית",
  RECEIVED: "התקבל",
  CANCELLED: "בוטל",
};

const invoiceStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  PENDING: "ממתינה",
  APPROVED: "אושרה",
  PARTIALLY_PAID: "שולמה חלקית",
  PAID: "שולמה",
};

export default async function VendorPortalPage({ params }: PageProps) {
  const { token } = await params;
  const data = await resolveVendorPortalByToken(token).catch(() => null);

  if (!data) {
    return (
      <main className="elysia-page">
        <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4 px-4 py-10">
          <h1 className="text-2xl font-semibold">הקישור אינו זמין</h1>
          <StatusMessage tone="neutral">
            הקישור אינו תקין, פג תוקפו או בוטל. אנא פנו לאיש הקשר שלכם לקבלת קישור
            מעודכן.
          </StatusMessage>
        </section>
      </main>
    );
  }

  const { vendor, purchaseOrders, invoices, scorecard } = data;

  return (
    <main className="elysia-page">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 aria-hidden="true" className="size-6" />
            <div>
              <h1 className="text-2xl font-semibold">{vendor.name}</h1>
              <p className="text-muted-foreground text-sm">פורטל ספק · קריאה בלבד</p>
            </div>
          </div>
          {vendor.paymentTerms ? (
            <Badge variant="outline">תנאי תשלום: {vendor.paymentTerms}</Badge>
          ) : null}
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-md">
            <CardContent className="grid gap-1 p-5">
              <span className="text-muted-foreground text-sm">הזמנות רכש</span>
              <span className="text-2xl font-semibold">{scorecard.poCount}</span>
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardContent className="grid gap-1 p-5">
              <span className="text-muted-foreground text-sm">היקף כספי</span>
              <span className="text-2xl font-semibold">
                {formatPrice(scorecard.totalValue)}
              </span>
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardContent className="grid gap-1 p-5">
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                <Clock aria-hidden="true" className="size-3" />
                אספקה בזמן
              </span>
              <span className="text-2xl font-semibold">
                {scorecard.onTimePercent}%
              </span>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList aria-hidden="true" className="size-5" />
              הזמנות רכש
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מספר</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>צפי אספקה</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="אין הזמנות רכש להצגה."
                    icon={ClipboardList}
                    title="אין הזמנות"
                  />
                ) : (
                  purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="text-sm">{po.poNumber}</TableCell>
                      <TableCell className="text-sm">{formatPrice(po.total)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatOptionalHebrewDateTime(po.expectedAt, "—")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {poStatusLabel[po.status] ?? po.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText aria-hidden="true" className="size-5" />
              חשבוניות ומצב תשלום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>חשבונית</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>יתרה</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="אין חשבוניות להצגה."
                    icon={ReceiptText}
                    title="אין חשבוניות"
                  />
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="text-sm">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="text-sm">
                        {formatPrice(invoice.total)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatPrice(invoice.outstanding)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={invoice.status === "PAID" ? "secondary" : "outline"}
                        >
                          {invoiceStatusLabel[invoice.status] ?? invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
