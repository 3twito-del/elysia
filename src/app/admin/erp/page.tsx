import {
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  PackageCheck,
  ReceiptText,
  Truck,
  Workflow,
} from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  approveVendorInvoiceAction,
  cancelInventoryCountAction,
  cancelStockTransferAction,
  completeInventoryCountAction,
  completeStockTransferAction,
  createInventoryCountAction,
  createStockTransferAction,
  createVendorInvoiceAction,
  recordVendorPaymentAction,
} from "./actions";
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
import { Textarea } from "~/components/ui/textarea";
import { formatHebrewDateTime, formatPrice } from "~/lib/format";
import {
  getApAging,
  listVendorInvoices,
  listVendorsForSelect,
} from "~/server/services/accounts-payable";
import { getErpOverview } from "~/server/services/erp";
import { listInventoryCounts } from "~/server/services/cycle-count";
import {
  listBranchesForSelect,
  listStockTransfers,
} from "~/server/services/stock-transfer";

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

const vendorInvoiceStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  MATCHED: "תואם",
  VARIANCE: "סטייה",
  APPROVED: "מאושר",
  PARTIALLY_PAID: "שולם חלקית",
  PAID: "שולם",
  CANCELLED: "בוטל",
};

const vendorInvoiceStatusVariant: Record<
  string,
  "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  MATCHED: "outline",
  VARIANCE: "destructive",
  APPROVED: "secondary",
  PARTIALLY_PAID: "outline",
  PAID: "secondary",
  CANCELLED: "destructive",
};

const transferStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  COMPLETED: "הושלמה",
  CANCELLED: "בוטלה",
};

const transferStatusVariant: Record<
  string,
  "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

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

  const [
    vendors,
    vendorInvoices,
    apAging,
    branches,
    stockTransfers,
    inventoryCounts,
  ] = await Promise.all([
    listVendorsForSelect().catch(() => []),
    listVendorInvoices().catch(() => []),
    getApAging().catch(() => null),
    listBranchesForSelect().catch(() => []),
    listStockTransfers().catch(() => []),
    listInventoryCounts().catch(() => []),
  ]);

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

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight aria-hidden="true" className="size-5" />
            העברות מלאי בין סניפים (Stock Transfers)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <form action={createStockTransferAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              העברת מלאי בין סניפים. נוצרת כטיוטה; ההשלמה מזיזה את המלאי ורושמת
              תנועות יומן מלאי בלתי-הפיכות.
            </p>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="tr-source">
                סניף מקור
              </label>
              <select
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                id="tr-source"
                name="sourceBranchId"
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
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="tr-dest">
                סניף יעד
              </label>
              <select
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                id="tr-dest"
                name="destBranchId"
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
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="tr-lines">
                שורות
              </label>
              <Textarea
                className="font-mono"
                id="tr-lines"
                name="lines"
                placeholder={"RING-01 | 2\nNECK-09 | 5"}
                rows={3}
              />
              <span className="text-muted-foreground text-xs">
                שורה לכל פריט בפורמט <code>מק&quot;ט | כמות</code>.
              </span>
            </div>
            <Input name="notes" placeholder="הערות (רשות)" />
            <Button className="w-fit" type="submit">
              צור טיוטת העברה
            </Button>
          </form>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">העברות אחרונות</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מס׳</TableHead>
                  <TableHead>מסלול</TableHead>
                  <TableHead>פריטים</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockTransfers.length === 0 ? (
                  <TableEmptyRow
                    colSpan={5}
                    description="טרם נוצרו העברות מלאי."
                    icon={ArrowLeftRight}
                    title="אין העברות"
                  />
                ) : (
                  stockTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {transfer.transferNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {transfer.sourceBranchName} ← {transfer.destBranchName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {transfer.lineCount} ({transfer.totalQuantity} יח׳)
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transferStatusVariant[transfer.status] ?? "outline"
                          }
                        >
                          {transferStatusLabel[transfer.status] ??
                            transfer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transfer.status === "DRAFT" ? (
                          <div className="flex gap-1">
                            <form action={completeStockTransferAction}>
                              <input
                                name="transferId"
                                type="hidden"
                                value={transfer.id}
                              />
                              <Button size="sm" type="submit" variant="outline">
                                השלם
                              </Button>
                            </form>
                            <form action={cancelStockTransferAction}>
                              <input
                                name="transferId"
                                type="hidden"
                                value={transfer.id}
                              />
                              <Button size="sm" type="submit" variant="ghost">
                                בטל
                              </Button>
                            </form>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList aria-hidden="true" className="size-5" />
            ספירת מלאי (Cycle Count)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <form action={createInventoryCountAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              ספירה פיזית מול מלאי-הספרים. בהשלמה, המלאי מתעדכן לכמות שנספרה ונרשמת
              תנועת התאמה (cycle_count_adjustment) על ההפרש.
            </p>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="cnt-branch">
                סניף
              </label>
              <select
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                id="cnt-branch"
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
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="cnt-lines">
                שורות ספירה
              </label>
              <Textarea
                className="font-mono"
                id="cnt-lines"
                name="lines"
                placeholder={"RING-01 | 8\nNECK-09 | 0"}
                rows={3}
              />
              <span className="text-muted-foreground text-xs">
                שורה לכל פריט בפורמט <code>מק&quot;ט | כמות שנספרה</code> (0 מותר).
              </span>
            </div>
            <Input name="notes" placeholder="הערות (רשות)" />
            <Button className="w-fit" type="submit">
              צור טיוטת ספירה
            </Button>
          </form>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">ספירות אחרונות</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מס׳</TableHead>
                  <TableHead>סניף</TableHead>
                  <TableHead>שורות</TableHead>
                  <TableHead>הפרש נטו</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryCounts.length === 0 ? (
                  <TableEmptyRow
                    colSpan={6}
                    description="טרם בוצעו ספירות מלאי."
                    icon={ClipboardList}
                    title="אין ספירות"
                  />
                ) : (
                  inventoryCounts.map((count) => (
                    <TableRow key={count.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {count.countNumber}
                      </TableCell>
                      <TableCell className="text-sm">{count.branchName}</TableCell>
                      <TableCell className="text-sm">{count.lineCount}</TableCell>
                      <TableCell className="text-sm">
                        {count.status === "COMPLETED"
                          ? count.netVariance
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transferStatusVariant[count.status] ?? "outline"
                          }
                        >
                          {transferStatusLabel[count.status] ?? count.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {count.status === "DRAFT" ? (
                          <div className="flex gap-1">
                            <form action={completeInventoryCountAction}>
                              <input
                                name="countId"
                                type="hidden"
                                value={count.id}
                              />
                              <Button size="sm" type="submit" variant="outline">
                                השלם
                              </Button>
                            </form>
                            <form action={cancelInventoryCountAction}>
                              <input
                                name="countId"
                                type="hidden"
                                value={count.id}
                              />
                              <Button size="sm" type="submit" variant="ghost">
                                בטל
                              </Button>
                            </form>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText aria-hidden="true" className="size-5" />
            חשבונות לתשלום (AP)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {apAging ? (
            <p className="text-muted-foreground text-sm">
              סה״כ פתוח {formatPrice(apAging.total)} · באיחור 90+{" "}
              {formatPrice(apAging.days90plus)}
            </p>
          ) : null}

          <form action={createVendorInvoiceAction} className="grid gap-2">
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_180px]">
              <select
                aria-label="ספק"
                autoComplete="off"
                className="glass-control h-11 rounded-md border px-3 text-sm"
                defaultValue=""
                name="vendorId"
              >
                <option disabled value="">
                  בחר ספק
                </option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              <Input name="invoiceNumber" placeholder="מספר חשבונית ספק" />
              <Input aria-label="לתשלום עד" name="dueDate" type="date" />
            </div>
            <Textarea
              name="lines"
              placeholder="שורה לכל פריט: תיאור | כמות | עלות"
              rows={3}
            />
            <Button className="w-fit" type="submit">
              צור חשבונית ספק
            </Button>
          </form>

          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead>חשבונית</TableHead>
                <TableHead>ספק</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>סה״כ</TableHead>
                <TableHead>יתרה</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorInvoices.length === 0 ? (
                <TableEmptyRow
                  colSpan={6}
                  description="חשבוניות ספק שתיצרו יופיעו כאן לאישור (GRNI→ספק) ולתשלום."
                  icon={ReceiptText}
                  title="אין חשבוניות ספק"
                />
              ) : (
                vendorInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.vendorName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vendorInvoiceStatusVariant[invoice.status] ?? "outline"
                        }
                      >
                        {vendorInvoiceStatusLabel[invoice.status] ??
                          invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(invoice.total)}</TableCell>
                    <TableCell>{formatPrice(invoice.outstanding)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={approveVendorInvoiceAction}>
                          <input
                            name="invoiceId"
                            type="hidden"
                            value={invoice.id}
                          />
                          <input name="force" type="hidden" value="1" />
                          <Button size="sm" type="submit" variant="outline">
                            אשר
                          </Button>
                        </form>
                        <form
                          action={recordVendorPaymentAction}
                          className="flex items-center gap-1"
                        >
                          <input
                            name="invoiceId"
                            type="hidden"
                            value={invoice.id}
                          />
                          <input
                            name="vendorId"
                            type="hidden"
                            value={invoice.vendorId}
                          />
                          <Input
                            aria-label="סכום תשלום"
                            className="h-8 w-24"
                            defaultValue={
                              invoice.outstanding > 0
                                ? String(invoice.outstanding)
                                : ""
                            }
                            inputMode="numeric"
                            name="amount"
                          />
                          <Button size="sm" type="submit">
                            שלם
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
