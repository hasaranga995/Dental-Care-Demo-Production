"use client";

import { Check } from "lucide-react";
import { BOOKING_STEPS } from "@/components/booking/booking-utils";
import { cn } from "@/lib/utils";

export function BookingProgress({
  step,
  onJump,
}: {
  step: number;
  onJump: (next: number) => void;
}) {
  const progress = Math.max(0, Math.min(1, (step - 1) / (BOOKING_STEPS.length - 1)));

  return (
    <nav aria-label="Booking steps" className="mb-8 sm:mb-10">
      <ol className="relative flex items-start justify-between">
        <span
          aria-hidden
          className="absolute top-4 right-[10%] left-[10%] h-px bg-[#c5d9d6] sm:top-5"
        />
        <span
          aria-hidden
          className="absolute top-4 left-[10%] h-px bg-brand-navy transition-[width] duration-500 sm:top-5"
          style={{ width: `calc(${progress} * 80%)` }}
        />

        {BOOKING_STEPS.map((item) => {
          const complete = step > item.id;
          const current = step === item.id;
          const jumpable = complete;
          const Icon = item.icon;

          return (
            <li key={item.id} className="relative z-10 flex flex-1 flex-col items-center text-center">
              <button
                type="button"
                disabled={!jumpable}
                onClick={() => jumpable && onJump(item.id)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 bg-[#F3FAF9] text-sm font-semibold transition-colors sm:size-10",
                  complete && "border-brand-navy bg-brand-navy text-white",
                  current && "border-brand-navy bg-white text-brand-navy",
                  !complete && !current && "border-[#c5d9d6] text-muted-foreground",
                  jumpable && "cursor-pointer hover:scale-105"
                )}
                aria-current={current ? "step" : undefined}
              >
                {complete ? (
                  <Check className="size-3.5 sm:size-4" strokeWidth={2.5} />
                ) : (
                  <Icon className="size-3.5 sm:size-4" />
                )}
              </button>
              <span
                className={cn(
                  "mt-2 text-[10px] font-semibold tracking-[0.12em] uppercase sm:text-[11px]",
                  step >= item.id ? "text-brand-navy" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              <span className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                {item.hint}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
