import { CreditCard, ShoppingCart, Store } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  closeShiftAction,
  issueGiftCardAction,
  openShiftAction,
  recordPosSaleAction,
  redeemGiftCardAction,
} from "./actions";
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
  getGiftCardSummary,
  listGiftCards,
} from "~/server/services/gift-card";
import { listShifts } from "~/server/services/pos-register";
import { listBranchesForSelect } from "~/server/services/stock-transfer";

export const metadata = {
  title: "קופה | Admin",
};

export const dynamic = "force-dynamic";

const giftCardStatusLabel: Record<string, string> = {
  ACTIVE: "פעיל",
  DEPLETED: "נוצל",
  CANCELLED: "בוטל",
};

export default async function AdminPosPage() {
  const access = await getAdminPageAccess("ERP_READ", "/admin/pos");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const [giftCards, giftCardSummary, shifts, branches] = await Promise.all([
    listGiftCards().catch(() => null),
    getGiftCardSummary().catch(() => null),
    listShifts().catch(() => []),
    listBranchesForSelect().catch(() => []),
  ]);

  if (!giftCards) return <AdminDatabaseFallback />;

  const openShifts = shifts.filter((shift) => shift.status === "OPEN");

  return (
    <AdminShell
      active="pos"
      admin={access.admin}
      description="קופה וקמעונאות: שוברי מתנה / ארנק חנות ומשמרות קופה עם התאמת מזומן."
      title="קופה"
    >
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <CreditCard aria-hidden="true" className="size-5" />
              שוברי מתנה (Gift Cards)
            </span>
            {giftCardSummary ? (
              <span className="text-muted-foreground text-sm font-normal">
                {giftCardSummary.activeCount} פעילים ·{" "}
                {formatPrice(giftCardSummary.outstandingBalance)} התחייבות
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid gap-5">
            <form action={issueGiftCardAction} className="grid gap-2">
              <p className="text-muted-foreground text-sm">
                הנפקת שובר רושמת ל-GL: Dr מזומן / Cr התחייבות שוברים.
              </p>
              <Input name="amount" placeholder="סכום השובר" step="0.01" type="number" />
              <Button className="w-fit" size="sm" type="submit">
                הנפק שובר
              </Button>
            </form>

            <form action={redeemGiftCardAction} className="grid gap-2 border-t pt-4">
              <p className="text-muted-foreground text-sm">
                פדיון מכיר בהכנסה: Dr התחייבות / Cr הכנסה + מע&quot;מ.
              </p>
              <Input name="code" placeholder="קוד שובר (GC-…)" />
              <Input name="amount" placeholder="סכום לפדיון" step="0.01" type="number" />
              <Button className="w-fit" size="sm" type="submit">
                פדה שובר
              </Button>
            </form>
          </div>

          <div className="grid gap-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>קוד</TableHead>
                  <TableHead className="text-left">יתרה</TableHead>
                  <TableHead className="text-left">הונפק</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giftCards.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="טרם הונפקו שוברים."
                    icon={CreditCard}
                    title="אין שוברים"
                  />
                ) : (
                  giftCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {card.code}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(card.balance)}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(card.initialBalance)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            card.status === "ACTIVE" ? "secondary" : "outline"
                          }
                        >
                          {giftCardStatusLabel[card.status] ?? card.status}
                        </Badge>
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
            <Store aria-hidden="true" className="size-5" />
            משמרת קופה (Register Shift)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={openShiftAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              פתיחת משמרת עם קופה פותחת. הסגירה משווה ספירה מול צפוי (פותחת +
              מכירות מזומן).
            </p>
            <select
              aria-label="סניף"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="branchId"
            >
              <option value="">ללא סניף</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <Input
              name="openingFloat"
              placeholder="קופה פותחת"
              step="0.01"
              type="number"
            />
            <Button className="w-fit" size="sm" type="submit">
              פתח משמרת
            </Button>
          </form>

          <div className="grid gap-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מס׳</TableHead>
                  <TableHead className="text-left">פותחת</TableHead>
                  <TableHead className="text-left">מכירות מזומן</TableHead>
                  <TableHead className="text-left">סטייה</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.length === 0 ? (
                  <TableEmptyRow
                    colSpan={6}
                    description="טרם נפתחו משמרות."
                    icon={Store}
                    title="אין משמרות"
                  />
                ) : (
                  shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {shift.shiftNumber}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(shift.openingFloat)}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(shift.cashSales)}
                        <span className="text-muted-foreground ms-1 text-xs">
                          ({shift.salesCount})
                        </span>
                      </TableCell>
                      <TableCell className="text-left">
                        {shift.variance != null ? (
                          <span
                            className={
                              Math.abs(shift.variance) < 0.005
                                ? "text-muted-foreground"
                                : "text-destructive"
                            }
                          >
                            {formatPrice(shift.variance)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            shift.status === "OPEN" ? "outline" : "secondary"
                          }
                        >
                          {shift.status === "OPEN" ? "פתוחה" : "סגורה"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {shift.status === "OPEN" ? (
                          <form
                            action={closeShiftAction}
                            className="flex items-center gap-1"
                          >
                            <input
                              name="shiftId"
                              type="hidden"
                              value={shift.id}
                            />
                            <Input
                              aria-label="ספירת מזומן"
                              className="h-8 w-24"
                              name="countedCash"
                              placeholder="ספירה"
                              step="0.01"
                              type="number"
                            />
                            <Button size="sm" type="submit" variant="outline">
                              סגור
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
            <ShoppingCart aria-hidden="true" className="size-5" />
            מכירת קופה (POS Sale)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openShifts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              פִּתחו משמרת עם סניף כדי לרשום מכירות קופה. כל מכירה יוצרת הזמנה
              משולמת, מנכה מלאי בסניף ורושמת ל-GL — אותו מקור מלאי וכספים כמו
              האתר.
            </p>
          ) : (
            <form
              action={recordPosSaleAction}
              className="grid items-end gap-2 sm:grid-cols-[1.2fr_1fr_0.6fr_1.2fr_auto]"
            >
              <select
                aria-label="משמרת"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                name="shiftId"
              >
                {openShifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.shiftNumber}
                  </option>
                ))}
              </select>
              <Input aria-label="מק״ט" name="sku" placeholder='מק"ט' />
              <Input
                aria-label="כמות"
                defaultValue={1}
                min={1}
                name="quantity"
                placeholder="כמות"
                step="1"
                type="number"
              />
              <Input
                aria-label="דוא״ל לקוח (לא חובה)"
                name="customerEmail"
                placeholder='דוא"ל לקוח (לא חובה)'
                type="email"
              />
              <Button size="sm" type="submit">
                רשום מכירה
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
