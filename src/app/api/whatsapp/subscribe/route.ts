import { NextRequest, NextResponse } from "next/server";
import { WHATSAPP_GRAPH_VERSION } from "@/lib/whatsapp/config";

export async function POST(req: NextRequest) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing WHATSAPP_ACCESS_TOKEN." }, { status: 400 });
  }

  let body: { wabaId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const wabaId = (body.wabaId ?? process.env.WHATSAPP_WABA_ID ?? "").replace(/\D/g, "");
  if (!wabaId) {
    return NextResponse.json(
      { error: "Paste the WhatsApp Business Account ID from API Setup." },
      { status: 400 }
    );
  }

  const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${wabaId}/subscribed_apps`;
  const subscribe = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const subscribeText = await subscribe.text();

  const listed = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listedText = await listed.text();

  return NextResponse.json({
    wabaId,
    subscribeStatus: subscribe.status,
    subscribeBody: safeJson(subscribeText),
    apps: safeJson(listedText),
  });
}

function safeJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
