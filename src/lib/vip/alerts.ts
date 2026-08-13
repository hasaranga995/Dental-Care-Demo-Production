import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  users,
  vipAlertDeliveries,
  vipAlerts,
  type PatientTier,
  type StaffAlertSubscriber,
} from "@/db/schema";
import { CLINIC } from "@/lib/clinic-config";
import { getAppointmentById } from "@/lib/data/appointments";
import { getPatientHistory, tierLabel } from "@/lib/vip/identity";
import { formatPhoneDisplay } from "@/lib/vip/phone";
import {
  listActiveStaffSubscribers,
  markStaffSubscriberNotified,
} from "@/lib/vip/subscribers";
import { sendWhatsAppTemplate, sendWhatsAppText, WhatsAppSendError } from "@/lib/whatsapp/client";
import { getStaffChannelConfig } from "@/lib/whatsapp/config";

const CHANNEL_LABELS: Record<string, string> = {
  web: "Website front desk",
  whatsapp: "WhatsApp front desk",
  admin: "Reception counter",
};

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: CLINIC.timeZone,
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    timeZone: CLINIC.timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

export interface VipAlertContent {
  message: string;
  /** Positional params for an approved Utility template, in body order. */
  templateParams: string[];
}

export interface VipAlertSource {
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  tier: PatientTier;
  serviceName: string;
  doctorName: string;
  appointmentDate: Date;
  bookingChannel: string;
  vipNotes: string;
  visitCount: number;
  bookingCount: number;
  lastVisit: Date | null;
}

/**
 * The "flash card" a back-office staff member receives. Kept short and
 * scannable on a phone: who, what, when, how they booked, and the one or two
 * preferences that change how the arrival is prepared.
 */
export function buildVipAlertContent(source: VipAlertSource): VipAlertContent {
  const label = tierLabel(source.tier);
  const when = formatDateTime(source.appointmentDate);
  const channel = CHANNEL_LABELS[source.bookingChannel] ?? source.bookingChannel;
  const reference = source.appointmentId.slice(0, 8).toUpperCase();

  const lines = [
    `🔔 *${label} ARRIVAL ALERT*`,
    "",
    `*${source.patientName}* just booked an appointment.`,
    "",
    `• *Service:* ${source.serviceName}`,
    `• *Doctor:* Dr. ${source.doctorName}`,
    `• *When:* ${when}`,
    `• *Booked via:* ${channel}`,
    `• *Contact:* ${formatPhoneDisplay(source.patientPhone)}`,
  ];

  if (source.visitCount > 0) {
    const visit = `${ordinal(source.visitCount + 1)} visit`;
    lines.push(
      `• *History:* ${visit}${source.lastVisit ? ` (last seen ${formatDate(source.lastVisit)})` : ""}`
    );
  } else if (source.bookingCount > 1) {
    lines.push("• *History:* Booked with us before, not yet attended");
  } else {
    lines.push("• *History:* First visit with us");
  }

  if (source.vipNotes.trim()) {
    lines.push("", `*Preferences:* ${source.vipNotes.trim()}`);
  }

  lines.push(
    "",
    "Please prepare the arrival and reach out personally to confirm arrangements.",
    `Ref: ${reference}`
  );

  return {
    message: lines.join("\n"),
    templateParams: [
      label,
      source.patientName,
      source.serviceName,
      `Dr. ${source.doctorName}`,
      when,
      channel,
    ],
  };
}

async function sendToSubscriber(
  subscriber: StaffAlertSubscriber,
  content: VipAlertContent
): Promise<void> {
  const staff = getStaffChannelConfig();

  // Outside the 24-hour service window only approved templates are delivered,
  // so prefer the template whenever one is configured.
  if (staff.templateName) {
    try {
      await sendWhatsAppTemplate(subscriber.phone, {
        name: staff.templateName,
        language: staff.templateLanguage,
        bodyParams: content.templateParams,
        sender: "staff",
      });
      return;
    } catch (error) {
      console.warn("[vip/alerts] template send failed, falling back to text:", error);
    }
  }

  try {
    await sendWhatsAppText(subscriber.phone, content.message, "staff");
  } catch (error) {
    if (error instanceof WhatsAppSendError && error.isOutsideWindow && !staff.templateName) {
      throw new Error(
        "Outside the 24-hour window and no approved staff template is configured (WHATSAPP_STAFF_TEMPLATE_NAME)."
      );
    }
    throw error;
  }
}

export interface VipAlertResult {
  dispatched: boolean;
  reason?: string;
  alertId?: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
}

/**
 * Broadcasts a VIP booking to every opted-in back-office phone.
 *
 * An outbox row is written *before* the first send so a partial or failed
 * broadcast is visible in the admin console and can be replayed, rather than
 * disappearing into logs. `appointments.vip_alert_sent_at` makes the whole
 * operation idempotent under QStash retries.
 */
export async function processVipAlert(appointmentId: string): Promise<VipAlertResult> {
  const empty = { recipientCount: 0, sentCount: 0, failedCount: 0 };

  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    return { dispatched: false, reason: "appointment_not_found", ...empty };
  }

  if (appointment.patientTier === "standard") {
    return { dispatched: false, reason: "not_vip", ...empty };
  }

  if (appointment.vipAlertSentAt) {
    return { dispatched: false, reason: "already_sent", ...empty };
  }

  const [patient] = await db
    .select()
    .from(users)
    .where(eq(users.id, appointment.patientId))
    .limit(1);

  const history = await getPatientHistory(appointment.patientId);

  const content = buildVipAlertContent({
    appointmentId: appointment.id,
    patientName: appointment.patientName,
    patientPhone: appointment.patientPhone,
    tier: appointment.patientTier,
    serviceName: appointment.serviceName,
    doctorName: appointment.doctorName,
    appointmentDate: appointment.appointmentDate,
    bookingChannel: appointment.bookingChannel,
    vipNotes: patient?.vipNotes ?? "",
    visitCount: history.visitCount,
    bookingCount: history.bookingCount,
    lastVisit: history.lastVisit,
  });

  const subscribers = await listActiveStaffSubscribers();

  const [alert] = await db
    .insert(vipAlerts)
    .values({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      tier: appointment.patientTier,
      bookingChannel: appointment.bookingChannel,
      message: content.message,
      status: subscribers.length === 0 ? "skipped" : "pending",
      recipientCount: subscribers.length,
      error: subscribers.length === 0 ? "No active back-office subscribers." : "",
    })
    .returning();

  if (subscribers.length === 0) {
    await db
      .update(vipAlerts)
      .set({ completedAt: new Date() })
      .where(eq(vipAlerts.id, alert.id));
    return {
      dispatched: false,
      reason: "no_subscribers",
      alertId: alert.id,
      ...empty,
    };
  }

  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const subscriber of subscribers) {
    try {
      await sendToSubscriber(subscriber, content);
      sentCount += 1;
      await db.insert(vipAlertDeliveries).values({
        alertId: alert.id,
        subscriberId: subscriber.id,
        phone: subscriber.phone,
        status: "sent",
      });
      await markStaffSubscriberNotified(subscriber.id);
    } catch (error) {
      failedCount += 1;
      const detail = error instanceof Error ? error.message : String(error);
      errors.push(`${subscriber.phone}: ${detail}`);
      console.error("[vip/alerts] delivery failed:", detail);
      await db.insert(vipAlertDeliveries).values({
        alertId: alert.id,
        subscriberId: subscriber.id,
        phone: subscriber.phone,
        status: "failed",
        error: detail.slice(0, 500),
      });
    }
  }

  const status = failedCount === 0 ? "sent" : sentCount > 0 ? "partial" : "failed";

  await db
    .update(vipAlerts)
    .set({
      status,
      sentCount,
      failedCount,
      error: errors.join(" | ").slice(0, 1000),
      completedAt: new Date(),
    })
    .where(eq(vipAlerts.id, alert.id));

  if (sentCount > 0) {
    await db
      .update(appointments)
      .set({ vipAlertSentAt: new Date() })
      .where(eq(appointments.id, appointment.id));
  }

  return {
    dispatched: sentCount > 0,
    alertId: alert.id,
    recipientCount: subscribers.length,
    sentCount,
    failedCount,
  };
}

export interface VipAlertLogEntry {
  id: string;
  patientName: string;
  serviceName: string;
  appointmentDate: Date | null;
  tier: PatientTier;
  bookingChannel: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  error: string;
  createdAt: Date;
}

export async function listRecentVipAlerts(limit = 20): Promise<VipAlertLogEntry[]> {
  try {
    const rows = await db
      .select({
        id: vipAlerts.id,
        tier: vipAlerts.tier,
        bookingChannel: vipAlerts.bookingChannel,
        status: vipAlerts.status,
        recipientCount: vipAlerts.recipientCount,
        sentCount: vipAlerts.sentCount,
        failedCount: vipAlerts.failedCount,
        error: vipAlerts.error,
        createdAt: vipAlerts.createdAt,
        patientName: appointments.patientName,
        appointmentDate: appointments.appointmentDate,
      })
      .from(vipAlerts)
      .leftJoin(appointments, eq(vipAlerts.appointmentId, appointments.id))
      .orderBy(desc(vipAlerts.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      patientName: row.patientName ?? "Removed appointment",
      serviceName: "",
      appointmentDate: row.appointmentDate ?? null,
      tier: row.tier,
      bookingChannel: row.bookingChannel,
      status: row.status,
      recipientCount: row.recipientCount,
      sentCount: row.sentCount,
      failedCount: row.failedCount,
      error: row.error,
      createdAt: row.createdAt,
    }));
  } catch (error) {
    console.warn("[vip/alerts] listRecentVipAlerts failed:", error);
    return [];
  }
}
