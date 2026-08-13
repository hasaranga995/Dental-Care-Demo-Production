import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { getAppointmentById } from "@/lib/data/appointments";
import { sendAppointmentConfirmationEmail } from "@/lib/resend";
import { sendAppointmentConfirmationSms } from "@/lib/notify-lk";

export interface AppointmentConfirmationResult {
  found: boolean;
  emailSent: boolean;
  smsSent: boolean;
}

/**
 * Looks up an appointment and sends confirmation email + SMS, marking
 * `confirmationEmailSent` on email success. This is the single source of truth for
 * "what happens when an appointment confirmation job runs" — it's called
 * both from the `/api/webhooks/qstash` route (production, real QStash
 * delivery) and directly, in-process, as a local-development fallback when
 * QStash can't reach a `localhost` destination (see `src/lib/qstash.ts`).
 */
export async function processAppointmentConfirmation(
  appointmentId: string,
  options?: { sms?: boolean }
): Promise<AppointmentConfirmationResult> {
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    return { found: false, emailSent: false, smsSent: false };
  }

  const payload = {
    patientName: appointment.patientName,
    patientEmail: appointment.patientEmail,
    serviceName: appointment.serviceName,
    doctorName: appointment.doctorName,
    appointmentDate: appointment.appointmentDate,
    status: appointment.status,
    notes: appointment.notes,
  };

  const sendSms = options?.sms !== false;

  const [emailResult, smsResult] = await Promise.all([
    sendAppointmentConfirmationEmail(payload),
    sendSms
      ? sendAppointmentConfirmationSms({
          ...payload,
          patientPhone: appointment.patientPhone,
        })
      : Promise.resolve({ sent: false as const }),
  ]);

  if (emailResult.sent) {
    await db
      .update(appointments)
      .set({ confirmationEmailSent: true })
      .where(eq(appointments.id, appointmentId));
  }

  return { found: true, emailSent: emailResult.sent, smsSent: smsResult.sent };
}
