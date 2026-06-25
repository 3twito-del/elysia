import Link from "next/link";
import {
  AlertTriangle,
  ContactRound,
  FileText,
  Heart,
  ListTodo,
  Award,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  activateJourneyAction,
  addJourneyStepAction,
  archiveJourneyAction,
  convertLeadAction,
  convertQuoteToInvoiceAction,
  createJourneyAction,
  createLeadAction,
  createQuoteAction,
  decideQuoteAction,
  enrollJourneySegmentAction,
  applyLoyaltyAction,
  recomputeSegmentsAction,
  recordConsentAction,
  runJourneyTickAction,
  sendQuoteAction,
  setOpportunityStageAction,
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
import { Textarea } from "~/components/ui/textarea";
import {
  formatHebrewDate,
  formatHebrewDateTime,
  formatPrice,
} from "~/lib/format";
import { getCrmOverview } from "~/server/services/crm";
import {
  listJourneys,
  listSegmentsForSelect,
} from "~/server/services/crm-journeys";
import { listRecentQuotes } from "~/server/services/crm-quotes";
import { listRecentConsentRecords } from "~/server/services/consent";
import {
  getLoyaltySummary,
  listLoyaltyAccounts,
} from "~/server/services/loyalty";
import {
  getSalesPipelineOverview,
  listOpportunities,
  listRecentLeads,
} from "~/server/services/crm-sales";

export const metadata = {
  title: "CRM | Admin",
};

export const dynamic = "force-dynamic";

const stageLabel: Record<string, string> = {
  QUALIFIED: "מוסמך",
  PROPOSAL: "הצעה",
  NEGOTIATION: "משא ומתן",
  WON: "נסגר בהצלחה",
  LOST: "אבד",
};

const journeyStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  ACTIVE: "פעיל",
  ARCHIVED: "בארכיון",
};

const journeyStatusVariant: Record<
  string,
  "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  ACTIVE: "secondary",
  ARCHIVED: "destructive",
};

const journeyActionLabel: Record<string, string> = {
  send_email: 'דוא"ל',
  add_tag: "תיוג",
  wait: "המתנה",
};

const consentChannelLabel: Record<string, string> = {
  EMAIL: 'דוא"ל',
  SMS: "SMS",
  PUSH: "Push",
  WHATSAPP: "WhatsApp",
};

const loyaltyTierLabel: Record<string, string> = {
  BRONZE: "ארד",
  SILVER: "כסף",
  GOLD: "זהב",
  PLATINUM: "פלטינה",
};

const quoteStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  SENT: "נשלחה",
  ACCEPTED: "אושרה",
  DECLINED: "נדחתה",
  EXPIRED: "פגה",
};

const quoteStatusVariant: Record<
  string,
  "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  SENT: "outline",
  ACCEPTED: "secondary",
  DECLINED: "destructive",
  EXPIRED: "destructive",
};

export default async function AdminCrmPage() {
  const access = await getAdminPageAccess("CRM_READ", "/admin/crm");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const crm = await getCrmOverview({ adminUserId: access.admin.id }).catch(
    (error: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[admin] failed to load CRM", error);
      }

      return null;
    },
  );

  if (!crm) return <AdminDatabaseFallback />;

  const pipeline = await getSalesPipelineOverview().catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load sales pipeline", error);
    }

    return null;
  });

  const [
    leads,
    opportunities,
    quotes,
    journeys,
    journeySegments,
    consentRecords,
    loyaltyAccounts,
    loyaltySummary,
  ] = await Promise.all([
    listRecentLeads().catch(() => []),
    listOpportunities().catch(() => []),
    listRecentQuotes().catch(() => []),
    listJourneys().catch(() => []),
    listSegmentsForSelect().catch(() => []),
    listRecentConsentRecords().catch(() => []),
    listLoyaltyAccounts().catch(() => []),
    getLoyaltySummary().catch(() => null),
  ]);

  return (
    <AdminShell
      active="crm"
      admin={access.admin}
      description="CRM 360 מותאם ל־Elysia: סגמנטים, לקוחות בסיכון, VIP, Wishlist, עגלות ומשימות follow-up."
      title="CRM"
    >
      <p className="text-muted-foreground mb-4 text-sm">
        צפייה ב־CRM נרשמת ל־AuditLog. עודכן{" "}
        <time dateTime={crm.freshness.generatedAt.toISOString()}>
          {formatHebrewDateTime(crm.freshness.generatedAt)}
        </time>
        .
      </p>

      <form action={recomputeSegmentsAction} className="mb-4">
        <Button size="sm" type="submit" variant="outline">
          חשב סגמנטים דינמיים מחדש
        </Button>
      </form>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${crm.counts.segments} סגמנטים פעילים`}
          icon={Users}
          label="לקוחות"
          value={String(crm.counts.customers)}
        />
        <MetricCard
          detail={`${crm.counts.overdueTasks} באיחור`}
          icon={ListTodo}
          label="משימות פתוחות"
          value={String(crm.counts.openTasks)}
        />
        <MetricCard
          detail={`${crm.counts.activeCarts} עגלות פעילות`}
          icon={Heart}
          label="Wishlist"
          value={String(crm.counts.wishlistCustomers)}
        />
        <MetricCard
          detail={`${crm.counts.openServiceRequests} פניות שירות`}
          icon={AlertTriangle}
          label="לקוחות בסיכון"
          value={String(crm.counts.atRisk)}
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`ממוצע ${formatPrice(crm.kpis.averageLifetimeValue)}`}
          icon={Users}
          label="LTV מצטבר"
          value={formatPrice(crm.kpis.totalLifetimeValue)}
        />
        <MetricCard
          detail="ערך הזמנה ממוצע"
          icon={ShoppingBag}
          label="AOV"
          value={formatPrice(crm.kpis.averageOrderValue)}
        />
        <MetricCard
          detail={`${crm.kpis.customersWithOrders} לקוחות רוכשים`}
          icon={Repeat}
          label="רכישה חוזרת"
          value={`${crm.kpis.repeatPurchaseRate}%`}
        />
        <MetricCard
          detail={`${crm.counts.overdueTasks} משימות באיחור`}
          icon={ListTodo}
          label="משימות פתוחות"
          value={String(crm.counts.openTasks)}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <CustomerListCard title="VIP" customers={crm.vipCustomers} />
        <CustomerListCard
          title="כוונת רכישה גבוהה"
          customers={crm.highIntentCustomers}
        />
        <CustomerListCard
          title="לקוחות בסיכון נטישה"
          customers={crm.atRiskCustomers}
        />
        <CustomerListCard
          title="לקוחות רדומים"
          customers={crm.dormantCustomers}
        />
      </div>

      {pipeline ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp aria-hidden="true" className="size-5" />
                צבר מכירות (Pipeline)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">הזדמנויות פתוחות</span>
                <span className="font-medium">
                  {pipeline.openOpportunities}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">שווי פתוח</span>
                <span className="font-medium">
                  {formatPrice(pipeline.totalOpenValue)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">תחזית משוקללת</span>
                <Badge variant="secondary">
                  {formatPrice(pipeline.weightedValue)}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Win rate</span>
                <span className="font-medium">{pipeline.winRate}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>לפי שלב</CardTitle>
            </CardHeader>
            <CardContent>
              <Table className="min-w-[420px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>שלב</TableHead>
                    <TableHead>הזדמנויות</TableHead>
                    <TableHead>שווי</TableHead>
                    <TableHead>משוקלל</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pipeline.byStage.length === 0 ? (
                    <TableEmptyRow
                      colSpan={4}
                      description="הזדמנויות יופיעו לאחר המרת לידים להזדמנויות."
                      icon={TrendingUp}
                      title="אין הזדמנויות פתוחות"
                    />
                  ) : (
                    pipeline.byStage.map((row) => (
                      <TableRow key={row.stage}>
                        <TableCell className="font-medium">
                          {stageLabel[row.stage] ?? row.stage}
                        </TableCell>
                        <TableCell>{row.count}</TableCell>
                        <TableCell>{formatPrice(row.amount)}</TableCell>
                        <TableCell>{formatPrice(row.weighted)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ContactRound aria-hidden="true" className="size-5" />
              לידים
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form
              action={createLeadAction}
              className="grid gap-2 sm:grid-cols-2"
            >
              <Input name="name" placeholder="שם הליד" required />
              <Input
                dir="ltr"
                inputMode="tel"
                name="phone"
                placeholder="טלפון"
              />
              <Input dir="ltr" name="email" placeholder="אימייל" type="email" />
              <Input name="source" placeholder="מקור (web/referral)" />
              <Textarea
                className="sm:col-span-2"
                name="notes"
                placeholder="הערות"
              />
              <Button className="sm:col-span-2" type="submit">
                צור ליד
              </Button>
            </form>

            <div className="grid gap-2">
              {leads.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  אין לידים פתוחים.
                </p>
              ) : (
                leads.map((lead) => (
                  <form
                    action={convertLeadAction}
                    className="grid gap-2 rounded-md border p-3"
                    key={lead.id}
                  >
                    <input name="leadId" type="hidden" value={lead.id} />
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{lead.name}</span>
                      <Badge variant="outline">{lead.source}</Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {lead.email ?? lead.phone ?? "—"}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-[1fr_110px_auto]">
                      <Input
                        defaultValue={`הזדמנות — ${lead.name}`}
                        name="title"
                        placeholder="כותרת הזדמנות"
                      />
                      <Input
                        inputMode="numeric"
                        name="amount"
                        placeholder="סכום"
                      />
                      <Button size="sm" type="submit">
                        המר
                      </Button>
                    </div>
                  </form>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp aria-hidden="true" className="size-5" />
              הזדמנויות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>שלב</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>עדכון שלב</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="המר לידים כדי לפתוח הזדמנויות."
                    icon={TrendingUp}
                    title="אין הזדמנויות"
                  />
                ) : (
                  opportunities.map((opportunity) => (
                    <TableRow key={opportunity.id}>
                      <TableCell className="font-medium">
                        {opportunity.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            opportunity.status === "WON"
                              ? "secondary"
                              : opportunity.status === "LOST"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {stageLabel[opportunity.stage] ?? opportunity.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(opportunity.amount)}</TableCell>
                      <TableCell>
                        <form
                          action={setOpportunityStageAction}
                          className="flex gap-2"
                        >
                          <input
                            name="opportunityId"
                            type="hidden"
                            value={opportunity.id}
                          />
                          <select
                            aria-label="עדכון שלב הזדמנות"
                            autoComplete="off"
                            className="glass-control h-9 rounded-md border px-2 text-sm"
                            defaultValue={opportunity.stage}
                            name="stage"
                          >
                            {[
                              "QUALIFIED",
                              "PROPOSAL",
                              "NEGOTIATION",
                              "WON",
                              "LOST",
                            ].map((stage) => (
                              <option key={stage} value={stage}>
                                {stageLabel[stage] ?? stage}
                              </option>
                            ))}
                          </select>
                          <Button size="sm" type="submit">
                            עדכן
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText aria-hidden="true" className="size-5" />
            הצעות מחיר
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={createQuoteAction} className="grid gap-2">
            <Textarea
              name="lines"
              placeholder="שורה לכל פריט: תיאור | כמות | מחיר"
              rows={3}
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
              <Input name="customerId" placeholder="מזהה לקוח (אופציונלי)" />
              <Input aria-label="בתוקף עד" name="validUntil" type="date" />
              <Button type="submit">צור הצעה</Button>
            </div>
          </form>

          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>הצעה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>בתוקף עד</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  description="הצעות שתיצרו יופיעו כאן לשליחה, אישור והמרה לחשבונית."
                  icon={FileText}
                  title="אין הצעות מחיר"
                />
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      {quote.quoteNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={quoteStatusVariant[quote.status] ?? "outline"}
                      >
                        {quoteStatusLabel[quote.status] ?? quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(quote.total)}</TableCell>
                    <TableCell>
                      {quote.validUntil
                        ? formatHebrewDate(quote.validUntil)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <form action={sendQuoteAction}>
                          <input name="quoteId" type="hidden" value={quote.id} />
                          <Button size="sm" type="submit" variant="outline">
                            שלח
                          </Button>
                        </form>
                        <form action={decideQuoteAction}>
                          <input name="quoteId" type="hidden" value={quote.id} />
                          <input
                            name="decision"
                            type="hidden"
                            value="ACCEPTED"
                          />
                          <Button size="sm" type="submit" variant="outline">
                            אישור
                          </Button>
                        </form>
                        <form action={decideQuoteAction}>
                          <input name="quoteId" type="hidden" value={quote.id} />
                          <input
                            name="decision"
                            type="hidden"
                            value="DECLINED"
                          />
                          <Button size="sm" type="submit" variant="outline">
                            דחייה
                          </Button>
                        </form>
                        <form action={convertQuoteToInvoiceAction}>
                          <input name="quoteId" type="hidden" value={quote.id} />
                          <Button size="sm" type="submit">
                            ← חשבונית
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ContactRound aria-hidden="true" className="size-5" />
              סגמנטים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>חברים</TableHead>
                  <TableHead>תיאור</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crm.segments.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="סגמנטים יופיעו אחרי seed או אוטומציה."
                    icon={ContactRound}
                    title="אין סגמנטים"
                  />
                ) : (
                  crm.segments.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell className="font-medium">
                        {segment.name}
                        <span className="text-muted-foreground block text-xs">
                          {segment.key}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {segment.isSystem ? "System" : "Custom"}
                        </Badge>
                      </TableCell>
                      <TableCell>{segment.members}</TableCell>
                      <TableCell>{segment.description ?? "-"}</TableCell>
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
              <ListTodo aria-hidden="true" className="size-5" />
              הערות אחרונות
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {crm.recentNotes.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                אין עדיין הערות לקוח.
              </p>
            ) : (
              crm.recentNotes.map((note) => (
                <div className="rounded-md border p-3" key={note.id}>
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/admin/customers/${note.customerId}`}
                    >
                      {note.customerName}
                    </Link>
                    <Badge variant="outline">{note.adminName}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Workflow aria-hidden="true" className="size-5" />
              מסעות לקוח / אוטומציה (Journeys)
            </span>
            <form action={runJourneyTickAction}>
              <Button size="sm" type="submit" variant="outline">
                הרץ tick
              </Button>
            </form>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createJourneyAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              מסע רב-שלבי: רישום נמענים מסגמנט, והרצה צעד-אחר-צעד עם השהיות. כל
              tick מקדם נמענים בשלים בצעד אחד.
            </p>
            <Input name="key" placeholder="מפתח ייחודי (welcome-flow)" required />
            <Input name="name" placeholder="שם המסע" required />
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="jr-segment">
                סגמנט מפעיל (רשות)
              </label>
              <select
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                id="jr-segment"
                name="segmentId"
              >
                <option value="">ללא (ידני)</option>
                {journeySegments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name}
                  </option>
                ))}
              </select>
            </div>
            <Input name="description" placeholder="תיאור (רשות)" />
            <Button className="w-fit" type="submit">
              צור מסע
            </Button>
          </form>

          <div className="grid gap-3">
            {journeys.length === 0 ? (
              <p className="text-muted-foreground text-sm">עדיין אין מסעות.</p>
            ) : (
              journeys.map((journey) => (
                <div className="rounded-md border p-3" key={journey.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {journey.name}{" "}
                      <span className="text-muted-foreground font-mono text-xs">
                        ({journey.key})
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          journeyStatusVariant[journey.status] ?? "outline"
                        }
                      >
                        {journeyStatusLabel[journey.status] ?? journey.status}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {journey.activeEnrollmentCount}/{journey.enrollmentCount}{" "}
                        פעילים
                      </span>
                    </div>
                  </div>

                  <div className="text-muted-foreground mt-2 flex flex-wrap gap-1.5 text-xs">
                    {journey.segmentName ? (
                      <Badge variant="outline">סגמנט: {journey.segmentName}</Badge>
                    ) : null}
                    {journey.steps.map((step) => (
                      <Badge key={step.id} variant="outline">
                        {step.stepOrder}.{" "}
                        {journeyActionLabel[step.actionType] ?? step.actionType}
                        {step.delayHours > 0 ? ` (+${step.delayHours}ש׳)` : ""}
                      </Badge>
                    ))}
                    {journey.steps.length === 0 ? <span>אין צעדים</span> : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <form
                      action={addJourneyStepAction}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <input name="journeyId" type="hidden" value={journey.id} />
                      <select
                        aria-label="סוג פעולה"
                        autoComplete="off"
                        className="glass-control h-9 rounded-md border px-2 text-sm"
                        defaultValue="send_email"
                        name="actionType"
                      >
                        <option value="send_email">דוא&quot;ל</option>
                        <option value="add_tag">תיוג</option>
                        <option value="wait">המתנה</option>
                      </select>
                      <Input
                        aria-label="השהיה בשעות"
                        className="h-9 w-24"
                        defaultValue="0"
                        name="delayHours"
                        placeholder="שעות"
                        type="number"
                      />
                      <Input
                        aria-label="תבנית"
                        className="h-9 w-32"
                        name="template"
                        placeholder="תבנית"
                      />
                      <Button size="sm" type="submit" variant="outline">
                        + צעד
                      </Button>
                    </form>

                    {journey.status === "DRAFT" ? (
                      <form action={activateJourneyAction}>
                        <input
                          name="journeyId"
                          type="hidden"
                          value={journey.id}
                        />
                        <Button size="sm" type="submit">
                          הפעל
                        </Button>
                      </form>
                    ) : null}

                    {journey.status === "ACTIVE" && journey.segmentName ? (
                      <form action={enrollJourneySegmentAction}>
                        <input
                          name="journeyId"
                          type="hidden"
                          value={journey.id}
                        />
                        <Button size="sm" type="submit" variant="outline">
                          רשום סגמנט
                        </Button>
                      </form>
                    ) : null}

                    {journey.status !== "ARCHIVED" ? (
                      <form action={archiveJourneyAction}>
                        <input
                          name="journeyId"
                          type="hidden"
                          value={journey.id}
                        />
                        <Button size="sm" type="submit" variant="ghost">
                          ארכב
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-5" />
            מרכז הסכמות (Consent)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={recordConsentAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              ניהול הסכמות שיווק לכל ערוץ. מסעות שולחים דוא&quot;ל רק ללקוחות עם
              הסכמת EMAIL פעילה (opt-in). הרישום מתועד לצורכי ציות.
            </p>
            <Input name="email" placeholder='דוא"ל לקוח' required type="email" />
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="ערוץ"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="EMAIL"
                name="channel"
              >
                <option value="EMAIL">דוא&quot;ל</option>
                <option value="SMS">SMS</option>
                <option value="PUSH">Push</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
              <select
                aria-label="סטטוס"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="GRANTED"
                name="status"
              >
                <option value="GRANTED">מאושר (opt-in)</option>
                <option value="REVOKED">בוטל (opt-out)</option>
              </select>
            </div>
            <Button className="w-fit" type="submit">
              רשום הסכמה
            </Button>
          </form>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">שינויי הסכמה אחרונים</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>לקוח</TableHead>
                  <TableHead>ערוץ</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תאריך</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consentRecords.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="טרם נרשמו הסכמות."
                    icon={ShieldCheck}
                    title="אין הסכמות"
                  />
                ) : (
                  consentRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {record.customerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {consentChannelLabel[record.channel] ?? record.channel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "GRANTED"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {record.status === "GRANTED" ? "מאושר" : "בוטל"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatHebrewDate(record.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Award aria-hidden="true" className="size-5" />
              מועדון לקוחות (Loyalty)
            </span>
            {loyaltySummary ? (
              <span className="text-muted-foreground text-sm font-normal">
                {loyaltySummary.members} חברים · {loyaltySummary.outstandingPoints}{" "}
                נק׳ פתוחות
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={applyLoyaltyAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              צבירה/פדיון נקודות. נקודות חיים מצטברות מעלות דרגה (ארד → כסף →
              זהב → פלטינה). 1 נקודה לכל 10 ש&quot;ח רכישה.
            </p>
            <Input name="email" placeholder='דוא"ל לקוח' required type="email" />
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="points"
                placeholder="נקודות"
                type="number"
              />
              <select
                aria-label="פעולה"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="EARN"
                name="type"
              >
                <option value="EARN">צבירה</option>
                <option value="REDEEM">פדיון</option>
              </select>
            </div>
            <Input name="reason" placeholder="סיבה (רשות)" />
            <Button className="w-fit" type="submit">
              עדכן נקודות
            </Button>
          </form>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">מובילי המועדון</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>לקוח</TableHead>
                  <TableHead>דרגה</TableHead>
                  <TableHead>יתרה</TableHead>
                  <TableHead>נק׳ חיים</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loyaltyAccounts.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="טרם נצברו נקודות במועדון."
                    icon={Award}
                    title="אין חברי מועדון"
                  />
                ) : (
                  loyaltyAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="text-sm">
                        {account.customerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {loyaltyTierLabel[account.tier] ?? account.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.pointsBalance}</TableCell>
                      <TableCell>{account.lifetimePoints}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

const churnRiskLabel = {
  ACTIVE: "פעיל",
  WARNING: "מתקרר",
  HIGH: "סיכון גבוה",
  DORMANT: "רדום",
} as const;

const churnRiskVariant = {
  ACTIVE: "secondary",
  WARNING: "outline",
  HIGH: "default",
  DORMANT: "destructive",
} as const;

type ChurnRisk = keyof typeof churnRiskLabel;

function CustomerListCard({
  customers,
  title,
}: {
  customers: Array<{
    id: string;
    name: string;
    email: string | null;
    lifetimeValue: number;
    orderCount: number;
    wishlistItems: number;
    churnRisk: ChurnRisk;
    healthScore: number;
    nextBestAction: string;
  }>;
  title: string;
}) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {customers.length === 0 ? (
          <p className="text-muted-foreground text-sm">אין נתונים להצגה.</p>
        ) : (
          customers.map((customer) => (
            <div
              className="bg-background/70 grid gap-1 rounded-md border p-3"
              key={customer.id}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    className="truncate font-medium underline-offset-4 hover:underline"
                    href={`/admin/customers/${customer.id}`}
                  >
                    {customer.name}
                  </Link>
                  <p className="text-muted-foreground truncate text-xs">
                    {customer.email ?? "ללא אימייל"} · {customer.orderCount}{" "}
                    הזמנות · בריאות {customer.healthScore}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="outline">
                    {formatPrice(customer.lifetimeValue)}
                  </Badge>
                  <Badge variant={churnRiskVariant[customer.churnRisk]}>
                    {churnRiskLabel[customer.churnRisk]}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-xs leading-5">
                {customer.nextBestAction}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
