"use client";

import {
  CinematicHeroSequence,
  type CinematicHeroSlide,
} from "~/components/cinematic-hero-sequence";
import { KineticImageMotion } from "~/components/kinetic-image-motion";
import { cn } from "~/lib/utils";

export type BrandMediaPanelVariant =
  | "category"
  | "commerce"
  | "compact"
  | "content"
  | "hero";

type BrandMediaPanelProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  slides: CinematicHeroSlide[];
  variant?: BrandMediaPanelVariant;
};

export function BrandMediaPanel({
  alt,
  className,
  priority = false,
  sizes = "(min-width: 1024px) 34vw, 100vw",
  slides,
  variant = "compact",
}: BrandMediaPanelProps) {
  return (
    <div
      className={cn("brand-media-panel", className)}
      data-brand-media
      data-brand-variant={variant}
    >
      {alt ? <span className="sr-only">{alt}</span> : null}
      <KineticImageMotion intensity="panel">
        <CinematicHeroSequence
          priority={priority}
          sizes={sizes}
          slides={slides}
          testId="brand-media-sequence"
        />
      </KineticImageMotion>
      <span className="brand-media-panel-shine" aria-hidden="true" />
    </div>
  );
}

export type { CinematicHeroSlide as BrandMediaSlide };
