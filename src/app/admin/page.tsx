import { AphroditeIcon } from "~/components/icon";
import { redirect } from "next/navigation";

import { AdminOrderActions } from "./_components/admin-order-actions";
import { adminLogoutAction } from "./actions";
import { MetricCard } from "~/components/metric-card";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function translateStatus(status: string) {
  const statuses: Record<string, string> = {
    PENDING_PAYMENT: "ממתין לתשלום",
    PAID: "שולם ידנית",
    PREPARING: "בהכנה",
    READY_FOR_PICKUP: "מוכן לאיסוף",
    SHIPPED: "נשלח",
    COMPLETED: "הושלם",
    CANCELLED: "בוטל",
    REFUNDED: "זוכה",
  };

  return statuses[status] ?? status;
}

function translateFulfillment(method: string) {
  return method === "PICKUP" ? "איסוף" : "משלוח";
}

async function loadAdminData() {
  const [overview, orders] = await Promise.all([
    api.admin.overview(),
    api.admin.orders({ limit: 10 }),
  ]);

  return { orders, overview };
}

function AdminDatabaseFallback() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="rounded-md border-black/10 bg-white/70 shadow-none backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AphroditeIcon name="plug" className="size-5" />
              נדרש חיבור מסד נתונים תקין
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-7">
            מסך התפעול קורא הזמנות, מלאי ומוצרים מתוך Prisma. הגדירו
            `DATABASE_URL` תקין והריצו seed/migration לפני בדיקת יצירת הזמנה
            ידנית.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function AdminForbidden({ title, detail }: { title: string; detail: string }) {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="rounded-md border-black/10 bg-white/70 shadow-none backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AphroditeIcon name="shieldWarning" className="size-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground grid gap-4 leading-7">
            <p>{detail}</p>
            <form action={adminLogoutAction}>
              <Button type="submit" variant="outline">
                מעבר להתחברות מחדש
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin");
  }

  const admin = await getAdminFromSession(session).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load admin session", error);
    }

    return null;
  });

  if (!admin) {
    return (
      <AdminForbidden
        detail="המשתמש המחובר אינו משויך לאדמין פעיל עם סיסמה והרשאות. יש להתחבר עם משתמש אדמין שנוצר דרך seed."
        title="אין הרשאת אדמין פעילה"
      />
    );
  }

  if (!hasAdminPermission(admin, "ORDERS")) {
    return (
      <AdminForbidden
        detail="תפקיד האדמין המחובר אינו כולל הרשאת ORDERS או SYSTEM."
        title="אין הרשאה למסך הזמנות"
      />
    );
  }

  const data = await loadAdminData().catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load operational data", error);
    }

    return null;
  });

  if (!data) {
    return <AdminDatabaseFallback />;
  }

  const { orders, overview } = data;

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge className="mb-4 shadow-none" variant="secondary">
              Back office
            </Badge>
            <h1 className="text-4xl font-semibold">ניהול Aphrodite</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
              מסך תפעולי לקטלוג, מלאי, סניפים, הזמנות, תורים ואינטגרציות. בשלב
              הזה ההזמנות הן בקשות ידניות ללא ספק תשלום חיצוני.
            </p>
          </div>
          <Card className="rounded-md border-black/10 bg-white/70 shadow-none backdrop-blur">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="text-sm">
                <p className="font-medium">{admin.name}</p>
                <p className="text-muted-foreground">{admin.roleName}</p>
              </div>
              <form action={adminLogoutAction}>
                <Button className="gap-2" type="submit" variant="outline">
                  <AphroditeIcon name="signOut" className="size-5" />
                  יציאה
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="מוצרים פעילים בקטלוג"
            icon="package"
            label="מוצרים"
            value={String(overview.products)}
          />
          <MetricCard
            detail="יחידות מלאי רשומות בסניפים"
            icon="stack"
            label="מלאי"
            value={String(overview.inventoryUnits)}
          />
          <MetricCard
            detail="סניפים מחוברים לתפעול"
            icon="storefront"
            label="סניפים"
            value={String(overview.branches)}
          />
          <MetricCard
            detail="בקשות פתוחות"
            icon="calendarDots"
            label="הזמנות"
            value={String(overview.openOrders)}
          />
        </div>

        <Card className="mt-8 rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AphroditeIcon name="clipboard" className="size-5" />
              הזמנות לטיפול
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[1080px]">
              <TableHeader>
                <TableRow>
                  <TableHead>מספר</TableHead>
                  <TableHead>לקוח</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>סניף</TableHead>
                  <TableHead>מסירה</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="text-muted-foreground py-8 text-center"
                      colSpan={8}
                    >
                      אין הזמנות עדיין.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-1">
                          <span>{order.recipientName}</span>
                          <span className="text-muted-foreground text-xs">
                            {order.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {translateStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-1">
                          <span>{order.branchName}</span>
                          <span className="text-muted-foreground text-xs">
                            {order.branchCity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {translateFulfillment(order.fulfillmentMethod)}
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <AdminOrderActions
                          fulfillmentMethod={order.fulfillmentMethod}
                          orderId={order.id}
                          status={order.status}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mt-8 rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AphroditeIcon name="plug" className="size-5" />
              אינטגרציות
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ספק</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תפקיד</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.integrations.map((integration) => (
                  <TableRow key={integration.name}>
                    <TableCell className="font-medium">
                      {integration.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{integration.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Adapter פנימי, מוכן להחלפה ללא שינוי במסכים.
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
