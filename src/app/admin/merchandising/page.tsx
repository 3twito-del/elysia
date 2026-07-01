import { GalleryHorizontalEnd, Image as ImageIcon } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createBannerAction,
  deleteBannerAction,
  toggleBannerAction,
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
  BANNER_PLACEMENTS,
  getBannersSummary,
  listBanners,
} from "~/server/services/merchandising";

export const metadata = {
  title: "מרצ'נדייזינג | Admin",
};

export const dynamic = "force-dynamic";

const placementLabel: Record<string, string> = {
  HOME_HERO: "בית — ראשי",
  HOME_STRIP: "בית — רצועה",
  CATEGORY_TOP: "קטגוריה — עליון",
  CHECKOUT: "צ'קאאוט",
};

export default async function AdminMerchandisingPage() {
  const access = await getAdminPageAccess("CATALOG_READ", "/admin/merchandising");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getBannersSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const banners = await listBanners().catch(() => []);

  return (
    <AdminShell
      active="merchandising"
      admin={access.admin}
      description="מרצ'נדייזינג: באנרים לפי מיקום בחנות, עם תזמון ועדיפות."
      title="מרצ'נדייזינג"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <MetricCard
          detail={`${summary.active} פעילים`}
          icon={GalleryHorizontalEnd}
          label="באנרים"
          value={String(summary.total)}
        />
        <MetricCard
          detail="מיקומים נתמכים בחנות"
          icon={ImageIcon}
          label="מיקומים"
          value={String(BANNER_PLACEMENTS.length)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GalleryHorizontalEnd aria-hidden="true" className="size-5" />
            באנרים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={createBannerAction} className="grid gap-2">
            <Input name="title" placeholder="כותרת הבאנר" required />
            <select
              aria-label="מיקום"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue="HOME_HERO"
              name="placement"
            >
              {BANNER_PLACEMENTS.map((placement) => (
                <option key={placement} value={placement}>
                  {placementLabel[placement] ?? placement}
                </option>
              ))}
            </select>
            <Input dir="ltr" name="imageUrl" placeholder="קישור לתמונה (רשות)" />
            <Input dir="ltr" name="linkUrl" placeholder="קישור יעד (רשות)" />
            <div className="grid grid-cols-2 gap-2">
              <Input
                defaultValue="100"
                name="priority"
                placeholder="עדיפות"
                type="number"
              />
              <Input aria-label="מ-" name="startsAt" type="date" />
            </div>
            <Button className="w-fit" size="sm" type="submit">
              צור באנר
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>באנר</TableHead>
                <TableHead>מיקום</TableHead>
                <TableHead>עדיפות</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם נוצרו באנרים."
                  icon={GalleryHorizontalEnd}
                  title="אין באנרים"
                />
              ) : (
                banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{banner.title}</div>
                      <Badge
                        className="mt-1"
                        variant={banner.isActive ? "secondary" : "outline"}
                      >
                        {banner.isActive ? "פעיל" : "כבוי"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {placementLabel[banner.placement] ?? banner.placement}
                    </TableCell>
                    <TableCell className="text-sm">{banner.priority}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <form action={toggleBannerAction}>
                          <input name="bannerId" type="hidden" value={banner.id} />
                          <input
                            name="isActive"
                            type="hidden"
                            value={banner.isActive ? "0" : "1"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {banner.isActive ? "כבה" : "הפעל"}
                          </Button>
                        </form>
                        <form action={deleteBannerAction}>
                          <input name="bannerId" type="hidden" value={banner.id} />
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
    </AdminShell>
  );
}
