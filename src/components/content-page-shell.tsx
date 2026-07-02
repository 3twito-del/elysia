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
export function ContentPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
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
          <div className="brand-surface p-6 sm:p-8">{children}</div>
        </RevealSection>
      </main>
    </>
  );
}
