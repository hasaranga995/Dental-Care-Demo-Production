"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { formatSlotLabel, formatVisitDateLong } from "@/components/booking/booking-utils";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";

export function BookingSuccess({
  message,
  serviceName,
  doctorName,
  date,
  time,
  email,
}: {
  message: string;
  serviceName?: string;
  doctorName?: string;
  date?: Date;
  time: string;
  email: string;
}) {
  const { has } = useDemoPlan();
  const { isSignedIn } = useAuth();
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-white p-8 text-center sm:p-10">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-8" />
      </div>
      <h2 className="mt-5 font-heading text-2xl font-semibold text-foreground">
        Appointment Requested!
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>

      <div className="mt-6 space-y-2 rounded-xl bg-muted/50 p-5 text-left text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium text-foreground">{serviceName}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Doctor</span>
          <span className="font-medium text-foreground">Dr. {doctorName}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Date</span>
          <span className="text-right font-medium text-foreground">
            {date ? formatVisitDateLong(date) : "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium text-foreground">{formatSlotLabel(time)}</span>
        </div>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        A confirmation email is on its way to {email}
        {has("sms") ? ", and an SMS is sent to your mobile" : ""}.
        {isSignedIn
          ? " You can manage this appointment anytime from your dashboard."
          : " Create an account if you want to manage this visit from a dashboard later."}
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {isSignedIn ? (
          <Button size="lg" render={<Link href="/dashboard" />}>
            Go to My Dashboard
          </Button>
        ) : (
          <Button size="lg" render={<Link href="/sign-up" />}>
            Create an Account
          </Button>
        )}
        <Button size="lg" variant="outline" render={<Link href="/" />}>
          Return Home
        </Button>
      </div>
    </div>
  );
}
