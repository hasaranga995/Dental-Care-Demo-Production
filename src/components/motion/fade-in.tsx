"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Vertical offset (px) the content animates in from. */
  y?: number;
}

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Lightweight scroll-reveal wrapper used across the marketing site. Animates
 * once when the element enters the viewport, respecting reduced-motion
 * preferences via Framer Motion's default behavior.
 */
export function FadeIn({ children, className, delay = 0, y = 24 }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export { variants as fadeInVariants };
