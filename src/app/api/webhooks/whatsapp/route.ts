import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CLINIC } from "@/lib/clinic-config";
import { isWhatsAppCloudConfigured, markWhatsAppRead, sendWhatsAppText } from "@/lib/whatsapp/client";
import { getWhatsAppVerifyToken } from "@/lib/whatsapp/config";
import { extractIncomingText, replyAsWhatsAppReceptionist } from "@/lib/whatsapp/engine";
import {
  getPendingWhatsAppSend,
  hasSeenWhatsAppMessage,
  markWhatsAppMessageSeen,
  setPendingWhatsAppSend,
} from "@/lib/whatsapp/session";
import { handleStaffMessage, shouldRouteToStaffBot } from "@/lib/whatsapp/staff";
import type { WhatsAppIncomingMessage, WhatsAppWebhookPayload } from "@/lib/whatsapp/types";

export const maxDuration = 60;

function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || secret.includes("xxxxxxxx")) return true;
  if (!header?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = header.slice("sha256=".length);
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(received, "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const expected = getWhatsAppVerifyToken();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.json({ error: "Verification failed." }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  console.log(
    `[whatsapp webhook] POST bytes=${rawBody.length} signature=${Boolean(signature)} ua=${req.headers.get("user-agent") ?? "unknown"}`
  );

  if (!verifySignature(rawBody, signature)) {
    console.warn("[whatsapp webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!isWhatsAppCloudConfigured()) {
    console.warn("[whatsapp webhook] Cloud API env vars are not set; ignoring inbound message.");
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Keep each message paired with the number it arrived on — that's how a
  // dedicated back-office line is told apart from the patient front desk.
  const messages: Array<{ message: WhatsAppIncomingMessage; phoneNumberId: string | null }> =
    payload.entry?.flatMap((entry) =>
      entry.changes?.flatMap((change) =>
        (change.value?.messages ?? []).map((message) => ({
          message,
          phoneNumberId: change.value?.metadata?.phone_number_id ?? null,
        }))
      ) ?? []
    ) ?? [];

  console.log(
    `[whatsapp webhook] object=${payload.object ?? "none"} messages=${messages.length} types=${messages.map((m) => m.message.type ?? "?").join(",") || "none"}`
  );

  for (const { message, phoneNumberId } of messages) {
    if (!message?.from || !message.id) continue;

    if (await hasSeenWhatsAppMessage(message.from, message.id)) {
      const pending = await getPendingWhatsAppSend(message.from);
      if (pending?.text) {
        try {
          await sendWhatsAppText(message.from, pending.text);
          await setPendingWhatsAppSend(message.from, null);
          console.log(`[whatsapp webhook] resent pending reply to ${message.from}`);
        } catch (error) {
          console.error("[whatsapp webhook] pending resend failed:", error);
        }
      } else {
        console.log(`[whatsapp webhook] skip duplicate ${message.id}`);
      }
      continue;
    }

    await markWhatsAppMessageSeen(message.from, message.id);

    const incomingText = extractIncomingText(message);

    if (await shouldRouteToStaffBot({ phoneNumberId, from: message.from, text: incomingText })) {
      try {
        await markWhatsAppRead(message.id, "staff");
      } catch {
        // Non-fatal.
      }

      const staffReply = await handleStaffMessage({ from: message.from, text: incomingText });
      if (staffReply) {
        try {
          await sendWhatsAppText(message.from, staffReply, "staff");
          console.log(`[whatsapp webhook] staff desk replied to ${message.from}`);
        } catch (error) {
          console.error("[whatsapp webhook] staff send failed:", error);
        }
      }
      continue;
    }

    const leftover = await getPendingWhatsAppSend(message.from);
    if (leftover?.text && leftover.messageId !== message.id) {
      try {
        await sendWhatsAppText(message.from, leftover.text);
        await setPendingWhatsAppSend(message.from, null);
        console.log(`[whatsapp webhook] flushed leftover reply to ${message.from}`);
      } catch (error) {
        console.error("[whatsapp webhook] leftover send failed:", error);
      }
    }

    try {
      await markWhatsAppRead(message.id);
    } catch {
      // Non-fatal.
    }

    const text = incomingText;
    console.log(
      `[whatsapp webhook] from=${message.from} type=${message.type ?? "?"} text=${text ? "yes" : "no"}`
    );
    const reply = text
      ? (await replyAsWhatsAppReceptionist({ from: message.from, text })).reply
      : `I can help fastest if you type your question here. For X-rays or documents, email ${CLINIC.email} or bring them to the clinic.`;

    if (reply) {
      try {
        await sendWhatsAppText(message.from, reply);
        await setPendingWhatsAppSend(message.from, null);
        console.log(`[whatsapp webhook] replied to ${message.from}`);
      } catch (error) {
        await setPendingWhatsAppSend(message.from, { messageId: message.id, text: reply });
        console.error("[whatsapp webhook] send failed:", error);
      }
    }
  }

  return NextResponse.json({ ok: true, received: messages.length });
}
