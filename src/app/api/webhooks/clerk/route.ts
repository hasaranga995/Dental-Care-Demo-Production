import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { phoneIdentity } from "@/lib/vip/phone";

export async function POST(req: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(req);
  } catch (error) {
    console.error("[clerk webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "user.created": {
        const { id, email_addresses, first_name, last_name, phone_numbers, public_metadata } =
          event.data;
        const email = email_addresses?.[0]?.email_address ?? `${id}@no-email.local`;
        const name = [first_name, last_name].filter(Boolean).join(" ").trim() || email.split("@")[0];
        const role = (public_metadata?.role as "patient" | "doctor" | "admin" | undefined) ?? "patient";
        const phone = phone_numbers?.[0]?.phone_number ?? null;

        await db
          .insert(users)
          .values({
            clerkId: id,
            email,
            name,
            role,
            phone,
            ...phoneIdentity(phone),
          })
          .onConflictDoNothing({ target: users.clerkId });
        break;
      }
      case "user.updated": {
        const { id, email_addresses, first_name, last_name, phone_numbers } = event.data;
        const email = email_addresses?.[0]?.email_address;
        const name = [first_name, last_name].filter(Boolean).join(" ").trim();
        const phone = phone_numbers?.[0]?.phone_number ?? null;

        await db
          .update(users)
          .set({
            ...(email ? { email } : {}),
            ...(name ? { name } : {}),
            phone,
            ...phoneIdentity(phone),
          })
          .where(eq(users.clerkId, id));
        break;
      }
      case "user.deleted": {
        if (event.data.id) {
          await db.delete(users).where(eq(users.clerkId, event.data.id));
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[clerk webhook] Failed to process event:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
