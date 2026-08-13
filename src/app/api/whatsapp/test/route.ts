import { NextRequest, NextResponse } from "next/server";
import { replyAsWhatsAppReceptionist } from "@/lib/whatsapp/engine";
import { handleStaffMessage, shouldRouteToStaffBot } from "@/lib/whatsapp/staff";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { from?: string; text?: string; reset?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const from = (body.from ?? "94771234567").toString().replace(/\D/g, "") || "94771234567";
  const text = (body.text ?? "").toString();
  const reset = Boolean(body.reset);

  if (!text.trim() && !reset) {
    return NextResponse.json({ error: "Message text is required." }, { status: 400 });
  }

  // Mirror the live webhook's routing so the lab can exercise the back-office
  // VIP desk (JOIN / TODAY / STATUS / STOP) as well as the patient front desk.
  if (await shouldRouteToStaffBot({ phoneNumberId: null, from, text })) {
    const reply = await handleStaffMessage({ from, text });
    return NextResponse.json({ reply, error: null, channel: "staff" });
  }

  const result = await replyAsWhatsAppReceptionist({ from, text, reset });
  return NextResponse.json({ reply: result.reply, error: result.error ?? null, channel: "patient" });
}
