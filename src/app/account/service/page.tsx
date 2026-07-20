import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Headset } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { StatusMessage } from "~/components/ui/status-message";
import { formatHebrewDateTime } from "~/lib/format";
import { getServiceRequestStatusLabel } from "~/lib/service-validation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  getCustomerServiceRequests,
  type CustomerServiceRequestTimelineEntry,
} from "~/server/services/service-case-timeline";

export const metadata = {
  title: "פניות השירות שלי",
};

export const dynamic = "force-dynamic";

const statusBadgeVariant: Record<string, "secondary" | "outline"> = {
  CLOSED: "outline",
  IN_REVIEW: "secondary",
  NEW: "secondary",
  RESOLVED: "outline",
  WAITING_FOR_CUSTOMER: "secondary",
};

function eventLabel(event: CustomerServiceRequestTimelineEntry) {
  if (event.kind === "RECEIVED") return "הפנייה התקבלה";
  if (event.kind === "STATUS_CHANGED" && event.status) {
    return `סטטוס עודכן ל: ${getServiceRequestStatusLabel(event.status)}`;
  }

  return event.message ?? "עדכון בפנייה";
}

export default async function CustomerServiceRequestsPage() {
  const session = await auth();

  if (!session?.user || session.user.adminUserId) {
    redirect(`/account?callbackUrl=${encodeURIComponent("/account/service")}`);
  }

  const customer = await db.customer.findUnique({
    where: { userId: session.user.id },
  });

  if (!customer) redirect("/account");

  const requests = await getCustomerServiceRequests(customer.id);

  return (
    <main className="elysia-page">
      <SiteHeader />
      <CompactPageIntro
        description="מעקב אחר הפניות שפתחת מול צוות השירות שלנו, כולל סטטוס עדכני."
        eyebrow="אזור אישי"
        title="פניות השירות שלי"
        variant="checkout"
      />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Button asChild className="mb-6 gap-2" variant="ghost">
          <Link href="/account">
            <ArrowRight aria-hidden="true" className="size-4" />
            אזור אישי
          </Link>
        </Button>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headset aria-hidden="true" className="size-5" />
              פניות שירות
            </CardTitle>
          </CardHeader>
          <CardContent
            className="grid gap-4"
            data-testid="account-service-requests"
          >
            {requests.length === 0 ? (
              <StatusMessage tone="neutral">
                עדיין לא פתחת פנייה מחוברת לחשבון. פנייה חדשה תופיע כאן אחרי
                שליחה בזמן שאת/ה מחובר/ת.
              </StatusMessage>
            ) : (
              requests.map((request) => (
                <div
                  className="glass-inset rounded-md border p-4"
                  data-testid="account-service-request-card"
                  key={request.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{request.topicLabel}</p>
                      <p className="text-muted-foreground text-xs">
                        נפתחה ב-{formatHebrewDateTime(request.createdAt)}
                        {request.orderNumber
                          ? ` · הזמנה ${request.orderNumber}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant={statusBadgeVariant[request.status] ?? "outline"}>
                      {getServiceRequestStatusLabel(request.status)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm leading-6 whitespace-pre-wrap">
                    {request.message}
                  </p>
                  {request.events.length > 0 ? (
                    <ol
                      className="mt-4 grid gap-2 border-t pt-3"
                      data-testid="account-service-request-timeline"
                    >
                      {request.events.map((event) => (
                        <li
                          className="text-muted-foreground flex items-center gap-2 text-xs"
                          key={event.id}
                        >
                          <CheckCircle2
                            aria-hidden="true"
                            className="text-foreground size-3.5"
                          />
                          <span>{eventLabel(event)}</span>
                          <span>· {formatHebrewDateTime(event.createdAt)}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
