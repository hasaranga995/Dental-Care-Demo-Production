"use client";

import {
  Award,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Syringe,
} from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { TechShowcase } from "@/components/about/tech-showcase";
import { BookOrCallButton } from "@/components/demo/feature-gate";
import { CLINIC } from "@/lib/clinic-config";
import { cn } from "@/lib/utils";

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Uncompromising Safety",
    description:
      "Autoclave-sterilized instruments per patient and UV-sanitized rooms between every visit.",
  },
  {
    icon: Sparkles,
    title: "Modern Technology",
    description:
      "Guided digital workflows — CBCT, intraoral scanning, lasers, and CAD/CAM — reducing recovery time.",
  },
  {
    icon: HeartHandshake,
    title: "Patient-First Culture",
    description:
      "Unhurried appointments, transparent pricing, and financing that never treats you like a number.",
  },
];

const STERILIZATION_STEPS = [
  {
    title: "Pre-Cleaning & Inspection",
    description: "Every instrument is manually inspected and pre-cleaned immediately after use.",
  },
  {
    title: "Ultrasonic Decontamination",
    description: "Ultrasonic cleaning removes organic debris before hospital-grade sterilization.",
  },
  {
    title: "Class B Autoclave",
    description: "Instruments are sterilized at 134°C, verified with weekly biological indicators.",
  },
  {
    title: "Sealed, Dated Storage",
    description: "Sterilized kits are sealed, dated, and tracked per patient for full traceability.",
  },
];

export function AboutView() {
  return (
    <div className="bg-[#F4FAF9]">
      <TechShowcase />

      <section className="page-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <FadeIn>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Our story</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
              A private hospital built around trust, not throughput.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {CLINIC.legalName} was founded on a simple idea: exceptional dental care shouldn&apos;t
              feel cold. We combined hospital-grade safety with boutique hospitality so specialists
              can work with digital precision while patients never feel rushed.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              From 3D diagnostics to same-day ceramic milling, every platform in our suites exists
              to reduce guesswork, discomfort, and recovery — without sacrificing the human
              conversation at the heart of care.
            </p>
          </FadeIn>

          <div className="space-y-4">
            {PILLARS.map((pillar, index) => (
              <FadeIn key={pillar.title} delay={index * 0.08}>
                <article className="group rounded-2xl border border-white/60 bg-white/55 p-5 shadow-sm backdrop-blur-xl transition hover:border-teal-400/50 hover:shadow-lg hover:shadow-teal-500/10">
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                      <pillar.icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {pillar.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0D4F5C] py-16 text-white sm:py-20">
        <div className="page-container">
          <FadeIn>
            <div className="flex items-start gap-3">
              <Syringe className="mt-1 size-7 shrink-0 text-teal-300" />
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-teal-200 uppercase">
                  Infection control
                </p>
                <h2 className="mt-2 font-heading text-3xl font-semibold !text-white sm:text-4xl">
                  4-step sterilization protocol
                </h2>
                <p className="mt-3 max-w-2xl text-white/75">
                  Hospital-grade CDC and ISO guidelines, logged per patient — never an afterthought.
                </p>
              </div>
            </div>
          </FadeIn>

          <ol className="relative mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <span
              aria-hidden
              className="pointer-events-none absolute top-8 right-8 left-8 hidden h-px bg-gradient-to-r from-amber-300/0 via-amber-200/50 to-amber-300/0 lg:block"
            />
            {STERILIZATION_STEPS.map((step, index) => (
              <FadeIn key={step.title} delay={index * 0.08}>
                <li className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:border-teal-400/50 hover:shadow-lg hover:shadow-teal-400/10">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-teal-300 font-heading text-sm font-bold text-[#0D4F5C] shadow-[0_0_20px_rgba(94,200,192,0.45)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{step.description}</p>
                </li>
              </FadeIn>
            ))}
          </ol>
        </div>
      </section>

      <section className="page-container py-16 sm:py-20">
        <FadeIn>
          <div className="flex items-center gap-3">
            <Award className="size-7 text-amber-500" />
            <h2 className="font-heading text-3xl font-semibold text-foreground">Accreditations</h2>
          </div>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Independent standards that back every sterilizer cycle, specialist credential, and
            clinical protocol.
          </p>
        </FadeIn>

        <div className="mt-8 flex flex-wrap gap-3">
          {CLINIC.accreditations.map((item) => (
            <span
              key={item}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-md"
              )}
            >
              <Award className="size-4 text-amber-500" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="page-container pb-16 sm:pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0D4F5C] via-[#14666F] to-[#1A7A84] px-6 py-12 text-center text-white sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-amber-300/20 blur-3xl"
          />
          <h2 className="relative font-heading text-3xl font-semibold !text-white sm:text-4xl">
            Ready to experience hospital-grade precision?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">
            Book a consultation with a {CLINIC.name} specialist and see boutique care backed by
            certified diagnostics, sterilization, and same-day digital dentistry.
          </p>
          <BookOrCallButton
            size="lg"
            variant="accent"
            className="relative mt-6"
            bookLabel="Book an appointment"
            callLabel="Call to book"
          />
        </div>
      </section>
    </div>
  );
}
