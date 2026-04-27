import { AphroditeIcon, type IconName } from "~/components/icon";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

export function MetricCard({
  icon,
  label,
  value,
  detail,
  variant = "default",
}: {
  icon: IconName;
  label: string;
  value: string;
  detail: string;
  variant?: "default" | "soft";
}) {
  const isSoft = variant === "soft";

  return (
    <Card
      className={cn(
        "rounded-md border-black/10 shadow-none backdrop-blur",
        isSoft ? "bg-white/50 ring-1 ring-black/[0.02]" : "bg-white/65",
      )}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "text-foreground grid size-11 place-items-center rounded-md border border-black/10",
            isSoft ? "bg-white/60" : "bg-black/[0.04]",
          )}
        >
          <AphroditeIcon className="size-5" name={icon} />
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
