"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

import { useResolvedReducedMotion } from "~/components/motion-preference";
import { Button } from "~/components/ui/button";

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
  const [userPaused, setUserPaused] = useState(false);
  const shouldUsePosterOnly = useConnectionPosterPreference();
  const shouldKeepStill =
    shouldReduceMotion || shouldUsePosterOnly || userPaused;

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (shouldKeepStill) {
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
  }, [shouldKeepStill]);

  function togglePlayback() {
    setUserPaused((current) => !current);
  }

  return (
    <>
      <video
        aria-hidden="true"
        autoPlay={!shouldReduceMotion && !shouldUsePosterOnly && !userPaused}
        className={className}
        disablePictureInPicture
        draggable={false}
        loop
        muted
        playsInline
        poster={posterSrc}
        preload={shouldReduceMotion || shouldUsePosterOnly ? "none" : "auto"}
        ref={videoRef}
      >
        <source src={webmSrc} type="video/webm" />
        <source src={mp4Src} type="video/mp4" />
      </video>
      {!shouldReduceMotion && !shouldUsePosterOnly ? (
        <Button
          aria-label={userPaused ? "הפעלת וידאו הרקע" : "השהיית וידאו הרקע"}
          aria-pressed={userPaused}
          className="home-hero-video-control"
          data-testid="home-hero-video-control"
          onClick={togglePlayback}
          size="icon"
          type="button"
          variant="ghost"
        >
          {userPaused ? (
            <Play aria-hidden="true" className="size-4" />
          ) : (
            <Pause aria-hidden="true" className="size-4" />
          )}
        </Button>
      ) : null}
    </>
  );
}

function useConnectionPosterPreference() {
  return useSyncExternalStore(
    subscribeToConnectionPreference,
    getConnectionPosterPreference,
    getServerConnectionPosterPreference,
  );
}

function subscribeToConnectionPreference(onStoreChange: () => void) {
  const connection = getNavigatorConnection();
  const addEventListener = connection?.addEventListener;
  const removeEventListener = connection?.removeEventListener;

  if (
    !connection ||
    typeof addEventListener !== "function" ||
    typeof removeEventListener !== "function"
  ) {
    return noopConnectionSubscription;
  }

  addEventListener.call(connection, "change", onStoreChange);

  return () => {
    removeEventListener.call(connection, "change", onStoreChange);
  };
}

function noopConnectionSubscription() {
  return undefined;
}

function getConnectionPosterPreference() {
  const connection = getNavigatorConnection();

  return Boolean(
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g",
  );
}

function getServerConnectionPosterPreference() {
  return false;
}

function getNavigatorConnection(): NavigatorConnection | undefined {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return undefined;
  }

  return (
    navigator as Navigator & {
      connection?: NavigatorConnection;
    }
  ).connection;
}

type NavigatorConnection = {
  addEventListener?: (type: "change", listener: () => void) => void;
  effectiveType?: string;
  removeEventListener?: (type: "change", listener: () => void) => void;
  saveData?: boolean;
};
