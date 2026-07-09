import { Bell, Send, ShieldAlert } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { AdminTableScrollHint } from "../_components/admin-table-tools";
import { getAdminPageAccess } from "../_lib/access";
import {
  acknowledgeOperationalAlertAction,
  enqueuePushCampaignAction,
} from "./actions";
import { AdminPushCampaignForm } from "./admin-push-campaign-form";
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
import { TableEmptyRow } from "~/components/ui/table-empty-row";
import { formatOptionalHebrewDateTime } from "~/lib/format";
import { getOperationalAlertsOverview } from "~/server/services/operational-alerts";
import {
  getPushCampaignAudienceSummary,
  isPushConfigured,
  listPushCampaigns,
} from "~/server/services/push";

export const metadata = {
  title: "Push Notifications | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const access = await getAdminPageAccess(
    "SYSTEM_CONFIG",
    "/admin/notifications",
  );

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const [campaigns, audienceSummary, alertsOverview] = await Promise.all([
    listPushCampaigns(),
    getPushCampaignAudienceSummary(),
    getOperationalAlertsOverview(),
  ]).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load push campaigns", error);
    }

    return [null, null, null] as const;
  });

  if (!campaigns || !audienceSummary || !alertsOverview) {
    return <AdminDatabaseFallback />;
  }

  const configured = isPushConfigured();

  return (
    <AdminShell
      active="notifications"
      admin={access.admin}
      description="ניהול Push opt-in, קמפיינים שיווקיים, ושליחה דרך outbox עם מעקב delivery."
      title="Push והתראות"
    >
      <Card className="mb-6 rounded-md" data-testid="admin-operational-alerts">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <ShieldAlert aria-hidden="true" className="size-5" />
              התראות תפעוליות
            </span>
            <span className="flex items-center gap-2">
              <Badge
                variant={alertsOverview.openP0 > 0 ? "destructive" : "secondary"}
              >
                P0 פתוחות: {alertsOverview.openP0}
              </Badge>
              <Badge variant="outline">פתוחות: {alertsOverview.open}</Badge>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm leading-6">
            הפרות אינווריאנטים עסקיים (ADR 0007): אישור צפייה משתיק הסלמה;
            ההתראה נסגרת רק כשההפרה חדלה בפועל. סריקה אחרונה:{" "}
            {formatOptionalHebrewDateTime(alertsOverview.lastSweepAt)}
          </p>
          <AdminTableScrollHint />
          <Table className="min-w-[840px]">
            <TableHeader>
              <TableRow>
                <TableHead>חומרה</TableHead>
                <TableHead>מחלקה</TableHead>
                <TableHead>הפרה</TableHead>
                <TableHead>מופעים</TableHead>
                <TableHead>נראתה לאחרונה</TableHead>
                <TableHead>פעולה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertsOverview.alerts.length === 0 ? (
                <TableEmptyRow
                  colSpan={6}
                  description="אין הפרות אינווריאנטים פעילות."
                  icon={ShieldAlert}
                  title="אין התראות פתוחות"
                />
              ) : (
                alertsOverview.alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Badge
                        variant={
                          alert.severity === "P0" ? "destructive" : "secondary"
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.class}</TableCell>
                    <TableCell className="max-w-[320px]">
                      <p className="font-medium">{alert.invariant}</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-5">
                        {alert.message}
                      </p>
                    </TableCell>
                    <TableCell>{alert.occurrenceCount}</TableCell>
                    <TableCell>
                      {formatOptionalHebrewDateTime(alert.lastSeenAt)}
                    </TableCell>
                    <TableCell>
                      {alert.status === "OPEN" ? (
                        <form action={acknowledgeOperationalAlertAction}>
                          <input
                            name="alertId"
                            type="hidden"
                            value={alert.id}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            אישור צפייה
                          </Button>
                        </form>
                      ) : (
                        <Badge variant="outline">נצפתה</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Bell aria-hidden="true" className="size-5" />
                קמפיין חדש
              </span>
              <Badge variant={configured ? "secondary" : "outline"}>
                {configured ? "configured" : "missing VAPID"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="mb-4 rounded-md border border-[var(--glass-border)] p-3 text-sm"
              data-testid="admin-notification-readiness"
            >
              <p className="font-medium">
                {configured
                  ? "התראות Push מוכנות לשליחה"
                  : "שליחת Push אינה פעילה"}
              </p>
              <p className="text-muted-foreground mt-1 leading-6">
                {configured
                  ? "קמפיינים חדשים יכולים להישמר, לתזמן ולהישלח דרך outbox."
                  : "חסרות הגדרות VAPID. אפשר לשמור קמפיין כטיוטה, אבל שליחה מיידית וכפתורי שליחה יישארו כבויים עד שההגדרות יושלמו."}
              </p>
            </div>
            <AdminPushCampaignForm
              audienceSummary={audienceSummary}
              configured={configured}
            />
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send aria-hidden="true" className="size-5" />
              קמפיינים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!configured ? (
              <p
                className="text-muted-foreground mb-3 text-sm leading-6"
                data-testid="admin-notification-send-disabled-copy"
              >
                שליחה כבויה כי מפתחות VAPID אינם מוגדרים. לאחר השלמת ההגדרות
                ניתן להפעיל קמפיינים קיימים מהטבלה.
              </p>
            ) : null}
            <AdminTableScrollHint />
            <Table className="min-w-[840px]">
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>סגמנט</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>שליחות</TableHead>
                  <TableHead>נשלח</TableHead>
                  <TableHead>פעולה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableEmptyRow
                    colSpan={6}
                    description="קמפיינים יופיעו אחרי יצירה או תזמון."
                    icon={Bell}
                    title="אין קמפיינים"
                  />
                ) : (
                  campaigns.map((campaign) => {
                    const sentCount = campaign.deliveries.filter(
                      (delivery) => delivery.status === "SENT",
                    ).length;

                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          {campaign.title}
                        </TableCell>
                        <TableCell>{campaign.segment}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{campaign.status}</Badge>
                          {campaign.lastError ? (
                            <p className="text-muted-foreground mt-1 text-xs leading-5">
                              {campaign.lastError}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {sentCount}/{campaign.deliveries.length}
                        </TableCell>
                        <TableCell>
                          {formatOptionalHebrewDateTime(campaign.sentAt)}
                        </TableCell>
                        <TableCell>
                          <form action={enqueuePushCampaignAction}>
                            <input
                              name="campaignId"
                              type="hidden"
                              value={campaign.id}
                            />
                            <Button
                              disabled={!configured}
                              size="sm"
                              type="submit"
                              variant="outline"
                            >
                              שליחה
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
