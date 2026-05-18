import type { ReactNode } from "react";

import {
  CommercePageHero,
  type CommercePageHeroVariant,
} from "~/components/commerce-page-hero";
import type {
  BrandMediaPanelVariant,
  BrandMediaSlide,
} from "~/components/brand-media-panel";

type BrandPageIntroProps = {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  mediaAlt?: string;
  mediaPriority?: boolean;
  slides: BrandMediaSlide[];
  title: ReactNode;
  variant?: BrandMediaPanelVariant;
};

export function BrandPageIntro({
  actions,
  className,
  description,
  eyebrow,
  mediaAlt,
  mediaPriority = false,
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
      description={description}
      eyebrow={eyebrow}
      media={{
        alt: mediaAlt,
        priority: mediaPriority,
        slides,
      }}
      title={title}
      variant={heroVariant}
    />
  );
}
