import { Bell, Send } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { AdminTableScrollHint } from "../_components/admin-table-tools";
import { getAdminPageAccess } from "../_lib/access";
import { enqueuePushCampaignAction } from "./actions";
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
import { isPushConfigured, listPushCampaigns } from "~/server/services/push";

export const metadata = {
  title: "Push Notifications | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const access = await getAdminPageAccess("SYSTEM_CONFIG");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const campaigns = await listPushCampaigns().catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load push campaigns", error);
    }

    return null;
  });

  if (!campaigns) return <AdminDatabaseFallback />;

  const configured = isPushConfigured();

  return (
    <AdminShell
      active="notifications"
      admin={access.admin}
      description="ניהול Push opt-in, קמפיינים שיווקיים, ושליחה דרך outbox עם מעקב delivery."
      title="Push והתראות"
    >
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
            <AdminPushCampaignForm />
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
