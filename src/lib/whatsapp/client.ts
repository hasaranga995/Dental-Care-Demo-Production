import "server-only";

import {
  getStaffChannelConfig,
  isWhatsAppCloudConfigured,
  WHATSAPP_GRAPH_VERSION,
} from "@/lib/whatsapp/config";

export { isWhatsAppCloudConfigured };

const MAX_WHATSAPP_CHARS = 4000;

/**
 * Which WhatsApp sender to use. `patient` is the public front-desk number;
 * `staff` is the back-office alert number (falls back to the patient sender
 * when no dedicated staff number is configured).
 */
export type WhatsAppSender = "patient" | "staff";

/** Meta's "outside the 24-hour customer service window" error. */
export const OUTSIDE_WINDOW_ERROR_CODE = 131047;

function graphUrl(path: string) {
  return `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${path}`;
}

function resolveSender(sender: WhatsAppSender): { phoneNumberId: string; token: string } {
  const patientPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "";
  const patientToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? "";

  if (sender === "staff") {
    const staff = getStaffChannelConfig();
    const phoneNumberId = staff.phoneNumberId ?? patientPhoneNumberId;
    const token = staff.accessToken ?? patientToken;
    if (!phoneNumberId) throw new Error("No WhatsApp phone number id configured for staff alerts.");
    if (!token) throw new Error("No WhatsApp access token configured for staff alerts.");
    return { phoneNumberId, token };
  }

  if (!patientPhoneNumberId) throw new Error("WHATSAPP_PHONE_NUMBER_ID is not configured.");
  if (!patientToken) throw new Error("WHATSAPP_ACCESS_TOKEN is not configured.");
  return { phoneNumberId: patientPhoneNumberId, token: patientToken };
}

export class WhatsAppSendError extends Error {
  readonly status: number;
  readonly code: number | null;

  constructor(message: string, status: number, code: number | null) {
    super(message);
    this.name = "WhatsAppSendError";
    this.status = status;
    this.code = code;
  }

  get isOutsideWindow(): boolean {
    return this.code === OUTSIDE_WINDOW_ERROR_CODE;
  }
}

async function graphPost(
  path: string,
  body: Record<string, unknown>,
  sender: WhatsAppSender = "patient"
) {
  const { token } = resolveSender(sender);

  const response = await fetch(graphUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    let code: number | null = null;
    try {
      code = (JSON.parse(detail) as { error?: { code?: number } }).error?.code ?? null;
    } catch {
      code = null;
    }
    throw new WhatsAppSendError(
      `WhatsApp Graph error ${response.status}: ${detail.slice(0, 400)}`,
      response.status,
      code
    );
  }

  return response.json().catch(() => ({}));
}

export function splitWhatsAppText(text: string): string[] {
  const trimmed = text.replace(/\\n/g, "\n").trim();
  if (!trimmed) return [];
  if (trimmed.length <= MAX_WHATSAPP_CHARS) return [trimmed];

  const chunks: string[] = [];
  let remaining = trimmed;
  while (remaining.length > MAX_WHATSAPP_CHARS) {
    const window = remaining.slice(0, MAX_WHATSAPP_CHARS);
    const breakAt = Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"), window.lastIndexOf(" "));
    const cut = breakAt > 200 ? breakAt : MAX_WHATSAPP_CHARS;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function sendWhatsAppText(
  to: string,
  text: string,
  sender: WhatsAppSender = "patient"
) {
  const { phoneNumberId } = resolveSender(sender);

  const parts = splitWhatsAppText(text);
  for (const body of parts) {
    await graphPost(
      `${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body },
      },
      sender
    );
  }
}

/**
 * Sends an approved template. Templates are the only way to reach a WhatsApp
 * user outside the 24-hour service window, which is exactly the situation for
 * a VIP alert landing on a staff phone that hasn't messaged the bot today.
 */
export async function sendWhatsAppTemplate(
  to: string,
  options: {
    name: string;
    language?: string;
    bodyParams?: string[];
    sender?: WhatsAppSender;
  }
) {
  const sender = options.sender ?? "staff";
  const { phoneNumberId } = resolveSender(sender);
  const bodyParams = options.bodyParams ?? [];

  await graphPost(
    `${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: options.name,
        language: { code: options.language ?? "en" },
        ...(bodyParams.length > 0
          ? {
              components: [
                {
                  type: "body",
                  parameters: bodyParams.map((text) => ({ type: "text", text })),
                },
              ],
            }
          : {}),
      },
    },
    sender
  );
}

export async function markWhatsAppRead(messageId: string, sender: WhatsAppSender = "patient") {
  if (!messageId) return;

  try {
    const { phoneNumberId } = resolveSender(sender);
    await graphPost(
      `${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: { type: "text" },
      },
      sender
    );
  } catch (error) {
    console.warn("[whatsapp] mark read / typing failed:", error);
  }
}
