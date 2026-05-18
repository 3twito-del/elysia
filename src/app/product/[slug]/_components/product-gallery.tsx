"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type KeyboardEvent } from "react";
import { ImageOff } from "lucide-react";

import { useResolvedReducedMotion } from "~/components/motion-preference";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type ProductGalleryProps = {
  className?: string;
  images: string[];
  productName: string;
};

export function ProductGallery({
  className,
  images,
  productName,
}: ProductGalleryProps) {
  const galleryImages = Array.from(new Set(images)).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const shouldReduceMotion = useResolvedReducedMotion();
  const activeImageIndex = Math.min(activeIndex, galleryImages.length - 1);
  const activeImage = galleryImages[activeImageIndex];

  function activateThumbnail(nextIndex: number, shouldFocus = false) {
    if (galleryImages.length === 0) return;

    const boundedIndex =
      (nextIndex + galleryImages.length) % galleryImages.length;

    setActiveIndex(boundedIndex);

    if (shouldFocus) {
      window.requestAnimationFrame(() => {
        thumbnailRefs.current[boundedIndex]?.focus();
      });
    }
  }

  function handleThumbnailKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const nextKeyMap: Partial<Record<string, number>> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      End: galleryImages.length - 1,
      Home: 0,
    };
    const nextIndex = nextKeyMap[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    activateThumbnail(nextIndex, true);
  }

  if (!activeImage) {
    return (
      <div className={cn("grid gap-4", className)}>
        <div
          className="brand-surface flex aspect-[4/5] items-center justify-center rounded-md p-8 text-center sm:aspect-[5/4] lg:aspect-[4/3]"
          data-testid="product-gallery-empty"
        >
          <div className="grid justify-items-center gap-4">
            <span className="border-border flex size-12 items-center justify-center rounded-full border">
              <ImageOff className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium">תמונת מוצר תעלה בקרוב</p>
              <p className="text-muted-foreground mt-2 text-sm">
                פרטי המוצר, המחיר והזמינות עדיין מוצגים בעמוד.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={`גלריית מוצר עבור ${productName}`}
      className={cn("grid gap-4", className)}
      role="group"
    >
      <div
        className="brand-gallery-frame relative aspect-[4/5] overflow-hidden rounded-md sm:aspect-[5/4] lg:aspect-[4/3]"
        data-motion-gallery="product"
        data-testid="product-gallery"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0"
            exit={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.996 }
            }
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.006 }}
            key={activeImage}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.38,
              ease: [0.2, 0, 0, 1],
            }}
          >
            <Image
              alt={productName}
              className="media-color object-cover"
              fill
              loading={activeImageIndex === 0 ? undefined : "lazy"}
              priority={activeImageIndex === 0}
              sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 54vw, 100vw"
              src={activeImage}
            />
          </motion.div>
        </AnimatePresence>
        {galleryImages.length > 1 ? (
          <Badge
            className="bg-background/90 text-foreground absolute bottom-4 left-4 rounded-full px-3 backdrop-blur"
            variant="secondary"
          >
            {activeImageIndex + 1}/{galleryImages.length}
          </Badge>
        ) : null}
      </div>

      {galleryImages.length > 1 ? (
        <div
          aria-label="תמונות מוצר"
          className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-4"
        >
          {galleryImages.map((image, index) => (
            <button
              aria-label={`הצגת תמונה ${index + 1} של ${productName}`}
              aria-current={activeImageIndex === index}
              aria-pressed={activeImageIndex === index}
              className={cn(
                "motion-thumbnail-button border-border bg-card relative aspect-[4/5] overflow-hidden rounded-md border transition focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none",
                activeImageIndex === index
                  ? "border-foreground ring-foreground ring-1"
                  : "hover:border-foreground/60",
              )}
              data-testid="product-gallery-thumbnail"
              key={image}
              onClick={() => activateThumbnail(index)}
              onKeyDown={(event) => handleThumbnailKeyDown(event, index)}
              ref={(node) => {
                thumbnailRefs.current[index] = node;
              }}
              type="button"
            >
              <Image
                alt=""
                className="media-color object-cover"
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 12vw, (min-width: 640px) 18vw, 24vw"
                src={image}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
