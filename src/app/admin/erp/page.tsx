import {
  ArrowLeftRight,
  Boxes,
  Building,
  ClipboardList,
  Factory,
  GaugeCircle,
  PackageCheck,
  ReceiptText,
  Search,
  ShieldCheck,
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
  cancelWorkOrderAction,
  completeInventoryCountAction,
  completeStockTransferAction,
  dispatchStockTransferAction,
  completeWorkOrderAction,
  createBomAction,
  createCarrierAction,
  createInventoryCountAction,
  createShippingRateAction,
  createStockTransferAction,
  createVendorInvoiceAction,
  createWorkOrderAction,
  disassembleKitAction,
  extractInvoiceDocumentAction,
  extractInvoiceImageAction,
  createInvoiceFromExtractionAction,
  createQualityInspectionAction,
  approvePurchaseRequisitionAction,
  applyLandedCostAction,
  convertRequisitionToPoAction,
  createLandedCostAction,
  createPurchaseRequisitionAction,
  rejectPurchaseRequisitionAction,
  submitPurchaseRequisitionAction,
  issueVendorPortalTokenAction,
  recordVendorPaymentAction,
  revokeVendorPortalTokenAction,
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
import { listVendorPortalTokens } from "~/server/services/vendor-portal";
import { getAvailabilityBySku } from "~/server/services/availability";
import { listInventoryCounts } from "~/server/services/cycle-count";
import { listBoms, listWorkOrders } from "~/server/services/manufacturing";
import { runMrp } from "~/server/services/mrp";
import {
  getQualitySummary,
  listQualityInspections,
} from "~/server/services/quality";
import { listDocumentExtractions } from "~/server/services/document-ai";
import {
  listCarriers,
  listShippingRates,
} from "~/server/services/shipping-rates";
import {
  listBranchesForSelect,
  listStockTransfers,
} from "~/server/services/stock-transfer";
import {
  listPurchaseRequisitions,
  listVendorsForRequisition,
} from "~/server/services/purchase-requisition";
import {
  listLandedCosts,
  listReceivedPurchaseOrdersForLandedCost,
} from "~/server/services/landed-cost";

export const metadata = {
  title: "ERP | Admin",
};

export const dynamic = "force-dynamic";

type AdminErpPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  const param = Array.isArray(value) ? value[0] : value;
  return param && param.length > 0 ? param.trim() : undefined;
}

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

const requisitionStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  PENDING_APPROVAL: "ממתין לאישור",
  APPROVED: "מאושר",
  REJECTED: "נדחה",
  CONVERTED: "הומר להזמנה",
};

const requisitionStatusVariant: Record<
  string,
  "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  PENDING_APPROVAL: "outline",
  APPROVED: "secondary",
  REJECTED: "destructive",
  CONVERTED: "secondary",
};

const transferStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  IN_TRANSIT: "בדרך",
  COMPLETED: "הושלמה",
  CANCELLED: "בוטלה",
};

const transferStatusVariant: Record<
  string,
  "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  IN_TRANSIT: "outline",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default async function AdminErpPage({
  searchParams,
}: AdminErpPageProps) {
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

  const vendorPortalTokens = await listVendorPortalTokens().catch(() => []);

  const [boms, workOrders] = await Promise.all([
    listBoms().catch(() => []),
    listWorkOrders().catch(() => []),
  ]);

  const [carriers, shippingRates] = await Promise.all([
    listCarriers().catch(() => []),
    listShippingRates().catch(() => []),
  ]);

  const [requisitions, requisitionVendors] = await Promise.all([
    listPurchaseRequisitions().catch(() => []),
    listVendorsForRequisition().catch(() => []),
  ]);

  const [landedCosts, landedCostPos] = await Promise.all([
    listLandedCosts().catch(() => []),
    listReceivedPurchaseOrdersForLandedCost().catch(() => []),
  ]);

  const [qualityInspections, qualitySummary] = await Promise.all([
    listQualityInspections().catch(() => []),
    getQualitySummary().catch(() => ({ total: 0, passed: 0, failed: 0 })),
  ]);

  const documentExtractions = await listDocumentExtractions().catch(() => []);

  const resolvedSearchParams = await searchParams;
  const atpSku = firstParam(resolvedSearchParams.atpSku);
  const availability = atpSku
    ? await getAvailabilityBySku(atpSku).catch(() => null)
    : null;

  const mrpBomId = firstParam(resolvedSearchParams.mrpBomId);
  const mrpQty = Math.max(1, Number(firstParam(resolvedSearchParams.mrpQty)) || 1);
  const mrpPlan = mrpBomId
    ? await runMrp({ bomId: mrpBomId, buildQuantity: mrpQty }).catch(() => null)
    : null;

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
            <GaugeCircle aria-hidden="true" className="size-5" />
            זמינות להבטחה (ATP)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-muted-foreground text-sm">
            זמינות-להבטחה רשתית: זמין למכירה (יתרה − שמור − מלאי ביטחון) מסוכם על
            פני כל הסניפים. מלאי נכנס (הזמנות רכש פתוחות) מוצג בנפרד ואינו נספר
            כזמין להבטחה.
          </p>
          <form className="flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              defaultValue={atpSku ?? ""}
              name="atpSku"
              placeholder='מק"ט (SKU)'
            />
            <Button type="submit" variant="outline">
              <Search aria-hidden="true" className="size-4" />
              בדוק זמינות
            </Button>
          </form>

          {atpSku && !availability ? (
            <p className="text-muted-foreground text-sm">
              לא נמצא מק&quot;ט &quot;{atpSku}&quot;.
            </p>
          ) : null}

          {availability ? (
            <div className="grid gap-4">
              <div className="text-sm font-medium">
                {availability.variantName}{" "}
                <span className="text-muted-foreground font-mono text-xs">
                  ({availability.sku})
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="grid gap-1">
                  <span className="text-muted-foreground text-sm">
                    זמין להבטחה
                  </span>
                  <span className="text-2xl font-semibold">
                    {availability.networkAtp}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground text-sm">במלאי</span>
                  <span className="text-2xl font-semibold">
                    {availability.totalOnHand}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground text-sm">שמור</span>
                  <span className="text-2xl font-semibold">
                    {availability.totalReserved}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground text-sm">מלאי נכנס</span>
                  <span className="text-2xl font-semibold">
                    {availability.onOrder}
                  </span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>סניף</TableHead>
                    <TableHead>במלאי</TableHead>
                    <TableHead>שמור</TableHead>
                    <TableHead>מלאי ביטחון</TableHead>
                    <TableHead>זמין</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availability.byBranch.length === 0 ? (
                    <TableEmptyRow
                      colSpan={5}
                      description="אין רשומות מלאי לפריט זה."
                      icon={GaugeCircle}
                      title="אין מלאי"
                    />
                  ) : (
                    availability.byBranch.map((branch) => (
                      <TableRow key={branch.branchId}>
                        <TableCell className="text-sm">
                          {branch.branchName}
                        </TableCell>
                        <TableCell>{branch.onHand}</TableCell>
                        <TableCell>{branch.reserved}</TableCell>
                        <TableCell>{branch.safetyStock}</TableCell>
                        <TableCell className="font-medium">
                          {branch.sellable}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory aria-hidden="true" className="size-5" />
            תכנון דרישות חומר (MRP)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-muted-foreground text-sm">
            פיצוץ עץ מוצר לכמות ייצור מבוקשת וקיזוז מול מלאי זמין והזמנות רכש
            פתוחות — כדי לחשב חוסרים לרכש.
          </p>
          <form className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <span className="text-muted-foreground text-xs">עץ מוצר</span>
              <select
                aria-label="עץ מוצר ל-MRP"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue={mrpBomId ?? ""}
                name="mrpBomId"
                required
              >
                <option disabled value="">
                  בחר עץ מוצר…
                </option>
                {boms.map((bom) => (
                  <option key={bom.id} value={bom.id}>
                    {bom.finishedName} ({bom.finishedSku})
                  </option>
                ))}
              </select>
            </div>
            <Input
              className="max-w-[8rem]"
              defaultValue={String(mrpQty)}
              min="1"
              name="mrpQty"
              placeholder="כמות ייצור"
              type="number"
            />
            <Button type="submit" variant="outline">
              <Search aria-hidden="true" className="size-4" />
              חשב MRP
            </Button>
          </form>

          <form
            action={disassembleKitAction}
            className="border-border/60 flex flex-wrap items-end gap-2 border-t pt-3"
          >
            <p className="text-muted-foreground w-full text-xs font-medium">
              פירוק ערכה (Kitting): צריכת מוצר מוגמר והשבת רכיביו למלאי.
            </p>
            <select
              aria-label="ערכה לפירוק"
              autoComplete="off"
              className="glass-control h-9 rounded-md border px-3 text-sm"
              defaultValue=""
              name="bomId"
              required
            >
              <option disabled value="">
                בחר ערכה…
              </option>
              {boms.map((bom) => (
                <option key={bom.id} value={bom.id}>
                  {bom.finishedName} ({bom.finishedSku})
                </option>
              ))}
            </select>
            <select
              aria-label="סניף לפירוק"
              autoComplete="off"
              className="glass-control h-9 rounded-md border px-3 text-sm"
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
            <Input
              className="max-w-[7rem]"
              min="1"
              name="quantity"
              placeholder="כמות"
              type="number"
            />
            <Button size="sm" type="submit" variant="outline">
              פרק ערכה
            </Button>
          </form>

          {mrpBomId && !mrpPlan ? (
            <p className="text-muted-foreground text-sm">
              לא ניתן לחשב MRP לעץ המוצר שנבחר.
            </p>
          ) : null}

          {mrpPlan ? (
            <div className="grid gap-3">
              <div className="text-sm font-medium">
                {mrpPlan.finishedName}{" "}
                <span className="text-muted-foreground font-mono text-xs">
                  ({mrpPlan.finishedSku})
                </span>{" "}
                × {mrpQty} · {mrpPlan.shortageCount} חוסרים
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>רכיב</TableHead>
                    <TableHead>דרוש</TableHead>
                    <TableHead>במלאי</TableHead>
                    <TableHead>בהזמנה</TableHead>
                    <TableHead>לרכש (נטו)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrpPlan.lines.length === 0 ? (
                    <TableEmptyRow
                      colSpan={5}
                      description="לעץ המוצר אין רכיבים."
                      icon={Factory}
                      title="אין רכיבים"
                    />
                  ) : (
                    mrpPlan.lines.map((line) => (
                      <TableRow key={line.variantId}>
                        <TableCell className="text-sm">
                          <div className="font-medium">{line.name}</div>
                          <div className="text-muted-foreground font-mono text-xs">
                            {line.sku}
                          </div>
                        </TableCell>
                        <TableCell>{line.gross}</TableCell>
                        <TableCell>{line.onHand}</TableCell>
                        <TableCell>{line.onOrder}</TableCell>
                        <TableCell>
                          {line.status === "SHORTAGE" ? (
                            <Badge variant="destructive">{line.net}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText aria-hidden="true" className="size-5" />
            Document-AI — חילוץ חשבוניות ספק (AI-004)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid gap-3">
          <form action={extractInvoiceDocumentAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              הדבק טקסט חשבונית ספק — ה-AI מחלץ ספק, מספר, תאריך ושורות לטיוטת AP
              לבדיקה אנושית. חילוץ בלבד, אינו רושם לספרים. דורש מפתח AI.
            </p>
            <Textarea
              name="documentText"
              placeholder="הדבק כאן את טקסט החשבונית…"
              rows={6}
            />
            <Button className="w-fit" size="sm" type="submit">
              חלץ מטקסט
            </Button>
          </form>

          <form
            action={extractInvoiceImageAction}
            className="border-border/60 grid gap-2 border-t pt-3"
          >
            <p className="text-muted-foreground text-xs font-medium">
              או העלה תמונה/PDF של החשבונית (Gemini vision)
            </p>
            <Input
              accept="image/png,image/jpeg,image/webp,application/pdf"
              aria-label="קובץ חשבונית להעלאה"
              name="documentImage"
              type="file"
            />
            <Button className="w-fit" size="sm" type="submit" variant="outline">
              חלץ מקובץ
            </Button>
          </form>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ספק / מספר</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>שורות (מוכן להעתקה)</TableHead>
                <TableHead>צור טיוטת AP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentExtractions.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם בוצעו חילוצים."
                  icon={ReceiptText}
                  title="אין חילוצים"
                />
              ) : (
                documentExtractions.map((extraction) => (
                  <TableRow key={extraction.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">
                        {extraction.vendorName ?? "—"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {extraction.invoiceNumber ?? "—"}
                        {extraction.total != null
                          ? ` · ${formatPrice(extraction.total)}`
                          : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {extraction.invoiceDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <pre className="whitespace-pre-wrap font-sans">
                        {extraction.linesText ?? "—"}
                      </pre>
                    </TableCell>
                    <TableCell>
                      <form
                        action={createInvoiceFromExtractionAction}
                        className="flex flex-wrap items-center gap-1"
                      >
                        <input
                          name="extractionId"
                          type="hidden"
                          value={extraction.id}
                        />
                        <select
                          aria-label="ספק תואם"
                          autoComplete="off"
                          className="glass-control h-8 rounded-md border px-2 text-xs"
                          defaultValue=""
                          name="vendorId"
                          required
                        >
                          <option disabled value="">
                            בחר ספק…
                          </option>
                          {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" type="submit" variant="outline">
                          צור טיוטה
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
            <ShieldCheck aria-hidden="true" className="size-5" />
            בקרת איכות (QM)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createQualityInspectionAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              בדיקת מדגם: התוצאה (עבר/נכשל) נגזרת משיעור הפגמים מול סף האיכות
              (AQL). {qualitySummary.passed} עברו · {qualitySummary.failed}{" "}
              נכשלו.
            </p>
            <Input name="reference" placeholder="אסמכתא (PO/WO/אצווה)" required />
            <Input dir="ltr" name="sku" placeholder="מק'ט (רשות)" />
            <div className="grid grid-cols-3 gap-2">
              <Input min="1" name="sampleSize" placeholder="מדגם" type="number" />
              <Input
                min="0"
                name="defectsFound"
                placeholder="פגמים"
                type="number"
              />
              <Input
                defaultValue="1"
                min="0"
                name="aqlPercent"
                placeholder="AQL %"
                step="0.1"
                type="number"
              />
            </div>
            <Button className="w-fit" size="sm" type="submit">
              רשום בדיקה
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>אסמכתא</TableHead>
                <TableHead>מדגם/פגמים</TableHead>
                <TableHead>שיעור</TableHead>
                <TableHead>תוצאה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualityInspections.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם נרשמו בדיקות איכות."
                  icon={ShieldCheck}
                  title="אין בדיקות"
                />
              ) : (
                qualityInspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="text-sm">
                      <div>{inspection.reference}</div>
                      {inspection.sku ? (
                        <div className="text-muted-foreground font-mono text-xs">
                          {inspection.sku}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inspection.sampleSize} / {inspection.defectsFound}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inspection.defectRate}% (AQL {inspection.aqlPercent}%)
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inspection.result === "PASS" ? "secondary" : "destructive"
                        }
                      >
                        {inspection.result === "PASS" ? "עבר" : "נכשל"}
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
            <ClipboardList aria-hidden="true" className="size-5" />
            דרישות רכש (Purchase Requisitions)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createPurchaseRequisitionAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              בקשת רכש פנימית. מעל סף האישור נדרש אישור מנהל; מתחתיו מאושרת
              אוטומטית. דרישה מאושרת ניתנת להמרה להזמנת רכש.
            </p>
            <select
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="vendorId"
            >
              <option value="">ספק (רשות)</option>
              {requisitionVendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            <Input name="category" placeholder="קטגוריה (רשות)" />
            <Textarea
              name="lines"
              placeholder={"תיאור | כמות | עלות\nמסך 27 | 2 | 900"}
              rows={3}
            />
            <Input name="notes" placeholder="הערות (רשות)" />
            <Button className="w-fit" size="sm" type="submit">
              צור דרישת רכש
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>דרישה</TableHead>
                <TableHead>ספק</TableHead>
                <TableHead>אומדן</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisitions.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם נוצרו דרישות רכש."
                  icon={ClipboardList}
                  title="אין דרישות"
                />
              ) : (
                requisitions.map((requisition) => (
                  <TableRow key={requisition.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">
                        {requisition.requisitionNumber}
                      </div>
                      <Badge
                        className="mt-1"
                        variant={
                          requisitionStatusVariant[requisition.status] ??
                          "outline"
                        }
                      >
                        {requisitionStatusLabel[requisition.status] ??
                          requisition.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {requisition.vendorName ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(requisition.estimatedTotal)}
                    </TableCell>
                    <TableCell>
                      {requisition.status === "DRAFT" ? (
                        <form action={submitPurchaseRequisitionAction}>
                          <input
                            name="requisitionId"
                            type="hidden"
                            value={requisition.id}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            הגש
                          </Button>
                        </form>
                      ) : requisition.status === "PENDING_APPROVAL" ? (
                        <div className="flex gap-1">
                          <form action={approvePurchaseRequisitionAction}>
                            <input
                              name="requisitionId"
                              type="hidden"
                              value={requisition.id}
                            />
                            <Button size="sm" type="submit" variant="outline">
                              אשר
                            </Button>
                          </form>
                          <form action={rejectPurchaseRequisitionAction}>
                            <input
                              name="requisitionId"
                              type="hidden"
                              value={requisition.id}
                            />
                            <Button size="sm" type="submit" variant="ghost">
                              דחה
                            </Button>
                          </form>
                        </div>
                      ) : requisition.status === "APPROVED" ? (
                        <form action={convertRequisitionToPoAction}>
                          <input
                            name="requisitionId"
                            type="hidden"
                            value={requisition.id}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            המר להזמנה
                          </Button>
                        </form>
                      ) : null}
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
            <Truck aria-hidden="true" className="size-5" />
            עלויות נלוות (Landed Cost)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createLandedCostAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              שילוח/מכס/ביטוח על הזמנת רכש שנקלטה — משוקלל לתוך שכבות העלות של
              הקליטה לפי ערך או כמות, ומעלה את עלות היחידה.
            </p>
            <select
              aria-label="הזמנת רכש שנקלטה"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="purchaseOrderId"
              required
            >
              <option disabled value="">
                בחר הזמנת רכש שנקלטה…
              </option>
              {landedCostPos.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} · {po.vendorName}
                </option>
              ))}
            </select>
            <Input name="description" placeholder="תיאור (למשל שילוח ימי)" required />
            <div className="grid grid-cols-2 gap-2">
              <Input
                min="0"
                name="amount"
                placeholder="סכום ₪"
                step="0.01"
                type="number"
              />
              <select
                aria-label="שיטת שקלול עלות נלווית"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="VALUE"
                name="basis"
              >
                <option value="VALUE">שקלול לפי ערך</option>
                <option value="QUANTITY">שקלול לפי כמות</option>
              </select>
            </div>
            <Button className="w-fit" size="sm" type="submit">
              הוסף עלות נלווית
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>הזמנה</TableHead>
                <TableHead>תיאור</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {landedCosts.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם נרשמו עלויות נלוות."
                  icon={Truck}
                  title="אין עלויות נלוות"
                />
              ) : (
                landedCosts.map((landedCost) => (
                  <TableRow key={landedCost.id}>
                    <TableCell className="text-sm">
                      {landedCost.poNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{landedCost.description}</div>
                      <Badge className="mt-1" variant="outline">
                        {landedCost.basis === "QUANTITY" ? "לפי כמות" : "לפי ערך"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(landedCost.amount)}
                    </TableCell>
                    <TableCell>
                      {landedCost.status === "DRAFT" ? (
                        <form action={applyLandedCostAction}>
                          <input
                            name="landedCostId"
                            type="hidden"
                            value={landedCost.id}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            החל
                          </Button>
                        </form>
                      ) : (
                        <Badge variant="secondary">הוחל</Badge>
                      )}
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
                            <form action={dispatchStockTransferAction}>
                              <input name="transferId" type="hidden" value={transfer.id} />
                              <Button size="sm" type="submit" variant="outline">
                                שלח
                              </Button>
                            </form>
                            <form action={completeStockTransferAction}>
                              <input
                                name="transferId"
                                type="hidden"
                                value={transfer.id}
                              />
                              <Button size="sm" type="submit" variant="ghost">
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
                        ) : transfer.status === "IN_TRANSIT" ? (
                          <form action={completeStockTransferAction}>
                            <input name="transferId" type="hidden" value={transfer.id} />
                            <Button size="sm" type="submit" variant="outline">
                              קבל
                            </Button>
                          </form>
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
            <Factory aria-hidden="true" className="size-5" />
            ייצור — עץ מוצר והוראות עבודה (Manufacturing)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid gap-5">
            <form action={createBomAction} className="grid gap-2">
              <p className="text-muted-foreground text-sm">
                עץ מוצר (BOM): המק&quot;ט המוגמר והרכיבים הנדרשים ליחידה אחת.
              </p>
              <Input name="finishedSku" placeholder='מק"ט מוצר מוגמר' required />
              <Input name="name" placeholder="שם העץ (רשות)" />
              <Textarea
                className="font-mono"
                name="components"
                placeholder={"GOLD-CHAIN | 1\nCLASP-01 | 2"}
                rows={3}
              />
              <Button className="w-fit" size="sm" type="submit">
                צור עץ מוצר
              </Button>
            </form>

            <form
              action={createWorkOrderAction}
              className="grid gap-2 border-t pt-4"
            >
              <p className="text-muted-foreground text-sm">
                הוראת עבודה: השלמתה צורכת רכיבים ומייצרת מוצר מוגמר (עם שכבת עלות).
              </p>
              <select
                aria-label="עץ מוצר"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="bomId"
                required
              >
                <option disabled value="">
                  בחר עץ מוצר…
                </option>
                {boms.map((bom) => (
                  <option key={bom.id} value={bom.id}>
                    {bom.finishedName} ({bom.finishedSku}) · {bom.componentCount}{" "}
                    רכיבים
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="סניף"
                  autoComplete="off"
                  className="glass-control h-10 rounded-md border px-3 text-sm"
                  defaultValue=""
                  name="branchId"
                  required
                >
                  <option disabled value="">
                    סניף ייצור…
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <Input
                  aria-label="כמות"
                  name="quantity"
                  placeholder="כמות לייצור"
                  type="number"
                />
              </div>
              <Button className="w-fit" size="sm" type="submit">
                צור הוראת עבודה
              </Button>
            </form>
          </div>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">הוראות עבודה</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מס׳</TableHead>
                  <TableHead>מוצר</TableHead>
                  <TableHead>כמות</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.length === 0 ? (
                  <TableEmptyRow
                    colSpan={5}
                    description="טרם נוצרו הוראות עבודה."
                    icon={Factory}
                    title="אין הוראות עבודה"
                  />
                ) : (
                  workOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {order.workOrderNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.finishedName}
                      </TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transferStatusVariant[order.status] ?? "outline"
                          }
                        >
                          {transferStatusLabel[order.status] ?? order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.status === "DRAFT" ? (
                          <div className="flex gap-1">
                            <form action={completeWorkOrderAction}>
                              <input
                                name="workOrderId"
                                type="hidden"
                                value={order.id}
                              />
                              <Button size="sm" type="submit" variant="outline">
                                השלם
                              </Button>
                            </form>
                            <form action={cancelWorkOrderAction}>
                              <input
                                name="workOrderId"
                                type="hidden"
                                value={order.id}
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
            <Truck aria-hidden="true" className="size-5" />
            מובילים ותעריפי משלוח (Shipping)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid gap-5">
            <form action={createCarrierAction} className="grid gap-2">
              <p className="text-muted-foreground text-sm">
                מוביל ותעריפי אזור/משקל. הצעת מחיר בוחרת את התעריף הזול שמכסה.
              </p>
              <Input name="name" placeholder="שם המוביל" required />
              <Button className="w-fit" size="sm" type="submit">
                צור מוביל
              </Button>
            </form>

            <form
              action={createShippingRateAction}
              className="grid gap-2 border-t pt-4"
            >
              <select
                aria-label="מוביל"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="carrierId"
                required
              >
                <option disabled value="">
                  בחר מוביל…
                </option>
                {carriers.map((carrier) => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </option>
                ))}
              </select>
              <Input name="zone" placeholder="אזור (מרכז/צפון/דרום)" />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  name="maxWeightKg"
                  placeholder='מ"ק עד (ק"ג)'
                  step="0.01"
                  type="number"
                />
                <Input name="price" placeholder="מחיר" step="0.01" type="number" />
              </div>
              <Button className="w-fit" size="sm" type="submit">
                הוסף תעריף
              </Button>
            </form>
          </div>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">תעריפים</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מוביל</TableHead>
                  <TableHead>אזור</TableHead>
                  <TableHead>עד ק&quot;ג</TableHead>
                  <TableHead className="text-left">מחיר</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingRates.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="טרם הוגדרו תעריפי משלוח."
                    icon={Truck}
                    title="אין תעריפים"
                  />
                ) : (
                  shippingRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="text-sm">{rate.carrierName}</TableCell>
                      <TableCell className="text-sm">{rate.zone}</TableCell>
                      <TableCell>{rate.maxWeightKg}</TableCell>
                      <TableCell className="text-left">
                        {formatPrice(rate.price)}
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
                          <Input
                            aria-label="ניכוי מס במקור"
                            className="h-8 w-20"
                            inputMode="numeric"
                            name="withheldTax"
                            placeholder="ניכוי"
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

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building aria-hidden="true" className="size-5" />
            פורטל ספקים — קישורי גישה
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={issueVendorPortalTokenAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              קישור גישה לקריאה בלבד (הזמנות רכש, חשבוניות, מצב תשלום, ציון אספקה).
              שלחו את הקישור לספק; ניתן לבטל בכל עת.
            </p>
            <select
              aria-label="ספק"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="vendorId"
              required
            >
              <option disabled value="">
                בחר ספק…
              </option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            <Button className="w-fit" size="sm" type="submit">
              צור קישור
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ספק</TableHead>
                <TableHead>קישור</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorPortalTokens.length === 0 ? (
                <TableEmptyRow
                  colSpan={3}
                  description="טרם הונפקו קישורי פורטל לספקים."
                  icon={Building}
                  title="אין קישורים"
                />
              ) : (
                vendorPortalTokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="text-sm">{token.vendorName}</TableCell>
                    <TableCell className="max-w-[16rem] truncate">
                      <a
                        className="text-xs underline"
                        dir="ltr"
                        href={`/vendor-portal/${token.token}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        /vendor-portal/{token.token.slice(0, 12)}…
                      </a>
                    </TableCell>
                    <TableCell>
                      <form action={revokeVendorPortalTokenAction}>
                        <input name="tokenId" type="hidden" value={token.id} />
                        <Button size="sm" type="submit" variant="ghost">
                          בטל
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
