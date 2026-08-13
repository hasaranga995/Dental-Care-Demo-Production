import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AdminStatTone =
  | "default"
  | "total"
  | "pending"
  | "confirmed"
  | "today"
  | "vip"
  | "vvip"
  | "alert";

const TONE_STYLES: Record<
  AdminStatTone,
  {
    card: string;
    label: string;
    value: string;
    iconWrap: string;
    icon: string;
    hint: string;
    hintColor: string;
  }
> = {
  default: {
    card: "border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm ring-1 ring-slate-200/70",
    label: "font-semibold text-slate-700",
    value: "text-slate-950",
    iconWrap: "bg-slate-700 text-white shadow-sm",
    icon: "text-white",
    hint: "",
    hintColor: "text-slate-500",
  },
  total: {
    card: "border-[#0D4F5C]/30 bg-gradient-to-br from-[#0D4F5C] via-[#14666F] to-[#1A7A84] shadow-md shadow-[#0D4F5C]/25 ring-1 ring-white/10",
    label: "font-semibold text-white/85",
    value: "text-white",
    iconWrap: "bg-white/15 text-white ring-1 ring-white/25",
    icon: "text-[#5EC8C0]",
    hint: "All bookings on file",
    hintColor: "text-white/70",
  },
  pending: {
    card: "border-orange-400/80 bg-gradient-to-br from-orange-50 via-orange-50/90 to-white shadow-sm shadow-orange-200/60 ring-1 ring-orange-300/50",
    label: "font-semibold text-orange-900",
    value: "text-orange-950",
    iconWrap: "bg-orange-500 text-white shadow-sm shadow-orange-400/50",
    icon: "text-white",
    hint: "Waiting for approval",
    hintColor: "text-orange-700",
  },
  confirmed: {
    card: "border-emerald-400/80 bg-gradient-to-br from-emerald-50 via-emerald-50/90 to-white shadow-sm shadow-emerald-200/50 ring-1 ring-emerald-300/50",
    label: "font-semibold text-emerald-900",
    value: "text-emerald-950",
    iconWrap: "bg-emerald-600 text-white shadow-sm shadow-emerald-400/40",
    icon: "text-white",
    hint: "Locked in the diary",
    hintColor: "text-emerald-700",
  },
  today: {
    card: "border-sky-400/80 bg-gradient-to-br from-sky-50 via-cyan-50/80 to-white shadow-sm shadow-sky-200/50 ring-1 ring-sky-300/50",
    label: "font-semibold text-sky-900",
    value: "text-sky-950",
    iconWrap: "bg-sky-600 text-white shadow-sm shadow-sky-400/40",
    icon: "text-white",
    hint: "On the floor today",
    hintColor: "text-sky-700",
  },
  vip: {
    card: "border-amber-400/80 bg-gradient-to-br from-amber-50 via-amber-50/90 to-white shadow-sm shadow-amber-200/60 ring-1 ring-amber-300/50",
    label: "font-semibold text-amber-900",
    value: "text-amber-950",
    iconWrap: "bg-amber-500 text-white shadow-sm shadow-amber-400/50",
    icon: "text-white",
    hint: "Priority patients",
    hintColor: "text-amber-700",
  },
  vvip: {
    card: "border-violet-400/80 bg-gradient-to-br from-violet-50 via-violet-50/80 to-white shadow-sm shadow-violet-200/50 ring-1 ring-violet-300/50",
    label: "font-semibold text-violet-900",
    value: "text-violet-950",
    iconWrap: "bg-violet-600 text-white shadow-sm shadow-violet-400/40",
    icon: "text-white",
    hint: "Highest priority",
    hintColor: "text-violet-700",
  },
  alert: {
    card: "border-amber-500 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 shadow-md shadow-amber-300/50 ring-2 ring-amber-400/60",
    label: "font-semibold uppercase tracking-wide text-[11px] text-amber-950",
    value: "text-amber-950",
    iconWrap: "bg-amber-500 text-white shadow-md shadow-amber-400/60",
    icon: "text-white",
    hint: "Needs arrival prep",
    hintColor: "font-medium text-amber-800",
  },
};

/**
 * Colour-coded metric tiles for the back-office dashboard.
 * Each operational stat has its own tone so staff can scan counts at a glance.
 */
export function AdminStatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  href,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: AdminStatTone;
  /** Overrides the tone's default subtitle. */
  hint?: string;
  /** Optional deep-link (e.g. Patients filtered to VIP). */
  href?: string;
}) {
  const styles = TONE_STYLES[tone];
  const subtitle = hint ?? styles.hint;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-sm", styles.label)}>{label}</p>
          {subtitle ? (
            <p className={cn("mt-0.5 text-[11px] leading-snug", styles.hintColor)}>{subtitle}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            styles.iconWrap
          )}
        >
          <Icon className={cn("size-4", styles.icon)} aria-hidden />
        </span>
      </div>
      <p
        className={cn(
          "mt-3 font-heading text-4xl font-semibold tabular-nums tracking-tight",
          styles.value
        )}
      >
        {value}
      </p>
    </>
  );

  const cardClass = cn("p-5", styles.card);

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Card
          className={cn(
            cardClass,
            "h-full transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md"
          )}
        >
          {inner}
        </Card>
      </a>
    );
  }

  return <Card className={cardClass}>{inner}</Card>;
}
