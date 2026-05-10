import type { CSSProperties, ReactNode } from "react";

import {
  FloatingAnchorNav,
  type FloatingAnchorItem,
} from "~/components/floating-anchor-nav";
import {
  CinematicHeroSequence,
  type CinematicHeroSlide,
} from "~/components/cinematic-hero-sequence";
import { MotionMediaFrame } from "~/components/motion-media-frame";
import { RevealSection } from "~/components/reveal";
import { cn } from "~/lib/utils";

type CinematicPageHeroStat = {
  label: string;
  value: ReactNode;
};

type CinematicPageHeroProps = {
  actions?: ReactNode;
  align?: "start" | "center";
  anchors?: FloatingAnchorItem[];
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  id?: string;
  mediaPriority?: boolean;
  slides: CinematicHeroSlide[];
  stats?: CinematicPageHeroStat[];
  title: ReactNode;
  variant?: "commerce" | "default" | "editorial" | "product" | "service";
};

export function CinematicPageHero({
  actions,
  align = "start",
  anchors = [],
  children,
  className,
  description,
  eyebrow,
  id = "page-hero",
  mediaPriority = true,
  slides,
  stats,
  title,
  variant = "default",
}: CinematicPageHeroProps) {
  return (
    <>
      <RevealSection
        className={cn("cinematic-page-hero", className)}
        data-hero-align={align}
        data-hero-variant={variant}
        data-testid="cinematic-page-hero"
        id={id}
        initialVisible
        variant="hero"
      >
        <MotionMediaFrame
          className="cinematic-page-hero-media"
          contentClassName="cinematic-page-hero-media-content"
          hover
          intensity="cinematic"
          parallax
        >
          <CinematicHeroSequence
            priority={mediaPriority}
            slides={slides}
            testId="cinematic-page-hero-sequence"
          />
        </MotionMediaFrame>
        <div className="cinematic-page-hero-scrim" />
        <div className="cinematic-page-hero-inner">
          <div className="cinematic-page-hero-copy motion-hero-copy">
            {eyebrow ? (
              <p
                className="cinematic-page-hero-eyebrow motion-copy-item"
                style={{ "--motion-copy-delay": "40ms" } as CSSProperties}
              >
                {eyebrow}
              </p>
            ) : null}
            <h1
              className="cinematic-page-hero-title motion-copy-item"
              style={{ "--motion-copy-delay": "90ms" } as CSSProperties}
            >
              {title}
            </h1>
            {description ? (
              <div
                className="cinematic-page-hero-description motion-copy-item"
                style={{ "--motion-copy-delay": "150ms" } as CSSProperties}
              >
                {description}
              </div>
            ) : null}
            {actions ? (
              <div
                className="cinematic-page-hero-actions motion-copy-item"
                style={{ "--motion-copy-delay": "210ms" } as CSSProperties}
              >
                {actions}
              </div>
            ) : null}
            {stats?.length ? (
              <dl
                className="cinematic-page-hero-stats motion-copy-item"
                style={{ "--motion-copy-delay": "270ms" } as CSSProperties}
              >
                {stats.map((stat) => (
                  <div className="cinematic-page-hero-stat" key={stat.label}>
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {children}
          </div>
        </div>
      </RevealSection>
      {anchors.length ? (
        <FloatingAnchorNav heroId={id} items={anchors} />
      ) : null}
    </>
  );
}
