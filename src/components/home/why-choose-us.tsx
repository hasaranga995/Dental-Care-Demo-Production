"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Clock3,
  HeartPulse,
  Microscope,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhyAmbientBackdrop } from "@/components/home/why-ambient-backdrop";
import { FeatureGate } from "@/components/demo/feature-gate";
import { CLINIC } from "@/lib/clinic-config";
import { cn } from "@/lib/utils";

interface Reason {
  icon: LucideIcon;
  title: string;
  description: string;
}

const REASONS: Reason[] = [
  {
    icon: ShieldCheck,
    title: "Hospital-grade safety",
    description:
      "Autoclave-verified sterilization and accredited clinical protocols on every visit.",
  },
  {
    icon: Microscope,
    title: "Precision diagnostics",
    description:
      "3D imaging and digital planning so your treatment is clear before it begins.",
  },
  {
    icon: HeartPulse,
    title: "Comfort-first care",
    description:
      "Calm suites, gentle techniques, and sedation options when you need them.",
  },
  {
    icon: Clock3,
    title: "Care when you need it",
    description:
      "Extended weekday hours and a 24/7 emergency line for urgent dental pain.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function ReasonCard({ reason, index }: { reason: Reason; index: number }) {
  const Icon = reason.icon;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="group relative flex flex-col items-center gap-4 text-center lg:items-start lg:text-left"
    >
      <div className="relative">
        {/* Soft halo pulse */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-3 rounded-3xl bg-brand-teal/15 opacity-0 blur-md transition-opacity duration-500",
            "group-hover:opacity-100",
            !reduceMotion && "why-icon-halo"
          )}
        />

        <div
          className={cn(
            "relative flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-background text-brand-teal",
            "shadow-[0_8px_24px_-12px_rgba(13,79,92,0.25)] ring-1 ring-border",
            "transition-transform duration-500 ease-out",
            "group-hover:scale-110"
          )}
        >
          {/* Fill expands from center */}
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 left-1/2 size-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-teal",
              "origin-center scale-0 transition-transform duration-500 ease-out",
              "group-hover:scale-100"
            )}
          />
          <Icon
            className="relative z-10 size-6 transition-colors duration-500 ease-out group-hover:text-white"
            aria-hidden
          />
        </div>

        <span
          aria-hidden
          className={cn(
            "absolute -bottom-2 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-brand-teal transition-[width] duration-500 ease-out",
            "group-hover:w-8",
            "lg:left-0 lg:translate-x-0"
          )}
        />
      </div>

      <div className="mt-2 space-y-2">
        <h3 className="font-heading text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-brand-navy">
          {reason.title}
        </h3>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground/70 lg:max-w-none">
          {reason.description}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Trust section with live ambient backdrop, staggered reveals,
 * and center-out icon fills on hover.
 */
export function WhyChooseUs() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="section-padding relative overflow-hidden border-y border-border bg-white">
      <WhyAmbientBackdrop />

      <div className="page-container relative z-[1]">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center"
        >
          <Badge variant="secondary" className="h-auto px-4 py-1.5 text-sm font-semibold">
            Why {CLINIC.name}
          </Badge>
          <h2>Care built around your comfort</h2>
          <p className="text-muted-foreground">
            Clear standards, calm visits, and specialists you can trust — from first consult to
            follow-up.
          </p>
        </motion.div>

        <div className="relative mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div
            aria-hidden
            className="absolute top-7 right-[8%] left-[8%] hidden h-px overflow-hidden lg:block"
          >
            <span className={cn("block h-full w-full bg-border", !reduceMotion && "why-connector")} />
          </div>

          {REASONS.map((reason, index) => (
            <ReasonCard key={reason.title} reason={reason} index={index} />
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
          className="mt-12 flex justify-center"
        >
          <FeatureGate feature="multiPage">
          <Button size="lg" variant="accent" render={<Link href="/about" />}>
            Learn More About Us
          </Button>
          </FeatureGate>
        </motion.div>
      </div>
    </section>
  );
}
