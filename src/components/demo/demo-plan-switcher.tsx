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
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <Link
        href="/plans"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-brand-navy/15 bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(13,79,92,0.85)] transition hover:bg-brand-navy/90"
      >
        <Layers className="size-4 text-brand-teal" />
        Demo: {catalog.name}
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">Switch plan</span>
      </Link>
    </div>
  );
}
