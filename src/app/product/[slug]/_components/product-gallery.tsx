"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type PointerEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Maximize2,
  ZoomIn,
  X,
} from "lucide-react";

import { useResolvedReducedMotion } from "~/components/motion-preference";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

type ProductGalleryProps = {
  className?: string;
  images: string[];
  productName: string;
};

type ThumbnailRefs = Array<HTMLButtonElement | null>;

const mainGalleryImageSizes =
  "(min-width: 1280px) 58vw, (min-width: 1024px) 54vw, 100vw";
const galleryThumbnailImageSizes =
  "(min-width: 1024px) 5.5rem, (min-width: 640px) 5rem, 4.5rem";
const integratedGallerySecondaryImageSizes =
  "(min-width: 1280px) 16vw, (min-width: 1024px) 14vw, 0px";
const hoverFinePointerQuery = "(hover: hover) and (pointer: fine)";

export function ProductGallery({
  className,
  images,
  productName,
}: ProductGalleryProps) {
  const galleryImages = Array.from(new Set(images)).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHoverZoomActive, setIsHoverZoomActive] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isViewerZoomed, setIsViewerZoomed] = useState(false);
  const galleryFrameRef = useRef<HTMLDivElement | null>(null);
  const viewerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const thumbnailRefs = useRef<ThumbnailRefs>([]);
  const viewerThumbnailRefs = useRef<ThumbnailRefs>([]);
  const shouldReduceMotion = useResolvedReducedMotion();
  const activeImageIndex = Math.min(activeIndex, galleryImages.length - 1);
  const activeImage = galleryImages[activeImageIndex];
  const activeImagePosition = activeImageIndex + 1;
  const galleryImageCount = galleryImages.length;
  const secondaryGalleryImages = getSecondaryGalleryImages({
    activeImageIndex,
    galleryImageCount,
  });
  const hiddenGalleryImageCount = Math.max(galleryImageCount - 3, 0);

  function activateThumbnail(
    nextIndex: number,
    options: {
      refs?: MutableRefObject<ThumbnailRefs>;
      shouldFocus?: boolean;
    } = {},
  ) {
    if (galleryImages.length === 0) return;

    const boundedIndex =
      (nextIndex + galleryImages.length) % galleryImages.length;

    setActiveIndex(boundedIndex);
    setIsViewerZoomed(false);

    if (options.shouldFocus && options.refs) {
      window.requestAnimationFrame(() => {
        options.refs?.current[boundedIndex]?.focus();
      });
    }
  }

  function handleThumbnailKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    refs: MutableRefObject<ThumbnailRefs>,
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
    activateThumbnail(nextIndex, { refs, shouldFocus: true });
  }

  function handleViewerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const nextKeyMap: Partial<Record<string, number>> = {
      ArrowDown: activeImageIndex + 1,
      ArrowRight: activeImageIndex + 1,
      ArrowLeft: activeImageIndex - 1,
      ArrowUp: activeImageIndex - 1,
      End: galleryImages.length - 1,
      Home: 0,
    };
    const nextIndex = nextKeyMap[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    activateThumbnail(nextIndex);
  }

  function handleViewerOpenChange(nextOpen: boolean) {
    setIsViewerOpen(nextOpen);
    resetGalleryHoverZoom();

    if (!nextOpen) {
      window.requestAnimationFrame(() => {
        viewerTriggerRef.current?.focus();
      });
    }
  }

  function canUseGalleryHoverZoom(event: PointerEvent<HTMLDivElement>) {
    if (shouldReduceMotion || event.pointerType === "touch") return false;

    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("[data-gallery-hover-zoom-exempt]")
    ) {
      return false;
    }

    return window.matchMedia(hoverFinePointerQuery).matches;
  }

  function syncGalleryHoverZoom(event: PointerEvent<HTMLDivElement>) {
    if (!canUseGalleryHoverZoom(event)) {
      resetGalleryHoverZoom(event.currentTarget);
      return;
    }

    const frame = event.currentTarget;
    const rect = frame.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) return;

    const originX = clamp(
      ((event.clientX - rect.left) / rect.width) * 100,
      8,
      92,
    );
    const originY = clamp(
      ((event.clientY - rect.top) / rect.height) * 100,
      8,
      92,
    );

    frame.style.setProperty("--gallery-hover-origin-x", `${originX}%`);
    frame.style.setProperty("--gallery-hover-origin-y", `${originY}%`);

    if (!isHoverZoomActive) {
      setIsHoverZoomActive(true);
    }
  }

  function resetGalleryHoverZoom(frame = galleryFrameRef.current) {
    frame?.style.setProperty("--gallery-hover-origin-x", "50%");
    frame?.style.setProperty("--gallery-hover-origin-y", "50%");
    setIsHoverZoomActive(false);
  }

  function openViewerFromSecondaryTile(index: number) {
    activateThumbnail(index);
    setIsViewerZoomed(false);
    setIsViewerOpen(true);
  }

  function renderSecondaryGalleryStack() {
    if (secondaryGalleryImages.length === 0) return null;

    return (
      <div
        aria-label="\u05ea\u05de\u05d5\u05e0\u05d5\u05ea \u05e0\u05d5\u05e1\u05e4\u05d5\u05ea \u05e9\u05dc \u05d4\u05ea\u05db\u05e9\u05d9\u05d8"
        className="product-gallery-secondary-stack hidden min-h-0 min-w-0 gap-3 lg:grid"
        data-testid="product-gallery-secondary-stack"
        dir="rtl"
      >
        {secondaryGalleryImages.map((index, tilePosition) => {
          const image = galleryImages[index];
          if (!image) return null;

          const isMoreImagesTile =
            hiddenGalleryImageCount > 0 &&
            tilePosition === secondaryGalleryImages.length - 1;

          return (
            <button
              aria-label={
                isMoreImagesTile
                  ? `\u05e4\u05ea\u05d9\u05d7\u05ea \u05e2\u05d5\u05d3 ${hiddenGalleryImageCount} \u05ea\u05de\u05d5\u05e0\u05d5\u05ea \u05e9\u05dc ${productName}`
                  : `\u05d4\u05e6\u05d2\u05ea \u05ea\u05de\u05d5\u05e0\u05d4 ${index + 1} \u05e9\u05dc ${productName}`
              }
              aria-pressed={activeImageIndex === index}
              className={cn(
                "product-gallery-secondary-tile motion-thumbnail-button group relative min-h-0 overflow-hidden rounded-md border transition focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none",
                isMoreImagesTile && "product-gallery-more-images-trigger",
              )}
              data-gallery-selected={
                activeImageIndex === index ? "true" : "false"
              }
              data-testid={
                isMoreImagesTile
                  ? "product-gallery-more-images-trigger"
                  : "product-gallery-secondary-tile"
              }
              key={`${image}-${index}`}
              onClick={() =>
                isMoreImagesTile
                  ? openViewerFromSecondaryTile(index)
                  : activateThumbnail(index)
              }
              type="button"
            >
              <Image
                alt=""
                className="media-color object-cover transition-transform duration-[700ms] ease-[var(--ease-motion-standard)] group-hover:scale-[1.018]"
                fill
                loading="lazy"
                sizes={integratedGallerySecondaryImageSizes}
                src={image}
              />
              {isMoreImagesTile ? (
                <span
                  aria-hidden="true"
                  className="product-gallery-more-images-veil absolute inset-0 grid place-items-center px-4 text-center"
                >
                  <span className="product-gallery-more-images-label rounded-full px-4 py-2 text-sm font-medium">
                    {"\u05e2\u05d5\u05d3"} {hiddenGalleryImageCount}{" "}
                    {"\u05ea\u05de\u05d5\u05e0\u05d5\u05ea"}
                  </span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  function renderThumbnailRail(input: {
    refs: MutableRefObject<ThumbnailRefs>;
    testId: string;
    thumbnailTestId: string;
  }) {
    if (galleryImageCount <= 1) return null;

    return (
      <div className="grid min-w-0 gap-2">
        <p
          className="text-muted-foreground text-xs"
          data-testid={`${input.testId}-summary`}
        >
          תמונה {activeImagePosition} מתוך {galleryImageCount}
        </p>
        <div
          aria-label="תמונות תכשיט"
          className="product-gallery-thumbnail-rail minimal-scroll flex max-w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1"
          data-testid={input.testId}
        >
          {galleryImages.map((image, index) => (
            <button
              aria-label={`הצגת תמונה ${index + 1} של ${productName}`}
              aria-current={activeImageIndex === index}
              aria-pressed={activeImageIndex === index}
              className={cn(
                "motion-thumbnail-button border-border bg-card relative aspect-[4/5] w-[4.5rem] shrink-0 overflow-hidden rounded-md border transition focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none sm:w-20 lg:w-[5.5rem]",
                activeImageIndex === index
                  ? "border-foreground ring-foreground ring-1"
                  : "hover:border-foreground/60",
              )}
              data-gallery-selected={
                activeImageIndex === index ? "true" : "false"
              }
              data-testid={input.thumbnailTestId}
              key={image}
              onClick={() => activateThumbnail(index)}
              onKeyDown={(event) =>
                handleThumbnailKeyDown(event, index, input.refs)
              }
              ref={(node) => {
                input.refs.current[index] = node;
              }}
              type="button"
            >
              <Image
                alt=""
                className="media-color object-cover"
                fill
                loading="lazy"
                sizes={galleryThumbnailImageSizes}
                src={image}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!activeImage) {
    return (
      <div className={cn("grid min-w-0 gap-4", className)}>
        <div
          className="brand-surface flex aspect-[4/5] items-center justify-center rounded-md p-8 text-center sm:aspect-[5/4] lg:aspect-[4/3]"
          data-testid="product-gallery-empty"
        >
          <div className="grid justify-items-center gap-4">
            <span className="border-border flex size-12 items-center justify-center rounded-full border">
              <ImageOff className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium">תמונת תכשיט תעלה בקרוב</p>
              <p className="text-muted-foreground mt-2 text-sm">
                פרטי התכשיט, המחיר וההתאמה עדיין מוצגים בעמוד.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={`גלריית תכשיט עבור ${productName}`}
      className={cn("grid min-w-0 gap-4", className)}
      role="group"
    >
      <div
        className="product-gallery-integrated-layout grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(9rem,0.36fr)] lg:gap-3"
        data-testid="product-gallery-integrated-layout"
        dir="rtl"
      >
        <div
          className="brand-gallery-frame product-gallery-main-frame relative aspect-[4/5] max-h-[min(82vh,46rem)] w-full min-w-0 overflow-hidden rounded-md bg-[var(--secondary)] sm:aspect-[5/4] lg:aspect-auto lg:max-h-none lg:min-h-[min(72vh,42rem)]"
          data-gallery-hover-zoom={isHoverZoomActive ? "true" : "false"}
          data-motion-gallery="product"
          data-testid="product-gallery"
          onPointerCancel={(event) =>
            resetGalleryHoverZoom(event.currentTarget)
          }
          onPointerEnter={syncGalleryHoverZoom}
          onPointerLeave={(event) => resetGalleryHoverZoom(event.currentTarget)}
          onPointerMove={syncGalleryHoverZoom}
          ref={galleryFrameRef}
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
              initial={
                shouldReduceMotion ? false : { opacity: 0, scale: 1.006 }
              }
              key={activeImage}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.38,
                ease: [0.2, 0, 0, 1],
              }}
            >
              <div
                className="product-gallery-hover-zoom-layer absolute inset-0"
                data-testid="product-gallery-hover-zoom-layer"
              >
                <Image
                  alt={`${productName}, תמונה ${activeImagePosition} מתוך ${galleryImageCount}`}
                  className="media-color product-gallery-hover-zoom-image object-cover"
                  fill
                  loading={activeImageIndex === 0 ? undefined : "lazy"}
                  priority={activeImageIndex === 0}
                  sizes={mainGalleryImageSizes}
                  src={activeImage}
                />
              </div>
            </motion.div>
          </AnimatePresence>
          {galleryImageCount > 1 ? (
            <Badge
              aria-live="polite"
              className="bg-background text-foreground absolute bottom-5 left-4 rounded-full px-3"
              data-testid="product-gallery-selection-status"
              variant="secondary"
            >
              <span className="sr-only">
                מוצגת תמונה {activeImagePosition} מתוך {galleryImageCount} של{" "}
                {productName}
              </span>
              <span aria-hidden="true">
                {activeImagePosition}/{galleryImageCount}
              </span>
            </Badge>
          ) : null}
          <Dialog open={isViewerOpen} onOpenChange={handleViewerOpenChange}>
            <div
              className="absolute right-4 bottom-5 z-10 flex gap-2 sm:top-4 sm:right-4 sm:bottom-auto"
              data-gallery-hover-zoom-exempt="true"
            >
              <DialogTrigger asChild>
                <Button
                  aria-label={`פתיחת גלריית מסך מלא עבור ${productName}`}
                  className="bg-background text-foreground hover:bg-background size-9 rounded-full p-0 shadow-sm"
                  data-icon-tooltip="מסך מלא"
                  data-testid="product-gallery-fullscreen-trigger"
                  onClick={(event) => {
                    viewerTriggerRef.current = event.currentTarget;
                    event.currentTarget.focus();
                    setIsViewerZoomed(false);
                  }}
                  type="button"
                  variant="secondary"
                >
                  <Maximize2 aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">מסך מלא</span>
                </Button>
              </DialogTrigger>
              <Button
                aria-label={`הגדלת תמונת התכשיט עבור ${productName}`}
                className="bg-background text-foreground hover:bg-background rounded-full shadow-sm sm:hidden"
                data-icon-tooltip="הגדלה"
                data-testid="product-gallery-touch-zoom-trigger"
                onClick={(event) => {
                  viewerTriggerRef.current = event.currentTarget;
                  event.currentTarget.focus();
                  setIsViewerZoomed(true);
                  setIsViewerOpen(true);
                }}
                size="icon-sm"
                type="button"
                variant="secondary"
              >
                <ZoomIn aria-hidden="true" className="size-4" />
                <span className="sr-only">הגדלה</span>
              </Button>
            </div>
            <DialogContent
              className="bg-background fixed !inset-0 !top-0 !left-0 z-[100] grid !h-[100dvh] !w-[100dvw] !max-w-none !translate-x-0 !translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden !rounded-none !border-0 !p-0 sm:!max-w-none"
              data-testid="product-gallery-fullscreen-dialog"
              dir="rtl"
              onKeyDown={handleViewerKeyDown}
              showCloseButton={false}
              style={{ animation: "none", transform: "none" }}
            >
              <DialogTitle className="sr-only">
                גלריית תמונות של {productName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                ניתן לעבור בין תמונות התכשיט ולחזור לעמוד המוצר.
              </DialogDescription>

              <div
                className="border-border flex h-14 items-center justify-between gap-3 border-b px-3 sm:px-5"
                dir="ltr"
              >
                <p
                  aria-live="polite"
                  className="text-muted-foreground min-w-0 truncate text-right text-sm"
                  data-testid="product-gallery-fullscreen-status"
                  dir="rtl"
                >
                  תמונה {activeImagePosition} מתוך {galleryImageCount} של{" "}
                  {productName}
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    aria-label={
                      isViewerZoomed
                        ? "ביטול הגדלת תמונת התכשיט"
                        : "הגדלת תמונת התכשיט"
                    }
                    aria-pressed={isViewerZoomed}
                    data-icon-tooltip={isViewerZoomed ? "ביטול הגדלה" : "הגדלה"}
                    data-testid="product-gallery-fullscreen-zoom-toggle"
                    onClick={() => setIsViewerZoomed((current) => !current)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <ZoomIn aria-hidden="true" className="size-4" />
                  </Button>
                  <DialogClose asChild>
                    <Button
                      aria-label="סגירת גלריית מסך מלא"
                      data-icon-tooltip="סגירה"
                      data-testid="product-gallery-fullscreen-close"
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <X aria-hidden="true" className="size-4" />
                    </Button>
                  </DialogClose>
                </div>
              </div>

              <div
                className={cn(
                  "relative box-border grid min-h-0 w-full max-w-[100dvw] min-w-0 place-items-center px-3 py-3 sm:px-16 sm:py-5",
                  isViewerZoomed
                    ? "overflow-auto overscroll-contain"
                    : "overflow-hidden",
                )}
                data-gallery-zoomed={isViewerZoomed ? "true" : "false"}
                data-testid="product-gallery-fullscreen-stage"
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "relative",
                      isViewerZoomed
                        ? "h-[140%] max-h-none min-h-[32rem] w-[140%] min-w-[32rem] sm:h-[125%] sm:min-h-[42rem] sm:w-[125%] sm:min-w-[42rem]"
                        : "h-full max-h-[calc(100dvh-10rem)] w-full",
                    )}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.996 }
                    }
                    initial={
                      shouldReduceMotion ? false : { opacity: 0, scale: 1.006 }
                    }
                    key={`viewer-${activeImage}`}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.28,
                      ease: [0.2, 0, 0, 1],
                    }}
                  >
                    <Image
                      alt={`${productName}, תמונה במסך מלא ${activeImagePosition} מתוך ${galleryImageCount}`}
                      className="media-color object-contain"
                      fill
                      sizes="100vw"
                      src={activeImage}
                    />
                  </motion.div>
                </AnimatePresence>

                {galleryImageCount > 1 ? (
                  <>
                    <Button
                      aria-label="התמונה הקודמת"
                      className="bg-background absolute top-1/2 right-5 -translate-y-1/2 rounded-full shadow-none sm:right-4"
                      data-testid="product-gallery-previous"
                      onClick={() => activateThumbnail(activeImageIndex - 1)}
                      size="icon-lg"
                      type="button"
                      variant="secondary"
                    >
                      <ChevronRight aria-hidden="true" className="size-5" />
                    </Button>
                    <Button
                      aria-label="התמונה הבאה"
                      className="bg-background absolute top-1/2 left-5 -translate-y-1/2 rounded-full shadow-none sm:left-4"
                      data-testid="product-gallery-next"
                      onClick={() => activateThumbnail(activeImageIndex + 1)}
                      size="icon-lg"
                      type="button"
                      variant="secondary"
                    >
                      <ChevronLeft aria-hidden="true" className="size-5" />
                    </Button>
                  </>
                ) : null}
              </div>

              <div className="border-border border-t px-3 py-3 sm:px-5">
                {renderThumbnailRail({
                  refs: viewerThumbnailRefs,
                  testId: "product-gallery-fullscreen-thumbnail-rail",
                  thumbnailTestId: "product-gallery-fullscreen-thumbnail",
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {renderSecondaryGalleryStack()}
      </div>

      <div className="min-w-0 lg:hidden">
        {renderThumbnailRail({
          refs: thumbnailRefs,
          testId: "product-gallery-thumbnail-rail",
          thumbnailTestId: "product-gallery-thumbnail",
        })}
      </div>
    </div>
  );
}

function getSecondaryGalleryImages(input: {
  activeImageIndex: number;
  galleryImageCount: number;
}) {
  if (input.galleryImageCount <= 1) return [];

  return Array.from({ length: input.galleryImageCount - 1 }, (_, offset) => {
    return (input.activeImageIndex + offset + 1) % input.galleryImageCount;
  }).slice(0, 2);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
