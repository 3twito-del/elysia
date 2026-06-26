import {
  Banknote,
  Boxes,
  CreditCard,
  Landmark,
  Repeat,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import { MetricCard } from "~/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatPrice } from "~/lib/format";
import { getExecutiveDashboard } from "~/server/services/bi-metrics";

export const metadata = {
  title: "BI | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminBiPage() {
  const access = await getAdminPageAccess("FINANCE_READ", "/admin/bi");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const kpi = await getExecutiveDashboard().catch(() => null);

  if (!kpi) return <AdminDatabaseFallback />;

  return (
    <AdminShell
      active="bi"
      admin={access.admin}
      description="לוח מחוונים ניהולי: KPIs פיננסיים, מכירה ותפעול מאוחדים מכל המודולים."
      title="בינה עסקית"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="רווח תקופתי מהספר הראשי"
          icon={TrendingUp}
          label="רווח נקי"
          value={formatPrice(kpi.netIncome)}
        />
        <MetricCard
          detail="יתרת מזומן בספרים"
          icon={Banknote}
          label="מזומן"
          value={formatPrice(kpi.cashBalance)}
        />
        <MetricCard
          detail="חייבים פתוחים (AR)"
          icon={CreditCard}
          label="לקוחות"
          value={formatPrice(kpi.arOutstanding)}
        />
        <MetricCard
          detail="זכאים פתוחים (AP)"
          icon={Landmark}
          label="ספקים"
          value={formatPrice(kpi.apOutstanding)}
        />
        <MetricCard
          detail="שווי מלאי (FIFO)"
          icon={Boxes}
          label="מלאי"
          value={formatPrice(kpi.inventoryValue)}
        />
        <MetricCard
          detail="הכנסה חודשית מתגלגלת"
          icon={Repeat}
          label="MRR"
          value={formatPrice(kpi.mrr)}
        />
        <MetricCard
          detail="חברי מועדון פעילים"
          icon={Users}
          label="נאמנות"
          value={String(kpi.loyaltyMembers)}
        />
        <MetricCard
          detail="בקשות אישור ממתינות"
          icon={Wallet}
          label="אישורים"
          value={String(kpi.openApprovals)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp aria-hidden="true" className="size-5" />
            יחסים פיננסיים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <div className="grid gap-1">
            <span className="text-muted-foreground">הון חוזר (נכסים − התחייבויות)</span>
            <span className="text-xl font-semibold">
              {formatPrice(kpi.workingCapital)}
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-muted-foreground">יחס שוטף (נכסים/התחייבויות)</span>
            <span className="text-xl font-semibold">
              {kpi.currentRatio ?? "—"}
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-muted-foreground">פוזיציית חוב נטו (AR − AP)</span>
            <span className="text-xl font-semibold">
              {formatPrice(kpi.netReceivablePosition)}
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:col-span-3">
            מאוחד מהספר הראשי, AR/AP, מלאי, מנויים, נאמנות ואישורים. תצוגה בלבד.
          </p>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
