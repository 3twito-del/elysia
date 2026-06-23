import { Boxes, PackageCheck, Truck, Workflow } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import { MetricCard } from "~/components/metric-card";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableEmptyRow } from "~/components/ui/table-empty-row";
import { formatHebrewDateTime, formatPrice } from "~/lib/format";
import { getErpOverview } from "~/server/services/erp";

export const metadata = {
  title: "ERP | Admin",
};

export const dynamic = "force-dynamic";

const reorderUrgencyLabel = {
  CRITICAL: "קריטי",
  HIGH: "גבוה",
  MEDIUM: "בינוני",
} as const;

const reorderUrgencyVariant = {
  CRITICAL: "destructive",
  HIGH: "default",
  MEDIUM: "secondary",
} as const;

export default async function AdminErpPage() {
  const access = await getAdminPageAccess("ERP_READ", "/admin/erp");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const erp = await getErpOverview().catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load ERP", error);
    }

    return null;
  });

  if (!erp) return <AdminDatabaseFallback />;

  return (
    <AdminShell
      active="erp"
      admin={access.admin}
      description="ERP תפעולי ל־Elysia: ספקים, הזמנות רכש, קליטת סחורה, עלויות מוצר והמלצות reorder."
      title="ERP"
    >
      {!erp.enabled ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          ERP_MODULES_ENABLED כבוי. הנתונים מוצגים לקריאה בלבד עד הפעלה מלאה.
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${erp.counts.openPurchaseOrders} פתוחות · ${formatPrice(erp.counts.openPurchaseOrderValue)}`}
          icon={Workflow}
          label="Purchase orders"
          value={String(erp.counts.purchaseOrders)}
        />
        <MetricCard
          detail={`${erp.counts.overduePurchaseOrders} PO באיחור`}
          icon={Truck}
          label="ספקים"
          value={String(erp.counts.vendors)}
        />
        <MetricCard
          detail={`${erp.counts.onHandUnits} במלאי · ${erp.counts.stockoutItems} באפס`}
          icon={PackageCheck}
          label="יחידות זמינות"
          value={String(erp.counts.onHandUnits - erp.counts.reservedUnits)}
        />
        <MetricCard
          detail={`${erp.counts.criticalReorders} קריטיים · ${formatPrice(erp.counts.totalReorderInvestment)} השקעה`}
          icon={Boxes}
          label="Reorder"
          value={String(erp.counts.reorderRecommendations)}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck aria-hidden="true" className="size-5" />
              ספקים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>Lead time</TableHead>
                  <TableHead>PO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {erp.vendors.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="ספקים יופיעו אחרי seed או הקמה ידנית."
                    icon={Truck}
                    title="אין ספקים"
                  />
                ) : (
                  erp.vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">
                        {vendor.name}
                        <span className="text-muted-foreground block text-xs">
                          {vendor.key}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{vendor.status}</Badge>
                      </TableCell>
                      <TableCell>{vendor.leadTimeDays} ימים</TableCell>
                      <TableCell>{vendor.purchaseOrders}</TableCell>
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
              <Workflow aria-hidden="true" className="size-5" />
              Purchase orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>PO</TableHead>
                  <TableHead>ספק</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>שורות</TableHead>
                  <TableHead>סה״כ</TableHead>
                  <TableHead>עודכן</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {erp.purchaseOrders.length === 0 ? (
                  <TableEmptyRow
                    colSpan={6}
                    description="הזמנות רכש יופיעו לאחר פתיחה."
                    icon={Workflow}
                    title="אין PO"
                  />
                ) : (
                  erp.purchaseOrders.map((purchaseOrder) => (
                    <TableRow key={purchaseOrder.id}>
                      <TableCell className="font-medium">
                        {purchaseOrder.poNumber}
                      </TableCell>
                      <TableCell>{purchaseOrder.vendorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{purchaseOrder.status}</Badge>
                      </TableCell>
                      <TableCell>{purchaseOrder.itemCount}</TableCell>
                      <TableCell>{formatPrice(purchaseOrder.total)}</TableCell>
                      <TableCell>
                        {formatHebrewDateTime(purchaseOrder.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes aria-hidden="true" className="size-5" />
              Reorder recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {erp.reorderRecommendations.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                אין המלצות reorder כרגע.
              </p>
            ) : (
              erp.reorderRecommendations.map((item) => (
                <div
                  className="rounded-md border p-3"
                  key={item.inventoryItemId}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.productName}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={reorderUrgencyVariant[item.urgency]}>
                        {reorderUrgencyLabel[item.urgency]}
                      </Badge>
                      <Badge variant="outline">+{item.reorderQuantity}</Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {item.sku} · {item.branchName} · זמין {item.sellable} ·{" "}
                    {item.daysOfCover} ימי כיסוי · {item.dailyVelocity}/יום
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    ספק מומלץ: {item.suggestedVendorName ?? "—"} · lead{" "}
                    {item.leadTimeDays} ימים
                    {item.estimatedReorderCost !== null
                      ? ` · עלות ${formatPrice(item.estimatedReorderCost)}`
                      : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Cost snapshots</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {erp.recentCostSnapshots.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                אין snapshots להצגה.
              </p>
            ) : (
              erp.recentCostSnapshots.map((snapshot) => (
                <div className="rounded-md border p-3" key={snapshot.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{snapshot.productName}</p>
                    <Badge variant="secondary">
                      {formatPrice(snapshot.unitCost)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {snapshot.variantSku ?? "כללי"} ·{" "}
                    {snapshot.vendorName ?? "ללא ספק"} · {snapshot.source}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow aria-hidden="true" className="size-5" />
              PO באיחור
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {erp.overduePurchaseOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                כל ההזמנות בלוח הזמנים. אין PO באיחור.
              </p>
            ) : (
              erp.overduePurchaseOrders.map((purchaseOrder) => (
                <div className="rounded-md border p-3" key={purchaseOrder.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{purchaseOrder.poNumber}</p>
                    <Badge variant="destructive">
                      {purchaseOrder.daysOverdue} ימים באיחור
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {purchaseOrder.vendorName} · {purchaseOrder.status} ·{" "}
                    {formatPrice(purchaseOrder.total)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck aria-hidden="true" className="size-5" />
              ביצועי ספקים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ספק</TableHead>
                  <TableHead>Lead (יעד/בפועל)</TableHead>
                  <TableHead>בזמן</TableHead>
                  <TableHead>פתוח</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {erp.vendorScorecards.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="ביצועי ספקים יופיעו אחרי קליטת PO."
                    icon={Truck}
                    title="אין נתונים"
                  />
                ) : (
                  erp.vendorScorecards.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">
                        {vendor.name}
                      </TableCell>
                      <TableCell>
                        {vendor.declaredLeadTimeDays} /{" "}
                        {vendor.actualLeadTimeDays ?? "—"}
                      </TableCell>
                      <TableCell>
                        {vendor.onTimeRate === null
                          ? "—"
                          : `${vendor.onTimeRate}%`}
                      </TableCell>
                      <TableCell>{formatPrice(vendor.openValue)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
