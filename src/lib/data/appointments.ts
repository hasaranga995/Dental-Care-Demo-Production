import "server-only";
import { and, asc, desc, eq, gte, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  doctors,
  services,
  users,
  type Appointment,
  type PatientTier,
} from "@/db/schema";
import { alias } from "drizzle-orm/pg-core";
import { CLINIC } from "@/lib/clinic-config";

/**
 * `users` is already joined once for the doctor's name, so the patient side
 * needs its own alias to pull live VIP status onto every appointment row.
 */
const patientUsers = alias(users, "patient_users");

export interface AppointmentWithDetails extends Appointment {
  serviceName: string;
  serviceSlug: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorImage: string | null;
  servicePriceRange: string;
  durationMinutes: number;
  /** Live tier from the patient record, which may differ from the snapshot. */
  patientCurrentTier: PatientTier;
  patientVipNotes: string;
}

const detailedSelect = {
  id: appointments.id,
  patientId: appointments.patientId,
  doctorId: appointments.doctorId,
  serviceId: appointments.serviceId,
  appointmentDate: appointments.appointmentDate,
  status: appointments.status,
  notes: appointments.notes,
  patientName: appointments.patientName,
  patientEmail: appointments.patientEmail,
  patientPhone: appointments.patientPhone,
  patientTier: appointments.patientTier,
  bookingChannel: appointments.bookingChannel,
  vipAlertSentAt: appointments.vipAlertSentAt,
  confirmationEmailSent: appointments.confirmationEmailSent,
  createdAt: appointments.createdAt,
  updatedAt: appointments.updatedAt,
  serviceName: services.name,
  serviceSlug: services.slug,
  doctorSpecialty: doctors.specialty,
  doctorUserId: doctors.userId,
  doctorName: users.name,
  doctorImage: doctors.image,
  servicePriceRange: services.priceRange,
  durationMinutes: services.durationMinutes,
  patientCurrentTier: patientUsers.tier,
  patientVipNotes: patientUsers.vipNotes,
};

function mapRow(row: Record<string, unknown>): AppointmentWithDetails {
  return {
    id: row.id as string,
    patientId: row.patientId as string,
    doctorId: row.doctorId as string,
    serviceId: row.serviceId as string,
    appointmentDate: row.appointmentDate as Date,
    status: row.status as Appointment["status"],
    notes: row.notes as string,
    patientName: row.patientName as string,
    patientEmail: row.patientEmail as string,
    patientPhone: row.patientPhone as string,
    patientTier: row.patientTier as PatientTier,
    bookingChannel: row.bookingChannel as string,
    vipAlertSentAt: (row.vipAlertSentAt as Date | null) ?? null,
    confirmationEmailSent: row.confirmationEmailSent as boolean,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
    serviceName: row.serviceName as string,
    serviceSlug: row.serviceSlug as string,
    doctorName: row.doctorName as string,
    doctorSpecialty: row.doctorSpecialty as string,
    doctorImage: (row.doctorImage as string | null) ?? null,
    servicePriceRange: (row.servicePriceRange as string) ?? "",
    durationMinutes: (row.durationMinutes as number) ?? 30,
    patientCurrentTier: (row.patientCurrentTier as PatientTier) ?? "standard",
    patientVipNotes: (row.patientVipNotes as string) ?? "",
  };
}

export async function getAppointmentsForPatient(patientId: string): Promise<AppointmentWithDetails[]> {
  try {
    const rows = await db
      .select(detailedSelect)
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .leftJoin(patientUsers, eq(appointments.patientId, patientUsers.id))
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.appointmentDate));

    return rows.map(mapRow);
  } catch (error) {
    console.warn("[data/appointments] getAppointmentsForPatient failed:", error);
    return [];
  }
}

export async function getAppointmentsForDoctor(doctorId: string): Promise<AppointmentWithDetails[]> {
  try {
    const rows = await db
      .select(detailedSelect)
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .leftJoin(patientUsers, eq(appointments.patientId, patientUsers.id))
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(asc(appointments.appointmentDate));

    return rows.map(mapRow);
  } catch (error) {
    console.warn("[data/appointments] getAppointmentsForDoctor failed:", error);
    return [];
  }
}

export async function getAllAppointments(): Promise<AppointmentWithDetails[]> {
  try {
    const rows = await db
      .select(detailedSelect)
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .leftJoin(patientUsers, eq(appointments.patientId, patientUsers.id))
      .orderBy(desc(appointments.appointmentDate));

    return rows.map(mapRow);
  } catch (error) {
    console.warn("[data/appointments] getAllAppointments failed:", error);
    return [];
  }
}

export async function getAppointmentById(id: string): Promise<AppointmentWithDetails | null> {
  try {
    const rows = await db
      .select(detailedSelect)
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .leftJoin(patientUsers, eq(appointments.patientId, patientUsers.id))
      .where(eq(appointments.id, id))
      .limit(1);

    const [row] = rows;
    return row ? mapRow(row) : null;
  } catch (error) {
    console.warn(`[data/appointments] getAppointmentById(${id}) failed:`, error);
    return null;
  }
}

/** Start/end of a clinic-local day as UTC instants. */
function clinicDayBounds(date: Date): { start: Date; end: Date } {
  const localDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const start = new Date(`${localDay}T00:00:00`);
  const end = new Date(`${localDay}T23:59:59.999`);
  return { start, end };
}

/** VIP arrivals for a given clinic day — powers the staff bot's TODAY command. */
export async function getVipAppointmentsForDay(date = new Date()): Promise<AppointmentWithDetails[]> {
  const { start, end } = clinicDayBounds(date);

  try {
    const rows = await db
      .select(detailedSelect)
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .leftJoin(patientUsers, eq(appointments.patientId, patientUsers.id))
      .where(
        and(
          ne(appointments.patientTier, "standard"),
          ne(appointments.status, "cancelled"),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      )
      .orderBy(asc(appointments.appointmentDate));

    return rows.map(mapRow);
  } catch (error) {
    console.warn("[data/appointments] getVipAppointmentsForDay failed:", error);
    return [];
  }
}

export async function getUpcomingVipAppointments(limit = 5): Promise<AppointmentWithDetails[]> {
  try {
    const rows = await db
      .select(detailedSelect)
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .leftJoin(patientUsers, eq(appointments.patientId, patientUsers.id))
      .where(
        and(
          ne(appointments.patientTier, "standard"),
          ne(appointments.status, "cancelled"),
          gte(appointments.appointmentDate, new Date())
        )
      )
      .orderBy(asc(appointments.appointmentDate))
      .limit(limit);

    return rows.map(mapRow);
  } catch (error) {
    console.warn("[data/appointments] getUpcomingVipAppointments failed:", error);
    return [];
  }
}

export interface AdminStats {
  total: number;
  pending: number;
  confirmed: number;
  completedToday: number;
  upcomingToday: number;
  vipUpcoming: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const all = await db.select().from(appointments);
    const today = all.filter(
      (appt) => appt.appointmentDate >= startOfDay && appt.appointmentDate <= endOfDay
    );

    return {
      total: all.length,
      pending: all.filter((a) => a.status === "pending").length,
      confirmed: all.filter((a) => a.status === "confirmed").length,
      completedToday: today.filter((a) => a.status === "completed").length,
      upcomingToday: today.filter((a) => a.status !== "cancelled" && a.status !== "completed").length,
      vipUpcoming: all.filter(
        (a) =>
          a.patientTier !== "standard" &&
          a.status !== "cancelled" &&
          a.appointmentDate >= startOfDay
      ).length,
    };
  } catch (error) {
    console.warn("[data/appointments] getAdminStats failed:", error);
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      completedToday: 0,
      upcomingToday: 0,
      vipUpcoming: 0,
    };
  }
}
