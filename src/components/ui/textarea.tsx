import * as React from "react";

import { cn } from "~/lib/utils";

function Textarea({
  autoComplete = "off",
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      autoComplete={autoComplete}
      data-slot="textarea"
      className={cn(
        "elysia-control glass-control placeholder:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-24 w-full rounded-md border px-3 py-3 text-base transition-colors outline-none focus-visible:border-[var(--glass-border-hover)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] disabled:cursor-not-allowed disabled:bg-[var(--glass-inset-bg)] disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
