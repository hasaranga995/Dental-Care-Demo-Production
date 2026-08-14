"use client";

import { useAuth } from "@clerk/nextjs";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";
import type { DoctorWithUser } from "@/lib/data/doctors";
import type { ServiceWithParsed } from "@/lib/data/services";

interface BookingViewProps {
  services: ServiceWithParsed[];
  doctors: DoctorWithUser[];
  initialServiceSlug?: string;
  initialDate?: string;
  initialDoctorId?: string;
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
}

export function BookingView(props: BookingViewProps) {
  const { has } = useDemoPlan();
  const { isSignedIn } = useAuth();
  return (
    <div className="bg-[#F3FAF9]">
      <div className="page-container max-w-5xl py-8 sm:py-12 lg:py-14">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Book an Appointment
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Reserve your visit in minutes
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Choose your service, pick a doctor and time that works for you, and we&apos;ll confirm
            {has("sms") ? " by SMS and email" : " by email"} right away.
          </p>
          {!isSignedIn ? (
            <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground">
              You&apos;re booking as a guest — no account needed.
            </p>
          ) : null}
        </div>

        <BookingWizard {...props} />
      </div>
    </div>
  );
}
