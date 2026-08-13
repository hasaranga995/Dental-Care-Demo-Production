"use client";

import { useReducedMotion } from "framer-motion";

const BUBBLES = [
  { className: "why-bubble why-bubble--1" },
  { className: "why-bubble why-bubble--2" },
  { className: "why-bubble why-bubble--3" },
  { className: "why-bubble why-bubble--4" },
  { className: "why-bubble why-bubble--5" },
  { className: "why-bubble why-bubble--6" },
  { className: "why-bubble why-bubble--7" },
  { className: "why-bubble why-bubble--8" },
  { className: "why-bubble why-bubble--9" },
  { className: "why-bubble why-bubble--10" },
  { className: "why-bubble why-bubble--11" },
  { className: "why-bubble why-bubble--12" },
];

/**
 * White backdrop with dark floating bubbles for Why Dental Care.
 */
export function WhyAmbientBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="why-ambient" aria-hidden>
      <div className="why-ambient__base" />

      {BUBBLES.map((bubble) => (
        <span
          key={bubble.className}
          className={`${bubble.className}${reduceMotion ? " why-bubble--static" : ""}`}
        />
      ))}
    </div>
  );
}
