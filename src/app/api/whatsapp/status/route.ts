import { NextResponse } from "next/server";
import { getWhatsAppStatus } from "@/lib/whatsapp/config";

export async function GET() {
  return NextResponse.json(getWhatsAppStatus());
}
