"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingProgress } from "@/components/booking/booking-progress";
import {
  ConfirmStep,
  DateTimeStep,
  DetailsStep,
  DoctorStep,
  ServiceStep,
} from "@/components/booking/booking-steps";
import { BookingSuccess } from "@/components/booking/booking-success";
import { BOOKING_STEPS, toDateInputValue } from "@/components/booking/booking-utils";
import { createAppointment, getAvailableTimeSlots, type ActionResult } from "@/actions/appointments";
import type { DoctorWithUser } from "@/lib/data/doctors";
import type { ServiceWithParsed } from "@/lib/data/services";

interface BookingWizardProps {
  services: ServiceWithParsed[];
  doctors: DoctorWithUser[];
  initialServiceSlug?: string;
  initialDate?: string;
  initialDoctorId?: string;
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
}

export function BookingWizard({
  services,
  doctors,
  initialServiceSlug,
  initialDate,
  initialDoctorId,
  defaultName,
  defaultEmail,
  defaultPhone,
}: BookingWizardProps) {
  const initialService = useMemo(
    () => services.find((s) => s.slug === initialServiceSlug) ?? null,
    [services, initialServiceSlug]
  );
  const initialDoctor = useMemo(
    () => doctors.find((d) => d.id === initialDoctorId) ?? null,
    [doctors, initialDoctorId]
  );

  const [step, setStep] = useState(() => {
    if (initialService && initialDoctor) return 3;
    if (initialService) return 2;
    return 1;
  });
  const [serviceId, setServiceId] = useState<string>(initialService?.id ?? "");
  const [doctorId, setDoctorId] = useState<string>(initialDoctorId ?? "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate ? new Date(`${initialDate}T00:00:00`) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [patientName, setPatientName] = useState(defaultName);
  const [patientEmail, setPatientEmail] = useState(defaultEmail);
  const [patientPhone, setPatientPhone] = useState(defaultPhone);
  const [notes, setNotes] = useState("");

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  const selectedService = services.find((s) => s.id === serviceId) ?? null;
  const selectedDoctor = doctors.find((d) => d.id === doctorId) ?? null;
  const dateInputValue = selectedDate ? toDateInputValue(selectedDate) : "";

  useEffect(() => {
    if (!doctorId || !dateInputValue) {
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlotsLoading(true);
    setSlotsError(null);
    getAvailableTimeSlots(doctorId, dateInputValue)
      .then((available) => {
        if (cancelled) return;
        setSlots(available);
        if (!available.includes(selectedTime)) {
          setSelectedTime("");
        }
      })
      .catch(() => {
        if (!cancelled) setSlotsError("Could not load availability. Please try another date.");
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, dateInputValue]);

  function goToStep(next: number) {
    setFieldError(null);
    setStep(next);
  }

  function handleNext() {
    if (step === 1 && !serviceId) {
      setFieldError("Please select a service to continue.");
      return;
    }
    if (step === 2 && !doctorId) {
      setFieldError("Please select a doctor to continue.");
      return;
    }
    if (step === 3 && (!dateInputValue || !selectedTime)) {
      setFieldError("Please select both a date and an available time slot.");
      return;
    }
    if (step === 4) {
      if (patientName.trim().length < 2) {
        setFieldError("Please enter your full name.");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(patientEmail)) {
        setFieldError("Please enter a valid email address.");
        return;
      }
      if (patientPhone.trim().length < 7) {
        setFieldError("Please enter a valid phone number.");
        return;
      }
    }
    goToStep(Math.min(step + 1, BOOKING_STEPS.length));
  }

  function handleBack() {
    goToStep(Math.max(step - 1, 1));
  }

  function handleSubmit() {
    setFieldError(null);
    const formData = new FormData();
    formData.set("serviceId", serviceId);
    formData.set("doctorId", doctorId);
    formData.set("appointmentDate", dateInputValue);
    formData.set("appointmentTime", selectedTime);
    formData.set("patientName", patientName.trim());
    formData.set("patientEmail", patientEmail.trim());
    formData.set("patientPhone", patientPhone.trim());
    formData.set("notes", notes.trim());

    startSubmit(async () => {
      const res = await createAppointment(formData);
      setResult(res);
      if (res.success) {
        setStep(6);
      }
    });
  }

  if (step === 6 && result?.success) {
    return (
      <div className="mx-auto max-w-2xl">
        <BookingSuccess
          message={result.message}
          serviceName={selectedService?.name}
          doctorName={selectedDoctor?.user.name}
          date={selectedDate}
          time={selectedTime}
          email={patientEmail}
        />
      </div>
    );
  }

  return (
    <div>
      <BookingProgress step={step} onJump={goToStep} />

      <div className="rounded-xl border border-border bg-white p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {step === 1 && (
                <ServiceStep
                  services={services}
                  serviceId={serviceId}
                  onSelect={(id) => {
                    setServiceId(id);
                    setFieldError(null);
                  }}
                />
              )}
              {step === 2 && (
                <DoctorStep
                  doctors={doctors}
                  doctorId={doctorId}
                  serviceName={selectedService?.name}
                  onSelect={(id) => {
                    setDoctorId(id);
                    setSlots([]);
                    setSelectedTime("");
                    setFieldError(null);
                  }}
                />
              )}
              {step === 3 && (
                <DateTimeStep
                  doctorName={selectedDoctor?.user.name}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  slots={slots}
                  slotsLoading={slotsLoading}
                  slotsError={slotsError}
                  onSelectDate={(date) => {
                    setSelectedDate(date);
                    setSlots([]);
                    setSelectedTime("");
                    setFieldError(null);
                  }}
                  onSelectTime={(time) => {
                    setSelectedTime(time);
                    setFieldError(null);
                  }}
                />
              )}
              {step === 4 && (
                <DetailsStep
                  patientName={patientName}
                  patientEmail={patientEmail}
                  patientPhone={patientPhone}
                  notes={notes}
                  onName={setPatientName}
                  onEmail={setPatientEmail}
                  onPhone={setPatientPhone}
                  onNotes={setNotes}
                />
              )}
              {step === 5 && (
                <ConfirmStep
                  serviceName={selectedService?.name}
                  servicePrice={selectedService?.priceRange}
                  serviceDuration={selectedService?.durationMinutes}
                  doctorName={selectedDoctor?.user.name}
                  doctorSpecialty={selectedDoctor?.specialty}
                  date={selectedDate}
                  time={selectedTime}
                  patientName={patientName}
                  patientEmail={patientEmail}
                  patientPhone={patientPhone}
                  notes={notes}
                  error={result && !result.success ? result.message : null}
                  onEdit={goToStep}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {fieldError && (
            <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {fieldError}
            </p>
          )}

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#e7f3f1] pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
              className="gap-1.5"
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>

            {step < 5 ? (
              <Button type="button" onClick={handleNext} className="gap-1.5">
                Next
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="gap-1.5">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Booking…
                  </>
                ) : (
                  <>
                    <CalendarCheck className="size-4" />
                    Confirm Appointment
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
    </div>
  );
}
