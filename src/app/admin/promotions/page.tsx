import { BadgePercent, FlaskConical, Tag } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createPromotionAction,
  deletePromotionAction,
  togglePromotionAction,
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
import { formatPrice } from "~/lib/format";
import {
  evaluatePromotions,
  listPromotions,
  PROMOTION_TYPES,
  getPromotionsSummary,
} from "~/server/services/promotions";

export const metadata = {
  title: "מבצעים | Admin",
};

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  PERCENT: "אחוז",
  FIXED: "סכום קבוע",
  FREE_SHIPPING: "משלוח חינם",
};

function formatValue(type: string, value: number) {
  if (type === "PERCENT") return `${value}%`;
  if (type === "FIXED") return formatPrice(value);
  return "—";
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPromotionsPage({ searchParams }: PageProps) {
  const access = await getAdminPageAccess("CATALOG_READ", "/admin/promotions");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getPromotionsSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const promotions = await listPromotions().catch(() => []);

  const query = await searchParams;
  const simSubtotal = Number(query.subtotal) || 0;
  const simQty = Number(query.qty) || 0;
  const simulation =
    simSubtotal > 0
      ? evaluatePromotions({
          cart: { subtotal: simSubtotal, itemCount: simQty },
          promotions: promotions.filter((promo) => promo.isActive),
        })
      : null;

  return (
    <AdminShell
      active="promotions"
      admin={access.admin}
      description="מנוע מבצעים אוטומטי ברמת סל: תנאי סף, עדיפות ו-stacking — עם סימולטור לפני הפעלה."
      title="מבצעים"
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          detail={`${summary.active} פעילים`}
          icon={BadgePercent}
          label="מבצעים"
          value={String(summary.total)}
        />
        <MetricCard
          detail="מבצעים המופעלים אוטומטית בסל"
          icon={Tag}
          label="אוטומטי"
          value="Rules"
        />
        <MetricCard
          detail="בדיקת מבצעים על סל לדוגמה"
          icon={FlaskConical}
          label="סימולטור"
          value="Live"
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgePercent aria-hidden="true" className="size-5" />
            מבצעים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={createPromotionAction} className="grid gap-2">
            <Input name="name" placeholder="שם המבצע" required />
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="סוג"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="PERCENT"
                name="type"
              >
                {PROMOTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {typeLabel[type] ?? type}
                  </option>
                ))}
              </select>
              <Input min="0" name="value" placeholder="ערך" step="0.01" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                min="0"
                name="minCartTotal"
                placeholder="סף סל ₪"
                type="number"
              />
              <Input min="0" name="minQuantity" placeholder="סף כמות" type="number" />
            </div>
            <label className="text-muted-foreground flex items-center gap-2 text-sm">
              <input name="stackable" type="checkbox" value="1" />
              ניתן לצבירה (stackable)
            </label>
            <Button className="w-fit" size="sm" type="submit">
              צור מבצע
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מבצע</TableHead>
                <TableHead>ערך</TableHead>
                <TableHead>סף</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו מבצעים."
                  icon={BadgePercent}
                  title="אין מבצעים"
                />
              ) : (
                promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{promo.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {typeLabel[promo.type] ?? promo.type}
                        {promo.stackable ? " · צביר" : ""} · #{promo.priority}
                      </div>
                      <Badge
                        className="mt-1"
                        variant={promo.isActive ? "secondary" : "outline"}
                      >
                        {promo.isActive ? "פעיל" : "כבוי"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatValue(promo.type, promo.value)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {promo.minCartTotal > 0 ? formatPrice(promo.minCartTotal) : "—"}
                      {promo.minQuantity > 0 ? ` · ${promo.minQuantity} יח׳` : ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <form action={togglePromotionAction}>
                          <input name="promotionId" type="hidden" value={promo.id} />
                          <input
                            name="isActive"
                            type="hidden"
                            value={promo.isActive ? "0" : "1"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {promo.isActive ? "כבה" : "הפעל"}
                          </Button>
                        </form>
                        <form action={deletePromotionAction}>
                          <input name="promotionId" type="hidden" value={promo.id} />
                          <Button size="sm" type="submit" variant="ghost">
                            מחק
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
            <FlaskConical aria-hidden="true" className="size-5" />
            סימולטור סל
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2" method="get">
            <div className="grid gap-1">
              <label className="text-muted-foreground text-xs" htmlFor="sim-subtotal">
                סכום סל (₪)
              </label>
              <Input
                className="w-32"
                defaultValue={simSubtotal ? String(simSubtotal) : ""}
                id="sim-subtotal"
                name="subtotal"
                type="number"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-muted-foreground text-xs" htmlFor="sim-qty">
                כמות פריטים
              </label>
              <Input
                className="w-28"
                defaultValue={simQty ? String(simQty) : ""}
                id="sim-qty"
                name="qty"
                type="number"
              />
            </div>
            <Button size="sm" type="submit" variant="outline">
              חשב מבצעים
            </Button>
          </form>

          {simulation ? (
            <div className="grid gap-2 text-sm">
              {simulation.applied.length === 0 ? (
                <p className="text-muted-foreground">אין מבצעים החלים על סל זה.</p>
              ) : (
                simulation.applied.map((entry) => (
                  <div
                    className="glass-inset flex items-center justify-between rounded-md border p-2"
                    key={entry.id}
                  >
                    <span>{entry.name}</span>
                    <span className="font-medium">
                      {entry.discount > 0 ? `−${formatPrice(entry.discount)}` : "משלוח חינם"}
                    </span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between border-t pt-2 font-semibold">
                <span>
                  {'סה"כ הנחה'}
                  {simulation.freeShipping ? " + משלוח חינם" : ""}
                </span>
                <span>−{formatPrice(simulation.totalDiscount)}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              הזן סכום סל וכמות כדי לראות אילו מבצעים פעילים חלים.
            </p>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
