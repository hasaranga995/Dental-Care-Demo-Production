import "server-only";

import { generateText, stepCountIs, type ModelMessage } from "ai";
import { google } from "@ai-sdk/google";
import { getActiveKnowledgeDoc } from "@/actions/knowledge";
import { buildWhatsAppReceptionistPrompt } from "@/lib/chat/knowledge";
import { createDentalChatTools } from "@/lib/chat/tools";
import { CLINIC } from "@/lib/clinic-config";
import { rateLimit } from "@/lib/redis";
import { resolveWhatsAppIdentity } from "@/lib/vip/identity";
import {
  appendWhatsAppTurn,
  clearWhatsAppSession,
  getWhatsAppSession,
} from "@/lib/whatsapp/session";

const FALLBACK = `Sorry, something went wrong on my side just now. Please send that again, or call us on ${CLINIC.phone}.`;

function ensureGeminiKey() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

function toWhatsAppText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, "").trim())
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

function confirmationFromBooking(result: { text?: string; steps?: unknown }): string | null {
  const blob = JSON.stringify(result.steps ?? []);
  if (!blob.includes('"success":true')) return null;

  let parsed: { success?: boolean; message?: string; appointmentId?: string } | null = null;
  try {
    const steps = result.steps as Array<{
      toolResults?: Array<{ toolName?: string; output?: { success?: boolean; message?: string; appointmentId?: string } }>;
    }>;
    for (const step of steps ?? []) {
      for (const tool of step.toolResults ?? []) {
        if (tool.toolName === "bookAppointment" && tool.output?.success) {
          parsed = tool.output;
        }
      }
    }
  } catch {
    parsed = null;
  }

  if (!parsed?.success) {
    if (blob.includes("whatsappConfirmation")) {
      try {
        const match = blob.match(/"whatsappConfirmation":"((?:\\.|[^"\\])*)"/);
        if (match?.[1]) return match[1].replace(/\\n/g, "\n");
      } catch {
        // fall through
      }
    }
    return null;
  }
  const existing = (result.text ?? "").toLowerCase();
  if (existing.includes("appointment") && (existing.includes("received") || existing.includes("pending") || existing.includes("diary"))) {
    return null;
  }
  return (
    parsed.message ||
    "Your appointment request is in our diary as pending. You'll get an email shortly, and the team will confirm. Please arrive 10 minutes early."
  );
}

export async function replyAsWhatsAppReceptionist(input: {
  from: string;
  text: string;
  reset?: boolean;
}): Promise<{ reply: string; error?: string }> {
  const from = input.from.replace(/\D/g, "") || "unknown";
  const text = input.text.trim();

  if (input.reset) {
    await clearWhatsAppSession(from);
  }

  if (!text) {
    return { reply: "" };
  }

  if (!ensureGeminiKey()) {
    return {
      reply: `The WhatsApp desk is not connected yet. Please call us on ${CLINIC.phone}.`,
      error: "missing_gemini_key",
    };
  }

  const { success: withinLimit } = await rateLimit(`whatsapp:${from}`, 40, 600);
  if (!withinLimit) {
    return {
      reply: `You've sent quite a few messages — give me a minute and I'll be right with you, or call ${CLINIC.phone}.`,
    };
  }

  const session = await getWhatsAppSession(from);
  const history: ModelMessage[] = session.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  try {
    // The WhatsApp sender number is verified by Meta, so a match here is a
    // trustworthy identity — good enough to unlock concierge handling.
    const [activeDoc, vip] = await Promise.all([
      getActiveKnowledgeDoc(),
      resolveWhatsAppIdentity(from),
    ]);

    if (vip.recognized) {
      console.log(`[whatsapp] recognized ${vip.tier} patient ${vip.patientId}`);
    }

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: buildWhatsAppReceptionistPrompt(from, activeDoc?.extractedText, vip),
      messages: [...history, { role: "user", content: text }],
      tools: createDentalChatTools({ channel: "whatsapp", patientPhone: from, vip }),
      stopWhen: stepCountIs(8),
      temperature: 0.15,
    });

    const bookedNote = confirmationFromBooking(result);
    const reply =
      toWhatsAppText(bookedNote || result.text) ||
      "Give me a moment — could you repeat that so I can help properly?";

    await appendWhatsAppTurn(from, text, reply);
    return { reply };
  } catch (error) {
    console.error("[whatsapp] receptionist reply failed:", error);
    return { reply: FALLBACK, error: "generation_failed" };
  }
}

export function extractIncomingText(message: {
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
}): string | null {
  if (message.type === "text") return message.text?.body?.trim() || null;
  if (message.type === "button") return message.button?.text?.trim() || null;
  if (message.type === "interactive") {
    return (
      message.interactive?.button_reply?.title?.trim() ||
      message.interactive?.list_reply?.title?.trim() ||
      null
    );
  }
  return null;
}
