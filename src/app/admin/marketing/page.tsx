import { Megaphone, Percent, TrendingUp, Users, Wallet } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createAffiliatePartnerAction,
  createCampaignAction,
  recordCampaignResultsAction,
  recordReferralAction,
  setCampaignStatusAction,
  setReferralStatusAction,
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
import {
  getAffiliateSummary,
  listAffiliatePartners,
  listReferrals,
} from "~/server/services/affiliates";
import {
  getMarketingSummary,
  listCampaigns,
  MARKETING_CHANNELS,
} from "~/server/services/marketing-campaigns";

export const metadata = {
  title: "שיווק | Admin",
};

export const dynamic = "force-dynamic";

const channelLabel: Record<string, string> = {
  GOOGLE_ADS: "Google Ads",
  META: "Meta",
  TIKTOK: "TikTok",
  EMAIL: 'דוא"ל',
  ORGANIC: "אורגני",
  OTHER: "אחר",
};

const campaignStatuses = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED"];
const campaignStatusLabel: Record<string, string> = {
  PLANNED: "מתוכנן",
  ACTIVE: "פעיל",
  PAUSED: "מושהה",
  COMPLETED: "הסתיים",
};

const referralStatusLabel: Record<string, string> = {
  PENDING: "ממתין",
  APPROVED: "אושר",
  PAID: "שולם",
};

export default async function AdminMarketingPage() {
  const access = await getAdminPageAccess("ERP_READ", "/admin/marketing");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getMarketingSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const [campaigns, affiliateSummary, partners, referrals] = await Promise.all([
    listCampaigns().catch(() => []),
    getAffiliateSummary().catch(() => null),
    listAffiliatePartners().catch(() => []),
    listReferrals().catch(() => []),
  ]);

  const activePartners = partners.filter((partner) => partner.status === "ACTIVE");

  return (
    <AdminShell
      active="marketing"
      admin={access.admin}
      description="שיווק דיגיטלי: קמפיינים לפי ערוץ עם ROAS, ותוכנית שותפים/הפניות עם עמלות."
      title="שיווק"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${summary.activeCampaigns} פעילים`}
          icon={Megaphone}
          label="קמפיינים"
          value={String(summary.totalCampaigns)}
        />
        <MetricCard
          detail="הוצאת מדיה כוללת"
          icon={Wallet}
          label="הוצאה"
          value={formatPrice(summary.totalSpend)}
        />
        <MetricCard
          detail="הכנסה מיוחסת"
          icon={TrendingUp}
          label="ROAS"
          value={`${summary.roas}×`}
        />
        <MetricCard
          detail="עמלות שותפים לתשלום"
          icon={Percent}
          label="שותפים"
          value={formatPrice(affiliateSummary?.payableCommission ?? 0)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone aria-hidden="true" className="size-5" />
            קמפיינים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={createCampaignAction} className="grid gap-2">
            <Input name="name" placeholder="שם הקמפיין" required />
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="ערוץ"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="GOOGLE_ADS"
                name="channel"
              >
                {MARKETING_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channelLabel[channel] ?? channel}
                  </option>
                ))}
              </select>
              <Input
                min="0"
                name="budget"
                placeholder="תקציב (₪)"
                step="0.01"
                type="number"
              />
            </div>
            <Button className="w-fit" size="sm" type="submit">
              צור קמפיין
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>קמפיין</TableHead>
                <TableHead>הוצאה/הכנסה</TableHead>
                <TableHead>ROAS</TableHead>
                <TableHead>רישום תוצאות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם נוצרו קמפיינים."
                  icon={Megaphone}
                  title="אין קמפיינים"
                />
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {channelLabel[campaign.channel] ?? campaign.channel}
                      </div>
                      <form
                        action={setCampaignStatusAction}
                        className="mt-1 flex items-center gap-1"
                      >
                        <input name="campaignId" type="hidden" value={campaign.id} />
                        <select
                          aria-label="סטטוס"
                          autoComplete="off"
                          className="glass-control h-7 rounded-md border px-1 text-xs"
                          defaultValue={campaign.status}
                          name="status"
                        >
                          {campaignStatuses.map((status) => (
                            <option key={status} value={status}>
                              {campaignStatusLabel[status] ?? status}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" type="submit" variant="ghost">
                          עדכן
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(campaign.spend)} / {formatPrice(campaign.revenue)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant={campaign.roas >= 1 ? "secondary" : "outline"}>
                        {campaign.roas}×
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form
                        action={recordCampaignResultsAction}
                        className="flex items-center gap-1"
                      >
                        <input name="campaignId" type="hidden" value={campaign.id} />
                        <Input
                          className="h-8 w-20"
                          name="spend"
                          placeholder="הוצאה"
                          type="number"
                        />
                        <Input
                          className="h-8 w-20"
                          name="revenue"
                          placeholder="הכנסה"
                          type="number"
                        />
                        <Button size="sm" type="submit" variant="outline">
                          הוסף
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

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Users aria-hidden="true" className="size-5" />
              שותפים והפניות
            </span>
            {affiliateSummary ? (
              <span className="text-muted-foreground text-sm font-normal">
                {affiliateSummary.activePartners} שותפים · ממתין{" "}
                {formatPrice(affiliateSummary.pendingCommission)}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <div className="grid gap-5">
            <form action={createAffiliatePartnerAction} className="grid gap-2">
              <p className="text-muted-foreground text-sm">
                שותף עם קוד הפניה ואחוז עמלה. עמלות מאושרות לתשלום דרך ספקים (AP).
              </p>
              <Input name="name" placeholder="שם השותף" required />
              <div className="grid grid-cols-2 gap-2">
                <Input name="code" placeholder="קוד (רשות)" />
                <Input
                  min="0"
                  name="commissionPercent"
                  placeholder="עמלה %"
                  step="0.01"
                  type="number"
                />
              </div>
              <Button className="w-fit" size="sm" type="submit">
                הוסף שותף
              </Button>
            </form>

            <form action={recordReferralAction} className="grid gap-2 border-t pt-4">
              <select
                aria-label="שותף"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="partnerId"
                required
              >
                <option disabled value="">
                  בחר שותף…
                </option>
                {activePartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.code} · {partner.name}
                  </option>
                ))}
              </select>
              <Input
                min="0"
                name="amount"
                placeholder="סכום המכירה (₪)"
                step="0.01"
              />
              <Button className="w-fit" size="sm" type="submit">
                רשום הפניה
              </Button>
            </form>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שותף</TableHead>
                <TableHead>עמלה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם נרשמו הפניות."
                  icon={Users}
                  title="אין הפניות"
                />
              ) : (
                referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="text-sm">{referral.partnerCode}</TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(referral.commission)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          referral.status === "PAID"
                            ? "secondary"
                            : referral.status === "APPROVED"
                              ? "outline"
                              : "outline"
                        }
                      >
                        {referralStatusLabel[referral.status] ?? referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {referral.status !== "PAID" ? (
                        <form action={setReferralStatusAction}>
                          <input
                            name="referralId"
                            type="hidden"
                            value={referral.id}
                          />
                          <input
                            name="status"
                            type="hidden"
                            value={referral.status === "APPROVED" ? "PAID" : "APPROVED"}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            {referral.status === "APPROVED" ? "שלם" : "אשר"}
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
