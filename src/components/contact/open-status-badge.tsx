"use client";

import { useEffect, useState } from "react";
import { MoonStar } from "lucide-react";
import { getClinicOpenStatus } from "@/lib/clinic-config";
import { cn } from "@/lib/utils";

export function OpenStatusBadge({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const [status, setStatus] = useState(() => getClinicOpenStatus());

  useEffect(() => {
    const interval = setInterval(() => setStatus(getClinicOpenStatus()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2.5 rounded-full border px-3.5 py-2 text-sm font-semibold",
        dark &&
          (status.isOpen
            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
            : "border-amber-300/40 bg-amber-400/15 text-amber-100"),
        !dark &&
          (status.isOpen
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-900"),
        className
      )}
    >
      {status.isOpen ? (
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            dark ? "bg-emerald-400" : "bg-emerald-500"
          )}
        />
      ) : (
        <MoonStar className={cn("size-3.5 shrink-0", dark ? "text-amber-200" : "text-amber-700")} />
      )}
      <span className="min-w-0 truncate whitespace-nowrap">
        {status.isOpen
          ? `Open today  ${status.todayHours}`
          : "After hours · 24/7 emergency line active"}
      </span>
    </div>
  );
}
