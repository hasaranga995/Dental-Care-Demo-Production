import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { processAppointmentConfirmation } from "@/lib/notifications";
import type { QstashJobType } from "@/lib/qstash";
import { processVipAlert } from "@/lib/vip/alerts";

async function handler(req: Request) {
  let payload: { appointmentId?: string; type?: QstashJobType; sms?: boolean };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { appointmentId } = payload;
  if (!appointmentId) {
    return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
  }

  // Payloads without a `type` predate the VIP queue and are confirmation emails.
  if (payload.type === "vip_alert") {
    const result = await processVipAlert(appointmentId);
    return NextResponse.json({ received: true, ...result });
  }

  const { found, emailSent, smsSent } = await processAppointmentConfirmation(appointmentId, {
    sms: payload.sms,
  });
  if (!found) {
    // Don't retry forever on a bad id — acknowledge so QStash stops redelivering.
    return NextResponse.json({ error: "Appointment not found" }, { status: 200 });
  }

  return NextResponse.json({ received: true, emailSent, smsSent });
}

const isQstashConfigured = Boolean(
  process.env.QSTASH_CURRENT_SIGNING_KEY &&
    !process.env.QSTASH_CURRENT_SIGNING_KEY.includes("xxxxxxxx")
);

// Only enforce QStash's signature verification when real signing keys are
// configured — this keeps local development working end-to-end without
// requiring Upstash credentials (see `enqueueAppointmentConfirmation`'s
// unsigned fallback in `src/lib/qstash.ts`).
export const POST = isQstashConfigured ? verifySignatureAppRouter(handler) : handler;
