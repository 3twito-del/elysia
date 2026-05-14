import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  variant = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  variant?: "default" | "soft";
}) {
  const isSoft = variant === "soft";

  return (
    <Card
      className={cn(
        "brand-accent-card interactive-lift min-w-0 rounded-md",
        isSoft ? "glass-card" : "glass-panel",
      )}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "brand-icon-well glass-inset text-foreground grid size-11 place-items-center rounded-md border",
            isSoft ? "opacity-90" : "opacity-100",
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-semibold break-words">{value}</p>
          <p className="text-muted-foreground text-xs leading-5">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
