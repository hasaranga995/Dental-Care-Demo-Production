import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Specialty labels shown in the homepage services ticker.
 * Kept as a fixed, marketing-friendly list (not every DB service name)
 * so the marquee stays readable at a glance.
 */
const TICKER_SERVICES = [
  "Periodontal Care",
  "Restorative Treatments",
  "Endodontics",
  "Oral Surgery",
  "Orthodontics",
  "Pediatric Dentistry",
  "Preventive Care",
  "Cosmetic Dentistry",
] as const;

interface ServicesTickerProps {
  className?: string;
}

function TickerTrack({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-8 pr-8 sm:gap-10 sm:pr-10"
    >
      {TICKER_SERVICES.map((label) => (
        <li key={label} className="flex shrink-0 items-center gap-8 sm:gap-10">
          <span className="whitespace-nowrap text-sm font-medium tracking-wide text-muted-foreground/70 sm:text-base">
            {label}
          </span>
          <Star
            aria-hidden
            className="size-3.5 shrink-0 fill-muted-foreground/45 text-muted-foreground/45 sm:size-4"
          />
        </li>
      ))}
    </ul>
  );
}

export function ServicesTicker({ className }: ServicesTickerProps) {
  return (
    <section
      aria-label="Dental specialties"
      className={cn(
        "overflow-hidden border-y border-border/60 bg-background py-5 sm:py-6",
        className
      )}
    >
      <div className="services-ticker-track flex w-max items-center">
        <TickerTrack />
        {/* Duplicate track for a seamless infinite loop */}
        <TickerTrack ariaHidden />
      </div>
    </section>
  );
}
