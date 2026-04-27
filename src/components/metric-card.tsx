import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "~/components/ui/card";

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="text-foreground grid size-11 place-items-center rounded-md border border-black/10 bg-black/[0.04]">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-muted-foreground text-xs">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
