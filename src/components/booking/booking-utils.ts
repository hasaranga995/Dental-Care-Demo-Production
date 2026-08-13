import {
  CalendarCheck,
  CalendarDays,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";

export const BOOKING_STEPS = [
  { id: 1, label: "Service", hint: "Treatment", icon: Sparkles },
  { id: 2, label: "Doctor", hint: "Clinician", icon: Stethoscope },
  { id: 3, label: "Schedule", hint: "Date & time", icon: CalendarDays },
  { id: 4, label: "Details", hint: "Your info", icon: User },
  { id: 5, label: "Confirm", hint: "Review", icon: CalendarCheck },
] as const;

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatSlotLabel(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

export function formatVisitDateLong(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
