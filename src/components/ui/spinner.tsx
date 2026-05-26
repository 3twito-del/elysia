import { Loader2Icon } from "lucide-react";

import { cn } from "~/lib/utils";

function Spinner({
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  className,
  role,
  ...props
}: React.ComponentProps<"svg">) {
  const isDecorative =
    ariaHidden === true ||
    ariaHidden === "true" ||
    role === "presentation" ||
    role === "none";

  return (
    <Loader2Icon
      aria-hidden={ariaHidden}
      aria-label={isDecorative ? undefined : (ariaLabel ?? "בהמתנה")}
      className={cn("size-4 animate-spin", className)}
      role={role ?? (isDecorative ? "presentation" : "status")}
      {...props}
    />
  );
}

export { Spinner };
