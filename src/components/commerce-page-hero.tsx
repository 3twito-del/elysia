import type { ReactNode } from "react";

import {
  BrandMediaPanel,
  type BrandMediaPanelVariant,
  type BrandMediaSlide,
} from "~/components/brand-media-panel";
import { cn } from "~/lib/utils";

export type CommercePageHeroVariant =
  | "catalog"
  | "checkout"
  | "content"
  | "home";

export type CommercePageHeroMetric = {
  label: ReactNode;
  value: ReactNode;
};

export type CommercePageHeroMedia = {
  alt?: string;
  priority?: boolean;
  sizes?: string;
  slides: BrandMediaSlide[];
};

type CommercePageHeroProps = {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  id?: string;
  media?: CommercePageHeroMedia;
  metrics?: CommercePageHeroMetric[];
  title: ReactNode;
  variant?: CommercePageHeroVariant;
};

const mediaVariantByHeroVariant: Record<
  CommercePageHeroVariant,
  BrandMediaPanelVariant
> = {
  catalog: "category",
  checkout: "commerce",
  content: "content",
  home: "hero",
};

export function CommercePageHero({
  actions,
  className,
  description,
  eyebrow,
  id,
  media,
  metrics,
  title,
  variant = "content",
}: CommercePageHeroProps) {
  const hasActions = actions !== undefined && actions !== null;
  const hasMedia = Boolean(media);
  const hasMetrics = (metrics?.length ?? 0) > 0;
  const hasAside = hasMedia || hasMetrics;

  return (
    <section
      className={cn("commerce-page-hero brand-page-band", className)}
      data-commerce-hero={variant}
      data-has-aside={hasAside ? "true" : "false"}
      dir="rtl"
      id={id}
    >
      <div className="commerce-page-hero-inner">
        <div className="commerce-page-hero-copy">
          {eyebrow ? (
            <p className="commerce-page-hero-eyebrow">{eyebrow}</p>
          ) : null}
          <h1 className="commerce-page-hero-title">{title}</h1>
          {description ? (
            <p className="commerce-page-hero-description">{description}</p>
          ) : null}
          {hasActions ? (
            <div className="commerce-page-hero-actions">{actions}</div>
          ) : null}
        </div>

        {hasAside ? (
          <div className="commerce-page-hero-aside">
            {media ? (
              <BrandMediaPanel
                alt={media.alt}
                className="commerce-page-hero-media brand-media-frame"
                priority={media.priority}
                sizes={media.sizes}
                slides={media.slides}
                variant={mediaVariantByHeroVariant[variant]}
              />
            ) : null}
            {hasMetrics ? (
              <dl className="commerce-page-hero-metrics">
                {metrics?.map((metric, index) => (
                  <div className="commerce-page-hero-metric" key={index}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
