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
        "interactive-lift rounded-md",
        isSoft ? "glass-card" : "glass-panel",
      )}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "glass-inset text-foreground grid size-11 place-items-center rounded-md border",
            isSoft ? "opacity-90" : "opacity-100",
          )}
        >
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
