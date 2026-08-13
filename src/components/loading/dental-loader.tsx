"use client";

import { cn } from "@/lib/utils";

interface DentalLoaderProps {
  className?: string;
  /** Show caption under the animated emblem. */
  label?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: "size-14",
  md: "size-20",
  lg: "size-28",
} as const;

/**
 * Route/page dental loader — soft rings + gradient tooth emblem.
 */
export function DentalLoader({
  className,
  label = "Loading…",
  size = "md",
}: DentalLoaderProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={cn("dental-loader-emblem relative", SIZE[size])}>
        <span aria-hidden className="dental-loader-ring absolute inset-0 rounded-full" />
        <span aria-hidden className="dental-loader-ring-soft absolute inset-1 rounded-full" />
        <span aria-hidden className="dental-loader-glow absolute inset-3 rounded-full" />
        <svg
          className="dental-loader-tooth absolute inset-[18%] text-primary"
          viewBox="0 0 80 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <linearGradient id="loaderToothFill" x1="20" y1="8" x2="60" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0D4F5C" />
              <stop offset="1" stopColor="#5EC8C0" />
            </linearGradient>
          </defs>
          <path
            d="M40 8c-7.2 0-11.2 4-15.4 4-6.2 0-11.6 5.2-11.6 14.4 0 8.8 2.8 16.4 4.8 24.6 1.5 6.2 2.8 14.4 7.6 14.4 5.2 0 5.2-11.6 7.8-19.8 1-3 2.8-4.8 5.2-4.8s4.2 1.8 5.2 4.8C46.2 53.6 46.2 65.2 51.4 65.2c4.8 0 6.1-8.2 7.6-14.4 2-8.2 4.8-15.8 4.8-24.6 0-9.2-5.4-14.4-11.6-14.4C51.2 12 47.2 8 40 8Z"
            fill="url(#loaderToothFill)"
          />
          <path
            d="M29 20c5-7 12-10 18-8 1 .2 1.5 1.4.8 2.1-4 3.4-8.5 5-14 5.8-1 .15-1.9-.5-1.9-1.5.05-.45.2-.95.1-1.4Z"
            fill="white"
            fillOpacity="0.35"
          />
        </svg>
        <span aria-hidden className="dental-loader-sparkle absolute top-0 right-1 size-2 rounded-full bg-brand-teal" />
        <span
          aria-hidden
          className="dental-loader-sparkle-delay absolute bottom-1.5 left-0.5 size-1.5 rounded-full bg-brand-teal/80"
        />
      </div>
      {label ? (
        <p className="font-heading text-sm font-medium tracking-wide text-muted-foreground">
          {label}
        </p>
      ) : null}
    </div>
  );
}
