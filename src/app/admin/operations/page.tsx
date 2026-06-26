import { Building, Laptop, LifeBuoy } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createAssetAction,
  createFacilityRequestAction,
  createTicketAction,
  setAssetStatusAction,
  setFacilityStatusAction,
  setTicketStatusAction,
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
import {
  getFacilitySummary,
  listFacilityRequests,
} from "~/server/services/facilities";
import {
  getAssetSummary,
  getTicketSummary,
  listAssets,
  listTickets,
} from "~/server/services/it-service";

export const metadata = {
  title: "תפעול | Admin",
};

export const dynamic = "force-dynamic";

const priorityLabel: Record<string, string> = {
  LOW: "נמוכה",
  MEDIUM: "בינונית",
  HIGH: "גבוהה",
  URGENT: "דחוף",
};

const ticketStatusLabel: Record<string, string> = {
  OPEN: "פתוח",
  IN_PROGRESS: "בטיפול",
  RESOLVED: "טופל",
  CLOSED: "סגור",
};

const assetStatusLabel: Record<string, string> = {
  IN_USE: "בשימוש",
  IN_STORAGE: "במחסן",
  RETIRED: "הוצא",
};

const facilityStatusLabel: Record<string, string> = {
  OPEN: "פתוח",
  SCHEDULED: "מתוזמן",
  DONE: "בוצע",
  CANCELLED: "בוטל",
};

export default async function AdminOperationsPage() {
  const access = await getAdminPageAccess("ERP_READ", "/admin/operations");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const [tickets, ticketSummary, assets, assetSummary, facilities, facilitySummary] =
    await Promise.all([
      listTickets().catch(() => null),
      getTicketSummary().catch(() => null),
      listAssets().catch(() => []),
      getAssetSummary().catch(() => null),
      listFacilityRequests().catch(() => []),
      getFacilitySummary().catch(() => null),
    ]);

  if (!tickets) return <AdminDatabaseFallback />;

  return (
    <AdminShell
      active="operations"
      admin={access.admin}
      description="תפעול פנימי: Help Desk IT, מרשם נכסי IT, ובקשות תחזוקה לסניפים."
      title="תפעול"
    >
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <LifeBuoy aria-hidden="true" className="size-5" />
              Help Desk IT
            </span>
            {ticketSummary ? (
              <span className="text-muted-foreground text-sm font-normal">
                {ticketSummary.open} פתוחות · {ticketSummary.urgentOpen} דחופות
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createTicketAction} className="grid gap-3">
            <Input name="title" placeholder="נושא הפנייה" required />
            <div className="grid grid-cols-2 gap-2">
              <Input name="category" placeholder="קטגוריה" />
              <select
                aria-label="עדיפות"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="MEDIUM"
                name="priority"
              >
                <option value="LOW">נמוכה</option>
                <option value="MEDIUM">בינונית</option>
                <option value="HIGH">גבוהה</option>
                <option value="URGENT">דחוף</option>
              </select>
            </div>
            <Button className="w-fit" type="submit">
              פתח פנייה
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מס׳</TableHead>
                <TableHead>נושא</TableHead>
                <TableHead>עדיפות</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  description="אין פניות פתוחות."
                  icon={LifeBuoy}
                  title="אין פניות"
                />
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">
                      {ticket.ticketNumber}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-sm">
                      {ticket.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ticket.priority === "URGENT" ||
                          ticket.priority === "HIGH"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {priorityLabel[ticket.priority] ?? ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ticketStatusLabel[ticket.status] ?? ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.status === "OPEN" ||
                      ticket.status === "IN_PROGRESS" ? (
                        <form action={setTicketStatusAction}>
                          <input
                            name="ticketId"
                            type="hidden"
                            value={ticket.id}
                          />
                          <input name="status" type="hidden" value="RESOLVED" />
                          <Button size="sm" type="submit" variant="ghost">
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
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Laptop aria-hidden="true" className="size-5" />
              נכסי IT
            </span>
            {assetSummary ? (
              <span className="text-muted-foreground text-sm font-normal">
                {assetSummary.inUse} בשימוש · {assetSummary.inStorage} במחסן
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createAssetAction} className="grid gap-3">
            <Input name="name" placeholder="שם הנכס" required />
            <Input name="category" placeholder="קטגוריה (מחשב/טלפון…)" />
            <Input name="serialNumber" placeholder="מספר סידורי" />
            <Input name="assignedTo" placeholder="משויך ל…" />
            <Button className="w-fit" type="submit">
              רשום נכס
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תג</TableHead>
                <TableHead>שם</TableHead>
                <TableHead>משויך</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  description="טרם נרשמו נכסי IT."
                  icon={Laptop}
                  title="אין נכסים"
                />
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-mono text-xs">
                      {asset.assetTag}
                    </TableCell>
                    <TableCell className="text-sm">{asset.name}</TableCell>
                    <TableCell className="text-sm">
                      {asset.assignedTo ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          asset.status === "IN_USE" ? "secondary" : "outline"
                        }
                      >
                        {assetStatusLabel[asset.status] ?? asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.status !== "RETIRED" ? (
                        <form action={setAssetStatusAction}>
                          <input
                            name="assetId"
                            type="hidden"
                            value={asset.id}
                          />
                          <input name="status" type="hidden" value="RETIRED" />
                          <Button size="sm" type="submit" variant="ghost">
                            הוצא
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
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Building aria-hidden="true" className="size-5" />
              תחזוקת סניפים (Facilities)
            </span>
            {facilitySummary ? (
              <span className="text-muted-foreground text-sm font-normal">
                {facilitySummary.open} פתוחות · {facilitySummary.scheduled}{" "}
                מתוזמנות
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createFacilityRequestAction} className="grid gap-3">
            <Input name="title" placeholder="נושא הבקשה" required />
            <div className="grid grid-cols-2 gap-2">
              <Input name="category" placeholder="תחזוקה/ניקיון/ציוד" />
              <select
                aria-label="עדיפות"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="MEDIUM"
                name="priority"
              >
                <option value="LOW">נמוכה</option>
                <option value="MEDIUM">בינונית</option>
                <option value="HIGH">גבוהה</option>
              </select>
            </div>
            <Input name="notes" placeholder="הערות (רשות)" />
            <Button className="w-fit" type="submit">
              פתח בקשה
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מס׳</TableHead>
                <TableHead>נושא</TableHead>
                <TableHead>עדיפות</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  description="אין בקשות תחזוקה."
                  icon={Building}
                  title="אין בקשות"
                />
              ) : (
                facilities.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-xs">
                      {request.requestNumber}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-sm">
                      {request.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          request.priority === "HIGH" ? "destructive" : "outline"
                        }
                      >
                        {priorityLabel[request.priority] ?? request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {facilityStatusLabel[request.status] ?? request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === "OPEN" ||
                      request.status === "SCHEDULED" ? (
                        <form action={setFacilityStatusAction}>
                          <input
                            name="requestId"
                            type="hidden"
                            value={request.id}
                          />
                          <input name="status" type="hidden" value="DONE" />
                          <Button size="sm" type="submit" variant="ghost">
                            סמן בוצע
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
    </AdminShell>
  );
}
