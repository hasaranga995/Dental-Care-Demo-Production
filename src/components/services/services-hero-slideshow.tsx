"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SLIDES = [
  "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=2000&q=80",
] as const;

const INTERVAL_MS = 7000;

export function ServicesHeroSlideshow({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const active = SLIDES[index];

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden>
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={active}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 1.1, ease: "easeInOut" }}
          >
            <Image
              src={active}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#071820]/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#071820]/25 via-transparent to-[#071820]/45" />
      </div>
      <div className="page-container relative py-16 text-center sm:py-20 lg:py-24">
        {children}
      </div>
    </section>
  );
}
