import { FlaskConical, Trophy } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createExperimentAction,
  recordExperimentEventAction,
  setExperimentStatusAction,
} from "./actions";
import { MetricCard } from "~/components/metric-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  getExperimentsSummary,
  listExperiments,
} from "~/server/services/ab-testing";

export const metadata = { title: "ניסויים | Admin" };

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  RUNNING: "פעיל",
  PAUSED: "מושהה",
  CONCLUDED: "הסתיים",
};

export default async function AdminExperimentsPage() {
  const access = await getAdminPageAccess("CATALOG_READ", "/admin/experiments");
  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getExperimentsSummary().catch(() => null);
  if (!summary) return <AdminDatabaseFallback />;

  const experiments = await listExperiments().catch(() => []);

  return (
    <AdminShell
      active="experiments"
      admin={access.admin}
      description="בדיקות A/B: וריאנטים משוקללים, מעקב המרות ובחירת מנצח."
      title="ניסויים A/B"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <MetricCard
          detail={`${summary.running} פעילים`}
          icon={FlaskConical}
          label="ניסויים"
          value={String(summary.total)}
        />
        <MetricCard detail="בחירת מנצח סטטיסטית" icon={Trophy} label="הכרעה" value="Auto" />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical aria-hidden="true" className="size-5" />
            ניסויים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={createExperimentAction} className="flex flex-wrap items-end gap-2">
            <Input className="w-64" name="name" placeholder="שם הניסוי" required />
            <Button size="sm" type="submit" variant="outline">
              צור ניסוי (A/B)
            </Button>
          </form>

          {experiments.length === 0 ? (
            <p className="text-muted-foreground text-sm">טרם נוצרו ניסויים.</p>
          ) : (
            experiments.map((experiment) => (
              <div
                className="glass-inset grid gap-2 rounded-md border p-3"
                key={experiment.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{experiment.name}</span>
                  <div className="flex items-center gap-2">
                    {experiment.winner ? (
                      <Badge variant="secondary">מנצח: {experiment.winner}</Badge>
                    ) : null}
                    <form action={setExperimentStatusAction}>
                      <input name="experimentId" type="hidden" value={experiment.id} />
                      <input
                        name="status"
                        type="hidden"
                        value={experiment.status === "RUNNING" ? "PAUSED" : "RUNNING"}
                      />
                      <Button size="sm" type="submit" variant="ghost">
                        {statusLabel[experiment.status] ?? experiment.status}
                      </Button>
                    </form>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {experiment.variants.map((variant) => (
                    <div
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                      key={variant.id}
                    >
                      <span>
                        וריאנט {variant.key} · {variant.rate}% ({variant.conversions}/
                        {variant.impressions})
                      </span>
                      <div className="flex gap-1">
                        <form action={recordExperimentEventAction}>
                          <input name="experimentId" type="hidden" value={experiment.id} />
                          <input name="variantKey" type="hidden" value={variant.key} />
                          <input name="event" type="hidden" value="impression" />
                          <Button size="sm" type="submit" variant="ghost">
                            +צפייה
                          </Button>
                        </form>
                        <form action={recordExperimentEventAction}>
                          <input name="experimentId" type="hidden" value={experiment.id} />
                          <input name="variantKey" type="hidden" value={variant.key} />
                          <input name="event" type="hidden" value="conversion" />
                          <Button size="sm" type="submit" variant="ghost">
                            +המרה
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
