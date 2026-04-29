import {
  Boxes,
  CalendarClock,
  ClipboardList,
  Percent,
  LogOut,
  PackageCheck,
  PlugZap,
  ShieldAlert,
  Store,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import { AdminOrderActions } from "./_components/admin-order-actions";
import { AdminAppointmentActions } from "./_components/admin-appointment-actions";
import {
  AdminCouponCreateForm,
  AdminCouponStatusAction,
  AdminInventoryEditor,
  AdminProductCreateForm,
  AdminProductStatusAction,
} from "./_components/admin-catalog-actions";
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
import { TRPCReactProvider } from "~/trpc/react";
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
  const [overview, orders, catalog, customers, appointments] =
    await Promise.all([
      api.admin.overview(),
      api.admin.orders({ limit: 10 }),
      api.admin.catalog(),
      api.admin.customers({ limit: 10 }),
      api.admin.appointments({ limit: 12 }),
    ]);

  return { appointments, catalog, customers, orders, overview };
}

function AdminDatabaseFallback() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlugZap className="size-5" />
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
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5" />
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

  const { appointments, catalog, customers, orders, overview } = data;

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge className="mb-4" variant="secondary">
              Back office
            </Badge>
            <h1 className="text-4xl font-semibold">ניהול Aphrodite</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
              מסך תפעולי לקטלוג, מלאי, סניפים, הזמנות, תורים ואינטגרציות. בשלב
              הזה ההזמנות הן בקשות ידניות ללא ספק תשלום חיצוני.
            </p>
          </div>
          <Card className="rounded-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="text-sm">
                <p className="font-medium">{admin.name}</p>
                <p className="text-muted-foreground">{admin.roleName}</p>
              </div>
              <form action={adminLogoutAction}>
                <Button className="gap-2" type="submit" variant="outline">
                  <LogOut className="size-4" />
                  יציאה
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="מוצרים פעילים בקטלוג"
            icon={PackageCheck}
            label="מוצרים"
            value={String(overview.products)}
          />
          <MetricCard
            detail="יחידות מלאי רשומות בסניפים"
            icon={Boxes}
            label="מלאי"
            value={String(overview.inventoryUnits)}
          />
          <MetricCard
            detail="סניפים מחוברים לתפעול"
            icon={Store}
            label="סניפים"
            value={String(overview.branches)}
          />
          <MetricCard
            detail="בקשות פתוחות"
            icon={CalendarClock}
            label="הזמנות"
            value={String(overview.openOrders)}
          />
        </div>

        <Card className="mt-8 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-5" />
              הזמנות לטיפול
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <TRPCReactProvider>
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
                            returns={order.returns}
                            shipment={order.shipment}
                            status={order.status}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TRPCReactProvider>
          </CardContent>
        </Card>

        <Card className="mt-8 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5" />
              תורים בסניפים
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <TRPCReactProvider>
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>לקוח</TableHead>
                    <TableHead>סניף</TableHead>
                    <TableHead>נושא</TableHead>
                    <TableHead>תאריך</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        className="text-muted-foreground py-8 text-center"
                        colSpan={6}
                      >
                        אין תורים פתוחים.
                      </TableCell>
                    </TableRow>
                  ) : (
                    appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="grid gap-1">
                            <span>{appointment.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {appointment.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {appointment.branchName}, {appointment.branchCity}
                        </TableCell>
                        <TableCell>{appointment.topic}</TableCell>
                        <TableCell>
                          {formatDate(appointment.startsAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AdminAppointmentActions
                            appointmentId={appointment.id}
                            status={appointment.status}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TRPCReactProvider>
          </CardContent>
        </Card>

        <Card className="mt-8 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="size-5" />
              קטלוג ומלאי
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 overflow-x-auto">
            <TRPCReactProvider>
              <AdminProductCreateForm catalog={catalog} />
              <Table className="min-w-[1120px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>מוצר</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>קטגוריה</TableHead>
                    <TableHead>מחיר</TableHead>
                    <TableHead>מלאי</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalog.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="grid gap-1">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {product.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.status}</Badge>
                      </TableCell>
                      <TableCell>{product.categoryName}</TableCell>
                      <TableCell>{formatPrice(product.basePrice)}</TableCell>
                      <TableCell>
                        <div className="grid gap-2">
                          {product.variants.flatMap((variant) =>
                            variant.inventory.map((inventory) => (
                              <div
                                className="flex items-center justify-between gap-3"
                                key={`${variant.id}:${inventory.branchId}`}
                              >
                                <span className="min-w-32 text-xs">
                                  {variant.sku} · {inventory.branchName}
                                </span>
                                <AdminInventoryEditor
                                  branchId={inventory.branchId}
                                  quantity={inventory.quantity}
                                  safetyStock={inventory.safetyStock}
                                  variant={variant}
                                />
                              </div>
                            )),
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AdminProductStatusAction
                          productId={product.id}
                          status={product.status}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TRPCReactProvider>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="size-5" />
                קופונים
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 overflow-x-auto">
              <TRPCReactProvider>
                <AdminCouponCreateForm />
                <Table className="min-w-[620px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>קוד</TableHead>
                      <TableHead>הטבה</TableHead>
                      <TableHead>שימושים</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalog.coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-medium">
                          {coupon.code}
                        </TableCell>
                        <TableCell>
                          {coupon.percentOff
                            ? `${coupon.percentOff}%`
                            : coupon.amountOff
                              ? formatPrice(coupon.amountOff)
                              : "-"}
                        </TableCell>
                        <TableCell>
                          {coupon.usedCount}
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {coupon.isActive ? "פעיל" : "כבוי"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AdminCouponStatusAction coupon={coupon} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TRPCReactProvider>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                לקוחות
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[620px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>לקוח</TableHead>
                    <TableHead>הזמנות</TableHead>
                    <TableHead>LTV</TableHead>
                    <TableHead>Wishlist</TableHead>
                    <TableHead>כתובות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="grid gap-1">
                          <span>
                            {customer.name
                              ? customer.name
                              : (customer.email ?? "-")}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {customer.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell>
                        {formatPrice(customer.lifetimeValue)}
                      </TableCell>
                      <TableCell>{customer.wishlistItems}</TableCell>
                      <TableCell>{customer.addresses}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlugZap className="size-5" />
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
