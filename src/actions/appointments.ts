"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { getOrCreateCurrentUser, getOrCreateWhatsAppPatient, requireRole, requireUser } from "@/lib/auth";
import type { User } from "@/db/schema";
import { bookingSchema, rescheduleSchema, appointmentStatusUpdateSchema } from "@/lib/validations";
import { enqueueAppointmentConfirmation, enqueueVipAlert } from "@/lib/qstash";
import { formatPatientEmail, formatPersonName, formatPhoneForStorage } from "@/lib/format-contact";
import { getDemoPlan } from "@/lib/demo-plan-server";
import { getDoctorById } from "@/lib/data/doctors";
import { getServiceBySlug } from "@/lib/data/services";
import { getAvailableTimeSlots } from "@/lib/data/availability";
import { rateLimit } from "@/lib/redis";

async function shouldSendPremierNotifications(): Promise<boolean> {
  const plan = await getDemoPlan();
  return plan === "premier";
}

export { getAvailableTimeSlots };

export interface ActionResult {
  success: boolean;
  message: string;
  appointmentId?: string;
}

function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(`${dateStr}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function persistAppointment(currentUser: User, formData: FormData): Promise<ActionResult> {
  const { success: withinLimit } = await rateLimit(`booking:${currentUser.id}`, 8, 600);
  if (!withinLimit) {
    return { success: false, message: "Too many booking attempts. Please try again shortly." };
  }

  // Resolve service by slug OR id (the booking wizard passes the slug for
  // deep-linkable URLs, but the DB relation needs the UUID).
  const rawServiceValue = formData.get("serviceId")?.toString() ?? "";
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    rawServiceValue
  );
  const resolvedService = isUuid ? null : await getServiceBySlug(rawServiceValue);

  const raw = {
    serviceId: resolvedService?.id ?? rawServiceValue,
    doctorId: formData.get("doctorId")?.toString() ?? "",
    appointmentDate: formData.get("appointmentDate")?.toString() ?? "",
    appointmentTime: formData.get("appointmentTime")?.toString() ?? "",
    patientName: formData.get("patientName")?.toString() ?? "",
    patientEmail: formData.get("patientEmail")?.toString() ?? "",
    patientPhone: formData.get("patientPhone")?.toString() ?? "",
    notes: formData.get("notes")?.toString() ?? "",
  };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please check your booking details.",
    };
  }

  const doctor = await getDoctorById(parsed.data.doctorId);
  if (!doctor) {
    return { success: false, message: "The selected doctor is no longer available." };
  }

  const appointmentDate = combineDateAndTime(parsed.data.appointmentDate, parsed.data.appointmentTime);
  if (appointmentDate.getTime() < Date.now() - 60_000) {
    return { success: false, message: "Please select a future date and time." };
  }

  const openSlots = await getAvailableTimeSlots(parsed.data.doctorId, parsed.data.appointmentDate);
  if (!openSlots.includes(parsed.data.appointmentTime)) {
    return {
      success: false,
      message: "That time is no longer available. Please pick another slot.",
    };
  }

  const rawChannel = formData.get("bookingChannel")?.toString() ?? "web";
  const bookingChannel = ["web", "whatsapp", "admin"].includes(rawChannel) ? rawChannel : "web";

  try {
    const [created] = await db
      .insert(appointments)
      .values({
        patientId: currentUser.id,
        doctorId: parsed.data.doctorId,
        serviceId: parsed.data.serviceId,
        appointmentDate,
        status: "pending",
        notes: parsed.data.notes ?? "",
        patientName: formatPersonName(parsed.data.patientName),
        patientEmail: formatPatientEmail(parsed.data.patientEmail),
        patientPhone: formatPhoneForStorage(parsed.data.patientPhone),
        // Snapshot the tier so the appointment history stays accurate even if
        // the patient is promoted or demoted later.
        patientTier: currentUser.tier,
        bookingChannel,
      })
      .returning();

    if (!created) {
      return { success: false, message: "Could not create the appointment. Please try again." };
    }

    // The appointment is already committed at this point — a notification
    // failure (e.g. QStash/email being unreachable or misconfigured) must
    // never surface as a booking failure to the patient.
    const premierFeatures = await shouldSendPremierNotifications();
    try {
      await enqueueAppointmentConfirmation({
        appointmentId: created.id,
        sms: premierFeatures,
      });
    } catch (notifyError) {
      console.error(
        "[actions/appointments] enqueueAppointmentConfirmation failed:",
        notifyError
      );
    }

    if (premierFeatures && currentUser.tier !== "standard") {
      try {
        await enqueueVipAlert({ appointmentId: created.id });
      } catch (alertError) {
        console.error("[actions/appointments] enqueueVipAlert failed:", alertError);
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/admin/patients");

    return {
      success: true,
      message: "Your appointment request has been received!",
      appointmentId: created.id,
    };
  } catch (error) {
    console.error("[actions/appointments] createAppointment failed:", error);
    return {
      success: false,
      message: "Something went wrong while booking. Please try again or call us directly.",
    };
  }
}

export async function createAppointment(formData: FormData): Promise<ActionResult> {
  const currentUser = await getOrCreateCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Please sign in to book an appointment." };
  }

  // Staff testing the public book flow must not attach the visit to their
  // admin/doctor row — Patients & VIP only lists role=patient.
  if (currentUser.role !== "patient") {
    return createGuestAppointment(formData);
  }

  return persistAppointment(currentUser, formData);
}

/** WhatsApp / front-desk bookings that are not tied to a Clerk session. */
export async function createGuestAppointment(formData: FormData): Promise<ActionResult> {
  const patientName = formData.get("patientName")?.toString()?.trim() ?? "";
  const patientEmail = formData.get("patientEmail")?.toString()?.trim() ?? "";
  const patientPhone = formData.get("patientPhone")?.toString()?.trim() ?? "";

  if (!patientName || !patientEmail || !patientPhone) {
    return { success: false, message: "Please share your full name, email, and phone number to confirm the booking." };
  }

  const patient = await getOrCreateWhatsAppPatient({
    name: patientName,
    email: patientEmail,
    phone: patientPhone,
  });

  return persistAppointment(patient, formData);
}

export async function cancelAppointment(appointmentId: string): Promise<ActionResult> {
  const currentUser = await requireUser();

  try {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) {
      return { success: false, message: "Appointment not found." };
    }

    const isOwner = appointment.patientId === currentUser.id;
    const isStaff = currentUser.role === "admin" || currentUser.role === "doctor";
    if (!isOwner && !isStaff) {
      return { success: false, message: "You don't have permission to cancel this appointment." };
    }

    await db
      .update(appointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(appointments.id, appointmentId));

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/doctor-portal");

    return { success: true, message: "Appointment cancelled." };
  } catch (error) {
    console.error("[actions/appointments] cancelAppointment failed:", error);
    return { success: false, message: "Could not cancel the appointment. Please try again." };
  }
}

export async function rescheduleAppointment(formData: FormData): Promise<ActionResult> {
  const currentUser = await requireUser();

  const raw = {
    appointmentId: formData.get("appointmentId")?.toString() ?? "",
    appointmentDate: formData.get("appointmentDate")?.toString() ?? "",
    appointmentTime: formData.get("appointmentTime")?.toString() ?? "",
  };

  const parsed = rescheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please select a valid date and time.",
    };
  }

  try {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, parsed.data.appointmentId))
      .limit(1);

    if (!appointment) {
      return { success: false, message: "Appointment not found." };
    }

    const isOwner = appointment.patientId === currentUser.id;
    const isStaff = currentUser.role === "admin" || currentUser.role === "doctor";
    if (!isOwner && !isStaff) {
      return { success: false, message: "You don't have permission to reschedule this appointment." };
    }

    const newDate = combineDateAndTime(parsed.data.appointmentDate, parsed.data.appointmentTime);
    if (newDate.getTime() < Date.now() - 60_000) {
      return { success: false, message: "Please select a future date and time." };
    }

    await db
      .update(appointments)
      .set({ appointmentDate: newDate, status: "pending", updatedAt: new Date() })
      .where(eq(appointments.id, parsed.data.appointmentId));

    try {
      await enqueueAppointmentConfirmation({
        appointmentId: parsed.data.appointmentId,
        sms: await shouldSendPremierNotifications(),
      });
    } catch (notifyError) {
      console.error(
        "[actions/appointments] enqueueAppointmentConfirmation failed:",
        notifyError
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/doctor-portal");

    return { success: true, message: "Appointment rescheduled — a confirmation email is on its way." };
  } catch (error) {
    console.error("[actions/appointments] rescheduleAppointment failed:", error);
    return { success: false, message: "Could not reschedule the appointment. Please try again." };
  }
}

export async function updateAppointmentStatus(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin", "doctor"]);

  const parsed = appointmentStatusUpdateSchema.safeParse({
    appointmentId: formData.get("appointmentId")?.toString() ?? "",
    status: formData.get("status")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid status update." };
  }

  try {
    await db
      .update(appointments)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(appointments.id, parsed.data.appointmentId));

    if (
      parsed.data.status === "confirmed" ||
      parsed.data.status === "completed" ||
      parsed.data.status === "cancelled"
    ) {
      try {
        await enqueueAppointmentConfirmation({
          appointmentId: parsed.data.appointmentId,
          sms: await shouldSendPremierNotifications(),
        });
      } catch (notifyError) {
        console.error(
          "[actions/appointments] enqueueAppointmentConfirmation failed:",
          notifyError
        );
      }
    }

    revalidatePath("/admin");
    revalidatePath("/doctor-portal");
    revalidatePath("/dashboard");

    return { success: true, message: `Appointment marked as ${parsed.data.status}.` };
  } catch (error) {
    console.error("[actions/appointments] updateAppointmentStatus failed:", error);
    return { success: false, message: "Could not update the appointment status." };
  }
}

