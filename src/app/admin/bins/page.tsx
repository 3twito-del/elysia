import { Grid3x3, MapPin, PackageOpen } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  assignToBinAction,
  createBinAction,
  toggleBinAction,
} from "./actions";
import { MetricCard } from "~/components/metric-card";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableEmptyRow } from "~/components/ui/table-empty-row";
import {
  getBinsSummary,
  listBinAssignments,
  listBins,
} from "~/server/services/bins";
import { listBranchesForSelect } from "~/server/services/stock-transfer";

export const metadata = {
  title: "מיקומי מלאי | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminBinsPage() {
  const access = await getAdminPageAccess("INVENTORY_READ", "/admin/bins");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getBinsSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const [branches, bins, assignments] = await Promise.all([
    listBranchesForSelect().catch(() => []),
    listBins().catch(() => []),
    listBinAssignments().catch(() => []),
  ]);

  const activeBins = bins.filter((bin) => bin.isActive);

  return (
    <AdminShell
      active="bins"
      admin={access.admin}
      description="מיקומי אחסון (bins) בסניפים ושיוך פריטים למיקומים לפי מק'ט."
      title="מיקומי מלאי"
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          detail={`${summary.active} פעילים`}
          icon={Grid3x3}
          label="מיקומים"
          value={String(summary.bins)}
        />
        <MetricCard
          detail="שיוכי פריט-מיקום"
          icon={PackageOpen}
          label="שיוכים"
          value={String(summary.assignments)}
        />
        <MetricCard
          detail="פורמט קוד: A-01-3"
          icon={MapPin}
          label="קידוד"
          value="Aisle"
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-5" />
            מיקומים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={createBinAction} className="grid gap-2">
            <select
              aria-label="סניף"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="branchId"
              required
            >
              <option disabled value="">
                בחר סניף…
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <Input dir="ltr" name="code" placeholder="קוד מיקום (A-01-3)" required />
            <Input name="label" placeholder="תיאור (רשות)" />
            <Button className="w-fit" size="sm" type="submit">
              צור מיקום
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מיקום</TableHead>
                <TableHead>סניף</TableHead>
                <TableHead>פריטים</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bins.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו מיקומים."
                  icon={MapPin}
                  title="אין מיקומים"
                />
              ) : (
                bins.map((bin) => (
                  <TableRow key={bin.id}>
                    <TableCell className="text-sm">
                      <code dir="ltr">{bin.code}</code>
                      {bin.label ? (
                        <div className="text-muted-foreground text-xs">{bin.label}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs">{bin.branchName}</TableCell>
                    <TableCell className="text-sm">{bin.assignmentCount}</TableCell>
                    <TableCell>
                      <form action={toggleBinAction}>
                        <input name="binId" type="hidden" value={bin.id} />
                        <input
                          name="isActive"
                          type="hidden"
                          value={bin.isActive ? "0" : "1"}
                        />
                        <Button size="sm" type="submit" variant="ghost">
                          {bin.isActive ? "השבת" : "הפעל"}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageOpen aria-hidden="true" className="size-5" />
            שיוך פריטים למיקומים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={assignToBinAction} className="grid gap-2">
            <select
              aria-label="מיקום"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="binId"
              required
            >
              <option disabled value="">
                בחר מיקום…
              </option>
              {activeBins.map((bin) => (
                <option key={bin.id} value={bin.id}>
                  {bin.code} · {bin.branchName}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input dir="ltr" name="sku" placeholder="מק'ט" required />
              <Input min="0" name="quantity" placeholder="כמות" type="number" />
            </div>
            <Button className="w-fit" size="sm" type="submit">
              שייך למיקום
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>פריט</TableHead>
                <TableHead>מיקום</TableHead>
                <TableHead>כמות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableEmptyRow
                  colSpan={3}
                  description="טרם שויכו פריטים למיקומים."
                  icon={PackageOpen}
                  title="אין שיוכים"
                />
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{assignment.variantName}</div>
                      <div className="text-muted-foreground text-xs">{assignment.sku}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <code dir="ltr">{assignment.binCode}</code> · {assignment.branchName}
                    </TableCell>
                    <TableCell className="text-sm">{assignment.quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
