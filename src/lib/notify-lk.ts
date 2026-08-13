import "server-only";
import { CLINIC } from "@/lib/clinic-config";
import { normalizePhone } from "@/lib/vip/phone";

const NOTIFY_LK_SEND_URL = "https://app.notify.lk/api/v1/send";

export interface AppointmentSmsData {
  patientName: string;
  patientPhone: string;
  serviceName: string;
  doctorName: string;
  appointmentDate: Date;
  status: string;
}

interface NotifyLkResponse {
  status?: string;
  data?: unknown;
  message?: string;
}

function getNotifyConfig() {
  const userId = process.env.NOTIFY_LK_USER_ID?.trim();
  const apiKey = process.env.NOTIFY_LK_API_KEY?.trim();
  const senderId = process.env.NOTIFY_LK_SENDER_ID?.trim() || "DentalCare";

  if (!userId || !apiKey || userId.includes("xxxxxxxx") || apiKey.includes("xxxxxxxx")) {
    return null;
  }

  return { userId, apiKey, senderId };
}

/** Notify.lk expects `9471XXXXXXX` (country code, no +). */
export function toNotifyLkNumber(raw: string): string | null {
  const digits = normalizePhone(raw);
  if (!digits || digits.length < 10 || digits.length > 15) return null;
  return digits;
}

function formatSmsDate(date: Date): string {
  return date
    .toLocaleDateString("en-GB", {
      timeZone: CLINIC.timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/,/g, "");
}

/** `1:30PM` with no space so phones do not wrap AM/PM onto the next line. */
function formatSmsTime(date: Date): string {
  return date
    .toLocaleTimeString("en-GB", {
      timeZone: CLINIC.timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, "")
    .toUpperCase();
}

function smsStatusLabel(status: string): string {
  switch (status) {
    case "confirmed":
      return "confirmed";
    case "cancelled":
      return "cancelled";
    default:
      return "received";
  }
}

function smsDoctorName(name: string): string {
  const cleaned = name.trim().replace(/^Dr\.?\s*/i, "");
  return cleaned ? `Dr. ${cleaned}` : "your clinician";
}

function smsPhone(): string {
  return CLINIC.phone.replace(/\s+/g, "");
}

export function buildAppointmentSms(data: AppointmentSmsData): string {
  const firstName = data.patientName.trim().split(/\s+/)[0] || "there";
  const status = smsStatusLabel(data.status);

  return [
    `${CLINIC.name}`,
    `Hi ${firstName},`,
    `Appointment ${status}.`,
    "",
    data.serviceName,
    smsDoctorName(data.doctorName),
    `${formatSmsDate(data.appointmentDate)}`,
    formatSmsTime(data.appointmentDate),
    "",
    "Please arrive 10 min early.",
    "To change, call",
    smsPhone(),
  ].join("\n");
}

export async function sendAppointmentConfirmationSms(
  data: AppointmentSmsData
): Promise<{ sent: boolean }> {
  const config = getNotifyConfig();
  const to = toNotifyLkNumber(data.patientPhone);

  if (!config) {
    console.warn(
      "[notify.lk] NOTIFY_LK_USER_ID / NOTIFY_LK_API_KEY not configured — skipping appointment SMS."
    );
    return { sent: false };
  }

  if (!to) {
    console.warn("[notify.lk] Skipping SMS — patient phone number is missing or invalid.");
    return { sent: false };
  }

  const firstName = data.patientName.trim().split(/\s+/)[0] || "";
  const message = buildAppointmentSms(data).slice(0, 621);
  const body = new URLSearchParams({
    user_id: config.userId,
    api_key: config.apiKey,
    sender_id: config.senderId,
    to,
    message,
  });
  if (firstName) body.set("contact_fname", firstName);

  try {
    const response = await fetch(NOTIFY_LK_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const payload = (await response.json().catch(() => null)) as NotifyLkResponse | null;
    const ok = response.ok && payload?.status === "success";

    if (!ok) {
      console.error("[notify.lk] Failed to send appointment SMS:", {
        httpStatus: response.status,
        status: payload?.status,
        message: payload?.message,
        data: payload?.data,
      });
      return { sent: false };
    }

    return { sent: true };
  } catch (error) {
    console.error("[notify.lk] Appointment SMS request failed:", error);
    return { sent: false };
  }
}
