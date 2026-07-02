/**
 * The two-column definition list of "to be completed" business/legal
 * placeholders shared by the accessibility, privacy and shipping/returns
 * pages. Data comes from `~/lib/legal-content`.
 */
export function LegalPlaceholderGrid({
  items,
}: {
  items: readonly { label: string; value: string }[];
}) {
  return (
    <dl className="mt-5 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div className="glass-inset rounded-md border p-4" key={item.label}>
          <dt className="text-muted-foreground text-sm">{item.label}</dt>
          <dd className="mt-1 font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
