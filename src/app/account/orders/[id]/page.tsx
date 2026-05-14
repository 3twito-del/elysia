import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, PackageCheck } from "lucide-react";

import { ReturnRequestForm } from "../../_components/return-request-form";
import { CompactPageIntro } from "~/components/compact-page-intro";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { StatusMessage } from "~/components/ui/status-message";
import {
  getFulfillmentMethodLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getReturnStatusLabel,
  getShipmentStatusLabel,
} from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const [{ id }, session] = await Promise.all([params, auth()]);

  if (!session?.user || session.user.adminUserId) {
    redirect("/account");
  }

  const customer = await db.customer.findUnique({
    where: { userId: session.user.id },
  });

  if (!customer) redirect("/account");

  const order = await db.order.findFirst({
    where: {
      id,
      customerId: customer.id,
    },
    include: {
      branch: true,
      items: true,
      payments: true,
      returns: {
        orderBy: { createdAt: "desc" },
      },
      shipments: true,
    },
  });

  if (!order) notFound();

  const canRequestReturn =
    !["PENDING_PAYMENT", "CANCELLED", "REFUNDED"].includes(order.status) &&
    order.returns.every((request) => request.status === "CANCELLED");

  return (
    <main>
      <SiteHeader />
      <CompactPageIntro
        actions={
          <>
            <Button asChild>
              <Link href="#order-items">פריטי ההזמנה</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#order-support">משלוח והחזרות</Link>
            </Button>
          </>
        }
        description={`${order.recipientName} · ${order.email}`}
        eyebrow="Aphrodite Service"
        metrics={[
          { label: "סטטוס", value: getOrderStatusLabel(order.status) },
          { label: "סכום", value: formatPrice(Number(order.total)) },
          { label: "פריטים", value: String(order.items.length) },
        ]}
        title={order.orderNumber}
      />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Button asChild className="mb-6 gap-2" variant="ghost">
          <Link href="/account">
            <ArrowRight aria-hidden="true" className="size-4" />
            אזור לקוח
          </Link>
        </Button>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-4xl font-semibold">{order.orderNumber}</h2>
            <p className="text-muted-foreground mt-2">
              {order.recipientName} · {order.email}
            </p>
          </div>
          <Badge className="w-fit" variant="secondary">
            {getOrderStatusLabel(order.status)}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="rounded-md" id="order-items">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck aria-hidden="true" className="size-5" />
                פריטים
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {order.items.length === 0 ? (
                <StatusMessage tone="neutral">
                  לא נמצאו פריטים שמורים להזמנה הזו.
                </StatusMessage>
              ) : (
                order.items.map((item) => (
                  <div
                    className="glass-inset flex items-center justify-between rounded-md border p-3"
                    key={item.id}
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.sku}
                      </p>
                    </div>
                    <span>
                      {item.quantity} × {formatPrice(Number(item.unitPrice))}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md" id="order-summary">
            <CardHeader>
              <CardTitle>סיכום</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span>פריטים</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span>הנחה</span>
                <span>{formatPrice(Number(order.discountTotal))}</span>
              </div>
              <div className="flex justify-between">
                <span>משלוח</span>
                <span>{formatPrice(Number(order.shippingTotal))}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>סך הכל</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
              <Separator />
              <p className="text-muted-foreground">
                {order.fulfillmentMethod === "PICKUP"
                  ? `${getFulfillmentMethodLabel(order.fulfillmentMethod)}: ${
                      order.branch?.name ?? "סניף"
                    }`
                  : "משלוח לכתובת שנמסרה"}
              </p>
              <p className="text-muted-foreground">
                תשלום: {getPaymentStatusLabel(order.payments[0]?.status)}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-md lg:col-span-2" id="order-support">
            <CardHeader>
              <CardTitle>משלוח והחזרות</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <div className="grid gap-3">
                <h2 className="font-medium">משלוח</h2>
                {order.shipments.length === 0 ? (
                  <StatusMessage tone="neutral" variant="plain">
                    עדיין אין פרטי משלוח להזמנה.
                  </StatusMessage>
                ) : (
                  order.shipments.map((shipment) => (
                    <div
                      className="glass-inset rounded-md border p-3 text-sm"
                      key={shipment.id}
                    >
                      <Badge className="w-fit" variant="secondary">
                        {getShipmentStatusLabel(shipment.status)}
                      </Badge>
                      <p className="text-muted-foreground">
                        {shipment.provider ?? "משלוח"}{" "}
                        {shipment.tracking ? `· ${shipment.tracking}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="grid gap-3">
                <h2 className="font-medium">החזרות</h2>
                {order.returns.length === 0 ? (
                  <StatusMessage tone="neutral" variant="plain">
                    אין בקשות החזרה להזמנה.
                  </StatusMessage>
                ) : (
                  order.returns.map((request) => (
                    <div
                      className="glass-inset rounded-md border p-3 text-sm"
                      key={request.id}
                    >
                      <Badge className="w-fit" variant="secondary">
                        {getReturnStatusLabel(request.status)}
                      </Badge>
                      <p className="text-muted-foreground">{request.reason}</p>
                    </div>
                  ))
                )}
                {canRequestReturn ? (
                  <>
                    <Separator />
                    <ReturnRequestForm orderId={order.id} />
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
