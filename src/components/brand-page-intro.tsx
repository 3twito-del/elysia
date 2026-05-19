import type { ReactNode } from "react";

import {
  CommercePageHero,
  type CommercePageHeroDensity,
  type CommercePageHeroIntent,
  type CommercePageHeroMetricsMode,
  type CommercePageHeroVariant,
} from "~/components/commerce-page-hero";
import type {
  BrandMediaPanelVariant,
  BrandMediaSlide,
} from "~/components/brand-media-panel";

type BrandPageIntroProps = {
  actions?: ReactNode;
  className?: string;
  density?: CommercePageHeroDensity;
  description?: ReactNode;
  eyebrow?: ReactNode;
  intent?: CommercePageHeroIntent;
  mediaAlt?: string;
  mediaPriority?: boolean;
  metricsMode?: CommercePageHeroMetricsMode;
  showMediaOnMobile?: boolean;
  slides: BrandMediaSlide[];
  title: ReactNode;
  variant?: BrandMediaPanelVariant;
};

export function BrandPageIntro({
  actions,
  className,
  density,
  description,
  eyebrow,
  intent,
  mediaAlt,
  mediaPriority = false,
  metricsMode,
  showMediaOnMobile,
  slides,
  title,
  variant = "compact",
}: BrandPageIntroProps) {
  const heroVariant: CommercePageHeroVariant =
    variant === "commerce"
      ? "checkout"
      : variant === "category"
        ? "catalog"
        : "content";

  return (
    <CommercePageHero
      actions={actions}
      className={className}
      density={density}
      description={description}
      eyebrow={eyebrow}
      intent={intent}
      media={{
        alt: mediaAlt,
        priority: mediaPriority,
        slides,
      }}
      metricsMode={metricsMode}
      showMediaOnMobile={showMediaOnMobile}
      title={title}
      variant={heroVariant}
    />
  );
}
