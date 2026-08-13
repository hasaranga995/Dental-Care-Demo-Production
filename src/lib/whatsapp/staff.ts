import "server-only";

import { CLINIC } from "@/lib/clinic-config";
import {
  getUpcomingVipAppointments,
  getVipAppointmentsForDay,
  type AppointmentWithDetails,
} from "@/lib/data/appointments";
import { tierLabel } from "@/lib/vip/identity";
import { formatPhoneDisplay } from "@/lib/vip/phone";
import {
  findStaffSubscriberByPhone,
  isPreapprovedStaffPhone,
  StaffSubscribeError,
  subscribeStaffMember,
  unsubscribeStaffMember,
} from "@/lib/vip/subscribers";
import { getStaffChannelConfig } from "@/lib/whatsapp/config";

/**
 * The back-office VIP desk bot.
 *
 * Deliberately keyword-driven rather than LLM-backed: staff commands must be
 * predictable, instant, and free. The only intelligence here is knowing who is
 * allowed to ask.
 */

type StaffCommand =
  | { kind: "join"; code: string; name: string }
  | { kind: "stop" }
  | { kind: "status" }
  | { kind: "today" }
  | { kind: "next" }
  | { kind: "help" };

const JOIN_PREFIXES = ["vip join", "join", "subscribe", "vip subscribe"];
const STOP_WORDS = ["stop", "unsubscribe", "vip stop", "vip unsubscribe"];
const STATUS_WORDS = ["status", "vip status"];
const TODAY_WORDS = ["today", "vip today", "arrivals"];
const NEXT_WORDS = ["next", "upcoming", "vip next", "vip upcoming"];
const HELP_WORDS = ["help", "vip help", "commands", "vip"];

export function parseStaffCommand(rawText: string): StaffCommand | null {
  const text = rawText.trim().replace(/\s+/g, " ");
  const lower = text.toLowerCase();

  for (const prefix of JOIN_PREFIXES) {
    if (lower === prefix || lower.startsWith(`${prefix} `)) {
      const rest = text.slice(prefix.length).trim();
      const [code, ...nameParts] = rest.split(" ");
      return { kind: "join", code: (code ?? "").toUpperCase(), name: nameParts.join(" ").trim() };
    }
  }

  if (STOP_WORDS.includes(lower)) return { kind: "stop" };
  if (STATUS_WORDS.includes(lower)) return { kind: "status" };
  if (TODAY_WORDS.includes(lower)) return { kind: "today" };
  if (NEXT_WORDS.includes(lower)) return { kind: "next" };
  if (HELP_WORDS.includes(lower)) return { kind: "help" };

  return null;
}

/**
 * Decides whether an inbound message belongs to the staff bot or the patient
 * receptionist.
 *
 * With a dedicated staff number the split is physical — patients can never
 * reach it. Sharing one number we only divert recognized commands from
 * pre-approved staff phones, so a patient typing "help" still reaches Amaya.
 */
export async function shouldRouteToStaffBot(input: {
  phoneNumberId?: string | null;
  from: string;
  text: string | null;
}): Promise<boolean> {
  const staff = getStaffChannelConfig();

  if (staff.hasDedicatedNumber) {
    return input.phoneNumberId === staff.phoneNumberId;
  }

  if (!input.text) return false;
  const command = parseStaffCommand(input.text);
  if (!command) return false;

  // Only pre-approved staff numbers are diverted to the VIP desk — including
  // JOIN attempts. An unknown phone typing JOIN stays with the receptionist
  // (and gets a normal patient reply), so the public number never leaks that
  // a staff join command even exists.
  return isPreapprovedStaffPhone(input.from);
}

function helpText(): string {
  const staff = getStaffChannelConfig();
  return [
    `*${CLINIC.name} — VIP Desk*`,
    "",
    "Commands:",
    `• *JOIN ${staff.joinCode} <your name>* — activate alerts (your number must already be on the staff list)`,
    "• *TODAY* — VIP arrivals scheduled for today",
    "• *NEXT* — the next 5 VIP appointments",
    "• *STATUS* — check your subscription",
    "• *STOP* — stop receiving alerts",
    "",
    "This line is for hospital staff only.",
  ].join("\n");
}

function formatAppointmentLine(appointment: AppointmentWithDetails): string {
  const time = appointment.appointmentDate.toLocaleTimeString("en-GB", {
    timeZone: CLINIC.timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const day = appointment.appointmentDate.toLocaleDateString("en-GB", {
    timeZone: CLINIC.timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return [
    `• *${time}* — ${appointment.patientName} (${tierLabel(appointment.patientTier)})`,
    `   ${appointment.serviceName} with Dr. ${appointment.doctorName}`,
    `   ${day} · ${formatPhoneDisplay(appointment.patientPhone)} · ${appointment.status}`,
  ].join("\n");
}

async function todayText(): Promise<string> {
  const rows = await getVipAppointmentsForDay();
  if (rows.length === 0) {
    return "No VIP arrivals scheduled for today. I'll message you the moment one books.";
  }
  return [
    `*VIP arrivals today* (${rows.length})`,
    "",
    rows.map(formatAppointmentLine).join("\n\n"),
  ].join("\n");
}

async function nextText(): Promise<string> {
  const rows = await getUpcomingVipAppointments(5);
  if (rows.length === 0) {
    return "No upcoming VIP appointments on the books right now.";
  }
  return [`*Next ${rows.length} VIP appointments*`, "", rows.map(formatAppointmentLine).join("\n\n")].join("\n");
}

/**
 * Handles one inbound staff message. Returns the reply to send back, or an
 * empty string when nothing should be sent.
 */
export async function handleStaffMessage(input: {
  from: string;
  text: string | null;
}): Promise<string> {
  const staff = getStaffChannelConfig();
  const text = input.text?.trim() ?? "";

  if (!text) return helpText();

  const command = parseStaffCommand(text);
  if (!command) return helpText();

  switch (command.kind) {
    case "join": {
      if (!command.code || command.code !== staff.joinCode) {
        return "That join code isn't right. Please check with the administrator and try again:\n\n*JOIN <code> <your name>*";
      }

      try {
        const result = await subscribeStaffMember({
          phone: input.from,
          name: command.name,
          source: "whatsapp",
        });

        const who = result.subscriber.name ? `, ${result.subscriber.name}` : "";
        if (!result.created && !result.reactivated) {
          return `You're already on the VIP desk list${who}. Send *STOP* any time to opt out.`;
        }

        return [
          `✅ You're subscribed to ${CLINIC.name} VIP alerts${who}.`,
          "",
          "You'll get a message the moment a VIP books through WhatsApp, the website, or reception.",
          "",
          "Send *TODAY* for today's VIP arrivals, or *STOP* to opt out.",
        ].join("\n");
      } catch (error) {
        if (error instanceof StaffSubscribeError && error.code === "not_preapproved") {
          return "This number isn't on the hospital staff list. Ask an administrator to add you under *VIP Desk → Staff Numbers*, then send JOIN again.";
        }
        console.error("[whatsapp/staff] subscribe failed:", error);
        return "I couldn't add you just now. Please try again in a moment.";
      }
    }

    case "stop": {
      const removed = await unsubscribeStaffMember(input.from);
      return removed
        ? "You've been removed from VIP alerts. Send *JOIN <code>* to resubscribe (your number stays on the staff list)."
        : "You're not currently subscribed to VIP alerts.";
    }

    case "status": {
      const subscriber = await findStaffSubscriberByPhone(input.from);
      if (!subscriber) {
        return "This number isn't on the hospital staff list. Ask an administrator to add you under VIP Desk first.";
      }
      if (!subscriber.isActive) {
        return `Your number is pre-approved, but alerts are not active yet. Send *JOIN ${staff.joinCode} <your name>* to start receiving them.`;
      }
      const last = subscriber.lastNotifiedAt
        ? subscriber.lastNotifiedAt.toLocaleString("en-GB", { timeZone: CLINIC.timeZone })
        : "none yet";
      return [
        "*VIP alerts: active* ✅",
        `Name: ${subscriber.name || "not set"}`,
        `Role: ${subscriber.role}`,
        `Last alert: ${last}`,
      ].join("\n");
    }

    case "today":
      return todayText();

    case "next":
      return nextText();

    case "help":
    default:
      return helpText();
  }
}
