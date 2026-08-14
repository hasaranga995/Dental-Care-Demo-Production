"use client";

import Link from "next/link";
import { CalendarCheck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookAppointmentLink } from "@/components/booking/book-appointment-link";
import { CLINIC } from "@/lib/clinic-config";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";
import type { PlanFeatureKey } from "@/lib/demo-plan";
import { cn } from "@/lib/utils";

export function FeatureGate({
  feature,
  children,
  fallback = null,
}: {
  feature: PlanFeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { has } = useDemoPlan();
  return has(feature) ? children : fallback;
}

export function BookOrCallButton({
  size = "lg",
  variant = "accent",
  className,
  bookLabel = "Book an Appointment",
  callLabel = "Call to Book",
}: {
  size?: "sm" | "lg" | "default";
  variant?: "accent" | "default" | "outline";
  className?: string;
  bookLabel?: string;
  callLabel?: string;
}) {
  const { has } = useDemoPlan();

  if (has("booking")) {
    return (
      <Button size={size} variant={variant} className={className} render={<BookAppointmentLink href="/book" />}>
        <CalendarCheck className="size-5" />
        {bookLabel}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      render={<a href={`tel:${CLINIC.phoneRaw}`} />}
    >
      <Phone className="size-5" />
      {callLabel}
    </Button>
  );
}

export function PlanAwareLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { has } = useDemoPlan();
  if (!has("multiPage")) return null;
  return (
    <Link href={href} className={cn(className)}>
      {children}
    </Link>
  );
}
