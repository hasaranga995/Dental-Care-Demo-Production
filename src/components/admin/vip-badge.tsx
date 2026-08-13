import { Crown, Gem } from "lucide-react";
import type { PatientTier } from "@/db/schema";
import { cn } from "@/lib/utils";

const TIER_STYLES: Record<Exclude<PatientTier, "standard">, string> = {
  vip: "border-amber-300 bg-amber-50 text-amber-800",
  vvip: "border-violet-300 bg-violet-50 text-violet-800",
};

/**
 * Compact tier marker used anywhere a patient name appears to staff.
 * Renders nothing for standard patients so the queue stays quiet.
 */
export function VipBadge({
  tier,
  className,
}: {
  tier: PatientTier;
  className?: string;
}) {
  if (tier === "standard") return null;

  const Icon = tier === "vvip" ? Gem : Crown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        TIER_STYLES[tier],
        className
      )}
    >
      <Icon className="size-3" aria-hidden />
      {tier === "vvip" ? "VVIP" : "VIP"}
    </span>
  );
}
