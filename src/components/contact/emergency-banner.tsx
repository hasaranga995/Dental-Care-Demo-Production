"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { CLINIC } from "@/lib/clinic-config";

export function EmergencyBanner() {
  return (
    <div className="relative z-20 px-4 pt-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl border border-red-400/25 bg-gradient-to-r from-[#3b0a0a]/95 via-[#5c1510]/95 to-[#7a3b08]/95 px-4 py-4 text-white shadow-[0_20px_50px_-24px_rgba(127,29,29,0.85)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div className="flex items-start gap-3 sm:items-center">
          <span className="relative mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-amber-400/20 ring-1 ring-amber-300/40 sm:mt-0">
            <span className="absolute inset-0 animate-pulse rounded-full bg-red-500/35" />
            <span className="relative size-3 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.95)]" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight sm:text-[15px]">
              Dental emergency? Severe pain, trauma, or acute bleeding?
            </p>
            <p className="mt-1 text-xs text-amber-100/80">
              On-call maxillofacial surgeon and emergency room active 24/7.
            </p>
          </div>
        </div>

        <a
          href={`tel:${CLINIC.phoneRaw}`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-amber-500 px-5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(245,158,11,0.9)] transition-transform active:scale-[0.97]"
        >
          <Phone className="size-4" />
          Emergency {CLINIC.phone}
        </a>
      </motion.div>
    </div>
  );
}
