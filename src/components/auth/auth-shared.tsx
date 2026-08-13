"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Award,
  Calendar,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type OAuthStrategy = "oauth_google" | "oauth_apple" | "oauth_facebook";

export const AUTH_FIELD_CLASS =
  "h-10 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25";

export const AUTH_SOCIAL_BTN =
  "grid size-11 place-items-center rounded-full border border-border bg-white text-foreground shadow-sm transition-all hover:scale-105 hover:border-brand-teal/40 hover:bg-secondary disabled:opacity-60";

const FLOATING_ICON_SET: LucideIcon[] = [
  Smile,
  Sparkles,
  ShieldCheck,
  Calendar,
  Heart,
  Activity,
  Award,
  Star,
  CheckCircle2,
];

const FLOATING_LAYOUT: Array<{
  top: string;
  left: string;
  size: string;
  tone: "teal" | "navy";
  duration: number;
  delay: number;
}> = [
  { top: "6%", left: "8%", size: "h-9 w-9", tone: "teal", duration: 8, delay: 0 },
  { top: "12%", left: "78%", size: "h-7 w-7", tone: "navy", duration: 10, delay: 0.4 },
  { top: "18%", left: "42%", size: "h-10 w-10", tone: "teal", duration: 11, delay: 0.8 },
  { top: "28%", left: "14%", size: "h-6 w-6", tone: "navy", duration: 7, delay: 1.1 },
  { top: "32%", left: "88%", size: "h-8 w-8", tone: "teal", duration: 9, delay: 0.2 },
  { top: "44%", left: "4%", size: "h-10 w-10", tone: "navy", duration: 12, delay: 1.5 },
  { top: "48%", left: "68%", size: "h-6 w-6", tone: "teal", duration: 6.5, delay: 0.6 },
  { top: "55%", left: "28%", size: "h-9 w-9", tone: "navy", duration: 9.5, delay: 1.8 },
  { top: "62%", left: "82%", size: "h-7 w-7", tone: "teal", duration: 8.5, delay: 0.3 },
  { top: "68%", left: "12%", size: "h-10 w-10", tone: "navy", duration: 11.5, delay: 1.2 },
  { top: "74%", left: "52%", size: "h-6 w-6", tone: "teal", duration: 7.5, delay: 2 },
  { top: "80%", left: "76%", size: "h-8 w-8", tone: "navy", duration: 10.5, delay: 0.9 },
  { top: "86%", left: "22%", size: "h-6 w-6", tone: "teal", duration: 6, delay: 1.4 },
  { top: "8%", left: "58%", size: "h-7 w-7", tone: "navy", duration: 9, delay: 2.2 },
  { top: "38%", left: "48%", size: "h-9 w-9", tone: "teal", duration: 12, delay: 0.5 },
  { top: "90%", left: "60%", size: "h-8 w-8", tone: "navy", duration: 8, delay: 1.7 },
];

export function getClerkErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const withErrors = err as { errors?: Array<{ longMessage?: string; message?: string }> };
  const first = withErrors.errors?.[0];
  return first?.longMessage || first?.message || fallback;
}

export function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.7.5-2.4 1.9C5.1 19.4 8.3 21.5 12 21.5c2.7 0 4.9-.9 6.5-2.4l-3.1-2.4c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1z"
      />
      <path
        fill="#4A90E2"
        d="M3.5 7.3C2.7 8.8 2.3 10.4 2.3 12s.4 3.2 1.2 4.7l3.1-2.4c-.3-.8-.4-1.5-.4-2.3s.2-1.6.5-2.3L3.5 7.3z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.3c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.4 14.7 1.5 12 1.5 8.3 1.5 5.1 3.6 3.5 7.3l3.2 2.4C7.2 7 9.4 5.3 12 5.3z"
      />
    </svg>
  );
}

export function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.7 12.6c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.3-.1-2.6.8-3.3.8-.7 0-1.8-.8-3-.7-1.5.1-2.9.9-3.7 2.2-1.6 2.7-.4 6.7 1.1 8.9.8 1.1 1.7 2.3 2.9 2.2 1.2-.1 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2-.1 2.9-2.3.9-1.2 1.2-2.4 1.2-2.5-.1 0-2.4-.9-2.4-3.6zM14.5 5.8c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.7 1.5-.6.7-1.1 1.8-.9 2.8 1 .1 2-.6 2.7-1.4z" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.54-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.27h3.34l-.53 3.49h-2.81V24C19.61 23.09 24 18.1 24 12.07z"
      />
    </svg>
  );
}

const FLOATING_TEETH: Array<{
  top: string;
  left: string;
  size: string;
  duration: number;
  delay: number;
}> = [
  { top: "4%", left: "22%", size: "text-2xl", duration: 9, delay: 0.2 },
  { top: "10%", left: "91%", size: "text-xl", duration: 11, delay: 1.1 },
  { top: "22%", left: "3%", size: "text-3xl", duration: 8, delay: 0.7 },
  { top: "26%", left: "62%", size: "text-lg", duration: 10, delay: 1.6 },
  { top: "41%", left: "18%", size: "text-2xl", duration: 12, delay: 0.4 },
  { top: "46%", left: "86%", size: "text-3xl", duration: 7.5, delay: 2.1 },
  { top: "58%", left: "40%", size: "text-xl", duration: 9.5, delay: 0.9 },
  { top: "70%", left: "72%", size: "text-2xl", duration: 11, delay: 1.3 },
  { top: "78%", left: "6%", size: "text-lg", duration: 8.5, delay: 0.1 },
  { top: "88%", left: "48%", size: "text-3xl", duration: 10.5, delay: 1.8 },
  { top: "14%", left: "50%", size: "text-xl", duration: 7, delay: 2.4 },
  { top: "93%", left: "82%", size: "text-2xl", duration: 9, delay: 0.5 },
];

export function AnimatedIconBackground() {
  const icons = FLOATING_LAYOUT.map((item, index) => ({
    ...item,
    Icon: FLOATING_ICON_SET[index % FLOATING_ICON_SET.length],
    id: index,
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-secondary/40" />

      {icons.map(({ id, Icon, top, left, size, tone, duration, delay }) => (
        <motion.div
          key={id}
          className="absolute"
          style={{ top, left }}
          animate={{ y: [0, -25, 0], rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon
            className={cn(size, tone === "teal" ? "text-brand-teal/20" : "text-brand-navy/15")}
            strokeWidth={1.5}
          />
        </motion.div>
      ))}

      {FLOATING_TEETH.map((tooth, index) => (
        <motion.span
          key={`tooth-${index}`}
          className={cn("absolute select-none opacity-40", tooth.size)}
          style={{ top: tooth.top, left: tooth.left }}
          animate={{ y: [0, -22, 0], rotate: [0, 12, -12, 0], scale: [1, 1.12, 1] }}
          transition={{
            duration: tooth.duration,
            delay: tooth.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          🦷
        </motion.span>
      ))}
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <AnimatedIconBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 mx-auto w-full max-w-[22rem]"
      >
        <div className="rounded-2xl border border-border/80 bg-white/90 p-6 shadow-xl shadow-brand-navy/10 backdrop-blur-xl sm:p-7">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
