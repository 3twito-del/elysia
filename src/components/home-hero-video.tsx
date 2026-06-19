"use client";

import { useEffect, useRef } from "react";

import { useResolvedReducedMotion } from "~/components/motion-preference";

type HomeHeroVideoProps = {
  className?: string;
  mp4Src: string;
  posterSrc: string;
  webmSrc: string;
};

export function HomeHeroVideo({
  className,
  mp4Src,
  posterSrc,
  webmSrc,
}: HomeHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useResolvedReducedMotion();

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    // Respect reduced-motion: keep the still poster instead of an
    // auto-playing, looping background video (WCAG 2.2.2).
    if (shouldReduceMotion) {
      video.pause();
      video.removeAttribute("autoplay");
      return;
    }

    video.preload = "auto";
    video.muted = true;
    video.load();
    void video.play().catch(() => {
      // Browsers may still block autoplay in edge cases; the eager load remains.
    });
  }, [shouldReduceMotion]);

  return (
    <video
      aria-hidden="true"
      autoPlay={!shouldReduceMotion}
      className={className}
      disablePictureInPicture
      loop
      muted
      playsInline
      poster={posterSrc}
      preload={shouldReduceMotion ? "none" : "auto"}
      ref={videoRef}
    >
      <source src={webmSrc} type="video/webm" />
      <source src={mp4Src} type="video/mp4" />
    </video>
  );
}
