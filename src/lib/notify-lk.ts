import "server-only";
import { CLINIC } from "@/lib/clinic-config";
import { formatPersonName } from "@/lib/format-contact";
import { normalizePhone } from "@/lib/vip/phone";

const NOTIFY_LK_SEND_URL = "https://app.notify.lk/api/v1/send";
const DEFAULT_APP_URL = "https://dental-care-demo-production.vercel.app";

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

function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL;
  const cleaned = raw.replace(/\/+$/, "");
  // Patients cannot open localhost links from an SMS — use the public demo URL instead.
  if (!cleaned || /localhost|127\.0\.0\.1/i.test(cleaned)) {
    return DEFAULT_APP_URL;
  }
  return cleaned;
}

/** Properly capitalize a name token: `rusiru` → `Rusiru`. */
export function formatSmsPatientName(patientName: string): string {
  return formatPersonName(patientName) || "Valued Patient";
}

function smsDoctorName(name: string): string {
  const cleaned = name.trim().replace(/^Dr\.?\s*/i, "");
  if (!cleaned) return "your clinician";
  const titled = cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
  return `Dr. ${titled}`;
}

/** e.g. `Tue, 18 Aug 2026` */
export function formatSmsAppointmentDate(date: Date): string {
  const weekday = date.toLocaleDateString("en-GB", {
    timeZone: CLINIC.timeZone,
    weekday: "short",
  });
  const rest = date.toLocaleDateString("en-GB", {
    timeZone: CLINIC.timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${weekday}, ${rest}`;
}

/** e.g. `6:00 PM` */
export function formatSmsAppointmentTime(date: Date): string {
  return date
    .toLocaleTimeString("en-US", {
      timeZone: CLINIC.timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\u202f/g, " ")
    .trim();
}

/**
 * Status-aware SMS headlines for the patient booking lifecycle.
 * pending → request received; confirmed → slot locked; completed → visit done.
 */
function smsStatusHeadline(
  status: string
): "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" {
  switch (status) {
    case "confirmed":
      return "CONFIRMED";
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

function smsLocationLine(): string {
  const { line2, postalCode } = CLINIC.address;
  const district = postalCode.length >= 3 ? postalCode.slice(1, 3) : "03";
  // Plain ASCII only — Notify.lk / GSM gateways corrupt emoji characters.
  return `Location: Harbor View ${line2}, Colombo ${district}`;
}

/**
 * White-glove SMS body from already-formatted schedule strings.
 * Prefer `buildAppointmentSms()` when you already have an appointment `Date`.
 */
export function buildAppointmentSmsText({
  patientName,
  serviceTitle,
  doctorName,
  appointmentDate,
  appointmentTime,
  status = "pending",
}: {
  patientName: string;
  serviceTitle: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  status?: string;
}) {
  const formattedName = formatSmsPatientName(patientName);
  const doctor = smsDoctorName(doctorName);
  const headline = smsStatusHeadline(status);
  const baseUrl = getAppBaseUrl();
  const when = `${appointmentDate} at ${appointmentTime}`;

  if (headline === "COMPLETED") {
    return [
      `[Dental Care Hospital] COMPLETED:`,
      `Dear ${formattedName}, thank you for visiting Dental Care. Your appointment for ${serviceTitle} with ${doctor} on ${when} is now COMPLETED.`,
      "",
      "We hope you had a wonderful experience.",
      "",
      "View visit history:",
      `${baseUrl}/dashboard`,
      "",
      `Helpline: ${CLINIC.phone}`,
    ].join("\n");
  }

  if (headline === "CANCELLED") {
    return [
      `[Dental Care Hospital] CANCELLED:`,
      `Dear ${formattedName}, your appointment for ${serviceTitle} with ${doctor} on ${when} has been CANCELLED.`,
      "",
      "Need a new slot? Book again from your dashboard or call us.",
      "",
      "View visit details:",
      `${baseUrl}/dashboard`,
      "",
      `Helpline: ${CLINIC.phone}`,
    ].join("\n");
  }

  if (headline === "CONFIRMED") {
    return [
      `[Dental Care Hospital] CONFIRMED:`,
      `Dear ${formattedName}, your appointment for ${serviceTitle} with ${doctor} is CONFIRMED for ${when}.`,
      "",
      smsLocationLine(),
      "Please arrive 10 mins prior for concierge check-in.",
      "",
      "View visit details:",
      `${baseUrl}/dashboard`,
      "",
      `Helpline: ${CLINIC.phone}`,
    ].join("\n");
  }

  // PENDING — booking request received, awaiting admin confirmation
  return [
    `[Dental Care Hospital] PENDING:`,
    `Dear ${formattedName}, your appointment request for ${serviceTitle} with ${doctor} is PENDING for ${when}.`,
    "",
    "Our team will confirm your slot shortly.",
    smsLocationLine(),
    "",
    "View visit details:",
    `${baseUrl}/dashboard`,
    "",
    `Helpline: ${CLINIC.phone}`,
  ].join("\n");
}

/** Builds the production SMS from appointment payload data. */
export function buildAppointmentSms(data: AppointmentSmsData): string {
  return buildAppointmentSmsText({
    patientName: data.patientName,
    serviceTitle: data.serviceName,
    doctorName: data.doctorName,
    appointmentDate: formatSmsAppointmentDate(data.appointmentDate),
    appointmentTime: formatSmsAppointmentTime(data.appointmentDate),
    status: data.status,
  });
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

  const firstName = formatSmsPatientName(data.patientName).split(/\s+/)[0] || "";
  const message = buildAppointmentSms(data).slice(0, 621);
  const body = new URLSearchParams({
    user_id: config.userId,
    api_key: config.apiKey,
    sender_id: config.senderId,
    to,
    message,
  });
  if (firstName && firstName !== "Valued") body.set("contact_fname", firstName);

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
