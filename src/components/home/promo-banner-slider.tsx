"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Banner } from "@/db/schema";

const AUTOPLAY_INTERVAL_MS = 4000;

interface PromoBannerSliderProps {
  banners: Banner[];
  className?: string;
}

/**
 * Auto-playing promo/advertisement slideshow for the homepage and services
 * hub. Renders nothing when there are no active banners, so admins can
 * safely delete every banner without leaving a broken empty section.
 */
export function PromoBannerSlider({ banners, className }: PromoBannerSliderProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const count = banners.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  // A plain `setInterval` anchored once on mount (rather than a chain of
  // `setTimeout`s rescheduled on every `index` change) guarantees the
  // slideshow starts ticking the instant the component mounts — i.e. as
  // soon as the page loads — and keeps advancing continuously in the
  // background even while the section is scrolled out of view.
  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, isPaused]);

  // Only real mouse hover should pause autoplay. Touch devices fire
  // synthetic pointer/mouse "enter" events on tap without a matching
  // "leave" until the user taps elsewhere, which would otherwise leave
  // the slideshow stuck paused on mobile until they happened to interact
  // near it — exactly the "only plays once I scroll here" symptom.
  function handlePointerEnter(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse") setIsPaused(true);
  }
  function handlePointerLeave(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse") setIsPaused(false);
  }

  if (count === 0) return null;

  const active = banners[index];

  return (
    <section
      aria-label="Promotions and announcements"
      className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl shadow-lg shadow-primary/10 sm:aspect-16/6">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <BannerSlide banner={active} />
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-3 z-10 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={goPrev}
              aria-label="Previous banner"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-3 z-10 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={goNext}
              aria-label="Next banner"
            >
              <ChevronRight className="size-4" />
            </Button>

            <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to banner ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function BannerSlide({ banner }: { banner: Banner }) {
  const hasOverlayText = Boolean(banner.title || banner.subtitle || banner.ctaLabel);

  const content = (
    <>
      <Image
        src={banner.imageUrl}
        alt={banner.title || "Promotion"}
        fill
        priority
        sizes="(min-width: 1280px) 1280px, 100vw"
        className="object-cover"
      />
      {hasOverlayText && (
        <div className="absolute inset-0 flex flex-col items-start justify-center gap-2 bg-gradient-to-r from-black/65 via-black/25 to-transparent p-6 sm:p-10 md:p-14">
          {banner.title && (
            <h3 className="max-w-md font-heading text-2xl font-semibold text-white sm:text-3xl md:text-4xl">
              {banner.title}
            </h3>
          )}
          {banner.subtitle && (
            <p className="max-w-md text-sm text-white/90 sm:text-base">{banner.subtitle}</p>
          )}
          {banner.ctaLabel && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors group-hover:bg-brand-teal">
              {banner.ctaLabel}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (banner.ctaHref) {
    return (
      <Link href={banner.ctaHref} className="group relative block size-full">
        {content}
      </Link>
    );
  }

  return <div className="relative size-full">{content}</div>;
}
