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
        "maison-frame interactive-lift min-w-0 rounded-md py-0 shadow-[0_14px_34px_var(--glass-shadow)]",
        isSoft ? "glass-card" : "glass-panel",
      )}
    >
      <CardContent className="grid min-h-40 content-between gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-muted-foreground text-sm">{label}</p>
          <div
            className={cn(
              "glass-inset text-foreground grid size-10 shrink-0 place-items-center rounded-md border",
              isSoft
                ? "[border-color:var(--luxury-accent-border)] opacity-90"
                : "opacity-100",
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-3xl leading-none font-semibold break-words">
            {value}
          </p>
          <p className="text-muted-foreground mt-3 text-xs leading-5">
            {detail}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
