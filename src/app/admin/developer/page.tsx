import { Activity, KeyRound, Send, ShieldCheck, Webhook } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createEndpointAction,
  deleteEndpointAction,
  deliverWebhookAction,
  issueApiKeyAction,
  revokeApiKeyAction,
  toggleEndpointAction,
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
import {
  API_SCOPES,
  getApiSummary,
  listApiKeys,
  listApiRequests,
} from "~/server/services/api-keys";
import {
  getWebhookSummary,
  listDeliveries,
  listEndpoints,
} from "~/server/services/webhook-delivery";

export const metadata = {
  title: "מפתחים | Admin",
};

export const dynamic = "force-dynamic";

const deliveryVariant: Record<string, "secondary" | "outline" | "destructive"> = {
  SENT: "secondary",
  PENDING: "outline",
  FAILED: "destructive",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDeveloperPage({ searchParams }: PageProps) {
  const access = await getAdminPageAccess("SYSTEM_CONFIG", "/admin/developer");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const apiSummary = await getApiSummary().catch(() => null);

  if (!apiSummary) return <AdminDatabaseFallback />;

  const query = await searchParams;
  const newKey = typeof query.newKey === "string" ? query.newKey : null;
  const newSecret = typeof query.newSecret === "string" ? query.newSecret : null;

  const [keys, requests, webhookSummary, endpoints, deliveries] =
    await Promise.all([
      listApiKeys().catch(() => []),
      listApiRequests().catch(() => []),
      getWebhookSummary().catch(() => null),
      listEndpoints().catch(() => []),
      listDeliveries().catch(() => []),
    ]);

  return (
    <AdminShell
      active="developer"
      admin={access.admin}
      description="פלטפורמת אינטגרציה: מפתחות API עם הרשאות ותקרות, יעדי webhook חתומים ויומן שימוש."
      title="מפתחים ו-API"
    >
      {newKey || newSecret ? (
        <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck aria-hidden="true" className="size-4" />
            {newKey ? "מפתח ה-API נוצר — העתק עכשיו, לא יוצג שוב:" : "סוד היעד נוצר — העתק עכשיו:"}
          </p>
          <code className="mt-2 block overflow-x-auto rounded bg-background/60 px-3 py-2 text-sm" dir="ltr">
            {newKey ?? newSecret}
          </code>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${apiSummary.active} פעילים`}
          icon={KeyRound}
          label="מפתחות API"
          value={String(apiSummary.total)}
        />
        <MetricCard
          detail={`${apiSummary.errors} שגיאות`}
          icon={Activity}
          label="קריאות API"
          value={String(apiSummary.requests)}
        />
        <MetricCard
          detail={`${webhookSummary?.active ?? 0} פעילים`}
          icon={Webhook}
          label="יעדי Webhook"
          value={String(webhookSummary?.endpoints ?? 0)}
        />
        <MetricCard
          detail={`${webhookSummary?.pending ?? 0} ממתינים`}
          icon={Send}
          label="משלוחים שנכשלו"
          value={String(webhookSummary?.failed ?? 0)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound aria-hidden="true" className="size-5" />
            מפתחות API
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={issueApiKeyAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              הנפקת מפתח עם הרשאות מוגבלות ותקרת קצב. הסוד יוצג פעם אחת בלבד.
            </p>
            <Input name="name" placeholder="שם המפתח (אינטגרציית X)" required />
            <fieldset className="grid grid-cols-2 gap-1.5 rounded-md border p-3">
              <legend className="text-muted-foreground px-1 text-xs">הרשאות</legend>
              {API_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-2 text-xs">
                  <input name="scope" type="checkbox" value={scope} />
                  {scope}
                </label>
              ))}
            </fieldset>
            <div className="grid grid-cols-2 gap-2">
              <Input
                defaultValue="120"
                min="1"
                name="rateLimitPerMin"
                placeholder="קצב/דקה"
                type="number"
              />
              <Input aria-label="תפוגה" name="expiresAt" type="date" />
            </div>
            <Button className="w-fit" size="sm" type="submit">
              הנפק מפתח
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מפתח</TableHead>
                <TableHead>הרשאות</TableHead>
                <TableHead>קצב</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הונפקו מפתחות."
                  icon={KeyRound}
                  title="אין מפתחות"
                />
              ) : (
                keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{key.name}</div>
                      <code className="text-muted-foreground text-xs" dir="ltr">
                        {key.masked}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[12rem] text-xs">
                      {key.scopes.join(", ")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {key.rateLimitPerMin}/דק׳
                      <div>
                        <Badge
                          variant={
                            key.expired
                              ? "destructive"
                              : key.isActive
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {key.expired ? "פג" : key.isActive ? "פעיל" : "בוטל"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {key.isActive ? (
                        <form action={revokeApiKeyAction}>
                          <input name="apiKeyId" type="hidden" value={key.id} />
                          <Button size="sm" type="submit" variant="ghost">
                            בטל
                          </Button>
                        </form>
                      ) : null}
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
            <Webhook aria-hidden="true" className="size-5" />
            יעדי Webhook יוצאים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={createEndpointAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              משלוחים נחתמים ב-HMAC-SHA256 (כותרת x-elysia-signature) ואידמפוטנטיים.
            </p>
            <Input name="name" placeholder="שם היעד" required />
            <Input dir="ltr" name="url" placeholder="https://example.com/hook" required />
            <Input
              name="events"
              placeholder="אירועים (order.paid, * הכל) מופרד בפסיק"
            />
            <Button className="w-fit" size="sm" type="submit">
              הוסף יעד
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>יעד</TableHead>
                <TableHead>אירועים</TableHead>
                <TableHead>סוד</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו יעדים."
                  icon={Webhook}
                  title="אין יעדים"
                />
              ) : (
                endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{endpoint.name}</div>
                      <code
                        className="text-muted-foreground block max-w-[14rem] truncate text-xs"
                        dir="ltr"
                      >
                        {endpoint.url}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[8rem] text-xs">
                      {endpoint.events.join(", ")}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs" dir="ltr">
                        {endpoint.maskedSecret}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <form action={toggleEndpointAction}>
                          <input name="endpointId" type="hidden" value={endpoint.id} />
                          <input
                            name="isActive"
                            type="hidden"
                            value={endpoint.isActive ? "0" : "1"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {endpoint.isActive ? "השבת" : "הפעל"}
                          </Button>
                        </form>
                        <form action={deleteEndpointAction}>
                          <input name="endpointId" type="hidden" value={endpoint.id} />
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send aria-hidden="true" className="size-5" />
              משלוחים אחרונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>יעד</TableHead>
                  <TableHead>אירוע</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="טרם בוצעו משלוחים."
                    icon={Send}
                    title="אין משלוחים"
                  />
                ) : (
                  deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="max-w-[8rem] truncate text-sm">
                        {delivery.endpointName}
                      </TableCell>
                      <TableCell className="text-xs">{delivery.event}</TableCell>
                      <TableCell>
                        <Badge variant={deliveryVariant[delivery.status] ?? "outline"}>
                          {delivery.status}
                          {delivery.responseStatus
                            ? ` ${delivery.responseStatus}`
                            : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {delivery.status !== "SENT" ? (
                          <form action={deliverWebhookAction}>
                            <input
                              name="deliveryId"
                              type="hidden"
                              value={delivery.id}
                            />
                            <Button size="sm" type="submit" variant="outline">
                              שלח
                            </Button>
                          </form>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity aria-hidden="true" className="size-5" />
              יומן קריאות API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>נתיב</TableHead>
                  <TableHead>מפתח</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableEmptyRow
                    colSpan={3}
                    description="טרם נרשמו קריאות."
                    icon={Activity}
                    title="אין קריאות"
                  />
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="text-xs" dir="ltr">
                        {request.method} {request.path}
                      </TableCell>
                      <TableCell className="max-w-[8rem] truncate text-xs">
                        {request.keyName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={request.status >= 400 ? "destructive" : "secondary"}
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
