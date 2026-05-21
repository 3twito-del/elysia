import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,outline-color,opacity] duration-[var(--motion-fast)] ease-[var(--ease-motion-standard)] outline-none select-none focus-visible:border-[var(--glass-border-strong)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[var(--brand-aqua)] bg-[var(--brand-aqua)] text-[var(--brand-aqua-deep)] shadow-[0_10px_24px_rgb(66_201_190_/_12%)] hover:bg-[var(--brand-aqua)] hover:text-[var(--brand-aqua-deep)] hover:shadow-[0_14px_28px_rgb(66_201_190_/_16%)]",
        outline:
          "border-[var(--glass-border)] bg-background text-foreground shadow-none hover:border-[var(--brand-aqua)] hover:bg-[var(--brand-aqua-soft)] hover:text-[var(--brand-aqua-deep)] aria-expanded:border-[var(--brand-aqua)] aria-expanded:bg-[var(--brand-aqua-soft)] aria-expanded:text-[var(--brand-aqua-deep)] dark:border-input dark:bg-input/30 dark:hover:border-[var(--glass-border-strong)] dark:hover:bg-accent",
        secondary:
          "border-[var(--glass-border)] bg-background text-foreground shadow-none hover:border-[var(--brand-aqua)] hover:bg-[var(--brand-aqua-soft)] hover:text-[var(--brand-aqua-deep)] aria-expanded:border-[var(--brand-aqua)] aria-expanded:bg-[var(--brand-aqua-soft)] aria-expanded:text-[var(--brand-aqua-deep)] dark:hover:border-[var(--glass-border-strong)] dark:hover:bg-accent",
        ghost:
          "shadow-none hover:bg-[var(--brand-aqua-soft)] hover:text-[var(--brand-aqua-deep)] aria-expanded:bg-[var(--brand-aqua-soft)] aria-expanded:text-[var(--brand-aqua-deep)] dark:hover:bg-accent dark:hover:text-accent-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-11",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  type,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";
  const buttonType = asChild ? type : (type ?? "button");

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...(buttonType ? { type: buttonType } : undefined)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
