import { Briefcase, CreditCard, Percent, Users } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  addAuthorizedBuyerAction,
  createB2bAccountAction,
  removeAuthorizedBuyerAction,
  setAuthorizedBuyerStatusAction,
  setB2bAccountStatusAction,
  updateB2bAccountAction,
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
  getB2bSummary,
  listAuthorizedBuyersByAccount,
  listB2bAccounts,
} from "~/server/services/b2b";

export const metadata = {
  title: "B2B | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminB2bPage() {
  const access = await getAdminPageAccess("CUSTOMER_VIEW", "/admin/b2b");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getB2bSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const accounts = await listB2bAccounts().catch(() => []);
  const buyersByAccount = await listAuthorizedBuyersByAccount(
    accounts.map((account) => account.id),
  ).catch(() => new Map<string, never[]>());

  return (
    <AdminShell
      active="b2b"
      admin={access.admin}
      description="חשבונות B2B: הנחה מוסכמת, מסגרת אשראי ותנאי תשלום ללקוחות עסקיים."
      title="לקוחות B2B"
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          detail={`${summary.active} פעילים`}
          icon={Users}
          label="חשבונות B2B"
          value={String(summary.total)}
        />
        <MetricCard
          detail="סך מסגרות אשראי"
          icon={CreditCard}
          label="אשראי"
          value={formatPrice(summary.totalCredit)}
        />
        <MetricCard
          detail="ניהול תנאים מסחריים"
          icon={Percent}
          label="B2B"
          value="Trade"
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase aria-hidden="true" className="size-5" />
            חשבונות B2B
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.8fr]">
          <form action={createB2bAccountAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              {'שיוך לקוח קיים (לפי דוא"ל) לחשבון עסקי עם תנאים מסחריים.'}
            </p>
            <Input name="customerEmail" placeholder='דוא"ל הלקוח' required type="email" />
            <Input name="companyName" placeholder="שם החברה (רשות)" />
            <div className="grid grid-cols-3 gap-2">
              <Input
                min="0"
                name="discountPercent"
                placeholder="הנחה %"
                step="0.01"
                type="number"
              />
              <Input
                min="0"
                name="creditLimit"
                placeholder="אשראי ₪"
                type="number"
              />
              <Input
                defaultValue="30"
                min="0"
                name="paymentTermsDays"
                placeholder="שוטף+"
                type="number"
              />
            </div>
            <Button className="w-fit" size="sm" type="submit">
              צור חשבון B2B
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>לקוח</TableHead>
                <TableHead>הנחה</TableHead>
                <TableHead>אשראי / תנאים</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו חשבונות B2B."
                  icon={Briefcase}
                  title="אין חשבונות"
                />
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">
                        {account.companyName ?? account.customerEmail}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {account.customerEmail}
                      </div>
                      <Badge
                        className="mt-1"
                        variant={account.status === "ACTIVE" ? "secondary" : "outline"}
                      >
                        {account.status === "ACTIVE" ? "פעיל" : "מושהה"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{account.discountPercent}%</TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(account.creditLimit)} · שוטף+{account.paymentTermsDays}
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <form
                          action={updateB2bAccountAction}
                          className="flex flex-wrap items-center gap-1"
                        >
                          <input name="accountId" type="hidden" value={account.id} />
                          <Input
                            className="h-8 w-16"
                            defaultValue={String(account.discountPercent)}
                            name="discountPercent"
                            title="הנחה %"
                            type="number"
                          />
                          <Input
                            className="h-8 w-24"
                            defaultValue={String(account.creditLimit)}
                            name="creditLimit"
                            title="אשראי"
                            type="number"
                          />
                          <Input
                            className="h-8 w-16"
                            defaultValue={String(account.paymentTermsDays)}
                            name="paymentTermsDays"
                            title="תנאים"
                            type="number"
                          />
                          <Button size="sm" type="submit" variant="outline">
                            עדכן
                          </Button>
                        </form>
                        <form action={setB2bAccountStatusAction}>
                          <input name="accountId" type="hidden" value={account.id} />
                          <input
                            name="status"
                            type="hidden"
                            value={account.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {account.status === "ACTIVE" ? "השעה" : "הפעל"}
                          </Button>
                        </form>

                        <div className="border-border/60 mt-1 grid gap-1 border-t pt-2">
                          <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                            <Users aria-hidden="true" className="size-3" />
                            רוכשים מורשים
                          </p>
                          {(buyersByAccount.get(account.id) ?? []).map((buyer) => (
                            <div
                              className="flex flex-wrap items-center gap-1 text-xs"
                              key={buyer.id}
                            >
                              <span className="font-medium">{buyer.name}</span>
                              <span className="text-muted-foreground">
                                {buyer.email}
                              </span>
                              <span className="text-muted-foreground">
                                {buyer.spendLimit > 0
                                  ? `עד ${formatPrice(buyer.spendLimit)}`
                                  : "ללא הגבלה"}
                              </span>
                              <Badge
                                variant={
                                  buyer.status === "ACTIVE" ? "secondary" : "outline"
                                }
                              >
                                {buyer.status === "ACTIVE" ? "פעיל" : "מושהה"}
                              </Badge>
                              <form action={setAuthorizedBuyerStatusAction}>
                                <input name="buyerId" type="hidden" value={buyer.id} />
                                <input
                                  name="status"
                                  type="hidden"
                                  value={
                                    buyer.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                                  }
                                />
                                <Button
                                  className="h-6 px-2"
                                  size="sm"
                                  type="submit"
                                  variant="ghost"
                                >
                                  {buyer.status === "ACTIVE" ? "השעה" : "הפעל"}
                                </Button>
                              </form>
                              <form action={removeAuthorizedBuyerAction}>
                                <input name="buyerId" type="hidden" value={buyer.id} />
                                <Button
                                  className="h-6 px-2"
                                  size="sm"
                                  type="submit"
                                  variant="ghost"
                                >
                                  הסר
                                </Button>
                              </form>
                            </div>
                          ))}
                          <form
                            action={addAuthorizedBuyerAction}
                            className="flex flex-wrap items-center gap-1"
                          >
                            <input name="accountId" type="hidden" value={account.id} />
                            <Input
                              className="h-8 w-24"
                              name="name"
                              placeholder="שם"
                              required
                            />
                            <Input
                              className="h-8 w-32"
                              name="email"
                              placeholder='דוא"ל'
                              required
                              type="email"
                            />
                            <Input
                              className="h-8 w-24"
                              min="0"
                              name="spendLimit"
                              placeholder="תקרה ₪"
                              type="number"
                            />
                            <Button size="sm" type="submit" variant="outline">
                              הוסף רוכש
                            </Button>
                          </form>
                        </div>
                      </div>
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
