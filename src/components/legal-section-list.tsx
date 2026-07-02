import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type LegalSection = { title: string; text: ReactNode };

/**
 * The stacked list of titled sections (icon + heading + paragraph) shared by
 * every long-form legal/content page (terms, privacy, warranty, jewellery
 * care, shipping/returns).
 *
 * Pass `icon` for a single icon across the whole list, or `iconFor` to pick an
 * icon per section index for pages that alternate icons (`iconFor` wins).
 */
export function LegalSectionList({
  sections,
  idPrefix,
  icon,
  iconFor,
}: {
  sections: readonly LegalSection[];
  idPrefix: string;
  icon: LucideIcon;
  iconFor?: (index: number) => LucideIcon;
}) {
  return (
    <div className="grid gap-7">
      {sections.map((section, index) => {
        const sectionId = `${idPrefix}-${index + 1}`;
        const Icon = iconFor ? iconFor(index) : icon;

        return (
          <section aria-labelledby={sectionId} key={section.title}>
            <div className="flex items-center gap-3">
              <Icon className="size-5" aria-hidden="true" />
              <h2 className="text-2xl font-semibold" id={sectionId}>
                {section.title}
              </h2>
            </div>
            <p className="text-muted-foreground mt-3 leading-8">
              {section.text}
            </p>
          </section>
        );
      })}
    </div>
  );
}
