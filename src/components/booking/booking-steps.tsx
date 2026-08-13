"use client";

import { Check, Clock, Loader2, Stethoscope, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatSlotLabel, formatVisitDateLong } from "@/components/booking/booking-utils";
import type { DoctorWithUser } from "@/lib/data/doctors";
import type { ServiceWithParsed } from "@/lib/data/services";
import { cn } from "@/lib/utils";

export function ServiceStep({
  services,
  serviceId,
  onSelect,
}: {
  services: ServiceWithParsed[];
  serviceId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">What service do you need?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose the treatment you&apos;d like to book.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id)}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors hover:border-primary/60 hover:bg-primary/5",
              serviceId === service.id
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border"
            )}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="font-medium text-foreground">{service.name}</span>
              {serviceId === service.id && <Check className="size-4 shrink-0 text-primary" />}
            </div>
            <span className="text-xs text-muted-foreground">
              {service.category} · {service.priceRange} · {service.durationMinutes} min
            </span>
          </button>
        ))}
        {services.length === 0 && (
          <p className="col-span-2 text-sm text-muted-foreground">
            Services are being updated. Please call us to book directly.
          </p>
        )}
      </div>
    </div>
  );
}

export function DoctorStep({
  doctors,
  doctorId,
  serviceName,
  onSelect,
}: {
  doctors: DoctorWithUser[];
  doctorId: string;
  serviceName?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">Choose your doctor</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        All our specialists are available for {serviceName ?? "your treatment"}.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {doctors.map((doctor) => (
          <button
            key={doctor.id}
            type="button"
            onClick={() => onSelect(doctor.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary/60 hover:bg-primary/5",
              doctorId === doctor.id
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border"
            )}
          >
            <Avatar className="size-11 shrink-0">
              <AvatarImage src={doctor.image ?? undefined} alt={doctor.user.name} />
              <AvatarFallback>
                <User className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-foreground">Dr. {doctor.user.name}</span>
                {doctorId === doctor.id && <Check className="size-4 shrink-0 text-primary" />}
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Stethoscope className="size-3" />
                {doctor.specialty}
              </span>
            </div>
          </button>
        ))}
        {doctors.length === 0 && (
          <p className="col-span-2 text-sm text-muted-foreground">
            Our scheduling team will assign a doctor — please call us to confirm availability.
          </p>
        )}
      </div>
    </div>
  );
}

export function DateTimeStep({
  doctorName,
  selectedDate,
  selectedTime,
  slots,
  slotsLoading,
  slotsError,
  onSelectDate,
  onSelectTime,
}: {
  doctorName?: string;
  selectedDate?: Date;
  selectedTime: string;
  slots: string[];
  slotsLoading: boolean;
  slotsError: string | null;
  onSelectDate: (date: Date | undefined) => void;
  onSelectTime: (time: string) => void;
}) {
  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">Pick a date &amp; time</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Availability shown reflects Dr. {doctorName}&apos;s working hours.
      </p>
      <div className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr]">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          disabled={(date) =>
            date < new Date(new Date().setHours(0, 0, 0, 0)) ||
            date > new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
          }
          className="rounded-xl border"
        />
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Clock className="size-4" />
            Available times
          </div>
          {!selectedDate && (
            <p className="text-sm text-muted-foreground">Select a date to see open time slots.</p>
          )}
          {selectedDate && slotsLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading availability…
            </p>
          )}
          {selectedDate && !slotsLoading && slotsError && (
            <p className="text-sm text-destructive">{slotsError}</p>
          )}
          {selectedDate && !slotsLoading && !slotsError && slots.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No open slots on this date. Please try another day.
            </p>
          )}
          {selectedDate && !slotsLoading && slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectTime(slot)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-medium transition-colors hover:border-primary/60 hover:bg-primary/5",
                    selectedTime === slot
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground"
                  )}
                >
                  {formatSlotLabel(slot)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DetailsStep({
  patientName,
  patientEmail,
  patientPhone,
  notes,
  onName,
  onEmail,
  onPhone,
  onNotes,
}: {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  notes: string;
  onName: (value: string) => void;
  onEmail: (value: string) => void;
  onPhone: (value: string) => void;
  onNotes: (value: string) => void;
}) {
  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">Your details</h2>
      <p className="mt-1 text-sm text-muted-foreground">We&apos;ll use this to confirm your appointment.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="patientName">Full name</Label>
          <Input
            id="patientName"
            value={patientName}
            onChange={(event) => onName(event.target.value)}
            placeholder="Jane Doe"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="patientEmail">Email address</Label>
          <Input
            id="patientEmail"
            type="email"
            value={patientEmail}
            onChange={(event) => onEmail(event.target.value)}
            placeholder="jane@example.com"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="patientPhone">Phone number</Label>
          <Input
            id="patientPhone"
            type="tel"
            value={patientPhone}
            onChange={(event) => onPhone(event.target.value)}
            placeholder="+94 77 123 4567"
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes for the doctor (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(event) => onNotes(event.target.value)}
            placeholder="Any symptoms, allergies, or special requests…"
            className="mt-1.5"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

export function ConfirmStep({
  serviceName,
  servicePrice,
  doctorName,
  date,
  time,
  patientName,
  patientEmail,
  patientPhone,
  notes,
  error,
}: {
  serviceName?: string;
  servicePrice?: string;
  serviceDuration?: number;
  doctorName?: string;
  doctorSpecialty?: string;
  date?: Date;
  time: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  notes: string;
  error?: string | null;
  onEdit: (step: number) => void;
}) {
  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">Confirm your appointment</h2>
      <p className="mt-1 text-sm text-muted-foreground">Please review the details below before submitting.</p>
      <div className="mt-5 space-y-3 rounded-xl bg-muted/50 p-5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium text-foreground">{serviceName}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Doctor</span>
          <span className="font-medium text-foreground">Dr. {doctorName}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Date</span>
          <span className="text-right font-medium text-foreground">
            {date ? formatVisitDateLong(date) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium text-foreground">{formatSlotLabel(time)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Price range</span>
          <Badge variant="secondary">{servicePrice}</Badge>
        </div>
        <div className="border-t border-border pt-3">
          <p className="text-muted-foreground">Contact</p>
          <p className="mt-1 font-medium text-foreground">
            {patientName} · {patientEmail} · {patientPhone}
          </p>
        </div>
        {notes && (
          <div className="border-t border-border pt-3">
            <p className="text-muted-foreground">Notes</p>
            <p className="mt-1 text-foreground">{notes}</p>
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
