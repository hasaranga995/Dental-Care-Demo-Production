"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TECH_AUTOPLAY_MS, TECH_SLIDES } from "@/lib/about/tech-slides";
import { cn } from "@/lib/utils";

const SHOWCASE_STATS = [
  { value: "10,000+", label: "Happy Patient Smiles" },
  { value: "99.8%", label: "Diagnostic Precision" },
];

export function TechShowcase() {
  const [index, setIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const reduceMotion = useReducedMotion();
  const count = TECH_SLIDES.length;
  const active = TECH_SLIDES[index];
  const Icon = active.icon;

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
      setProgressKey((key) => key + 1);
    },
    [count]
  );

  // Continuous autoplay from first paint — never paused by hover or a control.
  useEffect(() => {
    if (count <= 1 || reduceMotion) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % count);
      setProgressKey((key) => key + 1);
    }, TECH_AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, reduceMotion]);

  return (
    <section aria-label="Modern medical technology showcase" className="relative isolate overflow-hidden">
      <div className="relative min-h-[32rem] w-full sm:min-h-[36rem] lg:min-h-[38rem]">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={active.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.8, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0"
              initial={reduceMotion ? false : { scale: 1 }}
              animate={reduceMotion ? { scale: 1 } : { scale: 1.08 }}
              transition={{ duration: TECH_AUTOPLAY_MS / 1000, ease: "linear" }}
            >
              <Image
                src={active.image}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />
          </motion.div>
        </AnimatePresence>

        <div className="page-container relative z-10 flex min-h-[32rem] flex-col justify-between py-10 sm:min-h-[36rem] sm:py-14 lg:min-h-[38rem]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-teal-100 uppercase backdrop-blur-md">
              Hospital-Grade Excellence • JCI & ISO Certified
            </span>
            <p className="mt-4 text-xs font-semibold tracking-[0.22em] text-teal-300 uppercase">
              Modern medical technology
            </p>
            <h1 className="mt-3 max-w-2xl font-heading text-3xl font-semibold !text-white sm:text-4xl lg:text-5xl">
              Hospital-grade machinery, designed around your comfort.
            </h1>
            <div className="mt-6 grid max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SHOWCASE_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <p className="font-heading text-2xl font-semibold text-amber-200">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-white/75 sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-xl"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-200 uppercase backdrop-blur-md">
                  <Icon className="size-3.5" />
                  {active.tagline}
                </span>
                <h3 className="mt-4 font-heading text-2xl font-semibold text-white sm:text-3xl">
                  {active.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-white/80 sm:text-lg">
                  {active.description}
                </p>
                <p className="mt-5 inline-flex rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-sm font-semibold text-teal-200">
                  {active.stats}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col gap-3">
              <div
                className="flex flex-wrap gap-2 lg:flex-col"
                role="tablist"
                aria-label="Technology platforms"
              >
                {TECH_SLIDES.map((slide, slideIndex) => {
                  const TabIcon = slide.icon;
                  const isActive = slideIndex === index;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => goTo(slideIndex)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3.5 py-2 text-left text-sm font-medium backdrop-blur-md transition",
                        isActive
                          ? "border-teal-300/50 bg-white/15 text-white shadow-[0_0_24px_-8px_rgba(94,200,192,0.7)]"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <TabIcon className="size-4 shrink-0" />
                      <span className="line-clamp-1">
                        {slide.title.replace(" & AI Diagnostics", "")}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                  aria-label="Previous technology"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                  aria-label="Next technology"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-white/10">
          {!reduceMotion ? (
            <motion.div
              key={progressKey}
              className="h-full origin-left bg-gradient-to-r from-teal-300 to-amber-300"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: TECH_AUTOPLAY_MS / 1000, ease: "linear" }}
            />
          ) : (
            <div
              className="h-full bg-teal-300/70"
              style={{ width: `${((index + 1) / count) * 100}%` }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
