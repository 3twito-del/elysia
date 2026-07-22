import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle, Gem, LifeBuoy, Ruler, Search } from "lucide-react";

import {
  createAiFallbackServiceHref,
  getAiFallbackCopy,
} from "../_lib/ai-fallback";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type AiFallbackRecoveryProps = {
  actions?: ReactNode;
  className?: string;
  reason?: string | null;
  source: "elys-ai";
};

const fallbackLinks = [
  {
    href: "/search",
    icon: Search,
    id: "search",
    label: "חיפוש במבחר",
  },
  {
    href: "/category/rings",
    icon: Gem,
    id: "rings",
    label: "טבעות זמינות",
  },
  {
    href: "/size-guide",
    icon: Ruler,
    id: "size-guide",
    label: "מדריך מידות",
  },
] as const;

export function AiFallbackRecovery({
  actions,
  className,
  reason,
  source,
}: AiFallbackRecoveryProps) {
  const copy = getAiFallbackCopy(reason);
  const serviceHref = createAiFallbackServiceHref(reason);

  return (
    <div
      aria-live="polite"
      className={cn("glass-inset grid gap-4 rounded-md border p-4", className)}
      data-fallback-kind={copy.kind}
      data-testid={`ai-fallback-recovery-${source}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className="brand-icon-well mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md border">
          <AlertCircle aria-hidden="true" className="size-4" />
        </span>
        <div className="grid min-w-0 gap-1">
          <p className="font-medium">{copy.title}</p>
          <p className="text-muted-foreground text-sm leading-6">
            {copy.detail}
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {fallbackLinks.map((link) => {
          const Icon = link.icon;

          return (
            <Button
              asChild
              className="justify-start gap-2"
              key={link.id}
              variant="outline"
            >
              <Link
                data-testid={`ai-fallback-link-${source}-${link.id}`}
                href={link.href}
              >
                <Icon aria-hidden="true" className="size-4" />
                {link.label}
              </Link>
            </Button>
          );
        })}
        <Button asChild className="justify-start gap-2" variant="outline">
          <Link
            data-testid={`ai-fallback-link-${source}-service`}
            href={serviceHref}
          >
            <LifeBuoy aria-hidden="true" className="size-4" />
            פנייה לשירות
          </Link>
        </Button>
      </div>

      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
