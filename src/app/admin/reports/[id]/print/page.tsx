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
import { toDisplayString } from "~/lib/stringify";
import { formatMeasure } from "~/server/services/report-engine";
import { runReport } from "~/server/services/reports";

export const metadata = {
  title: "הדפסת דוח | Admin",
};

export const dynamic = "force-dynamic";

type ReportPrintPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportPrintPage({ params }: ReportPrintPageProps) {
  const { id } = await params;
  const access = await getAdminPageAccess(
    "ERP_READ",
    `/admin/reports/${id}/print`,
  );

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const run = await runReport(id).catch(() => undefined);
  if (run === undefined) return <AdminDatabaseFallback />;
  if (!run) notFound();

  return (
    <main className="mx-auto max-w-4xl bg-white p-8 text-black" dir="rtl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link className="text-sm underline" href="/admin/reports">
          חזרה לדוחות
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">{run.name}</h1>
        <p className="mt-1 text-sm">
          {run.datasetLabel} · {run.result.rowCount} שורות ·{" "}
          {formatHebrewDateTime(new Date())}
        </p>
        <p className="text-sm">סינון: {run.filterDescription}</p>
      </header>

      <Table>
        <TableHeader>
          <TableRow>
            {run.result.dimensions.map((dimension) => (
              <TableHead key={dimension.key}>{dimension.label}</TableHead>
            ))}
            {run.result.measures.map((measure) => (
              <TableHead key={measure.key}>{measure.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {run.result.rows.map((row, index) => (
            <TableRow key={index}>
              {run.result.dimensions.map((dimension) => (
                <TableCell className="text-sm" key={dimension.key}>
                  {toDisplayString(row.dimensions[dimension.key] ?? "")}
                </TableCell>
              ))}
              {run.result.measures.map((measure) => (
                <TableCell className="text-sm" key={measure.key}>
                  {formatMeasure(row.measures[measure.key] ?? 0, measure.format)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow>
            {run.result.dimensions.map((dimension, index) => (
              <TableCell className="text-sm font-bold" key={dimension.key}>
                {index === 0 ? 'סה"כ' : ""}
              </TableCell>
            ))}
            {run.result.measures.map((measure) => (
              <TableCell className="text-sm font-bold" key={measure.key}>
                {formatMeasure(run.result.totals[measure.key] ?? 0, measure.format)}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </main>
  );
}
