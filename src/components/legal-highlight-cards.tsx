import type { LucideIcon } from "lucide-react";

export type LegalHighlight = { icon: LucideIcon; label: string };

/**
 * A row of three at-a-glance highlight cards (icon + short label) shown at the
 * top of content pages such as warranty, jewellery care and privacy.
 */
export function LegalHighlightCards({
  items,
}: {
  items: readonly LegalHighlight[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {items.map(({ icon: Icon, label }) => (
        <div className="glass-inset rounded-md border p-4" key={label}>
          <Icon className="size-5" aria-hidden="true" />
          <p className="mt-3 font-medium">{label}</p>
        </div>
      ))}
    </div>
  );
}
