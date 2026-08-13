"use client";

import { useMemo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RollingNumberProps {
  /** Final numeric value to reveal. */
  value: number;
  /** Digits after the decimal point (e.g. 1 for 4.9). */
  decimals?: number;
  /** Text shown before the number. */
  prefix?: string;
  /** Text shown after the number (e.g. "+", "%", "★"). */
  suffix?: string;
  /** Format with thousand separators (18,500). */
  format?: boolean;
  /** Base duration for each digit roll (ms). Higher place values run longer. */
  durationMs?: number;
  className?: string;
}

function formatTarget(value: number, decimals: number, format: boolean): string {
  if (decimals > 0) {
    return value.toFixed(decimals);
  }

  const rounded = Math.round(value);
  return format ? rounded.toLocaleString("en-US") : String(rounded);
}

/** Build a tall reel: full loops, then land on the target digit. */
function buildReel(target: number, loops: number): number[] {
  const reel: number[] = [];
  for (let loop = 0; loop < loops; loop += 1) {
    for (let digit = 0; digit <= 9; digit += 1) {
      reel.push(digit);
    }
  }
  for (let digit = 0; digit <= target; digit += 1) {
    reel.push(digit);
  }
  return reel;
}

function RollingDigit({
  digit,
  placeIndex,
  totalDigits,
  durationMs,
  reduceMotion,
  isInView,
}: {
  digit: string;
  placeIndex: number;
  totalDigits: number;
  durationMs: number;
  reduceMotion: boolean | null;
  isInView: boolean;
}) {
  const target = Number(digit);
  // Higher place values (left) spin through more revolutions — classic odometer feel
  const loops = 2 + (totalDigits - 1 - placeIndex);
  const reel = useMemo(() => buildReel(target, loops), [target, loops]);
  const distanceEm = (reel.length - 1) * 1.1;
  const duration = (durationMs + placeIndex * 280) / 1000;
  const delay = 0.12 + placeIndex * 0.16;

  if (reduceMotion) {
    return <span className="inline-block w-[0.65em] text-center">{digit}</span>;
  }

  return (
    <span
      className="relative inline-block h-[1.1em] w-[0.65em] overflow-hidden align-baseline"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
      }}
    >
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col will-change-transform"
        initial={{ y: "0em" }}
        animate={isInView ? { y: `-${distanceEm}em` } : { y: "0em" }}
        transition={{
          duration,
          delay,
          ease: [0.12, 0.8, 0.16, 1],
        }}
      >
        {reel.map((n, index) => (
          <span
            key={`${n}-${index}`}
            className="flex h-[1.1em] shrink-0 items-center justify-center"
          >
            {n}
          </span>
        ))}
      </motion.span>
      <span className="invisible">0</span>
    </span>
  );
}

/**
 * Industry-style odometer: each digit rolls through multiple revolutions
 * before settling, staggered left → right with a slow ease-out.
 */
export function RollingNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  format = false,
  durationMs = 2200,
  className,
}: RollingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();

  const characters = useMemo(
    () => formatTarget(value, decimals, format).split(""),
    [value, decimals, format]
  );

  const totalDigits = characters.filter((char) => char >= "0" && char <= "9").length;
  let digitIndex = 0;

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-baseline font-sans font-bold tracking-tight tabular-nums",
        className
      )}
      aria-label={`${prefix}${formatTarget(value, decimals, format)}${suffix}`}
    >
      {prefix && <span>{prefix}</span>}

      {characters.map((char, index) => {
        if (char >= "0" && char <= "9") {
          const placeIndex = digitIndex;
          digitIndex += 1;

          return (
            <RollingDigit
              key={`${index}-${char}`}
              digit={char}
              placeIndex={placeIndex}
              totalDigits={totalDigits}
              durationMs={durationMs}
              reduceMotion={reduceMotion}
              isInView={isInView}
            />
          );
        }

        return (
          <span key={`${index}-${char}`} className="inline-block px-[0.03em]">
            {char}
          </span>
        );
      })}

      {suffix && <span className="ml-[0.08em]">{suffix}</span>}
    </span>
  );
}

/** @deprecated Prefer RollingNumber — kept as alias for existing imports. */
export const CountUp = RollingNumber;
