import { ListChecks, Tags, UserCog } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import { AdminForbidden } from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  assignPriceListAction,
  createPriceListAction,
  setPriceListItemAction,
  togglePriceListAction,
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
import { listB2bAccounts } from "~/server/services/b2b";
import {
  listPriceListItems,
  listPriceLists,
} from "~/server/services/price-lists";

export const metadata = {
  title: "מחירונים | Admin",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPriceListsPage({ searchParams }: PageProps) {
  const access = await getAdminPageAccess("CUSTOMER_VIEW", "/admin/price-lists");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const priceLists = await listPriceLists().catch(() => []);

  const query = await searchParams;
  const selectedId =
    typeof query.list === "string" &&
    priceLists.some((list) => list.id === query.list)
      ? query.list
      : priceLists[0]?.id;

  const [items, accounts] = await Promise.all([
    selectedId ? listPriceListItems(selectedId).catch(() => []) : Promise.resolve([]),
    listB2bAccounts().catch(() => []),
  ]);

  const selected = priceLists.find((list) => list.id === selectedId);

  return (
    <AdminShell
      active="price-lists"
      admin={access.admin}
      description="מחירונים ללקוחות B2B: מחיר פר-מק'ט ושיוך מחירון לחשבון עסקי."
      title="מחירונים"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <MetricCard
          detail="מחירונים מוגדרים"
          icon={Tags}
          label="מחירונים"
          value={String(priceLists.length)}
        />
        <MetricCard
          detail="חשבונות B2B לשיוך"
          icon={UserCog}
          label="חשבונות"
          value={String(accounts.length)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags aria-hidden="true" className="size-5" />
            מחירונים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={createPriceListAction} className="grid gap-2">
            <Input name="name" placeholder="שם המחירון" required />
            <Input defaultValue="ILS" name="currency" placeholder="מטבע" />
            <Button className="w-fit" size="sm" type="submit">
              צור מחירון
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מחירון</TableHead>
                <TableHead>פריטים / חשבונות</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceLists.length === 0 ? (
                <TableEmptyRow
                  colSpan={3}
                  description="טרם נוצרו מחירונים."
                  icon={Tags}
                  title="אין מחירונים"
                />
              ) : (
                priceLists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{list.name}</div>
                      <Badge
                        className="mt-1"
                        variant={list.isActive ? "secondary" : "outline"}
                      >
                        {list.isActive ? "פעיל" : "כבוי"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {list.itemCount} פריטים · {list.accountCount} חשבונות
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button asChild size="sm" variant="outline">
                          <a href={`/admin/price-lists?list=${list.id}`}>ערוך</a>
                        </Button>
                        <form action={togglePriceListAction}>
                          <input name="priceListId" type="hidden" value={list.id} />
                          <input
                            name="isActive"
                            type="hidden"
                            value={list.isActive ? "0" : "1"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {list.isActive ? "כבה" : "הפעל"}
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

      {selected ? (
        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks aria-hidden="true" className="size-5" />
              פריטי מחירון · {selected.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
            <form action={setPriceListItemAction} className="grid gap-2">
              <input name="priceListId" type="hidden" value={selected.id} />
              <Input dir="ltr" name="sku" placeholder="מק'ט" required />
              <Input min="0" name="price" placeholder="מחיר ₪" step="0.01" type="number" />
              <Button className="w-fit" size="sm" type="submit">
                הוסף / עדכן פריט
              </Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>פריט</TableHead>
                  <TableHead>{"מק'ט"}</TableHead>
                  <TableHead>מחיר</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableEmptyRow
                    colSpan={3}
                    description="אין פריטים במחירון זה."
                    icon={ListChecks}
                    title="ריק"
                  />
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{item.variantName}</TableCell>
                      <TableCell className="text-xs" dir="ltr">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-sm">{formatPrice(item.price)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog aria-hidden="true" className="size-5" />
            שיוך מחירון לחשבון B2B
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              אין חשבונות B2B לשיוך. צרו חשבון במסך B2B.
            </p>
          ) : (
            <form action={assignPriceListAction} className="flex flex-wrap items-end gap-2">
              <select
                aria-label="חשבון"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="accountId"
                required
              >
                <option disabled value="">
                  בחר חשבון…
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.companyName ?? account.customerEmail}
                  </option>
                ))}
              </select>
              <select
                aria-label="מחירון"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="priceListId"
              >
                <option value="">ללא מחירון</option>
                {priceLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <Button size="sm" type="submit" variant="outline">
                שייך
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
