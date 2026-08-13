"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ServiceWithParsed } from "@/lib/data/services";
import { cn } from "@/lib/utils";

interface QuickBookingWidgetProps {
  services: ServiceWithParsed[];
  className?: string;
}

export function QuickBookingWidget({ services, className }: QuickBookingWidgetProps) {
  const router = useRouter();
  const [serviceSlug, setServiceSlug] = useState<string>("");
  const [date, setDate] = useState<string>("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (serviceSlug) params.set("service", serviceSlug);
    if (date) params.set("date", date);
    router.push(`/book${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const today = new Date().toISOString().split("T")[0];
  const fieldClass =
    "h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-brand-navy focus-visible:ring-2 focus-visible:ring-brand-navy/15";

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative z-20 -mt-10 mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_40px_-16px_rgba(13,79,92,0.28)] sm:flex-row sm:items-end sm:gap-4 sm:p-5",
        className
      )}
    >
      <div className="hidden shrink-0 sm:block sm:min-w-[7.5rem] sm:border-r sm:border-slate-100 sm:pr-4 sm:pb-0.5">
        <p className="font-sans text-[11px] font-semibold tracking-[0.14em] text-brand-navy uppercase">
          Quick book
        </p>
        <p className="mt-1 text-xs leading-snug text-slate-500">Find an open slot</p>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(14rem,1.4fr)_9.5rem_auto] sm:items-end sm:gap-3">
        <div className="min-w-0">
          <label
            htmlFor="quick-book-service"
            className="mb-1.5 block text-[11px] font-medium text-slate-500"
          >
            Service
          </label>
          <Select value={serviceSlug} onValueChange={(value) => setServiceSlug(value ?? "")}>
            <SelectTrigger
              id="quick-book-service"
              className={cn(fieldClass, "!w-full justify-between shadow-none")}
            >
              <SelectValue placeholder="Select a service" className="truncate" />
            </SelectTrigger>
            <SelectContent className="w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)]">
              {services.map((service) => (
                <SelectItem key={service.id} value={service.slug}>
                  <span className="truncate">{service.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 sm:w-[9.5rem]">
          <label
            htmlFor="quick-book-date"
            className="mb-1.5 block text-[11px] font-medium text-slate-500"
          >
            Date
          </label>
          <input
            id="quick-book-date"
            type="date"
            min={today}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClass}
          />
        </div>

        <Button
          type="submit"
          size="sm"
          className="h-9 w-full gap-1 rounded-md bg-brand-navy px-4 text-sm font-semibold text-white shadow-none hover:bg-[#0a434e] sm:mt-0 sm:w-auto"
        >
          Check Availability
          <ChevronRight className="size-3.5 opacity-90" />
        </Button>
      </div>
    </form>
  );
}
