import type { ReactNode } from "react";

import {
  BrandMediaPanel,
  type BrandMediaPanelVariant,
  type BrandMediaSlide,
} from "~/components/brand-media-panel";
import { cn } from "~/lib/utils";

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
  return (
    <div
      className={cn("brand-page-intro", className)}
      data-brand-variant={variant}
      dir="rtl"
    >
      <div className="brand-page-intro-copy">
        {eyebrow ? <p className="brand-page-intro-eyebrow">{eyebrow}</p> : null}
        <h2 className="brand-page-intro-title">{title}</h2>
        {description ? (
          <p className="brand-page-intro-description">{description}</p>
        ) : null}
        {actions ? (
          <div className="brand-page-intro-actions">{actions}</div>
        ) : null}
      </div>
      <BrandMediaPanel
        alt={mediaAlt}
        className="brand-page-intro-media"
        priority={mediaPriority}
        slides={slides}
        variant={variant}
      />
    </div>
  );
}
