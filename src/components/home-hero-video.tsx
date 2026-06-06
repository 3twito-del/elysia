"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.preload = "auto";
    video.muted = true;
    video.load();
    void video.play().catch(() => {
      // Browsers may still block autoplay in edge cases; the eager load remains.
    });
  }, []);

  return (
    <video
      aria-hidden="true"
      autoPlay
      className={className}
      disablePictureInPicture
      loop
      muted
      playsInline
      poster={posterSrc}
      preload="auto"
      ref={videoRef}
    >
      <source src={webmSrc} type="video/webm" />
      <source src={mp4Src} type="video/mp4" />
    </video>
  );
}
