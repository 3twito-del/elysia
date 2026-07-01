import { AlertTriangle, PackageSearch, ShoppingCart, Sliders } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import { setReorderPolicyAction } from "./actions";
import { MetricCard } from "~/components/metric-card";
import { Badge } from "~/components/ui/badge";
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
  getReorderSummary,
  listInventoryForPolicy,
  listReorderSuggestions,
} from "~/server/services/reorder-planning";

export const metadata = {
  title: "תכנון חידוש מלאי | Admin",
};

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "secondary" | "outline" | "destructive"> = {
  OK: "secondary",
  REORDER: "outline",
  CRITICAL: "destructive",
};

const statusLabel: Record<string, string> = {
  OK: "תקין",
  REORDER: "לחידוש",
  CRITICAL: "אזל",
};

export default async function AdminReorderPage() {
  const access = await getAdminPageAccess("INVENTORY_READ", "/admin/reorder");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getReorderSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const [suggestions, policyItems] = await Promise.all([
    listReorderSuggestions().catch(() => []),
    listInventoryForPolicy().catch(() => []),
  ]);

  return (
    <AdminShell
      active="reorder"
      admin={access.admin}
      description="תכנון חידוש מלאי: נקודת הזמנה ורמת יעד לכל פריט, והצעות רכש אוטומטיות."
      title="חידוש מלאי"
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          detail="פריטים עם מדיניות חידוש"
          icon={Sliders}
          label="מדיניות"
          value={String(summary.withPolicy)}
        />
        <MetricCard
          detail="פריטים מתחת לנקודת הזמנה"
          icon={ShoppingCart}
          label="לחידוש"
          value={String(summary.needsReorder)}
        />
        <MetricCard
          detail="פריטים שאזלו"
          icon={AlertTriangle}
          label="אזלו"
          value={String(summary.critical)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart aria-hidden="true" className="size-5" />
            הצעות רכש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>פריט</TableHead>
                <TableHead>סניף</TableHead>
                <TableHead>זמין / נקודה</TableHead>
                <TableHead>כמות מוצעת</TableHead>
                <TableHead>סטטוס</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  description="אין פריטים מתחת לנקודת ההזמנה כרגע."
                  icon={PackageSearch}
                  title="אין הצעות"
                />
              ) : (
                suggestions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{item.variantName}</div>
                      <div className="text-muted-foreground text-xs">{item.sku}</div>
                    </TableCell>
                    <TableCell className="text-xs">{item.branchName}</TableCell>
                    <TableCell className="text-sm">
                      {item.available} / {item.reorderPoint}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {item.suggested}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[item.status] ?? "outline"}>
                        {statusLabel[item.status] ?? item.status}
                      </Badge>
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
            <Sliders aria-hidden="true" className="size-5" />
            מדיניות חידוש (פריטים בעלי מלאי נמוך)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>פריט</TableHead>
                <TableHead>סניף</TableHead>
                <TableHead>זמין</TableHead>
                <TableHead>מהירות / מוצע</TableHead>
                <TableHead>נקודת הזמנה / יעד</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policyItems.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  description="אין פריטי מלאי להצגה."
                  icon={PackageSearch}
                  title="אין פריטים"
                />
              ) : (
                policyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{item.variantName}</div>
                      <div className="text-muted-foreground text-xs">{item.sku}</div>
                    </TableCell>
                    <TableCell className="text-xs">{item.branchName}</TableCell>
                    <TableCell className="text-sm">{item.available}</TableCell>
                    <TableCell className="text-xs">
                      {item.velocity}/יום · מוצע {item.suggestedReorderPoint}
                    </TableCell>
                    <TableCell>
                      <form
                        action={setReorderPolicyAction}
                        className="flex items-center gap-1"
                      >
                        <input
                          name="inventoryItemId"
                          type="hidden"
                          value={item.id}
                        />
                        <Input
                          aria-label="נקודת הזמנה"
                          className="h-8 w-16"
                          defaultValue={String(
                            item.reorderPoint > 0
                              ? item.reorderPoint
                              : item.suggestedReorderPoint,
                          )}
                          name="reorderPoint"
                          type="number"
                        />
                        <Input
                          aria-label="רמת יעד"
                          className="h-8 w-16"
                          defaultValue={String(item.targetLevel)}
                          name="targetLevel"
                          type="number"
                        />
                        <Button size="sm" type="submit" variant="outline">
                          שמור
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
    </AdminShell>
  );
}
