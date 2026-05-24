import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

export type BrandMediaPanelVariant =
  | "category"
  | "commerce"
  | "compact"
  | "content"
  | "hero";

export type BrandMediaSlide = {
  alt: string;
  src: string;
};

type BrandMediaPanelProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  slides: BrandMediaSlide[];
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
      <StaticKineticImageFrame>
        <StaticCinematicHeroSequence
          priority={priority}
          sizes={sizes}
          slides={slides}
          testId="brand-media-sequence"
        />
      </StaticKineticImageFrame>
    </div>
  );
}

export function StaticKineticImageFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="kinetic-image-motion"
      data-kinetic-image
      data-motion-enabled="false"
      data-motion-reduced="false"
      data-motion-scope="static"
    >
      <div className="kinetic-image-layer">{children}</div>
    </div>
  );
}

export function StaticCinematicHeroSequence({
  motionScope = "static",
  priority = true,
  sizes = "100vw",
  slides,
  testId = "cinematic-hero-sequence",
}: {
  motionScope?: "home-hero" | "static";
  priority?: boolean;
  sizes?: string;
  slides: BrandMediaSlide[];
  testId?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("cinematic-hero-sequence")}
      data-motion-continuous="false"
      data-motion-reduced="false"
      data-motion-scope={motionScope}
      data-testid={testId}
    >
      {slides.map((slide, index) => (
        <div
          className={cn(
            "cinematic-hero-slide",
            index === 0 ? "opacity-100" : "opacity-0",
          )}
          key={`${slide.src}-${index}`}
        >
          <Image
            alt={slide.alt}
            className="cinematic-hero-image media-color-rich object-cover"
            fill
            loading={priority && index === 1 ? "eager" : undefined}
            priority={priority && index === 0}
            sizes={sizes}
            src={slide.src}
          />
        </div>
      ))}
      <span className="cinematic-hero-band cinematic-hero-band-a" />
      <span className="cinematic-hero-band cinematic-hero-band-b" />
      <span className="cinematic-hero-vignette" />
    </div>
  );
}
