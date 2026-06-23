import {
  BarChart3,
  MousePointerClick,
  Package,
  Search,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import { MetricCard } from "~/components/metric-card";
import { Badge } from "~/components/ui/badge";
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
import { formatHebrewDateTime, formatPrice } from "~/lib/format";
import { getAdminInsightsOverview } from "~/server/services/analytics-insights";

export const metadata = {
  title: "Insights | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminInsightsPage() {
  const access = await getAdminPageAccess("ANALYTICS_READ", "/admin/insights");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const insights = await getAdminInsightsOverview().catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load insights", error);
    }

    return null;
  });

  if (!insights) return <AdminDatabaseFallback />;

  return (
    <AdminShell
      active="insights"
      admin={access.admin}
      description="מדדי גלישה ורכישה first-party: מקורות תנועה, משפך רכישה, מוצרים מובילים וחיפושים ללא תוצאה."
      title="Insights"
    >
      <p className="text-muted-foreground mb-4 text-sm">
        טווח: {insights.range.days} ימים · עודכן{" "}
        <time dateTime={insights.freshness.generatedAt.toISOString()}>
          {formatHebrewDateTime(insights.freshness.generatedAt)}
        </time>
      </p>

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link
          className="rounded-md border px-3 py-2 underline-offset-4 hover:underline"
          href="/admin/insights/live"
        >
          Live Console
        </Link>
        <Link
          className="rounded-md border px-3 py-2 underline-offset-4 hover:underline"
          href="/admin/insights/replay"
        >
          Replay Archive
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${insights.kpis.productViews} צפיות מוצר`}
          icon={BarChart3}
          label="Page views"
          value={String(insights.kpis.pageViews)}
        />
        <MetricCard
          detail={`Conversion ${formatPercent(insights.kpis.conversionRate)}`}
          icon={ShoppingBag}
          label="הזמנות"
          value={String(insights.kpis.orders)}
        />
        <MetricCard
          detail={`AOV ${formatPrice(insights.kpis.averageOrderValue)}`}
          icon={TrendingUp}
          label="Revenue"
          value={formatPrice(insights.kpis.revenue)}
        />
        <MetricCard
          detail={`${insights.kpis.addToCart} הוספות לסל · ${insights.kpis.checkouts} checkout`}
          icon={MousePointerClick}
          label="כוונת רכישה"
          value={String(insights.kpis.addToCart)}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 aria-hidden="true" className="size-5" />
              משפך רכישה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelBars steps={insights.funnel} />
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package aria-hidden="true" className="size-5" />
              מוצרים מובילים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>מוצר</TableHead>
                  <TableHead>צפיות</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>הזמנות</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.topProducts.length === 0 ? (
                  <TableEmptyRow
                    colSpan={5}
                    description="לא קיימים עדיין rollups למוצרים."
                    icon={Package}
                    title="אין מוצרים להצגה"
                  />
                ) : (
                  insights.topProducts.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-medium">
                        {product.name}
                        <span className="text-muted-foreground block text-xs">
                          {product.sku}
                        </span>
                      </TableCell>
                      <TableCell>{product.views}</TableCell>
                      <TableCell>{product.clicks}</TableCell>
                      <TableCell>{product.orders}</TableCell>
                      <TableCell>{formatPrice(product.revenue)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <InsightListCard
          icon={Search}
          title="חיפושים ללא תוצאה"
          items={insights.searches.noResult.map((item) => ({
            label: item.query || "חיפוש ריק",
            value: `${item.count} פעמים`,
          }))}
        />
        <InsightListCard
          icon={Search}
          title="חיפושים מובילים"
          items={insights.searches.top.map((item) => ({
            label: item.query || "חיפוש ריק",
            value: `${item.count} · ${item.resultCount} תוצאות`,
          }))}
        />
        <InsightListCard
          icon={TrendingUp}
          title="UTM channels"
          items={insights.utmChannels.map((item) => ({
            label: item.channel,
            value: String(item.count),
          }))}
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <InsightListCard
          icon={BarChart3}
          title="Top pages"
          items={insights.pages.map((item) => ({
            label: item.path,
            value: `${item.views} views · ${item.sessions} sessions`,
          }))}
        />
        <InsightListCard
          icon={TrendingUp}
          title="Campaign BI"
          items={insights.campaigns.map((item) => ({
            label: `${item.channel} · ${item.campaign}`,
            value: `${formatPrice(item.revenue)} · ${item.orders} orders`,
          }))}
        />
      </div>
    </AdminShell>
  );
}

function FunnelBars({
  steps,
}: {
  steps: Array<{ step: string; count: number; revenue: number }>;
}) {
  const max = Math.max(...steps.map((step) => step.count), 1);

  return (
    <div className="grid gap-3" role="list">
      {steps.map((step) => {
        const width = Math.max(4, (step.count / max) * 100);

        return (
          <div className="grid gap-1" key={step.step} role="listitem">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">
                {getFunnelStepLabel(step.step)}
              </span>
              <span className="text-muted-foreground">
                {step.count}
                {step.revenue > 0 ? ` · ${formatPrice(step.revenue)}` : ""}
              </span>
            </div>
            <div className="bg-muted h-3 rounded-full" aria-hidden="true">
              <div
                className="bg-foreground h-3 rounded-full"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightListCard({
  icon: Icon,
  items,
  title,
}: {
  icon: typeof Search;
  items: Array<{ label: string; value: string }>;
  title: string;
}) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon aria-hidden="true" className="size-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">אין נתונים להצגה.</p>
        ) : (
          items.map((item) => (
            <div
              className="bg-background/70 flex items-center justify-between gap-3 rounded-md border p-3"
              key={`${item.label}-${item.value}`}
            >
              <span className="min-w-0 truncate">{item.label}</span>
              <Badge variant="outline">{item.value}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function getFunnelStepLabel(step: string) {
  const labels: Record<string, string> = {
    add_to_cart: "הוספה לסל",
    checkout_started: "התחלת Checkout",
    order_created: "הזמנה נוצרה",
    page_view: "Page view",
    payment_captured: "תשלום נקלט",
    product_view: "צפיית מוצר",
  };

  return labels[step] ?? step;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
