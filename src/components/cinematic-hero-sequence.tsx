"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

import { useResolvedReducedMotion } from "~/components/motion-preference";
import { cn } from "~/lib/utils";

export type CinematicHeroSlide = {
  alt: string;
  src: string;
};

type CinematicHeroSequenceProps = {
  className?: string;
  motionScope?: "home-hero" | "static";
  priority?: boolean;
  sizes?: string;
  slides: CinematicHeroSlide[];
  testId?: string;
};

export function CinematicHeroSequence({
  className,
  motionScope = "static",
  priority = true,
  sizes = "100vw",
  slides,
  testId = "cinematic-hero-sequence",
}: CinematicHeroSequenceProps) {
  const shouldReduceMotion = useResolvedReducedMotion();
  const allowsContinuousMotion = motionScope === "home-hero";
  const rootRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bandRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let context: { revert: () => void } | null = null;
    let isCancelled = false;
    const root = rootRef.current;
    const slideNodes = slideRefs.current.filter(isDefined);
    const bandNodes = bandRefs.current.filter(isDefined);
    const firstSlide = slideNodes[0];

    if (!root || !firstSlide) return;

    if (
      !allowsContinuousMotion ||
      shouldReduceMotion ||
      slideNodes.length === 1
    ) {
      slideNodes.forEach((slide, index) => {
        slide.style.removeProperty("transform");
        slide.style.opacity = index === 0 ? "1" : "0";
        slide.style.zIndex = index === 0 ? "2" : "1";
      });
      bandNodes.forEach((band) => {
        band.style.removeProperty("transform");
        band.style.opacity = "0.34";
      });

      return;
    }

    void import("gsap").then(({ gsap }) => {
      if (isCancelled || !root.isConnected) return;

      context = gsap.context(() => {
        gsap.set(slideNodes, {
          opacity: 0,
          scale: 1.045,
          transformOrigin: "center center",
          zIndex: 1,
        });
        gsap.set(firstSlide, { opacity: 1, scale: 1.018, zIndex: 2 });
        gsap.set(bandNodes, { opacity: 0.26, xPercent: 0 });

        const timeline = gsap.timeline({ repeat: -1 });
        const holdDuration = 6.1;
        const fadeDuration = 1.55;

        slideNodes.forEach((slide, index) => {
          const nextSlide = slideNodes[(index + 1) % slideNodes.length];

          if (!nextSlide) return;

          const panX = index % 2 === 0 ? -1.6 : 1.4;
          const nextPanX = index % 2 === 0 ? 1.1 : -1.3;
          const sequenceStart = timeline.duration();

          timeline
            .set(slide, { zIndex: 2 }, sequenceStart)
            .to(
              slide,
              {
                duration: holdDuration + fadeDuration,
                ease: "none",
                scale: 1.075,
                xPercent: panX,
                yPercent: index === 1 ? -0.8 : 0.7,
              },
              sequenceStart,
            )
            .set(
              nextSlide,
              {
                opacity: 0,
                scale: 1.045,
                xPercent: nextPanX,
                yPercent: index === 0 ? 0.9 : -0.6,
                zIndex: 3,
              },
              sequenceStart + holdDuration,
            )
            .to(
              nextSlide,
              {
                duration: fadeDuration,
                ease: "power2.inOut",
                opacity: 1,
                scale: 1.022,
                xPercent: 0,
                yPercent: 0,
              },
              sequenceStart + holdDuration,
            )
            .to(
              slide,
              {
                duration: fadeDuration,
                ease: "power2.inOut",
                opacity: 0,
              },
              sequenceStart + holdDuration,
            )
            .set(
              slide,
              { zIndex: 1 },
              sequenceStart + holdDuration + fadeDuration,
            );
        });

        gsap
          .timeline({ repeat: -1, yoyo: true })
          .to(bandNodes, {
            duration: 8.4,
            ease: "sine.inOut",
            opacity: 0.5,
            stagger: 0.9,
            xPercent: 10,
            yPercent: -4,
          })
          .to(bandNodes, {
            duration: 8,
            ease: "sine.inOut",
            opacity: 0.22,
            stagger: 0.7,
            xPercent: -8,
            yPercent: 3,
          });
      }, root);
    });

    return () => {
      isCancelled = true;
      context?.revert();
    };
  }, [allowsContinuousMotion, shouldReduceMotion, slides.length]);

  return (
    <div
      aria-hidden="true"
      className={cn("cinematic-hero-sequence", className)}
      data-motion-continuous={allowsContinuousMotion && !shouldReduceMotion}
      data-motion-reduced={shouldReduceMotion}
      data-motion-scope={motionScope}
      data-testid={testId}
      ref={rootRef}
    >
      {slides.map((slide, index) => (
        <div
          className={cn(
            "cinematic-hero-slide",
            index === 0 ? "opacity-100" : "opacity-0",
          )}
          key={`${slide.src}-${index}`}
          ref={(node) => {
            slideRefs.current[index] = node;
          }}
          style={getInitialSlideStyle(
            index,
            allowsContinuousMotion,
            shouldReduceMotion,
          )}
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
      <span
        className="cinematic-hero-band cinematic-hero-band-a"
        ref={(node) => {
          bandRefs.current[0] = node;
        }}
      />
      <span
        className="cinematic-hero-band cinematic-hero-band-b"
        ref={(node) => {
          bandRefs.current[1] = node;
        }}
      />
      <span className="cinematic-hero-vignette" />
    </div>
  );
}

function getInitialSlideStyle(
  index: number,
  allowsContinuousMotion: boolean,
  shouldReduceMotion: boolean,
): CSSProperties | undefined {
  if (!allowsContinuousMotion || shouldReduceMotion) return undefined;

  return {
    opacity: index === 0 ? 1 : 0,
    transform: `scale(${index === 0 ? 1.018 : 1.045})`,
    transformOrigin: "center center",
    zIndex: index === 0 ? 2 : 1,
  };
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}
