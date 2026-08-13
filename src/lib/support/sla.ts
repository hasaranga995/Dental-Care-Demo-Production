import type { SupportTicketPriority, SupportTicketStatus } from "@/db/schema";

export interface SupportSlaDefinition {
  priority: SupportTicketPriority;
  label: string;
  emoji: string;
  description: string;
  examples: string[];
  /** Calendar minutes from creation until first vendor response is due. */
  responseMinutes: number;
  /** Calendar minutes from creation until target resolution. */
  resolutionMinutes: number;
  /** Whether the response clock runs outside clinic operating hours. */
  alwaysOn: boolean;
  responseLabel: string;
  resolutionLabel: string;
  hoursNote: string;
}

export const SUPPORT_SLA: Record<SupportTicketPriority, SupportSlaDefinition> = {
  blocker: {
    priority: "blocker",
    label: "Blocker",
    emoji: "🚨",
    description: "Total system outage / business-halting failure.",
    examples: [
      "WhatsApp bot unresponsive",
      "Web booking engine down",
      "VIP alerts failing across all channels during clinic hours",
    ],
    responseMinutes: 30,
    resolutionMinutes: 3 * 60,
    alwaysOn: true,
    responseLabel: "< 30 minutes",
    resolutionLabel: "< 3 hours",
    hoursNote: "24/7 Emergency",
  },
  critical: {
    priority: "critical",
    label: "Critical",
    emoji: "⚠️",
    description: "Major feature degraded / operational impact.",
    examples: [
      "Web chat offline while WhatsApp still works",
      "Admin panel loading errors",
      "VIP alerts failing for specific numbers",
      "AI assistant giving incorrect pricing or doctor schedules",
    ],
    responseMinutes: 2 * 60,
    resolutionMinutes: 8 * 60,
    alwaysOn: false,
    responseLabel: "< 2 hours",
    resolutionLabel: "< 8 hours",
    hoursNote: "Operating Hours",
  },
  minor: {
    priority: "minor",
    label: "Minor",
    emoji: "ℹ️",
    description: "Non-blocking bug / system tweak / guidance.",
    examples: [
      "Minor UI alignment issues",
      "AI prompt greeting adjustments",
      "Adding new staff phones to the VIP desk",
      "General operational questions or staff guidance",
    ],
    responseMinutes: 8 * 60,
    resolutionMinutes: 24 * 60,
    alwaysOn: false,
    responseLabel: "< 8 hours",
    resolutionLabel: "< 24 hours",
    hoursNote: "Operating Hours",
  },
};

export const SUPPORT_CATEGORIES = [
  { value: "whatsapp", label: "WhatsApp bot" },
  { value: "booking", label: "Web booking" },
  { value: "vip_alerts", label: "VIP alerts" },
  { value: "ai", label: "AI front desk" },
  { value: "admin", label: "Admin panel" },
  { value: "other", label: "Other / general" },
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]["value"];

export const SUPPORT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_on_client: "Waiting on clinic",
  resolved: "Resolved",
  closed: "Closed",
};

export function computeSlaDeadlines(
  priority: SupportTicketPriority,
  from: Date = new Date()
): { slaResponseDueAt: Date; slaResolutionDueAt: Date } {
  const sla = SUPPORT_SLA[priority];
  return {
    slaResponseDueAt: new Date(from.getTime() + sla.responseMinutes * 60_000),
    slaResolutionDueAt: new Date(from.getTime() + sla.resolutionMinutes * 60_000),
  };
}

export type SlaClockState = "ok" | "due_soon" | "breached" | "met";

export function evaluateSlaClock(input: {
  dueAt: Date;
  metAt: Date | null | undefined;
  now?: Date;
}): { state: SlaClockState; minutesRemaining: number } {
  const now = input.now ?? new Date();
  if (input.metAt) {
    return { state: "met", minutesRemaining: 0 };
  }

  const minutesRemaining = Math.round((input.dueAt.getTime() - now.getTime()) / 60_000);
  if (minutesRemaining < 0) return { state: "breached", minutesRemaining };
  if (minutesRemaining <= 30) return { state: "due_soon", minutesRemaining };
  return { state: "ok", minutesRemaining };
}

export function formatSlaCountdown(minutesRemaining: number, state: SlaClockState): string {
  if (state === "met") return "Met";
  const abs = Math.abs(minutesRemaining);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  const body = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return state === "breached" ? `${body} overdue` : `${body} left`;
}

export function buildTicketReference(seq: number, at: Date = new Date()): string {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, "0");
  const d = String(at.getDate()).padStart(2, "0");
  return `DC-${y}${m}${d}-${String(seq).padStart(4, "0")}`;
}
