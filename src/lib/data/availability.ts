import "server-only";

import { and, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { getDoctorById } from "@/lib/data/doctors";
import { getClinicClock } from "@/lib/clinic-config";

type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const SLOT_INTERVAL_MINUTES = 30;

/**
 * Returns the "HH:mm" slots still open for a given doctor on a given date,
 * derived from their `workingHours` and existing (non-cancelled)
 * appointments. Shared by the booking wizard and the Dental Care chatbot.
 */
export async function getAvailableTimeSlots(
  doctorId: string,
  dateStr: string
): Promise<string[]> {
  if (!doctorId || !dateStr) return [];

  try {
    const doctor = await getDoctorById(doctorId);
    if (!doctor) return [];

    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return [];

    const dayKey = DAY_KEYS[date.getDay()];
    const hours = doctor.workingHours[dayKey];
    if (!hours) return [];

    const [startHour, startMinute] = hours.start.split(":").map(Number);
    const [endHour, endMinute] = hours.end.split(":").map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    const allSlots: string[] = [];
    for (
      let minutes = startTotalMinutes;
      minutes + SLOT_INTERVAL_MINUTES <= endTotalMinutes;
      minutes += SLOT_INTERVAL_MINUTES
    ) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      allSlots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const booked = await db
      .select({ appointmentDate: appointments.appointmentDate })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          ne(appointments.status, "cancelled"),
          gte(appointments.appointmentDate, startOfDay),
          lt(appointments.appointmentDate, endOfDay)
        )
      );

    const bookedTimes = new Set(
      booked.map(
        (b) =>
          `${b.appointmentDate.getHours().toString().padStart(2, "0")}:${b.appointmentDate
            .getMinutes()
            .toString()
            .padStart(2, "0")}`
      )
    );

    const clock = getClinicClock();
    if (dateStr < clock.today) {
      return [];
    }

    const nowTotalMinutes = (() => {
      const [hour, minute] = clock.time.split(":").map(Number);
      return hour * 60 + minute;
    })();
    const isToday = dateStr === clock.today;

    return allSlots.filter((slot) => {
      if (bookedTimes.has(slot)) return false;
      if (isToday) {
        const [h, m] = slot.split(":").map(Number);
        if (h * 60 + m <= nowTotalMinutes + 30) return false;
      }
      return true;
    });
  } catch (error) {
    console.error("[data/availability] getAvailableTimeSlots failed:", error);
    return [];
  }
}
