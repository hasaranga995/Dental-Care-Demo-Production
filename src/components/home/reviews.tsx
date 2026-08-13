"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic-config";
import { cn } from "@/lib/utils";

const AUTOPLAY_INTERVAL_MS = 4000;

const TESTIMONIALS = [
  {
    name: "Ishara De Silva",
    treatment: "Invisalign & Whitening",
    quote:
      "The team made a two-year orthodontic journey feel effortless. Every visit was on time, painless, and the digital smile preview matched my results perfectly.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    name: "Rajiv Mendis",
    treatment: "Dental Implants",
    quote:
      "I was nervous about implant surgery, but the sedation options and the surgeon's chairside manner put me completely at ease. Zero downtime.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    name: "Chloé Fernando",
    treatment: "Pediatric Checkup",
    quote:
      "My daughter actually asks to go back! The pediatric suite is bright, playful, and the hygienists are incredibly patient with kids.",
    rating: 4,
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    name: "Tharindu Jayasuriya",
    treatment: "Full Smile Makeover",
    quote:
      "From the first consult to my final veneers, everything felt boutique and precise. Friends keep asking where I got my smile done.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    name: "Malsha Gunasekara",
    treatment: "Root Canal Therapy",
    quote:
      "I expected pain — I got a calm, quiet appointment and was back at work the same afternoon. Truly modern dentistry.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    name: "Dinesh Abeysekera",
    treatment: "Wisdom Tooth Extraction",
    quote:
      "Clear pricing, same-day imaging, and a recovery plan that actually worked. I would recommend Dental Care to anyone.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    name: "Sanduni Wijesinghe",
    treatment: "Teeth Whitening",
    quote:
      "Professional whitening without the sensitivity I had elsewhere. The results looked natural — not fake white.",
    rating: 4,
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    name: "Harsha Bandara",
    treatment: "Orthodontic Aligners",
    quote:
      "Remote check-ins plus in-clinic precision made aligners fit my travel schedule. Smile progress was tracked every month.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    name: "Ashani Cooray",
    treatment: "Family Dentistry",
    quote:
      "Three generations of our family now come here. The staff remember our names and never rush a visit.",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
  },
] as const;

type Testimonial = (typeof TESTIMONIALS)[number];

function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < rating;
        return (
          <Star
            key={index}
            className={cn(
              "size-4",
              filled ? "fill-amber-400 text-amber-400" : "fill-transparent text-border"
            )}
          />
        );
      })}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article
      className={cn(
        "group relative flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-2xl bg-white p-7",
        "ring-1 ring-border/80",
        "shadow-[0_14px_40px_-28px_rgba(13,79,92,0.35)]",
        "transition-[box-shadow,ring-color,transform] duration-500 ease-out",
        "hover:-translate-y-1.5 hover:ring-brand-navy/25",
        "hover:shadow-[0_28px_55px_-30px_rgba(13,79,92,0.45)]"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-brand-navy/10 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className={cn(
            "relative flex size-11 items-center justify-center overflow-hidden rounded-xl",
            "bg-brand-navy/[0.06] text-brand-navy",
            "transition-transform duration-500 ease-out group-hover:scale-110"
          )}
        >
          <span
            aria-hidden
            className="absolute top-1/2 left-1/2 size-[160%] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-brand-navy transition-transform duration-500 ease-out group-hover:scale-100"
          />
          <Quote className="relative z-10 size-5 transition-colors duration-500 group-hover:text-white" />
        </div>
        <StarRating rating={testimonial.rating} />
      </div>

      <p className="relative mt-5 flex-1 font-heading text-[1.05rem] leading-relaxed text-foreground/90">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      <div className="relative mt-7 flex items-center gap-3 border-t border-border/70 pt-5">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-full shadow-md ring-2 ring-white">
          <Image
            src={testimonial.image}
            alt={testimonial.name}
            fill
            sizes="48px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{testimonial.name}</p>
          <span className="mt-1.5 inline-flex rounded-full bg-brand-navy/8 px-2.5 py-0.5 text-[11px] font-semibold text-brand-navy">
            {testimonial.treatment}
          </span>
        </div>
      </div>

      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-brand-navy transition-transform duration-500 ease-out group-hover:scale-x-100"
      />
    </article>
  );
}

function useVisibleCount() {
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    function update() {
      if (window.matchMedia("(max-width: 767px)").matches) setVisible(1);
      else if (window.matchMedia("(max-width: 1279px)").matches) setVisible(2);
      else setVisible(3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return visible;
}

export function Reviews() {
  const visible = useVisibleCount();
  const total = TESTIMONIALS.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [skipTransition, setSkipTransition] = useState(false);
  const [stepPx, setStepPx] = useState(0);

  const track = [...TESTIMONIALS, ...TESTIMONIALS];
  const gapPx = 20; // matches gap-5

  useEffect(() => {
    function measure() {
      const width = containerRef.current?.offsetWidth ?? 0;
      if (width <= 0) return;
      const cardWidth = (width - gapPx * (visible - 1)) / visible;
      setStepPx(cardWidth + gapPx);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [visible, gapPx]);

  const goNext = useCallback(() => {
    setIndex((current) => current + 1);
  }, []);

  const goPrev = useCallback(() => {
    setIndex((current) => {
      if (current <= 0) return total - 1;
      return current - 1;
    });
  }, [total]);

  function handleSlideComplete() {
    if (index < total) return;
    setSkipTransition(true);
    setIndex((current) => current - total);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSkipTransition(false));
    });
  }

  useEffect(() => {
    if (total <= visible || isPaused) return;
    const id = setInterval(goNext, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [total, visible, isPaused, goNext]);

  useEffect(() => {
    setIndex((current) => current % total);
  }, [visible, total]);

  function handlePointerEnter(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse") setIsPaused(true);
  }
  function handlePointerLeave(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse") setIsPaused(false);
  }

  return (
    <section className="section-padding bg-white">
      <div className="page-container">
        <div className="flex flex-col items-center gap-3 text-center">
          <Badge variant="secondary" className="h-auto px-4 py-1.5 text-sm font-semibold">
            Patient Stories
          </Badge>
          <h2>Loved by Patients Across the World</h2>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm shadow-sm">
            <span className="font-heading text-lg font-bold text-foreground">
              {CLINIC.googleRating.score}
            </span>
            <StarRating rating={5} />
            <span className="text-muted-foreground">
              {CLINIC.googleRating.count.toLocaleString()} Google reviews
            </span>
          </div>
        </div>

        <div
          className="relative mt-12"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          aria-roledescription="carousel"
          aria-label="Patient testimonials"
        >
          <div ref={containerRef} className="overflow-hidden">
            <motion.div
              className="flex gap-5"
              animate={{ x: stepPx ? -index * stepPx : 0 }}
              transition={
                skipTransition
                  ? { duration: 0 }
                  : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              }
              onAnimationComplete={handleSlideComplete}
            >
              {track.map((testimonial, trackIndex) => (
                <div
                  key={`${testimonial.name}-${trackIndex}`}
                  className="shrink-0"
                  style={{
                    width: stepPx
                      ? stepPx - gapPx
                      : `calc((100% - ${(visible - 1) * gapPx}px) / ${visible})`,
                  }}
                >
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </motion.div>
          </div>

          {total > visible && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={goPrev}
                aria-label="Previous testimonial"
                className="absolute top-1/2 left-0 z-10 hidden size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-border/80 bg-white text-primary shadow-lg shadow-primary/10 transition-all duration-300 hover:-translate-x-1/2 hover:scale-105 hover:border-brand-navy/40 hover:bg-brand-navy hover:text-white hover:shadow-brand-navy/25 sm:inline-flex lg:-translate-x-3 lg:hover:-translate-x-3"
              >
                <ChevronLeft className="size-5" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={goNext}
                aria-label="Next testimonial"
                className="absolute top-1/2 right-0 z-10 hidden size-11 translate-x-1/2 -translate-y-1/2 rounded-full border-border/80 bg-white text-primary shadow-lg shadow-primary/10 transition-all duration-300 hover:translate-x-1/2 hover:scale-105 hover:border-brand-navy/40 hover:bg-brand-navy hover:text-white hover:shadow-brand-navy/25 sm:inline-flex lg:translate-x-3 lg:hover:translate-x-3"
              >
                <ChevronRight className="size-5" />
              </Button>

              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-secondary/80 p-1.5 shadow-sm backdrop-blur-sm">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={goPrev}
                    aria-label="Previous testimonial"
                    className="size-9 rounded-full text-primary hover:bg-white hover:text-brand-navy hover:shadow-sm sm:hidden"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  <div className="flex items-center gap-1.5 px-2">
                    {TESTIMONIALS.map((testimonial, dotIndex) => {
                      const active = index % total === dotIndex;
                      return (
                        <button
                          key={testimonial.name}
                          type="button"
                          aria-label={`Go to ${testimonial.name}'s review`}
                          aria-current={active ? "true" : undefined}
                          onClick={() => setIndex(dotIndex)}
                          className={cn(
                            "relative h-2.5 rounded-full transition-all duration-300 ease-out",
                            active
                              ? "w-8 bg-brand-navy shadow-[0_0_12px_rgba(13,79,92,0.35)]"
                              : "w-2.5 bg-primary/20 hover:bg-primary/40"
                          )}
                        >
                          {active && (
                            <span className="absolute inset-0 animate-pulse rounded-full bg-white/30" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={goNext}
                    aria-label="Next testimonial"
                    className="size-9 rounded-full text-primary hover:bg-white hover:text-brand-navy hover:shadow-sm sm:hidden"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>

                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {(index % total) + 1} <span className="text-border">/</span> {total}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
