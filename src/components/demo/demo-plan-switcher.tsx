"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers } from "lucide-react";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";
import { getPlanCatalogItem } from "@/lib/demo-plan";

export function DemoPlanSwitcher() {
  const pathname = usePathname();
  const { plan } = useDemoPlan();

  if (!plan || pathname.startsWith("/plans")) return null;

  const catalog = getPlanCatalogItem(plan);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] flex justify-start px-4 pr-[4.75rem] sm:bottom-4 sm:justify-center sm:px-4">
      <Link
        href="/plans"
        className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full border border-brand-navy/15 bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(13,79,92,0.85)] transition hover:bg-brand-navy/90"
      >
        <Layers className="size-4 shrink-0 text-brand-teal" />
        <span className="truncate">Demo: {catalog.name}</span>
        <span className="hidden rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium sm:inline">
          Switch plan
        </span>
      </Link>
    </div>
  );
}
