"use client";

import { useEffect, useRef, useState } from "react";

type DeferredFixedBackgroundBandProps = {
  className?: string;
  id?: string;
};

export function DeferredFixedBackgroundBand({
  className,
  id,
}: DeferredFixedBackgroundBandProps) {
  const bandRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const band = bandRef.current;

    if (!band || isLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        setIsLoaded(true);
        observer.disconnect();
      },
      { rootMargin: "900px 0px" },
    );

    observer.observe(band);

    return () => observer.disconnect();
  }, [isLoaded]);

  return (
    <div
      aria-hidden="true"
      className={className}
      data-fixed-bg-loaded={isLoaded ? "true" : "false"}
      id={id}
      ref={bandRef}
    />
  );
}
