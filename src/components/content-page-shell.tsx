import type { ReactNode } from "react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";

/**
 * Shared shell for the long-form policy/content pages (terms, privacy,
 * accessibility, warranty, jewellery care, shipping/returns). Renders the site
 * header, the compact page intro and the centered brand surface so the framing,
 * spacing and max-width stay identical across every page.
 */
export type ContentPageTocSection = { id: string; label: string };

export function ContentPageShell({
  eyebrow,
  title,
  description,
  children,
  tocSections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  tocSections?: ContentPageTocSection[];
}) {
  return (
    <>
      <SiteHeader />

      <main className="elysia-page">
        <CompactPageIntro
          description={description}
          eyebrow={eyebrow}
          title={title}
          variant="content"
        />

        <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          {tocSections && tocSections.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
              <nav
                aria-label="תוכן עניינים"
                className="content-page-toc hidden lg:sticky lg:top-24 lg:grid lg:gap-0.5"
                data-testid="content-page-toc"
              >
                {tocSections.map((section) => (
                  <a
                    className="text-muted-foreground hover:text-foreground rounded-sm px-2 py-1.5 text-sm transition-colors"
                    href={`#${section.id}`}
                    key={section.id}
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
              <div className="brand-surface min-w-0 p-6 sm:p-8">
                {children}
              </div>
            </div>
          ) : (
            <div className="brand-surface p-6 sm:p-8">{children}</div>
          )}
        </RevealSection>
      </main>
    </>
  );
}
