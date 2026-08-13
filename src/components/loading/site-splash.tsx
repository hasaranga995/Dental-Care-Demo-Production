"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CLINIC } from "@/lib/clinic-config";
import { cn } from "@/lib/utils";

const MIN_VISIBLE_MS = 1100;
const FADE_MS = 520;

const SKIP_SPLASH_PREFIXES = ["/sign-in", "/sign-up", "/sso-callback", "/whatsapp-lab"];

/**
 * Full-viewport dental splash. SSR'd as visible, then faded out via React state
 * (never DOM.remove — that caused hydration insertBefore/removeChild crashes).
 * Skipped on auth routes so sign-in never gets stuck behind the loader.
 */
export function SiteSplash() {
  const pathname = usePathname();
  const skipSplash = SKIP_SPLASH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  const [phase, setPhase] = useState<"in" | "out" | "gone">(skipSplash ? "gone" : "in");
  const finished = useRef(false);

  useEffect(() => {
    if (skipSplash) {
      document.documentElement.dataset.appReady = "true";
      setPhase("gone");
      return;
    }

    finished.current = false;
    setPhase("in");

    const started = performance.now();
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let goneTimer: ReturnType<typeof setTimeout> | undefined;
    let maxTimer: ReturnType<typeof setTimeout> | undefined;

    function complete() {
      if (finished.current) return;
      finished.current = true;

      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - started));
      fadeTimer = setTimeout(() => {
        setPhase("out");
        goneTimer = setTimeout(() => {
          setPhase("gone");
          document.documentElement.dataset.appReady = "true";
        }, FADE_MS);
      }, wait);
    }

    if (document.readyState === "complete") {
      complete();
    } else {
      window.addEventListener("load", complete, { once: true });
      maxTimer = setTimeout(complete, 2400);
    }

    return () => {
      window.removeEventListener("load", complete);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (goneTimer) clearTimeout(goneTimer);
      if (maxTimer) clearTimeout(maxTimer);
    };
  }, [skipSplash]);

  if (skipSplash || phase === "gone") return null;

  return (
    <div
      id="site-splash"
      className={cn("site-splash", phase === "out" && "site-splash--exit")}
      role="status"
      aria-live="polite"
      aria-label="Loading Dental Care"
      aria-busy={phase === "in"}
    >
      <div className="site-splash__bg" aria-hidden />
      <div className="site-splash__orb site-splash__orb--a" aria-hidden />
      <div className="site-splash__orb site-splash__orb--b" aria-hidden />
      <div className="site-splash__orb site-splash__orb--c" aria-hidden />

      <div className="site-splash__content">
        <div className="site-splash__emblem" aria-hidden>
          <span className="site-splash__ring site-splash__ring--outer" />
          <span className="site-splash__ring site-splash__ring--inner" />
          <svg
            className="site-splash__tooth"
            viewBox="0 0 80 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="splashToothFill"
                x1="20"
                y1="8"
                x2="60"
                y2="90"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFFFFF" />
                <stop offset="0.45" stopColor="#E8F7FB" />
                <stop offset="1" stopColor="#5EC8C0" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient
                id="splashToothShine"
                x1="28"
                y1="14"
                x2="42"
                y2="48"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
              <filter id="splashToothGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M40 8c-7.2 0-11.2 4-15.4 4-6.2 0-11.6 5.2-11.6 14.4 0 8.8 2.8 16.4 4.8 24.6 1.5 6.2 2.8 14.4 7.6 14.4 5.2 0 5.2-11.6 7.8-19.8 1-3 2.8-4.8 5.2-4.8s4.2 1.8 5.2 4.8C46.2 53.6 46.2 65.2 51.4 65.2c4.8 0 6.1-8.2 7.6-14.4 2-8.2 4.8-15.8 4.8-24.6 0-9.2-5.4-14.4-11.6-14.4C51.2 12 47.2 8 40 8Z"
              fill="url(#splashToothFill)"
              filter="url(#splashToothGlow)"
            />
            <path
              d="M29 20c5-7 12-10 18-8 1 .2 1.5 1.4.8 2.1-4 3.4-8.5 5-14 5.8-1 .15-1.9-.5-1.9-1.5.05-.45.2-.95.1-1.4Z"
              fill="url(#splashToothShine)"
            />
          </svg>
          <span className="site-splash__sparkle site-splash__sparkle--1" />
          <span className="site-splash__sparkle site-splash__sparkle--2" />
          <span className="site-splash__sparkle site-splash__sparkle--3" />
        </div>

        <p className="site-splash__brand">{CLINIC.name}</p>
        <p className="site-splash__tagline">{CLINIC.tagline}</p>
        <div className="site-splash__bar" aria-hidden>
          <span className="site-splash__bar-fill" />
        </div>
      </div>
    </div>
  );
}
