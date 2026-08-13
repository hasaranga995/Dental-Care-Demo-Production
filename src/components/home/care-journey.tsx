import {
  Award,
  CalendarCheck,
  HeartHandshake,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/fade-in";
import { RollingNumber } from "@/components/motion/count-up";
import { BookOrCallButton } from "@/components/demo/feature-gate";
import { CLINIC } from "@/lib/clinic-config";

const STATS = [
  {
    icon: Award,
    value: 22,
    suffix: "+",
    label: "Years of Trusted Care",
  },
  {
    icon: Users,
    value: 18500,
    suffix: "+",
    format: true,
    label: "Smiles Treated",
  },
  {
    icon: Star,
    value: CLINIC.googleRating.score,
    decimals: 1,
    suffix: "★",
    label: "Google Rating",
  },
  {
    icon: HeartHandshake,
    value: 98,
    suffix: "%",
    label: "Patient Satisfaction",
  },
] as const;

const STEPS = [
  {
    icon: CalendarCheck,
    title: "Book Online",
    description: "Pick a service, doctor, and time that fits your schedule — in under two minutes.",
  },
  {
    icon: ScanEye,
    title: "Comprehensive Exam",
    description: "3D CT imaging and a thorough consultation inform a treatment plan built for you.",
  },
  {
    icon: Sparkles,
    title: "Personalized Treatment",
    description: "Board-certified specialists deliver care at your comfort pace, chairside.",
  },
  {
    icon: ShieldCheck,
    title: "Aftercare & Follow-Up",
    description: "We check in after every visit and stay reachable through your full recovery.",
  },
];

/**
 * Trust-building "how it works" segment — rolling digit stats on a colored band,
 * then the four-step patient journey.
 */
export function CareJourney() {
  return (
    <section className="section-padding border-t border-border bg-background">
      <div className="page-container">
        <div className="flex flex-col items-center gap-3 text-center">
          <Badge variant="secondary" className="h-auto px-4 py-1.5 text-sm font-semibold">
            How It Works
          </Badge>
          <h2>Your Care Journey, Simplified</h2>
          <p className="max-w-xl text-muted-foreground">
            From your first click to your last checkup, every step is designed around comfort,
            transparency, and outcomes you can trust.
          </p>
        </div>

        <div className="relative mt-12 overflow-hidden rounded-3xl bg-brand-navy text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,178,216,0.18)_0%,transparent_42%,rgba(0,178,216,0.1)_100%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-teal/70 to-transparent"
          />

          <div className="relative grid grid-cols-2 md:grid-cols-4">
            {STATS.map((stat, index) => (
              <div
                key={stat.label}
                className="relative flex flex-col items-center gap-4 px-5 py-10 text-center sm:px-6 sm:py-12"
              >
                {/* Vertical divider — inset from top/bottom edges */}
                {index % 2 === 1 && (
                  <span
                    aria-hidden
                    className="absolute top-[18%] bottom-[18%] left-0 w-px bg-white md:hidden"
                  />
                )}
                {index > 0 && (
                  <span
                    aria-hidden
                    className="absolute top-[18%] bottom-[18%] left-0 hidden w-px bg-white md:block"
                  />
                )}
                {/* Horizontal divider on mobile — inset from left/right */}
                {index >= 2 && (
                  <span
                    aria-hidden
                    className="absolute top-0 right-[12%] left-[12%] h-px bg-white md:hidden"
                  />
                )}

                <FadeIn delay={index * 0.1}>
                  <div className="flex flex-col items-center gap-4">
                    <stat.icon
                      className="size-6 text-white sm:size-7"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <p className="font-sans text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl md:text-[2.75rem]">
                      <RollingNumber
                        value={stat.value}
                        decimals={"decimals" in stat ? stat.decimals : 0}
                        suffix={stat.suffix}
                        format={"format" in stat ? stat.format : false}
                        durationMs={2400}
                      />
                    </p>
                    <p className="max-w-[11rem] text-xs leading-relaxed text-white/60 sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                </FadeIn>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:gap-6">
          <div
            aria-hidden
            className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-px bg-border lg:block"
          />
          {STEPS.map((step, index) => (
            <FadeIn key={step.title} delay={index * 0.1}>
              <div className="relative flex flex-col items-center gap-3 text-center">
                <div className="relative z-10 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/15">
                  <step.icon className="size-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-brand-teal text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                </div>
                <h3>{step.title}</h3>
                <p className="max-w-56 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <BookOrCallButton size="lg" variant="accent" bookLabel="Start Your Journey" callLabel="Call to Start" />
        </div>
      </div>
    </section>
  );
}
