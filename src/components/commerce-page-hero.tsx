import type { ReactNode } from "react";

import {
  BrandMediaPanel,
  type BrandMediaPanelVariant,
  type BrandMediaSlide,
} from "~/components/brand-media-panel";
import { shouldRenderPublicElement } from "~/lib/public-design-policy";
import type { PublicRouteArchetype } from "~/lib/public-structure-policy";
import { cn } from "~/lib/utils";

export type CommercePageHeroVariant = "catalog" | "checkout" | "content";
export type CommercePageHeroDensity = "editorial" | "commerce" | "service";
export type CommercePageHeroIntent = "commerce" | "service" | "content";
export type CommercePageHeroMetricsMode = "tiles" | "inline";

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
  archetype?: PublicRouteArchetype;
  className?: string;
  description?: ReactNode;
  /** Extra classes on the description paragraph only (e.g. a line-clamp for
   * a specific route) -- never changes the shared default for every caller. */
  descriptionClassName?: string;
  density?: CommercePageHeroDensity;
  eyebrow?: ReactNode;
  id?: string;
  intent?: CommercePageHeroIntent;
  media?: CommercePageHeroMedia;
  metricsMode?: CommercePageHeroMetricsMode;
  metrics?: CommercePageHeroMetric[];
  showMediaOnMobile?: boolean;
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
};

const densityByHeroVariant: Record<
  CommercePageHeroVariant,
  CommercePageHeroDensity
> = {
  catalog: "commerce",
  checkout: "service",
  content: "service",
};

const intentByHeroVariant: Record<
  CommercePageHeroVariant,
  CommercePageHeroIntent
> = {
  catalog: "commerce",
  checkout: "service",
  content: "content",
};

export function CommercePageHero({
  actions,
  archetype,
  className,
  description,
  descriptionClassName,
  density,
  eyebrow,
  id,
  intent,
  media,
  metricsMode = "tiles",
  metrics,
  showMediaOnMobile = false,
  title,
  variant = "content",
}: CommercePageHeroProps) {
  const hasActions = actions !== undefined && actions !== null;
  const hasMedia =
    Boolean(media) && shouldRenderPublicElement("routeHeroMedia");
  const hasMetrics =
    (metrics?.length ?? 0) > 0 && shouldRenderPublicElement("heroMetrics");
  const hasAside = hasMedia || hasMetrics;

  return (
    <section
      className={cn(
        "elysia-route-header commerce-page-hero brand-page-band",
        className,
      )}
      data-commerce-density={density ?? densityByHeroVariant[variant]}
      data-commerce-hero={variant}
      data-has-aside={hasAside ? "true" : "false"}
      data-media-mobile={showMediaOnMobile ? "true" : "false"}
      data-metrics-mode={metricsMode}
      data-route-archetype={archetype ?? getDefaultArchetype(variant)}
      data-route-intent={intent ?? intentByHeroVariant[variant]}
      dir="rtl"
      id={id}
    >
      <div className="elysia-section commerce-page-hero-inner">
        <div className="commerce-page-hero-copy">
          {eyebrow ? (
            <p className="commerce-page-hero-eyebrow">{eyebrow}</p>
          ) : null}
          <h1 className="commerce-page-hero-title">{title}</h1>
          {description ? (
            <p
              className={cn(
                "commerce-page-hero-description",
                descriptionClassName,
              )}
            >
              {description}
            </p>
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
                className="elysia-media-frame commerce-page-hero-media brand-media-frame"
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

function getDefaultArchetype(
  variant: CommercePageHeroVariant,
): PublicRouteArchetype {
  if (variant === "catalog") return "plp";
  if (variant === "checkout") return "checkout";

  return "content";
}
