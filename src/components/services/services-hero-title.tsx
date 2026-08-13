"use client";

import { motion, useReducedMotion } from "framer-motion";

const WORDS = ["Treatments", "Tailored", "to", "Your", "Smile"] as const;

export function ServicesHeroTitle() {
  const reduceMotion = useReducedMotion();

  return (
    <h1 className="text-balance font-heading text-3xl font-semibold !text-white [text-shadow:0_2px_24px_rgba(7,24,32,0.55)] sm:text-4xl md:text-5xl">
      {WORDS.map((word, index) => (
        <motion.span
          key={word}
          className="inline-block"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.55,
            delay: reduceMotion ? 0 : 0.12 + index * 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
          {index < WORDS.length - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </h1>
  );
}
