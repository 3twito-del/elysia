import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../../../_components/admin-states";
import { getAdminPageAccess } from "../../../_lib/access";
import { PrintButton } from "./print-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatHebrewDateTime } from "~/lib/format";
import { getPackingSlip } from "~/server/services/packing-slip";

export const metadata = {
  title: "תעודת אריזה | Admin",
};

export const dynamic = "force-dynamic";

type PackingSlipPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PackingSlipPage({ params }: PackingSlipPageProps) {
  const { id } = await params;
  const access = await getAdminPageAccess(
    "ORDERS_READ",
    `/admin/orders/${id}/packing-slip`,
  );

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const slip = await getPackingSlip(id).catch(() => undefined);
  if (slip === undefined) return <AdminDatabaseFallback />;
  if (!slip) notFound();

  return (
    <main className="mx-auto max-w-3xl bg-white p-8 text-black" dir="rtl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          className="text-sm underline"
          href={`/admin/orders/${id}`}
        >
          חזרה להזמנה
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">תעודת אריזה</h1>
        <p className="mt-1 text-sm">
          הזמנה <span dir="ltr">{slip.orderNumber}</span> ·{" "}
          {formatHebrewDateTime(slip.generatedAt)}
        </p>
      </header>

      <section className="mb-6 grid gap-1 text-sm">
        <p className="font-semibold">נמען למשלוח</p>
        <p>{slip.address?.recipient ?? slip.recipientName}</p>
        {slip.address?.street ? <p>{slip.address.street}</p> : null}
        {slip.address?.city || slip.address?.postalCode ? (
          <p>
            {[slip.address?.city, slip.address?.postalCode]
              .filter(Boolean)
              .join(" ")}
          </p>
        ) : null}
        {slip.address?.phone ? (
          <p dir="ltr">{slip.address.phone}</p>
        ) : null}
      </section>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>פריט</TableHead>
            <TableHead>{'מק"ט'}</TableHead>
            <TableHead>כמות</TableHead>
            <TableHead>נארז</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slip.items.map((item, index) => (
            <TableRow key={`${item.sku}-${index}`}>
              <TableCell className="text-sm">{item.name}</TableCell>
              <TableCell className="text-sm" dir="ltr">
                {item.sku}
              </TableCell>
              <TableCell className="text-sm">{item.quantity}</TableCell>
              <TableCell className="text-sm">☐</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <footer className="mt-6 border-t pt-4 text-sm">
        <p>
          {slip.lineCount} שורות · {slip.totalUnits} {'יחידות סה"כ'}
        </p>
      </footer>
    </main>
  );
}
